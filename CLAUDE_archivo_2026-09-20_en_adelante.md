# Archivo del Historial de sesiones · desde el 2026-09-20

Entradas completas que salieron del maestro al comprimirse (Paso 3). No se carga por sesión.

---

#### 2026-10-07 · FOTÓN CERO: SU SALA PROPIA, EL INSTRUMENTO QUE SUENA Y EL AUDIO QUE VOLVIÓ AL ESTÉREO

- ✅ **Resuelto:** **fotoncero.com proyecta sus cinco obras en su sala propia**, desde R2 y sin YouTube (ignición con el
  sello, la pantalla se abre desde una línea de luz, luz ambiente, miniaturas en la línea del tiempo, calidad que baja
  sola, retomar y la siguiente con cuenta regresiva): **Everything You Dream** y **Harmonía · Códigos Aurora** en videos
  musicales; **No vine aquí**, **Diálogo con el Reflejo Estelar** y **Sol que Respira** en Fragmentos del Sol; «El Eco
  del Vacío» salió y la tercera luna queda oscura (PRÓXIMAMENTE) · cada obra y cada serie con su dirección, su tarjeta
  para redes y sus datos de video para buscadores · **la portada es el astrolabio grande con «Desciende»** (sin placas)
  y abajo esperan el estreno en visor de cámara, el índice, el motor de universos con una nota por anillo, la casa y las
  dos puertas del taller (alianza y padrino, que escriben a Motor → Aliados) · **todo respira**: las lunas son bucles de
  video (el sol de ida y vuelta, sin temblor), cada serie tiene su cielo y las ondas de Zak'Haar bailan con el espectro
  real de la canción · **sonidos de ElevenLabs afinados en La 432** (engranes en las lunas, cristal al pasar, campana al
  abrir una serie, soplo al cerrar, chispas al descender) con un solo interruptor que nace encendido · sin barra de
  desplazamiento · **la página de videos musicales ya no parpadea en negro** · **Everything You Dream suena en estéreo**
  en la web (versión 2) · Red Solar Viva: sin pestaña Fotón Cero, el planeta abre fotoncero.com, `/fotoncero`,
  `/fragmentos` y `/fragmentosdelsol` redirigen, y **los planetas de Origen solo abren su tarjeta cuando la mano frena**.
- 📁 **Archivos:** fotoncero (f45cedb a 572b9b4 y el del cierre): `index.html` v5.2, `main.ts` v5.2, `estilos.css` v5.2,
  `sala.ts` v1.0, `sala.css` v1.1, `series.ts` v2.1, `descenso.ts` v1.1, `ondas.ts` v1.0, `sfx.ts` v1.0,
  `vite.config.ts` v2.2, `herramientas/nueva-transmision.sh` v1.1, y `CLAUDE.md`, `.claude/settings.json` y
  `Docs/BITACORA.md` (nuevos) · Code (9b24e05): `Origen.tsx` v5.31, `Domo.tsx` v5.12, `NavegadorEstacion.tsx` v4.26 ·
  rsv-web (92ba610): `vercel.json` · admin: `CLAUDE_lecciones.md` (tres lecciones y protocolo v64).
- 🔌 **Edge functions deployed:** `fotoncero-subida`, puente TEMPORAL que solo firmaba subidas a `FotonCero/` en R2;
  desplegado y borrado dos veces (404 verificado). En R2 quedó `FotonCero/prueba/portada.jpg`, inofensivo.
- ⏳ **Pendiente:** el re-export en estéreo de Everything You Dream (Pendientes vivos · Fotón Cero).
- 💡 **Decisiones:** Fotón Cero vive en su propia casa y Red Solar Viva solo la señala · los videos van desde R2 en tres
  calidades y una obra que cambia sube con nombre nuevo (`-vN`), para que la caché nunca sirva la vieja · sin
  descripciones de episodio · la portada sin placas: manda el astrolabio · el sonido nace encendido y la sala de
  proyección calla por dentro · las salas de Fotón Cero se abren en la carpeta `fotoncero`.
- 🔧 **Patrones nuevos:** nunca máscara ni filtro CSS sobre un `<video>` (Chrome con tarjeta gráfica lo pinta por bloques
  y parpadea en negro; el Chrome sin ventana no lo ve): penumbras como capa encima y el video aparece hasta pintar su
  primer cuadro · bucles de ida y vuelta y más lentos cuando la toma se desplaza, arrancando después de la transición
  anterior · la matriz de canales de un audio se mide por mínimos cuadrados contra el master alineado · efectos
  decodificados fuera de línea (sin avisos) que despiertan con el primer gesto, afinados con análisis de frecuencias ·
  intención antes de abrir una tarjeta (el cursor frena: 12 px por 100 ms o 420 ms quieto) · puente temporal de subida
  a R2 que solo firma un prefijo y se borra al terminar · con `cleanUrls` el respaldo de la SPA va a `/index`. Lecciones
  0-tersexagies, 0-quatersexagies y 0-quinsexagies; detalle en [[proyecto_foton_cero_sala]] y [[feedback_todo_vivo]].
- 🧬 **Versión del sistema:** fotoncero.com con su sala propia, cinco obras y su sonido · protocolo v64.
- 🧭 **Su arranque** (salió de aquí al cerrar la sala de Claude for Startups, porque solo la sala más reciente lleva 🔮):
  abrir la carpeta `fotoncero` (su `CLAUDE.md` se carga solo) y leer `Docs/BITACORA.md`. Cuando Zak traiga el re-export de Everything You Dream: medir que el canal izquierdo
  y el derecho sean distintos (correlación menor a 0.99), pasarlo por `herramientas/nueva-transmision.sh`, subir las
  tres calidades a R2 con el sufijo `-v3` y poner `version: 3` en `src/series.ts`.

#### 2026-10-04 · III · ESCRITORIO PASO A PASO: LA COMUNIDAD COMO HERRAMIENTA, ESCAPE QUE CIERRA Y EL LOGO QUE SUENA

- ✅ **Resuelto:** **el logo de apertura suena en la app de la Mac** (al abrir en pantalla completa la ventana nace
  oculta un instante; el sello espera a verse para sonar y contar su reloj) · **la Comunidad de la computadora es un
  panel de trabajo**: cabecera con regreso, título y pestañas con contador; bandeja lateral con buscador e invitaciones;
  chat a todo lo ancho en una columna de 820 px con separadores de día, burbujas planas y la caja como un solo campo;
  Explorar con filtros en columna y tarjetas sobrias · **clic derecho** en un mensaje: Responder, Copiar y Eliminar
  para mí (guardado en la base, en todos sus aparatos) · **responder deslizando con dos dedos** en el trackpad ·
  **sonido al enviar** (texto, sticker, foto y nota de voz; también en el teléfono) · **sin autocorrección** en la app
  de la Mac · **Escape** cierra lo de más arriba (menú, ficha, hojas, visor, stickers, respuesta) y al final la
  Comunidad, y en la app de la Mac nunca la saca de pantalla completa. El celular conserva su forma.
- 📁 **Archivos:** escaner-app (14375f5, 28291a7): `ComunidadEscritorio.tsx` v1.1 (nuevo), `Comunidad.tsx` v1.24,
  `Mensajes.tsx` v1.44, `MiNucleo.tsx` v6.88, `RitualDeLlegada.tsx` v3.4, `EscanerVibracional.tsx` v13.137,
  `sensory.ts` v2.20, `desktopTauri.ts` v1.6, `main.tsx` v1.3, `lib/pilaEscape.ts` v1.0 (nuevo), `comu.es/en.ts` v1.7 y
  el banco de pruebas `banco/` (nuevo) · admin 02ff22b.
