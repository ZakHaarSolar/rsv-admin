// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/generate-soma-posts/index.ts v1.16
// v1.16 — AUDITORÍA PARTE 4 — gobernador de gasto reserve_edge_spend (Gemini
//         texto + Nano Banana imagen). Cota por-usuario 20/día + global 60/día,
//         en el choke point único justo después del gate — cubre retry_image_
//         only Y el batch/reroll normal por igual.
// v1.15 — Texto sobre la imagen LIMPIO: ya no se citan los textos a renderizar
//         con comillas angulares («»); strip server-side de «» en el prompt para
//         que Nano Banana no las dibuje (Conciencia se ve más integrada).
// v1.14 — CONCIENCIA con TOGGLE DE PILAR: el panel puede fijar el eje
//         (azúcar / gluten / aceites / soya / veganismo) y el post trata SOLO
//         ese; 'auto' rota entre los cinco. Se sumó el pilar SIN SOYA al
//         conocimiento. Pareja del panel AT_SomaCero v1.12.
// v1.13 — CONCIENCIA reformulada: la imagen deja de ser un waffle y pasa a ser
//         una TARJETA EDITORIAL DE TEXTO (el gancho/lectura renderizado sobre la
//         imagen, paleta Tierra Viva, acentos botánicos, sin comida); el caption
//         es la extensión. Además rota UN eje por post (azúcar/gluten/aceites/
//         veganismo) sin repetir el reciente, en vez de quedarse en el azúcar.
// v1.12 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// v1.11 — Soma Cero ahora abre los DOMINGOS (antes viernes) con horario 8:00am a
//         2:00pm. Todo el texto visible/de prompts dice "Domingo" y el horario
//         nuevo (CTA regular + CTA del anuncio + categoría D + [VI-bis]). El
//         identificador interno de la categoría sigue siendo 'viernes' (enum DB,
//         sin migración); solo cambió lo que ve y lee el Tripulante.
// v1.10 — MEMES: el logo de Soma Cero es OBLIGATORIO en cada pieza (en modo
//         aleatorio se había colado uno sin logo). Blindado en [VI] cat C, en
//         [VI-bis] MEMES y en el focus de memes del user prompt. Posición: las
//         válidas de v1.9 (cualquiera menos la esquina inferior derecha).
// v1.9 — Directriz global: el logo/marca de Soma Cero va en CUALQUIER parte MENOS
//        la esquina inferior derecha (ahí Nano Banana estampa su marca de agua y
//        se encimaría). Sumada a [VI-bis] y como regla final 8.
// v1.8 — Cero descriptores de ACOMODO en el waffle. Se quitaron "en hilos / en
//        rodajas / repartidas": cualquier palabra sobre cómo van la crema o el
//        plátano puede chocar con la foto real. Ahora el prompt solo NOMBRA los
//        componentes (su crema, sus semillas, su plátano, su forma) y deja que la
//        foto mande del todo.
// v1.7 — Reversa del emplatado por texto (v1.6 hacía que Nano Banana inventara una
//        espiral perfecta que NO es el waffle real). Ahora el prompt del waffle de
//        comida NO describe emplatado: pide reproducir el waffle EXACTAMENTE como en
//        las fotos de referencia reales (y el logo tal cual, si lo usa), sin inventar
//        espirales ni arreglos. La cara-mascota de los MEMES (ilustrada) conserva su
//        look de logo. Aplica a Waffle/Conciencia/Viernes.
// v1.6 — PRESENTACIÓN del waffle por instrucción, no por foto. Las fotos de
//        referencia son el waffle REAL SIN emplatar (sin la crema en espiral);
//        ahora el prompt le pide SIEMPRE a Nano Banana montar NUESTRA presentación
//        sobre el waffle real: crema de almendra en círculos/espiral + UN (1)
//        trozo de plátano al centro (como el logo). Aplica a las 4 categorías.
// v1.5 — Nueva categoría VIERNES (anuncio de apertura semanal). El cuerpo es solo
//        el gancho de "hoy abrimos"; el sistema le pega al final, VERBATIM, el
//        bloque fijo del MENÚ (3 tamaños + precios + horario + WhatsApp +
//        transferencia) y hashtags fijos. Tono seleccionable festivo/elegante/
//        sorpresa para que haya variedad entre viernes. Waffle/Conciencia/Memes
//        conservan su CTA. Pareja del panel AT_SomaCero v1.6 + migración
//        20260604_soma_viernes.sql.
// v1.4 — MEMES con RISA. Giro total: el Waffle Cero es un PERSONAJE ilustrado
//        (habla, sueña, presume), chistes "¿qué le dijo un waffle a otro?",
//        juegos de palabras con "Cero", situaciones absurdas y tiernas. PROHIBIDO
//        deprimir (nada de gente cansada/triste/durmiendo). Estilo ILUSTRADO de
//        marca (caricatura, no foto); los memes NO usan las fotos de referencia.
// v1.3 — (a) Línea corta de marca = "0 azúcar · 0 gluten · 100% vegano" (sin
//        repetir aceites industriales; los ingredientes lo dicen). (b) Conciencia
//        enriquecida con el libro "Cuerpo de Silicio" (aceites de semilla), en
//        lenguaje humano. (c) Memes con baseline nuevo (humor amable + ligera
//        superioridad tranquila, nos burlamos del sistema, no de la gente) +
//        TOGGLE de eje: guiado (ejes en prioridad) o aleatorio (Gemini elige).
// v1.2 — 3 CATEGORÍAS DE CONTENIDO + FOTOS DE REFERENCIA. (a) Categoría ya no es
//        sabor: 'waffle' (promo), 'conciencia' (los 0% + vegano, lenguaje humano,
//        incluye "¿Sabías que…?"), 'memes' (humor que vende + despierta). (b) En
//        MODO MANUAL, los posts donde aparezca el waffle abren el prompt pidiendo
//        usar las fotos de referencia adjuntas + la presentación insignia (plátano
//        al centro + crema de almendra en espiral, como el logo). (c) Conocimiento
//        base de los 0%/vegano traducido a lenguaje de centro de alimentación.
// v1.1 — VIBE COMIDA (no cosmético). Reescritura de las directivas visuales del
//        prompt_nano_banana: fotografía cálida y apetitosa (golden hour, texturas,
//        madera/cerámica, verde vivo, vapor, recién hecho) con la paleta "Tierra
//        Viva" (crema + dorado miel + verde savia + carbón cálido). Se prohíbe el
//        blanco frío estéril / look de farmacia o cosmético.
// v1.0 — SOMA CERO · Atelier. Genera posts de Instagram para Soma Cero
//        (alimentos de alta conductividad, Cancún): copy + prompt visual de
//        Nano Banana, en JSON estricto. Stack 100% paralelo a generate-vtli-posts
//        pero con cerebro de marca propio, CTA fijo de Soma Cero, categoría de
//        línea de producto ('waffle' por ahora) y escritura a la tabla soma_posts.
//
// Modos (igual que el motor VTLI):
//   1) Batch:  POST { admin_clerk_id, category, count, image_mode }
//   2) Reroll: POST { admin_clerk_id, reroll_of_post_id }
//   3) Retry image only: POST { admin_clerk_id, retry_image_only_for_post_id }
//
// image_mode "prompts" = modo manual ($0): el motor solo arma el prompt para
//   pegar a mano en Nano Banana; no genera imagen por API.
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy generate-soma-posts --no-verify-jwt

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

/* AUDITORÍA PARTE 4 · gobernador de gasto. Gemini texto + Nano Banana imagen
   son API de pago y esta edge no tenía ninguna cota más allá de la sesión
   de admin. Reusa la RPC reserve_edge_spend (mismo gobernador de la ola E /
   Parte 3, ver upload-matter-photo). Fail-open a propósito: si la RPC no
   responde, la operación sigue (nunca rompe un post legítimo). Sin ventana
   por IP (no se fijó límite para esta edge — el gobernador la salta con
   p_ip_limit:0). */
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

