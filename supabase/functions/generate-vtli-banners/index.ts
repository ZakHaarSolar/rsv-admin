// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/generate-vtli-banners/index.ts v1.5
// v1.5 — AUDITORÍA PARTE 4 — gobernador de gasto reserve_edge_spend (Gemini
//        texto + Nano Banana imagen). Cota por-usuario 20/día + global 60/día,
//        en el choke point único justo después del gate — cubre retry_image_
//        only, reroll_format_only Y el batch/reroll de concepto por igual.
// v1.4 — Ola C #3 Fase 3: token de Clerk requerido; sin fallback admin_clerk_id.
// ---------------------------------------------------------------
// Atelier de Marketing — motor de generación de BANNERS para Meta Ads
// Instagram VTLI Cancún. Universo paralelo al generador de posts
// orgánicos.
//
// v1.3 — 2026-05-27 — FIX RACE CONDITION REROLL FORMATO.
//   Bug reportado Zak: al picar "↻ Reroll formato" en un card, la
//   UI mostraba "Materializando" por 1 segundo y volvía a la imagen
//   anterior aunque el reroll seguía corriendo en background.
//
//   Causa raíz: el v1.2 hacía PATCH del banner (image_r2_url=null +
//   status=draft + prompt_visual=new) DESPUÉS de llamar a Gemini
//   text. Esa llamada toma ~2 segundos. Durante esa ventana, el
//   polling unificado del frontend (cada 4s) leía la DB con la
//   imagen vieja todavía persistida y el merger sobrescribía el
//   reset optimista del state con la imagen vieja.
//
//   Fix: invertir el orden. PATCH inicial inmediato con
//   image_r2_url=null + status=draft + reviewed_at=null ANTES de
//   llamar a Gemini text. Cerrar la ventana de race condition. Si
//   Gemini text falla, marcar el banner como rejected (UI muestra
//   "Imagen falló" con botón de reintentar). Si OK, segundo PATCH
//   solo con prompt_visual nuevo + dispatch del background.
//
//   El modo retry_image_only_for_banner_id ya hacía esto bien
//   desde v1.0 — no se tocó.
//
// v1.2 — 2026-05-27 — ANTI-BUG STORIES + REROLL FORMATO ÚNICO.
//   Caso Zak 2026-05-27: el primer banner Telekinesis generó un feed
//   4:5 PERFECTO (paleta cremosa, hook dorado, geometría etérea) pero
//   el Stories 9:16 del mismo concepto salió FUERA DE PALETA:
//   gradient horizonte gris-azulado oscuro, hook en blanco (en lugar
//   de dorado), safe area superior como cielo plano sin geometría
//   sutil. Cuatro afinaciones críticas al system prompt sección IV
//   stories_9x16 para que los 2 formatos del mismo concepto MANTENGAN
//   coherencia visual:
//   · Paleta OBLIGATORIA pastel cremoso claro (NO horizonte oscuro,
//     NO cielo profundo nocturno). Mismo nivel de luminosidad que el
//     feed 4:5 — atmósfera amanecer suave.
//   · Hook color dorado SUAVE obligatorio (#D4A843 aprox). NUNCA
//     blanco — mantiene consistencia con el feed 4:5 del mismo
//     concepto.
//   · Safe area superior (250px) con line-art tenue al 20% opacity
//     del mismo motif central. NO dejar como cielo plano.
//   · Composición SIN línea horizonte. Background wash uniforme con
//     geometría sagrada flotando libremente.
//
//   Modo nuevo "reroll_format_only_for_banner_id": dado un banner_id,
//   regenera SOLO el prompt_visual de su formato manteniendo
//   concept_id/hook/subtext/cta/target/aha/pulso/category intactos.
//   Caso de uso: te encantó el feed 4:5 pero el Stories del mismo
//   concepto salió mal — picás "Reroll formato" en el card Stories y
//   te genera UN nuevo prompt_visual para ese formato preservando el
//   hook + identidad conceptual. Costo: ~$0.07 USD/reroll (1 imagen).
//   Distinto a "reroll_of_concept_id" que sí regenera todo el
//   concepto desde cero (nuevo hook, 2 banners nuevos).
//
// v1.1 — 2026-05-27 — PIVOTE A 2 FORMATOS INSTAGRAM + LENGUAJE COLD.
//   Cambios estratégicos discutidos con Zak:
//   · Eliminado Facebook landscape — la publicidad va SOLO a
//     Instagram (Cancún + Riviera Maya, geo-targeted).
//   · feed_square (1:1) reemplazado por feed_portrait (4:5
//     1080×1350) que es el formato más vertical que Instagram
//     permite sin cropping. 3:4 strict (1080×1440) que Zak
//     sugirió originalmente se cropearía automáticamente a 4:5
//     perdiendo ~6% del CTA inferior — por eso 4:5 es la elección
//     canónica.
//   · "Visión Solar" eliminada del lenguaje de banners. Es léxico
//     INTERNO del ecosistema (orgánico, audiencia ya iniciada).
//     En cold audiences de Meta Ads la gente busca "Visión Extra
//     Ocular" o "VEO" — esos son los puentes válidos al exterior.
//     Sección V del system prompt actualizada con regla estricta.
//   · CTA URL ahora se genera con UTM tags automáticos para
//     tracking de ganadoras en Meta Ads Manager + Analytics.
//     Formato: veotuluzinterna.com/?utm_source=instagram&utm_medium=
//     paid&utm_campaign=vtli_<pilar>&utm_content=<concept_id>_<format>.
//   · Texto monoespaciado de CTA URL: paleta VTLI dorada suave
//     (no cyan — eso rompía la paleta pastel canónica).
//
// Por click: 1 concepto creativo materializado en 2 formatos canónicos:
//   · feed_portrait · 1080×1350 (4:5) · feed Instagram
//   · stories_9x16  · 1080×1920 (9:16) · Stories + Reels static
//
// Los 2 formatos comparten concept_id (UUID), category, hook, subtext,
// cta_label, cta_url (con UTMs específicos por formato), pulso_nucleo,
// aha_moment. Cada formato tiene su propio prompt_visual ajustado al
// aspect ratio e image_r2_url propio.
//
// Costo por click: 2 imágenes × $0.067 USD = ~$0.13 USD/concepto.
// Budget Fase 1: 8-12 clicks (2-3 conceptos × 4 pilares) = $1.07-1.61
// USD para tener arsenal completo de 16-24 banners Instagram.
//
// Stack: idéntico a generate-vtli-posts v3.4
//   · Gemini 3.5 Flash (copy creativo, JSON output)
//   · Nano Banana 2 (gemini-3.1-flash-image-preview, 1080p)
//   · Cloudflare R2 (Sig V4 manual, zero-dep)
//   · Supabase Edge waitUntil() pattern async
//
// Endpoints lógicos:
//   1) Batch: POST { admin_clerk_id, category } → 3 banners (1 concepto × 3 formatos)
//   2) Reroll de concepto: POST { admin_clerk_id, reroll_of_concept_id }
//      → 3 banners nuevos (nuevo concepto), padres marcados rerolled
//   3) Retry image only: POST { admin_clerk_id, retry_image_only_for_banner_id }
//      → regenera la imagen de UN banner reusando prompt_visual
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy generate-vtli-banners --no-verify-jwt

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

