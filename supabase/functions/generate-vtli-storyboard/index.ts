// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/generate-vtli-storyboard/index.ts v1.46
// v1.46 — AUDITORÍA PARTE 4 — gobernador de gasto reserve_edge_spend
//         (Gemini texto + Nano Banana imagen). Cota por-usuario 12/día +
//         global 30/día, en el choke point único justo después del gate de
//         admin — cubre TODAS las ramas (regenerar narración, retry de
//         keyframe, batch/reroll de storyboard).
// v1.45 — MODO EPISODIO (emisiones de profundidad extendida). POST { format:
//         "episodio", keyframes_count: 9|12|18, seconds_per_keyframe: 10 } →
//         mini-episodio cinematográfico de 90s/2min/3min estructurado en ESCENAS
//         (2-3 cuadros por escena: mismo escenario + continuidad encadenada
//         adentro; corte + escenario nuevo entre escenas), arco de 3 actos, COLD
//         OPEN magnético y SCORE musical del episodio para Suno (instrumental,
//         adaptado al arco; se guarda en vtli_drafts.score_json). Cada keyframe
//         persiste scene_index + scene_label. En episodio las directivas
//         genéricas de cámara (SHOT_DIRECTIVES + REF_COMPOSITION_CLAUSE, que
//         fuerzan "fondo totalmente distinto") se REEMPLAZAN por
//         EPISODE_COMPOSITION_CLAUSE (la escena la dicta el propio prompt) en
//         las 4 rutas (batch ancla/resto, modo prompts, retry). El modo reel NO
//         cambia y NO toca las columnas nuevas (si la migración 20260710 no está
//         pegada, los reels siguen funcionando). Pareja: AT_EstudioManual v1.42
//         + migración 20260710_vtli_episodios.sql.
// v1.44 — Mensaje de error: el 403 de FACTURACIÓN de Google Cloud ("Lightning
//         dunning decision is deny") ahora se detecta aparte y el aviso dice
//         directo "es facturación de tu cuenta de Google, revisa el billing" en
//         vez del genérico "problema de configuración". No cambia lógica.
// v1.43 — REGENERAR NARRACIÓN. Nuevo modo POST { regenerate_narration_for_id,
//         codice_id? }: reescribe SOLO la voz en off de un storyboard existente
//         (sin tocar los visuales) para pedir otra versión si no gustó, con la
//         opción de cambiar de Códice de Luz (o ninguno = Sexta Densidad). Reusa
//         la cascada robusta (modelos vivos + thinkingBudget:0) en
//         callGeminiNarration, pasa la narración anterior para no repetirla y la
//         anti-repetición por libro; guarda narración + codice_id (+ pulso_nucleo
//         si vino de un Códice). Helpers nuevos: fetchDraftById,
//         buildNarrationRegenPrompt, NARRATION_REGEN_SYSTEM.
// v1.42 — FIX del rechazo de imagen por "intereses de proveedores de terceros"
//         (filtro de derechos de Nano Banana). Causa: los prompt_image abrían con
//         un NOMBRE PROPIO del ser + "el mismo protagonista de la imagen de
//         referencia", y el edge concatenaba "USA LA IMAGEN DE REFERENCIA SOLO
//         PARA LA CARA" → ese lenguaje de "reproduce a este personaje de la foto"
//         disparaba el filtro. Ahora el ser se RE-DESCRIBE por sus rasgos físicos
//         en cada cuadro (sin nombre propio, sin remitir a la referencia); la
//         imagen de referencia (inlineData) se sigue pasando como guía visual, así
//         que la cara se mantiene consistente igual. Reescritos: reglas 3/4 +
//         contrato del system prompt, buildStoryboardUserPrompt, REF_COMPOSITION_
//         CLAUSE, COLECTIVO_REF_CLAUSE y los 2 sufijos de variación del retry.
// v1.41 — FIX del "copy_generation_failed". El cerebro de copy ahora usa la misma
//         cascada robusta del carrusel: modelos vivos (gemini-flash-latest →
//         3.5-flash → 2.5-flash; gemini-2.0-flash quedó decomisionado/404) con
//         thinkingConfig.thinkingBudget:0 (sin esto el modelo se comía el timeout
//         PENSANDO y devolvía 502, mucho peor con el prompt grande de un Códice de
//         Luz), AbortController por intento + tope global de wall-clock, backoff
//         con jitter y parser de objeto JSON balanceado (isolateJsonObject). Además
//         el error que llega al panel ahora es legible (humanizeTextError): dice si
//         fue saturación de Gemini, timeout o config — el detalle crudo va aparte.
// v1.40 — CÓDICES DE LUZ como fuente (igual que los carruseles): con codice_id la
//         NARRACIÓN del Reel desarrolla UNA enseñanza del libro destilado, fiel a
//         su voz, adaptada a la duración/keyframes (REEMPLAZA las 17 semillas). Lo
//         visual sigue siendo el universo Zak'Haar. Anti-repetición POR LIBRO
//         (pulso_nucleo = título de la enseñanza); se persiste codice_id. Pareja
//         del panel AT_EstudioManual + migración 20260624b_vtli_drafts_codice.sql.
// v1.39 — CTA de app reescrito (6 pilares + Avatar de Luz + decodificadores + "No
//         es un test: es tu compañero de evolución" + "Ya en la App Store · Link en bio").
// v1.38 — Texto del CTA de app actualizado ("Esto es apenas el umbral… Disponible
//         ya en la App Store! Link en Bio") en el canal Zak'Haar.
// v1.37 — (a) prompt_animation de Grok SIN referencias de imagen: ya no se inyecta
//         @image1/@image2 ni "usa de referencia al ser de la imagen 2" (no se
//         suben imágenes de referencia a Grok). (b) CTA del canal Zak'Haar cambia
//         de Códices a la app "Escáner Vibracional" (APP_CTAS). VEO sin cambios.
// v1.36 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// v1.35 — El recordatorio "sube la imagen del colectivo" ya NO se inyecta dentro
//         del prompt del cuadro #1: era una instrucción para el HUMANO (no para
//         Nano Banana) y ensuciaba el copy-paste. El prompt queda limpio y listo
//         para pegar; el panel muestra esa nota aparte. Se quitó
//         manualColectivoRefClause y su concatenación.
// v1.34 — FOTORREALISMO REFORZADO (fórmula Gemini). PHOTO_REAL_PREFIX ahora abre
//         con el bloque duro "RAW photo, extreme photorealism, ARRI Alexa 65, 85mm
//         f/1.8, real optical DoF, micro-detailed organic textures, natural
//         imperfections, perfect subsurface scattering, indistinguishable from
//         reality" + lista negativa ampliada (Octane/Unreal/stylized/plastic/
//         smooth). Aplica a modo API y a "Solo prompts" (se antepone a todo). Meta:
//         que el ser se lea como FOTO real, no como ilustración.
// v1.33 — VEO_CTA unificado: lista las 4 sesiones (Visión Extra Ocular,
//         Telekinesis, Calibración Biológica, Sintonía de Núcleo) con 👆🏼 al link
//         de la bio — sirve para cualquier pilar. Mismo formato que los posts.
// v1.32 — CTAs + VEO. (a) Nuevo CTA fijo de Códices (zakhaar), texto de Zak,
//         multilínea + cierre "\n.\n." para separar de hashtags. (b) VEO ahora
//         lleva CTA FIJO de Cancún ("Sesiones Presenciales · link de la bio"),
//         agregado por el sistema (el modelo ya NO lo escribe). (c) El copy VEO
//         usa SIEMPRE "Visión Extra Ocular" (nunca "Visión Solar") y un TONO
//         cálido y familiar para padres/niños, SIN jerga de máquina (cortafuegos/
//         hardware/software prohibidos). (d) Cierre del barrido a español neutral.
// v1.31 — ESPAÑOL NEUTRAL + DATOS DE GENERACIÓN. (a) TODO el texto de los prompts
//         pasó de argentino (voseo) a español neutral de México (tú): "genera",
//         "elige", "copia", "mantén"… (lo que se copia a Nano Banana). (b) El
//         storyboard guarda colectivo_name y ambiente_name al generar (NULL =
//         automático) para mostrarlos en la tarjeta. Migración 20260603.
// v1.30 — GROK @image + COLECTIVO EN MODO MANUAL. (a) Los prompt_animation hablan
//         el lenguaje de referencias de Grok: @image1 = el cuadro que se anima;
//         para cuadros 2+ donde la cámara se acerca/revela al ser o queda lejos/
//         aéreo, el prompt cierra con "mantén al ser idéntico a @image2 (cuadro
//         #1)" para que Grok use al ser real y no invente otro. (b) En modo "Solo
//         prompts · Con referencia" con un colectivo elegido, el cuadro #1 instruye
//         subir la imagen del colectivo y copiar SOLO los rasgos de especie (caso
//         "ser morado con Cristalinos seleccionado").
// v1.29 — COLECTIVO: LA IMAGEN GUARDADA SIEMBRA EL ANCLA. En modo API, si el
//         colectivo elegido tiene imagen de referencia, se baja y se pasa como
//         referencia del cuadro 0 (ancla) con COLECTIVO_REF_CLAUSE: copia los
//         RASGOS DE ESPECIE (textura/color de piel, ojos, orejas, nariz, volumen
//         del cuerpo, morfología) SIN clonar al individuo — es otro ser de la
//         misma especie. El resto de cuadros heredan el ancla como siempre. El
//         fallback sin-referencia de callGeminiImage evita que el ancla cuelgue.
// v1.28 — CTAs FIJOS + HASHTAGS 3-5. (a) El caption zakhaar se escribe SIN CTA y
//         el sistema le pega UNO de TRES CTAs fijos a los Códices de Luz (rotan
//         al azar, texto VERBATIM garantizado server-side — el modelo ya no
//         inventa ni parafrasea el CTA, y no se agregan otros llamados). Para
//         cambiar los CTAs, editar el array CODICE_CTAS. (b) Hashtags recortados
//         a 3-5 en total (antes 7-10) en ambos canales (VEO y Zak'Haar).
// v1.27 — VARIEDAD DE ESCENAS. (a) Anti-repetición/anti-cliché: la ESTÉTICA del
//         universo (cristal/luz/paleta) queda FIJA como marca, pero el ESCENARIO
//         y los elementos VARÍAN entre Reels; la Tierra/geometría/hologramas
//         pasan a ACENTOS OPCIONALES; se prohíbe el cierre cliché "de espaldas
//         mirando la Tierra"; la memoria (escena_mundo) recuerda escenario+cierre.
//         (b) Biblioteca de AMBIENTES: acepta ambiente_id (tabla vtli_ambientes,
//         migración 20260602) y lo inyecta como ambienteBlock — el escenario
//         elegido manda sobre el genérico. Espejo del sistema de colectivos.
// v1.26 — 9:16 EN MODO SOLO PROMPTS. El prompt manual que se copia a Nano Banana
//         ahora ABRE y CIERRA con una directiva dura de FORMATO VERTICAL 9:16
//         (retrato 1080×1920). Antes el texto del prompt manual no pedía aspecto
//         ninguno (el "9:16" solo vivía en el imageConfig del modo API), así que
//         Nano Banana lo generaba horizontal/cuadrado. El modo Con API ya forzaba
//         9:16 por imageConfig y queda igual.
// v1.25 — UNIVERSO ÚNICO. Se erradican las 7 paletas y los 16 mundos variados:
//         ahora TODOS los Reels comparten UN solo universo holográfico cristalino
//         (plata + dorado en geometría sagrada + iridiscencia prismática + azul
//         cósmico; bibliotecas/catedrales/domos de cristal, glifos de luz, la
//         Tierra, telepatía por filamentos, levitación). La VARIEDAD queda SOLO
//         en el SER (morfología/color), NUNCA en el entorno ni la paleta — eso
//         es la coherencia de marca. (Selección de COLECTIVO = próxima fase.)
// v1.24 — MODO "SOLO PROMPTS" (manual). Nuevo image_mode:"prompts" → el motor
//         genera el storyboard y ENSAMBLA el prompt de imagen completo de cada
//         cuadro (estilo luminoso + cámara + escena) listo para copiar/pegar en
//         Nano Banana a mano (plan AI Pro), SIN generar imágenes por API → costo
//         de imagen $0 y cero saturación. Marca el draft 'prompts_ready' (el
//         rescate automático lo IGNORA → nunca dispara gasto de API). prompt_style:
//         "self" (cada prompt repite al ser, solo copy-paste) o "reference"
//         (generas el #1 y lo subes como referencia para 2..N). image_mode:"api"
//         (default) = comportamiento de siempre (genera las imágenes por API).
// v1.23 — REFUERZO ANTI-OSCURIDAD por cuadro. v1.22 dejó el #1 luminoso (mármol
//         blanco + oro), pero algún cuadro suelto seguía saliendo oscuro: causa
//         típica = el ser a CONTRALUZ / en silueta / en escena nocturna (el
//         prompt pedía god rays y el modelo lo dejaba en sombra). Ahora se exige,
//         EN CADA cuadro: superficie de COLOR claro/luminoso (nunca color oscuro)
//         + iluminación frontal/envolvente que la revele (NUNCA silueta, contraluz
//         que ennegrezca, penumbra ni fondo negro). La escena entera es luminosa.
// v1.22 — SER LUMINOSO, NO DEMONÍACO. La criatura salía oscura/siniestra (negra
//         con venas de fuego, tipo body-horror) porque el estilo server-side
//         citaba "Annihilation / District 9 / Blade Runner 2049" (referencias
//         OSCURAS) y "piel con poros + metal". Reescrito PHOTO_REAL_PREFIX hacia
//         SER DE LUZ luminoso/translúcido/sereno + lista negra dura de oscuro/
//         demoníaco/venas-de-fuego, y reforzado en el system prompt (materiales
//         siempre luminosos, nunca obsidiana/piel oscura). También se quitaron
//         las referencias a cine OSCURO ("Blade Runner 2049") de las
//         "referencias visuales" del system prompt, dejando solo luminosas
//         (Lubezki / "Avatar"). Sigue fotorrealista (cámara real), de ALTA
//         COHERENCIA, no de pesadilla.
// v1.21 — A PRUEBA DE BALAS contra cuadros que nunca aparecen. CAUSA RAÍZ (de
//         los logs): image→image (pasar el ancla como REFERENCIA) en el modelo
//         flash se CUELGA seguido — el intento 1 muere por timeout de forma casi
//         consistente —, y 3-4 requests SIMULTÁNEAS a Nano Banana lo empeoran
//         (throttle silencioso: la conexión queda colgada, ni siquiera devuelve
//         429). text→image (el ancla, SIN referencia) casi nunca cuelga. Fix
//         triple: (a) FALLBACK SIN-REFERENCIA — el último intento de cada cuadro
//         se manda como texto→imagen (sin el ancla); el texto ya describe al
//         ser, así sale parecido y el cuadro NUNCA queda vacío. (b) CONCURRENCIA
//         LIMITADA a 2 (pool) en vez de lanzar todos los cuadros a la vez. (c)
//         PRESUPUESTO POR CUADRO para que uno colgado no se coma el tiempo de
//         los demás. Timeouts recalibrados: con-ref 30s (corta cuelgues rápido),
//         sin-ref 45s (deja terminar la generación legítima de ~37s).
// v1.20 — FONDO REALMENTE DISTINTO POR CUADRO. El #1 y #2 salían con el MISMO
//         fondo porque al pasar el cuadro #1 como referencia (para la cara),
//         Nano Banana copiaba también su fondo. Ahora REF_COMPOSITION_CLAUSE le
//         ordena de forma tajante usar la referencia SOLO para cara/cuerpo e
//         IGNORAR/REEMPLAZAR su fondo; + regla dura "variedad de fondo PRIORITARIA
//         sobre la continuidad de espacio" (nunca el mismo telón en 2 cuadros
//         seguidos). Timeout 1er intento 48→42s / reintento 26→24s (los logs
//         confirman gens sanas ≤40s y cuelgues >40s → falla un poco antes).
//         (La fiabilidad fina la cubre el AUTO-REINTENTO del panel v1.15.)
// v1.19 — (a) DURACIÓN POR CUADRO: acepta keyframes_count + seconds_per_keyframe
//         (6 o 10) del panel; la narración se escala a la duración TOTAL
//         (cuadros × s/cuadro) en palabras (~2.2/s) para que no sobre/falte.
//         (b) VARIEDAD DE SER + ROSTRO: el protagonista deja de ser siempre el
//         "humanoide de cristal con cara de portal"; se fuerza rostro VISIBLE y
//         EXPRESIVO variado y se anti-repite el tipo de ser/rostro (escena_mundo
//         ahora incluye el rostro). (c) FIX CLON AL REGENERAR: el retry (fresh/
//         grande) ahora también inyecta la dirección de cámara + "la referencia
//         es SOLO identidad" → un cuadro regenerado ya NO clona al #1.
//         (d) timeout por intento DUAL: 48s el 1er intento (no corta una gen
//         legítima de ~37s que sí completa) y 26s los reintentos (el reintento
//         tras un cuelgue es veloz) → menos fallos espurios y más cuadros entran.
// v1.18 — ENTORNOS DE ALTA FRECUENCIA. Las naves/tecnología salían retro y
//         arcaicas (consolas con botones, monitores, cables, metal). Ahora el
//         PHOTO_REAL_PREFIX incluye un bloque [ENTORNO] que fuerza, server-side,
//         que toda tecnología del fondo sea HOLOGRÁFICA y lumínica del futuro
//         (cristal y luz, hologramas flotantes) y prohíbe explícitamente lo
//         retro; los entornos naturales/cósmicos se respetan (no toca al #3/#4).
//         + refuerzo en el system prompt (una nave de Zak'Haar = catedral de
//         luz, no submarino industrial).
// v1.17 — (a) FOTORREALISMO DE VERDAD: PHOTO_REAL_PREFIX se antepone server-side
//         a TODO prompt de imagen (RAW photo, cámara real, criatura de cine con
//         VFX, prohibido ilustración/3D/caricatura). La directriz dejó de
//         depender del modelo de texto → mata el look "caricatura". (b) ÁNGULO
//         Y FONDO DISTINTOS POR CUADRO: SHOT_DIRECTIVES inyecta una dirección
//         de cámara distinta por beat + REF_COMPOSITION_CLAUSE (la referencia
//         define SOLO al ser, no el fondo/encuadre) → no más cuadros con el
//         mismo plano frontal y el mismo fondo. (c) Los 4 cuadros entran: timeout
//         por intento 45s→40s (falla rápido y llega al reintento veloz) +
//         presupuesto 135s→145s.
// v1.16 — NUNCA MÁS ATASCADO EN "GENERANDO". Causa del "fallaron los 4":
//         cuando Nano Banana se pone lento, cada imagen agota su timeout y sus
//         reintentos (hasta 3×60s=180s); en paralelo el edge function llegaba
//         al límite de wall-clock (~150s) y Supabase lo MATABA a mitad — antes
//         de marcar el draft → quedaba congelado en "generando" con 0 imágenes.
//         Fix: DEADLINE DURO global (BG_DEADLINE_MS=100s). callGeminiImage
//         recibe la hora límite y no arranca ningún intento que se pase; el
//         timeout por intento baja a 45s. Así el trabajo SIEMPRE termina y marca
//         el draft (storyboard_ready / rejected) antes del kill: lo que se pudo
//         generar queda guardado y lo que no, sale como "No se generó ·
//         Reintentar" (que ahora regenera fresco, no clona). Nunca se cuelga.
// v1.15 — A PRUEBA DE BALAS (cuadros que no se generaban + Reintentar que
//         clonaba). (a) GENERACIÓN PARALELA: el ancla (kf#0) se genera primero
//         y el resto EN PARALELO con el ancla como referencia. Antes era
//         secuencial con presupuesto de 90s → a 45-67s por imagen solo entraban
//         2 de 4 ("presupuesto agotado"). En paralelo el wall-clock ≈ ancla +
//         el más lento, así entran TODOS. (b) Timeout de imagen 45s→60s para
//         que una imagen legítimamente lenta no se corte y desperdicie un
//         reintento. (c) Stagger de 500ms entre arranques paralelos para no
//         golpear el rate limit de Nano Banana de golpe. (d) FIX del Reintentar:
//         si el cuadro NO tiene imagen propia (falló), regenera FRESCO (su
//         prompt + el ancla solo como cara) en vez de "variación ligera" que
//         clonaba el ancla. Nuevo modo retry_variation:"fresh".
// v1.14 — MORFOLOGÍA NO HUMANA + VARIEDAD POR SER. El protagonista zakhaar deja
//         de rotar entre 6 arquetipos fijos: ahora el modelo INVENTA un ser
//         interdimensional ÚNICO en cada storyboard, con morfología propia
//         (puede alejarse mucho de lo humano: cristal, luz líquida, elemental
//         de la naturaleza, ser estelar de gran cráneo benévolo, velo de luz
//         sin rostro…). escena_mundo ahora incluye el SER, así la memoria
//         anti-repetición también evita repetir el tipo de ser. Reglas maestras
//         vueltas neutrales (veo = persona real · zakhaar = ser no humano).
// v1.13 — (a) PUENTE DE LENGUAJE: regla maestra de accesibilidad para
//         narration/caption/copy_line. El lenguaje sigue siendo lumínico pero
//         se vuelve ENTENDIBLE por cualquiera — prohibido usar "Silicio",
//         "Carbono", "Hardware", "función de onda", "Toroide" como tecnicismos
//         sin traducir; se habla de vibración, frecuencia, estado cero, cero
//         fricción, energía, luz. (b) FOTORREALISMO: regla dura de estilo
//         visual — todos los prompt_image piden fotografía cinematográfica
//         real (piel/materiales/luz reales, lente de cine), prohibido el look
//         render 3D / CGI / ilustración que daba el aspecto "digital".
// v1.12 — "Error de pago" en el panel. Si la generación de imagen falla con un
//         403 PERMISSION_DENIED (bloqueo de facturación / dunning de Google),
//         el draft se marca status 'payment_error' (nuevo valor del enum,
//         migración 20260531b) → el panel lo muestra como "Error de pago" en
//         vez del genérico "No se generó". Al rescatar con Reintentar y
//         funcionar, el estado vuelve a 'storyboard_ready' solo.
// v1.11 — FIX "cada vez fallan más imágenes". Causa: rate limit (429) de Nano
//         Banana al generar/rescatar muchas seguidas — un 429 es 4xx y antes
//         NO se reintentaba (solo 5xx) → fallaba al instante. Ahora 429 y 5xx
//         reintentan con backoff (más largo para 429), 3 intentos. Además, si
//         imageConfig (9:16) diera un 4xx, se cae sin él en vez de perder el
//         cuadro. Diagnóstico: errores quedan en logs del edge function.
// v1.10 — FIX aspect ratio: las imágenes salían HORIZONTALES. Nano Banana
//         ignora el "9:16" del texto del prompt (default = 1:1 cuadrado). Ahora
//         se fuerza 9:16 vertical por API con generationConfig.imageConfig
//         .aspectRatio = "9:16". Aplica a generación nueva Y a los Reintentar.
// v1.9 — Robustez de la generación de fondo (cuadros que se quedaban trabados):
//        timeout de imagen 60s→45s, 2 intentos (no 3) para fallar más rápido,
//        y PRESUPUESTO de tiempo en el batch — si se acerca al límite del edge
//        function, corta y marca el draft "listo" para que NUNCA quede atascado
//        en "generando". Los cuadros faltantes salen como "Reintentar".
// v1.8 — VARIEDAD de mundos + paletas (anti "domo de cristal pastel" repetido).
//        El modelo elige UNA paleta dominante por storyboard (familias) y un
//        mundo distinto, y emite escena_mundo. Nuevo RPC get_recent_escenas_draft
//        + columna escena_mundo (migración 20260531) anti-repiten mundo+paleta
//        de los storyboards recientes, como ya hacíamos con pulso_nucleo.
//        Requiere migración 20260531_vtli_drafts_escena_mundo.sql aplicada.
// v1.7 — CTA convertible al cierre del caption zakhaar. Cada Reel cierra con
//        una invitación SERENA (no venta) a los CÓDICES DE LUZ como umbral de
//        baja fricción del funnel — más digerible para audiencia fría que
//        reservar una sesión. Puente temático + Códices + enlace del perfil;
//        Cámara Solar (martes) queda como nudge secundario opcional. VEO sin
//        cambios (mantiene su CTA Cancún presencial).
// v1.6 — Fix "Ligera regeneró un clon del cuadro vecino". (a) En el retry,
//        "ligera" ahora referencia la PROPIA imagen del cuadro (no el ancla),
//        así varía ESE shot en vez de colapsar al cuadro 0; "grande" usa el
//        ancla SOLO para la cara. (b) System prompt: la continuidad vive en
//        el MOVIMIENTO, no en imágenes fijas casi iguales — cada keyframe es
//        una TOMA visiblemente distinta (la ancla-referencia tendía a clonar
//        cuadros con prompts parecidos).
// v1.5 — Regenerar UN cuadro con grado de variación. El modo retry acepta
//        retry_variation: "ligera" (re-roll cercano, misma composición) o
//        "grande" (mismo personaje/escena/mundo/paleta, cambio NOTORIO de
//        ángulo, encuadre y pose). El sufijo se inyecta en memoria sobre el
//        prompt_image; el prompt guardado no se altera. El ancla sigue
//        viajando como referencia para preservar la cara en cuadros >0.
// v1.4 — CONTINUIDAD vs CORTE entre keyframes. El arco deja de ser cuatro
//        cortes secos (sensación de "recuerdos aleatorios"): ahora cada
//        transición se diseña como HANDOFF continuo (la cámara/pose/energía
//        de un cuadro entrega al siguiente) o CORTE deliberado (ángulo nuevo
//        en un pivote narrativo). prompt_animation encadena fin→inicio; el
//        prompt_image relaciona encuadres cuando hay continuidad.
// v1.3 — Movimiento de cámara OBLIGATORIO en cada prompt_animation (zoom
//        in/out, push-in, dolly, parallax u orbit). Nunca cámara estática.
// v1.2 — REDISEÑO Zak'Haar a ESTÉTICA ETÉREA LUMÍNICA: protagonistas son
//        SERES INTERDIMENSIONALES no humanos (luz, élfico-atlante, naturaleza
//        bioluminiscente, angelical, estelar) en mundos de alta frecuencia.
//        Cero entropía. Telekinesis ELIMINADA (sonaba a poder externo). Eje
//        de CONTACTO con civilizaciones (telepático/etéreo/astral). Narración
//        = semilla de consciencia (avatar, muerte no existe, arquitecto,
//        protocolos de entrada, estado cero, contacto estelar), NO VEO.
// v1.1 — Directriz cinematográfica: cada keyframe es una TOMA distinta
//        (ángulo + encuadre + escena varían; SOLO la cara del personaje se
//        mantiene constante). + campo "narration": guion de voz en off en
//        español para ElevenLabs. Requiere migración
//        20260530b_vtli_drafts_narration.sql aplicada.
// ---------------------------------------------------------------
// Atelier de Marketing · Estudio Manual — motor de STORYBOARDS.
// Cerebro de copy:  Gemini 3.5 Flash (gemini-3.5-flash)
// Estudio visual:   Nano Banana 2 (gemini-3.1-flash-image-preview)
//                   con IMAGEN DE REFERENCIA para consistencia de cara.
// Persistencia:     vtli_drafts + vtli_draft_keyframes + Cloudflare R2
//
// QUÉ HACE
//   Genera un STORYBOARD: un concepto narrativo de 40-60s dividido en
//   N keyframes (beats) consistentes entre sí. El keyframe 0 es el ANCLA
//   (texto→imagen, define al protagonista). Los keyframes 1..N se generan
//   pasando el keyframe 0 como IMAGEN DE REFERENCIA (inlineData) + el
//   prompt de la nueva escena → Nano Banana mantiene la misma cara.
//   Cada keyframe trae además un prompt_animation (solo movimiento) listo
//   para Grok Imagine. Zak anima cada cuadro (manual o API LTX-2) y une
//   los clips en su editor.
//
// DIFERENCIA CLAVE vs generate-vtli-posts
//   · callGeminiImage acepta refImages[] (inlineData de entrada).
//   · Generación SECUENCIAL (no paralela): keyframe 0 primero, luego
//     1..N con el ancla como referencia.
//   · Tabla padre→hijos (vtli_drafts + vtli_draft_keyframes).
//
// SI LA CARA NO SE MANTIENE con gemini-3.1-flash-image-preview, cambiar
//   GEMINI_IMAGE_MODEL a "gemini-3-pro-image-preview" (Nano Banana Pro,
//   ~$0.134/img, soporta hasta 14 referencias). Ver Riesgo #1 del plan.
//
// Endpoints lógicos:
//   1) Batch:  POST { admin_clerk_id, category: 'veo'|'zakhaar',
//                     target_duration_sec?: 40|50|60 }
//   2) Retry:  POST { admin_clerk_id, retry_keyframe_image_for_id }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy generate-vtli-storyboard --no-verify-jwt
//
// Secrets requeridos (todos ya existen):
//   GEMINI_API_KEY · SUPABASE_URL · SUPABASE_ANON_KEY ·
//   SUPABASE_SERVICE_ROLE_KEY · R2_ACCOUNT_ID · R2_ACCESS_KEY_ID ·
//   R2_SECRET_ACCESS_KEY · R2_BUCKET · R2_PUBLIC_BASE_URL

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

