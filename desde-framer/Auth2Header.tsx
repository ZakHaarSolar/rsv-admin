// Red Solar Viva — AuthHeader v18.25 — 🜂 PUERTA DE SERVICIO (Zak 2026-08-03: "Red Solar Viva deja de ser tienda"). Este encabezado ya no se monta en la cara pública — el Domo lo monta SOLO en las rutas de los paneles de administración, donde sigue siendo la única forma de identificarse. En consecuencia el menú se quedó con los paneles y el cierre de sesión: las entradas de Tripulante (Mis Códices, Mis Sesiones, Trayectoria, Mi Firma) salieron porque apuntaban a Mi Núcleo, que ya no tiene capa pública en la casa.
// v18.24 — EL MENÚ DE ADMINISTRADOR APARECE AL INSTANTE (Zak 2026-08-03: "tarda mucho en mostrarse, tengo que recargar la página"): el estado nace del recuerdo local en vez de esperar un viaje entero al servidor, y el chequeo REINTENTA mientras el pase de sesión de Clerk no exista (antes se rendía a la primera y solo recargar lo destrababa). El recuerdo se borra al cerrar sesión.
// v18.23 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v18.21
// v18.21 — fullName del avatar y del menú prioriza
// `unsafeMetadata.preferredName` (lo que el Tripulante escribió en Mi
// Firma) sobre el fullName legacy de Clerk. Cubre el caso de nombres
// con caracteres especiales que Clerk rechaza silenciosamente — el
// SDK actualizaba el cache local pero el server seguía con el viejo;
// al re-login el avatar volvía al nombre rechazado. Ahora respeta el
// preferredName en cada superficie del header.
// v18.20 — Cuando hay sesión, el dispatch de `rsv-auth-header-ready`
// ahora espera a que la imagen del avatar termine de cargar (onLoad)
// o falle (onError). Antes el evento se disparaba apenas isLoaded
// se hacía true, pero el `<img src=imageUrl>` del avatar tardaba
// 200-1500ms más en cargar desde el CDN de Clerk/Google. Resultado
// visual: el CTA Escáner aparecía sincronizado con el placeholder
// del avatar pero la imagen real entraba después → seguía sintiéndose
// escalonado. Ahora el AuthHeader avisa "listo" sólo cuando el
// avatar real está pintado (o cayó en el fallback de iniciales).
// Casos sin imagen (botón INGRESAR, fallback iniciales) dispatchean
// inmediato porque no hay imagen que esperar.
// v18.19 — InnerAuthHeader emite el evento `rsv-auth-header-ready`
// apenas sale del placeholder de carga (isLoaded=true ||
// forceShowUI=true || signingOut). Domo escucha ese evento para
// sincronizar el fade-in del CTA Escáner — antes el CTA aparecía
// 200-500ms antes que el botón INGRESAR/avatar y se veía escalonado.
// El evento se dispatcha una sola vez por mount; consumidores
// múltiples (Domo, telemetry, etc.) reciben el mismo signal.
// v18.18 — El CTA standalone se oculta también en /escaner/nucleo.
// Antes hacíamos excepción para esa ruta y mantenía el botón visible
// adentro del Escáner. Zak pidió simplificar: dentro del Escáner
// NUNCA aparece el botón "ir al Escáner" porque ya estás dentro. La
// regla pasa de `inEscaner && !isInNucleo` a solo `inEscaner`.
// v18.17 — El botón ⬡ Escáner Vibracional ya no vive dentro del
// InnerAuthHeader. El CTA ahora es un componente standalone montado
// directamente por Domo en su propio container fixed (siempre
// montado, sin importar la ruta). Razón: cuando navegamos /nucleo →
// /home, el AuthHeader entero se desmontaba (porque ctaOnly cambia
// el árbol completo), arrastrando el CTA con él → el botón
// desaparecía y reaparecía con el delay de mount del ClerkProvider.
// Ahora el CTA es independiente del cluster avatar/login y solo se
// desliza horizontalmente cuando el avatar aparece o desaparece —
// nunca desmonta. Quito de InnerAuthHeader: la definición de
// `EscanerCTA`, `escanerHref`, `handleEscanerClick`, los pill bg /
// shadow tokens, `isInNucleo`, `hideEscanerCTA`, el branch
// `if (ctaOnly)`, y los dos `{EscanerCTA}` JSX usages. El AuthHeader
// exterior conserva el branch `if (ctaOnly) return null` para
// backwards compat (Domo ya no manda ctaOnly=true).
// v18.16 — En modo ctaOnly el componente NO envuelve un
// <ClerkProvider> propio. Antes (v18.15) lo montaba con la key
// hardcoded para satisfacer los hooks useUser/useClerk del
// InnerAuthHeader, pero eso provocaba "Multiple <ClerkProvider>
// components" porque MiNucleo también arma el suyo internamente.
// Resultado: pantalla negra en /nucleo y /escaner/nucleo desktop.
// Ahora ctaOnly retorna un componente standalone (EscanerCTAStandalone)
// que lee pathname con popstate/rsv-navigate y window.Clerk?.user
// con un poll suave + listener rsv-auth-changed — exactamente lo
// que necesita el botón ⬡ ESCÁNER VIBRACIONAL para decidir su href
// y su visibilidad. Cero hooks de Clerk → cero provider → cero
// colisión con MiNucleo. El resto de rutas (con avatar/dropdown)
// sigue funcionando con el ClerkProvider habitual.
// v18.15 — Fallback hardcoded de clerkPublishableKey cuando
// ctaOnly=true y la prop llega vacía. El cartel rojo "❌ Clerk
// Key requerida" reapareció en /nucleo y /escaner/nucleo desktop
// porque el canvas de Domo en producción tiene la prop sin
// poblar — y mi v4.65 reactivó el monte de AuthHeader en esas
// rutas con ctaOnly=true. Como en modo ctaOnly el componente
// solo renderiza un link estático (no necesita Clerk para nada
// funcionalmente), aplico fallback a la key pública del proyecto
// (pk_live_…) y el guard solo se dispara si NO es ctaOnly.
// Resultado: el cartel rojo no aparece, el CTA se muestra
// normal, y el resto de rutas (con avatar/dropdown) sigue exigiendo
// la key explícita como antes.
// v18.14 — Botón ⧣ ESCÁNER VIBRACIONAL ya no desaparece dentro de
// Mi Núcleo. Antes la condición era `inEscaner ? null : CTA` que
// incluía /escaner/nucleo en el set de rutas que escondían el
// botón. Zak pidió que se mantenga visible al entrar a Mi Núcleo
// (modo Madre y modo Escáner). Ahora la condición es:
//   hideEscanerCTA = inEscaner && !isInNucleo
// Donde isInNucleo cubre /nucleo + /escaner/nucleo. Resultado:
//   /radar, /escaner, /escaner/radar, /escaner/calibracion,
//   /escaner/holoteca/*       → CTA oculto (ya estás en el Escáner)
//   /, /codices, /sesiones, etc → CTA visible
//   /nucleo, /escaner/nucleo  → CTA visible ✅ nuevo
// Nota: cuando el Arquitecto entra a /escaner/nucleo, el CTA lleva
// a /escaner/radar (handleEscanerClick mantiene la lógica del href
// dinámico). Tap rápido para volver a la pantalla activa del
// Escáner desde su propia núcleo.
// v18.13 — Cuatro afinaciones del header desktop pedidas por Zak:
//   (a) Botón ⬡ ESCÁNER VIBRACIONAL homogeneizado con la pill del
//       NavegadorEstacion: misma receta de gradiente azul-noche +
//       border tenue cyan + boxShadow inset suave + backdrop blur.
//       Antes el CTA gritaba con border 1.5px sólido + glow exterior
//       fuerte que rompía la simbiosis con la pill superior.
//   (b) EscanerCTA se oculta cuando inEscaner === true (rutas
//       /escaner, /escaner/*, /radar). Adentro de la app no tiene
//       sentido un botón "entrar al Escáner".
//   (c) Prop nueva `ctaOnly` (boolean). Cuando es true, el header
//       renderiza SOLO el EscanerCTA (sin avatar / dropdown / botón
//       Ingresar). Domo lo activa para /nucleo (modo Madre) donde
//       MiNucleo standalone se encarga de su propio cluster de auth
//       — pero el botón debe seguir visible en su posición habitual
//       para mantener continuidad visual entre rutas.
//   (d) handleAvatarClick usa nucleoBase dinámico (igual que el
//       dropdown). Antes hardcodeaba /escaner/nucleo#mifirma — eso
//       arrastraba al tripulante al shell del Escáner desde rutas
//       del Ecosistema Madre. Ahora respeta el contexto.
//   (e) "Mi Firma de Luz" → "Mi Firma" en el dropdown.
// v18.12.1 — HOT FIX React #310 en desktop. v18.12 puso el useMemo
// del menuItems DESPUÉS de los dos early returns (if !isLoaded, if
// !effectivelySignedIn). En la transición invitado → logueado el
// componente pasaba de N hooks a N+1 y React tiraba "Rendered more
// hooks than during the previous render" → pantalla negra. Mismo
// patrón que el bug histórico de v18.9 (avatarBroken useEffect).
// Fix: useMemo y derivados (inEscaner, nucleoBase) movidos ARRIBA
// de los early returns. Mobile no lo notaba porque Auth2Header no
// se monta en mobile (hideAuth=isMobile en Domo).
// v18.12 — Dos afinaciones del header desktop:
//   (a) Reorden visual: ⬡ ESCÁNER VIBRACIONAL queda a la IZQUIERDA
//       y el avatar / botón INGRESAR a la DERECHA. El outerStyle
//       mantiene justify-content: flex-end con gap; cambia el orden
//       de los hijos en ambos returns.
//   (b) Hrefs del dropdown adaptan al contexto. Si el tripulante
//       está en /escaner/* → hrefs apuntan a /escaner/nucleo#X
//       (Núcleo modo Escáner, conserva el shell del Escáner). Si
//       está en cualquier otra ruta del Ecosistema Madre → hrefs
//       apuntan a /nucleo#X (Núcleo modo Madre, mantiene la barra
//       superior del ecosistema sin chocar con el shell del
//       Escáner). Mismo patrón que NavegadorEstacion v4.9 con su
//       isEscanerPath().
// v18.11 — Escáner Vibracional sale del dropdown y pasa a ser un
// botón permanente al lado del avatar / botón INGRESAR. Es el CTA
// con mayor gravedad del header desktop: borde cyan + glow exterior
// + hexágono ⬡ a la izquierda del label "ESCÁNER VIBRACIONAL".
// Visible siempre, en ambos estados (visitante / tripulante
// autenticado). El href cambia según sesión: visitante → /radar,
// tripulante → /escaner/radar. El menú desplegable del avatar queda
// enfocado en activos personales: Mis Códices · Mis Sesiones ·
// Mi Firma de Luz · sign out.
// v18.10 — Hrefs del menú user migrados al path canónico
// /escaner/nucleo (Domo v4.55 anida todo bajo /escaner). Mis Códices
// → /escaner/nucleo#codices, Mis Sesiones → /escaner/nucleo#sesiones,
// Mi Firma de Luz → /escaner/nucleo#mifirma. El nav fallback de
// "click cuenta" también redirige al canónico.
// v18.9 — Hot fix React #310 — pantalla negra al login resuelto.
// El useEffect que reseteaba avatarBroken cuando cambiaba la
// imageUrl vivía DESPUÉS de dos early returns: el de no-isLoaded
// y el de no-effectivelySignedIn. Cada vez que el tripulante
// pasaba de invitado a logueado (o viceversa), el componente
// pasaba de N hooks llamados a N+1 (o al revés) → React tiraba
// "Rendered more hooks than during the previous render" y la
// capa entera del shell quedaba en negro. Movimos avatarSrcKey
// y su useEffect arriba de los early returns. La lógica del
// reset queda intacta; solo cambia la posición del hook.
// v18.8 — AuthHeader (Avatar con fallback robusto:
// si la imageUrl de Clerk/Google falla a cargar (CORS, link expirado),
// el `<img>` ya no muestra el ícono de imagen rota del browser ni el
// signo de interrogación. Setea avatarBroken=true onError y se
// renderiza el div con la inicial cyan/dorada. referrerPolicy
// "no-referrer" + crossOrigin "anonymous" + key=src maximizan chance
// de carga. avatarBroken se resetea cuando cambia la imageUrl —
// cubre cambio de cuenta y la hidratación tardía post-signup donde
// Clerk inicialmente devuelve imageUrl vacío y luego la popula.)
// Auth2Header v18.7 (Escáner Vibracional sube al TOP del menú — ahora es el primer item que el tripulante ve al abrir el AuthHeader, encima de Códices/Sesiones/Mi Firma. Razón: es la herramienta accionable más frecuente, pedido del arquitecto. Sin cambios en isAdmin ni href. v18.6 público (antes admin-only) sin cambios estructurales.)
// ✅ Admin buttons: Telemetría del Núcleo + Holograma de Expansión + Motor de Intervención + Observatorio de Resonancia (Supabase is_admin check)
// ✅ SPA-native: rsvNavigate for all navigation, session.end() for signout without reload
// ✅ FIX: sign-out stays on current page (no nav("/") redirect)

