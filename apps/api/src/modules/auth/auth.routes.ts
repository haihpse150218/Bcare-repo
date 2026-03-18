import { FastifyInstance } from "fastify";
import { registerController, loginController, refreshController, meController, updateMeController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { registerSchema, loginSchema, refreshTokenSchema, RegisterInput, LoginInput } from "@bcare/shared";

export async function authRoutes(app: FastifyInstance) {
  const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

  app.post<{ Body: RegisterInput }>("/api/auth/register", { ...authRateLimit, preHandler: [validate(registerSchema)] }, registerController);
  app.post<{ Body: LoginInput }>("/api/auth/login", { ...authRateLimit, preHandler: [validate(loginSchema)] }, loginController);
  app.post<{ Body: { refreshToken: string } }>("/api/auth/refresh", { ...authRateLimit, preHandler: [validate(refreshTokenSchema)] }, refreshController);
  app.get("/api/auth/me", { preHandler: [authenticate] }, meController);
  app.put<{ Body: { fullName?: string; phone?: string } }>("/api/auth/me", { preHandler: [authenticate] }, updateMeController);
}
