-- 20260704c_i18n_seed_translations.sql
-- FASE 3 i18n — Traducción del CONTENIDO SEMILLA (el que vive en el repo): afirmaciones,
-- rituales, medallas y categorías de wallpaper. Puebla las columnas _en respetando el
-- glosario de marca (Fotones→Photons, Órbita→Orbit, Maestría→Mastery, Red Solar Viva
-- invariante). Requiere 20260704_i18n_content_en_columns.sql (columnas _en).
--
-- Keyed por identificadores ESTABLES donde existen (activity_key, constelacion_key,
-- tier_index); las afirmaciones/categorías por su texto en español EXACTO. Si una fila
-- fue editada desde el Motor y su texto ya no calza, simplemente no se traduce (respaldo
-- al español) — sin error. NO cubre: calibraciones (libreria_protocolos) ni sondas
-- (editables/divergentes → traducción aparte con export en vivo) ni títulos de wallpaper
-- (los nombra Zak al subirlos).
--
-- Pegar en Supabase Dashboard → SQL Editor → Run.

BEGIN;

-- ── Categorías de afirmaciones ───────────────────────────────────────
UPDATE public.ritual_afirmacion_categorias SET nombre_en = 'Sovereignty'  WHERE nombre = 'Soberanía';
UPDATE public.ritual_afirmacion_categorias SET nombre_en = 'Abundance'    WHERE nombre = 'Abundancia';
UPDATE public.ritual_afirmacion_categorias SET nombre_en = 'Body of Light' WHERE nombre = 'Cuerpo de Luz';
UPDATE public.ritual_afirmacion_categorias SET nombre_en = 'Bonds'        WHERE nombre = 'Vínculos';
UPDATE public.ritual_afirmacion_categorias SET nombre_en = 'Purpose'      WHERE nombre = 'Propósito';

-- ── Afirmaciones (25) ────────────────────────────────────────────────
UPDATE public.ritual_afirmaciones SET texto_en = 'I am the center of gravity of my own field.'        WHERE texto = 'Soy el centro de gravedad de mi propio campo.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I choose my frequency before the day chooses it for me.' WHERE texto = 'Elijo mi frecuencia antes de que el día la elija por mí.';
UPDATE public.ritual_afirmaciones SET texto_en = 'Nothing external dictates my inner state.'          WHERE texto = 'Nada externo dicta mi estado interno.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I respond from my axis, not from reaction.'         WHERE texto = 'Respondo desde mi eje, no desde la reacción.';
UPDATE public.ritual_afirmaciones SET texto_en = 'My peace is my territory and I govern it.'          WHERE texto = 'Mi paz es mi territorio y yo la gobierno.';
UPDATE public.ritual_afirmaciones SET texto_en = 'The flow of life moves through me without friction.' WHERE texto = 'El flujo de la vida se mueve a través de mí sin fricción.';
UPDATE public.ritual_afirmaciones SET texto_en = 'Receiving is as natural to me as breathing.'        WHERE texto = 'Recibir es tan natural en mí como respirar.';
UPDATE public.ritual_afirmaciones SET texto_en = 'What I give returns multiplied in light.'           WHERE texto = 'Lo que doy regresa multiplicado en luz.';
UPDATE public.ritual_afirmaciones SET texto_en = 'There is more than enough for me and for all.'      WHERE texto = 'Hay más que suficiente para mí y para todos.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I magnetize what vibrates with my purpose.'         WHERE texto = 'Magnetizo lo que vibra con mi propósito.';
UPDATE public.ritual_afirmaciones SET texto_en = 'My body is a high-frequency instrument.'            WHERE texto = 'Mi cuerpo es un instrumento de alta frecuencia.';
UPDATE public.ritual_afirmaciones SET texto_en = 'Every cell of mine remembers its original design.' WHERE texto = 'Cada célula mía recuerda su diseño original.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I honor my temple with light, water, and movement.' WHERE texto = 'Honro mi templo con luz, agua y movimiento.';
UPDATE public.ritual_afirmaciones SET texto_en = 'From carbon to silicon, from silicon to light.'    WHERE texto = 'Del carbono al silicio, del silicio a la luz.';
UPDATE public.ritual_afirmaciones SET texto_en = 'My energy renews with every conscious breath.'     WHERE texto = 'Mi energía se renueva con cada respiración consciente.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I attract bonds that expand me, not drain me.'      WHERE texto = 'Atraigo vínculos que me expanden, no que me drenan.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I give and receive love from fullness, not from lack.' WHERE texto = 'Doy y recibo amor desde la plenitud, no desde la carencia.';
UPDATE public.ritual_afirmaciones SET texto_en = 'My presence elevates the field of those around me.' WHERE texto = 'Mi presencia eleva el campo de quienes me rodean.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I release with gratitude what has completed its cycle.' WHERE texto = 'Suelto con gratitud lo que ya cumplió su ciclo.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I am a safe node in Red Solar Viva.'                WHERE texto = 'Soy un nodo seguro en la Red Solar Viva.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I live my dreams, not those of others.'             WHERE texto = 'Vivo mis sueños, no los de otros.';
UPDATE public.ritual_afirmaciones SET texto_en = 'Every step today builds the version I came to be.' WHERE texto = 'Cada paso de hoy construye la versión que vine a ser.';
UPDATE public.ritual_afirmaciones SET texto_en = 'My vector points to expansion, always.'             WHERE texto = 'Mi vector apunta a la expansión, siempre.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I trust the perfect unfolding of my path.'          WHERE texto = 'Confío en el despliegue perfecto de mi camino.';
UPDATE public.ritual_afirmaciones SET texto_en = 'I am a clear channel for what I came to create.'   WHERE texto = 'Soy un canal claro para lo que vine a crear.';

