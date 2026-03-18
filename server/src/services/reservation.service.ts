import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import {
  markets,
  marketDays,
  boothReservations,
  marketVendors,
  vendors,
} from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";
import { getIO } from "../config/socket.js";
import { type MapData } from "./market.service.js";

// PostgreSQL driver errors carry the violation code at `.code` on a plain Error.
// NodeJS.ErrnoException is for filesystem errors and is the wrong type here.
interface PgError extends Error { code?: string; }

// ─── Market Days ─────────────────────────────────────────────

export async function createMarketDay(
  marketId: string,
  data: { marketDate: string; notes?: string }
) {
  try {
    const [day] = await db
      .insert(marketDays)
      .values({ marketId, marketDate: data.marketDate, notes: data.notes ?? null })
      .returning();
    return day;
  } catch (err) {
    if ((err as PgError).code === "23505") {
      throw new AppError(409, "A market day already exists for that date");
    }
    throw err;
  }
}

export async function listMarketDays(marketId: string) {
  return db
    .select()
    .from(marketDays)
    .where(eq(marketDays.marketId, marketId))
    .orderBy(asc(marketDays.marketDate));
}

export async function deleteMarketDay(marketId: string, dayId: number) {
  const cancelledReservations = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(marketDays)
      .where(and(eq(marketDays.id, dayId), eq(marketDays.marketId, marketId)))
      .limit(1);

    if (!existing) {
      throw new AppError(404, "Market day not found");
    }

    // Fetch confirmed reservations before cancelling so we can emit socket
    // events after the transaction commits.
    const affected = await tx
      .select({ id: boothReservations.id, boothId: boothReservations.boothId })
      .from(boothReservations)
      .where(
        and(
          eq(boothReservations.marketDayId, dayId),
          eq(boothReservations.status, "confirmed")
        )
      );

    // Soft-cancel all confirmed reservations for this day first, then delete
    // the day. Both steps run in a single transaction so no new reservation
    // can slip through between the cancel and the delete.
    // Note: only 'confirmed' reservations are cancelled here. If a 'pending'
    // status is ever added in future, this predicate must be updated to include it.
    await tx
      .update(boothReservations)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(
        and(
          eq(boothReservations.marketDayId, dayId),
          eq(boothReservations.status, "confirmed")
        )
      );

    // Include marketId in the DELETE predicate for defence-in-depth,
    // consistent with the cancelReservation pattern.
    await tx.delete(marketDays).where(
      and(eq(marketDays.id, dayId), eq(marketDays.marketId, marketId))
    );

    return affected;
  });

  // Emit booth:released for every reservation cancelled by the day deletion
  // so clients watching the map see the booths become available in real time.
  // Non-critical: failures here don't affect the committed transaction.
  try {
    const io = getIO();
    for (const r of cancelledReservations) {
      io.to(`market:${marketId}`).emit("booth:released", {
        marketId,
        boothId: r.boothId,
        marketDayId: dayId,
        reservationId: r.id,
      });
    }
  } catch {
    // Socket.io not initialized (e.g. test environment).
  }
}

// ─── Availability ─────────────────────────────────────────────

export async function getBoothAvailability(marketId: string, marketDayId: number) {
  // Verify the day belongs to this market so a mismatched pair returns 404
  // rather than a misleading empty array.
  const [day] = await db
    .select({ id: marketDays.id })
    .from(marketDays)
    .where(and(eq(marketDays.id, marketDayId), eq(marketDays.marketId, marketId)))
    .limit(1);

  if (!day) {
    throw new AppError(404, "Market day not found");
  }

  const reservations = await db
    .select({
      boothId: boothReservations.boothId,
      status: boothReservations.status,
    })
    .from(boothReservations)
    .where(
      and(
        eq(boothReservations.marketId, marketId),
        eq(boothReservations.marketDayId, marketDayId),
        eq(boothReservations.status, "confirmed")
      )
    );

  return reservations.map((r) => ({ boothId: r.boothId, status: "reserved" as const }));
}

