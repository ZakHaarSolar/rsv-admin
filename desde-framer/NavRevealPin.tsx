// Red Solar Viva — NavRevealPin.tsx v1.2
// Pin solar de revelación de navegación (toggle on hover) para capas
// inmersivas/admin que ocultan la barra del Centro de Mando.
//
// Default-exported porque Framer no resuelve named exports cuando un
// componente hijo importa de otro componente del proyecto. Cada capa
// admin hace `import NavRevealPin from "./NavRevealPin.tsx"`.
//
// v1.1 — actualizado import de MenuSolarD → NavegadorEstacion (rename
// solar coherente).
// v1.2 — al abrirse setea body[data-rsv-nav-revealed="true"] e inyecta
// regla CSS que hace fade-out de cualquier título admin marcado con la
// clase .rsv-admin-title. Además pasa barOpacity={1} al NavegadorEstacion
// para que la píldora quede 100% opaca. Sin esto, las letras del título
// admin (ej. "Telemetría del Núcleo") se derramaban por los costados de
// la píldora y se veían por delante.

import * as React from "react"
import NavegadorEstacion from "./NavegadorEstacion.tsx"

/* ═══════════════════════════════════════════════════════════════════
   COMPORTAMIENTO TOGGLE:
   1. Hover sobre el pin → la barra se despliega y QUEDA persistente.
   2. El cursor puede salir del pin, entrar al menú, hacer clic en
      cualquier item — el menú no se cierra solo.
   3. Para cerrar: pasar el cursor sobre el pin de NUEVO → toggle off.
   4. Cooldown de 600ms entre toggles para evitar que un movimiento
      accidental que entra-sale-entra del pin haga flicker.

   Geometría: hexágono 44×44 px con 6 nodos satelitales orbitando
   un núcleo dorado pulsante.
   ═══════════════════════════════════════════════════════════════════ */

type NavTabId =
    | "origen"
    | "fragmentos"
    | "simuladores"
    | "codices"
    | "meditaciones"
    | "sesiones"
    | "escaner"
    | "ninguna"
    | "membrana"

function NavRevealPin({
    currentTabId = "ninguna",
}: {
    currentTabId?: NavTabId
}) {
    const [open, setOpen] = React.useState(false)
    const cooldownRef = React.useRef<number>(0)

    /* Toggle con cooldown 600ms. Cuando el cursor entra al pin, si
       pasaron >600ms desde el último toggle, invertimos el estado.
       Esto evita el flicker open→close→open por movimientos rápidos. */
    const handlePinEnter = React.useCallback(() => {
        const now = Date.now()
        if (now - cooldownRef.current < 600) return
        cooldownRef.current = now
        setOpen((prev) => !prev)
    }, [])

    React.useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const id = "rsv-nav-pin-css-v3"
        if (document.getElementById(id)) return
        const s = document.createElement("style")
        s.id = id
        s.textContent = `
@keyframes rsv-pin-pulse {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50% { transform: scale(1.15); opacity: 1; }
}
@keyframes rsv-pin-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
.rsv-pin-hex {
    transition: filter 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.rsv-pin-hex.is-open {
    filter: drop-shadow(0 0 14px rgba(0,229,255,0.65)) drop-shadow(0 0 28px rgba(212,168,67,0.35));
    transform: scale(1.08);
}
.rsv-pin-orbit-ring {
    animation: rsv-pin-orbit 14s linear infinite;
    transform-origin: 22px 22px;
}
.rsv-pin-core {
    animation: rsv-pin-pulse 2.6s ease-in-out infinite;
    transform-origin: 22px 22px;
}
/* v1.2 — títulos admin se esconden cuando la barra de navegación está
   revelada, para evitar que las letras del título se derramen por los
   costados de la píldora. El contenedor/elemento se marca con
   .rsv-admin-title en cada capa admin. */
.rsv-admin-title, .rsv-admin-title * {
    transition: opacity 0.22s ease;
}
body[data-rsv-nav-revealed="true"] .rsv-admin-title {
    opacity: 0 !important;
    pointer-events: none !important;
}
`
        document.head.appendChild(s)
    }, [])

    /* v1.2 — sincronizá body[data-rsv-nav-revealed] con el estado `open`.
       El CSS global inyectado arriba usa ese atributo para esconder cualquier
       .rsv-admin-title mientras la barra está desplegada. Al desmontar el
       componente borramos el atributo para no dejar la página en estado
       "oculto" por error. */
    React.useEffect(() => {
        if (typeof document === "undefined") return
        if (open) {
            document.body.setAttribute("data-rsv-nav-revealed", "true")
        } else {
            document.body.removeAttribute("data-rsv-nav-revealed")
        }
        return () => {
            document.body.removeAttribute("data-rsv-nav-revealed")
        }
    }, [open])

    return (
        <>
            <div
                onMouseEnter={handlePinEnter}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: 76,
                    height: 76,
                    zIndex: 902,
                    pointerEvents: "auto",
                }}
            >
                <div
                    className={`rsv-pin-hex${open ? " is-open" : ""}`}
                    style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        width: 44,
                        height: 44,
                        cursor: "pointer",
                    }}
                >
                    <svg
                        width="44"
                        height="44"
                        viewBox="0 0 44 44"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <radialGradient id="rsv-pin-glow">
                                <stop
                                    offset="0%"
                                    stopColor="rgba(0,194,255,0.18)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(0,194,255,0)"
                                />
                            </radialGradient>
                        </defs>
                        <circle
                            cx="22"
                            cy="22"
                            r="20"
                            fill="url(#rsv-pin-glow)"
                        />
                        <path
                            d="M22 5 L36 13 L36 31 L22 39 L8 31 L8 13 Z"
                            fill="rgba(2,8,16,0.55)"
                            stroke="rgba(0,194,255,0.55)"
                            strokeWidth="1.1"
                            strokeLinejoin="round"
                        />
                        <g className="rsv-pin-orbit-ring">
                            {[0, 60, 120, 180, 240, 300].map((deg) => {
                                const r = 13
                                const x =
                                    22 + r * Math.cos((deg * Math.PI) / 180)
                                const y =
                                    22 + r * Math.sin((deg * Math.PI) / 180)
                                return (
                                    <circle
                                        key={deg}
                                        cx={x}
                                        cy={y}
                                        r="1.4"
                                        fill="rgba(0,229,255,0.7)"
                                    />
                                )
                            })}
                        </g>
                        <g className="rsv-pin-core">
                            <circle
                                cx="22"
                                cy="22"
                                r="3.2"
                                fill="#D4A843"
                                opacity="0.9"
                            />
                            <circle cx="22" cy="22" r="1.6" fill="#F5D98C" />
                        </g>
                    </svg>
                </div>
            </div>
            {open && (
                <NavegadorEstacion
                    currentTabId={currentTabId}
                    barOpacity={1}
                />
            )}
        </>
    )
}

export default NavRevealPin