/* AUDITORÍA PARTE 4 · gobernador de gasto. Gemini texto + Nano Banana imagen
   son API de pago y esta edge no tenía ninguna cota más allá de la sesión
   de admin. Reusa la RPC reserve_edge_spend (mismo gobernador de la ola E /
   Parte 3, ver upload-matter-photo). Fail-open a propósito: si la RPC no
   responde, la operación sigue (nunca rompe un banner legítimo). Sin
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

const GEMINI_TEXT_MODEL = "gemini-3.6-flash"
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
const GEMINI_TEXT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`
const GEMINI_IMAGE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`

const MAX_RETRIES_TEXT = 5
const MAX_RETRIES_IMAGE = 3
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000]
const GEMINI_IMAGE_TIMEOUT_MS = 60_000

const PULSO_HISTORY_LIMIT = 10

// Set canónico de categorías VTLI válidas (los 4 pilares).
const VALID_CATEGORIES = new Set([
    "veo",
    "telekinesis",
    "calibracion",
    "sintonia",
])

// v1.1: 2 formatos canónicos (Instagram only — sin Facebook). El
// feed_square (1:1) y fb_landscape (1.91:1) del v1.0 quedan
// retirados; cualquier banner viejo en DB con esos formatos sigue
// siendo válido pero no se generan más.
const BANNER_FORMATS = ["feed_portrait", "stories_9x16"] as const
type BannerFormat = (typeof BANNER_FORMATS)[number]

const FORMAT_DIMENSIONS: Record<BannerFormat, string> = {
    feed_portrait: "1080×1350 vertical 4:5 (Instagram feed máximo permitido)",
    stories_9x16: "1080×1920 vertical 9:16",
}

const FORMAT_LAYOUT_GUIDE: Record<BannerFormat, string> = {
    feed_portrait:
        "Composición VERTICAL 4:5 (1080×1350) para feed de Instagram. Es el aspect ratio más alto que Instagram acepta sin cropping. Hook en el tercio superior con tipografía sans-serif gruesa grande (45-65pt). Subtext debajo (sans-serif fina, blanco). Imagen visual al centro (siluetas etéreas, geometría sagrada, paleta VTLI pastel). CTA al pie como rectángulo con sombra suave (fondo blanco semitransparente, texto cta_label dorado suave). URL en monoespaciada dorada tenue al pie debajo del CTA. Sin margen exterior, sin watermark. Pensada para el grid mental vertical del feed Instagram.",
    stories_9x16:
        "Composición VERTICAL 9:16 (1080×1920) para Stories + Reels static. SAFE AREAS CRÍTICAS: dejar margen superior de 250px libre (visual sutil sin texto — placeholder donde Instagram pone el username y los avatares). Dejar margen inferior de 300px libre (donde Instagram pone el sticker CTA + el campo de respuesta DM). Hook en el SEGUNDO tercio (debajo del safe area superior). Subtext justo debajo del hook. Imagen central de siluetas etéreas / geometría sagrada. CTA + URL en el TERCER tercio (encima del safe area inferior). Mantener la paleta VTLI exacta (azul-cielo grisáceo, blancos cremosos, dorado suave). Pensada para inmersión vertical full-screen.",
}

/* ═══════════════════════════════════════════════════════════════
   2. KNOWLEDGE BASE — "DIRECTOR CREATIVO DE ADS"
   ═══════════════════════════════════════════════════════════════ */

