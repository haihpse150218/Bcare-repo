import { FastifyRequest, FastifyReply } from "fastify";
import { reviewsService } from "./reviews.service";
import { success } from "../../lib/response";
import { CreateReviewInput, UpdateReviewInput } from "@bcare/shared";

export async function createReviewController(
  request: FastifyRequest<{ Body: CreateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const review = await reviewsService.create(id, request.body);
    reply.status(201).send(success(review));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function updateReviewController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const review = await reviewsService.update(request.params.id, userId, request.body);
    reply.send(success(review));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function myReviewsController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await reviewsService.findMyReviews(id, page, limit);
    reply.send(success(result.reviews, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
