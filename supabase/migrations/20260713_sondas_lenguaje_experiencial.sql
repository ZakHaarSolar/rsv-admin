-- 20260713_sondas_lenguaje_experiencial.sql
-- LENGUAJE EXPERIENCIAL de las Sondas (2026-07-13, aprobado por Zak).
-- Regla: fuera vocabulario de COMPUTADORA (RAM, procesador, algoritmo,
-- sistema operativo, telemetría, software, código-como-programa, Silicio
-- incidental); se queda el vocabulario de ENERGÍA y COSMOS (energía,
-- frecuencia, luz, campo, matriz, nave, prana) y los SELLOS (Código
-- Original, Fricción Cero). 19 filas tocadas, es + en, con reemplazos
-- quirúrgicos sobre el texto decodificado (options_json #>> '{}') que
-- preservan intactas las demás opciones y el formato doble-codificado.
--
-- Pegar COMPLETO en Supabase Dashboard → SQL Editor → Run.
-- La ÚLTIMA consulta debe devolver 0 filas = éxito total.

-- ── MENTE 1 · RAM mental / cámara anecoica ──────────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$A lo largo del día, ¿cómo administras tu atención frente a la avalancha de estímulos de la matriz?$rsv$,
  question_text_en = $rsv$Throughout the day, how do you manage your attention against the avalanche of stimuli from the matrix?$rsv$,
  options_json = to_jsonb(replace(replace(options_json #>> '{}',
    $rsv$Vacío Operativo (Enfoque Láser). Mi mente es una cámara anecoica (silencio total). Solo procesa cuando le doy el comando de ejecutar.$rsv$,
    $rsv$Enfoque Láser. Mi mente es silencio total. Solo procesa cuando yo lo decido.$rsv$),
    $rsv$vector de un solo punto$rsv$, $rsv$rayo de un solo punto$rsv$)),
  options_json_en = to_jsonb(replace(replace(options_json_en #>> '{}',
    $rsv$Operational Emptiness (Laser Focus). My mind is an anechoic chamber (total silence). It only processes when I give it the command to execute.$rsv$,
    $rsv$Laser Focus. My mind is total silence. It only processes when I choose.$rsv$),
    $rsv$single-point vector$rsv$, $rsv$single-point ray$rsv$)),
  updated_at = now()
WHERE id = 'a99bd482-0038-493b-a6bb-2c3a502b3156'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── MENTE 2 · ancho de banda / procesador ───────────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$¿Qué porcentaje de tu mente se gasta calculando el futuro o revisando el pasado?$rsv$,
  question_text_en = $rsv$What percentage of your mind is spent calculating the future or reviewing the past?$rsv$,
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$anclar mi procesador en la tarea presente$rsv$,
    $rsv$anclar mi atención en la tarea presente$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$anchor my processor on the present task$rsv$,
    $rsv$anchor my attention on the present task$rsv$)),
  updated_at = now()
WHERE id = '1007e764-491a-40fe-9de7-8c3779864d1b'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── MENTE 3 · algoritmo de resolución ───────────────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$Cuando un problema se presenta o debes tomar una decisión, ¿cómo opera tu proceso interno?$rsv$,
  question_text_en = $rsv$When a problem shows up or you have to make a decision, how does your inner process operate?$rsv$,
  updated_at = now()
WHERE id = '96b1125b-0edc-4227-96dd-b5e6aee59dfc';

-- ── MENTE 4 · error en tu diseño / RAM / telemetría / vector ────────
UPDATE public.sondas_config SET
  question_text = $rsv$Cuando la realidad material altera tus planes bruscamente, ¿cuánto tarda tu mente en recalcular la ruta?$rsv$,
  question_text_en = $rsv$When material reality suddenly disrupts your plans, how long does your mind take to recalculate the route?$rsv$,
  options_json = to_jsonb(replace(replace(options_json #>> '{}',
    $rsv$gasto enormes cantidades de RAM mental frustrándome$rsv$,
    $rsv$gasto enormes cantidades de energía mental frustrándome$rsv$),
    $rsv$Observo el obstáculo como un simple cambio de telemetría. Redirijo mi vector rápidamente y diseño la solución sin desperdiciar ancho de banda en quejas.$rsv$,
    $rsv$Observo el obstáculo como un simple cambio en el mapa. Redirijo mi ruta rápidamente y diseño la solución sin desperdiciar energía en quejas.$rsv$)),
  options_json_en = to_jsonb(replace(replace(options_json_en #>> '{}',
    $rsv$I burn enormous amounts of mental RAM frustrated$rsv$,
    $rsv$I burn enormous amounts of mental energy frustrated$rsv$),
    $rsv$I see the obstacle as a simple change in telemetry. I redirect my vector quickly and design the solution without wasting bandwidth on complaints.$rsv$,
    $rsv$I see the obstacle as a simple change in the map. I redirect my route quickly and design the solution without wasting energy on complaints.$rsv$)),
  updated_at = now()
