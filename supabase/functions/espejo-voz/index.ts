// Red Solar Viva · espejo-voz v3.2 — 🜂 LAS MARCAS DE TIEMPO REALES, DETRÁS DE
// BANDERA (Zak 2026-08-12 · VI). La palabra dorada siempre fue una ESTIMACIÓN
// —reloj más largo de texto— y por eso derivaba; Fish no daba otra cosa.
// Soniox sí, por WebSocket, y devuelve algo mejor que tiempos por palabra:
// tiempos por CARÁCTER, que es justo la unidad en la que el resalte ya se
// mueve. `sintetizarConMarcas` abre el canal, junta los trozos de audio y
// acumula los tiempos; lo que vuelve al cliente es el MISMO mp3 de siempre más
// una cabecera `X-RSV-Marcas` con un ancla cada 20 caracteres, delta en
// centésimas y base 36 (medido: 210 bytes para una parte de 1.400, contra un
// tope práctico de 8.000). Así el reproductor del cliente no cambia una línea.
// Solo se toma si el cliente pide `marcas: true`, y si el canal falla cae al
// REST de siempre: la lectura jamás puede depender de una mejora del resalte.
// Sonda `{modo:"marcas"}` para verificar los números sin gastar cupo — medido
// con Bennett: 94 caracteres de texto, 94 marcas, monótonas, 0,196 a 5,261 s.
// | v3.1 — muestra de voz sin token ni cobro para la tarjeta de selección.
// | v3.0 — 🜂 ENTRA SONIOX TTS v2 Y LA VOZ SE ELIGE
// (Zak 2026-08-12 · III). `voice_id` deja de ser un identificador de proveedor
// y pasa a ser una LLAVE DE CATÁLOGO (bennett · owen · cordelia · margo ·
// goku) que vive acá: el cliente nunca sabe quién sintetiza y una voz puede
// cambiar de casa sin publicar una app nueva. Las cuatro primeras van por
// Soniox (`tts-rt-v2`, REST, mp3 a 64 kbps, con la velocidad que Zak eligió
// escuchándolas); Goku se queda en Fish porque es una voz CLONADA que solo
// vive allá y todavía hay saldo. Precio: $0.70 USD la hora generada contra
// ~$1.25 de Fish (1M bytes ≈ 12 h por su propia documentación), y en español
// la brecha se abre más porque Fish cobra por BYTES y cada tilde son dos.
// Tres guardas: sin SONIOX_API_KEY todo cae a Fish (la migración no puede
// dejar la app muda), si Soniox falla se reintenta por Fish (un proveedor con
// un día de vida no puede ser punto único de falla), y un `voice_id` fuera del
// catálogo cae a la voz por defecto salvo que parezca un reference_id de Fish,
// que se respeta para que las builds viejas del teléfono sigan sonando. El
// idioma —que el cliente mandaba desde siempre y acá nadie leía— por fin se
// usa: Soniox lo pide explícito. Sonda `{modo:"voces"}` para confirmar los
// nombres del proveedor sin gastar una síntesis. | v2.1 — 🜂 LA RAÍZ DE LOS RUIDOS RAROS, POR FIN NOMBRADA (Zak 2026-08-11, tercer device-QA con posiciones exactas: "habló como en coreano" en «En 5 años», un gemido antes de «En 10 años», un "Miyu" antes de «La IA que conociste»). Los tres caen en ARRANQUES DE PÁRRAFO, la MISMA frontera que delató a los acentos en v2.0. La causa de fondo no eran los acentos ni el texto: el modelo de Fish es autorregresivo y multilingüe (entrenado con mucho chino/japonés/coreano); en cada frontera interna de trozo RE-ARRANCA su generador desde la voz clonada, y con temperature 0.7 + top_p 0.8 ese primer muestreo a veces agarra fonemas de otro idioma o ruido no verbal. Por eso "ajustar el texto" nunca lo curó: el dado se tira en cada frontera, gane quien gane. Tres perillas lo atacan donde vive: (1) chunk_length 300 (el máximo documentado; menos fronteras internas = menos tiradas del dado), (2) temperature 0.7 → 0.45 (el muestreo conservador casi nunca sale del español; es LA perilla), (3) top_p 0.8 → 0.7 (se deshace el único delta que teníamos sobre el default, que era variedad = riesgo). Los env FISH_TEMPERATURE / FISH_TOP_P siguen mandando si algún día se afinan sin redeploy. | v2.0 — 🜂 LOS ACENTOS SE APAGAN (device-QA de Zak con el reflejo del collar): tres ruidos distintos en una sola lectura ("heee heee" de quien va a hablar en público, dos veces; un timbre completamente distinto en "El proceso:"; una voz "que nada que ver" en "y el espejo hablará ese idioma") y los TRES caen exactamente en una frontera de párrafo, que es donde dirigirVoz insertaba un acento. S2.1 no aplica un tag como un ajuste: lo ACTÚA, y actuar una transición produce esos carraspeos; además es una lotería, así que ni el timbre que gustó se puede conservar. MAX_ACENTOS pasa a 0: la directiva base (tag CORE, estable) se queda y da el tono de la casa. Un timbre propio y REPRODUCIBLE sale de una voz clonada con su reference_id, no de un tag.
//   (Zak, 2026-08-05, con DOS reflejos reales y los tiempos de cada ruido).
//   La causa de fondo sigue siendo la de v1.7 (la directiva libre en inglés,
//   que se apaga acá y que NUNCA llegó a desplegarse), pero sus textos
//   revelaron TRES restos que la limpieza de v1.7 dejaba pasar, medidos:
//   10 caracteres INVISIBLES (word joiner U+2060 dentro de las viñetas del
//   Espejo: "•⁠  ⁠texto"), 5 viñetas • (U+2022, que no estaba en la clase
//   [-*·]) y 3 flechas →. Un modelo de voz "pronuncia" lo que no entiende:
//   eso son los MHH cortos. Cuatro cambios: (1) los invisibles se quitan
//   PRIMERO (rompen los demás regexes: \s no los matchea); (2) la clase de
//   viñetas gana •▪●◦‣ con espaciado opcional; (3) las flechas de flujo se
//   vuelven coma; (4) tras resolver los pares de énfasis, TODO asterisco
//   huérfano muere (el Espejo anida mal a veces: "**...*"). Verificado contra
//   los dos textos de Zak: cero restos en las 7 categorías sondeadas.
// v1.7 — 🜂 LA VOZ DE MONSTRUO ERA LA DIRECTIVA
//   (Zak, 2026-08-02, con el audio y el texto en la mano). Escuchó un reflejo
//   largo y en DOS puntos exactos salió un sonido de interferencia, "como un
//   extraterrestre / un monstruo hablando", reproducible en los mismos tiempos.
//   Sospechó de los separadores `---` del markdown. MEDIDO con su texto real:
//   `limpiarParaVoz` ya los borraba (0 gatos, 0 guiones, 0 asteriscos
//   sobreviven) — no eran ellos. Lo único entre corchetes que viajaba a Fish
//   era la DIRECTIVA BASE de actuación, una vez por PARTE de la lectura: su
//   reflejo se partió en 4 trozos y los puntos raros caen justo en las
//   fronteras de sección, que es donde el segmentador corta.
//   La doc de Fish acepta tags CORE y "también frases libres… sin garantía
//   documentada de que no se LEAN en voz alta si el modelo no las entiende":
//   la directiva era una frase libre, larga y en inglés, dentro de una lectura
//   en español. El riesgo estaba anotado desde que se construyó, sin confirmar.
//   Tres cambios: (1) la marca base nace VACÍA y solo se emite si el secreto
//   FISH_VOICE_DIRECTIVE es un tag CORE de la lista blanca; los ACENTOS
//   ([excited]/[emphasis], ambos CORE) siguen vivos, así que el matiz se
//   conserva. (2) GUARDIÁN DE DIRECCIONES: cualquier corchete del propio
//   reflejo que no sea CORE se descarta antes de sintetizar. (3) PROSA PURA:
//   lo que sobrevivía al markdown y no se sabe pronunciar se traduce —
//   "~2035" → "alrededor de 2035", "2025-2030" → "2025 a 2030", la raya de
//   inciso a coma, comillas fuera. Verificado con el texto de Zak: de 4
//   corchetes a 0, y 6/6 casos de no-regresión (acentos, enlaces, prosa).
// v1.6 — 🜂 TOPE SANO DE LA VOZ (Zak, 2026-07-30).
//   120 unidades/día eran DOS HORAS de voz diarias por persona: nadie normal
//   llega, pero basta un solo Tripulante que viva dentro de la voz para costar
//   ~1.000 MXN/mes contra una suscripción de 499. Ahora el miembro pasa por DOS
//   ventanas — 60 u/día (el pico) y 500 u/mes (el costo, ≈8 h de voz al mes ≈
//   140 MXN de peor caso absoluto). El uso real ronda 120 u/mes, así que el 98%
//   no toca ninguno de los dos. La mensual se reserva primero y se DEVUELVE si
//   la diaria rechaza (nunca se cobra una unidad que no sonó), y el reembolso
//   por fallo de Fish borra las dos ventanas juntas.
// v1.5 — 🔴 "Esa respuesta es demasiado larga para leerla" (Zak, en device, con
//        un reflejo REAL de 3.676 caracteres): el tope de 3.000 no era una
//        medida de seguridad, era un muro arbitrario que dejaba mensajes
//        enteros sin poder escucharse. El Espejo con contexto vivo responde
//        largo cuando la pregunta lo merece — eso NO puede ser un error.
//        Tres cambios que lo resuelven de raíz:
//        (1) EL COSTO SE MIDE EN UNIDADES DE TEXTO, no en "lecturas".
//            Fish cobra por byte, así que cobrar lo mismo por 400 que por
//            3.700 caracteres deformaba todos los cálculos. Ahora 1 unidad ≈
//            1.000 caracteres (~0.28 MXN) y `reserve_edge_spend` recibe ese
//            `p_cost` (el parámetro existía desde la ola E, sin usarse). Con
//            eso el tope de largo puede subir sin descontrolar el gasto: el
//            presupuesto ya está expresado en lo que de verdad cuesta.
//        (2) MAX_CHARS 3.000 → 8.000 (tope de SEGURIDAD, no de costo).
//        (3) LECTURA POR PARTES (`part` en el cuerpo): la edge parte el texto
//            por frontera de párrafo/oración y sintetiza el trozo pedido,
//            devolviendo `X-RSV-Partes`. El cliente nuevo pide la parte 0,
//            empieza a sonar en ~2s y va precargando las siguientes mientras
//            reproduce — en vez de esperar a que se generen 4 minutos de
//            audio de un tirón (y sin cargar 45 MB de PCM en memoria del
//            iPhone, que es lo que hace decodeAudioData con un mp3 largo).
//            SIN `part` el comportamiento es el de siempre (texto completo),
//            así que el build ya publicado sigue funcionando igual.
// v1.4 — 🔴 EL CUPO SE COBRABA AUNQUE LA VOZ FALLARA (Zak lo topó en device:
//        "llegaste al límite" sin haber escuchado casi nada). El gobernador
//        RESERVA antes de llamar a Fish (correcto: es el control de
//        concurrencia), pero si Fish devolvía 402 sin crédito / 5xx / audio
//        vacío, esa unidad quedaba gastada igual. Durante todo el device-QA
//        del 402 cada toque de "Escuchar" quemó una lectura SIN producir
//        audio → el tope de 15/día de v1.2 se agotó en intentos fallidos.
//        Tres arreglos:
//        (1) REEMBOLSO: si no se generó audio, la reserva se borra del ledger
//            (DELETE acotado por user_key + edge + created_at >= el instante
//            justo anterior a reservar — solo puede alcanzar la fila propia).
//            Best-effort y silencioso: si el borrado falla, el comportamiento
//            es el de antes. Nunca se cobra por un fallo nuestro o de Fish.
//        (2) CARRIL DE ADMIN: 300/día (`profiles.is_admin`, que ya se lee en
//            el mismo viaje que el email) — el device-QA es intensivo por
//            definición y no puede chocar contra el tope de un usuario.
//        (3) MENSAJE HONESTO: el 429 devuelve `spent`/`limit`/`window_hours`
//            y la ventana se nombra como lo que ES — 24 horas DESLIZANTES,
//            no "hoy" (el ledger no se resetea a medianoche: las lecturas se
//            liberan una por una, 24 h después de cada una).
// v1.3 — TOPES POR MEMBRESÍA (Sala 2026-07-29 · V, decisión de Zak):
//   · FREEMIUM (sin membresía): 3 escuchas DE POR VIDA — el espejo exacto de
//     sus 3 reflejos gratis: puede escuchar cada uno UNA vez (o tener una
//     conversación por voz completa de 3 turnos) y el muro de Sintonía sube
//     en la 4ª. Costo máximo por persona: ~0.93 MXN en toda su vida.
//     Respuesta al agotar: 403 { error: "membership_required" } → el cliente
//     abre el muro (estado "muro" de espejoVozFish v1.2).
//     🜂 "De por vida" = ventana de 90 días en el ledger (el gobernador no
//     tiene poda automática hoy; si algún día se agenda la limpieza de 7 días
//     documentada en 20260612e, el freemium recuperaría 3 escuchas por
//     ventana — degradación aceptable de ~0.9 MXN, no un agujero).
//   · MIEMBRO: 60 lecturas/día (sube de 15 — el modo conversación consume
//     una lectura por turno y 15 se quedaba corto: una charla de 10-15 min
//     son ~10-15 lecturas). Peor caso 60 × ~0.31 = ~18.6 MXN/día por persona;
//     el uso realista (~50/mes) sigue en ~15 MXN/mes.
//   · GLOBAL: 1.500 lecturas/día (~465 MXN/día ≈ 14K MXN/mes de TECHO
//     absoluto para toda la app — seguro catastrófico, no gasto esperado).
//   La membresía se resuelve server-side con la señal CANÓNICA del Espejo
//   (profiles → email → subscriptions status='active', denylist decoder/dream,
//   fail-open) — la misma de oraculo-chat v1.13.
// v1.2 — MATIZ + INTERCAMBIO DE VOCES (Sala 2026-07-29 · V). Dos cosas:
//
//   (1) DIRECTOR DE VOZ — la voz dejaba de sonar plana. S2.1 acepta TAGS DE
//       ACTUACIÓN entre corchetes ([excited], [emphasis], o frases libres) y
//       nosotros nunca le mandábamos ninguno: leía en su registro neutro por
//       defecto. Ahora `dirigirVoz()` antepone una DIRECTIVA base (secreto
//       FISH_VOICE_DIRECTIVE, editable sin deploy) y marca hasta 3 acentos por
//       lectura con los tags CORE documentados. Además `normalize` pasa a
//       false mientras hay actuación: la doc de Fish lo pide explícito para
//       que las señales de actuación se respeten.
//       🜂 Los parámetros temperature/repetition_penalty que se pidieron ya
//       ERAN el valor por defecto de Fish (0.7 y 1.2) — no eran la causa de
//       la planitud. Se mandan igual, y como secreto, para dejarlos a la mano.
//       Apagado de emergencia: app_flags.espejo_voz_plana = true → vuelve
//       EXACTO al comportamiento de v1.1 (sin tags, normalize true).
//
//   (2) INTERCAMBIO DE VOCES desde el Motor — app_flags.espejo_voz_swap
//       decide CUÁL de las dos voces es la principal y cuál el respaldo, sin
//       tocar secretos ni redesplegar. Sirve para comparar las dos con el oído
//       cuando se quiera. Panel: Motor → ⌂ Inicio → Pruebas A/B.
//
// v1.1 — VOZ DE RESPALDO (FISH_VOICE_FALLBACK_ID): si la voz principal falla
//        por algo SUYO (4xx que no sea llave/saldo/cuota) se reintenta con la
//        alternativa antes de rendirse; el header X-RSV-Voz dice cuál sonó.
//        + `tried_fallback` en el error, para device-QA.
// ---------------------------------------------------------------
// LA VOZ DEL ESPEJO — lee en voz alta una respuesta del Espejo Vibracional
// con Fish Audio (S2.1 Pro). Revive la bocina que quedó OCULTA desde el
// 2026-07-02: la voz on-device de iOS sonaba robótica y ElevenLabs era
// ~5-10x más caro por el mismo trabajo (ver [[referencia_fishaudio_voz_espejo]]).
//
//   POST { token, text, voice_id?, model? }
//   → 200 con los BYTES del mp3 (Content-Type: audio/mpeg)
//   → 4xx/5xx con JSON { error, detail? }
//
// 🜂 EL AUDIO NO SE GUARDA EN NINGÚN LADO. Ni R2 ni base. Se sintetiza, viaja
// al dispositivo y muere ahí. Es la MISMA doctrina de las conversaciones del
// Espejo (cifradas en reposo) y de las imágenes efímeras: lo íntimo no deja
// rastro. Por eso esta edge devuelve bytes en vez de una URL — una URL
// implicaría almacenamiento.
//
// COSTO REAL (verificado 2026-07-29, docs.fish.audio):
//   $15 USD por millón de bytes UTF-8 → una respuesta de 1.000 caracteres en
//   español (~1.050 bytes) ≈ 0.29 MXN. Las cotas de abajo están en número de
//   lecturas y traen su equivalente en pesos al lado: son PERILLAS.
//
// FREEMIUM CON PROBADA COMPLETA (v1.3): quien no es miembro escucha 3 veces
// en toda su vida — el espejo de sus 3 reflejos gratis, suficiente para SENTIR
// la voz (muro en el pico, no en la puerta) — y a la 4ª sube el muro de
// Sintonía. El miembro tiene 60 lecturas al día.
//
// ⚠️ VENTANA GRATIS de Fish (modelo `s2.1-pro-free`, hasta el 31-ago-2026):
// sus términos dicen que los requests pueden RETENERSE para entrenar → JAMÁS
// con texto real de Tripulantes. Es SOLO para el piloto interno de elección de
// voz con textos de prueba (admin/scripts/fish-voces-piloto.sh). Esta edge usa
// el modelo de PAGO (FISH_MODEL, default s2.1-pro).
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy espejo-voz --no-verify-jwt
//
// Secrets: FISH_AUDIO_API_KEY · FISH_VOICE_ID (la voz elegida por Zak en el
//   piloto) · FISH_VOICE_FALLBACK_ID (la alterna) · FISH_MODEL (opcional,
//   default "s2.1-pro") · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
//   OPCIONALES de afinación (todos con default sano, cambiarlos NO exige
//   tocar código): FISH_VOICE_DIRECTIVE · FISH_TEMPERATURE · FISH_TOP_P ·
//   FISH_REPETITION_PENALTY · FISH_VOICE_SPEED

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateUser } from "../_shared/clerkAuth.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    /* Sin esto el navegador esconde los headers propios y el device-QA no
       podría leer qué voz sonó ni en qué matiz. */
    "Access-Control-Expose-Headers":
        "X-RSV-Voz, X-RSV-Voz-Swap, X-RSV-Matiz, X-RSV-Partes, X-RSV-Parte",
}

