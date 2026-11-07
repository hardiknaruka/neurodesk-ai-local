"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";
import {
  AuthSession,
  DocumentItem,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
} from "@/lib/api";

interface FilesViewProps {
  session: AuthSession | null;
  onFilesUpdated?: () => void;
}

export function FilesView({ session, onFilesUpdated }: FilesViewProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) return;
    loadDocs();
  }, [session]);

  async function loadDocs() {
    if (!session) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const docs = await fetchDocuments(session);
      setDocuments(docs);
      onFilesUpdated?.();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!session || !files || files.length === 0) return;
    setUploading(true);
    setErrorMessage(null);

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
      onFilesUpdated?.();
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(" | "));
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleDelete(docId: string) {
    if (!session) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(session, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      onFilesUpdated?.();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function getFileIcon(mime: string, filename: string) {
    if (mime.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (mime.includes("image")) return <ImageIcon className="h-5 w-5 text-brand-blue" />;
    if (filename.endsWith(".md") || filename.endsWith(".txt")) {
      return <FileCode className="h-5 w-5 text-brand-teal" />;
    }
    if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
      return <FileSpreadsheet className="h-5 w-5 text-blue-600" />;
    }
    return <FileText className="h-5 w-5 text-brand-gray" />;
  }

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-brand-white">
      {/* Top Header */}
      <div className="flex h-14 items-center justify-between border-b border-brand-pale px-8">
        <div className="flex items-center gap-3">
          <HardDrive className="h-4 w-4 text-brand-blue" />
          <h1 className="text-sm font-bold tracking-tight text-brand-navy">
            Workspace Files & Documents
          </h1>
          <span className="rounded bg-brand-pale px-2 py-0.5 text-xs font-semibold text-brand-navy">
            {documents.length} files
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-gray" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-brand-pale bg-brand-pale/30 py-1.5 pl-8 pr-3 text-xs text-brand-navy placeholder:text-brand-gray focus:border-brand-blue focus:bg-brand-white focus:outline-none"
            />
          </div>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-brand-white shadow-sm hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{uploading ? "Uploading..." : "Upload Files"}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Drag-and-drop ingestion zone */}
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
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragOver
              ? "border-brand-blue bg-brand-pale/50 shadow-inner"
              : "border-brand-blue/30 bg-brand-pale/20 hover:border-brand-blue/60 hover:bg-brand-pale/30"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pale text-brand-blue shadow-sm">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-brand-navy">
            {uploading ? "Ingesting documents into workspace..." : "Drop documents here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-brand-gray">
            Supported formats: PDF, DOCX, Markdown, Plain Text, PNG, JPG (up to 50MB per file)
          </p>
          <p className="mt-1 text-[11px] text-brand-teal font-medium">
            Local workspace isolation: Files are saved privately to your machine
          </p>
        </div>

        {/* File Table / List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Workspace Document Library
            </h2>
            <span className="text-xs text-brand-gray">
              Showing {filteredDocs.length} of {documents.length}
            </span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-brand-pale bg-brand-white">
              <span className="text-xs text-brand-gray">Loading documents...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-brand-pale bg-brand-pale/10 p-12 text-center">
              <FileText className="h-10 w-10 text-brand-gray/40 mb-3" />
              <p className="text-xs font-semibold text-brand-navy">No documents in this workspace yet</p>
              <p className="mt-1 text-[11px] text-brand-gray">
                Upload your research PDFs, notes, or study materials above to begin grounded retrieval.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-brand-pale bg-brand-white shadow-sm">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-pale bg-brand-pale/40 text-brand-gray font-semibold">
                    <th className="py-2.5 px-4">Document</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4">Format</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Date Added</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pale">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-brand-pale/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.mime_type, doc.filename)}
                          <div>
                            <div className="font-semibold text-brand-navy">{doc.filename}</div>
                            <div className="text-[11px] text-brand-gray font-mono truncate max-w-xs">
                              SHA256: {doc.hash.slice(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-brand-gray font-medium">
                        {formatBytes(doc.size_bytes)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-brand-pale px-2 py-0.5 text-[11px] font-medium text-brand-navy uppercase">
                          {doc.filename.split(".").pop() || "FILE"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {doc.status === "indexed" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-brand-teal/10 px-2 py-0.5 text-[11px] font-semibold text-brand-teal">
                            <CheckCircle2 className="h-3 w-3" /> Indexed
                          </span>
                        ) : doc.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            <AlertCircle className="h-3 w-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-brand-pale px-2 py-0.5 text-[11px] font-semibold text-brand-gray">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-brand-gray">
                        {new Date(doc.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="rounded p-1 text-brand-gray hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

