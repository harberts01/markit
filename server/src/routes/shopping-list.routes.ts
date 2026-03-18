import { Router } from "express";
import * as shoppingListController from "../controllers/shopping-list.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { addItemSchema, updateItemSchema } from "../validators/shopping-list.js";

const router = Router();

// All shopping list routes require authentication
router.use(authenticate);

router.get("/market/:marketId", shoppingListController.getList);
router.post(
  "/market/:marketId/items",
  validate(addItemSchema),
  shoppingListController.addItem
);
router.patch(
  "/items/:itemId",
  validate(updateItemSchema),
  shoppingListController.updateItem
);
router.delete("/items/:itemId", shoppingListController.removeItem);

export default router;
