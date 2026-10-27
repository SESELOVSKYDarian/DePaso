import { beforeAll, describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt";

beforeAll(() => {
  process.env.AUTH_SESSION_SECRET = "test-secret";
});

const inFuture = () => Math.floor(Date.now() / 1000) + 600;

describe("jwt access token", () => {
  it("acepta un token firmado y vigente", () => {
    const token = signAccessToken({ sub: "u1", sid: "s1", exp: inFuture() });
    expect(verifyAccessToken(token)).toMatchObject({ sub: "u1", sid: "s1" });
  });

  it("rechaza un token vencido", () => {
    const token = signAccessToken({ sub: "u1", sid: "s1", exp: Math.floor(Date.now() / 1000) - 5 });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("rechaza un payload alterado", () => {
    const token = signAccessToken({ sub: "u1", sid: "s1", exp: inFuture() });
    const [head, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin", sid: "s1", exp: inFuture() })).toString("base64url");
    expect(verifyAccessToken(`${head}.${forged}.${signature}`)).toBeNull();
  });

  it("rechaza basura", () => {
    expect(verifyAccessToken("abc")).toBeNull();
    expect(verifyAccessToken("a.b.c")).toBeNull();
  });
});
