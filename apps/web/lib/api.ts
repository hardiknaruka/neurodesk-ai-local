// Browser-safe API client for NeuroDesk AI

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

export interface NoteItem {
  id: string;
  workspace_id: string;
  title: string;
  body: string;
  linked_document_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  workspace_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  hash: string;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

const STORAGE_KEY = 'neurodesk_auth_session';

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

export async function getOrCreateDemoSession(): Promise<AuthSession> {
  const existing = getStoredSession();
  if (existing) return existing;

  // Auto-provision local default dev user
  const email = 'local.user@neurodesk.local';
  const password = 'neurodesk_local_password';

  try {
    // Try login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      saveSession(data.data);
      return data.data;
    }
  } catch (e) {
    // API might be starting or down
  }

  // If login failed, register
  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName: 'Local Researcher' }),
    });

    if (regRes.ok) {
      const data = await regRes.json();
      saveSession(data.data);
      return data.data;
    }
  } catch (e) {
    // fallback
  }

  // Fallback placeholder session
  const fallback: AuthSession = {
    accessToken: 'mock_token',
    user: { id: '00000000-0000-0000-0000-000000000000', email, displayName: 'Local Researcher' },
    workspace: { id: '00000000-0000-0000-0000-000000000000', name: 'Personal Workspace' },
  };
  return fallback;
}

// ── Notes API ───────────────────────────────────────────────────────────────

export async function fetchNotes(session: AuthSession): Promise<NoteItem[]> {
  const res = await fetch(`${API_BASE}/notes`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });
  if (!res.ok) throw new Error('Failed to load notes');
  const body = await res.json();
  return body.data || [];
}

export async function createNote(
  session: AuthSession,
  title: string,
  bodyText: string = '',
): Promise<NoteItem> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
    body: JSON.stringify({ title, body: bodyText }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  const data = await res.json();
  return data.data;
}

export async function updateNote(
  session: AuthSession,
  id: string,
  title: string,
  bodyText: string,
): Promise<NoteItem> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
    body: JSON.stringify({ title, body: bodyText }),
  });
  if (!res.ok) throw new Error('Failed to update note');
  const data = await res.json();
  return data.data;
}

export async function deleteNote(session: AuthSession, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });
  if (!res.ok) throw new Error('Failed to delete note');
}

// ── Files API ───────────────────────────────────────────────────────────────

export async function fetchDocuments(session: AuthSession): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/files`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });
  if (!res.ok) throw new Error('Failed to load documents');
  const body = await res.json();
  return body.data || [];
}

export async function uploadDocument(
  session: AuthSession,
  file: File,
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Failed to upload document');
  }

  const data = await res.json();
  return data.data;
}

export async function deleteDocument(session: AuthSession, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });
  if (!res.ok) throw new Error('Failed to delete document');
}


// ── Chat & Grounded RAG API ────────────────────────────────────────────────

export interface CitationItem {
  documentId: string;
  filename: string;
  page: number;
  section?: string;
  snippet: string;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: CitationItem[];
  model_provider: string | null;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function fetchConversations(session: AuthSession): Promise<ConversationItem[]> {
  const res = await fetch(`${API_BASE}/chat/conversations`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });
  if (!res.ok) throw new Error('Failed to load conversations');
  const body = await res.json();
  return body.data || [];
}

export async function fetchConversationMessages(
  session: AuthSession,
  conversationId: string,
): Promise<ChatMessageItem[]> {
  const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });
  if (!res.ok) throw new Error('Failed to load messages');
  const body = await res.json();
  return body.data || [];
}

export async function sendChatMessage(
  session: AuthSession,
  message: string,
  conversationId?: string,
  allowedDocumentIds?: string[],
): Promise<{
  conversationId: string;
  userMessage: ChatMessageItem;
  assistantMessage: ChatMessageItem;
  relevantChunksCount: number;
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
    body: JSON.stringify({
      message,
      conversationId,
      allowedDocumentIds,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Failed to send message');
  }

  const data = await res.json();
  return data.data;
}

export async function reindexDocument(
  session: AuthSession,
  documentId: string,
): Promise<{ id: string; status: string; chunksIndexed: number }> {
  const res = await fetch(`${API_BASE}/files/${documentId}/reindex`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-workspace-id': session.workspace.id,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Failed to reindex document');
  }

  const data = await res.json();
  return data.data;
}
