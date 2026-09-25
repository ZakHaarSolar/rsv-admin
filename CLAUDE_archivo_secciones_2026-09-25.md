# Secciones retiradas del CLAUDE.md maestro · 2026-09-25

> Decisión de Zak: el maestro carga solo lo que aplica a todas las salas. Esto se movió VERBATIM:
> Framer se canceló el 2026-08-11 (el sitio vive en `rsv-web/` sobre Vercel) y el motor de reservas
> está apagado. Se conserva completo por si algún día hace falta. No se carga por sesión.

## Reglas Framer críticas

- **🜂 REGLA DE ORO — Fail-fast al sincronizar (NO retries, NUNCA).** El
  watcher (`admin/framer-watcher.mjs` v2.11+) corre 1 solo intento por
  archivo con timeout 90s. Si aparece `intento 2/3` o `intento 3/3` en
  la consola del watcher, el proceso running es una versión vieja →
  pedile a Diego **"reiniciá npm run dev"** y listo. Nunca agregar
  retries al watcher: si Framer API falla, se reporta como `failed` en
  el receipt (`admin/.last-sync-status.json`) y seguimos con el resto
  del batch. Diego NO tolera esperar mientras la API reintentá la misma
  llamada. Antes de reportar "todo sincronizado", leé el receipt y
  separá la lista entre subidos vs fallados.

- **🜂 REGLA DE ORO — Version bump en el header SIEMPRE.** Cada edit a
  un `.tsx` (o `.md` importante) debe:
  1. Subir la versión en el header `// Archivo.tsx vX.Y` → `vX.Y+1`.
  2. Actualizar el one-liner descriptivo que sigue al version tag.
  Sin versión visible no hay forma de confirmar que Framer esté sirviendo
  el código más reciente. Si un archivo no tiene header, agregalo arriba
  del todo. Esta regla aplica también a archivos >300KB (copy/paste manual).

- **🜂 REGLA DE ORO — Domo es el HUB ÚNICO de configuración.** En TODOS
  los canvases de Framer el único componente colocado es `<Domo />`. No
  hay canvases con Telemetría/Motor/Sesiones/CalendarioReservas sueltos.
  Consecuencia directa: **cualquier prop nueva que necesite configuración
  por parte de Diego (URLs, API keys, feature flags, webhook endpoints)
  tiene que declararse como property control DE DOMO** y pasarse por la
  cadena `Domo → componente hijo → sub-hijo`. Agregar `addPropertyControls`
  a un componente hijo es arquitectura muerta: el control nunca aparece
  en el panel derecho porque el componente no vive en un Canvas. Antes
  de agregar un `addPropertyControls(X, {...})` a cualquier archivo que
  NO sea `Domo.tsx`, pará y preguntate si no deberías agregarlo a Domo
  y hacer passthrough. Respuesta casi siempre: sí. Excepción válida:
  componentes-herramienta que Diego coloca directamente en un Canvas
  aislado (ej. versiones standalone para debugging). Discovered 2026-04-22
  construyendo el motor de reservas — CalendarioReservas arrancó con sus
  propias props y Diego tuvo que recordarme la regla.
- NUNCA usar `env()` ni `color-mix()` en CSS — rompe Framer.
- Todos los imports al mismo nivel de directorio.
- CSS versionado con IDs (`v23`) para forzar actualizaciones.
- `createPortal(el, document.body)` para modals en móvil.
- **`position: fixed` dentro de `motion.div` con `animate` NO se ancla al viewport.**
  framer-motion aplica transform implícito → CSS spec crea un nuevo containing
  block y captura al fixed como si fuera absolute. Síntoma: un botón `fixed; top: 14`
  aparece donde empieza el padding del motion.div, no en el top del viewport.
  **Solución:** portalar el elemento con `createPortal(..., document.body)`
  para sacarlo del subtree de transforms. Patrón válido para cualquier elemento
  que deba flotar fijo al viewport dentro de un árbol con animaciones.
- **Componentes importados entre archivos del proyecto DEBEN usar `export default`.**
  Framer NO resuelve named exports (`export function X`) cuando otro componente
  local hace `import { X } from "./Y.tsx"` — rompe con TypeScript TS2614 "Module
  has no exported member 'X'". Síntoma: la línea del import se ve roja en Framer
  aunque el IDE local no reporte problema. **Solución:** el componente dueño usa
  `export default`, el consumidor hace `import X from "./Y.tsx"` (sin llaves).
  Válido SOLO para componentes del proyecto — tipos/utilidades pueden seguir
  siendo named exports sin drama. Descubierto 2026-04-20 al romper
  Telemetría/Holograma/Motor importando `NavRevealPin` por nombre.
