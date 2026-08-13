-- Red Solar Viva · AUDITORÍA 2026-07-24 · PARTE 2 · ensure_profile endurecida
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- NO cambia la firma NI los permisos → la app publicada en la App Store la
-- sigue llamando igual en cada arranque. NO requiere build de iOS ni deploy.
--
-- ── EL PROBLEMA ───────────────────────────────────────────────────────────────
-- `ensure_profile` nació el 2026-04-17 como red de seguridad: si el webhook de
-- Clerk fallaba, el Tripulante quedaba sin fila en `profiles` y sus escaneos no
-- persistían. Se le dio GRANT a anon a propósito, y su propio comentario dejó
-- escrito el riesgo asumido:
--
--     "Seguridad: esta función acepta cualquier clerk_user_id/email que le pase
--      el cliente. Está ok para la fase actual (todos los tripulantes son
--      reales, no hay ataque de profile injection a escala)."
--
-- Esa premisa caducó: la app está publicada en la App Store y la anon key viaja
-- en el bundle. Hoy, con la sola llave pública, un tercero puede llamar
--   POST /rest/v1/rpc/ensure_profile
--   {"p_clerk_user_id":"<id de otro>","p_email":"atacante@…","p_full_name":"…"}
-- y el ON CONFLICT DO UPDATE le REESCRIBE el correo, el nombre y el avatar a esa
-- persona. El COALESCE(NULLIF(...)) solo protege contra la cadena vacía, no
-- contra un valor suministrado. Envenenar el correo desvía los Pulsos, el Ciclo
-- Sellado y todo lo que empareja por correo (compras de Stripe, padrón).
--
-- ── EL ARREGLO ────────────────────────────────────────────────────────────────
-- Se conserva el propósito original (garantizar que la fila exista) y se quita
-- la capacidad de pisar una fila AJENA: sobre una fila que YA EXISTE, la
-- actualización solo procede si el correo suministrado COINCIDE con el
-- guardado, o si el guardado está vacío. El flujo legítimo siempre manda el
-- correo real que Clerk tiene en sesión, así que para el Tripulante no cambia
-- nada; el atacante deja de poder reescribir datos ajenos.
--
-- ¿Y si alguien cambia su correo en Clerk? Ese camino NO depende de esta
-- función: el webhook `clerk-webhook` maneja `user.updated` con firma svix
-- verificada y hace el upsert completo de correo/nombre/avatar
-- (admin/supabase/functions/clerk-webhook/index.ts:32-57). Ese es el camino
-- correcto y sigue intacto.

CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_clerk_user_id text,
  p_email text,
  p_full_name text DEFAULT '',
  p_avatar_url text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(trim(p_email));
BEGIN
  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'clerk_user_id requerido';
  END IF;

  -- Sanity check barato: los ids de Clerk son 'user_' + ~27 alfanuméricos.
  -- Rechaza basura evidente sin estorbar a ningún id real.
  IF p_clerk_user_id !~ '^user_[A-Za-z0-9]{10,}$' THEN
    RAISE EXCEPTION 'clerk_user_id con formato inválido';
  END IF;

  INSERT INTO public.profiles (
    clerk_user_id, email, full_name, avatar_url, updated_at
  )
  VALUES (
    p_clerk_user_id, v_email, p_full_name, p_avatar_url, now()
  )
  ON CONFLICT (clerk_user_id) DO UPDATE SET
    email      = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
    full_name  = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
    updated_at = EXCLUDED.updated_at
  -- ── GUARDA DE PROPIEDAD ──
  -- Solo actualiza si quien llama demuestra conocer el correo ya guardado
  -- (o si la fila todavía no tiene correo). Sin esto, cualquiera con la anon
  -- key y un clerk_user_id ajeno reescribe el perfil de esa persona.
  WHERE public.profiles.email IS NULL
     OR public.profiles.email = ''
     OR lower(trim(public.profiles.email)) = v_email
  RETURNING id INTO v_id;

  -- Si la guarda bloqueó el UPDATE, el INSERT ... RETURNING no devuelve fila.
  -- El contrato de la función es devolver SIEMPRE el uuid del perfil, así que
  -- se recupera el existente (la app solo lo usa para saber que ya hay fila).
  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id;
  END IF;

  RETURN v_id;
END;
$$;

-- Permisos SIN CAMBIOS a propósito: la app publicada la llama con la anon key
-- en cada arranque. Revocarla ahora rompería el alta de perfiles de la build
-- viva. El cierre definitivo (rutearla por el gateway `user-action` con el id
-- inyectado del token + REVOKE) queda para el próximo build de iOS.
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- RIESGO RESIDUAL ACEPTADO (documentado, no cerrado aquí):
--   Se pueden seguir CREANDO filas nuevas para clerk ids con formato válido que
--   no existen en Clerk (crecimiento de tabla). Bloquearlo rompería el propósito
--   original de la función. Queda acotado por el chequeo de formato y se cierra
--   del todo cuando la función pase por el gateway en el próximo build.
-- ═════════════════════════════════════════════════════════════════════════════
