-- ═══════════════════════════════════════════════════════════════════════
-- 🜂 DIAGNÓSTICO DEL PRIMER SUSCRIPTOR (Zak 2026-08-20)
-- ═══════════════════════════════════════════════════════════════════════
-- Dos dudas:
--   (A) sus seis pilares salen TODOS en 100 y él recuerda haber visto 90 y algo
--   (B) el panel dice "enviados 32" en el Espejo y no aparece ni una conversación
--
-- Pégalo entero en Supabase → SQL Editor → Run. Devuelve cuatro resultados.
-- Si el correo no es exactamente ese, cambia la línea de abajo y ya.
-- ═══════════════════════════════════════════════════════════════════════

-- ── (0) Quién es, y su clerk_user_id para las demás consultas ──────────
SELECT clerk_user_id, email, full_name, created_at
FROM profiles
WHERE email ILIKE '%fgjd6syz4h%';

-- ── (A1) Sus scans: el puntaje de cada pilar y CUÁNDO se guardó ────────
-- Si hay varias filas se ve la historia: si de verdad hubo 90 antes del 100,
-- aquí aparece. Si solo hay una fila, el 100 es lo único que existió.
SELECT
    s.created_at,
    s.hardware_fisico      AS cuerpo,
    s.procesador_mental    AS mente,
    s.motor_emocional      AS emociones,
    s.gravedad_financiera  AS abundancia,
    s.vector_expansion     AS proposito,
    s.orbita_relacional    AS vinculos,
    s.indice_silicio       AS indice_de_luz,
    s.cycle_scanned_json   AS pilares_del_ciclo,
    s.last_update_fisico, s.last_update_mental, s.last_update_emocional,
    s.last_update_financiero, s.last_update_vector, s.last_update_orbita
FROM scan_vibracional s
JOIN profiles p ON p.clerk_user_id = s.clerk_user_id
WHERE p.email ILIKE '%fgjd6syz4h%'
ORDER BY s.created_at DESC;

-- ── (A2) ¿Quedó progreso de sondas a medias? ───────────────────────────
-- sonda_progress se borra al cerrar cada pilar, así que lo normal es vacío.
SELECT sp.*
FROM sonda_progress sp
JOIN profiles p ON p.clerk_user_id = sp.clerk_user_id
WHERE p.email ILIKE '%fgjd6syz4h%';

-- ── (B) El Espejo: contador contra conversaciones REALES ───────────────
-- sent_count es un acumulado que NUNCA baja. Si el tripulante borró sus
-- reflejos desde la app, el contador sigue alto y las filas ya no existen.
SELECT
    (SELECT sent_count FROM oraculo_usage u
      WHERE u.clerk_user_id = p.clerk_user_id)                    AS contador_enviados,
    (SELECT COUNT(*) FROM oraculo_conversations c
      WHERE c.clerk_user_id = p.clerk_user_id)                    AS conversaciones_vivas,
    (SELECT COUNT(*) FROM oraculo_messages m
      WHERE m.clerk_user_id = p.clerk_user_id)                    AS mensajes_vivos,
    (SELECT MAX(last_at) FROM oraculo_conversations c
      WHERE c.clerk_user_id = p.clerk_user_id)                    AS ultima_actividad
FROM profiles p
WHERE p.email ILIKE '%fgjd6syz4h%';