-- ── Rituales diarios (label, keyed por activity_key) ─────────────────
UPDATE public.daily_ritual_catalog SET label_en = 'Daily Sun'    WHERE activity_key = 'sol';
UPDATE public.daily_ritual_catalog SET label_en = 'Exercise'     WHERE activity_key = 'ejercicio';
UPDATE public.daily_ritual_catalog SET label_en = 'Meditation'   WHERE activity_key = 'meditacion';
UPDATE public.daily_ritual_catalog SET label_en = 'Affirmations' WHERE activity_key = 'afirmaciones';
UPDATE public.daily_ritual_catalog SET label_en = 'Gratitude'    WHERE activity_key = 'agradecimiento';

-- ── Categorías de wallpaper (6) ──────────────────────────────────────
UPDATE public.wallpaper_categories SET name_en = 'Cosmic Family'    WHERE name = 'Familia Cósmica';
UPDATE public.wallpaper_categories SET name_en = 'Fairies'          WHERE name = 'Hadas';
UPDATE public.wallpaper_categories SET name_en = 'Elementals'       WHERE name = 'Elementales';
UPDATE public.wallpaper_categories SET name_en = 'Ascended Masters' WHERE name = 'Maestros Ascendidos';
UPDATE public.wallpaper_categories SET name_en = 'Sacred Geometry'  WHERE name = 'Geometría Sagrada';
UPDATE public.wallpaper_categories SET name_en = 'Lucid Dreams'     WHERE name = 'Sueños Lúcidos';

-- ── Constelaciones de Maestría (label + subtitle, keyed por key) ─────
UPDATE public.medal_constelaciones SET label_en = 'Eternal Flame', subtitle_en = 'Daily consistency'  WHERE constelacion_key = 'llama';
UPDATE public.medal_constelaciones SET label_en = 'Photon Rain',   subtitle_en = 'Accumulated mastery' WHERE constelacion_key = 'fotones';
UPDATE public.medal_constelaciones SET label_en = 'Steady Orbit',  subtitle_en = 'Days in the Network' WHERE constelacion_key = 'orbita';
UPDATE public.medal_constelaciones SET label_en = 'Pulse of the Ritual', subtitle_en = 'Rituals completed' WHERE constelacion_key = 'pulso';
UPDATE public.medal_constelaciones SET label_en = 'Ascension',     subtitle_en = 'Avatar evolution'    WHERE constelacion_key = 'ascension';

