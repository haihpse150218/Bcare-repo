import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp, loginAs } from "./helpers";

afterAll(closeApp);

describe("Doctors API", () => {
  describe("GET /api/doctors", () => {
    it("should return doctors list", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/doctors" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);

      const doctor = body.data[0];
      expect(doctor).toHaveProperty("slug");
      expect(doctor).toHaveProperty("user");
      expect(doctor).toHaveProperty("specialty");
      expect(doctor.user).toHaveProperty("fullName");
    });

    it("should filter by specialty slug", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/doctors?specialty=tim-mach" });

      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      body.data.forEach((d: any) => {
        expect(d.specialty.slug).toBe("tim-mach");
      });
    });

    it("should paginate", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/doctors?limit=2&page=1" });

      const body = JSON.parse(res.body);
      expect(body.data.length).toBeLessThanOrEqual(2);
      expect(body.meta).toHaveProperty("total");
      expect(body.meta).toHaveProperty("page");
    });
  });

  describe("GET /api/doctors/:slug", () => {
    it("should return doctor by slug", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.slug).toBe("doctor1");
      expect(body.data.user.fullName).toBeDefined();
      expect(body.data.specialty).toBeDefined();
    });

    it("should 404 for non-existent doctor", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/doctors/non-existent" });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/doctors/:id/schedules", () => {
    it("should return doctor schedules", async () => {
      const app = await getApp();
      // Get doctor ID first
      const docRes = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });
      const doctorId = JSON.parse(docRes.body).data.id;

      const res = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/schedules` });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);

      const schedule = body.data[0];
      expect(schedule).toHaveProperty("dayOfWeek");
      expect(schedule).toHaveProperty("startTime");
      expect(schedule).toHaveProperty("endTime");
      expect(schedule).toHaveProperty("slotDuration");
    });
  });

  describe("GET /api/doctors/:id/slots", () => {
    it("should return available slots for a weekday", async () => {
      const app = await getApp();
      const docRes = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });
      const doctorId = JSON.parse(docRes.body).data.id;

      // 2026-03-16 is a Monday
      const res = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/slots?date=2026-03-16` });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);

      const slot = body.data[0];
      expect(slot).toHaveProperty("time");
      expect(slot).toHaveProperty("available");
      expect(slot).toHaveProperty("scheduleId");
      expect(slot.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should return empty for weekend (no schedule)", async () => {
      const app = await getApp();
      const docRes = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });
      const doctorId = JSON.parse(docRes.body).data.id;

      // 2026-03-21 is a Saturday
      const res = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/slots?date=2026-03-21` });

      const body = JSON.parse(res.body);
      expect(body.data).toEqual([]);
    });

    it("should require date parameter", async () => {
      const app = await getApp();
      const docRes = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });
      const doctorId = JSON.parse(docRes.body).data.id;

      const res = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/slots` });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/doctors/:id/reviews", () => {
    it("should return reviews (may be empty)", async () => {
      const app = await getApp();
      const docRes = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });
      const doctorId = JSON.parse(docRes.body).data.id;

      const res = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/reviews` });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
    });
  });
});