- **Archivos nuevos en Framer requieren creación manual**. El watcher solo
  actualiza archivos existentes, no puede crearlos. Al agregar un archivo nuevo
  (ej. `PortalInduccionEscaner.tsx`): crear Code File en Framer Assets
  manualmente con el mismo nombre, pegar contenido, publish. Después el watcher
  sincroniza updates normales.

- **🜂 REGLA DE ORO — Hardcode-over-Framer-saved-state.** Cuando se elimina
  un `addPropertyControls` de un campo, Framer deja el VALOR saved del canvas
  intacto en memoria — el prop sigue llegando al componente con el valor
  viejo aunque el control ya no sea visible en la UI. Eso puede reintroducir
  textos, precios o links antiguos que supuestamente habíamos "quitado".
  Cuando pase esto, el fix limpio es **forzar el valor correcto en el
  render ignorando el prop**, usando un discriminador ya existente del
  componente. Ejemplo:

  ```jsx
  // Antes: {formatText(pass.price)}  — lee valor saved en Framer (ej. "$33 USD")
  // Ahora: {isGold ? "1,999 MXN / mes" : "555 MXN"}  — hardcode por discriminador
  ```

  Descubierto 2026-04-23 con `pass.price` y `pass.btnText` de Sesiones
  (valores saved en USD / "Activar Membresía" viejos). Aplicable a
  cualquier campo removido: precios, textos, URLs, flags. Alternativa
  teórica (limpiar el saved state desde la UI de Framer) es engorrosa
  e impredecible — hardcode es más robusto.

- **🜂 REGLA DE ORO — Cada Code File DEBE default-exportar un componente
  React renderable con body JSX.** Framer corre un `componentLoader` al
  procesar cada Code File. Si el `default export` es:
  - Un objeto plano (`export default { hx, GOLD, ... }`) → falla con
    `waitForComponentLoader timeout`. Framer no puede instanciar nada
    para preview/canvas.
  - Una función que retorna `null` o `<></>` (Fragment) → falla igual,
    el component loader no encuentra material renderable.
  - **Lo que sí funciona:** una función que retorna JSX real con un
    elemento concreto, mínimo `<div style={{ display: "none" }} />`.

  **Patrón canónico para Code Files que solo exportan utilities/hooks/
  constants** (ej. `EV_Shared.tsx`, `EV_Icons.tsx`, `EV_Radar.tsx` que
  agrupa varios componentes):

  ```tsx
  function EVHelpers(_props: any) {
      return (
          <div style={{ display: "none" }} aria-hidden="true" />
      )
  }
  EVHelpers.displayName = "EV_Helpers"
  const Helpers = Object.assign(EVHelpers, {
      GOLD,
      hx,
      // ...todos los helpers/constants/hooks
  })
  export default Helpers
  ```

  Los consumidores siguen destructurando como un objeto:
  ```tsx
  import Helpers from "./EV_Helpers.tsx"
  const { GOLD, hx } = Helpers
  ```

  Discovered 2026-04-25 al sincronizar el split del Escáner. EV_Shared,
  EV_Icons (puro utilities) timeoutearon 4 intentos con bumps de
  versión, retry, body fragment, displayName solo. Sólo el body JSX
  con `<div>` concreto los desbloqueó. EV_Radar (objeto con varios
  componentes adjuntos) pasó al primer intento porque ya traía
  componentes "reales" en sus propiedades — Framer encontró suficiente
  material renderable. **Norma:** todos los Code Files default-exportan
  algo con JSX, sin excepción.

---

## Pipeline auto-sync Framer + iPhone live-reload

El watcher en `admin/` detecta cambios en `Code/*.tsx` → sube a Framer API →
publica a `redsolarviva.com`. Diego lo arranca con `npm run dev` en `admin/`.
End-to-end: ~5-10s por edit.

🜂 **ngrok QUEDÓ FUERA (Zak, 2026-08-10).** El iPhone ya no se refresca por
túnel: la app se compila directo y se despliega al teléfono desde la terminal
(ver [[feedback_deploy_iphone_automatico]]). No pedirle a Zak que levante
`ngrok http`, ni mencionarlo en instrucciones. `admin/live-reload.mjs` todavía
lo nombra; es código muerto que se limpia cuando toque.

⚠️ **ESTE PIPELINE ESTÁ EN VÍAS DE APAGARSE.** El sitio sale de Framer hacia
Vercel (`rsv-web/`). Ver § Salida de Framer.

