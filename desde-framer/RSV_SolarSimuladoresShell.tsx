// RSV_SolarSimuladoresShell.tsx — v3.6
// v3.6 — Rollback del skip-hub v3.5. Decisión de Zak: en desktop, todo
// entry point a Simuladores (raíz `/simuladores` y Holoteca
// `/escaner/holoteca/simuladores`) debe aterrizar SIEMPRE en el
// selector hub, aunque solo haya una card visible para no-admins.
// Mantiene consistencia visual y deja la puerta abierta a que el
// Tripulante regular vea cuándo aparezcan más simuladores. La
// versión móvil tiene su propio selector inmersivo en
// AppNavegacionMobile (no usa este shell).
// v3.5 — Skip-hub para no-admins en desktop. (Removido en v3.6.)
// v3.4 — Card del Domo renombrada a "DOMO CERO" (antes "RECUERDOS
// DEL SOL"). Mismo bridge: pedimos JWT de Clerk con template "domo"
// y abrimos mmsorUrl#token=<jwt>. La URL ahora viene hardcoded
// desde Domo.tsx (constante DOMO_CLIENT_URL); el property control
// simMmsorUrl en Framer ya no existe.
// v3.3 — Bridge a MMSOR ("Recuerdos del Sol"). Card admin-only que se
// inyecta en hubItems cuando el tripulante es admin. Al picar,
// pedimos un JWT de Clerk (template "mmsor", fallback al token
// estándar) y abrimos mmsorUrl#token=<jwt>. Detección admin via
// useAdminAuth de MI_Shared. Pasa supabaseUrl/Key a Navegante para
// el gate Sintonía en Membrana 2+.
import * as React from "react"
import {
    useEffect,
    useLayoutEffect,
    useState,
    useRef,
    useMemo,
    useCallback,
} from "react"
import SimuladoresHub from "./SimuladoresHub.tsx"
import NaveganteDeLaRed from "./NaveganteDeLaRed.tsx"
import { useAdminAuth } from "./MI_Shared.tsx"

type ShellView = "hub" | "navegante"
const RECUERDOS_ID = "recuerdos"
const BTN_H_STD = 40
const BTN_W_STD = 42
const BTN_H_MUSIC = 54
const ACCENT = "#00C2FF"
type UiSfxName =
    | "menu"
    | "fullscreen"
    | "track"
    | "start"
    | "back"
    | "toggle"
    | "theme"

function useSfx(
    urls: Partial<Record<UiSfxName, string>>,
    enabled: boolean,
    vol = 0.9,
    perVol?: Partial<Record<UiSfxName, number>>
) {
    const lastPlay = useRef<Record<UiSfxName, number>>({
        menu: 0,
        fullscreen: 0,
        track: 0,
        start: 0,
        back: 0,
        toggle: 0,
        theme: 0,
    })
    return useCallback(
        (k: UiSfxName) => {
            if (!enabled || typeof window === "undefined") return
            const src = urls[k]
            if (!src) return
            const now = performance.now()
            if (now - (lastPlay.current[k] || 0) < 140) return
            lastPlay.current[k] = now
            try {
                const a = new Audio(src)
                a.volume = Math.max(0, Math.min(1, vol * (perVol?.[k] ?? 1)))
                a.play().catch(() => {})
            } catch {}
        },
        [urls, enabled, vol, perVol]
    )
}

/* ★ Botón menú juego — position:fixed, right simple sin env() */
function UnifiedMenuButton({
    open,
    onToggle,
    rightPx = 12,
    topPx = 8,
}: {
    open: boolean
    onToggle: () => void
    rightPx?: number
    topPx?: number
}) {
    return (
        <>
            <style>{`.umb{position:fixed;right:${rightPx}px;top:${topPx}px;z-index:10020;width:${BTN_W_STD}px;height:${BTN_H_STD}px;border-radius:12px;background:radial-gradient(140% 120% at 100% 0%,rgba(255,255,255,.14),rgba(255,255,255,0) 60%),rgba(8,12,20,.55);border:1px solid rgba(0,194,255,.45);backdrop-filter:blur(8px);box-shadow:0 0 10px rgba(0,194,255,.25),inset 0 0 10px rgba(0,0,0,.35);display:grid;place-items:center;cursor:pointer;color:#E6F7EF;}.umb:focus,.umb:focus-visible{outline:none!important;}.umb-x,.umb-d{position:relative;width:22px;height:18px;display:block;}.umb-x i{position:absolute;left:0;right:0;height:2px;border-radius:999px;display:block;background:${ACCENT};}.umb-x i:nth-child(1){top:8px;transform:rotate(45deg);}.umb-x i:nth-child(2){top:8px;transform:rotate(-45deg);}.umb-d i{position:absolute;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;display:block;background:${ACCENT};}.umb-d i:nth-child(1){top:0;}.umb-d i:nth-child(2){top:7px;}.umb-d i:nth-child(3){bottom:0;}`}</style>
            <button className="umb" onClick={onToggle} tabIndex={-1}>
                {open ? (
                    <span className="umb-x">
                        <i />
                        <i />
                    </span>
                ) : (
                    <span className="umb-d">
                        <i />
                        <i />
                        <i />
                    </span>
                )}
            </button>
        </>
    )
}