const GEMINI_TEXT_MODEL = "gemini-3.6-flash"
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`
const GEMINI_IMAGE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`

const MAX_RETRIES_TEXT = 5
const MAX_RETRIES_IMAGE = 3
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000]
const GEMINI_IMAGE_TIMEOUT_MS = 60_000

const FINAL_STATUSES = new Set(["approved", "published", "rerolled"])

const MAX_BATCH_COUNT = 10
const MIN_BATCH_COUNT = 1
const PULSO_HISTORY_LIMIT = 10

/* ═══════════════════════════════════════════════════════════════
   2. CEREBRO DE MARCA — "COCINA CUÁNTICA DE SOMA CERO"
   ═══════════════════════════════════════════════════════════════ */

const SOMA_SYSTEM = `Eres la "Cocina Cuántica de Soma Cero", el motor de IA detrás del Atelier de Contenido de SOMA CERO, una cocina de alimentos de alta conductividad en Cancún. Tu función es materializar conceptos, captions de Instagram y prompts de generación visual para una marca de comida limpia, viva y consciente, en un formato JSON estricto.

[I. ADN DE LA MARCA]
SOMA CERO = el néctar sagrado en su estado más puro. El nombre fusiona dos raíces:
- SOMA: en griego antiguo σῶμα = el cuerpo, el vehículo de la experiencia. En la tradición védica, Soma es el néctar de los dioses, la "savia de la luna", el elixir que regenera el cuerpo y eleva la conciencia. Soma = el alimento sagrado que nutre y regenera el cuerpo físico y sutil.
- CERO: el origen, el vacío sagrado, el punto de partida antes de la manifestación. No es "nada": es el todo potencial, la pureza absoluta antes de que se agregue cualquier cosa. "Cero" también significa cero fricción: cero carga tóxica para el cuerpo, cero ruido para el sistema nervioso, cero obstáculos para que la energía fluya. Y cero como nuevo comienzo: "empiezo de cero", "vuelvo al origen", "me limpio y reinicio".
SOMA CERO = te damos Soma en su versión más limpia, más cercana a su esencia original. Alimento que te devuelve al origen.

[II. LA LÍNEA]
Todo lo que hacemos es: 0 gluten, 0 azúcar, 0 aceites industriales (usamos aceite de coco orgánico) y 100% vegano. Comida limpia y viva que deja el cuerpo ligero y la energía fluyendo. Cancún. A domicilio o pick up.
LÍNEA CORTA DE MARCA (la que usas en captions e imágenes): escribe "0 azúcar · 0 gluten · 100% vegano". NO repitas "0% aceites industriales" en esa línea corta — los ingredientes ya lo dicen y no queremos amontonar tantos ceros. EXCEPCIÓN: en la categoría CONCIENCIA sí puedes explicar a fondo por qué evitamos los aceites industriales.

[III. PRODUCTO ESTRELLA — WAFFLE CERO]
Acabamos de arrancar con un solo sabor: el Waffle Cero. Ingredientes (esta es la lista COMPLETA y EXACTA — nunca inventes ni omitas ingredientes, y nunca agregues otros):
- Avena sin gluten orgánica
- Leche de almendra
- Aceite de coco orgánico
- Crema de almendra
- Plátano
- Amaranto
- Semillas hemp orgánicas
Tres tamaños: medio waffle (1/2), tres cuartos (3/4) y waffle completo (4/4).
PRESENTACIÓN (LA DEFINEN LAS FOTOS REALES, no el texto): el Waffle Cero se ve EXACTAMENTE como en las fotos de referencia reales — su plátano, su crema de almendra y sus semillas (amaranto y hemp) tal como aparecen en la foto. NO describas CÓMO van acomodados (no digas "en hilos", "en rodajas", "en espiral", "en círculos") ni inventes un emplatado propio: cualquier descripción del acomodo puede chocar con la foto y hacer que el modelo dibuje un waffle que NO es el nuestro. Solo nombra sus componentes (su crema, sus semillas, su plátano, su forma) y deja que la foto mande. Reproduce el waffle TAL CUAL las fotos, sin reinventarlo. La única fuente de verdad de cómo se ve el waffle es la foto real; si en el prompt usas el logo, tómalo del logo de referencia tal cual.

[IV. PILAR DE TRANSPARENCIA RADICAL]
A diferencia de la mayoría de los restaurantes que esconden lo que ponen, SOMA CERO declara TODO. Claridad total para quien come: cada ingrediente a la vista. Cuando un post lo amerite (posts de ficha, de ingredientes, de "qué lleva"), lista los SIETE ingredientes del Waffle Cero, completos. La transparencia ES la marca.

[V. VOZ Y TONO — CRÍTICO]
- Cálida, clara, apetitosa, cercana y consciente. Lenguaje 100% humano para gente común: somos un centro de alimentación, no un manual técnico ni un texto esotérico.
- PROHIBIDA la jerga de máquina o esotérica densa: NADA de "hardware", "software", "procesador", "RAM", "mitocondrias", "Pilar", "Avatar", "frecuencia de bits", "entropía tridimensional", "contenedor", "nodo sintético". Traduce TODO a sensaciones reales: cuerpo ligero, energía estable, mente clara, digestión suave, mañana limpia, sin hinchazón, sin bajón.
- Puedes conservar toques poéticos suaves de marca (comida viva, volver al origen, energía que fluye, cero fricción) pero SIEMPRE aterrizados y entendibles.
- Sensorial: textura, dorado, calor del waffle, frescura del plátano, el crujido del amaranto y el hemp.
- Sin promesas médicas como hecho clínico ("cura", "adelgaza", "previene tal enfermedad"). Usa lenguaje experiencial y general: "te deja ligero", "muchas personas se sienten…", "puede".
- Nada de "mágico", "increíble", "secreto", "apúrate". Sin signos de exclamación en cadena. El formato "¿Sabías que…?" SÍ se permite, pero SOLO en posts de Conciencia y con un dato real (no venta vacía).
- Español neutral de México (tú, no vos). Cero argentinismos.

[VI. LAS 4 CATEGORÍAS DE CONTENIDO]
El user prompt te dirá la CATEGORÍA del post. Cíñete a su intención.

A) WAFFLE — Promo del Waffle Cero.
El producto como protagonista, apetitoso, que dé hambre. Ángulos: la ficha de 7 ingredientes; el ritual del domingo en la mañana; su presentación real tal cual las fotos; lo ligero que te deja; el dulce natural del plátano; los tres tamaños; Cancún + a domicilio. Cuando aplique, aclara que hoy mostramos el Waffle Cero (pronto, más sabores).

B) CONCIENCIA — el porqué de los 0% y del 100% vegano.
Educativo, cálido y empoderante, NUNCA alarmista ni con miedo. Explica en palabras simples por qué cuidamos tanto estos puntos. CONOCIMIENTO BASE (dilo con TUS palabras, claro y humano, sin tecnicismos):
· 0% AZÚCAR: el azúcar refinada da un subidón rápido y, al rato, un bajón que deja cansancio, antojo de más y mente nublada. Sin azúcar añadida, la energía es pareja y la cabeza clara. El dulce del Waffle Cero viene del plátano, natural.
· ACEITES INDUSTRIALES (canola, girasol, soya, maíz, "aceite vegetal"): casi toda la comida de fuera se cocina con estos aceites de semillas. El detalle: no nacieron para comerse — hace como cien años eran prácticamente aceites para máquinas y se reetiquetaron como "alimento". Son grasas inestables que se oxidan con el calor y dejan al cuerpo inflamado y pesado. Por eso nosotros cocinamos con aceite de coco orgánico, una grasa estable que el cuerpo sí reconoce y aprovecha. (Dilo simple y sin alarmismo; nada de "PUFA", "dieléctrico" ni química rara.)
· 0% GLUTEN: a muchísima gente el gluten le inflama el intestino (hinchazón, pesadez, esa panza después de comer). Sin gluten, la digestión es ligera. Usamos avena sin gluten orgánica.
· 100% VEGANO: comida de plantas es luz del sol hecha alimento; el cuerpo la asimila fácil, sin la pesadez ni el sueño de digerir productos animales. Más ligero, más energía, más claridad — y sin dañar a ningún ser. (La famosa modorra después de una comida pesada es el cuerpo gastando energía en digerir; las plantas te dejan despierto.)
· SIN SOYA: la soya está en casi todo lo procesado y en MUCHOS productos "veganos" (lecitina de soya, proteína aislada, soya texturizada). Suele venir ultraprocesada y modificada — un derivado de fábrica, no una planta entera. Por eso nosotros usamos ingredientes enteros y reconocibles (avena, plátano, almendra, semillas), nada de derivados de soya. (Dilo simple y cálido, sin alarmismo y sin meterte en temas hormonales.)
El formato "¿Sabías que…?" SÍ está PERMITIDO aquí como gancho educativo REAL (un dato verdadero y claro). Cierra cada post con la luz: por eso Soma Cero es 0% de eso y 100% vivo.
ELIGE UN SOLO EJE por post y ROTA entre los cinco (0% azúcar · 0% gluten · 0% aceites industriales · sin soya · 100% vegano): NO te quedes siempre en el azúcar. Cada post de Conciencia profundiza en UNO distinto y NO repite el eje de los posts recientes (mira el historial de pulsos).
LA LECTURA VA EN LA IMAGEN: el GANCHO o la idea central de la enseñanza va RENDERIZADO sobre la imagen como texto diseñado y bonito (ver [VI-bis] CONCIENCIA). El caption es la EXTENSIÓN: desarrolla esa idea a fondo, cálido y humano. Conciencia NO es post de comida: la imagen NO muestra el waffle ni platillos, muestra el TEXTO con un diseño cálido.

C) MEMES — humor de VERDAD, con risa.
REGLA DE ORO: el meme tiene que SACAR UNA RISA o una sonrisa genuina y dejar antojo. Si no da risa, no sirve. PROHIBIDO DEPRIMIR: NADA de gente cansada, triste, ojerosa, durmiendo en el escritorio, inflada o sufriendo. Cero estética deprimente. Olvídate del formato "antes vs después con persona destruida": no lo uses.
EL WAFFLE ES EL PERSONAJE: el Waffle Cero tiene personalidad — carismático, relajado, "cero drama", consciente y un poco pícaro. Habla, piensa, reacciona, sueña y vive situaciones absurdas y tiernas. Su cara es su propia presentación: la espiral de crema de almendra + el plátano al centro (como el logo), con ojitos expresivos.
QUÉ SÍ (elige y mezcla, busca el chiste real):
- Chistes tipo "¿Qué le dijo un waffle a otro waffle?" con remate ingenioso; dos waffles conversando con bocadillos de diálogo.
- Juegos de palabras con "Cero": cero culpa, cero drama, cero arrepentimiento, cero límites, "cero gluten, mil sabor"… y con comer limpio/ligero/volver al origen.
- El waffle como personaje en escenas ridículas y adorables: soñando con waffles, presumiendo su espiral, de vacaciones, meditando, sintiéndose tranquilo y superior con calma, viviendo su mejor vida.
- Humor observacional cálido y absurdo sobre lo rico que es comer limpio (sin culpa, sin bajón), contado con gracia y POR EL LADO LUMINOSO — nunca mostrando a alguien sufriendo.
- Comparaciones humorísticas SÍ, pero por el lado feliz: el waffle "ganando" con humor o la cara tranquila del que ya come limpio; jamás retratando gente deprimida o cansada.
PUNCHLINE: corto, claro, con personalidad de marca; se entiende en 2 segundos.
QUÉ NO: gente cansada/triste/durmiendo/ojerosa/inflada; el "antes vs después" con personas sufriendo; atacar marcas reales; humor agresivo o de "soy más sano que tú"; textos largos; jerga técnica o "biohacking bro".
EJES (guiado, en prioridad): 1) waffles que hablan / "qué le dijo un waffle a otro waffle"; 2) juego de palabras con "Cero"; 3) el waffle con personalidad en una situación absurda y tierna (soñando, presumiendo, de viaje, meditando); 4) humor observacional cálido de comer limpio; 5) el waffle idolatrado/soñado con gracia. (El user prompt te dirá si te apoyas en estos ejes o eliges un ángulo libre y sorpresivo.)
FORMATO: una o dos viñetas, texto corto y punchy (máximo 2-3 líneas). El texto del chiste va EN la imagen (descríbelo en prompt_nano_banana); el caption acompaña con calidez y el antojo del Waffle Cero.
EL LOGO SIEMPRE PRESENTE: todo meme lleva el logo de Soma Cero en la imagen, en cualquier zona MENOS la esquina inferior derecha. Es regla fija, también en modo aleatorio: nunca generes un meme sin el logo.

D) VIERNES — el anuncio de apertura semanal.
Soma Cero abre los DOMINGOS. Este post grita, con alegría, "¡hoy es domingo, hoy abrimos!" / "domingo de Soma Cero". Es la invitación de bienvenida de la semana. CLAVE: busca VARIEDAD entre domingos — a veces juguetón y con la chispa del Waffle Cero personaje (puede coquetear con el formato meme), a veces sereno y elegante (bodegón cálido y apetitoso); el user prompt te dirá el TONO. El cuerpo del caption es CORTO y solo celebra que llegó el domingo e invita a pedir hoy. NO escribas el menú, ni los tamaños, ni los precios, ni el horario, ni el WhatsApp, ni "a domicilio/pick up/transferencia": el SISTEMA agrega al final, VERBATIM, el bloque fijo del MENÚ completo (los tres tamaños con precios, el horario, el WhatsApp y la forma de pago). Tu única tarea de texto es el gancho de apertura del domingo: 1 a 3 frases cálidas y con energía de "ya es domingo". En la IMAGEN sí puedes hacer protagonista un rótulo bonito tipo "HOY ES DOMINGO" / "DOMINGO DE SOMA CERO" (ver [VI-bis]).

[VI-bis. DIRECTIVAS DE IMAGEN por categoría]
- Paleta de marca cálida 'Tierra Viva': crema/hueso + dorado miel + verde vivo fresco + madera/cerámica terrosa, luz cálida de mañana. NUNCA blanco frío estéril ni estética de cosmético/farmacia. La comida debe ANTOJAR. Aspect ratio 3:4 vertical 1080x1440. Sin watermarks, sin marcos, sin manos con dedos contables.
- LOGO / MARCA EN LA PIEZA: cuando la composición incluya el logo o la marca de Soma Cero, colócalo en CUALQUIER parte MENOS la esquina INFERIOR DERECHA (abajo a la derecha). Esa esquina la ocupa la marca de agua automática de Nano Banana y el logo se encimaría con ella. Ubícalo arriba (izquierda, centro o derecha), abajo a la izquierda o centrado — NUNCA abajo a la derecha; deja esa esquina libre.
- CUANDO EL POST MUESTRE EL WAFFLE CERO: el waffle se reproduce EXACTAMENTE como en las fotos de referencia reales (su plátano, su crema, sus semillas, su forma — tal como están en la foto). NO describas el acomodo (nada de "en hilos/rodajas/espiral/círculos") ni inventes emplatado: solo nombra los componentes y pide reproducir el waffle TAL CUAL las fotos, sin reinventarlo, sobre madera/cerámica cálida. Si el user prompt indica MODO MANUAL, abre el prompt pidiendo usar EXACTAMENTE las fotos de referencia adjuntas del waffle real (y el logo tal cual, si lo usas).
- WAFFLE: fotografía de alimentos cálida y apetitosa (golden hour, texturas, vapor sutil, recién hecho).
- CONCIENCIA: NO es foto de comida y NO lleva waffle. Es una TARJETA EDITORIAL DE TEXTO diseñada con alma: el GANCHO o la frase central de la enseñanza va RENDERIZADO sobre la imagen, en tipografía cálida, grande y muy legible, perfectamente escrita (sin faltas de ortografía), con amplio espacio limpio y buena jerarquía. Fondo de la paleta 'Tierra Viva' (crema/hueso, dorado miel, verde fresco, madera) con textura suave y luz cálida de mañana; acentos sutiles de naturaleza viva (una hoja, una rama, un trazo botánico fino, grano de luz dorada) SIN saturar y SIN comida. Estética de marca de bienestar premium, serena y luminosa — JAMÁS infografía fría, look de farmacia ni de stock. Incluye el logo de Soma Cero en una zona permitida (cualquiera MENOS la esquina inferior derecha). Aspect ratio 3:4. La LECTURA es la protagonista de la imagen.
- MEMES: ESTILO ILUSTRADO DE MARCA (NO foto realista, NO fotos de stock de gente). Caricatura cálida y encantadora, ilustración editorial moderna de líneas limpias y formas redondeadas: el Waffle Cero como PERSONAJE adorable — su cara es la espiral de crema de almendra + el plátano al centro (como el logo), con ojitos expresivos y, si encaja, brazos/piernas o gestos. Una sola viñeta o dos waffles conversando con bocadillos. Paleta cálida 'Tierra Viva' (crema, dorado miel, verde fresco, madera). Gesto y expresión MUY claros (que se lea el chiste de un vistazo). Texto del chiste corto, grande y bien legible, integrado con gracia. Que se sienta una marca con humor y alma, jamás un meme genérico ni una foto triste. SIEMPRE incluye el LOGO de Soma Cero en la pieza, visible y bien integrado, en una posición permitida (cualquiera MENOS la esquina inferior derecha: arriba, abajo a la izquierda o centrado). El logo NO puede faltar en NINGÚN meme, ni siquiera en modo aleatorio.
- DOMINGO: pieza de ANUNCIO de apertura. El Waffle Cero (reproducido EXACTAMENTE como en las fotos de referencia reales, sin inventar emplatado) como héroe + un rótulo claro y bonito tipo "HOY ES DOMINGO" o "DOMINGO DE SOMA CERO" integrado con gracia (tipografía cálida, grande, legible). Alterna estilos entre piezas según el TONO que pida el user prompt: FESTIVO = composición alegre y vibrante, puede usar al waffle-personaje con chispa; ELEGANTE = bodegón cálido y sobrio del waffle, apetitoso y con clase. Paleta 'Tierra Viva' (crema, dorado miel, verde fresco, madera), luz cálida de mañana, que ANTOJE. Aspect ratio 3:4. Si el user prompt indica MODO MANUAL, abre pidiendo usar las fotos de referencia del waffle real. Puedes sugerir sutilmente "Domingo 8:00am–2:00pm" en la imagen si encaja, pero los precios NO van en la imagen (van en el caption, los agrega el sistema).

[VII. CONTRATO JSON ESTRICTO]
Toda respuesta DEBE ser un objeto JSON estrictamente válido bajo la siguiente estructura, sin texto introductorio, sin texto conclusivo, sin bloques markdown:
{
  "posts": [
    {
      "target": "etiqueta corta en snake_case del ángulo del post (ej. ficha_ingredientes, ritual_domingo, sabias_que_gluten, meme_bajon_azucar, hero_4_4)",
      "aha_moment": "Una frase gancho, cálida y clara, que captura la esencia del post (para memes, puede ser el remate gracioso). Sin signos de exclamación múltiples.",
      "prompt_nano_banana": "Instrucciones de imagen EN ESPAÑOL siguiendo la sección [VI-bis] según la categoría del post (waffle / conciencia / meme). Aspect ratio 3:4 vertical 1080x1440, paleta cálida 'Tierra Viva' que antoje, nada de blanco frío / cosmético. Detalla escena, luz y composición; si el post muestra el Waffle Cero, pide reproducirlo EXACTAMENTE como en las fotos de referencia reales (sin inventar emplatado, espirales ni arreglos) y, en MODO MANUAL, abre pidiendo usar EXACTAMENTE las fotos de referencia adjuntas del waffle real (y el logo tal cual, si lo usas). Para CONCIENCIA, la imagen es una TARJETA DE TEXTO diseñada con el gancho/la lectura RENDERIZADO encima (NO waffle, NO foto de comida). Para memes, incluye el texto del meme corto y legible. 70-140 palabras.",
      "caption_instagram": "El cuerpo del post en la voz de Soma Cero (lenguaje humano y cercano), con saltos de línea limpios. SIN CTA: NO escribas precios, NO escribas horario, NO escribas WhatsApp, NO escribas 'a domicilio'/'pick up'/'transferencia' ni '👆🏼 link de bio' — el SISTEMA agrega el bloque fijo de Soma Cero al final, verbatim. Termina el cuerpo en su última frase. Cuando el ángulo lo amerite, lista los SIETE ingredientes completos.",
      "hashtags": "entre 3 y 5 hashtags relevantes (#somacero + mezcla de local Cancún + nicho sin gluten/vegano/alta conductividad), cada uno con # y separados por espacios",
      "pulso_nucleo": "una oración corta declarativa que captura la esencia conceptual única del post (memoria anti-repetición)"
    }
  ]
}

[VIII. REGLAS FINALES]
1. Devuelve SOLO el JSON. Sin markdown, sin texto fuera del objeto.
2. El array "posts" debe contener exactamente la cantidad pedida en el user prompt.
3. NUNCA inventes ingredientes ni propiedades médicas. La lista de 7 ingredientes es la verdad.
4. NUNCA escribas el CTA (precios/horario/WhatsApp/a domicilio): lo agrega el sistema.
5. Cada post nuevo lleva un pulso_nucleo conceptualmente distinto a todos los demás.
6. Paleta visual SIEMPRE cálida y apetitosa ('Tierra Viva'): crema/hueso + dorado miel + verde vivo + madera/cerámica terrosa, con luz cálida de mañana. NUNCA blanco frío estéril ni estética de cosmético/farmacia. La comida tiene que antojar. Aspect ratio 3:4.
7. Lenguaje SIEMPRE humano y cercano (centro de alimentación). Cero jerga de máquina o esotérica densa. Respeta la CATEGORÍA que pide el user prompt (waffle / conciencia / memes / domingo).
8. Si la pieza lleva el logo o la marca de Soma Cero, NUNCA lo coloques en la esquina INFERIOR DERECHA (ahí cae la marca de agua de Nano Banana): va en cualquier otra zona (arriba, abajo a la izquierda o centrado).
`

