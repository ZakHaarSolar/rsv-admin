-- Red Solar Viva — Columnas Zoom en public.reservas (v1)
-- ───────────────────────────────────────────────────────────────────
-- Cada reserva 1:1 confirmada va a tener su propia sala de Zoom creada
-- automáticamente por el stripe-webhook cuando el pago se confirme. Acá
-- guardamos el link único + metadata de diagnóstico para que:
--
--   1. Pipedream pueda leer `zoom_join_url` y meterlo en el correo.
--   2. El componente de bitácora (próximo a diseñar) pueda filtrar
--      reservas que cayeron al fallback, errores de Zoom, etc.
--   3. Si hay un refund / cancelación, sabemos qué meeting borrar usando
--      `zoom_meeting_id`.
--
-- Todas las columnas son nullable (excepto `zoom_used_fallback` que default
-- a false) para no romper los rows viejos — reservas grupales o legacy
-- de Calendly no tienen datos de Zoom y no deberían.
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.reservas
    ADD COLUMN IF NOT EXISTS zoom_join_url       text,
    ADD COLUMN IF NOT EXISTS zoom_meeting_id     text,
    ADD COLUMN IF NOT EXISTS zoom_password       text,
    ADD COLUMN IF NOT EXISTS zoom_used_fallback  boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS zoom_error          text,
    ADD COLUMN IF NOT EXISTS zoom_created_at     timestamptz,
    ADD COLUMN IF NOT EXISTS zoom_meta           jsonb;

COMMENT ON COLUMN public.reservas.zoom_join_url IS
    'URL única de Zoom para esta reserva. Si la creación falló, cae al valor de ZOOM_FALLBACK_JOIN_URL.';
COMMENT ON COLUMN public.reservas.zoom_meeting_id IS
    'Zoom meeting ID (numérico como string). NULL cuando se usó el fallback.';
COMMENT ON COLUMN public.reservas.zoom_password IS
    'Passcode de la reunión. NULL si Zoom no devolvió uno o si se usó el fallback.';
COMMENT ON COLUMN public.reservas.zoom_used_fallback IS
    'true si la creación vía API de Zoom falló y se usó ZOOM_FALLBACK_JOIN_URL. Filtrable desde la bitácora.';
COMMENT ON COLUMN public.reservas.zoom_error IS
    'Mensaje de error resumido si falló la creación de Zoom. NULL si todo salió bien.';
COMMENT ON COLUMN public.reservas.zoom_created_at IS
    'Timestamp del intento de creación (exitoso o fallback). NULL para reservas grupales o legacy.';
COMMENT ON COLUMN public.reservas.zoom_meta IS
    'Respuesta completa de la Zoom API (JSON) para diagnóstico fino. NULL si no hubo llamada exitosa.';

-- Índice parcial para listar rápido las reservas que cayeron al fallback
-- (útil para el componente de bitácora — "mostrame las que fallaron").
CREATE INDEX IF NOT EXISTS idx_reservas_zoom_fallback
    ON public.reservas (confirmed_at DESC)
    WHERE zoom_used_fallback = true;