const VTLI_DIRECTOR_SYSTEM = `Eres el "Director Creativo de Ads", el motor de IA detrás del Atelier de Banners Publicitarios de Veo Tu Luz Interna (VTLI). Tu función es materializar banners ad-ready para Meta Ads (Facebook + Instagram) geo-targeted a Cancún y Riviera Maya. Operas con voz directa, imperativa y enfocada en conversión inmediata — distinta a la voz contemplativa de los posts orgánicos del feed.

---

### I. EL CÓDICE: BASE DE CONOCIMIENTO VTLI

Los 4 pilares presenciales en Cancún:

1. Visión Extra Ocular (VEO) / Visión Solar: hardware sensorial latente para percibir el campo unificado de información antes de que la luz física llegue a la retina. Niños lo conservan al 100%. Activación 1:1 en sesiones presenciales.

2. Telekinesis: resonancia de fase del toroide biológico con la red atómica de un objeto (péndulo de aluminio). No es trucos: es la materialización visible del campo electromagnético en coherencia.

3. Calibración Biológica: auditoría del hardware. Purga interferencias térmicas (aceites industriales, desmineralización, deshidratación celular). Reestructura conductividad interna con hidratación H3O2, recarga mineral, anclaje magnético. Devuelve al avatar a superconductividad natural.

4. Sintonía de Núcleo: bypass cuántico hacia el Ser Superior. Apaga el ruido de la mente analítica. NO es canalización externa, es acceso a la propia base de datos universal. Erradica la duda y la dependencia a gurús.

Ubicación: Cancún + Riviera Maya. Templo de sesiones 1:1 con matriz de solo 8 espacios semanales. Sitio: veotuluzinterna.com.

---

### II. DIFERENCIA RADICAL: ORGÁNICO vs PUBLICITARIO

Tu output NUNCA debe sonar como los posts orgánicos del feed VTLI. La voz es OTRA:

| Orgánico (feed) | Publicitario (este motor) |
|---|---|
| Frase Dancing Script poética | Hook 3-7 palabras sans-serif gruesa |
| Contemplativo, soberano | Imperativo, conversión-driven |
| Cierre 📍 + 👇🏼 | CTA visible: "Reservá tu sesión" |
| Sin URL visible | URL "veotuluzinterna.com" al pie |
| Largo, 70-150 palabras | Mínimo: hook + subtext + CTA + URL |

El visitor de Meta Ads NO te conoce. Hace scroll a 200ms/post. Necesita decodificar QUÉ + POR QUÉ + CÓMO ACTÚO en 1.5 segundos. Diseñá para ese contexto.

---

### III. ANATOMÍA DEL BANNER

Cada banner es UN concepto creativo en 2 formatos canónicos (feed_portrait 4:5 + stories_9x16). Componentes:

· **hook**: 3-7 palabras grandes overlay sans-serif gruesa. Verbo imperativo o promesa concreta. Ejemplos válidos por pilar:
  - VEO: "Visión Extra Ocular en Cancún", "Aprende a leer con los ojos vendados", "Activa tu Visión Extra Ocular", "VEO presencial en Cancún", "Visión sin los ojos físicos"
    ⚠ NO USAR "Visión Solar" en hooks de banners — es lenguaje INTERNO orgánico. Usar "Visión Extra Ocular" o el acrónimo "VEO" como puente al exterior (la gente cold busca esos términos en Google y los reconoce, NO conoce "Visión Solar").
  - Telekinesis: "Mueve materia sin tocarla", "El péndulo te espera", "Activa tu Telekinesis", "Telekinesis presencial en Cancún", "Mueve aluminio con tu campo"
  - Calibración: "Calibra tu hardware biológico", "Purga la estática del cuerpo", "Auditoría biológica en Cancún", "Devuelve al cuerpo su frecuencia"
  - Sintonía: "Bypass al Ser Superior", "Sintoniza tu núcleo", "Erradica la duda", "Acceso al Punto Cero", "Antena interior calibrada"
  Lo que NO va en hook: frases Dancing Script poéticas, metáforas largas, preguntas retóricas, signos de exclamación.

· **subtext**: línea geo-local fija o variante mínima. Cánones aceptados:
  - "Cancún · Sesiones presenciales 1:1"
  - "Cancún + Riviera Maya · Templo presencial"
  - "Domo Cancún · Solo 8 lugares semanales"
  Mantiene anclaje territorial inmediato.

· **cta_label**: imperativo corto, 2-4 palabras. Ejemplos: "Reserva tu sesión", "Conoce los 4 pilares", "Bloquea tu espacio", "Activa tu sesión", "Agenda hoy mismo".

· **cta_url**: SIEMPRE "veotuluzinterna.com" (sin protocolo, sin UTM tags — los UTM tags se concatenan en el backend después de generar el banner para tracking en Meta Ads + Analytics).

· **aha_moment**: el cortocircuito lógico que detona el ad. Una frase, no aparece en el visual.

· **pulso_nucleo**: resumen de UNA oración (máx 25 palabras) del concepto. Va a memoria anti-repetición.

· **target**: descripción de la audience target. Una frase. Influye en el copy pero no aparece en el visual.

---

### IV. CONTRATO DE SALIDA (JSON OUTPUT)

Tu respuesta es UN JSON con UN concepto creativo + 2 prompts visuales (uno por formato canónico Instagram). Sin texto fuera del JSON, sin fences markdown, sin texto introductorio.

{
  "concept": {
    "target": "Descripción del visitor target (1 frase)",
    "aha_moment": "El cortocircuito conceptual que detona el ad (1 frase)",
    "hook": "3-7 palabras hook overlay grande",
    "subtext": "Cancún · Sesiones presenciales 1:1",
    "cta_label": "Reserva tu sesión",
    "cta_url": "veotuluzinterna.com",
    "pulso_nucleo": "Resumen 1 oración del concepto (máximo 25 palabras)",
    "formats": {
      "feed_portrait": {
        "prompt_visual": "Instrucciones EN ESPAÑOL para Nano Banana 2 del banner VERTICAL 4:5 (1080×1350) para feed Instagram. Paleta VTLI pastel exacta (azul-cielo grisáceo, blancos cremosos, dorado suave). Estilo line-art delicado + geometría sagrada sutil + atmósfera etérea. Hook en el TERCIO SUPERIOR con sans-serif GRUESA grande (45-65pt), color dorado suave o blanco según fondo, una a dos líneas máximo. Subtext debajo del hook (sans-serif fina, color blanco al 85%). Imagen visual al CENTRO (siluetas etéreas, geometría sagrada del pilar, paleta VTLI). Botón CTA en el TERCIO INFERIOR (rectángulo redondeado con sombra suave, fondo blanco semitransparente al 90%, texto cta_label en dorado suave bold). URL en línea final centrada al pie en tipografía MONOESPACIADA DORADA TENUE (no cyan — mantener la paleta VTLI cálida). Aspect ratio 4:5 explícito, sin marcos exteriores, sin watermarks, sin logos de redes. 80-180 palabras."
      },
      "stories_9x16": {
        "prompt_visual": "Instrucciones EN ESPAÑOL para Nano Banana 2 del banner VERTICAL 9:16 (1080×1920) para Stories Instagram + Reels static. REGLAS CRÍTICAS DE PALETA Y COMPOSICIÓN (anti-bug 2026-05-27): (1) Paleta IDÉNTICA al feed 4:5 del mismo concepto — fondo PASTEL CREMOSO CLARO con tintes de azul-cielo grisáceo MUY suaves, atmósfera amanecer luminoso. PROHIBIDO usar gradient horizonte oscuro, gris-azulado saturado, cielo profundo nocturno o cualquier fondo más oscuro que el feed 4:5. La luminosidad del banner DEBE coincidir con el feed 4:5. (2) Hook color DORADO SUAVE obligatorio (#D4A843 aproximado, mismo dorado que el CTA y la URL). NUNCA renderizar el hook en blanco — el blanco rompe consistencia con el feed 4:5 del mismo concepto. Sans-serif gruesa grande (60-80pt para que respire en 9:16). (3) Composición SIN línea horizonte. NO dividir el banner en cielo arriba + suelo abajo. El background es un WASH UNIFORME cremoso con la geometría sagrada del pilar flotando libremente. (4) Safe area superior 250px: NO dejar como cielo plano vacío. Llenar con line-art DELICADO al 20% opacity del mismo motif central (péndulo, toroide, esferas, hojas etéreas — lo que aplique al pilar), MUY tenue pero presente, sin texto. SAFE AREAS: 250px superiores y 300px inferiores libres de elementos críticos (Instagram pone username arriba y sticker CTA abajo). Hook en el SEGUNDO tercio. Subtext justo debajo del hook (sans-serif fina, blanco al 85%). Geometría sagrada del pilar al centro. CTA en el TERCER tercio (rectángulo redondeado con sombra suave, fondo blanco semitransparente al 90%, texto cta_label dorado bold). URL en monoespaciada DORADA TENUE al pie. Aspect ratio 9:16 explícito, sin marcos exteriores, sin watermarks. 120-220 palabras (más extenso porque las 4 reglas críticas requieren detalle)."
      }
    }
  }
}

REGLAS DE SALIDA ABSOLUTAS:
1. La respuesta es EXCLUSIVAMENTE el JSON. Nada antes, nada después.
2. NO uses fences markdown.
3. UN solo objeto concept con UN solo bloque formats.
4. Los 2 keys del bloque formats DEBEN ser exactamente: feed_portrait, stories_9x16. Ya NO se genera fb_landscape (publicidad solo Instagram).
5. cta_url siempre "veotuluzinterna.com" (los UTM tags se concatenan automáticamente después; no los incluyas en el JSON).
6. hook con tipografía sans-serif gruesa (NUNCA Dancing Script — eso es para feed orgánico).
7. URL al pie en tipografía MONOESPACIADA DORADA TENUE (no cyan — mantiene la paleta VTLI cálida).
8. NUNCA inventar testimonios. Si necesitas voz humana, deja el visual abstracto.
9. NUNCA mencionar precios en pesos ni redsolarviva.com en banners VTLI.
10. Cada prompt_visual debe especificar EXPLÍCITAMENTE el aspect ratio (4:5 / 9:16) y las safe areas correspondientes.
11. NUNCA usar "Visión Solar" en el hook overlay del visual de VEO — usar "Visión Extra Ocular" o "VEO" como puente cold al exterior.
12. CONSISTENCIA VISUAL OBLIGATORIA entre feed_portrait y stories_9x16 del MISMO concepto: misma paleta exacta, misma luminosidad, mismo color dorado del hook, mismo motif central (péndulo + toroide para Telekinesis, antifaz + ojo para VEO, etc), mismo style line-art. Lo único que cambia entre los 2 prompts es la COMPOSICIÓN (proporciones, safe areas, ubicación de los elementos). Si el feed 4:5 tiene fondo pastel cremoso, el stories DEBE tener fondo pastel cremoso (no horizonte oscuro). Si el feed tiene hook dorado, el stories DEBE tener hook dorado (no blanco). Generá ambos prompts pensando en una pieza UNIFICADA que el visitor reconoce como "del mismo ad" aunque vea uno solo de los dos.

---

### V. REGLAS POR PILAR (overlay y composición)

⚠ REGLA CRÍTICA DE LENGUAJE COLD: los hooks de BANNERS se dirigen a audience que NO conoce VTLI. Usá términos que la gente reconoce desde afuera, NUNCA jerga interna del ecosistema.

- VEO: imágenes asociadas a antifaz blanco, ojos cerrados con luz interna, niños percibiendo más allá del ojo, antena interior. **Lenguaje cold OBLIGATORIO**: "Visión Extra Ocular" o el acrónimo "VEO". **PROHIBIDO** en banners: "Visión Solar" (eso es jerga interna del ecosistema que la gente cold NO reconoce — la audience busca "visión extra ocular" en Google y reconoce VEO por las videos virales de niños vendados, no "Visión Solar"). Hook overlay debe SIEMPRE incluir "Visión Extra Ocular" o "VEO" como puente. NUNCA escribir "Telekinesis" / "Calibración Biológica" / "Sintonía de Núcleo" en el visual.

- TELEKINESIS: péndulos de aluminio, papel parpadeando entre onda y partícula, manos en gesto sin tocar objetos, toroide energético. Hook overlay menciona "Telekinesis" (palabra cold-reconocible), movimiento de materia, resonancia, péndulo. NUNCA "VEO" / "Visión Extra Ocular" / "Calibración" / "Sintonía" en el visual.

- CALIBRACIÓN BIOLÓGICA: agua estructurada H3O2 luminosa, geometría hexagonal mineral, anatomía energética estilizada, sistema digestivo limpio en gradient. Hook overlay menciona "Calibración Biológica" (término reconocible cold-friendly), purga, hardware del cuerpo, anclaje magnético. NUNCA "Telekinesis" / "VEO" / "Sintonía" en el visual.

- SINTONÍA DE NÚCLEO: figura meditando con esfera dorada en el centro del pecho, antena dorada saliendo de la coronilla, espejo cristalino fragmentando luz, punto cero. Hook overlay menciona "Sintonía de Núcleo", "Bypass al Ser Superior", "Punto Cero", "Antena interior" (términos que comunican beneficio claro a cold audience). NUNCA "Telekinesis" / "VEO" / "Calibración" en el visual.

---

### VI. EVITAR LO PROHIBIDO

- NO uses preguntas retóricas de marketing ("¿Sabías qué?", "¿Querés saber...?").
- NO uses signos de exclamación.
- NO uses palabras vacías como "mágico", "increíble", "secreto", "apúrate".
- NO inventes urgencia falsa ("Últimos 2 lugares") salvo que el target lo justifique.
- NO uses emojis comerciales en exceso.
- NO mezcles nombres de los otros 3 pilares dentro del visual de un pilar.
`

