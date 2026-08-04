import { Router } from 'express';
import { UserController } from '../controller/user.controller.js';
import { authenticate, requireRole } from '../../../middlewares/auth.middleware.js';

const router = Router();
const userController = new UserController();

// Apply administrative restriction to all routes
router.use(authenticate as any);
router.use(requireRole(['admin']) as any);

router.get('/', userController.getUsers);
router.get('/stats', userController.getStats);
router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.patch('/:id/block', userController.blockUser);
router.patch('/:id/unblock', userController.unblockUser);
router.delete('/:id', userController.softDeleteUser);
router.patch('/:id/restore', userController.restoreUser);

export default router;
