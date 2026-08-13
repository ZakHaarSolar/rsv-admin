// MI_Editores.tsx v1.35 — MEMORIA EN TODOS LOS EDITORES (Zak 2026-08-09): Rituales (Afirmaciones + Catálogo), Wallpapers (Galería + Atelier + Telemetría), Avatares, Campo Solar, Cristalización, Comunidad, Medallas, Moderación, Stickers, Biósfera y App se cargan UNA vez por visita (adminActionCached / rpcCached de MI_Shared v2.0). No se hizo en bloque: por cada editor se buscaron TODOS sus puntos de guardado y borrado y cada uno llama `olvidar()` (motorCacheClear de su lectura), porque casi todos guardan de forma optimista y la memoria quedaría vieja. Las tres relecturas que sí releían del servidor (Cristalización al crear ítem, Moderación al resolver/banear) pasan a `load(true)`: con `load()` habrían pintado el estado anterior. TODO editor gana su botón "↻ Recargar" (BtnRecargar) y recargar la página entera sigue limpiando todo. Ajustar los Fotones de una cuenta olvida además el Campo Solar, que es la sub-pestaña de al lado.
// MI_Editores.tsx v1.34 — MEMORIA DE PESTAÑAS: EspejoEditor y BuzonEditor se cargan UNA vez por visita (adminActionCached de MI_Shared v1.9). Entrar al Espejo, irse a otra pestaña y volver ya no repite la consulta ni muestra "Cargando…" otra vez; el botón "Recargar" de cada uno pide datos frescos y recargar la página entera limpia todo.
// MI_Editores.tsx v1.32 — AUDITORÍA DE SEGURIDAD 2026-07-24 · PARTE 2 (hallazgo CRÍTICO): el BORRADO también pasa por adminAction. La ronda anterior migró la lectura y el guardado pero dejó delete_sonda, delete_protocolo_admin y reorder_sondas llamándose con la anon key; verificado en vivo, respondían {"success":true} sin ningún chequeo de admin → cualquiera con la llave pública borraba sondas del Escáner y fases de Calibración, sin backups. Los 5 call sites migrados. Requiere admin-action v1.42 desplegado ANTES de pegar 20260724g. El único rpc() que queda es get_app_release, que es público a propósito.
// MI_Editores.tsx v1.33 — VersionesEditor: (1) UNA VERSIÓN POR TIENDA (Zak, 2026-08-05) — campo propio para Google Play; vacío = Android sigue el número de iPhone. Play publica en ~1h y Apple puede tardar 1 día, así que cada tienda avisa apenas su versión está viva. Requiere migración 20260805c_version_por_tienda. (2) La explicación pasa a una COLUMNA A LA DERECHA (ocupaba una franja entera arriba y empujaba los campos fuera de pantalla); en pantalla angosta se apila sola por flex-wrap. (3) Tarjeta nueva DESDE QUÉ VERSIÓN OBEDECE: el aviso funciona desde 1.0.6 y el bloqueo de emergencia desde 1.1.4. | v1.31 — AUDITORÍA DE SEGURIDAD 2026-07-24: SondasEditor y ProtocolosEditor guardan por adminAction (gateway admin-action) en vez de rpc() con la anon key. upsert_sonda y upsert_protocolo_admin estaban GRANTed a anon SIN chequeo de admin desde 20260705 → cualquiera con la llave pública podía REESCRIBIR las 36 sondas del Escáner y las 60 fases de Calibración. Requiere admin-action v1.40 + migración 20260724c_lockdown_editor_rpcs. | MI_Editores.tsx v1.30 — BiosferaEditor: CRUD de las pistas acústicas de la capa Biósfera (título · frecuencia · descripción · audio_url de R2 · orden · activa · gratis) vía admin-action (admin_get/upsert/delete_biosfera_track). El audio vive en R2, se registra por URL. Requiere migración 20260707_biosfera_tracks. | v1.29 — VersionesEditor: PUBLICAR EN UN BOTÓN + fin del modo insistente. (1) Botón dorado "Publicar siguiente versión → X" (calcula solo la siguiente de la circulación actual) con CONFIRMACIÓN inline (explica: los nodos en versiones anteriores verán el aviso cerrable + tarjeta verde en su Núcleo; la Versión en proceso del badge pasa sola a la siguiente). El campo manual queda como respaldo. (2) Se ELIMINÓ el checkbox "Insistente": p_force siempre false — con force=true el modal del aviso no tenía cierre y BLOQUEABA la app (así quedó atrapado el nodo de Aqua). Pareja de UpdatePrompt v2.0 + MotorDeIntervencion v3.64.
// MI_Editores.tsx v1.28 — el toggle ES|EN ahora también cambia la VISTA DE LISTA (no solo el modo edición) en Sondas y Calibraciones: al poner EN, las preguntas/opciones (Sondas) y los títulos/tareas (Calibraciones) de la lista muestran la traducción, con respaldo al español si aún no existe. Antes la lista se veía en español y solo al abrir "editar" aparecía el inglés. Los editores blur (Afirmaciones/Rituales/Wallpapers/Medallas) ya lo hacían (el input ES la vista). Sin cambios de backend.
// MI_Editores.tsx v1.27 — INTERRUPTOR Español | English en cada editor de contenido (Sondas, Calibraciones, Afirmaciones + categorías, Rituales, Wallpapers + categorías, Medallas tiers + constelaciones): un toggle ES|EN en el encabezado; en EN los campos de texto escriben la columna _en (traducción), en ES la base. La metadata (orden / activo / umbral / score) se guarda en cualquier modo. En ES los guardados quedan IDÉNTICOS a antes (no rompen sin el SQL nuevo); EN requiere pegar admin/supabase/migrations/20260705_i18n_motor_bilingual_rpcs.sql (7 lecturas devuelven _en + 9 upserts aceptan params _en + p_lang con SET condicional). Se agregó LangToggle + helpers alignLabels/alignTasks + campos _en opcionales en las interfaces.
// MI_Editores.tsx v1.26 — VersionesEditor reetiquetado: el campo editable es la "Versión en circulación" (la publicada/viva en la App Store); el texto aclara que la "Versión en proceso" (la que se lanza) se marca en el código y sale sola en el badge del Motor. Sin cambios de lógica (sigue guardando latest_version vía admin_set_app_release). | v1.25 — VersionesEditor: se QUITÓ el campo "Link de la App Store" del panel (el link real ya vive hardcodeado en el cliente/UpdatePrompt); ahora se guarda APPSTORE_LINK fijo (id6774143866).
// MI_Editores.tsx v1.24 — EspejoEditor: renderiza **negrita** (renderEspejoMd) en el diálogo, así no se ven los asteriscos en el panel.
// MI_Editores.tsx v1.23.1 — re-sync (EspejoEditor). EspejoEditor: la pestaña "Espejo" del Motor lee las conversaciones recientes del Espejo Vibracional ANONIMIZADAS (admin_get_oraculo_conversations, gateway admin-action) — alias por hash, sin email/nombre; tarjetas colapsables con el diálogo. Solo lectura. Default export suma EspejoEditor.
// MI_Editores.tsx v1.22 — re-sync a Framer (VersionesEditor + BuzonEditor).
// MI_Editores.tsx v1.21 — VersionesEditor NUEVO: la pestaña "App" del Motor fija la última versión de la app + mensaje + link de la App Store (admin_set_app_release); la app muestra el aviso de actualización a quienes corran una versión anterior. Default export suma VersionesEditor.
// MI_Editores.tsx v1.20 — BuzonEditor NUEVO: la pestaña "Buzón" del Motor lee las ideas/mejoras que mandan los Tripulantes desde Mi Núcleo → Ajustes → "Tu voz construye el Escáner" (tabla app_feedback vía admin_get_app_feedback, gateway admin-action). Solo lectura; respeta el anónimo (sin nombre cuando el server guardó clerk_user_id NULL). Default export suma BuzonEditor.
// MI_Editores.tsx v1.19 — Wallpapers: el orden se reordena en CASCADA y en tiempo real. Al poner un wallpaper en la posición N, se mueve ahí y los demás se recorren (1..K contiguos) — ya no hay que cambiar el otro a mano. Persiste solo las filas que cambiaron (reusa admin_upsert_wallpaper, sin RPC nueva); la lista se renderiza ordenada por sort_order y cada input se re-monta con su nuevo número.
// MI_Editores.tsx v1.18 — Editor de Calibraciones MULTI-ABIERTO: al picar una fase se abre y NO cierra las demás (antes era acordeón de una sola; `expanded` pasó de id único a Set<string> con toggle). Facilita comparar/editar varias fases a la vez.
// MI_Editores.tsx v1.17 — StickersHub NUEVO: la pestaña "Stickers" del Motor edita los paquetes de stickers de Mensajería (CRUD de paquetes + stickers, toggle Premium/Activo, subir arte WebP/PNG/GIF animado por el edge upload-sticker). Premium ↔ Sintonía. Backend: admin_get_sticker_packs + admin_upsert/delete_sticker_pack + admin_add/update/delete_sticker (gateway admin-action) + tablas sticker_packs/stickers (migr. 20260625e). Default export suma StickersHub.
// MI_Editores.tsx v1.16 — la pestaña Medallas suma un RESETEADOR de QA: borra los desbloqueos de medallas de un Tripulante por correo (una constelación o todas) vía admin_reset_user_medals → para volver a probar sin que queden medallas viejas pegadas.
// MI_Editores.tsx v1.15 — la pestaña Wallpapers suma una 3ª sub-tab "Telemetría" (WallpaperTelemetry): cuáles Anclajes Fotónicos descargan más los Tripulantes (ranking + descargas + Tripulantes + última fecha), toggle "Excluir mis cuentas" (misma lista interna que Navegación) + Recargar. Lee get_wallpaper_download_telemetry por admin-action; la data llega con el build iOS que registra cada guardado a Fotos.
// MI_Editores.tsx v1.14 — la pestaña Wallpapers ahora es WallpapersHub con 2 sub-tabs: "Galería" (WallpapersEditor) + "Atelier · Crear" (WallpaperAtelier: genera prompts de wallpapers premium 4K por categoría — 7 categorías — modo solo-prompts para Nano Banana; la categoría Colectivos protagoniza un colectivo guardado o inventa uno; subir colectivo nuevo). Backend: generate-wallpaper-prompt + get_wallpaper_prompts_admin/delete_wallpaper_prompt + get_vtli_colectivos_admin/upsert_vtli_colectivo (gateway admin-action).
// MI_Editores.tsx v1.13 — suma MedallasEditor (umbrales de las Constelaciones de Maestría, editables sin build) + ModeracionPanel (cola de reportes de la Comunidad: banear/revisar/descartar). Backend: admin_get_medallas/admin_upsert_medal_tier/admin_set_medal_constelacion + admin_get_moderation_queue/admin_resolve_report/admin_ban_community_user (gateway admin-action).
// MI_Editores.tsx v1.12 — MensajeAdminEditor: email prellenado con cuerpodeluz555@gmail.com + ⌘/Ctrl+Enter envía.
// v1.11 — herramientas admin: ResetAvatarCard al pie del editor de Avatares (reinicia avatar de un Tripulante por email → admin_reset_avatar) + MensajeAdminEditor (tab "Mensajes" del Motor: envía un DM a cualquier Tripulante por email → admin_send_dm, dispara el push).
// v1.10 — AvataresEditor: suma el editor del TAMAÑO de los elementos de la
// Cámara por AVATAR × ETAPA (footprint). Selector de elemento (Tamaño del
// avatar · Anillos · Aura · Enjambre · Sello · Alas) + 7 campos por etapa;
// base = radio del avatar en %, resto = multiplicador en % (100 = normal).
// Manda p_footprint a admin_upsert_avatar_config (migración 20260620m); el
// cliente lo lee de get_avatar_config y ajusta el tamaño sin build. "Si no se
// modifica, queda igual."
// v1.9 — CristalizacionEditor NUEVO: editor del catálogo de la Cámara de
// Cristalización (la tienda). Avatares + elementos comprables con Fotones:
// nombre, descripción, precio, requisitos de etapa de avatar (0=libre, 1-7) y
// racha, params (JSON), orden, activo, agregar/borrar. DB-driven vía
// admin_get/upsert/delete_crystal_item. Estilo claro y sólido (tarjetas con
// fondo, campos con contraste — no solo bordes sobre negro). Default export
// suma CristalizacionEditor.
// v1.8 — AvataresEditor NUEVO: la pestaña "Avatares" del Motor edita los
// UMBRALES de Fotones por etapa + los params (brillo/respiración/giro) de cada
// avatar de luz (Nova/Aurelia/Prisma) — DB-driven vía admin_get/upsert_avatar_
// config, el cliente los lee de get_avatar_config y aplica sin build. Incluye
// FotonesAdjuster (sumar/restar/fijar los Fotones de una cuenta de pruebas,
// server-authoritative vía daily_checkins). Default export suma AvataresEditor.
// v1.7 — RitualesHub NUEVO: la pestaña "Rituales" del Motor ahora tiene dos
// sub-pestañas internas — "Afirmaciones" (el AfirmacionesEditor existente,
// reusado) y "Rituales" (RitualCatalogEditor NUEVO: edita el catálogo de
// rituales y sus Fotones — label, points, pide texto, activo, orden, agregar/
// borrar — vía admin_get/upsert/delete_ritual_activity). Cambiar los Fotones
// aplica en la app al instante, sin nuevo build. Default export suma RitualesHub.
// v1.6 — WallpapersEditor gana CATEGORÍAS: sección "Categorías" arriba de la
// lista (crear/renombrar/ordenar/activar/borrar vía admin_*_wallpaper_category)
// + un selector de categoría por wallpaper (admin_set_wallpaper_category). El
// tipo AdminWallpaper suma category_id (lo devuelve admin_get_wallpapers). El
// Tripulante filtra la galería del Lente por estas categorías.
// v1.5 — WallpapersEditor NUEVO: galería de fondos del Lente. Subida full-res
// a R2 (edge upload-wallpaper, lado largo 2796 · 0.92) + CRUD por gateway
// admin-action (admin_get/upsert/delete_wallpaper). Cada fila: miniatura,
// título, toggle Gratis (único sin Sintonía), toggle Activo, orden y borrar.
// Lo consume la pestaña "Wallpapers" del Motor. Default export lo suma al
// Object.assign.
// v1.4 — AfirmacionesEditor: categorías MINIMIZADAS por defecto (clic en el
// chevron expande/minimiza) + badge de conteo + afirmaciones con texto claro
// (#eaf2ff) y relleno para legibilidad. Reporte de Zak: los paneles se veían
// apagados y costaba leerlos.
// v1.3 — AfirmacionesEditor: editor del catálogo de Afirmaciones del Ritual
// Diario (categorías + afirmaciones), ruteado por el gateway admin-action
// (adminAction → admin_get/upsert/delete_ritual_*). Lo consume la pestaña
// "Rituales" del Motor. Permite a Zak agregar categorías y afirmaciones sin
// tocar código. Default export suma AfirmacionesEditor al Object.assign.
// v1.2 — Tareas nuevas en el editor de Calibraciones arrancan con desc
// vacío en lugar de "Nueva tarea...". Reporte de Zak: el placeholder
// hardcoded se quedaba en el campo y obligaba a borrarlo antes de poder
// escribir. Ahora el cursor cae en un campo limpio y la pista
// "Describe la tarea…" vive como placeholder visual del textarea (gris
// tenue, no se persiste).
// v1.1 — ScoreInput component nuevo para los campos MIN/MAX del rango de
// activación de las Calibraciones. Antes el input usaba `parseInt(value)
// || 0` y el 0 residual quedaba pegado al borrar — el usuario tenía que
// poner un número antes de poder limpiar la entrada. Ahora el componente
// trackea su propia raw string y solo emite al padre cuando el valor
// es numérico válido. Al perder foco (blur) o al guardar se normaliza
// (clamp 0..100, vacío → 0). Permite borrar el campo entero, escribir
// el número que se quiera, y volver a borrar sin fricción.
// SondasEditor + ProtocolosEditor — los dos editores admin del Escáner
// Vibracional. CRUD de sondas (preguntas + 5 opciones por pilar) y de
// calibraciones (fases + tareas + rangos de score). Default export =
// ghost component con Object.assign de los dos editores.
//
// Consumidor: MotorDeIntervencion (shell).
// Patrón de import:
//   import Editores from "./MI_Editores.tsx"
//   const { SondasEditor, ProtocolosEditor } = Editores

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Shared from "./MI_Shared.tsx"

const {
    rpc,
    rpcCached,
    norm,
    hx,
    SCORE_VALUES,
    AC,
    GOLD,
    adminAction,
    adminActionCached,
    motorCacheClear,
} = Shared

/* ═══ INTERRUPTOR DE IDIOMA (autoría bilingüe) ═══
   Cada editor de contenido gana este toggle en su encabezado. En EN los campos
   de texto leen/escriben la columna _en (traducción); en ES la columna base.
   La metadata (orden/activo/umbral/…) es agnóstica de idioma. En ES los
   guardados quedan idénticos a antes: los params _en + p_lang SOLO se mandan en
   modo EN, así el flujo español no rompe aunque el SQL nuevo no esté pegado. */
type Lang = "es" | "en"

