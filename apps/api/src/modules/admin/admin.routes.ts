import { FastifyInstance } from "fastify";
import {
  dashboardController,
  listUsersController,
  updateUserController,
  listAppointmentsController,
  listPaymentsController,
  revenueReportController,
  listSpecialtiesController,
  createSpecialtyController,
  updateSpecialtyController,
  deleteSpecialtyController,
  verifyDoctorController,
  verifyClinicController,
} from "./admin.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { Role } from "@bcare/shared";

export async function adminRoutes(app: FastifyInstance) {
  const adminOnly = { preHandler: [authenticate, authorize(Role.ADMIN)] };

  app.get("/api/admin/dashboard", adminOnly, dashboardController);
  app.get<{ Querystring: { page?: string; limit?: string; role?: string; search?: string } }>("/api/admin/users", adminOnly, listUsersController);
  app.patch<{ Params: { id: string }; Body: { isVerified?: boolean; role?: string } }>("/api/admin/users/:id", adminOnly, updateUserController);
  app.get<{ Querystring: { page?: string; limit?: string; status?: string } }>("/api/admin/appointments", adminOnly, listAppointmentsController);
  app.get<{ Querystring: { page?: string; limit?: string; status?: string } }>("/api/admin/payments", adminOnly, listPaymentsController);
  app.get<{ Querystring: { period?: string } }>("/api/admin/reports", adminOnly, revenueReportController);
  app.get("/api/admin/specialties", adminOnly, listSpecialtiesController);
  app.post<{ Body: { name: string; slug: string; icon?: string; description?: string } }>("/api/admin/specialties", adminOnly, createSpecialtyController);
  app.patch<{ Params: { id: string }; Body: { name?: string; slug?: string; icon?: string; description?: string } }>("/api/admin/specialties/:id", adminOnly, updateSpecialtyController);
  app.delete<{ Params: { id: string } }>("/api/admin/specialties/:id", adminOnly, deleteSpecialtyController);
  app.patch<{ Params: { id: string }; Body: { status: "VERIFIED" | "REJECTED" } }>("/api/admin/doctors/:id/verify", adminOnly, verifyDoctorController);
  app.patch<{ Params: { id: string }; Body: { status: "VERIFIED" | "REJECTED" } }>("/api/admin/clinics/:id/verify", adminOnly, verifyClinicController);
}
