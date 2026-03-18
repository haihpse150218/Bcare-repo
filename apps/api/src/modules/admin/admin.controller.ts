import { FastifyRequest, FastifyReply } from "fastify";
import { adminService } from "./admin.service";
import { success } from "../../lib/response";

export async function dashboardController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await adminService.getDashboard();
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listUsersController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; role?: string; search?: string } }>,
  reply: FastifyReply
) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await adminService.listUsers(page, limit, request.query.role, request.query.search);
    reply.send(success(result.users, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updateUserController(
  request: FastifyRequest<{ Params: { id: string }; Body: { isVerified?: boolean; role?: string } }>,
  reply: FastifyReply
) {
  try {
    const user = await adminService.updateUser(request.params.id, request.body);
    reply.send(success(user));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listAppointmentsController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; status?: string } }>,
  reply: FastifyReply
) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await adminService.listAppointments(page, limit, request.query.status);
    reply.send(success(result.appointments, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listPaymentsController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; status?: string } }>,
  reply: FastifyReply
) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await adminService.listPayments(page, limit, request.query.status);
    reply.send(success(result.payments, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function revenueReportController(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  try {
    const period = (request.query.period || "month") as "week" | "month" | "year";
    const data = await adminService.getRevenueReport(period);
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listSpecialtiesController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await adminService.listSpecialties();
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function createSpecialtyController(
  request: FastifyRequest<{ Body: { name: string; slug: string; icon?: string; description?: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await adminService.createSpecialty(request.body);
    reply.status(201).send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updateSpecialtyController(
  request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; slug?: string; icon?: string; description?: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await adminService.updateSpecialty(request.params.id, request.body);
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function deleteSpecialtyController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await adminService.deleteSpecialty(request.params.id);
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function verifyDoctorController(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: "VERIFIED" | "REJECTED" } }>,
  reply: FastifyReply
) {
  try {
    const data = await adminService.verifyDoctor(request.params.id, request.body.status);
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function verifyClinicController(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: "VERIFIED" | "REJECTED" } }>,
  reply: FastifyReply
) {
  try {
    const data = await adminService.verifyClinic(request.params.id, request.body.status);
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}
