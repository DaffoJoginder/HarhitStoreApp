import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getPendingB2BRegistrations,
  approveB2BRegistration,
  getOrders,
  updateOrderStatus
} from '../controllers/admin.controller';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// B2B Business Management
router.get('/b2b/pending', getPendingB2BRegistrations);
router.post('/b2b/approve/:businessId', approveB2BRegistration);

// Order Management
router.get('/orders', getOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

export default router;

