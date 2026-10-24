-- 20261024c_tele_catalogo_espejo.sql — 🜂 EL MOTOR NOMBRA LO QUE MIDE EL ESPEJO (2026-10-24)
-- Las acciones que la app cuenta desde lib/telemetria v1.3 (qué voz lee, la escucha automática, la Presencia, la
-- imagen, los interruptores, la paleta de comandos y sus atajos, las palabras limitantes, las emociones nombradas y
-- ¿Lo contesté?) entran al catálogo con su nombre legible y en su grupo (Espejo o Comunidad), así Motor →
-- Telemetría las muestra dentro de su capa y no como «Sin catálogo». Además corrige «espejo:voz»: no es la voz de
-- Bennett, son todas las partes leídas con voz (las cuenta el servidor).
-- Se puede correr más de una vez.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

UPDATE public.tele_catalogo SET nombre = 'Partes leídas con voz (todas las voces, servidor)'
WHERE funcion = 'espejo:voz';

INSERT INTO public.tele_catalogo (funcion, nombre, grupo, tipo, orden, valor, oculta) VALUES
    ('espejo:lectura.bennett', 'Lecturas con Bennett', 'Espejo', 'accion', 35, false, false),
    ('espejo:lectura.owen', 'Lecturas con Owen', 'Espejo', 'accion', 36, false, false),
    ('espejo:lectura.cordelia', 'Lecturas con Cordelia', 'Espejo', 'accion', 37, false, false),
    ('espejo:lectura.margo', 'Lecturas con Margo', 'Espejo', 'accion', 38, false, false),
    ('espejo:lectura.auto', 'Lecturas automáticas (escucha automática)', 'Espejo', 'accion', 39, false, false),
    ('espejo:voz_elegida.bennett', 'Eligió la voz Bennett', 'Espejo', 'accion', 40, false, false),
    ('espejo:voz_elegida.owen', 'Eligió la voz Owen', 'Espejo', 'accion', 41, false, false),
    ('espejo:voz_elegida.cordelia', 'Eligió la voz Cordelia', 'Espejo', 'accion', 42, false, false),
    ('espejo:voz_elegida.margo', 'Eligió la voz Margo', 'Espejo', 'accion', 43, false, false),
    ('espejo:velocidad.0_75', 'Velocidad de lectura 0.75x', 'Espejo', 'accion', 44, false, false),
    ('espejo:velocidad.1', 'Velocidad de lectura 1x', 'Espejo', 'accion', 45, false, false),
    ('espejo:velocidad.1_25', 'Velocidad de lectura 1.25x', 'Espejo', 'accion', 46, false, false),
    ('espejo:velocidad.1_5', 'Velocidad de lectura 1.5x', 'Espejo', 'accion', 47, false, false),
    ('espejo:velocidad.2', 'Velocidad de lectura 2x', 'Espejo', 'accion', 48, false, false),
    ('espejo:escucha_auto.on', 'Escucha automática: encendida', 'Espejo', 'accion', 49, false, false),
    ('espejo:escucha_auto.off', 'Escucha automática: apagada', 'Espejo', 'accion', 50, false, false),
    ('espejo:seguir.on', 'Seguimiento del reflejo: encendido', 'Espejo', 'accion', 51, false, false),
    ('espejo:seguir.off', 'Seguimiento del reflejo: apagado', 'Espejo', 'accion', 52, false, false),
    ('espejo:presencia.on', 'Presencia: encendida', 'Espejo', 'accion', 53, false, false),
    ('espejo:presencia.off', 'Presencia: apagada', 'Espejo', 'accion', 54, false, false),
    ('espejo:imagen.on', 'Modo imagen: encendido', 'Espejo', 'accion', 55, false, false),
    ('espejo:imagen.off', 'Modo imagen: apagado', 'Espejo', 'accion', 56, false, false),
    ('espejo:limitantes.on', 'Palabras limitantes: encendidas', 'Espejo', 'accion', 57, false, false),
    ('espejo:limitantes.off', 'Palabras limitantes: apagadas', 'Espejo', 'accion', 58, false, false),
    ('espejo:emociones.on', 'Nombrar emociones: encendido', 'Espejo', 'accion', 59, false, false),
    ('espejo:emociones.off', 'Nombrar emociones: apagado', 'Espejo', 'accion', 60, false, false),
    ('espejo:presencia.reflejo', 'Reflejos en Presencia', 'Espejo', 'accion', 61, false, false),
    ('espejo:limitantes.cambio', 'Cambios por la frase que expande', 'Espejo', 'accion', 62, false, false),
    ('espejo:comando.enviar', 'Paleta de comandos: Enviar', 'Espejo', 'accion', 63, false, false),
    ('espejo:comando.nueva', 'Paleta de comandos: Conversación nueva', 'Espejo', 'accion', 64, false, false),
    ('espejo:comando.buscar', 'Paleta de comandos: Buscar', 'Espejo', 'accion', 65, false, false),
    ('espejo:comando.marcas', 'Paleta de comandos: Palabras limitantes', 'Espejo', 'accion', 66, false, false),
    ('espejo:comando.emociones', 'Paleta de comandos: Nombrar emociones', 'Espejo', 'accion', 67, false, false),
    ('espejo:comando.escucha', 'Paleta de comandos: Escucha automática', 'Espejo', 'accion', 68, false, false),
    ('espejo:comando.voz_bennett', 'Paleta de comandos: Voz Bennett', 'Espejo', 'accion', 69, false, false),
    ('espejo:comando.voz_owen', 'Paleta de comandos: Voz Owen', 'Espejo', 'accion', 70, false, false),
    ('espejo:comando.voz_cordelia', 'Paleta de comandos: Voz Cordelia', 'Espejo', 'accion', 71, false, false),
    ('espejo:comando.voz_margo', 'Paleta de comandos: Voz Margo', 'Espejo', 'accion', 72, false, false),
    ('espejo:comando.vel_0_75', 'Paleta de comandos: Velocidad 0.75x', 'Espejo', 'accion', 73, false, false),
    ('espejo:comando.vel_1', 'Paleta de comandos: Velocidad 1x', 'Espejo', 'accion', 74, false, false),
    ('espejo:comando.vel_1_25', 'Paleta de comandos: Velocidad 1.25x', 'Espejo', 'accion', 75, false, false),
    ('espejo:comando.vel_1_5', 'Paleta de comandos: Velocidad 1.5x', 'Espejo', 'accion', 76, false, false),
    ('espejo:comando.vel_2', 'Paleta de comandos: Velocidad 2x', 'Espejo', 'accion', 77, false, false),
    ('espejo:comando.detener', 'Paleta de comandos: Detener la lectura', 'Espejo', 'accion', 78, false, false),
    ('espejo:comando.seguir', 'Paleta de comandos: Seguimiento', 'Espejo', 'accion', 79, false, false),
    ('espejo:comando.presencia', 'Paleta de comandos: Presencia', 'Espejo', 'accion', 80, false, false),
    ('espejo:comando.sonidos', 'Paleta de comandos: Sonidos de la app', 'Espejo', 'accion', 81, false, false),
    ('espejo:atajo.keyk', 'Atajo ⌘K, abrir la paleta', 'Espejo', 'accion', 82, false, false),
    ('espejo:atajo.enter', 'Atajo ⌘↵, enviar desde fuera de la caja', 'Espejo', 'accion', 83, false, false),
    ('espejo:atajo.shift_keye', 'Atajo ⌘⇧E, escucha automática', 'Espejo', 'accion', 84, false, false),
    ('espejo:atajo.shift_keys', 'Atajo ⌘⇧S, seguimiento', 'Espejo', 'accion', 85, false, false),
    ('espejo:atajo.shift_keym', 'Atajo ⌘⇧M, palabras limitantes', 'Espejo', 'accion', 86, false, false),
    ('espejo:atajo.shift_keyo', 'Atajo ⌘⇧O, conversación nueva', 'Espejo', 'accion', 87, false, false),
    ('espejo:atajo.shift_keyp', 'Atajo ⌘⇧P, Presencia', 'Espejo', 'accion', 88, false, false),
    ('espejo:atajo.alt_digit1', 'Atajo ⌘⌥1, voz Bennett (Mac)', 'Espejo', 'accion', 89, false, false),
    ('espejo:atajo.shift_digit1', 'Atajo Ctrl⇧1, voz Bennett (Windows)', 'Espejo', 'accion', 90, false, false),
    ('espejo:atajo.alt_digit2', 'Atajo ⌘⌥2, voz Owen (Mac)', 'Espejo', 'accion', 91, false, false),
    ('espejo:atajo.shift_digit2', 'Atajo Ctrl⇧2, voz Owen (Windows)', 'Espejo', 'accion', 92, false, false),
    ('espejo:atajo.alt_digit3', 'Atajo ⌘⌥3, voz Cordelia (Mac)', 'Espejo', 'accion', 93, false, false),
    ('espejo:atajo.shift_digit3', 'Atajo Ctrl⇧3, voz Cordelia (Windows)', 'Espejo', 'accion', 94, false, false),
    ('espejo:atajo.alt_digit4', 'Atajo ⌘⌥4, voz Margo (Mac)', 'Espejo', 'accion', 95, false, false),
    ('espejo:atajo.shift_digit4', 'Atajo Ctrl⇧4, voz Margo (Windows)', 'Espejo', 'accion', 96, false, false),
    ('limitantes:on', 'Palabras limitantes: encendidas (app 1.1.68)', 'Espejo', 'accion', 97, false, false),
    ('limitantes:off', 'Palabras limitantes: apagadas (app 1.1.68)', 'Espejo', 'accion', 98, false, false),
    ('comunidad.mensajes:respuestas.suyo', '¿Lo contesté? en un mensaje de la otra persona', 'Comunidad', 'accion', 84, false, false),
    ('comunidad.mensajes:respuestas.mio', '¿Lo contesté? en un mensaje tuyo', 'Comunidad', 'accion', 85, false, false),
    ('comunidad.mensajes:limitantes.cambio', 'Cambios por la frase que expande (chat)', 'Comunidad', 'accion', 86, false, false)
ON CONFLICT (funcion) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    grupo  = EXCLUDED.grupo,
    tipo   = EXCLUDED.tipo,
    orden  = EXCLUDED.orden;
