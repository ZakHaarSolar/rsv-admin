// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// generate-zakhaar-carousel/index.ts v1.15
// v1.15 — ARQUITECTURA DE DIÁLOGO ASCENDENTE (Directriz Maestra de Zak,
//         2026-07-06): el lane manga_dialogo se rige AHORA por la MECÁNICA DE
//         3 FASES en cualquier modo — (1) Premisa Contemplativa (pregunta
//         semilla desde el asombro), (2) Anclaje Analógico (UNA Metáfora de
//         Mecánica Universal: física simple y correcta que explica la verdad),
//         (3) Colapso de la Certeza (axioma corto que expande la mente). La
//         información no flota: colisiona con la materia. PROHIBIDO el drama
//         (queja/sufrimiento/problemas mundanos) y el lenguaje religioso;
//         los personajes operan en pura ascendencia. TRAVESÍA se REDEFINE
//         (de la pregunta al axioma; ya NO herida→luz — roles El que Pregunta /
//         El que Revela); COHERENCIA co-construye la analogía entre pares.
//         + Anti-repetición de ANALOGÍA: campo nuevo analogia_campo en el JSON
//         → se anexa al pulso_nucleo guardado ("· analogía: X") → el historial
//         prohíbe repetir el campo físico. + El bloque de Códice siembra el
//         anclaje analógico con la metáfora del libro solo si es física.
// v1.14 — CÓDICES DE LUZ: el carrusel puede generarse desde un libro de Zak
//         (param codice_id). Se carga el concentrado (digest) del códice, el
//         modelo elige UNA de sus enseñanzas y la dramatiza en el estilo/modo
//         elegido, FIEL al libro; la anti-repetición (pulso_nucleo = título de la
//         enseñanza) se filtra POR LIBRO. Se persiste codice_id. (migración
//         20260624_codices_luz.sql + edge distill-codice).
// v1.13 — Fix del 502 que volvió: (a) gemini-2.0-flash está DECOMISIONADO (404)
//         y era el último respaldo → se quitó de la cascada; (b) se lidera con
//         gemini-flash-latest (alias vivo, el de decode-dream) + más intentos por
//         modelo (5/5/4) y backoff hasta 9s → la cascada aguanta un pico de
//         saturación (503 en todos los flash) en vez de rendirse en ~16s.
// v1.12 — (1) Aspect ratio fiable: cada prompt ABRE y CIERRA con la etiqueta
//         "Aspect Ratio: 4:5" (Nano Banana respeta la etiqueta, no el párrafo
//         verboso "tipo Instagram" que dejaba salir 3:4 o 9:16). Fuera el marco
//         "Instagram" del formato. (2) Anti copy-paste de fondo en DIÁLOGO: el
//         lane manga_dialogo usa ESCENARIO_DIALOGO_BLOCK — la conversación puede
//         quedarse en UN mismo lugar, pero cada lámina DEBE cambiar el ángulo de
//         cámara/plano (nunca el fondo idéntico de la lámina anterior).
// v1.11 — Anti-cuelgue (502 copy_generation_failed a los ~78s): se apaga el
//         "thinking" del modelo (thinkingConfig.thinkingBudget:0) → un run sano
//         cierra en ~20-35s en vez de comerse el timeout pensando; + CASCADA de
//         modelos (gemini-3.5-flash → 2.5-flash → 2.0-flash) con backoff+jitter y
//         tope global de wall-clock; maxOutputTokens 16000→12000, timeout por
//         intento 78s→50s. Mismo patrón que decode-dream.
// v1.10 — Manga Diálogo ahora tiene DOS modos narrativos elegibles (param
//         dialogo_mode): "travesia" (arco emocional herida→luz, el actual,
//         default) y "coherencia" (COHERENCIA PURA: seres ya en su centro, sin
//         dolor ni rescate; el diálogo despliega una verdad y enciende por
//         reconocimiento/belleza). La guía del lane manga_dialogo pasó a ser
//         NEUTRAL al modo (reparto/visual/mecánica/cierre); el arco + tono viven
//         en bloques por modo (DIALOGO_MODE_TRAVESIA / DIALOGO_MODE_COHERENCIA).
//         Se persiste dialogo_mode por carrusel (migración
//         20260623_zakhaar_dialogo_mode.sql).
// v1.9 — CTA de app reescrito (6 pilares + Avatar de Luz + decodificadores + "No
//        es un test: es tu compañero de evolución" + "Ya en la App Store · Link en bio").
// v1.8 — Texto del CTA de app actualizado ("Esto es apenas el umbral… Disponible
//        ya en la App Store! Link en Bio").
// v1.7 — CTA del caption ahora invita a la app con el texto fijo de Zak (umbral +
//        "Escáner Vibracional" + descárgala en el link de la bio). Lámina final
//        del iPhone: subtítulo en 2 líneas (Escanea y calibra tu frecuencia /
//        Comprende tu estado energético y armoniza tu entorno) + botón "Descárgala ahora".
// v1.6 — (a) VARIEDAD VISUAL en ambos lanes manga: ruleta de MUNDOS (prohíbe el
//        espacio-vacío por defecto) + ruleta de ATUENDOS (prohíbe la túnica
//        blanca) inyectadas en el system; el promptPrefix ya no fija "escena
//        cósmica". (b) Diálogo MUY emotivo de ALTA VIBRACIÓN (arco dolor→luz, no
//        triste). (c) Fix del bug del diálogo: parser de objeto JSON balanceado
//        (isolateJsonObject) + maxOutputTokens 16000 + timeout 78s (cliente 175s).
//        (d) Slide final del iPhone: título "Escáner Vibracional" + subtítulo
//        "Escanea tu frecuencia y la de tu entorno" + "Descárgala ya · link en bio".
// v1.5 — NUEVO estilo "Manga Diálogo": cómic espiritual donde 2 personajes muy
//        variados (mecanismo anti-clon de 3 cerrojos) sostienen UNA conversación
//        con arco (dolor concreto → revelación) en globos de cómic; enseñanzas
//        Bashar/Ley del Uno encarnadas, sin sermón. Comparte el cierre del iPhone
//        (MANGA_LANES). Texto LIMPIO: ya no se citan los textos a renderizar con
//        comillas angulares («»); strip server-side de «» en todos los slides.
// v1.4 — Manga Astral: enseñanzas a NIVEL Bashar (Darryl Anka) + La Ley del Uno
//        (Ra) destiladas en lenguaje aterrizado (sin meter los libros — el modelo
//        ya conoce ambas fuentes; se le dan los principios núcleo como ancla, $0
//        extra por input). CTA del caption cambia de Códices → invitación a
//        descargar la app "Escáner Vibracional". El ÚLTIMO slide del Manga deja
//        de ser "pregunta + comentarios": ahora es la lámina de cierre con el
//        render del iPhone mostrando la app (asume que se suben el logo + una
//        captura de la pantalla de inicio como referencias) + badge App Store.
// v1.3 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// v1.2 — Estilos: se quitan "Códice de Silicio" y "Tablilla Solar"; queda
//        "Vitral Cuántico" y se suma "Manga Astral" (ilustración espiritual
//        narrativa de alta vibración con el TEXTO renderizado sobre la imagen;
//        cierra con pregunta + "Déjalo en los comentarios"). Fallback → vitral.
// v1.1 — Anti-cuelgue: timeout duro de 70s en la llamada de texto (AbortController),
//        maxOutputTokens 16000→8192, retries 5→3 y prompts más concisos (~80
//        palabras) → la generación termina rápido en vez de irse a minutos y
//        agotar el wall-clock. Antes el botón quedaba colgado "Generando…".
// generate-zakhaar-carousel/index.ts v1.0
// Atelier · Zak'Haar Posts — motor de CARRUSELES de Instagram (5-8 slides).
//
// Modo SOLO PROMPTS (sin API de imagen, costo $0): el motor diseña el
// concepto del carrusel y entrega, por cada slide, el prompt LIMPIO listo
// para copiar/pegar en Nano Banana (plan Pro). La NOTA DE REFERENCIA —qué
// slide previo subir como referencia para conservar el MISMO ser— viaja en
// un campo APARTE (director_note), NUNCA dentro del prompt de Nano Banana.
//
// ESTILO ÚNICO de marca, elegible entre 3 lanes:
//   · silicio  → "Códice de Silicio" · fotografía fotorrealista de cine
//   · tablilla → "Tablilla Solar"     · editorial tipográfico de lujo (texto)
//   · vitral   → "Vitral Cuántico"    · ilustración holográfica ornamental
//
// Cada slide se renderiza en el lane elegido (prefijo duro server-side, como
// el PHOTO_REAL_PREFIX del Estudio Manual) → coherencia visual entre slides.
//
// Flujo: admin gate → memoria anti-repetición (pulsos recientes) → Gemini
// 3.5 Flash (1 llamada de texto, JSON) → ensambla cada prompt con el prefijo
// del estilo + formato 4:5 → INSERT carousel + slides (status prompts_ready)
// → devuelve el carrusel ya listo (sin polling, todo sincrónico).
//
// Persistencia: zakhaar_carousels + zakhaar_carousel_slides (migración
// 20260606_zakhaar_carruseles.sql). Sin R2 ni API de imagen en esta versión.
//
// Deploy: supabase functions deploy generate-zakhaar-carousel --no-verify-jwt
// Secrets: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

import { gateAdmin } from "../_shared/clerkAuth.ts"

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Cascada de modelos (v1.11): si el primario está saturado (503/timeout) baja al
// siguiente. Mismo patrón que decode-dream. CLAVE: el "thinking" del modelo se
// apaga en el generationConfig (thinkingBudget:0) → un run sano cierra en ~20-35s
// en vez de comerse el timeout entero pensando (causa de los 502 a los ~78s).
// gemini-2.0-flash quedó FUERA: está decomisionado (404 NOT_FOUND) y mataba la
// cascada cuando los flash estaban saturados. Lideramos con gemini-flash-latest
// (alias siempre-vivo que usa decode-dream) + más intentos por modelo para
// aguantar un pico de saturación (503) en vez de rendirnos en ~16s.
const GEMINI_TEXT_CASCADE: { model: string; attempts: number }[] = [
    { model: "gemini-3.6-flash", attempts: 5 },
    { model: "gemini-3.5-flash", attempts: 5 },
    { model: "gemini-2.5-flash", attempts: 4 },
]
const geminiTextUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`
// Timeout POR INTENTO (con thinking apagado un run sano cierra antes) + tope
// GLOBAL del wall-clock (el cliente del panel corta a 175s; cerramos antes).
const TEXT_ATTEMPT_TIMEOUT_MS = 50_000
const TEXT_TOTAL_DEADLINE_MS = 135_000
const PULSO_HISTORY_LIMIT = 12

const MIN_SLIDES = 5
const MAX_SLIDES = 8
const DEFAULT_SLIDES = 6

/* ═══════════════════════════════════════════════════════════════
   1. FORMATO 4:5 (carrusel feed portrait) — se antepone/cierra cada prompt
   ═══════════════════════════════════════════════════════════════ */

const FORMAT_HEAD = `Aspect Ratio: 4:5

