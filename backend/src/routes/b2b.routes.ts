import express from 'express';
import { authenticate, requireB2B } from '../middleware/auth.middleware';
import {
  getB2BProfile,
  getCreditDashboard,
  getDeliveryAddresses,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress
} from '../controllers/b2b.controller';

const router = express.Router();

// All B2B routes require authentication and B2B account
router.use(authenticate);
router.use(requireB2B);

router.get('/profile', getB2BProfile);
router.get('/credit/dashboard', getCreditDashboard);
router.get('/addresses', getDeliveryAddresses);
router.post('/addresses', addDeliveryAddress);
router.put('/addresses/:addressId', updateDeliveryAddress);
router.delete('/addresses/:addressId', deleteDeliveryAddress);

export default router;

