"use client";

import React, { useState, useEffect } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { MainContent } from "./MainContent";
import { ContextPanel } from "./ContextPanel";
import { AuthSession, getOrCreateDemoSession, CitationItem } from "@/lib/api";

export function AppShell() {
  const [activeNav, setActiveNav] = useState("chat");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  useEffect(() => {
    let mounted = true;
    getOrCreateDemoSession().then((sess) => {
      if (mounted) {
        setSession(sess);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function handleDataChanged() {
    setRefreshTrigger((prev) => prev + 1);
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-brand-white">
      {/* Workspace Header */}
      <WorkspaceHeader onNewChat={() => setActiveNav("chat")} />

      {/* Main 3-column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <WorkspaceSidebar activeNav={activeNav} onNavChange={setActiveNav} />

        {/* Central Workspace Content */}
        <MainContent
          activeNav={activeNav}
          session={session}
          onNavigate={setActiveNav}
          onDataChanged={handleDataChanged}
          onSelectCitation={(citation) => setSelectedCitation(citation)}
        />

        {/* Right Context Panel */}
        <ContextPanel
          session={session}
          refreshTrigger={refreshTrigger}
          onFilesChanged={handleDataChanged}
          selectedCitation={selectedCitation}
          onClearCitation={() => setSelectedCitation(null)}
        />
      </div>
    </div>
  );
}
