-- Red Solar Viva · AUDITORÍA · PARTE 3 — la baja de correos se respeta de verdad
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Decisión de Zak (2026-07-27): que SOLO el enlace firmado pueda revertir una baja.
--
-- ── EL HUECO (verificado en vivo con la sola llave pública) ──────────────────
--     POST /rest/v1/rpc/restore_email_opt_in {"p_email":"..."}  →  200 true
-- El enlace de baja SÍ va firmado y Pipedream SÍ valida ese HMAC
-- (UnsubscribeEmail.js), pero la validación vive en el workflow, no en la base.
-- Llamando la RPC directo se salta el workflow entero: cualquiera podía volver
-- a meter en el padrón a alguien que había pedido no recibir correos, sin que
-- esa persona se enterara. Es justo lo contrario de lo que promete una baja.
--
-- ── EL CIERRE ────────────────────────────────────────────────────────────────
-- La RPC pasa a exigir la MISMA firma que ya viaja en el enlace del correo. Se
-- valida contra el secreto guardado en Vault, del lado del servidor.
--
-- Compatibilidad deliberada: quien la llame SIN firma recibe `false` y no pasa
-- nada. Eso desactiva por diseño el camino que hoy revierte una baja desde el
-- formulario público de newsletter (SubscribeEmail / GuardarMensajesStep): un
-- formulario abierto, donde cualquiera puede escribir el correo de otro, no
-- debe poder deshacer la baja de nadie. Quien quiera volver a recibir correos
-- lo hace desde su propio enlace, que solo llega a su bandeja.
--
-- `record_email_opt_out` (darse de BAJA) queda pública a propósito: una baja
-- siempre debe poder ejecutarse, y el peor abuso posible es dar de baja a
-- alguien, que es el lado seguro del error.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ── 1) El secreto ─────────────────────────────────────────────────────────
-- La variable EMAIL_UNSUBSCRIBE_SECRET de Pipedream está marcada "encrypted":
-- se puede SOBRESCRIBIR pero ya no se puede LEER, así que no había forma de
-- copiar el valor que ya estaba en uso. Se ROTA en vez de copiar: el valor de
-- abajo se generó acá (openssl rand -hex 32) y es el que Zak debe pegar TAL
-- CUAL, carácter por carácter, en Pipedream → Settings → Environment
-- Variables → EMAIL_UNSUBSCRIBE_SECRET (sobrescribir el valor existente).
--
-- Costo de rotar (aceptado, es menor): los enlaces de baja/alta que ya
-- mandamos con la firma VIEJA van a mostrar "ENLACE INVÁLIDO" si alguien los
-- toca después de este cambio — UnsubscribeEmail.js ya tiene ese mensaje
-- amable con el correo de soporte para ese caso, no rompe nada, solo esos
-- links puntuales dejan de servir. Los correos nuevos que salgan después de
-- rotar firman con el valor nuevo y funcionan normal.
DO $$
DECLARE v_secret text := '83af410ad76500a7f413b6ce3827c7dcedd0d42ff18b1c9068eaa5e6e2312aab';
BEGIN
    IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'email_unsubscribe_key') THEN
        PERFORM vault.update_secret(
            (SELECT id FROM vault.secrets WHERE name = 'email_unsubscribe_key'),
            v_secret
        );
    ELSE
        PERFORM vault.create_secret(
            v_secret,
            'email_unsubscribe_key',
            'Firma de los enlaces de baja/alta de correos (espejo de EMAIL_UNSUBSCRIBE_SECRET en Pipedream)'
        );
    END IF;
END $$;

-- ── 2) La firma, calculada igual que en Pipedream ────────────────────────────
-- Pipedream hace: createHmac('sha256', secret).update(email).digest('base64url')
-- base64url = base64 con '+'→'-', '/'→'_' y sin el relleno '='.
CREATE OR REPLACE FUNCTION public._email_sig(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE k text; v text;
BEGIN
    SELECT decrypted_secret INTO k
    FROM vault.decrypted_secrets WHERE name = 'email_unsubscribe_key' LIMIT 1;
    IF k IS NULL THEN RETURN NULL; END IF;
    v := encode(hmac(p_email, k, 'sha256'), 'base64');
    v := replace(replace(v, E'\n', ''), E'\r', '');
    v := replace(replace(replace(v, '+', '-'), '/', '_'), '=', '');
    RETURN v;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public._email_sig(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._email_sig(text) TO service_role;

-- ── 3) restore_email_opt_in exige la firma ───────────────────────────────────
-- Firma nueva (2 params). La vieja de 1 param se elimina para que nadie pueda
-- seguir llamándola sin firma; PostgREST resolvería la de 1 argumento si
-- quedara viva y el candado no serviría de nada.
DROP FUNCTION IF EXISTS public.restore_email_opt_in(TEXT);

CREATE OR REPLACE FUNCTION public.restore_email_opt_in(
    p_email TEXT,
    p_sig   TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
    v_exp   TEXT;
BEGIN
    IF v_email IS NULL OR v_email = '' THEN
        RETURN false;
    END IF;

    -- Sin firma no se revierte nada. Es el caso del formulario público.
    IF p_sig IS NULL OR length(trim(p_sig)) = 0 THEN
        RETURN false;
    END IF;

    v_exp := public._email_sig(v_email);
    -- Si el Vault no responde, se rechaza (fail-CLOSED). Aquí lo seguro es no
    -- revertir: al contrario que en el cifrado, equivocarse hacia el "sí" le
    -- devolvería correos a alguien que pidió no recibirlos.
    IF v_exp IS NULL OR v_exp <> trim(p_sig) THEN
        RETURN false;
    END IF;

    DELETE FROM public.email_opt_outs WHERE email = v_email;
    RETURN true;
END;
$$;

-- Sigue siendo alcanzable por los workflows (usan la llave pública), pero ahora
-- solo sirve con la firma que únicamente viaja en el correo de esa persona.
GRANT EXECUTE ON FUNCTION public.restore_email_opt_in(TEXT, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- DESPUÉS DE PEGAR: dos retoques de una línea en Pipedream
-- =============================================================================
-- 1) UnsubscribeEmail.js  · el camino "deshacer" ya tiene el token validado:
--        callRpc("restore_email_opt_in", { p_email: rawEmail })
--    pasa a
--        callRpc("restore_email_opt_in", { p_email: rawEmail, p_sig: rawToken })
--
-- 2) SubscribeEmail.js y GuardarMensajesStep.js  · quitar su llamada a
--    restore_email_opt_in (ahora devuelve false y no hace nada). Alta al
--    newsletter y reversión de una baja dejan de ser la misma acción.
--
-- VERIFICAR:
--   SELECT public.restore_email_opt_in('probar@invalid.test');            -- false
--   SELECT public.restore_email_opt_in('probar@invalid.test', 'basura');  -- false