/* ★ Music Button — position:fixed right, NO env() */
function MusicButton(props: {
    topPx: number
    rightPx: number
    tracks: (string | undefined)[]
    initial: "off" | "1" | "2"
    volume: number
    loop: boolean
    persist: boolean
    onCycle?: (t: number) => void
}) {
    const { topPx, rightPx, tracks, initial, volume, loop, persist, onCycle } =
        props
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [ready, setReady] = useState(false)
    const available = useMemo(
        () =>
            [1, 2].filter(
                (n) => !!tracks[n - 1] && (tracks[n - 1] as string).length > 0
            ),
        [tracks]
    )
    const initialFromLS = (() => {
        if (!persist || typeof window === "undefined") return undefined
        try {
            const v = window.localStorage.getItem("rsv-music-track")
            return v ? Number(v) : undefined
        } catch {
            return undefined
        }
    })()
    const [track, setTrack] = useState<number>(() => {
        if (typeof initialFromLS === "number") return initialFromLS
        if (initial === "1" && available.includes(1)) return 1
        if (initial === "2" && available.includes(2)) return 2
        return 0
    })
    const trackRef = useRef(track)
    const tracksRef = useRef(tracks)
    useEffect(() => {
        trackRef.current = track
    }, [track])
    useEffect(() => {
        tracksRef.current = tracks
    }, [tracks])
    useEffect(() => setReady(true), [])
    useEffect(() => {
        if (!persist || typeof window === "undefined") return
        try {
            window.localStorage.setItem("rsv-music-track", String(track))
        } catch {}
    }, [track, persist])
    useEffect(() => {
        if (typeof window === "undefined") return
        const a = new Audio()
        a.loop = loop
        a.volume = Math.max(0, Math.min(1, volume))
        audioRef.current = a
        const unlock = () => {
            const ct = trackRef.current
            if (ct > 0 && a.paused) {
                const src = tracksRef.current[ct - 1]
                if (src) {
                    a.src = src
                    a.play().catch(() => {})
                }
            }
            window.removeEventListener("pointerdown", unlock)
        }
        window.addEventListener("pointerdown", unlock)
        return () => {
            window.removeEventListener("pointerdown", unlock)
            a.pause()
            audioRef.current = null
        }
    }, [])
    useEffect(() => {
        const a = audioRef.current
        if (!a) return
        if (track === 0) {
            a.pause()
            return
        }
        const src = tracks[track - 1]
        if (!src) {
            a.pause()
            return
        }
        if (a.src !== src) a.src = src
        a.loop = loop
        a.volume = Math.max(0, Math.min(1, volume))
        a.play().catch(() => {})
    }, [track, tracks, volume, loop])
    const cycle = () => {
        if (!available.length) return
        const order = [...available, 0]
        const idx = order.indexOf(track)
        setTrack(order[(idx + 1) % order.length])
        onCycle?.(order[(idx + 1) % order.length])
    }
    if (!ready) return null
    return (
        <>
            <style>{`.smb{position:fixed;right:${rightPx}px;top:${topPx}px;z-index:10000;width:${BTN_W_STD}px;height:${BTN_H_MUSIC}px;border-radius:12px;background:radial-gradient(140% 120% at 100% 0%,rgba(255,255,255,.14),rgba(255,255,255,0) 60%),rgba(8,12,20,.55);border:1px solid rgba(0,194,255,.45);backdrop-filter:blur(8px);box-shadow:0 0 10px rgba(0,194,255,.25),inset 0 0 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:0 6px;cursor:pointer;user-select:none;color:#E6F7EF;}.smb[data-state="off"]{opacity:.7}.smb .lb{display:flex;flex-direction:column;align-items:center;gap:4px;line-height:1;}.smb .nt{font-size:16px;}.smb .bd{min-width:22px;height:16px;border-radius:6px;display:grid;place-items:center;font-size:11px;line-height:1;color:#061018;background:rgba(0,194,255,.25);}.smb:focus,.smb:focus-visible{outline:none}`}</style>
            <button
                className="smb"
                data-state={track === 0 ? "off" : "on"}
                onClick={cycle}
                tabIndex={-1}
            >
                <span className="lb">
                    <span className="nt">{track === 0 ? "🔇" : "🎵"}</span>
                    <span className="bd">{track === 0 ? "OFF" : track}</span>
                </span>
            </button>
        </>
    )
}

