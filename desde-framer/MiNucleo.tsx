// Red Solar Viva — MiNucleo.tsx v6.33 — hideSesionesTab suma el flag independiente app_flags:hide_sesiones: si está ON, "Mis Sesiones" se esconde SIEMPRE (sin importar sesiones compradas ni membresía) además del legado hide_camara_solar (que solo la esconde a quien no tiene nada que ver).
// v6.32 — hideSesionesTab: esconde "Mis Sesiones" cuando el Motor apagó la Cámara Solar (flag app_flags:hide_camara_solar) y el Tripulante no tiene sesiones ni membresía; los que sí las tienen la conservan.
// v6.31 (2026-06-15) — Estado Orbital (badge de tier) + tarjeta dorada de planes
// se siembran del cache del tier (rsv-nucleo-tier-<uid>) → aparecen AL INSTANTE
// con el resto del dashboard, sin esperar el fetch completo del Núcleo (antes
// se gateaban por !nucleoLoading y llegaban tarde para no-suscriptores).
// v6.30 (2026-06-15) — Pre-carga (warm cache) de las portadas de Códices
// (cover_url) al entrar a Mi Núcleo, así "Mis Códices" abre con las imágenes
// listas. Fire-and-forget, no bloquea el render.
// v6.28 (2026-05-20) — Deep-link sub-path en el hash. Cuando llega
// `#mifirma/orbital` (o similar), el useEffect nuevo abre la pestaña
// Mi Firma directamente en su sub-tab correspondiente (orbital,
// identidad, intercambios, seguridad). Habilita que CTAs desde
// otras capas (INMERSIÓN ACTIVA en Sesiones, prompts de membresía
// en Cámara Solar) aterricen al Tripulante exactamente en el
// Estado Orbital sin pasos manuales. También suma compat con
// `useHashTab` v1.2 que parsea solo el primer segmento del hash.
// v6.27 — Pestaña "Mis Sesiones" oculta en modo Escáner
// (/escaner/nucleo). Las sesiones (Cámara Solar grupal y Cámara de
// Resonancia 1:1) se reservan a la capa Madre /nucleo en web y
// desktop. En modo Escáner el TAB_ORDER cae a 3 pestañas (Códices ·
// Trayectoria · Mi Firma) y el card de Sesiones del dashboard mobile
// no se renderea. Guard adicional: si el Tripulante entra a
// /escaner/nucleo con activeTab="sesiones" (refresh con hash legacy
// o navegación cruzada), un useEffect lo regresa al dashboard.
// v6.26
// v6.25 — displayName del header del Núcleo lee primero
// `unsafeMetadata.preferredName` con fallback a fullName/firstName.
// Cubre el caso "Clerk rechazó el cambio de nombre y el SDK lo pisó
// con el valor anterior" — ahora la card respeta lo que el Tripulante
// escribió en Mi Firma sin importar la validación interna de Clerk.
// v6.24 — Bug visual reportado por Zak en /escaner/nucleo mobile:
// estando en una sub-pantalla (Mis Sesiones, Mis Códices), refresh
// + back con la flecha portaled deja el bloque de identidad (foto +
// nombre + pill de tier) renderizado borroso. El "MI NÚCLEO" arriba
// y las cards abajo se ven nítidos. Hipótesis: el motion.div del
// IdentityBlock se monta fresh tras el back, hereda la transición
// `cV` del padre y aplica un translateY sub-pixel que iOS Safari
// pinta con bilinear interpolation en GPU layer mal alineada.
// Defensas (capa visual, sin tocar la lógica):
//   · `WebkitFontSmoothing: "antialiased"` para que el texto del
//     nombre y del pill se rendericen siempre crispy.
//   · `transform: "translateZ(0)"` en el wrapper para forzar al
//     compositor de iOS a darle layer GPU propia con coordenadas
//     enteras (corta cualquier sub-pixel transform residual).
//   · `filter: "blur(0px)"` explícito que sobrescribe cualquier
//     filter heredado vía `cV` o un motion variant huérfano.
//   · `imageRendering: "auto"` en el img del avatar (el default
//     blurry de iOS para imágenes upscaled).
// v6.23 — Tres ajustes del feedback de Zak:
// v6.23 — Tres ajustes del feedback de Zak:
//   1. Mobile · sub-páginas (Mis Códices / Mis Sesiones / Trayectoria
//      / Mi Firma): el padding-top del wrapper mobile pasa de
//      `topPaddingPx` (60 en /nucleo, 0 en /escaner/nucleo) a 0
//      cuando NO es dashboard. Antes /nucleo mobile tenía 60px de
//      padding-top extra que empujaba todos los títulos abajo, mientras
//      /escaner/nucleo mobile arrancaba sin esa diferencia. Ahora
//      ambos modos comparten título a la misma altura (alineado al
//      back button portaled). El dashboard sigue respetando topPaddingPx
//      porque el HeroTitleBlock necesita ese aire del top en /nucleo
//      modo Madre.
//   2. BackBtn portaled: zIndex sube a 2147483647 + pointerEvents:auto
//      explícito + handler duplicado (onPointerDown + onClick).
//      Defensa contra cualquier wrapper transparente del shell que
//      capture el click tras un reload. Sin esto el botón "se moría"
//      visualmente activo pero sin disparar la navegación.
//   3. El handler de back ahora dispatcha `rsv-nucleo-reset` además
//      de setActiveTab("dashboard") — doble seguro para que la
//      AppNavegacionMobile del shell también resetee su estado.
// v6.22 — Tres correcciones del feedback de Zak:
//   1. /nucleo y /escaner/nucleo desktop ahora son IDÉNTICOS en
//      altura, padding y layout. Revertido el diferencial de
//      paddingTop:0 vs 24 que había introducido en v6.21 — Zak
//      confirmó que la diferencia visual entre los dos modos era
//      su impresión y NO un problema real. Ambos modos vuelven a
//      paddingTop: 24 del visor. La regla canónica es: las dos
//      vistas son las mismas EXCEPTO la NavegadorEstacion (6 tabs
//      Madre vs 4 Escáner) y el cluster de CTA del header.
//   2. Mobile · Mis Códices empty state: el h1 ya NO se renderiza
//      con fontSize 56 (gigante). Aplica fontSize 28 via media
//      query, igual al lenguaje del HeroTitleBlock estándar mobile.
//      El bloque entero queda centrado vertical respecto al viewport
//      con minHeight 70vh.
//   3. Desktop · Mis Códices empty state: agregado `height: 100%`
//      al motion.div root del CodicesSection para completar la
//      cadena de heights desde el grid del split-view → main →
//      motion.div key=codices → CodicesSection root → empty state.
//      Sin esa cadena el `height: 100%` interno no se propaga y
//      el bloque queda en su minHeight natural (más arriba que MI
//      NÚCLEO).
// v6.21 — Tres correcciones de altura y centrado de Mis Códices /
// títulos del visor:
//   1. Mobile · Mis Códices empty state: el HeroTitleBlock superior
//      y el título de sub-sección se ocultan cuando estás en Mis
//      Códices y books.length === 0. El único título visible queda
//      el del empty state interno de MN_Codices, que ahora vive con
//      `flex-center + height:100%` y centra el h1 verticalmente
//      respecto a toda la pantalla. Antes el HeroTitleBlock pintaba
//      "MIS CÓDICES" arriba pegado al borde y el subtítulo flotaba
//      en el centro — visualmente desconectados.
//   2. Desktop · Mis Códices empty state: el motion.div del visor
//      key=codices ahora pasa `style={{ height: "100%" }}`. Esto
//      permite que el contenedor interno del empty state (con
//      minHeight:100%) expanda al alto completo del visor → el
//      título "Mis Códices" queda centrado vertical, a la misma
//      altura visual que "MI NÚCLEO" del WelcomeViewerDesktop.
//   3. Desktop · /nucleo (modo Madre): paddingTop del <main> del
//      visor pasa de 24 → 0 cuando estamos en modo Madre, alineando
//      la altura de los títulos de cabinas (Mis Sesiones, Mis
//      Códices, Trayectoria, Mi Firma de Luz) con la versión
//      /escaner/nucleo desktop.
// v6.20 — Tres correcciones:
//   1. Logout (Desanclar) ahora cierra sesión al PRIMER click, no al
//      tercero. El handleSignout legacy llamaba clearCachedUser() +
//      nukeClerkStorage() ANTES de clerk.session.end()/signOut() —
//      borrar las cookies/localStorage de Clerk dejaba al SDK sin
//      contexto para terminar la sesión en el servidor, así que la
//      llamada fallaba silenciosamente y la sesión seguía viva en el
//      backend. Al refrescar, Clerk re-establecía el JWT desde el
//      cookie persistente. Nuevo orden: terminar sesión en el server
//      PRIMERO (clerk.session.end / clerk.signOut), DESPUÉS limpiar
//      storage local. Ambas operaciones siguen con timeout de 1.2s.
//   2. /escaner/nucleo mobile: tras recargar y cambiar de pestaña en
//      <8s, al regresar pedía login aunque la sesión estaba viva. El
//      browser pausa setTimeout/setInterval cuando la pestaña no es
//      visible; al volver, el timeout de 5500ms ya disparaba como
//      "expirado" inmediato → timedOut=true → SignInContent. Nuevo:
//      visibilitychange listener resetea mountTime + clerkReady=false
//      cuando la pestaña vuelve visible y aún no hay user, así da
//      otra ventana fresca de hidratación a Clerk.
//   3. scrollTo(0,0) automático cuando cambia activeTab (mobile y
//      desktop). Antes, al picar Mi Firma en mobile, la página
//      quedaba scrolleada en la posición de la sección anterior y
//      el tripulante caía a la mitad del contenido (el título Mi
//      Firma de Luz se veía abajo, no arriba). Resetea scroll del
//      window y del overlay .rsv-overlay-scroll cuando aplique.
// v6.19 — Tres ajustes pedidos por Zak tras el split de títulos:
//   1. Mobile: marginTop del título de sub-sección subió de 4 a 58
//      para que respire bajo el back button (que vive portaled fixed
//      top:14, alto ~36, bottom ~50). Antes "TRAYECTORIA DEL AVATAR"
//      quedaba pegadísimo al borde superior y chocaba con el back.
//   2. Sub-sección "Mi Firma" pasó a "Mi Firma de Luz" en
//      sectionLabelMap y en el cardSpec del dashboard. Aplica a
//      título mobile + título desktop + texto del item del sidebar.
//   3. Desktop: agregado helper renderDesktopTitle(text) que pinta
//      h1 fontSize 38, gradient cyan→white por palabra, animation
//      nuc-breath 7s. Aplicado a Trayectoria del Avatar, Mis Sesiones
//      (ambas variantes), Mi Firma de Luz (4 sub-tabs). Códices ya
//      tenía su propio header en MN_Codices.
// v6.18 — Restaurado el lenguaje tipográfico del título de las
// sub-secciones del Núcleo en mobile. Antes mostraba un h2 plano
// fontSize 22 con drop-shadow simple; Zak había logrado en una
// iteración anterior que coincidiera con el h1 del HeroTitleBlock
// "MI NÚCLEO" (fontSize 28, fontWeight 100, letterSpacing 0.2em,
// gradient cyan→white por palabra, animation nuc-breath 7s) y se
// perdió en la refactor del split. Ahora "Mis Códices", "Mis Sesiones",
// "Mi Firma" y "Trayectoria del Avatar" se renderizan con el mismo
// look del título principal — el shell se siente unificado.
// v6.17 — Tres ajustes para cerrar el flash residual del SignInContent
// en /escaner/nucleo mobile post-reload + cambio rápido de pestaña:
//   1. graceMs sin cache subió de 2500ms a 5000ms (con cache 6000ms);
//      timedOut sin cache subió de 1500ms a 5500ms. Suficiente margen
//      para que Clerk.user hidrate antes de declarar "no hay sesión".
//   2. Eliminada la animación decorativa "halo cyan + anillos
//      rotantes + orbe central dorado" que vivía dentro de
//      SignInContent. En la transición a SignInContent post-reload se
//      veía atascada en su frame inicial — un puntito cyan diminuto
//      sobre fondo azul oscuro confundía al Tripulante. La pantalla
//      de iniciar sesión ahora arranca directamente con título
//      "Expande Tu Frecuencia" + botón.
//   3. Loader del showLoading simplificado: solo texto pulsante
//      "Sintonizando…", sin anillo circular giratorio. Mismo motivo:
//      cualquier forma circular animada en mobile podía confundirse
//      con el orbe legacy que removimos.
// v6.16 — Fix flash de SignInContent al cambiar rápido a Mi Núcleo
// post-reload. Reportado por Zak: tras refresh en /escaner/radar,
// picar Holoteca rápido y luego Núcleo, aparecía el modal de iniciar
// sesión aunque la sesión estaba viva. Causa: graceMs=0 cuando NO
// hay cache hacía que el primer tick (300ms) viera Clerk.client
// cargado y Clerk.user aún no resuelto → vaciaba overrideUser.
// Cambios:
//   · graceMs sin cache subió de 0 a 2500ms — espera a que
//     Clerk.user llegue antes de declarar "no hay sesión".
//   · Nuevo useEffect que reacciona a useUser() del @clerk/clerk-react.
//     Apenas isLoaded && isSignedIn && user, populamos overrideUser y
//     marcamos clerkReady inmediatamente — red más rápida que el
//     polling de window.Clerk.
// v6.15 — Anillo violeta para admins en el avatar del IdentityBlock.
// Mismo lenguaje visual del Auth2Header (color #C77DFF). Sustituye el
// conic-gradient cyan/dorado de tripulantes regulares por uno violeta
// luminoso saturado y sube el glow del shadow para que se note al
// instante. Aplica en /nucleo, /escaner/nucleo, mobile + desktop, y
// en ambas variantes (compact + full) del IdentityBlock — el helper
// renderIdentity(compact) deriva avatarRingBg + avatarRingShadow del
// flag `isAdmin` que ya viene resuelto por useNucleoData.
// v6.14 — Dos cambios:
//   • Sub-nav del cascada desktop arranca colapsada por default
//     (antes se abría expandida al picar Sesiones / Mi Firma). Ahora
//     el tripulante ve la cabina con sub-nav contraída a íconos y
//     puede expandirla manualmente con el chevron.
//   • BackBtn portaled lleva data-rsv-back-button para que la
//     navegación con flechas del teclado en NavegadorEstacion lo
//     active al picar Arrow Left.
// v6.13.1 — Botón "Volver" de las sub-pantallas mobile (Mis Códices,
// Mis Sesiones, Trayectoria, Mi Firma) ahora es el MISMO pill
// glass-blur azul-noche que usa Calibración al entrar a un pilar
// (EV_Modulos). Antes era pill texto+icono inline gris en
// `.nuc-back-btn`, distinto al de Calibración. Ahora portaled fixed
// top:14 left:14 con flecha SVG, idéntico — coherencia total de la
// navegación back entre Núcleo y Calibración.
// v6.13 — Dos cambios pedidos por Zak:
//   (a) Fix del flicker "EXPLORADOR" al entrar al Núcleo. Antes el
//       badge debajo del nombre arrancaba con el default (Explorador)
//       mientras `useNucleoData` resolvía la suscripción real, y al
//       llegar la data saltaba a "Inmersión Solar" / "Sintonía Solar".
//       Ahora el badge se mantiene invisible (visibility:hidden +
//       opacity:0) hasta que `nucleoLoading` baja a false, y entra
//       con un fade limpio. Aplica al modo full y al modo compact
//       (sidebar colapsada).
//   (b) Sección "Mis Códices" ahora recibe isAdmin + creds para
//       habilitar el botón "Resetear mis códices (admin)" en el pie
//       del listado, exclusivo de Modo Arquitecto. Ver MN_Codices v1.2.
// v6.12 — Cuatro afinaciones del colapso de columnas:
//   1. Chevron de toggle se centra horizontalmente arriba cuando la
//      columna está colapsada (antes top:10 right:8 pisaba los SVGs
//      de los items).
//   2. paddingTop +44px en cada aside cuando colapsado para dejar
//      respirar el primer item por debajo del chevron centrado.
//   3. Bug fix del color del dot del tier en compact: comparaba
//      contra "is-inmersion" pero la className real es "is-gold", así
//      que Inmersión Solar caía al else gris. Ahora resuelve por
//      isInmersion / isSintonia (variables booleanas en scope).
//   4. Items del sub-nav pierden border y background cuando colapsada
//      e inactive (antes se veían como cuadrados independientes).
//      Active mantiene un sutil glow para mostrar la sub-sección
//      seleccionada. Gap entre dot y foto en compact: 6 → 14.
// v6.11 — Colapso independiente de las dos columnas de nav en
// desktop. Cada columna (sidebar con identidad + cabinas / sub-nav
// con sub-secciones) tiene un botón chevron en la esquina superior
// derecha que la contrae a 64px (solo SVGs, sin texto). Cuando la
// sidebar está colapsada: foto del avatar reducida a 36px, nombre
// oculto, chip del tier reducido a un dot (con tooltip), botón
// Desanclar reemplazado por icono de logout. Cuando la sub-nav está
// colapsada: header de la sección y subtítulos ocultos, items
// muestran solo el icono centrado. La grid template usa transition
// suave (cubic-bezier 0.22, 1, 0.36, 1) para que el colapso/expansión
// se sienta como un slide nativo. Estado vive en memoria de la sesión
// (useState, no localStorage).
// v6.10 — Rename del botón del sidebar/dashboard "Trayectoria del
// Avatar" → solo "Trayectoria". El header del visor central
// (sectionLabelMap.trayectoria) conserva "Trayectoria del Avatar"
// porque es el título del componente, no del botón que lo activa.
// v6.9 — Dos quirks de UX mobile:
//   (a) El badge de tier (Sintonía Solar / Inmersión Solar /
//       Explorador) debajo del nombre se vuelve <button>: picarlo
//       lleva siempre a Mi Firma → sub-tab Estado Orbital. Aplica
//       igual a los suscritos (gestión de membresía) y a los sin
//       membresía (CTA de activación).
//   (b) Listener nuevo de "rsv-nucleo-reset" — cuando el tripulante
//       pica el tab Núcleo de la BottomNav del Escáner estando
//       dentro de Mi Firma o Mis Sesiones, AppNavegacionMobile
//       dispara el evento y MiNucleo regresa al dashboard de cards.
//       El sub-tab interno (firmaSub/sesionesSub) se conserva — al
//       re-entrar a la rama, Zak vuelve donde estaba.
// v6.8 — Tres ajustes pedidos por Zak en mobile:
//   (a) Botón Volver del sub-tab tenía marginTop:0 — quedaba pegado
//       al borde superior del overlay. marginTop:14 le da aire sin
//       afectar la altura del título de Mi Firma / Mis Sesiones.
//   (b) Trayectoria pasa a llamarse "Trayectoria del Avatar" tanto
//       en el card del dashboard (cardSpecsBase) como en el header
//       del visor central (sectionLabelMap.trayectoria). Coherencia
//       con el contenido de la sub-pantalla.
//   (c) Otros cambios visibles en archivos siblings: MN_Codices
//       quitó la fila duplicada del título, MN_Sesiones invirtió el
//       orden Cámara Solar/Resonancia, EV_Recal quitó los dos h2
//       duplicados de "Trayectoria del Avatar".
// v6.7 — Rename user-facing del cuarto tab del sidebar: "Ajustes de
// Firma" → "Mi Firma". Aplica al cardSpecs (sidebar item), al
// sectionLabelMap (header del visor central) y al título del
// SubNavDesktop. El id interno sigue siendo "firma" — sólo el copy
// cambia. Los comentarios históricos del archivo conservan el
// nombre viejo para preservar la cronología del rediseño.
// v6.6 — Card "Explorar Red Solar Viva" en dos líneas: "EXPLORAR"
// como label superior tenue + "RED SOLAR VIVA" como cuerpo del
// título. Solo la card del Saturno se rompe en dos líneas; el resto
// del sidebar mantiene su title de una línea.
// v6.5 — WelcomeViewerDesktop más grande y centrado verticalmente.
// El h1 "MI NÚCLEO" pasa de 28 → 56 (mismo tamaño que el splash
// "Escáner Vibracional" del shell). Subtítulo de 11 → 14, descripción
// de 13 → 16. justifyContent del container pasa de flex-start →
// center y minHeight de 380 → 480 para que el bloque flote en el
// medio del visor cuando no hay sub-tab activo, en vez de quedarse
// pegado arriba.
// v6.4 — Cinco afinaciones desktop pedidas por Zak tras v6.3:
//   1. IExplorarGlyph se compacta dentro de su viewBox (cuerpo más
//      grande r=6.4, anillo proporcional rx=9 ry=2.4) y el icono se
//      acerca al texto en el sidebar via override de gap (8px en vez
//      del estándar 14px).
//   2. La navegación ↑↓ ya no salta entre columnas. Si el foco está
//      en la columna principal, ↑↓ recorren cabinas principales SIN
//      importar si la cabina nueva abre sub-nav. Para entrar al
//      sub-nav hay que apretar → explícitamente. Quitamos el
//      useEffect que cambiaba focusCol al cambiar activeTab.
//      Setteamos focusCol explícito en goToCard (→main), en clicks
//      de sub-items (→sub) y en ←/→.
//   3. Indicador visual de columna activa. Los wrappers de columna
//      llevan `data-focused="true|false"`; cuando no es la columna
//      con foco, su item activo se atenúa (border tenue, sin glow,
//      color rgba blanco). El active visible se concentra solo en
//      la columna donde están las flechas, así Zak ve claramente
//      "estoy aquí".
//   4. La línea derecha del SubNavDesktop ya no abarca el alto
//      completo del aside. Cambiamos el borderRight inline por un
//      background-image controlado que dibuja la línea solo hasta
//      ~30px debajo del último botón. Quitamos también el
//      borderRight del sidebar para mantener consistencia visual:
//      las dos columnas se alinean por contenido, no por barra
//      vertical.
//   5. (Comentario) — propuesta del CTA "RED SOLAR VIVA" cuando se
//      entra al Escáner queda fuera de v6.4. La versión actual
//      (CTA visible siempre que !inEscaner) ya cumple sin agregar
//      complejidad. Se evalúa en otro ciclo si Zak lo confirma.
// v6.3 — Cinco afinaciones desktop (3-columnas):
//   1. IExplorarGlyph se vuelve un planeta con anillo orbital tipo
//      Saturno (oblicuo). Antes era un globo terraqueo con líneas
//      meridiano + ecuador.
//   2. La columna 3 (visor) y la columna 2 (sub-nav) ya no muestran
//      la scrollbar nativa del browser — nueva clase utilitaria
//      `.nuc-no-scrollbar` (definida en MN_Styles v1.1) esconde el
//      thumb pero mantiene el scrolleo natural. La queja específica
//      de Zak fue la scrollbar a la derecha en Cámara Solar.
//   3. Atajos de teclado expandidos. Antes ←→ rotaban entre tabs
//      principales (codices/sesiones/trayectoria/firma). Ahora:
//        · ↑↓ navegan dentro de la columna activa (cardSpecs si la
//          rama no tiene sub-items, sub-items si los tiene).
//        · ←→ alternan el foco entre la columna principal (sidebar)
//          y la columna sub-nav cuando ambas existen. Si solo hay
//          una columna activa, ←→ navegan tabs como antes.
//      Estado nuevo: `keyboardFocusCol: "main" | "sub"` — arranca en
//      "sub" cuando hay sub-nav (es la columna más reciente, como
//      pidió Zak).
//   4. El botón Desanclar de la sidebar desktop pasa de
//      `justify-content: flex-start` a `center`. Junto con el cambio
//      en MN_Styles v1.1 (sidebar items centrados), todo el menú de
//      la columna izquierda queda alineado al centro.
//   5. La card "Explorar Red Solar Viva" conserva el subtítulo
//      "Vuelve al sistema solar" (v6.2) sin cambios.
// v6.2 — Dos micro-afinaciones del v6.1 pedidas por Zak:
//   1. paddingBottom del botón "Desanclar" en /escaner/nucleo
//      mobile baja de 110 → 85. Antes el aire entre el botón y
//      la BottomNav del shell era ~50px; ahora ~25px (medida
//      pedida).
//   2. Subtítulo de la card "Explorar Red Solar Viva" cambia
//      de "Vuelve al sistema solar público" → "Vuelve al
//      sistema solar". "Público" sonaba a república y rompía
//      la voz solar del Ecosistema.
//
// v6.1 — Tres afinaciones del v6.0:
//   1. Avatar del IdentityBlock (sidebar desktop / hero mobile) ya
//      no se ve cortado: el div interno toma background sólido
//      #0B0C13 (mismo patrón del .nuc-avatar-inner de Identidad
//      Visual). Antes usaba un radial-gradient con alpha y el
//      conic-gradient externo dejaba ver borde recortado.
//   2. Mobile /nucleo (modo Madre standalone, SIN shell del
//      Escáner) ya scrollea hacia abajo. Antes el wrapper .nuc-root
//      tomaba overflowY:visible cuando domoMode, asumiendo que el
//      shell del Escáner manejaba el scroll. Pero en /nucleo no hay
//      shell del Escáner, así que la página quedaba congelada. Ahora
//      detectamos pathname: si NO empieza con /escaner/, mobile
//      toma overflowY:auto + height:100dvh (el Núcleo se hace cargo
//      de su propio scroll, igual que el flujo standalone).
//   3. Mobile /escaner/nucleo (con shell del Escáner) gana
//      paddingBottom adicional en la página principal del Núcleo
//      para que el botón "Desanclar" quede sobre la BottomNav del
//      shell, no tapado debajo. Antes Desanclar caía justo donde
//      empieza la barra inferior y no era pickeable.
//
// v6.0 — Rearquitectura desktop a Layout 3 Columnas (cascada
// Master-Detail-Detail) tipo iPadOS Settings / macOS Finder.
// Cambios estructurales pedidos por Zak en la transmisión del
// 2026-04-29:
//   1. Sidebar (Columna 1) baja de 28% del viewport a 280px fijo
//      → libera ~130px de espacio para el visor.
//   2. Cuando se entra a "Mis Sesiones" o "Ajustes de Firma"
//      aparece una segunda columna (también 280px) con las
//      sub-secciones de esa rama:
//        Mis Sesiones  → Cámara Solar · Cámara de Resonancia
//        Ajustes Firma → Identidad Visual · Estado Orbital ·
//                        Registro de Intercambios · Claves de
//                        Seguridad
//      La columna 3 muestra el contenido final de la sub-sección
//      activa.
//   3. "Estado Orbital" (membresía Sintonía/Inmersión + gestionar
//      pago + chip Privilegios) se migró desde Cámara Solar a
//      Ajustes de Firma. La membresía controla TODO el ecosistema,
//      no sólo sesiones grupales.
//   4. Card "Explorar Ecosistema" del sidebar:
//        · /nucleo (modo Madre)         → no se muestra.
//        · /escaner/nucleo (modo Escáner) → se muestra como
//          "Explorar Red Solar Viva".
//   5. Auth2Header del Escáner sigue visible al entrar a Mi
//      Núcleo (gestionado en Domo v4.65 con ctaOnly=true).
//
// Mobile mantiene la arquitectura del v4.0 (dashboard inicio +
// sub-pantalla con back arrow). Cada sub-pantalla mobile usa el
// wrapper original (SesionesTabPanel, FirmaSection) que stack-ea
// las sub-secciones verticalmente. El layout 3-columnas SÓLO
// aplica desktop.
//
// Toda la lógica de auth, signOut, Clerk, props controls, hash
// routing y mobile sigue idéntica al v5.0.
import * as React from "react"
import {
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { ControlType, addPropertyControls } from "framer"
import { ClerkProvider, useUser, useClerk } from "@clerk/clerk-react"

import { Auth2Modal } from "./Auth2Modal.tsx"

import { useAuthModalState } from "./AuthOverrides.tsx"

import MNShared from "./MN_Shared.tsx"
import MNStyles from "./MN_Styles.tsx"
import MNCodices from "./MN_Codices.tsx"
import MNSesiones from "./MN_Sesiones.tsx"
import MNTrayectoria from "./MN_Trayectoria.tsx"
import MNFirma from "./MN_Firma.tsx"
import MNCamara from "./MN_Camara.tsx"

const {
    CLERK_KEY,
    NUC_CACHE_KEY,
    cacheUser,
    getCachedUser,
    clearCachedUser,
    nukeClerkStorage,
    useIsMobile,
    hexToRgba,
    useNucleoData,
    useHashTab,
    cV,
    tV,
    fU,
    sR,
    isSubActive,
    Stars,
} = MNShared
const { useInjectCss } = MNStyles
const { CodicesSection } = MNCodices
const { SesionesTabPanel, CamaraResonanciaSection } = MNSesiones
const { TrayectoriaTabPanel } = MNTrayectoria
const {
    FirmaSection,
    IdentidadVisualSection,
    EstadoOrbitalSection,
    RegistroIntercambiosSection,
    ClavesSeguridadSection,
} = MNFirma
const { CamaraSection } = MNCamara

type TabKey =
    | "dashboard"
    | "codices"
    | "escaner"
    | "sesiones"
    | "trayectoria"
    | "firma"

/* Sub-keys de las ramas con cascada (columna 3 desktop). */
type SesionesSubKey = "camara-solar" | "camara-resonancia"
type FirmaSubKey = "identidad" | "orbital" | "intercambios" | "seguridad"

/* ══════════════════════════════════════════════════
   SignInContent — Pantalla de inicio de sesión
   ══════════════════════════════════════════════════ */
function SignInContent({ accent }: { accent: string }) {
    const modalState = useAuthModalState()

    /* Polling: detectar si el usuario ya inició sesión (vía modal) */
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const g = (window as any).Clerk
                if (g?.user) {
                    clearInterval(interval)
                    cacheUser(g.user)
                    setTimeout(() => window.location.reload(), 2000)
                }
            } catch {}
        }, 800)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && modalState.close) {
                modalState.close()
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [modalState])

    return (
        <div
            style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100dvh",
                padding: "0 24px",
                overflow: "hidden",
            }}
        >
            {/* v6.17 — Eliminada la animación decorativa "orbe + halo
                cyan + anillos rotantes + punto central" que vivía
                aquí. En mobile, durante la transición a SignInContent
                (sobre todo cuando MiNucleo se monta tras un cambio
                rápido de pestaña post-reload), esa animación se
                quedaba atascada en su frame inicial — se veía como
                un puntito cyan diminuto en un fondo azul oscuro,
                visualmente confuso para el Tripulante. La pantalla
                de iniciar sesión ahora arranca directamente con el
                título "Expande Tu Frecuencia" + el botón de auth. */}
            <motion.h1
                className="nuc-guest-title"
                initial={{ opacity: 0, y: -16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                    duration: 0.9,
                    delay: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 42,
                    fontWeight: 100,
                    letterSpacing: "0.4em",
                    marginRight: "-0.4em",
                    textTransform: "uppercase",
                    color: "#E6F2FF",
                    textAlign: "center",
                    lineHeight: 1.3,
                    textShadow: `0 0 6px ${accent}, 0 0 20px ${hexToRgba(accent, 0.35)}`,
                    margin: 0,
                    whiteSpace: "pre-line",
                }}
            >
                {"Expande\nTu Frecuencia"}
            </motion.h1>
            <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{
                    width: 80,
                    height: 1,
                    marginTop: 24,
                    background: `linear-gradient(90deg, transparent, ${hexToRgba(accent, 0.5)}, transparent)`,
                }}
            />
            <motion.p
                className="nuc-guest-sub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                style={{
                    fontSize: 13,
                    fontWeight: 300,
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.35)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    maxWidth: 380,
                    marginTop: 16,
                }}
            >
                Inicia sesión para acceder a tu núcleo
            </motion.p>
            <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85 }}
                className="nuc-gold"
                onClick={() => modalState.open("login")}
                style={{
                    marginTop: 36,
                    minWidth: 220,
                    fontSize: 13,
                    letterSpacing: "0.18em",
                    padding: "14px 36px",
                }}
            >
                Iniciar Sesión
            </motion.button>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                style={{
                    marginTop: 16,
                    fontSize: 13,
                    fontWeight: 300,
                    letterSpacing: "0.04em",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Inter',sans-serif",
                    textAlign: "center",
                }}
            >
                ¿Aún no tienes tu perfil?{" "}
                <span
                    onClick={() => {
                        modalState.open("register")
                    }}
                    style={{
                        color: "rgba(0,194,255,0.6)",
                        cursor: "pointer",
                        transition: "color 0.25s ease",
                        position: "relative",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "rgba(0,194,255,1)"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(0,194,255,0.6)"
                    }}
                >
                    Crear cuenta
                </span>
            </motion.p>
            <Auth2Modal clerkPublishableKey={CLERK_KEY} />
        </div>
    )
}

