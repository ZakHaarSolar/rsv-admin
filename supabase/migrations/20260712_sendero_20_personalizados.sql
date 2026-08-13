-- Red Solar Viva · SENDERO DE LUZ — de 10 a 20 rituales personalizados
-- =====================================================================
-- 20260712_sendero_20_personalizados.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Feedback de usuarios: con Sintonía se podían crear hasta 10 rutinas
-- propias en el Sendero; sube a 20. Dos cambios:
--   (A) 10 filas nuevas del catálogo (personalizado_11..20, sort 100-109;
--       puntos editables en Motor → Rituales).
--   (B) set_ritual_personalizado clampa el slot a 20 (antes 10). El resto
--       (guardar / limpiar por slot) queda idéntico.
-- La tabla ritual_personalizado NO cambia (PK clerk_user_id+slot ya soporta
-- N slots). El cliente (RitualDiario) sube PERSO_MAX 10→20.

-- (A) Slots 11-20 en el catálogo.
INSERT INTO public.daily_ritual_catalog (activity_key, label, points, requires_text, active, sort_order) VALUES
    ('personalizado_11', 'Personalizado 11', 10, false, true, 100),
    ('personalizado_12', 'Personalizado 12', 10, false, true, 101),
    ('personalizado_13', 'Personalizado 13', 10, false, true, 102),
    ('personalizado_14', 'Personalizado 14', 10, false, true, 103),
    ('personalizado_15', 'Personalizado 15', 10, false, true, 104),
    ('personalizado_16', 'Personalizado 16', 10, false, true, 105),
    ('personalizado_17', 'Personalizado 17', 10, false, true, 106),
    ('personalizado_18', 'Personalizado 18', 10, false, true, 107),
    ('personalizado_19', 'Personalizado 19', 10, false, true, 108),
    ('personalizado_20', 'Personalizado 20', 10, false, true, 109)
ON CONFLICT (activity_key) DO NOTHING;

-- (B) Guardar / limpiar UNA rutina por slot — clamp 1..20.
CREATE OR REPLACE FUNCTION public.set_ritual_personalizado(
    p_clerk_user_id text,
    p_label         text,
    p_slot          int DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lbl  text := LEFT(COALESCE(TRIM(p_label), ''), 40);
    slt  int  := LEAST(GREATEST(COALESCE(p_slot, 1), 1), 20);
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF lbl = '' THEN
        -- Vacío = limpiar ese slot (deja de mostrarse).
        DELETE FROM ritual_personalizado
        WHERE clerk_user_id = p_clerk_user_id AND slot = slt;
        RETURN json_build_object('label', '', 'slot', slt);
    END IF;
    INSERT INTO ritual_personalizado (clerk_user_id, slot, label, updated_at)
    VALUES (p_clerk_user_id, slt, lbl, now())
    ON CONFLICT (clerk_user_id, slot)
    DO UPDATE SET label = EXCLUDED.label, updated_at = now();
    RETURN json_build_object('label', lbl, 'slot', slt);
END $$;

-- Re-afirmar el candado (un CREATE OR REPLACE puede re-abrir a PUBLIC).
REVOKE ALL ON FUNCTION public.set_ritual_personalizado(text, text, int)   FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_ritual_personalizado(text, text, int)  TO service_role;

NOTIFY pgrst, 'reload schema';