function SfxButton({
    topPx,
    rightPx,
    enabled,
    onToggle,
}: {
    topPx: number
    rightPx: number
    enabled: boolean
    onToggle: () => void
}) {
    return (
        <>
            <style>{`.ssb{position:fixed;right:${rightPx}px;top:${topPx}px;z-index:10000;width:${BTN_W_STD}px;height:${BTN_H_STD}px;border-radius:12px;background:radial-gradient(140% 120% at 100% 0%,rgba(255,255,255,.14),rgba(255,255,255,0) 60%),rgba(8,12,20,.55);border:1px solid rgba(0,194,255,.45);backdrop-filter:blur(8px);box-shadow:0 0 10px rgba(0,194,255,.25),inset 0 0 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;color:#E6F7EF;font-size:14px;}.ssb[data-state="off"]{opacity:.7}.ssb:focus,.ssb:focus-visible{outline:none!important;}`}</style>
            <button
                className="ssb"
                data-state={enabled ? "on" : "off"}
                onClick={onToggle}
                tabIndex={-1}
            >
                {enabled ? "🔊" : "🔇"}
            </button>
        </>
    )
}

function FullscreenButton({
    topPx,
    rightPx,
    active,
    onToggle,
}: {
    topPx: number
    rightPx: number
    active: boolean
    onToggle: () => void
}) {
    return (
        <>
            <style>{`.sfb{position:fixed;right:${rightPx}px;top:${topPx}px;z-index:10000;width:${BTN_W_STD}px;height:${BTN_H_STD}px;border-radius:12px;background:radial-gradient(140% 120% at 100% 0%,rgba(255,255,255,.14),rgba(255,255,255,0) 60%),rgba(8,12,20,.55);border:1px solid rgba(0,194,255,.45);backdrop-filter:blur(8px);box-shadow:0 0 10px rgba(0,194,255,.25),inset 0 0 10px rgba(0,0,0,.35);display:grid;place-items:center;cursor:pointer;color:#E6F7EF;}.sfb:focus,.sfb:focus-visible{outline:none!important;}.fsi{width:22px;height:22px;position:relative;display:block;}.fsi div{position:absolute;width:6px;height:6px;border:2px solid ${ACCENT};box-shadow:0 0 6px rgba(0,194,255,.5);}.fsi .tl{left:0;top:0;border-right:none;border-bottom:none;}.fsi .tr{right:0;top:0;border-left:none;border-bottom:none;}.fsi .bl{left:0;bottom:0;border-right:none;border-top:none;}.fsi .br{right:0;bottom:0;border-left:none;border-top:none;}.fsi.sh .tl{left:4px;top:4px;}.fsi.sh .tr{right:4px;top:4px;}.fsi.sh .bl{left:4px;bottom:4px;}.fsi.sh .br{right:4px;bottom:4px;}`}</style>
            <button className="sfb" onClick={onToggle} tabIndex={-1}>
                <div className={`fsi ${active ? "sh" : ""}`}>
                    <div className="tl" />
                    <div className="tr" />
                    <div className="bl" />
                    <div className="br" />
                </div>
            </button>
        </>
    )
}

