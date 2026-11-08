"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  HardDrive,
  Clock,
  Trash2,
  AlertCircle,
  RotateCw,
  X,
  Bookmark,
} from "lucide-react";
import {
  AuthSession,
  DocumentItem,
  CitationItem,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  reindexDocument,
} from "@/lib/api";

interface ContextPanelProps {
  session: AuthSession | null;
  refreshTrigger?: number;
  onFilesChanged?: () => void;
  selectedCitation?: CitationItem | null;
  onClearCitation?: () => void;
}

export function ContextPanel({
  session,
  refreshTrigger = 0,
  onFilesChanged,
  selectedCitation,
  onClearCitation,
}: ContextPanelProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) return;
    loadDocs();
  }, [session, refreshTrigger]);

  async function loadDocs() {
    if (!session) return;
    try {
      const docs = await fetchDocuments(session);
      setDocuments(docs);
    } catch {
      // Ignore background refresh errors
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!session || !files || files.length === 0) return;
    setUploading(true);
    setErrorMsg(null);

    const uploadedList: DocumentItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const item = await uploadDocument(session, file);
        uploadedList.push(item);
      } catch (err) {
        errors.push(`${file.name}: ${(err as Error).message}`);
      }
    }

    if (uploadedList.length > 0) {
      setDocuments((prev) => [...uploadedList, ...prev]);
      onFilesChanged?.();
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(" | "));
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleReindex(docId: string) {
    if (!session) return;
    setReindexingId(docId);
    try {
      const updated = await reindexDocument(session, docId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: updated.status } : d)),
      );
      onFilesChanged?.();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setReindexingId(null);
    }
  }

  async function handleDelete(docId: string) {
    if (!session) return;
    try {
      await deleteDocument(session, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      onFilesChanged?.();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  }

  return (
    <aside
      className="flex h-full w-80 flex-col border-l border-brand-pale bg-brand-white"
      aria-label="Context and Sources"
    >
      <div className="flex h-14 items-center justify-between border-b border-brand-pale px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-navy">
          Context & Sources
        </h2>
        <span className="text-[11px] font-semibold text-brand-blue">
          {documents.filter((d) => d.status === "indexed").length} / {documents.length} indexed
        </span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Selected Citation Inspector */}
        {selectedCitation && (
          <div className="rounded-lg border border-brand-blue/30 bg-brand-pale/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                <Bookmark className="h-3.5 w-3.5 text-brand-blue" />
                <span>Citation Excerpt</span>
              </div>
              <button
                onClick={onClearCitation}
                className="rounded p-0.5 text-brand-gray hover:text-brand-navy"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-[11px] font-medium text-brand-blue">
              {selectedCitation.filename} · Page {selectedCitation.page}
            </div>
            <blockquote className="rounded border-l-2 border-brand-blue bg-brand-white p-2 text-xs italic text-brand-navy leading-relaxed">
              "{selectedCitation.snippet}"
            </blockquote>
          </div>
        )}

        {/* Upload Dropzone */}
        <div>
          <label className="mb-2 block text-xs font-medium text-brand-navy">
            Add Documents
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition-colors cursor-pointer ${
              isDragOver
                ? "border-brand-blue bg-brand-pale/50"
                : "border-brand-blue/30 bg-brand-pale/20 hover:bg-brand-pale/40"
            }`}
          >
            <UploadCloud className="mb-1.5 h-6 w-6 text-brand-blue" />
            <span className="text-xs font-medium text-brand-navy">
              {uploading ? "Ingesting file into ChromaDB..." : "Click or drag files"}
            </span>
            <span className="mt-1 text-[10px] text-brand-gray">
              PDF, DOCX, TXT, MD (Max 50MB)
            </span>
          </div>

          {errorMsg && (
            <div className="mt-2 flex items-center gap-1 rounded bg-red-50 p-2 text-[11px] text-red-600">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="truncate">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Source List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-brand-navy">Indexed Sources</span>
            <span className="text-[11px] text-brand-gray">ChromaDB store</span>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-md border border-brand-pale bg-brand-white p-3 text-center">
              <p className="text-xs text-brand-gray">No sources in current context</p>
              <p className="mt-1 text-[11px] text-brand-gray/80">
                Upload files above to ground answers with citations
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {documents.slice(0, 6).map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between rounded-md border border-brand-pale bg-brand-white p-2 text-xs transition-colors hover:border-brand-blue/30 hover:bg-brand-pale/20"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
                    <span className="truncate font-medium text-brand-navy">
                      {doc.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.status === "indexed" ? (
                      <span title="Indexed in ChromaDB">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-teal" />
                      </span>
                    ) : doc.status === "failed" ? (
                      <button
                        onClick={() => handleReindex(doc.id)}
                        disabled={reindexingId === doc.id}
                        className="rounded p-0.5 text-red-500 hover:bg-red-50"
                        title="Failed to index. Click to retry."
                      >
                        <RotateCw
                          className={`h-3.5 w-3.5 ${
                            reindexingId === doc.id ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <span title="Processing vector indexing...">
                        <Clock className="h-3.5 w-3.5 text-brand-gray" />
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="ml-1 hidden rounded p-0.5 text-brand-gray hover:text-red-500 group-hover:block"
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length > 6 && (
                <p className="text-center text-[11px] text-brand-gray">
                  + {documents.length - 6} more files in Files tab
                </p>
              )}
            </div>
          )}
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
              <span>Vector storage:</span>
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
            All documents, vectors, and embeddings remain strictly on your machine. Cloud inference is{" "}
            <span className="font-semibold text-brand-navy">Off</span>.
          </p>
        </div>
      </div>
    </aside>
  );
}
