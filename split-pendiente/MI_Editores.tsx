// MI_Editores.tsx v1.36 — SPLIT (2026-08-10): el archivo pesaba 342 KB y no pasaba por el sync automático de Framer. Queda como shell de 17 KB que solo importa y re-expone; los editores viven ahora en MI_EditCommon.tsx (interruptor de idioma, botón de recarga, alineadores y campo numérico), MI_EditRituales.tsx (Sondas, Calibraciones, Afirmaciones, Rituales), MI_EditWallpapers.tsx, MI_EditAvatares.tsx (avatar, Cristalización, Campo Solar, mensajes), MI_EditComunidad.tsx (intereses, Medallas, Moderación, Stickers, Buzón) y MI_EditSistema.tsx (Versiones, Espejo, Biósfera). Cero cambios de comportamiento: cada bloque viajó textual, con sus comentarios, y se verificó uno por uno contra el original. La cadena es MI_Shared → MI_EditCommon → MI_Edit* → MI_Editores, sin ciclos.
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
import MI_EditAvatares from "./MI_EditAvatares.tsx"
import MI_EditComunidad from "./MI_EditComunidad.tsx"
import MI_EditRituales from "./MI_EditRituales.tsx"
import MI_EditSistema from "./MI_EditSistema.tsx"
import MI_EditWallpapers from "./MI_EditWallpapers.tsx"

const { AvataresEditor, AvataresHub, CristalizacionEditor, MensajeAdminEditor } = MI_EditAvatares
const { BuzonEditor, ComunidadInteresesEditor, MedallasEditor, ModeracionPanel, StickersHub } = MI_EditComunidad
const { AfirmacionesEditor, ProtocolosEditor, RitualesHub, SondasEditor } = MI_EditRituales
const { BiosferaEditor, EspejoEditor, VersionesEditor } = MI_EditSistema
const { WallpapersEditor, WallpapersHub } = MI_EditWallpapers

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

/* ═══ GHOST WRAPPER ═══ */
function MIEditoresShell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MIEditoresShell.displayName = "MI_Editores"

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
