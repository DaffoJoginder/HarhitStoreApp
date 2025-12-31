import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getB2BProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.businessId) {
      return res.status(403).json({
        status: 'error',
        message: 'Business account required'
      });
    }

    const business = await prisma.b2BBusiness.findUnique({
      where: { id: req.user.businessId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobile: true
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        status: 'error',
        message: 'Business not found'
      });
    }

    res.json({
      status: 'success',
      business: {
        business_id: business.id,
        business_name: business.businessName,
        business_type: business.businessType,
        gst_number: business.gstNumber,
        pan_number: business.panNumber,
        contact_person: business.contactPerson,
        business_address: business.businessAddress,
        account_status: business.accountStatus,
        credit_limit: business.creditLimit.toNumber(),
        credit_period_days: business.creditPeriodDays,
        available_credit: business.availableCredit.toNumber(),
        used_credit: business.usedCredit.toNumber(),
        user: business.user
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch profile'
    });
  }
};

export const getCreditDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.businessId) {
      return res.status(403).json({
        status: 'error',
        message: 'Business account required'
      });
    }

    const business = await prisma.b2BBusiness.findUnique({
      where: { id: req.user.businessId }
    });

    if (!business) {
      return res.status(404).json({
        status: 'error',
        message: 'Business not found'
      });
    }

    // Get pending orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        businessId: req.user.businessId,
        paymentMethod: 'credit',
        paymentStatus: 'pending'
      },
      select: {
        orderNumber: true,
        totalAmount: true,
        dueDate: true
      }
    });

    const pendingAmount = pendingOrders.reduce((sum, order) => {
      return sum + order.totalAmount.toNumber();
    }, 0);

    // Get overdue orders
    const now = new Date();
    const overdueOrders = pendingOrders.filter(order => 
      order.dueDate && new Date(order.dueDate) < now
    );

    const overdueAmount = overdueOrders.reduce((sum, order) => {
      return sum + order.totalAmount.toNumber();
    }, 0);

    // Get recent invoices (credit orders)
    const recentInvoices = await prisma.order.findMany({
      where: {
        businessId: req.user.businessId,
        paymentMethod: 'credit'
      },
      select: {
        orderNumber: true,
        orderDate: true,
        totalAmount: true,
        dueDate: true,
        paymentStatus: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      status: 'success',
      business_id: business.id,
      business_name: business.businessName,
      credit_info: {
        total_limit: business.creditLimit.toNumber(),
        available_credit: business.availableCredit.toNumber(),
        used_credit: business.usedCredit.toNumber(),
        credit_period_days: business.creditPeriodDays
      },
      payment_summary: {
        pending_amount: pendingAmount,
        overdue_amount: overdueAmount,
        pending_invoices: pendingOrders.length
      },
      recent_invoices: recentInvoices.map(order => ({
        invoice_number: `INV-${order.orderNumber}`,
        order_number: order.orderNumber,
        invoice_date: order.orderDate,
        due_date: order.dueDate,
        amount: order.totalAmount.toNumber(),
        status: order.paymentStatus
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch credit dashboard'
    });
  }
};

export const getDeliveryAddresses = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.businessId) {
      return res.status(403).json({
        status: 'error',
        message: 'Business account required'
      });
    }

    const addresses = await prisma.b2BDeliveryAddress.findMany({
      where: {
        businessId: req.user.businessId,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      status: 'success',
      addresses
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch addresses'
    });
  }
};

export const addDeliveryAddress = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.businessId) {
      return res.status(403).json({
        status: 'error',
        message: 'Business account required'
      });
    }

    const {
      label,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      contact_person,
      contact_mobile,
      is_default
    } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await prisma.b2BDeliveryAddress.updateMany({
        where: {
          businessId: req.user.businessId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    const address = await prisma.b2BDeliveryAddress.create({
      data: {
        businessId: req.user.businessId,
        label,
        addressLine1: address_line1,
        addressLine2: address_line2,
        city,
        state,
        pincode,
        contactPerson: contact_person,
        contactMobile: contact_mobile,
        isDefault: is_default || false
      }
    });

    res.status(201).json({
      status: 'success',
      address
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to add address'
    });
  }
};

export const updateDeliveryAddress = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;
    const {
      label,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      contact_person,
      contact_mobile,
      is_default
    } = req.body;

    // Check if address belongs to user's business
    const address = await prisma.b2BDeliveryAddress.findUnique({
      where: { id: addressId }
    });

    if (!address || address.businessId !== req.user?.businessId) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await prisma.b2BDeliveryAddress.updateMany({
        where: {
          businessId: req.user.businessId,
          isDefault: true,
          id: { not: addressId }
        },
        data: {
          isDefault: false
        }
      });
    }

    const updated = await prisma.b2BDeliveryAddress.update({
      where: { id: addressId },
      data: {
        label,
        addressLine1: address_line1,
        addressLine2: address_line2,
        city,
        state,
        pincode,
        contactPerson: contact_person,
        contactMobile: contact_mobile,
        isDefault: is_default !== undefined ? is_default : address.isDefault
      }
    });

    res.json({
      status: 'success',
      address: updated
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update address'
    });
  }
};

export const deleteDeliveryAddress = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;

    const address = await prisma.b2BDeliveryAddress.findUnique({
      where: { id: addressId }
    });

    if (!address || address.businessId !== req.user?.businessId) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    await prisma.b2BDeliveryAddress.update({
      where: { id: addressId },
      data: { isActive: false }
    });

    res.json({
      status: 'success',
      message: 'Address deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete address'
    });
  }
};

