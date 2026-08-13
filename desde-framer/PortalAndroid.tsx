// PortalAndroid.tsx v1.1 — Landing de lista de espera de ANDROID (redsolarviva.com/android).
// Standalone (Zak lo coloca directo en la página /android de Framer; sin Domo).
// Coreografía: SELLO DEL PULSO a pantalla (calco fiel de SelloPulso.tsx del
// escaner-app: estática de glifos → cometa SMIL que dibuja el trazo del logo →
// ignición dorada de la cresta → wordmark Matrix "ESCÁNER VIBRACIONAL") → el
// sello se ASIENTA como hero y debajo se materializa la TERMINAL DE REGISTRO
// (badge Android + titular + input de correo estilo consola con brackets +
// scanline + LED). Enviar llama a la RPC pública join_android_waitlist
// (p_email, p_source, p_locale) con la anon key → ceremonia "SEÑAL ANCLADA"
// (anillo de emisión + decode Matrix). Idempotente server-side; localStorage
// recuerda el alta para volver directo al estado anclado. Bilingüe es/en por
// idioma del navegador. Tap durante el sello adelanta la terminal (el sello
// completa su coreografía igual). Sin CTA de iPhone: quien aterriza aquí ya
// eligió Android en la landing raíz (escanervibracional.com).
// Física: compositor CSS + SMIL + rAF acotado (scramblers con safety-timeout),
// cero framer-motion, cero WebGL. prefers-reduced-motion → cuadro final directo.

