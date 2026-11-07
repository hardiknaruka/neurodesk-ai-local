"use client";

import React from "react";
import {
  MessageSquare,
  BookOpen,
  Files,
  Network,
  Brain,
  Settings,
  Folder,
  CircleDot,
} from "lucide-react";

interface WorkspaceSidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export function WorkspaceSidebar({ activeNav, onNavChange }: WorkspaceSidebarProps) {
  const navItems = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "notebook", label: "Notebook", icon: BookOpen },
    { id: "files", label: "Files", icon: Files },
    { id: "graph", label: "Knowledge Graph", icon: Network },
    { id: "memory", label: "Memory", icon: Brain },
  ];

  return (
    <aside
      className="flex h-full w-64 flex-col border-r border-brand-pale bg-brand-white text-brand-navy"
      aria-label="Workspace Navigation"
    >
      {/* Workspace Switcher */}
      <div className="flex h-14 items-center border-b border-brand-pale px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-navy text-xs font-bold text-brand-white">
            ND
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-brand-navy">
              Personal Workspace
            </span>
            <span className="text-[11px] text-brand-gray">Local storage</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main features">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-brand-gray">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-pale text-brand-blue"
                  : "text-brand-navy hover:bg-brand-pale/60 hover:text-brand-navy"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-5">
          <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-brand-gray">
            Collections
          </div>
          <div className="space-y-1">
            <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-brand-gray hover:bg-brand-pale/50 hover:text-brand-navy">
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span>Research Papers</span>
            </button>
            <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-brand-gray hover:bg-brand-pale/50 hover:text-brand-navy">
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span>Project Notes</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Local Health & Settings Footer */}
      <div className="border-t border-brand-pale p-3 space-y-2">
        <button
          onClick={() => onNavChange("settings")}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeNav === "settings"
              ? "bg-brand-pale text-brand-blue"
              : "text-brand-navy hover:bg-brand-pale/60"
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </button>

        <div className="flex items-center justify-between rounded-md bg-brand-pale/50 px-3 py-2 text-xs">
          <span className="text-brand-gray">Local Service</span>
          <span className="flex items-center gap-1.5 font-medium text-brand-teal">
            <CircleDot className="h-3 w-3 fill-brand-teal text-brand-teal" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
