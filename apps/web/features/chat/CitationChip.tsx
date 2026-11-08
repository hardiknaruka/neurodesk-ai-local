"use client";

import React from "react";
import { FileText } from "lucide-react";
import { CitationItem } from "@/lib/api";

interface CitationChipProps {
  citation: CitationItem;
  onSelect?: (citation: CitationItem) => void;
}

export function CitationChip({ citation, onSelect }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(citation)}
      className="inline-flex items-center gap-1.5 rounded-md border border-brand-blue/20 bg-brand-pale/60 px-2 py-0.5 text-[11px] font-medium text-brand-navy transition-all hover:border-brand-blue hover:bg-brand-pale hover:text-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
      title={`Source: ${citation.filename} (Page ${citation.page})\nClick to inspect excerpt.`}
    >
      <FileText className="h-3 w-3 text-brand-blue" />
      <span className="truncate max-w-[140px] font-semibold">{citation.filename}</span>
      <span className="text-brand-gray">· p. {citation.page}</span>
    </button>
  );
}

