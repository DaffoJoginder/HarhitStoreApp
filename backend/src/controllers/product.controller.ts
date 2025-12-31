import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { calculateB2BPrice } from '../utils/pricing';

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      sku,
      name,
      category_id,
      subcategory_id,
      brand,
      description,
      unit,
      quantity_per_unit,
      images,
      is_vegetarian,
      expiry_date,
      // B2C Pricing
      b2c_mrp,
      b2c_selling_price,
      b2c_min_quantity,
      b2c_max_quantity,
      // B2B Pricing
      b2b_base_price,
      b2b_min_order_qty,
      b2b_max_order_qty,
      b2b_bulk_tiers,
      // Inventory
      total_stock,
      b2c_reserved_stock,
      b2b_reserved_stock
    } = req.body;

    // Validate B2B price is less than B2C price
    if (b2b_base_price >= b2c_selling_price) {
      return res.status(400).json({
        status: 'error',
        message: 'B2B base price must be less than B2C selling price'
      });
    }

    // Calculate reserved stock if not provided
    const b2cReserved = b2c_reserved_stock || Math.floor(total_stock * 0.3);
    const b2bReserved = b2b_reserved_stock || Math.floor(total_stock * 0.7);

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        categoryId: category_id,
        subcategoryId: subcategory_id,
        brand,
        description,
        unit,
        quantityPerUnit: quantity_per_unit,
        images: images || [],
        isVegetarian: is_vegetarian,
        expiryDate: expiry_date ? new Date(expiry_date) : null,
        b2cMrp: b2c_mrp,
        b2cSellingPrice: b2c_selling_price,
        b2cMinQuantity: b2c_min_quantity || 1,
        b2cMaxQuantity: b2c_max_quantity || 10,
        b2bBasePrice: b2b_base_price,
        b2bMinOrderQty: b2b_min_order_qty,
        b2bMaxOrderQty: b2b_max_order_qty,
        b2bBulkTiers: b2b_bulk_tiers || [],
        totalStock: total_stock,
        b2cReservedStock: b2cReserved,
        b2bReservedStock: b2bReserved
      }
    });

    res.status(201).json({
      status: 'success',
      product_id: product.id,
      message: 'Product created with tiered pricing'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        status: 'error',
        message: 'Product with this SKU already exists'
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create product'
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const accountType = (req.query.account_type as string) || 'b2c';
    const categoryId = req.query.category_id as string;
    const subcategoryId = req.query.subcategory_id as string;
    const search = req.query.search as string;

    const where: any = {
      isDeleted: false,
      status: 'active'
    };

    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subcategory: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response based on account type
    const formattedProducts = products.map(product => {
      if (accountType === 'b2b') {
        return {
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          unit: product.unit,
          base_price: product.b2bBasePrice.toNumber(),
          min_order_qty: product.b2bMinOrderQty,
          max_order_qty: product.b2bMaxOrderQty,
          bulk_tiers: product.b2bBulkTiers,
          in_stock: product.totalStock > 0,
          available_stock: product.b2bReservedStock
        };
      } else {
        // B2C
        const discount = ((product.b2cMrp.toNumber() - product.b2cSellingPrice.toNumber()) / product.b2cMrp.toNumber()) * 100;
        return {
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          unit: product.unit,
          mrp: product.b2cMrp.toNumber(),
          selling_price: product.b2cSellingPrice.toNumber(),
          discount_percentage: Math.round(discount * 100) / 100,
          max_quantity: product.b2cMaxQuantity,
          in_stock: product.b2cReservedStock > 0,
          available_stock: product.b2cReservedStock
        };
      }
    });

    res.json({
      status: 'success',
      products: formattedProducts
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch products'
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const accountType = (req.query.account_type as string) || 'b2c';

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        subcategory: true
      }
    });

    if (!product || product.isDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Format response based on account type
    if (accountType === 'b2b') {
      res.json({
        status: 'success',
        product: {
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          description: product.description,
          unit: product.unit,
          quantity_per_unit: product.quantityPerUnit.toNumber(),
          images: product.images,
          base_price: product.b2bBasePrice.toNumber(),
          min_order_qty: product.b2bMinOrderQty,
          max_order_qty: product.b2bMaxOrderQty,
          bulk_tiers: product.b2bBulkTiers,
          in_stock: product.totalStock > 0,
          available_stock: product.b2bReservedStock,
          category: product.category.name,
          subcategory: product.subcategory.name
        }
      });
    } else {
      const discount = ((product.b2cMrp.toNumber() - product.b2cSellingPrice.toNumber()) / product.b2cMrp.toNumber()) * 100;
      res.json({
        status: 'success',
        product: {
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          description: product.description,
          unit: product.unit,
          quantity_per_unit: product.quantityPerUnit.toNumber(),
          images: product.images,
          mrp: product.b2cMrp.toNumber(),
          selling_price: product.b2cSellingPrice.toNumber(),
          discount_percentage: Math.round(discount * 100) / 100,
          max_quantity: product.b2cMaxQuantity,
          in_stock: product.b2cReservedStock > 0,
          available_stock: product.b2cReservedStock,
          category: product.category.name,
          subcategory: product.subcategory.name
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch product'
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects if present
    if (updateData.expiry_date) {
      updateData.expiry_date = new Date(updateData.expiry_date);
    }

    // Map field names to database column names
    const mappedData: any = {};
    if (updateData.category_id) mappedData.categoryId = updateData.category_id;
    if (updateData.subcategory_id) mappedData.subcategoryId = updateData.subcategory_id;
    if (updateData.quantity_per_unit) mappedData.quantityPerUnit = updateData.quantity_per_unit;
    if (updateData.b2c_mrp) mappedData.b2cMrp = updateData.b2c_mrp;
    if (updateData.b2c_selling_price) mappedData.b2cSellingPrice = updateData.b2c_selling_price;
    if (updateData.b2c_min_quantity) mappedData.b2cMinQuantity = updateData.b2c_min_quantity;
    if (updateData.b2c_max_quantity) mappedData.b2cMaxQuantity = updateData.b2c_max_quantity;
    if (updateData.b2b_base_price) mappedData.b2bBasePrice = updateData.b2b_base_price;
    if (updateData.b2b_min_order_qty) mappedData.b2bMinOrderQty = updateData.b2b_min_order_qty;
    if (updateData.b2b_max_order_qty !== undefined) mappedData.b2bMaxOrderQty = updateData.b2b_max_order_qty;
    if (updateData.b2b_bulk_tiers) mappedData.b2bBulkTiers = updateData.b2b_bulk_tiers;
    if (updateData.total_stock) mappedData.totalStock = updateData.total_stock;
    if (updateData.b2c_reserved_stock) mappedData.b2cReservedStock = updateData.b2c_reserved_stock;
    if (updateData.b2b_reserved_stock) mappedData.b2bReservedStock = updateData.b2b_reserved_stock;
    if (updateData.expiry_date) mappedData.expiryDate = updateData.expiry_date;
    if (updateData.is_vegetarian !== undefined) mappedData.isVegetarian = updateData.is_vegetarian;
    if (updateData.status) mappedData.status = updateData.status;

    // Copy other fields directly
    Object.keys(updateData).forEach(key => {
      if (!key.includes('_') || key === 'is_vegetarian') {
        if (!mappedData[key]) {
          mappedData[key] = updateData[key];
        }
      }
    });

    const product = await prisma.product.update({
      where: { id: productId },
      data: mappedData
    });

    res.json({
      status: 'success',
      product
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update product'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true, status: 'inactive' }
    });

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete product'
    });
  }
};

