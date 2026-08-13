// Red Solar Viva — EscanerVibracional.tsx v13.65 — AUDITORÍA PARTE 3
// (2026-07-27): dispatchCicloSellado recibe supabaseUrl para pedir el correo
// de cierre de ciclo por la función firmada dispatch-ciclo-sellado (ver
// EV_Shared v2.28), en vez de pegarle directo a Pipedream sin verificación.
// | v13.64 — lenguaje del gate: "Identificación de Nodo"→"Activación de cuenta", "Activar Nodo"→"Activar". | v13.63 — (re-publicado a Framer: el fix v13.62 no había subido por el watcher trabado) · anti-flash del Radar: nueva señal `scanResolved` (el fetch del historial ya resolvió) que se pasa al Radar junto a `loaded` → el hint "Toca un nodo" no parpadea durante la hidratación con red lenta; se resetea en cada re-load (retry de Clerk + reset al abrir). #5 Estados de ánimo: aurora a pantalla completa al cerrar el ciclo 6/6. Re-publicada tras destrabar el
// componente CeremoniaIndiceLuz (default scores={} para que Framer lo instancie
// standalone sin crashear). v13.59 — Ceremonia 6/6 espejada a web:
// al sellar el 6º pilar se dispara CeremoniaIndiceLuz (ritual "Materialización del
// Índice de Luz", key=ceremonyKey transitorio) con suppressIndice en el Radar para no
// duplicar el número. v13.58 — Reconstrucción de estado del
// Radar reescrita: el display SIEMPRE parte del último ciclo COMPLETO (6/6) en
// cyan; un ciclo en curso genuino (parcial < 7 días) pinta sus pilares dorados.
// Nunca hereda una fila parcial como estado actual. Parcial > 7 días = a cyan.
// cycleScanned sale de la DB → adiós desync N/6. El "N/6" solo aparece sin
// baseline (primer escaneo de la vida). v13.57 — Hub del Decodificador:
// al entrar a DECODIFICADOR se despliegan dos sellos (Materia | Sueños) vía
// DecoderModule; Sueños = nueva interfaz de estasis gated a Sintonía Solar.
// v13.51 — tier Decodificador 199:
// el Decodificador se abre con hasDecoderAccess (Sintonía O tier 199), no con
// la membresía Sintonía sola; invitación suave tras el 1er/2º escaneo. v13.50
// barrido profundo: protocolos
// (estado_tripulante_protocolos) + contenido de Calibraciones (libreria_protocolos)
// por el gateway user-action (member-gated el contenido). Lecturas con fallback
// transitorio a la lectura directa hasta el lock post-build. v13.49: perfil propio.
// v13.47 — Limpieza del handleToggleTask que escribía el id real de
// la fila de estado_tripulante_protocolos sobre el `id` del objeto
// local en dbProtos. Ese cambio post-upsert causaba un flash de
// pantalla vacía al primer check de cualquier tomo en desktop: el
// modal del tomo abierto matcheaba con `pr.id === openCodexId`, y
// cambiar el `id` rompía la condición, dejando solo el título del
// pilar visible (reportado por Zak 2026-05-07).
// Fix: el `id` del objeto local NO se actualiza más. Sigue siendo
// el `protocolo_id` (estable). El upsert a DB sigue funcionando
// porque busca la fila por `(clerk_user_id, protocolo_id)`, no por
// el id local. Ver EV_Modulos v1.31 para el cambio en la fuente que
// produce el objeto.
// v13.46 — handleToggleTask reescrito como upsert por
// (clerk_user_id, protocolo_id). Después del cambio v13.45 los
// protocolos se leen directo de libreria_protocolos sin asignar fila
// en estado_tripulante_protocolos: el handler viejo asumía que la
// fila ya existía y solo hacía PATCH por su id, así que el primer
// toque de cualquier checkbox no surtía efecto (ni en optimistic ni
// en DB). Ahora el handler:
//   1. Hace optimistic update sobre dbProtos buscando por
//      protocolo_id. Si el protocolo no estaba en dbProtos, lo
//      agrega con un id temporal.
//   2. GET en estado_tripulante_protocolos por
//      (clerk_user_id, protocolo_id). Si encuentra fila → PATCH;
//      si no → POST con la tarea inicial. Luego refresca el id
//      temporal con el real para los siguientes toggles.
//   3. El estado se persiste en DB por Tripulante: cerrar sesión y
//      volver a iniciar sesión recupera tareas_completadas tal
//      como quedaron.
// v13.45 — Calibraciones se desbloquean al cerrar el ciclo de 6
// pilares (no por pilar individual). Cargamos libreria_protocolos
// completa al mount y la pasamos a ModulosView junto con
// `cycleComplete = cycleScanned.size === 6`. La display ahora deriva
// runtime las calibraciones visibles para cada pilar desde la
// librería filtrada por score_min ≤ score del Tripulante. Ver
// EV_Modulos v1.28 para el detalle del cambio.
// El flujo del Enrutador post-pilar (que insertaba en
// estado_tripulante_protocolos cuando score < 50) sigue corriendo
// intacto — pero ya no es la fuente de verdad para mostrar las
// calibraciones. Solo se usa para preservar tareas_completadas (el
// progreso del Tripulante en cada tarea). Si una fila no existe,
// las tareas arrancan vacías y onToggleTask las upserta al primer
// toque.
// v13.44 — Enrutador de Calibración en cascada. Antes activaba sólo
// UN protocolo (el que cubría exactamente el score del Tripulante);
// ahora activa TODOS los protocolos del pilar cuyo score_min sea
// menor o igual al score actual. Un Tripulante en 35 % recibe el
// protocolo que cubre 30-40 % Y los anteriores (0-15, 16-30, etc.)
// como librería completa. Un solo round-trip para detectar cuáles
// ya están desbloqueados; el resto se inserta uno a uno.
// v13.43.2 — `ensure_profile` lee primero `unsafeMetadata.preferredName`
// del usuario Clerk antes de caer al fullName/firstName-lastName. Sin
// esto el RPC sobrescribía el preferredName con el fullName legacy
// en cada login, deshaciendo el cambio de nombre que el Tripulante
// guardó en Mi Firma. Cierra el bug crítico "Zak´Haar Cancún
// vuelve después de cerrar sesión" reportado mayo 2026.
// v13.43 — Splash post-login + boot veil + mini loader REMOVIDOS por
// completo (decisión de Zak, mayo 2026). Antes el "puntito cyan
// central + halo radial + texto Escáner Vibracional" aparecía sin
// razón en flows como /escaner/nucleo, /escaner/decodificador y
// otros sub-tabs. Cambios:
//   1. Effect que disparaba setShowSplash(true) reducido a noop.
//   2. Render del splash (motion.div key="splash") eliminado.
//   3. Render del boot veil (motion.div key="bootveil") eliminado.
//   4. Render del mini loader (motion.div key="authloading") eliminado.
//   El Escáner ahora aparece directo apenas se monta — sin transición
//   intermedia, sin pantalla negra, sin animación de bienvenida.
//   Las variables showSplash/showVeil/showMiniLoader se mantienen
//   como estado por compat (otros condicionales del render
//   `{!showSplash && ...}` los consultan), pero siempre quedan en
//   false.
// v13.42 — Guard CRÍTICO: el splash post-login (overlay azul oscuro
// fullscreen con puntito cyan central + halo radial + texto "Escáner
// Vibracional") ya NO se dispara cuando el componente está oculto
// por hideForOverlay=true (caso /escaner/nucleo, /escaner/holoteca,
// y sus sub-tabs). Antes el Escáner se montaba detrás del overlay
// del Núcleo en mobile, su useEffect detectaba authStatus="authed"
// y disparaba setShowSplash(true) → el splash se renderizaba con
// z-index 2147483600 cubriendo Mi Núcleo entero. Zak veía el "puntito
// cyan en el centro sobre fondo azul" durante segundos tras reload +
// cambio rápido de pestaña. Doble defensa: guard en el useEffect
// (no setea splash si hideForOverlay=true) + guard en el render
// (`{isOpen && showSplash && !hideForOverlay && ...}`).
// v13.41 — Guard contra race en handleNodeClick. Antes, post-reload
// rápido en /escaner/radar, un invitado con ciclo previo podía pasar
// el gate "sintonia" y entrar a la sonda — porque scanHistory todavía
// no había llegado y `hasPriorCompleteCycle` era false por timing.
// Ahora si `loaded=false` (loadData aún no completó), el click se
// ignora silenciosamente. A los ~1-2s tras refresh, loaded=true y los
// gates evalúan con la verdad final del historial.
// v13.40.1 — Hot fix CRÍTICO: pantalla negra en mobile + desktop al
// cargar el Escáner. Causa: `initialRadarCache` se declaraba después
// del primer `useState` que la usaba (Temporal Dead Zone) → crash.
// Movida la declaración arriba, junto al useState de `scores`.
// Eliminada la declaración duplicada que vivía más abajo.
// v13.40 — Cache del Radar extendido para incluir `scores`. Antes
// los porcentajes (HARDWARE 89%, MOTOR 50%, etc.) arrancaban como
// "..." mientras la fetch a Supabase resolvía y saltaban a su valor
// real ~300-800ms después. Ahora el cache persiste también los
// scores junto con el ciclo escaneado, así los porcentajes
// aparecen correctos desde el primer frame.
// v13.39 — Cache localStorage del estado del Radar por clerkUserId:
// `cycleScanned` (Set<PillarId>) + `lastCycleTs` (timestamp del
// cierre de ciclo). Evita el flicker "todos los pilares en cian
// → algunos saltan a dorado" que aparecía cada vez que `loadData`
// resolvía la fetch a Supabase. Initial state del Escáner ahora lee
// del cache (con validación: si el cooldown ya expiró, ignora el
// cache para que los pilares aparezcan disponibles para nuevo
// ciclo). useEffect persiste cycleScanned + lastCycleTs al cache
// cada vez que cambian, así la próxima monta entra ya con la foto
// correcta. Helpers `readRadarCache` / `writeRadarCache`.
// v13.38 — Splash post-login DESACTIVADO. El hexágono giratorio +
// texto "Escáner Vibracional" que aparecía al cargar (~2.6s) ya no
// se muestra: globalSplashShown arranca en true (nunca se dispara
// por primera vez) y el velo negro inicial parte en false. Bloque
// JSX del splash queda como código muerto pero inalcanzable. Resto
// del flow auth/loading intacto. Pedido directo de Zak: el ritual
// post-login era residuo de iteraciones viejas y ya no aporta.
// v13.37 — Bootveil zIndex bajado de 2147483599 a 850 para que NO
// tape la barra superior del [CENTRO DE MANDO] (NavegadorEstacion
// vive en z-index 900). El componente entero renderiza con
// createPortal a document.body, así que el velo escapaba el
// stacking context de PageContent y competía directamente con el
// navbar global. Síntoma reportado: la primera vez que el
// tripulante navegaba Holoteca → Calibración (o Holoteca → Escáner)
// post-fresh-load, la barra superior "desaparecía" durante la
// hidratación inicial (~400-1000ms) y luego volvía. La segunda y
// siguientes navegaciones ya no mostraban el problema porque
// globalSplashShown=true y el velo no se montaba (v13.36). Ahora
// con z 850, el velo cubre solo lo que está debajo del navbar (y
// del AuthHeader, max int) — el shell de navegación queda intacto
// durante toda la transición. Splash sigue arriba (z 2147483600)
// para el ritual post-login full-screen.
// v13.36 — Initial state del bootveil respeta globalSplashShown.
// El splash ya no se re-disparaba en remounts (v13.35), pero el
// velo negro inicial sí seguía apareciendo en cada mount nuevo y
// cubría la pantalla por ~400ms con el exit fade — el tripulante
// veía la barra superior y el fondo "refrescándose" en cada
// transición Holoteca → Escáner / Calibración aunque el splash
// nunca apareciera. Ahora si globalSplashShown es true, el veil
// arranca en false y no hay overlay alguno entre transiciones.
// v13.35 — Splash post-login solo aparece UNA vez por carga de
// página (guard módulo-level globalSplashShown). Antes, navegar
// entre tabs (Holoteca → Escáner / Calibración) remontaba el
// componente y disparaba el splash de nuevo — el overlay opaco
// azul oscuro cubría toda la pantalla por ~2.6s y el tripulante
// percibía un "refresh" del fondo y la barra superior. Ahora la
// segunda y siguientes monturas saltan el splash directo a la
// vista útil.
// v13.34
// v13.34 — Reset de moduloDetail/activePillar/subView cuando
// hideForOverlay pasa a true. Sin esto, el portal del botón Volver
// del pilar abierto en Calibración persistía visible cuando el
// shell mobile mostraba Holoteca o Núcleo encima — selectedPillar
// del ModulosView seguía non-null y el portal de createPortal
// permanecía en document.body detrás del overlay de la nueva capa.
// v13.33 — Botón flotante Volver del Dock back oculto en mobile
// (la BottomNav del shell mobile cubre la salida y antes el botón
// quedaba detrás de la barra inferior, generando confusión visual).
// Solo se monta en desktop, donde NavegadorEstacion top no incluye
// back para sub-vistas.
// EscanerVibracional.tsx v13.32
// v13.32 — Hot fix CRÍTICO: el velo negro v13.30 quedaba visible
// permanente en desktop /escaner. Dos causas:
// (1) Cuando el splash useEffect decidía saltar el splash (por flag
//     suppress-welcome / oauth-redirect / gateAuth), seteaba
//     splashShownRef.current=true SILENCIOSAMENTE pero el useEffect
//     del veil hide depende de [showSplash] y showSplash nunca pasa
//     de true a false → el setTimeout(setShowVeil(false), 500) nunca
//     se programaba. Fix: setShowVeil(false) explícito en los return
//     paths del splash useEffect que saltan el splash.
// (2) Si `loaded` (fetch de scanHistory) nunca terminaba, el splash
//     hide useEffect (que requiere splashMinReached && loaded) nunca
//     disparaba → splash visible para siempre → veil tampoco bajaba.
//     Fix: safety timeout 8s post-splash-show que fuerza hide.
// (3) Safety global: si el veil sigue visible 10s después del mount,
//     force hide. Última red de seguridad contra estados zombie.
// EscanerVibracional.tsx v13.31
// v13.31 — Tres cambios para el flow del cooldown:
// (1) Pasamos `isActiveMember` al Radar para que decida si mostrar
//     el badge "Próximo Escaneo" arriba del hexágono (sólo
//     suscriptores Sintonía Solar; ver EV_Radar v2.7).
// (2) Cuando un no-miembro pica un pilar mientras hay cooldown, el
//     gate Sintonía Solar se dispara con un nuevo prop
//     `cooldownLabel` (formato "Xd Yh") leído por el modal para
//     mostrar "Próximo escaneo en X d Y h" debajo del eyebrow.
//     Ver EV_Freemium v1.6.
// (3) Helper `buildCooldownLabel()` dentro de handleNodeClick para
//     calcular la etiqueta del countdown desde lastCycleTs.
// EscanerVibracional.tsx v13.30.1
// v13.30.1 — Hot fix: `loaded` se movió arriba en el orden de
// declaraciones para que los useEffects del splash hide (que lo
// leen) no fallen con "Cannot access 'loaded' before initialization".
// EscanerVibracional.tsx v13.30
// v13.30 — Velo negro continuo durante todo el flow de carga
// post-reload, y splash que NO cierra hasta que la data del radar
// esté lista. Antes el orden visual era:
//   reload → radar vacío → splash → radar vacío otra vez → radar
//   con data
// porque el radar se renderizaba debajo del splash desde el primer
// frame, y cuando el splash terminaba (2.6s fijos) la data aún no
// había llegado de Supabase. Ahora:
//   reload → velo negro → splash dorado (mínimo 2.6s, espera data
//   si tarda más) → radar con data
// El velo se mantiene desde el mount hasta que el splash exit
// termina, así nunca se ve el radar vacío. En anon (no logueado)
// el velo se oculta sin pasar por splash.
// EscanerVibracional.tsx v13.29
// v13.29 — Mini loader con delay 1.5s. Antes el dot cyan aparecía
// instantáneo al renderizar mientras Clerk hidrataba authStatus;
// si Clerk respondía rápido (caso normal), el puntito flasheaba
// brevemente y se sentía como ruido visual. Ahora el mini loader
// solo aparece si authStatus permanece "unknown" más de 1500ms.
// Hidrataciones normales (<1.5s): NO se ve el puntito, solo fondo
// negro hasta que el contenido aparece.
// EscanerVibracional.tsx v13.28
// v13.28 — TTL del flag suppress-welcome bajado de 5min a 60s en
// los checks del splash y del mini loader. Antes el reload manual
// dentro de 5min después de un OAuth/signOut bloqueaba el splash
// "ESCÁNER VIBRACIONAL" indebidamente. Con 60s cubrimos flows
// OAuth lentos (2FA, conexión lenta) sin afectar reloads manuales
// posteriores: tras un minuto del último auth event, el splash
// vuelve a aparecer normal.
// EscanerVibracional.tsx v13.27
// v13.27 — Mini loader desactivado COMPLETO en flows OAuth/signOut
// (no solo el dot, también la capa azul #020818 del background).
// Antes con v13.26 ocultábamos solo el dot pero la capa azul sólida
// seguía visible brevemente. Zak la veía como pelusa azul. Ahora si
// hay flag rsv-suppress-welcome o rsv-clerk-oauth-redirect, ni
// siquiera renderizamos el motion.div del loader — queda solo el
// fondo natural del shell.
// EscanerVibracional.tsx v13.26
// v13.26 — Mini loader (dot cyan 10×10 que pulsa mientras Clerk
// hidrata authStatus) oculta el dot cuando hay flag
// "rsv-suppress-welcome" o "rsv-clerk-oauth-redirect". Sólo deja
// el background sólido oscuro como velo. Antes Zak veía el dot
// brevemente al cerrar sesión, justo después del location.replace
// a /escaner mientras Clerk descubre que ya no hay usuario. Con
// esto la transición es solo fade negro → shell, sin elemento
// que distraiga.
// EscanerVibracional.tsx v13.25
// v13.25 — TTL del flag "rsv-suppress-welcome" ampliado de 30s a
// 5min en el check del splash. El OAuth callback de Google a veces
// dispara un segundo reload interno (Clerk limpia los params del
// URL navegando a una versión limpia), y entre el set del flag
// (handleGoogleAuth pre-redirect) y la lectura por EscanerVibracional
// pasan más de 30s en conexiones lentas o con 2FA. Con 5min cubrimos
// todos los casos prácticos.
// EscanerVibracional.tsx v13.24
// v13.24 — Splash zIndex bajado de 2147483647 (max int) a
// 2147483600 para que el modal de Auth (que también usa max int)
// siempre quede encima cuando ambos coexisten. Antes, en register
// con Google, el modal "Sella tu entrada" aparecía y el splash
// disparaba encima por estar después en el DOM, parpadeando hasta
// que el splash terminaba. Con zIndex menor el modal Auth queda
// estable y el splash debajo (no visible mientras hay modal).
// EscanerVibracional.tsx v13.23
// v13.23 — Splash post-auth se salta cuando el tripulante viene
// de un flow OAuth callback. Antes, después de iniciar sesión con
// Google, el splash "ESCÁNER VIBRACIONAL" (hexágono dorado + orbe
// cyan) aparecía durante 2.6s entre que se cerraba el modal de
// auth y se mostraba el contenido. Zak lo veía como una animación
// no deseada interrumpiendo el flow OAuth. Lectura de
// sessionStorage["rsv-suppress-welcome"] (Auth2Modal lo setea en
// triggerSuccess y handleConfirmGoogleSignup) o
// sessionStorage["rsv-clerk-oauth-redirect"] (presente durante el
// callback) para saltar el splash igual que cuando el auth vino
// del gate interno (gateAuthTriggeredRef).
// EscanerVibracional.tsx v13.22
// v13.22 — Dispatch de CicloSellado más robusto: ANTES del envío
// hacemos un sbGet a profiles para tener email + full_name como
// fallback cuando window.Clerk.user esté vacío. dispatchCicloSellado
// ya prefiere Clerk si existe, pero el fallback de Supabase elimina
// el caso silencioso del primer tripulante en cerrar ciclo (no llegó
// el correo). Logs ahora visibles con prefijo [CicloSellado].
// EscanerVibracional.tsx v13.21
// v13.21 — esc-scroll mobile paddingTop pasa de 32 a 8: títulos
// de Calibración + Decodificador suben al top-left (esquina
// superior izquierda), alineados con Holoteca/Núcleo del shell
// del Lente. Radar también se levanta 24px pero como no tiene
// título propio no impacta visualmente — el hexágono sube y el
// dock deja más aire abajo.
// EscanerVibracional.tsx v13.20
// v13.20 — Pasamos hideForOverlay a DecodificadorView. El contador
// freemium 3/3 vive en createPortal a document.body (fuera del
// wrapper que se oculta con display:none) — sin propagar la flag
// el chip seguía visible al cambiar a Holoteca/Núcleo desde
// Decodificador.
// EscanerVibracional.tsx v13.19
// v13.19 — Rename: tab "Protocolos" → "Calibración" en el Dock
// interno (mobile y desktop fallback).
// EscanerVibracional.tsx v13.18 — Wrapper externo de modulos pasa a
// flexDirection:column +
// flex:1 mobile + alignItems:center. Esto le da al ModulosView
// mobile (con sus spacers flex:1.6/3) la altura disponible necesaria
// para centrar verticalmente el grid de pilares — antes el wrapper
// era flex:row sin altura y los spacers no expandían.
// EscanerVibracional.tsx v13.17 — Quitamos AnimatePresence del switch
// entre vistas radar/
// modulos/decodificador/recalibracion. El AnimatePresence con
// mode="wait" hacía exit fade del view anterior cuando effectiveView
// cambiaba; al volver de Holoteca/Núcleo + cambiar de view, ese fade
// renderizaba el view previo brevemente. Ahora cada view se
// renderiza condicionalmente y React lo desmonta al instante. Las
// animaciones internas de cada motion.div siguen funcionando.
// padding-bottom mobile pasa de 130 a 100 px — los pilares de
// Protocolos suben en el centro vertical.
// v13.16 — Dos fixes para el flash al cambiar tabs en mobile:
//   1) effectiveView derivado en render (controlledMainView ?? mainView)
//      reemplaza mainView en TODAS las lecturas del JSX. La vista
//      siempre coincide con la que el shell controla, sin esperar al
//      useEffect.
//   2) Wrapper main pasa de visibility:hidden a display:none cuando
//      hideForOverlay. Las sub-tabs (Lente Óptico / Códice de Materia)
//      del Decoder ya no se asoman brevemente al cambiar a Núcleo.
//      React preserva el state interno con display:none igual que con
//      visibility:hidden.
// v13.14 — useLayoutEffect (en lugar de useEffect) sincroniza mainView
// con controlledMainView ANTES del paint. Elimina el flash de la vista
// anterior cuando el shell externo (AppNavegacionMobile) cambia entre
// Protocolos / Decodificador / Radar después de pasar por Holoteca.
// v13.13 — Pasamos dbLoaded={loaded} a ModulosView para evitar el
// flash de "Aún sin protocolos asignados" durante la carga inicial.
// v13.12 — Nuevo prop opcional hideForOverlay. Cuando AppNavegacionMobile
// pone Holoteca o Núcleo encima, el Escáner sigue montado para preservar
// state pero el wrapper main pasa a visibility:hidden + pointerEvents:none
// para liberar el fondo de estrellas del Domo (overlay transparente arriba).
// v13.11 — Bottom sheet de Identificación de Nodo movido AFUERA del
// main shell para que su zIndex max gane sobre el overlay Holoteca/
// Núcleo (zIndex 100) — antes el sheet quedaba enterrado al venir
// desde Holoteca. Botón "×" para cerrarlo y volver al contexto previo.
// Skip splash post-gate: si el auth flow vino del gate, el splash
// no se monta — preservando phase del Decoder, sondas en curso,
// foto de galería cargada. El tripulante regresa al mismo punto.
// v13.10 — Pasamos authGateOpen={authGate} al DecodificadorView para
// que oculte su cámara fullscreen cuando el modal de identificación
// está abierto. Antes el portal de la cámara (zIndex 200000) cubría
// el modal; ahora la cámara baja a zIndex 5 + visibility:hidden
// mientras el gate está vivo, y reaparece intacta al cerrarlo.
// v13.9 — Radar desktop bajado: padding-top del wrapper esc-scroll
// pasa de 0 a 96px para librar la NavegadorEstacion y centrar el
// radar en el eje vertical del viewport restante.
// v13.8 — Auth gate del Decodificador: nuevo state authGateContext
// ("sonda" | "decoder") que muta el subtítulo del modal según el
// trigger. Sonda usa "Ancla tu frecuencia para calibrar tu sistema
// de telemetría hexagonal..." (default). Decoder usa "El motor
// cuántico está listo para procesar esta geometría. Ancla tu
// frecuencia para decodificar esta materia y reclamar tus 3 pulsos
// de diagnóstico de cortesía." Helper triggerAuthGate(context) abre
// el gate con el copy correspondiente.
// v13.7 — NavRevealPin removido + listener hash multi-evento +
// onAuthGateChange notifica al shell externo + custom event
// rsv-request-auth-gate (Núcleo invitado lo dispara desde mobile
// nav). El gate al activarse esconde la BottomNav del [LENTE].
// v13.5 — Fricción Cero universal: el muro inicial cae también en
// desktop. Cualquier tripulante entra directo al radar; el gate solo
// se levanta al primer intento de escritura.
// Shell de composición tras el split v12.68. Toda la maquinaria viva del
// Escáner se distribuye en 8 Code Files hermanos:
//   EV_Shared (tipos/helpers/hooks/CSS)
//   EV_Icons (SVGs UI + 6 Mon* + helpers de pilar)
//   EV_Freemium (FreemiumGateModal)
//   EV_Codex (SacredCodex interno + CodexCarousel)
//   EV_Modulos (ModulosView + ProtocolosEmptyState)
//   EV_Radar (Radar + Sonda + CooldownView + ProcessingAnim + NodoCeroCeremony + PILLARS)
//   EV_Recal (RecalView + TimelineChart)
//   EV_Decoder (DecodificadorView + pipeline OCR 2-etapas + Anillo de Composición)
// Este shell solo orquesta: estado global del tripulante, ruteo entre
// vistas, AnimatePresence del splash + auth gate + main, dispatch de
// scans/protocolos contra Supabase y addPropertyControls (única fuente
// de configuración expuesta a Domo).
import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useCallback,
    useRef,
    useMemo,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType } from "framer"
