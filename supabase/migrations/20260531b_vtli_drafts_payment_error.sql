-- 20260531b_vtli_drafts_payment_error.sql
-- Agrega el estado 'payment_error' al enum vtli_draft_status.
-- Lo usa generate-vtli-storyboard cuando Gemini deniega la generación de
-- imagen con un 403 PERMISSION_DENIED (bloqueo de facturación / dunning de
-- Google Cloud), para que el panel muestre "Error de pago" en vez del genérico
-- "No se generó". Los RPCs de lectura ya devuelven status::text, así que no hay
-- que tocarlos. Al rescatar un cuadro (Reintentar) el estado vuelve a
-- 'storyboard_ready' automáticamente cuando la generación funciona.
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

ALTER TYPE public.vtli_draft_status ADD VALUE IF NOT EXISTS 'payment_error';

-- Validar tras aplicar:
--   SELECT unnest(enum_range(NULL::public.vtli_draft_status));
