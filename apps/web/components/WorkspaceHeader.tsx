"use client";

import React from "react";
import { Search, Plus, Cpu } from "lucide-react";

interface WorkspaceHeaderProps {
  onNewChat?: () => void;
}

export function WorkspaceHeader({ onNewChat }: WorkspaceHeaderProps) {
  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-brand-pale bg-brand-white px-6">
      {/* Brand & Search */}
      <div className="flex items-center gap-6">
        <span className="text-base font-bold tracking-tight text-brand-navy">
          NeuroDesk <span className="text-brand-blue">AI</span>
        </span>

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
          <input
            type="search"
            placeholder="Search workspace, documents, notes..."
            className="w-full rounded-md border border-brand-pale bg-brand-pale/30 py-1.5 pl-9 pr-4 text-xs text-brand-navy placeholder:text-brand-gray focus:border-brand-blue focus:bg-brand-white focus:outline-none"
            aria-label="Workspace search"
          />
        </div>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Model Status Badge */}
        <div
          className="flex items-center gap-2 rounded-full border border-brand-pale bg-brand-pale/40 px-3 py-1 text-xs font-medium text-brand-navy"
          title="Inference provider status"
        >
          <Cpu className="h-3.5 w-3.5 text-brand-teal" />
          <span>Local mode · Ollama</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal"></span>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-brand-white shadow-sm hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
}
