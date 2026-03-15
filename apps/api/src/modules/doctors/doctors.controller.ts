import { FastifyRequest, FastifyReply } from "fastify";
import { doctorsService } from "./doctors.service";
import { listDoctorsSchema, ListDoctorsInput } from "./doctors.schema";
import { success } from "../../lib/response";

export async function listDoctorsController(request: FastifyRequest<{ Querystring: ListDoctorsInput }>, reply: FastifyReply) {
  try {
    const input = listDoctorsSchema.parse(request.query);
    const result = await doctorsService.findAll(input);
    reply.send(success(result.doctors, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getDoctorController(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  try {
    const doctor = await doctorsService.findBySlug(request.params.slug);
    reply.send(success(doctor));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getDoctorSchedulesController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const schedules = await doctorsService.getSchedules(request.params.id);
    reply.send(success(schedules));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getDoctorReviewsController(request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) {
  try {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await doctorsService.getReviews(request.params.id, page, limit);
    reply.send(success(result.reviews, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
