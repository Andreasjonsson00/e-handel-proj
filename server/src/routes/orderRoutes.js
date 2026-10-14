import express from "express";
import { createOrder, getOrders } from "../controllers/orderController.js";
import {
  requireAdmin,
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuth, createOrder);
router.get("/", requireAuth, requireAdmin, getOrders);

export default router;
