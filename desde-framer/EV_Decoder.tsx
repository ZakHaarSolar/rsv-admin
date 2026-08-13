// EV_Decoder.tsx v1.48 — Afinación Cámara de Lectura: línea de barrido más tenue (0.85→0.26) + el marco respeta el notch (safe-area-inset-top). RESULTADO DE MATERIA rediseñado: "Cámara de Lectura", terminal holográfica de Sexta Densidad (marco de instrumento único + retícula viva + costura de apertura + sello hexagonal contrarrotando + cometa SMIL + veredicto que materializa + 3 canales de señal + traza de análisis + directiva sellada). Mismos datos; reusa el motor vivo (fireMaterialize/aurora/tensión) + keyframes esc-cam-* de EV_Shared. Continuo = CSS/SMIL (10K), framer solo entradas.
// v1.46 — Materia/Texto: botón Decodificar sin parpadeo (sin entrada framer + sin transition:all) + slot de alto fijo → la marca de agua hexagonal del fondo NO se mueve al aparecer el botón (≥2 letras). Botón solo aparece cuando está listo
// v1.42 — #3 Resonancia táctil: el botón DECODIFICAR junta energía al mantenerlo presionado (glow oro intenso, CSS transition) y descarga una onda dorada al soltar (fireTouchRipple desde el centro)
// para no encimarse con el título de 2 líneas + el bloque inferior sube un toque
// (84→74); al volver al hub TODA la capa idle se desvanece junta (outer motion.div
// con exit + la pill con exit), ya no quedan sueltos el título y la pill.
// v1.37 — Título de Materia gemelo del de Sueños (dorado, mismo
// salto de línea y estilo; back 38×38) + el desktop también usa dorado + bloque
// inferior sube (paddingTop 170→84) + el selector "Lente Óptico / Texto" entra con
// fade junto al resto + en TEXTO, si al invitado no le quedan decodificaciones,
// tocar la caja abre el muro de pago (overlay → onFreemiumBlock). [re-sync]
// v1.36 — Botón de regreso dorado al hub en el título de Materia.
// (a la par de Sueños) + tarjeta del dictamen rediseñada (línea de acento + emblema
// cristal pulsante + estado más grande) + fix del color de estado (statusHex, hx()
// necesita hex) + botón "Nuevo escaneo" premium (oro→cian + glow + ícono) + animación
// "decodificando" más abajo (13vh) + "Densidad de carbono" → "Pesadez en tu energía".
// v1.35 — Input de texto ÉPICO (campo cristalino "Cámara de
// Cristalización" con 4 gemas + sigilo + chispas, reemplaza el <input> plano) +
// contador freemium en 3 gemas (DecoderShotsMeter abajo, en ambas pestañas, en
// vez del chip plano "X/3" arriba a la derecha) + tab del menú "Códice de Materia"
// → "Texto" + botón "Cargar desde galería" con marco hairline dual-tono oro→cian.
// v1.34 — El contador freemium (get_my_decoder_scan_count) se lee
// por el gateway user-action (id verificado del token) con fallback REST transitorio
// hasta el REVOKE post-build (Lote F). v1.33 — Loader "Núcleo de Síntesis": orbital etéreo pulsante (aura + 2 arcos scanner contra-rotando + chispas + núcleo con destello), reemplaza el anillo simple. Botón "Cargar desde galería" con ícono de cristal
// facetado (eco del emblema central). v1.30 — Emblema central rediseñado: cristal
// prismático facetado (eco del sello MateriaSigil del hub) con gradiente
// oro→cian, anillo orbital cian y chispas, en vez del crosshair plano. Acento
// cian en el anillo medio. El título "Decodificador de Materia" se conserva.
// v1.29 — Tier Decodificador 199: el gate y el badge "X/3"
// dependen ahora de hasUnlimitedDecoder (Sintonía O tier 199), no de la
// membresía Sintonía sola. Invitación suave (onSoftInvite) tras el 1er/2º
// escaneo del invitado: nudge gentil al 199 con los disparos restantes.
// v1.28 — Sintonía 777 → 599 MXN en el muro.
// v1.26 — Seguridad Ola A. Cada llamada al Decodificador manda el token de
// sesión de Clerk (window.Clerk.session.getToken()) en el body de
// extract-text y decode-matter; el servidor lo verifica y aplica el límite
// freemium + registra el escaneo. Se quitó el registro client-side para no
// duplicar. 403 free_limit_reached → muro de pago; 401 → pedir login.
// v1.25 — paddingBottom mobile sube de 120 a 200 px (más
// safe-area-inset-bottom). En web Brave/Safari iOS, `100vh`
// incluye la toolbar inferior del browser y la BottomNav del
// shell mobile se suma encima → buffer 120 era insuficiente,
// el botón "Cargar desde galería" seguía chocando. 200 px
// cubre browser toolbar + BottomNav + respiración.
//
// v1.24 — Pill "Lente Óptico / Códice de Materia" más alta
// (padding 5/6 + button 10x16 / 12x22 + fontSize 10.5/11.5).
// "Decodificar Códice" del modo texto se acorta a "Decodificar"
// para alinear con el botón mayor del modo cámara.
//
// v1.23 — AI Consent persistido por cuenta. Antes del primer envío
// de fotografías a Cloud Vision + Gemini, el Tripulante ve un modal
// que declara qué se procesa y a dónde se envía. Al aceptar persiste
// en `profiles.ai_consent_at` via RPC `set_ai_consent_at` y queda
// ligado a la cuenta — basta una sola vez para que aplique en todos
// sus dispositivos. Si revoca (RPC `clear_ai_consent_at`), el modal
// vuelve al próximo uso. Ver migración SQL
// `20260508_ai_consent.sql` y la sección "Procesamiento por
// Inteligencia Artificial" del Privacy.tsx.
// Gates: startCamera y handleGalleryUpload pasan por
// `requireAiConsent` que abre el modal con la acción pendiente. Al
// aceptar la acción se ejecuta automáticamente. Al cancelar se
// descarta y el Tripulante vuelve al estado idle.
// Necesario para review de Apple App Store (apps que envían datos
// del usuario a LLMs externos requieren consent explícito desde
// iOS 18).
// v1.22 — Columna del Decodificador suma paddingBottom propio (40 px
// mobile, 80 px desktop) sobre el del esc-scroll. Reporte de Zak: en
// web no-PWA el botón "Cargar desde galería" chocaba contra la barra
// de navegación inferior porque la columna no tenía colchón propio
// entre la última pill y el borde inferior — solo dependía del
// padding del esc-scroll, que en algunos viewports no alcanzaba.
// v1.21 — Cuatro pulidos pedidos por Zak para mobile (PWA y web) +
// dos para desktop:
//   (a) Chip "X/3 escaneos" abandona el centro horizontal y se monta
//       en la esquina superior DERECHA. Mobile: top:4+env right:16
//       (mismo eje vertical que el título "DECODIFICADOR DE MATERIA"
//       que vive top-left). Desktop: top:14 right:18 (alineado con la
//       pill LENTE/CÓDICE que vive en top:14 centrado). Ya no compite
//       con el espacio entre la pill y el contenido.
//   (b) Chip muestra solo "X/3" — sin "ESCANEOS" ni "AGOTADO ·
//       ACTIVAR SINTONÍA". Si el limit se agota, mismo X/3 (en 0/3)
//       con paleta dorada. Tap → modal informativo (igual que antes).
//   (c) Pill "Lente Óptico / Códice de Materia" mobile baja de top:36
//       a top:50 — más respiración entre el título HOLOTECA-style y
//       la pill. Desktop sin cambios.
//   (d) Wrapper body mobile paddingTop pasa de 138 a 170 — DECODIFICAR
//       y "Cargar desde galería" descienden ~32px en bloque, dejando
//       respirar la barra LENTE/CÓDICE arriba.
//   (e) Botón "Cargar desde galería" marginTop pasa de 40 a 64 — gana
//       16px extra de separación respecto a DECODIFICAR.
//   (f) Como el chip ya no vive abajo de la pill, el comentario
//       interno y los magic numbers de v1.16 se actualizaron.
// v1.18.2 — Comentarios internos: "disparo" → "decodificación" (alineado
// al lenguaje user-facing del componente). Cero cambios de comportamiento.
// v1.18.1
// v1.18 — Pill "Lente Óptico / Códice de Materia" mobile a una sola
// fila horizontal sin wrap. Antes el contenedor portaled top:14 dejaba
// que las labels rompieran en 2-3 líneas internas en viewports angostos
// (iPhone 13 reportado por Zak: pill se veía como "LENTE / ÓPTICO" +
// "CÓDICE / DE / MATERIA"). Fix: whiteSpace:nowrap en el contenedor y
// en cada botón, fontSize 9 + letterSpacing 0.12em + padding 6/12px en
// mobile (vs 10 + 0.18em + 8/18px desktop). Pill mobile baja a top:36
// + chip 3/3 a top:96 + paddingTop 138 del contenido para que las tres
// capas no se pisen. Desktop sin cambios.
// v1.17 — Cache localStorage del contador `freeShotsUsed` por
// clerkUserId. Antes el contador arrancaba en null y el chip 3/3
// mostraba "3/3" por default mientras el RPC `get_my_decoder_scan_count`
// resolvía (~200-500ms); al llegar la respuesta saltaba a "1/3" o
// "0/3" en flicker visible. Ahora el initial value lee del cache: si
// la última sesión vio "1/3", el chip arranca con "1/3" y el fetch
// solo confirma o ajusta. Bug resuelto sobre todo en mobile.
// v1.16 — Tres ajustes pedidos por Zak:
//   (a) Pill "Lente Óptico / Códice de Materia" sale del flow inline
//       y se portalea fixed arriba (top:14 centrado horizontal). Antes
//       quedaba debajo del título grande del decodificador (desktop)
//       o muy abajo del chip 3/3 (mobile); ahora flota como tab-bar
//       persistente arriba de todo. El paddingTop del container mobile
//       baja de 60 a 16 ahora que la pill ya no vive ahí.
//   (b) Chip "X/3 escaneos" baja de top:42 a top:72 — queda debajo de
//       la pill portaled, no encima. Lectura: tab-bar arriba, badge
//       freemium debajo.
//   (c) Botón "Activar Sintonía Solar" del modal informativo gana
//       textura profesional: gradient base dorado-bronce-ámbar de 3
//       stops + shimmer animado diagonal (overlay con keyframes) +
//       inset highlight + drop shadow más profundo. Antes se sentía
//       como un botón básico de gradient simple; ahora tiene capa
//       luminiscente que invita a picar.
// v1.15 — Cuatro afinaciones del Decodificador (pedidos de Zak):
//   (a) Botón principal: removido el subtítulo "Activar lente" — solo
//       queda "DECODIFICAR" para que la palabra respire sin la
//       redundancia tipográfica.
//   (b) Gráfico interno: el hexágono pulsante con clipPath se
//       reemplaza por un objetivo holográfico (anillos concéntricos
//       + crosshair en cruz + punto focal). Lee mucho más como
//       "lente óptico apuntando" que el polígono abstracto.
//   (c) Botón "Cargar desde galería": pill más cálida con gradient
//       sutil dorado, icono de cuadro con sparkle (en lugar del
//       paisaje genérico) y borde más asentado para que se sienta
//       seleccionable.
//   (d) Tabs Lente Óptico / Códice de Materia: la pill superior pasa
//       de casi-transparente (background 0.02 opacity) a una capa
//       de glassmorphism con bg + border más asentados y un glow
//       tenue que invita a navegar entre los modos.
// v1.14 — Chip "X/3" sube de top:56 a top:42 — sweet spot entre el
// título HOLOTECA-style (arriba) y los tabs "Lente Óptico / Códice
// de Materia" (abajo).
// EV_Decoder.tsx v1.13
// v1.13 — Tres pulidos visuales para freemium:
//  (1) Chip "X/3 escaneos" baja de top:38 a top:56 — más respiración
//      entre el chip y el título HOLOTECA-style del shell mobile.
//  (2) Modal de info: copy "Tu acceso de invitado incluye" rompe a
//      la línea siguiente justo antes de "3 decodificaciones para
//      que..." — antes el wrap natural cortaba "3" arriba y
//      "decodificaciones" sola abajo, lectura confusa. Ahora la
//      primera línea es "Tu acceso de invitado incluye" y la
//      segunda arranca con "3 decodificaciones para que...".
//  (3) Botón "Activar Sintonía Solar · 777 MXN/mes" pasa a dos
//      filas: arriba "Activar Sintonía Solar", abajo "777 MXN/mes"
//      con fontSize 10 + opacidad 0.78. Mismo estilo que los
//      gates de EV_Freemium.
// EV_Decoder.tsx v1.12
// v1.12 — Refinamiento del contador 3/3:
//  · Chip centrado horizontalmente (left 50% + translateX -50%) en
//    su fila, con border completo y borderRadius 999 (pill flotante).
//  · Wrapper body en mobile gana paddingTop 60 (antes 16) para
//    bajar las tabs Lente Óptico / Códice de Materia debajo del
//    chip y evitar el overlap visual.
// EV_Decoder.tsx v1.11
// v1.11 — Contador freemium 3/3 baja una fila: ahora el título
// "DECODIFICADOR DE MATERIA" vive en el top-left del viewport
// (esc-scroll v13.21), así que el chip top:0 chocaba con él.
// Movido a top:38 right:0 — sigue pegado al borde derecho pero
// cuelga DEBAJO del título, con borderRadius 10px 0 0 10px (el
// lado izquierdo redondeado).
// EV_Decoder.tsx v1.10
// v1.10 — Contador freemium 3/3 reposicionado a la esquina superior
// derecha pegado completamente al borde (sin orillas top/right,
// rounded sólo bottom-left) para no chocar con el título centrado.
// Acepta prop hideForOverlay; cuando true el portal'd counter no
// renderiza — sin esto se quedaba visible al cambiar a Holoteca/
// Núcleo porque createPortal vive en document.body fuera del wrapper
// del Escáner que se oculta con display:none.
// EV_Decoder.tsx v1.9
// v1.9 — Rename copy "Protocolos Quirúrgicos" → "Calibraciones" en
// el bloque de upsell del modal de info.
// EV_Decoder.tsx v1.8
// v1.8 — Animación de entrada del título mobile copia exacta del
// título HOLOTECA: transition ease easeOut + CSS animation nuc-breath.
// Los tres títulos del Lente respiran al mismo ritmo.
// v1.7 — Defaults defensivos en props (accent, isMobile, etc) para que
// Framer no crashee al instanciar standalone con props undefined.
// + Mobile idle: revertimos alignItems a center + textAlign center +
// padding-x 20 (botones DECODIFICAR y CARGAR DESDE GALERÍA centrados
// como antes); el título "DECODIFICADOR DE MATERIA" sale a un wrapper
// previo independiente con padding-left controlado para alinearse a
// HOLOTECA y PROTOCOLOS.
// v1.6 — Mobile: wrapper "idle" pasa a alignItems:stretch + textAlign
// left + padding lateral 16px (antes 20px) para que el título
// "DECODIFICADOR DE MATERIA" arranque a la misma distancia del borde
// izquierdo que el título de HOLOTECA y PROTOCOLOS QUIRÚRGICOS.
// padding-top 4 (antes 16) para igualar la altura de los tres títulos.
// v1.5 — Mobile: el título "DECODIFICADOR DE MATERIA" pasa a navigation
// bar superior izquierda (textAlign left, fontSize 14, single-line).
// Desktop sin cambios. El botón badge "X de 3 decodificaciones" portado
// se mantiene al top del viewport — no compite por espacio con el
// nuevo título de barra.
// v1.4 — Gradient por palabra en el título "Decodificador de Materia":
// cada token (Decodificador, de, Materia) tiene su propio gradient
// 180deg accent→#fff. Sin esto la frase compartía un gradient único y
// la última palabra salía casi blanca.
// v1.2 — Preview de galería con zoom de ignición. Cuando el tripulante
// elige una foto desde el carrete, ya no se manda directo al motor:
// se dibuja en pantalla enmarcada en geometría cyan con esquinas
// luminosas + sello "Geometría visual capturada" + botón dorado
// "Decodificar Materia". Al picar ese botón, la foto hace un zoom
// suave (~600ms) y luego dispara sendToDecoder o triggerea el authGate
// según haya sesión. Nueva prop authGateOpen oculta la cámara
// fullscreen via visibility:hidden y zIndex 5 cuando el shell levanta
// el gate (sin esto el portal de la cámara con zIndex 200000 cubría
// el modal del gate; ahora el gate domina visualmente y la cámara
// reaparece intacta al cerrarlo).
// Decodificador de Materia — pipeline OCR 2-etapas (Cloud Vision +
// Gemini Flash) con render tri-axial, Anillo de Composición y modos
// Lente Óptico / Códice de Materia. Persiste cada dictamen exitoso en
// decoder_scans (RPC SECURITY DEFINER) para el contador freemium 3/3.
// Default export: DecodificadorView.
import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import Shared from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"
const {
    hx,
    GOLD,
    CYAN,
    withCheckoutIdentity,
    SINTONIA_SOLAR_LINK,
    fireTouchRipple,
    fireMaterialize,
    fireAuroraBloom,
    fireFieldWave,
    fireFieldTension,
} = Shared
const { CSvg } = Icons

