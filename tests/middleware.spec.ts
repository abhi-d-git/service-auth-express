import express from "express";
import request from "supertest";
import { describe, it, expect } from "vitest";
import {
  requireAuth,
  optionalAuth,
  requireAnyRole,
} from "../src/middleware.js";

function makeAuthCore(result: any) {
  return {
    doAuthorize: async (_input: any) => result,
  };
}

describe("service-auth-express middleware", () => {
  it("requireAuth returns 401 when token missing", async () => {
    const app = express();

    app.get(
      "/customer",
      requireAuth({ authCore: makeAuthCore({ ok: true }) as any }),
      (_req, res) => res.json({ ok: true }),
    );

    const r = await request(app).get("/customer");
    expect(r.status).toBe(401);
  });

  it("requireAuth attaches req.auth on success", async () => {
    const app = express();

    app.get(
      "/customer",
      requireAuth({
        authCore: makeAuthCore({
          ok: true,
          userId: "u-1",
          roles: ["ADMIN"],
          principal: "a@b.com",
          roleStamp: "etag-1",
          roleVersion: 3,
          claims: { sub: "u-1", roles: ["ADMIN"], rs: "etag-1" },
        }) as any,
      }),
      (req, res) =>
        res.json({ userId: req.auth?.userId, roles: req.auth?.roles }),
    );

    const r = await request(app)
      .get("/customer")
      .set("Authorization", "Bearer t");
    expect(r.status).toBe(200);
    expect(r.body.userId).toBe("u-1");
    expect(r.body.roles).toEqual(["ADMIN"]);
  });

  it("requireAnyRole returns 403 when core returns AUTH_FORBIDDEN", async () => {
    const app = express();

    app.get(
      "/admin",
      requireAnyRole(
        {
          authCore: makeAuthCore({
            ok: false,
            error: { code: "AUTH_FORBIDDEN", message: "nope" },
          }) as any,
        },
        "ADMIN",
      ),
      (_req, res) => res.json({ ok: true }),
    );

    const r = await request(app).get("/admin").set("Authorization", "Bearer t");
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("optionalAuth allows request when token missing", async () => {
    const app = express();

    app.get(
      "/public",
      optionalAuth({ authCore: makeAuthCore({ ok: true }) as any }),
      (req, res) => res.json({ auth: req.auth ?? null }),
    );

    const r = await request(app).get("/public");
    expect(r.status).toBe(200);
    expect(r.body.auth).toBe(null);
  });
});
