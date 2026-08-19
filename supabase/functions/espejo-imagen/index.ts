// Red Solar Viva · espejo-imagen v2.7 — 🜂 EL ESTILO DE LA CASA SALE DEL
// CARRIL RÁFAGA (Zak 2026-08-19: "no le pongas estilo, deja que nos dé el
// estilo… queremos poder ver la imagen completa"). El cine analógico de la
// v2.4 se retira entero: la escena que el Espejo describe viaja cruda, con
// 600 caracteres en vez de 420 (el sitio que ocupaba el estilo se lo queda
// la descripción) y lo único que se sigue prohibiendo es el TEXTO dentro de
// la imagen, que no es estética sino límite del medio. El Espejo normal ya
// iba así desde la v2.0; este carril se había quedado atrás por una razón de
// otro problema: la sombra profunda escondía los artefactos de Schnell. Si
// ahora se ven pobres, la causa es el modelo barato y la salida es subirlo,
// no volver a vestirlas de sombra. | v2.6 — 🜂 EL CARRIL CONCEPTUAL (Zak 2026-08-10, la reestructura de la Matriz): con `tipo_visual:"diagrama"` la escena se viste de esquema técnico (línea fina cian sobre azul de la casa, nodos/flechas/ciclos, sin una sola letra: los modelos escriben texto roto, así que el diagrama explica por forma y conexión). Sin la bandera, cine analógico como siempre. Mismo modelo, mismo costo, mismo cupo. | v2.5 — SIN BORDES DE NEGATIVO (Zak 2026-08-10, device-QA del cine analógico: franjas blancas laterales — el estilo de película hacía que Schnell dibujara el borde del fotograma escaneado). El prompt exige composición a sangre completa y prohíbe marcos de film/polaroid/viñeta; el cliente además recorta 4.5% (EV_Rafaga v3.5). | v2.4 — 🜂 CINE ANALÓGICO EN EL CARRIL RÁFAGA (Zak 2026-08-10): fotografía de película de 35mm, claroscuro low-key, sombras profundas, grano orgánico y paleta fría con acentos de luz indirecta. Prohibidos el render 3D, la estética Pixar, las caras sonrientes de foto de stock, la piel hiper-suavizada y la luz comercial de mediodía; como Schnell no acepta negative_prompt, cada prohibición viaja como su afirmación contraria más la negación explícita. Además de ser el sello de la casa, el low-key con grano ESCONDE los artefactos del modelo barato: donde el render limpio delata cada dedo, la sombra profunda perdona. Pro (Espejo normal) intacto. | v2.3 — ESTILO PROPIO DEL CARRIL RÁFAGA: Schnell crudo se veía "caricatura wannabe realista pero chafa" (Zak); con estilo fijo pictórico-etéreo en la paleta de la casa el modelo barato rinde su máximo y todo el modo se ve de UNA sola mano. La escena del Espejo manda (va primero); el estilo la viste. Pro (Espejo normal) intacto. | v2.2 — 🜂 CARRIL DEL MODO RÁFAGA (Zak 2026-08-09): con `modo: "rafaga"` la edge usa FLUX SCHNELL (4 pasos, ~$0.003 contra los $0.03 de Pro) y un cupo PROPIO de 30 al día, porque ese modo pide 2 o 3 imágenes por envío y con el tope del Espejo (2/día) se agotaría en el primer uso. Treinta imágenes de Schnell cuestan menos que tres de Pro. Es aditivo y con bandera: el cliente del Espejo nunca la manda, así que su camino queda idéntico — mismo modelo, mismo cupo, mismo pase del Arquitecto. | v2.1 — TOPE COMERCIAL 2/día (Zak lo selló: FLUX.2 Pro $0.03 → peor caso $1.80 USD/mes) + PASE DEL ARQUITECTO: antes de reservar se lee `ia_pase_imagen` (extras del día en curso, otorgados desde el Motor) y se suman al tope. Un pase ausente o una tabla caída devuelven 0: jamás abre el cupo, solo lo amplía. | espejo-imagen v2.0 — FLUX.2 PRO + ESCENA CRUDA (Zak): el modelo pasa de flux/schnell (~$0.003) a fal-ai/flux-2-pro ($0.03 la imagen cuadrada) y el estilo fijo de la casa MUERE: la escena que el Espejo describe viaja tal cual (acotada a 600 chars, sin corchetes) — arte libre, entornos completos, figuras si el Espejo las pide. Sin num_inference_steps (el Pro maneja el suyo). El cupo del gobernador queda como estaba (15/día) mientras Zak prueba; el tope comercial (propuesta 2/día) se materializa después. | espejo-imagen v1.0 — EL ESPEJO ILUSTRA (Zak 2026-08-05,
// "nuestra función más soñada"). Recibe UNA escena (⟦GEN⟧ cosechada por el
// cliente de la respuesta de oraculo-chat v1.19), la viste con el ESTILO FIJO
// de la casa y pide la imagen al carril FLUX rápido de fal.ai (~$0.003 USD por
// imagen 1024×1024). Devuelve la imagen como dataURL base64: el cliente la
// guarda SOLO en el device (doctrina de lo efímero: el servidor no persiste
// nada; el archivo temporal de fal expira solo).
//
// Gobernador (edge_spend_ledger, mismo patrón que espejo-voz):
//   · miembro/admin: 15 imágenes / 24 h por usuario
//   · freno global:  300 / 24 h (≈ $0.90 USD/día peor caso)
//   La telemetría del gasto por nodo lo lee automáticamente (edge LIKE
//   'espejo-imagen' entraría al grupo propio si se suma a la RPC; por ahora
//   el costo es tan bajo que viaja fuera del USD 30d).
//
// Secrets: FAL_KEY (fal.ai) + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Deploy:  supabase functions deploy espejo-imagen --no-verify-jwt

