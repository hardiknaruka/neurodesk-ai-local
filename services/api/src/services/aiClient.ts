import axios from 'axios';
import {
  IngestDocumentRequest,
  IngestDocumentResponse,
  RagQueryRequest,
  RagQueryResponse,
} from '@neurodesk/contracts';
import { logger } from '../middleware/logger';

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

function getInternalSecret(): string {
  const secret = process.env.AI_SERVICE_INTERNAL_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AI_SERVICE_INTERNAL_SECRET must be defined in production environment');
  }
  return secret || '';
}

const client = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 60000, // 60s for local LLM generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic header attachment so runtime env changes or initializations are respected
client.interceptors.request.use((config) => {
  const secret = getInternalSecret();
  if (secret) {
    config.headers['x-internal-secret'] = secret;
  }
  return config;
});

export async function ingestDocument(
  payload: IngestDocumentRequest,
): Promise<IngestDocumentResponse> {
  try {
    const res = await client.post<IngestDocumentResponse>('/internal/ingest', payload);
    return res.data;
  } catch (err: any) {
    logger.error('Failed to trigger AI ingestion', {
      error: err.response?.data || err.message,
      payload,
    });
    return {
      documentId: payload.documentId,
      chunksIndexed: 0,
      status: 'failed',
      errorMessage: err.response?.data?.detail || err.message || 'AI Ingestion service error',
    };
  }
}

export async function deleteDocumentChunks(
  workspaceId: string,
  documentId: string,
): Promise<void> {
  try {
    await client.delete(`/internal/documents/${workspaceId}/${documentId}`);
  } catch (err: any) {
    logger.warn('Failed to delete document chunks from vector store', {
      error: err.response?.data || err.message,
      workspaceId,
      documentId,
    });
  }
}

export async function queryRag(payload: RagQueryRequest): Promise<RagQueryResponse> {
  try {
    const res = await client.post<RagQueryResponse>('/internal/rag/query', payload);
    return res.data;
  } catch (err: any) {
    logger.error('Failed to execute RAG query in AI service', {
      error: err.response?.data || err.message,
      payload,
    });
    throw new Error(err.response?.data?.detail || 'AI Service RAG query failed');
  }
}

