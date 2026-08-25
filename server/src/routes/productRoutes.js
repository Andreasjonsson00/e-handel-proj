import express from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import {
  requireAdmin,
  requireAuth,
} from "../middleware/authMiddleware.js";
import { validateProductPayload } from "../middleware/productMiddleware.js";

const router = express.Router();

router.get("/products", getProducts);
router.post(
  "/products",
  requireAuth,
  requireAdmin,
  validateProductPayload,
  createProduct,
);
router.put(
  "/products/:id",
  requireAuth,
  requireAdmin,
  validateProductPayload,
  updateProduct,
);

export default router;
