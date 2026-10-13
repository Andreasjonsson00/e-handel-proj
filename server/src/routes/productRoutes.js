import express from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { validateProductPayload } from "../middleware/productMiddleware.js";
import {
  importCSV,
  importXML,
} from "../controllers/productImportController.js";

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

router.post("/products/import/csv", requireAuth, requireAdmin, importCSV);

router.post("/products/import/xml", requireAuth, requireAdmin, importXML);

export default router;
