import { Request, Response, NextFunction } from "express";
import * as managerService from "../services/market-manager.service.js";

export async function getApplications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const status = req.query.status;
    const data =
      status === "pending"
        ? await managerService.getPendingApplications(marketId)
        : await managerService.getAllApplications(marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateApplication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketVendorId = req.params.marketVendorId as string;
    const data = await managerService.updateApplication(
      marketVendorId,
      req.body
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getPosts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const data = await managerService.getPostsByMarket(marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createPost(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const data = await managerService.createPost(marketId, req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updatePost(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const postId = req.params.postId as string;
    const data = await managerService.updatePost(postId, marketId, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deletePost(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const postId = req.params.postId as string;
    await managerService.deletePost(postId, marketId);
    res.json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}