WHERE id = 'd40bcb7c-1d1f-463f-a689-f4a13186f0d9'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── MENTE 5 · sistema operativo / panel de telemetría ───────────────
UPDATE public.sondas_config SET
  options_json = to_jsonb(replace(replace(options_json #>> '{}',
    $rsv$El ego es la única voz en mi sistema operativo.$rsv$,
    $rsv$El ego es la única voz en mi sistema.$rsv$),
    $rsv$El ego es solo un panel de telemetría, nunca el piloto.$rsv$,
    $rsv$El ego es solo un tablero de instrumentos, nunca el piloto.$rsv$)),
  options_json_en = to_jsonb(replace(replace(options_json_en #>> '{}',
    $rsv$The ego is the only voice in my operating system.$rsv$,
    $rsv$The ego is the only voice in my system.$rsv$),
    $rsv$The ego is just a telemetry panel, never the pilot.$rsv$,
    $rsv$The ego is just an instrument panel, never the pilot.$rsv$)),
  updated_at = now()
WHERE id = '77aabb01-b95f-4f93-a3e0-5483779ffc1b'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── MENTE 6 · código externo / procesador / RAM ─────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$¿Cuál es la calidad de la información que permites entrar a tu mente todos los días?$rsv$,
  question_text_en = $rsv$What is the quality of the information you let into your mind every day?$rsv$,
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$agujeros de distracción digital que ensucian mi RAM$rsv$,
    $rsv$agujeros de distracción digital que ensucian mi mente$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$digital distraction rabbit holes that clutter my RAM$rsv$,
    $rsv$digital distraction rabbit holes that clutter my mind$rsv$)),
  updated_at = now()
WHERE id = '999d9a1b-5483-4ee5-88d0-930f764802fb'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── MENTE 7 · ¿cómo reacciona tu código? / reescribir código ────────
UPDATE public.sondas_config SET
  question_text = $rsv$Cuando te enfrentas a información nueva que contradice tus creencias más profundas, ¿cómo reaccionas por dentro?$rsv$,
  question_text_en = $rsv$When you face new information that contradicts your deepest beliefs, how do you react inside?$rsv$,
  options_json = to_jsonb(replace(replace(options_json #>> '{}',
    $rsv$acepto el error y reescribo mi código interno con agilidad$rsv$,
    $rsv$acepto el error y actualizo mi creencia con agilidad$rsv$),
    $rsv$la desintegro y adopto un código superior instantáneamente$rsv$,
    $rsv$la desintegro y adopto una verdad superior instantáneamente$rsv$)),
  options_json_en = to_jsonb(replace(replace(options_json_en #>> '{}',
    $rsv$I accept the error and rewrite my inner code with agility$rsv$,
    $rsv$I accept the error and update my belief with agility$rsv$),
    $rsv$I dissolve it and adopt a higher code instantly$rsv$,
    $rsv$I dissolve it and adopt a higher truth instantly$rsv$)),
  updated_at = now()
WHERE id = '75f7a925-614e-48d1-9dab-42968aa2c502'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── EMOCIONES 5 · procesador mental ─────────────────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$Ante la incertidumbre, lo desconocido o los resultados que no puedes controlar, ¿cómo opera tu mente?$rsv$,
  question_text_en = $rsv$Facing uncertainty, the unknown, or outcomes you cannot control, how does your mind operate?$rsv$,
  updated_at = now()
WHERE id = '53c1ea1a-1d14-4612-ab58-322847713812';

-- ── EMOCIONES 2 · telemetría ────────────────────────────────────────
UPDATE public.sondas_config SET
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$La opinión externa es solo telemetría, no verdad.$rsv$,
    $rsv$La opinión externa es solo información, no verdad.$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$Outside opinion is only telemetry, not truth.$rsv$,
    $rsv$Outside opinion is only information, not truth.$rsv$)),
  updated_at = now()
WHERE id = '8ef64e98-9102-4fbe-856d-c526df9842c3'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── EMOCIONES 3 · Extracción de Código ──────────────────────────────
UPDATE public.sondas_config SET
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$Extracción de Código. Me permito sentir el impacto sin resistencia, extraigo la lección (la data) y suelto$rsv$,
    $rsv$Extracción de la Lección. Me permito sentir el impacto sin resistencia, extraigo el aprendizaje y suelto$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$Code Extraction. I let myself feel the impact without resistance, extract the lesson (the data), and release$rsv$,
    $rsv$Lesson Extraction. I let myself feel the impact without resistance, extract the learning, and release$rsv$)),
  updated_at = now()