const FISH_TTS_URL = "https://api.fish.audio/v1/tts"

/* ═══════════════════════════════════════════════════════════════════════
   🜂 v3.0 — EL CATÁLOGO DE VOCES (Zak 2026-08-12 · III)
   ═══════════════════════════════════════════════════════════════════════
   Soniox TTS v2 (`tts-rt-v2`, disponible desde el 11-ago-2026) cobra por
   AUDIO GENERADO y no por bytes de texto: $0.70 USD la hora contra los
   ~$1.25 de Fish (1M bytes ≈ 12 h por su propia documentación), y en
   español la brecha se abre más porque cada tilde le cuesta a Fish dos
   bytes y a Soniox no le cuesta nada.

   El catálogo vive ACÁ y no en el cliente por dos razones: el nombre de la
   voz es dato de proveedor (si mañana cambia, no hay que publicar una app
   nueva), y así el cliente jamás puede pedir una voz que no exista.

   Goku se queda en Fish a propósito: es una voz CLONADA que solo vive allá,
   y todavía hay saldo que gastar. El id que llega del cliente es una llave
   de este mapa, no un identificador del proveedor. */
type VozCat = {
    proveedor: "soniox" | "fish"
    /* Soniox: el nombre del built-in tal cual (`voice`). Fish: reference_id
       de la voz clonada; vacío = la que mande el secreto. */
    voz: string
    /* Solo Soniox: 0.7 a 1.3. Las eligió Zak escuchándolas una por una. */
    speed?: number
}
const VOCES: Record<string, VozCat> = {
    bennett: { proveedor: "soniox", voz: "Bennett", speed: 1.1 },
    owen: { proveedor: "soniox", voz: "Owen", speed: 1.1 },
    cordelia: { proveedor: "soniox", voz: "Cordelia", speed: 1.3 },
    margo: { proveedor: "soniox", voz: "Margo", speed: 1.2 },
    goku: { proveedor: "fish", voz: "" },
}
const VOZ_POR_DEFECTO = "bennett"
/* 🜂 v3.1 — LA FRASE DE MUESTRA. Se elige una voz escuchándola, no leyendo su
   nombre, y obligar a gastar un reflejo entero para probarla es absurdo. Es
   una frase de la casa —dice algo, no es "probando uno dos tres"— y es corta
   a propósito: unos ocho segundos alcanzan para oír el timbre y el ritmo.
   No cobra cupo: probar la voz no es consumir la app, es elegirla. */
