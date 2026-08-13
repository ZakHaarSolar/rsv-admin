// EV_Shared.tsx v2.29 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// ya no pega directo a Pipedream (esa URL viajaba en el bundle y el webhook
// no verificaba nada). Pasa por la función `dispatch-ciclo-sellado` (verifica
// sesión, resuelve correo/nombre contra la base, firma) con respaldo al
// camino viejo si la función responde 404 o falla la sesión. Espejo exacto
// del cambio ya vivo en escaner-app. | v2.27 — useEscanerMembershipStatus anti-parpadeo: siembra isMember desde cache (rsv-esc-member-last) + email desde Clerk al init + NO baja a false mientras Clerk hidrata → miembro que regresa arranca en true (sin el flash de "Primer nivel libre"). | v2.26 — Gating por tier vía group_name: PLENO (useEscanerMembershipStatus)=Sintonía/Inmersión (excluye 'decoder'=199/'dream'=399) → abre Escáner/Calibraciones/Holoteca/Simuladores; Materia (useDecoderAccessStatus)=cualquier sub activa; Sueños (useDreamAccessStatus)=todo menos 199 ('decoder') | recordNav (telemetría de navegación, fire-and-forget deduplicado por sesión vía user-action) | Cámara de Lectura: keyframes esc-cam-scan/esc-cam-seam/esc-cam-alarm (resultado rediseñado del Decodificador de Materia) | Banda Frecuencial: nodo que respira (esc-node-breath/esc-node-ring) reemplaza el ecualizador en Sueños | #5 Estados de ánimo: fireAuroraBloom/fireFieldWave/fireFieldTension | #2 fireMaterialize/MaterializeIn | #1 useLightIndex/BreathAura | #3 fireTouchRipple | #4 esc-indice-breath/esc-bar-scan/esc-eq-bar
// v2.14 — Hook useDecoderAccessStatus + constante DECODER_SOLAR_LINK. El
// acceso ilimitado al Decodificador es una señal SEPARADA de Sintonía: lo
// otorga también el tier Decodificador (199). En web = isActiveMember ||
// campo `decoder` de get_my_membership (tier 199 por Stripe). El Escáner /
// Calibraciones / Holoteca siguen pidiendo isActiveMember (Sintonía).
// v2.12 — Seguridad Ola B: la detección de membresía ya no lee `subscriptions`
// directo; usa la vía segura `get_my_membership` (no expone correos de nadie).
// v2.11.1 — Re-publish trigger para invalidar CDN tras reporte 2026-05-07.
// v2.11 — Hook `useIsPWAStandalone` agregado: detecta si la app corre
// como PWA standalone (display-mode: standalone OR navigator.standalone
// en iOS). En PWA tenemos más alto vertical disponible (sin URL bar de
// Safari, sin pestañas), así que pantallas como Calibración pueden
// reorganizarse en 2 columnas × 3 filas en lugar de 3×2 y crecer los
// botones de pilar. Recompute en cambio de matchMedia.
// v2.10 — Bug crítico de mobile landscape: `useIsMobile` ahora detecta
// celular por UA + viewport, no solo por width 768. Antes iPhone en
// horizontal (width=812) salía como desktop, lo que hacía que Domo
// montara el shell desktop en `/escaner/holoteca/simuladores` al rotar
// y el Tripulante viera solo el campo de estrellas en lugar del
// Navegante. Recompute en resize + orientationchange. Cubre el caso
// reportado por Zak el 2026-05-04 ("no quedó el Navegante landscape").
// v2.9.1 — Re-publish trigger (sin cambios funcionales) para forzar
// re-resolución del módulo en Framer tras incidente de red 2026-04-28.
// v2.9 — dispatchCicloSellado payload incluye clerk_user_id. Lo usa
// el workflow de Pipedream (CicloSellado.js v2) para llamar al RPC
// log_email_dispatch en Supabase y guardar el estado del envío en
// la tabla email_dispatches — el modal del Motor lee ese estado
// para mostrar ✓ enviado / ✗ falló / ↷ saltado por suscripción.
// EV_Shared.tsx v2.8
// v2.8 — dispatchCicloSellado endurecido: cada bail-out o respuesta
// del fetch deja una línea con prefijo [CicloSellado] para que Diego
// pueda capturar con el snippet RSV. Antes silenciaba sin email y
// el primer ciclo cerrado quedó sin diagnóstico. Suma fallback de
// email/full_name (props opcionales en args) — el caller puede leer
// de Supabase profiles cuando window.Clerk.user esté vacío en el
// momento del cierre.
// EV_Shared.tsx v2.7
// v2.7 — COOLDOWN_SEC pasa de 60s (testing) a 604800s (7 días).
// Producción real: tras cerrar un ciclo 6/6 el Radar bloquea el
// próximo durante una semana. El gate freemium ya impide el 2do
// intento para invitados; esta constante manda para suscriptores
// con Sintonía Solar activa.
// EV_Shared.tsx v2.6
// v2.6 — Nuevo @keyframes nuc-breath en el CSS string (espejo exacto
// del nuc-breath inyectado por AppNavegacionMobile). Los EV_* ahora
// pueden usarlo directamente para igualar el ritmo de respiración
// del título HOLOTECA — útil para Protocolos y Decodificador mobile.
// v2.5 — Helper hx() ahora guarda contra hex undefined: si Framer
// instancia un Code File standalone con accent undefined, el helper
// devuelve un cyan neutro en vez de crashear con
// "Cannot read properties of undefined (reading 'replace')". Esto
// elimina varios de los 14 blocking errors de Framer al cargar
// cualquier EV_* en el canvas sin props.
// EV_Shared.tsx v2.4
// v2.4 — Nuevo keyframe esc-nuc-breath (replica de nuc-breath de
// MiNucleo) disponible para todos los EV_*: brightness 1→1.15 + glow
// drop-shadow cyan. Usado para unificar el estilo del título "MI
// NÚCLEO" con "Protocolos Quirúrgicos" y "Decodificador de Materia".
// Núcleo compartido del Escáner Vibracional: tipos, constantes, helpers,
// hooks y persistencia de ciclo. El Shell y los demás subcomponentes
// (EV_Radar, EV_Codex, EV_Modulos, EV_Recal, EV_Decoder, EV_Freemium,
// EV_Icons) extraen TODO lo común desde acá. Default export es una
// función-componente (devuelve null) con todos los helpers adjuntos
// como propiedades — Framer requiere que cada Code File exporte un
// componente React, no un objeto plano. Los consumidores siguen
// destructurando: `import Shared from "./EV_Shared.tsx"; const { hx } = Shared`.
import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useSyncExternalStore,
} from "react"

/* ═══ TYPES ═══ */
export type PillarId =
    | "fisico"
    | "mental"
    | "emocional"
    | "financiero"
    | "vector"
    | "orbita"
export type MainView = "radar" | "modulos" | "recalibracion" | "decodificador"
export type SubView = "radar-main" | "sonda"
export interface SondaQ {
    text: string
    options: { label: string; value: number }[]
}
export interface ProtoTask {
    id: string
    text: string
}
export interface ProtoData {
    alert: string
    suggestion: string
    tasks: ProtoTask[]
}
export interface PillarCfg {
    id: PillarId
    label: string
    labelShort: string
    icon: React.ReactNode
    questions: SondaQ[]
    protocol: ProtoData
}
export interface Scores {
    fisico: number | null
    mental: number | null
    emocional: number | null
    financiero: number | null
    vector: number | null
    orbita: number | null
}
export interface Timestamps {
    fisico: number | null
    mental: number | null
    emocional: number | null
    financiero: number | null
    vector: number | null
    orbita: number | null
}
export interface DBProtocol {
    id: string
    protocolo_id: string
    estado: string
    tareas_completadas: string[]
    pilar: string
    fase: number
    titulo: string
    descripcion_corta: string
    alerta_text: string
    sugerencia_text: string
    tareas_json: { id: string; desc: string }[]
}
export interface ScanEntry {
    indice_silicio: number
    hardware_fisico: number
    procesador_mental: number
    motor_emocional: number
    gravedad_financiera: number
    vector_expansion: number
    orbita_relacional: number
    created_at: string
    cycle_scanned_json?: string | null
}
export type FreemiumGateKind = "sintonia" | "decoder" | "protocolos"

