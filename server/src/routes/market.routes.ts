import { Router, Request, Response, NextFunction } from "express";
import * as marketController from "../controllers/market.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import * as managerService from "../services/market-manager.service.js";
import { updateMapSchema } from "../validators/market-manager.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", marketController.list);

// Map routes — must come before /:slug to avoid conflict
router.get("/:slug/map", marketController.getMap);
router.patch("/:marketId/map", authenticate, verifyMapManager, validate(updateMapSchema), marketController.updateMap);

router.get("/:slug", marketController.getBySlug);

const MAP_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyMapManager(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    if (!marketId || !MAP_UUID_RE.test(marketId)) {
      next(new AppError(400, "marketId must be a valid UUID"));
      return;
    }
    const isManager = await managerService.isMarketManager(
      req.user!.userId,
      marketId
    );
    if (!isManager) {
      next(new AppError(403, "Not a market manager"));
      return;
    }
    next();
  } catch (e) {
    next(e);
  }
}

export default router;
