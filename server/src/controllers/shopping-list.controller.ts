import { Request, Response, NextFunction } from "express";
import * as shoppingListService from "../services/shopping-list.service.js";

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    const data = await shoppingListService.getListWithItems(
      req.user!.userId,
      marketId
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    const data = await shoppingListService.addItem(
      req.user!.userId,
      marketId,
      req.body
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const itemId = req.params.itemId as string;
    const data = await shoppingListService.updateItem(
      req.user!.userId,
      itemId,
      req.body
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function removeItem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const itemId = req.params.itemId as string;
    await shoppingListService.removeItem(req.user!.userId, itemId);
    res.json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}
