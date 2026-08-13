// RSV Hub — Framer Code Component
// Pegar este archivo en Framer: Insert → Code → New Code Component → reemplazar con este contenido.
// Luego arrástralo al canvas y ajusta width/height. Expone controles para links y textos.

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Props = {
    title: string
    subtitle: string
    kicker: string
    note: string
    maxWidth: number
    padding: number
    // URLs
    homeUrl: string
    fragmentosUrl: string
    bitacorasUrl: string
    pinealUrl: string
    librosUrl: string
    rakhemUrl: string
    silencioUrl: string
    instaUrl: string
    xUrl: string
}

const css = `
:root{
  --bg-0:#050505;      /* negro cósmico */
  --bg-1:#0f0b06;      /* ámbar profundo */
  --sun-1:#ffb300;     /* oro solar */
  --sun-2:#ffda6a;     /* halo */
  --ink:#f6f4ef;       /* texto principal */
  --muted:#bdb7ad;     /* texto sutil */
  --glass:rgba(255,255,255,.06);
  --stroke:rgba(255,255,255,.12);
  --accent:#ffd166;
}
*{box-sizing:border-box;margin:0;padding:0}
.rsv__root{color:var(--ink);min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(255,206,84,.25), transparent 60%),
    radial-gradient(900px 500px at 80% 0%, rgba(255,166,0,.18), transparent 50%),
    linear-gradient(180deg, var(--bg-1), var(--bg-0));
}
.wrap{width:100%; max-width:720px}
.card{position:relative; overflow:hidden; background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  border:1px solid var(--stroke); border-radius:28px; padding:28px; backdrop-filter: blur(8px);
  box-shadow: 0 20px 60px rgba(0,0,0,.45);
}
.halo{position:absolute; inset:-30% -10% auto -10%; height:320px; pointer-events:none; filter: blur(40px); opacity:.65;
  background: radial-gradient(closest-side, var(--sun-2), rgba(255,218,106,.35), transparent 70%);
  animation: rsv-breathe 8s ease-in-out infinite;
}
@keyframes rsv-breathe{ 0%,100%{transform:translateY(-6px) scale(1)} 50%{transform:translateY(6px) scale(1.03)} }
header.rsv{display:flex; gap:18px; align-items:center; margin-bottom:18px}
.avatar{position:relative; flex:0 0 auto; width:80px; height:80px; border-radius:50%;
  background: radial-gradient(circle at 35% 35%, var(--sun-2), var(--sun-1) 55%, #8a5200 75%);
  box-shadow: 0 0 0 1px var(--stroke), 0 10px 24px rgba(255,180,0,.25), inset 0 3px 10px rgba(255,255,255,.15);
}
.avatar:after{content:""; position:absolute; inset:-6px; border-radius:50%;
  background: conic-gradient(from 90deg, rgba(255,209,102,.3), transparent 40%, rgba(255,209,102,.3));
  filter: blur(12px); opacity:.7; animation: rsv-spin 18s linear infinite;
}
@keyframes rsv-spin{to{transform:rotate(1turn)}}
.hgroup{flex:1 1 auto}
.hgroup h1{font-size:clamp(22px, 3.2vw, 30px); font-weight:700; letter-spacing:.2px}
.sub{margin-top:6px; color:var(--muted); font-size:15px}
.links{display:grid; grid-template-columns:1fr; gap:12px; margin-top:18px}
@media (min-width:560px){ .links{grid-template-columns:1fr 1fr} }
.btn{--ring: rgba(255,209,102,.25); position:relative; display:flex; align-items:center; gap:12px; width:100%;
  padding:16px 18px; border-radius:16px; border:1px solid var(--stroke);
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  color:var(--ink); text-decoration:none; font-weight:600; letter-spacing:.2px;
  box-shadow: 0 0 0 0 var(--ring); transition: transform .12s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
}
.btn:hover{ transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,.35), 0 0 0 6px var(--ring);
  border-color: rgba(255,209,102,.45);
  background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
}
.btn .ico{flex:0 0 auto; width:36px; height:36px; border-radius:12px; display:grid; place-items:center; font-size:18px;
  background: radial-gradient(circle at 35% 35%, rgba(255,209,102,.8), rgba(255,140,0,.65));
  box-shadow: inset 0 2px 10px rgba(255,255,255,.25), 0 3px 12px rgba(255,170,0,.25);
}
.btn small{color:var(--muted); font-weight:500; display:block; margin-top:2px}
footer.rsv{display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:22px; color:var(--muted)}
.badge{display:inline-flex; align-items:center; gap:10px; border:1px solid var(--stroke); border-radius:999px; padding:8px 12px; background:var(--glass)}
.pulse{width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow: 0 0 0 0 rgba(255,209,102,.5); animation:rsv-pulse 2.2s infinite}
@keyframes rsv-pulse{ 0%{box-shadow:0 0 0 0 rgba(255,209,102,.45)} 70%{box-shadow:0 0 0 12px rgba(255,209,102,0)} 100%{box-shadow:0 0 0 0 rgba(255,209,102,0)} }
.kicker{font-size:12px; letter-spacing:.36em; text-transform:uppercase; color:var(--muted); margin-bottom:8px}
.note{margin-top:10px; font-size:13.5px; color:var(--muted)}
.btn:focus-visible{outline:2px solid var(--accent); outline-offset:2px}
`

