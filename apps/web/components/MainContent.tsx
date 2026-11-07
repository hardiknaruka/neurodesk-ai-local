"use client";

import React, { useState } from "react";
import {
  Send,
  Paperclip,
  Compass,
  FileSearch,
  BookMarked,
  Sparkles,
  Layers,
  Cpu,
} from "lucide-react";

interface MainContentProps {
  activeNav: string;
}

export function MainContent({ activeNav }: MainContentProps) {
  const [inputMessage, setInputMessage] = useState("");

  const quickActions = [
    { label: "Summarize sources", icon: FileSearch },
    { label: "Compare ideas", icon: Layers },
    { label: "Create study notes", icon: BookMarked },
    { label: "Explore a topic", icon: Compass },
  ];

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-brand-white">
      {/* Central Viewport */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Workspace Home Hero */}
          <div className="rounded-xl border border-brand-pale bg-brand-pale/20 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-brand-blue/10 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                <Sparkles className="h-3 w-3" /> Workspace Overview
              </span>
              <span className="text-xs text-brand-gray">Phase 0 Baseline</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-brand-navy">
                What would you like to understand?
              </h1>
              <p className="text-xs leading-relaxed text-brand-gray">
                NeuroDesk AI connects your documents, notes, memory, and knowledge graph into one private, grounded workspace.
              </p>
            </div>

            {/* Real Data Summary Strip (no fabricated metrics) */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-brand-pale bg-brand-white p-3 text-center">
                <div className="text-lg font-bold text-brand-navy">0</div>
                <div className="text-[11px] font-medium text-brand-gray">Documents</div>
              </div>
              <div className="rounded-lg border border-brand-pale bg-brand-white p-3 text-center">
                <div className="text-lg font-bold text-brand-navy">0</div>
                <div className="text-[11px] font-medium text-brand-gray">Notes</div>
              </div>
              <div className="rounded-lg border border-brand-pale bg-brand-white p-3 text-center">
                <div className="text-lg font-bold text-brand-navy">0</div>
                <div className="text-[11px] font-medium text-brand-gray">Graph Concepts</div>
              </div>
            </div>
          </div>

          {/* Suggested Quick Actions */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gray">
              Suggested Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => setInputMessage(action.label)}
                    className="flex items-center gap-3 rounded-lg border border-brand-pale bg-brand-white p-3 text-left transition-all hover:border-brand-blue/30 hover:bg-brand-pale/30 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-pale text-brand-blue">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-brand-navy">{action.label}</div>
                      <div className="text-[11px] text-brand-gray">Prompt workspace</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Navigation Indicator (Chat route default) */}
          {activeNav !== "chat" && (
            <div className="rounded-lg border border-brand-pale bg-brand-pale/40 p-4 text-center">
              <p className="text-xs font-medium text-brand-navy capitalize">
                {activeNav} View
              </p>
              <p className="mt-1 text-[11px] text-brand-gray">
                Feature route initialized. Ready for Phase 1 implementation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Chat Composer */}
      <div className="border-t border-brand-pale bg-brand-white p-4">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!inputMessage.trim()) return;
              setInputMessage("");
            }}
            className="flex flex-col rounded-lg border border-brand-pale bg-brand-white shadow-sm focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue"
          >
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question across your documents and workspace..."
              rows={2}
              className="w-full resize-none border-0 bg-transparent px-3 py-2 text-xs text-brand-navy placeholder:text-brand-gray focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-brand-pale/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-brand-gray hover:bg-brand-pale hover:text-brand-navy"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Attach</span>
                </button>
                <div className="flex items-center gap-1 text-[11px] text-brand-gray">
                  <Cpu className="h-3 w-3 text-brand-teal" />
                  <span>Local mode · Ollama</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-brand-white transition-opacity hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Send</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