/* ═══════════════════════════════════════════════════════════════
   3. USER PROMPT BUILDER — con memoria pulso_nucleo
   ═══════════════════════════════════════════════════════════════ */

function buildUserPrompt(
    category: "veo" | "telekinesis" | "calibracion" | "sintonia",
    recentPulsos: string[]
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

HISTORIAL RECIENTE DE BANNERS (REGLA ESTRICTA):
Estos son los pulsos conceptuales de los banners recientes de la misma categoría. EL CONCEPTO NUEVO DEBE SER CONCEPTUALMENTE DISTINTO a todos los anteriores — explora un ángulo, hook y target nuevos:

${recentPulsos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
    }

    return `Generá UN concepto creativo de banner publicitario para la categoría: ${categoryLabel}.${pulsosBlock}

El concepto se materializa en los 2 formatos canónicos de Instagram (feed_portrait, stories_9x16). Devolvé estrictamente el JSON según el contrato definido en tu sistema (objeto concept con bloque formats de 2 keys exactos). Sin texto adicional fuera del JSON.`
}

// v1.2: prompt para regenerar SOLO el prompt_visual de UN formato
// manteniendo el concepto cerrado (hook, subtext, cta, target, aha,
// pulso). Output JSON minimal con un solo prompt_visual.
function buildRerollFormatPrompt(
    existingBanner: {
        category: string
        banner_format: string
        target: string
        hook: string
        subtext: string
        cta_label: string
        cta_url: string
        aha_moment: string
        pulso_nucleo: string | null
    }
): string {
    const categoryLabel = (() => {
        switch (existingBanner.category) {
            case "veo":
                return "Visión Extra Ocular (VEO)"
            case "telekinesis":
                return "Telekinesis"
            case "calibracion":
                return "Calibración Biológica"
            case "sintonia":
                return "Sintonía de Núcleo"
            default:
                return existingBanner.category
        }
    })()
    const formatLabel = (() => {
        switch (existingBanner.banner_format) {
            case "feed_portrait":
                return "feed_portrait (1080×1350 vertical 4:5 para feed Instagram)"
            case "stories_9x16":
                return "stories_9x16 (1080×1920 vertical 9:16 para Stories Instagram)"
            default:
                return existingBanner.banner_format
        }
    })()

    return `Te entrego un concepto creativo VTLI que YA está cerrado (hook, subtext, CTA, target, aha, pulso ya definidos por el equipo). Tu único trabajo es generar UN NUEVO prompt_visual para el formato "${formatLabel}" de este banner, manteniendo TODA la identidad conceptual intacta.

CONCEPTO CERRADO (NO modificar):
- Categoría: ${categoryLabel}
- Target: ${existingBanner.target}
- Hook overlay: "${existingBanner.hook}"
- Subtext fijo: "${existingBanner.subtext}"
- CTA label: "${existingBanner.cta_label}"
- CTA URL visible: "veotuluzinterna.com"
- Aha moment: ${existingBanner.aha_moment}
- Pulso nucleo: ${existingBanner.pulso_nucleo ?? "(sin pulso)"}

Generá UN NUEVO prompt_visual para el formato "${formatLabel}" siguiendo todas las reglas de tu system prompt (sección IV contrato JSON + sección V regla por pilar + reglas absolutas 1-12, especialmente la regla 12 de CONSISTENCIA VISUAL entre formatos — la paleta, luminosidad, color dorado del hook y el motif central deben ser consistentes con un eventual feed_portrait del mismo concepto, no inventar paleta o composición que se aleje del estilo VTLI canónico).

Devolvé estrictamente este JSON minimal (sin texto antes o después, sin markdown):

{
  "prompt_visual": "Instrucciones completas EN ESPAÑOL para Nano Banana 2 del banner ${formatLabel} con el hook overlay '${existingBanner.hook}', subtext '${existingBanner.subtext}', CTA '${existingBanner.cta_label}', URL veotuluzinterna.com al pie. 100-220 palabras detalladas. Cumplir TODAS las reglas de paleta + composición + safe areas + dorado en hook + sin línea horizonte (regla anti-bug Stories del v1.2)."
}`
}

async function callGeminiTextForRerollFormat(
    apiKey: string,
    userPrompt: string
): Promise<string> {
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
                        parts: [{ text: VTLI_DIRECTOR_SYSTEM }],
                    },
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: userPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.92,
                        topP: 0.95,
                        maxOutputTokens: 2500,
                        responseMimeType: "application/json",
                    },
                }),
            })

            if (!res.ok) {
                const errBody = await res.text()
                if (res.status >= 500 && attempt < MAX_RETRIES_TEXT - 1) {
                    await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                    continue
                }
                throw new Error(
                    `Gemini reroll format ${res.status}: ${errBody.slice(0, 500)}`
                )
            }

            const data = await res.json()
            const text =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
            if (!text) throw new Error("Gemini reroll format: respuesta vacía")

            // Parse minimal JSON con solo prompt_visual
            let cleaned = text.trim()
            if (cleaned.startsWith("```")) {
                cleaned = cleaned
                    .replace(/^```(?:json)?\s*/i, "")
                    .replace(/```\s*$/i, "")
            }
            const firstBrace = cleaned.indexOf("{")
            const lastBrace = cleaned.lastIndexOf("}")
            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("Sin braces en reroll format response")
            }
            const jsonStr = cleaned.slice(firstBrace, lastBrace + 1)
            const parsed = JSON.parse(jsonStr)
            const newPrompt = parsed?.prompt_visual
            if (!newPrompt || typeof newPrompt !== "string") {
                throw new Error("Sin prompt_visual en reroll format response")
            }
            return newPrompt
        } catch (err) {
            lastErr = err
            if (attempt < MAX_RETRIES_TEXT - 1) {
                await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                continue
            }
        }
    }
    throw lastErr ?? new Error("Gemini reroll format: agotado retries")
}

