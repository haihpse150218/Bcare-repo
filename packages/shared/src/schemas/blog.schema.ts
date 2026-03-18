import { z } from "zod";

export const createBlogPostSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug không hợp lệ"),
  content: z.string().min(1, "Nội dung không được để trống"),
  thumbnailUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
  metaDescription: z.string().max(300).optional(),
  metaImage: z.string().url().optional(),
  isPublished: z.boolean().default(false),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  content: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  metaDescription: z.string().max(300).nullable().optional(),
  metaImage: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