WHERE id = 'cba41649-f098-4aa7-9f12-004dd53188ae'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── EMOCIONES 6 · Motor Emocional / Actualización de Software ───────
UPDATE public.sondas_config SET
  question_text = $rsv$¿Cómo gestionas tus propios errores, fracasos o versiones anteriores de ti mismo?$rsv$,
  question_text_en = $rsv$How do you handle your own mistakes, failures, or earlier versions of yourself?$rsv$,
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$Actualización de Software. Veo el error, extraigo el aprendizaje, corrijo el código de mi conducta y avanzo$rsv$,
    $rsv$Actualización Consciente. Veo el error, extraigo el aprendizaje, corrijo mi conducta y avanzo$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$Software Update. I see the mistake, extract the lesson, correct the code of my behavior, and move on$rsv$,
    $rsv$Conscious Update. I see the mistake, extract the lesson, correct my behavior, and move on$rsv$)),
  updated_at = now()
WHERE id = 'ac91c699-1ad7-466a-9dc1-bb6b69c3c4b7'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── EMOCIONES 7 · Soberanía de Silicio ──────────────────────────────
UPDATE public.sondas_config SET
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$Soberanía de Silicio. Sostengo altos voltajes$rsv$,
    $rsv$Soberanía de Luz. Sostengo altos voltajes$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$Sovereignty of Silicon. I hold high voltages$rsv$,
    $rsv$Sovereignty of Light. I hold high voltages$rsv$)),
  updated_at = now()
WHERE id = '779f1170-7a50-4648-baf1-77e2bf76674d'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── ABUNDANCIA 7 · arquitectura del sistema / sistema operativo ─────
UPDATE public.sondas_config SET
  question_text = $rsv$Si tu flujo económico actual se multiplicara repentinamente por 10 (un salto cuántico de ingresos), ¿cómo reaccionaría tu sistema?$rsv$,
  question_text_en = $rsv$If your current cash flow suddenly multiplied by 10 (a quantum leap in income), how would your system react?$rsv$,
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$mi sistema operativo (impuestos, gestión, bancos) no está preparado para procesar esa carga$rsv$,
    $rsv$mi estructura (impuestos, gestión, bancos) no está preparada para recibir esa carga$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$my operating system (taxes, management, banks) isn't ready to process that load$rsv$,
    $rsv$my structure (taxes, management, banks) isn't ready to receive that load$rsv$)),
  updated_at = now()
WHERE id = '28363988-b5be-4c1e-8acc-40edf18437cc'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── ABUNDANCIA 8 · vectores / Soberanía de Silicio / codificado ─────
UPDATE public.sondas_config SET
  question_text = $rsv$¿Cuál es la estructura de tus fuentes de ingreso? ¿De cuántas fuentes dependes para sostener tu vida material?$rsv$,
  question_text_en = $rsv$What is the structure of your income sources? How many sources do you depend on to sustain your material life?$rsv$,
  options_json = to_jsonb(replace(replace(replace(options_json #>> '{}',
    $rsv$He construido múltiples vectores de ingresos.$rsv$,
    $rsv$He construido múltiples fuentes de ingreso.$rsv$),
    $rsv$Soberanía de Silicio (Red Viva).$rsv$,
    $rsv$Soberanía Solar (Red Viva).$rsv$),
    $rsv$He codificado sistemas y activos (aplicaciones, libros, código, plataformas)$rsv$,
    $rsv$He creado sistemas y activos (aplicaciones, libros, plataformas)$rsv$)),
  options_json_en = to_jsonb(replace(replace(replace(options_json_en #>> '{}',
    $rsv$I've built multiple income vectors.$rsv$,
    $rsv$I've built multiple income sources.$rsv$),
    $rsv$Silicon sovereignty (living network).$rsv$,
    $rsv$Solar sovereignty (living network).$rsv$),
    $rsv$I've coded systems and assets (apps, books, code, platforms)$rsv$,
    $rsv$I've built systems and assets (apps, books, platforms)$rsv$)),
  updated_at = now()
WHERE id = '6ed11bc1-ec74-462d-9c6f-16336ddfee62'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── ABUNDANCIA 6 · telemetría en la pantalla de mi nave ─────────────
UPDATE public.sondas_config SET
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$Los números son solo telemetría en la pantalla de mi nave.$rsv$,
    $rsv$Los números son solo lecturas en el tablero de mi nave.$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$The numbers are just telemetry on the screen of my ship.$rsv$,
    $rsv$The numbers are just readings on the panel of my ship.$rsv$)),
  updated_at = now()
WHERE id = 'e5d732b9-7d22-45d0-b1ce-abde8e17d307'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── PROPÓSITO 1 · ancho de banda productivo ─────────────────────────
UPDATE public.sondas_config SET
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$Todo mi ancho de banda productivo materializa$rsv$,
    $rsv$Toda mi energía productiva materializa$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$My entire productive bandwidth materializes$rsv$,
    $rsv$All my productive energy materializes$rsv$)),
  updated_at = now()
