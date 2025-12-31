import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getPendingB2BRegistrations = async (req: Request, res: Response) => {
  try {
    const businesses = await prisma.b2BBusiness.findMany({
      where: {
        accountStatus: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      businesses: businesses.map(business => ({
        business_id: business.id,
        business_name: business.businessName,
        business_type: business.businessType,
        gst_number: business.gstNumber,
        pan_number: business.panNumber,
        contact_person: business.contactPerson,
        business_address: business.businessAddress,
        documents: business.documents,
        registration_date: business.createdAt,
        user: business.user
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch pending registrations'
    });
  }
};

export const approveB2BRegistration = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { action, credit_limit, credit_period_days, rejection_reason } = req.body;

    const business = await prisma.b2BBusiness.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return res.status(404).json({
        status: 'error',
        message: 'Business not found'
      });
    }

    if (business.accountStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Business account is already ${business.accountStatus}`
      });
    }

    if (action === 'approve') {
      if (!credit_limit || !credit_period_days) {
        return res.status(400).json({
          status: 'error',
          message: 'Credit limit and credit period days are required for approval'
        });
      }

      // Validate credit limit range
      if (credit_limit < 10000 || credit_limit > 500000) {
        return res.status(400).json({
          status: 'error',
          message: 'Credit limit must be between ₹10,000 and ₹5,00,000'
        });
      }

      // Validate credit period
      if (![7, 15, 30].includes(credit_period_days)) {
        return res.status(400).json({
          status: 'error',
          message: 'Credit period must be 7, 15, or 30 days'
        });
      }

      const updated = await prisma.b2BBusiness.update({
        where: { id: businessId },
        data: {
          accountStatus: 'approved',
          creditLimit: credit_limit,
          creditPeriodDays: credit_period_days,
          availableCredit: credit_limit,
          approvalDate: new Date(),
          approvedBy: req.user?.userId
        }
      });

      res.json({
        status: 'success',
        message: 'Business account approved successfully',
        business: {
          business_id: updated.id,
          business_name: updated.businessName,
          account_status: updated.accountStatus,
          credit_limit: updated.creditLimit.toNumber(),
          credit_period_days: updated.creditPeriodDays
        }
      });
    } else if (action === 'reject') {
      if (!rejection_reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason is required'
        });
      }

      const updated = await prisma.b2BBusiness.update({
        where: { id: businessId },
        data: {
          accountStatus: 'rejected',
          rejectionReason: rejection_reason,
          approvedBy: req.user?.userId
        }
      });

      res.json({
        status: 'success',
        message: 'Business account rejected',
        business: {
          business_id: updated.id,
          business_name: updated.businessName,
          account_status: updated.accountStatus,
          rejection_reason: updated.rejectionReason
        }
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }
  } catch (error: any) {
    console.error('Approve B2B Registration Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process business registration'
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orderType = req.query.order_type as string;
    const orderStatus = req.query.order_status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (orderType) where.orderType = orderType;
    if (orderStatus) where.orderStatus = orderStatus;

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        business: {
          select: {
            id: true,
            businessName: true
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.order.count({ where });

    res.json({
      status: 'success',
      orders: orders.map(order => ({
        order_id: order.id,
        order_number: order.orderNumber,
        order_type: order.orderType,
        user: order.user,
        business: order.business,
        order_date: order.orderDate,
        order_status: order.orderStatus,
        total_amount: order.totalAmount.toNumber(),
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        item_count: order.items.length
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch orders'
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { order_status } = req.body;

    const validStatuses = ['placed', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: order_status
      }
    });

    res.json({
      status: 'success',
      message: 'Order status updated',
      order: {
        order_id: updated.id,
        order_number: updated.orderNumber,
        order_status: updated.orderStatus
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update order status'
    });
  }
};

