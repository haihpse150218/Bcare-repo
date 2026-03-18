import { FastifyRequest, FastifyReply } from "fastify";
import { blogService } from "./blog.service";
import { success } from "../../lib/response";
import { CreateBlogPostInput, UpdateBlogPostInput } from "@bcare/shared";

export async function listPostsController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; category?: string; tag?: string } }>,
  reply: FastifyReply
) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "10");
    const result = await blogService.findAll(page, limit, request.query.category, request.query.tag);
    reply.send(success(result.posts, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getPostBySlugController(
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) {
  try {
    const post = await blogService.findBySlug(request.params.slug);
    reply.send(success(post));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function createPostController(
  request: FastifyRequest<{ Body: CreateBlogPostInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const post = await blogService.create(id, request.body);
    reply.status(201).send(success(post));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updatePostController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateBlogPostInput }>,
  reply: FastifyReply
) {
  try {
    const post = await blogService.update(request.params.id, request.body);
    reply.send(success(post));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function deletePostController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const result = await blogService.delete(request.params.id);
    reply.send(success(result));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listCategoriesController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const categories = await blogService.listCategories();
    reply.send(success(categories));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function createCategoryController(
  request: FastifyRequest<{ Body: { name: string; slug: string } }>,
  reply: FastifyReply
) {
  try {
    const category = await blogService.createCategory(request.body.name, request.body.slug);
    reply.status(201).send(success(category));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listTagsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const tags = await blogService.listTags();
    reply.send(success(tags));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function createTagController(
  request: FastifyRequest<{ Body: { name: string; slug: string } }>,
  reply: FastifyReply
) {
  try {
    const tag = await blogService.createTag(request.body.name, request.body.slug);
    reply.status(201).send(success(tag));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}
