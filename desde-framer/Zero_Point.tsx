// Get Started: https://www.framer.com/developers

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * ZeroPoint — SVG animado como Code Component para Framer
 * - Botones: Cambiar contraste, Pulso -, Reset, Pulso +
 * - Props: velocidad inicial, mostrar descargo, colores base
 * - Sin <html>/<head>/<body>. Todo embebido en React
 */

type Props = {
    initialSpeed: number
    showDisclaimer: boolean
    bg: string
    ink: string
    gold: string
    aqua: string
    vio: string
    emer: string
    amber: string
}

export default function ZeroPoint({
    initialSpeed = 1,
    showDisclaimer = false,
    bg = "#0b1020",
    ink = "#e8f1ff",
    gold = "#f8d56b",
    aqua = "#66e1ff",
    vio = "#7aa0ff",
    emer = "#3de0a6",
    amber = "#ffb86b",
}: Props) {
    const [speed, setSpeed] = React.useState(initialSpeed)
    const [dark, setDark] = React.useState(true)

    // Variables CSS para colores y velocidad
    const themeVars: React.CSSProperties = {
        // colores
        ["--bg" as any]: dark ? bg : "#0a0a0a",
        ["--ink" as any]: ink,
        ["--gold" as any]: gold,
        ["--aqua" as any]: aqua,
        ["--vio" as any]: vio,
        ["--emer" as any]: emer,
        ["--amber" as any]: amber,
        // velocidad
        ["--speed" as any]: String(speed),
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                ...themeVars,
                color: "var(--ink)",
                background: "var(--bg)",
                font: '16px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
            }}
        >
            {/* Estilos (clases + animaciones) */}
            <style>{`
        .wrap{max-width:1120px;margin:auto;padding:24px}
        h1{font-size:clamp(24px,3vw,36px);letter-spacing:.5px;margin:0 0 8px}
        .sub{opacity:.8;margin:0 0 16px}
        .grid{display:grid;grid-template-columns:1.2fr .8fr;gap:24px}
        @media (max-width:960px){.grid{grid-template-columns:1fr}}
        .card{background:linear-gradient(180deg,#121a35,#0a0f22);border:1px solid #263055;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35);padding:16px 16px}
        .legend{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px}
        .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:#0e1430;border:1px solid #27335c}
        .dot{width:10px;height:10px;border-radius:50%}
        .muted{opacity:.8}
        details{border:1px solid #27335c;border-radius:12px;padding:10px 12px;margin:10px 0;background:#0d1531}
        summary{cursor:pointer;font-weight:600}
        .kbd{font:600 12px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;background:#0e1430;border:1px solid #2a3563;border-radius:6px;padding:2px 6px}
        .btn{cursor:pointer;border:1px solid #2d3a6e;background:#0d1531;color:var(--ink);padding:8px 12px;border-radius:10px}
        .btn:hover{filter:brightness(1.1)}
        .note{font-size:13px;opacity:.9}

        /* SVG styling + animations */
        svg{width:100%;height:auto;display:block}
        .glass{fill:rgba(255,255,255,.05);stroke:#2a3563}
        .coil{stroke:var(--aqua);stroke-width:2.2;fill:none;filter:url(#glowA)}
        .coilB{stroke:var(--emer);stroke-width:2;fill:none;filter:url(#glowB)}
        .pulse{stroke:var(--gold);stroke-width:1.6;fill:none;opacity:.75;filter:url(#soft)}
        .field{stroke:var(--vio);stroke-width:1;fill:none;opacity:.35}
        .node{fill:var(--gold)}
        .label{fill:#e9f3ff;font-size:12px;letter-spacing:.3px}
        .dim{fill:#8ab4ff;font-size:11px;opacity:.85}
        .hot{fill:transparent;cursor:pointer}
        .port{fill:#0d1531;stroke:#36509b}
        .out{stroke:var(--amber);stroke-width:2}

        @keyframes swirlA{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-260}}
        @keyframes swirlB{0%{stroke-dashoffset:0}100%{stroke-dashoffset:260}}
        @keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes blink{0%,95%,100%{opacity:.2}20%{opacity:.8}}

        /* La magia: velocidad controlada por --speed */
        .flowA{stroke-dasharray:18 8;animation:swirlA calc(6s / var(--speed, 1)) linear infinite}
        .flowB{stroke-dasharray:14 10;animation:swirlB calc(7s / var(--speed, 1)) linear infinite}
        .breath{animation:breathe calc(3.5s / var(--speed, 1)) ease-in-out infinite}
        .blink{animation:blink 2.4s ease-in-out infinite}
      `}</style>

            <div className="wrap">
                <h1>Zero-Point v1 · Mapa toroidal (versión simple)</h1>
                <p className="sub">
                    Diagrama animado para <strong>recordar</strong> y{" "}
                    <strong>densificar</strong>: núcleo zero-point →
                    acondicionamiento → salidas de uso diario (USB-C 5–9V y DC
                    12V).
                </p>

                <div className="grid">
                    {/* SVG DIAGRAM */}
                    <div className="card">
                        <svg
                            viewBox="0 0 900 600"
                            role="img"
                            aria-labelledby="t d"
                        >
                            <title id="t">
                                Zero-Point v1 — Diagrama animado
                            </title>
                            <desc id="d">
                                Toroide, núcleo, bobinas de captura,
                                rectificación, regulación y salidas USB-C / DC.
                                Campos animados representados por líneas en
                                espiral.
                            </desc>

                            {/* defs */}
                            <defs>
                                <filter
                                    id="glowA"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >
                                    <feGaussianBlur
                                        stdDeviation="2.5"
                                        result="b"
                                    />
                                    <feMerge>
                                        <feMergeNode in="b" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <filter
                                    id="glowB"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >
                                    <feGaussianBlur
                                        stdDeviation="1.8"
                                        result="b"
                                    />
                                    <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -10" />
                                </filter>
                                <filter
                                    id="soft"
                                    x="-30%"
                                    y="-30%"
                                    width="160%"
                                    height="160%"
                                >
                                    <feGaussianBlur stdDeviation="1.2" />
                                </filter>
                                <radialGradient
                                    id="gCore"
                                    cx="50%"
                                    cy="50%"
                                    r="50%"
                                >
                                    <stop offset="0%" stopColor="#fff8d2" />
                                    <stop offset="55%" stopColor="#ffd35a" />
                                    <stop
                                        offset="100%"
                                        stopColor="#ffb84c"
                                        stopOpacity=".1"
                                    />
                                </radialGradient>
                            </defs>

                            {/* panel base */}
                            <rect
                                x="10"
                                y="10"
                                width="880"
                                height="580"
                                rx="18"
                                className="glass"
                            />

                            {/* toroide principal (campo) */}
                            <g transform="translate(300,300)">
                                <ellipse
                                    rx="180"
                                    ry="110"
                                    className="field flowA"
                                />
                                <ellipse
                                    rx="220"
                                    ry="135"
                                    className="field flowB"
                                />
                                <ellipse
                                    rx="140"
                                    ry="88"
                                    className="field flowB"
                                    style={{ animationDuration: "9s" }}
                                />
                                {/* bobina captora doble */}
                                <g>
                                    <path
                                        d="M-210,0 C-210,-70 -90,-110 0,-110 C90,-110 210,-70 210,0"
                                        className="coil flowA"
                                    />
                                    <path
                                        d="M-210,0 C-210,70 -90,110 0,110 C90,110 210,70 210,0"
                                        className="coilB flowB"
                                    />
                                </g>
                                {/* núcleo zero-point */}
                                <circle
                                    r="36"
                                    fill="url(#gCore)"
                                    className="breath"
                                />
                                <text
                                    y="-48"
                                    textAnchor="middle"
                                    className="label"
                                >
                                    Núcleo Zero-Point
                                </text>
                            </g>

                            {/* puente/rectificación & regulación */}
                            <g transform="translate(590,210)">
                                <rect
                                    width="210"
                                    height="210"
                                    rx="14"
                                    className="port"
                                />
                                <text
                                    x="105"
                                    y="-10"
                                    textAnchor="middle"
                                    className="label"
                                >
                                    Acondicionamiento
                                </text>
                                <text
                                    x="105"
                                    y="22"
                                    textAnchor="middle"
                                    className="dim"
                                >
                                    (rectificación, filtrado, regulación)
                                </text>

                                {/* diodos (puente) */}
                                <g transform="translate(20,44)">
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r="8"
                                        fill="#f7a"
                                        className="blink"
                                    />
                                    <circle
                                        cx="62"
                                        cy="22"
                                        r="8"
                                        fill="#f7a"
                                        className="blink"
                                        style={{ animationDelay: ".4s" }}
                                    />
                                    <circle
                                        cx="102"
                                        cy="22"
                                        r="8"
                                        fill="#f7a"
                                        className="blink"
                                        style={{ animationDelay: ".8s" }}
                                    />
                                    <circle
                                        cx="142"
                                        cy="22"
                                        r="8"
                                        fill="#f7a"
                                        className="blink"
                                        style={{ animationDelay: "1.2s" }}
                                    />
                                    <text
                                        x="82"
                                        y="46"
                                        textAnchor="middle"
                                        className="dim"
                                    >
                                        Puente de diodos
                                    </text>
                                </g>

                                {/* capacitor */}
                                <g transform="translate(30,85)">
                                    <rect
                                        x="0"
                                        y="0"
                                        width="60"
                                        height="70"
                                        rx="10"
                                        fill="#1f2b63"
                                        stroke="#4766d9"
                                    />
                                    <text
                                        x="30"
                                        y="88"
                                        textAnchor="middle"
                                        className="dim"
                                    >
                                        C filtro
                                    </text>
                                </g>

                                {/* regulador DC/DC */}
                                <g transform="translate(120,92)">
                                    <rect
                                        x="0"
                                        y="0"
                                        width="70"
                                        height="58"
                                        rx="8"
                                        fill="#163b35"
                                        stroke="#28e0b9"
                                    />
                                    <text
                                        x="35"
                                        y="76"
                                        textAnchor="middle"
                                        className="dim"
                                    >
                                        DC/DC
                                    </text>
                                </g>
                            </g>

                            {/* interconexión desde bobinas al acondicionamiento */}
                            <path
                                d="M520,300 C560,260 565,240 590,240"
                                className="pulse"
                            />
                            <path
                                d="M520,300 C560,340 565,360 590,380"
                                className="pulse"
                            />
                            <text x="520" y="292" className="dim">
                                Señal captada
                            </text>

                            {/* salidas */}
                            <g transform="translate(590,450)">
                                <rect
                                    width="210"
                                    height="120"
                                    rx="12"
                                    className="port"
                                />
                                <text
                                    x="105"
                                    y="-8"
                                    textAnchor="middle"
                                    className="label"
                                >
                                    Salidas
                                </text>
                                <g transform="translate(18,22)">
                                    <rect
                                        x="0"
                                        y="0"
                                        width="80"
                                        height="36"
                                        rx="8"
                                        className="port out"
                                    />
                                    <text
                                        x="40"
                                        y="24"
                                        textAnchor="middle"
                                        className="dim"
                                    >
                                        USB-C 5–9V
                                    </text>
                                </g>
                                <g transform="translate(112,22)">
                                    <rect
                                        x="0"
                                        y="0"
                                        width="80"
                                        height="36"
                                        rx="8"
                                        className="port out"
                                    />
                                    <text
                                        x="40"
                                        y="24"
                                        textAnchor="middle"
                                        className="dim"
                                    >
                                        DC 12V
                                    </text>
                                </g>
                                <text
                                    x="105"
                                    y="80"
                                    textAnchor="middle"
                                    className="dim"
                                >
                                    (para 1–3 dispositivos de baja potencia)
                                </text>
                            </g>

                            {/* blindaje & base */}
                            <g transform="translate(70,480)">
                                <rect
                                    x="0"
                                    y="0"
                                    width="460"
                                    height="90"
                                    rx="10"
                                    className="port"
                                />
                                <text
                                    x="230"
                                    y="24"
                                    textAnchor="middle"
                                    className="label"
                                >
                                    Blindaje suave + Base dieléctrica
                                </text>
                                <text
                                    x="230"
                                    y="52"
                                    textAnchor="middle"
                                    className="dim"
                                >
                                    cúpula acrílica / malla cobre + placa mica o
                                    policarbonato
                                </text>
                            </g>

                            {/* etiquetas laterales para materiales de bobinas */}
                            <g transform="translate(62,128)">
                                <rect
                                    x="0"
                                    y="0"
                                    width="210"
                                    height="110"
                                    rx="12"
                                    className="port"
                                />
                                <text x="16" y="24" className="label">
                                    Bobinas captoras
                                </text>
                                <text x="16" y="48" className="dim">
                                    • Alambre cobre esmaltado 0.6–1.0 mm
                                </text>
                                <text x="16" y="68" className="dim">
                                    • 2 espiras planas tipo espiral
                                </text>
                                <text x="16" y="88" className="dim">
                                    • Disposición toroidal
                                </text>
                            </g>
                        </svg>

                        <div className="legend" style={{ marginTop: 10 }}>
                            <span className="pill">
                                <span
                                    className="dot"
                                    style={{ background: "var(--vio)" }}
                                ></span>{" "}
                                Líneas de campo toroidal
                            </span>
                            <span className="pill">
                                <span
                                    className="dot"
                                    style={{ background: "var(--aqua)" }}
                                ></span>{" "}
                                Bobina superior / captura
                            </span>
                            <span className="pill">
                                <span
                                    className="dot"
                                    style={{ background: "var(--emer)" }}
                                ></span>{" "}
                                Bobina inferior / retorno
                            </span>
                            <span className="pill">
                                <span
                                    className="dot"
                                    style={{ background: "var(--gold)" }}
                                ></span>{" "}
                                Núcleo zero-point
                            </span>
                            <span className="pill">
                                <span
                                    className="dot"
                                    style={{ background: "var(--amber)" }}
                                ></span>{" "}
                                Salidas reguladas
                            </span>
                            <span className="pill">
                                <span
                                    className="dot"
                                    style={{ background: "#f7a" }}
                                ></span>{" "}
                                Rectificación / switching
                            </span>
                        </div>
                        <p className="note">
                            Interacción: observa el ritmo de <em>breathe</em>{" "}
                            del núcleo; si deseas “aumentar pulso”, respira al
                            mismo compás y sostiene enfoque suave en el centro.
                        </p>
                    </div>

                    {/* MATERIALS & ENSAMBLE */}
                    <div className="card">
                        <h3 style={{ margin: "6px 0 10px" }}>
                            Materiales (prototipo de mesa, baja potencia)
                        </h3>
                        <ul>
                            <li>
                                2 × Bobinas planas (espiral) de cobre esmaltado
                                0.6–1.0 mm, Ø externo 18–22 cm.
                            </li>
                            <li>
                                Separador dieléctrico (mica, policarbonato,
                                acrílico) entre bobinas: 3–6 mm.
                            </li>
                            <li>
                                Placa base dieléctrica + cúpula/aro protector
                                (acrílico) como blindaje suave.
                            </li>
                            <li>
                                Módulo puente de diodos (≥3A) + capacitor
                                1000–2200 µF (≥25V).
                            </li>
                            <li>
                                Convertidor DC/DC elevador o reductor (según
                                calibración) con salida USB-C (PD step-down
                                5–9V) y salida DC 12V (2–3A máx para pruebas).
                            </li>
                            <li>
                                Cables flexibles siliconados, bornes,
                                interruptor general, fusible de protección 2–3A.
                            </li>
                            <li>
                                Opcional: anillo de cobre/malla para
                                “derivación” y estabilización del campo.
                            </li>
                        </ul>

                        <h3 style={{ margin: "14px 0 6px" }}>
                            Ensamble (secuencia sugerida)
                        </h3>
                        <details open>
                            <summary>1) Núcleo & bobinas</summary>
                            <p className="muted">
                                Enrolla dos espirales planas (sentidos
                                opuestos). Centra ambas alrededor del{" "}
                                <strong>núcleo zero-point</strong> (la placa
                                central). Mantén separación dieléctrica y fija
                                con tornillería no magnética.
                            </p>
                        </details>
                        <details>
                            <summary>2) Captura → Rectificación</summary>
                            <p className="muted">
                                Conecta extremos de la espiral a un{" "}
                                <strong>puente de diodos</strong>. Añade{" "}
                                <strong>capacitor</strong> grande de filtro.
                                Observa el pulso en un multímetro/osc.
                            </p>
                        </details>
                        <details>
                            <summary>3) Regulación & Salidas</summary>
                            <p className="muted">
                                Del bus DC filtrado alimenta un módulo{" "}
                                <strong>DC/DC</strong>. De ahí deriva a{" "}
                                <span className="kbd">USB-C</span> (5–9V) y a{" "}
                                <span className="kbd">DC 12V</span>. Incorpora
                                fusible y switch.
                            </p>
                        </details>
                        <details>
                            <summary>4) Blindaje & Base</summary>
                            <p className="muted">
                                Coloca base rígida y cúpula/malla para minimizar
                                interferencias. Mantén los módulos en
                                compartimento inferior.
                            </p>
                        </details>
                        <details>
                            <summary>5) Pruebas</summary>
                            <p className="muted">
                                Carga primero dispositivos pequeños (p. ej.,
                                lámpara LED USB, teléfono a baja potencia). Sube
                                carga gradualmente.
                            </p>
                        </details>

                        <h3 style={{ margin: "14px 0 6px" }}>
                            Notas de integración
                        </h3>
                        <ul className="muted">
                            <li>
                                <strong>Dispositivo único:</strong> usa USB-C o
                                jack DC. Para inducción Qi, coloca una bobina Qi
                                comercial a la salida 5V.
                            </li>
                            <li>
                                <strong>Estabilidad vibral:</strong> ubica el
                                conjunto sobre base estable, alejado 30–50 cm de
                                transformadores fuertes o routers.
                            </li>
                        </ul>

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                                marginTop: 8,
                            }}
                        >
                            <button
                                className="btn"
                                onClick={() => setDark((v) => !v)}
                            >
                                Cambiar contraste
                            </button>
                            <button
                                className="btn"
                                onClick={() =>
                                    setSpeed((s) => Math.max(0.2, s * 0.7))
                                }
                            >
                                Pulso −
                            </button>
                            <button className="btn" onClick={() => setSpeed(1)}>
                                Pulso · reset
                            </button>
                            <button
                                className="btn"
                                onClick={() =>
                                    setSpeed((s) => Math.min(3, s * 1.4))
                                }
                            >
                                Pulso +
                            </button>
                        </div>
                        <p className="note" style={{ marginTop: 8 }}>
                            Este mapa acompaña la idea de{" "}
                            <em>no sostener energía: sostener forma</em> y{" "}
                            <em>respirar como interruptor de fases</em>.
                        </p>
                    </div>
                </div>

                {showDisclaimer && (
                    <p className="note" style={{ marginTop: 16 }}>
                        ⚠️ <strong>Descargo:</strong> Diagrama conceptual para
                        exploración creativa/educativa.
                    </p>
                )}
            </div>
        </div>
    )
}

addPropertyControls(ZeroPoint, {
    initialSpeed: {
        type: ControlType.Number,
        title: "Velocidad",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    showDisclaimer: {
        type: ControlType.Boolean,
        title: "Descargo",
        defaultValue: false,
    },
    bg: { type: ControlType.Color, title: "BG", defaultValue: "#0b1020" },
    ink: { type: ControlType.Color, title: "Texto", defaultValue: "#e8f1ff" },
    gold: { type: ControlType.Color, title: "Gold", defaultValue: "#f8d56b" },
    aqua: { type: ControlType.Color, title: "Aqua", defaultValue: "#66e1ff" },
    vio: { type: ControlType.Color, title: "Vio", defaultValue: "#7aa0ff" },
    emer: { type: ControlType.Color, title: "Emer", defaultValue: "#3de0a6" },
    amber: { type: ControlType.Color, title: "Amber", defaultValue: "#ffb86b" },
})
