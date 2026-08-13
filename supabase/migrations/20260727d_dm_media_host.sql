-- Red Solar Viva · AUDITORÍA · PARTE 3 — la media de los mensajes solo puede
-- apuntar a nuestro propio almacenamiento
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- ── EL HUECO ────────────────────────────────────────────────────────────────
-- `dm_send_message` acepta cualquier texto como dirección de una foto o una
-- nota de voz. Lo único que le hace es quitarle los espacios. No exige ni
-- siquiera que empiece con https.
--
-- Y el teléfono de quien recibe la abre SOLA: la app la mete directo en la
-- etiqueta de imagen o de audio (Mensajes.tsx). O sea que basta con mandarle un
-- mensaje a alguien apuntando a un servidor propio para:
--   · saber su dirección IP y el instante exacto en que abrió el chat, sin que
--     esa persona toque nada ni se entere (una baliza de lectura);
--   · sondear su red interna con direcciones locales, deduciendo por el tiempo
--     de respuesta qué hay del otro lado.
--
-- ── EL CIERRE, SIN TOCAR dm_send_message ────────────────────────────────────
-- La dirección se guarda CIFRADA, así que un trigger la descifra, la mira y la
-- anula si no apunta a nuestro almacenamiento. Así no hay que reescribir la
-- función (cuyo cuerpo vivo no tengo) y queda cubierta cualquier vía futura que
-- escriba en la tabla, no solo esa RPC.
--
-- Se exige: https, un host de Cloudflare R2, y que la ruta empiece por DM/.
-- Es decir, exactamente lo que produce `upload-dm-media` y nada más.
--
-- Los STICKERS quedan exentos a propósito: su dirección no la manda el cliente,
-- la resuelve el servidor a partir de un id (y los del paquete de la casa son
-- imágenes incrustadas, no direcciones). Validarlos rompería el catálogo.
--
-- Efecto sobre lo que ya existe: nada se borra. Este trigger solo actúa sobre
-- mensajes NUEVOS. Los viejos con dirección ajena, si los hubiera, se listan
-- con la consulta del final.

CREATE OR REPLACE FUNCTION public._dm_media_host_ok(p_url text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_url IS NOT NULL
       AND (
            p_url ~ '^https://[A-Za-z0-9._-]+\.r2\.dev/DM/'
         OR p_url ~ '^https://[A-Za-z0-9._-]+\.r2\.cloudflarestorage\.com/[A-Za-z0-9._-]+/DM/'
       );
$$;
REVOKE ALL ON FUNCTION public._dm_media_host_ok(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._dm_media_host_ok(text) TO service_role;

CREATE OR REPLACE FUNCTION public._dm_media_guard_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_plain text;
BEGIN
    -- Solo foto y nota de voz: el sticker lo resuelve el servidor.
    IF NEW.kind IS NULL OR NEW.kind NOT IN ('image', 'voice') THEN
        RETURN NEW;
    END IF;
    IF NEW.media_url IS NULL THEN
        RETURN NEW;
    END IF;

    v_plain := public._dm_decrypt(NEW.media_url, NEW.enc);

    IF NOT public._dm_media_host_ok(v_plain) THEN
        RAISE WARNING '[dm_media_guard] direccion ajena descartada en conversacion %', NEW.conversation_id;
        NEW.media_url := NULL;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Si el descifrado falla por lo que sea, se descarta la media en vez de
    -- dejarla pasar: aquí lo seguro es el "no". El mensaje se entrega igual.
    NEW.media_url := NULL;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS dm_messages_media_guard ON public.dm_messages;
CREATE TRIGGER dm_messages_media_guard
    BEFORE INSERT OR UPDATE OF media_url ON public.dm_messages
    FOR EACH ROW EXECUTE FUNCTION public._dm_media_guard_tg();

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICAR (opcional)
-- =============================================================================
--   SELECT public._dm_media_host_ok('https://pub-abc.r2.dev/DM/user_1/x.jpg');  -- true
--   SELECT public._dm_media_host_ok('https://malo.example.com/pixel.gif');      -- false
--   SELECT public._dm_media_host_ok('http://192.168.0.5/a.png');                -- false
--
--   -- ¿Hay mensajes VIEJOS apuntando fuera? (solo listar, no borra nada)
--   SELECT id, conversation_id, kind, created_at
--   FROM dm_messages
--   WHERE kind IN ('image','voice') AND media_url IS NOT NULL
--     AND NOT public._dm_media_host_ok(public._dm_decrypt(media_url, enc));
