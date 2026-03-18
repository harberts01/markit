import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "../config/database.js";
import { qrCodes, markets } from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

export async function resolveQRCode(code: string): Promise<{ marketSlug: string }> {
  const [qr] = await db
    .select({ id: qrCodes.id, marketId: qrCodes.marketId, scanCount: qrCodes.scanCount })
    .from(qrCodes)
    .where(eq(qrCodes.code, code))
    .limit(1);

  if (!qr) throw new AppError(404, "QR code not found");

  // Increment scan count (fire and forget)
  db.update(qrCodes)
    .set({ scanCount: (qr.scanCount ?? 0) + 1 })
    .where(eq(qrCodes.id, qr.id))
    .catch(() => {});

  const [market] = await db
    .select({ slug: markets.slug })
    .from(markets)
    .where(eq(markets.id, qr.marketId))
    .limit(1);

  if (!market) throw new AppError(404, "Market not found");

  return { marketSlug: market.slug };
}

export async function generateQRCode(
  marketId: string,
  label?: string
): Promise<{ code: string; qrImageUrl: string; marketId: string }> {
  const code = randomBytes(8).toString("hex");
  await db.insert(qrCodes).values({ marketId, code, label: label ?? null });

  // Dynamically import qrcode to generate a data URL
  const QRCode = (await import("qrcode")).default;
  const qrImageUrl = await QRCode.toDataURL(code);

  return { code, qrImageUrl, marketId };
}

export async function listQRCodes(marketId: string) {
  return db
    .select()
    .from(qrCodes)
    .where(eq(qrCodes.marketId, marketId));
}
