import { FastifyInstance } from "fastify";
import { listSpecialtiesController, getSpecialtyController } from "./specialties.controller";

export async function specialtiesRoutes(app: FastifyInstance) {
  app.get("/api/specialties", listSpecialtiesController);
  app.get<{ Params: { slug: string } }>("/api/specialties/:slug", getSpecialtyController);
}
