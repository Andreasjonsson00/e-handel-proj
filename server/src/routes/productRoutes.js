import express from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { validateProductPayload } from "../middleware/productMiddleware.js";
import {
  importCSV,
  importXML,
} from "../controllers/productImportController.js";
import { indexAllProducts } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validateProductPayload,
  createProduct,
);
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateProductPayload,
  updateProduct,
);

router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

router.post("/import/csv", requireAuth, requireAdmin, importCSV);

router.post("/import/xml", requireAuth, requireAdmin, importXML);

// Admin route to index all products in Algolia
router.post("/index", requireAuth, requireAdmin, indexAllProducts);

export default router;