/* ═══ CONSTANTS ═══ */
/* v2.7 — Cooldown del Radar pasa de 60s (testing) a 7 días en
   producción. Una vez que el tripulante cierra los 6/6 pilares,
   debe esperar 7 días para volver a sondear. El gate freemium ya
   bloquea el segundo intento para invitados; esta constante manda
   para suscriptores que pueden hacer múltiples ciclos. Si alguien
   se suscribe a mitad del cooldown, el contador NO se reinicia —
   sigue corriendo desde el cierre del último ciclo. */
const COOLDOWN_SEC = 60 * 60 * 24 * 7
const GOLD = "#D4A843"
const CYAN = "#00E5FF"
const SINTONIA_SOLAR_LINK = "https://buy.stripe.com/eVq7sEcXz6wO88N4f20RG0E"
/* Payment Link de Stripe del tier Decodificador (199 MXN/mes). Vacío
   hasta que Zak cree el producto + link en Stripe y lo pase. Cuando esté,
   el muro del Decodificador en web ofrecerá el 199; si sigue vacío, el
   muro cae al CTA de Sintonía (degradación elegante). */
const DECODER_SOLAR_LINK = ""
const CICLO_SELLADO_WEBHOOK_URL = "https://eo9xwsp7vkaf04v.m.pipedream.net"
const TAB_ORDER_D: MainView[] = ["radar", "modulos", "recalibracion"]
const TAB_ORDER_M: MainView[] = [
    "radar",
    "modulos",
    "recalibracion",
    "decodificador",
]
const PROC_MSGS = [
    "Midiendo termodinámica...",
    "Calculando frecuencia...",
    "Escaneando campo toroidal...",
    "Evaluando flujo cuántico...",
    "Sintetizando resultado...",
    "Generando holograma...",
]

/* ═══ CSS — keyframes + utility classes inyectadas globalmente ═══ */
const CSS = String.raw`
.esc-overlay,.esc-overlay *,.esc-scroll{scrollbar-width:none!important;-ms-overflow-style:none!important}
.esc-overlay::-webkit-scrollbar,.esc-overlay *::-webkit-scrollbar,.esc-scroll::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
.esc-overlay{overflow:hidden!important}
.esc-scroll{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch}
html:has(.esc-overlay),body:has(.esc-overlay),:root:has(.esc-overlay){overflow:hidden!important;scrollbar-width:none!important;-ms-overflow-style:none!important}
html:has(.esc-overlay)::-webkit-scrollbar,body:has(.esc-overlay)::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
@keyframes esc-glow-breathe{0%,100%{filter:brightness(1) drop-shadow(0 0 6px rgba(0,229,255,.25))}50%{filter:brightness(1.12) drop-shadow(0 0 14px rgba(0,229,255,.45))}}
@keyframes esc-number-glow{0%,100%{text-shadow:0 0 8px rgba(0,229,255,.4),0 0 20px rgba(0,229,255,.15)}50%{text-shadow:0 0 16px rgba(0,229,255,.7),0 0 40px rgba(0,229,255,.3)}}
@keyframes esc-node-idle{0%,100%{filter:drop-shadow(0 0 8px rgba(0,229,255,.55))}50%{filter:drop-shadow(0 0 18px rgba(0,229,255,.85))}}
@keyframes esc-node-scannable{0%,100%{filter:drop-shadow(0 0 10px rgba(0,229,255,.65));stroke-width:1.8}50%{filter:drop-shadow(0 0 26px rgba(0,229,255,1));stroke-width:2.8}}
@keyframes esc-node-done{0%,100%{filter:drop-shadow(0 0 10px rgba(212,168,67,.6))}50%{filter:drop-shadow(0 0 20px rgba(212,168,67,.9))}}
@keyframes esc-diamond-breathe{0%,100%{opacity:.15}50%{opacity:.35}}
@keyframes esc-vertex-pulse{0%,100%{r:3;opacity:.35}50%{r:5;opacity:.75}}
@keyframes esc-gold-glow{0%,100%{filter:drop-shadow(0 0 20px rgba(212,168,67,.3))}50%{filter:drop-shadow(0 0 50px rgba(212,168,67,.6))}}
@keyframes esc-particle-rise{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-120px) scale(0)}}
@keyframes esc-splash-glow{0%{text-shadow:0 0 30px rgba(0,229,255,0.4),0 0 60px rgba(0,229,255,0.15)}50%{text-shadow:0 0 60px rgba(0,229,255,0.7),0 0 120px rgba(0,229,255,0.3)}100%{text-shadow:0 0 30px rgba(0,229,255,0.4),0 0 60px rgba(0,229,255,0.15)}}
@keyframes esc-splash-line{0%{width:0;opacity:0}40%{opacity:1}100%{width:min(340px,70vw);opacity:0}}
.esc-grad-title{background:linear-gradient(180deg,#00e5ff 0%,rgba(0,229,255,0.5) 50%,rgba(255,255,255,0.15) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.esc-titan-title{color:rgba(255,255,255,0.92);font-weight:200;letter-spacing:0.22em;text-shadow:0 1px 0 rgba(0,229,255,0.28),0 0 24px rgba(255,255,255,0.04);filter:none}
@keyframes esc-titan-breathe{0%,100%{text-shadow:0 1px 0 rgba(0,229,255,0.22),0 0 20px rgba(255,255,255,0.03)}50%{text-shadow:0 1px 0 rgba(0,229,255,0.45),0 0 30px rgba(0,229,255,0.08)}}
@keyframes esc-nuc-breath{0%,100%{filter:brightness(1) drop-shadow(0 0 12px rgba(0,229,255,0.22))}50%{filter:brightness(1.15) drop-shadow(0 0 18px rgba(0,229,255,0.32))}}
@keyframes nuc-breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}
@keyframes esc-mon-breathe{0%,100%{filter:drop-shadow(0 0 8px rgba(0,229,255,.2)) brightness(.97)}50%{filter:drop-shadow(0 0 32px rgba(0,229,255,.5)) brightness(1.12)}}
@keyframes esc-mon-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes esc-mon-counterspin{0%{transform:rotate(0deg)}100%{transform:rotate(-360deg)}}
@keyframes esc-mon-float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-8px)}}
@keyframes esc-mon-pulse-ring{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.35;transform:scale(1.04)}}
@keyframes esc-decoder-pulse{0%,100%{box-shadow:0 0 12px rgba(0,229,255,0.3),0 0 24px rgba(0,229,255,0.1)}50%{box-shadow:0 0 20px rgba(0,229,255,0.5),0 0 40px rgba(0,229,255,0.2)}}
@keyframes esc-hint-glow{0%,100%{color:rgba(255,255,255,0.28);text-shadow:0 0 6px rgba(0,229,255,0.12),0 0 14px rgba(0,229,255,0.06)}50%{color:rgba(255,255,255,0.55);text-shadow:0 0 14px rgba(0,229,255,0.35),0 0 28px rgba(0,229,255,0.18)}}
@keyframes esc-ring1-rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes esc-ring2-rotate{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
/* #4 Telemetría viva — pulso de luz circulando el marco hexagonal del Radar. */
@keyframes esc-frame-sweep{from{stroke-dashoffset:0}to{stroke-dashoffset:-1000}}
/* #4 Telemetría viva (build 11) — extensiones a más superficies. Todo
   CSS/compositor (GPU) o SMIL (perf 10K). El preview headless congela CSS
   por tiempo; verificar en device o por getAnimations().playState.
   · esc-indice-breath — el número del Índice de Luz late sutil.
   · esc-bar-scan      — barrido de señal recorriendo las bandas del Decodificador.
   · esc-eq-bar        — micro-ecualizador vivo de la Banda Frecuencial. */
@keyframes esc-indice-breath{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes esc-bar-scan{0%{transform:translateX(-160%)}100%{transform:translateX(160%)}}
@keyframes esc-eq-bar{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}
/* Banda Frecuencial — nodo que respira (núcleo + anillo expansivo). */
@keyframes esc-node-breath{0%,100%{transform:scale(0.82);opacity:.55}50%{transform:scale(1);opacity:1}}
@keyframes esc-node-ring{0%{transform:scale(0.7);opacity:.5}70%{opacity:0}100%{transform:scale(1.9);opacity:0}}
/* CÁMARA DE LECTURA — resultado del Decodificador de Materia (terminal
   holográfica de Sexta Densidad). esc-cam-scan: barrido vertical de la
   retícula; esc-cam-seam: costura de apertura de la cápsula; esc-cam-alarm:
   latido de alarma del marco en veredicto TÓXICO (2 ciclos, NO infinito → 10K).
   Compositor/GPU; el comet del anillo va por SMIL (sobrevive preview headless). */
@keyframes esc-cam-scan{0%{transform:translateY(-12px);opacity:0}8%{opacity:.85}92%{opacity:.85}100%{transform:translateY(920px);opacity:0}}
@keyframes esc-cam-seam{0%,100%{opacity:.32}50%{opacity:.85}}
@keyframes esc-cam-alarm{0%,100%{border-color:rgba(255,70,70,.30);box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 46px rgba(255,70,70,.16),inset 0 1px 0 rgba(255,255,255,.06)}50%{border-color:rgba(255,70,70,.66);box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 78px rgba(255,70,70,.42),inset 0 1px 0 rgba(255,255,255,.06)}}
/* #1 El campo respira contigo — latido ambiental. La animation-duration sale
   de var(--breath-dur) y el color del aura/anillo de var(--breath-color)
   (ambos se setean inline según el Índice de Luz; perf 10K, CSS compositor). */
@keyframes esc-breathe-aura{0%,100%{opacity:.10;transform:scale(1)}50%{opacity:.30;transform:scale(1.05)}}
@keyframes esc-breathe-ring{0%,100%{opacity:.42;transform:scale(1)}50%{opacity:.9;transform:scale(1.04)}}
.esc-codex-scroll::-webkit-scrollbar{display:none;width:0;height:0}
.esc-codex-scroll{scrollbar-width:none;-ms-overflow-style:none}
.esc-corner{position:absolute;width:16px;height:16px;pointer-events:none;z-index:5}
.esc-corner svg{width:100%;height:100%}
.esc-corner-tl{top:6px;left:6px}.esc-corner-tr{top:6px;right:6px;transform:scaleX(-1)}
.esc-corner-bl{bottom:6px;left:6px;transform:scaleY(-1)}.esc-corner-br{bottom:6px;right:6px;transform:scale(-1)}
.esc-swipe-container{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none}
.esc-swipe-container::-webkit-scrollbar{display:none}
.esc-swipe-card{scroll-snap-align:center;flex-shrink:0}
.esc-codice-input::placeholder{color:rgba(255,255,255,0.20)!important;font-style:italic;font-weight:300;letter-spacing:0.02em}
.esc-codice-input::-webkit-input-placeholder{color:rgba(255,255,255,0.20)!important;font-style:italic;font-weight:300;letter-spacing:0.02em}
.esc-codice-input{caret-color:#D4A843}
.esc-codice-input::selection{background:rgba(212,168,67,0.40);color:#FFFFFF}
.esc-codice-input::-moz-selection{background:rgba(212,168,67,0.40);color:#FFFFFF}
`

