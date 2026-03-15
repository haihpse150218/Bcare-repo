import { FastifyRequest, FastifyReply } from "fastify";
import { clinicsService } from "./clinics.service";
import { success } from "../../lib/response";

export async function listClinicsController(request: FastifyRequest<{ Querystring: { page?: string; limit?: string; city?: string; search?: string } }>, reply: FastifyReply) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await clinicsService.findAll(page, limit, request.query.city, request.query.search);
    reply.send(success(result.clinics, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getClinicController(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  try {
    const clinic = await clinicsService.findBySlug(request.params.slug);
    reply.send(success(clinic));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getClinicDoctorsController(request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await clinicsService.getDoctors(request.params.id, page, limit);
    reply.send(success(result.doctors, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