/* Cache del tier (membresía) por Tripulante — para que el Estado Orbital
   (badge "Explorador" / "Sintonía") y la tarjeta dorada de planes aparezcan
   AL INSTANTE con el resto del dashboard, sin esperar el fetch completo del
   Núcleo. En la 1ª visita aún espera; de ahí en adelante el seed síncrono del
   cache las pinta junto a todo lo demás. */
const NUCLEO_TIER_CACHE = "rsv-nucleo-tier-"
function readTierCache(uid: string): { group: string; active: boolean } | null {
    if (!uid || typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(NUCLEO_TIER_CACHE + uid)
        if (!raw) return null
        const j = JSON.parse(raw)
        if (typeof j?.group === "string" && typeof j?.active === "boolean") {
            return { group: j.group, active: j.active }
        }
    } catch {}
    return null
}
function writeTierCache(uid: string, group: string, active: boolean) {
    if (!uid || typeof window === "undefined") return
    try {
        localStorage.setItem(
            NUCLEO_TIER_CACHE + uid,
            JSON.stringify({ group, active })
        )
    } catch {}
}

function DashboardContent({
    user,
    hookUser,
    accentColor,
    contentMaxWidthPx,
    sidePaddingPx,
    topPaddingPx,
    pageTitleText,
    pageTitleSize,
    titleTopOffsetPx,
    subtitleText,
    supabaseUrl,
    supabaseAnonKey,
    stripePortalUrl,
    onSignout,
    scannerAuthSlot,
}: any) {
    const email = user?.primaryEmailAddress?.emailAddress || undefined
    const {
        books,
        sessions,
        payments,
        sub,
        isAdmin,
        loading: nucleoLoading,
    } = useNucleoData(user?.id, email, supabaseUrl, supabaseAnonKey)
    const isMobile = useIsMobile()
    const [activeTab, setActiveTab] = useHashTab("dashboard")

    /* Persistir el tier real en cuanto el fetch resuelve, para que la próxima
       visita pinte el Estado Orbital + la tarjeta de planes al instante. */
    useEffect(() => {
        if (nucleoLoading) return
        const uid =
            user?.id ||
            (typeof window !== "undefined"
                ? ((window as any).Clerk?.user?.id as string) || ""
                : "")
        if (uid) {
            writeTierCache(
                uid,
                (sub?.group_name || "").toLowerCase(),
                isSubActive(sub)
            )
        }
    }, [nucleoLoading, user?.id, sub])

    /* v6.30 — Pre-carga de portadas de Códices. Al entrar a Mi Núcleo
       warmeamos la cache del navegador con las imágenes de portada
       (cover_url) de los libros, así "Mis Códices" abre con las
       portadas ya listas. Fire-and-forget, no bloquea el render. */
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!Array.isArray(books) || books.length === 0) return
        for (const b of books) {
            const url = String((b as any)?.cover_url ?? "")
            if (!url) continue
            const img = new Image()
            img.src = url
        }
    }, [books])

    /* v6.9 — Listener para "rsv-nucleo-reset". Lo dispara
       AppNavegacionMobile cuando el tripulante pica el tab Núcleo en
       la BottomNav del Escáner estando ya dentro de /escaner/nucleo
       (en una sub-pantalla como Mi Firma o Mis Sesiones). Resetea
       el activeTab interno a "dashboard" para que la nav inferior
       se sienta como "regresar a la capa madre". El sub-tab interno
       de Firma/Sesiones se mantiene en su última posición — al
       re-entrar a la rama, Zak vuelve donde estaba. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const onReset = () => setActiveTab("dashboard")
        window.addEventListener("rsv-nucleo-reset", onReset)
        return () =>
            window.removeEventListener("rsv-nucleo-reset", onReset)
    }, [setActiveTab])

    /* v6.0 — pathname listener. La card "Explorar Red Solar Viva"
       sólo aparece en el sidebar cuando estamos en /escaner/nucleo
       (modo Escáner). En /nucleo (modo Madre) ya estamos EN el
       Ecosistema, no tiene sentido invitar a "explorarlo". */
    const [pathname, setPathname] = useState(() =>
        typeof window === "undefined" ? "" : window.location.pathname
    )
    useEffect(() => {
        const sync = () => setPathname(window.location.pathname)
        const onNav = (e: any) => {
            const p = e?.detail?.path
            if (typeof p === "string") setPathname(p)
            else sync()
        }
        window.addEventListener("popstate", sync)
        window.addEventListener("rsv-navigate", onNav as EventListener)
        return () => {
            window.removeEventListener("popstate", sync)
            window.removeEventListener(
                "rsv-navigate",
                onNav as EventListener
            )
        }
    }, [])
    const isModeEscaner = pathname.startsWith("/escaner/")
    /* Flag global "ocultar Cámara Solar" (Motor → app_flags:hide_camara_solar).
       Cuando está ON, la pestaña "Mis Sesiones" se esconde SOLO para quien no
       tiene sesiones que ver (sin grabaciones grupales accesibles ni membresía);
       quien sí las tiene la conserva. Se siembra del cache local (anti-flash) y
       solo se aplica una vez cargados los datos (nunca esconde a un miembro
       mientras carga). */
    const [hideCamaraFlag, setHideCamaraFlag] = useState<boolean>(() => {
        try {
            return typeof localStorage !== "undefined"
                ? localStorage.getItem("rsv-hide-camara") === "1"
                : false
        } catch {
            return false
        }
    })
    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) return
        let cancel = false
        ;(async () => {
            try {
                const r = await fetch(
                    `${supabaseUrl}/rest/v1/rpc/get_app_flag`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: supabaseAnonKey,
                            Authorization: `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({ p_key: "hide_camara_solar" }),
                    }
                )
                const v = r.ok ? await r.json() : false
                if (!cancel) {
                    setHideCamaraFlag(v === true)
                    try {
                        localStorage.setItem(
                            "rsv-hide-camara",
                            v === true ? "1" : "0"
                        )
                    } catch {}
                }
            } catch {}
        })()
        return () => {
            cancel = true
        }
    }, [supabaseUrl, supabaseAnonKey])
    /* Flag global INDEPENDIENTE "ocultar TODA la oferta de Sesiones" (Motor →
       app_flags:hide_sesiones). A diferencia de hideCamaraFlag (que solo
       esconde el card a quien no tiene nada que ver), este apaga "Mis
       Sesiones" SIEMPRE que está ON — la oferta entera (grupales + 1:1) dejó
       de existir, así que ni tener sesiones compradas ni membresía activa
       salva la pestaña. Mismo patrón de cache local + fetch. */
    const [hideAllSesionesFlag, setHideAllSesionesFlag] = useState<boolean>(
        () => {
            try {
                return typeof localStorage !== "undefined"
                    ? localStorage.getItem("rsv-hide-sesiones") === "1"
                    : false
            } catch {
                return false
            }
        }
    )
    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) return
        let cancel = false
        ;(async () => {
            try {
                const r = await fetch(
                    `${supabaseUrl}/rest/v1/rpc/get_app_flag`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: supabaseAnonKey,
                            Authorization: `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({ p_key: "hide_sesiones" }),
                    }
                )
                const v = r.ok ? await r.json() : false
                if (!cancel) {
                    setHideAllSesionesFlag(v === true)
                    try {
                        localStorage.setItem(
                            "rsv-hide-sesiones",
                            v === true ? "1" : "0"
                        )
                    } catch {}
                }
            } catch {}
        })()
        return () => {
            cancel = true
        }
    }, [supabaseUrl, supabaseAnonKey])
    const hasSesiones =
        (Array.isArray(sessions) && sessions.length > 0) || !!sub
    const hideSesionesTab =
        !nucleoLoading &&
        (hideAllSesionesFlag || (hideCamaraFlag && !hasSesiones))
    /* v6.25 — Guard: si el Tripulante entra a /escaner/nucleo con
       activeTab="sesiones" (refresh con hash legacy, navegación
       cruzada desde /nucleo, etc.), lo regresamos al dashboard de
       cards porque la pestaña "Mis Sesiones" no existe en modo
       Escáner. Aplica solo en mobile (donde hay dashboard). En
       desktop el sidebar oculta automáticamente la card via
       cardSpecsBase filtrada. */
    useEffect(() => {
        if (
            (isModeEscaner || hideSesionesTab) &&
            typeof activeTab === "string" &&
            activeTab === "sesiones"
        ) {
            setActiveTab("dashboard")
        }
    }, [isModeEscaner, hideSesionesTab, activeTab])

    /* v6.0 — sub-secciones de las ramas con cascada (Sesiones, Firma).
       activeSub se sincroniza con activeTab: cuando entramos a una
       rama con sub-items, arranca en el primero por default. Cuando
       salimos a otra rama (sin sub-items), se anula. */
    const [sesionesSub, setSesionesSub] = useState<SesionesSubKey>(
        "camara-solar"
    )
    const [firmaSub, setFirmaSub] = useState<FirmaSubKey>("identidad")

    /* v6.28 (2026-05-20) — Deep-link sub-path en el hash:
       `#mifirma/orbital`, `#mifirma/intercambios`, etc., abren el
       sub-tab correspondiente directo. Permite que CTAs desde otras
       capas (INMERSIÓN ACTIVA en Sesiones, prompts de membresía en
       Cámara Solar) aterricen al Tripulante exactamente en el
       Estado Orbital sin tener que navegar manualmente. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const readFirmaSub = () => {
            const raw = window.location.hash.replace("#", "").toLowerCase()
            const parts = raw.split("/")
            const head = parts[0]
            const sub = parts[1]
            if (
                head !== "mifirma" &&
                head !== "firma" &&
                head !== "ajustes"
            )
                return
            if (sub === "orbital" || sub === "estadoorbital")
                setFirmaSub("orbital")
            else if (sub === "identidad" || sub === "identidadvisual")
                setFirmaSub("identidad")
            else if (sub === "intercambios" || sub === "registro")
                setFirmaSub("intercambios")
            else if (sub === "seguridad" || sub === "accesos")
                setFirmaSub("seguridad")
        }
        readFirmaSub()
        window.addEventListener("hashchange", readFirmaSub)
        return () => window.removeEventListener("hashchange", readFirmaSub)
    }, [])

    /* v6.11 — Colapso independiente de columnas en Mi Núcleo desktop.
       Cada columna (sidebar con identidad + items / sub-nav) tiene su
       propio toggle. Colapsada pasa de 280px a 64px y muestra solo
       íconos. La identidad se reduce a foto chica + dot del tier
       (sin nombre ni texto). Botón de toggle en esquina superior
       derecha de cada wrapper. Estado se persiste solo durante la
       sesión (no localStorage) para mantener simplicidad. */
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    /* v6.14 — sub-nav arranca colapsada por default. Si el tripulante
       quiere expandirla pica el chevron. La sidebar principal sigue
       expandida al entrar (no se cambia su default). */
    const [subNavCollapsed, setSubNavCollapsed] = useState(true)

    /* v6.3 — Atajos de teclado completos para layout 3 columnas:
       ↑↓ navegan dentro de la columna activa con loop.
       ← / → alternan el foco entre columna principal (sidebar) y
       columna sub-nav cuando ambas existen. Si no hay sub-nav,
       ←→ rotan entre tabs principales (comportamiento legacy). */
    /* v6.25 — En modo Escáner (/escaner/nucleo) la pestaña "Mis
       Sesiones" no existe. Las sesiones (Cámara Solar grupal y
       Cámara de Resonancia 1:1) se reservan a la capa Madre /nucleo
       en web y desktop. El TAB_ORDER del modo Escáner cae a 3
       pestañas. */
    const TAB_ORDER: TabKey[] =
        isModeEscaner || hideSesionesTab
            ? ["codices", "trayectoria", "firma"]
            : ["codices", "sesiones", "trayectoria", "firma"]
    const SESIONES_SUBS: SesionesSubKey[] = [
        "camara-solar",
        "camara-resonancia",
    ]
    const FIRMA_SUBS: FirmaSubKey[] = [
        "identidad",
        "orbital",
        "intercambios",
        "seguridad",
    ]
    const [keyboardFocusCol, setKeyboardFocusCol] = useState<"main" | "sub">(
        "sub"
    )
    /* v6.4 — focusCol solo cambia por interacción explícita
       (click en sidebar/sub-item, tecla ←/→). Caso especial: si
       activeTab cambia a una rama SIN sub-nav, forzamos "main"
       para que el indicador visual no quede incoherente — pero
       NO tocamos focusCol cuando la nueva rama sí tiene sub-nav,
       así Zak puede pasar de "codices" a "sesiones" con ↓ y
       seguir navegando la columna izquierda con la siguiente ↓. */
    useEffect(() => {
        const hasSubNav = activeTab === "sesiones" || activeTab === "firma"
        if (!hasSubNav) setKeyboardFocusCol("main")
    }, [activeTab])

    /* v6.20 — Scroll al TOP cuando se cambia de cabina (activeTab) o
       sub-tab. Antes: al picar Mi Firma desde el dashboard, el
       tripulante quedaba a la mitad del contenido (heredando el
       scrollTop previo) — el título "Mi Firma de Luz" se veía abajo,
       parecía que la página había abierto en Estado Orbital. Ahora
       reseteamos window.scrollTo(0,0) y el overlay del shell del
       Escáner (.rsv-overlay-scroll) cada vez que cambia activeTab,
       firmaSub o sesionesSub. firmaSub también dispara reset cuando
       el tripulante salta entre Identidad / Estado Orbital / etc. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const id = requestAnimationFrame(() => {
            try {
                window.scrollTo({ top: 0, behavior: "auto" })
            } catch {}
            try {
                const overlay = document.querySelector(
                    ".rsv-overlay-scroll"
                ) as HTMLElement | null
                if (overlay) overlay.scrollTo({ top: 0, behavior: "auto" })
            } catch {}
        })
        return () => cancelAnimationFrame(id)
    }, [activeTab, firmaSub, sesionesSub])
    const activeTabRef = useRef(activeTab)
    const sesionesSubRef = useRef(sesionesSub)
    const firmaSubRef = useRef(firmaSub)
    const focusColRef = useRef(keyboardFocusCol)
    activeTabRef.current = activeTab
    sesionesSubRef.current = sesionesSub
    firmaSubRef.current = firmaSub
    focusColRef.current = keyboardFocusCol
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const k = e.key
            if (
                k !== "ArrowRight" &&
                k !== "ArrowLeft" &&
                k !== "ArrowUp" &&
                k !== "ArrowDown"
            )
                return
            const target = e.target as HTMLElement | null
            if (
                target?.closest(
                    "input, textarea, select, [contenteditable=true]"
                )
            )
                return
            const tab = activeTabRef.current
            const hasSubNav = tab === "sesiones" || tab === "firma"
            const focusCol = focusColRef.current

            if (k === "ArrowUp" || k === "ArrowDown") {
                e.preventDefault()
                const dir = k === "ArrowDown" ? 1 : -1
                if (hasSubNav && focusCol === "sub") {
                    if (tab === "sesiones") {
                        const arr = SESIONES_SUBS
                        const idx = arr.indexOf(sesionesSubRef.current)
                        const next =
                            arr[(idx + dir + arr.length) % arr.length]
                        setSesionesSub(next)
                    } else {
                        const arr = FIRMA_SUBS
                        const idx = arr.indexOf(firmaSubRef.current)
                        const next =
                            arr[(idx + dir + arr.length) % arr.length]
                        setFirmaSub(next)
                    }
                } else {
                    const idx = TAB_ORDER.indexOf(activeTabRef.current)
                    const safeIdx = idx < 0 ? 0 : idx
                    const next =
                        TAB_ORDER[
                            (safeIdx + dir + TAB_ORDER.length) %
                                TAB_ORDER.length
                        ]
                    setActiveTab(next)
                }
                return
            }

            /* ←/→ */
            if (hasSubNav) {
                if (k === "ArrowLeft") setKeyboardFocusCol("main")
                else setKeyboardFocusCol("sub")
                return
            }
            /* Sin sub-nav: ←→ rotan tabs principales (legacy). */
            e.preventDefault()
            const dir = k === "ArrowRight" ? 1 : -1
            const idx = TAB_ORDER.indexOf(activeTabRef.current)
            const safeIdx = idx < 0 ? 0 : idx
            const next =
                TAB_ORDER[
                    (safeIdx + dir + TAB_ORDER.length) % TAB_ORDER.length
                ]
            setActiveTab(next)
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ position: "relative", zIndex: 2 }}
        >
            <motion.div
                variants={cV}
                initial="hidden"
                animate="visible"
                style={{
                    margin: "0 auto",
                    maxWidth: "100%",
                    /* v6.23 — En mobile sub-página (no dashboard), el
                       padding-top se fuerza a 0 para que /nucleo y
                       /escaner/nucleo coincidan visualmente. /nucleo
                       mobile dashboard sigue con topPaddingPx (60)
                       porque el HeroTitleBlock necesita aire del top
                       en modo Madre. */
                    padding: isMobile
                        ? `calc(${activeTab === "dashboard" ? topPaddingPx : 0}px + env(safe-area-inset-top, 0px)) 16px 40px`
                        : `${topPaddingPx}px 0 0 0`,
                }}
            >
                {(() => {
                    /* v6.X — preferredName en unsafeMetadata gana
                       sobre fullName/firstName de Clerk. Cubre el caso
                       en que Clerk rechaza un nombre por validación
                       (caracteres especiales, lastName vacío) y el
                       Tripulante prefiere ver el nombre que él escribió
                       en lugar del que Clerk impuso. */
                    const displayName =
                        (user?.unsafeMetadata as any)?.preferredName ||
                        user?.fullName ||
                        user?.firstName ||
                        "Tripulante"
                    const avatarUrl =
                        user?.profileImageUrl || user?.imageUrl || ""
                    const initial = (user?.firstName ||
                        displayName ||
                        "T")
                        .charAt(0)
                        .toUpperCase()
                    /* Seed síncrono del tier desde cache (lectura pura, sin
                       hook — este bloque vive en una IIFE de render). */
                    const cachedTier = readTierCache(
                        user?.id ||
                            (typeof window !== "undefined"
                                ? ((window as any).Clerk?.user?.id as string) ||
                                  ""
                                : "")
                    )
                    const fetchedActive = isSubActive(sub)
                    const fetchedGroup = (sub?.group_name || "").toLowerCase()
                    /* Hasta que el fetch resuelve, usa el tier cacheado → el
                       badge + la tarjeta de planes aparecen CON el resto. */
                    const subActive = !nucleoLoading
                        ? fetchedActive
                        : (cachedTier?.active ?? false)
                    const groupName = !nucleoLoading
                        ? fetchedGroup
                        : (cachedTier?.group ?? "")
                    const isInmersion =
                        subActive &&
                        (groupName === "cuasar" ||
                            groupName === "pulsar" ||
                            groupName === "inmersion")
                    const isSintonia =
                        subActive && groupName === "sintonia"
                    const tierLabel = isInmersion
                        ? "Inmersión Solar"
                        : isSintonia
                          ? "Sintonía Solar"
                          : "Explorador"
                    const tierClass = isInmersion
                        ? "is-gold"
                        : isSintonia
                          ? ""
                          : "is-explorer"
                    /* v6.31 — Resuelto si el fetch terminó O ya teníamos el tier
                       en cache → no esperar a books/payments para pintar el
                       Estado Orbital + la tarjeta de planes (sin reintroducir el
                       flash del miembro: con cache se sabe que NO es invitado). */
                    const tierResolved = !nucleoLoading || cachedTier != null

                    /* ─── Iconos sidebar / dashboard ─── */
                    const ICodicesGlyph = (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line
                                x1="9"
                                y1="7"
                                x2="15"
                                y2="7"
                                opacity="0.5"
                            />
                        </svg>
                    )
                    const ISesionesGlyph = (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="9" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    )
                    const ITrayectoriaGlyph = (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="3 17 9 11 13 15 21 7" />
                            <polyline points="14 7 21 7 21 14" />
                        </svg>
                    )
                    const IAjustesGlyph = (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                        </svg>
                    )
                    /* v6.4 — Planeta tipo Saturno más compacto. Antes
                       el cuerpo (r=5.2) se veía pequeño y el anillo
                       muy expandido respecto al texto. Ahora cuerpo
                       r=6.4 y anillo rx=9 ry=2.4 — más balanceado y
                       el icono "llena" su área visual. La rotación
                       sigue en -22° vía <g transform>. */
                    const IExplorarGlyph = (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="6.4" />
                            <g transform="rotate(-22 12 12)">
                                <ellipse
                                    cx="12"
                                    cy="12"
                                    rx="9"
                                    ry="2.4"
                                />
                            </g>
                        </svg>
                    )
                    const IArrowRightGlyph = (
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="13 5 19 12 13 19" />
                        </svg>
                    )
                    const IBackGlyph = (
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="11 19 5 12 11 5" />
                        </svg>
                    )

                    /* v6.11 — chevrons compactos para los toggles de
                       colapso de columnas (esquina superior derecha de
                       cada wrapper en desktop). Apuntan hacia la
                       dirección a la que la columna se va a mover
                       cuando se hace click. */
                    const IChevronLeftGlyph = (
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    )
                    const IChevronRightGlyph = (
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    )
                    /* v6.11 — Logout glyph para reemplazar el botón de
                       texto "Desanclar" cuando la sidebar está colapsada.
                       Misma silueta que iconos de salida estándar
                       (puerta + flecha hacia afuera). */
                    const ILogoutGlyph = (
                        <svg
                            width="16"
                            height="16"
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
                    )

                    /* ─── Iconos pequeños para la columna 2 ─── */
                    const subIcon = (
                        path: string,
                        size: number = 18,
                        opacity: number = 1
                    ) => (
                        <svg
                            width={size}
                            height={size}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ opacity }}
                            dangerouslySetInnerHTML={{ __html: path }}
                        />
                    )
                    /* SVG paths inline pequeños (cyan/dorado neutro,
                       columna 2 los pinta con currentColor según el
                       estado del item). */
                    const ICamaraSolarMini = (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    )
                    const ICamaraResonanciaMini = (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z" />
                        </svg>
                    )
                    const IIdentidadMini = (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    )
                    const IOrbitalMini = (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        </svg>
                    )
                    const IIntercambiosMini = (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
                            <line x1="8" y1="10" x2="16" y2="10" />
                            <line x1="8" y1="14" x2="12" y2="14" />
                        </svg>
                    )
                    const ISeguridadMini = (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    )

                    /* ─── Specs de las cards (sidebar mobile + columna 1 desktop) ─── */
                    const cardSpecsBase: {
                        id: TabKey | "explorar"
                        title: string
                        sub: string
                        icon: React.ReactNode
                    }[] = [
                        {
                            id: "codices",
                            title: "Mis Códices",
                            sub: "Tu biblioteca de Códices de Luz",
                            icon: ICodicesGlyph,
                        },
                        /* v6.25 — "Mis Sesiones" sólo se incluye en
                           la capa Madre /nucleo. En /escaner/nucleo
                           el card queda apagado (sesiones gestionadas
                           desde redsolarviva.com web/desktop). */
                        ...(isModeEscaner || hideSesionesTab
                            ? []
                            : [
                                  {
                                      id: "sesiones" as const,
                                      title: "Mis Sesiones",
                                      sub: "Cámara Solar y reservas 1:1",
                                      icon: ISesionesGlyph,
                                  },
                              ]),
                        {
                            id: "trayectoria",
                            title: "Trayectoria",
                            sub: "Evolución de tu Índice de Luz",
                            icon: ITrayectoriaGlyph,
                        },
                        {
                            id: "firma",
                            title: "Mi Firma de Luz",
                            sub: "Perfil, membresía y transacciones",
                            icon: IAjustesGlyph,
                        },
                    ]
                    /* v6.0 — "Explorar Red Solar Viva" sólo en modo Escáner. */
                    const cardSpecs = isModeEscaner
                        ? [
                              ...cardSpecsBase,
                              {
                                  id: "explorar" as const,
                                  title: "Explorar Red Solar Viva",
                                  sub: "Vuelve al sistema solar",
                                  icon: IExplorarGlyph,
                              },
                          ]
                        : cardSpecsBase

                    /* ─── Specs de sub-items (columna 2 desktop / mobile usa wrappers) ─── */
                    const sesionesSubItems: {
                        id: SesionesSubKey
                        title: string
                        sub: string
                        icon: React.ReactNode
                    }[] = [
                        {
                            id: "camara-solar",
                            title: "Cámara Solar",
                            sub: "Sesiones grupales",
                            icon: ICamaraSolarMini,
                        },
                        {
                            id: "camara-resonancia",
                            title: "Cámara de Resonancia",
                            sub: "Sesiones 1:1 con Zak'Haar",
                            icon: ICamaraResonanciaMini,
                        },
                    ]
                    const firmaSubItems: {
                        id: FirmaSubKey
                        title: string
                        sub: string
                        icon: React.ReactNode
                    }[] = [
                        {
                            id: "identidad",
                            title: "Identidad Visual",
                            sub: "Foto y nombre",
                            icon: IIdentidadMini,
                        },
                        {
                            id: "orbital",
                            title: "Estado Orbital",
                            sub: "Membresía y privilegios",
                            icon: IOrbitalMini,
                        },
                        {
                            id: "intercambios",
                            title: "Registro de Intercambios",
                            sub: "Pagos y recibos",
                            icon: IIntercambiosMini,
                        },
                        {
                            id: "seguridad",
                            title: "Claves de Seguridad",
                            sub: "Contraseña y admin",
                            icon: ISeguridadMini,
                        },
                    ]

                    const goToCard = (id: TabKey | "explorar") => {
                        if (id === "explorar") {
                            const nav = (window as any).rsvNavigate
                            if (nav) nav("/")
                            else window.location.href = "/"
                            return
                        }
                        setActiveTab(id)
                        /* v6.4 — Click en cabina principal trae el foco
                           del teclado a la columna izquierda. Si Zak
                           quiere navegar la sub-nav, picará el sub-item
                           o apretará → en el teclado. */
                        setKeyboardFocusCol("main")
                    }

                    const sectionLabelMap: Record<string, string> = {
                        codices: "Mis Códices",
                        sesiones: "Mis Sesiones",
                        trayectoria: "Trayectoria del Avatar",
                        firma: "Mi Firma de Luz",
                    }

                    /* ─── IdentityBlock (compact-aware) ─── */
                    /* v6.11 — Versión compact aplica solo en desktop con la
                       sidebar colapsada: foto reducida 36px, nombre oculto,
                       chip de tier reducido a un dot dorado/cyan con
                       tooltip. Click en la foto sigue navegando a
                       Identidad Visual; click en el dot sigue abriendo
                       Estado Orbital — gestos preservados. */
                    const renderIdentity = (compact: boolean) => {
                        const photoSize = compact
                            ? 36
                            : isMobile
                              ? 96
                              : 84
                        const dotSize = compact ? 10 : undefined
                        /* v6.12 — Fix: el dot del tier en compact se
                           pintaba gris para Inmersión porque comparaba
                           contra "is-inmersion" que no existe (la clase
                           real es "is-gold"). Ahora resuelve por las
                           variables booleanas isInmersion / isSintonia
                           que están en scope desde el cálculo del
                           tierLabel. Inmersión → dorado; Sintonía →
                           accent; sin membresía → gris suave. */
                        const tierDotColor = isInmersion
                            ? "#D4A843"
                            : isSintonia
                              ? accentColor
                              : "rgba(255,255,255,0.4)"
                        /* v6.14 — Anillo violeta para admins. Mismo
                           lenguaje visual que el avatar del Auth2Header
                           (color #C77DFF). El anillo violeta sustituye
                           al conic-gradient cyan/dorado y le agrega un
                           glow más saturado para que se note al lado
                           de cualquier paleta. Se aplica en mobile +
                           desktop, compact y full. */
                        const ADMIN_VIOLET = "#C77DFF"
                        const avatarRingBg = isAdmin
                            ? `conic-gradient(from 0deg, ${hexToRgba(ADMIN_VIOLET, 0.85)}, ${hexToRgba(ADMIN_VIOLET, 0.25)}, ${hexToRgba(ADMIN_VIOLET, 0.7)}, ${hexToRgba(ADMIN_VIOLET, 0.25)}, ${hexToRgba(ADMIN_VIOLET, 0.85)})`
                            : `conic-gradient(from 0deg, ${hexToRgba(accentColor, 0.55)}, ${hexToRgba(accentColor, 0.1)}, rgba(212,168,67,0.55), ${hexToRgba(accentColor, 0.1)}, ${hexToRgba(accentColor, 0.55)})`
                        const avatarRingShadow = isAdmin
                            ? compact
                                ? `0 0 16px ${hexToRgba(ADMIN_VIOLET, 0.45)}`
                                : `0 0 28px ${hexToRgba(ADMIN_VIOLET, 0.4)}`
                            : compact
                              ? `0 0 14px ${hexToRgba(accentColor, 0.22)}`
                              : `0 0 24px ${hexToRgba(accentColor, 0.18)}`
                        return (
                            <motion.div
                                variants={fU}
                                className="nuc-id-block"
                                style={{
                                    marginBottom: compact
                                        ? 8
                                        : isMobile
                                          ? 26
                                          : 4,
                                    /* v6.12 — gap más amplio en compact
                                       para que el dot del tier respire
                                       respecto a la foto del avatar
                                       (antes 6px se sentía pegado). */
                                    gap: compact ? 14 : undefined,
                                    /* v6.24 — Defensas anti-blur de iOS.
                                       Forzar layer GPU propia +
                                       antialiasing del texto + cancelar
                                       cualquier filter heredado. Cubre
                                       el caso reportado donde tras un
                                       refresh + back desde sub-pantalla
                                       el bloque queda renderizado en
                                       sub-pixel y el compositor lo
                                       pintaba con bilinear blur. */
                                    transform: "translateZ(0)",
                                    WebkitFontSmoothing: "antialiased",
                                    MozOsxFontSmoothing: "grayscale",
                                    filter: "blur(0px)",
                                }}
                            >
                                <button
                                    onClick={() => {
                                        setActiveTab("firma")
                                        setFirmaSub("identidad")
                                    }}
                                    aria-label="Ir a Identidad Visual"
                                    style={{
                                        width: photoSize,
                                        height: photoSize,
                                        borderRadius: "50%",
                                        padding: compact ? 1.5 : 2,
                                        background: avatarRingBg,
                                        border: "none",
                                        cursor: "pointer",
                                        outline: "none",
                                        WebkitTapHighlightColor: "transparent",
                                        boxShadow: avatarRingShadow,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: "50%",
                                            background: avatarUrl
                                                ? "#0B0C13"
                                                : "radial-gradient(circle at 30% 30%, rgba(0,194,255,0.12), rgba(0,30,60,0.85))",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                            color: accentColor,
                                            fontSize: compact
                                                ? 14
                                                : isMobile
                                                  ? 32
                                                  : 28,
                                            fontWeight: 600,
                                            fontFamily: "'Inter',sans-serif",
                                        }}
                                    >
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={displayName}
                                                referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                    /* v6.24 — image-rendering
                                                       auto + transform layer
                                                       propia para que iOS no
                                                       upscale la foto con
                                                       bilinear blur dentro
                                                       del compositor del
                                                       padre. */
                                                    imageRendering: "auto",
                                                    transform:
                                                        "translateZ(0)",
                                                }}
                                            />
                                        ) : (
                                            <span>{initial}</span>
                                        )}
                                    </div>
                                </button>
                                {!compact && (
                                    <h2 className="nuc-id-name">
                                        {displayName}
                                    </h2>
                                )}
                                {compact ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFirmaSub("orbital")
                                            setActiveTab("firma")
                                        }}
                                        title={tierLabel}
                                        aria-label={`Estado de ${tierLabel} — abrir Estado Orbital`}
                                        style={{
                                            width: dotSize,
                                            height: dotSize,
                                            borderRadius: "50%",
                                            background: tierDotColor,
                                            boxShadow: `0 0 10px ${tierDotColor}88`,
                                            border: "none",
                                            padding: 0,
                                            cursor: "pointer",
                                            outline: "none",
                                            appearance: "none",
                                            WebkitAppearance: "none",
                                            /* v6.13 — Hide hasta que el tier resuelva. */
                                            opacity: tierResolved ? 1 : 0,
                                            visibility: tierResolved
                                                ? "visible"
                                                : "hidden",
                                            transition:
                                                "opacity 0.3s ease",
                                        }}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className={`nuc-id-tag ${tierClass}`}
                                        onClick={() => {
                                            setFirmaSub("orbital")
                                            setActiveTab("firma")
                                        }}
                                        aria-label={`Estado de ${tierLabel} — abrir Estado Orbital`}
                                        style={{
                                            cursor: "pointer",
                                            fontFamily: "inherit",
                                            appearance: "none",
                                            WebkitAppearance: "none",
                                            /* v6.13 — Hide hasta que el
                                               tier resuelva (evita
                                               parpadeo "EXPLORADOR" al
                                               cargar). */
                                            opacity: tierResolved ? 1 : 0,
                                            visibility: tierResolved
                                                ? "visible"
                                                : "hidden",
                                            transition:
                                                "opacity 0.3s ease",
                                        }}
                                    >
                                        <span className="nuc-id-tag-dot" />
                                        {tierLabel}
                                    </button>
                                )}
                            </motion.div>
                        )
                    }
                    const IdentityBlock = renderIdentity(false)

                    /* ─── DashboardCardsMobile ─── */
                    const DashboardCardsMobile = (
                        <motion.div
                            variants={fU}
                            className="nuc-dashboard-stack"
                        >
                            {cardSpecs.map((c) => (
                                <button
                                    key={c.id}
                                    className="nuc-card-btn"
                                    onClick={() => goToCard(c.id)}
                                >
                                    <span className="nuc-card-icon">
                                        {c.icon}
                                    </span>
                                    <span className="nuc-card-text">
                                        <span className="nuc-card-title">
                                            {c.title}
                                        </span>
                                        <span className="nuc-card-sub">
                                            {c.sub}
                                        </span>
                                    </span>
                                    <span className="nuc-card-arrow">
                                        {IArrowRightGlyph}
                                    </span>
                                </button>
                            ))}
                        </motion.div>
                    )

                    /* ─── DesanclarBtn ─── */
                    /* v6.1 — Mobile dentro del shell del Escáner
                       (/escaner/nucleo): el botón necesita aire
                       extra para quedar SOBRE la BottomNav fija
                       del shell. Antes el marginTop:36 lo dejaba
                       justo donde empieza la barra → no era
                       pickeable.
                       v6.2 — paddingBottom 110 → 85 (-25). Antes
                       quedaba ~50px de aire entre el botón y la
                       BottomNav; ahora ~25px (medida pedida por
                       Zak). En /nucleo modo Madre la BottomNav
                       no existe, así que dejamos paddingBottom:0. */
                    const desanclarPaddingBottom =
                        isMobile && pathname.startsWith("/escaner/")
                            ? 85
                            : 0
                    const DesanclarBtn = (
                        <motion.div
                            variants={fU}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginTop: 36,
                                paddingBottom: desanclarPaddingBottom,
                            }}
                        >
                            <button
                                className="nuc-desanclar"
                                onClick={onSignout}
                            >
                                Desanclar
                            </button>
                        </motion.div>
                    )

                    /* ─── BackBtn (mobile sub-pantalla) ─── */
                    /* v6.13.1 — Portaleado fixed top:14 left:14 con el
                       MISMO estilo del back pill de Calibración
                       (EV_Modulos). Antes era pill inline texto+icono
                       en `.nuc-back-btn` (gris); ahora es pill
                       glass-blur azul-noche con flecha SVG, idéntico
                       al de los pilares — el ojo lo encuentra en el
                       mismo sitio en TODA navegación sub-pantalla. */
                    /* v6.23 — Doble handler (onPointerDown + onClick) +
                       zIndex max + pointerEvents: "auto" explícito.
                       Bug que reportó Zak: tras un reload estando en
                       una sub-pantalla (Mis Sesiones, Mis Códices, Mi
                       Firma), el BackBtn quedaba "muerto" — el click
                       no disparaba la navegación al dashboard. La
                       hipótesis es que algún wrapper transparente del
                       shell (oauthOverlay del Domo, o un ancestro con
                       pointer-events bloqueado) interceptaba el click
                       sin que el BackBtn pudiera recibir el gesto.
                       Las tres defensas: (1) zIndex 2147483647 lo
                       sube por encima de cualquier otro layer, (2)
                       pointerEvents:auto explícito anula cualquier
                       inheritance de "none" del padre, (3) el handler
                       en onPointerDown atrapa el gesto antes de que
                       cualquier listener delegado de la región pueda
                       cancelarlo. */
                    const goBackToDashboard = () => {
                        try {
                            setActiveTab("dashboard")
                        } catch {}
                        try {
                            window.dispatchEvent(
                                new CustomEvent("rsv-nucleo-reset")
                            )
                        } catch {}
                    }
                    const BackBtn =
                        typeof document !== "undefined"
                            ? createPortal(
                                  <motion.button
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      whileTap={{ scale: 0.92 }}
                                      onPointerDown={(e) => {
                                          e.stopPropagation()
                                          goBackToDashboard()
                                      }}
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          goBackToDashboard()
                                      }}
                                      style={{
                                          position: "fixed",
                                          top: 14,
                                          left: 14,
                                          zIndex: 2147483647,
                                          pointerEvents: "auto",
                                          width: 60,
                                          height: 30,
                                          borderRadius: 14,
                                          background: `linear-gradient(135deg, rgba(8,24,48,0.88), rgba(5,16,34,0.94), rgba(8,24,48,0.88)), ${hexToRgba(accentColor, 0.06)}`,
                                          border: `1px solid ${hexToRgba(accentColor, 0.38)}`,
                                          color: hexToRgba(
                                              accentColor,
                                              0.95
                                          ),
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          cursor: "pointer",
                                          outline: "none",
                                          padding: 0,
                                          backdropFilter:
                                              "blur(20px) saturate(160%) brightness(1.08)",
                                          WebkitBackdropFilter:
                                              "blur(20px) saturate(160%) brightness(1.08)",
                                          boxShadow: [
                                              `0 4px 14px ${hexToRgba(accentColor, 0.14)}`,
                                              `0 1px 4px rgba(0,0,0,0.3)`,
                                              `inset 0 0 14px ${hexToRgba(accentColor, 0.08)}`,
                                              `inset 0 1px 0 ${hexToRgba("#FFFFFF", 0.18)}`,
                                              `0 0 0 0.5px ${hexToRgba(accentColor, 0.12)}`,
                                          ].join(", "),
                                          WebkitTapHighlightColor:
                                              "transparent",
                                      }}
                                      aria-label="Volver"
                                      data-rsv-back-button="true"
                                  >
                                      <svg
                                          width={14}
                                          height={14}
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                      >
                                          <line
                                              x1="19"
                                              y1="12"
                                              x2="5"
                                              y2="12"
                                          />
                                          <polyline points="12 19 5 12 12 5" />
                                      </svg>
                                  </motion.button>,
                                  document.body
                              )
                            : null

                    /* ─── renderActiveSectionMobile (wrappers verticales) ─── */
                    const renderActiveSectionMobile = () => {
                        if (activeTab === "codices") {
                            return (
                                <motion.div key="codices" {...sR}>
                                    <CodicesSection
                                        books={books}
                                        accent={accentColor}
                                        loading={nucleoLoading}
                                        isAdmin={isAdmin}
                                        clerkUserId={user?.id || ""}
                                        supabaseUrl={supabaseUrl}
                                        supabaseAnonKey={supabaseAnonKey}
                                    />
                                </motion.div>
                            )
                        }
                        if (activeTab === "sesiones") {
                            return (
                                <motion.div key="sesiones" {...sR}>
                                    <SesionesTabPanel
                                        user={user}
                                        sessions={sessions}
                                        sub={sub}
                                        accent={accentColor}
                                        loading={nucleoLoading}
                                        stripePortalUrl={stripePortalUrl}
                                        supabaseUrl={supabaseUrl}
                                        supabaseAnonKey={supabaseAnonKey}
                                    />
                                </motion.div>
                            )
                        }
                        if (activeTab === "trayectoria") {
                            return (
                                <motion.div key="trayectoria" {...sR}>
                                    <TrayectoriaTabPanel
                                        clerkUserId={user?.id || ""}
                                        accent={accentColor}
                                        supabaseUrl={supabaseUrl}
                                        supabaseAnonKey={supabaseAnonKey}
                                    />
                                </motion.div>
                            )
                        }
                        if (activeTab === "firma") {
                            return (
                                <motion.div key="firma" {...sR}>
                                    <FirmaSection
                                        clerkUser={user}
                                        hookUser={hookUser}
                                        payments={payments}
                                        accent={accentColor}
                                        isAdmin={isAdmin}
                                        sub={sub}
                                        stripePortalUrl={stripePortalUrl}
                                        supabaseUrl={supabaseUrl}
                                        supabaseAnonKey={supabaseAnonKey}
                                        nucleoLoading={nucleoLoading}
                                    />
                                </motion.div>
                            )
                        }
                        return null
                    }

                    /* v6.19 — Helper para el título h1 de cada cabina
                       desktop. Mismo lenguaje del HeroTitleBlock (gradient
                       cyan→white por palabra, animation nuc-breath 7s)
                       pero compacto (fontSize 38) para no competir con
                       el contenido. Aplica a Trayectoria, Sesiones y
                       Mi Firma de Luz. Códices ya tiene su propio
                       header dentro de MN_Codices vía className
                       mn-codices-title-desktop. */
                    const renderDesktopTitle = (text: string) => (
                        <motion.h1
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 38,
                                fontWeight: 200,
                                letterSpacing: "0.24em",
                                marginRight: "-0.24em",
                                textTransform: "uppercase",
                                margin: "0 0 18px",
                                lineHeight: 1.05,
                                color: "transparent",
                                textAlign: "left",
                                filter: `drop-shadow(0 0 14px ${hexToRgba(accentColor, 0.28)})`,
                                animation:
                                    "nuc-breath 7s ease-in-out infinite",
                            }}
                        >
                            {text
                                .split(/\s+/)
                                .filter(Boolean)
                                .map((word, i, arr) => (
                                    <React.Fragment key={i}>
                                        <span
                                            style={{
                                                background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor:
                                                    "transparent",
                                                backgroundClip: "text",
                                            }}
                                        >
                                            {word}
                                        </span>
                                        {i < arr.length - 1 && " "}
                                    </React.Fragment>
                                ))}
                        </motion.h1>
                    )

                    /* ─── renderColumn3Desktop (sub-secciones individuales) ─── */
                    const renderColumn3Desktop = () => {
                        if (activeTab === "codices") {
                            /* v6.21 — height:100% para que el empty
                               state interno (con minHeight:100% +
                               flex-center) expanda al alto del visor
                               y centre el h1 a la misma altura visual
                               que el WelcomeViewerDesktop. */
                            return (
                                <motion.div
                                    key="codices"
                                    {...sR}
                                    style={{ height: "100%" }}
                                >
                                    <CodicesSection
                                        books={books}
                                        accent={accentColor}
                                        loading={nucleoLoading}
                                        isAdmin={isAdmin}
                                        clerkUserId={user?.id || ""}
                                        supabaseUrl={supabaseUrl}
                                        supabaseAnonKey={supabaseAnonKey}
                                    />
                                </motion.div>
                            )
                        }
                        if (activeTab === "trayectoria") {
                            return (
                                <motion.div key="trayectoria" {...sR}>
                                    {renderDesktopTitle(
                                        "Trayectoria del Avatar"
                                    )}
                                    <TrayectoriaTabPanel
                                        clerkUserId={user?.id || ""}
                                        accent={accentColor}
                                        supabaseUrl={supabaseUrl}
                                        supabaseAnonKey={supabaseAnonKey}
                                    />
                                </motion.div>
                            )
                        }
                        if (activeTab === "sesiones") {
                            if (sesionesSub === "camara-solar") {
                                return (
                                    <motion.div
                                        key="sesiones-solar"
                                        {...sR}
                                    >
                                        {renderDesktopTitle("Mis Sesiones")}
                                        <CamaraSection
                                            sessions={sessions}
                                            sub={sub}
                                            accent={accentColor}
                                            loading={nucleoLoading}
                                            stripePortalUrl={stripePortalUrl}
                                            supabaseUrl={supabaseUrl}
                                            supabaseAnonKey={supabaseAnonKey}
                                        />
                                    </motion.div>
                                )
                            }
                            if (sesionesSub === "camara-resonancia") {
                                return (
                                    <motion.div
                                        key="sesiones-resonancia"
                                        {...sR}
                                    >
                                        {renderDesktopTitle("Mis Sesiones")}
                                        <CamaraResonanciaSection
                                            user={user}
                                            supabaseUrl={supabaseUrl}
                                            supabaseAnonKey={supabaseAnonKey}
                                        />
                                    </motion.div>
                                )
                            }
                        }
                        if (activeTab === "firma") {
                            if (firmaSub === "identidad") {
                                return (
                                    <motion.div
                                        key="firma-identidad"
                                        {...sR}
                                    >
                                        {renderDesktopTitle(
                                            "Mi Firma de Luz"
                                        )}
                                        <IdentidadVisualSection
                                            clerkUser={user}
                                            hookUser={hookUser}
                                            accent={accentColor}
                                        />
                                    </motion.div>
                                )
                            }
                            if (firmaSub === "orbital") {
                                return (
                                    <motion.div key="firma-orbital" {...sR}>
                                        {renderDesktopTitle(
                                            "Mi Firma de Luz"
                                        )}
                                        <EstadoOrbitalSection
                                            sub={sub}
                                            accent={accentColor}
                                            loading={nucleoLoading}
                                            stripePortalUrl={stripePortalUrl}
                                            supabaseUrl={supabaseUrl}
                                            supabaseAnonKey={supabaseAnonKey}
                                        />
                                    </motion.div>
                                )
                            }
                            if (firmaSub === "intercambios") {
                                return (
                                    <motion.div
                                        key="firma-intercambios"
                                        {...sR}
                                    >
                                        {renderDesktopTitle(
                                            "Mi Firma de Luz"
                                        )}
                                        <RegistroIntercambiosSection
                                            payments={payments}
                                            accent={accentColor}
                                        />
                                    </motion.div>
                                )
                            }
                            if (firmaSub === "seguridad") {
                                return (
                                    <motion.div
                                        key="firma-seguridad"
                                        {...sR}
                                    >
                                        {renderDesktopTitle(
                                            "Mi Firma de Luz"
                                        )}
                                        <ClavesSeguridadSection
                                            hookUser={hookUser}
                                            accent={accentColor}
                                            isAdmin={isAdmin}
                                        />
                                    </motion.div>
                                )
                            }
                        }
                        return null
                    }

                    /* ─── HeroTitleBlock (mobile) ─── */
                    const HeroTitleBlock = (
                        <motion.div
                            variants={tV}
                            style={{
                                textAlign: "center",
                                marginTop: 4,
                                marginBottom: 26,
                            }}
                        >
                            <h1
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 28,
                                    fontWeight: 100,
                                    letterSpacing: "0.2em",
                                    marginRight: "-0.2em",
                                    textTransform: "uppercase",
                                    margin: 0,
                                    lineHeight: 1,
                                    userSelect: "none",
                                    color: "transparent",
                                    filter: `drop-shadow(0 0 12px ${hexToRgba(accentColor, 0.25)})`,
                                    WebkitFontSmoothing: "antialiased",
                                    animation:
                                        "nuc-breath 7s ease-in-out infinite",
                                }}
                            >
                                {pageTitleText
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .map((word, i, arr) => (
                                        <React.Fragment key={i}>
                                            <span
                                                style={{
                                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor:
                                                        "transparent",
                                                    backgroundClip: "text",
                                                }}
                                            >
                                                {word}
                                            </span>
                                            {i < arr.length - 1 && " "}
                                        </React.Fragment>
                                    ))}
                            </h1>
                            {subtitleText && (
                                <p
                                    style={{
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: 10.5,
                                        fontWeight: 300,
                                        letterSpacing: "0.14em",
                                        color: "rgba(255,255,255,0.3)",
                                        marginTop: 10,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {subtitleText}
                                </p>
                            )}
                        </motion.div>
                    )

                    /* ─── WelcomeViewerDesktop ─── */
                    /* v6.5 — Bloque agrandado y centrado verticalmente.
                       h1 "MI NÚCLEO" pasa de 28 → 56 (mismo tamaño que el
                       splash "ESCÁNER VIBRACIONAL" del shell + los hero
                       de Holoteca/Códices). Subtítulo y descripción
                       también suben de tamaño y dan más aire. El
                       container usa justify-content: center para que el
                       bloque flote en el medio del visor cuando no hay
                       sub-tab activo. */
                    const WelcomeViewerDesktop = (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 480,
                                height: "100%",
                                textAlign: "center",
                                padding: "40px 32px 60px",
                            }}
                        >
                            <h1
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 56,
                                    fontWeight: 200,
                                    letterSpacing: "0.28em",
                                    marginRight: "-0.28em",
                                    textTransform: "uppercase",
                                    margin: 0,
                                    lineHeight: 1.05,
                                    color: "transparent",
                                    whiteSpace: "nowrap",
                                    filter: `drop-shadow(0 0 18px ${hexToRgba(accentColor, 0.3)})`,
                                    animation:
                                        "nuc-breath 7s ease-in-out infinite",
                                }}
                            >
                                {pageTitleText
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .map((word, i, arr) => (
                                        <React.Fragment key={i}>
                                            <span
                                                style={{
                                                    background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                                    WebkitBackgroundClip:
                                                        "text",
                                                    WebkitTextFillColor:
                                                        "transparent",
                                                    backgroundClip: "text",
                                                }}
                                            >
                                                {word}
                                            </span>
                                            {i < arr.length - 1 && " "}
                                        </React.Fragment>
                                    ))}
                            </h1>
                            {subtitleText && (
                                <p
                                    style={{
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: 14,
                                        fontWeight: 300,
                                        letterSpacing: "0.22em",
                                        color: "rgba(255,255,255,0.45)",
                                        marginTop: 22,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {subtitleText}
                                </p>
                            )}
                            <p
                                style={{
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 16,
                                    fontWeight: 300,
                                    letterSpacing: "0.04em",
                                    color: "rgba(255,255,255,0.55)",
                                    marginTop: 80,
                                    maxWidth: 560,
                                    lineHeight: 1.6,
                                }}
                            >
                                Selecciona una sección en el menú izquierdo
                                para abrir tu Núcleo. Cada coordenada es una
                                cabina distinta de tu sistema solar interno.
                            </p>
                        </motion.div>
                    )

                    /* ─── SidebarDesktop (Columna 1) ─── */
                    /* v6.11 — Versión colapsable. Cuando sidebarCollapsed
                       es true: identidad reducida, items solo SVG centrados,
                       Desanclar reemplazado por logout-icon. El padding
                       horizontal de los items se reduce para que el
                       cuerpo encaje en el ancho de 64px del wrapper. */
                    const sidebarItemPadding = sidebarCollapsed
                        ? "12px 0"
                        : undefined
                    const sidebarItemJustify = sidebarCollapsed
                        ? "center"
                        : undefined
                    const SidebarDesktop = (
                        <aside
                            className="nuc-sidebar"
                            style={{
                                width: "100%",
                                borderRight: `1px solid ${hexToRgba(accentColor, 0.08)}`,
                                background:
                                    "linear-gradient(180deg, rgba(2,8,20,0.32) 0%, rgba(2,6,16,0.45) 100%)",
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                                paddingLeft: sidebarCollapsed ? 0 : undefined,
                                paddingRight: sidebarCollapsed ? 0 : undefined,
                                /* v6.12 — En colapsada el chevron vive
                                   centrado arriba; agregamos paddingTop
                                   para que la identidad no pise el
                                   botón. */
                                paddingTop: sidebarCollapsed ? 44 : undefined,
                            }}
                        >
                            {renderIdentity(sidebarCollapsed)}
                            <div className="nuc-sidebar-divider" />
                            <nav
                                className="nuc-sidebar-menu"
                                style={
                                    sidebarCollapsed
                                        ? { padding: 0 }
                                        : undefined
                                }
                            >
                                {cardSpecs.map((c) => (
                                    <button
                                        key={c.id}
                                        className={`nuc-sidebar-item ${activeTab === c.id ? "is-active" : ""}`}
                                        title={
                                            sidebarCollapsed
                                                ? c.id === "explorar"
                                                    ? "Red Solar Viva"
                                                    : c.title
                                                : undefined
                                        }
                                        style={{
                                            ...(c.id === "explorar" &&
                                            !sidebarCollapsed
                                                ? { gap: 6 }
                                                : undefined),
                                            ...(sidebarCollapsed
                                                ? {
                                                      padding:
                                                          sidebarItemPadding,
                                                      justifyContent:
                                                          sidebarItemJustify,
                                                      gap: 0,
                                                  }
                                                : undefined),
                                        }}
                                        onClick={() => goToCard(c.id)}
                                    >
                                        <span className="nuc-sidebar-item-icon">
                                            {c.icon}
                                        </span>
                                        {!sidebarCollapsed &&
                                            (c.id === "explorar" ? (
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        flexDirection:
                                                            "column",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: 2,
                                                        lineHeight: 1.05,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: 500,
                                                            letterSpacing:
                                                                "0.22em",
                                                            opacity: 0.62,
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        Explorar
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 12.5,
                                                            fontWeight: 600,
                                                            letterSpacing:
                                                                "0.16em",
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        Red Solar Viva
                                                    </span>
                                                </span>
                                            ) : (
                                                c.title
                                            ))}
                                    </button>
                                ))}
                            </nav>
                            <div style={{ flex: "1 1 auto" }} />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    paddingTop: 24,
                                }}
                            >
                                {sidebarCollapsed ? (
                                    <button
                                        type="button"
                                        onClick={onSignout}
                                        title="Desanclar"
                                        aria-label="Desanclar"
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            border: `1px solid ${hexToRgba(accentColor, 0.18)}`,
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            color: hexToRgba(accentColor, 0.7),
                                            cursor: "pointer",
                                            outline: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.18s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                                hexToRgba(accentColor, 0.4)
                                            e.currentTarget.style.color =
                                                accentColor
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                                hexToRgba(accentColor, 0.18)
                                            e.currentTarget.style.color =
                                                hexToRgba(accentColor, 0.7)
                                        }}
                                    >
                                        {ILogoutGlyph}
                                    </button>
                                ) : (
                                    <button
                                        className="nuc-desanclar"
                                        onClick={onSignout}
                                    >
                                        Desanclar
                                    </button>
                                )}
                            </div>
                        </aside>
                    )

                    /* ─── SubNavDesktop (Columna 2) ─── */
                    /* v6.4 — `isFocused` indica si el teclado está
                       apuntando a esta columna. Cuando active && NO
                       isFocused, atenuamos border + color + sacamos
                       glow → Zak ve cuál columna controla con flechas.
                       v6.11 — Cuando subNavCollapsed, los sub-items
                       muestran solo el SVG centrado, sin texto. */
                    const renderSubItem = (
                        spec: { id: string; title: string; sub: string; icon: React.ReactNode },
                        active: boolean,
                        onClick: () => void,
                        isFocused: boolean
                    ) => (
                        <button
                            key={spec.id}
                            onClick={onClick}
                            title={
                                subNavCollapsed
                                    ? `${spec.title} · ${spec.sub}`
                                    : undefined
                            }
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: subNavCollapsed ? 0 : 12,
                                justifyContent: subNavCollapsed
                                    ? "center"
                                    : undefined,
                                width: "100%",
                                padding: subNavCollapsed
                                    ? "14px 0"
                                    : "14px 14px",
                                borderRadius: 12,
                                /* v6.12 — Cuando colapsada, los items
                                   inactive pierden borde y background
                                   para verse igual que los SVGs del
                                   sidebar (sin el cuadrado visible).
                                   El active mantiene un sutil glow. */
                                border: subNavCollapsed
                                    ? active
                                        ? `1px solid ${hexToRgba(accentColor, isFocused ? 0.28 : 0.14)}`
                                        : "1px solid transparent"
                                    : active
                                      ? isFocused
                                          ? `1px solid ${hexToRgba(accentColor, 0.32)}`
                                          : `1px solid ${hexToRgba(accentColor, 0.14)}`
                                      : `1px solid rgba(255,255,255,0.04)`,
                                background: subNavCollapsed
                                    ? active
                                        ? `linear-gradient(165deg, ${hexToRgba(accentColor, isFocused ? 0.10 : 0.05)} 0%, rgba(0,100,180,0.06) 100%)`
                                        : "transparent"
                                    : active
                                      ? isFocused
                                          ? `linear-gradient(165deg, ${hexToRgba(accentColor, 0.10)} 0%, rgba(0,100,180,0.14) 100%)`
                                          : `linear-gradient(165deg, ${hexToRgba(accentColor, 0.04)} 0%, rgba(0,100,180,0.06) 100%)`
                                      : "rgba(255,255,255,0.02)",
                                color: active
                                    ? isFocused
                                        ? accentColor
                                        : "rgba(255,255,255,0.7)"
                                    : "rgba(255,255,255,0.65)",
                                fontFamily: "'Inter', sans-serif",
                                cursor: "pointer",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                textAlign: "left" as const,
                                boxShadow:
                                    active && isFocused && !subNavCollapsed
                                        ? `0 0 18px ${hexToRgba(accentColor, 0.10)}, inset 0 0 12px ${hexToRgba(accentColor, 0.06)}`
                                        : "none",
                                transition: "all 0.22s ease",
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background =
                                        subNavCollapsed
                                            ? "rgba(0,194,255,0.04)"
                                            : "rgba(0,194,255,0.04)"
                                    e.currentTarget.style.borderColor =
                                        subNavCollapsed
                                            ? "rgba(0,194,255,0.10)"
                                            : "rgba(0,194,255,0.10)"
                                    e.currentTarget.style.color =
                                        "rgba(255,255,255,0.85)"
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background =
                                        subNavCollapsed
                                            ? "transparent"
                                            : "rgba(255,255,255,0.02)"
                                    e.currentTarget.style.borderColor =
                                        subNavCollapsed
                                            ? "transparent"
                                            : "rgba(255,255,255,0.04)"
                                    e.currentTarget.style.color =
                                        "rgba(255,255,255,0.65)"
                                }
                            }}
                        >
                            <span
                                style={{
                                    flex: "0 0 auto",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 22,
                                    height: 22,
                                }}
                            >
                                {spec.icon}
                            </span>
                            {!subNavCollapsed && (
                                <span
                                    style={{
                                        flex: "1 1 auto",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        minWidth: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            letterSpacing: "0.10em",
                                            textTransform: "uppercase",
                                            color: "inherit",
                                        }}
                                    >
                                        {spec.title}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 300,
                                            letterSpacing: "0.02em",
                                            color: active
                                                ? hexToRgba(accentColor, 0.7)
                                                : "rgba(255,255,255,0.40)",
                                        }}
                                    >
                                        {spec.sub}
                                    </span>
                                </span>
                            )}
                        </button>
                    )

                    const SubNavDesktop = (() => {
                        let items: typeof sesionesSubItems | typeof firmaSubItems
                        let activeSub: string
                        let setSub: (id: any) => void
                        let title: string
                        if (activeTab === "sesiones") {
                            items = sesionesSubItems
                            activeSub = sesionesSub
                            setSub = setSesionesSub
                            title = "Mis Sesiones"
                        } else if (activeTab === "firma") {
                            items = firmaSubItems
                            activeSub = firmaSub
                            setSub = setFirmaSub
                            title = "Mi Firma"
                        } else {
                            return null
                        }
                        /* v6.4 — Calculamos el alto de la línea derecha
                           para que termine ~24px debajo del último
                           botón en vez de extenderse hasta el fondo.
                           padTop 20 + headerBox 36 + items*64 + gaps
                           entre items 10 + buffer 24. Con eso la "punta"
                           de la línea queda casi a la altura del último
                           botón, como pidió Zak. */
                        const SUB_ITEM_PX = 64
                        const SUB_HEADER_PX = 36
                        const SUB_GAP_PX = 10
                        const SUB_PAD_TOP = 20
                        const SUB_LINE_BUFFER = 24
                        const linePx =
                            SUB_PAD_TOP +
                            SUB_HEADER_PX +
                            items.length * SUB_ITEM_PX +
                            Math.max(0, items.length - 1) * SUB_GAP_PX +
                            SUB_LINE_BUFFER
                        return (
                            <aside
                                className="nuc-no-scrollbar"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: subNavCollapsed ? 6 : 10,
                                    /* v6.12 — En colapsada agregamos
                                       paddingTop extra para que el
                                       primer item no choque con el
                                       chevron centrado arriba. */
                                    padding: subNavCollapsed
                                        ? "44px 0 32px"
                                        : "20px 18px 32px",
                                    /* v6.4 — Reemplazamos borderRight
                                       por dos backgrounds capa: el
                                       gradient base del aside + una
                                       línea cyan de 1px de ancho que
                                       termina en `linePx` (el resto
                                       transparente). v6.11 — Cuando
                                       colapsada usamos linePx fijo más
                                       chico porque el header desaparece. */
                                    borderRight: "none",
                                    backgroundImage: `linear-gradient(180deg, rgba(2,6,16,0.45) 0%, rgba(2,8,20,0.55) 100%), linear-gradient(180deg, ${hexToRgba(accentColor, 0.10)} 0%, ${hexToRgba(accentColor, 0.10)} ${subNavCollapsed ? items.length * (SUB_ITEM_PX - 8) + 60 : linePx}px, transparent ${subNavCollapsed ? items.length * (SUB_ITEM_PX - 8) + 60 : linePx}px, transparent 100%)`,
                                    backgroundPosition:
                                        "0 0, right 0 top 0",
                                    backgroundRepeat:
                                        "no-repeat, no-repeat",
                                    backgroundSize:
                                        "100% 100%, 1px 100%",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    overflowY: "auto" as const,
                                    minWidth: 0,
                                }}
                            >
                                {!subNavCollapsed && (
                                    <div
                                        style={{
                                            padding: "8px 6px 4px",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                letterSpacing: "0.22em",
                                                textTransform: "uppercase",
                                                color: hexToRgba(
                                                    accentColor,
                                                    0.7
                                                ),
                                            }}
                                        >
                                            {title}
                                        </div>
                                    </div>
                                )}
                                {items.map((spec) =>
                                    renderSubItem(
                                        spec,
                                        activeSub === spec.id,
                                        () => {
                                            setSub(spec.id)
                                            /* v6.4 — Click en sub-item
                                               trae el foco del teclado
                                               a la columna derecha. */
                                            setKeyboardFocusCol("sub")
                                        },
                                        keyboardFocusCol === "sub"
                                    )
                                )}
                            </aside>
                        )
                    })()

                    /* ─── Render branching ─── */

                    /* v6.21 — Bandera "estoy en Mis Códices y vacío".
                       Cuando aplica + mobile, ocultamos el título de
                       sub-sección externo para que el h1 grande del
                       empty state interno (de MN_Codices) sea el
                       único título visible y se centre verticalmente
                       respecto a toda la pantalla. */
                    const isCodicesEmpty =
                        activeTab === "codices" &&
                        !nucleoLoading &&
                        Array.isArray(books) &&
                        books.length === 0

                    if (isMobile) {
                        if (activeTab === "dashboard") {
                            return (
                                <>
                                    {HeroTitleBlock}
                                    {IdentityBlock}
                                    {DashboardCardsMobile}
                                    {DesanclarBtn}
                                </>
                            )
                        }
                        return (
                            <>
                                {/* v6.13.1 — BackBtn vive ahora portaled
                                   fixed top:14 left:14 (no afecta el
                                   flow). El padding-top general del
                                   contenido del shell mobile basta
                                   para que el título "Mis Códices" /
                                   "Mi Firma" no se tape.
                                   v6.18 — Título de sub-sección con el
                                   mismo lenguaje del HeroTitleBlock de
                                   "MI NÚCLEO": h1 fontSize 28, fontWeight
                                   100, letterSpacing 0.2em, gradient
                                   cyan→white por palabra, animation
                                   nuc-breath 7s. Zak había logrado este
                                   estilo en una iteración anterior y
                                   se perdió en la refactor; lo
                                   recuperamos para que las cabinas se
                                   sientan parte de la misma capa
                                   tipográfica.
                                   v6.21 — Cuando isCodicesEmpty, NO
                                   renderizamos este título (lo asume
                                   el h1 grande del empty state interno
                                   de MN_Codices, centrado vertical). */}
                                {BackBtn}
                                {!isCodicesEmpty && (
                                <motion.div
                                    variants={tV}
                                    style={{
                                        textAlign: "center",
                                        /* v6.19 — marginTop subió de 4 a
                                           58: el BackBtn vive portaled
                                           fixed top:14, alto ~36px →
                                           bottom ~50. Con marginTop 4 el
                                           título quedaba pegado al borde
                                           superior y chocaba con el
                                           back. 58 da ~22px de aire
                                           bajo el botón antes de empezar
                                           el título. marginBottom de 26
                                           a 22 para compensar y mantener
                                           proporción con la lista. */
                                        marginTop: 58,
                                        marginBottom: 22,
                                    }}
                                >
                                    <h1
                                        style={{
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: 28,
                                            fontWeight: 100,
                                            letterSpacing: "0.2em",
                                            marginRight: "-0.2em",
                                            textTransform: "uppercase",
                                            margin: 0,
                                            lineHeight: 1,
                                            userSelect: "none",
                                            color: "transparent",
                                            filter: `drop-shadow(0 0 12px ${hexToRgba(accentColor, 0.25)})`,
                                            WebkitFontSmoothing:
                                                "antialiased",
                                            animation:
                                                "nuc-breath 7s ease-in-out infinite",
                                        }}
                                    >
                                        {(
                                            sectionLabelMap[
                                                activeTab as string
                                            ] || ""
                                        )
                                            .split(/\s+/)
                                            .filter(Boolean)
                                            .map((word, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <span
                                                        style={{
                                                            background: `linear-gradient(180deg, ${accentColor}, #fff)`,
                                                            WebkitBackgroundClip:
                                                                "text",
                                                            WebkitTextFillColor:
                                                                "transparent",
                                                            backgroundClip:
                                                                "text",
                                                        }}
                                                    >
                                                        {word}
                                                    </span>
                                                    {i < arr.length - 1 &&
                                                        " "}
                                                </React.Fragment>
                                            ))}
                                    </h1>
                                </motion.div>
                                )}
                                {renderActiveSectionMobile()}
                            </>
                        )
                    }

                    /* ─── Desktop: Layout 3 columnas cascada ─── */
                    /* v6.0 — La grid alterna entre 2 y 3 columnas según
                       hasSubNav. Sidebar 280px fijo + sub-nav 280px (si
                       aplica) + visor 1fr.
                       v6.11 — Cada columna del nav se contrae a 64px
                       independiente con su propio toggle. El botón de
                       toggle vive como sibling absolute del scrollable
                       wrapper para que no scrollee con el contenido. */
                    const hasSubNav =
                        activeTab === "sesiones" || activeTab === "firma"
                    const sidebarColPx = sidebarCollapsed ? 64 : 280
                    const subNavColPx = subNavCollapsed ? 64 : 280
                    const columnsTpl = hasSubNav
                        ? `${sidebarColPx}px ${subNavColPx}px 1fr`
                        : `${sidebarColPx}px 1fr`
                    const navbarBaseline = 60
                    const reservedTopPx = navbarBaseline + (topPaddingPx || 0)
                    /* v6.11 — Estilo del botón toggle: pill chiquita
                       arriba a la derecha del wrapper, fondo glass,
                       borde y color heredados del accent. Se queda fija
                       respecto al wrapper (no scrollea).
                       v6.12 — Cuando la columna está colapsada, el
                       botón se centra horizontalmente arriba para no
                       montarse sobre los SVGs de los items. Cuando está
                       expandida, sigue arriba a la derecha. */
                    const buildCollapseBtnStyle = (collapsed: boolean) => ({
                        position: "absolute" as const,
                        top: 10,
                        right: collapsed ? ("auto" as const) : 8,
                        left: collapsed ? "50%" : ("auto" as const),
                        transform: collapsed ? "translateX(-50%)" : "none",
                        zIndex: 5,
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        border: `1px solid ${hexToRgba(accentColor, 0.18)}`,
                        background: "rgba(2,8,20,0.7)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        color: hexToRgba(accentColor, 0.7),
                        cursor: "pointer",
                        outline: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.18s ease",
                    })
                    return (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: columnsTpl,
                                gridTemplateRows: "1fr",
                                height: `calc(100dvh - ${reservedTopPx}px)`,
                                alignItems: "stretch",
                                minHeight: 0,
                                transition:
                                    "grid-template-columns 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    minHeight: 0,
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSidebarCollapsed((c) => !c)
                                    }
                                    title={
                                        sidebarCollapsed
                                            ? "Expandir cabinas"
                                            : "Contraer cabinas"
                                    }
                                    aria-label={
                                        sidebarCollapsed
                                            ? "Expandir cabinas"
                                            : "Contraer cabinas"
                                    }
                                    style={buildCollapseBtnStyle(
                                        sidebarCollapsed
                                    )}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor =
                                            hexToRgba(accentColor, 0.4)
                                        e.currentTarget.style.color =
                                            accentColor
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor =
                                            hexToRgba(accentColor, 0.18)
                                        e.currentTarget.style.color =
                                            hexToRgba(accentColor, 0.7)
                                    }}
                                >
                                    {sidebarCollapsed
                                        ? IChevronRightGlyph
                                        : IChevronLeftGlyph}
                                </button>
                                <div
                                    className="nuc-col-wrap nuc-no-scrollbar"
                                    /* v6.4 — data-focused indica si las
                                       flechas del teclado están activas en
                                       esta columna. CSS atenúa el item
                                       active cuando el foco está en otra
                                       columna. */
                                    data-focused={
                                        keyboardFocusCol === "main"
                                            ? "true"
                                            : "false"
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        minHeight: 0,
                                        overflowY: "auto",
                                    }}
                                >
                                    {SidebarDesktop}
                                </div>
                            </div>
                            {hasSubNav && (
                                <div
                                    style={{
                                        position: "relative",
                                        minHeight: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSubNavCollapsed((c) => !c)
                                        }
                                        title={
                                            subNavCollapsed
                                                ? "Expandir sub-secciones"
                                                : "Contraer sub-secciones"
                                        }
                                        aria-label={
                                            subNavCollapsed
                                                ? "Expandir sub-secciones"
                                                : "Contraer sub-secciones"
                                        }
                                        style={buildCollapseBtnStyle(
                                            subNavCollapsed
                                        )}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                                hexToRgba(accentColor, 0.4)
                                            e.currentTarget.style.color =
                                                accentColor
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                                hexToRgba(accentColor, 0.18)
                                            e.currentTarget.style.color =
                                                hexToRgba(accentColor, 0.7)
                                        }}
                                    >
                                        {subNavCollapsed
                                            ? IChevronRightGlyph
                                            : IChevronLeftGlyph}
                                    </button>
                                    <div
                                        className="nuc-col-wrap nuc-no-scrollbar"
                                        data-focused={
                                            keyboardFocusCol === "sub"
                                                ? "true"
                                                : "false"
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            minHeight: 0,
                                            overflowY: "auto",
                                        }}
                                    >
                                        {SubNavDesktop}
                                    </div>
                                </div>
                            )}
                            <main
                                className="nuc-no-scrollbar"
                                style={{
                                    minWidth: 0,
                                    minHeight: 0,
                                    overflowY: "auto",
                                    paddingLeft: 32,
                                    paddingRight: 40,
                                    /* v6.22 — Reverted al paddingTop:24
                                       constante para ambos modos.
                                       /nucleo y /escaner/nucleo deben
                                       ser visualmente IDÉNTICOS. */
                                    paddingTop: 24,
                                    paddingBottom: 60,
                                }}
                            >
                                {activeTab === "dashboard"
                                    ? WelcomeViewerDesktop
                                    : renderColumn3Desktop()}
                            </main>
                        </div>
                    )
                })()}
            </motion.div>
        </motion.div>
    )
}

