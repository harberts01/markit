import { Request, Response, NextFunction } from "express";
import * as marketService from "../services/market.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await marketService.listMarkets(search);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const data = await marketService.getMarketBySlug(slug);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getMap(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const data = await marketService.getMarketMap(slug);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateMap(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    const data = await marketService.updateMarketMap(marketId, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await marketService.updateMarketSettings(req.params.marketId as string, req.body);
    res.json({ data });
  } catch (e) {
    next(e);
  }
}
