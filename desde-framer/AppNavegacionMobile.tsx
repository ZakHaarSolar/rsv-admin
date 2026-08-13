// Red Solar Viva — AppNavegacionMobile.tsx v2.75 — Cámara de Anclaje (Códigos Fuente): progreso RE-ANCLADO a HOY (5 jul 2026, 20 % base, +2 %/día, cap 99 %) — se regresó del 99 % porque el contenido aún no está listo. | v2.74 — BottomNav se desvanece durante la revelación inmersiva del Decodificador de Sueños (listener rsv-immersive-on/off, espeja AppShellMobile) | v2.73 — Cámara de Anclaje (Códigos Fuente): progreso re-anclado a HOY (15 % base, +5 %/día, cap 99 %)
// v2.72 — #1 El campo respira contigo: el glow ambiental en reposo de la BottomNav late (esc-breathe-aura CSS) con el tempo + color del Índice de Luz (useLightIndex) — capa detrás de los tabs, no captura toques, no toca la onda táctil #3
// v2.71 — #3 Resonancia táctil: onda de choque desde el punto de contacto al activar un tab NUEVO (fireTouchRipple tras el guard lastActivatedRef → una onda por tab, no por pointermove)
// v2.69 — re-tap DECODIFICADOR → "rsv-decoder-reset" (vuelve al selector Materia | Sueños)
// v2.68 — Card "Simuladores" removida del Holoteca del Escáner
// (decisión Zak 2026-05-08). Navegante de la Red queda accesible
// solo desde la capa Madre /simuladores en web y desktop. La ruta
// /escaner/holoteca/simuladores sigue ruteable vía URL directa para
// preservar deep-links legacy. Cuando lancemos la app dedicada de
// Navegante de la Red la rehidrataremos como app independiente.
// v2.67 — Reversión a v2.64. El v2.65 (force-reflow al mount) y el
// v2.66 (cálculo dinámico de bottom desde visualViewport) no
// resolvieron el bug en PWA standalone, y el v2.66 introdujo un
// regresión visible: subió el nav 62px del visual sin mover los
// hit-areas, dejando un gap entre la imagen y el área picable.
// Diagnóstico definitivo basado en la sesión 2026-05-07: el bug
// afecta también a los pilares del Radar y al resto del documento
// — es un mismatch GLOBAL entre layout y visual viewport en iOS
// PWA standalone bajo el combo `viewport-fit=cover` +
// `apple-mobile-web-app-status-bar-style: black-translucent` del
// bloque PWA v1.1. La solución no está en el nav, sino en el
// header PWA o en una capa CSS global del Domo. Pendiente decidir
// el trade-off (estrellas hasta arriba vs hit-areas alineados) en
// la próxima sesión.
// Estado restaurado: comportamiento idéntico a v2.64 (typo del
// padding corregido + fix del onUp en Brave web). En PWA standalone
// el bug persiste pero sin la regresión visual que introdujo v2.66.
// v2.66 — Cálculo dinámico del bottom-offset para anclar el nav al
// viewport visible en PWA standalone iOS.
// El v2.65 (force-reflow) no destrabó el bug porque no es un cache de
// hit-areas que se invalide con repaint; es la forma en la que iOS
// PWA standalone con `viewport-fit=cover` +
// `apple-mobile-web-app-status-bar-style: black-translucent` calcula
// el contenedor de elementos `position: fixed`. Bajo ese combo, el
// `bottom: 0` se ancla al fondo del lienzo extendido (incluyendo la
// franja del status bar y el home indicator) en lugar del fondo del
// viewport visible. La data DevTools del 2026-05-07 lo confirmó: el
// motion.div externo del nav tenía rect.bottom=936 cuando el visible
// termina en 874 — exactamente 62px abajo, idéntico al
// `visualViewport.offsetTop: -62`.
// Fix: el motion.div se ancla a `bottom: <offset>px` donde offset se
// calcula en tiempo real desde visualViewport como
// `innerHeight - visualViewport.height - visualViewport.offsetTop`.
// En Brave web (no standalone, sin offset) el cálculo da 0 y el
// comportamiento queda igual al actual (donde el fix v2.63 ya
// funciona). En PWA standalone con offsetTop=-62 da 62, exactamente
// lo que falta para subir el nav al visible. Se actualiza con
// resize/visualViewport.resize/visualViewport.scroll.
// v2.65 — Force-reflow al mount del BottomNav para destrabar el quirk
// de iOS PWA standalone con `viewport-fit=cover` +
// `apple-mobile-web-app-status-bar-style: black-translucent`.
// Diagnóstico final basado en captura DevTools desde Safari Inspect del
// 2026-05-07 (PWA standalone iPhone): visualViewport.offsetTop=-62,
// body.height=950 mientras innerH=874. El motion.div externo del nav
// (position fixed; bottom: 0) reportaba rect.bottom=936 — 62px abajo
// del viewport visible (874). iOS PWA standalone con bloque PWA v1.1
// extiende el "layout viewport" detrás del status bar y home
// indicator, y los elementos position:fixed se anclan al bottom del
// layout extendido en el primer paint, no al visible. El área picable
// queda en píxeles físicos que NO existen en pantalla.
// Zak descubrió por casualidad que correr el snippet diagnóstico
// (que insertaba un overlay fixed full-screen con z-index alto y lo
// removía) destrababa el bug temporalmente. Picar un pilar también lo
// destrababa. La causa común: ambos disparan un re-layout completo de
// los elementos fixed, sincronizándolos con el visualViewport. Cerrar
// y reabrir la PWA reinicia al primer paint roto.
// Fix: al mount del BottomNav, insertamos un dummy fixed element de
// 1x1px, leemos su getBoundingClientRect (fuerza layout) y lo
// removemos. Repetimos a 100, 400 y 1500 ms para cubrir el caso donde
// iOS aplica el layout en frames posteriores. Replica exactamente la
// secuencia del snippet diagnóstico que sí destrababa.
// v2.64 — Fix puntual para PWA standalone tras pegar el bloque PWA con
// viewport-fit=cover desde el primer paint (header v1.1 del 2026-05-07).
// El typo del v2.63 destrabó Brave web, pero en PWA seguía pegando: el
// probe DOM mide env(safe-area-inset-bottom) via getComputedStyle, y en
// iOS PWA standalone ese probe puede devolver 0 hasta el primer reflow
// disparado por interacción — `safeBottomPx` queda atrapado en 0 →
// `resolvedBottomPx = 12` → padding-bottom de 12 px que no alcanza para
// escapar los ~34 px del home indicator. El nav queda 22 px dentro de
// la franja inaccesible.
// El fix elimina el camino de medición JS para el padding del wrapper:
// ahora `paddingBottom: "max(12px, env(safe-area-inset-bottom))"` se
// escribe directo en el style. iOS evalúa env() en el flujo CSS normal
// y resuelve el valor real (0 en Brave web, ~34 en PWA standalone) sin
// pasar por probe ni getComputedStyle. Quedan intactos `safeBottomPx`,
// `hitNonce` y el remount-on-change para no romper el resto de la
// lógica que pueda depender de ellos en iteraciones futuras.
// v2.63 — Dos fixes apuntados para el bug del BottomNav que arrastró
// cinco iteraciones (v2.59 → v2.62.2) sin resolverse:
//   (a) Typo confirmado: el motion.div externo del wrapper leía
//       `paddingBottom: resolvedPaddingBottom` pero esa variable nunca
//       existió — la versión definida es `resolvedBottomPx`. React
//       interpretaba `paddingBottom: undefined` como "no aplicar", el
//       wrapper quedaba sin padding-bottom y en PWA standalone iOS
//       (safe-area-inset-bottom ~34px) el rect del nav caía sobre el
//       área del home indicator: visualmente parecía OK por el padding
//       interno del pill, pero el área de hit-test extendía hasta una
//       franja físicamente inaccesible. Confirma exactamente el síntoma
//       reportado ("el área picable está abajo del borde inferior").
//   (b) Cierre del agujero en `onUp` del overlay del pill: cuando el
//       dedo soltaba sobre un tab, el handler entraba en la rama
//       "if (!navTab)" y nunca llamaba a onChange. El cambio de tab
//       dependía exclusivamente de `dragActivate` en pointerdown, que
//       puede ser cancelado por iOS Safari (pointercancel) o por el
//       guard `lastActivatedRef`. Ahora si hay navTab bajo el dedo,
//       el onUp también dispara onChange — segunda oportunidad de
//       cambiar el tab al soltar. Además `findContentTargetAt` ahora
//       descarta elementos que viven dentro del propio pill (los tabs
//       internos tienen role="button", lo que hacía que el .click()
//       programático del cross-component drag les disparara un click
//       sintético con coords (0,0) — visible en la captura de DevTools
//       del 2026-05-07).
// v2.62 — Tres cambios para destrabar el tap-offset persistente del
// BottomNav en PWA standalone iOS (la v2.61 medía pero iOS no
// invalidaba el caché del hit area con re-render normal):
//   (a) El pill se ancla con `bottom: <Npx>` (px crudos) en lugar de
//       `bottom: 0; paddingBottom: env(...)`. Posición estable.
//   (b) `key={bnav-<nonce>}` se bumpea cuando la medición JS detecta
//       cambio en safe-area-inset-bottom → React desmonta y monta el
//       wrapper, iOS lo trata como elemento nuevo y recomputa los hit
//       areas desde cero. Sin esto, iOS conservaba el caché del primer
//       paint durante minutos.
//   (c) Se elimina el `animate y: 20 → 0` del motion.div del wrapper.
//       El transform residual del motion (translate3d que persiste
//       después de la animación) bajaba el hit area unos px del rect
//       visual durante toda la sesión. Solo queda animate opacity.
// v2.61 — BottomNav resuelve env(safe-area-inset-bottom) vía JS al
// montar (probe DOM + getComputedStyle) y aplica el valor como número
// fijo al paddingBottom. Re-medimos en orientationchange/resize. Esto
// destraba el hit-area cacheado al primer paint en PWA standalone iOS:
// antes el Tripulante tenía que picar varios píxeles abajo del botón
// visual durante minutos hasta que iOS recompusiera; ahora el re-render
// tras la medición fuerza a iOS a alinear hit areas con rect visual
// desde el primer toque. Doble medición (inmediata + 240ms + 800ms)
// cubre el caso donde iOS resuelve env() después del primer paint.
// v2.60 — BottomNav: el div interno (la pill con los 5 tabs) suma
// transform:translate3d(0,0,0) + willChange:transform para forzar a
// iOS Safari a mantenerlo en una capa de compositing dedicada. Tras
// pegar el bloque PWA con viewport-fit=cover, Zak reportó que los
// taps caían "2px arriba" del rect visual: el síntoma clásico de
// hit-area cacheado pre-settle de safe-area-inset-bottom. Forzar la
// capa fija el hit testing al rect visual desde el primer frame, así
// el primer toque ya cae donde debería.
// v2.59 — Dos cambios:
//   (a) HOLOTECA mobile · justifyContent del wrapper de cards pasa de
//       "flex-end" a "center". Las tarjetas se anclaban al fondo del
//       viewport y en PWA standalone (con notch + safe-area-inset-top
//       sumando ~50px al título) quedaban demasiado abajo. Centrarlas
//       reparte el aire arriba y abajo y respeta la promesa de "que
//       empiecen desde más arriba" sin esconderlas debajo de la
//       BottomNav.
//   (b) FRAGMENTOS DEL SOL · invertimos el sentido del astrolabio.
//       Antes F2 (siguiente episodio) aparecía a la izquierda de F1
//       y para verlo había que rotar mirando al lado equivocado;
//       ahora F2 sale a la derecha (patrón natural de carrousel
//       iPhone Photos: lo siguiente está a la derecha y viene a
//       focal swipeando LEFT). Cambios: baseAngle pasa de +i·step
//       a -i·step (en useEffect activeIdx + en render); targetRot
//       en finishDrag pasa de FOCAL−idx·step a FOCAL+idx·step;
//       sentido del dir invertido para que swipe LEFT avance al
//       siguiente. Sensitivity sigue negativa (content-follows-finger).
// v2.57 — Object.assign(AppNavegacionMobile, {SimuladoresPublicMobile})
// REMOVIDO por causar "Publishing blocked by 22 blocking errors" en
// Framer (no compatible con addPropertyControls del default export).
// SimuladoresPublicMobile y SimuladoresSelectorCardsOnly siguen
// definidos como funciones internas del archivo (sin exportar) por
// si los necesitamos después; SimuladorCardLarge sigue en uso desde
// SelectorSimuladores. La variante standalone con título grande para
// `/simuladores` raíz queda pendiente de migrar a un Code File propio
// con default export en una próxima iteración.
// v2.56 — `SimuladoresPublicMobile` agregado como sub-componente del
// default export (patrón Object.assign canónico). REVERTIDO en v2.57. Rendere standalone
// el flujo de Simuladores para `/simuladores` raíz pública (entrada
// desde Origen mobile): título grande "SIMULADORES" estilo
// Códices/Meditaciones + `SimuladoresSelectorCardsOnly` (cards
// Navegante + Domo Cero admin). State interno `pick` decide entre
// selector y `SimuladoresShellMobile`. Sin BottomNav del Escáner ni
// prefijo "HOLOTECA · ..." — diferente al sub-tab del Holoteca que
// sí lo lleva. Domo lo consume con `const { SimuladoresPublicMobile }
// = AppNavegacionMobile`.
// v2.55 — Sub-tab "simuladores" estrena el SelectorSimuladores AAA
// en lugar de saltar directo al Navegante. Pantalla full con título
// "HOLOTECA · SIMULADORES" arriba a la izquierda + dos cards
// horizontales grandes (icono glowing + label + descripción + chevron):
// "Navegante de la Red" en cyan público, y "Domo Cero" admin-only
// en morado #A78BFA con badge ADMIN. Picar Navegante entra al
// SimuladoresShellMobile interno; picar Domo Cero ejecuta el handoff
// JWT. State local `simuladorPick` ("selector" | "navegante") decide
// qué render. La BottomNav SÍ se muestra en pantalla selector (deja
// salir a otras partes del Lente) y se oculta cuando entra al
// simulador concreto. La tap-area "HOLOTECA · SIMULADORES" del
// header solo aparece en pantalla selector. Card morada DOMO CERO
// del grid principal de Holoteca quitada — el Tripulante admin
// ahora la elige desde la pantalla nueva del selector. URL canónica
// y mapeo de tabs sin cambios.
// v2.54 — Tarjeta morada "DOMO CERO" agregada a la Holoteca móvil,
// admin-only (useAdminAuth en MI_Shared). Vive como sexta entrada del
// grid debajo de SIMULADORES, con accent #A78BFA y un IconDomoCero
// vectorial (portal interdimensional con dos anillos contra-rotantes,
// círculos de pulso radiales y vesica piscis al centro). Al picarla
// pedimos JWT a Clerk con templates "domo" → "mmsor" → estándar y
// hacemos handoff a `https://domo-client.vercel.app/#token=...` —
// mismo patrón que el shell desktop (RSV_SolarSimuladoresShell). El
// cliente del Domo lee el fragment, lo limpia, y arranca con sesión.
// Card oculta para Tripulantes no-admin.
// v2.53 — Texto "HOLOTECA · SIMULADORES" del SimuladoresShellMobile
// eliminado del DOM. Antes parpadeaba al cambiar entre la consola
// de selección de niveles y el juego activo (la transición de
// opacity 220ms se notaba como "se asoma y desaparece"). La
// tap-area invisible que sigue cubriendo el área top-left para
// regresar a la grid de Holoteca queda intacta — está en el shell
// principal, no en este wrapper.
// Red Solar Viva — AppNavegacionMobile.tsx v2.52
// v2.52 — Tap-area invisible "HOLOTECA · SIMULADORES" se desactiva
// durante naveganteFullscreen. Antes interceptaba clicks del botón ≡
// in-game (top-left, hamburger del HUD del Navegante) y rebotaba al
// grid de Holoteca en lugar de abrir la consola de selección de
// niveles. La tap-area ahora solo vive cuando el título visible está
// activo (sub-tab simuladores con consola/tutorial visible, no en
// pantalla completa de juego).
// v2.51 — SimuladoresShellMobile pasa supabaseUrl/Key al Navegante
// para que el gate Sintonía de Membrana 2+ funcione en mobile (mismo
// hook useMembershipStatus que el desktop). Sin estos props el gate
// queda abierto en mobile y bloqueado en desktop — desincronizado.
// v2.50 — Cámara de Anclaje (Códigos Fuente) con progreso REAL: anchor
// 2026-05-03 al 15 % + 3 % por día (cap 99 %), nodos proporcionales
// (8192 totales, ~246/día), frecuencia base sube en sincronía 624→832 Hz.
// El wobble visual ±0.4 % se queda como respiración ligera sobre el
// piso real para que la barra no quede congelada.
// v2.49.6 — BottomNav escondida desde el momento de entrar a Simuladores
// (no solo durante juego activo). El sub-tab usa pantalla completa
// inmediata: la consola de niveles ya no queda con cards tapadas por
// los 5 botones de la nav inferior.
// v2.49.5 — Re-trigger del watcher tras error transient ServiceNotFound
// del SDK de Framer.
// v2.49.4 — Listener `rsv-navegante-fullscreen` esconde BottomNav y el
// prefijo "HOLOTECA · SIMULADORES" cuando el simulador entra al juego.
// Defensa al cambiar de tab: si activeTab !== "simuladores" reseteamos
// el flag por si el cleanup del simulador no llegó a dispatchar.
// v2.49.3 — Tab "simuladores" agregado a hideForOverlay y al gate del
// portal Holoteca (sin esto TS infería que activeTab nunca podía ser
// "simuladores" en el render del overlay y rechazaba el componente).
// Resuelve los blocking errors del publish.
// v2.49.2 — Grid de Holoteca alineado a flex-end para que las cinco
// cards vivan pegadas a la BottomNav (la quinta sola en su fila ya
// no descompensa el bloque hacia arriba).
// v2.49.1 — Re-trigger del watcher tras paste manual de Navegante.
// v2.49 — Quinta tarjeta SIMULADORES en el grid de la Holoteca con
// IconSimuladores (retícula concéntrica + 4 nodos orbitales pulsantes).
// Sub-tab "simuladores" mapea a /escaner/holoteca/simuladores y monta
// SimuladoresShellMobile, que envuelve a NaveganteDeLaRed con
// forceMobile=true. La tap-area "HOLOTECA · SIMULADORES" devuelve al
// grid principal. Tipo Tab y onNavigate extendidos.
// v2.48.1 — Re-trigger del watcher tras timeout.
// v2.48 — Códigos Fuente estrena la "Cámara de Anclaje". El sub-tab
// dejaba ver sólo el placeholder Próximamente; ahora despliega un
// teatro inmersivo: núcleo cristalino multicapa (estrella de David
// en perspectiva, hexágono externo contra-rotante, tres anillos con
// dasharray animado, vértices pulsantes), nube de partículas
// binarias que viajan desde el borde hacia el núcleo materializando
// el código fuente, mensaje sellado "EN PROCESO DE ANCLAJE" con
// barra de progreso pulsante en loop cíclico, sub-mensaje
// "Próximamente culminará su densificación" y HUD técnico vivo
// (NODOS contador subiendo, FREQ con wobble senoidal, estado
// DENSIFICANDO con dot rojo pulsante). Dos scan lines diagonales
// arriba/abajo cruzan periódicamente el lienzo. Sensación: pantalla
// de boot de una computadora cuántica que ya está procesando aunque
// la capa visible aún no esté lista.
// v2.47 — Dos correcciones críticas:
//   1. El Sol seguía tapando al planeta del FOCAL aunque tuviera
//      zIndex menor — los stacking contexts del Sol y del plano
//      orbital eran distintos (zIndex 50 padre vs zIndex dinámico
//      hijo del plano), así que el zIndex del padre siempre ganaba.
//      Solución: dividir el render de planetas en dos planos
//      hermanos del Sol — los de la mitad trasera de la órbita se
//      pintan ANTES del Sol (DOM order), los de la mitad delantera
//      DESPUÉS. Sin zIndex explícito; el orden DOM define quién
//      pasa encima. Físicamente correcto: el activo abajo siempre
//      cubre parte del Sol.
//   2. Captcha de Google al abrir links de YouTube. window.open con
//      la URL completa watch?v= disparaba "tráfico inusual" en Brave
//      iOS. Ahora normalizamos cualquier YouTube URL a su formato
//      corto canónico youtu.be/<id>: redirige limpio sin captcha y
//      en iOS Safari/Brave abre la app nativa de YouTube vía
//      universal links si está instalada.
// v2.46.1 — Re-trigger del watcher tras timeout.
// v2.46 — Tres ajustes finales al Astrolabio + reproductor:
//   1. Z-index inteligente del Sol. Antes el Sol estaba siempre
//      encima (zIndex 999). Ahora el Sol vive en zIndex 50 y los
//      planetas tienen zIndex dinámico según su profundidad (depth ·
//      100). Resultado: los planetas al frente del observador
//      (norm > 0.5, parte delantera de la órbita) pasan POR ENCIMA
//      del Sol; los que están atrás pasan POR DETRÁS. Físicamente
//      correcto para una elipse en perspectiva 3D.
//   2. Botón YouTube discreto en la esquina superior derecha de la
//      tarjeta materializada. Ícono pequeño con opacidad sutil; al
//      tocarlo abre el episodio directamente en YouTube en una
//      pestaña nueva. Solo se renderiza si el Fragmento tiene
//      youtubeLink configurado.
//   3. El waveform del reproductor inmersivo se aplana cuando el
//      video pausa. Integración con Wistia JS API (window._wq) para
//      escuchar play/pause events. El AudioWaveform recibe la prop
//      isPlaying y, cuando es false, las barras transicionan a una
//      altura mínima estable (~22%) en lugar de seguir animando.
// v2.45.2 — Segundo re-trigger del watcher tras timeout consecutivo.
// v2.45 — Cinco refinamientos a la Arquitectura Astrolabio:
//   1. Planetas reales en lugar de glifos vectoriales generativos.
//      Misma geometría para todos: esferas 3D con sombreado realista
//      (gradiente radial con highlight especular arriba-izquierda,
//      sombra de oclusión abajo-derecha, ring orbital sutil al activo).
//   2. Sol como esfera 3D suprema. El core ahora es una bola con
//      profundidad — gradient radial multi-stop, highlight especular,
//      sombra ecuatorial, hot spot pulsante. Mantiene corona, llamaradas
//      y anillo de plasma. Z-index 10 garantiza que SIEMPRE quede
//      encima de cualquier planeta que pase detrás.
//   3. Tarjeta materializada vuelve a usar la cover image del Fragmento
//      (sólo se quitaron las imágenes de los planetas, no las de la
//      descripción). Glifo vectorial eliminado de la tarjeta.
//   4. Snap direccional sensible: con deslizar ~20% del paso angular
//      (antes 50%) ya salta al siguiente Fragmento en la dirección del
//      gesto. Suelta corta + dirección clara = cambia. Suelta sin
//      dirección = vuelve al activo previo. Más fluído para gestos
//      rápidos del pulgar.
//   5. Waveform del reproductor inmersivo ahora respira con curvas
//      senoidales múltiples superpuestas (bass + mid + treble simulados)
//      vía rAF + refs DOM directos. Cada barra responde a su propia
//      mezcla de frecuencias, dando sensación de audio real reactivo.
//      Nota: el audio real del iframe está bloqueado por CORS — esto es
//      una simulación visual orgánica, no análisis FFT de la pista.
// v2.44 — Pulidos a la Arquitectura Astrolabio:
//   1. Sol Supremo: el círculo plano se reemplaza por un Sol multicapa
//      con corona externa rotante, cuatro llamaradas radiantes que
//      respiran, anillo de plasma y core con highlights internos.
//   2. Glifos vectoriales por Fragmento: las miniaturas raster (cover
//      images) se reemplazan por SVGs generativos únicos por índice
//      (geometría sagrada — polígonos rotantes, anillos concéntricos,
//      símbolo central pulsante), todos en la paleta cyan/dorada.
//   3. Sentido del pan invertido: deslizar el dedo a la derecha mueve
//      el Nodo activo a la derecha (antes hacía lo contrario).
//   4. F1 activo al cargar: la rotación inicial deja al Fragmento 1
//      anclado en el punto focal abajo del Sol.
//   5. Línea de corte superior eliminada (overflow visible + padding
//      arriba) y tarjeta materializada acercada al sistema orbital.
//   6. Reproductor inmersivo: el video se centra verticalmente y
//      arriba/abajo aparecen sellos HUD del estilo terminal RSV
//      (líneas de scan, ID del Fragmento, frecuencia, indicador de
//      transmisión activa).
// v2.43.1 — Re-trigger del watcher tras pérdida del fs.watch event en macOS.
// v2.43 — Fragmentos del Sol estrena la "Arquitectura Astrolabio" en
// el [LENTE]. Sustituye el placeholder Próximamente por un sistema
// orbital rotativo: Sol anclado en el tercio superior, anillo elíptico
// en perspectiva 3D (rotateX 55deg) con los nodos de cada Fragmento,
// pan horizontal del pulgar que hace girar el contenedor entero
// (rotateZ), snap magnético spring al soltar, vibración háptica al
// encajar nuevo Nodo activo, profundidad Z dinámica (los nodos atrás
// caen a opacity 0.3 / scale 0.7). Tarjeta glassmorphism en la mitad
// inferior con thumbnail + título + sinopsis + botón VISUALIZAR
// AHORA. Al activar la visualización, la órbita y la tarjeta se
// desmaterializan y el reproductor inmersivo absorbe el lienzo
// completo. Los items vienen vía nueva prop `fragmentsItems` que
// Domo hidrata desde su buildFragments(fragCovers).
// v2.42 — Tiempo del long-press logout reducido de 2000ms a 1000ms.
// Validado en iPhone real, el sentimiento de los 2s era "como 3";
// 1s da feedback inmediato sin perder el carácter intencional del
// gesto (todavía requiere mantener el dedo casi quieto, distinguible
// de un tap simple).
// v2.41 — El long-press logout ya funciona (validado 2026-05-02 con
// logs en iPhone real, ARMED tras 2002ms). Tres pulidos sobre v2.40:
//   1. Removido el anillo cyan de press-in-progress (era diagnóstico
//      durante v2.39/2.40). El círculo naranja al armar es feedback
//      suficiente.
//   2. Tamaño del círculo armed: 72px → 44px (44x44 con ícono 22x22).
//      Antes lucía sobredimensionado encima de los 64px del tab.
//   3. Posición del círculo dinámicamente anclada al centro del tab
//      Núcleo: leemos `getBoundingClientRect()` del botón cuando el
//      gesto se arma y posicionamos `top` y `left` exactos. Antes
//      usaba `right: 10vw` aproximado, que descuadraba según ancho
//      del viewport.
//   4. Removidos los logs `[bnav]` de diagnóstico ahora que el flujo
//      está validado.
// v2.40 — Movimos los portales del long-press FUERA del wrapper
// AnimatePresence. Ese era el bloqueo del render que escondía el
// círculo aunque el motor estuviera funcionando.
// v2.39 — Tercer intento del long-press logout, con cambio de motor
// del temporizador. Las versiones 2.36/2.37/2.38 confiaban en
// setTimeout(3000) para detectar cuándo se cumplían los 3 segundos.
// En iPhone real el círculo nunca apareció — hipótesis: iOS Safari
// suspende los setTimeout cuando el dedo lleva ~500ms quieto y arranca
// su pipeline de selección/menú contextual nativo, aunque las defensas
// CSS (touch-callout, user-select) hayan bloqueado la UI del menú,
// el throttle del timer queda activado. Cambios fundamentales:
//   1. Reemplazamos setTimeout por un loop de requestAnimationFrame.
//      rAF NO se suspende mientras la página esté visible, así que el
//      tiempo transcurrido sigue avanzando aunque iOS pause los
//      timers de JS.
//   2. Bajamos el umbral a 2 segundos (Zak confirmó que cualquier
//      duración entre 2-3s funciona) — más rápido y menos chance de
//      que iOS interfiera.
//   3. Subimos la tolerancia de movimiento de 12 a 28 pixels — un
//      dedo "quieto" en iPhone tiembla naturalmente más de eso, y
//      la cancelación prematura era otro vector posible del bug.
//   4. Indicador visual del press en progreso desde el primer
//      instante: un anillo cyan pulsante alrededor del tab Núcleo
//      cuando el press está vivo. Aunque el armed (círculo naranja
//      arriba) se demore, el anillo le confirma a Zak que el gesto
//      se detectó. Si el anillo no aparece, sabemos que el bug está
//      en el pointerdown, no en el timer.
//   5. El loop rAF lee coordenadas vivas del último pointermove en
//      ref, así detecta movimiento incluso si los handlers de window
//      cambian. Y el armed se setea desde adentro del loop, sin
//      depender de closure stale.
// v2.37 — Fix del closure stale que evitaba que onMove/onUp leyeran
// el estado armed cuando el setTimeout disparaba a los 3s. Agregamos
// `logoutArmedRef` y `logoutOverTargetRef` paralelos al state, leídos
// directo en los handlers.
// v2.36 — Long-press de 3 segundos en el botón Núcleo de la BottomNav
// dispara un círculo flotante naranja arriba del tab con ícono de
// logout. Si el tripulante arrastra el dedo hasta ese círculo y
// suelta, se cierra sesión. Si suelta antes o se aleja del círculo,
// el gesto se cancela. Doble confirmación implícita: el long-press
// (3s sin moverse) y el drag-to-target (deslizar al círculo).
// Aislamiento: el long-press SOLO se activa para el tab Núcleo.
// Otros tabs siguen con el press-and-drag normal sin cambios.
// v2.35 — Refuerzo del fix de v2.34. El gate `escAuthed` seguía
// bloqueando el render del overlay del Núcleo cuando el polling de
// Clerk no había detectado al usuario al primer render (caso reload
// directo en /escaner/nucleo). MiNucleo internamente YA tiene su
// propio detector de Clerk (`useUser()` + polling de window.Clerk)
// y muestra SignInContent si no hay sesión, así que delegar el gate
// al overlay era redundante y causaba la pantalla negra. Cambios:
//   · Removido `escAuthed` del condicional de render del overlay del
//     Núcleo. Ahora se monta SIEMPRE que activeTab==="nucleo".
//     MiNucleo decide qué mostrar según el estado real de Clerk.
//   · Polling de clerkUserId arranca con un tick INMEDIATO (no espera
//     a los 600ms del primer setInterval) y baja el intervalo a 250ms
//     para detectar la carga de Clerk en hard reload.
//   · `escAuthed` sigue derivado de clerkUserId pero ahora solo se
//     usa para el handler `handleTabChange` (cuando un invitado pica
//     Núcleo desde otra tab → levantar auth gate). Si el usuario ya
//     está EN nucleo, no hay nada que gatear.
// v2.34 — Bug crítico de reload en /escaner/nucleo. Síntoma: hacer
// hard reload (F5) en la ruta del Núcleo del Escáner mostraba pantalla
// negra con solo la BottomNav visible — el contenido del Núcleo no
// montaba y picar Núcleo en la barra inferior no abría modal de auth.
// Cause: el render del overlay del Núcleo gateaba con `escAuthed`
// (callback `onAuthChange` del EscanerVibracional). En la primera carga
// directa del path, `escAuthed` arrancaba en false hasta que el Escáner
// (oculto detrás vía hideForOverlay) reconocía a Clerk.user y disparaba
// el callback — ese ida-y-vuelta podía tardar un segundo o no completarse
// si el render del Escáner no llegaba al effect de auth detection con
// el componente invisible. Mientras tanto el handleTabChange leía
// `escAuthed=false` y al picar Núcleo levantaba el auth gate, que se
// auto-cerraba sin mostrarse porque Clerk YA tenía sesión activa.
// Fix: derivar `escAuthed` de `clerkUserId !== ""` directamente. El
// polling local de Clerk (cada 600ms con seed síncrono al mount) es
// la fuente confiable de auth status — no necesitamos delegar al
// Escáner. Removido el state separado y el callback `onAuthChange`.
// v2.33 — Picar Núcleo en la BottomNav cuando ya estás dentro del
// Núcleo (en Mi Firma, Mis Sesiones, Mis Códices, Trayectoria) ahora
// dispara un evento "rsv-nucleo-reset" que MiNucleo escucha para
// regresar al dashboard de cards. La nav inferior se siente como
// "el botón a la capa madre" — picar Núcleo desde Núcleo NO se
// quedaba en la sub-pantalla, te devuelve al overview.
// v2.32 — Picar Núcleo aterriza en /escaner/nucleo limpio (sin hash
// #mifirma). Removida la inyección de window.history.replaceState con
// "#mifirma" — el sub-tab de Mi Firma queda bajo control de MiNucleo
// vía su default state, no forzado por la nav. La BottomNav también
// se mantiene visible en la ruta del Núcleo del Escáner: el listener
// de readPathTab clasifica /escaner/nucleo como tab "nucleo" y la
// nav sigue renderizando.
// v2.31 — Fix: picar el tab Núcleo en BottomNav escribía solo
// `#mifirma` en el hash sin tocar el path, dejando URLs basura como
// /escaner/holoteca#mifirma cuando el tripulante venía desde Holoteca.
// HOLOTECA_TAB_TO_PATH gana entrada `nucleo: "/escaner/nucleo"` —
// pushPathForTab ahora completa el path canónico y preserva el hash
// #mifirma que handleTabChange ya inyectó. Resultado consistente:
// /escaner/nucleo#mifirma desde cualquier sub-ruta del Escáner.
// v2.30 — Path canónico del Radar /escaner/radar incorporado al
// HOLOTECA_PATH_TO_TAB y HOLOTECA_TAB_TO_PATH. Cuando el tripulante
// pica el tab Radar en BottomNav la URL pasa a /escaner/radar
// (antes /escaner). El alias /escaner sigue funcionando porque el
// shell de Domo lo redirige al canónico.
// v2.29 — Rename del primer tab del [LENTE]: "Escáner" → "Radar".
// La app entera sigue llamándose Escáner Vibracional; "Radar" es la
// pantalla específica del hexágono. Paths canónicos: Calibración
// → /escaner/calibracion, Holoteca + sub-tabs → /escaner/holoteca/<sub>,
// Núcleo → /escaner/nucleo. Slug de Fragmentos acortado:
// /holoteca/fragmentosdelsol → /escaner/holoteca/fragmentos.
// HOLOTECA_PATH_TO_TAB y HOLOTECA_TAB_TO_PATH actualizados para
// ambas familias (canónica + legacy fallback). Fix incidental:
// rsv-signout-complete listener llamaba setActiveTab("escaner") que
// no existía en items; corregido a "radar".
// v2.28 — Hot fix BottomNav: picar el botón Holoteca cuando estabas
// dentro de una sub-tab interna (Códices, Meditaciones, Códigos
// Fuente, Fragmentos del Sol) NO regresaba al grid principal de la
// Holoteca porque dragActivate tenía un guard `if (id !== active)
// onChange(id)` y `active` mostraba "holoteca" como tab iluminado
// (la sub-tab vive lógicamente debajo de Holoteca). El dispatch
// nunca ocurría. Quitamos ese guard — handleTabChange ya hace su
// propia decisión.
// v2.27 — URL sync extendido a Escáner / Calibración con URL propia.
// Antes solo las sub-tabs Holoteca empujaban URL al cambiar; ahora
// el tab Radar escribe /escaner y el tab Calibración escribe
// /calibracion. Decodificador y Núcleo siguen sin URL propia (los
// gestiona la lógica del Escáner / hash #mifirma de Núcleo, sin
// cambios en esta vuelta).
// v2.26 — Routing anidado /holoteca/<sub> con anchor-link survival
//          de Códices, Meditaciones, Códigos Fuente, Fragmentos.
// Las cuatro sub-tabs de Holoteca (Códices, Meditaciones, Códigos
// Fuente, Fragmentos del Sol) ahora tienen URL propia:
//   · /holoteca               → grid principal
//   · /holoteca/codices       → códices (acepta #libro-N)
//   · /holoteca/meditaciones  → meditaciones
//   · /holoteca/codigos       → códigos fuente
//   · /holoteca/fragmentosdelsol → fragmentos
// Al picar una sub-tab la URL se actualiza con pushState; al
// refrescar el tripulante cae en la misma sub-tab. Las URLs viejas
// (/codices, /meditaciones, /fragmentosdelsol) siguen reconocidas
// como aliases — al entrar por uno de ellos, AppNavegacionMobile lo
// promueve silenciosamente a la nueva ruta anidada (compatibilidad
// con anchor links antiguos vía ManyChat).
// Helpers nuevos: HOLOTECA_PATH_TO_TAB, HOLOTECA_TAB_TO_PATH,
// readPathTab(), pushPathForTab(). Listener popstate/rsv-navigate
// para back/forward del browser.
// v2.25 — user-select:none aplicado al wrapper externo y al
// wrapper interno de la BottomNav. Antes los espacios entre tabs
// (padding del contenedor + gap) eran seleccionables por iOS Safari
// al hacer press largo en la orillita. Con esto la barra entera se
// comporta como control nativo, no como texto.
// v2.24 — Key dinámica en EscanerVibracional ("authed"/"anon")
// para que el componente se remonte limpio al cerrar sesión SPA.
// AppNavegacionMobile.tsx v2.23
// v2.23 — Listener "rsv-signout-complete" para volver al tab
// "escaner" cuando MiNucleo cierra sesión SPA-native. Sin esto el
// activeTab quedaba en "nucleo" tras el signOut y MiNucleo seguía
// montado mostrando el SignInContent (resultado funcional pero
// confuso visualmente). Ahora la transición es: pica Cerrar Sesión
// → MiNucleo desmonta → tab Escaner activo → barra inferior
// persiste sin parpadeo (cero reload).
// AppNavegacionMobile.tsx v2.22
// v2.22 — Cross-component drag con listeners globales en window.
// Bug encontrado: cuando un invitado picaba Núcleo, dispatchEvent
// levantaba el gate de identificación, escGateOpen pasaba a true y
// el BottomNav se desmontaba con AnimatePresence (hidden=true). El
// overlay donde vivía el touch tracking dejaba de existir → el
// gesto se cortaba antes de llegar al botón "Iniciar Sesión" del
// gate. Fix: el overlay sólo recibe pointerdown; ahí mismo
// registramos pointermove/up/cancel sobre window. Esos listeners
// sobreviven el desmonte y siguen el dedo hasta soltar.
// AppNavegacionMobile.tsx v2.21
// v2.21 — Cross-component press-and-drag (LO QUE DIEGO EN REALIDAD
// QUERÍA). El gesto arranca con pointerdown sobre un tab de la
// barra inferior → ese tab se activa al instante y la capa
// correspondiente se monta. Sin soltar, el tripulante desliza el
// dedo hacia un elemento clickeable de la capa recién abierta
// (Cerrar Sesión, un pilar del hexágono, una card de Holoteca,
// el botón de cámara del Decodificador, etc). Al soltar sobre ese
// elemento, ejecutamos su .click() programático.
//
// Implementación: el overlay del bottom nav captura implícitamente
// el pointer en pointerdown. Pointermove distingue dos zonas:
//   · sobre la barra → dragActivate cambia tab (igual que v2.20).
//   · fuera de la barra → findContentTargetAt() busca un elemento
//     clickeable bajo el dedo (button, anchor, role=button o
//     [data-drag-target]) y lo guarda en dragTargetRef.
// Pointerup en zona de barra: sólo confirma el tab. Pointerup
// fuera de la barra: target.click() programático.
// Removidos los logs [bnav] que estaban inundando la consola.
// AppNavegacionMobile.tsx v2.20
// v2.20 — Press-and-drag con POINTER EVENTS (touch+mouse+pen
// unificados). Los logs anteriores de Diego (Chrome desktop con
// device emulation) sólo mostraban [bnav] click — esa emulación
// NO dispara touch events reales, sólo simula clicks. Pointer
// events sí se disparan para mouse en desktop, así que ahora Diego
// puede probar el gesto con mouse drag (mantén click + arrastra +
// suelta) en su Chrome y los logs aparecen normales en consola.
// Si funciona con mouse pero NO en touch real del iPhone, sabemos
// que el problema es específico de iOS Safari y no de la lógica.
// AppNavegacionMobile.tsx v2.19
// v2.19 — Press-and-drag refuerzo: convertimos los <button> a
// <div role="button"> con pointerEvents:"none". iOS Safari aplica
// reglas especiales de touch capture a buttons HTML que pueden
// saltarse el overlay encima — divs sin pointer-events los hacen
// completamente "transparentes" al touch. Sumamos console.log
// con prefijo [bnav] en cada touchstart/move/end/cancel/click +
// dragActivate hit/miss para diagnosticar exactamente qué pasa
// si sigue sin funcionar. Diego puede ver los logs filtrando
// "[bnav]" en la consola del browser.
// AppNavegacionMobile.tsx v2.18
// v2.18 — Press-and-drag con OVERLAY de captura. Replica el patrón
// que sí servía en NavegadorLente legacy: el touchstart inicia en
// UN solo elemento (el overlay invisible que cubre los 5 buttons),
// y todos los touchmove/touchend siguientes se entregan a ese mismo
// elemento sin importar qué button esté visualmente debajo del dedo.
// iOS Safari nunca reasigna el target del touch a otro elemento
// distinto al que recibió el touchstart, así que cualquier intento
// de capturar moves desde el div padre / window / setPointerCapture
// fallaba cuando el touchstart aterrizaba en un button hijo. Con el
// overlay (zIndex 5, transparente, touchAction none) el touch inicia
// y se queda en él durante todo el gesto. Hit-test contra los buttons
// hijos via getBoundingClientRect del findTabIdAt — onChange dispara
// para el button debajo. onClick del overlay maneja el caso desktop
// mouse (sin touchstart previo).
// AppNavegacionMobile.tsx v2.17
// v2.17 — Press-and-drag con TODOS los touch handlers en WINDOW
// (antes JSX onTouchStart/Move/End sobre el div padre). El bubble
// desde un button hijo en iOS Safari no llegaba al div padre cuando
// el dedo cruzaba a otro button — iOS captura el touch en el target
// inicial y no lo reasigna. Listeners globales en window reciben
// todos los moves sin importar el target. La detección "estoy
// dragging sobre la nav" se hace en touchstart verificando que
// findTabIdAt() devuelva un tab válido. Mantenemos preventDefault
// con {passive: false}, touch-action none en CSS, y hit-test por
// getBoundingClientRect.
// AppNavegacionMobile.tsx v2.16
// v2.16 — Press-and-drag funcional replicando el patrón legacy de
// NavegadorLente (la hamburguesa vieja que sí servía). Pointer
// events + setPointerCapture no funcionaban en iOS Safari con la
// pila de filter+blur de la BottomNav. Ahora:
//  · onTouchStart/End/Cancel desde JSX (React synthetic).
//  · touchmove registrado a mano con addEventListener({passive:false})
//    para poder llamar e.preventDefault() y evitar que iOS cancele
//    el touch al detectar pan/scroll. React JSX touchmove es passive
//    por default, no sirve.
//  · touchAction:"none" en CSS para reforzar la captura del gesto.
//  · Hit-test sigue por getBoundingClientRect (no elementFromPoint).
// AppNavegacionMobile.tsx v2.15
// v2.15 — Hit-test del drag-to-pick reescrito con
// getBoundingClientRect en lugar de document.elementFromPoint.
// Iteramos los 5 buttons via querySelectorAll(navInnerRef.current,
// "[data-bottom-nav-tab]") y comparamos clientX/Y contra el rect
// de cada uno. elementFromPoint devolvía null o el motion.div hijo
// en iOS Safari con muchas capas de filter+blur sobre la nav, y el
// closest("[data-bottom-nav-tab]") fallaba durante el drag activo.
// El hit-test por rect es predecible, O(N=5), no depende del DOM
// stacking ni de los filtros CSS.
// AppNavegacionMobile.tsx v2.14
// v2.14 — Drag-to-pick reescrito con pointer events + setPointerCapture.
// La versión anterior con onTouchStart/onTouchMove no funcionaba en
// iOS Safari porque cada button capturaba el touch event y el
// onTouchMove del contenedor no recibía updates al cruzar de un
// botón a otro. Ahora pointerdown llama setPointerCapture sobre el
// contenedor → todos los pointer events siguientes van al mismo
// elemento sin importar qué hijo esté debajo del dedo. Sumamos
// touch-action:none al contenedor para que iOS no cancele el gesto
// por interpretarlo como pan/zoom. tap normal sigue intacto: el
// onClick del button se dispara con el click sintético post pointerup
// cuando no hay desplazamiento.
// AppNavegacionMobile.tsx v2.13
// v2.13 — Tres mejoras del Lente:
//  · BottomNav drag-to-pick: al picar y arrastrar entre tabs (sin
//    soltar), cada tab debajo del dedo se activa al instante.
//    onTouchStart/onTouchMove sobre el contenedor + dragActivate()
//    via document.elementFromPoint contra data-bottom-nav-tab.
//  · Tap-area invisible "← HOLOTECA" sobre el título de las cuatro
//    sub-capas (Códices, Meditaciones, Códigos Fuente, Fragmentos
//    del Sol). Al picar, vuelve a la grid principal de Holoteca.
//    Como Códices y Meditaciones son archivos grandes (>300KB / sync
//    manual) y traen su título interno, sobreponemos un button
//    transparente en posición fija — sin tocar los componentes
//    externos.
//  · onTouchEnd reset del lastActivatedRef para no dejar un activate
//    pegado entre interacciones.
// AppNavegacionMobile.tsx v2.12
// v2.12 — Títulos del Lente arrastrados al top-left:
//  · Overlay paddingTop pasa de 32 a 8 para tabs Holoteca/Núcleo/
//    Códigos/Fragmentos (Códices ya estaba en 0).
//  · Códices topPaddingPx pasa de 36 a 8 (alineado con los demás).
//  · El espaciado vertical interno de cada componente lo absorbe
//    su propio layout (Holoteca cards mantienen su centrado vía
//    flex:1 wrapper).
// AppNavegacionMobile.tsx v2.11
// v2.11 — Para Códices el overlay del shell ahora va con
// paddingTop:0 + paddingBottom:0 (antes 32 + 24): la "franja
// vacía" que se veía arriba del scroll era ese paddingTop del
// overlay. Codices ahora absorbe ese aire internamente vía
// topPaddingPx={36} (32 + 4 originales) y su m-scroll usa
// 100dvh para llenar todo el viewport visible real. Resultado:
// el contenido scrollea pegado a los bordes del viewport sin
// franjas residuales.
// AppNavegacionMobile.tsx v2.10
// v2.10 — Cuando activeTab === "codices" el overlay del shell pasa
// a overflowY: hidden. Sin esto el overlay competía por el scroll
// con el m-scroll interno de Códices y iOS Safari no enganchaba el
// momentum del touch en ningún contenedor (síntoma: contenido bajo
// los autores inalcanzable). Ahora el m-scroll de Códices es el
// único scroller activo y el dedo lo encuentra al primer toque.
// AppNavegacionMobile.tsx v2.9
// v2.9 — Pickear el tab Núcleo desde la BottomNav siempre aterriza
// en MI FIRMA: antes de setActiveTab forzamos window.location.hash
// = "#mifirma" para que useHashTab dentro de MiNucleo lea "firma"
// como tab inicial (en vez del default "codices").
// AppNavegacionMobile.tsx v2.8
// v2.8 — Rename: tab "Protocolos" → "Calibración" en BottomNav.
// Códices recibe topPaddingPx 4 (default 70) para alinear su título
// con MI NÚCLEO mobile. Meditaciones ya usa marginTop 4 internamente
// vía el cambio de Meditaciones.tsx v10.
// AppNavegacionMobile.tsx v2.7
// v2.7 — hideForOverlay extendido a los sub-tabs internos (codices,
// meditaciones, codigos, fragmentos): el Escáner detrás se asomaba
// con la vista del último tab, contaminando los placeholders. Ahora
// queda invisible. Frecuencias se monta con bgColor transparent +
// numStars 0 + pageTitleTopOffset 102: se ve el fondo de estrellas
// del Domo y el título "MEDITACIONES" alinea con MI NÚCLEO.
// AppNavegacionMobile.tsx v2.6 — Holoteca mobile: shimmer y doble
// borde restaurados al patrón
// EXACTO del MobileNavCard de Origen (sweep diagonal blur 6 + borde
// interno animate opacity 0.3↔0.7). El radial halo previo se veía
// "más chafa". Entrada también vuelve al fade + translate-y de
// Origen. Las dos filas de tarjetas se separan con rowGap 28 (antes
// 14 de gap unificado) — dan aire entre fila y fila.
// v2.5 — Holoteca cards rediseñadas: shimmer pasa a halo radial que
// respira (sin línea vertical visible) y la animación de entrada baja
// a fade puro (sin translate-y) para evitar lag en mobile. Sub-tabs
// internos: las 4 cards de Holoteca navegan a Códices · Meditaciones
// · Códigos Fuente · Fragmentos COMO TABS DENTRO del shell mobile,
// preservando la BottomNav. Códices y Meditaciones se montan vía sus
// componentes públicos (ArchivoHolograficoLibros y Frecuencias) con
// prop bottomReservePx=92 para subir sus FABs y no chocar con la nav.
// Códigos Fuente y Fragmentos muestran el placeholder Próximamente.
// v2.4 — paddingLeft 0 en título HOLOTECA + version bump pendiente.
// v2.3 — Holoteca: las 4 tarjetas se centran verticalmente en el
// viewport (antes quedaban arriba del todo con espacio negro abajo).
// Wrapper pasa a flex-column con flex:1 + justify-center; el bloque
// de cards usa marginTop:auto/marginBottom:auto para ocupar el
// espacio disponible. Shimmer del HoloCard se transforma en un
// destello diagonal MUY sutil que cubre todo el alto del botón
// (en lugar de la franja horizontal arriba) — así desaparece la
// "línea divisor" que se veía cortar las cards.
// v2.2 — Orden de la BottomNav cambia a Escáner · Protocolos · Holoteca
// · Decodificador · Núcleo (Holoteca y Decodificador intercambiados).
// La Holoteca queda al centro como ancla visual del catálogo, el
// Decodificador a su derecha como herramienta auxiliar.
// AppNavegacionMobile.tsx v2.1
// v2.1 — Título "HOLOTECA" pasa de centrado/grande a barra superior
// alineado a la izquierda y más chico (fontSize 14, padding-left 12,
// whitespace nowrap) — patrón "navigation bar nativa" estilo iOS app.
// Tarjetas usan ahora el cyan suave de Origen (#00C2FF) en lugar del
// cyan eléctrico (#00e5ff) del shell — quedan idénticas a las cards
// de Códices/Meditaciones/Sesiones del Portal de Inducción.
// v2.0 — Holoteca cobra vida. Reemplazamos el placeholder dashed
// circle + "Próximamente" por título "HOLOTECA" con el mismo gradient
// + animación nuc-breath del título "MI NÚCLEO" (alineado a 16px del
// top, idéntica altura visual que Protocolos / Decodificador / Núcleo)
// y cuatro tarjetas holográficas tipo Origen mobile: Códices ·
// Meditaciones · Códigos Fuente · Fragmentos. Las cuatro reusan el
// shimmer + halo doble del MobileNavCard de Origen. Iconos nuevos
// para Códigos Fuente (3 hexágonos = pilares) y Fragmentos (sol
// fragmentado en sectores). Overlay del shell pasa a fondo transparente
// (sin blur) para que el campo de estrellas del Domo se vea de fondo —
// el Escáner debajo se oculta vía hideForOverlay (visibility hidden)
// para no contaminar la vista. Mismo cambio aplica a Núcleo.
// v1.9 — overscrollBehavior: contain en el wrapper del overlay para
// bloquear el rubber-band scroll de iOS/macOS cuando el contenido
// cabe en el viewport. Antes en Códices con 1 libro el dedo podía
// empujar el contenido hacia arriba escondiendo el título.
// v1.4 — Bottom nav se oculta cuando el gate de identificación se
// levanta (escGateOpen), para que los 5 tabs no se vean detrás del
// bottom sheet. Si invitado pica Núcleo desde la nav, levantamos el
// gate vía custom event "rsv-request-auth-gate" en lugar de mostrar
// un overlay vacío de MiNucleo.
// Shell de navegación nativa del [LENTE]. Reemplaza al NavegadorLente
// + hamburguesa legacy con una bottom nav fija de 5 tabs estilo
// app: ESCÁNER · PROTOCOLOS · DECODIFICADOR · HOLOTECA · NÚCLEO.
// v1.2 — Tab id="radar" mantiene su mapping interno con el mainView
// del Escáner (no romper contrato con shell), pero la cara visible
// es "Escáner" con el glifo IEscaner (anillos concéntricos), idéntico
// al que usa la nav del [CENTRO DE MANDO]. Lo hicimos así para que
// el sistema nervioso del tripulante reconozca el mismo símbolo en
// ambas superficies.
//
// El Escáner Vibracional vive siempre montado abajo (preserva ciclo,
// scores, scan history, etc.) controlado externamente vía
// controlledMainView para Radar / Protocolos / Decodificador. Cuando
// el tripulante pasa a Holoteca o Núcleo, AppNavegacionMobile monta
// el componente correspondiente como overlay encima del Escáner. El
// auth gate y splash siguen viviendo dentro del Escáner — la nav
// inferior solo aparece cuando hay sesión activa, replicando la
// regla "auth gate full screen" del Lente actual.
//
// Solo activo en mobile. Desktop sigue usando el Escáner standalone.
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { ControlType, addPropertyControls } from "framer"
import { EscanerVibracional } from "./EscanerVibracional.tsx"
import { MiNucleo } from "./MiNucleo.tsx"
import { ArchivoHolograficoLibros } from "./Codices.tsx"
import { Frecuencias } from "./Meditaciones.tsx"
import NaveganteDeLaRed from "./NaveganteDeLaRed.tsx"
import Shared from "./EV_Shared.tsx"
import Icons from "./EV_Icons.tsx"
import { useAdminAuth } from "./MI_Shared.tsx"
const { hx, GOLD, useIsMobile, fireTouchRipple } = Shared
const { useLightIndex, breathParams, ensureBreatheCss } = Shared
const { IEscaner, IMod, IDecoder, IHoloteca, INucleo } = Icons

