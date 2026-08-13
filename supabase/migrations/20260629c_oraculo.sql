-- Red Solar Viva · Oráculo — RAG store + conversaciones (2026-06-29)
-- =====================================================================
-- "Oráculo" es la IA conversacional del Escáner Vibracional: responde desde
-- el CORPUS de Códices del Tripulante (sus libros), en voz de Sexta Densidad /
-- Zak'Haar, vía un modelo ABIERTO (OpenRouter) + RAG sobre los libros indexados.
--
-- Esta migración crea:
--   · oraculo_docs        — chunks de los libros + embedding (pgvector 768d,
--                           Gemini text-embedding-004).
--   · oraculo_conversations / oraculo_messages — el historial del chat.
--   · match_oraculo_docs(query_embedding, match_count) — búsqueda vectorial
--     por similitud coseno (SECURITY DEFINER, solo service_role).
--
-- Seguridad: RLS ENABLED en las 3 tablas, SIN policies → ningún acceso por
-- anon/authenticated. Todo se sirve exclusivamente por las edge functions
-- (oraculo-index / oraculo-chat) con la service_role key, que bypassa RLS.
-- La RPC de búsqueda se REVOKE de anon/authenticated/PUBLIC y solo se GRANT
-- a service_role (la edge la llama con service role).
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

-- pgvector (embeddings). 768 dims = Gemini text-embedding-004.
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Corpus indexado (chunks + embedding)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oraculo_docs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title        text,                       -- título legible del libro
    source       text,                       -- clave estable de la fuente (re-index la reemplaza)
    chunk_index  int,                        -- orden del fragmento dentro de la fuente
    content      text NOT NULL,              -- el texto del fragmento
    embedding    vector(768),                -- Gemini text-embedding-004
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice ANN por similitud coseno. ivfflat es robusto y no requiere
-- configuración especial; lists=100 va bien hasta decenas de miles de chunks.
-- (El índice se usa una vez que hay datos; con la tabla vacía Postgres hace
-- seq scan, que también es correcto.)
CREATE INDEX IF NOT EXISTS idx_oraculo_docs_embedding
    ON oraculo_docs USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_oraculo_docs_source
    ON oraculo_docs (source);

ALTER TABLE oraculo_docs ENABLE ROW LEVEL SECURITY;  -- sin policies → solo service_role

-- ─────────────────────────────────────────────────────────────────────
-- 2. Conversaciones + mensajes
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oraculo_conversations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id   text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    last_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oraculo_conv_user
    ON oraculo_conversations (clerk_user_id, last_at DESC);

ALTER TABLE oraculo_conversations ENABLE ROW LEVEL SECURITY;  -- sin policies

CREATE TABLE IF NOT EXISTS oraculo_messages (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  uuid REFERENCES oraculo_conversations(id) ON DELETE CASCADE,
    clerk_user_id    text NOT NULL,
    role             text NOT NULL,          -- 'user' | 'assistant' | 'system'
    content          text NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oraculo_msg_conv
    ON oraculo_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_oraculo_msg_user_role
    ON oraculo_messages (clerk_user_id, role);

ALTER TABLE oraculo_messages ENABLE ROW LEVEL SECURITY;  -- sin policies

-- ─────────────────────────────────────────────────────────────────────
-- 3. Búsqueda vectorial (RAG)
-- ─────────────────────────────────────────────────────────────────────
-- Top-N chunks por similitud coseno. Similitud = 1 - distancia coseno
-- (<=> es el operador de distancia coseno de pgvector: 0 = idéntico).
-- ORDER BY embedding <=> query usa el índice ivfflat.
CREATE OR REPLACE FUNCTION match_oraculo_docs(
    query_embedding vector(768),
    match_count     int
)
RETURNS TABLE (
    title       text,
    source      text,
    content     text,
    similarity  float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        d.title,
        d.source,
        d.content,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM oraculo_docs d
    WHERE d.embedding IS NOT NULL
    ORDER BY d.embedding <=> query_embedding ASC
    LIMIT GREATEST(COALESCE(match_count, 6), 1);
$$;

-- Solo la edge (service_role) llama esta RPC.
REVOKE ALL ON FUNCTION match_oraculo_docs(vector, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION match_oraculo_docs(vector, int)
    TO service_role;

-- Las tablas se sirven solo por service_role (RLS sin policies ya bloquea
-- anon/authenticated; reafirmamos el REVOKE por higiene).
REVOKE ALL ON TABLE oraculo_docs          FROM anon, authenticated;
REVOKE ALL ON TABLE oraculo_conversations FROM anon, authenticated;
REVOKE ALL ON TABLE oraculo_messages      FROM anon, authenticated;
