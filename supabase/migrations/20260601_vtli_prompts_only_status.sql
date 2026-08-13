-- 20260601_vtli_prompts_only_status.sql
-- Estado 'prompts_ready' para el modo "Solo prompts" del Estudio Manual.
--
-- El storyboard se genera con los PROMPTS de imagen ya ensamblados (estilo
-- luminoso + cámara + escena) y listos para copiar/pegar a mano en Nano Banana
-- (Gemini app, plan AI Pro) — SIN generar imágenes por API. Beneficio: costo de
-- imagen = $0 (aprovecha la suscripción que ya se paga) y cero saturación,
-- timeouts o reintentos.
--
-- CLAVE de seguridad de costo: el rescate automático del panel solo actúa sobre
-- 'storyboard_ready'. Al marcar los storyboards manuales como 'prompts_ready',
-- el panel NUNCA disparará una generación de API (gasto) sobre ellos.
--
-- Viaja por las RPCs existentes sin tocarlas (get_recent_vtli_drafts /
-- get_vtli_drafts_by_ids devuelven d.status::text y no filtran por status salvo
-- 'deleted').
ALTER TYPE public.vtli_draft_status ADD VALUE IF NOT EXISTS 'prompts_ready';

-- Verificación:
--   SELECT unnest(enum_range(NULL::public.vtli_draft_status));
