-- Red Solar Viva · LA APP SE MIDE MES CON MES (telemetría del Escáner, 2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Idempotente: se puede correr dos veces sin daño.
--
-- Zak: «que leyendo esa información cada mes, y haciendo cambios según lo que
-- diga, la app llegue a las 10,000 suscripciones». Hasta hoy la navegación
-- vivía 7 días (nav_events) y no había forma de saber quién vuelve, qué se
-- usa, qué está muerto ni dónde se va la gente.
--
-- (1) Tablas (RLS sin políticas: nadie las lee ni escribe directo):
--     tele_aparatos     un renglón por instalación (id que inventa el aparato)
--     tele_personas     un renglón por persona (cuenta, o «a:<aparato>» sin
--                       cuenta): su primer día, su primera vez y sus HITOS
--                       (la primera vez de cada acción de valor)
--     tele_dias         persona × día: sesiones y segundos en primer plano
--     tele_uso          persona × día × función: aperturas, acciones, segundos
--     tele_uso_mes      lo mismo por mes y sin persona (la historia larga)
--     tele_global       día × tipo × clave × plataforma: pasos de una capa a
--                       otra, entradas, salidas, errores y tiempos (cubetas)
--     tele_respuestas   la pregunta de un toque «¿Qué te faltó?»
--     tele_lotes        ids de lote ya contados (un reintento no duplica)
--     tele_catalogo     todas las funciones que existen (para las muertas)
--     tele_costos_ia    cuánto cuesta cada unidad del registro de gasto
--     tele_mes          la foto de cada mes (para comparar mes con mes)
--     tele_ajustes      tipo de cambio, meta y el reloj de la reconstrucción
--     suscripcion_eventos  compras, renovaciones y bajas que avisa RevenueCat
-- (2) record_telemetria: el LOTE que manda la app (uno cada pocos minutos o al
--     salir, nunca uno por toque). Con sesión, por el portón user-action (que
--     pone el clerk_user_id VERIFICADO); sin sesión, record_telemetria_anon
--     con el id del aparato. Solo eventos: nunca texto, fotos ni mensajes.
-- (3) _tele_reconstruir: lo que hacen las versiones de la app que todavía no
--     mandan lotes (y las ACCIONES de todas) sale de lo que el servidor ya
--     guarda: el registro de gasto (Espejo, Decodificadores, voz), los
--     escaneos, los rituales, las notas, los mensajes, la navegación de 7
--     días. Corre cada día y al abrir el panel.
-- (4) tele_mantener: retención (uso por persona 120 días, días y globales 400,
--     lotes 7) y la foto de cada mes. pg_cron diario a las 04:25 de Cancún.
-- (5) admin_telemetria_resumen / admin_telemetria_persona: lo que pinta
--     Motor → Telemetría (vía admin-action).
-- (6) Reconstrucción inicial de toda la historia.
--
-- Pensado para 10,000 tripulantes: la app junta en el aparato y manda un
-- lote; aquí cada lote son unas pocas filas con ON CONFLICT (suma), sin un
-- insert por toque. Lo que crece por persona tiene retención.

-- ── (0) Ayudantes ────────────────────────────────────────────────────

-- Un entero de un JSON, acotado a [0, p_max] (lo raro vale 0).
CREATE OR REPLACE FUNCTION public._tele_n(p jsonb, p_max bigint)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN jsonb_typeof(p) = 'number'
            THEN LEAST(GREATEST(floor((p #>> '{}')::numeric), 0), p_max)::bigint
        WHEN jsonb_typeof(p) = 'string' AND (p #>> '{}') ~ '^[0-9]{1,12}$'
            THEN LEAST((p #>> '{}')::bigint, p_max)
        ELSE 0
    END
$$;

-- Una fecha AAAA-MM-DD válida, o NULL (nunca un error).
CREATE OR REPLACE FUNCTION public._tele_fecha(p text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p IS NULL OR p !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
        RETURN NULL;
    END IF;
    RETURN p::date;
EXCEPTION WHEN others THEN
    RETURN NULL;
END $$;

-- Un objeto JSON, o {} si viene otra cosa.
CREATE OR REPLACE FUNCTION public._tele_obj(p jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE WHEN jsonb_typeof(p) = 'object' THEN p ELSE '{}'::jsonb END
$$;

-- La clave de una capa como la anota la app: «capa» o «capa.sub», en
-- minúsculas y con guion bajo (boveda-materia → boveda_materia).
CREATE OR REPLACE FUNCTION public._tele_capa(p_layer text, p_sub text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT NULLIF(
        left(regexp_replace(lower(btrim(coalesce(p_layer, ''))), '[^a-z0-9_]+', '_', 'g'), 32)
        || CASE
               WHEN NULLIF(btrim(coalesce(p_sub, '')), '') IS NULL THEN ''
               ELSE '.' || left(regexp_replace(lower(btrim(p_sub)), '[^a-z0-9_]+', '_', 'g'), 32)
           END,
        '')
$$;

-- El día de Cancún de un momento (el mismo corte que usa toda la casa).
CREATE OR REPLACE FUNCTION public._tele_dia(p timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (p AT TIME ZONE 'America/Cancun')::date
$$;

-- Las cuentas de la casa no cuentan: administradores, las excluidas del
-- ingreso, las de prueba y las cuentas propias (la MISMA lista de Campaña,
-- Navegación y Correos, aquí en un solo lugar).
CREATE OR REPLACE FUNCTION public._tele_casa()
RETURNS TABLE (clerk_user_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.clerk_user_id
    FROM public.profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND (
          COALESCE(p.is_admin, false)
          OR lower(btrim(COALESCE(p.email, ''))) IN (
              SELECT lower(btrim(r.email)) FROM public.revenue_exclusions r
              WHERE r.email IS NOT NULL)
          OR lower(btrim(COALESCE(p.email, ''))) IN (
              'cuerpodeluz555@gmail.com', 'diegosotoborjaalmeida@gmail.com',
              'diegosotoborja@gmail.com', 'andrea.dl13@gmail.com',
              'beachandsunrisecancun@gmail.com', 'veocancun@gmail.com',
              'veotuluzinterna@gmail.com', 'redsolarviva@gmail.com',
              'redsolarviva@pm.me', 'zakhaarsol@pm.me', 'zakhaar@pm.me')
          OR COALESCE(p.email, '') ILIKE '%@example.com'
          OR COALESCE(p.email, '') ILIKE '%clerk_test%'
      )
$$;

-- ¿Tenía membresía esa cuenta ese día? (para la historia reconstruida).
CREATE OR REPLACE FUNCTION public._tele_miembro_en(p_clerk text, p_dia date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        JOIN public.profiles p ON p.id = s.user_id
        WHERE p.clerk_user_id = p_clerk
          AND lower(coalesce(s.group_name, '')) IN ('sintonia', 'inmersion', 'cuasar', 'pulsar')
          AND public._tele_dia(s.created_at) <= p_dia
          AND (s.current_period_end IS NULL
               OR public._tele_dia(s.current_period_end) >= p_dia)
    )
$$;

REVOKE ALL ON FUNCTION public._tele_casa() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tele_miembro_en(text, date) FROM PUBLIC, anon, authenticated;

-- ── (1) Las tablas ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tele_aparatos (
    aparato       uuid PRIMARY KEY,
    clerk_user_id text,
    plataforma    text,
    version       text,
    idioma        text,
    -- La primera vez que la app corrió en este aparato (lo dice el aparato;
    -- nunca después de que el servidor lo vio).
    primera_vez   timestamptz NOT NULL DEFAULT now(),
    ultima_vez    timestamptz NOT NULL DEFAULT now(),
    -- Cuándo lo vio el servidor por primera vez (freno de inundación).
    creado        timestamptz NOT NULL DEFAULT now(),
    -- Ya tenía la app de antes de la medición (no es una instalación nueva).
    antiguo       boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS tele_aparatos_cuenta
    ON public.tele_aparatos (clerk_user_id) WHERE clerk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tele_aparatos_primera ON public.tele_aparatos (primera_vez);
CREATE INDEX IF NOT EXISTS tele_aparatos_creado ON public.tele_aparatos (creado);

CREATE TABLE IF NOT EXISTS public.tele_personas (
    persona         text PRIMARY KEY,
    cuenta          boolean NOT NULL DEFAULT false,
    primer_dia      date NOT NULL,
    primera_vez     timestamptz NOT NULL,
    ultima_vez      timestamptz NOT NULL,
    plataforma      text,
    -- {"espejo:mensaje": "2026-10-18T19:03:11Z", ...}: la primera vez de cada acción.
    hitos           jsonb NOT NULL DEFAULT '{}'::jsonb,
    primer_valor    text,
    primer_valor_at timestamptz
);
CREATE INDEX IF NOT EXISTS tele_personas_primer_dia ON public.tele_personas (primer_dia);

CREATE TABLE IF NOT EXISTS public.tele_dias (
    dia          date NOT NULL,
    persona      text NOT NULL,
    plataforma   text,
    version      text,
    miembro      boolean NOT NULL DEFAULT false,
    sesiones     int NOT NULL DEFAULT 0,
    segundos     int NOT NULL DEFAULT 0,
    -- true = sale de lo que guarda el servidor (versiones que no mandan lotes).
    reconstruido boolean NOT NULL DEFAULT false,
    PRIMARY KEY (dia, persona)
);
CREATE INDEX IF NOT EXISTS tele_dias_persona ON public.tele_dias (persona, dia);

CREATE TABLE IF NOT EXISTS public.tele_uso (
    dia          date NOT NULL,
    funcion      text NOT NULL,
    persona      text NOT NULL,
    aperturas    int NOT NULL DEFAULT 0,
    acciones     int NOT NULL DEFAULT 0,
    segundos     int NOT NULL DEFAULT 0,
    reconstruido boolean NOT NULL DEFAULT false,
    PRIMARY KEY (dia, funcion, persona)
);
CREATE INDEX IF NOT EXISTS tele_uso_persona ON public.tele_uso (persona, dia);

CREATE TABLE IF NOT EXISTS public.tele_uso_mes (
    mes          date NOT NULL,
    funcion      text NOT NULL,
    personas     int NOT NULL DEFAULT 0,
    dias_persona int NOT NULL DEFAULT 0,
    aperturas    bigint NOT NULL DEFAULT 0,
    acciones     bigint NOT NULL DEFAULT 0,
    segundos     bigint NOT NULL DEFAULT 0,
    PRIMARY KEY (mes, funcion)
);

CREATE TABLE IF NOT EXISTS public.tele_global (
    dia        date NOT NULL,
    tipo       text NOT NULL,   -- paso · entrada · salida · salida_sv · error · tiempo
    clave      text NOT NULL,
    plataforma text NOT NULL DEFAULT '?',
    n          bigint NOT NULL DEFAULT 0,
    suma_ms    bigint NOT NULL DEFAULT 0,
    -- Tiempos: menos de 0.5 s · 1 · 2 · 4 · 8 · 16 · 16 o más.
    cubetas    int[] NOT NULL DEFAULT '{0,0,0,0,0,0,0}',
    PRIMARY KEY (dia, tipo, clave, plataforma)
);

CREATE TABLE IF NOT EXISTS public.tele_respuestas (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    dia        date NOT NULL,
    persona    text NOT NULL,
    aparato    uuid,
    donde      text NOT NULL,
    respuesta  text NOT NULL,
    miembro    boolean NOT NULL DEFAULT false,
    plataforma text,
    version    text,
    idioma     text
);
CREATE INDEX IF NOT EXISTS tele_respuestas_dia ON public.tele_respuestas (dia);
CREATE INDEX IF NOT EXISTS tele_respuestas_persona ON public.tele_respuestas (persona, dia);

CREATE TABLE IF NOT EXISTS public.tele_lotes (
    id     uuid PRIMARY KEY,
    creado timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tele_lotes_creado ON public.tele_lotes (creado);

CREATE TABLE IF NOT EXISTS public.tele_catalogo (
    funcion       text PRIMARY KEY,
    nombre        text,
    grupo         text,
    tipo          text NOT NULL DEFAULT 'capa',   -- capa · accion
    orden         int NOT NULL DEFAULT 500,
    valor         boolean NOT NULL DEFAULT false, -- cuenta como «primer valor»
    oculta        boolean NOT NULL DEFAULT false, -- apagada a propósito: no es «muerta»
    nota          text,
    visto_primero timestamptz
);

CREATE TABLE IF NOT EXISTS public.tele_costos_ia (
    edge           text PRIMARY KEY,
    funcion        text NOT NULL,
    nombre         text NOT NULL,
    mxn_por_unidad numeric NOT NULL DEFAULT 0,
    -- true = es una SEGUNDA ventana del mismo cobro (no se suma).
    es_ventana     boolean NOT NULL DEFAULT false,
    nota           text
);

CREATE TABLE IF NOT EXISTS public.tele_mes (
    mes         date PRIMARY KEY,
    datos       jsonb NOT NULL DEFAULT '{}'::jsonb,
    actualizado timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tele_ajustes (
    clave text PRIMARY KEY,
    valor text,
    nota  text
);

CREATE TABLE IF NOT EXISTS public.suscripcion_eventos (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at    timestamptz NOT NULL DEFAULT now(),
    ocurrio       timestamptz,
    fuente        text NOT NULL DEFAULT 'revenuecat',
    evento_id     text,
    tipo          text NOT NULL,
    clerk_user_id text,
    producto      text,
    producto_nuevo text,
    periodo       text,
    tienda        text,
    pais          text,
    moneda        text,
    precio        numeric,
    precio_usd    numeric,
    entorno       text,
    motivo        text
);
CREATE UNIQUE INDEX IF NOT EXISTS suscripcion_eventos_evento
    ON public.suscripcion_eventos (fuente, evento_id) WHERE evento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS suscripcion_eventos_ocurrio
    ON public.suscripcion_eventos (ocurrio DESC);
CREATE INDEX IF NOT EXISTS suscripcion_eventos_cuenta
    ON public.suscripcion_eventos (clerk_user_id, ocurrio DESC) WHERE clerk_user_id IS NOT NULL;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['tele_aparatos', 'tele_personas', 'tele_dias', 'tele_uso',
        'tele_uso_mes', 'tele_global', 'tele_respuestas', 'tele_lotes', 'tele_catalogo',
        'tele_costos_ia', 'tele_mes', 'tele_ajustes', 'suscripcion_eventos'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
    END LOOP;
END $$;

-- ── (1b) Ajustes, costos y catálogo ──────────────────────────────────

INSERT INTO public.tele_ajustes (clave, valor, nota) VALUES
    ('mxn_por_usd', '18.47', 'Tipo de cambio para el costo de IA (auditoría de precios 2026-10-18).'),
    ('meta_suscripciones', '92', 'Etapa 1: unas 92 suscripciones activas cubren los 33,500 al mes (auditoría 2026-10-18).'),
    ('reconstruido_at', NULL, 'Última vez que corrió _tele_reconstruir.')
ON CONFLICT (clave) DO NOTHING;

-- Lo que cuesta cada unidad del registro de gasto (edge_spend_ledger), en
-- pesos. Estimados de la auditoría de precios; el Espejo trae además su costo
-- REAL desde el 2026-10-18 ('oraculo-dinero', millonésimas de dólar).
INSERT INTO public.tele_costos_ia (edge, funcion, nombre, mxn_por_unidad, es_ventana, nota) VALUES
    ('oraculo',                    'espejo',                 'Espejo · mensajes',              0.02,   false, 'DeepSeek V4 Flash; el profundo pesa 8 unidades'),
    ('oraculo-dia',                'espejo',                 'Espejo · ventana del día',       0,      true,  'segunda ventana del mismo mensaje'),
    ('oraculo-vision',             'espejo',                 'Espejo · fotos',                 0.06,   false, 'Gemini mira cada foto'),
    ('oraculo-web',                'espejo',                 'Espejo · búsqueda en internet',  0.30,   false, 'Exa por OpenRouter'),
    ('oraculo-dinero',             'espejo',                 'Espejo · costo real',            0,      true,  'millonésimas de dólar: se lee aparte'),
    ('oraculo-respaldo',           'espejo',                 'Espejo · respaldo',              0.02,   false, 'Claude Haiku 5.5 cuando OpenRouter falla'),
    ('espejo-voz',                 'espejo',                 'Espejo · voz de Bennett',        0.021,  false, 'Soniox; unidades de 100 caracteres'),
    ('espejo-voz-mes',             'espejo',                 'Espejo · voz, ventana del mes',  0,      true,  'segunda ventana del mismo cobro'),
    ('espejo-voz-muestra',         'espejo',                 'Espejo · muestra de voz',        0.02,   false, NULL),
    ('espejo-imagen',              'espejo',                 'Espejo · imágenes',              0.55,   false, 'fal flux-2-pro'),
    ('espejo-imagen-rafaga',       'espejo',                 'Espejo · imágenes rápidas',      0.055,  false, 'fal flux/schnell'),
    ('espejo-memoria',             'espejo',                 'Espejo · memoria',               0.006,  false, 'destilador'),
    ('voz-intent',                 'voz',                    'Comandos por voz',               0.005,  false, NULL),
    ('dictado-fidelidad',          'voz',                    'Dictado',                        0.005,  false, NULL),
    ('decode-matter',              'decodificador.materia',  'Alimentos · dictamen',           0.0205, false, 'Claude Haiku 5.5 con Gemini de respaldo'),
    ('extract-text',               'decodificador.materia',  'Alimentos · lectura de etiqueta', 0.0277, false, 'Cloud Vision (las primeras 1,000 del mes son gratis)'),
    ('upload-matter-photo-vision', 'decodificador.materia',  'Alimentos · foto',               0.0277, false, 'Cloud Vision'),
    ('upload-matter-photo',        'decodificador.materia',  'Alimentos · subida de foto',     0,      false, NULL),
    ('decode-dream',               'decodificador.suenos',   'Sueños · dictamen',              0.0065, false, NULL),
    ('ciclo-sellado',              'radar',                  'Radar · ciclo sellado',          0.01,   false, NULL),
    ('terra_aparato',              'otros',                  'Terra Cristal',                  0,      false, 'no es IA'),
    ('terra_reporte',              'otros',                  'Terra Cristal · reportes',       0,      false, 'no es IA')
ON CONFLICT (edge) DO NOTHING;

-- Todas las funciones que existen en la app (las claves son las que anota la
-- app al abrir cada capa; las que llevan «:» son acciones que cuenta el
-- servidor). Lo que no esté aquí se registra solo la primera vez que alguien
-- lo abre (sin nombre: se le pone después).
INSERT INTO public.tele_catalogo (funcion, nombre, grupo, tipo, orden, valor, oculta, nota) VALUES
    -- Radar
    ('radar',                        'Radar',                         'Radar',          'capa',   10, false, false, NULL),
    ('radar.sonda',                  'Escaneo de un pilar (Sonda)',   'Radar',          'capa',   11, false, false, NULL),
    ('radar.trayectoria',            'Trayectoria',                   'Radar',          'capa',   12, false, false, NULL),
    ('radar.plan_vuelo',             'Plan de Vuelo',                 'Radar',          'capa',   13, false, false, NULL),
    ('radar.bitacora',               'Bitácora',                      'Radar',          'capa',   14, false, false, NULL),
    ('radar.rachas',                 'Rachas',                        'Radar',          'capa',   15, false, false, NULL),
    ('radar.realidad_elegida',       'Realidad Elegida',              'Radar',          'capa',   16, false, false, NULL),
    ('realidad_elegida.contemplacion', 'Contemplación (Realidad Elegida)', 'Radar',     'capa',   17, false, false, NULL),
    ('radar.calibracion',            'Calibraciones',                 'Radar',          'capa',   18, false, true,  'ocultas a propósito desde el 2026-07-11'),
    ('radar:pilar',                  'Pilares escaneados',            'Radar',          'accion', 19, true,  false, NULL),
    ('radar:ciclo',                  'Ciclos completos (6 de 6)',     'Radar',          'accion', 20, false, false, NULL),
    ('radar.plan_vuelo:mision',      'Misiones creadas',              'Radar',          'accion', 21, false, false, NULL),
    ('radar.plan_vuelo:cumplida',    'Misiones cumplidas',            'Radar',          'accion', 22, false, false, NULL),
    ('radar.bitacora:nota',          'Notas nuevas',                  'Radar',          'accion', 23, false, false, NULL),
    ('radar.rachas:crear',           'Rachas creadas',                'Radar',          'accion', 24, false, false, NULL),
    ('radar.realidad_elegida:respuesta', 'Respuestas de la Realidad Elegida', 'Radar',  'accion', 25, false, false, NULL),
    -- Espejo
    ('espejo',                       'Espejo',                        'Espejo',         'capa',   30, false, false, NULL),
    ('espejo:mensaje',               'Mensajes al Espejo',            'Espejo',         'accion', 31, true,  false, NULL),
    ('espejo:foto',                  'Fotos al Espejo',               'Espejo',         'accion', 32, false, false, NULL),
    ('espejo:voz',                   'Voz de Bennett',                'Espejo',         'accion', 33, false, false, NULL),
    ('espejo:imagen',                'Imágenes que crea el Espejo',   'Espejo',         'accion', 34, false, false, NULL),
    -- Decodificadores
    ('decodificador',                'Decodificadores',               'Decodificadores', 'capa',  40, false, false, NULL),
    ('decodificador.materia',        'Decodificador de Alimentos',    'Decodificadores', 'capa',  41, false, false, NULL),
    ('decodificador.boveda_materia', 'Bóveda de Alimentos',           'Decodificadores', 'capa',  42, false, false, NULL),
    ('decodificador.suenos',         'Decodificador de Sueños',       'Decodificadores', 'capa',  43, false, false, NULL),
    ('decodificador.crop',           'Crop Circles',                  'Decodificadores', 'capa',  44, false, false, NULL),
    ('decodificador.vision',         'Visión Decodificada',           'Decodificadores', 'capa',  45, false, false, NULL),
    ('decodificador.materia:lectura', 'Lecturas de alimentos',        'Decodificadores', 'accion', 46, true, false, NULL),
    ('decodificador.suenos:lectura', 'Lecturas de sueños',            'Decodificadores', 'accion', 47, true, false, NULL),
    ('decodificador.crop:decodificacion', 'Crop Circles decodificados', 'Decodificadores', 'accion', 48, false, false, NULL),
    ('decodificador.vision:sesion',  'Sesiones de Visión',            'Decodificadores', 'accion', 49, false, false, NULL),
    -- Sendero de Luz
    ('sendero',                      'Sendero de Luz',                'Sendero',        'capa',   60, false, false, NULL),
    ('sendero.dia',                  'Mi día',                        'Sendero',        'capa',   61, false, false, NULL),
    ('sendero.avatar',               'Avatar',                        'Sendero',        'capa',   62, false, false, NULL),
    ('sendero.medallas',             'Medallas',                      'Sendero',        'capa',   63, false, false, NULL),
    ('sendero:ritual',               'Rituales marcados',             'Sendero',        'accion', 64, false, false, NULL),
    -- Holoteca
    ('holoteca',                     'Holoteca',                      'Holoteca',       'capa',   70, false, false, NULL),
    ('holoteca.codices',             'Códices (tienda)',              'Holoteca',       'capa',   71, false, false, NULL),
    ('holoteca.biblioteca',          'Mi biblioteca',                 'Holoteca',       'capa',   72, false, false, NULL),
    ('holoteca.meditaciones',        'Meditaciones',                  'Holoteca',       'capa',   73, false, false, NULL),
    ('holoteca.wallpapers',          'Wallpapers',                    'Holoteca',       'capa',   74, false, false, NULL),
    ('holoteca.simuladores',         'Simuladores',                   'Holoteca',       'capa',   75, false, false, NULL),
    ('holoteca.biblioteca:lectura',  'Días de lectura de Códices',    'Holoteca',       'accion', 76, false, false, NULL),
    ('holoteca.wallpapers:descarga', 'Wallpapers descargados',        'Holoteca',       'accion', 77, false, false, NULL),
    -- Comunidad
    ('comunidad',                    'Comunidad',                     'Comunidad',      'capa',   80, false, false, NULL),
    ('comunidad.mensajes',           'Mensajes',                      'Comunidad',      'capa',   81, false, false, NULL),
    ('comunidad.explorar',           'Explorar',                      'Comunidad',      'capa',   82, false, false, NULL),
    ('comunidad.mensajes:mensaje',   'Mensajes enviados',             'Comunidad',      'accion', 83, false, false, NULL),
    -- Mi Núcleo
    ('nucleo',                       'Mi Núcleo',                     'Mi Núcleo',      'capa',   90, false, false, NULL),
    ('nucleo.firma',                 'Mi Firma de Luz',               'Mi Núcleo',      'capa',   91, false, false, NULL),
    ('nucleo.ritual',                'Sendero (desde Mi Núcleo)',     'Mi Núcleo',      'capa',   92, false, false, NULL),
    ('nucleo.ajustes',               'Ajustes',                       'Mi Núcleo',      'capa',   93, false, false, NULL),
    -- Voz
    ('voz:comando',                  'Comandos por voz',              'Voz',            'accion', 100, false, false, NULL)
ON CONFLICT (funcion) DO NOTHING;

-- ── (2) Lo que hizo un aparato sin cuenta pasa a la cuenta ───────────
-- La primera vez que un aparato llega con sesión, sus días y su uso sin
-- cuenta («a:<aparato>») se suman a la cuenta: así la persona que instaló,
-- probó y luego creó su cuenta es UNA sola en las cohortes.
CREATE OR REPLACE FUNCTION public._tele_unir(p_anon text, p_cuenta text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_a public.tele_personas%ROWTYPE;
BEGIN
    IF p_anon IS NULL OR p_cuenta IS NULL OR p_anon NOT LIKE 'a:%' THEN
        RETURN;
    END IF;
    SELECT * INTO v_a FROM public.tele_personas WHERE persona = p_anon FOR UPDATE;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    INSERT INTO public.tele_dias AS d (dia, persona, plataforma, version, miembro,
                                       sesiones, segundos, reconstruido)
    SELECT dia, p_cuenta, plataforma, version, miembro, sesiones, segundos, reconstruido
    FROM public.tele_dias WHERE persona = p_anon
    ON CONFLICT (dia, persona) DO UPDATE SET
        sesiones     = LEAST(d.sesiones + EXCLUDED.sesiones, 1000),
        segundos     = LEAST(d.segundos + EXCLUDED.segundos, 86400),
        plataforma   = coalesce(d.plataforma, EXCLUDED.plataforma),
        version      = coalesce(d.version, EXCLUDED.version),
        reconstruido = d.reconstruido AND EXCLUDED.reconstruido;
    DELETE FROM public.tele_dias WHERE persona = p_anon;

    INSERT INTO public.tele_uso AS u (dia, funcion, persona, aperturas, acciones,
                                      segundos, reconstruido)
    SELECT dia, funcion, p_cuenta, aperturas, acciones, segundos, reconstruido
    FROM public.tele_uso WHERE persona = p_anon
    ON CONFLICT (dia, funcion, persona) DO UPDATE SET
        aperturas    = LEAST(u.aperturas + EXCLUDED.aperturas, 5000),
        acciones     = LEAST(u.acciones + EXCLUDED.acciones, 5000),
        segundos     = LEAST(u.segundos + EXCLUDED.segundos, 86400),
        reconstruido = u.reconstruido AND EXCLUDED.reconstruido;
    DELETE FROM public.tele_uso WHERE persona = p_anon;

    UPDATE public.tele_respuestas SET persona = p_cuenta WHERE persona = p_anon;

    INSERT INTO public.tele_personas AS t (persona, cuenta, primer_dia, primera_vez,
                                           ultima_vez, plataforma, hitos)
    VALUES (p_cuenta, true, v_a.primer_dia, v_a.primera_vez, v_a.ultima_vez,
            v_a.plataforma, v_a.hitos)
    ON CONFLICT (persona) DO UPDATE SET
        cuenta      = true,
        primer_dia  = LEAST(t.primer_dia, EXCLUDED.primer_dia),
        primera_vez = LEAST(t.primera_vez, EXCLUDED.primera_vez),
        ultima_vez  = GREATEST(t.ultima_vez, EXCLUDED.ultima_vez),
        plataforma  = coalesce(t.plataforma, EXCLUDED.plataforma),
        -- La primera vez de cada cosa: la más temprana de las dos.
        hitos       = (
            SELECT coalesce(jsonb_object_agg(k, to_jsonb(m)), '{}'::jsonb)
            FROM (
                SELECT k, min(v) AS m
                FROM (
                    SELECT key AS k, (value #>> '{}')::timestamptz AS v FROM jsonb_each(t.hitos)
                    UNION ALL
                    SELECT key, (value #>> '{}')::timestamptz FROM jsonb_each(EXCLUDED.hitos)
                ) x
                GROUP BY k
            ) y
        );
    DELETE FROM public.tele_personas WHERE persona = p_anon;
    PERFORM public._tele_primer_valor(p_cuenta);
END $$;

-- El «primer valor» de una persona: la más temprana de sus acciones de valor
-- (las del catálogo con valor = true: un mensaje al Espejo, una lectura de
-- alimentos o de sueños, un pilar del Radar).
CREATE OR REPLACE FUNCTION public._tele_primer_valor(p_persona text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.tele_personas t
    SET primer_valor    = x.k,
        primer_valor_at = x.v
    FROM (
        SELECT
            (SELECT h.key FROM jsonb_each(p.hitos) h
             WHERE h.key IN (SELECT funcion FROM public.tele_catalogo WHERE valor)
             ORDER BY (h.value #>> '{}')::timestamptz LIMIT 1) AS k,
            (SELECT min((h.value #>> '{}')::timestamptz) FROM jsonb_each(p.hitos) h
             WHERE h.key IN (SELECT funcion FROM public.tele_catalogo WHERE valor)) AS v
        FROM public.tele_personas p
        WHERE p.persona = p_persona
    ) x
    WHERE t.persona = p_persona
      AND (t.primer_valor IS DISTINCT FROM x.k OR t.primer_valor_at IS DISTINCT FROM x.v);
$$;

REVOKE ALL ON FUNCTION public._tele_unir(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tele_primer_valor(text) FROM PUBLIC, anon, authenticated;

-- ── (3) El lote que manda la app ─────────────────────────────────────
-- Forma (v1), todo opcional salvo «id»:
-- {
--   "v": 1, "id": "<uuid del lote>",
--   "plataforma": "ios|android|mac|web-movil|web-escritorio", "version": "1.1.7",
--   "idioma": "es", "desde": <ms de la primera vez que la app corrió aquí>,
--   "antiguo": true,            -- ya tenía la app antes de la medición
--   "dias": { "2026-10-18": {
--       "s": 2, "seg": 340,                       sesiones y segundos en primer plano
--       "f": { "radar": [3, 120], "espejo": [1, 200] },   aperturas y segundos por capa
--       "p": { "radar>espejo": 1 },               pasos de una capa a otra
--       "e": { "radar": 2 },                      dónde empezó cada sesión
--       "x": { "espejo": 1 },  "xs": { "radar": 1 },   dónde se fue (xs: sin valor en la sesión)
--       "err": { "js:espejo:typeerror": 1 },      errores (tipo:dónde[:firma])
--       "t": { "porton:get_home_state": [n, suma_ms, c0..c6] },   tiempos
--       "r": [["espejo", "no_supe"]]              respuestas de un toque
--   } }
-- }
-- Nunca viaja texto de la persona: solo claves cortas y números.
CREATE OR REPLACE FUNCTION public.record_telemetria(
    p_clerk_user_id text,
    p_aparato       uuid,
    p_lote          jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
END $$;

REVOKE ALL ON FUNCTION public.record_telemetria(text, uuid, jsonb)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_telemetria(text, uuid, jsonb) TO service_role;

-- Sin sesión (la bienvenida, la web sin cuenta): el mismo lote, con el id del
-- aparato. Lo que hizo ese aparato se une a su cuenta cuando inicie sesión.
CREATE OR REPLACE FUNCTION public.record_telemetria_anon(
    p_aparato uuid,
    p_lote    jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.record_telemetria(NULL, p_aparato, p_lote);
$$;

REVOKE ALL ON FUNCTION public.record_telemetria_anon(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_telemetria_anon(uuid, jsonb)
    TO anon, authenticated, service_role;

-- ── (4) Lo que el servidor ya sabe ───────────────────────────────────
-- Las versiones de la app que todavía no mandan lotes (las de las tiendas
-- hasta la próxima) y TODAS las acciones salen de lo que el servidor guarda:
--   espejo:mensaje            registro de gasto 'oraculo' (se cobra antes de
--                             llamar al modelo; cuenta también el modo efímero)
--   espejo:foto · :voz · :imagen   'oraculo-vision' · 'espejo-voz' · 'espejo-imagen*'
--   decodificador.materia:lectura  'decode-matter'
--   decodificador.suenos:lectura   'decode-dream'
--   radar:pilar               cada pilar sellado (scan_vibracional.last_update_*)
--   radar:ciclo               'ciclo-sellado'
--   sendero:ritual            daily_checkins
--   radar.bitacora:nota · radar.plan_vuelo:mision/:cumplida · radar.rachas:crear
--   radar.realidad_elegida:respuesta · comunidad.mensajes:mensaje
--   holoteca.wallpapers:descarga · holoteca.biblioteca:lectura
--   decodificador.crop:decodificacion · decodificador.vision:sesion · voz:comando
-- y las aperturas de la navegación de 7 días (nav_events) para los días que no
-- trajo un lote. Un día con lote vivo manda: sus aperturas no se reconstruyen.
-- Las acciones se reemplazan en cada corrida (las del servidor son la verdad).
CREATE OR REPLACE FUNCTION public._tele_reconstruir(p_desde date)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ini timestamptz := (p_desde::timestamp AT TIME ZONE 'America/Cancun');
    v_n   int := 0;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS _tele_rec (
        dia date, persona text, funcion text, ap int, ac int, primera timestamptz
    ) ON COMMIT DROP;
    TRUNCATE _tele_rec;

    -- Registro de gasto (Espejo, Decodificadores, voz, ciclo).
    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), user_key,
           CASE edge
               WHEN 'oraculo' THEN 'espejo:mensaje'
               WHEN 'oraculo-vision' THEN 'espejo:foto'
               WHEN 'espejo-voz' THEN 'espejo:voz'
               WHEN 'espejo-imagen' THEN 'espejo:imagen'
               WHEN 'espejo-imagen-rafaga' THEN 'espejo:imagen'
               WHEN 'decode-matter' THEN 'decodificador.materia:lectura'
               WHEN 'decode-dream' THEN 'decodificador.suenos:lectura'
               WHEN 'ciclo-sellado' THEN 'radar:ciclo'
               WHEN 'voz-intent' THEN 'voz:comando'
           END,
           0, count(*)::int, min(created_at)
    FROM public.edge_spend_ledger
    WHERE created_at >= v_ini
      AND user_key LIKE 'user\_%'
      AND edge IN ('oraculo', 'oraculo-vision', 'espejo-voz', 'espejo-imagen',
                   'espejo-imagen-rafaga', 'decode-matter', 'decode-dream',
                   'ciclo-sellado', 'voz-intent')
    GROUP BY 1, 2, 3;

    -- Cada pilar sellado del Radar.
    INSERT INTO _tele_rec
    SELECT public._tele_dia(t), s.clerk_user_id, 'radar:pilar', 0, count(*)::int, min(t)
    FROM public.scan_vibracional s
    CROSS JOIN LATERAL (VALUES (s.last_update_fisico), (s.last_update_mental),
                               (s.last_update_emocional), (s.last_update_financiero),
                               (s.last_update_vector), (s.last_update_orbita)) v(t)
    WHERE t >= v_ini AND s.clerk_user_id IS NOT NULL
    GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT checkin_date, clerk_user_id, 'sendero:ritual', 0, count(*)::int, min(created_at)
    FROM public.daily_checkins
    WHERE checkin_date >= p_desde AND activity_key <> 'admin_adjust'
    GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'radar.bitacora:nota', 0, count(*)::int, min(created_at)
    FROM public.bitacora_notas WHERE created_at >= v_ini GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'radar.plan_vuelo:mision', 0, count(*)::int, min(created_at)
    FROM public.day_tasks WHERE created_at >= v_ini GROUP BY 1, 2;
    INSERT INTO _tele_rec
    SELECT public._tele_dia(done_at), clerk_user_id, 'radar.plan_vuelo:cumplida', 0, count(*)::int, min(done_at)
    FROM public.day_tasks WHERE done_at >= v_ini GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'radar.rachas:crear', 0, count(*)::int, min(created_at)
    FROM public.rachas WHERE created_at >= v_ini GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'radar.realidad_elegida:respuesta', 0, count(*)::int, min(created_at)
    FROM public.vision_answers WHERE created_at >= v_ini GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), sender_clerk_id, 'comunidad.mensajes:mensaje', 0, count(*)::int, min(created_at)
    FROM (
        SELECT created_at, sender_clerk_id FROM public.dm_messages WHERE created_at >= v_ini
        UNION ALL
        SELECT created_at, sender_clerk_id FROM public.grp_messages WHERE created_at >= v_ini
    ) m
    WHERE sender_clerk_id IS NOT NULL
    GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'holoteca.wallpapers:descarga', 0, count(*)::int, min(created_at)
    FROM public.wallpaper_downloads WHERE created_at >= v_ini GROUP BY 1, 2;

    -- Leer un Códice: el avance guarda solo la última vez de cada libro.
    INSERT INTO _tele_rec
    SELECT public._tele_dia(updated_at), clerk_user_id, 'holoteca.biblioteca:lectura', 0, count(*)::int, min(updated_at)
    FROM public.reading_progress WHERE updated_at >= v_ini GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'decodificador.crop:decodificacion', 0, count(*)::int, min(created_at)
    FROM public.crop_decodes WHERE created_at >= v_ini GROUP BY 1, 2;

    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, 'decodificador.vision:sesion', 0, count(*)::int, min(created_at)
    FROM public.vision_sessions WHERE created_at >= v_ini GROUP BY 1, 2;

    -- Las aperturas de la navegación de 7 días (solo vive una semana).
    INSERT INTO _tele_rec
    SELECT public._tele_dia(created_at), clerk_user_id, public._tele_capa(layer, sublayer),
           count(*)::int, 0, min(created_at)
    FROM public.nav_events
    WHERE created_at >= v_ini
    GROUP BY 1, 2, 3;

    -- Solo cuentas que existen, claves válidas.
    DELETE FROM _tele_rec r
    WHERE r.funcion IS NULL OR r.persona IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.clerk_user_id = r.persona);
    -- Las aperturas de un día con lote vivo no se reconstruyen (lo vivo manda).
    DELETE FROM _tele_rec r
    USING public.tele_dias d
    WHERE r.ap > 0 AND position(':' in r.funcion) = 0
      AND d.dia = r.dia AND d.persona = r.persona AND NOT d.reconstruido;

    -- Los días: hacer algo es estar activo ese día (y el día en que se abrió la
    -- cuenta también).
    INSERT INTO public.tele_dias AS d (dia, persona, miembro, reconstruido)
    SELECT x.dia, x.persona, public._tele_miembro_en(x.persona, x.dia), true
    FROM (
        SELECT DISTINCT dia, persona FROM _tele_rec
        UNION
        SELECT public._tele_dia(p.created_at), p.clerk_user_id
        FROM public.profiles p
        WHERE p.clerk_user_id IS NOT NULL AND p.created_at >= v_ini
    ) x
    ON CONFLICT (dia, persona) DO NOTHING;

    -- El uso: lo reconstruido se reemplaza; lo vivo no se toca.
    INSERT INTO public.tele_uso AS u (dia, funcion, persona, aperturas, acciones, reconstruido)
    SELECT dia, funcion, persona, LEAST(sum(ap), 5000)::int, LEAST(sum(ac), 5000)::int, true
    FROM _tele_rec
    GROUP BY dia, funcion, persona
    ON CONFLICT (dia, funcion, persona) DO UPDATE SET
        aperturas = CASE WHEN position(':' in u.funcion) > 0 THEN 0 ELSE EXCLUDED.aperturas END,
        acciones  = EXCLUDED.acciones
    WHERE u.reconstruido OR position(':' in u.funcion) > 0;
    GET DIAGNOSTICS v_n = ROW_COUNT;

    -- Las personas (con su alta) y sus hitos: la primera vez de cada acción.
    INSERT INTO public.tele_personas AS t (persona, cuenta, primer_dia, primera_vez, ultima_vez)
    SELECT p.clerk_user_id, true, public._tele_dia(min(p.created_at)), min(p.created_at),
           GREATEST(max(p.created_at), max(coalesce(r.ultima, p.created_at)))
    FROM public.profiles p
    LEFT JOIN (SELECT persona, max(primera) AS ultima FROM _tele_rec GROUP BY persona) r
           ON r.persona = p.clerk_user_id
    WHERE p.clerk_user_id IS NOT NULL
    GROUP BY p.clerk_user_id
    ON CONFLICT (persona) DO UPDATE SET
        cuenta      = true,
        primer_dia  = LEAST(t.primer_dia, EXCLUDED.primer_dia),
        primera_vez = LEAST(t.primera_vez, EXCLUDED.primera_vez),
        ultima_vez  = GREATEST(t.ultima_vez, EXCLUDED.ultima_vez);

    UPDATE public.tele_personas t
    SET hitos = t.hitos || (
        SELECT jsonb_object_agg(h.funcion, to_jsonb(h.primera))
        FROM (
            SELECT funcion, min(primera) AS primera
            FROM _tele_rec r
            WHERE r.persona = t.persona AND position(':' in r.funcion) > 0
            GROUP BY funcion
        ) h
        WHERE NOT (t.hitos ? h.funcion)
           OR (t.hitos ->> h.funcion)::timestamptz > h.primera
    )
    WHERE t.persona IN (SELECT DISTINCT persona FROM _tele_rec WHERE position(':' in funcion) > 0)
      AND EXISTS (
        SELECT 1 FROM _tele_rec r
        WHERE r.persona = t.persona AND position(':' in r.funcion) > 0
          AND (NOT (t.hitos ? r.funcion) OR (t.hitos ->> r.funcion)::timestamptz > r.primera));

    PERFORM public._tele_primer_valor(x.persona)
    FROM (SELECT DISTINCT persona FROM _tele_rec WHERE position(':' in funcion) > 0) x;

    INSERT INTO public.tele_ajustes (clave, valor) VALUES ('reconstruido_at', now()::text)
    ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
    RETURN v_n;
END $$;

REVOKE ALL ON FUNCTION public._tele_reconstruir(date) FROM PUBLIC, anon, authenticated;

-- Índices de fecha en las tablas de donde sale la reconstrucción (la corrida
-- diaria lee solo los últimos días; sin estos, a 10,000 tripulantes leería todo).
CREATE INDEX IF NOT EXISTS tele_idx_daily_checkins_fecha ON public.daily_checkins (checkin_date);
CREATE INDEX IF NOT EXISTS tele_idx_bitacora_creada ON public.bitacora_notas (created_at);
CREATE INDEX IF NOT EXISTS tele_idx_day_tasks_creada ON public.day_tasks (created_at);
CREATE INDEX IF NOT EXISTS tele_idx_dm_messages_creado ON public.dm_messages (created_at);
CREATE INDEX IF NOT EXISTS tele_idx_esl_creado ON public.edge_spend_ledger (created_at);

-- ── (5) La foto de un mes ────────────────────────────────────────────
-- Lo que se compara mes con mes (y se guarda en tele_mes para la tendencia).
CREATE OR REPLACE FUNCTION public._tele_mes_calcular(p_ini date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ini    date := date_trunc('month', p_ini)::date;
    v_fin    date := (date_trunc('month', p_ini) + interval '1 month')::date;
    v_hoy    date := public._tele_dia(now());
    v_hasta  date;
    v_n      int;
    v_tc     numeric := coalesce((SELECT valor::numeric FROM public.tele_ajustes WHERE clave = 'mxn_por_usd'), 18.47);
    v_out    jsonb;
BEGIN
    v_hasta := LEAST(v_fin, v_hoy + 1);
    v_n := GREATEST(v_hasta - v_ini, 1);

    WITH casa AS (SELECT clerk_user_id FROM public._tele_casa()),
    dm AS (
        SELECT d.* FROM public.tele_dias d
        WHERE d.dia >= v_ini AND d.dia < v_hasta
          AND d.persona NOT IN (SELECT clerk_user_id FROM casa)
    ),
    coh AS (
        SELECT p.* FROM public.tele_personas p
        WHERE p.primer_dia >= v_ini AND p.primer_dia < v_fin
          AND p.persona NOT IN (SELECT clerk_user_id FROM casa)
    ),
    ret AS (
        SELECT
            count(*) FILTER (WHERE c.primer_dia + 1 < v_hoy) AS d1_base,
            count(*) FILTER (WHERE c.primer_dia + 1 < v_hoy AND EXISTS (
                SELECT 1 FROM public.tele_dias x WHERE x.persona = c.persona
                  AND x.dia = c.primer_dia + 1)) AS d1,
            count(*) FILTER (WHERE c.primer_dia + 13 < v_hoy) AS d7_base,
            count(*) FILTER (WHERE c.primer_dia + 13 < v_hoy AND EXISTS (
                SELECT 1 FROM public.tele_dias x WHERE x.persona = c.persona
                  AND x.dia BETWEEN c.primer_dia + 7 AND c.primer_dia + 13)) AS d7,
            count(*) FILTER (WHERE c.primer_dia + 36 < v_hoy) AS d30_base,
            count(*) FILTER (WHERE c.primer_dia + 36 < v_hoy AND EXISTS (
                SELECT 1 FROM public.tele_dias x WHERE x.persona = c.persona
                  AND x.dia BETWEEN c.primer_dia + 30 AND c.primer_dia + 36)) AS d30
        FROM coh c
    ),
    act AS (
        SELECT
            count(*) FILTER (WHERE c.cuenta) AS cuentas,
            count(*) FILTER (WHERE c.cuenta AND c.primer_valor_at IS NOT NULL
                             AND c.primer_valor_at < c.primera_vez + interval '1 day') AS dia0,
            count(*) FILTER (WHERE c.cuenta AND c.primer_valor_at IS NOT NULL
                             AND c.primer_valor_at < c.primera_vez + interval '7 days') AS dias7,
            percentile_cont(0.5) WITHIN GROUP (
                ORDER BY extract(epoch FROM (c.primer_valor_at - c.primera_vez)) / 60.0)
                FILTER (WHERE c.cuenta AND c.primer_valor_at IS NOT NULL
                        AND c.primer_valor_at < c.primera_vez + interval '30 days')
                AS mediana_min
        FROM coh c
    ),
    muro AS (
        SELECT count(DISTINCT coalesce(e.clerk_user_id, e.dispositivo::text)) AS personas
        FROM public.muro_eventos e
        WHERE e.evento = 'visto' AND NOT coalesce(e.miembro, false)
          AND public._tele_dia(e.created_at) >= v_ini AND public._tele_dia(e.created_at) < v_fin
          AND (e.clerk_user_id IS NULL OR e.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa))
    ),
    pagos AS (
        SELECT DISTINCT coalesce(p.clerk_user_id, s.user_id::text) AS cuenta, s.created_at,
               s.current_period_start, s.current_period_end, s.status
        FROM public.subscriptions s
        LEFT JOIN public.profiles p ON p.id = s.user_id
        WHERE lower(coalesce(s.group_name, '')) IN ('sintonia', 'inmersion')
          AND coalesce(s.stripe_subscription_id, '') NOT ILIKE 'gift%'
          AND coalesce(p.clerk_user_id, '') NOT IN (SELECT clerk_user_id FROM casa)
    ),
    ia AS (
        SELECT coalesce(sum(l.cost_units * c.mxn_por_unidad), 0) AS mxn
        FROM public.edge_spend_ledger l
        JOIN public.tele_costos_ia c ON c.edge = l.edge AND NOT c.es_ventana
        WHERE public._tele_dia(l.created_at) >= v_ini AND public._tele_dia(l.created_at) < v_fin
    )
    SELECT jsonb_build_object(
        'mes', v_ini,
        'dias', v_n,
        'cerrado', v_fin <= v_hoy,
        'mau', (SELECT count(DISTINCT persona) FROM dm),
        'mau_cuenta', (SELECT count(DISTINCT persona) FROM dm WHERE persona NOT LIKE 'a:%'),
        'dau', round((SELECT count(*) FROM dm)::numeric / v_n, 2),
        'wau', (SELECT count(DISTINCT persona) FROM dm WHERE dia >= v_hasta - 7),
        'miembros_activos', (SELECT count(DISTINCT persona) FROM dm WHERE miembro),
        'sesiones', (SELECT coalesce(sum(sesiones), 0) FROM dm),
        'minutos', round((SELECT coalesce(sum(segundos), 0) FROM dm)::numeric / 60, 1),
        'dias_vivos', (SELECT count(*) FROM dm WHERE NOT reconstruido),
        'dias_total', (SELECT count(*) FROM dm),
        'nuevas', (SELECT count(*) FROM coh),
        'nuevas_cuenta', (SELECT count(*) FROM coh WHERE cuenta),
        'cuentas', (SELECT count(*) FROM public.profiles p
                    WHERE p.clerk_user_id IS NOT NULL
                      AND public._tele_dia(p.created_at) >= v_ini
                      AND public._tele_dia(p.created_at) < v_fin
                      AND p.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa)),
        'aparatos_nuevos', (SELECT count(*) FROM public.tele_aparatos a
                            WHERE NOT a.antiguo
                              AND public._tele_dia(a.primera_vez) >= v_ini
                              AND public._tele_dia(a.primera_vez) < v_fin
                              AND coalesce(a.clerk_user_id, '') NOT IN (SELECT clerk_user_id FROM casa)),
        'activacion', (SELECT jsonb_build_object('cuentas', cuentas, 'dia0', dia0, 'dias7', dias7,
                                                 'mediana_min', round(mediana_min::numeric, 1))
                       FROM act),
        'retencion', (SELECT jsonb_build_object('d1', d1, 'd1_base', d1_base, 'd7', d7,
                                                'd7_base', d7_base, 'd30', d30, 'd30_base', d30_base)
                      FROM ret),
        'muro_personas', (SELECT personas FROM muro),
        'pagos_nuevos', (SELECT count(DISTINCT cuenta) FROM pagos
                         WHERE public._tele_dia(created_at) >= v_ini AND public._tele_dia(created_at) < v_fin),
        'suscripciones', (SELECT count(DISTINCT cuenta) FROM pagos
                          WHERE public._tele_dia(created_at) < v_hasta
                            AND (CASE WHEN v_fin > v_hoy
                                      THEN status IN ('active', 'trialing')
                                      ELSE current_period_end IS NULL
                                           OR public._tele_dia(current_period_end) >= v_fin - 1 END)),
        'ia_mxn', (SELECT round(mxn, 2) FROM ia),
        'mxn_por_usd', v_tc
    ) INTO v_out;
    RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public._tele_mes_calcular(date) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._tele_mes_guardar(p_ini date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v jsonb := public._tele_mes_calcular(p_ini);
BEGIN
    INSERT INTO public.tele_mes (mes, datos, actualizado)
    VALUES (date_trunc('month', p_ini)::date, v, now())
    ON CONFLICT (mes) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now();
    RETURN v;
END $$;

REVOKE ALL ON FUNCTION public._tele_mes_guardar(date) FROM PUBLIC, anon, authenticated;

-- ── (6) Mantenimiento diario (pg_cron) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.tele_mantener()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hoy date := public._tele_dia(now());
    v_rec int;
    v_m   date;
BEGIN
    -- Lo de las versiones que no mandan lotes (y las acciones de todas).
    v_rec := public._tele_reconstruir(v_hoy - 3);

    -- La historia larga sin persona: el uso por mes (los últimos dos meses se
    -- recalculan; lo anterior ya no cambia).
    INSERT INTO public.tele_uso_mes AS m (mes, funcion, personas, dias_persona,
                                          aperturas, acciones, segundos)
    SELECT date_trunc('month', u.dia)::date, u.funcion, count(DISTINCT u.persona),
           count(*), sum(u.aperturas), sum(u.acciones), sum(u.segundos)
    FROM public.tele_uso u
    WHERE u.dia >= date_trunc('month', v_hoy - 35)::date
      AND u.persona NOT IN (SELECT clerk_user_id FROM public._tele_casa())
    GROUP BY 1, 2
    ON CONFLICT (mes, funcion) DO UPDATE SET
        personas = EXCLUDED.personas, dias_persona = EXCLUDED.dias_persona,
        aperturas = EXCLUDED.aperturas, acciones = EXCLUDED.acciones,
        segundos = EXCLUDED.segundos;

    -- La foto de los últimos tres meses (la retención del día 30 se completa
    -- hasta 37 días después de cada alta).
    FOR v_m IN SELECT generate_series(date_trunc('month', v_hoy - 70)::date,
                                      date_trunc('month', v_hoy)::date,
                                      interval '1 month')::date LOOP
        PERFORM public._tele_mes_guardar(v_m);
    END LOOP;

    -- Retención: el uso por persona 120 días; días, globales y respuestas 400.
    DELETE FROM public.tele_uso WHERE dia < v_hoy - 120;
    DELETE FROM public.tele_dias WHERE dia < v_hoy - 400;
    DELETE FROM public.tele_global WHERE dia < v_hoy - 400;
    DELETE FROM public.tele_respuestas WHERE dia < v_hoy - 400;
    DELETE FROM public.tele_lotes WHERE creado < now() - interval '7 days';
    DELETE FROM public.tele_aparatos WHERE ultima_vez < now() - interval '400 days';
    DELETE FROM public.tele_personas
    WHERE persona LIKE 'a:%' AND ultima_vez < now() - interval '400 days';
    DELETE FROM public.suscripcion_eventos WHERE created_at < now() - interval '1095 days';

    RETURN jsonb_build_object('ok', true, 'reconstruidas', v_rec);
END $$;

REVOKE ALL ON FUNCTION public.tele_mantener() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tele_mantener() TO service_role;

-- Cada día a las 09:25 UTC (04:25 en Cancún). Si pg_cron no está, no pasa nada.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule('tele-mantener-diario', '25 9 * * *',
                              'SELECT public.tele_mantener();');
    END IF;
END $$;

-- ── (7) Lo que pinta Motor → Telemetría (vía admin-action) ───────────
CREATE OR REPLACE FUNCTION public.admin_telemetria_resumen(
    p_admin_clerk_id text,
    p_mes            date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin  boolean;
    v_hoy    date := public._tele_dia(now());
    v_ini    date;
    v_fin    date;
    v_hasta  date;
    v_n      int;
    v_ult    timestamptz;
    v_tc     numeric;
    v_foto   jsonb;
    v_out    jsonb;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    v_ini := date_trunc('month', coalesce(p_mes, v_hoy))::date;
    v_fin := (v_ini + interval '1 month')::date;
    v_hasta := LEAST(v_fin, v_hoy + 1);
    v_n := GREATEST(v_hasta - v_ini, 1);
    v_tc := coalesce((SELECT valor::numeric FROM public.tele_ajustes WHERE clave = 'mxn_por_usd'), 18.47);

    -- Lo de hoy y ayer de las versiones sin lote (si no corrió en la última media hora).
    SELECT NULLIF(valor, '')::timestamptz INTO v_ult FROM public.tele_ajustes WHERE clave = 'reconstruido_at';
    IF v_ult IS NULL OR v_ult < now() - interval '30 minutes' THEN
        PERFORM public._tele_reconstruir(v_hoy - 2);
    END IF;
    v_foto := public._tele_mes_guardar(v_ini);
    IF v_ini > date_trunc('month', v_hoy - 70)::date THEN
        PERFORM public._tele_mes_guardar((v_ini - interval '1 month')::date);
    END IF;

    WITH casa AS (SELECT clerk_user_id FROM public._tele_casa()),
    dm AS (
        SELECT d.* FROM public.tele_dias d
        WHERE d.dia >= v_ini AND d.dia < v_hasta
          AND d.persona NOT IN (SELECT clerk_user_id FROM casa)
    ),
    um AS (
        SELECT u.* FROM public.tele_uso u
        WHERE u.dia >= v_ini AND u.dia < v_hasta
          AND u.persona NOT IN (SELECT clerk_user_id FROM casa)
    ),
    -- Los últimos 30 días hasta el fin del periodo (para las muertas).
    u30 AS (
        SELECT u.funcion, count(DISTINCT u.persona) AS personas, max(u.dia) AS ultimo
        FROM public.tele_uso u
        WHERE u.dia >= v_hasta - 30 AND u.dia < v_hasta
          AND (u.aperturas > 0 OR u.acciones > 0 OR u.segundos > 0)
          AND u.persona NOT IN (SELECT clerk_user_id FROM casa)
        GROUP BY u.funcion
    ),
    mau30 AS (
        SELECT count(DISTINCT d.persona) AS n FROM public.tele_dias d
        WHERE d.dia >= v_hasta - 30 AND d.dia < v_hasta
          AND d.persona NOT IN (SELECT clerk_user_id FROM casa)
    ),
    gm AS (
        SELECT g.* FROM public.tele_global g WHERE g.dia >= v_ini AND g.dia < v_hasta
    ),
    usos AS (
        SELECT um.funcion,
               count(DISTINCT um.persona) AS personas,
               count(*) AS dias_persona,
               sum(um.aperturas) AS aperturas,
               sum(um.acciones) AS acciones,
               sum(um.segundos) AS segundos,
               count(DISTINCT um.persona) FILTER (WHERE d.miembro) AS miembros
        FROM um
        LEFT JOIN dm d ON d.dia = um.dia AND d.persona = um.persona
        GROUP BY um.funcion
    ),
    -- Cohortes de los últimos 6 meses (con su retención día 1, 7 y 30).
    coh AS (
        SELECT date_trunc('month', p.primer_dia)::date AS mes, p.*
        FROM public.tele_personas p
        WHERE p.primer_dia >= (v_ini - interval '5 months')::date AND p.primer_dia < v_fin
          AND p.persona NOT IN (SELECT clerk_user_id FROM casa)
    ),
    ret AS (
        SELECT c.mes,
               count(*) AS personas,
               count(*) FILTER (WHERE c.cuenta) AS con_cuenta,
               count(*) FILTER (WHERE c.primer_dia + 1 < v_hoy) AS d1_base,
               count(*) FILTER (WHERE c.primer_dia + 1 < v_hoy AND EXISTS (
                   SELECT 1 FROM public.tele_dias x WHERE x.persona = c.persona
                     AND x.dia = c.primer_dia + 1)) AS d1,
               count(*) FILTER (WHERE c.primer_dia + 13 < v_hoy) AS d7_base,
               count(*) FILTER (WHERE c.primer_dia + 13 < v_hoy AND EXISTS (
                   SELECT 1 FROM public.tele_dias x WHERE x.persona = c.persona
                     AND x.dia BETWEEN c.primer_dia + 7 AND c.primer_dia + 13)) AS d7,
               count(*) FILTER (WHERE c.primer_dia + 36 < v_hoy) AS d30_base,
               count(*) FILTER (WHERE c.primer_dia + 36 < v_hoy AND EXISTS (
                   SELECT 1 FROM public.tele_dias x WHERE x.persona = c.persona
                     AND x.dia BETWEEN c.primer_dia + 30 AND c.primer_dia + 36)) AS d30,
               count(*) FILTER (WHERE c.cuenta AND c.primer_valor_at IS NOT NULL
                                AND c.primer_valor_at < c.primera_vez + interval '1 day') AS valor_dia0
        FROM coh c
        GROUP BY c.mes
    ),
    -- El embudo de las cuentas nuevas del mes, paso por paso.
    cuentas AS (
        SELECT p.clerk_user_id, p.created_at, p.id
        FROM public.profiles p
        WHERE p.clerk_user_id IS NOT NULL
          AND public._tele_dia(p.created_at) >= v_ini AND public._tele_dia(p.created_at) < v_fin
          AND p.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa)
    ),
    pagos AS (
        SELECT DISTINCT p.clerk_user_id AS cuenta, s.id AS sub, s.created_at,
               s.current_period_start, s.current_period_end, s.status,
               coalesce(s.stripe_subscription_id, '') AS sid
        FROM public.subscriptions s
        JOIN public.profiles p ON p.id = s.user_id
        WHERE lower(coalesce(s.group_name, '')) IN ('sintonia', 'inmersion')
          AND coalesce(s.stripe_subscription_id, '') NOT ILIKE 'gift%'
          AND p.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa)
    ),
    renov AS (
        -- Renovó: RevenueCat lo avisa (desde esta migración); en la web, Stripe
        -- guarda un periodo por cobro; y un periodo vigente que empezó días
        -- después del alta también es una renovación.
        SELECT DISTINCT cuenta FROM (
            SELECT e.clerk_user_id AS cuenta FROM public.suscripcion_eventos e
            WHERE e.tipo = 'RENEWAL' AND coalesce(e.entorno, 'PRODUCTION') = 'PRODUCTION'
            UNION ALL
            SELECT g.cuenta FROM pagos g
            WHERE g.current_period_start > g.created_at + interval '2 days'
            UNION ALL
            SELECT p.clerk_user_id FROM public.subscription_periods sp
            JOIN public.profiles p ON p.id = sp.user_id
            GROUP BY p.clerk_user_id HAVING count(*) > 1
        ) r
    ),
    muro_ev AS (
        SELECT e.* FROM public.muro_eventos e
        WHERE public._tele_dia(e.created_at) >= v_ini AND public._tele_dia(e.created_at) < v_hasta
          AND (e.clerk_user_id IS NULL OR e.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa))
    ),
    ia AS (
        SELECT c.funcion, c.nombre, l.edge,
               count(*) AS llamadas, sum(l.cost_units) AS unidades,
               sum(l.cost_units * c.mxn_por_unidad) AS mxn,
               count(DISTINCT l.user_key) AS personas
        FROM public.edge_spend_ledger l
        JOIN public.tele_costos_ia c ON c.edge = l.edge AND NOT c.es_ventana
        WHERE public._tele_dia(l.created_at) >= v_ini AND public._tele_dia(l.created_at) < v_hasta
        GROUP BY c.funcion, c.nombre, l.edge
    ),
    miembros_mes AS (
        SELECT DISTINCT persona FROM dm WHERE miembro
    ),
    ia_miembros AS (
        SELECT coalesce(sum(l.cost_units * c.mxn_por_unidad), 0) AS mxn
        FROM public.edge_spend_ledger l
        JOIN public.tele_costos_ia c ON c.edge = l.edge AND NOT c.es_ventana
        WHERE public._tele_dia(l.created_at) >= v_ini AND public._tele_dia(l.created_at) < v_hasta
          AND l.user_key IN (SELECT persona FROM miembros_mes)
    ),
    top_personas AS (
        SELECT d.persona,
               count(*) AS dias,
               sum(d.sesiones) AS sesiones,
               round(sum(d.segundos)::numeric / 60, 1) AS minutos,
               bool_or(d.miembro) AS miembro,
               (array_agg(d.plataforma ORDER BY d.dia DESC) FILTER (WHERE d.plataforma IS NOT NULL))[1] AS plataforma,
               max(d.dia) AS ultimo
        FROM dm d
        GROUP BY d.persona
        ORDER BY count(*) DESC, sum(d.segundos) DESC
        LIMIT 30
    )
    SELECT jsonb_build_object(
        'mes', v_ini,
        'hasta', v_hasta - 1,
        'hoy', v_hoy,
        'dias', v_n,
        'inicio_lotes', (SELECT min(dia) FROM public.tele_dias WHERE NOT reconstruido),
        'meta_suscripciones', coalesce((SELECT valor::int FROM public.tele_ajustes WHERE clave = 'meta_suscripciones'), 92),
        'foto', v_foto,
        'tendencia', coalesce((
            SELECT jsonb_agg(t.datos ORDER BY t.mes)
            FROM public.tele_mes t
            WHERE t.mes > (v_ini - interval '12 months')::date AND t.mes <= v_ini
        ), '[]'::jsonb),
        'por_dia', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                       'dia', g.d,
                       'personas', (SELECT count(*) FROM dm WHERE dm.dia = g.d),
                       'cuenta', (SELECT count(*) FROM dm WHERE dm.dia = g.d AND dm.persona NOT LIKE 'a:%'),
                       'miembros', (SELECT count(*) FROM dm WHERE dm.dia = g.d AND dm.miembro),
                       'vivos', (SELECT count(*) FROM dm WHERE dm.dia = g.d AND NOT dm.reconstruido))
                   ORDER BY g.d)
            FROM generate_series(v_ini, v_hasta - 1, interval '1 day') AS g0(x)
            CROSS JOIN LATERAL (SELECT g0.x::date AS d) g
        ), '[]'::jsonb),
        'plataformas', coalesce((
            SELECT jsonb_object_agg(pl, n) FROM (
                SELECT coalesce(plataforma, 'sin_dato') AS pl, count(DISTINCT persona) AS n
                FROM dm GROUP BY 1
            ) q
        ), '{}'::jsonb),
        'versiones', coalesce((
            SELECT jsonb_object_agg(v, n) FROM (
                SELECT coalesce(version, 'sin_dato') AS v, count(DISTINCT persona) AS n
                FROM dm WHERE NOT reconstruido GROUP BY 1
            ) q
        ), '{}'::jsonb),
        'cohortes', coalesce((
            SELECT jsonb_agg(to_jsonb(r) ORDER BY r.mes DESC) FROM ret r
        ), '[]'::jsonb),
        'uso', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                       'funcion', c.funcion,
                       'nombre', c.nombre,
                       'grupo', c.grupo,
                       'tipo', c.tipo,
                       'orden', c.orden,
                       'valor', c.valor,
                       'oculta', c.oculta,
                       'personas', coalesce(u.personas, 0),
                       'dias_persona', coalesce(u.dias_persona, 0),
                       'aperturas', coalesce(u.aperturas, 0),
                       'acciones', coalesce(u.acciones, 0),
                       'segundos', coalesce(u.segundos, 0),
                       'miembros', coalesce(u.miembros, 0),
                       'personas_30', coalesce(t.personas, 0),
                       'ultimo', (SELECT max(x.dia) FROM public.tele_uso x
                                  WHERE x.funcion = c.funcion
                                    AND x.persona NOT IN (SELECT clerk_user_id FROM casa)),
                       'visto_primero', c.visto_primero)
                   ORDER BY c.orden, c.funcion)
            FROM (
                SELECT funcion FROM public.tele_catalogo
                UNION SELECT funcion FROM usos
            ) k
            LEFT JOIN public.tele_catalogo c0 ON c0.funcion = k.funcion
            CROSS JOIN LATERAL (
                SELECT k.funcion,
                       c0.nombre, c0.grupo,
                       coalesce(c0.tipo, CASE WHEN position(':' in k.funcion) > 0 THEN 'accion' ELSE 'capa' END) AS tipo,
                       coalesce(c0.orden, 900) AS orden,
                       coalesce(c0.valor, false) AS valor,
                       coalesce(c0.oculta, false) AS oculta,
                       c0.visto_primero
            ) c
            LEFT JOIN usos u ON u.funcion = k.funcion
            LEFT JOIN u30 t ON t.funcion = k.funcion
        ), '[]'::jsonb),
        'mau_30', (SELECT n FROM mau30),
        'recorridos', jsonb_build_object(
            'pasos', coalesce((
                SELECT jsonb_agg(jsonb_build_object('clave', clave, 'n', n) ORDER BY n DESC)
                FROM (SELECT clave, sum(n) AS n FROM gm WHERE tipo = 'paso'
                      GROUP BY clave ORDER BY sum(n) DESC LIMIT 30) q
            ), '[]'::jsonb),
            'entradas', coalesce((
                SELECT jsonb_agg(jsonb_build_object('clave', clave, 'n', n) ORDER BY n DESC)
                FROM (SELECT clave, sum(n) AS n FROM gm WHERE tipo = 'entrada'
                      GROUP BY clave ORDER BY sum(n) DESC LIMIT 15) q
            ), '[]'::jsonb),
            'salidas', coalesce((
                SELECT jsonb_agg(jsonb_build_object('clave', s.clave, 'n', s.n,
                                                    'sin_valor', coalesce(v.n, 0)) ORDER BY s.n DESC)
                FROM (SELECT clave, sum(n) AS n FROM gm WHERE tipo = 'salida'
                      GROUP BY clave ORDER BY sum(n) DESC LIMIT 15) s
                LEFT JOIN (SELECT clave, sum(n) AS n FROM gm WHERE tipo = 'salida_sv'
                           GROUP BY clave) v ON v.clave = s.clave
            ), '[]'::jsonb)
        ),
        'embudo', jsonb_build_object(
            'aparatos_nuevos', (v_foto->>'aparatos_nuevos')::int,
            'bienvenida', (SELECT count(*) FROM public.onb_funnel o
                           WHERE public._tele_dia(o.started_at) >= v_ini
                             AND public._tele_dia(o.started_at) < v_fin),
            'bienvenida_lista', (SELECT count(*) FROM public.onb_funnel o
                                 WHERE public._tele_dia(o.started_at) >= v_ini
                                   AND public._tele_dia(o.started_at) < v_fin
                                   AND (o.max_step >= 13 OR o.completed)),
            'entro_directo', (SELECT count(*) FROM public.onb_funnel o
                              WHERE public._tele_dia(o.started_at) >= v_ini
                                AND public._tele_dia(o.started_at) < v_fin
                                AND o.max_step = 14),
            'cuentas', (SELECT count(*) FROM cuentas),
            'primer_valor', (SELECT count(*) FROM cuentas c
                             JOIN public.tele_personas p ON p.persona = c.clerk_user_id
                             WHERE p.primer_valor_at IS NOT NULL),
            'primer_valor_dia0', (SELECT count(*) FROM cuentas c
                                  JOIN public.tele_personas p ON p.persona = c.clerk_user_id
                                  WHERE p.primer_valor_at IS NOT NULL
                                    AND p.primer_valor_at < p.primera_vez + interval '1 day'),
            'muro', (SELECT count(DISTINCT e.clerk_user_id) FROM public.muro_eventos e
                     WHERE e.clerk_user_id IN (SELECT clerk_user_id FROM cuentas)
                       AND e.evento = 'visto' AND NOT coalesce(e.miembro, false)),
            'pagaron', (SELECT count(DISTINCT g.cuenta) FROM pagos g
                        WHERE g.cuenta IN (SELECT clerk_user_id FROM cuentas)),
            'renovaron', (SELECT count(DISTINCT g.cuenta) FROM pagos g
                          WHERE g.cuenta IN (SELECT clerk_user_id FROM cuentas)
                            AND g.cuenta IN (SELECT cuenta FROM renov)),
            'por_valor', coalesce((
                SELECT jsonb_object_agg(k, n) FROM (
                    SELECT p.primer_valor AS k, count(*) AS n
                    FROM cuentas c JOIN public.tele_personas p ON p.persona = c.clerk_user_id
                    WHERE p.primer_valor IS NOT NULL GROUP BY 1
                ) q
            ), '{}'::jsonb),
            'nunca_valor_total', (SELECT count(*) FROM public.tele_personas p
                                  WHERE p.cuenta AND p.primer_valor_at IS NULL
                                    AND p.persona NOT IN (SELECT clerk_user_id FROM casa)),
            'cuentas_total', (SELECT count(*) FROM public.tele_personas p
                              WHERE p.cuenta AND p.persona NOT IN (SELECT clerk_user_id FROM casa))
        ),
        'muro', jsonb_build_object(
            'personas', (SELECT count(DISTINCT coalesce(clerk_user_id, dispositivo::text, apertura::text))
                         FROM muro_ev WHERE evento = 'visto' AND NOT coalesce(miembro, false)),
            'intentaron', (SELECT count(DISTINCT coalesce(clerk_user_id, dispositivo::text, apertura::text))
                           FROM muro_ev WHERE evento = 'intento' AND NOT coalesce(miembro, false)),
            'compraron_app', (SELECT count(DISTINCT coalesce(clerk_user_id, dispositivo::text, apertura::text))
                              FROM muro_ev WHERE evento = 'compra'),
            'pagos_nuevos', (SELECT count(DISTINCT cuenta) FROM pagos
                             WHERE public._tele_dia(created_at) >= v_ini AND public._tele_dia(created_at) < v_hasta),
            'por_muro', coalesce((
                SELECT jsonb_agg(jsonb_build_object('muro', muro, 'personas', n) ORDER BY n DESC)
                FROM (SELECT muro, count(DISTINCT coalesce(clerk_user_id, dispositivo::text, apertura::text)) AS n
                      FROM muro_ev WHERE evento = 'visto' AND NOT coalesce(miembro, false)
                      GROUP BY muro ORDER BY 2 DESC LIMIT 10) q
            ), '[]'::jsonb),
            'motivos', coalesce((
                SELECT jsonb_object_agg(motivo, n) FROM (
                    SELECT motivo, count(*) AS n FROM muro_ev
                    WHERE evento = 'motivo' AND motivo IS NOT NULL GROUP BY motivo
                ) q
            ), '{}'::jsonb)
        ),
        'suscripciones', jsonb_build_object(
            'activas', (SELECT count(DISTINCT cuenta) FROM pagos WHERE status IN ('active', 'trialing')),
            'activas_semanal', (SELECT count(DISTINCT cuenta) FROM pagos
                                WHERE status IN ('active', 'trialing')
                                  AND current_period_end - current_period_start < interval '10 days'),
            'activas_web', (SELECT count(DISTINCT cuenta) FROM pagos
                            WHERE status IN ('active', 'trialing') AND sid LIKE 'sub\_%'),
            'regalos', (SELECT count(DISTINCT p.clerk_user_id)
                        FROM public.subscriptions s JOIN public.profiles p ON p.id = s.user_id
                        WHERE s.status IN ('active', 'trialing')
                          AND coalesce(s.stripe_subscription_id, '') ILIKE 'gift%'
                          AND p.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa)),
            'nuevas_mes', (SELECT count(DISTINCT cuenta) FROM pagos
                           WHERE public._tele_dia(created_at) >= v_ini AND public._tele_dia(created_at) < v_hasta),
            'eventos', coalesce((
                SELECT jsonb_object_agg(tipo, n) FROM (
                    SELECT e.tipo, count(*) AS n FROM public.suscripcion_eventos e
                    WHERE public._tele_dia(coalesce(e.ocurrio, e.created_at)) >= v_ini
                      AND public._tele_dia(coalesce(e.ocurrio, e.created_at)) < v_hasta
                      AND coalesce(e.entorno, 'PRODUCTION') = 'PRODUCTION'
                      AND coalesce(e.clerk_user_id, '') NOT IN (SELECT clerk_user_id FROM casa)
                    GROUP BY e.tipo
                ) q
            ), '{}'::jsonb),
            'paises', coalesce((
                SELECT jsonb_object_agg(pais, n) FROM (
                    SELECT coalesce(e.pais, '??') AS pais, count(DISTINCT e.clerk_user_id) AS n
                    FROM public.suscripcion_eventos e
                    WHERE e.tipo IN ('INITIAL_PURCHASE', 'RENEWAL')
                      AND coalesce(e.entorno, 'PRODUCTION') = 'PRODUCTION'
                      AND public._tele_dia(coalesce(e.ocurrio, e.created_at)) >= v_ini
                      AND public._tele_dia(coalesce(e.ocurrio, e.created_at)) < v_hasta
                    GROUP BY 1
                ) q
            ), '{}'::jsonb),
            'eventos_desde', (SELECT min(created_at) FROM public.suscripcion_eventos)
        ),
        'errores', coalesce((
            SELECT jsonb_agg(jsonb_build_object('clave', clave, 'n', n, 'plataformas', pls) ORDER BY n DESC)
            FROM (SELECT clave, sum(n) AS n, jsonb_object_agg(plataforma, n) AS pls
                  FROM gm WHERE tipo = 'error'
                  GROUP BY clave ORDER BY sum(n) DESC LIMIT 25) q
        ), '[]'::jsonb),
        'tiempos', coalesce((
            SELECT jsonb_agg(jsonb_build_object('clave', clave, 'n', n, 'suma_ms', suma,
                                                'cubetas', cub) ORDER BY n DESC)
            FROM (
                SELECT g.clave, sum(g.n) AS n, sum(g.suma_ms) AS suma,
                       ARRAY(SELECT sum(g2.cubetas[i])
                             FROM gm g2 CROSS JOIN generate_series(1, 7) AS i
                             WHERE g2.tipo = 'tiempo' AND g2.clave = g.clave
                             GROUP BY i ORDER BY i) AS cub
                FROM gm g WHERE g.tipo = 'tiempo'
                GROUP BY g.clave ORDER BY sum(g.n) DESC LIMIT 40
            ) q
        ), '[]'::jsonb),
        'sesiones', (SELECT coalesce(sum(sesiones), 0) FROM dm WHERE NOT reconstruido),
        'ia', jsonb_build_object(
            'total_mxn', (SELECT round(coalesce(sum(mxn), 0), 2) FROM ia),
            'por_edge', coalesce((
                SELECT jsonb_agg(jsonb_build_object('edge', edge, 'funcion', funcion, 'nombre', nombre,
                                                    'llamadas', llamadas, 'unidades', unidades,
                                                    'mxn', round(mxn, 2), 'personas', personas)
                                 ORDER BY mxn DESC)
                FROM ia
            ), '[]'::jsonb),
            'miembros', (SELECT count(*) FROM miembros_mes),
            'miembros_mxn', (SELECT round(mxn, 2) FROM ia_miembros),
            'espejo_real_usd', (SELECT round(coalesce(sum(l.cost_units), 0) / 1000000.0, 4)
                                FROM public.edge_spend_ledger l
                                WHERE l.edge = 'oraculo-dinero'
                                  AND public._tele_dia(l.created_at) >= v_ini
                                  AND public._tele_dia(l.created_at) < v_hasta),
            'espejo_real_desde', (SELECT min(created_at) FROM public.edge_spend_ledger
                                  WHERE edge = 'oraculo-dinero'),
            'mxn_por_usd', v_tc
        ),
        'respuestas', coalesce((
            SELECT jsonb_agg(jsonb_build_object('donde', donde, 'respuesta', respuesta,
                                                'n', n, 'miembros', m) ORDER BY donde, n DESC)
            FROM (SELECT r.donde, r.respuesta, count(*) AS n, count(*) FILTER (WHERE r.miembro) AS m
                  FROM public.tele_respuestas r
                  WHERE r.dia >= v_ini AND r.dia < v_hasta
                    AND r.persona NOT IN (SELECT clerk_user_id FROM casa)
                  GROUP BY r.donde, r.respuesta) q
        ), '[]'::jsonb),
        'personas', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                       'persona', t.persona,
                       'quien', CASE WHEN t.persona LIKE 'a:%' THEN NULL
                                     ELSE COALESCE(NULLIF(btrim(pr.full_name), ''),
                                                   NULLIF(btrim(pr.email), ''), 'Cuenta') END,
                       'dias', t.dias, 'sesiones', t.sesiones, 'minutos', t.minutos,
                       'miembro', t.miembro, 'plataforma', t.plataforma, 'ultimo', t.ultimo,
                       'primer_valor', tp.primer_valor, 'primer_dia', tp.primer_dia)
                   ORDER BY t.dias DESC, t.minutos DESC)
            FROM top_personas t
            LEFT JOIN public.tele_personas tp ON tp.persona = t.persona
            LEFT JOIN LATERAL (
                SELECT full_name, email FROM public.profiles WHERE clerk_user_id = t.persona LIMIT 1
            ) pr ON true
        ), '[]'::jsonb)
    ) INTO v_out;
    RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public.admin_telemetria_resumen(text, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_telemetria_resumen(text, date) TO service_role;

-- Una persona por dentro: sus días, lo que usó y lo que respondió (para seguir
-- a quien se va o a quien paga).
CREATE OR REPLACE FUNCTION public.admin_telemetria_persona(
    p_admin_clerk_id text,
    p_persona        text,
    p_dias           int DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
    v_hoy   date := public._tele_dia(now());
    v_desde date;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    v_desde := v_hoy - LEAST(GREATEST(coalesce(p_dias, 60), 7), 120);
    RETURN jsonb_build_object(
        'persona', (SELECT to_jsonb(p) FROM public.tele_personas p WHERE p.persona = p_persona),
        'aparatos', coalesce((
            SELECT jsonb_agg(jsonb_build_object('plataforma', a.plataforma, 'version', a.version,
                                                'idioma', a.idioma, 'primera_vez', a.primera_vez,
                                                'ultima_vez', a.ultima_vez, 'antiguo', a.antiguo)
                             ORDER BY a.ultima_vez DESC)
            FROM public.tele_aparatos a
            WHERE a.clerk_user_id = p_persona OR 'a:' || a.aparato::text = p_persona
        ), '[]'::jsonb),
        'dias', coalesce((
            SELECT jsonb_agg(jsonb_build_object('dia', d.dia, 'sesiones', d.sesiones,
                                                'segundos', d.segundos, 'miembro', d.miembro,
                                                'plataforma', d.plataforma, 'version', d.version,
                                                'reconstruido', d.reconstruido) ORDER BY d.dia DESC)
            FROM public.tele_dias d WHERE d.persona = p_persona AND d.dia >= v_desde
        ), '[]'::jsonb),
        'uso', coalesce((
            SELECT jsonb_agg(jsonb_build_object('dia', u.dia, 'funcion', u.funcion,
                                                'aperturas', u.aperturas, 'acciones', u.acciones,
                                                'segundos', u.segundos) ORDER BY u.dia DESC, u.funcion)
            FROM public.tele_uso u WHERE u.persona = p_persona AND u.dia >= v_desde
        ), '[]'::jsonb),
        'respuestas', coalesce((
            SELECT jsonb_agg(jsonb_build_object('dia', r.dia, 'donde', r.donde,
                                                'respuesta', r.respuesta) ORDER BY r.created_at DESC)
            FROM public.tele_respuestas r WHERE r.persona = p_persona
        ), '[]'::jsonb),
        'suscripcion', coalesce((
            SELECT jsonb_agg(jsonb_build_object('tipo', e.tipo, 'producto', e.producto,
                                                'tienda', e.tienda, 'pais', e.pais,
                                                'ocurrio', coalesce(e.ocurrio, e.created_at))
                             ORDER BY coalesce(e.ocurrio, e.created_at) DESC)
            FROM public.suscripcion_eventos e WHERE e.clerk_user_id = p_persona
        ), '[]'::jsonb)
    );
END $$;

REVOKE ALL ON FUNCTION public.admin_telemetria_persona(text, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_telemetria_persona(text, text, int) TO service_role;

-- ── (8) La historia: reconstruir todo lo que el servidor ya guardaba ──
-- (desde marzo de 2026, la primera cuenta). Idempotente.
SELECT public._tele_reconstruir(date '2026-03-01');
SELECT public._tele_mes_guardar(m::date)
FROM generate_series(date '2026-03-01', date_trunc('month', now())::date, interval '1 month') AS m;

-- ── (9) Borrar la cuenta también borra su medición ───────────────────
-- purge_my_account_data copiada tal cual de producción (2026-10-18) con un solo
-- bloque nuevo antes del final: las tablas de la telemetría.
CREATE OR REPLACE FUNCTION public.purge_my_account_data(p_clerk_user_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_tables text[] := ARRAY[
        -- lo que ya borraba la edge
        'scan_vibracional','sonda_progress','decoder_scans',
        'estado_tripulante_protocolos','cristales_extraccion','meditaciones_owned',
        'reading_progress','navegante_progress','email_dispatches',
        -- lo íntimo que quedaba fuera
        'bitacora_notas','rachas','dream_records','dream_scans',
        'oraculo_messages','oraculo_conversations','oraculo_usage',
        'espejo_memoria','espejo_context_prefs',
        'vision_board','vision_answers','vision_photos','vision_versions',
        'vision_sessions','matter_jobs','crop_decodes',
        -- ritual, plan de vuelo y progreso
        'daily_checkins','daily_ritual_config','ritual_personalizado',
        'ritual_user_afirmaciones_custom','ritual_user_afirmaciones_sel',
        'day_tasks','medal_unlocks','user_crystal_owned','user_crystal_state',
        'ciudad_luz_estado',
        -- comunidad e identidad pública
        'community_profiles','community_profile_interests',
        -- grupos y notas compartidas (2026-09-21)
        'bitacora_nota_members','grp_hearts',
        -- avisos, telemetría y preferencias
        'push_tokens','notif_prefs','radar_ready_notified','nav_events',
        'wallpaper_downloads','voice_transcript_usage','app_feedback',
        'gift_offers','analisis_profundo'
    ];
    v_t       text;
    v_n       int;
    v_gid     bigint;
    v_deleted json[] := '{}';
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    FOREACH v_t IN ARRAY v_tables LOOP
        BEGIN
            IF to_regclass('public.' || quote_ident(v_t)) IS NULL THEN
                CONTINUE;
            END IF;
            EXECUTE format(
                'DELETE FROM public.%I WHERE clerk_user_id = $1', v_t
            ) USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', v_t, 'n', v_n);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_deleted := v_deleted || json_build_object('t', v_t, 'err', SQLERRM);
        END;
    END LOOP;

    BEGIN
        IF to_regclass('public.dm_messages') IS NOT NULL THEN
            EXECUTE 'DELETE FROM public.dm_messages WHERE sender_clerk_id = $1'
                USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'err', SQLERRM);
    END;

    -- Grupos: sus mensajes se van, su lugar se libera y el grupo sigue con
    -- los demás (si se queda sin administrador, lo es el más antiguo; si se
    -- queda sin nadie, desaparece).
    BEGIN
        IF to_regclass('public.grp_members') IS NOT NULL THEN
            DELETE FROM public.grp_messages WHERE sender_clerk_id = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            DELETE FROM public.grp_invites
            WHERE inviter_id = p_clerk_user_id OR invitee_id = p_clerk_user_id;
            FOR v_gid IN
                SELECT group_id FROM public.grp_members WHERE clerk_user_id = p_clerk_user_id
            LOOP
                DELETE FROM public.grp_members
                WHERE group_id = v_gid AND clerk_user_id = p_clerk_user_id;
                PERFORM public._grp_fix_admins(v_gid);
            END LOOP;
            v_deleted := v_deleted || json_build_object('t', 'grupos', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'grupos', 'err', SQLERRM);
    END;

    BEGIN
        IF to_regclass('public.bitacora_nota_invites') IS NOT NULL THEN
            DELETE FROM public.bitacora_nota_invites
            WHERE inviter_id = p_clerk_user_id OR invitee_id = p_clerk_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'bitacora_nota_invites', 'err', SQLERRM);
    END;

    -- 🜂 La medición mes con mes (20261018d_telemetria): sus días, su uso, sus
    -- respuestas y su persona se van; sus aparatos y los eventos de la tienda se
    -- quedan sin cuenta (solo números, para que los totales no cambien).
    BEGIN
        IF to_regclass('public.tele_dias') IS NOT NULL THEN
            DELETE FROM public.tele_dias WHERE persona = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            DELETE FROM public.tele_uso WHERE persona = p_clerk_user_id;
            DELETE FROM public.tele_respuestas WHERE persona = p_clerk_user_id;
            DELETE FROM public.tele_personas WHERE persona = p_clerk_user_id;
            DELETE FROM public.tele_aparatos WHERE clerk_user_id = p_clerk_user_id;
            UPDATE public.suscripcion_eventos SET clerk_user_id = NULL
            WHERE clerk_user_id = p_clerk_user_id;
            v_deleted := v_deleted || json_build_object('t', 'telemetria', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'telemetria', 'err', SQLERRM);
    END;

    RETURN json_build_object('ok', true, 'total', v_total, 'detail', array_to_json(v_deleted));
END $function$;

NOTIFY pgrst, 'reload schema';
