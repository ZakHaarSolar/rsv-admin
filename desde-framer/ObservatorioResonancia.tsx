// Red Solar Viva — ObservatorioResonancia.tsx v1.10 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// Lóbulo frontal de la Estación de Mando. Super-componente que unifica la
// telemetría MACRO (Cámara Solar grupal — transcripts, trayectorias, proyección
// del próximo sprint) y la MICRO (Ignición 1:1 — agenda, escaneo relámpago y
// gestor de preguntas dinámicas).
//
// Arquitectura fractal: este archivo es el SHELL + gate admin + segmented
// control + orquestación. El contenido denso vive en:
//   · ObservatorioResonanciaMacro.tsx
//   · ObservatorioResonanciaMicro.tsx
//
// Default export porque Framer no resuelve named exports cuando otro archivo
// del proyecto hace `import X from "./Y.tsx"`.

import * as React from "react"
import { useEffect, useLayoutEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import NavRevealPin from "./NavRevealPin.tsx"
import ObservatorioResonanciaMacro from "./ObservatorioResonanciaMacro.tsx"
import ObservatorioResonanciaMicro from "./ObservatorioResonanciaMicro.tsx"
import ObservatorioResonanciaPresenciales from "./ObservatorioResonanciaPresenciales.tsx"

/* ════════════════════════════════════════════════════════════════
   CSS · Glassmorphism Cyber-Zen. Comparte vocabulario con
   TelemetriaDelNucleo (.adm-glass, .adm-glass-cyan/gold/platinum)
   para que cualquier sub-componente reuse las mismas piezas.
   ════════════════════════════════════════════════════════════════ */
const OBS_CSS = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');

.obs-root {
    position: relative;
    /* v1.2 — scroll interno propio porque Domo.tsx envuelve todo con
       overflow:hidden. Sin height:100vh + overflow-y:auto la columna
       larga de Macro/Micro quedaba cortada al borde del viewport.
       v1.8 — background:transparent (antes #02050C opaco) para que el
       fondo de estrellas del Domo se vea a través como en todas las
       demás capas. También se retiró .obs-bg (gradient + estrellas
       duplicadas) por la misma razón. */
    height: 100vh;
    width: 100%;
    background: transparent;
    color: #E8EEF7;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.obs-root::-webkit-scrollbar { display: none; }

.obs-glass {
    position: relative;
    background: linear-gradient(165deg, rgba(8,22,45,0.82) 0%, rgba(5,15,35,0.88) 50%, rgba(10,20,40,0.78) 100%);
    backdrop-filter: blur(24px) saturate(1.4);
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    border: 1px solid rgba(0,194,255,0.18);
    border-radius: 20px;
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.obs-glass:hover {
    border-color: rgba(0,194,255,0.32);
    box-shadow: 0 0 36px rgba(0,194,255,0.08), inset 0 0 30px rgba(0,194,255,0.03);
}
.obs-glass-gold {
    position: relative;
    background: linear-gradient(165deg, rgba(32,26,12,0.85) 0%, rgba(20,16,6,0.90) 50%, rgba(28,22,10,0.82) 100%);
    backdrop-filter: blur(24px) saturate(1.4);
    border: 1.5px solid rgba(200,164,78,0.35);
    border-radius: 20px;
    box-shadow: 0 0 35px rgba(200,164,78,0.10), inset 0 0 25px rgba(200,164,78,0.04);
}
.obs-glass-platinum {
    position: relative;
    background: linear-gradient(165deg, rgba(26,32,48,0.85) 0%, rgba(16,22,36,0.90) 50%, rgba(24,30,44,0.82) 100%);
    backdrop-filter: blur(24px) saturate(1.4);
    border: 1.5px solid rgba(232,238,247,0.22);
    border-radius: 20px;
    box-shadow: 0 0 35px rgba(232,238,247,0.06), inset 0 0 25px rgba(232,238,247,0.03);
}

.obs-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(115deg, transparent 30%, rgba(0,194,255,0.06) 44%, rgba(255,255,255,0.03) 50%, rgba(0,194,255,0.07) 56%, transparent 70%);
    background-size: 300% 100%;
    animation: obs-shimmer-anim 16s ease-in-out infinite;
}
@keyframes obs-shimmer-anim {
    0% { background-position: 200% 50%; }
    100% { background-position: -200% 50%; }
}

/* ═══ Título portado a body ═══ */
.obs-title-overlay {
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 900;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    pointer-events: none;
    transition: opacity 0.22s ease;
}
.obs-title-overlay .obs-title-main {
    font-size: 15px;
    font-weight: 200;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(232,238,247,0.92);
    text-shadow: 0 0 14px rgba(0,194,255,0.25);
}
.obs-title-overlay .obs-title-sub {
    font-size: 8.5px;
    font-weight: 400;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(0,194,255,0.6);
}

/* ═══ Segmented control MACRO / MICRO ═══ */
.obs-seg {
    display: inline-flex;
    gap: 4px;
    padding: 5px;
    background: linear-gradient(180deg, rgba(0,20,40,0.55) 0%, rgba(0,10,25,0.72) 100%);
    border: 1px solid rgba(0,194,255,0.22);
    border-radius: 18px;
    box-shadow: 0 0 22px rgba(0,194,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
    pointer-events: auto;
}
.obs-seg-btn {
    padding: 10px 22px;
    border-radius: 13px;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255,255,255,0.44);
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 11.5px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.35s ease;
    white-space: nowrap;
    outline: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.obs-seg-btn:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(0,194,255,0.04);
    border-color: rgba(0,194,255,0.08);
}
.obs-seg-btn-on-cyan {
    background: linear-gradient(165deg, rgba(0,194,255,0.10) 0%, rgba(0,100,180,0.15) 100%);
    color: #00C2FF;
    border-color: rgba(0,194,255,0.35);
    box-shadow: 0 0 22px rgba(0,194,255,0.14), 0 0 44px rgba(0,194,255,0.05), inset 0 0 14px rgba(0,194,255,0.08);
    text-shadow: 0 0 8px rgba(0,194,255,0.45);
}
.obs-seg-btn-on-gold {
    background: linear-gradient(165deg, rgba(200,164,78,0.12) 0%, rgba(140,100,40,0.18) 100%);
    color: #D4A843;
    border-color: rgba(200,164,78,0.40);
    box-shadow: 0 0 22px rgba(200,164,78,0.16), 0 0 44px rgba(200,164,78,0.05), inset 0 0 14px rgba(200,164,78,0.09);
    text-shadow: 0 0 8px rgba(200,164,78,0.50);
}
.obs-seg-btn-on-platinum {
    background: linear-gradient(165deg, rgba(232,238,247,0.10) 0%, rgba(154,168,194,0.18) 100%);
    color: #E8EEF7;
    border-color: rgba(232,238,247,0.42);
    box-shadow: 0 0 22px rgba(232,238,247,0.16), 0 0 44px rgba(232,238,247,0.05), inset 0 0 14px rgba(232,238,247,0.09);
    text-shadow: 0 0 8px rgba(232,238,247,0.45);
}
.obs-seg-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 7px currentColor;
    animation: obs-dot-pulse 2.2s ease-in-out infinite;
}
@keyframes obs-dot-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(0.75); opacity: 0.5; }
}

