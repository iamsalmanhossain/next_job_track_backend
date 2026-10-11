import express, { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authValidation } from './auth.validation.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router:Router = express.Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest(authValidation.register),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(authValidation.login),
  authController.login
);

router.post(
  '/google-login',
  authRateLimiter,
  validateRequest(authValidation.googleLogin),
  authController.googleLogin
);

router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshToken),
  authController.refreshToken
);

router.post(
  '/verify-email',
  validateRequest(authValidation.verifyEmail),
  authController.verifyEmail
);

router.post(
  '/resend-otp',
  authRateLimiter,
  validateRequest(authValidation.resendOtp),
  authController.resendOtp
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest(authValidation.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validateRequest(authValidation.resetPassword),
  authController.resetPassword
);

import { auth } from '../../middleware/auth.js';

router.post(
  '/logout',
  auth(),
  authController.logout
);

router.post(
  '/logout-all',
  auth(),
  authController.logoutAll
);

router.get(
  '/profile',
  auth(),
  authController.getProfile
);

router.patch(
  '/profile',
  auth(),
  validateRequest(authValidation.updateProfile),
  authController.updateProfile
);

router.delete(
  '/profile',
  auth(),
  authController.deleteProfile
);

// --- ADMIN ROUTES ---

router.post(
  '/admin/setup',
  authRateLimiter,
  validateRequest(authValidation.register),
  authController.setupAdmin
);

router.post(
  '/admin/create-admin',
  auth('ADMIN'),
  validateRequest(authValidation.register),
  authController.createAdmin
);

router.post(
  '/admin/login',
  authRateLimiter,
  validateRequest(authValidation.login),
  authController.adminLogin
);

export const authRoutes = router;
