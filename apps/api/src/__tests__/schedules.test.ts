import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp, loginAs } from "./helpers";

afterAll(closeApp);

describe("Schedules API (Doctor)", () => {
  let newScheduleId: string;

  describe("GET /api/my-schedules", () => {
    it("should list doctor schedules", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "GET",
        url: "/api/my-schedules",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("should reject for patient role", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "GET",
        url: "/api/my-schedules",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(403);
    });

    it("should reject without auth", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/my-schedules" });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/my-schedules", () => {
    it("should create a new schedule (Saturday)", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "POST",
        url: "/api/my-schedules",
        headers: { authorization: `Bearer ${token}` },
        payload: { dayOfWeek: 6, startTime: "08:00", endTime: "12:00", slotDuration: 30 },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.dayOfWeek).toBe(6);
      expect(body.data.startTime).toBe("08:00");
      newScheduleId = body.data.id;
    });
  });

  describe("DELETE /api/my-schedules/:id", () => {
    it("should delete schedule", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "DELETE",
        url: `/api/my-schedules/${newScheduleId}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });
});
