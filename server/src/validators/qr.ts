import { z } from "zod";

export const generateQRSchema = z.object({
  label: z.string().max(200).optional(),
});