type ShellProps = {
    domoMode?: boolean
    onViewChange?: (view: "hub" | "navegante") => void
    showBackButton?: boolean
    unifiedButtonRightPx?: number
    unifiedButtonTopPx?: number
    stackOffsetFromMenuPx?: number
    stackGapPx?: number
    stackRightPx?: number
    showMusicInGame?: boolean
    showSfxInGame?: boolean
    showFullscreenInGame?: boolean
    musicTrack1?: string
    musicTrack2?: string
    musicInitialSelection?: "off" | "1" | "2"
    musicVolume?: number
    musicLoop?: boolean
    musicPersistSelection?: boolean
    sfxStartGain?: number
    hubSoundEnabled?: boolean
    hubHoverUrl?: string
    hubHoverVolume?: number
    sfxEnabledByDefault?: boolean
    sfxPersistSelection?: boolean
    sfxMenu?: string
    sfxFullscreen?: string
    sfxTrack?: string
    sfxStart?: string
    sfxBack?: string
    sfxToggle?: string
    sfxThemeToggle?: string
    sfxVolume?: number
    hideCursorInGame?: boolean
    hideCursorAfterMs?: number
    hubSubtitleText?: string
    hubGridColumns?: number
    hubCardGlow?: number
    hubItems?: any[]
    hubTopOffsetPx?: number
    hubCardTitleFontSizePx?: number
    hubGridGapPx?: number
    introVideoEnabled?: boolean
    introVideoSrc?: string | null
    gameLevelOrder?: string
    gameShowAllLevels?: boolean
    sfxLevelHover?: string
    sfxLevelPick?: string
    consoleTitleImage?: string
    consoleTitleImageHeight?: number
    consoleTitleTopOffset?: number
    /* v3.3 — Bridge MMSOR + gate Membrana 2+. */
    supabaseUrl?: string
    supabaseAnonKey?: string
    mmsorUrl?: string
}

