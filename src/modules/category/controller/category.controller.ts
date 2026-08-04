import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../service/category.service.js';
import { createCategorySchema, getCategoriesQuerySchema, updateCategorySchema } from '../validation/category.validation.js';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Create a new category.
   */
  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createCategorySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const category = await this.categoryService.createCategory(parseResult.data);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get flat paginated list of categories.
   */
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = getCategoriesQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const result = await this.categoryService.getCategories(parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get hierarchical categories structured as a tree.
   */
  getCategoryTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tree = await this.categoryService.getCategoryTree();

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get details of a single category by ID.
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const category = await this.categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category properties.
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parseResult = updateCategorySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const category = await this.categoryService.updateCategory(id, parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft-delete a category and all its children.
   */
  softDeleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.categoryService.softDeleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category and all its subcategories have been soft-deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore a soft-deleted category and its parents.
   */
  restoreCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.categoryService.restoreCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category and its parent pathway restored successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set category is_featured to true.
   */
  featureCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.categoryService.setFeaturedStatus(id, true);

      res.status(200).json({
        success: true,
        message: 'Category featured successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set category is_featured to false.
   */
  unfeatureCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.categoryService.setFeaturedStatus(id, false);

      res.status(200).json({
        success: true,
        message: 'Category unfeatured successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}