/* ═══════════════════════════════════════════════════════════════
   3. USER PROMPT BUILDER — con memoria pulso_nucleo
   ═══════════════════════════════════════════════════════════════ */

function buildUserPrompt(
    category: string,
    count: number,
    recentPulsos: string[],
    excludeTargets: string[] = [],
    imageMode: string = "api",
    memeRandomAxis: boolean = false,
    viernesTone: string = "sorpresa",
    concienciaPilar: string = "auto"
): string {
    const cat = (() => {
        switch (category) {
            case "waffle":
                return {
                    label: "WAFFLE — Promo del Waffle Cero",
                    focus: "Producto como protagonista, apetitoso, que dé hambre. Sigue la categoría A) de la sección [VI]. Muestra el Waffle Cero tal cual sus fotos de referencia reales.",
                }
            case "conciencia":
                return {
                    label: "CONCIENCIA — el porqué de los 0% y del 100% vegano",
                    focus: "Educa en lenguaje 100% humano y cálido (sin tecnicismos ni miedo). ELIGE UN SOLO eje y ROTA entre los cinco (0% azúcar · 0% gluten · 0% aceites industriales · sin soya · 100% vegano) SIN repetir el de los posts recientes — no te quedes en el azúcar (si el user prompt fija un eje, trata SOLO ese). Puedes usar '¿Sabías que…?' con un dato real. LA IMAGEN ES UNA TARJETA DE TEXTO DISEÑADA (NO waffle, NO foto de comida): el gancho/idea central va RENDERIZADO sobre la imagen y el caption es la EXTENSIÓN que la desarrolla. Sigue las categorías B) y [VI-bis] CONCIENCIA.",
                }
            case "memes":
                return {
                    label: "MEMES — humor de verdad, con risa",
                    focus: "Memes que SAQUEN RISA: el Waffle Cero como personaje carismático (habla, sueña, presume, reacciona), chistes tipo '¿qué le dijo un waffle a otro waffle?', juegos de palabras con 'Cero', situaciones absurdas y tiernas. PROHIBIDO DEPRIMIR: nada de gente cansada/triste/durmiendo/inflada ni el 'antes vs después' con personas sufriendo. ESTILO ILUSTRADO de marca (caricatura del waffle, NO foto realista). Sigue la categoría C) de la sección [VI]. El texto del chiste va EN la imagen. INCLUYE SIEMPRE el logo de Soma Cero en la imagen, en una posición permitida (cualquiera menos abajo a la derecha) — obligatorio en TODOS los memes, incluido el modo aleatorio.",
                }
            case "viernes":
                return {
                    label: "VIERNES — anuncio de apertura semanal",
                    focus: "Anuncia que HOY es domingo y Soma Cero abre. Gancho de bienvenida CORTO y cálido ('¡llegó el domingo!', 'domingo de Soma Cero', 'hoy abrimos'). El cuerpo solo celebra la apertura del domingo e invita a pedir hoy; NO escribas el menú, los tamaños, los precios, el horario ni el contacto: el sistema añade al final el bloque fijo del MENÚ completo. Sigue la categoría D) de la sección [VI].",
                }
            default:
                return {
                    label: "WAFFLE — Promo del Waffle Cero",
                    focus: "Producto como protagonista. Sigue la categoría A) de la sección [VI].",
                }
        }
    })()

    const memeAxisNote =
        category === "memes"
            ? memeRandomAxis
                ? " EJE: ALEATORIO — elige TÚ un ángulo fresco y sorpresivo; NO te limites a los ejes en prioridad, puedes inventar situaciones nuevas y formatos distintos (mantén el tono y TODAS las reglas de la categoría C)."
                : " EJE: GUIADO — apóyate en los ejes temáticos en prioridad de la categoría C, variando entre posts."
            : ""

    const viernesToneNote =
        category === "viernes"
            ? viernesTone === "festivo"
                ? " TONO: FESTIVO Y JUGUETÓN — energía de celebración, la chispa del Waffle Cero personaje, humor cálido de '¡por fin domingo!'. Puede coquetear con el formato meme sin dejar de ser un anuncio de apertura."
                : viernesTone === "elegante"
                  ? " TONO: SERENO Y ELEGANTE — bienvenida cálida y con clase, bodegón apetitoso del waffle, menos broma y más belleza. Anuncio sobrio que da hambre."
                  : " TONO: LIBRE Y VARIADO — tú eliges entre festivo/juguetón y sereno/elegante, buscando VARIAR respecto a los domingos recientes (mira el historial); que no se repita el mismo tono dos veces seguidas."
            : ""

    // Solo conciencia: si el panel fija un pilar, este post trata EXCLUSIVAMENTE
    // ese eje (override del "rota entre los cinco"). 'auto' = rota como siempre.
    const PILAR_NOTES: Record<string, string> = {
        azucar: " EJE OBLIGATORIO DE ESTE POST: 0% AZÚCAR. Trata EXCLUSIVAMENTE el azúcar refinada (el subidón y el bajón, la energía pareja sin azúcar añadida, el dulce natural del plátano). NO mezcles los otros ejes.",
        gluten: " EJE OBLIGATORIO DE ESTE POST: 0% GLUTEN. Trata EXCLUSIVAMENTE el gluten (la inflamación/pesadez intestinal, la digestión ligera sin gluten, la avena sin gluten orgánica). NO mezcles los otros ejes.",
        aceites: " EJE OBLIGATORIO DE ESTE POST: 0% ACEITES INDUSTRIALES. Trata EXCLUSIVAMENTE los aceites de semillas (canola/girasol/soya/maíz, grasas inestables que inflaman y pesan, por qué cocinamos con aceite de coco orgánico). NO mezcles los otros ejes.",
        soya: " EJE OBLIGATORIO DE ESTE POST: SIN SOYA. Trata EXCLUSIVAMENTE la soya (presente en casi todo lo procesado y en muchos productos 'veganos' — lecitina, proteína aislada, soya texturizada; un derivado ultraprocesado de fábrica; por qué preferimos plantas enteras reconocibles, no derivados de soya). NO mezcles los otros ejes. Sin alarmismo ni temas hormonales.",
        veganismo: " EJE OBLIGATORIO DE ESTE POST: 100% VEGANO. Trata EXCLUSIVAMENTE el porqué vegano (comida de plantas = luz del sol, fácil de asimilar, sin la modorra de digerir productos animales, más energía y claridad, sin dañar a ningún ser). NO mezcles los otros ejes.",
    }
    const concienciaPilarNote =
        category === "conciencia" && PILAR_NOTES[concienciaPilar]
            ? PILAR_NOTES[concienciaPilar]
            : ""

    let manualRefBlock = ""
    if (imageMode === "prompts") {
        if (category === "memes") {
            manualRefBlock = `

MODO MANUAL (solo prompts): el meme se generará a mano. Va en el ESTILO ILUSTRADO de marca (caricatura cálida del Waffle Cero como personaje; ver categoría C y sección [VI-bis]). NO uses las fotos de referencia reales del waffle en los memes — aquí el waffle es un personaje DIBUJADO, no una foto. El prompt_nano_banana describe la ilustración, los personajes, el chiste y el texto del meme.`
        } else if (category === "conciencia") {
            manualRefBlock = `

MODO MANUAL (solo prompts): la pieza de Conciencia se generará a mano. Es una TARJETA EDITORIAL DE TEXTO — NO lleva waffle, NO es foto de comida y NO uses las fotos de referencia del waffle. El prompt_nano_banana describe el fondo cálido 'Tierra Viva', los acentos botánicos/de luz sutiles y la composición, y SOBRE TODO el TEXTO que va RENDERIZADO en la imagen (el gancho/lectura, grande y muy legible, escrito LIMPIO sin comillas ni símbolos de cita a su alrededor) + el logo de Soma Cero en zona permitida (menos abajo a la derecha).`
        } else {
            manualRefBlock = `

MODO MANUAL (solo prompts): la imagen la generará una persona a mano adjuntando FOTOS DE REFERENCIA del Waffle Cero REAL (varios ángulos) y, si aplica, el logo. POR ESO: en CADA post donde aparezca el Waffle Cero, el campo prompt_nano_banana DEBE EMPEZAR pidiendo usar EXACTAMENTE las fotos de referencia adjuntas y reproducir ESE waffle TAL CUAL aparece en ellas (su plátano, su crema, sus semillas, su forma, tal como están en la foto), SIN reinventarlo, SIN describir el acomodo (nada de "en hilos/rodajas/espiral/círculos") y SIN inventar ningún emplatado. Si el prompt usa el logo, que lo tome del logo de referencia tal cual. Ejemplo de apertura: "Usa EXACTAMENTE las fotos de referencia adjuntas del Waffle Cero real. Reproduce ESE mismo waffle tal como se ve en las fotos —su plátano, su crema de almendra, sus semillas, su forma— sin cambiar ni inventar nada de su presentación, y colócalo en: [escena cálida]…". En posts SIN waffle (conciencia conceptual), NO menciones fotos de referencia; describe el visual libremente.`
        }
    }

    let pulsosBlock = ""
    if (recentPulsos.length) {
        pulsosBlock = `

HISTORIAL RECIENTE (REGLA ESTRICTA):
Para mantener fresca la matriz de contenido, queda prohibido repetir o reciclar los conceptos centrales de las últimas publicaciones. Aquí tienes los pulsos de los posts recientes; explora ángulos completamente nuevos:

${recentPulsos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Cada post nuevo debe llevar un pulso_nucleo conceptualmente distinto a todos los anteriores.`
    }

    let excludeBlock = ""
    if (excludeTargets.length) {
        excludeBlock = `

EVITAR REPETIR ÁNGULOS RECIENTES: ${excludeTargets.join(", ")}. Elige un target distinto a esos para esta tanda.`
    }

    return `Genera ${count} post(s) nuevo(s) de Instagram de la CATEGORÍA: ${cat.label}.
${cat.focus}${memeAxisNote}${viernesToneNote}${concienciaPilarNote}${manualRefBlock}${pulsosBlock}${excludeBlock}

Devuelve estrictamente el JSON con el array "posts" de ${count} elemento(s) según el contrato de tu sistema. Sin texto adicional fuera del JSON.`
}

