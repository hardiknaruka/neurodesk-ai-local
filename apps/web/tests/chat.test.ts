import { describe, it, expect } from "vitest";
import { CitationItem } from "../lib/api";

describe("Chat & Citation Structures", () => {
  it("formats citation metadata cleanly", () => {
    const citation: CitationItem = {
      documentId: "doc-123",
      filename: "quantum_mechanics.pdf",
      page: 4,
      snippet: "Superposition allows states to exist simultaneously until measured.",
    };

    expect(citation.documentId).toBe("doc-123");
    expect(citation.filename).toBe("quantum_mechanics.pdf");
    expect(citation.page).toBe(4);
    expect(citation.snippet).toContain("Superposition");
  });
});