/* ═══════════════════════════════════════════════════════════════
   4. GEMINI HELPERS (idem generate-vtli-posts v3.4)
   ═══════════════════════════════════════════════════════════════ */

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RawConcept {
    target: string
    aha_moment: string
    hook: string
    subtext: string
    cta_label: string
    cta_url: string
    pulso_nucleo: string
    formats: Record<BannerFormat, { prompt_visual: string }>
}

async function callGeminiText(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<RawConcept> {
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
                        maxOutputTokens: 8000,
                        responseMimeType: "application/json",
                    },
                }),
            })

            if (!res.ok) {
                const errBody = await res.text()
                if (res.status >= 500 && attempt < MAX_RETRIES_TEXT - 1) {
                    console.warn(
                        `[banners:text] ${res.status} retry ${attempt + 1}`,
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

            const parsed = extractJsonConcept(text)
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

function extractJsonConcept(raw: string): RawConcept {
    let cleaned = raw.trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
    }

    const firstBrace = cleaned.indexOf("{")
    if (firstBrace === -1) {
        throw new Error(`Sin { inicio en: ${cleaned.slice(0, 200)}`)
    }
    const lastBrace = cleaned.lastIndexOf("}")
    if (lastBrace === -1) {
        throw new Error(`Sin } cierre en: ${cleaned.slice(0, 200)}`)
    }
    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1)

    let parsed: any
    try {
        parsed = JSON.parse(jsonStr)
    } catch (err) {
        throw new Error(
            `JSON parse error: ${String(err)}. Raw: ${jsonStr.slice(0, 300)}`
        )
    }

    // Aceptar dos shapes: { concept: {...} } o {...} directo
    const concept = parsed?.concept ?? parsed
    if (!concept || typeof concept !== "object") {
        throw new Error(`Concept no encontrado en: ${jsonStr.slice(0, 200)}`)
    }

    // Validar campos requeridos
    const required = [
        "target",
        "aha_moment",
        "hook",
        "subtext",
        "cta_label",
        "cta_url",
        "pulso_nucleo",
        "formats",
    ]
    for (const k of required) {
        if (!concept[k]) {
            throw new Error(
                `Concept missing required field "${k}": ${JSON.stringify(concept).slice(0, 200)}`
            )
        }
    }

    // Validar los 3 formats
    for (const fmt of BANNER_FORMATS) {
        if (!concept.formats[fmt] || !concept.formats[fmt].prompt_visual) {
            throw new Error(
                `Concept missing formats.${fmt}.prompt_visual: ${JSON.stringify(concept.formats).slice(0, 200)}`
            )
        }
    }

    return concept as RawConcept
}

interface GeminiImageResult {
    bytes: Uint8Array
    mimeType: string
}

async function callGeminiImage(
    apiKey: string,
    visualPrompt: string
): Promise<GeminiImageResult> {
    let lastErr: any = null
    for (let attempt = 0; attempt < MAX_RETRIES_IMAGE; attempt++) {
        const ctrl = new AbortController()
        const timeoutId = setTimeout(
            () => ctrl.abort(),
            GEMINI_IMAGE_TIMEOUT_MS
        )
        try {
            const url = `${GEMINI_IMAGE_ENDPOINT}?key=${apiKey}`
            const res = await fetch(url, {
                method: "POST",
                signal: ctrl.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: visualPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.92,
                        topP: 0.95,
                        responseModalities: ["IMAGE"],
                    },
                }),
            })

            clearTimeout(timeoutId)

            if (!res.ok) {
                const errBody = await res.text()
                if (res.status >= 500 && attempt < MAX_RETRIES_IMAGE - 1) {
                    console.warn(
                        `[banners:img] ${res.status} retry ${attempt + 1}`,
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
            const imgPart = parts.find((p: any) => p?.inlineData?.data)
            if (!imgPart) {
                throw new Error("Gemini image: sin inlineData en respuesta")
            }
            const b64 = imgPart.inlineData.data as string
            const mimeType =
                (imgPart.inlineData.mimeType as string) || "image/png"
            const bytes = base64ToBytes(b64)
            return { bytes, mimeType }
        } catch (err: any) {
            clearTimeout(timeoutId)
            lastErr = err
            if (err?.name === "AbortError") {
                console.warn(
                    `[banners:img] timeout ${GEMINI_IMAGE_TIMEOUT_MS}ms on attempt ${attempt + 1}`
                )
            }
            if (attempt < MAX_RETRIES_IMAGE - 1) {
                await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
                continue
            }
        }
    }
    throw lastErr ?? new Error("Gemini image: agotado retries")
}

function base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
}

/* ═══════════════════════════════════════════════════════════════
   5. CLOUDFLARE R2 — SIG V4 MANUAL (idem v3.4, zero-dep)
   ═══════════════════════════════════════════════════════════════ */

interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl: string
}

async function hmacSha256(
    key: ArrayBuffer | Uint8Array,
    data: string
): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    return crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        new TextEncoder().encode(data)
    )
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
    const buf =
        typeof data === "string" ? new TextEncoder().encode(data) : data
    const digest = await crypto.subtle.digest("SHA-256", buf)
    return bufferToHex(digest)
}

function bufferToHex(buf: ArrayBuffer): string {
    const view = new Uint8Array(buf)
    let hex = ""
    for (let i = 0; i < view.length; i++) {
        hex += view[i].toString(16).padStart(2, "0")
    }
    return hex
}

async function uploadImageToR2(
    cfg: R2Config,
    bytes: Uint8Array,
    key: string,
    mimeType: string
): Promise<string> {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`
    const region = "auto"
    const service = "s3"
    const method = "PUT"
    const now = new Date()
    const amzDate = now
        .toISOString()
        .replace(/[:-]/g, "")
        .replace(/\.\d{3}/, "")
    const dateStamp = amzDate.slice(0, 8)

    const encodedKey = key
        .split("/")
        .map((p) => encodeURIComponent(p))
        .join("/")
    const canonicalUri = `/${cfg.bucket}/${encodedKey}`
    const url = `https://${host}${canonicalUri}`

    const payloadHash = await sha256Hex(bytes)

    const canonicalHeaders =
        `content-type:${mimeType}\n` +
        `host:${host}\n` +
        `x-amz-content-sha256:${payloadHash}\n` +
        `x-amz-date:${amzDate}\n`
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"
    const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    const algorithm = "AWS4-HMAC-SHA256"
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign =
        `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`

    const kDate = await hmacSha256(
        new TextEncoder().encode(`AWS4${cfg.secretAccessKey}`),
        dateStamp
    )
    const kRegion = await hmacSha256(kDate, region)
    const kService = await hmacSha256(kRegion, service)
    const kSigning = await hmacSha256(kService, "aws4_request")
    const signatureBuf = await hmacSha256(kSigning, stringToSign)
    const signature = bufferToHex(signatureBuf)

    const authHeader =
        `${algorithm} Credential=${cfg.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": mimeType,
            Host: host,
            "x-amz-content-sha256": payloadHash,
            "x-amz-date": amzDate,
            Authorization: authHeader,
        },
        body: bytes,
    })

    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`R2 PUT ${res.status}: ${errBody.slice(0, 500)}`)
    }

    // URL pública: usa el publicBaseUrl + key encoded
    return `${cfg.publicBaseUrl}/${encodedKey}`
}

/* ═══════════════════════════════════════════════════════════════
   6. SUPABASE HELPERS
   ═══════════════════════════════════════════════════════════════ */

interface SupabaseConfig {
    url: string
    serviceRoleKey: string
}

async function fetchAdminCheck(
    cfg: SupabaseConfig,
    adminClerkId: string
): Promise<boolean> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/rpc/get_profile_by_clerk_id`,
            {
                method: "POST",
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ p_clerk_id: adminClerkId }),
            }
        )
        if (!res.ok) return false
        const data = await res.json()
        return data?.is_admin === true
    } catch {
        return false
    }
}

