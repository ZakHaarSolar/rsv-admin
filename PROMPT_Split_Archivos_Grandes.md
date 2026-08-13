# PROMPT · SPLIT DE LOS TRES ARCHIVOS GRANDES

*(Copiar y pegar tal cual en una Sala de Comando nueva. Solo refactor
estructural — mismo comportamiento, mismos componentes, nada nuevo se
construye.)*

---

## Por qué

Tres archivos de `Code/` cruzaron o están por cruzar el umbral de ~300KB que
el watcher de Framer no puede subir automáticamente (falla con timeout tras
3 intentos, o directamente se salta con `skipped_large`). Tamaño medido el
2026-08-10:

| Archivo | Bytes | Líneas | Estado |
|---|---|---|---|
| `MI_Editores.tsx` | 342.027 | 7.581 | 🔴 sobre el umbral, requiere pegado manual |
| `MotorDeIntervencion.tsx` | 304.410 | 7.120 | 🔴 sobre el umbral, requiere pegado manual |
| `AppNavegacionMobile.tsx` | 290.387 | ~6.305 | 🟡 bajo el umbral, pero crece y ya molesta |

El objetivo: partir cada uno en un **shell delgado** + **archivos hermanos por
dominio**, siguiendo el mismo patrón que ya funciona en este proyecto — el
split del Escáner (`EscanerVibracional.tsx` + 8 `EV_*.tsx`) y el split parcial
del Motor que ya existe (`MotorDeIntervencion.tsx` + `MI_Shared` / `MI_Cards`
/ `MI_Cristales` / `MI_Detail` / `MI_Editores` / `MI_Soporte` /
`MI_Tripulantes`). Este prompt completa ese mismo split un nivel más adentro:
`MI_Editores.tsx` y `MotorDeIntervencion.tsx` YA están divididos respecto al
resto del Motor — lo que falta es dividirlos a SÍ MISMOS, porque cada uno se
volvió gigante por dentro.

**No se toca comportamiento.** Es mover funciones de un archivo a otro,
ajustar imports, y verificar que compila y que no quedó nada huérfano. Cero
lógica nueva, cero UI nueva.

---

## 🜂 REGLA DE ORO QUE APLICA DIRECTO — LEER ANTES DE TOCAR NADA

Esto es exactamente el escenario que rompió `EV_Oraculo.tsx` el 2026-08-08:
mover bloques grandes de código en un archivo enorme. La causa de aquel
desastre fue cortar por **rango de líneas calculado**, no por texto anclado.

**Antes de escribir una sola línea:**

1. `cd "/Users/diego/Documents/Red Solar Viva/Code" && git status --short` —
   confirmar que el árbol está limpio (o commitear/guardar lo que haya) ANTES
   de mover nada. Si algo aparece como `??` (sin trackear), es una señal de
   alarma: significa que no hay red de seguridad para ese archivo.
2. Cada extracción se hace con la herramienta `Edit` (que falla sola si el
   texto a buscar no es único), **nunca** con un script que calcule
   "desde la línea X hasta la línea Y" o que busque el cierre de una función
   contando llaves/parens. Los números de línea de este prompt son
   ORIENTACIÓN para ubicarte rápido — el ancla real es el nombre exacto de la
   función (`function NombreExacto(`), que es único en el archivo.
3. Después de cada extracción, correr `git diff --stat` sobre el archivo
   origen y confirmar que el recuento de líneas quitadas coincide con lo
   esperado (ni de más ni de menos) antes de seguir con la siguiente pieza.
4. Un commit por archivo terminado (los tres, si el tiempo alcanza), nunca un
   commit gigante al final que mezcle los tres splits — si algo sale mal, la
   reversión tiene que ser quirúrgica.

---

## El patrón de Code File — repaso obligatorio

Cada archivo nuevo en Framer necesita default-exportar algo con JSX real (no
un objeto plano, no una función que retorna `null`). El patrón canónico ya
vive en `MI_Shared.tsx` — **copiarlo tal cual**, cambiando solo el nombre de
la función shell y la lista de exports:

```tsx
function <Nombre>Shell(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
<Nombre>Shell.displayName = "<Nombre>_Helpers"

const <Nombre> = Object.assign(<Nombre>Shell, {
    // todas las funciones/componentes que antes vivían sueltos en el
    // archivo grande, ahora como propiedades de este objeto
    ComponenteA,
    ComponenteB,
    helperC,
})

export default <Nombre>
```