### Ruta observada
El watcher vigila **`/Users/diego/Documents/Red Solar Viva/Code/`** directo —
NO observa worktrees (`.claude/worktrees/…`). Si estás en worktree:
1. Hacé los `Edit` en el worktree (mantiene branch consistente).
2. `cp "<worktree>/<Archivo>.tsx" "/Users/diego/Documents/Red Solar Viva/Code/<Archivo>.tsx"`
3. Disparar `fs.watch` con un edit real en `Code/` (bump de version en el header).
   El `cp` solo no siempre dispara eventos en macOS.

Si trabajás directo en `Code/`, ignorá este bloque.

### Umbral 300KB — archivos grandes

Framer API no procesa confiablemente archivos `.tsx` > ~300KB. Síntoma:
3 retries × 90s = ~4.5 min para fallar igual.

**Doble seguridad:** (1) watcher v2.9 tiene guard, (2) Claude verifica tamaño
antes de copiar a `Code/`. Si supera ~307200 bytes:
- Copiá el archivo a `Code/` igual (Diego lo usa para copy/paste manual).
- NO dispares un edit-trigger extra (bump de version) después del `cp`.
- El watcher v2.9 skipea con `skipped_large` en el receipt. Si no está v2.9
  activa, falla con timeout — el `failed` quedará en el receipt.
- En el reporte final avisá: "ese archivo requiere copy/paste manual desde
  `Code/<Archivo>.tsx`".

**Archivos grandes conocidos (>300KB):** `EscanerVibracional.tsx` (~445KB),
`Codices.tsx` (~360KB), `Sesiones.tsx` (~347KB desde 2026-04-22). Todos los demás
caben bajo 300KB.

**Formato obligatorio de reporte final cuando hay grandes:**

> **Sincronizado automático a Framer:**
> - `MobileNavigation.tsx` (73KB) ✅
>
> **Requiere copy/paste manual en Framer:**
> - `EscanerVibracional.tsx` (445KB) — Assets → Code →
>   EscanerVibracional.tsx → Cmd+A → Cmd+V desde
>   `/Users/diego/Documents/Red Solar Viva/Code/EscanerVibracional.tsx`

Nunca digas "todo subido" cuando hay archivos grandes pendientes.

### Markers para controlar el reload del iPhone

El sync a Framer SIEMPRE ocurre. Los markers solo suprimen el reload al iPhone.

- **`admin/.skip-iphone-reload`** (one-shot): para cambios **desktop-only**.
  `touch` antes del Edit. Se auto-borra después del siguiente sync.
- **`admin/.hold-iphone-reload`** (sticky): para **lotes de múltiples edits**
  con pausas de razonamiento >5s entre sí. `touch` al inicio del lote,
  `rm` al final. El watcher dispara automáticamente UN reload al detectar
  la ausencia del marker.

**Cuándo es desktop-only:** cambios dentro de `if (!isMobile)`, SVGs/animaciones
de desktop-only, tweaks a planetas/orbitas de `Origen.tsx` desktop.
**Cuándo NO es desktop-only:** cualquier cosa dentro de `if (isMobile)`,
dock/navbar/splash/radar (son responsive mobile-first), CSS global.
En duda → no uses marker, dejá que el iPhone refresque.

### Receipt post-Edit (verificación obligatoria)

Después de un Edit a `.tsx` de `Code/` (o al final de un batch con hold marker),
verificar `admin/.last-sync-status.json` antes de reportar éxito:

```bash
cd "/Users/diego/Documents/Red Solar Viva/admin"
REF_MTIME=$(stat -f %m .last-sync-status.json 2>/dev/null || echo 0)
for i in $(seq 1 60); do
    sleep 3
    NEW_MTIME=$(stat -f %m .last-sync-status.json 2>/dev/null || echo 0)
    [[ $NEW_MTIME -gt $REF_MTIME ]] && break
done
cat .last-sync-status.json
```

**Acción según status:**
- `"success"` → reportar normalmente.
- `"failed"` → NO decir "todo listo". Mostrar `error` + `recommendation` +
  sugerir copy/paste manual.
- `"skipped"` → no había cambios reales. Reportar si es inesperado.
- `"skipped_large"` → archivo > 300KB. Reportar fallback manual.

Saltear verificación solo si el Edit fue a archivos FUERA de `Code/*.tsx`
(admin/, CLAUDE.md, supabase/) o si hay más Edits pendientes en el batch.

### 🜂 REGLA DE ORO — Respaldo automático: todo build/deploy cierra con commit + push (Zak, 2026-08-13)