/* ═══ HOOKS ═══ */
function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "escaner-css-v10"
        let el = document.getElementById(id) as HTMLStyleElement | null
        if (el) {
            el.textContent = CSS
            return
        }
        el = document.createElement("style")
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])
}

/* useIsMobile — detecta celular combinando UA + viewport. Antes solo
   miraba `max-width: 768px`, lo que hacía que iPhone en LANDSCAPE
   (width=812) saliera como desktop y Domo montara el shell equivocado
   (RSV_SolarSimuladoresShell desktop en vez de AppNavegacionMobile).
   El bug se veía como "solo el campo de estrellas" al rotar el
   iPhone dentro del Navegante de la Red — el shell desktop no
   manejaba el viewport mobile-landscape y dejaba el wrapper
   transparente.
   Ahora: si el UA matchea iPhone/Android Mobile, isMobile es true
   sin importar la orientación. Si no hay UA matchable, caemos al
   width 768 + height 600 (cubre tablets en portrait + cualquier
   pantalla angosta). Recompute en resize y orientationchange. */
function useIsMobile() {
    const compute = () => {
        if (typeof window === "undefined") return false
        const ua =
            (typeof navigator !== "undefined" && navigator.userAgent) || ""
        const uaMatch = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
        if (uaMatch) return true
        const w = window.innerWidth || 1024
        const h = window.innerHeight || 1024
        return w <= 768 || h <= 600
    }
    const [m, setM] = useState<boolean>(compute)
    useEffect(() => {
        if (typeof window === "undefined") return
        const update = () => setM(compute())
        update()
        window.addEventListener("resize", update)
        window.addEventListener("orientationchange", update)
        return () => {
            window.removeEventListener("resize", update)
            window.removeEventListener("orientationchange", update)
        }
    }, [])
    return m
}

/* useIsPWAStandalone — detecta si la app corre como PWA "instalada"
   (Add to Home Screen en iOS, Install App en Android). Combinamos:
   (a) `matchMedia('(display-mode: standalone)')` — estándar moderno,
       funciona en Android Chrome, Edge, Firefox, etc.
   (b) `(navigator as any).standalone === true` — iOS Safari tradicional;
       no implementa display-mode hasta iOS 16.4+.
   Recompute al cambiar la matchMedia (poco probable mid-sesión, pero
   por completitud). En desktop o web normal mobile siempre es false. */
function useIsPWAStandalone(): boolean {
    const compute = () => {
        if (typeof window === "undefined") return false
        try {
            const mq = window.matchMedia?.("(display-mode: standalone)")
            if (mq && mq.matches) return true
        } catch {}
        if ((navigator as any)?.standalone === true) return true
        return false
    }
    const [pwa, setPwa] = useState<boolean>(compute)
    useEffect(() => {
        if (typeof window === "undefined") return
        let mq: MediaQueryList | null = null
        const update = () => setPwa(compute())
        update()
        try {
            mq = window.matchMedia("(display-mode: standalone)")
            mq.addEventListener?.("change", update)
        } catch {}
        return () => {
            try {
                mq?.removeEventListener?.("change", update)
            } catch {}
        }
    }, [])
    return pwa
}

/* Lectura del estado de membresía dentro del Escáner. Polling de
   window.Clerk.user → fetch a subscriptions filtrado por email activo.
   Cualquier fila con status=active activa los gates freemium. */
/* LOTE F (auditoría 2026-07-27) — la membresía se pide por el gateway
   `user-action`: el clerk id sale del claim `sub` del token firmado y el
   correo se resuelve server-side contra profiles. La vía vieja
   get_my_membership(p_email) era anon-ejecutable → dejaba enumerar si un
   correo cualquiera tenía membresía activa.
   El respaldo por correo es TRANSITORIO hasta el REVOKE (20260727f), que
   viaja cuando 1.1.3 esté LIVE: la app publicada 1.1.2 aún usa la vía vieja
   y quedarse sin membresía le cerraría los muros a quien sí pagó. */
