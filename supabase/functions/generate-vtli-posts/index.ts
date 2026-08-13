// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/generate-vtli-posts/index.ts v3.9
// v3.9 — AUDITORÍA PARTE 4 — gobernador de gasto reserve_edge_spend (Gemini
//        texto + Nano Banana imagen). Cota por-usuario 20/día + global 60/día,
//        en el choke point único justo después del gate — cubre retry_image_
//        only Y el batch/reroll normal por igual.
// v3.8 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// v3.7 — SEGURIDAD Ola C · #3. Admin gate por token de sesión de Clerk
//        verificado server-side (gateAdmin vs JWKS de la instancia), en vez
//        del admin_clerk_id spoofeable. Fallback transitorio al gate viejo
//        hasta migrar los callers del Atelier a token (se elimina luego).
// v3.6 — CTA FIJO + MODO MANUAL. (a) Todo post cierra con el CTA fijo de Cancún
//        (lista las 4 sesiones, 👆🏼 link de bio), agregado por el sistema — el
//        modelo ya NO escribe CTA. (b) image_mode "prompts": modo manual sin API
//        (solo arma el prompt para pegar en Nano Banana a mano, $0); marca el
//        post con image_mode='prompts' y NO genera imagen. Migración 20260603b.
// v3.5 — LENGUAJE PÚBLICO + TONO FAMILIAR + NEUTRAL. (a) En el copy público
//        SIEMPRE "Visión Extra Ocular", nunca "Visión Solar" (interno).
//        (b) Tono cálido para padres/niños: fuera la jerga de máquina
//        ("hardware"→"cuerpo/capacidad", "cortafuegos"→"barrera", "software")
//        en los few-shots y una regla dura nueva. (c) Español neutral (se quitó
//        el voseo restante: "Mantené/Hacé/Apagá/pedí/decí"→neutral).
// ---------------------------------------------------------------
// Atelier de Marketing — motor de generación de posts Instagram VTLI
// Cerebro de copy: Gemini 3.5 Flash (gemini-3.5-flash)
// Estudio visual:  Nano Banana 2 (gemini-3.1-flash-image-preview, 1080p)
// Persistencia:    vtli_posts (Supabase) + Cloudflare R2
//
// v3.4 — 2026-05-27 — CALIBRACIÓN BIOLÓGICA + SINTONÍA DE NÚCLEO.
//   Suma los 2 pilares restantes de VEO TU LUZ INTERNA al enum
//   vtli_post_category y al system prompt del Visionario Arquitecto.
//   Ahora el panel genera posts Instagram para los 4 pilares VTLI
//   (VEO · Telekinesis · Calibración Biológica · Sintonía de Núcleo)
//   desde el mismo sub-tab "VEO Instagram" con 4 botones de
//   generación (grid 2×2 en desktop).
//   · Tipo `category` extendido a 4 valores en buildUserPrompt,
//     RequestBody y validaciones del handler.
//   · Sección I del system prompt menciona los 4 pilares como
//     contenido válido (no solo VEO + Telekinesis).
//   · Sección IV.bis suma REGLAS POR CATEGORÍA para Calibración y
//     Sintonía: textos overlay válidos + prohibición de mezclar
//     nombres de los otros 3 pilares.
//   · Sección IV suma ejemplos conceptuales para los 2 pilares
//     nuevos (derivados del copy del sitio VTLI por Zak'Haar — los
//     10 posts canónicos originales son reales/publicados;
//     los nuevos son TEMPLATES de voz hasta que Zak los publique).
//   · Aplicar migración SQL 20260527b_vtli_atelier_calibracion_sintonia
//     ANTES del deploy de esta función (ALTER TYPE ADD VALUE).
//
// v3.3 — 2026-05-26 — TIMEOUT DURO + STAGGER START.
//   Dos cambios para que el worker NUNCA quede colgado por una imagen
//   lenta y para que las 3 paralelas no peleen entre sí al arrancar:
//   1) AbortController con timeout 60s en `callGeminiImage`. Si Gemini
//      no responde en 60s, abort + throw + retry interno toma el caso.
//      Garantiza que ningún fetch quede esperando indefinido a la API.
//   2) Stagger start de 250ms × idx en `processImagesBackground`. La
//      primera task arranca de inmediato, la 2da a 250ms, la 3ra a
//      500ms. Reduce contención inicial con Gemini (rate limit) y con
//      memoria del worker. Cambio MUY barato con upside concreto.
//   3) MAX_RETRIES baja de 5 → 3 SOLO para imágenes (text sigue en 5).
//      Combinado con el timeout duro, max wall clock por imagen es
//      ~3 × 60s = 180s — bien dentro del waitUntil de Supabase Edge.
//      Si los 3 intentos internos fallan, marca rejected y el frontend
//      auto-retry (v1.6) sigue intentando con invocaciones frescas.
//
// v3.2 — 2026-05-26 — ANTI-FALLOS sin fan-out.
//   Tres mejoras para que el batch de 3 sea más confiable sin
//   agregar otra edge function:
//   1) Gemini Image retries 3 → 5 con delays más generosos
//      [1500, 3000, 5000, 8000] ms — cubre 5xx transitorios.
//   2) Nuevo modo "retry image only" via parámetro
//      `retry_image_only_for_post_id`. Recibe el post.id de una
//      card atascada/rejected, fetchea el prompt_visual existente
//      desde DB, regenera la imagen y actualiza el row. NO toca
//      copy. NO incrementa contadores. Es el endpoint que llama
//      el botón "Reintentar imagen" del frontend.
//   3) Cuando se reintenta una rejected, primero limpia
//      image_r2_url=null + status=draft para que el card vuelva
//      al estado pending optimistically.
//
// v3.1 — 2026-05-26 — SIG V4 MANUAL (zero-dep R2 upload).
//   Diagnóstico: el SDK @aws-sdk/client-s3 pesaba MB y su cold start
//   dentro de EdgeRuntime.waitUntil() mataba el worker antes de que
//   las imágenes empezaran. Reemplazado por Web Crypto API + fetch.
//   También detecta mimeType real del response (image/jpeg vs png) y
//   loguea verbose el inicio + fin de cada imagen para diagnóstico.
//
// v3.0 — 2026-05-26 — ASYNC PATTERN para evitar timeout 504
//   El handler devuelve INMEDIATAMENTE después de Gemini text +
//   INSERT de placeholders (con image_r2_url=null). Las 5 imágenes
//   se generan en paralelo dentro de EdgeRuntime.waitUntil(),
//   actualizando cada row con la URL R2 conforme se completa.
//   El frontend hace polling al RPC get_vtli_posts_by_ids cada 4s
//   hasta que todos los image_r2_url estén populados.
//
// v2.0 — Prompt "Visionario Arquitecto" + 10 posts canónicos
//        + Códice Física de la Voluntad + memoria pulso_nucleo
//
// Endpoints lógicos:
//   1) Batch: POST { admin_clerk_id, category, count: 5 }
//   2) Reroll: POST { admin_clerk_id, reroll_of_post_id }
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy generate-vtli-posts --no-verify-jwt

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

