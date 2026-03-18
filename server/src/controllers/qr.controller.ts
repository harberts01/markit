import { Request, Response, NextFunction } from "express";
import * as qrService from "../services/qr.service.js";

export async function resolve(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code as string;
    const data = await qrService.resolveQRCode(code);
    res.json({ data });
  } catch (e) {
    next(e);
  }
}
