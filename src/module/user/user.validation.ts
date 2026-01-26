import { z } from 'zod';
import {  USER_ROLE } from './user.constant';

const createUserZodSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, "Name must be at least 2 characters"),

    email: z
      .string()
      .email("Invalid email format")
      .optional(),

    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),

    photo: z
      .string({required_error:"photo is not required"})
      .optional(),

    role: z
      .enum(
        Object.values(USER_ROLE) as [
          (typeof USER_ROLE)[keyof typeof USER_ROLE],
          ...(typeof USER_ROLE)[keyof typeof USER_ROLE][]
        ],
        {
          invalid_type_error: "Invalid role value",
        }
      )
      .default(USER_ROLE.user),

    os: z.string().optional().nullable(),

    browser: z.string().optional().nullable(),

    device: z.string().optional().nullable(),

    isVerify: z.boolean().optional().default(false),

    ipAddress: z
      .string()
      .ip({ version: "v4" })
      .optional()
      .nullable(),
  }),
});

const UserVerification = z.object({
  body: z.object({
    verificationCode: z
      .string({ required_error: 'varification code is required' })
      .min(6, { message: 'min 6 character accepted' }),
  }),
});

const ChnagePasswordSchema = z.object({
  body: z.object({
    newpassword: z
      .string({ required_error: 'new password is required' })
      .min(6, { message: 'min 6 character accepted' }),
    oldpassword: z
      .string({ required_error: 'old password is  required' })
      .min(6, { message: 'min 6 character accepted' }),
  }),
});

const UpdateUserProfileSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: 'user name is required' })
      .min(3, { message: 'min 3 character accepted' })
      .max(15, { message: 'max 15 character accepted' })
      .optional(),
    photo: z.string({ required_error: 'optional photot' }).url().optional(),
  }),
});

const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is Required' })
      .email('Invalid email format')
      .refine(
        (email) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        {
          message: 'Invalid email format',
        },
      ),
  }),
});

const verificationCodeSchema = z.object({
  body: z.object({
    verificationCode: z
      .number({ required_error: ' verificationCode is require' })
      .min(4, { message: 'min 4  number accepted' }),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'userId is require' }),
    password: z.string({ required_error: 'password is require' }),
  }),
});

const UserValidationSchema = {
  createUserZodSchema,
  UserVerification,
  ChnagePasswordSchema,
  UpdateUserProfileSchema,
  ForgotPasswordSchema,
  verificationCodeSchema,
  resetPasswordSchema,
};

export default UserValidationSchema;