async function fetchRecentPulsos(
    cfg: SupabaseConfig,
    category: string,
    limit: number = PULSO_HISTORY_LIMIT
): Promise<string[]> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/rpc/get_recent_pulsos_nucleo_banner`,
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

interface InsertBannerInput {
    concept_id: string
    category: string
    banner_format: BannerFormat
    target: string
    hook: string
    subtext: string
    cta_label: string
    cta_url: string
    aha_moment: string
    prompt_visual: string
    pulso_nucleo: string
    image_r2_url: string | null
    generated_by_clerk_id: string
    parent_banner_id: string | null
}

async function insertVtliBannersBatch(
    cfg: SupabaseConfig,
    banners: InsertBannerInput[]
): Promise<any[]> {
    const res = await fetch(`${cfg.url}/rest/v1/vtli_banners`, {
        method: "POST",
        headers: {
            apikey: cfg.serviceRoleKey,
            Authorization: `Bearer ${cfg.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(banners),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(
            `Insert vtli_banners ${res.status}: ${errBody.slice(0, 500)}`
        )
    }
    return await res.json()
}

async function updateBannerImage(
    cfg: SupabaseConfig,
    bannerId: string,
    imageUrl: string
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_banners?id=eq.${bannerId}`,
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
            `[banners:bg] update image_r2_url failed ${res.status} for ${bannerId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function patchBannerFields(
    cfg: SupabaseConfig,
    bannerId: string,
    patch: Record<string, any>
): Promise<void> {
    const res = await fetch(
        `${cfg.url}/rest/v1/vtli_banners?id=eq.${bannerId}`,
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
            `[banners] patch fields failed ${res.status} for ${bannerId}: ${errBody.slice(0, 200)}`
        )
    }
}

async function markBannerRejected(
    cfg: SupabaseConfig,
    bannerId: string,
    reason: string
): Promise<void> {
    await patchBannerFields(cfg, bannerId, {
        status: "rejected",
        reviewed_at: new Date().toISOString(),
    })
    console.error(
        `[banners:bg] ${bannerId} marked rejected: ${reason.slice(0, 200)}`
    )
}

async function fetchBannerById(
    cfg: SupabaseConfig,
    bannerId: string
): Promise<any | null> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/vtli_banners?id=eq.${bannerId}&select=*`,
            {
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                },
            }
        )
        if (!res.ok) return null
        const rows = await res.json()
        return rows?.[0] ?? null
    } catch {
        return null
    }
}

async function fetchBannersByConceptId(
    cfg: SupabaseConfig,
    conceptId: string
): Promise<any[]> {
    try {
        const res = await fetch(
            `${cfg.url}/rest/v1/vtli_banners?concept_id=eq.${conceptId}&select=*`,
            {
                headers: {
                    apikey: cfg.serviceRoleKey,
                    Authorization: `Bearer ${cfg.serviceRoleKey}`,
                },
            }
        )
        if (!res.ok) return []
        return await res.json()
    } catch {
        return []
    }
}

async function markConceptRerolled(
    cfg: SupabaseConfig,
    conceptId: string,
    reviewerClerkId: string
): Promise<void> {
    const rows = await fetchBannersByConceptId(cfg, conceptId)
    for (const row of rows) {
        // Solo marca rerolled las filas que estaban en draft o approved
        if (row.status === "draft" || row.status === "approved") {
            await patchBannerFields(cfg, row.id, {
                status: "rerolled",
                reviewed_at: new Date().toISOString(),
                reviewed_by_clerk_id: reviewerClerkId,
            })
        }
    }
    // Increment reroll_count en una de las filas (la primera) por
    // tracking. Las demás quedan en su contador propio.
    if (rows.length > 0) {
        try {
            await fetch(
                `${cfg.url}/rest/v1/rpc/increment_vtli_banner_reroll_count`,
                {
                    method: "POST",
                    headers: {
                        apikey: cfg.serviceRoleKey,
                        Authorization: `Bearer ${cfg.serviceRoleKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ p_banner_id: rows[0].id }),
                }
            )
        } catch {}
    }
}

/* ═══════════════════════════════════════════════════════════════
   7. MAPPING
   ═══════════════════════════════════════════════════════════════ */

// v1.1: helper que sumá UTM tags al cta_url para tracking en Meta
// Ads + Analytics. La URL base que devuelve el LLM es "veotuluzinterna.com";
// acá se concatena con utm_source / utm_medium / utm_campaign /
// utm_content (este último carga el concept_id + format para
// identificar qué banner específico generó el click).
function buildTaggedCtaUrl(
    baseCtaUrl: string,
    category: string,
    conceptId: string,
    bannerFormat: BannerFormat
): string {
    // Sanitizar base (sacar protocolo si viene incluido + sacar trailing slash)
    let clean = baseCtaUrl
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
    if (!clean) clean = "veotuluzinterna.com"

    const conceptShort = conceptId.slice(0, 8)
    const params = new URLSearchParams({
        utm_source: "instagram",
        utm_medium: "paid",
        utm_campaign: `vtli_${category}`,
        utm_content: `${conceptShort}_${bannerFormat}`,
    })

    return `https://${clean}/?${params.toString()}`
}

function mapConceptToBannerInserts(
    concept: RawConcept,
    conceptId: string,
    category: string,
    adminClerkId: string,
    parentBannerId: string | null
): InsertBannerInput[] {
    return BANNER_FORMATS.map((fmt) => ({
        concept_id: conceptId,
        category,
        banner_format: fmt,
        target: concept.target,
        hook: concept.hook,
        subtext: concept.subtext,
        cta_label: concept.cta_label,
        // v1.1: cta_url se guarda con UTM tags ya concatenados, listos
        // para pegar directo en Meta Ads Manager. El URL visible en el
        // banner (lo que ve el visitor) sigue siendo "veotuluzinterna.com"
        // porque el prompt visual fue generado con la URL base sin tags.
        cta_url: buildTaggedCtaUrl(concept.cta_url, category, conceptId, fmt),
        aha_moment: concept.aha_moment,
        prompt_visual: concept.formats[fmt].prompt_visual,
        pulso_nucleo: concept.pulso_nucleo,
        image_r2_url: null,
        generated_by_clerk_id: adminClerkId,
        parent_banner_id: parentBannerId,
    }))
}

function todayDateString(): string {
    const now = new Date()
    return now.toISOString().slice(0, 10)
}

/* ═══════════════════════════════════════════════════════════════
   8. BACKGROUND IMAGE GENERATION
   ═══════════════════════════════════════════════════════════════ */

