import { z } from "zod";
import { Role } from "../types";

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  fullName: z.string().min(2, "Tên tối thiểu 2 ký tự").max(100),
  role: z.enum([Role.PATIENT, Role.DOCTOR, Role.CLINIC]),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyPhoneSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6, "OTP phải có 6 chữ số"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