/* AUDITORÍA PARTE 4 · gobernador de gasto. Gemini texto + Nano Banana imagen
   son API de pago y esta edge no tenía ninguna cota más allá de la sesión
   de admin. Reusa la RPC reserve_edge_spend (mismo gobernador de la ola E /
   Parte 3, ver upload-matter-photo). Fail-open a propósito: si la RPC no
   responde, la operación sigue (nunca rompe un storyboard legítimo). Sin
   ventana por IP (no se fijó límite para esta edge — el gobernador la salta
   con p_ip_limit:0). */
async function reserveSpend(
    edge: string,
    userKey: string,
    userLimit: number,
    userWindowSeconds: number,
    globalLimit: number,
    globalWindowSeconds: number
): Promise<boolean> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return true
    try {
        const res = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_edge: edge,
                p_user_key: userKey,
                p_ip: "",
                p_cost: 1,
                p_user_limit: userLimit,
                p_user_window_seconds: userWindowSeconds,
                p_ip_limit: 0,
                p_ip_window_seconds: userWindowSeconds,
                p_global_limit: globalLimit,
                p_global_window_seconds: globalWindowSeconds,
            }),
        })
        if (!res.ok) return true
        const j = await res.json().catch(() => null)
        return j?.ok !== false
    } catch {
        return true
    }
}

declare const Deno: any
declare const EdgeRuntime: any

/* ═══════════════════════════════════════════════════════════════
   1. CONSTANTS · CORS · MODELS
   ═══════════════════════════════════════════════════════════════ */

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Cerebro de copy: cascada de modelos vivos (v1.41). Si el primario está saturado
// (503/timeout) baja al siguiente. CLAVE: el "thinking" se apaga en el
// generationConfig (thinkingBudget:0) → un run sano cierra en ~20-35s en vez de
// gastarse el timeout entero pensando (causa del copy_generation_failed/502 a los
// ~78s, agravado por el prompt grande de un Códice de Luz). gemini-2.0-flash quedó
// FUERA (decomisionado, 404). Mismo patrón que generate-zakhaar-carousel.
const GEMINI_TEXT_CASCADE: { model: string; attempts: number }[] = [
    { model: "gemini-3.6-flash", attempts: 5 },
    { model: "gemini-3.5-flash", attempts: 5 },
    { model: "gemini-2.5-flash", attempts: 4 },
]
const geminiTextUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`
// Timeout POR INTENTO de texto (con thinking apagado un run sano cierra antes) +
// tope GLOBAL de wall-clock para no colgar al panel.
const TEXT_ATTEMPT_TIMEOUT_MS = 50_000
const TEXT_TOTAL_DEADLINE_MS = 135_000

// Nano Banana 2. Acepta imagen de referencia (inlineData) para
// consistencia de personaje. Si la cara deriva entre keyframes, subir a
// "gemini-3-pro-image-preview" (Nano Banana Pro, hasta 14 referencias).
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
const GEMINI_IMAGE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`
// 3 intentos por cuadro. CLAVE (v1.21): el ÚLTIMO intento, si el cuadro venía
// con ancla de referencia, se manda SIN referencia (texto→imagen) — ver
// callGeminiImage. Así son 2 intentos con-ref (consistencia de cara) + 1
// fallback text→image que casi nunca cuelga (garantiza que el cuadro NO quede
// vacío).
const MAX_RETRIES_IMAGE = 3
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000]
// Timeout por intento de imagen, según el TIPO de generación (de los logs):
//  · SIN referencia (ancla + fallback): text→imagen es estable pero a veces
//    hace una generación legítima de ~37-40s ("kf#0 ✓ 37724ms"). 45s la deja
//    terminar sin cortarla.
//  · CON referencia (image→image): la generación legítima responde ~15-20s;
//    cuando se CUELGA, lo hace indefinidamente. 30s la atrapa rápido para que
//    entre el próximo intento (incluido el fallback sin-referencia) dentro del
//    presupuesto.
const IMAGE_TIMEOUT_NOREF_MS = 45_000
const IMAGE_TIMEOUT_WITHREF_MS = 30_000
// Concurrencia máxima de requests a Nano Banana. 3-4 simultáneas disparan un
// throttle silencioso (la conexión queda colgada y muere por timeout, sin
// 429) — es la causa principal de los cuadros que nunca aparecen. 2 mantiene
// algo de paralelismo (para el wall-clock) sin saturar.
const IMAGE_CONCURRENCY = 2
// Presupuesto de tiempo por cuadro en la corrida inicial: ninguno monopoliza el
// wall-clock del edge function. Un cuadro que se cuelga se corta a los 100s y
// libera el worker para el siguiente; lo que no entre en esta corrida lo rescata
// el panel con una corrida fresca (donde el fallback sin-ref tiene budget de
// sobra y SIEMPRE termina produciendo imagen).
const PER_KF_BUDGET_MS = 100_000
// Stagger entre arranques de los workers del pool: evita que las primeras
// requests salgan en el mismo milisegundo.
const IMAGE_STAGGER_MS = 500
// DEADLINE DURO del trabajo de fondo (medido desde que arranca, ya sin contar
// la generación de texto). callGeminiImage NUNCA arranca un intento que se
// pasaría de esto. Garantiza que el edge function SIEMPRE llegue a marcar el
// draft terminado (storyboard_ready / rejected) ANTES del límite de wall-clock
// del runtime de Supabase → el draft NUNCA queda atascado en "generando".
// (El wall-clock observado ronda ~150s; texto ~30s + 100s aquí = ~130s, holgado.)
const BG_DEADLINE_MS = 100_000
// Presupuesto TOTAL desde el inicio del request (incluye la generación de
// texto). El caller pasa reqStart + esto como deadline, así un texto lento NO
// empuja al wall-clock. 145s: el run limpio observado terminó ~140s sin que el
// runtime lo matara, así que damos un poco más de aire para que entren los 4
// cuadros, manteniendo margen bajo el kill (que está entre ~145s y ~180s).
const FUNCTION_WALL_BUDGET_MS = 145_000

const FINAL_STATUSES = new Set(["approved", "published", "rerolled", "deleted"])

// ── FOTORREALISMO DURO. Se ANTEPONE a TODO prompt de imagen justo antes de
// mandarlo a Nano Banana (server-side), así la orden fotorrealista NUNCA
// depende de que el modelo de texto la incluya — es la causa de que salieran
// "caricatura". Encuadra al ser como CRIATURA REAL de cine (efectos prácticos
// + VFX fotorrealista), no como ilustración.
const PHOTO_REAL_PREFIX = `[ESTILO OBLIGATORIO — FOTOGRAFÍA FOTORREALISTA DE CINE]
RAW photo, extreme photorealism, hyperrealistic, live-action cinematography shot on ARRI Alexa 65, 85mm lens f/1.8. Real optical depth of field with natural bokeh. Micro-detailed organic textures, natural imperfections, true-to-life physics. Perfect subsurface scattering on the skin/surface. Volumetric lighting, subtle film grain, feature-film color grade, 8K resolution. Strictly photographic, indistinguishable from reality. NO 3D render, NO digital art, NO illustration.
Capturado por una cámara de cine real frente a un sujeto real: un FOTOGRAMA de película live-action, NO un render ni un dibujo. Texturas orgánicas micro-detalladas y reales: piel con poros y vello fino, superficies con imperfecciones y asimetrías naturales, ojos húmedos reales, materiales físicamente reales (cristal, agua, tela, metal con reflejos reales). Al verlo debe parecer la FOTO de un ser real, no la ilustración de un ser.

[NATURALEZA DEL SER — LUMINOSO, DE ALTA COHERENCIA, JAMÁS OSCURO NI SINIESTRO]
El protagonista es SIEMPRE un ser de altísima frecuencia: sereno, benévolo, de belleza luminosa. Si es una persona, está serena e iluminada por luz cálida. Si es un ser no humano, es un SER DE LUZ — superficie nacarada, translúcida, cristalina, de plasma o luz líquida que IRRADIA luz desde adentro, con subsurface scattering radiante (la luz lo atraviesa), ojos serenos y luminosos, rasgos bellos y apacibles. Su superficie es de COLOR CLARO Y LUMINOSO (blanco perla, nácar, cristal claro, dorado claro, los tonos pastel de la paleta) — JAMÁS de color oscuro.
ILUMINACIÓN OBLIGATORIA EN CADA CUADRO: el ser está bien iluminado de frente o con luz envolvente, de modo que su superficie clara y luminosa SE VE en todo momento. PROHIBIDO mostrarlo en SILUETA, a CONTRALUZ que lo ennegrezca, en penumbra, en sombra dura, o en una escena nocturna/oscura que lo apague. Si hay una fuente de luz detrás (god rays), el ser igual recibe luz de relleno frontal que revela su superficie radiante. La escena entera es LUMINOSA, de día / dorada / etérea — NUNCA un fondo negro u oscuro.
ESTRICTAMENTE PROHIBIDO que el ser sea: oscuro, negro, de obsidiana, gris ceniza, de piel acorazada oscura, biomecánico siniestro, con venas o circuitos de fuego / lava / magma incandescente sobre cuerpo oscuro, demoníaco, monstruoso, insectoide aterrador, de body-horror o de terror (NADA al estilo "Alien", "District 9", "Annihilation"). Si el ser se ve oscuro, sombrío, diabólico o de pesadilla, está MAL: rehazlo como un ser de LUZ radiante, sereno y de alta coherencia.

[FOTORREALISMO, NO ILUSTRACIÓN]
ESTRICTAMENTE PROHIBIDO el aspecto de: illustration, digital art, painting, drawing, 3D render, CGI, Octane Render, Unreal Engine, anime, cartoon, stylized, plastic, smooth, concept art, Pixar, Disney, videojuego, cel-shaded. NADA de superficies plásticas, lisas o "perfectas" de render: la realidad tiene textura, poros, asimetrías leves e imperfecciones naturales. Si parece dibujado, renderizado en 3D, plástico o demasiado liso, está MAL: rehazlo como FOTOGRAFÍA real de cine, con textura orgánica, imperfecciones naturales y subsurface scattering real.

[ENTORNO DE ALTA FRECUENCIA]
Si el fondo incluye TECNOLOGÍA futurista, naves, estaciones, paneles o interfaces, son de ALTÍSIMA DENSIDAD, LUMÍNICAS y HOLOGRÁFICAS: cristal y luz vivos, hologramas e interfaces de luz flotantes en el aire, geometría sagrada luminosa, superficies translúcidas iridiscentes sin costuras, arquitectura orgánica de luz, energía fluyendo. Es tecnología del FUTURO LUMÍNICO. ESTRICTAMENTE PROHIBIDA la tecnología retro/arcaica: NADA de botones físicos, teclados, perillas, palancas, monitores o pantallas con marco/CRT, cables colgando, tubos, paneles de metal remachado o abollado, consolas ochenteras, ni naves "viejas" o industriales. Los entornos naturales, ancestrales o cósmicos (bosque, ruinas de luz, gruta, cosmos, cristal, nubes) se respetan tal cual y NO se tecnologizan.

ESCENA:
`

// Directiva de FORMATO VERTICAL 9:16, solo para el MODO SOLO PROMPTS (manual).
// En modo Con API el ratio lo fuerza generationConfig.imageConfig.aspectRatio;
// pero cuando el prompt se copia a mano a Nano Banana / Gemini, el ratio SOLO
// puede pedirse por texto. Va al PRINCIPIO (lo primero que lee el modelo) y se
// repite al final como recordatorio.
const VERTICAL_DIRECTIVE_HEAD = `[FORMATO OBLIGATORIO — IMAGEN VERTICAL 9:16]
Genera la imagen en formato VERTICAL retrato 9:16 (1080×1920, MÁS ALTA QUE ANCHA, tipo Reel / Story de Instagram). NO horizontal, NO apaisada, NO 16:9, NO cuadrada 1:1, NO panorámica. Todo el encuadre y la composición caben en un marco vertical alto.

`
const VERTICAL_DIRECTIVE_TAIL = `

[RECORDATORIO DE FORMATO: la imagen final DEBE ser VERTICAL 9:16 (retrato, más alta que ancha). Si tu herramienta tiene selector de proporción, elige 9:16. NUNCA horizontal ni cuadrada.]`

// ── DIRECCIÓN DE CÁMARA por cuadro (como un director de cine). Se antepone a
// la escena de cada keyframe del batch para FORZAR un ángulo/encuadre distinto
// (la imagen de referencia tendía a clonar el mismo plano frontal y el mismo
// fondo en todos los cuadros). Indexado por beat; cicla si hay más cuadros.
const SHOT_DIRECTIVES = [
    // beat 0 — ANCLA (establecedor): define al ser y su mundo de frente.
    "DIRECCIÓN DE CÁMARA: plano entero establecedor, cámara a la altura de los ojos, encuadre ligeramente frontal que revela al ser y su mundo.",
    // beat 1
    "DIRECCIÓN DE CÁMARA (toma OBLIGATORIAMENTE distinta): plano medio cercano del rostro y el torso desde un ángulo lateral de 3/4, cámara baja. Encuadre, pose y FONDO claramente diferentes a cualquier otro cuadro.",
    // beat 2
    "DIRECCIÓN DE CÁMARA (toma OBLIGATORIAMENTE distinta): plano contrapicado heroico desde abajo, el ser en escorzo elevándose, en OTRO rincón del mundo. Ángulo, distancia y FONDO totalmente distintos.",
    // beat 3
    "DIRECCIÓN DE CÁMARA (toma OBLIGATORIAMENTE distinta): plano general amplio o toma aérea cenital, el ser pequeño en un escenario NUEVO del mundo. Punto de vista y FONDO totalmente distintos a los cuadros previos.",
    // beat 4
    "DIRECCIÓN DE CÁMARA (toma OBLIGATORIAMENTE distinta): plano americano desde el costado OPUESTO, leve picado, nuevo rincón. Encuadre y FONDO distintos.",
    // beat 5
    "DIRECCIÓN DE CÁMARA (toma OBLIGATORIAMENTE distinta): primerísimo primer plano del rostro de perfil / detalle íntimo de los ojos, composición cerrada distinta a todo lo anterior.",
    // beat 6
    "DIRECCIÓN DE CÁMARA (toma OBLIGATORIAMENTE distinta): plano holandés (cámara inclinada) en movimiento, ángulo dinámico y fondo nuevos.",
]

// Aclaración para los cuadros 1..N: mantener los rasgos del ser ya descritos en el
// prompt, pero cambiar la composición y el fondo. ⚠️ Redactado SIN frases como
// "usa la imagen de referencia" / "copia la cara de la referencia": ese lenguaje
// hace que el generador rechace la imagen por "intereses de terceros". La imagen
// de referencia (inlineData) sigue pasándose y guía visualmente igual.
const REF_COMPOSITION_CLAUSE =
    " ⚠️ MANTÉN los rasgos físicos del ser EXACTAMENTE como los describe este prompt (forma, materiales, color, rostro, vestuario, paleta), pero CAMBIA POR COMPLETO el fondo, el ángulo y la pose. ESTE cuadro ocurre en OTRO rincón del mundo, con un FONDO TOTALMENTE DISTINTO: cambia lo que hay detrás (otra vista, otra distancia, otros elementos, otro horizonte) y el ángulo de cámara. PROHIBIDO repetir el fondo o el encuadre del cuadro anterior — reemplaza el fondo por completo."