/* v2.54 — URL del cliente del Domo Cero. Hardcodeada acá siguiendo el
   patrón hardcode-over-property-control multi-canvas de Framer
   (memoria `feedback_hardcode_over_property_control`): el shell desktop
   ya la consume desde Domo.tsx, replicarla en mobile mantiene los dos
   shells alineados sin obligar a Diego a configurar la URL en cada
   canvas que monte AppNavegacionMobile. */
const DOMO_CLIENT_URL = "https://domo-client.vercel.app/"

type Tab =
    | "radar"
    | "modulos"
    | "decodificador"
    | "holoteca"
    | "nucleo"
    /* v2.5 — Sub-tabs internos accesibles desde Holoteca. No
       aparecen en BottomNav (la nav highlightea "holoteca" como
       parent). Picar Holoteca en BottomNav vuelve al grid de cards.
       v2.49 — "simuladores" suma como quinto sub-tab que monta el
       Navegante de la Red en su rama [LENTE]. */
    | "codices"
    | "meditaciones"
    | "codigos"
    | "fragmentos"
    | "simuladores"

/* ═══ v2.26 — Routing anidado /holoteca/<sub> ═══
   Mapping bidireccional URL ↔ activeTab para que las sub-tabs de
   la Holoteca tengan URL propia. Al picar Códices la URL pasa a
   /holoteca/codices; al refrescar el tripulante cae en la misma
   sub-tab; los anchor links viejos (/codices#libro-7) y los nuevos
   (/holoteca/codices#libro-7) ambos resuelven al tab correcto. */
