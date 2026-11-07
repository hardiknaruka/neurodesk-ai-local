"use client";

import React from "react";
import { UploadCloud, FileText, CheckCircle2, ShieldAlert, HardDrive } from "lucide-react";

export function ContextPanel() {
  return (
    <aside
      className="flex h-full w-80 flex-col border-l border-brand-pale bg-brand-white"
      aria-label="Context and Sources"
    >
      <div className="flex h-14 items-center justify-between border-b border-brand-pale px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-navy">
          Context & Sources
        </h2>
        <span className="text-[11px] text-brand-gray">0 active</span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Upload Dropzone */}
        <div>
          <label className="mb-2 block text-xs font-medium text-brand-navy">
            Add Documents
          </label>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-brand-blue/30 bg-brand-pale/20 p-5 text-center hover:bg-brand-pale/40 transition-colors cursor-pointer">
            <UploadCloud className="mb-2 h-7 w-7 text-brand-blue" />
            <span className="text-xs font-medium text-brand-navy">
              Click to upload or drag files
            </span>
            <span className="mt-1 text-[11px] text-brand-gray">
              PDF, DOCX, TXT, Markdown (Max 50MB)
            </span>
          </div>
        </div>

        {/* Source List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-brand-navy">Indexed Sources</span>
            <span className="text-[11px] text-brand-gray">Workspace scope</span>
          </div>
          <div className="rounded-md border border-brand-pale bg-brand-white p-3 text-center">
            <p className="text-xs text-brand-gray">No sources in current context</p>
            <p className="mt-1 text-[11px] text-brand-gray/80">
              Upload files above to ground answers with citations
            </p>
          </div>
        </div>

        {/* Local Model Status Card */}
        <div className="rounded-lg border border-brand-pale bg-brand-pale/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-navy">Inference Engine</span>
            <span className="inline-flex items-center gap-1 rounded bg-brand-teal/10 px-2 py-0.5 text-[11px] font-medium text-brand-teal">
              <CheckCircle2 className="h-3 w-3" /> Local
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-brand-gray">
              <span>Runtime:</span>
              <span className="font-medium text-brand-navy">Ollama</span>
            </div>
            <div className="flex justify-between text-brand-gray">
              <span>Default model:</span>
              <span className="font-medium text-brand-navy">Llama 3 (8B)</span>
            </div>
            <div className="flex justify-between text-brand-gray">
              <span>Storage mode:</span>
              <span className="font-medium text-brand-navy">ChromaDB (local)</span>
            </div>
          </div>
        </div>

        {/* Privacy & Cloud Fallback Notice */}
        <div className="rounded-lg border border-brand-pale bg-brand-white p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy">
            <HardDrive className="h-3.5 w-3.5 text-brand-blue" />
            <span>Local-First Privacy</span>
          </div>
          <p className="text-[11px] leading-relaxed text-brand-gray">
            All documents, vectors, and graph relationships remain on your machine. Cloud inference is <span className="font-semibold text-brand-navy">Off</span>.
          </p>
        </div>
      </div>
    </aside>
  );
}
