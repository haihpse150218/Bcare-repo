import { prisma } from "../../lib/prisma";
import { CreateBlogPostInput, UpdateBlogPostInput } from "@bcare/shared";

export class BlogService {
  async findAll(page = 1, limit = 10, categorySlug?: string, tag?: string, published = true) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (published) where.isPublished = true;
    if (categorySlug) where.category = { slug: categorySlug };
    if (tag) where.tags = { some: { tag: { slug: tag } } };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { fullName: true, avatarUrl: true } },
          category: { select: { name: true, slug: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return { posts, total, page, limit };
  }

  async findBySlug(slug: string) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { fullName: true, avatarUrl: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    });
    if (!post) throw { code: "NOT_FOUND", message: "Bài viết không tồn tại", status: 404 };
    return post;
  }

  async create(authorId: string, input: CreateBlogPostInput) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: input.slug } });
    if (existing) throw { code: "DUPLICATE", message: "Slug đã tồn tại", status: 409 };

    const { tagIds, ...data } = input;
    const post = await prisma.blogPost.create({
      data: {
        ...data,
        authorId,
        tags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: {
        author: { select: { fullName: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    });
    return post;
  }

  async update(postId: string, input: UpdateBlogPostInput) {
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) throw { code: "NOT_FOUND", message: "Bài viết không tồn tại", status: 404 };

    if (input.slug && input.slug !== post.slug) {
      const existing = await prisma.blogPost.findUnique({ where: { slug: input.slug } });
      if (existing) throw { code: "DUPLICATE", message: "Slug đã tồn tại", status: 409 };
    }

    const { tagIds, ...data } = input;

    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        ...data,
        ...(tagIds !== undefined && {
          tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: {
        author: { select: { fullName: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    });
    return updated;
  }

  async delete(postId: string) {
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) throw { code: "NOT_FOUND", message: "Bài viết không tồn tại", status: 404 };
    await prisma.blogPost.delete({ where: { id: postId } });
    return { deleted: true };
  }

  // Categories
  async listCategories() {
    return prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  }

  async createCategory(name: string, slug: string) {
    return prisma.blogCategory.create({ data: { name, slug } });
  }

  // Tags
  async listTags() {
    return prisma.blogTag.findMany({ orderBy: { name: "asc" } });
  }

  async createTag(name: string, slug: string) {
    return prisma.blogTag.create({ data: { name, slug } });
  }
}

export const blogService = new BlogService();
