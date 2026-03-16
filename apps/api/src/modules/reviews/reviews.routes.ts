import { FastifyInstance } from "fastify";
import { createReviewController, updateReviewController, myReviewsController } from "./reviews.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, createReviewSchema, updateReviewSchema } from "@bcare/shared";

export async function reviewsRoutes(app: FastifyInstance) {
  app.post("/api/reviews", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(createReviewSchema)],
    config: { rateLimit: { max: 5, timeWindow: "1 hour" } },
  }, createReviewController);

  app.put<{ Params: { id: string } }>("/api/reviews/:id", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(updateReviewSchema)],
  }, updateReviewController);

  app.get("/api/reviews/my", {
    preHandler: [authenticate, authorize(Role.PATIENT)],
  }, myReviewsController);
}
