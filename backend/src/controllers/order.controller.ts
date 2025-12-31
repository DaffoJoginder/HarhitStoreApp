import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateOrderNumber } from '../utils/orderNumber';

export const placeOrderB2C = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.accountType !== 'b2c') {
      return res.status(403).json({
        status: 'error',
        message: 'B2C account required'
      });
    }

    const {
      delivery_address,
      delivery_slot,
      scheduled_date,
      delivery_instructions,
      payment_method
    } = req.body;

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty'
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const itemTotal = item.unitPrice.toNumber() * item.quantity;
      subtotal += itemTotal;

      // Check and update stock
      if (item.product.b2cReservedStock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${item.product.name}`
        });
      }

      // Deduct stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          b2cReservedStock: {
            decrement: item.quantity
          },
          totalStock: {
            decrement: item.quantity
          }
        }
      });

      orderItems.push({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        itemTotal
      });
    }

    // Calculate delivery charges
    const deliveryCharges = subtotal > 149 ? 0 : 25;

    // Check minimum order value
    if (subtotal < 99) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum order value is ₹99'
      });
    }

    const totalAmount = subtotal + deliveryCharges;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber('b2c'),
        userId: req.user.userId,
        orderType: 'b2c',
        orderDate: new Date(),
        deliveryInfo: {
          address: delivery_address,
          slot: delivery_slot,
          scheduledDate: scheduled_date,
          instructions: delivery_instructions
        },
        paymentMethod: payment_method || 'cod',
        subtotal,
        deliveryCharges,
        totalAmount,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemTotal: item.itemTotal
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // Calculate estimated delivery
    const estimatedDelivery = new Date();
    if (delivery_slot === '15min') {
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 15);
    } else if (delivery_slot === '30min') {
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 30);
    } else if (delivery_slot === '1hr') {
      estimatedDelivery.setHours(estimatedDelivery.getHours() + 1);
    }

    res.status(201).json({
      status: 'success',
      order_id: order.id,
      order_number: order.orderNumber,
      order_type: order.orderType,
      total_amount: order.totalAmount.toNumber(),
      estimated_delivery: estimatedDelivery.toISOString()
    });
  } catch (error: any) {
    console.error('Place Order B2C Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to place order'
    });
  }
};

export const placeOrderB2B = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.accountType !== 'b2b' || !req.user.businessId) {
      return res.status(403).json({
        status: 'error',
        message: 'B2B account required'
      });
    }

    const {
      delivery_locations,
      billing_address,
      scheduled_date,
      scheduled_time_slot,
      po_number,
      payment_method,
      special_instructions
    } = req.body;

    // Get business
    const business = await prisma.b2BBusiness.findUnique({
      where: { id: req.user.businessId }
    });

    if (!business) {
      return res.status(404).json({
        status: 'error',
        message: 'Business account not found'
      });
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty'
      });
    }

    // Validate minimum order value
    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.unitPrice.toNumber() * item.quantity;
    });

    if (subtotal < 5000) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum order value is ₹5,000 for B2B'
      });
    }

    // Validate each delivery location meets minimum value
    if (delivery_locations && delivery_locations.length > 1) {
      const minLocationValue = 2500;
      // This would need more complex logic to split items across locations
      // For MVP, we'll assume items are distributed evenly or as specified
    }

    // Calculate GST
    const gstAmount = subtotal * 0.18;

    // Calculate delivery charges
    let deliveryCharges = 0;
    if (subtotal > 25000) {
      deliveryCharges = 0;
    } else if (subtotal >= 10000) {
      deliveryCharges = 500;
    } else {
      deliveryCharges = 1000;
    }

    const totalAmount = subtotal + gstAmount + deliveryCharges;

    // Validate credit limit if payment method is credit
    if (payment_method === 'credit') {
      if (business.availableCredit.toNumber() < totalAmount) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient credit limit'
        });
      }
    }

    // Validate scheduled date (must be at least 24 hours in advance)
    const scheduledDate = new Date(scheduled_date);
    const now = new Date();
    const hoursUntilDelivery = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDelivery < 24) {
      return res.status(400).json({
        status: 'error',
        message: 'Scheduled delivery must be at least 24 hours in advance'
      });
    }

    // Process items and update stock
    const orderItems = [];
    for (const item of cart.items) {
      if (item.product.b2bReservedStock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${item.product.name}`
        });
      }

      // Deduct stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          b2bReservedStock: {
            decrement: item.quantity
          },
          totalStock: {
            decrement: item.quantity
          }
        }
      });

      orderItems.push({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        appliedTier: item.appliedTier,
        itemTotal: item.unitPrice.toNumber() * item.quantity,
        deliveryLocationId: delivery_locations?.[0]?.location_id || null
      });
    }

    // Calculate due date for credit orders
    let dueDate = null;
    if (payment_method === 'credit') {
      dueDate = new Date(scheduledDate);
      dueDate.setDate(dueDate.getDate() + business.creditPeriodDays);
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber('b2b'),
        userId: req.user.userId,
        businessId: req.user.businessId,
        orderType: 'b2b',
        poNumber: po_number || null,
        orderDate: new Date(),
        deliveryInfo: {
          locations: delivery_locations,
          billingAddress: billing_address,
          scheduledDate,
          scheduledTimeSlot: scheduled_time_slot
        },
        paymentMethod: payment_method || 'cod',
        subtotal,
        gstAmount,
        deliveryCharges,
        totalAmount,
        creditUsed: payment_method === 'credit' ? totalAmount : 0,
        dueDate,
        specialInstructions: special_instructions,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            appliedTier: item.appliedTier,
            itemTotal: item.itemTotal,
            deliveryLocationId: item.deliveryLocationId
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Update business credit if credit payment
    if (payment_method === 'credit') {
      await prisma.b2BBusiness.update({
        where: { id: req.user.businessId },
        data: {
          availableCredit: {
            decrement: totalAmount
          },
          usedCredit: {
            increment: totalAmount
          }
        }
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.status(201).json({
      status: 'success',
      order_id: order.id,
      order_number: order.orderNumber,
      order_type: order.orderType,
      total_amount: order.totalAmount.toNumber(),
      payment_method: order.paymentMethod,
      credit_due_date: dueDate?.toISOString(),
      scheduled_deliveries: delivery_locations?.map((loc: any) => ({
        location: loc.label || loc.address_line1,
        delivery_date: scheduled_date,
        time_slot: scheduled_time_slot
      })) || []
    });
  } catch (error: any) {
    console.error('Place Order B2B Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to place order'
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.userId,
        orderType: req.user.accountType
      },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const formattedOrders = orders.map(order => {
      if (req.user?.accountType === 'b2b') {
        return {
          order_number: order.orderNumber,
          po_number: order.poNumber,
          order_date: order.orderDate,
          total_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: order.totalAmount.toNumber(),
          gst_amount: order.gstAmount.toNumber(),
          order_status: order.orderStatus,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          due_date: order.dueDate,
          delivery_locations: (order.deliveryInfo as any)?.locations?.length || 1
        };
      } else {
        return {
          order_number: order.orderNumber,
          order_date: order.orderDate,
          total_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: order.totalAmount.toNumber(),
          order_status: order.orderStatus,
          delivery_address: (order.deliveryInfo as any)?.address?.address_line1
        };
      }
    });

    res.json({
      status: 'success',
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: orders.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch orders'
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        business: req.user?.accountType === 'b2b'
      }
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.userId !== req.user?.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      order
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch order'
    });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.userId !== req.user?.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check cancellation rules
    if (order.orderStatus !== 'placed') {
      return res.status(400).json({
        status: 'error',
        message: 'Only placed orders can be cancelled'
      });
    }

    // Restore stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          totalStock: { increment: item.quantity },
          ...(order.orderType === 'b2c' 
            ? { b2cReservedStock: { increment: item.quantity } }
            : { b2bReservedStock: { increment: item.quantity } }
          )
        }
      });
    }

    // Restore credit if B2B credit order
    if (order.orderType === 'b2b' && order.paymentMethod === 'credit' && order.businessId) {
      await prisma.b2BBusiness.update({
        where: { id: order.businessId },
        data: {
          availableCredit: { increment: order.totalAmount },
          usedCredit: { decrement: order.totalAmount }
        }
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'cancelled'
      }
    });

    res.json({
      status: 'success',
      message: 'Order cancelled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to cancel order'
    });
  }
};

