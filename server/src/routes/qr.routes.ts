import { Router } from "express";
import * as qrController from "../controllers/qr.controller.js";

const router = Router();

// Public — resolve a QR code to its market slug and increment scan count
router.get("/:code", qrController.resolve);

export default router;