import { gateUser } from "../_shared/clerkAuth.ts"

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/* v2.1 — TOPE COMERCIAL SELLADO (Zak): 2 imágenes al día por persona.
   FLUX.2 Pro cuesta $0.03/imagen → peor caso absoluto $1.80 USD/mes (~32 MXN)
   contra los ~424 MXN netos que deja un miembro. El uso real será menor
   (nadie ilustra los 30 días). El PASE del Motor suma extras SOLO al día
   en curso y SOLO a la cuenta del Arquitecto (ver bonusDelDia). */
const USER_LIMIT_DAY = 2
const GLOBAL_LIMIT_DAY = 300
const EDGE_NAME = "espejo-imagen"
/* 🜂 v2.2 — cupo propio del Modo Ráfaga. Pide 2 o 3 imágenes por envío y usa
   Schnell (~$0.003 contra los $0.03 de Pro), así que 30 al día son unos $0.09
   USD por persona en el peor caso: diez envíos completos diarios por menos de
   lo que cuesta UNA imagen del carril del Espejo. */
const RAFAGA_LIMIT_DAY = 30
const MODELO_RAFAGA = "fal-ai/flux/schnell"
const MODELO_ESPEJO = "fal-ai/flux-2-pro"

/* ESTILO DE LA CASA — fijo, el Espejo solo emite la escena. Mantener en
   espejo con Espejo_EstiloVisual_v1.md. */
const ESTILO_BASE =
    "Ethereal cosmic visualization on pure black background (#000000). " +
    "Luminous translucent forms in cyan (#00E5FF) and warm gold (#D4A843), " +
    "glass-like surfaces with subtle thin-film iridescence, soft volumetric " +
    "glow, fine particle fields like starlight, sacred-geometry undertones, " +
    "weightless, serene, premium dark aesthetic, high detail. "
const ESTILO_CIERRE =
    " No text, no words, no letters, no watermark. No people, no faces. " +
    "Centered composition, generous negative space."

/* v2.1 — PASE DEL ARQUITECTO: extras otorgados desde el Motor (tabla
   ia_pase_imagen, un renglón por día). Devuelve 0 si no hay pase, si la
   tabla no existe todavía o si la consulta falla: un pase ausente jamás
   puede ABRIR el cupo, solo puede ampliarlo. */
async function bonusDelDia(
    supaUrl: string,
    supaKey: string,
    userKey: string
): Promise<number> {
    try {
        const hoy = new Date().toISOString().slice(0, 10)
        const r = await fetch(
            `${supaUrl}/rest/v1/ia_pase_imagen?select=extra&clerk_user_id=eq.${encodeURIComponent(
                userKey
            )}&dia=eq.${hoy}`,
            {
                headers: {
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                },
            }
        )
        if (!r.ok) return 0
        const j = await r.json().catch(() => null)
        const n = Array.isArray(j) && j[0] ? Number(j[0].extra) : 0
        return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 0
    } catch {
        return 0
    }
}