El archivo consumidor (el shell que se queda chico) importa así:

```tsx
import MI_EditRituales from "./MI_EditRituales.tsx"
const { SondasEditor, ProtocolosEditor, RitualesHub } = MI_EditRituales
```

**Nunca** named exports para estos componentes (`export function X`) — Framer
no los resuelve entre archivos del proyecto (TS2614). Ver la regla de oro
correspondiente en `CLAUDE.md` si hace falta el detalle completo.

**Archivos nuevos en Framer requieren creación manual.** El watcher solo
actualiza archivos que YA existen en Framer Assets; no puede crear ninguno.
Al terminar cada split, el reporte final tiene que decir con el emoji 🔄 cuáles
archivos son NUEVOS y que Zak los cree a mano en Framer (Assets → Code → +
→ pegar el nombre exacto del archivo → pegar el contenido) antes de que el
watcher pueda sincronizarlos en adelante.

---

## 1 · `MI_Editores.tsx` (342KB → shell + 5 hermanos)

Hoy vive TODO en un solo archivo: editores de Sondas, Protocolos, Rituales,
Wallpapers, Avatares, Comunidad, Medallas, Moderación, Stickers, Buzón,
Versiones, Espejo (panel admin) y Biosfera. Los nombres de función ya agrupan
solos por dominio — el split es casi mecánico.

**Split propuesto** (verificar los límites exactos con
`grep -n "^function " MI_Editores.tsx` antes de cortar, porque la sala que
corra esto puede encontrar el archivo ligeramente distinto):

- **`MI_EditRituales.tsx`** (~2.100 líneas, ~95KB) — desde `SondasEditor` (hoy
  línea 317) hasta el final de `RitualesHub` (hoy línea ~2447). Incluye:
  `ScoreInput`, `SondasEditor`, `ProtocolosEditor`, `AfirmacionesEditor`,
  `CategoriaCard`, `slugifyRitualKey`, `RitualCatalogEditor`, `RitualRow`,
  `RitualesHub`.
- **`MI_EditWallpapers.tsx`** (~1.400 líneas, ~63KB) — desde
  `resizeWallpaperToBase64` (hoy línea 2448) hasta el final de
  `WpCategoryRow` (hoy línea ~3850). Incluye: `resizeWallpaperToBase64`,
  `WallpaperAtelier`, `WallpapersHub`, `WallpaperTelemetry`,
  `WallpapersEditor`, `WallpaperRow`, `WpCategoryRow`.
- **`MI_EditAvatares.tsx`** (~1.250 líneas, ~56KB) — desde `arr7or` (hoy
  línea 3851) hasta el final de `AvataresHub` (hoy línea ~5099). Incluye:
  `arr7or`, `normFootprint`, `stageNamesFor`, `normAvatarParams`,
  `AvataresEditor`, `AvatarFootprintEditor`, `FotonesAdjuster`,
  `paramsToText`, `CristalizacionEditor`, `Field`, `CristalRow`,
  `CampoSolarEditor`, `ResetAvatarCard`, `MensajeAdminEditor`, `AvataresHub`.
- **`MI_EditComunidad.tsx`** (~1.670 líneas, ~75KB) — desde
  `slugifyInterestKey` (hoy línea 5121, justo DESPUÉS de `MIEditoresShell`,
  ver nota abajo) hasta el final de `BuzonEditor` (hoy línea ~6791).
  Incluye: `slugifyInterestKey`, `ComunidadInteresesEditor`, `InterestRow`,
  `MedallasEditor`, `ModeracionPanel`, `StickersHub`, `BuzonEditor`.
- **`MI_EditSistema.tsx`** (~800 líneas, ~36KB) — desde `VersionesEditor`
  (hoy línea 6792) hasta el final de `BiosferaEditor` (hoy línea 7581, fin
  del archivo). Incluye: `VersionesEditor`, `renderEspejoMd`, `EspejoEditor`,
  `BiosferaEditor`.

**Lo que se queda en `MI_Editores.tsx`** (shell, ~300-400 líneas): los
helpers chicos compartidos (`LangToggle`, `BtnRecargar`, `alignLabels`,
`alignTasks`) que probablemente usan varios de los hermanos — si es así,
van al patrón Object.assign de `MI_Editores.tsx` mismo y los hermanos los
importan de vuelta desde ahí (dependencia circular NO es problema en Framer
mientras cada archivo default-exporte su propio objeto). La función
`MIEditoresShell` (hoy línea 5100, el dispatcher que decide qué editor
mostrar según la sección activa) también se queda en el shell — es lo que da
sentido a que el archivo siga existiendo.