function LangToggle({
    lang,
    onChange,
}: {
    lang: Lang
    onChange: (l: Lang) => void
}) {
    return (
        <div
            style={{
                display: "inline-flex",
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${hx(GOLD, 0.35)}`,
                flexShrink: 0,
            }}
            title="Idioma del contenido — EN edita la traducción"
        >
            {(["es", "en"] as Lang[]).map((l) => (
                <button
                    key={l}
                    onClick={() => onChange(l)}
                    style={{
                        padding: "5px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        border: "none",
                        cursor: "pointer",
                        background: lang === l ? GOLD : "transparent",
                        color: lang === l ? "#0b1220" : hx("#ffffff", 0.55),
                        transition: "background 0.15s, color 0.15s",
                    }}
                >
                    {l === "es" ? "ES" : "EN"}
                </button>
            ))}
        </div>
    )
}

/* 🜂 REFRESCO DE PESTAÑA — el único gesto que pide datos frescos.
   Toda pestaña editora se carga UNA vez por visita (adminActionCached de
   MI_Shared v1.9). Este botón es la contraparte obligatoria: si la memoria
   existe, tiene que haber una forma visible de saltársela. `onClick` llama
   siempre a `load(true)`. */
function BtnRecargar({
    onClick,
    disabled,
    label = "↻ Recargar",
}: {
    onClick: () => void
    disabled?: boolean
    label?: string
}) {
    return (
        <button className="mi-btn" onClick={onClick} disabled={disabled}>
            {label}
        </button>
    )
}

/* Alinea un array de traducción (_en) al array base por índice, conservando la
   llave estructural (value / id) del base y tomando el texto _en donde exista.
   Así el editor muestra la traducción actual y nunca desalinea peso/estructura. */
function alignLabels(
    base: { label: string; value: number }[],
    en: any
): { label: string; value: number }[] {
    const e = Array.isArray(en) ? en : []
    return (base || []).map((o, i) => ({
        label: e[i] && typeof e[i].label === "string" ? e[i].label : "",
        value: o.value,
    }))
}
function alignTasks(
    base: { id: string; desc: string }[],
    en: any
): { id: string; desc: string }[] {
    const e = Array.isArray(en) ? en : []
    return (base || []).map((t, i) => {
        const m = e.find((x: any) => x && x.id === t.id) || e[i]
        return {
            id: t.id,
            desc: m && typeof m.desc === "string" ? m.desc : "",
        }
    })
}

/* ═══ SCORE INPUT ═══
   Input numérico que mantiene su propia raw string para soportar el
   estado "vacío" mientras el admin está borrando para escribir un
   número nuevo. value (number) sigue siendo la fuente de verdad del
   padre; al cambiar (otra Calibración seleccionada, otro foco) la
   raw se resincroniza. onCommit dispara con cada número válido y al
   perder foco; un valor vacío al blur normaliza a min. */
function ScoreInput({
    value,
    onCommit,
    min = 0,
    max = 100,
}: {
    value: number
    onCommit: (n: number) => void
    min?: number
    max?: number
}) {
    const [raw, setRaw] = React.useState<string>(String(value))
    const lastValueRef = React.useRef<number>(value)
    React.useEffect(() => {
        if (value !== lastValueRef.current) {
            lastValueRef.current = value
            setRaw(String(value))
        }
    }, [value])
    return (
        <input
            className="mi-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={raw}
            onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "")
                setRaw(v)
                if (v === "") return
                const n = parseInt(v, 10)
                if (!Number.isNaN(n)) {
                    const clamped = Math.max(min, Math.min(max, n))
                    onCommit(clamped)
                    lastValueRef.current = clamped
                }
            }}
            onBlur={() => {
                if (raw === "") {
                    onCommit(min)
                    lastValueRef.current = min
                    setRaw(String(min))
                } else {
                    const n = Math.max(
                        min,
                        Math.min(max, parseInt(raw, 10) || min)
                    )
                    onCommit(n)
                    lastValueRef.current = n
                    setRaw(String(n))
                }
            }}
            style={{
                width: 60,
                padding: "4px 8px",
                fontSize: 11,
            }}
        />
    )
}

type Pilar =
    | "FISICO"
    | "MENTAL"
    | "EMOCIONAL"
    | "FINANCIERO"
    | "VECTOR"
    | "ORBITA"

interface SondaRow {
    id: string
    pilar: string
    step_order: number
    question_text: string
    options_json: { label: string; value: number }[]
    is_active: boolean
    // Traducción (autoría bilingüe). options_json_en llega como string o array.
    question_text_en?: string
    options_json_en?: { label: string; value: number }[]
}

interface ProtoRow {
    id: string
    pilar: string
    fase: number
    titulo: string
    descripcion_corta: string
    alerta_text: string
    sugerencia_text: string
    tareas_json: { id: string; desc: string }[]
    is_active: boolean
    score_min: number
    score_max: number
    // Traducción (autoría bilingüe). tareas_json_en llega como string o array.
    titulo_en?: string
    descripcion_corta_en?: string
    alerta_text_en?: string
    sugerencia_text_en?: string
    tareas_json_en?: { id: string; desc: string }[]
}

/* ═══ SONDAS EDITOR ═══ */
function SondasEditor({
    pilar,
    sondas,
    onRefresh,
    url,
    apiKey,
    addActionRef,
    cancelActionRef,
    isEditingRef,
}: {
    pilar: Pilar
    sondas: SondaRow[]
    onRefresh: () => void
    url: string
    apiKey: string
    addActionRef: React.MutableRefObject<(() => void) | null>
    cancelActionRef: React.MutableRefObject<(() => void) | null>
    isEditingRef: React.MutableRefObject<boolean>
}) {
    const items = sondas
        .filter((s) => s.pilar === pilar)
        .sort((a, b) => a.step_order - b.step_order)
    const [editing, setEditing] = useState<string | null>(null)
    const [editData, setEditData] = useState<SondaRow | null>(null)
    const [lang, setLang] = useState<Lang>("es")
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState("")
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const saveRef = useRef<(() => Promise<void>) | null>(null)
    const isNewRef = useRef(false)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(""), 2000)
    }

    const startEdit = (s: SondaRow) => {
        isNewRef.current = false
        setEditing(s.id)
        const base = norm(s.options_json) || []
        setEditData({
            ...s,
            options_json: base,
            question_text_en: s.question_text_en || "",
            options_json_en: alignLabels(base, norm(s.options_json_en)),
        })
    }
    const cancelEdit = async () => {
        if (isNewRef.current && editing) {
            await adminAction(url, apiKey, "delete_sonda", { p_id: editing })
            onRefresh()
        }
        isNewRef.current = false
        setEditing(null)
        setEditData(null)
    }

    useEffect(() => {
        isEditingRef.current = !!editing
        cancelActionRef.current = editing ? cancelEdit : null
    }, [editing])

    useEffect(() => {
        if (!editing) return
        const h = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                if (saveRef.current) saveRef.current()
            }
        }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [editing])

    useEffect(() => {
        if (editing) return
        if (!hoveredId) return
        const h = (e: KeyboardEvent) => {
            if (e.key !== "e" && e.key !== "E") return
            const tag = (document.activeElement?.tagName || "").toLowerCase()
            if (tag === "input" || tag === "textarea") return
            const target = items.find((s) => s.id === hoveredId)
            if (!target) return
            e.preventDefault()
            startEdit(target)
        }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [editing, hoveredId, items])

    const saveEdit = async () => {
        if (!editData) return
        setSaving(true)
        const opts = editData.options_json.map((o) => ({
            label: o.label,
            value: o.value,
        }))
        const params: Record<string, any> = {
            p_id: editData.id,
            p_pilar: editData.pilar,
            p_step_order: editData.step_order,
            p_question_text: editData.question_text,
            p_options_json: JSON.stringify(opts),
            p_is_active: editData.is_active,
        }
        if (lang === "en") {
            const optsEn = (editData.options_json_en || []).map((o, i) => ({
                label: o.label,
                value: editData.options_json[i]?.value ?? o.value,
            }))
            params.p_question_text_en = editData.question_text_en || ""
            params.p_options_json_en = JSON.stringify(optsEn)
            params.p_lang = "en"
        }
        await adminAction(url, apiKey, "upsert_sonda", params)
        isNewRef.current = false
        setSaving(false)
        setEditing(null)
        setEditData(null)
        onRefresh()
        showToast("Sonda guardada ✦")
    }
    saveRef.current = saveEdit

    const addStep = async () => {
        const nextOrder =
            items.length > 0
                ? Math.max(...items.map((s) => s.step_order)) + 1
                : 1
        const emptyOpts = SCORE_VALUES.map((v: number) => ({
            label: "",
            value: v,
        }))
        const res = await adminAction(url, apiKey, "upsert_sonda", {
            p_pilar: pilar,
            p_step_order: nextOrder,
            p_question_text: "",
            p_options_json: JSON.stringify(emptyOpts),
        })
        await onRefresh()
        if (res?.id) {
            isNewRef.current = true
            setEditing(res.id)
            setEditData({
                id: res.id,
                pilar,
                step_order: nextOrder,
                question_text: "",
                options_json: emptyOpts,
                is_active: true,
                question_text_en: "",
                options_json_en: emptyOpts.map((o: any) => ({
                    label: "",
                    value: o.value,
                })),
            })
        }
    }
    addActionRef.current = editing ? null : addStep

    const deleteStep = async (id: string) => {
        await adminAction(url, apiKey, "delete_sonda", { p_id: id })
        onRefresh()
        showToast("Paso eliminado")
    }

    const moveStep = async (id: string, dir: -1 | 1) => {
        const idx = items.findIndex((s) => s.id === id)
        if (idx < 0) return
        const newIdx = idx + dir
        if (newIdx < 0 || newIdx >= items.length) return
        const newOrder = [...items]
        const [moved] = newOrder.splice(idx, 1)
        newOrder.splice(newIdx, 0, moved)
        const ids = newOrder.map((s) => s.id)
        await adminAction(url, apiKey, "reorder_sondas", {
            p_pilar: pilar,
            p_ordered_ids: ids,
        })
        onRefresh()
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#fff",
                    }}
                >
                    {items.length} paso{items.length !== 1 ? "s" : ""} · {pilar}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LangToggle lang={lang} onChange={setLang} />
                    <button className="mi-btn" onClick={addStep}>
                        + Agregar Paso
                    </button>
                </div>
            </div>

            {(editing ? items.filter((s) => s.id === editing) : items).map(
                (s) => {
                    const isEd = editing === s.id && editData
                    const opts = norm(s.options_json) || []
                    // Vista de LISTA bilingüe: en EN muestra la traducción (con
                    // respaldo al español si aún no existe).
                    const optsEn = norm(s.options_json_en) || []
                    const qDisp =
                        lang === "en"
                            ? s.question_text_en || s.question_text
                            : s.question_text
                    const allIdx = items.findIndex((x) => x.id === s.id)
                    return (
                        <div
                            key={s.id}
                            className="mi-card"
                            onMouseEnter={() => setHoveredId(s.id)}
                            onMouseLeave={() =>
                                setHoveredId((prev) =>
                                    prev === s.id ? null : prev
                                )
                            }
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    marginBottom: isEd ? 16 : 0,
                                }}
                            >
                                <span className="mi-badge">{s.step_order}</span>
                                <div style={{ flex: 1 }}>
                                    {isEd ? (
                                        <textarea
                                            className="mi-input"
                                            value={
                                                lang === "en"
                                                    ? editData!
                                                          .question_text_en ||
                                                      ""
                                                    : editData!.question_text
                                            }
                                            onChange={(e) =>
                                                setEditData(
                                                    lang === "en"
                                                        ? {
                                                              ...editData!,
                                                              question_text_en:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : {
                                                              ...editData!,
                                                              question_text:
                                                                  e.target
                                                                      .value,
                                                          }
                                                )
                                            }
                                            rows={2}
                                            style={{ fontSize: 14 }}
                                            autoFocus
                                            placeholder={
                                                lang === "en"
                                                    ? "Write the probe question..."
                                                    : "Escribe la pregunta de la sonda..."
                                            }
                                        />
                                    ) : (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 14,
                                                fontWeight: 300,
                                                lineHeight: 1.6,
                                                color: qDisp
                                                    ? "#fff"
                                                    : "rgba(255,255,255,0.2)",
                                            }}
                                        >
                                            {qDisp || "(sin pregunta)"}
                                        </p>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        flexShrink: 0,
                                    }}
                                >
                                    {!editing && (
                                        <>
                                            <button
                                                className="mi-btn"
                                                onClick={() =>
                                                    moveStep(s.id, -1)
                                                }
                                                style={{
                                                    padding: "6px 8px",
                                                    opacity:
                                                        allIdx === 0 ? 0.2 : 1,
                                                }}
                                                disabled={allIdx === 0}
                                            >
                                                ↑
                                            </button>
                                            <button
                                                className="mi-btn"
                                                onClick={() =>
                                                    moveStep(s.id, 1)
                                                }
                                                style={{
                                                    padding: "6px 8px",
                                                    opacity:
                                                        allIdx ===
                                                        items.length - 1
                                                            ? 0.2
                                                            : 1,
                                                }}
                                                disabled={
                                                    allIdx === items.length - 1
                                                }
                                            >
                                                ↓
                                            </button>
                                        </>
                                    )}
                                    {!isEd && (
                                        <button
                                            className="mi-btn-gold mi-btn"
                                            onClick={() => startEdit(s)}
                                        >
                                            ✎
                                        </button>
                                    )}
                                    {!editing && (
                                        <button
                                            className="mi-btn-red mi-btn"
                                            onClick={() => deleteStep(s.id)}
                                            style={{ padding: "6px 8px" }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: isEd ? 0 : 12 }}>
                                {(isEd ? editData!.options_json : opts).map(
                                    (opt: any, oi: number) => (
                                        <div key={oi} className="mi-opt">
                                            <span className="mi-opt-val">
                                                {opt.value}%
                                            </span>
                                            {isEd ? (
                                                <textarea
                                                    className="mi-input"
                                                    value={
                                                        lang === "en"
                                                            ? (editData!
                                                                  .options_json_en?.[
                                                                  oi
                                                              ]?.label ?? "")
                                                            : opt.label
                                                    }
                                                    onChange={(e) => {
                                                        if (lang === "en") {
                                                            const arr = [
                                                                ...(editData!
                                                                    .options_json_en ||
                                                                    []),
                                                            ]
                                                            arr[oi] = {
                                                                label: e.target
                                                                    .value,
                                                                value: opt.value,
                                                            }
                                                            setEditData({
                                                                ...editData!,
                                                                options_json_en:
                                                                    arr,
                                                            })
                                                        } else {
                                                            const newOpts = [
                                                                ...editData!
                                                                    .options_json,
                                                            ]
                                                            newOpts[oi] = {
                                                                ...newOpts[oi],
                                                                label: e.target
                                                                    .value,
                                                            }
                                                            setEditData({
                                                                ...editData!,
                                                                options_json:
                                                                    newOpts,
                                                            })
                                                        }
                                                    }}
                                                    rows={2}
                                                    style={{
                                                        fontSize: 12,
                                                        padding: "6px 10px",
                                                    }}
                                                    placeholder={
                                                        lang === "en"
                                                            ? `Answer for ${opt.value}%...`
                                                            : `Respuesta para ${opt.value}%...`
                                                    }
                                                />
                                            ) : (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 12,
                                                        fontWeight: 300,
                                                        lineHeight: 1.5,
                                                        color: (
                                                            lang === "en"
                                                                ? optsEn[oi]
                                                                      ?.label ||
                                                                  opt.label
                                                                : opt.label
                                                        )
                                                            ? "#fff"
                                                            : "rgba(255,255,255,0.15)",
                                                    }}
                                                >
                                                    {(lang === "en"
                                                        ? optsEn[oi]?.label ||
                                                          opt.label
                                                        : opt.label) || "—"}
                                                </p>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {isEd && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginTop: 12,
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 10,
                                            color: "#fff",
                                            marginRight: 8,
                                        }}
                                    >
                                        ⌘+Enter para guardar · ESC cancelar
                                    </span>
                                    <button
                                        className="mi-btn"
                                        onClick={cancelEdit}
                                        style={{
                                            color: "#fff",
                                            borderColor:
                                                "rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="mi-btn-gold mi-btn"
                                        onClick={saveEdit}
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Guardando..."
                                            : "✦ Guardar Sonda"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                }
            )}

            {items.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 300,
                            color: "#fff",
                        }}
                    >
                        No hay sondas configuradas para este pilar.
                    </p>
                    <button
                        className="mi-btn"
                        onClick={addStep}
                        style={{ marginTop: 16 }}
                    >
                        + Crear primera sonda
                    </button>
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══ PROTOCOLOS EDITOR ═══ */
function ProtocolosEditor({
    pilar,
    protos,
    onRefresh,
    url,
    apiKey,
    addActionRef,
    cancelActionRef,
    isEditingRef,
}: {
    pilar: Pilar
    protos: ProtoRow[]
    onRefresh: () => void
    url: string
    apiKey: string
    addActionRef: React.MutableRefObject<(() => void) | null>
    cancelActionRef: React.MutableRefObject<(() => void) | null>
    isEditingRef: React.MutableRefObject<boolean>
}) {
    const items = protos
        .filter((p) => p.pilar === pilar)
        .sort((a, b) => a.fase - b.fase)
    const [editing, setEditing] = useState<string | null>(null)
    const [editData, setEditData] = useState<ProtoRow | null>(null)
    const [lang, setLang] = useState<Lang>("es")
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState("")
    // Multi-abierto: cada fase que abres se queda abierta (abrir una NO cierra
    // las demás). Antes era un solo id (acordeón de una sola fase a la vez).
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const protoSaveRef = useRef<(() => Promise<void>) | null>(null)
    const isNewProtoRef = useRef(false)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(""), 2000)
    }

    const startEdit = (p: ProtoRow) => {
        isNewProtoRef.current = false
        setEditing(p.id)
        const base = norm(p.tareas_json) || []
        setEditData({
            ...p,
            tareas_json: base,
            titulo_en: p.titulo_en || "",
            descripcion_corta_en: p.descripcion_corta_en || "",
            alerta_text_en: p.alerta_text_en || "",
            sugerencia_text_en: p.sugerencia_text_en || "",
            tareas_json_en: alignTasks(base, norm(p.tareas_json_en)),
        })
    }
    const cancelEdit = async () => {
        if (isNewProtoRef.current && editing) {
            await adminAction(url, apiKey, "delete_protocolo_admin", {
                p_id: editing,
            })
            onRefresh()
        }
        isNewProtoRef.current = false
        setEditing(null)
        setEditData(null)
    }

    useEffect(() => {
        isEditingRef.current = !!editing
        cancelActionRef.current = editing ? cancelEdit : null
    }, [editing])

    useEffect(() => {
        if (!editing) return
        const h = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                if (protoSaveRef.current) protoSaveRef.current()
            }
        }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [editing])

    useEffect(() => {
        if (editing) return
        if (!hoveredId) return
        const h = (e: KeyboardEvent) => {
            if (e.key !== "e" && e.key !== "E") return
            const tag = (document.activeElement?.tagName || "").toLowerCase()
            if (tag === "input" || tag === "textarea") return
            const target = items.find((p) => p.id === hoveredId)
            if (!target) return
            e.preventDefault()
            startEdit(target)
        }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [editing, hoveredId, items])

    const saveEdit = async () => {
        if (!editData) return
        setSaving(true)
        const params: Record<string, any> = {
            p_id: editData.id,
            p_pilar: editData.pilar,
            p_fase: editData.fase,
            p_titulo: editData.titulo,
            p_descripcion_corta: editData.descripcion_corta,
            p_alerta_text: editData.alerta_text,
            p_sugerencia_text: editData.sugerencia_text,
            p_tareas_json: JSON.stringify(editData.tareas_json),
            p_is_active: editData.is_active,
            p_score_min: editData.score_min,
            p_score_max: editData.score_max,
        }
        if (lang === "en") {
            const tareasEn = (editData.tareas_json_en || []).map((t, i) => ({
                id: editData.tareas_json[i]?.id ?? t.id,
                desc: t.desc,
            }))
            params.p_titulo_en = editData.titulo_en || ""
            params.p_descripcion_corta_en = editData.descripcion_corta_en || ""
            params.p_alerta_text_en = editData.alerta_text_en || ""
            params.p_sugerencia_text_en = editData.sugerencia_text_en || ""
            params.p_tareas_json_en = JSON.stringify(tareasEn)
            params.p_lang = "en"
        }
        await adminAction(url, apiKey, "upsert_protocolo_admin", params)
        isNewProtoRef.current = false
        setSaving(false)
        setEditing(null)
        setEditData(null)
        onRefresh()
        showToast("Protocolo guardado ✦")
    }
    protoSaveRef.current = saveEdit

    const addProto = async () => {
        const nextFase =
            items.length > 0 ? Math.max(...items.map((p) => p.fase)) + 1 : 1
        const prevMax = items.length > 0 ? items[items.length - 1].score_max : 0
        const sMin = Math.min(prevMax + 1, 100),
            sMax = Math.min(prevMax + 25, 100)
        const titulo = `PROTOCOLO ${pilar} — FASE ${nextFase}`
        const tareas = [
            { id: `${pilar.toLowerCase().charAt(0)}${nextFase}_1`, desc: "" },
        ]
        const res = await adminAction(url, apiKey, "upsert_protocolo_admin", {
            p_pilar: pilar,
            p_fase: nextFase,
            p_titulo: titulo,
            p_descripcion_corta: "",
            p_alerta_text: "",
            p_sugerencia_text: "",
            p_tareas_json: JSON.stringify(tareas),
            p_score_min: sMin,
            p_score_max: sMax,
        })
        await onRefresh()
        if (res?.id) {
            isNewProtoRef.current = true
            setEditing(res.id)
            setEditData({
                id: res.id,
                pilar,
                fase: nextFase,
                titulo,
                descripcion_corta: "",
                alerta_text: "",
                sugerencia_text: "",
                tareas_json: tareas,
                is_active: true,
                score_min: sMin,
                score_max: sMax,
                titulo_en: "",
                descripcion_corta_en: "",
                alerta_text_en: "",
                sugerencia_text_en: "",
                tareas_json_en: tareas.map((t) => ({ id: t.id, desc: "" })),
            })
        }
    }
    addActionRef.current = editing ? null : addProto

    const deleteProto = async (id: string) => {
        await adminAction(url, apiKey, "delete_protocolo_admin", { p_id: id })
        onRefresh()
        showToast("Protocolo eliminado")
    }

    const addTask = () => {
        if (!editData) return
        const newId = `${pilar.toLowerCase().charAt(0)}${editData.fase}_${editData.tareas_json.length + 1}`
        /* v1.2 — Tarea nueva arranca con desc vacío. Antes traía
           "Nueva tarea..." y el admin tenía que borrarlo manualmente
           antes de poder escribir; con el campo vacío el cursor cae
           directo y se escribe sin fricción. */
        setEditData({
            ...editData,
            tareas_json: [...editData.tareas_json, { id: newId, desc: "" }],
        })
    }
    const removeTask = (idx: number) => {
        if (!editData) return
        const t = [...editData.tareas_json]
        t.splice(idx, 1)
        setEditData({ ...editData, tareas_json: t })
    }
    const updateTask = (idx: number, desc: string) => {
        if (!editData) return
        if (lang === "en") {
            const t = [...(editData.tareas_json_en || [])]
            t[idx] = {
                id: t[idx]?.id ?? editData.tareas_json[idx]?.id ?? "",
                desc,
            }
            setEditData({ ...editData, tareas_json_en: t })
        } else {
            const t = [...editData.tareas_json]
            t[idx] = { ...t[idx], desc }
            setEditData({ ...editData, tareas_json: t })
        }
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#fff",
                    }}
                >
                    {items.length} fase{items.length !== 1 ? "s" : ""} · {pilar}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LangToggle lang={lang} onChange={setLang} />
                    <button className="mi-btn" onClick={addProto}>
                        + Agregar Fase
                    </button>
                </div>
            </div>

            {(editing ? items.filter((p) => p.id === editing) : items).map(
                (p) => {
                    const isEd = editing === p.id && editData
                    const isExp = expanded.has(p.id) || isEd
                    const tasks = norm(p.tareas_json) || []
                    // Vista de LISTA bilingüe (respaldo al español).
                    const tasksEn = norm(p.tareas_json_en) || []
                    const titDisp =
                        lang === "en" ? p.titulo_en || p.titulo : p.titulo
                    return (
                        <div
                            key={p.id}
                            className="mi-card"
                            onMouseEnter={() => setHoveredId(p.id)}
                            onMouseLeave={() =>
                                setHoveredId((prev) =>
                                    prev === p.id ? null : prev
                                )
                            }
                            style={{
                                borderColor: isEd ? hx(GOLD, 0.2) : undefined,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    cursor: "pointer",
                                }}
                                onClick={() =>
                                    !isEd &&
                                    setExpanded((prev) => {
                                        const n = new Set(prev)
                                        if (n.has(p.id)) n.delete(p.id)
                                        else n.add(p.id)
                                        return n
                                    })
                                }
                            >
                                <span
                                    className="mi-badge"
                                    style={{
                                        background: "rgba(200,164,78,0.08)",
                                        borderColor: "rgba(200,164,78,0.15)",
                                        color: GOLD,
                                    }}
                                >
                                    F{p.fase}
                                </span>
                                <div style={{ flex: 1 }}>
                                    {isEd ? (
                                        <input
                                            className="mi-input"
                                            value={
                                                lang === "en"
                                                    ? editData!.titulo_en || ""
                                                    : editData!.titulo
                                            }
                                            onChange={(e) =>
                                                setEditData(
                                                    lang === "en"
                                                        ? {
                                                              ...editData!,
                                                              titulo_en:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : {
                                                              ...editData!,
                                                              titulo: e.target
                                                                  .value,
                                                          }
                                                )
                                            }
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                            }}
                                        />
                                    ) : (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 14,
                                                fontWeight: 500,
                                                letterSpacing: "0.06em",
                                                color: "#fff",
                                            }}
                                        >
                                            {titDisp}
                                        </p>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            marginTop: 4,
                                        }}
                                    >
                                        {isEd ? (
                                            <>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            color: "#fff",
                                                        }}
                                                    >
                                                        MIN:
                                                    </span>
                                                    <ScoreInput
                                                        value={
                                                            editData!.score_min
                                                        }
                                                        onCommit={(n) =>
                                                            setEditData({
                                                                ...editData!,
                                                                score_min: n,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            color: "#fff",
                                                        }}
                                                    >
                                                        MAX:
                                                    </span>
                                                    <ScoreInput
                                                        value={
                                                            editData!.score_max
                                                        }
                                                        onCommit={(n) =>
                                                            setEditData({
                                                                ...editData!,
                                                                score_max: n,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "#fff",
                                                }}
                                            >
                                                Rango: {p.score_min}% —{" "}
                                                {p.score_max}% · {tasks.length}{" "}
                                                tarea
                                                {tasks.length !== 1
                                                    ? "s"
                                                    : ""}{" "}
                                                ·{" "}
                                                {p.is_active
                                                    ? "Activo"
                                                    : "Inactivo"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        flexShrink: 0,
                                    }}
                                >
                                    {!isEd && (
                                        <button
                                            className="mi-btn-gold mi-btn"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                startEdit(p)
                                            }}
                                        >
                                            ✎
                                        </button>
                                    )}
                                    <button
                                        className="mi-btn-red mi-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteProto(p.id)
                                        }}
                                        style={{ padding: "6px 8px" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {isExp && (
                                <div style={{ marginTop: 16 }}>
                                    {isEd && (
                                        <>
                                            <p className="mi-label">Alerta</p>
                                            <textarea
                                                className="mi-input"
                                                value={
                                                    lang === "en"
                                                        ? editData!
                                                              .alerta_text_en ||
                                                          ""
                                                        : editData!.alerta_text
                                                }
                                                onChange={(e) =>
                                                    setEditData(
                                                        lang === "en"
                                                            ? {
                                                                  ...editData!,
                                                                  alerta_text_en:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : {
                                                                  ...editData!,
                                                                  alerta_text:
                                                                      e.target
                                                                          .value,
                                                              }
                                                    )
                                                }
                                                rows={2}
                                                style={{ marginBottom: 12 }}
                                            />
                                            <p className="mi-label">
                                                Sugerencia
                                            </p>
                                            <textarea
                                                className="mi-input"
                                                value={
                                                    lang === "en"
                                                        ? editData!
                                                              .sugerencia_text_en ||
                                                          ""
                                                        : editData!
                                                              .sugerencia_text
                                                }
                                                onChange={(e) =>
                                                    setEditData(
                                                        lang === "en"
                                                            ? {
                                                                  ...editData!,
                                                                  sugerencia_text_en:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : {
                                                                  ...editData!,
                                                                  sugerencia_text:
                                                                      e.target
                                                                          .value,
                                                              }
                                                    )
                                                }
                                                rows={2}
                                                style={{ marginBottom: 12 }}
                                            />
                                            <p className="mi-label">
                                                Descripción Corta
                                            </p>
                                            <textarea
                                                className="mi-input"
                                                value={
                                                    lang === "en"
                                                        ? editData!
                                                              .descripcion_corta_en ||
                                                          ""
                                                        : editData!
                                                              .descripcion_corta
                                                }
                                                onChange={(e) =>
                                                    setEditData(
                                                        lang === "en"
                                                            ? {
                                                                  ...editData!,
                                                                  descripcion_corta_en:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : {
                                                                  ...editData!,
                                                                  descripcion_corta:
                                                                      e.target
                                                                          .value,
                                                              }
                                                    )
                                                }
                                                rows={1}
                                                style={{ marginBottom: 12 }}
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <label
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#fff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            editData!.is_active
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData!,
                                                                is_active:
                                                                    e.target
                                                                        .checked,
                                                            })
                                                        }
                                                        style={{
                                                            accentColor: AC,
                                                        }}
                                                    />
                                                    Protocolo Activo
                                                </label>
                                            </div>
                                        </>
                                    )}

                                    <p
                                        className="mi-label"
                                        style={{ marginTop: 8 }}
                                    >
                                        Tareas Quirúrgicas
                                    </p>
                                    {(isEd ? editData!.tareas_json : tasks).map(
                                        (t: any, ti: number) => (
                                            <div
                                                key={ti}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: 8,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        color: "#fff",
                                                        marginTop: 8,
                                                        flexShrink: 0,
                                                        width: 20,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {ti + 1}.
                                                </span>
                                                {isEd ? (
                                                    <>
                                                        <textarea
                                                            className="mi-input"
                                                            value={
                                                                lang === "en"
                                                                    ? (editData!
                                                                          .tareas_json_en?.[
                                                                          ti
                                                                      ]?.desc ??
                                                                      "")
                                                                    : t.desc
                                                            }
                                                            onChange={(e) =>
                                                                updateTask(
                                                                    ti,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={
                                                                lang === "en"
                                                                    ? "Describe the task…"
                                                                    : "Describe la tarea…"
                                                            }
                                                            rows={1}
                                                            style={{
                                                                fontSize: 12,
                                                                flex: 1,
                                                            }}
                                                        />
                                                        {lang !== "en" && (
                                                            <button
                                                                className="mi-btn-red mi-btn"
                                                                onClick={() =>
                                                                    removeTask(
                                                                        ti
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "4px 6px",
                                                                    fontSize: 10,
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 12,
                                                            fontWeight: 300,
                                                            lineHeight: 1.5,
                                                            color: "#fff",
                                                            paddingTop: 4,
                                                        }}
                                                    >
                                                        {lang === "en"
                                                            ? tasksEn[ti]
                                                                  ?.desc ||
                                                              t.desc
                                                            : t.desc}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                                    {isEd && lang !== "en" && (
                                        <button
                                            className="mi-btn"
                                            onClick={addTask}
                                            style={{
                                                marginTop: 8,
                                                fontSize: 10,
                                            }}
                                        >
                                            + Tarea
                                        </button>
                                    )}

                                    {isEd && (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                marginTop: 16,
                                                justifyContent: "flex-end",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "#fff",
                                                    marginRight: 8,
                                                }}
                                            >
                                                ⌘+Enter para guardar · ESC
                                                cancelar
                                            </span>
                                            <button
                                                className="mi-btn"
                                                onClick={cancelEdit}
                                                style={{
                                                    color: "#fff",
                                                    borderColor:
                                                        "rgba(255,255,255,0.06)",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                className="mi-btn-gold mi-btn"
                                                onClick={saveEdit}
                                                disabled={saving}
                                            >
                                                {saving
                                                    ? "Guardando..."
                                                    : "✦ Guardar Protocolo"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }
            )}

            {items.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 300,
                            color: "#fff",
                        }}
                    >
                        No hay protocolos para este pilar.
                    </p>
                    <button
                        className="mi-btn"
                        onClick={addProto}
                        style={{ marginTop: 16 }}
                    >
                        + Crear primera fase
                    </button>
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   AFIRMACIONES EDITOR — catálogo curado del Ritual Diario.
   Categorías → afirmaciones. Todo vía el gateway admin-action (adminAction).
   Permite a Zak agregar categorías y afirmaciones sin tocar código.
═══════════════════════════════════════════════════════════════════════ */
type AdminAf = {
    id: string
    texto: string
    texto_en?: string
    sort_order: number
    active: boolean
}
type AdminCat = {
    id: string
    nombre: string
    nombre_en?: string
    sort_order: number
    active: boolean
    afirmaciones: AdminAf[]
}

function AfirmacionesEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [cats, setCats] = useState<AdminCat[]>([])
    const [lang, setLang] = useState<Lang>("es")
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState("")

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1800)
    }

    /* 🜂 Se carga UNA vez por visita (MI_Shared v1.9). Como este editor guarda
       de forma optimista (pinta el cambio local y persiste), la memoria queda
       vieja en cuanto se escribe: por eso TODA escritura llama `olvidar()`.
       Sin eso, salir de la pestaña y volver mostraría el estado anterior. */
    const CLAVE = "admin_get_ritual_afirmaciones"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setCats(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const addCategoria = async () => {
        setBusy(true)
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_ritual_categoria",
            {
                p_id: null,
                p_nombre: "Nueva categoría",
                p_sort_order: Math.max(0, ...cats.map((c) => c.sort_order)) + 1,
                p_active: true,
            }
        )
        setBusy(false)
        olvidar()
        if (res && res.id) {
            setCats((prev) => [
                ...prev,
                {
                    id: res.id,
                    nombre: res.nombre,
                    sort_order: res.sort_order,
                    active: res.active,
                    afirmaciones: [],
                },
            ])
            flash("Categoría creada")
        } else {
            flash("No se pudo crear")
        }
    }

    const saveCategoria = async (c: AdminCat, patch: Partial<AdminCat>) => {
        const next = { ...c, ...patch }
        setCats((prev) => prev.map((x) => (x.id === c.id ? next : x)))
        const params: Record<string, any> = {
            p_id: c.id,
            p_nombre: next.nombre,
            p_sort_order: next.sort_order,
            p_active: next.active,
        }
        if (lang === "en") {
            params.p_nombre_en = next.nombre_en ?? ""
            params.p_lang = "en"
        }
        await adminAction(url, apiKey, "admin_upsert_ritual_categoria", params)
        olvidar()
    }

    const deleteCategoria = async (c: AdminCat) => {
        setCats((prev) => prev.filter((x) => x.id !== c.id))
        await adminAction(url, apiKey, "admin_delete_ritual_categoria", {
            p_id: c.id,
        })
        olvidar()
        flash("Categoría eliminada")
    }

    const addAfirmacion = async (c: AdminCat, texto: string) => {
        const t = texto.trim()
        if (!t) return
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_ritual_afirmacion",
            {
                p_id: null,
                p_categoria_id: c.id,
                p_texto: t,
                p_sort_order:
                    Math.max(0, ...c.afirmaciones.map((a) => a.sort_order)) + 1,
                p_active: true,
            }
        )
        olvidar()
        if (res && res.id) {
            setCats((prev) =>
                prev.map((x) =>
                    x.id === c.id
                        ? {
                              ...x,
                              afirmaciones: [
                                  ...x.afirmaciones,
                                  {
                                      id: res.id,
                                      texto: res.texto,
                                      sort_order: res.sort_order,
                                      active: res.active,
                                  },
                              ],
                          }
                        : x
                )
            )
        }
    }

    const saveAfirmacion = async (
        c: AdminCat,
        a: AdminAf,
        patch: Partial<AdminAf>
    ) => {
        const next = { ...a, ...patch }
        setCats((prev) =>
            prev.map((x) =>
                x.id === c.id
                    ? {
                          ...x,
                          afirmaciones: x.afirmaciones.map((y) =>
                              y.id === a.id ? next : y
                          ),
                      }
                    : x
            )
        )
        const params: Record<string, any> = {
            p_id: a.id,
            p_categoria_id: c.id,
            p_texto: next.texto,
            p_sort_order: next.sort_order,
            p_active: next.active,
        }
        if (lang === "en") {
            params.p_texto_en = next.texto_en ?? ""
            params.p_lang = "en"
        }
        await adminAction(url, apiKey, "admin_upsert_ritual_afirmacion", params)
        olvidar()
    }

    const deleteAfirmacion = async (c: AdminCat, a: AdminAf) => {
        setCats((prev) =>
            prev.map((x) =>
                x.id === c.id
                    ? {
                          ...x,
                          afirmaciones: x.afirmaciones.filter(
                              (y) => y.id !== a.id
                          ),
                      }
                    : x
            )
        )
        await adminAction(url, apiKey, "admin_delete_ritual_afirmacion", {
            p_id: a.id,
        })
        olvidar()
    }

    const totalAf = cats.reduce((s, c) => s + (c.afirmaciones?.length || 0), 0)

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Afirmaciones del Ritual Diario
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: hx("#ffffff", 0.5),
                        }}
                    >
                        {cats.length} categoría{cats.length === 1 ? "" : "s"} ·{" "}
                        {totalAf} afirmación{totalAf === 1 ? "" : "es"}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LangToggle lang={lang} onChange={setLang} />
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={addCategoria}
                        disabled={busy}
                    >
                        + Categoría
                    </button>
                </div>
            </div>

            {loading ? (
                <p
                    style={{
                        fontSize: 13,
                        color: "#fff",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Cargando…
                </p>
            ) : cats.length === 0 ? (
                <p
                    style={{
                        fontSize: 13,
                        color: hx("#ffffff", 0.55),
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Aún no hay categorías. Crea la primera con “+ Categoría”.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}
                >
                    {cats.map((c) => (
                        <CategoriaCard
                            key={c.id}
                            cat={c}
                            lang={lang}
                            onSaveCat={saveCategoria}
                            onDeleteCat={deleteCategoria}
                            onAddAf={addAfirmacion}
                            onSaveAf={saveAfirmacion}
                            onDeleteAf={deleteAfirmacion}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CategoriaCard({
    cat,
    lang,
    onSaveCat,
    onDeleteCat,
    onAddAf,
    onSaveAf,
    onDeleteAf,
}: {
    cat: AdminCat
    lang: Lang
    onSaveCat: (c: AdminCat, patch: Partial<AdminCat>) => void
    onDeleteCat: (c: AdminCat) => void
    onAddAf: (c: AdminCat, texto: string) => void
    onSaveAf: (c: AdminCat, a: AdminAf, patch: Partial<AdminAf>) => void
    onDeleteAf: (c: AdminCat, a: AdminAf) => void
}) {
    const [newText, setNewText] = useState("")
    const [confirmDel, setConfirmDel] = useState(false)
    const [collapsed, setCollapsed] = useState(true) // minimizada por defecto

    const count = cat.afirmaciones.length

    return (
        <div
            className="mi-card"
            style={{
                padding: 0,
                overflow: "hidden",
                opacity: cat.active ? 1 : 0.6,
            }}
        >
            {/* Encabezado de categoría (clic en el chevron expande/minimiza) */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 14px",
                }}
            >
                <button
                    className="mi-btn"
                    onClick={() => setCollapsed((c) => !c)}
                    title={collapsed ? "Expandir" : "Minimizar"}
                    style={{
                        padding: "4px 9px",
                        fontSize: 13,
                        color: hx(AC, 0.9),
                    }}
                >
                    {collapsed ? "▸" : "▾"}
                </button>
                <input
                    key={lang}
                    className="mi-input"
                    defaultValue={
                        lang === "en" ? cat.nombre_en || "" : cat.nombre
                    }
                    placeholder={
                        lang === "en" ? "Category name (EN)…" : undefined
                    }
                    onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (lang === "en") {
                            if (v !== (cat.nombre_en || ""))
                                onSaveCat(cat, { nombre_en: v })
                        } else if (v && v !== cat.nombre) {
                            onSaveCat(cat, { nombre: v })
                        }
                    }}
                    style={{
                        flex: 1,
                        fontWeight: 600,
                        color: "#fff",
                        fontSize: 14,
                    }}
                />
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: hx(GOLD, 0.9),
                        background: hx(GOLD, 0.12),
                        border: `1px solid ${hx(GOLD, 0.3)}`,
                        borderRadius: 999,
                        padding: "2px 9px",
                        whiteSpace: "nowrap",
                    }}
                >
                    {count}
                </span>
                <button
                    className="mi-btn"
                    onClick={() => onSaveCat(cat, { active: !cat.active })}
                    title={
                        cat.active
                            ? "Activa (tocar para ocultar)"
                            : "Oculta (tocar para activar)"
                    }
                    style={{ color: cat.active ? GOLD : hx("#ffffff", 0.5) }}
                >
                    {cat.active ? "Activa" : "Oculta"}
                </button>
                {confirmDel ? (
                    <>
                        <button
                            className="mi-btn mi-btn-red"
                            onClick={() => onDeleteCat(cat)}
                        >
                            ¿Borrar?
                        </button>
                        <button
                            className="mi-btn"
                            onClick={() => setConfirmDel(false)}
                        >
                            No
                        </button>
                    </>
                ) : (
                    <button
                        className="mi-btn mi-btn-red"
                        onClick={() => setConfirmDel(true)}
                        title="Borrar categoría"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Cuerpo (solo cuando está expandida) */}
            {!collapsed && (
                <div
                    style={{
                        padding: "0 14px 14px",
                        borderTop: `1px solid ${hx("#ffffff", 0.06)}`,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 12,
                        }}
                    >
                        {cat.afirmaciones.map((a) => (
                            <div
                                key={a.id}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 8,
                                    padding: "9px 11px",
                                    borderRadius: 9,
                                    background: a.active
                                        ? "rgba(255,255,255,0.045)"
                                        : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${hx("#ffffff", 0.08)}`,
                                }}
                            >
                                <textarea
                                    key={lang}
                                    defaultValue={
                                        lang === "en"
                                            ? a.texto_en || ""
                                            : a.texto
                                    }
                                    placeholder={
                                        lang === "en"
                                            ? "Translation (EN)…"
                                            : undefined
                                    }
                                    rows={2}
                                    onBlur={(e) => {
                                        const v = e.target.value.trim()
                                        if (lang === "en") {
                                            if (v !== (a.texto_en || ""))
                                                onSaveAf(cat, a, {
                                                    texto_en: v,
                                                })
                                        } else if (v && v !== a.texto) {
                                            onSaveAf(cat, a, { texto: v })
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        resize: "vertical",
                                        background: "transparent",
                                        border: "none",
                                        outline: "none",
                                        color: a.active
                                            ? "#eaf2ff"
                                            : hx("#ffffff", 0.45),
                                        fontSize: 13.5,
                                        lineHeight: 1.55,
                                        fontFamily: "inherit",
                                        padding: 0,
                                    }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                    }}
                                >
                                    <button
                                        className="mi-btn"
                                        onClick={() =>
                                            onSaveAf(cat, a, {
                                                active: !a.active,
                                            })
                                        }
                                        title={
                                            a.active
                                                ? "Activa (tocar para ocultar)"
                                                : "Oculta (tocar para activar)"
                                        }
                                        style={{
                                            padding: "4px 8px",
                                            color: a.active
                                                ? GOLD
                                                : hx("#ffffff", 0.5),
                                        }}
                                    >
                                        {a.active ? "◉" : "○"}
                                    </button>
                                    <button
                                        className="mi-btn mi-btn-red"
                                        onClick={() => onDeleteAf(cat, a)}
                                        style={{ padding: "4px 8px" }}
                                        title="Borrar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                        {count === 0 && (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 12.5,
                                    color: hx("#ffffff", 0.5),
                                }}
                            >
                                Sin afirmaciones todavía.
                            </p>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <input
                            className="mi-input"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Nueva afirmación…"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    onAddAf(cat, newText)
                                    setNewText("")
                                }
                            }}
                            style={{ flex: 1, color: "#fff" }}
                        />
                        <button
                            className="mi-btn mi-btn-gold"
                            onClick={() => {
                                onAddAf(cat, newText)
                                setNewText("")
                            }}
                            disabled={!newText.trim()}
                        >
                            + Afirmación
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   RITUAL CATALOG EDITOR — catálogo de rituales del Ritual Diario y sus
   Fotones. Lo edita Zak desde el Motor sin tocar código: label, Fotones
   (points), si pide texto, si está activo, orden, y agregar/borrar.
   Cambiar los Fotones acá cambia lo que el server otorga AL INSTANTE, sin
   nuevo build (el cliente lee el catálogo vía get_ritual_diario). Todo por
   el gateway admin-action (adminAction).
