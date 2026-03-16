import { describe, it, expect, afterAll } from "vitest";
import { getApp, closeApp, loginAs } from "./helpers";

afterAll(closeApp);

describe("Auth API", () => {
  describe("POST /api/auth/login", () => {
    it("should login with valid patient credentials", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "patient@bcare.vn", password: "Patient@123456" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe("PATIENT");
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it("should login with valid doctor credentials", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "doctor1@bcare.vn", password: "Doctor@123456" },
      });

      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe("DOCTOR");
    });

    it("should login with valid staff credentials", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "staff@bcare.vn", password: "Staff@123456" },
      });

      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe("STAFF");
    });

    it("should login with valid admin credentials", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "admin@bcare.vn", password: "Admin@123456" },
      });

      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe("ADMIN");
    });

    it("should reject invalid password", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "patient@bcare.vn", password: "wrong" },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject non-existent email", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "nobody@bcare.vn", password: "Test@123456" },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return patient profile with valid token", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.role).toBe("PATIENT");
      expect(body.data.email).toBe("patient@bcare.vn");
    });

    it("should return doctor profile with valid token", async () => {
      const app = await getApp();
      const { token } = await loginAs("doctor");

      const res = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(body.data.role).toBe("DOCTOR");
    });

    it("should reject without token", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "GET",
        url: "/api/auth/me",
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /api/auth/me", () => {
    it("should update profile", async () => {
      const app = await getApp();
      const { token } = await loginAs("patient");

      const res = await app.inject({
        method: "PUT",
        url: "/api/auth/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { fullName: "Updated Name" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.fullName).toBe("Updated Name");

      // Restore original name
      await app.inject({
        method: "PUT",
        url: "/api/auth/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { fullName: "Nguyễn Văn Bệnh Nhân" },
      });
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh token", async () => {
      const app = await getApp();
      const { refreshToken } = await loginAs("patient");

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it("should reject invalid refresh token", async () => {
      const app = await getApp();
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken: "invalid-token" },
      });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