interface DictamenResult {
    dictamen_hud: {
        categoria_detectada?: string
        estado: string
        friccion_biologica: number
        friccion_energetica: number
        impacto_matriz: number
        densidad_ligereza?: number
        termodinamica_resumen?: string
    }
    analisis_quirurgico: string[]
    comando_final: string
}

/* ═══════════════════════════════════════════════════════════════
   INPUT DE TEXTO — campo épico "Cámara de Cristalización" (v1.35)
   Sigilo MateriaSigil de marca de agua tenue detrás + 4 gemas hexagonales
   facetadas en las esquinas del campo (eco del sello del hub) + 2 chispas;
   al enfocar las gemas se encienden, las chispas orbitan vivo y el borde
   pasa de cian a oro con glow.
   Vive en MODULE SCOPE (no inline en el render) para no remontar el
   <input> en cada tecla → no se pierde el foco al escribir.
   ═══════════════════════════════════════════════════════════════ */
type CodiceFieldProps = {
    matterName: string
    setMatterName: (s: string) => void
    inputFocused: boolean
    setInputFocused: (b: boolean) => void
    freeLimitReached: boolean
    isMobile: boolean
    sendMatterNameToDecoder: (rawName: string) => void
    /* v1.37 — Cuando el invitado agotó sus 3 decodificaciones, el input
       queda disabled. Tocar la caja dispara el muro de pago (mismo que el
       Lente Óptico) vía un overlay que captura el tap. */
    onFreemiumBlock?: () => void
}

/* Botón "Decodificar" — idéntico en ambas variantes, bindings/gating intactos. */
function DecodificarMateriaButton({
    matterName,
    freeLimitReached,
    sendMatterNameToDecoder,
}: Pick<
    CodiceFieldProps,
    "matterName" | "freeLimitReached" | "sendMatterNameToDecoder"
>) {
    const ready = matterName.trim().length >= 2 && !freeLimitReached
    if (!ready) return null
    return (
        /* #2.1 — Sin entrada framer (initial/animate) ni `transition:all`:
           ambas animaban opacity a la vez y el botón parpadeaba (brilloso →
           transparente → brilloso). Ahora aparece brillando y se queda así;
           solo hover/tap usan scale de framer. */
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => sendMatterNameToDecoder(matterName)}
            disabled={!ready}
            style={{
                padding: "13px 32px",
                borderRadius: 14,
                border: `1.5px solid ${ready ? hx(GOLD, 0.55) : hx(GOLD, 0.2)}`,
                background: ready
                    ? `linear-gradient(135deg, ${hx(GOLD, 0.32)}, ${hx(GOLD, 0.12)})`
                    : "rgba(20,14,4,0.4)",
                color: ready ? GOLD : hx(GOLD, 0.4),
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                cursor: ready ? "pointer" : "not-allowed",
                fontFamily: "'Inter',sans-serif",
                outline: "none",
                opacity: ready ? 1 : 0.7,
                boxShadow: ready
                    ? `0 0 32px ${hx(GOLD, 0.45)}, inset 0 1px 0 rgba(255,225,150,0.25)`
                    : "none",
                textShadow: ready ? `0 0 16px ${hx(GOLD, 0.7)}` : "none",
            }}
        >
            Decodificar
        </motion.button>
    )
}

/* Gema hexagonal facetada para las 4 esquinas del campo (eco del MateriaSigil,
   NO una flecha). Tamaño fijo en px → no se deforma con el ancho. Se enciende
   al enfocar. */
function CodiceCornerGem({
    focused,
    corner,
}: {
    focused: boolean
    corner: "tl" | "tr" | "bl" | "br"
}) {
    const pos =
        corner === "tl"
            ? { top: -9, left: -9 }
            : corner === "tr"
              ? { top: -9, right: -9 }
              : corner === "bl"
                ? { bottom: -9, left: -9 }
                : { bottom: -9, right: -9 }
    const gid = `ev-gem-${corner}`
    return (
        <motion.svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            animate={
                focused
                    ? { opacity: 1, scale: 1.12 }
                    : { opacity: 0.6, scale: 1 }
            }
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{
                position: "absolute",
                ...pos,
                pointerEvents: "none",
                overflow: "visible",
                filter: `drop-shadow(0 0 5px ${hx(GOLD, focused ? 0.6 : 0.3)})`,
                transformBox: "fill-box",
                transformOrigin: "center",
                zIndex: 3,
            }}
        >
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FBE6A8" />
                    <stop offset="50%" stopColor={GOLD} />
                    <stop offset="100%" stopColor={CYAN} />
                </linearGradient>
            </defs>
            <polygon
                points="12,3 19.5,7.5 19.5,16.5 12,21 4.5,16.5 4.5,7.5"
                fill={`url(#${gid})`}
                fillOpacity="0.9"
                stroke="#FFFFFF"
                strokeOpacity="0.5"
                strokeWidth="0.7"
            />
            <polygon
                points="12,3 12,21 4.5,16.5 4.5,7.5"
                fill="#FFFFFF"
                fillOpacity="0.12"
            />
            <line
                x1="12"
                y1="3"
                x2="12"
                y2="21"
                stroke="#FFFFFF"
                strokeOpacity="0.45"
                strokeWidth="0.4"
            />
            <line
                x1="4.5"
                y1="7.5"
                x2="19.5"
                y2="16.5"
                stroke="#FFFFFF"
                strokeOpacity="0.28"
                strokeWidth="0.35"
            />
        </motion.svg>
    )
}

/* Chispa que titila (y orbita levemente al enfocar). */
function CodiceSpark({
    focused,
    style,
    delay = 0,
}: {
    focused: boolean
    style: React.CSSProperties
    delay?: number
}) {
    return (
        <motion.div
            animate={
                focused
                    ? { opacity: [0.4, 1, 0.4], scale: [0.9, 1.5, 0.9] }
                    : { opacity: [0.18, 0.5, 0.18], scale: [0.8, 1.1, 0.8] }
            }
            transition={{
                duration: focused ? 1.3 : 3.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
            style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#FFFFFF",
                boxShadow: `0 0 7px ${hx(CYAN, 0.85)}`,
                pointerEvents: "none",
                zIndex: 3,
                ...style,
            }}
        />
    )
}

