import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { calculateB2BPrice } from "../utils/pricing";
import { getFileUrl } from "../utils/fileUpload";

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
      b2b_reserved_stock,
    } = req.body;

    // Validate B2B price is less than B2C price
    // Convert strings to correct types (FormData sends everything as string)
    const isVegetarian = is_vegetarian === "true" || is_vegetarian === true;
    const b2cMrp = Number(b2c_mrp);
    const b2cSellingPrice = Number(b2c_selling_price);
    const b2cMinQty = Number(b2c_min_quantity);
    const b2cMaxQty = Number(b2c_max_quantity);
    const b2bBasePrice = Number(b2b_base_price);
    const b2bMinQty = Number(b2b_min_order_qty);
    const b2bMaxQty = Number(b2b_max_order_qty);
    const totalStock = Number(total_stock);
    const qtyPerUnit = quantity_per_unit ? Number(quantity_per_unit) : 1;

    // Validate B2B price is less than B2C price
    if (b2bBasePrice >= b2cSellingPrice) {
      return res.status(400).json({
        status: "error",
        message: "B2B base price must be less than B2C selling price",
      });
    }

    // Handle file uploads
    let productImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      productImages = (req.files as Express.Multer.File[]).map((file) =>
        getFileUrl(file.filename)
      );
    }

    // Calculate reserved stock if not provided
    const b2cReserved = b2c_reserved_stock
      ? Number(b2c_reserved_stock)
      : Math.floor(totalStock * 0.3);
    const b2bReserved = b2b_reserved_stock
      ? Number(b2b_reserved_stock)
      : Math.floor(totalStock * 0.7);

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        categoryId: category_id,
        subcategoryId: subcategory_id,
        brand,
        description,
        unit,
        quantityPerUnit: qtyPerUnit,
        images: productImages,
        isVegetarian,
        expiryDate: expiry_date ? new Date(expiry_date) : null,
        b2cMrp: b2cMrp,
        b2cSellingPrice: b2cSellingPrice,
        b2cMinQuantity: b2cMinQty || 1,
        b2cMaxQuantity: b2cMaxQty || 10,
        b2bBasePrice: b2bBasePrice,
        b2bMinOrderQty: b2bMinQty,
        b2bMaxOrderQty: b2bMaxQty,
        b2bBulkTiers: [], // TODO: Handle JSON parsing for tiers if needed
        totalStock: totalStock,
        b2cReservedStock: b2cReserved,
        b2bReservedStock: b2bReserved,
      },
    });

    res.status(201).json({
      status: "success",
      product_id: product.id,
      message: "Product created with tiered pricing",
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: "Product with this SKU already exists",
      });
    }
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create product",
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const accountType = (req.query.account_type as string) || "b2c";
    const categoryId = req.query.category_id as string;
    const subcategoryId = req.query.subcategory_id as string;
    const search = req.query.search as string;

    const where: any = {
      isDeleted: false,
      status: "active",
    };

    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response based on account type
    const formattedProducts = products.map((product) => {
      if (accountType === "b2b") {
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
          available_stock: product.b2bReservedStock,
        };
      } else {
        // B2C
        const discount =
          ((product.b2cMrp.toNumber() - product.b2cSellingPrice.toNumber()) /
            product.b2cMrp.toNumber()) *
          100;
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
          available_stock: product.b2cReservedStock,
        };
      }
    });

    res.json({
      status: "success",
      products: formattedProducts,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch products",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const accountType = (req.query.account_type as string) || "b2c";

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        subcategory: true,
      },
    });

    if (!product || product.isDeleted) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // Format response based on account type
    if (accountType === "b2b") {
      res.json({
        status: "success",
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
          subcategory: product.subcategory.name,
        },
      });
    } else {
      const discount =
        ((product.b2cMrp.toNumber() - product.b2cSellingPrice.toNumber()) /
          product.b2cMrp.toNumber()) *
        100;
      res.json({
        status: "success",
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
          subcategory: product.subcategory.name,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch product",
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
    if (updateData.category_id)
      mappedData.category = { connect: { id: updateData.category_id } };
    if (updateData.subcategory_id)
      mappedData.subcategory = { connect: { id: updateData.subcategory_id } };
    if (updateData.quantity_per_unit)
      mappedData.quantityPerUnit = Number(updateData.quantity_per_unit);
    if (updateData.b2c_mrp) mappedData.b2cMrp = Number(updateData.b2c_mrp);
    if (updateData.b2c_selling_price)
      mappedData.b2cSellingPrice = Number(updateData.b2c_selling_price);
    if (updateData.b2c_min_quantity)
      mappedData.b2cMinQuantity = Number(updateData.b2c_min_quantity);
    if (updateData.b2c_max_quantity)
      mappedData.b2cMaxQuantity = Number(updateData.b2c_max_quantity);
    if (updateData.b2b_base_price)
      mappedData.b2bBasePrice = Number(updateData.b2b_base_price);
    if (updateData.b2b_min_order_qty)
      mappedData.b2bMinOrderQty = Number(updateData.b2b_min_order_qty);
    if (updateData.b2b_max_order_qty !== undefined)
      mappedData.b2bMaxOrderQty = Number(updateData.b2b_max_order_qty);
    if (updateData.b2b_bulk_tiers)
      mappedData.b2bBulkTiers = updateData.b2b_bulk_tiers;
    if (updateData.total_stock)
      mappedData.totalStock = Number(updateData.total_stock);
    if (updateData.b2c_reserved_stock)
      mappedData.b2cReservedStock = Number(updateData.b2c_reserved_stock);
    if (updateData.b2b_reserved_stock)
      mappedData.b2bReservedStock = Number(updateData.b2b_reserved_stock);
    if (updateData.expiry_date) mappedData.expiryDate = updateData.expiry_date;
    if (updateData.is_vegetarian !== undefined)
      mappedData.isVegetarian =
        updateData.is_vegetarian === "true" ||
        updateData.is_vegetarian === true;
    if (updateData.status) mappedData.status = updateData.status;

    // Copy other fields directly
    // Copy other fields directly
    Object.keys(updateData).forEach((key) => {
      // Exclude keys with underscores (handled manually or not needed) and specific fields we processed
      if (!key.includes("_")) {
        if (mappedData[key] === undefined) {
          // Only copy if not already manually mapped (though mappedData uses camelCase mostly)
          // But updateData is likely snake_case or mixed?
          // Actually, the keys we care about copying are like 'name', 'brand', 'sku' etc which don't have underscores.
          // So !key.includes("_") is good.
          // We must ensure we don't overwrite anything.
          mappedData[key] = updateData[key];
        }
      }
    });

    // Handle file uploads
    if (
      req.files &&
      Array.isArray(req.files) &&
      (req.files as any[]).length > 0
    ) {
      const newImages = (req.files as Express.Multer.File[]).map((file) =>
        getFileUrl(file.filename)
      );

      // Fetch existing product to get current images
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { images: true },
      });

      const currentImages = Array.isArray(existingProduct?.images)
        ? (existingProduct?.images as any[])
            .flat()
            .filter((img) => typeof img === "string" && img.trim() !== "")
        : [];

      mappedData.images = [...currentImages, ...newImages];
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: mappedData,
    });

    res.json({
      status: "success",
      product,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update product",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true, status: "inactive" },
    });

    res.json({
      status: "success",
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to delete product",
    });
  }
};
