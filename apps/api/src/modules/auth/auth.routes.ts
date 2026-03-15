import { FastifyInstance } from "fastify";
import { registerController, loginController, refreshController, meController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { registerSchema, loginSchema, refreshTokenSchema, RegisterInput, LoginInput } from "@bcare/shared";

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterInput }>("/api/auth/register", { preHandler: [validate(registerSchema)] }, registerController);
  app.post<{ Body: LoginInput }>("/api/auth/login", { preHandler: [validate(loginSchema)] }, loginController);
  app.post<{ Body: { refreshToken: string } }>("/api/auth/refresh", { preHandler: [validate(refreshTokenSchema)] }, refreshController);
  app.get("/api/auth/me", { preHandler: [authenticate] }, meController);
}