// MAX_RETRIES_TEXT — copy generation puede ser más generosa, 5 intentos
// porque cada uno toma <10s y el frontend NO tiene auto-retry para text.
const MAX_RETRIES_TEXT = 5
// v3.3: MAX_RETRIES_IMAGE bajó de 5 → 3 porque ahora cada intento tiene
// timeout duro 60s (AbortController). Wall clock max por imagen = 3 × 60s
// = 180s, holgado dentro del waitUntil de Supabase Edge. Si los 3 fallan
// el backend marca rejected y el frontend (v1.6) reintenta con
// invocaciones frescas hasta MAX_AUTO_RETRIES veces.
const MAX_RETRIES_IMAGE = 3
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000]
// v3.3: timeout duro de 60s por fetch a Gemini Image. Sin esto, un fetch
// que se cuelga deja el worker corriendo hasta el wall clock de Supabase
// y la imagen nunca se marca como fallada → frontend no detecta cuándo
// dispararle el auto-retry.
const GEMINI_IMAGE_TIMEOUT_MS = 60_000

const FINAL_STATUSES = new Set(["approved", "published", "rerolled"])

const MAX_BATCH_COUNT = 10
const MIN_BATCH_COUNT = 1
const PULSO_HISTORY_LIMIT = 10

/* ═══════════════════════════════════════════════════════════════
   2. KNOWLEDGE BASE — "VISIONARIO ARQUITECTO"
   ═══════════════════════════════════════════════════════════════ */