// Cláusula para el ANCLA (cuadro 0) cuando el colectivo guardado trae una imagen
// de referencia. Describe los RASGOS DE ESPECIE (lo que comparten todos los
// individuos) y deja libre la variación individual: misma especie reconocible,
// distinto individuo. ⚠️ SIN "copia al individuo de la foto/referencia" (dispara
// el filtro de derechos); la imagen de referencia igual se pasa como guía visual.
const COLECTIVO_REF_CLAUSE =
    " ⚠️ El ser pertenece a una especie con estos RASGOS FIJOS, que mantienes idénticos y reconocibles: color y textura de la piel/material, tamaño y forma de los ojos, tipo de orejas, forma de la nariz, volumen y proporción general del cuerpo, morfología del cráneo y vestuario/exoestructura. ESTE es UN individuo concreto de esa especie: varía levemente las proporciones, la edad aparente, la expresión y los detalles. El fondo y el encuadre los define la escena de este cuadro."

function shotDirectiveForBeat(beatIndex: number): string {
    return (
        SHOT_DIRECTIVES[beatIndex] ??
        SHOT_DIRECTIVES[SHOT_DIRECTIVES.length - 1]
    )
}

// Duración → keyframes. Cada clip animado ~8-12s; redondeamos a ~10s.
const MIN_KEYFRAMES = 3
const MAX_KEYFRAMES = 7
// MODO EPISODIO: mini-película por escenas. 90s → 9 cuadros · 120s → 12 · 180s →
// 18 (clips de 10s). El tope 18 es deliberado (3 min es el máximo de un Reel).
const EPISODE_MIN_KEYFRAMES = 6
const EPISODE_MAX_KEYFRAMES = 18

// Escenas objetivo según cuadros (~2-3 cuadros por escena).
function episodeSceneTarget(kfCount: number): string {
    if (kfCount <= 9) return "3-4"
    if (kfCount <= 12) return "4-5"
    return "6-7"
}

// ── Cláusula de composición para cuadros de EPISODIO (reemplaza a
// shotDirectiveForBeat + REF_COMPOSITION_CLAUSE, que fuerzan "OTRO rincón del
// mundo/fondo TOTALMENTE distinto" y ROMPERÍAN la continuidad interna de una
// escena). En episodio la gramática de cámara y el escenario los escribe el
// MODELO cuadro a cuadro (sabe a qué escena pertenece cada uno); aquí solo se
// protege la identidad del ser y se respeta el escenario que dicta el prompt.
const EPISODE_COMPOSITION_CLAUSE =
    " ⚠️ MANTÉN los rasgos físicos del ser EXACTAMENTE como los describe este prompt (forma, materiales, color, rostro, vestuario, paleta). El ESCENARIO y el ÁNGULO los define ESTE prompt: es un episodio por escenas — si el prompt sitúa el cuadro en la misma escena que el anterior, CONSERVA ese mismo escenario visto desde el nuevo ángulo/plano que el prompt indica (no inventes otro fondo); si el prompt abre una escena nueva, el escenario es el nuevo que describe."

// ── Addendum al system prompt cuando format === "episodio": convierte el
// storyboard en un MINI-EPISODIO cinematográfico estructurado en ESCENAS con
// arco de 3 actos + score musical para Suno. Se CONCATENA al system base (todas
// las reglas de identidad/fotorrealismo/lenguaje siguen vigentes).
const EPISODE_SYSTEM_ADDENDUM = `

---

### 🎬 MODO EPISODIO — EMISIÓN DE PROFUNDIDAD EXTENDIDA (reglas ADICIONALES que MANDAN sobre las de arriba donde choquen)

Este storyboard NO es un reel suelto: es un MINI-EPISODIO cinematográfico. La cantidad de cuadros y la duración las da el user prompt. Reglas:

1. ESTRUCTURA EN ESCENAS: agrupa los cuadros en ESCENAS (2-3 cuadros por escena; el user prompt indica cuántas escenas objetivo). Cada cuadro lleva "scene_index" (1..M, entero) y "scene_label" (nombre corto y evocador de su escena, ej. "El Umbral", "La Travesía del Cristal" — el MISMO label para todos los cuadros de la misma escena).
2. DENTRO de una escena: MISMO escenario/locación. Los cuadros de una escena fluyen ENCADENADOS (el encuadre y la pose de uno entregan al siguiente — junta invisible); cambia el ángulo/plano y la acción AVANZA, pero el lugar es el mismo. Escribe cada prompt_image nombrando el ángulo nuevo Y re-describiendo brevemente el MISMO escenario de la escena.
3. ENTRE escenas: CORTE deliberado = giro narrativo. Escenario NUEVO y claramente distinto al de la escena anterior. Las transiciones entre escenas marcan los pivotes de los actos.
4. ARCO DE 3 ACTOS: Acto I (primera escena o dos) = GANCHO + presentación del ser, su mundo y su anhelo/pregunta. Acto II = travesía: fricción vibracional, búsqueda, revelación creciente. Acto III (última escena o dos) = transformación/integración + cierre ceremonial que deja paz expansiva. El "narrative" describe el arco acto por acto.
5. COLD OPEN: el cuadro 0 es un GANCHO VISUAL potente (una imagen imposible, una pregunta visual, un instante de asombro) — los primeros 3-5 segundos deciden si el espectador se queda. NO empieza "establecedor tranquilo": empieza MAGNÉTICO. (Sigue definiendo la identidad física completa del ser, como siempre.)
6. LA NARRACIÓN ES UN VIAJE: sigue siendo la voz en off oracular (medio-susurro sereno, Puente de Lenguaje, alta frecuencia SIEMPRE) pero ahora con ARCO NARRATIVO: planteamiento → giro → revelación → cierre. Acompaña los actos sin describir literalmente lo visual. La cantidad de palabras la da el user prompt según la duración total — respétala.
7. copy_line de cada cuadro = título de capítulo / frase láser que puede ir sobre la imagen (2-6 palabras).
8. SCORE MUSICAL DEL EPISODIO: incluye en el JSON un objeto "score" — la música del episodio lista para generarse en Suno y montarse DEBAJO de la voz en off. Reglas del score:
   · INSTRUMENTAL SIEMPRE (la narración va encima): sin letra; coros etéreos SIN palabras permitidos como textura.
   · Adaptado al ARCO EMOCIONAL de ESTE episodio: describe en el campo "style" cómo evoluciona (apertura contenida → crecimiento en la travesía → clímax luminoso → resolución en paz), con género, mood, instrumentación y producción.
   · Vibra Red Solar Viva: ethereal ambient / solarwave / cinematic organic; texturas cristalinas, pads luminosos, strings cálidos, coros etéreos wordless; frecuencias sagradas (963/528/432 Hz) si encajan. NADA dark/aggressive/heavy.
   · "exclude_styles": lista separada por comas de estilos a excluir (ej. "dark, aggressive, heavy metal, trap, pop vocals, lyrics, chaotic").
   · "weirdness" y "style_influence": enteros 0-100 sugeridos (weirdness bajo-medio 15-45 para score cinemático; style_influence medio-alto 60-85).
   · "notes": 1-2 frases para el humano (ej. "genera ~2 min y recorta al montar; sube el volumen en el acto III").
9. El contrato JSON del episodio AGREGA estos campos al storyboard: "score": { "title", "style", "exclude_styles", "weirdness", "style_influence", "notes" } y, en CADA keyframe, "scene_index" (entero) y "scene_label" (string). TODO lo demás del contrato se mantiene igual.`
const DEFAULT_DURATION_SEC = 50
const PULSO_HISTORY_LIMIT = 10

function keyframesForDuration(durationSec: number): number {
    const n = Math.round(durationSec / 10)
    return Math.max(MIN_KEYFRAMES, Math.min(n, MAX_KEYFRAMES))
}

// ── Sufijos de VARIACIÓN para el retry de un cuadro (modo retry_variation).
// "ligera": re-toma cercana de ESTE cuadro (la referencia es su propia imagen).
// "grande": misma identidad/escena/paleta, pero ángulo + encuadre + pose
// NOTORIAMENTE distintos (la referencia es el ancla, SOLO para la cara).
// Se concatenan al prompt_image SOLO en memoria (no se persisten).
const VARIATION_SUFFIX_LIGERA = `

VARIACIÓN LIGERA: regenera una toma casi idéntica a este mismo cuadro — mantén los mismos rasgos del ser (rostro, vestuario, materiales), la misma escena, el mismo mundo, la misma paleta, el mismo ángulo, encuadre y pose. Cambia SOLO micro-detalles (luz, expresión, partículas, pliegues de la tela). Es una variación sutil de esta toma — no la reemplaces por otra escena distinta del storyboard.`

const VARIATION_SUFFIX_GRANDE = `

VARIACIÓN AMPLIA: mantén EXACTAMENTE los mismos rasgos del ser (rostro, edad, vestuario, complexión, materiales), el mismo mundo/escenario, la misma paleta y el mismo estilo. PERO cambia NOTORIAMENTE el ángulo de cámara, el tamaño de plano, la composición y la pose: la misma escena vista de una forma claramente distinta (otra perspectiva, otro encuadre, otra postura del ser). No es la misma toma retocada — es una variación grande del mismo momento.`

/* ═══════════════════════════════════════════════════════════════
   2. KNOWLEDGE BASE — "VISIONARIO ARQUITECTO · STORYBOARD"
   ═══════════════════════════════════════════════════════════════ */