async function reservar(
    supaUrl: string,
    supaKey: string,
    userKey: string,
    /* 🜂 v2.2 — el Modo Ráfaga corre por un carril APARTE. Pide 2 o 3 imágenes
       por envío, así que con el cupo del Espejo (2 al día) se agotaría en el
       primer uso. Como usa Schnell, que cuesta ~10 veces menos que Pro, su
       techo puede ser mucho más alto por el mismo dinero. */
    carril: "espejo" | "rafaga" = "espejo"
): Promise<{ ok: boolean; reason?: string }> {
    try {
        const esRafaga = carril === "rafaga"
        const extra = esRafaga ? 0 : await bonusDelDia(supaUrl, supaKey, userKey)
        const r = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_edge: esRafaga ? `${EDGE_NAME}-rafaga` : EDGE_NAME,
                p_user_key: userKey,
                p_cost: 1,
                p_user_limit: esRafaga
                    ? RAFAGA_LIMIT_DAY
                    : USER_LIMIT_DAY + extra,
                p_user_window_seconds: 86400,
                p_global_limit: GLOBAL_LIMIT_DAY,
                p_global_window_seconds: 86400,
            }),
        })
        const j = await r.json().catch(() => null)
        if (j && j.ok === false)
            return { ok: false, reason: String(j.reason || "limit") }
        return { ok: true }
    } catch {
        /* Gobernador caído ≠ negar el servicio: fail-open con el freno de
           fal como última red (igual criterio que el resto de la casa). */
        return { ok: true }
    }
}

