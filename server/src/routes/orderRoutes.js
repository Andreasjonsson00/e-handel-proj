import express from "express";
import { createOrder, getOrders } from "../controllers/orderController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuth, createOrder);
router.get("/", requireAuth, getOrders);

export default router;
