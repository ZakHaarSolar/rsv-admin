-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Ola B (seguridad) · Vías seguras para membresía + compras
--
-- Problema: el cliente leía `subscriptions` y `purchases` DIRECTO con la
-- llave pública (anon), lo que permitía a cualquiera volcar TODA la base de
-- clientes (correos, nombres, montos, qué compró cada quien) con un solo
-- GET sin filtro. Confirmado en vivo 2026-06-07.
--
-- Solución: dos RPCs SECURITY DEFINER que devuelven SOLO lo que la app
-- necesita y NUNCA un correo ni un listado completo:
--   · get_my_membership(p_email)  → { active, promo_code, group_name }
--   · get_my_purchases(p_email)   → [ { book_id, formats_purchased }, ... ]
-- Se keyean por el correo que el cliente ya tiene (mismo comportamiento que
-- la lectura directa), pero la respuesta no expone PII de otros y no se
-- puede enumerar (hay que conocer el correo exacto; no devuelve la lista).
--
-- Tras cambiar el cliente a estas RPCs y desplegar, se puede REVOCAR el
-- acceso anon a `subscriptions` y `purchases` (script aparte) para cerrar
-- el volcado por completo. Endurecimiento futuro: verificar el token de
-- Clerk (como decode-matter/delete-account) en vez de confiar en el correo.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Membresía activa (sin exponer correo) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_membership(p_email text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'active', true,
        'promo_code', s.promo_code,
        'group_name', s.group_name
      )
      FROM public.subscriptions s
      WHERE s.status = 'active'
        AND p_email IS NOT NULL
        AND length(trim(p_email)) >= 3
        AND lower(s.email) = lower(trim(p_email))
      ORDER BY s.current_period_end DESC NULLS LAST
      LIMIT 1
    ),
    jsonb_build_object('active', false)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_membership(text) TO anon, authenticated;

-- ── Compras del tripulante (solo book_id + formatos, sin PII) ─────────────
CREATE OR REPLACE FUNCTION public.get_my_purchases(p_email text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'book_id', p.book_id,
          'formats_purchased', p.formats_purchased
        )
      )
      FROM public.purchases p
      WHERE p_email IS NOT NULL
        AND length(trim(p_email)) >= 3
        AND lower(p.email) = lower(trim(p_email))
    ),
    '[]'::jsonb
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_purchases(text) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
