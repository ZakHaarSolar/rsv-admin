// FrecuenciasSonoras.tsx v1.8 — SELECTOR DE SIMILITUD (Primas / Hermanas /
// Gemelas) al armar un álbum desde un track — en "Complementar" y en "Convertir
// en álbum". Gemelas = piezas casi idénticas a la original (mismo BPM/instrumentos/
// producción, solo cambia el ángulo). Pareja del edge v1.7 (param similarity).
// v1.7 — pestaña nueva "Complementar": pegas un prompt de
// Suno que YA hiciste (Styles + Exclude + Weirdness% + Style Influence%, con link
// opcional al track) y el panel arma un ÁLBUM alrededor — tu pieza queda como
// pieza 1 y nacen N piezas hermanas que se sienten integradas al escucharse
// seguidas. Pareja del edge generate-suno-prompt v1.6 (modo seed_album).
// v1.6 — (1) al cambiar a "Directo" se ESCONDEN las
// direcciones y se suelta la dirección elegida (no ensucia la generación directa).
// (2) fuera el botón "Copiar todo (formato Suno)" — Suno no acepta ese pegado; se
// copia campo por campo. (3) el paso "Cuánto pesa tu inspiración" se DESACTIVA si
// no elegiste nada en Inspiración (Paso 2). Sin cambios de edge/SQL.
// v1.5 — (1) Biblioteca a prueba de balas: el helper del
// gateway ESPERA el token de Clerk (la carrera de token frío era la causa del
// "no respondió"), reporta el MOTIVO real del gateway y reintenta solo (+ botón
// Reintentar). (2) Botón ✦ AUTO en "Afina y genera" (perillas al punto recomendado
// según la dirección). (3) Tarjetas flotantes al pasar el cursor por cada extremo
// de las perillas (Minimal, Denso…). (4) Instrumentación en CHIPS que SUENAN:
// toca "arpa" y oyes un boceto sintético (Web Audio, $0). (5) Afinador de letra
// con instrucción libre ("más geométrica") + estado ✓ PRODUCIDA EN SUNO por pieza
// con link + filtro Producidas/Pendientes. (6) Portada de álbum: prompt para Nano
// Banana al crear álbum + botón generar/regenerar en Biblioteca. Pareja del edge
// generate-suno-prompt v1.5 + admin-action v1.34 + migración 20260710.
// v1.4 — Arrastrar imagen (drag&drop) + modo "Directo" (crea
// sin proponer direcciones) + la Biblioteca muestra el MOTIVO real si no puede leer
// (típico: admin-action sin desplegar → cae a REST anon → unauthorized). Logs
// [FS] en consola. Sin cambios de edge/SQL.
// v1.3 — Dos capas: CREAR (composición) y BIBLIOTECA
// (galería full-screen con orden + agrupar piezas sueltas en álbum + renombrar +
// convertir una pieza en álbum). Botón "Convertir en álbum" en cada pieza (genera
// N piezas más como ángulos del mismo pulso). Pareja del edge generate-suno-prompt
// v1.3 + migración 20260709e_suno_grouping.
//
// v1.2 — scroll propio + auto-scroll a direcciones/resultado.
// v1.1 — rework de layout (tarjetas + bandeja viva + escala + imagen real + álbum).
// v1.0 — versión inicial. PANEL "FRECUENCIAS SONORAS": generador de prompts para
// Suno con el ADN musical de Red Solar Viva. Pestaña admin propia (nivel Motor /
// Atelier). Cerebro: DeepSeek vía OpenRouter. "Solo prompts" ($0).

import { useState, useEffect, useCallback, useRef } from "react"

/* ═══════════════════════════════════════════════════════════════ Paleta ═══ */
const CYAN = "#00E5FF"
const CYAN_DK = "#00A8C4"
const GOLD = "#F5C542"
const GOLD_DK = "#C99A26"
const INK = "#EAF7FF"
const MUTE = "rgba(180,222,242,0.62)"
const MUTE2 = "rgba(150,200,225,0.42)"
const LINE = "rgba(0,229,255,0.22)"
const PANEL = "rgba(6,20,32,0.72)"
const PANEL2 = "rgba(9,26,40,0.55)"
const FONT = "'Inter', -apple-system, sans-serif"
const MONO = "'JetBrains Mono', 'SF Mono', monospace"

interface Props {
    supabaseUrl?: string
    supabaseAnonKey?: string
    isMobile?: boolean
}

/* ═══════════════════════════════════════════════════════════════ Tipos ═══ */
interface Track {
    id: string
    title: string
    style_prompt: string
    excludes: string[]
    weirdness: number | null
    style_influence: number | null
    lyrics: string | null
    orden: number
}
interface Album {
    id: string
    name: string
    vibe_tag: string
    archetype: string
    genre: string
    orden: number
    active: boolean
    tracks: Track[]
}
interface Direction {
    key?: string
    name: string
    essence?: string
    genres?: string
    instrumentation?: string
    mood?: string
    tempo_feel?: string
    production?: string
    notes?: string
    why?: string
}
interface Creation {
    id: string
    title: string
    direction_name: string
    direction: Direction | null
    project: string
    instrumental: boolean
    lyrics_lang: string | null
    style_prompt: string
    excludes: string[]
    weirdness: number | null
    style_influence: number | null
    lyrics: string | null
    config_notes: string
    generated_at: string
    set_id: string | null
    set_title: string | null
    track_no: number | null
    total_tracks: number | null
    angle: string | null
    produced_at?: string | null
    produced_url?: string | null
    set_cover_prompt?: string | null
}
type Knobs = { epicidad: number; terrenalidad: number; ritmo: number; densidad: number; estructura: number; produccion: number }
const DEFAULT_KNOBS: Knobs = { epicidad: 50, terrenalidad: 30, ritmo: 40, densidad: 45, estructura: 40, produccion: 40 }

/* ═══════════════════════════════════════════════════════ Helpers REST ═══ */
// Espera el token de Clerk con paciencia (≤ ~4s): en una entrada directa a
// /frecuencias el panel monta ANTES de que Clerk hidrate la sesión — pedir el
// token una sola vez era la causa del "la Biblioteca no respondió".
async function getClerkTokenPatient(): Promise<string | null> {
    for (let i = 0; i < 13; i++) {
        try {
            const t = await (window as any).Clerk?.session?.getToken?.()
            if (t) return t
        } catch {}
        await new Promise((r) => setTimeout(r, 300))
    }
    return null
}

// Llama una RPC por el gateway admin-action. Si algo falla, devuelve
// { error: <motivo real> } — nunca un null mudo.
async function rpc(url: string, key: string, fn: string, params: Record<string, any> = {}) {
    if (!url || !key) return { error: "Faltan las credenciales de Supabase (props del panel en el Domo)." }
    try {
        const token = await getClerkTokenPatient()
        if (!token)
            return { error: "La sesión de administrador aún no está lista (Clerk no entregó el token). Espera unos segundos y reintenta." }
        const g = await fetch(`${url}/functions/v1/admin-action`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
            body: JSON.stringify({ token, action: fn, params }),
        })
        let body: any = null
        try {
            body = await g.json()
        } catch {}
        if (g.ok) return body
        const base = `admin-action respondió ${g.status}: ${body?.error || "sin detalle"}${body?.code ? ` (código ${body.code})` : ""}`
        if (body?.error === "action_not_allowed")
            return { error: `${base} — el deploy vivo de admin-action no incluye "${fn}"; redespliega admin-action.` }
        if (body?.error === "invalid_token")
            return { error: `${base} — la sesión expiró; recarga la página.` }
        return { error: base }
    } catch (e: any) {
        return { error: `No se pudo llamar a admin-action (red): ${e?.message || e}` }
    }
}