/* Campo épico del Input de texto — "Cámara de Cristalización". */
function CodiceFieldCristalizacion({
    matterName,
    setMatterName,
    inputFocused,
    setInputFocused,
    freeLimitReached,
    isMobile,
    sendMatterNameToDecoder,
    onFreemiumBlock,
}: CodiceFieldProps) {
    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                width: "100%",
                maxWidth: 360,
                marginTop: 8,
            }}
        >
            {/* v1.37 — Overlay que captura el tap cuando el invitado ya no
                tiene decodificaciones. El <input> disabled NO emite eventos
                de click en iOS/Safari, así que un overlay transparente encima
                abre el muro de pago (mismo que el Lente Óptico). */}
            {freeLimitReached && (
                <div
                    onClick={() => onFreemiumBlock?.()}
                    role="button"
                    aria-label="Activar Sintonía para más decodificaciones"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        cursor: "pointer",
                        background: "transparent",
                    }}
                />
            )}
            {/* Marca de agua MateriaSigil — estática, baja opacidad, NO interactiva. */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: isMobile ? 220 : 260,
                    height: isMobile ? 220 : 260,
                    pointerEvents: "none",
                    opacity: 0.05,
                    zIndex: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    fill="none"
                    style={{ overflow: "visible" }}
                >
                    <defs>
                        <linearGradient
                            id="ev-cam-wm"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                        >
                            <stop offset="0%" stopColor="#FBE6A8" />
                            <stop offset="45%" stopColor={GOLD} />
                            <stop offset="100%" stopColor={CYAN} />
                        </linearGradient>
                    </defs>
                    <polygon
                        points="50,24 70,38 70,62 50,76 30,62 30,38"
                        fill="url(#ev-cam-wm)"
                        fillOpacity="0.9"
                        stroke="#FFFFFF"
                        strokeOpacity="0.55"
                        strokeWidth="0.7"
                    />
                    <polygon
                        points="50,24 50,76 30,62 30,38"
                        fill="#FFFFFF"
                        fillOpacity="0.14"
                    />
                    <line
                        x1="50"
                        y1="24"
                        x2="50"
                        y2="76"
                        stroke="#FFFFFF"
                        strokeOpacity="0.5"
                        strokeWidth="0.5"
                    />
                    <line
                        x1="30"
                        y1="38"
                        x2="70"
                        y2="62"
                        stroke="#FFFFFF"
                        strokeOpacity="0.3"
                        strokeWidth="0.4"
                    />
                    <line
                        x1="70"
                        y1="38"
                        x2="30"
                        y2="62"
                        stroke="#FFFFFF"
                        strokeOpacity="0.3"
                        strokeWidth="0.4"
                    />
                </svg>
            </div>

            {/* Campo: gemas en las esquinas + chispas, input adelante. El contenedor
               abraza al input (sin alto fijo) → las 4 gemas se anclan a las esquinas
               reales del campo en cualquier ancho. */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    zIndex: 1,
                }}
            >
                {/* 4 gemas hexagonales facetadas en las esquinas (eco MateriaSigil). */}
                <CodiceCornerGem focused={inputFocused} corner="tl" />
                <CodiceCornerGem focused={inputFocused} corner="tr" />
                <CodiceCornerGem focused={inputFocused} corner="bl" />
                <CodiceCornerGem focused={inputFocused} corner="br" />
                {/* 2 chispas en los bordes medios — orbitan vivo al enfocar. */}
                <CodiceSpark
                    focused={inputFocused}
                    style={{ top: -2, left: "32%" }}
                />
                <CodiceSpark
                    focused={inputFocused}
                    style={{ bottom: -2, right: "32%" }}
                    delay={0.5}
                />

                {/* El input real — bindings intactos. Borde/glow conmutan en focus. */}
                <input
                    className="esc-codice-input"
                    type="text"
                    value={matterName}
                    onChange={(e) => setMatterName(e.target.value)}
                    placeholder={
                        inputFocused
                            ? ""
                            : "Plátano, Frijoles con arroz, Yuca…"
                    }
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    disabled={freeLimitReached}
                    style={{
                        position: "relative",
                        zIndex: 2,
                        width: "100%",
                        padding: "15px 18px",
                        borderRadius: 12,
                        border: inputFocused
                            ? `2px solid ${hx(GOLD, 0.72)}`
                            : `1px solid ${hx(CYAN, 0.28)}`,
                        background: inputFocused
                            ? "linear-gradient(180deg, rgba(212,168,67,0.12), rgba(0,229,255,0.06))"
                            : "linear-gradient(180deg, rgba(0,229,255,0.05), rgba(2,8,20,0.6))",
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 400,
                        letterSpacing: "0.04em",
                        fontFamily: "'Inter',sans-serif",
                        outline: "none",
                        textAlign: "center",
                        boxShadow: inputFocused
                            ? `inset 0 1px 0 ${hx(GOLD, 0.25)}, 0 0 30px ${hx(GOLD, 0.28)}, 0 0 48px ${hx(CYAN, 0.12)}`
                            : `inset 0 1px 0 ${hx(CYAN, 0.08)}, 0 0 22px ${hx(CYAN, 0.1)}`,
                        opacity: freeLimitReached ? 0.4 : 1,
                        transition:
                            "border 0.3s ease, background 0.3s ease, box-shadow 0.35s ease",
                        caretColor: hx(GOLD, 0.9),
                    }}
                />
            </div>

            {/* #2 — Slot de alto fijo: el botón aparece DENTRO sin empujar el
               layout, así la marca de agua hexagonal del fondo (centrada en
               este contenedor) no se mueve al escribir la 2ª letra. */}
            <div
                style={{
                    minHeight: 46,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                <DecodificarMateriaButton
                    matterName={matterName}
                    freeLimitReached={freeLimitReached}
                    sendMatterNameToDecoder={sendMatterNameToDecoder}
                />
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   MEDIDOR DE ESCANEOS — contador freemium épico (v1.35)
   3 gemas cristalinas: encendidas = escaneos restantes, apagadas =
   gastados. Al quedar 1, la última gema late en oro (urgencia) y el
   copy pasa a "Te queda 1 escaneo". Vive abajo, en ambas pestañas
   (reemplaza el chip plano "X/3" que estaba arriba a la derecha).
   ═══════════════════════════════════════════════════════════════ */
function DecoderShotGem({
    lit,
    pulse,
    idx,
}: {
    lit: boolean
    pulse: boolean
    idx: number
}) {
    const gid = `ev-shot-gem-${idx}`
    return (
        <motion.svg
            width={27}
            height={27}
            viewBox="0 0 24 24"
            fill="none"
            animate={
                pulse
                    ? { scale: [1, 1.16, 1], opacity: [0.85, 1, 0.85] }
                    : lit
                      ? { scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }
                      : { scale: 1, opacity: 1 }
            }
            transition={
                pulse
                    ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                    : lit
                      ? {
                            duration: 3.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: idx * 0.25,
                        }
                      : { duration: 0.3 }
            }
            style={{
                overflow: "visible",
                filter: lit
                    ? `drop-shadow(0 0 ${pulse ? 10 : 6}px ${hx(GOLD, pulse ? 0.85 : 0.5)})`
                    : "none",
                transformBox: "fill-box",
                transformOrigin: "center",
            }}
        >
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FBE6A8" />
                    <stop offset="50%" stopColor={GOLD} />
                    <stop offset="100%" stopColor={CYAN} />
                </linearGradient>
            </defs>
            <polygon
                points="12,2 22,7 22,17 12,22 2,17 2,7"
                fill={lit ? `url(#${gid})` : "transparent"}
                fillOpacity={lit ? 0.92 : 0}
                stroke={lit ? "#FFFFFF" : "rgba(255,255,255,0.22)"}
                strokeOpacity={lit ? 0.55 : 1}
                strokeWidth={lit ? 0.8 : 1.1}
                strokeLinejoin="round"
            />
            {lit && (
                <>
                    <polygon
                        points="12,2 12,22 2,17 2,7"
                        fill="#FFFFFF"
                        fillOpacity="0.12"
                    />
                    <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="22"
                        stroke="#FFFFFF"
                        strokeOpacity="0.5"
                        strokeWidth="0.5"
                    />
                    <line
                        x1="2"
                        y1="7"
                        x2="22"
                        y2="17"
                        stroke="#FFFFFF"
                        strokeOpacity="0.3"
                        strokeWidth="0.4"
                    />
                    <line
                        x1="22"
                        y1="7"
                        x2="2"
                        y2="17"
                        stroke="#FFFFFF"
                        strokeOpacity="0.3"
                        strokeWidth="0.4"
                    />
                </>
            )}
        </motion.svg>
    )
}

function DecoderShotsMeter({
    used,
    onTap,
    isMobile,
}: {
    used: number
    onTap: () => void
    isMobile: boolean
}) {
    const remaining = Math.max(0, 3 - used)
    const exhausted = remaining === 0
    const last = remaining === 1
    const label = exhausted
        ? "Sin escaneos · activa Sintonía"
        : last
          ? "Te queda 1 escaneo"
          : `Te quedan ${remaining} escaneos`
    return (
        <motion.button
            type="button"
            onClick={onTap}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            whileTap={{ scale: 0.97 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                outline: "none",
                padding: "2px 10px",
                fontFamily: "'Inter',sans-serif",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    gap: 13,
                    alignItems: "center",
                }}
            >
                {[0, 1, 2].map((i) => (
                    <DecoderShotGem
                        key={i}
                        idx={i}
                        lit={i < remaining}
                        pulse={last && i === 0}
                    />
                ))}
            </div>
            <motion.span
                animate={
                    exhausted || last
                        ? { opacity: [0.72, 1, 0.72] }
                        : { opacity: 1 }
                }
                transition={
                    exhausted || last
                        ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.3 }
                }
                style={{
                    fontSize: isMobile ? 11 : 11.5,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: exhausted || last ? GOLD : hx(CYAN, 0.8),
                    textShadow:
                        exhausted || last
                            ? `0 0 12px ${hx(GOLD, 0.5)}`
                            : `0 0 10px ${hx(CYAN, 0.3)}`,
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </motion.span>
        </motion.button>
    )
}

function DecodificadorView({
    /* v1.7 — Defaults defensivos contra Framer instanciando standalone
       con accent undefined (cualquier hx(accent, x) crashea con
       "Cannot read properties of undefined (reading 'replace')"). */
    accent = "#00C2FF",
    isMobile = false,
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
    hasUnlimitedDecoder = false,
    onFreemiumBlock,
    onSoftInvite,
    linkStripeMembSolar = "",
    isAuthed = true,
    onUnauthedAttempt,
    authGateOpen = false,
    hideForOverlay = false,
    onBack,
}: {
    accent?: string
    isMobile?: boolean
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    hasUnlimitedDecoder?: boolean
    onFreemiumBlock?: () => void
    /* v1.29 — Invitación suave (no bloqueante) del tier Decodificador
       (199). Se dispara tras el 1er/2º escaneo del invitado cuando aún
       le quedan disparos; el shell levanta el muro en modo soft con el
       conteo restante. El invitado puede cerrarlo y seguir decodificando. */
    onSoftInvite?: (shotsRemaining: number) => void
    linkStripeMembSolar?: string
    /* v6.5 — Fricción cero del decoder: el invitado puede abrir
       cámara, galería, escribir en el campo de texto. Al picar el
       botón final (DECODIFICAR / CAPTURAR / ANALIZAR) si !isAuthed
       invocamos onUnauthedAttempt y bloqueamos el envío al motor. */
    isAuthed?: boolean
    onUnauthedAttempt?: () => void
    /* v6.6 — authGateOpen le dice al Decoder que el shell está
       mostrando el gate de identificación (bottom sheet o fullscreen).
       Cuando es true, la cámara fullscreen se hace invisible (visibility
       hidden mantiene el video corriendo y no requiere reapertura tras
       anclar sesión) — sin esto el portal de la cámara con zIndex alto
       cubría el modal del gate. */
    authGateOpen?: boolean
    /* v1.10 — hideForOverlay: cuando el shell del Lente
       (AppNavegacionMobile) muestra Holoteca/Núcleo, el wrapper del
       Escáner se oculta con display:none, pero el contador 3/3
       portaleado a document.body no respeta esa ocultación. Esta prop
       le dice al Decoder que omita el portal mientras el overlay esté
       activo. */
    hideForOverlay?: boolean
    /* v1.36 — Regreso al hub de Decodificadores (a la par del de Sueños).
       El shell del Lente lo pasa (onBack={() => setSub("hub")}). */
    onBack?: () => void
}) {
    /* v1.18 — AI Consent persistido por cuenta en Supabase
       (`profiles.ai_consent_at`). El primer uso del Decodificador
       de cualquier dispositivo dispara el modal de consent. Una vez
       aceptado, queda ligado a la cuenta — todos los dispositivos
       lo ven. Si revoca (RPC clear_ai_consent_at desde MiNucleo o
       SQL Editor) el modal vuelve al próximo uso.
       Estados:
         · aiConsentLoaded = false: aún consultando la RPC al mount.
         · aiConsentLoaded = true + aiConsentAt = null: nunca aceptó.
         · aiConsentLoaded = true + aiConsentAt = timestamp: aceptado. */
    const [aiConsentLoaded, setAiConsentLoaded] = useState<boolean>(false)
    const [aiConsentAt, setAiConsentAt] = useState<string | null>(null)
    const [aiConsentModalOpen, setAiConsentModalOpen] = useState<boolean>(
        false
    )
    const pendingAfterConsentRef = useRef<(() => void) | null>(null)
    /* Helper: si ya hay consent, ejecuta onProceed inmediato. Si no,
       guarda onProceed como pending y abre el modal. La acción se
       dispara después de que el Tripulante acepte. */
    const requireAiConsent = (onProceed: () => void): boolean => {
        if (!aiConsentLoaded) {
            /* Edge: el Tripulante intenta usar el Decoder antes de que
               la RPC respondiera. Caemos al pessimistic: abrimos el
               modal por defensa. La RPC al mount es rápida (~200ms);
               este caso es raro. */
            pendingAfterConsentRef.current = onProceed
            setAiConsentModalOpen(true)
            return false
        }
        if (aiConsentAt) {
            onProceed()
            return true
        }
        pendingAfterConsentRef.current = onProceed
        setAiConsentModalOpen(true)
        return false
    }
    useEffect(() => {
        const uid =
            clerkUserId ||
            (typeof window !== "undefined"
                ? (window as any).Clerk?.user?.id || ""
                : "")
        if (!uid || !supabaseUrl || !supabaseAnonKey) {
            setAiConsentLoaded(true)
            setAiConsentAt(null)
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const token = await (window as any).Clerk?.session?.getToken?.()
                const r = await fetch(
                    `${supabaseUrl}/functions/v1/user-action`,
                    {
                        method: "POST",
                        headers: {
                            apikey: supabaseAnonKey,
                            Authorization: `Bearer ${supabaseAnonKey}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            token,
                            action: "get_ai_consent_at",
                            params: {},
                        }),
                    }
                )
                const data = await r.json().catch(() => null)
                if (cancelled) return
                /* Postgres devuelve un timestamp ISO o null directo. */
                const ts =
                    typeof data === "string"
                        ? data
                        : data && typeof data === "object" && data !== null
                          ? null
                          : null
                setAiConsentAt(ts)
            } catch {
                if (!cancelled) setAiConsentAt(null)
            } finally {
                if (!cancelled) setAiConsentLoaded(true)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])
    const acceptAiConsent = async () => {
        const uid =
            clerkUserId ||
            (typeof window !== "undefined"
                ? (window as any).Clerk?.user?.id || ""
                : "")
        if (!uid) {
            /* Sin sesión, no podemos persistir — fallback a localStorage
               para no bloquear al invitado que igual cae al gate
               freemium después. */
            setAiConsentAt(new Date().toISOString())
            setAiConsentModalOpen(false)
            const pending = pendingAfterConsentRef.current
            pendingAfterConsentRef.current = null
            if (pending) pending()
            return
        }
        try {
            const token = await (window as any).Clerk?.session?.getToken?.()
            const r = await fetch(
                `${supabaseUrl}/functions/v1/user-action`,
                {
                    method: "POST",
                    headers: {
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        action: "set_ai_consent_at",
                        params: {},
                    }),
                }
            )
            const data = await r.json().catch(() => null)
            const ts =
                typeof data === "string"
                    ? data
                    : new Date().toISOString()
            setAiConsentAt(ts)
        } catch {
            /* Si la RPC falla, optimistic local. Reintenta en el
               próximo uso si la RPC vuelve a fallar. */
            setAiConsentAt(new Date().toISOString())
        }
        setAiConsentModalOpen(false)
        const pending = pendingAfterConsentRef.current
        pendingAfterConsentRef.current = null
        if (pending) pending()
    }
    const cancelAiConsent = () => {
        pendingAfterConsentRef.current = null
        setAiConsentModalOpen(false)
    }
    /* Freemium: 3 decodificaciones de por vida.
       v1.17 — Initial state hidrata desde cache localStorage por
       clerkUserId. Evita el flicker "3/3 → 1/3" al cargar. */
    const SHOTS_CACHE_PREFIX = "rsv-decoder-shots-"
    const initialShots = (() => {
        if (typeof window === "undefined") return null
        const uid =
            clerkUserId || (window as any).Clerk?.user?.id || ""
        if (!uid) return null
        try {
            const v = localStorage.getItem(SHOTS_CACHE_PREFIX + uid)
            const n = v == null ? null : Number(v)
            return Number.isFinite(n) && n !== null && n >= 0 ? n : null
        } catch {
            return null
        }
    })()
    const [freeShotsUsed, setFreeShotsUsed] = useState<number | null>(
        initialShots
    )
    const freeLimitReached =
        !hasUnlimitedDecoder && freeShotsUsed !== null && freeShotsUsed >= 3
    /* v1.29 — Invitación suave del tier 199 tras un escaneo del invitado.
       preUsed = conteo ANTES de este escaneo (valor del closure). Si aún
       quedan disparos, nudge gentil (no bloqueante) con delay para que el
       Tripulante vea su dictamen primero. Miembros / tier 199 no la ven. */
    const maybeSoftInvite = (preUsed: number | null) => {
        if (hasUnlimitedDecoder || !onSoftInvite) return
        const remaining = 3 - ((preUsed === null ? 0 : preUsed) + 1)
        if (remaining <= 0) return
        if (typeof window === "undefined") return
        window.setTimeout(() => onSoftInvite(remaining), 1100)
    }
    /* Lectura del conteo via gateway user-action (inyecta el clerk_user_id
       del token verificado). Fallback transitorio al REST directo hasta el
       REVOKE anon de get_my_decoder_scan_count (Lote F, post-build-live). */
    useEffect(() => {
        const uid =
            clerkUserId ||
            (typeof window !== "undefined"
                ? (window as any).Clerk?.user?.id || ""
                : "")
        if (!uid || !supabaseUrl || !supabaseAnonKey) return
        let cancelled = false
        const run = async () => {
            let count: any = null
            try {
                const token = await (
                    window as any
                ).Clerk?.session?.getToken?.()
                if (token) {
                    const gr = await fetch(
                        `${supabaseUrl}/functions/v1/user-action`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                apikey: supabaseAnonKey,
                                Authorization: `Bearer ${supabaseAnonKey}`,
                            },
                            body: JSON.stringify({
                                token,
                                action: "get_my_decoder_scan_count",
                                params: {},
                            }),
                        }
                    )
                    if (gr.ok) count = await gr.json()
                }
            } catch {}
            if (typeof count !== "number") {
                try {
                    const dr = await fetch(
                        `${supabaseUrl}/rest/v1/rpc/get_my_decoder_scan_count`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                apikey: supabaseAnonKey,
                                Authorization: `Bearer ${supabaseAnonKey}`,
                            },
                            body: JSON.stringify({ target_clerk_id: uid }),
                        }
                    )
                    count = await dr.json()
                } catch {}
            }
            if (cancelled) return
            const next = typeof count === "number" && count >= 0 ? count : 0
            setFreeShotsUsed(next)
            try {
                localStorage.setItem(SHOTS_CACHE_PREFIX + uid, String(next))
            } catch {}
        }
        run()
        return () => {
            cancelled = true
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const analyzerRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [phase, setPhase] = useState<
        | "idle"
        | "streaming"
        | "capturing"
        | "ocr"
        | "analyzing"
        | "result"
        | "error"
    >("idle")
    const [dictamen, setDictamen] = useState<DictamenResult | null>(null)
    /* #2 Materialización — la tarjeta del dictamen CRISTALIZA desde el campo
       (esquirlas de luz convergen a su centro) una sola vez por veredicto. */
    const dictamenCardRef = useRef<HTMLDivElement | null>(null)
    const dictamenMaterializedRef = useRef<boolean>(false)
    useEffect(() => {
        if (!dictamen) {
            dictamenMaterializedRef.current = false
            return
        }
        if (dictamenMaterializedRef.current) return
        const el = dictamenCardRef.current
        if (!el) return
        dictamenMaterializedRef.current = true
        const hudM = dictamen.dictamen_hud
        const mx = Math.max(
            hudM?.friccion_biologica ?? 0,
            hudM?.friccion_energetica ?? 0,
            hudM?.impacto_matriz ?? 0
        )
        const color = mx > 80 ? "#FF4646" : mx < 30 ? GOLD : "#D4A843"
        requestAnimationFrame(() => {
            const r = el.getBoundingClientRect()
            fireMaterialize(r.left + r.width / 2, r.top + r.height / 2, {
                color,
                count: 16,
                radius: 130,
            })
            /* #5 Estados de ánimo del campo — el veredicto tiñe la
               atmósfera: LIMPIO florece (aurora), TÓXICO tensa el campo
               (viñeta roja), intermedio irradia una onda ámbar neutra. */
            if (mx < 30) {
                fireAuroraBloom()
            } else if (mx > 80) {
                fireFieldTension({ color: "rgba(160,40,40,0.5)" })
            } else {
                fireFieldWave(
                    r.left + r.width / 2,
                    r.top + r.height / 2,
                    { color: "#D4A843" }
                )
            }
        })
    }, [dictamen])
    const [errorMsg, setErrorMsg] = useState<string>("")
    const [inputMode, setInputMode] = useState<"camera" | "text">("camera")
    const [matterName, setMatterName] = useState<string>("")
    /* v6.6 — Preview de galería: cuando el tripulante elige una foto
       desde su carrete, NO la mandamos al motor de inmediato. La
       enmarcamos en geometría limpia con el sello "Geometría visual
       capturada" + botón "Decodificar Materia" abajo. Al picar,
       previewZooming activa el zoom suave (~0.6s) y luego dispara
       sendToDecoder o el authGate según haya sesión. */
    const [pendingGalleryImage, setPendingGalleryImage] = useState<{
        base64: string
        mime: string
    } | null>(null)
    const [previewZooming, setPreviewZooming] = useState<boolean>(false)
    const [inputFocused, setInputFocused] = useState<boolean>(false)
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
    /* #3 Resonancia táctil — el botón DECODIFICAR "junta energía"
       mientras se mantiene presionado y la descarga en una onda al
       soltar. `decodeCharging` intensifica el glow (CSS transition); la
       onda sale por fireTouchRipple desde el centro del botón. */
    const [decodeCharging, setDecodeCharging] = useState<boolean>(false)
    type FrameQuality = "scanning" | "low" | "ready" | "dark"
    const [frameSignal, setFrameSignal] = useState<{
        quality: FrameQuality
        brightness: number
        edges: number
    }>({ quality: "scanning", brightness: 0, edges: 0 })

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            try {
                videoRef.current.pause()
                videoRef.current.srcObject = null
                videoRef.current.removeAttribute("src")
                videoRef.current.load()
            } catch {}
        }
    }

    const startCamera = async () => {
        if (freeLimitReached) {
            onFreemiumBlock?.()
            return
        }
        /* v1.18 — Gate de AI Consent: si el Tripulante no ha
           consentido el procesamiento por IA externa, pausamos aquí.
           El modal se abre y al aceptar invoca esta misma función
           pasando el consent como completado. */
        if (!requireAiConsent(() => startCamera())) return
        setErrorMsg("")
        setDictamen(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            })
            streamRef.current = stream
            setPhase("streaming")
        } catch (e: any) {
            console.error("[DECODER] getUserMedia error:", e)
            setErrorMsg(
                "Acceso al lente óptico denegado. Activa permisos de cámara."
            )
            setPhase("error")
        }
    }

    useEffect(() => {
        if (phase === "streaming" && streamRef.current && videoRef.current) {
            const v = videoRef.current
            v.srcObject = streamRef.current
            v.play().catch((err) => {
                console.warn("[DECODER] video.play() warning:", err)
            })
        }
    }, [phase])

    /* Frame quality analysis — firma de texto impreso (alta densidad de
       bordes + agrupado por filas + trazos verticales + alto contraste). */
    useEffect(() => {
        if (phase !== "streaming") return
        let alive = true
        const tick = () => {
            if (!alive) return
            const v = videoRef.current
            const c = analyzerRef.current
            if (!v || !c || v.videoWidth === 0) return
            const W = 96,
                H = 96
            c.width = W
            c.height = H
            const ctx = c.getContext("2d", { willReadFrequently: true })
            if (!ctx) return
            const vw = v.videoWidth,
                vh = v.videoHeight
            const cropW = vw * 0.6,
                cropH = vh * 0.7
            const sx = (vw - cropW) / 2,
                sy = (vh - cropH) / 2
            try {
                ctx.drawImage(v, sx, sy, cropW, cropH, 0, 0, W, H)
                const data = ctx.getImageData(0, 0, W, H).data
                const N = W * H
                const gray = new Uint8Array(N)
                let bSum = 0,
                    bSumSq = 0
                for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                    const g =
                        (data[i] * 0.299 +
                            data[i + 1] * 0.587 +
                            data[i + 2] * 0.114) |
                        0
                    gray[j] = g
                    bSum += g
                    bSumSq += g * g
                }
                const brightness = bSum / N
                const pixVar = bSumSq / N - brightness * brightness
                const pixStd = Math.sqrt(Math.max(0, pixVar))
                const rowEdges = new Uint16Array(H)
                let vertCnt = 0,
                    horzCnt = 0
                const TH = 32
                for (let y = 1; y < H - 1; y++) {
                    let cnt = 0
                    for (let x = 1; x < W - 1; x++) {
                        const i = y * W + x
                        const dx = Math.abs(gray[i + 1] - gray[i - 1])
                        const dy = Math.abs(gray[i + W] - gray[i - W])
                        if (dx > TH) {
                            vertCnt++
                            cnt++
                        }
                        if (dy > TH) {
                            horzCnt++
                            if (dx <= TH) cnt++
                        }
                    }
                    rowEdges[y] = cnt
                }
                const edges = (vertCnt + horzCnt) / (2 * N)
                let rowSum = 0
                for (let y = 0; y < H; y++) rowSum += rowEdges[y]
                const rowMean = rowSum / H
                let rowVar = 0
                for (let y = 0; y < H; y++) {
                    const d = rowEdges[y] - rowMean
                    rowVar += d * d
                }
                const rowStd = Math.sqrt(rowVar / H)
                const cv = rowMean > 1 ? rowStd / rowMean : 0
                const totalEdges = vertCnt + horzCnt
                const vertRatio = totalEdges > 0 ? vertCnt / totalEdges : 0

                let quality: FrameQuality
                if (brightness < 40) {
                    quality = "dark"
                } else if (pixStd < 22) {
                    quality = "scanning"
                } else if (
                    edges > 0.06 &&
                    cv > 0.55 &&
                    vertRatio > 0.32 &&
                    pixStd > 28
                ) {
                    quality = "ready"
                } else if (edges > 0.04 && pixStd > 24) {
                    quality = "low"
                } else {
                    quality = "scanning"
                }
                setFrameSignal({ quality, brightness, edges })
            } catch (e) {}
        }
        const id = window.setInterval(tick, 420)
        tick()
        return () => {
            alive = false
            window.clearInterval(id)
        }
    }, [phase])

    /* Pipeline OCR 2-etapas:
       1. extract-text con Cloud Vision DOCUMENT_TEXT_DETECTION.
       2. decode-matter con Gemini Flash con texto pre-extraído.
       Fallback graceful a modo visión si extract-text falla. */
    const sendToDecoder = async (
        base64: string,
        mime: string = "image/jpeg"
    ) => {
        let extractedText = ""
        /* Token de sesión de Clerk — el servidor lo verifica para autorizar
           el escaneo y aplicar el límite freemium (Ola A de seguridad). */
        let token: string | null = null
        try {
            token = (await (window as any).Clerk?.session?.getToken?.()) || null
        } catch {
            token = null
        }
        setPhase("ocr")
        try {
            const ocrRes = await fetch(
                `${supabaseUrl}/functions/v1/extract-text`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${supabaseAnonKey}`,
                        apikey: supabaseAnonKey,
                    },
                    body: JSON.stringify({ image_base64: base64, token }),
                }
            )
            if (ocrRes.ok) {
                const ocrJson = await ocrRes.json()
                if (
                    typeof ocrJson?.text === "string" &&
                    ocrJson.text.trim().length > 0
                ) {
                    extractedText = ocrJson.text
                }
            }
        } catch (e: any) {
            console.warn(
                "[DECODER] OCR fetch failed:",
                e,
                "— falling back to vision-only"
            )
        }

        setPhase("analyzing")
        try {
            const r = await fetch(`${supabaseUrl}/functions/v1/decode-matter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    apikey: supabaseAnonKey,
                },
                body: JSON.stringify({
                    image_base64: base64,
                    mime_type: mime,
                    extracted_text: extractedText,
                    token,
                }),
            })
            if (!r.ok) {
                let code = ""
                try {
                    code = JSON.parse(await r.text())?.error || ""
                } catch {}
                console.error("[DECODER] edge fn error:", r.status, code)
                if (r.status === 403 && code === "free_limit_reached") {
                    setPhase("idle")
                    onFreemiumBlock?.()
                    return
                }
                if (r.status === 401) {
                    setErrorMsg("Inicia sesión para usar el Decodificador.")
                    setPhase("error")
                    return
                }
                setErrorMsg(
                    "Interferencia con el núcleo de síntesis. Reintenta."
                )
                setPhase("error")
                return
            }
            const json = await r.json()
            setDictamen(json as DictamenResult)
            const hud = (json as DictamenResult)?.dictamen_hud
            const maxAxis = hud
                ? Math.max(
                      hud.friccion_biologica || 0,
                      hud.friccion_energetica || 0,
                      hud.impacto_matriz || 0
                  )
                : 0
            const resolvedClerkId =
                clerkUserId ||
                (typeof window !== "undefined"
                    ? (window as any).Clerk?.user?.id || ""
                    : "")
            /* SEÑAL CORRUPTA no cuenta — guard estricto. El registro real del
               escaneo lo hace decode-matter en el servidor (Ola A); acá solo
               movemos el badge de forma optimista. */
            if (resolvedClerkId && hud && hud.estado !== "SEÑAL CORRUPTA") {
                maybeSoftInvite(freeShotsUsed)
                setFreeShotsUsed((prev) => (prev === null ? 1 : prev + 1))
            }
            if (
                maxAxis > 80 &&
                typeof navigator !== "undefined" &&
                (navigator as any).vibrate
            ) {
                try {
                    ;(navigator as any).vibrate([120, 60, 120, 60, 200])
                } catch {}
            }
            setPhase("result")
        } catch (e: any) {
            console.error("[DECODER] fetch error:", e)
            setErrorMsg("Pérdida de señal con la bóveda. Reintenta.")
            setPhase("error")
        }
    }

    /* Codice de Materia (texto puro) — saltea OCR. */
    const sendMatterNameToDecoder = async (rawName: string) => {
        const cleanName = rawName.trim()
        if (cleanName.length < 2) {
            setErrorMsg("El Códice de Materia requiere al menos 2 caracteres.")
            return
        }
        if (freeLimitReached) {
            onFreemiumBlock?.()
            return
        }
        /* v6.5 — BAM auth gate. El invitado escribió su materia, el
           botón está dorado y vivo, el sistema iba a procesar — pero
           antes pedimos identificación. El input no se borra para que
           al volver, el texto siga ahí. */
        if (!isAuthed) {
            if (onUnauthedAttempt) onUnauthedAttempt()
            return
        }
        setErrorMsg("")
        setPhase("analyzing")
        let token: string | null = null
        try {
            token = (await (window as any).Clerk?.session?.getToken?.()) || null
        } catch {
            token = null
        }
        try {
            const r = await fetch(`${supabaseUrl}/functions/v1/decode-matter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    apikey: supabaseAnonKey,
                },
                body: JSON.stringify({ matter_name: cleanName, token }),
            })
            if (!r.ok) {
                let code = ""
                try {
                    code = JSON.parse(await r.text())?.error || ""
                } catch {}
                if (r.status === 403 && code === "free_limit_reached") {
                    setPhase("idle")
                    onFreemiumBlock?.()
                    return
                }
                if (r.status === 401) {
                    setErrorMsg("Inicia sesión para usar el Decodificador.")
                    setPhase("error")
                    return
                }
                setErrorMsg(
                    "Interferencia con el núcleo de síntesis. Reintenta."
                )
                setPhase("error")
                return
            }
            const json = (await r.json()) as DictamenResult
            setDictamen(json)
            const hud = json?.dictamen_hud
            const maxAxis = hud
                ? Math.max(
                      hud.friccion_biologica || 0,
                      hud.friccion_energetica || 0,
                      hud.impacto_matriz || 0
                  )
                : 0
            const resolvedClerkId =
                clerkUserId ||
                (typeof window !== "undefined"
                    ? (window as any).Clerk?.user?.id || ""
                    : "")
            /* Registro real server-side (decode-matter, Ola A); acá solo el
               badge optimista. */
            if (resolvedClerkId && hud && hud.estado !== "SEÑAL CORRUPTA") {
                maybeSoftInvite(freeShotsUsed)
                setFreeShotsUsed((prev) => (prev === null ? 1 : prev + 1))
            }
            if (
                maxAxis > 80 &&
                typeof navigator !== "undefined" &&
                (navigator as any).vibrate
            ) {
                try {
                    ;(navigator as any).vibrate([120, 60, 120, 60, 200])
                } catch {}
            }
            setPhase("result")
        } catch (e: any) {
            console.error("[DECODER] matter_name fetch error:", e)
            setErrorMsg("Pérdida de señal con la bóveda. Reintenta.")
            setPhase("error")
        }
    }

    const captureAndDecode = async () => {
        if (!videoRef.current || !canvasRef.current) return
        /* v6.5 — BAM auth gate al picar el botón central. La cámara
           se queda viva (no la apagamos) — el invitado vuelve a la
           misma vista al cerrar el modal y puede volver a intentar
           tras anclar sesión. */
        if (!isAuthed) {
            if (onUnauthedAttempt) onUnauthedAttempt()
            return
        }
        setPhase("capturing")
        const video = videoRef.current
        const canvas = canvasRef.current
        /* Resize defensivo: máximo 1400px lado largo (evita
           WORKER_RESOURCE_LIMIT de Supabase Edge). */
        const maxSide = 1400
        const scale = Math.min(
            1,
            maxSide / Math.max(video.videoWidth, video.videoHeight)
        )
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const base64 = canvas.toDataURL("image/jpeg", 0.82).split(",")[1]
        stopStream()
        await sendToDecoder(base64)
    }

    const handleGalleryUpload = () => {
        if (freeLimitReached) {
            onFreemiumBlock?.()
            return
        }
        /* v1.18 — Gate de AI Consent al abrir galería. */
        if (!requireAiConsent(() => handleGalleryUpload())) return
        setErrorMsg("")
        setDictamen(null)
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            /* v6.6 — Tras seleccionar foto, dejamos que el reader la
               normalice y luego la depositamos en pendingGalleryImage.
               El render principal cambia al preview de geometría
               capturada con su botón "Decodificar Materia". El
               envío real al motor ocurre cuando el tripulante toca
               ese botón (con zoom + dispatch o gate). */
            const reader = new FileReader()
            reader.onload = async () => {
                const dataUrl = reader.result as string
                const isPng =
                    file.type === "image/png" ||
                    dataUrl.startsWith("data:image/png")
                const img = new Image()
                img.onload = async () => {
                    const maxSide = 2000
                    const scale = Math.min(
                        1,
                        maxSide / Math.max(img.width, img.height)
                    )
                    const c = document.createElement("canvas")
                    c.width = Math.round(img.width * scale)
                    c.height = Math.round(img.height * scale)
                    const ctx = c.getContext("2d")
                    if (!ctx) return
                    if (isPng) {
                        ctx.fillStyle = "#ffffff"
                        ctx.fillRect(0, 0, c.width, c.height)
                    }
                    ctx.drawImage(img, 0, 0, c.width, c.height)
                    const dataOut = isPng
                        ? c.toDataURL("image/png")
                        : c.toDataURL("image/jpeg", 0.92)
                    const base64 = dataOut.split(",")[1]
                    const mime = isPng ? "image/png" : "image/jpeg"
                    /* v6.6 — Cargar al preview de geometría capturada
                       (foto enmarcada + texto + botón). El envío real
                       al motor sale del onClick del botón de abajo. */
                    setPendingGalleryImage({ base64, mime })
                    setPreviewZooming(false)
                }
                img.onerror = () => {
                    setErrorMsg("Archivo ilegible. Intenta otra imagen.")
                    setPhase("error")
                }
                img.src = dataUrl
            }
            reader.onerror = () => {
                setErrorMsg("No se pudo leer el archivo.")
                setPhase("error")
            }
            reader.readAsDataURL(file)
        }
        input.click()
    }

    const reset = () => {
        stopStream()
        setDictamen(null)
        setErrorMsg("")
        setPhase("idle")
    }

    useEffect(() => {
        return () => stopStream()
    }, [])

    /* Tri-axial palette por nivel del eje dominante. */
    const hud = dictamen?.dictamen_hud
    const fBio = hud?.friccion_biologica ?? 0
    const fEne = hud?.friccion_energetica ?? 0
    const fMat = hud?.impacto_matriz ?? 0
    const maxAxis = Math.max(fBio, fEne, fMat)
    const danger = maxAxis > 80
    const clean = maxAxis < 30
    const statusColor = danger
        ? "rgba(255,70,70,0.95)"
        : clean
          ? GOLD
          : "rgba(212,168,67,0.95)"
    const statusGlow = danger
        ? "rgba(255,40,40,0.28)"
        : clean
          ? "rgba(212,168,67,0.25)"
          : "rgba(212,168,67,0.2)"
    /* v1.36 — Forma HEX del color de estado. statusColor es rgba para
       danger/medio, y hx() SOLO acepta hex → hx(statusHex) producía color
       inválido (tarjeta apagada/rota). statusHex alimenta a hx() bien. */
    const statusHex = danger ? "#FF4646" : clean ? GOLD : "#D4A843"
    const axisColor = (v: number) =>
        v > 80
            ? "rgba(255,70,70,0.95)"
            : v > 50
              ? "rgba(255,140,60,0.95)"
              : v > 25
                ? "rgba(212,168,67,0.95)"
                : "rgba(90,220,180,0.95)"
    const axisGlow = (v: number) =>
        v > 80
            ? "rgba(255,40,40,0.5)"
            : v > 50
              ? "rgba(255,120,40,0.4)"
              : v > 25
                ? "rgba(212,168,67,0.4)"
                : "rgba(90,220,180,0.35)"

    /* v1.18 — Modal de AI Consent. Portaleado a document.body con
       AnimatePresence para fade-in/out. Aparece cuando
       aiConsentModalOpen es true (lo abre `requireAiConsent` desde
       startCamera/handleGalleryUpload cuando el Tripulante aún no
       ha consentido). Al aceptar persiste via RPC set_ai_consent_at
       y dispara la acción pendiente. */
    const aiConsentModalNode =
        typeof document === "undefined"
            ? null
            : createPortal(
                  <AnimatePresence>
                      {aiConsentModalOpen && (
                          <motion.div
                              key="ai-consent-modal"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.28 }}
                              style={{
                                  position: "fixed",
                                  inset: 0,
                                  zIndex: 2147483646,
                                  background: "rgba(2,5,14,0.85)",
                                  backdropFilter: "blur(18px) saturate(140%)",
                                  WebkitBackdropFilter:
                                      "blur(18px) saturate(140%)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 24,
                              }}
                          >
                              <motion.div
                                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                  transition={{
                                      duration: 0.42,
                                      ease: [0.16, 1, 0.3, 1],
                                  }}
                                  style={{
                                      maxWidth: 460,
                                      width: "100%",
                                      borderRadius: 18,
                                      padding: isMobile ? "26px 22px" : "32px 30px",
                                      background:
                                          "linear-gradient(165deg,rgba(10,28,52,0.96),rgba(6,18,38,0.98))",
                                      border: `1px solid ${hx(accent, 0.32)}`,
                                      boxShadow: `0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 ${hx("#FFFFFF", 0.08)}, 0 0 0 0.5px ${hx(accent, 0.18)}`,
                                      fontFamily: "'Inter',sans-serif",
                                      color: "rgba(232,238,247,0.9)",
                                  }}
                              >
                                  <p
                                      style={{
                                          margin: 0,
                                          fontSize: 11,
                                          letterSpacing: "0.36em",
                                          textTransform: "uppercase",
                                          color: hx(accent, 0.7),
                                          fontWeight: 500,
                                          textAlign: "center",
                                      }}
                                  >
                                      Procesamiento por IA externa
                                  </p>
                                  <h2
                                      style={{
                                          margin: "12px 0 18px",
                                          fontSize: isMobile ? 18 : 21,
                                          fontWeight: 300,
                                          letterSpacing: "0.04em",
                                          color: "#FFFFFF",
                                          textAlign: "center",
                                          textShadow: `0 0 22px ${hx(accent, 0.35)}`,
                                      }}
                                  >
                                      Consentimiento del Decodificador
                                  </h2>
                                  <p
                                      style={{
                                          margin: "0 0 14px",
                                          fontSize: 13.5,
                                          lineHeight: 1.7,
                                          fontWeight: 300,
                                          color: "rgba(232,238,247,0.82)",
                                      }}
                                  >
                                      Para decodificar la materia vamos a
                                      enviar tu fotografía a los servicios
                                      de{" "}
                                      <span style={{ color: hx(accent, 0.95) }}>
                                          Google Cloud Vision
                                      </span>{" "}
                                      y{" "}
                                      <span style={{ color: hx(accent, 0.95) }}>
                                          Google Gemini
                                      </span>
                                      . La imagen se procesa para extraer
                                      texto y composición; Google puede
                                      retenerla temporalmente según sus
                                      políticas. El dictamen queda guardado
                                      en tu cuenta.
                                  </p>
                                  <p
                                      style={{
                                          margin: "0 0 22px",
                                          fontSize: 12,
                                          lineHeight: 1.65,
                                          fontWeight: 300,
                                          color: "rgba(232,238,247,0.55)",
                                      }}
                                  >
                                      Aceptás una sola vez por cuenta — el
                                      consentimiento aplica en todos tus
                                      dispositivos. Podés revocarlo desde
                                      Mi Núcleo en cualquier momento.
                                  </p>
                                  <div
                                      style={{
                                          display: "flex",
                                          flexDirection: isMobile
                                              ? "column"
                                              : "row",
                                          gap: 10,
                                          justifyContent: "flex-end",
                                      }}
                                  >
                                      <button
                                          onClick={cancelAiConsent}
                                          style={{
                                              padding: "12px 24px",
                                              borderRadius: 10,
                                              background: "rgba(255,255,255,0.04)",
                                              border: "1px solid rgba(255,255,255,0.12)",
                                              color: "rgba(255,255,255,0.65)",
                                              fontSize: 11,
                                              letterSpacing: "0.24em",
                                              textTransform: "uppercase",
                                              fontWeight: 400,
                                              cursor: "pointer",
                                              outline: "none",
                                              fontFamily: "'Inter',sans-serif",
                                              WebkitTapHighlightColor:
                                                  "transparent",
                                          }}
                                      >
                                          Cancelar
                                      </button>
                                      <button
                                          onClick={acceptAiConsent}
                                          style={{
                                              padding: "12px 24px",
                                              borderRadius: 10,
                                              background: hx(accent, 0.14),
                                              border: `1px solid ${hx(accent, 0.55)}`,
                                              color: hx(accent, 0.98),
                                              fontSize: 11,
                                              letterSpacing: "0.24em",
                                              textTransform: "uppercase",
                                              fontWeight: 500,
                                              cursor: "pointer",
                                              outline: "none",
                                              fontFamily: "'Inter',sans-serif",
                                              boxShadow: `0 0 18px ${hx(accent, 0.32)}, inset 0 0 12px ${hx(accent, 0.1)}`,
                                              WebkitTapHighlightColor:
                                                  "transparent",
                                          }}
                                      >
                                          Acepto y continuar
                                      </button>
                                  </div>
                              </motion.div>
                          </motion.div>
                      )}
                  </AnimatePresence>,
                  document.body
              )

    /* ── IDLE (pre-stream) ── */
    if (phase === "idle" && pendingGalleryImage) {
        /* v6.6 — Preview de galería: foto enmarcada en geometría
           cyan + sello "Geometría visual capturada" + botón dorado
           "Decodificar Materia" + opción "Cambiar foto". Al picar el
           botón principal, la foto hace zoom suave (~0.6s) y luego
           dispara sendToDecoder o triggerea el authGate. */
        const handleDecodeFromPreview = () => {
            setPreviewZooming(true)
            setTimeout(() => {
                if (!isAuthed) {
                    if (onUnauthedAttempt) onUnauthedAttempt()
                    setPreviewZooming(false)
                    return
                }
                const img = pendingGalleryImage
                setPendingGalleryImage(null)
                setPreviewZooming(false)
                if (img) sendToDecoder(img.base64, img.mime)
            }, 600)
        }
        const previewSrc = `data:${pendingGalleryImage.mime};base64,${pendingGalleryImage.base64}`
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 22,
                    flex: 1,
                    minHeight: 400,
                    padding: isMobile ? "32px 20px 24px" : "40px 24px",
                    width: "100%",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        fontSize: isMobile ? 11 : 12,
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: hx("#00E5FF", 0.7),
                        fontFamily: "'Inter',sans-serif",
                        fontWeight: 400,
                        textShadow: "0 0 12px rgba(0,229,255,0.35)",
                    }}
                >
                    Geometría visual capturada
                </motion.div>
                <motion.div
                    animate={{
                        scale: previewZooming ? 1.06 : 1,
                        boxShadow: previewZooming
                            ? "0 0 60px rgba(0,229,255,0.5), inset 0 0 40px rgba(0,229,255,0.18)"
                            : "0 0 32px rgba(0,229,255,0.22), inset 0 0 18px rgba(0,229,255,0.08)",
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: "relative",
                        width: isMobile ? "92%" : 380,
                        maxWidth: 420,
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid rgba(0,229,255,0.42)",
                        background: "rgba(2,8,20,0.6)",
                    }}
                >
                    <img
                        src={previewSrc}
                        alt="Geometría capturada"
                        style={{
                            display: "block",
                            width: "100%",
                            height: "auto",
                            maxHeight: isMobile ? 360 : 420,
                            objectFit: "cover",
                        }}
                    />
                    {/* Esquinas geométricas para enmarcar */}
                    {[
                        { top: 8, left: 8, br: "8px 0 0 0" },
                        { top: 8, right: 8, br: "0 8px 0 0" },
                        { bottom: 8, left: 8, br: "0 0 0 8px" },
                        { bottom: 8, right: 8, br: "0 0 8px 0" },
                    ].map((c, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: "absolute",
                                width: 22,
                                height: 22,
                                borderTop:
                                    idx < 2
                                        ? "1.5px solid rgba(0,229,255,0.85)"
                                        : "none",
                                borderBottom:
                                    idx >= 2
                                        ? "1.5px solid rgba(0,229,255,0.85)"
                                        : "none",
                                borderLeft:
                                    idx === 0 || idx === 2
                                        ? "1.5px solid rgba(0,229,255,0.85)"
                                        : "none",
                                borderRight:
                                    idx === 1 || idx === 3
                                        ? "1.5px solid rgba(0,229,255,0.85)"
                                        : "none",
                                top: c.top,
                                left: c.left,
                                right: c.right,
                                bottom: c.bottom,
                                borderRadius: c.br,
                                pointerEvents: "none",
                            }}
                        />
                    ))}
                </motion.div>
                <motion.button
                    type="button"
                    whileHover={{ scale: previewZooming ? 1 : 1.03 }}
                    whileTap={{ scale: previewZooming ? 1 : 0.96 }}
                    onClick={handleDecodeFromPreview}
                    disabled={previewZooming}
                    style={{
                        padding: isMobile ? "14px 28px" : "15px 36px",
                        borderRadius: 14,
                        border: `1.5px solid ${hx(GOLD, 0.62)}`,
                        background: `linear-gradient(135deg, ${hx(GOLD, 0.34)}, ${hx(GOLD, 0.14)})`,
                        color: GOLD,
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 700,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        fontFamily: "'Inter',sans-serif",
                        cursor: previewZooming ? "default" : "pointer",
                        outline: "none",
                        boxShadow: `0 6px 24px ${hx(GOLD, 0.28)}, inset 0 1px 0 ${hx("#FFFFFF", 0.16)}`,
                        opacity: previewZooming ? 0.7 : 1,
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                    }}
                >
                    Decodificar Materia
                </motion.button>
                <button
                    type="button"
                    onClick={() => {
                        setPendingGalleryImage(null)
                        setPreviewZooming(false)
                    }}
                    disabled={previewZooming}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 11,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        cursor: previewZooming ? "default" : "pointer",
                        fontFamily: "'Inter',sans-serif",
                        outline: "none",
                        padding: "6px 14px",
                        opacity: previewZooming ? 0.4 : 1,
                    }}
                >
                    Cambiar foto
                </button>
            </motion.div>
        )
    }
    if (phase === "idle") {
        return (
            <motion.div
                /* v1.38 — La capa idle se desvanece como UNA unidad al volver
                   al hub: título + back + cuerpo se van JUNTOS (la pill, que
                   está portaleada aparte, lleva su propio exit). Antes solo el
                   cuerpo tenía exit → el título y la pill quedaban un instante
                   y desaparecían de golpe. */
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    width: "100%",
                    minHeight: 400,
                }}
            >
                {/* v1.18 — Modal de AI Consent. Portaleado a
                    document.body, no afecta el layout del idle. */}
                {aiConsentModalNode}
                {/* v1.7 — Mobile: el título vive en su PROPIO wrapper
                    arriba, alineado a la izquierda con padding-left 4
                    (matchea Protocolos y Holoteca). El resto del
                    contenido del Decodificador queda en el wrapper
                    siguiente con alignItems center + textAlign center
                    para que los botones DECODIFICAR y CARGAR DESDE
                    GALERÍA queden centrados como antes. */}
                {isMobile && (
                    <div
                        style={{
                            /* env(safe-area-inset-top) empuja el título por
                               la altura del notch SOLO en PWA standalone.
                               Web normal: env() = 0, queda en 4px. */
                            paddingTop:
                                "calc(4px + env(safe-area-inset-top, 0px))",
                            paddingLeft: 0,
                            paddingRight: 0,
                            width: "100%",
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            /* v1.37 — gap 12 (gemelo del header de Sueños). */
                            gap: 12,
                        }}
                    >
                        {/* v1.37 — Botón de regreso al hub, gemelo del de
                            Sueños (38×38, mismo radio) pero en dorado. */}
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                aria-label="Volver a los decodificadores"
                                style={{
                                    flexShrink: 0,
                                    width: 38,
                                    height: 38,
                                    borderRadius: 12,
                                    border: `1px solid ${hx(GOLD, 0.4)}`,
                                    background: `linear-gradient(135deg, ${hx(GOLD, 0.16)}, ${hx(GOLD, 0.05)})`,
                                    color: hx(GOLD, 0.95),
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    fontWeight: 300,
                                    lineHeight: 1,
                                    boxShadow: `0 0 14px ${hx(GOLD, 0.14)}, inset 0 1px 0 rgba(255,225,150,0.18)`,
                                    backdropFilter: "blur(6px)",
                                    WebkitBackdropFilter: "blur(6px)",
                                    outline: "none",
                                }}
                            >
                                ‹
                            </button>
                        )}
                        {/* v1.37 — Título idéntico al de Sueños (misma altura,
                            mismo salto de línea, mismo estilo) pero en DORADO
                            en vez del cyan (que era como el de Holoteca). */}
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            <div
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 300,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "transparent",
                                    background: `linear-gradient(180deg, ${GOLD}, #fff)`,
                                    WebkitBackgroundClip: "text",
                                    backgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    lineHeight: 1.2,
                                    filter: `drop-shadow(0 0 10px ${hx(GOLD, 0.3)})`,
                                    userSelect: "none",
                                    /* v1.37 — maxWidth fuerza el mismo salto de
                                       línea que el de Sueños: "Decodificador de"
                                       en la 1ª línea y "Materia" en la 2ª (igual
                                       que "Decodificador de / Sueños"). */
                                    maxWidth: 200,
                                }}
                            >
                                Decodificador de Materia
                            </div>
                        </motion.div>
                    </div>
                )}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: isMobile ? "flex-start" : "center",
                    gap: 28,
                    flex: 1,
                    textAlign: "center",
                    /* v1.21 — paddingTop mobile sube a 170 (antes 138).
                       Con el chip 3/3 mudado a la esquina superior
                       DERECHA y la pill LENTE/CÓDICE bajada a top:50,
                       el contenido necesita más cabecera para que la
                       descripción y el botón DECODIFICAR queden
                       cómodos debajo de la pill.
                       v1.23 — paddingBottom mobile sube a
                       `calc(120px + env(safe-area-inset-bottom))`.
                       v1.24 — paddingBottom mobile sube a 200px +
                       safe-area-inset-bottom. En Brave/Safari iOS
                       web (no PWA) el viewport con `100vh` incluye
                       la altura de la toolbar inferior del browser,
                       y la BottomNav del shell mobile se suma encima
                       — el buffer 120 px no era suficiente. 200 px
                       + safe (~34 px) = 234 px de colchón cubre
                       browser toolbar (~50 px) + BottomNav shell
                       (~70 px) + respiración. Desktop sigue en 80.
                       v1.37 — paddingTop mobile baja de 170 a 84: con el
                       título dorado compacto arriba, el bloque inferior sube
                       y queda menos abajo. Sigue librando la pill flotante
                       (top:50) con holgura. */
                    padding: isMobile
                        ? "calc(74px + env(safe-area-inset-top, 0px)) 20px calc(200px + env(safe-area-inset-bottom, 0px))"
                        : "32px 20px 80px",
                }}
            >
                {/* Desktop: título grande aquí, mobile: ya renderizado arriba. */}
                <motion.div
                    initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
                    animate={{ opacity: isMobile ? 0 : 1, y: 0 }}
                    transition={{ duration: isMobile ? 0 : 0.8 }}
                    style={
                        isMobile ? { display: "none" } : undefined
                    }
                >
                    <h2
                        style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: isMobile ? 14 : 72,
                            fontWeight: isMobile ? 200 : 100,
                            letterSpacing: isMobile ? "0.22em" : "0.4em",
                            marginRight: isMobile ? "-0.22em" : "-0.4em",
                            textTransform: "uppercase",
                            margin: 0,
                            lineHeight: 1,
                            userSelect: "none",
                            color: "transparent",
                            filter: `drop-shadow(0 0 ${isMobile ? 10 : 12}px ${hx(GOLD, isMobile ? 0.3 : 0.25)})`,
                            WebkitFontSmoothing: "antialiased",
                            animation:
                                "esc-nuc-breath 7s ease-in-out infinite",
                            whiteSpace: isMobile ? "nowrap" : "normal",
                        }}
                    >
                        {["Decodificador", "de", "Materia"].map(
                            (word, i, arr) => (
                                <React.Fragment key={i}>
                                    <span
                                        style={{
                                            background: `linear-gradient(180deg, ${GOLD}, #fff)`,
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                        }}
                                    >
                                        {word}
                                    </span>
                                    {i < arr.length - 1 && " "}
                                </React.Fragment>
                            )
                        )}
                    </h2>
                </motion.div>
                {showInfoModal &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.24 }}
                            onClick={() => setShowInfoModal(false)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 1300,
                                background: "rgba(2,5,12,0.88)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "24px 18px",
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                                transition={{
                                    duration: 0.32,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: "relative",
                                    width: "min(440px, 100%)",
                                    padding: "38px 28px 28px",
                                    borderRadius: 22,
                                    background:
                                        "radial-gradient(ellipse at top, rgba(0,229,255,0.1) 0%, rgba(2,8,20,0.95) 50%, rgba(2,8,20,0.98) 100%)",
                                    border: "1.5px solid rgba(0,229,255,0.35)",
                                    boxShadow:
                                        "0 30px 80px rgba(0,229,255,0.2), 0 0 100px rgba(0,229,255,0.08)",
                                    fontFamily: "'Inter', sans-serif",
                                    color: "#FFFFFF",
                                    textAlign: "center",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowInfoModal(false)}
                                    aria-label="Cerrar"
                                    style={{
                                        position: "absolute",
                                        top: 14,
                                        right: 14,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        border: "1px solid rgba(0,229,255,0.3)",
                                        background: "transparent",
                                        color: "#00E5FF",
                                        cursor: "pointer",
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    ×
                                </button>
                                <div
                                    style={{
                                        fontSize: 10,
                                        letterSpacing: "0.3em",
                                        textTransform: "uppercase",
                                        color: "rgba(0,229,255,0.75)",
                                        marginBottom: 12,
                                    }}
                                >
                                    ✦ Decodificador de Materia
                                </div>
                                <h2
                                    style={{
                                        margin: "0 0 16px",
                                        fontSize: 22,
                                        fontWeight: 300,
                                        letterSpacing: "0.06em",
                                        color: "#FFFFFF",
                                        textShadow:
                                            "0 0 18px rgba(0,229,255,0.3)",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    Tres escaneos exploratorios
                                </h2>
                                <p
                                    style={{
                                        margin: "0 auto 22px",
                                        fontSize: 13.5,
                                        fontWeight: 300,
                                        lineHeight: 1.7,
                                        color: "rgba(255,255,255,0.85)",
                                        maxWidth: 360,
                                    }}
                                >
                                    Tu acceso de invitado incluye
                                    <br />
                                    <strong style={{ color: "#00E5FF", whiteSpace: "nowrap" }}>
                                        3 decodificaciones
                                    </strong>{" "}
                                    para que pruebes el núcleo de síntesis. Cada
                                    escaneo exitoso consume uno; los fallos no
                                    cuentan.
                                </p>
                                <p
                                    style={{
                                        margin: "0 auto 24px",
                                        fontSize: 13.5,
                                        fontWeight: 300,
                                        lineHeight: 1.7,
                                        color: "rgba(255,255,255,0.7)",
                                        maxWidth: 360,
                                    }}
                                >
                                    Para escaneos ilimitados, acceso a la
                                    biblioteca completa de Calibraciones y
                                    todos los ciclos del Radar, activa tu
                                    canal de Sintonía Solar.
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (typeof window === "undefined")
                                            return
                                        const dest =
                                            withCheckoutIdentity(
                                                SINTONIA_SOLAR_LINK
                                            ) || SINTONIA_SOLAR_LINK
                                        if (!dest) return
                                        try {
                                            window.location.href = dest
                                        } catch {
                                            try {
                                                window.location.assign(dest)
                                            } catch {}
                                        }
                                    }}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        maxWidth: 340,
                                        padding: "14px 22px",
                                        borderRadius: 14,
                                        border: "1px solid rgba(232,198,90,0.7)",
                                        /* v1.16 — Gradient base de 3 stops:
                                           bronce profundo → dorado solar →
                                           ámbar claro. Da volumen real al
                                           botón en lugar de un degradé
                                           plano. Sumado al inset highlight
                                           superior y al drop shadow más
                                           profundo, se siente como una
                                           pieza metálica no plana. */
                                        background:
                                            "linear-gradient(135deg, rgba(178,128,42,0.85) 0%, rgba(232,198,90,0.65) 50%, rgba(255,228,150,0.55) 100%)",
                                        color: "#1A0D02",
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 4,
                                        margin: "0 auto",
                                        cursor: "pointer",
                                        outline: "none",
                                        overflow: "hidden",
                                        boxShadow:
                                            "0 8px 32px rgba(212,168,67,0.45), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,243,200,0.6), inset 0 -2px 8px rgba(120,80,20,0.35)",
                                        transition: "transform 0.18s ease, box-shadow 0.18s ease",
                                        textShadow: "0 1px 0 rgba(255,243,200,0.55)",
                                    }}
                                    aria-label="Activar Sintonía Solar · 599 MXN/mes"
                                >
                                    {/* v1.16 — Shimmer diagonal animado.
                                        Capa absoluta con gradient claro
                                        que cruza el botón cada 3.6s,
                                        dándole un brillo metálico
                                        viviente. mix-blend overlay para
                                        que potencie el gradient base. */}
                                    <motion.span
                                        aria-hidden="true"
                                        initial={{ x: "-110%" }}
                                        animate={{ x: ["-110%", "120%"] }}
                                        transition={{
                                            duration: 3.6,
                                            ease: "easeInOut",
                                            repeat: Infinity,
                                            repeatDelay: 1.4,
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "55%",
                                            height: "100%",
                                            background:
                                                "linear-gradient(105deg, transparent 0%, rgba(255,250,220,0.55) 50%, transparent 100%)",
                                            mixBlendMode: "overlay",
                                            pointerEvents: "none",
                                        }}
                                    />
                                    <span style={{ position: "relative", zIndex: 1 }}>
                                        Activar Sintonía Solar
                                    </span>
                                    <span
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            letterSpacing: "0.14em",
                                            color: "rgba(26,13,2,0.78)",
                                        }}
                                    >
                                        599 MXN/mes
                                    </span>
                                </button>
                            </motion.div>
                        </motion.div>,
                        document.body
                    )}
                {/* v1.16 — Pill "Lente Óptico / Códice de Materia"
                    sale del flow inline y se portalea fixed top:14
                    centrada arriba como tab-bar persistente. Antes
                    quedaba dentro del cuerpo del decoder (después del
                    título grande en desktop, ~60px abajo del chip 3/3
                    en mobile); ahora flota ARRIBA encima de todo,
                    consistente con el patrón de barras de navegación
                    nativas. El badge X/3 (top:72) queda DEBAJO. */}
                {!hideForOverlay &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <motion.div
                            /* v1.37 — Fade-in al montar: el selector entra
                               junto con el resto de la capa (antes "aparecía"
                               de golpe, suelto, antes que los demás elementos).
                               Solo opacity → no pisa el translateX(-50%).
                               v1.38 — exit para desvanecerse JUNTO con la capa
                               idle al volver al hub (está portaleado, así que
                               no hereda el fade del wrapper). */
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            style={{
                                position: "fixed",
                                /* env(safe-area-inset-top) baja la pill
                                   bajo el notch SOLO en PWA standalone.
                                   v1.21 — Mobile sube de 36 a 50 para
                                   ganar respiración respecto al título
                                   HOLOTECA-style del shell. Desktop
                                   sigue en 14 (centrado en su row con
                                   el chip 3/3 en el extremo derecho). */
                                top: isMobile
                                    ? "calc(66px + env(safe-area-inset-top, 0px))"
                                    : 14,
                                left: "50%",
                                transform: "translateX(-50%)",
                                zIndex: 65,
                                display: "inline-flex",
                                flexDirection: "row",
                                flexWrap: "nowrap",
                                alignItems: "center",
                                gap: isMobile ? 4 : 6,
                                padding: isMobile ? 5 : 6,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.14)",
                                background:
                                    "linear-gradient(135deg, rgba(8,18,34,0.78), rgba(5,12,24,0.88))",
                                boxShadow:
                                    "0 6px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                                fontFamily: "'Inter',sans-serif",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {(
                                [
                                    { id: "camera", label: "Lente Óptico" },
                                    { id: "text", label: "Texto" },
                                ] as const
                            ).map((opt) => {
                                const active = inputMode === opt.id
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setInputMode(opt.id)
                                            setErrorMsg("")
                                        }}
                                        style={{
                                            padding: isMobile
                                                ? "10px 16px"
                                                : "12px 22px",
                                            borderRadius: 999,
                                            border: active
                                                ? "1px solid rgba(0,229,255,0.4)"
                                                : "1px solid transparent",
                                            background: active
                                                ? "linear-gradient(135deg, rgba(0,229,255,0.14), rgba(0,229,255,0.04))"
                                                : "transparent",
                                            color: active
                                                ? "#00E5FF"
                                                : "rgba(255,255,255,0.85)",
                                            fontSize: isMobile ? 10.5 : 11.5,
                                            fontWeight: 600,
                                            letterSpacing: isMobile
                                                ? "0.12em"
                                                : "0.18em",
                                            textTransform: "uppercase",
                                            cursor: "pointer",
                                            fontFamily: "'Inter',sans-serif",
                                            outline: "none",
                                            boxShadow: active
                                                ? "0 0 18px rgba(0,229,255,0.18)"
                                                : "none",
                                            transition: "all 0.2s ease",
                                            whiteSpace: "nowrap",
                                            lineHeight: 1.15,
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </motion.div>,
                        document.body
                    )}
                <p
                    style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.85)",
                        fontFamily: "'Inter',sans-serif",
                        lineHeight: 1.7,
                        maxWidth: 400,
                    }}
                >
                    {inputMode === "camera"
                        ? "Enfoca la etiqueta de ingredientes. El núcleo de síntesis emitirá el dictamen termodinámico."
                        : "Escribe el nombre exacto del ingrediente o materia."}
                </p>
                {inputMode === "camera" && (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.94 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 18,
                            }}
                            onPointerDown={() => setDecodeCharging(true)}
                            onPointerUp={(e) => {
                                /* DESCARGA — onda dorada desde el centro
                                   del botón (la energía acumulada se libera). */
                                const r =
                                    e.currentTarget.getBoundingClientRect()
                                fireTouchRipple(
                                    r.left + r.width / 2,
                                    r.top + r.height / 2,
                                    { color: GOLD, size: 240, duration: 640 }
                                )
                                setDecodeCharging(false)
                            }}
                            onPointerCancel={() => setDecodeCharging(false)}
                            onPointerLeave={() => setDecodeCharging(false)}
                            onClick={startCamera}
                            style={{
                                position: "relative",
                                width: isMobile ? 200 : 230,
                                height: isMobile ? 200 : 230,
                                borderRadius: "50%",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                outline: "none",
                                padding: 0,
                                /* #3 — carga de energía: glow oro más
                                   intenso al mantener presionado. */
                                filter: decodeCharging
                                    ? `drop-shadow(0 0 26px ${hx(GOLD, 0.75)})`
                                    : "drop-shadow(0 0 0px rgba(0,0,0,0))",
                                transition: "filter 140ms ease",
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 28,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    border: `1px dashed ${hx(GOLD, 0.35)}`,
                                }}
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{
                                    duration: 40,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 14,
                                    borderRadius: "50%",
                                    /* v1.30 — acento cian (dualidad oro+cian
                                       del hub de Decodificadores). */
                                    border: `1px solid ${hx(CYAN, 0.3)}`,
                                }}
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.06, 1],
                                    opacity: [0.55, 0.95, 0.55],
                                }}
                                transition={{
                                    duration: 3.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 26,
                                    borderRadius: "50%",
                                    border: `1px solid ${hx(GOLD, 0.55)}`,
                                    boxShadow: `0 0 36px ${hx(GOLD, 0.45)}, inset 0 0 28px ${hx(GOLD, 0.2)}`,
                                }}
                            />
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        `0 0 30px ${hx(GOLD, 0.4)}, inset 0 0 30px ${hx(GOLD, 0.25)}`,
                                        `0 0 60px ${hx(GOLD, 0.6)}, inset 0 0 45px ${hx(GOLD, 0.4)}`,
                                        `0 0 30px ${hx(GOLD, 0.4)}, inset 0 0 30px ${hx(GOLD, 0.25)}`,
                                    ],
                                }}
                                transition={{
                                    duration: 3.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 44,
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 50% 50%, ${hx(GOLD, 0.45)} 0%, ${hx(GOLD, 0.12)} 55%, rgba(2,8,20,0.9) 100%)`,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 9,
                                }}
                            >
                                {/* v1.30 — Emblema central: cristal
                                    prismático facetado (eco del sello
                                    MateriaSigil del hub de Decodificadores)
                                    con gradiente oro→cian, anillo orbital
                                    cian fino y chispas titilando. Reemplaza el
                                    crosshair plano por algo vivo. Va detrás
                                    del rótulo DECODIFICAR, respira con el
                                    mismo tempo. */}
                                <motion.svg
                                    viewBox="0 0 100 100"
                                    animate={{ scale: [0.95, 1.05, 0.95] }}
                                    transition={{
                                        duration: 3.4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        width: isMobile ? 72 : 92,
                                        height: isMobile ? 72 : 92,
                                        overflow: "visible",
                                        filter: `drop-shadow(0 0 7px ${hx(GOLD, 0.6)})`,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="evd-crys"
                                            x1="0"
                                            y1="0"
                                            x2="1"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#FBE6A8"
                                            />
                                            <stop
                                                offset="45%"
                                                stopColor={GOLD}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor={CYAN}
                                            />
                                        </linearGradient>
                                    </defs>
                                    {/* anillo orbital fino — acento cian */}
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 24,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                        style={{
                                            transformBox: "fill-box",
                                            transformOrigin: "center",
                                        }}
                                    >
                                        <ellipse
                                            cx="50"
                                            cy="50"
                                            rx="46"
                                            ry="17"
                                            stroke={hx(CYAN, 0.42)}
                                            strokeWidth="0.8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="96"
                                            cy="50"
                                            r="2"
                                            fill={CYAN}
                                        />
                                    </motion.g>
                                    {/* cristal hexagonal facetado */}
                                    <polygon
                                        points="50,20 73,36 73,64 50,80 27,64 27,36"
                                        fill="url(#evd-crys)"
                                        fillOpacity="0.92"
                                        stroke="#FFFFFF"
                                        strokeOpacity="0.55"
                                        strokeWidth="0.7"
                                    />
                                    <polygon
                                        points="50,20 50,80 27,64 27,36"
                                        fill="#FFFFFF"
                                        fillOpacity="0.14"
                                    />
                                    <line
                                        x1="50"
                                        y1="20"
                                        x2="50"
                                        y2="80"
                                        stroke="#FFFFFF"
                                        strokeOpacity="0.5"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="27"
                                        y1="36"
                                        x2="73"
                                        y2="64"
                                        stroke="#FFFFFF"
                                        strokeOpacity="0.3"
                                        strokeWidth="0.4"
                                    />
                                    <line
                                        x1="73"
                                        y1="36"
                                        x2="27"
                                        y2="64"
                                        stroke="#FFFFFF"
                                        strokeOpacity="0.3"
                                        strokeWidth="0.4"
                                    />
                                    {/* chispas titilando */}
                                    {(
                                        [
                                            [16, 26, 1.5],
                                            [86, 30, 1.2],
                                            [84, 74, 1.4],
                                            [16, 72, 1.1],
                                        ] as [number, number, number][]
                                    ).map(([cx, cy, r], i) => (
                                        <motion.circle
                                            key={i}
                                            cx={cx}
                                            cy={cy}
                                            r={r}
                                            fill="#FFFFFF"
                                            animate={{
                                                opacity: [0.2, 1, 0.2],
                                                scale: [0.8, 1.3, 0.8],
                                            }}
                                            transition={{
                                                duration: 2.4,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: i * 0.5,
                                            }}
                                            style={{
                                                transformBox: "fill-box",
                                                transformOrigin: "center",
                                            }}
                                        />
                                    ))}
                                </motion.svg>
                                <motion.span
                                    animate={{ opacity: [0.85, 1, 0.85] }}
                                    transition={{
                                        duration: 2.4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        fontSize: isMobile ? 13 : 14,
                                        fontWeight: 600,
                                        color: GOLD,
                                        letterSpacing: "0.28em",
                                        textAlign: "center",
                                        fontFamily: "'Inter',sans-serif",
                                        textShadow: `0 0 14px ${hx(GOLD, 0.8)}`,
                                        position: "relative",
                                        zIndex: 2,
                                    }}
                                >
                                    DECODIFICAR
                                </motion.span>
                                {/* v1.15 — Removido el subtítulo
                                    "Activar lente" (era una redundancia
                                    sobre "DECODIFICAR"). */}
                            </motion.div>
                        </motion.button>
                        {/* v1.15 — Pill rediseñada: gradient sutil
                            dorado + border más asentado para que se
                            sienta como una segunda opción real (la
                            anterior con bg 3% y border 18% pasaba
                            desapercibida al lado del botón principal).
                            El icono cambia del paisaje genérico a un
                            cuadrado portaobjetos con sparkle dentro
                            — más coherente con el lenguaje del Escáner.
                            paddingY 10 → 12 y fontSize 11 → 11.5 para
                            ganar peso visual. */}
                        <motion.button
                            whileHover={{
                                scale: 1.03,
                                boxShadow: `0 0 24px ${hx(GOLD, 0.28)}, 0 0 40px ${hx(CYAN, 0.1)}, inset 0 0 14px ${hx(GOLD, 0.08)}`,
                            }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleGalleryUpload}
                            style={{
                                /* v1.35 — Pill cristalina: marco hairline dual-tono
                                   oro→cian (eco del borde de gema) en vez del border
                                   plano, fondo con tinte cian al cierre, icono cristal
                                   facetado. marginTop 64 → 38. */
                                position: "relative",
                                marginTop: 38,
                                padding: "13px 28px",
                                borderRadius: 14,
                                background: `linear-gradient(135deg, ${hx(GOLD, 0.16)} 0%, ${hx(CYAN, 0.05)} 100%)`,
                                border: "none",
                                color: hx(GOLD, 0.95),
                                fontSize: 11.5,
                                fontWeight: 600,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                fontFamily: "'Inter',sans-serif",
                                outline: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                boxShadow: `0 0 16px ${hx(GOLD, 0.14)}, inset 0 1px 0 ${hx("#FFFFFF", 0.08)}`,
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                                transition: "box-shadow 0.25s ease",
                            }}
                        >
                            {/* Marco facetado dual-tono (oro→cian) — hairline mask,
                                eco del borde de gema, estático y GPU-friendly. */}
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: 14,
                                    padding: "1px",
                                    background: `linear-gradient(135deg, ${hx(GOLD, 0.6)}, ${hx(CYAN, 0.4)})`,
                                    WebkitMask:
                                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                    WebkitMaskComposite: "xor",
                                    maskComposite: "exclude",
                                    pointerEvents: "none",
                                }}
                            />
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{
                                    position: "relative",
                                    overflow: "visible",
                                    filter: `drop-shadow(0 0 6px ${hx(GOLD, 0.5)})`,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="evd-gal-crys"
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#FBE6A8"
                                        />
                                        <stop offset="50%" stopColor={GOLD} />
                                        <stop offset="100%" stopColor={CYAN} />
                                    </linearGradient>
                                </defs>
                                {/* marco / galería */}
                                <rect
                                    x="3"
                                    y="4.5"
                                    width="18"
                                    height="15"
                                    rx="3"
                                    fill="none"
                                    stroke={hx(GOLD, 0.7)}
                                    strokeWidth="1.4"
                                />
                                {/* cristal facetado adentro (eco del emblema) */}
                                <polygon
                                    points="12,8 16,11 16,15 12,18 8,15 8,11"
                                    fill="url(#evd-gal-crys)"
                                    fillOpacity="0.92"
                                    stroke="#FFFFFF"
                                    strokeOpacity="0.5"
                                    strokeWidth="0.5"
                                />
                                <line
                                    x1="12"
                                    y1="8"
                                    x2="12"
                                    y2="18"
                                    stroke="#FFFFFF"
                                    strokeOpacity="0.45"
                                    strokeWidth="0.5"
                                />
                                {/* chispas */}
                                <circle cx="5.6" cy="7" r="0.9" fill={CYAN} />
                                <circle
                                    cx="18.4"
                                    cy="17"
                                    r="0.9"
                                    fill="#FFFFFF"
                                />
                            </svg>
                            <span style={{ position: "relative" }}>
                                Cargar desde galería
                            </span>
                        </motion.button>
                    </>
                )}
                {inputMode === "text" && (
                    <CodiceFieldCristalizacion
                        matterName={matterName}
                        setMatterName={setMatterName}
                        inputFocused={inputFocused}
                        setInputFocused={setInputFocused}
                        freeLimitReached={freeLimitReached}
                        isMobile={isMobile}
                        sendMatterNameToDecoder={sendMatterNameToDecoder}
                        onFreemiumBlock={onFreemiumBlock}
                    />
                )}
                {/* Medidor de escaneos épico — abajo, en AMBAS pestañas. Solo
                    para invitados (los miembros / tier 199 tienen ilimitado). */}
                {!hasUnlimitedDecoder &&
                    !hideForOverlay &&
                    freeShotsUsed !== null && (
                        <DecoderShotsMeter
                            used={freeShotsUsed}
                            isMobile={isMobile}
                            onTap={() => {
                                if (freeLimitReached) {
                                    onFreemiumBlock?.()
                                } else {
                                    setShowInfoModal(true)
                                }
                            }}
                        />
                    )}
                {errorMsg && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            color: "rgba(255,100,100,0.7)",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        {errorMsg}
                    </p>
                )}
            </motion.div>
            </motion.div>
        )
    }

    /* ── STREAMING / CAPTURING (video viewport) ── */
    if (phase === "streaming" || phase === "capturing") {
        const QC: Record<
            FrameQuality,
            { color: string; label: string; intense: number }
        > = {
            scanning: {
                color: "#B8C8D6",
                label: "Buscando texto",
                intense: 0.45,
            },
            low: {
                color: "#D4A843",
                label: "Acerca la etiqueta",
                intense: 0.7,
            },
            ready: {
                color: "#5BE38E",
                label: "✓ Nítida — captura",
                intense: 1,
            },
            dark: {
                color: "#FF7A7A",
                label: "Poca luz",
                intense: 0.55,
            },
        }
        const fq = QC[frameSignal.quality]
        const isReady = frameSignal.quality === "ready"
        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    /* v6.6 — Cuando el shell levanta el gate de
                       identificación, la cámara baja a zIndex 5
                       (debajo del backdrop del gate, que vive en
                       zIndex 2147483645+). El stream sigue corriendo
                       y al cerrar el gate la cámara reaparece intacta. */
                    zIndex: authGateOpen ? 5 : 200000,
                    background: "#000",
                    display: "flex",
                    flexDirection: "column",
                    visibility: authGateOpen ? "hidden" : "visible",
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        flex: 1,
                        width: "100%",
                        objectFit: "cover",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: "78%",
                            aspectRatio: "3/4",
                            border: `1px solid ${hx(fq.color, 0.45)}`,
                            borderRadius: 18,
                            boxShadow: `inset 0 0 40px ${hx(fq.color, 0.12 * fq.intense)}, 0 0 60px rgba(0,0,0,0.6)`,
                            position: "relative",
                            overflow: "hidden",
                            transition:
                                "border-color 0.4s ease, box-shadow 0.4s ease",
                        }}
                    >
                        <div className="esc-corner esc-corner-tl">
                            <CSvg color={fq.color} />
                        </div>
                        <div className="esc-corner esc-corner-tr">
                            <CSvg color={fq.color} />
                        </div>
                        <div className="esc-corner esc-corner-bl">
                            <CSvg color={fq.color} />
                        </div>
                        <div className="esc-corner esc-corner-br">
                            <CSvg color={fq.color} />
                        </div>
                        <motion.div
                            animate={{ y: ["0%", "100%", "0%"] }}
                            transition={{
                                duration: isReady ? 1.6 : 2.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 2,
                                background: `linear-gradient(90deg, transparent, ${fq.color}, transparent)`,
                                boxShadow: `0 0 12px ${hx(fq.color, 0.8 * fq.intense)}`,
                                opacity: 0.85,
                            }}
                        />
                    </div>
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        padding: "18px 20px",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        background:
                            "linear-gradient(180deg,rgba(0,0,0,0.6),transparent)",
                    }}
                >
                    <button
                        onClick={reset}
                        style={{
                            background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.85)",
                            padding: "8px 14px",
                            borderRadius: 10,
                            fontSize: 12,
                            fontFamily: "'Inter',sans-serif",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                        }}
                    >
                        Cerrar visor
                    </button>
                </div>
                <motion.div
                    initial={false}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    style={{
                        position: "absolute",
                        bottom: 132,
                        left: 16,
                        right: 16,
                        margin: "0 auto",
                        maxWidth: "calc(100vw - 32px)",
                        width: "fit-content",
                        padding: "10px 18px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        border: `1px solid ${hx(fq.color, 0.4)}`,
                        boxShadow: `0 0 20px ${hx(fq.color, 0.18 * fq.intense)}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        pointerEvents: "none",
                        transition:
                            "border-color 0.4s ease, box-shadow 0.4s ease",
                    }}
                >
                    <motion.div
                        animate={{
                            scale: isReady ? [1, 1.3, 1] : [1, 1.15, 1],
                            opacity: [0.55, 1, 0.55],
                        }}
                        transition={{
                            duration: isReady ? 0.9 : 1.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: fq.color,
                            boxShadow: `0 0 8px ${fq.color}`,
                        }}
                    />
                    <span
                        style={{
                            color: fq.color,
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter',sans-serif",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {fq.label}
                    </span>
                </motion.div>
                <div
                    style={{
                        position: "absolute",
                        bottom: 36,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        animate={{
                            scale: isReady ? [1, 1.06, 1] : 1,
                        }}
                        transition={{
                            duration: 1.4,
                            repeat: isReady ? Infinity : 0,
                            ease: "easeInOut",
                        }}
                        onClick={captureAndDecode}
                        disabled={phase === "capturing"}
                        style={{
                            width: 78,
                            height: 78,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${hx(fq.color, 0.35 * fq.intense)}, ${hx(fq.color, 0.05)})`,
                            border: `3px solid ${hx(fq.color, 0.85)}`,
                            cursor: "pointer",
                            outline: "none",
                            boxShadow: `0 0 ${30 + 30 * fq.intense}px ${hx(fq.color, 0.5 * fq.intense)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition:
                                "border-color 0.4s ease, box-shadow 0.4s ease",
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: fq.color,
                                boxShadow: `0 0 20px ${hx(fq.color, 0.8 * fq.intense)}`,
                                transition: "background 0.4s ease",
                            }}
                        />
                    </motion.button>
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <canvas ref={analyzerRef} style={{ display: "none" }} />
            </motion.div>,
            document.body
        )
    }

    /* ── OCR + ANALYZING (pulse) ── */
    if (phase === "ocr" || phase === "analyzing") {
        const isOcr = phase === "ocr"
        const ac = isOcr ? CYAN : GOLD
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 24,
                    flex: 1,
                    minHeight: isMobile ? "70vh" : "60vh",
                    /* Sesgo hacia abajo: el bloque quedaba un poco alto del
                       centro real; el padding superior lo baja al eje Y.
                       v1.36 — 0 → 13vh: Zak lo quiso un poco más abajo. */
                    padding: "13vh 20px 0",
                }}
            >
                {/* ── Núcleo de Síntesis — orbital etéreo pulsante ──
                    Aura que respira + dos arcos scanner contra-rotando +
                    chispas orbitando + núcleo con destello. Color por fase. */}
                <div
                    style={{
                        position: "relative",
                        width: 190,
                        height: 190,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.div
                        aria-hidden
                        animate={{
                            scale: [0.82, 1.2, 0.82],
                            opacity: [0.28, 0.72, 0.28],
                        }}
                        transition={{
                            duration: 3.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            inset: -26,
                            borderRadius: "50%",
                            background: `radial-gradient(circle at 50% 50%, ${hx(ac, 0.5)} 0%, ${hx(ac, 0.13)} 40%, transparent 70%)`,
                            filter: "blur(8px)",
                            pointerEvents: "none",
                        }}
                    />
                    <svg
                        width={190}
                        height={190}
                        viewBox="0 0 190 190"
                        style={{ position: "relative", overflow: "visible" }}
                    >
                        <defs>
                            <radialGradient
                                id="evdmCore"
                                cx="50%"
                                cy="42%"
                                r="62%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#ffffff"
                                    stopOpacity="0.95"
                                />
                                <stop
                                    offset="34%"
                                    stopColor={ac}
                                    stopOpacity="0.92"
                                />
                                <stop
                                    offset="100%"
                                    stopColor={ac}
                                    stopOpacity="0"
                                />
                            </radialGradient>
                            <linearGradient
                                id="evdmArc"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={ac}
                                    stopOpacity="0"
                                />
                                <stop
                                    offset="55%"
                                    stopColor={ac}
                                    stopOpacity="1"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#ffffff"
                                    stopOpacity="0.92"
                                />
                            </linearGradient>
                        </defs>
                        <circle
                            cx="95"
                            cy="95"
                            r="74"
                            fill="none"
                            stroke={hx(ac, 0.13)}
                            strokeWidth="1"
                        />
                        <circle
                            cx="95"
                            cy="95"
                            r="56"
                            fill="none"
                            stroke={hx(ac, 0.1)}
                            strokeWidth="1"
                        />
                        <motion.g
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                            }}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 2.8,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            <circle
                                cx="95"
                                cy="95"
                                r="74"
                                fill="none"
                                stroke="url(#evdmArc)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 74 * 0.3} ${2 * Math.PI * 74}`}
                            />
                        </motion.g>
                        <motion.g
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                            }}
                            animate={{ rotate: -360 }}
                            transition={{
                                duration: 2.0,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            <circle
                                cx="95"
                                cy="95"
                                r="56"
                                fill="none"
                                stroke="url(#evdmArc)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 56 * 0.2} ${2 * Math.PI * 56}`}
                            />
                        </motion.g>
                        <motion.g
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                            }}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 3.6,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            <circle cx="95" cy="21" r="3.2" fill="#ffffff" />
                            <circle cx="95" cy="169" r="2.2" fill={ac} />
                        </motion.g>
                        <motion.g
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                            }}
                            animate={{ rotate: -360 }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            <circle cx="39" cy="95" r="2.4" fill={ac} />
                        </motion.g>
                        <motion.circle
                            cx="95"
                            cy="95"
                            fill="url(#evdmCore)"
                            animate={{
                                r: [22, 32, 22],
                                opacity: [0.8, 1, 0.8],
                            }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        <motion.circle
                            cx="95"
                            cy="90"
                            fill="#ffffff"
                            animate={{
                                r: [3.5, 7, 3.5],
                                opacity: [0.55, 1, 0.55],
                            }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </svg>
                </div>
                <motion.p
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: hx(ac, 0.95),
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        fontFamily: "'Inter',sans-serif",
                        textShadow: `0 0 12px ${hx(ac, 0.5)}`,
                    }}
                >
                    {isOcr ? "Extrayendo materia…" : "Decodificando…"}
                </motion.p>
                <p
                    style={{
                        margin: 0,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.32)",
                        fontFamily: "'Inter',sans-serif",
                        letterSpacing: "0.16em",
                    }}
                >
                    {isOcr
                        ? "Visión profesional activa"
                        : "Núcleo de síntesis activo"}
                </p>
            </motion.div>
        )
    }

    /* ── RESULT (tri-axial + Anillo de Composición) ── */
    if (phase === "result" && dictamen && hud) {
        /* ═══════════════════════════════════════════════════════════════
           CÁMARA DE LECTURA — resultado del Decodificador de Materia.
           Una sola TERMINAL DE INSTRUMENTO holográfica de Sexta Densidad
           (no tarjetas apiladas): retícula viva + costura de apertura de la
           cápsula + sello hexagonal contrarrotando + cometa de telemetría
           (SMIL) + veredicto que MATERIALIZA + 3 canales de señal + traza de
           análisis + directiva sellada. El veredicto tiñe todo el campo
           (LIMPIO → aurora; TÓXICO → tensión + alarma del marco).
           Reusa el motor vivo (fireMaterialize/aurora/tensión) vía el effect
           de montaje ya existente (dictamenCardRef sobre el núcleo).
           Continuo = CSS-compositor + SMIL (perf 10K). framer SOLO entradas.
           ═══════════════════════════════════════════════════════════════ */
        const AXIS_META: {
            key: keyof typeof hud
            label: string
            sub: string
            glyph: string
            value: number
        }[] = [
            {
                key: "friccion_biologica",
                label: "Fricción Biológica",
                sub: "Daño al hardware",
                glyph: "⌁",
                value: fBio,
            },
            {
                key: "friccion_energetica",
                label: "Fricción Energética",
                sub: "Pesadez en tu energía",
                glyph: "∿",
                value: fEne,
            },
            {
                key: "impacto_matriz",
                label: "Impacto en la Matriz",
                sub: "Entropía externa",
                glyph: "Δ",
                value: fMat,
            },
        ]
        const CIAN = "#00E5FF"
        const GOLD_AMB = "#D4A843"
        const dl =
            typeof hud.densidad_ligereza === "number"
                ? Math.max(0, Math.min(100, hud.densidad_ligereza))
                : 50
        const densidad = dl
        const ligereza = 100 - dl
        const isLigerezaDom = ligereza >= densidad
        const domColor = isLigerezaDom ? CIAN : GOLD_AMB
        const subColor = isLigerezaDom ? GOLD_AMB : CIAN
        const domLabel = isLigerezaDom ? "Ligereza" : "Densidad"
        const subLabel = isLigerezaDom ? "Densidad" : "Ligereza"
        const domValue = isLigerezaDom ? ligereza : densidad
        const subValue = isLigerezaDom ? densidad : ligereza
        const domGlow = isLigerezaDom
            ? "rgba(0,229,255,0.55)"
            : "rgba(212,168,67,0.55)"
        const resumen =
            hud.termodinamica_resumen ||
            (dl <= 30
                ? "Conductividad de Luz"
                : dl >= 70
                  ? "Anclaje al Carbono"
                  : "Equilibrio Híbrido")
        const ringR = 78
        const ringC = 2 * Math.PI * ringR
        const ligerezaArc = (ligereza / 100) * ringC
        const densidadArc = (densidad / 100) * ringC
        const ringSize = isMobile ? 224 : 250
        const estado = hud.estado || "LECTURA"
        const categoria = hud.categoria_detectada || ""
        const activoColor = danger ? "#FF4646" : CIAN
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 16,
                    width: "100%",
                    maxWidth: 520,
                    padding: isMobile ? "calc(env(safe-area-inset-top, 0px) + 28px) 13px 16px" : "46px 22px 22px",
                    position: "relative",
                }}
            >
                {/* ── MARCO DE INSTRUMENTO ÚNICO ─────────────────────────── */}
                <div
                    style={{
                        position: "relative",
                        borderRadius: 22,
                        padding: isMobile ? "28px 16px 22px" : "34px 24px 26px",
                        overflow: "hidden",
                        background:
                            "linear-gradient(168deg, rgba(7,15,31,0.92) 0%, rgba(4,9,26,0.95) 60%, rgba(2,6,17,0.97) 100%)",
                        border: `1px solid ${hx(statusHex, 0.34)}`,
                        boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 50px ${statusGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        animation: danger
                            ? "esc-cam-alarm 1.6s ease-in-out 2"
                            : undefined,
                        zIndex: 2,
                    }}
                >
                    {/* Retícula de escaneo + light-leaks (ESTÁTICOS, 0/frame). */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background:
                                "repeating-linear-gradient(0deg, transparent 0 26px, rgba(0,229,255,0.045) 26px 27px), repeating-linear-gradient(90deg, transparent 0 26px, rgba(212,168,67,0.03) 26px 27px), radial-gradient(60% 40% at 16% 4%, rgba(212,168,67,0.10), transparent 70%), radial-gradient(54% 40% at 86% 22%, rgba(0,229,255,0.08), transparent 70%), radial-gradient(70% 44% at 50% 104%, " +
                                hx(statusHex, 0.1) +
                                ", transparent 72%)",
                        }}
                    />
                    {/* Capa de puntos de telemetría (mask radial), estática. */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            backgroundImage:
                                "radial-gradient(rgba(255,255,255,0.05) 0.5px, transparent 0.5px)",
                            backgroundSize: "13px 13px",
                            WebkitMaskImage:
                                "radial-gradient(circle at 50% 30%, #000 26%, transparent 74%)",
                            maskImage:
                                "radial-gradient(circle at 50% 30%, #000 26%, transparent 74%)",
                        }}
                    />
                    {/* Costura de apertura — la cápsula se abrió por el centro. */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            width: 2,
                            height: 44,
                            transform: "translateX(-50%)",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.85), transparent)",
                            animation: "esc-cam-seam 2.6s ease-in-out infinite",
                            pointerEvents: "none",
                        }}
                    />
                    {/* 4 corner-brackets en L → lectura de visor de telemetría. */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 13,
                            left: 13,
                            width: 13,
                            height: 13,
                            borderLeft: `1.5px solid ${hx(CIAN, 0.5)}`,
                            borderTop: `1.5px solid ${hx(CIAN, 0.5)}`,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 13,
                            right: 13,
                            width: 13,
                            height: 13,
                            borderRight: `1.5px solid ${hx(CIAN, 0.5)}`,
                            borderTop: `1.5px solid ${hx(CIAN, 0.5)}`,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            bottom: 13,
                            left: 13,
                            width: 13,
                            height: 13,
                            borderLeft: `1.5px solid ${hx(GOLD_AMB, 0.5)}`,
                            borderBottom: `1.5px solid ${hx(GOLD_AMB, 0.5)}`,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            bottom: 13,
                            right: 13,
                            width: 13,
                            height: 13,
                            borderRight: `1.5px solid ${hx(GOLD_AMB, 0.5)}`,
                            borderBottom: `1.5px solid ${hx(GOLD_AMB, 0.5)}`,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Líneas de barrido (CSS-compositor; el cometa SMIL del
                        anillo es la señal viva que sobrevive el preview headless). */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            height: 2,
                            background:
                                "linear-gradient(90deg, transparent, rgba(0,229,255,0.26), transparent)",
                            animation: "esc-cam-scan 3.2s linear infinite",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            height: 1,
                            background: `linear-gradient(90deg, transparent, ${hx(statusHex, 0.24)}, transparent)`,
                            animation: "esc-cam-scan 4.3s linear infinite",
                            pointerEvents: "none",
                        }}
                    />

                    {/* ── Cabecera de instrumento ── */}
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 3,
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9.5,
                            letterSpacing: "0.16em",
                            color: "rgba(0,229,255,0.6)",
                        }}
                    >
                        <span>CÁMARA · LECTURA DE MATERIA</span>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                color: hx(activoColor, 0.85),
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 99,
                                    background: activoColor,
                                    boxShadow: `0 0 8px ${hx(activoColor, 0.8)}`,
                                    animation:
                                        "esc-indice-breath 1.4s ease-in-out infinite",
                                }}
                            />
                            ACTIVO
                        </span>
                    </div>
                    {categoria ? (
                        <p
                            style={{
                                position: "relative",
                                margin: "0 0 12px",
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 9.5,
                                letterSpacing: "0.08em",
                                color: "rgba(255,255,255,0.42)",
                                textTransform: "uppercase",
                            }}
                        >
                            CAT_DETECTADA · {categoria}
                        </p>
                    ) : (
                        <div style={{ height: 12 }} />
                    )}

                    {/* ── NÚCLEO CRISTALINO — Anillo de Composición fusionado
                        con el sello y el veredicto. El effect de montaje
                        (dictamenCardRef) materializa las esquirlas a su centro. ── */}
                    <div
                        ref={dictamenCardRef}
                        style={{
                            position: "relative",
                            display: "flex",
                            justifyContent: "center",
                            margin: "2px 0 2px",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: ringSize,
                                height: ringSize,
                            }}
                        >
                            <svg
                                width={ringSize}
                                height={ringSize}
                                viewBox="0 0 200 200"
                                style={{ overflow: "visible" }}
                            >
                                <defs>
                                    <radialGradient
                                        id="camCoreBg"
                                        cx="50%"
                                        cy="50%"
                                        r="50%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={domGlow}
                                            stopOpacity="0.22"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="transparent"
                                        />
                                    </radialGradient>
                                </defs>
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={ringR + 10}
                                    fill="url(#camCoreBg)"
                                />
                                {/* Sello hexagonal de Sexta Densidad — dos hexágonos
                                    contrarrotando (eco del MateriaSigil del hub). */}
                                <g
                                    style={{
                                        transformBox: "fill-box",
                                        transformOrigin: "center",
                                        animation:
                                            "esc-mon-spin 48s linear infinite",
                                    }}
                                >
                                    <polygon
                                        points="100,18 171,59 171,141 100,182 29,141 29,59"
                                        fill="none"
                                        stroke={hx(GOLD_AMB, 0.16)}
                                        strokeWidth="1"
                                    />
                                </g>
                                <g
                                    style={{
                                        transformBox: "fill-box",
                                        transformOrigin: "center",
                                        animation:
                                            "esc-mon-counterspin 64s linear infinite",
                                    }}
                                >
                                    <polygon
                                        points="100,30 161,65 161,135 100,170 39,135 39,65"
                                        fill="none"
                                        stroke={hx(CIAN, 0.14)}
                                        strokeWidth="1"
                                    />
                                </g>
                                {/* Anillo punteado de instrumento. */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="94"
                                    fill="none"
                                    stroke={hx(statusHex, 0.16)}
                                    strokeWidth="1"
                                    strokeDasharray="2 8"
                                    style={{
                                        transformBox: "fill-box",
                                        transformOrigin: "center",
                                        animation:
                                            "esc-mon-spin 30s linear infinite",
                                    }}
                                />
                                {/* Pista base del anillo de composición. */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={ringR}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="11"
                                />
                                {ligereza > 0 && (
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r={ringR}
                                        fill="none"
                                        stroke={CIAN}
                                        strokeWidth="11"
                                        strokeLinecap="butt"
                                        strokeDasharray={`${ligerezaArc} ${ringC}`}
                                        transform="rotate(-90 100 100)"
                                        style={{
                                            filter: `drop-shadow(0 0 12px ${CIAN})`,
                                        }}
                                    />
                                )}
                                {densidad > 0 && (
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r={ringR}
                                        fill="none"
                                        stroke={GOLD_AMB}
                                        strokeWidth="11"
                                        strokeLinecap="butt"
                                        strokeDasharray={`${densidadArc} ${ringC}`}
                                        strokeDashoffset={-ligerezaArc}
                                        transform="rotate(-90 100 100)"
                                        style={{
                                            filter: `drop-shadow(0 0 12px ${GOLD_AMB})`,
                                        }}
                                    />
                                )}
                                {/* Cometa de telemetría — SMIL animateMotion:
                                    sobrevive el preview headless (señal viva en QA). */}
                                <circle
                                    r="2.6"
                                    fill="#ffffff"
                                    style={{
                                        filter: `drop-shadow(0 0 6px ${domColor})`,
                                    }}
                                >
                                    <animateMotion
                                        dur="6s"
                                        repeatCount="indefinite"
                                        path="M100,22 A78,78 0 1,1 99.9,22"
                                    />
                                </circle>
                                {/* Glifos de coordenada. */}
                                <text
                                    x="100"
                                    y="13"
                                    textAnchor="middle"
                                    fontFamily="'JetBrains Mono',monospace"
                                    fontSize="7"
                                    fill="rgba(255,255,255,0.3)"
                                >
                                    00
                                </text>
                                <text
                                    x="192"
                                    y="103"
                                    textAnchor="middle"
                                    fontFamily="'JetBrains Mono',monospace"
                                    fontSize="7"
                                    fill="rgba(255,255,255,0.3)"
                                >
                                    90
                                </text>
                                <text
                                    x="100"
                                    y="195"
                                    textAnchor="middle"
                                    fontFamily="'JetBrains Mono',monospace"
                                    fontSize="7"
                                    fill="rgba(255,255,255,0.3)"
                                >
                                    180
                                </text>
                                <text
                                    x="9"
                                    y="103"
                                    textAnchor="middle"
                                    fontFamily="'JetBrains Mono',monospace"
                                    fontSize="7"
                                    fill="rgba(255,255,255,0.3)"
                                >
                                    270
                                </text>
                            </svg>
                            {/* Centro del núcleo: emblema cristal + composición. */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: 58,
                                        height: 52,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 6,
                                        background: hx(statusHex, 0.1),
                                        border: `1px solid ${hx(statusHex, 0.45)}`,
                                        clipPath:
                                            "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                                        boxShadow: `0 0 22px ${statusGlow}`,
                                        animation:
                                            "esc-indice-breath 3.4s ease-in-out infinite",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily:
                                                "'JetBrains Mono',monospace",
                                            fontSize: 17,
                                            color: statusColor,
                                            textShadow: `0 0 12px ${statusGlow}`,
                                        }}
                                    >
                                        ⬡
                                    </span>
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontFamily: "'JetBrains Mono',monospace",
                                        fontSize: isMobile ? 34 : 40,
                                        fontWeight: 200,
                                        color: domColor,
                                        letterSpacing: "0.04em",
                                        textShadow: `0 0 18px ${domGlow}`,
                                        lineHeight: 1,
                                    }}
                                >
                                    {domValue}
                                    <span style={{ fontSize: isMobile ? 16 : 18 }}>
                                        %
                                    </span>
                                </p>
                                <p
                                    style={{
                                        margin: "4px 0 0",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: domColor,
                                        letterSpacing: "0.32em",
                                        textTransform: "uppercase",
                                        fontFamily: "'Inter',sans-serif",
                                    }}
                                >
                                    {domLabel}
                                </p>
                                <p
                                    style={{
                                        margin: "3px 0 0",
                                        fontSize: 9,
                                        color: subColor,
                                        letterSpacing: "0.14em",
                                        fontFamily: "'JetBrains Mono',monospace",
                                    }}
                                >
                                    {subValue}% {subLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p
                        style={{
                            position: "relative",
                            textAlign: "center",
                            margin: "0 0 4px",
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 500,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: domColor,
                            fontFamily: "'Inter',sans-serif",
                            textShadow: `0 0 14px ${domGlow}`,
                        }}
                    >
                        {resumen}
                    </p>

                    {/* ── VEREDICTO — el clímax de la lectura ── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.15,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            position: "relative",
                            textAlign: "center",
                            margin: "12px 0 16px",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 10,
                                letterSpacing: "0.3em",
                                color: "rgba(255,255,255,0.4)",
                            }}
                        >
                            VEREDICTO
                        </p>
                        <p
                            style={{
                                margin: "3px 0 0",
                                fontSize: isMobile ? 32 : 40,
                                fontWeight: 200,
                                letterSpacing: "0.12em",
                                color: statusColor,
                                fontFamily: "'Inter',sans-serif",
                                textShadow: `0 0 26px ${statusGlow}, 0 0 8px ${statusGlow}`,
                                lineHeight: 1.1,
                            }}
                        >
                            {estado}
                        </p>
                    </motion.div>

                    {/* ── CANALES DE SEÑAL — 3 ejes de fricción como telemetría ── */}
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            margin: "0 0 10px",
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            color: "rgba(0,229,255,0.55)",
                        }}
                    >
                        <span>∷ CANALES DE SEÑAL</span>
                        <span
                            style={{
                                flex: 1,
                                height: 1,
                                background: "rgba(0,229,255,0.18)",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            gap: 11,
                            marginBottom: 18,
                        }}
                    >
                        {AXIS_META.map((ax, idx) => {
                            const col = axisColor(ax.value)
                            const glow = axisGlow(ax.value)
                            return (
                                <div key={ax.key}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                            marginBottom: 4,
                                            fontFamily:
                                                "'JetBrains Mono',monospace",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: "rgba(255,255,255,0.78)",
                                                letterSpacing: "0.06em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {ax.glyph} {ax.label}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: col,
                                                textShadow: `0 0 10px ${glow}`,
                                            }}
                                        >
                                            {ax.value}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            position: "relative",
                                            height: 6,
                                            borderRadius: 4,
                                            background: "rgba(255,255,255,0.06)",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: ax.value / 100 }}
                                            transition={{
                                                duration: 0.9,
                                                delay: 0.1 + 0.08 * idx,
                                                ease: "easeOut",
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                transformOrigin: "left",
                                                borderRadius: 4,
                                                background: `linear-gradient(90deg, ${hx(col, 0.62)}, ${col})`,
                                                boxShadow: `0 0 10px ${glow}`,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                left: 0,
                                                width: "40%",
                                                background: `linear-gradient(90deg, transparent, ${hx(col, 0.5)}, transparent)`,
                                                animation: `esc-bar-scan 2.8s linear ${0.5 * idx}s infinite`,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    </div>
                                    <p
                                        style={{
                                            margin: "3px 0 0",
                                            fontSize: 9.5,
                                            color: "rgba(255,255,255,0.4)",
                                            fontFamily: "'Inter',sans-serif",
                                        }}
                                    >
                                        {ax.sub}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    {/* ── TRAZA DE ANÁLISIS — log de instrumento ── */}
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            margin: "0 0 8px",
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            color: "rgba(212,168,67,0.6)",
                        }}
                    >
                        <span>∷ ANÁLISIS · TRAZA</span>
                        <span
                            style={{
                                flex: 1,
                                height: 1,
                                background: "rgba(212,168,67,0.18)",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            marginBottom: 18,
                        }}
                    >
                        {Array.isArray(dictamen.analisis_quirurgico) &&
                            dictamen.analisis_quirurgico.map((raw, i) => {
                                const tagMatch = raw.match(
                                    /^([^:]+):\s*\[([^\]]+)\]\s*(.+)$/
                                )
                                const head = tagMatch
                                    ? tagMatch[1].trim()
                                    : null
                                const tag = tagMatch ? tagMatch[2].trim() : null
                                const body = tagMatch
                                    ? tagMatch[3].trim()
                                    : raw
                                const isPositive =
                                    !!tag &&
                                    /conductividad|ligereza|pureza|limpi[ao]|fluidez|claridad/i.test(
                                        tag
                                    )
                                const tagCol = isPositive
                                    ? "rgba(0,220,220,0.95)"
                                    : tag && /extrem/i.test(tag)
                                      ? "rgba(255,60,60,0.95)"
                                      : tag && /alt[ao]/i.test(tag)
                                        ? "rgba(255,140,60,0.95)"
                                        : tag && /medi[ao]/i.test(tag)
                                          ? "rgba(212,168,67,0.95)"
                                          : tag && /baj[ao]/i.test(tag)
                                            ? "rgba(0,220,220,0.95)"
                                            : hx(accent, 0.9)
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            gap: 7,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'JetBrains Mono',monospace",
                                                color: "rgba(0,229,255,0.6)",
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            &gt;
                                        </span>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 12.5,
                                                lineHeight: 1.55,
                                                color: "rgba(255,255,255,0.82)",
                                                fontFamily: "'Inter',sans-serif",
                                            }}
                                        >
                                            {head && (
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "rgba(255,255,255,0.92)",
                                                    }}
                                                >
                                                    {head}{" "}
                                                </span>
                                            )}
                                            {tag && (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        fontFamily:
                                                            "'JetBrains Mono',monospace",
                                                        fontSize: 8.5,
                                                        letterSpacing: "0.1em",
                                                        padding: "1px 6px",
                                                        borderRadius: 4,
                                                        background:
                                                            tagCol.replace(
                                                                /0\.9[0-9]?\)/,
                                                                "0.16)"
                                                            ),
                                                        color: tagCol,
                                                        border: `1px solid ${tagCol.replace(/0\.9[0-9]?\)/, "0.4)")}`,
                                                        verticalAlign: "1px",
                                                        textTransform:
                                                            "uppercase",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            )}{" "}
                                            {body}
                                        </p>
                                    </div>
                                )
                            })}
                    </div>

                    {/* ── DIRECTIVA — el comando que cierra la lectura ── */}
                    {dictamen.comando_final && (
                        <div
                            style={{
                                position: "relative",
                                padding: "14px 14px 14px 16px",
                                borderRadius: 0,
                                borderLeft: `3px solid ${statusColor}`,
                                background: hx(statusHex, 0.06),
                            }}
                        >
                            <p
                                style={{
                                    margin: "0 0 6px",
                                    fontFamily: "'JetBrains Mono',monospace",
                                    fontSize: 9,
                                    letterSpacing: "0.24em",
                                    color: hx(statusHex, 0.85),
                                }}
                            >
                                ◈ DIRECTIVA DE SEXTA DENSIDAD
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 13.5,
                                    lineHeight: 1.55,
                                    color: statusColor,
                                    fontFamily: "'Inter',sans-serif",
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {dictamen.comando_final}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Botón de terminal — nuevo escaneo ── */}
                <motion.button
                    onClick={reset}
                    onPointerDown={(e) => {
                        try {
                            fireTouchRipple(e.clientX, e.clientY, {
                                color: CIAN,
                            })
                        } catch {}
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        marginTop: 4,
                        padding: "14px 26px",
                        borderRadius: 12,
                        background: hx(CIAN, 0.06),
                        border: `1px solid ${hx(CIAN, 0.4)}`,
                        color: "#7FEFFF",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono',monospace",
                        letterSpacing: "0.2em",
                        cursor: "pointer",
                        outline: "none",
                        minHeight: 52,
                        position: "relative",
                        zIndex: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        textShadow: `0 0 12px ${hx(CIAN, 0.45)}`,
                    }}
                >
                    ⟲ NUEVO ESCANEO
                </motion.button>
            </motion.div>
        )
    }

    /* ── ERROR ── */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                flex: 1,
                minHeight: 400,
                padding: "0 20px",
                textAlign: "center",
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: 14,
                    color: "rgba(255,100,100,0.85)",
                    fontFamily: "'Inter',sans-serif",
                    letterSpacing: "0.05em",
                    maxWidth: 380,
                    lineHeight: 1.7,
                }}
            >
                {errorMsg || "Interferencia detectada."}
            </p>
            <button
                onClick={reset}
                style={{
                    padding: "12px 26px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                    fontFamily: "'Inter',sans-serif",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    outline: "none",
                }}
            >
                Reintentar
            </button>
        </motion.div>
    )
}

export default DecodificadorView
 
