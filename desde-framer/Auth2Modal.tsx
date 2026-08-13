// Red Solar Viva — Auth2Modal v17.28 — lenguaje: "Del carbono a la luz"→"De la Entropía a la Luz." + signup "Identificación de Nodo"→"Activación de cuenta".
// v17.27 — FIX registro por email: si Clerk verifica el código pero no expone createdSessionId en ese snapshot (status "complete" sin sesión), antes mostraba error ("Código incorrecto/Verificación incompleta") y el reintento daba "already been verified". Ahora detecta status complete (signUp fresco) y, si no hay sesión, inicia sesión con el email+password recién creados (signInWithPasswordFallback). Mismo rescate en el catch de "already been verified".
// v17.26 — Guarda defensiva: login/registro/reset exigen window.Clerk.client (no solo window.Clerk) antes de tocar .signIn/.signUp → si el cliente de Clerk no cargó (ej. FAPI 403 subdomain_not_allowed cuando el sitio corre en www.* sin allowlist) muestran "Conectando..." en vez de crashear con "Cannot read 'signIn'". El fix REAL del 403 es de dashboard de Clerk: agregar el subdominio www a los orígenes permitidos.
// v17.25 — FIX login web roto: el CDN de clerk-js estaba en @latest y saltó solo a v6 (major) → window.Clerk.client undefined → "Cannot read 'signIn'". Pineado a @5 (mismo major que la app iOS). NUNCA usar @latest para una dependencia de runtime por CDN.
// v17.24 — Listener `rsv-open-auth-modal` ahora acepta `detail.view` en
// el CustomEvent ("login" | "register"). El Navegante de la Red usa
// esto para abrir la modal directamente en el panel de registro o
// inicio de sesión desde su invitación post-Membrana 1. Sin view,
// fallback al comportamiento previo (open() sin argumentos).
// v17.23 — Afinaciones de copy del modal:
//   (a) Título de signup "Únete a la Red" → "Identificación de Nodo".
//   (b) Subtítulo de login "Red Solar Viva - Templo Solar 5D" →
//       "Del carbono a la luz" (mismo sub que el de signup, alineando
//       con el manifesto del Origen).
// v17.22 — Listener "rsv-open-auth-modal" que cualquier componente
// del proyecto puede dispatchar para abrir el modal sin necesidad
// de importar el hook useAuthModalState directamente. SolarNav
// (v1.2.1) lo usa para abrir el modal desde el HUD móvil del
// Ecosistema Madre. El listener llama a modalState.open() y setea
// window.__rsvAuthModalStamp para que el caller confirme que el
// modal sí lo atendió (evita fallback a /escaner/nucleo). Cambio
// 100% aditivo, no toca el flujo OAuth.
// v17.21 — Force account picker de Google vía fetch interceptor de
// la response de Clerk. Approach distinto a v17.18 (signIn.create
// con externalVerificationRedirectURL — propiedad NO expuesta en
// clerk-js v6.7.7) y a v17.19 (monkey-patch window.location.assign
// — bloqueado por el browser con "Cannot assign to read only
// property"). Acá interceptamos a nivel network: window.fetch wrapper
// intercepta la response de POST /v1/client/sign_ins (o sign_ups),
// busca recursivamente external_verification_redirect_url apuntando
// a accounts.google.com, y le agrega prompt=select_account ANTES
// de devolver el body al SDK de Clerk. El SDK lee el URL ya
// modificado del JSON parseado y redirige a Google con prompt → el
// selector de cuentas aparece SIEMPRE, en desktop y mobile, sin
// importar si Clerk strippea el alias en su capa interna.
// Auto-uninstall tras la primera interceptación o tras 8s. Si el
// interceptor falla por algún edge case, el oauth_prompt + prompt
// como fallback nativo siguen pasados a authenticateWithRedirect.
// v17.20 — REVERT urgente del v17.19 (monkey-patch de window.location.assign):
// el browser bloquea esa reasignación con "Cannot assign to read only
// property" en cuanto el flow OAuth arranca → modal crashea, parpadeo
// fuerte de la barra y el flow no completa. Volvemos al patrón
// v17.17 con doble alias (oauth_prompt + prompt). Limitación
// conocida: en escritorio Clerk strippea ambos params antes de
// llegar a Google, así que Google reusa la sesión cacheada del
// browser y entra automático. Workaround para Diego cuando quiera
// probar cuentas distintas: cerrar sesión en accounts.google.com
// manualmente, o usar incógnito por cuenta. En mobile Clerk sí
// preserva el alias y el selector aparece. Si en el futuro se
// confirma que externalVerificationRedirectURL está expuesto en
// alguna versión de Clerk, retomamos el approach v17.18.
// v17.18 — Google OAuth construye el URL manualmente con signIn.create
// (signIn flow) o signUp.create (signUp flow), agrega prompt=
// select_account al externalVerificationRedirectURL, y redirige con
// window.location.href. Bypass de authenticateWithRedirect que
// stripeaba ambos aliases (oauth_prompt y prompt) en v17.16/v17.17 y
// no llegaban a Google → entrada automática con la cuenta cacheada.
// Confirmado vía network logs: el request a accounts.google.com NO
// contenía prompt=, y el callback volvía con prompt=none. Ahora el
// param viaja en el URL y Google muestra siempre el selector de
// cuenta. Fallback al método anterior si signIn.create falla o no
// expone externalVerificationRedirectURL.
// v17.17 — Doble alias para forzar account picker de Google: pasamos
// `oauth_prompt: "select_account"` y `prompt: "select_account"` a
// authenticateWithRedirect (signIn y signUp). En v17.16 solo
// pasábamos oauth_prompt y eso funcionaba en mobile pero NO en
// desktop — Google reusaba la sesión cacheada y entraba automático
// con la última cuenta. Pasar ambos aliases cubre las dos APIs que
// Clerk ha usado entre versiones de su SDK.
// v17.16 — oauth_prompt=select_account en authenticateWithRedirect Google
// (signIn y signUp). Sin este passthrough, después de cerrar sesión el
// tripulante picaba "Iniciar sesión con Google" y Google reusaba la
// sesión cacheada del browser → entraba con la misma cuenta sin
// preguntar. Ahora Google muestra siempre el selector de cuenta.
// v17.15 — Hot fix CRÍTICO: pantalla negra en cualquier ruta tras
// un OAuth previo. Causa: el flag "rsv-clerk-oauth-redirect" tenía
// TTL de 5 minutos sin limpieza al primer mount (v17.13). Si por
// algún edge case el flow no llegaba a handleClose y limpiar el flag,
// quedaba zombie y cualquier navegación posterior dentro de los 5
// minutos disparaba el oauthOverlay del Domo (background #000000,
// zIndex max). Dos defensas:
// (1) checkRedirectFlag: TTL bajado de 5min a 90s. Si el callback
//     real toma más que eso, ya hubo problema de red de todos modos.
// (2) Detección de flag residual: si al mount el flag está PERO
//     clerk.user ya está set Y la sesión es de hace más de 30s, el
//     flag es residual de un flow anterior. Lo limpiamos y NO
//     procesamos, evitando encender el overlay sin razón.
// Auth2Modal v17.14
// v17.14 — Set del flag "rsv-seen-seal-modal-${userId}" también en
// el path "prefilled consent" (register Google con casilla marcada).
// Antes el flag se seteaba SOLO en handleClose con view=google-confirm,
// pero en prefilled consent el modal nunca aparece (consent ya dado)
// → flag nunca seteado → login posterior de esa cuenta volvía a
// mostrar el modal "Sella tu entrada" indebidamente. Ahora cualquier
// path que complete el registro marca el flag para evitar que la
// cuenta vuelva a recibir el prompt.
// Auth2Modal v17.13
// v17.13 — checkAndClearRedirectFlag YA NO limpia el flag al
// primer mount. Causa raíz del modal "Sella tu entrada" que no
// aparecía en login OAuth con cuenta nueva: Clerk hace un reload
// interno DESPUÉS de procesar el OAuth callback (limpia params del
// URL navegando). En esa segunda carga, Auth2Modal montaba de nuevo
// pero el flag rsv-clerk-oauth-redirect ya estaba limpio (se limpió
// en la primera carga) → no detectaba el redirect → no llamaba
// processGoogleReturn → no aparecía el modal. Ahora la limpieza
// del flag se hace solo al final de handleClose, cuando el flow
// terminó de verdad. processGoogleReturn es idempotente: si clerk.user
// ya está set en la segunda carga, salta el handleRedirectCallback
// y va directo a la detection del modal.
// Auth2Modal v17.12
// v17.12 — Setea "rsv-suppress-welcome" en handleGoogleAuth ANTES
// del redirect a Google. Crítico: el OAuth callback es un RELOAD
// completo de página. Cuando vuelve, Domo y EscanerVibracional
// montan de cero. EscanerVibracional revisa el flag al levantar el
// authStatus para decidir si saltar el splash. Si el flag se setea
// solo en triggerSuccess (después del callback), llega tarde —
// EscanerVibracional ya disparó el splash. Setearlo antes del
// redirect garantiza que ya esté presente cuando la página
// recargue.
// Auth2Modal v17.11
// v17.11 — Tres fixes laser-focused para login OAuth con cuenta nueva:
// (1) Detection con fallback ULTRA permisivo: si mayCreateRecent
//     está set Y NO hay evidencia de cuenta vieja (userIsOld o
//     userToSessionGapIsLarge), asumimos cuenta nueva sin requerir
//     que createdAt sea parseable. Antes Clerk a veces devolvía
//     createdAt como NaN justo después del transferable signin →
//     signup automático y el modal "Sella tu entrada" no salía.
// (2) localStorage flag "rsv-seen-seal-modal-${userId}". Cuando el
//     modal "Sella tu entrada" se muestra (view=google-confirm),
//     marcamos el flag para ese user. En futuros logins de la
//     misma cuenta saltamos el modal incluso si justCreated es
//     true. Resuelve el loop reportado por Zak: si cierra el modal
//     con la X la primera vez, ya no vuelve a aparecer.
// (3) Splash del Escáner Vibracional skipea cuando viene del flow
//     OAuth (cambio en EscanerVibracional v13.23). El splash ya
//     no aparece como "animación interrumpiendo el flow" después
//     de iniciar sesión con Google.
// Auth2Modal v17.10
// v17.10 — Tres fixes finales sobre v17.9:
// (1) Detection con session vs user createdAt comparison. La señal
//     más confiable para distinguir signin de cuenta vieja vs signup
//     nuevo: si `clerk.session.createdAt` es de ahora y
//     `clerk.user.createdAt` es de hace >60s, es signin puro (la
//     cuenta es vieja). Esto resuelve el caso reportado donde una
//     cuenta cuyo modal "Sella tu entrada" se cerró sin completar
//     dejaba `clerk.client.signUp.id` zombie en el cliente local;
//     cada login posterior leía ese id como "cuenta nueva" y volvía
//     a mostrar el modal indebidamente.
// (2) En flows OAuth, NO mostramos la pantalla "¡Acceso Concedido!"
//     (1500ms con animación pop). Vamos directo de processGoogleReturn
//     a handleClose con overlay tape. La animación pop podía
//     interpretarse como "animación de la app" interrumpiendo el
//     flow. En flows email/pass mantenemos el isSuccess view (Zak
//     pidió mantener ese feedback).
// (3) En processGoogleReturn al setear google-confirm, encadenamos
//     setView+setIsGoogleLoading+setKeepModalOpen+setNodoConsent
//     dentro de un microtask (Promise.resolve) para que React 18
//     los batch en un solo render. Antes el render intermedio
//     mostraba transición visible entre "Conectando..." y
//     "Sella tu entrada".
// (4) Best-effort cleanup del signUp client al cerrar modal sin
//     completar. Llamamos clerk.client.signUp?.update con
//     unsafeMetadata vacío como heartbeat o ignoramos el error.
//     Esto evita el zombie state que reportó Zak.
// Auth2Modal v17.9
// v17.9 — Dos fixes adicionales sobre v17.8:
// (1) Detection de cuenta nueva ampliada: cuando login OAuth crea
//     una cuenta nueva (transferable signin → signup completado por
//     Clerk), `clerk.client.signUp` a veces queda limpio tras el
//     transfer. La detection v17.8 dependía de signUpIsActive en el
//     último signal y producía falso negativo (no aparecía la
//     pantalla "Sella tu entrada"). Ahora aceptamos
//     "mayCreateRecent + ageMs<10min" sin requerir signUpIsActive,
//     con un override defensivo: si signIn.status==="complete" +
//     sin signUp + ageMs>60s, es signin puro de cuenta vieja y NO
//     marca justCreated (preserva el fix de v17.8 contra el falso
//     positivo del modal "Sella tu entrada" en login normal).
// (2) Dispatchea "rsv-oauth-overlay-keep" en cada checkpoint del
//     flow (entrada a processGoogleReturn, setView google-confirm,
//     handleConfirmGoogleSignup, triggerSuccess) para que el
//     overlay anti-flash de Domo se mantenga sólido aunque haya
//     re-mounts intermedios. Sin esto, el overlay tenía ventanas
//     donde se apagaba brevemente y Diego veía la animación
//     "Escáner Vibracional" parpadear encima del modal.
// (3) Avatar de la pantalla "Sella tu entrada": preload de la
//     imageUrl con timeout 3.5s. Si la imagen de Google no carga
//     o si Clerk aún no la propagó (cuenta recién creada por
//     transferable signin → signup), forzamos avatarBroken=true
//     y mostramos la inicial cyan en lugar del "?". Cubre el caso
//     reportado donde login OAuth con cuenta nueva mostraba
//     ícono de imagen rota mientras register normal sí cargaba.
// Auth2Modal v17.8
// v17.8 — Fixes integrales del flow OAuth + signin:
// (1) Detection de "cuenta nueva" reescrita. Antes el signal
//     "mayCreate + isNaN(ageMs) + sin metadata" disparaba falso
//     positivo cuando el tripulante iniciaba sesión con su cuenta
//     vieja (sin nodoConsent en metadata) y la pantalla "Sella tu
//     entrada" salía indebidamente. Nueva detection prioriza
//     signUp.id activo + status (complete | missing_requirements |
//     transferable). Sin signUp activo = signin de cuenta vieja
//     siempre. ageMs<60s queda como fallback.
// (2) handleClose dispatchea "rsv-oauth-overlay-end" DESPUÉS del
//     setTimeout interno (no antes). Eso mantiene el overlay sólido
//     de Domo activo durante el fade-out del modal y deja que las
//     animaciones de entrada del shell debajo terminen ocultas.
// (3) triggerSuccess + handleConfirmGoogleSignup setean sessionStorage
//     "rsv-suppress-welcome" antes del cierre → cualquier remount o
//     reload posterior arranca con la welcome animation desactivada.
// (4) Login OAuth con cuenta nueva: la pantalla "Sella tu entrada"
//     ahora se muestra siempre que signUp tenga id activo, incluso
//     si los signals de createdAt/status no se populan a tiempo.
// Auth2Modal v17.7
// v17.7 — Cuatro fixes finales del flow Google:
// (1) Pre-consent llama también a record_nodo_subscription desde
//     el frontend antes de triggerSuccess. Antes confiábamos solo
//     en BienvenidaNodo (webhook user.created) para suscribir, pero
//     si el webhook tarda o falla, la fila no aparece en
//     nodo_central. Doble seguro idempotente: webhook + frontend.
// (2) Avatar fallback con onError → marca avatarBroken=true → muestra
//     la inicial cyan en lugar del broken-image icon. referrerPolicy
//     "no-referrer" + crossOrigin "anonymous" maximiza chance de
//     que la imageUrl de Clerk/Google cargue.
// (3) Detection robusta de "cuenta nueva" cuando ageMs es NaN: si
//     mayCreate flag estaba Y unsafeMetadata vacío, asumimos cuenta
//     nueva. Cubre signin con Google de cuenta inexistente cuando
//     Clerk transfiere a signUp internamente y los signals canónicos
//     no se populan.
// (4) Auth2Modal dispara "rsv-oauth-overlay-start" cuando detecta
//     redirect flag → Domo lo escucha y enciende el overlay anti-flash
//     aunque el state inicial estuviera en false (caso remount).
// Auth2Modal v17.6
// v17.6 — Tres refinamientos del flow Google:
// (1) Si el tripulante marcó la casilla de consent en el form de
//     Crear Cuenta antes de picar Google, sessionStorage guarda
//     "rsv-clerk-oauth-consent=1". Al volver del OAuth saltamos la
//     pantalla intermedia y entramos directo al app — su decisión
//     ya está tomada y BienvenidaNodo ya hizo record_nodo_subscription
//     vía unsafe_metadata.
// (2) Detection de "cuenta recién creada" más permisiva: además de
//     los signals existentes (signUp.createdSessionId,
//     signUp.status, ageMs<60s), ahora también consideramos
//     "cuenta nueva" si el flag pre-redirect "rsv-clerk-oauth-may-create"
//     estaba seteado Y ageMs<5min. Cubre el caso de signin con Google
//     desde tab "Iniciar Sesión" cuando la cuenta no existía y Clerk
//     la transfirió a signUp internamente — los signals 1-3 a veces
//     no se populan a tiempo.
// (3) Overlay anti-flash de Domo persiste hasta que el modal cierre
//     (handleClose) en lugar de apagarse al entrar a google-confirm.
//     Combinado con el backdrop sólido, garantiza que el shell de la
//     app NUNCA es visible durante el flow OAuth → confirm → entrada.
// Auth2Modal v17.5
// v17.5 — Cinco refinamientos:
// (1) Ojos de contraseña sincronizados: picar uno revela ambas.
// (2) Mensaje de contraseña filtrada en dos líneas. "SECUENCIA
//     VULNERABLE." en una y la explicación en la siguiente.
//     whiteSpace:pre-line en los dos `<p>` que renderizan errores.
// (3) Detection robusta de "cuenta recién creada" en OAuth callback.
//     Antes solo checábamos `clerk.user.createdAt < 60s` y a veces
//     ese parse fallaba o devolvía NaN → tripulantes que crean cuenta
//     desde el tab "Iniciar Sesión" entraban directo al app sin pasar
//     por la pantalla intermedia. Ahora chequeamos también
//     `signUp.createdSessionId` y `signUp.status === "complete"`.
// (4) Modal compactado en viewports < 540px via @media query: padding
//     18/22/22, h2 19px, subtítulo 9px, tabs marginBottom 16, divider
//     14px. El flujo de Crear Cuenta entra completo sin scroll.
// (5) Backdrop del modal pasa a sólido (#050810, sin blur) cuando
//     isGoogleLoading o view==="google-confirm". Antes el backdrop
//     era 88% alpha y dejaba ver la animación del shell debajo durante
//     el callback de Google. Combinado con el overlay de Domo el flash
//     queda completamente eliminado.
// Auth2Modal v17.4
// v17.4 — Refinamientos del Protocolo de Unificación:
// (1) Título "Sella tu entrada" reemplaza "Únete a la Red" en la
//     pantalla intermedia. Subtítulo oculto.
// (2) Avatar 84x84 con margin auto centrado y más respiración.
// (3) Email con fuente sistema (Apple/Segoe), peso 500, sin
//     letter-spacing — legible.
// (4) Modal con maxWidth 480 cuando está en google-confirm (era 420)
//     para más aire visual.
// (5) La pantalla intermedia ahora se muestra TAMBIÉN cuando el
//     OAuth viene del tab "Iniciar Sesión" si la cuenta resulta
//     nueva (ageMs < 60s). Cubre el caso de quienes pican Google en
//     login pero no tenían cuenta — Clerk la crea y deben pasar por
//     el consent.
// (6) Padding del contenedor compactado en google-confirm (20/28/22
//     vs 32/32/28) y botón close subido a top:12 → cabe completo en
//     viewports mobile sin scroll.
// (7) Mensaje de "form_password_pwned" reescrito a tono RSV:
//     "SECUENCIA VULNERABLE..." (era "Contraseña filtrada. Usa
//     otra.").
// (8) Anti-flash: el modal dispara "rsv-oauth-overlay-end" cuando
//     entra a google-confirm o triggea success. Domo respeta el
//     evento para apagar su overlay anti-flash post-redirect.
// Auth2Modal v17.3
// v17.3 — Protocolo de Unificación post-Google OAuth.
// Cuando el tripulante crea cuenta nueva con Google (cuenta < 60s
// de creada), el modal NO entra al app inmediatamente. Muestra una
// pantalla intermedia "google-confirm" con:
//   · Avatar circular (imageUrl de Clerk) o inicial del email.
//   · Email confirmado por Google.
//   · Checkbox de suscripción (default DESMARCADA — fuerza decisión
//     manual incluso si la marcaron antes del OAuth).
//   · Botón único "CREAR CUENTA" que sella la entrada.
// Si el checkbox queda marcado, llamamos al RPC
// record_nodo_subscription con clerk_google_consent como source. Si
// no, sólo entramos al app — el correo de bienvenida ya disparado
// trae el CTA "Activar Recepción de Pulsos" como segunda
// oportunidad. Cuentas viejas (signin de Google con cuenta
// existente) saltan la pantalla intermedia y entran directo.
// Texto del checkbox renovado en español neutro: "Enlazar mi
// receptor a las transmisiones de Red Solar Viva (Actualizaciones
// del Escáner, nuevas herramientas biológicas y Códices)."
// Auth2Modal v17.2
// v17.2 — Consent al Nodo Central en el modal de Crear Cuenta.
// Checkbox cyan (default unchecked, opt-in explícito) "Recibir
// transmisiones del Nodo Central". El estado viaja a Clerk como
// `unsafeMetadata.nodoConsent` tanto en signup con email/password
// (signUp.create) como con Google OAuth (signUp.authenticateWithRedirect).
// El webhook user.created → BienvenidaNodo.js (Pipedream) lee el
// metadata y, si es true, llama a record_nodo_subscription tras
// mandar el correo de bienvenida. Si es false, sólo manda el correo
// transaccional (con su CTA "Activar Recepción de Pulsos" para
// suscribirse después).
// Auth2Modal v17.1
// v17.1: zIndex bumped a 2147483647 (max int) para que el modal SIEMPRE
// cubra la barra superior de MobileNavigation (que también usa zIndex
// 99999). Antes, dependiendo del orden de render, la barra quedaba
// encima del modal cuando se abría desde /nucleo guest. Ahora siempre
// arriba de todo.

