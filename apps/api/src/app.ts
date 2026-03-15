import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./modules/auth/auth.routes";
import { specialtiesRoutes } from "./modules/specialties/specialties.routes";
import { doctorsRoutes } from "./modules/doctors/doctors.routes";
import { clinicsRoutes } from "./modules/clinics/clinics.routes";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { schedulesRoutes } from "./modules/doctors/schedules.routes";

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

  await app.register(authRoutes);
  await app.register(specialtiesRoutes);
  await app.register(doctorsRoutes);
  await app.register(clinicsRoutes);
  await app.register(appointmentsRoutes);
  await app.register(notificationsRoutes);
  await app.register(schedulesRoutes);

  return app;
}
