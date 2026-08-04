import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate as any, authController.logout as any);
router.post('/logout-all', authenticate as any, authController.logoutAll as any);
router.post('/refresh', authController.refreshToken);
router.get('/profile', authenticate as any, authController.getProfile as any);
router.post('/change-password', authenticate as any, authController.changePassword as any);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticate as any, authController.resendVerification as any);

export default router;
