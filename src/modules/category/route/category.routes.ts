import { Router } from 'express';
import { CategoryController } from '../controller/category.controller.js';
import { authenticate, requireRole } from '../../../middlewares/auth.middleware.js';

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);

// Admin-only routes
router.post('/', authenticate as any, requireRole(['admin']) as any, categoryController.createCategory);
router.patch('/:id', authenticate as any, requireRole(['admin']) as any, categoryController.updateCategory);
router.delete('/:id', authenticate as any, requireRole(['admin']) as any, categoryController.softDeleteCategory);
router.patch('/:id/restore', authenticate as any, requireRole(['admin']) as any, categoryController.restoreCategory);
router.patch('/:id/feature', authenticate as any, requireRole(['admin']) as any, categoryController.featureCategory);
router.patch('/:id/unfeature', authenticate as any, requireRole(['admin']) as any, categoryController.unfeatureCategory);

export default router;
