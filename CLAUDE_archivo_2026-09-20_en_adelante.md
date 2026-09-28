# Archivo del Historial de sesiones · desde el 2026-09-20

Entradas completas que salieron del maestro al comprimirse (Paso 3). No se carga por sesión.

---

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

