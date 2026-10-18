-- Red Solar Viva · EL SOPORTE DONDE PASÓ, CON SU NOMBRE EN EL MOTOR (2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Idempotente: se puede correr dos veces sin daño. Va después de
-- ✅ 20261018d_telemetria.sql (ya pegada).
--
-- Desde escaner-app 54a9955, «¿Qué te faltó?» → «Algo no funcionó» →
-- «Cuéntanos qué pasó» abre el soporte encima de la pantalla donde pasó, y la
-- app lo mide como la capa «soporte.pregunta» (lib/telemetria v1.1). Una capa
-- nueva entra sola al catálogo la primera vez que alguien la abre, pero SIN
-- nombre; esto se lo pone de una vez para que Motor → Telemetría diga
-- «Soporte desde ¿Qué te faltó?» junto a Ajustes, en Mi Núcleo.
-- Sin esta línea no se pierde nada: el Motor la cuenta igual, con su clave.

INSERT INTO public.tele_catalogo (funcion, nombre, grupo, tipo, orden, valor, oculta, nota) VALUES
    ('soporte.pregunta', 'Soporte desde «¿Qué te faltó?»', 'Mi Núcleo', 'capa', 94, false, false,
     'Algo no funcionó → Cuéntanos qué pasó: el soporte abierto donde pasó (el caso lleva fields.donde y fields.origen)')
ON CONFLICT (funcion) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    grupo  = EXCLUDED.grupo,
    orden  = EXCLUDED.orden,
    nota   = EXCLUDED.nota;