═══════════════════════════════════════════════════════════════════════ */
type AdminRitual = {
    activity_key: string
    label: string
    label_en?: string
    points: number
    requires_text: boolean
    active: boolean
    sort_order: number
}

// Slug ASCII para activity_key: minúsculas, sin acentos, espacios → "_",
// solo [a-z0-9_].
function slugifyRitualKey(label: string): string {
    return (label || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80)
}

function RitualCatalogEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [items, setItems] = useState<AdminRitual[]>([])
    const [lang, setLang] = useState<Lang>("es")
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState("")
    const [adding, setAdding] = useState(false)
    const [newLabel, setNewLabel] = useState("")
    const [newPoints, setNewPoints] = useState(10)

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1800)
    }

    /* 🜂 Una vez por visita; toda escritura olvida (guardado optimista). */
    const CLAVE = "admin_get_ritual_catalog"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setItems(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    // Upsert con TODOS los campos (la RPC pide la fila completa).
    const saveRitual = async (r: AdminRitual, patch: Partial<AdminRitual>) => {
        const next = { ...r, ...patch }
        setItems((prev) =>
            prev.map((x) => (x.activity_key === r.activity_key ? next : x))
        )
        const params: Record<string, any> = {
            p_activity_key: next.activity_key,
            p_label: next.label,
            p_points: next.points,
            p_requires_text: next.requires_text,
            p_active: next.active,
            p_sort_order: next.sort_order,
        }
        if (lang === "en") {
            params.p_label_en = next.label_en ?? ""
            params.p_lang = "en"
        }
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_ritual_activity",
            params
        )
        olvidar()
        if (!res || res.error) flash("No se pudo guardar")
    }

    const deleteRitual = async (r: AdminRitual) => {
        setItems((prev) =>
            prev.filter((x) => x.activity_key !== r.activity_key)
        )
        await adminAction(url, apiKey, "admin_delete_ritual_activity", {
            p_activity_key: r.activity_key,
        })
        olvidar()
        flash("Ritual eliminado")
    }

    const addRitual = async () => {
        const label = newLabel.trim()
        if (!label) return
        const key = slugifyRitualKey(label)
        if (!key) {
            flash("Usa letras o números")
            return
        }
        if (items.some((x) => x.activity_key === key)) {
            flash("Ese ritual ya existe")
        }
        setBusy(true)
        const sort = Math.max(0, ...items.map((x) => x.sort_order)) + 1
        const pts = Number.isFinite(newPoints) ? newPoints : 10
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_ritual_activity",
            {
                p_activity_key: key,
                p_label: label,
                p_points: pts,
                p_requires_text: false,
                p_active: true,
                p_sort_order: sort,
            }
        )
        setBusy(false)
        olvidar()
        if (res && res.activity_key) {
            const row: AdminRitual = {
                activity_key: res.activity_key,
                label: res.label,
                points: res.points,
                requires_text: res.requires_text,
                active: res.active,
                sort_order: res.sort_order,
            }
            setItems((prev) => {
                const without = prev.filter(
                    (x) => x.activity_key !== row.activity_key
                )
                return [...without, row]
            })
            setNewLabel("")
            setNewPoints(10)
            setAdding(false)
            flash("Ritual guardado")
        } else {
            flash("No se pudo crear")
        }
    }

    const totalActive = items.filter((x) => x.active).length

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Rituales del Ritual Diario
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: hx("#ffffff", 0.5),
                        }}
                    >
                        {items.length} ritual{items.length === 1 ? "" : "es"} ·{" "}
                        {totalActive} activo{totalActive === 1 ? "" : "s"}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LangToggle lang={lang} onChange={setLang} />
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={() => setAdding((a) => !a)}
                        disabled={busy}
                    >
                        {adding ? "Cancelar" : "+ Ritual"}
                    </button>
                </div>
            </div>

            <p
                style={{
                    margin: "0 0 14px",
                    fontSize: 11.5,
                    color: hx(GOLD, 0.85),
                    lineHeight: 1.5,
                }}
            >
                Lo que cambies aquí (Fotones, activos) aplica en la app al
                instante, sin nuevo build.
            </p>

            {adding && (
                <div
                    className="mi-card"
                    style={{ padding: "14px 16px", marginBottom: 14 }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "flex-end",
                        }}
                    >
                        <div style={{ flex: "1 1 200px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 11,
                                    color: hx("#ffffff", 0.55),
                                    marginBottom: 5,
                                }}
                            >
                                Nombre del ritual
                            </label>
                            <input
                                className="mi-input"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="Estiramiento…"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addRitual()
                                }}
                                style={{ width: "100%", color: "#fff" }}
                                autoFocus
                            />
                        </div>
                        <div style={{ flex: "0 0 110px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 11,
                                    color: hx("#ffffff", 0.55),
                                    marginBottom: 5,
                                }}
                            >
                                Fotones
                            </label>
                            <ScoreInput
                                value={newPoints}
                                onCommit={(n) => setNewPoints(n)}
                                min={0}
                                max={9999}
                            />
                        </div>
                        <button
                            className="mi-btn mi-btn-gold"
                            onClick={addRitual}
                            disabled={busy || !newLabel.trim()}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p
                    style={{
                        fontSize: 13,
                        color: "#fff",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Cargando…
                </p>
            ) : items.length === 0 ? (
                <p
                    style={{
                        fontSize: 13,
                        color: hx("#ffffff", 0.55),
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Aún no hay rituales. Crea el primero con “+ Ritual”.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {items.map((r) => (
                        <RitualRow
                            key={r.activity_key}
                            ritual={r}
                            lang={lang}
                            onSave={saveRitual}
                            onDelete={deleteRitual}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function RitualRow({
    ritual,
    lang,
    onSave,
    onDelete,
}: {
    ritual: AdminRitual
    lang: Lang
    onSave: (r: AdminRitual, patch: Partial<AdminRitual>) => void
    onDelete: (r: AdminRitual) => void
}) {
    const [confirmDel, setConfirmDel] = useState(false)

    return (
        <div
            className="mi-card"
            style={{
                padding: "12px 14px",
                marginBottom: 0,
                opacity: ritual.active ? 1 : 0.6,
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
            }}
        >
            {/* Nombre */}
            <input
                key={lang}
                className="mi-input"
                defaultValue={
                    lang === "en" ? ritual.label_en || "" : ritual.label
                }
                placeholder={lang === "en" ? "Label (EN)…" : undefined}
                onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (lang === "en") {
                        if (v !== (ritual.label_en || ""))
                            onSave(ritual, { label_en: v })
                    } else if (v && v !== ritual.label) {
                        onSave(ritual, { label: v })
                    }
                }}
                style={{
                    flex: "1 1 160px",
                    fontWeight: 600,
                    color: "#fff",
                    fontSize: 14,
                }}
            />

            {/* Fotones */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: "0 0 auto",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        color: hx(GOLD, 0.85),
                        fontWeight: 600,
                    }}
                >
                    Fotones
                </span>
                <div style={{ width: 76 }}>
                    <ScoreInput
                        value={ritual.points}
                        onCommit={(n) => {
                            if (n !== ritual.points)
                                onSave(ritual, { points: n })
                        }}
                        min={0}
                        max={9999}
                    />
                </div>
            </div>

            {/* Orden */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: "0 0 auto",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        color: hx("#ffffff", 0.5),
                        fontWeight: 600,
                    }}
                >
                    Orden
                </span>
                <div style={{ width: 60 }}>
                    <ScoreInput
                        value={ritual.sort_order}
                        onCommit={(n) => {
                            if (n !== ritual.sort_order)
                                onSave(ritual, { sort_order: n })
                        }}
                        min={0}
                        max={9999}
                    />
                </div>
            </div>

            {/* Pide texto */}
            <button
                className="mi-btn"
                onClick={() =>
                    onSave(ritual, { requires_text: !ritual.requires_text })
                }
                title={
                    ritual.requires_text
                        ? "Pide texto (tocar para quitar)"
                        : "No pide texto (tocar para activar)"
                }
                style={{
                    color: ritual.requires_text ? GOLD : hx("#ffffff", 0.5),
                    flex: "0 0 auto",
                }}
            >
                {ritual.requires_text ? "✎ Pide texto" : "Sin texto"}
            </button>

            {/* Activo */}
            <button
                className="mi-btn"
                onClick={() => onSave(ritual, { active: !ritual.active })}
                title={
                    ritual.active
                        ? "Activo (tocar para ocultar)"
                        : "Oculto (tocar para activar)"
                }
                style={{
                    color: ritual.active ? GOLD : hx("#ffffff", 0.5),
                    flex: "0 0 auto",
                }}
            >
                {ritual.active ? "Activo" : "Oculto"}
            </button>

            {/* Borrar */}
            {confirmDel ? (
                <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
                    <button
                        className="mi-btn mi-btn-red"
                        onClick={() => onDelete(ritual)}
                    >
                        ¿Borrar?
                    </button>
                    <button
                        className="mi-btn"
                        onClick={() => setConfirmDel(false)}
                    >
                        No
                    </button>
                </div>
            ) : (
                <button
                    className="mi-btn mi-btn-red"
                    onClick={() => setConfirmDel(true)}
                    title="Borrar ritual"
                    style={{ flex: "0 0 auto" }}
                >
                    ✕
                </button>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   RITUALES HUB — contenedor con dos sub-pestañas para la pestaña
   "Rituales" del Motor: "Afirmaciones" (editor existente) + "Rituales"
   (catálogo de rituales y sus Fotones). Default "Afirmaciones".
═══════════════════════════════════════════════════════════════════════ */
function RitualesHub({ url, apiKey }: { url: string; apiKey: string }) {
    const [tab, setTab] = useState<"afirmaciones" | "rituales">("afirmaciones")

    return (
        <div>
            <div className="mi-tabs" style={{ marginBottom: 20 }}>
                <button
                    className={`mi-tab ${tab === "afirmaciones" ? "active" : ""}`}
                    onClick={() => setTab("afirmaciones")}
                >
                    Afirmaciones
                </button>
                <button
                    className={`mi-tab ${tab === "rituales" ? "active" : ""}`}
                    onClick={() => setTab("rituales")}
                >
                    Rituales
                </button>
            </div>

            {tab === "afirmaciones" ? (
                <AfirmacionesEditor url={url} apiKey={apiKey} />
            ) : (
                <RitualCatalogEditor url={url} apiKey={apiKey} />
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   WALLPAPERS EDITOR — galería de fondos de pantalla del Lente.
   Subida a R2 (edge upload-wallpaper) + CRUD por el gateway admin-action
   (admin_get/upsert/delete_wallpaper). El wallpaper marcado "Gratis" es
   el único accesible sin Sintonía Solar. Lo consume la pestaña
   "Wallpapers" del Motor. Fricción Cero para Zak: subir, ordenar, marcar.
═══════════════════════════════════════════════════════════════════════ */
type AdminWallpaper = {
    id: string
    title: string
    title_en?: string
    image_url: string
    is_free: boolean
    sort_order: number
    active: boolean
    category_id?: string | null
    created_at?: string
}

type AdminWpCategory = {
    id: string
    name: string
    name_en?: string
    sort_order: number
    active: boolean
}

// Resize a base64 — alta resolución para wallpapers (lado largo 2796 = alto
// de un iPhone 15 Pro Max, calidad 0.92). Adaptado de AtelierMarketing.
function resizeWallpaperToBase64(
    file: File,
    maxSide = 2796
): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
        reader.onload = () => {
            const img = new Image()
            img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
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
                    reject(new Error("No se pudo crear el lienzo"))
                    return
                }
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
                resolve({
                    base64: dataUrl.split(",")[1] || "",
                    mime: "image/jpeg",
                })
            }
            img.src = String(reader.result)
        }
        reader.readAsDataURL(file)
    })
}

/* ═══ ATELIER DE WALLPAPERS — generador de prompts (estilo Estudio Manual) ═══
   Genera prompts de wallpapers premium 4K (1 a 1) para Nano Banana, por categoría.
   Modo solo-prompts: el edge generate-wallpaper-prompt arma el prompt y lo guarda;
   el admin lo copia. La categoría "Colectivos" puede protagonizar un colectivo
   guardado (vtli_colectivos) o inventar uno nuevo cada vez. */
const WP_CATS: { key: string; label: string; desc: string }[] = [
    {
        key: "colectivos",
        label: "Colectivos No Humanos",
        desc: "Inteligencias estelares — Sirio, Pléyades, Arcturus",
    },
    {
        key: "lineas_temporales",
        label: "Líneas Temporales Latentes",
        desc: "Cartografía del potencial cuántico",
    },
    {
        key: "arquitectos_luz",
        label: "Arquitectos de Luz",
        desc: "Campos toroidales de información",
    },
    {
        key: "geometria_sagrada",
        label: "Geometría Sagrada",
        desc: "El lenguaje del código del universo",
    },
    {
        key: "metropolis_solarpunk",
        label: "Metrópolis Solarpunk",
        desc: "La Nueva Tierra manifestada",
    },
    {
        key: "termodinamica_cosmica",
        label: "Termodinámica Cósmica",
        desc: "El Reactor Central — sistemas estelares",
    },
    {
        key: "fauna_luz",
        label: "Fauna de Luz",
        desc: "Biología de Fricción Cero",
    },
]

interface WpPrompt {
    id: string
    category_key: string
    category_label: string | null
    title: string | null
    prompt: string
    colectivo_name: string | null
    created_at: string
}
interface WpColectivo {
    id: string
    name: string
    species_traits?: string
    image_r2_url: string | null
}

function WallpaperAtelier({ url, apiKey }: { url: string; apiKey: string }) {
    const [catKey, setCatKey] = useState("colectivos")
    const [prompts, setPrompts] = useState<WpPrompt[]>([])
    const [colectivos, setColectivos] = useState<WpColectivo[]>([])
    const [colectivoId, setColectivoId] = useState("")
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [uploadingCol, setUploadingCol] = useState(false)
    const [toast, setToast] = useState("")
    const [copiedId, setCopiedId] = useState("")
    const colFileRef = useRef<HTMLInputElement>(null)

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1900)
    }

    /* 🜂 Una vez por visita; generar, borrar o subir un colectivo olvida. */
    const olvidar = () => {
        motorCacheClear("get_wallpaper_prompts_admin")
        motorCacheClear("get_vtli_colectivos_admin")
    }

    const load = async (force = false) => {
        setLoading(true)
        const [resP, resC] = await Promise.all([
            adminActionCached(
                url,
                apiKey,
                "get_wallpaper_prompts_admin",
                {},
                { force }
            ),
            adminActionCached(
                url,
                apiKey,
                "get_vtli_colectivos_admin",
                {},
                { force }
            ),
        ])
        setPrompts(resP && Array.isArray(resP.prompts) ? resP.prompts : [])
        setColectivos(
            resC && Array.isArray(resC.colectivos) ? resC.colectivos : []
        )
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const generar = async () => {
        if (generating) return
        setGenerating(true)
        try {
            const token = await (window as any).Clerk?.session?.getToken?.()
            if (!token) {
                flash("Sesión no válida")
                setGenerating(false)
                return
            }
            const r = await fetch(
                `${url}/functions/v1/generate-wallpaper-prompt`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: apiKey,
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        category_key: catKey,
                        colectivo_id:
                            catKey === "colectivos" && colectivoId
                                ? colectivoId
                                : null,
                    }),
                }
            )
            const out = r.ok ? await r.json() : null
            olvidar()
            if (out && out.prompt) {
                setPrompts((prev) => [out as WpPrompt, ...prev])
                flash("Wallpaper creado ✓")
            } else {
                flash(`No se pudo crear: ${out?.error ?? r.status}`)
            }
        } catch {
            flash("No se pudo crear (revisa tu conexión)")
        } finally {
            setGenerating(false)
        }
    }

    const borrar = async (id: string) => {
        setPrompts((prev) => prev.filter((p) => p.id !== id))
        await adminAction(url, apiKey, "delete_wallpaper_prompt", { p_id: id })
        olvidar()
        flash("Eliminado")
    }

    const copiar = (p: WpPrompt) => {
        try {
            navigator.clipboard?.writeText(p.prompt)
        } catch {}
        setCopiedId(p.id)
        window.setTimeout(() => setCopiedId(""), 1500)
    }

    const onPickColectivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (e.target) e.target.value = ""
        if (!file) return
        setUploadingCol(true)
        try {
            const { base64, mime } = await resizeWallpaperToBase64(file, 1400)
            const token = await (window as any).Clerk?.session?.getToken?.()
            if (!token) {
                flash("Sesión no válida")
                setUploadingCol(false)
                return
            }
            const rd = await fetch(
                `${url}/functions/v1/describe-vtli-colectivo`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: apiKey,
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        token,
                        image_base64: base64,
                        image_mime: mime,
                        kind: "colectivo",
                    }),
                }
            )
            const desc = rd.ok ? await rd.json() : null
            if (!desc || !desc.image_r2_url) {
                flash("No se pudo analizar la imagen")
                setUploadingCol(false)
                return
            }
            const saved = await adminAction(
                url,
                apiKey,
                "upsert_vtli_colectivo",
                {
                    p_id: null,
                    p_name: desc.suggested_name || "Colectivo nuevo",
                    p_species_traits: desc.traits || desc.species_traits || "",
                    p_individual_variation:
                        desc.variation || desc.individual_variation || "",
                    p_image_r2_url: desc.image_r2_url,
                    p_category: null,
                    p_sort_order: 0,
                }
            )
            olvidar()
            if (saved && saved.colectivo) {
                setColectivos((prev) => [saved.colectivo, ...prev])
                setColectivoId(saved.colectivo.id)
                flash("Colectivo guardado ✓")
            } else {
                flash("No se pudo guardar el colectivo")
            }
        } catch {
            flash("Error al procesar la imagen")
        }
        setUploadingCol(false)
    }

    const activeCat = WP_CATS.find((c) => c.key === catKey) || WP_CATS[0]

    return (
        <div>
            <p
                style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: hx(AC, 0.62),
                    maxWidth: 720,
                    marginTop: 0,
                }}
            >
                Genera prompts de wallpapers premium (realistas, 4K) para Nano
                Banana, uno a uno. Elige una categoría y dale Crear; cada
                generación es distinta dentro de su categoría. Copia el prompt y
                pégalo en Nano Banana.
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10,
                    marginBottom: 16,
                }}
            >
                {WP_CATS.map((c) => {
                    const on = c.key === catKey
                    return (
                        <button
                            key={c.key}
                            onClick={() => setCatKey(c.key)}
                            style={{
                                textAlign: "left",
                                border: `1.5px solid ${on ? GOLD : hx(AC, 0.16)}`,
                                background: on ? hx(GOLD, 0.08) : hx(AC, 0.03),
                                borderRadius: 12,
                                padding: "11px 13px",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    color: on ? GOLD : hx(AC, 0.85),
                                }}
                            >
                                {c.label}
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: hx(AC, 0.5),
                                    lineHeight: 1.4,
                                }}
                            >
                                {c.desc}
                            </span>
                        </button>
                    )
                })}
            </div>

            {catKey === "colectivos" && (
                <div
                    style={{
                        border: `1px solid ${hx(AC, 0.14)}`,
                        borderRadius: 12,
                        padding: 13,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: ".05em",
                            textTransform: "uppercase",
                            color: hx(AC, 0.5),
                            marginBottom: 8,
                        }}
                    >
                        Protagonista del wallpaper
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                        }}
                    >
                        <select
                            value={colectivoId}
                            onChange={(e) => setColectivoId(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: 200,
                                padding: "9px 11px",
                                borderRadius: 8,
                                border: `1px solid ${hx(AC, 0.18)}`,
                                background: hx(AC, 0.04),
                                color: hx(AC, 0.9),
                                fontSize: 13,
                            }}
                        >
                            <option value="">
                                ✨ Inventar un ser nuevo cada vez
                            </option>
                            {colectivos.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => colFileRef.current?.click()}
                            disabled={uploadingCol}
                            style={{
                                padding: "9px 14px",
                                borderRadius: 8,
                                border: `1px solid ${hx(GOLD, 0.5)}`,
                                background: hx(GOLD, 0.08),
                                color: GOLD,
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {uploadingCol ? "Analizando…" : "+ Subir colectivo"}
                        </button>
                        <input
                            ref={colFileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={onPickColectivo}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: 11,
                            color: hx(AC, 0.42),
                            display: "block",
                            marginTop: 7,
                            lineHeight: 1.4,
                        }}
                    >
                        Elige un colectivo guardado para que protagonice el
                        wallpaper, o deja "inventar" para un ser distinto cada
                        vez. Subir uno nuevo lo analiza y lo guarda en tu
                        biblioteca de colectivos de Zak'Haar.
                    </span>
                </div>
            )}

            <button
                onClick={generar}
                disabled={generating}
                style={{
                    padding: "12px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: generating ? hx(GOLD, 0.4) : GOLD,
                    color: "#1a1205",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: generating ? "default" : "pointer",
                    marginBottom: 22,
                }}
            >
                {generating
                    ? "Creando wallpaper…"
                    : `✦ Crear wallpaper · ${activeCat.label}`}
            </button>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 12,
                }}
            >
                <BtnRecargar
                    onClick={() => void load(true)}
                    disabled={loading}
                />
            </div>

            {loading ? (
                <div style={{ color: hx(AC, 0.5), fontSize: 13 }}>
                    Cargando…
                </div>
            ) : prompts.length === 0 ? (
                <div style={{ color: hx(AC, 0.45), fontSize: 13 }}>
                    Aún no has creado wallpapers. Elige una categoría y dale
                    Crear.
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {prompts.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                border: `1px solid ${hx(AC, 0.12)}`,
                                borderRadius: 12,
                                padding: 13,
                                background: hx(AC, 0.02),
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    marginBottom: 8,
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13.5,
                                            fontWeight: 700,
                                            color: hx(AC, 0.88),
                                        }}
                                    >
                                        {p.title || "Wallpaper"}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: hx(AC, 0.5),
                                        }}
                                    >
                                        {p.category_label || p.category_key}
                                        {p.colectivo_name
                                            ? ` · ${p.colectivo_name}`
                                            : ""}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 7,
                                        flexShrink: 0,
                                    }}
                                >
                                    <button
                                        onClick={() => copiar(p)}
                                        style={{
                                            padding: "7px 12px",
                                            borderRadius: 8,
                                            border: `1px solid ${hx(GOLD, 0.45)}`,
                                            background: hx(GOLD, 0.08),
                                            color: GOLD,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {copiedId === p.id
                                            ? "Copiado ✓"
                                            : "📋 Copiar prompt"}
                                    </button>
                                    <button
                                        onClick={() => borrar(p.id)}
                                        style={{
                                            padding: "7px 10px",
                                            borderRadius: 8,
                                            border: `1px solid ${hx(AC, 0.2)}`,
                                            background: "transparent",
                                            color: hx(AC, 0.55),
                                            fontSize: 12,
                                            cursor: "pointer",
                                        }}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: 11.5,
                                    lineHeight: 1.5,
                                    color: hx(AC, 0.7),
                                    whiteSpace: "pre-wrap",
                                    background: hx(AC, 0.04),
                                    border: `1px solid ${hx(AC, 0.1)}`,
                                    borderRadius: 8,
                                    padding: "10px 11px",
                                    maxHeight: 160,
                                    overflowY: "auto",
                                }}
                            >
                                {p.prompt}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#1a1205",
                        color: GOLD,
                        padding: "10px 18px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        zIndex: 9999,
                    }}
                >
                    {toast}
                </div>
            )}
        </div>
    )
}