async function callEdge(url: string, key: string, payload: Record<string, any>, signal?: AbortSignal) {
    const r = await fetch(`${url}/functions/v1/generate-suno-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ ...payload, token: await (window as any).Clerk?.session?.getToken?.() }),
        signal,
    })
    let body: any = null
    try {
        body = await r.json()
    } catch {}
    return { ok: r.ok, status: r.status, body }
}

function resizeImageToDataUrl(file: File, maxSide = 900): Promise<string> {
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
                w = Math.round(w * scale)
                h = Math.round(h * scale)
                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) return reject(new Error("Sin canvas"))
                ctx.drawImage(img, 0, 0, w, h)
                resolve(canvas.toDataURL("image/jpeg", 0.85))
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    })
}

function ensureCss() {
    if (typeof document === "undefined") return
    if (document.getElementById("fs-css-v1")) return
    const s = document.createElement("style")
    s.id = "fs-css-v1"
    s.textContent = `
@keyframes fsPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
@keyframes fsSpin { to { transform: rotate(360deg) } }
.fs-slider{ -webkit-appearance:none; appearance:none; width:100%; height:4px; border-radius:4px; background:linear-gradient(90deg, rgba(0,229,255,.15), rgba(0,229,255,.5)); outline:none; }
.fs-slider::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:50%; background:#00E5FF; border:2px solid #06202f; cursor:pointer; box-shadow:0 0 10px rgba(0,229,255,.7); }
.fs-slider::-moz-range-thumb{ width:16px; height:16px; border-radius:50%; background:#00E5FF; border:2px solid #06202f; cursor:pointer; box-shadow:0 0 10px rgba(0,229,255,.7); }
.fs-scroll::-webkit-scrollbar{ width:8px; height:8px; }
.fs-scroll::-webkit-scrollbar-thumb{ background:rgba(0,229,255,.25); border-radius:8px; }
@keyframes fsSound { 0%,100%{ box-shadow:0 0 6px rgba(245,197,66,.35) } 50%{ box-shadow:0 0 16px rgba(245,197,66,.75) } }
`
    document.head.appendChild(s)
}

/* ═══════════════ Audición: bocetos sintéticos de instrumentos ═══
   Web Audio puro ($0, sin muestras): cada instrumento de una dirección se
   puede TOCAR para oír un boceto de su carácter. Son esbozos sintéticos —
   dan la idea del timbre/rol, no el sonido final de Suno. */
let __fsAc: AudioContext | null = null
let __fsBusStop: (() => void) | null = null
let __fsNoiseBuf: AudioBuffer | null = null

function fsCtx(): AudioContext | null {
    try {
        if (!__fsAc) {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext
            if (!AC) return null
            __fsAc = new AC()
        }
        if (__fsAc && __fsAc.state === "suspended") __fsAc.resume()
        return __fsAc
    } catch {
        return null
    }
}
function fsNoise(ac: AudioContext): AudioBuffer {
    if (__fsNoiseBuf && __fsNoiseBuf.sampleRate === ac.sampleRate) return __fsNoiseBuf
    const len = Math.floor(ac.sampleRate * 2)
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    __fsNoiseBuf = buf
    return buf
}
// Envelope estándar: attack → peak → decay hacia end (auto-stop).
function fsEnv(ac: AudioContext, t0: number, a: number, peak: number, dur: number, tail = 0.0001): GainNode {
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + Math.max(0.005, a))
    g.gain.exponentialRampToValueAtTime(tail, t0 + dur)
    return g
}
function fsTone(ac: AudioContext, bus: GainNode, o: { type?: OscillatorType; f: number; t: number; a?: number; dur: number; peak?: number; detune?: number; vib?: { f: number; amp: number }; glideTo?: number }) {
    const osc = ac.createOscillator()
    osc.type = o.type || "sine"
    osc.frequency.setValueAtTime(o.f, o.t)
    if (o.glideTo) osc.frequency.linearRampToValueAtTime(o.glideTo, o.t + o.dur * 0.8)
    if (o.detune) osc.detune.value = o.detune
    const g = fsEnv(ac, o.t, o.a ?? 0.02, o.peak ?? 0.16, o.dur)
    if (o.vib) {
        const lfo = ac.createOscillator()
        const lg = ac.createGain()
        lfo.frequency.value = o.vib.f
        lg.gain.value = o.vib.amp
        lfo.connect(lg)
        lg.connect(osc.frequency)
        lfo.start(o.t)
        lfo.stop(o.t + o.dur + 0.1)
    }
    osc.connect(g)
    g.connect(bus)
    osc.start(o.t)
    osc.stop(o.t + o.dur + 0.15)
}
function fsNoiseHit(ac: AudioContext, bus: GainNode, o: { t: number; dur: number; a?: number; peak?: number; type: BiquadFilterType; f0: number; f1?: number; q?: number }) {
    const src = ac.createBufferSource()
    src.buffer = fsNoise(ac)
    src.loop = true
    const fl = ac.createBiquadFilter()
    fl.type = o.type
    fl.frequency.setValueAtTime(o.f0, o.t)
    if (o.f1) fl.frequency.linearRampToValueAtTime(o.f1, o.t + o.dur)
    fl.Q.value = o.q ?? 0.8
    const g = fsEnv(ac, o.t, o.a ?? 0.01, o.peak ?? 0.1, o.dur)
    src.connect(fl)
    fl.connect(g)
    g.connect(bus)
    src.start(o.t)
    src.stop(o.t + o.dur + 0.1)
}
const FQ = { A2: 110, E3: 164.81, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, E6: 1318.5 }

// Cada patch programa su boceto y devuelve la duración total (segundos).
const FS_PATCHES: Record<string, (ac: AudioContext, bus: GainNode, t: number) => number> = {
    flute: (ac, bus, t) => {
        ;[FQ.A4, FQ.C5, FQ.E5].forEach((f, i) => {
            fsTone(ac, bus, { f, t: t + i * 0.5, a: 0.07, dur: i === 2 ? 1.1 : 0.55, peak: 0.17, vib: { f: 5.2, amp: 5 } })
            fsTone(ac, bus, { f: f * 2, t: t + i * 0.5, a: 0.09, dur: i === 2 ? 1.1 : 0.55, peak: 0.03 })
            fsNoiseHit(ac, bus, { t: t + i * 0.5, dur: 0.35, a: 0.05, peak: 0.012, type: "bandpass", f0: f * 2, q: 1.2 })
        })
        return 2.7
    },
    strings: (ac, bus, t) => {
        const fl = ac.createBiquadFilter()
        fl.type = "lowpass"
        fl.frequency.value = 1300
        fl.connect(bus)
        const sub = ac.createGain()
        sub.gain.value = 1
        sub.connect(fl)
        ;[FQ.A3, FQ.E4, FQ.A4, FQ.C5].forEach((f) => {
            ;[-6, 6].forEach((dt) => fsTone(ac, sub as any, { type: "sawtooth", f, t, a: 0.45, dur: 2.5, peak: 0.05, detune: dt }))
        })
        return 2.8
    },
    handperc: (ac, bus, t) => {
        ;[0, 0.42, 0.84, 1.05, 1.47].forEach((dt, i) => {
            const hard = i % 3 === 0
            fsTone(ac, bus, { f: hard ? 165 : 220, glideTo: hard ? 58 : 88, t: t + dt, a: 0.005, dur: 0.28, peak: hard ? 0.34 : 0.2 })
            fsNoiseHit(ac, bus, { t: t + dt, dur: 0.07, peak: 0.05, type: "highpass", f0: 1800 })
        })
        return 2.1
    },
    harp: (ac, bus, t) => {
        ;[FQ.A3, FQ.C4, FQ.E4, FQ.G4, FQ.A4, FQ.C5, FQ.E5].forEach((f, i) => {
            fsTone(ac, bus, { type: "triangle", f, t: t + i * 0.16, a: 0.005, dur: 1.3, peak: 0.16 })
            fsTone(ac, bus, { f: f * 2, t: t + i * 0.16, a: 0.005, dur: 0.8, peak: 0.04 })
        })
        return 2.6
    },
    piano: (ac, bus, t) => {
        ;[FQ.A3, FQ.E4, FQ.A4, FQ.C5].forEach((f, i) => {
            fsTone(ac, bus, { f, t: t + i * 0.22, a: 0.006, dur: 1.8, peak: 0.17 })
            fsTone(ac, bus, { f: f * 3, t: t + i * 0.22, a: 0.006, dur: 0.7, peak: 0.025 })
        })
        return 2.7
    },
    pad: (ac, bus, t) => {
        const fl = ac.createBiquadFilter()
        fl.type = "lowpass"
        fl.frequency.setValueAtTime(500, t)
        fl.frequency.linearRampToValueAtTime(1500, t + 1.4)
        fl.frequency.linearRampToValueAtTime(700, t + 2.7)
        fl.connect(bus)
        ;[FQ.A3, FQ.E4, FQ.A4].forEach((f) => {
            ;[-8, 8].forEach((dt) => fsTone(ac, fl as any, { type: "sawtooth", f, t, a: 0.7, dur: 2.7, peak: 0.045, detune: dt }))
        })
        return 3
    },
    bell: (ac, bus, t) => {
        ;[FQ.A5, FQ.E5].forEach((f, i) => {
            const tt = t + i * 0.85
            fsTone(ac, bus, { f, t: tt, a: 0.004, dur: 2, peak: 0.14 })
            fsTone(ac, bus, { f: f * 2.76, t: tt, a: 0.004, dur: 1.1, peak: 0.05 })
            fsTone(ac, bus, { f: f * 5.4, t: tt, a: 0.004, dur: 0.5, peak: 0.02 })
        })
        return 2.9
    },
    bowl: (ac, bus, t) => {
        fsTone(ac, bus, { f: 221, t, a: 0.5, dur: 3, peak: 0.15 })
        fsTone(ac, bus, { f: 223.5, t, a: 0.6, dur: 3, peak: 0.1 })
        fsTone(ac, bus, { f: 331.5, t, a: 0.8, dur: 2.6, peak: 0.05 })
        return 3.2
    },
    choir: (ac, bus, t) => {
        const f1 = ac.createBiquadFilter()
        f1.type = "bandpass"
        f1.frequency.value = 800
        f1.Q.value = 2.5
        const f2 = ac.createBiquadFilter()
        f2.type = "bandpass"
        f2.frequency.value = 1150
        f2.Q.value = 3
        const mix = ac.createGain()
        mix.gain.value = 1.6
        f1.connect(mix)
        f2.connect(mix)
        mix.connect(bus)
        ;[FQ.A3, FQ.E4, FQ.A4].forEach((f) => {
            ;[-7, 7].forEach((dt) => {
                const o = ac.createOscillator()
                o.type = "sawtooth"
                o.frequency.value = f
                o.detune.value = dt
                const g = fsEnv(ac, t, 0.55, 0.05, 2.6)
                o.connect(g)
                g.connect(f1)
                g.connect(f2)
                o.start(t)
                o.stop(t + 2.8)
            })
        })
        return 2.9
    },
    bass: (ac, bus, t) => {
        fsTone(ac, bus, { f: FQ.A2 / 2, t, a: 0.03, dur: 1.1, peak: 0.4 })
        fsTone(ac, bus, { f: FQ.E3 / 2, t: t + 1.15, a: 0.03, dur: 1.2, peak: 0.4 })
        return 2.6
    },
    water: (ac, bus, t) => {
        const src = ac.createBufferSource()
        src.buffer = fsNoise(ac)
        src.loop = true
        const fl = ac.createBiquadFilter()
        fl.type = "lowpass"
        fl.frequency.value = 520
        const lfo = ac.createOscillator()
        const lg = ac.createGain()
        lfo.frequency.value = 0.9
        lg.gain.value = 260
        lfo.connect(lg)
        lg.connect(fl.frequency)
        const g = fsEnv(ac, t, 0.4, 0.09, 2.8)
        src.connect(fl)
        fl.connect(g)
        g.connect(bus)
        src.start(t)
        src.stop(t + 3)
        lfo.start(t)
        lfo.stop(t + 3)
        for (let i = 0; i < 6; i++) {
            const tt = t + 0.3 + i * 0.42
            fsTone(ac, bus, { f: 900 + ((i * 517) % 700), glideTo: 1500 + ((i * 331) % 500), t: tt, a: 0.004, dur: 0.09, peak: 0.045 })
        }
        return 3
    },
    wind: (ac, bus, t) => {
        fsNoiseHit(ac, bus, { t, dur: 2.8, a: 0.6, peak: 0.11, type: "bandpass", f0: 380, f1: 950, q: 1.6 })
        return 3
    },
    glass: (ac, bus, t) => {
        ;[FQ.A5, FQ.E6].forEach((f, i) => {
            const tt = t + i * 0.7
            fsTone(ac, bus, { f, t: tt, a: 0.15, dur: 2.2, peak: 0.1, vib: { f: 6.5, amp: 2 } })
            fsTone(ac, bus, { f: f * 2.01, t: tt, a: 0.2, dur: 1.8, peak: 0.035 })
        })
        return 3
    },
    arpsynth: (ac, bus, t) => {
        const dl = ac.createDelay(0.5)
        dl.delayTime.value = 0.21
        const fb = ac.createGain()
        fb.gain.value = 0.32
        dl.connect(fb)
        fb.connect(dl)
        dl.connect(bus)
        ;[FQ.A4, FQ.C5, FQ.E5, FQ.G5, FQ.A5, FQ.G5, FQ.E5, FQ.C5].forEach((f, i) => {
            const g = fsEnv(ac, t + i * 0.14, 0.004, 0.09, 0.16)
            const o = ac.createOscillator()
            o.type = "triangle"
            o.frequency.value = f
            o.connect(g)
            g.connect(bus)
            g.connect(dl)
            o.start(t + i * 0.14)
            o.stop(t + i * 0.14 + 0.3)
        })
        return 2.5
    },
    kalimba: (ac, bus, t) => {
        ;[FQ.A4, FQ.C5, FQ.E5, FQ.A5].forEach((f, i) => {
            fsTone(ac, bus, { f, t: t + i * 0.3, a: 0.003, dur: 0.75, peak: 0.18 })
            fsTone(ac, bus, { f: f * 2.4, t: t + i * 0.3, a: 0.003, dur: 0.3, peak: 0.04 })
        })
        return 2
    },
    guitar: (ac, bus, t) => {
        ;[FQ.A3, FQ.E4, FQ.A4, FQ.C5, FQ.E5].forEach((f, i) => {
            fsTone(ac, bus, { type: "triangle", f, t: t + i * 0.19, a: 0.004, dur: 1.1, peak: 0.15 })
            fsTone(ac, bus, { type: "sine", f: f * 2, t: t + i * 0.19, a: 0.004, dur: 0.5, peak: 0.03 })
        })
        return 2.2
    },
    organ: (ac, bus, t) => {
        ;[FQ.A3, FQ.A4, FQ.E5].forEach((f, i) => fsTone(ac, bus, { f, t, a: 0.06, dur: 2.2, peak: i === 0 ? 0.14 : 0.07 }))
        return 2.5
    },
    marimba: (ac, bus, t) => {
        ;[FQ.A4, FQ.C5, FQ.E5, FQ.G5].forEach((f, i) => {
            fsTone(ac, bus, { f, t: t + i * 0.24, a: 0.003, dur: 0.4, peak: 0.2 })
            fsTone(ac, bus, { f: f * 4, t: t + i * 0.24, a: 0.003, dur: 0.12, peak: 0.05 })
        })
        return 1.8
    },
    theremin: (ac, bus, t) => {
        fsTone(ac, bus, { f: FQ.A4, glideTo: FQ.E5, t, a: 0.25, dur: 1.9, peak: 0.15, vib: { f: 6, amp: 9 } })
        return 2.2
    },
    drone: (ac, bus, t) => {
        const fl = ac.createBiquadFilter()
        fl.type = "lowpass"
        fl.frequency.value = 320
        fl.connect(bus)
        fsTone(ac, fl as any, { type: "sawtooth", f: 65, t, a: 0.5, dur: 2.9, peak: 0.3 })
        fsTone(ac, fl as any, { type: "sawtooth", f: 65.6, t, a: 0.5, dur: 2.9, peak: 0.25 })
        return 3.1
    },
}

const FS_AUDITION_MAP: [RegExp, string][] = [
    [/flaut|flute|\bpan\b|quena|ocarina|whistle|shakuhachi/, "flute"],
    [/arpa|harp(?!si)/, "harp"],
    [/cuenco|bowl|tibetan|singing/, "bowl"],
    [/campan|bell|chime|carill|glocken|handpan|hang\b/, "bell"],
    [/percu|drum|tambor|frame|bongo|tabla\b|udu|conga|djembe|beat org/, "handperc"],
    [/string|cuerda|violin|cello|chelo|viola|orquest|ensemble/, "strings"],
    [/rhodes|piano|keys|teclado|felt/, "piano"],
    [/coro|choir|voces|voz|vocal|canto|whisper|susurr|wordless|angel/, "choir"],
    [/agua|water|rio\b|ocean|\bmar\b|lluvia|rain|gota|drip|stream/, "water"],
    [/viento|wind|aire|brisa|breath/, "wind"],
    [/cristal|crystal|glass|vidrio/, "glass"],
    [/kalimba|mbira|music box|caja de music/, "kalimba"],
    [/guitarr|guitar|nylon|laud|charango|ukulele/, "guitar"],
    [/organo|organ\b|armonio|harmonium/, "organ"],
    [/marimba|xilof|xylo|mallet|vibraf/, "marimba"],
    [/theremin/, "theremin"],
    [/drone|didger|bordon|tanpura|\bom\b/, "drone"],
    [/bajo|bass|\bsub\b|808/, "bass"],
    [/arpegi|\barp\b|secuenc|sequence|pluck|synth lead/, "arpsynth"],
    [/pad|atmosfer|textur|ambient|colchon|nebul|aura/, "pad"],
]

// Toca el boceto del instrumento. Devuelve la duración (0 si no hay audio).
function auditionInstrument(label: string): number {
    const ac = fsCtx()
    if (!ac) return 0
    try {
        __fsBusStop?.()
    } catch {}
    const norm = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    let key = "pad"
    for (const [re, k] of FS_AUDITION_MAP)
        if (re.test(norm)) {
            key = k
            break
        }
    const bus = ac.createGain()
    bus.gain.value = 0.9
    const comp = ac.createDynamicsCompressor()
    bus.connect(comp)
    comp.connect(ac.destination)
    __fsBusStop = () => {
        try {
            const now = ac.currentTime
            bus.gain.cancelScheduledValues(now)
            bus.gain.setValueAtTime(bus.gain.value, now)
            bus.gain.linearRampToValueAtTime(0.0001, now + 0.09)
            setTimeout(() => {
                try {
                    bus.disconnect()
                    comp.disconnect()
                } catch {}
            }, 140)
        } catch {}
    }
    const dur = FS_PATCHES[key](ac, bus, ac.currentTime + 0.03)
    return dur
}

function splitInstruments(text: string): string[] {
    return String(text || "")
        .split(/[,;·•|]|\s+y\s+|\s+\+\s+|\s+and\s+/gi)
        .map((s) => s.trim().replace(/^[-–—.\s]+|[.\s]+$/g, ""))
        .filter((s) => s.length > 2)
        .slice(0, 12)
}

/* ═══════════ Tarjetas explicativas de las perillas (hover) ═══ */
const KNOB_INFO: Record<string, { title: string; what: string; sound: string; when: string }> = {
    "Íntimo": {
        title: "Íntimo",
        what: "La pieza se siente cercana, personal, susurrada — como si sonara a centímetros de ti, para ti.",
        sound: "Pocas capas, dinámicas suaves, instrumentos solistas, silencios que respiran. Voz (si hay) casi hablada al oído.",
        when: "Meditaciones personales, momentos de introspección, piezas de sanación uno-a-uno.",
    },
    "Épico": {
        title: "Épico",
        what: "La pieza se expande a escala cósmica: crece, se eleva y envuelve como una revelación.",
        sound: "Crescendos, coros amplios, percusión que abre el pecho, capas que se suman hasta un clímax luminoso.",
        when: "Aperturas, momentos de activación, piezas que acompañan una visión o un cierre de ciclo.",
    },
    "Etéreo": {
        title: "Etéreo",
        what: "El sonido flota sin gravedad: ligero, celestial, casi sin cuerpo físico.",
        sound: "Pads de aire, reverberaciones largas, coros lejanos, texturas de cristal y agua. Poco ataque, todo fluye.",
        when: "Viajes interiores, sueño lúcido, estados de disolución y contemplación.",
    },
    "Terrenal": {
        title: "Terrenal",
        what: "El sonido tiene cuerpo, madera y piel: se siente tocado por manos humanas sobre la tierra.",
        sound: "Instrumentos acústicos reales (flautas, cuerdas, percusión de mano), calidez orgánica, imperfección viva.",
        when: "Anclaje, movimiento consciente, conexión con la naturaleza y las raíces.",
    },
    "Meditativo": {
        title: "Meditativo",
        what: "El tiempo casi se detiene: la pieza sostiene un estado en vez de avanzar hacia algo.",
        sound: "Tempo muy lento o sin pulso perceptible, notas largas, cambios graduales que apenas se notan.",
        when: "Meditación profunda, respiración guiada, sonido de fondo para presencia total.",
    },
    "Rítmico": {
        title: "Rítmico",
        what: "Un pulso claro lleva la pieza y el cuerpo lo sigue solo: cabeza, manos, caminar, danza.",
        sound: "Percusión definida, groove constante, energía en movimiento (del pulso suave al 4/4 del house solar).",
        when: "Danza-meditación, ejercicio consciente, activación matutina, euforia espiritual.",
    },
    "Minimal": {
        title: "Minimal",
        what: "Pocos elementos con mucho espacio: cada sonido importa y el silencio entre ellos también.",
        sound: "2-3 capas respirando, frases que se repiten con variaciones sutiles, sensación de amplitud y aire.",
        when: "Foco, lectura, trabajo profundo, o cuando el mensaje es el espacio mismo.",
    },
    "Denso": {
        title: "Denso",
        what: "Muchas capas sonando a la vez: un tejido rico que te envuelve por completo.",
        sound: "Orquestación llena, coros + cuerdas + pads + percusión entrelazados, sensación cinematográfica.",
        when: "Piezas épicas, clímax emocionales, música que debe llenar el espacio entero.",
    },
    "Frecuencial": {
        title: "Frecuencial",
        what: "La pieza se organiza alrededor de frecuencias sostenidas (Hz sagrados, drones) más que de melodías.",
        sound: "Tonos puros que vibran y baten entre sí (963 Hz, 528 Hz…), capas que entran y salen sin 'canción'.",
        when: "Sanación por frecuencia, calibración, estados alterados suaves, sonido funcional.",
    },
    "Melódico": {
        title: "Melódico",
        what: "Hay una melodía reconocible que puedes tararear: la pieza cuenta algo con forma de canción.",
        sound: "Temas que se presentan, se desarrollan y regresan; estructura clara (intro, verso, coro).",
        when: "Piezas memorables, himnos del proyecto, música que quieres que se quede en la memoria.",
    },
    "Cristalino": {
        title: "Cristalino",
        what: "Producción pulida y transparente como cristal: cada sonido brilla definido y en su lugar.",
        sound: "Agudos luminosos, reverbs limpias, precisión digital, sensación de pureza y claridad absoluta.",
        when: "Piezas de luz, frecuencias sagradas, estética futurista-etérea de la marca.",
    },
    "Análogo": {
        title: "Análogo",
        what: "Producción cálida y con textura vivida: el sonido abraza en vez de brillar.",
        sound: "Saturación suave de cinta, graves redondos, pequeñas imperfecciones que dan alma vintage.",
        when: "Piezas nostálgicas, calidez humana, sesiones nocturnas y contemplativas.",
    },
}

function InfoHover({ term, children }: { term: string; children: any }) {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
    const info = KNOB_INFO[term]
    if (!info) return <>{children}</>
    const show = (e: any) => {
        try {
            const r = e.currentTarget.getBoundingClientRect()
            setPos({ x: r.left + r.width / 2, y: r.bottom })
        } catch {}
    }
    const W = 296
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200
    const left = pos ? Math.max(10, Math.min(pos.x - W / 2, vw - W - 10)) : 0
    return (
        <span
            onMouseEnter={show}
            onMouseLeave={() => setPos(null)}
            onClick={(e) => {
                e.stopPropagation()
                pos ? setPos(null) : show(e)
            }}
            style={{ cursor: "help", borderBottom: "1px dotted rgba(0,229,255,0.5)", position: "relative" }}
        >
            {children}
            {pos && (
                <div style={{ position: "fixed", left, top: pos.y + 10, width: W, zIndex: 99999, background: "linear-gradient(165deg, #0a2334f8, #071826fb)", border: `1px solid rgba(0,229,255,0.45)`, borderRadius: 12, padding: "13px 15px", boxShadow: "0 14px 44px rgba(0,0,0,0.6), 0 0 22px rgba(0,229,255,0.16)", pointerEvents: "none", textAlign: "left" }}>
                    <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: CYAN, marginBottom: 6 }}>{info.title}</div>
                    <div style={{ fontSize: 12, color: INK, lineHeight: 1.55, marginBottom: 8 }}>{info.what}</div>
                    <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5, marginBottom: 8 }}>
                        <span style={{ color: GOLD, fontFamily: MONO, fontSize: 10, letterSpacing: "0.05em" }}>♪ CÓMO SUENA · </span>
                        {info.sound}
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5 }}>
                        <span style={{ color: CYAN, fontFamily: MONO, fontSize: 10, letterSpacing: "0.05em" }}>✦ ÚSALO PARA · </span>
                        {info.when}
                    </div>
                </div>
            )}
        </span>
    )
}

/* ═══════════ AUTO: perillas al punto recomendado por arquetipo ═══ */
const AUTO_PRESETS: [RegExp, Knobs, string][] = [
    [/house|danza|dance|4\/4|ascend|soulful/, { epicidad: 55, terrenalidad: 45, ritmo: 85, densidad: 55, estructura: 65, produccion: 45 }, "House Solar Ascendente"],
    [/disoluc|quietud|no retorno|silenci|minimal puro|no-dual/, { epicidad: 25, terrenalidad: 15, ritmo: 10, densidad: 10, estructura: 12, produccion: 30 }, "Ambient de Disolución"],
    [/coral|luminic|aurora|fonet|lenguaje solar/, { epicidad: 60, terrenalidad: 25, ritmo: 30, densidad: 45, estructura: 40, produccion: 40 }, "Coral de Lenguaje Solar"],
    [/ancestr|tribal|planetar|raices|lucidwave|tierra aun canta/, { epicidad: 50, terrenalidad: 70, ritmo: 45, densidad: 45, estructura: 35, produccion: 65 }, "Ancestral Planetario"],
    [/organic|vuelo|cinemat|world|aventura|cielos/, { epicidad: 65, terrenalidad: 80, ritmo: 55, densidad: 55, estructura: 60, produccion: 70 }, "Orgánico Cinemático"],
    [/acuat|agua|atlant|lumeria|oceano|etereo acuatico/, { epicidad: 40, terrenalidad: 15, ritmo: 20, densidad: 30, estructura: 30, produccion: 35 }, "Etéreo Acuático"],
    [/solarwave|amanecer|luminoso|sol interior|psybient/, { epicidad: 55, terrenalidad: 30, ritmo: 35, densidad: 40, estructura: 45, produccion: 35 }, "Solarwave Luminoso"],
]
function autoKnobsFor(d: Direction | null): { knobs: Knobs; label: string } {
    const hay = `${d?.name || ""} ${d?.genres || ""} ${d?.essence || ""} ${d?.instrumentation || ""} ${d?.mood || ""}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
    for (const [re, k, label] of AUTO_PRESETS) if (re.test(hay)) return { knobs: { ...k }, label }
    return { knobs: { ...DEFAULT_KNOBS }, label: "el equilibrio del ADN" }
}

/* ═══════════════════════════════════════════════ Presentacionales ═══ */
function HoloCard({ children, glow, style }: { children: any; glow?: boolean; style?: any }) {
    return (
        <div style={{ position: "relative", background: `linear-gradient(160deg, ${PANEL}, ${PANEL2})`, border: `1px solid ${glow ? "rgba(0,229,255,0.5)" : LINE}`, borderRadius: 16, padding: 18, boxShadow: glow ? "0 0 0 1px rgba(0,229,255,0.14), 0 8px 40px rgba(0,180,255,0.14)" : "0 6px 26px rgba(0,0,0,0.35)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", ...style }}>
            {children}
        </div>
    )
}
function StepLabel({ n, title, hint }: { n: string; title: string; hint?: string }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: "#06202f", background: CYAN, borderRadius: 7, padding: "3px 9px", fontWeight: 700, boxShadow: "0 0 12px rgba(0,229,255,0.5)" }}>{n}</span>
                <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: INK, letterSpacing: "0.02em" }}>{title}</span>
            </div>
            {hint && <div style={{ marginTop: 6, fontFamily: FONT, fontSize: 12.5, color: MUTE, lineHeight: 1.5 }}>{hint}</div>}
        </div>
    )
}
function CopyBtn({ text, label, big }: { text: string; label?: string; big?: boolean }) {
    const [done, setDone] = useState(false)
    return (
        <button onClick={() => { try { navigator.clipboard.writeText(text || ""); setDone(true); setTimeout(() => setDone(false), 1400) } catch {} }} style={{ fontFamily: MONO, fontSize: big ? 12.5 : 11, fontWeight: 600, color: done ? "#06202f" : CYAN, background: done ? CYAN : "rgba(0,229,255,0.08)", border: `1px solid ${done ? CYAN : "rgba(0,229,255,0.3)"}`, borderRadius: 8, padding: big ? "8px 14px" : "5px 10px", cursor: "pointer", letterSpacing: "0.03em", transition: "all .15s", whiteSpace: "nowrap" }}>
            {done ? "✓ copiado" : label || "Copiar"}
        </button>
    )
}
function Segmented({ options, value, onChange }: { options: { key: string; label: string; sub?: string }[]; value: string; onChange: (k: string) => void }) {
    return (
        <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 4, border: `1px solid ${LINE}`, flexWrap: "wrap" }}>
            {options.map((o) => {
                const on = o.key === value
                return (
                    <button key={o.key} onClick={() => onChange(o.key)} style={{ flex: "1 1 auto", minWidth: 74, fontFamily: FONT, fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? "#06202f" : MUTE, background: on ? `linear-gradient(180deg, ${CYAN}, ${CYAN_DK})` : "transparent", border: "none", borderRadius: 9, padding: "8px 10px", cursor: "pointer", boxShadow: on ? "0 0 14px rgba(0,229,255,0.4)" : "none", transition: "all .15s" }}>
                        <div>{o.label}</div>
                        {o.sub && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1, fontWeight: 400 }}>{o.sub}</div>}
                    </button>
                )
            })}
        </div>
    )
}
function KnobSlider({ lo, hi, value, onChange }: { lo: string; hi: string; value: number; onChange: (v: number) => void }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: FONT, fontSize: 11.5, color: MUTE }}>
                <InfoHover term={lo}>
                    <span style={{ color: value <= 40 ? CYAN : MUTE }}>{lo}</span>
                </InfoHover>
                <InfoHover term={hi}>
                    <span style={{ color: value >= 60 ? CYAN : MUTE }}>{hi}</span>
                </InfoHover>
            </div>
            <input className="fs-slider" type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
    )
}
// Instrumentación como chips que SUENAN: toca uno y oyes un boceto sintético
// de ese instrumento (idea del timbre, no el sonido final de Suno).
function InstrumentChips({ text }: { text: string }) {
    const [playing, setPlaying] = useState<string | null>(null)
    const timerRef = useRef<any>(null)
    const parts = splitInstruments(text)
    if (!parts.length) return null
    return (
        <div style={{ fontSize: 12, lineHeight: 1.45 }}>
            <span style={{ color: CYAN, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.04em" }}>Instrumentación </span>
            <span style={{ color: MUTE2, fontSize: 10.5 }}>· toca para escuchar un boceto</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {parts.map((p, i) => {
                    const on = playing === p
                    return (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation()
                                const dur = auditionInstrument(p)
                                setPlaying(p)
                                if (timerRef.current) clearTimeout(timerRef.current)
                                timerRef.current = setTimeout(() => setPlaying(null), Math.max(700, dur * 1000))
                            }}
                            style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? GOLD : MUTE, background: on ? "rgba(245,197,66,0.12)" : "rgba(0,229,255,0.05)", border: `1px solid ${on ? "rgba(245,197,66,0.55)" : LINE}`, borderRadius: 16, padding: "4px 10px", cursor: "pointer", transition: "all .15s", animation: on ? "fsSound 0.9s ease-in-out infinite" : "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                            <span style={{ fontSize: 9.5, opacity: 0.9 }}>{on ? "♪" : "▸"}</span>
                            {p}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
function Spinner({ label }: { label?: string }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: CYAN, fontFamily: FONT, fontSize: 13 }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,229,255,0.25)", borderTopColor: CYAN, animation: "fsSpin .8s linear infinite", display: "inline-block" }} />
            {label}
        </span>
    )
}
function PrimaryBtn({ onClick, disabled, children, tone }: { onClick: () => void; disabled?: boolean; children: any; tone?: "cyan" | "gold" }) {
    const c = tone === "gold" ? GOLD : CYAN
    const cd = tone === "gold" ? GOLD_DK : CYAN_DK
    return (
        <button onClick={onClick} disabled={disabled} style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: disabled ? MUTE2 : "#06202f", background: disabled ? "rgba(0,229,255,0.06)" : `linear-gradient(180deg, ${c}, ${cd})`, border: `1px solid ${disabled ? LINE : c}`, borderRadius: 12, padding: "12px 22px", cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.04em", boxShadow: disabled ? "none" : `0 0 22px ${c}55`, transition: "all .15s" }}>
            {children}
        </button>
    )
}
function Chip({ label, on, onClick, removable }: { label: string; on?: boolean; onClick: () => void; removable?: boolean }) {
    return (
        <button onClick={onClick} style={{ fontFamily: FONT, fontSize: 12, fontWeight: on ? 600 : 500, color: on ? "#06202f" : MUTE, background: on ? CYAN : "rgba(0,229,255,0.06)", border: `1px solid ${on ? CYAN : LINE}`, borderRadius: 20, padding: "6px 12px", cursor: "pointer", boxShadow: on ? "0 0 12px rgba(0,229,255,0.4)" : "none", transition: "all .15s", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {on && !removable ? "✓ " : ""}
            {label}
            {removable && <span style={{ opacity: 0.75, fontWeight: 700 }}>✕</span>}
        </button>
    )
}
function langLabel(l: string): string {
    return l === "en" ? "Inglés" : l === "luminico" ? "Lenguaje lumínico" : l === "mantra" ? "Mantra" : "Español"
}
// Limpia los excludes pegados de Suno: quita el prefijo "Exclude styles:" y los
// guiones de todo tipo (incluido el ‑ raro que copia Suno).
function parseExcludes(raw: string): string[] {
    return String(raw || "")
        .replace(/^\s*exclude\s*styles?\s*:?/i, "")
        .split(/[,\n;]/)
        .map((s) => s.trim().replace(/^[-‐‑‒–—―·•\s]+/, "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 24)
}
function FieldLabel({ text, hint }: { text: string; hint?: string }) {
    return (
        <div style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "rgba(200,232,248,0.85)", letterSpacing: "0.03em" }}>{text}</div>
            {hint && <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 2, lineHeight: 1.45 }}>{hint}</div>}
        </div>
    )
}
function inputStyle(area?: boolean): any {
    return { width: "100%", boxSizing: "border-box", fontFamily: FONT, fontSize: 13.5, color: INK, background: "rgba(0,0,0,0.3)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", outline: "none", resize: area ? "vertical" : undefined, minHeight: area ? 66 : undefined, lineHeight: 1.5 }
}
function MiniRow({ k, v }: { k: string; v: string }) {
    return (
        <div style={{ fontSize: 12, lineHeight: 1.45 }}>
            <span style={{ color: CYAN, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.04em" }}>{k}: </span>
            <span style={{ color: MUTE }}>{v}</span>
        </div>
    )
}
const stepBtn: any = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${LINE}`, background: "rgba(0,229,255,0.08)", color: CYAN, fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 }

/* ═══════════════════════════════════════ Output de Suno (una pieza) ═══ */
function OutputBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: CYAN, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                <CopyBtn text={value} />
            </div>
            <div style={{ fontFamily: mono ? MONO : FONT, fontSize: 13, color: INK, lineHeight: 1.55, background: "rgba(0,0,0,0.28)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value || "—"}</div>
        </div>
    )
}
const GREEN = "#6FE8A3"
// Marcar una pieza como PRODUCIDA en Suno (con link opcional al track).
function ProducedControl({ onSave }: { onSave: (url: string) => void }) {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")
    if (!open)
        return (
            <button onClick={() => setOpen(true)} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: GREEN, background: "rgba(110,230,160,0.08)", border: "1px solid rgba(110,230,160,0.35)", borderRadius: 9, padding: "7px 13px", cursor: "pointer" }}>
                ◉ Marcar producida en Suno
            </button>
        )
    return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link del track en Suno (opcional)" style={{ ...inputStyle(), flex: "1 1 220px", fontSize: 12.5, padding: "8px 11px" }} />
            <button onClick={() => { onSave(url.trim()); setOpen(false); setUrl("") }} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#06202f", background: GREEN, border: `1px solid ${GREEN}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer" }}>Guardar</button>
            <button onClick={() => setOpen(false)} style={{ fontFamily: FONT, fontSize: 12, color: MUTE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 9, padding: "8px 12px", cursor: "pointer" }}>Cancelar</button>
        </div>
    )
}
// Bloque de PORTADA del álbum (prompt de arte para Nano Banana).
function CoverBlock({ prompt, busy, onGen }: { prompt: string; busy: boolean; onGen: () => void }) {
    return (
        <div style={{ marginBottom: 14, border: "1px solid rgba(245,197,66,0.32)", borderRadius: 12, padding: "12px 14px", background: "rgba(245,197,66,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: prompt ? 8 : 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: GOLD, letterSpacing: "0.08em" }}>◈ PORTADA · PROMPT PARA NANO BANANA</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {busy ? (
                        <Spinner label="Diseñando portada…" />
                    ) : (
                        <>
                            {prompt && <CopyBtn text={prompt} label="Copiar prompt" />}
                            <button onClick={onGen} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: GOLD, background: "rgba(245,197,66,0.08)", border: "1px solid rgba(245,197,66,0.35)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>{prompt ? "↻ Regenerar" : "◈ Generar portada"}</button>
                        </>
                    )}
                </div>
            </div>
            {prompt ? (
                <div style={{ fontFamily: MONO, fontSize: 12, color: INK, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{prompt}</div>
            ) : !busy ? (
                <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 6, lineHeight: 1.5 }}>Genera el prompt de arte de la portada (cuadrada, con el título del álbum) y pégalo en Nano Banana.</div>
            ) : null}
        </div>
    )
}
function OutputCard({ c, onRegenLyrics, regenLoading, onProduced }: { c: any; onRegenLyrics?: (note?: string) => void; regenLoading?: boolean; onProduced?: (next: boolean, url: string) => void }) {
    const [refineNote, setRefineNote] = useState("")
    return (
        <div>
            <OutputBlock label="Título" value={c.title} />
            <OutputBlock label="Estilo (campo Styles de Suno)" value={c.style_prompt} mono />
            <OutputBlock label="Exclude Styles" value={(c.excludes || []).join(", ")} mono />
            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 130px", background: "rgba(0,0,0,0.28)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 13px" }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: CYAN, letterSpacing: "0.06em" }}>1º WEIRDNESS</div>
                    <div style={{ fontFamily: MONO, fontSize: 24, color: INK, fontWeight: 700 }}>{c.weirdness ?? "?"}%</div>
                </div>
                <div style={{ flex: "1 1 130px", background: "rgba(0,0,0,0.28)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 13px" }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: "0.06em" }}>2º STYLE INFLUENCE</div>
                    <div style={{ fontFamily: MONO, fontSize: 24, color: INK, fontWeight: 700 }}>{c.style_influence ?? "?"}%</div>
                </div>
                <div style={{ flex: "1 1 130px", background: "rgba(0,0,0,0.28)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 13px" }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: "0.06em" }}>MODO</div>
                    <div style={{ fontFamily: FONT, fontSize: 14, color: INK, fontWeight: 600, marginTop: 4 }}>{c.instrumental ? "Instrumental" : `Con voz${c.lyrics_lang ? " · " + langLabel(c.lyrics_lang) : ""}`}</div>
                </div>
            </div>
            {!c.instrumental && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: CYAN, letterSpacing: "0.08em", textTransform: "uppercase" }}>Letra</span>
                        <CopyBtn text={c.lyrics || ""} />
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: INK, lineHeight: 1.6, background: "rgba(0,0,0,0.28)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", whiteSpace: "pre-wrap" }}>{c.lyrics || (regenLoading ? "Escribiendo…" : "—")}</div>
                    {onRegenLyrics && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <input value={refineNote} onChange={(e) => setRefineNote(e.target.value)} placeholder='Rumbo opcional: "más geométrica", "más agua", "menos épica"…' style={{ ...inputStyle(), flex: "1 1 230px", fontSize: 12.5, padding: "8px 11px" }} />
                            <button onClick={() => onRegenLyrics(refineNote.trim() || undefined)} disabled={regenLoading} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: regenLoading ? MUTE2 : GOLD, background: "rgba(245,197,66,0.08)", border: `1px solid ${regenLoading ? LINE : "rgba(245,197,66,0.35)"}`, borderRadius: 8, padding: "8px 12px", cursor: regenLoading ? "wait" : "pointer", whiteSpace: "nowrap" }}>
                                {regenLoading ? "Escribiendo…" : refineNote.trim() ? "↻ Afinar letra" : "↻ Regenerar letra"}
                            </button>
                        </div>
                    )}
                </div>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {onProduced &&
                    (c.produced_at ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#06202f", background: GREEN, borderRadius: 8, padding: "6px 11px" }}>✓ Producida en Suno</span>
                            {c.produced_url && (
                                <a href={c.produced_url} target="_blank" rel="noreferrer" style={{ color: CYAN, fontSize: 12.5, fontFamily: FONT }}>
                                    Escuchar ↗
                                </a>
                            )}
                            <button onClick={() => onProduced(false, "")} title="Quitar la marca" style={{ background: "transparent", border: "none", color: MUTE2, cursor: "pointer", fontSize: 12 }}>✕</button>
                        </span>
                    ) : (
                        <ProducedControl onSave={(url) => onProduced(true, url)} />
                    ))}
            </div>
        </div>
    )
}