**Cada vez que se reporte "listo el build" o se despliegue algo, CLAUDE
committea y pushea el repo tocado en ese mismo momento, sin pedir permiso y
sin anunciarlo como pendiente.** Los cinco repos son PRIVADOS de GitHub
(cuenta ZakHaarSolar): `escaner-app` · `Code` (rsv-code) · `admin`
(rsv-admin) · `rsv-web` · `escaner-landing`. Motivo, textual de Zak: *"como
no dijimos esa instrucción, se acumuló eso y yo ni sabía; la idea es que sea
automático"* — se habían juntado 68 commits sin subir en Code y 10 en el
Escáner sin que nadie lo notara. Mensaje de commit: una línea humana con lo
de la sala. Sigue PROHIBIDO `git reset --hard` y `git push --force`.

El watcher de Framer (si corre) auto-committea `Code/`; si no corre, el
commit lo hace Claude igual. El push ya NO es manual de Diego: es parte del
cierre de cada build.

### Si el pipeline falla

- Watcher dice "setCodeFileContent timed out" → conexión WebSocket murió.
  Próximo sync arranca fresca. No hacer nada.
- Diego dice "no se actualizó" → watcher no estaba corriendo. Pedile que
  confirme `npm run dev` activo.
- **Nunca abras Framer ni hables de pegar código manual** — salvo que el
  archivo sea > 300KB o el receipt diga `failed`.

### Cómo pedirle logs a Diego

La consola está saturada de ruido. NO pidas la consola completa.
Pasale este snippet para que lo pegue ANTES de reproducir el bug:

```js
(() => {
  const captured = [];
  const pattern = /\[(EV|sb(Post|Get|Patch|Rpc))\]/;
  ['log','error','warn','info'].forEach(m => {
    const orig = console[m].bind(console);
    console[m] = (...a) => {
      try {
        const line = a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ');
        if (pattern.test(line)) captured.push(`[${m}] ${line}`);
      } catch {}
      orig(...a);
    };
  });
  window.rsvDump = () => {
    const out = captured.join('\n');
    console.log('=== RSV LOGS ===\n' + out + '\n=== END ===');
    try { copy(out); } catch {}
    return `${captured.length} líneas ${typeof copy === 'function' ? 'copiadas al clipboard' : 'capturadas'}`;
  };
  console.log('✅ RSV capture activo. Reproducí el bug y ejecutá: rsvDump()');
})();
```

Ajustá el regex según query (scans/cycle/profile, Clerk, errores de red, etc.).
**Regla:** snippet ready-to-paste + acción concreta que devuelve el resultado.
Nada de "mirá la consola y pegame lo que veas".

---

## Motor de Reservas Nativo + Zoom automático

Sistema end-to-end que reemplaza Calendly para las sesiones 1:1 (Cámara de
Resonancia) y el Pase de Exploración grupal (Cámara Solar). Flujo completo
para un tripulante reservando 1:1:

1. **UI** (`Sesiones.tsx` → `CalendarioReservas.tsx` → `useSolarBooking.tsx`):
   el tripulante elige duración (30/45/60 min), día y horario. Cada plan
   declara su `slotType` explícito (`individual_30|45|60`) — NO se deriva
   de la URL de Calendly. `urlToSlotType` queda solo como fallback.
2. **Hold** (`procesar-ignicion-pago` edge function): crea row `pendiente`
   en `reservas` (hold 15 min) + genera Stripe Checkout Session en MXN.
3. **Pago** (Stripe Checkout): cliente paga. Stripe dispara webhook
   `checkout.session.completed`.
4. **Confirmación + Zoom** (`stripe-webhook` edge function v2.2):
   - RPC `confirm_booking_by_session` → status `confirmada`.
   - Si slot_type es `individual_*`: `createZoomMeetingSafe()` llama a la
     Zoom API (S2S OAuth, app "Red Solar Viva 1-1") con `start_time` en
     UTC estricto (sufijo Z) + `timezone: "UTC"` para evitar ambigüedad
     (ver patrón "Timezone UTC en APIs externas"). Guarda join_url +
     metadata en `reservas.zoom_*`. Si Zoom falla → `ZOOM_FALLBACK_JOIN_URL`
     con `zoom_used_fallback=true` y `zoom_error=<mensaje>`.
5. **Email** (`Pipedream · PaseExploracion.js` v4): workflow dual-trigger
   (Calendly legacy + HTTP del stripe-webhook). Recibe payload con
   `zoom_join_url`. Para 1:1 usa ese link específico; para grupal usa
   `ZOOM_GRUPAL_LINK`. Templates distintos: `htmlBody` (grupal, con
   "Apertura de Compuertas") vs `htmlBody1to1` (con duración explícita).
6. **Visibilidad** (`TelemetriaDelNucleo.tsx` v10.3): fila "◈ Transmisión
   1:1" consume RPC `get_1to1_revenue_summary` (SECURITY DEFINER, admin
   gate vía `profiles.is_admin`) — bypassa RLS de `reservas` para mostrar
   ingresos del mes + desglose 30/45/60. Paleta PLATINUM #E8EEF7.

