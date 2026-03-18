import { Request, Response, NextFunction } from "express";
import * as postService from "../services/post.service.js";

export async function listByMarket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const data = await postService.getPostsByMarket(marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function featuredVendors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const data = await postService.getFeaturedVendorPosts(marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const postId = req.params.postId as string;
    const data = await postService.getPostById(postId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