function WallpapersHub({ url, apiKey }: { url: string; apiKey: string }) {
    const [tab, setTab] = useState<"galeria" | "atelier" | "telemetria">(
        "galeria"
    )
    return (
        <div>
            <div className="mi-tabs" style={{ marginBottom: 20 }}>
                <button
                    className={`mi-tab ${tab === "galeria" ? "active" : ""}`}
                    onClick={() => setTab("galeria")}
                >
                    Galería
                </button>
                <button
                    className={`mi-tab ${tab === "atelier" ? "active" : ""}`}
                    onClick={() => setTab("atelier")}
                >
                    Atelier · Crear
                </button>
                <button
                    className={`mi-tab ${tab === "telemetria" ? "active" : ""}`}
                    onClick={() => setTab("telemetria")}
                >
                    Telemetría
                </button>
            </div>
            {tab === "galeria" ? (
                <WallpapersEditor url={url} apiKey={apiKey} />
            ) : tab === "atelier" ? (
                <WallpaperAtelier url={url} apiKey={apiKey} />
            ) : (
                <WallpaperTelemetry url={url} apiKey={apiKey} />
            )}
        </div>
    )
}

/* ═══════════════════ Telemetría de descargas (Anclajes Fotónicos) ═══════════
   Cuáles fondos descargan más los Tripulantes. Lee get_wallpaper_download_
   telemetry por el gateway admin-action; toggle "Excluir mis cuentas" (misma
   lista interna que la Telemetría de Navegación). La data llega cuando salga el
   build iOS con WallpapersShell v1.12 (que registra cada guardado a Fotos). */