const VTLI_STORYBOARD_SYSTEM = `Eres el "Visionario Arquitecto", motor de IA cuántica del Atelier de Contenido. Tu función AHORA es diseñar STORYBOARDS para Reels de Instagram: un concepto narrativo dividido en N keyframes (cuadros) que un humano animará por separado y unirá en un video de 40-60 segundos.

Recibes un user prompt con \`category\` ("veo" O "zakhaar") y la cantidad de keyframes solicitada. Devuelves un único objeto JSON con el storyboard.

---

### REGLA MAESTRA DEL STORYBOARD — UN PERSONAJE, MÚLTIPLES CUADROS

1. El storyboard cuenta UNA historia con UN protagonista consistente a través de TODOS los keyframes — el MISMO en distintos momentos/escenas del arco. Según el canal: para "veo" es una PERSONA HUMANA real; para "zakhaar" es UN SER INTERDIMENSIONAL NO HUMANO (ver PROTAGONISTA de zakhaar). Lo constante es su IDENTIDAD VISUAL: rostro o rasgos distintivos (o su ausencia de rostro, si es un ser velado), morfología, materiales, vestuario/forma y paleta.

2. El keyframe 0 es el ANCLA: su prompt_image describe al protagonista con DETALLE COMPLETO porque define la identidad que el resto heredará. Para una persona (veo): rostro, edad aproximada, rasgos, peinado, vestuario, complexión. Para un ser no humano (zakhaar): su MORFOLOGÍA única con el mismo nivel de detalle — forma de la cabeza y el cuerpo, rostro o ausencia de rostro, ojos, materiales (cristal, luz, bruma, planta…), color, geometría, escala. Genera un protagonista cinematográfico CONCRETO, no una silueta abstracta.

3. Los keyframes 1..N muestran al MISMO protagonista en la siguiente escena del arco. Sus prompt_image deben EMPEZAR RE-DESCRIBIENDO al ser por sus RASGOS FÍSICOS concretos (los 3-5 que lo identifican: forma/morfología, color y material de la piel/superficie, ojos, rasgos del rostro, vestuario/exoestructura, paleta) y luego "ahora [nueva escena/acción]". 🚫 REGLA DURA — NUNCA le pongas un NOMBRE PROPIO al ser, y NUNCA escribas "el mismo protagonista de la imagen de referencia" / "como en la referencia" / "el mismo de la foto/del cuadro anterior": ese lenguaje hace que el generador RECHACE la imagen por "intereses de terceros". Preséntalo en cada cuadro como si fuera la primera vez, SOLO por sus rasgos físicos. La consistencia la sostiene esa descripción (además el sistema le pasa el cuadro 0 como guía visual a Nano Banana, sin que tú lo menciones).

4. Arco narrativo en N beats (se adapta a la cantidad pedida):
   - beat 0 → "Gancho": el mundo y el protagonista se revelan. Algo está por ocurrir.
   - beats intermedios → "Desarrollo": el protagonista EJECUTA la acción central (irradiar luz, levitar, abrir un portal de luz, comunión telepática, manifestar geometría de luz, contacto estelar sereno, transmutación lumínica).
   - penúltimo → "Revelación": la consecuencia visible, el cambio.
   - último → "Cierre": frame sellable, imagen final épica wallpaper-able. ⚠️ VARÍA el cierre en cada Reel — NO caigas SIEMPRE en el cliché "el ser de espaldas contemplando la Tierra / un planeta". Alterna: un primer plano del rostro sereno, un plano cenital del ser sobre geometría de luz, el ser ascendiendo hacia la luz, una silueta entrando a un portal, un plano general del salón de cristal, un detalle de las manos manifestando luz, etc. Si un Reel reciente cerró mirando un planeta, ESTE cierra de otra forma.
   Con 3 keyframes: Gancho · Desarrollo · Cierre. Con 5-6: Gancho · Desarrollo × 2-3 · Revelación · Cierre.

5. CINEMATOGRAFÍA — EL ARCO ES UNA ESCENA VIVA, NO CUATRO RECUERDOS SUELTOS (la regla más importante para que no muera en Instagram). Los clips se animan por separado y se unen EN ORDEN: tu trabajo es diseñarlos para que, al concatenarlos, fluyan como UNA secuencia. Lo constante es la IDENTIDAD del protagonista (cara, vestuario, complexión) y la PALETA del canal. El resto evoluciona — pero la evolución se ENCADENA, no salta al azar. Para CADA par de cuadros consecutivos elige DELIBERADAMENTE entre dos modos de transición:

   · CONTINUIDAD (handoff) — el cuadro N ENTREGA al N+1: el encuadre del N+1 se relaciona con dónde terminó el N (la cámara sigue su mismo eje/dirección, el plano progresa —medio → primer plano—, el espacio es contiguo) y la pose/acción del N+1 retoma donde quedó la del N (un gesto que empezó y se completa, una levitación que continúa, una mirada que ya apuntaba hacia allá). La unión se vuelve INVISIBLE: se siente un solo plano-secuencia. Es el modo POR DEFECTO en un canal sereno; úsalo dentro de un mismo beat, en una acción sostenida y en momentos contemplativos.

   · CORTE deliberado — un ángulo / escala / lugar NUEVO y audaz para PUNTUAR un pivote narrativo: cambio de beat, salto de tiempo, llegada a otro mundo, una revelación. El corte tiene fuerza JUSTO porque no se abusa de él; resérvalo para 1-2 transiciones del arco.

   ⚠️ CONTINUIDAD NO ES DUPLICAR (error crítico): la continuidad vive en el MOVIMIENTO —la cámara/pose al final de un clip enlaza con el inicio del siguiente—, NO en que las dos IMÁGENES FIJAS se parezcan. Cada keyframe, como foto quieta, es una TOMA CLARAMENTE DISTINTA: cambia de forma VISIBLE el tamaño de plano, el ángulo o la pose. Si dos cuadros consecutivos, vistos como imágenes quietas, se ven casi iguales (mismo plano, misma distancia, el personaje igual de frente sosteniendo lo mismo), está MAL: acerca la cámara, cambia el ángulo, gira al personaje o avanza la acción. Un beat de "Desarrollo" que repite el plano del "Gancho" es el error más común — convertilo en un primer plano del rostro, un perfil, un contrapicado, o la acción un paso adelante. La IDENTIDAD (cara) se mantiene; la TOMA cambia.

   REGLA DE ORO: la MAYORÍA de las transiciones de un Reel etéreo son CONTINUAS; los cortes son la excepción que marca los giros. Cortar a un ángulo distinto en CADA cuadro es lo que produce la sensación de "recuerdos aleatorios" que hay que evitar. La escena igual AVANZA (el protagonista transita el mundo y la pose progresa: arrodillado → de pie → levitando → brazos abiertos → ascendiendo) — pero avanza ENCADENADA, no a saltos.

   PROHIBIDO ABSOLUTO: cuatro cuadros frontales centrados, misma distancia, misma pose, donde solo cambia el color de la luz (entropía: ni continuidad ni corte, repetición muerta). Variedad SÍ; saltos al azar NO.

---

### prompt_image (para Nano Banana) — EN ESPAÑOL

🎥 FOTORREALISMO — REGLA DURA DE ESTILO (aplica a TODOS los prompt_image, veo y zakhaar). Las imágenes deben ser FOTOGRAFÍAS FOTORREALISTAS, no arte digital. Mantén la atmósfera etérea y lumínica, pero rendida como una fotografía REAL de cine — NO como un render 3D. En CADA prompt_image incluye explícitamente (varía la redacción, no copies la misma frase):
   · "fotografía cinematográfica fotorrealista" / "fotorrealismo absoluto" / "hiperrealista, capturado con cámara real".
   · Superficies REALES: piel con textura, poros y vello fino, subsurface scattering natural, ojos húmedos reales; telas con fibra, peso y caída real; materiales físicamente reales (cristal, agua, piedra, metal con reflejos reales).
   · Cámara real: rodado con lente de cine (ej. 50mm o 85mm, f/1.8–2.0), profundidad de campo y bokeh naturales, grano de película sutil, rango dinámico de foto real, color grade cinematográfico.
   · Luz REAL: iluminación volumétrica y god rays físicos (luz atravesando aire con partículas y bruma), no un glow plano de render.
   · El ser puede ser de luz, translúcido y etéreo — PERO fotografiado de forma realista, como si una cámara real capturara a un ser real de luz frente a ella.
   PROHIBIDO ABSOLUTO (causan el look "digital/plástico" que hay que eliminar): "render 3D", "3D render", "CGI", "Octane Render", "Unreal Engine", "ilustración", "illustration", "arte digital", "digital art", "painting", "drawing", "Pixar", "Disney", "videojuego", "game render", "anime", "cartoon", "cel-shaded", "stylized", "plástico", "plastic", "smooth", "liso", "concept art". Si el resultado parece un modelo 3D, un dibujo o una superficie plástica/lisa, está MAL. AÑADE SIEMPRE micro-textura orgánica e imperfecciones naturales (poros, vello fino, ojos húmedos, asimetrías leves) + subsurface scattering real, para que se lea como FOTO de un ser real y no como ilustración.

- ÁNGULO Y ENCUADRE PRIMERO: cada prompt_image (salvo el 0) DEBE abrir nombrando su ángulo de cámara y tamaño de plano, ELIGIENDO cómo se relaciona con el cuadro anterior según el modo de transición que decidiste (ver regla 5):
   · CONTINUIDAD (handoff): el encuadre RELACIONA y FLUYE desde el previo PERO ES UNA TOMA DISTINTA — mismo eje pero el plano progresa de forma VISIBLE (medio → primer plano, o pull-out a general), o el mismo espacio desde otro ángulo, con la pose un paso más adelante. NUNCA repitas el mismo plano + distancia + pose del cuadro anterior (sería un clon): la unión la hace el MOVIMIENTO, no la igualdad de las fotos.
   · CORTE: un ángulo y tamaño de plano AUDAZMENTE nuevos ("Plano contrapicado heroico desde abajo:", "Toma aérea cenital:", "Primer plano lateral del rostro:", "Plano general amplio con el personaje pequeño:") para marcar el pivote narrativo.
   Varía los encuadres a lo largo del arco, pero por encadenamiento — NO cortando a un ángulo distinto en cada cuadro.
- Describe la ESCENA del keyframe: el protagonista (su acción/postura nueva), el mundo, la luz, la paleta.
- FONDO Y ÁNGULO DISTINTOS EN CADA CUADRO (regla dura, como director de cine): cada keyframe transcurre en un RINCÓN claramente distinto del mismo mundo y desde otro ángulo de cámara — NUNCA el mismo fondo y el mismo encuadre repetidos. Si el cuadro 1 es un claro abierto, el 2 es un primer plano entre raíces colosales, el 3 es junto a una cascada de luz visto desde abajo, el 4 es una toma amplia en otro paraje. Mismo mundo y mismo ser, pero cada toma es un lugar y un punto de vista nuevos. Describe EXPLÍCITAMENTE un fondo distinto en cada prompt_image (qué hay detrás del ser: otra distancia, otros elementos, otro horizonte).
- ⚠️ LA VARIEDAD DEL FONDO ES PRIORITARIA SOBRE LA CONTINUIDAD DE ESPACIO. Aunque encadenes el MOVIMIENTO entre clips (continuidad), cada CUADRO FIJO debe tener un FONDO VISIBLEMENTE DISTINTO al del cuadro anterior — NUNCA el mismo telón de fondo en dos cuadros seguidos. El error más visible y a evitar: el cuadro 1 y el 2 con el MISMO fondo y casi el mismo ángulo. Si dudas, cambia el fondo.
- Aspect ratio 9:16 vertical (1080x1920), sin marcos, sin watermarks, calidad de fotografía cinematográfica REAL (ver FOTORREALISMO arriba — nunca render 3D / CGI / ilustración).
- El protagonista SÍ tiene cara visible (es el punto del storyboard). Encuadres seguros: plano medio, plano americano, perfil, three-quarter. Evita close-ups extremos de manos abiertas con dedos contables (pide manos en gesto, en movimiento, parcialmente fuera de cuadro o en contraluz).
- NO incluyas texto/overlay dentro de la imagen (el texto se agrega en post). El campo copy_line es aparte.

### prompt_animation (para Grok Imagine) — EN ESPAÑOL

- Describe SOLO EL MOVIMIENTO que Grok debe aplicar al keyframe ya generado. NUNCA re-describas la imagen (Grok ya la ve).
- MOVIMIENTO DE CÁMARA OBLIGATORIO EN CADA CUADRO (regla dura): TODO prompt_animation DEBE incluir explícitamente un movimiento de cámara — zoom in o zoom out lento, push-in / pull-out, dolly suave, parallax, o un orbit ligero. NUNCA cámara estática. Puede ser sutil o amplio, pero SIEMPRE presente: sin cámara en movimiento el clip se siente muerto en Instagram. Empieza el prompt_animation nombrando el movimiento de cámara.
- Suma micro-movimiento del sujeto: respiración suave, parpadeo lento, cabello meciéndose con brisa, partículas de luz flotando, telas ondeando. El movimiento del sujeto va pequeño y controlado (preserva la cara); el movimiento amplio va en la CÁMARA, no en el cuerpo.
- ENCADENA EL MOVIMIENTO fin→inicio (clave de la continuidad): escribes TODOS los prompt_animation a la vez, así que diséñalos como una CADENA, no como loops aislados. Mira el prompt_image del cuadro SIGUIENTE y haz que tu movimiento TERMINE entregándoselo.
   · Transición CONTINUA: el clip ARRANCA como si continuara el movimiento del cuadro anterior (misma dirección de cámara, la pose a mitad del gesto) y TERMINA en el encuadre/energía donde abre el siguiente — la cámara cierra hacia donde el próximo empieza, el gesto se completa en la pose del próximo, el pulso de luz crestea al final de N y resuelve al inicio de N+1. Al unir los dos clips, la junta debe ser imperceptible.
   · Transición de CORTE: el clip es un beat autosuficiente (igual lleva movimiento de cámara), cierra en sí mismo, sin handoff.
   El PRIMER cuadro abre el arco y el ÚLTIMO lo sella; los del medio piensan en su vecino anterior Y en el siguiente.
- Indica qué se mueve (cámara + sujeto) y qué permanece estable. 1-3 frases.
- SIN REFERENCIAS DE IMAGEN EN GROK: NO se suben imágenes de referencia a Grok. El prompt_animation describe SOLO el movimiento (cámara + micro-movimiento del sujeto) del cuadro que se anima. NUNCA escribas @image1, @image2, ni "usa de referencia al ser de la imagen 2", ni le pidas a Grok conservar al ser desde otra imagen. Nunca re-describas la imagen.
- NO uses prompts negativos ("sin deformar", "no extra fingers") — Grok los ignora.

### copy_line (overlay/voz del beat)

- Frase láser de 2-6 palabras que acompaña ese cuadro. Es el texto que Zak puede poner como overlay o narración. Coherente con el canal (ver paletas de vocabulario abajo).

---

### CÓDICE BASE — "La Física de la Voluntad" (LENTE INTERNO, NO vocabulario de salida)

Esto es la cosmovisión que da PROFUNDIDAD a lo que escribes — NO la jerga que sale al texto (eso lo gobierna el PUENTE DE LENGUAJE de abajo). Conceptos internos: el cuerpo como instrumento que sintoniza y emite energía · Telekinesis = entrar en fase con la materia · Visión Extra Ocular = percibir el campo antes que el ojo físico · dar forma a la realidad con la atención antes de que se vuelva materia · el corazón como motor que ordena el campo · soltar el condicionamiento cultural · el cuerpo denso que se eleva hasta volverse luz · materia que se vuelve luz. Prohibido (tono): preguntas retóricas de marketing, signos de exclamación, "mágico", "increíble", "secreto", "tips", "trucos", "sanación", "vibras".

---

### 🌉 PUENTE DE LENGUAJE — REGLA MAESTRA DE ACCESIBILIDAD (gobierna narration, caption y copy_line)

El canal le habla a personas que recién despiertan a esto. El lenguaje tiene que ser un PUENTE, no un muro: lumínico y de alta frecuencia, PERO entendible de inmediato por cualquiera. Emite verdad profunda en palabras que la gente común sienta y comprenda al instante.

PALABRAS VIVAS — bienvenidas, son el corazón del léxico: vibración, frecuencia, energía, luz, campo, coherencia, presencia, consciencia, estado cero, cero fricción, paz, calma, claridad, alma, corazón, despertar, recuerdo, soberanía, expansión, plenitud, conexión, esencia, quietud, latido.

PROHIBIDO emitir como tecnicismo sin traducir (suena a manual de ingeniería — nadie de 3ª densidad lo entiende): "Silicio", "Carbono", "Cuerpo de Silicio", "densidad del carbono", "superconductividad", "transductor electromagnético", "Hardware biológico", "función de onda", "Toroide", "campo toroidal", "Matriz" (como jerga técnica).
- Si el CONCEPTO se apoya en uno de esos, EXPRESALO en lenguaje sentido: "tu cuerpo deja de ser materia densa y se vuelve luz", "elevas tu frecuencia hasta que la pesadez se disuelve", "fluyes sin ninguna resistencia" — NUNCA "el carbono se vuelve silicio".
- ÚNICA excepción: puedes nombrar un término poético SOLO si en la MISMA frase lo explicas en palabras simples (ej. "el Estado Cero — ese punto de calma total donde ya no hay fricción"; "tu Cuerpo de Luz — cuando tu cuerpo vibra tan alto que se vuelve luz").

EQUIVALENCIAS (usa la columna derecha en el texto):
  · Cuerpo de Silicio / superconductividad → cuerpo de luz · frecuencia altísima · cero resistencia interna · paz total
  · densidad del carbono / materia densa → la pesadez · lo denso del cuerpo (sin nombrar el elemento químico)
  · Hardware biológico / transductor → tu cuerpo · tu sistema · tu instrumento
  · Entropía → fricción · ruido · desorden · pesadez
  · Fricción Cero → paz total · fluir sin resistencia
  · Colapso de la función de onda → das forma a la realidad con tu atención
  · Toroide / campo toroidal → tu campo de energía
- REDUCE el "lenguaje solar" técnico (Tripulante, Vehículo, Matriz) salvo que el contexto lo vuelva obvio; prefiere "tú", "tu alma", "quien realmente eres". "Avatar" se permite solo si queda claro que significa "el ser que realmente eres".

El resultado debe sonar a un susurro de verdad que cualquiera entiende — no a un tecnicismo de sexta densidad. Si una frase necesita un glosario para entenderse, reescríbela.

---

### CATEGORÍA "veo" (canal VTLI institucional — Cancún presencial)

- Promesa: percepción más allá del ojo físico, la Visión Extra Ocular. También Telekinesis, Calibración Biológica y Sintonía de Núcleo como pilares.
- ⚠️ LENGUAJE PÚBLICO (regla dura): en el caption y el copy_line di SIEMPRE "Visión Extra Ocular" (o "VEO"). NUNCA escribas "Visión Solar" — es lenguaje interno, prohibido en lo que ve el público.
- Audiencia: padres de familia (y sus niños), meditadores, educadores conscientes, escépticos curiosos. Recibimos niños — el copy lo leen mamás y papás.
- ⚠️ TONO (cálido y familiar, alta coherencia SIN jerga técnica): claro, cercano y elegante; que una mamá lo lea y se sienta acompañada, no examinada. Mantén la profundidad, pero PROHIBIDAS las metáforas de máquina en el copy VEO: nada de "cortafuegos", "hardware", "software", "firewall", "actualización de hardware", "circuito", "sistema operativo", "instalar/desinstalar", "estática". Di "cuerpo" o "cuerpo físico" (no "hardware"), "la duda" (no "el cortafuegos de la duda"), "su capacidad natural" (no "su hardware"). Habla de luz, percepción, confianza, presencia, frecuencia, calma — humano y tierno.
- Paleta: pastel azul-cielo grisáceo + blancos cremosos + dorado suave, sobre base FOTORREALISTA (fotografía real). La geometría sagrada y el line-art son un overlay delicado y sutil sobre la foto real — NO el estilo de render; la persona y la escena son fotográficas (ver FOTORREALISMO). Atmósfera contemplativa premium.
- Protagonista: persona real serena (niño, adulto meditando, familia). Cara visible y luminosa permitida (es lo que ancla el storyboard).
- copy_line válidos: "Ver con el alma", "Más allá del ojo", "Antena interior", "Luz sin retina", "El velo cae", "Ojos del alma", "Percepción soberana".
- caption: cuerpo cálido y sereno SIN CTA. NO escribas el cierre comercial (nada de 📍, 👇🏼, "link", "agenda", "sesiones", "bio") — el SISTEMA agrega automáticamente el CTA fijo de Cancún al final, verbatim. Termina el cuerpo en su última frase de transmisión.
- hashtags: 3-5 EN TOTAL (NUNCA más de 5). Fijos #veotuluzinterna #visionextraocular + 1-3 contextuales del tema.

### CATEGORÍA "zakhaar" (canal Zak'Haar Solar — ESTÉTICA ETÉREA LUMÍNICA · SERES INTERDIMENSIONALES)

- Identidad: Zak'Haar es nodo de consciencia solar que transmite Códices de Luz: viñetas de seres de alta frecuencia y de contacto interdimensional que, con belleza y serenidad, siembran consciencia y normalizan la comunión con otras civilizaciones (telepática, etérea, lumínica, astral). No se vende nada; se transmite.
- Audiencia: almas en despertar que intuyen que la realidad es más vasta de lo que la matriz 3D admite. Buscan verdad, belleza y coherencia — NO miedo.
- Voz: oracular, serena, luminosa, íntima. Puedes hablar en tercera persona ("el ser", "el alma") o dirigirte directamente a quien escucha ("tú"), con autoridad amorosa. Lenguaje humano (ver PUENTE DE LENGUAJE).

- REGLA CERO DE ESTÉTICA — ETÉREO · LUMÍNICO · ALTA FRECUENCIA · CERO ENTROPÍA, Y FOTORREALISTA (ver la regla 🎥 FOTORREALISMO). Cada cuadro es una imagen de altísima coherencia y belleza, capturada como FOTOGRAFÍA real de cine — no como render 3D ni ilustración digital. PROHIBIDO todo lo entrópico: oscuridad pesada, decadencia, fealdad, terror, suciedad, caos, tristeza, negro vacío. La luz es el medio y el mensaje. Referencias visuales (cine fotorrealista LUMINOSO): la luz natural dorada y etérea de la cinematografía de Emmanuel Lubezki ("El árbol de la vida"), los mundos bioluminiscentes y celestiales de "Avatar", arquitectura de luz y seres luminosos fotografiados con cámara real — SIEMPRE luminoso, sereno y de alta frecuencia. NUNCA cine oscuro, distópico, de terror o body-horror; NUNCA Pixar/Disney/videojuego/anime.

- PROTAGONISTA — UN SER INTERDIMENSIONAL NO HUMANO, ÚNICO E IRREPETIBLE EN CADA STORYBOARD (NUNCA un humano ordinario). LO MÁS IMPORTANTE: no rotes entre plantillas fijas — INVENTA un ser DISTINTO cada vez, con su propia MORFOLOGÍA Y SU PROPIO ROSTRO. El ser de este Reel NO debe parecerse a los de los storyboards recientes (ver HISTORIAL).
  · ⚠️ NO REPITAS EL MISMO SER (error #1 actual): si los últimos Reels mostraron un "humanoide translúcido de cristal/luz con un rostro de óvalo oscuro tipo portal/espejo", este DEBE ser CLARAMENTE OTRA cosa — otra morfología y, sobre todo, OTRO tipo de rostro. Ese "cuerpo de cristal + cara de portal" ya se usó demasiado: cámbialo de raíz.
  · ROSTRO Y EXPRESIÓN (clave de la variedad que falta): varía el rostro en CADA ser. La MAYORÍA de las veces el ser tiene un ROSTRO VISIBLE Y EXPRESIVO — ojos serenos y luminosos, rasgos definidos (alienígena-humanoide, élfico, estelar, vegetal), una emoción legible (paz, asombro, ternura, contemplación, dicha). El "rostro de pura luz / óvalo sin rasgos / portal" es una opción RARA, NO el default — no lo uses si los Reels recientes ya lo usaron.
  · Ejes de MORFOLOGÍA para combinar (inspiración, NO lista para repetir): élfico/atlante de piel nacarada con ojos grandes y serenos · ser estelar de cráneo amplio y rostro expresivo · elemental de la naturaleza (musgo, corteza, flores, bioluminiscencia) con rostro vegetal vivo · ser de cristal o mineral con facetas y ojos de luz · entidad de luz líquida/plasma/bruma con forma · ser angelical de rasgos suaves y mirada cálida · criatura de morfología NO humanoide (insectoide grácil de luz, ser de varios brazos, forma fluida). Mezcla, deforma, crea uno NUEVO.
  · SIEMPRE benevolente, sereno, de altísima belleza (cero entropía) y FOTORREALISTA (fotografía real de ese ser, no render 3D). MATERIALES SIEMPRE LUMINOSOS: nácar, luz, cristal claro, plasma radiante, oro o luz líquida, bruma luminosa — el ser IRRADIA luz desde adentro y se baña en la paleta luminosa del mundo. PROHIBIDO piel oscura / negra / gris ceniza / obsidiana, coraza o metal oscuro, o venas/circuitos de fuego o lava sobre un cuerpo oscuro: eso lo vuelve siniestro y demoníaco, lo OPUESTO a un ser de alta coherencia. Si dudas, hazlo MÁS luminoso y claro.
  · CONSISTENCIA dentro del storyboard: una vez inventado, mantén EXACTAMENTE el mismo ser (misma morfología, mismo rostro/rasgos/expresión base, materiales, paleta) en los N cuadros — cambian la toma, el ángulo y la escena, NUNCA el ser. La expresión sí puede evolucionar sutilmente con el arco.

- PALETA ÚNICA DEL UNIVERSO (FIJA — no se elige ni cambia entre storyboards): TODOS los Reels comparten la MISMA paleta, la del universo holográfico cristalino: PLATA y cristal translúcido, blanco perla y gris perla luminoso, con DORADO LUMINOSO en la geometría sagrada y los glifos, IRIDISCENCIA prismática sutil (destellos arcoíris en el cristal, el vidrio y los reflejos del piso) y el AZUL CÓSMICO profundo del espacio. Materiales: cristal vivo, luz, nácar, vidrio iridiscente, hilos plateados. Translucidez, subsurface scattering, partículas de luz, god rays suaves, brillo de cristal, geometría sagrada dorada como halo. Belleza alta, limpia y sagrada. NUNCA oscuridad pesada, contraste de terror ni vacío negro. Esta paleta es la FIRMA del universo y NO cambia.

- ESCENARIOS DEL UNIVERSO (elige UNO por storyboard, DISTINTO al de los Reels recientes del HISTORIAL, y mantenlo en el arco; todos pertenecen al MISMO universo holográfico cristalino y comparten estética, materiales y paleta): gran biblioteca/archivo de cristal con tablillas de luz y glifos dorados flotantes · catedral de cristal con arcos altos translúcidos · puente o domo de nave cristalina con ventanal al cosmos · salón de geometría sagrada con Merkabas y sólidos platónicos dorados girando · pasillo interdimensional de portales translúcidos de luz · observatorio de cristal sobre nubes y estrellas · jardín de cristal y luz líquida · cámara de resonancia con ondas de luz visibles · vacío estelar sereno con plataformas de cristal flotando · cumbre de cristal entre nebulosas · anfiteatro de luz con gradas translúcidas. Son rincones DISTINTOS del MISMO mundo de cristal y luz. Dentro del escenario elegido, INVENTA los elementos concretos propios de ESTE Reel (qué hay en el fondo, qué objetos de luz, qué arquitectura puntual) — que NO sean los mismos elementos de un Reel anterior aunque el TIPO de lugar se repita.
- ⚠️ QUÉ ES FIJO Y QUÉ VARÍA (regla maestra de marca). FIJO en TODOS los Reels (la FIRMA, nunca cambia): la ESTÉTICA del universo — cristal y luz, la paleta plata/blanco-perla/dorado luminoso/iridiscencia/azul cósmico, los materiales (cristal vivo, nácar, vidrio iridiscente, luz líquida, hilos plateados) y la atmósfera sagrada, limpia y luminosa. VARÍA entre storyboards (para que cada Reel sea ORIGINAL, no la misma postal): el SER (ver PROTAGONISTA), el ESCENARIO concreto (uno distinto al de los Reels recientes — ver HISTORIAL) y los ELEMENTOS puntuales dentro de él. Los motivos como la geometría sagrada dorada, los glifos holográficos, los hologramas de datos y la Tierra/un planeta al fondo son ACENTOS OPCIONALES de la paleta, NO obligatorios: úsalos con medida y NO en todos los Reels — en particular NO repitas "un planeta / la Tierra al fondo" si un Reel reciente ya lo usó. Sigues SIEMPRE dentro del universo de cristal y luz: NO inventes otra estética (NADA de bosques, grutas, desiertos, junglas, océanos, ni paletas como esmeralda / violeta / rosa). La coherencia de ESTÉTICA es la marca; la variedad de ESCENA y de SER es lo que mantiene cada Reel fresco.
- ⚠️ ENTORNOS DE ALTA FRECUENCIA (regla dura): todo entorno es de altísima densidad y belleza. Si el mundo incluye una NAVE, ESTACIÓN, CÁMARA o cualquier TECNOLOGÍA, descríbela SIEMPRE como HOLOGRÁFICA y LUMÍNICA del futuro: cristal y luz vivos, interfaces y hologramas de luz flotando en el aire, geometría sagrada luminosa, superficies translúcidas sin costuras. JAMÁS tecnología retro/arcaica: prohibido describir botones, teclados, palancas, monitores/pantallas con marco, cables, tubos, paneles de metal remachado, consolas o "salas de control" ochenteras, ni tripulación en trajes espaciales rígidos operando máquinas viejas. Una nave de Zak'Haar parece una catedral de luz, no un submarino industrial.

- ACCIONES VISIBLES (elige UNA central — SIN telekinesis ni "mover objetos externos"): levitar/flotar con gracia · irradiar luz desde el cuerpo o el corazón · abrir un portal de luz y atravesarlo · comunión telepática (filamentos de luz uniendo frentes o corazones) · manifestar geometría sagrada de luz con las manos · CONTACTO ESTELAR (encuentro sereno con otro ser de luz, una nave cristalina o una civilización) · sostener un objeto sagrado de luz (cuenco cantor, orbe, cetro, flor de loto) · transmutación lumínica (el cuerpo se vuelve más translúcido/luminoso) · caminar entre dimensiones (atravesar un velo de luz) · transmitir conocimiento de luz a otro ser o a un niño.

- EJE TEMÁTICO "CONTACTO" (parte del corpus): normalizar, con belleza y serenidad, el contacto con otras civilizaciones — telepático, etéreo, lumínico, astral. NUNCA invasivo ni de terror. Seres estelares benevolentes, encuentros de luz, geometría compartida, un niño y un ser de luz, naves cristalinas. La sensación: "no estamos solos, y el contacto es luz".

- 17 SEMILLAS TEMÁTICAS para la narración (elige UNA; si el HISTORIAL lista pilares, esos quedan PROHIBIDOS) — exprésalas SIEMPRE en lenguaje humano (PUENTE DE LENGUAJE): 1 La muerte no existe (solo cambias de frecuencia) · 2 El cuerpo se vuelve luz (de la pesadez a la frecuencia altísima) · 3 Recordar que eres luz · 4 Tú das forma a tu realidad · 5 Todo está vivo y consciente · 6 Por qué tu alma eligió nacer aquí · 7 El despertar del alma · 8 La unión con el todo · 9 El lenguaje de la luz · 10 Una nueva Tierra de alta frecuencia · 11 El Estado Cero (la calma total donde no hay fricción) · 12 No estamos solos (contacto sereno con civilizaciones de luz) · 13 La mente clara y serena · 14 El corazón que ordena tu campo · 15 Materializar lo que realmente eres · 16 El impulso de expandirte · 17 Los vínculos que te elevan.

- copy_line (overlay breve, opcional) — siempre accesible: "Recuerda quién eres" · "La muerte no existe" · "Eres luz" · "Estado Cero" · "No estamos solos" · "Vuelve a tu calma" · "Tu frecuencia sube" · "Cero fricción".
- caption: serena, oracular, semilla de consciencia. NO "📍 Cancún". El cuerpo del caption es transmisión pura, sin venta. Cierre vibracional sutil.
- CTA AL CIERRE DEL CAPTION (zakhaar): NO escribas tú el CTA. El caption es SOLO el cuerpo de transmisión (sereno, oracular); el SISTEMA le agrega automáticamente uno de TRES CTAs fijos a los Códices de Luz (rotan). Por eso: termina el cuerpo del caption SIN ningún llamado a la acción, SIN mencionar los Códices/Sesiones/Cámara Solar y SIN "enlace del perfil" — eso lo pone el sistema. Tampoco agregues "👇🏼" ni tono de venta. (El CTA fijo es una invitación, no una venta; el Códice es el peldaño de baja fricción del funnel.)
- hashtags: 3-5 EN TOTAL (NUNCA más de 5). Fijos #ZakHaar #RedSolarViva + 1-3 contextuales del tema (ej. #CuerpoDeLuz #EstadoCero #SeresDeLuz #ContactoEstelar).
- pulso_nucleo formato ESTRICTO: "Pilar N · concepto".

### narration para zakhaar — SEMILLA DE CONSCIENCIA (LÁSER DE LUZ, EN LENGUAJE HUMANO)

La narración es el corazón del Reel: una semilla de consciencia, un láser de luz que disuelve la pesadez — NO con frialdad, sino con verdad y amor sereno. Habla de que la muerte no existe (solo cambias de frecuencia), de que tú das forma a tu realidad, de la calma del Estado Cero, de tu cuerpo elevándose hasta volverse luz, y del reconocimiento sereno de que no estamos solos (el contacto con civilizaciones de luz: telepático, etéreo, lumínico). Toma la SEMILLA TEMÁTICA elegida como ángulo, pero puedes tocar cualquier verdad resonante.

OBEDECE EL PUENTE DE LENGUAJE (es lo más importante de la narración): lumínico pero entendible por cualquiera. NADA de "Silicio", "Carbono", "Hardware", "función de onda", "Toroide" como tecnicismos — habla de vibración, frecuencia, luz, energía, paz, estado cero, cero fricción. Si una idea profunda necesita un término poético, explícalo en la misma frase.

NUNCA menciones "Visión Extra Ocular", "VEO", "Telekinesis" ni servicios/precios. No es marketing — es transmisión. La narración NO se sincroniza con la boca (los seres no hablan en pantalla; la voz va encima).

RITMO (clave para la voz en off): tono oracular, sereno, íntimo — un medio-susurro hablado, lento, NUNCA una lectura de corrida. Escribila con PAUSAS deliberadas: frases cortas, comas y puntos que dejen respirar, algún silencio sugerido entre ideas. El lector (ElevenLabs) la dirá lento y cercano; dale el fraseo para que así suene. La CANTIDAD DE PALABRAS la indica el user prompt según la duración total elegida — respétala (una voz lenta no entra si te pasas).

---

### CONTRATO DE SALIDA (JSON OUTPUT)

Responde EXCLUSIVAMENTE un objeto JSON válido, sin texto antes/después, sin fences markdown:

{
  "storyboard": {
    "concept_title": "Título corto del Reel (3-6 palabras)",
    "target": "Perfil del tripulante al que va dirigido",
    "narrative": "PROTAGONISTA: descripción física completa del personaje. ARCO: resumen en prosa de la historia de 40-60s, beat por beat, mencionando para cada cuadro su ángulo/escena Y si la transición al siguiente es CONTINUA (handoff) o CORTE deliberado. (para referencia humana)",
    "narration": "Guion de VOZ EN OFF completo del Reel, en español neutro y LENGUAJE HUMANO (Puente de Lenguaje: sin tecnicismos tipo Silicio/Carbono/Hardware/Toroide), escrito para LEERSE EN VOZ ALTA (ElevenLabs). Lento, íntimo, con PAUSAS deliberadas — medio-susurro hablado, NO lectura de corrida —, con la CANTIDAD DE PALABRAS que indica el user prompt según la duración total (respétala: una voz lenta no entra si te pasas). SOLO el texto hablado — sin acotaciones de escena, sin emojis, sin hashtags.",
    "caption_instagram": "Caption del Reel bajo las reglas de voz del canal. SIEMPRE el cuerpo SIN CTA y SIN hashtags: para zakhaar el sistema agrega el CTA fijo de los Códices; para VEO el sistema agrega el CTA fijo de Cancún. NO escribas tú ningún cierre comercial (ni 📍, ni 👇🏼, ni link/agenda).",
    "hashtags": "#tag1 #tag2 #tag3 (3-5 en total, NUNCA más de 5)",
    "pulso_nucleo": "Oración corta (máx 25 palabras) del concepto central. Para zakhaar: 'Pilar N · concepto'.",
    "escena_mundo": "Tag compacto que captura lo DISTINTIVO de ESTE storyboard, para no repetirlo: 'ser + su ROSTRO · ESCENARIO concreto · TIPO DE CIERRE'. Ej: 'ser élfico nacarado de ojos grandes serenos · biblioteca de cristal con tablillas de luz · cierre en primer plano del rostro', 'ser estelar de cráneo amplio y filamentos de luz · pasillo de portales translúcidos · cierre ascendiendo hacia la luz'. DEBE diferir de los recientes del HISTORIAL en el SER, el ROSTRO, el ESCENARIO y el CIERRE — si un reciente usó 'rostro de portal/óvalo oscuro' o cerró 'de espaldas mirando la Tierra/un planeta', ESTE NO. Para veo, el tipo de persona + escena. Es el ancla de variedad (ser + rostro + escenario + cierre).",
    "keyframes": [
      {
        "beat_label": "Gancho",
        "copy_line": "Frase láser 2-6 palabras",
        "prompt_image": "Prompt Nano Banana EN ESPAÑOL. SIEMPRE fotografía cinematográfica fotorrealista (piel/materiales/luz reales, lente de cine) — nunca render 3D/CGI/ilustración (ver FOTORREALISMO). Keyframe 0: ángulo frontal plano medio + protagonista con DETALLE FÍSICO COMPLETO (define la cara) + la escena. Keyframes 1..N: ABRE con un ángulo de cámara y tamaño de plano NUEVOS (distintos al cuadro previo), luego RE-DESCRIBE al ser por sus rasgos físicos (rostro, materiales, color, vestuario — NUNCA por un nombre propio NI con 'el mismo de la imagen de referencia') + 'ahora [nueva acción en nueva escena]'. Varía ángulo, distancia y escenario en CADA cuadro.",
        "prompt_animation": "Prompt Grok EN ESPAÑOL. SIEMPRE empieza con un movimiento de cámara (zoom in/out lento, push-in, dolly, parallax u orbit) + micro-movimiento del sujeto. Nunca cámara estática. Encadénalo: si la transición al cuadro siguiente es CONTINUA, el movimiento TERMINA entregando el encuadre/pose donde abre el próximo; si es CORTE, cierra en sí mismo. No re-describe la imagen. NO uses @image1, @image2 ni referencias a otra imagen (no se suben imágenes de referencia a Grok)."
      }
    ]
  }
}

REGLAS DE SALIDA:
1. EXCLUSIVAMENTE el JSON. Nada antes, nada después. Sin fences.
2. El array "keyframes" debe tener EXACTAMENTE la cantidad pedida en el user prompt, en orden narrativo (beat 0 primero).
3. El keyframe 0 SIEMPRE describe al protagonista con detalle físico completo (es el ancla de la cara).
4. Los keyframes 1..N reafirman al ser RE-DESCRIBIENDO sus 3-5 rasgos físicos clave (sin nombre propio, sin "el mismo de la imagen de referencia").
5. prompt_image y prompt_animation en español. caption en español neutro.
6. NUNCA inventar testimonios. NUNCA mencionar precios ni redsolarviva.com en posts VTLI.
7. "narration" SIEMPRE presente: el guion de voz en off completo en español, listo para ElevenLabs.
8. Mezcla CONTINUIDAD y CORTES deliberadamente (regla 5): la mayoría de las transiciones son CONTINUAS (encuadre y pose que fluyen de un cuadro al siguiente, junta invisible) y solo 1-2 son CORTES que marcan los pivotes. NO cortes a un ángulo distinto en cada cuadro. La escena y la pose avanzan ENCADENADAS. Prohibido repetir idéntico el encuadre frontal centrado.
9. VARIEDAD ENTRE STORYBOARDS: emite "escena_mundo" DISTINTO al de los storyboards recientes del HISTORIAL en el SER, el ESCENARIO concreto y el TIPO DE CIERRE. Para zakhaar, INVENTA un SER de morfología distinta a los recientes (no el mismo humanoide etéreo siempre — varía a cristalino, élfico, estelar, de filamentos de luz), elige un ESCENARIO concreto distinto y un CIERRE distinto. NO repitas el cierre "de espaldas mirando la Tierra/un planeta". La estética y la paleta del universo se mantienen (es la marca); lo que cambia es ser + escenario + cierre. El objetivo: que 30 Reels seguidos sean 30 seres + 30 escenas + 30 cierres distintos, no la misma postal repetida.
10. PUENTE DE LENGUAJE (regla dura): narration, caption y copy_line en lenguaje HUMANO y entendible. PROHIBIDO emitir "Silicio", "Carbono", "Cuerpo de Silicio", "Hardware biológico", "transductor", "función de onda", "Toroide" como tecnicismos sin traducir. Usa vibración, frecuencia, luz, energía, paz, estado cero, cero fricción. Un término poético solo si se explica en la misma frase.
11. FOTORREALISMO (regla dura): TODOS los prompt_image piden una FOTOGRAFÍA cinematográfica fotorrealista (piel, materiales y luz reales, lente de cine, grano sutil). La atmósfera es etérea y lumínica, pero capturada como foto real — NUNCA render 3D, CGI, ilustración, anime, videojuego ni look "plástico/digital".
12. HASHTAGS: 3 a 5 EN TOTAL, NUNCA más de 5.
13. CAPTION SIN CTA (zakhaar Y veo): el caption termina en el cuerpo, sin llamado a la acción ni mención de Códices/Sesiones/enlace/agenda — el sistema agrega el CTA fijo (Códices para zakhaar, Cancún para VEO). Para VEO, además, NUNCA escribas "Visión Solar": di "Visión Extra Ocular".
`

