import { FastifyInstance } from "fastify";
import { listDoctorsController, getDoctorController, getDoctorSchedulesController, getDoctorReviewsController } from "./doctors.controller";
import { ListDoctorsInput } from "./doctors.schema";

export async function doctorsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ListDoctorsInput }>("/api/doctors", listDoctorsController);
  app.get<{ Params: { slug: string } }>("/api/doctors/:slug", getDoctorController);
  app.get<{ Params: { id: string } }>("/api/doctors/:id/schedules", getDoctorSchedulesController);
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>("/api/doctors/:id/reviews", getDoctorReviewsController);
}
