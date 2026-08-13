-- 20260508_ai_consent.sql
-- AI Consent del Decodificador de Materia.
-- Persistimos el consentimiento del Tripulante para enviar fotografías a
-- Google Cloud Vision + Google Gemini. Una vez otorgado, queda ligado a
-- su cuenta — basta una sola vez para que aplique en todos sus
-- dispositivos. Si revoca, la columna se setea a NULL y el Decodificador
-- vuelve a pedir consent al próximo uso.
--
-- Aplicar via Supabase Dashboard → SQL Editor → New Query → Run.

------------------------------------------------------------
-- 1) Columna ai_consent_at en profiles
------------------------------------------------------------
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS ai_consent_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN profiles.ai_consent_at IS
'Timestamp del consentimiento del Tripulante para procesamiento por IA externa (Cloud Vision + Gemini). NULL = no ha consentido.';

------------------------------------------------------------
-- 2) RPC get_ai_consent_at — devuelve el timestamp o NULL
------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_ai_consent_at(p_clerk_user_id text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consent timestamptz;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN NULL;
    END IF;
    SELECT ai_consent_at INTO v_consent
    FROM profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;
    RETURN v_consent;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ai_consent_at(text) TO anon, authenticated;

------------------------------------------------------------
-- 3) RPC set_ai_consent_at — escribe now() (idempotente)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_ai_consent_at(p_clerk_user_id text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now timestamptz := now();
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RAISE EXCEPTION 'clerk_user_id is required';
    END IF;
    UPDATE profiles
    SET ai_consent_at = v_now
    WHERE clerk_user_id = p_clerk_user_id;
    -- Si no hay fila (caso edge: profile no creado todavía), dejamos
    -- que `ensure_profile` la cree después con el consent ya aplicado.
    -- Aquí simplemente devolvemos el timestamp para que el cliente lo
    -- use en optimistic update.
    RETURN v_now;
END;
$$;

GRANT EXECUTE ON FUNCTION set_ai_consent_at(text) TO anon, authenticated;

------------------------------------------------------------
-- 4) RPC clear_ai_consent_at — borra el consent (revocación)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION clear_ai_consent_at(p_clerk_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RAISE EXCEPTION 'clerk_user_id is required';
    END IF;
    UPDATE profiles
    SET ai_consent_at = NULL
    WHERE clerk_user_id = p_clerk_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION clear_ai_consent_at(text) TO anon, authenticated;