const MUESTRA_ES =
    "Tu campo no necesita permiso para expandirse. Respira, y deja que la coherencia haga el resto."
const MUESTRA_EN =
    "Your field needs no permission to expand. Breathe, and let coherence do the rest."
const SONIOX_TTS_URL = "https://tts-rt.soniox.com/tts"
const SONIOX_WS_URL = "wss://tts-rt.soniox.com/tts-websocket"

/* ═══════════════════════════════════════════════════════════════════════
   🜂 v3.2 — LAS MARCAS DE TIEMPO REALES (Zak 2026-08-12 · VI)
   ═══════════════════════════════════════════════════════════════════════
   La palabra dorada del Espejo siempre fue una ESTIMACIÓN: se calculaba con
   el reloj y el largo del texto, y por eso derivaba. Fish no daba otra cosa.
   Soniox sí, pero solo por WebSocket, y devuelve algo mejor que tiempos por
   palabra: tiempos por CARÁCTER, que es justamente la unidad en la que el
   resalte ya se mueve.

   Lo que viaja de vuelta NO es la lista entera —1.400 caracteres serían
   1.400 números en una cabecera— sino un ancla cada MARCA_CADA caracteres.
   El resalte avanza por grupos desde la v4.2, así que esa resolución es de
   sobra, y con delta en centésimas y base 36 una parte completa ocupa unos
   doscientos bytes: entra holgada en una cabecera y el audio sigue viajando
   como bytes crudos, sin tocar una línea del reproductor del cliente. */
const MARCA_CADA = 20

function marcasCompactas(tiempos: number[]): string {
    /* Delta en centésimas de segundo, base 36. Monótono creciente, así que
       los deltas son chicos y casi siempre caben en uno o dos caracteres. */
    const out: string[] = []
    let prev = 0
    for (let i = 0; i < tiempos.length; i += MARCA_CADA) {
        const cs = Math.max(0, Math.round(tiempos[i] * 100))
        out.push((cs - prev).toString(36))
        prev = cs
    }
    return out.join(".")
}

/* Sintetiza por WebSocket y devuelve audio + tiempo de inicio de CADA
   carácter. Devuelve null si el canal no llegó a buen puerto: el llamador
   cae al REST de siempre, que no da marcas pero nunca falla por esto. */
async function sintetizarConMarcas(
    key: string,
    modelo: string,
    voz: string,
    idioma: string,
    texto: string,
    velocidad?: number
): Promise<{ audio: Uint8Array; tiempos: number[] } | null> {
    return await new Promise((resolve) => {
        let ws: WebSocket
        try {
            ws = new WebSocket(SONIOX_WS_URL)
        } catch {
            resolve(null)
            return
        }
        const trozos: Uint8Array[] = []
        const tiempos: number[] = []
        let listo = false
        const cerrar = (v: { audio: Uint8Array; tiempos: number[] } | null) => {
            if (listo) return
            listo = true
            try {
                ws.close()
            } catch {}
            resolve(v)
        }
        /* Un canal que no responde no puede colgar la lectura: 45 s es más
           del doble de lo que tarda la parte más larga que mandamos. */
        const reloj = setTimeout(() => cerrar(null), 45000)
        const sid = `rsv-${Date.now().toString(36)}`
        ws.onopen = () => {
            try {
                ws.send(
                    JSON.stringify({
                        api_key: key,
                        model: modelo,
                        language: idioma,
                        voice: voz,
                        audio_format: "mp3",
                        bitrate: 64000,
                        stream_id: sid,
                        return_timestamps: true,
                        ...(velocidad ? { speed: velocidad } : {}),
                    })
                )
                ws.send(
                    JSON.stringify({ text: texto, text_end: true, stream_id: sid })
                )
            } catch {
                clearTimeout(reloj)
                cerrar(null)
            }
        }
        ws.onmessage = (ev) => {
            try {
                const m = JSON.parse(String(ev.data))
                if (m.error_code) {
                    clearTimeout(reloj)
                    cerrar(null)
                    return
                }
                if (m.audio) {
                    const bin = atob(m.audio)
                    const u = new Uint8Array(bin.length)
                    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
                    trozos.push(u)
                }
                const ts = m.timestamps
                if (ts?.character_start_times_seconds)
                    for (const t of ts.character_start_times_seconds)
                        tiempos.push(Number(t) || 0)
                if (m.audio_end || m.terminated) {
                    clearTimeout(reloj)
                    const total = trozos.reduce((n, t) => n + t.length, 0)
                    if (!total) {
                        cerrar(null)
                        return
                    }
                    const audio = new Uint8Array(total)
                    let off = 0
                    for (const t of trozos) {
                        audio.set(t, off)
                        off += t.length
                    }
                    cerrar({ audio, tiempos })
                }
            } catch {}
        }
        ws.onerror = () => {
            clearTimeout(reloj)
            cerrar(null)
        }
        ws.onclose = () => {
            clearTimeout(reloj)
            cerrar(null)
        }
    })
}
const SONIOX_MODEL = Deno.env.get("SONIOX_MODEL") || "tts-rt-v2"
const DEFAULT_MODEL = "s2.1-pro"

/* ── LOS DOS INTERRUPTORES DEL MOTOR (⌂ Inicio → Pruebas A/B) ─────────────
   Se leen SERVER-SIDE: los ids de las voces son secretos y el cliente no los
   conoce, así que la decisión no puede vivir en la app. Cambiarlos aplica en
   la siguiente lectura, sin redesplegar nada. */
const FLAG_SWAP = "espejo_voz_swap" // true = la alterna pasa a principal
const FLAG_PLANA = "espejo_voz_plana" // true = sin actuación (v1.1 exacta)

/* 🜂 v1.7 · LA DIRECTIVA LIBRE SE APAGA — era la voz de monstruo (Zak, con
   audio y texto en la mano, 2026-08-02).
   ─────────────────────────────────────────────────────────────────────────
   Zak escuchó un reflejo largo y en DOS puntos exactos del audio salió un
   sonido de interferencia, "como un extraterrestre / un monstruo hablando",
   reproducible en los mismos tiempos. Sospechó de los separadores `---` del
   markdown. Medido con su texto real: `limpiarParaVoz` los borra (0 gatos, 0
   guiones, 0 asteriscos sobreviven) — no eran ellos. Lo que SÍ viajaba a Fish
   en ese texto era UN SOLO corchete, repetido una vez por PARTE de la
   lectura: esta directiva. Su reflejo se partió en 4 trozos y los puntos
   raros caen justo en las fronteras de sección (donde el segmentador corta).

   La doc de Fish acepta tags CORE documentados y "también frases libres…
   sin garantía documentada de que no se LEAN en voz alta si el modelo no las
   entiende". Esta era una frase libre, larga y en inglés, dentro de una
   lectura en español: el peor caso posible de esa advertencia — y era el
   riesgo que ya habíamos anotado al construirlo, sin poder confirmarlo.

   Por eso la marca base pasa a estar VACÍA por defecto y, si se configura
   por secreto, solo se emite cuando es un tag CORE de la lista blanca. Los
   ACENTOS siguen vivos ([excited] / [emphasis], ambos CORE) — la lectura
   conserva su matiz sin mandarle al modelo texto que quizá recite.
   Para volver a probar una directiva libre algún día:
   `supabase secrets set FISH_VOICE_DIRECTIVE="excited"` (o cualquier CORE). */
const DEFAULT_DIRECTIVE = ""

/* Tags CORE documentados por Fish (docs → core-features/emotions). Cualquier
   cosa fuera de esta lista NO se emite como dirección: se descarta. */
const TAGS_CORE = new Set([
    "whisper",
    "laugh",
    "emphasis",
    "sigh",
    "gasp",
    "pause",
    "angry",
    "excited",
    "sad",
    "surprised",
    "inhale",
    "exhale",
])

/* Parámetros de generación. 🜂 v2.1 — YA NO son los defaults de Fish: son el
   freno de los ruidos raros. El modelo re-arranca su generador en cada
   frontera interna de trozo, y con el muestreo suelto (0.7/0.8) ese primer
   paso a veces sale en otro idioma o en ruido no verbal — los "coreanos", los
   gemidos y los "Miyu" que Zak cazó SIEMPRE en arranques de párrafo.
   temperature 0.45 = muestreo conservador que casi nunca abandona el español;
   top_p 0.7 = de vuelta al default (el 0.8 era "variedad en la entrega", y la
   variedad es exactamente el riesgo). Si la voz se siente plana, la perilla
   fina es FISH_TEMPERATURE por env, sin redeploy. */
