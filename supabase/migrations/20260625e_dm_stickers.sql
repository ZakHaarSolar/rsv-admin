-- Red Solar Viva · MENSAJERÍA · Parte 3 — STICKERS de marca (paquetes DB-driven)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Paquetes de stickers (arte cósmico / glifos de frecuencia / el avatar en
-- gestos) editables desde el Motor SIN recompilar. El arte vive en R2 (WebP/PNG/
-- GIF — estático o animado; el <img> reproduce los animados nativamente en la
-- WebView). El catálogo es member-aware: los packs premium se desbloquean con
-- Sintonía / Inmersión; los base son gratis para todos.
--
-- Enviar un sticker NO sube nada: el cliente manda kind='sticker' +
-- media_meta={pack_id, sticker_id}. dm_send_message RESUELVE la URL del catálogo
-- y aplica el muro premium SERVER-SIDE (no confía en lo que mande el cliente),
-- guarda la URL CIFRADA en reposo como las fotos/notas, y deja preview "✨ Sticker".
--
-- Tablas RLS-locked (sin policies) → solo accesibles por las RPC DEFINER de
-- abajo, ruteadas por los gateways user-action / admin-action.

-- ── Tablas ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sticker_packs (
    id          bigserial PRIMARY KEY,
    name        text NOT NULL,
    description text,
    is_premium  boolean NOT NULL DEFAULT false,
    is_active   boolean NOT NULL DEFAULT true,
    sort_order  integer NOT NULL DEFAULT 0,
    cover_url   text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stickers (
    id          bigserial PRIMARY KEY,
    pack_id     bigint NOT NULL REFERENCES public.sticker_packs (id) ON DELETE CASCADE,
    image_url   text NOT NULL,
    is_animated boolean NOT NULL DEFAULT false,
    is_active   boolean NOT NULL DEFAULT true,
    sort_order  integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stickers_pack_idx ON public.stickers (pack_id);

ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers      ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sticker_packs FROM anon, authenticated;
REVOKE ALL ON public.stickers      FROM anon, authenticated;

-- ── Helper: ¿es miembro activo (Sintonía o Inmersión)? ──────────────
-- Mismo criterio que el paywall de Wallpapers (excluye los tiers
-- decoder/dream, que solo abren el Decodificador, NO los stickers premium).
CREATE OR REPLACE FUNCTION public._is_active_member(p_clerk_user_id text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN RETURN false; END IF;
    SELECT id INTO v_uid FROM profiles WHERE clerk_user_id = p_clerk_user_id LIMIT 1;
    IF v_uid IS NULL THEN RETURN false; END IF;
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = v_uid
          AND status IN ('active', 'trialing')
          AND group_name IN ('sintonia', 'cuasar', 'pulsar', 'inmersion')
    );
END $$;

-- ── Catálogo (Tripulante, member-aware) ─────────────────────────────
-- Devuelve { is_member, packs:[{ id, name, is_premium, locked, stickers:[...] }] }.
-- Los packs premium se devuelven SIEMPRE (para que se vean con candado), pero
-- `locked=true` si no eres miembro. El arte es de marca (no PII) → la URL viaja
-- igual; el muro real lo aplica dm_send_message.
CREATE OR REPLACE FUNCTION public.get_sticker_catalog(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_member boolean := public._is_active_member(p_clerk_user_id);
    v_packs  json;
BEGIN
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', sp.id,
            'name', sp.name,
            'is_premium', sp.is_premium,
            'locked', (sp.is_premium AND NOT v_member),
            'stickers', COALESCE((
                SELECT json_agg(json_build_object(
                    'id', s.id, 'url', s.image_url, 'animated', s.is_animated
                ) ORDER BY s.sort_order, s.id)
                FROM stickers s
                WHERE s.pack_id = sp.id AND s.is_active
            ), '[]'::json)
        ) ORDER BY sp.sort_order, sp.id
    ), '[]'::json)
    INTO v_packs
    FROM sticker_packs sp
    WHERE sp.is_active
      AND EXISTS (SELECT 1 FROM stickers s2 WHERE s2.pack_id = sp.id AND s2.is_active);

    RETURN json_build_object('is_member', v_member, 'packs', v_packs);
END $$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN (ruteadas por admin-action; doble blindaje: gateway valida
-- is_admin + estas revalidan con el id admin verificado inyectado).
-- ════════════════════════════════════════════════════════════════════

-- Catálogo completo para el editor del Motor (incluye inactivos + descripción).
CREATE OR REPLACE FUNCTION public.admin_get_sticker_packs(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', sp.id,
            'name', sp.name,
            'description', sp.description,
            'is_premium', sp.is_premium,
            'is_active', sp.is_active,
            'sort_order', sp.sort_order,
            'cover_url', sp.cover_url,
            'stickers', COALESCE((
                SELECT json_agg(json_build_object(
                    'id', s.id, 'url', s.image_url, 'animated', s.is_animated,
                    'is_active', s.is_active, 'sort_order', s.sort_order
                ) ORDER BY s.sort_order, s.id)
                FROM stickers s WHERE s.pack_id = sp.id
            ), '[]'::json)
        ) ORDER BY sp.sort_order, sp.id
    ), '[]'::json)
    INTO result FROM sticker_packs sp;
    RETURN result;