[FORMATO DE IMAGEN — Aspect Ratio 4:5 · OBLIGATORIO]
Relación de aspecto 4:5 EXACTA: vertical / retrato, más alta que ancha (1080×1350 px). Si tu herramienta tiene selector de proporción, elige 4:5. PROHIBIDO cuadrada 1:1, PROHIBIDO 9:16, PROHIBIDO 16:9, PROHIBIDO horizontal o panorámica. Toda la composición cabe dentro del marco 4:5.

`

const FORMAT_TAIL = `

[Aspect Ratio: 4:5 — recordatorio final: la imagen DEBE salir en relación de aspecto 4:5 (vertical, retrato, 1080×1350). NUNCA 1:1, 9:16, 16:9 ni horizontal.]`

/* ═══════════════════════════════════════════════════════════════
   2. LOS 3 ESTILOS DE MARCA — Zak'Haar
   promptPrefix → directiva DURA que se antepone a cada prompt (copy-paste).
   guidance     → instrucciones al modelo de cómo escribir la ESCENA en ese lane.
   ═══════════════════════════════════════════════════════════════ */

interface StyleDef {
    key: string
    label: string
    promptPrefix: string
    guidance: string
}

const STYLE_MANGA: StyleDef = {
    key: "manga",
    label: "Manga Astral · Ilustración espiritual narrativa (texto sobre la imagen)",
    promptPrefix: `[ESTILO FIJO — MANGA ASTRAL · ILUSTRACIÓN ESPIRITUAL DE ALTA VIBRACIÓN]
Ilustración digital espiritual estilo manga/anime cinematográfico (NO fotografía, NO render 3D plástico): line-art limpio y elegante combinado con pintura digital suave y glow luminoso, como un fotograma de anime épico-contemplativo de alta gama. Escena de ALTÍSIMA VIBRACIÓN ambientada en un MUNDO FANTÁSTICO concreto (el que indique cada escena: jardín celeste, selva sagrada, templo de cristal, montaña, océano de estrellas, bosque encantado, geoda, etc.), serena, sagrada y luminosa. Paleta de marca FIJA: azul nocturno profundo, índigo y púrpura, con teal/cian y magenta cósmico que IRRADIAN luz, god rays y partículas de luz dorada y cian. El cosmos estrellado puede asomar como CIELO o telón de fondo lejano, NUNCA como el escenario entero (NO uses galaxias/nebulosas/vacío estrellado como fondo por defecto). Atmósfera onírica del DESPERTAR — JAMÁS oscura, siniestra ni de terror.
SUJETO: figuras humanas o seres serenos (meditando, contemplando, con el tercer ojo o energía de luz irradiando de la cabeza o las manos), o paisajes cósmico-ancestrales (templos en la selva, ventanas a otros mundos, islas flotantes, hélice de ADN de luz, estelas talladas). Bellos, apacibles, de alta frecuencia.
TEXTO SOBRE LA IMAGEN (OBLIGATORIO): integra el texto indicado RENDERIZADO sobre la ilustración, en tipografía blanca GRUESA (bold) y de gran tamaño, perfectamente legible, colocada en el espacio negativo (cielo, zonas despejadas) SIN tapar el rostro del sujeto. El texto debe estar PERFECTO, sin faltas de ortografía, nítido. Es un post que se LEE encima de la imagen. Aspect Ratio 4:5 (retrato), con cielo/espacio amplio para el texto. REGLA DE TEXTO: renderiza SOLO las palabras del mensaje, limpias e integradas a la escena; NUNCA dibujes comillas, comillas angulares, corchetes ni ningún símbolo de cita alrededor del texto.
ESCENA Y TEXTO:`,
    guidance: `Es un carrusel NARRATIVO ilustrado estilo manga astral: cada slide es una ESCENA cósmica de alta vibración que ILUSTRA y acompaña su texto, avanzando como una pequeña historia del DESPERTAR a lo largo de los slides (la imagen "narra" el mensaje). El sujeto puede recurrir (un mismo viajero del alma) o evolucionar en paisajes que progresan — tú decides según la historia.

NIVEL DE LAS ENSEÑANZAS (LO MÁS IMPORTANTE): cada lámina entrega UNA verdad nuclear con la PROFUNDIDAD de las enseñanzas de Bashar (canalizado por Darryl Anka) y de La Ley del Uno (Ra), pero dicha en lenguaje LLANO y ATERRIZADO — sin citar fuentes, sin nombres propios, sin jerga esotérica, sin sonar a sermón ni a new-age vacío. Bebe de estos pozos (elige UNA verdad por lámina y redáctala simple, como para alguien que despierta hoy):
• Eres el Universo / la Fuente conociéndose a sí mismo a través de ti; no estás separado de nada.
• Todo es Uno: lo que ves afuera refleja lo que eres adentro; el otro eres tú mirándote desde otro punto de vista.
• Tu experiencia sigue a tus creencias: cambia lo que das por verdad y cambias lo que vives.
• Sigue tu entusiasmo más alto (eso que más te enciende), actúa en él con lo que tengas a la mano y suelta el resultado: esa es tu brújula.
• Solo existe el ahora; tu poder vive en este instante, no en el pasado ni en el futuro.
• Lo que llamas "problema" es un catalizador: te muestra lo que falta integrar para que elijas el amor.
• Siempre estás eligiendo; tu libre albedrío es sagrado. Te sirves y sirves al todo cuando estás en equilibrio.
• Eres conciencia eterna viviendo una experiencia; morir es cambiar de frecuencia, no terminar.
Frases CORTAS que se sientan en el cuerpo. Una verdad por lámina, aplicable hoy.

En CADA prompt_image de enseñanza: (1) describe en ~60-70 palabras la escena ilustrada manga-cósmica (sujeto, acción serena, entorno, luz, paleta azul/púrpura/cian/magenta); (2) indica EXACTAMENTE el texto que va RENDERIZADO sobre la imagen escribiéndolo en una línea propia tras la etiqueta "Texto a renderizar (límpio, sin comillas ni símbolos):" — ese texto es la enseñanza de la lámina y es el MISMO que pones en copy_line (1 a 3 frases cortas por slide). NUNCA envuelvas ese texto en comillas, comillas angulares ni símbolos: solo las palabras.

ARCO: el slide #1 (Portada) abre con un gancho potente; los intermedios desarrollan el recordatorio con las verdades de arriba. El ÚLTIMO slide es el CIERRE-INVITACIÓN: NO cierres con pregunta ni con "déjalo en los comentarios". Su copy_line es una invitación CÁLIDA y potente a descubrir la propia frecuencia con la app "Escáner Vibracional" (ejemplos de tono: Tu frecuencia tiene un número. Descúbrelo. / Mide tu luz en las 6 áreas de tu vida.). IMPORTANTE: el motor REEMPLAZA el VISUAL de ese último slide por el render oficial del iPhone con la app — así que para el último slide tú SOLO escribe su copy_line (la invitación); lo que pongas en su prompt_image se ignora.

Mantén el MISMO estilo manga astral y la paleta en TODOS los slides de enseñanza — esa consistencia es la marca. director_note casi siempre vacío; úsalo SOLO si un slide de enseñanza debe conservar al MISMO personaje de un slide anterior (ahí dile a Zak que suba esa imagen como referencia).`,
}

const STYLE_MANGA_DIALOGO: StyleDef = {
    key: "manga_dialogo",
    label: "Manga Diálogo · Conversación ilustrada profunda (globos de cómic)",
    promptPrefix: `[ESTILO FIJO — MANGA DIÁLOGO · CÓMIC ESPIRITUAL DE ALTA VIBRACIÓN CON GLOBOS]
Ilustración digital espiritual estilo manga/anime cinematográfico (NO fotografía, NO render 3D plástico): line-art limpio y elegante combinado con pintura digital suave y glow luminoso, como una viñeta de manga astral épico-contemplativo de alta gama. Escena de ALTÍSIMA VIBRACIÓN ambientada en un MUNDO FANTÁSTICO concreto (el que indique cada escena: jardín celeste, selva sagrada, templo de cristal, montaña, océano de estrellas, bosque encantado, geoda, etc.), serena, sagrada y luminosa. Paleta de marca FIJA: azul nocturno profundo, índigo y púrpura, con teal/cian y magenta cósmico que IRRADIAN luz, god rays y partículas de luz dorada y cian. El cosmos estrellado puede asomar como CIELO o telón de fondo lejano, NUNCA como el escenario entero (NO uses galaxias/nebulosas/vacío estrellado como fondo por defecto). Atmósfera onírica del DESPERTAR — JAMÁS oscura, siniestra ni de terror.
ESTO ES UN CÓMIC, NO UN PÓSTER: en CADA lámina hay PERSONAJES que CONVERSAN. Encuadra como viñeta de manga con planos variados (primer plano de un rostro, plano medio de dos seres frente a frente, plano general de ambos bajo un cielo inmenso). La expresión facial y el lenguaje corporal deben LEERSE con claridad: el que duda mira hacia abajo o de reojo con los hombros caídos; el que revela tiene gesto sereno, mano abierta y mirada cálida. Aspect Ratio 4:5 (retrato, 1080×1350). Deja AIRE LIBRE intencional arriba y a los lados (cielo, zonas despejadas) para los globos, sin tapar los rostros.
GLOBOS DE DIÁLOGO (OBLIGATORIO): integra el diálogo dentro de GLOBOS DE CÓMIC manga, blancos, limpios y nítidos, cada uno con su colita apuntando claramente a la boca del personaje que habla, para que se entienda QUIÉN dice qué. Máximo DOS globos por lámina; si hay dos, ordénalos de arriba-izquierda hacia abajo-derecha (lectura natural) y en zonas distintas para que no se encimen. Tipografía oscura GRUESA (bold), de buen tamaño, perfectamente legible, nítida y SIN faltas de ortografía. Texto CORTO: una o dos frases breves por globo.
TEXTO ABSOLUTAMENTE LIMPIO dentro del globo: SOLO las palabras. Está PROHIBIDO renderizar comillas, comillas angulares, corchetes, paréntesis, guiones, asteriscos o cualquier símbolo alrededor del texto; PROHIBIDO imprimir el nombre del personaje dentro del globo (la colita ya indica quién habla).
PERSONAJES ÚNICOS Y DISTINTIVOS: cada ser se describe POR ENTERO en este mismo prompt (arquetipo/especie, edad aparente, género, color de piel/pelaje/cristal, cabello, ojos, vestimenta o energía, y un rasgo único memorable) para que la imagen funcione SOLA. Los seres son bellos y de altísima frecuencia, pero VARIADOS entre sí y RECONOCIBLES; deben contrastar en especie, edad, escala o paleta para leerse de inmediato quién es quién. PROHIBIDO el cliché del humanoide de luz sereno genérico repetido: cada personaje tiene identidad visual propia e inconfundible. Mantenlos idénticos en todas las láminas de este carrusel (mismo rostro, color, peinado y ropa).
ESCENA Y DIÁLOGO:`,
    guidance: `Escribes un carrusel tipo CÓMIC / MANGA ESPIRITUAL: a lo largo de todas las láminas transcurre UNA SOLA conversación viva entre los MISMOS personajes, que AVANZA viñeta a viñeta como una escena de manga real. NO son frases sueltas: es UN diálogo que PROGRESA. Tu función profunda aquí es ser el LENTE DE SÍNTESIS: traduces conceptos de alta frecuencia a un formato hiper-digerible, profundo y estético para una mente común que despierta hoy. La información NO debe flotar: debe COLISIONAR con la materia — por eso el corazón de cada carrusel es una analogía FÍSICA (ver Arquitectura). Lenguaje LLANO, cálido, de tú a tú, en español neutro (tú, nunca voseo). Las verdades profundas EMERGEN del diálogo de forma natural, en boca de los personajes; NUNCA se recitan como clase ni sermón. Los ROLES y el sabor emocional los define el MODO NARRATIVO (bloque aparte, más abajo); la ARQUITECTURA DE 3 FASES y las LEYES DE EXCLUSIÓN de aquí abajo son LEY en cualquier modo.