import { addPropertyControls, ControlType } from "framer"
import { useState, useRef, useEffect, useMemo } from "react"
import { useAuthModalState } from "./AuthOverrides.tsx"
import { ClerkProvider, useUser, useClerk } from "@clerk/clerk-react"

function hasClerkSessionCookie(): boolean {
    if (typeof document === "undefined") return false
    const cookies = document.cookie
    return (
        cookies.includes("__session") ||
        cookies.includes("__clerk_db_jwt") ||
        cookies.includes("__client")
    )
}

function useRealAuth() {
    const { isSignedIn, user, isLoaded } = useUser()
    const { signOut } = useClerk()
    return {
        isLoaded: !!isLoaded,
        isSignedIn: !!isSignedIn,
        clerkUserId: user?.id || null,
        user: user
            ? {
                  /* v18.X — preferredName en unsafeMetadata gana sobre
                     fullName. El Tripulante puede cambiar su nombre
                     desde Mi Núcleo y verlo respetado en avatar/menu
                     aunque Clerk haya rechazado el firstName/lastName
                     correspondiente (ej. caracteres especiales). */
                  fullName:
                      (user.unsafeMetadata as any)?.preferredName ||
                      user.fullName ||
                      "Usuario Solar",
                  firstName: user.firstName || "",
                  profileImageUrl: user.imageUrl || "",
                  primaryEmailAddress: {
                      emailAddress:
                          user.primaryEmailAddress?.emailAddress || "",
                  },
              }
            : null,
        signOut,
    }
}

