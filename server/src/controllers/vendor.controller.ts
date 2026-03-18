import { Request, Response, NextFunction } from "express";
import * as vendorService from "../services/vendor.service.js";

export async function listByMarket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const search =
      typeof req.query.q === "string" ? req.query.q : undefined;

    const data = await vendorService.getVendorsByMarket(marketId, {
      category,
      search,
    });

    // If user is authenticated, include follow status
    if (req.user) {
      const vendorIds = data.map((v) => v.id);
      const followedIds = await vendorService.getFollowedVendorIds(
        req.user.userId,
        vendorIds
      );
      const enriched = data.map((v) => ({
        ...v,
        isFollowing: followedIds.has(v.id),
      }));
      res.json({ data: enriched });
      return;
    }

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
    const vendorId = req.params.vendorId as string;
    const marketId = req.params.marketId as string;
    const data = await vendorService.getVendorWithMarketInfo(
      vendorId,
      marketId
    );

    if (req.user) {
      const following = await vendorService.isFollowing(
        req.user.userId,
        vendorId
      );
      res.json({ data: { ...data, isFollowing: following } });
      return;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vendorId = req.params.vendorId as string;
    const data = await vendorService.getVendorProducts(vendorId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function follow(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vendorId = req.params.vendorId as string;
    await vendorService.followVendor(req.user!.userId, vendorId);
    res.json({ data: { followed: true } });
  } catch (error) {
    next(error);
  }
}

export async function unfollow(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vendorId = req.params.vendorId as string;
    await vendorService.unfollowVendor(req.user!.userId, vendorId);
    res.json({ data: { followed: false } });
  } catch (error) {
    next(error);
  }
}

// ─── Vendor Profile & Product Management ────────────────────

export async function createProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await vendorService.createVendorProfile(
      req.user!.userId,
      req.body
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function applyToMarket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const vendor = await vendorService.getVendorByUserId(req.user!.userId);
    if (!vendor) {
      res.status(404).json({ error: "No vendor profile found" });
      return;
    }
    const data = await vendorService.applyToMarket(vendor.id, marketId);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await vendorService.getMyVendorProfile(req.user!.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await vendorService.createProduct(req.user!.userId, req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const productId = req.params.productId as string;
    const data = await vendorService.updateProduct(
      req.user!.userId,
      productId,
      req.body
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const productId = req.params.productId as string;
    await vendorService.deleteProduct(req.user!.userId, productId);
    res.json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}

export async function updateInventory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId = req.params.marketId as string;
    const productId = req.params.productId as string;
    const data = await vendorService.updateInventory(
      req.user!.userId,
      marketId,
      productId,
      req.body.quantity
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

// ─── Inventory GET ───────────────────────────────────────────

export async function getInventory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vendorId = req.params.vendorId as string;
    const marketId =
      typeof req.query.marketId === "string" ? req.query.marketId : undefined;
    if (!marketId) {
      res.status(400).json({ error: "marketId query param required" });
      return;
    }
    const data = await vendorService.getVendorInventory(vendorId, marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

// ─── Vendor Visit Tracking ───────────────────────────────────

export async function markVisited(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vendorId = req.params.vendorId as string;
    const marketId = req.body.marketId as string;
    if (!marketId) {
      res.status(400).json({ error: "marketId required" });
      return;
    }
    await vendorService.recordVisit(req.user!.userId, vendorId, marketId);
    res.json({ data: { visited: true } });
  } catch (error) {
    next(error);
  }
}

export async function listVisited(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const marketId =
      typeof req.query.marketId === "string" ? req.query.marketId : undefined;
    if (!marketId) {
      res.status(400).json({ error: "marketId required" });
      return;
    }
    const data = await vendorService.getVisitedVendors(req.user!.userId, marketId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
