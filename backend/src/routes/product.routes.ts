import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";

import { upload } from "../utils/fileUpload";

const router = express.Router();

// Public routes (with account type filtering)
router.get("/", getProducts);
router.get("/:productId", getProductById);

// Admin routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  upload.array("images", 5),
  createProduct
);
router.put(
  "/:productId",
  authenticate,
  requireAdmin,
  upload.array("images", 5),
  updateProduct
);
router.delete("/:productId", authenticate, requireAdmin, deleteProduct);

export default router;