- 🗄️ **Migraciones SQL aplicadas:** `20261004_chat_ocultar_para_mi.sql` (tabla `chat_mensajes_ocultos`,
  `chat_ocultar_mensaje`, `chat_get_ocultos`); Zak la pegó y se verificó que existen y que solo el portón las usa.
- 🔌 **Edge functions deployed:** `user-action` v1.50 (rutea las dos de arriba).
- ⏳ **Pendiente:** si el sonido al enviar se queda también en el teléfono (en Pendientes vivos).
- 💡 **Decisiones:** la experiencia de escritorio se transforma pantalla por pantalla con la gramática de
  `ComunidadEscritorio.tsx` (hairlines, un solo acento para estado, sin degradados animados ni brackets, monogramas con
  iniciales) y el celular conserva su forma · Eliminar es «para mí», como WhatsApp, y vive en la base · Escape nunca
  saca la app de la Mac de pantalla completa (para salir quedan el botón verde y Control+Cmd+F) · mi burbuja en
  escritorio: cian claro plano con tinta oscura.
- 🔧 **Patrones nuevos:** banco de pruebas de escritorio con sesión y servidor falsos (`escaner-app/banco/`, servidor
  `banco-escritorio`, `?capa=comunidad&rapido&claro&sinOcultar`) y `banco/captura.mjs` (fotos nítidas con Chrome sin
  ventana, mudo) · pila de Escape (`lib/pilaEscape`): lo que se abre apila su cierre · en el motor de la Mac un Escape
  que la página no atiende llega a la ventana nativa y la saca de pantalla completa (se marca atendido en captura) · la
  ventana de la Mac nace oculta un instante: lo que se dispara al arrancar espera a verse · un gesto del trackpad (rueda
  horizontal) mueve la burbuja directo en la página, sin renders. Detalle en [[proyecto_escritorio_paso_a_paso]] y
  [[feedback_ventanas_de_prueba_mac]].
- 🧬 **Versión del sistema:** app de la Mac 1.1.49 · iPhone con el código del día (instalado) · protocolo v62.
- 🧭 **Su arranque** (la siguiente pantalla de escritorio, el banco y los anchos a revisar) vive en
  [[proyecto_escritorio_paso_a_paso]]: se movió ahí al cerrar la sala de Lúcido, porque solo la sala más reciente lleva 🔮.

#### 2026-10-04 · II · NAVEGANTE: SINFONÍA, ODISEA, LA CONSTELACIÓN Y LUDUS CERO PREMIUM CON EL TRÁILER

