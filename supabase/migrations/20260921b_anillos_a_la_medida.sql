-- Red Solar Viva · Anillos a la medida de cada etapa (2026-09-21 · II)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Los anillos de la Cámara de Cristalización ahora salen del borde MEDIDO de
-- cada avatar en cada media etapa (cliente: nucleo/avatarFootprint.ts v2.1 ·
-- avatarRingEdge, usado por OrbitRings v1.3). El multiplicador de anillos al
-- 200 % que Aurelia tenía en su etapa 7 compensaba la tabla estimada de antes;
-- con la medida real los dejaría al doble. Se regresa a 100 (= exacto), igual
-- que el resto. El editor del Motor sigue pudiendo afinarlo encima.
--
-- Idempotente: si ya está en 100 no toca nada.
UPDATE public.avatar_config
   SET footprint = jsonb_set(footprint, '{ring}', '[100,100,100,100,100,100,100]'::jsonb)
 WHERE avatar_key = 'aurelia'
   AND footprint ? 'ring'
   AND footprint->'ring' <> '[100,100,100,100,100,100,100]'::jsonb;
