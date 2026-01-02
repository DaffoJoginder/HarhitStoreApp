import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getFileUrl } from "../utils/fileUpload";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = getFileUrl(req.file.filename);
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        imageUrl: image_url,
      },
    });

    res.status(201).json({
      status: "success",
      category,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: "Category with this name already exists",
      });
    }
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create category",
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      status: "success",
      categories,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch categories",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, description, is_active } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = getFileUrl(req.file.filename);
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        description,
        imageUrl: image_url,
        isActive: is_active !== undefined ? is_active : true,
      },
    });

    res.json({
      status: "success",
      category,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update category",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    res.json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to delete category",
    });
  }
};

export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    const subcategory = await prisma.subcategory.create({
      data: {
        categoryId,
        name,
        description,
      },
    });

    res.status(201).json({
      status: "success",
      subcategory,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: "Subcategory with this name already exists in this category",
      });
    }
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create subcategory",
    });
  }
};

export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const subcategories = await prisma.subcategory.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({
      status: "success",
      subcategories,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch subcategories",
    });
  }
};

export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    const { subcategoryId } = req.params;
    const { name, description, is_active } = req.body;

    const subcategory = await prisma.subcategory.update({
      where: { id: subcategoryId },
      data: {
        name,
        description,
        isActive: is_active !== undefined ? is_active : true,
      },
    });

    res.json({
      status: "success",
      subcategory,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update subcategory",
    });
  }
};

export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    const { subcategoryId } = req.params;

    await prisma.subcategory.update({
      where: { id: subcategoryId },
      data: { isActive: false },
    });

    res.json({
      status: "success",
      message: "Subcategory deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to delete subcategory",
    });
  }
};
