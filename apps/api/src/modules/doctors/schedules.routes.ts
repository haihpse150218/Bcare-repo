import { FastifyInstance } from "fastify";
import { createScheduleController, updateScheduleController, deleteScheduleController, listMySchedulesController } from "./schedules.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { Role } from "@bcare/shared";

export async function schedulesRoutes(app: FastifyInstance) {
  app.get("/api/doctors/my-schedules", { preHandler: [authenticate, authorize(Role.DOCTOR)] }, listMySchedulesController);
  app.post<{ Body: { dayOfWeek: number; startTime: string; endTime: string; slotDuration?: number } }>("/api/doctors/schedules", { preHandler: [authenticate, authorize(Role.DOCTOR)] }, createScheduleController);
  app.put<{ Params: { id: string }; Body: { startTime?: string; endTime?: string; slotDuration?: number; isActive?: boolean } }>("/api/doctors/schedules/:id", { preHandler: [authenticate, authorize(Role.DOCTOR)] }, updateScheduleController);
  app.delete<{ Params: { id: string } }>("/api/doctors/schedules/:id", { preHandler: [authenticate, authorize(Role.DOCTOR)] }, deleteScheduleController);
}