/*
   ══════════════════════════════════════════════════
   INNER COMPONENT — FIX PROFUNDO LOGOUT
   ══════════════════════════════════════════════════
*/
function MiNucleoInner(props: {
    domoMode?: boolean
    bgColor: string
    scannerAuthSlot?: React.ReactNode
    accentColor: string
    contentMaxWidthPx: number
    sidePaddingPx: number
    topPaddingPx: number
    pageTitleText: string
    pageTitleSize: number
    titleTopOffsetPx: number
    subtitleText: string
    numStars: number
    warpSpeed: number
    supabaseUrl: string
    supabaseAnonKey: string
    stripePortalUrl: string
}) {
    useInjectCss()
    const isMobile = useIsMobile()
    /* v6.1 — pathname listener para diferenciar mobile /nucleo (modo
       Madre standalone, SIN shell del Escáner — necesita su propio
       scroll) vs mobile /escaner/nucleo (DENTRO del shell del Escáner
       que ya maneja el scroll). Sin esta detección, el wrapper
       .nuc-root quedaba en overflowY:visible siempre que domoMode
       fuera true → /nucleo mobile congelado porque no había shell
       que delegara scroll. */
    const [pathname, setPathname] = useState(() =>
        typeof window === "undefined" ? "" : window.location.pathname
    )
    useEffect(() => {
        const sync = () => setPathname(window.location.pathname)
        const onNav = (e: any) => {
            const p = e?.detail?.path
            if (typeof p === "string") setPathname(p)
            else sync()
        }
        window.addEventListener("popstate", sync)
        window.addEventListener("rsv-navigate", onNav as EventListener)
        return () => {
            window.removeEventListener("popstate", sync)
            window.removeEventListener(
                "rsv-navigate",
                onNav as EventListener
            )
        }
    }, [])
    const inEscanerShell = pathname.startsWith("/escaner/")
    const {
        domoMode,
        scannerAuthSlot,
        bgColor,
        accentColor,
        contentMaxWidthPx,
        sidePaddingPx,
        topPaddingPx,
        pageTitleText,
        pageTitleSize,
        titleTopOffsetPx,
        subtitleText,
        numStars,
        warpSpeed,
        supabaseUrl,
        supabaseAnonKey,
        stripePortalUrl,
    } = props
    const { isSignedIn, isLoaded, user } = useUser()
    const { signOut } = useClerk()

    const [overrideUser, setOverrideUser] = useState<any>(() => {
        try {
            const g = (window as any).Clerk
            if (g?.user) return g.user
        } catch {}
        return getCachedUser()
    })
    const [clerkReady, setClerkReady] = useState(() => {
        try {
            const g = (window as any).Clerk
            return !!(g?.user || g?.client || g?.loaded)
        } catch {}
        return false
    })
    const [timedOut, setTimedOut] = useState(false)
    const [signingOut, setSigningOut] = useState(false)

    const mountTime = useRef(Date.now())
    const hadCacheOnMount = useRef(!!getCachedUser())

    useEffect(() => {
        const poll = setInterval(() => {
            try {
                const g = (window as any).Clerk
                if (!g) return

                if (g.user) {
                    if (overrideUser !== g.user) setOverrideUser(g.user)
                    if (!clerkReady) setClerkReady(true)
                } else if (g.client || g.loaded) {
                    const elapsed = Date.now() - mountTime.current
                    /* v6.17 — graceMs sin cache extendido a 5000ms.
                       v6.16 (2500ms) seguía cayendo en el flash en
                       reportes de Zak con cambio rápido de pestaña en
                       mobile. La sesión sí estaba viva, pero
                       Clerk.user tardaba 3-4s en hidratarse en algunos
                       devices. 5000ms es seguro: si tras 5s sigue
                       sin haber user, la sesión realmente no existe. */
                    const graceMs = hadCacheOnMount.current ? 6000 : 5000

                    if (elapsed > graceMs) {
                        if (overrideUser) setOverrideUser(null)
                        if (!clerkReady) setClerkReady(true)
                    }
                }
            } catch {}
        }, 300)

        return () => clearInterval(poll)
    }, [overrideUser, clerkReady])

    /* v6.16 — Red de seguridad adicional: useUser() de Clerk es la
       fuente más confiable cuando el provider está montado. Apenas
       isLoaded && isSignedIn && user, populamos overrideUser y
       marcamos clerkReady — sin esperar al polling de window.Clerk
       que puede tardar más en hidratar tras un cambio rápido de
       pestaña. Esto cierra el último gap donde el SignInContent se
       asomaba aunque la sesión estaba viva. */
    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            setOverrideUser((prev: any) => (prev === user ? prev : user))
            setClerkReady((prev) => (prev ? prev : true))
        }
    }, [isLoaded, isSignedIn, user])

    useEffect(() => {
        if (clerkReady) return
        /* v6.17 — Timeout sin cache extendido de 1500ms a 5500ms.
           El flash de SignInContent en mobile post-reload + cambio
           rápido de tab venía sobre todo de que timedOut=true antes
           de que Clerk pudiera hidratar al usuario. 5500ms da
           suficiente margen sin que el loader se sienta eterno
           cuando realmente NO hay sesión. */
        const hasCache = !!getCachedUser()
        const ms = hasCache ? 6000 : 5500
        const t = setTimeout(() => {
            if (!clerkReady) setTimedOut(true)
        }, ms)
        return () => clearTimeout(t)
    }, [clerkReady])

    useEffect(() => {
        if (overrideUser && typeof overrideUser.update === "function")
            cacheUser(overrideUser)
    }, [overrideUser])

    /* v6.20 — Cuando la pestaña vuelve a estar visible, si todavía no
       hay user hidratado, reseteamos mountTime y bajamos los flags
       clerkReady/timedOut para darle a Clerk una ventana fresca de
       hidratación. Sin esto: el browser pausa setTimeout/setInterval
       cuando la pestaña no es visible, y al volver el timeout de
       5500ms de "timedOut" dispara inmediatamente (aunque el wall
       clock no haya pasado realmente porque estaba en background) →
       el SignInContent aparece a pesar de que la sesión está viva.
       Caso reportado: recargar /escaner/nucleo en mobile + cambiar
       de pestaña en <8s + volver. */
    useEffect(() => {
        if (typeof document === "undefined") return
        const onVisChange = () => {
            if (document.visibilityState !== "visible") return
            try {
                const g = (window as any).Clerk
                /* Si Clerk ya hidrato user, no hace falta resetear. */
                if (g?.user) return
            } catch {}
            /* Reset SOLO si todavía estamos esperando hidratación.
               Si ya determinamos que NO hay sesión legítimamente, no
               regresamos a loading — eso sería molesto para el caso
               válido de logout vía otra pestaña. */
            mountTime.current = Date.now()
            setTimedOut(false)
            setClerkReady(false)
        }
        document.addEventListener("visibilitychange", onVisChange)
        return () =>
            document.removeEventListener("visibilitychange", onVisChange)
    }, [])

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === NUC_CACHE_KEY && !e.newValue) {
                /* Otra pestaña limpió el cache (probablemente signout) */
            }
        }
        const onAuthChanged = () => {
            try {
                const g = (window as any).Clerk
                if (g && !g.user) {
                    setOverrideUser(null)
                }
            } catch {}
        }
        window.addEventListener("storage", onStorage)
        window.addEventListener("rsv-auth-changed", onAuthChanged)
        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener("rsv-auth-changed", onAuthChanged)
        }
    }, [])

    const handleSignout = useCallback(async () => {
        setSigningOut(true)
        /* v6.20 — ORDEN CORRECTO:
           1. Terminar sesión en el SERVIDOR (clerk.session.end /
              clerk.signOut). Esto requiere que las cookies/localStorage
              de Clerk sigan intactas — el SDK las lee para mandar la
              petición autenticada al backend de Clerk.
           2. Limpiar storage local DESPUÉS (nukeClerkStorage +
              clearCachedUser).
           Antes hacíamos lo contrario: nukeClerkStorage() borraba las
           cookies y luego clerk.session.end() fallaba en silencio
           porque el SDK ya no tenía con qué autenticarse. La sesión
           seguía viva en el server → al refrescar, Clerk reconstruía
           todo desde el JWT del cookie residual. Resultado: 1er click
           "no pasaba nada", 3er click finalmente cerraba (porque a esa
           altura el cookie ya estaba vencido o el state interno de
           Clerk se había corrompido lo suficiente). */
        try {
            const clerk = (window as any).Clerk
            if (clerk?.session?.end) {
                await Promise.race([
                    clerk.session.end(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error("session.end timeout 1.2s")),
                            1200
                        )
                    ),
                ])
            } else if (clerk?.session?.remove) {
                await clerk.session.remove()
            } else if (clerk?.signOut) {
                await Promise.race([
                    clerk.signOut(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error("signOut timeout 1.2s")),
                            1200
                        )
                    ),
                ])
            }
        } catch (e) {
            console.warn("[RSV] session.end:", e)
        }
        /* v6.20 — Storage local DESPUÉS de cerrar la sesión. */
        clearCachedUser()
        nukeClerkStorage()
        try {
            const nav = (window as any).rsvNavigate
            if (nav) {
                nav("/escaner")
            }
        } catch {}
        try {
            window.dispatchEvent(new CustomEvent("rsv-auth-changed"))
            window.dispatchEvent(new CustomEvent("rsv-signout-complete"))
        } catch {}
        setSigningOut(false)
    }, [])

    const displayUser = overrideUser
    const noSession = clerkReady && !overrideUser

    const showDashboard = !!displayUser && !signingOut
    const showSignIn = !showDashboard && !signingOut && (noSession || timedOut)
    const showLoading = !showDashboard && !showSignIn

    const desktopDomoMode = domoMode && !isMobile
    /* v6.1 — Mobile Madre (/nucleo standalone, sin shell del Escáner)
       necesita su propio scroll: el contenedor padre no maneja
       overflow porque no hay shell. Mobile Escáner (/escaner/nucleo)
       sigue delegando scroll al shell. */
    const mobileMadreMode = domoMode && isMobile && !inEscanerShell
    const needsOwnScroll = desktopDomoMode || mobileMadreMode
    return (
        <div
            className="nuc-root"
            style={{
                position: "relative",
                width: "100%",
                height: needsOwnScroll ? "100dvh" : undefined,
                minHeight: domoMode ? undefined : "100dvh",
                background: domoMode ? "transparent" : bgColor,
                overflowX: "hidden",
                overflowY: needsOwnScroll
                    ? "auto"
                    : domoMode
                      ? "visible"
                      : "auto",
                fontFamily: "'Inter',sans-serif",
                color: "#fff",
            }}
        >
            {!domoMode && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                >
                    <Stars num={numStars} speed={warpSpeed} />
                </div>
            )}

            {showLoading && (
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100dvh",
                    }}
                >
                    {/* v6.17 — Loader minimal: solo texto pulsante, sin
                        spinner circular. El anillo rotante anterior se
                        confundía con la animación decorativa del SignIn
                        que removimos en este mismo commit. Mejor un
                        feedback tipográfico sutil. */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.25, 0.5, 0.25] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.28em",
                            color: "rgba(255,255,255,0.35)",
                            textTransform: "uppercase",
                            margin: 0,
                        }}
                    >
                        Sintonizando…
                    </motion.p>
                </div>
            )}

            {showSignIn && <SignInContent accent={accentColor} />}

            {showDashboard && (
                <DashboardContent
                    user={displayUser}
                    hookUser={user}
                    scannerAuthSlot={scannerAuthSlot}
                    accentColor={accentColor}
                    contentMaxWidthPx={contentMaxWidthPx}
                    sidePaddingPx={sidePaddingPx}
                    topPaddingPx={topPaddingPx}
                    pageTitleText={pageTitleText}
                    pageTitleSize={pageTitleSize}
                    titleTopOffsetPx={titleTopOffsetPx}
                    subtitleText={subtitleText}
                    supabaseUrl={supabaseUrl}
                    supabaseAnonKey={supabaseAnonKey}
                    stripePortalUrl={stripePortalUrl}
                    onSignout={handleSignout}
                />
            )}
        </div>
    )
}

