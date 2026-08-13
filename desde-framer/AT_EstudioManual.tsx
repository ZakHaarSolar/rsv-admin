// AT_EstudioManual.tsx v1.42 — MODO EPISODIO (emisiones de profundidad extendida): toggle Formato Reel/Episodio; el episodio elige duración 90s / 2 min / 3 min (9/12/18 cuadros de 10s), se estructura en ESCENAS (marcador dorado al abrir cada escena en la tira de cuadros; mismo escenario adentro, corte entre escenas), lleva arco de 3 actos + cold open, y trae la tarjeta "🎼 Música del episodio · Suno" (score instrumental adaptado al arco, con copiar estilo/excludes + weirdness/style influence sugeridos). Pareja del edge generate-vtli-storyboard v1.45 + migración 20260710_vtli_episodios.sql.
// AT_EstudioManual.tsx v1.41 — Canal FIJO Zak'Haar: se quitó el toggle Zak'Haar/VEO (este atelier emite siempre por Zak'Haar; los drafts VEO viejos del historial se siguen mostrando con su etiqueta).
// AT_EstudioManual.tsx v1.40 — REGENERAR NARRACIÓN. Cada video muestra su voz en off con un botón "↻ Regenerar": pide otra versión de la narración si no gustó, con un selector de Fuente (arranca en el Códice de Luz que se usó; se puede saltar a otro libro o a "Sexta Densidad"). No toca los visuales. Pareja del edge generate-vtli-storyboard v1.43 + migración 20260625h (las RPC de listado ahora traen codice_id/codice_title).
// AT_EstudioManual.tsx v1.39 — El error de "No se pudo generar" ahora es LEGIBLE (dice si Gemini se saturó, dio timeout o fue config — ya no "copy_generation_failed" a secas) y el botón nunca queda colgado (try/catch/finally). Pareja del edge generate-vtli-storyboard v1.41 (cascada de modelos vivos + thinkingBudget:0 que cura el cuelgue al generar desde un Códice de Luz).
// AT_EstudioManual.tsx v1.38 — CÓDICES DE LUZ como fuente del video (igual que los carruseles): selector "Fuente" (Sexta Densidad / Códice de Luz) + dropdown del códice. Con un códice elegido, la NARRACIÓN del Reel desarrolla UNA enseñanza de ese libro, fiel a tu voz; lo visual sigue siendo el universo Zak'Haar. Manda codice_id al edge. Pareja de generate-vtli-storyboard v1.40 + migración 20260624b_vtli_drafts_codice.sql.
// v1.37 — Voz: si ElevenLabs rechaza (créditos/llave), el aviso dice "Problemas con tu suscripción de ElevenLabs" en vez del error crudo.
// v1.36 — RPC admin por gateway admin-action (cierra IDOR Atelier, barrido 2026-06-13)
// v1.35 — Aviso persistente cuando la visión falla (Gemini saturado / 503): un
//         recuadro ámbar bajo el botón explica en lenguaje humano qué pasó (no es
//         tu imagen, está saturado, reintenta) en vez de dejar los textos en
//         blanco sin explicación. La imagen igual queda guardada.
// v1.34 — Diagnóstico: se expone el error real de la visión en consola.
// v1.33 — Ola C #3: callEdge manda el token de Clerk verificado en cada llamada.
// v1.32 — GENERADOR de Colectivos/Ambientes en modo SOLO PROMPTS ($0). El botón
//         ya NO genera la imagen por API: inventa el ser/escenario, rellena la
//         ficha (nombre + rasgos + variación) y te DA EL PROMPT fotorrealista
//         listo para copiar/pegar en Nano Banana. Tú generas la foto a mano y la
//         subes como referencia. Pareja del edge generate-vtli-colectivo v2.0.
// v1.31 — GENERADOR de Colectivos/Ambientes (primera versión, por API — costaba
//         dinero, reemplazada por solo prompts en v1.32).
// v1.30 — Voz nueva "Jessica · villana" (Eloquent Villain, voice_id
//         flHkNRp1BlvT73UL6gyz) con los ajustes del screenshot: Multilingual v2,
//         velocidad rápida (1.1), más variable (estabilidad 0.3), similitud alta
//         (0.95), estilo medio (0.4).
// v1.29 — (a) Quitadas las voces Lily y Alice (se descartan también del listado
//         dinámico). (b) El prompt del cuadro #1 con colectivo queda LIMPIO para
//         copy-paste: el recordatorio "sube la imagen del colectivo" sale como
//         NOTA aparte (no dentro del prompt); se limpian también los prompts viejos
//         que ya la traían. (c) Arrastrar-y-soltar imagen en la Portada y en el
//         cargador de Colectivos/Ambientes (antes solo clic para abrir archivos).
//         Pareja del edge generate-vtli-storyboard v1.35.
// v1.28 — Tema claro "VTLI" (override al final del CSS): lienzo y tarjetas claras,
//         texto en tinta, acentos dorado/azul, para acompañar el reskin del Atelier.
// v1.27 — Cierre del barrido a español neutral en la interfaz (clitics + acá→aquí).
// v1.26 — ESPAÑOL NEUTRAL + DATOS DE GENERACIÓN + PORTADA. (a) Toda la interfaz
//         pasó de argentino a español neutral (tú). (b) Cada tarjeta muestra el
//         colectivo y el ambiente usados (o "auto"). (c) Caja de portada a la
//         derecha de cada generación: subes tu keyframe #1 y queda como
//         miniatura para ubicar la iteración (sube a R2; edge
//         upload-vtli-draft-cover; migración 20260603).
// v1.25 — MYRDDIN + VOCES EN LA NUBE + GROK @IMAGE + REFERENCIA. (a) Myrddin
//         queda como voz fija (oR4uRy4fHDUGGISL0Rev, ritmo ágil). (b) Las voces
//         manuales ahora viven en la DB (vtli_atelier_voices, migración
//         20260602d) → se ven iguales desde cualquier compu; localStorage es
//         solo caché y migra las viejas una vez. (c) Aviso de Grok arriba de los
//         cuadros: @image1 = el cuadro, @image2 = el cuadro #1 (el ser) para
//         tomas lejanas/aéreas. (d) PROMPTS: "Con referencia" a la izquierda y
//         por defecto. (e) Colectivo: "Automático" pasa a "Sintonizar nuevo
//         Colectivo". Pareja del edge generate-vtli-storyboard v1.30.
// v1.24 — TOMAS DE VOZ + PUBLICADO + VOCES. (a) Al generar la voz con otra voz,
//         la toma se SUMA a una lista (no pisa): pruebas varias voces y las
//         comparas escuchándolas todas, con su nombre y botón de borrar. (b)
//         Toggle "Publicado" en cada tarjeta para marcar los Reels ya
//         publicados (por defecto: no). (c) Dos voces de meditación nuevas
//         (Lily, Alice) + gestor "Voz por ID" para pegar cualquier Voice ID de
//         ElevenLabs (Myrddin, etc.) con su ritmo (lento/natural/ágil); se
//         guardan en el navegador. Cada voz manda sus ajustes a la edge
//         (generar-narracion-voz v1.3). Migración 20260602c.
// v1.23 — BIBLIOTECA DE AMBIENTES (Capa 2). Selector "Ambiente" en los controles
//         (Automático = el motor varía el escenario) + sección "Ambientes del
//         Universo" para guardar entornos como los Colectivos (subir imagen →
//         describir con IA → editar → activar/borrar). El manager se generalizó:
//         ColectivosManager → LibraryManager(config) con COLECTIVO_CONFIG y
//         AMBIENTE_CONFIG. Pasa ambiente_id al motor (tabla vtli_ambientes,
//         migración 20260602; edge describe-vtli-colectivo v1.1 con kind).
// v1.22 — Voces: quitadas Sarah y Matilda del selector (sonaban robóticas).
//         Quedan CarterSutra (masc), Charlotte (susurro) y Rachel (serena).
//         Candado EXCLUDED_VOICE_IDS para que no reaparezcan si el listado
//         dinámico de ElevenLabs se reactiva.
// v1.21 — Fix visual: en modo Solo prompts, el número de cuadro (#1, #2…) ya no
//         se encima con el texto "Prompt de imagen — pégalo en Nano Banana" (se
//         le dio aire arriba al recuadro del prompt para que el badge quede solo
//         en la esquina).
// v1.20 — CARGADOR DE COLECTIVOS (Fase B). Sub-sección "Colectivos del Universo":
//         subes una imagen → la IA de visión describe la especie (rasgos fijos +
//         variación individual) → la revisas, le pones nombre y la guardas. La
//         imagen se sube a R2 como referencia visual; el texto va al prompt
//         siempre (funciona en modo solo prompts). Puedes editar, activar/
//         desactivar y borrar colectivos; el selector de arriba se refresca solo.
//         Backend: edge describe-vtli-colectivo + RPCs upsert_vtli_colectivo /
//         set_vtli_colectivo_active / delete_vtli_colectivo /
//         get_vtli_colectivos_admin (migración 20260601c).
// v1.19 — UNIVERSO ÚNICO + SELECTOR DE COLECTIVO. Un solo universo holográfico
//         cristalino (sin paletas/mundos variados, eso vive en el motor).
//         Selector "Colectivo" en los controles: eliges la civilización
//         protagonista (de la biblioteca vtli_colectivos) o "Automático". El ser
//         lo fija el colectivo; el universo queda igual. Dentro de un Reel =
//         mismo individuo; entre Reels del mismo colectivo = individuos distintos
//         de la misma especie.
// v1.18 — MODO "SOLO PROMPTS" (manual, costo $0). Dos interruptores nuevos:
//         "Imágenes" (Solo prompts / Con API) y "Prompts" (Auto-suficiente / Con
//         referencia). En "Solo prompts" el panel entrega el prompt de imagen
//         completo de cada cuadro para copiar/pegar en tu Nano Banana del plan
//         Pro (sin gastar API). Los storyboards manuales llegan como
//         'prompts_ready' → el rescate automático NUNCA los toca (cero gasto).
// v1.17 — UX DE PROGRESO + anti-solapamiento. (a) Un cuadro vacío que el sistema
//         está completando solo ahora muestra "Generando… se reintenta solo" con
//         spinner (antes decía "No se generó", parecía roto durante los minutos
//         que tarda Nano Banana cuando está saturada). "No se generó · Reintentar"
//         queda SOLO para cuadros realmente abandonados (storyboard viejo). (b) El
//         reintento serial espera 150s (no 105s) antes de re-disparar el mismo
//         cuadro, para no solaparse con la corrida del server (~140s) y recrear
//         la concurrencia que ese mismo diseño evita.
// v1.16 — AUTO-REINTENTO A PRUEBA DE BALAS. Antes el rescate de cuadros
//         colgados disparaba DOS reintentos casi a la vez (uno por tick) que se
//         colgaban mutuamente en Nano Banana, y se rendía tras 2 intentos por
//         cuadro → un cuadro podía no aparecer NUNCA. Ahora el rescate es SERIAL
//         (un solo cuadro en vuelo en TODO el panel), libera apenas el cuadro se
//         llena (no espera el plazo entero), y reintenta hasta 8 veces por
//         cuadro. Junto con el fallback sin-referencia del backend (v1.21), los
//         huecos SIEMPRE se terminan rellenando solos.
// v1.15 — AUTO-REINTENTO: si un storyboard reciente terminó pero le falta algún
//         cuadro (Gemini lo dejó colgado), el panel lo regenera SOLO (fresh,
//         distinto) en segundo plano —uno por vez, hasta 2 veces por cuadro—
//         sin que tengas que picar Reintentar. Los huecos se rellenan solos.
// v1.14 — Selector de DURACIÓN POR CUADRO: ahora eliges cuántos cuadros (4/5/6)
//         y cuántos segundos dura cada uno animado en Grok (6s o 10s); el panel
//         muestra la duración total (ej. 4 × 6s = 24s) y la narración se genera
//         del largo justo para esa duración. Manda keyframes_count +
//         seconds_per_keyframe al backend (generate-vtli-storyboard v1.19).
// v1.13 — Reintentar de un cuadro que NO se generó ahora pide regeneración
//         "fresh" (desde cero, sin clonar el cuadro #1). El backend
//         (generate-vtli-storyboard v1.15) lo regenera con su propio prompt +
//         el ancla solo como cara. Los botones Ligera/Grande siguen igual.
// v1.12 — (a) EDITAR narración: la sección de voz en off trae un botón "Editar"
//         que abre el texto en un campo editable; "Guardar" lo persiste (RPC
//         update_vtli_draft_narration, migración 20260531c) antes de generar la
//         voz, así la voz usa el texto corregido. (b) 3 voces femeninas nuevas
//         (Charlotte susurro · Matilda cálida · Rachel serena) en el selector,
//         pensadas para el medio-susurro hablado, lento y etéreo del canal.
// v1.11 — "Error de pago": si la generación de imagen se bloquea por un
//         problema de facturación de Google (estado payment_error), el panel
//         lo dice claro — pill roja "error de pago", banner explicativo en el
//         storyboard, y los cuadros muestran "Error de pago" en vez de
//         "No se generó". El Reintentar sigue (al arreglar el pago, funciona).
// v1.10 — Hotfix pantalla negra: draftStale se usaba en KeyframeCard pero no
//         estaba en el destructure de props (solo en el tipo) → ReferenceError
//         al renderizar un cuadro = se caía todo el panel. Agregado al destructure.
// v1.9 — A prueba de fallos REAL: si un cuadro lleva > 3 min sin imagen, el
//        panel muestra "No se generó · Reintentar" AUNQUE el storyboard siga
//        marcado "generando" (caso: la tarea de fondo del servidor murió antes
//        de terminar y dejó el draft atascado). Ningún cuadro se queda girando
//        para siempre.
// v1.8 — (a) El control de voz de arriba deja de ser "predeterminada" (daba a
//        entender que se generaba al generar); ahora es una nota: la voz se
//        elige y genera DESPUÉS, en cada storyboard. (b) Cuadros trabados
//        rescatables: si una imagen no se generó (el storyboard ya está
//        listo), el cuadro muestra "No se generó · Reintentar" en vez de un
//        spinner eterno. Spinner solo mientras genera o re-genera de verdad.
// v1.7 — Sección de Narración · voz en off DEDICADA y siempre visible (antes
//        vivía escondida dentro del toggle de caption). Al generar, el panel
//        entrega texto de narración + storyboard SIN voz; ahí lees la
//        narración, miras los visuales y eliges la voz (CarterSutra masc /
//        Sarah fem) para generarla. El toggle colapsable queda solo para
//        caption + hashtags.
// v1.6 — Regenerar un cuadro individual: cada keyframe trae dos botones
//        ("Ligera" / "Grande") que vuelven a generar SOLO esa imagen — misma
//        escena y personaje, con variación sutil o con cambio notorio de
//        ángulo y pose. Llama al modo retry de generate-vtli-storyboard.
// v1.5 — Selector de voz POR STORYBOARD: al lado del botón Generar/Regenerar
//        voz hay un menú para elegir otra voz (ej. cambiar de masculina a
//        femenina) y regenerar el audio con ella. El selector de arriba queda
//        como voz predeterminada con la que arranca cada storyboard.
// v1.4 — Voz femenina Sarah (etérea) sumada al selector para personajes
//        femeninos. CarterSutra para masculinos/interdimensionales.
// v1.3 — Voz CarterSutra fija en el selector (no depende del listado de
//        ElevenLabs, que se quedaba "Cargando…"); el listado dinámico, si
//        carga, suma voces extra. Settings de voz en generar-narracion-voz.
// v1.2 — Voz ElevenLabs integrada: selector de voz global + "Generar voz"
//        por storyboard + reproductor + descarga. Quitado "Subir video de
//        Grok" (los videos se descargan localmente). Requiere migración
//        20260530c_vtli_drafts_audio + edge functions listar-voces-elevenlabs
//        y generar-narracion-voz.
// v1.1 — Narración (voz en off para ElevenLabs) visible por storyboard con
//        botón Copiar. Requiere migración 20260530b_vtli_drafts_narration.
// Atelier · Estudio Manual — sub-tab de STORYBOARDS para Grok Imagine.
// Genera un concepto narrativo de 40-60s dividido en N keyframes (cuadros)
// con la MISMA cara (consistencia nivel 2). Cada cuadro trae su prompt de
// animación listo para Grok. Flujo híbrido: animar manual en Grok (subir
// el .mp4) o auto por API (LTX-2 Fast). Hermano default-export de
// AtelierMarketing.tsx — se renderiza cuando activeSubTab === "estudio_manual".
//
// Backend:
//   · generate-vtli-storyboard (genera arco + keyframes Nano Banana)
//   · animate-vtli-keyframe     (anima un cuadro por API · LTX-2 Fast)
//   · subir-keyframe-video      (sube el .mp4 manual de Grok a R2)
//   · descargar-media           (proxy de descarga R2)
//   · RPCs: get_recent_vtli_drafts · get_vtli_drafts_by_ids ·
//           update_vtli_draft_status · delete_vtli_draft

import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"

/* ═══════════════════════════════════════════════════════════════
   1. CONSTANTS · HELPERS
   ═══════════════════════════════════════════════════════════════ */

const GOLD = "#D4A843"
const CYAN = "#00E5FF"

interface Props {
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    isMobile?: boolean
}

type DraftCategory = "veo" | "zakhaar"