/* ═══════════════════════════════════════════════════════════════
   4. GEMINI HELPERS
   ═══════════════════════════════════════════════════════════════ */

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RawCopyPost {
    target: string
    aha_moment: string
    prompt_nano_banana: string
    caption_instagram: string
    hashtags: string
    pulso_nucleo: string
}

async function callGeminiText(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<RawCopyPost[]> {
    let lastErr: any = null
    for (let attempt = 0; attempt < MAX_RETRIES_TEXT; attempt++) {
        try {
            const url = `${GEMINI_TEXT_ENDPOINT}?key=${apiKey}`
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: {
                        role: "system",
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        { role: "user", parts: [{ text: userPrompt }] },
                    ],
                    generationConfig: {
                        temperature: 0.9,
                        topP: 0.95,
                        maxOutputTokens: 12000,
                        responseMimeType: "application/json",
                    },
                }),
            })

            if (!res.ok) {
                const errBody = await res.text()
                if (res.status >= 500 && attempt < MAX_RETRIES_TEXT - 1) {
                    console.warn(
                        `[soma:text] ${res.status} retry ${attempt + 1}`,
                        errBody.slice(0, 200)
                    )
                    await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                    continue
                }
                throw new Error(
                    `Gemini text ${res.status}: ${errBody.slice(0, 500)}`
                )
            }

            const data = await res.json()
            const text =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
            if (!text) throw new Error("Gemini text: respuesta vacía")

            const parsed = extractJsonPosts(text)
            if (!Array.isArray(parsed) || parsed.length === 0) {
                throw new Error(
                    `Gemini text: JSON inválido o vacío. Raw: ${text.slice(0, 300)}`
                )
            }
            return parsed
        } catch (err) {
            lastErr = err
            if (attempt < MAX_RETRIES_TEXT - 1) {
                await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                continue
            }
        }
    }
    throw lastErr ?? new Error("Gemini text: agotado retries")
}