/* v2.29 — Mapping bidireccional URL ↔ activeTab. Paths canónicos
   bajo /escaner; legacy quedan como fallback durante el split-second
   pre-redirect del Domo. */
const HOLOTECA_PATH_TO_TAB: Record<string, Tab> = {
    /* Canónicos (v4.55 / v4.56 del Domo). */
    "/escaner": "radar",
    "/escaner/radar": "radar",
    "/escaner/calibracion": "modulos",
    "/escaner/holoteca": "holoteca",
    "/escaner/holoteca/codices": "codices",
    "/escaner/holoteca/meditaciones": "meditaciones",
    "/escaner/holoteca/codigos": "codigos",
    "/escaner/holoteca/fragmentos": "fragmentos",
    "/escaner/holoteca/simuladores": "simuladores",
    /* Legacy fallbacks. */
    "/holoteca": "holoteca",
    "/holoteca/codices": "codices",
    "/codices": "codices",
    "/holoteca/meditaciones": "meditaciones",
    "/meditaciones": "meditaciones",
    "/holoteca/codigos": "codigos",
    "/holoteca/fragmentos": "fragmentos",
    "/holoteca/fragmentosdelsol": "fragmentos",
    "/holoteca/simuladores": "simuladores",
    "/fragmentosdelsol": "fragmentos",
    "/calibracion": "modulos",
}
const HOLOTECA_TAB_TO_PATH: Partial<Record<Tab, string>> = {
    /* v2.29 — Empujamos siempre el path canónico al cambiar de tab.
       v2.30 — Radar va a /escaner/radar (canónico tras Domo v4.56). */
    radar: "/escaner/radar",
    modulos: "/escaner/calibracion",
    holoteca: "/escaner/holoteca",
    codices: "/escaner/holoteca/codices",
    meditaciones: "/escaner/holoteca/meditaciones",
    codigos: "/escaner/holoteca/codigos",
    fragmentos: "/escaner/holoteca/fragmentos",
    simuladores: "/escaner/holoteca/simuladores",
    /* v2.31 — Núcleo SÍ escribe path canónico. Sin esto, picar
       Núcleo desde Holoteca dejaba la URL como
       /escaner/holoteca#mifirma (handleTabChange inyectaba el hash
       pero el path no se actualizaba). El hash #mifirma se preserva
       porque pushPathForTab concatena el hash actual al targetPath. */
    nucleo: "/escaner/nucleo",
    /* Decodificador NO escribe URL desde aquí (lo maneja el hash
       #decodificador interno del Escáner). */
}
function readPathTab(): Tab | null {
    if (typeof window === "undefined") return null
    const p =
        window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/"
    return HOLOTECA_PATH_TO_TAB[p] || null
}
function pushPathForTab(tab: Tab) {
    if (typeof window === "undefined") return
    const targetPath = HOLOTECA_TAB_TO_PATH[tab]
    if (!targetPath) return
    const currentPath =
        window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/"
    if (currentPath === targetPath) return
    try {
        window.history.pushState(
            {},
            "",
            targetPath + window.location.search + window.location.hash
        )
        window.dispatchEvent(new CustomEvent("rsv-navigate"))
    } catch {}
}

/* IHoloteca / INucleo / IEscaner viven en EV_Icons.tsx — fuente única
   compartida con la nav del [CENTRO DE MANDO]. */

/* ═══ Iconos vectoriales de las tarjetas Holoteca ═══
   Códices y Meditaciones replican los gráficos de Origen mobile
   (libro abierto + flor de loto). Códigos Fuente y Fragmentos son
   nuevos: 3 hexágonos apilados (símbolo de los pilares del Escáner)
   y un sol fragmentado en sectores radiales (la serie narrativa). */
const IconBookHolo = ({
    color,
    size = 30,
}: {
    color: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hx(color, 0.7)})` }}
    >
        <path d="M8 8 C8 8 18 6 32 12 C46 6 56 8 56 8 L56 50 C56 50 46 48 32 54 C18 48 8 50 8 50 Z" />
        <line x1="32" y1="12" x2="32" y2="54" />
    </svg>
)

const IconLotusHolo = ({
    color,
    size = 30,
}: {
    color: string
    size?: number
}) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${hx(color, 0.7)})` }}
        animate={{ y: [-1, 1, -1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
        <path
            d="M32 12 C26 22 22 32 26 42 C28 46 36 46 38 42 C42 32 38 22 32 12 Z"
            fill={hx(color, 0.15)}
        />
        <path
            d="M20 20 C14 28 10 38 18 44 C22 46 28 44 28 40 C30 34 26 26 20 20 Z"
            fill={hx(color, 0.08)}
        />
        <path
            d="M44 20 C50 28 54 38 46 44 C42 46 36 44 36 40 C34 34 38 26 44 20 Z"
            fill={hx(color, 0.08)}
        />
        <path d="M18 48 C24 50 32 52 32 52 C32 52 40 50 46 48" />
    </motion.svg>
)

/* Tres hexágonos en triada — nube de pilares del Escáner. Cada hexágono
   late con un retardo distinto para evocar la triple frecuencia de los
   pilares (físico/mental/emocional ↔ financiero/vector/órbita). */
const IconCodigosFuente = ({
    color,
    size = 30,
}: {
    color: string
    size?: number
}) => {
    const hexPath = (cx: number, cy: number, r: number) => {
        const pts: string[] = []
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 2
            pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`)
        }
        return `M${pts.join(" L")} Z`
    }
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${hx(color, 0.7)})` }}
        >
            <motion.path
                d={hexPath(32, 16, 9)}
                fill={hx(color, 0.18)}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.path
                d={hexPath(20, 38, 9)}
                fill={hx(color, 0.12)}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.1,
                }}
            />
            <motion.path
                d={hexPath(44, 38, 9)}
                fill={hx(color, 0.12)}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2.2,
                }}
            />
            <line x1="32" y1="22" x2="24" y2="34" opacity={0.55} />
            <line x1="32" y1="22" x2="40" y2="34" opacity={0.55} />
            <line x1="26" y1="40" x2="38" y2="40" opacity={0.55} />
        </svg>
    )
}

/* Sol fragmentado en sectores radiales — núcleo central + 6 cuñas. La
   imagen evoca "Fragmentos del Sol" (la serie narrativa), no una
   claqueta de cine. Rota lento, los sectores breathe en alternancia. */
const IconFragmentos = ({
    color,
    size = 30,
}: {
    color: string
    size?: number
}) => {
    const wedges = Array.from({ length: 6 }).map((_, i) => {
        const a0 = (i * 60 - 30) * (Math.PI / 180)
        const a1 = (i * 60 + 30) * (Math.PI / 180)
        const r1 = 14
        const r2 = 26
        const x0 = 32 + Math.cos(a0) * r1
        const y0 = 32 + Math.sin(a0) * r1
        const x1 = 32 + Math.cos(a1) * r1
        const y1 = 32 + Math.sin(a1) * r1
        const X0 = 32 + Math.cos(a0) * r2
        const Y0 = 32 + Math.sin(a0) * r2
        const X1 = 32 + Math.cos(a1) * r2
        const Y1 = 32 + Math.sin(a1) * r2
        const d = `M${x0} ${y0} L${X0} ${Y0} A${r2} ${r2} 0 0 1 ${X1} ${Y1} L${x1} ${y1} A${r1} ${r1} 0 0 0 ${x0} ${y0} Z`
        return (
            <motion.path
                key={i}
                d={d}
                fill={hx(color, 0.15)}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.18,
                }}
            />
        )
    })
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${hx(color, 0.7)})` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        >
            {wedges}
            <circle
                cx="32"
                cy="32"
                r="9"
                fill={hx(color, 0.28)}
                stroke={color}
            />
        </motion.svg>
    )
}

/* v2.49 — Glifo Simuladores: retícula concéntrica con cuatro nodos
   orbitales que pulsan. Sintetiza "campo de tiro" + "membrana
   activa" + "navegación frecuencial" sin caer en el cliché del
   joystick. Cyan al unísono con el resto del set Holoteca. */
const IconSimuladores = ({
    color = "#00C2FF",
    size = 30,
}: {
    color?: string
    size?: number
}) => {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${hx(color, 0.7)})` }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
            {/* Anillos concéntricos */}
            <motion.circle
                cx="32"
                cy="32"
                r="26"
                opacity={0.45}
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <circle cx="32" cy="32" r="18" opacity={0.55} />
            <circle cx="32" cy="32" r="10" opacity={0.7} />
            {/* Cruz de retícula */}
            <line x1="32" y1="2" x2="32" y2="14" opacity={0.55} />
            <line x1="32" y1="50" x2="32" y2="62" opacity={0.55} />
            <line x1="2" y1="32" x2="14" y2="32" opacity={0.55} />
            <line x1="50" y1="32" x2="62" y2="32" opacity={0.55} />
            {/* Núcleo */}
            <circle cx="32" cy="32" r="3.4" fill={hx(color, 0.95)} />
            {/* Nodos orbitales (4 cardinales) que pulsan en cascada */}
            {[0, 1, 2, 3].map((i) => {
                const a = (Math.PI / 2) * i - Math.PI / 2
                const r = 18
                const cx = 32 + Math.cos(a) * r
                const cy = 32 + Math.sin(a) * r
                return (
                    <motion.circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="2.6"
                        fill={hx(color, 0.85)}
                        stroke="none"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.55,
                        }}
                    />
                )
            })}
        </motion.svg>
    )
}

/* v2.54 — Glifo Domo Cero: portal interdimensional. Dos anillos elípticos
   contra-rotantes (planos del Domo) + vesica piscis al centro
   (intersección de dos esferas = nuevo plano de existencia) + 6 nodos
   pulsantes en órbita externa que sugieren tripulantes presentes en el
   campo. La paleta morada se diferencia visualmente del resto del set
   (todos en cyan) — Zak quería que la card "destaque" como entrada
   admin/avanzada al universo 3D multitripulante. */
const IconDomoCero = ({
    color = "#A78BFA",
    size = 32,
}: {
    color?: string
    size?: number
}) => {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 8px ${hx(color, 0.85)})` }}
        >
            {/* Anillo elíptico horizontal (plano del Domo) */}
            <motion.ellipse
                cx="32"
                cy="32"
                rx="26"
                ry="10"
                opacity={0.6}
                animate={{ rotate: [0, 360] }}
                transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ transformOrigin: "32px 32px" }}
            />
            {/* Anillo elíptico vertical (plano contra-rotante) */}
            <motion.ellipse
                cx="32"
                cy="32"
                rx="10"
                ry="26"
                opacity={0.55}
                animate={{ rotate: [0, -360] }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ transformOrigin: "32px 32px" }}
            />
            {/* Vesica piscis al centro (dos esferas que se intersectan
                = nuevo plano de existencia). */}
            <motion.path
                d="M 26 26 Q 32 22 38 26 Q 44 32 38 38 Q 32 42 26 38 Q 20 32 26 26 Z"
                fill={hx(color, 0.18)}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            {/* Núcleo del portal */}
            <motion.circle
                cx="32"
                cy="32"
                r="3"
                fill={hx(color, 1)}
                stroke="none"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            {/* 6 nodos en órbita externa (tripulantes presentes en el
                campo). Hexagonal porque seis es el número de pilares
                del Escáner. */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (Math.PI / 3) * i - Math.PI / 2
                const r = 27
                const cx = 32 + Math.cos(a) * r
                const cy = 32 + Math.sin(a) * r * 0.42 + 32 * 0
                return (
                    <motion.circle
                        key={i}
                        cx={cx}
                        cy={32 + Math.sin(a) * r * 0.42}
                        r="1.7"
                        fill={hx(color, 0.95)}
                        stroke="none"
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.42,
                        }}
                    />
                )
            })}
        </motion.svg>
    )
}

/* ═══ Tarjeta holográfica reutilizable — copia 1:1 del MobileNavCard
       de Origen mobile (mismo border, mismo gradient, mismo shimmer +
       halo doble). Se usa por las 4 tarjetas de la Holoteca. ═══ */
function HoloCard({
    label,
    icon,
    href,
    accent,
    delay = 0,
    onClick,
}: {
    label: string
    icon: React.ReactNode
    href?: string
    accent: string
    delay?: number
    onClick?: () => void
}) {
    const inner = (
        <motion.div
            /* v2.6 — Replica EXACTA del MobileNavCard de Origen:
                misma entrada (initial y:30 + opacity 0), mismo
                shimmer diagonal, mismo doble borde animado. La
                versión radial previa se veía "más chafa" — Diego
                pidió volver al patrón Origen tal cual. */
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 120,
                borderRadius: 18,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${hx(accent, 0.4)}`,
                background: `linear-gradient(135deg, ${hx(accent, 0.1)}, ${hx(accent, 0.04)}, ${hx(accent, 0.08)})`,
                boxShadow: `0 12px 30px ${hx(accent, 0.15)}, inset 0 0 30px ${hx(accent, 0.08)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
            }}
        >
            {/* Shimmer Origen — diagonal sweep top/40% blur 6 */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "-20%",
                    height: "40%",
                    left: "-50%",
                    width: "60%",
                    background: `linear-gradient(115deg, transparent, ${hx(accent, 0.4)}, transparent)`,
                    filter: "blur(6px)",
                    transform: "rotate(8deg)",
                    pointerEvents: "none",
                }}
                animate={{ left: ["-50%", "130%"] }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            {/* Doble borde Origen — borde interno latente */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: 14,
                    border: `1px solid ${hx(accent, 0.3)}`,
                    pointerEvents: "none",
                }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                {icon}
                <span
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: accent,
                        textShadow: `0 0 10px ${hx(accent, 0.6)}, 0 0 20px ${hx(accent, 0.3)}`,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        textAlign: "center",
                        lineHeight: 1.3,
                        whiteSpace: "pre-line",
                    }}
                >
                    {label}
                </span>
            </div>
        </motion.div>
    )
    /* v2.5 — Si onClick está set, render como button (navegación
       interna del shell vía setActiveTab — preserva BottomNav).
       Si href está set, render como <a> (navegación URL). */
    if (onClick)
        return (
            <button
                onClick={onClick}
                style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    flex: "1 1 calc(50% - 8px)",
                    minWidth: 0,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                {inner}
            </button>
        )
    if (href)
        return (
            <a
                href={href}
                target="_self"
                style={{
                    textDecoration: "none",
                    flex: "1 1 calc(50% - 8px)",
                    minWidth: 0,
                }}
            >
                {inner}
            </a>
        )
    return (
        <div style={{ flex: "1 1 calc(50% - 8px)", minWidth: 0 }}>{inner}</div>
    )
}

/* ═══ Holoteca — título "HOLOTECA" en barra superior izquierda + 4
       tarjetas con cyan suave de Origen (#00C2FF). ═══ */
const HOLO_CARD_ACCENT = "#00C2FF"
/* v2.54 — Accent dedicado para DOMO CERO. Morado #A78BFA replica el
   acento del cliente del Domo y diferencia visualmente la entrada
   admin del resto del set Holoteca (todas en cyan). */
const DOMO_CARD_ACCENT = "#A78BFA"
function Holoteca({
    accent,
    onNavigate,
    isAdmin,
    onActivateDomo,
}: {
    accent: string
    onNavigate: (
        target:
            | "codices"
            | "meditaciones"
            | "codigos"
            | "fragmentos"
            | "simuladores"
    ) => void
    /* v2.54 — Si el Tripulante es admin, agregamos la sexta tarjeta
       morada DOMO CERO al final del grid. La acción no cambia tab
       interno (el Domo vive en otro dominio) — ejecuta el handoff
       JWT vía onActivateDomo. */
    isAdmin?: boolean
    onActivateDomo?: () => void
}) {
    /* v2.5 — Las cards usan onClick (no href) para que la navegación
       se mantenga DENTRO del shell de AppNavegacionMobile y la
       BottomNav siga visible.
       v2.49 — Quinta card "Simuladores" anclada al Navegante de la
       Red. La card queda centrada en la fila inferior (única en su
       hilera), efecto visual deliberado para resaltar la entrada
       más reciente.
       v2.55 — La card DOMO CERO del grid principal (que era v2.54)
       fue removida. Picar Simuladores ahora abre el SelectorSimuladores
       que contiene Navegante de la Red Y Domo Cero (admin-only) como
       cards horizontales grandes — el flow es uniforme: cualquier
       simulador del ecosistema vive ahí adentro. Mantiene el grid de
       Holoteca a 5 cards limpias. */
    const cards: {
        label: string
        icon: React.ReactNode
        accent: string
        target?:
            | "codices"
            | "meditaciones"
            | "codigos"
            | "fragmentos"
            | "simuladores"
        onClick?: () => void
    }[] = [
        {
            label: "Códices",
            icon: <IconBookHolo color={HOLO_CARD_ACCENT} />,
            accent: HOLO_CARD_ACCENT,
            target: "codices",
        },
        {
            label: "Meditaciones",
            icon: <IconLotusHolo color={HOLO_CARD_ACCENT} />,
            accent: HOLO_CARD_ACCENT,
            target: "meditaciones",
        },
        {
            label: "Códigos\nFuente",
            icon: <IconCodigosFuente color={HOLO_CARD_ACCENT} />,
            accent: HOLO_CARD_ACCENT,
            target: "codigos",
        },
        {
            label: "Fragmentos",
            icon: <IconFragmentos color={HOLO_CARD_ACCENT} />,
            accent: HOLO_CARD_ACCENT,
            target: "fragmentos",
        },
        /* v2.68 — Card "Simuladores" removida del Holoteca del Escáner
           (decisión Zak 2026-05-08). Navegante de la Red permanece en
           la capa Madre /simuladores en web y desktop; la entrada por
           el shell del Escáner queda apagada. La ruta
           /escaner/holoteca/simuladores sigue accesible vía URL
           directa para no romper deep-links legacy, pero ya no hay
           punto de entrada visible en la grid. */
    ]
    return (
        <div
            style={{
                width: "100%",
                /* v2.3 — Altura calculada del viewport menos los chrome
                   verticales del overlay (padding-top 32 + padding-bottom
                   24 + bottom nav ~76 = ~132px). Esto da el espacio neto
                   donde flexbox puede repartir título arriba + cards
                   centradas. */
                minHeight: "calc(100dvh - 140px)",
                padding: "0 16px 24px",
                fontFamily: "'Inter',sans-serif",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* v2.1 — Título en "navigation bar" superior izquierda
                (textAlign left, fontSize 14, single-line). Misma
                respiración nuc-breath y gradient por palabra del
                Núcleo, pero a escala de barra de app.
                v2.4 — paddingLeft 0 (antes 4) para que el título
                arranque a la misma X que PROTOCOLOS y DECODIFICADOR
                — los tres alineados al mismo borde. */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                    textAlign: "left",
                    paddingLeft: 0,
                    /* env(safe-area-inset-top) empuja cada título por la
                       altura del notch SOLO en PWA standalone iOS. En la
                       web normal env() resuelve a 0 y el marginTop queda
                       en 4 — sin cambios visuales. */
                    marginTop:
                        "calc(4px + env(safe-area-inset-top, 0px))",
                    marginBottom: 0,
                    flexShrink: 0,
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 14,
                        fontWeight: 200,
                        letterSpacing: "0.22em",
                        marginRight: "-0.22em",
                        textTransform: "uppercase",
                        margin: 0,
                        lineHeight: 1,
                        userSelect: "none",
                        color: "transparent",
                        filter: `drop-shadow(0 0 10px ${hx(accent, 0.3)})`,
                        WebkitFontSmoothing: "antialiased",
                        animation: "nuc-breath 7s ease-in-out infinite",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        HOLOTECA
                    </span>
                </h1>
            </motion.div>
            {/* v2.3 — Wrapper que crece ocupando el resto del viewport.
                v2.49.2 — Con cinco cards (3 filas: 2+2+1) el bloque
                quedaba descompensado al centrar — mucho aire arriba y
                la última card lejos de la BottomNav. Pasamos a
                justifyContent: "flex-end" para que el grid se ancle al
                fondo del wrapper y las tarjetas vivan más cerca del
                pulgar.
                v2.59 — Volvemos a "center". En PWA standalone el title
                gana ~50px por env(safe-area-inset-top) y con flex-end
                las cards quedaban casi pegadas a la BottomNav, con un
                gigante hueco arriba bajo el notch. Centrar reparte
                arriba/abajo con balance natural en PWA y en web mobile
                el bloque sube apenas — el pulgar todavía las alcanza
                cómodamente porque la última card queda ~80-100px sobre
                la BottomNav. */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    paddingTop: 8,
                    paddingBottom: 8,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        /* v2.6 — Diferenciamos columnGap y rowGap:
                           rowGap 28 (antes 14) separa más las dos
                           filas de tarjetas; columnGap 14 mantiene
                           el ancho horizontal de cada card. */
                        columnGap: 14,
                        rowGap: 28,
                        justifyContent: "center",
                        maxWidth: 440,
                        margin: "0 auto",
                        width: "100%",
                    }}
                >
                    {cards.map((c, i) => (
                        <HoloCard
                            key={c.label}
                            label={c.label}
                            icon={c.icon}
                            onClick={
                                c.onClick
                                    ? c.onClick
                                    : () =>
                                          c.target && onNavigate(c.target)
                            }
                            /* v2.54 — Cada card lleva su propio accent
                               (HOLO_CARD_ACCENT cyan default; DOMO CERO
                               usa morado #A78BFA). HoloCard pinta el
                               border, glow y label en ese color. */
                            accent={c.accent}
                            delay={0.15 + i * 0.12}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ═══ Próximamente — placeholder simple para Códigos Fuente y
       Fragmentos del Sol mientras se construye su contenido real.
       Mantiene el patrón visual del Lente: título estilo Holoteca
       (barra superior izquierda) + texto centrado abajo. ═══ */
function Proximamente({
    title,
    accent,
}: {
    title: string
    accent: string
}) {
    return (
        <div
            style={{
                width: "100%",
                minHeight: "calc(100dvh - 140px)",
                padding: "0 16px 24px",
                fontFamily: "'Inter',sans-serif",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                    textAlign: "left",
                    paddingLeft: 0,
                    /* env(safe-area-inset-top) empuja cada título por la
                       altura del notch SOLO en PWA standalone iOS. En la
                       web normal env() resuelve a 0 y el marginTop queda
                       en 4 — sin cambios visuales. */
                    marginTop:
                        "calc(4px + env(safe-area-inset-top, 0px))",
                    flexShrink: 0,
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 14,
                        fontWeight: 200,
                        letterSpacing: "0.22em",
                        marginRight: "-0.22em",
                        textTransform: "uppercase",
                        margin: 0,
                        lineHeight: 1,
                        userSelect: "none",
                        color: "transparent",
                        filter: `drop-shadow(0 0 10px ${hx(accent, 0.3)})`,
                        WebkitFontSmoothing: "antialiased",
                        animation: "nuc-breath 7s ease-in-out infinite",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        {`HOLOTECA · ${title.toUpperCase()}`}
                    </span>
                </h1>
            </motion.div>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 300,
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: hx(accent, 0.7),
                        fontFamily: "'Inter',sans-serif",
                    }}
                >
                    Próximamente
                </p>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   FRAGMENTOS DEL SOL — Arquitectura Astrolabio (v2.43)
   ───────────────────────────────────────────────────────────────────
   Sistema orbital rotativo nativo del [LENTE] para la serie narrativa.
   El pulgar comanda la gravedad: gesto de pan horizontal hace girar
   las órbitas elípticas (en perspectiva 3D); al soltar, snap spring
   magnético deja el Nodo más cercano en el punto focal inferior. La
   tarjeta glassmorphism abajo materializa el contenido del Nodo
   activo. "VISUALIZAR AHORA" expande el reproductor a fullscreen.
   ═══════════════════════════════════════════════════════════════════ */

type FragmentItem = {
    title?: string
    synopsis?: string
    youtubeLink?: string
    embedCode?: string
    cover?: string
}

/* v2.47 — Convierte cualquier formato de URL de YouTube al formato
   corto canónico youtu.be/<id>. Beneficios:
   · No dispara captcha "tráfico inusual" de Google que aparecía con
     watch?v= cuando el browser se abre en webview de Brave iOS.
   · En iOS, los universal links abren la app nativa de YouTube
     directamente si está instalada.
   Acepta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
   youtube.com/shorts/ID. Si no logra parsear, devuelve la URL
   original tal cual (fallback seguro). */
function buildYoutubeShareUrl(url: string): string {
    if (!url) return url
    try {
        const u = new URL(url)
        let id = ""
        if (u.hostname.includes("youtu.be")) {
            id = u.pathname.slice(1).split("/")[0]
        } else if (u.searchParams.get("v")) {
            id = u.searchParams.get("v") || ""
        } else if (u.pathname.includes("/embed/")) {
            id = u.pathname.split("/embed/")[1].split("/")[0]
        } else if (u.pathname.includes("/shorts/")) {
            id = u.pathname.split("/shorts/")[1].split("/")[0]
        }
        if (!id) return url
        return `https://youtu.be/${id}`
    } catch {
        return url
    }
}

