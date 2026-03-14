import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, {
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  });

  // Decorate with refresh secret for separate refresh token signing
  app.decorate("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production");

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Health check
  app.get("/api/health", async () => ({ status: "ok" }));

  return app;
}