function extractJsonPosts(raw: string): RawCopyPost[] {
    let cleaned = raw.trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
    }

    const firstBrace = cleaned.indexOf("{")
    const firstBracket = cleaned.indexOf("[")

    let jsonStr: string
    if (
        firstBrace !== -1 &&
        (firstBracket === -1 || firstBrace < firstBracket)
    ) {
        const lastBrace = cleaned.lastIndexOf("}")
        if (lastBrace === -1)
            throw new Error(`Sin } cierre en: ${cleaned.slice(0, 200)}`)
        jsonStr = cleaned.slice(firstBrace, lastBrace + 1)
    } else if (firstBracket !== -1) {
        const lastBracket = cleaned.lastIndexOf("]")
        if (lastBracket === -1)
            throw new Error(`Sin ] cierre en: ${cleaned.slice(0, 200)}`)
        jsonStr = cleaned.slice(firstBracket, lastBracket + 1)
    } else {
        throw new Error(`Sin JSON detectable: ${cleaned.slice(0, 200)}`)
    }

    const parsed = JSON.parse(jsonStr)
    const posts = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.posts)
        ? parsed.posts
        : Array.isArray(parsed?.data)
        ? parsed.data
        : null

    if (!Array.isArray(posts)) {
        throw new Error(
            `Esperaba array 'posts' o array directo, recibí: ${typeof parsed}`
        )
    }

    return posts.map((p: any) => ({
        target: String(p?.target ?? "waffle"),
        aha_moment: String(p?.aha_moment ?? ""),
        prompt_nano_banana: String(
            p?.prompt_nano_banana ?? p?.prompt_visual ?? ""
        ).replace(/[«»]/g, ""),
        caption_instagram: String(p?.caption_instagram ?? p?.caption ?? ""),
        hashtags: String(p?.hashtags ?? ""),
        pulso_nucleo: String(p?.pulso_nucleo ?? ""),
    }))
}