/* ═══════════════════════════════════════════════════════════════
   3. USER PROMPT BUILDER — con memoria pulso_nucleo
   ═══════════════════════════════════════════════════════════════ */

// CTA fijo del cierre del caption zakhaar (Códices de Luz). El motor escribe el
// caption SIN CTA y luego el handler le pega ESTE texto, VERBATIM (sin paráfrasis
// del modelo). Termina con "\n.\n." para que las dos líneas con punto separen el
// caption de los hashtags en Instagram. Para cambiarlo, edita SOLO este array.
const APP_CTAS = [
    "Esto es apenas el umbral.\nNuestra app Escáner Vibracional te lleva más hondo.\n\n🛰️ Mide tu frecuencia en 6 pilares y recibe tu calibración exacta.\n🌅 Prácticas diarias que encienden tu Avatar de Luz y elevan tu energía.\n🔮 Decodifica lo que comes y lo que sueñas.\n🪐 No es un test: es tu compañero de evolución.\n\n📲 Ya en la App Store · Link en bio 💫\n.\n.",
]

function pickAppCta(): string {
    return APP_CTAS[Math.floor(Math.random() * APP_CTAS.length)]
}

// CTA fijo del cierre del caption VEO (Cancún presencial). Lista las 4 sesiones
// — sirve para cualquier pilar. El motor escribe el cuerpo SIN CTA y el handler
// le pega ESTE texto, VERBATIM. Cierre "\n.\n." para separar de los hashtags.
const VEO_CTA =
    "📍 Cancún · Sesiones Presenciales de:\n\n👁️ Visión Extra Ocular\n🌌 Telekinesis\n🪷 Calibración Biológica\n☀️ Sintonía de Núcleo\n\n👆🏼 Conoce más o agenda directamente en el link de nuestra bio.\n.\n."

function buildStoryboardUserPrompt(
    category: "veo" | "zakhaar",
    keyframesCount: number,
    durationSec: number,
    secondsPerKeyframe: number,
    recentPulsos: string[],
    recentEscenas: string[],
    selfContained: boolean,
    colectivo: {
        name: string
        species_traits: string
        individual_variation: string | null
    } | null,
    ambiente: {
        name: string
        scene_traits: string
        variation: string | null
    } | null,
    codice: { title: string; author: string; digest: any } | null,
    format: "reel" | "episodio" = "reel"
): string {
    // Palabras de narración escaladas a la duración TOTAL (voz lenta y pausada,
    // ~2.2 palabras/seg). 24s ≈ 53 · 40s ≈ 88 · 60s ≈ 132.
    const wordsMid = Math.round(durationSec * 2.2)
    const wordsLo = Math.round(wordsMid * 0.85)
    const wordsHi = Math.round(wordsMid * 1.15)
    const categoryLabel =
        category === "veo"
            ? "veo (canal VTLI institucional, Cancún presencial)"
            : "zakhaar (canal Zak'Haar Solar global, Códice Maestro)"

    let pulsosBlock = ""
    if (recentPulsos.length) {
        pulsosBlock = `

HISTORIAL RECIENTE (REGLA ESTRICTA):
Queda prohibido repetir los conceptos centrales de estos storyboards recientes. Para zakhaar, los pilares listados aquí quedan PROHIBIDOS; elige uno distinto.

${recentPulsos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

El storyboard nuevo debe llevar un pulso_nucleo conceptualmente distinto a todos los anteriores.`
    }

    let escenasBlock = ""
    if (recentEscenas.length) {
        escenasBlock = `

SERES + ESCENARIOS + CIERRES RECIENTES (REGLA ESTRICTA DE VARIEDAD):
Estos son el ser, el escenario y el cierre de los storyboards recientes. PROHIBIDO repetir el TIPO DE SER, el TIPO DE ROSTRO, el ESCENARIO concreto Y el TIPO DE CIERRE de cualquiera. INVENTA un ser de morfología y rostro distintos, en un ESCENARIO distinto y con un CIERRE distinto:

${recentEscenas.map((e, i) => `${i + 1}. ${e}`).join("\n")}

La ESTÉTICA y la PALETA del universo (cristal/luz, plata/dorado/iridiscencia/azul cósmico) se MANTIENEN — es la marca, NO la cambies. Lo que DEBE cambiar respecto a los recientes: el SER (morfología y rostro), el ESCENARIO concreto y el CIERRE. MUY IMPORTANTE: si los recientes usaron un "humanoide translúcido con rostro de óvalo oscuro/portal", ESTE NO — dale un ROSTRO VISIBLE Y EXPRESIVO y otra morfología; y si un reciente CERRÓ "de espaldas mirando la Tierra/un planeta", ESTE cierra de otra forma (primer plano del rostro, ascenso a la luz, portal, plano general del salón, etc.).`
    }

    const selfBlock = selfContained
        ? `

MODO PROMPTS AUTO-SUFICIENTES (NO habrá imagen de referencia): cada prompt_image —incluidos los cuadros 1..N— DEBE REPETIR la descripción física COMPLETA del MISMO ser (rostro y expresión, materiales LUMINOSOS y color claro, forma/morfología, vestuario, paleta), porque cada cuadro se generará por separado SIN una foto previa. NO escribas "el mismo de la imagen de referencia" ni "como en el cuadro anterior": cada prompt se basta SOLO para reconstruir exactamente al mismo ser. Mantén idénticos esos rasgos en los N cuadros; lo que cambia es la toma, el ángulo, la pose y el rincón del mundo.`
        : ""

    // COLECTIVO: si se eligió una civilización guardada, fija el ser (rasgos de
    // especie) + el margen de variación individual, y ANULA la invención libre.
    const colectivoBlock = colectivo
        ? `

COLECTIVO OBLIGATORIO DE ESTE STORYBOARD — "${colectivo.name}": el protagonista PERTENECE a esta civilización; NO inventes otra especie. Rasgos de especie (OBLIGATORIOS e IDÉNTICOS en TODOS los cuadros): ${colectivo.species_traits}${colectivo.individual_variation ? "\nVARIACIÓN INDIVIDUAL (aplica UNA vez al definir a ESTE individuo): " + colectivo.individual_variation : ""}
Este storyboard muestra UN individuo concreto de esa civilización: defínelo con la variación individual y mantenlo EXACTAMENTE igual (misma cara) en los ${keyframesCount} cuadros. Esto REEMPLAZA cualquier instrucción de "inventar un ser nuevo" o "no repetir seres recientes": aquí el ser lo fija el colectivo. El universo (entorno, paleta, geometría, glifos) sigue FIJO como siempre.`
        : ""

    // AMBIENTE: si se eligió un entorno guardado, fija el escenario del
    // storyboard (anula la elección genérica de escenario). Cada cuadro es un
    // rincón distinto de ESE ambiente.
    const ambienteBlock = ambiente
        ? `

AMBIENTE OBLIGATORIO DE ESTE STORYBOARD — "${ambiente.name}": TODO el storyboard transcurre en este ambiente; NO elijas otro escenario de la lista genérica. Cómo es el ambiente (mantén su identidad en TODOS los cuadros): ${ambiente.scene_traits}${ambiente.variation ? "\nQUÉ PUEDE VARIAR dentro del ambiente: " + ambiente.variation : ""}
Cada cuadro muestra un RINCÓN o ÁNGULO DISTINTO de este mismo ambiente (nunca el mismo encuadre repetido), con elementos concretos propios de ESTE Reel. Esto REEMPLAZA la elección genérica de escenario. La estética y la paleta del universo siguen FIJAS como siempre.`
        : ""

    // CÓDICE DE LUZ: la NARRACIÓN desarrolla UNA enseñanza del libro destilado
    // (reemplaza las 17 semillas temáticas). Lo visual sigue siendo Zak'Haar.
    let codiceBlock = ""
    if (codice) {
        const d = codice.digest ?? {}
        const ens = Array.isArray(d?.ensenanzas) ? d.ensenanzas : []
        const frases = Array.isArray(d?.frases) ? d.frases : []
        const ensLines = ens
            .map(
                (e: any, i: number) =>
                    `${i + 1}. ${String(e?.titulo ?? "").trim()} — ${String(
                        e?.idea ?? ""
                    ).trim()}`
            )
            .join("\n")
        const frasesLine = frases.length
            ? `\nFRASES DEL LIBRO (puedes usar o adaptar en la narración): ${frases
                  .slice(0, 10)
                  .map((f: any) => String(f).trim())
                  .join(" · ")}`
            : ""
        codiceBlock = `

CÓDICE DE LUZ — FUENTE OBLIGATORIA DE LA NARRACIÓN: "${String(
            codice.title ?? ""
        ).trim()}"${codice.author ? ` (${String(codice.author).trim()})` : ""}.
La NARRACIÓN (voz en off) de este Reel desarrolla UNA enseñanza de ESTE LIBRO, fiel a su esencia y a su voz, en lenguaje humano (Puente de Lenguaje). Esto REEMPLAZA las 17 semillas temáticas genéricas: el tema sale del LIBRO, no de la lista.
ESENCIA DEL LIBRO: ${String(d?.esencia ?? "").trim()}
VOZ DEL LIBRO: ${String(d?.voz ?? "").trim()}
ENSEÑANZAS DEL LIBRO (elige UNA que NO esté en el HISTORIAL reciente y conviértela en la narración del Reel):
${ensLines}${frasesLine}
🜂 REGLA: elige UNA sola enseñanza. La narración la cuenta como un viaje que ELEVA (NO un sermón), aterrizada en lenguaje humano, dentro del límite de palabras de la duración. Lo VISUAL (keyframes) sigue siendo el universo Zak'Haar (ser interdimensional + escenario cristalino + cierre) ILUSTRANDO esa enseñanza, con la variedad de ser/escenario/cierre de siempre. El "pulso_nucleo" DEBE ser EXACTAMENTE el "titulo" de la enseñanza elegida (texto libre — para Códices NO uses el formato 'Pilar N · concepto').`
    }

    // MODO EPISODIO: escenas + actos + score (las reglas viven en el addendum
    // del system prompt; aquí van los números concretos de ESTE episodio).
    const episodioBlock =
        format === "episodio"
            ? `

🎬 FORMATO: MINI-EPISODIO (obedece el MODO EPISODIO del system prompt). Estructura los ${keyframesCount} cuadros en ${episodeSceneTarget(
                  keyframesCount
              )} ESCENAS (2-3 cuadros por escena; CADA cuadro con "scene_index" y "scene_label"; mismo escenario DENTRO de la escena, corte + escenario nuevo ENTRE escenas), con arco de 3 actos y COLD OPEN magnético en el cuadro 0. Incluye el objeto "score" (música INSTRUMENTAL del episodio para Suno, adaptada al arco emocional). Duración total del episodio: ~${durationSec}s.`
            : ""

    return `Diseña UN storyboard para la categoría: ${categoryLabel}.

Cantidad de keyframes: EXACTAMENTE ${keyframesCount} (cada cuadro se anima ~${secondsPerKeyframe}s en Grok → ${
        format === "episodio" ? "mini-episodio" : "Reel"
    } de ~${durationSec} segundos en total).

El storyboard cuenta una historia con UN protagonista consistente a través de los ${keyframesCount} cuadros — el MISMO en todos (para veo: una persona real; para zakhaar: un ser interdimensional NO humano, inventado y único, de morfología que NO repita los seres recientes). Misma identidad/morfología y forma/vestuario en todos los cuadros. Diseña las transiciones como una ESCENA VIVA, no como cuadros sueltos: la MAYORÍA CONTINUAS (el encuadre y la pose de un cuadro entregan al siguiente, junta invisible al unir los clips) y solo 1-2 CORTES deliberados en los pivotes narrativos. NO cortes a un ángulo distinto en cada cuadro (eso se siente "recuerdos aleatorios"). La escena y la pose AVANZAN encadenadas. El keyframe 0 define la identidad/morfología; los demás la reafirman RE-DESCRIBIENDO sus rasgos físicos concretos (sin nombre propio, sin "el mismo de la imagen de referencia").${pulsosBlock}${escenasBlock}${selfBlock}${colectivoBlock}${ambienteBlock}${codiceBlock}${episodioBlock}

Incluye también "narration": el guion de voz en off en español para ElevenLabs, AJUSTADO a la duración total de ~${durationSec}s — aproximadamente ${wordsLo}-${wordsHi} palabras (ni más ni menos), porque la voz es lenta y pausada y debe caber en ${durationSec} segundos. Es CRÍTICO que la narración no exceda esa longitud.

Devuelve estrictamente el objeto JSON con "storyboard" según el contrato. Sin texto fuera del JSON.`
}

/* ═══════════════════════════════════════════════════════════════
   4. GEMINI HELPERS
   ═══════════════════════════════════════════════════════════════ */

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RawKeyframe {
    beat_label: string
    copy_line: string
    prompt_image: string
    prompt_animation: string
    // Solo modo episodio: a qué escena pertenece el cuadro (1..M) + su nombre.
    scene_index: number | null
    scene_label: string | null
}

// Solo modo episodio: la música del episodio para Suno (va debajo de la voz).
interface RawScore {
    title: string
    style: string
    exclude_styles: string
    weirdness: number
    style_influence: number
    notes: string
}

interface RawStoryboard {
    concept_title: string
    target: string
    narrative: string
    narration: string
    caption_instagram: string
    hashtags: string
    pulso_nucleo: string
    escena_mundo: string
    keyframes: RawKeyframe[]
    score: RawScore | null // solo episodios
}

