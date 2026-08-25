import express from "express";
import { createOrder, getOrders } from "../controllers/orderController.js";
import {
  requireAdmin,
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/orders", requireAuth, createOrder);
router.get("/orders", requireAuth, requireAdmin, getOrders);

export default router;