=== REPARTO (siempre) ===
Normalmente DOS personajes (tres solo si la historia lo pide). Sus PAPELES (quién siembra la premisa, quién trae la analogía, o si la co-construyen) los fija el MODO NARRATIVO de más abajo. Aquí lo innegociable: que sean VARIADOS entre sí, reconocibles, con VOZ propia, y SIEMPRE en ascendencia — serenos, contemplativos, maravillados. Test de voz: si intercambias quién dice qué y no chirría, no tienen voz.

=== MECANISMO ANTI-CLON (resuelve la queja real: los personajes salen siempre parecidos) ===
Antes de escribir, ELIGE el elenco con TRES cerrojos:
1) RULETA DE ARQUETIPOS OBLIGATORIA. Los dos personajes de un mismo carrusel deben ser de FAMILIAS DISTINTAS entre sí y NUNCA caer en el humanoide-de-luz por defecto. Familias y ejemplos:
   (a) HUMANOS reales y diversos: anciana andina de manto rojo, joven afro con rastas de luz, hombre maduro de barba con turbante, niña de ojos enormes, monje calvo de túnica naranja, viajera pelirroja con pecas, abuelo del este de Asia, nómada del desierto con velo índigo.
   (b) SERES ESTELARES no-humanos específicos: ser de cristal facetado violeta, entidad de agua estelar líquida, criatura de fuego suave dorado, ser geométrico de mandalas vivos, ser de piel azul con constelaciones bioluminiscentes, guardián con máscara solar.
   (c) ANIMALES-GUÍA serenos y parlantes: zorro de pelaje plateado y cola de cometa, búho de plumas de nebulosa, ciervo blanco de astas de luz, ballena cósmica, tortuga ancestral con caparazón de mapa estelar, gato de ojos de luna.
   (d) CRIATURAS CÓSMICAS/MÍTICAS: dragón sereno de escamas iridiscentes, fénix de plumas de aurora, ser-árbol de ramas-galaxia.
   (e) ARQUETIPOS-OBJETO vivos o ARQUETIPOS HUMANOS COTIDIANOS elevados: estrella o luna con rostro, jardinera de flores de luz, pescador en barca sobre un mar de galaxias, el yo-futuro radiante del que pregunta.
   REGLA DE CONTRASTE INTERNO: combina siempre dos familias diferentes (ej. niña + zorro cósmico; nómada + búho; viajera + ser de cristal) y que contrasten en edad, escala o paleta de su forma.
2) FICHA FÍSICA DISTINTIVA OBLIGATORIA. Cada personaje arranca con al menos 5 rasgos CONCRETOS: especie/arquetipo, edad aparente, género, color de piel/pelaje/cristal, cabello, ojos, vestimenta o accesorio sagrado, y UN rasgo único firma (cicatriz de luz, un ojo de otro color, mechón que flota como tinta, marca en la frente, animal acompañante). Sin ficha no hay personaje: prohibido el ser de luz sin cara. Esa ficha se REPITE textual en cada prompt_image.
3) ROTACIÓN ENTRE CARRUSELES. El historial reciente (pulso_nucleo) ya fuerza temas distintos; además tienes PROHIBIDO repetir el mismo par de arquetipos (familia, especie, edad y paleta de personaje) de carruseles recientes. Registra una pista del casting (ej. "duelo · niña humana + zorro cósmico") y estrena protagonistas reconociblemente diferentes cada vez. Solo se mantiene fija la estética manga cósmica de marca.

=== ARQUITECTURA ASCENDENTE — MECÁNICA DE 3 FASES (LEY en cualquier modo) ===
El carrusel ENTERO es un solo diálogo que recorre TRES fases en este orden. Con N láminas totales, las láminas #1 a #N-1 son diálogo (la #N la reemplaza el motor por la invitación a la app):

