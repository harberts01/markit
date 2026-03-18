import { Request, Response, NextFunction } from "express";
import * as sponsorService from "../services/sponsor.service.js";

export async function listByMarket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const data = await sponsorService.getSponsorsByMarket(marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