interface Keyframe {
    id: string
    beat_index: number
    beat_label: string
    copy_line: string | null
    prompt_image: string
    prompt_animation: string
    image_r2_url: string | null
    video_r2_url: string | null
    video_source: string | null
    anim_status: "idle" | "animating" | "animated" | "failed"
    anim_request_id: string | null
    // Solo episodios: a qué escena pertenece el cuadro (1..M) + su nombre.
    scene_index?: number | null
    scene_label?: string | null
}

// Solo episodios: la música del episodio para Suno (instrumental, va debajo de
// la voz en off). La sugiere el motor adaptada al arco emocional del episodio.
interface ScoreJson {
    title?: string
    style?: string
    exclude_styles?: string
    weirdness?: number
    style_influence?: number
    notes?: string
}

// Una toma de voz en off generada para un storyboard. Se acumulan: pruebas
// varias voces y las comparas escuchándolas todas.
interface NarrationTake {
    voice_id: string
    voice_name: string
    audio_url: string
    created_at: string
}

interface Draft {
    id: string
    category: string
    target: string
    concept_title: string
    narrative: string
    narration: string | null
    narration_audio_url: string | null
    narration_takes_json: NarrationTake[] | null
    is_published: boolean
    colectivo_name: string | null
    ambiente_name: string | null
    cover_image_url: string | null
    caption: string
    hashtags: string[]
    pulso_nucleo: string | null
    target_duration_sec: number
    keyframes_count: number
    status: string
    generated_at: string
    // Códice de Luz del que nació el storyboard (null = fuente Sexta Densidad).
    // Sirve para que el regenerador de narración arranque con ese mismo códice.
    codice_id: string | null
    codice_title: string | null
    // "reel" (clásico) o "episodio" (mini-película por escenas + score de Suno).
    format?: string | null
    score_json?: ScoreJson | null
    keyframes: Keyframe[]
}

// Cantidad de cuadros (keyframes) y segundos por cuadro (cuánto dura el clip
// animado de cada cuadro en Grok). La duración TOTAL = cuadros × s/cuadro, y la
// narración se escala a esa duración. Ej: 4 cuadros × 6s = 24s; 4 × 10s = 40s.
const KEYFRAME_COUNTS = [4, 5, 6]
const SECONDS_PER_KF = [6, 10]
// MODO EPISODIO: duraciones elegibles (clips fijos de 10s → 9/12/18 cuadros).
const EPISODE_DURATIONS = [
    { sec: 90, label: "90s", cuadros: 9, escenas: "3-4" },
    { sec: 120, label: "2 min", cuadros: 12, escenas: "4-5" },
    { sec: 180, label: "3 min", cuadros: 18, escenas: "6-7" },
]

// "1:30" / "2:00" a partir de segundos (para el badge del episodio).
function fmtMinSec(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, "0")}`
}

// Voces canónicas del canal Zak'Haar. Siempre disponibles en el selector
// aunque el listado dinámico de ElevenLabs no cargue (son voces premade
// compartidas de ElevenLabs, presentes en toda cuenta). Las femeninas están
// elegidas para el medio-susurro hablado, lento y etéreo del canal; el ritmo
// pausado lo refuerza generar-narracion-voz con speed 0.9. Para sumar/cambiar
// una voz, edita este array.
interface VoiceSettings {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
    speed?: number
}

interface VoiceOpt {
    voice_id: string
    name: string
    // Ajustes de ElevenLabs para ESTA voz. Si faltan, la edge usa los del
    // canal (estable, speed 0.9 = medio-susurro pausado).
    settings?: VoiceSettings
    model_id?: string
    custom?: boolean // agregada a mano vía "Voz por ID" (persiste en el navegador)
}

// Ritmos para el gestor "Voz por ID": cada uno fija un set de ajustes
// ElevenLabs. "Ágil" replica los stats tipo Myrddin del screenshot.
const VOICE_RHYTHMS = {
    meditativo: {
        label: "Meditativo (lento)",
        settings: {
            stability: 0.9,
            similarity_boost: 0.7,
            style: 0,
            use_speaker_boost: true,
            speed: 0.82,
        },
    },
    natural: {
        label: "Natural",
        settings: {
            stability: 0.85,
            similarity_boost: 0.7,
            style: 0,
            use_speaker_boost: true,
            speed: 0.95,
        },
    },
    agil: {
        label: "Narrador ágil (tipo Myrddin)",
        settings: {
            stability: 0.7,
            similarity_boost: 0.9,
            style: 0,
            use_speaker_boost: true,
            speed: 1.15,
        },
    },
} as const
type VoiceRhythmKey = keyof typeof VOICE_RHYTHMS

const DEFAULT_VOICES: VoiceOpt[] = [
    { voice_id: "bU2VfAdiOb2Gv2eZWlFq", name: "CarterSutra · masc" },
    { voice_id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte · susurro" },
    { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel · serena" },
    // Myrddin — narrador mágico / mentor sabio (con los stats del screenshot:
    // velocidad 1.15, estabilidad 0.7, similitud 0.9).
    {
        voice_id: "oR4uRy4fHDUGGISL0Rev",
        name: "Myrddin · narrador",
        settings: VOICE_RHYTHMS.agil.settings,
    },
    // Jessica Anne Bogart — "Eloquent Villain". Ajustes del screenshot de Zak:
    // Multilingual v2, velocidad rápida, más variable, similitud alta, estilo medio.
    {
        voice_id: "flHkNRp1BlvT73UL6gyz",
        name: "Jessica · villana",
        model_id: "eleven_multilingual_v2",
        settings: {
            stability: 0.3,
            similarity_boost: 0.95,
            style: 0.4,
            use_speaker_boost: true,
            speed: 1.1,
        },
    },
]

// Clave localStorage de las voces agregadas a mano ("Voz por ID").
const CUSTOM_VOICES_KEY = "am_custom_voices_v1"

// Voces descartadas (sonaban robóticas con nuestros ajustes). Se filtran
// también del listado dinámico de ElevenLabs por si alguna vez vuelve a cargar.
const EXCLUDED_VOICE_IDS = new Set([
    "EXAVITQu4vr4xnSDxMaL", // Sarah
    "XrExE9yKIg1WjnnlVkGX", // Matilda
    "pFZP5JQG7iQjIQuC4Bku", // Lily
    "Xb7hH8MSUJpSbSDYk0k2", // Alice
])

// Voces agregadas a mano ("Voz por ID"), persistidas en el navegador. Sirve
// para pegar cualquier Voice ID de ElevenLabs (Myrddin, etc.) y usarlo ya.
function loadCustomVoices(): VoiceOpt[] {
    if (typeof localStorage === "undefined") return []
    try {
        const raw = localStorage.getItem(CUSTOM_VOICES_KEY)
        const arr = raw ? JSON.parse(raw) : []
        if (!Array.isArray(arr)) return []
        return arr
            .filter(
                (v: any) =>
                    v &&
                    typeof v.voice_id === "string" &&
                    v.voice_id.trim()
            )
            .map((v: any) => ({
                voice_id: String(v.voice_id).trim(),
                name: String(v.name || v.voice_id).trim(),
                settings: v.settings || undefined,
                model_id: v.model_id || undefined,
                custom: true,
            }))
    } catch {
        return []
    }
}

function saveCustomVoices(list: VoiceOpt[]) {
    try {
        localStorage.setItem(CUSTOM_VOICES_KEY, JSON.stringify(list))
    } catch {}
}

// Une las listas (orden: default → manuales → dinámicas de la cuenta) sin
// duplicar voice_id y filtrando las descartadas.
function mergeVoices(
    base: VoiceOpt[],
    custom: VoiceOpt[],
    dynamic: VoiceOpt[]
): VoiceOpt[] {
    const seen = new Set<string>()
    const out: VoiceOpt[] = []
    for (const v of [...base, ...custom, ...dynamic]) {
        if (!v?.voice_id) continue
        if (seen.has(v.voice_id)) continue
        if (EXCLUDED_VOICE_IDS.has(v.voice_id)) continue
        seen.add(v.voice_id)
        out.push(v)
    }
    return out
}

async function rpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any> = {}
) {
    if (!url || !key) return null
    try {
        // Familia admin del Atelier por gateway admin-action (token verificado;
        // el server inyecta el id admin, descarta el del body). Fallback
        // transitorio a la llamada directa hasta el REVOKE.
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (token) {
            const g = await fetch(`${url}/functions/v1/admin-action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ token, action: fn, params }),
            })
            if (g.ok) return await g.json()
        }
        const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(params),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