export const reorderB2B = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.accountType !== 'b2b') {
      return res.status(403).json({
        status: 'error',
        message: 'B2B account required'
      });
    }

    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order || order.userId !== req.user.userId) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: req.user.userId,
          accountType: 'b2b',
          businessId: req.user.businessId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    }

    const itemsAdded = [];
    const itemsUnavailable = [];
    const priceChanges = [];

    for (const orderItem of order.items) {
      const product = await prisma.product.findUnique({
        where: { id: orderItem.productId }
      });

      if (!product || product.isDeleted || product.status !== 'active') {
        itemsUnavailable.push({
          product: orderItem.productName,
          reason: 'Product no longer available'
        });
        continue;
      }

      // Check stock
      if (product.b2bReservedStock < orderItem.quantity) {
        itemsUnavailable.push({
          product: orderItem.productName,
          reason: 'Insufficient stock'
        });
        continue;
      }

      // Check price changes
      const currentPrice = product.b2bBasePrice.toNumber();
      if (orderItem.unitPrice.toNumber() !== currentPrice) {
        priceChanges.push({
          product: orderItem.productName,
          old_price: orderItem.unitPrice.toNumber(),
          new_price: currentPrice
        });
      }

      // Add to cart
      await prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id
          }
        },
        update: {
          quantity: { increment: orderItem.quantity }
        },
        create: {
          cartId: cart.id,
          productId: product.id,
          quantity: orderItem.quantity,
          unitPrice: currentPrice,
          appliedTier: orderItem.appliedTier
        }
      });

      itemsAdded.push(orderItem.productName);
    }

    res.json({
      status: 'success',
      message: 'Items added to cart',
      items_added: itemsAdded.length,
      items_unavailable: itemsUnavailable.length,
      unavailable_items: itemsUnavailable,
      price_changes: priceChanges
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to reorder'
    });
  }
};

