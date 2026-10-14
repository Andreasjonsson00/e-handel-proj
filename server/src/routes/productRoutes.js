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

export default router;
