import { FastifyRequest, FastifyReply } from "fastify";
import { specialtiesService } from "./specialties.service";
import { success } from "../../lib/response";

export async function listSpecialtiesController(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const specialties = await specialtiesService.findAll();
    reply.send(success(specialties));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getSpecialtyController(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  try {
    const specialty = await specialtiesService.findBySlug(request.params.slug);
    reply.send(success(specialty));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
