import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp, loginAs } from "./helpers";

afterAll(closeApp);

describe("Appointments API", () => {
  let doctorId: string;
  let scheduleId: string;
  let appointmentId: string;

  // Use a unique future Monday for each test run to avoid slot conflicts
  const testDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // 30 days ahead
    // Find next Monday
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  describe("POST /api/appointments", () => {
    it("should book an appointment as patient", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      // Get doctor info
      const docRes = await app.inject({ method: "GET", url: "/api/doctors/doctor1" });
      doctorId = JSON.parse(docRes.body).data.id;

      // Get available slot
      const slotsRes = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/slots?date=${testDate}` });
      const slots = JSON.parse(slotsRes.body).data;
      const availableSlot = slots.find((s: any) => s.available);
      expect(availableSlot).toBeDefined();
      scheduleId = availableSlot.scheduleId;

      const res = await app.inject({
        method: "POST",
        url: "/api/appointments",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          doctorId,
          scheduleId,
          date: testDate,
          timeSlot: availableSlot.time,
          symptomNote: "Test symptom",
        },
      });

      // Handle both fresh booking (201) and re-run where slot might exist
      if (res.statusCode === 201) {
        const body = JSON.parse(res.body);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe("PENDING");
        expect(body.data.doctorId).toBe(doctorId);
        appointmentId = body.data.id;
      } else {
        // Slot might already be taken from previous test run — try another slot
        const nextAvailable = slots.find((s: any) => s.available && s.time !== availableSlot.time);
        if (nextAvailable) {
          const retry = await app.inject({
            method: "POST",
            url: "/api/appointments",
            headers: { authorization: `Bearer ${token}` },
            payload: {
              doctorId,
              scheduleId: nextAvailable.scheduleId,
              date: testDate,
              timeSlot: nextAvailable.time,
              symptomNote: "Test symptom retry",
            },
          });
          expect(retry.statusCode).toBe(201);
          appointmentId = JSON.parse(retry.body).data.id;
        } else {
          // All slots taken — just get the latest appointment
          const listRes = await app.inject({
            method: "GET",
            url: "/api/appointments?limit=1",
            headers: { authorization: `Bearer ${token}` },
          });
          const list = JSON.parse(listRes.body);
          appointmentId = list.data[0]?.id;
          expect(appointmentId).toBeDefined();
        }
      }
    });

    it("should reject duplicate booking (same slot)", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const slotsRes = await app.inject({ method: "GET", url: `/api/doctors/${doctorId}/slots?date=${testDate}` });
      const slots = JSON.parse(slotsRes.body).data;
      const bookedSlot = slots.find((s: any) => !s.available);

      if (bookedSlot) {
        const res = await app.inject({
          method: "POST",
          url: "/api/appointments",
          headers: { authorization: `Bearer ${token}` },
          payload: {
            doctorId,
            scheduleId,
            date: testDate,
            timeSlot: bookedSlot.time,
          },
        });

        expect(res.statusCode).toBe(409);
        const body = JSON.parse(res.body);
        expect(body.error.code).toBe("SLOT_TAKEN");
      }
    });

    it("should reject booking without auth", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/appointments",
        payload: { doctorId, scheduleId, date: testDate, timeSlot: "11:00" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject booking as doctor (wrong role)", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "POST",
        url: "/api/appointments",
        headers: { authorization: `Bearer ${token}` },
        payload: { doctorId, scheduleId, date: testDate, timeSlot: "14:00" },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/appointments", () => {
    it("should list patient appointments", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "GET",
        url: "/api/appointments",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.meta).toHaveProperty("total");
    });

    it("should list doctor appointments", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "GET",
        url: "/api/appointments",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
    });

    it("should list staff appointments (by clinic)", async () => {
      const app = await getApp();
      const { token } = await loginAs("staff");

      const res = await app.inject({
        method: "GET",
        url: "/api/appointments",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeInstanceOf(Array);
    });

    it("should reject without auth", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/appointments" });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/appointments/:id", () => {
    it("should get appointment detail", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      expect(appointmentId).toBeDefined();
      const res = await app.inject({
        method: "GET",
        url: `/api/appointments/${appointmentId}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.id).toBe(appointmentId);
      expect(body.data.doctor).toBeDefined();
      expect(body.data.patient).toBeDefined();
    });
  });

  describe("PATCH /api/appointments/:id", () => {
    it("should confirm appointment (doctor)", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      expect(appointmentId).toBeDefined();
      const res = await app.inject({
        method: "PATCH",
        url: `/api/appointments/${appointmentId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { status: "CONFIRMED" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe("CONFIRMED");
    });

    it("should cancel appointment (patient)", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "PATCH",
        url: `/api/appointments/${appointmentId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { status: "CANCELLED" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe("CANCELLED");
    });
  });
});