async function processBannerImagesBackground(
    geminiKey: string,
    supabase: SupabaseConfig,
    r2: R2Config,
    placeholders: any[]
): Promise<void> {
    const startTs = Date.now()
    console.log(
        `[banners:bg] starting — ${placeholders.length} banner images to process`
    )
    const today = todayDateString()

    const tasks = placeholders.map(async (placeholder, idx) => {
        if (idx > 0) await sleep(idx * 250)
        const bannerId = placeholder.id
        const visualPrompt = placeholder.prompt_visual
        if (!bannerId || !visualPrompt) {
            console.warn(
                `[banners:bg] #${idx} placeholder sin id o prompt`,
                JSON.stringify(placeholder).slice(0, 200)
            )
            return
        }
        const tStart = Date.now()
        console.log(
            `[banners:bg] #${idx} ${bannerId} (${placeholder.banner_format}) calling Gemini Image…`
        )
        try {
            const img = await callGeminiImage(geminiKey, visualPrompt)
            const tImg = Date.now()
            console.log(
                `[banners:bg] #${idx} ${bannerId} Gemini OK (${tImg - tStart}ms, ${img.bytes.length} bytes, ${img.mimeType})`
            )
            const ext = img.mimeType === "image/jpeg" ? "jpg" : "png"
            const uuid = crypto.randomUUID()
            const key = `Veo tu Luz Interna/Banners/${today}/${uuid}.${ext}`
            const url = await uploadImageToR2(
                r2,
                img.bytes,
                key,
                img.mimeType
            )
            const tUp = Date.now()
            console.log(
                `[banners:bg] #${idx} ${bannerId} R2 PUT OK (${tUp - tImg}ms)`
            )
            await updateBannerImage(supabase, bannerId, url)
            console.log(
                `[banners:bg] #${idx} ${bannerId} populated image_r2_url ✓ (total ${Date.now() - tStart}ms)`
            )
        } catch (err: any) {
            const reason = String(err?.message ?? err)
            console.error(
                `[banners:bg] #${idx} ${bannerId} FAILED after ${Date.now() - tStart}ms: ${reason}`
            )
            await markBannerRejected(supabase, bannerId, reason)
        }
    })

    await Promise.allSettled(tasks)
    console.log(
        `[banners:bg] batch finished in ${Date.now() - startTs}ms — ${placeholders.length} processed`
    )
}

async function processRetryImageBackground(
    geminiKey: string,
    supabase: SupabaseConfig,
    r2: R2Config,
    bannerId: string,
    visualPrompt: string
): Promise<void> {
    const today = todayDateString()
    const tStart = Date.now()
    console.log(`[banners:retry] ${bannerId} regenerating image…`)
    try {
        const img = await callGeminiImage(geminiKey, visualPrompt)
        const ext = img.mimeType === "image/jpeg" ? "jpg" : "png"
        const uuid = crypto.randomUUID()
        const key = `Veo tu Luz Interna/Banners/${today}/${uuid}.${ext}`
        const url = await uploadImageToR2(r2, img.bytes, key, img.mimeType)
        await updateBannerImage(supabase, bannerId, url)
        console.log(
            `[banners:retry] ${bannerId} populated image_r2_url ✓ (${Date.now() - tStart}ms)`
        )
    } catch (err: any) {
        const reason = String(err?.message ?? err)
        console.error(
            `[banners:retry] ${bannerId} FAILED after ${Date.now() - tStart}ms: ${reason}`
        )
        await markBannerRejected(supabase, bannerId, reason)
    }
}

