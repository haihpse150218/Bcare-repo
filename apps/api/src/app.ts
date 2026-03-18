import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { authRoutes } from "./modules/auth/auth.routes";
import { specialtiesRoutes } from "./modules/specialties/specialties.routes";
import { doctorsRoutes } from "./modules/doctors/doctors.routes";
import { clinicsRoutes } from "./modules/clinics/clinics.routes";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { schedulesRoutes } from "./modules/doctors/schedules.routes";
import { reviewsRoutes } from "./modules/reviews/reviews.routes";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { medicalRecordsRoutes } from "./modules/medical-records/medical-records.routes";
import { clinicManagementRoutes } from "./modules/clinic-management/clinic-management.routes";
import { chatRoutes } from "./modules/chat/chat.routes";
import { registerChatWebSocket } from "./modules/chat/chat.websocket";
import { generateVideoTokenController } from "./modules/chat/video-call.controller";
import { blogRoutes } from "./modules/blog/blog.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { authenticate } from "./middleware/authenticate";
import { authorize } from "./middleware/authorize";
import { Role } from "@bcare/shared";

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, {
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, // CSP managed by Next.js
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

  await app.register(websocket);

  // Health check
  app.get("/api/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(specialtiesRoutes);
  await app.register(doctorsRoutes);
  await app.register(clinicsRoutes);
  await app.register(appointmentsRoutes);
  await app.register(notificationsRoutes);
  await app.register(schedulesRoutes);
  await app.register(reviewsRoutes);
  await app.register(paymentsRoutes);
  await app.register(medicalRecordsRoutes);
  await app.register(clinicManagementRoutes);
  await app.register(chatRoutes);
  await app.register(blogRoutes);
  await app.register(adminRoutes);

  // WebSocket chat
  await registerChatWebSocket(app);

  // Video call token
  app.post<{ Body: { conversationId: string } }>("/api/video-call/token", {
    preHandler: [authenticate, authorize(Role.PATIENT, Role.DOCTOR)],
  }, generateVideoTokenController);

  return app;
}