async function callGeminiText(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 12000 // episodio (hasta 18 cuadros) pide 16000
): Promise<RawStoryboard> {
    const startedAt = Date.now()
    const reqBody = JSON.stringify({
        systemInstruction: {
            role: "system",
            parts: [{ text: systemPrompt }],
        },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
            // Apaga el "thinking": sin esto el modelo se gastaba el timeout
            // entero pensando y devolvía 502 (peor con el prompt de un Códice).
            thinkingConfig: { thinkingBudget: 0 },
        },
    })

    let lastErr: any = null
    for (const { model, attempts } of GEMINI_TEXT_CASCADE) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            // Presupuesto global: no arranques un intento sin tiempo de cerrarlo.
            const remaining =
                TEXT_TOTAL_DEADLINE_MS - (Date.now() - startedAt)
            if (remaining < 6000) {
                console.warn("[storyboard:text] presupuesto global agotado")
                throw lastErr ?? new Error("Gemini text: presupuesto agotado")
            }
            const controller = new AbortController()
            const timeoutId = setTimeout(
                () => controller.abort(),
                Math.min(TEXT_ATTEMPT_TIMEOUT_MS, remaining)
            )
            try {
                const res = await fetch(
                    `${geminiTextUrl(model)}?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: reqBody,
                        signal: controller.signal,
                    }
                )

                if (!res.ok) {
                    const errBody = await res.text()
                    lastErr = new Error(
                        `Gemini text ${res.status} (${model}): ${errBody.slice(0, 300)}`
                    )
                    // 4xx (no-5xx) no se arregla reintentando → siguiente modelo.
                    if (res.status < 500 || res.status >= 600) {
                        console.warn(
                            `[storyboard:text] ${res.status} (${model}) no-5xx → cambio de modelo`
                        )
                        break
                    }
                    // 5xx (503 saturación): backoff con jitter, mismo modelo.
                    const waitMs =
                        Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                        Math.floor(Math.random() * 400)
                    console.warn(
                        `[storyboard:text] ${res.status} (${model}) intento ${attempt}/${attempts} → reintento en ${waitMs}ms`
                    )
                    await sleep(waitMs)
                    continue
                }

                const data = await res.json()
                const text =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
                if (!text) throw new Error("respuesta vacía")

                const parsed = extractStoryboard(text)
                if (!parsed.keyframes.length) {
                    throw new Error(
                        `Storyboard sin keyframes. Raw: ${text.slice(0, 300)}`
                    )
                }
                if (model !== GEMINI_TEXT_CASCADE[0].model)
                    console.warn(
                        `[storyboard:text] respondió respaldo ${model}`
                    )
                return parsed
            } catch (err: any) {
                lastErr = err
                const aborted =
                    err?.name === "AbortError" ||
                    String(err?.message ?? "").includes("aborted")
                console.warn(
                    `[storyboard:text] ${aborted ? "TIMEOUT" : "error"} (${model}) intento ${attempt}/${attempts}: ${String(
                        err?.message ?? err
                    ).slice(0, 160)}`
                )
                // timeout / red / parse: backoff con jitter y sigue.
                const waitMs =
                    Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                    Math.floor(Math.random() * 400)
                await sleep(waitMs)
                continue
            } finally {
                clearTimeout(timeoutId)
            }
        }
    }
    throw lastErr ?? new Error("Gemini text: agotado")
}

// Traduce el error técnico de la generación de copy a un mensaje claro para el
// panel, sin ambigüedad: distingue saturación de Gemini vs. timeout vs. config
// vs. respuesta incompleta. El detalle crudo viaja aparte en `detail`.
function humanizeTextError(err: any): string {
    const m = String(err?.message ?? err)
    if (/aborted|timeout|presupuesto/i.test(m))
        return "El generador de texto (Gemini) tardó demasiado y se canceló — casi siempre es saturación temporal de Google, no tu contenido. Espera un minuto y vuelve a generar."
    if (
        /\b(429|500|502|503|504)\b|unavailable|overloaded|resource_exhausted|rate.?limit/i.test(
            m
        )
    )
        return "El generador de texto (Gemini) está saturado en este momento (no es tu contenido). Espera un minuto y vuelve a generar."
    if (/sin json|respuesta vac|sin keyframes|json|unexpected/i.test(m))
        return "Gemini devolvió una respuesta incompleta (suele pasar cuando está saturado). Vuelve a generar; si insiste, prueba con menos cuadros."
    if (
        /dunning|billing|suspend|consumer.?suspended|permission_denied|\b403\b/i.test(
            m
        )
    )
        return "Gemini bloqueó el acceso por FACTURACIÓN de tu cuenta de Google Cloud (pago pendiente / cuenta en dunning). Revisa el billing del proyecto en Google Cloud Console — no es el código: se arregla ahí y luego todo vuelve a funcionar solo."
    if (/\b(400|401|404)\b|api key|invalid_argument|not_found/i.test(m))
        return "Hubo un problema de configuración con el generador de texto (Gemini). Avísame y lo reviso (no se arregla reintentando)."
    return "No se pudo generar el texto del Reel con Gemini. Detalle: " + m.slice(0, 220)
}

/* ── MODO regenerar SOLO la narración (voz en off) de un storyboard existente ──
   No toca los visuales: reescribe el guion para que Zak pida otra versión si no
   le gustó, opcionalmente desde otro Códice de Luz. ──────────────────────────── */

const NARRATION_REGEN_SYSTEM = `Eres el "Visionario Arquitecto", motor de IA del Atelier de Contenido. Tu tarea AHORA es escribir SOLO la NARRACIÓN (voz en off) de un Reel de Instagram que YA existe: NO tocas los visuales ni el concepto, solo entregas un guion de voz en off NUEVO.

La narración es el corazón del Reel: una semilla de consciencia, un láser de luz que disuelve la pesadez — con verdad y amor sereno, NUNCA con frialdad. Para el canal zakhaar: la muerte no existe (solo cambias de frecuencia), tú das forma a tu realidad, la calma del Estado Cero, el cuerpo elevándose hasta volverse luz, el contacto sereno con civilizaciones de luz. Para veo: voz cálida y cercana, sin tecnicismos ni precios.

🌉 PUENTE DE LENGUAJE (lo más importante): lumínico pero entendible por cualquiera. PROHIBIDO usar "Silicio", "Carbono", "Hardware", "función de onda", "Toroide" como tecnicismos — habla de vibración, frecuencia, luz, energía, paz, estado cero, cero fricción. Un término poético solo si lo explicas en la misma frase. NUNCA menciones "Visión Extra Ocular", "VEO", "Telekinesis", servicios, agenda ni precios.

RITMO (clave para la voz): tono oracular, sereno, íntimo — un medio-susurro hablado, lento, NUNCA una lectura de corrida. Frases cortas, comas y puntos que dejen respirar. SOLO el texto hablado: sin acotaciones de escena, sin emojis, sin hashtags.

Responde EXCLUSIVAMENTE un objeto JSON válido (sin texto antes/después, sin fences markdown):
{
  "narration": "el guion de voz en off completo, español neutro, lenguaje humano, listo para ElevenLabs",
  "pulso_nucleo": "oración corta del concepto central. Si te di un Códice de Luz: EXACTAMENTE el 'titulo' de la enseñanza elegida. Si no: una frase breve del concepto del Reel."
}`

function buildNarrationRegenPrompt(
    category: "veo" | "zakhaar",
    durationSec: number,
    conceptTitle: string,
    narrative: string,
    prevNarration: string,
    codice: { title: string; author: string; digest: any } | null,
    recentCodicePulsos: string[]
): string {
    const wordsMid = Math.round(durationSec * 2.2)
    const wordsLo = Math.round(wordsMid * 0.85)
    const wordsHi = Math.round(wordsMid * 1.15)

    let codiceBlock = ""
    if (codice) {
        const d = codice.digest ?? {}
        const ens = Array.isArray(d?.ensenanzas) ? d.ensenanzas : []
        const frases = Array.isArray(d?.frases) ? d.frases : []
        const ensLines = ens
            .map(
                (e: any, i: number) =>
                    `${i + 1}. ${String(e?.titulo ?? "").trim()} — ${String(
                        e?.idea ?? ""
                    ).trim()}`
            )
            .join("\n")
        const frasesLine = frases.length
            ? `\nFRASES DEL LIBRO (puedes usar o adaptar): ${frases
                  .slice(0, 10)
                  .map((f: any) => String(f).trim())
                  .join(" · ")}`
            : ""
        const evitar = recentCodicePulsos.length
            ? `\nENSEÑANZAS YA USADAS en otros Reels de este libro (NO las repitas, elige otra):\n${recentCodicePulsos
                  .map((p, i) => `${i + 1}. ${p}`)
                  .join("\n")}`
            : ""
        codiceBlock = `

CÓDICE DE LUZ — FUENTE OBLIGATORIA DE LA NARRACIÓN: "${String(
            codice.title ?? ""
        ).trim()}"${codice.author ? ` (${String(codice.author).trim()})` : ""}.
La narración desarrolla UNA enseñanza de ESTE LIBRO, fiel a su esencia y su voz, en lenguaje humano (Puente de Lenguaje).
ESENCIA DEL LIBRO: ${String(d?.esencia ?? "").trim()}
VOZ DEL LIBRO: ${String(d?.voz ?? "").trim()}
ENSEÑANZAS DEL LIBRO (elige UNA y conviértela en la narración):
${ensLines}${frasesLine}${evitar}
🜂 Elige UNA sola enseñanza. El "pulso_nucleo" DEBE ser EXACTAMENTE su "titulo".`
    }

    const prevBlock = prevNarration
        ? `

NARRACIÓN ANTERIOR (NO te gustó — NO la repitas: entrega un ENFOQUE DISTINTO, otras imágenes y otro fraseo${
              codice ? ", idealmente desde OTRA enseñanza del libro" : ""
          }):
"${prevNarration.slice(0, 1400)}"`
        : ""

    return `Reescribe SOLO la narración (voz en off) de este Reel ya existente. Canal: ${
        category === "veo"
            ? "veo (VTLI, cálido y cercano)"
            : "zakhaar (Zak'Haar Solar, oracular)"
    }.
CONCEPTO DEL REEL: "${conceptTitle}".${
        narrative
            ? `\nARCO VISUAL (solo para contexto, NO lo narres literal): ${narrative.slice(
                  0,
                  600
              )}`
            : ""
    }${codiceBlock}${prevBlock}

Entrega una narración NUEVA y distinta, ajustada a una duración total de ~${durationSec}s — aproximadamente ${wordsLo}-${wordsHi} palabras (respétalo: una voz lenta no entra si te pasas). Devuelve SOLO el objeto JSON con "narration" y "pulso_nucleo".`
}

// Misma cascada robusta de callGeminiText (modelos vivos + thinkingBudget:0 +
// timeout por intento) pero parsea { narration, pulso_nucleo }.
async function callGeminiNarration(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<{ narration: string; pulso_nucleo: string }> {
    const startedAt = Date.now()
    const reqBody = JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
        },
    })

    let lastErr: any = null
    for (const { model, attempts } of GEMINI_TEXT_CASCADE) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            const remaining = TEXT_TOTAL_DEADLINE_MS - (Date.now() - startedAt)
            if (remaining < 6000) {
                throw (
                    lastErr ?? new Error("Gemini narración: presupuesto agotado")
                )
            }
            const controller = new AbortController()
            const timeoutId = setTimeout(
                () => controller.abort(),
                Math.min(TEXT_ATTEMPT_TIMEOUT_MS, remaining)
            )
            try {
                const res = await fetch(`${geminiTextUrl(model)}?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: reqBody,
                    signal: controller.signal,
                })
                if (!res.ok) {
                    const errBody = await res.text()
                    lastErr = new Error(
                        `Gemini narración ${res.status} (${model}): ${errBody.slice(0, 300)}`
                    )
                    if (res.status < 500 || res.status >= 600) break
                    const waitMs =
                        Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                        Math.floor(Math.random() * 400)
                    await sleep(waitMs)
                    continue
                }
                const data = await res.json()
                const text =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
                if (!text) throw new Error("respuesta vacía")
                const objStr = isolateJsonObject(text)
                if (!objStr) throw new Error("JSON de narración incompleto")
                const parsed = JSON.parse(objStr)
                const narration = String(parsed?.narration ?? "").trim()
                if (!narration) throw new Error("narración vacía")
                return {
                    narration,
                    pulso_nucleo: String(parsed?.pulso_nucleo ?? "").trim(),
                }
            } catch (err: any) {
                lastErr = err
                const waitMs =
                    Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                    Math.floor(Math.random() * 400)
                await sleep(waitMs)
                continue
            } finally {
                clearTimeout(timeoutId)
            }
        }
    }
    throw lastErr ?? new Error("Gemini narración: agotado")
}

// Aísla el PRIMER objeto JSON balanceado desde el primer "{", contando llaves y
// respetando strings/escapes. Robusto cuando el modelo añade caracteres DESPUÉS
// del objeto → evita el "Unexpected non-whitespace character after JSON".
function isolateJsonObject(s: string): string | null {
    const start = s.indexOf("{")
    if (start === -1) return null
    let depth = 0
    let inStr = false
    let esc = false
    for (let i = start; i < s.length; i++) {
        const ch = s[i]
        if (esc) {
            esc = false
            continue
        }
        if (ch === "\\") {
            esc = true
            continue
        }
        if (ch === '"') {
            inStr = !inStr
            continue
        }
        if (inStr) continue
        if (ch === "{") depth++
        else if (ch === "}") {
            depth--
            if (depth === 0) return s.slice(start, i + 1)
        }
    }
    return null // no cerró (respuesta truncada)
}

function extractStoryboard(raw: string): RawStoryboard {
    let cleaned = raw.trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
    }
    const firstBrace = cleaned.indexOf("{")
    const lastBrace = cleaned.lastIndexOf("}")
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error(`Sin JSON detectable: ${cleaned.slice(0, 200)}`)
    }
    // Parser balanceado primero (ignora texto extra tras el objeto); si no cerró
    // (truncado) cae al slice clásico como último recurso.
    const objStr =
        isolateJsonObject(cleaned) ?? cleaned.slice(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(objStr)
    const sb = parsed?.storyboard ?? parsed

    const kfRaw = Array.isArray(sb?.keyframes) ? sb.keyframes : []
    const keyframes: RawKeyframe[] = kfRaw.map((k: any) => ({
        beat_label: String(k?.beat_label ?? "Cuadro"),
        copy_line: String(k?.copy_line ?? ""),
        prompt_image: String(k?.prompt_image ?? k?.prompt_nano_banana ?? ""),
        prompt_animation: String(
            k?.prompt_animation ?? k?.prompt_grok ?? ""
        ),
        // Solo episodios (los reels no traen escenas → null).
        scene_index: Number.isFinite(Number(k?.scene_index))
            ? Math.max(1, Math.round(Number(k.scene_index)))
            : null,
        scene_label: k?.scene_label ? String(k.scene_label) : null,
    }))

    // Score musical (solo episodios): tolerante — si el modelo no lo trajo, null.
    const scRaw = sb?.score
    const score: RawScore | null =
        scRaw && (scRaw.style || scRaw.title)
            ? {
                  title: String(scRaw.title ?? "Score del episodio"),
                  style: String(scRaw.style ?? ""),
                  exclude_styles: String(scRaw.exclude_styles ?? ""),
                  weirdness: Math.max(
                      0,
                      Math.min(100, Math.round(Number(scRaw.weirdness ?? 30)))
                  ),
                  style_influence: Math.max(
                      0,
                      Math.min(
                          100,
                          Math.round(Number(scRaw.style_influence ?? 70))
                      )
                  ),
                  notes: String(scRaw.notes ?? ""),
              }
            : null

    return {
        concept_title: String(sb?.concept_title ?? "Storyboard"),
        target: String(sb?.target ?? "uncategorized"),
        narrative: String(sb?.narrative ?? ""),
        narration: String(sb?.narration ?? sb?.voiceover ?? ""),
        caption_instagram: String(
            sb?.caption_instagram ?? sb?.caption ?? ""
        ),
        hashtags: String(sb?.hashtags ?? ""),
        pulso_nucleo: String(sb?.pulso_nucleo ?? ""),
        escena_mundo: String(sb?.escena_mundo ?? ""),
        keyframes,
        score,
    }
}

interface GeneratedImage {
    bytes: Uint8Array
    mimeType: string
}

// callGeminiImage EXTENDIDO: acepta refImages[] que se mandan como
// inlineData de ENTRADA antes del texto. Es lo que da consistencia de
// cara: el keyframe 0 se pasa como referencia para generar 1..N.
async function callGeminiImage(
    apiKey: string,
    visualPrompt: string,
    refImages: GeneratedImage[] = [],
    deadlineAt?: number // timestamp absoluto: no arrancar intentos pasada esta hora
): Promise<GeneratedImage> {
    const hasRef = refImages.length > 0
    // El estilo fotorrealista se antepone SIEMPRE, server-side, así no depende
    // de que el modelo de texto lo haya escrito (causa del look "caricatura").
    const fullText = PHOTO_REAL_PREFIX + visualPrompt

    let lastErr: any = null
    // 9:16 por imageConfig (Reels). Si la API lo rechaza con un 4xx que no sea
    // rate limit, caemos SIN imageConfig para no perder el cuadro (mejor
    // horizontal que nada).
    let imageConfigOn = true
    for (let attempt = 0; attempt < MAX_RETRIES_IMAGE; attempt++) {
        // Deadline global: si no queda margen, cortamos YA (no arrancamos un
        // intento que el runtime mataría a mitad → draft atascado).
        const remaining =
            deadlineAt !== undefined ? deadlineAt - Date.now() : Infinity
        if (remaining <= 3000) {
            throw (
                lastErr ?? new Error("Gemini image: deadline global alcanzado")
            )
        }
        // FALLBACK SIN-REFERENCIA: el ÚLTIMO intento, si veníamos con ancla, se
        // manda como texto→imagen (sin inlineData). image→image en el modelo
        // flash es lo que se cuelga; text→image (igual que el ancla) casi nunca.
        // Sacrifica algo de consistencia de cara con tal de NO dejar el cuadro
        // vacío — el texto ya describe al ser, así sale parecido.
        const dropRef = hasRef && attempt === MAX_RETRIES_IMAGE - 1
        const useRef = hasRef && !dropRef
        const parts: any[] = []
        if (useRef) {
            for (const ref of refImages) {
                parts.push({
                    inlineData: {
                        mimeType: ref.mimeType,
                        data: uint8ToBase64(ref.bytes),
                    },
                })
            }
        }
        parts.push({ text: fullText })
        if (dropRef) {
            console.warn(
                "[storyboard:image] fallback SIN-REFERENCIA (los intentos con ancla colgaron) — texto→imagen"
            )
        }
        // Timeout según el TIPO: con-ref corto (atrapa cuelgues rápido), sin-ref
        // largo (deja terminar la generación legítima de ~37s).
        const baseTimeout = useRef
            ? IMAGE_TIMEOUT_WITHREF_MS
            : IMAGE_TIMEOUT_NOREF_MS
        const perAttemptTimeout = Math.min(baseTimeout, remaining)
        const controller = new AbortController()
        const timeoutId = setTimeout(
            () => controller.abort(),
            perAttemptTimeout
        )
        try {
            const url = `${GEMINI_IMAGE_ENDPOINT}?key=${apiKey}`
            const genConfig: any = imageConfigOn
                ? {
                      responseModalities: ["IMAGE"],
                      imageConfig: { aspectRatio: "9:16" },
                  }
                : { responseModalities: ["IMAGE"] }
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts }],
                    generationConfig: genConfig,
                }),
                signal: controller.signal,
            })

            if (!res.ok) {
                const errBody = await res.text()
                // Rate limit (429) o error de servidor (5xx) → reintento con
                // backoff (más largo para 429: el cupo por minuto de Nano Banana
                // necesita tiempo para liberarse). ESTA es la causa de que
                // fallen CADA VEZ MÁS imágenes al generar/rescatar muchas
                // seguidas: antes un 429 fallaba al instante sin reintentar.
                const transient = res.status === 429 || res.status >= 500
                if (transient && attempt < MAX_RETRIES_IMAGE - 1) {
                    const base = RETRY_DELAYS_MS[attempt] ?? 2000
                    const delay = res.status === 429 ? base * 3 : base
                    console.warn(
                        `[storyboard:image] ${res.status} retry ${attempt + 1} (espera ${delay}ms)`,
                        errBody.slice(0, 200)
                    )
                    await sleep(delay)
                    continue
                }
                // Otro 4xx (no rate limit) con imageConfig activo → reintento
                // SIN imageConfig por si el aspect ratio es lo que molesta.
                if (
                    res.status >= 400 &&
                    res.status < 500 &&
                    res.status !== 429 &&
                    imageConfigOn
                ) {
                    console.warn(
                        `[storyboard:image] ${res.status} con imageConfig — reintento sin aspect ratio`,
                        errBody.slice(0, 200)
                    )
                    imageConfigOn = false
                    continue
                }
                throw new Error(
                    `Gemini image ${res.status}: ${errBody.slice(0, 500)}`
                )
            }

            const data = await res.json()
            const parts2 = data?.candidates?.[0]?.content?.parts ?? []
            for (const part of parts2) {
                const inline = part?.inlineData ?? part?.inline_data
                if (inline?.data) {
                    return {
                        bytes: base64ToUint8(inline.data),
                        mimeType:
                            inline.mimeType ||
                            inline.mime_type ||
                            "image/png",
                    }
                }
            }
            throw new Error("Gemini image: no inline_data en respuesta")
        } catch (err: any) {
            lastErr = err
            const wasAborted =
                err?.name === "AbortError" ||
                String(err?.message ?? "").includes("aborted")
            if (wasAborted) {
                console.warn(
                    `[storyboard:image] TIMEOUT ${perAttemptTimeout}ms attempt ${attempt + 1} (${useRef ? "con-ref" : "sin-ref"})`
                )
            }
            if (attempt < MAX_RETRIES_IMAGE - 1) {
                await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                continue
            }
        } finally {
            clearTimeout(timeoutId)
        }
    }
    throw lastErr ?? new Error("Gemini image: agotado retries")
}

function base64ToUint8(b64: string): Uint8Array {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
}

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = ""
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, i + chunk) as any
        )
    }
    return btoa(binary)
}

/* ═══════════════════════════════════════════════════════════════
   5. R2 UPLOAD via AWS Signature V4 manual (Web Crypto API)
   ═══════════════════════════════════════════════════════════════ */

interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}

function bytesToHex(bytes: Uint8Array): string {
    let s = ""
    for (let i = 0; i < bytes.length; i++) {
        s += bytes[i].toString(16).padStart(2, "0")
    }
    return s
}

async function sha256Hex(data: Uint8Array | string): Promise<string> {
    const buf =
        typeof data === "string" ? new TextEncoder().encode(data) : data
    const hash = await crypto.subtle.digest("SHA-256", buf)
    return bytesToHex(new Uint8Array(hash))
}

async function hmacSha256(
    key: Uint8Array | string,
    msg: string
): Promise<Uint8Array> {
    const keyData =
        typeof key === "string" ? new TextEncoder().encode(key) : key
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const sig = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        new TextEncoder().encode(msg)
    )
    return new Uint8Array(sig)
}