async function callEdge(
    url: string,
    key: string,
    fn: string,
    payload: Record<string, any>
) {
    const r = await fetch(`${url}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
        },
        // Ola C #3: token de sesión de Clerk verificado server-side por el edge.
        body: JSON.stringify({
            ...payload,
            token: await (window as any).Clerk?.session?.getToken?.(),
        }),
    })
    let body: any = null
    try {
        body = await r.json()
    } catch {}
    return { ok: r.ok, status: r.status, body }
}

function downloadViaProxy(
    url: string,
    key: string,
    fileUrl: string,
    filename: string
) {
    const proxy = `${url}/functions/v1/descargar-media?url=${encodeURIComponent(
        fileUrl
    )}&filename=${encodeURIComponent(filename)}`
    const a = document.createElement("a")
    a.href = proxy
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

function isDraftPending(d: Draft): boolean {
    // Modo "solo prompts": el draft está completo apenas se ensamblan los textos;
    // no esperamos imágenes del server (las generas a mano). No es pendiente, así
    // el rescate automático tampoco lo toca → cero gasto de API.
    if (d.status === "prompts_ready") return false
    if (d.status === "generating") return true
    return (d.keyframes || []).some(
        (k) => !k.image_r2_url || k.anim_status === "animating"
    )
}

// Item normalizado de una biblioteca (colectivo o ambiente) para la gestión.
// Las columnas crudas difieren por tipo (species_traits/scene_traits, etc.);
// se normalizan a traits/variation al cargar (ver LibraryConfig.rowTraits).
interface LibraryItem {
    id: string
    name: string
    traits: string
    variation: string | null
    image_r2_url: string | null
    category: string | null
    active: boolean
    sort_order: number
}

// Reduce la imagen a maxSide px (lado largo) y la devuelve como base64 JPEG.
// Mantiene el payload chico (evita WORKER_RESOURCE_LIMIT de Supabase) y la
// imagen en R2 liviana — alcanza para referencia visual de cara.
function resizeImageToBase64(
    file: File,
    maxSide = 1400
): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
        reader.onload = () => {
            const img = new Image()
            img.onerror = () =>
                reject(new Error("No se pudo cargar la imagen"))
            img.onload = () => {
                let w = img.naturalWidth || img.width
                let h = img.naturalHeight || img.height
                const scale = Math.min(1, maxSide / Math.max(w, h))
                w = Math.max(1, Math.round(w * scale))
                h = Math.max(1, Math.round(h * scale))
                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("No se pudo procesar la imagen"))
                    return
                }
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
                const base64 = dataUrl.split(",")[1] || ""
                resolve({ base64, mime: "image/jpeg" })
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    })
}

function colectivoCatLabel(cat: string | null): string {
    if (cat === "zakhaar") return "Zak'Haar"
    if (cat === "veo") return "VEO"
    return "Universal"
}

/* ═══════════════════════════════════════════════════════════════
   2. CSS (clases am- · aisladas de las at- del shell)
   ═══════════════════════════════════════════════════════════════ */

const CSS = `
.am-wrap{display:flex;flex-direction:column;gap:18px;}
.am-intro{font-size:13px;line-height:1.55;color:rgba(255,255,255,.62);max-width:760px;}
.am-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;padding:16px;border:1px solid rgba(212,168,67,.22);border-radius:14px;background:rgba(212,168,67,.04);}
.am-field{display:flex;flex-direction:column;gap:6px;}
.am-field-lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);}
.am-seg{display:flex;gap:4px;background:rgba(255,255,255,.04);border-radius:10px;padding:4px;}
.am-seg button{border:none;background:transparent;color:rgba(255,255,255,.62);font-size:13px;padding:8px 14px;border-radius:7px;cursor:pointer;transition:.15s;white-space:nowrap;}
.am-seg button.on{background:rgba(212,168,67,.18);color:${GOLD};font-weight:600;}
.am-gen{margin-left:auto;display:flex;align-items:center;gap:10px;border:none;border-radius:12px;padding:14px 22px;cursor:pointer;background:linear-gradient(135deg,${GOLD},#b8893a);color:#0a0a0a;font-size:15px;font-weight:700;transition:.18s;}
.am-gen:disabled{opacity:.5;cursor:default;}
.am-gen .g{font-size:18px;}
.am-error{padding:12px 16px;border-radius:10px;background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.3);color:#ff9b9b;font-size:13px;}
.am-empty{padding:40px 20px;text-align:center;color:rgba(255,255,255,.4);font-size:14px;}
.am-draft{border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:18px;background:rgba(255,255,255,.02);display:flex;flex-direction:column;gap:14px;}
.am-draft-head{display:flex;align-items:flex-start;gap:12px;}
.am-draft-titles{flex:1;min-width:0;}
.am-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
.am-pill{font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:20px;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.7);}
.am-pill.cat{border-color:rgba(0,229,255,.35);color:${CYAN};}
.am-pill.st{border-color:rgba(212,168,67,.35);color:${GOLD};}
.am-pill.err{border-color:rgba(255,90,90,.5);color:#ff9b9b;}
.am-pill.meta{text-transform:none;letter-spacing:0;border-color:rgba(0,229,255,.28);color:rgba(0,229,255,.82);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.am-cover{flex-shrink:0;}
.am-cover-box{width:58px;height:96px;border-radius:10px;border:1px dashed rgba(255,255,255,.22);background:rgba(0,0,0,.25);cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0;transition:.15s;}
.am-cover-box:hover{border-color:rgba(212,168,67,.5);}
.am-col-thumb-drop{cursor:pointer;}
.am-drag-over{border-color:${GOLD}!important;border-style:solid!important;box-shadow:0 0 0 2px rgba(212,168,67,.35),0 0 14px rgba(212,168,67,.3);background:rgba(212,168,67,.1)!important;}
.am-cover-box img{width:100%;height:100%;object-fit:cover;}
.am-cover-ph{font-size:9.5px;line-height:1.5;color:rgba(255,255,255,.42);text-align:center;}
.am-payerr{display:flex;gap:8px;align-items:flex-start;padding:11px 13px;border-radius:11px;background:rgba(255,90,90,.08);border:1px solid rgba(255,90,90,.32);color:#ffb3b3;font-size:12.5px;line-height:1.5;}
.am-draft-title{font-size:17px;font-weight:700;color:#fff;margin:0;}
.am-draft-target{font-size:12px;color:rgba(255,255,255,.5);margin:3px 0 0;}
.am-iconbtn{border:1px solid rgba(255,255,255,.14);background:transparent;color:rgba(255,255,255,.55);border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:15px;flex-shrink:0;transition:.15s;}
.am-iconbtn:hover{color:#ff9b9b;border-color:rgba(255,90,90,.4);}
.am-cap{font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.66);white-space:pre-wrap;background:rgba(0,0,0,.18);border-radius:10px;padding:11px 13px;}
.am-cap-tags{margin-top:7px;color:${CYAN};opacity:.8;}
.am-narr{border:1px solid rgba(212,168,67,.3);border-radius:10px;padding:11px 12px;margin-bottom:12px;background:rgba(212,168,67,.05);}
.am-narr-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}
.am-narr-lbl{font-size:11px;letter-spacing:.04em;color:${GOLD};font-weight:600;}
.am-mini{border:1px solid rgba(212,168,67,.4);background:transparent;color:${GOLD};font-size:11px;padding:4px 11px;border-radius:7px;cursor:pointer;transition:.15s;flex-shrink:0;}
.am-mini.on{background:rgba(212,168,67,.2);}
.am-narr-text{font-size:13px;line-height:1.55;color:rgba(255,255,255,.82);white-space:pre-wrap;}
.am-narr-edit{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(212,168,67,.4);color:#fff;border-radius:8px;padding:10px 11px;font-size:13px;line-height:1.55;font-family:inherit;resize:vertical;min-height:104px;}
.am-narr-edit:focus{outline:none;border-color:${GOLD};}
.am-narr-editbtns{display:flex;gap:8px;margin-top:8px;}
.am-mini.ghost{border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.6);}
.am-cap-lbl{font-size:11px;letter-spacing:.04em;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:5px;}
.am-select{background:rgba(20,20,28,.9);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:9px;padding:9px 12px;font-size:13px;cursor:pointer;min-width:160px;}
.am-voice-select{background:rgba(20,20,28,.92);border:1px solid rgba(212,168,67,.32);color:#fff;border-radius:7px;padding:6px 9px;font-size:12px;cursor:pointer;flex-shrink:0;max-width:180px;}
.am-voice-hint{font-size:12px;color:rgba(0,229,255,.72);line-height:1.4;padding:9px 0;max-width:230px;}
.am-select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);color:#fff;font-size:13px;padding:9px 12px;border-radius:9px;cursor:pointer;min-width:170px;}
.am-select:focus{outline:none;border-color:rgba(212,168,67,.5);}
.am-voice{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:11px;padding-top:11px;border-top:1px solid rgba(212,168,67,.18);}
.am-audio{height:34px;flex:1;min-width:170px;}
.am-pub{font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.5);background:transparent;cursor:pointer;transition:.15s;}
.am-pub:hover{border-color:rgba(120,230,160,.5);color:rgba(180,240,200,.92);}
.am-pub.on{border-color:rgba(80,220,130,.6);color:#7fe6a0;background:rgba(80,220,130,.14);}
.am-takes{display:flex;flex-direction:column;gap:7px;margin-top:10px;}
.am-take{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.2);border:1px solid rgba(212,168,67,.16);border-radius:9px;padding:6px 8px;}
.am-take-name{font-size:11.5px;color:${GOLD};width:120px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.am-take-audio{height:32px;flex:1;min-width:120px;}
.am-take-btn{border:1px solid rgba(255,255,255,.16);background:transparent;color:rgba(255,255,255,.6);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:13px;flex-shrink:0;transition:.15s;}
.am-take-btn:hover{color:${GOLD};border-color:rgba(212,168,67,.45);}
.am-take-btn.del:hover{color:#ff9b9b;border-color:rgba(255,90,90,.4);}
.am-voices-mgr{margin-top:12px;border:1px solid rgba(0,229,255,.18);border-radius:11px;padding:11px 13px;background:rgba(0,229,255,.04);}
.am-voices-mgr-head{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;}
.am-voices-mgr-title{font-size:11.5px;letter-spacing:.04em;color:${CYAN};font-weight:600;}
.am-voices-mgr-hint{font-size:11.5px;color:rgba(255,255,255,.5);line-height:1.5;margin:9px 0 4px;}
.am-vrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:9px;}
.am-vinput{background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:7px;padding:7px 9px;font-size:12px;font-family:inherit;}
.am-vinput:focus{outline:none;border-color:${CYAN};}
.am-vchips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
.am-vchip{display:flex;align-items:center;gap:7px;background:rgba(0,0,0,.22);border:1px solid rgba(0,229,255,.22);border-radius:20px;padding:4px 6px 4px 11px;font-size:11.5px;color:rgba(255,255,255,.82);}
.am-vchip button{border:none;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;font-size:13px;line-height:1;padding:0 2px;}
.am-vchip button:hover{color:#ff9b9b;}
.am-toggle{align-self:flex-start;background:none;border:none;color:rgba(255,255,255,.45);font-size:11.5px;cursor:pointer;padding:2px 0;text-decoration:underline;}
.am-strip{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x proximity;}
.am-kf{flex:0 0 188px;width:188px;border:1px solid rgba(255,255,255,.1);border-radius:13px;overflow:hidden;background:rgba(0,0,0,.25);display:flex;flex-direction:column;scroll-snap-align:start;}
.am-kf-media{position:relative;width:100%;aspect-ratio:9/16;background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.am-kf-media img,.am-kf-media video{width:100%;height:100%;object-fit:cover;}
.am-kf-idx{position:absolute;top:7px;left:7px;background:rgba(0,0,0,.6);color:${GOLD};font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;}
.am-kf-badge{position:absolute;bottom:7px;right:7px;font-size:9px;padding:2px 7px;border-radius:10px;background:rgba(0,0,0,.6);}
.am-kf-badge.vid{color:${CYAN};border:1px solid rgba(0,229,255,.4);}
.am-spin{width:30px;height:30px;border:3px solid rgba(0,229,255,.2);border-top-color:${CYAN};border-radius:50%;animation:am-rot .8s linear infinite;}
@keyframes am-rot{to{transform:rotate(360deg)}}
.am-kf-fail{font-size:11px;color:#ff9b9b;text-align:center;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;}
.am-kf-gen{display:flex;flex-direction:column;align-items:center;gap:9px;padding:12px;text-align:center;}
.am-kf-gen-txt{font-size:11px;color:rgba(0,229,255,.8);letter-spacing:.02em;line-height:1.4;}
.am-kf-gen-sub{font-size:9.5px;color:rgba(255,255,255,.42);line-height:1.45;max-width:150px;}
.am-kf-prompt{display:flex;flex-direction:column;gap:8px;padding:32px 11px 11px;height:100%;box-sizing:border-box;overflow:hidden;}
.am-kf-note{font-size:8.5px;line-height:1.4;color:#F4E2B6;background:rgba(212,168,67,.16);border:1px solid rgba(212,168,67,.45);border-radius:7px;padding:6px 7px;font-weight:500;letter-spacing:.01em;flex-shrink:0;}
.am-kf-prompt-lbl{font-size:10.5px;letter-spacing:.03em;color:${GOLD};font-weight:600;line-height:1.3;}
.am-kf-copyimg{border:1px solid rgba(212,168,67,.55);background:rgba(212,168,67,.16);color:${GOLD};border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.am-kf-prompt-txt{font-size:9.5px;line-height:1.45;color:rgba(255,255,255,.52);overflow-y:auto;flex:1;white-space:pre-wrap;border-top:1px solid rgba(255,255,255,.08);padding-top:7px;}
.am-kf-retrybtn{margin-top:4px;border:1px solid rgba(212,168,67,.5);background:rgba(212,168,67,.12);color:${GOLD};border-radius:7px;padding:6px 12px;font-size:11px;cursor:pointer;}
.am-kf-retrybtn:disabled{opacity:.5;cursor:default;}
.am-kf-body{padding:10px;display:flex;flex-direction:column;gap:8px;}
.am-kf-beat{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${GOLD};}
.am-kf-copy{font-size:12.5px;color:#fff;line-height:1.35;font-style:italic;min-height:18px;}
.am-kf-anim{font-size:11px;color:rgba(255,255,255,.5);line-height:1.4;background:rgba(0,0,0,.22);border-radius:7px;padding:7px 8px;max-height:64px;overflow-y:auto;}
.am-grok-hint{font-size:11.5px;line-height:1.5;color:rgba(255,255,255,.6);background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.18);border-radius:9px;padding:8px 11px;margin-bottom:9px;}
.am-grok-hint strong{color:${CYAN};font-weight:600;}
.am-kf-actions{display:flex;flex-direction:column;gap:6px;margin-top:2px;}
.am-btn{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.03);color:rgba(255,255,255,.82);border-radius:8px;padding:8px;font-size:11.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:.15s;width:100%;}
.am-btn:hover{border-color:rgba(212,168,67,.5);color:${GOLD};}
.am-btn:disabled{opacity:.45;cursor:default;}
.am-btn.cyan:hover{border-color:rgba(0,229,255,.5);color:${CYAN};}
.am-btn.copied{border-color:${GOLD};color:${GOLD};}
.am-kf-regen{display:flex;flex-direction:column;gap:5px;}
.am-kf-regen-lbl{font-size:10px;letter-spacing:.04em;color:rgba(255,255,255,.42);text-transform:uppercase;}
.am-kf-regen-btns{display:flex;gap:6px;}
.am-kf-regen-btns .am-btn{flex:1;width:auto;min-width:0;padding:8px 4px;font-size:11px;}
.am-sep{height:1px;background:rgba(255,255,255,.08);margin:2px 0;}
.am-draft-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.am-allbtn{border:none;border-radius:11px;padding:12px 18px;cursor:pointer;background:linear-gradient(135deg,${CYAN},#0096a8);color:#04181c;font-size:13px;font-weight:700;transition:.18s;}
.am-allbtn:disabled{opacity:.4;cursor:default;background:rgba(255,255,255,.08);color:rgba(255,255,255,.4);}
.am-foot-meta{font-size:11.5px;color:rgba(255,255,255,.45);}
.am-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:rgba(15,18,28,.96);border:1px solid rgba(212,168,67,.4);color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;z-index:2147483646;box-shadow:0 10px 40px rgba(0,0,0,.5);}
/* ── Colectivos del Universo (gestión) ── */
.am-col-section{border:1px solid rgba(0,229,255,.22);border-radius:14px;background:rgba(0,229,255,.03);overflow:hidden;}
.am-col-toggle{width:100%;display:flex;align-items:center;gap:10px;border:none;background:transparent;color:#fff;font-size:14px;font-weight:600;padding:15px 17px;cursor:pointer;text-align:left;}
.am-col-toggle .ch{margin-left:auto;color:rgba(255,255,255,.45);font-size:12px;transition:.2s;}
.am-col-toggle .cnt{font-size:11px;font-weight:500;color:rgba(0,229,255,.7);}
.am-col-body{padding:0 17px 18px;display:flex;flex-direction:column;gap:14px;}
.am-col-intro{font-size:12.5px;line-height:1.55;color:rgba(255,255,255,.6);max-width:760px;margin:0;}
.am-col-add{align-self:flex-start;border:1px solid rgba(0,229,255,.5);background:rgba(0,229,255,.1);color:${CYAN};border-radius:10px;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;}
.am-col-add:hover{background:rgba(0,229,255,.18);}
.am-col-form{border:1px solid rgba(212,168,67,.3);border-radius:13px;padding:15px;background:rgba(212,168,67,.04);display:flex;flex-direction:column;gap:11px;}
.am-col-form-top{display:flex;gap:14px;align-items:flex-start;}
.am-col-thumb{position:relative;flex:0 0 92px;width:92px;height:122px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;}
.am-col-thumb img{width:100%;height:100%;object-fit:cover;}
.am-col-thumb-ph{color:rgba(255,255,255,.28);font-size:26px;}
.am-col-thumb-ov{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
.am-col-upcol{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;justify-content:center;}
.am-col-uphint{font-size:11px;color:rgba(255,255,255,.5);line-height:1.45;}
.am-col-visionnote{margin-top:2px;padding:9px 11px;border-radius:8px;background:rgba(255,179,0,.12);border:1px solid rgba(255,179,0,.34);color:#ffd27a;font-size:11.5px;line-height:1.45;}
.am-col-lbl{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.5);}
.am-col-input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:8px;padding:9px 11px;font-size:13px;font-family:inherit;}
.am-col-input:focus{outline:none;border-color:${GOLD};}
.am-col-ta{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:8px;padding:9px 11px;font-size:12.5px;line-height:1.5;font-family:inherit;resize:vertical;min-height:78px;}
.am-col-ta:focus{outline:none;border-color:${GOLD};}
.am-col-field{display:flex;flex-direction:column;gap:5px;}
.am-col-form-btns{display:flex;gap:9px;margin-top:3px;}
.am-col-list{display:flex;flex-direction:column;gap:9px;}
.am-col-card{display:flex;gap:12px;align-items:center;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:11px;background:rgba(255,255,255,.02);}
.am-col-card.off{opacity:.55;}
.am-col-card-thumb{flex:0 0 46px;width:46px;height:60px;border-radius:8px;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;}
.am-col-card-thumb img{width:100%;height:100%;object-fit:cover;}
.am-col-card-thumb span{color:rgba(0,229,255,.4);font-size:18px;}
.am-col-card-info{flex:1;min-width:0;}
.am-col-card-name{font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.am-col-tag{font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:20px;border:1px solid rgba(0,229,255,.32);color:${CYAN};font-weight:500;}
.am-col-tag.off{border-color:rgba(255,255,255,.22);color:rgba(255,255,255,.5);}
.am-col-card-traits{font-size:11.5px;line-height:1.45;color:rgba(255,255,255,.55);margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.am-col-card-actions{display:flex;flex-direction:column;gap:5px;flex-shrink:0;}
.am-col-act{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.03);color:rgba(255,255,255,.78);border-radius:7px;padding:6px 11px;font-size:11px;cursor:pointer;white-space:nowrap;transition:.15s;}
.am-col-act:hover{border-color:rgba(212,168,67,.5);color:${GOLD};}
.am-col-act.danger:hover{border-color:rgba(255,90,90,.5);color:#ff9b9b;}
.am-col-empty{font-size:12.5px;color:rgba(255,255,255,.4);padding:8px 2px;}
.am-col-gendiv{font-size:11px;color:rgba(255,255,255,.4);text-align:center;letter-spacing:.04em;margin:4px 0 1px;}
.am-col-brief{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:8px;padding:8px 10px;font-size:12px;line-height:1.45;font-family:inherit;resize:vertical;min-height:46px;}
.am-col-brief:focus{outline:none;border-color:${GOLD};}
.am-col-genbtn{align-self:flex-start;border:1px solid rgba(212,168,67,.55);background:rgba(212,168,67,.14);color:${GOLD};border-radius:10px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;}
.am-col-genbtn:hover:not(:disabled){background:rgba(212,168,67,.22);}
.am-col-genbtn:disabled{opacity:.5;cursor:default;}
.am-col-genout{border:1px solid rgba(212,168,67,.4);border-radius:11px;background:rgba(212,168,67,.05);padding:11px 12px;display:flex;flex-direction:column;gap:8px;}
.am-col-genout-head{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.am-col-genout-lbl{font-size:11px;letter-spacing:.03em;color:${GOLD};font-weight:600;line-height:1.3;}
.am-col-genout-copy{flex-shrink:0;border:1px solid rgba(212,168,67,.55);background:rgba(212,168,67,.16);color:${GOLD};border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;transition:.15s;}
.am-col-genout-copy:hover{background:rgba(212,168,67,.26);}
.am-col-genout-txt{font-size:11px;line-height:1.5;color:rgba(255,255,255,.62);white-space:pre-wrap;background:rgba(0,0,0,.22);border-radius:8px;padding:10px 11px;max-height:240px;overflow-y:auto;}

/* ════════ TEMA CLARO "VTLI" (estilo veotuluzinterna.com) — overrides ════════ */
.am-intro,.am-col-intro{color:#545C66}
.am-controls{border:1px solid rgba(168,116,24,0.28);background:#FFFFFF;box-shadow:0 6px 22px rgba(60,82,115,0.08)}
.am-field-lbl,.am-cap-lbl,.am-col-lbl,.am-kf-regen-lbl{color:#6B7480}
.am-seg{background:#EEF1F5}
.am-seg button{color:#5E6772}
.am-seg button.on{background:rgba(168,116,24,0.18);color:#8A6418}
.am-draft,.am-kf,.am-col-card,.am-col-section,.am-col-form{background:#FFFFFF;border:1px solid rgba(60,82,115,0.12)}
.am-draft-title,.am-kf-copy,.am-col-card-name,.am-col-toggle{color:#2E333C}
.am-draft-target,.am-foot-meta,.am-col-card-traits,.am-col-uphint,.am-kf-gen-sub,.am-cover-ph,.am-col-empty,.am-voices-mgr-hint{color:#7A828C}
.am-pill{border-color:rgba(60,82,115,0.18);color:#5E6772}
.am-cap,.am-kf-anim{color:#4A515B;background:#F4F6F8}
.am-narr{border-color:rgba(168,116,24,0.32);background:rgba(212,168,67,0.06)}
.am-narr-text{color:#3A3F48}
.am-iconbtn,.am-take-btn,.am-col-act,.am-btn,.am-pub{border:1px solid rgba(60,82,115,0.16);background:#FFFFFF;color:#545C66}
.am-vchip,.am-take{background:#F4F6F8;color:#3A3F48}
.am-select,.am-voice-select,.am-narr-edit,.am-col-input,.am-col-ta,.am-vinput{background:#FFFFFF;border:1px solid rgba(60,82,115,0.18);color:#2E333C}
.am-kf-media,.am-cover-box,.am-col-thumb,.am-col-card-thumb{background:#EAEEF2;border-color:rgba(60,82,115,0.16)}
.am-kf-prompt-txt{color:#5E6772;border-top-color:rgba(60,82,115,0.1)}
.am-kf-note{color:#7A5A12;background:rgba(212,168,67,.16);border-color:rgba(168,116,24,.5)}
.am-grok-hint{color:#4A515B;background:rgba(94,137,176,0.08);border-color:rgba(94,137,176,0.25)}
.am-grok-hint strong,.am-cap-tags,.am-voice-hint,.am-pill.cat,.am-pill.meta,.am-voices-mgr-title,.am-kf-gen-txt,.am-col-tag,.am-col-toggle .cnt{color:#3F6E96}
.am-pill.st,.am-narr-lbl,.am-take-name,.am-kf-beat,.am-kf-prompt-lbl,.am-mini,.am-kf-copyimg,.am-kf-retrybtn,.am-btn.copied{color:#A9781F}
.am-voices-mgr{border-color:rgba(94,137,176,0.25);background:rgba(94,137,176,0.05)}
.am-sep{background:rgba(60,82,115,0.1)}
.am-empty{color:#8A929C}
.am-toggle,.am-mini.ghost{color:#6B7480}
.am-toast{background:#FFFFFF;border-color:rgba(168,116,24,0.4);color:#2E333C;box-shadow:0 10px 40px rgba(60,82,115,0.2)}
.am-voice{border-top-color:rgba(168,116,24,0.2)}
.am-col-gendiv{color:#8A929C}
.am-col-visionnote{background:rgba(184,134,11,0.10);border-color:rgba(184,134,11,0.40);color:#7A5B00}
.am-col-brief{background:#FFFFFF;border:1px solid rgba(60,82,115,0.18);color:#2E333C}
.am-col-genbtn{border-color:rgba(168,116,24,.5);background:rgba(212,168,67,.12);color:#A9781F}
.am-col-genbtn:hover:not(:disabled){background:rgba(212,168,67,.2)}
.am-col-genout{border-color:rgba(168,116,24,.32);background:rgba(212,168,67,.06)}
.am-col-genout-lbl,.am-col-genout-copy{color:#A9781F}
.am-col-genout-copy{border-color:rgba(168,116,24,.5);background:rgba(212,168,67,.14)}
.am-col-genout-txt{color:#4A515B;background:#F4F6F8}
`

/* ═══════════════════════════════════════════════════════════════
   3. KEYFRAME CARD
   ═══════════════════════════════════════════════════════════════ */

// Limpia el recordatorio humano "⚠️ ESTE CUADRO #1 DEFINE AL SER — SUBE LA IMAGEN
// DEL COLECTIVO…" que los storyboards VIEJOS traían incrustado en el prompt. El
// edge v1.35 ya no lo inyecta; esto deja limpios también los prompts previos para
// que el copy-paste a Nano Banana sea solo el prompt. (La nota se muestra aparte.)
function stripColectivoClause(text: string): string {
    if (!text) return text
    return text
        .replace(
            /\n*⚠️\s*ESTE CUADRO #1 DEFINE AL SER[\s\S]*?como referencia\.\s*/g,
            "\n\n"
        )
        .trim()
}

function KeyframeCard({
    kf,
    colectivoName,
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    draftStatus,
    draftStale,
    autoRescuing,
    onAfterChange,
    notify,
}: {
    kf: Keyframe
    colectivoName: string | null
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string
    draftStatus: string
    draftStale: boolean
    autoRescuing: boolean
    onAfterChange: () => void
    notify: (m: string) => void
}) {
    const [copied, setCopied] = useState(false)
    const [copiedImg, setCopiedImg] = useState(false)
    const [busy, setBusy] = useState(false)
    const [regenPending, setRegenPending] = useState(false)

    const hasImage = !!kf.image_r2_url
    const hasVideo = !!kf.video_r2_url
    const animating = kf.anim_status === "animating"
    // Modo "solo prompts": no hay imagen; mostramos el prompt para copiar a mano.
    const isPromptsOnly = draftStatus === "prompts_ready"

    // El cuadro está TRABADO y rescatable si no tiene imagen y o bien el
    // storyboard ya terminó (falló su generación) o lleva demasiado tiempo
    // atascado (la tarea de fondo murió y el draft quedó en "generando"
    // para siempre). Distinto de "regenerando" (regenPending) y del spinner
    // legítimo de los primeros minutos.
    const imageFailed =
        !hasImage &&
        !hasVideo &&
        !regenPending &&
        !autoRescuing &&
        (draftStatus !== "generating" || draftStale)

    // La nueva imagen llegó → corta el spinner de regeneración.
    useEffect(() => {
        if (kf.image_r2_url) setRegenPending(false)
    }, [kf.image_r2_url])

    // Red de seguridad: si una regeneración no devuelve imagen en 2 min,
    // deja de spinear y vuelve a mostrar Reintentar.
    useEffect(() => {
        if (!regenPending) return
        const t = setTimeout(() => setRegenPending(false), 120000)
        return () => clearTimeout(t)
    }, [regenPending])

    const copyPrompt = useCallback(() => {
        try {
            navigator.clipboard?.writeText(kf.prompt_animation || "")
        } catch {}
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
    }, [kf.prompt_animation])

    // El prompt que se copia/pega va LIMPIO (sin el recordatorio humano del
    // colectivo, que se muestra como nota aparte).
    const cleanImagePrompt = stripColectivoClause(kf.prompt_image || "")
    const showColectivoNote =
        isPromptsOnly && kf.beat_index === 0 && !!colectivoName

    const copyImagePrompt = useCallback(() => {
        try {
            navigator.clipboard?.writeText(cleanImagePrompt)
        } catch {}
        setCopiedImg(true)
        setTimeout(() => setCopiedImg(false), 1600)
    }, [cleanImagePrompt])

    const downloadFrame = useCallback(() => {
        if (!kf.image_r2_url) return
        downloadViaProxy(
            supabaseUrl,
            supabaseAnonKey,
            kf.image_r2_url,
            `keyframe_${kf.beat_index}.png`
        )
    }, [kf.image_r2_url, kf.beat_index, supabaseUrl, supabaseAnonKey])

    const downloadClip = useCallback(() => {
        if (!kf.video_r2_url) return
        downloadViaProxy(
            supabaseUrl,
            supabaseAnonKey,
            kf.video_r2_url,
            `clip_${kf.beat_index}.mp4`
        )
    }, [kf.video_r2_url, kf.beat_index, supabaseUrl, supabaseAnonKey])

    const animateApi = useCallback(async () => {
        setBusy(true)
        const r = await callEdge(supabaseUrl, supabaseAnonKey, "animate-vtli-keyframe", {
            admin_clerk_id: clerkUserId,
            keyframe_id: kf.id,
        })
        setBusy(false)
        if (r.ok) {
            notify("Animando por API (LTX-2)… el clip aparecerá en ~1 min")
            onAfterChange()
        } else {
            notify(`No se pudo animar: ${r.body?.error ?? r.status}`)
        }
    }, [kf.id, supabaseUrl, supabaseAnonKey, clerkUserId, notify, onAfterChange])

    const regenImage = useCallback(
        async (variation: "ligera" | "grande" | "fresh") => {
            setRegenPending(true)
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "generate-vtli-storyboard",
                {
                    admin_clerk_id: clerkUserId,
                    retry_keyframe_image_for_id: kf.id,
                    retry_variation: variation,
                }
            )
            if (r.ok) {
                notify(
                    variation === "grande"
                        ? "Regenerando cuadro con variación grande…"
                        : variation === "fresh"
                        ? "Generando el cuadro que faltaba…"
                        : "Regenerando cuadro con variación ligera…"
                )
                onAfterChange()
                // regenPending se resetea cuando llega la imagen nueva (useEffect).
            } else {
                setRegenPending(false)
                notify(
                    `No se pudo regenerar: ${r.body?.error ?? r.status}`
                )
            }
        },
        [kf.id, supabaseUrl, supabaseAnonKey, clerkUserId, notify, onAfterChange]
    )

    return (
        <div className="am-kf">
            <div className="am-kf-media">
                {hasVideo ? (
                    <video
                        src={kf.video_r2_url!}
                        muted
                        loop
                        playsInline
                        autoPlay
                    />
                ) : hasImage ? (
                    <img src={kf.image_r2_url!} alt={kf.beat_label} />
                ) : isPromptsOnly ? (
                    <div className="am-kf-prompt">
                        {showColectivoNote && (
                            <div className="am-kf-note">
                                👤 Antes de generar: sube a Nano Banana la imagen
                                del colectivo «{colectivoName}» y copia SOLO sus
                                rasgos de especie (color/textura, ojos, orejas,
                                nariz, proporciones). No clones al individuo de la
                                foto.
                            </div>
                        )}
                        <div className="am-kf-prompt-lbl">
                            📋 Prompt de imagen — pégalo en Nano Banana
                        </div>
                        <button
                            className="am-kf-copyimg"
                            onClick={copyImagePrompt}
                        >
                            {copiedImg ? "Copiado ✓" : "Copiar prompt"}
                        </button>
                        <div className="am-kf-prompt-txt">
                            {cleanImagePrompt}
                        </div>
                    </div>
                ) : imageFailed ? (
                    <div className="am-kf-fail">
                        <div>
                            {draftStatus === "payment_error"
                                ? "⚠ Error de pago"
                                : "⚠ No se generó"}
                        </div>
                        <button
                            className="am-kf-retrybtn"
                            disabled={regenPending}
                            onClick={() => regenImage("fresh")}
                        >
                            ↻ Reintentar
                        </button>
                    </div>
                ) : (
                    <div className="am-kf-gen">
                        <div className="am-spin" />
                        <div className="am-kf-gen-txt">
                            {regenPending
                                ? "Regenerando…"
                                : autoRescuing
                                ? "Generando… se reintenta solo"
                                : "Generando…"}
                        </div>
                        {(autoRescuing || regenPending) && (
                            <div className="am-kf-gen-sub">
                                Se completa solo. Si la IA está saturada
                                puede tardar varios minutos.
                            </div>
                        )}
                    </div>
                )}
                <span className="am-kf-idx">#{kf.beat_index + 1}</span>
                {hasVideo && <span className="am-kf-badge vid">▶ clip</span>}
            </div>
            <div className="am-kf-body">
                <span className="am-kf-beat">{kf.beat_label}</span>
                {kf.copy_line ? (
                    <span className="am-kf-copy">"{kf.copy_line}"</span>
                ) : null}

                {hasImage && (
                    <>
                        <div className="am-kf-anim">{kf.prompt_animation}</div>
                        <div className="am-kf-actions">
                            <button
                                className={`am-btn ${copied ? "copied" : ""}`}
                                onClick={copyPrompt}
                            >
                                {copied ? "Copiado ✓" : "📋 Copiar prompt"}
                            </button>
                            <button className="am-btn" onClick={downloadFrame}>
                                ⬇ Descargar cuadro
                            </button>
                            <div className="am-kf-regen">
                                <span className="am-kf-regen-lbl">
                                    ↻ Regenerar imagen
                                </span>
                                <div className="am-kf-regen-btns">
                                    <button
                                        className="am-btn"
                                        disabled={regenPending}
                                        title="Misma escena y personaje, variación sutil"
                                        onClick={() => regenImage("ligera")}
                                    >
                                        Ligera
                                    </button>
                                    <button
                                        className="am-btn"
                                        disabled={regenPending}
                                        title="Mismo personaje y escena, cambio notorio de ángulo y pose"
                                        onClick={() => regenImage("grande")}
                                    >
                                        Grande
                                    </button>
                                </div>
                            </div>
                            <div className="am-sep" />
                            {hasVideo ? (
                                <button
                                    className="am-btn cyan"
                                    onClick={downloadClip}
                                >
                                    ⬇ Descargar clip
                                </button>
                            ) : (
                                <button
                                    className="am-btn cyan"
                                    disabled={busy || animating}
                                    onClick={animateApi}
                                >
                                    {animating
                                        ? "Animando…"
                                        : "✨ Animar por API (opcional)"}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {isPromptsOnly && (
                    <>
                        <div className="am-kf-anim">
                            {kf.prompt_animation}
                        </div>
                        <button
                            className={`am-btn ${copied ? "copied" : ""}`}
                            onClick={copyPrompt}
                        >
                            {copied
                                ? "Copiado ✓"
                                : "📋 Copiar prompt de animación (Grok)"}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   4. DRAFT (STORYBOARD) CARD
   ═══════════════════════════════════════════════════════════════ */

function DraftCard({
    draft,
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    voices,
    selectedVoiceId,
    codices,
    onAfterChange,
    onPatchDraft,
    onDelete,
    notify,
}: {
    draft: Draft
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string
    voices: VoiceOpt[]
    selectedVoiceId: string
    codices: { id: string; title: string }[]
    onAfterChange: () => void
    onPatchDraft: (id: string, patch: Partial<Draft>) => void
    onDelete: (id: string) => void
    notify: (m: string) => void
}) {
    const [showCap, setShowCap] = useState(false)
    const [narrCopied, setNarrCopied] = useState(false)
    const [voiceBusy, setVoiceBusy] = useState(false)
    // Portada del storyboard (Zak sube su keyframe #1 para ubicarlo visualmente).
    const [coverBusy, setCoverBusy] = useState(false)
    const [coverDragOver, setCoverDragOver] = useState(false)
    const coverInputRef = useRef<HTMLInputElement>(null)
    // Edición de la narración antes de vocalizarla.
    const [editingNarr, setEditingNarr] = useState(false)
    const [narrText, setNarrText] = useState("")
    const [narrSaving, setNarrSaving] = useState(false)
    // Voz elegida para ESTE storyboard. Arranca con la predeterminada del
    // panel y se puede cambiar por tarjeta (ej. regenerar con otra voz).
    const [voiceId, setVoiceId] = useState(selectedVoiceId)
    const kfs = draft.keyframes || []
    const animatedCount = kfs.filter((k) => !!k.video_r2_url).length
    const allReady = kfs.length > 0 && animatedCount === kfs.length
    // El draft está "viejo y atascado" si se generó hace más de 3 min y sigue
    // sin completar. Sirve para mostrar Reintentar aunque el estado siga
    // "generando" (la tarea de fondo del servidor murió sin marcar terminado).
    const draftStale =
        !!draft.generated_at &&
        Date.now() - new Date(draft.generated_at).getTime() > 180000
    // El draft es RECIENTE (< 20 min) y todavía en un estado donde sus cuadros
    // vacíos se completan solos (generación inicial o rescate automático serial
    // del panel). Durante esta ventana un cuadro vacío muestra "Generando…" en
    // vez de "No se generó" — el sistema lo reintenta solo (Nano Banana, a veces
    // saturada, puede tardar). Pasada la ventana, el cuadro pasa a Reintentar.
    const draftRecent =
        !!draft.generated_at &&
        Date.now() - new Date(draft.generated_at).getTime() < 20 * 60 * 1000
    const autoRescuing =
        draftRecent &&
        (draft.status === "generating" ||
            draft.status === "storyboard_ready")

    const downloadAll = useCallback(() => {
        const withVideo = kfs.filter((k) => !!k.video_r2_url)
        withVideo.forEach((k, i) => {
            setTimeout(() => {
                downloadViaProxy(
                    supabaseUrl,
                    supabaseAnonKey,
                    k.video_r2_url!,
                    `${draft.concept_title.replace(/\s+/g, "_")}_${String(
                        k.beat_index + 1
                    ).padStart(2, "0")}.mp4`
                )
            }, i * 700)
        })
        notify(`Descargando ${withVideo.length} clips en orden…`)
    }, [kfs, draft.concept_title, supabaseUrl, supabaseAnonKey, notify])

    const handleDelete = useCallback(async () => {
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "delete_vtli_draft",
            { p_admin_clerk_id: clerkUserId, p_draft_id: draft.id }
        )
        if (r?.success) {
            onDelete(draft.id)
            notify("Storyboard borrado")
        } else {
            notify("No se pudo borrar")
        }
    }, [draft.id, supabaseUrl, supabaseAnonKey, clerkUserId, onDelete, notify])

    const copyNarration = useCallback(() => {
        try {
            navigator.clipboard?.writeText(draft.narration || "")
        } catch {}
        setNarrCopied(true)
        setTimeout(() => setNarrCopied(false), 1500)
    }, [draft.narration])

    const startEditNarr = useCallback(() => {
        setNarrText(draft.narration || "")
        setEditingNarr(true)
    }, [draft.narration])

    const cancelEditNarr = useCallback(() => {
        setEditingNarr(false)
    }, [])

    const saveNarr = useCallback(async () => {
        const text = narrText.trim()
        if (!text) {
            notify("La narración no puede quedar vacía")
            return
        }
        setNarrSaving(true)
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "update_vtli_draft_narration",
            {
                p_admin_clerk_id: clerkUserId,
                p_draft_id: draft.id,
                p_narration: text,
            }
        )
        setNarrSaving(false)
        if (r?.success) {
            // Optimista: refleja el texto editado al instante (lo que se
            // copia y lo que vocaliza ElevenLabs, que lee fresco de la DB).
            onPatchDraft(draft.id, { narration: text })
            setEditingNarr(false)
            notify("Narración guardada · ya puedes generar la voz")
        } else {
            notify("No se pudo guardar la narración")
        }
    }, [
        narrText,
        draft.id,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        onPatchDraft,
        notify,
    ])

    // Regenerar la narración con IA: pide otra versión de la voz en off (no toca
    // los visuales). El selector de códice arranca en el del draft; se puede
    // saltar a otro libro o a "Sexta Densidad" (sin códice).
    const [regenOpen, setRegenOpen] = useState(false)
    const [regenBusy, setRegenBusy] = useState(false)
    const [regenCodiceId, setRegenCodiceId] = useState<string | null>(
        draft.codice_id ?? null
    )

    const regenNarration = useCallback(async () => {
        if (regenBusy) return
        setRegenBusy(true)
        try {
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "generate-vtli-storyboard",
                {
                    admin_clerk_id: clerkUserId,
                    regenerate_narration_for_id: draft.id,
                    codice_id: regenCodiceId,
                }
            )
            if (r.ok && r.body?.narration) {
                onPatchDraft(draft.id, {
                    narration: r.body.narration as string,
                    codice_id: (r.body.codice_id as string | null) ?? null,
                    ...(r.body.pulso_nucleo
                        ? { pulso_nucleo: r.body.pulso_nucleo as string }
                        : {}),
                })
                setEditingNarr(false)
                setRegenOpen(false)
                notify("Narración regenerada · ya puedes generar la voz")
            } else {
                notify(
                    `No se pudo regenerar: ${
                        r.body?.error ?? r.body?.detail ?? "error " + r.status
                    }`
                )
            }
        } catch {
            notify("No se pudo conectar con el generador. Reintenta.")
        } finally {
            setRegenBusy(false)
        }
    }, [
        regenBusy,
        regenCodiceId,
        draft.id,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        onPatchDraft,
        notify,
    ])

    // Tomas de voz acumuladas (la última se generó al final de la lista).
    const takes = draft.narration_takes_json || []

    const generarVoz = useCallback(async () => {
        if (!voiceId) {
            notify("Elige una voz primero")
            return
        }
        const v = voices.find((x) => x.voice_id === voiceId)
        setVoiceBusy(true)
        notify("Generando voz con ElevenLabs…")
        const r = await callEdge(
            supabaseUrl,
            supabaseAnonKey,
            "generar-narracion-voz",
            {
                admin_clerk_id: clerkUserId,
                draft_id: draft.id,
                voice_id: voiceId,
                voice_name: v?.name ?? voiceId,
                voice_settings: v?.settings ?? null,
                model_id: v?.model_id ?? null,
            }
        )
        setVoiceBusy(false)
        if (r.ok) {
            notify("Voz lista ✓ · se sumó como una toma")
            // Optimista: refleja la lista de tomas devuelta por la edge.
            if (Array.isArray(r.body?.takes)) {
                onPatchDraft(draft.id, {
                    narration_takes_json: r.body.takes,
                    narration_audio_url:
                        r.body.narration_audio_url ??
                        draft.narration_audio_url,
                })
            } else {
                onAfterChange()
            }
        } else {
            const err = String(r.body?.error ?? "")
            const esEleven = /elevenlabs|empty_audio/i.test(err)
            notify(
                esEleven
                    ? "Problemas con tu suscripción de ElevenLabs — revisa los créditos o la llave de tu cuenta."
                    : `No se pudo generar la voz: ${
                          r.body?.error ?? r.body?.detail ?? r.status
                      }`
            )
        }
    }, [
        voiceId,
        voices,
        draft.id,
        draft.narration_audio_url,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        notify,
        onAfterChange,
        onPatchDraft,
    ])

    const removeTake = useCallback(
        async (idx: number) => {
            const cur = draft.narration_takes_json || []
            const next = cur.filter((_, i) => i !== idx)
            // Optimista: saca la toma y reapunta la "última" al final restante.
            onPatchDraft(draft.id, {
                narration_takes_json: next,
                narration_audio_url: next.length
                    ? next[next.length - 1].audio_url
                    : null,
            })
            await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "set_vtli_draft_narration_takes",
                {
                    p_admin_clerk_id: clerkUserId,
                    p_draft_id: draft.id,
                    p_takes: next,
                }
            )
        },
        [
            draft.id,
            draft.narration_takes_json,
            supabaseUrl,
            supabaseAnonKey,
            clerkUserId,
            onPatchDraft,
        ]
    )

    const downloadTake = useCallback(
        (t: NarrationTake, idx: number) => {
            downloadViaProxy(
                supabaseUrl,
                supabaseAnonKey,
                t.audio_url,
                `narracion_${draft.concept_title.replace(/\s+/g, "_")}_${String(
                    idx + 1
                ).padStart(2, "0")}_${(t.voice_name || "voz").replace(
                    /\s+/g,
                    "_"
                )}.mp3`
            )
        },
        [supabaseUrl, supabaseAnonKey, draft.concept_title]
    )

    const togglePublished = useCallback(async () => {
        const next = !draft.is_published
        onPatchDraft(draft.id, { is_published: next })
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "set_vtli_draft_published",
            {
                p_admin_clerk_id: clerkUserId,
                p_draft_id: draft.id,
                p_published: next,
            }
        )
        if (!r?.success) {
            onPatchDraft(draft.id, { is_published: !next })
            notify("No se pudo cambiar Publicado")
        }
    }, [
        draft.id,
        draft.is_published,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        onPatchDraft,
        notify,
    ])

    const uploadCover = useCallback(
        async (file: File | null) => {
            if (!file) return
            setCoverBusy(true)
            try {
                const { base64, mime } = await resizeImageToBase64(file, 800)
                const r = await callEdge(
                    supabaseUrl,
                    supabaseAnonKey,
                    "upload-vtli-draft-cover",
                    {
                        admin_clerk_id: clerkUserId,
                        draft_id: draft.id,
                        image_base64: base64,
                        image_mime: mime,
                    }
                )
                if (r.ok && r.body?.cover_image_url) {
                    onPatchDraft(draft.id, {
                        cover_image_url: r.body.cover_image_url,
                    })
                    notify("Portada lista ✓")
                } else {
                    notify(
                        `No se pudo subir la portada: ${
                            r.body?.error ?? r.status
                        }`
                    )
                }
            } catch (e: any) {
                notify(`No se pudo subir la portada: ${e?.message ?? e}`)
            } finally {
                setCoverBusy(false)
                if (coverInputRef.current) coverInputRef.current.value = ""
            }
        },
        [draft.id, supabaseUrl, supabaseAnonKey, clerkUserId, onPatchDraft, notify]
    )

    return (
        <motion.div
            className="am-draft"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="am-draft-head">
                <div className="am-draft-titles">
                    <div className="am-pills">
                        <span className="am-pill cat">
                            {draft.category === "zakhaar"
                                ? "Zak'Haar"
                                : "VEO"}
                        </span>
                        {draft.format === "episodio" && (
                            <span className="am-pill st">
                                🎬 EPISODIO ·{" "}
                                {fmtMinSec(draft.target_duration_sec || 0)}
                            </span>
                        )}
                        <span
                            className={
                                draft.status === "payment_error"
                                    ? "am-pill err"
                                    : "am-pill st"
                            }
                        >
                            {draft.status === "generating"
                                ? "generando…"
                                : draft.status === "storyboard_ready"
                                ? "listo"
                                : draft.status === "payment_error"
                                ? "error de pago"
                                : draft.status}
                        </span>
                        <span className="am-pill">
                            {draft.target_duration_sec}s · {kfs.length} cuadros
                        </span>
                        <span
                            className="am-pill meta"
                            title="Colectivo (civilización) usado al generar"
                        >
                            {draft.colectivo_name
                                ? `👤 ${draft.colectivo_name}`
                                : "👤 Colectivo auto"}
                        </span>
                        <span
                            className="am-pill meta"
                            title="Ambiente (escenario) usado al generar"
                        >
                            {draft.ambiente_name
                                ? `🌐 ${draft.ambiente_name}`
                                : "🌐 Ambiente auto"}
                        </span>
                        <button
                            type="button"
                            className={`am-pub${draft.is_published ? " on" : ""}`}
                            onClick={togglePublished}
                            title={
                                draft.is_published
                                    ? "Marcado como publicado — toca para desmarcar"
                                    : "Marcar como publicado"
                            }
                        >
                            {draft.is_published
                                ? "✓ Publicado"
                                : "○ Publicado"}
                        </button>
                    </div>
                    <p className="am-draft-title">{draft.concept_title}</p>
                    {draft.target ? (
                        <p className="am-draft-target">{draft.target}</p>
                    ) : null}
                </div>
                <div className="am-cover">
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                            uploadCover(e.target.files?.[0] ?? null)
                        }
                    />
                    <button
                        type="button"
                        className={`am-cover-box${coverDragOver ? " am-drag-over" : ""}`}
                        disabled={coverBusy}
                        onClick={() => coverInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault()
                            if (!coverDragOver) setCoverDragOver(true)
                        }}
                        onDragLeave={() => setCoverDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setCoverDragOver(false)
                            const f = e.dataTransfer?.files?.[0]
                            if (f && f.type.startsWith("image/")) uploadCover(f)
                        }}
                        title={
                            draft.cover_image_url
                                ? "Cambiar portada — clic o arrastra una imagen aquí"
                                : "Subir tu keyframe #1 como portada — clic o arrastra una imagen aquí"
                        }
                    >
                        {coverBusy ? (
                            <span className="am-spin" />
                        ) : draft.cover_image_url ? (
                            <img
                                src={draft.cover_image_url}
                                alt="portada"
                            />
                        ) : (
                            <span className="am-cover-ph">
                                ⬆<br />
                                Portada
                            </span>
                        )}
                    </button>
                </div>
                <button
                    className="am-iconbtn"
                    title="Borrar storyboard"
                    onClick={handleDelete}
                >
                    ✕
                </button>
            </div>

            {draft.status === "payment_error" && (
                <div className="am-payerr">
                    <span>⚠</span>
                    <span>
                        <strong>Error de pago.</strong> El generador de imágenes
                        está bloqueado por un problema de facturación en tu
                        cuenta de Gemini (Google Cloud). Revisa el método de
                        pago; al resolverlo, toca Reintentar en cada cuadro.
                    </span>
                </div>
            )}

            {/* Narración · voz en off — sección dedicada, siempre visible.
                Acá lees la narración, miras los cuadros y eliges la voz. */}
            {draft.narration ? (
                <div className="am-narr">
                    <div className="am-narr-head">
                        <span className="am-narr-lbl">
                            🎙 Narración · voz en off
                        </span>
                        {!editingNarr && (
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                <button
                                    className={`am-mini ghost ${regenOpen ? "on" : ""}`}
                                    onClick={() => {
                                        setRegenCodiceId(
                                            draft.codice_id ?? null
                                        )
                                        setRegenOpen((v) => !v)
                                    }}
                                    title="Pedir otra versión de la narración (IA)"
                                >
                                    ↻ Regenerar
                                </button>
                                <button
                                    className="am-mini ghost"
                                    onClick={startEditNarr}
                                    title="Editar el texto antes de generar la voz"
                                >
                                    ✎ Editar
                                </button>
                                <button
                                    className={`am-mini ${narrCopied ? "on" : ""}`}
                                    onClick={copyNarration}
                                >
                                    {narrCopied ? "Copiado ✓" : "Copiar texto"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Regenerar narración con IA: otra versión de la voz en off,
                        opcionalmente desde otro Códice de Luz (default: el que se
                        usó). No toca los visuales. */}
                    {regenOpen && !editingNarr && (
                        <div
                            style={{
                                marginBottom: 8,
                                padding: "9px 10px",
                                border: "1px solid rgba(212,168,67,.28)",
                                borderRadius: 8,
                                background: "rgba(212,168,67,.08)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,.6)",
                                        flexShrink: 0,
                                    }}
                                >
                                    Fuente:
                                </span>
                                <select
                                    className="am-select"
                                    style={{ flex: 1, minWidth: 0 }}
                                    value={regenCodiceId ?? ""}
                                    onChange={(e) =>
                                        setRegenCodiceId(
                                            e.target.value || null
                                        )
                                    }
                                    disabled={regenBusy}
                                    title="Con qué reescribir la narración"
                                >
                                    <option value="">
                                        Sexta Densidad (sin códice)
                                    </option>
                                    {codices.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="am-narr-editbtns">
                                <button
                                    className="am-mini"
                                    disabled={regenBusy}
                                    onClick={regenNarration}
                                >
                                    {regenBusy
                                        ? "Regenerando…"
                                        : "↻ Regenerar narración"}
                                </button>
                                <button
                                    className="am-mini ghost"
                                    disabled={regenBusy}
                                    onClick={() => setRegenOpen(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {editingNarr ? (
                        <>
                            <textarea
                                className="am-narr-edit"
                                value={narrText}
                                onChange={(e) => setNarrText(e.target.value)}
                                disabled={narrSaving}
                                autoFocus
                                placeholder="Texto de la voz en off…"
                            />
                            <div className="am-narr-editbtns">
                                <button
                                    className="am-mini"
                                    disabled={narrSaving}
                                    onClick={saveNarr}
                                >
                                    {narrSaving ? "Guardando…" : "Guardar"}
                                </button>
                                <button
                                    className="am-mini ghost"
                                    disabled={narrSaving}
                                    onClick={cancelEditNarr}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="am-narr-text">
                                {draft.narration}
                            </div>
                            <div className="am-voice">
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,.5)",
                                    }}
                                >
                                    Voz:
                                </span>
                                <select
                                    className="am-voice-select"
                                    value={voiceId}
                                    onChange={(e) => setVoiceId(e.target.value)}
                                    disabled={voiceBusy}
                                    title="Elige la voz según la narración y los visuales"
                                >
                                    {voices.map((v) => (
                                        <option
                                            key={v.voice_id}
                                            value={v.voice_id}
                                        >
                                            {v.name}
                                            {v.custom ? " ·★" : ""}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="am-mini"
                                    disabled={voiceBusy}
                                    onClick={generarVoz}
                                >
                                    {voiceBusy
                                        ? "Generando…"
                                        : takes.length > 0
                                        ? "🔊 Generar otra toma"
                                        : "🔊 Generar voz"}
                                </button>
                            </div>
                            {/* Tomas acumuladas: cada voz que pruebas queda aquí
                                para comparar (escucha la 1, la 2, otra vez la 1…). */}
                            {takes.length > 0 ? (
                                <div className="am-takes">
                                    {takes.map((t, i) => (
                                        <div
                                            className="am-take"
                                            key={`${t.audio_url}-${i}`}
                                        >
                                            <span
                                                className="am-take-name"
                                                title={t.voice_name}
                                            >
                                                {i + 1}. {t.voice_name}
                                            </span>
                                            <audio
                                                className="am-take-audio"
                                                src={t.audio_url}
                                                controls
                                                preload="none"
                                            />
                                            <button
                                                className="am-take-btn"
                                                title="Descargar esta toma"
                                                onClick={() =>
                                                    downloadTake(t, i)
                                                }
                                            >
                                                ⬇
                                            </button>
                                            <button
                                                className="am-take-btn del"
                                                title="Borrar esta toma"
                                                onClick={() => removeTake(i)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : draft.narration_audio_url ? (
                                /* Storyboard viejo (sin lista de tomas): su voz
                                   única sigue reproducible. */
                                <div className="am-takes">
                                    <div className="am-take">
                                        <span className="am-take-name">
                                            Voz generada
                                        </span>
                                        <audio
                                            className="am-take-audio"
                                            src={draft.narration_audio_url}
                                            controls
                                            preload="none"
                                        />
                                        <button
                                            className="am-take-btn"
                                            title="Descargar"
                                            onClick={() =>
                                                downloadTake(
                                                    {
                                                        voice_id: "",
                                                        voice_name: "voz",
                                                        audio_url:
                                                            draft.narration_audio_url!,
                                                        created_at: "",
                                                    },
                                                    0
                                                )
                                            }
                                        >
                                            ⬇
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            ) : null}

            {/* Caption + hashtags — colapsable */}
            {(draft.caption || (draft.hashtags || []).length > 0) && (
                <>
                    <button
                        className="am-toggle"
                        onClick={() => setShowCap((s) => !s)}
                    >
                        {showCap
                            ? "Ocultar caption y hashtags"
                            : "Ver caption y hashtags"}
                    </button>
                    {showCap && (
                        <div className="am-cap">
                            <div className="am-cap-lbl">Caption</div>
                            {draft.caption}
                            {(draft.hashtags || []).length > 0 && (
                                <div className="am-cap-tags">
                                    {draft.hashtags
                                        .map((h) => `#${h}`)
                                        .join(" ")}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Música del episodio (solo formato episodio): score instrumental
                para Suno, adaptado al arco emocional — se monta DEBAJO de la voz. */}
            {draft.format === "episodio" && draft.score_json && (
                <div
                    className="am-narr"
                    style={{
                        borderColor: "rgba(46,125,166,.38)",
                        background: "rgba(46,125,166,.06)",
                    }}
                >
                    <div className="am-narr-head">
                        <span
                            className="am-narr-lbl"
                            style={{ color: "#2E7DA6" }}
                        >
                            🎼 Música del episodio · Suno
                        </span>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button
                                className="am-mini"
                                onClick={() => {
                                    try {
                                        navigator.clipboard?.writeText(
                                            draft.score_json?.style || ""
                                        )
                                    } catch {}
                                    notify("Estilo del score copiado · pégalo en Styles de Suno")
                                }}
                            >
                                Copiar estilo
                            </button>
                            {draft.score_json.exclude_styles ? (
                                <button
                                    className="am-mini ghost"
                                    onClick={() => {
                                        try {
                                            navigator.clipboard?.writeText(
                                                draft.score_json?.exclude_styles ||
                                                    ""
                                            )
                                        } catch {}
                                        notify("Excludes del score copiados")
                                    }}
                                >
                                    Copiar excludes
                                </button>
                            ) : null}
                        </div>
                    </div>
                    <div className="am-narr-text" style={{ fontSize: 12.5 }}>
                        {draft.score_json.title && (
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                {draft.score_json.title}
                            </div>
                        )}
                        {draft.score_json.style}
                    </div>
                    {draft.score_json.exclude_styles ? (
                        <div
                            style={{
                                marginTop: 6,
                                fontSize: 11.5,
                                color: "rgba(58,63,72,.75)",
                            }}
                        >
                            <strong style={{ color: "#B0483C" }}>
                                Excluir:
                            </strong>{" "}
                            {draft.score_json.exclude_styles}
                        </div>
                    ) : null}
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "#A9781F",
                        }}
                    >
                        Weirdness {draft.score_json.weirdness ?? 30}% · Style
                        Influence {draft.score_json.style_influence ?? 70}% ·
                        Instrumental
                    </div>
                    {draft.score_json.notes ? (
                        <div
                            style={{
                                marginTop: 4,
                                fontSize: 11,
                                fontStyle: "italic",
                                color: "rgba(58,63,72,.6)",
                            }}
                        >
                            {draft.score_json.notes}
                        </div>
                    ) : null}
                </div>
            )}

            {kfs.length > 1 && (
                <div className="am-grok-hint">
                    🎬 Animar en Grok: sube cada cuadro como{" "}
                    <strong>@image1</strong>. En tomas aéreas/lejanas o cuando
                    la cámara se acerca al ser, sube también el{" "}
                    <strong>cuadro #1</strong> como <strong>@image2</strong> —
                    el prompt ya lo referencia para que Grok use al ser real y
                    no invente otro.
                </div>
            )}

            <div className="am-strip">
                {kfs.map((kf, i) => {
                    // Episodio: marcador vertical al ABRIR cada escena (los
                    // cuadros de una escena comparten escenario; entre escenas
                    // hay corte). Los reels (scene_index null) no lo muestran.
                    const sceneStart =
                        kf.scene_index != null &&
                        (i === 0 ||
                            kfs[i - 1]?.scene_index !== kf.scene_index)
                    return (
                        <Fragment key={kf.id}>
                            {sceneStart && (
                                <div
                                    style={{
                                        flex: "0 0 auto",
                                        alignSelf: "stretch",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "12px 9px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(169,120,31,.4)",
                                        background: "rgba(212,168,67,.10)",
                                        maxWidth: 96,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 800,
                                            letterSpacing: ".08em",
                                            color: "#A9781F",
                                        }}
                                    >
                                        ESCENA {kf.scene_index}
                                    </span>
                                    {kf.scene_label && (
                                        <span
                                            style={{
                                                fontSize: 10.5,
                                                lineHeight: 1.3,
                                                textAlign: "center",
                                                color: "rgba(58,63,72,.8)",
                                            }}
                                        >
                                            {kf.scene_label}
                                        </span>
                                    )}
                                </div>
                            )}
                            <KeyframeCard
                                kf={kf}
                                colectivoName={draft.colectivo_name}
                                supabaseUrl={supabaseUrl}
                                supabaseAnonKey={supabaseAnonKey}
                                clerkUserId={clerkUserId}
                                draftStatus={draft.status}
                                draftStale={draftStale}
                                autoRescuing={autoRescuing}
                                onAfterChange={onAfterChange}
                                notify={notify}
                            />
                        </Fragment>
                    )
                })}
            </div>

            <div className="am-draft-foot">
                <button
                    className="am-allbtn"
                    disabled={animatedCount === 0}
                    onClick={downloadAll}
                >
                    ⬇ Descargar clips ({animatedCount}/{kfs.length})
                </button>
                <span className="am-foot-meta">
                    {allReady
                        ? "Todos los clips listos — únelos en tu editor."
                        : "Anima cada cuadro en Grok (o por API) y sube el video."}
                </span>
            </div>
        </motion.div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   4.5 BIBLIOTECAS (Colectivos + Ambientes) — gestión (Fase B)
   ═══════════════════════════════════════════════════════════════ */

interface LibraryForm {
    id: string | null
    name: string
    traits: string
    variation: string
    image_r2_url: string
    category: string // "" (universal) | "zakhaar" | "veo"
}

const EMPTY_LIB_FORM: LibraryForm = {
    id: null,
    name: "",
    traits: "",
    variation: "",
    image_r2_url: "",
    category: "zakhaar",
}

// Traduce el error crudo de la visión (Gemini) a un aviso humano para el panel,
// para no quedarnos en blanco cuando el fallo es de ellos. La imagen YA quedó
// guardada en R2 en todos estos casos.
function visionErrorNote(raw: string): string {
    const e = String(raw || "")
    if (/503|UNAVAILABLE|high demand|overloaded|try again later/i.test(e)) {
        return "La IA de visión de Google está saturada en este momento (sobrecarga temporal de su lado, no es tu imagen). La imagen ya quedó guardada — espera un momento y vuelve a tocar «Cambiar imagen», o escribe los rasgos a mano."
    }
    if (/429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(e)) {
        return "Se alcanzó el límite de uso de la IA de visión por ahora. La imagen ya quedó guardada — reintenta en unos minutos o escribe los rasgos a mano."
    }
    return `La IA de visión no respondió bien (${e.slice(
        0,
        140
    )}). La imagen ya quedó guardada — reintenta o escribe los rasgos a mano.`
}

// Config que parametriza el LibraryManager para colectivos vs ambientes.
interface LibraryConfig {
    kind: "colectivo" | "ambiente"
    listKey: string // clave del array en la respuesta del RPC de listado
    rpcList: string
    rpcUpsert: string
    rpcSetActive: string
    rpcDelete: string
    title: string
    intro: string
    addLabel: string
    namePlaceholder: string
    traitsLabel: string
    traitsPlaceholder: string
    variationLabel: string
    variationPlaceholder: string
    describingHint: string
    analyzedMsg: string
    generateLabel: string // botón "Generar con IA"
    briefPlaceholder: string // brief opcional para el generador
    generatingHint: string // texto mientras genera
    generatedMsg: string // toast al generar OK
    nameMissingMsg: string
    traitsMissingMsg: string
    createdMsg: string
    updatedMsg: string
    nameTakenMsg: string
    deletedMsg: string
    deleteConfirm: (name: string) => string
    emptyMsg: string
    rowTraits: (row: any) => string
    rowVariation: (row: any) => string | null
    upsertParams: (
        clerkUserId: string,
        form: LibraryForm
    ) => Record<string, any>
}

const COLECTIVO_CONFIG: LibraryConfig = {
    kind: "colectivo",
    listKey: "colectivos",
    rpcList: "get_vtli_colectivos_admin",
    rpcUpsert: "upsert_vtli_colectivo",
    rpcSetActive: "set_vtli_colectivo_active",
    rpcDelete: "delete_vtli_colectivo",
    title: "Colectivos del Universo",
    intro: "Sube una imagen de una civilización: la IA describe su especie (rasgos fijos + variación individual). La revisas, le pones nombre y la guardas. El texto viaja al prompt siempre (también en modo solo prompts); la imagen queda como referencia visual.",
    addLabel: "+ Nuevo colectivo",
    namePlaceholder: "Ej. Cristalinos",
    traitsLabel: "Rasgos de la especie (van al prompt)",
    traitsPlaceholder:
        "Rasgos FIJOS que comparten todos los individuos de la especie…",
    variationLabel: "Variación individual (opcional)",
    variationPlaceholder:
        "Qué cambia SUTILMENTE entre individuos de la misma especie…",
    describingHint: "La IA está mirando la imagen y describiendo la especie…",
    analyzedMsg: "Colectivo analizado · revisa y guarda",
    generateLabel: "✦ Generar prompt del ser",
    briefPlaceholder:
        "Describe el ser que imaginas (opcional). Vacío = lo invento yo.",
    generatingHint:
        "Inventando el ser y escribiendo su prompt para Nano Banana…",
    generatedMsg:
        "Ficha + prompt listos · copia el prompt a Nano Banana, genera la foto y súbela arriba",
    nameMissingMsg: "Ponle un nombre al colectivo",
    traitsMissingMsg: "Faltan los rasgos de la especie",
    createdMsg: "Colectivo creado",
    updatedMsg: "Colectivo actualizado",
    nameTakenMsg: "Ya existe un colectivo con ese nombre",
    deletedMsg: "Colectivo borrado",
    deleteConfirm: (name) =>
        `¿Borrar el colectivo "${name}"? La imagen de referencia queda en R2.`,
    emptyMsg: "Todavía no hay colectivos guardados.",
    rowTraits: (row) => String(row?.species_traits ?? ""),
    rowVariation: (row) => row?.individual_variation ?? null,
    upsertParams: (clerkUserId, form) => ({
        p_admin_clerk_id: clerkUserId,
        p_id: form.id,
        p_name: form.name.trim(),
        p_species_traits: form.traits.trim(),
        p_individual_variation: form.variation.trim() || null,
        p_image_r2_url: form.image_r2_url || null,
        p_category: form.category || null,
        p_sort_order: null,
    }),
}

const AMBIENTE_CONFIG: LibraryConfig = {
    kind: "ambiente",
    listKey: "ambientes",
    rpcList: "get_vtli_ambientes_admin",
    rpcUpsert: "upsert_vtli_ambiente",
    rpcSetActive: "set_vtli_ambiente_active",
    rpcDelete: "delete_vtli_ambiente",
    title: "Ambientes del Universo",
    intro: "Sube una imagen de un entorno: la IA describe cómo es el ambiente (lo fijo + qué puede variar dentro). Lo revisas, le pones nombre y lo guardas. El texto viaja al prompt siempre; la imagen queda como referencia visual. Cada storyboard que use este ambiente transcurre ahí.",
    addLabel: "+ Nuevo ambiente",
    namePlaceholder: "Ej. Biblioteca de Cristal",
    traitsLabel: "Cómo es el ambiente (va al prompt)",
    traitsPlaceholder:
        "Lo FIJO del escenario: arquitectura, materiales, luz, elementos…",
    variationLabel: "Qué puede variar dentro (opcional)",
    variationPlaceholder:
        "Qué cambia SUTILMENTE entre Reels dentro del mismo ambiente…",
    describingHint: "La IA está mirando la imagen y describiendo el ambiente…",
    analyzedMsg: "Ambiente analizado · revisa y guarda",
    generateLabel: "✦ Generar prompt del entorno",
    briefPlaceholder:
        "Describe el entorno que imaginas (opcional). Vacío = lo invento yo.",
    generatingHint:
        "Inventando el entorno y escribiendo su prompt para Nano Banana…",
    generatedMsg:
        "Ficha + prompt listos · copia el prompt a Nano Banana, genera la foto y súbela arriba",
    nameMissingMsg: "Ponle un nombre al ambiente",
    traitsMissingMsg: "Falta la descripción del ambiente",
    createdMsg: "Ambiente creado",
    updatedMsg: "Ambiente actualizado",
    nameTakenMsg: "Ya existe un ambiente con ese nombre",
    deletedMsg: "Ambiente borrado",
    deleteConfirm: (name) =>
        `¿Borrar el ambiente "${name}"? La imagen de referencia queda en R2.`,
    emptyMsg: "Todavía no hay ambientes guardados.",
    rowTraits: (row) => String(row?.scene_traits ?? ""),
    rowVariation: (row) => row?.variation ?? null,
    upsertParams: (clerkUserId, form) => ({
        p_admin_clerk_id: clerkUserId,
        p_id: form.id,
        p_name: form.name.trim(),
        p_scene_traits: form.traits.trim(),
        p_variation: form.variation.trim() || null,
        p_image_r2_url: form.image_r2_url || null,
        p_category: form.category || null,
        p_sort_order: null,
    }),
}

function LibraryManager({
    config,
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    isMobile,
    onChanged,
    notify,
}: {
    config: LibraryConfig
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string
    isMobile: boolean
    onChanged: () => void
    notify: (m: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [list, setList] = useState<LibraryItem[]>([])
    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<LibraryForm>(EMPTY_LIB_FORM)
    const [describing, setDescribing] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [brief, setBrief] = useState("")
    const [genPrompt, setGenPrompt] = useState("") // prompt para Nano Banana
    const [promptCopied, setPromptCopied] = useState(false)
    const [thumbDragOver, setThumbDragOver] = useState(false)
    const [saving, setSaving] = useState(false)
    // Aviso persistente cuando la visión falla (p. ej. Gemini saturado): se queda
    // en el formulario para que no nos quedemos en blanco. Se limpia al reintentar.
    const [visionNote, setVisionNote] = useState("")
    const fileRef = useRef<HTMLInputElement>(null)

    const loadList = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(supabaseUrl, supabaseAnonKey, config.rpcList, {
            p_admin_clerk_id: clerkUserId,
        })
        const rows =
            r && Array.isArray(r[config.listKey]) ? r[config.listKey] : null
        if (rows) {
            setList(
                rows.map((row: any) => ({
                    id: row.id,
                    name: row.name,
                    traits: config.rowTraits(row),
                    variation: config.rowVariation(row),
                    image_r2_url: row.image_r2_url ?? null,
                    category: row.category ?? null,
                    active: !!row.active,
                    sort_order: row.sort_order ?? 0,
                }))
            )
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey, config])

    useEffect(() => {
        if (open) loadList()
    }, [open, loadList])

    const openNew = useCallback(() => {
        setForm(EMPTY_LIB_FORM)
        setBrief("")
        setGenPrompt("")
        setVisionNote("")
        setFormOpen(true)
    }, [])

    const openEdit = useCallback((c: LibraryItem) => {
        setForm({
            id: c.id,
            name: c.name,
            traits: c.traits,
            variation: c.variation || "",
            image_r2_url: c.image_r2_url || "",
            category: c.category || "",
        })
        setVisionNote("")
        setFormOpen(true)
    }, [])

    const cancelForm = useCallback(() => {
        setFormOpen(false)
        setForm(EMPTY_LIB_FORM)
        setBrief("")
        setGenPrompt("")
        setVisionNote("")
    }, [])

    const pickFile = useCallback(() => fileRef.current?.click(), [])

    // Sube + describe la imagen elegida. Rellena los textos del formulario con
    // lo que devuelve la visión (el nombre solo si estaba vacío).
    const handleFile = useCallback(
        async (file: File) => {
            setDescribing(true)
            setVisionNote("")
            try {
                const { base64, mime } = await resizeImageToBase64(file)
                const r = await callEdge(
                    supabaseUrl,
                    supabaseAnonKey,
                    "describe-vtli-colectivo",
                    {
                        admin_clerk_id: clerkUserId,
                        image_base64: base64,
                        image_mime: mime,
                        kind: config.kind,
                    }
                )
                if (r.ok && r.body?.image_r2_url) {
                    setForm((f) => ({
                        ...f,
                        image_r2_url: r.body.image_r2_url,
                        name: f.name || r.body.suggested_name || "",
                        traits: r.body.traits || f.traits,
                        variation: r.body.variation || f.variation,
                    }))
                    if (r.body.vision_error) {
                        console.warn(
                            "[colectivo] vision_error:",
                            r.body.vision_error
                        )
                        const note = visionErrorNote(r.body.vision_error)
                        setVisionNote(note)
                        notify(note)
                    } else {
                        setVisionNote("")
                        notify(config.analyzedMsg)
                    }
                } else {
                    const msg = `No se pudo analizar: ${
                        r.body?.error ?? r.status
                    }`
                    setVisionNote(msg)
                    notify(msg)
                }
            } catch {
                const msg =
                    "No se pudo procesar la imagen (revisa tu conexión y reintenta)."
                setVisionNote(msg)
                notify(msg)
            } finally {
                setDescribing(false)
            }
        },
        [clerkUserId, supabaseUrl, supabaseAnonKey, notify, config]
    )

    // Diseña un ser/escenario nuevo (modo SOLO PROMPTS, $0): rellena la ficha y
    // devuelve el PROMPT fotorrealista para pegar en Nano Banana a mano. NO
    // genera la imagen por API. Zak genera la foto y la sube como referencia.
    const handleGenerate = useCallback(async () => {
        if (generating || describing) return
        setGenerating(true)
        setGenPrompt("")
        try {
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "generate-vtli-colectivo",
                {
                    admin_clerk_id: clerkUserId,
                    brief: brief.trim(),
                    kind: config.kind,
                }
            )
            if (r.ok && r.body?.prompt) {
                setForm((f) => ({
                    ...f,
                    name: f.name || r.body.suggested_name || "",
                    traits: r.body.traits || f.traits,
                    variation: r.body.variation || f.variation,
                }))
                setGenPrompt(r.body.prompt)
                setPromptCopied(false)
                notify(config.generatedMsg)
            } else {
                notify(`No se pudo generar: ${r.body?.error ?? r.status}`)
            }
        } catch {
            notify("No se pudo generar")
        } finally {
            setGenerating(false)
        }
    }, [
        generating,
        describing,
        brief,
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey,
        notify,
        config,
    ])

    const copyGenPrompt = useCallback(() => {
        try {
            navigator.clipboard?.writeText(genPrompt)
        } catch {}
        setPromptCopied(true)
        setTimeout(() => setPromptCopied(false), 1600)
    }, [genPrompt])

    const save = useCallback(async () => {
        const name = form.name.trim()
        const traits = form.traits.trim()
        if (!name) {
            notify(config.nameMissingMsg)
            return
        }
        if (!traits) {
            notify(config.traitsMissingMsg)
            return
        }
        setSaving(true)
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            config.rpcUpsert,
            config.upsertParams(clerkUserId, form)
        )
        setSaving(false)
        if (r && !r.error) {
            notify(form.id ? config.updatedMsg : config.createdMsg)
            setFormOpen(false)
            setForm(EMPTY_LIB_FORM)
            await loadList()
            onChanged()
        } else {
            const err = r?.error
            notify(
                err === "name_taken"
                    ? config.nameTakenMsg
                    : `No se pudo guardar${err ? ": " + err : ""}`
            )
        }
    }, [
        form,
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey,
        notify,
        loadList,
        onChanged,
        config,
    ])

    const toggleActive = useCallback(
        async (c: LibraryItem) => {
            const r = await rpc(
                supabaseUrl,
                supabaseAnonKey,
                config.rpcSetActive,
                {
                    p_admin_clerk_id: clerkUserId,
                    p_id: c.id,
                    p_active: !c.active,
                }
            )
            if (r?.success) {
                await loadList()
                onChanged()
            } else {
                notify("No se pudo cambiar el estado")
            }
        },
        [
            clerkUserId,
            supabaseUrl,
            supabaseAnonKey,
            notify,
            loadList,
            onChanged,
            config,
        ]
    )

    const del = useCallback(
        async (c: LibraryItem) => {
            if (
                typeof window !== "undefined" &&
                !window.confirm(config.deleteConfirm(c.name))
            )
                return
            const r = await rpc(
                supabaseUrl,
                supabaseAnonKey,
                config.rpcDelete,
                { p_admin_clerk_id: clerkUserId, p_id: c.id }
            )
            if (r?.success) {
                notify(config.deletedMsg)
                await loadList()
                onChanged()
            } else {
                notify("No se pudo borrar")
            }
        },
        [
            clerkUserId,
            supabaseUrl,
            supabaseAnonKey,
            notify,
            loadList,
            onChanged,
            config,
        ]
    )

    return (
        <section className="am-col-section">
            <button
                className="am-col-toggle"
                onClick={() => setOpen((o) => !o)}
            >
                <span>◈ {config.title}</span>
                <span className="cnt">
                    {list.length > 0 ? `${list.length} guardados` : ""}
                </span>
                <span className="ch">{open ? "▲" : "▼"}</span>
            </button>
            {open && (
                <div className="am-col-body">
                    <p className="am-col-intro">{config.intro}</p>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.target.value = ""
                            if (f) handleFile(f)
                        }}
                    />

                    {!formOpen ? (
                        <button className="am-col-add" onClick={openNew}>
                            {config.addLabel}
                        </button>
                    ) : (
                        <div className="am-col-form">
                            <div
                                className="am-col-form-top"
                                style={
                                    isMobile
                                        ? { flexDirection: "column" }
                                        : undefined
                                }
                            >
                                <div
                                    className={`am-col-thumb am-col-thumb-drop${thumbDragOver ? " am-drag-over" : ""}`}
                                    title="Clic o arrastra una imagen aquí"
                                    onClick={() => {
                                        if (!describing) pickFile()
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        if (!thumbDragOver) setThumbDragOver(true)
                                    }}
                                    onDragLeave={() => setThumbDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        setThumbDragOver(false)
                                        const f = e.dataTransfer?.files?.[0]
                                        if (
                                            f &&
                                            f.type.startsWith("image/") &&
                                            !describing
                                        )
                                            handleFile(f)
                                    }}
                                >
                                    {form.image_r2_url ? (
                                        <img
                                            src={form.image_r2_url}
                                            alt="referencia"
                                        />
                                    ) : (
                                        <span className="am-col-thumb-ph">
                                            ◈
                                        </span>
                                    )}
                                    {(describing || generating) && (
                                        <div className="am-col-thumb-ov">
                                            <div className="am-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="am-col-upcol">
                                    <button
                                        className="am-col-add"
                                        disabled={describing || generating}
                                        onClick={pickFile}
                                    >
                                        {describing
                                            ? "Analizando con visión…"
                                            : form.image_r2_url
                                            ? "Cambiar imagen"
                                            : "Subir imagen"}
                                    </button>
                                    <span className="am-col-uphint">
                                        {describing
                                            ? config.describingHint
                                            : "JPG o PNG. Se reduce y sube sola; después rellena los textos de abajo."}
                                    </span>

                                    {visionNote && !describing && (
                                        <div
                                            className="am-col-visionnote"
                                            role="status"
                                        >
                                            {visionNote}
                                        </div>
                                    )}

                                    <div className="am-col-gendiv">
                                        — o genera el prompt con IA —
                                    </div>
                                    <textarea
                                        className="am-col-brief"
                                        value={brief}
                                        onChange={(e) =>
                                            setBrief(e.target.value)
                                        }
                                        placeholder={config.briefPlaceholder}
                                        disabled={generating || describing}
                                    />
                                    <button
                                        className="am-col-genbtn"
                                        disabled={generating || describing}
                                        onClick={handleGenerate}
                                    >
                                        {generating
                                            ? "Escribiendo el prompt…"
                                            : config.generateLabel}
                                    </button>
                                    {generating && (
                                        <span className="am-col-uphint">
                                            {config.generatingHint}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {genPrompt && (
                                <div className="am-col-genout">
                                    <div className="am-col-genout-head">
                                        <span className="am-col-genout-lbl">
                                            📋 Prompt para Nano Banana — pégalo
                                            tal cual (formato 3:4)
                                        </span>
                                        <button
                                            className="am-col-genout-copy"
                                            onClick={copyGenPrompt}
                                        >
                                            {promptCopied
                                                ? "Copiado ✓"
                                                : "Copiar prompt"}
                                        </button>
                                    </div>
                                    <div className="am-col-genout-txt">
                                        {genPrompt}
                                    </div>
                                    <span className="am-col-uphint">
                                        Genera la foto en Nano Banana,
                                        descárgala y súbela aquí arriba con
                                        «Subir imagen»; luego guarda. La ficha
                                        de abajo ya quedó lista.
                                    </span>
                                </div>
                            )}

                            <div className="am-col-field">
                                <span className="am-col-lbl">Nombre</span>
                                <input
                                    className="am-col-input"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder={config.namePlaceholder}
                                />
                            </div>

                            <div className="am-col-field">
                                <span className="am-col-lbl">
                                    {config.traitsLabel}
                                </span>
                                <textarea
                                    className="am-col-ta"
                                    value={form.traits}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            traits: e.target.value,
                                        }))
                                    }
                                    placeholder={config.traitsPlaceholder}
                                />
                            </div>

                            <div className="am-col-field">
                                <span className="am-col-lbl">
                                    {config.variationLabel}
                                </span>
                                <textarea
                                    className="am-col-ta"
                                    value={form.variation}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            variation: e.target.value,
                                        }))
                                    }
                                    placeholder={config.variationPlaceholder}
                                />
                            </div>

                            <div className="am-col-field">
                                <span className="am-col-lbl">Canal</span>
                                <div className="am-seg">
                                    <button
                                        className={
                                            form.category === "zakhaar"
                                                ? "on"
                                                : ""
                                        }
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                category: "zakhaar",
                                            }))
                                        }
                                    >
                                        Zak'Haar
                                    </button>
                                    <button
                                        className={
                                            form.category === "veo" ? "on" : ""
                                        }
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                category: "veo",
                                            }))
                                        }
                                    >
                                        VEO
                                    </button>
                                    <button
                                        className={
                                            form.category === "" ? "on" : ""
                                        }
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                category: "",
                                            }))
                                        }
                                    >
                                        Universal
                                    </button>
                                </div>
                            </div>

                            <div className="am-col-form-btns">
                                <button
                                    className="am-col-add"
                                    disabled={saving || describing}
                                    onClick={save}
                                >
                                    {saving
                                        ? "Guardando…"
                                        : form.id
                                        ? "Guardar cambios"
                                        : "Guardar"}
                                </button>
                                <button
                                    className="am-col-act"
                                    disabled={saving}
                                    onClick={cancelForm}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="am-col-list">
                        {list.length === 0 ? (
                            <div className="am-col-empty">
                                {config.emptyMsg}
                            </div>
                        ) : (
                            list.map((c) => (
                                <div
                                    key={c.id}
                                    className={`am-col-card ${
                                        c.active ? "" : "off"
                                    }`}
                                >
                                    <div className="am-col-card-thumb">
                                        {c.image_r2_url ? (
                                            <img
                                                src={c.image_r2_url}
                                                alt={c.name}
                                            />
                                        ) : (
                                            <span>◈</span>
                                        )}
                                    </div>
                                    <div className="am-col-card-info">
                                        <div className="am-col-card-name">
                                            {c.name}
                                            <span className="am-col-tag">
                                                {colectivoCatLabel(c.category)}
                                            </span>
                                            {!c.active && (
                                                <span className="am-col-tag off">
                                                    inactivo
                                                </span>
                                            )}
                                        </div>
                                        <div className="am-col-card-traits">
                                            {c.traits}
                                        </div>
                                    </div>
                                    <div className="am-col-card-actions">
                                        <button
                                            className="am-col-act"
                                            onClick={() => openEdit(c)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="am-col-act"
                                            onClick={() => toggleActive(c)}
                                        >
                                            {c.active
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>
                                        <button
                                            className="am-col-act danger"
                                            onClick={() => del(c)}
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

/* ── Voz por ID (gestor de voces manuales) ── */
function VoicesManager({
    customVoices,
    onAdd,
    onRemove,
}: {
    customVoices: VoiceOpt[]
    onAdd: (voiceId: string, name: string, rhythm: VoiceRhythmKey) => void
    onRemove: (voiceId: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [vid, setVid] = useState("")
    const [rhythm, setRhythm] = useState<VoiceRhythmKey>("meditativo")

    const submit = () => {
        if (!vid.trim()) return
        onAdd(vid, name, rhythm)
        setName("")
        setVid("")
    }

    return (
        <div className="am-voices-mgr">
            <div
                className="am-voices-mgr-head"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="am-voices-mgr-title">
                    🎚 Voz por ID
                    {customVoices.length ? ` (${customVoices.length})` : ""}
                </span>
                <span style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>
                    {open ? "▲" : "▼"}
                </span>
            </div>
            {open && (
                <>
                    <p className="am-voices-mgr-hint">
                        Pega cualquier Voice ID de ElevenLabs (en la voz: ⋮ →
                        Copy Voice ID) y elige su ritmo. Queda en el selector de
                        voz de cada storyboard y se guarda en la nube (la ves
                        desde cualquier compu).
                    </p>
                    <div className="am-vrow">
                        <input
                            className="am-vinput"
                            style={{ width: 140 }}
                            placeholder="Nombre (ej. Myrddin)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            className="am-vinput"
                            style={{ flex: 1, minWidth: 150 }}
                            placeholder="Voice ID"
                            value={vid}
                            onChange={(e) => setVid(e.target.value)}
                        />
                        <select
                            className="am-voice-select"
                            value={rhythm}
                            onChange={(e) =>
                                setRhythm(e.target.value as VoiceRhythmKey)
                            }
                        >
                            {(
                                Object.keys(VOICE_RHYTHMS) as VoiceRhythmKey[]
                            ).map((k) => (
                                <option key={k} value={k}>
                                    {VOICE_RHYTHMS[k].label}
                                </option>
                            ))}
                        </select>
                        <button
                            className="am-mini"
                            onClick={submit}
                            disabled={!vid.trim()}
                        >
                            + Agregar
                        </button>
                    </div>
                    {customVoices.length > 0 && (
                        <div className="am-vchips">
                            {customVoices.map((v) => (
                                <span className="am-vchip" key={v.voice_id}>
                                    {v.name}
                                    <button
                                        title="Quitar voz"
                                        onClick={() => onRemove(v.voice_id)}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   5. MAIN — Estudio Manual
   ═══════════════════════════════════════════════════════════════ */

export default function AtelierEstudioManual({
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
    isMobile = false,
}: Props) {
    // Canal FIJO: el Estudio Manual emite siempre por Zak'Haar (el toggle VEO se
    // quitó el 2026-06-25 — este atelier es solo del canal Zak'Haar Solar).
    const category: DraftCategory = "zakhaar"
    const [keyframeCount, setKeyframeCount] = useState(4)
    const [secPerKf, setSecPerKf] = useState(10)
    // Formato: "reel" (corto clásico) o "episodio" (mini-película por escenas,
    // 90s/2min/3min, con score de Suno). El episodio usa clips fijos de 10s.
    const [format, setFormat] = useState<"reel" | "episodio">("reel")
    const [epDuration, setEpDuration] = useState(90)
    // Modo de imagen: "prompts" (solo textos; las generas a mano en tu Nano
    // Banana del plan Pro → $0) o "api" (las genera el motor por API, con costo).
    // En modo prompts, el estilo: "self" (cada prompt se basta solo, solo
    // copy-paste) o "reference" (generas el #1 y lo subes de referencia).
    const [imageMode, setImageMode] = useState<"prompts" | "api">("prompts")
    const [promptStyle, setPromptStyle] = useState<"self" | "reference">(
        "reference"
    )
    // Colectivos (civilizaciones) guardados + el elegido para el próximo
    // storyboard (null = el motor inventa el ser, como antes).
    const [colectivos, setColectivos] = useState<
        { id: string; name: string }[]
    >([])
    const [selectedColectivoId, setSelectedColectivoId] = useState<
        string | null
    >(null)
    // Ambientes (entornos) guardados + el elegido para el próximo storyboard
    // (null = el motor elige el escenario con la variedad anti-repetición).
    const [ambientes, setAmbientes] = useState<{ id: string; name: string }[]>(
        []
    )
    const [selectedAmbienteId, setSelectedAmbienteId] = useState<
        string | null
    >(null)
    // Fuente de la narración: "generic" (semillas de Sexta Densidad, lo de
    // siempre) o "codice" (una enseñanza de un Códice de Luz / libro destilado).
    const [sourceMode, setSourceMode] = useState<"generic" | "codice">(
        "generic"
    )
    const [codices, setCodices] = useState<{ id: string; title: string }[]>([])
    const [selectedCodiceId, setSelectedCodiceId] = useState<string | null>(
        null
    )
    const totalSec = keyframeCount * secPerKf
    const [generating, setGenerating] = useState(false)
    const [drafts, setDrafts] = useState<Draft[]>([])
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    // Voces manuales (pegadas con "Voz por ID", persisten en el navegador) +
    // las dinámicas de la cuenta de ElevenLabs (si el listado carga). El
    // selector de cada storyboard ve la unión: default + manuales + dinámicas.
    const [customVoices, setCustomVoices] = useState<VoiceOpt[]>(() =>
        loadCustomVoices()
    )
    const [dynamicVoices, setDynamicVoices] = useState<VoiceOpt[]>([])
    const voices = useMemo(
        () => mergeVoices(DEFAULT_VOICES, customVoices, dynamicVoices),
        [customVoices, dynamicVoices]
    )
    // Voz semilla con la que arranca cada storyboard nuevo (CarterSutra).
    // La elección real es por storyboard, en su sección de narración.
    const [selectedVoiceId] = useState(DEFAULT_VOICES[0].voice_id)

    // Voces manuales en la NUBE (tabla vtli_atelier_voices) → se ven iguales
    // desde cualquier compu. localStorage queda como caché instantánea; la DB
    // es la fuente de verdad. Al cargar, migra una vez las voces que sólo
    // estaban en este navegador (ignora las que ya son default, p.ej. Myrddin).
    const loadAtelierVoices = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_vtli_atelier_voices",
            { p_admin_clerk_id: clerkUserId }
        )
        if (!r || !Array.isArray(r.voices)) return
        const dbVoices: VoiceOpt[] = r.voices.map((row: any) => ({
            voice_id: String(row.voice_id),
            name: String(row.name || row.voice_id),
            settings:
                row.settings && typeof row.settings === "object"
                    ? row.settings
                    : undefined,
            custom: true,
        }))
        const dbIds = new Set(dbVoices.map((v) => v.voice_id))
        const defIds = new Set(DEFAULT_VOICES.map((v) => v.voice_id))
        const toMigrate = loadCustomVoices().filter(
            (v) => !dbIds.has(v.voice_id) && !defIds.has(v.voice_id)
        )
        for (const v of toMigrate) {
            await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "upsert_vtli_atelier_voice",
                {
                    p_admin_clerk_id: clerkUserId,
                    p_voice_id: v.voice_id,
                    p_name: v.name,
                    p_settings: v.settings ?? {},
                    p_rhythm: null,
                }
            )
        }
        const finalList = toMigrate.length
            ? [...dbVoices, ...toMigrate]
            : dbVoices
        setCustomVoices(finalList)
        saveCustomVoices(finalList)
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadAtelierVoices()
    }, [loadAtelierVoices])

    const addCustomVoice = useCallback(
        async (voiceId: string, name: string, rhythm: VoiceRhythmKey) => {
            const id = voiceId.trim()
            if (!id) return
            if (
                DEFAULT_VOICES.some((v) => v.voice_id === id) ||
                customVoices.some((v) => v.voice_id === id)
            ) {
                setToast("Esa voz ya está en la lista")
                setTimeout(() => setToast(null), 3200)
                return
            }
            const entry: VoiceOpt = {
                voice_id: id,
                name: name.trim() || id,
                settings: VOICE_RHYTHMS[rhythm].settings,
                custom: true,
            }
            const next = [...customVoices, entry]
            setCustomVoices(next)
            saveCustomVoices(next)
            setToast(`Voz "${entry.name}" agregada`)
            setTimeout(() => setToast(null), 3200)
            await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "upsert_vtli_atelier_voice",
                {
                    p_admin_clerk_id: clerkUserId,
                    p_voice_id: id,
                    p_name: entry.name,
                    p_settings: entry.settings ?? {},
                    p_rhythm: rhythm,
                }
            )
        },
        [customVoices, clerkUserId, supabaseUrl, supabaseAnonKey]
    )

    const removeCustomVoice = useCallback(
        async (voiceId: string) => {
            const next = customVoices.filter((v) => v.voice_id !== voiceId)
            setCustomVoices(next)
            saveCustomVoices(next)
            await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "delete_vtli_atelier_voice",
                {
                    p_admin_clerk_id: clerkUserId,
                    p_voice_id: voiceId,
                }
            )
        },
        [customVoices, clerkUserId, supabaseUrl, supabaseAnonKey]
    )

    const draftsRef = useRef<Draft[]>([])
    useEffect(() => {
        draftsRef.current = drafts
    }, [drafts])

    // Auto-reintento de cuadros que fallaron: { count, lastTs } por keyframe.
    // Hasta 2 reintentos automáticos por cuadro, uno a la vez, solo en
    // storyboards recientes — así los cuadros que Gemini deja colgados se
    // rellenan solos sin que Diego pique Reintentar.
    // Auto-reintento SERIAL: un solo cuadro en vuelo a la vez en TODO el panel
    // (dos reintentos concurrentes a Nano Banana se cuelgan mutuamente — era la
    // causa de que un cuadro nunca apareciera). Rota por los cuadros vacíos de
    // storyboards recientes hasta llenarlos. counts = intentos por cuadro (tope
    // alto: el fallback sin-referencia del backend resuelve casi siempre en 1-2,
    // pero damos colchón).
    const autoRetryRef = useRef<{
        inFlightKfId: string | null
        inFlightUntil: number
        counts: Record<string, number>
    }>({ inFlightKfId: null, inFlightUntil: 0, counts: {} })

    const notify = useCallback((m: string) => {
        setToast(m)
        setTimeout(() => setToast(null), 3200)
    }, [])

    /* ─── CSS injection ─── */
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "am-css-v7"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])

    /* ─── Cargar historial ─── */
    const loadDrafts = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_recent_vtli_drafts",
            {
                p_admin_clerk_id: clerkUserId,
                p_category: null,
                p_status: null,
                p_limit: 30,
            }
        )
        if (r && Array.isArray(r.drafts)) setDrafts(r.drafts as Draft[])
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadDrafts()
    }, [loadDrafts])

    /* ─── Cargar colectivos (civilizaciones) activos para el selector ─── */
    const loadColectivos = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_vtli_colectivos",
            { p_admin_clerk_id: clerkUserId, p_category: null }
        )
        if (r && Array.isArray(r.colectivos)) {
            setColectivos(
                r.colectivos.map((c: any) => ({ id: c.id, name: c.name }))
            )
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadColectivos()
    }, [loadColectivos])

    // Si el colectivo elegido para el próximo storyboard dejó de estar activo
    // (lo desactivaron/borraron desde la gestión), volvemos a "Automático".
    useEffect(() => {
        if (
            selectedColectivoId &&
            !colectivos.some((c) => c.id === selectedColectivoId)
        ) {
            setSelectedColectivoId(null)
        }
    }, [colectivos, selectedColectivoId])

    /* ─── Cargar ambientes (entornos) activos para el selector ─── */
    const loadAmbientes = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_vtli_ambientes",
            { p_admin_clerk_id: clerkUserId, p_category: null }
        )
        if (r && Array.isArray(r.ambientes)) {
            setAmbientes(
                r.ambientes.map((a: any) => ({ id: a.id, name: a.name }))
            )
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadAmbientes()
    }, [loadAmbientes])

    useEffect(() => {
        if (
            selectedAmbienteId &&
            !ambientes.some((a) => a.id === selectedAmbienteId)
        ) {
            setSelectedAmbienteId(null)
        }
    }, [ambientes, selectedAmbienteId])

    /* ─── Cargar Códices de Luz (libros destilados) para el selector ─── */
    const loadCodices = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_codices_luz_admin",
            { p_admin_clerk_id: clerkUserId }
        )
        if (r && Array.isArray(r.codices)) {
            setCodices(
                r.codices.map((c: any) => ({ id: c.id, title: c.title }))
            )
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadCodices()
    }, [loadCodices])

    useEffect(() => {
        if (
            selectedCodiceId &&
            !codices.some((c) => c.id === selectedCodiceId)
        ) {
            setSelectedCodiceId(null)
        }
    }, [codices, selectedCodiceId])

    /* ─── Cargar voces de ElevenLabs (una vez) ─── */
    useEffect(() => {
        if (!clerkUserId) return
        let cancelled = false
        ;(async () => {
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "listar-voces-elevenlabs",
                { admin_clerk_id: clerkUserId }
            )
            if (!cancelled && r.ok && Array.isArray(r.body?.voices)) {
                // Las dinámicas de la cuenta; mergeVoices dedup/filtra al unir.
                const extra: VoiceOpt[] = r.body.voices
                    .filter((v: any) => v?.voice_id)
                    .map((v: any) => ({
                        voice_id: String(v.voice_id),
                        name: String(v.name || v.voice_id),
                    }))
                setDynamicVoices(extra)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    /* ─── Polling de keyframes/clips pendientes ─── */
    useEffect(() => {
        if (!clerkUserId) return
        const tick = async () => {
            const live = draftsRef.current
            const pendingIds = live
                .filter(isDraftPending)
                .map((d) => d.id)
            if (pendingIds.length === 0) return
            const r = await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "get_vtli_drafts_by_ids",
                { p_admin_clerk_id: clerkUserId, p_ids: pendingIds }
            )
            if (r && Array.isArray(r.drafts)) {
                const fresh = r.drafts as Draft[]
                const byId: Record<string, Draft> = {}
                for (const d of fresh) byId[d.id] = d
                setDrafts((prev) =>
                    prev.map((d) => byId[d.id] ?? d)
                )

                // AUTO-REINTENTO SERIAL: un cuadro a la vez en TODO el panel.
                // Dos reintentos concurrentes a Nano Banana se cuelgan
                // mutuamente (causa de que un cuadro nunca apareciera).
                // Liberamos el "en vuelo" apenas el cuadro se llena, así el
                // siguiente hueco entra en el próximo tick (no espera el plazo
                // entero). Rota por los huecos de storyboards recientes hasta
                // completarlos; el fallback sin-referencia del backend asegura
                // que cada reintento termine produciendo imagen.
                const now = Date.now()
                const st = autoRetryRef.current
                if (st.inFlightKfId) {
                    const filled = fresh.some((d) =>
                        (d.keyframes || []).some(
                            (k) =>
                                k.id === st.inFlightKfId &&
                                (k.image_r2_url || k.video_r2_url)
                        )
                    )
                    if (filled || now > st.inFlightUntil) {
                        st.inFlightKfId = null
                    }
                }
                if (!st.inFlightKfId) {
                    outer: for (const d of fresh) {
                        if (d.status !== "storyboard_ready") continue
                        // Solo storyboards recientes (20 min): no resucitar
                        // arqueología del historial al cargar el panel.
                        const age = now - new Date(d.generated_at).getTime()
                        if (!(age < 20 * 60 * 1000)) continue
                        for (const kf of d.keyframes || []) {
                            if (kf.image_r2_url || kf.video_r2_url) continue
                            if (kf.anim_status === "animating") continue
                            if ((st.counts[kf.id] || 0) >= 8) continue
                            st.counts[kf.id] = (st.counts[kf.id] || 0) + 1
                            st.inFlightKfId = kf.id
                            // 150s > la corrida más larga del server (~140s
                            // cuando un cuadro se cuelga) → no dispara un 2º
                            // reintento del mismo cuadro encima del primero
                            // (eso recrearía la concurrencia que evitamos). Si
                            // el cuadro se llena antes, se libera arriba y el
                            // siguiente hueco entra en el próximo tick.
                            st.inFlightUntil = now + 150000
                            callEdge(
                                supabaseUrl,
                                supabaseAnonKey,
                                "generate-vtli-storyboard",
                                {
                                    admin_clerk_id: clerkUserId,
                                    retry_keyframe_image_for_id: kf.id,
                                    retry_variation: "fresh",
                                }
                            )
                            break outer
                        }
                    }
                }
            }
        }
        const iv = setInterval(tick, 4000)
        return () => clearInterval(iv)
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    /* ─── Generar storyboard ─── */
    const handleGenerate = useCallback(async () => {
        if (generating) return
        if (sourceMode === "codice" && !selectedCodiceId) {
            setError(
                "Elige un Códice de Luz (o cambia la Fuente a Sexta Densidad)."
            )
            return
        }
        setGenerating(true)
        setError(null)
        try {
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "generate-vtli-storyboard",
                {
                    admin_clerk_id: clerkUserId,
                    category,
                    format,
                    // Episodio: clips fijos de 10s → 9/12/18 cuadros según duración.
                    keyframes_count:
                        format === "episodio"
                            ? Math.round(epDuration / 10)
                            : keyframeCount,
                    seconds_per_keyframe:
                        format === "episodio" ? 10 : secPerKf,
                    image_mode: imageMode,
                    prompt_style: promptStyle,
                    colectivo_id: selectedColectivoId,
                    ambiente_id: selectedAmbienteId,
                    codice_id:
                        sourceMode === "codice" ? selectedCodiceId : null,
                }
            )
            if (r.ok && r.body?.draft) {
                setDrafts((prev) => [r.body.draft as Draft, ...prev])
                notify(
                    imageMode === "prompts"
                        ? "Storyboard creado · preparando los prompts para copiar…"
                        : "Storyboard creado · generando cuadros con la misma cara…"
                )
            } else {
                // El edge ya manda el motivo en lenguaje claro (saturación de
                // Gemini / timeout / config); el detalle crudo va aparte.
                setError(
                    `No se pudo generar: ${r.body?.error ?? r.body?.detail ?? "error " + r.status}`
                )
            }
        } catch {
            setError(
                "No se pudo conectar con el generador. Revisa tu conexión y vuelve a intentar."
            )
        } finally {
            setGenerating(false)
        }
    }, [
        generating,
        category,
        format,
        epDuration,
        keyframeCount,
        secPerKf,
        imageMode,
        promptStyle,
        selectedColectivoId,
        selectedAmbienteId,
        sourceMode,
        selectedCodiceId,
        clerkUserId,
        supabaseUrl,
        supabaseAnonKey,
        notify,
    ])

    const removeDraft = useCallback((id: string) => {
        setDrafts((prev) => prev.filter((d) => d.id !== id))
    }, [])

    const patchDraft = useCallback((id: string, patch: Partial<Draft>) => {
        setDrafts((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
        )
    }, [])

    return (
        <div className="am-wrap">
            <p className="am-intro">
                Elige la fuente y la duración: el panel arma un storyboard de
                varios cuadros con la <strong style={{ color: GOLD }}>misma cara</strong>{" "}
                y te entrega cada uno con su prompt de movimiento listo para
                Grok. Anima cada cuadro en Grok (con tu SuperGrok) o por API, sube
                el video, y descarga todos los clips en orden para unirlos en tu
                editor.
            </p>

            <div
                className="am-controls"
                style={isMobile ? { flexDirection: "column", alignItems: "stretch" } : undefined}
            >
                <div className="am-field">
                    <span className="am-field-lbl">Formato</span>
                    <div className="am-seg">
                        <button
                            className={format === "reel" ? "on" : ""}
                            onClick={() => setFormat("reel")}
                            title="Storyboard corto clásico (4-6 cuadros)."
                        >
                            Reel
                        </button>
                        <button
                            className={format === "episodio" ? "on" : ""}
                            onClick={() => setFormat("episodio")}
                            title="Mini-episodio cinematográfico por escenas (90s a 3 min) con arco de 3 actos + música para Suno."
                        >
                            Episodio
                        </button>
                    </div>
                </div>
                <div className="am-field">
                    <span className="am-field-lbl">Fuente</span>
                    <div className="am-seg">
                        <button
                            className={sourceMode === "generic" ? "on" : ""}
                            onClick={() => setSourceMode("generic")}
                            title="La narración usa las semillas de Sexta Densidad (lo de siempre)."
                        >
                            Sexta Densidad
                        </button>
                        <button
                            className={sourceMode === "codice" ? "on" : ""}
                            onClick={() => setSourceMode("codice")}
                            title="La narración desarrolla una enseñanza de uno de tus libros (Códice de Luz)."
                        >
                            Códice de Luz
                        </button>
                    </div>
                </div>
                {sourceMode === "codice" && (
                    <div className="am-field">
                        <span className="am-field-lbl">Códice</span>
                        <select
                            className="am-select"
                            value={selectedCodiceId ?? ""}
                            onChange={(e) =>
                                setSelectedCodiceId(e.target.value || null)
                            }
                            title="El libro del que sale la narración del Reel."
                        >
                            <option value="">Elige un códice…</option>
                            {codices.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="am-field">
                    <span className="am-field-lbl">Colectivo</span>
                    <select
                        className="am-select"
                        value={selectedColectivoId ?? ""}
                        onChange={(e) =>
                            setSelectedColectivoId(e.target.value || null)
                        }
                        title="Civilización protagonista. 'Sintonizar nuevo Colectivo' deja que el motor proyecte una especie nueva."
                    >
                        <option value="">Sintonizar nuevo Colectivo</option>
                        {colectivos.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="am-field">
                    <span className="am-field-lbl">Ambiente</span>
                    <select
                        className="am-select"
                        value={selectedAmbienteId ?? ""}
                        onChange={(e) =>
                            setSelectedAmbienteId(e.target.value || null)
                        }
                        title="Escenario del storyboard. 'Automático' deja que el motor elija el escenario (con variedad anti-repetición)."
                    >
                        <option value="">Automático (variar)</option>
                        {ambientes.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="am-field">
                    <span className="am-field-lbl">Imágenes</span>
                    <div className="am-seg">
                        <button
                            className={imageMode === "prompts" ? "on" : ""}
                            onClick={() => setImageMode("prompts")}
                            title="El panel te da los prompts; las imágenes las generas a mano en tu Nano Banana (plan Pro). Costo $0."
                        >
                            Solo prompts
                        </button>
                        <button
                            className={imageMode === "api" ? "on" : ""}
                            onClick={() => setImageMode("api")}
                            title="El motor genera las imágenes por API (tiene costo por imagen)."
                        >
                            Con API
                        </button>
                    </div>
                </div>
                {imageMode === "prompts" && (
                    <div className="am-field">
                        <span className="am-field-lbl">Prompts</span>
                        <div className="am-seg">
                            <button
                                className={
                                    promptStyle === "reference" ? "on" : ""
                                }
                                onClick={() => setPromptStyle("reference")}
                                title="Generas el #1 (subiendo la imagen del colectivo como referencia) y lo usas de referencia para el #2, #3, #4. Cara idéntica, con pasos extra."
                            >
                                Con referencia
                            </button>
                            <button
                                className={promptStyle === "self" ? "on" : ""}
                                onClick={() => setPromptStyle("self")}
                                title="Cada prompt describe al ser completo. Solo copias y pegas; sale parecido sin subir nada."
                            >
                                Auto-suficiente
                            </button>
                        </div>
                    </div>
                )}
                {format === "reel" ? (
                    <>
                        <div className="am-field">
                            <span className="am-field-lbl">Cuadros</span>
                            <div className="am-seg">
                                {KEYFRAME_COUNTS.map((n) => (
                                    <button
                                        key={n}
                                        className={keyframeCount === n ? "on" : ""}
                                        onClick={() => setKeyframeCount(n)}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="am-field">
                            <span className="am-field-lbl">Segundos por cuadro</span>
                            <div className="am-seg">
                                {SECONDS_PER_KF.map((s) => (
                                    <button
                                        key={s}
                                        className={secPerKf === s ? "on" : ""}
                                        onClick={() => setSecPerKf(s)}
                                    >
                                        {s}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="am-field">
                            <span className="am-field-lbl">Duración total</span>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: GOLD,
                                    padding: "9px 2px",
                                }}
                            >
                                {keyframeCount} × {secPerKf}s = {totalSec}s
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="am-field">
                            <span className="am-field-lbl">Duración del episodio</span>
                            <div className="am-seg">
                                {EPISODE_DURATIONS.map((d) => (
                                    <button
                                        key={d.sec}
                                        className={epDuration === d.sec ? "on" : ""}
                                        onClick={() => setEpDuration(d.sec)}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="am-field">
                            <span className="am-field-lbl">Estructura</span>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: GOLD,
                                    padding: "9px 2px",
                                }}
                            >
                                {(() => {
                                    const d =
                                        EPISODE_DURATIONS.find(
                                            (x) => x.sec === epDuration
                                        ) ?? EPISODE_DURATIONS[0]
                                    return `${d.cuadros} cuadros · ${d.escenas} escenas · clips de 10s · 3 actos + score`
                                })()}
                            </div>
                        </div>
                    </>
                )}
                <div className="am-field">
                    <span className="am-field-lbl">Voz</span>
                    <div className="am-voice-hint">
                        🎙 Se elige y genera después, en cada storyboard.
                    </div>
                </div>
                <button
                    className="am-gen"
                    onClick={handleGenerate}
                    disabled={generating}
                    style={isMobile ? { marginLeft: 0 } : undefined}
                >
                    <span className="g">◈</span>
                    {generating
                        ? format === "episodio"
                            ? "Tejiendo episodio…"
                            : "Tejiendo storyboard…"
                        : format === "episodio"
                        ? "Generar episodio"
                        : "Generar storyboard"}
                </button>
            </div>

            <LibraryManager
                config={COLECTIVO_CONFIG}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                clerkUserId={clerkUserId}
                isMobile={isMobile}
                onChanged={loadColectivos}
                notify={notify}
            />

            <LibraryManager
                config={AMBIENTE_CONFIG}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                clerkUserId={clerkUserId}
                isMobile={isMobile}
                onChanged={loadAmbientes}
                notify={notify}
            />

            <VoicesManager
                customVoices={customVoices}
                onAdd={addCustomVoice}
                onRemove={removeCustomVoice}
            />

            {error && <div className="am-error">{error}</div>}

            {drafts.length === 0 ? (
                <div className="am-empty">
                    Aún no hay storyboards. Genera el primero arriba.
                </div>
            ) : (
                <AnimatePresence initial={false}>
                    {drafts.map((d) => (
                        <DraftCard
                            key={d.id}
                            draft={d}
                            supabaseUrl={supabaseUrl}
                            supabaseAnonKey={supabaseAnonKey}
                            clerkUserId={clerkUserId}
                            voices={voices}
                            selectedVoiceId={selectedVoiceId}
                            codices={codices}
                            onAfterChange={loadDrafts}
                            onPatchDraft={patchDraft}
                            onDelete={removeDraft}
                            notify={notify}
                        />
                    ))}
                </AnimatePresence>
            )}

            {toast && <div className="am-toast">{toast}</div>}
        </div>
    )
}