async function evMembershipOf(
    url: string,
    key: string,
    email: string
): Promise<any> {
    const headers = {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
    }
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (token) {
            const g = await fetch(`${url}/functions/v1/user-action`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    token,
                    action: "get_my_membership_by_clerk",
                    params: {},
                }),
            })
            if (g.ok) return await g.json()
        }
    } catch {}
    try {
        const r = await fetch(`${url}/rest/v1/rpc/get_my_membership`, {
            method: "POST",
            headers,
            body: JSON.stringify({ p_email: email }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

function useEscanerMembershipStatus(
    supabaseUrl: string,
    supabaseAnonKey: string,
    clerkUserId: string
): boolean {
    const [email, setEmail] = useState<string>(() => {
        try {
            const u = (window as any).Clerk?.user
            return (
                u?.primaryEmailAddress?.emailAddress ||
                u?.emailAddresses?.[0]?.emailAddress ||
                ""
            )
        } catch {
            return ""
        }
    })
    /* v2.27 — Semilla del estado de membresía desde cache (anti-parpadeo):
       un miembro que regresa arranca en true, así NO se ve "Primer nivel
       libre" un instante mientras resuelve la verificación remota. */
    const [isMember, setIsMember] = useState<boolean>(() => {
        try {
            return (
                typeof window !== "undefined" &&
                localStorage.getItem("rsv-esc-member-last") === "1"
            )
        } catch {
            return false
        }
    })
    useEffect(() => {
        if (typeof window === "undefined") return
        const readEmail = () => {
            const u = (window as any).Clerk?.user
            const e =
                u?.primaryEmailAddress?.emailAddress ||
                u?.emailAddresses?.[0]?.emailAddress ||
                ""
            setEmail((prev) => (prev === e ? prev : e))
        }
        readEmail()
        const id = setInterval(readEmail, 1500)
        return () => clearInterval(id)
    }, [clerkUserId])
    useEffect(() => {
        if (!email || !supabaseUrl || !supabaseAnonKey) {
            /* Solo bajamos a false si Clerk YA resolvió sin sesión (logout
               real). Mientras hidrata, conservamos el valor sembrado. */
            if ((window as any).Clerk?.loaded) setIsMember(false)
            return
        }
        let cancelled = false
        evMembershipOf(supabaseUrl, supabaseAnonKey, email)
            .then((res) => {
                if (cancelled) return
                /* Miembro PLENO = Sintonía (599) o Inmersión (1,111) — abre
                   Escáner/Calibraciones/Holoteca/Simuladores. Los tiers
                   solo-Decodificador (199 = group_name 'decoder', 399 =
                   'dream') NO son miembros plenos: su acceso al Decodificador
                   se resuelve aparte (useDecoderAccessStatus /
                   useDreamAccessStatus). group_name nulo/legacy → pleno
                   (fail-open, no romper subs viejas). */
                const member =
                    !!res?.active &&
                    res?.group_name !== "decoder" &&
                    res?.group_name !== "dream"
                setIsMember(member)
                try {
                    localStorage.setItem(
                        "rsv-esc-member-last",
                        member ? "1" : "0"
                    )
                } catch {}
            })
            .catch(() => {
                if (!cancelled) setIsMember(false)
            })
        return () => {
            cancelled = true
        }
    }, [email, supabaseUrl, supabaseAnonKey])
    return isMember
}

/* Acceso ilimitado al Decodificador de Materia — señal SEPARADA de la
   membresía Sintonía. Lo otorga el tier Decodificador (199) Y cualquier
   Sintonía Solar activa. El Escáner / Calibraciones / Holoteca NO se
   abren con esto: siguen pidiendo isActiveMember (Sintonía).
   Web: isActiveMember || campo `decoder` de get_my_membership (tier 199
   pagado por Stripe). Hasta que el backend reporte ese campo queda en
   false y Sintonía cubre vía isActiveMember. (En iOS el OR con el
   entitlement decoder_monthly de RevenueCat lo agrega la versión de este
   hook en escaner-app.) */
function useDecoderAccessStatus(
    supabaseUrl: string,
    supabaseAnonKey: string,
    clerkUserId: string,
    isActiveMember: boolean
): boolean {
    const [email, setEmail] = useState<string>("")
    const [webDecoder, setWebDecoder] = useState<boolean>(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const readEmail = () => {
            const u = (window as any).Clerk?.user
            const e =
                u?.primaryEmailAddress?.emailAddress ||
                u?.emailAddresses?.[0]?.emailAddress ||
                ""
            setEmail((prev) => (prev === e ? prev : e))
        }
        readEmail()
        const id = setInterval(readEmail, 1500)
        return () => clearInterval(id)
    }, [clerkUserId])
    useEffect(() => {
        if (!email || !supabaseUrl || !supabaseAnonKey) {
            setWebDecoder(false)
            return
        }
        let cancelled = false
        evMembershipOf(supabaseUrl, supabaseAnonKey, email)
            .then((res) => {
                /* Materia la incluyen TODOS los tiers de pago (199/399/599/
                   1111) → cualquier sub activa abre el Decodificador de
                   Materia. Derivado de `active` (la RPC no devuelve `decoder`);
                   compensa el angostamiento de useEscanerMembershipStatus. */
                if (!cancelled) setWebDecoder(!!res?.active)
            })
            .catch(() => {
                if (!cancelled) setWebDecoder(false)
            })
        return () => {
            cancelled = true
        }
    }, [email, supabaseUrl, supabaseAnonKey])
    return isActiveMember || webDecoder
}

/* Acceso al Decodificador de Sueños — lo abren Sintonía Solar y el tier
   Dual (399). En web se lee del campo `dream` de get_my_membership (aún
   no cableado server-side → false); iOS suma el entitlement vía la versión
   de escaner-app. Mientras tanto = isActiveMember (Sintonía). */
function useDreamAccessStatus(
    supabaseUrl: string,
    supabaseAnonKey: string,
    clerkUserId: string,
    isActiveMember: boolean
): boolean {
    const [email, setEmail] = useState<string>("")
    const [webDream, setWebDream] = useState<boolean>(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const readEmail = () => {
            const u = (window as any).Clerk?.user
            const e =
                u?.primaryEmailAddress?.emailAddress ||
                u?.emailAddresses?.[0]?.emailAddress ||
                ""
            setEmail((prev) => (prev === e ? prev : e))
        }
        readEmail()
        const id = setInterval(readEmail, 1500)
        return () => clearInterval(id)
    }, [clerkUserId])
    useEffect(() => {
        if (!email || !supabaseUrl || !supabaseAnonKey) {
            setWebDream(false)
            return
        }
        let cancelled = false
        evMembershipOf(supabaseUrl, supabaseAnonKey, email)
            .then((res) => {
                /* Sueños lo incluyen 399/599/1111, NO el tier 199 (solo
                   Materia, group_name 'decoder'). Derivado de `active` +
                   group_name (la RPC no devuelve `dream`). */
                if (!cancelled)
                    setWebDream(
                        !!res?.active && res?.group_name !== "decoder"
                    )
            })
            .catch(() => {
                if (!cancelled) setWebDream(false)
            })
        return () => {
            cancelled = true
        }
    }, [email, supabaseUrl, supabaseAnonKey])
    return isActiveMember || webDream
}

/* ═══ HELPERS ═══ */
const hx = (hex: string, a = 1) => {
    /* v2.4 — Guarda contra hex undefined (Framer instancia los Code
       Files standalone con props undefined al cargar el module; sin
       este guard cualquier hx(accent, x) crashea con "Cannot read
       properties of undefined (reading 'replace')"). Devuelve cyan
       neutro como fallback. */
    if (!hex || typeof hex !== "string") {
        return `rgba(0,194,255,${a})`
    }
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* ═══ #3 Resonancia táctil — onda imperativa portaleada a <body> ═══
   Cada toque emite una onda de choque (anillo + núcleo de luz) desde el
   punto EXACTO de contacto. Imperativa + portaleada a document.body →
   sobrevive a cualquier transición/unmount de React (clave para el tap del
   nodo del Radar, que abre la Sonda y desmonta el radar; la onda no se
   pierde en la transición). CSS keyframes (compositor/GPU, no rAF) → barata
   a 10K. Llamar con coords de PANTALLA (clientX/clientY del pointer/click).
   Auto-inyecta sus keyframes la 1ª vez (no depende de useInjectCss). */
let _rsvRippleCssDone = false
function ensureRippleCss() {
    if (typeof document === "undefined" || _rsvRippleCssDone) return
    _rsvRippleCssDone = true
    if (document.getElementById("rsv-touch-ripple-css")) return
    const el = document.createElement("style")
    el.id = "rsv-touch-ripple-css"
    el.textContent =
        "@keyframes rsv-ripple-ring{from{transform:translate(-50%,-50%) scale(0.12);opacity:.7}to{transform:translate(-50%,-50%) scale(1);opacity:0}}" +
        "@keyframes rsv-ripple-core{from{transform:translate(-50%,-50%) scale(0);opacity:.55}to{transform:translate(-50%,-50%) scale(1);opacity:0}}"
    document.head.appendChild(el)
}
function fireTouchRipple(
    x: number,
    y: number,
    opts?: { color?: string; size?: number; duration?: number }
) {
    if (typeof document === "undefined") return
    ensureRippleCss()
    const color = opts?.color || "#00E5FF"
    const size = opts?.size ?? 150
    const dur = opts?.duration ?? 560
    const wrap = document.createElement("div")
    wrap.style.cssText =
        `position:fixed;left:${x}px;top:${y}px;width:0;height:0;` +
        `z-index:2147483600;pointer-events:none`
    const ring = document.createElement("span")
    ring.style.cssText =
        `position:absolute;left:0;top:0;width:${size}px;height:${size}px;` +
        `border-radius:50%;border:1.5px solid ${hx(color, 0.7)};` +
        `box-shadow:0 0 16px ${hx(color, 0.5)};` +
        `transform:translate(-50%,-50%) scale(0.12);opacity:0;` +
        `animation:rsv-ripple-ring ${dur}ms cubic-bezier(0.16,1,0.3,1) forwards`
    const core = document.createElement("span")
    const cs = Math.round(size * 0.62)
    core.style.cssText =
        `position:absolute;left:0;top:0;width:${cs}px;height:${cs}px;` +
        `border-radius:50%;background:radial-gradient(circle,${hx(color, 0.5)} 0%,transparent 70%);` +
        `mix-blend-mode:screen;transform:translate(-50%,-50%) scale(0);opacity:0;` +
        `animation:rsv-ripple-core ${Math.round(dur * 0.9)}ms ease-out forwards`
    wrap.appendChild(ring)
    wrap.appendChild(core)
    document.body.appendChild(wrap)
    window.setTimeout(() => {
        wrap.remove()
    }, dur + 100)
}

/* ═══ #1 El campo respira contigo — señal global del Índice de Luz ═══
   Un latido ambiental recorre la app; su TEMPO y COLOR salen del Índice de
   Luz actual (alto = lento + dorado + amplio; bajo = corto + frío). Señal
   global vía store módulo-level (useSyncExternalStore) sembrada de
   localStorage → disponible en cualquier capa (cosmos, halo del Radar,
   anillo de la Firma, brillo de la barra) sin prop-drilling. El Radar la
   publica con setLightIndex; las demás capas la leen con useLightIndex. */
let _lightIndex: number | null = (() => {
    try {
        if (typeof localStorage === "undefined") return null
        const v = localStorage.getItem("rsv-light-index")
        return v == null || v === "" ? null : Number(v)
    } catch {
        return null
    }
})()
const _lightSubs = new Set<() => void>()
function setLightIndex(n: number | null) {
    const v =
        n == null || Number.isNaN(n)
            ? null
            : Math.max(0, Math.min(100, Math.round(n)))
    if (v === _lightIndex) return
    _lightIndex = v
    try {
        if (typeof localStorage !== "undefined") {
            if (v == null) localStorage.removeItem("rsv-light-index")
            else localStorage.setItem("rsv-light-index", String(v))
        }
    } catch {}
    _lightSubs.forEach((f) => f())
}
function getLightIndex(): number | null {
    return _lightIndex
}
function subscribeLightIndex(cb: () => void): () => void {
    _lightSubs.add(cb)
    return () => {
        _lightSubs.delete(cb)
    }
}
function useLightIndex(): number | null {
    return useSyncExternalStore(
        subscribeLightIndex,
        getLightIndex,
        getLightIndex
    )
}
/* Mapea el Índice de Luz (0-100) a parámetros del latido. */
function breathParams(index: number | null): {
    durSec: number
    color: string
    index: number
} {
    const i = index == null ? 55 : Math.max(0, Math.min(100, index))
    /* Bajo = rápido (4.4s) · Alto = lento (9s). */
    const durSec = 4.4 + (i / 100) * 4.6
    /* Bajo = frío (rojo) · Medio = cyan · Alto = dorado. */
    const color = i < 40 ? "#FF7878" : i < 70 ? "#00E5FF" : "#D4A843"
    return { durSec, color, index: i }
}
/* CSS custom properties para alimentar las keyframes esc-breathe-* sin
   re-render por frame: --breath-dur (animation-duration) + --breath-color
   (color del aura/anillo). Se leen una vez por elemento, no se interpolan.
   Se esparce en el style del elemento que respira. */
function breathVars(index: number | null): React.CSSProperties {
    const p = breathParams(index)
    const s: Record<string, string> = {
        "--breath-dur": `${p.durSec.toFixed(2)}s`,
        "--breath-color": p.color,
    }
    return s as unknown as React.CSSProperties
}
/* Auto-inyecta las keyframes del latido (esc-breathe-*) la 1ª vez, sin
   depender de useInjectCss → el campo respira en cualquier capa/repo. */
let _rsvBreatheCssDone = false
function ensureBreatheCss() {
    if (typeof document === "undefined" || _rsvBreatheCssDone) return
    _rsvBreatheCssDone = true
    if (document.getElementById("rsv-breathe-css")) return
    const el = document.createElement("style")
    el.id = "rsv-breathe-css"
    el.textContent =
        "@keyframes esc-breathe-aura{0%,100%{opacity:.10;transform:scale(1)}50%{opacity:.30;transform:scale(1.05)}}" +
        "@keyframes esc-breathe-ring{0%,100%{opacity:.42;transform:scale(1)}50%{opacity:.9;transform:scale(1.04)}}"
    document.head.appendChild(el)
}
/* Aura de fondo que respira con el Índice de Luz (color + tempo). Componente
   AISLADO (lee useLightIndex) → solo él re-renderiza al cambiar el índice, no
   su contenedor (cosmos/shell). Drop-in: <BreathAura zIndex={N} />. */
function BreathAura({ zIndex = 0 }: { zIndex?: number }) {
    const index = useLightIndex()
    useLayoutEffect(() => {
        ensureBreatheCss()
    }, [])
    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex,
                background:
                    "radial-gradient(circle at 50% 42%, var(--breath-color) 0%, transparent 55%)",
                mixBlendMode: "screen",
                transformOrigin: "center",
                animationName: "esc-breathe-aura",
                animationDuration: "var(--breath-dur, 6s)",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                ...breathVars(index),
            }}
        />
    )
}
BreathAura.displayName = "BreathAura"