- ✅ **Resuelto:** **Sinfonía** (cada membrana es una canción: se dispara en el pulso, PERFECTO o BIEN, combo, capas que
  entran, rango y mejor rango en la nube) y **Odisea** (el Mapa de la Red, cuatro regiones con su regla y su voz,
  guardianes con barra de vida, una medusa que evoluciona) vivos en play.redsolarviva.com/simuladores · **la Red que se
  deshace**: lo absorbido se suelta en hebras, los hilos van de borde a borde (el error que vio la sala del tráiler) y
  la Red ya no late en cada pulso (por quien es sensible a los destellos) · **la constelación**: sin marco, se aleja
  desde la membrana al volver y se acerca al entrar, controles que se apagan con el mouse quieto, bri-pip y rojo en lo
  cerrado, una secuencia al elegir · **la casa LUDUS CERO** solo en la constelación, con su ventana nueva · **ganar
  suena a «la Red integrada»** (síntesis propia, sin créditos) · **guardianes por pasos** · el Bosque de Corrientes
  orgánico · sin tonalidad ni tempo en pantalla · **Ludus Cero premium**: el banner abre el juego, JUGAR de vidrio con
  su orbe, filos finos, menos espacio arriba del título y la estación de Navegante con el tráiler (modo cine) y seis
  tomas nuevas · **(la sala siguió tras el cierre)** la **tarjeta de victoria premium** · **cinco propuestas para el
  siguiente nivel**, jugables con el motor y la música del juego y con sus probabilidades en Steam
  (https://claude.ai/artifact/34QN9ReoibLFmLwNWyDcnm) · **el storyboard del universo** tipo Spore, con Navegante como
  primera de cinco etapas (https://claude.ai/artifact/Ws1SjUdADGemPZrUVYsmH8).
- 📁 **Archivos:** Code (aa1337f, af3d758, 9b0c264, 8dca19c, 55de5b5): `NaveganteDeLaRed.tsx` v3.8, `NaveganteRedViva.ts` v1.7,
  `NaveganteMusica.ts` v1.2, `NaveganteOdisea.ts` v1.2, `NaveganteMapa.tsx` v1.2, `SimuladoresHub.tsx` v3.2,
  `RSV_SolarSimuladoresShell.tsx` v4.3 · rsv-web 038c7a7 (el tráiler en 1080p y 720p, seis tomas) · `Ludus
  Cero/Navegante/` (CLAUDE.md, bitácora, próxima sala; herramientas nuevas `hub-ludus.mjs`, `estudio-red-viva.mjs` y
  `lote-produccion.sh`; las páginas `siguiente-nivel/` y `storyboard/`).
- 🗄️ **Migraciones SQL aplicadas:** `20261003_navegante_sinfonia.sql` (el mejor rango, precisión y puntos en
  `navegante_progress`); Zak la pegó y quedó marcada con ✅ (admin ae24d39).
- ⏳ **Pendiente:** que Zak elija qué propuestas construir y si el storyboard es el rumbo (está en Pendientes vivos).
  Su próxima sala se abre en `Ludus Cero/Navegante` con el encargo de `Docs/PROXIMA_SALA.md`.
  Ludus Cero en celular y el aviso de 599 siguen en Pendientes vivos.
- 💡 **Decisiones:** Resonancia descartada por ahora · la Red no late en cada pulso · del tema en pantalla solo el
  nombre (a nadie le interesa si está en Do o en Re) · VOLVER no vive dentro de las membranas: la casa LUDUS CERO solo
  en la constelación · los guardianes no se regalan abiertos · el banner abre el juego y solo CONOCER baja · los
  sonidos del juego salen de su propia síntesis, en la tonalidad de cada canción.
- 🔧 **Patrones nuevos:** controles que se apagan con el mouse quieto, nunca bajo el cursor ni en pantallas táctiles ·
  modo cine en un portal a `document.body` moviendo el mismo `<video>` (Domo crea su propio contexto de apilamiento) ·
  un `scrollIntoView` suave que se corrige al detenerse (las fotos lazy de arriba lo empujan) · tomas para una página
  pintadas con el motor real (`estudio-red-viva.mjs`, 3840 como máximo) · un lote de bots contra producción en dos
  carriles · todo bot con `--mute-audio` y `process.on("exit")`. Detalle en [[proyecto_navegante_arte]] y
  [[proyecto_ludus_hub]].
- 🧬 **Versión del sistema:** Navegante v3.8 (motor v1.7, música v1.2, Odisea v1.2, mapa v1.2) · hub v3.2 · shell v4.3
  · protocolo v61.

#### 2026-10-04 · TRÁILER DE NAVEGANTE PARA STEAM: 94 SEGUNDOS CON EL MOTOR REAL Y SU SEGUNDA PASADA

- ✅ **Resuelto:** **tráiler horizontal de Navegante de la Red** (16:9, 94 s a 60 cuadros, estilo Steam) en
  `Ludus Cero/Navegante/Trailer/`, pintado cuadro a cuadro con el motor real y la interfaz del juego: el abismo y la voz
  de la Red, el latido que despierta la Red, SINTONIZA · INTEGRA · VIAJA, Sinfonía con PERFECTO y combo, el Código y sus
  portales, el Super Jump en cámara lenta sobre la caída de la música, el Mapa, las cuatro regiones, los cuatro
  guardianes, la evolución, la Red que despierta, el título y «Empieza gratis» · **segunda pasada con lo que pidió
  Zak**: narrador más grave (Miguel), el Nodo Madre con otra voz (Regina), las 13 líneas al mismo volumen medido en su
  lugar, la música que ya no se corta bajo la voz, letreros con la tipografía del logo y un sonido por letrero, la
  canción REAL de la Membrana 2 en «Cada membrana es una canción», un cierre con broche de oro, y los hilos de la Red que
  ya no se salen de los nodos.
- 📁 **Archivos:** `Ludus Cero/Navegante/Trailer/` (maestro para Steam, ligero 720p de 34 MB, portada) y su estudio
  `estudio/` (`CONTRATO.md`, `motor/parchar.mjs` v1.1, `comun.js` v1.2, `hud.js` v2.0, `tipo.js` v2.0, `letrero.js` v1.0,
  `cuadro.js` v1.3, `render.mjs` v1.2, `mezclar.py` v1.9 (la tercera de cada nota sigue la armonía de su compás), `armar.sh` v1.1, 23 tomas en `tomas/`, la canción del juego en
  `sinfonia/`) · Navegante: `Docs/BITACORA.md` y `Docs/PROXIMA_SALA.md`.
- ⏳ **Pendiente:** ~~el MISMO error de los hilos vive en el juego (`FS_HILO` de `Code/NaveganteRedViva.ts`)~~
  CERRADO en la · II (motor v1.6, `FS_ARISTA`: cada hilo nace y muere en el borde de sus células).
- 💡 **Decisiones:** 16:9 1920×1080 a 60 (el formato de Steam) · la tarjeta final dice «Empieza gratis ·
  play.redsolarviva.com» (tutorial y Membrana 1 libres; si llega a Steam solo cambia `tomas/s23_final.js`) · narrador
  grave de tráiler y una voz distinta por personaje · los letreros llevan la tipografía del logo (Orbitron) y el
  filamento de la Red · donde la voz habla de la música del juego, suena la del juego.
- 🔧 **Patrones nuevos:** tráiler pintado con el motor del juego (copia parchada con cámara, render por CDP en paralelo
  y una bitácora de eventos que pone cada sonido en su cuadro) · ayudantes por grupo de tomas con contrato y una toma de
  ejemplo · música de ElevenLabs con un trozo por acto y su compás medido · la música se aparta solo en la banda de la
  voz (+6 dB) y las voces se igualan en su lugar · en ffmpeg 8 cada etapa va a su archivo. Detalle en
  [[proyecto_trailer_navegante]] y [[feedback_trailers_juego]].
- 🧬 **Versión del sistema:** estudio del tráiler (arriba) · protocolo v60.

#### 2026-10-03 · III · TERRA CRISTAL PIXEL CON SU ARTE SELLADO Y LUDUS CERO EN LA RED QUE DESCIENDE

- ✅ **Resuelto:** **Terra Cristal Pixel rehecho entero con el arte sellado** (ambiente pintado con luz de cine, la
  tripulación y el Soldado en Ícono mínimo, el pelo de Elara como su Plasma) y con la pantalla que llena la ventana sin
  marco (cada lugar con su orilla; el área de movimiento ya no se corta en los aliados); vivo en
  play.redsolarviva.com/terra-cristal-pixel/ · **Ludus Cero estrena la Red que desciende** en
  play.redsolarviva.com/simuladores: Zak eligió la propuesta 1 de una segunda ronda (lienzo con las dos rondas:
  https://claude.ai/artifact/B7PRKfoMAPxCYU8FD6mW9F); los juegos cuelgan del sol con su portada entera y cada uno tiene
  su estación (historia, Así se juega, JUGAR y un mosaico con su avance y sus mundos); la página baja con su propio
  scroll. En redsolarviva.com/simuladores sale igual con Navegante solo.
- 📁 **Archivos:** Code: `SimuladoresHub.tsx` v3.0 (1340009) · rsv-web: 15 visuales nuevos en `public/ludus/` (6f46c7b)
  · terra-cristal-pixel: 8125111, c112acd y el cierre d8633cd (bitácora y PROXIMA_SALA).
- ⏳ **Pendiente:** lo de Terra Cristal Pixel vive en `terra-cristal-pixel/Docs/PROXIMA_SALA.md` (siguiente: Arena 02 ·
  Ruinas) · Ludus Cero en celular sigue en Pendientes vivos.
- 💡 **Decisiones:** en las páginas de juegos el arte va ENTERO, nunca recortado (los círculos de la primera ronda «no
  dejan apreciar la magnificencia») y la página puede bajar para mostrar visuales y sinopsis (scroll vertical) · Terra
  Cristal al centro de la constelación · Navegante va en violeta en el hub.
- 🔧 **Patrones nuevos:** una página larga dentro de una ruta de pantalla completa de Domo scrollea por dentro (100dvh,
  como `/privacy`) · propuestas de diseño en un lienzo con una página por ronda, probadas con el motor del lienzo en
  Chrome sin ventana · el hub con el host de Ludus en local: build en carpeta aparte, servidor propio y
  `--host-resolver-rules` · antes de publicar rsv-web se busca el texto del Consejo sin commit en el `CouncilApp-*.js`
  vivo. Detalle en [[proyecto_ludus_hub]] y [[proyecto_juego_pixel]].
- 🧬 **Versión del sistema:** hub v3.0 · shell v4.0 · Terra Cristal Pixel (main v2.1, cine v1.1, mundo v1.1, cuerpo v3)
  · protocolo v59.

#### 2026-10-03 · II · LUDUS CERO: LÚCIDO NACE, NAVEGANTE EN RED VIVA, EL HUB DE CASA DE JUEGOS Y LOS RUMBOS

- ✅ **Resuelto:** **juego pixel** (cinco propuestas vivas en https://claude.ai/artifact/UmATZhiD9nigZhy3LeUiiL): Zak
  eligió **Lúcido**, que nació y quedó vivo en play.redsolarviva.com/lucido/ (v0.2) con dos pantallas (ancha para
  computadora y Steam Deck, vertical para el celular) y app de iPhone · **Navegante de la Red con arte nuevo**: de tres
  propuestas vivas Zak eligió **Red Viva** (motor WebGL2 propio, con sonido a tiempo); consola en vidrio de agua, el
  avance del orden viejo de membranas acomodado al de hoy (el error de niveles salteados), el aura dorada de la medusa
  que se dibujaba como cuadro, y una puntería que dice la verdad (la integrada es un nudo claro, el abanico mide el
  alcance real y una mira marca lo que el pulso absorbe; Zak creía que no lo dejaba absorber) · **Ludus Cero** en
  play.redsolarviva.com/simuladores con displays de casa de juegos (portada que respira, sello, avance en video al
  pasar el cursor, JUGAR), portada nueva de Navegante pintada con su motor y avances de los tres juegos · botones del
  juego y ventana de salir en Red Viva · **tres rumbos** para el siguiente nivel, en vivo
  (https://claude.ai/artifact/QYiSUcTavJbMEqW16mwaam): Zak eligió **Sinfonía y Odisea**; Resonancia, descartada por
  ahora · Navegante tiene casa propia en `Ludus Cero/Navegante/`.
- 📁 **Archivos:** Code: `NaveganteDeLaRed.tsx` v3.3, `NaveganteRedViva.ts` v1.3 (nuevo), `SimuladoresHub.tsx` v2.0,
  `RSV_SolarSimuladoresShell.tsx` v4.0 (da40b5c, a829e22, 1b1d525, aa1f255, cb24f39) · rsv-web: `public/ludus/`
  (portada de Navegante, `*-avance.mp4` y sus pósters) y la reescritura de /lucido/ (8b59b27, 9c3aecf) · lucido:
  a73d26b → bb0d152 (`herramientas/prueba.ts` v2.2 graba video) · `Ludus Cero/Navegante/` (CLAUDE.md, Docs y
  herramientas) · `Ludus Cero/Propuestas pixel/` y `Ludus Cero/Propuestas Navegante/` (las propuestas de arte).
- ⏳ **Pendiente:** en Pendientes vivos, Ludus Cero en celular y el precio del aviso de pago de Navegante.
- 💡 **Decisiones:** Lúcido y Terra Cristal van a Steam; computadora primero, celular como segundo canal (sin comprar
  descargas con anuncios) · el Escáner NO lleva Navegante (2026-09-17, reiterado) · lo de Navegante va solo a `Code/`
  y sus salas se abren en `Ludus Cero/Navegante` · **Grok ya no se usa (Zak, 2026-10-03): todo con Claude Code, que
  vuelve a tender este archivo**.
- 🔧 **Patrones nuevos:** portada y avance de un juego pintados con su propio motor (escena compuesta, cuadro a cuadro,
  ffmpeg) · avance de Lúcido grabado con su bot (`prueba.ts video`) · láminas en movimiento con ffmpeg (en zsh siempre
  `${VAR}`) · el host de Ludus en local con un proxy y `--host-resolver-rules` · cada juego con casa propia y su
  CLAUDE.md que excluye el maestro. Detalle en [[proyecto_navegante_arte]], [[proyecto_ludus_hub]] y
  [[proyecto_juego_pixel]].
- 🧬 **Versión del sistema:** Navegante v3.3 · motor Red Viva v1.3 · hub v2.0 · shell v4.0 · Lúcido 0.2 · protocolo v59.

#### 2026-10-03 · PUBLICIDAD: EL COMERCIAL DEL DECODIFICADOR, EL REEL EN VERSIÓN ANUNCIO, LA MEDICIÓN DEL MISMO DÍA Y EL AVISO DE PIPEDREAM

- ✅ **Resuelto:** **Pipedream** avisó que Workflows se apaga el 2027-03-31: mapa de los 3 flujos vivos y plan de
  mudarlos a Supabase (ver Pendientes vivos) · **estrategia de anuncios**: un video a la vez, 100 MXN al día por 7
  días, Grok lanza en Meta con prompts listos; sin anuncios de App Store (Zak: «no convierte tan bien») · **comercial
  «¿Te da energía o te la quita?»** del Decodificador (24.8 s): 3D en Blender (lata con gotas, mango, shampoo,
  limpiador, teléfono) con la pantalla de la app replicada fiel y **lecturas reales** (mismo prompt y modelo de
  decode-matter): refresco 5 % saludable, mango 92 %, shampoo 15 %, limpiador 5 %; voz de Cristina, música de
  ElevenLabs Music, clic de cámara en cada foto. Zak: «me encantó» · **el reel del Escáner en versión anuncio**
  (textos en la franja que no tapa Instagram), aparte del original · **medición del mismo día**: la landing cuenta
  visitas y toques a las tiendas por anuncio y carga el píxel de Meta sola; pestaña **Motor → Campaña** · comprobado
  que con solo la foto de una fruta (sin texto) el Decodificador entra en modo visión y la reconoce · proyección de 6
  meses dada a Zak, con el IVA corregido (499 → ~366 por suscriptor).
- 📁 **Archivos:** `escaner-landing/index.html` v1.3 (fb90eb3) · `Code/MI_Campana.tsx` v1.0,
  `MotorDeIntervencion.tsx` v5.2, `MI_Shared.tsx` v2.4, `Privacy.tsx` v1.7 (8466a41, en redsolarviva.com) · admin
  (183a501). Sin repo: `Escaner Vibracional/Anuncio Decodificador/estudio/` (lecturas.mjs, vision_prueba.mjs,
  etiquetas.js, blender/base.py y tomas.py v1.1, pantalla.js v1.1, final.js v1.1, musica_eleven.py, medir_musica.py,
  mezclar.py v2.1, armar.sh v1.1, render_todo.sh) · `Escaner Vibracional/Reel Promo/Versión anuncio/estudio/` ·
  entregables y prompts en `Escaner Vibracional/Publicidad/`.
- 🗄️ **Migraciones SQL aplicadas:** `20261003_campana_anuncios.sql` (Zak la pegó y la marcó ✅): tablas
  campana_eventos, campana_gasto y campana_ajustes, y sus RPC (record_campana_evento y get_campana_pixel para la
  landing; admin_campana_* para el Motor).
- 🔌 **Edge functions deployed:** admin-action v1.58 (rutea las 4 acciones de Campaña).
- ⏳ **Pendiente:** el comercial del Espejo y elegir cuál se lanza primero (Pendientes vivos); el píxel y la prueba desde
  Instagram (Pendientes vivos).
- 💡 **Decisiones:** Decodificador antes que sueños («los que la han usado usan más el decodificador»); el Espejo es el
  siguiente candidato porque puede atraer a más gente nueva · la música de los anuncios es real (ElevenLabs Music,
  instrumental), no sintetizada en código · nada de momentos dramáticos largos · voces al mismo LUFS y sin eco · no
  hizo falta tocar la app (una semana por video: lo que suba sobre la base es de ese video).
- 🔧 **Patrones nuevos:** lecturas reales con el prompt de la función leído del código y el mismo modelo por
  OpenRouter · pantalla de la app replicada en canvas y montada como secuencia en el teléfono 3D · Blender por tomas con
  cuadros globales, reanudable por tramos · ElevenLabs Music: con `composition_plan` el texto de cada trozo SE CANTA;
  `prompt` + `force_instrumental` y Scribe para confirmar que no canta · zonas que tapa un anuncio de Reels (arriba
  14 %, abajo 35 %) · un velo oscuro llega hasta el borde. Detalle en [[feedback_anuncios_video]].
- 🧬 **Versión del sistema:** App Store 1.1.6 LIVE · landing v1.3 · Motor v5.2 · admin-action v1.58 · protocolo v58.
- 🔮 retirado el 2026-10-03: el comercial del Espejo (prompt en `Escaner Vibracional/Publicidad/Prompt próxima sala ·
  Espejo.md`) y la elección del primer anuncio viven en Pendientes vivos; Grok ya no se usa.

---

#### 2026-09-28 · III → 2026-09-30 · CÓDICES DE LUZ: EL 02 EN EL SELLO DE LA CASA, EL 04 «NUNCA ESTÁS LEJOS», LA MAMÁ ESCULPIDA Y LA PALETA SIN FILO

- ✅ **Resuelto:** **video 02 «Nunca has perdido a nadie» rehecho en Escáner del Alma** (65.7 s): la lente del bebé que
  pierde el rostro de su mamá y lo recupera con «Aquí estoy», el ser amado que el universo envuelve (oculto, no
  ausente), el ventilador cuyas aspas desaparecen y el estroboscopio que las encuentra, el alma que vibra fuera de rango
  hasta «presencia 100 %», el hilo rojo con su simulación rota, la Terminal Tierra (el vuelo abordó, reencuentro
  confirmado) y la visión del corazón con cuatro presencias; la versión acuarela quedó en su subcarpeta · **video 04
  «Nunca estás lejos»** (Lenguaje Holográfico · Entrelazamiento y Ping, 70 s): el celular que vibra justo cuando
  pensabas en alguien, CASUALIDAD que se descifra en CONEXIÓN, la carrera corazón contra celular, dos partículas que un
  océano no separa, el cordón que atraviesa el planeta, el mapa que se dobla, el enlace dentro del pecho y la prueba de
  campo con el ping · **la mamá del 02 esculpida de nuevo** (Zak: «se ve como un muñeco muy chafita»): rostro, cabello
  en guedejas, torso y manos reales, con luz y sombra · **el 03 sin brillos agudos** (Zak: 3-4, 6-8, 18-19, 20-21 s y la
  campana del 1:04): en la música lo agudo bajó de 8 a 13 dB en esos tramos; la misma paleta se aplicó al 02 y al 04
  sin que se pidiera, con sus mezclas anteriores guardadas · verificado: 142/142 y 136/136 palabras, −14 LUFS, consola
  limpia y cuadros de cada MP4 final.
- 📁 **Archivos:** `Códices de Luz/Enseñanzas/02 Nunca has perdido a nadie/` (video, ligero, portada, `Versión
  acuarela/` y `estudio/`: escenas.js v2.3, retrato.js v1.3, formas.js v1.2.1, motor.js v1.3, shaders.js v3.1,
  audio.js v5.1, voz.py v2.1, ia.py v1.4, escucha.py v1.1) · `04 Nunca estás lejos/` (video, ligero, portada y
  `estudio/`: escenas.js v1.0, formas.js v1.4, audio.js v1.1, `sonidos.json` con 4 efectos) · `03 …/estudio/audio.js`
  v4.2 y sus dos videos con la mezcla nueva (imagen intacta) · mezclas anteriores en cada estudio (`audio_vX.js`,
  `audio/final_vX.wav`) · `.claude/launch.json` (`estudio-04`, puerto 8830). Ninguno es repo.
- ⏳ **Pendiente:** en Pendientes vivos, los cinco efectos del 03 que suenan al doble de largo; y el video 5 (su plan vive en [[proyecto_videos_ensenanzas]]).
- 💡 **Decisiones:** el #4 salió de Lenguaje Holográfico porque es el más compartible («pensaste en alguien y te
  escribió») · en el 02 Cristina es el Escáner y también la voz de quien parece haberse ido (rótulos MAMÁ y SEÑAL en
  oro) · la paleta de sonido de la serie va sin filo: campanas sin la grabación clara y una octava abajo de 700 Hz,
  brillos grabados filtrados a ~4 kHz y a menos de la mitad, teclas graves, violines y subidas sin aire arriba de ~4 kHz
  · una figura humana que carga emoción se esculpe, no se dibuja.
- 🔧 **Patrones nuevos:** retrato esculpido en código (`retrato.js`: superficies de distancia con luz, oclusión y
  borde; rasgos por densidad; cabello en guedejas de hebras paralelas; manos con falanges y nudillos) · máscara que
  apaga una elipse de la nube (manos que tapan la cara) · vibración cuadro a cuadro que la banda del Escáner fija ·
  desenfoque de giro al azar por punto · matrices libres (doblar media hoja, inclinar la Tierra) · rótulos sobre la
  Tierra por latitud y longitud · `ia.py` v1.4 decide los canales del audio crudo por la duración pedida · tras un
  corte, el video se rearma desde los cuadros que quedaron.
- 🧬 **Versión del sistema:** videos de enseñanzas 01 a 04 · protocolo v57.
- 🔮 retirado el 2026-10-03: el plan del video 5 vive en [[proyecto_videos_ensenanzas]].

#### 2026-09-28 · II · CÓDICES DE LUZ: DOS VIDEOS PARA ELEGIR SELLO, EL ESCÁNER DEL ALMA SELLADO, VOCES DIRECTAS Y SUBTÍTULOS A SALVO DE INSTAGRAM

- ✅ **Resuelto:** **video 02 «Nunca has perdido a nadie»** (La Muerte no Existe · el duelo como ilusión óptica, 65 s)
  en Acuarela Cósmica: pinturas de fal.ai que se mueven despacio y entran como pigmento mojado, la mamá que se destapa
  («Aquí estoy»), el ventilador cuyas aspas giran hasta desaparecer, el hilo rojo del pecho a quien se fue, la
  despedida en el aeropuerto y la abuela de luz en la silla del principio · **video 03 «No llegaste por accidente»**
  (Protocolo de Entrada, 67.6 s) en Escáner del Alma, todo con código: la Tierra en el anillo de glifos, la Sala de
  Proyección, México en holograma, el «ACEPTO», el descenso a 7.83 Hz, la semilla, el océano en la taza, la brújula y
  «¿por qué a mí?» que se descifra en «para esto vine» · **Zak eligió el Escáner del Alma** y selló al narrador · el 03
  se rehízo con sus notas desde la vista previa de Instagram: subtítulos sin cuadro a media altura entre su sitio
  anterior y la cuenta, las dos «s» de «consciencia» ya no pican, narrador más ágil y menos grave, lecturas que no se
  enciman en los cambios de escena · voces, efectos y revisión ahora por ElevenLabs directo, con su plan.
- 📁 **Archivos:** `Códices de Luz/Enseñanzas/02 Nunca has perdido a nadie/` (video, ligero, portada y `estudio/`:
  escenas.js v1.0, shaders.js v2.0 con FS_PINTURA, motor.js v1.1, audio.js v3.0, imagenes.py v1.0, `img/` e `ia/`) ·
  `03 No llegaste por accidente/` (video, ligero, portada, `Audiciones de voz/` y `estudio/`: escenas.js v1.2,
  formas.js v1.0, shaders.js v3.0 con VS_NUBE y FS_NUBE, motor.js v1.2, audio.js v4.1, voz.py v2.0, ia.py v1.3,
  escucha.py v1.0) · `Enseñanzas/Audiciones narrador/` (8 pruebas, ya no se usan) · `.claude/launch.json` (`estudio-02`
  y `estudio-03`). Ninguno es repo. No se tocó código de la app.
- ⏳ **Pendiente:** ~~seguir la serie en el sello del Escáner~~ → ✅ hecho en la sala siguiente (el 02 rehecho y el 04).
- 💡 **Decisiones:** el sello de la serie es **Escáner del Alma**; la acuarela queda descartada · narrador
  **CarterSutra sellado** como quedó en el 03 (velocidad 1.2 sin contexto, frases de peso a 1.02-1.1, −3.5 dB de graves)
  · la voz del Escáner es **Cristina Campos** · las voces SIEMPRE por ElevenLabs directo, nunca por fal.ai (su plan
  trae 10 000 créditos al mes que se renuevan cada 16 y no se pueden exceder; un video gasta ~1 000) · subtítulos solo
  letra, sin cuadro, primer renglón en y 1570 de 1920 (la cuenta de Instagram cae en ~1788), renglones de hasta 760 px
  y ningún adorno cruzando esa franja · fal.ai quedó sin saldo y con este sello no hace falta recargarlo.
- 🔧 **Patrones nuevos:** nube de puntos en la GPU que se transforma de una forma en otra (`formas.js`) · control de
  eses con el compresor de Chrome, midiendo su subida automática y compensándola · fundido simétrico para que dos
  lecturas nunca coincidan · `escucha.py` transcribe el MP4 final y lo compara con el guion · en zsh `log` es un comando
  interno: el registro del sistema es `/usr/bin/log show` · el AirDrop de Zak falla por tiempo agotado en el canal
  directo con la Mac en 5 GHz a 160 MHz (probar desconectando la Mac del módem, o bajar el módem a 80 MHz).
- 🧬 **Versión del sistema:** video de enseñanzas 03 v3 · protocolo v56.

#### 2026-09-27 → 2026-09-28 · CÓDICES DE LUZ: EL REEL DE LOS LIBROS, LA PRIMERA ENSEÑANZA CON VOZ Y CINCO SELLOS VISUALES

- ✅ **Resuelto:** **reel de los Códices** (38 s, 9:16): el gancho «Tienes en tus manos un objeto peligroso.», la tapa
  que se abre en luz, seis frases reales con sus portadas de la app (Sintiencia ahora dice «Tu gozo es la finalidad de
  la evolución.»), el anillo de los 11 en la Holoteca, «Lee las primeras páginas gratis», el Cristal que abre un Códice
  completo (con tiempo para leerlo) y el cierre con el ícono; campanas y cuenco reales de fal.ai afinados nota por nota
  · **primer video de enseñanzas**, «Nunca has tocado nada» (76 s, El Arquitecto): ilustración hecha con código, la voz
  de CarterSutra y Charlotte como la materia, subtítulos palabra por palabra, efectos de fal.ai y una música que se
  aparta de la voz · **las tres llaves** (fal.ai, ElevenLabs, Fish Audio) en el llavero de la Mac, leídas por `ia.py`
  sin servidor de por medio · **cinco sellos visuales** propuestos para la serie.
- 📁 **Archivos:** `Códices de Luz/Reel Promo/` (maestro, ligero, portada y `estudio/`: motor.js v1.0, shaders.js v1.0,
  escenas.js v1.1, audio.js v1.2, renderizar.sh v1.1, ia.py v1.2, tono.py v1.0) · `Códices de Luz/Enseñanzas/01 Nunca
  has tocado nada/` (video, ligero, portada, `Audiciones de voz/` y `estudio/`: guion.json, voz.py v1.0, escenas.js
  v1.0, audio.js v2.0, shaders.js v1.1, renderizar.sh v2.0) · `Códices de Luz/Enseñanzas/Estilos visuales/` (5 láminas
  y la tabla). Ninguno es repo. No se tocó código de la app.
- ⏳ **Pendiente:** ~~Zak elige el sello visual~~ → ✅ hecho el 2026-09-28 (Escáner del Alma); los videos 2 y 3
  salieron en la sala siguiente.
- 💡 **Decisiones:** la voz de la serie es **CarterSutra** (Zak, 2026-09-28) · los videos de enseñanzas no nombran el
  libro y cierran con el ícono, «Escáner Vibracional» y «Códices de Luz» · las frases de los Códices en video son
  expansivas, nunca de regaño · el texto se queda en pantalla lo suficiente para leerse y el reel puede llegar a 45 s ·
  lo que se promete de los Códices se verificó en el código y en la base: 11 libros, primeras páginas gratis sin
  membresía, Sintonía mensual con Cristal de Códice, audiolibro solo en La Voz de Gaia y El Agua que Recuerda, y la
  compra suelta no se promete · las llaves viven en el llavero de la Mac; el puente en el servidor lo bloquea el
  permiso automático.
- 🔧 **Patrones nuevos:** la voz con marcas de tiempo por fal.ai (`fal-ai/elevenlabs/tts/multilingual-v2`, acepta ids
  de la biblioteca) manda las escenas, los subtítulos y la música · lo que no se oye se mide (0-quaterquadragies) ·
  campanas afinadas midiendo su nota (`tono.py`) · un golpe doble se corta para que cada golpe caiga en su palabra ·
  libros en 3D con MSAA, portadas reales y cantos dorados · un objeto 3D que se desvanece va en su propio pase · la
  lámina de estilo: misma escena, tipografía propia, subtítulo de muestra y la firma con la línea de pulso.
- 🧬 **Versión del sistema:** reel de los Códices v3 · video de enseñanzas 01 · protocolo v55.

#### 2026-09-24 → 2026-09-25 — KAL'EL: SU PROPIA CARPETA, LA SOGA DE COLORES, CAMINOS CON MUROS Y EL SENDERO DE 16 ESTACIONES

- ✅ **Resuelto** (todo vivo en somacero.com, verificado renderizando y con la consola limpia): la carpeta `kalel` carga
  solo su contexto (el maestro excluido con `claudeMdExcludes`, medido con `/context`) · **La soga** con sellos del
  color de su nivel, letrero de victoria a los 27 que invita a Caminos, sellos que brincan, suenan, se arrastran y se
  ordenan, y letrero «Nivel X» · **Caminos** con un nivel por acierto, muros de piedra con puertas en zigzag y un sello
  por nivel · **el Sendero**: mapa de 16 estaciones en 5 etapas y 4 ramas (Manos, Voz, Lectura, Teclado) con
  prerrequisitos, pensado para que un niño que solo aprenda aquí termine escribiendo con las dos manos, leyendo
  cuentos, pronunciando bien y dominando el trackpad. 13 estaciones nuevas: Burbujas, Dilo, Trazos, Letras, Sílabas,
  Clics, Dedos, Palabras, Cuentos, Explorador, Escritorio, Tormenta y Carrera.
- 📁 **Archivos:** en `kalel/` — `src/kit/` (juego, sonidos, voz, escucha, teclado, TecladoPantalla, almacen),
  `src/contenido/` (letras, palabras, cuentos), `src/juegos/` (11 juegos), `src/estaciones.ts`, `src/Sendero.tsx`,
  `KalEl.tsx` v2.0, `KalElSoga.tsx` v2.0, `KalElCaminos.tsx` v1.5, `KalElAlbum.tsx` v1.1, `CURRICULO.md`,
  `CLAUDE.md` v2.1, `Docs/BITACORA.md`. Fuera de `kalel`: el servidor `kalel` en `.claude/launch.json` de la raíz.
  Commits `867ea0f` → `5768fb7`.
- ⏳ **Pendiente:** probar el micrófono (Dilo, Cuentos) y el trackpad (Explorador, Clics) de verdad en la computadora
  de Kal'El, y afinar lo que salga de verlo jugar.
- 💡 **Decisiones:** un solo Sendero con prerrequisitos (se abre al terminar lo que prepara; Ajustes tiene «Abrir
  todas») · Mundos se gana tocando los 20 · la voz se compara por cómo suena en México (b=v, sin h, c/s/z, ll=y, pero
  r≠rr) y siempre muestra lo que oyó; si el micrófono no entiende, aprueba el adulto manteniendo un botón · el teclado
  se aprende de lo que escribe cada tecla; con teclado en inglés se saltan ñ y acentos · Kal'El estrena su propio
  «Protocolo de cierre», como Terra Cristal.
- 🔧 **Patrones nuevos:** marco común de juegos (niveles guardados, sellos, instrucción hablada, celebración y
  victoria) · el «siguiente juego» se calcula al leerse, así el letrero ve la estación recién abierta · trabajo
  repartido con base, ejemplo y avisos en vuelo (0-duoquadragies) · claves con prefijo (0-terquadragies).
- 🧬 **Versión del sistema:** somacero.com con el Sendero de 16 estaciones · protocolo v54.
- ↪ **El arranque de Kal'El** vive en `kalel/CLAUDE.md` (estado y pendientes) y `kalel/Docs/BITACORA.md`.

#### 2026-09-21 · II → 2026-09-25 — ESCÁNER: SESIONES QUE DURAN AÑOS, GRUPOS Y NOTAS COMPARTIDAS, EL CHAT QUE AGUANTA EL GIRO, ANILLOS A LA MEDIDA, LA TIENDA QUE CELEBRA, EL INICIO DE SESIÓN WEB Y EL REEL

- ✅ **Resuelto:** el «me sacó de la app» semanal era el plazo de 7 días que Clerk trae de fábrica; Zak lo subió a
  10 años con cierre por inactividad de 1 año (las sesiones viejas pidieron entrar una última vez) · **grupos de
  hasta 10** como WhatsApp (nadie entra sin su sí, administradores, información del grupo) · **notas de la Bitácora
  compartidas** (se entra aceptando, «está escribiendo…», fusión por párrafo, tope 10, no cuentan para el límite
  gratis) · **avisos con vista previa** · **Enter salta de línea** en los chats (se envía con el botón o Cmd/Ctrl+Enter)
  · una sola ventana para invitar (contactos, nombre entre perfiles visibles, correo exacto) · el cifrado de mensajes
  privados y de Realidad Elegida **cifra de verdad** · **girar el teléfono no borra lo escrito** ni recarga la
  conversación, y cada chat guarda su **borrador** aunque se salga · **anillos a la medida real** de Nova, Aurelia y
  Prisma en cada media etapa · **la tienda suena** (pestaña, selección, equipar) y **comprar se celebra** a pantalla
  completa · el guion del iPhone compila aunque el teléfono esté bloqueado · **el inicio de sesión web con Google o
  Apple volvía a una página 404** desde el 5 de septiembre; arreglado, con una guardia en el guion de publicación, y
  Zak confirmó que entra · **reel promocional 9:16 de 28 s** con música y diseño sonoro propios (el Espejo y el
  Decodificador de Alimentos de protagonistas, cierre «Descárgala gratis») · **Mensajes abre al instante**: la
  bandeja y cada chat salen de lo que el teléfono recuerda y el servidor actualiza encima, lo que envías aparece al
  tocar (con reintento si no llega) y entrar a Comunidad hace una sola lectura (medido con 420 ms de servidor:
  entrar 849→426 ms y 3 ms al reabrir la app, abrir un chat 872→441 ms y 15 ms precalentado, enviar 435→9 ms) ·
  **escribir ya no esconde el último mensaje** detrás de la caja (medir con altura automática recortaba el
  desplazamiento: 65 de 92 teclas, hasta 61 px) · el reel sin la línea del túnel (el hash de seno amontonaba
  partículas en un ángulo) y con el **ícono real de la app** en una tarjeta de tienda · **el archivo maestro se
  partió**: de 167.000 a 51.000 caracteres (lecciones a `admin/CLAUDE_lecciones.md`, secciones viejas al archivo) ·
  **el reel arranca directo**: el primer cuadro ya trae la pregunta legible, el pulso encendido y un golpe de sonido
  (antes era negro medio segundo, y en los reels se decide en el primer cuadro).
- 📁 **Archivos:** en `escaner-app/` — `Grupos.tsx` v1.0 · `InvitarTripulante.tsx` v1.0 · `EV_BitacoraCompartir.tsx`
  v1.0 · `EV_Bitacora.tsx` v1.21 · `fusionNotas.ts` v1.1 · `PushSync.tsx` v1.6 · `Comunidad.tsx` v1.21 ·
  `Mensajes.tsx` v1.40 · `CamaraCristalizacion.tsx` v1.7 · `OrbitRings.tsx` v1.3 · `avatarFootprint.ts` v2.1 ·
  `sensory.ts` v2.19 · diccionarios `grupos`, `bitacora`, `comu`, `avatar` · `vercel.json` · `publicar-escritorio.sh` ·
  `al-iphone.sh` · `lib/chatStore.ts` v1.0 · `viewCache.ts` v1.1 · `Mensajes.tsx` v1.42 · `Comunidad.tsx` v1.22 ·
  app de Mac **1.1.46** · `escaner-app/CLAUDE.md` y `Code/CLAUDE.md` nuevos. El reel y su estudio: `Escaner Vibracional/Reel Promo/` (no es repo).
- 🗄️ **Migraciones SQL:** `20260921_grupos_notas_compartidas.sql` (aplicada por Zak y verificada) ·
  `20260921b_anillos_a_la_medida.sql` (aplicada por Zak el 2026-09-25 y verificada).
- 🔌 **Edge functions deployed:** `send-push` v1.3 (vista previa del mensaje) · `transcribe-voice` v1.1 ·
  `user-action` v1.49 (grupos, notas compartidas, invitaciones). El puente temporal de fal.ai se usó para los efectos
  del reel y quedó **borrado** (responde 404).
- ⏳ **Pendiente:** medir igual el Aura, el Enjambre, el Sello y las Alas, que siguen con el tamaño estimado · escribir
  a quienes no pudieron entrar a la web del 5 al 24 de septiembre (Clerk sabe quiénes lo intentaron).
- 💡 **Decisiones:** sesión de 10 años + inactividad de 1 año · en los chats Enter es salto de línea · grupos y notas
  compartidas con tope de 10 y siempre con aceptación · el reel se regenera con un comando
  (`Reel Promo/estudio/renderizar.sh`, y `--musica` si cambia la música).
- 🔧 **Patrones nuevos:** girar sin desmontar = un solo árbol con cajas que no pintan · el borde del avatar se mide
  (luz encerrada al 90 %) en vez de estimarse · estudio de video propio: WebGL para partículas y brillo, lienzo 2D
  para la tipografía, la música sintetizada en el navegador y tres Chrome sin ventana con la GPU del Mac
  (1680 cuadros en 15 s); ver [[proyecto_reel_promo_escaner]].
- 🧬 **Versión del sistema:** app de Mac 1.1.46 · protocolo v53 · web con `/oauth-callback` de vuelta · reel v1 · mensajería local
  primero ([[proyecto_mensajeria_instantanea]]).

#### 2026-09-20 — TERRA CRISTAL: CADA ATAQUE CON SU ARTE, EL SALTO A DOMUS, SENTARSE Y UNA TANDA DE PULIDO

- ✅ **Resuelto** (todo vivo en play.redsolarviva.com/terra-cristal/, verificado renderizando y sin errores de consola):
  el golpe de bastón de Elara y el Pulso Solar con sus animaciones nuevas, y el soldado de la Legión usando por fin
  su estocada (su clip estaba amarrado a la Magia, que él nunca lanza) · el **SALTO A DOMUS**, la magia de retirada:
  sello de vector, columna de luz y de vuelta a la base con lo ganado, los caídos siguen caídos y la arena queda
  por ganar, que es lo que permite entrenar · **monedas** por enemigo · la batalla **se mira de cerca** (campo
  entero solo al abrir, después la cámara va con quien actúa) · la **Cámara de Recarga** completa: 62 casillas, el
  muro de cristal y el arco tapando de verdad y el vidrio dejando ver a través · **SENTARSE** con las tres
  animaciones de Zak (bucle y dos entradas), tecla **D**, caminando sola al mueble · **la pantalla negra** al volver
  de la base a una arena sin ganar · el **portal carga de una pieza** (negro con anillo y fundido), **botón de
  sonido** que espera un gesto y **chasquido** al entrar · cabecera con solo el nombre del lugar · el alcance como
  **mancha** y no cuadrícula · **girar en el sitio** contra un tope y **giro al llegar** (paso y flecha contraria) ·
  el selector libre por todo el mapa pero dentro de la pintura · teclas **O** (asientos) y **P** · sin botones de
  ATRÁS · **sonido de continuar** en todos los cuadros de diálogo.
- 📁 **Archivos:** en `terra-cristal/` — `extraer_personaje.py` v1.8 · `oclusores.py` v2.0 · `separar_capas.py` v3.1 ·
  `base01_mask.py` v1.3 · `dibujar_iconos.py` v1.6 · `sintetizar_sfx.py` v1.3 · `PlaceholderArt` v3.0 ·
  `ArenaBuilder` v3.1 · `PersonajesImporter` v1.6 · `UnitData` v1.5 · `Unit` v3.8 · `BattleCutscene` v3.5 ·
  `TurnManager` v2.9 · `CameraRig` v1.5 · `GridController` v5.0 · `BattleHud` v6.2 · `GameState` v1.1 ·
  `index.html` del portal. Commits `a3ec2ab` → `45e3407` → el del botón de sonido.
- ⏳ **Pendiente:** los seis sitios para sentarse (Zak los dicta con el selector, que dice su casilla) · tres
  oclusores marcados ESCONDER (la curva del muro sobre la cabeza, una planta de la arena sobre las piernas, los
  sofás donde el pie se encima) · el corrimiento de la caminata por casilla con ida y vuelta distintas.
- 💡 **Decisiones:** las reglas de construcción de Terra Cristal viven en `terra-cristal/Docs/DIRECTRICES.md`, no
  aquí · un área navegable se prueba en las dos direcciones · si el pie no se puede esconder, esa casilla no existe ·
  nada se enseña a medio cargar · la música del portal no puede sonar sin un gesto (política del navegador): por eso
  el botón de bocina.
- 🔧 **Patrones nuevos:** el instante del golpe y la punta del arma se MIDEN del vídeo y viajan en el manifest ·
  cada animación con su ancho y su pivote · el modo `regiones` de oclusores y el `cristal` con velo · una mancha de
  16 losetas según qué lados dan al borde.
- 🧬 **Versión del sistema:** Terra Cristal, build web del 2026-09-20 (36 MB).
- ↪ **El arranque de Terra Cristal** vive en `terra-cristal/Docs/PROXIMA_SALA.md` y en `terra-cristal/CLAUDE.md`
  (su 🔮 se retiró de aquí al entrar una sala más nueva; su trabajo sigue abierto allá).

*Archivada completa el 2026-09-25 · II, al entrar la sala de Kal'El.*

---

#### 2026-10-04 · IV · LÚCIDO: SIN MARCO, PASOS PROPIOS Y LA PÁGINA QUE SELLÓ LUZ DE CINE Y A TONALLI

- ✅ **Resuelto:** **Lúcido llena la pantalla sin marco** (elige su tamaño en pixeles con la proporción de la ventana,
  se reacomoda en vivo al entrar a pantalla completa y el primer gesto en computadora la pone) · **pasos propios** al
  caminar (talón, planta y polvo; medidos abajo de las campanas) · **la tercera sala ya no brinca** (cada sala trae una
  sola cosa nueva, medido con el bot) · **el túnel se mueve a los cuatro lados** · **el protagonista es hombre** en las
  cuatro edades (el viejo con barba y bastón) · **la página de propuestas** (`Ludus Cero/lucido/propuestas/`): la sala en cinco
  niveles de pixel y cuatro candidatos esculpidos en volumen, con ocho vistas, caminata en cuatro direcciones y arte HD
  · respuesta a Zak: a qué se parece Lúcido, cinco propuestas para Steam y sus porcentajes
  (`Ludus Cero/lucido/Docs/PROPUESTAS_STEAM.md`).
- 📁 **Archivos:** lucido (3c6a376, aa527ce): `main.ts` v2.2, `escenas.ts` v2.2, `vida.ts` v2.3, `audio.ts` v1.1,
  `reglas.ts` v2.2, `arte.ts` v1.1, `textos.ts` v2.2, `base.ts` v1.1, `lienzo.ts` v1.1, `prueba.ts` v2.3 (modo
  dificultad) y `propuestas/` (nueva) · publicado en Vercel (`index-TbrOwI-l.js`).
- 💡 **Decisiones (Zak):** nivel 3 «luz de cine» (640 x 360 con la luz a resolución completa, la receta de Terra
  Cristal) · Tonalli de protagonista · selector con Tonalli, Teyolia y Temictli, Ollin fuera · el arte HD fue solo para
  verlo · cuatro direcciones · orden: el nivel 3 y los personajes, la propuesta 3 y luego la 1 (las épocas, que le
  encantaron); después la 2, la 4 y la 5 · las salas de Lúcido se abren en la carpeta `Ludus Cero/lucido`.
- 🔧 **Patrones nuevos:** personajes esculpidos con campos de distancia que dan a la vez el pixel de cada nivel (contorno
  del color de cada parte y línea donde algo pasa por delante), las ocho vistas, la caminata y el arte HD · un
  comparador honesto pinta «hoy» con el motor real · la curva de dificultad se mide por sala con el bot
  (`prueba.ts dificultad`) · el volumen de un sonido nuevo se mide contra lo aprobado con OfflineAudioContext · fotos por
  sección (una página completa con muchos lienzos de WebGL se atora). Detalle en [[proyecto_juego_pixel]].
- 🧬 **Versión del sistema:** Lúcido 0.2 (sin marco, pasos) · protocolo v63.
- 🧭 **Su arranque** vive en `Ludus Cero/lucido/Docs/PROXIMA_SALA.md` (abrir la carpeta `Ludus Cero/lucido` y pegar su
  prompt); salió de aquí al cerrar la sala de Fotón Cero, porque solo la sala más reciente lleva 🔮.

*Archivada completa el 2026-10-07 · II, al entrar la sala de Claude for Startups.*