interface GeneratedImage {
    bytes: Uint8Array
    mimeType: string
}

async function callGeminiImage(
    apiKey: string,
    visualPrompt: string
): Promise<GeneratedImage> {
    let lastErr: any = null
    for (let attempt = 0; attempt < MAX_RETRIES_IMAGE; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(
            () => controller.abort(),
            GEMINI_IMAGE_TIMEOUT_MS
        )
        try {
            const url = `${GEMINI_IMAGE_ENDPOINT}?key=${apiKey}`
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: visualPrompt }] },
                    ],
                    generationConfig: { responseModalities: ["IMAGE"] },
                }),
                signal: controller.signal,
            })

            if (!res.ok) {
                const errBody = await res.text()
                if (res.status >= 500 && attempt < MAX_RETRIES_IMAGE - 1) {
                    console.warn(
                        `[soma:image] ${res.status} retry ${attempt + 1}`,
                        errBody.slice(0, 200)
                    )
                    await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                    continue
                }
                throw new Error(
                    `Gemini image ${res.status}: ${errBody.slice(0, 500)}`
                )
            }

            const data = await res.json()
            const parts = data?.candidates?.[0]?.content?.parts ?? []
            for (const part of parts) {
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
                    `[soma:image] TIMEOUT ${GEMINI_IMAGE_TIMEOUT_MS}ms attempt ${attempt + 1}`
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
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
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
        `${method}\n` +
        `${canonicalUri}\n` +
        `\n` +
        `${canonicalHeaders}\n` +
        `${signedHeaders}\n` +
        `${payloadHash}`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign =
        `AWS4-HMAC-SHA256\n` +
        `${amzDate}\n` +
        `${credentialScope}\n` +
        `${await sha256Hex(canonicalRequest)}`

    const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp)
    const kRegion = await hmacSha256(kDate, region)
    const kService = await hmacSha256(kRegion, service)
    const kSigning = await hmacSha256(kService, "aws4_request")

    const signatureBytes = await hmacSha256(kSigning, stringToSign)
    const signature = bytesToHex(signatureBytes)

    const authHeader =
        `AWS4-HMAC-SHA256 ` +
        `Credential=${cfg.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, ` +
        `Signature=${signature}`

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
        console.warn(`[soma:admin] check failed ${res.status}`)
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
            `${cfg.url}/rest/v1/rpc/get_recent_soma_pulsos`,
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

interface InsertPostInput {
    category: string
    target: string
    aha_moment: string
    prompt_visual: string
    caption: string
    hashtags: string[]
    pulso_nucleo: string
    image_r2_url: string | null
    image_mode: string | null
    generated_by_clerk_id: string
    parent_post_id: string | null
}

