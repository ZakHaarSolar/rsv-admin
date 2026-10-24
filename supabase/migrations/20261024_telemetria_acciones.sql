-- 20261024_telemetria_acciones.sql — 🜂 LA MEDICIÓN TAMBIÉN CUENTA ACCIONES (Zak 2026-10-24)
-- La app manda en cada día un campo `a` con acciones «capa:accion» (lib/telemetria v1.3: qué voz
-- lee el Espejo, la Presencia, la imagen, los interruptores, la paleta de comandos, ¿Lo contesté?).
-- Esta versión de record_telemetria es la de producción (copiada con pg_get_functiondef el
-- 2026-10-24, idéntica a 20261018d) más UN bloque: suma esas acciones en tele_uso. Lo demás no cambia.
-- Se puede correr más de una vez.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.record_telemetria(p_clerk_user_id text, p_aparato uuid, p_lote jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_cuenta    text := NULLIF(left(btrim(coalesce(p_clerk_user_id, '')), 64), '');
    v_lote_id   uuid;
    v_plat      text;
    v_version   text;
    v_idioma    text;
    v_desde     timestamptz;
    v_antiguo   boolean;
    v_antes     text;
    v_existia   boolean;
    v_persona   text;
    v_es_cuenta boolean;
    v_miembro   boolean := false;
    v_alta      timestamptz;
    v_hoy       date := public._tele_dia(now());
    v_dia       date;
    v_primer    date;
    v_k         text;
    v_c         jsonb;
    v_rec       boolean;
    v_vueltas   int := 0;
    v_contados  int := 0;
    re_f constant text := '^[a-z0-9_]{1,32}(\.[a-z0-9_]{1,32})?(:[a-z0-9_]{1,32})?$';
    re_c constant text := '^[a-z0-9_]{1,32}(\.[a-z0-9_]{1,32})?$';
    re_p constant text := '^[a-z0-9_]{1,32}(\.[a-z0-9_]{1,32})?>[a-z0-9_]{1,32}(\.[a-z0-9_]{1,32})?$';
    re_e constant text := '^[a-z]{2,10}(:[a-z0-9_.]{1,48}){1,3}$';
    re_t constant text := '^[a-z]{2,16}:[a-z0-9_.]{1,64}$';
BEGIN
    IF p_aparato IS NULL OR p_lote IS NULL OR jsonb_typeof(p_lote) <> 'object'
       OR length(p_lote::text) > 65536 THEN
        RETURN jsonb_build_object('ok', false, 'motivo', 'lote');
    END IF;
    IF coalesce(p_lote->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_lote_id := (p_lote->>'id')::uuid;
    END IF;
    v_plat := CASE WHEN coalesce(p_lote->>'plataforma', '') ~ '^[a-z-]{2,16}$'
                   THEN p_lote->>'plataforma' END;
    v_version := NULLIF(left(regexp_replace(coalesce(p_lote->>'version', ''),
                                            '[^0-9A-Za-z.+-]', '', 'g'), 24), '');
    v_idioma := CASE WHEN coalesce(p_lote->>'idioma', '') ~ '^[a-z]{2}$'
                     THEN p_lote->>'idioma' END;
    IF coalesce(p_lote->>'desde', '') ~ '^[0-9]{10,13}$' THEN
        v_desde := to_timestamp((p_lote->>'desde')::bigint / 1000.0);
        IF v_desde < timestamptz '2026-01-01' OR v_desde > now() + interval '1 day' THEN
            v_desde := NULL;
        END IF;
    END IF;
    v_antiguo := coalesce((p_lote->'antiguo') = 'true'::jsonb, false);

    -- El aparato (con candado: dos lotes del mismo aparato no se cruzan).
    SELECT clerk_user_id INTO v_antes FROM public.tele_aparatos
    WHERE aparato = p_aparato FOR UPDATE;
    v_existia := FOUND;

    /* Freno de inundación: aparatos nuevos sin cuenta, como mucho 3,000 por
       hora en total (a 10,000 tripulantes eso ya es una avalancha). */
    IF NOT v_existia AND v_cuenta IS NULL AND (
        SELECT count(*) FROM public.tele_aparatos WHERE creado > now() - interval '1 hour'
    ) >= 3000 THEN
        RETURN jsonb_build_object('ok', false, 'motivo', 'freno');
    END IF;

    -- Un lote que ya se contó no se vuelve a contar (un reintento tras una
    -- respuesta perdida).
    IF v_lote_id IS NOT NULL THEN
        INSERT INTO public.tele_lotes (id) VALUES (v_lote_id) ON CONFLICT (id) DO NOTHING;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('ok', true, 'duplicado', true);
        END IF;
    END IF;

    INSERT INTO public.tele_aparatos AS a (aparato, clerk_user_id, plataforma, version,
                                           idioma, primera_vez, antiguo)
    VALUES (p_aparato, v_cuenta, v_plat, v_version, v_idioma,
            LEAST(now(), coalesce(v_desde, now())), v_antiguo)
    ON CONFLICT (aparato) DO UPDATE SET
        clerk_user_id = coalesce(EXCLUDED.clerk_user_id, a.clerk_user_id),
        plataforma    = coalesce(EXCLUDED.plataforma, a.plataforma),
        version       = coalesce(EXCLUDED.version, a.version),
        idioma        = coalesce(EXCLUDED.idioma, a.idioma),
        primera_vez   = LEAST(a.primera_vez, EXCLUDED.primera_vez),
        antiguo       = a.antiguo OR EXCLUDED.antiguo,
        ultima_vez    = now();

    -- Quién es: la cuenta verificada; sin sesión, la cuenta a la que ya está
    -- ligado este aparato; si nunca tuvo cuenta, el aparato mismo.
    v_persona := coalesce(v_cuenta, v_antes, 'a:' || p_aparato::text);
    v_es_cuenta := v_persona NOT LIKE 'a:%';
    IF v_cuenta IS NOT NULL AND v_antes IS DISTINCT FROM v_cuenta THEN
        PERFORM public._tele_unir('a:' || p_aparato::text, v_cuenta);
    END IF;
    IF v_es_cuenta THEN
        v_miembro := coalesce(public._is_active_member(v_persona), false);
        SELECT min(created_at) INTO v_alta FROM public.profiles WHERE clerk_user_id = v_persona;
    END IF;

    SELECT min(public._tele_fecha(k)) INTO v_primer
    FROM jsonb_object_keys(public._tele_obj(p_lote->'dias')) k;
    IF v_primer IS NOT NULL AND (v_primer < v_hoy - 45 OR v_primer > v_hoy + 1) THEN
        v_primer := NULL;
    END IF;

    INSERT INTO public.tele_personas AS t (persona, cuenta, primer_dia, primera_vez,
                                           ultima_vez, plataforma)
    VALUES (
        v_persona, v_es_cuenta,
        LEAST(v_hoy, coalesce(v_primer, v_hoy),
              coalesce(public._tele_dia(v_alta), v_hoy),
              coalesce(public._tele_dia(v_desde), v_hoy)),
        LEAST(now(), coalesce(v_alta, now()), coalesce(v_desde, now())),
        now(), v_plat)
    ON CONFLICT (persona) DO UPDATE SET
        cuenta      = t.cuenta OR EXCLUDED.cuenta,
        primer_dia  = LEAST(t.primer_dia, EXCLUDED.primer_dia),
        primera_vez = LEAST(t.primera_vez, EXCLUDED.primera_vez),
        ultima_vez  = GREATEST(t.ultima_vez, EXCLUDED.ultima_vez),
        plataforma  = coalesce(t.plataforma, EXCLUDED.plataforma);

    FOR v_k, v_c IN
        SELECT key, value FROM jsonb_each(public._tele_obj(p_lote->'dias'))
    LOOP
        v_vueltas := v_vueltas + 1;
        EXIT WHEN v_vueltas > 45;
        v_dia := public._tele_fecha(v_k);
        CONTINUE WHEN v_dia IS NULL OR v_dia < v_hoy - 45 OR v_dia > v_hoy + 1
                      OR jsonb_typeof(v_c) <> 'object';
        v_contados := v_contados + 1;

        -- Si ese día solo tenía lo reconstruido del servidor, lo vivo manda:
        -- se quitan las aperturas reconstruidas para no contar dos veces.
        SELECT reconstruido INTO v_rec FROM public.tele_dias
        WHERE dia = v_dia AND persona = v_persona;
        IF coalesce(v_rec, false) THEN
            DELETE FROM public.tele_uso
            WHERE dia = v_dia AND persona = v_persona AND reconstruido
              AND position(':' in funcion) = 0;
        END IF;

        INSERT INTO public.tele_dias AS d (dia, persona, plataforma, version, miembro,
                                           sesiones, segundos)
        VALUES (v_dia, v_persona, v_plat, v_version, v_miembro,
                public._tele_n(v_c->'s', 200), public._tele_n(v_c->'seg', 86400))
        ON CONFLICT (dia, persona) DO UPDATE SET
            plataforma   = coalesce(EXCLUDED.plataforma, d.plataforma),
            version      = coalesce(EXCLUDED.version, d.version),
            miembro      = d.miembro OR EXCLUDED.miembro,
            sesiones     = LEAST(d.sesiones + EXCLUDED.sesiones, 1000),
            segundos     = LEAST(d.segundos + EXCLUDED.segundos, 86400),
            reconstruido = false;

        -- Capas: [aperturas, segundos]. Las acciones («capa:accion») las
        -- cuenta el servidor, no el aparato.
        INSERT INTO public.tele_uso AS u (dia, funcion, persona, aperturas, segundos)
        SELECT v_dia, f.key, v_persona,
               public._tele_n(f.value->0, 5000), public._tele_n(f.value->1, 86400)
        FROM (
            SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'f')) LIMIT 150
        ) f
        WHERE f.key ~ re_c AND jsonb_typeof(f.value) = 'array'
        ON CONFLICT (dia, funcion, persona) DO UPDATE SET
            aperturas    = CASE WHEN u.reconstruido THEN EXCLUDED.aperturas
                                ELSE LEAST(u.aperturas + EXCLUDED.aperturas, 5000) END,
            segundos     = LEAST(u.segundos + EXCLUDED.segundos, 86400),
            reconstruido = false;

        -- 🜂 2026-10-24 · Acciones que cuenta el APARATO («capa:accion»: qué voz lee, la Presencia,
        -- los interruptores, la paleta de comandos, ¿Lo contesté?…). Se suman como acciones de
        -- esa capa por persona. No chocan con las que reconstruye el servidor (otras claves).
        INSERT INTO public.tele_uso AS u (dia, funcion, persona, acciones)
        SELECT v_dia, a.key, v_persona, public._tele_n(a.value, 1000)
        FROM (
            SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'a')) LIMIT 80
        ) a
        WHERE a.key ~ '^[a-z0-9_]{1,32}(\.[a-z0-9_]{1,32})?:[a-z0-9_.]{1,48}$'
          AND public._tele_n(a.value, 1000) > 0
        ON CONFLICT (dia, funcion, persona) DO UPDATE SET
            acciones = LEAST(u.acciones + EXCLUDED.acciones, 5000);

        -- Lo que se abre por primera vez entra solo al catálogo.
        INSERT INTO public.tele_catalogo AS c (funcion, tipo, visto_primero)
        SELECT f.key, 'capa', now()
        FROM (
            SELECT key FROM jsonb_each(public._tele_obj(v_c->'f')) LIMIT 150
        ) f
        WHERE f.key ~ re_c
        ON CONFLICT (funcion) DO UPDATE SET visto_primero = now()
        WHERE c.visto_primero IS NULL;

        -- Pasos, entradas, salidas y errores (por día y plataforma, sin persona).
        INSERT INTO public.tele_global AS g (dia, tipo, clave, plataforma, n)
        SELECT v_dia, x.tipo, x.k, coalesce(v_plat, '?'), sum(x.n)
        FROM (
            SELECT 'paso' AS tipo, key AS k, public._tele_n(value, 1000) AS n
            FROM (SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'p')) LIMIT 200) q
            WHERE key ~ re_p
            UNION ALL
            SELECT 'entrada', key, public._tele_n(value, 1000)
            FROM (SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'e')) LIMIT 60) q
            WHERE key ~ re_c
            UNION ALL
            SELECT 'salida', key, public._tele_n(value, 1000)
            FROM (SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'x')) LIMIT 60) q
            WHERE key ~ re_c
            UNION ALL
            SELECT 'salida_sv', key, public._tele_n(value, 1000)
            FROM (SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'xs')) LIMIT 60) q
            WHERE key ~ re_c
            UNION ALL
            SELECT 'error', key, public._tele_n(value, 1000)
            FROM (SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'err')) LIMIT 60) q
            WHERE key ~ re_e
        ) x
        WHERE x.n > 0
        GROUP BY x.tipo, x.k
        ON CONFLICT (dia, tipo, clave, plataforma) DO UPDATE SET
            n = LEAST(g.n + EXCLUDED.n, 2000000000);

        -- Tiempos: [n, suma_ms, c0..c6] (cubetas de 0.5, 1, 2, 4, 8, 16 s y más).
        INSERT INTO public.tele_global AS g (dia, tipo, clave, plataforma, n, suma_ms, cubetas)
        SELECT v_dia, 'tiempo', t.key, coalesce(v_plat, '?'),
               public._tele_n(t.value->0, 1000),
               public._tele_n(t.value->1, 600000000),
               ARRAY[public._tele_n(t.value->2, 1000)::int, public._tele_n(t.value->3, 1000)::int,
                     public._tele_n(t.value->4, 1000)::int, public._tele_n(t.value->5, 1000)::int,
                     public._tele_n(t.value->6, 1000)::int, public._tele_n(t.value->7, 1000)::int,
                     public._tele_n(t.value->8, 1000)::int]
        FROM (
            SELECT key, value FROM jsonb_each(public._tele_obj(v_c->'t')) LIMIT 60
        ) t
        WHERE t.key ~ re_t AND jsonb_typeof(t.value) = 'array'
          AND public._tele_n(t.value->0, 1000) > 0
        ON CONFLICT (dia, tipo, clave, plataforma) DO UPDATE SET
            n       = LEAST(g.n + EXCLUDED.n, 2000000000),
            suma_ms = LEAST(g.suma_ms + EXCLUDED.suma_ms, 9000000000000000),
            cubetas = ARRAY(
                SELECT coalesce(g.cubetas[i], 0) + coalesce(EXCLUDED.cubetas[i], 0)
                FROM generate_series(1, 7) AS i ORDER BY i);

        -- Respuestas de un toque (como mucho 20 por persona al día).
        INSERT INTO public.tele_respuestas (dia, persona, aparato, donde, respuesta,
                                            miembro, plataforma, version, idioma)
        SELECT v_dia, v_persona, p_aparato, r->>0, r->>1, v_miembro, v_plat, v_version, v_idioma
        FROM (
            SELECT value AS r
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_c->'r') = 'array'
                                           THEN v_c->'r' ELSE '[]'::jsonb END)
            LIMIT 10
        ) q
        WHERE jsonb_typeof(r) = 'array'
          AND coalesce(r->>0, '') ~ '^[a-z_]{2,24}$'
          AND coalesce(r->>1, '') ~ '^[a-z_]{2,24}$'
          AND (SELECT count(*) FROM public.tele_respuestas
               WHERE persona = v_persona AND dia = v_dia) < 20;
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'dias', v_contados);
END $function$;
