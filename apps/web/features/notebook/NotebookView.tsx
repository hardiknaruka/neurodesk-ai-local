"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  AuthSession,
  NoteItem,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/api";

interface NotebookViewProps {
  session: AuthSession | null;
}

export function NotebookView({ session }: NotebookViewProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active note editing buffer
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  useEffect(() => {
    if (!session) return;
    loadNotes();
  }, [session]);

  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditBody(activeNote.body);
      setSaveStatus("idle");
    } else {
      setEditTitle("");
      setEditBody("");
    }
  }, [activeNoteId]);

  async function loadNotes() {
    if (!session) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const items = await fetchNotes(session);
      setNotes(items);
      if (items.length > 0 && !activeNoteId) {
        setActiveNoteId(items[0].id);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNote() {
    if (!session) return;
    try {
      setSaveStatus("saving");
      const created = await createNote(session, "Untitled Note", "");
      setNotes([created, ...notes]);
      setActiveNoteId(created.id);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage((err as Error).message);
    }
  }

  async function handleSaveNote() {
    if (!session || !activeNoteId) return;
    try {
      setSaveStatus("saving");
      const updated = await updateNote(session, activeNoteId, editTitle, editBody);
      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage((err as Error).message);
    }
  }

  async function handleDeleteNote(id: string) {
    if (!session) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(session, id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (activeNoteId === id) {
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.body.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-brand-white">
      {/* Note List Sidebar */}
      <div className="flex w-72 flex-col border-r border-brand-pale bg-brand-white">
        <div className="flex h-14 items-center justify-between border-b border-brand-pale px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Notebook
            </span>
          </div>
          <button
            onClick={handleCreateNote}
            className="inline-flex items-center gap-1 rounded bg-brand-blue px-2.5 py-1 text-xs font-semibold text-brand-white shadow-sm hover:bg-brand-blue/90"
            title="Create new note"
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-brand-pale">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-gray" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-brand-pale bg-brand-pale/30 py-1 pl-8 pr-3 text-xs text-brand-navy placeholder:text-brand-gray focus:border-brand-blue focus:bg-brand-white focus:outline-none"
            />
          </div>
        </div>

        {/* Notes Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && (
            <p className="p-4 text-center text-xs text-brand-gray">Loading notes...</p>
          )}

          {!loading && filteredNotes.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-xs text-brand-gray">No notes found</p>
              <button
                onClick={handleCreateNote}
                className="mt-2 text-xs font-semibold text-brand-blue hover:underline"
              >
                Create your first note
              </button>
            </div>
          )}

          {filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`group flex flex-col rounded-md p-2.5 text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-brand-pale border-l-2 border-brand-blue text-brand-navy"
                    : "hover:bg-brand-pale/50 text-brand-gray"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`truncate text-xs font-semibold ${
                      isActive ? "text-brand-navy" : "text-brand-navy/80"
                    }`}
                  >
                    {note.title || "Untitled Note"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-600"
                    title="Delete note"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-brand-gray">
                  {note.body ? note.body.slice(0, 100) : "No content"}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-brand-gray/70">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Editor Surface */}
      <div className="flex flex-1 flex-col overflow-hidden bg-brand-white">
        {activeNote ? (
          <div className="flex h-full flex-col">
            {/* Header / Actions Bar */}
            <div className="flex h-14 items-center justify-between border-b border-brand-pale px-6">
              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-xs text-brand-gray">
                    <span className="h-2 w-2 animate-ping rounded-full bg-brand-blue"></span>
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-xs text-brand-teal">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Save error
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNote}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-brand-white shadow-sm hover:bg-brand-blue/90"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Note</span>
                </button>
                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="rounded-md border border-brand-pale p-1.5 text-brand-gray hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Note Content Editor */}
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <div className="mx-auto max-w-2xl space-y-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full border-b border-brand-pale pb-2 text-xl font-bold text-brand-navy placeholder:text-brand-gray focus:border-brand-blue focus:outline-none"
                />

                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Write your note, thoughts, or copy citations from research..."
                  rows={20}
                  className="w-full resize-none border-0 text-xs leading-relaxed text-brand-navy placeholder:text-brand-gray focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <BookOpen className="h-10 w-10 text-brand-pale text-brand-gray/30" />
            <h3 className="mt-3 text-sm font-semibold text-brand-navy">No Note Selected</h3>
            <p className="mt-1 max-w-xs text-xs text-brand-gray">
              Select an existing note from the list on the left, or create a new note to start capturing insights.
            </p>
            <button
              onClick={handleCreateNote}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-brand-white hover:bg-brand-blue/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

