import { Router } from "express";
import * as postController from "../controllers/post.controller.js";

const router = Router();

router.get("/market/:marketId", postController.listByMarket);
router.get("/market/:marketId/featured-vendors", postController.featuredVendors);
router.get("/:postId", postController.getById);

export default router;
