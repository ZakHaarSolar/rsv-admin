-- ═══════════════════════════════════════════════════════════════════════
-- 🜂 ¿UN BORRADO MASIVO O SEIS A MANO? ¿Y ES UN BOT? (Zak 2026-08-24)
-- ═══════════════════════════════════════════════════════════════════════
-- Corre UNA por vez (el SQL Editor solo muestra la última).
-- ═══════════════════════════════════════════════════════════════════════


-- ═══ 1 · CADA EVENTO DE BORRADO, uno por línea ══════════════════════════
-- Si aparece UNA fila con 6 conversaciones → fue un borrado masivo, o sea el
-- bug que acabamos de tapar. Si aparecen SEIS filas de 1 → los borró a mano.
SELECT b.borrado_at, b.conversaciones, b.mensajes,
       COALESCE(p.email, b.clerk_user_id) AS quien
FROM oraculo_borrados b
LEFT JOIN profiles p ON p.clerk_user_id = b.clerk_user_id
ORDER BY b.borrado_at DESC
LIMIT 50;


-- ═══ 2 · EL RITMO DE ESA PERSONA ════════════════════════════════════════
-- Un humano escribe, lee la respuesta y tarda. Un bot manda en ráfaga.
-- Mira "segundos_desde_el_anterior": si casi todos son de 1 a 3 segundos,
-- no hay nadie leyendo. Si son de 20 segundos para arriba, hay alguien.
SELECT
    m.created_at,
    m.role,
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at)
        OVER (ORDER BY m.created_at)))::INT AS segundos_desde_el_anterior,
    LENGTH(m.content) AS largo
FROM oraculo_messages m
JOIN profiles p ON p.clerk_user_id = m.clerk_user_id
WHERE p.email ILIKE '%fgjd6syz4h%'
ORDER BY m.created_at DESC
LIMIT 60;


-- ═══ 3 · SU HUELLA COMPLETA, en una línea ═══════════════════════════════
SELECT
    p.email,
    (SELECT sent_count FROM oraculo_usage u WHERE u.clerk_user_id = p.clerk_user_id) AS enviados,
    (SELECT COUNT(*) FROM oraculo_conversations c WHERE c.clerk_user_id = p.clerk_user_id) AS conversaciones_vivas,
    (SELECT COUNT(*) FROM oraculo_messages m WHERE m.clerk_user_id = p.clerk_user_id) AS mensajes_vivos,
    (SELECT COUNT(*) FROM oraculo_borrados b WHERE b.clerk_user_id = p.clerk_user_id) AS veces_que_borro,
    (SELECT SUM(conversaciones) FROM oraculo_borrados b WHERE b.clerk_user_id = p.clerk_user_id) AS conversaciones_borradas,
    (SELECT SUM(mensajes) FROM oraculo_borrados b WHERE b.clerk_user_id = p.clerk_user_id) AS mensajes_borrados
FROM profiles p
WHERE p.email ILIKE '%fgjd6syz4h%';