type WpTelemetryRow = {
    id: string
    title: string
    image_url: string | null
    is_free: boolean
    active: boolean
    downloads: number
    users: number
    last_at: string | null
}
function WallpaperTelemetry({ url, apiKey }: { url: string; apiKey: string }) {
    const [rows, setRows] = useState<WpTelemetryRow[]>([])
    const [totalDl, setTotalDl] = useState(0)
    const [totalUsers, setTotalUsers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [exclude, setExclude] = useState(true)

    /* 🜂 Solo lectura: no hay escrituras que invalidar. La llave incluye
       `p_exclude`, así que cada posición del interruptor guarda la suya y
       volver a la anterior es instantáneo. */
    const load = async (force = false) => {
        setLoading(true)
        try {
            const res = await adminActionCached(
                url,
                apiKey,
                "get_wallpaper_download_telemetry",
                { p_exclude: exclude },
                { force }
            )
            const w = res && Array.isArray(res.wallpapers) ? res.wallpapers : []
            setRows(w as WpTelemetryRow[])
            setTotalDl(
                res && typeof res.total_downloads === "number"
                    ? res.total_downloads
                    : 0
            )
            setTotalUsers(
                res && typeof res.total_users === "number" ? res.total_users : 0
            )
        } catch {
            // Aún sin gateway/SQL desplegado → no colgar el panel; lista vacía.
            setRows([])
            setTotalDl(0)
            setTotalUsers(0)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey, exclude])

    const fmtDate = (s: string | null) => {
        if (!s) return "—"
        try {
            const d = new Date(s)
            return d.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
            })
        } catch {
            return "—"
        }
    }

    return (
        <div>
            {/* Resumen + controles */}
            <div
                className="mi-card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    padding: 14,
                    marginBottom: 16,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: hx("#ffffff", 0.45),
                        }}
                    >
                        Descargas totales
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: GOLD }}>
                        {totalDl}
                    </div>
                </div>
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: hx("#ffffff", 0.45),
                        }}
                    >
                        Tripulantes
                    </div>
                    <div
                        style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}
                    >
                        {totalUsers}
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                <button
                    className="mi-btn"
                    onClick={() => setExclude((v) => !v)}
                    title="Excluir las cuentas internas (las mismas de Navegación)"
                    style={{ color: exclude ? GOLD : hx("#ffffff", 0.5) }}
                >
                    {exclude ? "✓ Excluir mis cuentas" : "Excluir mis cuentas"}
                </button>
                <BtnRecargar
                    onClick={() => void load(true)}
                    disabled={loading}
                />
            </div>

            {loading ? (
                <p className="mi-muted" style={{ color: hx("#ffffff", 0.45) }}>
                    Cargando telemetría…
                </p>
            ) : rows.length === 0 ? (
                <p
                    style={{
                        color: hx("#ffffff", 0.45),
                        fontSize: 13,
                        lineHeight: 1.6,
                    }}
                >
                    Todavía no hay descargas registradas. Los datos empiezan a
                    llegar cuando salga el build iOS que registra cada guardado
                    a Fotos.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {rows.map((r, i) => (
                        <div
                            key={r.id}
                            className="mi-card"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: 10,
                                opacity: r.active ? 1 : 0.6,
                            }}
                        >
                            {/* Rango */}
                            <div
                                style={{
                                    width: 26,
                                    textAlign: "center",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: i === 0 ? GOLD : hx("#ffffff", 0.4),
                                    flexShrink: 0,
                                }}
                            >
                                {i + 1}
                            </div>
                            {/* Miniatura */}
                            <div
                                style={{
                                    width: 44,
                                    height: 76,
                                    flexShrink: 0,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    background: "rgba(0,0,0,0.4)",
                                    border: `1px solid ${hx("#ffffff", 0.1)}`,
                                }}
                            >
                                {r.image_url ? (
                                    <img
                                        src={r.image_url}
                                        alt={r.title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : null}
                            </div>
                            {/* Datos */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        color: "#fff",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {r.title || "Sin título"}
                                    {r.is_free ? (
                                        <span
                                            style={{
                                                color: GOLD,
                                                fontSize: 11,
                                                marginLeft: 8,
                                            }}
                                        >
                                            ★ Gratis
                                        </span>
                                    ) : null}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11.5,
                                        color: hx("#ffffff", 0.45),
                                        marginTop: 3,
                                    }}
                                >
                                    {r.users}{" "}
                                    {r.users === 1
                                        ? "Tripulante"
                                        : "Tripulantes"}{" "}
                                    · última: {fmtDate(r.last_at)}
                                </div>
                            </div>
                            {/* Descargas */}
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: GOLD,
                                        lineHeight: 1,
                                    }}
                                >
                                    {r.downloads}
                                </div>
                                <div
                                    style={{
                                        fontSize: 9.5,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: hx("#ffffff", 0.4),
                                    }}
                                >
                                    descargas
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function WallpapersEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [items, setItems] = useState<AdminWallpaper[]>([])
    const [cats, setCats] = useState<AdminWpCategory[]>([])
    const [lang, setLang] = useState<Lang>("es")
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [toast, setToast] = useState("")
    const fileRef = useRef<HTMLInputElement>(null)

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1800)
    }

    /* 🜂 Una vez por visita. Esta pestaña vive de DOS lecturas (galería +
       categorías) y todas sus escrituras son optimistas, así que `olvidar()`
       tira las dos: mover un wallpaper de categoría toca ambas caras. */
    const olvidar = () => {
        motorCacheClear("admin_get_wallpapers")
        motorCacheClear("admin_get_wallpaper_categories")
    }

    const load = async (force = false) => {
        setLoading(true)
        const [resW, resC] = await Promise.all([
            adminActionCached(
                url,
                apiKey,
                "admin_get_wallpapers",
                {},
                { force }
            ),
            adminActionCached(
                url,
                apiKey,
                "admin_get_wallpaper_categories",
                {},
                { force }
            ),
        ])
        setItems(Array.isArray(resW) ? resW : [])
        setCats(Array.isArray(resC) ? resC : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    /* ── Categorías ── */
    const addCategoria = async () => {
        setBusy(true)
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_wallpaper_category",
            {
                p_id: null,
                p_name: "Nueva categoría",
                p_sort_order: Math.max(0, ...cats.map((c) => c.sort_order)) + 1,
                p_active: true,
            }
        )
        setBusy(false)
        olvidar()
        if (res && res.id) {
            setCats((prev) => [
                ...prev,
                {
                    id: res.id,
                    name: res.name,
                    sort_order: res.sort_order,
                    active: res.active,
                },
            ])
            flash("Categoría creada")
        } else {
            flash("No se pudo crear")
        }
    }

    const saveCategoria = async (
        c: AdminWpCategory,
        patch: Partial<AdminWpCategory>
    ) => {
        const next = { ...c, ...patch }
        setCats((prev) => prev.map((x) => (x.id === c.id ? next : x)))
        const params: Record<string, any> = {
            p_id: c.id,
            p_name: next.name,
            p_sort_order: next.sort_order,
            p_active: next.active,
        }
        if (lang === "en") {
            params.p_name_en = next.name_en ?? ""
            params.p_lang = "en"
        }
        await adminAction(
            url,
            apiKey,
            "admin_upsert_wallpaper_category",
            params
        )
        olvidar()
    }

    const deleteCategoria = async (c: AdminWpCategory) => {
        setCats((prev) => prev.filter((x) => x.id !== c.id))
        // Los wallpapers de esa categoría quedan sin categoría (FK ON DELETE SET NULL).
        setItems((prev) =>
            prev.map((w) =>
                w.category_id === c.id ? { ...w, category_id: null } : w
            )
        )
        await adminAction(url, apiKey, "admin_delete_wallpaper_category", {
            p_id: c.id,
        })
        olvidar()
        flash("Categoría eliminada")
    }

    const setItemCategory = async (
        w: AdminWallpaper,
        categoryId: string | null
    ) => {
        setItems((prev) =>
            prev.map((x) =>
                x.id === w.id ? { ...x, category_id: categoryId } : x
            )
        )
        await adminAction(url, apiKey, "admin_set_wallpaper_category", {
            p_id: w.id,
            p_category_id: categoryId,
        })
        olvidar()
    }

    const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (e.target) e.target.value = "" // permite re-subir el mismo archivo
        if (!file) return
        setUploading(true)
        try {
            const { base64, mime } = await resizeWallpaperToBase64(file, 2796)
            const token = await (window as any).Clerk?.session?.getToken?.()
            if (!token) {
                flash("Sesión no válida")
                setUploading(false)
                return
            }
            const r = await fetch(`${url}/functions/v1/upload-wallpaper`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: apiKey,
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    token,
                    image_base64: base64,
                    image_mime: mime,
                    title: "Wallpaper",
                }),
            })
            const out = r.ok ? await r.json() : null
            olvidar()
            if (out && out.success && out.wallpaper) {
                setItems((prev) => [out.wallpaper, ...prev])
                flash("Wallpaper subido")
            } else {
                flash("No se pudo subir")
            }
        } catch {
            flash("Error al procesar la imagen")
        }
        setUploading(false)
    }

    const saveItem = async (
        w: AdminWallpaper,
        patch: Partial<AdminWallpaper>
    ) => {
        const next = { ...w, ...patch }
        setItems((prev) => prev.map((x) => (x.id === w.id ? next : x)))
        const params: Record<string, any> = {
            p_id: w.id,
            p_title: next.title,
            p_is_free: next.is_free,
            p_sort_order: next.sort_order,
            p_active: next.active,
        }
        if (lang === "en") {
            params.p_title_en = next.title_en ?? ""
            params.p_lang = "en"
        }
        await adminAction(url, apiKey, "admin_upsert_wallpaper", params)
        olvidar()
    }

    const deleteItem = async (w: AdminWallpaper) => {
        setItems((prev) => prev.filter((x) => x.id !== w.id))
        await adminAction(url, apiKey, "admin_delete_wallpaper", { p_id: w.id })
        olvidar()
        flash("Wallpaper eliminado")
    }

    /* Reordenar con CASCADA: al poner un wallpaper en la posición N, se mueve
       ahí y TODOS los demás se recorren para quedar 1..K contiguos, en tiempo
       real. Persiste solo las filas cuyo orden cambió (reusa admin_upsert_
       wallpaper, sin RPC nueva). */
    const reorderItem = (w: AdminWallpaper, newPos: number) => {
        const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
        const from = sorted.findIndex((x) => x.id === w.id)
        if (from < 0) return
        const clamped = Math.max(1, Math.min(newPos, sorted.length))
        if (clamped - 1 === from) return
        const [moved] = sorted.splice(from, 1)
        sorted.splice(clamped - 1, 0, moved)
        const renumbered = sorted.map((x, i) => ({ ...x, sort_order: i + 1 }))
        setItems(renumbered) // UI en tiempo real
        renumbered.forEach((x) => {
            const old = items.find((p) => p.id === x.id)
            if (old && old.sort_order !== x.sort_order) {
                adminAction(url, apiKey, "admin_upsert_wallpaper", {
                    p_id: x.id,
                    p_title: x.title,
                    p_is_free: x.is_free,
                    p_sort_order: x.sort_order,
                    p_active: x.active,
                })
            }
        })
        olvidar()
        flash("Orden actualizado")
    }

    const freeCount = items.filter((w) => w.is_free).length

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Wallpapers del Lente
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: hx("#ffffff", 0.5),
                        }}
                    >
                        {items.length} wallpaper{items.length === 1 ? "" : "s"}{" "}
                        · {freeCount} gratis
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LangToggle lang={lang} onChange={setLang} />
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading || busy}
                    >
                        {uploading ? "Subiendo…" : "+ Subir wallpaper"}
                    </button>
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    style={{ display: "none" }}
                />
            </div>

            <p
                style={{
                    margin: "0 0 16px",
                    fontSize: 11,
                    color: hx(GOLD, 0.7),
                    fontStyle: "italic",
                }}
            >
                El wallpaper marcado como Gratis es el único accesible sin
                Sintonía Solar.
            </p>

            {/* ── Sección Categorías ── */}
            <div className="mi-card" style={{ marginBottom: 18 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: cats.length ? 12 : 0,
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#fff",
                                letterSpacing: "0.04em",
                            }}
                        >
                            Categorías
                        </p>
                        <p
                            style={{
                                margin: "3px 0 0",
                                fontSize: 11,
                                color: hx("#ffffff", 0.5),
                            }}
                        >
                            El Tripulante filtra la galería por estas
                            categorías.
                        </p>
                    </div>
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={addCategoria}
                        disabled={busy}
                    >
                        + Agregar categoría
                    </button>
                </div>

                {cats.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {cats.map((c) => (
                            <WpCategoryRow
                                key={c.id}
                                cat={c}
                                lang={lang}
                                onSave={saveCategoria}
                                onDelete={deleteCategoria}
                            />
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <p
                    style={{
                        fontSize: 13,
                        color: "#fff",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Cargando…
                </p>
            ) : items.length === 0 ? (
                <p
                    style={{
                        fontSize: 13,
                        color: hx("#ffffff", 0.55),
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Aún no hay wallpapers. Sube el primero con “+ Subir
                    wallpaper”.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {[...items]
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((w) => (
                            <WallpaperRow
                                key={w.id}
                                item={w}
                                cats={cats}
                                lang={lang}
                                onSave={saveItem}
                                onReorder={reorderItem}
                                onDelete={deleteItem}
                                onSetCategory={setItemCategory}
                            />
                        ))}
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function WallpaperRow({
    item,
    cats,
    lang,
    onSave,
    onReorder,
    onDelete,
    onSetCategory,
}: {
    item: AdminWallpaper
    cats: AdminWpCategory[]
    lang: Lang
    onSave: (w: AdminWallpaper, patch: Partial<AdminWallpaper>) => void
    onReorder: (w: AdminWallpaper, newPos: number) => void
    onDelete: (w: AdminWallpaper) => void
    onSetCategory: (w: AdminWallpaper, categoryId: string | null) => void
}) {
    const [confirmDel, setConfirmDel] = useState(false)

    return (
        <div
            className="mi-card"
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 12,
                opacity: item.active ? 1 : 0.6,
            }}
        >
            {/* Miniatura full-res */}
            <div
                style={{
                    width: 64,
                    height: 110,
                    flexShrink: 0,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${hx("#ffffff", 0.1)}`,
                }}
            >
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : null}
            </div>

            {/* Controles */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    minWidth: 0,
                }}
            >
                <input
                    key={lang}
                    className="mi-input"
                    defaultValue={
                        lang === "en" ? item.title_en || "" : item.title
                    }
                    placeholder={
                        lang === "en"
                            ? "Wallpaper title (EN)…"
                            : "Título del wallpaper…"
                    }
                    onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (lang === "en") {
                            if (v !== (item.title_en || ""))
                                onSave(item, { title_en: v })
                        } else if (v && v !== item.title) {
                            onSave(item, { title: v })
                        }
                    }}
                    style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}
                />

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                    }}
                >
                    <button
                        className="mi-btn"
                        onClick={() => onSave(item, { is_free: !item.is_free })}
                        title={
                            item.is_free
                                ? "Gratis (tocar para volverlo de pago)"
                                : "De pago (tocar para hacerlo gratis)"
                        }
                        style={{
                            color: item.is_free ? GOLD : hx("#ffffff", 0.5),
                        }}
                    >
                        {item.is_free ? "★ Gratis" : "Gratis: no"}
                    </button>
                    <button
                        className="mi-btn"
                        onClick={() => onSave(item, { active: !item.active })}
                        title={
                            item.active
                                ? "Activo (tocar para ocultar)"
                                : "Oculto (tocar para activar)"
                        }
                        style={{
                            color: item.active ? GOLD : hx("#ffffff", 0.5),
                        }}
                    >
                        {item.active ? "Activo" : "Oculto"}
                    </button>

                    <label
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: hx("#ffffff", 0.55),
                        }}
                    >
                        Categoría
                        <select
                            className="mi-input"
                            value={item.category_id || ""}
                            onChange={(e) =>
                                onSetCategory(item, e.target.value || null)
                            }
                            style={{ padding: "6px 8px", maxWidth: 180 }}
                        >
                            <option value="">Sin categoría</option>
                            {cats.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: hx("#ffffff", 0.55),
                        }}
                    >
                        Orden
                        <input
                            /* key por sort_order: tras la cascada, este input se
                               re-monta mostrando el nuevo número (todas las filas
                               se renumeran en tiempo real). */
                            key={item.sort_order}
                            className="mi-input"
                            type="number"
                            defaultValue={item.sort_order}
                            onBlur={(e) => {
                                const n = parseInt(e.target.value, 10)
                                const v = Number.isFinite(n)
                                    ? n
                                    : item.sort_order
                                if (v !== item.sort_order) onReorder(item, v)
                            }}
                            style={{
                                width: 70,
                                padding: "6px 8px",
                                textAlign: "center",
                            }}
                        />
                    </label>

                    <div style={{ flex: 1 }} />

                    {confirmDel ? (
                        <>
                            <button
                                className="mi-btn mi-btn-red"
                                onClick={() => onDelete(item)}
                            >
                                ¿Borrar?
                            </button>
                            <button
                                className="mi-btn"
                                onClick={() => setConfirmDel(false)}
                            >
                                No
                            </button>
                        </>
                    ) : (
                        <button
                            className="mi-btn mi-btn-red"
                            onClick={() => setConfirmDel(true)}
                            title="Borrar wallpaper"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ═══ FILA DE CATEGORÍA ═══
   Nombre editable (guarda en blur), orden, toggle Activo y borrar (con
   confirmación). El nombre se controla con defaultValue para no perder el
   cursor mientras Zak escribe. */
function WpCategoryRow({
    cat,
    lang,
    onSave,
    onDelete,
}: {
    cat: AdminWpCategory
    lang: Lang
    onSave: (c: AdminWpCategory, patch: Partial<AdminWpCategory>) => void
    onDelete: (c: AdminWpCategory) => void
}) {
    const [confirmDel, setConfirmDel] = useState(false)

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                padding: "9px 11px",
                borderRadius: 9,
                background: cat.active
                    ? "rgba(255,255,255,0.045)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${hx("#ffffff", 0.08)}`,
                opacity: cat.active ? 1 : 0.6,
            }}
        >
            <input
                key={lang}
                className="mi-input"
                defaultValue={lang === "en" ? cat.name_en || "" : cat.name}
                placeholder={
                    lang === "en"
                        ? "Category name (EN)…"
                        : "Nombre de la categoría…"
                }
                onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (lang === "en") {
                        if (v !== (cat.name_en || ""))
                            onSave(cat, { name_en: v })
                    } else if (v && v !== cat.name) {
                        onSave(cat, { name: v })
                    }
                }}
                style={{
                    flex: 1,
                    minWidth: 140,
                    fontWeight: 600,
                    color: "#fff",
                    fontSize: 14,
                }}
            />

            <label
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: hx("#ffffff", 0.55),
                }}
            >
                Orden
                <input
                    className="mi-input"
                    type="number"
                    defaultValue={cat.sort_order}
                    onBlur={(e) => {
                        const n = parseInt(e.target.value, 10)
                        const v = Number.isFinite(n) ? n : cat.sort_order
                        if (v !== cat.sort_order) onSave(cat, { sort_order: v })
                    }}
                    style={{
                        width: 70,
                        padding: "6px 8px",
                        textAlign: "center",
                    }}
                />
            </label>

            <button
                className="mi-btn"
                onClick={() => onSave(cat, { active: !cat.active })}
                title={
                    cat.active
                        ? "Activa (tocar para ocultar)"
                        : "Oculta (tocar para activar)"
                }
                style={{ color: cat.active ? GOLD : hx("#ffffff", 0.5) }}
            >
                {cat.active ? "Activa" : "Oculta"}
            </button>

            {confirmDel ? (
                <>
                    <button
                        className="mi-btn mi-btn-red"
                        onClick={() => onDelete(cat)}
                    >
                        ¿Borrar?
                    </button>
                    <button
                        className="mi-btn"
                        onClick={() => setConfirmDel(false)}
                    >
                        No
                    </button>
                </>
            ) : (
                <button
                    className="mi-btn mi-btn-red"
                    onClick={() => setConfirmDel(true)}
                    title="Borrar categoría"
                >
                    ✕
                </button>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   AVATARES EDITOR — Panel de Avatares de Luz (Nova · Aurelia · Prisma).
   Edita los UMBRALES de Fotones de cada etapa (a cuántos Fotones evoluciona
   el avatar) y los params (brillo / respiración / giro, en %). El cliente lee
   get_avatar_config → cambiarlos aplica en la app SIN nuevo build. Incluye un
   segmento de PRUEBAS para sumar/restar/fijar los Fotones de una cuenta
   (server-authoritative vía daily_checkins; la fila sentinela no toca la racha
   ni los Fotones de hoy). Todo por el gateway admin-action (adminAction).
═══════════════════════════════════════════════════════════════════════ */
type AvatarParams = { glow: number; breath: number; spin: number }
/* Footprint = tamaño de los elementos de la Cámara por avatar × etapa, en %.
   base = radio del avatar (30 = 0.30 del semi-lado); el resto = multiplicador
   de tamaño del elemento (100 = 1.0×). */
type AvatarFootprint = {
    base: number[]
    ring: number[]
    aura: number[]
    swarm: number[]
    sigil: number[]
    wings: number[]
}
type AdminAvatar = {
    avatar_key: string
    label: string
    thresholds: number[]
    params: AvatarParams
    footprint: AvatarFootprint
    sort_order: number
}

/* Defaults del footprint (espejo del seed de 20260620m_avatar_footprint.sql). */
const FP_BASE_DEFAULT: Record<string, number[]> = {
    nova: [30, 33, 39, 46, 52, 55, 36],
    aurelia: [28, 36, 46, 54, 58, 58, 46],
    prisma: [40, 42, 44, 46, 49, 52, 55],
}
const FP_ELEMENT_KEYS: (keyof AvatarFootprint)[] = [
    "base",
    "ring",
    "aura",
    "swarm",
    "sigil",
    "wings",
]
const FP_LABELS: Record<keyof AvatarFootprint, string> = {
    base: "Tamaño del avatar",
    ring: "Anillos",
    aura: "Aura",
    swarm: "Enjambre",
    sigil: "Sello",
    wings: "Alas",
}
const FP_ONE7 = [100, 100, 100, 100, 100, 100, 100]
function arr7or(a: any, fallback: number[]): number[] {
    const out: number[] = []
    for (let i = 0; i < 7; i++) {
        const n = Math.round(Number(Array.isArray(a) ? a[i] : NaN))
        out.push(Number.isFinite(n) && n > 0 ? n : fallback[i])
    }
    return out
}
function normFootprint(raw: any, avatarKey: string): AvatarFootprint {
    const baseDef = FP_BASE_DEFAULT[avatarKey] || FP_BASE_DEFAULT.nova
    return {
        base: arr7or(raw?.base, baseDef),
        ring: arr7or(raw?.ring, FP_ONE7),
        aura: arr7or(raw?.aura, FP_ONE7),
        swarm: arr7or(raw?.swarm, FP_ONE7),
        sigil: arr7or(raw?.sigil, FP_ONE7),
        wings: arr7or(raw?.wings, FP_ONE7),
    }
}

const AVATAR_STAGE_NAMES: Record<string, string[]> = {
    nova: [
        "Chispa",
        "Brasa",
        "Enana",
        "Corona",
        "Sistema",
        "Gigante",
        "Púlsar",
    ],
    aurelia: [
        "Brasa",
        "Pulso",
        "Toroide",
        "Coral",
        "Prisma",
        "Nebulosa",
        "Singularidad",
    ],
    prisma: [
        "Roca",
        "Cuarzo",
        "Geoda",
        "Gema",
        "Resonante",
        "Prisma",
        "Diamante",
    ],
}
function stageNamesFor(key: string): string[] {
    return AVATAR_STAGE_NAMES[key] || ["1", "2", "3", "4", "5", "6", "7"]
}
function normAvatarParams(p: any): AvatarParams {
    const n = (v: any) => {
        const x = Number(v)
        return Number.isFinite(x)
            ? Math.max(10, Math.min(300, Math.round(x)))
            : 100
    }
    return { glow: n(p?.glow), breath: n(p?.breath), spin: n(p?.spin) }
}

function AvataresEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [items, setItems] = useState<AdminAvatar[]>([])
    const [loading, setLoading] = useState(true)
    const [savingKey, setSavingKey] = useState<string | null>(null)
    const [toast, setToast] = useState("")
    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 2000)
    }

    /* 🜂 Una vez por visita; guardar un avatar olvida. */
    const CLAVE = "admin_get_avatar_config"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        const rows: AdminAvatar[] = Array.isArray(res)
            ? res.map((r: any) => ({
                  avatar_key: String(r.avatar_key),
                  label: String(r.label || r.avatar_key),
                  thresholds: Array.isArray(r.thresholds)
                      ? r.thresholds.map((n: any) =>
                            Math.max(0, Number(n) || 0)
                        )
                      : [0, 0, 0, 0, 0, 0, 0],
                  params: normAvatarParams(r.params),
                  footprint: normFootprint(r.footprint, String(r.avatar_key)),
                  sort_order: Number(r.sort_order) || 0,
              }))
            : []
        setItems(rows)
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const setThreshold = (key: string, idx: number, val: number) => {
        setItems((prev) =>
            prev.map((a) =>
                a.avatar_key === key
                    ? {
                          ...a,
                          thresholds: a.thresholds.map((t, j) =>
                              j === idx ? val : t
                          ),
                      }
                    : a
            )
        )
    }
    const setParam = (key: string, field: keyof AvatarParams, val: number) => {
        setItems((prev) =>
            prev.map((a) =>
                a.avatar_key === key
                    ? { ...a, params: { ...a.params, [field]: val } }
                    : a
            )
        )
    }
    const setFootprint = (
        key: string,
        fpKey: keyof AvatarFootprint,
        idx: number,
        val: number
    ) => {
        setItems((prev) =>
            prev.map((a) =>
                a.avatar_key === key
                    ? {
                          ...a,
                          footprint: {
                              ...a.footprint,
                              [fpKey]: a.footprint[fpKey].map((t, j) =>
                                  j === idx ? val : t
                              ),
                          },
                      }
                    : a
            )
        )
    }

    const saveAvatar = async (a: AdminAvatar) => {
        setSavingKey(a.avatar_key)
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_avatar_config",
            {
                p_avatar_key: a.avatar_key,
                p_label: a.label,
                p_thresholds: a.thresholds,
                p_params: a.params,
                p_footprint: a.footprint,
            }
        )
        setSavingKey(null)
        olvidar()
        if (res && res.avatar_key) {
            setItems((prev) =>
                prev.map((x) =>
                    x.avatar_key === a.avatar_key
                        ? {
                              ...x,
                              thresholds: Array.isArray(res.thresholds)
                                  ? res.thresholds.map((n: any) =>
                                        Math.max(0, Number(n) || 0)
                                    )
                                  : x.thresholds,
                              params: normAvatarParams(res.params),
                              footprint: normFootprint(
                                  res.footprint,
                                  x.avatar_key
                              ),
                          }
                        : x
                )
            )
            flash("Avatar guardado · aplica en la app sin build")
        } else {
            flash(
                res?.error === "thresholds_need_7"
                    ? "Faltan umbrales (7)"
                    : "No se pudo guardar"
            )
        }
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 8,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Avatares de Luz
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11.5,
                            color: hx(GOLD, 0.85),
                            lineHeight: 1.5,
                        }}
                    >
                        Umbrales de Fotones por etapa + brillo/respiración/giro
                        + el tamaño de cada elemento de la Cámara (anillos,
                        aura, enjambre, sello, alas) por etapa. Lo que cambies
                        aplica en la app al instante, sin nuevo build.
                    </p>
                </div>
                <BtnRecargar
                    onClick={() => void load(true)}
                    disabled={loading}
                />
            </div>

            {loading ? (
                <p
                    style={{
                        fontSize: 13,
                        color: "#fff",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Cargando…
                </p>
            ) : items.length === 0 ? (
                <p
                    style={{
                        fontSize: 13,
                        color: hx("#ffffff", 0.55),
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    No hay avatares configurados. Aplica la migración
                    20260620d_avatar_config.sql.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}
                >
                    {items.map((a) => {
                        const names = stageNamesFor(a.avatar_key)
                        return (
                            <div
                                key={a.avatar_key}
                                className="mi-card"
                                style={{ padding: "14px 16px" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 12,
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: "#fff",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {a.label}
                                    </p>
                                    <button
                                        className="mi-btn mi-btn-gold"
                                        onClick={() => saveAvatar(a)}
                                        disabled={savingKey === a.avatar_key}
                                    >
                                        {savingKey === a.avatar_key
                                            ? "Guardando…"
                                            : "Guardar"}
                                    </button>
                                </div>

                                {/* Umbrales por etapa */}
                                <p
                                    style={{
                                        margin: "0 0 8px",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        color: hx("#ffffff", 0.5),
                                    }}
                                >
                                    Fotones para cada etapa
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 10,
                                        marginBottom: 14,
                                    }}
                                >
                                    {a.thresholds.map((t, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 4,
                                                width: 92,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 10.5,
                                                    color: hx("#ffffff", 0.6),
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {i + 1}.{" "}
                                                {names[i] || `Etapa ${i + 1}`}
                                            </span>
                                            {i === 0 ? (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: hx(
                                                            "#ffffff",
                                                            0.45
                                                        ),
                                                        padding: "5px 8px",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                        borderRadius: 8,
                                                    }}
                                                    title="La primera etapa siempre arranca en 0"
                                                >
                                                    0 · arranque
                                                </span>
                                            ) : (
                                                <ScoreInput
                                                    value={t}
                                                    onCommit={(n) =>
                                                        setThreshold(
                                                            a.avatar_key,
                                                            i,
                                                            n
                                                        )
                                                    }
                                                    min={0}
                                                    max={999999}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Params */}
                                <p
                                    style={{
                                        margin: "0 0 8px",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        color: hx("#ffffff", 0.5),
                                    }}
                                >
                                    Parámetros (% · 100 = normal)
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 14,
                                    }}
                                >
                                    {(
                                        [
                                            "glow",
                                            "breath",
                                            "spin",
                                        ] as (keyof AvatarParams)[]
                                    ).map((f) => (
                                        <div
                                            key={f}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 4,
                                                width: 110,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 10.5,
                                                    color: hx("#ffffff", 0.6),
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {f === "glow"
                                                    ? "Brillo"
                                                    : f === "breath"
                                                      ? "Respiración"
                                                      : "Giro"}
                                            </span>
                                            <ScoreInput
                                                value={a.params[f]}
                                                onCommit={(n) =>
                                                    setParam(a.avatar_key, f, n)
                                                }
                                                min={10}
                                                max={300}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Tamaño de los elementos por etapa (footprint) */}
                                <AvatarFootprintEditor
                                    avatar={a}
                                    names={names}
                                    onChange={(fpKey, idx, val) =>
                                        setFootprint(
                                            a.avatar_key,
                                            fpKey,
                                            idx,
                                            val
                                        )
                                    }
                                />
                            </div>
                        )
                    })}
                </div>
            )}

            <FotonesAdjuster url={url} apiKey={apiKey} flash={flash} />

            <ResetAvatarCard url={url} apiKey={apiKey} flash={flash} />

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* Editor del tamaño de los elementos de la Cámara por avatar × etapa. Un
   selector de elemento (Tamaño del avatar · Anillos · Aura · Enjambre · Sello ·
   Alas) + 7 campos (uno por etapa). base = radio del avatar en %; el resto =
   multiplicador en % (100 = normal). Aplica en la app sin build. */
function AvatarFootprintEditor({
    avatar,
    names,
    onChange,
}: {
    avatar: AdminAvatar
    names: string[]
    onChange: (fpKey: keyof AvatarFootprint, idx: number, val: number) => void
}) {
    const [sel, setSel] = React.useState<keyof AvatarFootprint>("base")
    const isBase = sel === "base"
    const arr = avatar.footprint[sel]
    return (
        <div style={{ marginTop: 16 }}>
            <p
                style={{
                    margin: "0 0 4px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: hx("#ffffff", 0.5),
                }}
            >
                Tamaño de los elementos por etapa
            </p>
            <p
                style={{
                    margin: "0 0 8px",
                    fontSize: 10.5,
                    color: hx("#ffffff", 0.42),
                    lineHeight: 1.5,
                }}
            >
                {isBase
                    ? "Tamaño del avatar en cada etapa (todos los elementos lo abrazan). 30 = chico · 60 = grande."
                    : "Multiplicador de este elemento por etapa. 100 = normal · 130 = 30 % más grande · 70 = más chico."}
            </p>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 10,
                }}
            >
                {FP_ELEMENT_KEYS.map((k) => (
                    <button
                        key={k}
                        onClick={() => setSel(k)}
                        className="mi-btn"
                        style={{
                            fontSize: 11,
                            padding: "5px 10px",
                            background:
                                sel === k
                                    ? hx(GOLD, 0.22)
                                    : "rgba(255,255,255,0.05)",
                            border: `1px solid ${sel === k ? hx(GOLD, 0.6) : "rgba(255,255,255,0.12)"}`,
                            color: sel === k ? "#fff" : hx("#ffffff", 0.7),
                            fontWeight: sel === k ? 700 : 500,
                        }}
                    >
                        {FP_LABELS[k]}
                    </button>
                ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {arr.map((t, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            width: 92,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10.5,
                                color: hx("#ffffff", 0.6),
                                fontWeight: 600,
                            }}
                        >
                            {i + 1}. {names[i] || `Etapa ${i + 1}`}
                        </span>
                        <ScoreInput
                            value={t}
                            onCommit={(n) => onChange(sel, i, n)}
                            min={isBase ? 5 : 20}
                            max={isBase ? 120 : 400}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

/* Segmento de pruebas: sumar/restar/fijar los Fotones de una cuenta para ver
   el avatar evolucionar. Server-authoritative vía daily_checkins (fila
   sentinela que NO toca la racha ni los Fotones de hoy). Default a la cuenta
   de pruebas; editable. */
function FotonesAdjuster({
    url,
    apiKey,
    flash,
}: {
    url: string
    apiKey: string
    flash: (m: string) => void
}) {
    const [email, setEmail] = useState("cuerpodeluz555@gmail.com")
    const [info, setInfo] = useState<{
        found: boolean
        total: number
        manual: number
        name?: string
    } | null>(null)
    const [busy, setBusy] = useState(false)
    const [customDelta, setCustomDelta] = useState(500)
    const [absTotal, setAbsTotal] = useState(2000)

    const refresh = async () => {
        const em = email.trim()
        if (!em) return
        setBusy(true)
        const res = await adminAction(url, apiKey, "admin_get_user_fotones", {
            p_target_email: em,
        })
        setBusy(false)
        if (res && res.found) {
            setInfo({
                found: true,
                total: Number(res.total_fotones) || 0,
                manual: Number(res.manual_adjust) || 0,
                name: res.full_name || undefined,
            })
        } else {
            setInfo({ found: false, total: 0, manual: 0 })
            flash("No se encontró esa cuenta")
        }
    }

    const adjust = async (delta: number) => {
        const em = email.trim()
        if (!em) return
        setBusy(true)
        const res = await adminAction(
            url,
            apiKey,
            "admin_adjust_user_fotones",
            {
                p_target_email: em,
                p_delta: delta,
            }
        )
        setBusy(false)
        /* 🜂 Mover los Fotones de una cuenta mueve el total del colectivo, que
           vive en la sub-pestaña de al lado: si no se olvida, Campo Solar
           pintaría el total anterior al cambiar de sub-pestaña. */
        motorCacheClear("admin_get_campo_solar")
        if (res && res.ok) {
            setInfo({
                found: true,
                total: Number(res.total_fotones) || 0,
                manual: Number(res.manual_adjust) || 0,
                name: info?.name,
            })
            flash(
                `${delta >= 0 ? "+" : ""}${delta} Fotones · total ${res.total_fotones}`
            )
        } else {
            flash("No se pudo ajustar")
        }
    }

    const setAbsolute = async (n: number) => {
        const em = email.trim()
        if (!em) return
        setBusy(true)
        const res = await adminAction(url, apiKey, "admin_set_user_fotones", {
            p_target_email: em,
            p_total: n,
        })
        setBusy(false)
        motorCacheClear("admin_get_campo_solar")
        if (res && res.ok) {
            setInfo({
                found: true,
                total: Number(res.total_fotones) || 0,
                manual: Number(res.manual_adjust) || 0,
                name: info?.name,
            })
            flash(`Total fijado en ${res.total_fotones}`)
        } else {
            flash("No se pudo fijar")
        }
    }

    return (
        <div
            className="mi-card"
            style={{
                padding: "16px 18px",
                marginTop: 18,
                border: `1px solid ${hx(GOLD, 0.25)}`,
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: "0.04em",
                }}
            >
                Mis Fotones (pruebas)
            </p>
            <p
                style={{
                    margin: "4px 0 12px",
                    fontSize: 11,
                    color: hx("#ffffff", 0.5),
                    lineHeight: 1.5,
                }}
            >
                Suma, resta o fija los Fotones de una cuenta para ver el avatar
                evolucionar. No toca la racha ni los Fotones de hoy.
            </p>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <input
                    className="mi-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo de la cuenta"
                    style={{ flex: "1 1 240px", color: "#fff" }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") refresh()
                    }}
                />
                <button className="mi-btn" onClick={refresh} disabled={busy}>
                    {busy ? "…" : "Consultar"}
                </button>
            </div>

            {info && info.found && (
                <div
                    style={{
                        display: "flex",
                        gap: 20,
                        flexWrap: "wrap",
                        marginBottom: 14,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.22)",
                    }}
                >
                    <div>
                        <span
                            style={{
                                display: "block",
                                fontSize: 10,
                                color: hx("#ffffff", 0.5),
                                letterSpacing: "0.1em",
                            }}
                        >
                            TOTAL
                        </span>
                        <span
                            style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: GOLD,
                            }}
                        >
                            {info.total.toLocaleString("es-MX")}
                        </span>
                    </div>
                    <div>
                        <span
                            style={{
                                display: "block",
                                fontSize: 10,
                                color: hx("#ffffff", 0.5),
                                letterSpacing: "0.1em",
                            }}
                        >
                            AJUSTE MANUAL
                        </span>
                        <span
                            style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: "#fff",
                            }}
                        >
                            {info.manual >= 0 ? "+" : ""}
                            {info.manual.toLocaleString("es-MX")}
                        </span>
                    </div>
                    {info.name && (
                        <div>
                            <span
                                style={{
                                    display: "block",
                                    fontSize: 10,
                                    color: hx("#ffffff", 0.5),
                                    letterSpacing: "0.1em",
                                }}
                            >
                                CUENTA
                            </span>
                            <span
                                style={{
                                    fontSize: 13,
                                    color: "#fff",
                                    fontWeight: 600,
                                }}
                            >
                                {info.name}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Botones rápidos */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 12,
                }}
            >
                {[100, 500, 1000, 5000].map((d) => (
                    <button
                        key={`+${d}`}
                        className="mi-btn mi-btn-gold"
                        onClick={() => adjust(d)}
                        disabled={busy}
                    >
                        +{d}
                    </button>
                ))}
                {[100, 500, 1000].map((d) => (
                    <button
                        key={`-${d}`}
                        className="mi-btn mi-btn-red"
                        onClick={() => adjust(-d)}
                        disabled={busy}
                    >
                        −{d}
                    </button>
                ))}
                <button
                    className="mi-btn mi-btn-red"
                    onClick={() => setAbsolute(0)}
                    disabled={busy}
                    title="Vaciar a 0"
                >
                    Reset 0
                </button>
            </div>

            {/* Delta y total custom */}
            <div
                style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                }}
            >
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                    <span
                        style={{
                            fontSize: 10.5,
                            color: hx("#ffffff", 0.55),
                            fontWeight: 600,
                        }}
                    >
                        Sumar/restar
                    </span>
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <div style={{ width: 90 }}>
                            <ScoreInput
                                value={customDelta}
                                onCommit={setCustomDelta}
                                min={0}
                                max={999999}
                            />
                        </div>
                        <button
                            className="mi-btn"
                            onClick={() => adjust(customDelta)}
                            disabled={busy}
                        >
                            +
                        </button>
                        <button
                            className="mi-btn"
                            onClick={() => adjust(-customDelta)}
                            disabled={busy}
                        >
                            −
                        </button>
                    </div>
                </div>
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                    <span
                        style={{
                            fontSize: 10.5,
                            color: hx("#ffffff", 0.55),
                            fontWeight: 600,
                        }}
                    >
                        Fijar total exacto
                    </span>
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <div style={{ width: 90 }}>
                            <ScoreInput
                                value={absTotal}
                                onCommit={setAbsTotal}
                                min={0}
                                max={999999}
                            />
                        </div>
                        <button
                            className="mi-btn mi-btn-gold"
                            onClick={() => setAbsolute(absTotal)}
                            disabled={busy}
                        >
                            Fijar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   CRISTALIZACIÓN EDITOR — catálogo de la Cámara de Cristalización (la
   tienda). Avatares + elementos comprables con Fotones: precio, requisitos
   de etapa/racha, params del render, orden, activo. DB-driven → cambia en la
   app sin build. Estilo claro y sólido (tarjetas con fondo, no solo bordes).
   Vía el gateway admin-action (adminAction).
═══════════════════════════════════════════════════════════════════════ */
type AdminCristal = {
    item_key: string
    kind: string
    label: string
    descripcion: string
    price: number
    requires_stage: number
    requires_streak: number
    params: any
    sort_order: number
    active: boolean
}

const CRISTAL_KINDS: { kind: string; label: string }[] = [
    { kind: "avatar", label: "Avatares" },
    { kind: "aura", label: "Auras" },
    { kind: "ring", label: "Anillos" },
    { kind: "swarm", label: "Enjambres" },
    { kind: "sigil", label: "Sellos" },
    { kind: "wings", label: "Alas" },
]

const PANEL_BG = "rgba(16,22,40,0.92)"
const FIELD_BG = "rgba(255,255,255,0.08)"
const LABEL_COL = "rgba(255,255,255,0.7)"

function paramsToText(p: any): string {
    try {
        return p && typeof p === "object" ? JSON.stringify(p) : "{}"
    } catch {
        return "{}"
    }
}

function CristalizacionEditor({
    url,
    apiKey,
}: {
    url: string
    apiKey: string
}) {
    const [items, setItems] = useState<AdminCristal[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState("")
    const [adding, setAdding] = useState(false)
    const [newKind, setNewKind] = useState("aura")
    const [newKey, setNewKey] = useState("")
    const [newLabel, setNewLabel] = useState("")
    const [newPrice, setNewPrice] = useState(500)

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 2000)
    }

    /* 🜂 Una vez por visita; toda escritura olvida. Ojo con `addItem`: relee
       enseguida, así que pide `load(true)` — un `load()` a secas devolvería lo
       que ya había en memoria y el ítem recién creado no aparecería. */
    const CLAVE = "admin_get_crystal_catalog"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setItems(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const save = async (it: AdminCristal, patch: Partial<AdminCristal>) => {
        const next = { ...it, ...patch }
        setItems((prev) =>
            prev.map((x) => (x.item_key === it.item_key ? next : x))
        )
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_crystal_item",
            {
                p_item_key: next.item_key,
                p_kind: next.kind,
                p_label: next.label,
                p_descripcion: next.descripcion,
                p_price: next.price,
                p_requires_stage: next.requires_stage,
                p_requires_streak: next.requires_streak,
                p_params: next.params,
                p_sort_order: next.sort_order,
                p_active: next.active,
            }
        )
        olvidar()
        if (!res || res.error) flash("No se pudo guardar")
    }

    const del = async (it: AdminCristal) => {
        setItems((prev) => prev.filter((x) => x.item_key !== it.item_key))
        await adminAction(url, apiKey, "admin_delete_crystal_item", {
            p_item_key: it.item_key,
        })
        olvidar()
        flash("Ítem eliminado")
    }

    const addItem = async () => {
        const key = newKey.trim()
        const label = newLabel.trim()
        if (!key || !label) {
            flash("Pon clave y nombre")
            return
        }
        const fullKey = key.includes(":") ? key : `${newKind}:${key}`
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_crystal_item",
            {
                p_item_key: fullKey,
                p_kind: newKind,
                p_label: label,
                p_descripcion: "",
                p_price: Number.isFinite(newPrice) ? newPrice : 0,
                p_requires_stage: 0,
                p_requires_streak: 0,
                p_params: {},
                p_sort_order:
                    items.filter((i) => i.kind === newKind).length + 1,
                p_active: true,
            }
        )
        if (res && res.item_key) {
            await load(true)
            setNewKey("")
            setNewLabel("")
            setNewPrice(500)
            setAdding(false)
            flash("Ítem creado")
        } else {
            flash("No se pudo crear")
        }
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Cámara de Cristalización
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 12,
                            color: hx(GOLD, 0.9),
                            lineHeight: 1.5,
                        }}
                    >
                        Tienda de avatares + elementos. Precio, requisitos y
                        params se aplican en la app al instante, sin build.
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={() => setAdding((a) => !a)}
                    >
                        {adding ? "Cancelar" : "+ Ítem"}
                    </button>
                </div>
            </div>

            {adding && (
                <div
                    style={{
                        background: PANEL_BG,
                        borderRadius: 14,
                        padding: 16,
                        marginBottom: 16,
                        border: `1px solid ${hx(GOLD, 0.3)}`,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "flex-end",
                        }}
                    >
                        <Field label="Categoría">
                            <select
                                value={newKind}
                                onChange={(e) => setNewKind(e.target.value)}
                                style={{ ...selStyle }}
                            >
                                {CRISTAL_KINDS.map((k) => (
                                    <option
                                        key={k.kind}
                                        value={k.kind}
                                        style={{ color: "#000" }}
                                    >
                                        {k.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Clave (ej. solar)">
                            <input
                                className="mi-input"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                style={{ ...inpStyle, width: 130 }}
                                placeholder="solar"
                            />
                        </Field>
                        <Field label="Nombre">
                            <input
                                className="mi-input"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                style={{ ...inpStyle, width: 170 }}
                                placeholder="Aura Solar"
                            />
                        </Field>
                        <Field label="Precio (Fotones)">
                            <div style={{ width: 90 }}>
                                <ScoreInput
                                    value={newPrice}
                                    onCommit={setNewPrice}
                                    min={0}
                                    max={999999}
                                />
                            </div>
                        </Field>
                        <button
                            className="mi-btn mi-btn-gold"
                            onClick={addItem}
                            disabled={!newKey.trim() || !newLabel.trim()}
                        >
                            Crear
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p
                    style={{
                        fontSize: 13,
                        color: "#fff",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Cargando…
                </p>
            ) : (
                CRISTAL_KINDS.map((cat) => {
                    const group = items.filter((i) => i.kind === cat.kind)
                    if (!group.length) return null
                    return (
                        <div key={cat.kind} style={{ marginBottom: 22 }}>
                            <p
                                style={{
                                    margin: "0 0 10px",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: GOLD,
                                }}
                            >
                                {cat.label} · {group.length}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                {group.map((it) => (
                                    <CristalRow
                                        key={it.item_key}
                                        item={it}
                                        onSave={save}
                                        onDelete={del}
                                        isAvatar={cat.kind === "avatar"}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const selStyle: React.CSSProperties = {
    background: FIELD_BG,
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 8,
    color: "#fff",
    padding: "7px 10px",
    fontSize: 13,
}
const inpStyle: React.CSSProperties = {
    background: FIELD_BG,
    color: "#fff",
}

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 11, color: LABEL_COL, fontWeight: 600 }}>
                {label}
            </span>
            {children}
        </div>
    )
}

function CristalRow({
    item,
    onSave,
    onDelete,
    isAvatar,
}: {
    item: AdminCristal
    onSave: (it: AdminCristal, patch: Partial<AdminCristal>) => void
    onDelete: (it: AdminCristal) => void
    isAvatar: boolean
}) {
    const [confirmDel, setConfirmDel] = useState(false)
    const [paramsText, setParamsText] = useState(paramsToText(item.params))

    return (
        <div
            style={{
                background: item.active ? PANEL_BG : "rgba(16,22,40,0.55)",
                border: `1px solid ${item.active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 14,
                padding: "14px 16px",
                opacity: item.active ? 1 : 0.65,
            }}
        >
            {/* Fila 1: nombre + clave + activo/borrar */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 12,
                    flexWrap: "wrap",
                }}
            >
                <input
                    className="mi-input"
                    defaultValue={item.label}
                    onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v && v !== item.label) onSave(item, { label: v })
                    }}
                    style={{
                        ...inpStyle,
                        flex: "1 1 180px",
                        fontWeight: 700,
                        fontSize: 15,
                    }}
                />
                <span
                    style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "monospace",
                    }}
                >
                    {item.item_key}
                </span>
                <button
                    className="mi-btn"
                    onClick={() => onSave(item, { active: !item.active })}
                    style={{
                        color: item.active ? GOLD : "rgba(255,255,255,0.5)",
                    }}
                >
                    {item.active ? "Activo" : "Oculto"}
                </button>
                {confirmDel ? (
                    <span style={{ display: "flex", gap: 6 }}>
                        <button
                            className="mi-btn mi-btn-red"
                            onClick={() => onDelete(item)}
                        >
                            ¿Borrar?
                        </button>
                        <button
                            className="mi-btn"
                            onClick={() => setConfirmDel(false)}
                        >
                            No
                        </button>
                    </span>
                ) : (
                    <button
                        className="mi-btn mi-btn-red"
                        onClick={() => setConfirmDel(true)}
                        title="Borrar"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Fila 2: descripción */}
            <div style={{ marginBottom: 12 }}>
                <Field label="Descripción">
                    <input
                        className="mi-input"
                        defaultValue={item.descripcion}
                        onBlur={(e) => {
                            if (e.target.value !== item.descripcion)
                                onSave(item, { descripcion: e.target.value })
                        }}
                        style={{ ...inpStyle, width: "100%" }}
                        placeholder="Qué es este ítem…"
                    />
                </Field>
            </div>

            {/* Fila 3: precio + requisitos + orden */}
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                }}
            >
                <Field
                    label={
                        isAvatar ? "Precio extra (Fotones)" : "Precio (Fotones)"
                    }
                >
                    <div style={{ width: 96 }}>
                        <ScoreInput
                            value={item.price}
                            onCommit={(n) => onSave(item, { price: n })}
                            min={0}
                            max={999999}
                        />
                    </div>
                </Field>
                <Field label="Etapa de avatar mín. (0 = libre)">
                    <div style={{ width: 70 }}>
                        <ScoreInput
                            value={item.requires_stage}
                            onCommit={(n) =>
                                onSave(item, { requires_stage: n })
                            }
                            min={0}
                            max={7}
                        />
                    </div>
                </Field>
                <Field label="Racha mín. días (0 = libre)">
                    <div style={{ width: 70 }}>
                        <ScoreInput
                            value={item.requires_streak}
                            onCommit={(n) =>
                                onSave(item, { requires_streak: n })
                            }
                            min={0}
                            max={365}
                        />
                    </div>
                </Field>
                <Field label="Orden">
                    <div style={{ width: 60 }}>
                        <ScoreInput
                            value={item.sort_order}
                            onCommit={(n) => onSave(item, { sort_order: n })}
                            min={0}
                            max={9999}
                        />
                    </div>
                </Field>
                {!isAvatar && (
                    <Field label="Params (JSON)">
                        <input
                            className="mi-input"
                            value={paramsText}
                            onChange={(e) => setParamsText(e.target.value)}
                            onBlur={() => {
                                try {
                                    const parsed = JSON.parse(
                                        paramsText || "{}"
                                    )
                                    onSave(item, { params: parsed })
                                } catch {
                                    setParamsText(paramsToText(item.params))
                                }
                            }}
                            style={{
                                ...inpStyle,
                                width: 180,
                                fontFamily: "monospace",
                                fontSize: 12,
                            }}
                            placeholder='{"palette":"solar"}'
                        />
                    </Field>
                )}
            </div>
            <p
                style={{
                    margin: "8px 0 0",
                    fontSize: 10.5,
                    color: "rgba(255,255,255,0.4)",
                }}
            >
                Etapa de avatar 0 = sin requisito. 1–7 = el Tripulante debe
                tener su avatar en esa etapa.
            </p>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   CAMPO SOLAR EDITOR — mueve el total del colectivo (para pruebas). Como
   nuestra cuenta admin está EXCLUIDA del Campo Solar, sumarle Fotones a ella
   no mueve el número. Por eso sumamos/restamos a una CUENTA SEMILLA que SÍ
   cuenta como un tripulante más. Reset (a 0) devuelve el campo a su estado
   natural. Acá también irán, con el tiempo, los niveles/estados del Sol.
═══════════════════════════════════════════════════════════════════════ */
function CampoSolarEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [collective, setCollective] = useState(0)
    const [contributors, setContributors] = useState(0)
    const [seed, setSeed] = useState(0)
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState("")
    const [customDelta, setCustomDelta] = useState(500)

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 2000)
    }

    /* 🜂 Una vez por visita. Ajustar el colectivo devuelve los totales nuevos
       en la misma respuesta (no hay relectura), así que basta con olvidar para
       que la próxima visita no pinte el total anterior. */
    const CLAVE = "admin_get_campo_solar"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        if (res && !res.error) {
            setCollective(Number(res.collective_total) || 0)
            setContributors(Number(res.collective_contributors) || 0)
            setSeed(Number(res.seed_points) || 0)
        }
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const adjust = async (delta: number) => {
        if (busy) return
        setBusy(true)
        const res = await adminAction(url, apiKey, "admin_adjust_campo_solar", {
            p_delta: delta,
        })
        setBusy(false)
        olvidar()
        if (res && res.ok) {
            setCollective(Number(res.collective_total) || 0)
            setContributors(Number(res.collective_contributors) || 0)
            setSeed(Number(res.seed_points) || 0)
            flash(`${delta >= 0 ? "+" : ""}${delta} al colectivo`)
        } else {
            flash("No se pudo ajustar")
        }
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Campo Solar Colectivo
                    </p>
                    <p
                        style={{
                            margin: "4px 0 16px",
                            fontSize: 12,
                            color: hx(GOLD, 0.9),
                            lineHeight: 1.5,
                        }}
                    >
                        El medidor planetario que ven todos los tripulantes. Tu
                        cuenta admin está EXCLUIDA, así que aquí movés el total
                        a través de una cuenta semilla que sí cuenta. Reset lo
                        devuelve a su estado natural.
                    </p>
                </div>
                <BtnRecargar onClick={() => void load(true)} disabled={busy} />
            </div>

            {/* Lectura */}
            <div
                style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    marginBottom: 18,
                }}
            >
                <div
                    style={{
                        background: PANEL_BG,
                        border: `1px solid ${hx(GOLD, 0.3)}`,
                        borderRadius: 14,
                        padding: "16px 20px",
                        flex: "1 1 180px",
                    }}
                >
                    <span
                        style={{
                            display: "block",
                            fontSize: 10.5,
                            color: "rgba(255,255,255,0.55)",
                            letterSpacing: "0.12em",
                        }}
                    >
                        COLECTIVO (REAL)
                    </span>
                    <span
                        style={{ fontSize: 30, fontWeight: 800, color: GOLD }}
                    >
                        {collective.toLocaleString("es-MX")}
                    </span>
                    <span
                        style={{
                            display: "block",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 2,
                        }}
                    >
                        {contributors.toLocaleString("es-MX")} tripulantes
                    </span>
                </div>
                <div
                    style={{
                        background: PANEL_BG,
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: 14,
                        padding: "16px 20px",
                        flex: "1 1 140px",
                    }}
                >
                    <span
                        style={{
                            display: "block",
                            fontSize: 10.5,
                            color: "rgba(255,255,255,0.55)",
                            letterSpacing: "0.12em",
                        }}
                    >
                        CUENTA SEMILLA
                    </span>
                    <span
                        style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}
                    >
                        {seed.toLocaleString("es-MX")}
                    </span>
                    <span
                        style={{
                            display: "block",
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 2,
                        }}
                    >
                        Fotones que aportás vos
                    </span>
                </div>
            </div>

            {/* Botones rápidos */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 14,
                }}
            >
                {[100, 500, 1000, 5000].map((d) => (
                    <button
                        key={`+${d}`}
                        className="mi-btn mi-btn-gold"
                        onClick={() => adjust(d)}
                        disabled={busy}
                    >
                        +{d}
                    </button>
                ))}
                {[100, 500, 1000].map((d) => (
                    <button
                        key={`-${d}`}
                        className="mi-btn mi-btn-red"
                        onClick={() => adjust(-d)}
                        disabled={busy}
                    >
                        −{d}
                    </button>
                ))}
                <button
                    className="mi-btn mi-btn-red"
                    onClick={() => adjust(-seed)}
                    disabled={busy || seed === 0}
                    title="Devuelve el colectivo a su estado natural"
                >
                    Reset semilla
                </button>
            </div>

            {/* Custom */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    marginBottom: 22,
                }}
            >
                <Field label="Sumar / restar al colectivo">
                    <div style={{ width: 100 }}>
                        <ScoreInput
                            value={customDelta}
                            onCommit={setCustomDelta}
                            min={0}
                            max={9999999}
                        />
                    </div>
                </Field>
                <button
                    className="mi-btn mi-btn-gold"
                    onClick={() => adjust(customDelta)}
                    disabled={busy}
                >
                    Sumar
                </button>
                <button
                    className="mi-btn mi-btn-red"
                    onClick={() => adjust(-customDelta)}
                    disabled={busy}
                >
                    Restar
                </button>
            </div>

            <div
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px dashed rgba(255,255,255,0.14)",
                    borderRadius: 14,
                    padding: "16px 18px",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        color: hx(GOLD, 0.85),
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                    }}
                >
                    Niveles del Sol · próximamente
                </p>
                <p
                    style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.5,
                    }}
                >
                    Aquí vas a poder definir estados/etapas del Sol colectivo
                    según los Fotones acumulados (umbrales, color, intensidad).
                    Lo iremos mejorando.
                </p>
            </div>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   AVATARES HUB — la pestaña "Avatares" del Motor con dos sub-pestañas:
   "Avatares" (umbrales + params de cada avatar) + "Campo Solar" (el
   colectivo). Default "Avatares".
═══════════════════════════════════════════════════════════════════════ */
/* Reinicia el avatar de un Tripulante (borra elegido + comprado) → al re-entrar
   a la app vuelve a elegir desde cero. Vive al pie del editor de Avatares. */
function ResetAvatarCard({
    url,
    apiKey,
    flash,
}: {
    url: string
    apiKey: string
    flash: (m: string) => void
}) {
    const [email, setEmail] = useState("")
    const [busy, setBusy] = useState(false)
    const run = async () => {
        if (busy || !email.trim()) return
        setBusy(true)
        const res: any = await adminAction(url, apiKey, "admin_reset_avatar", {
            p_target_email: email.trim(),
        })
        setBusy(false)
        if (res && res.ok) {
            flash(`Avatar reiniciado · ${res.users_reset} cuenta(s)`)
            setEmail("")
        } else {
            flash(
                res?.error === "user_not_found"
                    ? "No encontré esa cuenta"
                    : "No se pudo reiniciar"
            )
        }
    }
    return (
        <div className="mi-card" style={{ marginTop: 24 }}>
            <p className="mi-label">Reiniciar avatar de un Tripulante</p>
            <p
                style={{
                    fontSize: 12.5,
                    color: hx("#ffffff", 0.55),
                    margin: "4px 0 12px",
                    lineHeight: 1.5,
                }}
            >
                Borra su avatar elegido y lo que compró con Fotones. Al volver a
                entrar a la app, elige avatar desde cero.
            </p>
            <input
                className="mi-input"
                type="email"
                placeholder="correo@tripulante.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button
                className="mi-btn-red mi-btn"
                style={{ marginTop: 10 }}
                disabled={busy || !email.trim()}
                onClick={run}
            >
                {busy ? "Reiniciando…" : "Reiniciar avatar"}
            </button>
        </div>
    )
}

/* Enviar un DM desde la cuenta admin a cualquier Tripulante por su correo.
   Dispara la notificación push (sirve para probar con un solo dispositivo:
   veocancun → cuerpodeluz555). Tab "Mensajes" del Motor. */
function MensajeAdminEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [email, setEmail] = useState("cuerpodeluz555@gmail.com")
    const [body, setBody] = useState("")
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState("")
    const flash = (m: string) => {
        setToast(m)
        setTimeout(() => setToast(""), 2600)
    }
    const send = async () => {
        if (busy || !email.trim() || !body.trim()) return
        setBusy(true)
        const res: any = await adminAction(url, apiKey, "admin_send_dm", {
            p_target_email: email.trim(),
            p_body: body.trim(),
        })
        setBusy(false)
        if (res && res.ok) {
            flash("Mensaje enviado · le llega la notificación")
            setBody("")
        } else {
            flash(
                res?.error === "user_not_found"
                    ? "No encontré esa cuenta"
                    : res?.error === "cant_message_self"
                      ? "No puedes mandarte a ti mismo"
                      : "No se pudo enviar"
            )
        }
    }
    return (
        <div>
            <h2 style={{ marginBottom: 6 }}>Enviar mensaje a un Tripulante</h2>
            <p
                style={{
                    fontSize: 13,
                    color: hx("#ffffff", 0.6),
                    marginBottom: 18,
                    lineHeight: 1.55,
                    maxWidth: 560,
                }}
            >
                Manda un mensaje directo desde tu cuenta admin a cualquier
                Tripulante por su correo. Le llega la notificación push (útil
                para probar con un solo dispositivo).
            </p>
            <div className="mi-card" style={{ maxWidth: 560 }}>
                <p className="mi-label">Correo del Tripulante</p>
                <input
                    className="mi-input"
                    type="email"
                    placeholder="cuerpodeluz555@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mi-label" style={{ marginTop: 14 }}>
                    Mensaje
                </p>
                <textarea
                    className="mi-input"
                    rows={4}
                    maxLength={2000}
                    placeholder="Escribe tu mensaje…  (⌘/Ctrl + Enter para enviar)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault()
                            send()
                        }
                    }}
                    style={{ resize: "vertical", minHeight: 90 }}
                />
                <button
                    className="mi-btn-gold mi-btn"
                    style={{ marginTop: 12 }}
                    disabled={busy || !email.trim() || !body.trim()}
                    onClick={send}
                >
                    {busy ? "Enviando…" : "Enviar mensaje"}
                </button>
            </div>
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function AvataresHub({ url, apiKey }: { url: string; apiKey: string }) {
    const [tab, setTab] = useState<"avatares" | "campo">("avatares")
    return (
        <div>
            <div className="mi-tabs" style={{ marginBottom: 20 }}>
                <button
                    className={`mi-tab ${tab === "avatares" ? "active" : ""}`}
                    onClick={() => setTab("avatares")}
                >
                    Avatares
                </button>
                <button
                    className={`mi-tab ${tab === "campo" ? "active" : ""}`}
                    onClick={() => setTab("campo")}
                >
                    Campo Solar
                </button>
            </div>
            {tab === "avatares" ? (
                <AvataresEditor url={url} apiKey={apiKey} />
            ) : (
                <CampoSolarEditor url={url} apiKey={apiKey} />
            )}
        </div>
    )
}

/* ═══ GHOST WRAPPER ═══ */
function MIEditoresShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MIEditoresShell.displayName = "MI_Editores"

// ════════════════════════════════════════════════════════════════════
// CAPA DE COMUNIDAD — editor del catálogo de intereses (Motor → "Comunidad").
// CRUD de las categorías de interés del directorio (Constelación de la Red):
// label, orden, activo, conteo de tripulantes, agregar/borrar. DB-driven vía el
// gateway admin-action (adminAction → admin_get/upsert/delete_community_interest).
// Son los chips de filtro del directorio + las opciones del perfil del Tripulante.
// Cambiar esto aplica en la app al instante, sin nuevo build.
// ════════════════════════════════════════════════════════════════════
type AdminInterest = {
    interest_key: string
    label: string
    sort_order: number
    active: boolean
    members: number
}

function slugifyInterestKey(label: string): string {
    return (label || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // quita acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60)
}

function ComunidadInteresesEditor({
    url,
    apiKey,
}: {
    url: string
    apiKey: string
}) {
    const [items, setItems] = useState<AdminInterest[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState("")
    const [adding, setAdding] = useState(false)
    const [newLabel, setNewLabel] = useState("")

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1800)
    }

    /* 🜂 Una vez por visita; toda escritura olvida (guardado optimista). */
    const CLAVE = "admin_get_community_interests"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setItems(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const saveInterest = async (
        r: AdminInterest,
        patch: Partial<AdminInterest>
    ) => {
        const next = { ...r, ...patch }
        setItems((prev) =>
            prev.map((x) => (x.interest_key === r.interest_key ? next : x))
        )
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_community_interest",
            {
                p_interest_key: next.interest_key,
                p_label: next.label,
                p_sort_order: next.sort_order,
                p_active: next.active,
            }
        )
        olvidar()
        if (!res || res.error) flash("No se pudo guardar")
    }

    const deleteInterest = async (r: AdminInterest) => {
        setItems((prev) =>
            prev.filter((x) => x.interest_key !== r.interest_key)
        )
        await adminAction(url, apiKey, "admin_delete_community_interest", {
            p_interest_key: r.interest_key,
        })
        olvidar()
        flash("Interés eliminado")
    }

    const addInterest = async () => {
        const label = newLabel.trim()
        if (!label) return
        const key = slugifyInterestKey(label)
        if (!key) {
            flash("Usa letras o números")
            return
        }
        if (items.some((x) => x.interest_key === key)) {
            flash("Ese interés ya existe")
            return
        }
        setBusy(true)
        const sort = Math.max(0, ...items.map((x) => x.sort_order)) + 1
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_community_interest",
            {
                p_interest_key: key,
                p_label: label,
                p_sort_order: sort,
                p_active: true,
            }
        )
        setBusy(false)
        olvidar()
        if (res && res.interest_key) {
            const row: AdminInterest = {
                interest_key: res.interest_key,
                label: res.label,
                sort_order: res.sort_order,
                active: res.active,
                members: res.members || 0,
            }
            setItems((prev) => {
                const without = prev.filter(
                    (x) => x.interest_key !== row.interest_key
                )
                return [...without, row]
            })
            setNewLabel("")
            setAdding(false)
            flash("Interés guardado")
        } else {
            flash("No se pudo crear")
        }
    }

    const totalActive = items.filter((x) => x.active).length

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Intereses de la Comunidad
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: hx("#ffffff", 0.5),
                        }}
                    >
                        {items.length} interés{items.length === 1 ? "" : "es"} ·{" "}
                        {totalActive} activo{totalActive === 1 ? "" : "s"}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={() => setAdding((a) => !a)}
                        disabled={busy}
                    >
                        {adding ? "Cancelar" : "+ Interés"}
                    </button>
                </div>
            </div>

            <p
                style={{
                    margin: "0 0 14px",
                    fontSize: 11.5,
                    color: hx(GOLD, 0.85),
                    lineHeight: 1.5,
                }}
            >
                Estos son los chips de filtro del directorio (Constelación de la
                Red) y las opciones que el Tripulante elige en su perfil. Aplica
                en la app al instante, sin nuevo build.
            </p>

            {adding && (
                <div
                    className="mi-card"
                    style={{ padding: "14px 16px", marginBottom: 14 }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "flex-end",
                        }}
                    >
                        <div style={{ flex: "1 1 200px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 11,
                                    color: hx("#ffffff", 0.55),
                                    marginBottom: 5,
                                }}
                            >
                                Nombre del interés
                            </label>
                            <input
                                className="mi-input"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="Viajes astrales…"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addInterest()
                                }}
                                style={{ width: "100%", color: "#fff" }}
                                autoFocus
                            />
                        </div>
                        <button
                            className="mi-btn mi-btn-gold"
                            onClick={addInterest}
                            disabled={busy || !newLabel.trim()}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p
                    style={{
                        fontSize: 13,
                        color: "#fff",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Cargando…
                </p>
            ) : items.length === 0 ? (
                <p
                    style={{
                        fontSize: 13,
                        color: hx("#ffffff", 0.55),
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Aún no hay intereses. Crea el primero con "+ Interés".
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {items.map((r) => (
                        <InterestRow
                            key={r.interest_key}
                            interest={r}
                            onSave={saveInterest}
                            onDelete={deleteInterest}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function InterestRow({
    interest,
    onSave,
    onDelete,
}: {
    interest: AdminInterest
    onSave: (r: AdminInterest, patch: Partial<AdminInterest>) => void
    onDelete: (r: AdminInterest) => void
}) {
    const [confirmDel, setConfirmDel] = useState(false)
    return (
        <div
            className="mi-card"
            style={{
                padding: "12px 14px",
                marginBottom: 0,
                opacity: interest.active ? 1 : 0.6,
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
            }}
        >
            <input
                className="mi-input"
                defaultValue={interest.label}
                onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v && v !== interest.label)
                        onSave(interest, { label: v })
                }}
                style={{
                    flex: "1 1 160px",
                    fontWeight: 600,
                    color: "#fff",
                    fontSize: 14,
                }}
            />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: "0 0 auto",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        color: hx("#ffffff", 0.5),
                        fontWeight: 600,
                    }}
                >
                    Orden
                </span>
                <div style={{ width: 60 }}>
                    <ScoreInput
                        value={interest.sort_order}
                        onCommit={(n) => {
                            if (n !== interest.sort_order)
                                onSave(interest, { sort_order: n })
                        }}
                        min={0}
                        max={9999}
                    />
                </div>
            </div>
            <span
                style={{
                    fontSize: 11,
                    color: hx("#ffffff", 0.4),
                    flex: "0 0 auto",
                }}
            >
                {interest.members}{" "}
                {interest.members === 1 ? "tripulante" : "tripulantes"}
            </span>
            <button
                className="mi-btn"
                onClick={() => onSave(interest, { active: !interest.active })}
                title={
                    interest.active
                        ? "Activo (tocar para ocultar)"
                        : "Oculto (tocar para activar)"
                }
                style={{
                    color: interest.active ? GOLD : hx("#ffffff", 0.5),
                    flex: "0 0 auto",
                }}
            >
                {interest.active ? "Activo" : "Oculto"}
            </button>
            {confirmDel ? (
                <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
                    <button
                        className="mi-btn mi-btn-red"
                        onClick={() => onDelete(interest)}
                    >
                        ¿Borrar?
                    </button>
                    <button
                        className="mi-btn"
                        onClick={() => setConfirmDel(false)}
                    >
                        No
                    </button>
                </div>
            ) : (
                <button
                    className="mi-btn mi-btn-red"
                    onClick={() => setConfirmDel(true)}
                    title="Borrar interés"
                    style={{ flex: "0 0 auto" }}
                >
                    ✕
                </button>
            )}
        </div>
    )
}

/* ═══ MEDALLAS · editor de umbrales de las Constelaciones de Maestría ═══
   Cada Constelación tiene varios tiers (medallas) que se desbloquean al cruzar
   un umbral. Aquí se edita CUÁNTO se necesita por medalla + la etiqueta, y se
   activa/desactiva la constelación. Aplica al instante (el cliente lee con
   get_my_medals). Backend: admin_get_medallas / admin_upsert_medal_tier /
   admin_set_medal_constelacion (gateway admin-action). */
type MedalTier = {
    tier_index: number
    label: string
    label_en?: string
    threshold: number
}
type MedalConst = {
    key: string
    label: string
    label_en?: string
    subtitle: string
    subtitle_en?: string
    glyph: string
    metric: string
    accent: string
    active: boolean
    sort_order: number
    tiers: MedalTier[]
}
const METRIC_LABEL: Record<string, string> = {
    fotones: "Fotones de Maestría",
    racha: "Días de racha",
    dias_activos: "Días activos",
    rituales: "Rituales cumplidos",
    etapa: "Etapa del avatar (1–7)",
}

function MedallasEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [items, setItems] = useState<MedalConst[]>([])
    const [lang, setLang] = useState<Lang>("es")
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState<string | null>(null)
    const [toast, setToast] = useState("")
    // Reseteador QA: borra los desbloqueos de un Tripulante por correo.
    const [resetEmail, setResetEmail] = useState("")
    const [resetKey, setResetKey] = useState("all")
    const [resetting, setResetting] = useState(false)
    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 2400)
    }
    const doReset = async () => {
        const em = resetEmail.trim()
        if (!em) {
            flash("Escribe un correo")
            return
        }
        setResetting(true)
        const res = await adminAction(url, apiKey, "admin_reset_user_medals", {
            p_target_email: em,
            p_constelacion_key: resetKey,
        })
        setResetting(false)
        if (!res || res.error) {
            flash(
                res?.error === "user_not_found"
                    ? "No existe ese correo"
                    : res?.error === "no_constelacion_key"
                      ? "Constelación inválida"
                      : "No se pudo resetear"
            )
        } else {
            flash(`Reseteadas ${res.deleted_count} medalla(s) de ${res.email}`)
        }
    }

    /* 🜂 Una vez por visita; toda escritura olvida (guardado optimista).
       El reseteador de QA NO toca el catálogo (borra desbloqueos de una
       cuenta), así que no invalida nada de acá. */
    const CLAVE = "admin_get_medallas"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setItems(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const saveTier = async (
        c: MedalConst,
        t: MedalTier,
        patch: Partial<MedalTier>
    ) => {
        const next = { ...t, ...patch }
        setItems((prev) =>
            prev.map((x) =>
                x.key === c.key
                    ? {
                          ...x,
                          tiers: x.tiers.map((y) =>
                              y.tier_index === t.tier_index ? next : y
                          ),
                      }
                    : x
            )
        )
        const params: Record<string, any> = {
            p_constelacion_key: c.key,
            p_tier_index: t.tier_index,
            p_label: next.label,
            p_threshold: next.threshold,
        }
        if (lang === "en") {
            params.p_label_en = next.label_en ?? ""
            params.p_lang = "en"
        }
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_medal_tier",
            params
        )
        olvidar()
        if (!res || res.error) flash("No se pudo guardar")
    }

    const saveConstelacion = async (
        c: MedalConst,
        patch: Partial<MedalConst>
    ) => {
        const next = { ...c, ...patch }
        setItems((prev) => prev.map((x) => (x.key === c.key ? next : x)))
        const params: Record<string, any> = {
            p_constelacion_key: c.key,
            p_label: next.label,
            p_subtitle: next.subtitle,
            p_active: next.active,
        }
        if (lang === "en") {
            params.p_label_en = next.label_en ?? ""
            params.p_subtitle_en = next.subtitle_en ?? ""
            params.p_lang = "en"
        }
        const res = await adminAction(
            url,
            apiKey,
            "admin_set_medal_constelacion",
            params
        )
        olvidar()
        if (!res || res.error) flash("No se pudo guardar")
    }

    const toggleActive = async (c: MedalConst) => {
        const active = !c.active
        setItems((prev) =>
            prev.map((x) => (x.key === c.key ? { ...x, active } : x))
        )
        await adminAction(url, apiKey, "admin_set_medal_constelacion", {
            p_constelacion_key: c.key,
            p_label: c.label,
            p_subtitle: c.subtitle,
            p_active: active,
        })
        olvidar()
        flash(active ? "Constelación activa" : "Constelación oculta")
    }

    if (loading)
        return (
            <p style={{ color: hx("#ffffff", 0.5), fontSize: 13 }}>Cargando…</p>
        )

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 6,
                }}
            >
                <h2 style={{ margin: 0 }}>Constelaciones de Maestría</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LangToggle lang={lang} onChange={setLang} />
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                </div>
            </div>
            <p
                style={{
                    fontSize: 13,
                    color: hx("#ffffff", 0.6),
                    marginBottom: 18,
                    lineHeight: 1.55,
                    maxWidth: 640,
                }}
            >
                Ajusta cuánto se necesita para cada medalla. Toca una
                constelación para abrir sus tiers; cambia el umbral o el nombre
                y se guarda al instante. Las medallas ya desbloqueadas por un
                Tripulante NO se pierden si subes un umbral.
            </p>

            {/* ── Reseteador QA: borra los desbloqueos de un Tripulante ── */}
            <div
                className="mi-card"
                style={{
                    maxWidth: 640,
                    marginBottom: 20,
                    border: `1px solid ${hx("#ff5b5b", 0.3)}`,
                    background: hx("#ff5b5b", 0.04),
                }}
            >
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#ff9b9b",
                        marginBottom: 4,
                    }}
                >
                    Resetear medallas (pruebas)
                </div>
                <p
                    style={{
                        fontSize: 12,
                        color: hx("#ffffff", 0.5),
                        marginBottom: 12,
                        lineHeight: 1.5,
                    }}
                >
                    Borra los desbloqueos de un Tripulante para volver a probar.
                    Después del reset, la medalla se re-evalúa contra sus
                    métricas actuales (baja primero sus Fotones / etapa de
                    avatar para que no se vuelva a desbloquear).
                </p>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <input
                        className="mi-input"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="correo@del.tripulante"
                        style={{ flex: "1 1 200px", minWidth: 160 }}
                    />
                    <select
                        className="mi-input"
                        value={resetKey}
                        onChange={(e) => setResetKey(e.target.value)}
                        style={{ flex: "0 0 auto" }}
                    >
                        <option value="all">Todas las constelaciones</option>
                        {items.map((c) => (
                            <option key={c.key} value={c.key}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    <button
                        className="mi-btn-red mi-btn"
                        onClick={doReset}
                        disabled={resetting}
                    >
                        {resetting ? "Reseteando…" : "Resetear"}
                    </button>
                </div>
            </div>

            {items.map((c) => {
                const isOpen = open === c.key
                return (
                    <div
                        key={c.key}
                        className="mi-card"
                        style={{ opacity: c.active ? 1 : 0.55, maxWidth: 640 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                cursor: "pointer",
                            }}
                            onClick={() => setOpen(isOpen ? null : c.key)}
                        >
                            <div
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    flexShrink: 0,
                                    background: hx(c.accent || AC, 0.16),
                                    border: `1px solid ${hx(c.accent || AC, 0.4)}`,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#fff",
                                    }}
                                >
                                    {lang === "en"
                                        ? c.label_en || c.label
                                        : c.label}
                                </p>
                                <p
                                    style={{
                                        margin: "2px 0 0",
                                        fontSize: 11.5,
                                        color: hx("#ffffff", 0.5),
                                    }}
                                >
                                    {METRIC_LABEL[c.metric] || c.metric} ·{" "}
                                    {c.tiers.length} medallas
                                </p>
                            </div>
                            <button
                                className={`mi-btn ${c.active ? "" : "mi-btn-gold"}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleActive(c)
                                }}
                                style={{ flexShrink: 0 }}
                            >
                                {c.active ? "Activa" : "Oculta"}
                            </button>
                            <span
                                style={{
                                    color: hx("#ffffff", 0.4),
                                    fontSize: 16,
                                    transform: isOpen
                                        ? "rotate(90deg)"
                                        : "none",
                                    transition: "transform 0.2s",
                                }}
                            >
                                ›
                            </span>
                        </div>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div style={{ paddingTop: 14 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                                paddingBottom: 12,
                                            }}
                                        >
                                            <input
                                                key={"cl-" + lang}
                                                className="mi-input"
                                                defaultValue={
                                                    lang === "en"
                                                        ? c.label_en || ""
                                                        : c.label
                                                }
                                                placeholder={
                                                    lang === "en"
                                                        ? "Constellation name (EN)…"
                                                        : "Nombre de la constelación…"
                                                }
                                                onBlur={(e) => {
                                                    const v =
                                                        e.target.value.trim()
                                                    if (lang === "en") {
                                                        if (
                                                            v !==
                                                            (c.label_en || "")
                                                        )
                                                            saveConstelacion(
                                                                c,
                                                                { label_en: v }
                                                            )
                                                    } else if (
                                                        v &&
                                                        v !== c.label
                                                    ) {
                                                        saveConstelacion(c, {
                                                            label: v,
                                                        })
                                                    }
                                                }}
                                                style={{
                                                    fontWeight: 600,
                                                    color: "#fff",
                                                    fontSize: 13,
                                                }}
                                            />
                                            <input
                                                key={"cs-" + lang}
                                                className="mi-input"
                                                defaultValue={
                                                    lang === "en"
                                                        ? c.subtitle_en || ""
                                                        : c.subtitle
                                                }
                                                placeholder={
                                                    lang === "en"
                                                        ? "Subtitle (EN)…"
                                                        : "Subtítulo…"
                                                }
                                                onBlur={(e) => {
                                                    const v =
                                                        e.target.value.trim()
                                                    if (lang === "en") {
                                                        if (
                                                            v !==
                                                            (c.subtitle_en ||
                                                                "")
                                                        )
                                                            saveConstelacion(
                                                                c,
                                                                {
                                                                    subtitle_en:
                                                                        v,
                                                                }
                                                            )
                                                    } else if (
                                                        v !== (c.subtitle || "")
                                                    ) {
                                                        saveConstelacion(c, {
                                                            subtitle: v,
                                                        })
                                                    }
                                                }}
                                                style={{
                                                    color: hx("#ffffff", 0.7),
                                                    fontSize: 12,
                                                }}
                                            />
                                        </div>
                                        {c.tiers.map((t) => (
                                            <div
                                                key={t.tier_index}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    padding: "7px 0",
                                                    borderTop: `1px solid ${hx("#ffffff", 0.07)}`,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 18,
                                                        fontSize: 11,
                                                        color: hx(
                                                            c.accent || AC,
                                                            0.8
                                                        ),
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {t.tier_index}
                                                </span>
                                                <input
                                                    key={lang}
                                                    className="mi-input"
                                                    defaultValue={
                                                        lang === "en"
                                                            ? t.label_en || ""
                                                            : t.label
                                                    }
                                                    placeholder={
                                                        lang === "en"
                                                            ? "Tier label (EN)…"
                                                            : undefined
                                                    }
                                                    onBlur={(e) => {
                                                        const v =
                                                            e.target.value.trim()
                                                        if (lang === "en") {
                                                            if (
                                                                v !==
                                                                (t.label_en ||
                                                                    "")
                                                            )
                                                                saveTier(c, t, {
                                                                    label_en: v,
                                                                })
                                                        } else if (
                                                            v &&
                                                            v !== t.label
                                                        ) {
                                                            saveTier(c, t, {
                                                                label: v,
                                                            })
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        fontSize: 12,
                                                        padding: "5px 9px",
                                                    }}
                                                />
                                                <ScoreInput
                                                    value={t.threshold}
                                                    min={0}
                                                    max={1000000}
                                                    onCommit={(n) => {
                                                        if (n !== t.threshold)
                                                            saveTier(c, t, {
                                                                threshold: n,
                                                            })
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══ MODERACIÓN · cola de reportes de la Comunidad ═══
   Lista los reportes pendientes (quién reportó a quién, motivo, nota, cuántas
   veces lo han reportado/bloqueado) y permite banear, marcar revisado o
   descartar. Backend: admin_get_moderation_queue / admin_resolve_report /
   admin_ban_community_user / admin_unban_community_user (gateway admin-action). */
const REASON_LABEL: Record<string, string> = {
    acoso: "Acoso o amenazas",
    spam: "Spam o estafa",
    sexual: "Contenido sexual",
    odio: "Discurso de odio",
    suplantacion: "Suplantación de identidad",
    otro: "Otro",
}

function ModeracionPanel({ url, apiKey }: { url: string; apiKey: string }) {
    const [data, setData] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string>("")
    const [toast, setToast] = useState("")
    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 2000)
    }

    /* 🜂 Una vez por visita. Este panel NO es optimista: resolver o banear
       relee la cola entera, así que esas relecturas piden `load(true)` — con
       `load()` volverían a pintar el reporte que se acaba de resolver. */
    const CLAVE = "admin_get_moderation_queue"

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setData(res && typeof res === "object" ? res : null)
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const resolve = async (id: number, status: string, action: string) => {
        setBusy(`r${id}`)
        await adminAction(url, apiKey, "admin_resolve_report", {
            p_report_id: id,
            p_status: status,
            p_action: action,
        })
        setBusy("")
        flash(status === "descartado" ? "Descartado" : "Marcado revisado")
        void load(true)
    }

    const ban = async (id: number, targetId: string) => {
        setBusy(`b${id}`)
        await adminAction(url, apiKey, "admin_ban_community_user", {
            p_target_clerk_id: targetId,
            p_reason: "moderación",
        })
        await adminAction(url, apiKey, "admin_resolve_report", {
            p_report_id: id,
            p_status: "revisado",
            p_action: "baneado",
        })
        setBusy("")
        flash("Baneado de la Comunidad")
        void load(true)
    }

    if (loading)
        return (
            <p style={{ color: hx("#ffffff", 0.5), fontSize: 13 }}>Cargando…</p>
        )

    const pending: any[] = data?.pending || []
    const stats = data?.stats || { pending_count: 0, banned_count: 0 }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 6,
                    maxWidth: 640,
                }}
            >
                <h2 style={{ margin: 0 }}>Moderación de la Comunidad</h2>
                <BtnRecargar
                    onClick={() => void load(true)}
                    disabled={loading}
                />
            </div>
            <p
                style={{
                    fontSize: 13,
                    color: hx("#ffffff", 0.6),
                    marginBottom: 16,
                    lineHeight: 1.55,
                    maxWidth: 640,
                }}
            >
                Reportes de Tripulantes. {stats.pending_count} pendiente
                {stats.pending_count === 1 ? "" : "s"} · {stats.banned_count}{" "}
                baneado{stats.banned_count === 1 ? "" : "s"}. Banear saca a la
                persona de la Constelación (no aparece, no puede escribir,
                perfil privado).
            </p>

            {pending.length === 0 ? (
                <div
                    className="mi-card"
                    style={{ maxWidth: 640, textAlign: "center" }}
                >
                    <p
                        style={{
                            color: hx("#ffffff", 0.55),
                            fontSize: 13,
                            margin: 0,
                        }}
                    >
                        Sin reportes pendientes. Todo en calma.
                    </p>
                </div>
            ) : (
                pending.map((r) => (
                    <div
                        key={r.id}
                        className="mi-card"
                        style={{ maxWidth: 640 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#ff8a8a",
                                    border: "1px solid rgba(255,120,120,0.3)",
                                    borderRadius: 6,
                                    padding: "3px 8px",
                                }}
                            >
                                {REASON_LABEL[r.reason] || r.reason}
                            </span>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: hx("#ffffff", 0.5),
                                }}
                            >
                                {r.context === "mensaje"
                                    ? "desde el chat"
                                    : "desde un perfil"}
                            </span>
                            {r.banned && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: GOLD,
                                        fontWeight: 700,
                                    }}
                                >
                                    ya baneado
                                </span>
                            )}
                        </div>

                        <p
                            style={{
                                margin: "10px 0 0",
                                fontSize: 13.5,
                                color: "#fff",
                            }}
                        >
                            <strong>{r.reported_alias || "(sin alias)"}</strong>
                            <span style={{ color: hx("#ffffff", 0.45) }}>
                                {" "}
                                · {r.reported_email || r.reported_clerk_id}
                            </span>
                        </p>
                        <p
                            style={{
                                margin: "3px 0 0",
                                fontSize: 11.5,
                                color: hx("#ffffff", 0.45),
                            }}
                        >
                            reportado por{" "}
                            {r.reporter_alias || r.reporter_email || "—"}
                            {" · "}
                            {r.report_count} reporte
                            {r.report_count === 1 ? "" : "s"} · {r.block_count}{" "}
                            bloqueo{r.block_count === 1 ? "" : "s"}
                        </p>
                        {r.note ? (
                            <p
                                style={{
                                    margin: "9px 0 0",
                                    fontSize: 13,
                                    color: hx("#ffffff", 0.75),
                                    background: hx("#ffffff", 0.04),
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    lineHeight: 1.5,
                                }}
                            >
                                “{r.note}”
                            </p>
                        ) : null}

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {!r.banned && (
                                <button
                                    className="mi-btn mi-btn-red"
                                    disabled={busy === `b${r.id}`}
                                    onClick={() =>
                                        ban(r.id, r.reported_clerk_id)
                                    }
                                >
                                    {busy === `b${r.id}` ? "…" : "Banear"}
                                </button>
                            )}
                            <button
                                className="mi-btn"
                                disabled={busy === `r${r.id}`}
                                onClick={() =>
                                    resolve(r.id, "revisado", "revisado")
                                }
                            >
                                Marcar revisado
                            </button>
                            <button
                                className="mi-btn"
                                disabled={busy === `r${r.id}`}
                                onClick={() =>
                                    resolve(r.id, "descartado", "descartado")
                                }
                                style={{ opacity: 0.7 }}
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                ))
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="mi-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════
// STICKERS de Mensajería (Parte 3) — paquetes de marca DB-driven.
// CRUD de paquetes + stickers vía admin-action; el arte se sube por el edge
// upload-sticker. Los paquetes premium se desbloquean con Sintonía/Inmersión.
// ════════════════════════════════════════════════════════════════════
type AdminSticker = {
    id: number
    url: string
    animated?: boolean
    is_active?: boolean
    sort_order?: number
    pack_id?: number
}
type AdminStickerPack = {
    id: number
    name: string
    description?: string | null
    is_premium: boolean
    is_active: boolean
    sort_order: number
    cover_url?: string | null
    stickers: AdminSticker[]
}

function StickersHub({ url, apiKey }: { url: string; apiKey: string }) {
    const [packs, setPacks] = useState<AdminStickerPack[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [uploadingPack, setUploadingPack] = useState<number | null>(null)
    const [toast, setToast] = useState("")
    const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1800)
    }

    /* 🜂 Una vez por visita; toda escritura olvida (guardado optimista).
       Los stickers viven DENTRO de la misma lectura que los paquetes, así que
       subir o borrar un sticker también la invalida. */
    const CLAVE = "admin_get_sticker_packs"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setPacks(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const addPack = async () => {
        setBusy(true)
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_sticker_pack",
            {
                p_id: null,
                p_name: "Nuevo paquete",
                p_description: "",
                p_is_premium: false,
                p_is_active: true,
                p_sort_order:
                    Math.max(0, ...packs.map((p) => p.sort_order)) + 1,
            }
        )
        setBusy(false)
        olvidar()
        if (res && res.id) {
            setPacks((prev) => [...prev, { ...res, stickers: [] }])
            flash("Paquete creado")
        } else flash("No se pudo crear")
    }

    const savePack = async (
        p: AdminStickerPack,
        patch: Partial<AdminStickerPack>
    ) => {
        const next = { ...p, ...patch }
        setPacks((prev) => prev.map((x) => (x.id === p.id ? next : x)))
        await adminAction(url, apiKey, "admin_upsert_sticker_pack", {
            p_id: p.id,
            p_name: next.name,
            p_description: next.description ?? "",
            p_is_premium: next.is_premium,
            p_is_active: next.is_active,
            p_sort_order: next.sort_order,
        })
        olvidar()
    }

    const deletePack = async (p: AdminStickerPack) => {
        if (
            !window.confirm(
                `¿Borrar el paquete "${p.name}" y todos sus stickers?`
            )
        )
            return
        setPacks((prev) => prev.filter((x) => x.id !== p.id))
        await adminAction(url, apiKey, "admin_delete_sticker_pack", {
            p_id: p.id,
        })
        olvidar()
        flash("Paquete eliminado")
    }

    const onPickSticker = async (
        p: AdminStickerPack,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0]
        if (e.target) e.target.value = "" // permite re-subir el mismo archivo
        if (!file) return
        if (file.size > 2_000_000) {
            flash("La imagen pesa más de 2 MB")
            return
        }
        setUploadingPack(p.id)
        try {
            const dataUrl = await new Promise<string>((res, rej) => {
                const r = new FileReader()
                r.onload = () => res(r.result as string)
                r.onerror = () => rej(r.error)
                r.readAsDataURL(file)
            })
            const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "")
            const mime = file.type || "image/webp"
            // No reprocesamos el byte (preserva el WebP/GIF animado).
            const animated = mime === "image/gif"
            const token = await (window as any).Clerk?.session?.getToken?.()
            if (!token) {
                flash("Sesión no válida")
                setUploadingPack(null)
                return
            }
            const r = await fetch(`${url}/functions/v1/upload-sticker`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: apiKey,
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    token,
                    image_base64: base64,
                    image_mime: mime,
                }),
            })
            const out = r.ok ? await r.json() : null
            if (out && out.success && out.url) {
                const added = await adminAction(
                    url,
                    apiKey,
                    "admin_add_sticker",
                    {
                        p_pack_id: p.id,
                        p_image_url: out.url,
                        p_is_animated: animated,
                        p_sort_order:
                            Math.max(
                                0,
                                ...p.stickers.map((s) => s.sort_order ?? 0)
                            ) + 1,
                    }
                )
                olvidar()
                if (added && added.id) {
                    setPacks((prev) =>
                        prev.map((x) =>
                            x.id === p.id
                                ? { ...x, stickers: [...x.stickers, added] }
                                : x
                        )
                    )
                    flash("Sticker agregado")
                } else flash("No se pudo guardar")
            } else flash("No se pudo subir")
        } catch {
            flash("Error al procesar la imagen")
        }
        setUploadingPack(null)
    }

    const deleteSticker = async (p: AdminStickerPack, s: AdminSticker) => {
        setPacks((prev) =>
            prev.map((x) =>
                x.id === p.id
                    ? {
                          ...x,
                          stickers: x.stickers.filter((y) => y.id !== s.id),
                      }
                    : x
            )
        )
        await adminAction(url, apiKey, "admin_delete_sticker", { p_id: s.id })
        olvidar()
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Stickers de Mensajería
                    </p>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: hx("#ffffff", 0.5),
                        }}
                    >
                        {packs.length} paquete{packs.length === 1 ? "" : "s"} ·
                        WebP / PNG / GIF (animados OK)
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                    <button
                        className="mi-btn mi-btn-gold"
                        onClick={addPack}
                        disabled={busy}
                    >
                        + Nuevo paquete
                    </button>
                </div>
            </div>

            <p
                style={{
                    margin: "0 0 16px",
                    fontSize: 11,
                    color: hx(GOLD, 0.7),
                    fontStyle: "italic",
                }}
            >
                Los paquetes marcados como Premium se desbloquean con Sintonía
                Solar; los demás son gratis para todos.
            </p>

            {loading ? (
                <p style={{ color: hx("#ffffff", 0.5), fontSize: 12 }}>
                    Cargando…
                </p>
            ) : packs.length === 0 ? (
                <p style={{ color: hx("#ffffff", 0.5), fontSize: 12 }}>
                    Aún no hay paquetes. Crea el primero.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}
                >
                    {packs.map((p) => (
                        <div className="mi-card" key={p.id}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 10,
                                }}
                            >
                                <input
                                    className="mi-input"
                                    defaultValue={p.name}
                                    onBlur={(e) =>
                                        e.target.value.trim() !== p.name &&
                                        savePack(p, {
                                            name: e.target.value.trim(),
                                        })
                                    }
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="mi-btn"
                                    onClick={() =>
                                        savePack(p, {
                                            is_premium: !p.is_premium,
                                        })
                                    }
                                    style={{
                                        background: p.is_premium
                                            ? hx(GOLD, 0.18)
                                            : "rgba(255,255,255,0.06)",
                                        color: p.is_premium
                                            ? GOLD
                                            : hx("#ffffff", 0.6),
                                    }}
                                >
                                    {p.is_premium ? "◆ Premium" : "Gratis"}
                                </button>
                                <button
                                    className="mi-btn"
                                    onClick={() =>
                                        savePack(p, { is_active: !p.is_active })
                                    }
                                    style={{
                                        background: p.is_active
                                            ? "rgba(54,201,224,0.16)"
                                            : "rgba(255,255,255,0.06)",
                                        color: p.is_active
                                            ? "#36C9E0"
                                            : hx("#ffffff", 0.5),
                                    }}
                                >
                                    {p.is_active ? "Activo" : "Oculto"}
                                </button>
                                <button
                                    className="mi-btn"
                                    onClick={() => deletePack(p)}
                                    style={{ color: "#FF6B6B" }}
                                >
                                    Borrar
                                </button>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(72px, 1fr))",
                                    gap: 8,
                                }}
                            >
                                {p.stickers.map((s) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            position: "relative",
                                            aspectRatio: "1 / 1",
                                            borderRadius: 10,
                                            background:
                                                "rgba(255,255,255,0.04)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: 6,
                                        }}
                                    >
                                        <img
                                            src={s.url}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                            }}
                                        />
                                        <button
                                            onClick={() => deleteSticker(p, s)}
                                            aria-label="Borrar sticker"
                                            style={{
                                                position: "absolute",
                                                top: 2,
                                                right: 2,
                                                width: 20,
                                                height: 20,
                                                borderRadius: "50%",
                                                border: "none",
                                                background: "rgba(0,0,0,0.6)",
                                                color: "#fff",
                                                fontSize: 12,
                                                cursor: "pointer",
                                                lineHeight: 1,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() =>
                                        fileRefs.current[p.id]?.click()
                                    }
                                    disabled={uploadingPack === p.id}
                                    style={{
                                        aspectRatio: "1 / 1",
                                        borderRadius: 10,
                                        border: `1px dashed ${hx(GOLD, 0.4)}`,
                                        background: "rgba(212,168,67,0.06)",
                                        color: hx(GOLD, 0.85),
                                        fontSize: 11,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textAlign: "center",
                                        padding: 4,
                                    }}
                                >
                                    {uploadingPack === p.id
                                        ? "Subiendo…"
                                        : "+ Sticker"}
                                </button>
                                <input
                                    ref={(el) => {
                                        fileRefs.current[p.id] = el
                                    }}
                                    type="file"
                                    accept="image/webp,image/png,image/gif"
                                    onChange={(e) => onPickSticker(p, e)}
                                    style={{ display: "none" }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(8,12,24,0.94)",
                        border: `1px solid ${hx(GOLD, 0.4)}`,
                        color: "#fff",
                        padding: "10px 18px",
                        borderRadius: 12,
                        fontSize: 13,
                        zIndex: 9999,
                    }}
                >
                    {toast}
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════
   BuzonEditor — "Tu voz construye el Escáner" (Motor → Buzón).
   Lee las ideas/mejoras que mandan los Tripulantes desde Mi Núcleo →
   Ajustes → "Tu voz" (tabla app_feedback, vía admin_get_app_feedback por
   el gateway admin-action). Solo lectura. Si el Tripulante marcó
   "anónimo", el server guarda clerk_user_id = NULL → aquí no hay nombre.
   ════════════════════════════════════════════════════════════════════ */
type FeedbackRow = {
    id: string
    message: string
    anonymous: boolean
    status: string
    created_at: string | null
    clerk_user_id: string | null
    full_name: string | null
}

function BuzonEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [rows, setRows] = useState<FeedbackRow[]>([])
    const [loading, setLoading] = useState(true)

    const load = async (force = false) => {
        setLoading(true)
        try {
            const res = await adminActionCached(
                url,
                apiKey,
                "admin_get_app_feedback",
                {},
                { force }
            )
            setRows(Array.isArray(res) ? (res as FeedbackRow[]) : [])
        } catch {
            // Aún sin gateway/SQL desplegado → no colgar el panel; lista vacía.
            setRows([])
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const fmtDate = (s: string | null) => {
        if (!s) return "—"
        try {
            return new Date(s).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return "—"
        }
    }

    return (
        <div>
            <div
                className="mi-card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    padding: 14,
                    marginBottom: 16,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: hx("#ffffff", 0.45),
                        }}
                    >
                        Ideas recibidas
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: GOLD }}>
                        {rows.length}
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                <button className="mi-btn" onClick={() => void load(true)}>
                    ↻ Recargar
                </button>
            </div>

            {loading ? (
                <p className="mi-muted" style={{ color: hx("#ffffff", 0.45) }}>
                    Cargando ideas…
                </p>
            ) : rows.length === 0 ? (
                <p
                    style={{
                        color: hx("#ffffff", 0.45),
                        fontSize: 13,
                        lineHeight: 1.6,
                    }}
                >
                    Todavía no hay ideas. Aparecen aquí cuando un Tripulante
                    escribe desde Mi Núcleo → Ajustes → “Tu voz construye el
                    Escáner”.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {rows.map((r) => (
                        <div
                            key={r.id}
                            className="mi-card"
                            style={{ padding: 14 }}
                        >
                            <div
                                style={{
                                    fontSize: 14,
                                    lineHeight: 1.55,
                                    color: "#fff",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {r.message}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginTop: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        color: r.anonymous
                                            ? hx("#ffffff", 0.4)
                                            : hx(AC, 0.9),
                                    }}
                                >
                                    {r.anonymous
                                        ? "Anónimo"
                                        : r.full_name || "Tripulante"}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: hx("#ffffff", 0.35),
                                    }}
                                >
                                    · {fmtDate(r.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════
   VersionesEditor — "App" (Motor → App).
   Fija la última versión de la app + el mensaje + el link de la App Store.
   La app lee get_app_release al arrancar y, si corre una versión anterior,
   muestra una tarjeta para actualizar. Guarda vía admin_set_app_release.
   ════════════════════════════════════════════════════════════════════ */
// Link real de la ficha en la App Store. Ya vive hardcodeado en el cliente
// (UpdatePrompt); se envía para que get_app_release lo tenga sin que el admin
// tenga que escribirlo a mano (el campo del panel se quitó por pedido de Zak).
const APPSTORE_LINK = "https://apps.apple.com/app/id6774143866"

/* 🜂 Desde qué versión de la app funciona cada cosa. Vive en el código del
   TELÉFONO, así que un aparato con una versión anterior ni se entera de que
   existe. Sin este dato a la vista, el panel da una sensación de cobertura
   que no es real. Se suben a mano si algún día se rehacen. */
const AVISO_DESDE = "1.0.6"
const BLOQUEO_DESDE = "1.1.4"

function VersionesEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [latest, setLatest] = useState("")
    /* 🜂 v1.33 — número propio de Google Play (Zak, 2026-08-05): Play publica
       en una hora y Apple puede tardar un día. Vacío = Android va con el
       número de la App Store, que es como funcionaba hasta hoy. */
    const [latestAnd, setLatestAnd] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState("")
    /* v1.29 — confirmación inline del botón "Publicar siguiente versión". */
    const [confirmNext, setConfirmNext] = useState(false)

    /* 🜂 Una vez por visita. Publicar una versión olvida, y como el panel de
       bloqueo de emergencia lee LO MISMO, los dos comparten la consulta. */
    const CLAVE = "rpc:get_app_release"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        try {
            const r = await rpcCached(
                url,
                apiKey,
                "get_app_release",
                {},
                { force }
            )
            const d = Array.isArray(r) ? r[0] : r
            if (d && typeof d === "object") {
                setLatest(d.latest_version || "")
                setLatestAnd(d.latest_version_android || "")
                setMessage(d.message || "")
            }
        } catch {
            /* sin datos aún */
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    /* Siguiente versión de la circulación actual (sube el último segmento). */
    const bumpPatch = (v: string): string => {
        const p = String(v || "")
            .split(".")
            .map((n) => parseInt(n, 10) || 0)
        while (p.length < 3) p.push(0)
        p[p.length - 1] += 1
        return p.join(".")
    }
    const nextVersion = bumpPatch(latest.trim() || "0.0.0")

    /* v1.29 — p_force SIEMPRE false: el modo insistente bloqueaba la app
       (modal sin cierre). El aviso nuevo siempre se puede posponer; el
       recordatorio vive en la tarjeta verde del Núcleo hasta que actualicen. */
    const saveVersion = async (v: string, vAnd?: string) => {
        setSaving(true)
        try {
            await adminAction(url, apiKey, "admin_set_app_release", {
                p_latest_version: v,
                p_latest_version_android: vAnd ?? latestAnd.trim(),
                p_message: message.trim(),
                p_store_url: APPSTORE_LINK,
                p_force: false,
            })
            /* 🜂 Publicar cambia lo que leen el badge de versión, la bitácora
               de avisos y el panel de bloqueo. Se olvidan las tres familias. */
            olvidar()
            motorCacheClear("admin_get_app_release_log")
            motorCacheClear("get_app_version_summary")
            setLatest(v)
            setToast("Guardado")
            setTimeout(() => setToast(""), 1800)
        } catch {
            setToast("Error al guardar")
            setTimeout(() => setToast(""), 2200)
        } finally {
            setSaving(false)
        }
    }
    const save = () => saveVersion(latest.trim())

    const lbl: any = {
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: hx("#ffffff", 0.5),
        marginBottom: 6,
        display: "block",
    }

    /* 🜂 v1.33 — LA EXPLICACIÓN VA AL COSTADO (Zak): ocupaba una franja
       entera arriba y empujaba los campos fuera de pantalla. En pantalla
       ancha vive en una columna a la derecha; en angosta vuelve a apilarse
       sola (flex-wrap), sin media queries. */
    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                gap: 14,
                maxWidth: 940,
            }}
        >
            <div style={{ flex: "1 1 340px", minWidth: 0 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: 10,
                    }}
                >
                    <BtnRecargar
                        onClick={() => void load(true)}
                        disabled={loading}
                    />
                </div>
                {loading ? (
                    <p
                        className="mi-muted"
                        style={{ color: hx("#ffffff", 0.45) }}
                    >
                        Cargando…
                    </p>
                ) : (
                    <div
                        className="mi-card"
                        style={{
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        <div>
                            <label style={lbl}>
                                Versión viva en la App Store · iPhone (ej.
                                1.0.6)
                            </label>
                            <input
                                className="mi-input"
                                value={latest}
                                onChange={(e) => setLatest(e.target.value)}
                                placeholder="1.0.6"
                            />
                        </div>
                        <div>
                            <label style={lbl}>
                                Versión viva en Google Play · Android
                            </label>
                            <input
                                className="mi-input"
                                value={latestAnd}
                                onChange={(e) => setLatestAnd(e.target.value)}
                                placeholder="déjalo vacío para usar la de iPhone"
                            />
                            <p
                                style={{
                                    margin: "6px 0 0",
                                    fontSize: 11.5,
                                    lineHeight: 1.55,
                                    color: hx("#ffffff", 0.42),
                                }}
                            >
                                Play publica en ~1 hora y Apple puede tardar 1
                                día. Con su propio número, cada tienda avisa
                                apenas su versión está disponible. Vacío =
                                Android sigue el número de iPhone.
                            </p>
                        </div>
                        <div>
                            <label style={lbl}>Mensaje del aviso</label>
                            <textarea
                                className="mi-input"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                placeholder="Hay una nueva versión con mejoras…"
                                style={{ resize: "vertical" }}
                            />
                        </div>
                        <button
                            className="mi-btn"
                            onClick={save}
                            disabled={saving}
                            style={{ color: hx("#ffffff", 0.75) }}
                        >
                            {saving
                                ? "Guardando…"
                                : "Guardar mensaje / versión manual"}
                        </button>

                        {/* v1.29 — PUBLICAR EN UN BOTÓN: calcula la siguiente
                        versión y pide confirmación antes de activar el aviso. */}
                        {!confirmNext ? (
                            <button
                                className="mi-btn"
                                onClick={() => setConfirmNext(true)}
                                disabled={saving || !latest.trim()}
                                style={{
                                    color: GOLD,
                                    border: `1px solid ${hx(GOLD, 0.5)}`,
                                    background: hx(GOLD, 0.1),
                                    fontWeight: 700,
                                }}
                            >
                                Publicar siguiente versión → {nextVersion}
                            </button>
                        ) : (
                            <div
                                style={{
                                    borderRadius: 14,
                                    border: `1px solid ${hx(GOLD, 0.45)}`,
                                    background: hx(GOLD, 0.07),
                                    padding: "14px 14px 12px",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 12px",
                                        fontSize: 12.5,
                                        lineHeight: 1.6,
                                        color: hx("#ffffff", 0.85),
                                    }}
                                >
                                    La versión en circulación pasará de{" "}
                                    <b>{latest.trim() || "—"}</b> a{" "}
                                    <b style={{ color: GOLD }}>{nextVersion}</b>
                                    . Todos los nodos en versiones anteriores
                                    verán el aviso para actualizar (cerrable,
                                    con tarjeta verde en su Núcleo hasta que
                                    actualicen). La Versión en proceso del badge
                                    pasará a <b>{bumpPatch(nextVersion)}</b>.
                                </p>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button
                                        className="mi-btn"
                                        onClick={() => setConfirmNext(false)}
                                        disabled={saving}
                                        style={{
                                            flex: 1,
                                            color: hx("#ffffff", 0.7),
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="mi-btn"
                                        onClick={async () => {
                                            await saveVersion(nextVersion)
                                            setConfirmNext(false)
                                        }}
                                        disabled={saving}
                                        style={{
                                            flex: 1,
                                            color: "#04121a",
                                            background: GOLD,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {saving
                                            ? "Publicando…"
                                            : "Confirmar publicación"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {toast && (
                    <p style={{ marginTop: 12, color: GOLD, fontSize: 13 }}>
                        {toast}
                    </p>
                )}
            </div>

            {/* Columna de la derecha: qué es esto y desde qué versión obedece. */}
            <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                <div className="mi-card" style={{ padding: 16 }}>
                    <p
                        style={{
                            fontSize: 12.5,
                            lineHeight: 1.6,
                            color: hx("#ffffff", 0.7),
                            margin: 0,
                        }}
                    >
                        Estas son las versiones <b>en circulación</b>: las que
                        ya quedaron publicadas y vivas en cada tienda. Cuando un
                        build nuevo se apruebe y salga, tócale{" "}
                        <b>Publicar siguiente versión</b> (con confirmación).
                        Quien corra una versión anterior verá el aviso para
                        actualizar, siempre CERRABLE (nunca bloquea la app), y a
                        quien pospone le queda una tarjeta verde en su Núcleo
                        más un 1 en el tab NÚCLEO hasta que actualiza. La{" "}
                        <b>Versión en proceso</b> del badge de arriba pasa sola
                        a la siguiente, no se toca aquí.
                    </p>
                </div>

                {/* 🜂 DESDE QUÉ VERSIÓN OBEDECE CADA COSA (Zak, 2026-08-05:
                    "los que tienen la 1.0.8 funciona? no vi dónde dice esa
                    info"). Ambas viven en el código del teléfono: un aparato
                    con una versión anterior ni sabe que existen. */}
                <div className="mi-card" style={{ padding: 16, marginTop: 14 }}>
                    <p
                        style={{
                            margin: "0 0 8px",
                            fontSize: 11,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: hx("#ffffff", 0.45),
                        }}
                    >
                        Desde qué versión obedece
                    </p>
                    <p
                        style={{
                            fontSize: 12.5,
                            lineHeight: 1.7,
                            color: hx("#ffffff", 0.7),
                            margin: 0,
                        }}
                    >
                        <b style={{ color: GOLD }}>Aviso de actualizar:</b>{" "}
                        {AVISO_DESDE} en adelante. Quien tenga menos que eso no
                        lo ve nunca, aunque publiques.
                        <br />
                        <b style={{ color: GOLD }}>
                            Bloqueo de emergencia:
                        </b>{" "}
                        {BLOQUEO_DESDE} en adelante. Las anteriores abren normal
                        aunque el freno esté activo.
                        <br />
                        <span style={{ color: hx("#ffffff", 0.45) }}>
                            Las dos viven en el código de la app, así que solo
                            llegan con un build nuevo.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

/* ──────────────────────────────────────────────────────────────────────
   EspejoEditor — "Espejo Vibracional" (Motor → Espejo). Lee las conversaciones
   recientes del Espejo, ANONIMIZADAS (alias por hash, sin email/nombre), para
   revisar las interacciones y afinar la calidad del asistente. Solo lectura.
   ────────────────────────────────────────────────────────────────────── */
// markdown-lite: **negrita** → <strong> (igual que en la app, para que no se
// vean los asteriscos en el panel).
function renderEspejoMd(text: string): any[] {
    const out: any[] = []
    const re = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*/g
    let last = 0
    let m: RegExpExecArray | null
    let k = 0
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index))
        out.push(
            <strong key={k++} style={{ color: "#FFF1CC", fontWeight: 700 }}>
                {m[1] || m[2]}
            </strong>
        )
        last = m.index + m[0].length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
}

interface OraMsg {
    role: string
    content: string
    created_at: string | null
}
interface OraConv {
    conv_id: string
    alias: string
    last_at: string | null
    messages: OraMsg[]
    msg_count: number
}

function EspejoEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [rows, setRows] = useState<OraConv[]>([])
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)

    /* 🜂 Se carga UNA vez por visita: ir a otra pestaña y volver ya no repite
       la consulta (MI_Shared v1.9). "Recargar" pide datos frescos. */
    const load = async (force = false) => {
        setLoading(true)
        try {
            const res = await adminActionCached(
                url,
                apiKey,
                "admin_get_oraculo_conversations",
                { p_limit: 60 },
                { force }
            )
            setRows(Array.isArray(res) ? (res as OraConv[]) : [])
        } catch {
            setRows([])
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const fmtDate = (s: string | null) => {
        if (!s) return "—"
        try {
            return new Date(s).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return "—"
        }
    }
    const firstUser = (c: OraConv) =>
        (c.messages.find((m) => m.role === "user")?.content || "—").slice(0, 90)

    return (
        <div>
            <div
                className="mi-card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    padding: 14,
                    marginBottom: 16,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: hx("#ffffff", 0.45),
                        }}
                    >
                        Conversaciones del Espejo
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: GOLD }}>
                        {rows.length}
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 12 }} />
                <div
                    style={{
                        fontSize: 11,
                        color: hx("#ffffff", 0.4),
                        maxWidth: 220,
                        lineHeight: 1.5,
                    }}
                >
                    Anonimizado: solo un alias por nodo, sin correo ni nombre.
                </div>
                <button className="mi-btn" onClick={() => void load(true)}>
                    ↻ Recargar
                </button>
            </div>

            {loading ? (
                <p className="mi-muted" style={{ color: hx("#ffffff", 0.45) }}>
                    Cargando conversaciones…
                </p>
            ) : rows.length === 0 ? (
                <p
                    style={{
                        color: hx("#ffffff", 0.45),
                        fontSize: 13,
                        lineHeight: 1.6,
                    }}
                >
                    Todavía no hay conversaciones. Aparecen aquí cuando los
                    Tripulantes hablan con el Espejo Vibracional.
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {rows.map((c) => {
                        const isOpen = openId === c.conv_id
                        return (
                            <div
                                key={c.conv_id}
                                className="mi-card"
                                style={{ padding: 0, overflow: "hidden" }}
                            >
                                <button
                                    onClick={() =>
                                        setOpenId(isOpen ? null : c.conv_id)
                                    }
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        width: "100%",
                                        padding: "12px 14px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: GOLD,
                                            fontFamily: "monospace",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {c.alias}
                                    </span>
                                    <span
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: 12.5,
                                            color: hx("#ffffff", 0.6),
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {isOpen ? "—" : firstUser(c)}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: hx("#ffffff", 0.35),
                                            flexShrink: 0,
                                        }}
                                    >
                                        {c.msg_count} · {fmtDate(c.last_at)}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                            padding: "4px 14px 16px",
                                        }}
                                    >
                                        {c.messages.map((m, i) => {
                                            const isU = m.role === "user"
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        alignSelf: isU
                                                            ? "flex-end"
                                                            : "flex-start",
                                                        maxWidth: "86%",
                                                        padding: "9px 12px",
                                                        borderRadius: 12,
                                                        fontSize: 13,
                                                        lineHeight: 1.5,
                                                        whiteSpace: "pre-wrap",
                                                        background: isU
                                                            ? hx(
                                                                  "#00E5FF",
                                                                  0.12
                                                              )
                                                            : hx(
                                                                  "#D4A843",
                                                                  0.1
                                                              ),
                                                        border: `1px solid ${
                                                            isU
                                                                ? hx(
                                                                      "#00E5FF",
                                                                      0.25
                                                                  )
                                                                : hx(
                                                                      "#D4A843",
                                                                      0.25
                                                                  )
                                                        }`,
                                                        color: hx(
                                                            "#ffffff",
                                                            0.9
                                                        ),
                                                    }}
                                                >
                                                    {renderEspejoMd(m.content)}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   BIÓSFERA — Editor de pistas acústicas de los Nodos Vegetales.
   El audio vive en R2 (sube el .mp3 como las Meditaciones) y aquí se
   registra por audio_url. CRUD vía admin-action (admin_get/upsert/
   delete_biosfera_track). Requiere migración 20260707_biosfera_tracks.
   ═══════════════════════════════════════════════════════════════════ */
type AdminBioTrack = {
    id: string
    title: string
    freq_label: string
    description: string
    audio_url: string | null
    is_free: boolean
    sort_order: number
    active: boolean
}

function BiosferaEditor({ url, apiKey }: { url: string; apiKey: string }) {
    const [items, setItems] = useState<AdminBioTrack[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState("")

    const flash = (m: string) => {
        setToast(m)
        window.setTimeout(() => setToast(""), 1800)
    }

    /* 🜂 Una vez por visita; toda escritura olvida (guardado optimista). */
    const CLAVE = "admin_get_biosfera_tracks"
    const olvidar = () => motorCacheClear(CLAVE)

    const load = async (force = false) => {
        setLoading(true)
        const res = await adminActionCached(url, apiKey, CLAVE, {}, { force })
        setItems(Array.isArray(res) ? res : [])
        setLoading(false)
    }
    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, apiKey])

    const addTrack = async () => {
        setBusy(true)
        const res = await adminAction(
            url,
            apiKey,
            "admin_upsert_biosfera_track",
            {
                p_id: null,
                p_title: "Nueva pista",
                p_freq_label: "",
                p_description: "",
                p_audio_url: null,
                p_is_free: true,
                p_sort_order:
                    (items.reduce((m, x) => Math.max(m, x.sort_order), 0) ||
                        0) + 10,
                p_active: true,
            }
        )
        setBusy(false)
        olvidar()
        if (res && res.id) {
            setItems((prev) => [...prev, res])
            flash("Pista creada")
        } else {
            flash("No se pudo crear")
        }
    }

    const saveTrack = async (
        t: AdminBioTrack,
        patch: Partial<AdminBioTrack>
    ) => {
        const next = { ...t, ...patch }
        setItems((prev) => prev.map((x) => (x.id === t.id ? next : x)))
        await adminAction(url, apiKey, "admin_upsert_biosfera_track", {
            p_id: t.id,
            p_title: next.title,
            p_freq_label: next.freq_label,
            p_description: next.description,
            p_audio_url: next.audio_url,
            p_is_free: next.is_free,
            p_sort_order: next.sort_order,
            p_active: next.active,
        })
        olvidar()
    }

    const deleteTrack = async (t: AdminBioTrack) => {
        if (!window.confirm(`¿Eliminar "${t.title}"?`)) return
        setItems((prev) => prev.filter((x) => x.id !== t.id))
        await adminAction(url, apiKey, "admin_delete_biosfera_track", {
            p_id: t.id,
        })
        olvidar()
        flash("Pista eliminada")
    }

    return (
        <div>
            <div
                style={{
                    fontSize: 13,
                    color: hx(AC, 0.72),
                    lineHeight: 1.5,
                    marginBottom: 14,
                }}
            >
                Pistas acústicas de la capa Biósfera. Sube el .mp3 a R2 (igual
                que las Meditaciones) y pega su URL aquí. Una pista sin URL
                aparece como “En preparación” en la app. Requiere la migración
                20260707_biosfera_tracks.
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                    className="mi-btn mi-btn-gold"
                    onClick={addTrack}
                    disabled={busy}
                >
                    + Agregar pista
                </button>
                <BtnRecargar
                    onClick={() => void load(true)}
                    disabled={loading}
                />
            </div>

            {loading ? (
                <div style={{ padding: 20, opacity: 0.6 }}>Cargando…</div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        marginTop: 14,
                    }}
                >
                    {items.map((t) => (
                        <div
                            className="mi-card"
                            key={t.id}
                            style={{ padding: 14 }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                            >
                                <input
                                    className="mi-input"
                                    style={{ flex: 1, fontWeight: 700 }}
                                    defaultValue={t.title}
                                    onBlur={(e) =>
                                        saveTrack(t, { title: e.target.value })
                                    }
                                    placeholder="Título"
                                />
                                <input
                                    className="mi-input"
                                    style={{ width: 70 }}
                                    type="number"
                                    defaultValue={t.sort_order}
                                    onBlur={(e) =>
                                        saveTrack(t, {
                                            sort_order:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    title="Orden"
                                />
                            </div>
                            <input
                                className="mi-input"
                                style={{ width: "100%", marginBottom: 8 }}
                                defaultValue={t.freq_label}
                                onBlur={(e) =>
                                    saveTrack(t, { freq_label: e.target.value })
                                }
                                placeholder="Frecuencia (ej. 432 Hz · Fotosíntesis Cuántica)"
                            />
                            <textarea
                                className="mi-input"
                                style={{
                                    width: "100%",
                                    minHeight: 72,
                                    marginBottom: 8,
                                    resize: "vertical",
                                }}
                                defaultValue={t.description}
                                onBlur={(e) =>
                                    saveTrack(t, {
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Descripción (se muestra al expandir la pista)"
                            />
                            <input
                                className="mi-input"
                                style={{
                                    width: "100%",
                                    marginBottom: 8,
                                    borderColor: t.audio_url
                                        ? undefined
                                        : hx(GOLD, 0.5),
                                }}
                                defaultValue={t.audio_url || ""}
                                onBlur={(e) =>
                                    saveTrack(t, {
                                        audio_url:
                                            e.target.value.trim() || null,
                                    })
                                }
                                placeholder="URL del audio en R2 (https://…/Biosfera/….mp3)"
                            />
                            <div
                                style={{
                                    display: "flex",
                                    gap: 14,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                }}
                            >
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 13,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={t.active}
                                        onChange={(e) =>
                                            saveTrack(t, {
                                                active: e.target.checked,
                                            })
                                        }
                                    />
                                    Activa
                                </label>
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 13,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={t.is_free}
                                        onChange={(e) =>
                                            saveTrack(t, {
                                                is_free: e.target.checked,
                                            })
                                        }
                                    />
                                    Gratis
                                </label>
                                <span style={{ fontSize: 12, opacity: 0.5 }}>
                                    {t.audio_url ? "con audio" : "sin audio"}
                                </span>
                                <button
                                    className="mi-btn mi-btn-red"
                                    style={{ marginLeft: "auto" }}
                                    onClick={() => deleteTrack(t)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div
                            style={{
                                padding: 20,
                                opacity: 0.6,
                                textAlign: "center",
                            }}
                        >
                            No hay pistas. Pega la migración
                            20260707_biosfera_tracks para cargar el catálogo por
                            defecto, o crea una con “+ Agregar pista”.
                        </div>
                    )}
                </div>
            )}

            {toast && <div className="mi-toast">{toast}</div>}
        </div>
    )
}

const Editores = Object.assign(MIEditoresShell, {
    SondasEditor,
    ProtocolosEditor,
    AfirmacionesEditor,
    RitualesHub,
    WallpapersEditor,
    WallpapersHub,
    BiosferaEditor,
    AvataresEditor,
    AvataresHub,
    CristalizacionEditor,
    ComunidadInteresesEditor,
    MensajeAdminEditor,
    MedallasEditor,
    ModeracionPanel,
    StickersHub,
    BuzonEditor,
    VersionesEditor,
    EspejoEditor,
})

export default Editores
