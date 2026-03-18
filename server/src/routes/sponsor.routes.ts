import { Router } from "express";
import * as sponsorController from "../controllers/sponsor.controller.js";

const router = Router();

router.get("/market/:marketId", sponsorController.listByMarket);

export default router;
