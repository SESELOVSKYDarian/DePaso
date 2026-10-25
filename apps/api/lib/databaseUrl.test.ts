import { describe, expect, it } from "vitest";
import { serverlessDatabaseUrl } from "@depaso/database";

const SESSION = "postgresql://user:pass@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

describe("serverlessDatabaseUrl", () => {
  it("pasa el pooler de Supabase a transaction mode con pocas conexiones por instancia", () => {
    const url = new URL(serverlessDatabaseUrl(SESSION, true)!);
    expect(url.port).toBe("6543");
    expect(url.searchParams.get("pgbouncer")).toBe("true");
    expect(url.searchParams.get("connection_limit")).toBe("3");
  });

  it("no toca la URL fuera de serverless", () => {
    expect(serverlessDatabaseUrl(SESSION, false)).toBe(SESSION);
  });

  it("respeta un connection_limit ya configurado y otros hosts", () => {
    const url = new URL(serverlessDatabaseUrl("postgresql://u:p@db.example.com:5432/x?connection_limit=3", true)!);
    expect(url.port).toBe("5432");
    expect(url.searchParams.get("connection_limit")).toBe("3");
  });
});