.obs-seg-wrap {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    z-index: 899;
    display: flex;
    justify-content: center;
    pointer-events: none;
    transition: opacity 0.22s ease;
}

/* ═══ Contenido principal ═══ */
.obs-content {
    position: relative;
    z-index: 2;
    max-width: 1360px;
    margin: 0 auto;
    padding: 128px 32px 96px 32px;
    min-height: 100vh;
}
@media (max-width: 768px) {
    .obs-content { padding: 116px 14px 80px 14px; }
}

/* ═══ Gate states ═══ */
.obs-gate {
    /* v1.9 — sin fondo que tape el domo: las estrellas globales se
       ven continuas detrás de la tarjeta de loading/denied. El color
       oscuro vive solo en .obs-gate-card (recuadro centrado). */
    position: fixed;
    inset: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #E8EEF7;
    font-family: 'Inter', sans-serif;
    pointer-events: none;
}
.obs-gate .obs-gate-card { pointer-events: auto; }
.obs-gate-card {
    padding: 40px 56px;
    border-radius: 20px;
    background: linear-gradient(165deg, rgba(10,20,38,0.92) 0%, rgba(5,12,25,0.95) 100%);
    border: 1px solid rgba(0,194,255,0.22);
    text-align: center;
    max-width: 420px;
}
.obs-gate-title {
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: rgba(0,194,255,0.88);
    margin-bottom: 16px;
}
.obs-gate-msg {
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.06em;
    color: rgba(232,238,247,0.68);
    line-height: 1.6;
}
.obs-spinner {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid rgba(0,194,255,0.15);
    border-top-color: rgba(0,194,255,0.8);
    animation: obs-spin 1.1s linear infinite;
    margin: 0 auto 20px auto;
}
@keyframes obs-spin { to { transform: rotate(360deg); } }