export default function RSVHub(props: Props) {
    const {
        title,
        subtitle,
        kicker,
        note,
        maxWidth,
        padding,
        homeUrl,
        fragmentosUrl,
        bitacorasUrl,
        pinealUrl,
        librosUrl,
        rakhemUrl,
        silencioUrl,
        instaUrl,
        xUrl,
    } = props

    const year = React.useMemo(() => new Date().getFullYear(), [])

    return (
        <div className="rsv__root" style={{ width: "100%", height: "100%" }}>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <main className="wrap" style={{ maxWidth, padding }}>
                <section
                    className="card"
                    aria-label="Hub de enlaces RedSolarViva"
                >
                    <div className="halo" aria-hidden="true" />

                    <header className="rsv">
                        <div className="avatar" aria-hidden="true" />
                        <div className="hgroup">
                            <div className="kicker">{kicker}</div>
                            <h1>{title}</h1>
                            <p className="sub">{subtitle}</p>
                        </div>
                    </header>

                    <div className="links" role="list">
                        <a
                            className="btn"
                            role="listitem"
                            href={homeUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                🏠
                            </div>
                            <div>
                                Home · Membrana
                                <small>Ingreso al campo principal</small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={fragmentosUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                🎞️
                            </div>
                            <div>
                                Fragmentos del Sol
                                <small>Geometría visual · YouTube</small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={bitacorasUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                📡
                            </div>
                            <div>
                                Bitácoras Solares
                                <small>
                                    Conversaciones y cápsulas · YouTube
                                </small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={pinealUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                🎧
                            </div>
                            <div>
                                Pineal Scores
                                <small>Geometría sonora · Spotify</small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={librosUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                📚
                            </div>
                            <div>
                                Libros
                                <small>
                                    Mini‑introducciones y apertura de pulso
                                </small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={rakhemUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                🔱
                            </div>
                            <div>
                                Acceso · Ra‑Khem
                                <small>Eje de práctica / activación</small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={silencioUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                🜂
                            </div>
                            <div>
                                Acceso · Silencio Solar
                                <small>Campo de quietud operativa</small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={instaUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                📷
                            </div>
                            <div>
                                Instagram · Zak’Haar
                                <small>Emisiones breves y highlights</small>
                            </div>
                        </a>

                        <a
                            className="btn"
                            role="listitem"
                            href={xUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <div className="ico" aria-hidden="true">
                                𝕏
                            </div>
                            <div>
                                X · Zak’Haar
                                <small>Ráfagas textuales de pulso</small>
                            </div>
                        </a>
                    </div>

                    <p className="note">{note}</p>

                    <footer className="rsv">
                        <span className="badge">
                            <span className="pulse" aria-hidden="true"></span>{" "}
                            Campo en coherencia
                        </span>
                        <small>© {year} RedSolarViva</small>
                    </footer>
                </section>
            </main>
        </div>
    )
}

addPropertyControls(RSVHub, {
    title: {
        type: ControlType.String,
        title: "Título",
        defaultValue: "Membrana de Enlaces",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue:
            "Un solo portal para todos los ejes y cápsulas en coherencia solar.",
    },
    kicker: {
        type: ControlType.String,
        title: "Kicker",
        defaultValue: "RedSolarViva",
    },
    note: {
        type: ControlType.String,
        title: "Nota",
        defaultValue: "Consejo: usa este URL único en tu bio de Instagram y X.",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 720,
        min: 320,
        max: 1440,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 24,
        min: 0,
        max: 64,
        unit: "px",
    },
    homeUrl: {
        type: ControlType.String,
        title: "Home URL",
        defaultValue: "https://redsolarviva.com",
    },
    fragmentosUrl: {
        type: ControlType.String,
        title: "Fragmentos URL",
        defaultValue: "https://youtube.com/@FragmentosDelSol",
    },
    bitacorasUrl: {
        type: ControlType.String,
        title: "Bitácoras URL",
        defaultValue: "https://youtube.com/@BitacorasSolares",
    },
    pinealUrl: {
        type: ControlType.String,
        title: "Pineal URL",
        defaultValue: "https://open.spotify.com/show/your-pineal-scores",
    },
    librosUrl: {
        type: ControlType.String,
        title: "Libros URL",
        defaultValue: "https://redsolarviva.com/libros",
    },
    rakhemUrl: {
        type: ControlType.String,
        title: "Ra‑Khem URL",
        defaultValue: "https://redsolarviva.com/accesos/ra-khem",
    },
    silencioUrl: {
        type: ControlType.String,
        title: "Silencio URL",
        defaultValue: "https://redsolarviva.com/accesos/silencio-solar",
    },
    instaUrl: {
        type: ControlType.String,
        title: "Instagram URL",
        defaultValue: "https://instagram.com/zakhaar",
    },
    xUrl: {
        type: ControlType.String,
        title: "X URL",
        defaultValue: "https://x.com/zakhaar",
    },
})