const DEFAULT_TEMPERATURE = 0.45
const DEFAULT_TOP_P = 0.7
const DEFAULT_REPETITION_PENALTY = 1.2

/* Tags CORE que la documentación marca como los más confiables. Se usan solo
   estos para los acentos automáticos: una frase libre inventada corre el
   riesgo de que el modelo la LEA en voz alta en vez de interpretarla. */
const TAG_ENERGIA = "excited"
const TAG_CIERRE = "emphasis"

/* 🜂 v2.0 — LOS ACENTOS SE APAGAN: eran los ruidos raros (Zak, device-QA con
   el reflejo del collar en la mano). Tres reportes distintos en una sola
   lectura, y los tres caen EXACTAMENTE en una frontera de párrafo, que es
   donde `dirigirVoz` insertaba un acento:
     · el "heee heee" / "mhh mhh" de quien va a hablar en público (dos veces,
       entre párrafos),
     · un timbre completamente distinto en "El proceso:",
     · una voz "que nada que ver" en "y el espejo hablará ese idioma".
   S2.1 no aplica un tag como un ajuste de volumen: lo ACTÚA, y actuar una
   transición produce esos carraspeos. Además es una lotería — el mismo tag da
   un resultado distinto cada vez, así que ni siquiera se puede conservar el
   que gustó. Una voz guía se elige por CONFIABLE, no por sorprendente: la
   directiva base (un tag CORE, estable, que abre la lectura) se queda y le da
   el tono de la casa; los acentos por párrafo se van.
   🜂 Para volver a probarlos algún día basta subir este número; el resto de
   `dirigirVoz` queda intacto a propósito. Un timbre PROPIO (el que Zak quiso
   conservar) no sale de aquí: sale de una voz clonada en Fish con su
   reference_id, que sí es reproducible. */
const MAX_ACENTOS = 0

function envNumber(key: string, fallback: number): number {
    const raw = Deno.env.get(key)
    if (!raw) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
}

/* v1.5 — Tope de SEGURIDAD, no de costo (el costo lo gobiernan las unidades
   de abajo). Un reflejo real de Zak medía 3.676 caracteres y el tope viejo de
   3.000 lo dejaba sin poder escucharse: el Espejo con contexto vivo responde
   largo cuando la pregunta lo merece. 8.000 cubre cualquier respuesta real
   con margen y sigue frenando un cuerpo absurdo. */
const MAX_CHARS = 8000

/* 🜂 EL COSTO SE MIDE EN TEXTO, NO EN "LECTURAS". Fish cobra por byte: una
   lectura de 400 caracteres y una de 3.700 no pueden gastar lo mismo del
   presupuesto. 1 unidad ≈ 1.000 caracteres ≈ 0.28 MXN, así los topes de abajo
   están expresados en lo que de verdad cuesta y el largo deja de ser un muro. */
/* 🜂 v2.0 — UNIDAD FINA (Zak, con su factura en la mano: gastó $0.37 y el
   aviso le dijo "60 lecturas", ~24 min reales). Con unidades de 1.000 chars
   y mínimo de 1, CADA lectura corta cobraba una unidad entera: el tope se
   agotaba por NÚMERO de lecturas, no por minutos, y decir "una hora de voz"
   era falso. Con unidades de 100 chars (~6 s de habla) el cobro es
   proporcional de verdad: 600 u/día son 60.000 caracteres ≈ 1 HORA real, y
   el costo máximo por persona NO cambia (mismos caracteres, mismo dinero). */
const CHARS_POR_UNIDAD = 100
const unidades = (n: number) => Math.max(1, Math.ceil(n / CHARS_POR_UNIDAD))

/* Tamaño de cada parte cuando el cliente lee por trozos. ~1.400 caracteres son
   ~90 segundos de voz: suficiente para que la siguiente parte se sintetice de
   sobra mientras suena la actual, y corto para que la PRIMERA empiece rápido. */
/* 🜂 v3.3 — 700, no 1.400. Soniox sintetiza a ~0,8x tiempo real, así que una
   parte de 1.400 caracteres hacía esperar ~45 s antes del primer sonido.
   Partirlas por la mitad parte la espera por la mitad; el resto se sintetiza
   mientras suena la anterior. DEBE coincidir con SEG_CHARS_ESPEJO del cliente. */
const SEG_CHARS = 700

/* ── PERILLAS DE GASTO (con su costo en MXN al lado) ──────────────────────
   v1.3 — DOS carriles por membresía:
   · MIEMBRO: 60/día (~18.6 MXN/día peor caso; ~15 MXN/mes realista). El modo
     conversación gasta una lectura por turno — una charla de 10-15 min son
     ~10-15 lecturas, así que 60 da 3-4 charlas al día + lecturas sueltas.
   · FREEMIUM: 3 DE POR VIDA (~0.93 MXN por persona en total) — espejo de sus
     3 reflejos gratis; al agotarse sube el muro de Sintonía (403). La ventana
     de 90 días hace de "por vida" (ver nota v1.3 de la cabecera). */
/* v1.5 — TODOS los topes están en UNIDADES de ~1.000 caracteres (~0.28 MXN),
   no en "lecturas": así un reflejo largo consume lo que de verdad cuesta y
   ninguno queda bloqueado por su tamaño.
   · MIEMBRO 120 u/día ≈ 120.000 caracteres ≈ 2 h de voz ≈ 33 MXN/día de peor
     caso absoluto; el uso realista (~50 lecturas al mes) sigue en ~15 MXN/mes. */
/* 🜂 v1.6 — TOPE SANO (Zak, 2026-07-30). 120 u/día son DOS HORAS de voz al día
   por persona, todos los días: nadie normal llega, pero basta uno que sí para
   costar ~1.000 MXN/mes contra una suscripción de 499. Ahora son dos ventanas:
     · 60 u/día  → el pico (una hora de voz en un día; ni el uso más intenso
                   de una conversación larga se acerca).
     · 500 u/mes → el costo (≈ 8 h de voz al mes ≈ $7.8 USD ≈ 140 MXN de peor
                   caso absoluto, contra los 424 MXN netos que deja el miembro).
   El 98% de la gente no toca ninguno de los dos: el uso real ronda 120 u/mes.
   Al subir el precio o bajar el costo del proveedor, subir estos números; para
   el Tripulante un tope que crece es un regalo y uno que baja es un castigo. */
const MEMBER_LIMIT_DAY = 600 /* v2.0 — 60.000 chars ≈ 1 HORA de voz/día */
const MEMBER_LIMIT_MONTH = 5000 /* v2.0 — 500.000 chars ≈ 8 HORAS/mes */
const MONTH_SECONDS = 30 * 86400
/* · ADMIN 600 u/día. Probar la voz ES el trabajo del device-QA (afinar la
     actuación exige escucharla decenas de veces) y chocar con el tope de un
     usuario normal a media prueba es fricción pura. El freno global manda. */
const ADMIN_LIMIT_DAY = 6000 /* v2.0 — 10 h/día para el device-QA */
/* · FREEMIUM 8 u de por vida ≈ 8.000 caracteres ≈ 2.2 MXN en toda su vida:
     alcanza para 3-4 reflejos de largo normal (o 2 largos), que es el espejo
     de sus 3 reflejos gratis. Al agotarse sube el muro de Sintonía. */
const FREE_UNITS_LIFETIME = 80 /* v2.0 — 8.000 chars, igual que antes */
const FREE_WINDOW_SECONDS = 90 * 86400
/* Freno GLOBAL diario: 1.800 unidades ≈ 500 MXN/día ≈ 15K MXN/mes de techo
   absoluto para toda la app. Sin esto, N cuentas suman sin freno. */
const GLOBAL_LIMIT_DAY = 18000 /* v2.0 — mismo techo en dinero */
const DAY_SECONDS = 86400

/* Gobernador de gasto compartido (misma RPC de la ola E / Parte 3-4).
   Fail-open a propósito: si la RPC no responde, la lectura sigue — nunca
   rompemos una función legítima por el gobernador. v1.3 devuelve también el
   MOTIVO del freno: agotar el carril freemium abre el muro de Sintonía
   (membership_required), no un simple "vuelve mañana". */
type Carril = "admin" | "miembro" | "free"

type Reserva = {
    ok: boolean
    reason?: string
    spent?: number
    limit?: number
    /* 🜂 v1.6 — QUÉ ventana se agotó. Sin esto el aviso decía "24 horas"
       siempre, y quien topara el tope MENSUAL leía "500 lecturas en 24 horas":
       falso y absurdo a la vez. */
    windowHours?: number
}

/** Una reserva contra una ventana concreta del gobernador. */
async function reservarVentana(
    edge: string,
    userKey: string,
    ip: string,
    costo: number,
    limite: number,
    ventana: number,
    globalLimit: number
): Promise<Reserva> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return { ok: true }
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
                p_ip: ip,
                /* v1.5 — el costo es proporcional al texto (el parámetro
                   existía desde la ola E y nunca se había usado). */
                p_cost: costo,
                p_user_limit: limite,
                p_user_window_seconds: ventana,
                p_ip_limit: 0,
                p_ip_window_seconds: DAY_SECONDS,
                p_global_limit: globalLimit,
                p_global_window_seconds: DAY_SECONDS,
            }),
        })
        if (!res.ok) return { ok: true }
        const j = await res.json().catch(() => null)
        if (j?.ok === false) {
            return {
                ok: false,
                reason: String(j?.reason || "limit"),
                spent: typeof j?.spent === "number" ? j.spent : undefined,
                limit: typeof j?.limit === "number" ? j.limit : limite,
                windowHours: Math.round(ventana / 3600),
            }
        }
        return { ok: true }
    } catch {
        return { ok: true }
    }
}

