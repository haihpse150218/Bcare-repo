import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import { RegisterInput, LoginInput } from "@bcare/shared";
import { success } from "../../lib/response";

export async function registerController(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
  try {
    const user = await authService.register(request.body);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "15m" });
    const refreshToken = await reply.jwtSign({ id: user.id, type: "refresh" }, { expiresIn: "7d" });
    reply.status(201).send(success({ user, token, refreshToken }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function loginController(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
  try {
    const user = await authService.login(request.body);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "15m" });
    const refreshToken = await reply.jwtSign({ id: user.id, type: "refresh" }, { expiresIn: "7d" });
    reply.send(success({ user, token, refreshToken }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function refreshController(request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
  try {
    const decoded = request.server.jwt.verify<{ id: string; type: string }>(request.body.refreshToken);
    if (decoded.type !== "refresh") throw { code: "INVALID_TOKEN", message: "Token không hợp lệ", status: 401 };

    const user = await authService.getProfile(decoded.id);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "15m" });
    const newRefreshToken = await reply.jwtSign({ id: user.id, type: "refresh" }, { expiresIn: "7d" });
    reply.send(success({ user, token, refreshToken: newRefreshToken }));
  } catch (err: any) {
    reply.status(err.status || 401).send({
      success: false,
      error: { code: err.code || "INVALID_TOKEN", message: err.message || "Token không hợp lệ" },
    });
  }
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    const user = await authService.getProfile(id);
    reply.send(success(user));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