import { useEffect, useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

/* ── Config (defaults hardcodeados: cero configuración; la anon key es pública
      por diseño — la tabla no tiene lectura pública, solo el alta) ─────────── */
const SB_URL_DEFAULT = "https://cobtsltrcsruzcusyqhi.supabase.co"
const SB_ANON_DEFAULT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYnRzbHRyY3NydXpjdXN5cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzIyOTMsImV4cCI6MjA5MDMwODI5M30.-GKVel9fUxw2Lrp59QLqIvLrh9ubrHLgP44fkj8qI6U"
const LS_KEY = "rsv-android-waitlist"

/* Alfabeto de señal — el mismo lenguaje del Espejo / Sello del Pulso. */
const AND_GLYPHS = "◇◆◈○●△▽✦✧∴∷≋∾⋄⋆·01+×"
const AND_CYAN = "#7FE7FF"
const AND_GOLD = "#FFD98E"
const AND_DIM = "rgba(205,232,255,.75)"
const ANDROID_GREEN = "#3DDC84"

/* Geometría del logo: línea 24→376 (y=116) con cresta gaussiana en (200,54). */
const PULSE_D =
    "M 24 116 L 136 116 C 164 116 174 108 183 92 C 191 77 189 54 200 54 " +
    "C 211 54 209 77 217 92 C 226 108 236 116 264 116 L 376 116"

/* Random determinista (SSR-safe: mismo resultado server/cliente). */
function det(i: number, salt: number) {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
    return x - Math.floor(x)
}

/* ── Textos es/en (el GLOSARIO manda: "Escáner Vibracional" no se traduce) ── */
const TEXT = {
    es: {
        wordmark: "ESCÁNER VIBRACIONAL",
        badge: "ANDROID · SEÑAL EN CAMINO",
        title: "El Escáner Vibracional llega a Android",
        sub: "Deja tu correo y sé de los primeros en recibir el aviso cuando la app se encienda en Google Play.",
        termLabel: "REGISTRO DE SEÑAL",
        placeholder: "tu@correo.com",
        btn: "AVISARME CUANDO SALGA",
        btnSending: "ANCLANDO SEÑAL",
        note: "Solo te escribiremos para avisarte del lanzamiento. Nada más.",
        okTitle: "SEÑAL ANCLADA",
        okBody: "Tu correo quedó en la lista. Te avisaremos en cuanto el Escáner esté vivo en Android.",
        doneBody:
            "Ya estás en la lista. Te avisaremos en cuanto el Escáner esté vivo en Android.",
        errFormat: "Revisa tu correo: el formato no es válido.",
        errNet: "La señal no pudo anclarse. Intenta de nuevo.",
        foot: "RED SOLAR VIVA",
    },
    en: {
        wordmark: "ESCÁNER VIBRACIONAL",
        badge: "ANDROID · SIGNAL INCOMING",
        title: "Escáner Vibracional is coming to Android",
        sub: "Leave your email and be among the first to know when the app goes live on Google Play.",
        termLabel: "SIGNAL REGISTRY",
        placeholder: "you@email.com",
        btn: "NOTIFY ME AT LAUNCH",
        btnSending: "ANCHORING SIGNAL",
        note: "We'll only write to you to announce the launch. Nothing else.",
        okTitle: "SIGNAL ANCHORED",
        okBody: "Your email is on the list. We'll let you know the moment the Escáner is live on Android.",
        doneBody:
            "You're already on the list. We'll let you know the moment the Escáner is live on Android.",
        errFormat: "Check your email: the format doesn't look right.",
        errNet: "The signal couldn't anchor. Try again.",
        foot: "RED SOLAR VIVA",
    },
}

/* ── CSS (inyección idempotente; bases = estados FINALES, como SelloPulso:
      matar la animación deja el cuadro final perfecto) ─────────────────────── */
let _andCssDone = false
function ensureAndCss() {
    if (typeof document === "undefined" || _andCssDone) return
    _andCssDone = true
    if (document.getElementById("rsv-android-css")) return
    const FLUID = "cubic-bezier(.22,1,.36,1)"
    const EXPO = "cubic-bezier(.16,1,.3,1)"
    const el = document.createElement("style")
    el.id = "rsv-android-css"
    el.textContent = [
        /* ── Root / atmósfera ── */
        `.rsv-and-root,.rsv-and-root *{box-sizing:border-box}`,
        `.rsv-and-root{position:relative;width:100%;min-height:100vh;min-height:100dvh;` +
            `overflow:hidden;background:radial-gradient(150% 95% at 50% 0%, #0B1424 0%, #060B16 46%, #03050C 100%);` +
            `color:#EAF6FF;-webkit-font-smoothing:antialiased}`,
        `.rsv-and-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden}`,
        `.rsv-and-vig{position:absolute;inset:0;` +
            `background:radial-gradient(120% 100% at 50% 46%, transparent 52%, rgba(0,0,0,.5) 100%)}`,
        `.rsv-and-blob{position:absolute;width:56vmin;height:56vmin;border-radius:50%;` +
            `filter:blur(70px);opacity:.11;will-change:transform;` +
            `animation:andFadeIn 1.2s ease-out both,andBlob 11s ease-in-out 0s infinite alternate}`,
        `@keyframes andFadeIn{from{opacity:0}}`,
        `.rsv-and-blob-c{left:2%;top:6%;` +
            `background:radial-gradient(circle, rgba(110,205,255,.85) 0%, transparent 66%)}`,
        `.rsv-and-blob-g{right:0%;top:34%;` +
            `background:radial-gradient(circle, rgba(244,214,150,.8) 0%, transparent 66%);` +
            `animation-delay:0s,-5.5s}`,
        `.rsv-and-star{position:absolute;border-radius:50%;background:#fff;` +
            `animation:andTwinkle var(--dur,5s) ease-in-out var(--del,0s) infinite}`,
        `@keyframes andTwinkle{0%,100%{opacity:var(--o0,.1)}50%{opacity:var(--o1,.5)}}`,
        /* ── Hero (el sello asentándose de centro-escenario a cabecera) ── */
        `.rsv-and-hero{position:relative;display:flex;flex-direction:column;align-items:center;` +
            `gap:14px;padding-top:10vh;transition:transform 1.15s ${FLUID};will-change:transform}`,
        `[data-and-phase="seal"] .rsv-and-hero{transform:translateY(16vh) scale(1.1)}`,
        `.rsv-and-geo{position:relative;width:min(88vw,430px);aspect-ratio:400/170;` +
            `animation:andGeoIn .9s ${FLUID} .06s both;will-change:transform,opacity}`,
        `@keyframes andGeoIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`,
        `.rsv-and-svg{width:100%;height:100%;display:block;overflow:visible}`,
        /* Barrido de escaneo inicial */
        `.rsv-and-scan{position:absolute;top:0;bottom:0;left:-45%;width:38%;pointer-events:none;` +
            `background:linear-gradient(90deg, transparent 0%, rgba(140,225,255,.05) 38%, rgba(255,225,170,.055) 62%, transparent 100%);` +
            `transform:translateX(380%);will-change:transform;` +
            `animation:andScan 1.05s cubic-bezier(.4,0,.2,1) .42s both}`,
        `@keyframes andScan{from{transform:translateX(0)}}`,
        /* Línea de standby (parpadeo y muerte) */
        `.rsv-and-standby{opacity:0;animation:andStandby 1.15s linear both}`,
        `@keyframes andStandby{0%{opacity:0}8%{opacity:.14}16%{opacity:.05}` +
            `26%{opacity:.16}36%{opacity:.06}48%{opacity:.15}60%{opacity:.08}` +
            `72%{opacity:.13}86%{opacity:.04}100%{opacity:0}}`,
        /* El trazo — LINEAL, en sincronía con el cometa SMIL */
        `.rsv-and-main{stroke-dasharray:100;stroke-dashoffset:0;` +
            `animation:andDraw .85s linear .45s both}`,
        `@keyframes andDraw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}`,
        `.rsv-and-glowg{filter:blur(5px)}`,
        `.rsv-and-glow{stroke-dasharray:100;stroke-dashoffset:0;opacity:.22;` +
            `animation:andDraw .85s linear .45s both,andGlowBreath 3.2s ease-in-out 1.9s infinite alternate}`,
        `@keyframes andGlowBreath{from{opacity:.17}to{opacity:.3}}`,
        /* Corriente viva post-sello */
        `.rsv-and-runner{stroke-dasharray:4 96;stroke-dashoffset:0;opacity:0;` +
            `animation:andRunnerFlow 2.6s linear 1.55s infinite,andRunnerOn .5s ease 1.55s both}`,
        `@keyframes andRunnerFlow{from{stroke-dashoffset:0}to{stroke-dashoffset:-100}}`,
        `@keyframes andRunnerOn{from{opacity:0}to{opacity:.5}}`,
        /* Ignición de la cresta */
        `.rsv-and-crest{transform-box:fill-box;transform-origin:center}`,
        `.rsv-and-bloom{opacity:.5;` +
            `animation:andBloomIn .9s ${EXPO} .8s both,andBloomBreath 3s ease-in-out 2s infinite alternate}`,
        `@keyframes andBloomIn{0%{opacity:0;transform:scale(.15)}` +
            `42%{opacity:1;transform:scale(1.45)}100%{opacity:.5;transform:scale(1)}}`,
        `@keyframes andBloomBreath{from{opacity:.42}to{opacity:.62}}`,
        `.rsv-and-flarev{opacity:.55;animation:andFlareV .75s ${EXPO} .84s both}`,
        `@keyframes andFlareV{from{opacity:0;transform:scaleY(0)}to{opacity:.55;transform:scaleY(1)}}`,
        `.rsv-and-corestar{animation:andStarIn .4s ${EXPO} .82s both,andStarBreath 2.7s ease-in-out 1.9s infinite}`,
        `@keyframes andStarIn{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}`,
        `@keyframes andStarBreath{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.14);opacity:.85}}`,
        `.rsv-and-ring{opacity:0}`,
        `.rsv-and-ring-1{animation:andRing 1.2s ${EXPO} .85s both}`,
        `.rsv-and-ring-2{animation:andRing 1.35s ${EXPO} 1.02s both}`,
        `@keyframes andRing{0%{opacity:.5;transform:scale(.12)}100%{opacity:0;transform:scale(3.1)}}`,
        /* Anillos de emisión LENTOS del sello vivo (la cresta respira señal) */
        `.rsv-and-emit{opacity:0;animation:andEmit 5.2s linear 2.4s infinite}`,
        `.rsv-and-emit-2{animation-delay:5s}`,
        `@keyframes andEmit{0%{opacity:0;transform:scale(.2)}12%{opacity:.34}` +
            `100%{opacity:0;transform:scale(3.4)}}`,
        /* Reflejo sobre obsidiana */
        `.rsv-and-reflg{filter:blur(1.6px)}`,
        `.rsv-and-refl{opacity:.09;animation:andReflIn .8s ease 1.3s both}`,
        `@keyframes andReflIn{from{opacity:0}}`,
        /* Estática de señal (glifos buscando frecuencia) */
        `.rsv-and-static{position:absolute;left:5%;right:5%;top:68.2%;` +
            `transform:translateY(-50%);display:flex;justify-content:space-between;` +
            `pointer-events:none;font-family:'JetBrains Mono','SF Mono',Menlo,monospace;` +
            `font-size:10px;opacity:0;animation:andStaticRow 1.2s ease-out both}`,
        `@keyframes andStaticRow{0%{opacity:0}10%{opacity:.9}64%{opacity:.85}100%{opacity:0}}`,
        `.rsv-and-static span{text-shadow:0 0 8px currentColor}`,
        /* Wordmark */
        `.rsv-and-word{font-family:'Inter',-apple-system,sans-serif;font-weight:200;` +
            `font-size:12px;text-transform:uppercase;color:rgba(240,246,255,.92);` +
            `text-align:center;white-space:nowrap;padding-left:.55em;` +
            `text-shadow:0 0 22px rgba(140,220,255,.3);` +
            `animation:andWordIn .55s ${FLUID} 1.04s both}`,
        `@keyframes andWordIn{from{opacity:0;filter:blur(6px)}to{opacity:1;filter:blur(0)}}`,
        /* ── Cuerpo de la landing (se materializa al asentarse el sello) ── */
        `.rsv-and-body{position:relative;width:100%;max-width:470px;margin:0 auto;` +
            `padding:34px 22px 44px;display:flex;flex-direction:column;align-items:center;gap:18px}`,
        `.rsv-and-rev{opacity:0;transform:translateY(16px);filter:blur(8px);` +
            `transition:opacity .8s ${FLUID},transform .8s ${FLUID},filter .8s ${FLUID};` +
            `transition-delay:var(--d,0s);will-change:transform,opacity}`,
        `[data-and-phase="landing"] .rsv-and-rev{opacity:1;transform:none;filter:blur(0)}`,
        `.rsv-and-badge{display:inline-flex;align-items:center;gap:8px;` +
            `font-family:'JetBrains Mono',Menlo,monospace;font-size:10px;letter-spacing:.32em;` +
            `color:${ANDROID_GREEN};padding:7px 14px 7px 16px;border-radius:999px;` +
            `border:1px solid rgba(61,220,132,.34);background:rgba(61,220,132,.07);` +
            `text-shadow:0 0 12px rgba(61,220,132,.5)}`,
        `.rsv-and-badge i{width:5px;height:5px;border-radius:50%;background:${ANDROID_GREEN};` +
            `box-shadow:0 0 8px ${ANDROID_GREEN};animation:andLed 1.7s ease-in-out infinite}`,
        `@keyframes andLed{0%,100%{opacity:1}50%{opacity:.25}}`,
        `.rsv-and-title{margin:0;text-align:center;font-family:'Inter',-apple-system,sans-serif;` +
            `font-weight:250;font-size:clamp(25px,6.8vw,32px);line-height:1.22;` +
            `letter-spacing:.015em;color:#F2F8FF;text-wrap:balance}`,
        `.rsv-and-title b{font-weight:450;background:linear-gradient(92deg,#BFEFFF 0%,#6FE3FF 45%,#FFDFA0 100%);` +
            `-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}`,
        `.rsv-and-sub{margin:0;text-align:center;font-family:'Inter',-apple-system,sans-serif;` +
            `font-weight:300;font-size:14.5px;line-height:1.65;color:rgba(214,232,248,.72);max-width:400px}`,
        /* ── Terminal de registro ── */
        `.rsv-and-term{position:relative;width:100%;margin-top:8px;border-radius:16px;` +
            `border:1px solid rgba(127,231,255,.22);background:rgba(9,15,28,.58);` +
            `backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);` +
            `box-shadow:0 0 0 .5px rgba(255,255,255,.04) inset,0 22px 60px rgba(0,0,0,.45),0 0 44px rgba(0,194,255,.06);` +
            `padding:20px 18px 18px;overflow:hidden}`,
        `.rsv-and-brk{position:absolute;width:15px;height:15px;border:0 solid rgba(255,217,142,.6);pointer-events:none}`,
        `.rsv-and-brk-tl{left:-1px;top:-1px;border-left-width:1.5px;border-top-width:1.5px;border-top-left-radius:15px}`,
        `.rsv-and-brk-tr{right:-1px;top:-1px;border-right-width:1.5px;border-top-width:1.5px;border-top-right-radius:15px}`,
        `.rsv-and-brk-bl{left:-1px;bottom:-1px;border-left-width:1.5px;border-bottom-width:1.5px;border-bottom-left-radius:15px}`,
        `.rsv-and-brk-br{right:-1px;bottom:-1px;border-right-width:1.5px;border-bottom-width:1.5px;border-bottom-right-radius:15px}`,
        `.rsv-and-scanline{position:absolute;left:0;right:0;top:-30%;height:26%;pointer-events:none;` +
            `background:linear-gradient(180deg, transparent 0%, rgba(140,225,255,.05) 50%, transparent 100%);` +
            `animation:andScanline 7.5s linear 3s infinite}`,
        `@keyframes andScanline{0%{transform:translateY(0)}100%{transform:translateY(560%)}}`,
        `.rsv-and-termhead{display:flex;align-items:center;gap:9px;margin-bottom:16px;` +
            `font-family:'JetBrains Mono',Menlo,monospace;font-size:10px;letter-spacing:.3em;` +
            `color:rgba(205,232,255,.62)}`,
        `.rsv-and-termhead .led{width:6px;height:6px;border-radius:50%;background:${ANDROID_GREEN};` +
            `box-shadow:0 0 9px ${ANDROID_GREEN};animation:andLed 1.6s ease-in-out infinite;flex-shrink:0}`,
        `.rsv-and-termhead .led[data-ok="1"]{background:${AND_GOLD};box-shadow:0 0 10px ${AND_GOLD};animation:none}`,
        `.rsv-and-termhead .glyph{color:${AND_GOLD};text-shadow:0 0 9px rgba(255,217,142,.6);letter-spacing:0}`,
        `.rsv-and-field{display:flex;align-items:center;gap:10px;border-radius:11px;` +
            `border:1px solid rgba(127,231,255,.24);background:rgba(6,11,22,.6);` +
            `padding:2px 4px 2px 14px;transition:border-color .3s,box-shadow .3s}`,
        `.rsv-and-field:focus-within{border-color:rgba(255,217,142,.62);` +
            `box-shadow:0 0 22px rgba(255,217,142,.12),0 0 0 .5px rgba(255,217,142,.3) inset}`,
        `.rsv-and-field .pre{font-family:'JetBrains Mono',Menlo,monospace;font-size:13px;` +
            `color:${AND_CYAN};text-shadow:0 0 8px rgba(127,231,255,.55);flex-shrink:0}`,
        `.rsv-and-input{flex:1;min-width:0;border:none;outline:none;background:transparent;` +
            `font-family:'JetBrains Mono',Menlo,monospace;font-size:16px;color:#EFF7FF;` +
            `padding:13px 4px;caret-color:${AND_GOLD}}`,
        `.rsv-and-input::placeholder{color:rgba(170,196,220,.34)}`,
        `.rsv-and-btn{width:100%;margin-top:12px;border:none;border-radius:11px;cursor:pointer;` +
            `padding:15px 16px;font-family:'JetBrains Mono',Menlo,monospace;font-size:12.5px;` +
            `font-weight:700;letter-spacing:.24em;color:#1D1305;` +
            `background:linear-gradient(180deg,#FFE3AC 0%,#F2C87C 55%,#DDAD55 100%);` +
            `box-shadow:0 6px 26px rgba(244,200,124,.28),0 0 0 .5px rgba(255,255,255,.25) inset;` +
            `transition:filter .25s,transform .15s,opacity .3s}`,
        `.rsv-and-btn:hover{filter:brightness(1.07)}`,
        `.rsv-and-btn:active{transform:scale(.985)}`,
        `.rsv-and-btn:disabled{opacity:.72;cursor:default}`,
        `.rsv-and-dots span{animation:andDots 1.2s ease-in-out infinite;display:inline-block}`,
        `.rsv-and-dots span:nth-child(2){animation-delay:.18s}`,
        `.rsv-and-dots span:nth-child(3){animation-delay:.36s}`,
        `@keyframes andDots{0%,100%{opacity:.2}50%{opacity:1}}`,
        `.rsv-and-err{margin:10px 2px 0;font-family:'Inter',sans-serif;font-size:12.5px;` +
            `color:#FF9D9D;text-shadow:0 0 12px rgba(255,90,90,.3)}`,
        `.rsv-and-note{margin:12px 2px 0;font-family:'JetBrains Mono',Menlo,monospace;` +
            `font-size:10px;letter-spacing:.06em;line-height:1.7;color:rgba(190,214,236,.4)}`,
        `@keyframes andShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}` +
            `40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}`,
        /* Éxito */
        `.rsv-and-okwrap{position:relative;padding:6px 2px 4px;text-align:center}`,
        `.rsv-and-okring{position:absolute;left:50%;top:38%;width:12px;height:12px;` +
            `margin:-6px 0 0 -6px;border-radius:50%;border:1px solid rgba(255,217,142,.8);` +
            `pointer-events:none;animation:andOkRing 1.25s ${EXPO} .1s both}`,
        `.rsv-and-okring-2{animation-delay:.32s;border-color:rgba(127,231,255,.55)}`,
        `@keyframes andOkRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(30)}}`,
        /* Sin letter-spacing propio: el MatrixWord ya trae .55em de margen por
           letra — sumarle tracking lo partía en dos líneas en 375px. */
        `.rsv-and-oktitle{font-family:'JetBrains Mono',Menlo,monospace;font-size:13.5px;` +
            `letter-spacing:0;padding-left:.55em;white-space:nowrap;color:${AND_GOLD};` +
            `text-shadow:0 0 18px rgba(255,217,142,.55)}`,
        `.rsv-and-okbody{margin:13px auto 4px;max-width:340px;font-family:'Inter',sans-serif;` +
            `font-weight:300;font-size:13.5px;line-height:1.7;color:rgba(214,232,248,.78)}`,
        `.rsv-and-okstar{display:block;margin:2px auto 12px;width:22px;height:22px;` +
            `animation:andStarIn .5s ${EXPO} .15s both,andStarBreath 3s ease-in-out .8s infinite}`,
        /* ── Pie ── */
        `.rsv-and-foot{margin-top:20px;font-family:'JetBrains Mono',Menlo,monospace;` +
            `font-size:9px;letter-spacing:.5em;padding-left:.5em;color:rgba(190,214,236,.3);text-align:center}`,
        /* Reduced motion: cuadro final directo (las bases son estados finales). */
        `@media (prefers-reduced-motion: reduce){` +
            `.rsv-and-root [class*="rsv-and-"]{animation:none !important}` +
            `.rsv-and-rev{transition:none}}`,
    ].join("\n")
    document.head.appendChild(el)
}

/* Fuentes (Inter + JetBrains Mono) — inyección con guard. */
function ensureAndFonts() {
    if (typeof document === "undefined") return
    if (document.getElementById("rsv-and-fonts")) return
    const l = document.createElement("link")
    l.id = "rsv-and-fonts"
    l.rel = "stylesheet"
    l.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@200;250;300;400;450;500;600&family=JetBrains+Mono:wght@300;400;500;700&display=swap"
    document.head.appendChild(l)
}

/* ── Texto que se MATERIALIZA (luz → forma), del centro hacia afuera —
      calco del MatrixWord del Sello del Pulso, con arranque parametrizable ── */
function MatrixWord({
    word,
    live,
    startMs = 1150,
    perMs = 62,
}: {
    word: string
    live: boolean
    startMs?: number
    perMs?: number
}) {
    const contRef = useRef<HTMLSpanElement | null>(null)
    const chars = useMemo(() => Array.from(word), [word])

    useEffect(() => {
        if (!live) return
        const cont = contRef.current
        if (!cont) return
        const nodes = Array.from(cont.querySelectorAll<HTMLElement>("[data-px]"))
        const n = nodes.length
        if (!n) return
        const mid = (n - 1) / 2
        const WIN = 210
        const t0 = performance.now()
        const resolved = new Array(n).fill(false)
        let left = n
        let lastG = 0
        let raf = 0
        const settleAll = () => {
            nodes.forEach((el) => {
                const real = el.children[0] as HTMLElement
                const g = el.children[1] as HTMLElement | undefined
                real.style.opacity = "1"
                if (g && g.textContent) g.textContent = ""
            })
        }
        const tick = (now: number) => {
            const t = now - t0
            const doGl = now - lastG > 46
            if (doGl) lastG = now
            for (let i = 0; i < n; i++) {
                if (resolved[i]) continue
                const at = startMs + Math.abs(i - mid) * perMs
                const el = nodes[i]
                const real = el.children[0] as HTMLElement
                const g = el.children[1] as HTMLElement
                if (t >= at) {
                    real.style.opacity = "1"
                    if (g.textContent) g.textContent = ""
                    resolved[i] = true
                    left--
                } else if (t >= at - WIN && doGl) {
                    g.textContent =
                        AND_GLYPHS[(Math.random() * AND_GLYPHS.length) | 0]
                    g.style.color = i % 3 === 0 ? AND_CYAN : AND_GOLD
                    g.style.opacity = String(0.45 + Math.random() * 0.55)
                }
            }
            if (left > 0) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        /* Safety: el texto SIEMPRE queda visible aunque rAF se congele. */
        const safety = window.setTimeout(
            settleAll,
            startMs + Math.ceil((n - 1) / 2) * perMs + 1000
        )
        return () => {
            cancelAnimationFrame(raf)
            window.clearTimeout(safety)
        }
    }, [live, startMs, perMs])

    return (
        <span ref={contRef}>
            {chars.map((c, i) =>
                c === " " ? (
                    <span
                        key={i}
                        style={{ display: "inline-block", width: "0.9em" }}
                    />
                ) : (
                    <span
                        key={i}
                        data-px=""
                        style={{
                            position: "relative",
                            display: "inline-block",
                            marginRight: "0.55em",
                        }}
                    >
                        <span
                            style={{
                                opacity: live ? 0 : 1,
                                transition: "opacity .14s linear",
                            }}
                        >
                            {c}
                        </span>
                        {live ? (
                            <span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    textAlign: "center",
                                    pointerEvents: "none",
                                    textShadow: "0 0 9px currentColor",
                                    fontWeight: 300,
                                }}
                            />
                        ) : null}
                    </span>
                )
            )}
        </span>
    )
}