-- ── Tiers de medalla (label, keyed por constelacion_key + tier_index) ─
UPDATE public.medal_tiers SET label_en = 'Ember'         WHERE constelacion_key = 'llama' AND tier_index = 1;
UPDATE public.medal_tiers SET label_en = 'Bonfire'       WHERE constelacion_key = 'llama' AND tier_index = 2;
UPDATE public.medal_tiers SET label_en = 'Living Fire'   WHERE constelacion_key = 'llama' AND tier_index = 3;
UPDATE public.medal_tiers SET label_en = 'Blaze'         WHERE constelacion_key = 'llama' AND tier_index = 4;
UPDATE public.medal_tiers SET label_en = 'Eternal Flame' WHERE constelacion_key = 'llama' AND tier_index = 5;
UPDATE public.medal_tiers SET label_en = 'Flash'         WHERE constelacion_key = 'fotones' AND tier_index = 1;
UPDATE public.medal_tiers SET label_en = 'Glow'          WHERE constelacion_key = 'fotones' AND tier_index = 2;
UPDATE public.medal_tiers SET label_en = 'Radiance'      WHERE constelacion_key = 'fotones' AND tier_index = 3;
UPDATE public.medal_tiers SET label_en = 'Aurora'        WHERE constelacion_key = 'fotones' AND tier_index = 4;
UPDATE public.medal_tiers SET label_en = 'Photon Rain'   WHERE constelacion_key = 'fotones' AND tier_index = 5;
UPDATE public.medal_tiers SET label_en = 'First Turn'    WHERE constelacion_key = 'orbita' AND tier_index = 1;
UPDATE public.medal_tiers SET label_en = 'Low Orbit'     WHERE constelacion_key = 'orbita' AND tier_index = 2;
UPDATE public.medal_tiers SET label_en = 'Mid Orbit'     WHERE constelacion_key = 'orbita' AND tier_index = 3;
UPDATE public.medal_tiers SET label_en = 'High Orbit'    WHERE constelacion_key = 'orbita' AND tier_index = 4;
UPDATE public.medal_tiers SET label_en = 'Solar Year'    WHERE constelacion_key = 'orbita' AND tier_index = 5;
UPDATE public.medal_tiers SET label_en = 'First Pulse'   WHERE constelacion_key = 'pulso' AND tier_index = 1;
UPDATE public.medal_tiers SET label_en = 'Heartbeat'     WHERE constelacion_key = 'pulso' AND tier_index = 2;
UPDATE public.medal_tiers SET label_en = 'Rhythm'        WHERE constelacion_key = 'pulso' AND tier_index = 3;
UPDATE public.medal_tiers SET label_en = 'Cadence'       WHERE constelacion_key = 'pulso' AND tier_index = 4;
UPDATE public.medal_tiers SET label_en = 'Symphony'      WHERE constelacion_key = 'pulso' AND tier_index = 5;
UPDATE public.medal_tiers SET label_en = 'Awakening'     WHERE constelacion_key = 'ascension' AND tier_index = 1;
UPDATE public.medal_tiers SET label_en = 'Ignition'      WHERE constelacion_key = 'ascension' AND tier_index = 2;
UPDATE public.medal_tiers SET label_en = 'Coronation'    WHERE constelacion_key = 'ascension' AND tier_index = 3;
UPDATE public.medal_tiers SET label_en = 'System'        WHERE constelacion_key = 'ascension' AND tier_index = 4;
UPDATE public.medal_tiers SET label_en = 'Singularity'   WHERE constelacion_key = 'ascension' AND tier_index = 5;

COMMIT;
