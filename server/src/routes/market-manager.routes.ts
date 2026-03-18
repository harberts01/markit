import { Router, Request, Response, NextFunction } from "express";
import * as managerController from "../controllers/market-manager.controller.js";
import * as marketController from "../controllers/market.controller.js";
import * as reservationController from "../controllers/reservation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  updateApplicationSchema,
  createPostSchema,
  updatePostSchema,
  createSponsorSchema,
  updateSponsorSchema,
  updateMarketSettingsSchema,
} from "../validators/market-manager.js";
import { createMarketDaySchema } from "../validators/reservation.js";
import { generateQRSchema } from "../validators/qr.js";
import * as managerService from "../services/market-manager.service.js";
import * as qrService from "../services/qr.service.js";
import * as sponsorService from "../services/sponsor.service.js";
import * as marketService from "../services/market.service.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

const MANAGER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function verifyMarketManager(req: Request, res: Response, next: NextFunction) {
  const marketId = req.params.marketId as string;
  if (!marketId || !MANAGER_UUID_RE.test(marketId)) {
    next(new AppError(400, "marketId must be a valid UUID"));
    return;
  }
  if (!req.user) {
    next(new AppError(401, "Not authenticated"));
    return;
  }

  managerService
    .isMarketManager(req.user.userId, marketId)
    .then((isManager) => {
      if (!isManager) {
        next(new AppError(403, "Not a manager of this market"));
        return;
      }
      next();
    })
    .catch(next);
}

// All manager routes require authentication + market manager verification
router.use(authenticate);
// router.use with a path does prefix matching in Express, so "/:marketId"
// covers all sub-routes (/:marketId/applications, /:marketId/posts, etc.)
// without the edge cases of the glob form "/:marketId/*".
router.use("/:marketId", verifyMarketManager);

// Vendor applications
router.get("/:marketId/applications", managerController.getApplications);
router.patch(
  "/:marketId/applications/:marketVendorId",
  validate(updateApplicationSchema),
  managerController.updateApplication
);

// Posts management
router.get("/:marketId/posts", managerController.getPosts);
router.post(
  "/:marketId/posts",
  validate(createPostSchema),
  managerController.createPost
);
router.patch(
  "/:marketId/posts/:postId",
  validate(updatePostSchema),
  managerController.updatePost
);
router.delete("/:marketId/posts/:postId", managerController.deletePost);

// QR code management
router.post("/:marketId/qr", validate(generateQRSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const marketId = req.params.marketId as string;
    const data = await qrService.generateQRCode(marketId, req.body.label);
    res.status(201).json({ data });
  } catch (e) {
    next(e);
  }
});

router.get("/:marketId/qr", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const marketId = req.params.marketId as string;
    const data = await qrService.listQRCodes(marketId);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

// Sponsor CRUD
router.get("/:marketId/sponsors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await sponsorService.getAllSponsorsByMarket(req.params.marketId as string);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.post("/:marketId/sponsors", validate(createSponsorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await sponsorService.createSponsor(req.params.marketId as string, req.body);
    res.status(201).json({ data });
  } catch (e) {
    next(e);
  }
});

router.patch("/:marketId/sponsors/:sponsorId", validate(updateSponsorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await sponsorService.updateSponsor(req.params.sponsorId as string, req.params.marketId as string, req.body);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.delete("/:marketId/sponsors/:sponsorId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sponsorService.deleteSponsor(req.params.sponsorId as string, req.params.marketId as string);
    res.json({ data: { deleted: true } });
  } catch (e) {
    next(e);
  }
});

// Market days management
router.post(
  "/:marketId/market-days",
  validate(createMarketDaySchema),
  reservationController.createManagerMarketDay
);
router.get("/:marketId/market-days", reservationController.getManagerMarketDays);
router.delete("/:marketId/market-days/:dayId", reservationController.deleteManagerMarketDay);

// Reservations management
router.get("/:marketId/reservations", reservationController.getManagerReservations);
router.delete(
  "/:marketId/reservations/:reservationId",
  reservationController.managerCancelReservation
);

// Market settings
router.get("/:marketId/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketService.getMarketById(req.params.marketId as string);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.patch("/:marketId/settings", validate(updateMarketSettingsSchema), marketController.updateSettings);

export default router;