### Archivos clave
- UI: `Code/Sesiones.tsx`, `Code/CalendarioReservas.tsx`,
  `Code/useSolarBooking.tsx`, `Code/TelemetriaDelNucleo.tsx`.
- Backend: `admin/supabase/functions/{procesar-ignicion-pago,stripe-webhook}/`,
  `admin/pipedream/PaseExploracion.js`.
- Schema: `admin/supabase/migrations/20260422_booking_engine.sql` (base),
  `20260423_zoom_columns_on_reservas.sql` (7 columnas zoom_*),
  `20260423_get_1to1_revenue_rpc.sql` (RPC agregado admin-only).

### Tablas clave
- `asientos_reservados` — slots disponibles. `slot_type` enum, capacity,
  contadores. RLS activo sin policies → acceso solo vía RPCs.
- `reservas` — bookings. Status enum (`pendiente/confirmada/cancelada/
  expirada`), refs de Stripe, columnas `zoom_*` (join_url, meeting_id,
  password, used_fallback, error, created_at, meta). RLS idem.
- `exploration_passes` — mirror legacy SOLO grupales (usado por
  `Ignicion.js` para recordatorios 60min pre-sesión).

### Secrets requeridos (Supabase)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — pagos.
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` — S2S OAuth.
- `ZOOM_FALLBACK_JOIN_URL` — sala recurrente "Red Solar Viva 1-1" de
  Zak'Haar (martes 6pm, "Allow participants to join anytime" activo).
- `PIPEDREAM_BOOKING_WEBHOOK_URL` — dispara correo desde stripe-webhook.

### Flags de testing (env vars)
- `BOOKING_TEST_MODE=true` — cobra 10 MXN a TODOS los slot_types.
- `BOOKING_1TO1_TEST_MODE=true` — cobra 10 MXN SOLO a `individual_*`
  (grupales siguen 555). Se activa/desactiva vía
  `supabase secrets set|unset <flag>` + redeploy de `procesar-ignicion-pago`.

Para liberar slots después de pruebas 1:1, usar el patrón SQL documentado
en 2026-04-23: UPDATE reservas → status `cancelada` filtrado por
`slot_type IN (individual_*)` + `amount_mxn_cents <= 1000`. Los triggers
recalculan contadores automáticamente.

### Reglas de oro del flujo
- **Zoom solo se crea para 1:1**, nunca para grupales (Cámara Solar usa
  `ZOOM_GRUPAL_LINK` recurrente).
- **Test mode del 1:1 deja residuos**: las reuniones de Zoom creadas
  durante QA hay que borrarlas manualmente desde el dashboard de Zoom.
- **Price display en UI** está HARDCODED al render (ignora `pass.price`
  saved en Framer — ver patrón "hardcode-over-Framer-saved").

---

## 🜂 Salida de Framer → Vercel (decidida por Zak 2026-08-10)

**Zak dio luz verde.** El sitio se va a `rsv-web/` (Vite + Vercel) y Framer se
cancela. Motivo: nadie abre el lienzo, y la suscripción compra sobre todo
límites (techo de 300 KB por archivo, archivos nuevos a mano, cero chequeo de
tipos, un watcher propio para esquivarlo todo).

**Hecho y verificado (2026-08-10):**
- `rsv-web/` existe y **el sitio COMPILA fuera de Framer**: bundle de 2.87 MB
  (735 KB comprimido) en 222 ms. pnpm + Vite 8 + React 19.
- 🜂 **CORRECCIÓN GRANDE (2026-08-10): SÍ había configuración, y son 77.** Una
  medición previa dijo que las instancias de `<Domo />` tenían CERO valores
  guardados y sobre eso se armó el plan. **Estaba mal.** Se midió mientras
  `Domo.tsx` estaba corrupto en Framer, y sin el componente correcto la API no
  puede resolver el esquema de property controls: devuelve la lista vacía. No
  era que no hubiera valores, era que no se podían leer. Al restaurar el
  archivo aparecieron los 77. Lo delató la PANTALLA, no la API: Zak comparó y
  vio el logo ausente, las portadas de Fragmentos en blanco y textos distintos.
  · **Lección:** un "no hay nada" leído de una API se confirma por una segunda
  vía antes de construir encima.
  · Cosechadas con `admin/cosechar-domo.mjs` → `admin/domo-perillas.json`, y
  convertidas a `rsv-web/src/domo-perillas.ts` con
  `rsv-web/generar-perillas.mjs`. De las 77, la mayoría son iguales en las 26
  páginas: se guarda una BASE + diferencias por ruta, distinguiendo `set`
  (cambia) de `unset` (esa ruta NO tiene la perilla), porque `undefined`
  desaparece al serializar y varias rutas difieren justamente por ausencia.
  · **9 archivos del CDN de Framer bajados** a `rsv-web/public/framer/` (6.3 MB).
  🜂 **Fueron 38 (304 MB) hasta que Zak preguntó "¿de qué trailers hablas? esos
  no están en red solar viva".** Tenía razón: 29 de esos archivos, 294 MB, casi
  todos trailers `.mov`, colgaban de la perilla `codicesBooks`, que es DATO
  MUERTO desde Domo v4.37 — el catálogo de Códices vive en Supabase
  (`catalog_books`) y `/codices` pasa `booksList={[]}` siempre; `PageContent`
  recibe la perilla y no la usa en ninguna línea. `generar-perillas.mjs` la
  poda con la lista `PERILLAS_MUERTAS`. **Lección: una perilla guardada en el
  lienzo no prueba que el sitio la use; hay que seguirla hasta su consumidor.**
- `vite.config.ts` compila **`../Code` directo**, sin copiar: una sola fuente
  de verdad mientras dure la transición.
- `src/framer-shim.ts` cubre lo único que se usa del paquete `framer`
  (`addPropertyControls` + `ControlType`, medido en los 19 archivos).
- `AuthOverrides.tsx` v2.0: era el ÚNICO acoplamiento de runtime (importaba
  `https://framer.com/m/framer/store.js`). Reescrito con tienda local; vive en
  `Code/` y funciona en los dos lados.
