import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp } from "./helpers";

afterAll(closeApp);

describe("Clinics API", () => {
  describe("GET /api/clinics", () => {
    it("should return clinics list", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/clinics" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);

      const clinic = body.data[0];
      expect(clinic).toHaveProperty("name");
      expect(clinic).toHaveProperty("slug");
      expect(clinic).toHaveProperty("address");
    });
  });

  describe("GET /api/clinics/:slug", () => {
    it("should return clinic by slug", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/clinics/phong-kham-da-khoa-sai-gon" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.name).toContain("Sài Gòn");
      expect(body.data.doctors).toBeDefined();
    });

    it("should 404 for non-existent clinic", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/clinics/non-existent" });

      expect(res.statusCode).toBe(404);
    });
  });
});