/* Nuclear cleanup: destruye estado Clerk local (no HttpOnly cookies — esas las mata session.end()) */
function nukeClerkLocal() {
    try {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (
                k &&
                (k.startsWith("clerk") ||
                    k.startsWith("__clerk") ||
                    k.startsWith("__client") ||
                    k.includes("clerk") ||
                    k === "nuc_user_cache" ||
                    /* v18.24 — el recuerdo del estado de administrador se va
                       con la sesión (si no, otra cuenta en el mismo
                       navegador vería el menú admin hasta que el servidor
                       la corrigiera). */
                    k === ADMIN_CACHE_KEY)
            )
                keys.push(k)
        }
        keys.forEach((k) => localStorage.removeItem(k))
    } catch {}
    try {
        const keys: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i)
            if (
                k &&
                (k.startsWith("clerk") ||
                    k.startsWith("__clerk") ||
                    k.startsWith("__client") ||
                    k.includes("clerk") ||
                    k === "nuc_signout")
            )
                keys.push(k)
        }
        keys.forEach((k) => sessionStorage.removeItem(k))
    } catch {}
    try {
        const hostname = window.location.hostname
        const domains = [hostname, `.${hostname}`]
        const parts = hostname.split(".")
        if (parts.length > 2) domains.push(`.${parts.slice(-2).join(".")}`)
        document.cookie.split(";").forEach((c) => {
            const name = c.trim().split("=")[0]
            if (
                name &&
                (name.startsWith("__clerk") ||
                    name.startsWith("__session") ||
                    name.startsWith("__client"))
            ) {
                domains.forEach((domain) => {
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`
                })
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            }
        })
    } catch {}
    try {
        const g = (window as any).Clerk
        if (g) {
            g.user = null
            g.session = null
        }
    } catch {}
}

const C = {
    accent: "#00C2FF",
    accentLight: "#33cfff",
    ag06: "rgba(0,194,255,0.06)",
    ag08: "rgba(0,194,255,0.08)",
    ag12: "rgba(0,194,255,0.12)",
    ag15: "rgba(0,194,255,0.15)",
    ag20: "rgba(0,194,255,0.2)",
    ag30: "rgba(0,194,255,0.3)",
    ag35: "rgba(0,194,255,0.35)",
    ag40: "rgba(0,194,255,0.4)",
    ag50: "rgba(0,194,255,0.5)",
    ag60: "rgba(0,194,255,0.6)",
    ag80: "rgba(0,194,255,0.8)",
    gold: "rgba(210,170,100,",
    /* ═══ Admin accent: magenta-violeta cuántico ═══ */
    admin: "#C77DFF",
    adminDim: "rgba(199,125,255,",
    /* ═══ Beta accent: amber cálido (en desarrollo) ═══ */
    beta: "#F0A030",
    betaDim: "rgba(240,160,48,",
}

const KEYFRAMES_ID = "rsv-auth-header-kf"
function injectKeyframes() {
    if (typeof document === "undefined") return
    if (document.getElementById(KEYFRAMES_ID)) return
    const s = document.createElement("style")
    s.id = KEYFRAMES_ID
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes rsv-glow-pulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
        @keyframes rsv-dd-enter { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes rsv-dd-exit { from{opacity:1} to{opacity:0;transform:translateY(-6px) scale(0.97)} }
        @keyframes rsv-btn-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes rsv-admin-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .rsv-ah *:focus,.rsv-ah *:focus-visible,.rsv-ah *:focus-within{outline:none!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent!important}
    `
    document.head.appendChild(s)
}

const icons = {
    login: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
    ),
    nucleo: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" opacity="0.4" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
        </svg>
    ),
    sessions: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    codices: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" opacity="0.5" />
        </svg>
    ),
    logout: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    /* v18.X — Trayectoria: línea ondulante con tres nodos pulsantes
       sugiere la curva del Índice de Silicio a través del tiempo. */
    trayectoria: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 17 Q 7 9, 11 13 T 21 7" />
            <circle cx="3" cy="17" r="1.4" fill="currentColor" />
            <circle cx="11" cy="13" r="1.4" fill="currentColor" />
            <circle cx="21" cy="7" r="1.4" fill="currentColor" />
        </svg>
    ),
    /* ═══ Admin icons ═══ */
    telemetria: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
        </svg>
    ),
    holograma: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
            <polyline points="2 15.5 12 8.5 22 15.5" opacity="0.4" />
            <line x1="12" y1="2" x2="12" y2="8.5" />
        </svg>
    ),
    escaner: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" opacity="0.5" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
    ),
    observatorio: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="3" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="21" />
            <line x1="3" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="21" y2="12" />
        </svg>
    ),
    atelier: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="5"
                y="5"
                width="14"
                height="14"
                rx="2"
                transform="rotate(45 12 12)"
            />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="9.5" y1="9.5" x2="14.5" y2="14.5" />
            <line x1="14.5" y1="9.5" x2="9.5" y2="14.5" />
        </svg>
    ),
    frecuencias: (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="4" y1="10" x2="4" y2="14" />
            <line x1="8" y1="6" x2="8" y2="18" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="16" y1="7" x2="16" y2="17" />
            <line x1="20" y1="10" x2="20" y2="14" />
        </svg>
    ),
}

/* v18.12 — Detecta si el path actual está dentro de la app del
   Escáner (rutas /escaner/* + aliases legacy + Portal /radar). El
   contexto manda los hrefs del dropdown: dentro del Escáner los
   ítems llevan a /escaner/nucleo#X (modo Escáner, conserva el
   shell); en el Ecosistema Madre llevan a /nucleo#X (modo Madre,
   conserva la barra del ecosistema sin saltar al shell del
   Escáner). Mismo criterio que NavegadorEstacion v4.9. */
function isEscanerContext(path: string): boolean {
    const p = (path || "").toLowerCase()
    return (
        p === "/radar" ||
        p === "/escaner" ||
        p.startsWith("/escaner/") ||
        p === "/calibracion" ||
        p === "/holoteca" ||
        p.startsWith("/holoteca/")
    )
}

/* v18.12 — buildMenuItems(nucleoBase) construye el array de ítems
   del dropdown con hrefs anclados al base correspondiente
   (/escaner/nucleo o /nucleo). El componente decide en runtime
   cuál pasar según el path actual. */