import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect, useRef, useCallback } from "react"
import { useAuthModalState } from "./AuthOverrides.tsx"

declare global {
    interface Window {
        Clerk: any
    }
}
type AuthView =
    | "login"
    | "register"
    | "verify"
    | "forgot"
    | "reset"
    /* Pantalla intermedia post-Google OAuth en el flow de signup. El
       Protocolo de Unificación obliga a que la casilla de consent
       sea visible y manualmente decidida antes de entrar al app,
       sin importar si el tripulante usó email/password o Google. */
    | "google-confirm"
interface AuthModalProps {
    isOpen?: boolean
    defaultView?: AuthView
    onClose?: () => void
    onAuthSuccess?: (user: any) => void
    clerkPublishableKey?: string
}

const REDIRECT_FLAG_KEY = "rsv-clerk-oauth-redirect"
const REDIRECT_VIEW_KEY = "rsv-clerk-oauth-view"
const REDIRECT_TIME_KEY = "rsv-clerk-oauth-time"

function setRedirectFlag(v: string) {
    try {
        const now = Date.now().toString()
        sessionStorage.setItem(REDIRECT_FLAG_KEY, now)
        sessionStorage.setItem(REDIRECT_VIEW_KEY, v)
        sessionStorage.setItem(REDIRECT_TIME_KEY, now)
    } catch (_) {}
}
/* v17.13 — checkRedirectFlag (renombrada): YA NO limpia el flag.
   El motivo: Clerk hace un reload interno tras handleRedirectCallback
   y Auth2Modal monta de nuevo. Si limpiamos en el primer mount, el
   segundo mount no detecta el flag y nunca procesa el OAuth → el
   modal "Sella tu entrada" nunca aparece. Ahora el flag se limpia
   solo cuando el flow termina (handleClose) o expira por TTL natural
   (5 min). */
function checkRedirectFlag(): {
    isRedirect: boolean
    view: string
    redirectTime: number
} {
    try {
        const f = sessionStorage.getItem(REDIRECT_FLAG_KEY)
        const v = sessionStorage.getItem(REDIRECT_VIEW_KEY) || "login"
        const t = sessionStorage.getItem(REDIRECT_TIME_KEY) || "0"
        if (f) {
            /* v17.15 — TTL bajado de 5min a 90s. Suficiente para flows
               OAuth lentos con 2FA, corto para que un flag zombie no
               persista por minutos encendiendo el overlay en otras
               rutas. */
            if (Date.now() - parseInt(f, 10) < 90 * 1000)
                return {
                    isRedirect: true,
                    view: v,
                    redirectTime: parseInt(t, 10),
                }
            sessionStorage.removeItem(REDIRECT_FLAG_KEY)
            sessionStorage.removeItem(REDIRECT_VIEW_KEY)
            sessionStorage.removeItem(REDIRECT_TIME_KEY)
        }
    } catch (_) {}
    return { isRedirect: false, view: "login", redirectTime: 0 }
}