/* ═══ AUDIO WAVEFORM — barras pseudo-orgánicas (v2.45) ═══
   El audio real del iframe (Wistia/YouTube) está bloqueado por CORS,
   no podemos hacer FFT sobre la pista. Esta es una simulación visual:
   cada barra responde a una mezcla de tres ondas senoidales con
   frecuencias distintas (bass/mid/treble) y fases offset por índice.
   Resultado: las barras suben y bajan con cadencia natural, como un
   audio meter real reaccionando a una pieza musical. rAF actualiza
   refs DOM directamente para evitar re-renders de React. */
function AudioWaveform({
    accent,
    barCount = 36,
    isPlaying = true,
}: {
    accent: string
    barCount?: number
    /* v2.46 — Cuando false, las barras se aplanan a una altura
       mínima estable (~22%). Coincide con el play/pause del video
       real vía Wistia API. */
    isPlaying?: boolean
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const barRefs = useRef<(HTMLDivElement | null)[]>([])
    /* Ref para evitar reiniciar el rAF cada vez que cambia isPlaying.
       El loop sigue corriendo y consulta el flag actual. */
    const playingRef = useRef(isPlaying)
    useEffect(() => {
        playingRef.current = isPlaying
    }, [isPlaying])

    useEffect(() => {
        let rafId = 0
        const start = performance.now()
        const tick = () => {
            const t = (performance.now() - start) / 1000
            for (let i = 0; i < barCount; i++) {
                const el = barRefs.current[i]
                if (!el) continue
                if (!playingRef.current) {
                    /* Pausa: nivel mínimo silencioso, sin oscilación. */
                    el.style.height = "22%"
                    continue
                }
                const phase = i * 0.55
                const bass =
                    Math.sin(t * 1.6 + phase * 0.4) * 0.5 + 0.5
                const mid =
                    Math.sin(t * 5.2 + phase * 1.1) * 0.4 + 0.4
                const treble =
                    Math.sin(t * 12.8 + phase * 1.9) * 0.25 + 0.25
                const envelope =
                    0.7 + 0.3 * (Math.sin(t * 0.6) * 0.5 + 0.5)
                const mix = (bass * 0.45 + mid * 0.35 + treble * 0.2) *
                    envelope
                const curved = Math.pow(Math.max(0, Math.min(1, mix)), 0.85)
                const heightPct = 18 + curved * 78
                el.style.height = `${heightPct}%`
            }
            rafId = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(rafId)
    }, [barCount])

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 3,
                height: 26,
                marginBottom: 10,
                opacity: isPlaying ? 0.85 : 0.4,
                transition: "opacity 0.32s ease",
            }}
        >
            {Array.from({ length: barCount }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        barRefs.current[i] = el
                    }}
                    style={{
                        flex: 1,
                        height: "30%",
                        background: `linear-gradient(180deg, ${accent}, ${hx(accent, 0.3)})`,
                        borderRadius: 1.5,
                        boxShadow: `0 0 5px ${hx(accent, 0.45)}`,
                        transition: "height 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                />
            ))}
        </div>
    )
}

/* Reproductor inmersivo fullscreen — absorbe el lienzo cuando el
   Tripulante pulsa "VISUALIZAR AHORA". v2.44: video centrado en Y +
   sellos HUD arriba/abajo estilo terminal RSV (líneas de scan, ID
   del Fragmento, frecuencia, indicador de transmisión activa). */
function FragmentoPlayerFullscreen({
    item,
    accent,
    onClose,
    fragmentNum,
}: {
    item: FragmentItem
    accent: string
    onClose: () => void
    fragmentNum: number
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    /* v2.46 — Estado de play/pause del video. Default true (autoplay
       arranca reproduciendo). El waveform consume esta señal para
       aplanarse cuando se pausa. */
    const [isVideoPlaying, setIsVideoPlaying] = useState(true)
    /* Flag de "vivo" para que callbacks viejos de Wistia no toquen
       state de un componente desmontado (Wistia._wq es global). */
    const aliveRef = useRef(true)
    useEffect(() => {
        return () => {
            aliveRef.current = false
        }
    }, [])
    useEffect(() => {
        if (!containerRef.current) return
        const code = (item.embedCode || "").trim()
        if (code) {
            let finalCode = code
            if (
                finalCode.includes("wistia-player") &&
                !finalCode.includes("autoplay")
            ) {
                finalCode = finalCode.replace(
                    "<wistia-player",
                    "<wistia-player autoplay"
                )
            }
            try {
                const range = document.createRange()
                range.selectNode(containerRef.current)
                const docFrag = range.createContextualFragment(finalCode)
                containerRef.current.innerHTML = ""
                containerRef.current.appendChild(docFrag)
            } catch {
                if (containerRef.current)
                    containerRef.current.innerHTML = finalCode
            }
            /* v2.46 — Hook a la Wistia JS API. window._wq es la cola
               global que Wistia procesa cuando carga su runtime. El
               handler "_all" se llama por cada video presente en el
               DOM. Bind a play/pause actualiza isVideoPlaying. Si el
               embed no es Wistia (YouTube, etc), el handler nunca
               recibe video y la barra simplemente sigue animada. */
            try {
                const w = window as any
                w._wq = w._wq || []
                w._wq.push({
                    id: "_all",
                    onReady: function (video: any) {
                        if (!video || !video.bind) return
                        video.bind("play", () => {
                            if (aliveRef.current) setIsVideoPlaying(true)
                        })
                        video.bind("pause", () => {
                            if (aliveRef.current) setIsVideoPlaying(false)
                        })
                        video.bind("end", () => {
                            if (aliveRef.current) setIsVideoPlaying(false)
                        })
                    },
                })
            } catch {}
        }
    }, [item.embedCode])

    /* Frecuencia "vibracional" derivada del fragmento — sello visual
       sin pretensión técnica real. */
    const freq = (432 + fragmentNum * 7).toFixed(2)
    const idLabel = `RSV//F${String(fragmentNum).padStart(2, "0")}`

    if (typeof document === "undefined") return null
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483646,
                background:
                    "radial-gradient(ellipse at center, #050B18 0%, #000308 70%, #000 100%)",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter',sans-serif",
                color: "#fff",
            }}
        >
            {/* HUD SUPERIOR — sello terminal RSV */}
            <div
                style={{
                    position: "relative",
                    flexShrink: 0,
                    padding: "16px 18px 10px",
                    borderBottom: `1px solid ${hx(accent, 0.18)}`,
                    background: `linear-gradient(180deg, ${hx(accent, 0.06)} 0%, transparent 100%)`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Logo sello: triángulo solar pequeño */}
                        <svg width="22" height="22" viewBox="0 0 24 24">
                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                                fill="none"
                                stroke={accent}
                                strokeWidth="0.8"
                                strokeDasharray="2 3"
                            />
                            <circle cx="12" cy="12" r="3.5" fill={accent} />
                            <circle cx="12" cy="12" r="1.5" fill="#fff" />
                        </svg>
                        <div style={{ lineHeight: 1.15 }}>
                            <div
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    letterSpacing: "0.32em",
                                    textTransform: "uppercase",
                                    color: hx(accent, 0.95),
                                }}
                            >
                                Red Solar Viva
                            </div>
                            <div
                                style={{
                                    fontSize: 8,
                                    fontWeight: 500,
                                    letterSpacing: "0.22em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.45)",
                                    marginTop: 2,
                                }}
                            >
                                Fragmentos del Sol · {idLabel}
                            </div>
                        </div>
                    </div>
                    {/* Indicador de transmisión activa con dot pulsante */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            paddingRight: 50,
                        }}
                    >
                        <motion.span
                            animate={{
                                opacity: [0.4, 1, 0.4],
                                scale: [1, 1.25, 1],
                            }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#FF3B5C",
                                boxShadow: "0 0 8px #FF3B5C",
                                display: "inline-block",
                            }}
                        />
                        <span
                            style={{
                                fontSize: 8,
                                fontWeight: 600,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.7)",
                            }}
                        >
                            En transmisión
                        </span>
                    </div>
                </div>
                {/* Botón cerrar */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar reproductor"
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 14,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${hx(accent, 0.45)}`,
                        background: "rgba(0,8,20,0.65)",
                        color: accent,
                        fontSize: 18,
                        fontWeight: 200,
                        lineHeight: 1,
                        cursor: "pointer",
                        outline: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        zIndex: 5,
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    ×
                </button>
            </div>

            {/* CENTRO — video centrado vertical y horizontal con
               espacio respiratorio del color HUD. */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Líneas de scan diagonales sutiles del fondo */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, ${hx(accent, 0.025)} 3px, ${hx(accent, 0.025)} 4px)`,
                        pointerEvents: "none",
                    }}
                />
                {item.embedCode ? (
                    <div
                        ref={containerRef}
                        style={{
                            width: "100%",
                            maxHeight: "100%",
                            position: "relative",
                            zIndex: 1,
                        }}
                    />
                ) : item.youtubeLink ? (
                    <div
                        style={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        <iframe
                            src={item.youtubeLink.replace(
                                "watch?v=",
                                "embed/"
                            )}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                            }}
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <span
                        style={{
                            color: hx(accent, 0.6),
                            fontSize: 12,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        Sin transmisión disponible
                    </span>
                )}
            </div>

            {/* HUD INFERIOR — barra técnica estilo terminal */}
            <div
                style={{
                    flexShrink: 0,
                    padding: "12px 18px 16px",
                    borderTop: `1px solid ${hx(accent, 0.18)}`,
                    background: `linear-gradient(0deg, ${hx(accent, 0.06)} 0%, transparent 100%)`,
                }}
            >
                {/* Forma de onda animada — pseudo-orgánica, las barras
                   responden a una mezcla de tres senoidales (bass/mid/
                   treble) modulada por un envelope respiratorio.
                   Audio real bloqueado por CORS — esto simula la
                   reactividad visual con cadencia natural. */}
                <AudioWaveform
                    accent={accent}
                    barCount={36}
                    isPlaying={isVideoPlaying}
                />
                {/* Línea de telemetría: ID + frecuencia + estado */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    <span style={{ color: hx(accent, 0.85) }}>{idLabel}</span>
                    <span>FREQ · {freq} Hz</span>
                    <span style={{ color: hx(accent, 0.85) }}>SYNC ON</span>
                </div>
            </div>
        </motion.div>,
        document.body
    )
}

/* ═══ SOL SUPREMO — diseño multicapa (v2.45) ═══
   El core es una esfera 3D con sombreado realista: gradiente radial
   multi-stop con highlight especular arriba-izquierda, sombra
   ecuatorial inferior y hot spot incandescente que respira. Encima
   del core viven la corona pulsante, llamaradas radiantes rotantes y
   anillo de plasma. Z-index alto garantiza que el Sol siempre quede
   por encima de cualquier planeta que pase detrás. */
function SolSupremo({ size = 92 }: { size?: number }) {
    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                pointerEvents: "none",
            }}
        >
            {/* Corona externa pulsante (anillo de plasma sutil) */}
            <motion.div
                animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.45, 0.78, 0.45],
                }}
                transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    inset: -size * 0.35,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, transparent 38%, rgba(255,196,68,0.32) 50%, transparent 70%)`,
                }}
            />
            {/* Llamaradas radiantes — 8 rayos rotando */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{
                    duration: 28,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                }}
            >
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 2,
                            height: size * 0.95,
                            transformOrigin: "center top",
                            transform: `translate(-50%, 0) rotate(${i * 45}deg)`,
                            background: `linear-gradient(180deg, transparent 0%, rgba(255,196,68,0.6) 25%, rgba(255,124,30,0.85) 55%, transparent 100%)`,
                            filter: "blur(0.6px)",
                            opacity: 0.85,
                        }}
                    />
                ))}
            </motion.div>
            {/* Llamaradas suaves contra-rotantes */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{
                    duration: 42,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ position: "absolute", inset: 0 }}
            >
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 1.5,
                            height: size * 0.7,
                            transformOrigin: "center top",
                            transform: `translate(-50%, 0) rotate(${i * 30 + 15}deg)`,
                            background: `linear-gradient(180deg, transparent 0%, rgba(255,180,80,0.4) 40%, transparent 90%)`,
                            opacity: 0.55,
                        }}
                    />
                ))}
            </motion.div>
            {/* Anillo de plasma rotante */}
            <motion.svg
                viewBox="0 0 100 100"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    inset: -4,
                    width: size + 8,
                    height: size + 8,
                }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="rgba(255,196,68,0.7)"
                    strokeWidth="0.8"
                    strokeDasharray="3 7"
                />
            </motion.svg>
            {/* Core principal — esfera 3D con profundidad real */}
            <motion.div
                animate={{
                    boxShadow: [
                        `0 0 38px rgba(255,196,68,0.7), 0 0 90px rgba(255,124,30,0.45), inset -8px -10px 22px rgba(132,40,0,0.55)`,
                        `0 0 60px rgba(255,224,140,0.95), 0 0 120px rgba(255,150,50,0.6), inset -8px -10px 22px rgba(132,40,0,0.55)`,
                        `0 0 38px rgba(255,196,68,0.7), 0 0 90px rgba(255,124,30,0.45), inset -8px -10px 22px rgba(132,40,0,0.55)`,
                    ],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 32% 26%, #FFFEF0 0%, #FFEEB8 12%, #FFD56A 28%, #FFB048 45%, #FF7C1E 68%, #C84800 88%, #7A2E00 100%)`,
                }}
            />
            {/* Highlight especular grande — brillo de luz arriba-izquierda */}
            <div
                style={{
                    position: "absolute",
                    left: "18%",
                    top: "14%",
                    width: "38%",
                    height: "32%",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(ellipse at 35% 35%, rgba(255,255,250,0.78) 0%, rgba(255,250,220,0.35) 40%, transparent 75%)",
                    filter: "blur(3px)",
                    pointerEvents: "none",
                    transform: "rotate(-18deg)",
                }}
            />
            {/* Sombra ecuatorial — sutil para profundidad */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(ellipse at 70% 80%, rgba(80,20,0,0.42) 0%, transparent 55%)",
                    pointerEvents: "none",
                }}
            />
            {/* Hot spot núcleo — punto incandescente que respira */}
            <motion.div
                animate={{
                    opacity: [0.65, 0.95, 0.65],
                    scale: [0.85, 1.15, 0.85],
                }}
                transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    left: "40%",
                    top: "40%",
                    width: "14%",
                    height: "14%",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, #FFFFFF 0%, #FFE7A0 55%, transparent 100%)",
                    filter: "blur(1px)",
                }}
            />
        </div>
    )
}

/* ═══ PLANET — esfera 3D con sombreado uniforme (v2.45) ═══
   Reemplaza el FragmentGlyph generativo. Todos los planetas usan la
   MISMA geometría: esfera con gradiente radial profundo, highlight
   especular arriba-izquierda y sombra de oclusión abajo-derecha.
   Cuando isActive, suma un anillo orbital cyan sutil que pulsa para
   distinguir el Nodo focal sin romper la uniformidad visual. */