function buildMenuItems(nucleoBase: string) {
    /* 🜂 v18.25 — El menú se quedó SOLO con los paneles y el cierre de
       sesión. Las entradas de Tripulante (Mis Códices, Mis Sesiones,
       Trayectoria, Mi Firma) salieron: apuntaban a Mi Núcleo, que ya
       no tiene capa pública en la casa — esa vida vive en el Escáner.
       Este encabezado ahora solo se monta en las rutas de los paneles,
       así que es la puerta de servicio del Arquitecto, no un menú de
       usuario. `nucleoBase` se conserva en la firma por si alguna
       entrada del Núcleo vuelve. */
    void nucleoBase
    return [
        /* v18.11 — "Escáner Vibracional" salió del dropdown. Vive
           ahora como botón permanente al lado del trigger del
           AuthHeader. */
        /* ═══ Admin-only items ═══ */
        {
            label: "Motor de Intervención",
            icon: icons.escaner,
            href: "/motor-intervencion",
            isLogout: false,
            isAdmin: true,
            isBeta: false,
        },
        {
            label: "Telemetría del Núcleo",
            icon: icons.telemetria,
            href: "/telemetria",
            isLogout: false,
            isAdmin: true,
            isBeta: false,
        },
        {
            label: "Holograma de Expansión",
            icon: icons.holograma,
            href: "/holograma",
            isLogout: false,
            isAdmin: true,
            isBeta: false,
        },
        {
            label: "Observatorio de Resonancia",
            icon: icons.observatorio,
            href: "/observatorio",
            isLogout: false,
            isAdmin: true,
            isBeta: false,
        },
        {
            label: "Atelier de Marketing",
            icon: icons.atelier,
            href: "/atelier",
            isLogout: false,
            isAdmin: true,
            isBeta: false,
        },
        {
            label: "Frecuencias Sonoras",
            icon: icons.frecuencias,
            href: "/frecuencias",
            isLogout: false,
            isAdmin: true,
            isBeta: false,
        },
        /* ═══ Logout ═══ */
        {
            label: "Cerrar sesión",
            icon: icons.logout,
            href: null,
            isLogout: true,
            isAdmin: false,
            isBeta: false,
        },
    ]
}

/* v18.12 — Tipo derivado del retorno de buildMenuItems. Lo usa
   handleItemClick para tipar el ítem recibido. Antes el typeof
   menuItems[0] funcionaba porque menuItems era const top-level;
   ahora que es función, necesitamos extraer el tipo del retorno. */
type MenuItem = ReturnType<typeof buildMenuItems>[number]

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

/* ═══ Supabase admin check hook (perfil propio vía edge `me`) ═══
   🜂 v18.24 — EL MENÚ DE ADMINISTRADOR TARDABA (o no salía hasta recargar
   varias veces; reporte de Zak). Dos causas apiladas:
   (1) el estado arrancaba en `false` y esperaba un viaje ENTERO al
       servidor (edge `me`) antes de poder pintar las entradas admin → el
       menú se abría "como si no fueras administrador" y las entradas
       aparecían después;
   (2) `fetchMe` pide el pase de sesión de Clerk UNA sola vez; si todavía
       no estaba minteado devolvía null, y como `checkedRef` ya había
       marcado ese usuario NUNCA se reintentaba → solo recargar la página
       lo destrababa (exactamente el síntoma reportado).
   Ahora el estado NACE del recuerdo local (mismo patrón anti-parpadeo de
   la membresía del Escáner, `rsv-esc-member-last`) y el chequeo REINTENTA
   con espera creciente mientras el pase no exista. El recuerdo se borra al
   cerrar sesión (nukeClerkLocal). */
const ADMIN_CACHE_KEY = "rsv-is-admin"

function readAdminCache(uid?: string | null): boolean {
    try {
        const raw = window.localStorage.getItem(ADMIN_CACHE_KEY)
        if (!raw) return false
        const o = JSON.parse(raw)
        if (!o || o.v !== true) return false
        /* Sin el id resuelto todavía (Clerk hidratando) confiamos en el
           recuerdo; en cuanto llega el id, si no coincide, se corrige. */
        return !uid || o.uid === uid
    } catch {
        return false
    }
}

function writeAdminCache(uid: string, v: boolean) {
    try {
        if (v)
            window.localStorage.setItem(
                ADMIN_CACHE_KEY,
                JSON.stringify({ uid, v: true })
            )
        else window.localStorage.removeItem(ADMIN_CACHE_KEY)
    } catch {}
}

function useIsAdmin(
    supabaseUrl: string,
    supabaseAnonKey: string,
    clerkUserId: string | null | undefined,
    isSignedIn: boolean
): boolean {
    const [isAdmin, setIsAdmin] = useState<boolean>(() => readAdminCache(null))
    const checkedRef = useRef<string | null>(null)

    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey || !clerkUserId || !isSignedIn) {
            /* Sin id todavía = Clerk hidratando, NO "no es admin": se
               conserva lo sembrado del recuerdo. El menú del avatar solo
               existe con sesión, así que no hay fuga visual posible. */
            checkedRef.current = null
            return
        }
        if (checkedRef.current === clerkUserId) return
        checkedRef.current = clerkUserId

        /* El recuerdo manda mientras el servidor confirma. */
        setIsAdmin(readAdminCache(clerkUserId))

        let vivo = true
        const check = async (intento = 0) => {
            let profile: any = null
            try {
                profile = await fetchMe(supabaseUrl, supabaseAnonKey)
            } catch {
                profile = null
            }
            if (!vivo) return
            if (!profile) {
                /* El pase de sesión puede no existir aún (login fresco,
                   regreso de otra pestaña, cold start). Reintentar en vez
                   de rendirse hasta la próxima recarga. */
                if (intento < 6) {
                    window.setTimeout(
                        () => check(intento + 1),
                        400 + intento * 400
                    )
                }
                return
            }
            const v = profile?.is_admin === true
            setIsAdmin(v)
            writeAdminCache(clerkUserId, v)
        }
        check()
        return () => {
            vivo = false
        }
    }, [supabaseUrl, supabaseAnonKey, clerkUserId, isSignedIn])

    return isAdmin
}

export default function AuthHeader(props: {
    clerkPublishableKey?: string
    loginText?: string
    onLoginClick?: () => void
    onMenuItemClick?: (item: string) => void
    supabaseUrl?: string
    supabaseAnonKey?: string
    /* v18.13 — Cuando ctaOnly=true, el header renderiza solo el
       EscanerCTA (sin avatar/dropdown/login). Domo lo prende para
       /nucleo modo Madre, donde MiNucleo standalone gestiona su
       propio cluster de auth pero el CTA debe seguir visible en su
       posición habitual. */
    ctaOnly?: boolean
}) {
    const {
        clerkPublishableKey = "",
        loginText = "Ingresar",
        onLoginClick,
        onMenuItemClick,
        supabaseUrl = "",
        supabaseAnonKey = "",
        ctaOnly = false,
    } = props
    /* v18.16 — ctaOnly retorna el componente standalone SIN
       ClerkProvider. MiNucleo monta su propio provider; si acá
       envolvíamos otro (aun con la key correcta), Clerk se quejaba
       con "Multiple <ClerkProvider>" y la app entera quedaba en
       pantalla negra. EscanerCTAStandalone hace su propio tracking
       de sesión vía window.Clerk?.user y listener rsv-auth-changed,
       que es todo lo que necesita el botón para decidir su href. */
    if (ctaOnly) {
        return <EscanerCTAStandalone />
    }
    if (!clerkPublishableKey)
        return (
            <div style={{ color: "#ff5555", padding: 20 }}>
                ❌ Clerk Key requerida
            </div>
        )

    return (
        <ClerkProvider
            publishableKey={clerkPublishableKey}
            appearance={{ variables: { colorPrimary: C.accent } }}
        >
            <InnerAuthHeader
                loginText={loginText}
                onLoginClick={onLoginClick}
                onMenuItemClick={onMenuItemClick}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                ctaOnly={ctaOnly}
            />
        </ClerkProvider>
    )
}