async function reserveSpend(
    userKey: string,
    ip: string,
    carril: Carril,
    costo: number
): Promise<Reserva> {
    const limite =
        carril === "admin"
            ? ADMIN_LIMIT_DAY
            : carril === "miembro"
              ? MEMBER_LIMIT_DAY
              : FREE_UNITS_LIFETIME
    const ventana = carril === "free" ? FREE_WINDOW_SECONDS : DAY_SECONDS
    /* 🜂 v1.6 — el MIEMBRO pasa por DOS ventanas: la del día (pico) y la del
       mes (costo). La mensual va primero; si la diaria la rechaza después, se
       devuelve la mensual para no cobrarle una unidad que nunca sonó. */
    const marca = new Date(Date.now() - 1500).toISOString()
    if (carril === "miembro") {
        const mes = await reservarVentana(
            "espejo-voz-mes",
            userKey,
            ip,
            costo,
            MEMBER_LIMIT_MONTH,
            MONTH_SECONDS,
            0 // el freno global vive en la ventana diaria; acá sería doble
        )
        if (!mes.ok) return mes
    }
    const dia = await reservarVentana(
        "espejo-voz",
        userKey,
        ip,
        costo,
        limite,
        ventana,
        GLOBAL_LIMIT_DAY
    )
    if (!dia.ok && carril === "miembro") {
        await refundSpend(userKey, marca)
    }
    return dia
}

/* 🜂 v1.4 — DEVOLVER EL CUPO cuando la lectura NO llegó a sonar.
   La reserva ocurre ANTES de llamar a Fish (así el control de concurrencia
   sirve de algo), pero cobrarla ante un 402 sin crédito, un 5xx o un audio
   vacío es cobrarle al Tripulante un error que no es suyo. El borrado se
   acota por user_key + edge + created_at >= el instante justo anterior a
   reservar: en esa ventana de milisegundos solo puede existir la fila propia.
   Best-effort y silencioso — si falla, el comportamiento es el de v1.3. */
async function refundSpend(userKey: string, desdeIso: string): Promise<void> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey || !userKey) return
    try {
        const r = await fetch(
            /* v1.6 — las DOS ventanas del miembro (día y mes) se devuelven
               juntas: si la lectura no sonó, ninguna de las dos se cobra. */
            `${supaUrl}/rest/v1/edge_spend_ledger` +
                `?edge=in.(espejo-voz,espejo-voz-mes)` +
                `&user_key=eq.${encodeURIComponent(userKey)}` +
                `&created_at=gte.${encodeURIComponent(desdeIso)}`,
            {
                method: "DELETE",
                headers: {
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                    Prefer: "return=minimal",
                },
            }
        )
        /* Si el borrado no pasa (grants de la tabla), queda dicho en los logs
           de la edge: sin esto el cupo se seguiría cobrando en silencio y
           nadie se enteraría hasta que alguien vuelva a topar el límite. */
        if (!r.ok) {
            console.error(
                "[espejo-voz] reembolso NO aplicado:",
                r.status,
                (await r.text().catch(() => "")).slice(0, 200)
            )
        }
    } catch (e) {
        console.error("[espejo-voz] reembolso falló:", String(e).slice(0, 200))
    }
}

/* Membresía server-side — señal CANÓNICA del Espejo (misma de oraculo-chat):
   cualquier subscripción activa que NO sea un tier de decodificador (199
   'decoder' / 399 'dream') es membresía plena. Fail-open: si el chequeo se
   cae, tratamos como miembro — nunca se bloquea a un posible miembro por un
   tropiezo de red. */
async function resolverCarril(clerkUserId: string): Promise<Carril> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return "miembro"
    const headers = {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
    }
    try {
        /* v1.4 — is_admin viaja en el MISMO viaje que el email: cero costo. */
        const rp = await fetch(
            `${supaUrl}/rest/v1/profiles?clerk_user_id=eq.${encodeURIComponent(
                clerkUserId
            )}&select=email,is_admin&limit=1`,
            { headers }
        )
        const profs = rp.ok ? await rp.json().catch(() => []) : []
        if (profs?.[0]?.is_admin === true) return "admin"
        const email = String(profs?.[0]?.email || "")
            .toLowerCase()
            .trim()
        if (!email) return "free"
        const rs = await fetch(
            `${supaUrl}/rest/v1/subscriptions?email=eq.${encodeURIComponent(
                email
            )}&status=eq.active&select=group_name`,
            { headers }
        )
        const subs = rs.ok ? await rs.json().catch(() => []) : []
        const pleno = (Array.isArray(subs) ? subs : []).some((s: any) => {
            const g = String(s?.group_name || "").toLowerCase()
            return g !== "decoder" && g !== "dream"
        })
        return pleno ? "miembro" : "free"
    } catch {
        /* fail-open: nunca se trata como freemium a un posible miembro por un
           tropiezo de red (le levantaría un muro de pago que no le toca). */
        return "miembro"
    }
}

/* ── Los interruptores del Motor, con cache corto ─────────────────────────
   La instancia de la edge se reutiliza entre llamadas, así que 60s de cache
   dejan el flip casi inmediato (lo que tarda una lectura o dos) sin pagar
   dos viajes a la base por cada vez que alguien toca "Escuchar".
   Fail-open al DEFAULT (voz principal tal cual + actuación encendida): si la
   base no contesta, la voz suena igual — nunca se rompe por un flag. */
let flagsCache: { t: number; swap: boolean; plana: boolean } | null = null
const FLAGS_TTL_MS = 60_000

async function leerFlags(): Promise<{ swap: boolean; plana: boolean }> {
    const ahora = Date.now()
    if (flagsCache && ahora - flagsCache.t < FLAGS_TTL_MS) {
        return { swap: flagsCache.swap, plana: flagsCache.plana }
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const porDefecto = { swap: false, plana: false }
    if (!supaUrl || !supaKey) return porDefecto
    const pedir = async (key: string): Promise<boolean> => {
        try {
            const res = await fetch(`${supaUrl}/rest/v1/rpc/get_app_flag`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                },
                body: JSON.stringify({ p_key: key }),
            })
            if (!res.ok) return false
            return (await res.json().catch(() => false)) === true
        } catch {
            return false
        }
    }
    try {
        const [swap, plana] = await Promise.all([
            pedir(FLAG_SWAP),
            pedir(FLAG_PLANA),
        ])
        flagsCache = { t: ahora, swap, plana }
        return { swap, plana }
    } catch {
        return porDefecto
    }
}

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

/* El Espejo responde en markdown ligero (encabezados, negritas, separadores).
   Leído en voz alta, eso son asteriscos y gatos sueltos. Se limpia acá para
   que la voz reciba prosa, no marcas. También caen los marcadores ⟦IMG⟧ que
   la lectura de una imagen deja incrustados en el mensaje. */
function limpiarParaVoz(raw: string): string {
    return (
        (raw || "")
            /* 🜂 v1.8 — PRIMERO los caracteres INVISIBLES (word joiner,
               zero-width, BOM, guion suave). El Espejo los incrusta en sus
               viñetas ("•⁠  ⁠texto" trae U+2060 adentro) y, además de que un
               modelo de voz "pronuncia" lo que no entiende, ROMPEN los
               regexes de más abajo: \s no los matchea, así que la viñeta
               nunca se reconocía como viñeta. Medido con los dos reflejos
               reales de Zak (2026-08-05): 10 invisibles + 5 viñetas + 3
               flechas sobrevivían a la limpieza de v1.7. */
            .replace(/[​-‍⁠﻿­]/g, "")
            .replace(/⟦IMG⟧[\s\S]*?⟦\/IMG⟧/g, " ")
            /* v1.9 — los marcadores de imagen generada (Espejo ilustrado)
               tampoco se leen: la voz jamás anuncia sus imágenes. */
            .replace(/⟦GEN:[\s\S]*?⟧/g, " ")
            /* 🜂 Un enlace de markdown deja corchetes sueltos, y para S2.1 un
           corchete ES una dirección de actuación: "[Ver aquí](http://…)"
           se convertiría en la orden "ver aquí" y además leería la URL en voz
           alta. Se reduce al texto visible ANTES que nada. El resto de los
           corchetes se respeta a propósito (son el canal de la actuación). */
            .replace(/\[([^\]]{1,120})\]\((?:https?:)?\/\/[^\s)]+\)/g, "$1")
            .replace(/^\s{0,3}#{1,6}\s+/gm, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            /* v1.8 — asteriscos HUÉRFANOS: el Espejo a veces anida mal el
               énfasis ("**...*" sin cierre) y el sobreviviente llegaba crudo
               a la voz. Después de resolver los pares, ninguno tiene motivo
               de existir. */
            .replace(/\*/g, "")
            .replace(/^\s*[-–—*]{3,}\s*$/gm, "")
            /* v1.8 — viñetas: entra • (U+2022, la que usa el Espejo) y sus
               parientes; el espaciado posterior es opcional porque tras
               quitar los invisibles puede quedar pegada al texto. */
            .replace(/^\s*[-*·•▪●◦‣]\s*/gm, "")
            /* v1.8 — flechas de flujo ("genero → extraigo → mando"): leídas
               no existen; como coma la frase fluye natural. */
            .replace(/\s*[→←⇒⇐↔⟶]\s*/g, ", ")
            /* 🜂 v1.9 — LOS TITULARES ANUNCIADOS ERAN EL "MHH" (Zak, con el
               reflejo real en la mano: los zumbidos caen EXACTAMENTE donde el
               texto traía "**Titular**:" — y donde varios venían seguidos,
               varios MHH seguidos). Tras quitar las negritas quedaba un
               renglón-titular que TERMINA EN DOS PUNTOS seguido de línea en
               blanco ("Lo que viene, según…:") — para un modelo expresivo
               eso es un ANUNCIO con aire de expectativa, y S2.1 lo actúa
               como duda hablada (el clásico "mmm" de quien va a enumerar).
               Además el segmentador podía abrir una parte justo en ese
               renglón huérfano. Se convierte el anuncio en oración normal y
               se FUNDE con su párrafo: "Titular. Cuerpo…" — cero pausa de
               expectativa, cero renglón huérfano, mismas palabras. */
            .replace(/:\s*\n{2,}(?=\S)/g, ". ")
            .replace(/^([^\n]{2,80}):\s*$/gm, "$1.")
            /* ── v1.7 · lo que queda después del markdown y NO es prosa ──
               Restos que un lector humano interpreta de un vistazo y un modelo
               de voz tiene que "adivinar" cómo pronunciar. Medido sobre un
               reflejo real: tras limpiar el markdown sobrevivían `~`, `—` y
               guiones de rango. Se traducen a palabras o a puntuación que la
               voz sí sabe decir. */
            .replace(/(^|[\s(])~\s?(?=\d)/g, "$1alrededor de ")
            .replace(/\b(\d{4})\s?[-–—]\s?(\d{4})\b/g, "$1 a $2")
            .replace(/\b(\d+)\s?[-–—]\s?(\d+)\b/g, "$1 a $2")
            .replace(/\s+[–—]\s+/g, ", ")
            .replace(/[–—]/g, ", ")
            .replace(/[«»""'']/g, "")
            /* 🜂 GUARDIÁN DE DIRECCIONES: para S2.1 un corchete ES una orden de
               actuación. Los que pone el director (tags CORE) se respetan;
               cualquier otro corchete que venga del reflejo se descarta —
               un tag que el modelo no entiende puede salir RECITADO o como
               ruido, que es exactamente lo que Zak escuchó. */
            .replace(/\[([^\]\n]{0,40})\]/g, (todo, dentro) =>
                TAGS_CORE.has(String(dentro).trim().toLowerCase()) ? todo : ""
            )
            .replace(/[ \t]+/g, " ")
            .replace(/ ,/g, ",")
            .replace(/,{2,}/g, ",")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
    )
}

