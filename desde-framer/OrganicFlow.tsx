import * as React from "react"

/**
 * GesturePointer_Stable
 * - Cursor visible siempre (z-index max), opacidad dinámica (idle/activo).
 * - Loader robusto: jsDelivr → unpkg, ESM → UMD.
 * - Motores: GestureRecognizer → fallback HandLandmarker.
 * - Modelos: intenta TU DOMINIO (localModelsBase) → GCS oficial.
 * - Movimiento por PALMA con filtro One-Euro.
 * - Pinch-click (freeze + hold) + Dwell-click + Calibración 2 puntos.
 */

export default function GesturePointer_Stable() {
    const [enabled, setEnabled] = React.useState(false)
    const [engine, setEngine] = React.useState<
        "recognizer" | "landmarker" | "none"
    >("none")
    const [calibMode, setCalibMode] = React.useState<
        "off" | "topLeft" | "bottomRight"
    >("off")
    const [dwellEnabled, setDwellEnabled] = React.useState(true)

    /* ---------- Refs base ---------- */
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const runtimeRef = React.useRef<any>(null) // recognizer o landmarker
    const streamRef = React.useRef<MediaStream | null>(null)
    const cursorRef = React.useRef<HTMLDivElement | null>(null)

    // Cursor en píxeles (modo relativo)
    const curXRef = React.useRef<number>(window.innerWidth / 2)
    const curYRef = React.useRef<number>(window.innerHeight / 2)

    // Palma filtrada / cruda
    const lastPalmRawRef = React.useRef<{ x: number; y: number } | null>(null)
    const filteredPalmRef = React.useRef<{ x: number; y: number }>({
        x: 0.5,
        y: 0.5,
    })

    // Freeze + pinch
    const freezeRef = React.useRef<{ active: boolean; x: number; y: number }>({
        active: false,
        x: 0,
        y: 0,
    })
    const pinchingSinceRef = React.useRef<number | null>(null)
    const pinchedOnceRef = React.useRef<boolean>(false)
    const lastClickTsRef = React.useRef<number>(0)

    // Dwell
    const dwellBaseRef = React.useRef<{ x: number; y: number } | null>(null)
    const lastMoveTsRef = React.useRef<number>(Date.now())

    // Calibración
    const calibRef = React.useRef<{
        has: boolean
        tl: { x: number; y: number } | null
        br: { x: number; y: number } | null
    }>({ has: false, tl: null, br: null })

    /* ---------- Tuning ---------- */
    const MIRROR_X = true
    const DEADZONE = 0.003
    const GAIN_X = 4.2,
        GAIN_Y = 3.8 // si no hay calibración
    const PINCH_DIST = 0.055 // umbral pinch (norm)
    const PINCH_HOLD_MS = 140
    const DWELL_MS = 650,
        DWELL_PIX = 8

    const MATRIX = "#00FF41",
        NEON = "#00C2FF"

    /* ---------- One-Euro filter ---------- */
    const ONE_EURO_MIN = 1.2,
        ONE_EURO_BETA = 0.02,
        ONE_EURO_D = 1.5
    class LP {
        y = 0
        s = 0
        init = false
        alpha(a: number, dt: number) {
            return 1 / (1 + 1 / (a * dt))
        }
        filter(v: number, a: number, dt: number) {
            if (!this.init) {
                this.y = v
                this.s = v
                this.init = true
                return v
            }
            this.s = this.s + this.alpha(a, dt) * (v - this.s)
            this.y = this.s
            return this.y
        }
    }
    class OneEuro {
        last = performance.now()
        xf = new LP()
        dx = new LP()
        yf = new LP()
        dy = new LP()
        constructor(
            public min = ONE_EURO_MIN,
            public beta = ONE_EURO_BETA,
            public d = ONE_EURO_D
        ) {}
        smooth(x: number, y: number) {
            const now = performance.now(),
                dt = Math.max((now - this.last) / 1000, 1 / 120)
            this.last = now
            const ddx = this.xf.init ? (x - this.xf.y) / dt : 0,
                ddy = this.yf.init ? (y - this.yf.y) / dt : 0
            const edx = this.dx.filter(ddx, this.d, dt),
                edy = this.dy.filter(ddy, this.d, dt)
            const cx = this.min + this.beta * Math.abs(edx),
                cy = this.min + this.beta * Math.abs(edy)
            return {
                x: this.xf.filter(x, cx, dt),
                y: this.yf.filter(y, cy, dt),
            }
        }
    }
    const euroRef = React.useRef(new OneEuro())

    /* ---------- Loader robusto ---------- */
    const CDN_BASES = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8",
        "https://unpkg.com/@mediapipe/tasks-vision@0.10.8",
    ]

    // Cambia esto si hospedas en tu dominio:
    const localModelsBase = "https://www.redsolarviva.com/models" // ← personaliza
    const MODEL_RECO_LOCAL = `${localModelsBase}/gesture/gesture_recognizer.task`
    const MODEL_LM_LOCAL = `${localModelsBase}/hand/hand_landmarker.task`

    // Oficiales (GCS)
    const MODEL_RECO_GCS =
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float32/1/gesture_recognizer.task"
    const MODEL_LM_GCS =
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

    async function importESM(base: string) {
        return await import(/* @vite-ignore */ `${base}/vision_bundle.mjs`)
    }
    async function importUMD(base: string) {
        if ((globalThis as any).vision) return (globalThis as any).vision
        await new Promise<void>((res, rej) => {
            const s = document.createElement("script")
            s.src = `${base}/vision_bundle.js`
            s.async = true
            s.crossOrigin = "anonymous"
            s.onload = () => res()
            s.onerror = () => rej(new Error("umd-fail"))
            document.head.appendChild(s)
        })
        const v = (globalThis as any).vision
        if (!v) throw new Error("umd-global")
        return v
    }

    async function pickFirstReachable(urls: string[]) {
        for (const u of urls) {
            try {
                const r = await fetch(u, {
                    method: "HEAD",
                    mode: "cors",
                    cache: "no-store",
                })
                if (r.ok) return u
            } catch {}
        }
        // Si HEAD está bloqueado por CORS, intentamos GET pequeño (no descarga completa, pero prueba acceso)
        for (const u of urls) {
            try {
                const r = await fetch(u, {
                    method: "GET",
                    mode: "cors",
                    cache: "no-store",
                })
                if (r.ok) return u
            } catch {}
        }
        throw new Error("no-model-access")
    }

    const loadRuntime = React.useCallback(async () => {
        let vision: any = null,
            baseUsed = "",
            mode: "esm" | "umd" = "esm"
        // 1) runtime vision
        for (const base of CDN_BASES) {
            try {
                vision = await importESM(base)
                baseUsed = base
                mode = "esm"
                break
            } catch {
                try {
                    vision = await importUMD(base)
                    baseUsed = base
                    mode = "umd"
                    break
                } catch {}
            }
        }
        if (!vision) throw new Error("vision-load-failed")
        const fileset = await vision.FilesetResolver.forVisionTasks(
            `${baseUsed}/wasm`
        )

        // 2) model: intenta local → GCS
        const recoUrl = await pickFirstReachable([
            MODEL_RECO_LOCAL,
            MODEL_RECO_GCS,
        ]).catch(() => null)
        const lmUrl = await pickFirstReachable([
            MODEL_LM_LOCAL,
            MODEL_LM_GCS,
        ]).catch(() => null)

        // 3) intentar GestureRecognizer primero
        try {
            if (!vision.GestureRecognizer || !recoUrl)
                throw new Error("no-gesture")
            const rec = await vision.GestureRecognizer.createFromOptions(
                fileset,
                {
                    baseOptions: { modelAssetPath: recoUrl, delegate: "GPU" },
                    runningMode: "VIDEO",
                    numHands: 1,
                }
            )
            runtimeRef.current = rec
            setEngine("recognizer")
            console.log(
                "[RSV] GestureRecognizer cargado:",
                mode,
                "runtime:",
                baseUsed,
                "| model:",
                recoUrl
            )
            return
        } catch (e) {
            console.warn(
                "[RSV] GestureRecognizer falló, probando HandLandmarker…",
                e
            )
        }

        // 4) fallback a HandLandmarker
        if (!lmUrl) throw new Error("no-lm-model")
        const lm = await vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: lmUrl, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 1,
        })
        runtimeRef.current = lm
        setEngine("landmarker")
        console.log(
            "[RSV] HandLandmarker cargado:",
            mode,
            "runtime:",
            baseUsed,
            "| model:",
            lmUrl
        )
    }, [])

    /* ---------- Cámara ---------- */
    const startCamera = React.useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia)
            throw new Error("no-getusermedia")
        if (!videoRef.current) throw new Error("no-video-el")
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
            },
            audio: false,
        })
        streamRef.current = stream
        const v = videoRef.current
        v.srcObject = stream
        v.muted = true
        v.playsInline = true
        await new Promise<void>((r) => {
            if (v.readyState >= 1) return r()
            v.onloadedmetadata = () => r()
        })
        try {
            await v.play()
        } catch {}
    }, [])

    /* ---------- Utilidades ---------- */
    function clamp(v: number, min: number, max: number) {
        return Math.max(min, Math.min(max, v))
    }
    function palmCenter(lm: any[]) {
        const w = lm[0],
            i = lm[5],
            p = lm[17]
        let x = (w.x + i.x + p.x) / 3,
            y = (w.y + i.y + p.y) / 3
        if (MIRROR_X) x = 1 - x
        return { x, y }
    }
    function pinchDistance(lm: any[]) {
        const a = lm[4],
            b = lm[8]
        const ax = MIRROR_X ? 1 - a.x : a.x,
            bx = MIRROR_X ? 1 - b.x : b.x
        return Math.hypot(ax - bx, a.y - b.y)
    }

    function applyCalibration(nx: number, ny: number) {
        const c = calibRef.current
        if (!c.has || !c.tl || !c.br) return { nx, ny, used: false }
        const cx = (nx - c.tl.x) / Math.max(0.001, c.br.x - c.tl.x),
            cy = (ny - c.tl.y) / Math.max(0.001, c.br.y - c.tl.y)
        return { nx: clamp(cx, 0, 1), ny: clamp(cy, 0, 1), used: true }
    }

    function elementClickAt(x: number, y: number) {
        const now = Date.now()
        if (now - lastClickTsRef.current < 350) return
        lastClickTsRef.current = now
        const el = document.elementFromPoint(x, y) as HTMLElement | null
        if (!el) return
        const evt = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
        })
        el.dispatchEvent(evt)
        cursorRef.current?.animate(
            [
                { transform: "translate(-50%,-50%) scale(1)" },
                { transform: "translate(-50%,-50%) scale(.85)" },
                { transform: "translate(-50%,-50%) scale(1)" },
            ],
            { duration: 160, easing: "ease-out" }
        )
    }

    /* ---------- Cursor: crear siempre visible ---------- */
    React.useEffect(() => {
        if (!cursorRef.current) {
            const el = document.createElement("div")
            el.style.cssText = `
        position: fixed;
        left: 50vw; top: 50vh;
        width: 24px; height: 24px;
        transform: translate(-50%,-50%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 2147483647;
        display: block;
        opacity: .35; /* idle */
        background:
          radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(255,255,255,.3) 35%, rgba(255,255,255,0) 60%),
          radial-gradient(circle, var(--accent, ${NEON}) 0%, rgba(0,0,0,0) 70%);
        box-shadow:
          0 0 10px var(--accent, ${NEON}),
          0 0 24px color-mix(in oklab, var(--accent, ${NEON}) 40%, transparent);
      `
            document.body.appendChild(el)
            cursorRef.current = el
        }
        return () => {
            cursorRef.current?.remove()
            cursorRef.current = null
        }
    }, [])

    /* ---------- Loop principal ---------- */
    const runLoop = React.useCallback(() => {
        const v = videoRef.current,
            rt = runtimeRef.current
        if (!v || !rt) return
        const ts = performance.now()
        let lm: any[] | null = null

        if (engine === "recognizer") {
            const out = rt.recognizeForVideo(v, ts)
            if (out?.landmarks?.length) lm = out.landmarks[0]
        } else if (engine === "landmarker") {
            const out = rt.detectForVideo(v, ts)
            if (out?.landmarks?.length) lm = out.landmarks[0]
        }

        if (lm) {
            // PALMA normalizada (0..1) + espejo X
            let palm = palmCenter(lm)
            // Calibración (si existe)
            const cal = applyCalibration(palm.x, palm.y)
            palm = { x: cal.nx, y: cal.ny }

            // Suavizado One-Euro + deadzone
            const sm = euroRef.current.smooth(palm.x, palm.y)
            let nx = sm.x,
                ny = sm.y
            if (lastPalmRawRef.current) {
                const dx = Math.abs(nx - lastPalmRawRef.current.x),
                    dy = Math.abs(ny - lastPalmRawRef.current.y)
                if (dx < DEADZONE) nx = lastPalmRawRef.current.x
                if (dy < DEADZONE) ny = lastPalmRawRef.current.y
            }
            lastPalmRawRef.current = { x: nx, y: ny }

            // Movimiento relativo con ganancia (o 1:1 si calibrado)
            const useGain = cal.used
                ? { gx: 1, gy: 1 }
                : { gx: GAIN_X, gy: GAIN_Y }
            if (!freezeRef.current.active) {
                const targetX = clamp(
                    curXRef.current +
                        (nx - filteredPalmRef.current.x) *
                            useGain.gx *
                            window.innerWidth,
                    0,
                    window.innerWidth
                )
                const targetY = clamp(
                    curYRef.current +
                        (ny - filteredPalmRef.current.y) *
                            useGain.gy *
                            window.innerHeight,
                    0,
                    window.innerHeight
                )
                curXRef.current = targetX
                curYRef.current = targetY
                filteredPalmRef.current = { x: nx, y: ny }
            }

            // --- DIBUJO DEL CURSOR (activo) ---
            const drawX = freezeRef.current.active
                ? freezeRef.current.x
                : curXRef.current
            const drawY = freezeRef.current.active
                ? freezeRef.current.y
                : curYRef.current
            if (cursorRef.current) {
                cursorRef.current.style.left = `${drawX}px`
                cursorRef.current.style.top = `${drawY}px`
                cursorRef.current.style.opacity = "1" // activo
            }

            // PINCH (distancia pulgar-índice) → freeze + micro-hold → click
            const dist = pinchDistance(lm)
            const now = Date.now()
            const isPinching = dist < PINCH_DIST

            if (isPinching) {
                if (!freezeRef.current.active) {
                    freezeRef.current = { active: true, x: drawX, y: drawY }
                    pinchingSinceRef.current = now
                    pinchedOnceRef.current = false
                } else {
                    if (
                        !pinchedOnceRef.current &&
                        pinchingSinceRef.current &&
                        now - pinchingSinceRef.current >= PINCH_HOLD_MS
                    ) {
                        elementClickAt(freezeRef.current.x, freezeRef.current.y)
                        pinchedOnceRef.current = true
                    }
                }
            } else {
                if (freezeRef.current.active) {
                    freezeRef.current.active = false
                    curXRef.current = drawX
                    curYRef.current = drawY
                }
                pinchingSinceRef.current = null
                pinchedOnceRef.current = false
                dwellBaseRef.current = null
                lastMoveTsRef.current = now
            }

            // Dwell si no hay pinch
            if (!isPinching && dwellEnabled) {
                const base = dwellBaseRef.current
                if (!base) {
                    dwellBaseRef.current = { x: drawX, y: drawY }
                    lastMoveTsRef.current = now
                } else {
                    const d = Math.hypot(drawX - base.x, drawY - base.y)
                    if (d > DWELL_PIX) {
                        dwellBaseRef.current = { x: drawX, y: drawY }
                        lastMoveTsRef.current = now
                    } else if (now - lastMoveTsRef.current >= DWELL_MS) {
                        elementClickAt(drawX, drawY)
                        lastMoveTsRef.current = now + 999999 // espera hasta moverte
                    }
                }
            }
        } else {
            // sin mano → cursor idle visible
            if (cursorRef.current) cursorRef.current.style.opacity = ".35"
            lastPalmRawRef.current = null
            dwellBaseRef.current = null
            freezeRef.current.active = false
        }

        rafRef.current = requestAnimationFrame(runLoop)
    }, [
        engine,
        DEADZONE,
        GAIN_X,
        GAIN_Y,
        PINCH_DIST,
        PINCH_HOLD_MS,
        DWELL_MS,
        DWELL_PIX,
        dwellEnabled,
    ])

    /* ---------- Lifecycle ---------- */
    React.useEffect(() => {
        ;(async () => {
            if (!enabled) {
                stopAll()
                return
            }
            try {
                await loadRuntime()
            } catch (e: any) {
                console.error("[RSV] Error runtime/modelos:", e)
                alert(
                    "No se pudo cargar el runtime/modelo. Probé GestureRecognizer y Landmarker.\nSugerencia: hospeda los .task en /models de tu dominio."
                )
                setEnabled(false)
                return
            }
            try {
                await startCamera()
                rafRef.current = requestAnimationFrame(runLoop)
            } catch (e: any) {
                console.error(e)
                alert("No se pudo acceder a la cámara.")
                setEnabled(false)
            }
        })()
        return () => {
            stopAll()
        }
    }, [enabled, loadRuntime, startCamera, runLoop])

    function stopAll() {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        runtimeRef.current = null
        setEngine("none")
        if (cursorRef.current) cursorRef.current.style.opacity = ".35"
    }

    /* ---------- UI ---------- */
    // targets de prueba
    const [targets, setTargets] = React.useState([
        { id: 1, left: "18vw", top: "28vh", active: false },
        { id: 2, left: "50vw", top: "32vh", active: false },
        { id: 3, left: "82vw", top: "44vh", active: false },
        { id: 4, left: "30vw", top: "70vh", active: false },
        { id: 5, left: "72vw", top: "66vh", active: false },
    ])

    return (
        <div style={{ position: "relative", zIndex: 1 }}>
            {/* Mini-preview video para debug (opcional) */}
            <video
                ref={videoRef}
                playsInline
                muted
                style={{
                    position: "fixed",
                    right: 12,
                    bottom: 12,
                    width: 200,
                    height: "auto",
                    opacity: 0.22,
                    zIndex: 2147483647,
                    pointerEvents: "none",
                    display: enabled ? "block" : "none",
                }}
            />

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    color: "#fff",
                }}
            >
                <button
                    onClick={() => setEnabled((v) => !v)}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid color-mix(in oklab, var(--accent, ${NEON}) 55%, transparent)`,
                        background: enabled
                            ? "rgba(0,255,65,.15)"
                            : "rgba(0,153,255,.12)",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    {enabled
                        ? "Desactivar control por mano"
                        : "Activar control por mano"}
                </button>

                <button
                    onClick={() => {
                        calibRef.current = { has: false, tl: null, br: null }
                        setCalibMode("topLeft")
                        alert(
                            "Apunta la PALMA a tu esquina superior-izquierda de gesto y haz PINCH. Después te pedirá la inferior-derecha."
                        )
                    }}
                    disabled={!enabled}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,.2)",
                        background: "rgba(255,255,255,.06)",
                        color: "#fff",
                        cursor: enabled ? "pointer" : "not-allowed",
                    }}
                >
                    Calibrar (2 puntos)
                </button>

                <label
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <input
                        type="checkbox"
                        checked={dwellEnabled}
                        onChange={(e) => {
                            dwellBaseRef.current = null
                            lastMoveTsRef.current = Date.now()
                            setDwellEnabled(e.target.checked)
                        }}
                    />
                    Dwell click
                </label>

                <small style={{ opacity: 0.85 }}>
                    Motor:{" "}
                    {engine === "recognizer"
                        ? "GestureRecognizer"
                        : engine === "landmarker"
                          ? "HandLandmarker (fallback)"
                          : "—"}
                    {" · "}Palma para mover · Pinch = click (freeze) · Dwell
                    opcional
                </small>
            </div>

            {/* Mensaje guiado de calibración */}
            {calibMode !== "off" && (
                <div
                    style={{
                        marginTop: 8,
                        color: "#fff",
                        fontSize: 14,
                        opacity: 0.9,
                    }}
                >
                    {calibMode === "topLeft"
                        ? "Apunta tu PALMA a la ESQUINA SUPERIOR IZQUIERDA (límite de gesto) y haz PINCH…"
                        : "Ahora a la ESQUINA INFERIOR DERECHA y haz PINCH…"}
                </div>
            )}

            {/* Targets de prueba */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 999998,
                    pointerEvents: "none",
                }}
                aria-hidden
            >
                {targets.map((t) => (
                    <button
                        key={t.id}
                        onClick={() =>
                            setTargets((prev) =>
                                prev.map((p) =>
                                    p.id === t.id
                                        ? { ...p, active: !p.active }
                                        : p
                                )
                            )
                        }
                        aria-label={`Objetivo ${t.id}`}
                        style={{
                            position: "absolute",
                            left: t.left,
                            top: t.top,
                            width: 56,
                            height: 56,
                            transform: "translate(-50%,-50%)",
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,.15)",
                            background: t.active
                                ? `radial-gradient(circle, #fff 8%, ${NEON} 55%, rgba(0,0,0,0) 80%)`
                                : `radial-gradient(circle, #fff 8%, ${MATRIX} 55%, rgba(0,0,0,0) 80%)`,
                            boxShadow: t.active
                                ? `0 0 12px ${NEON}, 0 0 28px color-mix(in oklab, ${NEON} 40%, transparent), inset 0 0 10px rgba(0,0,0,.35)`
                                : `0 0 12px ${MATRIX}, 0 0 28px color-mix(in oklab, ${MATRIX} 40%, transparent), inset 0 0 10px rgba(0,0,0,.35)`,
                            pointerEvents: "auto",
                            cursor: "default",
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
