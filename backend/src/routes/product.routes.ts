import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller';

const router = express.Router();

// Public routes (with account type filtering)
router.get('/', getProducts);
router.get('/:productId', getProductById);

// Admin routes
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:productId', authenticate, requireAdmin, updateProduct);
router.delete('/:productId', authenticate, requireAdmin, deleteProduct);

export default router;

