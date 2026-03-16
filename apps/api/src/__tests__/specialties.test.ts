import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp } from "./helpers";

afterAll(closeApp);

describe("Specialties API", () => {
  describe("GET /api/specialties", () => {
    it("should return all specialties", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/specialties" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);

      const specialty = body.data[0];
      expect(specialty).toHaveProperty("id");
      expect(specialty).toHaveProperty("name");
      expect(specialty).toHaveProperty("slug");
      expect(specialty).toHaveProperty("_count");
    });
  });

  describe("GET /api/specialties/:slug", () => {
    it("should return specialty by slug", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/specialties/tim-mach" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.name).toBe("Tim mạch");
      expect(body.data.slug).toBe("tim-mach");
    });

    it("should 404 for non-existent specialty", async () => {
      const app = await getApp();
      const res = await app.inject({ method: "GET", url: "/api/specialties/non-existent" });

      expect(res.statusCode).toBe(404);
    });
  });
});