/* ═══ Tipografías utilitarias ═══ */
.obs-h-section {
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(0,194,255,0.78);
}
.obs-h-section-gold {
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(212,168,67,0.82);
}
.obs-text-body {
    font-size: 13px;
    font-weight: 300;
    line-height: 1.62;
    color: rgba(232,238,247,0.78);
}
.obs-text-muted {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.06em;
    color: rgba(180,200,220,0.50);
}
.obs-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 13px;
    border-radius: 20px;
    background: rgba(0,194,255,0.08);
    border: 1px solid rgba(0,194,255,0.24);
    color: rgba(0,194,255,0.9);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.obs-chip-gold {
    background: rgba(200,164,78,0.08);
    border-color: rgba(200,164,78,0.30);
    color: rgba(212,168,67,0.95);
}

body[data-rsv-nav-revealed="true"] .obs-title-overlay,
body[data-rsv-nav-revealed="true"] .obs-seg-wrap {
    opacity: 0 !important;
    pointer-events: none !important;
}

/* v1.4 — Auto-hide del header al scrollear hacia abajo en el Observatorio.
   Cuando el .obs-root pasa el umbral, se aplica body[data-rsv-obs-scrolled]
   y los fixed headers se esconden con transición suave. */
body[data-rsv-obs-scrolled="true"] .obs-title-overlay,
body[data-rsv-obs-scrolled="true"] .obs-seg-wrap {
    opacity: 0 !important;
    transform: translateY(-12px);
    pointer-events: none !important;
}
.obs-back-top {
    position: fixed;
    right: 22px;
    bottom: 28px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: 1px solid rgba(0,194,255,0.36);
    background: linear-gradient(165deg, rgba(8,22,45,0.88) 0%, rgba(5,15,35,0.92) 100%);
    color: #00C2FF;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 901;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 6px 22px rgba(0,194,255,0.10);
}
.obs-back-top.is-on {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
}
.obs-back-top:hover {
    border-color: rgba(0,194,255,0.6);
    box-shadow: 0 8px 32px rgba(0,194,255,0.25);
}
`

function useInjectObsCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "rsv-obs-css-v1"
        const prev = document.getElementById(id) as HTMLStyleElement | null
        if (prev) {
            prev.textContent = OBS_CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = OBS_CSS
        document.head.appendChild(s)
    }, [])
}

/* ════════════════════════════════════════════════════════════════
   sbRpc helper (local — consistente con patrón de los otros admin)
   ════════════════════════════════════════════════════════════════ */
async function sbRpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any>
): Promise<any> {
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
        if (!r.ok) return null
        return await r.json()
    } catch {
        return null
    }
}

/* Perfil propio verificado vía edge `me`: el clerk id sale del claim `sub`
   del token de sesión firmado, nunca de un param del body. Reemplaza al
   oráculo get_profile_by_clerk_id (REVOKE del Lote F, 20260727e). */
async function fetchMe(url: string, key: string) {
    if (!url || !key) return null
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (!token) return null
        const r = await fetch(`${url}/functions/v1/me`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

/* ════════════════════════════════════════════════════════════════
   Gate admin — valida el token de sesión contra profiles.is_admin
   ════════════════════════════════════════════════════════════════ */
function useAdminAuth(sbUrl: string, sbKey: string) {
    const [state, setState] = useState<"loading" | "admin" | "denied">("loading")
    const [userName, setUserName] = useState("")
    const [clerkId, setClerkId] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            let tries = 0
            while (tries < 25) {
                if ((window as any).Clerk?.user) break
                await new Promise((r) => setTimeout(r, 200))
                tries++
            }
            const u = (window as any).Clerk?.user
            if (!u) {
                if (!cancelled) setState("denied")
                return
            }
            const p = await fetchMe(sbUrl, sbKey)
            if (cancelled) return
            if (p?.is_admin) {
                setState("admin")
                setUserName(p.full_name || u.fullName || "Admin")
                setClerkId(u.id)
            } else {
                setState("denied")
            }
        })()
        return () => {
            cancelled = true
        }
    }, [sbUrl, sbKey])

    return { state, userName, clerkId }
}

/* ════════════════════════════════════════════════════════════════
   Overlay de título portado a document.body (evita transform-ancestor
   del contenedor principal que animaría el header por error).
   Incluye también el segmented control Macro ↔ Micro, portado.
   ════════════════════════════════════════════════════════════════ */
type ObsMode = "macro" | "micro" | "presenciales"

const OBS_MODE_SUBTITLES: Record<ObsMode, string> = {
    macro: "Lectura Macro · Cámara Solar",
    micro: "Ignición Micro · 1:1",
    presenciales: "Presenciales · Veo Tu Luz Interna",
}

function ObservatorioChrome({
    userName,
    mode,
    setMode,
}: {
    userName: string
    mode: ObsMode
    setMode: (m: ObsMode) => void
}) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])
    if (!mounted || typeof document === "undefined") return null

    return createPortal(
        <>
            <div className="obs-title-overlay rsv-admin-title">
                <div className="obs-title-main">Observatorio de Resonancia</div>
                <div className="obs-title-sub">
                    {OBS_MODE_SUBTITLES[mode]}
                    {userName ? ` · ${userName}` : ""}
                </div>
            </div>
            <div className="obs-seg-wrap rsv-admin-title">
                <div className="obs-seg">
                    <button
                        type="button"
                        className={`obs-seg-btn ${mode === "macro" ? "obs-seg-btn-on-cyan" : ""}`}
                        onClick={() => setMode("macro")}
                        aria-pressed={mode === "macro"}
                    >
                        {mode === "macro" && <span className="obs-seg-dot" />}
                        Macro · Cámara Solar
                    </button>
                    <button
                        type="button"
                        className={`obs-seg-btn ${mode === "micro" ? "obs-seg-btn-on-gold" : ""}`}
                        onClick={() => setMode("micro")}
                        aria-pressed={mode === "micro"}
                    >
                        {mode === "micro" && <span className="obs-seg-dot" />}
                        Micro · Ignición 1:1
                    </button>
                    <button
                        type="button"
                        className={`obs-seg-btn ${mode === "presenciales" ? "obs-seg-btn-on-platinum" : ""}`}
                        onClick={() => setMode("presenciales")}
                        aria-pressed={mode === "presenciales"}
                    >
                        {mode === "presenciales" && (
                            <span className="obs-seg-dot" />
                        )}
                        Presenciales · VTLI
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}

/* ════════════════════════════════════════════════════════════════
   Shell raíz
   ════════════════════════════════════════════════════════════════ */
function ObservatorioResonanciaInner({
    supabaseUrl,
    supabaseAnonKey,
}: {
    supabaseUrl: string
    supabaseAnonKey: string
}) {
    useInjectObsCss()
    const { state, userName, clerkId } = useAdminAuth(supabaseUrl, supabaseAnonKey)
    const [mode, setMode] = useState<ObsMode>(() => {
        if (typeof window === "undefined") return "macro"
        const h = window.location.hash || ""
        if (h.includes("presenciales")) return "presenciales"
        if (h.includes("micro")) return "micro"
        return "macro"
    })

    /* Persistir el toggle en el hash para deep-links admin */
    useEffect(() => {
        if (typeof window === "undefined") return
        const target = `#observatorio-${mode}`
        if (window.location.hash !== target) {
            try {
                history.replaceState(null, "", target)
            } catch {}
        }
    }, [mode])

    /* v1.3 — el listener global de flechas se movió al Macro (rota entre
       sesiones). Macro/Micro alternan solo con click en el segmented. */

    /* v1.4 — Scroll del .obs-root: auto-hide de header + botón "volver arriba".
       Usamos ref + listener directo sobre el scroll container (no sobre window,
       porque el body de Domo tiene overflow:hidden y la ventana nunca scrollea). */
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const [scrolled, setScrolled] = useState(false)
    const [showBackTop, setShowBackTop] = useState(false)

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const update = () => {
            const top = el.scrollTop
            setScrolled(top > 140)
            setShowBackTop(top > 240)
        }
        update()
        el.addEventListener("scroll", update, { passive: true })
        return () => el.removeEventListener("scroll", update)
    }, [state, mode])

    useEffect(() => {
        if (typeof document === "undefined") return
        if (scrolled) {
            document.body.setAttribute("data-rsv-obs-scrolled", "true")
        } else {
            document.body.removeAttribute("data-rsv-obs-scrolled")
        }
        return () => {
            document.body.removeAttribute("data-rsv-obs-scrolled")
        }
    }, [scrolled])

    const scrollToTop = useCallback(() => {
        const el = rootRef.current
        if (!el) return
        try {
            el.scrollTo({ top: 0, behavior: "smooth" })
        } catch {
            el.scrollTop = 0
        }
    }, [])

    if (state === "loading") {
        return (
            <div className="obs-root">
                <div className="obs-gate">
                    <div className="obs-gate-card">
                        <div className="obs-spinner" />
                        <div className="obs-gate-title">Sintonizando</div>
                        <div className="obs-gate-msg">
                            Verificando autorización del Arquitecto.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (state === "denied") {
        return (
            <div className="obs-root">
                <div className="obs-gate">
                    <div className="obs-gate-card">
                        <div className="obs-gate-title">Acceso Restringido</div>
                        <div className="obs-gate-msg">
                            Este lóbulo está reservado para el Arquitecto de la
                            Estación de Mando. Regresá al Portal para continuar
                            tu travesía.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="obs-root" ref={rootRef}>
            <NavRevealPin currentTabId="ninguna" />
            <ObservatorioChrome userName={userName} mode={mode} setMode={setMode} />
            <div className="obs-content">
                {/* v1.5 — Ambos modos siempre montados con crossfade absoluto.
                   Evita la pantalla en blanco de ~400ms que aparecía al cambiar
                   de Macro a Micro esperando el exit/mount del AnimatePresence. */}
                <div style={{ position: "relative" }}>
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: mode === "macro" ? 1 : 0,
                            y: mode === "macro" ? 0 : 8,
                            filter: mode === "macro" ? "blur(0px)" : "blur(4px)",
                        }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            pointerEvents: mode === "macro" ? "auto" : "none",
                            position: mode === "macro" ? "relative" : "absolute",
                            inset: mode === "macro" ? undefined : 0,
                            width: "100%",
                            visibility: mode === "macro" ? "visible" : "hidden",
                        }}
                    >
                        <ObservatorioResonanciaMacro
                            supabaseUrl={supabaseUrl}
                            supabaseAnonKey={supabaseAnonKey}
                            clerkId={clerkId}
                        />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: mode === "micro" ? 1 : 0,
                            y: mode === "micro" ? 0 : 8,
                            filter: mode === "micro" ? "blur(0px)" : "blur(4px)",
                        }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            pointerEvents: mode === "micro" ? "auto" : "none",
                            position: mode === "micro" ? "relative" : "absolute",
                            inset: mode === "micro" ? undefined : 0,
                            width: "100%",
                            visibility: mode === "micro" ? "visible" : "hidden",
                        }}
                    >
                        <ObservatorioResonanciaMicro
                            supabaseUrl={supabaseUrl}
                            supabaseAnonKey={supabaseAnonKey}
                            clerkId={clerkId}
                        />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: mode === "presenciales" ? 1 : 0,
                            y: mode === "presenciales" ? 0 : 8,
                            filter:
                                mode === "presenciales"
                                    ? "blur(0px)"
                                    : "blur(4px)",
                        }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            pointerEvents:
                                mode === "presenciales" ? "auto" : "none",
                            position:
                                mode === "presenciales" ? "relative" : "absolute",
                            inset: mode === "presenciales" ? undefined : 0,
                            width: "100%",
                            visibility:
                                mode === "presenciales" ? "visible" : "hidden",
                        }}
                    >
                        <ObservatorioResonanciaPresenciales
                            supabaseUrl={supabaseUrl}
                            supabaseAnonKey={supabaseAnonKey}
                            clerkId={clerkId}
                        />
                    </motion.div>
                </div>
            </div>
            <button
                type="button"
                onClick={scrollToTop}
                aria-label="Volver arriba"
                className={`obs-back-top${showBackTop ? " is-on" : ""}`}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>
        </div>
    )
}

/* Wrapper externo + property controls para Framer */
export function ObservatorioResonancia(props: any) {
    const url =
        props?.supabaseUrl ||
        "https://cobtsltrcsruzcusyqhi.supabase.co"
    const key =
        props?.supabaseAnonKey ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYnRzbHRyY3NydXpjdXN5cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzIyOTMsImV4cCI6MjA5MDMwODI5M30.-GKVel9fUxw2Lrp59QLqIvLrh9ubrHLgP44fkj8qI6U"
    return (
        <ObservatorioResonanciaInner supabaseUrl={url} supabaseAnonKey={key} />
    )
}

addPropertyControls(ObservatorioResonancia, {
    supabaseUrl: {
        type: ControlType.String,
        title: "🟣🔗 Supabase URL",
        defaultValue: "https://cobtsltrcsruzcusyqhi.supabase.co",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "🟣🔑 Supabase Anon Key",
        defaultValue: "",
    },
})

export default ObservatorioResonancia
