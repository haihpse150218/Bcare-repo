import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@bcare/shared";

export function authorize(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: Role };
    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập" },
      });
    }
  };
}