function Planet({
    size,
    accent,
    isActive,
}: {
    size: number
    accent: string
    isActive: boolean
}) {
    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                pointerEvents: "none",
            }}
        >
            {/* Anillo orbital cyan al activo */}
            {isActive && (
                <motion.div
                    animate={{
                        opacity: [0.5, 0.9, 0.5],
                        scale: [1, 1.12, 1],
                    }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        inset: -size * 0.22,
                        borderRadius: "50%",
                        border: `1px dashed ${hx(accent, 0.7)}`,
                        boxShadow: `0 0 18px ${hx(accent, 0.55)}, inset 0 0 18px ${hx(accent, 0.25)}`,
                    }}
                />
            )}
            {/* Esfera planetaria — gradiente radial 3D */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 32% 28%, ${hx(accent, 0.95)} 0%, ${hx(accent, 0.7)} 22%, ${hx(accent, 0.45)} 50%, ${hx(accent, 0.2)} 78%, rgba(0,12,28,0.95) 100%)`,
                    boxShadow: isActive
                        ? `0 0 22px ${hx(accent, 0.7)}, inset -4px -6px 14px rgba(0,8,18,0.6)`
                        : `0 0 10px ${hx(accent, 0.3)}, inset -4px -6px 14px rgba(0,8,18,0.6)`,
                    border: `1px solid ${hx(accent, isActive ? 0.85 : 0.45)}`,
                }}
            />
            {/* Highlight especular arriba-izquierda */}
            <div
                style={{
                    position: "absolute",
                    left: "18%",
                    top: "14%",
                    width: "32%",
                    height: "26%",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at 40% 40%, rgba(255,255,255,${isActive ? 0.6 : 0.4}) 0%, transparent 70%)`,
                    filter: "blur(2px)",
                    pointerEvents: "none",
                }}
            />
            {/* Sombra de oclusión abajo-derecha */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(ellipse at 75% 80%, rgba(0,4,14,0.55) 0%, transparent 55%)",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

function FragmentosAstrolabio({
    items,
    accent,
}: {
    items: FragmentItem[]
    accent: string
}) {
    /* Filtramos solo Fragmentos con título — los slots vacíos del
       buildFragments no se proyectan en la órbita. */
    const fragments = useMemo(
        () => (items || []).filter((f) => f && (f.title || f.cover)),
        [items]
    )
    const N = Math.max(1, fragments.length)
    const angularStep = (2 * Math.PI) / N
    /* Posición focal = abajo-centro, donde el pulgar descansa. */
    const FOCAL = Math.PI / 2

    /* Estado: rotación inicial = FOCAL para que F1 (i=0) quede
       anclado al punto focal al cargar. activeIdx 0 coincide con eso. */
    const [rotation, setRotation] = useState(FOCAL)
    const [activeIdx, setActiveIdx] = useState(0)
    const [playerOpen, setPlayerOpen] = useState(false)
    /* Refs del gesto pan + spring snap. Usamos rAF en lugar de
       setTimeout (ver feedback_long_press_ios_raf): iOS suspende
       setTimeout durante el pipeline de selección/menú contextual y
       perdemos frames del gesto. */
    const dragRef = useRef({
        active: false,
        startX: 0,
        startRot: 0,
        lastX: 0,
        lastTime: 0,
        velocity: 0,
        pointerId: -1,
    })
    const springRafRef = useRef<number | null>(null)
    const lastActiveRef = useRef(0)

    /* Cancela el spring activo al iniciar otro drag. */
    const cancelSpring = useCallback(() => {
        if (springRafRef.current !== null) {
            cancelAnimationFrame(springRafRef.current)
            springRafRef.current = null
        }
    }, [])

    /* Spring snap usando rAF + integración con damping. Llega al target
       con sensación de inercia natural. */
    const animateTo = useCallback(
        (target: number, initialVelocity: number = 0) => {
            cancelSpring()
            let current = rotation
            let velocity = initialVelocity
            const stiffness = 0.16
            const damping = 0.78
            const tick = () => {
                const force = (target - current) * stiffness
                velocity = (velocity + force) * damping
                current += velocity
                setRotation(current)
                if (
                    Math.abs(velocity) > 0.0008 ||
                    Math.abs(target - current) > 0.0008
                ) {
                    springRafRef.current = requestAnimationFrame(tick)
                } else {
                    setRotation(target)
                    springRafRef.current = null
                }
            }
            springRafRef.current = requestAnimationFrame(tick)
        },
        [rotation, cancelSpring]
    )

    /* activeIdx derivado puro de rotation. El nodo cuyo ángulo total
       (baseAngle + rotation) esté más cerca del FOCAL es el activo.
       v2.59 — baseAngle invertido (-i·step) para que F2 (siguiente
       episodio) salga a la DERECHA de F1 en lugar de a la izquierda.
       Mantiene el resto del cálculo idéntico — el módulo 2π ya tolera
       ángulos negativos. */
    useEffect(() => {
        if (N === 0) return
        let bestIdx = 0
        let bestDelta = Infinity
        for (let i = 0; i < N; i++) {
            const baseAngle = -i * angularStep
            const total = baseAngle + rotation
            /* Distancia angular módulo 2π — la mínima entre las dos
               direcciones del círculo. */
            let delta = ((total - FOCAL) % (2 * Math.PI))
            if (delta > Math.PI) delta -= 2 * Math.PI
            if (delta < -Math.PI) delta += 2 * Math.PI
            const abs = Math.abs(delta)
            if (abs < bestDelta) {
                bestDelta = abs
                bestIdx = i
            }
        }
        if (bestIdx !== lastActiveRef.current) {
            lastActiveRef.current = bestIdx
            setActiveIdx(bestIdx)
            /* Vibración háptica — se ignora silencioso si el dispositivo
               no la soporta (Safari iOS). */
            try {
                if (
                    typeof navigator !== "undefined" &&
                    typeof (navigator as any).vibrate === "function"
                ) {
                    ;(navigator as any).vibrate(20)
                }
            } catch {}
        }
    }, [rotation, N, angularStep])

    /* v2.45 — Capturamos el activeIdx al iniciar el drag. El snap
       direccional usa este "índice base" para decidir el target sin
       depender del activeIdx que va cambiando dinámicamente durante
       el gesto (que sería sólo el más cercano al FOCAL). */
    const dragStartIdxRef = useRef(0)

    /* Pointer handlers: pan horizontal → suma a rotation. */
    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            cancelSpring()
            const target = e.currentTarget
            try {
                target.setPointerCapture(e.pointerId)
            } catch {}
            dragStartIdxRef.current = lastActiveRef.current
            dragRef.current = {
                active: true,
                startX: e.clientX,
                startRot: rotation,
                lastX: e.clientX,
                lastTime: performance.now(),
                velocity: 0,
                pointerId: e.pointerId,
            }
        },
        [rotation, cancelSpring]
    )
    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!dragRef.current.active) return
            const dx = e.clientX - dragRef.current.startX
            /* v2.44 — Sentido invertido. dedo a la derecha (dx > 0)
               debe mover el Nodo activo a la derecha (rotación
               antihoraria del plano: rotateZ negativa en CSS).
               Patrón natural de carrousel: el contenido sigue al dedo. */
            const sensitivity = -(2 * Math.PI) / 1400
            const newRot = dragRef.current.startRot + dx * sensitivity
            const now = performance.now()
            const dt = Math.max(1, now - dragRef.current.lastTime)
            const dxLocal = e.clientX - dragRef.current.lastX
            dragRef.current.velocity = (dxLocal * sensitivity) / dt * 16
            dragRef.current.lastX = e.clientX
            dragRef.current.lastTime = now
            setRotation(newRot)
        },
        []
    )
    const finishDrag = useCallback(() => {
        if (!dragRef.current.active) return
        const v = dragRef.current.velocity
        const startRot = dragRef.current.startRot
        const startIdx = dragStartIdxRef.current
        dragRef.current.active = false
        /* v2.45 — Snap direccional sensible. Si el desplazamiento
           angular durante el drag superó ~22% del paso O la velocidad
           es notable, salta al siguiente Fragmento en la dirección
           del gesto. Si no, vuelve al activo previo. Esto permite
           cambios con flicks cortos del pulgar (~30-40px) sin
           necesidad de recorrer la mitad del camino completo. */
        const totalDelta = rotation - startRot
        const threshold = angularStep * 0.22
        const velocityThreshold = 0.025
        let targetIdx: number
        if (
            Math.abs(totalDelta) > threshold ||
            Math.abs(v) > velocityThreshold
        ) {
            /* v2.59 — Geometría invertida: F2 a la DERECHA de F1.
               Sensitivity sigue negativa (content-follows-finger),
               pero la dirección se invierte (patrón iPhone Photos:
               siguiente está a la derecha y se trae a focal swipeando
               LEFT):
               · totalDelta > 0 (dedo izquierda, rotación crece):
                 activo siguiente (idx+1) — trae F2 al focal.
               · totalDelta < 0 (dedo derecha, rotación decrece):
                 activo anterior (idx-1) — trae el último al focal.
               Si totalDelta es ~0 pero hay velocity, usamos su signo. */
            const dir =
                Math.abs(totalDelta) > 0.001
                    ? totalDelta > 0
                        ? 1
                        : -1
                    : v > 0
                      ? 1
                      : -1
            targetIdx = (startIdx + dir + N) % N
        } else {
            targetIdx = startIdx
        }
        /* v2.59 — Para que F2 (con baseAngle = -step) llegue al FOCAL
           necesitamos que rotation = FOCAL + step (en lugar de FOCAL -
           step de la geometría anterior). Por eso flipeamos el signo
           de targetIdx·angularStep. */
        const targetRot = FOCAL + targetIdx * angularStep
        let snap = targetRot
        const current = rotation
        while (snap - current > Math.PI) snap -= 2 * Math.PI
        while (snap - current < -Math.PI) snap += 2 * Math.PI
        animateTo(snap, v * 0.8)
    }, [rotation, angularStep, animateTo, FOCAL, N])

    /* Cleanup del spring al desmontar. */
    useEffect(() => {
        return () => cancelSpring()
    }, [cancelSpring])

    /* Si no hay fragmentos, caemos al placeholder. */
    if (fragments.length === 0) {
        return <Proximamente title="Fragmentos del Sol" accent={accent} />
    }

    const active = fragments[activeIdx]
    /* Geometría de la órbita. radioX = ancho, radioY más chico para
       efecto de elipse en perspectiva. */
    const ORBIT_RADIUS_X = 130
    const ORBIT_RADIUS_Y = 38
    const SOL_DIAMETER = 78
    /* El plano orbital se inclina ~55° en X — los nodos arriba parecen
       más lejanos, los de abajo más cercanos (z positivo). */

    return (
        <div
            style={{
                width: "100%",
                minHeight: "calc(100dvh - 140px)",
                padding: "0 16px 24px",
                fontFamily: "'Inter',sans-serif",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                /* v2.44 — overflow visible para que la corona y las
                   llamaradas del Sol respiren sin línea de corte arriba. */
                overflow: "visible",
                touchAction: "pan-y",
            }}
        >
            {/* Título estilo Holoteca — barra superior izquierda */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                    textAlign: "left",
                    paddingLeft: 0,
                    /* env(safe-area-inset-top) empuja cada título por la
                       altura del notch SOLO en PWA standalone iOS. En la
                       web normal env() resuelve a 0 y el marginTop queda
                       en 4 — sin cambios visuales. */
                    marginTop:
                        "calc(4px + env(safe-area-inset-top, 0px))",
                    flexShrink: 0,
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 14,
                        fontWeight: 200,
                        letterSpacing: "0.22em",
                        marginRight: "-0.22em",
                        textTransform: "uppercase",
                        margin: 0,
                        lineHeight: 1,
                        userSelect: "none",
                        color: "transparent",
                        filter: `drop-shadow(0 0 10px ${hx(accent, 0.3)})`,
                        WebkitFontSmoothing: "antialiased",
                        animation: "nuc-breath 7s ease-in-out infinite",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        HOLOTECA · FRAGMENTOS DEL SOL
                    </span>
                </h1>
            </motion.div>

            {/* Astrolabio — tercio superior con Sol + órbita rotativa.
               Pointer events viven en el wrapper interno para no
               capturar el área de la tarjeta abajo. v2.44 — overflow
               visible y altura más compacta para acercar la tarjeta. */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: 280,
                    marginTop: 36,
                    flexShrink: 0,
                    overflow: "visible",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onPointerLeave={(e) => {
                    if (
                        dragRef.current.active &&
                        e.pointerId === dragRef.current.pointerId
                    ) {
                        finishDrag()
                    }
                }}
            >
                {/* v2.47 — Render en tres capas hermanas para z-sorting
                   correcto SIN depender de zIndex (los stacking
                   contexts del Sol y del plano orbital eran distintos
                   y el Sol siempre ganaba). Estrategia: dividir
                   planetas por profundidad y pintarlos en orden DOM:
                   BACK (norm < 0.5) → Sol → FRONT (norm >= 0.5).
                   El último elemento DOM siempre pasa encima de los
                   anteriores. */}
                {(() => {
                    const planoStyle: React.CSSProperties = {
                        position: "absolute",
                        left: "50%",
                        top: 64,
                        width: 0,
                        height: 0,
                        transform: `translate(-50%, -50%) rotateX(58deg) rotateZ(${rotation}rad)`,
                        transformStyle: "preserve-3d",
                        pointerEvents: "none",
                    }
                    /* Calcula la geometría de cada planeta y lo
                       clasifica en back/front según depth. */
                    const planetsBack: any[] = []
                    const planetsFront: any[] = []
                    fragments.forEach((f, i) => {
                        /* v2.59 — baseAngle invertido (-i·step) para
                           que F2 emerja a la DERECHA de F1. cos/sin
                           toleran negativos: x = cos(-step) = cos(step),
                           y = sin(-step) = -sin(step), así que el
                           planeta cambia de cuadrante. */
                        const baseAngle = -i * angularStep
                        const x = Math.cos(baseAngle) * ORBIT_RADIUS_X
                        const y = Math.sin(baseAngle) * ORBIT_RADIUS_X
                        const totalAngle = baseAngle + rotation
                        let delta = (totalAngle - FOCAL) % (2 * Math.PI)
                        if (delta > Math.PI) delta -= 2 * Math.PI
                        if (delta < -Math.PI) delta += 2 * Math.PI
                        const depth = Math.cos(delta)
                        const norm = (depth + 1) / 2
                        const scale = 0.55 + 0.55 * norm
                        const opacity = 0.32 + 0.68 * norm
                        const isActive = i === activeIdx
                        const data = {
                            i,
                            x,
                            y,
                            scale,
                            opacity,
                            isActive,
                            norm,
                        }
                        if (norm >= 0.5) planetsFront.push(data)
                        else planetsBack.push(data)
                    })
                    /* Orden interno por profundidad: dentro de back los
                       más atrás primero, dentro de front los menos al
                       frente primero (para que el más al frente quede
                       arriba de su grupo). */
                    planetsBack.sort((a, b) => a.norm - b.norm)
                    planetsFront.sort((a, b) => a.norm - b.norm)

                    const renderPlanet = (p: any) => (
                        <div
                            key={p.i}
                            style={{
                                position: "absolute",
                                left: p.x,
                                top: p.y,
                                width: 0,
                                height: 0,
                                transform: `translate(-50%,-50%) rotateZ(${-rotation}rad) rotateX(-58deg)`,
                                transformStyle: "preserve-3d",
                                pointerEvents: "none",
                                opacity: p.opacity,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%,-50%) scale(${p.scale})`,
                                    transformOrigin: "center",
                                }}
                            >
                                <Planet
                                    size={48}
                                    accent={accent}
                                    isActive={p.isActive}
                                />
                            </div>
                            {p.isActive && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: `calc(50% + ${36 * p.scale}px)`,
                                        transform: "translate(-50%, 0)",
                                        color: accent,
                                        fontSize: 9,
                                        fontWeight: 600,
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        textShadow: `0 0 10px ${hx(accent, 0.6)}`,
                                        whiteSpace: "nowrap",
                                        opacity: 0.9,
                                    }}
                                >
                                    F{activeIdx + 1}
                                </div>
                            )}
                        </div>
                    )

                    return (
                        <>
                            {/* CAPA 1 — Planetas detrás del Sol
                               (incluye el anillo elíptico para que
                               también quede atrás). */}
                            <div style={planoStyle}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: -ORBIT_RADIUS_X,
                                        top: -ORBIT_RADIUS_X,
                                        width: ORBIT_RADIUS_X * 2,
                                        height: ORBIT_RADIUS_X * 2,
                                        borderRadius: "50%",
                                        border: `1px dashed ${hx(accent, 0.18)}`,
                                        pointerEvents: "none",
                                    }}
                                />
                                {planetsBack.map(renderPlanet)}
                            </div>

                            {/* CAPA 2 — Sol Supremo (entre los dos
                               grupos de planetas). */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: 64,
                                    transform: "translate(-50%, -50%)",
                                    pointerEvents: "none",
                                }}
                            >
                                <SolSupremo size={92} />
                            </div>

                            {/* CAPA 3 — Planetas al frente del Sol. */}
                            <div style={planoStyle}>
                                {planetsFront.map(renderPlanet)}
                            </div>
                        </>
                    )
                })()}

                {/* Hint de gesto al primer mount */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0] }}
                    transition={{
                        delay: 0.6,
                        duration: 3.2,
                        ease: "easeOut",
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 0,
                        transform: "translateX(-50%)",
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: hx(accent, 0.6),
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    ← desliza para girar →
                </motion.div>
            </div>

            {/* Tarjeta materializada — pegada al sistema orbital
               (v2.44). Eliminado el flex:1 y alignItems:flex-end para
               acercarla a la órbita; ahora flota inmediatamente debajo. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "stretch",
                    marginTop: 18,
                    paddingBottom: 8,
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIdx}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{
                            duration: 0.32,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                            width: "100%",
                            padding: "16px 18px 18px",
                            borderRadius: 18,
                            border: `1px solid ${hx(accent, 0.32)}`,
                            background: `linear-gradient(165deg, rgba(8,28,52,0.55), rgba(2,12,28,0.72))`,
                            backdropFilter: "blur(22px) saturate(1.4)",
                            WebkitBackdropFilter: "blur(22px) saturate(1.4)",
                            boxShadow: `0 18px 60px rgba(0,0,0,0.55), 0 0 28px ${hx(accent, 0.12)}, inset 0 1px 0 ${hx(accent, 0.18)}`,
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Shimmer dorado tenue */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: `linear-gradient(115deg, transparent 30%, ${hx(accent, 0.06)} 50%, transparent 70%)`,
                                pointerEvents: "none",
                            }}
                        />
                        {/* v2.46 — Botón discreto a YouTube. Sólo se
                           renderiza si el Fragmento tiene youtubeLink.
                           Esquina superior derecha, opacidad sutil. */}
                        {active.youtubeLink && (
                            <a
                                href={buildYoutubeShareUrl(
                                    active.youtubeLink
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Abrir en YouTube"
                                title="Abrir en YouTube"
                                style={{
                                    position: "absolute",
                                    top: 10,
                                    right: 10,
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: hx(accent, 0.55),
                                    background: hx(accent, 0.04),
                                    border: `1px solid ${hx(accent, 0.18)}`,
                                    cursor: "pointer",
                                    transition: "all 0.22s",
                                    zIndex: 3,
                                    textDecoration: "none",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M21.6 7.2c-.2-1-.9-1.7-1.9-2-1.7-.4-8.7-.4-8.7-.4s-7 0-8.7.4c-1 .3-1.7 1-1.9 2-.4 1.7-.4 5.3-.4 5.3s0 3.6.4 5.3c.2 1 .9 1.7 1.9 2 1.7.4 8.7.4 8.7.4s7 0 8.7-.4c1-.3 1.7-1 1.9-2 .4-1.7.4-5.3.4-5.3s0-3.6-.4-5.3zM9.6 16V9l6 3.5-6 3.5z" />
                                </svg>
                            </a>
                        )}
                        <div
                            style={{
                                display: "flex",
                                gap: 14,
                                alignItems: "flex-start",
                                position: "relative",
                            }}
                        >
                            {/* Thumbnail alta fidelidad — cover del
                               Fragmento. v2.45: restaurado tras feedback
                               de Zak (sólo se quitó la imagen del
                               planeta orbital, NO la de la tarjeta). */}
                            <div
                                style={{
                                    width: 76,
                                    height: 76,
                                    borderRadius: 10,
                                    flexShrink: 0,
                                    background: active.cover
                                        ? `url(${active.cover}) center/cover no-repeat`
                                        : `linear-gradient(135deg, ${hx(accent, 0.3)}, ${hx(accent, 0.08)})`,
                                    border: `1px solid ${hx(accent, 0.4)}`,
                                    boxShadow: `0 0 18px ${hx(accent, 0.22)}`,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 9,
                                        fontWeight: 600,
                                        letterSpacing: "0.28em",
                                        textTransform: "uppercase",
                                        color: hx(accent, 0.7),
                                        /* v2.46: padding-right deja
                                           espacio al botón YouTube. */
                                        paddingRight: active.youtubeLink ? 38 : 0,
                                    }}
                                >
                                    Fragmento {activeIdx + 1}
                                </p>
                                <h2
                                    style={{
                                        margin: "4px 0 6px",
                                        fontSize: 16,
                                        fontWeight: 300,
                                        letterSpacing: "0.04em",
                                        color: "#fff",
                                        lineHeight: 1.25,
                                        textShadow: `0 0 10px ${hx(accent, 0.3)}`,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {active.title || "Sin título"}
                                </h2>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 11,
                                        fontWeight: 300,
                                        lineHeight: 1.5,
                                        color: "rgba(214,245,255,0.72)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {active.synopsis ||
                                        "Pulso vibracional pendiente."}
                                </p>
                            </div>
                        </div>
                        {/* Botón ignición — pulso sutil */}
                        <motion.button
                            type="button"
                            onClick={() => setPlayerOpen(true)}
                            whileTap={{ scale: 0.97 }}
                            animate={{
                                boxShadow: [
                                    `0 0 14px ${hx(accent, 0.35)}, inset 0 0 12px ${hx(accent, 0.18)}`,
                                    `0 0 22px ${hx(accent, 0.55)}, inset 0 0 12px ${hx(accent, 0.28)}`,
                                    `0 0 14px ${hx(accent, 0.35)}, inset 0 0 12px ${hx(accent, 0.18)}`,
                                ],
                            }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                marginTop: 14,
                                width: "100%",
                                padding: "13px 16px",
                                borderRadius: 12,
                                border: `1px solid ${hx(accent, 0.55)}`,
                                background: `linear-gradient(135deg, ${hx(accent, 0.2)} 0%, ${hx(accent, 0.06)} 100%)`,
                                color: "#fff",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.32em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                outline: "none",
                                position: "relative",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            ✦ Visualizar Ahora
                        </motion.button>
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {playerOpen && (
                    <FragmentoPlayerFullscreen
                        item={active}
                        accent={accent}
                        fragmentNum={activeIdx + 1}
                        onClose={() => setPlayerOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   CÓDIGOS FUENTE — Cámara de Anclaje (v2.48)
   ───────────────────────────────────────────────────────────────────
   Sustituye el placeholder Próximamente por una pantalla viva: núcleo
   cristalino multicapa, partículas binarias en movimiento, mensaje
   sellado de anclaje, barra de progreso cíclica y HUD técnico con
   stats que respiran. Sensación de terminal cuántica densificando.
   ═══════════════════════════════════════════════════════════════════ */

/* Núcleo cristalino — geometría sagrada multicapa: estrella de David
   externa contra-rotando con hexágono interno, tres anillos
   concéntricos con dasharray animado y vértices con puntos pulsantes.
   El conjunto rota lento y sus capas se desfasan creando densidad. */
function CrystalCore({ accent }: { accent: string }) {
    /* Vértices del hexagrama (estrella de David) en SVG 0-100. */
    const hexPoints = (radius: number, rotDeg = 0): string => {
        const pts: string[] = []
        for (let i = 0; i < 6; i++) {
            const a =
                ((rotDeg * Math.PI) / 180) - Math.PI / 2 + (i / 6) * 2 * Math.PI
            pts.push(
                `${50 + Math.cos(a) * radius},${50 + Math.sin(a) * radius}`
            )
        }
        return pts.join(" ")
    }

    return (
        <div
            style={{
                position: "relative",
                width: 220,
                height: 220,
                pointerEvents: "none",
            }}
        >
            {/* Halo radial de fondo */}
            <div
                style={{
                    position: "absolute",
                    inset: -30,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${hx(accent, 0.18)} 0%, ${hx(accent, 0.05)} 45%, transparent 75%)`,
                    filter: "blur(6px)",
                }}
            />

            {/* Anillos concéntricos rotantes - capa más exterior */}
            <motion.svg
                viewBox="0 0 100 100"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 32,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke={hx(accent, 0.35)}
                    strokeWidth="0.5"
                    strokeDasharray="2 4"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={hx(accent, 0.25)}
                    strokeWidth="0.4"
                    strokeDasharray="1 3"
                />
            </motion.svg>

            {/* Anillo medio contra-rotante con tick marks */}
            <motion.svg
                viewBox="0 0 100 100"
                animate={{ rotate: -360 }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    inset: 8,
                    width: "calc(100% - 16px)",
                    height: "calc(100% - 16px)",
                }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke={hx(accent, 0.55)}
                    strokeWidth="0.6"
                    strokeDasharray="4 8"
                />
                {/* Tick marks cada 30 grados */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i / 12) * 2 * Math.PI - Math.PI / 2
                    const x1 = 50 + Math.cos(a) * 46
                    const y1 = 50 + Math.sin(a) * 46
                    const x2 = 50 + Math.cos(a) * 42
                    const y2 = 50 + Math.sin(a) * 42
                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={accent}
                            strokeWidth="0.6"
                            opacity={0.7}
                        />
                    )
                })}
            </motion.svg>

            {/* Hexágono externo rotando lento */}
            <motion.svg
                viewBox="0 0 100 100"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 26,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    inset: 18,
                    width: "calc(100% - 36px)",
                    height: "calc(100% - 36px)",
                }}
            >
                <polygon
                    points={hexPoints(38, 0)}
                    fill={hx(accent, 0.04)}
                    stroke={hx(accent, 0.7)}
                    strokeWidth="0.7"
                    strokeLinejoin="round"
                />
            </motion.svg>

            {/* Estrella de David (hexagrama) — dos triángulos
               superpuestos con rotaciones opuestas */}
            <motion.svg
                viewBox="0 0 100 100"
                animate={{ rotate: -360 }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    inset: 28,
                    width: "calc(100% - 56px)",
                    height: "calc(100% - 56px)",
                }}
            >
                <defs>
                    <radialGradient id="cf-core-grad" cx="50%" cy="40%">
                        <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="36" fill="url(#cf-core-grad)" />
                {/* Triángulo apuntando arriba */}
                <polygon
                    points={hexPoints(28, 0).split(" ").filter((_, i) => i % 2 === 0).join(" ")}
                    fill="none"
                    stroke={accent}
                    strokeWidth="1"
                    strokeLinejoin="round"
                    opacity={0.85}
                />
                {/* Triángulo apuntando abajo */}
                <polygon
                    points={hexPoints(28, 60).split(" ").filter((_, i) => i % 2 === 0).join(" ")}
                    fill="none"
                    stroke={accent}
                    strokeWidth="1"
                    strokeLinejoin="round"
                    opacity={0.85}
                />
                {/* Vértices del hexagrama con puntos pulsantes */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const a = (i / 6) * 2 * Math.PI - Math.PI / 2
                    const x = 50 + Math.cos(a) * 28
                    const y = 50 + Math.sin(a) * 28
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1.6"
                            fill={accent}
                        />
                    )
                })}
                {/* Hexágono interno sólido */}
                <polygon
                    points={hexPoints(12, 30)}
                    fill={hx(accent, 0.25)}
                    stroke={accent}
                    strokeWidth="0.7"
                />
            </motion.svg>

            {/* Hot core — punto incandescente que respira en el centro */}
            <motion.div
                animate={{
                    opacity: [0.7, 1, 0.7],
                    scale: [0.85, 1.2, 0.85],
                }}
                transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, #fff 0%, ${accent} 50%, transparent 100%)`,
                    boxShadow: `0 0 16px ${accent}, 0 0 32px ${hx(accent, 0.6)}`,
                }}
            />
        </div>
    )
}

/* Partículas binarias — caracteres que viajan desde el borde hacia
   el núcleo simulando "código fluyendo a la materialización". rAF
   directo en DOM (sin re-renders de React) para fluidez en mobile. */
