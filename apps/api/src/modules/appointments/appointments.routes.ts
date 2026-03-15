import { FastifyInstance } from "fastify";
import {
  createAppointmentController,
  listAppointmentsController,
  getAppointmentController,
  updateAppointmentController,
} from "./appointments.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createAppointmentSchema, updateAppointmentSchema, CreateAppointmentInput, UpdateAppointmentInput } from "@bcare/shared";
import { Role } from "@bcare/shared";

export async function appointmentsRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateAppointmentInput }>(
    "/api/appointments",
    { preHandler: [authenticate, authorize(Role.PATIENT), validate(createAppointmentSchema)] },
    createAppointmentController
  );
  app.get("/api/appointments", { preHandler: [authenticate] }, listAppointmentsController);
  app.get<{ Params: { id: string } }>(
    "/api/appointments/:id",
    { preHandler: [authenticate] },
    getAppointmentController
  );
  app.patch<{ Params: { id: string }; Body: UpdateAppointmentInput }>(
    "/api/appointments/:id",
    { preHandler: [authenticate, validate(updateAppointmentSchema)] },
    updateAppointmentController
  );
}
