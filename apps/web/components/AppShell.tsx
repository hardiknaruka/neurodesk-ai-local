"use client";

import React, { useState } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { MainContent } from "./MainContent";
import { ContextPanel } from "./ContextPanel";

export function AppShell() {
  const [activeNav, setActiveNav] = useState("chat");

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-brand-white">
      {/* Workspace Header */}
      <WorkspaceHeader onNewChat={() => setActiveNav("chat")} />

      {/* Main 3-column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <WorkspaceSidebar activeNav={activeNav} onNavChange={setActiveNav} />

        {/* Central Workspace Content */}
        <MainContent activeNav={activeNav} />

        {/* Right Context Panel */}
        <ContextPanel />
      </div>
    </div>
  );
}