function BinaryParticles({
    accent,
    count = 14,
}: {
    accent: string
    count?: number
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const particleRefs = useRef<(HTMLDivElement | null)[]>([])
    /* Estado por partícula (vive en ref, no en React state). */
    const stateRef = useRef<
        Array<{
            startTime: number
            duration: number
            angle: number
            radius: number
            char: string
            delay: number
        }>
    >([])

    useEffect(() => {
        const chars = ["0", "1", "0", "1", "✦", "◇", "△", "○", "◉"]
        const seed = (i: number) => {
            const r1 = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1
            const r2 = (Math.sin(i * 43.21 + 12.345) * 12345.678) % 1
            const r3 = (Math.sin(i * 99.99 + 1.111) * 99999) % 1
            return [Math.abs(r1), Math.abs(r2), Math.abs(r3)]
        }
        stateRef.current = Array.from({ length: count }).map((_, i) => {
            const [r1, r2, r3] = seed(i)
            return {
                startTime: -r1 * 4,
                duration: 3.5 + r2 * 2.5,
                angle: r3 * Math.PI * 2,
                radius: 90 + r1 * 60,
                char: chars[Math.floor(r2 * chars.length)],
                delay: i * 0.18,
            }
        })

        let rafId = 0
        const start = performance.now()
        const tick = () => {
            const t = (performance.now() - start) / 1000
            for (let i = 0; i < count; i++) {
                const el = particleRefs.current[i]
                const s = stateRef.current[i]
                if (!el || !s) continue
                /* Progreso 0..1 ciclando con loop. */
                const elapsed = t - s.startTime
                const cycle = (elapsed % s.duration) / s.duration
                /* Ease-in para que aceleren al acercarse al núcleo. */
                const eased = Math.pow(cycle, 1.4)
                /* Posición radial: empieza lejos, termina cerca del 0. */
                const r = s.radius * (1 - eased)
                const x = Math.cos(s.angle) * r
                const y = Math.sin(s.angle) * r
                /* Opacidad: aparece al 10%, máximo al 50%, desaparece
                   al final cuando llega al núcleo. */
                let opacity = 0
                if (cycle < 0.1) opacity = cycle * 8
                else if (cycle < 0.7) opacity = 0.8
                else opacity = (1 - cycle) / 0.3 * 0.8
                el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${0.6 + (1 - eased) * 0.4})`
                el.style.opacity = String(Math.max(0, Math.min(1, opacity)))
                /* Cuando completa un ciclo, le tocan nuevos randoms
                   para variar la trayectoria. */
                if (cycle < 0.02 && elapsed > s.duration) {
                    const newSeed = seed(i + Math.floor(t * 7))
                    s.angle = newSeed[2] * Math.PI * 2
                    s.radius = 90 + newSeed[0] * 60
                    s.char = chars[Math.floor(newSeed[1] * chars.length)]
                    s.startTime = t
                    s.duration = 3.5 + newSeed[1] * 2.5
                    el.textContent = s.char
                }
            }
            rafId = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(rafId)
    }, [count])

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
            }}
        >
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        particleRefs.current[i] = el
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: accent,
                        textShadow: `0 0 6px ${accent}, 0 0 12px ${hx(accent, 0.6)}`,
                        whiteSpace: "nowrap",
                        willChange: "transform, opacity",
                    }}
                >
                    {stateRef.current[i]?.char ?? "0"}
                </div>
            ))}
        </div>
    )
}

/* Scan line diagonal — barra fina que cruza el lienzo periódicamente
   simulando lectura/escaneo del sistema. */
function ScanLine({
    accent,
    delay = 0,
    direction = "ltr",
}: {
    accent: string
    delay?: number
    direction?: "ltr" | "rtl"
}) {
    return (
        <motion.div
            initial={{
                x: direction === "ltr" ? "-100%" : "100%",
                opacity: 0,
            }}
            animate={{
                x: direction === "ltr" ? "100%" : "-100%",
                opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
                duration: 4.5,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.15, 0.85, 1],
                repeatDelay: 2,
            }}
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent 0%, ${hx(accent, 0.7)} 30%, ${accent} 50%, ${hx(accent, 0.7)} 70%, transparent 100%)`,
                boxShadow: `0 0 8px ${accent}, 0 0 16px ${hx(accent, 0.6)}`,
                pointerEvents: "none",
            }}
        />
    )
}

/* ═══ v2.49 — Wrapper móvil del Navegante de la Red.
       Crea el contenedor full-bleed donde el simulador toma el control
       completo (canvas + HUD + controles táctiles). El header
       "HOLOTECA · SIMULADORES" aparece superpuesto en la esquina
       superior izquierda, con tap-area invisible (ya provista por el
       botón fixed de la sección activeTab) que devuelve al grid de
       Holoteca. ═══ */
/* ═══ v2.55 — SelectorSimuladores ═══
   Selector inmersivo previo al simulador. Desde acá el Tripulante
   elige entre Navegante de la Red (público) y Domo Cero (admin-only,
   handoff JWT a `domo-client.vercel.app`). Mismo lenguaje visual que
   el resto de la Holoteca: título "HOLOTECA · SIMULADORES" en la
   esquina top-left con respiración, fondo ambient con grid sutil +
   particulas cyan, cards grandes con icono vectorial latente.
   La card Navegante usa accent cyan #00C2FF (consistente con el resto
   del set Holoteca). DOMO CERO usa morado #A78BFA. */
const DOMO_CARD_ACCENT_LARGE = "#A78BFA"
function SelectorSimuladores({
    /* v2.56 — Defaults defensivos para que Framer pueda instanciar
       standalone sin crashear (memoria feedback_framer_props_defaults).
       Sin esto el publish disparaba "Publishing blocked by 22 blocking
       errors" global porque hx(accent, ...) con accent undefined
       intenta accent.replace y revienta. */
    onPickNavegante = () => {},
    onPickDomoCero = () => {},
    isAdmin = false,
    accent = "#00C2FF",
}: {
    onPickNavegante?: () => void
    onPickDomoCero?: () => void
    isAdmin?: boolean
    accent?: string
}) {
    return (
        <div
            style={{
                width: "100%",
                minHeight: "calc(100dvh - 140px)",
                padding: "0 16px 24px",
                fontFamily: "'Inter', sans-serif",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Título HOLOTECA · SIMULADORES con respiración */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                    textAlign: "left",
                    paddingLeft: 0,
                    /* env(safe-area-inset-top) empuja cada título por la
                       altura del notch SOLO en PWA standalone iOS. En la
                       web normal env() resuelve a 0 y el marginTop queda
                       en 4 — sin cambios visuales. */
                    marginTop:
                        "calc(4px + env(safe-area-inset-top, 0px))",
                    flexShrink: 0,
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        fontWeight: 200,
                        letterSpacing: "0.22em",
                        marginRight: "-0.22em",
                        textTransform: "uppercase",
                        margin: 0,
                        lineHeight: 1,
                        color: "transparent",
                        filter: `drop-shadow(0 0 10px ${hx(accent, 0.3)})`,
                        WebkitFontSmoothing: "antialiased",
                        animation: "nuc-breath 7s ease-in-out infinite",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        HOLOTECA · SIMULADORES
                    </span>
                </h1>
            </motion.div>

            {/* Subtítulo + descripción ambiental */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0.6,
                    delay: 0.15,
                    ease: "easeOut",
                }}
                style={{
                    margin: "20px 0 0 0",
                    color: "rgba(180, 220, 235, 0.65)",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    letterSpacing: "0.02em",
                    maxWidth: 360,
                }}
            >
                Tu campo de prácticas inmersivas. Selecciona el
                simulador en el que vas a entrenar.
            </motion.p>

            {/* Cards de simulador */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 18,
                    paddingTop: 24,
                    paddingBottom: 16,
                    maxWidth: 420,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                <SimuladorCardLarge
                    label="Navegante de la Red"
                    description="Veinte membranas frecuenciales. Sintoniza tu campo y abre portales dimensionales."
                    icon={
                        <IconSimuladores
                            color={HOLO_CARD_ACCENT}
                            size={48}
                        />
                    }
                    accent={HOLO_CARD_ACCENT}
                    onClick={onPickNavegante}
                    delay={0.3}
                />

                {isAdmin && (
                    <SimuladorCardLarge
                        label="Domo Cero"
                        description="Universo multitripulante en tiempo real. Encuéntrate y enlaza con otros."
                        badge="ADMIN"
                        icon={
                            <IconDomoCero
                                color={DOMO_CARD_ACCENT_LARGE}
                                size={48}
                            />
                        }
                        accent={DOMO_CARD_ACCENT_LARGE}
                        onClick={onPickDomoCero}
                        delay={0.45}
                    />
                )}
            </div>
        </div>
    )
}

/* ═══ v2.55 — SimuladorCardLarge ═══
   Card horizontal grande estilo "console card": icono a la izquierda
   en un círculo glowing, texto a la derecha (label en mayúsculas +
   descripción). Borde + halo + shimmer matching la línea visual del
   set Holoteca. Botón completo es target táctil — sin ambigüedad. */
function SimuladorCardLarge({
    /* v2.56 — Defaults defensivos para evitar crash al instanciar
       standalone en Framer (hx(accent,...) requiere string). */
    label = "",
    description = "",
    icon = null,
    accent = "#00C2FF",
    onClick = () => {},
    delay = 0,
    badge,
}: {
    label?: string
    description?: string
    icon?: React.ReactNode
    accent?: string
    onClick?: () => void
    delay?: number
    badge?: string
}) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay }}
            onClick={onClick}
            type="button"
            style={{
                width: "100%",
                minHeight: 130,
                padding: "16px 18px",
                borderRadius: 22,
                border: `1px solid ${hx(accent, 0.45)}`,
                background: `linear-gradient(135deg, ${hx(accent, 0.12)}, ${hx(accent, 0.04)} 60%, ${hx(accent, 0.1)})`,
                boxShadow: `0 14px 36px ${hx(accent, 0.18)}, inset 0 0 30px ${hx(accent, 0.08)}`,
                color: "#fff",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                gap: 18,
                textAlign: "left",
                fontFamily: "'Inter', sans-serif",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {/* Shimmer diagonal */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "-30%",
                    left: "-50%",
                    width: "60%",
                    height: "60%",
                    background: `linear-gradient(115deg, transparent, ${hx(accent, 0.45)}, transparent)`,
                    filter: "blur(8px)",
                    transform: "rotate(8deg)",
                    pointerEvents: "none",
                }}
                animate={{ left: ["-50%", "130%"] }}
                transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay * 1.2,
                }}
            />

            {/* Icono en círculo glowing */}
            <div
                style={{
                    flexShrink: 0,
                    width: 78,
                    height: 78,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, ${hx(accent, 0.32)}, ${hx(accent, 0.08)} 70%, transparent)`,
                    border: `1px solid ${hx(accent, 0.4)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `inset 0 0 20px ${hx(accent, 0.18)}, 0 0 24px ${hx(accent, 0.25)}`,
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {icon}
            </div>

            {/* Texto */}
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: accent,
                            textShadow: `0 0 12px ${hx(accent, 0.55)}`,
                            lineHeight: 1.2,
                        }}
                    >
                        {label}
                    </span>
                    {badge && (
                        <span
                            style={{
                                fontSize: 8.5,
                                fontWeight: 700,
                                letterSpacing: "0.22em",
                                padding: "2px 8px",
                                borderRadius: 999,
                                border: `1px solid ${hx(accent, 0.5)}`,
                                color: accent,
                                background: hx(accent, 0.12),
                            }}
                        >
                            {badge}
                        </span>
                    )}
                </div>
                <p
                    style={{
                        margin: 0,
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        color: "rgba(220, 238, 252, 0.75)",
                        letterSpacing: "0.01em",
                    }}
                >
                    {description}
                </p>
            </div>

            {/* Chevron */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    flexShrink: 0,
                    color: hx(accent, 0.7),
                    fontSize: 22,
                    fontWeight: 200,
                    paddingRight: 4,
                }}
            >
                ›
            </div>
        </motion.button>
    )
}

function SimuladoresShellMobile({
    onExit,
    supabaseUrl,
    supabaseAnonKey,
}: {
    onExit: () => void
    supabaseUrl?: string
    supabaseAnonKey?: string
}) {
    /* v2.53 — El título "HOLOTECA · SIMULADORES" fue eliminado del
       wrapper porque parpadeaba al transitar entre la consola y el
       juego. Por eso el state `hideHeader` y su listener al evento
       `rsv-navegante-fullscreen` también se removieron acá — el
       evento sigue siendo escuchado por el shell principal de
       AppNavegacionMobile para esconder la BottomNav y la tap-area. */
    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                background:
                    "radial-gradient(circle at center,#0a001f 0%,#000415 70%,#000 100%)",
                overflow: "hidden",
            }}
        >
            {/* v2.53 — Título "HOLOTECA · SIMULADORES" eliminado.
                Antes parpadeaba al transitar entre la consola y el
                juego (fade 220ms del opacity), confundiendo la
                experiencia. La tap-area invisible que captura el
                regreso a la grid sigue activa — vive en el shell
                principal de AppNavegacionMobile, no en este wrapper. */}
            {/* v2.49.3 — No pasamos forceMobile: el simulador autodetecta
                por UA + viewport en su rama [LENTE] (useIsMobileViewport
                interno). Evita inflar la API pública del componente. */}
            <NaveganteDeLaRed
                sfxEnabled={true}
                onExit={onExit}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
            />
        </div>
    )
}

/* ═══ v2.56 — SimuladoresPublicMobile ═══
   Versión standalone del flujo Simuladores para la raíz pública
   (`/simuladores`, entrada desde Origen mobile). NO monta ni la
   BottomNav del Escáner ni el prefijo "HOLOTECA · ...". Pinta un
   título grande "SIMULADORES" estilo Códices/Meditaciones arriba,
   y debajo el SelectorSimuladores. Picar "Navegante de la Red"
   abre el SimuladoresShellMobile fullscreen; "Domo Cero" hace
   el handoff JWT. Se usa como render del case `/simuladores` en
   Domo cuando isMobile=true. */
function SimuladoresPublicMobile({
    accent = "#00C2FF",
    supabaseUrl = "",
    supabaseAnonKey = "",
}: {
    accent?: string
    supabaseUrl?: string
    supabaseAnonKey?: string
}) {
    const [pick, setPick] = useState<"selector" | "navegante">("selector")
    const { isAdmin } = useAdminAuth(supabaseUrl, supabaseAnonKey)

    /* Handoff JWT al cliente del Domo Cero — copia exacta del
       handoffDomoCero del shell principal. Mantiene el patrón
       documented en CLAUDE.md (template "domo" → "mmsor" → estándar). */
    const handoffDomoCero = useCallback(() => {
        if (typeof window === "undefined") return
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
            const sep = DOMO_CLIENT_URL.includes("#") ? "&" : "#"
            window.location.assign(
                `${DOMO_CLIENT_URL}${sep}token=${encodeURIComponent(token)}`
            )
        })
    }, [])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                minHeight: "100dvh",
                background:
                    "radial-gradient(circle at center, #02050E 0%, #000 80%)",
                overflow: "hidden",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {pick === "selector" && (
                <div
                    style={{
                        width: "100%",
                        minHeight: "100dvh",
                        display: "flex",
                        flexDirection: "column",
                        padding:
                            "calc(env(safe-area-inset-top, 0px) + 56px) 16px calc(env(safe-area-inset-bottom, 0px) + 24px)",
                    }}
                >
                    {/* Título grande "SIMULADORES" centrado, estilo
                        equivalente al hero de Códices/Meditaciones del
                        Lente. nuc-breath para coherencia con el resto. */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 8,
                            flexShrink: 0,
                        }}
                    >
                        <h1
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 28,
                                fontWeight: 200,
                                letterSpacing: "0.18em",
                                margin: 0,
                                lineHeight: 1.1,
                                textTransform: "uppercase",
                                color: "transparent",
                                background: `linear-gradient(180deg, ${accent}, #fff)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                filter: `drop-shadow(0 0 18px ${hx(accent, 0.45)})`,
                                animation:
                                    "nuc-breath 7s ease-in-out infinite",
                                textAlign: "center",
                            }}
                        >
                            SIMULADORES
                        </h1>
                        <p
                            style={{
                                margin: 0,
                                color: "rgba(180, 220, 235, 0.55)",
                                fontSize: 12,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                textAlign: "center",
                            }}
                        >
                            Campo de prácticas inmersivas
                        </p>
                    </motion.div>

                    {/* SelectorSimuladores reusado adentro de un wrapper
                        flex que lo centra verticalmente. El propio
                        Selector pinta su título "HOLOTECA · SIMULADORES"
                        — lo OCULTAMOS overlapando con visibility hidden
                        en el primer h1 vía CSS interno: en lugar de eso,
                        copiamos el render de las cards directamente acá
                        para mantener control total del layout. */}
                    <SimuladoresSelectorCardsOnly
                        isAdmin={!!isAdmin}
                        onPickNavegante={() => setPick("navegante")}
                        onPickDomoCero={handoffDomoCero}
                    />

                    {/* Inyección minima de keyframe nuc-breath por si el
                        consumer no carga el CSS global. */}
                    <style>{`
                        @keyframes nuc-breath {
                            0%, 100% { filter: brightness(1) drop-shadow(0 0 18px ${hx(accent, 0.45)}); }
                            50% { filter: brightness(1.15) drop-shadow(0 0 24px ${hx(accent, 0.6)}); }
                        }
                    `}</style>
                </div>
            )}
            {pick === "navegante" && (
                <SimuladoresShellMobile
                    onExit={() => setPick("selector")}
                    supabaseUrl={supabaseUrl}
                    supabaseAnonKey={supabaseAnonKey}
                />
            )}
        </div>
    )
}

/* Solo las dos cards horizontales del selector (sin título HOLOTECA · ...)
   para que SimuladoresPublicMobile use el header propio. */
function SimuladoresSelectorCardsOnly({
    isAdmin = false,
    onPickNavegante = () => {},
    onPickDomoCero = () => {},
}: {
    isAdmin?: boolean
    onPickNavegante?: () => void
    onPickDomoCero?: () => void
}) {
    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 18,
                paddingTop: 24,
                paddingBottom: 16,
                maxWidth: 420,
                margin: "0 auto",
                width: "100%",
            }}
        >
            <SimuladorCardLarge
                label="Navegante de la Red"
                description="Veinte membranas frecuenciales. Sintoniza tu campo y abre portales dimensionales."
                icon={
                    <IconSimuladores color={HOLO_CARD_ACCENT} size={48} />
                }
                accent={HOLO_CARD_ACCENT}
                onClick={onPickNavegante}
                delay={0.3}
            />
            {isAdmin && (
                <SimuladorCardLarge
                    label="Domo Cero"
                    description="Universo multitripulante en tiempo real. Encuéntrate y enlaza con otros."
                    badge="ADMIN"
                    icon={
                        <IconDomoCero
                            color={DOMO_CARD_ACCENT_LARGE}
                            size={48}
                        />
                    }
                    accent={DOMO_CARD_ACCENT_LARGE}
                    onClick={onPickDomoCero}
                    delay={0.45}
                />
            )}
        </div>
    )
}

/* v2.49.6 — Calibración de progreso REAL para Códigos Fuente.
   Anclaje 0 (20 %) = 2026-07-05 (re-anclado; el contenido aún no está
   listo, se regresó del 99 %). Cada día suma 2 puntos al porcentaje
   (8192 nodos totales al 99 %). El cap del porcentaje queda
   en 99 % — el campo nunca cierra al 100 % mientras la red siga
   creciendo. La frecuencia base sigue oscilando vivamente (efecto
   visual), pero la base sube en sincronía con el progreso. */
const CODIGOS_FUENTE_BASE_DATE = new Date(2026, 6, 5) // 5 jul 2026 (re-anclado)
const CODIGOS_FUENTE_BASE_PCT = 20
const CODIGOS_FUENTE_DAILY_PCT = 2
const CODIGOS_FUENTE_TOTAL_NODOS = 8192
const CODIGOS_FUENTE_CAP = 99

function computeCodigosFuenteAnchor(now = Date.now()) {
    const ms = now - CODIGOS_FUENTE_BASE_DATE.getTime()
    const days = Math.max(0, Math.floor(ms / 86_400_000))
    const pct = Math.min(
        CODIGOS_FUENTE_CAP,
        CODIGOS_FUENTE_BASE_PCT + days * CODIGOS_FUENTE_DAILY_PCT
    )
    const nodos = Math.floor(
        (pct / CODIGOS_FUENTE_CAP) * CODIGOS_FUENTE_TOTAL_NODOS
    )
    return { pct, nodos, days }
}

function CodigosFuenteAnclaje({ accent }: { accent: string }) {
    /* Stats vivos: progress real (días desde apertura) + nodos
       proporcionales + freq wobble micro encima del piso real. rAF
       directo en refs DOM para no triggerear re-renders del shell. */
    const progressRef = useRef<HTMLDivElement>(null)
    const progressTextRef = useRef<HTMLSpanElement>(null)
    const nodesTextRef = useRef<HTMLSpanElement>(null)
    const freqTextRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        let rafId = 0
        const start = performance.now()
        /* Anchor REAL: snapshot al mount. Recalculamos al cruzar
           medianoche para que el contador suba sin recargar la app. */
        let anchor = computeCodigosFuenteAnchor()
        let displayPct = anchor.pct
        let displayNodos = anchor.nodos
        const tick = () => {
            const t = (performance.now() - start) / 1000
            /* Refrescamos anchor cada 30 s — barato y suficiente para
               cruzar medianoche. */
            if (Math.floor(t * 1000) % 30000 < 16) {
                anchor = computeCodigosFuenteAnchor()
            }
            /* Easing soft del piso real para que la barra "respire"
               ±0.4 % en lugar de quedar congelada. */
            const targetPct = anchor.pct
            const wobblePct =
                Math.sin(t * 0.32) * 0.25 + Math.sin(t * 1.1) * 0.15
            displayPct =
                Math.min(CODIGOS_FUENTE_CAP, targetPct + wobblePct)
            displayNodos = Math.floor(
                (displayPct / CODIGOS_FUENTE_CAP) *
                    CODIGOS_FUENTE_TOTAL_NODOS
            )
            if (progressRef.current) {
                progressRef.current.style.width = `${displayPct}%`
            }
            if (progressTextRef.current) {
                progressTextRef.current.textContent = `${displayPct.toFixed(1)}%`
            }
            if (nodesTextRef.current) {
                nodesTextRef.current.textContent = `${displayNodos.toLocaleString("en-US")} / ${CODIGOS_FUENTE_TOTAL_NODOS.toLocaleString("en-US")}`
            }
            if (freqTextRef.current) {
                /* Freq base sube linealmente con el progreso real:
                   piso 624 Hz al 15 % → 832 Hz al 99 %. */
                const baseFreq =
                    624 + ((targetPct - 15) / 84) * (832 - 624)
                const wobble =
                    Math.sin(t * 0.7) * 4.2 + Math.sin(t * 2.3) * 1.1
                freqTextRef.current.textContent = `${(baseFreq + wobble).toFixed(2)} Hz`
            }
            rafId = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(rafId)
    }, [])

    return (
        <div
            style={{
                width: "100%",
                minHeight: "calc(100dvh - 140px)",
                padding: "0 16px 24px",
                fontFamily: "'Inter',sans-serif",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Título HOLOTECA · CÓDIGOS FUENTE */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                    textAlign: "left",
                    paddingLeft: 0,
                    /* env(safe-area-inset-top) empuja cada título por la
                       altura del notch SOLO en PWA standalone iOS. En la
                       web normal env() resuelve a 0 y el marginTop queda
                       en 4 — sin cambios visuales. */
                    marginTop:
                        "calc(4px + env(safe-area-inset-top, 0px))",
                    flexShrink: 0,
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 14,
                        fontWeight: 200,
                        letterSpacing: "0.22em",
                        marginRight: "-0.22em",
                        textTransform: "uppercase",
                        margin: 0,
                        lineHeight: 1,
                        color: "transparent",
                        filter: `drop-shadow(0 0 10px ${hx(accent, 0.3)})`,
                        WebkitFontSmoothing: "antialiased",
                        animation: "nuc-breath 7s ease-in-out infinite",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            background: `linear-gradient(180deg, ${accent}, #fff)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        HOLOTECA · CÓDIGOS FUENTE
                    </span>
                </h1>
            </motion.div>

            {/* Lienzo central con núcleo + partículas + scan lines */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    minHeight: 380,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingTop: 24,
                    overflow: "hidden",
                }}
            >
                {/* Grid sutil de fondo */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `linear-gradient(${hx(accent, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${hx(accent, 0.05)} 1px, transparent 1px)`,
                        backgroundSize: "32px 32px",
                        maskImage:
                            "radial-gradient(circle at center, black 30%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(circle at center, black 30%, transparent 80%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Scan lines arriba/abajo del núcleo */}
                <div
                    style={{
                        position: "absolute",
                        top: 60,
                        left: 0,
                        right: 0,
                        height: 1,
                        overflow: "hidden",
                    }}
                >
                    <ScanLine accent={accent} delay={0} direction="ltr" />
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: 320,
                        left: 0,
                        right: 0,
                        height: 1,
                        overflow: "hidden",
                    }}
                >
                    <ScanLine accent={accent} delay={2.2} direction="rtl" />
                </div>

                {/* Núcleo cristalino + partículas binarias en el centro */}
                <div
                    style={{
                        position: "relative",
                        width: 240,
                        height: 240,
                        marginTop: 12,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <CrystalCore accent={accent} />
                    </div>
                    <BinaryParticles accent={accent} count={14} />
                </div>

                {/* Mensaje principal */}
                <div
                    style={{
                        marginTop: 28,
                        textAlign: "center",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <motion.h2
                        animate={{
                            textShadow: [
                                `0 0 12px ${hx(accent, 0.5)}`,
                                `0 0 22px ${hx(accent, 0.85)}, 0 0 38px ${hx(accent, 0.4)}`,
                                `0 0 12px ${hx(accent, 0.5)}`,
                            ],
                        }}
                        transition={{
                            duration: 3.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 200,
                            letterSpacing: "0.42em",
                            marginRight: "-0.42em",
                            textTransform: "uppercase",
                            color: accent,
                        }}
                    >
                        En proceso de anclaje
                    </motion.h2>

                    {/* Barra de progreso pulsante */}
                    <div
                        style={{
                            position: "relative",
                            marginTop: 14,
                            width: 240,
                            height: 4,
                            borderRadius: 2,
                            background: hx(accent, 0.1),
                            overflow: "hidden",
                            marginLeft: "auto",
                            marginRight: "auto",
                            border: `1px solid ${hx(accent, 0.18)}`,
                        }}
                    >
                        <div
                            ref={progressRef}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: "0%",
                                background: `linear-gradient(90deg, ${hx(accent, 0.5)}, ${accent})`,
                                boxShadow: `0 0 10px ${hx(accent, 0.7)}`,
                                transition: "width 80ms linear",
                            }}
                        />
                    </div>

                    <p
                        style={{
                            margin: "16px 0 0",
                            fontSize: 11,
                            fontWeight: 300,
                            lineHeight: 1.6,
                            letterSpacing: "0.06em",
                            color: "rgba(214,245,255,0.62)",
                            maxWidth: 280,
                            marginLeft: "auto",
                            marginRight: "auto",
                        }}
                    >
                        Próximamente culminará su densificación.
                    </p>
                </div>

                {/* HUD técnico vivo — 3 líneas de telemetría */}
                <div
                    style={{
                        marginTop: 24,
                        padding: "12px 18px",
                        borderRadius: 10,
                        border: `1px solid ${hx(accent, 0.22)}`,
                        background: `linear-gradient(180deg, ${hx(accent, 0.04)} 0%, transparent 100%)`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "rgba(255,255,255,0.55)",
                        position: "relative",
                        zIndex: 1,
                        minWidth: 240,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                        }}
                    >
                        <span>Progreso</span>
                        <span
                            ref={progressTextRef}
                            style={{ color: hx(accent, 0.95) }}
                        >
                            0.0%
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                        }}
                    >
                        <span>Nodos</span>
                        <span
                            ref={nodesTextRef}
                            style={{ color: hx(accent, 0.95) }}
                        >
                            0 / 8,192
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                        }}
                    >
                        <span>Frecuencia</span>
                        <span
                            ref={freqTextRef}
                            style={{ color: hx(accent, 0.95) }}
                        >
                            728.45 Hz
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                            paddingTop: 4,
                            borderTop: `1px dashed ${hx(accent, 0.18)}`,
                        }}
                    >
                        <span>Estado</span>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                color: "#FF3B5C",
                            }}
                        >
                            <motion.span
                                animate={{
                                    opacity: [0.4, 1, 0.4],
                                    scale: [1, 1.3, 1],
                                }}
                                transition={{
                                    duration: 1.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "#FF3B5C",
                                    boxShadow: "0 0 8px #FF3B5C",
                                    display: "inline-block",
                                }}
                            />
                            Densificando
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ═══ Bottom nav — 5 tabs estilo Cyber-Zen ═══
   Replica exacta del Dock del Escáner Vibracional (mismo gradiente
   azul oscuro + cyan, shimmer fantasma, glow al activo, blur). El
   único cambio es el set de botones: 5 en lugar de 4.
   v2.13 — Drag-to-pick: cuando el tripulante mantiene el dedo sobre
   la nav y arrastra entre tabs, cada tab por debajo del dedo se
   activa al instante (sin esperar al touchend). Diego pidió este
   patrón nativo (la activación pasa al picar, no al soltar) para que
   se sienta como un selector de contacto. La hit-test usa
   document.elementFromPoint sobre el data-attribute del botón;
   funciona tanto en touch real como en pointer events. */