// ─── Reservations ─────────────────────────────────────────────

export async function createReservation(
  vendorId: string,
  marketId: string,
  data: { boothId: string; marketDayId: number }
) {
  // All validation + INSERT run inside a single transaction so concurrent
  // mutations (day deleted, booth removed from floor plan, vendor status
  // changed) are observed atomically with the INSERT.
  //
  // Note: READ COMMITTED isolation does NOT prevent two concurrent requests
  // from both passing the "no existing reservation" check before either
  // commits. The partial unique index (status = 'confirmed') is the true
  // last-resort guard; it causes the second INSERT to throw 23505, which
  // is caught below and returned as a 409.
  try {
    const reservation = await db.transaction(async (tx) => {
      // Verify marketDayId belongs to marketId
      const [day] = await tx
        .select()
        .from(marketDays)
        .where(and(eq(marketDays.id, data.marketDayId), eq(marketDays.marketId, marketId)))
        .limit(1);

      if (!day) {
        throw new AppError(404, "Market day not found for this market");
      }

      // Prevent reservations for past market dates. Drizzle returns `date`
      // columns as strings in most configs but some pg setups return Date
      // objects — coerce explicitly before comparing.
      // Note: todayUTC derivation mirrors the logic in createMarketDaySchema
      // (validators/reservation.ts). Keep both in sync if the comparison changes.
      const todayUTC = new Date().toISOString().slice(0, 10);
      const marketDateStr =
        typeof day.marketDate === "string"
          ? day.marketDate
          : (day.marketDate as Date).toISOString().slice(0, 10);
      if (marketDateStr < todayUTC) {
        throw new AppError(400, "Cannot reserve a booth for a past market day");
      }

      // Verify the boothId exists in the market's floor plan. A FOR SHARE
      // lock prevents a concurrent map update from removing the booth between
      // our read and the INSERT that follows.
      const [marketRow] = await tx
        .select({ mapData: markets.mapData })
        .from(markets)
        .where(eq(markets.id, marketId))
        .for("share")
        .limit(1);

      if (!marketRow) {
        throw new AppError(404, "Market not found");
      }

      const mapData = marketRow.mapData as MapData | null;
      if (!mapData?.booths || mapData.booths.length === 0) {
        throw new AppError(400, "This market has no floor plan configured");
      }
      if (!mapData.booths.some((b) => b.id === data.boothId)) {
        throw new AppError(400, "Booth not found in this market's floor plan");
      }

      // Verify vendor is approved in this market
      const [mv] = await tx
        .select()
        .from(marketVendors)
        .where(
          and(
            eq(marketVendors.vendorId, vendorId),
            eq(marketVendors.marketId, marketId),
            eq(marketVendors.status, "approved")
          )
        )
        .limit(1);

      if (!mv) {
        throw new AppError(403, "Vendor is not approved for this market");
      }

      const [inserted] = await tx
        .insert(boothReservations)
        .values({
          marketId,
          vendorId,
          boothId: data.boothId,
          marketDayId: data.marketDayId,
          status: "confirmed",
        })
        .returning();

      return inserted;
    });

    try {
      getIO()
        .to(`market:${marketId}`)
        .emit("booth:reserved", {
          marketId,
          boothId: data.boothId,
          marketDayId: data.marketDayId,
          vendorId,
          reservationId: reservation.id,
        });
    } catch {
      // Socket.io not initialized (e.g. test environment); reservation committed successfully.
    }

    return reservation;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as PgError).code === "23505") {
      throw new AppError(409, "Booth already reserved for that date");
    }
    throw err;
  }
}