/* ═══ #2 Todo se cristaliza desde la luz — materialización ═══
   Los elementos no "aparecen": se ensamblan desde esquirlas de luz que
   convergen (entrada) y un destello cristalino. Lenguaje del MateriaSigil /
   las gemas. Tres piezas (todas CSS-compositor, perf 10K):
   · ensureMaterializeCss — auto-inyecta las keyframes (cualquier capa/repo).
   · fireMaterialize(x,y) — burst imperativo portaleado a body: esquirlas que
     convergen al punto + flash. Sobrevive transiciones (como fireTouchRipple).
   · <MaterializeIn> — wrapper que cristaliza a su hijo al montar. */
let _rsvMaterializeCssDone = false
function ensureMaterializeCss() {
    if (typeof document === "undefined" || _rsvMaterializeCssDone) return
    _rsvMaterializeCssDone = true
    if (document.getElementById("rsv-materialize-css")) return
    const el = document.createElement("style")
    el.id = "rsv-materialize-css"
    el.textContent =
        "@keyframes esc-crystallize-in{0%{opacity:0;transform:scale(0.9);filter:blur(10px) brightness(1.6)}60%{opacity:1;filter:blur(2px) brightness(1.15)}100%{opacity:1;transform:scale(1);filter:blur(0) brightness(1)}}" +
        "@keyframes esc-materialize-shard{0%{transform:translate(var(--sx,0),var(--sy,0)) scale(0.3) rotate(var(--sr,0deg));opacity:0}35%{opacity:.95}100%{transform:translate(0,0) scale(1) rotate(0deg);opacity:0}}" +
        "@keyframes esc-materialize-flash{0%{opacity:0;transform:translate(-50%,-50%) scale(0.2)}40%{opacity:.65}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}"
    document.head.appendChild(el)
}
function fireMaterialize(
    x: number,
    y: number,
    opts?: {
        color?: string
        count?: number
        radius?: number
        duration?: number
    }
) {
    if (typeof document === "undefined") return
    ensureMaterializeCss()
    const color = opts?.color || "#00E5FF"
    const count = opts?.count ?? 12
    const radius = opts?.radius ?? 90
    const dur = opts?.duration ?? 720
    const wrap = document.createElement("div")
    wrap.style.cssText =
        `position:fixed;left:${x}px;top:${y}px;width:0;height:0;` +
        `z-index:2147483600;pointer-events:none`
    const flash = document.createElement("span")
    flash.style.cssText =
        `position:absolute;left:0;top:0;width:64px;height:64px;border-radius:50%;` +
        `background:radial-gradient(circle,${hx(color, 0.6)} 0%,transparent 65%);` +
        `mix-blend-mode:screen;transform:translate(-50%,-50%) scale(0.2);opacity:0;` +
        `animation:esc-materialize-flash ${dur}ms ease-out forwards`
    wrap.appendChild(flash)
    for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5
        const dist = radius * (0.6 + Math.random() * 0.5)
        const sx = Math.cos(ang) * dist
        const sy = Math.sin(ang) * dist
        const sr = `${Math.round((Math.random() - 0.5) * 220)}deg`
        const sz = 3 + Math.random() * 3
        const sh = document.createElement("span")
        sh.style.cssText =
            `position:absolute;left:0;top:0;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;` +
            `background:${color};border-radius:1px;box-shadow:0 0 6px ${hx(color, 0.9)};` +
            `--sx:${sx.toFixed(1)}px;--sy:${sy.toFixed(1)}px;--sr:${sr};` +
            `transform:translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) scale(0.3);opacity:0;` +
            `animation:esc-materialize-shard ${dur}ms cubic-bezier(0.16,1,0.3,1) ${Math.round(Math.random() * 120)}ms forwards`
        wrap.appendChild(sh)
    }
    document.body.appendChild(wrap)
    window.setTimeout(() => {
        wrap.remove()
    }, dur + 220)
}
/* Wrapper que cristaliza a su hijo al montar (entrada). Keyear para re-disparar. */
function MaterializeIn({
    children,
    duration = 700,
    delay = 0,
    style,
}: {
    children: React.ReactNode
    duration?: number
    delay?: number
    style?: React.CSSProperties
}) {
    useLayoutEffect(() => {
        ensureMaterializeCss()
    }, [])
    return (
        <div
            style={{
                animationName: "esc-crystallize-in",
                animationDuration: `${duration}ms`,
                animationDelay: delay ? `${delay}ms` : undefined,
                animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                animationFillMode: "both",
                ...style,
            }}
        >
            {children}
        </div>
    )
}
MaterializeIn.displayName = "MaterializeIn"