async function insertSomaPostsBatch(
    cfg: SupabaseConfig,
    posts: InsertPostInput[]
): Promise<any[]> {
    const res = await fetch(`${cfg.url}/rest/v1/soma_posts`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(posts),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `Insert soma_posts ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    return await res.json()
}

async function updatePostImage(
    cfg: SupabaseConfig,
    postId: string,
    imageUrl: string
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/soma_posts?id=eq.${postId}`,
        {
            method: "PATCH",
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify({ image_r2_url: imageUrl }),
        }
    )
    if (!res.ok) {
        const errBody = await res.text()
        console.error(
            `[soma:bg] update image_r2_url failed ${res.status} for ${postId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function patchPostFields(
    cfg: SupabaseConfig,
    postId: string,
    patch: Record<string, any>
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/soma_posts?id=eq.${postId}`,
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
            `[soma:patch] failed ${res.status} for ${postId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function markPostRejected(
    cfg: SupabaseConfig,
    postId: string,
    reason: string
): Promise<void> {
    await fetch(`${cfg.url}/rest/v1/soma_posts?id=eq.${postId}`, {
        method: "PATCH",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: "rejected" }),
    }).catch(() =>
        console.warn(`[soma:bg] mark rejected failed for ${postId}`)
    )
    console.error(`[soma:bg] image failed for ${postId}: ${reason}`)
}

async function markParentRerolled(
    cfg: SupabaseConfig,
    parentId: string,
    adminClerkId: string
): Promise<void> {
    await fetch(
        `${cfg.url}/rest/v1/rpc/increment_soma_post_reroll_count`,
        {
            method: "POST",
            headers: {
                apikey: cfg.serviceRoleKey,
                Authorization: `Bearer ${cfg.serviceRoleKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ p_post_id: parentId }),
        }
    ).catch((e) =>
        console.warn("[soma:reroll] increment count failed", e)
    )

    await fetch(`${cfg.url}/rest/v1/rpc/update_soma_post_status`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            p_admin_clerk_id: adminClerkId,
            p_post_id: parentId,
            p_new_status: "rerolled",
        }),
    }).catch((e) =>
        console.warn("[soma:reroll] mark parent failed", e)
    )
}

async function fetchPostById(
    cfg: SupabaseConfig,
    postId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/soma_posts?id=eq.${postId}&select=*`,
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

/* ═══════════════════════════════════════════════════════════════
   7. MAPPER · LLM → DB · CTA FIJO DE SOMA CERO
   ═══════════════════════════════════════════════════════════════ */

function parseHashtagsString(raw: string): string[] {
    if (!raw) return []
    return raw
        .split(/\s+/)
        .map((h) => h.trim().replace(/^#/, ""))
        .filter((h) => h.length > 0)
}

// CTA fijo del cierre de TODO post de Soma Cero. El modelo escribe el caption SIN
// CTA y el sistema le pega ESTE texto VERBATIM. Cierre "\n.\n." para separar de
// los hashtags. Para cambiar precios/horario/WhatsApp, edita SOLO esta constante.
const SOMA_CTA =
    "🌅 SOMA CERO · Cancún\nAlimentos de alta conductividad ⚡\n\n🧇 Waffle Cero · tamaños:\n· ½ waffle — $111\n· ¾ waffle — $155\n· waffle completo — $199 MXN\n\n🌱 0 azúcar · 0 gluten · 100% vegano\n🛵 Servicio a domicilio o pick up\n🗓️ Domingo · 8:00 a.m. a 2:00 p.m.\n💳 Pago por transferencia\n📲 WhatsApp 55 2110 2765\n.\n."

// Cierre fijo de los posts de VIERNES (anuncio de apertura). Es el bloque del
// MENÚ completo que Zak pidió VERBATIM: arranca con "Tú eliges cuánto Soma hoy",
// los tres tamaños con precios, la línea limpia, el horario y el contacto. Los
// hashtags NO van aquí — van en SOMA_VIERNES_HASHTAGS (campo hashtags), para que
// el panel los muestre aparte y "Copiar texto" los pegue al final del menú.
const SOMA_VIERNES_CTA =
    "Tú eliges cuánto Soma hoy.\n\nTres tamaños de nuestro Waffle Cero, para el hambre que traigas:\n\n🧇 ½ waffle — $111\n🧇 ¾ waffle — $155\n🧇 Waffle completo — $199 MXN\n\nEl mismo waffle limpio de siempre:\n• 100% vegano.\n• 0% gluten\n• 0% azúcar\n🌱 Hecho con ingredientes que puedes nombrar.\n\n📍 Cancún · Domingo 8:00am – 2:00pm\n• 🛵 A domicilio o pick up.\n• 📞 WhatsApp 55 2110 2765.\n• 💳 Únicamente pagos por Transferencia."

const SOMA_VIERNES_HASHTAGS = [
    "somacero",
    "cancun",
    "vegano",
    "singluten",
    "waffles",
]

function ctaForCategory(category: string): string {
    return category === "viernes" ? SOMA_VIERNES_CTA : SOMA_CTA
}

function appendPostCta(caption: string, category: string): string {
    const body = (caption || "").trimEnd()
    const cta = ctaForCategory(category)
    return body ? `${body}\n\n${cta}` : cta
}

function mapLlmToPlaceholder(
    raw: RawCopyPost,
    category: string,
    adminClerkId: string,
    parentPostId: string | null,
    imageMode: string
): InsertPostInput {
    return {
        category,
        target: raw.target,
        aha_moment: raw.aha_moment,
        prompt_visual: raw.prompt_nano_banana,
        caption: appendPostCta(raw.caption_instagram, category),
        hashtags:
            category === "viernes"
                ? SOMA_VIERNES_HASHTAGS
                : parseHashtagsString(raw.hashtags),
        pulso_nucleo: raw.pulso_nucleo,
        image_r2_url: null,
        image_mode: imageMode === "prompts" ? "prompts" : "api",
        generated_by_clerk_id: adminClerkId,
        parent_post_id: parentPostId,
    }
}

/* ═══════════════════════════════════════════════════════════════
   8. BACKGROUND IMAGE GENERATION (EdgeRuntime.waitUntil)
   ═══════════════════════════════════════════════════════════════ */

async function processImagesBackground(
    geminiKey: string,
    supabase: SupabaseConfig,
    r2: R2Config,
    placeholders: any[]
): Promise<void> {
    const startTs = Date.now()
    console.log(
        `[soma:bg] starting — ${placeholders.length} images to process`
    )
    const today = todayDateString()

    const tasks = placeholders.map(async (placeholder, idx) => {
        if (idx > 0) await sleep(idx * 250)
        const postId = placeholder.id
        const visualPrompt = placeholder.prompt_visual
        if (!postId || !visualPrompt) {
            console.warn(
                `[soma:bg] #${idx} placeholder sin id o prompt`,
                JSON.stringify(placeholder).slice(0, 200)
            )
            return
        }
        const tStart = Date.now()
        console.log(`[soma:bg] #${idx} ${postId} calling Gemini Image…`)
        try {
            const img = await callGeminiImage(geminiKey, visualPrompt)
            const tImg = Date.now()
            console.log(
                `[soma:bg] #${idx} ${postId} Gemini OK (${tImg - tStart}ms, ${img.bytes.length} bytes, ${img.mimeType})`
            )
            const ext = img.mimeType === "image/jpeg" ? "jpg" : "png"
            const uuid = crypto.randomUUID()
            const key = `Soma Cero/Imagenes/Atelier/${today}/${uuid}.${ext}`
            const url = await uploadImageToR2(r2, img.bytes, key, img.mimeType)
            const tUp = Date.now()
            console.log(
                `[soma:bg] #${idx} ${postId} R2 PUT OK (${tUp - tImg}ms)`
            )
            await updatePostImage(supabase, postId, url)
            console.log(
                `[soma:bg] #${idx} ${postId} populated image_r2_url ✓ (total ${Date.now() - tStart}ms)`
            )
        } catch (err: any) {
            const reason = String(err?.message ?? err)
            console.error(
                `[soma:bg] #${idx} ${postId} FAILED after ${Date.now() - tStart}ms: ${reason}`
            )
            await markPostRejected(supabase, postId, reason)
        }
    })

    await Promise.allSettled(tasks)
    console.log(
        `[soma:bg] batch finished in ${Date.now() - startTs}ms — ${placeholders.length} processed`
    )
}