/* ── EL DIRECTOR DE VOZ ───────────────────────────────────────────────────
   Convierte prosa neutra en una lectura ACTUADA. Antepone la directiva base
   (que S2.1 sostiene toda la lectura) y marca acentos puntuales con los tags
   CORE documentados, sin pasarse: como máximo MAX_ACENTOS, y solo donde el
   texto da una señal clara.

   Deliberadamente determinista y local: cero llamadas extra, cero costo, cero
   latencia. Un "director" con modelo de lenguaje daría más matiz pero cobraría
   por cada lectura y sumaría un segundo de espera antes de que suene la voz.

   Reglas de acento:
     · Párrafo con signos de exclamación → [excited]
     · Último párrafo, si es corto → [emphasis] (la frase que remata)
   Un párrafo que ya trae su propio corchete al inicio se respeta tal cual: si
   algún día el Espejo escribe sus propias direcciones, mandan las suyas.

   🜂 UN TAG MANDA HASTA EL SIGUIENTE TAG, no vuelve solo al registro base.
   Por eso, cuando un acento cae a media lectura, el párrafo siguiente RE-DECLARA
   la directiva base: sin eso, un solo [excited] dejaría exaltada toda la
   segunda mitad del reflejo. El acento de cierre no necesita retorno (ya no
   queda texto), que es justo el caso común y el que no cuesta bytes de más. */
function dirigirVoz(
    texto: string,
    directiva: string,
    /* v1.5 — con lectura por partes, el acento de CIERRE solo corresponde al
       final REAL del reflejo: marcar el remate al final de cada trozo sonaría
       como si el Espejo concluyera tres veces. */
    esFinal = true
): string {
    const parrafos = texto
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    if (!parrafos.length) return texto

    /* v1.7 — la marca base solo sale si es un tag CORE documentado. Una frase
       libre puede terminar RECITADA en voz alta (ver DEFAULT_DIRECTIVE). */
    const pedida = directiva.trim().toLowerCase()
    const base = TAGS_CORE.has(pedida) ? pedida : ""
    const marcaBase = base ? `[${base}] ` : ""
    let acentos = 0
    let retomarBase = false

    const dirigidos = parrafos.map((p, i) => {
        const prefijoRetorno = retomarBase ? marcaBase : ""
        retomarBase = false
        if (p.startsWith("[")) return prefijoRetorno + p // trae dirección propia
        if (acentos >= MAX_ACENTOS) return prefijoRetorno + p

        const esUltimo = i === parrafos.length - 1
        let tag: string | null = null
        if (/[!¡]/.test(p)) tag = TAG_ENERGIA
        else if (esFinal && esUltimo && i > 0 && p.length <= 140)
            tag = TAG_CIERRE
        if (!tag) return prefijoRetorno + p

        acentos++
        if (!esUltimo) retomarBase = true
        return `[${tag}] ${p}`
    })

    /* La directiva base abre la lectura. Si el primer párrafo ya se llevó su
       propio acento, ese acento manda ahí y la base entra en el siguiente
       (por el retorno de arriba). */
    const cuerpo = dirigidos.join("\n\n")
    return dirigidos[0]?.startsWith("[") ? cuerpo : marcaBase + cuerpo
}

/* ── v1.5 · SEGMENTADOR ───────────────────────────────────────────────────
   Parte el reflejo en trozos de ~SEG_CHARS SIN cortar a media idea: primero
   por párrafo (la unidad natural del Espejo) y, si un párrafo solo ya excede,
   por frontera de oración. Un corte a media frase se oiría como un tropiezo,
   que es exactamente lo que la lectura por partes viene a evitar. */