export function RSV_SolarSimuladoresShell(props: ShellProps) {
    const {
        domoMode = false,
        onViewChange,
        showBackButton = true,
        unifiedButtonRightPx = 12,
        unifiedButtonTopPx = 8,
        stackOffsetFromMenuPx = 20,
        stackGapPx = 13,
        stackRightPx = 12,
        showMusicInGame = true,
        showSfxInGame = true,
        showFullscreenInGame = true,
        musicTrack1,
        musicTrack2,
        musicInitialSelection = "1",
        musicVolume = 0.6,
        musicLoop = true,
        musicPersistSelection = true,
        sfxEnabledByDefault = true,
        sfxPersistSelection = true,
        sfxMenu,
        sfxFullscreen,
        sfxTrack,
        sfxStart,
        sfxBack,
        sfxToggle,
        sfxThemeToggle,
        sfxVolume = 0.8,
        sfxStartGain = 0.8,
        hubSubtitleText,
        hubGridColumns,
        hubCardGlow,
        hubItems,
        hubTopOffsetPx,
        hubCardTitleFontSizePx,
        hubGridGapPx,
        introVideoEnabled = false,
        introVideoSrc = null,
        hubSoundEnabled = true,
        hubHoverUrl,
        hubHoverVolume = 0.8,
        gameLevelOrder = "6,1,7,2,8,3,4,5,9,10,11,12,13,14,15,16,17,18,19,20",
        gameShowAllLevels = false,
        sfxLevelHover,
        sfxLevelPick,
        consoleTitleImage,
        consoleTitleImageHeight = 120,
        consoleTitleTopOffset = 10,
        hideCursorInGame = true,
        hideCursorAfterMs = 3000,
        supabaseUrl = "",
        supabaseAnonKey = "",
        mmsorUrl = "",
    } = props

    /* v3.3/v3.4 — Detección admin para inyectar card del Domo Cero
       (antes "Recuerdos del Sol"). Marcamos `art="domo"` para que el
       SimuladoresHub renderee el visual SVG vectorial épico de
       portal interdimensional en lugar del placeholder genérico. */
    const { isAdmin } = useAdminAuth(supabaseUrl, supabaseAnonKey)
    const augmentedHubItems = useMemo(() => {
        const base = Array.isArray(hubItems) ? hubItems.slice() : []
        if (isAdmin) {
            base.push({
                id: RECUERDOS_ID,
                title: "DOMO CERO",
                cover: "",
                status: "Activo",
                art: "domo",
            })
        }
        return base
    }, [hubItems, isAdmin])

    const [hydrated, setHydrated] = useState(false)
    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => setHydrated(true))
        return () => cancelAnimationFrame(id)
    }, [])

    const [view, setView] = useState<ShellView>("hub")
    const [gameMenuOpen, setGameMenuOpen] = useState(false)
    const [introPlaying, setIntroPlaying] = useState(false)

    /* ★ Notificar Domo: ocultar navbar durante juego Y durante intro */
    useEffect(() => {
        if (introPlaying || view === "navegante") onViewChange?.("navegante")
        else onViewChange?.("hub")
    }, [view, introPlaying, onViewChange])

    const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => {
        if (!sfxPersistSelection || typeof window === "undefined")
            return sfxEnabledByDefault
        try {
            const v = window.localStorage.getItem("rsv-sfx-enabled")
            return v === null ? sfxEnabledByDefault : v === "1"
        } catch {
            return sfxEnabledByDefault
        }
    })
    useEffect(() => {
        if (!sfxPersistSelection || typeof window === "undefined") return
        try {
            window.localStorage.setItem(
                "rsv-sfx-enabled",
                sfxEnabled ? "1" : "0"
            )
        } catch {}
    }, [sfxEnabled, sfxPersistSelection])

    const playUi = useSfx(
        {
            menu: sfxMenu,
            fullscreen: sfxFullscreen,
            track: sfxTrack,
            start: sfxStart,
            back: sfxBack,
            toggle: sfxToggle,
            theme: sfxThemeToggle,
        },
        sfxEnabled,
        sfxVolume,
        { start: sfxStartGain }
    )

    const [isFullscreen, setIsFullscreen] = useState(false)
    useEffect(() => {
        const onFs = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener("fullscreenchange", onFs)
        return () => document.removeEventListener("fullscreenchange", onFs)
    }, [])
    const toggleFullscreen = () => {
        playUi("fullscreen")
        if (!document.fullscreenElement)
            document.documentElement.requestFullscreen?.().catch(() => {})
        else document.exitFullscreen?.().catch(() => {})
    }

    const shouldUseIntro =
        introVideoEnabled && !!introVideoSrc && typeof window !== "undefined"

    const [cursorHidden, setCursorHidden] = useState(false)
    useEffect(() => {
        if (view !== "navegante" || !hideCursorInGame) {
            setCursorHidden(false)
            return
        }
        let t: any = null
        const reset = () => {
            setCursorHidden(false)
            if (t) clearTimeout(t)
            t = setTimeout(
                () => setCursorHidden(true),
                Math.max(0, hideCursorAfterMs || 0)
            )
        }
        reset()
        const evts = [
            "mousemove",
            "mousedown",
            "keydown",
            "wheel",
            "touchstart",
            "pointerdown",
        ]
        evts.forEach((k) =>
            window.addEventListener(k, reset, { passive: true })
        )
        return () => {
            if (t) clearTimeout(t)
            evts.forEach((k) => window.removeEventListener(k, reset as any))
        }
    }, [view, hideCursorInGame, hideCursorAfterMs])

    /* v3.5 → v3.6 (rollback) — El skip-hub para no-admins se quitó.
       Decisión de Zak (mayo 2026): TODOS los entry points desktop a
       Simuladores deben mostrar el selector hub, sin importar si hay
       1 o 2 cards visibles. Mantiene consistencia entre /simuladores
       (modo Madre) y /escaner/holoteca/simuladores (modo Escáner).
       La versión móvil tiene su propio selector inmersivo en
       AppNavegacionMobile. */

    const handleStartGame = (gameId: string) => {
        if (gameId === RECUERDOS_ID) {
            /* v3.3/v3.4 — Bridge al Domo Cero. Pedimos JWT a Clerk
               probando templates en orden: "domo" → "mmsor" → token
               estándar. El cliente del Domo lee el fragment #token=
               y lo limpia. La URL viene hardcoded vía DOMO_CLIENT_URL
               en Domo.tsx; mmsorUrl ya no se configura desde Framer. */
            playUi("start")
            if (!mmsorUrl) {
                console.warn(
                    "[Domo] Falta DOMO_CLIENT_URL en Domo.tsx — bridge desactivado."
                )
                return
            }
            const Clerk = (window as any).Clerk
            if (!Clerk?.session) {
                console.warn(
                    "[Domo] Sin sesión Clerk — abre desde una cuenta autenticada."
                )
                return
            }
            const fetchToken = async (): Promise<string | null> => {
                try {
                    return await Clerk.session.getToken({ template: "domo" })
                } catch {}
                try {
                    return await Clerk.session.getToken({ template: "mmsor" })
                } catch {}
                try {
                    return await Clerk.session.getToken()
                } catch {
                    return null
                }
            }
            fetchToken().then((token) => {
                if (!token) {
                    console.warn("[Domo] Clerk no devolvió token.")
                    return
                }
                const sep = mmsorUrl.includes("#") ? "&" : "#"
                window.location.assign(
                    `${mmsorUrl}${sep}token=${encodeURIComponent(token)}`
                )
            })
            return
        }
        if (gameId === "navegante") {
            playUi("start")
            if (shouldUseIntro) {
                setIntroPlaying(true) /* ★ Oculta navbar durante intro */
                setGameMenuOpen(false)
                return
            }
            setView("navegante")
            setGameMenuOpen(true)
        }
    }
    const handleIntroFinished = () => {
        setIntroPlaying(false)
        setView("navegante")
        setGameMenuOpen(true)
    }
    const handleExitGame = () => {
        playUi("back")
        setView("hub")
        setGameMenuOpen(false)
    }
    const handleGameToggle = () => {
        playUi("menu")
        setGameMenuOpen((v) => !v)
    }

    useEffect(() => {
        const onKD = (e: KeyboardEvent) => {
            if (
                (e.key === "Escape" || e.key === "Esc") &&
                view === "navegante"
            ) {
                e.preventDefault()
                playUi("menu")
                setGameMenuOpen((p) => !p)
            }
        }
        window.addEventListener("keydown", onKD)
        return () => window.removeEventListener("keydown", onKD)
    }, [view, playUi])

    const baseTop = unifiedButtonTopPx + BTN_H_STD + stackOffsetFromMenuPx
    const musicTop = baseTop
    const sfxTop = baseTop + BTN_H_MUSIC + stackGapPx
    const fsTop = sfxTop + BTN_H_STD + stackGapPx

    const [confirmExitOpen, setConfirmExitOpen] = useState(false)
    const [confirmFocus, setConfirmFocus] = useState<"yes" | "no">("no")
    useEffect(() => {
        if (!confirmExitOpen) return
        const onKey = (e: KeyboardEvent) => {
            e.stopImmediatePropagation?.()
            e.preventDefault()
            if (e.key === "Escape") {
                playUi("menu")
                setConfirmExitOpen(false)
                return
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                setConfirmFocus((v) => (v === "yes" ? "no" : "yes"))
                playUi("menu")
                return
            }
            if (e.key === "Enter") {
                playUi("menu")
                if (confirmFocus === "yes") {
                    setConfirmExitOpen(false)
                    handleExitGame()
                } else setConfirmExitOpen(false)
            }
        }
        window.addEventListener("keydown", onKey, { capture: true })
        return () =>
            window.removeEventListener("keydown", onKey, {
                capture: true,
            } as any)
    }, [confirmExitOpen, confirmFocus, playUi])

    const inGame = view === "navegante"

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                minHeight: domoMode ? "100vh" : undefined,
                height: domoMode ? undefined : "100%",
                overflow: "hidden",
                visibility: hydrated ? "visible" : "hidden",
            }}
        >
            {inGame && (
                <UnifiedMenuButton
                    open={gameMenuOpen}
                    onToggle={handleGameToggle}
                    rightPx={unifiedButtonRightPx}
                    topPx={unifiedButtonTopPx}
                />
            )}

            {showBackButton && inGame && (
                <button
                    onClick={() => {
                        playUi("menu")
                        setConfirmExitOpen(true)
                    }}
                    style={{
                        position: "fixed",
                        zIndex: 10020,
                        top: unifiedButtonTopPx,
                        left: 20,
                        minWidth: 104,
                        height: BTN_H_STD,
                        borderRadius: 12,
                        padding: "0 18px",
                        border: "1px solid rgba(0,194,255,.45)",
                        background:
                            "radial-gradient(140% 120% at 0% 0%,rgba(255,255,255,.14),rgba(255,255,255,0) 60%),rgba(8,12,20,.7)",
                        boxShadow:
                            "0 0 10px rgba(0,194,255,.25),inset 0 0 10px rgba(0,0,0,.45)",
                        color: "#E6F7EF",
                        fontSize: 12,
                        letterSpacing: ".08em",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <span style={{ fontSize: 14 }}>←</span>
                    <span>VOLVER</span>
                </button>
            )}

            {view === "hub" && !introPlaying && (
                <SimuladoresHub
                    onStartGame={handleStartGame}
                    subtitleText={hubSubtitleText}
                    gridColumns={hubGridColumns}
                    cardGlow={hubCardGlow}
                    items={augmentedHubItems}
                    topOffsetPx={hubTopOffsetPx}
                    cardTitleFontSizePx={hubCardTitleFontSizePx}
                    gridGapPx={hubGridGapPx}
                    enableSound={hubSoundEnabled && sfxEnabled}
                    hoverUrl={hubHoverUrl}
                    hoverVolume={hubHoverVolume}
                />
            )}

            {inGame && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        cursor: cursorHidden ? "none" : undefined,
                    }}
                >
                    <NaveganteDeLaRed
                        onExit={handleExitGame}
                        sfxEnabled={sfxEnabled}
                        gameMenuOpen={gameMenuOpen}
                        onMenuStateChange={(open) => setGameMenuOpen(open)}
                        levelOrder={gameLevelOrder}
                        freePlayAll={gameShowAllLevels}
                        uiSfxHover={sfxLevelHover}
                        uiSfxSelect={sfxLevelPick}
                        consoleTitleImage={consoleTitleImage}
                        consoleTitleImageHeight={consoleTitleImageHeight}
                        consoleTitleTopOffset={consoleTitleTopOffset}
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                    />
                </div>
            )}

            {inGame && showMusicInGame && (
                <MusicButton
                    topPx={musicTop}
                    rightPx={stackRightPx}
                    tracks={[musicTrack1, musicTrack2]}
                    initial={musicInitialSelection}
                    volume={musicVolume}
                    loop={musicLoop}
                    persist={musicPersistSelection}
                    onCycle={() => playUi("track")}
                />
            )}
            {inGame && showSfxInGame && (
                <SfxButton
                    topPx={sfxTop}
                    rightPx={stackRightPx}
                    enabled={sfxEnabled}
                    onToggle={() => {
                        setSfxEnabled((v) => !v)
                        playUi("toggle")
                    }}
                />
            )}
            {inGame && showFullscreenInGame && (
                <FullscreenButton
                    topPx={fsTop}
                    rightPx={stackRightPx}
                    active={isFullscreen}
                    onToggle={toggleFullscreen}
                />
            )}

            {confirmExitOpen && inGame && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 30000,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(8px)",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: 420,
                            maxWidth: "90vw",
                            padding: 22,
                            borderRadius: 16,
                            background:
                                "linear-gradient(180deg,#0b1526,#0a1120)",
                            border: "1px solid rgba(0,194,255,.35)",
                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.55),0 0 24px rgba(0,194,255,.2)",
                            color: "#E6F7EF",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 800,
                                fontSize: 18,
                                marginBottom: 10,
                            }}
                        >
                            ¿Salir del entrenamiento?
                        </div>
                        <div
                            style={{
                                opacity: 0.9,
                                fontSize: 14,
                                marginBottom: 18,
                            }}
                        >
                            Volverás a la selección de simuladores.
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                justifyContent: "center",
                            }}
                        >
                            <button
                                onClick={() => {
                                    playUi("menu")
                                    setConfirmExitOpen(false)
                                    handleExitGame()
                                }}
                                style={{
                                    minWidth: 120,
                                    padding: "10px 14px",
                                    borderRadius: 12,
                                    border:
                                        confirmFocus === "yes"
                                            ? "1px solid #3CFF7B"
                                            : "1px solid rgba(60,255,123,0.75)",
                                    background:
                                        "linear-gradient(180deg,rgba(20,65,40,0.9),rgba(10,40,25,0.85))",
                                    color: "#E5FFF5",
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontFamily: "monospace",
                                }}
                            >
                                sí
                            </button>
                            <button
                                onClick={() => {
                                    playUi("menu")
                                    setConfirmExitOpen(false)
                                }}
                                style={{
                                    minWidth: 120,
                                    padding: "10px 14px",
                                    borderRadius: 12,
                                    border:
                                        confirmFocus === "no"
                                            ? "1px solid #FFD700"
                                            : "1px solid rgba(255,215,0,0.7)",
                                    background:
                                        "linear-gradient(180deg,rgba(65,45,10,0.9),rgba(40,28,8,0.85))",
                                    color: "#FFF0C8",
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontFamily: "monospace",
                                }}
                            >
                                no
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {introPlaying && introVideoSrc && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 20000,
                        background: "black",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <video
                        src={introVideoSrc}
                        autoPlay
                        playsInline
                        onEnded={handleIntroFinished}
                        onError={handleIntroFinished}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default RSV_SolarSimuladoresShell