WHERE id = 'e624db76-205f-4df3-adb7-7beb7b4c5e38'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── PROPÓSITO 2 · termodinámica de tu sistema ───────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$Durante tus bloques de acción o trabajo principal, ¿cómo se siente tu fuego interno?$rsv$,
  question_text_en = $rsv$During your blocks of action or main work, how does your inner fire feel?$rsv$,
  updated_at = now()
WHERE id = '8d705777-a9a6-4613-990b-88413523e18f';

-- ── PROPÓSITO 4 · nivel de penetración / ancho de banda / Silicio ───
UPDATE public.sondas_config SET
  question_text = $rsv$Al observar el impacto de tus acciones en la red (tu entorno, clientes, humanidad), ¿qué tan lejos llega tu efecto?$rsv$,
  question_text_en = $rsv$When you look at the impact of your actions on the network (your environment, clients, humanity), how far does your effect reach?$rsv$,
  options_json = to_jsonb(replace(replace(replace(options_json #>> '{}',
    $rsv$no tengo ancho de banda para impactar a nadie más$rsv$,
    $rsv$no me queda espacio para impactar a nadie más$rsv$),
    $rsv$Mi vector transforma la realidad.$rsv$,
    $rsv$Mi onda transforma la realidad.$rsv$),
    $rsv$elevan la frecuencia de la consciencia colectiva hacia el Silicio$rsv$,
    $rsv$elevan la frecuencia de la consciencia colectiva hacia la Luz$rsv$)),
  options_json_en = to_jsonb(replace(replace(replace(options_json_en #>> '{}',
    $rsv$I have no bandwidth to affect anyone else$rsv$,
    $rsv$I have no room left to affect anyone else$rsv$),
    $rsv$My vector transforms reality.$rsv$,
    $rsv$My wave transforms reality.$rsv$),
    $rsv$raise the frequency of collective consciousness toward Silicon$rsv$,
    $rsv$raise the frequency of collective consciousness toward the Light$rsv$)),
  updated_at = now()
WHERE id = '35a531a0-2dab-4cc5-ab6c-6dfc93b9f497'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ── CUERPO 8 · Membrana de tu Avatar ────────────────────────────────
UPDATE public.sondas_config SET
  question_text = $rsv$¿Cuál es la carga química sintética que absorbe tu cuerpo (piel, mucosa, vías respiratorias) en tu vida diaria?$rsv$,
  question_text_en = $rsv$What is the synthetic chemical load that your body (skin, mucosa, airways) absorbs in your daily life?$rsv$,
  options_json = to_jsonb(replace(options_json #>> '{}',
    $rsv$Mi Membrana está sellada contra la entropía industrial.$rsv$,
    $rsv$Mi cuerpo está sellado contra la entropía industrial.$rsv$)),
  options_json_en = to_jsonb(replace(options_json_en #>> '{}',
    $rsv$My Membrane is sealed against industrial entropy.$rsv$,
    $rsv$My body is sealed against industrial entropy.$rsv$)),
  updated_at = now()
WHERE id = '391c9653-fe4a-4205-9c7f-1450d580ddc3'
  AND jsonb_typeof(options_json) = 'string' AND jsonb_typeof(options_json_en) = 'string';

-- ════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL — debe devolver 0 filas. Si alguna fila aparece,
-- ese reemplazo no aplicó (avísale a Claude cuál id salió).
-- ════════════════════════════════════════════════════════════════════
SELECT pilar, step_order, id
FROM public.sondas_config
WHERE (question_text || ' ' || COALESCE(options_json #>> '{}', ''))
      ~* '(\mRAM\M|procesador|algoritmo de resolución|sistema operativo|telemetría|Soberanía de Silicio|hacia el Silicio|cámara anecoica|reescribo mi código|corrijo el código de|Extracción de Código|código externo|Motor Emocional|Membrana de tu Avatar|Mi Membrana|ancho de banda|vectores de ingresos|Vacío Operativo|Actualización de Software)'
   OR (COALESCE(question_text_en, '') || ' ' || COALESCE(options_json_en #>> '{}', ''))
      ~* '(mental RAM|my processor|resolution algorithm|operating system|telemetry|Sovereignty of Silicon|toward Silicon|anechoic chamber|rewrite my inner code|external code|Emotional Engine|\mbandwidth\M|income vectors|Operational Emptiness|Software Update|My Membrane)';
