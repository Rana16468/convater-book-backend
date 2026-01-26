import { z } from "zod";
import { USER_ACCESSIBILITY } from "../user/user.constant";

const LoginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "email is required" }).email(),
    password: z
      .string({ required_error: "password is required" })
      .min(6, { message: "min 6 character accepted" }),
  }),
  fcm: z.string({ required_error: "fcm is not required" }).optional(),
});

const requestTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: "Refresh Token is Required" }),
  }),
});

const forgetPasswordValidation = z.object({
  body: z.object({
    email: z.string({ required_error: "email is required" }).email(),
  }),
});

const resetVerification = z.object({
  body: z.object({
    verificationCode: z
      .number({ required_error: "varification code is required" })
      .min(6, { message: "min 6 character accepted" })
      .optional(),
    newpassword: z
      .string({ required_error: "new password is required" })
      .min(6, { message: "min 6 charcter accepted" })
      .optional(),
  }),
});

const changeMyProfileSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "user name is required" })
      .min(3, { message: "min 3 character accepted" })
      .max(50, { message: "max 15 character accepted" })
      .optional(),

    phoneNumber: z.string({ required_error: "phoene number is option" }).optional(),
    address: z.string({ required_error: "address is not required" }).optional(),
    photo: z.string({ required_error: "optional photot" }).optional(),
    dateOfBirth: z
      .string({
        required_error: "Date of birth is required",
      })
      .optional(),
  }),
});


const changeUserAccountStatus = z.object({
  body: z.object({
    status: z
    .enum([
      USER_ACCESSIBILITY.isProgress,
      USER_ACCESSIBILITY.blocked,
    ])
   
  }),
});


const LoginValidationSchema = {
  LoginSchema,
  requestTokenValidationSchema,
  forgetPasswordValidation,
  resetVerification,
  changeMyProfileSchema,
  changeUserAccountStatus 
};
export default LoginValidationSchema;