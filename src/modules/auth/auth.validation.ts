import { z } from 'zod';

export const authValidation = {
  register: z.object({
    email: z.string(),
    password: z.string().min(6),
    name: z.string().optional(),
  }),
  login: z.object({
    email: z.string(),
    password: z.string(),
  }),
  googleLogin: z.object({
    idToken: z.string(),
  }),
  verifyEmail: z.object({
    otp: z.string(),
    email: z.string(),
  }),
  resendOtp: z.object({
    email: z.string(),
  }),
  forgotPassword: z.object({
    email: z.string(),
  }),
  resetPassword: z.object({
    otp: z.string(),
    email: z.string(),
    newPassword: z.string().min(6),
  }),
  updateProfile: z.object({
    name: z.string().optional(),
    profileImage: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    headline: z.string().optional(),
    website: z.string().optional(),
    linkedinUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    skills: z.string().optional(),
  }),
  refreshToken: z.object({
    refreshToken: z.string({ message: 'Refresh token is required' }),
  }),
};

export type TRegister = z.infer<typeof authValidation.register>;
export type TLogin = z.infer<typeof authValidation.login>;
export type TVerifyEmail = z.infer<typeof authValidation.verifyEmail>;
export type TResendOtp = z.infer<typeof authValidation.resendOtp>;
export type TForgotPassword = z.infer<typeof authValidation.forgotPassword>;
export type TResetPassword = z.infer<typeof authValidation.resetPassword>;
export type TUpdateProfile = z.infer<typeof authValidation.updateProfile>;
export type TGoogleLogin = z.infer<typeof authValidation.googleLogin>;
export type TRefreshToken = z.infer<typeof authValidation.refreshToken>;