/* ═══ #5 El campo tiene estados de ánimo — cinemática de estado ═══
   La atmósfera entera reacciona a los momentos que importan. Tres moods
   imperativos, portaleados a body, CSS-compositor (perf 10K), una sola vez:
   · fireAuroraBloom()  — florecimiento tipo aurora (cierre 6/6, veredicto LIMPIO).
   · fireFieldWave(x,y) — onda que irradia desde un punto por toda la pantalla
     (desbloqueo dorado, apertura del muro, veredicto).
   · fireFieldTension() — el campo se tensa: viñeta fría pulsante (pilar crítico,
     veredicto TÓXICO). */
let _rsvFieldMoodCssDone = false
function ensureFieldMoodCss() {
    if (typeof document === "undefined" || _rsvFieldMoodCssDone) return
    _rsvFieldMoodCssDone = true
    if (document.getElementById("rsv-field-mood-css")) return
    const el = document.createElement("style")
    el.id = "rsv-field-mood-css"
    el.textContent =
        "@keyframes esc-field-wave{0%{transform:translate(-50%,-50%) scale(0.04);opacity:.5}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}" +
        "@keyframes esc-field-wave-core{0%{transform:translate(-50%,-50%) scale(0.2);opacity:.45}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}" +
        "@keyframes esc-aurora-bloom{0%{opacity:0}22%{opacity:.5}60%{opacity:.34}100%{opacity:0}}" +
        "@keyframes esc-field-tension{0%{opacity:0}28%{opacity:.6}100%{opacity:0}}"
    document.head.appendChild(el)
}
function fireFieldWave(
    x: number,
    y: number,
    opts?: { color?: string; duration?: number }
) {
    if (typeof document === "undefined") return
    ensureFieldMoodCss()
    const color = opts?.color || GOLD
    const dur = opts?.duration ?? 900
    const diag =
        typeof window !== "undefined"
            ? Math.hypot(window.innerWidth, window.innerHeight)
            : 1200
    const D = Math.round(diag * 2.2)
    const wrap = document.createElement("div")
    wrap.style.cssText =
        `position:fixed;left:${x}px;top:${y}px;width:0;height:0;` +
        `z-index:2147483600;pointer-events:none`
    const core = document.createElement("span")
    const cd = Math.round(D * 0.6)
    core.style.cssText =
        `position:absolute;left:0;top:0;width:${cd}px;height:${cd}px;border-radius:50%;` +
        `background:radial-gradient(circle,${hx(color, 0.28)} 0%,transparent 60%);` +
        `mix-blend-mode:screen;transform:translate(-50%,-50%) scale(0.2);opacity:0;` +
        `animation:esc-field-wave-core ${Math.round(dur * 0.85)}ms ease-out forwards`
    const ring = document.createElement("span")
    ring.style.cssText =
        `position:absolute;left:0;top:0;width:${D}px;height:${D}px;border-radius:50%;` +
        `border:2px solid ${hx(color, 0.6)};` +
        `box-shadow:0 0 40px ${hx(color, 0.4)},inset 0 0 60px ${hx(color, 0.25)};` +
        `transform:translate(-50%,-50%) scale(0.04);opacity:0;` +
        `animation:esc-field-wave ${dur}ms cubic-bezier(0.22,1,0.36,1) forwards`
    wrap.appendChild(core)
    wrap.appendChild(ring)
    document.body.appendChild(wrap)
    window.setTimeout(() => {
        wrap.remove()
    }, dur + 140)
}
function fireAuroraBloom(opts?: { duration?: number }) {
    if (typeof document === "undefined") return
    ensureFieldMoodCss()
    const dur = opts?.duration ?? 2400
    const wrap = document.createElement("div")
    wrap.style.cssText =
        `position:fixed;inset:0;z-index:2147483590;pointer-events:none;` +
        `mix-blend-mode:screen;opacity:0;` +
        `background:radial-gradient(120% 80% at 50% 16%, rgba(0,229,255,0.30) 0%, transparent 46%),` +
        `radial-gradient(120% 70% at 72% 30%, rgba(212,168,67,0.24) 0%, transparent 52%),` +
        `radial-gradient(120% 80% at 28% 26%, rgba(150,90,255,0.20) 0%, transparent 52%);` +
        `animation:esc-aurora-bloom ${dur}ms ease-in-out forwards`
    document.body.appendChild(wrap)
    window.setTimeout(() => {
        wrap.remove()
    }, dur + 140)
}
function fireFieldTension(opts?: { color?: string; duration?: number }) {
    if (typeof document === "undefined") return
    ensureFieldMoodCss()
    const dur = opts?.duration ?? 1500
    const cold = opts?.color || "rgba(34,90,160,0.55)"
    const wrap = document.createElement("div")
    wrap.style.cssText =
        `position:fixed;inset:0;z-index:2147483590;pointer-events:none;opacity:0;` +
        `background:radial-gradient(circle at 50% 50%, transparent 32%, ${cold} 100%);` +
        `animation:esc-field-tension ${dur}ms ease-in-out forwards`
    document.body.appendChild(wrap)
    window.setTimeout(() => {
        wrap.remove()
    }, dur + 140)
}