/* v18.16 — Componente standalone para modo ctaOnly. Renderiza
   solamente el botón ⬡ ESCÁNER VIBRACIONAL sin requerir un
   ClerkProvider envolvente. Lee pathname y estado de sesión por
   APIs nativas (window.location, window.Clerk?.user, eventos
   rsv-navigate / rsv-auth-changed) — exactamente lo que necesita
   el CTA para decidir su href y visibilidad. Esto evita el doble
   ClerkProvider con MiNucleo.
   v18.17 — Exportado para que Domo lo monte directamente en su
   propio container fijo, independiente del AuthHeader. */
export function EscanerCTAStandalone() {
    const [pathname, setPathname] = useState<string>(() => {
        if (typeof window === "undefined") return ""
        return window.location.pathname || ""
    })
    useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => setPathname(window.location.pathname || "")
        window.addEventListener("rsv-navigate", tick)
        window.addEventListener("popstate", tick)
        return () => {
            window.removeEventListener("rsv-navigate", tick)
            window.removeEventListener("popstate", tick)
        }
    }, [])

    const [signedIn, setSignedIn] = useState<boolean>(() => {
        if (typeof window === "undefined") return false
        return !!(window as any).Clerk?.user
    })
    useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => setSignedIn(!!(window as any).Clerk?.user)
        const interval = setInterval(tick, 1500)
        window.addEventListener("rsv-auth-changed", tick)
        tick()
        return () => {
            clearInterval(interval)
            window.removeEventListener("rsv-auth-changed", tick)
        }
    }, [])

    const [hovered, setHovered] = useState(false)

    /* v18.18 — Ocultamos el CTA en CUALQUIER ruta del Escáner,
       incluida /escaner/nucleo. Antes hacíamos excepción para
       /escaner/nucleo para dar acceso de vuelta al Radar, pero
       Zak pidió que dentro del Escáner NUNCA aparezca el botón
       "ir al Escáner" (ya estás dentro). Mi Núcleo en modo Madre
       (/nucleo) sigue mostrándolo porque ahí estás en el ecosistema. */
    const inEscaner = isEscanerContext(pathname)
    if (inEscaner) return null

    const escanerHref = signedIn ? "/escaner/radar" : "/radar"
    const handleEscanerClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const nav = (window as any).rsvNavigate
        if (nav) nav(escanerHref)
        else window.location.href = escanerHref
    }

    const ctaPillBg = `linear-gradient(135deg, rgba(8,24,48,0.88) 0%, rgba(5,16,34,0.94) 45%, rgba(4,14,30,0.94) 55%, rgba(8,24,48,0.88) 100%), ${C.ag06}`
    const ctaPillBgHover = `linear-gradient(135deg, rgba(10,30,56,0.92) 0%, rgba(6,20,40,0.96) 45%, rgba(5,18,36,0.96) 55%, rgba(10,30,56,0.92) 100%), ${C.ag12}`
    const ctaPillShadow = [
        `0 8px 26px ${C.ag15}`,
        `0 2px 10px rgba(0,0,0,0.35)`,
        `inset 0 0 22px ${C.ag08}`,
        `inset 0 1px 0 rgba(255,255,255,0.18)`,
        `0 0 0 0.5px ${C.ag12}`,
    ].join(", ")
    const ctaPillShadowHover = [
        `0 8px 32px ${C.ag30}`,
        `0 2px 12px rgba(0,0,0,0.4)`,
        `inset 0 0 26px ${C.ag12}`,
        `inset 0 1px 0 rgba(255,255,255,0.24)`,
        `0 0 0 0.5px ${C.ag20}`,
    ].join(", ")

    const outerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 140,
        minHeight: 44,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
        paddingRight: 24,
        boxSizing: "border-box",
        fontFamily: "'Rajdhani','Exo 2',sans-serif",
    }

    return (
        <div className="rsv-ah" style={outerStyle}>
            <a
                href={escanerHref}
                onClick={handleEscanerClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.accent,
                    background: hovered ? ctaPillBgHover : ctaPillBg,
                    border: `1px solid ${hovered ? C.ag60 : C.ag35}`,
                    borderRadius: 999,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    outline: "none",
                    textDecoration: "none",
                    boxShadow: hovered ? ctaPillShadowHover : ctaPillShadow,
                    backdropFilter:
                        "blur(20px) saturate(160%) brightness(1.08)",
                    WebkitBackdropFilter:
                        "blur(20px) saturate(160%) brightness(1.08)",
                    transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
                <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{
                        flex: "0 0 auto",
                        transform: "translateY(1px)",
                    }}
                >
                    <polygon
                        points="12,2 22,7 22,17 12,22 2,17 2,7"
                        fill="none"
                        stroke={C.accent}
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                </svg>
                Escáner Vibracional
            </a>
        </div>
    )
}

