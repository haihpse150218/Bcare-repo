import { z } from "zod";

export const updateClinicProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  district: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  phone: z.string().min(8).max(15).optional(),
  description: z.string().max(2000).optional(),
  operatingHours: z.record(z.string(), z.any()).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export const addDoctorToClinicSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const addStaffToClinicSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  position: z.string().min(1, "Chức vụ không được để trống").max(100),
  permissions: z.array(z.string()).default([]),
});

export type UpdateClinicProfileInput = z.infer<typeof updateClinicProfileSchema>;
export type AddDoctorToClinicInput = z.infer<typeof addDoctorToClinicSchema>;
export type AddStaffToClinicInput = z.infer<typeof addStaffToClinicSchema>;
