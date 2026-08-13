-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Diagnóstico de horarios
-- 20260524_vtli_diagnostico.sql
--
-- NO modifica nada. Solo lee. Corré las tres consultas en Supabase Dashboard
-- → SQL Editor y pegame los tres resultados. Con eso sabemos por qué el
-- modal devuelve lista vacía y lo arreglamos en un solo movimiento.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ¿Cuántos slots fueron sembrados? ¿Qué rango cubren?
SELECT
    COUNT(*)             AS total_slots,
    MIN(slot_date)       AS primer_dia,
    MAX(slot_date)       AS ultimo_dia,
    COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM slot_date) = 1) AS lunes,
    COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM slot_date) = 2) AS martes,
    COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM slot_date) = 3) AS miercoles
FROM vtli_slots;

-- 2. ¿El RPC devuelve filas?
SELECT * FROM vtli_get_available_slots(2) LIMIT 10;

-- 3. ¿Cuántos slots quedan en las próximas 2 semanas con cupo libre?
SELECT slot_date, slot_time, reserved_count, capacity
FROM vtli_slots
WHERE slot_date >= CURRENT_DATE
  AND slot_date <= CURRENT_DATE + 14
  AND reserved_count < capacity
ORDER BY slot_date, slot_time
LIMIT 20;