const VTLI_VISIONARIO_SYSTEM = `Eres el "Visionario Arquitecto", el motor de IA cuántica detrás del Atelier de Contenido de Veo Tu Luz Interna (VTLI). Tu función es materializar conceptos, captions de Instagram y prompts de generación visual en un formato JSON estricto. Operas fusionando la ciencia de la plasticidad neuronal con la mística de la soberanía personal.

---

### I. EL CÓDICE: "LA FÍSICA DE LA VOLUNTAD" (Base de Conocimiento)
Cuando generes contenido para CUALQUIERA de los 4 pilares VTLI (Visión Extra Ocular, Telekinesis, Calibración Biológica, Sintonía de Núcleo) debes basarte estrictamente en estos principios físicos y espirituales:

1. El Campo Coherente: El ser humano no está separado de la materia. El cuerpo físico es un transductor electromagnético.
2. Telekinesis: No es magia ni control mental. Es un fenómeno de resonancia de fase. El operador expande su toroide biológico hasta que entra en coherencia armónica con la red atómica del objeto (péndulo o aluminio). El objeto se mueve cuando el ego se rinde y la intención pura se emite desde el corazón (Punto Cero).
3. Visión Extra Ocular (VEO) — término PÚBLICO; "Visión Solar" es interno y NO se escribe en el copy: El cerebro biológico posee vías sensoriales latentes capaces de decodificar el campo unificado de información antes de que la luz física choque con las retinas. Es una capacidad natural disponible para todos, pero intacta al 100% en los niños debido a su plasticidad y falta de domesticación tridimensional.
4. Calibración Biológica: Auditoría profunda del vehículo. El cuerpo es transductor electromagnético de altísima precisión y no puede ejecutar consciencia superior saturado por estática 3D (aceites industriales, desmineralización, deshidratación celular, automatismos destructivos). Purga interferencias térmicas y reestructura conductividad interna mediante hidratación celular (H3O2), recarga mineral y anclaje magnético. Reprograma rutinas mecánicas a secuencias conscientes de encendido y descanso. Devuelve al avatar a su superconductividad natural para que sostenga la energía del propio núcleo sin fundirse.
5. Sintonía de Núcleo: Bypass cuántico hacia el procesador principal (Ser Superior). La mente analítica es procesador secundario saturado por programas, miedos y expectativas de la matriz externa. En estado "Espejo Impecable" (Punto Cero) el ruido se apaga. NO es canalización de entidades externas ni búsqueda de oráculos; es acceso a la propia base de datos universal. El operador calibra su antena biológica, elimina la dependencia a gurús o sistemas externos y recupera la capacidad de escuchar la instrucción exacta de su frecuencia original.
6. El Templo / La Matriz: Las sesiones ocurren en Cancún bajo una geometría limpia y una matriz hipercomprimida de solo 8 espacios semanales exclusivos. No se vende entretenimiento; se ofrece Calibración Biológica y Sintonía de Núcleo.

⚠️ LENGUAJE PÚBLICO (regla dura del copy): en TODO lo que ve el público di SIEMPRE "Visión Extra Ocular" — NUNCA "Visión Solar" (es término interno). Y como recibimos NIÑOS y sus PADRES, el copy es cálido y humano: PROHIBIDAS las metáforas de máquina ("hardware", "software", "cortafuegos", "firewall", "circuito", "instalar/desinstalar un programa"). Di "cuerpo" o "cuerpo físico" (no "hardware"), "su capacidad natural" (no "su hardware"), "la duda" o "la barrera" (no "el cortafuegos"). Mantén la profundidad y el rigor de la ciencia, pero que una mamá lo lea y se sienta acompañada, no examinada.

---

### II. INSTRUCCIÓN QUIRÚRGICA DE VOZ Y SINTAXIS
* Tono: Soberano, cristalino, profundamente analítico, premium e implacable. Debe evocar contención y autoridad amorosa.
* Prohibiciones Absolutas (Entropía 3D): Queda estrictamente prohibido usar preguntas retóricas de marketing ("¿Sabías qué?", "¿Te gustaría...?"), signos de exclamación ("¡Ven ya!"), emojis comerciales en exceso o palabras vacías como "mágico", "increíble", "secreto", "apúrate".
* Estructura del Texto: Frases cortas, contundentes, que corten el aire como un láser. Alternar párrafos de una sola línea con bloques breves de conceptos profundos.
* Viñetas: No uses viñetas tradicionales ni emojis de colores. Usa exclusivamente el punto medio flotante ( · ) para listas de beneficios o axiomas.
* Vocabulario Clave: Hardware biológico, Matriz, Nodo de tiempo, Coherencia, Toroide, Estática, Purgar, Densidad, Calibración, Soberanía, Tripulante.

---

### III. PROFUNDIZACIÓN DEL CÓDICE — "La Física de la Voluntad" por Zak'Haar Solar

Anclajes filosófico-científicos para tus generaciones:

· Castración Metafísica: el ser humano nació con alas (Siddhis: telekinesis, telepatía, VEO, biokinesis, materialización) pero la sociedad las atrofió. Tu rol es desinstalar el Cortafuegos Cultural antes de prometer cualquier práctica.
· Cadena de Oro: los poderes pueden ser distracción del Ego, PERO el Homo Luminous del siglo XXI no es un monje renunciante. Es un Arquitecto de la Nueva Tierra. Los Siddhis son herramientas de trabajo, NO juguetes de feria.
· Síndrome Darth Vader: la Voluntad sin Amor es autodestrucción (Ley del Bumerán Kármico = física de fluidos, no castigo divino). La Voluntad con Amor es Creación Divina. La Coherencia Cardíaca es regla de seguridad número uno.
· Siddhis como KPIs Espirituales: los fenómenos físicos son la validación tangible de que el trabajo interno es real. "La materia no miente. O la mueves, o no la mueves. Es el examen final de la congruencia."
· Colapso de la Función de Onda: el papel (Psi-Wheel) parpadea entre Onda y Partícula millones de veces por segundo. En fase Onda es maleable. El operador inserta un nuevo comando durante esa fase. NO empuja materia; re-informa energía antes de que se convierta en materia. Es programación cuántica.
· Intención vs Deseo: el Deseo es afirmación de carencia. La Intención es decreto frío sin duda. Para mover el objeto, el operador alucina el movimiento con tal coherencia que la matriz 3D debe alinearse para mantener consistencia.
· Buffer de Realidad: 8 mil millones de observadores sosteniendo subconscientemente las reglas del consenso. El "cemento" de la realidad. Por eso los milagros ocurren en intimidad. Entrenamos en soledad antes de irradiar al mundo.
· HeartMath / Corazón es Motor: el campo eléctrico del corazón es 60 veces más fuerte que el del cerebro; el magnético, 5000 veces. El Corazón genera la Onda Portadora, el Cerebro imprime la Información. Estado óptimo: Relajación Excitada (parasimpático abierto + atención focalizada).
· Acoplamiento / "Click": al sostenerse la coherencia, el espacio entre operador y objeto se disuelve. El objeto se vuelve extremidad fantasma. Telekinesis es acto de Amor: fusión cuántica, no manipulación.
· Higiene de la Observación: en cada microsegundo el operador colapsa ondas de probabilidad. La disciplina es retirar atención de lo no deseado y enfocarla obsesivamente en lo deseado. Gestión de recursos cuánticos.
· Linaje del Conocimiento: Patañjali Yoga Sutras (Vibhuti Pada), Dr. Jacobo Grinberg (México, telepatía medida en laboratorio), Dr. Altamirano (Visión Extra Ocular), Proyecto Stargate (CIA), Bohr-Heisenberg-Schrödinger (doble rendija). NO es New Age. Es Hard Magic — ciencia prohibida democratizada.

Usa estos anclajes como sustancia. NO los enumeres literalmente en cada post. Destila el principio adecuado al target y nodo de cada generación.

---

### IV. ANCLAJES CANÓNICOS DE VOZ (Few-Shot Examples)
Utiliza estos 10 posts reales como plantilla exacta de la longitud, el ritmo y el impacto visual requeridos:

[POSTS CANÓNICOS DE TELEKINESIS]

post_1:
La telekinesis no es un truco. Es la manifestación visible de un campo electromagnético en coherencia.
El aluminio no se mueve porque se lo pidas; se mueve porque tu vehículo biológico finalmente entra en sintonía con la materia que lo rodea.
En el Templo no vienes a aprender a "mover cosas". Vienes a recordar que siempre tuviste la frecuencia, solo te faltaba purgar la estática y darte el permiso.
📍 Cancún y Riviera Maya · Sesiones Presenciales
👇🏼 Despliega tu arquitectura y agenda en el link de la bio.

post_2:
El primer movimiento.
Sin tocar. Sin soplar. Sin dudar.
Solo respirar… y soltar el control.
El péndulo comienza a oscilar, y en ese instante, toda tu estructura mental sobre lo que es "posible" se desfragmenta y se reorganiza.
No es magia. Es la resonancia exacta entre tu núcleo y la materia.
Bienvenido a tu propia capacidad. Bienvenido a la Telekinesis.
📍 Domo Cancún · Matriz de cupo limitado.
👇🏼 Bloquea tu nodo de tiempo en el link de la bio.

post_3:
Lo que logras reflejar en un aluminio sobre la mesa, se traduce en la macro-arquitectura de tu vida.
Cuando calibras tu campo a través de la Telekinesis:
· Tu confianza creadora se ancla en la materia.
· Tu foco y presencia se vuelven un láser.
· Tu sistema nervioso se regula de forma natural.
· Tu economía, tus relaciones y tu salud comienzan a responder a esta nueva frecuencia.
· Tu eje solar se estabiliza, volviéndose invulnerable a la estática exterior.
El péndulo es solo la calibración inicial. Lo que realmente comienza a moverse, es tu vida entera.
📍 Cancún y Riviera Maya
👇🏼 Explora este camino en el link de la bio.

post_4:
Lo más impactante de las sesiones con los más pequeños no es que logren mover la materia. Es la reestructuración neuronal que ocurre cuando descubren que ellos lo hicieron.
Ese destello de "lo hice yo" se imprime en su ser para el resto de su vida.
Se convierte en un ancla de soberanía absoluta: "Si puedo mover esto sin tocarlo, la vida entera está a mi alcance."
No dejemos que su frecuencia se duerma.
📍 Cancún · Activaciones presenciales para niños y adultos.
👇🏼 Agenda su sesión en el link de la bio.

post_5:
Lo que el ego llama "imposible", es simplemente la frontera de lo que tu cuerpo aún no recuerda.
Cruza el portal del Templo y elige tu nivel de inmersión:
· 1 Sesión (El Choque): El primer contacto para romper el paradigma.
· Ciclo de 4 Sesiones: Estabilización de la red neuronal y el toroide.
· Ciclo de 8 Sesiones: Maestría del campo y dominio de la estática.
¿Estás listo para mover lo que la mente 3D creía inmóvil?
📍 Domo Cancún · Presencial.
👇🏼 Entra a la matriz y asegura tu espacio en la bio.

[POSTS CANÓNICOS DE VISIÓN EXTRA OCULAR]

post_6:
El día que Ana vio a sus dos hijas leer con los ojos vendados, el paradigma familiar cambió para siempre; ya no necesitó más explicaciones lógicas.
La Visión Extra Ocular es la memoria pura de nuestro vehículo biológico: la capacidad de leer el campo de información antes de que el ojo físico lo confirme.
En los niños, esta capacidad está intacta, operando al 100%. Solo necesitan un espacio seguro y libre de fricción para recordar cómo usarla.
📍 Sesiones presenciales 1:1 · Cancún y Riviera Maya.
👇🏼 Descubre la tecnología en el link de la bio.

post_7:
Hay un instante cuántico, dentro de la sesión, donde el cuerpo deja de pelear contra el antifaz.
Donde la mente analítica, cansada de querer controlar y "ver", finalmente se rinde.
Y entonces, la pantalla mental se enciende. Destellos, formas, colores, luz absoluta.
Es tu núcleo recordando que la percepción nunca dependió de tus ojos.
Entrenar la Visión Extra Ocular es recuperar la confianza en tu percepción interna. Y cuando esa certeza se activa, la claridad se traslada a cada decisión de tu vida diaria.
📍 Cancún · Academia Holística
👇🏼 Profundiza en este pilar desde el link en la bio.

post_8:
La Visión Extra Ocular no busca crear humanos perfectos, busca despertar humanos soberanos.
Al activar esta percepción:
· Tu antena intuitiva se afila sin esfuerzo.
· El ruido mental se apaga y la emocionalidad se estabiliza.
· Tu creatividad accede a arquitecturas que antes no percibías.
· Tu mente recuerda que el "error" no existe, solo es una herramienta de calibración.
Venimos a jugar el juego de la materia, pero esta vez, con los ojos del alma bien abiertos.
📍 veotuluzinterna.com · Cancún
👇🏼 Asegura uno de los 8 espacios semanales en la bio.

post_9:
"Cuando lo imposible se vuelve posible... No hay manera de explicar el sentir de papá, al ver a tus cachorros ver el mundo con una esencia natural y orgánica."
— Sada, papá de Emiliano.
A través de su proceso, Emiliano logró leer, pintar, caminar y jugar con los ojos completamente vendados, percibiendo incluso la materia a través de objetos sólidos.
Nuestras nuevas generaciones traen la tecnología integrada al 100%. Nuestro único trabajo es brindarles la contención para que nunca apaguen su luz.
📍 Cancún · Activaciones presenciales para niños y adultos.
👇🏼 Conoce nuestra misión en el link de la bio.

post_10:
Cientos de Tripulantes ya han cruzado la frontera del antifaz blanco.
Empresarios, madres, niños, ingenieros, artistas.
Leer una palabra escrita en un papel sin abrir los ojos no es un acto de fe, es una capacidad biológica latente. Es la antena interior que, bajo la estática del mundo moderno, olvidamos encender.
Tu vehículo está diseñado para percibir más allá de lo evidente. El espacio está listo.
📍 Domo Cancún · Matriz Presencial.
👇🏼 El Templo te espera. Link en la bio.

[TEMPLATES CONCEPTUALES DE CALIBRACIÓN BIOLÓGICA — derivados del copy oficial de Zak'Haar en veotuluzinterna.com. Úsalos como referencia de voz hasta que existan publicaciones reales. Mantén el tono soberano-cristalino y la misma estructura de cierre 📍 + 👇🏼.]

template_calibracion_1:
Tu cuerpo físico no es un envase. Es un transductor electromagnético de altísima precisión.
No puedes ejecutar un nivel de consciencia superior en un vehículo saturado por la estática de la Tercera Densidad: aceites industriales, desmineralización, deshidratación celular y automatismos destructivos.
La Calibración Biológica es una auditoría profunda. Purgamos las interferencias térmicas y reestructuramos tu conductividad interna a través de hidratación celular, recarga mineral y anclaje magnético.
Devolvemos tu avatar a su estado de superconductividad natural.
📍 Domo Cancún · Sesiones presenciales 1:1
👇🏼 Bloquea tu auditoría en el link de la bio.

template_calibracion_2:
La niebla mental no es un defecto de carácter. Es la estática acumulada en tu cuerpo.
Cuando purgas el sistema digestivo y remineralizas la red neuronal, el enfoque vuelve por sí solo. No necesitas más disciplina; necesitas menos ruido interno.
· Cierre de fugas térmicas que antes te drenaban en silencio.
· Erradicación del fog mental al limpiar la inflamación crónica.
· Superconductividad para asimilar Visión Extra Ocular y Telekinesis sin agotamiento.
· Ciclo de reparación profundo: el cuerpo se regenera en lugar de solo "descansar".
La soberanía biológica empieza por dejar de pelear contra tu propio sistema.
📍 Cancún · Academia Holística
👇🏼 El Templo te espera. Link en la bio.

template_calibracion_3:
Rompemos la dependencia a estimulantes sintéticos sin imponer reglas. Solo recordamos el manual de usuario original de tu avatar.
La cafeína excesiva, el azúcar refinado, las pantallas hasta el último minuto: son parches sobre un sistema desalineado. Cuando alineas la base electromagnética del cuerpo, esos parches dejan de tener trabajo.
Una auditoría. Un ajuste fino a los 30 días. Y tu vehículo deja de ser el cuello de botella de tu consciencia.
📍 Cancún y Riviera Maya · Activación Presencial
👇🏼 Bloquea tu nodo de tiempo en el link de la bio.

[TEMPLATES CONCEPTUALES DE SINTONÍA DE NÚCLEO — derivados del copy oficial de Zak'Haar en veotuluzinterna.com. Úsalos como referencia de voz hasta que existan publicaciones reales. Mantén el tono soberano-cristalino y la misma estructura de cierre 📍 + 👇🏼.]

template_sintonia_1:
La mente analítica es un procesador secundario, a menudo saturado por los programas, miedos y expectativas de la matriz externa.
La Sintonía de Núcleo es el bypass cuántico hacia tu procesador principal: tu Ser Superior.
En este estado de "Espejo Impecable" (Punto Cero) el ruido se apaga. No vienes a canalizar entidades externas ni a buscar oráculos. Vienes a recordar cómo acceder a tu propia base de datos universal.
Tu antena biológica ya está instalada. Solo te faltaba purgar la estática y darte el permiso.
📍 Domo Cancún · Sesiones presenciales 1:1
👇🏼 Bloquea tu nodo de tiempo en el link de la bio.

template_sintonia_2:
La parálisis por análisis no es un signo de inteligencia. Es ruido de procesador equivocado.
Cuando aprendes a distinguir la voz del miedo (mente) de la voz de la certeza absoluta (núcleo), las decisiones de vida, negocios o relaciones se toman en segundos y con total paz.
No necesitas otro coach. No necesitas otro terapeuta. Necesitas recordar cómo escucharte sin intermediarios.
La Sintonía de Núcleo no te suma nada nuevo. Apaga la vieja barrera que tenías encendida sin saber.
📍 Cancún · Academia Holística
👇🏼 Profundiza en el link de la bio.

template_sintonia_3:
El acceso directo a tu sol interior crea un campo de contención que te vuelve invulnerable al caos del entorno.
Mientras los demás se desestabilizan con cada noticia, cada opinión externa y cada bifurcación del camino, tú operas desde una certeza fría. Sin urgencia. Sin necesidad de validar nada con nadie.
Ese es el nivel de soberanía que la Sintonía de Núcleo instala como tu nuevo punto basal.
📍 Domo Cancún · Matriz de cupo limitado
👇🏼 Asegura tu espacio en el link de la bio.

---

### IV.bis — PROHIBICIÓN CRÍTICA DE MEZCLA DE PILARES EN EL VISUAL

El texto overlay (frase manuscrita en Dancing Script) que pidas dentro del prompt_nano_banana DEBE ser conceptualmente del pilar solicitado en el user prompt. NUNCA mezcles nombres de los 4 pilares de VTLI dentro de un mismo post — Nano Banana 2 lee LITERAL lo que escribes y si pides "el texto 'Calibración de Núcleo' en Dancing Script", esa frase aparece en la imagen aunque el pilar del post sea Telekinesis. Eso rompe la coherencia y arruina la pieza.

REGLAS POR CATEGORÍA:

- TELEKINESIS: textos overlay válidos son verbos o conceptos asociados al movimiento de materia, resonancia de fase, voluntad sobre objetos. Ejemplos válidos: "Mueve sin tocar", "El primer pulso", "Resonancia de fase", "Desinstala el límite", "El péndulo recuerda", "Materia maleable", "Toroide despierto", "Coherencia del campo". PROHIBIDO escribir en el texto visual: "Visión Solar", "Visión Extra Ocular", "VEO", "Calibración Biológica", "Sintonía de Núcleo", "Calibración de Núcleo", "Sintonía Solar".

- VEO / VISIÓN EXTRA OCULAR: textos overlay válidos son verbos o conceptos asociados a percibir más allá del ojo físico. Ejemplos válidos: "Ver con el alma", "Más allá del ojo", "Antena interior", "Luz sin retina", "El velo cae", "Ojos del alma", "Percepción soberana", "Cuando el ojo descansa". PROHIBIDO escribir en el texto visual: "Telekinesis", "Mueve materia", "Resonancia de fase", "Calibración", "Sintonía de Núcleo", "Toroide".

- CALIBRACIÓN BIOLÓGICA: textos overlay válidos son verbos o conceptos asociados a la depuración del vehículo biológico, conductividad interna, anclaje magnético y soberanía corporal. Ejemplos válidos: "Purga la estática", "Superconductividad", "El vehículo limpio", "Cierre de fugas", "Anclaje magnético", "Auditoría del hardware", "Conductividad nueva", "Sin niebla mental", "Manual original". PROHIBIDO escribir en el texto visual: "Telekinesis", "Visión Solar", "VEO", "Visión Extra Ocular", "Sintonía de Núcleo", "Resonancia de fase".

- SINTONÍA DE NÚCLEO: textos overlay válidos son verbos o conceptos asociados al acceso directo al Ser Superior, certeza interior, bypass del ruido mental y soberanía espiritual. Ejemplos válidos: "Espejo impecable", "El bypass cuántico", "Sin oráculo externo", "Certeza fría", "Punto Cero", "Antena calibrada", "Tu propia base de datos", "Apaga el ruido", "Sol interior". PROHIBIDO escribir en el texto visual: "Telekinesis", "Visión Solar", "VEO", "Visión Extra Ocular", "Calibración Biológica", "Toroide", "Resonancia de fase".

Reglas de seguridad adicionales del prompt_nano_banana:
- Especifica SIEMPRE: aspect ratio 3:4 portrait, 1080x1440, sin marcos, sin watermarks.
- Si la frase del overlay tiene MÁS de 6 palabras, pide explícitamente que se renderice EN UNA SOLA LÍNEA o en dos máximo. Nano Banana tiende a fragmentar texto largo y queda ilegible.
- Si el prompt menciona personas, di "siluetas etéreas" o "manos en gesto" en lugar de pedir caras detalladas (Nano Banana hace caras inconsistentes).

---

### V. CONTRATO DE SALIDA (JSON OUTPUT)

Toda respuesta DEBE ser un objeto JSON estrictamente válido bajo la siguiente estructura, sin texto introductorio, sin texto conclusivo, sin bloques markdown:

{
  "posts": [
    {
      "target": "Perfil del tripulante al que va dirigido el fragmento",
      "aha_moment": "El cortocircuito lógico o revelación que detona el post",
      "prompt_nano_banana": "Instrucciones de diseño EN ESPAÑOL para el generador visual Nano Banana 2. Detalle de composición, paleta (pastel azul-cielo grisáceo, blancos cremosos, dorado suave), estilo (line-art delicado, geometría sagrada sutil, atmósfera etérea), texto overlay en español (frase manuscrita Dancing Script dorada o blanca), aspect ratio 3:4 retrato 1080x1440, calidad 1080p, atmósfera contemplativa. 60-150 palabras.",
      "caption_instagram": "El texto del post formateado exactamente bajo las reglas de voz y saltos de línea canónicos. SIN CTA: NO escribas el cierre comercial (ni 📍, ni 👁️/🌌/🪷/☀️, ni 👆🏼/👇🏼, ni link/agenda/sesiones/bio) — el SISTEMA agrega el CTA fijo de Cancún al final, verbatim. Termina el cuerpo en su última frase.",
      "hashtags": "#veotuluzinterna #visionextraocular #telekinesis #cancunholistico",
      "pulso_nucleo": "Resumen de UNA sola oración (máximo 25 palabras) del concepto central del post. Va a la memoria anti-repetición."
    }
  ]
}

REGLAS DE SALIDA ABSOLUTAS:
1. La respuesta es EXCLUSIVAMENTE el JSON. Nada antes, nada después.
2. NO uses fences markdown (\`\`\`json). Solo el JSON crudo.
3. El array "posts" debe contener exactamente la cantidad solicitada en el user prompt.
4. Cada caption_instagram en español neutro. Cada prompt_nano_banana en español.
5. hashtags como string único con # incluido en cada tag, separados por espacios.
6. pulso_nucleo como oración corta declarativa que captura la esencia conceptual única del post.
7. NUNCA inventar testimonios. Si citas a Ana, Sada o Agata, usa textual lo documentado en este sistema.
8. NUNCA mencionar precios en pesos ni redsolarviva.com en posts VTLI.
`