import { useAuthModalState } from "./AuthOverrides.tsx"

import Shared, {
    DBProtocol,
    MainView,
    PillarId,
    ScanEntry,
    Scores,
    SondaQ,
    SubView,
    Timestamps,
} from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"
import RadarPack from "./EV_Radar.tsx"
import ModulosView from "./EV_Modulos.tsx"
import RecalView from "./EV_Recal.tsx"
import DecoderModule from "./EV_DreamDecoder.tsx"
import FreemiumGateModal from "./EV_Freemium.tsx"
import CeremoniaIndiceLuz from "./CeremoniaIndiceLuz.tsx"

const {
    GOLD,
    COOLDOWN_SEC,
    TAB_ORDER_D,
    TAB_ORDER_M,
    hx,
    saveCycleState,
    clearCycleState,
    dispatchCicloSellado,
    sbGet,
    sbPost,
    sbPatch,
    sbRpc,
    userAction,
    useIsMobile,
    useEscanerMembershipStatus,
    useDecoderAccessStatus,
    useDreamAccessStatus,
    useInjectCss,
    fireAuroraBloom,
} = Shared

const { IBack, IRadar, IMod, IRecIcon, IDecoder, getPillarLabel } = Icons
const { Radar, Sonda, CooldownView, NodoCeroCeremony, PILLARS } = RadarPack

interface Props {
    isOpen: boolean
    onClose: () => void
    accentColor?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    /* Link Stripe Payment para Sintonía Solar mensual ($777 MXN). El
       Escáner usa SINTONIA_SOLAR_LINK hardcodeado por defecto; este
       prop sigue aceptado para overrides puntuales. */
    linkStripeMembSolar?: string
    authSlot?: React.ReactNode
    /* v13.1 — Embedded mode para AppNavegacionMobile.
       controlledMainView: si está set, el shell ignora el state interno
       de mainView y usa este valor (la nav externa controla qué vista
       se muestra). hideInternalDock: oculta el <Dock /> interno (la nav
       externa hace su trabajo). onAuthChange: callback al padre cuando
       authStatus cambia, para que el shell externo pueda mostrar/ocultar
       su propia nav según hay sesión o no. onProcChange: callback al
       padre cuando isProc cambia (durante ProcessingAnim/FrecuenciaAnclada
       de una sonda); replica el comportamiento del Dock interno —
       cuando hay proceso activo la nav externa se oculta. */
    controlledMainView?: MainView
    hideInternalDock?: boolean
    onAuthChange?: (authed: boolean) => void
    onProcChange?: (proc: boolean) => void
    /* v13.7 — onAuthGateChange notifica al shell externo
       (AppNavegacionMobile) cuando el gate de identificación se
       levanta/baja, para que pueda ocultar su bottom nav y no
       obstruya el modal. */
    onAuthGateChange?: (open: boolean) => void
    /* v13.12 — hideForOverlay: cuando true, el wrapper main del Escáner
       se oculta visualmente (visibility hidden + pointerEvents none) sin
       desmontarse — preserva state cycle/scores intacto. Lo usa
       AppNavegacionMobile cuando el tripulante pasa a Holoteca o Núcleo
       para liberar el fondo de estrellas del Domo bajo el overlay. */
    hideForOverlay?: boolean
}

