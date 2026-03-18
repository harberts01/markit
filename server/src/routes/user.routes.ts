import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.get("/me", authenticate, userController.getMe);
router.patch("/me", authenticate, userController.updateMe);
router.patch("/me/password", authenticate, userController.changePassword);

export default router;