FASE 1 — LA PREMISA CONTEMPLATIVA (lámina #1; puede respirar hasta la #2):
Un personaje abre con una observación profunda, una pregunta existencial o una declaración aparentemente paradójica sobre la verdad nuclear del carrusel. Nace de la CURIOSIDAD EXPANSIVA y el asombro — jamás del miedo, la queja o un problema. La lámina #1 es la portada: la premisa en su forma más magnética, la pregunta que el lector se ha hecho sin saber ponerla en palabras (eso detiene el scroll).

FASE 2 — EL ANCLAJE ANALÓGICO (las láminas centrales — el corazón del carrusel):
El otro personaje responde con UNA Metáfora de Mecánica Universal: un fenómeno FÍSICO simple, terrenal y universalmente comprensible que explica EXACTAMENTE cómo funciona la consciencia o la realidad según la verdad elegida. Campos de los que puedes tirar (o inventa otro de igual calibre): óptica y luz, acústica y resonancia, botánica y semillas, termodinámica y calor, gravedad, imanes, agua y vasos comunicantes, electricidad simple, astronomía cotidiana (mareas, estaciones), tecnología básica (antena, brújula, lente, eco). REGLAS DURAS del anclaje:
- UNA sola analogía por carrusel, elegante y exacta. PROHIBIDO cambiar de metáfora a mitad del diálogo o apilar imágenes distintas (espejo + película + eco en el mismo carrusel = ruido; elige UNA y exprímela).
- FÍSICAMENTE CORRECTA: si el fenómeno real no se comporta así, no la uses. La genialidad está en que la física REAL ya funciona como la verdad que traduces.
- SE DESARROLLA a lo largo de las láminas centrales, no se menciona de pasada: primero se PRESENTA (una imagen concreta que se VE), luego se GIRA (el otro personaje la prueba, la empuja, pregunta por su borde), y al final se ATERRIZA en la vida (qué cambia al comprenderla).
- FRESCA: inventada para ESTE carrusel, de un campo físico DISTINTO a los del historial reciente.

FASE 3 — EL COLAPSO DE LA CERTEZA (la ÚLTIMA lámina de diálogo, la #N-1):
El personaje que abrió comprende, y densifica todo en UN AXIOMA: una sentencia corta (máximo ~12 palabras), absoluta, poética pero directa — la Verdad Vibral del carrusel. Sin moraleja ni explicación después: el axioma brilla solo y expande la mente del lector. Visualmente es la lámina más serena y silenciosa. (El otro personaje puede sellarlo con una línea mínima, opcional.)

Regla de avance: cada lámina NACE de la anterior (nunca diapositivas sueltas ni turnos repetidos). Si puedes barajar las láminas y el sentido no cambia, no hay recorrido — reescribe. La ÚLTIMA lámina del carrusel es siempre el CIERRE-INVITACIÓN (ver abajo).

=== LEYES DE EXCLUSIÓN (innegociables, en cualquier modo) ===
- PROHIBIDO el drama: ningún personaje se queja, sufre, se lamenta, teme ni carga problemas cotidianos mundanos (estrés, tráfico, dinero, quejas de pareja). Operan en pura ascendencia: serenidad, contemplación, asombro. La duda que existe es curiosidad, nunca angustia; nadie necesita ser rescatado ni consolado.
- PROHIBIDO el lenguaje religioso tradicional (rezos, pecado, castigo, cielo/infierno, devoción): lo sagrado se muestra con física y belleza, no con liturgia.
- PROHIBIDA la complejidad: la genialidad está en explicar lo inmenso con elementos físicos simples. Si necesitas un término técnico para que funcione, no lo necesitas.
- Los personajes se hablan ENTRE ELLOS, nunca a la cámara: cero segunda persona dirigida al lector, cero imperativos de coaching (suelta, confía, respira).
- ANTI-ECO: cada turno AÑADE (gira, ahonda o aterriza); si un globo solo asiente o confirma, bórralo.
- ANTI-GALLETITA / ANTI-INCIENSO: si una frase cabe idéntica en un imán de nevera, o se desinfla al quitarle el adjetivo místico, reescríbela anclada en algo que se VE o se TOCA.

=== PROFUNDIDAD DE LAS ENSEÑANZAS (innegociable) ===
Elige UNA verdad nuclear como columna: es LO QUE LA ANALOGÍA HACE VISIBLE en la Fase 2, y lo que el axioma densifica en la Fase 3. Destílala SIN citar fuentes ni nombres, en lenguaje llano, como quien le habla a un amigo que despierta hoy. Pozos de los que beber (usa una o dos por carrusel, no todas):
- Eres el Universo conociéndose a sí mismo a través de ti; no estás separado de nada.
- Todo es Uno: lo de afuera refleja lo de adentro; el otro eres tú desde otro punto de vista.
- Tu experiencia sigue a tus creencias: cambia lo que das por verdad y cambias lo que vives.
- Sigue tu entusiasmo más alto, actúa en él con lo que tengas y suelta el resultado: es tu brújula.
- Solo existe el ahora; tu poder vive en este instante.
- Lo que llamas problema es un catalizador: te muestra lo que falta integrar para que elijas el amor.
- Siempre estás eligiendo; tu libre albedrío es sagrado. Te sirves y sirves al todo en equilibrio.
- Eres conciencia eterna viviendo una experiencia; morir es cambiar de frecuencia, no terminar.
Cómo hacer que suene VERDADERO, no a frase de calendario: frases CORTAS que se sienten en el cuerpo; lo CONCRETO y sensorial antes que lo abstracto; cero jerga (nada de vibración/frecuencia/5D/manifestar/energía como muletilla), cero misticismo vacío. Si una línea suena a taza de café motivacional, reescríbela más humana y más simple. La prueba de fuego: la abstracción entra por la analogía física, nunca cruda.

=== CÓMO ESCRIBIR CADA LÁMINA ===
- copy_line = el DIÁLOGO de esa lámina, atribuido por personaje para que Zak lo lea claro. Formato: una línea por globo, "NombreCorto: su frase". Máximo 2 globos por lámina; cada globo ≤ ~12 palabras / ~60 caracteres, y si hay 2 globos al menos uno es de UNA frase corta (Nano Banana falla con texto largo; prioriza el aire visual). El texto que se RENDERIZA en la imagen es SOLO lo que va después de los dos puntos, sin el nombre y sin símbolos. Nombres cortos, evocadores, NO esotéricos (Río, Vela, Brisa, Cedro, Sal, Eco, Musgo): el nombre evoca su ESENCIA, no su especie, y se mantiene idéntico en todo el carrusel. (Los ejemplos de tono CONCRETOS van en el MODO NARRATIVO.)
- prompt_image = ~90-110 palabras en español, AUTO-SUFICIENTE (sin referencias cruzadas tipo "como el slide anterior"): (1) re-describe POR ENTERO a cada personaje presente con su ficha física distintiva, breve pero completo; (2) describe el plano, la pose y la EMOCIÓN de cada uno, el entorno cósmico y la luz/paleta azul-púrpura-cian-magenta, y dónde queda el aire libre para los globos; (3) especifica cuántos globos hay, hacia qué personaje apunta la colita de cada uno, y el TEXTO LITERAL de cada globo, idéntico al de copy_line (sin el nombre, sin comillas ni símbolos). Máximo 2 globos, texto corto.
- director_note = vacía en la lámina 1 (introduce a los personajes). De la lámina 2 en adelante, como los MISMOS seres recurren, indica a Zak que suba la imagen de una lámina previa como referencia para que Nano Banana conserve rostros y vestuarios idénticos. Ej.: "Sube la imagen del slide 1 como referencia para conservar a los mismos dos personajes (caras, peinados y ropa)." Aunque haya nota, el prompt_image SIEMPRE re-describe a los personajes (la nota es para el humano; el prompt debe funcionar solo).

=== CIERRE-INVITACIÓN (última lámina) ===
NO la diseñas tú visualmente: el motor REEMPLAZA el visual del último slide por el render oficial del iPhone con la app, así que lo que pongas en su prompt_image se ignora. NO cierres con pregunta ni con "déjalo en los comentarios". Para el último slide SOLO escribe su copy_line: una invitación CÁLIDA y potente a descubrir la propia luz con la app "Escáner Vibracional", idealmente enlazada con el AXIOMA o la ANALOGÍA del carrusel para que se sienta el mismo hilo (ej. si la analogía fue de afinación: "Tu cuerda tiene una frecuencia. Ven a medirla." / genérico: "Mira cómo está tu luz en las 6 áreas de tu vida con el Escáner Vibracional.").

Mantén el MISMO estilo manga astral, la misma paleta y los MISMOS personajes en TODAS las láminas de diálogo: esa consistencia es la marca.`,
}

const STYLE_VITRAL: StyleDef = {
    key: "vitral",
    label: "Vitral Cuántico · Ilustración holográfica ornamental",
    promptPrefix: `[ESTILO FIJO — VITRAL CUÁNTICO · ILUSTRACIÓN HOLOGRÁFICA ORNAMENTAL]
Ilustración holográfica ornamental tipo VITRAL DE LUZ VIVA (NO es fotografía, NO es render 3D plástico): arte de luz translúcida con refracciones prismáticas. Fondo índigo / negro profundo. Line-art iridiscente finísimo, mandalas y geometría sagrada en CIAN + ORO + VIOLETA, vitrales de luz, halos prismáticos, partículas brillantes flotando. La forma o ser protagónico es de CRISTAL Y LUZ translúcida que irradia desde adentro, sereno y luminoso. Estética onírica, ceremonial, "catedral cuántica", de altísima frecuencia. Composición simétrica y ornamental, equilibrada. JAMÁS oscuro, siniestro, demoníaco ni de terror: siempre luz radiante y serena.
ESCENA:`,
    guidance: `Es un carrusel ilustrado ornamental (vitral cuántico), onírico y ceremonial. Hay un MOTIVO o ser de luz recurrente a lo largo de los slides (un arquetipo de cristal/luz), o una progresión de mandalas y geometrías que evolucionan. El slide 0 (Portada) abre el universo visual. Cada prompt_image es AUTO-SUFICIENTE: re-describe el motivo/ser por completo (para que funcione SIN referencia), variando la composición ornamental, la geometría y el encuadre en cada slide. Mantén SIEMPRE la paleta cian/oro/violeta y el lenguaje de vitral de luz. El texto, si lo hay, es overlay que Zak agrega aparte (va en copy_line); solo grábalo en el vitral si una lámina lo pide explícitamente.`,
}

const STYLES: Record<string, StyleDef> = {
    manga: STYLE_MANGA,
    manga_dialogo: STYLE_MANGA_DIALOGO,
    vitral: STYLE_VITRAL,
}

// Lanes "manga" (frases o diálogo): cierran con la lámina-invitación del iPhone.
const MANGA_LANES = new Set(["manga", "manga_dialogo"])

const VALID_STYLES = new Set(Object.keys(STYLES))

/* ═══════════════════════════════════════════════════════════════
   3. CTA fijo del cierre del caption — Zak'Haar → app "Escáner Vibracional"
   El modelo escribe el cuerpo SIN CTA; el handler le pega ESTE texto VERBATIM.
   Cierre "\n.\n." para separar de los hashtags en Instagram.
   ═══════════════════════════════════════════════════════════════ */

const ESCANER_CTAS = [
    "Esto es apenas el umbral.\nNuestra app Escáner Vibracional te lleva más hondo.\n\n🛰️ Mide tu frecuencia en 6 pilares y recibe tu calibración exacta.\n🌅 Prácticas diarias que encienden tu Avatar de Luz y elevan tu energía.\n🔮 Decodifica lo que comes y lo que sueñas.\n🪐 No es un test: es tu compañero de evolución.\n\n📲 Ya en la App Store · Link en bio 💫\n.\n.",
]

function pickEscanerCta(): string {
    return ESCANER_CTAS[Math.floor(Math.random() * ESCANER_CTAS.length)]
}

/* ── Lámina de CIERRE del Manga Astral: render del iPhone con la app abierta.
   Se fuerza server-side (reemplaza el visual del último slide). ASUME que Zak
   sube DOS referencias a Nano Banana: el LOGO de la app + una CAPTURA de la
   pantalla de inicio. El prompt NO lleva el prefijo de estilo manga (es un
   render limpio de producto, no una ilustración). */
const IPHONE_CLOSING_PROMPT = `Aspect Ratio: 4:5

[FORMATO DE IMAGEN — Aspect Ratio 4:5 · OBLIGATORIO]
Relación de aspecto 4:5 EXACTA (vertical / retrato, 1080×1350 px). Si hay selector de proporción, elige 4:5. PROHIBIDO 1:1, 9:16, 16:9 u horizontal. Toda la composición cabe dentro del marco 4:5.

[LÁMINA DE CIERRE — INVITACIÓN A DESCARGAR LA APP · USA LAS IMÁGENES DE REFERENCIA]
Render premium, limpio y nítido de invitación a descargar una app de celular. Un iPhone moderno realista (cuerpo negro, marco fino, sombra suave) flotando centrado sobre un fondo cósmico de altísima vibración a juego con el carrusel: azul nocturno profundo, índigo y púrpura, con god rays suaves y partículas de luz dorada y cian.
EN LA PANTALLA del iPhone va EXACTAMENTE la CAPTURA DE PANTALLA que se sube como referencia (la pantalla de inicio de la app), encajada con precisión dentro del marco de la pantalla, nítida, sin deformar, respetando sus esquinas redondeadas — como si la app estuviera abierta en el teléfono.
Flotando junto a la parte superior del teléfono, el LOGO de la app que se sube como referencia, irradiando una luz suave (sin deformarlo ni recortarlo).
Renderiza este texto LIMPIO, sin comillas ni símbolos a su alrededor, perfectamente legible y sin faltas de ortografía: como TÍTULO grande, blanco y en negrita, el nombre Escáner Vibracional; justo debajo, como subtítulo, en una primera línea Escanea y calibra tu frecuencia y en una segunda línea más pequeña Comprende tu estado energético y armoniza tu entorno; y más abajo, dentro de un BOTÓN dorado redondeado bien destacado, el texto Descárgala ahora.
En la parte inferior, el badge oficial negro "Download on the App Store" (logotipo de Apple + texto), nítido y bien proporcionado.
Composición centrada y equilibrada, sensación de producto premium y sagrado. NADA de texto con errores.

[Aspect Ratio: 4:5 — recordatorio: imagen vertical 4:5 (retrato, 1080×1350), NUNCA cuadrada, 9:16 ni horizontal.]`

const IPHONE_CLOSING_NOTE =
    "Sube DOS imágenes como referencia para este último slide: (1) el LOGO de la app Escáner Vibracional, y (2) una CAPTURA de la pantalla de inicio de la app abierta. Nano Banana las coloca: el logo flotando con luz y la captura DENTRO de la pantalla del iPhone."

/* ── Variedad visual: se inyecta en el system de AMBOS lanes manga para romper
   el "siempre el mismo espacio cósmico + túnica blanca". El cosmos queda solo
   como telón lejano; cada lámina elige un MUNDO y un ATUENDO distintos. */
const ESCENARIO_BLOCK = `[ESCENARIO · RULETA DE MUNDOS — OBLIGATORIA por lámina/carrusel]

REGLA DURA: el "espacio cósmico" (galaxia espiral, nebulosa, vacío estrellado puro) está PROHIBIDO como escenario por defecto. Solo puede asomar como CIELO lejano ENTRE los elementos de un mundo real (entre las hojas, sobre las montañas, reflejado en el agua), nunca como el escenario entero. Antes de generar cada lámina, ELIGE conscientemente UN mundo concreto de la ruleta —o imagina otro de igual calibre— y descríbelo con detalle físico (qué pisa el personaje, qué lo rodea, qué luz cae). Dentro de un carrusel NINGUNA lámina repite mundo; entre carruseles consecutivos cambia de familia. Ante la duda, elige el mundo MENOS obvio.

RULETA (rota, no te quedes en uno):
• Jardines/reinos celestes: terrazas flotantes entre nubes doradas, gran Árbol de la Vida luminoso, puentes de cristal entre islas, lotos gigantes, cascadas que caen al vacío.
• Selvas/junglas sagradas: vegetación bioluminiscente, ruinas y estelas mayas con glifos vivos, doble hélice de ADN de luz entre los árboles, pirámides tomadas por la naturaleza, ríos turquesa.
• Templos/ciudades de cristal: columnatas de cuarzo, mandalas de piso que irradian, vitrales que proyectan haces de color, urbes-mandala suspendidas, monasterios en acantilados.
• Montañas/alturas: picos nevados bajo auroras, mesetas sobre un mar de nubes, valles de flores fosforescentes, cima solitaria al amanecer.
• Océanos/aguas: mar espejo que refleja dos lunas, costas de arena luminiscente, arrecifes de coral de luz, ballenas y medusas etéreas, faro de energía.
• Desiertos bajo auroras: dunas doradas, oasis de palmeras de luz, cañones rojos con cristales incrustados, luna enorme en el horizonte.
• Bosques encantados nocturnos: árboles con runas brillantes, claros de luciérnagas, hongos y raíces bioluminiscentes, niebla iridiscente.
• Cavernas/geodas: cuevas de amatista gigante, lagos subterráneos espejados, venas de oro líquido en la roca, haces entrando por una grieta.
• Praderas/campos de flores vivas: flores que emiten polen de luz, colinas suaves, un solo árbol o un portal de piedras en el horizonte.

CHECKLIST por lámina: 1) nombra el mundo; 2) describe el suelo/plataforma; 3) añade 2-3 elementos mágicos PROPIOS de ese mundo (no genéricos); 4) deja el cosmos solo como telón lejano; 5) confirma que difiere de la lámina anterior. Varía además hora y luz (amanecer dorado, mediodía cristalino, atardecer magenta, noche con auroras), ángulo (gran angular épico / íntimo / contrapicado de asombro) y escala (vasto vs. rincón). La estética de marca (manga astral, line-art + glow, paleta azul nocturno/índigo/púrpura/cian/magenta dorado, alta vibración) se MANTIENE FIJA; lo único que cambia es el mundo.`

const ATUENDO_BLOCK = `[ATUENDO · RULETA DE VESTIMENTAS Y SERES — OBLIGATORIA por personaje/lámina]

