import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  placeOrderB2C,
  placeOrderB2B,
  getOrders,
  getOrderById,
  cancelOrder,
  reorderB2B
} from '../controllers/order.controller';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

router.post('/b2c/place', placeOrderB2C);
router.post('/b2b/place', placeOrderB2B);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);
router.post('/:orderId/cancel', cancelOrder);
router.post('/b2b/reorder/:orderId', reorderB2B);

export default router;

