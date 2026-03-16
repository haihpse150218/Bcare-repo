import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp, loginAs } from "./helpers";

afterAll(closeApp);

describe("Notifications API", () => {
  describe("GET /api/notifications", () => {
    it("should list notifications for patient", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "GET",
        url: "/api/notifications",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty("notifications");
      expect(body.data).toHaveProperty("total");
      expect(body.data).toHaveProperty("unreadCount");
    });

    it("should list notifications for doctor", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "GET",
        url: "/api/notifications",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it("should reject without auth", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/notifications" });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("should mark all as read", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "PATCH",
        url: "/api/notifications/read-all",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });
});