REGLA DURA: la "túnica/vestido blanco de luz" genérico está PROHIBIDO como atuendo por defecto. Si la primera idea es "ser de luz con túnica blanca flotando", DESCÁRTALA y gira la ruleta. El blanco solo es válido si lleva bordados, color, textura o piezas que lo saquen de lo genérico, y como mucho 1 de cada 6 láminas, jamás dos seguidas. Cada personaje VISTE un atuendo concreto, con tela, color y silueta definidos, que ARMONICE con el mundo de esa lámina.

RULETA (rota, no te quedes en uno):
• Mantos y túnicas BORDADAS: telas índigo/púrpura/esmeralda/granate con glifos y geometría sagrada en oro, capas con constelaciones tejidas, broche luminoso.
• Ropas ÉTNICAS luminosas: sari iridiscente, kimono cósmico, hanbok estelar, vestimenta andina/maya geométrica, agbada con hilos de oro, turbante con joya frontal radiante. (Respetuoso, estilizado, nunca caricatura.)
• Armaduras de LUZ: peto de cristal facetado, hombreras de energía, runas y circuitos dorados, guardián estelar de paz, no de guerra.
• Sedas de COLOR fluidas: capas magenta-cian que ondean, velos translúcidos en degradado, fajas y cintas que flotan como agua.
• Trajes CONTEMPORÁNEOS elevados: abrigo largo de viajero dimensional, conjunto urbano minimalista, ropa andrógina moderna, con costuras y vetas de luz — acerca el despertar a lo cotidiano.
• Vestiduras de monje/sabio/yogui: hábitos de tonos tierra y oro, cuentas, capucha, bastón de luz, tatuajes de henna luminosos.
• Atuendos ELEMENTALES: hojas y pétalos vivos (jardín/selva), escamas iridiscentes (océano), arena y oro (desierto), prendas talladas en cuarzo (geoda).

VARÍA TAMBIÉN AL SER: alterna género y andrógino, edad (joven, sabio anciano, niño-luz), tonos de piel y rasgos de muchas culturas, cabello (largo, trenzado, rapado, con mechas de luz), arquetipo (guerrero, sanadora, guía, maestro). Suma 1-2 detalles luminosos característicos: corona/diadema de geometría sagrada, joya en el pecho, anillos de energía, alas opcionales, manos sosteniendo una esfera dorada. ANTI-REPETICIÓN: dentro de un carrusel no repitas atuendo ni arquetipo entre láminas (salvo un personaje recurrente en una misma escena de diálogo, que conserva su look); entre carruseles no arranques dos veces con el mismo. La estética manga astral (rasgos estilizados, ojos expresivos con brillo, glow) es FIJA; el atuendo, el color, la cultura y el ser cambian siempre.`

/* ── Variante de ESCENARIO para el lane de DIÁLOGO: la conversación suele
   transcurrir en UN mismo lugar, así que la variedad OBLIGATORIA es la CÁMARA
   (ángulo/plano), NO el mundo. Mata el "mismo fondo calcado" entre láminas. */
const ESCENARIO_DIALOGO_BLOCK = `[ESCENARIO + CÁMARA · regla del lane de DIÁLOGO]

Como es UNA conversación, lo natural es que transcurra en UN mismo mundo (o que se mueva por 2-3 lugares como mucho en todo el carrusel). Elige UN mundo concreto y vívido y descríbelo con detalle físico; el cosmos solo asoma como cielo lejano (NO uses galaxia/nebulosa/vacío estrellado como escenario entero).

🜂 REGLA ANTI COPY-PASTE (la más importante de este bloque): si dos o más láminas ocurren en el MISMO lugar, está PROHIBIDO repetir el fondo idéntico. Es un CÓMIC: cada lámina cambia el ÁNGULO DE CÁMARA y el PLANO aunque el lugar sea el mismo. Rota deliberadamente entre — primer plano de un rostro · plano medio de los dos frente a frente · plano general de ambos pequeños bajo el cielo · over-the-shoulder (sobre el hombro de uno mirando al otro) · contrapicado de asombro · picado suave · perfil · ligero escorzo. En CADA prompt_image DECLARA explícitamente el plano y el ángulo NUEVOS, y describe el fondo DESDE ESE punto de vista (lo que se ve cambia: más cielo, más suelo, un detalle del entorno en primer término, el otro personaje de espaldas, otra esquina del mismo lugar). NUNCA describas el fondo con las MISMAS palabras que la lámina anterior. Si el lector siente "es la misma imagen con otro globo", fallaste.

RULETA DE MUNDOS (elige UNO para la escena, rico y concreto): jardines/terrazas celestes entre nubes doradas · selvas sagradas bioluminiscentes con ruinas y glifos · templos/ciudades de cristal · montañas bajo auroras · océanos espejo de dos lunas · desiertos bajo auroras · bosques encantados de runas · cavernas/geodas de amatista · praderas de flores de luz. Varía además la HORA y la LUZ (amanecer dorado, mediodía cristalino, atardecer magenta, noche con auroras) y la ESCALA (de un primer plano íntimo a un gran plano de asombro). La estética de marca (manga astral, line-art + glow, paleta azul nocturno/índigo/púrpura/cian/magenta dorado, alta vibración) se MANTIENE FIJA.`

/* ── Modo narrativo TRAVESÍA (redefinido v1.15): de la PREGUNTA al AXIOMA.
   Roles asimétricos (El que Pregunta / El que Revela) sobre la Arquitectura
   de 3 Fases. Ya NO existe el arco herida→luz: el drama está prohibido. */
const DIALOGO_MODE_TRAVESIA = `=== MODO: TRAVESÍA (de la pregunta al axioma) ===

PROPÓSITO
Es la versión con ROLES ASIMÉTRICOS de la Arquitectura de 3 Fases: uno pregunta, el otro revela. El lector entra por la pregunta (porque es SU pregunta, la que se ha hecho sin saber ponerla en palabras) y sale con el axioma grabado. La emoción del viaje: reconocimiento → asombro → certeza. Aunque se llama Travesía, aquí NADIE viaja desde el dolor: el viaje va de la curiosidad a la comprensión.

=== EL CASTING (los roles de este modo) ===
- EL QUE PREGUNTA (la voz del lector): abre la FASE 1 con la premisa contemplativa. Su material puede ser la experiencia humana REAL (los patrones que se repiten, el tiempo, la atención, los vínculos, el propio cuerpo) pero formulada SIEMPRE desde el asombro de quien observa un fenómeno fascinante — jamás desde la queja de quien carga un peso. Durante la FASE 2 EMPUJA la analogía: la prueba, pregunta por su borde, la lleva a su vida (esa fricción curiosa da realismo). En la FASE 3 le pertenece el COLAPSO: él pronuncia el axioma, porque la comprensión es SUYA, no dictada.
- EL QUE REVELA (el espejo sereno): responde la FASE 2 con la Metáfora de Mecánica Universal. Habla desde la calma y la precisión, NO desde arriba: comparte como quien muestra algo obvio que nadie había mirado, a veces con otra pregunta que abre. Nunca da la verdad masticada: da la FÍSICA y deja que el otro colapse la certeza. Suele ser el ser más exótico o no-humano del par.

=== TONO ===
Cercano, luminoso, con la alegría tranquila de comprender. EMOCIONES A BUSCAR: curiosidad expansiva, asombro, reconocimiento ("siempre estuvo ahí"), certeza serena, gratitud por ver. A EVITAR: lástima, urgencia, consuelo (nadie está herido), solemnidad engolada, tono de maestro a alumno. El que revela responde a lo que el otro OBSERVA, usando lo concreto de su observación — no lo abstrae hacia "la energía universal".

