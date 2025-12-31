import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { calculateB2BPrice, getNextTierInfo } from '../utils/pricing';

export const addToCart = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.accountType !== 'b2c') {
      return res.status(403).json({
        status: 'error',
        message: 'B2C account required'
      });
    }

    const { product_id, quantity } = req.body;

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be between 1 and 10 for B2C'
      });
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: product_id }
    });

    if (!product || product.isDeleted || product.status !== 'active') {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (product.b2cReservedStock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock available'
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
          accountType: 'b2c',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product_id
        }
      }
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.b2cMaxQuantity) {
        return res.status(400).json({
          status: 'error',
          message: `Maximum quantity per product is ${product.b2cMaxQuantity}`
        });
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: product.b2cSellingPrice.toNumber()
        }
      });

      return res.json({
        status: 'success',
        cart_item_id: updatedItem.id,
        quantity: updatedItem.quantity,
        unit_price: updatedItem.unitPrice.toNumber(),
        item_total: (updatedItem.unitPrice.toNumber() * updatedItem.quantity)
      });
    }

    // Add new item
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product_id,
        quantity,
        unitPrice: product.b2cSellingPrice.toNumber()
      }
    });

    res.json({
      status: 'success',
      cart_item_id: cartItem.id,
      quantity: cartItem.quantity,
      unit_price: cartItem.unitPrice.toNumber(),
      item_total: (cartItem.unitPrice.toNumber() * cartItem.quantity)
    });
  } catch (error: any) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to add item to cart'
    });
  }
};

export const addToCartB2B = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.accountType !== 'b2b' || !req.user.businessId) {
      return res.status(403).json({
        status: 'error',
        message: 'B2B account required'
      });
    }

    const { product_id, quantity } = req.body;

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: product_id }
    });

    if (!product || product.isDeleted || product.status !== 'active') {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check minimum order quantity
    if (quantity < product.b2bMinOrderQty) {
      return res.status(400).json({
        status: 'error',
        message: `Minimum order quantity is ${product.b2bMinOrderQty} units`
      });
    }

    // Check stock availability
    if (product.b2bReservedStock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock available'
      });
    }

    // Calculate B2B price based on tier
    const bulkTiers = product.b2bBulkTiers as any;
    const { unitPrice, appliedTier } = calculateB2BPrice(
      product.b2bBasePrice.toNumber(),
      quantity,
      bulkTiers
    );

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
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product_id
        }
      }
    });

    if (existingItem) {
      // Update quantity and recalculate price
      const newQuantity = existingItem.quantity + quantity;
      const { unitPrice: newUnitPrice, appliedTier: newTier } = calculateB2BPrice(
        product.b2bBasePrice.toNumber(),
        newQuantity,
        bulkTiers
      );

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: newUnitPrice,
          appliedTier: newTier
        }
      });

      const nextTier = getNextTierInfo(newQuantity, bulkTiers);

      return res.json({
        status: 'success',
        cart_item_id: updatedItem.id,
        quantity: updatedItem.quantity,
        unit_price: updatedItem.unitPrice.toNumber(),
        applied_tier: updatedItem.appliedTier,
        item_total: (updatedItem.unitPrice.toNumber() * updatedItem.quantity),
        next_tier_info: nextTier
      });
    }

    // Add new item
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product_id,
        quantity,
        unitPrice,
        appliedTier: appliedTier || null
      }
    });

    const nextTier = getNextTierInfo(quantity, bulkTiers);

    res.json({
      status: 'success',
      cart_item_id: cartItem.id,
      quantity: cartItem.quantity,
      unit_price: cartItem.unitPrice.toNumber(),
      applied_tier: cartItem.appliedTier,
      item_total: (cartItem.unitPrice.toNumber() * cartItem.quantity),
      next_tier_info: nextTier
    });
  } catch (error: any) {
    console.error('Add to Cart B2B Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to add item to cart'
    });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    let cart = await prisma.cart.findUnique({
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
      return res.json({
        status: 'success',
        cart_id: cart?.id || null,
        account_type: req.user.accountType,
        items: [],
        summary: {
          total_items: 0,
          subtotal: 0,
          delivery_charges: 0,
          total_amount: 0
        }
      });
    }

    // Calculate totals
    let subtotal = 0;
    const items = cart.items.map(item => {
      const itemTotal = item.unitPrice.toNumber() * item.quantity;
      subtotal += itemTotal;

      return {
        cart_item_id: item.id,
        product_id: item.productId,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice.toNumber(),
        applied_tier: item.appliedTier,
        item_total: itemTotal
      };
    });

    // Calculate delivery charges based on account type
    let deliveryCharges = 0;
    if (req.user.accountType === 'b2c') {
      deliveryCharges = subtotal > 149 ? 0 : 25;
    } else {
      // B2B
      if (subtotal > 25000) {
        deliveryCharges = 0;
      } else if (subtotal >= 10000) {
        deliveryCharges = 500;
      } else {
        deliveryCharges = 1000;
      }
    }

    // Calculate GST for B2B
    let gstAmount = 0;
    if (req.user.accountType === 'b2b') {
      gstAmount = subtotal * 0.18;
    }

    const totalAmount = subtotal + deliveryCharges + gstAmount;

    const response: any = {
      status: 'success',
      cart_id: cart.id,
      account_type: cart.accountType,
      items,
      summary: {
        total_items: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        delivery_charges: deliveryCharges,
        total_amount: totalAmount
      }
    };

    if (req.user.accountType === 'b2b' && req.user.businessId) {
      const business = await prisma.b2BBusiness.findUnique({
        where: { id: req.user.businessId }
      });

      if (business) {
        response.summary.gst_18 = gstAmount;
        response.credit_info = {
          credit_available: business.availableCredit.toNumber(),
          credit_after_order: business.availableCredit.toNumber() - totalAmount
        };
      }
    }

    res.json(response);
  } catch (error: any) {
    console.error('Get Cart Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch cart'
    });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart item not found'
      });
    }

    // Validate quantity based on account type
    if (cartItem.cart.accountType === 'b2c') {
      if (quantity < 1 || quantity > cartItem.product.b2cMaxQuantity) {
        return res.status(400).json({
          status: 'error',
          message: `Quantity must be between 1 and ${cartItem.product.b2cMaxQuantity}`
        });
      }

      // Update with B2C price
      const updated = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity,
          unitPrice: cartItem.product.b2cSellingPrice.toNumber()
        }
      });

      return res.json({
        status: 'success',
        cart_item: updated
      });
    } else {
      // B2B
      if (quantity < cartItem.product.b2bMinOrderQty) {
        return res.status(400).json({
          status: 'error',
          message: `Minimum order quantity is ${cartItem.product.b2bMinOrderQty} units`
        });
      }

      // Recalculate tier pricing
      const bulkTiers = cartItem.product.b2bBulkTiers as any;
      const { unitPrice, appliedTier } = calculateB2BPrice(
        cartItem.product.b2bBasePrice.toNumber(),
        quantity,
        bulkTiers
      );

      const updated = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity,
          unitPrice,
          appliedTier: appliedTier || null
        }
      });

      return res.json({
        status: 'success',
        cart_item: updated
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update cart item'
    });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { cartItemId } = req.params;

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    res.json({
      status: 'success',
      message: 'Item removed from cart'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to remove cart item'
    });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId }
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    res.json({
      status: 'success',
      message: 'Cart cleared'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to clear cart'
    });
  }
};

