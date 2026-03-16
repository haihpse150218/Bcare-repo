import { FastifyInstance } from "fastify";
import { createReviewController, updateReviewController, myReviewsController } from "./reviews.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, createReviewSchema, updateReviewSchema, CreateReviewInput, UpdateReviewInput } from "@bcare/shared";

export async function reviewsRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateReviewInput }>("/api/reviews", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(createReviewSchema)],
    config: { rateLimit: { max: 5, timeWindow: "1 hour" } },
  }, createReviewController);

  app.put<{ Params: { id: string }; Body: UpdateReviewInput }>("/api/reviews/:id", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(updateReviewSchema)],
  }, updateReviewController);

  app.get<{ Querystring: { page?: string; limit?: string } }>("/api/reviews/my", {
    preHandler: [authenticate, authorize(Role.PATIENT)],
  }, myReviewsController);
}