- **RENDERIZA, verificado en pantalla** (2026-08-10): la portada sirve el Origen
  real (Templo Solar 5D, Zak'Haar, Aqua'Riia) y los 100 archivos de `Code/`
  cargan 200. Únicos errores: dos 400 de `clerk.redsolarviva.com`, que rechaza
  `localhost` como origen; se confirman al desplegar en el dominio real.
- **LAS 3 CAPAS DE LEGADO DE CÓDIGO YA VIAJARON** (Zak las quiere todas: se
  entra pegando la dirección, sin botones que lleven ahí). Viven en
  `rsv-web/src/legacy/` y las tres se verificaron en pantalla:
  · `/membrana` → `Membrana.tsx` (MembranaLab) · 9 imágenes y el video cargando
  · `/upgrades` → `Upgrades.tsx` (HolographicHumanUpgrades)
  · `/lenguajedegaia` → `LenguajeDeGaia.tsx` (TimbreSpaceGraphVisualizer)
  Estas tres SÍ tenían perillas guardadas (22, 11 y 5): viven en
  `src/legacy/perillas.ts`. Sus 11 imágenes y el video se bajaron del CDN de
  Framer a `public/legado/` (60 MB, el mp4 pesa 45), así que cancelar la cuenta
  no las mata.
  🜂 **Gotcha:** el lienzo guarda los controles de Imagen como OBJETO
  `{id,url,thumbnailUrl}`, pero Framer se los entrega al componente ya
  resueltos como CADENA. Pasando el objeto crudo, React lo vuelve
  `[object Object]` y las imágenes nacen rotas. `perillas.ts` los aplana.

- **`/zuur’naal` NO VIAJA. Decisión de Zak (2026-08-10): se abandona.** Estaba
  hecha con el diseñador de Framer (68 marcos, 91 textos, cero código) y sus
  piezas viven fuera del canvas, así que no había archivo que copiar. Zak se
  queda con capturas de pantalla mientras le duran los 15 días de Framer. No
  volver a proponerla.

- **YA ESTÁ EN VERCEL, verificado en pantalla (2026-08-10):**
  `https://rsv-preview-zak.vercel.app` (alias fijo; la dirección larga que
  Vercel generó fue `rsv-duyiw1ume-zakhaarsolars-projects.vercel.app`).
  Proyecto nuevo `rsv-web` en la cuenta de Zak, aislado — no toca
  `escaner-app`, `escaner-landing` ni `domo-client`, y `redsolarviva.com` sigue
  apuntado a Framer (figura "Third Party" en `vercel domains ls`).
  · Portada = Origen real, idéntica a la vista publicada (sol, órbitas de
  Fragmentos/Simuladores, Zak'Haar, Aqua'Riia). Único error de consola: un 400
  de Clerk (rechaza el dominio de Vercel como origen no autorizado — se
  resuelve solo al publicar en el dominio real, mismo patrón que en
  `localhost`).
  · Las 3 capas de legado confirmadas ahí también: `/membrana` (9/9 imágenes,
  video listo), `/upgrades`, `/lenguajedegaia`.
  · 🜂 **Se apagó `ssoProtection` del proyecto** (por API, `PATCH
  /v9/projects/{id}` con `ssoProtection: null`) para poder verificarlo sin
  sesión y para que el link se pueda compartir directo. Viene ENCENDIDA por
  default en cuentas de equipo para cualquier deployment sin dominio propio.
  Si se crean más proyectos de prueba en Vercel, este paso hay que repetirlo o
  el link pide login.
  · Build: local con `vercel build` (Vite SÍ resuelve `../Code` porque es
  disco local) + `vercel deploy --prebuilt` (sube el resultado ya armado, sin
  que el servidor de Vercel tenga que ver `Code/`). Mismo patrón que ya usa el
  resto del ecosistema.
  · Gotcha de instalación: `pnpm-workspace.yaml` con `onlyBuiltDependencies`
  NO bastó para autorizar el script de `@clerk/shared`; hizo falta correr
  `pnpm approve-builds --all` una vez, que sí escribió el `allowBuilds: true`
  correcto en el archivo.