⚠️ **Ojo con `MIEditoresShell` en medio del archivo** (línea 5100, entre
`AvataresHub` y `slugifyInterestKey`): verificar si esa función referencia
componentes de VARIOS de los hermanos de arriba. Si es así, tiene que quedar
en el shell e importar de todos los hermanos — no moverla a ninguno de ellos.

---

## 2 · `MotorDeIntervencion.tsx` (304KB → shell + 6 hermanos)

Este archivo YA es un shell respecto al resto del Motor (importa `MI_Shared`,
`MI_Cards`, `MI_Cristales`, `MI_Detail`, `MI_Editores`, `MI_Soporte`,
`MI_Tripulantes`) pero acumuló paneles completos sueltos que nunca se
extrajeron. `HomeView` (línea 6342) es el verdadero shell — tab bar +
dispatcher — y todo lo de ARRIBA de esa función son paneles standalone que se
pueden mover sin tocar `HomeView`.

**Split propuesto:**

- **`MI_Navegacion.tsx`** (~730 líneas) — `NavTelemetryView` (línea 137) y
  sus helpers, hasta justo antes de `bumpPatch` (línea 866).
- **`MI_App.tsx`** (~940 líneas) — desde `bumpPatch` (línea 866) hasta justo
  antes de `RachasAnonPanel` (línea 1537). Incluye: `bumpPatch`,
  `semverMax`, `AppVersionBadge`, `BitacoraAvisosPanel`,
  `BloqueoEmergenciaPanel`.
- **`MI_Growth.tsx`** (~1.500 líneas) — desde `RachasAnonPanel` (línea 1537)
  hasta justo antes de `chipsDeCorreo` (línea 3269). Incluye:
  `RachasAnonPanel`, `CamaraSolarToggle`, `SesionesToggle`, `ABRow`,
  `OnbSessionsPanel`, `OnbFunnelPanel`, `GrowthABPanel`.
- **`MI_Correos.tsx`** (~600 líneas) — desde `chipsDeCorreo` (línea 3269)
  hasta justo antes de `cropResizeToBase64` (línea 3877). Incluye:
  `chipsDeCorreo`, `esCorreoContactable`, `CorreosPanel`.
- **`MI_CropCircles.tsx`** (~1.200 líneas) — desde `cropResizeToBase64`
  (línea 3877) hasta justo antes de `IA_C` (línea 5084). Incluye:
  `cropResizeToBase64`, `CropThumb`, `CropLightbox`, `CropFramer`,
  `CropCirclesPanel`.
- **`MI_IAs.tsx`** (~1.300 líneas) — desde `IA_C` (línea 5084) hasta justo
  antes de `HomeView` (línea 6342). Incluye TODO el bloque de IAs completo:
  `IA_C`, `type IaUse`, `IA_APP`, `IA_FREQ`, `IA_ATELIER`, `IA_SESIONES`,
  `IA_PRICES`, `IA_MATRIZ`, `IA_COLS`, `IA_GLOBAL`, `LimitesPanel`,
  `IaCard`, `IaGroup`, `PaseImagenPanel`, `IAsPanel`. (Este es el bloque que
  la sala del 2026-08-10 acaba de tocar — el campo `criterio` en `IaUse` y
  las filas de Reflejo ilustrado / Modo Ráfaga / navegación por voz — así
  que verificar que ese trabajo viajó completo al archivo nuevo.)

**Lo que se queda en `MotorDeIntervencion.tsx`** (shell, ~800 líneas +
imports): `HomeView` y todo lo que haya después de esa función hasta el
`export default MotorDeIntervencion` del final.

---

## 3 · `AppNavegacionMobile.tsx` (290KB → shell + 4 hermanos)

**Verificado por grep antes de escribir este prompt:** el ÚNICO consumidor
externo es `Domo.tsx`, con `import AppNavegacionMobile from
"./AppNavegacionMobile.tsx"` (default import, un solo símbolo). Ningún otro
archivo importa nada de acá — las decenas de menciones a
"AppNavegacionMobile" en `EV_Shared`, `Origen`, `Codices`, etc. son
comentarios que EXPLICAN cómo se comporta el shell externo, no imports. Esto
hace el split de bajo riesgo: todos los componentes internos
(`Holoteca`, `SimuladoresShellMobile`, `BottomNav`, `FragmentosAstrolabio`,
`CodigosFuenteAnclaje`, etc.) son privados de este archivo — nadie de afuera
los toca por nombre.

