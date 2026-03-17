import { FastifyInstance } from "fastify";
import {
  getMyClinicController,
  updateMyClinicController,
  listDoctorsController,
  addDoctorController,
  removeDoctorController,
  listStaffController,
  addStaffController,
  removeStaffController,
  getStatsController,
  getChartDataController,
  exportDataController,
} from "./clinic-management.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  Role,
  updateClinicProfileSchema,
  addDoctorToClinicSchema,
  addStaffToClinicSchema,
  UpdateClinicProfileInput,
  AddDoctorToClinicInput,
  AddStaffToClinicInput,
} from "@bcare/shared";

export async function clinicManagementRoutes(app: FastifyInstance) {
  // Clinic profile
  app.get("/api/clinics/my", {
    preHandler: [authenticate, authorize(Role.CLINIC)],
  }, getMyClinicController);

  app.put<{ Body: UpdateClinicProfileInput }>("/api/clinics/my", {
    preHandler: [authenticate, authorize(Role.CLINIC), validate(updateClinicProfileSchema)],
  }, updateMyClinicController);

  // Doctors
  app.get("/api/clinics/my/doctors", {
    preHandler: [authenticate, authorize(Role.CLINIC, Role.STAFF)],
  }, listDoctorsController);

  app.post<{ Body: AddDoctorToClinicInput }>("/api/clinics/my/doctors", {
    preHandler: [authenticate, authorize(Role.CLINIC), validate(addDoctorToClinicSchema)],
  }, addDoctorController);

  app.delete<{ Params: { doctorId: string } }>("/api/clinics/my/doctors/:doctorId", {
    preHandler: [authenticate, authorize(Role.CLINIC)],
  }, removeDoctorController);

  // Staff
  app.get("/api/clinics/my/staff", {
    preHandler: [authenticate, authorize(Role.CLINIC)],
  }, listStaffController);

  app.post<{ Body: AddStaffToClinicInput }>("/api/clinics/my/staff", {
    preHandler: [authenticate, authorize(Role.CLINIC), validate(addStaffToClinicSchema)],
  }, addStaffController);

  app.delete<{ Params: { staffId: string } }>("/api/clinics/my/staff/:staffId", {
    preHandler: [authenticate, authorize(Role.CLINIC)],
  }, removeStaffController);

  // Stats
  app.get<{ Querystring: { from?: string; to?: string } }>("/api/clinics/my/stats", {
    preHandler: [authenticate, authorize(Role.CLINIC, Role.STAFF)],
  }, getStatsController);

  app.get<{ Querystring: { period?: string } }>("/api/clinics/my/stats/chart", {
    preHandler: [authenticate, authorize(Role.CLINIC, Role.STAFF)],
  }, getChartDataController);

  app.get<{ Querystring: { format?: string; from?: string; to?: string } }>("/api/clinics/my/stats/export", {
    preHandler: [authenticate, authorize(Role.CLINIC)],
  }, exportDataController);
}
