import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as vendorController from "../controllers/vendor.controller.js";
import { authenticate, type AuthPayload } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  createVendorProfileSchema,
  createProductSchema,
  updateProductSchema,
  updateInventorySchema,
  markVisitedSchema,
} from "../validators/vendor.js";
import { authConfig } from "../config/auth.js";

const router = Router();

// ── Visited vendors list: GET / with ?marketId=&visited=true ─
// Must come first to avoid being caught by parameterised routes
router.get("/", authenticate, vendorController.listVisited);

// Public — optionally enriched with follow status if authenticated
router.get("/market/:marketId", optionalAuth, vendorController.listByMarket);
router.get("/market/:marketId/:vendorId", optionalAuth, vendorController.getById);
router.get("/:vendorId/products", vendorController.getProducts);

// Public — inventory for a vendor in a market
router.get("/:vendorId/inventory", vendorController.getInventory);

// Authenticated — vendor profile management
router.get("/me", authenticate, vendorController.getMyProfile);
router.post(
  "/profile",
  authenticate,
  authorize("vendor"),
  validate(createVendorProfileSchema),
  vendorController.createProfile
);
router.post("/apply/:marketId", authenticate, authorize("vendor"), vendorController.applyToMarket);

// Authenticated — product CRUD (vendor only)
router.post(
  "/products",
  authenticate,
  authorize("vendor"),
  validate(createProductSchema),
  vendorController.createProduct
);
router.patch(
  "/products/:productId",
  authenticate,
  authorize("vendor"),
  validate(updateProductSchema),
  vendorController.updateProduct
);
router.delete("/products/:productId", authenticate, authorize("vendor"), vendorController.deleteProduct);

// Authenticated — inventory management (vendor only)
router.patch(
  "/inventory/:marketId/:productId",
  authenticate,
  authorize("vendor"),
  validate(updateInventorySchema),
  vendorController.updateInventory
);

// Authenticated — follow/unfollow
router.post("/:vendorId/follow", authenticate, vendorController.follow);
router.delete("/:vendorId/follow", authenticate, vendorController.unfollow);

// Authenticated — visit tracking
router.post("/:vendorId/visits", authenticate, validate(markVisitedSchema), vendorController.markVisited);

/**
 * Optional auth: attaches req.user if a valid token is present, but doesn't
 * reject the request if the token is missing or invalid.
 */
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret) as AuthPayload;
    req.user = payload;
  } catch {
    // Invalid token — just proceed without auth
  }
  next();
}

export default router;