EJEMPLO (tono y fases — la analogía aquí es la resonancia; NO la reutilices, inventa la tuya):
#1 (F1) Brisa: He notado algo: los lugares me responden. Entro en calma y el cuarto entero se aquieta. ¿Cómo lo sabe?
#2 (F2) Cedro: ¿Has visto dos guitarras en una misma sala? Haces sonar una cuerda… y en la otra, la misma cuerda vibra sola. Nadie la tocó.
#3 (F2) Brisa: ¿El mundo es la otra guitarra? / Cedro: Todo lo es. El mundo no te escucha: te resuena.
#4 (F3) Brisa: Entonces no tengo que afinar el mundo. Solo mi cuerda.`

/* ── Modo narrativo COHERENCIA PURA: pares YA en su centro que co-construyen
   la analogía. Reescrito v1.15 sobre la Arquitectura de 3 Fases; las leyes
   universales y el formato duro viven ahora en la guía del lane. */
const DIALOGO_MODE_COHERENCIA = `=== MODO: COHERENCIA PURA (comunión entre seres en su centro) ===

PROPÓSITO
Es la versión entre PARES de la Arquitectura de 3 Fases: nadie es alumno de nadie. Dos (o más) seres YA completos despliegan una verdad JUNTOS y se encienden mutuamente. El lector no recibe una lección: SORPRENDE una conversación entre seres que ven más, y se le eriza la piel por RECONOCIMIENTO ("siempre fue así y nunca lo había oído tan claro"). No hay pregunta que cure ni respuesta que rescate: hay un cristal que gira y muestra caras nuevas.

=== EL CASTING (la relación) ===
Son PARES: distinta forma, distinta voz, MISMA altura. No hay "el sabio" y "el aprendiz". Co-crean: lo que dice A está incompleto sin lo que ve B. Cada uno con VOZ propia: uno terroso y concreto (manos, pan, raíces, ríos); otro vasto y sereno (ciclos, distancias, silencio); un animal-guía con presente puro; un ser estelar con rareza tierna. Cuanto más alto el ser, más simple habla.

=== LAS 3 FASES ENTRE PARES ===
- FASE 1: uno nombra la premisa a partir de algo simple y tangible que tiene delante (una taza, una grieta, la luz sobre el agua): el asombro nace de mirar bien lo ordinario. Nunca abras con la conclusión.
- FASE 2: la Metáfora de Mecánica Universal se CO-CONSTRUYE — uno la enciende con la primera imagen física, el otro la lleva más hondo, el primero la gira otra vez: un pase de joya en mano. Ninguno explica solo: si un personaje pudiera decirlo todo sin el otro, no es diálogo.
- FASE 3: el axioma cae en boca de cualquiera de los dos, o uno lo empieza y el otro lo sella con una línea mínima. Cierra ARRIBA: la línea brilla sola, sin moraleja.

=== TRAMPAS PROPIAS DE ESTE MODO ===
1. EL DESACUERDO DE ADORNO: prohibido "no", "te equivocas", "en realidad". El segundo ser AÑADE una cara que el primero no vio, nunca niega la dicha.
2. EL PÚLPITO: uno explica y el otro habilita = falso par. Es un pase entre iguales, y cada turno AÑADE (el eco "Sí." / "Exacto." se borra).
3. LA SUPERIORIDAD: prohibidos los vocativos paternalistas (pequeño, querido) y el "todavía no comprendes". El asombro va al TEMA, nunca a la ingenuidad del otro.
4. TEMAS 3D DESDE LA ALTURA: pueden contemplar la muerte, el tiempo, el dinero, el cuerpo que envejece — SIN consolar a nadie (cero "no temas", "todo está bien"): no calman, describen un paisaje. La muerte se mira como se mira un atardecer.

EJEMPLO (tono y fases — la analogía aquí es el fototropismo; NO la reutilices, inventa la tuya):
#1 (F1) Musgo: Las plantas de mi caverna crecieron todas hacia la única grieta de luz. Nadie les enseñó el camino.
#2 (F2) Lumen: La luz no las empuja. Las invita. Cada hoja gira sola.
#3 (F2) Musgo: Como la atención. Lo que miras con constancia crece hacia ti. / Lumen: Y lo que dejas de mirar no muere: solo deja de crecer en tu dirección.
#4 (F3) Musgo: Entonces mirar ya es regar. / Lumen: El mundo entero es un jardín girando hacia tu mirada.`

/* Modos narrativos del lane manga_dialogo. Default = travesia (el actual). */
const DIALOGO_MODES: Record<string, string> = {
    travesia: DIALOGO_MODE_TRAVESIA,
    coherencia: DIALOGO_MODE_COHERENCIA,
}
const DEFAULT_DIALOGO_MODE = "travesia"
const VALID_DIALOGO_MODES = new Set(Object.keys(DIALOGO_MODES))
// Etiqueta corta que se refuerza en el user prompt (no es la directriz completa).
const DIALOGO_MODE_LABELS: Record<string, string> = {
    travesia:
        "Travesía (de la pregunta al axioma: El que Pregunta abre la premisa desde el asombro — jamás desde la queja —, El que Revela trae la analogía física, y quien preguntó pronuncia el axioma)",
    coherencia:
        "Coherencia Pura (pares YA en su centro: co-construyen la analogía física de mano en mano y el axioma cae sereno; sin dolor, sin miedo, sin rescate)",
}

/* ═══════════════════════════════════════════════════════════════
   4. SYSTEM + USER PROMPT
   ═══════════════════════════════════════════════════════════════ */

function buildSystem(
    style: StyleDef,
    dialogoMode: string,
    codiceBlock: string = ""
): string {
    const isManga = MANGA_LANES.has(style.key)
    const variedadBlock = !isManga
        ? ""
        : style.key === "manga_dialogo"
          ? `\n\n---\n\n### VARIEDAD VISUAL OBLIGATORIA — mismo elenco, CÁMARA distinta en cada lámina\n${ESCENARIO_DIALOGO_BLOCK}\n\n${ATUENDO_BLOCK}`
          : `\n\n---\n\n### VARIEDAD VISUAL OBLIGATORIA — cada lámina, un MUNDO y un ATUENDO distintos\n${ESCENARIO_BLOCK}\n\n${ATUENDO_BLOCK}`
    const modeBlock =
        style.key === "manga_dialogo"
            ? `\n\n---\n\n### MODO NARRATIVO DE ESTE CARRUSEL — respétalo estrictamente\n${
                  DIALOGO_MODES[dialogoMode] ?? DIALOGO_MODE_TRAVESIA
              }`
            : ""

    return `Eres el "Arquitecto de Silicio", motor visual del canal Zak'Haar Solar. Tu función AHORA es diseñar CARRUSELES de Instagram: un post de varias imágenes (slides) que se deslizan, con UN concepto narrativo y un ESTILO VISUAL ÚNICO de marca.

Recibes el ESTILO elegido y la cantidad de slides. Devuelves UN objeto JSON con el carrusel.

---

### ESTILO DE ESTE CARRUSEL — ${style.label}
${style.guidance}

(El motor antepone server-side la directiva técnica del estilo a cada prompt; tú concéntrate en el CONTENIDO de cada slide en ese lenguaje visual.)${variedadBlock}${modeBlock}${codiceBlock ? "\n\n" + codiceBlock : ""}

---

### ARCO DEL CARRUSEL
- slide 0 = PORTADA / GANCHO: detiene el scroll y promete el viaje.
- slides intermedios = DESARROLLO: el concepto AVANZA, slide a slide, sin repetir el anterior.
- último slide = CIERRE / SELLO: remate memorable (guárdalo / compártelo).
- El carrusel cuenta UNA sola idea coherente; cada slide aporta UN paso nuevo.

---

### SEPARACIÓN CRÍTICA — "prompt_image" LIMPIO vs "director_note"
Por cada slide devuelves DOS campos DISTINTOS:

1. "prompt_image": el prompt para Nano Banana, LIMPIO y AUTO-SUFICIENTE, en español. CONCISO: MÁXIMO ~80 palabras por slide (lo esencial del ser/escena, sin relleno). Describe la imagen ENTERA por sí sola. ESTRICTAMENTE PROHIBIDO escribir referencias cruzadas como "el ser del slide #1", "como en el cuadro anterior", "usa la imagen previa", "mismo personaje que antes" ni ninguna instrucción dirigida a un humano. Si un ser/elemento se REPITE de un slide anterior, vuelve a describirlo (rasgos clave: forma, materiales, color) de forma BREVE para que el prompt funcione SOLO — sin extenderte. Este texto se copia/pega TAL CUAL en Nano Banana.

2. "director_note": instrucción para el HUMANO (Zak), SOLO si este slide REUTILIZA un ser/objeto/escenario concreto de un slide ANTERIOR. UNA frase en español que diga qué imagen previa subir como referencia visual para conservar EXACTAMENTE lo mismo. Ejemplo: "Sube la imagen que generaste para el #1 como referencia, así Nano Banana conserva el MISMO ser." Si el slide NO reutiliza nada de un slide previo (introduce algo nuevo, o es una lámina de texto independiente), director_note = "" (cadena vacía). NUNCA metas esta instrucción dentro de prompt_image.

Numera siempre por su posición visible (#1 = primer slide, #2 = segundo…), NO por índice 0.

---

### CAPTION + HASHTAGS
- "caption_instagram": en español neutro (tú, NUNCA voseo). Gancho fuerte en la primera línea + cuerpo breve que invite a deslizar. NO escribas el CTA final ni los hashtags (el motor los agrega aparte). Tono Zak'Haar: alta frecuencia, claridad, cero misticismo vacío.
- "hashtags": de 3 a 5 hashtags en UNA sola línea, separados por espacio, cada uno con #. Relevantes al tema (despertar, conciencia, energía, frecuencia, sanación), en español.

---

### CONTRATO JSON (exacto, sin texto fuera del JSON)
{
  "carousel": {
    "concept_title": "título corto del carrusel (4-7 palabras)",
    "narrative": "el arco completo en 2-3 frases (referencia para Zak, no se publica)",
    "pulso_nucleo": "el concepto/tema central en 3-6 palabras (memoria anti-repetición)",
    "analogia_campo": "SOLO en estilo manga_dialogo: el campo físico de la Metáfora de Mecánica Universal usada, en 2-4 palabras (ej. resonancia de cuerdas, vasos comunicantes, fototropismo). En otros estilos: cadena vacía.",
    "caption_instagram": "caption en español neutro: gancho + cuerpo. SIN CTA ni hashtags.",
    "hashtags": "3 a 5 hashtags en una línea separados por espacio, con #",
    "slides": [
      {
        "slide_label": "Portada | Desarrollo | Cierre",
        "copy_line": "el texto/enseñanza/frase de ESTE slide (si el estilo lleva texto en la imagen, es ESTE texto exacto)",
        "prompt_image": "prompt Nano Banana LIMPIO y auto-suficiente, en español (ver SEPARACIÓN CRÍTICA)",
        "director_note": ""
      }
    ]
  }
}`
}

