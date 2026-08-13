-- 20260709_crystal_all_photons.sql
-- Cámara de Cristalización → ECONOMÍA 100% FOTONES (Zak 2026-07-09).
--
-- Se ELIMINAN los candados por etapa/racha de la tienda del avatar. Motivo:
-- un "🔒 Etapa 6" se siente lejano/confuso y frena; un PRECIO (grande para los
-- épicos) motiva más ("wow, tanto"). La constancia SIGUE exigida porque los
-- Fotones se ganan con los rituales diarios → los ítems caros solo se alcanzan
-- ahorrando con práctica sostenida. Homogeneiza la tienda: todo es "X ✦".
--
-- No cambia el cliente (con requires_stage/streak = 0, stateOf() ya no bloquea
-- y purchase_crystal_item solo verifica el saldo de Fotones).
-- Idempotente (correrlo dos veces no altera nada nuevo).

-- 1) Fuera TODOS los candados por etapa/racha (economía pura de Fotones).
UPDATE public.crystal_catalog
   SET requires_stage = 0,
       requires_streak = 0
 WHERE requires_stage <> 0
    OR requires_streak <> 0;

-- 2) Precio aspiracional para los ítems que ANTES estaban gateados. Las alas
--    rediseñadas (Luz / Fénix) quedan como la CORONA de la tienda.
UPDATE public.crystal_catalog SET price_fotones = 1200 WHERE item_key = 'aura:violeta';
UPDATE public.crystal_catalog SET price_fotones = 1800 WHERE item_key = 'aura:aurora';
UPDATE public.crystal_catalog SET price_fotones = 1200 WHERE item_key = 'ring:doble';
UPDATE public.crystal_catalog SET price_fotones = 2200 WHERE item_key = 'ring:saturno';
UPDATE public.crystal_catalog SET price_fotones = 1600 WHERE item_key = 'swarm:denso';
UPDATE public.crystal_catalog SET price_fotones = 2000 WHERE item_key = 'sigil:metatron';
UPDATE public.crystal_catalog SET price_fotones = 3000 WHERE item_key = 'wings:luz';
UPDATE public.crystal_catalog SET price_fotones = 4444 WHERE item_key = 'wings:fenix';

-- (Opcional para Zak: estos precios se pueden re-afinar desde el Motor → panel
--  de Avatares/tienda cuando exista, o volviendo a correr estos UPDATE.)