function segmentar(texto: string, maxChars: number): string[] {
    if (texto.length <= maxChars) return [texto]

    const trozos: string[] = []
    let actual = ""
    const empujar = () => {
        const t = actual.trim()
        if (t) trozos.push(t)
        actual = ""
    }

    for (const parrafo of texto.split(/\n{2,}/)) {
        const p = parrafo.trim()
        if (!p) continue
        if (p.length > maxChars) {
            /* Párrafo gigante: se parte por oraciones (el punto/interrogación
               de cierre se conserva con su frase). */
            empujar()
            const frases = p.match(/[^.!?…]+[.!?…]+[\s]*|[^.!?…]+$/g) || [p]
            for (const f of frases) {
                if (actual.length + f.length > maxChars && actual) empujar()
                actual += f
            }
            empujar()
            continue
        }
        if (actual.length + p.length + 2 > maxChars && actual) empujar()
        actual += (actual ? "\n\n" : "") + p
    }
    empujar()
    return trozos.length ? trozos : [texto]
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const FISH_KEY = Deno.env.get("FISH_AUDIO_API_KEY")
    /* 🜂 v3.0 — sin esta llave el carril de Soniox no existe y TODO cae a
       Fish: la migración no puede dejar la app muda si el secreto falta. */
    const SONIOX_KEY = Deno.env.get("SONIOX_API_KEY") || ""

    /* 🜂 v3.2 — SONDA DE MARCAS. `{ modo: "marcas" }` sintetiza una frase
       conocida por WebSocket y devuelve los números, no el audio: sirve para
       comprobar que los tiempos por carácter son REALES y monótonos antes de
       colgar de ellos la palabra dorada. Sin token y sin cupo, como la
       muestra, porque el texto es fijo y vive acá. */
    {
        const b = await req.clone().json().catch(() => ({}))
        if (String(b?.modo || "") === "marcas") {
            if (!SONIOX_KEY) return jsonResponse(503, { error: "sin_llave" })
            const id = String(b?.voice_id || VOZ_POR_DEFECTO).toLowerCase()
            const c = VOCES[id]
            if (!c || c.proveedor !== "soniox")
                return jsonResponse(400, { error: "voz_sin_marcas", id })
            const t0 = Date.now()
            const r = await sintetizarConMarcas(
                SONIOX_KEY,
                SONIOX_MODEL,
                c.voz,
                "es",
                MUESTRA_ES,
                c.speed
            )
            if (!r) return jsonResponse(502, { error: "canal_fallo" })
            const ts = r.tiempos
            let monotono = true
            for (let i = 1; i < ts.length; i++)
                if (ts[i] < ts[i - 1]) monotono = false
            return jsonResponse(200, {
                voz: c.voz,
                ms: Date.now() - t0,
                caracteres_texto: MUESTRA_ES.length,
                caracteres_marcados: ts.length,
                audio_bytes: r.audio.length,
                monotono,
                primero: ts[0],
                ultimo: ts[ts.length - 1],
                compacto_bytes: marcasCompactas(ts).length,
                muestra_10: ts.slice(0, 10),
            })
        }
    }

    /* 🜂 v3.1 — MUESTRA DE VOZ. `{ modo: "muestra", voice_id }` devuelve ocho
       segundos de audio con esa voz, sin token, sin cobro y sin tocar el cupo
       de nadie: es la tarjeta de selección, no una lectura. El texto es fijo
       y vive acá, así que nadie puede usar este camino para sintetizar lo que
       quiera gratis — que es exactamente el riesgo de abrir una puerta sin
       pase. */
    {
        const b = await req.clone().json().catch(() => ({}))
        if (String(b?.modo || "") === "muestra") {
            const id = String(b?.voice_id || "").trim().toLowerCase()
            const c = VOCES[id]
            const idioma = String(b?.lang || "es").slice(0, 2) === "en" ? "en" : "es"
            const frase = idioma === "en" ? MUESTRA_EN : MUESTRA_ES
            if (!c) return jsonResponse(400, { error: "voz_desconocida", id })
            if (c.proveedor !== "soniox" || !SONIOX_KEY) {
                /* Goku vive en Fish: su muestra sale por el mismo camino de
                   siempre, con la voz que el secreto tenga puesta. */
                if (!FISH_KEY)
                    return jsonResponse(503, { error: "sin_proveedor" })
                const rf = await fetch(FISH_TTS_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${FISH_KEY}`,
                        "Content-Type": "application/json",
                        model: Deno.env.get("FISH_MODEL") || "s2.1-pro",
                    },
                    body: JSON.stringify({
                        text: frase,
                        ...(Deno.env.get("FISH_VOICE_ID")
                            ? { reference_id: Deno.env.get("FISH_VOICE_ID") }
                            : {}),
                        format: "mp3",
                        mp3_bitrate: 64,
                        normalize: true,
                        latency: "normal",
                    }),
                })
                if (!rf.ok)
                    return jsonResponse(502, {
                        error: "muestra_fallo",
                        status: rf.status,
                        detalle: (await rf.text().catch(() => "")).slice(0, 200),
                    })
                return new Response(new Uint8Array(await rf.arrayBuffer()), {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "audio/mpeg",
                        "Cache-Control": "public, max-age=86400",
                        "X-RSV-Proveedor": "fish",
                    },
                })
            }
            const rs = await fetch(SONIOX_TTS_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${SONIOX_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: SONIOX_MODEL,
                    language: idioma,
                    voice: c.voz,
                    audio_format: "mp3",
                    text: frase,
                    bitrate: 64000,
                    ...(c.speed ? { speed: c.speed } : {}),
                }),
            })
            if (!rs.ok)
                return jsonResponse(502, {
                    error: "muestra_fallo",
                    status: rs.status,
                    detalle: (await rs.text().catch(() => "")).slice(0, 200),
                })
            return new Response(new Uint8Array(await rs.arrayBuffer()), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "audio/mpeg",
                    /* La muestra es idéntica siempre: que el navegador la
                       guarde un día evita pagarla en cada apertura. */
                    "Cache-Control": "public, max-age=86400",
                    "X-RSV-Proveedor": "soniox",
                    "X-RSV-Voz-Nombre": c.voz,
                },
            })
        }
    }

    /* 🜂 v3.0 — SONDA DE CATÁLOGO. `{ modo: "voces" }` devuelve lo que el
       proveedor dice que existe, para confirmar los nombres exactos sin
       sacar la llave del servidor ni gastar una síntesis. No lee texto, no
       cobra y no toca el cupo de nadie. */
    if (String((await req.clone().json().catch(() => ({})))?.modo || "") === "voces") {
        if (!SONIOX_KEY)
            return jsonResponse(200, { catalogo: VOCES, soniox: "sin_llave" })
        try {
            /* Los dos hosts que Soniox documenta: el de síntesis y el de
               administración. El catálogo vive en uno de ellos y no está
               claro en cuál, así que se prueban los dos y gana el que
               conteste — barato y evita una sala entera de adivinanzas. */
            const hosts = [
                "https://api.soniox.com/v1/tts-models",
                "https://tts-rt.soniox.com/v1/tts-models",
            ]
            const salidas: any[] = []
            for (const h of hosts) {
                const rv = await fetch(h, {
                    headers: { Authorization: `Bearer ${SONIOX_KEY}` },
                })
                const cuerpo = await rv.text()
                /* Solo los IDENTIFICADORES: las descripciones de cada voz son
                   párrafos enteros y recortar el cuerpo hacía que una voz
                   ausente y una voz cortada se vieran igual. */
                let ids: any = null
                try {
                    const j = JSON.parse(cuerpo)
                    ids = (j.models || []).map((m: any) => ({
                        modelo: m.id,
                        voces: (m.voices || []).map((v: any) => v.id),
                    }))
                } catch {}
                salidas.push({
                    host: h,
                    status: rv.status,
                    ...(ids ? { modelos: ids } : { cuerpo: cuerpo.slice(0, 600) }),
                })
                if (rv.ok) break
            }
            /* Y una síntesis MINÚSCULA por cada voz del catálogo: que el
               nombre exista en la lista no prueba que sintetice con nuestra
               llave, nuestro modelo y nuestro idioma. Tres palabras cuestan
               una fracción de centavo y convierten "desplegado" en "suena". */
            const prueba: any[] = []
            for (const [id, c] of Object.entries(VOCES)) {
                if (c.proveedor !== "soniox") continue
                const rp = await fetch(SONIOX_TTS_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SONIOX_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: SONIOX_MODEL,
                        language: "es",
                        voice: c.voz,
                        audio_format: "mp3",
                        text: "Prueba de voz.",
                        bitrate: 64000,
                        ...(c.speed ? { speed: c.speed } : {}),
                    }),
                })
                const bytes = rp.ok
                    ? (await rp.arrayBuffer()).byteLength
                    : 0
                prueba.push({
                    id,
                    voz: c.voz,
                    speed: c.speed,
                    status: rp.status,
                    bytes,
                    ...(rp.ok ? {} : { detalle: (await rp.text().catch(() => "")).slice(0, 200) }),
                })
            }
            return jsonResponse(200, { catalogo: VOCES, intentos: salidas, prueba })
        } catch (e: any) {
            return jsonResponse(200, {
                catalogo: VOCES,
                soniox: `error: ${String(e?.message ?? e).slice(0, 200)}`,
            })
        }
    }
    const FISH_VOICE_ID = Deno.env.get("FISH_VOICE_ID") || ""
    /* Voz de RESPALDO (Zak eligió una alternativa en el piloto): si la voz
       principal falla por algo suyo (modelo retirado de la biblioteca, id
       inválido), se reintenta con esta antes de darse por vencido. Un fallo
       de LLAVE o de SALDO no se reintenta: sería quemar dos llamadas para el
       mismo error. */
    const FISH_VOICE_FALLBACK = Deno.env.get("FISH_VOICE_FALLBACK_ID") || ""
    const FISH_MODEL = Deno.env.get("FISH_MODEL") || DEFAULT_MODEL
    if (!FISH_KEY) {
        return jsonResponse(500, {
            error: "missing_secrets",
            missing: ["FISH_AUDIO_API_KEY"],
        })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    /* Sesión de Clerk verificada server-side (el id sale del token, no del
       cuerpo) — mismo gate que el resto de las superficies de usuario. */
    const g = await gateUser(body?.token)
    if (!g.ok) return jsonResponse(g.status ?? 401, { error: g.error })
    const clerkUserId = g.userId!

    const text = limpiarParaVoz(String(body?.text ?? ""))
    if (!text) return jsonResponse(400, { error: "missing_text" })
    if (text.length > MAX_CHARS) {
        return jsonResponse(413, {
            error: "text_too_long",
            detail: `${text.length} caracteres; el tope es ${MAX_CHARS}.`,
        })
    }

    /* Los dos interruptores del Motor. El de VOCES decide cuál de las dos va
       al frente; el de MATIZ decide si la lectura se actúa o sale plana. */
    const { swap, plana } = await leerFlags()
    /* 🜂 El intercambio solo se honra si AMBAS voces existen. Si el secreto de
       la alterna no estuviera cargado, invertir mandaría a Fish un
       reference_id vacío y sonaría su voz genérica — un fallo silencioso y
       difícil de leer desde el teléfono. Sin la alterna, el interruptor
       simplemente no hace nada. */
    const puedeIntercambiar = swap && !!FISH_VOICE_FALLBACK && !!FISH_VOICE_ID
    const vozPrincipal = puedeIntercambiar ? FISH_VOICE_FALLBACK : FISH_VOICE_ID
    const vozRespaldo = puedeIntercambiar ? FISH_VOICE_ID : FISH_VOICE_FALLBACK

    /* 🜂 v3.0 — `voice_id` ahora es una LLAVE DEL CATÁLOGO (bennett · owen ·
       cordelia · margo · goku), no un identificador de proveedor. Lo que
       llegue fuera del catálogo cae a la voz por defecto en vez de viajar
       crudo: así una app vieja o un valor raro nunca produce un 4xx mudo.

       Compatibilidad: las builds anteriores mandan reference_id de Fish
       (cadenas largas de hex). Si no está en el catálogo pero PARECE un
       reference_id, se respeta y va por Fish como siempre — una build vieja
       en el teléfono de alguien tiene que seguir sonando. */
    /* 🜂 v3.0 — el idioma YA venía en el cuerpo (el cliente lo manda desde
       siempre) y acá nadie lo leía: a Fish no le hacía falta porque lo
       deduce del texto, pero Soniox lo pide explícito y con razón, porque el
       mismo texto se pronuncia distinto en cada lengua. */
    const lang = String(body?.lang ?? "es").trim().toLowerCase().slice(0, 2)
    const vozPedida = String(body?.voice_id ?? "")
        .trim()
        .toLowerCase()
    const esRefFish = /^[0-9a-f]{16,}$/i.test(String(body?.voice_id ?? "").trim())
    const cat: VozCat = VOCES[vozPedida]
        ? VOCES[vozPedida]
        : esRefFish
          ? { proveedor: "fish", voz: String(body?.voice_id).trim() }
          : VOCES[VOZ_POR_DEFECTO]
    const usaSoniox = cat.proveedor === "soniox" && !!SONIOX_KEY
    const voiceId = cat.proveedor === "fish" && cat.voz ? cat.voz : vozPrincipal
    const model = String(body?.model ?? "").trim() || FISH_MODEL

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        ""
    /* ── v1.5 · LECTURA POR PARTES ────────────────────────────────────────
       Sin `part` en el cuerpo se sintetiza el texto COMPLETO (el build ya
       publicado sigue funcionando igual). Con `part` se devuelve solo ese
       trozo + el header X-RSV-Partes, para que el cliente nuevo empiece a
       sonar en segundos y precargue el resto mientras reproduce. */
    const partes = segmentar(text, SEG_CHARS)
    const pedida = Number(body?.part)
    const usaPartes = Number.isInteger(pedida) && pedida >= 0
    if (usaPartes && pedida >= partes.length) {
        return jsonResponse(400, {
            error: "part_out_of_range",
            partes: partes.length,
        })
    }
    const esUltimaParte = !usaPartes || pedida === partes.length - 1
    const textoParte = usaPartes ? partes[pedida] : text

    /* v1.6 — carril: admin 600 u/día · miembro 60 u/día + 500 u/mes · freemium
       8 u de por vida, donde 1 unidad ≈ 1.000 caracteres. Al agotar el carril
       freemium la respuesta es el MURO (403), no un 429: el cliente abre el
       selector de Sintonía. El freno global sigue siendo 429 para todos (no es
       culpa de la persona). */
    const carril = await resolverCarril(clerkUserId)
    /* Sello del instante ANTES de reservar: acota el reembolso a la fila
       propia si la síntesis no llega a producir audio (v1.4). */
    const marcaReserva = new Date(Date.now() - 1000).toISOString()
    const gasto = await reserveSpend(
        clerkUserId,
        ip,
        carril,
        unidades(textoParte.length)
    )
    if (!gasto.ok) {
        if (carril === "free" && gasto.reason === "user_limit") {
            return jsonResponse(403, { error: "membership_required" })
        }
        return jsonResponse(429, {
            error: "rate_limited",
            /* Para que el aviso pueda decir la verdad en vez de "por hoy":
               la ventana es DESLIZANTE de 24 h, no el día de calendario. */
            scope: gasto.reason === "global_limit" ? "global" : "user",
            spent: gasto.spent,
            limit: gasto.limit,
            /* v1.6 — la ventana REAL de la que se agotó (24 h el pico diario,
               720 h el bolsón del mes), para que el aviso no mienta. */
            window_hours: gasto.windowHours ?? 24,
        })
    }

    /* ── LA ACTUACIÓN ─────────────────────────────────────────────────────
       El texto que va a Fish lleva las direcciones de interpretación; el que
       el Tripulante LEE en el chat nunca las tuvo (se arman aquí, al vuelo).
       Con el interruptor en "plana" se manda la prosa tal cual, idéntico a
       como sonaba antes de esta versión. */
    const directiva = (
        Deno.env.get("FISH_VOICE_DIRECTIVE") || DEFAULT_DIRECTIVE
    ).trim()
    const textoFinal = plana
        ? textoParte
        : dirigirVoz(textoParte, directiva, esUltimaParte)

    /* Cadencia opcional (0.5–2.0). Sin el secreto no se manda `prosody` y
       Fish usa su ritmo natural: una perilla que existe solo si se necesita. */
    const velocidad = envNumber("FISH_VOICE_SPEED", 0)
    const prosody =
        velocidad >= 0.5 && velocidad <= 2 ? { speed: velocidad } : null

    /* Una sola llamada a Fish, aislada, para poder reintentarla con la voz de
       respaldo sin duplicar el cuerpo. */
    async function sintetizar(refId: string) {
        return await fetch(FISH_TTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${FISH_KEY}`,
                "Content-Type": "application/json",
                /* 🜂 El modelo viaja en un HEADER, no en el cuerpo (docs de
                   Fish, verificado 2026-07-29). Valores: s1 · s2-pro ·
                   s2.1-pro · s2.1-pro-free. */
                model,
            },
            body: JSON.stringify({
                text: textoFinal,
                /* Sin reference_id Fish usa su voz por defecto — sirve para
                   probar que el circuito vive antes de elegir voz. */
                ...(refId ? { reference_id: refId } : {}),
                format: "mp3",
                /* 64 kbps: es voz hablada, no música. La mitad de bytes que
                   128 para el mismo oído, y la respuesta viaja más rápido. */
                mp3_bitrate: 64,
                /* 🜂 La documentación de Fish pide normalize FALSE cuando el
                   texto lleva señales de actuación: con la normalización
                   encendida puede alterarlas antes de que el modelo las lea.
                   Con la lectura plana vuelve a true (números y fechas se
                   pronuncian en palabras, como hasta ahora). */
                normalize: plana,
                latency: "normal",
                /* 🜂 v2.1 — el trozo interno más grande que Fish documenta
                   (100 a 300; default 200). Cada frontera interna es una
                   tirada de dado para un ruido raro: la mitad de fronteras es
                   la mitad de tiradas. El costo es unos ms más de primer
                   audio por parte, imperceptible contra la síntesis misma. */
                chunk_length: 300,
                /* Parámetros de generación. Los tres son los que documenta
                   Fish; temperature y repetition_penalty coinciden con su
                   default a propósito (quedan a la mano por si se afinan). */
                temperature: envNumber("FISH_TEMPERATURE", DEFAULT_TEMPERATURE),
                top_p: envNumber("FISH_TOP_P", DEFAULT_TOP_P),
                repetition_penalty: envNumber(
                    "FISH_REPETITION_PENALTY",
                    DEFAULT_REPETITION_PENALTY
                ),
                ...(prosody ? { prosody } : {}),
            }),
        })
    }

    /* 🜂 v3.0 — EL CARRIL DE SONIOX. Una sola llamada REST que devuelve los
       mismos bytes de mp3 que Fish, así que todo lo de abajo —el cobro, el
       reembolso si falla, el corte por partes, la caché del aparato— sigue
       exactamente igual. El texto va SIN las direcciones de actuación: esos
       tags son dialecto de Fish y acá se leerían en voz alta.

       Tope duro del proveedor: 5.000 caracteres por llamada. Nuestro
       segmentador ya corta en 1.400, así que ninguna parte se acerca; el
       recorte es un cinturón, no el mecanismo. */
    async function sintetizarSoniox() {
        return await fetch(SONIOX_TTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SONIOX_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: SONIOX_MODEL,
                language: lang === "en" ? "en" : "es",
                voice: cat.voz,
                audio_format: "mp3",
                text: textoParte.slice(0, 5000),
                bitrate: 64000,
                ...(cat.speed ? { speed: cat.speed } : {}),
            }),
        })
    }

    /* 🜂 v3.2 — EL CAMINO CON MARCAS, detrás de bandera. Solo se toma si el
       cliente pide `marcas: true`, así que hasta que ese cliente exista nada
       cambia para nadie. Y si el canal falla, cae al REST de siempre: la
       lectura no puede depender de una mejora del resalte. */
    const quiereMarcas = body?.marcas === true && usaSoniox
    let marcas = ""
    if (quiereMarcas) {
        const conMarcas = await sintetizarConMarcas(
            SONIOX_KEY,
            SONIOX_MODEL,
            cat.voz,
            lang === "en" ? "en" : "es",
            textoParte,
            cat.speed
        )
        if (conMarcas && conMarcas.tiempos.length) {
            marcas = marcasCompactas(conMarcas.tiempos)
            /* El cupo ya quedó reservado arriba y solo se devuelve si algo
               falla, igual que en el camino normal: no hay nada que
               confirmar acá. */
            return new Response(conMarcas.audio, {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "no-store",
                    "X-RSV-Voz": "principal",
                    "X-RSV-Proveedor": "soniox",
                    "X-RSV-Voz-Nombre": cat.voz,
                    "X-RSV-Partes": String(partes.length),
                    "X-RSV-Parte": String(usaPartes ? pedida : 0),
                    /* Un ancla cada 20 caracteres, delta en centésimas,
                       base 36. El cliente reconstruye sumando. */
                    "X-RSV-Marcas": marcas,
                    "X-RSV-Marca-Cada": String(MARCA_CADA),
                },
            })
        }
    }

    try {
        let r = usaSoniox ? await sintetizarSoniox() : await sintetizar(voiceId)
        let usoRespaldo = false

        /* 🜂 Si Soniox se cae, la lectura NO se cae con él: se reintenta por
           Fish, que sigue vivo y con saldo. Un proveedor nuevo con un día de
           vida no puede ser un punto único de falla. */
        if (usaSoniox && !r.ok && FISH_KEY) {
            r = await sintetizar(voiceId)
            usoRespaldo = true
        }

        /* Reintento con la VOZ DE RESPALDO solo si el problema es de la voz
           (4xx que no sea de llave/saldo/cuota). Un 401/402/429 se propaga tal
           cual: reintentar sería quemar otra llamada para el mismo error. */
        if (
            !r.ok &&
            vozRespaldo &&
            vozRespaldo !== voiceId &&
            r.status >= 400 &&
            r.status < 500 &&
            r.status !== 401 &&
            r.status !== 402 &&
            r.status !== 429
        ) {
            r = await sintetizar(vozRespaldo)
            usoRespaldo = true
        }

        if (!r.ok) {
            const detail = await r.text().catch(() => "")
            /* v1.4 — no sonó nada: se devuelve el cupo. */
            await refundSpend(clerkUserId, marcaReserva)
            /* Se devuelve el motivo REAL de Fish (patrón "surface del error
               real"): un 401 de llave, un 402 de saldo y un 422 de voz
               inexistente se diagnostican de un tiro, sin adivinar. */
            return jsonResponse(502, {
                error: usaSoniox && !usoRespaldo ? "soniox_tts_failed" : "fish_tts_failed",
                status: r.status,
                /* El motivo REAL del proveedor llega entero a la pantalla: un
                   nombre de voz mal escrito, una llave inválida o un tope de
                   la cuenta se diagnostican de un tiro, sin adivinar. */
                detail: detail.slice(0, 400),
                proveedor: usaSoniox && !usoRespaldo ? "soniox" : "fish",
                voz: cat.voz || voiceId,
                tried_fallback: usoRespaldo,
            })
        }

        const audio = new Uint8Array(await r.arrayBuffer())
        if (audio.length === 0) {
            await refundSpend(clerkUserId, marcaReserva)
            return jsonResponse(502, { error: "empty_audio" })
        }

        return new Response(audio, {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
                /* Para device-QA: qué voz sonó realmente, si las voces están
                   intercambiadas y si la lectura salió actuada o plana. */
                "X-RSV-Voz": usoRespaldo ? "respaldo" : "principal",
                /* 🜂 v3.0 — QUIÉN habló de verdad. Sin esto, un fallo de
                   Soniox que cae a Fish suena parecido y nadie se entera de
                   que el carril nuevo está muerto. */
                "X-RSV-Proveedor": usaSoniox && !usoRespaldo ? "soniox" : "fish",
                "X-RSV-Voz-Nombre": usaSoniox && !usoRespaldo ? cat.voz : "fish",
                "X-RSV-Voz-Swap": puedeIntercambiar ? "1" : "0",
                "X-RSV-Matiz": plana ? "plana" : "actuacion",
                /* v1.5 — cuántos trozos tiene el reflejo completo: con esto el
                   cliente sabe, ya sonando la parte 0, cuántas le faltan. */
                "X-RSV-Partes": String(partes.length),
                "X-RSV-Parte": String(usaPartes ? pedida : 0),
            },
        })
    } catch (err: any) {
        /* v1.4 — la red se cayó a media síntesis: tampoco se cobra. */
        await refundSpend(clerkUserId, marcaReserva)
        return jsonResponse(502, {
            error: "fish_unreachable",
            detail: String(err?.message ?? err).slice(0, 300),
        })
    }
})
