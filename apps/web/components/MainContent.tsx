"use client";

import React from "react";
import { AuthSession, CitationItem } from "@/lib/api";
import { NotebookView } from "@/features/notebook/NotebookView";
import { FilesView } from "@/features/files/FilesView";
import { ChatView } from "@/features/chat/ChatView";

interface MainContentProps {
  activeNav: string;
  session: AuthSession | null;
  onNavigate?: (nav: string) => void;
  onDataChanged?: () => void;
  onSelectCitation?: (citation: CitationItem) => void;
}

export function MainContent({
  activeNav,
  session,
  onNavigate,
  onDataChanged,
  onSelectCitation,
}: MainContentProps) {
  if (activeNav === "notebook") {
    return (
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-brand-white">
        <NotebookView session={session} />
      </main>
    );
  }

  if (activeNav === "files") {
    return (
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-brand-white">
        <FilesView
          session={session}
          onFilesUpdated={() => {
            onDataChanged?.();
          }}
        />
      </main>
    );
  }

  // Default route: Chat View with Grounded RAG
  if (activeNav === "chat") {
    return (
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-brand-white">
        <ChatView
          session={session}
          onSelectCitation={onSelectCitation}
          onNavigateToFiles={() => onNavigate?.("files")}
        />
      </main>
    );
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-brand-white p-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-brand-pale bg-brand-pale/20 p-8 text-center space-y-2">
        <h2 className="text-base font-bold text-brand-navy capitalize">{activeNav} View</h2>
        <p className="text-xs text-brand-gray">Feature scheduled for Phase 3/4 integration.</p>
      </div>
    </main>
  );
}
