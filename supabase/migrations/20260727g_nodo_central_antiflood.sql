-- Red Solar Viva · AUDITORÍA · PARTE 4 (cierre) — el padrón de correos
-- =====================================================================
-- Cierra el último residual de la Parte 4: el alta al Nodo Central.
--
-- 🜂 POR QUÉ NO SE FIRMA EL WORKFLOW DE PIPEDREAM (y sí se blinda acá):
--    El plan era ponerle firma HMAC a `GuardarMensajes.js`, como a los otros
--    tres workflows. Al verificar antes de escribir, aparece que sería TEATRO:
--
--      · `record_nodo_subscription` está GRANTed a anon desde 20260427 y nunca
--        se revocó.
--      · El propio frontend la llama DIRECTO con la llave pública, en dos
--        lugares de `Code/Auth2Modal.tsx` (líneas ~1075 y ~1229), dentro del
--        flujo de consentimiento del alta.
--
--    O sea: la misma capacidad (meter un correo en el padrón) ya está a un
--    POST de distancia sin pasar por Pipedream. Firmar esa puerta dejaría la
--    ventana de al lado abierta de par en par.
--
--    Y la RPC no se puede revocar: el modal de acceso la necesita y es
--    PRE-LOGIN por diseño (nadie tiene sesión todavía cuando se suscribe).
--
--    Entonces el blindaje va DENTRO de la RPC, que es el punto por donde
--    pasan las dos entradas. Un solo cambio cubre ambas.
--
-- QUÉ SE CIERRA (el riesgo real de un alta abierta y sin cota):
--   1. INUNDACIÓN: alguien mete miles de correos y (a) ensucia el padrón,
--      (b) nos convierte en vía de spam, suscribiendo a víctimas que nunca
--      pidieron nada, (c) nos manda a listas negras y mata la entrega de
--      TODOS nuestros correos, incluidos los transaccionales.
--   2. DEPÓSITO DE TEXTO: `metadata` aceptaba cualquier tamaño.
--   3. BASURA: el chequeo de correo era "contiene una arroba".
--
-- Lo que NO cambia: un alta legítima, un re-alta de alguien que ya estaba, y
-- el respeto al opt-out siguen exactamente igual.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.record_nodo_subscription(
    p_email     TEXT,
    p_source    TEXT DEFAULT 'origen_landing',
    p_metadata  JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email  TEXT  := LOWER(TRIM(p_email));
    v_source TEXT  := COALESCE(NULLIF(TRIM(p_source), ''), 'origen_landing');
    v_meta   JSONB := p_metadata;
    v_nuevas INT;
    v_existe BOOLEAN;
BEGIN
    -- ── 1. Correo de verdad ──────────────────────────────────────────
    -- Antes bastaba con que tuviera una arroba: "@", "a@b", "  @  " pasaban.
    IF v_email IS NULL
       OR length(v_email) < 6
       OR length(v_email) > 254
       OR v_email !~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'
    THEN
        RETURN false;
    END IF;

    -- ── 2. Cotas de tamaño ───────────────────────────────────────────
    v_source := left(v_source, 64);
    IF v_meta IS NOT NULL AND length(v_meta::text) > 4000 THEN
        -- No se descarta el alta por metadata gorda: se descarta la metadata.
        v_meta := jsonb_build_object('truncated', true);
    END IF;

    -- ── 3. ¿Ya estaba? ───────────────────────────────────────────────
    -- Un re-alta solo refresca y NO cuenta contra el freno: quien ya está en
    -- el padrón no puede usarse para agotar la cota de los demás.
    SELECT EXISTS (SELECT 1 FROM public.nodo_central WHERE email = v_email)
      INTO v_existe;

    IF v_existe THEN
        UPDATE public.nodo_central
           SET last_event_at = NOW(),
               source        = COALESCE(v_source, source),
               metadata      = COALESCE(v_meta, metadata)
         WHERE email = v_email;
        RETURN true;
    END IF;

    -- ── 4. FRENO GLOBAL de altas nuevas ──────────────────────────────
    -- 🜂 Mismo patrón que el techo de gasto de la Parte 4: la cota por hora
    -- no sirve (deja pasar 24 veces esa cifra al día y N actores suman sin
    -- freno). Esta es DIARIA y GLOBAL.
    --
    -- PERILLA: 300 altas nuevas en 24 h. El alta real del Portal son unas
    -- pocas por día, así que es invisible para el uso legítimo y corta una
    -- inundación en seco. Si algún día una campaña la roza, se ve en los
    -- logs (`freno global del padrón`) y se sube este número.
    SELECT count(*) INTO v_nuevas
      FROM public.nodo_central
     WHERE subscribed_at >= NOW() - INTERVAL '1 day';

    IF v_nuevas >= 300 THEN
        RAISE WARNING '[nodo_central] freno global del padrón: % altas nuevas en 24h, se rechaza %',
            v_nuevas, left(v_email, 3) || '***';
        RETURN false;
    END IF;

    -- ── 5. Alta ──────────────────────────────────────────────────────
    INSERT INTO public.nodo_central (email, source, metadata, last_event_at)
    VALUES (v_email, v_source, v_meta, NOW())
    ON CONFLICT (email) DO UPDATE
        SET last_event_at = NOW(),
            source   = COALESCE(EXCLUDED.source, public.nodo_central.source),
            metadata = COALESCE(EXCLUDED.metadata, public.nodo_central.metadata);

    RETURN true;
END;
$$;

-- 🜂 Re-afirmar el GRANT: la RPC DEBE seguir siendo anon-ejecutable (el alta
-- es pre-login por diseño). Lo que cambia es lo que hace por dentro, no quién
-- la puede llamar. Un CREATE OR REPLACE no altera permisos, pero se declara
-- explícito para que nadie lea este archivo y crea que se cerró.
GRANT EXECUTE ON FUNCTION public.record_nodo_subscription(TEXT, TEXT, JSONB)
    TO anon, authenticated;

COMMENT ON FUNCTION public.record_nodo_subscription(TEXT, TEXT, JSONB) IS
'Alta al Nodo Central. Anon a propósito (el alta es pre-login: la llaman el '
'form del Portal vía Pipedream y Auth2Modal directo). Blindada en 20260727g: '
'correo validado de verdad, metadata acotada y FRENO GLOBAL de 300 altas '
'nuevas por día (los re-altas no cuentan). El opt-out se sigue respetando '
'aguas arriba, en is_email_opted_out.';

COMMIT;
