import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  addToCart,
  addToCartB2B,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/b2b/add', addToCartB2B);
router.put('/items/:cartItemId', updateCartItem);
router.delete('/items/:cartItemId', removeCartItem);
router.delete('/clear', clearCart);

export default router;