function buildUser(
    style: StyleDef,
    slidesCount: number,
    recentPulsos: string[],
    dialogoModeLabel: string = "",
    codiceTitle: string = ""
): string {
    let pulsosBlock = ""
    if (recentPulsos.length) {
        pulsosBlock = `

HISTORIAL RECIENTE (REGLA ESTRICTA DE NO-REPETICIÓN):
Estos son los conceptos centrales de carruseles recientes. Queda PROHIBIDO repetir el tema central de cualquiera. Elige un "pulso_nucleo" conceptualmente DISTINTO a todos:

${recentPulsos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
    }

    const modeLine = dialogoModeLabel
        ? `\nModo narrativo del diálogo: ${dialogoModeLabel}. Respétalo ESTRICTAMENTE: gobierna los roles y el tono; la ARQUITECTURA DE 3 FASES (premisa contemplativa → anclaje analógico → colapso de la certeza) es LEY en cualquier modo.\nANALOGÍA FRESCA: inventa la Metáfora de Mecánica Universal de ESTE carrusel. Si el historial reciente muestra campos de analogía usados (aparecen tras "analogía:"), el tuyo debe ser de un campo físico DISTINTO a todos ellos.`
        : ""

    const codiceLine = codiceTitle
        ? `\nFUENTE: Códice de Luz "${codiceTitle}". Construye el carrusel sobre UNA enseñanza del códice (ver el bloque FUENTE del sistema), fiel al libro; el pulso_nucleo debe ser el título EXACTO de esa enseñanza.`
        : ""

    return `Diseña UN carrusel de Instagram para el canal Zak'Haar Solar.

Estilo visual: ${style.label} (key: ${style.key}).${modeLine}${codiceLine}
Cantidad de slides: EXACTAMENTE ${slidesCount} (numéralos #1 a #${slidesCount}).

El carrusel desarrolla UNA idea coherente con el arco Portada → Desarrollo → Cierre. Cada slide aporta un paso nuevo; ninguno repite al anterior. Respeta la SEPARACIÓN CRÍTICA: "prompt_image" SIEMPRE limpio y auto-suficiente (sin referencias cruzadas ni notas humanas); la nota de referencia, si hace falta, SOLO en "director_note".${pulsosBlock}

Devuelve EXACTAMENTE ${slidesCount} slides. Solo el objeto JSON del contrato, sin texto adicional.`
}

/* ═══════════════════════════════════════════════════════════════
   5. PARSER + GEMINI
   ═══════════════════════════════════════════════════════════════ */

interface RawSlide {
    slide_label: string
    copy_line: string
    prompt_image: string
    director_note: string
}

interface RawCarousel {
    concept_title: string
    narrative: string
    pulso_nucleo: string
    analogia_campo: string
    caption_instagram: string
    hashtags: string
    slides: RawSlide[]
}

// Aísla el PRIMER objeto JSON balanceado desde el primer "{", contando llaves y
// respetando strings/escapes. Robusto cuando el modelo (sobre todo en diálogo,
// que genera mucho texto) añade caracteres DESPUÉS del objeto → evita el
// "Unexpected non-whitespace character after JSON" del lastIndexOf("}").
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

function extractCarousel(raw: string): RawCarousel {
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
    // Parser balanceado primero (ignora texto extra tras el objeto); si no cierra
    // (truncado), cae al slice clásico como último recurso.
    const objStr =
        isolateJsonObject(cleaned) ?? cleaned.slice(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(objStr)
    const c = parsed?.carousel ?? parsed

    const slRaw = Array.isArray(c?.slides) ? c.slides : []
    const slides: RawSlide[] = slRaw.map((s: any) => ({
        slide_label: String(s?.slide_label ?? "Slide"),
        copy_line: String(s?.copy_line ?? ""),
        prompt_image: String(s?.prompt_image ?? s?.prompt_nano_banana ?? ""),
        director_note: String(s?.director_note ?? s?.nota_referencia ?? ""),
    }))

    return {
        concept_title: String(c?.concept_title ?? "Carrusel"),
        narrative: String(c?.narrative ?? ""),
        pulso_nucleo: String(c?.pulso_nucleo ?? ""),
        analogia_campo: String(c?.analogia_campo ?? "").trim(),
        caption_instagram: String(c?.caption_instagram ?? c?.caption ?? ""),
        hashtags: String(c?.hashtags ?? ""),
        slides,
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
}

async function callGeminiText(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<RawCarousel> {
    const startedAt = Date.now()
    const body = JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 0.92,
            topP: 0.95,
            maxOutputTokens: 12000,
            responseMimeType: "application/json",
            // Apaga el "thinking": sin esto el modelo se gastaba el timeout
            // entero pensando y devolvía 502 a los ~78s. Patrón de decode-dream.
            thinkingConfig: { thinkingBudget: 0 },
        },
    })

    let lastErr: any = null
    for (const { model, attempts } of GEMINI_TEXT_CASCADE) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            // Presupuesto global: no arranques un intento sin tiempo para cerrarlo.
            const remaining = TEXT_TOTAL_DEADLINE_MS - (Date.now() - startedAt)
            if (remaining < 6000) {
                console.warn("[carousel:text] presupuesto global agotado")
                throw lastErr ?? new Error("Gemini text: presupuesto agotado")
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
                    body,
                    signal: controller.signal,
                })

                if (!res.ok) {
                    const errBody = await res.text()
                    lastErr = new Error(
                        `Gemini text ${res.status} (${model}): ${errBody.slice(0, 300)}`
                    )
                    // 4xx (no-5xx) no se arregla reintentando → siguiente modelo.
                    if (res.status < 500 || res.status >= 600) {
                        console.warn(
                            `[carousel:text] ${res.status} (${model}) no-5xx → cambio de modelo`
                        )
                        break
                    }
                    // 5xx (503 saturación): backoff con jitter, reintento mismo modelo.
                    const waitMs =
                        Math.min(9000, 800 * Math.pow(2, attempt - 1)) +
                        Math.floor(Math.random() * 400)
                    console.warn(
                        `[carousel:text] ${res.status} (${model}) intento ${attempt}/${attempts} → reintento en ${waitMs}ms`
                    )
                    await sleep(waitMs)
                    continue
                }

                const data = await res.json()
                const text =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
                if (!text) throw new Error("respuesta vacía")

                const parsed = extractCarousel(text)
                if (!parsed.slides.length) {
                    throw new Error(`carrusel sin slides: ${text.slice(0, 200)}`)
                }
                if (model !== GEMINI_TEXT_CASCADE[0].model)
                    console.warn(`[carousel:text] respondió respaldo ${model}`)
                return parsed
            } catch (err: any) {
                lastErr = err
                const aborted =
                    err?.name === "AbortError" ||
                    String(err?.message ?? "").includes("aborted")
                console.warn(
                    `[carousel:text] ${aborted ? "TIMEOUT" : "error"} (${model}) intento ${attempt}/${attempts}: ${String(
                        err?.message ?? err
                    ).slice(0, 160)}`
                )
                // timeout / red / parse: backoff con jitter y sigue (otro intento/modelo).
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

function parseHashtags(raw: string): string[] {
    if (!raw) return []
    const matches = raw.match(/#[\p{L}\p{N}_]+/gu)
    if (matches && matches.length) return matches.slice(0, 8)
    return raw
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .slice(0, 8)
}

/* ═══════════════════════════════════════════════════════════════
   6. SUPABASE HELPERS (admin gate + REST service role)
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
    try {
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
            console.warn(`[carousel:admin] check failed ${res.status}`)
            return false
        }
        const profile: any = await res.json()
        return Boolean(profile?.is_admin)
    } catch (e) {
        console.warn(`[carousel:admin] check error`, e)
        return false
    }
}

// Memoria anti-repetición: lee los pulsos de carruseles recientes (mismo
// estilo) directo de la tabla con service role (bypassa RLS). Sin RPC extra.
async function fetchRecentPulsos(
    cfg: SupabaseConfig,
    styleKey: string,
    codiceId: string = "",
    limit: number = PULSO_HISTORY_LIMIT
): Promise<string[]> {
    try {
        // Si es un carrusel de Códice, la anti-repetición es POR LIBRO (qué
        // enseñanza se usó); si no, por estilo (el pulso temático genérico).
        const filter = codiceId
            ? `codice_id=eq.${encodeURIComponent(codiceId)}`
            : `style_key=eq.${encodeURIComponent(styleKey)}`
        const url =
            `${cfg.url}/rest/v1/zakhaar_carousels` +
            `?select=pulso_nucleo&${filter}` +
            `&status=neq.deleted&pulso_nucleo=not.is.null` +
            `&order=generated_at.desc&limit=${limit}`
        const res = await fetch(url, {
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
            },
        })
        if (!res.ok) return []
        const rows: any[] = await res.json()
        return rows
            .map((r) => String(r?.pulso_nucleo ?? "").trim())
            .filter((p) => p.length > 0)
    } catch {
        return []
    }
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

// Bloque de FUENTE que se inyecta al system cuando el carrusel nace de un Códice
// de Luz: el modelo elige UNA enseñanza del concentrado y la dramatiza en el
// estilo/modo ya indicados, fiel al libro.
function buildCodiceBlock(codice: any, styleKey: string = ""): string {
    const d = codice?.digest ?? {}
    const ens = Array.isArray(d?.ensenanzas) ? d.ensenanzas : []
    const frases = Array.isArray(d?.frases) ? d.frases : []
    const ensLines = ens
        .map(
            (e: any, i: number) =>
                `${i + 1}. ${String(e?.titulo ?? "").trim()} — ${String(
                    e?.idea ?? ""
                ).trim()}${
                    e?.metafora
                        ? ` (imagen: ${String(e.metafora).trim()})`
                        : ""
                }`
        )
        .join("\n")
    const frasesLine = frases.length
        ? `\nFRASES DEL LIBRO (puedes usarlas o adaptarlas en boca de un personaje): ${frases
              .slice(0, 12)
              .map((f: any) => String(f).trim())
              .join(" · ")}`
        : ""
    return `---

### FUENTE OBLIGATORIA — CÓDICE DE LUZ: "${String(
        codice?.title ?? ""
    ).trim()}"${codice?.author ? ` (${String(codice.author).trim()})` : ""}
Este carrusel NACE de ESTE LIBRO. Está PROHIBIDO meter ideas ajenas: usa SOLO sus enseñanzas, fiel a su esencia y a su voz, en lenguaje llano.
ESENCIA: ${String(d?.esencia ?? "").trim()}
VOZ: ${String(d?.voz ?? "").trim()}
ENSEÑANZAS DEL LIBRO (elige UNA —que NO esté en los temas recientes— y conviértela en el carrusel; esa enseñanza es la VERDAD NUCLEAR/columna):
${ensLines}${frasesLine}
🜂 REGLA: elige UNA sola enseñanza y desarróllala en el estilo y modo narrativo ya indicados. El "pulso_nucleo" que devuelvas DEBE ser EXACTAMENTE el "titulo" de la enseñanza elegida (así no se repite en futuros carruseles de este Códice). El "concept_title" puede ser más libre.${
        styleKey === "manga_dialogo"
            ? `\n🜂 ANCLAJE ANALÓGICO del Códice: si la enseñanza elegida trae una imagen/metáfora del libro que sea FÍSICA y simple, úsala como semilla de la Metáfora de Mecánica Universal (así el carrusel huele al libro). Si su metáfora es abstracta o ya aparece en el historial de analogías, inventa una analogía física mejor y más terrenal: la fidelidad es a la IDEA de la enseñanza, no a su metáfora.`
            : ""
    }`
}

async function insertCarousel(
    cfg: SupabaseConfig,
    carousel: Record<string, any>
): Promise<any> {
    const res = await fetch(`${cfg.url}/rest/v1/zakhaar_carousels`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify([carousel]),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `Insert zakhaar_carousels ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    const rows = await res.json()
    return rows[0]
}