export function MiNucleo(props: any) {
    const {
        domoMode,
        scannerAuthSlot,
        bgColor = "#060810",
        accentColor = "#00C2FF",
        contentMaxWidthPx = 1080,
        sidePaddingPx = 40,
        topPaddingPx = 0,
        pageTitleText = "MI NÚCLEO",
        pageTitleSize = 56,
        titleTopOffsetPx = 80,
        subtitleText = "Tu centro de gravedad en la Red",
        numStars = 60,
        warpSpeed = 0.6,
        supabaseUrl = "",
        supabaseAnonKey = "",
        stripePortalUrl = "",
    } = props
    return (
        <ClerkProvider
            publishableKey={CLERK_KEY}
            afterSignInUrl="/escaner/nucleo"
            afterSignUpUrl="/escaner/nucleo"
            afterSignOutUrl="/escaner"
        >
            <MiNucleoInner
                domoMode={domoMode}
                bgColor={bgColor}
                scannerAuthSlot={scannerAuthSlot}
                accentColor={accentColor}
                contentMaxWidthPx={contentMaxWidthPx}
                sidePaddingPx={sidePaddingPx}
                topPaddingPx={topPaddingPx}
                pageTitleText={pageTitleText}
                pageTitleSize={pageTitleSize}
                titleTopOffsetPx={titleTopOffsetPx}
                subtitleText={subtitleText}
                numStars={numStars}
                warpSpeed={warpSpeed}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                stripePortalUrl={stripePortalUrl}
            />
        </ClerkProvider>
    )
}

