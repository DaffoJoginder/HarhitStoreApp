import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createSubcategory,
  getSubcategories,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/category.controller';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:categoryId/subcategories', getSubcategories);

// Admin routes
router.post('/', authenticate, requireAdmin, createCategory);
router.put('/:categoryId', authenticate, requireAdmin, updateCategory);
router.delete('/:categoryId', authenticate, requireAdmin, deleteCategory);

router.post('/:categoryId/subcategories', authenticate, requireAdmin, createSubcategory);
router.put('/:categoryId/subcategories/:subcategoryId', authenticate, requireAdmin, updateSubcategory);
router.delete('/:categoryId/subcategories/:subcategoryId', authenticate, requireAdmin, deleteSubcategory);

export default router;