function BottomNav({
    active,
    onChange,
    accent,
    hidden,
}: {
    active: Tab
    onChange: (t: Tab) => void
    accent: string
    hidden: boolean
}) {
    const items: [Tab, React.ReactNode, string][] = [
        ["radar", <IEscaner />, "Radar"],
        ["modulos", <IMod />, "Calibración"],
        ["holoteca", <IHoloteca />, "Holoteca"],
        ["decodificador", <IDecoder />, "Decodificador"],
        ["nucleo", <INucleo />, "Núcleo"],
    ]
    const lastActivatedRef = useRef<Tab | null>(null)
    const isTouchingRef = useRef(false)
    const navInnerRef = useRef<HTMLDivElement>(null)
    /* Modo inmersivo del Decodificador de Sueños: la revelación (constelación
       + lectura + calibración) desvanece la BottomNav; la carta final la
       restaura. Espeja el comportamiento de la app (AppShellMobile). */
    const [immersiveHidden, setImmersiveHidden] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const on = () => setImmersiveHidden(true)
        const off = () => setImmersiveHidden(false)
        window.addEventListener("rsv-immersive-on", on)
        window.addEventListener("rsv-immersive-off", off)
        return () => {
            window.removeEventListener("rsv-immersive-on", on)
            window.removeEventListener("rsv-immersive-off", off)
        }
    }, [])
    /* #1 El campo respira contigo — el glow ambiental en reposo de la
       barra late con el tempo + color del Índice de Luz (alto = lento +
       dorado + amplio; bajo = corto + frío). Capa decorativa pura, detrás
       de los tabs y de la onda táctil #3, sin capturar toques. */
    const lightIndex = useLightIndex()
    useEffect(() => {
        ensureBreatheCss()
    }, [])
    const bp = breathParams(lightIndex)
    /* v2.39 — Motor del long-press cambiado de setTimeout a un loop
       de requestAnimationFrame. iOS suspende setTimeout cuando arranca
       su pipeline de selección, pero rAF sigue tickando mientras la
       pestaña esté visible. El loop también monitorea movimiento
       vivo del dedo y arma el círculo desde adentro (no closure
       stale). Threshold subido a 28px (un dedo en iPhone tiembla
       ~10-15px naturalmente). */
    const LONG_PRESS_MS = 1000
    const LONG_PRESS_MOVE_TOLERANCE_PX = 28
    const pressStartTsRef = useRef<number | null>(null)
    const pressStartCoordsRef = useRef<{ x: number; y: number } | null>(
        null
    )
    const lastPointerCoordsRef = useRef<{ x: number; y: number } | null>(
        null
    )
    const pressActiveRef = useRef<boolean>(false)
    const rafIdRef = useRef<number | null>(null)
    const logoutTargetRef = useRef<HTMLDivElement | null>(null)
    const logoutArmedRef = useRef<boolean>(false)
    const logoutOverTargetRef = useRef<boolean>(false)
    /* v2.41 — Coordenadas del centro del tab Núcleo, calculadas al
       armar el gesto. Permite posicionar el círculo justo encima sin
       depender de `right: 10vw` que descuadraba en viewports
       distintos. */
    const [armedAnchor, setArmedAnchor] = useState<
        { centerX: number; topY: number } | null
    >(null)
    const [logoutGestureState, setLogoutGestureStateRaw] = useState<
        "idle" | "armed"
    >("idle")
    const [logoutOverTarget, setLogoutOverTargetRaw] = useState(false)
    const setArmed = (armed: boolean) => {
        if (logoutArmedRef.current === armed) return
        logoutArmedRef.current = armed
        setLogoutGestureStateRaw(armed ? "armed" : "idle")
    }
    const setOverTarget = (over: boolean) => {
        if (logoutOverTargetRef.current === over) return
        logoutOverTargetRef.current = over
        setLogoutOverTargetRaw(over)
    }
    const stopPressLoop = () => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
        }
        pressActiveRef.current = false
        pressStartTsRef.current = null
    }
    const startPressLoop = () => {
        if (pressActiveRef.current) return
        pressActiveRef.current = true
        const tick = () => {
            if (!pressActiveRef.current) return
            const startTs = pressStartTsRef.current
            const startC = pressStartCoordsRef.current
            const lastC = lastPointerCoordsRef.current
            if (startTs === null || !startC || !lastC) {
                rafIdRef.current = requestAnimationFrame(tick)
                return
            }
            const dx = lastC.x - startC.x
            const dy = lastC.y - startC.y
            const dist = Math.hypot(dx, dy)
            if (dist > LONG_PRESS_MOVE_TOLERANCE_PX) {
                stopPressLoop()
                return
            }
            const elapsed = performance.now() - startTs
            if (elapsed >= LONG_PRESS_MS && !logoutArmedRef.current) {
                /* v2.41 — Calcular posición del círculo: centro X del
                   tab Núcleo + top del nav inner. Asegura alineación
                   exacta sobre el botón en cualquier viewport. */
                const root = navInnerRef.current
                const nucleoBtn = root?.querySelector<HTMLElement>(
                    '[data-bottom-nav-tab="nucleo"]'
                )
                if (nucleoBtn && root) {
                    const r = nucleoBtn.getBoundingClientRect()
                    const navR = root.getBoundingClientRect()
                    setArmedAnchor({
                        centerX: r.left + r.width / 2,
                        topY: navR.top,
                    })
                }
                setArmed(true)
                try {
                    if (navigator.vibrate) navigator.vibrate(20)
                } catch {}
            }
            rafIdRef.current = requestAnimationFrame(tick)
        }
        rafIdRef.current = requestAnimationFrame(tick)
    }
    const isPointerOverLogoutTarget = (x: number, y: number): boolean => {
        const el = logoutTargetRef.current
        if (!el) return false
        const r = el.getBoundingClientRect()
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    const executeSignoutGesture = async () => {
        try {
            const clerk = (window as any).Clerk
            if (clerk?.session?.end) {
                await Promise.race([
                    clerk.session.end(),
                    new Promise((_, rej) =>
                        setTimeout(
                            () => rej(new Error("session.end timeout 1.2s")),
                            1200
                        )
                    ),
                ])
            } else if (clerk?.signOut) {
                await Promise.race([
                    clerk.signOut(),
                    new Promise((_, rej) =>
                        setTimeout(
                            () => rej(new Error("signOut timeout 1.2s")),
                            1200
                        )
                    ),
                ])
            }
        } catch (e) {
            console.warn("[bnav] long-press signout:", e)
        }
        try {
            window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
            window.dispatchEvent(new CustomEvent("rsv-signout-complete"))
        } catch {}
        try {
            const nav = (window as any).rsvNavigate
            if (nav) nav("/escaner")
            else window.location.href = "/escaner"
        } catch {}
    }
    /* v2.16 — Press-and-drag a la antigua: replica el patrón que ya
       tenía NavegadorLente legacy (hamburguesa). El secreto está en
       3 cosas:
       1. addEventListener("touchmove", ..., { passive: false }) para
          poder llamar e.preventDefault() y evitar que iOS cancele el
          touch al detectar pan/scroll. React synthetic touch events
          son passive:true por default — no sirven.
       2. touchAction:"none" en CSS para que iOS no intercepte el
          gesto antes de que llegue el handler.
       3. Hit-test por getBoundingClientRect (no elementFromPoint),
          predecible aunque el dedo cruce un span/motion.div hijo
          o haya capas de filter+blur encima.
       Con esto, picar un tab activa al instante, mover el dedo
       cambia al tab debajo, y soltar mantiene el último activo. */
    const findTabIdAt = (x: number, y: number): Tab | null => {
        const root = navInnerRef.current
        if (!root) return null
        const buttons = root.querySelectorAll<HTMLElement>(
            "[data-bottom-nav-tab]"
        )
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i]
            const r = btn.getBoundingClientRect()
            if (
                x >= r.left &&
                x <= r.right &&
                y >= r.top &&
                y <= r.bottom
            ) {
                return btn.getAttribute(
                    "data-bottom-nav-tab"
                ) as Tab | null
            }
        }
        return null
    }
    const dragActivate = (x: number, y: number) => {
        const id = findTabIdAt(x, y)
        if (!id) return
        if (id === lastActivatedRef.current) return
        lastActivatedRef.current = id
        /* #3 Resonancia táctil — onda de choque desde el punto exacto
           de contacto al activar un tab NUEVO (espejo de la app en
           AppShellMobile). DESPUÉS del guard lastActivatedRef → una sola
           onda por tab, no por cada pointermove. CSS-compositor. */
        try {
            fireTouchRipple(x, y, { color: "#00E5FF", size: 150 })
        } catch {}
        /* v2.28 — Quitamos el guard `if (id !== active)`. Cuando el
           BottomNav muestra "holoteca" como activo (porque activeTab
           es realmente una sub-tab interna como codices/meditaciones/
           etc), picar el botón Holoteca de nuevo NO disparaba onChange
           — el tripulante no podía volver al grid Holoteca desde una
           sub-capa. handleTabChange decide qué hacer (no-op si
           activeTab realmente coincide, change si no). */
        onChange(id)
    }
    /* v2.21 — Cross-component drag: cuando el dedo SALE del overlay
       de la barra hacia el contenido recién abierto, buscamos un
       elemento clickeable debajo (button, anchor, role=button o
       data-drag-target). Lo guardamos en dragTargetRef. Al soltar,
       si el último target sigue debajo del dedo, ejecutamos su
       .click() programático — equivalente a que el tripulante
       hubiera hecho tap. Patrón "mantén presionado en un tab,
       desliza al elemento de la capa, suelta y se activa". */
    const dragTargetRef = useRef<HTMLElement | null>(null)
    const findContentTargetAt = (
        x: number,
        y: number
    ): HTMLElement | null => {
        if (typeof document === "undefined") return null
        const el = document.elementFromPoint(x, y) as HTMLElement | null
        if (!el) return null
        const overlay = overlayRef.current
        if (overlay && overlay.contains(el)) return null
        /* v2.63 — Descartar elementos que vivan dentro del propio pill
           del nav (navInnerRef). Sin esto, los tabs internos (que tienen
           role="button") eran encontrados por el walk-up y disparaban
           un .click() programático con coords (0,0) — confirmado en la
           captura DevTools del 2026-05-07: cada tap registraba dos
           clicks, el sintético a (0,0) y el real a la coordenada del
           dedo. */
        const navInner = navInnerRef.current
        if (navInner && navInner.contains(el)) return null
        let node: HTMLElement | null = el
        while (node && node !== document.body) {
            const tag = node.tagName
            if (tag === "BUTTON" || tag === "A") return node
            if (node.getAttribute("role") === "button") return node
            if (node.dataset && node.dataset.dragTarget !== undefined)
                return node
            /* Si tiene un onclick listener directo (rare en React,
               pero algunos elementos lo tienen). */
            if ((node as any).onclick) return node
            node = node.parentElement
        }
        return null
    }
    /* v2.20 — Overlay invisible cubre la nav y captura via pointer
       events (touch + mouse + pen unificados). Mantenemos un
       touchmove manual con preventDefault como salvaguarda contra
       iOS Safari interpretando el gesto como pan/scroll —
       touch-action:none en CSS también ayuda pero algunas versiones
       de iOS lo ignoran si hay backdrop-filter en padres. */
    const overlayRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const overlay = overlayRef.current
        if (!overlay) return
        const onTouchMoveNative = (e: TouchEvent) => {
            if (!isTouchingRef.current) return
            if (e.cancelable) e.preventDefault()
        }
        overlay.addEventListener("touchmove", onTouchMoveNative, {
            passive: false,
        })
        return () => {
            overlay.removeEventListener(
                "touchmove",
                onTouchMoveNative as EventListener
            )
        }
    }, [])
    /* v2.62 — Estrategia agresiva contra el tap-offset cacheado por
       iOS PWA standalone:
       (a) Medimos env(safe-area-inset-bottom) vía probe DOM con
           getComputedStyle. La medición corre inmediata + a los 60 ms
           y 360 ms (algunos iOS resuelven env() en el segundo frame).
       (b) Una vez tenemos la medición, generamos un nonce que se usa
           como `key` del wrapper. iOS Safari trata el cambio de key
           como un nuevo elemento DOM y recomputa los hit areas desde
           cero — destruye el caché anterior. Sin esto, iOS conserva
           el hit area cacheado del primer paint aunque la posición
           visual cambie.
       (c) El pill se ancla con `bottom: <px>px` directo (no
           paddingBottom en un wrapper), así la posición es estable y
           no depende de un cálculo CSS que iOS pueda evaluar tarde.
       (d) Se elimina el animate `y: 20 → 0` (solo queda opacity); el
           transform residual de motion empujaba el hit area unos px
           abajo del rect visual durante toda la sesión. */
    const [safeBottomPx, setSafeBottomPx] = useState<number | null>(null)
    const [hitNonce, setHitNonce] = useState<number>(0)
    const lastSafePxRef = useRef<number | null>(null)
    useEffect(() => {
        if (typeof document === "undefined") return
        const measure = () => {
            const probe = document.createElement("div")
            probe.style.cssText =
                "position:fixed;bottom:0;left:0;width:1px;height:1px;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;"
            document.body.appendChild(probe)
            const computed = window.getComputedStyle(probe).paddingBottom
            const px = parseFloat(computed) || 0
            document.body.removeChild(probe)
            if (lastSafePxRef.current === px) return
            lastSafePxRef.current = px
            setSafeBottomPx(px)
            /* Bump del nonce cuando el valor real cambia → React
               desmonta/remonta el wrapper, iOS trata el elemento como
               nuevo y recomputa hit areas frescos. */
            setHitNonce((n) => n + 1)
        }
        measure()
        const t1 = window.setTimeout(measure, 60)
        const t2 = window.setTimeout(measure, 360)
        const t3 = window.setTimeout(measure, 1200)
        window.addEventListener("resize", measure)
        window.addEventListener("orientationchange", measure)
        return () => {
            window.clearTimeout(t1)
            window.clearTimeout(t2)
            window.clearTimeout(t3)
            window.removeEventListener("resize", measure)
            window.removeEventListener("orientationchange", measure)
        }
    }, [])
    const resolvedBottomPx =
        safeBottomPx !== null ? Math.max(12, safeBottomPx) : 12
    return (
        <>
        <AnimatePresence>
            {!(hidden || immersiveHidden) && (
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
                        zIndex: 200,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                        /* v2.64 — CSS env() directo en lugar de medición
                           JS. En PWA standalone iOS con viewport-fit=cover
                           desde el primer paint (bloque PWA v1.1), el
                           probe DOM via getComputedStyle puede devolver 0
                           hasta el primer reflow → resolvedBottomPx queda
                           en 12 → padding insuficiente para escapar los
                           ~34 px del home indicator. CSS env() no depende
                           de medición JS, iOS lo evalúa naturalmente.
                           El max(12px, env(...)) garantiza un piso de
                           12 px en navegadores sin safe-area (Brave web,
                           Android Chrome sin notch). */
                        paddingBottom:
                            "max(12px, env(safe-area-inset-bottom))",
                        /* v2.25 — user-select:none + touch-callout:none
                           en el wrapper externo de la BottomNav. Cubre
                           los espacios entre tabs (paddingBottom + gap)
                           que iOS Safari intentaba seleccionar como
                           texto al hacer press largo en la orillita. */
                        WebkitUserSelect: "none",
                        userSelect: "none",
                        WebkitTouchCallout: "none",
                    }}
                >
                    <div
                        ref={navInnerRef}
                        style={{
                            position: "relative",
                            display: "flex",
                            gap: 4,
                            padding: "6px 10px",
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
                            /* v2.14 — touch-action none deshabilita el
                               panning/zoom default de iOS Safari sobre el
                               nav. Sin esto el navegador puede cancelar
                               el pointermove al detectar un gesto. */
                            touchAction: "none",
                            /* v2.25 — user-select:none redundante en el
                               div interno (heredado del padre, pero
                               explícito por defensa contra Safari). */
                            WebkitUserSelect: "none",
                            userSelect: "none",
                            WebkitTouchCallout: "none",
                            /* v2.60 — translate3d(0,0,0) + willChange
                               fuerzan a iOS a mantener el pill en una
                               capa de compositing dedicada. Sin esto,
                               cuando viewport-fit=cover entra en juego
                               y env(safe-area-inset-bottom) se resuelve
                               post-paint, iOS cachea el hit-area en la
                               posición pre-settle y el tap queda
                               desfasado hasta que algo dispara el
                               re-cómputo. Forzar la capa fija el hit
                               testing al rect visual desde el primer
                               frame. */
                            transform: "translate3d(0,0,0)",
                            willChange: "transform",
                        }}
                    >
                        {/* #1 El campo respira contigo — glow ambiental en
                            reposo que late con el tempo + color del Índice de
                            Luz. Capa detrás de los tabs (zIndex 0), no captura
                            toques. La pill tiene overflow:hidden → el glow se
                            recorta dentro de la barra (latido ambiental sutil). */}
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 999,
                                background: `radial-gradient(ellipse 70% 120% at 50% 100%, ${hx(bp.color, 0.16)} 0%, transparent 70%)`,
                                boxShadow: `inset 0 0 26px ${hx(bp.color, 0.1)}`,
                                mixBlendMode: "screen",
                                pointerEvents: "none",
                                zIndex: 0,
                                transformOrigin: "center",
                                animationName: "esc-breathe-aura",
                                animationDuration: `${bp.durSec.toFixed(2)}s`,
                                animationTimingFunction: "ease-in-out",
                                animationIterationCount: "infinite",
                            }}
                        />
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
                        {items.map(([id, icon, label]) => {
                            const on = active === id
                            return (
                                /* v2.19 — div con role="button" en lugar
                                   de <button> nativo. iOS Safari aplica
                                   reglas de touch capture especiales a
                                   buttons HTML que pueden saltarse el
                                   overlay encima — convirtiéndolos a
                                   divs eliminamos ese quirk. Y suma
                                   pointerEvents:"none" para que el
                                   overlay (zIndex 5) sea el único que
                                   recibe touch+click. */
                                <div
                                    key={id}
                                    role="button"
                                    aria-label={label}
                                    data-bottom-nav-tab={id}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 3,
                                        padding: "8px 6px",
                                        border: "none",
                                        background: "transparent",
                                        color: on
                                            ? accent
                                            : "rgba(255,255,255,0.62)",
                                        cursor: "pointer",
                                        outline: "none",
                                        fontFamily: "'Inter',sans-serif",
                                        width: 64,
                                        minWidth: 64,
                                        minHeight: 52,
                                        WebkitTapHighlightColor: "transparent",
                                        userSelect: "none",
                                        WebkitUserSelect: "none",
                                        pointerEvents: "none",
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
                                            fontSize: 7,
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
                                </div>
                            )
                        })}
                        {/* v2.18 — Overlay invisible al final del nav,
                           cubre todos los buttons y captura touch+click.
                           Se montó como hijo del mismo div que los
                           buttons (zIndex 5 vs zIndex 1 de cada button).
                           Es donde inician los touchstart, así que iOS
                           Safari le entrega también todos los touchmove
                           y touchend siguientes — sin importar qué
                           button esté visualmente debajo del dedo. */}
                        <div
                            ref={overlayRef}
                            /* v2.22 — Cross-component drag con listeners
                               GLOBALES en window. El overlay sólo
                               dispara pointerdown; los pointermove/up
                               se registran en window dentro del handler
                               y sobreviven aunque el overlay se desmonte
                               a media gesto. Caso clave: invitado pica
                               Núcleo → dispatchEvent levanta el gate de
                               identificación → escGateOpen=true → el
                               BottomNav se desmonta vía AnimatePresence
                               con hidden=true. Si los listeners vivían
                               en el overlay desmontado, el gesto se
                               cortaba a la mitad. Con window listeners,
                               el dedo sigue tracked hasta soltar sobre
                               el botón "Iniciar Sesión" del gate, y el
                               click programático lo ejecuta. */
                            onPointerDown={(e) => {
                                /* v2.38 — preventDefault en pointerdown
                                   para bloquear el comportamiento default
                                   de iOS (selección de texto, callout
                                   menu) cuando el dedo arranca sobre el
                                   tab Núcleo. Si el evento no es
                                   cancelable, se ignora silencioso. */
                                try {
                                    if (e.cancelable) e.preventDefault()
                                } catch {}
                                isTouchingRef.current = true
                                dragTargetRef.current = null
                                dragActivate(e.clientX, e.clientY)
                                /* v2.39 — Long-press 2s sobre Núcleo.
                                   v2.40 — Condición más permisiva:
                                   arrancamos el long-press si el dedo
                                   cae sobre el tab Núcleo POR
                                   findTabIdAt O si el activeTab ya
                                   era "nucleo" (cubre el caso donde
                                   el rect del button retorna mal por
                                   un transform residual). */
                                pressStartCoordsRef.current = {
                                    x: e.clientX,
                                    y: e.clientY,
                                }
                                lastPointerCoordsRef.current = {
                                    x: e.clientX,
                                    y: e.clientY,
                                }
                                stopPressLoop()
                                const startTab = findTabIdAt(
                                    e.clientX,
                                    e.clientY
                                )
                                if (
                                    startTab === "nucleo" ||
                                    active === "nucleo"
                                ) {
                                    pressStartTsRef.current =
                                        performance.now()
                                    startPressLoop()
                                }
                                const onMove = (ev: PointerEvent) => {
                                    if (!isTouchingRef.current) return
                                    /* v2.39 — Actualizamos coords vivas
                                       para que el rAF loop pueda
                                       detectar movimiento. El loop
                                       compara contra pressStartCoords
                                       y cancela si excede 28px. */
                                    lastPointerCoordsRef.current = {
                                        x: ev.clientX,
                                        y: ev.clientY,
                                    }
                                    /* v2.36 — Si ya está armado el
                                       logout, trackear si el dedo está
                                       sobre el círculo target. NO
                                       cambiamos el tab activo en este
                                       modo — el tripulante está en
                                       gesto de logout. */
                                    if (logoutArmedRef.current) {
                                        setOverTarget(
                                            isPointerOverLogoutTarget(
                                                ev.clientX,
                                                ev.clientY
                                            )
                                        )
                                        return
                                    }
                                    const navTab = findTabIdAt(
                                        ev.clientX,
                                        ev.clientY
                                    )
                                    if (navTab) {
                                        dragActivate(
                                            ev.clientX,
                                            ev.clientY
                                        )
                                        dragTargetRef.current = null
                                    } else {
                                        dragTargetRef.current =
                                            findContentTargetAt(
                                                ev.clientX,
                                                ev.clientY
                                            )
                                    }
                                }
                                const cleanup = () => {
                                    isTouchingRef.current = false
                                    lastActivatedRef.current = null
                                    dragTargetRef.current = null
                                    pressStartCoordsRef.current = null
                                    lastPointerCoordsRef.current = null
                                    stopPressLoop()
                                    setArmed(false)
                                    setOverTarget(false)
                                    setArmedAnchor(null)
                                    window.removeEventListener(
                                        "pointermove",
                                        onMove
                                    )
                                    window.removeEventListener(
                                        "pointerup",
                                        onUp
                                    )
                                    window.removeEventListener(
                                        "pointercancel",
                                        onCancel
                                    )
                                }
                                const onUp = (ev: PointerEvent) => {
                                    if (!isTouchingRef.current) {
                                        cleanup()
                                        return
                                    }
                                    /* v2.36 — Si el gesto está armado,
                                       chequeamos si el dedo está sobre
                                       el círculo target. Si sí →
                                       logout. Si no → cancelar gesto.
                                       v2.37 — Lectura desde
                                       logoutArmedRef.current. */
                                    if (logoutArmedRef.current) {
                                        const overTarget =
                                            isPointerOverLogoutTarget(
                                                ev.clientX,
                                                ev.clientY
                                            )
                                        if (overTarget) {
                                            executeSignoutGesture()
                                        }
                                        cleanup()
                                        return
                                    }
                                    const navTab = findTabIdAt(
                                        ev.clientX,
                                        ev.clientY
                                    )
                                    if (navTab) {
                                        /* v2.63 — Segunda oportunidad
                                           de cambiar el tab al soltar.
                                           Si dragActivate del
                                           pointerdown fue cancelado
                                           por iOS (pointercancel) o el
                                           guard lastActivatedRef
                                           bloqueó el cambio, este
                                           onChange asegura que el tap
                                           termine activando el tab. */
                                        onChange(navTab)
                                    } else {
                                        const target =
                                            findContentTargetAt(
                                                ev.clientX,
                                                ev.clientY
                                            )
                                        if (target) {
                                            try {
                                                target.click()
                                            } catch (err) {
                                                console.warn(
                                                    "[bnav] target.click() fail:",
                                                    err
                                                )
                                            }
                                        }
                                    }
                                    cleanup()
                                }
                                /* v2.39 — onCancel inteligente. iOS
                                   Safari dispara pointercancel cuando
                                   reconoce un gesto del sistema. Si
                                   el rAF loop sigue activo (press en
                                   progreso sin armar todavía), no
                                   tocamos nada: el loop sigue contando
                                   tiempo y el armed dispara solo
                                   cuando se cumple el umbral. */
                                const onCancel = () => {
                                    if (
                                        pressActiveRef.current &&
                                        !logoutArmedRef.current
                                    ) {
                                        return
                                    }
                                    cleanup()
                                }
                                window.addEventListener(
                                    "pointermove",
                                    onMove
                                )
                                window.addEventListener(
                                    "pointerup",
                                    onUp
                                )
                                window.addEventListener(
                                    "pointercancel",
                                    onCancel
                                )
                            }}
                            onClick={(e) => {
                                /* Fallback para casos donde pointerdown
                                   no disparó. Sólo cambia el tab; no
                                   ejecuta cross-component (al ser un
                                   click puntual sin drag). */
                                if (isTouchingRef.current) return
                                const id = findTabIdAt(
                                    e.clientX,
                                    e.clientY
                                )
                                if (id) {
                                    try {
                                        fireTouchRipple(
                                            e.clientX,
                                            e.clientY,
                                            { color: "#00E5FF", size: 150 }
                                        )
                                    } catch {}
                                    onChange(id)
                                }
                            }}
                            /* v2.38 — Bloqueo defensivo del menú
                               contextual nativo de iOS Safari y de la
                               selección de texto. Si el dedo se queda
                               quieto >0.5s sobre el overlay, iOS
                               intenta arrancar su long-press del
                               sistema (callout menu) y dispara
                               pointercancel. Estos handlers le dicen
                               "este elemento no acepta tus gestos
                               default". */
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 5,
                                background: "transparent",
                                touchAction: "none",
                                cursor: "pointer",
                                /* v2.38 — Defensas CSS contra iOS
                                   long-press nativo. Las versiones
                                   previas confiaban en el wrapper
                                   externo (que sí las tenía) pero el
                                   overlay propio no replicaba estas
                                   declaraciones — el long-press
                                   del sistema se arranca en el
                                   elemento que recibe el touch, no en
                                   sus padres. */
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                WebkitTouchCallout: "none",
                                WebkitTapHighlightColor: "transparent",
                                WebkitUserDrag: "none" as any,
                            }}
                            aria-hidden="true"
                        />
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            {/* v2.41 — Círculo naranja del gesto de logout. Aparece
                flotante exactamente arriba del tab Núcleo cuando el
                long-press se cumple (2s). Si el dedo lo arrastra
                aquí y suelta, ejecuta signOut. */}
            {logoutGestureState === "armed" &&
                armedAnchor &&
                typeof document !== "undefined" &&
                createPortal(
                    <motion.div
                        ref={logoutTargetRef}
                        initial={{ opacity: 0, y: 12, scale: 0.6 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: logoutOverTarget ? 1.18 : 1,
                        }}
                        exit={{ opacity: 0, y: 12, scale: 0.6 }}
                        transition={{
                            duration: 0.22,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                            position: "fixed",
                            /* v2.41 — Posición dinámica calculada al
                               armar: centro X exacto del tab Núcleo,
                               y top justo encima del nav inner con
                               12px de aire. Tamaño 44x44 (antes 72x72).
                               "topY - 44 - 12" deja el círculo flotando
                               12px sobre el borde superior de la nav. */
                            left: armedAnchor.centerX - 22,
                            top: armedAnchor.topY - 44 - 12,
                            zIndex: 2147483647,
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: logoutOverTarget
                                ? "linear-gradient(135deg, rgba(255,160,60,0.95), rgba(255,140,40,0.85))"
                                : "linear-gradient(135deg, rgba(255,160,60,0.45), rgba(255,140,40,0.30))",
                            border: `1px solid ${logoutOverTarget ? "rgba(255,200,120,0.95)" : "rgba(255,180,90,0.55)"}`,
                            color: logoutOverTarget
                                ? "#FFFFFF"
                                : "#FFC078",
                            boxShadow: logoutOverTarget
                                ? "0 0 28px rgba(255,160,60,0.85), 0 0 14px rgba(255,180,90,0.55)"
                                : "0 0 18px rgba(255,160,60,0.45), 0 3px 10px rgba(0,0,0,0.4)",
                            backdropFilter:
                                "blur(20px) saturate(160%) brightness(1.05)",
                            WebkitBackdropFilter:
                                "blur(20px) saturate(160%) brightness(1.05)",
                            pointerEvents: "none",
                            animation: logoutOverTarget
                                ? "rsv-logout-pulse-armed 0.6s ease-in-out infinite"
                                : "rsv-logout-pulse 1.4s ease-in-out infinite",
                        }}
                        aria-label="Cerrar sesión: arrastra el dedo aquí y suelta"
                    >
                        <style>{`
                            @keyframes rsv-logout-pulse {
                                0%, 100% { box-shadow: 0 0 18px rgba(255,160,60,0.45), 0 3px 10px rgba(0,0,0,0.4); }
                                50% { box-shadow: 0 0 26px rgba(255,180,90,0.65), 0 3px 10px rgba(0,0,0,0.4); }
                            }
                            @keyframes rsv-logout-pulse-armed {
                                0%, 100% { box-shadow: 0 0 28px rgba(255,160,60,0.85), 0 0 14px rgba(255,180,90,0.55); }
                                50% { box-shadow: 0 0 36px rgba(255,200,120,1), 0 0 18px rgba(255,200,120,0.7); }
                            }
                        `}</style>
                        <svg
                            width={22}
                            height={22}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </motion.div>,
                    document.body
                )}
        </>
    )
}