/* ── El instrumento: SVG del pulso (calco del logo vivo) ── */
function PulsoSVG({ live }: { live: boolean }) {
    return (
        <svg className="rsv-and-svg" viewBox="0 0 400 170" aria-hidden="true">
            <defs>
                <linearGradient
                    id="rsvAndGrad"
                    gradientUnits="userSpaceOnUse"
                    x1="24"
                    y1="0"
                    x2="376"
                    y2="0"
                >
                    <stop offset="0" stopColor="#EDF4FF" stopOpacity=".92" />
                    <stop offset=".2" stopColor="#BFEFFF" />
                    <stop offset=".36" stopColor="#6FE3FF" />
                    <stop offset=".46" stopColor="#8FEAE2" />
                    <stop offset=".5" stopColor="#FFDFA0" />
                    <stop offset=".54" stopColor="#8FEAE2" />
                    <stop offset=".64" stopColor="#6FE3FF" />
                    <stop offset=".8" stopColor="#BFEFFF" />
                    <stop offset="1" stopColor="#EDF4FF" stopOpacity=".92" />
                </linearGradient>
                <radialGradient id="rsvAndCrestBloom">
                    <stop offset="0" stopColor="#FFF7E0" stopOpacity=".95" />
                    <stop offset=".45" stopColor="#FFD98E" stopOpacity=".35" />
                    <stop offset="1" stopColor="#FFD98E" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="rsvAndFlareV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFEFC4" stopOpacity="0" />
                    <stop offset=".5" stopColor="#FFF6DC" stopOpacity=".9" />
                    <stop offset="1" stopColor="#FFEFC4" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="rsvAndCometHalo">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
                    <stop offset=".45" stopColor="#9FE8FF" stopOpacity=".5" />
                    <stop offset="1" stopColor="#9FE8FF" stopOpacity="0" />
                </radialGradient>
                <linearGradient
                    id="rsvAndTrail"
                    gradientUnits="userSpaceOnUse"
                    x1="-20"
                    y1="0"
                    x2="2"
                    y2="0"
                >
                    <stop offset="0" stopColor="#9FE8FF" stopOpacity="0" />
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity=".9" />
                </linearGradient>
            </defs>
            {/* Standby: el instrumento espera señal. */}
            <line
                className="rsv-and-standby"
                x1="24"
                y1="116"
                x2="376"
                y2="116"
                stroke="rgba(160,215,255,.8)"
                strokeWidth="0.7"
                strokeDasharray="1 6"
            />
            {/* Reflejo comprimido bajo la línea (obsidiana). */}
            <g className="rsv-and-reflg" transform="matrix(1 0 0 -0.35 0 156.6)">
                <path
                    className="rsv-and-refl"
                    d={PULSE_D}
                    fill="none"
                    stroke="url(#rsvAndGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </g>
            {/* Halo neón del trazo. */}
            <g className="rsv-and-glowg">
                <path
                    className="rsv-and-glow"
                    d={PULSE_D}
                    fill="none"
                    stroke="url(#rsvAndGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    pathLength={100}
                />
            </g>
            {/* Trazo principal — el logo dibujado por luz. */}
            <path
                id="rsvAndPath"
                className="rsv-and-main"
                d={PULSE_D}
                fill="none"
                stroke="url(#rsvAndGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength={100}
            />
            {/* Corriente viva post-sello. */}
            <path
                className="rsv-and-runner"
                d={PULSE_D}
                fill="none"
                stroke="rgba(255,255,255,.85)"
                strokeWidth="2.1"
                strokeLinecap="round"
                pathLength={100}
            />
            {/* Ignición de la cresta. */}
            <circle
                className="rsv-and-crest rsv-and-bloom"
                cx="200"
                cy="54"
                r="17"
                fill="url(#rsvAndCrestBloom)"
            />
            <rect
                className="rsv-and-crest rsv-and-flarev"
                x="199.55"
                y="28"
                width="0.9"
                height="52"
                fill="url(#rsvAndFlareV)"
            />
            <circle
                className="rsv-and-crest rsv-and-ring rsv-and-ring-1"
                cx="200"
                cy="54"
                r="20"
                fill="none"
                stroke="rgba(255,226,170,.55)"
                strokeWidth="0.7"
            />
            <circle
                className="rsv-and-crest rsv-and-ring rsv-and-ring-2"
                cx="200"
                cy="54"
                r="20"
                fill="none"
                stroke="rgba(150,228,255,.45)"
                strokeWidth="0.6"
            />
            {/* Emisión lenta perpetua: la cresta sigue transmitiendo. */}
            <circle
                className="rsv-and-crest rsv-and-emit"
                cx="200"
                cy="54"
                r="16"
                fill="none"
                stroke="rgba(255,226,170,.4)"
                strokeWidth="0.6"
            />
            <circle
                className="rsv-and-crest rsv-and-emit rsv-and-emit-2"
                cx="200"
                cy="54"
                r="16"
                fill="none"
                stroke="rgba(150,228,255,.32)"
                strokeWidth="0.5"
            />
            <circle
                className="rsv-and-crest rsv-and-corestar"
                cx="200"
                cy="54"
                r="2.1"
                fill="#FFFDF2"
                style={{
                    filter: "drop-shadow(0 0 5px rgba(255,240,200,.9))",
                }}
            />
            {/* Cometa que dibuja el pulso (SMIL — solo en vivo). */}
            {live ? (
                <g opacity="0">
                    <ellipse
                        cx="-9"
                        cy="0"
                        rx="10"
                        ry="1.5"
                        fill="url(#rsvAndTrail)"
                    />
                    <circle r="6.5" fill="url(#rsvAndCometHalo)" />
                    <circle r="1.9" fill="#FFFFFF" />
                    <set
                        attributeName="opacity"
                        to="1"
                        begin="0.45s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="opacity"
                        from="1"
                        to="0"
                        begin="1.27s"
                        dur="0.22s"
                        fill="freeze"
                    />
                    <animateMotion
                        begin="0.45s"
                        dur="0.85s"
                        fill="freeze"
                        rotate="auto"
                        calcMode="linear"
                    >
                        <mpath href="#rsvAndPath" />
                    </animateMotion>
                </g>
            ) : null}
        </svg>
    )
}