END $$;

-- Crea (p_id NULL) o actualiza un paquete.
CREATE OR REPLACE FUNCTION public.admin_upsert_sticker_pack(
    p_admin_clerk_id text,
    p_id             bigint,
    p_name           text,
    p_description    text,
    p_is_premium     boolean,
    p_is_active      boolean,
    p_sort_order     integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r  sticker_packs%ROWTYPE;
    nm text := LEFT(TRIM(COALESCE(p_name, '')), 120);
    ds text := NULLIF(TRIM(COALESCE(p_description, '')), '');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF p_id IS NULL THEN
        INSERT INTO sticker_packs (name, description, is_premium, is_active, sort_order)
        VALUES (
            CASE WHEN LENGTH(nm) > 0 THEN nm ELSE 'Nuevo paquete' END,
            ds,
            COALESCE(p_is_premium, false),
            COALESCE(p_is_active, true),
            COALESCE(p_sort_order, 0)
        ) RETURNING * INTO r;
    ELSE
        UPDATE sticker_packs SET
            name        = CASE WHEN LENGTH(nm) > 0 THEN nm ELSE name END,
            description = ds,
            is_premium  = COALESCE(p_is_premium, is_premium),
            is_active   = COALESCE(p_is_active, is_active),
            sort_order  = COALESCE(p_sort_order, sort_order)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    END IF;
    RETURN json_build_object(
        'id', r.id, 'name', r.name, 'description', r.description,
        'is_premium', r.is_premium, 'is_active', r.is_active,
        'sort_order', r.sort_order, 'cover_url', r.cover_url, 'stickers', '[]'::json
    );
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_sticker_pack(p_admin_clerk_id text, p_id bigint)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM sticker_packs WHERE id = p_id;  -- ON DELETE CASCADE borra sus stickers
    RETURN json_build_object('ok', true);
END $$;

-- Agrega un sticker a un paquete (la URL la sube el edge upload-sticker).
CREATE OR REPLACE FUNCTION public.admin_add_sticker(
    p_admin_clerk_id text,
    p_pack_id        bigint,
    p_image_url      text,
    p_is_animated    boolean,
    p_sort_order     integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r stickers%ROWTYPE; u text := NULLIF(TRIM(COALESCE(p_image_url, '')), '');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF u IS NULL THEN RETURN json_build_object('error', 'no_url'); END IF;
    IF NOT EXISTS (SELECT 1 FROM sticker_packs WHERE id = p_pack_id) THEN
        RETURN json_build_object('error', 'no_pack');
    END IF;
    INSERT INTO stickers (pack_id, image_url, is_animated, sort_order)
    VALUES (p_pack_id, u, COALESCE(p_is_animated, false), COALESCE(p_sort_order, 0))
    RETURNING * INTO r;
    RETURN json_build_object(
        'id', r.id, 'url', r.image_url, 'animated', r.is_animated,
        'is_active', r.is_active, 'sort_order', r.sort_order, 'pack_id', r.pack_id
    );
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_sticker(
    p_admin_clerk_id text,
    p_id             bigint,
    p_is_active      boolean,
    p_sort_order     integer
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r stickers%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    UPDATE stickers SET
        is_active  = COALESCE(p_is_active, is_active),
        sort_order = COALESCE(p_sort_order, sort_order)
    WHERE id = p_id RETURNING * INTO r;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    RETURN json_build_object(
        'id', r.id, 'url', r.image_url, 'animated', r.is_animated,
        'is_active', r.is_active, 'sort_order', r.sort_order, 'pack_id', r.pack_id
    );
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_sticker(p_admin_clerk_id text, p_id bigint)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM stickers WHERE id = p_id;
    RETURN json_build_object('ok', true);
END $$;

-- ════════════════════════════════════════════════════════════════════
-- dm_send_message — suma kind='sticker'. CREATE OR REPLACE (la firma NO
-- cambia respecto a 20260625d) → solo actualiza el cuerpo. PRESERVA el
-- cerrojo de moderación (_community_blocked) + el cifrado en reposo.
-- Para sticker: el cliente manda media_meta.sticker_id; el server RESUELVE
-- la URL del catálogo (ignora la del cliente) y aplica el muro premium.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.dm_send_message(
    p_clerk_user_id text,
    p_conversation_id bigint,
    p_body text,
    p_kind text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_media_meta jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv      dm_conversations%ROWTYPE;
    other     text;
    v_kind    text := LOWER(COALESCE(NULLIF(TRIM(p_kind), ''), 'text'));
    v_body    text := LEFT(TRIM(COALESCE(p_body, '')), 2000);
    v_media   text := NULLIF(TRIM(COALESCE(p_media_url, '')), '');
    v_meta    jsonb := p_media_meta;
    v_prev0   text;        -- preview en claro
    v_key     text;
    v_stored  text;        -- body cifrado
    v_mstored text;        -- media_url cifrado
    v_prev    text;        -- preview cifrado
    v_enc     boolean := false;
    v_sid     bigint;      -- sticker resuelto
    v_surl    text;
    v_premium boolean;
    v_pack    bigint;
    mid       bigint;
    ts        timestamptz;
BEGIN
    -- Tipos conocidos: text / image / voice / sticker; cualquier otro → text.
    IF v_kind NOT IN ('text', 'image', 'voice', 'sticker') THEN v_kind := 'text'; END IF;

    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;

    -- Moderación (preservado): no enviar si hay bloqueo en cualquier dirección.
    other := CASE WHEN conv.user_a = p_clerk_user_id THEN conv.user_b ELSE conv.user_a END;
    IF public._community_blocked(p_clerk_user_id, other) THEN
        RETURN json_build_object('error', 'blocked');
    END IF;

    IF v_kind = 'sticker' THEN
        -- Resuelve el sticker del catálogo: la URL y el flag premium salen del
        -- server, no del cliente (no se puede forjar un sticker premium).
        v_sid := NULLIF(TRIM(COALESCE(p_media_meta->>'sticker_id', '')), '')::bigint;
        IF v_sid IS NULL THEN RETURN json_build_object('error', 'no_sticker'); END IF;
        SELECT s.image_url, sp.is_premium, s.pack_id
          INTO v_surl, v_premium, v_pack
          FROM stickers s JOIN sticker_packs sp ON sp.id = s.pack_id
          WHERE s.id = v_sid AND s.is_active AND sp.is_active;
        IF v_surl IS NULL THEN RETURN json_build_object('error', 'no_sticker'); END IF;
        IF v_premium AND NOT public._is_active_member(p_clerk_user_id) THEN
            RETURN json_build_object('error', 'locked');
        END IF;
        v_media := v_surl;
        v_meta  := jsonb_build_object('pack_id', v_pack, 'sticker_id', v_sid);
        v_prev0 := '✨ Sticker';
    ELSIF v_kind IN ('image', 'voice') THEN
        IF v_media IS NULL THEN RETURN json_build_object('error', 'no_media'); END IF;
        v_prev0 := CASE WHEN v_kind = 'voice' THEN '🎤 Nota de voz' ELSE '📷 Foto' END;
    ELSE
        IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;
        v_prev0 := LEFT(v_body, 120);
    END IF;

    -- Cifrado en reposo (best-effort: si no hay llave, guarda en claro).
    v_key := public._dm_key();
    IF v_key IS NOT NULL THEN
        BEGIN
            v_stored  := armor(pgp_sym_encrypt(v_body, v_key));
            v_mstored := CASE WHEN v_media IS NULL THEN NULL
                              ELSE armor(pgp_sym_encrypt(v_media, v_key)) END;
            v_prev    := armor(pgp_sym_encrypt(v_prev0, v_key));
            v_enc     := true;
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_body; v_mstored := v_media; v_prev := v_prev0; v_enc := false;
        END;
    ELSE
        v_stored := v_body; v_mstored := v_media; v_prev := v_prev0;
    END IF;

    INSERT INTO dm_messages (conversation_id, sender_clerk_id, body, kind, media_url, media_meta, enc)
    VALUES (p_conversation_id, p_clerk_user_id, v_stored, v_kind, v_mstored, v_meta, v_enc)
    RETURNING id, created_at INTO mid, ts;

    UPDATE dm_conversations
    SET last_message_at = ts,
        last_message_preview = v_prev,
        preview_enc = v_enc,
        a_last_read_at = CASE WHEN p_clerk_user_id = user_a THEN ts ELSE a_last_read_at END,
        b_last_read_at = CASE WHEN p_clerk_user_id = user_b THEN ts ELSE b_last_read_at END
    WHERE id = p_conversation_id;

    RETURN json_build_object('ok', true, 'message_id', mid, 'created_at', ts);
END;
$$;

-- ── REVOKE anon + GRANT service_role (solo los gateways las llaman) ──
REVOKE ALL ON FUNCTION public._is_active_member(text)               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_sticker_catalog(text)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_sticker_packs(text)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_upsert_sticker_pack(text, bigint, text, text, boolean, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_sticker_pack(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_add_sticker(text, bigint, text, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_update_sticker(text, bigint, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_sticker(text, bigint)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._is_active_member(text)               TO service_role;
GRANT EXECUTE ON FUNCTION public.get_sticker_catalog(text)            TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_sticker_packs(text)        TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_sticker_pack(text, bigint, text, text, boolean, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_sticker_pack(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_sticker(text, bigint, text, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_sticker(text, bigint, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_sticker(text, bigint)   TO service_role;
GRANT EXECUTE ON FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb) TO service_role;

NOTIFY pgrst, 'reload schema';