/* ═══ Shell mobile ═══ */
export function AppNavegacionMobile(props: {
    supabaseUrl?: string
    supabaseAnonKey?: string
    accentColor?: string
    linkStripeMembSolar?: string
    nucleoStripePortalUrl?: string
    nucleoTitleText?: string
    nucleoSubtitleText?: string
    nucleoAccentColor?: string
    onClose?: () => void
    initialTab?: Tab
    /* v2.43 — Hidratado por Domo desde buildFragments(fragCovers).
       Cada item: { title, synopsis, youtubeLink, embedCode, cover }.
       Si llega vacío, el Astrolabio cae al placeholder Próximamente. */
    fragmentsItems?: FragmentItem[]
}) {
    const {
        supabaseUrl = "",
        supabaseAnonKey = "",
        accentColor = "#00e5ff",
        linkStripeMembSolar = "",
        nucleoStripePortalUrl = "",
        nucleoTitleText = "MI NÚCLEO",
        nucleoSubtitleText = "Tu centro de gravedad en la Red",
        nucleoAccentColor = "#00C2FF",
        onClose,
        initialTab = "radar",
        fragmentsItems = [],
    } = props
    const isMobile = useIsMobile()
    /* v2.26 — initialTab deriva PRIMERO del path actual. Si el
       tripulante refresca /holoteca/codices o entra por un anchor
       link viejo (/codices#libro-7), el path manda sobre el prop. */
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const fromPath = readPathTab()
        return fromPath || initialTab
    })
    /* v2.26 — Sincroniza URL ↔ activeTab para sub-tabs Holoteca.
       Cualquier cambio a Códices/Meditaciones/Códigos/Fragmentos
       (incluyendo el primer mount con un alias viejo) se refleja
       en la URL como /holoteca/<sub>. El listener de popstate +
       rsv-navigate respeta back/forward del browser y sincroniza
       el state local cuando otros componentes navegan vía
       window.rsvNavigate(). */
    useEffect(() => {
        pushPathForTab(activeTab)
    }, [activeTab])
    useEffect(() => {
        if (typeof window === "undefined") return
        const sync = () => {
            const t = readPathTab()
            if (t) setActiveTab(t)
        }
        window.addEventListener("popstate", sync)
        window.addEventListener("rsv-navigate", sync)
        return () => {
            window.removeEventListener("popstate", sync)
            window.removeEventListener("rsv-navigate", sync)
        }
    }, [])
    /* Estado del Escáner expuesto vía callbacks. La nav inferior solo
       aparece cuando hay sesión Y el Escáner no está procesando.
       v2.34 — escAuthed YA NO se hidrata desde callback del Escáner.
       Antes onAuthChange={setEscAuthed} esperaba a que EscanerVibracional
       (oculto detrás cuando activeTab==="nucleo") reconociera a
       Clerk.user y reportara — frágil porque el componente puede no
       correr sus effects con visibility:hidden. Ahora derivamos
       directo de clerkUserId (polling local cada 600ms más seed
       síncrono al mount). Resultado: reload directo en /escaner/nucleo
       con sesión activa monta MiNucleo en el primer render. */
    const [escIsProc, setEscIsProc] = useState<boolean>(false)
    /* v1.4 — Estado del gate de identificación expuesto por el Escáner.
       Lo usamos para esconder la BottomNav cuando el modal está
       abierto (si no, los 5 tabs se ven detrás del bottom sheet). */
    const [escGateOpen, setEscGateOpen] = useState<boolean>(false)
    /* v2.49.4 — Cuando el Navegante de la Red entra a fullscreen
       (juego activo, sin menú ni tutorial superpuesto), escondemos la
       BottomNav y el prefijo "HOLOTECA · SIMULADORES" del shell.
       NaveganteDeLaRed dispatcha el evento desde su useEffect cada
       vez que cambia la condición. */
    const [naveganteFullscreen, setNaveganteFullscreen] =
        useState<boolean>(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const onFs = (e: Event) => {
            const detail = (e as CustomEvent<{ active: boolean }>).detail
            setNaveganteFullscreen(!!detail?.active)
        }
        window.addEventListener("rsv-navegante-fullscreen", onFs as any)
        return () => {
            window.removeEventListener(
                "rsv-navegante-fullscreen",
                onFs as any
            )
        }
    }, [])
    /* Si el Tripulante navega fuera del simulador, limpiamos el flag
       (defensa por si el juego no alcanzó a dispatchar el cleanup). */
    useEffect(() => {
        if (activeTab !== "simuladores" && naveganteFullscreen) {
            setNaveganteFullscreen(false)
        }
    }, [activeTab, naveganteFullscreen])

    /* v2.55 — Sub-pantalla del sub-tab "simuladores": "selector" muestra
       el SelectorSimuladores AAA con cards Navegante + Domo Cero
       (admin); "navegante" abre el SimuladoresShellMobile que monta
       el simulador. Reset a "selector" cuando el Tripulante navega
       afuera del sub-tab. */
    const [simuladorPick, setSimuladorPick] = useState<
        "selector" | "navegante"
    >("selector")
    useEffect(() => {
        if (activeTab !== "simuladores" && simuladorPick !== "selector") {
            setSimuladorPick("selector")
        }
    }, [activeTab, simuladorPick])
    /* Mapa del activeTab al mainView del Escáner. Cuando activeTab
       está fuera del Escáner (holoteca/nucleo), seguimos pasando el
       último mainView válido para que el state interno del Escáner
       no se pierda. */
    const lastEscViewRef = useRef<"radar" | "modulos" | "decodificador">(
        initialTab === "modulos" || initialTab === "decodificador"
            ? initialTab
            : "radar"
    )
    if (
        activeTab === "radar" ||
        activeTab === "modulos" ||
        activeTab === "decodificador"
    ) {
        lastEscViewRef.current = activeTab
    }
    /* v1.4 — handler para click de tab. Si invitado pica Núcleo,
       el overlay vacío no aparece (MiNucleo necesita clerkUserId);
       en su lugar levantamos el gate de identificación del Escáner
       vía custom event. La tab activa NO cambia para que el
       tripulante quede donde estaba. */
    const handleTabChange = (t: Tab) => {
        if (t === "nucleo" && !escAuthed) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("rsv-request-auth-gate"))
            }
            return
        }
        /* v2.33 — Picar Núcleo cuando ya estamos dentro del Núcleo
           (en Mi Firma, Mis Sesiones, Mis Códices, Trayectoria, etc)
           debe regresar al dashboard de Mi Núcleo (la lista de
           cards), no quedarse en la sub-pantalla. setActiveTab no
           cambia nada (ya es "nucleo"), así que disparamos un evento
           "rsv-nucleo-reset" que MiNucleo escucha para resetear su
           activeTab interno a "dashboard". El comportamiento se siente
           natural: la nav inferior es "el botón a la capa madre". */
        if (t === "nucleo" && activeTab === "nucleo") {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("rsv-nucleo-reset"))
            }
            return
        }
        /* Picar DECODIFICADOR estando ya dentro → regresa al selector
           (Materia | Sueños). DecoderModule escucha "rsv-decoder-reset". */
        if (t === "decodificador" && activeTab === "decodificador") {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("rsv-decoder-reset"))
            }
            return
        }
        /* v2.32 — Quitada la inyección de "#mifirma" en el hash. La
           URL queda como /escaner/nucleo limpio; el sub-tab inicial
           de Mi Núcleo lo decide MiNucleo (default state) en lugar
           de la nav. Si en el futuro hace falta aterrizar siempre
           en una sub-tab específica, mejor que MiNucleo respete su
           default que forzar un hash desde aquí. */
        setActiveTab(t)
    }
    /* Resolver clerkUserId vivo desde window.Clerk. */
    const [clerkUserId, setClerkUserId] = useState<string>(() => {
        if (typeof window === "undefined") return ""
        return (window as any).Clerk?.user?.id || ""
    })
    useEffect(() => {
        if (typeof window === "undefined") return
        const tick = () => {
            const next = (window as any).Clerk?.user?.id || ""
            setClerkUserId((prev) => (prev === next ? prev : next))
        }
        /* v2.35 — Tick inmediato + intervalo 250ms para detectar la
           carga de Clerk en hard reload directo a /escaner/nucleo
           (antes el primer tick se demoraba 600ms y el overlay
           quedaba en negro durante ese gap). */
        tick()
        const iv = setInterval(tick, 250)
        return () => clearInterval(iv)
    }, [])
    /* v2.34 — escAuthed se deriva de clerkUserId. Antes se hidrataba
       vía callback `onAuthChange` del EscanerVibracional, que podía no
       dispararse cuando el Escáner se monta oculto (hideForOverlay=true
       en /escaner/nucleo). El polling de clerkUserId arranca síncrono
       en mount y no depende del shadow render del Escáner. */
    const escAuthed = !!clerkUserId

    /* v2.54 — Admin gate para mostrar la card morada DOMO CERO en la
       Holoteca y disparar el handoff JWT. useAdminAuth pega Supabase
       y resuelve `is_admin` desde profiles. Devuelve false hasta que
       el polling de Clerk esté listo. */
    const { isAdmin } = useAdminAuth(supabaseUrl, supabaseAnonKey)

    /* v2.54 — Handoff al cliente del Domo Cero. Mismo patrón que el
       shell desktop (RSV_SolarSimuladoresShell.handleStartGame): pide
       JWT a Clerk con templates "domo" → "mmsor" → estándar y hace
       window.location.assign con `#token=...` en el fragment. El
       cliente del Domo lee el token, lo limpia del URL y arranca con
       sesión. Si no hay sesión Clerk activa, abortamos con un
       console.warn — la card solo aparece para admins, así que el
       caso no debería ocurrir en producción. */
    const handoffDomoCero = useCallback(() => {
        if (typeof window === "undefined") return
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
            const sep = DOMO_CLIENT_URL.includes("#") ? "&" : "#"
            window.location.assign(
                `${DOMO_CLIENT_URL}${sep}token=${encodeURIComponent(token)}`
            )
        })
    }, [])

    /* v2.23 — Listener "rsv-signout-complete": cuando MiNucleo cierra
       sesión SPA-native, el shell vive en /escaner y el path no cambia,
       pero el activeTab interno puede haber quedado en "nucleo".
       Forzamos volver al tab "escaner" para que MiNucleo se desmonte
       y el tripulante vea el contenido del Escáner sin sesión. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const onSignoutComplete = () => {
            /* v2.29 — Tab id correcto es "radar" (el primer item).
               Antes era "escaner" — typo pre-existente que no
               iluminaba ningún botón post-signout. */
            setActiveTab("radar")
        }
        window.addEventListener("rsv-signout-complete", onSignoutComplete)
        return () => {
            window.removeEventListener(
                "rsv-signout-complete",
                onSignoutComplete
            )
        }
    }, [])

    if (!isMobile) {
        /* En desktop, AppNavegacionMobile no se renderiza. Domo carga
           directamente <EscanerVibracional /> standalone. */
        return null
    }

    return (
        <>
            {/* v1.8 — Inyectamos CSS global para ocultar scrollbar de
                WebKit en el wrapper del overlay Holoteca/Núcleo. Firefox
                lo oculta vía scrollbarWidth:none inline.
                v2.0 — Sumamos la animación nuc-breath para el título de
                Holoteca (replica el breath del título "MI NÚCLEO"). */}
            <style>{`
                .rsv-overlay-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
                .rsv-overlay-scroll { -ms-overflow-style: none; }
                @keyframes nuc-breath { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }
            `}</style>
            {/* Escáner siempre montado para preservar state cycle/scores
                aunque el tripulante navegue a Holoteca/Núcleo. El Dock
                interno se oculta — la bottom nav externa hace su
                trabajo. */}
            <EscanerVibracional
                /* v2.24 — key basada en estado de auth: cuando el
                   tripulante cierra sesión SPA-native, clerkUserId
                   pasa de truthy a "" y la key cambia → React
                   desmonta EscanerVibracional y lo remonta limpio.
                   Sin esto, los % del Radar y la data de Calibración
                   del usuario anterior quedaban en memoria. */
                key={clerkUserId ? "authed" : "anon"}
                isOpen={true}
                onClose={() => {
                    if (onClose) onClose()
                }}
                accentColor={accentColor}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                clerkUserId={clerkUserId}
                linkStripeMembSolar={linkStripeMembSolar}
                controlledMainView={lastEscViewRef.current}
                hideInternalDock={true}
                onProcChange={setEscIsProc}
                onAuthGateChange={setEscGateOpen}
                /* v2.0 — Cuando estamos en Holoteca o Núcleo, el Escáner
                   se oculta visualmente para que el overlay transparente
                   revele el campo de estrellas del Domo. State preservado.
                   v2.7 — También se oculta en los sub-tabs internos
                   (codices, meditaciones, codigos, fragmentos). Sin esto,
                   el Escáner detrás se asomaba con la vista del último
                   tab del Escáner (Protocolos / Decodificador). */
                hideForOverlay={
                    activeTab === "holoteca" ||
                    activeTab === "nucleo" ||
                    activeTab === "codices" ||
                    activeTab === "meditaciones" ||
                    activeTab === "codigos" ||
                    activeTab === "fragmentos" ||
                    activeTab === "simuladores"
                }
            />

            {/* v1.3 — Overlay Holoteca: contenido público, abierto a
                invitados.
                v2.35 — Núcleo ya NO exige escAuthed para renderizar.
                MiNucleo internamente usa useUser() + polling propio +
                muestra SignInContent si no hay sesión, así que el gate
                aquí era redundante y causaba pantalla negra cuando el
                polling tardaba en detectar a Clerk (caso reload directo
                en /escaner/nucleo). Si invitado pica Núcleo desde otra
                tab, handleTabChange sigue levantando el auth gate. */}
            {(activeTab === "holoteca" ||
                activeTab === "codices" ||
                activeTab === "meditaciones" ||
                activeTab === "codigos" ||
                activeTab === "fragmentos" ||
                activeTab === "simuladores" ||
                activeTab === "nucleo") &&
                typeof document !== "undefined" &&
                createPortal(
                    /* v1.8 — paddingTop 32 (antes 0) para alinear el
                       título "MI NÚCLEO" con la altura de PROTOCOLOS y
                       DECODIFICADOR (el esc-scroll del Escáner mobile
                       aporta padding-top 32 y luego el wrapper interno
                       de cada vista 16; total 48). paddingBottom queda
                       en 24 — el FirmaSection trae su propio aire.
                       v2.0 — Fondo del overlay pasa a transparent (sin
                       blur) para que el campo de estrellas del Domo se
                       vea de fondo. El Escáner debajo se oculta vía
                       hideForOverlay (visibility hidden) para no
                       contaminar la vista. Unificamos el fondo del
                       Lente: estrellas del Domo en todas las capas. */
                    <div
                        className="rsv-overlay-scroll"
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 100,
                            background: "transparent",
                            /* v2.10 — En Códices el m-scroll interno
                               maneja el scroll; el overlay queda
                               hidden para que iOS Safari no se
                               confunda con dos contenedores
                               compitiendo por el momentum. Otros tabs
                               siguen con auto + WebkitOverflowScrolling
                               para deslizamiento heredado. */
                            overflowY:
                                activeTab === "codices" ? "hidden" : "auto",
                            overflowX: "hidden",
                            WebkitOverflowScrolling: "touch",
                            /* v2.11 — En Códices el padding va a 0:
                               Codices internaliza el aire arriba
                               (topPaddingPx 36) y abajo
                               (bottomReservePx 92).
                               v2.12 — Demás tabs pasan de 32 a 8
                               para subir títulos al top-left
                               (esquina superior izquierda).
                               paddingBottom 24 → 8 para liberar
                               espacio al fondo también. */
                            paddingTop: activeTab === "codices" ? 0 : 8,
                            paddingBottom: activeTab === "codices" ? 0 : 8,
                            /* v1.8 — scrollbar invisible vía Firefox
                               (scrollbarWidth) y WebKit (clase + style
                               tag al final del componente). */
                            scrollbarWidth: "none" as any,
                            /* v1.9 — overscrollBehavior contain bloquea
                               el rubber-band scroll de iOS/macOS cuando
                               el contenido cabe en el viewport. Sin
                               esto, en Códices con 1 libro el dedo
                               podía empujar el contenido hacia arriba
                               revelando espacio negro y escondiendo el
                               título. Ahora el scroll se queda firme
                               dentro de los límites del contenido. */
                            overscrollBehavior: "contain",
                            overscrollBehaviorY: "contain",
                        }}
                    >
                        {activeTab === "holoteca" && (
                            <Holoteca
                                accent={accentColor}
                                onNavigate={(t) => setActiveTab(t)}
                                isAdmin={isAdmin}
                                onActivateDomo={handoffDomoCero}
                            />
                        )}
                        {activeTab === "codices" && (
                            <ArchivoHolograficoLibros
                                supabaseUrl={supabaseUrl}
                                supabaseAnonKey={supabaseAnonKey}
                                bottomReservePx={92}
                                /* v2.12 — topPaddingPx 8 (antes 36)
                                   para alinear el título con
                                   HOLOTECA/CALIBRACIÓN/DECODIFICADOR
                                   en su nueva posición top-left
                                   (esquina superior izquierda). */
                                topPaddingPx={8}
                            />
                        )}
                        {activeTab === "meditaciones" && (
                            <Frecuencias
                                supabaseUrl={supabaseUrl}
                                supabaseAnonKey={supabaseAnonKey}
                                bottomReservePx={92}
                                /* v2.7 — bgColor transparent +
                                   numStars 0 para que se vea el fondo
                                   de estrellas del Domo. */
                                bgColor="transparent"
                                numStars={0}
                            />
                        )}
                        {activeTab === "codigos" && (
                            <CodigosFuenteAnclaje
                                accent={HOLO_CARD_ACCENT}
                            />
                        )}
                        {activeTab === "fragmentos" && (
                            <FragmentosAstrolabio
                                items={fragmentsItems}
                                accent={HOLO_CARD_ACCENT}
                            />
                        )}
                        {activeTab === "simuladores" &&
                            simuladorPick === "selector" && (
                                <SelectorSimuladores
                                    accent={accentColor}
                                    isAdmin={!!isAdmin}
                                    onPickNavegante={() =>
                                        setSimuladorPick("navegante")
                                    }
                                    onPickDomoCero={handoffDomoCero}
                                />
                            )}
                        {activeTab === "simuladores" &&
                            simuladorPick === "navegante" && (
                                <SimuladoresShellMobile
                                    onExit={() =>
                                        setSimuladorPick("selector")
                                    }
                                    supabaseUrl={supabaseUrl}
                                    supabaseAnonKey={supabaseAnonKey}
                                />
                            )}
                        {/* v2.13 — Tap area invisible sobre la palabra
                           "HOLOTECA" del título de los sub-tabs (Códices,
                           Meditaciones, Códigos Fuente, Fragmentos del
                           Sol). Diego pidió que ese prefijo sea clickeable
                           para volver a la grid principal de Holoteca.
                           Como Códices y Meditaciones son archivos grandes
                           (>300KB / sincronización manual) y sus títulos
                           viven internamente, sobreponemos un botón
                           transparente en la posición exacta del texto
                           HOLOTECA — no toca los archivos externos. El
                           ancho 130 cubre "HOLOTECA" + safety margin a
                           font-size 14 letter-spacing 0.22em.
                           v2.49 — "simuladores" se suma al set: el
                           Navegante de la Red usa su propio botón de
                           pausa interno, así que solo necesitamos el tap
                           area del título "HOLOTECA · SIMULADORES" para
                           regresar al grid. */}
                        {(activeTab === "codices" ||
                            activeTab === "meditaciones" ||
                            activeTab === "codigos" ||
                            activeTab === "fragmentos" ||
                            /* v2.55 — En sub-tab simuladores: la tap-area
                               solo aparece en la pantalla de selector
                               (Navegante + Domo Cero). En la pantalla
                               navegante el Navegante interno maneja su
                               back y la tap-area se desactiva para no
                               competir. */
                            (activeTab === "simuladores" &&
                                simuladorPick === "selector")) && (
                            <button
                                onClick={() => setActiveTab("holoteca")}
                                aria-label="Volver a Holoteca"
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: 132,
                                    height: 40,
                                    zIndex: 200,
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    margin: 0,
                                    cursor: "pointer",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            />
                        )}
                        {activeTab === "nucleo" && (
                            <MiNucleo
                                domoMode={true}
                                bgColor="transparent"
                                accentColor={nucleoAccentColor}
                                contentMaxWidthPx={1080}
                                sidePaddingPx={40}
                                topPaddingPx={0}
                                pageTitleText={nucleoTitleText}
                                pageTitleSize={72}
                                titleTopOffsetPx={102}
                                subtitleText={nucleoSubtitleText}
                                numStars={0}
                                warpSpeed={0.3}
                                supabaseUrl={supabaseUrl}
                                supabaseAnonKey={supabaseAnonKey}
                                stripePortalUrl={nucleoStripePortalUrl}
                            />
                        )}
                    </div>,
                    document.body
                )}

            {/* v1.4 — Bottom nav siempre visible mientras /escaner esté
                montado. Se oculta durante: el procesamiento activo de
                una sonda (escIsProc) y mientras el gate de identificación
                está levantado (escGateOpen) — sin esto los 5 tabs
                obstruirían el bottom sheet del modal. */}
            {typeof document !== "undefined" &&
                createPortal(
                    <BottomNav
                        active={
                            /* v2.5 — Sub-tabs internos (codices,
                               meditaciones, codigos, fragmentos)
                               viven debajo de Holoteca; el BottomNav
                               sigue mostrando "Holoteca" highlighted. */
                            activeTab === "codices" ||
                            activeTab === "meditaciones" ||
                            activeTab === "codigos" ||
                            activeTab === "fragmentos"
                                ? "holoteca"
                                : activeTab
                        }
                        onChange={handleTabChange}
                        accent={accentColor}
                        hidden={
                            escIsProc ||
                            escGateOpen ||
                            naveganteFullscreen ||
                            /* v2.55 — En sub-tab "simuladores" la
                               BottomNav SÍ se muestra mientras el
                               Tripulante está en el SelectorSimuladores
                               (puede querer cambiar a otra parte de la
                               Holoteca o al Núcleo). Solo se esconde
                               cuando entra al simulador concreto
                               (simuladorPick === "navegante"), donde
                               el Navegante usa toda la pantalla y
                               tiene su propio botón de regreso. */
                            (activeTab === "simuladores" &&
                                simuladorPick === "navegante")
                        }
                    />,
                    document.body
                )}
        </>
    )
}

addPropertyControls(AppNavegacionMobile, {
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
    linkStripeMembSolar: {
        type: ControlType.String,
        title: "Stripe · Sintonía Solar",
        defaultValue: "",
    },
    nucleoStripePortalUrl: {
        type: ControlType.String,
        title: "Stripe Portal (Mi Núcleo)",
        defaultValue: "",
    },
    nucleoTitleText: {
        type: ControlType.String,
        title: "Mi Núcleo · Título",
        defaultValue: "MI NÚCLEO",
    },
    nucleoSubtitleText: {
        type: ControlType.String,
        title: "Mi Núcleo · Subtítulo",
        defaultValue: "Tu centro de gravedad en la Red",
    },
    nucleoAccentColor: {
        type: ControlType.Color,
        title: "Mi Núcleo · Accent",
        defaultValue: "#00C2FF",
    },
})

/* v2.57 — Object.assign(AppNavegacionMobile, { SimuladoresPublicMobile })
   removido por causar "Publishing blocked by 22 blocking errors" en
   Framer (v2.56). El conflicto es entre Object.assign y los
   addPropertyControls que Framer ya registró sobre la función. Si
   en el futuro queremos exponer SimuladoresPublicMobile a Domo, lo
   hacemos vía un Code File propio (`SimuladoresPublicMobile.tsx`)
   con default export — ese patrón sí publica. Por ahora
   SimuladoresPublicMobile y SimuladoresSelectorCardsOnly viven
   como funciones internas del archivo (no exportadas) para que el
   código siga compilando aunque no se usen. */
export default AppNavegacionMobile
