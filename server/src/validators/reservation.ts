import { z } from "zod";

export const createMarketDaySchema = z.object({
  marketDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "marketDate must be YYYY-MM-DD")
    .refine((d) => !isNaN(Date.parse(d)), "marketDate must be a real calendar date")
    .refine((d) => {
      // Compare against the UTC calendar date so the check is consistent
      // regardless of the server's local timezone. marketDate values are
      // stored as plain dates (no time/tz) in Postgres, so UTC is the
      // correct reference point.
      const now = new Date();
      const todayUTC = [
        now.getUTCFullYear(),
        String(now.getUTCMonth() + 1).padStart(2, "0"),
        String(now.getUTCDate()).padStart(2, "0"),
      ].join("-");
      return d >= todayUTC;
    }, "marketDate cannot be in the past"),
  notes: z.string().optional(),
});

export const createReservationSchema = z
  .object({
    boothId: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[\w\-]+$/, "boothId must contain only word characters and hyphens"),
    marketDayId: z.number().int().positive(),
    marketId: z.string().uuid(),
  })
  .strict();