/* Inyecta prefilled_email + client_reference_id al Payment Link de
   Sintonía Solar para que Stripe pre-rellene el email y el webhook
   pueda enlazar la nueva suscripción al Clerk user incluso si paga
   con un correo distinto. */
function withCheckoutIdentity(baseUrl: string): string {
    if (!baseUrl) return ""
    if (typeof window === "undefined") return baseUrl
    try {
        const u = (window as any).Clerk?.user
        if (!u) return baseUrl
        const email =
            u?.primaryEmailAddress?.emailAddress ||
            u?.emailAddresses?.[0]?.emailAddress ||
            ""
        const clerkId = u?.id || ""
        if (!email && !clerkId) return baseUrl
        const sep = baseUrl.includes("?") ? "&" : "?"
        const parts: string[] = []
        if (email) parts.push(`prefilled_email=${encodeURIComponent(email)}`)
        if (clerkId)
            parts.push(`client_reference_id=${encodeURIComponent(clerkId)}`)
        return `${baseUrl}${sep}${parts.join("&")}`
    } catch {
        return baseUrl
    }
}

/* Dispara el correo del Primer Ciclo Sellado fire-and-forget. Guard por
   localStorage clerkUserId+cycleTs para evitar duplicados ante refresh.

   v2.7 — Antes silenciaba sin log si faltaba email de Clerk → diagnóstico
   imposible cuando un tripulante no recibía el correo. Ahora todos los
   bail-outs y errores quedan en la consola con prefijo [CicloSellado].
   Diego puede capturar con el snippet RSV de CLAUDE.md y mandarlas a
   Sala de Comando. También se agregó fallback opcional a Supabase: si
   Clerk no expone email pero el caller pasa fallbackEmail (ej. leído
   de profiles), se usa ese. */
/* AUDITORÍA PARTE 3 (2026-07-27) · El correo de cierre de ciclo ya NO se pide
   a Pipedream desde aquí. La dirección del webhook viajaba incrustada en el
   paquete de la app y el webhook no verificaba nada, así que cualquiera que la
   extrajera podía mandar un correo con nuestra marca, a la dirección que
   quisiera y con el nombre, el Índice y los puntajes que quisiera.
   Ahora se pide a la función `dispatch-ciclo-sellado`, que verifica la sesión,
   resuelve correo y nombre CONTRA LA BASE y firma el despacho del lado del
   servidor. El secreto no puede vivir aquí: se saca del paquete igual de fácil
   que la dirección. Si no hay `supabaseUrl`, cae al camino viejo para no dejar
   sin correo a una build anterior. Espejo exacto de escaner-app/src/…/EV_Shared.tsx. */
function dispatchCicloSellado(args: {
    clerkUserId: string
    cycleTs: number
    scores: Scores
    indice: number
    fallbackEmail?: string
    fallbackFullName?: string
    supabaseUrl?: string
}) {
    const log = (...m: any[]) => console.log("[CicloSellado]", ...m)
    const warn = (...m: any[]) => console.warn("[CicloSellado]", ...m)
    if (!args.supabaseUrl && !CICLO_SELLADO_WEBHOOK_URL) {
        warn("BAIL — sin ruta de despacho")
        return
    }
    if (typeof window === "undefined") {
        warn("BAIL — window undefined (SSR)")
        return
    }
    const key = `rsv_ciclo_sellado_${args.clerkUserId}_${args.cycleTs}`
    try {
        if (window.localStorage.getItem(key)) {
            log(
                "SKIP — ya disparado (localStorage guard)",
                key,
                "clerkUserId:",
                args.clerkUserId
            )
            return
        }
    } catch {}
    const user = (window as any).Clerk?.user
    const clerkEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        ""
    const email = clerkEmail || args.fallbackEmail || ""
    if (!email) {
        warn(
            "BAIL — sin email (Clerk vacío y fallback ausente). clerkUserId:",
            args.clerkUserId,
            "Clerk loaded:",
            !!(window as any).Clerk,
            "Clerk user:",
            !!user
        )
        return
    }
    const full_name =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        args.fallbackFullName ||
        ""
    const payload = {
        clerk_user_id: args.clerkUserId,
        email,
        full_name,
        indice: args.indice,
        scores: args.scores,
        fecha: new Date(args.cycleTs).toISOString(),
    }
    log(
        "DISPATCH",
        "email:",
        email,
        "indice:",
        args.indice,
        "from:",
        clerkEmail ? "clerk" : "fallback"
    )
    const marcar = () => {
        try {
            window.localStorage.setItem(key, String(Date.now()))
        } catch {}
    }

    const porElCaminoViejo = () => {
        if (!CICLO_SELLADO_WEBHOOK_URL) return
        fetch(CICLO_SELLADO_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => {
                log("RESPONSE (viejo) status:", res.status)
                if (res.ok) marcar()
            })
            .catch((err) => warn("FETCH (viejo) failed:", err))
    }

    if (args.supabaseUrl) {
        /* Camino firmado: el servidor verifica la sesión y arma el contenido.
           Solo viajan el ciclo y los puntajes; correo y nombre los resuelve él. */
        Promise.resolve((window as any).Clerk?.session?.getToken?.())
            .then((token: string | undefined) => {
                if (!token) {
                    warn("BAIL — sin token de sesión")
                    return
                }
                return fetch(
                    `${args.supabaseUrl}/functions/v1/dispatch-ciclo-sellado`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            token,
                            cycle_ts: args.cycleTs,
                            indice: args.indice,
                            scores: args.scores,
                        }),
                    }
                ).then((res) => {
                    log("RESPONSE status:", res.status, res.ok ? "OK" : "FAIL")
                    if (res.ok) marcar()
                    // Respaldo transitorio: si la función todavía no está
                    // desplegada, el correo sale por el camino de siempre.
                    else if (res.status === 404) porElCaminoViejo()
                })
            })
            .catch(() => porElCaminoViejo())
        return
    }

    fetch(CICLO_SELLADO_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then((res) => {
            log("RESPONSE status:", res.status, res.ok ? "OK" : "FAIL")
            marcar()
        })
        .catch((err) => {
            warn("FETCH failed:", err)
        })
}

