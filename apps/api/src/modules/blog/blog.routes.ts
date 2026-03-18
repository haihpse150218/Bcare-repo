import { FastifyInstance } from "fastify";
import {
  listPostsController,
  getPostBySlugController,
  createPostController,
  updatePostController,
  deletePostController,
  listCategoriesController,
  createCategoryController,
  listTagsController,
  createTagController,
} from "./blog.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, createBlogPostSchema, updateBlogPostSchema, CreateBlogPostInput, UpdateBlogPostInput } from "@bcare/shared";

export async function blogRoutes(app: FastifyInstance) {
  // Public
  app.get<{ Querystring: { page?: string; limit?: string; category?: string; tag?: string } }>("/api/posts", listPostsController);
  app.get<{ Params: { slug: string } }>("/api/posts/:slug", getPostBySlugController);
  app.get("/api/blog/categories", listCategoriesController);
  app.get("/api/blog/tags", listTagsController);

  // Admin only
  app.post<{ Body: CreateBlogPostInput }>("/api/posts", {
    preHandler: [authenticate, authorize(Role.ADMIN), validate(createBlogPostSchema)],
  }, createPostController);

  app.patch<{ Params: { id: string }; Body: UpdateBlogPostInput }>("/api/posts/:id", {
    preHandler: [authenticate, authorize(Role.ADMIN), validate(updateBlogPostSchema)],
  }, updatePostController);

  app.delete<{ Params: { id: string } }>("/api/posts/:id", {
    preHandler: [authenticate, authorize(Role.ADMIN)],
  }, deletePostController);

  app.post<{ Body: { name: string; slug: string } }>("/api/blog/categories", {
    preHandler: [authenticate, authorize(Role.ADMIN)],
  }, createCategoryController);

  app.post<{ Body: { name: string; slug: string } }>("/api/blog/tags", {
    preHandler: [authenticate, authorize(Role.ADMIN)],
  }, createTagController);
}
