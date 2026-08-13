-- Red Solar Viva · AUDITORÍA 2026-07-24 · PARTE 2 · CIFRADO EN REPOSO (1/2)
-- ESPEJO VIBRACIONAL — las conversaciones
-- =============================================================================
-- Decisión de Zak (2026-07-24): cifrar primero lo más íntimo. El Espejo es la
-- superficie #1 de esa lista — ahí la gente escribe lo que no le cuenta a nadie,
-- y desde el 2026-07-19 también las lecturas de sus fotos.
--
-- ORDEN OBLIGATORIO (hazlo seguido, sin dejar días en medio):
--   1) Pegar ESTE archivo en el SQL Editor.
--   2) supabase functions deploy oraculo-chat --no-verify-jwt   (v1.11)
-- Entre (1) y (2) hay una ventana corta en la que el edge lee el historial ya
-- cifrado y el Espejo no recordaría los mensajes viejos de esa charla. Nada se
-- pierde (el dato está intacto, solo cifrado) y se corrige al desplegar.
--
-- POR QUÉ ASÍ: el edge accede a `oraculo_messages` DIRECTAMENTE (no por RPC),
-- así que el cifrado va en un TRIGGER de escritura —transparente, el INSERT del
-- edge no se toca— y la lectura pasa por una vista que descifra al vuelo. El
-- cliente de la app NO cambia: no requiere build de iOS.
--
-- El panel del Motor sigue funcionando: su RPC se re-crea descifrando (cuerpo
-- verificado contra 20260630_oraculo_admin_view.sql, sin divergencia).
--
-- Precedente que replica: 20260620q_dm_encrypt_at_rest.sql (mensajes privados).
-- Llave PROPIA en Vault (`oraculo_key`), separada de la de los DMs.
-- Helpers defensivos: si el Vault no responde, devuelven el texto tal cual y el
-- Espejo sigue vivo — el cifrado nunca puede tumbar la conversación.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 1) Llave propia en Vault (una sola vez).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'oraculo_key') THEN
        PERFORM vault.create_secret(
            encode(gen_random_bytes(32), 'hex'),
            'oraculo_key',
            'Llave de cifrado en reposo de las conversaciones del Espejo'
        );
    END IF;
END $$;

ALTER TABLE public.oraculo_messages ADD COLUMN IF NOT EXISTS enc boolean NOT NULL DEFAULT false;

-- 2) Helpers (mismo patron defensivo que _dm_key/_dm_decrypt).
CREATE OR REPLACE FUNCTION public._oraculo_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    SELECT decrypted_secret INTO k
    FROM vault.decrypted_secrets WHERE name = 'oraculo_key' LIMIT 1;
    RETURN k;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public._oraculo_decrypt(p_text text, p_enc boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE k text;
BEGIN
    IF p_text IS NULL OR NOT COALESCE(p_enc, false) THEN RETURN p_text; END IF;
    k := public._oraculo_key();
    IF k IS NULL THEN RETURN p_text; END IF;
    RETURN pgp_sym_decrypt(dearmor(p_text), k);
EXCEPTION WHEN OTHERS THEN
    RETURN p_text;
END $$;

REVOKE ALL ON FUNCTION public._oraculo_key()                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._oraculo_decrypt(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._oraculo_key()                  TO service_role;
GRANT EXECUTE ON FUNCTION public._oraculo_decrypt(text, boolean) TO service_role;

-- 3) Trigger: cifra al escribir (el edge no cambia su INSERT).
CREATE OR REPLACE FUNCTION public._oraculo_encrypt_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE k text;
BEGIN
    IF NEW.content IS NULL OR COALESCE(NEW.enc, false) THEN RETURN NEW; END IF;
    k := public._oraculo_key();
    IF k IS NULL THEN RETURN NEW; END IF;
    BEGIN
        NEW.content := armor(pgp_sym_encrypt(NEW.content, k));
        NEW.enc := true;
    EXCEPTION WHEN OTHERS THEN
        NULL;  -- nunca rompe el chat
    END;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS oraculo_messages_encrypt ON public.oraculo_messages;
CREATE TRIGGER oraculo_messages_encrypt
    BEFORE INSERT OR UPDATE OF content ON public.oraculo_messages
    FOR EACH ROW EXECUTE FUNCTION public._oraculo_encrypt_tg();

-- 4) Vista que descifra al vuelo (a esta apunta el edge).
CREATE OR REPLACE VIEW public.oraculo_messages_plain
WITH (security_invoker = false) AS
    SELECT m.id,
           m.conversation_id,
           m.clerk_user_id,
           m.role,
           public._oraculo_decrypt(m.content, m.enc) AS content,
           m.created_at
    FROM public.oraculo_messages m;

REVOKE ALL ON public.oraculo_messages_plain FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.oraculo_messages_plain TO service_role;

-- 5) El panel admin descifra (mismo cuerpo, content por el helper).
CREATE OR REPLACE FUNCTION public.admin_get_oraculo_conversations(
    p_admin_clerk_id text,
    p_limit integer DEFAULT 40
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result   json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN RAISE EXCEPTION 'not_admin'; END IF;

    SELECT COALESCE(json_agg(c ORDER BY c.last_at DESC NULLS LAST), '[]'::json)
    INTO v_result
    FROM (
        SELECT
            conv.id AS conv_id,
            'Nodo ' || substr(md5(conv.clerk_user_id), 1, 6) AS alias,
            conv.last_at,
            (
                SELECT COALESCE(json_agg(json_build_object(
                    'role', m.role,
                    'content', public._oraculo_decrypt(m.content, m.enc),
                    'created_at', m.created_at
                ) ORDER BY m.created_at ASC), '[]'::json)
                FROM public.oraculo_messages m
                WHERE m.conversation_id = conv.id
            ) AS messages,
            (
                SELECT COUNT(*) FROM public.oraculo_messages m2
                WHERE m2.conversation_id = conv.id
            ) AS msg_count
        FROM public.oraculo_conversations conv
        ORDER BY conv.last_at DESC NULLS LAST
        LIMIT GREATEST(1, LEAST(p_limit, 200))
    ) c;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    TO service_role;

-- 6) Cifra el historial que ya existe en claro.
DO $$
DECLARE k text;
BEGIN
    k := public._oraculo_key();
    IF k IS NOT NULL THEN
        UPDATE public.oraculo_messages
        SET content = armor(pgp_sym_encrypt(content, k)), enc = true
        WHERE NOT COALESCE(enc, false) AND content IS NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

NOTIFY pgrst, 'reload schema';

-- NOTA: si aplicas el bloque de alias HMAC del hallazgo espejo-alias-md5-reversible,
-- pegalo DESPUES de este (reemplaza el substr(md5(...)) del punto 5).