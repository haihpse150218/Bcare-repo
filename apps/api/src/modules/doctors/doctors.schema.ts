import { z } from "zod";

export const listDoctorsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  specialty: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["rating", "experience", "fee"]).default("rating"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListDoctorsInput = z.infer<typeof listDoctorsSchema>;