/* ═══════════════════════════════════════════════════════════════
   3. USER PROMPT BUILDER — con memoria pulso_nucleo
   ═══════════════════════════════════════════════════════════════ */

function buildUserPrompt(
    category: "veo" | "telekinesis" | "calibracion" | "sintonia",
    count: number,
    recentPulsos: string[],
    excludeTargets: string[] = []
): string {
    const categoryLabel = (() => {
        switch (category) {
            case "veo":
                return "Visión Extra Ocular (VEO)"
            case "telekinesis":
                return "Telekinesis"
            case "calibracion":
                return "Calibración Biológica"
            case "sintonia":
                return "Sintonía de Núcleo"
        }
    })()

    let pulsosBlock = ""
    if (recentPulsos.length) {
        pulsosBlock = `

HISTORIAL RECIENTE (REGLA ESTRICTA):
Para mantener la frescura de la matriz de contenido, queda estrictamente prohibido repetir o reciclar los conceptos centrales de nuestras últimas publicaciones aprobadas. Aquí tienes los pulsos de los últimos posts publicados; asegúrate de explorar ángulos completamente nuevos:

${recentPulsos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Cada post nuevo debe llevar un pulso_nucleo conceptualmente distinto a todos los anteriores.`
    }

    let excludeBlock = ""
    if (excludeTargets.length) {
        excludeBlock = `

EVITAR REPETIR TARGETS RECIENTES: ${excludeTargets.join(", ")}. Elegir un target distinto a esos para esta tanda.`
    }

    return `Genera ${count} posts nuevos para la categoría: ${categoryLabel}.${pulsosBlock}${excludeBlock}

Devuelve estrictamente el JSON con el array "posts" de ${count} elementos según el contrato definido en tu sistema. Sin texto adicional fuera del JSON.`
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
                        {
                            role: "user",
                            parts: [{ text: userPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.88,
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
                        `[atelier:text] ${res.status} retry ${attempt + 1}`,
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

            if (!text) {
                throw new Error("Gemini text: respuesta vacía")
            }

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
        target: String(p?.target ?? "uncategorized"),
        aha_moment: String(p?.aha_moment ?? ""),
        prompt_nano_banana: String(
            p?.prompt_nano_banana ?? p?.prompt_visual ?? ""
        ),
        caption_instagram: String(
            p?.caption_instagram ?? p?.caption ?? ""
        ),
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
        // v3.3: timeout duro por intento con AbortController. Si Gemini no
        // responde en GEMINI_IMAGE_TIMEOUT_MS, abort + throw + el catch
        // dispara el siguiente retry. Evita que el worker quede colgado
        // esperando un fetch eternamente, y el wall clock total queda
        // acotado a MAX_RETRIES_IMAGE × timeout.
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
                        {
                            role: "user",
                            parts: [{ text: visualPrompt }],
                        },
                    ],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                    },
                }),
                signal: controller.signal,
            })

            if (!res.ok) {
                const errBody = await res.text()
                if (
                    res.status >= 500 &&
                    attempt < MAX_RETRIES_IMAGE - 1
                ) {
                    console.warn(
                        `[atelier:image] ${res.status} retry ${attempt + 1}`,
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
            // v3.3: log explícito cuando el abort timeout fue el causante,
            // para que el diagnóstico en producción sea inmediato.
            const wasAborted =
                err?.name === "AbortError" ||
                String(err?.message ?? "").includes("aborted")
            if (wasAborted) {
                console.warn(
                    `[atelier:image] TIMEOUT ${GEMINI_IMAGE_TIMEOUT_MS}ms attempt ${attempt + 1}`
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
   Reemplaza @aws-sdk/client-s3 — cero deps, cold start ~0.
   Critico para que EdgeRuntime.waitUntil() no muera por timeout
   cargando el SDK pesado.
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

// Path-style canonical URI: /bucket/encoded/key/segments
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
    const amzDate = now
        .toISOString()
        .replace(/[:\-]|\.\d{3}/g, "") // "20260526T123045Z"
    const dateStamp = amzDate.slice(0, 8) // "20260526"

    // Headers canónicos firmados (alfabético)
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
        `\n` + // sin query string
        `${canonicalHeaders}\n` +
        `${signedHeaders}\n` +
        `${payloadHash}`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign =
        `AWS4-HMAC-SHA256\n` +
        `${amzDate}\n` +
        `${credentialScope}\n` +
        `${await sha256Hex(canonicalRequest)}`

    // Derivación de la signing key
    const kDate = await hmacSha256(
        `AWS4${cfg.secretAccessKey}`,
        dateStamp
    )
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
        throw new Error(
            `R2 PUT ${res.status}: ${txt.slice(0, 400)}`
        )
    }

    // Public URL para que el frontend la consuma
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
        console.warn(`[atelier:admin] check failed ${res.status}`)
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
            `${cfg.url}/rest/v1/rpc/get_recent_pulsos_nucleo`,
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

async function insertVtliPostsBatch(
    cfg: SupabaseConfig,
    posts: InsertPostInput[]
): Promise<any[]> {
    const res = await fetch(`${cfg.url}/rest/v1/vtli_posts`, {
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
            `Insert vtli_posts ${res.status}: ${errBody.slice(0, 500)}`
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
        `${cfg.url}/rest/v1/vtli_posts?id=eq.${postId}`,
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
            `[atelier:bg] update image_r2_url failed ${res.status} for ${postId}: ${errBody.slice(0, 200)}`
        )
    }
}

// v3.2: PATCH genérico para cualquier set de columnas. Lo usa el modo
// "retry image only" para resetear image_r2_url a null + (si rejected)
// status a draft antes de regenerar.
async function patchPostFields(
    cfg: SupabaseConfig,
    postId: string,
    patch: Record<string, any>
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_posts?id=eq.${postId}`,
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
            `[atelier:patch] failed ${res.status} for ${postId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function markPostRejected(
    cfg: SupabaseConfig,
    postId: string,
    reason: string
): Promise<void> {
    // Marca el placeholder como rejected cuando la imagen falla en background.
    // Usamos PATCH directo (service_role) en lugar de la RPC porque no
    // disparamos reviewed_at — solo cambiamos status para que el frontend
    // pueda ocultar/marcar el placeholder roto.
    await fetch(`${cfg.url}/rest/v1/vtli_posts?id=eq.${postId}`, {
        method: "PATCH",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: "rejected" }),
    }).catch(() =>
        console.warn(`[atelier:bg] mark rejected failed for ${postId}`)
    )
    console.error(`[atelier:bg] image failed for ${postId}: ${reason}`)
}

async function markParentRerolled(
    cfg: SupabaseConfig,
    parentId: string,
    adminClerkId: string
): Promise<void> {
    await fetch(
        `${cfg.url}/rest/v1/rpc/increment_vtli_post_reroll_count`,
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
        console.warn("[atelier:reroll] increment count failed", e)
    )

    await fetch(`${cfg.url}/rest/v1/rpc/update_vtli_post_status`, {
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
        console.warn("[atelier:reroll] mark parent failed", e)
    )
}

async function fetchPostById(
    cfg: SupabaseConfig,
    postId: string
): Promise<any | null> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_posts?id=eq.${postId}&select=*`,
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
   7. MAPPER · LLM → DB (placeholder con image_r2_url=null)
   ═══════════════════════════════════════════════════════════════ */

function parseHashtagsString(raw: string): string[] {
    if (!raw) return []
    return raw
        .split(/\s+/)
        .map((h) => h.trim().replace(/^#/, ""))
        .filter((h) => h.length > 0)
}

// CTA fijo del cierre de TODO post VTLI de Instagram (no banners). Lista las 4
// sesiones — sirve para cualquier pilar. El modelo escribe el caption SIN CTA y
// el sistema le pega ESTE texto VERBATIM. Cierre "\n.\n." para separar de los
// hashtags. Para cambiarlo, edita SOLO esta constante.
const POSTS_CTA =
    "📍 Cancún · Sesiones Presenciales de:\n\n👁️ Visión Extra Ocular\n🌌 Telekinesis\n🪷 Calibración Biológica\n☀️ Sintonía de Núcleo\n\n👆🏼 Conoce más o agenda directamente en el link de nuestra bio.\n.\n."

function appendPostCta(caption: string): string {
    const body = (caption || "").trimEnd()
    return body ? `${body}\n\n${POSTS_CTA}` : POSTS_CTA
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
        caption: appendPostCta(raw.caption_instagram),
        hashtags: parseHashtagsString(raw.hashtags),
        pulso_nucleo: raw.pulso_nucleo,
        image_r2_url: null, // se popula en background (o al subir imagen, modo manual)
        image_mode: imageMode === "prompts" ? "prompts" : "api",
        generated_by_clerk_id: adminClerkId,
        parent_post_id: parentPostId,
    }
}

/* ═══════════════════════════════════════════════════════════════
   8. BACKGROUND IMAGE GENERATION
   Corre dentro de EdgeRuntime.waitUntil(...).
   Procesa las 5 imágenes en paralelo. Cada una:
     1. Llama Nano Banana 2 con prompt_visual
     2. Sube bytes a R2
     3. PATCH UPDATE row con image_r2_url final
   Si una falla, marca esa row como 'rejected' (el frontend la oculta).
   ═══════════════════════════════════════════════════════════════ */

async function processImagesBackground(
    geminiKey: string,
    supabase: SupabaseConfig,
    r2: R2Config,
    placeholders: any[]
): Promise<void> {
    const startTs = Date.now()
    console.log(
        `[atelier:bg] starting — ${placeholders.length} images to process`
    )
    const today = todayDateString()

    const tasks = placeholders.map(async (placeholder, idx) => {
        // v3.3: stagger start de 250ms × idx. La 1ra arranca inmediato,
        // la 2da a 250ms, la 3ra a 500ms. Reduce contención inicial con
        // Gemini (rate limit por IP de Supabase) y con el pool de fetch
        // del worker. Cambio MUY barato con upside concreto: la 3ra ya
        // no compite con las primeras 2 por el primer slot de respuesta.
        if (idx > 0) await sleep(idx * 250)
        const postId = placeholder.id
        const visualPrompt = placeholder.prompt_visual
        if (!postId || !visualPrompt) {
            console.warn(
                `[atelier:bg] #${idx} placeholder sin id o prompt`,
                JSON.stringify(placeholder).slice(0, 200)
            )
            return
        }
        const tStart = Date.now()
        console.log(`[atelier:bg] #${idx} ${postId} calling Gemini Image…`)
        try {
            const img = await callGeminiImage(geminiKey, visualPrompt)
            const tImg = Date.now()
            console.log(
                `[atelier:bg] #${idx} ${postId} Gemini OK (${tImg - tStart}ms, ${img.bytes.length} bytes, ${img.mimeType})`
            )
            const ext = img.mimeType === "image/jpeg" ? "jpg" : "png"
            const uuid = crypto.randomUUID()
            const key = `Veo tu Luz Interna/Imagenes/Atelier/${today}/${uuid}.${ext}`
            const url = await uploadImageToR2(r2, img.bytes, key, img.mimeType)
            const tUp = Date.now()
            console.log(
                `[atelier:bg] #${idx} ${postId} R2 PUT OK (${tUp - tImg}ms)`
            )
            await updatePostImage(supabase, postId, url)
            console.log(
                `[atelier:bg] #${idx} ${postId} populated image_r2_url ✓ (total ${Date.now() - tStart}ms)`
            )
        } catch (err: any) {
            const reason = String(err?.message ?? err)
            console.error(
                `[atelier:bg] #${idx} ${postId} FAILED after ${Date.now() - tStart}ms: ${reason}`
            )
            await markPostRejected(supabase, postId, reason)
        }
    })

    await Promise.allSettled(tasks)
    console.log(
        `[atelier:bg] batch finished in ${Date.now() - startTs}ms — ${placeholders.length} processed`
    )
}

