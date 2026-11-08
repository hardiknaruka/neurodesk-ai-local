"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Cpu,
  Plus,
  FileText,
  AlertCircle,
  Loader2,
  Layers,
  BookMarked,
  FileSearch,
  Compass,
} from "lucide-react";
import {
  AuthSession,
  ChatMessageItem,
  ConversationItem,
  CitationItem,
  fetchConversations,
  fetchConversationMessages,
  sendChatMessage,
} from "@/lib/api";
import { CitationChip } from "./CitationChip";

interface ChatViewProps {
  session: AuthSession | null;
  onSelectCitation?: (citation: CitationItem) => void;
  onNavigateToFiles?: () => void;
}

export function ChatView({
  session,
  onSelectCitation,
  onNavigateToFiles,
}: ChatViewProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    loadConversations();
  }, [session]);

  useEffect(() => {
    if (!session || !activeConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(activeConversationId);
  }, [session, activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSearching]);

  async function loadConversations() {
    if (!session) return;
    try {
      const items = await fetchConversations(session);
      setConversations(items);
      if (items.length > 0 && !activeConversationId) {
        setActiveConversationId(items[0].id);
      }
    } catch {
      // Background load
    }
  }

  async function loadMessages(convId: string) {
    if (!session) return;
    try {
      const msgs = await fetchConversationMessages(session, convId);
      setMessages(msgs);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  }

  async function handleSend() {
    if (!session || !inputMessage.trim() || isSearching) return;

    const queryText = inputMessage.trim();
    setInputMessage("");
    setErrorMsg(null);
    setIsSearching(true);

    // Optimistically append user message
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || "",
      role: "user",
      content: queryText,
      citations: [],
      model_provider: "local-ollama",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendChatMessage(
        session,
        queryText,
        activeConversationId || undefined,
      );

      // If this was a new conversation, update active ID and conversation list
      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
        loadConversations();
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        result.userMessage,
        result.assistantMessage,
      ]);
    } catch (err) {
      setErrorMsg((err as Error).message);
      // Remove optimistic message on hard failure
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsSearching(false);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setErrorMsg(null);
  }

  const quickActions = [
    { label: "Summarize sources in workspace", icon: FileSearch },
    { label: "Compare core findings", icon: Layers },
    { label: "Create grounded study notes", icon: BookMarked },
    { label: "Explore workspace concepts", icon: Compass },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-brand-white">
      {/* Central Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat Header Bar */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-brand-pale bg-brand-white px-8">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-brand-navy">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)?.title || "Active Discussion"
                : "New Research Session"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1 rounded border border-brand-pale bg-brand-pale/40 px-2 py-1 text-[11px] font-medium text-brand-navy hover:border-brand-blue/30 hover:bg-brand-pale"
          >
            <Plus className="h-3 w-3 text-brand-blue" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Empty State / Hero when conversation is fresh */}
            {messages.length === 0 && (
              <div className="space-y-6 pt-4">
                <div className="rounded-xl border border-brand-pale bg-brand-pale/20 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-brand-blue/10 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                      <Sparkles className="h-3 w-3" /> Grounded RAG
                    </span>
                    <span className="text-xs text-brand-gray">Phase 2 · Active</span>
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-brand-navy">
                      What would you like to understand?
                    </h1>
                    <p className="text-xs leading-relaxed text-brand-gray">
                      Ask questions across your uploaded research papers, PDFs, and notes. Every answer is synthesized with verifiable source citations from your local ChromaDB vector store.
                    </p>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gray">
                    Suggested Research Questions
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => {
                            setInputMessage(action.label);
                          }}
                          className="flex items-center gap-3 rounded-lg border border-brand-pale bg-brand-white p-3 text-left transition-all hover:border-brand-blue/40 hover:bg-brand-pale/30 focus:outline-none"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-pale text-brand-blue">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-brand-navy">
                              {action.label}
                            </div>
                            <div className="text-[11px] text-brand-gray">Grounded query</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="flex-1">{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="font-semibold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-2 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold text-brand-gray">
                  {msg.role === "user" ? (
                    <span>You</span>
                  ) : (
                    <span className="flex items-center gap-1 text-brand-blue">
                      <Sparkles className="h-3 w-3" /> NeuroDesk AI · Ollama
                    </span>
                  )}
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div
                  className={`rounded-xl px-4 py-3 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-brand-navy text-brand-white rounded-br-none shadow-sm"
                      : "bg-brand-pale/40 border border-brand-pale text-brand-navy rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.content}

                  {/* Render Grounded Citations if present */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 border-t border-brand-blue/15 pt-2.5">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                        <FileText className="h-3 w-3" />
                        <span>Sources & Citations</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <CitationChip
                            key={`${c.documentId}-${c.page}-${i}`}
                            citation={c}
                            onSelect={onSelectCitation}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Searching status indicator */}
            {isSearching && (
              <div className="flex items-start space-y-2">
                <div className="rounded-xl border border-brand-pale bg-brand-pale/30 px-4 py-3 text-xs text-brand-navy shadow-sm">
                  <div className="flex items-center gap-2 font-medium text-brand-blue">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Searching workspace documents & synthesizing grounded answer...</span>
                  </div>
                  <p className="mt-1 text-[11px] text-brand-gray">
                    Retrieving vector embeddings from local ChromaDB and querying Ollama.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Persistent Chat Composer */}
        <div className="border-t border-brand-pale bg-brand-white p-4">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex flex-col rounded-lg border border-brand-pale bg-brand-white shadow-sm focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue"
            >
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question across your documents... (Enter to send, Shift+Enter for new line)"
                rows={2}
                disabled={isSearching}
                className="w-full resize-none border-0 bg-transparent px-3 py-2 text-xs text-brand-navy placeholder:text-brand-gray focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center justify-between border-t border-brand-pale/60 px-3 py-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToFiles}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-brand-gray hover:bg-brand-pale hover:text-brand-navy"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Attach Sources</span>
                  </button>
                  <div className="flex items-center gap-1 text-[11px] text-brand-gray">
                    <Cpu className="h-3 w-3 text-brand-teal" />
                    <span>Local mode · Ollama (llama3)</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSearching}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-brand-white transition-opacity hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{isSearching ? "Synthesizing..." : "Send"}</span>
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

