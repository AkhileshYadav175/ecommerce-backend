import { z } from 'zod';

// Shared password complexity validation
const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(100, { message: 'Password cannot exceed 100 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(100, { message: 'Full name cannot exceed 100 characters' }),
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    .optional()
    .or(z.literal('')), // Allows optional or empty string
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, { message: 'Old password is required' }),
  new_password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, { message: 'Verification token is required' }),
});
