import { describe, it, expect } from "vitest";
import { GET } from "../app/api/health/route";

describe("GET /api/health", () => {
  it("should return ok status and Local mode · Ollama mode", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.service).toBe("web");
    expect(data.mode).toBe("Local mode · Ollama");
    expect(data.timestamp).toBeDefined();
  });
});