**Split propuesto** (verificar límites con
`grep -n "^function " AppNavegacionMobile.tsx`):

- **`MobileHoloteca.tsx`** — `Holoteca` (línea 1444), `HoloCard` (línea
  1290), `Proximamente` (línea 1663), y lo que haya entre medio.
- **`MobileFragmentos.tsx`** — desde `buildYoutubeShareUrl` (línea 1784)
  hasta el final de `FragmentosAstrolabio` (línea ~3275). Incluye:
  `buildYoutubeShareUrl`, `AudioWaveform`, `FragmentoPlayerFullscreen`,
  `SolSupremo`, `Planet`, `FragmentosAstrolabio`.
- **`MobileSimuladores.tsx`** — desde `CrystalCore` (línea 3276) hasta el
  final de `SimuladoresSelectorCardsOnly` (línea ~4294). Incluye:
  `CrystalCore`, `BinaryParticles`, `ScanLine`, `SelectorSimuladores`,
  `SimuladorCardLarge`, `SimuladoresShellMobile`, `SimuladoresPublicMobile`,
  `SimuladoresSelectorCardsOnly`.
- **`MobileCodigosFuente.tsx`** — `computeCodigosFuenteAnchor` (línea 4295) y
  `CodigosFuenteAnclaje` (línea 4308), hasta justo antes de `BottomNav`
  (línea 4711).

**Lo que se queda en `AppNavegacionMobile.tsx`** (shell): `BottomNav` (línea
4711) y la función `AppNavegacionMobile` misma (línea 5664, el shell real +
`export default`) — junto con `readPathTab`/`pushPathForTab` si son usados
por el shell directamente.

---

## Verificación (los tres archivos)

`Code/` no tiene `tsconfig` para `tsc -b`; el chequeo de sintaxis de estos
archivos se hace con esbuild, como ya se usó en la sala del 2026-08-09/10:

```bash
cd "/Users/diego/Documents/Red Solar Viva/Code" && npx esbuild MI_Editores.tsx --outfile=/dev/null && npx esbuild MotorDeIntervencion.tsx --outfile=/dev/null && npx esbuild AppNavegacionMobile.tsx --outfile=/dev/null
```

Correr esto por CADA archivo nuevo también. Además:

- `ls -la Code/*.tsx | awk '{print $5, $9}'` al final — confirmar que los
  tres archivos originales bajaron de tamaño y que ninguno de los nuevos
  quedó, a su vez, cerca del umbral (target: que todos queden bajo 150KB,
  con margen para crecer sin volver a esta conversación en un mes).
- `grep -c "^function \|^const [A-Z]" <archivo>.tsx` antes y después en cada
  extracción — la suma de piezas movidas + lo que queda en el shell debe
  igualar el conteo original. Si no cuadra, algo se perdió o se duplicó.
- Un grep final de cada nombre de componente movido (`grep -rn
  "NombreComponente" Code/*.tsx`) para confirmar que no quedó una definición
  vieja huérfana en el archivo origen (residuo de un corte mal hecho).

---

## Reglas de la casa que aplican

- Version bump en el header de LOS SEIS archivos tocados (los 3 shells +
  hasta 10-11 hermanos nuevos): `// <Archivo>.tsx v1.0` en los nuevos,
  bump normal en los que ya existían.
- 🔄 **Al cerrar, el reporte dice EXPLÍCITAMENTE cuáles son archivos NUEVOS**
  que Zak tiene que crear a mano en Framer (Assets → Code → +) antes de la
  primera sync — son hasta 11 archivos nuevos entre los tres splits, así que
  esta vez el bloque de "requiere copy/paste manual" va a ser largo. Mejor
  agruparlo por archivo de origen para que Zak sepa qué va con qué.
- Uno de los tres archivos ORIGINALES (`MI_Editores.tsx` o
  `MotorDeIntervencion.tsx`, los que hoy superan 300KB) probablemente BAJA
  del umbral tras el split y el watcher vuelve a poder subirlo solo — eso
  también se dice en el reporte, es una buena noticia que no hay que dar por
  sentada sin confirmar el tamaño final.
- Sin SQL, sin RPC, sin edge functions — es puro `Code/*.tsx`.
- Ambigüedad → elegir la opción más lógica (seguir los límites de este
  prompt) y documentar qué se decidió si algo no cuadró con lo escrito acá.