function InnerAuthHeader({
    loginText,
    onLoginClick,
    onMenuItemClick,
    supabaseUrl,
    supabaseAnonKey,
    ctaOnly,
}: any) {
    const {
        isSignedIn,
        user,
        isLoaded,
        clerkUserId: hookClerkUserId,
    } = useRealAuth()
    const { open: openModal } = useAuthModalState()

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [hoveredButton, setHoveredButton] = useState(false)
    const [hoveredAvatar, setHoveredAvatar] = useState(false)
    const [hoveredItem, setHoveredItem] = useState<number | null>(null)
    const [authTick, setAuthTick] = useState(0)
    const [fallbackUser, setFallbackUser] = useState<any>(null)
    const [signingOut, setSigningOut] = useState(false)
    const [forceShowUI, setForceShowUI] = useState(false)
    const [forceSignedOut, setForceSignedOut] = useState(false)
    /* v18.8 — Fallback del avatar: si la imageUrl de Clerk/Google
       falla a cargar (CORS, link expirado, deeplinks rotos), el
       <img> rendereaba el ícono nativo del browser de imagen rota
       (signo de interrogación). Ahora setea avatarBroken=true
       onError y se renderiza el div con iniciales. avatarSrcKey
       resetea el estado cuando cambia el imageUrl (cambio de cuenta,
       refresh post-Clerk hidratación). */
    const [avatarBroken, setAvatarBroken] = useState(false)
    const [mightHaveSession, setMightHaveSession] = useState(() =>
        hasClerkSessionCookie()
    )

    /* v18.12 — Pathname live para construir nucleoBase dinámico
       (modo Madre vs modo Escáner). Mismo patrón que
       NavegadorEstacion v4.9: rsv-navigate cubre SPA navigations,
       popstate cubre back/forward del browser. */
    const [pathname, setPathname] = useState<string>(() => {
        if (typeof window === "undefined") return ""
        return window.location.pathname || ""
    })
    useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => setPathname(window.location.pathname || "")
        window.addEventListener("rsv-navigate", tick)
        window.addEventListener("popstate", tick)
        return () => {
            window.removeEventListener("rsv-navigate", tick)
            window.removeEventListener("popstate", tick)
        }
    }, [])

    const dropdownRef = useRef<HTMLDivElement>(null)
    const avatarRef = useRef<HTMLDivElement>(null)
    const closeHoverTimeout = useRef<any>(null)
    const unmountTimeout = useRef<any>(null)

    /* ═══ Admin check ═══ */
    const clerkUserId =
        hookClerkUserId ||
        fallbackUser?.id ||
        (typeof window !== "undefined"
            ? (window as any).Clerk?.user?.id
            : null) ||
        null
    const isAdmin = useIsAdmin(
        supabaseUrl || "",
        supabaseAnonKey || "",
        clerkUserId,
        !!isSignedIn || !!fallbackUser
    )

    /* v18.12.1 — useMemo del menuItems va arriba de los early
       returns para no violar Rules of Hooks. Antes vivía después
       del segundo early return → React #310 en desktop al
       transicionar invitado → logueado. */
    const inEscaner = isEscanerContext(pathname)
    const nucleoBase = inEscaner ? "/escaner/nucleo" : "/nucleo"
    const menuItems = useMemo(
        () => buildMenuItems(nucleoBase),
        [nucleoBase]
    )

    useEffect(() => {
        injectKeyframes()
    }, [])
    useEffect(() => {
        const t = setTimeout(() => setForceShowUI(true), 1500)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        if (isLoaded) setMightHaveSession(false)
    }, [isLoaded])

    /* v18.19/v18.20 — Dispatch del evento `rsv-auth-header-ready`
       cuando el header está visualmente listo. Cubre 4 escenarios:
         · No sesión (botón INGRESAR): isLoaded ya basta — pinta
           inmediato.
         · Sesión + sin imagen (initials fallback): isLoaded basta.
         · Sesión + imagen rota: avatarBroken ya está true → basta.
         · Sesión + imagen carga OK: esperamos al onLoad del <img>
           que sube avatarLoaded a true.
       Safety: timeout de 1500ms desde isLoaded para no bloquear
       infinito si la imagen nunca dispara onLoad/onError (CDN cae,
       bloqueo de red, etc.). */
    const headerReadyDispatchedRef = useRef(false)
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    /* Reset del flag cuando cambia la imageUrl (cambio de cuenta
       o hidratación tardía de Clerk con imageUrl vacío). */
    const rawImageUrlPreLoad =
        (user as any)?.imageUrl ||
        (user as any)?.profileImageUrl ||
        (fallbackUser as any)?.imageUrl ||
        ""
    useEffect(() => {
        setAvatarLoaded(false)
    }, [rawImageUrlPreLoad])
    useEffect(() => {
        if (typeof window === "undefined") return
        if (headerReadyDispatchedRef.current) return

        const baseReady = isLoaded || forceShowUI || signingOut
        if (!baseReady) return

        const noSessionVisual = !isSignedIn && !fallbackUser
        const noImageNeeded = !rawImageUrlPreLoad
        const imageDone = avatarLoaded || avatarBroken

        if (noSessionVisual || noImageNeeded || imageDone) {
            headerReadyDispatchedRef.current = true
            try {
                window.dispatchEvent(
                    new CustomEvent("rsv-auth-header-ready")
                )
            } catch {}
            return
        }

        /* Safety timeout: si la imagen tarda >1.5s en cargar (CDN
           lento, red bloqueada), liberamos al CTA igual. La imagen
           seguirá cargando en background. */
        const safety = setTimeout(() => {
            if (headerReadyDispatchedRef.current) return
            headerReadyDispatchedRef.current = true
            try {
                window.dispatchEvent(
                    new CustomEvent("rsv-auth-header-ready")
                )
            } catch {}
        }, 1500)
        return () => clearTimeout(safety)
    }, [
        isLoaded,
        forceShowUI,
        signingOut,
        isSignedIn,
        fallbackUser,
        rawImageUrlPreLoad,
        avatarLoaded,
        avatarBroken,
    ])

    useEffect(() => {
        const h = () => {
            setAuthTick((t) => t + 1)
            setMightHaveSession(false)
            if (!hasClerkSessionCookie()) {
                setForceSignedOut(true)
                setFallbackUser(null)
            }
        }
        window.addEventListener("rsv-auth-changed", h)
        return () => window.removeEventListener("rsv-auth-changed", h)
    }, [])

    useEffect(() => {
        if (signingOut) return
        const check = () => {
            if (
                !isSignedIn &&
                (window as any).Clerk?.user &&
                (window as any).Clerk?.session
            )
                setFallbackUser((window as any).Clerk.user)
            else if (isSignedIn) setFallbackUser(null)
            else setFallbackUser(null)
        }
        check()
        const t = [setTimeout(check, 500), setTimeout(check, 1500)]
        return () => t.forEach(clearTimeout)
    }, [isSignedIn, authTick, signingOut])

    useEffect(() => {
        function h(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                avatarRef.current &&
                !avatarRef.current.contains(e.target as Node)
            )
                closeDropdown()
        }
        if (isDropdownOpen) document.addEventListener("mousedown", h)
        return () => document.removeEventListener("mousedown", h)
    }, [isDropdownOpen])

    /* v18.9 — avatarSrcKey + reset effect MOVIDO arriba de los early
       returns para no violar las Rules of Hooks. Antes vivía después
       del return de no-effectivelySignedIn y eso provocaba el React
       #310 "Rendered more hooks than during the previous render" en
       cada login (de N hooks a N+1) — pantalla negra del shell. */
    const avatarSrcKey =
        (user as any)?.profileImageUrl ||
        (user as any)?.imageUrl ||
        (fallbackUser as any)?.imageUrl ||
        ""
    useEffect(() => {
        setAvatarBroken(false)
    }, [avatarSrcKey])

    function handleMouseEnter() {
        if (closeHoverTimeout.current) clearTimeout(closeHoverTimeout.current)
        if (unmountTimeout.current) clearTimeout(unmountTimeout.current)
        setIsDropdownOpen(true)
        setIsClosing(false)
    }

    function handleMouseLeave() {
        closeHoverTimeout.current = setTimeout(() => closeDropdown(), 250)
    }

    function closeDropdown() {
        setIsClosing(true)
        unmountTimeout.current = setTimeout(() => {
            setIsDropdownOpen(false)
            setIsClosing(false)
        }, 200)
    }

    function handleLogin() {
        if (onLoginClick) onLoginClick()
        else openModal("login")
    }

    /* ═══ SIGNOUT: session.end() revoca server-side SIN redirect ═══ */
    async function handleLogout() {
        closeDropdown()
        setSigningOut(true)
        setFallbackUser(null)
        setMightHaveSession(false)

        /* 1. Revocar sesión server-side via session.end() — NO hace redirect */
        try {
            const g = (window as any).Clerk
            if (g?.session?.end) {
                await g.session.end()
            } else if (g?.session?.remove) {
                await g.session.remove()
            }
        } catch (e) {
            console.warn("[RSV] session.end error (non-fatal):", e)
        }

        /* 2. Limpiar estado local */
        nukeClerkLocal()

        /* 3. Actualizar UI */
        setSigningOut(false)
        setForceSignedOut(true)

        /* 4. Notificar (sin nav — el usuario se queda en la misma pestaña) */
        window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
    }

    function handleItemClick(item: MenuItem) {
        if (item.isLogout) {
            handleLogout()
            return
        }
        if (item.href) {
            const nav = (window as any).rsvNavigate
            if (nav) nav(item.href)
            else window.location.href = item.href
        }
        if (onMenuItemClick) onMenuItemClick(item.label)
        closeDropdown()
    }

    function handleAvatarClick() {
        /* v18.13 — Respeta el contexto: en modo Madre va a
           /nucleo#mifirma (sin saltar al shell del Escáner); en modo
           Escáner va a /escaner/nucleo#mifirma. nucleoBase ya viene
           computado arriba según pathname. */
        const target = `${nucleoBase}#mifirma`
        const nav = (window as any).rsvNavigate
        if (nav) nav(target)
        else window.location.href = target
        closeDropdown()
    }

    const outerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 140,
        minHeight: 44,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
        paddingRight: 24,
        boxSizing: "border-box",
        fontFamily: "'Rajdhani','Exo 2',sans-serif",
    }

    if (!isLoaded && !forceShowUI && !signingOut) {
        return (
            <div className="rsv-ah" style={{ ...outerStyle, opacity: 0 }}>
                <div style={{ width: 40, height: 40 }} />
            </div>
        )
    }

    const effectivelySignedIn =
        !signingOut && !forceSignedOut && (isSignedIn || !!fallbackUser)

    /* v18.17 — El botón ⬡ Escáner Vibracional dejó de vivir dentro
       del InnerAuthHeader. Ahora vive en su propio container fijo
       montado por Domo (siempre presente). Si llegamos acá con
       ctaOnly=true (legacy), retornamos null porque el AuthHeader
       exterior ya cubrió ese caso devolviendo <EscanerCTAStandalone />
       directo — pero nunca debería pasar en flujo nuevo. */
    if (ctaOnly) return null

    if (!effectivelySignedIn) {
        return (
            <div className="rsv-ah" style={outerStyle}>
                {/* v18.17 — Solo botón INGRESAR. El CTA del Escáner
                    vive en un container fijo aparte montado por Domo. */}
                <button
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "9px 22px",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: C.accent,
                        background: hoveredButton ? C.ag12 : C.ag06,
                        border: `1px solid ${hoveredButton ? C.ag60 : C.ag35}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        outline: "none",
                        boxShadow: hoveredButton
                            ? `0 0 20px ${C.ag15}`
                            : "none",
                    }}
                    onMouseEnter={() => setHoveredButton(true)}
                    onMouseLeave={() => setHoveredButton(false)}
                    onClick={handleLogin}
                >
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            borderRadius: 8,
                            pointerEvents: "none",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "50%",
                                height: "100%",
                                background: `linear-gradient(90deg,transparent,${C.ag06},transparent)`,
                                animation: hoveredButton
                                    ? "rsv-btn-shimmer 1.8s ease infinite"
                                    : "none",
                            }}
                        />
                    </span>
                    {icons.login}
                    <span>{loginText}</span>
                </button>
            </div>
        )
    }

    const displayUser =
        user ||
        (fallbackUser
            ? {
                  fullName:
                      (fallbackUser.unsafeMetadata as any)?.preferredName ||
                      fallbackUser.fullName ||
                      fallbackUser.firstName ||
                      "Usuario Solar",
                  firstName: fallbackUser.firstName || "",
                  profileImageUrl: fallbackUser.imageUrl || "",
                  primaryEmailAddress: {
                      emailAddress:
                          fallbackUser.primaryEmailAddress?.emailAddress ||
                          fallbackUser.emailAddresses?.[0]?.emailAddress ||
                          "",
                  },
              }
            : null)
    /* v18.8 — Resetear avatarBroken cuando cambia la imageUrl. Pasa
       cuando el tripulante cierra sesión y entra con otra cuenta,
       o cuando Clerk hidrata una imagen tarde tras un signup que
       trajo `imageUrl` vacío inicial.
       v18.9 — avatarSrcKey + useEffect movidos arriba (antes de los
       early returns) para no violar Rules of Hooks. Aquí ya no hay
       declaración. */
    const initials = displayUser?.firstName
        ? displayUser.firstName.charAt(0).toUpperCase()
        : displayUser?.fullName
          ? displayUser.fullName.charAt(0).toUpperCase()
          : "V"

    /* ═══ Build visible menu items — filter admin items ═══ */
    const visibleItems = menuItems.filter((item) => !item.isAdmin || isAdmin)

    return (
        <div className="rsv-ah" style={outerStyle}>
            {/* v18.17 — Solo cluster avatar+dropdown. El CTA del
                Escáner vive en un container fijo aparte montado por Domo. */}
            <div
                style={{ position: "relative" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    ref={avatarRef}
                    style={{
                        position: "relative",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        cursor: "pointer",
                        transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                        outline: "none",
                    }}
                    onMouseEnter={() => setHoveredAvatar(true)}
                    onMouseLeave={() => setHoveredAvatar(false)}
                    onClick={handleAvatarClick}
                >
                    <span
                        style={{
                            position: "absolute",
                            inset: -3,
                            borderRadius: "50%",
                            border: `1px solid ${isAdmin ? `${C.adminDim}0.3)` : C.ag20}`,
                            pointerEvents: "none",
                            animation: "rsv-glow-pulse 3s ease-in-out infinite",
                            opacity:
                                hoveredAvatar || isDropdownOpen ? 0.8 : 0.3,
                        }}
                    />
                    {displayUser?.profileImageUrl && !avatarBroken ? (
                        <img
                            key={displayUser.profileImageUrl}
                            src={displayUser.profileImageUrl}
                            alt="Avatar"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setAvatarBroken(true)}
                            onLoad={() => setAvatarLoaded(true)}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: `2px solid ${
                                    isAdmin
                                        ? hoveredAvatar || isDropdownOpen
                                            ? `${C.adminDim}0.8)`
                                            : `${C.adminDim}0.45)`
                                        : hoveredAvatar || isDropdownOpen
                                          ? C.ag80
                                          : C.ag40
                                }`,
                                transition:
                                    "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                                boxShadow:
                                    hoveredAvatar || isDropdownOpen
                                        ? isAdmin
                                            ? `0 0 18px ${C.adminDim}0.3)`
                                            : `0 0 18px ${C.ag30}`
                                        : "none",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 15,
                                fontWeight: 700,
                                color: isAdmin ? C.admin : C.accent,
                                background: isAdmin
                                    ? `radial-gradient(circle at 30% 30%,${C.adminDim}0.18),${C.adminDim}0.05))`
                                    : `radial-gradient(circle at 30% 30%,rgba(0,194,255,0.18),rgba(0,194,255,0.05))`,
                                border: `2px solid ${
                                    isAdmin
                                        ? hoveredAvatar || isDropdownOpen
                                            ? `${C.adminDim}0.8)`
                                            : `${C.adminDim}0.45)`
                                        : hoveredAvatar || isDropdownOpen
                                          ? C.ag80
                                          : C.ag40
                                }`,
                                transition:
                                    "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                                boxShadow:
                                    hoveredAvatar || isDropdownOpen
                                        ? isAdmin
                                            ? `0 0 18px ${C.adminDim}0.3)`
                                            : `0 0 18px ${C.ag30}`
                                        : "none",
                            }}
                        >
                            {initials}
                        </div>
                    )}
                </div>

                {isDropdownOpen && (
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            right: 0,
                            /* v18.5 — ancho mayor para admin: "Observatorio
                               de Resonancia" es el label más largo y a 270px
                               envolvía a dos líneas. */
                            minWidth: isAdmin ? 320 : 270,
                            background:
                                "linear-gradient(145deg,rgba(7,24,38,0.97),rgba(3,35,58,0.97))",
                            border: `1px solid rgba(0,194,255,0.18)`,
                            borderRadius: 12,
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            boxShadow: `0 16px 48px rgba(0,0,0,0.6),0 0 32px ${C.ag06},inset 0 1px 0 ${C.ag08}`,
                            overflow: "hidden",
                            zIndex: 10000,
                            animation: isClosing
                                ? "rsv-dd-exit 0.2s ease forwards"
                                : "rsv-dd-enter 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
                        }}
                    >
                        <div
                            style={{
                                padding: "18px 20px 14px",
                                borderBottom: `1px solid ${C.ag08}`,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        letterSpacing: "0.03em",
                                        margin: 0,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {displayUser?.fullName || "Viajero Solar"}
                                </p>
                                {isAdmin && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: C.admin,
                                            background: `${C.adminDim}0.1)`,
                                            border: `1px solid ${C.adminDim}0.25)`,
                                            borderRadius: 4,
                                            padding: "2px 7px",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        Admin
                                    </span>
                                )}
                            </div>
                            <p
                                style={{
                                    fontSize: 12.5,
                                    color: "rgba(120, 210, 255, 0.75)",
                                    letterSpacing: "0.06em",
                                    margin: "5px 0 0 0",
                                    fontWeight: 400,
                                    fontFamily: "'Exo 2','Rajdhani',sans-serif",
                                }}
                            >
                                {displayUser?.primaryEmailAddress
                                    ?.emailAddress || ""}
                            </p>
                        </div>
                        <div style={{ padding: "4px 0" }}>
                            {visibleItems.map((item, i) => {
                                const isAdminItem = item.isAdmin && !item.isBeta
                                const isBetaItem = !!item.isBeta
                                /* Separator: before pure-admin section and before logout */
                                const showSepBefore =
                                    item.isLogout ||
                                    ((isAdminItem || isBetaItem) &&
                                        i > 0 &&
                                        !visibleItems[i - 1]?.isAdmin)

                                /* Color logic per item type */
                                const itemColor = (hovered: boolean) => {
                                    if (isBetaItem)
                                        return hovered
                                            ? C.beta
                                            : `${C.betaDim}0.8)`
                                    if (isAdminItem)
                                        return hovered
                                            ? C.admin
                                            : `${C.adminDim}0.85)`
                                    if (item.isLogout)
                                        return hovered
                                            ? "#d4a852"
                                            : `${C.gold} 0.85)`
                                    return hovered ? C.accent : "#ffffff"
                                }
                                const itemBg = (hovered: boolean) => {
                                    if (!hovered) return "transparent"
                                    if (isBetaItem) return `${C.betaDim}0.08)`
                                    if (isAdminItem) return `${C.adminDim}0.08)`
                                    if (item.isLogout) return `${C.gold} 0.08)`
                                    return C.ag12
                                }
                                const itemGlow = (hovered: boolean) => {
                                    if (!hovered) return "none"
                                    if (isBetaItem)
                                        return `0 0 12px ${C.betaDim}0.4)`
                                    if (isAdminItem)
                                        return `0 0 12px ${C.adminDim}0.4)`
                                    if (item.isLogout)
                                        return `0 0 12px ${C.gold} 0.4)`
                                    return `0 0 12px ${C.ag40}`
                                }
                                const sepColor = isBetaItem
                                    ? `linear-gradient(90deg,transparent,${C.betaDim}0.15),${C.betaDim}0.25),${C.betaDim}0.15),transparent)`
                                    : isAdminItem
                                      ? `linear-gradient(90deg,transparent,${C.adminDim}0.15),${C.adminDim}0.25),${C.adminDim}0.15),transparent)`
                                      : `linear-gradient(90deg,transparent,rgba(0,194,255,0.12),transparent)`

                                return (
                                    <div key={item.label}>
                                        {showSepBefore && (
                                            <div
                                                style={{
                                                    height: 1,
                                                    background: sepColor,
                                                    margin: "4px 0",
                                                }}
                                            />
                                        )}
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 14,
                                                width: "100%",
                                                padding: "14px 20px",
                                                fontSize: 15,
                                                fontWeight: 600,
                                                letterSpacing: "0.08em",
                                                color: itemColor(
                                                    hoveredItem === i
                                                ),
                                                background: itemBg(
                                                    hoveredItem === i
                                                ),
                                                border: "none",
                                                cursor: "pointer",
                                                transition: "all 0.3s ease",
                                                textAlign: "left",
                                                fontFamily: "inherit",
                                                outline: "none",
                                                textShadow: itemGlow(
                                                    hoveredItem === i
                                                ),
                                                whiteSpace: "nowrap",
                                            }}
                                            onMouseEnter={() =>
                                                setHoveredItem(i)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredItem(null)
                                            }
                                            onClick={() =>
                                                handleItemClick(item)
                                            }
                                        >
                                            <span
                                                style={{
                                                    opacity:
                                                        hoveredItem === i
                                                            ? 1
                                                            : 0.7,
                                                    transition:
                                                        "opacity 0.3s ease",
                                                }}
                                            >
                                                {item.icon}
                                            </span>
                                            {item.label}
                                            {isBetaItem && (
                                                <span
                                                    style={{
                                                        fontSize: 8,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.14em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: C.beta,
                                                        background: `${C.betaDim}0.1)`,
                                                        border: `1px solid ${C.betaDim}0.25)`,
                                                        borderRadius: 3,
                                                        padding: "1px 5px",
                                                        lineHeight: 1.4,
                                                        marginLeft: 2,
                                                    }}
                                                >
                                                    Dev
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(AuthHeader, {
    clerkPublishableKey: {
        type: ControlType.String,
        title: "Clerk Publishable Key",
        defaultValue: "",
    },
    loginText: {
        type: ControlType.String,
        title: "Login Button Text",
        defaultValue: "Ingresar",
    },
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Supabase Anon Key",
        defaultValue: "",
    },
})