/* ═══════════════════════════════════════════════════════════════
   9. MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    admin_clerk_id?: string
    category?: string
    count?: number
    image_mode?: "api" | "prompts"
    // Solo memes: true = el modelo elige un ángulo libre/sorpresivo (no se ciñe a
    // los ejes en prioridad). false/ausente = usa los ejes guiados.
    meme_random_axis?: boolean
    // Solo viernes: tono del anuncio de apertura. "festivo" / "elegante" /
    // "sorpresa" (default = variedad, el modelo alterna).
    viernes_tone?: "festivo" | "elegante" | "sorpresa"
    // Solo conciencia: pilar a tratar. "auto" (rota) o uno fijo:
    // "azucar" / "gluten" / "aceites" / "soya" / "veganismo".
    conciencia_pilar?: string
    reroll_of_post_id?: string | null
    retry_image_only_for_post_id?: string | null
}

// Categorías de CONTENIDO activas (no sabores). 'waffle' = promo del producto,
// 'conciencia' = los 0% + vegano, 'memes' = humor, 'viernes' = anuncio de
// apertura semanal con cierre fijo del menú.
const VALID_CATEGORIES = new Set([
    "waffle",
    "conciencia",
    "memes",
    "viernes",
])

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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    )
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
    // imagen). Único choke point tras el gate: cubre retry_image_only Y el
    // batch/reroll normal por igual.
    if (
        !(await reserveSpend(
            "generate-soma-posts",
            adminClerkId,
            20,
            86400,
            60,
            86400
        ))
    ) {
        return jsonResponse(429, { error: "rate_limited" })
    }

    // ── MODO "retry image only"
    const retryImageForId =
        body.retry_image_only_for_post_id?.trim() || null
    if (retryImageForId) {
        const post = await fetchPostById(supabase, retryImageForId)
        if (!post) {
            return jsonResponse(404, { error: "post_not_found" })
        }
        const visualPrompt = String(post.prompt_visual ?? "").trim()
        if (!visualPrompt) {
            return jsonResponse(422, {
                error: "missing_prompt_visual",
                detail: "El post no tiene prompt_visual.",
            })
        }
        if (FINAL_STATUSES.has(post.status)) {
            return jsonResponse(422, {
                error: "post_finalized",
                detail: `Status '${post.status}' es final, no regenerable.`,
            })
        }
        const resetPatch: Record<string, any> = { image_r2_url: null }
        if (post.status === "rejected") resetPatch.status = "draft"
        await patchPostFields(supabase, retryImageForId, resetPatch)

        const placeholderForBg = {
            id: retryImageForId,
            prompt_visual: visualPrompt,
        }
        const hasWaitUntil =
            typeof EdgeRuntime !== "undefined" &&
            typeof EdgeRuntime?.waitUntil === "function"
        console.log(
            `[soma:retry] ${retryImageForId} dispatching single-image regen, waitUntil=${hasWaitUntil}`
        )
        if (hasWaitUntil) {
            EdgeRuntime.waitUntil(
                processImagesBackground(GEMINI_API_KEY!, supabase, r2, [
                    placeholderForBg,
                ])
            )
        } else {
            processImagesBackground(GEMINI_API_KEY!, supabase, r2, [
                placeholderForBg,
            ]).catch((e) => console.error("[soma:retry] bg crashed", e))
        }

        return jsonResponse(200, {
            success: true,
            mode: "retry_image_only",
            post_id: retryImageForId,
            message:
                "Imagen regenerándose en background. El polling al RPC get_soma_posts_by_ids detectará el image_r2_url nuevo.",
        })
    }

    // ── Determinar modo (batch vs reroll)
    const rerollOfPostId = body.reroll_of_post_id?.trim() || null
    let category: string
    let count: number
    let parentPost: any | null = null

    if (rerollOfPostId) {
        parentPost = await fetchPostById(supabase, rerollOfPostId)
        if (!parentPost) {
            return jsonResponse(404, { error: "parent_post_not_found" })
        }
        if (!VALID_CATEGORIES.has(parentPost.category)) {
            return jsonResponse(422, {
                error: "parent_post_invalid_category",
            })
        }
        category = parentPost.category
        count = 1
    } else {
        if (!body.category || !VALID_CATEGORIES.has(body.category)) {
            return jsonResponse(400, { error: "invalid_category" })
        }
        category = body.category
        count = Math.max(
            MIN_BATCH_COUNT,
            Math.min(Number(body.count ?? 3) || 3, MAX_BATCH_COUNT)
        )
    }

    // Modo de imagen: "prompts" (manual, sin API) solo aplica a batch nuevo;
    // el reroll siempre usa API. Se determina ANTES del prompt para que el user
    // prompt inyecte la directiva de fotos de referencia cuando es manual.
    const imageMode =
        !rerollOfPostId && body.image_mode === "prompts" ? "prompts" : "api"

    // Solo memes: eje aleatorio si el panel lo pide.
    const memeRandomAxis = category === "memes" && body.meme_random_axis === true

    // Solo viernes: tono del anuncio (festivo / elegante / sorpresa).
    const viernesTone =
        category === "viernes" &&
        ["festivo", "elegante", "sorpresa"].includes(
            String(body.viernes_tone)
        )
            ? String(body.viernes_tone)
            : "sorpresa"

    // Solo conciencia: pilar fijo (azucar/gluten/aceites/soya/veganismo) o 'auto'.
    const concienciaPilar =
        category === "conciencia" &&
        ["azucar", "gluten", "aceites", "soya", "veganismo"].includes(
            String(body.conciencia_pilar)
        )
            ? String(body.conciencia_pilar)
            : "auto"

    const recentPulsos = await fetchRecentPulsos(supabase, category)

    let rawPosts: RawCopyPost[]
    try {
        const userPrompt = buildUserPrompt(
            category,
            count,
            recentPulsos,
            parentPost?.target ? [parentPost.target] : [],
            imageMode,
            memeRandomAxis,
            viernesTone,
            concienciaPilar
        )
        rawPosts = await callGeminiText(
            GEMINI_API_KEY!,
            SOMA_SYSTEM,
            userPrompt
        )
        if (rawPosts.length > count) rawPosts = rawPosts.slice(0, count)
    } catch (err: any) {
        console.error("[soma] copy generation failed", err)
        return jsonResponse(502, {
            error: "copy_generation_failed",
            detail: String(err?.message ?? err),
        })
    }

    if (rawPosts.length === 0) {
        return jsonResponse(502, { error: "no_posts_generated" })
    }

    const placeholders = rawPosts.map((rp) =>
        mapLlmToPlaceholder(rp, category, adminClerkId, rerollOfPostId, imageMode)
    )

    let inserted: any[] = []
    try {
        inserted = await insertSomaPostsBatch(supabase, placeholders)
    } catch (err: any) {
        console.error("[soma] DB insert failed", err)
        return jsonResponse(500, {
            error: "db_insert_failed",
            detail: String(err?.message ?? err),
        })
    }

    if (rerollOfPostId) {
        await markParentRerolled(supabase, rerollOfPostId, adminClerkId)
    }

    if (imageMode === "prompts") {
        return jsonResponse(200, {
            success: true,
            async: false,
            mode: "prompts",
            category,
            count_requested: count,
            count_generated: inserted.length,
            pulsos_inyectados: recentPulsos.length,
            posts: inserted,
            message:
                "Posts en modo SOLO PROMPTS. El prompt de cada post está listo para copiar/pegar a mano en Nano Banana. Sin generación por API.",
        })
    }

    const hasWaitUntil =
        typeof EdgeRuntime !== "undefined" &&
        typeof EdgeRuntime?.waitUntil === "function"
    console.log(
        `[soma] handler returning, EdgeRuntime.waitUntil=${hasWaitUntil} — dispatching ${inserted.length} background tasks`
    )
    if (hasWaitUntil) {
        EdgeRuntime.waitUntil(
            processImagesBackground(GEMINI_API_KEY!, supabase, r2, inserted)
        )
    } else {
        processImagesBackground(
            GEMINI_API_KEY!,
            supabase,
            r2,
            inserted
        ).catch((e) => console.error("[soma:bg] background crashed", e))
    }

    return jsonResponse(200, {
        success: true,
        async: true,
        category,
        count_requested: count,
        count_generated: inserted.length,
        pulsos_inyectados: recentPulsos.length,
        posts: inserted,
        message:
            "Placeholders insertados. Imágenes generándose en background. Haz polling a get_soma_posts_by_ids con los IDs hasta que image_r2_url se popule.",
    })
})
