/**
 * Phase 0 security regression tests for the prototype API.
 * Runs the real router against the JSON-file fallback database in a temp dir.
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import express from "express";

let app: express.Express;
let tokens: Record<string, string> = {};

async function login(kind: string, username: string, password: string) {
  return request(app).post("/api/auth/login").send({ kind, username, password });
}

beforeAll(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-test-"));
  process.chdir(dir);
  for (const k of ["DB_HOST", "DB_USER", "DB_NAME", "INSTALLER_ENABLED"]) delete process.env[k];
  process.env.ADMIN_USERNAME = "root_admin";
  process.env.ADMIN_PASSWORD = "very-long-admin-pass";

  const { default: apiRouter } = await import("../../server/routes/api");
  const { errorHandler } = await import("../../server/middleware/error");
  const { dbSaveItem } = await import("../../server/config/database");

  app = express();
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(errorHandler);

  // Legacy-style rows with plain-text passwords, as the prototype stored them.
  await dbSaveItem("tenants", { id: "gym_a", name: "Gym A", username: "owner_a", password: "pass-a", status: "ACTIVE" });
  await dbSaveItem("tenants", { id: "gym_b", name: "Gym B", username: "owner_b", password: "pass-b", status: "ACTIVE" });
  await dbSaveItem("tenants", { id: "gym_s", name: "Gym S", username: "owner_s", password: "pass-s", status: "SUSPENDED" });
  await dbSaveItem("members", { id: "m_a1", name: "A1", username: "ath_a1", password: "123", clubId: "gym_a" });
  await dbSaveItem("members", { id: "m_a2", name: "A2", username: "ath_a2", password: "123", clubId: "gym_a" });
  await dbSaveItem("members", { id: "m_b1", name: "B1", username: "ath_b1", password: "123", clubId: "gym_b" });
  await dbSaveItem("coaches", { id: "c_a", name: "Coach A", username: "coach_a", password: "123", clubId: "gym_a" });

  for (const [kind, u, p] of [
    ["admin", "root_admin", "very-long-admin-pass"],
    ["tenant", "owner_a", "pass-a"],
    ["member", "ath_a1", "123"],
    ["coach", "coach_a", "123"],
  ] as const) {
    const res = await login(kind, u, p);
    expect(res.status, `${kind} login`).toBe(200);
    tokens[kind] = res.body.token;
  }
});

const auth = (kind: string) => ({ Authorization: `Bearer ${tokens[kind]}` });

describe("installer", () => {
  it("is disabled by default", async () => {
    const res = await request(app).post("/api/installer/save-admin").send({ username: "pwn", password: "pwnpwnpwnpwn" });
    expect(res.status).toBe(403);
  });

  it("status no longer leaks configuration", async () => {
    const res = await request(app).get("/api/installer/status");
    expect(res.body).toEqual({ installerEnabled: false, isDbConnected: false });
  });
});

describe("authentication", () => {
  it("rejects wrong passwords and unknown users", async () => {
    expect((await login("tenant", "owner_a", "wrong")).status).toBe(401);
    expect((await login("member", "nobody", "123")).status).toBe(401);
    expect((await login("admin", "root_admin", "nope")).status).toBe(401);
  });

  it("blocks suspended gyms", async () => {
    expect((await login("tenant", "owner_s", "pass-s")).status).toBe(403);
  });

  it("re-hashes legacy plain-text passwords on login and still accepts them", async () => {
    const { dbGetItem } = await import("../../server/config/database");
    const row = await dbGetItem("tenants", "gym_a");
    expect(row.password).toMatch(/^\$2[aby]\$/);
    expect((await login("tenant", "owner_a", "pass-a")).status).toBe(200);
  });

  it("never returns password fields in login profiles", async () => {
    const res = await login("member", "ath_a2", "123");
    expect(res.body.profile.password).toBeUndefined();
  });
});

describe("/api/db reads", () => {
  it("requires login for gym data", async () => {
    expect((await request(app).get("/api/db/members")).status).toBe(401);
    expect((await request(app).get("/api/db/tenants")).status).toBe(401);
  });

  it("keeps public tables public", async () => {
    expect((await request(app).get("/api/db/blog_posts")).status).toBe(200);
  });

  it("isolates gyms and strips passwords", async () => {
    const res = await request(app).get("/api/db/members").set(auth("tenant"));
    expect(res.status).toBe(200);
    const ids = res.body.map((m: any) => m.id).sort();
    expect(ids).toEqual(["m_a1", "m_a2"]);
    expect(res.body.every((m: any) => m.password === undefined)).toBe(true);
  });

  it("shows an athlete only their own member row", async () => {
    const res = await request(app).get("/api/db/members").set(auth("member"));
    expect(res.body.map((m: any) => m.id)).toEqual(["m_a1"]);
  });

  it("shows the super admin everything, still without passwords", async () => {
    const res = await request(app).get("/api/db/members").set(auth("admin"));
    expect(res.body).toHaveLength(3);
    expect(res.body.every((m: any) => m.password === undefined)).toBe(true);
  });

  it("keeps support chats and settings admin-only", async () => {
    expect((await request(app).get("/api/db/smart_support_chats").set(auth("tenant"))).status).toBe(403);
    expect((await request(app).get("/api/db/smart_support_chats").set(auth("admin"))).status).toBe(200);
  });
});

describe("/api/db writes", () => {
  it("rejects anonymous writes and deletes", async () => {
    expect((await request(app).post("/api/db/members").send({ id: "x", name: "x", clubId: "gym_a" })).status).toBe(401);
    expect((await request(app).post("/api/db/members/batch").send([])).status).toBe(401);
    expect((await request(app).delete("/api/db/members/m_a1")).status).toBe(401);
  });

  it("forbids writing into another gym", async () => {
    const res = await request(app).post("/api/db/members").set(auth("tenant")).send({ id: "m_b1", name: "hijack" });
    expect(res.status).toBe(403);
    const newRow = await request(app).post("/api/db/members").set(auth("tenant")).send({ id: "m_new", name: "n", clubId: "gym_b" });
    expect(newRow.status).toBe(403);
  });

  it("assigns new rows to the caller's gym and hashes passwords", async () => {
    const res = await request(app).post("/api/db/members").set(auth("tenant")).send({ id: "m_a3", name: "A3", username: "ath_a3", password: "secret1" });
    expect(res.status).toBe(200);
    const { dbGetItem } = await import("../../server/config/database");
    const row = await dbGetItem("members", "m_a3");
    expect(row.clubId).toBe("gym_a");
    expect(row.password).toMatch(/^\$2[aby]\$/);
    expect((await login("member", "ath_a3", "secret1")).status).toBe(200);
  });

  it("keeps the existing password when an update omits it", async () => {
    await request(app).post("/api/db/members").set(auth("tenant")).send({ id: "m_a3", name: "A3 renamed" });
    expect((await login("member", "ath_a3", "secret1")).status).toBe(200);
  });

  it("batch skips rows the caller may not write", async () => {
    const res = await request(app)
      .post("/api/db/members/batch")
      .set(auth("tenant"))
      .send([{ id: "m_a1", name: "ok" }, { id: "m_b1", name: "nope" }]);
    expect(res.body).toMatchObject({ count: 1, skipped: 1 });
  });

  it("does not let a gym owner change its own plan or status", async () => {
    await request(app).post("/api/db/tenants").set(auth("tenant")).send({ id: "gym_a", name: "Gym A+", status: "ACTIVE", planName: "Free Forever" });
    const { dbGetItem } = await import("../../server/config/database");
    const row = await dbGetItem("tenants", "gym_a");
    expect(row.name).toBe("Gym A+");
    expect(row.planName).toBeUndefined();
  });

  it("only lets athletes edit their own record", async () => {
    expect((await request(app).post("/api/db/members").set(auth("member")).send({ id: "m_a2", name: "x" })).status).toBe(403);
    expect((await request(app).post("/api/db/members").set(auth("member")).send({ id: "m_a1", name: "Me" })).status).toBe(200);
  });

  it("forbids deleting another gym's rows", async () => {
    expect((await request(app).delete("/api/db/members/m_b1").set(auth("tenant"))).status).toBe(403);
  });

  it("rejects platform settings changes from non-admins", async () => {
    expect((await request(app).post("/api/platform/settings").send({ platformTheme: "x" })).status).toBe(401);
    expect((await request(app).post("/api/platform/settings").set(auth("tenant")).send({ platformTheme: "x" })).status).toBe(403);
  });
});

describe("platform settings", () => {
  it("never exposes or accepts admin credentials", async () => {
    await request(app).post("/api/platform/settings").set(auth("admin")).send({ admin_password: "x", platformTheme: "emerald" });
    const res = await request(app).get("/api/platform/settings");
    expect(res.body.platformTheme).toBe("emerald");
    expect(Object.keys(res.body).some((k) => k.startsWith("admin_"))).toBe(false);
  });
});

describe("guest support chat", () => {
  const id = "sc_1762500000000_abc12";

  it("lets a guest create and read their own chat but never post as admin", async () => {
    const post = await request(app)
      .post("/api/support-chat")
      .send({ id, userName: "Guest", messages: [{ id: "u1", sender: "user", text: "hi" }, { id: "a1", sender: "admin", text: "fake" }] });
    expect(post.status).toBe(200);
    const get = await request(app).get(`/api/support-chat/${id}`);
    expect(get.body.messages.map((m: any) => m.sender)).toEqual(["user"]);
  });

  it("rejects malformed chat ids", async () => {
    expect((await request(app).get("/api/support-chat/../../etc")).status).toBe(404);
    expect((await request(app).get("/api/support-chat/x")).status).toBe(400);
  });
});

describe("AI endpoints", () => {
  it("require login", async () => {
    expect((await request(app).post("/api/ai/chat").send({ messages: [] })).status).toBe(401);
  });
});