/* ═══ Dock — barra inferior cyan con shimmer fantasma ═══ */
function Dock({
    active,
    onChange,
    accent,
    inSonda,
    onBack,
    hidden,
    isMobile,
}: {
    active: MainView
    onChange: (v: MainView) => void
    accent: string
    inSonda: boolean
    onBack: () => void
    hidden: boolean
    isMobile: boolean
}) {
    const items: [MainView, React.ReactNode, string][] = isMobile
        ? [
              ["radar", <IRadar />, "Radar"],
              ["modulos", <IMod />, "Calibración"],
              ["recalibracion", <IRecIcon />, "Trayectoria"],
              ["decodificador", <IDecoder />, "Decodificador"],
          ]
        : [
              ["radar", <IRadar />, "Radar"],
              ["modulos", <IMod />, "Calibración"],
              ["recalibracion", <IRecIcon />, "Trayectoria"],
          ]
    return (
        <AnimatePresence>
            {!hidden && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35 }}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 18,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                        paddingBottom: isMobile
                            ? "max(12px, env(safe-area-inset-bottom))"
                            : 32,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            gap: isMobile ? 8 : 14,
                            padding: isMobile ? "6px 14px" : "5px 18px",
                            borderRadius: 999,
                            overflow: "hidden",
                            isolation: "isolate",
                            background: `linear-gradient(135deg, rgba(8, 24, 48, 0.88) 0%, rgba(5, 16, 34, 0.94) 45%, rgba(4, 14, 30, 0.94) 55%, rgba(8, 24, 48, 0.88) 100%), ${hx(accent, 0.06)}`,
                            border: `1px solid ${hx(accent, 0.38)}`,
                            backdropFilter:
                                "blur(20px) saturate(160%) brightness(1.08)",
                            WebkitBackdropFilter:
                                "blur(20px) saturate(160%) brightness(1.08)",
                            boxShadow: [
                                `0 8px 26px ${hx(accent, 0.14)}`,
                                `0 2px 10px rgba(0,0,0,0.35)`,
                                `inset 0 0 22px ${hx(accent, 0.08)}`,
                                `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                                `0 0 0 0.5px ${hx(accent, 0.12)}`,
                            ].join(", "),
                            pointerEvents: "auto",
                        }}
                    >
                        <motion.div
                            animate={{ left: ["-70%", "160%"] }}
                            transition={{
                                duration: 11,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 2,
                            }}
                            style={{
                                position: "absolute",
                                top: "-80%",
                                height: "260%",
                                left: "-70%",
                                width: "55%",
                                background: `linear-gradient(110deg, transparent 0%, transparent 20%, ${hx("#FFFFFF", 0.025)} 38%, ${hx(accent, 0.09)} 50%, ${hx("#FFFFFF", 0.025)} 62%, transparent 80%, transparent 100%)`,
                                filter: "blur(22px)",
                                transform: "rotate(14deg)",
                                pointerEvents: "none",
                                zIndex: 0,
                                opacity: 0.85,
                            }}
                        />
                        <AnimatePresence>
                            {inSonda && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10, width: 0 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        width: "auto",
                                    }}
                                    exit={{ opacity: 0, x: 10, width: 0 }}
                                    transition={{ duration: 0.25 }}
                                    style={{
                                        position: "absolute",
                                        right: "100%",
                                        top: 0,
                                        bottom: 0,
                                        display: "flex",
                                        alignItems: "stretch",
                                        gap: 4,
                                        paddingRight: 6,
                                        overflow: "hidden",
                                    }}
                                >
                                    <button
                                        onClick={onBack}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: isMobile
                                                ? "8px"
                                                : "10px 14px",
                                            borderRadius: isMobile ? 14 : 16,
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            background:
                                                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
                                            backdropFilter:
                                                "blur(24px) saturate(160%)",
                                            WebkitBackdropFilter:
                                                "blur(24px) saturate(160%)",
                                            color: "rgba(255,255,255,0.7)",
                                            cursor: "pointer",
                                            outline: "none",
                                            fontFamily: "'Inter',sans-serif",
                                            whiteSpace: "nowrap",
                                            boxShadow: [
                                                "inset 0 1px 0 rgba(255,255,255,0.12)",
                                                "0 8px 24px rgba(0,0,0,0.4)",
                                            ].join(", "),
                                            minHeight: isMobile ? 36 : 48,
                                            minWidth: isMobile ? 36 : 48,
                                            width: isMobile ? 36 : "auto",
                                        }}
                                    >
                                        <IBack />
                                        {!isMobile && (
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 400,
                                                    letterSpacing: "0.08em",
                                                    textTransform: "uppercase",
                                                    marginLeft: 4,
                                                }}
                                            >
                                                Volver
                                            </span>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {items.map(([id, icon, label]) => {
                            const on = active === id
                            return (
                                <button
                                    key={id}
                                    onClick={() => onChange(id)}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 4,
                                        padding: isMobile
                                            ? "8px 10px"
                                            : "10px 16px",
                                        border: "none",
                                        background: "transparent",
                                        color: on
                                            ? accent
                                            : "rgba(255,255,255,0.62)",
                                        cursor: "pointer",
                                        outline: "none",
                                        fontFamily: "'Inter',sans-serif",
                                        width: isMobile ? 80 : 120,
                                        minWidth: isMobile ? 80 : 120,
                                        minHeight: isMobile ? 52 : 60,
                                        WebkitTapHighlightColor: "transparent",
                                        zIndex: 1,
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            scale: on ? 1.18 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 360,
                                            damping: 22,
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            filter: on
                                                ? `drop-shadow(0 0 8px ${hx(accent, 0.9)}) drop-shadow(0 0 16px ${hx(accent, 0.5)})`
                                                : "none",
                                            transition: "filter 0.3s ease",
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        {icon}
                                    </motion.div>
                                    <span
                                        style={{
                                            fontSize: isMobile ? 7 : 10,
                                            fontWeight: on ? 600 : 400,
                                            letterSpacing: "0.06em",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                            textShadow: on
                                                ? `0 0 8px ${hx(accent, 0.6)}, 0 0 16px ${hx(accent, 0.3)}`
                                                : "none",
                                            transition: "text-shadow 0.3s ease",
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        {label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/* v13.38 — Guard módulo-level pre-armado en true. Antes el splash
   se disparaba la PRIMERA vez post-login en cada page reload (~2.6s
   con hexágono girando + texto "Escáner Vibracional"). Pedido de
   Zak: ya no lo queremos. Inicializar en true cierra ese path:
   cuando el effect que dispara el splash llega al check
   `if (globalSplashShown) { setShowVeil(false); return }`, sale
   inmediato sin tocar showSplash. El bloque JSX del splash sigue
   en el render pero el flag showSplash nunca pasa a true → nunca
   se monta. */
let globalSplashShown = true

/* v13.39 — Cache localStorage del estado del Radar por clerkUserId.
   Se persiste el Set<PillarId> escaneados del ciclo + timestamp del
   cierre. La hidratación al mount es validada: si el cooldown ya
   expiró, descartamos el cache (los pilares deben aparecer cyan
   listos para nuevo ciclo). Sin esto, cada apertura del Escáner
   mostraba todos los pilares cyan ~300-1000ms hasta que loadData
   pintaba dorado los ya escaneados, generando flicker visible. */
const RADAR_CACHE_PREFIX = "rsv-radar-cycle-"
const PILLAR_IDS_LIST: PillarId[] = [
    "fisico",
    "mental",
    "emocional",
    "financiero",
    "vector",
    "orbita",
]
function readRadarCache(
    clerkUserId: string | undefined
): {
    scanned: PillarId[]
    lastCycleTs: number | null
    scores: Scores | null
} | null {
    if (!clerkUserId || typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(RADAR_CACHE_PREFIX + clerkUserId)
        if (!raw) return null
        const j = JSON.parse(raw)
        if (!Array.isArray(j?.scanned)) return null
        const scanned = j.scanned.filter(
            (x: any): x is PillarId =>
                typeof x === "string" &&
                PILLAR_IDS_LIST.includes(x as PillarId)
        )
        const lastTs =
            typeof j?.lastCycleTs === "number" && j.lastCycleTs > 0
                ? j.lastCycleTs
                : null
        /* Si el cooldown ya expiró, descartar cache: los pilares
           deben aparecer cyan listos para nuevo ciclo. */
        if (
            lastTs !== null &&
            (Date.now() - lastTs) / 1000 >= COOLDOWN_SEC
        ) {
            return null
        }
        /* v13.40 — Recuperar scores cacheados (parcial OK: cualquier
           pilar sin valor en cache vuelve a null). */
        let scores: Scores | null = null
        if (j?.scores && typeof j.scores === "object") {
            const s: any = {}
            for (const id of PILLAR_IDS_LIST) {
                const v = j.scores[id]
                s[id] =
                    typeof v === "number" && v >= 0 && v <= 100 ? v : null
            }
            scores = s as Scores
        }
        return { scanned, lastCycleTs: lastTs, scores }
    } catch {
        return null
    }
}
function writeRadarCache(
    clerkUserId: string | undefined,
    scanned: Set<PillarId>,
    lastCycleTs: number | null,
    scores: Scores
) {
    if (!clerkUserId || typeof window === "undefined") return
    try {
        localStorage.setItem(
            RADAR_CACHE_PREFIX + clerkUserId,
            JSON.stringify({
                scanned: Array.from(scanned),
                lastCycleTs,
                scores,
            })
        )
    } catch {}
}

/* ═══ MAIN — orquestador del Escáner ═══ */
export function EscanerVibracional({
    isOpen,
    onClose,
    accentColor = "#00e5ff",
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
    linkStripeMembSolar = "",
    controlledMainView,
    hideInternalDock = false,
    onAuthChange,
    onProcChange,
    onAuthGateChange,
    hideForOverlay = false,
}: Props) {
    useInjectCss()
    const isMobile = useIsMobile()
    const isActiveMember = useEscanerMembershipStatus(
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId
    )
    /* Acceso ilimitado al Decodificador (señal separada de Sintonía):
       lo abre el tier 199 Y cualquier Sintonía activa. El Radar /
       Calibraciones / Holoteca siguen pidiendo isActiveMember. */
    const hasDecoderAccess = useDecoderAccessStatus(
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        isActiveMember
    )
    /* Acceso al Decodificador de Sueños — Sintonía o el tier Dual (399). */
    const hasDreamAccess = useDreamAccessStatus(
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        isActiveMember
    )
    /* Body/html overflow hidden mientras el Escáner está abierto. */
    useEffect(() => {
        if (!isOpen) return
        const prevH = document.documentElement.style.overflow
        const prevB = document.body.style.overflow
        document.documentElement.style.overflow = "hidden"
        document.body.style.overflow = "hidden"
        return () => {
            document.documentElement.style.overflow = prevH
            document.body.style.overflow = prevB
        }
    }, [isOpen])
    /* Auth tri-state: unknown (Clerk hidratando), authed, anon. */
    type AuthStatus = "unknown" | "authed" | "anon"
    const readAuthStatus = (): AuthStatus => {
        if (typeof window === "undefined") return "unknown"
        if (clerkUserId) return "authed"
        const C = (window as any).Clerk
        if (!C) return "unknown"
        if (!C.loaded) return "unknown"
        return C.user?.id ? "authed" : "anon"
    }
    const [authStatus, setAuthStatus] = useState<AuthStatus>(readAuthStatus)
    const [showSplash, setShowSplash] = useState<boolean>(false)
    /* v13.30 — Velo negro continuo desde el mount. Tapa el radar
       y main content debajo durante: hidratación de Clerk +
       polling auth + animación de splash + carga de data del
       radar. Se oculta cuando: authStatus="anon" (no logueado, no
       hay splash) o cuando el splash exit termina.
       v13.36 — initial state ahora respeta globalSplashShown. Si el
       splash YA se mostró en esta carga de página (otra instancia
       previa del Escáner pasó por el flow), el veil NO arranca en
       true. Sin esto, navegar entre tabs (Holoteca → Escáner /
       Calibración) cubría la pantalla con el velo negro por ~400ms
       cada vez — el tripulante percibía la barra superior y el
       fondo "refrescándose" aunque el splash mismo ya no se
       disparara. */
    /* v13.38 — Veil arranca SIEMPRE en false ahora que el splash
       quedó desactivado. Sin splash no hay nada que cubrir durante
       la transición; el shell pinta directo. */
    const [showVeil, setShowVeil] = useState<boolean>(false)
    /* v13.30 — splashMinReached: true cuando han pasado 2.6s desde
       que el splash disparó. El splash NO se oculta hasta que ESTO
       Y `loaded` (data del radar lista) sean ambos true. */
    const [splashMinReached, setSplashMinReached] =
        useState<boolean>(false)
    /* v13.30.1 — `loaded` declarado acá (movido desde más abajo)
       para que los useEffects de splash hide puedan leerlo sin
       error de inicialización. */
    const [loaded, setLoaded] = useState(false)
    /* anti-flash: marca que el fetch del historial de escaneos ya
       resolvió. El Radar solo muestra "Toca un nodo" cuando esto es
       true (además de `loaded`) → sin parpadeo con red lenta mientras
       hidrata los datos del Tripulante. */
    const [scanResolved, setScanResolved] = useState(false)
    /* v13.28 — Detecta si veníamos de un flow OAuth/signOut MUY
       reciente (TTL 60s). Si está, suprime el mini loader entero
       para que la transición sea fade limpio. Reload manual
       posterior >60s ve el mini loader normal. */
    const suppressMiniLoaderDot = useMemo(() => {
        if (typeof window === "undefined") return false
        try {
            const suppress = sessionStorage.getItem("rsv-suppress-welcome")
            if (suppress) {
                const ts = Number(suppress)
                if (!isNaN(ts) && Date.now() - ts < 60 * 1000) return true
            }
            const oauthFlag = sessionStorage.getItem(
                "rsv-clerk-oauth-redirect"
            )
            if (oauthFlag) {
                const ts = Number(
                    sessionStorage.getItem("rsv-clerk-oauth-time") || "0"
                )
                if (Date.now() - ts < 60 * 1000) return true
            }
        } catch {}
        return false
    }, [])

    /* v13.29 — Mini loader con delay 1.5s. Si Clerk hidrata rápido
       (caso normal), authStatus pasa a "authed"/"anon" antes y el
       loader nunca aparece. Solo se muestra si la hidratación tarda
       más de 1.5s (conexión lenta, Clerk no carga). */
    const [showMiniLoader, setShowMiniLoader] = useState(false)
    useEffect(() => {
        if (authStatus !== "unknown") {
            setShowMiniLoader(false)
            return
        }
        const t = setTimeout(() => setShowMiniLoader(true), 1500)
        return () => clearTimeout(t)
    }, [authStatus])
    const splashShownRef = useRef<boolean>(false)
    /* v13.11 — Cuando el authGate se levanta DENTRO de un flow (ej:
       cámara abierta, sonda en curso, decodificador con foto cargada),
       saltamos el splash post-login para no desmontar el contexto en
       el que estaba el tripulante. El splash bonito se queda para el
       login "frío" (entrada directa a /escaner sin sesión). */
    const gateAuthTriggeredRef = useRef<boolean>(false)
    const [suppressGate, setSuppressGate] = useState<boolean>(false)
    const authModal = useAuthModalState()
    const authModalRef = useRef(authModal)
    authModalRef.current = authModal
    /* Poll Clerk cada 150ms mientras isOpen. */
    useEffect(() => {
        if (!isOpen) return
        const check = () => {
            const next = readAuthStatus()
            setAuthStatus((prev) => (prev === next ? prev : next))
        }
        check()
        const iv = setInterval(check, 150)
        const safety = setTimeout(() => {
            setAuthStatus((prev) => (prev === "unknown" ? "anon" : prev))
        }, 1500)
        return () => {
            clearInterval(iv)
            clearTimeout(safety)
        }
    }, [isOpen, clerkUserId])
    /* v13.43 — Splash post-login DESHABILITADO POR COMPLETO. Decisión
       de Zak (mayo 2026): la animación legacy "puntito cyan + halo
       radial + texto Escáner Vibracional" causaba más fricción que
       valor (aparecía en mobile detrás del Núcleo, en /decodificador
       sin razón clara, etc). El effect queda como noop por
       compatibilidad: las variables `showSplash`, `splashMinReached`,
       `splashShownRef` y `globalSplashShown` siguen existiendo —
       siempre con valor falso/cero — porque otros condicionales del
       render (`{!showSplash && ...}`, etc) las consultan. Resultado:
       el Escáner aparece directo apenas se monta, sin transición
       intermedia. */
    useEffect(() => {
        /* No-op intencional. */
    }, [authStatus, isOpen, hideForOverlay])
    /* v13.30 — Splash hide en dos fases:
       (1) splashMinReached se setea true 2.6s después que showSplash
           pasó a true (duración mínima de la animación bonita).
       (2) Cuando splashMinReached Y loaded (data del radar lista)
           son ambos true, ocultamos el splash.
       Antes el splash se cerraba a los 2.6s fijos sin mirar `loaded`
       y el tripulante veía radar vacío después. */
    useEffect(() => {
        if (!showSplash) {
            setSplashMinReached(false)
            return
        }
        const t = setTimeout(() => setSplashMinReached(true), 2600)
        return () => clearTimeout(t)
    }, [showSplash])
    useEffect(() => {
        if (!showSplash) return
        if (splashMinReached && loaded) {
            setShowSplash(false)
        }
    }, [showSplash, splashMinReached, loaded])
    /* v13.32 — Safety timeout del splash: si tras 8s desde mostrar
       splash, `loaded` no terminó (network lento, fetch colgado, etc),
       force hide. Evita que el splash quede infinito y deje el veil
       atrás bloqueando la app. */
    useEffect(() => {
        if (!showSplash) return
        const t = setTimeout(() => setShowSplash(false), 8000)
        return () => clearTimeout(t)
    }, [showSplash])
    /* v13.32 — Safety global del veil: 10s tras el mount. Última red
       de seguridad por si los useEffects de hide no disparan en algún
       caso edge. El tripulante NUNCA queda con pantalla negra
       permanente. */
    useEffect(() => {
        const t = setTimeout(() => setShowVeil(false), 10000)
        return () => clearTimeout(t)
    }, [])
    /* v13.30 — Veil hide:
       · Si authStatus="anon" (no logueado, no hay splash) → ocultar
         de inmediato para que el SignInGate sea visible.
       · Si el splash disparó y luego se ocultó (showSplash=false
         con splashShownRef.current=true), esperar 500ms (cubre el
         exit anim del splash) y ocultar el veil. */
    useEffect(() => {
        if (authStatus === "anon") {
            setShowVeil(false)
        }
    }, [authStatus])
    useEffect(() => {
        if (showSplash) return
        if (!splashShownRef.current) return
        const t = setTimeout(() => setShowVeil(false), 500)
        return () => clearTimeout(t)
    }, [showSplash])
    /* suppressGate: oculta el gate mientras Auth2Modal está abierto. */
    useEffect(() => {
        if (authModal.isOpen) {
            setSuppressGate(true)
            return
        }
        const t = setTimeout(() => setSuppressGate(false), 700)
        return () => clearTimeout(t)
    }, [authModal.isOpen])
    const isAuthed = authStatus === "authed"
    /* v13.1 — Notificar al shell externo (AppNavegacionMobile) cuando
       el authStatus cambia, para que pueda mostrar/ocultar su nav según
       hay sesión o no. */
    useEffect(() => {
        if (onAuthChange) onAuthChange(isAuthed)
    }, [isAuthed, onAuthChange])
    /* v13.40 — Initial scores hidratan del cache si están disponibles.
       Evita el flicker "... → 89%" al cargar. v13.40.1 — `initialRadarCache`
       se declara aquí (era una sola declaración más abajo en línea 1112,
       pero los useState de cycleScanned y scores la leían arriba causando
       Temporal Dead Zone → crash → pantalla negra). */
    const initialRadarCache = readRadarCache(clerkUserId)
    const [scores, setScores] = useState<Scores>(
        initialRadarCache?.scores ?? {
            fisico: null,
            mental: null,
            emocional: null,
            financiero: null,
            vector: null,
            orbita: null,
        }
    )
    const [pillarTs, setPillarTs] = useState<Timestamps>({
        fisico: null,
        mental: null,
        emocional: null,
        financiero: null,
        vector: null,
        orbita: null,
    })
    const [mainView, setMainView] = useState<MainView>(() => {
        /* v13.3 — Cuando el shell oculta su Dock interno (NavegadorEstacion
           desktop hace de nav top), el hash de la URL decide la vista
           inicial. /escaner#protocolos arranca en modulos, /escaner#decodificador
           en decoder, todo lo demás cae a radar. En modo standalone
           (sin hideInternalDock), seguimos en "radar" como siempre. */
        if (typeof window === "undefined" || !hideInternalDock) return "radar"
        const h = (window.location.hash || "").toLowerCase().replace(/^#/, "")
        if (h === "protocolos" || h === "modulos") return "modulos"
        if (h === "decodificador") return "decodificador"
        return "radar"
    })
    /* v13.15 — effectiveView: durante el render, si el shell externo
       controla la vista (controlledMainView set), usamos ese valor
       directamente sin esperar al useEffect. Esto elimina el flash de
       la vista anterior cuando vienes de Holoteca/Núcleo y picas
       Decodificador (antes el useEffect actualizaba mainView un frame
       después del re-show, mostrando brevemente Protocolos). */
    const effectiveView: MainView =
        controlledMainView !== undefined ? controlledMainView : mainView
    const [subView, setSubView] = useState<SubView>("radar-main")
    const [activePillar, setActivePillar] = useState<PillarId | null>(null)
    /* `loaded` declarado más arriba (junto con showVeil/splashMinReached)
       para que los useEffects del splash hide lo lean sin error de
       inicialización. */
    const [isProc, setIsProc] = useState(false)
    /* v13.1 — Notificar isProc al shell externo (AppNavegacionMobile)
       para que oculte su bottom nav durante ProcessingAnim/FrecuenciaAnclada,
       igual que el Dock interno. */
    useEffect(() => {
        if (onProcChange) onProcChange(isProc)
    }, [isProc, onProcChange])
    const [dbProtos, setDbProtos] = useState<DBProtocol[]>([])
    /* v13.45 — libreriaProtos: la tabla libreria_protocolos completa
       (filtrada is_active=true). Se carga una sola vez al mount y se
       pasa a ModulosView para derivar runtime las calibraciones
       visibles según el score de cada pilar. */
    const [libreriaProtos, setLibreriaProtos] = useState<any[]>([])
    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) return
        let cancelled = false
        ;(async () => {
            try {
                /* Contenido de Calibraciones por gateway member-gated
                   (get_libreria_protocolos): solo Sintonía/Inmersión reciben
                   el contenido; invitado → []. Fallback transitorio a la
                   lectura directa hasta el lock post-build. */
                let rows = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_libreria_protocolos",
                    {}
                )
                if (rows == null) {
                    rows = await sbGet(
                        supabaseUrl,
                        supabaseAnonKey,
                        "libreria_protocolos",
                        "is_active=eq.true&select=id,pilar,fase,score_min,score_max,titulo,descripcion_corta,alerta_text,sugerencia_text,tareas_json,is_active&order=pilar.asc,fase.asc"
                    )
                }
                if (cancelled) return
                if (Array.isArray(rows)) setLibreriaProtos(rows)
            } catch {}
        })()
        return () => {
            cancelled = true
        }
    }, [supabaseUrl, supabaseAnonKey])
    const [dbSondas, setDbSondas] = useState<Record<string, SondaQ[]>>({})
    const [scanHistory, setScanHistory] = useState<ScanEntry[]>([])
    const [showNodoCero, setShowNodoCero] = useState(false)
    type FreemiumGateKind = "sintonia" | "decoder" | "protocolos" | "dream"
    const [freemiumGate, setFreemiumGate] = useState<null | {
        kind: FreemiumGateKind
        pillarLabel?: string
        /* v13.31 — Etiqueta del countdown del próximo escaneo
           (ej. "5d 12h"). Se setea cuando el gate sintonia se
           dispara desde un pilar bloqueado en cooldown global. */
        cooldownLabel?: string
        /* Muro del Decodificador en modo invitación suave (no
           bloqueante) + disparos restantes. soft=true cuando el
           invitado aún tiene disparos tras un escaneo. */
        soft?: boolean
        shotsRemaining?: number
    }>(null)
    /* v13.5 — Gate de identificación de nodo unificado. Se levanta
       cuando un invitado intenta escribir su primera geometría
       (touch a una respuesta de sonda) tanto en mobile como desktop.
       Render: bottom sheet en mobile, fullscreen en desktop — el copy
       y la lógica son uno solo.
       v13.8 — authGateContext muta el subtítulo del modal según el
       trigger: "sonda" (default) usa el copy de telemetría hexagonal;
       "decoder" usa el copy del motor cuántico + 3 pulsos de cortesía. */
    type AuthGateContext = "sonda" | "decoder"
    const [authGate, setAuthGate] = useState<boolean>(false)
    const [authGateContext, setAuthGateContext] =
        useState<AuthGateContext>("sonda")
    const triggerAuthGate = useCallback((context: AuthGateContext) => {
        setAuthGateContext(context)
        setAuthGate(true)
        /* v13.11 — Marcar que el gate fue el origen de este auth flow.
           El splash post-login lo lee para saltarse a sí mismo y NO
           desmontar el contexto (cámara abierta, foto cargada, etc.). */
        gateAuthTriggeredRef.current = true
    }, [])
    /* Cuando el tripulante ancla sesión (Auth2Modal completa el
       flujo), authStatus pasa a "authed" y bajamos el gate. */
    useEffect(() => {
        if (authGate && authStatus === "authed") {
            setAuthGate(false)
        }
    }, [authGate, authStatus])
    /* v13.7 — Notificar al shell externo (AppNavegacionMobile) cuando
       el gate cambia de estado, para que oculte su bottom nav. */
    useEffect(() => {
        if (onAuthGateChange) onAuthGateChange(authGate)
    }, [authGate, onAuthGateChange])
    /* v13.7 — Custom event para que cualquier shell externo pueda
       pedir al Escáner que levante el gate (ej: AppNavegacionMobile
       cuando un invitado pica Núcleo desde la bottom nav). */
    useEffect(() => {
        if (typeof window === "undefined") return
        const handler = () => {
            if (!isAuthed) {
                setAuthGate(true)
                gateAuthTriggeredRef.current = true
            }
        }
        window.addEventListener("rsv-request-auth-gate", handler)
        return () =>
            window.removeEventListener("rsv-request-auth-gate", handler)
    }, [isAuthed])
    const [moduloDetail, setModuloDetail] = useState<string | null>(null)
    /* v13.39/13.40 — Initial state hidrata desde cache localStorage. Si
       hay datos válidos (cooldown no expirado), los pilares ya
       aparecen dorados al primer render en lugar de saltar de cyan
       a dorado tras la fetch. v13.40 — extendido para hidratar
       también `scores` (los porcentajes que aparecen junto a cada
       pilar). v13.40.1 — `initialRadarCache` se declara arriba
       junto al useState de scores (era una declaración duplicada
       aquí que causaba TDZ al usarla más arriba). */
    const [lastCycleTs, setLastCycleTs] = useState<number | null>(
        initialRadarCache?.lastCycleTs ?? null
    )
    const [cycleScanned, setCycleScanned] = useState<Set<PillarId>>(
        initialRadarCache
            ? new Set(initialRadarCache.scanned)
            : new Set()
    )
    /* v13.39/13.40 — Persistir cycleScanned + lastCycleTs + scores al
       cache cada vez que cambien. La próxima monta entra ya con la
       foto correcta. */
    useEffect(() => {
        writeRadarCache(clerkUserId, cycleScanned, lastCycleTs, scores)
    }, [clerkUserId, cycleScanned, lastCycleTs, scores])
    const [ignitionPulse, setIgnitionPulse] = useState<{
        pillar: PillarId
        ts: number
    } | null>(null)
    const [resonancePulseKey, setResonancePulseKey] = useState<number>(0)
    /* ceremonyKey — timestamp transitorio del sello 6/6 que dispara la
       ceremonia "Materialización del Índice de Luz". Default 0 y NUNCA se
       restaura de cache/localStorage → imposible re-disparar en reload.
       Solo se setea dentro de if(finalCycle.size===6). onDone lo vuelve a 0. */
    const [ceremonyKey, setCeremonyKey] = useState<number>(0)
    /* paddingView demorado: al entrar al decodificador reduce el padding
       320ms después del cambio de mainView (justo cuando el exit del
       radar terminó). Evita el "bajón" del radar antes de desaparecer. */
    const [paddingView, setPaddingView] = useState<MainView>(mainView)
    useEffect(() => {
        if (effectiveView === "decodificador") {
            const t = setTimeout(() => setPaddingView("decodificador"), 320)
            return () => clearTimeout(t)
        }
        setPaddingView(effectiveView)
    }, [effectiveView])
    /* v13.1 — Cuando el shell externo (AppNavegacionMobile) cambia la
       tab activa, sincronizamos mainView para que toda la maquinaria
       interna (paddingView, AnimatePresence, handlers) responda al
       cambio. Si controlledMainView es undefined, el state interno
       maneja todo (modo standalone para desktop).
       v13.14 — useLayoutEffect (en lugar de useEffect) sincroniza
       mainView ANTES del primer paint. Sin esto, al volver de Holoteca
       a Decodificador, el Escáner se mostraba 1 frame con la vista
       anterior (Protocolos) antes de que el useEffect actualizara
       mainView, causando el flash que el tripulante reportaba. */
    useLayoutEffect(() => {
        if (controlledMainView !== undefined && controlledMainView !== mainView) {
            setMainView(controlledMainView)
        }
    }, [controlledMainView])
    /* v13.7 — Cuando el Dock interno está oculto (desktop con
       NavegadorEstacion v4 haciendo de nav top), el hash de la URL
       conmuta mainView. Escuchamos hashchange (browser nativo),
       rsv-navigate (pushState SPA del router de Domo) y popstate
       (navegación back/forward). Cualquiera de los tres dispara
       apply() que relee window.location.hash y conmuta mainView con
       las side-effects que hacía el Dock (reset subView/activePillar
       al volver a radar, limpiar moduloDetail al salir de modulos). */
    useEffect(() => {
        if (!hideInternalDock || typeof window === "undefined") return
        if (controlledMainView !== undefined) return
        const apply = () => {
            const h = (window.location.hash || "")
                .toLowerCase()
                .replace(/^#/, "")
            let target: MainView = "radar"
            if (h === "protocolos" || h === "modulos") target = "modulos"
            else if (h === "decodificador") target = "decodificador"
            else target = "radar"
            setMainView((prev) => {
                if (prev === target) return prev
                if (target === "radar") {
                    setSubView("radar-main")
                    setActivePillar(null)
                }
                if (target !== "modulos") setModuloDetail(null)
                return target
            })
        }
        window.addEventListener("hashchange", apply)
        window.addEventListener("rsv-navigate", apply)
        window.addEventListener("popstate", apply)
        return () => {
            window.removeEventListener("hashchange", apply)
            window.removeEventListener("rsv-navigate", apply)
            window.removeEventListener("popstate", apply)
        }
    }, [hideInternalDock, controlledMainView])
    const needsSaveRef = useRef(false)
    const lastLoadClerkRef = useRef<string>("")
    const sb = supabaseUrl && supabaseAnonKey
    const inSonda = effectiveView === "radar" && subView === "sonda" && !isProc
    const showDockBack = inSonda
    const isGlobalCooldown =
        lastCycleTs !== null && (Date.now() - lastCycleTs) / 1000 < COOLDOWN_SEC
    const isPillarScannedThisCycle = (id: PillarId) => cycleScanned.has(id)

    const loadData = useCallback(async () => {
        if (!supabaseUrl || !supabaseAnonKey) {
            setCycleScanned(new Set())
            setScanResolved(true)
            setLoaded(true)
            return
        }
        const resolvedUid =
            clerkUserId ||
            (typeof window !== "undefined" &&
                (window as any).Clerk?.user?.id) ||
            ""
        lastLoadClerkRef.current = resolvedUid
        try {
            /* 1) Sondas — públicas, siempre cargan. */
            const allSondas = await sbGet(
                supabaseUrl,
                supabaseAnonKey,
                "sondas_config",
                "is_active=eq.true&order=step_order.asc"
            )
            if (allSondas && Array.isArray(allSondas) && allSondas.length > 0) {
                const sMap: Record<string, SondaQ[]> = {}
                for (const r of allSondas) {
                    const pilar = r.pilar as string
                    if (!sMap[pilar]) sMap[pilar] = []
                    const opts =
                        typeof r.options_json === "string"
                            ? JSON.parse(r.options_json)
                            : r.options_json
                    sMap[pilar].push({
                        text: r.question_text,
                        options: (Array.isArray(opts) ? opts : []).map(
                            (o: any) => ({ label: o.label, value: o.value })
                        ),
                    })
                }
                setDbSondas(sMap)
            }
            /* 2-4) User data — solo si clerkUserId. */
            if (resolvedUid) {
                const uid = encodeURIComponent(resolvedUid)
                /* ensure_profile via RPC SECURITY DEFINER (bypassa RLS).
                   v12.X — preferredName en unsafeMetadata gana sobre el
                   fullName de Clerk. Si el Tripulante editó su nombre
                   en Mi Núcleo y ese cambio persiste solo en
                   unsafeMetadata.preferredName (porque Clerk rechazó
                   firstName/lastName por validación), ese es el valor
                   que tiene que llegar a profiles.full_name. Sin esta
                   prioridad el RPC sobrescribe el preferredName con el
                   fullName legacy en cada login y el cambio del
                   Tripulante "se deshace solo". */
                try {
                    const clerkLive =
                        typeof window !== "undefined"
                            ? (window as any).Clerk?.user
                            : null
                    if (clerkLive) {
                        const emailRaw =
                            clerkLive.primaryEmailAddress?.emailAddress || ""
                        const email = emailRaw.toLowerCase().trim()
                        const preferredName =
                            (clerkLive.unsafeMetadata as any)
                                ?.preferredName || ""
                        const fullName =
                            preferredName ||
                            clerkLive.fullName ||
                            [clerkLive.firstName, clerkLive.lastName]
                                .filter(Boolean)
                                .join(" ")
                        await sbRpc(
                            supabaseUrl,
                            supabaseAnonKey,
                            "ensure_profile",
                            {
                                p_clerk_user_id: resolvedUid,
                                p_email: email,
                                p_full_name: fullName,
                                p_avatar_url: clerkLive.imageUrl || "",
                            }
                        )
                    }
                } catch (e) {
                    console.warn("[EV] ensure_profile error:", e)
                }
                /* ═══ Reconstrucción de estado del Radar (v13.58) ═══
                   UNA sola fuente: el historial completo. El display SIEMPRE
                   parte del ÚLTIMO CICLO COMPLETO (6/6) → esos son los % en
                   cyan ("tu lectura de la semana pasada"). Encima de ese
                   baseline, si hay un ciclo en curso GENUINO (parcial reciente
                   < 7 días), sus pilares escaneados se pintan DORADOS con su
                   valor nuevo. Nunca se hereda una fila parcial como estado
                   actual (ese era el bug). cycleScanned sale de la DB, no del
                   localStorage → adiós desync del N/6. */
                const allRows = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_scan_history",
                    { p_limit: 120 }
                )
                const pillarKeys: PillarId[] = [
                    "fisico",
                    "mental",
                    "emocional",
                    "financiero",
                    "vector",
                    "orbita",
                ]
                const ALL_NULL: Scores = {
                    fisico: null,
                    mental: null,
                    emocional: null,
                    financiero: null,
                    vector: null,
                    orbita: null,
                }
                const scoresFromRow = (r: any): Scores => ({
                    fisico: r.hardware_fisico ?? null,
                    mental: r.procesador_mental ?? null,
                    emocional: r.motor_emocional ?? null,
                    financiero: r.gravedad_financiera ?? null,
                    vector: r.vector_expansion ?? null,
                    orbita: r.orbita_relacional ?? null,
                })
                const cycleOf = (r: any): PillarId[] => {
                    try {
                        const raw = r?.cycle_scanned_json
                        const arr =
                            typeof raw === "string" ? JSON.parse(raw) : raw
                        return Array.isArray(arr)
                            ? (arr.filter((p: any) =>
                                  pillarKeys.includes(p as PillarId)
                              ) as PillarId[])
                            : []
                    } catch {
                        return []
                    }
                }
                /* "Completo" = ciclo 6/6 marcado, o (filas legacy sin
                   cycle_scanned_json) una lectura con los 6 scores presentes. */
                const isComplete = (r: any): boolean => {
                    if (cycleOf(r).length === 6) return true
                    if (!r?.cycle_scanned_json) {
                        const s = scoresFromRow(r)
                        return pillarKeys.every((p) => s[p] !== null)
                    }
                    return false
                }
                const tsFromRow = (r: any) => ({
                    fisico: r.last_update_fisico
                        ? new Date(r.last_update_fisico).getTime()
                        : 0,
                    mental: r.last_update_mental
                        ? new Date(r.last_update_mental).getTime()
                        : 0,
                    emocional: r.last_update_emocional
                        ? new Date(r.last_update_emocional).getTime()
                        : 0,
                    financiero: r.last_update_financiero
                        ? new Date(r.last_update_financiero).getTime()
                        : 0,
                    vector: r.last_update_vector
                        ? new Date(r.last_update_vector).getTime()
                        : 0,
                    orbita: r.last_update_orbita
                        ? new Date(r.last_update_orbita).getTime()
                        : 0,
                })
                if (allRows && Array.isArray(allRows) && allRows.length > 0) {
                    const now = Date.now()
                    const row0 = allRows[0]
                    const lastComplete = allRows.find((r: any) =>
                        isComplete(r)
                    )
                    const baseline: Scores = lastComplete
                        ? scoresFromRow(lastComplete)
                        : { ...ALL_NULL }
                    const lastCompleteTs = lastComplete
                        ? new Date(lastComplete.created_at).getTime()
                        : 0
                    const cooldownActive =
                        !!lastComplete &&
                        (now - lastCompleteTs) / 1000 < COOLDOWN_SEC
                    if (cooldownActive) {
                        setScores(baseline)
                        setPillarTs(tsFromRow(lastComplete))
                        setCycleScanned(new Set<PillarId>(pillarKeys))
                        setLastCycleTs(lastCompleteTs)
                        saveCycleState(
                            resolvedUid,
                            new Set<PillarId>(pillarKeys),
                            lastCompleteTs
                        )
                    } else {
                        const cyc0 = cycleOf(row0)
                        const row0Ts = new Date(row0.created_at).getTime()
                        const inProgress =
                            cyc0.length >= 1 &&
                            cyc0.length < 6 &&
                            (!lastComplete || row0Ts > lastCompleteTs) &&
                            (now - row0Ts) / 1000 < COOLDOWN_SEC
                        if (inProgress) {
                            const r0 = scoresFromRow(row0)
                            const disp: Scores = { ...baseline }
                            for (const p of cyc0) disp[p] = r0[p]
                            setScores(disp)
                            setPillarTs(tsFromRow(row0))
                            setCycleScanned(new Set<PillarId>(cyc0))
                            setLastCycleTs(null)
                            saveCycleState(
                                resolvedUid,
                                new Set<PillarId>(cyc0)
                            )
                        } else {
                            setScores(baseline)
                            setPillarTs(
                                lastComplete
                                    ? tsFromRow(lastComplete)
                                    : {
                                          fisico: 0,
                                          mental: 0,
                                          emocional: 0,
                                          financiero: 0,
                                          vector: 0,
                                          orbita: 0,
                                      }
                            )
                            setCycleScanned(new Set())
                            setLastCycleTs(null)
                            clearCycleState(resolvedUid)
                        }
                    }
                    const complete = (allRows as ScanEntry[])
                        .filter((e) => isComplete(e))
                        .slice(0, 20)
                        .reverse()
                    setScanHistory(complete)
                } else {
                    setScores({ ...ALL_NULL })
                    setPillarTs({
                        fisico: null,
                        mental: null,
                        emocional: null,
                        financiero: null,
                        vector: null,
                        orbita: null,
                    })
                    setCycleScanned(new Set())
                    setLastCycleTs(null)
                    setScanHistory([])
                }
                /* El fetch del historial ya resolvió (haya o no filas) →
                   el Radar puede decidir si mostrar el hint de "usuario
                   nuevo" sin parpadear durante la hidratación. */
                setScanResolved(true)
                /* Protocolos activos propios por gateway (join embebido
                   server-side). Fallback transitorio hasta el lock. */
                let protosRaw = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_active_protocols",
                    {}
                )
                if (protosRaw == null) {
                    protosRaw = await sbGet(
                        supabaseUrl,
                        supabaseAnonKey,
                        "estado_tripulante_protocolos",
                        `clerk_user_id=eq.${uid}&estado=neq.INTEGRADO&select=*,protocolo:libreria_protocolos(pilar,fase,titulo,descripcion_corta,alerta_text,sugerencia_text,tareas_json)`
                    )
                }
                if (protosRaw && Array.isArray(protosRaw)) {
                    setDbProtos(
                        protosRaw.map((p: any) => {
                            const pr = p.protocolo || {}
                            return {
                                id: p.id,
                                protocolo_id: p.protocolo_id,
                                estado: p.estado,
                                tareas_completadas: Array.isArray(
                                    p.tareas_completadas
                                )
                                    ? p.tareas_completadas
                                    : [],
                                pilar: pr.pilar || "",
                                fase: pr.fase || 1,
                                titulo: pr.titulo || "",
                                descripcion_corta: pr.descripcion_corta || "",
                                alerta_text: pr.alerta_text || "",
                                sugerencia_text: pr.sugerencia_text || "",
                                tareas_json: (() => {
                                    const t = pr.tareas_json || []
                                    return typeof t === "string"
                                        ? JSON.parse(t)
                                        : t
                                })(),
                            }
                        })
                    )
                }
                /* scanHistory (Trayectoria) ya se seteó arriba desde el mismo
                   fetch de historial — no se vuelve a pedir. */
            } else {
                setCycleScanned(new Set())
            }
        } catch (e) {
            console.error("[EV] loadData error:", e)
        }
        needsSaveRef.current = false
        /* Cierre universal: anon (sin resolvedUid → el bloque de scan se
           salta) y cualquier error caen acá. El Radar nunca queda esperando
           scanResolved si loadData terminó. */
        setScanResolved(true)
        setLoaded(true)
    }, [supabaseUrl, supabaseAnonKey, clerkUserId])

    useEffect(() => {
        if (isOpen && !loaded) loadData().catch(() => setLoaded(true))
    }, [isOpen, loaded, loadData])

    /* Polling retry: si Clerk resuelve después del primer loadData,
       re-trigger UNA vez para cargar user data del tripulante. */
    const retryCountRef = useRef(0)
    useEffect(() => {
        if (!isOpen || !loaded) {
            retryCountRef.current = 0
            return
        }
        const hasScores = Object.values(scores).some((v) => v !== null)
        if (hasScores) {
            retryCountRef.current = 0
            return
        }
        if (retryCountRef.current >= 5) return
        const currentClerkNow =
            clerkUserId ||
            (typeof window !== "undefined" &&
                (window as any).Clerk?.user?.id) ||
            ""
        if (currentClerkNow && currentClerkNow !== lastLoadClerkRef.current) {
            lastLoadClerkRef.current = currentClerkNow
            retryCountRef.current = 0
            setScanResolved(false)
            setLoaded(false)
            return
        }
        if (currentClerkNow) {
            retryCountRef.current = 0
            return
        }
        const timer = setTimeout(() => {
            const currentClerk =
                clerkUserId ||
                (typeof window !== "undefined" &&
                    (window as any).Clerk?.user?.id) ||
                ""
            if (currentClerk && supabaseUrl && supabaseAnonKey) {
                retryCountRef.current++
                lastLoadClerkRef.current = currentClerk
                setScanResolved(false)
                setLoaded(false)
            } else {
                retryCountRef.current++
            }
        }, 800)
        return () => clearTimeout(timer)
    })

    useEffect(() => {
        if (isOpen) {
            setShowSplash(false)
            splashShownRef.current = false
            setAuthStatus(readAuthStatus())
            /* v13.5 — Respetar el hash de la URL cuando el Escáner monta
               desde otra ruta (ej. /origen → click PROTOCOLOS lleva a
               /escaner#protocolos). Sin esto, el reset bloque pisa el
               hash y el tripulante cae en radar aunque pidió modulos. */
            const hashStartView: MainView = (() => {
                if (!hideInternalDock || typeof window === "undefined")
                    return "radar"
                const h = (window.location.hash || "")
                    .toLowerCase()
                    .replace(/^#/, "")
                if (h === "protocolos" || h === "modulos") return "modulos"
                if (h === "decodificador") return "decodificador"
                return "radar"
            })()
            setMainView(hashStartView)
            setSubView("radar-main")
            setActivePillar(null)
            setIsProc(false)
            setScanResolved(false)
            setLoaded(false)
            setScores({
                fisico: null,
                mental: null,
                emocional: null,
                financiero: null,
                vector: null,
                orbita: null,
            })
            setPillarTs({
                fisico: null,
                mental: null,
                emocional: null,
                financiero: null,
                vector: null,
                orbita: null,
            })
            setDbProtos([])
            setScanHistory([])
            setLastCycleTs(null)
            setModuloDetail(null)
            needsSaveRef.current = false
        } else {
            splashShownRef.current = false
        }
    }, [isOpen])

    /* Keyboard shortcuts: Esc, Ctrl+Shift+0 (Nodo Cero), arrows. */
    useEffect(() => {
        if (!isOpen) return
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showNodoCero) setShowNodoCero(false)
                else if (subView === "sonda") {
                    setSubView("radar-main")
                    setActivePillar(null)
                } else onClose()
            }
            if (
                (e.ctrlKey || e.metaKey) &&
                e.shiftKey &&
                (e.key === "0" || e.key === ")" || e.code === "Digit0")
            ) {
                e.preventDefault()
                setShowNodoCero(true)
            }
            if (
                (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
                !showSplash &&
                !showNodoCero &&
                !isProc &&
                subView !== "sonda"
            ) {
                e.preventDefault()
                const TO = isMobile ? TAB_ORDER_M : TAB_ORDER_D
                setMainView((prev) => {
                    const ci = TO.indexOf(prev)
                    if (e.key === "ArrowRight") return TO[(ci + 1) % TO.length]
                    else return TO[(ci - 1 + TO.length) % TO.length]
                })
                setModuloDetail(null)
                setSubView("radar-main")
                setActivePillar(null)
            }
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [isOpen, onClose, subView, showNodoCero, showSplash, isProc, isMobile])

    /* Gate persistente: detecta si el invitado ya cerró un ciclo 6/6
       en su historial. Sobrevive refresh y re-hidratación. */
    const hasPriorCompleteCycle = useMemo(() => {
        if (!scanHistory || scanHistory.length === 0) return false
        return scanHistory.some((e: any) => {
            if (!e.cycle_scanned_json) return false
            try {
                const cs =
                    typeof e.cycle_scanned_json === "string"
                        ? JSON.parse(e.cycle_scanned_json)
                        : e.cycle_scanned_json
                return Array.isArray(cs) && cs.length === 6
            } catch {
                return false
            }
        })
    }, [scanHistory])

    const handleNodeClick = useCallback(
        (id: PillarId) => {
            /* v13.32 — Guard contra race condition post-reload. Si
               scanHistory todavía no llegó (loaded=false), el flag
               hasPriorCompleteCycle queda en false por timing y un
               invitado con ciclo previo puede pasar el gate sintonia
               picando rápido tras el refresh. Bloqueamos el click
               silenciosamente hasta que loadData() complete: tras 1-2s
               el usuario re-pica y los gates evalúan con la verdad
               final. Aplica también para suscriptores aunque no lo
               necesiten — es solo un freezeo cortito al primer
               render del Radar. */
            if (!loaded) return
            /* v13.31 — Helper que calcula el countdown del próximo
               escaneo en formato "Xd Yh" / "Xh Ym" / "Mm" para
               pasárselo al gate sintonia. Se basa en lastCycleTs y
               COOLDOWN_SEC. Devuelve "" si no hay cooldown vivo. */
            const buildCooldownLabel = (): string => {
                if (!lastCycleTs) return ""
                const remSec = Math.max(
                    0,
                    COOLDOWN_SEC -
                        Math.floor((Date.now() - lastCycleTs) / 1000)
                )
                if (remSec <= 0) return ""
                const days = Math.floor(remSec / 86400)
                const hours = Math.floor((remSec % 86400) / 3600)
                const mins = Math.floor((remSec % 3600) / 60)
                if (days > 0) return `${days}d ${hours}h`
                if (hours > 0) return `${hours}h ${mins}m`
                return `${mins}m`
            }
            if (!isActiveMember && hasPriorCompleteCycle) {
                setFreemiumGate({
                    kind: "sintonia",
                    cooldownLabel: buildCooldownLabel(),
                })
                return
            }
            if (
                cycleScanned.size === 6 &&
                lastCycleTs &&
                (Date.now() - lastCycleTs) / 1000 >= COOLDOWN_SEC
            ) {
                if (!isActiveMember) {
                    setFreemiumGate({ kind: "sintonia" })
                    return
                }
                setCycleScanned(new Set())
                const uid =
                    clerkUserId ||
                    (typeof window !== "undefined" &&
                        (window as any).Clerk?.user?.id) ||
                    ""
                clearCycleState(uid)
            }
            setActivePillar(id)
            setSubView("sonda")
        },
        [
            lastCycleTs,
            cycleScanned,
            isActiveMember,
            hasPriorCompleteCycle,
            clerkUserId,
            loaded,
        ]
    )

    const handleSondaComplete = useCallback(
        async (score: number) => {
            if (!activePillar) return
            const newScores = { ...scores, [activePillar]: score }
            setScores(newScores)
            setPillarTs((prev) => ({ ...prev, [activePillar]: Date.now() }))
            const newCycleScanned = new Set(cycleScanned)
            newCycleScanned.add(activePillar)
            setCycleScanned(newCycleScanned)
            setIgnitionPulse({ pillar: activePillar, ts: Date.now() })
            const resolvedUid =
                clerkUserId ||
                (typeof window !== "undefined" &&
                    (window as any).Clerk?.user?.id) ||
                ""
            saveCycleState(resolvedUid, newCycleScanned)
            setSubView("radar-main")
            setActivePillar(null)

            if (sb && resolvedUid) {
                const indice = Math.round(
                    Object.values(newScores).reduce((s, v) => s + (v || 0), 0) /
                        6
                )
                const nowIso = new Date().toISOString()
                const tsMap: Record<string, string | null> = {
                    last_update_fisico:
                        activePillar === "fisico"
                            ? nowIso
                            : pillarTs.fisico
                              ? new Date(pillarTs.fisico).toISOString()
                              : null,
                    last_update_mental:
                        activePillar === "mental"
                            ? nowIso
                            : pillarTs.mental
                              ? new Date(pillarTs.mental).toISOString()
                              : null,
                    last_update_emocional:
                        activePillar === "emocional"
                            ? nowIso
                            : pillarTs.emocional
                              ? new Date(pillarTs.emocional).toISOString()
                              : null,
                    last_update_financiero:
                        activePillar === "financiero"
                            ? nowIso
                            : pillarTs.financiero
                              ? new Date(pillarTs.financiero).toISOString()
                              : null,
                    last_update_vector:
                        activePillar === "vector"
                            ? nowIso
                            : pillarTs.vector
                              ? new Date(pillarTs.vector).toISOString()
                              : null,
                    last_update_orbita:
                        activePillar === "orbita"
                            ? nowIso
                            : pillarTs.orbita
                              ? new Date(pillarTs.orbita).toISOString()
                              : null,
                }
                /* Cross-device merge: leemos el último scan en DB y unimos
                   antes de guardar. Guards: skip si scan > 30 min o
                   ciclo 6/6 con cooldown expirado. */
                let finalCycle = newCycleScanned
                try {
                    const latestScan = await userAction(
                        supabaseUrl,
                        supabaseAnonKey,
                        "get_my_scan_history",
                        { p_limit: 1 }
                    )
                    if (latestScan?.[0]?.cycle_scanned_json) {
                        const scanAge =
                            (Date.now() -
                                new Date(latestScan[0].created_at).getTime()) /
                            1000
                        if (scanAge < 1800) {
                            const dbRaw = latestScan[0].cycle_scanned_json
                            const dbPillars: PillarId[] =
                                typeof dbRaw === "string"
                                    ? JSON.parse(dbRaw)
                                    : dbRaw
                            const isExpiredFullCycle =
                                Array.isArray(dbPillars) &&
                                dbPillars.length === 6 &&
                                scanAge >= COOLDOWN_SEC
                            if (
                                Array.isArray(dbPillars) &&
                                dbPillars.length > 0 &&
                                !isExpiredFullCycle
                            ) {
                                const merged = new Set([
                                    ...newCycleScanned,
                                    ...dbPillars,
                                ])
                                if (merged.size > newCycleScanned.size) {
                                    finalCycle = merged
                                    setCycleScanned(merged)
                                    saveCycleState(resolvedUid, merged)
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn("[EV] merge cycle fetch failed:", e)
                }
                const saved = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "save_scan_vibracional",
                    {
                        p_hardware_fisico: newScores.fisico,
                        p_procesador_mental: newScores.mental,
                        p_motor_emocional: newScores.emocional,
                        p_gravedad_financiera: newScores.financiero,
                        p_vector_expansion: newScores.vector ?? 50,
                        p_orbita_relacional: newScores.orbita ?? 50,
                        p_indice_silicio: indice,
                        p_cycle_scanned_json: JSON.stringify([...finalCycle]),
                        p_last_update_fisico: tsMap.last_update_fisico,
                        p_last_update_mental: tsMap.last_update_mental,
                        p_last_update_emocional: tsMap.last_update_emocional,
                        p_last_update_financiero: tsMap.last_update_financiero,
                        p_last_update_vector: tsMap.last_update_vector,
                        p_last_update_orbita: tsMap.last_update_orbita,
                    }
                )
                if (saved) {
                    /* Cooldown solo cuando los 6 pilares están escaneados. */
                    if (finalCycle.size === 6) {
                        const cdTs = Date.now()
                        setLastCycleTs(cdTs)
                        saveCycleState(resolvedUid, finalCycle, cdTs)
                        setResonancePulseKey(cdTs)
                        /* Ceremonia "Materialización del Índice de Luz" —
                           ritual cinematográfico una sola vez al sellar el
                           6º pilar. Mismo cdTs transitorio (no persistido). */
                        setCeremonyKey(cdTs)
                        /* #5 Estados de ánimo — al cerrar el ciclo 6/6 el campo
                           florece: aurora a pantalla completa que acompaña la
                           ceremonia. */
                        fireAuroraBloom()
                        /* v13.20 — fallback de email desde Supabase
                           profiles. dispatchCicloSellado primero lee de
                           Clerk; si por alguna razón window.Clerk.user
                           está vacío en el momento del cierre, usamos
                           el email guardado en profiles como segunda
                           línea de defensa. Sin esto el dispatch fallaba
                           silencioso para el primer tripulante en cerrar
                           ciclo (no llegó el correo CicloSellado). */
                        let fallbackEmail = ""
                        let fallbackFullName = ""
                        try {
                            const profileRow = await userAction(
                                supabaseUrl,
                                supabaseAnonKey,
                                "get_my_profile_basics",
                                {}
                            )
                            if (
                                profileRow &&
                                typeof profileRow === "object"
                            ) {
                                fallbackEmail = profileRow?.email || ""
                                fallbackFullName =
                                    profileRow?.full_name || ""
                            }
                        } catch (profErr) {
                            console.warn(
                                "[EV] profiles fallback fetch failed:",
                                profErr
                            )
                        }
                        try {
                            dispatchCicloSellado({
                                clerkUserId: resolvedUid,
                                cycleTs: cdTs,
                                scores: newScores,
                                indice,
                                fallbackEmail,
                                fallbackFullName,
                                supabaseUrl,
                            })
                        } catch (e) {
                            console.warn(
                                "[EV] dispatchCicloSellado threw:",
                                e
                            )
                        }
                    }
                    const histArr = await userAction(
                        supabaseUrl,
                        supabaseAnonKey,
                        "get_my_scan_history",
                        { p_limit: 120 }
                    )
                    if (histArr && Array.isArray(histArr)) {
                        const complete = histArr
                            .filter((e: ScanEntry) => {
                                if (!e.cycle_scanned_json) return true
                                try {
                                    const cs =
                                        typeof e.cycle_scanned_json === "string"
                                            ? JSON.parse(e.cycle_scanned_json)
                                            : e.cycle_scanned_json
                                    return Array.isArray(cs) && cs.length === 6
                                } catch {
                                    return true
                                }
                            })
                            .slice(0, 20)
                            .reverse()
                        setScanHistory(complete)
                    }
                }
            }
            /* Routing del Enrutador: si score < 50 + miembro activo, asigna
               TODOS los protocolos del pilar cuyo rango sea menor o igual
               al score del Tripulante. Caso 35 %: el protocolo que cubre
               30-40 % se activa Y también todos los anteriores (0-15,
               16-30) — el Tripulante recibe la librería completa de
               protocolos iniciales hasta su nivel actual, no solo el que
               le toca puntualmente. La regla: cualquier protocolo con
               score_min <= score del Tripulante. Saltamos los que ya
               tenga desbloqueados/en progreso/integrados. */
            if (score < 50 && sb && resolvedUid) {
                const pM: Record<PillarId, string> = {
                    fisico: "FISICO",
                    mental: "MENTAL",
                    emocional: "EMOCIONAL",
                    financiero: "FINANCIERO",
                    vector: "VECTOR",
                    orbita: "ORBITA",
                }
                const pilarName = pM[activePillar]
                /* Ruteo del Enrutador por gateway member-gated. Fallback
                   transitorio a lectura directa hasta el lock post-build. */
                let protos = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_libreria_protocolos_for_routing",
                    { p_pilar: pilarName, p_score: score }
                )
                if (protos == null) {
                    protos = await sbGet(
                        supabaseUrl,
                        supabaseAnonKey,
                        "libreria_protocolos",
                        `pilar=eq.${pilarName}&is_active=eq.true&score_min=lte.${score}&order=score_min.asc`
                    )
                }
                if (protos && Array.isArray(protos) && protos.length > 0) {
                    const protoIds = (protos as any[])
                        .map((p: any) => p && p.id)
                        .filter((x: any) => !!x)
                    /* Siembra por gateway (idempotente server-side: inserta
                       solo los que faltan). Fallback transitorio al sembrado
                       directo hasta el lock post-build. */
                    const seeded =
                        protoIds.length > 0
                            ? await userAction(
                                  supabaseUrl,
                                  supabaseAnonKey,
                                  "seed_my_protocols",
                                  { p_protocolo_ids: protoIds }
                              )
                            : { seeded: 0 }
                    if (seeded == null) {
                        const uid = encodeURIComponent(resolvedUid)
                        const existing = await sbGet(
                            supabaseUrl,
                            supabaseAnonKey,
                            "estado_tripulante_protocolos",
                            `clerk_user_id=eq.${uid}&select=protocolo_id,estado`
                        )
                        const existingIds: string[] = Array.isArray(existing)
                            ? existing.map((e: any) =>
                                  String(e.protocolo_id || "")
                              )
                            : []
                        const protosList: any[] = protos as any[]
                        for (let i = 0; i < protosList.length; i++) {
                            const p = protosList[i]
                            if (!p || !p.id) continue
                            if (existingIds.indexOf(String(p.id)) >= 0) continue
                            await sbPost(
                                supabaseUrl,
                                supabaseAnonKey,
                                "estado_tripulante_protocolos",
                                {
                                    clerk_user_id: resolvedUid,
                                    protocolo_id: p.id,
                                    estado: "DESBLOQUEADO",
                                    tareas_completadas: [],
                                }
                            )
                        }
                    }
                }
                /* Protocolos activos propios por gateway (join embebido
                   server-side). Fallback transitorio hasta el lock. */
                let protosRaw = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_my_active_protocols",
                    {}
                )
                if (protosRaw == null) {
                    const uid = encodeURIComponent(resolvedUid)
                    protosRaw = await sbGet(
                        supabaseUrl,
                        supabaseAnonKey,
                        "estado_tripulante_protocolos",
                        `clerk_user_id=eq.${uid}&estado=neq.INTEGRADO&select=*,protocolo:libreria_protocolos(pilar,fase,titulo,descripcion_corta,alerta_text,sugerencia_text,tareas_json)`
                    )
                }
                if (protosRaw && Array.isArray(protosRaw)) {
                    setDbProtos(
                        protosRaw.map((p: any) => {
                            const pr = p.protocolo || {}
                            return {
                                id: p.id,
                                protocolo_id: p.protocolo_id,
                                estado: p.estado,
                                tareas_completadas: Array.isArray(
                                    p.tareas_completadas
                                )
                                    ? p.tareas_completadas
                                    : [],
                                pilar: pr.pilar || "",
                                fase: pr.fase || 1,
                                titulo: pr.titulo || "",
                                descripcion_corta: pr.descripcion_corta || "",
                                alerta_text: pr.alerta_text || "",
                                sugerencia_text: pr.sugerencia_text || "",
                                tareas_json: (() => {
                                    const t = pr.tareas_json || []
                                    return typeof t === "string"
                                        ? JSON.parse(t)
                                        : t
                                })(),
                            }
                        })
                    )
                }
            }
        },
        [
            activePillar,
            scores,
            cycleScanned,
            sb,
            supabaseUrl,
            supabaseAnonKey,
            clerkUserId,
            pillarTs,
        ]
    )

    /* v13.46 — handleToggleTask reescrito como upsert por
       (clerk_user_id, protocolo_id). Recibe el protocolo_id (estable
       desde libreria_protocolos), busca la fila correspondiente en
       estado_tripulante_protocolos y la inserta o actualiza según
       exista o no. Cubre el caso del flujo nuevo (v13.45) donde los
       protocolos se leen directo de la librería sin asignación previa. */
    const handleToggleTask = useCallback(
        async (protocoloId: string, tareaId: string) => {
            const resolvedUid =
                clerkUserId ||
                (typeof window !== "undefined" &&
                    (window as any).Clerk?.user?.id) ||
                ""
            /* Optimistic update: buscamos por protocolo_id en dbProtos.
               Si no existe la fila, la agregamos con id temporal igual
               al protocolo_id (se reemplazará tras el INSERT real).
               Los siguientes toggles seguirán matcheando por
               protocolo_id, así que el id temporal no genera
               inconsistencias en la UI. */
            setDbProtos((prev) => {
                const idx = prev.findIndex(
                    (p) => p.protocolo_id === protocoloId
                )
                if (idx >= 0) {
                    return prev.map((p, i) => {
                        if (i !== idx) return p
                        const tc = Array.isArray(p.tareas_completadas)
                            ? [...p.tareas_completadas]
                            : []
                        const tIdx = tc.indexOf(tareaId)
                        if (tIdx >= 0) tc.splice(tIdx, 1)
                        else tc.push(tareaId)
                        return {
                            ...p,
                            tareas_completadas: tc,
                            estado:
                                tc.length > 0
                                    ? "EN_PROGRESO"
                                    : "DESBLOQUEADO",
                        }
                    })
                }
                /* Protocolo aún no estaba en dbProtos: lo agregamos
                   con la tarea recién marcada. Los demás campos
                   quedan en defaults — el render de la lista igual
                   los lee de libreriaProtos vía buildVisibleProtosForPillar. */
                return [
                    ...prev,
                    {
                        id: protocoloId,
                        protocolo_id: protocoloId,
                        estado: "EN_PROGRESO",
                        tareas_completadas: [tareaId],
                        pilar: "",
                        fase: 0,
                        titulo: "",
                        descripcion_corta: "",
                        alerta_text: "",
                        sugerencia_text: "",
                        tareas_json: [],
                    } as DBProtocol,
                ]
            })
            if (!sb || !resolvedUid) return
            try {
                /* Toggle atómico por gateway (read-modify-write server-side:
                   agrega/quita la tarea y recalcula estado). Fallback
                   transitorio al flujo directo hasta el lock post-build. */
                const toggled = await userAction(
                    supabaseUrl,
                    supabaseAnonKey,
                    "toggle_my_protocol_tarea",
                    { p_protocolo_id: protocoloId, p_tarea_id: tareaId }
                )
                if (toggled == null) {
                    const uidEnc = encodeURIComponent(resolvedUid)
                    const protoEnc = encodeURIComponent(protocoloId)
                    const current = await sbGet(
                        supabaseUrl,
                        supabaseAnonKey,
                        "estado_tripulante_protocolos",
                        `clerk_user_id=eq.${uidEnc}&protocolo_id=eq.${protoEnc}&select=id,tareas_completadas,estado`
                    )
                    if (
                        current &&
                        Array.isArray(current) &&
                        current.length > 0
                    ) {
                        const row = current[0]
                        const tc = Array.isArray(row.tareas_completadas)
                            ? [...row.tareas_completadas]
                            : []
                        const tIdx = tc.indexOf(tareaId)
                        if (tIdx >= 0) tc.splice(tIdx, 1)
                        else tc.push(tareaId)
                        await sbPatch(
                            supabaseUrl,
                            supabaseAnonKey,
                            "estado_tripulante_protocolos",
                            `id=eq.${row.id}`,
                            {
                                tareas_completadas: tc,
                                estado:
                                    tc.length > 0
                                        ? "EN_PROGRESO"
                                        : "DESBLOQUEADO",
                            }
                        )
                    } else {
                        await sbPost(
                            supabaseUrl,
                            supabaseAnonKey,
                            "estado_tripulante_protocolos",
                            {
                                clerk_user_id: resolvedUid,
                                protocolo_id: protocoloId,
                                estado: "EN_PROGRESO",
                                tareas_completadas: [tareaId],
                            }
                        )
                    }
                }
            } catch (err) {
                console.warn("[Calibracion] toggle persist fail:", err)
            }
        },
        [sb, supabaseUrl, supabaseAnonKey, clerkUserId]
    )

    const handleBack = useCallback(() => {
        if (mainView === "modulos" && moduloDetail !== null)
            setModuloDetail(null)
        else {
            setSubView("radar-main")
            setActivePillar(null)
        }
    }, [mainView, moduloDetail])

    /* v13.34 — Cuando el shell mobile oculta el Escáner para mostrar
       Holoteca/Núcleo encima (hideForOverlay=true), reseteamos los
       estados que dejarían UI flotante visible en pantalla:
       moduloDetail (botón Volver portaleado del pilar abierto),
       activePillar y subView (sondas en curso). Sin esto, el portal
       del back persistía detrás del overlay de Holoteca/Núcleo,
       reapareciendo encima del grid de la Holoteca. */
    useEffect(() => {
        if (!hideForOverlay) return
        if (moduloDetail !== null) setModuloDetail(null)
        if (activePillar !== null) setActivePillar(null)
        setSubView("radar-main")
    }, [hideForOverlay])

    const aPillar = activePillar
        ? (() => {
              const base = PILLARS.find((p) => p.id === activePillar)!
              const pK = {
                  fisico: "FISICO",
                  mental: "MENTAL",
                  emocional: "EMOCIONAL",
                  financiero: "FINANCIERO",
                  vector: "VECTOR",
                  orbita: "ORBITA",
              }[activePillar]
              const dbQ = pK && dbSondas[pK]
              return dbQ && dbQ.length > 0 ? { ...base, questions: dbQ } : base
          })()
        : null

    if (typeof document === "undefined") return null

    return createPortal(
        <AnimatePresence>
            {/* v13.30 — Velo negro continuo. Tapa el radar y main
                content debajo desde el mount hasta que: (a) authStatus
                resuelve a "anon" o (b) el splash exit termina (500ms
                después de showSplash=false).
                v13.37 — zIndex 850, deliberadamente debajo del navbar
                global del [CENTRO DE MANDO] (NavegadorEstacion vive
                en z-index 900) y del AuthHeader (max int). El
                componente entero usa createPortal a document.body, así
                que el velo escapaba el stacking context de PageContent
                y competía con el navbar a nivel body — antes con z
                2147483599 lo tapaba y la barra "desaparecía" durante
                la hidratación inicial. Splash queda arriba (z
                2147483600) para el ritual full-screen post-login. */}
            {/* v13.43 — Boot veil (overlay negro full-screen) removido. Parte de la limpieza global de animaciones de loading del Escáner. */}
            {/* Mini loader mientras Clerk hidrata. v13.29 — solo
                aparece si la hidratación tarda más de 1.5s
                (showMiniLoader). Hidrataciones normales nunca lo ven.
                v13.27 — además desactivado completo en flows OAuth/
                signOut (suppressMiniLoaderDot). */}
            {/* v13.43 — Mini loader (puntito cyan pulsante) removido. Parte de la limpieza global de animaciones de loading del Escáner. */}
            {/* v13.43 — Splash post-login removido por completo. La animación legacy (puntito cyan central + halo radial + texto Escáner Vibracional) confundía al Tripulante en flows como /escaner/nucleo y se disparaba sin razón en /escaner/decodificador. Decisión de Zak: erradicar. */}
            {/* v13.5 — Gate fullscreen desktop. Ya no aparece al entry —
                el invitado puede explorar el radar libremente. Se
                levanta SOLO cuando intenta escribir su primera
                geometría (mismo trigger que el bottom sheet mobile). */}
            {isOpen && !showSplash && authGate && !isMobile && !isAuthed && (
                <motion.div
                    key="authgate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: suppressGate ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483646,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: isMobile
                            ? "32px 24px 96px"
                            : "40px 40px 120px",
                        background:
                            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(0,194,255,0.10) 0%, rgba(2,8,24,0.85) 55%, #020818 100%)",
                        backdropFilter: "blur(24px) saturate(140%)",
                        WebkitBackdropFilter: "blur(24px) saturate(140%)",
                        fontFamily: "'Inter',sans-serif",
                        overflow: "hidden",
                        pointerEvents: suppressGate ? "none" : "auto",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 95%)",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,168,67,0.06) 0%, transparent 60%)",
                            pointerEvents: "none",
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            position: "relative",
                            width: isMobile ? 88 : 118,
                            height: isMobile ? 88 : 118,
                            marginBottom: isMobile ? 26 : 36,
                            zIndex: 3,
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 26,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            style={{ position: "absolute", inset: 0 }}
                        >
                            <svg viewBox="0 0 80 80" width="100%" height="100%">
                                <polygon
                                    points="40,2 76,22 76,58 40,78 4,58 4,22"
                                    fill="none"
                                    stroke={accentColor}
                                    strokeWidth="0.6"
                                    strokeDasharray="2 3"
                                    opacity="0.55"
                                />
                            </svg>
                        </motion.div>
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{
                                duration: 34,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            style={{ position: "absolute", inset: "22%" }}
                        >
                            <svg viewBox="0 0 80 80" width="100%" height="100%">
                                <polygon
                                    points="40,6 72,24 72,56 40,74 8,56 8,24"
                                    fill="none"
                                    stroke={GOLD}
                                    strokeWidth="0.6"
                                    opacity="0.42"
                                />
                            </svg>
                        </motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 1.45, 1],
                                opacity: [0.55, 1, 0.55],
                            }}
                            transition={{
                                duration: 2.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%,-50%)",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${accentColor} 0%, ${hx(accentColor, 0.3)} 60%, transparent 100%)`,
                                boxShadow: `0 0 28px ${accentColor}, 0 0 10px ${GOLD}`,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                inset: "-18%",
                                background: `radial-gradient(circle, ${hx(accentColor, 0.12)} 0%, transparent 60%)`,
                                pointerEvents: "none",
                            }}
                        />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.12,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 17 : 24,
                            fontWeight: 100,
                            letterSpacing: isMobile ? "0.28em" : "0.38em",
                            textTransform: "uppercase",
                            color: "#E6F7EF",
                            textAlign: "center",
                            textShadow: `0 0 30px ${hx(accentColor, 0.4)}, 0 0 60px ${hx(accentColor, 0.15)}`,
                            zIndex: 3,
                            padding: "0 16px",
                        }}
                    >
                        Activación de cuenta
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{
                            opacity: 0.55,
                            width: isMobile ? 200 : 280,
                        }}
                        transition={{
                            duration: 0.9,
                            delay: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            height: 1,
                            margin: isMobile ? "14px 0 18px" : "20px 0 26px",
                            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                            zIndex: 3,
                        }}
                    />
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: 300,
                            letterSpacing: "0.1em",
                            color: hx("#E6F7EF", 0.72),
                            textAlign: "center",
                            maxWidth: 420,
                            lineHeight: 1.65,
                            padding: "0 18px",
                            marginBottom: isMobile ? 34 : 42,
                            zIndex: 3,
                        }}
                    >
                        {authGateContext === "decoder" ? (
                            <>
                                El motor cuántico está listo para procesar
                                esta geometría. Ancla tu frecuencia para
                                decodificar esta materia y reclamar tus 3
                                pulsos de diagnóstico de cortesía.
                            </>
                        ) : (
                            <>
                                Ancla tu frecuencia para calibrar tu sistema
                                de telemetría hexagonal y guardar tu Índice
                                de Luz.
                            </>
                        )}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.75,
                            delay: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            width: "100%",
                            maxWidth: isMobile ? 340 : 380,
                            zIndex: 3,
                        }}
                    >
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            whileHover={{
                                borderColor: hx(accentColor, 0.85),
                                boxShadow: `0 10px 36px ${hx(accentColor, 0.34)}, inset 0 1px 0 ${hx("#FFFFFF", 0.2)}`,
                            }}
                            transition={{ duration: 0.25 }}
                            onClick={() => authModalRef.current.open("login")}
                            style={{
                                width: "100%",
                                padding: isMobile ? "16px 20px" : "17px 24px",
                                borderRadius: isMobile ? 14 : 16,
                                background: `linear-gradient(135deg, ${hx(accentColor, 0.32)} 0%, ${hx(accentColor, 0.18)} 50%, ${hx(accentColor, 0.32)} 100%), rgba(8,24,48,0.6)`,
                                border: `1.5px solid ${hx(accentColor, 0.62)}`,
                                color: "#E6F7EF",
                                fontSize: isMobile ? 12 : 13,
                                fontWeight: 500,
                                letterSpacing: "0.26em",
                                textTransform: "uppercase",
                                fontFamily: "'Inter',sans-serif",
                                cursor: "pointer",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                                boxShadow: `0 6px 24px ${hx(accentColor, 0.24)}, inset 0 1px 0 ${hx("#FFFFFF", 0.16)}`,
                                backdropFilter:
                                    "blur(20px) saturate(160%) brightness(1.05)",
                                WebkitBackdropFilter:
                                    "blur(20px) saturate(160%) brightness(1.05)",
                            }}
                        >
                            Iniciar Sesión
                        </motion.button>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            whileHover={{
                                borderColor: hx(accentColor, 0.7),
                                color: "#E6F7EF",
                            }}
                            transition={{ duration: 0.25 }}
                            onClick={() =>
                                authModalRef.current.open("register")
                            }
                            style={{
                                width: "100%",
                                padding: isMobile ? "14px 20px" : "15px 24px",
                                borderRadius: isMobile ? 14 : 16,
                                background: "rgba(8,24,48,0.35)",
                                border: `1px solid ${hx(accentColor, 0.38)}`,
                                color: hx(accentColor, 0.92),
                                fontSize: isMobile ? 11 : 12,
                                fontWeight: 400,
                                letterSpacing: "0.24em",
                                textTransform: "uppercase",
                                fontFamily: "'Inter',sans-serif",
                                cursor: "pointer",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                            }}
                        >
                            Activar
                        </motion.button>
                    </motion.div>
                    <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.58 }}
                        whileHover={{ opacity: 0.9 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.75,
                        }}
                        onClick={() => setAuthGate(false)}
                        style={{
                            position: "absolute",
                            bottom: isMobile ? 34 : 48,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "transparent",
                            border: "none",
                            color: "#E6F7EF",
                            fontSize: 11,
                            letterSpacing: "0.24em",
                            textTransform: "uppercase",
                            fontWeight: 300,
                            cursor: "pointer",
                            fontFamily: "'Inter',sans-serif",
                            padding: "8px 16px",
                            outline: "none",
                            WebkitTapHighlightColor: "transparent",
                            zIndex: 3,
                        }}
                    >
                        Seguir Explorando
                    </motion.button>
                </motion.div>
            )}
            {/* v13.5 — Main overlay con AnimatePresence entre vistas.
                Tanto mobile como desktop dejamos pasar al invitado al
                radar; el gate de identificación (bottom sheet en mobile,
                fullscreen en desktop) se levanta cuando intenta
                escribir su primera geometría. */}
            {isOpen && !showSplash && (
                <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="esc-overlay"
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 10,
                        background: "transparent",
                        /* v13.16 — display:none cuando hideForOverlay para
                           que la ocultación sea instantánea (visibility
                           hidden tardaba 1 frame y mostraba brevemente
                           sub-tabs como Lente Óptico/Códice de Materia
                           al cambiar de Decodificador a Núcleo). React
                           preserva el state interno aunque el wrapper
                           tenga display:none. */
                        display: hideForOverlay ? "none" : "flex",
                        flexDirection: "column",
                        fontFamily: "'Inter',sans-serif",
                        color: "#fff",
                        pointerEvents: hideForOverlay ? "none" : "auto",
                    }}
                >
                    {/* v13.6 — NavRevealPin removido. Antes se montaba
                        en /escaner desktop como atajo para abrir/cerrar
                        el NavegadorEstacion. Ya no aplica: la barra
                        v4 vive siempre visible arriba, no hay nada que
                        revelar. */}
                    <div
                        className="esc-scroll"
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            /* v13.9 — padding-top desktop pasa de 0 a
                               96px para dar aire bajo la NavegadorEstacion
                               (top:0 + pill 64px + 24 de aire). El radar
                               vive con justifyContent:center adentro y
                               se reposiciona al medio del espacio
                               restante.
                               v13.21 — Mobile padding-top pasa de 32 a 8
                               para llevar los títulos de Calibración y
                               Decodificador al top-left, alineados con
                               Holoteca/Núcleo. */
                            padding: isMobile
                                ? `8px 12px ${paddingView === "decodificador" ? 95 : 100}px`
                                : `96px 24px ${paddingView === "decodificador" ? 80 : 100}px`,
                            transition: "padding 0.25s ease",
                            width: "100%",
                        }}
                    >
                        {/* v13.17 — Quitamos AnimatePresence del switch
                            entre vistas (radar/modulos/decodificador/
                            recalibracion). El AnimatePresence con
                            mode="wait" hacía exit fade del view anterior
                            cuando effectiveView cambiaba; al volver de
                            Holoteca/Núcleo + cambiar view, ese fade
                            mostraba el view previo brevemente. Ahora
                            cada view se renderiza condicionalmente y
                            React lo desmonta de inmediato. La
                            animación de aparición se mantiene en cada
                            motion.div via initial/animate. */}
                        <>
                            {effectiveView === "radar" &&
                                subView === "radar-main" && (
                                    <motion.div
                                        key="radar"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                            flex: 1,
                                            minHeight: isMobile
                                                ? 400
                                                : "calc(100vh - 160px)",
                                        }}
                                    >
                                        <Radar
                                            scores={scores}
                                            accent={accentColor}
                                            onNodeClick={handleNodeClick}
                                            pillarTimestamps={pillarTs}
                                            cycleScanned={cycleScanned}
                                            isGlobalCooldown={isGlobalCooldown}
                                            isMobile={isMobile}
                                            ignitionPulse={ignitionPulse}
                                            resonancePulseKey={
                                                resonancePulseKey
                                            }
                                            loaded={loaded}
                                            scanResolved={scanResolved}
                                            lastCycleTs={lastCycleTs}
                                            isActiveMember={isActiveMember}
                                            suppressIndice={ceremonyKey > 0}
                                        />
                                    </motion.div>
                                )}
                            {effectiveView === "radar" &&
                                subView === "sonda" &&
                                aPillar && (
                                    <motion.div
                                        key={`s-${activePillar}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            flex: 1,
                                            alignItems: "stretch",
                                        }}
                                    >
                                        {isGlobalCooldown ? (
                                            <CooldownView
                                                pillar={aPillar}
                                                ts={lastCycleTs!}
                                                accent={accentColor}
                                                onBack={handleBack}
                                            />
                                        ) : isPillarScannedThisCycle(
                                              activePillar!
                                          ) ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 20,
                                                    width: "100%",
                                                    height: isMobile
                                                        ? "calc(100vh - 200px)"
                                                        : "calc(100vh - 160px)",
                                                    textAlign: "center",
                                                    padding: "0 16px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 12,
                                                        background: hx(
                                                            accentColor,
                                                            0.08
                                                        ),
                                                        border: `1px solid ${hx(accentColor, 0.2)}`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        color: hx(
                                                            accentColor,
                                                            0.7
                                                        ),
                                                    }}
                                                >
                                                    {aPillar.icon}
                                                </div>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 15,
                                                        fontWeight: 300,
                                                        color: "rgba(255,255,255,0.4)",
                                                        fontFamily:
                                                            "'Inter',sans-serif",
                                                        lineHeight: 1.8,
                                                    }}
                                                >
                                                    Este pilar ya fue escaneado.
                                                    <br />
                                                    Completa los{" "}
                                                    {6 - cycleScanned.size}{" "}
                                                    restante
                                                    {6 - cycleScanned.size !== 1
                                                        ? "s"
                                                        : ""}
                                                    .
                                                </p>
                                                <button
                                                    onClick={handleBack}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        padding: "12px 20px",
                                                        borderRadius: 10,
                                                        background:
                                                            "rgba(255,255,255,0.03)",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                        color: "rgba(255,255,255,0.4)",
                                                        fontSize: 13,
                                                        cursor: "pointer",
                                                        fontFamily:
                                                            "'Inter',sans-serif",
                                                        outline: "none",
                                                        minHeight: 44,
                                                    }}
                                                >
                                                    <IBack /> Volver
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <Sonda
                                                pillar={aPillar}
                                                accent={accentColor}
                                                onComplete={handleSondaComplete}
                                                onProcChange={setIsProc}
                                                isMobile={isMobile}
                                                onBack={() => {
                                                    setSubView("radar-main")
                                                    setActivePillar(null)
                                                }}
                                                clerkUserId={clerkUserId}
                                                supabaseUrl={supabaseUrl}
                                                supabaseAnonKey={
                                                    supabaseAnonKey
                                                }
                                                isAuthed={isAuthed}
                                                onUnauthedAttempt={() =>
                                                    triggerAuthGate("sonda")
                                                }
                                            />
                                        )}
                                    </motion.div>
                                )}
                            {effectiveView === "modulos" && (
                                <motion.div
                                    key="mod"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        /* v13.18 — flexDirection column +
                                           flex:1 mobile para que el
                                           ModulosView interno (con sus
                                           spacers flex:1.6/3) tome la
                                           altura disponible y los pilares
                                           se centren verticalmente. */
                                        flexDirection: "column",
                                        alignItems: "center",
                                        flex: isMobile ? 1 : undefined,
                                    }}
                                >
                                    <ModulosView
                                        scores={scores}
                                        accent={accentColor}
                                        dbProtos={dbProtos}
                                        /* v13.45 — librería completa
                                           + flag de ciclo cerrado para
                                           el desbloqueo en bloque de
                                           Calibraciones. */
                                        libreriaProtos={libreriaProtos}
                                        /* v13.53 — Calibraciones desbloqueadas
                                           para SIEMPRE una vez que el Tripulante
                                           cerró cualquier ciclo de 6 pilares (no
                                           solo el ciclo en curso). Sin esto, al
                                           abrirse el ciclo de la semana siguiente
                                           cycleScanned se resetea y volvían a
                                           "Sondea un pilar" aunque el miembro ya
                                           hubiera completado un ciclo. */
                                        cycleComplete={
                                            cycleScanned.size === 6 ||
                                            hasPriorCompleteCycle
                                        }
                                        dbLoaded={loaded}
                                        onToggleTask={handleToggleTask}
                                        selectedPillar={moduloDetail}
                                        onSelectPillar={setModuloDetail}
                                        isMobile={isMobile}
                                        isActiveMember={isActiveMember}
                                        onFreemiumBlock={(pillarKey) =>
                                            setFreemiumGate({
                                                kind: "protocolos",
                                                pillarLabel: pillarKey
                                                    ? getPillarLabel(pillarKey)
                                                    : undefined,
                                            })
                                        }
                                        hideForOverlay={hideForOverlay}
                                    />
                                </motion.div>
                            )}
                            {effectiveView === "recalibracion" && (
                                <motion.div
                                    key="rec"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <RecalView
                                        scores={scores}
                                        accent={accentColor}
                                        history={scanHistory}
                                        lastCycleTs={lastCycleTs}
                                        cycleScanned={cycleScanned}
                                        isMobile={isMobile}
                                    />
                                </motion.div>
                            )}
                            {effectiveView === "decodificador" && (
                                <motion.div
                                    key="dec"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <DecoderModule
                                        accent={accentColor}
                                        isMobile={isMobile}
                                        supabaseUrl={supabaseUrl || ""}
                                        supabaseAnonKey={supabaseAnonKey || ""}
                                        clerkUserId={clerkUserId}
                                        hasUnlimitedDecoder={hasDecoderAccess}
                                        isActiveMember={isActiveMember}
                                        hasDreamAccess={hasDreamAccess}
                                        onDreamPaywall={() =>
                                            setFreemiumGate({
                                                kind: "dream",
                                            })
                                        }
                                        onDreamSoftInvite={(
                                            remaining: number
                                        ) =>
                                            setFreemiumGate({
                                                kind: "dream",
                                                soft: true,
                                                shotsRemaining: remaining,
                                            })
                                        }
                                        onFreemiumBlock={() =>
                                            setFreemiumGate({
                                                kind: "decoder",
                                                soft: false,
                                                shotsRemaining: 0,
                                            })
                                        }
                                        onSoftInvite={(remaining: number) =>
                                            setFreemiumGate({
                                                kind: "decoder",
                                                soft: true,
                                                shotsRemaining: remaining,
                                            })
                                        }
                                        linkStripeMembSolar={
                                            linkStripeMembSolar
                                        }
                                        isAuthed={isAuthed}
                                        onUnauthedAttempt={() =>
                                            triggerAuthGate("decoder")
                                        }
                                        authGateOpen={authGate}
                                        hideForOverlay={hideForOverlay}
                                    />
                                </motion.div>
                            )}
                        </>
                    </div>
                    {/* v13.1 — hideInternalDock=true cuando el shell
                        externo (AppNavegacionMobile) controla la nav.
                        Sin él, comportamiento standalone: dock cyan
                        flotante con shimmer fantasma como siempre. */}
                    {!hideInternalDock && (
                        <Dock
                            active={effectiveView}
                            onChange={(v) => {
                                setMainView(v)
                                if (v === "radar") {
                                    setSubView("radar-main")
                                    setActivePillar(null)
                                }
                                if (v !== "modulos") setModuloDetail(null)
                            }}
                            accent={accentColor}
                            inSonda={showDockBack}
                            onBack={handleBack}
                            hidden={isProc}
                            isMobile={isMobile}
                        />
                    )}
                    {/* v13.3 — Cuando el Dock está oculto y el tripulante
                        está dentro de una sonda, montamos un botón
                        flotante "Volver" abajo a la izquierda — la nav
                        top de afuera no tiene back. Replica el patrón
                        del Dock back original: misma frame de cristal,
                        IBack, mismo accent.
                        v13.22 — En mobile el botón se oculta. La BottomNav
                        del shell ya cubre la salida (picar Radar regresa
                        al radar) y antes el botón quedaba detrás de la
                        barra inferior, generando confusión visual. Solo
                        se monta en desktop, donde NavegadorEstacion top
                        no incluye back para sub-vistas. */}
                    <AnimatePresence>
                        {hideInternalDock && showDockBack && !isMobile && (
                            <motion.button
                                key="floating-back"
                                onClick={handleBack}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25 }}
                                style={{
                                    position: "fixed",
                                    left: isMobile ? 14 : 24,
                                    bottom: isMobile
                                        ? "max(18px, env(safe-area-inset-bottom))"
                                        : 32,
                                    zIndex: 19,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: isMobile ? "8px" : "10px 14px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
                                    backdropFilter: "blur(24px) saturate(160%)",
                                    WebkitBackdropFilter:
                                        "blur(24px) saturate(160%)",
                                    color: "rgba(255,255,255,0.7)",
                                    cursor: "pointer",
                                    outline: "none",
                                    fontFamily: "'Inter',sans-serif",
                                    boxShadow: [
                                        "inset 0 1px 0 rgba(255,255,255,0.12)",
                                        "0 8px 24px rgba(0,0,0,0.4)",
                                    ].join(", "),
                                    minHeight: isMobile ? 36 : 44,
                                    minWidth: isMobile ? 36 : 44,
                                }}
                            >
                                <IBack />
                                {!isMobile && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 400,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Volver
                                    </span>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {showNodoCero && (
                            <NodoCeroCeremony
                                onClose={() => setShowNodoCero(false)}
                            />
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {freemiumGate && (
                            <FreemiumGateModal
                                kind={freemiumGate.kind}
                                pillarLabel={freemiumGate.pillarLabel}
                                cooldownLabel={freemiumGate.cooldownLabel}
                                soft={freemiumGate.soft}
                                shotsRemaining={freemiumGate.shotsRemaining}
                                link={linkStripeMembSolar}
                                onClose={() => setFreemiumGate(null)}
                            />
                        )}
                    </AnimatePresence>
                    {/* Ceremonia "Materialización del Índice de Luz" — ritual
                        cinematográfico al sellar el 6º pilar. Portaleada a
                        document.body, se auto-funde (NO usa AnimatePresence
                        para evitar el gotcha portal+exit). Dedup por
                        key={ceremonyKey}; onDone la vuelve a 0 → unmount. */}
                    {ceremonyKey > 0 &&
                        (() => {
                            const vals = Object.values(scores) as (
                                | number
                                | null
                            )[]
                            const allPresent = vals.every((v) => v !== null)
                            const cIndice = allPresent
                                ? Math.round(
                                      vals.reduce<number>(
                                          (s, v) => s + (v || 0),
                                          0
                                      ) / 6
                                  )
                                : 0
                            const cLevel =
                                cIndice < 40
                                    ? "#FF7878"
                                    : cIndice < 70
                                      ? accentColor
                                      : GOLD
                            let lowId: PillarId = "fisico"
                            let lowV = Infinity
                            ;(
                                [
                                    "fisico",
                                    "mental",
                                    "emocional",
                                    "financiero",
                                    "vector",
                                    "orbita",
                                ] as PillarId[]
                            ).forEach((id) => {
                                const v = scores[id]
                                const s = typeof v === "number" ? v : 100
                                if (s < lowV) {
                                    lowV = s
                                    lowId = id
                                }
                            })
                            const lowLabel =
                                PILLARS.find((p: any) => p.id === lowId)
                                    ?.labelShort ?? ""
                            return (
                                <CeremoniaIndiceLuz
                                    key={ceremonyKey}
                                    scores={scores}
                                    indice={cIndice}
                                    accent={accentColor}
                                    levelColor={cLevel}
                                    lowPillarLabel={lowLabel}
                                    isMobile={isMobile}
                                    onDone={() => setCeremonyKey(0)}
                                />
                            )
                        })()}
                    {/* v13.11 — Bottom Sheet de IDENTIFICACIÓN DE NODO
                        movido afuera del main shell — vive como sibling
                        del AnimatePresence raíz para que su zIndex max
                        gane sobre el wrapper Holoteca/Núcleo (zIndex
                        100, fuera del shell). Antes quedaba enterrado
                        cuando el tripulante venía desde Holoteca. */}
                </motion.div>
            )}
            {/* Bottom Sheet de IDENTIFICACIÓN DE NODO. Sibling del main
                shell — portal directo a body con zIndex 2147483645+
                para garantizar que se vea encima de cualquier overlay
                externo (incluyendo el wrapper Holoteca/Núcleo del
                shell mobile). */}
            {authGate && isMobile && !isAuthed && (
                <motion.div
                    key="mobile-auth-sheet-back"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: suppressGate ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setAuthGate(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483645,
                        background:
                            "radial-gradient(ellipse 70% 55% at 50% 70%, rgba(0,194,255,0.10) 0%, rgba(2,8,24,0.62) 55%, rgba(2,8,24,0.85) 100%)",
                        backdropFilter: "blur(18px) saturate(140%)",
                        WebkitBackdropFilter: "blur(18px) saturate(140%)",
                        pointerEvents: suppressGate ? "none" : "auto",
                    }}
                />
            )}
            {authGate && isMobile && !isAuthed && (
                <motion.div
                    key="mobile-auth-sheet"
                    initial={{ y: "100%" }}
                    animate={{ y: suppressGate ? "100%" : 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 34 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 2147483646,
                        padding:
                            "20px 22px max(28px, env(safe-area-inset-bottom)) 22px",
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        background: `linear-gradient(180deg, rgba(8,24,48,0.96) 0%, rgba(5,16,34,0.98) 100%)`,
                        border: `1px solid ${hx(accentColor, 0.32)}`,
                        borderBottom: "none",
                        backdropFilter:
                            "blur(24px) saturate(160%) brightness(1.05)",
                        WebkitBackdropFilter:
                            "blur(24px) saturate(160%) brightness(1.05)",
                        boxShadow: [
                            `0 -12px 40px ${hx(accentColor, 0.16)}`,
                            `0 -4px 18px rgba(0,0,0,0.5)`,
                            `inset 0 1px 0 ${hx("#FFFFFF", 0.18)}`,
                        ].join(", "),
                        fontFamily: "'Inter',sans-serif",
                        pointerEvents: suppressGate ? "none" : "auto",
                    }}
                >
                    {/* Drag handle */}
                    <div
                        style={{
                            width: 44,
                            height: 4,
                            borderRadius: 999,
                            background: hx(accentColor, 0.35),
                            margin: "0 auto 18px",
                        }}
                    />
                    {/* Botón cerrar (regresa al contexto previo). */}
                    <button
                        type="button"
                        onClick={() => setAuthGate(false)}
                        aria-label="Cerrar"
                        style={{
                            position: "absolute",
                            top: 14,
                            right: 14,
                            width: 30,
                            height: 30,
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 16,
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            outline: "none",
                            fontFamily: "'Inter',sans-serif",
                        }}
                    >
                        ×
                    </button>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 200,
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "#E6F7EF",
                            textAlign: "center",
                            textShadow: `0 0 24px ${hx(accentColor, 0.36)}`,
                        }}
                    >
                        Activación de cuenta
                    </h3>
                    <div
                        style={{
                            height: 1,
                            width: 180,
                            margin: "12px auto 14px",
                            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                            opacity: 0.55,
                        }}
                    />
                    <p
                        style={{
                            margin: "0 auto 22px",
                            maxWidth: 360,
                            fontSize: 12.5,
                            fontWeight: 300,
                            lineHeight: 1.65,
                            letterSpacing: "0.06em",
                            color: hx("#E6F7EF", 0.74),
                            textAlign: "center",
                        }}
                    >
                        {authGateContext === "decoder" ? (
                            <>
                                El motor cuántico está listo para procesar
                                esta geometría. Ancla tu frecuencia para
                                decodificar esta materia y reclamar tus 3
                                pulsos de diagnóstico de cortesía.
                            </>
                        ) : (
                            <>
                                Ancla tu frecuencia para calibrar tu sistema
                                de telemetría hexagonal y guardar tu Índice
                                de Luz.
                            </>
                        )}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                authModalRef.current.open("login")
                            }}
                            style={{
                                width: "100%",
                                padding: "15px 20px",
                                borderRadius: 14,
                                background: `linear-gradient(135deg, ${hx(accentColor, 0.32)} 0%, ${hx(accentColor, 0.18)} 50%, ${hx(accentColor, 0.32)} 100%), rgba(8,24,48,0.6)`,
                                border: `1.5px solid ${hx(accentColor, 0.62)}`,
                                color: "#E6F7EF",
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: "0.26em",
                                textTransform: "uppercase",
                                fontFamily: "'Inter',sans-serif",
                                cursor: "pointer",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                                boxShadow: `0 6px 22px ${hx(accentColor, 0.24)}, inset 0 1px 0 ${hx("#FFFFFF", 0.16)}`,
                                backdropFilter: "blur(20px) saturate(160%)",
                                WebkitBackdropFilter:
                                    "blur(20px) saturate(160%)",
                            }}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                authModalRef.current.open("register")
                            }}
                            style={{
                                width: "100%",
                                padding: "13px 20px",
                                borderRadius: 14,
                                background: "rgba(8,24,48,0.45)",
                                border: `1px solid ${hx(accentColor, 0.4)}`,
                                color: hx(accentColor, 0.92),
                                fontSize: 11,
                                fontWeight: 400,
                                letterSpacing: "0.24em",
                                textTransform: "uppercase",
                                fontFamily: "'Inter',sans-serif",
                                cursor: "pointer",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                            }}
                        >
                            Activar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

addPropertyControls(EscanerVibracional, {
    isOpen: {
        type: ControlType.Boolean,
        title: "Open",
        defaultValue: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#00e5ff",
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
    clerkUserId: {
        type: ControlType.String,
        title: "Clerk User ID",
        defaultValue: "",
    },
    linkStripeMembSolar: {
        type: ControlType.String,
        title: "Stripe · Sintonía Solar",
        defaultValue: "",
    },
})

export default EscanerVibracional