function normalizeProtos(raw: any[]): DBProtocol[] {
    return raw.map((p) => ({
        ...p,
        tareas_json:
            typeof p.tareas_json === "string"
                ? JSON.parse(p.tareas_json)
                : Array.isArray(p.tareas_json)
                  ? p.tareas_json
                  : [],
        tareas_completadas:
            typeof p.tareas_completadas === "string"
                ? JSON.parse(p.tareas_completadas)
                : Array.isArray(p.tareas_completadas)
                  ? p.tareas_completadas
                  : [],
    }))
}

/* ═══ Cycle state persistence via localStorage ═══ */
function saveCycleState(
    userId: string,
    scanned: Set<PillarId>,
    cooldownTs?: number | null
) {
    if (!userId || typeof window === "undefined") return
    try {
        const prev = localStorage.getItem(`rsv_cycle_${userId}`)
        const prevData = prev ? JSON.parse(prev) : {}
        const data = {
            pillars: [...scanned],
            ts: Date.now(),
            cooldownTs:
                cooldownTs !== undefined
                    ? cooldownTs
                    : prevData.cooldownTs || null,
        }
        localStorage.setItem(`rsv_cycle_${userId}`, JSON.stringify(data))
    } catch {}
}
function loadCycleState(
    userId: string
): { pillars: PillarId[]; ts: number; cooldownTs: number | null } | null {
    if (!userId || typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(`rsv_cycle_${userId}`)
        if (!raw) return null
        const data = JSON.parse(raw)
        if (Date.now() - data.ts > 1800_000) {
            localStorage.removeItem(`rsv_cycle_${userId}`)
            return null
        }
        return {
            pillars: data.pillars || [],
            ts: data.ts,
            cooldownTs: data.cooldownTs || null,
        }
    } catch {
        return null
    }
}
function clearCycleState(userId: string) {
    if (!userId || typeof window === "undefined") return
    try {
        localStorage.removeItem(`rsv_cycle_${userId}`)
    } catch {}
}

/* ═══ Supabase REST helpers ═══ */
async function sbGet(
    url: string,
    key: string,
    table: string,
    params = ""
): Promise<any> {
    if (!url || !key) return null
    try {
        const r = await fetch(`${url}/rest/v1/${table}?${params}`, {
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                Accept: "application/json",
            },
        })
        if (!r.ok) {
            console.error(
                `[sbGet] ${table} ${r.status}:`,
                await r.text().catch(() => "")
            )
            return null
        }
        return await r.json()
    } catch (e) {
        console.error(`[sbGet] ${table} error:`, e)
        return null
    }
}
async function sbPost(
    url: string,
    key: string,
    table: string,
    data: any
): Promise<any> {
    if (!url || !key) return null
    try {
        const r = await fetch(`${url}/rest/v1/${table}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
                Prefer: "return=representation",
            },
            body: JSON.stringify(data),
        })
        if (!r.ok) {
            console.error(
                `[sbPost] ${table} ${r.status}:`,
                await r.text().catch(() => "")
            )
            return null
        }
        return await r.json()
    } catch (e) {
        console.error(`[sbPost] ${table} error:`, e)
        return null
    }
}
async function sbPatch(
    url: string,
    key: string,
    table: string,
    match: string,
    data: any
): Promise<any> {
    if (!url || !key) return null
    try {
        const r = await fetch(`${url}/rest/v1/${table}?${match}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
                Prefer: "return=representation",
            },
            body: JSON.stringify(data),
        })
        if (!r.ok) {
            console.error(
                `[sbPatch] ${table} ${r.status}:`,
                await r.text().catch(() => "")
            )
            return null
        }
        return await r.json()
    } catch (e) {
        console.error(`[sbPatch] ${table} error:`, e)
        return null
    }
}
async function sbRpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any>
) {
    if (!url || !key) return null
    try {
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

/* Acción del Tripulante verificada vía gateway `user-action` (token de
   Clerk → el servidor inyecta el clerk_user_id verificado). Reemplaza
   lecturas/escrituras directas a tablas con clerk_user_id forjable
   (radar: save_scan_vibracional / get_my_scan_history). */
async function userAction(
    url: string,
    key: string,
    action: string,
    params: Record<string, any> = {}
) {
    if (!url || !key) return null
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (!token) return null
        const r = await fetch(`${url}/functions/v1/user-action`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token, action, params }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

/* ═══ Telemetría de navegación — registra capa/sub-capa abierta ═══
   Fire-and-forget al gateway user-action (inyecta el clerk id verificado).
   Deduplica por SESIÓN (Set módulo-level) → un evento por capa/sub-capa por
   sesión; el agregado del Motor da alcance (usuarios) + frecuencia (sesiones).
   Reset al recargar = nueva sesión. Barato a 10K (1 fetch/capa/sesión). */
const _navRecorded = new Set<string>()
function recordNav(
    url: string,
    key: string,
    layer: string,
    sublayer?: string | null
) {
    if (!url || !key || !layer) return
    const k = `${layer}|${sublayer || ""}`
    if (_navRecorded.has(k)) return
    _navRecorded.add(k)
    const platform =
        typeof window !== "undefined" &&
        (window as any).Capacitor?.isNativePlatform?.()
            ? "ios"
            : "web"
    try {
        Promise.resolve(
            userAction(url, key, "record_nav_event", {
                p_layer: layer,
                p_sublayer: sublayer || null,
                p_platform: platform,
            })
        ).catch(() => {})
    } catch {}
}

/* ═══ DEFAULT EXPORT ═══
   Función-componente con todos los helpers adjuntos como propiedades.
   Framer requiere que cada Code File default-exporte un componente
   React; un objeto plano dispara waitForComponentLoader timeout. La
   función devuelve null (no renderiza nada si Diego accidentalmente
   la coloca en un canvas). Los consumidores siguen destructurando:
   `import Shared from "./EV_Shared.tsx"; const { hx, GOLD } = Shared`. */
function EVShared(_props: any) {
    return (
        <div
            style={{ display: "none" }}
            data-rsv-helpers="EV_Shared"
            aria-hidden="true"
        />
    )
}
EVShared.displayName = "EV_Shared"
const Shared = Object.assign(EVShared, {
    GOLD,
    CYAN,
    COOLDOWN_SEC,
    SINTONIA_SOLAR_LINK,
    DECODER_SOLAR_LINK,
    CICLO_SELLADO_WEBHOOK_URL,
    TAB_ORDER_D,
    TAB_ORDER_M,
    PROC_MSGS,
    CSS,
    hx,
    fireTouchRipple,
    setLightIndex,
    getLightIndex,
    useLightIndex,
    breathParams,
    breathVars,
    ensureBreatheCss,
    BreathAura,
    ensureMaterializeCss,
    fireMaterialize,
    MaterializeIn,
    fireFieldWave,
    fireAuroraBloom,
    fireFieldTension,
    withCheckoutIdentity,
    dispatchCicloSellado,
    normalizeProtos,
    saveCycleState,
    loadCycleState,
    clearCycleState,
    sbGet,
    sbPost,
    sbPatch,
    sbRpc,
    userAction,
    recordNav,
    useIsMobile,
    useIsPWAStandalone,
    useEscanerMembershipStatus,
    useDecoderAccessStatus,
    useDreamAccessStatus,
    useInjectCss,
})
export default Shared