/* ═══════════════════════════════════════════════════════════════════ */

export default function PortalAndroid(props: {
    supabaseUrl?: string
    supabaseAnonKey?: string
}) {
    const supabaseUrl = props.supabaseUrl || SB_URL_DEFAULT
    const supabaseAnonKey = props.supabaseAnonKey || SB_ANON_DEFAULT

    if (typeof document !== "undefined") {
        ensureAndCss()
        ensureAndFonts()
    }

    const reduced = useMemo(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false
        try {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        } catch {
            return false
        }
    }, [])

    const lang: "es" | "en" = useMemo(() => {
        if (typeof navigator === "undefined") return "es"
        const l = (navigator.language || "es").toLowerCase()
        return l.startsWith("en") ? "en" : "es"
    }, [])
    const T = TEXT[lang]

    /* Fase: el sello corre completo; "landing" solo revela el cuerpo. */
    const [phase, setPhase] = useState<"seal" | "landing">(() =>
        reduced ? "landing" : "seal"
    )
    const live = !reduced
    useEffect(() => {
        if (phase === "landing") return
        const t = window.setTimeout(() => setPhase("landing"), 2650)
        return () => window.clearTimeout(t)
    }, [phase])
    const skip = () => {
        if (phase === "seal") setPhase("landing")
    }

    /* Formulario. */
    const [email, setEmail] = useState("")
    const [st, setSt] = useState<"idle" | "sending" | "ok" | "done">(() => {
        try {
            return typeof window !== "undefined" &&
                window.localStorage.getItem(LS_KEY)
                ? "done"
                : "idle"
        } catch {
            return "idle"
        }
    })
    const [errMsg, setErrMsg] = useState("")
    const [shake, setShake] = useState(0)

    const submit = async (e?: { preventDefault?: () => void }) => {
        if (e && e.preventDefault) e.preventDefault()
        if (st === "sending" || st === "ok" || st === "done") return
        const v = email.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
            setErrMsg(T.errFormat)
            setShake((s) => s + 1)
            return
        }
        setErrMsg("")
        setSt("sending")
        try {
            const src = (() => {
                try {
                    const p = new URLSearchParams(window.location.search)
                    return p.get("src") || "landing_android"
                } catch {
                    return "landing_android"
                }
            })()
            const ctrl = new AbortController()
            const tOut = window.setTimeout(() => ctrl.abort(), 12000)
            const res = await fetch(
                `${supabaseUrl}/rest/v1/rpc/join_android_waitlist`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        p_email: v,
                        p_source: src,
                        p_locale: lang,
                    }),
                    signal: ctrl.signal,
                }
            )
            window.clearTimeout(tOut)
            const data = res.ok ? await res.json() : null
            if (data && data.success) {
                try {
                    window.localStorage.setItem(LS_KEY, v)
                } catch {}
                setSt("ok")
            } else if (data && data.error === "invalid_email") {
                setSt("idle")
                setErrMsg(T.errFormat)
                setShake((s) => s + 1)
            } else {
                setSt("idle")
                setErrMsg(T.errNet)
                setShake((s) => s + 1)
            }
        } catch {
            setSt("idle")
            setErrMsg(T.errNet)
            setShake((s) => s + 1)
        }
    }

    /* Estrellas + motas deterministas (SSR-safe). */
    const stars = useMemo(
        () =>
            Array.from({ length: 30 }, (_, i) => ({
                left: `${(det(i, 1) * 96 + 2).toFixed(2)}%`,
                top: `${(det(i, 2) * 94 + 2).toFixed(2)}%`,
                size: det(i, 3) < 0.75 ? 1 : 1.6,
                o0: (0.05 + det(i, 4) * 0.1).toFixed(2),
                o1: (0.3 + det(i, 5) * 0.4).toFixed(2),
                dur: `${(3.6 + det(i, 6) * 4.8).toFixed(2)}s`,
                del: `${(-det(i, 7) * 8).toFixed(2)}s`,
                tint:
                    det(i, 8) < 0.14
                        ? "rgba(255,223,160,.9)"
                        : det(i, 8) > 0.86
                          ? "rgba(140,225,255,.9)"
                          : "#fff",
            })),
        []
    )

    /* Semillas de la estática del sello. */
    const seeds = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => ({
                g: AND_GLYPHS[(det(i, 9) * AND_GLYPHS.length) | 0],
                c: i % 3 === 0 ? AND_CYAN : i % 5 === 0 ? AND_GOLD : AND_DIM,
                o: 0.25 + det(i, 10) * 0.45,
            })),
        []
    )
    const staticRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        if (!live) return
        const cont = staticRef.current
        if (!cont) return
        const spans = Array.from(cont.children) as HTMLElement[]
        const t0 = performance.now()
        let last = 0
        let raf = 0
        const tick = (now: number) => {
            if (now - t0 > 1250) return
            if (now - last > 55) {
                last = now
                for (const s of spans) {
                    if (Math.random() < 0.6) {
                        s.textContent =
                            AND_GLYPHS[(Math.random() * AND_GLYPHS.length) | 0]
                        s.style.opacity = String(0.2 + Math.random() * 0.6)
                    }
                }
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [live])

    const anchored = st === "ok" || st === "done"

    return (
        <div
            className="rsv-and-root"
            data-and-phase={phase}
            onPointerDown={phase === "seal" ? skip : undefined}
        >
            {/* Atmósfera */}
            <div className="rsv-and-bg">
                <div className="rsv-and-blob rsv-and-blob-c" />
                <div className="rsv-and-blob rsv-and-blob-g" />
                {stars.map((s, i) => (
                    <span
                        key={i}
                        className="rsv-and-star"
                        style={
                            {
                                left: s.left,
                                top: s.top,
                                width: s.size,
                                height: s.size,
                                background: s.tint,
                                "--o0": s.o0,
                                "--o1": s.o1,
                                "--dur": s.dur,
                                "--del": s.del,
                            } as React.CSSProperties
                        }
                    />
                ))}
                <div className="rsv-and-vig" />
                {live && phase === "seal" ? (
                    <div className="rsv-and-scan" />
                ) : null}
            </div>

            {/* Hero: el Sello del Pulso (nace al centro, se asienta arriba) */}
            <div className="rsv-and-hero">
                <div className="rsv-and-geo">
                    <PulsoSVG live={live} />
                    {live && phase === "seal" ? (
                        <div
                            ref={staticRef}
                            className="rsv-and-static"
                            aria-hidden="true"
                        >
                            {seeds.map((s, i) => (
                                <span
                                    key={i}
                                    style={{ color: s.c, opacity: s.o }}
                                >
                                    {s.g}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
                <div className="rsv-and-word">
                    <MatrixWord word={T.wordmark} live={live} />
                </div>
            </div>

            {/* Cuerpo (se materializa al asentarse el sello) */}
            <div className="rsv-and-body">
                <div
                    className="rsv-and-badge rsv-and-rev"
                    style={{ "--d": "0.1s" } as React.CSSProperties}
                >
                    <i />
                    {T.badge}
                </div>
                <h1
                    className="rsv-and-title rsv-and-rev"
                    style={{ "--d": "0.22s" } as React.CSSProperties}
                >
                    {lang === "es" ? (
                        <>
                            El Escáner Vibracional llega a <b>Android</b>
                        </>
                    ) : (
                        <>
                            Escáner Vibracional is coming to <b>Android</b>
                        </>
                    )}
                </h1>
                <p
                    className="rsv-and-sub rsv-and-rev"
                    style={{ "--d": "0.34s" } as React.CSSProperties}
                >
                    {T.sub}
                </p>

                {/* Terminal de registro */}
                <div
                    className="rsv-and-term rsv-and-rev"
                    style={{ "--d": "0.48s" } as React.CSSProperties}
                >
                    <span className="rsv-and-brk rsv-and-brk-tl" />
                    <span className="rsv-and-brk rsv-and-brk-tr" />
                    <span className="rsv-and-brk rsv-and-brk-bl" />
                    <span className="rsv-and-brk rsv-and-brk-br" />
                    <div className="rsv-and-scanline" />
                    <div className="rsv-and-termhead">
                        <span className="led" data-ok={anchored ? "1" : "0"} />
                        <span className="glyph">◇</span>
                        <span>{T.termLabel}</span>
                    </div>

                    {anchored ? (
                        <div className="rsv-and-okwrap">
                            {st === "ok" ? (
                                <>
                                    <span className="rsv-and-okring" />
                                    <span className="rsv-and-okring rsv-and-okring-2" />
                                </>
                            ) : null}
                            <svg
                                className="rsv-and-okstar"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
                                    fill="#FFE9BD"
                                    style={{
                                        filter: "drop-shadow(0 0 6px rgba(255,217,142,.9))",
                                    }}
                                />
                            </svg>
                            <div className="rsv-and-oktitle">
                                <MatrixWord
                                    word={T.okTitle}
                                    live={st === "ok" && live}
                                    startMs={140}
                                    perMs={52}
                                />
                            </div>
                            <p className="rsv-and-okbody">
                                {st === "ok" ? T.okBody : T.doneBody}
                            </p>
                        </div>
                    ) : (
                        <form noValidate onSubmit={submit} key={shake === 0 ? undefined : shake}
                            style={
                                shake
                                    ? { animation: "andShake .45s ease both" }
                                    : undefined
                            }
                        >
                            <div className="rsv-and-field">
                                <span className="pre">▸</span>
                                <input
                                    className="rsv-and-input"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    placeholder={T.placeholder}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (errMsg) setErrMsg("")
                                    }}
                                    disabled={st === "sending"}
                                    aria-label={T.placeholder}
                                />
                            </div>
                            {errMsg ? (
                                <div className="rsv-and-err">{errMsg}</div>
                            ) : null}
                            <button
                                className="rsv-and-btn"
                                type="submit"
                                disabled={st === "sending"}
                            >
                                {st === "sending" ? (
                                    <>
                                        {T.btnSending}{" "}
                                        <span className="rsv-and-dots">
                                            <span>·</span>
                                            <span>·</span>
                                            <span>·</span>
                                        </span>
                                    </>
                                ) : (
                                    T.btn
                                )}
                            </button>
                            <div className="rsv-and-note">{T.note}</div>
                        </form>
                    )}
                </div>

                <div
                    className="rsv-and-foot rsv-and-rev"
                    style={{ "--d": "0.62s" } as React.CSSProperties}
                >
                    {T.foot}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(PortalAndroid, {
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: SB_URL_DEFAULT,
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Supabase Anon Key",
        defaultValue: SB_ANON_DEFAULT,
    },
})