function clearRedirectFlag() {
    try {
        sessionStorage.removeItem(REDIRECT_FLAG_KEY)
        sessionStorage.removeItem(REDIRECT_VIEW_KEY)
        sessionStorage.removeItem(REDIRECT_TIME_KEY)
    } catch (_) {}
}
function generateUsername(email: string): string {
    return `${email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .substring(0, 16)}_${Math.floor(Math.random() * 9000 + 1000)}`
}

const ACCENT = "#00C2FF"
const ACCENT_DARK = "#0099cc"
const cyan = "rgba(0, 194, 255,"
const gold = "rgba(210, 170, 100,"

const KEYFRAMES_ID = "rsv-auth-modal-keyframes"
function injectStyles() {
    if (typeof document === "undefined") return
    if (document.getElementById(KEYFRAMES_ID)) return
    const s = document.createElement("style")
    s.id = KEYFRAMES_ID
    s.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Exo+2:wght@200;300;400;500;600&display=swap');
            @keyframes rsv-modal-backdrop-in{from{opacity:0}to{opacity:1}}
            @keyframes rsv-modal-panel-in{from{opacity:0;transform:scale(0.92) translateY(20px);filter:blur(8px)}to{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}
            @keyframes rsv-modal-panel-out{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(0.95) translateY(12px);filter:blur(4px)}}
            @keyframes rsv-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
            @keyframes rsv-pulse-ring{0%{transform:scale(0.95);opacity:0.6}50%{transform:scale(1.02);opacity:1}100%{transform:scale(0.95);opacity:0.6}}
            @keyframes rsv-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
            @keyframes rsv-star-twinkle{0%,100%{opacity:0.2}50%{opacity:0.8}}
            @keyframes rsv-success-pop{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
            .rsv-modal-input::placeholder{color:rgba(0,194,255,0.25)!important;letter-spacing:0.06em}
            .rsv-modal-input:focus{outline:none!important;border-color:rgba(0,194,255,0.5)!important;box-shadow:0 0 0 1px rgba(0,194,255,0.2),0 0 24px rgba(0,194,255,0.08)!important}
            .rsv-modal-input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px rgba(8,12,18,1) inset!important;-webkit-text-fill-color:rgba(220,230,235,0.9)!important}
            .rsv-otp-input{width:44px;height:52px;text-align:center;font-size:20px;font-weight:600;font-family:'Rajdhani',sans-serif;color:${ACCENT};background:rgba(8,12,18,0.8);border:1px solid rgba(0,194,255,0.15);border-radius:8px;transition:all 0.3s ease}
            .rsv-otp-input:focus{outline:none;border-color:rgba(0,194,255,0.6);box-shadow:0 0 15px rgba(0,194,255,0.15)}
            #clerk-captcha{position:absolute!important;bottom:0!important;left:0!important;width:100%!important;z-index:0!important;opacity:0!important;pointer-events:none!important}
            /* v17.5 — Modal compactado en viewports estrechos para que el
               flujo de Crear Cuenta entre completo sin scroll. Reducimos
               padding del contenedor, tamaño del título y márgenes
               internos. Desktop sigue intacto. */
            @media (max-width: 540px) {
              .rsv-modal-content { padding: 18px 22px 22px !important; }
              .rsv-modal-h2-title { font-size: 19px !important; margin: 2px 0 0 !important; letter-spacing: 0.14em !important; }
              .rsv-modal-subtitle { margin-top: 2px !important; font-size: 9px !important; }
              .rsv-modal-tabs-wrap { margin-bottom: 16px !important; }
              .rsv-modal-google-divider { margin: 14px 0 !important; }
              .rsv-modal-input { padding: 11px 14px 11px 42px !important; font-size: 14px !important; }
            }
        `
    document.head.appendChild(s)
}

function StarField() {
    const st = Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        sz: Math.random() * 1.8 + 0.5,
        dl: Math.random() * 5,
        dr: Math.random() * 3 + 2,
        op: Math.random() * 0.4 + 0.1,
    }))
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                borderRadius: 16,
                pointerEvents: "none",
            }}
        >
            {st.map((s) => (
                <div
                    key={s.id}
                    style={{
                        position: "absolute",
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: s.sz,
                        height: s.sz,
                        borderRadius: "50%",
                        background: `rgba(0,194,255,${s.op})`,
                        boxShadow: `0 0 ${s.sz * 2}px rgba(0,194,255,${s.op * 0.5})`,
                        animation: `rsv-star-twinkle ${s.dr}s ease-in-out ${s.dl}s infinite`,
                    }}
                />
            ))}
        </div>
    )
}
function SolarIcon() {
    return (
        <div
            style={{
                position: "relative",
                width: 56,
                height: 56,
                margin: "0 auto 8px",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: `1px solid ${cyan} 0.2)`,
                    animation: "rsv-pulse-ring 3s ease-in-out infinite",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 8,
                    borderRadius: "50%",
                    border: `1px solid ${cyan} 0.15)`,
                    animation: "rsv-pulse-ring 3s ease-in-out 0.5s infinite",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 16,
                    borderRadius: "50%",
                    background: `radial-gradient(circle,${cyan} 0.4) 0%,${cyan} 0.1) 60%,transparent 100%)`,
                    boxShadow: `0 0 20px ${cyan} 0.2)`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: ACCENT,
                    boxShadow: `0 0 8px ${cyan} 0.6)`,
                }}
            />
        </div>
    )
}
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}
function Spinner() {
    return (
        <div
            style={{
                width: 18,
                height: 18,
                border: `2px solid ${cyan} 0.2)`,
                borderTopColor: ACCENT,
                borderRadius: "50%",
                animation: "rsv-spin 0.7s linear infinite",
            }}
        />
    )
}
function EyeToggle({ show, onClick, hoverKey, hovered, setHovered }: any) {
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(hoverKey)}
            onMouseLeave={() => setHovered(null)}
            style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                opacity: hovered === hoverKey ? 0.7 : 0.3,
                transition: "opacity 0.3s ease",
                outline: "none",
            }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={`${cyan} 1)`}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {show ? (
                    <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </>
                ) : (
                    <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                )}
            </svg>
        </button>
    )
}

function translateClerkError(code: string | undefined, msg: string) {
    const m: Record<string, string> = {
        form_identifier_not_found: "Ese email no pertenece a ninguna cuenta.",
        identifier_not_found: "Ese email no pertenece a ninguna cuenta.",
        form_password_incorrect: "La contraseña es incorrecta.",
        form_identifier_exists:
            "Este correo ya está registrado. Inicia sesión.",
        form_password_length_too_short: "Mínimo 8 caracteres.",
        password_not_complex:
            "Debe incluir mayúsculas, minúsculas, números y símbolos.",
        form_password_pwned:
            "SECUENCIA VULNERABLE.\nEsta combinación presenta fisuras de seguridad en la red global. Por la integridad térmica de tu Nodo, establece un código de acceso único y privado.",
        not_allowed_password:
            "SECUENCIA VULNERABLE.\nEsta combinación presenta fisuras de seguridad en la red global. Por la integridad térmica de tu Nodo, establece un código de acceso único y privado.",
        session_exists: "Ya tienes una sesión activa.",
        identifier_already_signed_in: "Ya tienes una sesión activa.",
        verification_failed: "Código incorrecto o expirado.",
        verification_expired: "Código expirado.",
        strategy_for_user_invalid:
            "Esta cuenta usa otro método de ingreso (ej. Google).",
        external_account_not_found:
            "Esta cuenta de Google no está registrada. Crea una cuenta primero.",
        external_account_exists:
            "Ya existe una cuenta con ese correo. Inicia sesión.",
        oauth_access_denied: "Acceso denegado por Google.",
    }
    return code && m[code] ? m[code] : msg
}
function cleanClerkParams() {
    if (typeof window === "undefined") return
    try {
        const u = new URL(window.location.href)
        let c = false
        const r: string[] = []
        u.searchParams.forEach((_, k) => {
            if (k.startsWith("__clerk")) {
                r.push(k)
                c = true
            }
        })
        r.forEach((k) => u.searchParams.delete(k))
        if (window.location.hash.includes("__clerk")) {
            u.hash = ""
            c = true
        }
        if (c) window.history.replaceState({}, "", u.toString())
    } catch (_) {}
}

export default function Auth2Modal({
    defaultView = "login",
    onClose,
    onAuthSuccess,
    clerkPublishableKey = "",
    supabaseUrl = "",
    supabaseAnonKey = "",
}: AuthModalProps & { supabaseUrl?: string; supabaseAnonKey?: string }) {
    const modalState = useAuthModalState()
    const [view, setView] = useState<AuthView>(defaultView)
    useEffect(() => {
        if (modalState.isOpen && modalState.view) {
            const storeView = modalState.view as AuthView
            if (storeView === "login" || storeView === "register") {
                setView(storeView)
            }
        }
    }, [modalState.isOpen, modalState.view])
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState("")
    const [isClosing, setIsClosing] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [hovered, setHovered] = useState<string | null>(null)
    const [keepModalOpen, setKeepModalOpen] = useState(false)
    /* v17.9 — isOauthFlowActive: true desde que processGoogleReturn
       arranca hasta que handleClose termina. Garantiza que el modal
       NUNCA retorna null durante el flow OAuth — si por algún motivo
       modalState.isOpen y keepModalOpen llegan a false al mismo tiempo
       (caso edge), este flag mantiene el modal renderizado para que
       no haya un frame donde el shell quede visible detrás del overlay
       en fade-out. */
    const [isOauthFlowActive, setIsOauthFlowActive] = useState(false)
    /* Consent al Nodo Central (lista de correos) en el momento de
       crear cuenta. Default false → opt-in explícito. Se viaja a
       Clerk como unsafeMetadata.nodoConsent y el webhook user.created
       (BienvenidaNodo en Pipedream) lo lee para decidir si suscribir
       al usuario al nodo_central tras crear su cuenta. Aplica tanto
       a signup con email/password como a signup con Google OAuth. */
    const [nodoConsent, setNodoConsent] = useState(false)
    /* v17.7 — Algunos imageUrl de Clerk/Google fallan a cargar
       (CORS, link expirado, deeplinks). Si la imagen <img> dispara
       onError, marcamos avatarBroken=true y mostramos la inicial. */
    const [avatarBroken, setAvatarBroken] = useState(false)

    const redirectCheckedRef = useRef(false)
    const isRedirectRef = useRef(false)
    const redirectViewRef = useRef("login")
    const redirectTimeRef = useRef(0)
    const modalRef = useRef<HTMLDivElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const viewRef = useRef(view)
    viewRef.current = view
    const isLoadingRef = useRef(isLoading)
    isLoadingRef.current = isLoading
    const isVerifyingRef = useRef(false)
    const emailRef2 = useRef(email)
    emailRef2.current = email

    useEffect(() => {
        if (redirectCheckedRef.current) return
        redirectCheckedRef.current = true
        const {
            isRedirect,
            view: rv,
            redirectTime,
        } = checkRedirectFlag()
        if (isRedirect) {
            /* v17.15 — Detección de flag residual: si clerk.user ya
               está set Y la sesión actual tiene más de 30s, este flag
               es residual de un OAuth previo que no fue limpiado. NO
               procesamos: limpiamos y salimos para no encender el
               overlay del Domo en una ruta inocente (causaba pantalla
               negra en /codices, /, etc tras un signin). */
            try {
                const clerk = (window as any).Clerk
                if (clerk?.user && clerk?.session?.createdAt) {
                    const sessionAgeMs =
                        Date.now() -
                        new Date(clerk.session.createdAt).getTime()
                    if (!isNaN(sessionAgeMs) && sessionAgeMs > 30000) {
                        clearRedirectFlag()
                        return
                    }
                }
            } catch {}
            isRedirectRef.current = true
            redirectViewRef.current = rv
            redirectTimeRef.current = redirectTime
            setIsGoogleLoading(true)
            setKeepModalOpen(true)
            if (modalState.open) modalState.open()
            /* v17.7 — Notificamos a Domo que arranque su overlay
               anti-flash. Domo también se inicializa leyendo el flag
               de sessionStorage al mount, pero si por algún motivo
               el state arrancó en false (Domo se remontó después de
               que Auth2Modal limpió el flag) este evento lo enciende
               igual. */
            if (typeof window !== "undefined")
                window.dispatchEvent(
                    new CustomEvent("rsv-oauth-overlay-start")
                )
        }
    }, [])

    useEffect(() => {
        if (modalState.isOpen && window.Clerk?.user && window.Clerk?.session) {
            const age =
                Date.now() - new Date(window.Clerk.user.createdAt).getTime()
            if (age > 300000) triggerSuccess()
        }
    }, [modalState.isOpen])

    /* v17.22 — Listener cross-component para abrir el modal desde
       cualquier punto del ecosistema. SolarNav (HUD móvil del
       Ecosistema Madre) dispatcha "rsv-open-auth-modal" cuando el
       tripulante toca [SELLO / LOG IN]. El stamp en window confirma
       atención para que el caller no caiga al fallback. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const onOpen = (e: Event) => {
            try {
                ;(window as any).__rsvAuthModalStamp = Date.now()
            } catch {}
            /* v17.24 — Si el dispatcher pasó view en el detail, lo
               propagamos al store. El store también acepta open()
               sin argumentos (default mode). */
            const detail = (e as CustomEvent).detail as
                | { view?: string }
                | undefined
            const v = detail?.view
            try {
                if (modalState?.open) {
                    if (v === "login" || v === "register")
                        modalState.open(v as any)
                    else modalState.open()
                }
            } catch {}
        }
        window.addEventListener("rsv-open-auth-modal", onOpen as any)
        return () =>
            window.removeEventListener("rsv-open-auth-modal", onOpen as any)
    }, [modalState])

    useEffect(() => {
        injectStyles()
        if (!clerkPublishableKey || typeof window === "undefined") return
        const l = async () => {
            if (window.Clerk?.client) {
                if (isRedirectRef.current)
                    await processGoogleReturn(window.Clerk)
                return
            }
            if (!document.querySelector("script[data-clerk-script]")) {
                const sc = document.createElement("script")
                sc.setAttribute("data-clerk-script", "true")
                sc.src =
                    "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
                sc.setAttribute(
                    "data-clerk-publishable-key",
                    clerkPublishableKey
                )
                sc.async = true
                sc.crossOrigin = "anonymous"
                sc.onload = async () => {
                    try {
                        await window.Clerk.load()
                        if (isRedirectRef.current)
                            await processGoogleReturn(window.Clerk)
                    } catch (e) {
                        setIsGoogleLoading(false)
                    }
                }
                document.head.appendChild(sc)
            }
        }
        l()
    }, [clerkPublishableKey])

    async function processGoogleReturn(clerk: any) {
        // FIX: Forzar siempre ruta absoluta con origen incluido para obligar a Clerk a quedarse
        const exactCurrentUrl =
            window.location.origin +
            window.location.pathname +
            (window.location.hash || "")

        /* v17.9 — Marcamos el flow OAuth como activo: el modal se
           mantiene renderizado durante todo el procesamiento sin
           depender de modalState.isOpen ni keepModalOpen (que pueden
           bajar a false brevemente entre transiciones). */
        setIsOauthFlowActive(true)

        /* v17.9 — Mantener vivo el overlay anti-flash de Domo durante
           todo el processGoogleReturn. Si Domo se remontó tras el
           redirect (state inicial perdido) o si el listener de "start"
           llegó tarde, este "keep" garantiza que el overlay quede
           sólido durante la carga de Clerk + handleRedirectCallback. */
        try {
            if (typeof window !== "undefined")
                window.dispatchEvent(new CustomEvent("rsv-oauth-overlay-keep"))
        } catch {}

        try {
            if (!clerk.user) {
                try {
                    await clerk.handleRedirectCallback({
                        redirectUrl: exactCurrentUrl,
                        signInFallbackRedirectUrl: exactCurrentUrl,
                        signUpFallbackRedirectUrl: exactCurrentUrl,
                        afterSignInUrl: exactCurrentUrl,
                        afterSignUpUrl: exactCurrentUrl,
                    })
                } catch (e: any) {
                    setIsGoogleLoading(false)
                    setError(
                        translateClerkError(
                            (e.errors || [])[0]?.code,
                            "Error con Google."
                        )
                    )
                    isRedirectRef.current = false
                    cleanClerkParams()
                    return
                }
                await new Promise((r) => setTimeout(r, 1000))
            }

            if (clerk.user) {
                /* Protocolo de Unificación (2026-04-27):
                   Si la cuenta de Google se ACABA de crear NO entramos
                   al app inmediatamente. Mostramos la pantalla
                   intermedia "google-confirm" con avatar + email +
                   checkbox de consent + botón "CREAR CUENTA".
                   Aplica AUNQUE el tripulante haya picado Google
                   desde el tab "Iniciar Sesión": si no tenía cuenta,
                   Clerk la creó y eso amerita el step de consent.

                   v17.5 — Detection robusta para evitar perder casos
                   donde createdAt no está poblado o es string en
                   formato ambiguo. Usamos tres signals; basta uno:
                   1. clerk.client.signUp.createdSessionId existe
                      (signal canónico de signup activo recién creado).
                   2. clerk.client.signUp.status === "complete".
                   3. clerk.user.createdAt parseable y < 60s. */
                const su = clerk.client?.signUp
                const si = clerk.client?.signIn
                let ageMs = NaN
                try {
                    const ts = clerk.user?.createdAt
                    if (ts) ageMs = Date.now() - new Date(ts).getTime()
                } catch {}
                /* v17.10 — Edad de la sesión vs edad del usuario.
                   La sesión SIEMPRE se crea fresh en cada OAuth
                   callback (login o signup). El usuario solo es
                   fresh en signup. Si user.createdAt es >60s más
                   viejo que session.createdAt, es signin de cuenta
                   existente sin importar lo que tenga signUp en el
                   cliente local (puede haber un id zombie de un
                   intento anterior abortado). */
                let sessionAgeMs = NaN
                try {
                    const ts = clerk.session?.createdAt
                    if (ts) sessionAgeMs = Date.now() - new Date(ts).getTime()
                } catch {}
                const userIsOlderThanSession =
                    !isNaN(ageMs) &&
                    !isNaN(sessionAgeMs) &&
                    ageMs - sessionAgeMs > 60000
                let mayCreateRecent = false
                try {
                    const fl = sessionStorage.getItem(
                        "rsv-clerk-oauth-may-create"
                    )
                    if (fl) {
                        const flTs = Number(fl)
                        if (
                            !isNaN(flTs) &&
                            Date.now() - flTs < 5 * 60 * 1000
                        ) {
                            mayCreateRecent = true
                        }
                    }
                    sessionStorage.removeItem("rsv-clerk-oauth-may-create")
                } catch {}
                const signUpIsActive = !!(su?.id || su?.createdSessionId)
                const signUpStatusIsFresh =
                    su?.status === "complete" ||
                    su?.status === "missing_requirements" ||
                    su?.status === "transferable" ||
                    su?.status === "abandoned"
                /* v17.10 — Tres formas de detectar signin puro de
                   cuenta existente (override). Cualquiera positiva
                   marca isExistingAccountSignin=true:
                   (a) user es >60s más viejo que la sesión.
                   (b) user fue creado hace >5min — claramente vieja
                       sin importar lo que diga signUp (cubre zombie).
                   (c) signIn está complete con signUp inactivo y
                       user >60s. */
                const userIsClearlyOld =
                    !isNaN(ageMs) && ageMs > 5 * 60 * 1000
                const isExistingAccountSignin =
                    userIsOlderThanSession ||
                    userIsClearlyOld ||
                    (si?.status === "complete" &&
                        !signUpIsActive &&
                        !signUpStatusIsFresh &&
                        (isNaN(ageMs) || ageMs > 60000))
                /* v17.11 — Fallback ULTRA permisivo: si mayCreateRecent
                   está Y NO hay evidencia de cuenta vieja, asumimos
                   cuenta nueva. Cubre el caso donde Clerk no popula
                   createdAt a tiempo (NaN) tras un transferable signin
                   → signup. El override isExistingAccountSignin sigue
                   protegiendo contra falsos positivos de cuenta vieja. */
                const justCreated =
                    !isExistingAccountSignin &&
                    (signUpIsActive ||
                        signUpStatusIsFresh ||
                        (!isNaN(ageMs) && ageMs < 60000) ||
                        (mayCreateRecent &&
                            !isNaN(ageMs) &&
                            ageMs < 600000) ||
                        mayCreateRecent)
                /* v17.11 — Si el tripulante ya vio el modal "Sella
                   tu entrada" para esta cuenta, NO mostrarlo de nuevo.
                   Resuelve el loop: si cierra con la X la primera vez,
                   futuros logins entran directos sin re-prompt. */
                let alreadySeenSealModal = false
                try {
                    if (clerk.user?.id) {
                        const flag = localStorage.getItem(
                            `rsv-seen-seal-modal-${clerk.user.id}`
                        )
                        if (flag) alreadySeenSealModal = true
                    }
                } catch {}
                console.log(
                    `[auth] OAuth callback · justCreated=${justCreated} signUp.id=${!!su?.id} signUp.status=${su?.status} signIn.status=${si?.status} userAge=${ageMs} sessionAge=${sessionAgeMs} userOlder=${userIsOlderThanSession} mayCreate=${mayCreateRecent} existingSignin=${isExistingAccountSignin} seenModal=${alreadySeenSealModal}`
                )
                if (alreadySeenSealModal) {
                    triggerSuccess()
                    return
                }
                if (justCreated) {
                    /* v17.6 — Si el tripulante ya marcó la casilla de
                       consent en el form de Crear Cuenta antes de picar
                       Google, NO molestarlo con la pantalla intermedia.
                       El consent viaja vía unsafeMetadata.nodoConsent
                       (BienvenidaNodo lo lee y suscribe), pero como el
                       webhook puede tener latencia o fallar, también
                       llamamos al RPC desde el frontend acá. Doble
                       seguro idempotente. */
                    let prefilledConsent = false
                    try {
                        prefilledConsent =
                            sessionStorage.getItem(
                                "rsv-clerk-oauth-consent"
                            ) === "1"
                        sessionStorage.removeItem("rsv-clerk-oauth-consent")
                    } catch {}
                    if (prefilledConsent) {
                        console.log(
                            "[auth] OAuth callback · consent prefilled, skipping confirm screen"
                        )
                        try {
                            const userEmail = (
                                clerk.user?.primaryEmailAddress
                                    ?.emailAddress ||
                                clerk.user?.emailAddresses?.[0]
                                    ?.emailAddress ||
                                ""
                            )
                                .toLowerCase()
                                .trim()
                            if (
                                userEmail &&
                                supabaseUrl &&
                                supabaseAnonKey
                            ) {
                                await fetch(
                                    `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/record_nodo_subscription`,
                                    {
                                        method: "POST",
                                        headers: {
                                            apikey: supabaseAnonKey,
                                            Authorization: `Bearer ${supabaseAnonKey}`,
                                            "Content-Type":
                                                "application/json",
                                        },
                                        body: JSON.stringify({
                                            p_email: userEmail,
                                            p_source:
                                                "clerk_google_prefilled",
                                            p_metadata: {
                                                clerk_user_id:
                                                    clerk.user?.id || null,
                                                ts: new Date().toISOString(),
                                            },
                                        }),
                                    }
                                )
                                console.log(
                                    "[auth] record_nodo_subscription OK (prefilled)"
                                )
                            }
                        } catch (e) {
                            console.warn(
                                "[auth] record_nodo_subscription fail (prefilled):",
                                e
                            )
                        }
                        /* v17.14 — Setear el flag "ya vio el modal"
                           para esta cuenta. En el path prefilled consent
                           el modal no aparece (consent ya dado), pero
                           para futuros logins de la misma cuenta NO
                           queremos volver a preguntar. La cuenta acaba
                           de registrarse exitosamente; ya completó. */
                        try {
                            if (clerk.user?.id) {
                                localStorage.setItem(
                                    `rsv-seen-seal-modal-${clerk.user.id}`,
                                    String(Date.now())
                                )
                            }
                        } catch {}
                        triggerSuccess()
                        return
                    }
                    /* v17.10 — Orden importante para batch: keep
                       PRIMERO (refresca overlay), después los setters
                       del view (React 18 batchea estos juntos en
                       async). Si reordenamos al revés, hay un frame
                       donde view=login + isGoogleLoading=false → el
                       modal muestra brevemente la pantalla "Bienvenido
                       de vuelta" con tabs y form de email/password,
                       lo que parece "animación de la app" para Zak. */
                    try {
                        if (typeof window !== "undefined")
                            window.dispatchEvent(
                                new CustomEvent("rsv-oauth-overlay-keep")
                            )
                    } catch {}
                    /* v17.13 — El flag "ya vio el modal" se setea ahora
                       en handleClose (cuando el modal CIERRA por
                       cualquier motivo), NO acá. Si lo seteamos al
                       mostrar el modal, un reload interno de Clerk
                       (que dispara segundo mount) leía el flag y NO
                       volvía a mostrar el modal. */
                    setNodoConsent(false)
                    setView("google-confirm")
                    setKeepModalOpen(true)
                    setIsGoogleLoading(false)
                    return
                }
                triggerSuccess()
            } else {
                setIsGoogleLoading(false)
                setError("No se pudo completar la autenticación con Google.")
            }
        } catch (e: any) {
            setIsGoogleLoading(false)
            setError(
                translateClerkError(
                    (e.errors || [])[0]?.code,
                    "Error con Google."
                )
            )
        } finally {
            isRedirectRef.current = false
            cleanClerkParams()
        }
    }

    const triggerSuccess = () => {
        setIsGoogleLoading(false)
        /* v17.10 — En flow OAuth saltamos la pantalla
           "¡Acceso Concedido!" (animación pop 1500ms que Zak
           percibía como interrupción del flow). El overlay sólido
           de Domo ya tapa el shell durante el cierre y la transición
           directa a shell visible es más limpia. En flows email/pass
           mantenemos el isSuccess view porque ahí no hay overlay y
           el feedback positivo ayuda al tripulante. */
        const isOauthFlow = isOauthFlowActive
        if (!isOauthFlow) {
            setIsSuccess(true)
        }
        /* keepModalOpen NO se baja a false acá: si modalState.isOpen
           ya estaba false, bajarlo prematuramente hacía return null
           y el shell se veía por un instante. */
        /* Marcamos "rsv-suppress-welcome" para que un remount/reload
           inmediato arranque con welcome desactivada. Overlay-end se
           dispara en handleClose. */
        try {
            if (typeof window !== "undefined")
                sessionStorage.setItem(
                    "rsv-suppress-welcome",
                    String(Date.now())
                )
        } catch {}
        const closeDelay = isOauthFlow ? 0 : 1500
        setTimeout(() => {
            if (onAuthSuccess && window.Clerk) onAuthSuccess(window.Clerk.user)
            handleClose()
            window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
        }, closeDelay)
    }

    /* Protocolo de Unificación: handler del botón "CREAR CUENTA" en
       la pantalla intermedia post-Google. Si el tripulante marcó la
       casilla de consent, suscribimos a nodo_central via RPC público
       (SECURITY DEFINER, idempotente). Después triggerSuccess.
       Fire-and-forget: si la suscripción falla, no bloqueamos la
       entrada al app — la persona ya está autenticada y el correo
       de bienvenida (que ya se disparó vía webhook user.created)
       lleva el CTA "Activar Recepción de Pulsos" como fallback. */
    async function handleConfirmGoogleSignup() {
        setIsLoading(true)
        /* v17.9 — keep al arrancar el confirm para que el overlay
           cubra el isLoading + fetch + triggerSuccess sin gaps. */
        try {
            if (typeof window !== "undefined")
                window.dispatchEvent(new CustomEvent("rsv-oauth-overlay-keep"))
        } catch {}
        if (nodoConsent) {
            try {
                const userEmail = (
                    window.Clerk?.user?.primaryEmailAddress?.emailAddress ||
                    window.Clerk?.user?.emailAddresses?.[0]?.emailAddress ||
                    ""
                )
                    .toLowerCase()
                    .trim()
                if (userEmail && supabaseUrl && supabaseAnonKey) {
                    await fetch(
                        `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/record_nodo_subscription`,
                        {
                            method: "POST",
                            headers: {
                                apikey: supabaseAnonKey,
                                Authorization: `Bearer ${supabaseAnonKey}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                p_email: userEmail,
                                p_source: "clerk_google_consent",
                                p_metadata: {
                                    clerk_user_id:
                                        window.Clerk?.user?.id || null,
                                    ts: new Date().toISOString(),
                                },
                            }),
                        }
                    )
                }
            } catch (e) {
                console.warn("[auth] record_nodo_subscription fail:", e)
            }
        }
        setIsLoading(false)
        /* v17.8 — Antes de triggerSuccess marcamos el flag de
           suppress welcome para que el shell post-modal arranque
           sin animación. triggerSuccess lo vuelve a setear pero
           el doble seguro garantiza que esté listo aunque algo
           falle entre medias. */
        try {
            if (typeof window !== "undefined")
                sessionStorage.setItem(
                    "rsv-suppress-welcome",
                    String(Date.now())
                )
        } catch {}
        triggerSuccess()
    }

    useEffect(() => {
        if (
            modalState.isOpen &&
            emailRef.current &&
            view !== "verify" &&
            view !== "reset"
        )
            setTimeout(() => emailRef.current?.focus(), 400)
    }, [modalState.isOpen, view])

    /* v17.9 — Preload del avatar de Google en la pantalla intermedia.
       Cuando entramos a "google-confirm" tras un transferable signin →
       signup automático, Clerk a veces aún no propagó la imagen real
       y `user.imageUrl` apunta a un placeholder roto. Preloadeamos en
       memoria con onload/onerror + timeout 3.5s para detectar el
       fallo antes de mostrar el `<img>` roto. Si falla, avatarBroken
       fuerza el render del div con la inicial cyan. Diferencia con el
       register normal: en register el user marca consent y pica un
       botón → tiempo extra para que Clerk hidrate la imagen. En login
       OAuth la pantalla aparece casi inmediata. */
    useEffect(() => {
        if (view !== "google-confirm") return
        const url = (window as any).Clerk?.user?.imageUrl
        if (!url) {
            setAvatarBroken(true)
            return
        }
        setAvatarBroken(false)
        let cancelled = false
        const img = new Image()
        img.referrerPolicy = "no-referrer"
        img.crossOrigin = "anonymous"
        img.onload = () => {
            if (cancelled) return
            if (
                img.naturalWidth === 0 ||
                img.naturalHeight === 0
            )
                setAvatarBroken(true)
            else setAvatarBroken(false)
        }
        img.onerror = () => {
            if (!cancelled) setAvatarBroken(true)
        }
        img.src = url
        const timeout = setTimeout(() => {
            if (!cancelled && !img.complete) setAvatarBroken(true)
        }, 3500)
        return () => {
            cancelled = true
            clearTimeout(timeout)
            img.onload = null
            img.onerror = null
        }
    }, [view])

    const handleClose = useCallback(() => {
        /* v17.13 — Si el modal estaba en "google-confirm" al cerrar
           (por click "CREAR CUENTA", click X, o click backdrop),
           marcamos el flag "ya vio el modal" para esta cuenta. En
           futuros logins de la misma cuenta saltamos el modal. */
        try {
            if (
                viewRef.current === "google-confirm" &&
                (window as any).Clerk?.user?.id
            ) {
                localStorage.setItem(
                    `rsv-seen-seal-modal-${(window as any).Clerk.user.id}`,
                    String(Date.now())
                )
            }
        } catch {}
        setIsClosing(true)
        /* v17.8 — Movido el dispatch de "rsv-oauth-overlay-end" al
           final del setTimeout. Antes se disparaba al inicio y el
           overlay sólido de Domo se apagaba mientras el modal
           todavía estaba haciendo su fade-out → durante esos 250ms
           el shell quedaba visible con sus animaciones de entrada
           a medio correr. Ahora el overlay queda activo durante el
           fade del modal y se apaga después, dándole tiempo a las
           animaciones del shell a terminar ocultas. */
        setTimeout(() => {
            setIsClosing(false)
            setIsSuccess(false)
            setEmail("")
            setPassword("")
            setConfirmPassword("")
            setOtpCode(["", "", "", "", "", ""])
            setError("")
            setIsGoogleLoading(false)
            setKeepModalOpen(false)
            /* v17.9 — Bajamos isOauthFlowActive al final, ya con el
               modal cerrado completamente. */
            setIsOauthFlowActive(false)
            /* v17.13 — Recién acá limpiamos el flag de OAuth redirect.
               Antes lo limpiábamos al primer mount, pero Clerk hace un
               reload interno tras handleRedirectCallback y la segunda
               carga necesitaba el flag para procesar el OAuth y mostrar
               el modal "Sella tu entrada". Limpiarlo solo cuando el
               flow termina garantiza que cualquier mount intermedio
               (re-cargas, remontes) tenga acceso al flag. */
            clearRedirectFlag()
            setView(defaultView)
            if (onClose) onClose()
            modalState.close()
            if (typeof window !== "undefined")
                window.dispatchEvent(new CustomEvent("rsv-oauth-overlay-end"))
        }, 250)
    }, [onClose, modalState, defaultView])

    const handleOtpChange = (i: number, v: string) => {
        if (!/^[a-zA-Z0-9]*$/.test(v)) return
        const n = [...otpCode]
        n[i] = v.substring(v.length - 1)
        setOtpCode(n)
        setError("")
        if (v && i < 5) otpRefs.current[i + 1]?.focus()
    }
    const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otpCode[i] && i > 0)
            otpRefs.current[i - 1]?.focus()
    }
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const d = e.clipboardData.getData("text").trim().substring(0, 6)
        if (!/^[a-zA-Z0-9]*$/.test(d)) return
        const n = [...otpCode]
        for (let i = 0; i < d.length && i < 6; i++) n[i] = d[i]
        setOtpCode(n)
        otpRefs.current[Math.min(d.length, 5)]?.focus()
    }
    useEffect(() => {
        const c = otpCode.join("")
        if (c.length !== 6 || isLoadingRef.current || isVerifyingRef.current)
            return
        const t = setTimeout(() => {
            if (isVerifyingRef.current) return
            const v = viewRef.current
            if (v === "verify") handleEmailAuth(null, c)
            else if (v === "reset") handleResetPassword(c)
        }, 350)
        return () => clearTimeout(t)
    }, [otpCode])

    async function completeSignUpMissing(su: any): Promise<boolean> {
        const m: string[] = su.missingFields || []
        if (m.includes("username")) {
            try {
                const u = await su.update({
                    username: generateUsername(emailRef2.current),
                })
                if (u.createdSessionId) {
                    await window.Clerk.setActive({
                        session: u.createdSessionId,
                    })
                    return true
                }
            } catch (e: any) {
                if (e.errors?.[0]?.code === "form_identifier_exists") {
                    try {
                        const r = await su.update({
                            username: generateUsername(emailRef2.current),
                        })
                        if (r.createdSessionId) {
                            await window.Clerk.setActive({
                                session: r.createdSessionId,
                            })
                            return true
                        }
                    } catch (_) {}
                }
            }
        }
        await new Promise((r) => setTimeout(r, 500))
        return !!window.Clerk.user
    }

    /* Rescate: la cuenta quedó creada y el email verificado, pero Clerk no
       dejó una sesión activa (status "complete" sin createdSessionId, o
       reintento que da "already been verified"). Iniciamos sesión con el
       email + password que el tripulante acaba de definir. */
    async function signInWithPasswordFallback(): Promise<boolean> {
        try {
            if (window.Clerk?.user) return true
            if (!password || !window.Clerk?.client) return false
            const si = await window.Clerk.client.signIn.create({
                identifier: email,
                password,
            })
            if (si.status === "complete")
                await window.Clerk.setActive({ session: si.createdSessionId })
        } catch (_) {}
        return !!window.Clerk?.user
    }

    async function handleGoogleAuth() {
        if (!clerkPublishableKey || !window.Clerk || !window.Clerk.client)
            return setError("Conectando...")
        setIsGoogleLoading(true)
        setError("")
        setRedirectFlag(view)

        // FIX: Forzar siempre ruta absoluta
        const exactRedirectUrl =
            window.location.origin +
            window.location.pathname +
            (window.location.hash || "")

        try {
            /* v17.6 — Guardamos el state del consent en sessionStorage
               antes del redirect para usarlo al volver:
               - Si el usuario ya marcó la casilla en el form de Crear
                 Cuenta, sessionStorage.rsv-clerk-oauth-consent = "1"
                 → al volver del OAuth, saltamos la pantalla intermedia
                 y entramos directo (consent ya dado).
               - Si NO marcó, no se guarda → al volver, mostramos la
                 pantalla intermedia con casilla desmarcada. */
            try {
                if (view === "register" && nodoConsent) {
                    sessionStorage.setItem("rsv-clerk-oauth-consent", "1")
                } else {
                    sessionStorage.removeItem("rsv-clerk-oauth-consent")
                }
                /* v17.6 — Flag genérico que indica "este OAuth podría
                   crear una cuenta nueva" — vale tanto para register
                   como para login (Clerk hace transferable signin →
                   signup automático si la cuenta no existía). El
                   callback usa este flag para decidir si chequear
                   "cuenta recién creada" con detection más permisiva. */
                sessionStorage.setItem(
                    "rsv-clerk-oauth-may-create",
                    String(Date.now())
                )
                /* v17.12 — Setea "rsv-suppress-welcome" ANTES del
                   redirect. El OAuth callback recarga la página de
                   cero. Cuando Domo y EscanerVibracional remontan,
                   leen este flag para saltar la welcome animation
                   y el splash respectivamente. Si el flag solo se
                   seteara en triggerSuccess (después del callback),
                   EscanerVibracional ya habría disparado el splash
                   antes. */
                sessionStorage.setItem(
                    "rsv-suppress-welcome",
                    String(Date.now())
                )
            } catch {}

            /* v17.21 — Fetch interceptor para inyectar
               prompt=select_account en el URL hacia Google que Clerk
               devuelve en su API response. authenticateWithRedirect
               sigue recibiendo oauth_prompt + prompt como fallback
               nativo (mobile los preserva), pero el interceptor es la
               garantía universal: en desktop Clerk strippea los alias
               antes de armar el redirect URL, así que mutamos el body
               de la response del POST /v1/client/sign_ins (o
               sign_ups) ANTES de que el SDK lo lea. Auto-uninstall
               tras primera interceptación o 8s timeout. */
            const installClerkResponseInterceptor = () => {
                if (typeof window === "undefined" || !window.fetch)
                    return () => {}
                const origFetch = window.fetch
                let intercepted = false

                const injectPromptIntoJson = (obj: any): boolean => {
                    if (!obj || typeof obj !== "object") return false
                    let mutated = false
                    for (const k of Object.keys(obj)) {
                        const v = (obj as any)[k]
                        if (
                            k === "external_verification_redirect_url" &&
                            typeof v === "string" &&
                            v.indexOf("accounts.google.com") !== -1
                        ) {
                            try {
                                const u = new URL(v)
                                if (
                                    u.searchParams.get("prompt") !==
                                    "select_account"
                                ) {
                                    u.searchParams.set(
                                        "prompt",
                                        "select_account"
                                    )
                                    ;(obj as any)[k] = u.toString()
                                    mutated = true
                                }
                            } catch {}
                        } else if (v && typeof v === "object") {
                            if (injectPromptIntoJson(v)) mutated = true
                        }
                    }
                    return mutated
                }

                const wrapped: typeof fetch = async (
                    input: any,
                    init?: any
                ) => {
                    const response = await origFetch(input, init)
                    if (intercepted) return response
                    let url = ""
                    try {
                        if (typeof input === "string") url = input
                        else if (input instanceof Request) url = input.url
                        else if (input && typeof input.toString === "function")
                            url = String(input)
                    } catch {}
                    if (
                        !url ||
                        (url.indexOf("/client/sign_ins") === -1 &&
                            url.indexOf("/client/sign_ups") === -1)
                    ) {
                        return response
                    }
                    if (!response.ok) return response
                    try {
                        const cloned = response.clone()
                        const ct =
                            cloned.headers.get("content-type") || ""
                        if (ct.indexOf("json") === -1) return response
                        const json = await cloned.json()
                        if (!injectPromptIntoJson(json)) return response
                        intercepted = true
                        const newHeaders = new Headers(response.headers)
                        newHeaders.delete("content-length")
                        newHeaders.delete("content-encoding")
                        return new Response(JSON.stringify(json), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: newHeaders,
                        })
                    } catch {
                        return response
                    }
                }

                window.fetch = wrapped
                const uninstall = () => {
                    if (window.fetch === wrapped) window.fetch = origFetch
                }
                setTimeout(uninstall, 8000)
                return uninstall
            }
            installClerkResponseInterceptor()

            if (view === "register") {
                await window.Clerk.client.signUp.authenticateWithRedirect({
                    strategy: "oauth_google",
                    redirectUrl: exactRedirectUrl,
                    redirectUrlComplete: exactRedirectUrl,
                    /* Consent al Nodo Central viaja en el create del
                       sign-up. El webhook user.created lo lee desde
                       unsafe_metadata. */
                    unsafeMetadata: { nodoConsent },
                    // @ts-ignore — Clerk passthrough hacia Google.
                    oauth_prompt: "select_account",
                    prompt: "select_account",
                } as any)
            } else {
                await window.Clerk.client.signIn.authenticateWithRedirect({
                    strategy: "oauth_google",
                    redirectUrl: exactRedirectUrl,
                    redirectUrlComplete: exactRedirectUrl,
                    // @ts-ignore — passthrough.
                    oauth_prompt: "select_account",
                    prompt: "select_account",
                } as any)
            }
        } catch (err: any) {
            setIsGoogleLoading(false)
            try {
                sessionStorage.removeItem(REDIRECT_FLAG_KEY)
            } catch (_) {}
            setError(
                translateClerkError(
                    err.errors?.[0]?.code,
                    err.errors?.[0]?.longMessage ||
                        err.message ||
                        "Error con Google."
                )
            )
        }
    }

    async function handleEmailAuth(e?: any, autoCode?: string) {
        if (e) e.preventDefault()
        setError("")
        const cc = autoCode || otpCode.join("")
        const cv = viewRef.current
        if (cv !== "verify" && cv !== "reset") {
            if (!email) return setError("Ingresa tu correo.")
            if (cv !== "forgot" && (!password || password.length < 8))
                return setError("Mínimo 8 caracteres.")
            if (cv === "register" && password !== confirmPassword)
                return setError("Las contraseñas no coinciden.")
        }
        if (!clerkPublishableKey || !window.Clerk || !window.Clerk.client)
            return setError("Conectando...")
        if (isVerifyingRef.current) return
        isVerifyingRef.current = true
        setIsLoading(true)
        try {
            if (cv === "login") {
                if (window.Clerk.user) {
                    triggerSuccess()
                    return
                }
                const si = await window.Clerk.client.signIn.create({
                    identifier: email,
                    password,
                })
                if (si.status === "complete") {
                    await window.Clerk.setActive({
                        session: si.createdSessionId,
                    })
                    triggerSuccess()
                } else setError("Autenticación incompleta.")
            } else if (cv === "register") {
                const su = await window.Clerk.client.signUp.create({
                    emailAddress: email,
                    password,
                    unsafeMetadata: { nodoConsent },
                })
                if (su.status === "complete") {
                    await window.Clerk.setActive({
                        session: su.createdSessionId,
                    })
                    triggerSuccess()
                } else {
                    await su.prepareEmailAddressVerification({
                        strategy: "email_code",
                    })
                    await new Promise((r) => setTimeout(r, 300))
                    setView("verify")
                }
            } else if (cv === "verify") {
                if (cc.length < 6) throw new Error("Código completo requerido.")
                const su = window.Clerk.client.signUp
                if (!su?.id) throw new Error("Sesión expirada.")
                const r = await su.attemptEmailAddressVerification({ code: cc })
                const freshSu = window.Clerk.client.signUp
                const sid = r.createdSessionId || freshSu?.createdSessionId
                if (sid) {
                    await window.Clerk.setActive({ session: sid })
                    triggerSuccess()
                } else if (
                    r.status === "complete" ||
                    freshSu?.status === "complete"
                ) {
                    // Verificado y completo pero sin sesión en el snapshot →
                    // iniciar sesión con el email+password recién creados.
                    const ok = await signInWithPasswordFallback()
                    if (ok) triggerSuccess()
                    else setError("Cuenta creada. Inicia sesión.")
                } else if (
                    r.status === "missing_requirements" ||
                    freshSu?.status === "missing_requirements"
                ) {
                    const ok = await completeSignUpMissing(r)
                    if (ok) triggerSuccess()
                    else setError("No se pudo completar el registro.")
                } else setError("Código incorrecto o expirado.")
            } else if (cv === "forgot") {
                await window.Clerk.client.signIn.create({
                    strategy: "reset_password_email_code",
                    identifier: email,
                })
                setView("reset")
            }
        } catch (err: any) {
            const eC = err.errors?.[0]?.code || ""
            const eM = err.errors?.[0]?.longMessage || err.message || ""
            if (eM?.includes("already been verified")) {
                await new Promise((r) => setTimeout(r, 500))
                const u = window.Clerk.client.signUp
                if (u?.createdSessionId) {
                    await window.Clerk.setActive({
                        session: u.createdSessionId,
                    })
                    triggerSuccess()
                    return
                }
                if (u?.status === "missing_requirements") {
                    const ok = await completeSignUpMissing(u)
                    if (ok) {
                        triggerSuccess()
                        return
                    }
                }
                if (window.Clerk.user) {
                    triggerSuccess()
                    return
                }
                // Email ya verificado pero sin sesión → rescatar con login.
                if (await signInWithPasswordFallback()) {
                    triggerSuccess()
                    return
                }
            }
            setError(translateClerkError(eC, eM))
            if (cv === "verify" || cv === "reset") {
                setOtpCode(["", "", "", "", "", ""])
                setTimeout(() => otpRefs.current[0]?.focus(), 100)
            }
        } finally {
            setIsLoading(false)
            isVerifyingRef.current = false
        }
    }

    async function handleResetPassword(ac?: string) {
        const c = ac || otpCode.join("")
        if (c.length < 6) return setError("Código completo requerido.")
        if (password.length < 8) return setError("Mínimo 8 caracteres.")
        if (!window.Clerk?.client) return setError("Conectando...")
        if (isVerifyingRef.current) return
        isVerifyingRef.current = true
        setIsLoading(true)
        setError("")
        try {
            const si = window.Clerk.client.signIn
            await si.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: c,
            })
            const r = await si.resetPassword({ password })
            if (r.createdSessionId || r.status === "complete") {
                await window.Clerk.setActive({ session: r.createdSessionId })
                triggerSuccess()
            }
        } catch (err: any) {
            setError(
                translateClerkError(
                    err.errors?.[0]?.code,
                    err.errors?.[0]?.longMessage || err.message || "Error."
                )
            )
            setOtpCode(["", "", "", "", "", ""])
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } finally {
            setIsLoading(false)
            isVerifyingRef.current = false
        }
    }

    const inputStyle = (f: string): React.CSSProperties => ({
        width: "100%",
        padding: "14px 16px",
        fontSize: 14,
        fontFamily: "'Exo 2','Rajdhani',sans-serif",
        fontWeight: 400,
        letterSpacing: "0.04em",
        color: "rgba(220,230,235,0.9)",
        background: "rgba(8,12,18,0.8)",
        border: `1px solid ${focusedField === f ? `${cyan} 0.45)` : `${cyan} 0.12)`}`,
        borderRadius: 10,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        boxSizing: "border-box",
        ...(focusedField === f
            ? { boxShadow: `0 0 0 1px ${cyan} 0.15),0 0 20px ${cyan} 0.06)` }
            : {}),
    })
    const primaryBtnStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        padding: "15px 24px",
        fontSize: 14,
        fontFamily: "'Rajdhani',sans-serif",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#0a0e14",
        background:
            view === "login" || view === "verify"
                ? `linear-gradient(135deg,${ACCENT} 0%,${ACCENT_DARK} 50%,${ACCENT} 100%)`
                : `linear-gradient(135deg,${gold} 1) 0%,${gold} 0.75) 50%,${gold} 1) 100%)`,
        border: "none",
        borderRadius: 10,
        cursor: isLoading ? "wait" : "pointer",
        transition: "all 0.4s ease",
        overflow: "hidden",
        opacity: isLoading ? 0.8 : 1,
        outline: "none",
    }
    const isLoginView = view === "login"
    const passwordsMatch =
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword
    if (!(modalState.isOpen || keepModalOpen || isOauthFlowActive)) return null

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2147483647,
                animation: isClosing
                    ? "none"
                    : "rsv-modal-backdrop-in 0.3s ease forwards",
                opacity: isClosing ? 0 : 1,
                transition: isClosing ? "opacity 0.25s ease" : "none",
                padding: 20,
            }}
        >
            <div
                onClick={handleClose}
                style={{
                    position: "absolute",
                    inset: 0,
                    /* Durante isGoogleLoading o view=google-confirm el
                       backdrop pasa a ser sólido (sin alpha) para
                       cubrir totalmente la animación del shell de la
                       app debajo. En el resto de las views se usa el
                       gradiente semi-transparente original con blur. */
                    background:
                        isGoogleLoading || view === "google-confirm"
                            ? "#050810"
                            : "radial-gradient(ellipse at center,rgba(5,8,14,0.88) 0%,rgba(2,3,6,0.95) 100%)",
                    backdropFilter:
                        isGoogleLoading || view === "google-confirm"
                            ? undefined
                            : "blur(12px)",
                    WebkitBackdropFilter:
                        isGoogleLoading || view === "google-confirm"
                            ? undefined
                            : "blur(12px)",
                }}
            />
            <div
                ref={modalRef}
                style={{
                    position: "relative",
                    width: "100%",
                    /* Pantalla intermedia post-Google necesita más
                       ancho para que el avatar + email + checkbox
                       largo respiren. El resto de las views queda en
                       420 para mantener la identidad compacta del
                       modal original. */
                    maxWidth: view === "google-confirm" ? 480 : 420,
                    background:
                        "linear-gradient(175deg,rgba(7,24,38,0.97) 0%,rgba(3,35,58,0.99) 100%)",
                    border: `1px solid ${cyan} 0.15)`,
                    borderRadius: 16,
                    boxShadow: `0 0 60px rgba(0,0,0,0.5),0 0 40px ${cyan} 0.04),inset 0 1px 0 ${cyan} 0.08)`,
                    overflow: "hidden",
                    animation: isClosing
                        ? "rsv-modal-panel-out 0.25s ease forwards"
                        : "rsv-modal-panel-in 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
                }}
            >
                <StarField />
                {isSuccess ? (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 1,
                            padding: "60px 32px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            animation:
                                "rsv-success-pop 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
                        }}
                    >
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                background: `${cyan} 0.1)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid ${cyan} 0.3)`,
                                marginBottom: 20,
                                boxShadow: `0 0 30px ${cyan} 0.2)`,
                            }}
                        >
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={ACCENT}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2
                            style={{
                                fontSize: 20,
                                fontFamily: "'Rajdhani',sans-serif",
                                fontWeight: 600,
                                color: ACCENT,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                margin: 0,
                            }}
                        >
                            ¡Acceso Concedido!
                        </h2>
                    </div>
                ) : (
                    <div
                        className="rsv-modal-content"
                        style={{
                            position: "relative",
                            zIndex: 1,
                            /* Padding compactado en google-confirm para
                               que el modal entre completo en móvil.
                               Resto de views queda en el padding
                               estándar 32/32/28. La clase rsv-modal-content
                               aplica reducciones mobile via @media. */
                            padding:
                                view === "google-confirm"
                                    ? "20px 28px 22px"
                                    : "32px 32px 28px",
                        }}
                    >
                        <button
                            onClick={handleClose}
                            onMouseEnter={() => setHovered("close")}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                    hovered === "close"
                                        ? `${cyan} 0.08)`
                                        : "transparent",
                                border: `1px solid ${hovered === "close" ? `${cyan} 0.25)` : `${cyan} 0.08)`}`,
                                borderRadius: 8,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                padding: 0,
                                outline: "none",
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke={
                                    hovered === "close"
                                        ? `${cyan} 0.8)`
                                        : `${cyan} 0.35)`
                                }
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            >
                                <line x1="1" y1="1" x2="13" y2="13" />
                                <line x1="13" y1="1" x2="1" y2="13" />
                            </svg>
                        </button>
                        {view !== "forgot" &&
                            view !== "reset" &&
                            view !== "google-confirm" &&
                            !isGoogleLoading && <SolarIcon />}
                        <h2
                            className="rsv-modal-h2-title"
                            style={{
                                textAlign: "center",
                                fontSize: 22,
                                fontFamily: "'Rajdhani',sans-serif",
                                fontWeight: 600,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: "rgba(230,235,240,0.92)",
                                margin: "4px 0 2px",
                            }}
                        >
                            {isGoogleLoading
                                ? "Conectando..."
                                : view === "verify"
                                  ? "Verificar Red"
                                  : view === "forgot"
                                    ? "Recuperar Acceso"
                                    : view === "reset"
                                      ? "Nueva Contraseña"
                                      : view === "google-confirm"
                                        ? "Sella tu entrada"
                                        : isLoginView
                                          ? "Bienvenido de vuelta"
                                          : "Activación de cuenta"}
                        </h2>
                        <div
                            style={{
                                textAlign: "center",
                                fontSize: 12,
                                fontFamily: "'Exo 2',sans-serif",
                                fontWeight: 300,
                                letterSpacing: "0.12em",
                                color: `${cyan} 0.5)`,
                                margin: "6px 0 24px",
                                lineHeight: "1.6",
                            }}
                        >
                            {isGoogleLoading ? (
                                <span style={{ textTransform: "uppercase" }}>
                                    Procesando autenticación con Google
                                </span>
                            ) : view === "verify" || view === "reset" ? (
                                <>
                                    <span
                                        style={{ textTransform: "uppercase" }}
                                    >
                                        Código enviado a
                                    </span>
                                    <br />
                                    <strong
                                        style={{
                                            color: "#fff",
                                            fontWeight: 400,
                                            letterSpacing: "0.05em",
                                            textTransform: "none",
                                        }}
                                    >
                                        {email}
                                    </strong>
                                </>
                            ) : view === "forgot" ? (
                                <span style={{ textTransform: "uppercase" }}>
                                    Ingresa tu correo para recibir el código
                                </span>
                            ) : isLoginView ? (
                                <span style={{ textTransform: "uppercase" }}>
                                    De la Entropía a la Luz.
                                </span>
                            ) : view === "google-confirm" ? null : (
                                <span style={{ textTransform: "uppercase" }}>
                                    De la Entropía a la Luz.
                                </span>
                            )}
                        </div>
                        {/* Pantalla intermedia post-Google OAuth (Protocolo
                            de Unificación). Renderiza avatar + email del
                            tripulante autenticado + checkbox de consent
                            (default desmarcada) + botón único "CREAR
                            CUENTA". Solo se llega aquí si la cuenta de
                            Google se acaba de crear (signup nuevo, no
                            signin de cuenta existente). */}
                        {view === "google-confirm" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "20px 0 4px",
                                }}
                            >
                                <div
                                    style={{
                                        width: 84,
                                        height: 84,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        border: `2px solid ${cyan} 0.55)`,
                                        boxShadow: `0 0 26px ${cyan} 0.35)`,
                                        background: "rgba(5,8,14,0.6)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "8px auto 6px",
                                    }}
                                >
                                    {window.Clerk?.user?.imageUrl &&
                                    !avatarBroken ? (
                                        <img
                                            src={window.Clerk.user.imageUrl}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            crossOrigin="anonymous"
                                            onError={() =>
                                                setAvatarBroken(true)
                                            }
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: 32,
                                                color: `${cyan} 0.85)`,
                                                fontFamily:
                                                    "'Rajdhani',sans-serif",
                                                fontWeight: 600,
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            {(
                                                window.Clerk?.user
                                                    ?.firstName?.[0] ||
                                                window.Clerk?.user
                                                    ?.primaryEmailAddress
                                                    ?.emailAddress?.[0] ||
                                                "✦"
                                            ).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontFamily:
                                                "'Rajdhani',sans-serif",
                                            letterSpacing: "0.2em",
                                            textTransform: "uppercase",
                                            color: `${cyan} 0.55)`,
                                        }}
                                    >
                                        Identidad confirmada por Google
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 15,
                                            fontFamily:
                                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                            fontWeight: 500,
                                            color: "#fff",
                                            letterSpacing: 0,
                                            wordBreak: "break-all",
                                            textAlign: "center",
                                            padding: "0 8px",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {window.Clerk?.user
                                            ?.primaryEmailAddress
                                            ?.emailAddress ||
                                            window.Clerk?.user
                                                ?.emailAddresses?.[0]
                                                ?.emailAddress ||
                                            ""}
                                    </span>
                                </div>
                                <label
                                    htmlFor="rsv-google-consent"
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        margin: "4px 0 0",
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        background: nodoConsent
                                            ? `${cyan} 0.08)`
                                            : "transparent",
                                        border: `1px solid ${
                                            nodoConsent
                                                ? `${cyan} 0.32)`
                                                : "rgba(255,255,255,0.08)"
                                        }`,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        userSelect: "none",
                                        width: "100%",
                                    }}
                                >
                                    <input
                                        id="rsv-google-consent"
                                        type="checkbox"
                                        checked={nodoConsent}
                                        onChange={(e) =>
                                            setNodoConsent(e.target.checked)
                                        }
                                        style={{
                                            marginTop: 2,
                                            accentColor: "#00C2FF",
                                            cursor: "pointer",
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 11.5,
                                            fontFamily: "'Exo 2',sans-serif",
                                            lineHeight: 1.45,
                                            letterSpacing: "0.02em",
                                            color: nodoConsent
                                                ? `${cyan} 0.95)`
                                                : "rgba(255,255,255,0.7)",
                                            transition: "color 0.2s ease",
                                        }}
                                    >
                                        Enlazar mi receptor a las
                                        transmisiones de Red Solar Viva
                                        (Actualizaciones del Escáner,
                                        nuevas herramientas biológicas y
                                        Códices).
                                    </span>
                                </label>
                                {error && (
                                    <p
                                        style={{
                                            fontSize: 13,
                                            fontFamily: "'Exo 2',sans-serif",
                                            color: "rgba(255,100,100,0.9)",
                                            textAlign: "center",
                                            margin: 0,
                                            letterSpacing: "0.03em",
                                            whiteSpace: "pre-line",
                                        }}
                                    >
                                        {error}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleConfirmGoogleSignup}
                                    disabled={isLoading}
                                    onMouseEnter={() =>
                                        setHovered("primary")
                                    }
                                    onMouseLeave={() => setHovered(null)}
                                    style={{
                                        ...primaryBtnStyle,
                                        marginTop: 4,
                                        boxShadow:
                                            hovered === "primary"
                                                ? `0 4px 24px ${gold} 0.25),0 0 40px ${gold} 0.1)`
                                                : `0 2px 12px ${gold} 0.15)`,
                                        transform:
                                            hovered === "primary"
                                                ? "translateY(-1px)"
                                                : "translateY(0)",
                                    }}
                                >
                                    {isLoading ? (
                                        <Spinner />
                                    ) : (
                                        "CREAR CUENTA"
                                    )}
                                </button>
                            </div>
                        )}
                        {isGoogleLoading && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: "20px 0 30px",
                                }}
                            >
                                <Spinner />
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontFamily: "'Exo 2',sans-serif",
                                        fontWeight: 300,
                                        letterSpacing: "0.1em",
                                        color: `${cyan} 0.4)`,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Verificando credenciales...
                                </span>
                            </div>
                        )}
                        {!isGoogleLoading &&
                            (view === "login" || view === "register") && (
                                <>
                                    <div
                                        className="rsv-modal-tabs-wrap"
                                        style={{
                                            display: "flex",
                                            background: "rgba(5,8,14,0.6)",
                                            border: `1px solid ${cyan} 0.08)`,
                                            borderRadius: 10,
                                            padding: 3,
                                            marginBottom: 24,
                                            gap: 3,
                                        }}
                                    >
                                        {(
                                            ["login", "register"] as AuthView[]
                                        ).map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => {
                                                    setView(v)
                                                    setError("")
                                                    setConfirmPassword("")
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: "10px 0",
                                                    fontSize: 12,
                                                    fontFamily:
                                                        "'Rajdhani',sans-serif",
                                                    fontWeight:
                                                        view === v ? 600 : 500,
                                                    letterSpacing: "0.14em",
                                                    textTransform: "uppercase",
                                                    color:
                                                        view === v
                                                            ? v === "login"
                                                                ? ACCENT
                                                                : `${gold} 1)`
                                                            : "rgba(180,190,200,0.4)",
                                                    background:
                                                        view === v
                                                            ? v === "login"
                                                                ? `${cyan} 0.08)`
                                                                : `${gold} 0.08)`
                                                            : "transparent",
                                                    border: "none",
                                                    borderRadius: 8,
                                                    cursor: "pointer",
                                                    transition:
                                                        "all 0.35s ease",
                                                    outline: "none",
                                                }}
                                            >
                                                {v === "login"
                                                    ? "Iniciar sesión"
                                                    : "Crear cuenta"}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleGoogleAuth}
                                        onMouseEnter={() =>
                                            setHovered("google")
                                        }
                                        onMouseLeave={() => setHovered(null)}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 12,
                                            padding: "14px 20px",
                                            fontSize: 13,
                                            fontFamily: "'Exo 2',sans-serif",
                                            fontWeight: 500,
                                            letterSpacing: "0.06em",
                                            color: "rgba(220,230,235,0.85)",
                                            background:
                                                hovered === "google"
                                                    ? "rgba(255,255,255,0.06)"
                                                    : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${hovered === "google" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            transition: "all 0.35s ease",
                                            marginBottom: 20,
                                            outline: "none",
                                        }}
                                    >
                                        <GoogleIcon /> Continuar con Google
                                    </button>
                                    <div
                                        className="rsv-modal-google-divider"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 16,
                                            marginBottom: 20,
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 1,
                                                background: `linear-gradient(90deg,transparent,${cyan} 0.12),transparent)`,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontFamily:
                                                    "'Exo 2',sans-serif",
                                                fontWeight: 300,
                                                letterSpacing: "0.15em",
                                                color: `${cyan} 0.25)`,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            o
                                        </span>
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 1,
                                                background: `linear-gradient(90deg,transparent,${cyan} 0.12),transparent)`,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        {!isGoogleLoading && view !== "google-confirm" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    marginBottom: 8,
                                }}
                            >
                                {(view === "verify" || view === "reset") && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            padding: "10px 0 20px",
                                        }}
                                    >
                                        {otpCode.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={(el) =>
                                                    (otpRefs.current[i] = el)
                                                }
                                                className="rsv-otp-input"
                                                type="text"
                                                maxLength={1}
                                                value={d}
                                                onChange={(e) =>
                                                    handleOtpChange(
                                                        i,
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={(e) =>
                                                    handleOtpKeyDown(i, e)
                                                }
                                                onPaste={handleOtpPaste}
                                                autoComplete="off"
                                            />
                                        ))}
                                    </div>
                                )}
                                {view !== "verify" && view !== "reset" && (
                                    <div style={{ position: "relative" }}>
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 16,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                opacity:
                                                    focusedField === "email"
                                                        ? 0.6
                                                        : 0.3,
                                                transition: "opacity 0.3s ease",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <svg
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke={`${cyan} 1)`}
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect
                                                    x="2"
                                                    y="4"
                                                    width="20"
                                                    height="16"
                                                    rx="2"
                                                />
                                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                            </svg>
                                        </div>
                                        <input
                                            ref={emailRef}
                                            className="rsv-modal-input"
                                            type="email"
                                            placeholder="tu@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setError("")
                                            }}
                                            onFocus={() =>
                                                setFocusedField("email")
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            style={{
                                                ...inputStyle("email"),
                                                paddingLeft: 42,
                                            }}
                                        />
                                    </div>
                                )}
                                {view !== "verify" && view !== "forgot" && (
                                    <div style={{ position: "relative" }}>
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 16,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                opacity:
                                                    focusedField === "password"
                                                        ? 0.6
                                                        : 0.3,
                                                transition: "opacity 0.3s ease",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <svg
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke={`${cyan} 1)`}
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect
                                                    x="3"
                                                    y="11"
                                                    width="18"
                                                    height="11"
                                                    rx="2"
                                                />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                <circle cx="12" cy="16" r="1" />
                                            </svg>
                                        </div>
                                        <input
                                            className="rsv-modal-input"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder={
                                                view === "reset"
                                                    ? "Nueva contraseña"
                                                    : "Contraseña"
                                            }
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                setError("")
                                            }}
                                            onFocus={() =>
                                                setFocusedField("password")
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    if (view === "register")
                                                        return
                                                    view === "reset"
                                                        ? handleResetPassword()
                                                        : handleEmailAuth()
                                                }
                                            }}
                                            style={{
                                                ...inputStyle("password"),
                                                paddingLeft: 42,
                                                paddingRight:
                                                    view === "register" &&
                                                    passwordsMatch
                                                        ? 68
                                                        : 44,
                                            }}
                                        />
                                        {view === "register" &&
                                            passwordsMatch && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        right: 40,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                    }}
                                                >
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={ACCENT}
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            )}
                                        <EyeToggle
                                            /* v17.5 — Ojos sincronizados:
                                               picar uno revela ambos. */
                                            show={showPassword}
                                            onClick={() => {
                                                const next = !showPassword
                                                setShowPassword(next)
                                                setShowConfirmPassword(next)
                                            }}
                                            hoverKey="eye1"
                                            hovered={hovered}
                                            setHovered={setHovered}
                                        />
                                    </div>
                                )}
                                {view === "register" && (
                                    <div style={{ position: "relative" }}>
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 16,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                opacity:
                                                    focusedField === "confirm"
                                                        ? 0.6
                                                        : 0.3,
                                                transition: "opacity 0.3s ease",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <svg
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke={`${cyan} 1)`}
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                <polyline points="9 12 11.5 14.5 16 10" />
                                            </svg>
                                        </div>
                                        <input
                                            className="rsv-modal-input"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Confirmar contraseña"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                                setError("")
                                            }}
                                            onFocus={() =>
                                                setFocusedField("confirm")
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleEmailAuth()
                                            }}
                                            style={{
                                                ...inputStyle("confirm"),
                                                paddingLeft: 42,
                                                paddingRight:
                                                    confirmPassword.length > 0
                                                        ? 68
                                                        : 44,
                                            }}
                                        />
                                        {confirmPassword.length > 0 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: 40,
                                                    top: "50%",
                                                    transform:
                                                        "translateY(-50%)",
                                                }}
                                            >
                                                {passwordsMatch ? (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={ACCENT}
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 14 14"
                                                        fill="none"
                                                        stroke="rgba(255,100,100,0.7)"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                    >
                                                        <line
                                                            x1="1"
                                                            y1="1"
                                                            x2="13"
                                                            y2="13"
                                                        />
                                                        <line
                                                            x1="13"
                                                            y1="1"
                                                            x2="1"
                                                            y2="13"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                        <EyeToggle
                                            show={showConfirmPassword}
                                            onClick={() => {
                                                const next = !showConfirmPassword
                                                setShowConfirmPassword(next)
                                                setShowPassword(next)
                                            }}
                                            hoverKey="eye2"
                                            hovered={hovered}
                                            setHovered={setHovered}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        <div id="clerk-captcha" />
                        {/* Consent al Nodo Central — checkbox cyan
                            tenue. Visible siempre que el modal esté
                            en modo "register" (incluye el flow de
                            Google). Si el user lo marca, viaja como
                            unsafeMetadata.nodoConsent al sign-up de
                            Clerk; el webhook user.created en Pipedream
                            (BienvenidaNodo) lo lee y suscribe al
                            usuario al Nodo Central. Default false. */}
                        {view === "register" && !isGoogleLoading && (
                            <label
                                htmlFor="rsv-nodo-consent"
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                    margin: "10px 0 4px",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    background: nodoConsent
                                        ? `${cyan} 0.08)`
                                        : "transparent",
                                    border: `1px solid ${
                                        nodoConsent
                                            ? `${cyan} 0.32)`
                                            : "rgba(255,255,255,0.08)"
                                    }`,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    userSelect: "none",
                                }}
                            >
                                <input
                                    id="rsv-nodo-consent"
                                    type="checkbox"
                                    checked={nodoConsent}
                                    onChange={(e) =>
                                        setNodoConsent(e.target.checked)
                                    }
                                    style={{
                                        marginTop: 2,
                                        accentColor: "#00C2FF",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontFamily: "'Exo 2',sans-serif",
                                        lineHeight: 1.45,
                                        letterSpacing: "0.02em",
                                        color: nodoConsent
                                            ? `${cyan} 0.95)`
                                            : "rgba(255,255,255,0.7)",
                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    Enlazar mi receptor a las transmisiones
                                    de Red Solar Viva (Actualizaciones del
                                    Escáner, nuevas herramientas biológicas
                                    y Códices).
                                </span>
                            </label>
                        )}
                        {view === "login" && !isGoogleLoading && (
                            <div
                                style={{
                                    textAlign: "right",
                                    margin: "4px 0 12px",
                                }}
                            >
                                <button
                                    onClick={() => {
                                        setView("forgot")
                                        setError("")
                                    }}
                                    onMouseEnter={() => setHovered("forgot")}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: 11,
                                        fontFamily: "'Exo 2',sans-serif",
                                        letterSpacing: "0.05em",
                                        color:
                                            hovered === "forgot"
                                                ? `${cyan} 0.8)`
                                                : `${cyan} 0.4)`,
                                        cursor: "pointer",
                                        transition: "color 0.3s ease",
                                        padding: "4px 0",
                                        outline: "none",
                                    }}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}
                        {error && (
                            <p
                                style={{
                                    fontSize: 13,
                                    fontFamily: "'Exo 2',sans-serif",
                                    color: "rgba(255,100,100,0.9)",
                                    textAlign: "center",
                                    margin: "8px 0 12px",
                                    letterSpacing: "0.03em",
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {error}
                            </p>
                        )}
                        {!isGoogleLoading && view !== "google-confirm" && (
                            <button
                                onClick={
                                    view === "reset"
                                        ? () => handleResetPassword()
                                        : handleEmailAuth
                                }
                                onMouseEnter={() => setHovered("primary")}
                                onMouseLeave={() => setHovered(null)}
                                disabled={isLoading}
                                style={{
                                    ...primaryBtnStyle,
                                    marginTop: error
                                        ? 4
                                        : view === "login"
                                          ? 0
                                          : 16,
                                    boxShadow:
                                        hovered === "primary"
                                            ? isLoginView || view === "verify"
                                                ? `0 4px 24px ${cyan} 0.25),0 0 40px ${cyan} 0.1)`
                                                : `0 4px 24px ${gold} 0.25),0 0 40px ${gold} 0.1)`
                                            : isLoginView || view === "verify"
                                              ? `0 2px 12px ${cyan} 0.15)`
                                              : `0 2px 12px ${gold} 0.15)`,
                                    transform:
                                        hovered === "primary"
                                            ? "translateY(-1px)"
                                            : "translateY(0)",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        overflow: "hidden",
                                        borderRadius: 10,
                                        pointerEvents: "none",
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "40%",
                                            height: "100%",
                                            background:
                                                "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
                                            animation:
                                                hovered === "primary"
                                                    ? "rsv-shimmer 1.5s ease infinite"
                                                    : "none",
                                        }}
                                    />
                                </span>
                                {isLoading ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                border: "2px solid rgba(10,14,20,0.2)",
                                                borderTopColor:
                                                    "rgba(10,14,20,0.8)",
                                                borderRadius: "50%",
                                                animation:
                                                    "rsv-spin 0.7s linear infinite",
                                            }}
                                        />
                                    </div>
                                ) : view === "verify" ? (
                                    "Verificar"
                                ) : view === "forgot" ? (
                                    "Enviar Código"
                                ) : view === "reset" ? (
                                    "Guardar y Entrar"
                                ) : isLoginView ? (
                                    "Iniciar sesión"
                                ) : (
                                    "Crear cuenta"
                                )}
                            </button>
                        )}
                        {(view === "forgot" || view === "reset") &&
                            !isGoogleLoading && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        marginTop: 20,
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setView("login")
                                            setError("")
                                            setOtpCode(["", "", "", "", "", ""])
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            fontSize: 12,
                                            fontFamily: "'Exo 2',sans-serif",
                                            color: `${cyan} 0.6)`,
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                            outline: "none",
                                        }}
                                    >
                                        Volver a iniciar sesión
                                    </button>
                                </div>
                            )}
                    </div>
                )}
                <div
                    style={{
                        height: 1,
                        background:
                            isLoginView || view === "verify"
                                ? `linear-gradient(90deg,transparent,${cyan} 0.2),${cyan} 0.4),${cyan} 0.2),transparent)`
                                : `linear-gradient(90deg,transparent,${gold} 0.2),${gold} 0.4),${gold} 0.2),transparent)`,
                        transition: "background 0.5s ease",
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(Auth2Modal, {
    isOpen: { type: ControlType.Boolean, title: "Visible", defaultValue: true },
    defaultView: {
        type: ControlType.Enum,
        title: "Default View",
        options: ["login", "register"],
        optionTitles: ["Iniciar sesión", "Crear cuenta"],
        defaultValue: "login",
    },
    clerkPublishableKey: {
        type: ControlType.String,
        title: "Clerk Key",
        defaultValue: "",
    },
})

export { Auth2Modal }