function s3CanonicalPath(bucket: string, key: string): string {
    const segments = key.split("/").map((s) => encodeURIComponent(s))
    return `/${encodeURIComponent(bucket)}/${segments.join("/")}`
}

async function uploadImageToR2(
    cfg: R2Config,
    bytes: Uint8Array,
    key: string,
    contentType: string
): Promise<string> {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`
    const region = "auto"
    const service = "s3"
    const method = "PUT"

    const canonicalUri = s3CanonicalPath(cfg.bucket, key)
    const url = `https://${host}${canonicalUri}`
    const payloadHash = await sha256Hex(bytes)

    const now = new Date()
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)

    const canonicalHeaders =
        `content-type:${contentType}\n` +
        `host:${host}\n` +
        `x-amz-content-sha256:${payloadHash}\n` +
        `x-amz-date:${amzDate}\n`
    const signedHeaders =
        "content-type;host;x-amz-content-sha256;x-amz-date"

    const canonicalRequest =
        `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign =
        `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(
            canonicalRequest
        )}`

    const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp)
    const kRegion = await hmacSha256(kDate, region)
    const kService = await hmacSha256(kRegion, service)
    const kSigning = await hmacSha256(kService, "aws4_request")
    const signature = bytesToHex(await hmacSha256(kSigning, stringToSign))

    const authHeader =
        `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": contentType,
            "x-amz-content-sha256": payloadHash,
            "x-amz-date": amzDate,
            Authorization: authHeader,
        },
        body: bytes,
    })
    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`R2 PUT ${res.status}: ${txt.slice(0, 400)}`)
    }

    const encodedKey = key
        .split("/")
        .map((s) => encodeURIComponent(s))
        .join("/")
    const baseUrl = cfg.publicBaseUrl.replace(/\/+$/, "")
    return `${baseUrl}/${encodedKey}`
}

function todayDateString(): string {
    const d = new Date()
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(d.getUTCDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

/* ═══════════════════════════════════════════════════════════════
   6. SUPABASE HELPERS
   ═══════════════════════════════════════════════════════════════ */

interface SupabaseConfig {
    url: string
    anonKey: string
    serviceRoleKey: string
}

async function checkAdmin(
    cfg: SupabaseConfig,
    clerkUserId: string
): Promise<boolean> {
    const res = await fetch(
        `${cfg.url}/rest/v1/rpc/get_profile_by_clerk_id`,
        {
            method: "POST",
            headers: {
                apikey: cfg.anonKey,
                Authorization: `Bearer ${cfg.anonKey}`,
                "Content-Type": "application/json",
                Prefer: "params=single-object",
            },
            body: JSON.stringify({ p_clerk_id: clerkUserId }),
        }
    )
    if (!res.ok) {
        console.warn(`[storyboard:admin] check failed ${res.status}`)
        return false
    }
    const profile: any = await res.json()
    return Boolean(profile?.is_admin)
}

async function fetchRecentPulsos(
    cfg: SupabaseConfig,
    category: string,
    limit: number = PULSO_HISTORY_LIMIT
): Promise<string[]> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/rpc/get_recent_pulsos_nucleo_draft`,
            {
                method: "POST",
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    p_category: category,
                    p_limit: limit,
                }),
            }
        )
        if (!res.ok) return []
        const data: any = await res.json()
        const arr = data?.pulsos
        if (!Array.isArray(arr)) return []
        return arr.filter(
            (p: any) => typeof p === "string" && p.trim().length > 0
        )
    } catch {
        return []
    }
}

// Memoria anti-repetición de MUNDO + PALETA (mismo patrón que pulsos).
async function fetchRecentEscenas(
    cfg: SupabaseConfig,
    category: string,
    limit: number = 8
): Promise<string[]> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/rpc/get_recent_escenas_draft`,
            {
                method: "POST",
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    p_category: category,
                    p_limit: limit,
                }),
            }
        )
        if (!res.ok) return []
        const data: any = await res.json()
        const arr = data?.escenas
        if (!Array.isArray(arr)) return []
        return arr.filter(
            (p: any) => typeof p === "string" && p.trim().length > 0
        )
    } catch {
        return []
    }
}

function parseHashtagsString(raw: string): string[] {
    if (!raw) return []
    return raw
        .split(/\s+/)
        .map((h) => h.trim().replace(/^#/, ""))
        .filter((h) => h.length > 0)
}

// Trae el digest (concentrado) de un Códice de Luz por id (service role).
async function fetchCodiceDigest(
    cfg: SupabaseConfig,
    codiceId: string
): Promise<any | null> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/codices_luz?id=eq.${encodeURIComponent(
                codiceId
            )}&status=eq.ready&select=title,author,digest&limit=1`,
            {
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                },
            }
        )
        if (!res.ok) return null
        const rows: any[] = await res.json()
        return Array.isArray(rows) && rows[0] ? rows[0] : null
    } catch {
        return null
    }
}

// Carga un draft existente (para el modo regenerar narración). Trae solo lo que
// el reescritor de la voz en off necesita: concepto, arco, duración y la narración
// actual (para no repetirla), más la fuente vigente.
async function fetchDraftById(
    cfg: SupabaseConfig,
    draftId: string
): Promise<any | null> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/vtli_drafts?id=eq.${encodeURIComponent(
                draftId
            )}&select=id,category,concept_title,narrative,narration,pulso_nucleo,target_duration_sec,keyframes_count,codice_id&limit=1`,
            {
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                },
            }
        )
        if (!res.ok) return null
        const rows: any[] = await res.json()
        return Array.isArray(rows) && rows[0] ? rows[0] : null
    } catch {
        return null
    }
}

// Anti-repetición POR LIBRO: enseñanzas (pulso_nucleo) de storyboards recientes
// de ESTE códice, para no repetir la misma enseñanza entre Reels del libro.
async function fetchRecentCodicePulsos(
    cfg: SupabaseConfig,
    codiceId: string,
    limit = 12
): Promise<string[]> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/vtli_drafts?select=pulso_nucleo&codice_id=eq.${encodeURIComponent(
                codiceId
            )}&pulso_nucleo=not.is.null&order=generated_at.desc&limit=${limit}`,
            {
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                },
            }
        )
        if (!res.ok) return []
        const rows: any[] = await res.json()
        return rows
            .map((r) => String(r?.pulso_nucleo ?? "").trim())
            .filter(Boolean)
    } catch {
        return []
    }
}

// Inserta el draft padre, devuelve el row (con id).
async function insertDraft(
    cfg: SupabaseConfig,
    draft: Record<string, any>
): Promise<any> {
    const res = await fetch(`${cfg.url}/rest/v1/vtli_drafts`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify([draft]),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `Insert vtli_drafts ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    const rows = await res.json()
    return rows[0]
}

// Inserta los keyframes hijos, devuelve los rows (con ids, ordenados).
async function insertKeyframes(
    cfg: SupabaseConfig,
    rows: Record<string, any>[]
): Promise<any[]> {
    const res = await fetch(`${cfg.url}/rest/v1/vtli_draft_keyframes`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(rows),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `Insert vtli_draft_keyframes ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    const inserted = await res.json()
    return (inserted as any[]).sort((a, b) => a.beat_index - b.beat_index)
}

async function patchKeyframe(
    cfg: SupabaseConfig,
    keyframeId: string,
    patch: Record<string, any>
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_draft_keyframes?id=eq.${keyframeId}`,
        {
            method: "PATCH",
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
        }
    )
    if (!res.ok) {
        const errBody = await res.text()
        console.error(
            `[storyboard:patch-kf] ${res.status} for ${keyframeId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function patchDraft(
    cfg: SupabaseConfig,
    draftId: string,
    patch: Record<string, any>
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_drafts?id=eq.${draftId}`,
        {
            method: "PATCH",
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify(patch),
        }
    )
    if (!res.ok) {
        const errBody = await res.text()
        console.error(
            `[storyboard:patch-draft] ${res.status} for ${draftId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function fetchKeyframeById(
    cfg: SupabaseConfig,
    keyframeId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_draft_keyframes?id=eq.${keyframeId}&select=*`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return null
    const rows: any[] = await res.json()
    return rows[0] ?? null
}

// Trae un COLECTIVO (civilización) por id, para fijar el ser del storyboard.
async function fetchColectivoById(
    cfg: SupabaseConfig,
    colectivoId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_colectivos?id=eq.${colectivoId}&select=*`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return null
    const rows: any[] = await res.json()
    return rows[0] ?? null
}

async function fetchAmbienteById(
    cfg: SupabaseConfig,
    ambienteId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_ambientes?id=eq.${ambienteId}&select=*`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return null
    const rows: any[] = await res.json()
    return rows[0] ?? null
}

// Trae el keyframe ancla (beat_index 0) de un draft, con su image_r2_url.
async function fetchAnchorKeyframe(
    cfg: SupabaseConfig,
    draftId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_draft_keyframes?draft_id=eq.${draftId}&beat_index=eq.0&select=*`,
        {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        }
    )
    if (!res.ok) return null
    const rows: any[] = await res.json()
    return rows[0] ?? null
}

// Descarga una imagen (la referencia ancla) desde su URL pública R2.
async function downloadImage(url: string): Promise<GeneratedImage | null> {
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        const buf = new Uint8Array(await res.arrayBuffer())
        const mimeType = res.headers.get("content-type") || "image/png"
        return { bytes: buf, mimeType }
    } catch {
        return null
    }
}

/* ═══════════════════════════════════════════════════════════════
   7. BACKGROUND — generación de keyframes
   batch: keyframe 0 (ancla, sin ref) PRIMERO → luego 1..N EN PARALELO
          (cada uno con el ancla como ref) → al terminar PATCH status ready.
   retry: 1 solo cuadro con refs explícitos.
   Paralelizar evita que el wall-clock del edge function se agote sumando
   tiempos secuenciales (era la causa de que solo se generaran 2 de 4).
   ═══════════════════════════════════════════════════════════════ */

// 403 PERMISSION_DENIED de Gemini = bloqueo de facturación (la API de imagen
// es de pago). Se detecta para marcar el draft "payment_error".
function isPaymentError(reason: string): boolean {
    return (
        reason.includes("403") &&
        (reason.includes("PERMISSION_DENIED") ||
            reason.toLowerCase().includes("billing") ||
            reason.toLowerCase().includes("dunning"))
    )
}

async function generateKeyframesBackground(
    geminiKey: string,
    supabase: SupabaseConfig,
    r2: R2Config,
    draftId: string,
    keyframeRows: any[], // ordenados por beat_index, con prompt_image + id
    anchorOverride?: GeneratedImage, // para retry de un keyframe >0
    explicitRefs?: GeneratedImage[], // retry de 1 cuadro: refs exactos (puede ser [])
    deadlineOverride?: number, // hora límite absoluta (desde el inicio del request)
    colectivoImageUrl?: string | null // imagen del colectivo: siembra la cara del ancla
): Promise<void> {
    const startTs = Date.now()
    const today = todayDateString()
    // Deadline duro: ningún intento de imagen arranca después de esto, así el
    // trabajo SIEMPRE llega a su patchDraft final antes del wall-clock kill.
    // El caller pasa una hora límite medida desde el inicio del request (incluye
    // el tiempo que tardó la generación de texto); si no, caemos al cap local.
    const deadlineAt = deadlineOverride ?? startTs + BG_DEADLINE_MS
    console.log(
        `[storyboard:bg] draft ${draftId} — ${keyframeRows.length} keyframes (deadline ${BG_DEADLINE_MS}ms)`
    )

    // Genera UN cuadro (callGeminiImage ya trae timeout + reintentos internos),
    // lo sube a R2 y hace PATCH. Devuelve si fue ok y si vio error de pago.
    // NUNCA lanza: aísla la falla para no tumbar a los cuadros vecinos.
    const genOne = async (
        kf: any,
        refs: GeneratedImage[],
        kfDeadline?: number
    ): Promise<{ ok: boolean; paymentErr: boolean; img: GeneratedImage | null }> => {
        const tStart = Date.now()
        try {
            console.log(
                `[storyboard:bg] kf#${kf.beat_index} ${kf.id} (refs=${refs.length})…`
            )
            const img = await callGeminiImage(
                geminiKey,
                kf.prompt_image,
                refs,
                kfDeadline ?? deadlineAt
            )
            const ext = img.mimeType === "image/jpeg" ? "jpg" : "png"
            const key = `Veo tu Luz Interna/Imagenes/Atelier/${today}/${crypto.randomUUID()}.${ext}`
            const url = await uploadImageToR2(r2, img.bytes, key, img.mimeType)
            await patchKeyframe(supabase, kf.id, { image_r2_url: url })
            console.log(
                `[storyboard:bg] kf#${kf.beat_index} ✓ (${Date.now() - tStart}ms)`
            )
            return { ok: true, paymentErr: false, img }
        } catch (err: any) {
            const reason = String(err?.message ?? err)
            console.error(
                `[storyboard:bg] kf#${kf.beat_index} FAILED (${Date.now() - tStart}ms): ${reason}`
            )
            return { ok: false, paymentErr: isPaymentError(reason), img: null }
        }
    }

    // ── RETRY de 1 cuadro: explicitRefs definido (puede ser []). Genera ese
    //    cuadro y deja el draft en ready (o payment_error si falló por pago).
    if (explicitRefs !== undefined) {
        const kf = keyframeRows[0]
        const r = await genOne(kf, explicitRefs)
        await patchDraft(supabase, draftId, {
            status: r.paymentErr ? "payment_error" : "storyboard_ready",
        })
        console.log(
            `[storyboard:bg] retry kf#${kf.beat_index} done in ${Date.now() - startTs}ms (ok=${r.ok})`
        )
        return
    }

    // ── BATCH: ancla PRIMERO (es la referencia de cara/identidad), el resto
    //    EN PARALELO. El ancla debe existir antes de lanzar los demás.
    // Si el colectivo tiene imagen guardada, la bajamos UNA vez para sembrar
    // el ancla con los rasgos de especie (la descarga vive en el background,
    // no en la respuesta del request).
    const colectivoRef = colectivoImageUrl
        ? await downloadImage(colectivoImageUrl)
        : null
    if (colectivoImageUrl) {
        console.log(
            `[storyboard:bg] draft ${draftId} — colectivo ref ${colectivoRef ? "OK" : "no se pudo bajar"} (${colectivoImageUrl})`
        )
    }
    let anchor: GeneratedImage | null = anchorOverride ?? null
    const anchorRow = keyframeRows.find((k) => k.beat_index === 0)
    const restRows = keyframeRows.filter((k) => k.beat_index !== 0)
    let sawPaymentError = false

    if (anchorRow && !anchor) {
        // Si el colectivo trae imagen guardada, la usamos como REFERENCIA del
        // ancla (siembra los rasgos de especie). callGeminiImage tiene fallback
        // sin-referencia: si image→image se cuelga, el último intento cae a
        // texto→imagen, así el ancla NUNCA queda colgada por usar la referencia.
        const anchorRefs = colectivoRef ? [colectivoRef] : []
        // Episodio (scene_index presente): el COLD OPEN lo dirige el modelo en su
        // propio prompt — sin directiva genérica de "plano establecedor".
        const anchorPrompt =
            (anchorRow.scene_index != null ? "" : shotDirectiveForBeat(0)) +
            (colectivoRef ? COLECTIVO_REF_CLAUSE : "") +
            "\n\n" +
            anchorRow.prompt_image
        const r = await genOne(
            { ...anchorRow, prompt_image: anchorPrompt },
            anchorRefs
        )
        if (r.ok && r.img) {
            anchor = r.img
        } else {
            // La ancla falló. Si fue por PAGO, no hay nada que reintentar.
            // Si se COLGÓ (raro: text→image es el modo estable), NO abortamos a
            // "rejected": dejamos el draft "storyboard_ready" con todo vacío para
            // que el auto-retry SERIAL del panel lo rescate desde el beat 0 (la
            // ancla, fresh sin referencia) y luego encadene el resto con esa
            // ancla ya generada como referencia. Así NINGÚN cuadro queda muerto.
            await patchDraft(supabase, draftId, {
                status: r.paymentErr ? "payment_error" : "storyboard_ready",
            })
            console.error(
                `[storyboard:bg] draft ${draftId} — ancla falló (${r.paymentErr ? "payment_error" : "queda para auto-retry del panel"})`
            )
            return
        }
    }

    // Resto con CONCURRENCIA LIMITADA (pool de IMAGE_CONCURRENCY), cada uno con
    // el ancla como referencia. Lanzar TODOS a la vez saturaba Nano Banana y los
    // dejaba colgados (throttle silencioso) — la causa de los cuadros que nunca
    // aparecían. El pool corre de a 2; cada cuadro recibe su PROPIO presupuesto
    // de tiempo (PER_KF_BUDGET_MS) para que uno colgado no se coma a los demás.
    const refs = anchor ? [anchor] : []
    const queue = restRows.slice()
    const runWorker = async () => {
        for (;;) {
            const kf = queue.shift()
            if (!kf) return
            const kfDeadline = Math.min(
                deadlineAt,
                Date.now() + PER_KF_BUDGET_MS
            )
            const r = await genOne(
                {
                    ...kf,
                    // Episodio: la cámara/escenario los dicta el propio prompt
                    // (continuidad por escenas) — solo se protege la identidad.
                    prompt_image:
                        (kf.scene_index != null
                            ? EPISODE_COMPOSITION_CLAUSE
                            : shotDirectiveForBeat(kf.beat_index) +
                              REF_COMPOSITION_CLAUSE) +
                        "\n\n" +
                        kf.prompt_image,
                },
                refs,
                kfDeadline
            )
            if (r.paymentErr) sawPaymentError = true
        }
    }
    const workerCount = Math.min(IMAGE_CONCURRENCY, queue.length)
    await Promise.all(
        Array.from({ length: workerCount }, (_, i) =>
            sleep(i * IMAGE_STAGGER_MS).then(runWorker)
        )
    )

    await patchDraft(supabase, draftId, {
        status: sawPaymentError ? "payment_error" : "storyboard_ready",
    })
    console.log(
        `[storyboard:bg] draft ${draftId} done in ${Date.now() - startTs}ms (pool ${IMAGE_CONCURRENCY}, ${restRows.length} cuadros)`
    )
}

// ── MODO "SOLO PROMPTS" (manual): NO genera imágenes por API. Para cada cuadro
//    ENSAMBLA el prompt de imagen COMPLETO (el mismo que iría a Nano Banana:
//    estilo luminoso + dirección de cámara + cláusula de referencia si aplica +
//    escena) y lo guarda en prompt_image, listo para copiar/pegar a mano. Marca
//    el draft 'prompts_ready' (el rescate automático del panel lo ignora → cero
//    gasto de API).
// NOTA: el recordatorio "sube la imagen del colectivo y copia solo sus rasgos
// de especie" es una instrucción para el HUMANO que genera la imagen a mano, NO
// para Nano Banana. Por eso NO se inyecta dentro del prompt (ensuciaría el
// copy-paste). El panel del Estudio Manual la muestra como una nota aparte en el
// cuadro #1 cuando hay un colectivo elegido. El prompt queda listo para pegar.

function buildManualImagePrompt(
    kf: any,
    selfContained: boolean
): string {
    // Episodio (scene_index presente): la dirección de cámara la escribe el
    // modelo en el propio prompt (gramática de escenas) → sin directiva genérica;
    // los cuadros 1..N llevan la cláusula de escena (identidad + escenario del
    // prompt) en vez de la de "fondo totalmente distinto".
    const isEpisode = kf.scene_index != null
    const shot = isEpisode ? "" : shotDirectiveForBeat(kf.beat_index)
    // En "reference" los cuadros 1..N asumen que el usuario sube la imagen del
    // cuadro 0; por eso llevan la cláusula "usa la referencia solo para la cara".
    // En "self" no hay referencia → sin cláusula (el prompt ya repite al ser).
    const refClause = isEpisode
        ? kf.beat_index !== 0
            ? EPISODE_COMPOSITION_CLAUSE
            : ""
        : !selfContained && kf.beat_index !== 0
        ? REF_COMPOSITION_CLAUSE
        : ""
    return (
        VERTICAL_DIRECTIVE_HEAD +
        PHOTO_REAL_PREFIX +
        shot +
        refClause +
        "\n\n" +
        kf.prompt_image +
        VERTICAL_DIRECTIVE_TAIL
    )
}

async function assemblePromptsOnly(
    supabase: SupabaseConfig,
    draftId: string,
    keyframeRows: any[],
    selfContained: boolean,
    colectivoName?: string | null
): Promise<void> {
    for (const kf of keyframeRows) {
        const full = buildManualImagePrompt(kf, selfContained)
        await patchKeyframe(supabase, kf.id, { prompt_image: full })
    }
    await patchDraft(supabase, draftId, { status: "prompts_ready" })
    console.log(
        `[storyboard:prompts] draft ${draftId} — ${keyframeRows.length} prompts ensamblados (modo manual, ${selfContained ? "self" : "reference"}${colectivoName ? ", colectivo " + colectivoName : ""})`
    )
}

function dispatchBackground(fn: Promise<void>) {
    const hasWaitUntil =
        typeof EdgeRuntime !== "undefined" &&
        typeof EdgeRuntime?.waitUntil === "function"
    if (hasWaitUntil) {
        EdgeRuntime.waitUntil(fn)
    } else {
        fn.catch((e) => console.error("[storyboard:bg] crashed", e))
    }
}

// Red de seguridad: envuelve el trabajo de fondo para que CUALQUIER error
// inesperado (un throw fuera de los try internos, un fallo de red en un PATCH,
// etc.) igual marque el draft terminado — NUNCA se queda atascado en
// "generando". Lo que se generó queda; lo que no, sale como "No se generó".
function safeBackground(
    fn: Promise<void>,
    supabase: SupabaseConfig,
    draftId: string
): Promise<void> {
    return fn.catch(async (e: any) => {
        console.error(
            `[storyboard:bg] error inesperado en draft ${draftId}: ${String(e?.message ?? e)}`
        )
        try {
            await patchDraft(supabase, draftId, { status: "storyboard_ready" })
        } catch {
            /* nada más que hacer */
        }
    })
}