### 🜂 Lo que Framer ponía y el código daba por sentado

Tres cosas del entorno de Framer que NO están en `Code/` y que hubo que
reponer a mano en `rsv-web/index.html`. Todas se descubrieron comparando
medidas contra el sitio vivo, no leyendo código:

1. **`box-sizing: border-box` global.** Sin él, el navegador usa `content-box`
   y toda caja con `width:100%` más padding se vuelve más ancha que su padre:
   medido, un contenedor de 1320 px dentro de uno de 1280, que corría el
   contenido 20 px a la derecha y descentraba la portada entera. Una línea que
   arregla una familia completa de diferencias (también altos inflados por
   padding, como el pill del menú).
2. **`body { font-family: sans-serif }`.** Casi todo el sitio pide Inter por su
   cuenta, pero un puñado de textos no declara fuente y heredaba el `Times` del
   navegador: por eso salían en serif el subtítulo de Simuladores y los textos
   de Fragmentos. (Framer carga además Sora, pero NINGÚN elemento renderizado
   la usa: no se trae.)
3. **Sin `React.StrictMode`.** Framer no envuelve el sitio, y este código creció
   dentro de Framer. StrictMode monta dos veces y re-ejecuta efectos, y acá hay
   efectos que reescriben la dirección al montar.

⚠️ **Trampa de verificación propia:** el panel de vista reporta `innerWidth 0`
cuando está oculto, y con alto chico `useIsMobile` da TRUE → Domo monta el shell
del Escáner y `/simuladores` "salta" a `/escaner/holoteca/simuladores`. NO es un
bug del sitio: con viewport real (1440×900) se queda donde debe. Antes de
reportar un salto de ruta, fijar el tamaño con `resize_window` y confirmar
`innerWidth`.

### 🔀 El corte de dominio (Zak dio luz verde 2026-08-11 · II)

**Hecho de mi lado:**
- `redsolarviva.com` y `www.redsolarviva.com` **atados al proyecto `rsv-web`**.
  Agregarlos NO cambia nada solo: el sitio sigue sirviéndose de Framer hasta
  que los registros de DNS apunten a Vercel.
- 🜂 **La producción estaba en el build EQUIVOCADO.** `vercel deploy --prebuilt`
  sin `--prod` deja el despliegue como Preview: los cinco arreglos posteriores
  vivían en Preview y **producción seguía siendo el primer build**, el de antes
  de las 77 perillas, el `box-sizing` y la tipografía. Si el DNS se movía así,
  el dominio real habría servido la versión rota. Corregido con
  `vercel pull --environment=production` + `vercel build --prod` +
  `vercel deploy --prebuilt --prod`, y verificado en la URL estable de
  producción (`border-box`, `sans-serif`, 3/3 imágenes, subtítulo en cx 640 /
  top 174, los mismos números que el sitio vivo).
  **Norma: antes de mover un dominio, confirmar que la PRODUCCIÓN del proyecto
  es el build verificado, no el último que uno recuerda haber subido.**

### ✅ CORTADO — `redsolarviva.com` YA CORRE EN VERCEL (2026-08-11 · II)

Verificado renderizando en el dominio real: `box-sizing: border-box`,
`font-family: sans-serif`, 3/3 imágenes, subtítulo en cx 640 / top 174 (los
mismos números que servía Framer) y **CERO recursos del CDN de Framer**.
`/motor-intervencion` levanta su portón ("Necesitas iniciar sesión") y Clerk
habla con `clerk.redsolarviva.com`: los paneles entran normal desde acá, cosa
que en la URL de prueba de Vercel era imposible.