async function insertSlides(
    cfg: SupabaseConfig,
    rows: Record<string, any>[]
): Promise<any[]> {
    const res = await fetch(`${cfg.url}/rest/v1/zakhaar_carousel_slides`, {
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
            `Insert zakhaar_carousel_slides ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    const inserted = await res.json()
    return (inserted as any[]).sort((a, b) => a.slide_index - b.slide_index)
}

async function markCarouselDeleted(
    cfg: SupabaseConfig,
    carouselId: string
): Promise<void> {
    try {
        await fetch(
            `${cfg.url}/rest/v1/zakhaar_carousels?id=eq.${carouselId}`,
            {
                method: "PATCH",
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: "deleted" }),
            }
        )
    } catch {
        /* nada más que hacer */
    }
}

/* ═══════════════════════════════════════════════════════════════
   7. ENSAMBLADO del prompt copy-paste — prefijo del estilo + formato 4:5
   ═══════════════════════════════════════════════════════════════ */

function assembleSlidePrompt(style: StyleDef, scenePrompt: string): string {
    return (
        FORMAT_HEAD +
        style.promptPrefix +
        "\n" +
        scenePrompt.trim() +
        FORMAT_TAIL
    )
}

// Quita las comillas angulares (« ») del texto, para que Nano Banana no las
// dibuje sobre la imagen y el texto se sienta integrado. Aplica a TODO slide,
// en todos los estilos.
function stripGuillemets(s: string | null | undefined): string {
    return (s ?? "").replace(/[«»]/g, "")
}

/* ═══════════════════════════════════════════════════════════════
   8. MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    token?: string
    admin_clerk_id?: string
    style?: string // 'manga' | 'manga_dialogo' | 'vitral'
    dialogo_mode?: string // solo manga_dialogo: 'travesia' | 'coherencia'
    codice_id?: string // opcional: genera desde un Códice de Luz (libro destilado)
    slides_count?: number // 5..8
}

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request) => {
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

    const missingSecrets: string[] = []
    if (!GEMINI_API_KEY) missingSecrets.push("GEMINI_API_KEY")
    if (!SUPABASE_URL) missingSecrets.push("SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missingSecrets.push("SUPABASE_ANON_KEY")
    if (!SUPABASE_SERVICE_ROLE_KEY)
        missingSecrets.push("SUPABASE_SERVICE_ROLE_KEY")
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

    // Ola C · #3 Fase 3: token de Clerk verificado server-side, sin fallback.
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    // Estilo + cantidad de slides
    const styleKey =
        body.style && VALID_STYLES.has(body.style) ? body.style : "vitral"
    const style = STYLES[styleKey]
    // Modo narrativo — solo aplica al lane manga_dialogo (default = travesia).
    const dialogoMode =
        styleKey === "manga_dialogo" &&
        body.dialogo_mode &&
        VALID_DIALOGO_MODES.has(body.dialogo_mode)
            ? body.dialogo_mode
            : DEFAULT_DIALOGO_MODE
    const reqCount = Math.round(Number(body.slides_count))
    const slidesCount =
        reqCount >= MIN_SLIDES && reqCount <= MAX_SLIDES
            ? reqCount
            : DEFAULT_SLIDES

    // Fuente opcional: Códice de Luz (libro destilado). Con codice_id válido se
    // carga su concentrado y el carrusel se construye sobre UNA enseñanza.
    const codiceId = String(body.codice_id ?? "").trim()
    const codice = codiceId ? await fetchCodiceDigest(supabase, codiceId) : null
    const codiceBlock = codice ? buildCodiceBlock(codice, styleKey) : ""
    const effectiveCodiceId = codice ? codiceId : null

    // Memoria anti-repetición (por libro si es Códice; si no, por estilo)
    const recentPulsos = await fetchRecentPulsos(
        supabase,
        styleKey,
        effectiveCodiceId ?? ""
    )

    // Generación de texto (concepto + slides)
    let raw: RawCarousel
    try {
        raw = await callGeminiText(
            GEMINI_API_KEY!,
            buildSystem(style, dialogoMode, codiceBlock),
            buildUser(
                style,
                slidesCount,
                recentPulsos,
                styleKey === "manga_dialogo"
                    ? DIALOGO_MODE_LABELS[dialogoMode]
                    : "",
                codice ? String(codice.title ?? "") : ""
            )
        )
    } catch (err: any) {
        console.error("[carousel] copy gen failed", err)
        return jsonResponse(502, {
            error: "copy_generation_failed",
            detail: String(err?.message ?? err),
        })
    }

    let slides = raw.slides
    if (slides.length > slidesCount) slides = slides.slice(0, slidesCount)
    if (slides.length === 0) {
        return jsonResponse(502, { error: "no_slides_generated" })
    }

    // CTA fijo VERBATIM al cierre del caption (Zak'Haar → app Escáner Vibracional).
    const cta = pickEscanerCta()
    const captionBody = (raw.caption_instagram || "").trimEnd()
    const finalCaption = captionBody ? `${captionBody}\n\n${cta}` : cta

    // Memoria de ANALOGÍA (solo diálogo): el campo físico usado viaja anexado al
    // pulso_nucleo ("· analogía: X") → los próximos carruseles lo ven en el
    // historial y tienen PROHIBIDO repetir el campo. Sin migración: es texto.
    const analogiaCampo =
        styleKey === "manga_dialogo"
            ? String(raw.analogia_campo ?? "")
                  .trim()
                  .slice(0, 60)
            : ""
    const pulsoBase = (raw.pulso_nucleo || "").trim()
    const pulsoFinal = pulsoBase
        ? analogiaCampo
            ? `${pulsoBase} · analogía: ${analogiaCampo}`
            : pulsoBase
        : null

    // INSERT carrusel padre (status prompts_ready)
    let carouselRow: any
    try {
        carouselRow = await insertCarousel(supabase, {
            style_key: styleKey,
            dialogo_mode: styleKey === "manga_dialogo" ? dialogoMode : null,
            codice_id: effectiveCodiceId,
            slides_count: slides.length,
            concept_title: raw.concept_title,
            narrative: raw.narrative,
            caption: finalCaption,
            hashtags: parseHashtags(raw.hashtags),
            pulso_nucleo: pulsoFinal,
            status: "prompts_ready",
            generated_by_clerk_id: adminClerkId,
        })
    } catch (err: any) {
        console.error("[carousel] insert carousel failed", err)
        return jsonResponse(500, {
            error: "db_insert_carousel_failed",
            detail: String(err?.message ?? err),
        })
    }

    // INSERT slides hijos con el prompt YA ensamblado (prefijo de estilo + 4:5).
    let slideRows: any[]
    try {
        slideRows = await insertSlides(
            supabase,
            slides.map((s, idx) => {
                // Manga Astral: el ÚLTIMO slide es la lámina de cierre con el
                // render del iPhone + invitación a descargar la app (visual
                // forzado server-side; el modelo solo aportó el copy_line).
                const isClosing =
                    MANGA_LANES.has(styleKey) && idx === slides.length - 1
                const note = (s.director_note || "").trim()
                return {
                    carousel_id: carouselRow.id,
                    slide_index: idx,
                    slide_label: isClosing
                        ? "Cierre · Invitación a la app"
                        : s.slide_label || `Slide ${idx + 1}`,
                    copy_line: stripGuillemets(s.copy_line) || null,
                    prompt_image: isClosing
                        ? IPHONE_CLOSING_PROMPT
                        : assembleSlidePrompt(
                              style,
                              stripGuillemets(s.prompt_image)
                          ),
                    director_note: isClosing
                        ? IPHONE_CLOSING_NOTE
                        : note.length
                        ? note
                        : null,
                    image_r2_url: null,
                }
            })
        )
    } catch (err: any) {
        console.error("[carousel] insert slides failed", err)
        await markCarouselDeleted(supabase, carouselRow.id)
        return jsonResponse(500, {
            error: "db_insert_slides_failed",
            detail: String(err?.message ?? err),
        })
    }

    console.log(
        `[carousel] ${styleKey}${
            styleKey === "manga_dialogo" ? "/" + dialogoMode : ""
        } · ${slideRows.length} slides ensamblados (solo prompts) · pulsos inyectados: ${recentPulsos.length}`
    )

    return jsonResponse(200, {
        success: true,
        mode: "prompts",
        style: styleKey,
        slides_count: slideRows.length,
        pulsos_inyectados: recentPulsos.length,
        carousel: { ...carouselRow, slides: slideRows },
        message:
            "Carrusel en modo SOLO PROMPTS. Cada slide trae su prompt listo para copiar/pegar en Nano Banana + su nota de referencia aparte (si aplica). Sin generación por API.",
    })
})
