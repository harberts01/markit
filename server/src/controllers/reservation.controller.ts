import { Request, Response, NextFunction } from "express";
import * as reservationService from "../services/reservation.service.js";
import { getVendorByUserId } from "../services/vendor.service.js";
import { AppError } from "../middleware/errorHandler.js";

// ─── Helpers ──────────────────────────────────────────────────

async function requireVendor(userId: string) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor) throw new AppError(403, "Vendor profile required");
  return vendor;
}

function parseIntParam(value: string, name: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new AppError(400, `${name} must be a positive integer`);
  }
  return parsed;
}

function parseOffset(raw: unknown): number {
  const n = raw ? parseInt(raw as string, 10) : 0;
  if (isNaN(n) || n < 0) {
    throw new AppError(400, "offset must be a non-negative integer");
  }
  return n;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUUID(value: string | undefined, name: string): string {
  if (!value || !UUID_RE.test(value)) {
    throw new AppError(400, `${name} must be a valid UUID`);
  }
  return value;
}

// ─── Public / market-day queries ─────────────────────────────

export async function getMarketDays(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.query.marketId as string | undefined, "marketId");
    const data = await reservationService.listMarketDays(marketId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getBoothAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.query.marketId as string | undefined, "marketId");
    const marketDayIdRaw = req.query.marketDayId as string | undefined;
    if (!marketDayIdRaw) {
      throw new AppError(400, "marketDayId is required");
    }
    const data = await reservationService.getBoothAvailability(
      marketId,
      parseIntParam(marketDayIdRaw, "marketDayId")
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ─── Vendor routes ────────────────────────────────────────────

export async function getMyReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.query.marketId as string | undefined, "marketId");
    const vendor = await requireVendor(req.user!.userId);

    const statusRaw = req.query.status as string | undefined;
    if (statusRaw !== undefined && statusRaw !== "confirmed" && statusRaw !== "cancelled") {
      throw new AppError(400, "status must be 'confirmed' or 'cancelled'");
    }
    const status = statusRaw as "confirmed" | "cancelled" | undefined;

    const limit = req.query.limit
      ? Math.min(parseIntParam(req.query.limit as string, "limit"), 200)
      : 100;
    const offsetRaw = parseOffset(req.query.offset);

    const data = await reservationService.listVendorReservations(
      vendor.id,
      marketId,
      status,
      limit,
      offsetRaw
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await requireVendor(req.user!.userId);
    const { boothId, marketDayId, marketId } = req.body;
    const data = await reservationService.createReservation(vendor.id, marketId, {
      boothId,
      marketDayId,
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function cancelReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await requireVendor(req.user!.userId);
    const marketId = requireUUID(req.params.marketId, "marketId");
    const reservationId = parseIntParam(req.params.reservationId as string, "reservationId");
    const data = await reservationService.cancelReservation(
      reservationId,
      vendor.id,
      false,
      marketId
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ─── Manager routes ───────────────────────────────────────────

export async function createManagerMarketDay(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.params.marketId, "marketId");
    const data = await reservationService.createMarketDay(marketId, req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getManagerMarketDays(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.params.marketId, "marketId");
    const data = await reservationService.listMarketDays(marketId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function deleteManagerMarketDay(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.params.marketId, "marketId");
    const dayId = parseIntParam(req.params.dayId as string, "dayId");
    await reservationService.deleteMarketDay(marketId, dayId);
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

export async function getManagerReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.params.marketId, "marketId");
    const marketDayId = req.query.marketDayId
      ? parseIntParam(req.query.marketDayId as string, "marketDayId")
      : undefined;

    const statusRaw = req.query.status as string | undefined;
    if (statusRaw !== undefined && statusRaw !== "confirmed" && statusRaw !== "cancelled") {
      throw new AppError(400, "status must be 'confirmed' or 'cancelled'");
    }
    const status = statusRaw as "confirmed" | "cancelled" | undefined;

    const limit = req.query.limit
      ? Math.min(parseIntParam(req.query.limit as string, "limit"), 200)
      : 100;
    const offsetRaw = parseOffset(req.query.offset);
    const data = await reservationService.listAllReservations(
      marketId,
      marketDayId,
      status,
      limit,
      offsetRaw
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function managerCancelReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = requireUUID(req.params.marketId, "marketId");
    const reservationId = parseIntParam(req.params.reservationId as string, "reservationId");
    const data = await reservationService.cancelReservation(reservationId, null, true, marketId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
