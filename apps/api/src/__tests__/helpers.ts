import { buildApp } from "../app";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

export async function getApp() {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export async function closeApp() {
  if (app) {
    await app.close();
  }
}

export async function loginAs(role: "patient" | "doctor" | "staff" | "admin") {
  const credentials: Record<string, { email: string; password: string }> = {
    patient: { email: "patient@bcare.vn", password: "Patient@123456" },
    doctor: { email: "doctor1@bcare.vn", password: "Doctor@123456" },
    staff: { email: "staff@bcare.vn", password: "Staff@123456" },
    admin: { email: "admin@bcare.vn", password: "Admin@123456" },
  };

  const app = await getApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: credentials[role],
  });

  const body = JSON.parse(res.body);
  if (!body.success) throw new Error(`Login failed for ${role}: ${body.error?.message}`);
  return body.data;
}