export async function cancelReservation(
  reservationId: number,
  actorVendorId: string | null,
  actorIsManager: boolean,
  marketId: string
) {
  // SELECT and UPDATE run inside a single transaction so the ownership check
  // and the status mutation are atomic. marketId appears in both the SELECT
  // and the UPDATE predicates so the function is self-contained regardless of
  // call site invariants.
  const updated = await db.transaction(async (tx) => {
    const [reservation] = await tx
      .select()
      .from(boothReservations)
      .where(and(eq(boothReservations.id, reservationId), eq(boothReservations.marketId, marketId)))
      .limit(1);

    if (!reservation) {
      throw new AppError(404, "Reservation not found");
    }

    if (reservation.status !== "confirmed") {
      throw new AppError(409, "Reservation is already cancelled");
    }

    // Ownership check: vendor can only cancel their own reservation.
    // Return 404 (not 403) so callers cannot infer whether a reservation
    // belonging to another vendor exists at this id.
    if (!actorIsManager && reservation.vendorId !== actorVendorId) {
      throw new AppError(404, "Reservation not found");
    }

    // Include marketId and status = 'confirmed' in the UPDATE predicate so
    // that concurrent cancel requests cannot race past the ownership check,
    // and so this statement is independently correct without relying on the
    // SELECT above.
    const [row] = await tx
      .update(boothReservations)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(
        and(
          eq(boothReservations.id, reservationId),
          eq(boothReservations.marketId, marketId),
          eq(boothReservations.status, "confirmed")
        )
      )
      .returning();

    if (!row) {
      throw new AppError(409, "Reservation is already cancelled");
    }

    return row;
  });

  try {
    getIO()
      .to(`market:${marketId}`)
      .emit("booth:released", {
        marketId,
        boothId: updated.boothId,
        marketDayId: updated.marketDayId,
        reservationId,
      });
  } catch {
    // Socket.io not initialized (e.g. test environment); cancellation committed successfully.
  }

  return updated;
}

export async function listVendorReservations(
  vendorId: string,
  marketId: string,
  status?: "confirmed" | "cancelled",
  limit = 100,
  offset = 0
) {
  const whereClause =
    status !== undefined
      ? and(
          eq(boothReservations.vendorId, vendorId),
          eq(boothReservations.marketId, marketId),
          eq(boothReservations.status, status)
        )
      : and(
          eq(boothReservations.vendorId, vendorId),
          eq(boothReservations.marketId, marketId)
        );

  return db
    .select({
      id: boothReservations.id,
      boothId: boothReservations.boothId,
      marketDayId: boothReservations.marketDayId,
      status: boothReservations.status,
      reservedAt: boothReservations.reservedAt,
      cancelledAt: boothReservations.cancelledAt,
      marketDate: marketDays.marketDate,
      notes: marketDays.notes,
    })
    .from(boothReservations)
    .innerJoin(marketDays, eq(boothReservations.marketDayId, marketDays.id))
    .where(whereClause)
    .orderBy(desc(marketDays.marketDate))
    .limit(limit)
    .offset(offset);
}

export async function listAllReservations(
  marketId: string,
  marketDayId?: number,
  status?: "confirmed" | "cancelled",
  limit = 100,
  offset = 0
) {
  const conditions = [eq(boothReservations.marketId, marketId)];
  if (marketDayId !== undefined) {
    conditions.push(eq(boothReservations.marketDayId, marketDayId));
  }
  if (status !== undefined) {
    conditions.push(eq(boothReservations.status, status));
  }

  return db
    .select({
      id: boothReservations.id,
      boothId: boothReservations.boothId,
      marketDayId: boothReservations.marketDayId,
      vendorId: boothReservations.vendorId,
      vendorName: vendors.name,
      status: boothReservations.status,
      reservedAt: boothReservations.reservedAt,
      cancelledAt: boothReservations.cancelledAt,
      marketDate: marketDays.marketDate,
    })
    .from(boothReservations)
    .innerJoin(vendors, eq(boothReservations.vendorId, vendors.id))
    .innerJoin(marketDays, eq(boothReservations.marketDayId, marketDays.id))
    .where(and(...conditions))
    .orderBy(desc(marketDays.marketDate), asc(boothReservations.boothId))
    .limit(limit)
    .offset(offset);
}
