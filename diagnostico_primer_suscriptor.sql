-- ═══════════════════════════════════════════════════════════════════════
-- 🜂 DIAGNÓSTICO DEL PRIMER SUSCRIPTOR (Zak 2026-08-20)
-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ El SQL Editor de Supabase solo muestra el resultado de la ÚLTIMA
--    consulta. Corre UNA por vez: selecciona su bloque con el cursor y
--    dale Run (o borra las otras).
--
-- YA CORRIDA (2026-08-20) — Espejo: contador 32 · conversaciones 0 ·
-- mensajes 0 · última actividad null. Sus reflejos no existen.
-- Falta saber POR QUÉ: los borró él, o se guardaron bajo otra identidad.
-- ═══════════════════════════════════════════════════════════════════════


-- ═══ CONSULTA 1 · LOS PILARES ═══════════════════════════════════════════
-- Si de verdad hubo un 90 y algo antes del 100, aquí sale con su fecha.
-- Si solo hay una fila, el 100 es lo único que existió.
SELECT
    s.created_at,
    s.hardware_fisico      AS cuerpo,
    s.procesador_mental    AS mente,
    s.motor_emocional      AS emociones,
    s.gravedad_financiera  AS abundancia,
    s.vector_expansion     AS proposito,
    s.orbita_relacional    AS vinculos,
    s.indice_silicio       AS indice_de_luz,
    s.cycle_scanned_json   AS pilares_del_ciclo
FROM scan_vibracional s
JOIN profiles p ON p.clerk_user_id = s.clerk_user_id
WHERE p.email ILIKE '%fgjd6syz4h%'
ORDER BY s.created_at DESC;


-- ═══ CONSULTA 2 · ¿QUIÉN BORRÓ, O ESCRIBIMOS EN OTRO SITIO? ════════════
-- Las últimas 40 conversaciones del Espejo de TODA la casa, con el dueño
-- resuelto. Lo que hay que mirar:
--   · si aparecen filas con email vacío → hay reflejos de gente SIN perfil,
--     o sea que estamos escribiendo bajo una identidad y leyendo bajo otra.
--     Eso sería un bug nuestro, no un borrado.
--   · si todas tienen dueño conocido (ustedes dos) → el tripulante borró
--     los suyos desde su app, que es su derecho y funciona como debe.
SELECT
    c.id,
    c.clerk_user_id,
    COALESCE(p.email, '(sin perfil)') AS dueno,
    c.last_at,
    (SELECT COUNT(*) FROM oraculo_messages m WHERE m.conversation_id = c.id) AS mensajes
FROM oraculo_conversations c
LEFT JOIN profiles p ON p.clerk_user_id = c.clerk_user_id
ORDER BY c.last_at DESC NULLS LAST
LIMIT 40;


-- ═══ CONSULTA 3 · MENSAJES HUÉRFANOS ════════════════════════════════════
-- Mensajes del Espejo cuyo dueño no tiene perfil. Si esto devuelve algo,
-- la identidad se está partiendo en algún camino y hay que arreglarlo.
SELECT
    m.clerk_user_id,
    COUNT(*)        AS mensajes,
    MIN(m.created_at) AS primero,
    MAX(m.created_at) AS ultimo
FROM oraculo_messages m
LEFT JOIN profiles p ON p.clerk_user_id = m.clerk_user_id
WHERE p.clerk_user_id IS NULL
GROUP BY m.clerk_user_id
ORDER BY ultimo DESC;
