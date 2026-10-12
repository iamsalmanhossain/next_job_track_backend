import prisma from '../../config/prisma.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from './auth.utils.js';
import { env } from '../../config/env.js';
import httpStatus from 'http-status';
import { AppError } from '../../shared/AppError.js';
import { generateOtp, verifyOtp } from '../../shared/otp.service.js';
import { sendEmail, emailTemplates } from '../../shared/email.service.js';
import { OAuth2Client } from 'google-auth-library';
import type { TLogin, TRegister, TResetPassword, TUpdateProfile, TGoogleLogin } from './auth.validation.js';

import { auditLogService } from '../audit-log/audit-log.service.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const googleLogin = async (data: TGoogleLogin & { ipAddress?: string; userAgent?: string }) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: data.idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid Google token');
  }

  const { email, name, picture, sub: googleId } = payload;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create new user if they don't exist
    user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        profileImage: picture || null,
        emailVerified: true,
        profile: {
          create: {}
        },
        accounts: {
          create: {
            provider: 'google',
            providerAccountId: googleId,
          }
        }
      }
    });
  } else {
    // Check if account is linked
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleId,
        }
      }
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleId,
        }
      });
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
    }
  }

  const accessToken = generateToken({ userId: user.id }, env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const refreshToken = generateToken({ userId: user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  // Session Management
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    }
  });

  // Audit Log
  auditLogService.createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    entity: 'USER',
    entityId: user.id,
    description: 'User logged in with Google',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return { user: { id: user.id, email: user.email, name: user.name, profileImage: user.profileImage }, accessToken, refreshToken };
};

const register = async (data: TRegister) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'Email already in use');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name ?? null,
      profile: {
        create: {}
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  });

  // Generate Redis OTP (2 minutes expiry) and send real email
  const otp = await generateOtp(user.email, 'verify_email', 120);
  await sendEmail(user.email, 'Verify your email address', emailTemplates.verificationEmail(otp));

  return { user };
};

const verifyEmail = async (email: string, otp: string) => {
  const isValid = await verifyOtp(email, otp, 'verify_email');

  if (!isValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  const user = await prisma.user.update({
    where: { email },
    data: {emailVerified: true},
    // select: { emailVerified: true }
  });

  return { message: 'Email verified successfully', user };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is already verified');
  }

  // Generate Redis OTP (2 minutes expiry) and send real email
  const otp = await generateOtp(user.email, 'verify_email', 120);
  await sendEmail(user.email, 'Verify your email address', emailTemplates.verificationEmail(otp));

  return { message: 'OTP resent successfully' };
};

const login = async (data: TLogin & { ipAddress?: string; userAgent?: string }) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.password) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  const isMatch = await comparePassword(data.password, user.password);
  if (!isMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, 'Please verify your email first');
  }

  const accessToken = generateToken({ userId: user.id }, env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const refreshToken = generateToken({ userId: user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  // Session Management
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
    select: { id: true }
  });

  // Audit Log
  auditLogService.createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    entity: 'USER',
    entityId: user.id,
    description: 'User logged in',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return {  user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken };
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't leak user existence
    return { message: 'OTP sent successfully' };
  }

  const otp = await generateOtp(email, 'reset_password', 120);
  await sendEmail(email, 'Reset your password', emailTemplates.passwordResetEmail(otp));

  return { message: 'OTP sent successfully' };
};

const resetPassword = async (data: TResetPassword) => {
  const isValid = await verifyOtp(data.email, data.otp, 'reset_password');

  if (!isValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  const hashedPassword = await hashPassword(data.newPassword);
  
  // Update password and clear sessions (logout from all devices)
  await prisma.$transaction([
    prisma.user.update({
      where: { email: data.email },
      data: { password: hashedPassword },
    }),
    prisma.session.deleteMany({
      where: { user: { email: data.email } }
    })
  ]);

  return { message: 'Password reset successfully' };
};

const logout = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }
  await prisma.session.deleteMany({ where: { refreshToken } });
  return { message: 'Logged out successfully' };
};

const logoutAll = async (userId: string) => {
  await prisma.session.deleteMany({ where: { userId } });
  return { message: 'Logged out from all devices' };
};

const updateProfile = async (userId: string, data: TUpdateProfile) => {
  const profile = await prisma.profile.update({
    where: { userId },
    data: {
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.headline !== undefined && { headline: data.headline }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl }),
      ...(data.githubUrl !== undefined && { githubUrl: data.githubUrl }),
      ...(data.skills !== undefined && { skills: data.skills }),
    },
    select: {
      phone: true,
      location: true,
      bio: true,
      headline: true,
      website: true,
      linkedinUrl: true,
      githubUrl: true,
      skills: true,
      updatedAt: true,
    }
  });
  
  if (data.name !== undefined || data.profileImage !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
      },
    });
  }

  return profile;
};

const getProfile = async (userId: string) => {
  if (!userId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User ID is required to get profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      isDeleted: true,
      profile: true,
    }
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Remove isDeleted from response
  const { isDeleted, ...userProfile } = user;

  return userProfile;
};

const deleteProfile = async (userId: string) => {
  if (!userId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User ID is required to delete profile');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Soft delete user
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true, deletedAt: new Date(), status: 'SUSPENDED' }
    }),
    prisma.session.deleteMany({
      where: { userId }
    })
  ]);

  return { message: 'Profile deleted successfully' };
};

const createAdmin = async (data: TRegister, isSetup: boolean = false) => {
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' }
  });

  if (isSetup && adminCount > 0) {
    throw new AppError(httpStatus.FORBIDDEN, 'Admin already exists. Setup route is locked.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'Email already in use');
  }

  const hashedPassword = await hashPassword(data.password);

  const adminUser = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name ?? null,
      role: 'ADMIN',
      emailVerified: true, 
      profile: {
        create: {}
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    }
  });

  return adminUser;
};

const adminLogin = async (data: TLogin & { ipAddress?: string; userAgent?: string }) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  
  if (!user || !user.password) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  if (user.role !== 'ADMIN') {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied. You do not have admin privileges.');
  }

  const isMatch = await comparePassword(data.password, user.password);
  if (!isMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  const accessToken = generateToken({ userId: user.id }, env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const refreshToken = generateToken({ userId: user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), 
    }
  });

  auditLogService.createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    entity: 'SYSTEM',
    entityId: user.id,
    description: 'Admin logged into the dashboard',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return {
    admin: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken
  };
};

const refreshToken = async (incomingRefreshToken: string) => {
  if (!incomingRefreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  // 1. Verify token signature and expiration
  let decoded: any;
  try {
    decoded = verifyToken(incomingRefreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  // 2. Check if session exists in DB and is not expired
  const session = await prisma.session.findUnique({
    where: { refreshToken: incomingRefreshToken },
    include: { user: true },
  });

  if (!session) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Session not found or has been revoked');
  }

  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new AppError(httpStatus.UNAUTHORIZED, 'Session has expired, please log in again');
  }

  if (session.user.isDeleted || session.user.status !== 'ACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'User account is inactive or deleted');
  }

  // 3. Generate fresh access token
  const newAccessToken = generateToken(
    { userId: session.userId },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );

  return {
    accessToken: newAccessToken,
  };
};

export const authService = {
  register,
  verifyEmail,
  resendOtp,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  updateProfile,
  getProfile,
  deleteProfile,
  createAdmin,
  adminLogin,
  refreshToken,
};