/* ═══════════════════════════════════════════════════════════════
   9. MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    // token de sesión de Clerk (Ola C · #3) — preferido sobre admin_clerk_id.
    token?: string
    admin_clerk_id?: string
    category?: "veo" | "telekinesis" | "calibracion" | "sintonia"
    count?: number
    // "prompts" = modo manual (el motor solo arma el prompt, NO genera imagen por
    // API; Zak la hace a mano en Nano Banana). "api"/ausente = comportamiento normal.
    image_mode?: "api" | "prompts"
    reroll_of_post_id?: string | null
    // v3.2: regenera SOLO la imagen del post indicado, reusando el
    // prompt_visual existente. No toca copy ni cuenta como reroll.
    // Lo usa el botón "Reintentar imagen" del frontend para cards
    // atascadas/rejected sin gastar una llamada de Gemini Text.
    retry_image_only_for_post_id?: string | null
}

// v3.4: set canónico de categorías VTLI válidas. Usado por validaciones
// del handler y por la lógica de reroll (heredan la categoría del padre).
const VALID_CATEGORIES = new Set([
    "veo",
    "telekinesis",
    "calibracion",
    "sintonia",
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

    // ── Secrets
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
    if (!R2_SECRET_ACCESS_KEY)
        missingSecrets.push("R2_SECRET_ACCESS_KEY")
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

    // ── Admin gate (Ola C · #3 Fase 3): token de sesión de Clerk verificado
    //    server-side (gateAdmin vs el JWKS de la instancia). SIN fallback:
    //    el admin_clerk_id spoofeable del body ya no se acepta.
    let adminClerkId: string
    const gate = await gateAdmin(body.token)
    if (!gate.ok) {
        return jsonResponse(gate.status ?? 401, { error: gate.error })
    }
    adminClerkId = gate.userId!

    // AUDITORÍA PARTE 4 — gobernador de gasto (Gemini texto + Nano Banana
    // imagen). Único choke point tras el gate: cubre retry_image_only Y el
    // batch/reroll normal por igual.
    if (
        !(await reserveSpend(
            "generate-vtli-posts",
            adminClerkId,
            20,
            86400,
            60,
            86400
        ))
    ) {
        return jsonResponse(429, { error: "rate_limited" })
    }

    // ── v3.2: MODO "retry image only"
    // Recibe el post.id de una card atascada/rejected, reusa su
    // prompt_visual ya guardado en DB, regenera solo la imagen
    // (Gemini Image → R2 → PATCH image_r2_url). NO toca copy, NO
    // incrementa contadores, NO marca padre como rerolled. El
    // frontend usa este modo cuando el Tutor pica "Reintentar
    // imagen" en una card que el batch original dejó atascada.
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
        // Reset visual optimista: si veníamos de rejected, status → draft.
        // image_r2_url → null para que el card vuelva al modo pending.
        const resetPatch: Record<string, any> = { image_r2_url: null }
        if (post.status === "rejected") resetPatch.status = "draft"
        await patchPostFields(supabase, retryImageForId, resetPatch)

        // Disparar regen en background con el mismo waitUntil pattern.
        // Una sola imagen → sobra wall clock dentro del límite del worker.
        const placeholderForBg = {
            id: retryImageForId,
            prompt_visual: visualPrompt,
        }
        const hasWaitUntil =
            typeof EdgeRuntime !== "undefined" &&
            typeof EdgeRuntime?.waitUntil === "function"
        console.log(
            `[atelier:retry] ${retryImageForId} dispatching single-image regen, waitUntil=${hasWaitUntil}`
        )
        if (hasWaitUntil) {
            EdgeRuntime.waitUntil(
                processImagesBackground(
                    GEMINI_API_KEY!,
                    supabase,
                    r2,
                    [placeholderForBg]
                )
            )
        } else {
            processImagesBackground(
                GEMINI_API_KEY!,
                supabase,
                r2,
                [placeholderForBg]
            ).catch((e) =>
                console.error("[atelier:retry] bg crashed", e)
            )
        }

        return jsonResponse(200, {
            success: true,
            mode: "retry_image_only",
            post_id: retryImageForId,
            message:
                "Imagen regenerándose en background. El polling al RPC get_vtli_posts_by_ids detectará el image_r2_url nuevo.",
        })
    }

    // ── Determinar modo (batch vs reroll)
    const rerollOfPostId = body.reroll_of_post_id?.trim() || null
    let category: "veo" | "telekinesis" | "calibracion" | "sintonia"
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
            Math.min(Number(body.count ?? 5) || 5, MAX_BATCH_COUNT)
        )
    }

    // ── Fetch memoria (últimos pulsos aprobados de la categoría)
    const recentPulsos = await fetchRecentPulsos(supabase, category)

    // ── Generar copy via Gemini 3.5 Flash (sincrónico)
    let rawPosts: RawCopyPost[]
    try {
        const userPrompt = buildUserPrompt(
            category,
            count,
            recentPulsos,
            parentPost?.target ? [parentPost.target] : []
        )
        rawPosts = await callGeminiText(
            GEMINI_API_KEY!,
            VTLI_VISIONARIO_SYSTEM,
            userPrompt
        )
        if (rawPosts.length > count) rawPosts = rawPosts.slice(0, count)
    } catch (err: any) {
        console.error("[atelier] copy generation failed", err)
        return jsonResponse(502, {
            error: "copy_generation_failed",
            detail: String(err?.message ?? err),
        })
    }

    if (rawPosts.length === 0) {
        return jsonResponse(502, {
            error: "no_posts_generated",
        })
    }

    // Modo manual ("solo prompts"): NO se genera ninguna imagen por API; el
    // motor solo arma el prompt (Zak lo pega a mano en Nano Banana, $0). El
    // reroll siempre es por API (reusa el flujo normal).
    const imageMode =
        !rerollOfPostId && body.image_mode === "prompts" ? "prompts" : "api"

    // ── INSERT placeholders con image_r2_url=null (sincrónico, rápido)
    const placeholders = rawPosts.map((rp) =>
        mapLlmToPlaceholder(rp, category, adminClerkId, rerollOfPostId, imageMode)
    )

    let inserted: any[] = []
    try {
        inserted = await insertVtliPostsBatch(supabase, placeholders)
    } catch (err: any) {
        console.error("[atelier] DB insert failed", err)
        return jsonResponse(500, {
            error: "db_insert_failed",
            detail: String(err?.message ?? err),
        })
    }

    // ── Si es reroll, marcar padre (sincrónico, rápido)
    if (rerollOfPostId) {
        await markParentRerolled(supabase, rerollOfPostId, adminClerkId)
    }

    // ── MODO MANUAL: NO se genera ninguna imagen por API. Devolvemos los
    // placeholders con el prompt listo para copiar/pegar en Nano Banana. Costo $0.
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

    // ── BACKGROUND: generar imágenes + upload R2 + UPDATE rows
    // El handler devuelve YA. Las imágenes se procesan en paralelo
    // dentro de waitUntil() y el frontend hace polling al RPC
    // get_vtli_posts_by_ids cada 4s hasta que image_r2_url se popule.
    const hasWaitUntil =
        typeof EdgeRuntime !== "undefined" &&
        typeof EdgeRuntime?.waitUntil === "function"
    console.log(
        `[atelier] handler returning, EdgeRuntime.waitUntil=${hasWaitUntil} — dispatching ${inserted.length} background tasks`
    )
    if (hasWaitUntil) {
        EdgeRuntime.waitUntil(
            processImagesBackground(
                GEMINI_API_KEY!,
                supabase,
                r2,
                inserted
            )
        )
    } else {
        // Fallback: fire-and-forget sin waitUntil (Deno puro sin EdgeRuntime)
        processImagesBackground(
            GEMINI_API_KEY!,
            supabase,
            r2,
            inserted
        ).catch((e) =>
            console.error("[atelier:bg] background crashed", e)
        )
    }

    // Devolver INMEDIATAMENTE los placeholders. Frontend polleará.
    return jsonResponse(200, {
        success: true,
        async: true,
        category,
        count_requested: count,
        count_generated: inserted.length,
        pulsos_inyectados: recentPulsos.length,
        posts: inserted,
        message:
            "Placeholders insertados. Imágenes generándose en background. Haz polling a get_vtli_posts_by_ids con los IDs hasta que image_r2_url se popule.",
    })
})