export default MiNucleo

addPropertyControls(MiNucleo, {
    supabaseUrl: {
        type: ControlType.String,
        title: "🔗 Supabase URL",
        defaultValue: "",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "🔑 Supabase Key",
        defaultValue: "",
    },
    stripePortalUrl: {
        type: ControlType.String,
        title: "💳 Stripe Portal URL",
        defaultValue: "",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#060810",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Color Acento",
        defaultValue: "#00C2FF",
    },
    contentMaxWidthPx: {
        type: ControlType.Number,
        title: "Ancho máx.",
        defaultValue: 1080,
        min: 720,
        max: 1600,
        step: 10,
    },
    sidePaddingPx: {
        type: ControlType.Number,
        title: "Padding lateral",
        defaultValue: 40,
        min: 0,
        max: 80,
        step: 2,
    },
    topPaddingPx: {
        type: ControlType.Number,
        title: "Padding superior",
        defaultValue: 0,
        min: 0,
        max: 160,
        step: 2,
    },
    pageTitleText: {
        type: ControlType.String,
        title: "Título",
        defaultValue: "MI NÚCLEO",
    },
    pageTitleSize: {
        type: ControlType.Number,
        title: "Tamaño título",
        defaultValue: 56,
        min: 28,
        max: 96,
        step: 1,
    },
    titleTopOffsetPx: {
        type: ControlType.Number,
        title: "Offset título",
        defaultValue: 80,
        min: 0,
        max: 240,
        step: 2,
    },
    subtitleText: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "Tu centro de gravedad en la Red",
    },
    numStars: {
        type: ControlType.Number,
        title: "Nº Estrellas",
        defaultValue: 60,
        min: 0,
        max: 200,
        step: 5,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 0.6,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        displayStepper: true,
    },
})