/* ═══════════ Selector de similitud (qué tan cerca de la original) ═══ */
const SIM_OPTIONS = [
    { key: "low", label: "Primas", sub: "variadas" },
    { key: "medium", label: "Hermanas", sub: "mismo álbum" },
    { key: "high", label: "Gemelas", sub: "casi idénticas" },
]
function SimilaritySelector({ value, onChange }: { value: string; onChange: (k: string) => void }) {
    return (
        <div>
            <FieldLabel text="¿Qué tan similares a la original?" hint="Gemelas = mismo BPM, instrumentos y producción; solo cambia el ángulo y la energía. Primas = comparten el mundo pero exploran libre." />
            <Segmented value={value} onChange={onChange} options={SIM_OPTIONS} />
        </div>
    )
}

/* ═══════════ Convertir una pieza en álbum (genera N piezas más) ═══ */
function ExpandControl({ onGenerate, busy }: { onGenerate: (count: number, title: string, sim: string) => void; busy: boolean }) {
    const [open, setOpen] = useState(false)
    const [count, setCount] = useState(5)
    const [title, setTitle] = useState("")
    const [sim, setSim] = useState("medium")
    if (busy)
        return <div style={{ marginTop: 14, padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, background: "rgba(0,0,0,0.2)" }}><Spinner label="Creando el álbum a partir de esta pieza…" /></div>
    if (!open)
        return <button onClick={() => setOpen(true)} style={{ marginTop: 14, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GOLD, background: "rgba(245,197,66,0.08)", border: `1px solid rgba(245,197,66,0.35)`, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}>◈ Convertir en álbum</button>
    return (
        <div style={{ marginTop: 14, padding: 14, border: `1px solid rgba(245,197,66,0.35)`, borderRadius: 12, background: "rgba(0,0,0,0.22)" }}>
            <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 12, lineHeight: 1.5 }}>Genera piezas <strong style={{ color: INK }}>más</strong> con esta como base — ángulos distintos del mismo pulso. Quedan juntas como un álbum.</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                    <FieldLabel text="¿Cuántas más?" />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.25)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "6px 12px" }}>
                        <button onClick={() => setCount((n) => Math.max(1, n - 1))} style={stepBtn}>−</button>
                        <span style={{ fontFamily: MONO, fontSize: 18, color: INK, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{count}</span>
                        <button onClick={() => setCount((n) => Math.min(11, n + 1))} style={stepBtn}>+</button>
                    </div>
                    <div style={{ fontSize: 11, color: MUTE2, marginTop: 4 }}>álbum de {count + 1} en total</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                    <FieldLabel text="Título del álbum (opcional)" />
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Se usa el título de la pieza si lo dejas vacío" style={inputStyle()} />
                </div>
            </div>
            <div style={{ marginTop: 14 }}>
                <SimilaritySelector value={sim} onChange={setSim} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <PrimaryBtn tone="gold" onClick={() => onGenerate(count, title, sim)}>Generar {count} piezas más</PrimaryBtn>
                <button onClick={() => setOpen(false)} style={{ fontFamily: FONT, fontSize: 13, color: MUTE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>
            </div>
        </div>
    )
}

/* ═══════════ Tarjeta de un álbum del catálogo (selector) ═══ */
function AlbumPickerCard({ album, selected, expanded, selTracks, onToggleSelect, onToggleExpand, onToggleTrack, onToggleActive }: {
    album: Album; selected: boolean; expanded: boolean; selTracks: Set<string>; onToggleSelect: () => void; onToggleExpand: () => void; onToggleTrack: (id: string) => void; onToggleActive: (next: boolean) => void
}) {
    const dim = !album.active
    const trackSel = album.tracks.filter((t) => selTracks.has(t.id)).length
    return (
        <div style={{ border: `1px solid ${selected ? "rgba(0,229,255,0.55)" : LINE}`, borderRadius: 14, background: selected ? "linear-gradient(160deg, rgba(0,229,255,0.1), rgba(0,120,160,0.04))" : "rgba(0,0,0,0.2)", opacity: dim ? 0.5 : 1, overflow: "hidden", boxShadow: selected ? "0 0 18px rgba(0,229,255,0.2)" : "none", transition: "all .15s" }}>
            <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div onClick={dim ? undefined : onToggleSelect} style={{ flex: 1, minWidth: 0, cursor: dim ? "default" : "pointer" }}>
                        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>{album.name}</div>
                        <div style={{ fontFamily: FONT, fontSize: 11.5, color: CYAN, marginTop: 2 }}>{album.archetype}</div>
                        <div style={{ fontSize: 11, color: MUTE2, marginTop: 4, lineHeight: 1.4 }}>{album.genre} · {album.tracks.length} piezas</div>
                    </div>
                    <button onClick={() => onToggleActive(!album.active)} title={album.active ? "Desactivar" : "Reactivar"} style={{ width: 38, height: 21, borderRadius: 11, border: "none", background: album.active ? CYAN : "rgba(255,255,255,0.15)", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 2, left: album.active ? 19 : 2, width: 17, height: 17, borderRadius: "50%", background: "#06202f", transition: "left .15s" }} />
                    </button>
                </div>
                {!dim && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={onToggleSelect} style={{ flex: 1, fontFamily: FONT, fontSize: 12, fontWeight: 600, color: selected ? "#06202f" : CYAN, background: selected ? CYAN : "rgba(0,229,255,0.08)", border: `1px solid ${selected ? CYAN : "rgba(0,229,255,0.3)"}`, borderRadius: 9, padding: "7px 10px", cursor: "pointer" }}>{selected ? "✓ Álbum elegido" : "Elegir álbum"}</button>
                        <button onClick={onToggleExpand} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: MUTE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 9, padding: "7px 11px", cursor: "pointer", whiteSpace: "nowrap" }}>{expanded ? "▾ piezas" : `▸ piezas${trackSel ? ` (${trackSel})` : ""}`}</button>
                    </div>
                )}
            </div>
            {expanded && !dim && (
                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${LINE}` }}>
                    <div style={{ fontSize: 11, color: MUTE2, margin: "10px 0 8px", lineHeight: 1.4 }}>{album.vibe_tag}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {album.tracks.map((t) => <Chip key={t.id} label={t.title} on={selTracks.has(t.id)} onClick={() => onToggleTrack(t.id)} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

function DirectionCard({ d, chosen, onChoose }: { d: Direction; chosen: boolean; onChoose: () => void }) {
    return (
        <div onClick={onChoose} style={{ cursor: "pointer", border: `1px solid ${chosen ? CYAN : LINE}`, borderRadius: 14, background: chosen ? "linear-gradient(160deg, rgba(0,229,255,0.12), rgba(0,120,160,0.06))" : `linear-gradient(160deg, ${PANEL}, ${PANEL2})`, padding: 16, boxShadow: chosen ? "0 0 22px rgba(0,229,255,0.28)" : "none", transition: "all .15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT, fontSize: 15.5, fontWeight: 700, color: INK }}>{d.name}</span>
                {chosen && <span style={{ fontFamily: MONO, fontSize: 10, color: "#06202f", background: CYAN, borderRadius: 6, padding: "3px 7px", fontWeight: 700 }}>ELEGIDA</span>}
            </div>
            {d.essence && <div style={{ fontSize: 12.5, color: "rgba(210,238,250,0.8)", marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{d.essence}</div>}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                {d.genres && <MiniRow k="Géneros" v={d.genres} />}
                {d.instrumentation && <InstrumentChips text={d.instrumentation} />}
                {d.mood && <MiniRow k="Mood" v={d.mood} />}
            </div>
            {d.why && <div style={{ fontSize: 11.5, color: GOLD, marginTop: 10, lineHeight: 1.45 }}>✦ {d.why}</div>}
        </div>
    )
}
function DirectionSummary({ d }: { d: Direction }) {
    return (
        <div style={{ border: `1px solid rgba(0,229,255,0.3)`, borderRadius: 12, background: "rgba(0,0,0,0.25)", padding: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: CYAN, letterSpacing: "0.06em", marginBottom: 8 }}>DIRECCIÓN AFINADA · {d.name}</div>
            {d.essence && <div style={{ fontSize: 12.5, color: INK, fontStyle: "italic", marginBottom: 8 }}>{d.essence}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {d.genres && <MiniRow k="Géneros" v={d.genres} />}
                {d.instrumentation && <InstrumentChips text={d.instrumentation} />}
                {d.mood && <MiniRow k="Mood" v={d.mood} />}
                {d.tempo_feel && <MiniRow k="Tempo" v={d.tempo_feel} />}
                {d.production && <MiniRow k="Producción" v={d.production} />}
                {d.notes && <MiniRow k="Notas" v={d.notes} />}
            </div>
        </div>
    )
}
function WaveGlyph() {
    return (
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="23" cy="23" r="21" stroke={CYAN} strokeOpacity="0.35" strokeWidth="1" />
            {[10, 16, 22, 28, 34].map((x, i) => {
                const h = [10, 20, 30, 18, 12][i]
                return <rect key={x} x={x} y={23 - h / 2} width="3" height={h} rx="1.5" fill={i % 2 ? GOLD : CYAN} opacity={0.85} style={{ animation: `fsPulse ${1.4 + i * 0.25}s ease-in-out infinite` }} />
            })}
        </svg>
    )
}

/* ═══════════════════════════════════════════════ PANEL PRINCIPAL ═══ */
export default function FrecuenciasSonoras(props: Props) {
    const supabaseUrl = props?.supabaseUrl || ""
    const supabaseAnonKey = props?.supabaseAnonKey || ""
    const isMobile = !!props?.isMobile

    const [view, setView] = useState<"crear" | "complementar" | "biblioteca">("crear")
    const [catalog, setCatalog] = useState<Album[]>([])
    const [creations, setCreations] = useState<Creation[]>([])
    const [loadingCatalog, setLoadingCatalog] = useState(true)
    const [howto, setHowto] = useState(false)
    const [err, setErr] = useState("")
    const [creationsErr, setCreationsErr] = useState("") // motivo si la Biblioteca no lee
    const [catalogErr, setCatalogErr] = useState("") // motivo si el catálogo no lee
    const [directMode, setDirectMode] = useState(false) // crear sin proponer direcciones
    const [dragOver, setDragOver] = useState(false) // resalte al arrastrar imagen
    const [autoMsg, setAutoMsg] = useState("") // feedback del botón ✦ AUTO
    const [prodFilter, setProdFilter] = useState<"all" | "prod" | "pend">("all")
    const [coverBusyId, setCoverBusyId] = useState<string | null>(null)

    const [scale, setScale] = useState<"single" | "album">("single")
    const [albumCount, setAlbumCount] = useState(6)
    const [albumTitle, setAlbumTitle] = useState("")

    const [selAlbums, setSelAlbums] = useState<Set<string>>(new Set())
    const [selTracks, setSelTracks] = useState<Set<string>>(new Set())
    const [selCreations, setSelCreations] = useState<Set<string>>(new Set())
    const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null)

    const [instrumental, setInstrumental] = useState(false)
    const [lyricsLang, setLyricsLang] = useState("es")
    const [seedText, setSeedText] = useState("")
    const [reference, setReference] = useState("")
    const [imageVibe, setImageVibe] = useState("")
    const [imageBusy, setImageBusy] = useState(false)
    const [inspiration, setInspiration] = useState("med")

    const [directions, setDirections] = useState<Direction[]>([])
    const [chosen, setChosen] = useState<Direction | null>(null)
    const [loadingDirs, setLoadingDirs] = useState(false)
    const [knobs, setKnobs] = useState<Knobs>(DEFAULT_KNOBS)
    const [refined, setRefined] = useState<Direction | null>(null)
    const [loadingRefine, setLoadingRefine] = useState(false)

    const [finalC, setFinalC] = useState<Creation | null>(null)
    const [albumRes, setAlbumRes] = useState<any>(null)
    const [loadingFinal, setLoadingFinal] = useState(false)
    const [regenId, setRegenId] = useState<string | null>(null)
    const [expandBusyId, setExpandBusyId] = useState<string | null>(null)

    // Complementar (álbum desde un prompt ya hecho)
    const [seedPrompt, setSeedPrompt] = useState("")
    const [seedExcludes, setSeedExcludes] = useState("")
    const [seedW, setSeedW] = useState(40)
    const [seedSI, setSeedSI] = useState(75)
    const [seedAnchorTitle, setSeedAnchorTitle] = useState("")
    const [seedAlbumTitle, setSeedAlbumTitle] = useState("")
    const [seedLink, setSeedLink] = useState("")
    const [seedCount, setSeedCount] = useState(5)
    const [seedInstrumental, setSeedInstrumental] = useState(true)
    const [seedLang, setSeedLang] = useState("es")
    const [seedSim, setSeedSim] = useState("medium")
    const [seedBusy, setSeedBusy] = useState(false)

    // Biblioteca
    const [gallerySort, setGallerySort] = useState<"recent" | "albums">("recent")
    const [selectMode, setSelectMode] = useState(false)
    const [selectedForAlbum, setSelectedForAlbum] = useState<Set<string>>(new Set())
    const [groupTitle, setGroupTitle] = useState("")
    const [grouping, setGrouping] = useState(false)
    const [expandedGal, setExpandedGal] = useState<string | null>(null)

    const fileRef = useRef<HTMLInputElement | null>(null)
    const abortRef = useRef<AbortController | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const dirsRef = useRef<HTMLDivElement | null>(null)
    const resultRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        ensureCss()
    }, [])
    useEffect(() => {
        if (directions.length && dirsRef.current) dirsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [directions])
    useEffect(() => {
        if ((finalC || albumRes) && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [finalC, albumRes])

    const loadCatalog = useCallback(async () => {
        setLoadingCatalog(true)
        const r = await rpc(supabaseUrl, supabaseAnonKey, "get_suno_catalog_admin")
        try {
            console.log("[FS] get_suno_catalog_admin →", r)
        } catch {}
        if (r && (r as any).error) setCatalogErr(String((r as any).error))
        else {
            setCatalogErr("")
            setCatalog((r?.albums || []) as Album[])
        }
        setLoadingCatalog(false)
    }, [supabaseUrl, supabaseAnonKey])
    const loadCreations = useCallback(async () => {
        const r = await rpc(supabaseUrl, supabaseAnonKey, "get_suno_creations_admin", { p_limit: 120 })
        try {
            console.log("[FS] get_suno_creations_admin →", r)
        } catch {}
        if (r && (r as any).error) {
            setCreationsErr(String((r as any).error))
            return
        }
        setCreationsErr("")
        setCreations((r?.creations || []) as Creation[])
    }, [supabaseUrl, supabaseAnonKey])
    useEffect(() => {
        loadCatalog()
        loadCreations()
    }, [loadCatalog, loadCreations])
    // Autocura: si una lectura falló (p. ej. el panel montó antes que la sesión),
    // reintenta sola al volver a la vista y una vez más a los 5s.
    useEffect(() => {
        if (view === "biblioteca" && creationsErr) loadCreations()
        if (view === "crear" && catalogErr) loadCatalog()
    }, [view]) // eslint-disable-line react-hooks/exhaustive-deps
    const autoRetriesRef = useRef(0)
    useEffect(() => {
        if (!creationsErr && !catalogErr) {
            autoRetriesRef.current = 0
            return
        }
        if (autoRetriesRef.current >= 3) return // después queda el botón Reintentar
        const t = setTimeout(() => {
            autoRetriesRef.current += 1
            if (creationsErr) loadCreations()
            if (catalogErr) loadCatalog()
        }, 5000)
        return () => clearTimeout(t)
    }, [creationsErr, catalogErr]) // eslint-disable-line react-hooks/exhaustive-deps

    const albumName = (id: string) => catalog.find((a) => a.id === id)?.name || id
    const trackName = (id: string) => {
        for (const a of catalog) {
            const t = a.tracks.find((x) => x.id === id)
            if (t) return `${a.name} · ${t.title}`
        }
        return "pieza"
    }
    const creationName = (id: string) => creations.find((c) => c.id === id)?.title || "creación"

    const seedPayload = () => ({ text: seedText, reference, image_vibe: imageVibe, inspiration, instrumental, album_ids: [...selAlbums], track_ids: [...selTracks], creation_ids: [...selCreations] })
    const toggleSet = (setter: (fn: (s: Set<string>) => Set<string>) => void, id: string) => setter((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
    const resetOutputs = () => { setDirections([]); setChosen(null); setRefined(null); setFinalC(null); setAlbumRes(null) }

    const onPickImage = async (file: File) => {
        setErr("")
        setImageBusy(true)
        try {
            const dataUrl = await resizeImageToDataUrl(file)
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "describe_image", image_base64: dataUrl })
            if (ok && body?.image_vibe) setImageVibe(body.image_vibe)
            else setErr(body?.detail || body?.error || "No se pudo leer la imagen.")
        } catch (e: any) {
            setErr(e?.message || "No se pudo procesar la imagen.")
        } finally {
            setImageBusy(false)
        }
    }

    const genDirections = async () => {
        setErr("")
        setLoadingDirs(true)
        resetOutputs()
        abortRef.current?.abort()
        abortRef.current = new AbortController()
        try {
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "directions", seed: seedPayload() }, abortRef.current.signal)
            if (ok && body?.directions?.length) setDirections(body.directions)
            else setErr(body?.detail || body?.error || "No se pudieron generar direcciones. Reintenta.")
        } catch (e: any) {
            if (e?.name !== "AbortError") setErr("Error de red. Reintenta.")
        } finally {
            setLoadingDirs(false)
        }
    }
    const doRefine = async () => {
        if (!chosen) return
        setErr("")
        setLoadingRefine(true)
        try {
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "refine", seed: seedPayload(), direction: chosen, knobs })
            if (ok && body?.direction) setRefined(body.direction)
            else setErr(body?.detail || body?.error || "No se pudo afinar. Reintenta.")
        } catch {
            setErr("Error de red. Reintenta.")
        } finally {
            setLoadingRefine(false)
        }
    }
    const doGenerate = async () => {
        // En modo directo no hace falta dirección: el edge genera desde la semilla.
        const dir = directMode ? null : refined || chosen
        if (!directMode && !dir) return
        setErr("")
        setLoadingFinal(true)
        setFinalC(null)
        setAlbumRes(null)
        try {
            if (scale === "album") {
                const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "album", seed: seedPayload(), direction: dir, knobs, instrumental, lyrics_lang: lyricsLang, count: albumCount, album_title: albumTitle.trim() || "Álbum Solar" })
                if (ok && body?.album) { setAlbumRes(body.album); loadCreations() }
                else setErr(body?.detail || body?.error || "No se pudo generar el álbum. Reintenta.")
            } else {
                const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "finalize", seed: seedPayload(), direction: dir, knobs, instrumental, lyrics_lang: lyricsLang })
                if (ok && body?.creation) { setFinalC(body.creation); loadCreations() }
                else setErr(body?.detail || body?.error || "No se pudo generar el prompt. Reintenta.")
            }
        } catch {
            setErr("Error de red. Reintenta.")
        } finally {
            setLoadingFinal(false)
        }
    }

    const regenLyrics = async (creationId: string, applyTo: "final" | "album" | null, note?: string) => {
        setRegenId(creationId)
        try {
            const payload: Record<string, any> = { mode: "lyrics", creation_id: creationId }
            if (applyTo === "final" || applyTo === "album") payload.lyrics_lang = lyricsLang
            if (note && note.trim()) payload.refine_note = note.trim()
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, payload)
            if (ok && typeof body?.lyrics === "string") {
                const patch = (c: any) => (c.id === creationId ? { ...c, lyrics: body.lyrics, instrumental: false } : c)
                if (applyTo === "final" && finalC?.id === creationId) setFinalC({ ...finalC, lyrics: body.lyrics, instrumental: false })
                if (applyTo === "album" && albumRes) setAlbumRes({ ...albumRes, tracks: albumRes.tracks.map(patch) })
                setCreations((prev) => prev.map(patch))
            } else setErr(body?.detail || body?.error || "No se pudo regenerar la letra.")
        } catch {
            setErr("Error de red al regenerar la letra.")
        } finally {
            setRegenId(null)
        }
    }

    // Marca/desmarca una pieza como PRODUCIDA en Suno (optimista + persistencia).
    const setProduced = async (creationId: string, next: boolean, url: string) => {
        const patch = (c: any) =>
            c && c.id === creationId ? { ...c, produced_at: next ? new Date().toISOString() : null, produced_url: next ? url : "" } : c
        setCreations((prev) => prev.map(patch))
        setFinalC((f: any) => (f && f.id === creationId ? patch(f) : f))
        setAlbumRes((a: any) => (a ? { ...a, tracks: (a.tracks || []).map(patch) } : a))
        const r = await rpc(supabaseUrl, supabaseAnonKey, "set_suno_produced_admin", { p_id: creationId, p_produced: next, p_url: url })
        if (r && (r as any).error) setErr(`No se pudo guardar "producida": ${(r as any).error}`)
    }

    // Genera (o regenera) el prompt de PORTADA de un álbum.
    const genCover = async (setId: string) => {
        if (!setId) return
        setErr("")
        setCoverBusyId(setId)
        try {
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "album_cover", set_id: setId })
            if (ok && body?.cover_prompt) {
                setCreations((prev) => prev.map((c) => (c.set_id === setId ? { ...c, set_cover_prompt: body.cover_prompt } : c)))
                setAlbumRes((a: any) => (a && a.set_id === setId ? { ...a, cover_prompt: body.cover_prompt } : a))
            } else setErr(body?.detail || body?.error || "No se pudo generar la portada.")
        } catch {
            setErr("Error de red al generar la portada.")
        } finally {
            setCoverBusyId(null)
        }
    }

    // Construye un álbum alrededor de un prompt de Suno ya hecho (pestaña Complementar).
    const createSeedAlbum = async () => {
        if (!seedPrompt.trim()) return
        setErr("")
        setSeedBusy(true)
        try {
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, {
                mode: "seed_album",
                style_prompt: seedPrompt.trim(),
                excludes: parseExcludes(seedExcludes),
                weirdness: seedW,
                style_influence: seedSI,
                anchor_title: seedAnchorTitle.trim() || "Pieza original",
                album_title: seedAlbumTitle.trim() || seedAnchorTitle.trim() || "Álbum Solar",
                count: seedCount,
                instrumental: seedInstrumental,
                lyrics_lang: seedLang,
                similarity: seedSim,
                produced_url: seedLink.trim(),
            })
            if (ok && body?.album) {
                await loadCreations()
                setView("biblioteca")
                setExpandedGal(body.album.set_id)
            } else setErr(body?.detail || body?.error || "No se pudo crear el álbum complementario.")
        } catch {
            setErr("Error de red al crear el álbum.")
        } finally {
            setSeedBusy(false)
        }
    }

    const expandToAlbum = async (id: string, count: number, title: string, origin: "crear" | "biblio", sim = "medium") => {
        setErr("")
        setExpandBusyId(id)
        try {
            const { ok, body } = await callEdge(supabaseUrl, supabaseAnonKey, { mode: "expand_album", creation_id: id, count, album_title: title, similarity: sim })
            if (ok && body?.album) {
                loadCreations()
                if (origin === "crear") { setAlbumRes(body.album); setFinalC(null) }
                else { setView("biblioteca"); setExpandedGal(body.album.set_id) }
            } else setErr(body?.detail || body?.error || "No se pudo convertir en álbum.")
        } catch {
            setErr("Error de red al convertir en álbum.")
        } finally {
            setExpandBusyId(null)
        }
    }

    const groupSelected = async () => {
        const ids = [...selectedForAlbum]
        if (ids.length < 2) return
        setGrouping(true)
        const r = await rpc(supabaseUrl, supabaseAnonKey, "group_suno_creations_into_album", { p_creation_ids: ids, p_title: groupTitle.trim() || "Álbum" })
        setGrouping(false)
        if (r?.ok) {
            setSelectMode(false)
            setSelectedForAlbum(new Set())
            setGroupTitle("")
            await loadCreations()
            if (r.set_id) setExpandedGal(r.set_id)
        } else setErr("No se pudo agrupar las piezas.")
    }
    const renameSet = async (setId: string, title: string) => {
        setCreations((prev) => prev.map((c) => (c.set_id === setId ? { ...c, set_title: title } : c)))
        await rpc(supabaseUrl, supabaseAnonKey, "rename_suno_set_admin", { p_set_id: setId, p_title: title })
    }
    const ungroup = async (id: string) => {
        await rpc(supabaseUrl, supabaseAnonKey, "ungroup_suno_creation_admin", { p_id: id })
        loadCreations()
    }
    const deleteCreation = async (id: string) => {
        setCreations((prev) => prev.filter((c) => c.id !== id))
        await rpc(supabaseUrl, supabaseAnonKey, "delete_suno_creation_admin", { p_id: id })
    }
    const deleteSet = async (setId: string) => {
        setCreations((prev) => prev.filter((c) => c.set_id !== setId))
        await rpc(supabaseUrl, supabaseAnonKey, "delete_suno_set_admin", { p_set_id: setId })
    }
    const toggleAlbumActive = async (id: string, next: boolean) => {
        setCatalog((prev) => prev.map((a) => (a.id === id ? { ...a, active: next } : a)))
        if (!next) setSelAlbums((s) => { const n = new Set(s); n.delete(id); return n })
        await rpc(supabaseUrl, supabaseAnonKey, "set_suno_album_active_admin", { p_album_id: id, p_active: next })
    }

    const norteCount = selAlbums.size + selTracks.size + selCreations.size
    const hasComposicion = norteCount > 0 || !!reference.trim() || !!imageVibe || !!seedText.trim() || !!chosen

    // Galería agrupada por álbum + piezas sueltas, ordenada + filtro de producidas.
    const galleryItems: any[] = (() => {
        const seenSet = new Set<string>()
        const items: any[] = []
        for (const c of creations) {
            if (c.set_id) {
                if (seenSet.has(c.set_id)) continue
                seenSet.add(c.set_id)
                const tracks = creations.filter((x) => x.set_id === c.set_id).sort((a, b) => (a.track_no || 0) - (b.track_no || 0))
                items.push({ type: "album", set_id: c.set_id, set_title: c.set_title || "Álbum", tracks, at: c.generated_at })
            } else {
                items.push({ type: "single", creation: c, at: c.generated_at })
            }
        }
        const filtered = items.filter((it) => {
            if (prodFilter === "all") return true
            if (it.type === "single") return prodFilter === "prod" ? !!it.creation.produced_at : !it.creation.produced_at
            const done = it.tracks.filter((t: Creation) => t.produced_at).length
            return prodFilter === "prod" ? done === it.tracks.length && done > 0 : done < it.tracks.length
        })
        if (gallerySort === "albums") filtered.sort((a, b) => (a.type === "album" ? 0 : 1) - (b.type === "album" ? 0 : 1))
        return filtered
    })()

    /* ─────────────────────────── RENDER ─────────────────────────── */
    return (
        <div ref={scrollRef} className="fs-scroll" style={{ height: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "radial-gradient(1200px 700px at 50% -10%, rgba(0,120,160,0.16), transparent 60%), radial-gradient(900px 600px at 80% 110%, rgba(0,90,140,0.12), transparent 55%), #030c15", padding: "40px 22px 120px", fontFamily: FONT, color: INK }}>
            <div style={{ maxWidth: 1080, margin: "0 auto" }}>
                {/* HEADER */}
                <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                    <WaveGlyph />
                    <div>
                        <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 30, fontWeight: 800, letterSpacing: "0.02em", background: `linear-gradient(90deg, ${CYAN}, ${GOLD})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Frecuencias Sonoras</h1>
                        <div style={{ fontSize: 13.5, color: MUTE, marginTop: 3 }}>Generador de prompts para Suno con el ADN musical de Red Solar Viva</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
                    <button onClick={() => setHowto((v) => !v)} style={{ fontFamily: FONT, fontSize: 12.5, color: CYAN, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer" }}>{howto ? "▾ Ocultar guía" : "▸ ¿Cómo funciona?"}</button>
                    <span style={{ fontSize: 11.5, color: MUTE2 }}>Cada creación cuesta unos centavos · cerebro DeepSeek vía OpenRouter · sin Gemini</span>
                </div>

                {howto && (
                    <HoloCard style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: MUTE }}>
                            <p style={{ marginTop: 0 }}>Eliges si creas <strong style={{ color: CYAN }}>una pieza</strong> o un <strong style={{ color: CYAN }}>álbum</strong>. Marcas de qué <strong style={{ color: CYAN }}>álbumes o canciones</strong> te inspiras, si va con voz, y das un toque personal opcional. El panel te propone <strong style={{ color: CYAN }}>direcciones</strong> (basadas en lo que elegiste; varían un poco cada vez para darte opciones frescas), las afinas, y sale el prompt listo para Suno.</p>
                            <p style={{ marginBottom: 0 }}>Todo se guarda en la <strong style={{ color: GOLD }}>Biblioteca</strong>. Ahí puedes convertir una pieza en álbum, o juntar varias piezas sueltas en un álbum. Los dos porcentajes de Suno te los recomienda el panel (1º Weirdness, 2º Style Influence).</p>
                        </div>
                    </HoloCard>
                )}

                {/* TABS Crear / Complementar / Biblioteca */}
                <div style={{ display: "flex", gap: 8, marginBottom: 22, background: "rgba(0,0,0,0.25)", borderRadius: 14, padding: 5, border: `1px solid ${LINE}`, maxWidth: 540 }}>
                    {[{ key: "crear", label: "✦ Crear" }, { key: "complementar", label: "⊕ Complementar" }, { key: "biblioteca", label: `⬡ Biblioteca${creations.length ? ` · ${creations.length}` : ""}` }].map((t) => {
                        const on = view === t.key
                        return <button key={t.key} onClick={() => setView(t.key as any)} style={{ flex: 1, fontFamily: FONT, fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? "#06202f" : MUTE, background: on ? `linear-gradient(180deg, ${CYAN}, ${CYAN_DK})` : "transparent", border: "none", borderRadius: 10, padding: "10px 8px", cursor: "pointer", boxShadow: on ? "0 0 14px rgba(0,229,255,0.35)" : "none", whiteSpace: "nowrap" }}>{t.label}</button>
                    })}
                </div>

                {err && <div style={{ background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.35)", color: "#ffb4b4", borderRadius: 12, padding: "12px 16px", fontSize: 13, marginBottom: 18 }}>{err}</div>}

                {/* ══════════════════════════ CREAR ══════════════════════════ */}
                {view === "crear" && (
                    <>
                        {hasComposicion && (
                            <HoloCard glow style={{ marginBottom: 22, borderColor: "rgba(0,229,255,0.4)" }}>
                                <div style={{ fontFamily: MONO, fontSize: 11, color: CYAN, letterSpacing: "0.08em", marginBottom: 10 }}>TU COMPOSICIÓN</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                    <span style={{ fontSize: 12, color: MUTE, padding: "6px 10px", background: "rgba(0,0,0,0.25)", borderRadius: 8 }}>{scale === "album" ? `◈ Álbum de ${albumCount} piezas` : "◈ 1 pieza"} · {instrumental ? "instrumental" : `con voz (${langLabel(lyricsLang)})`}</span>
                                    {[...selAlbums].map((id) => <Chip key={id} label={albumName(id)} on removable onClick={() => toggleSet(setSelAlbums, id)} />)}
                                    {[...selTracks].map((id) => <Chip key={id} label={trackName(id)} on removable onClick={() => toggleSet(setSelTracks, id)} />)}
                                    {[...selCreations].map((id) => <Chip key={id} label={"↻ " + creationName(id)} on removable onClick={() => toggleSet(setSelCreations, id)} />)}
                                    {reference.trim() && <Chip label={`tipo: ${reference.trim().slice(0, 24)}`} on removable onClick={() => setReference("")} />}
                                    {imageVibe && <Chip label="imagen ✓" on removable onClick={() => setImageVibe("")} />}
                                    {chosen && <Chip label={`dirección: ${chosen.name}`} on removable onClick={() => { setChosen(null); setRefined(null); setFinalC(null); setAlbumRes(null) }} />}
                                </div>
                            </HoloCard>
                        )}

                        {/* PASO 1 — ¿QUÉ CREAS? */}
                        <HoloCard style={{ marginBottom: 18 }}>
                            <StepLabel n="1" title="¿Qué creas?" hint="Una sola pieza, o un álbum donde cada pieza es un ángulo distinto del mismo pulso." />
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {[{ key: "single", label: "1 pieza", desc: "Una canción" }, { key: "album", label: "Álbum", desc: "Varias piezas, mismo pulso" }].map((o) => {
                                    const on = scale === o.key
                                    return <button key={o.key} onClick={() => { setScale(o.key as any); resetOutputs() }} style={{ flex: "1 1 200px", textAlign: "left", border: `1px solid ${on ? CYAN : LINE}`, borderRadius: 14, background: on ? "linear-gradient(160deg, rgba(0,229,255,0.12), rgba(0,120,160,0.05))" : "rgba(0,0,0,0.2)", padding: 16, cursor: "pointer", boxShadow: on ? "0 0 18px rgba(0,229,255,0.24)" : "none", transition: "all .15s" }}>
                                        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: on ? INK : MUTE }}>{o.label}</div>
                                        <div style={{ fontSize: 12, color: MUTE2, marginTop: 3 }}>{o.desc}</div>
                                    </button>
                                })}
                            </div>
                            {scale === "album" && (
                                <div style={{ marginTop: 16, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
                                    <div>
                                        <FieldLabel text="¿Cuántas piezas?" />
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.25)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "6px 12px" }}>
                                            <button onClick={() => setAlbumCount((n) => Math.max(3, n - 1))} style={stepBtn}>−</button>
                                            <span style={{ fontFamily: MONO, fontSize: 20, color: INK, fontWeight: 700, minWidth: 28, textAlign: "center" }}>{albumCount}</span>
                                            <button onClick={() => setAlbumCount((n) => Math.min(12, n + 1))} style={stepBtn}>+</button>
                                        </div>
                                    </div>
                                    <div style={{ flex: "1 1 240px" }}>
                                        <FieldLabel text="Título del álbum" />
                                        <input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="Ej. Amanecer Interior" style={inputStyle()} />
                                    </div>
                                </div>
                            )}
                        </HoloCard>

                        {/* PASO 2 — INSPIRACIÓN */}
                        <HoloCard style={{ marginBottom: 18 }}>
                            <StepLabel n="2" title={`Inspiración${norteCount ? ` · ${norteCount} elegidos` : ""}`} hint="Toca un álbum para inspirarte en él entero, o abre sus piezas para elegir canciones exactas. Puedes combinar varios." />
                            {loadingCatalog ? (
                                <div style={{ padding: 20 }}><Spinner label="Cargando tus álbumes…" /></div>
                            ) : catalogErr ? (
                                <div style={{ background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.35)", color: "#ffd0d0", borderRadius: 12, padding: "13px 15px", fontSize: 13, lineHeight: 1.6 }}>
                                    <strong style={{ color: "#ffb4b4" }}>No pude leer tus álbumes del Norte.</strong> Motivo: <span style={{ fontFamily: MONO, fontSize: 12 }}>{catalogErr}</span>
                                    <div style={{ marginTop: 10 }}>
                                        <button onClick={loadCatalog} style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: CYAN, background: "rgba(0,229,255,0.08)", border: `1px solid rgba(0,229,255,0.35)`, borderRadius: 9, padding: "8px 14px", cursor: "pointer" }}>↻ Reintentar</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                                    {catalog.map((al) => <AlbumPickerCard key={al.id} album={al} selected={selAlbums.has(al.id)} expanded={expandedAlbum === al.id} selTracks={selTracks} onToggleSelect={() => toggleSet(setSelAlbums, al.id)} onToggleExpand={() => setExpandedAlbum((e) => (e === al.id ? null : al.id))} onToggleTrack={(tid) => toggleSet(setSelTracks, tid)} onToggleActive={(next) => toggleAlbumActive(al.id, next)} />)}
                                </div>
                            )}
                            {creations.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <FieldLabel text="…o fusiona con creaciones que ya hiciste (opcional)" />
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {creations.filter((c) => !c.set_id || c.track_no === 1).slice(0, 14).map((c) => <Chip key={c.id} label={c.set_id ? c.set_title || c.title : c.title} on={selCreations.has(c.id)} onClick={() => toggleSet(setSelCreations, c.id)} />)}
                                    </div>
                                </div>
                            )}
                        </HoloCard>

                        {/* PASO 3 + 5 */}
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18, marginBottom: 18 }}>
                            <HoloCard>
                                <StepLabel n="3" title="Cómo suena" />
                                <div style={{ display: "flex", gap: 10, marginBottom: instrumental ? 0 : 14 }}>
                                    {[{ key: "voz", label: "Con voz" }, { key: "inst", label: "Instrumental" }].map((o) => {
                                        const on = (o.key === "inst") === instrumental
                                        return <button key={o.key} onClick={() => setInstrumental(o.key === "inst")} style={{ flex: 1, fontFamily: FONT, fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? "#06202f" : MUTE, background: on ? `linear-gradient(180deg, ${CYAN}, ${CYAN_DK})` : "rgba(0,0,0,0.2)", border: `1px solid ${on ? CYAN : LINE}`, borderRadius: 11, padding: "12px", cursor: "pointer", boxShadow: on ? "0 0 14px rgba(0,229,255,0.35)" : "none" }}>{o.label}</button>
                                    })}
                                </div>
                                {!instrumental && (
                                    <div>
                                        <FieldLabel text="Idioma de la letra" />
                                        <Segmented value={lyricsLang} onChange={setLyricsLang} options={[{ key: "es", label: "Español" }, { key: "en", label: "Inglés" }, { key: "luminico", label: "Lumínico" }, { key: "mantra", label: "Mantra" }]} />
                                    </div>
                                )}
                            </HoloCard>
                            <HoloCard style={{ opacity: norteCount ? 1 : 0.55 }}>
                                <StepLabel n="5" title="Cuánto pesa tu inspiración" hint="Cuánto se ciñe a lo que elegiste en Inspiración (afecta el Style Influence)." />
                                {norteCount ? (
                                    <Segmented value={inspiration} onChange={setInspiration} options={[{ key: "low", label: "Poco", sub: "libre" }, { key: "med", label: "Medio", sub: "equilibrio" }, { key: "high", label: "Mucho", sub: "fiel" }]} />
                                ) : (
                                    <div style={{ fontSize: 12, color: MUTE2, padding: "10px 2px", lineHeight: 1.5 }}>Se activa cuando eliges un álbum o una pieza en <strong style={{ color: CYAN }}>Inspiración (Paso 2)</strong>. Sin nada elegido, el panel parte del ADN puro de Red Solar Viva.</div>
                                )}
                            </HoloCard>
                        </div>

                        {/* PASO 4 — TOQUE PERSONAL */}
                        <HoloCard style={{ marginBottom: 18 }}>
                            <StepLabel n="4" title="Toque personal" hint="Todo opcional." />
                            <FieldLabel text="Texto libre" />
                            <textarea value={seedText} onChange={(e) => setSeedText(e.target.value)} placeholder="Ej. una meditación al amanecer que se eleva desde el agua hacia el sol interior…" style={inputStyle(true)} />
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
                                <div style={{ flex: "1 1 300px" }}>
                                    <FieldLabel text="Referencia de estilo (opcional)" hint="Un artista o canción que te inspire; el panel describe ese estilo sin nombrarlo." />
                                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej. tipo Brian Eno + coros de Lisa Gerrard" style={inputStyle()} />
                                </div>
                                <div style={{ flex: "1 1 240px" }}>
                                    <FieldLabel text="Imagen (opcional)" hint="Sube una imagen y el panel la traduce a un vibe sonoro." />
                                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickImage(f); e.currentTarget.value = "" }} />
                                    {imageVibe ? (
                                        <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${LINE}`, borderRadius: 10, padding: 11 }}>
                                            <div style={{ fontSize: 12, color: INK, lineHeight: 1.45, fontStyle: "italic" }}>{imageVibe}</div>
                                            <button onClick={() => setImageVibe("")} style={{ marginTop: 8, fontFamily: FONT, fontSize: 11.5, color: MUTE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>Quitar</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            disabled={imageBusy}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                            onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
                                            onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                setDragOver(false)
                                                const f = e.dataTransfer?.files?.[0]
                                                if (f && f.type.startsWith("image/")) onPickImage(f)
                                            }}
                                            style={{ width: "100%", fontFamily: FONT, fontSize: 13, color: dragOver ? GOLD : CYAN, background: dragOver ? "rgba(245,197,66,0.1)" : "rgba(0,229,255,0.06)", border: `1px dashed ${dragOver ? "rgba(245,197,66,0.6)" : "rgba(0,229,255,0.4)"}`, borderRadius: 10, padding: "18px 13px", cursor: imageBusy ? "wait" : "pointer", transition: "all .12s" }}
                                        >
                                            {imageBusy ? <Spinner label="Leyendo imagen…" /> : dragOver ? "Suelta la imagen aquí" : "⬆ Arrastra una imagen o toca para subir"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </HoloCard>

                        {/* MODO + BOTÓN */}
                        <div style={{ marginBottom: 26 }}>
                            <div style={{ marginBottom: 12, maxWidth: 360 }}>
                                <Segmented value={directMode ? "directo" : "guiado"} onChange={(k) => {
                                    const dm = k === "directo"
                                    setDirectMode(dm)
                                    // En Directo no hay dirección: escóndelas y suelta la elegida
                                    // (si no, quedaba marcada y confundía con la generación directa).
                                    if (dm) { setDirections([]); setChosen(null); setRefined(null) }
                                }} options={[{ key: "guiado", label: "Con direcciones" }, { key: "directo", label: "Directo" }]} />
                            </div>
                            {directMode ? (
                                <>
                                    <PrimaryBtn tone="gold" onClick={doGenerate} disabled={loadingFinal}>{loadingFinal ? <Spinner label={scale === "album" ? "Componiendo álbum…" : "Componiendo…"} /> : scale === "album" ? `◈ Generar álbum de ${albumCount} directo` : "◈ Generar directo"}</PrimaryBtn>
                                    <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 8 }}>Salta las direcciones: crea el prompt directo desde tu composición (imagen, texto, álbumes…).</div>
                                </>
                            ) : (
                                <>
                                    <PrimaryBtn onClick={genDirections} disabled={loadingDirs}>{loadingDirs ? <Spinner label="Buscando direcciones…" /> : "✦ Proponer direcciones"}</PrimaryBtn>
                                    <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 8 }}>Se basan en tu composición; cada vez varían un poco para darte opciones frescas.</div>
                                </>
                            )}
                        </div>

                        {/* DIRECCIONES */}
                        {directions.length > 0 && (
                            <div ref={dirsRef} style={{ marginBottom: 22, scrollMarginTop: 16 }}>
                                <StepLabel n="✧" title="Elige una dirección" hint="Toca la que resuene. Puedes volver a proponer si ninguna convence." />
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                                    {directions.map((d, i) => <DirectionCard key={d.key || i} d={d} chosen={chosen?.name === d.name} onChoose={() => { setChosen(d); setRefined(null); setFinalC(null); setAlbumRes(null) }} />)}
                                </div>
                            </div>
                        )}

                        {/* AFINAR + GENERAR */}
                        {chosen && (
                            <HoloCard glow style={{ marginBottom: 22 }}>
                                <StepLabel n="✧" title="Afina y genera" hint={`Dirección: "${chosen.name}". Cada perilla va de un extremo al otro (el centro es equilibrio). Pasa el cursor por Minimal, Denso… para ver qué hace cada una. Todo opcional.`} />
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                                    <button
                                        onClick={() => {
                                            const a = autoKnobsFor(refined || chosen)
                                            setKnobs(a.knobs)
                                            setAutoMsg(`✓ perillas afinadas para ${a.label}`)
                                            setTimeout(() => setAutoMsg(""), 2800)
                                        }}
                                        style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: GOLD, background: "rgba(245,197,66,0.1)", border: "1px solid rgba(245,197,66,0.45)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", boxShadow: "0 0 12px rgba(245,197,66,0.15)" }}
                                    >
                                        ✦ AUTO recomendado
                                    </button>
                                    {autoMsg ? (
                                        <span style={{ fontSize: 12, color: GOLD }}>{autoMsg}</span>
                                    ) : (
                                        <span style={{ fontSize: 11.5, color: MUTE2 }}>Pone todas las perillas en el punto recomendado para esta dirección.</span>
                                    )}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 26px" }}>
                                    <KnobSlider lo="Íntimo" hi="Épico" value={knobs.epicidad} onChange={(v) => setKnobs({ ...knobs, epicidad: v })} />
                                    <KnobSlider lo="Etéreo" hi="Terrenal" value={knobs.terrenalidad} onChange={(v) => setKnobs({ ...knobs, terrenalidad: v })} />
                                    <KnobSlider lo="Meditativo" hi="Rítmico" value={knobs.ritmo} onChange={(v) => setKnobs({ ...knobs, ritmo: v })} />
                                    <KnobSlider lo="Minimal" hi="Denso" value={knobs.densidad} onChange={(v) => setKnobs({ ...knobs, densidad: v })} />
                                    <KnobSlider lo="Frecuencial" hi="Melódico" value={knobs.estructura} onChange={(v) => setKnobs({ ...knobs, estructura: v })} />
                                    <KnobSlider lo="Cristalino" hi="Análogo" value={knobs.produccion} onChange={(v) => setKnobs({ ...knobs, produccion: v })} />
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                                    <button onClick={doRefine} disabled={loadingRefine} style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: CYAN, background: "rgba(0,229,255,0.08)", border: `1px solid rgba(0,229,255,0.35)`, borderRadius: 12, padding: "12px 20px", cursor: loadingRefine ? "wait" : "pointer" }}>{loadingRefine ? <Spinner label="Afinando…" /> : "↻ Ver dirección afinada"}</button>
                                    <PrimaryBtn onClick={doGenerate} disabled={loadingFinal} tone="gold">{loadingFinal ? <Spinner label={scale === "album" ? "Componiendo álbum…" : "Componiendo…"} /> : scale === "album" ? `◈ Generar álbum de ${albumCount}` : "◈ Generar prompt para Suno"}</PrimaryBtn>
                                </div>
                                {scale === "album" && loadingFinal && <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 10 }}>Un álbum con voz tarda más (escribe cada letra sin repetir). Aguanta…</div>}
                                {refined && <div style={{ marginTop: 18 }}><DirectionSummary d={refined} /></div>}
                            </HoloCard>
                        )}

                        {/* RESULTADO */}
                        <div ref={resultRef} style={{ scrollMarginTop: 16 }}>
                            {finalC && (
                                <HoloCard glow style={{ marginBottom: 26, borderColor: "rgba(245,197,66,0.4)" }}>
                                    <StepLabel n="◈" title="Prompt para Suno · listo" hint="Guardado en tu Biblioteca. Copia cada campo en Suno." />
                                    <OutputCard c={finalC} onRegenLyrics={(note) => regenLyrics(finalC.id, "final", note)} regenLoading={regenId === finalC.id} onProduced={(next, url) => setProduced(finalC.id, next, url)} />
                                    <ExpandControl busy={expandBusyId === finalC.id} onGenerate={(n, t, s) => expandToAlbum(finalC.id, n, t, "crear", s)} />
                                </HoloCard>
                            )}
                            {albumRes && (
                                <HoloCard glow style={{ marginBottom: 26, borderColor: "rgba(245,197,66,0.4)" }}>
                                    <StepLabel n="◈" title={`Álbum listo · ${albumRes.set_title}`} hint={`${albumRes.tracks.length} piezas, mismo pulso, distintos ángulos. Guardado en tu Biblioteca.`} />
                                    {albumRes.core?.pulse && (
                                        <div style={{ background: "rgba(0,0,0,0.28)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", marginBottom: 16 }}>
                                            <span style={{ fontFamily: MONO, fontSize: 10.5, color: CYAN }}>PULSO CORE · </span>
                                            <span style={{ fontSize: 13, color: INK, fontStyle: "italic" }}>{albumRes.core.pulse}</span>
                                        </div>
                                    )}
                                    <CoverBlock prompt={albumRes.cover_prompt || ""} busy={coverBusyId === albumRes.set_id} onGen={() => genCover(albumRes.set_id)} />
                                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                        {albumRes.tracks.map((t: any) => (
                                            <div key={t.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, background: "rgba(0,0,0,0.16)" }}>
                                                <div style={{ fontFamily: MONO, fontSize: 11, color: GOLD, marginBottom: 4 }}>PIEZA {t.track_no}/{t.total_tracks}</div>
                                                {t.angle && <div style={{ fontSize: 12, color: MUTE, fontStyle: "italic", marginBottom: 10 }}>Ángulo: {t.angle}</div>}
                                                <OutputCard c={t} onRegenLyrics={(note) => regenLyrics(t.id, "album", note)} regenLoading={regenId === t.id} onProduced={(next, url) => setProduced(t.id, next, url)} />
                                            </div>
                                        ))}
                                    </div>
                                </HoloCard>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════════════════ COMPLEMENTAR ══════════════════════════ */}
                {view === "complementar" && (
                    <>
                        <HoloCard style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: MUTE }}>
                                <p style={{ marginTop: 0 }}>¿Ya tienes una pieza que amas — hecha aquí o directo en Suno? Pega su prompt y el panel construye el <strong style={{ color: CYAN }}>álbum a su alrededor</strong>: tu pieza queda como pieza 1 y nacen piezas hermanas pensadas para que, al escucharlas seguidas, se sientan <strong style={{ color: GOLD }}>una sola obra</strong>.</p>
                            </div>
                        </HoloCard>

                        {/* La pieza original */}
                        <HoloCard style={{ marginBottom: 18 }}>
                            <StepLabel n="1" title="Tu pieza original" hint="Pega el prompt tal cual lo usaste en Suno." />
                            <FieldLabel text="Prompt de Suno (campo Styles)" />
                            <textarea value={seedPrompt} onChange={(e) => setSeedPrompt(e.target.value)} placeholder="Ej. organic progressive house, 120 BPM, warm analog bassline, polyrhythmic hand percussion, cascading arpeggiator, stacked choir pads, tape saturation, sunrise lift…" style={{ ...inputStyle(true), minHeight: 96 }} />
                            <div style={{ marginTop: 12 }}>
                                <FieldLabel text="Exclude styles (opcional)" hint="Sepáralos por coma; el panel limpia los guiones solo." />
                                <input value={seedExcludes} onChange={(e) => setSeedExcludes(e.target.value)} placeholder="dark techno, harsh noise, fast trance, vocal chops" style={inputStyle()} />
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
                                <div>
                                    <FieldLabel text="Weirdness %" />
                                    <input type="number" min={0} max={99} value={seedW} onChange={(e) => setSeedW(Math.max(0, Math.min(99, Math.round(Number(e.target.value) || 0))))} style={{ ...inputStyle(), width: 110, fontFamily: MONO }} />
                                </div>
                                <div>
                                    <FieldLabel text="Style Influence %" />
                                    <input type="number" min={0} max={99} value={seedSI} onChange={(e) => setSeedSI(Math.max(0, Math.min(99, Math.round(Number(e.target.value) || 0))))} style={{ ...inputStyle(), width: 110, fontFamily: MONO }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
                                <div style={{ flex: "1 1 240px" }}>
                                    <FieldLabel text="Título de tu pieza (opcional)" />
                                    <input value={seedAnchorTitle} onChange={(e) => setSeedAnchorTitle(e.target.value)} placeholder="Ej. Amanecer Interior" style={inputStyle()} />
                                </div>
                                <div style={{ flex: "1 1 240px" }}>
                                    <FieldLabel text="Link del track en Suno (opcional)" hint="Si lo pegas, la pieza 1 queda marcada como ✓ producida." />
                                    <input value={seedLink} onChange={(e) => setSeedLink(e.target.value)} placeholder="https://suno.com/song/…" style={inputStyle()} />
                                </div>
                            </div>
                        </HoloCard>

                        {/* El álbum a construir */}
                        <HoloCard style={{ marginBottom: 22 }}>
                            <StepLabel n="2" title="El álbum a su alrededor" />
                            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div>
                                    <FieldLabel text="¿Cuántas piezas más?" />
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.25)", border: `1px solid ${LINE}`, borderRadius: 10, padding: "6px 12px" }}>
                                        <button onClick={() => setSeedCount((n) => Math.max(1, n - 1))} style={stepBtn}>−</button>
                                        <span style={{ fontFamily: MONO, fontSize: 20, color: INK, fontWeight: 700, minWidth: 28, textAlign: "center" }}>{seedCount}</span>
                                        <button onClick={() => setSeedCount((n) => Math.min(11, n + 1))} style={stepBtn}>+</button>
                                    </div>
                                    <div style={{ fontSize: 11, color: MUTE2, marginTop: 4 }}>álbum de {seedCount + 1} en total</div>
                                </div>
                                <div style={{ flex: "1 1 240px" }}>
                                    <FieldLabel text="Título del álbum (opcional)" />
                                    <input value={seedAlbumTitle} onChange={(e) => setSeedAlbumTitle(e.target.value)} placeholder="Usa el título de tu pieza si lo dejas vacío" style={inputStyle()} />
                                </div>
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <FieldLabel text="¿Con voz o instrumental?" />
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    {[{ key: "inst", label: "Instrumental" }, { key: "voz", label: "Con voz" }].map((o) => {
                                        const on = (o.key === "inst") === seedInstrumental
                                        return <button key={o.key} onClick={() => setSeedInstrumental(o.key === "inst")} style={{ flex: "1 1 160px", fontFamily: FONT, fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? "#06202f" : MUTE, background: on ? `linear-gradient(180deg, ${CYAN}, ${CYAN_DK})` : "rgba(0,0,0,0.2)", border: `1px solid ${on ? CYAN : LINE}`, borderRadius: 11, padding: "12px", cursor: "pointer", boxShadow: on ? "0 0 14px rgba(0,229,255,0.35)" : "none" }}>{o.label}</button>
                                    })}
                                </div>
                                {!seedInstrumental && (
                                    <div style={{ marginTop: 12 }}>
                                        <FieldLabel text="Idioma de la letra" />
                                        <Segmented value={seedLang} onChange={setSeedLang} options={[{ key: "es", label: "Español" }, { key: "en", label: "Inglés" }, { key: "luminico", label: "Lumínico" }, { key: "mantra", label: "Mantra" }]} />
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <SimilaritySelector value={seedSim} onChange={setSeedSim} />
                            </div>
                        </HoloCard>

                        <div style={{ marginBottom: 26 }}>
                            <PrimaryBtn tone="gold" onClick={createSeedAlbum} disabled={seedBusy || !seedPrompt.trim()}>{seedBusy ? <Spinner label="Componiendo las piezas hermanas…" /> : `◈ Crear álbum de ${seedCount + 1} alrededor de esta pieza`}</PrimaryBtn>
                            {!seedPrompt.trim() && <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 8 }}>Pega el prompt de tu pieza para empezar.</div>}
                            {seedBusy && <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 8 }}>{seedInstrumental ? "" : "Con voz tarda más (escribe cada letra sin repetir). "}Al terminar te llevo a la Biblioteca con el álbum abierto.</div>}
                        </div>
                    </>
                )}

                {/* ══════════════════════════ BIBLIOTECA ══════════════════════════ */}
                {view === "biblioteca" && (
                    <>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, color: MUTE }}>Ordenar:</span>
                                <div style={{ minWidth: 220 }}><Segmented value={gallerySort} onChange={(v) => setGallerySort(v as any)} options={[{ key: "recent", label: "Más reciente" }, { key: "albums", label: "Álbumes primero" }]} /></div>
                                <div style={{ minWidth: 250 }}><Segmented value={prodFilter} onChange={(v) => setProdFilter(v as any)} options={[{ key: "all", label: "Todas" }, { key: "prod", label: "✓ Producidas" }, { key: "pend", label: "Pendientes" }]} /></div>
                            </div>
                            <button onClick={() => { setSelectMode((v) => !v); setSelectedForAlbum(new Set()) }} style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: selectMode ? "#06202f" : GOLD, background: selectMode ? GOLD : "rgba(245,197,66,0.08)", border: `1px solid ${selectMode ? GOLD : "rgba(245,197,66,0.35)"}`, borderRadius: 10, padding: "9px 16px", cursor: "pointer" }}>{selectMode ? "Cancelar selección" : "◈ Juntar piezas en álbum"}</button>
                        </div>

                        {selectMode && (
                            <HoloCard glow style={{ marginBottom: 18, borderColor: "rgba(245,197,66,0.4)" }}>
                                <div style={{ fontSize: 13, color: MUTE, marginBottom: 12 }}>Marca las <strong style={{ color: INK }}>piezas sueltas</strong> que quieres juntar (mínimo 2), ponle título y crea el álbum. <span style={{ color: CYAN }}>{selectedForAlbum.size} seleccionadas</span></div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                                    <div style={{ flex: "1 1 240px" }}>
                                        <FieldLabel text="Título del álbum" />
                                        <input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="Ej. Sesión de Cristal" style={inputStyle()} />
                                    </div>
                                    <PrimaryBtn tone="gold" disabled={selectedForAlbum.size < 2 || grouping} onClick={groupSelected}>{grouping ? <Spinner label="Creando álbum…" /> : `Crear álbum con ${selectedForAlbum.size}`}</PrimaryBtn>
                                </div>
                            </HoloCard>
                        )}

                        {creationsErr ? (
                            <div style={{ background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.35)", color: "#ffd0d0", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.6 }}>
                                <strong style={{ color: "#ffb4b4" }}>La Biblioteca no pudo leer tus creaciones.</strong> Motivo: <span style={{ fontFamily: MONO, fontSize: 12 }}>{creationsErr}</span>
                                <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                    <button onClick={loadCreations} style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: "#06202f", background: CYAN, border: `1px solid ${CYAN}`, borderRadius: 9, padding: "8px 16px", cursor: "pointer" }}>↻ Reintentar</button>
                                    <span style={{ fontSize: 11.5, color: MUTE }}>El panel reintenta solo un par de veces; el motivo de arriba dice exactamente qué falta.</span>
                                </div>
                            </div>
                        ) : galleryItems.length === 0 ? (
                            <div style={{ color: MUTE2, fontSize: 13, padding: 12 }}>
                                {prodFilter !== "all" ? "Nada con este filtro todavía." : (<>Aún no hay creaciones. Ve a <strong style={{ color: CYAN }}>Crear</strong> y genera tu primer prompt.</>)}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {galleryItems.map((it) =>
                                    it.type === "album" ? (
                                        <GalleryAlbum key={it.set_id} it={it} expanded={expandedGal === it.set_id} onToggle={() => setExpandedGal((e) => (e === it.set_id ? null : it.set_id))} onDelete={() => deleteSet(it.set_id)} onRegen={(id: string, note?: string) => regenLyrics(id, null, note)} onRename={(t: string) => renameSet(it.set_id, t)} onUngroup={ungroup} regenId={regenId} onProduced={setProduced} coverBusy={coverBusyId === it.set_id} onCover={() => genCover(it.set_id)} />
                                    ) : (
                                        <GallerySingle key={it.creation.id} c={it.creation} expanded={expandedGal === it.creation.id} onToggle={() => setExpandedGal((e) => (e === it.creation.id ? null : it.creation.id))} onDelete={() => deleteCreation(it.creation.id)} onRegen={(note?: string) => regenLyrics(it.creation.id, null, note)} regenLoading={regenId === it.creation.id} selectMode={selectMode} selected={selectedForAlbum.has(it.creation.id)} onSelect={() => toggleSet(setSelectedForAlbum, it.creation.id)} expandBusy={expandBusyId === it.creation.id} onExpand={(n: number, t: string, s: string) => expandToAlbum(it.creation.id, n, t, "biblio", s)} onProduced={setProduced} />
                                    )
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════ Galería — pieza suelta ═══ */
function GallerySingle({ c, expanded, onToggle, onDelete, onRegen, regenLoading, selectMode, selected, onSelect, expandBusy, onExpand, onProduced }: {
    c: Creation; expanded: boolean; onToggle: () => void; onDelete: () => void; onRegen: (note?: string) => void; regenLoading: boolean; selectMode: boolean; selected: boolean; onSelect: () => void; expandBusy: boolean; onExpand: (count: number, title: string, sim: string) => void; onProduced: (id: string, next: boolean, url: string) => void
}) {
    return (
        <HoloCard style={{ padding: 0, borderColor: selected ? "rgba(245,197,66,0.5)" : LINE }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }} onClick={selectMode ? onSelect : onToggle}>
                {selectMode && (
                    <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${selected ? GOLD : LINE}`, background: selected ? GOLD : "transparent", color: "#06202f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{selected ? "✓" : ""}</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        {c.produced_at && <span title="Producida en Suno" style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}`, flexShrink: 0, alignSelf: "center" }} />}
                        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>{c.title}</span>
                        <span style={{ fontSize: 11.5, color: CYAN }}>{c.direction_name}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 3 }}>{c.instrumental ? "Instrumental" : `Con voz · ${langLabel(c.lyrics_lang || "es")}`} · W{c.weirdness ?? "?"} / SI{c.style_influence ?? "?"}{c.produced_at ? " · ✓ producida" : ""}</div>
                </div>
                {!selectMode && <button onClick={(e) => { e.stopPropagation(); onDelete() }} title="Eliminar" style={{ background: "transparent", border: "none", color: "rgba(255,120,120,0.7)", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>✕</button>}
                {!selectMode && <span style={{ color: CYAN, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▸</span>}
            </div>
            {expanded && !selectMode && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${LINE}` }}>
                    <div style={{ height: 12 }} />
                    <OutputCard c={c} onRegenLyrics={onRegen} regenLoading={regenLoading} onProduced={(next, url) => onProduced(c.id, next, url)} />
                    <ExpandControl busy={expandBusy} onGenerate={onExpand} />
                </div>
            )}
        </HoloCard>
    )
}

/* ═══════════════════════════════ Galería — álbum ═══ */
function GalleryAlbum({ it, expanded, onToggle, onDelete, onRegen, onRename, onUngroup, regenId, onProduced, coverBusy, onCover }: {
    it: any; expanded: boolean; onToggle: () => void; onDelete: () => void; onRegen: (id: string, note?: string) => void; onRename: (t: string) => void; onUngroup: (id: string) => void; regenId: string | null; onProduced: (id: string, next: boolean, url: string) => void; coverBusy: boolean; onCover: () => void
}) {
    const [renaming, setRenaming] = useState(false)
    const [name, setName] = useState(it.set_title)
    const prodCount = it.tracks.filter((t: Creation) => t.produced_at).length
    const coverPrompt = (it.tracks.find((t: Creation) => (t.set_cover_prompt || "").trim()) || {}).set_cover_prompt || ""
    return (
        <HoloCard style={{ padding: 0, borderColor: "rgba(245,197,66,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#06202f", background: GOLD, borderRadius: 6, padding: "3px 8px", fontWeight: 700, flexShrink: 0 }}>ÁLBUM</span>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onToggle}>
                    {renaming ? (
                        <input autoFocus value={name} onClick={(e) => e.stopPropagation()} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onRename(name); setRenaming(false) } }} onBlur={() => { onRename(name); setRenaming(false) }} style={{ ...inputStyle(), fontSize: 15, fontWeight: 700, padding: "4px 8px" }} />
                    ) : (
                        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>{it.set_title}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: MUTE2, marginTop: 3 }}>
                        {it.tracks.length} piezas
                        {prodCount > 0 && <span style={{ color: GREEN }}> · ✓ {prodCount}/{it.tracks.length} producidas</span>}
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setRenaming(true) }} title="Renombrar" style={{ background: "transparent", border: "none", color: MUTE, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>✎</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete() }} title="Eliminar álbum" style={{ background: "transparent", border: "none", color: "rgba(255,120,120,0.7)", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>✕</button>
                <span onClick={onToggle} style={{ color: CYAN, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s", cursor: "pointer" }}>▸</span>
            </div>
            {expanded && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ height: 4 }} />
                    <CoverBlock prompt={coverPrompt} busy={coverBusy} onGen={onCover} />
                    {it.tracks.map((t: Creation) => (
                        <div key={t.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, background: "rgba(0,0,0,0.16)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <div style={{ fontFamily: MONO, fontSize: 11, color: GOLD, display: "flex", alignItems: "center", gap: 7 }}>
                                    {t.produced_at && <span title="Producida en Suno" style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, boxShadow: `0 0 7px ${GREEN}`, display: "inline-block" }} />}
                                    PIEZA {t.track_no}/{t.total_tracks}
                                </div>
                                <button onClick={() => onUngroup(t.id)} title="Sacar del álbum" style={{ fontFamily: FONT, fontSize: 10.5, color: MUTE2, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "3px 8px", cursor: "pointer" }}>↥ sacar</button>
                            </div>
                            {t.angle && <div style={{ fontSize: 12, color: MUTE, fontStyle: "italic", marginBottom: 10 }}>Ángulo: {t.angle}</div>}
                            <OutputCard c={t} onRegenLyrics={(note) => onRegen(t.id, note)} regenLoading={regenId === t.id} onProduced={(next, url) => onProduced(t.id, next, url)} />
                        </div>
                    ))}
                </div>
            )}
        </HoloCard>
    )
}
