import { Router } from "express";
import * as reservationController from "../controllers/reservation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createReservationSchema } from "../validators/reservation.js";

const router = Router();

// Public routes
router.get("/market-days", reservationController.getMarketDays);
router.get("/availability", reservationController.getBoothAvailability);

// Authenticated vendor routes
router.get("/my", authenticate, reservationController.getMyReservations);
router.post(
  "/",
  authenticate,
  validate(createReservationSchema),
  reservationController.createReservation
);
router.delete("/:marketId/:reservationId", authenticate, reservationController.cancelReservation);

export default router;