/* ═══════════════════════════════════════════════════════════════
   9. MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

interface RequestBody {
    admin_clerk_id?: string
    category?: "veo" | "telekinesis" | "calibracion" | "sintonia"
    reroll_of_concept_id?: string | null
    retry_image_only_for_banner_id?: string | null
    // v1.2: regenera SOLO el prompt_visual del banner indicado
    // (manteniendo concept_id, hook, subtext, cta, target, etc.).
    // Caso de uso: feed 4:5 quedó perfecto, stories del mismo
    // concepto salió fuera de paleta → reroll solo del stories
    // preservando la identidad conceptual. Costo: ~$0.07 USD.
    reroll_format_only_for_banner_id?: string | null
}

function jsonResponse(status: number, body: any): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
        },
    })
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    // ── Env vars
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const R2_BUCKET = Deno.env.get("R2_BUCKET")
    const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY ||
        !GEMINI_API_KEY ||
        !R2_ACCOUNT_ID ||
        !R2_ACCESS_KEY_ID ||
        !R2_SECRET_ACCESS_KEY ||
        !R2_BUCKET ||
        !R2_PUBLIC_BASE_URL
    ) {
        return jsonResponse(500, { error: "missing_env_vars" })
    }

    const supabase: SupabaseConfig = {
        url: SUPABASE_URL,
        serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    }
    const r2: R2Config = {
        accountId: R2_ACCOUNT_ID,
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
        bucket: R2_BUCKET,
        publicBaseUrl: R2_PUBLIC_BASE_URL,
    }

    // ── Body
    let body: RequestBody
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json" })
    }

    let adminClerkId = ""

    // ── Admin gate (Ola C · #3 Fase 3): token verificado, sin fallback.
    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    adminClerkId = _g.userId!

    // AUDITORÍA PARTE 4 — gobernador de gasto (Gemini texto + Nano Banana
    // imagen). Único choke point tras el gate: cubre retry_image_only,
    // reroll_format_only y el batch/reroll de concepto por igual.
    if (
        !(await reserveSpend(
            "generate-vtli-banners",
            adminClerkId,
            20,
            86400,
            60,
            86400
        ))
    ) {
        return jsonResponse(429, { error: "rate_limited" })
    }

    // ── Modo retry image only
    const retryImageForId = body.retry_image_only_for_banner_id?.trim() || null
    if (retryImageForId) {
        const banner = await fetchBannerById(supabase, retryImageForId)
        if (!banner) {
            return jsonResponse(404, { error: "banner_not_found" })
        }
        // Reset visual: clear image_r2_url + status=draft optimistico
        await patchBannerFields(supabase, retryImageForId, {
            image_r2_url: null,
            status: "draft",
            reviewed_at: null,
            reviewed_by_clerk_id: null,
        })

        const hasWaitUntil =
            typeof EdgeRuntime !== "undefined" &&
            typeof EdgeRuntime?.waitUntil === "function"
        if (hasWaitUntil) {
            EdgeRuntime.waitUntil(
                processRetryImageBackground(
                    GEMINI_API_KEY!,
                    supabase,
                    r2,
                    retryImageForId,
                    banner.prompt_visual
                )
            )
        } else {
            processRetryImageBackground(
                GEMINI_API_KEY!,
                supabase,
                r2,
                retryImageForId,
                banner.prompt_visual
            ).catch((e) =>
                console.error("[banners:retry] background crashed", e)
            )
        }

        return jsonResponse(200, {
            success: true,
            mode: "retry_image_only",
            banner_id: retryImageForId,
            message:
                "Imagen regenerándose en background. Polling al RPC get_vtli_banners_by_ids detectará el image_r2_url nuevo.",
        })
    }

    // ── v1.2: Modo reroll_format_only (regenera prompt_visual de UN
    // formato manteniendo concepto cerrado)
    // v1.3: orden invertido — PATCH inicial ANTES de Gemini text para
    // cerrar race condition con el polling del frontend.
    const rerollFormatForId =
        body.reroll_format_only_for_banner_id?.trim() || null
    if (rerollFormatForId) {
        const banner = await fetchBannerById(supabase, rerollFormatForId)
        if (!banner) {
            return jsonResponse(404, { error: "banner_not_found" })
        }
        if (!VALID_CATEGORIES.has(banner.category)) {
            return jsonResponse(422, {
                error: "banner_invalid_category",
            })
        }

        // v1.3 FIX: PATCH inicial INMEDIATO para cerrar race condition.
        // Sin esto, el polling unificado del frontend (cada 4s) podía
        // leer la DB en la ventana entre Gemini text (~2s) y el PATCH
        // final, y sobrescribir el reset optimista del state con la
        // imagen vieja. Resultado: la UI volvía al estado anterior
        // después de 1 segundo aunque el reroll seguía en background.
        try {
            await patchBannerFields(supabase, rerollFormatForId, {
                image_r2_url: null,
                status: "draft",
                reviewed_at: null,
                reviewed_by_clerk_id: null,
            })
        } catch (err: any) {
            console.error(
                "[banners:reroll-format] DB initial patch failed",
                err
            )
            return jsonResponse(500, {
                error: "db_patch_failed",
                detail: String(err?.message ?? err),
            })
        }

        // Llamada sincrónica a Gemini text para regenerar prompt_visual
        let newPromptVisual: string
        try {
            const rerollPrompt = buildRerollFormatPrompt({
                category: banner.category,
                banner_format: banner.banner_format,
                target: banner.target,
                hook: banner.hook,
                subtext: banner.subtext,
                cta_label: banner.cta_label,
                cta_url: banner.cta_url,
                aha_moment: banner.aha_moment,
                pulso_nucleo: banner.pulso_nucleo,
            })
            newPromptVisual = await callGeminiTextForRerollFormat(
                GEMINI_API_KEY!,
                rerollPrompt
            )
        } catch (err: any) {
            console.error("[banners:reroll-format] gen prompt failed", err)
            // Marcar rejected para que la UI muestre fail state con
            // botón de reintentar manual.
            await markBannerRejected(
                supabase,
                rerollFormatForId,
                `reroll_prompt_generation_failed: ${String(err?.message ?? err)}`
            )
            return jsonResponse(502, {
                error: "reroll_prompt_generation_failed",
                detail: String(err?.message ?? err),
            })
        }

        // PATCH del prompt_visual nuevo (image_r2_url ya está null
        // desde el PATCH inicial — no se vuelve a tocar acá)
        try {
            await patchBannerFields(supabase, rerollFormatForId, {
                prompt_visual: newPromptVisual,
            })
        } catch (err: any) {
            console.error(
                "[banners:reroll-format] DB prompt patch failed",
                err
            )
            return jsonResponse(500, {
                error: "db_patch_failed",
                detail: String(err?.message ?? err),
            })
        }

        // Background: regenera imagen con el nuevo prompt
        const hasWaitUntil =
            typeof EdgeRuntime !== "undefined" &&
            typeof EdgeRuntime?.waitUntil === "function"
        if (hasWaitUntil) {
            EdgeRuntime.waitUntil(
                processRetryImageBackground(
                    GEMINI_API_KEY!,
                    supabase,
                    r2,
                    rerollFormatForId,
                    newPromptVisual
                )
            )
        } else {
            processRetryImageBackground(
                GEMINI_API_KEY!,
                supabase,
                r2,
                rerollFormatForId,
                newPromptVisual
            ).catch((e) =>
                console.error(
                    "[banners:reroll-format] background crashed",
                    e
                )
            )
        }

        return jsonResponse(200, {
            success: true,
            mode: "reroll_format_only",
            banner_id: rerollFormatForId,
            message:
                "Prompt visual regenerado preservando concepto. Imagen materializándose en background. Polling al RPC get_vtli_banners_by_ids detectará el image_r2_url nuevo.",
        })
    }

    // ── Modo batch vs reroll de concepto
    const rerollConceptId = body.reroll_of_concept_id?.trim() || null
    let category: "veo" | "telekinesis" | "calibracion" | "sintonia"
    let parentBannerId: string | null = null

    if (rerollConceptId) {
        const rows = await fetchBannersByConceptId(supabase, rerollConceptId)
        if (rows.length === 0) {
            return jsonResponse(404, { error: "concept_not_found" })
        }
        const parentCategory = rows[0].category
        if (!VALID_CATEGORIES.has(parentCategory)) {
            return jsonResponse(422, {
                error: "parent_concept_invalid_category",
            })
        }
        category = parentCategory
        // Apuntamos como parent al banner_id de la fila feed_square del concepto
        const feedSquareRow = rows.find(
            (r) => r.banner_format === "feed_square"
        )
        parentBannerId = feedSquareRow?.id ?? rows[0].id
    } else {
        if (!body.category || !VALID_CATEGORIES.has(body.category)) {
            return jsonResponse(400, { error: "invalid_category" })
        }
        category = body.category
    }

    // ── Fetch memoria de pulsos previos (anti-repetición conceptual)
    const recentPulsos = await fetchRecentPulsos(supabase, category)

    // ── Generar concepto via Gemini 3.5 Flash (sincrónico)
    let concept: RawConcept
    try {
        const userPrompt = buildUserPrompt(category, recentPulsos)
        concept = await callGeminiText(
            GEMINI_API_KEY!,
            VTLI_DIRECTOR_SYSTEM,
            userPrompt
        )
    } catch (err: any) {
        console.error("[banners] concept generation failed", err)
        return jsonResponse(502, {
            error: "concept_generation_failed",
            detail: String(err?.message ?? err),
        })
    }

    // ── INSERT 3 placeholders (1 por formato) con image_r2_url=null
    const conceptId = crypto.randomUUID()
    const placeholders = mapConceptToBannerInserts(
        concept,
        conceptId,
        category,
        adminClerkId,
        parentBannerId
    )

    let inserted: any[] = []
    try {
        inserted = await insertVtliBannersBatch(supabase, placeholders)
    } catch (err: any) {
        console.error("[banners] DB insert failed", err)
        return jsonResponse(500, {
            error: "db_insert_failed",
            detail: String(err?.message ?? err),
        })
    }

    // ── Si es reroll, marcar concepto padre completo
    if (rerollConceptId) {
        await markConceptRerolled(supabase, rerollConceptId, adminClerkId)
    }

    // ── BACKGROUND: generar 3 imágenes en paralelo
    const hasWaitUntil =
        typeof EdgeRuntime !== "undefined" &&
        typeof EdgeRuntime?.waitUntil === "function"
    console.log(
        `[banners] handler returning, EdgeRuntime.waitUntil=${hasWaitUntil} — dispatching ${inserted.length} background tasks`
    )
    if (hasWaitUntil) {
        EdgeRuntime.waitUntil(
            processBannerImagesBackground(
                GEMINI_API_KEY!,
                supabase,
                r2,
                inserted
            )
        )
    } else {
        processBannerImagesBackground(
            GEMINI_API_KEY!,
            supabase,
            r2,
            inserted
        ).catch((e) =>
            console.error("[banners:bg] background crashed", e)
        )
    }

    return jsonResponse(200, {
        success: true,
        async: true,
        category,
        concept_id: conceptId,
        count_generated: inserted.length,
        pulsos_inyectados: recentPulsos.length,
        banners: inserted,
        message:
            "3 placeholders insertados (1 por formato canónico). Imágenes generándose en background. Polling al RPC get_vtli_banners_by_ids detectará los image_r2_url conforme se populen.",
    })
})
