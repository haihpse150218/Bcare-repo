import { FastifyRequest, FastifyReply } from "fastify";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request[source];
      const parsed = schema.parse(data);
      (request as any)[source] = parsed;
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: err.errors.map((e) => e.message).join(", "),
          },
        });
      }
    }
  };
}
