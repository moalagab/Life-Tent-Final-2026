/**
 * _shared/pinecone.ts — Pinecone vector database client for Supabase Edge Functions.
 *
 * Index: lifetent-os (768-dim, cosine, serverless AWS us-east-1)
 * Model: text-embedding-004 (Gemini) — 768 dimensions
 *
 * Namespaces (one per data type to allow targeted queries):
 *   user:{userId}:memory      — AI Coach conversation memory
 *   user:{userId}:tasks       — tasks semantic index
 *   user:{userId}:notes       — knowledge / notes
 *   user:{userId}:goals       — goals
 */

const PINECONE_HOST  = Deno.env.get("PINECONE_HOST")!;
const PINECONE_KEY   = Deno.env.get("PINECONE_API_KEY")!;
const GEMINI_KEY     = Deno.env.get("GEMINI_API_KEY")!;

const HEADERS = {
  "Api-Key": PINECONE_KEY,
  "Content-Type": "application/json",
  "X-Pinecone-API-Version": "2025-04",
};

// ── Embedding via Gemini text-embedding-004 (768-dim) ────────────────────────

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
    }
  );
  const data = await res.json() as { embedding?: { values: number[] } };
  if (!data.embedding?.values) throw new Error("[Pinecone] embed failed: " + JSON.stringify(data));
  return data.embedding.values;
}

// ── Upsert vectors ────────────────────────────────────────────────────────────

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean>;
}

export async function upsert(namespace: string, vectors: PineconeVector[]): Promise<void> {
  const res = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ vectors, namespace }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Pinecone] upsert failed: ${err}`);
  }
}

// ── Query — find top-k similar vectors ───────────────────────────────────────

export interface QueryMatch {
  id: string;
  score: number;
  metadata?: Record<string, string | number | boolean>;
}

export async function query(
  namespace: string,
  vector: number[],
  topK = 5,
  filter?: Record<string, unknown>,
): Promise<QueryMatch[]> {
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ vector, topK, namespace, includeMetadata: true, filter }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Pinecone] query failed: ${err}`);
  }
  const data = await res.json() as { matches: QueryMatch[] };
  return data.matches ?? [];
}

// ── Delete vectors ────────────────────────────────────────────────────────────

export async function deleteVectors(namespace: string, ids: string[]): Promise<void> {
  await fetch(`${PINECONE_HOST}/vectors/delete`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ ids, namespace }),
  });
}

// ── High-level helpers ────────────────────────────────────────────────────────

/** Embed text and upsert in one call */
export async function embedAndUpsert(
  namespace: string,
  id: string,
  text: string,
  metadata?: Record<string, string | number | boolean>,
): Promise<void> {
  const values = await embed(text);
  await upsert(namespace, [{ id, values, metadata }]);
}

/** Embed query text and return top-k matches */
export async function semanticSearch(
  namespace: string,
  queryText: string,
  topK = 5,
  filter?: Record<string, unknown>,
): Promise<QueryMatch[]> {
  const values = await embed(queryText);
  return query(namespace, values, topK, filter);
}

/** Store a memory turn (role + content) in the AI Coach namespace */
export async function storeMemory(
  userId: string,
  memoryId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, string | number | boolean>,
): Promise<void> {
  const namespace = `user:${userId}:memory`;
  await embedAndUpsert(namespace, memoryId, content, {
    role,
    userId,
    timestamp: Date.now(),
    ...metadata,
  });
}

/** Retrieve relevant memories for a new message */
export async function recallMemories(
  userId: string,
  queryText: string,
  topK = 6,
): Promise<QueryMatch[]> {
  const namespace = `user:${userId}:memory`;
  return semanticSearch(namespace, queryText, topK);
}

/** Index a user item (task, note, goal) for semantic search */
export async function indexItem(
  userId: string,
  type: "tasks" | "notes" | "goals",
  itemId: string,
  text: string,
  metadata?: Record<string, string | number | boolean>,
): Promise<void> {
  const namespace = `user:${userId}:${type}`;
  await embedAndUpsert(namespace, itemId, text, { userId, type, ...metadata });
}

/** Semantic search across a specific item type */
export async function searchItems(
  userId: string,
  type: "tasks" | "notes" | "goals",
  queryText: string,
  topK = 8,
): Promise<QueryMatch[]> {
  const namespace = `user:${userId}:${type}`;
  return semanticSearch(namespace, queryText, topK);
}