🜂 **Dos trampas del corte, para la próxima vez:**
1. **Dos registros A = sitio roto a medias.** Mientras convivieron
   `76.76.21.21` y la IP de Framer, el tráfico se repartió al azar y Vercel NO
   emitió el certificado. Tiene que quedar UNO SOLO.
2. **El certificado puede quedarse en cola.** Con el DNS ya limpio, HTTP daba
   200 y HTTPS fallaba en el saludo TLS (`SSL_ERROR_SYSCALL`) durante 10+
   minutos. Sin CAA que lo bloqueara. Se destrabó a mano con
   `vercel certs issue redsolarviva.com` (8 s). **Si HTTP sirve y HTTPS no, es
   el certificado: pedilo explícito en vez de esperar.**

### ✅ CERRADO DEL TODO — `www` también (2026-08-11 · III)

Zak movió el `CNAME www → cname.vercel-dns.com` y la raíz quedó con UNA sola
A (`76.76.21.21`). Los dos nombres sirven `rsv-web` y **no queda un solo hilo
con Framer**: cero recursos de su CDN, Clerk hablando con
`clerk.redsolarviva.com`, y `/membrana` (9/9 imágenes + video), `/upgrades` y
`/lenguajedegaia` abriendo. Framer se puede cancelar.

🜂 **Tercera trampa del corte, que se cobró `www` igual que a la raíz:** el
certificado que Vercel tenía emitido **no incluía el nombre nuevo**. HTTP
respondía `308` y HTTPS moría en el saludo con `SSL: no alternative
certificate subject name matches target host name`, que es un mensaje
distinto del `SSL_ERROR_SYSCALL` de la raíz pero la misma enfermedad. Se
destrabó pidiéndolo con LOS DOS nombres juntos:
`vercel certs issue www.redsolarviva.com redsolarviva.com` (10 s). **Norma:
agregar un dominio al proyecto NO reemite el certificado; cada nombre nuevo
se pide explícito.**

⚠️ `www` sirve el sitio directo, no redirige al apex. Si algún día importa
para buscadores, es un ajuste de un clic en Vercel.

**Herramientas nuevas en `admin/`:** `cosechar-perillas.mjs` y
`bajar-code-files.mjs` (baja los 149 Code Files y los compara con `Code/`;
deja copia en `admin/desde-framer/`).

### 🔴 `Domo.tsx` SE CORROMPIÓ EN FRAMER, TUMBÓ EL SITIO Y SE RESTAURÓ (2026-08-10)

**Qué pasó.** El archivo `Domo.tsx` de Framer tenía adentro el código de
`MotorDeIntervencion` (319.295 caracteres, cabecera `MotorDeIntervencion.tsx
v4.6 — CORREOS`, sin `export default Domo` ni `addPropertyControls(Domo`).
Verificado en proceso limpio pidiendo ese único archivo por la API, así que no
era un error de lectura. Al republicar, **las 26 páginas del sitio pasaron a
renderizar el portón de administrador**: `redsolarviva.com` sirvió "Verificando
acceso…" sobre negro y su portada cayó de 496 KB a 65 KB. Zak lo cazó con una
captura.

**Cómo se arregló** (4 minutos, y es la receta si vuelve a pasar):
1. Verificar que la copia del DISCO esté sana: cabecera correcta,
   `export default function Domo`, `addPropertyControls(Domo`, y que compile.
2. Bump de versión en el header de `Code/Domo.tsx` → el watcher empuja la copia
   buena y publica.
3. Confirmar por la API que el contenido de Framer cambió (un `success` del
   watcher NO prueba el contenido).
4. Confirmar **renderizando** el sitio, no leyendo el HTML.

🜂 **Dos trampas de medición que aparecieron acá:**
- El HTML crudo de `redsolarviva.com` NO trae el texto de la página: Domo pinta
  del lado del cliente. Buscar "Templo Solar" con `curl` da 0 aunque el sitio
  esté perfecto. **Se verifica renderizando.**
- Al verificar la restauración, un patrón como `/MotorDeIntervencion\.tsx v4\.6/`
  da positivo contra la NOTA que uno acaba de escribir en la cabecera. Elegir
  marcadores que no puedan coincidir con el propio comentario.

**Probable causa:** dos Salas de Comando sincronizando en paralelo. Señal de
alarma si reaparece: la portada pierde "Templo Solar", "Zak'Haar" y "Aqua'Riia"
y aparece "Verificando acceso…".

**Contexto que sigue vivo:** hay 7 archivos que difieren entre disco y Framer y
**67 Code Files que solo existen en Framer** (casi todos experimentos viejos:
Test1, HomeGemini, Librostest…). Copia completa en `admin/desde-framer/`.