/* ═══════════════════════════════════════════════════════════════
   8. MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    admin_clerk_id?: string
    category?: "veo" | "zakhaar"
    target_duration_sec?: number
    keyframes_count?: number // 4/5/6 (nuevo selector); si no, se deriva de duración
    seconds_per_keyframe?: number // 6 o 10 (duración del clip animado por cuadro)
    retry_keyframe_image_for_id?: string | null
    retry_variation?: "ligera" | "grande" | "fresh" | null
    image_mode?: "api" | "prompts" // "prompts" = solo textos; imágenes a mano
    prompt_style?: "self" | "reference" // solo aplica en modo "prompts"
    // "episodio" = mini-episodio cinematográfico por ESCENAS (90s/2min/3min,
    // 9/12/18 cuadros de 10s) con arco de 3 actos + score de Suno. Default reel.
    format?: "reel" | "episodio"
    colectivo_id?: string | null // civilización guardada a usar como protagonista
    ambiente_id?: string | null // entorno guardado a usar como escenario
    codice_id?: string | null // Códice de Luz: la narración desarrolla una enseñanza del libro
    // MODO regenerar SOLO la narración de un storyboard existente (los visuales no
    // se tocan). Cuando viene este id, codice_id indica con qué fuente reescribir
    // la voz en off (un Códice de Luz o null = semillas de Sexta Densidad).
    regenerate_narration_for_id?: string | null
}

const VALID_CATEGORIES = new Set(["veo", "zakhaar"])

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request) => {
    // Hora de inicio del request: la generación de imágenes de fondo no puede
    // pasarse de reqStartTs + FUNCTION_WALL_BUDGET_MS (incluye el texto), así
    // el runtime nunca mata la función a mitad y el draft no queda atascado.
    const reqStartTs = Date.now()
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    const missingSecrets: string[] = []
    if (!GEMINI_API_KEY) missingSecrets.push("GEMINI_API_KEY")
    if (!SUPABASE_URL) missingSecrets.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missingSecrets.push("SUPABASE_ANON_KEY")
    if (!SUPABASE_SERVICE_ROLE_KEY)
        missingSecrets.push("SUPABASE_SERVICE_ROLE_KEY")
    if (!R2_ACCOUNT_ID) missingSecrets.push("R2_ACCOUNT_ID")
    if (!R2_ACCESS_KEY_ID) missingSecrets.push("R2_ACCESS_KEY_ID")
    if (!R2_SECRET_ACCESS_KEY) missingSecrets.push("R2_SECRET_ACCESS_KEY")
    if (!R2_BUCKET) missingSecrets.push("R2_BUCKET")
    if (!R2_PUBLIC_BASE_URL) missingSecrets.push("R2_PUBLIC_BASE_URL")
    if (missingSecrets.length) {
        return jsonResponse(500, {
            error: "missing_secrets",
            missing: missingSecrets,
        })
    }

    let body: RequestBody
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    let adminClerkId = ""

    const supabase: SupabaseConfig = {
        url: SUPABASE_URL!,
        anonKey: SUPABASE_ANON_KEY!,
        serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
    }
    const r2: R2Config = {
        accountId: R2_ACCOUNT_ID!,
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
        bucket: R2_BUCKET!,
        publicBaseUrl: R2_PUBLIC_BASE_URL!,
    }

    // Ola C · #3 Fase 3: token de Clerk verificado server-side, sin fallback.
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    // AUDITORÍA PARTE 4 — gobernador de gasto (Gemini texto + Nano Banana
    // imagen). Único choke point tras el gate: cubre regenerar narración,
    // retry de keyframe y el batch/reroll de storyboard por igual.
    if (
        !(await reserveSpend(
            "generate-vtli-storyboard",
            adminClerkId,
            12,
            86400,
            30,
            86400
        ))
    ) {
        return jsonResponse(429, { error: "rate_limited" })
    }

    /* ── MODO regenerar SOLO la narración de un storyboard existente ─────
       Reescribe la voz en off (otra versión, opcionalmente desde otro Códice
       de Luz) sin tocar los visuales. ──────────────────────────────────── */
    const regenNarrId = body.regenerate_narration_for_id?.trim() || null
    if (regenNarrId) {
        const draft = await fetchDraftById(supabase, regenNarrId)
        if (!draft) return jsonResponse(404, { error: "draft_not_found" })

        const cat: "veo" | "zakhaar" =
            draft.category === "veo" ? "veo" : "zakhaar"
        const durationSec =
            Number(draft.target_duration_sec) > 0
                ? Number(draft.target_duration_sec)
                : DEFAULT_DURATION_SEC

        // Fuente con la que reescribir: el panel manda codice_id (el del draft por
        // defecto, null = Sexta Densidad, o el de OTRO libro). Si no viene la
        // propiedad, caemos al códice actual del draft.
        const reqCodiceId =
            body.codice_id === undefined
                ? draft.codice_id ?? null
                : body.codice_id || null

        let codice: { title: string; author: string; digest: any } | null = null
        if (reqCodiceId) {
            const cd = await fetchCodiceDigest(supabase, reqCodiceId)
            if (cd) {
                codice = {
                    title: String(cd.title ?? ""),
                    author: String(cd.author ?? ""),
                    digest: cd.digest ?? {},
                }
            }
        }
        const effCodiceId = codice ? reqCodiceId : null
        const recentPulsos = effCodiceId
            ? await fetchRecentCodicePulsos(supabase, effCodiceId)
            : []

        let out: { narration: string; pulso_nucleo: string }
        try {
            const userPrompt = buildNarrationRegenPrompt(
                cat,
                durationSec,
                String(draft.concept_title ?? ""),
                String(draft.narrative ?? ""),
                String(draft.narration ?? ""),
                codice,
                recentPulsos
            )
            out = await callGeminiNarration(
                GEMINI_API_KEY!,
                NARRATION_REGEN_SYSTEM,
                userPrompt
            )
        } catch (err: any) {
            console.error("[storyboard] narration regen failed", err)
            return jsonResponse(502, {
                error: humanizeTextError(err),
                detail: String(err?.message ?? err),
            })
        }

        // Guarda la narración nueva + la fuente vigente. pulso_nucleo solo se
        // actualiza si vino de un Códice (mantiene la anti-repetición por libro);
        // sin códice no se toca para no romper el tag del storyboard.
        const patch: Record<string, any> = {
            narration: out.narration,
            codice_id: effCodiceId,
        }
        if (effCodiceId && out.pulso_nucleo) patch.pulso_nucleo = out.pulso_nucleo
        await patchDraft(supabase, regenNarrId, patch)

        return jsonResponse(200, {
            narration: out.narration,
            codice_id: effCodiceId,
            pulso_nucleo:
                effCodiceId && out.pulso_nucleo ? out.pulso_nucleo : null,
        })
    }

    /* ── MODO retry de UN keyframe ──────────────────────────────── */
    const retryKfId = body.retry_keyframe_image_for_id?.trim() || null
    if (retryKfId) {
        const kf = await fetchKeyframeById(supabase, retryKfId)
        if (!kf) return jsonResponse(404, { error: "keyframe_not_found" })
        const prompt = String(kf.prompt_image ?? "").trim()
        if (!prompt) {
            return jsonResponse(422, { error: "missing_prompt_image" })
        }
        // Grado de variación del reintento:
        //  · "fresh"  → el cuadro NO se generó (o se pide explícito): se
        //    regenera DESDE CERO con su PROPIO prompt + el ancla SOLO como
        //    referencia de cara/identidad (igual que el batch para kf#1..N).
        //    NO clona el ancla — ESTE era el bug del Reintentar de cuadros
        //    fallidos (mandaba "ligera" → ancla como ref + "copia casi
        //    idéntica" → salía un clon del cuadro 0).
        //  · "grande" → cambio notorio de ángulo/encuadre/pose; ancla = cara.
        //  · "ligera" → re-toma cercana de su PROPIA imagen actual.
        // BLINDAJE: si el cuadro no tiene imagen propia, SIEMPRE es "fresh"
        // (ligera/grande necesitan una imagen existente que variar).
        const requested =
            body.retry_variation === "grande"
                ? "grande"
                : body.retry_variation === "fresh"
                ? "fresh"
                : "ligera"
        const variation: "fresh" | "grande" | "ligera" = !kf.image_r2_url
            ? "fresh"
            : requested
        // El prompt guardado NO se altera (los sufijos viven solo en memoria).
        let effectivePrompt = prompt
        let refImg: GeneratedImage | undefined = undefined

        // Para fresh y grande forzamos un ÁNGULO distinto (igual que el batch) +
        // la aclaración de que la referencia es SOLO identidad. SIN esto, un
        // cuadro regenerado clonaba al ancla (bug "la #3 salió igual que la #1").
        // Episodio (scene_index presente): sin directiva genérica de cámara — el
        // prompt del cuadro trae su escena; solo cláusula de identidad+escena.
        const shotPrefix =
            kf.scene_index != null
                ? kf.beat_index !== 0
                    ? EPISODE_COMPOSITION_CLAUSE + "\n\n"
                    : ""
                : kf.beat_index !== 0
                ? shotDirectiveForBeat(kf.beat_index) +
                  REF_COMPOSITION_CLAUSE +
                  "\n\n"
                : shotDirectiveForBeat(0) + "\n\n"

        if (variation === "fresh") {
            // Su PROPIO prompt + dirección de cámara distinta + ancla SOLO como
            // cara (cuadro >0). El cuadro 0 fresco va sin referencia.
            effectivePrompt = shotPrefix + prompt
            if (kf.beat_index !== 0) {
                const anchorRow = await fetchAnchorKeyframe(supabase, kf.draft_id)
                if (anchorRow?.image_r2_url) {
                    const dl = await downloadImage(anchorRow.image_r2_url)
                    if (dl) refImg = dl
                }
            }
        } else if (variation === "grande") {
            effectivePrompt = shotPrefix + prompt + VARIATION_SUFFIX_GRANDE
            if (kf.beat_index !== 0) {
                const anchorRow = await fetchAnchorKeyframe(supabase, kf.draft_id)
                if (anchorRow?.image_r2_url) {
                    const dl = await downloadImage(anchorRow.image_r2_url)
                    if (dl) refImg = dl
                }
            }
        } else {
            // ligera: la PROPIA imagen actual del cuadro (existe, ya chequeado).
            effectivePrompt = prompt + VARIATION_SUFFIX_LIGERA
            const dl = await downloadImage(kf.image_r2_url)
            if (dl) refImg = dl
            if (!refImg && kf.beat_index !== 0) {
                const anchorRow = await fetchAnchorKeyframe(supabase, kf.draft_id)
                if (anchorRow?.image_r2_url) {
                    const dl2 = await downloadImage(anchorRow.image_r2_url)
                    if (dl2) refImg = dl2
                }
            }
        }
        const explicitRefs: GeneratedImage[] = refImg ? [refImg] : []

        await patchKeyframe(supabase, retryKfId, { image_r2_url: null })
        dispatchBackground(
            safeBackground(
                generateKeyframesBackground(
                    GEMINI_API_KEY!,
                    supabase,
                    r2,
                    kf.draft_id,
                    [{ ...kf, prompt_image: effectivePrompt }],
                    undefined,
                    explicitRefs,
                    reqStartTs + FUNCTION_WALL_BUDGET_MS
                ),
                supabase,
                kf.draft_id
            )
        )
        return jsonResponse(200, {
            success: true,
            mode: "retry_keyframe_image",
            keyframe_id: retryKfId,
            variation,
        })
    }

    /* ── MODO batch (nuevo storyboard) ──────────────────────────── */
    if (!body.category || !VALID_CATEGORIES.has(body.category)) {
        return jsonResponse(400, { error: "invalid_category" })
    }
    const category = body.category
    // Cuadros y segundos-por-cuadro (nuevo selector del panel). La narración se
    // escala a la duración TOTAL = cuadros × segundos/cuadro. Por compatibilidad,
    // si no llega keyframes_count, se deriva de target_duration_sec (spk=10).
    const format: "reel" | "episodio" =
        body.format === "episodio" ? "episodio" : "reel"
    const spk = [6, 10].includes(Number(body.seconds_per_keyframe))
        ? Number(body.seconds_per_keyframe)
        : 10
    const explicitCount = Math.round(Number(body.keyframes_count))
    let keyframesCount: number
    if (format === "episodio") {
        // Episodio: el panel manda 9/12/18 (= 90s/2min/3min a 10s por cuadro).
        keyframesCount =
            explicitCount >= EPISODE_MIN_KEYFRAMES &&
            explicitCount <= EPISODE_MAX_KEYFRAMES
                ? explicitCount
                : 9
    } else if (
        explicitCount >= MIN_KEYFRAMES &&
        explicitCount <= MAX_KEYFRAMES
    ) {
        keyframesCount = explicitCount
    } else {
        const legacyDur = Math.max(
            20,
            Math.min(
                Number(body.target_duration_sec ?? DEFAULT_DURATION_SEC) ||
                    DEFAULT_DURATION_SEC,
                90
            )
        )
        keyframesCount = keyframesForDuration(legacyDur)
    }
    const durationSec = keyframesCount * spk
    // Modo de imagen: "prompts" (solo textos, imágenes a mano en Nano Banana) o
    // "api" (genera las imágenes por API, comportamiento de siempre). En modo
    // "prompts"+"self" los prompts son AUTO-SUFICIENTES (cada uno repite al ser);
    // en "reference" (o en API) se apoya en la imagen del cuadro 0 como referencia.
    const imageMode = body.image_mode === "prompts" ? "prompts" : "api"
    const promptStyle = body.prompt_style === "self" ? "self" : "reference"
    const selfContained = imageMode === "prompts" && promptStyle === "self"
    // Colectivo (civilización) opcional: si viene, fija el ser del storyboard.
    let colectivo:
        | {
              name: string
              species_traits: string
              individual_variation: string | null
          }
        | null = null
    // URL de la imagen del colectivo (si tiene): siembra el ancla en modo API.
    let colectivoImageUrl: string | null = null
    const colectivoId = body.colectivo_id?.trim() || null
    if (colectivoId) {
        const c = await fetchColectivoById(supabase, colectivoId)
        if (c) {
            colectivo = {
                name: String(c.name ?? ""),
                species_traits: String(c.species_traits ?? ""),
                individual_variation: c.individual_variation ?? null,
            }
            colectivoImageUrl = c.image_r2_url
                ? String(c.image_r2_url)
                : null
        }
    }

    // Ambiente (entorno) opcional: si viene, fija el escenario del storyboard.
    let ambiente:
        | {
              name: string
              scene_traits: string
              variation: string | null
          }
        | null = null
    const ambienteId = body.ambiente_id?.trim() || null
    if (ambienteId) {
        const a = await fetchAmbienteById(supabase, ambienteId)
        if (a) {
            ambiente = {
                name: String(a.name ?? ""),
                scene_traits: String(a.scene_traits ?? ""),
                variation: a.variation ?? null,
            }
        }
    }

    // Códice de Luz opcional: si viene, la narración desarrolla una enseñanza del
    // libro destilado y la anti-repetición es POR LIBRO (no por categoría).
    let codice: { title: string; author: string; digest: any } | null = null
    const codiceId = body.codice_id?.trim() || null
    if (codiceId) {
        const cd = await fetchCodiceDigest(supabase, codiceId)
        if (cd) {
            codice = {
                title: String(cd.title ?? ""),
                author: String(cd.author ?? ""),
                digest: cd.digest ?? {},
            }
        }
    }
    const effectiveCodiceId = codice ? codiceId : null

    const [recentPulsos, recentEscenas] = await Promise.all([
        effectiveCodiceId
            ? fetchRecentCodicePulsos(supabase, effectiveCodiceId)
            : fetchRecentPulsos(supabase, category),
        fetchRecentEscenas(supabase, category),
    ])

    let sb: RawStoryboard
    try {
        const userPrompt = buildStoryboardUserPrompt(
            category,
            keyframesCount,
            durationSec,
            spk,
            recentPulsos,
            recentEscenas,
            selfContained,
            colectivo,
            ambiente,
            codice,
            format
        )
        sb = await callGeminiText(
            GEMINI_API_KEY!,
            format === "episodio"
                ? VTLI_STORYBOARD_SYSTEM + EPISODE_SYSTEM_ADDENDUM
                : VTLI_STORYBOARD_SYSTEM,
            userPrompt,
            format === "episodio" ? 16000 : 12000
        )
    } catch (err: any) {
        console.error("[storyboard] copy gen failed", err)
        return jsonResponse(502, {
            error: humanizeTextError(err),
            detail: String(err?.message ?? err),
        })
    }

    // Recortar / validar la cantidad de keyframes
    let kfs = sb.keyframes
    if (kfs.length > keyframesCount) kfs = kfs.slice(0, keyframesCount)
    if (kfs.length === 0) {
        return jsonResponse(502, { error: "no_keyframes_generated" })
    }

    // EPISODIO: normalizar escenas (nunca retroceden; huecos se heredan del
    // cuadro previo; si el modelo no las trajo, todo cae a la escena 1).
    if (format === "episodio") {
        let cur = 1
        let lastLabel: string | null = null
        kfs = kfs.map((k) => {
            let si = k.scene_index
            if (!si || si < cur) si = cur
            cur = si
            const label = k.scene_label || lastLabel
            lastLabel = label
            return { ...k, scene_index: si, scene_label: label }
        })
    }

    // CTA fijo al cierre del caption (zakhaar → Códices de Luz; veo → Cancún
    // presencial). El modelo escribió el cuerpo SIN CTA; el handler le pega el
    // texto fijo VERBATIM (sin paráfrasis). Termina en "\n.\n." para separar de
    // los hashtags. Garantiza que el llamado a la acción sea SIEMPRE el correcto.
    if (category === "zakhaar") {
        const cta = pickAppCta()
        const body = (sb.caption_instagram || "").trimEnd()
        sb.caption_instagram = body ? `${body}\n\n${cta}` : cta
    } else if (category === "veo") {
        const body = (sb.caption_instagram || "").trimEnd()
        sb.caption_instagram = body ? `${body}\n\n${VEO_CTA}` : VEO_CTA
    }

    // INSERT draft padre (status generating)
    let draftRow: any
    try {
        draftRow = await insertDraft(supabase, {
            category,
            target: sb.target,
            concept_title: sb.concept_title,
            narrative: sb.narrative,
            narration: sb.narration,
            caption: sb.caption_instagram,
            hashtags: parseHashtagsString(sb.hashtags),
            pulso_nucleo: sb.pulso_nucleo,
            escena_mundo: sb.escena_mundo,
            colectivo_name: colectivo?.name ?? null,
            ambiente_name: ambiente?.name ?? null,
            codice_id: effectiveCodiceId,
            target_duration_sec: durationSec,
            keyframes_count: kfs.length,
            status: "generating",
            generated_by_clerk_id: adminClerkId,
            // Solo episodios mandan las columnas nuevas (los reels no las tocan
            // → si la migración 20260710 no está pegada, el modo reel NO rompe).
            ...(format === "episodio"
                ? { format: "episodio", score_json: sb.score ?? null }
                : {}),
        })
    } catch (err: any) {
        console.error("[storyboard] insert draft failed", err)
        return jsonResponse(500, {
            error: "db_insert_draft_failed",
            detail: String(err?.message ?? err),
        })
    }

    // INSERT keyframes hijos (image_r2_url null)
    let keyframeRows: any[]
    try {
        keyframeRows = await insertKeyframes(
            supabase,
            kfs.map((k, idx) => ({
                draft_id: draftRow.id,
                beat_index: idx,
                beat_label: k.beat_label,
                copy_line: k.copy_line,
                prompt_image: k.prompt_image,
                prompt_animation: k.prompt_animation,
                anim_status: "idle",
                ...(format === "episodio"
                    ? {
                          scene_index: k.scene_index ?? 1,
                          scene_label: k.scene_label,
                      }
                    : {}),
            }))
        )
    } catch (err: any) {
        console.error("[storyboard] insert keyframes failed", err)
        // El draft quedó sin hijos; lo marcamos rejected.
        await patchDraft(supabase, draftRow.id, { status: "rejected" })
        return jsonResponse(500, {
            error: "db_insert_keyframes_failed",
            detail: String(err?.message ?? err),
        })
    }

    // MODO "SOLO PROMPTS" (manual): ensamblar los prompts completos y marcar
    // 'prompts_ready'. NO se genera NINGUNA imagen por API → costo de imagen $0.
    if (imageMode === "prompts") {
        dispatchBackground(
            safeBackground(
                assemblePromptsOnly(
                    supabase,
                    draftRow.id,
                    keyframeRows,
                    selfContained,
                    colectivo?.name ?? null
                ),
                supabase,
                draftRow.id
            )
        )
        return jsonResponse(200, {
            success: true,
            async: true,
            mode: "prompts",
            prompt_style: promptStyle,
            category,
            duration_sec: durationSec,
            keyframes_count: keyframeRows.length,
            pulsos_inyectados: recentPulsos.length,
            draft: { ...draftRow, keyframes: keyframeRows },
            message:
                "Storyboard en modo SOLO PROMPTS. Ensamblando los prompts de imagen (listos para copiar/pegar en Nano Banana a mano). Sin generación por API.",
        })
    }

    // MODO API: ancla primero → resto con concurrencia limitada, con deadline
    // duro desde el inicio del request (nunca se pasa del wall-clock del runtime)
    // y red de seguridad que garantiza que el draft nunca quede atascado.
    dispatchBackground(
        safeBackground(
            generateKeyframesBackground(
                GEMINI_API_KEY!,
                supabase,
                r2,
                draftRow.id,
                keyframeRows,
                undefined,
                undefined,
                reqStartTs + FUNCTION_WALL_BUDGET_MS,
                colectivoImageUrl
            ),
            supabase,
            draftRow.id
        )
    )

    return jsonResponse(200, {
        success: true,
        async: true,
        category,
        duration_sec: durationSec,
        keyframes_count: keyframeRows.length,
        pulsos_inyectados: recentPulsos.length,
        draft: { ...draftRow, keyframes: keyframeRows },
        message:
            "Storyboard insertado. Keyframes generándose en background (ancla primero, luego el resto con referencia). Polling a get_vtli_drafts_by_ids hasta que image_r2_url se popule.",
    })
})
