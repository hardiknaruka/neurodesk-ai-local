import { describe, it, expect, beforeEach } from "vitest";
import { getStoredSession, saveSession, AuthSession } from "../lib/api";

// Simple in-memory localStorage polyfill for node test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "window", {
  value: globalThis,
  writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: storageMock,
  writable: true,
});

describe("Web Client Auth Session Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves auth session cleanly", () => {
    const mockSession: AuthSession = {
      accessToken: "test_token_123",
      user: {
        id: "u-1",
        email: "researcher@neurodesk.local",
        displayName: "Dr. Researcher",
      },
      workspace: {
        id: "w-1",
        name: "Bio-Informatics Lab",
      },
    };

    expect(getStoredSession()).toBeNull();
    saveSession(mockSession);
    const retrieved = getStoredSession();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.accessToken).toBe("test_token_123");
    expect(retrieved?.user.displayName).toBe("Dr. Researcher");
    expect(retrieved?.workspace.id).toBe("w-1");
  });
});
