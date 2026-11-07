// Shared API contracts for NeuroDesk AI
// Consumed by both apps/web and services/api

// ── Generic API envelope ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Health ──────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;
  services: Record<string, ServiceHealthStatus>;
}

export interface ServiceHealthStatus {
  status: "ok" | "degraded" | "error" | "disabled";
  latencyMs?: number;
  message?: string;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

// ── Workspace ───────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ── Notes ───────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  linkedDocumentIds: string[];
  linkedConversationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  body?: string;
  linkedDocumentIds?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  linkedDocumentIds?: string[];
}

// ── Documents / Assets ──────────────────────────────────────────────────────

export type DocumentStatus =
  | "pending"
  | "processing"
  | "indexed"
  | "failed";

export interface Document {
  id: string;
  workspaceId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Chat ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  modelProvider: string | null;
  createdAt: string;
}

export interface Citation {
  documentId: string;
  filename: string;
  page?: number;
  section?: string;
  snippet: string;
}

export interface ChatRequest {
  conversationId?: string;
  workspaceId: string;
  message: string;
  allowedDocumentIds?: string[];
}

// ── Memory ──────────────────────────────────────────────────────────────────

export type MemoryItemStatus = "proposed" | "approved" | "deleted";

export interface MemoryItem {
  id: string;
  workspaceId: string;
  type: string;
  content: string;
  source: string | null;
  status: MemoryItemStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Knowledge Graph ─────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
  sourceDocumentIds: string[];
}

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
  properties: Record<string, unknown>;
}

export interface GraphQueryResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

