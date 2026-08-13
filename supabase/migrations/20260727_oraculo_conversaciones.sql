-- Red Solar Viva — 20260727_oraculo_conversaciones.sql
-- ─────────────────────────────────────────────────────────────────────
-- REFLEJOS MÚLTIPLES EN EL ESPEJO VIBRACIONAL
--
-- La tabla `oraculo_conversations` YA existía desde 20260629c (id,
-- clerk_user_id, created_at, last_at) pero nadie la usaba: todos los
-- mensajes se guardaban con conversation_id NULL y se leían por
-- clerk_user_id, así que el Tripulante tenía UNA sola charla infinita.
--
-- Esta migración solo agrega el TÍTULO de cada reflejo (se llena solo con
-- la primera frase del Tripulante, desde la edge oraculo-chat v1.10). La
-- adopción de los mensajes viejos (conversation_id NULL → su reflejo
-- inicial) la hace la propia edge la primera vez que el Tripulante abre
-- el Espejo, así que aquí no se toca ni un mensaje.
--
-- Seguridad: RLS sigue ENABLED sin policies en ambas tablas → nada de
-- acceso por anon/authenticated; todo pasa por la edge con service_role.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE oraculo_conversations
    ADD COLUMN IF NOT EXISTS title text;

-- Los mensajes se piden por conversación: índice por (conversación, fecha)
-- ya existe (idx_oraculo_msg_conv). Falta el de adopción de los legacy.
CREATE INDEX IF NOT EXISTS idx_oraculo_msg_user_null_conv
    ON oraculo_messages (clerk_user_id)
    WHERE conversation_id IS NULL;
