import { FastifyInstance } from "fastify";
import { listClinicsController, getClinicController, getClinicDoctorsController } from "./clinics.controller";

export async function clinicsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: string; limit?: string; city?: string; search?: string } }>("/api/clinics", listClinicsController);
  app.get<{ Params: { slug: string } }>("/api/clinics/:slug", getClinicController);
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>("/api/clinics/:id/doctors", getClinicDoctorsController);
}
