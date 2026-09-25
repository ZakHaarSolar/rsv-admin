# Archivo del Historial de sesiones · desde el 2026-09-20

Entradas completas que salieron del maestro al comprimirse (Paso 3). No se carga por sesión.

---

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