function b64DeBytes(bytes: Uint8Array): string {
    let bin = ""
    const paso = 0x8000
    for (let i = 0; i < bytes.length; i += paso) {
        bin += String.fromCharCode(...bytes.subarray(i, i + paso))
    }
    return btoa(bin)
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
    const jHeaders = { ...CORS, "Content-Type": "application/json" }
    const fail = (status: number, error: string, detail?: string) =>
        new Response(JSON.stringify({ error, ...(detail ? { detail } : {}) }), {
            status,
            headers: jHeaders,
        })

    let body: any = null
    try {
        body = await req.json()
    } catch {
        return fail(400, "bad_request")
    }

    /* Sesión de Clerk verificada server-side (el id sale del token). */
    const g = await gateUser(body?.token)
    if (!g.ok) return fail(401, "auth_required")
    const clerkUserId = g.userId!

    const escena = String(body?.escena || "").trim()
    if (!escena || escena.length < 8) return fail(400, "escena_vacia")

    const falKey = Deno.env.get("FAL_KEY")
    if (!falKey) return fail(500, "config", "falta el secret FAL_KEY")

    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    /* 🜂 v2.2 — el Modo Ráfaga del escritorio pide su carril con esta bandera.
       El cliente del Espejo NUNCA la manda, así que su camino queda idéntico:
       mismo modelo, mismo cupo, mismo pase del Arquitecto. */
    const esRafaga = body?.modo === "rafaga"

    if (supaUrl && supaKey) {
        const res = await reservar(
            supaUrl,
            supaKey,
            clerkUserId,
            esRafaga ? "rafaga" : "espejo"
        )
        if (!res.ok)
            return fail(429, "cupo", res.reason || "limit")
    }

    /* v2.0 — SIN ESTILO DE LA CASA (Zak: "el Espejo ya está en completa
       sintonía, él nos dará los visuales indicados"): la escena del Espejo
       viaja CRUDA al modelo, solo acotada en largo y sin corchetes.
       🜂 v2.4 — EXCEPTO EN EL CARRIL RÁFAGA, que ahora es CINE ANALÓGICO
       (Zak 2026-08-10). El estilo pictórico-etéreo de la v2.3 se retira: la
       imagen que volvió del device-QA era una foto de stock luminosa, con
       piel de plástico y luz comercial de mediodía — lo contrario de la casa.
       El sello nuevo es fotografía de película de 35mm: claroscuro, sombras
       profundas, grano orgánico y paleta fría con acentos de luz indirecta.
       Y no es solo estética: el low-key con grano es justo lo que ESCONDE
       los artefactos de un modelo barato — donde el render limpio delata a
       Schnell en cada dedo y cada poro, la sombra profunda perdona.
       La escena del Espejo va primero (el contenido manda); el estilo la
       viste. En Pro (el Espejo normal) nada cambia. */
    /* 🜂 v2.6 — EL CARRIL CONCEPTUAL (Zak: "la derecha debe hacer ENTENDER,
       no decorar"). Cuando el reflejo es explicativo, el Espejo pide un
       DIAGRAMA en vez de una escena: esquema de líneas limpias sobre el azul
       de la casa, nodos, flechas, partes y ciclos. Sin palabras adentro: los
       modelos de imagen escriben texto roto, así que el diagrama comunica por
       FORMA y relación, no por etiquetas. */
    const ESTILO_DIAGRAMA =
        "minimal technical concept diagram, clean thin line art on deep navy " +
        "blue background, cyan lines with sparse warm gold accents, nodes " +
        "arrows cycles and layered parts, blueprint schematic aesthetic, " +
        "generous negative space, precise geometry, glowing edges, flat " +
        "2D vector style. Abstract relational diagram that explains by shape " +
        "and connection alone: no text, no letters, no numbers, no labels, " +
        "no words, no watermark, no photorealism, no people"
    /* ═══════════════════════════════════════════════════════════════════
       🜂 v2.7 — EL ESTILO DE LA CASA SE RETIRA DEL CARRIL RÁFAGA
       ═══════════════════════════════════════════════════════════════════
       Zak, 2026-08-19: "quitar el estilo ese como de película, no le pongas
       estilo, deja que nos dé el estilo… lo mejor es no dar ningún estilo y
       dejar que él decida. Queremos poder ver la imagen completa."

       Y es coherente con lo que ya pasó en el Espejo normal: su estilo fijo
       murió en la v2.0 por la misma razón ("el Espejo ya está en completa
       sintonía, él nos dará los visuales indicados"). El carril de la Matriz
       se quedó atrás por una razón que era de OTRO problema: el claroscuro
       low-key con grano se eligió en la v2.4 tanto por sello como porque la
       sombra profunda ESCONDE los artefactos de un modelo barato. Esconder
       defectos con oscuridad tiene un precio, y el precio era justamente lo
       que Zak nombró: la imagen no se ve entera.

       🜂 LO QUE SOBREVIVE NO ES ESTILO, ES EL MEDIO. Se prohíbe solo el texto
       dentro de la imagen, y no por gusto: los modelos de difusión escriben
       letras rotas, y eso ya costó el retiro completo del carril de diagrama
       (etiquetas alucinadas tipo "Rendermesiio", idénticas en Schnell y en
       Pro). Todo lo demás —luz, paleta, técnica, encuadre, si es foto o
       pintura— lo decide el Espejo escena por escena.

       ⚠️ Si las imágenes vuelven a verse pobres, la causa NO será la falta de
       estilo: será Schnell, que es el modelo barato de este carril (Zak lo
       describió crudo en la v2.3 como "caricatura wannabe realista pero
       chafa"). La salida entonces es subir de modelo, no volver a vestirlas
       de sombra. */
    const ESTILO_RAFAGA = "no text, no letters, no numbers, no watermark"
    /* v2.6 — el cliente declara el tipo del visual: "diagrama" viste con el
       carril conceptual; cualquier otra cosa (o nada) es la escena de cine
       de siempre. Solo existe dentro del carril de la Matriz. */
    const esDiagrama = esRafaga && body?.tipo_visual === "diagrama"
    /* 🜂 v2.7 — la escena de la Matriz respira igual que la del Espejo (600):
       los 420 de antes eran para hacerle sitio al estilo, que ya no viaja. Lo
       que gana ese espacio es la descripción del propio Espejo, que es
       exactamente a quien se le devolvió la decisión. */
    const prompt = esRafaga
        ? `${escena.slice(0, 600).replace(/[⟦⟧]/g, "")} — ${
              esDiagrama ? ESTILO_DIAGRAMA : ESTILO_RAFAGA
          }`
        : escena.slice(0, 600).replace(/[⟦⟧]/g, "")

    try {
        const r = await fetch(
            `https://fal.run/${esRafaga ? MODELO_RAFAGA : MODELO_ESPEJO}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Key ${falKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    image_size: "square_hd",
                    num_images: 1,
                    enable_safety_checker: true,
                    /* Schnell está afinado para 4 pasos: más no mejora y sí
                       cuesta reloj, que es justo lo que este modo no gasta.
                       Pro maneja el suyo, así que ahí no se manda. */
                    ...(esRafaga ? { num_inference_steps: 4 } : {}),
                }),
            }
        )
        if (!r.ok) {
            const txt = await r.text().catch(() => "")
            return fail(502, "fal", txt.slice(0, 300))
        }
        const j = await r.json().catch(() => null)
        const url = j?.images?.[0]?.url
        if (typeof url !== "string" || !url.startsWith("http"))
            return fail(502, "fal", "sin url en la respuesta")

        /* La imagen vuelve como bytes → dataURL: nada queda en el servidor y
           el cliente no depende de que el archivo temporal de fal viva. */
        const ir = await fetch(url)
        if (!ir.ok) return fail(502, "fal", "descarga fallida")
        const mime = ir.headers.get("content-type") || "image/jpeg"
        const bytes = new Uint8Array(await ir.arrayBuffer())
        if (!bytes.length) return fail(502, "fal", "imagen vacia")
        const b64 = `data:${mime};base64,${b64DeBytes(bytes)}`

        return new Response(JSON.stringify({ b64 }), { headers: jHeaders })
    } catch (e) {
        return fail(502, "fal", String((e as any)?.message || e).slice(0, 200))
    }
})
