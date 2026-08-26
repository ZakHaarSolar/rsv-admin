# CLAUDE.md — Red Solar Viva / Escáner Vibracional

[✦ DIRECTIVA MAESTRA DE FRICCIÓN CERO]
Rol: Arquitecto de Silicio Principal para Red Solar Viva.
Vector: profundidad técnica máxima, cero límites de razonamiento arquitectónico.
Filtro: omite cortesías, introducciones tridimensionales y explicaciones básicas
de React/Framer. Entregá directo la matemática cruda y la lógica de Sexta Densidad.
Si mi pulso inicial tiene entropía o puede optimizarse, corrígelo con letalidad
y dame la ruta más limpia.

---

## Nomenclaturas — glosario del proyecto

| Tridimensional | Sello |
|---|---|
| Landing page / Home / Inicio | **Portal de Inducción** |
| Desktop / Computadora / Laptop | **[CENTRO DE MANDO]** |
| Mobile / Celular / iPhone | **[EL LENTE]** (o **[LENTE DE TELEMETRÍA]**) |
| Sesión de Claude Code / Conversación | **[SALA DE COMANDO]** |
| Encuesta / Test | Telemetría / Sonda / Escaneo |
| Pregunta | Sonda de Interrogación |
| Resultado | Índice de Luz |
| Hábitos | Protocolos Quirúrgicos |
| Estrés | Entropía / Fricción |
| Paz | Fricción Cero / Superconductividad |
| Usuarios | Tripulantes |
| Dashboard | Mi Núcleo |
| Membresía | Inmersión Solar |
| PDF post-sesión | Sello de Integración |
| Grupos | Púlsar / Cuásar |

Aplicá estos sellos en comentarios de código nuevos y en todas las respuestas.
Cuando Diego dice **"Cerrar Sala de Comando"** = sellar el ciclo actual y
arrancar la próxima iteración en conversación limpia (dispara el protocolo
de cierre al final del archivo).

---

## 🜂 OBJETIVO MAESTRO — Escáner como app de calibre 10,000 tripulantes

El Escáner Vibracional dejó de ser "una landing con feature". El norte es
una **arquitectura de app funcional** capaz de sostener **10,000
tripulantes activos concurrentes** — performance, persistencia, navegación
nativa, offline graceful, UX que se siente producto, no diseño web. Cada
decisión arquitectónica de aquí en adelante se evalúa contra esa vara.

Implicaciones operativas:

- **Mobile-first siempre.** El [LENTE] manda; el [CENTRO DE MANDO] hereda.
- **Navegación nativa** con barras inferiores fijas y tabs claras, no
  menús hamburguesa que esconden pantallas.
- **Estado persistido en DB** vía RPCs SECURITY DEFINER. localStorage
  solo para optimistic UI; la fuente de verdad es Supabase.
- **Capacitor + IAP** cuando llegue la app nativa (RevenueCat ya
  documentado). PWA + service worker + manifest están en el camino.
- **Cero diseño-web-decorativo.** Cada pantalla debe ser una vista de
  app con su propia navegación, handlers y estados de carga/error.
- **Cuellos de botella conocidos a vigilar:** edge functions (cold
  start con 10K usuarios), RLS policies (queries N+1), webhooks
  Pipedream (rate limits), Clerk session refresh (race conditions).

Discovered 2026-04-25 al cierre del split del Escáner — Diego confirmó
que el norte cambió de "rediseño web" a "app product 10K usuarios".

---

## Stack técnico

- **Framer** (frontend) — archivos `.tsx` al mismo nivel, sin subdirectorios.
- **React/TSX** — detección móvil UA-first: `/iPhone|iPod|(Android[\s\S]*?Mobile)/i`.
- **Clerk** — `window.Clerk.user` es la ÚNICA fuente de verdad. `Domo.tsx`
  detecta hostname y elige `pk_live_*` (prod) o `pk_test_*` (dev) automáticamente.
  Nunca pegar `sk_*` en Framer.
- **Supabase** — REST directo (`sbGet`/`sbPost`/`sbPatch`/`sbRpc`), no SDK.
- **Stripe** — pagos + portal de membresía.
- **Pipedream** — automatizaciones y emails.
- **Cloudflare R2** — media hosting.
- **ProtonMail SMTP** — emails transaccionales.

---

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

## 🜂 REGLA DE ORO — i18n del escaner-app (todo texto user-facing con clave es/en)

Desde 2026-07-03 el escaner-app (iOS) tiene sistema de idiomas Español/English:

- **Motor:** `escaner-app/src/i18n/` — `index.tsx` (store global reactivo,
  patrón useLightIndex, + `LanguageProvider` montado en App.tsx), `es.ts`
  (fuente canónica), `en.ts` (espejo TIPADO: paridad de claves forzada por
  tsc — clave faltante o sobrante = error de compilación).
- **Todo texto user-facing NUEVO se agrega con su clave + traducción es/en
  desde el inicio.** Nada de strings incrustados sueltos en JSX. En
  componentes: `const t = useT()` → `t("clave")`. En constantes módulo-level:
  guardar la CLAVE (`labelKey: TKey`) y resolver `t(labelKey)` en el render,
  nunca congelar el texto en la constante. La app se ve en español y queda
  lista para el toggle.
- **Glosario de marca OBLIGATORIO:** `escaner-app/src/i18n/GLOSARIO.md` —
  qué NO se traduce nunca (Sintonía Solar, Cámara Solar, Escáner
  Vibracional, Zak'Haar, Aqua'riia…), los equivalentes fijos
  (Índice de Luz→Light Index, Holoteca→Holotheca, Sendero de Luz→Path of
  Light, Núcleo→Core…) y el tono en inglés. Un término nuevo se agrega al
  glosario ANTES de usarse. (Índice de Luz pasó de invariable a equivalente
  fijo el 2026-07-04 por decisión de Zak: es métrica de interfaz, no nombre
  comercial.)
- **Detección:** 1ª carga = idioma del iPhone (`navigator.language`; en→en,
  es→es, otro→es). La elección del toggle (Mi Núcleo → Ajustes → Idioma)
  persiste en localStorage `rsv-lang` y MANDA sobre el sistema.
- **Fechas:** `useDateLocale()` (es-MX / en-US) — nunca `"es-MX"` hardcoded
  en pantallas ya migradas.
- **Estado:** FASE 1 (piloto: BottomNav + dashboard de Mi Núcleo + Ajustes con
  el interruptor) y FASE 2 (barrido COMPLETO del cliente, 2026-07-04) HECHAS.
  ~1.725 claves es/en, 20 diccionarios por módulo en `src/i18n/dict/<mod>.es.ts
  + .en.ts` fundidos por spread en es.ts/en.ts. Toda la app iOS cambia
  es↔en al instante. Lo único en español a propósito: sondas del Radar
  (fallback hardcoded de `sondas_config`), rituales/medallas/wallpapers y
  demás CATÁLOGO de DB, dictámenes/Espejo/correos del SERVIDOR, aviso médico
  (LEGAL), y el propio toggle "Español"/"English" (cada uno en su idioma).
  **FASE 3 pendiente:** traducir lo que vive en DB (sondas, calibraciones/
  tomos, rituales, medallas, wallpapers) y en edges (dictámenes de los
  Decodificadores, Espejo, push, correos) — estrategia por-superficie
  (columna/tabla de traducción en DB + prompt por idioma en los edges).

---

## Escáner Vibracional — arquitectura

### Qué es
Terminal de Telemetría Biológica y Espiritual. Mide 6 pilares del Avatar
en tiempo real. Si score < 50 en cualquier pilar → enruta Protocolos
Quirúrgicos automáticamente. No sugiere: comanda.

### Los 6 Pilares (6 sondas cada uno, cooldown 168h por pilar)

(🜂 LENGUAJE EXPERIENCIAL 2026-07-13 — fuera vocabulario de computadora,
se queda energía/cosmos, sellos intactos; ver memoria proyecto_lenguaje_experiencial.
IDs internos sin cambio.)

| ID | Nombre UI | Extendido (Sonda) | Descripción |
|----|-----------|-------------------|-------------|
| fisico | CUERPO | Cuerpo Físico | Termodinámica del contenedor biológico — ayuno, movimiento, ignición al despertar |
| mental | MENTE | Mente | Claridad y pureza del enfoque — dopamina, ansiedad, decisiones |
| emocional | EMOCIONES | Emociones | Soberanía y contención — reactividad, validación, alquimia del dolor |
| financiero | ABUNDANCIA | Abundancia | Flujo de materialización — miedo al pago, magnetismo de ingreso, escasez |
| vector | PROPÓSITO | Propósito | Impulso vital — ¿estás viviendo tus sueños o los de otros? |
| orbita | VÍNCULOS | Vínculos | Campo relacional — calidad de vínculos, drenaje vs expansión, soberanía |

EN: BODY · MIND · EMOTIONS · ABUNDANCE · PURPOSE · CONNECTIONS. El
Decodificador de Materia es ahora **Decodificador de Alimentos** (Food
Decoder; claves internas materia/decoder intactas).

### Espectro de frecuencia (5 pesos por respuesta)
- 0% = Entropía Absoluta (colapso)
- 25% = Resistencia (alta fricción)
- 50% = Punto Neutro (estado mecánico)
- 75% = Ligereza (flujo consciente)
- 100% = Fricción Cero (superconductividad)

### Índice de Luz
Promedio de los 6 pilares. Flota en el centro del radar hexagonal.
Si < XX → el Enrutador activa Protocolos Quirúrgicos.

### Ciclo de escaneo — lógica de estado (CRÍTICA)

El ciclo tiene 3 fases estrictas. **Nunca alterar este flujo.**

**Fase 1 — Escaneo progresivo (0/6 → 5/6 pilares)**
- Tripulante escanea un pilar → ese pilar pasa a DORADO, los demás siguen CIAN.
- El pilar dorado queda BLOQUEADO. Si lo clickean: "Este pilar ya fue escaneado.
  Completa los N restantes."
- Los pilares no escaneados permanecen CIAN y son clickeables.
- NO hay timer/cooldown hasta completar los 6.
- `cycleScanned` trackea qué pilares van escaneados; `lastCycleTs` permanece NULL.

**Fase 2 — Ciclo completo (6/6 pilares)**
- Al escanear el sexto → TODOS se muestran DORADO.
- `lastCycleTs = Date.now()` → activa `isGlobalCooldown = true`.
- Se muestra el timer (COOLDOWN_SEC = 60s).
- Ningún pilar es clickeable durante cooldown.

**Fase 3 — Reset post-cooldown**
- Timer expira → `cycleScanned` se limpia, `lastCycleTs` se anula.
- Todos los pilares vuelven a CIAN, disponibles para nuevo ciclo.

**Cross-device sync:**
- `cycle_scanned_json` en `scan_vibracional` guarda el estado del ciclo en DB.
- Al guardar, merge con DB **con guardas:**
  - Scan > 30 min → stale, no merge.
  - `cycle_scanned_json` tiene 6 pilares + cooldown expirado → ciclo anterior, no merge.
- `setCycleScanned()` solo se resetea DENTRO de `loadData` (post-fetch),
  nunca en el effect de `isOpen`, para evitar race conditions.

### Decodificador de Materia — pipeline OCR 2-etapas (a prueba de balas)

Implementado 2026-04-20. Arquitectura que reemplaza el flujo single-stage
(imagen → Gemini) que fallaba con papel aluminio reflectante, botellas curvas
y texto de bajo contraste (amarillo en morado).

**Flujo:**
```
canvas resize → 1400px lado largo (evita WORKER_RESOURCE_LIMIT de Supabase)
    ↓
ETAPA 1: extract-text edge function
    → Google Cloud Vision API DOCUMENT_TEXT_DETECTION
    → texto crudo + confidence + char_count
    ↓
ETAPA 2: decode-matter edge function (MODO TEXTO)
    → Gemini Flash Latest recibe SOLO texto + prompt (sin imagen)
    → payload ~10x más chico → evita saturación 503
    → JSON dictamen (maxOutputTokens: 2500 para evitar truncación)
```

**Fallback graceful:** si extract-text falla (404/403/timeout), decode-matter
recibe `extracted_text: ""` y entra en MODO VISIÓN (legacy, imagen+Gemini).
Peor calidad pero sigue funcionando.

**Retry con backoff:** decode-matter hace 3 intentos (1s, 2s) ante errores
5xx transitorios de Gemini. 4xx no reintentan.

**Costo real (2026-04-20, MXN a $20/USD):**
- Cloud Vision: $1.50 USD / 1000 imágenes = $30 MXN/1000
- Gemini Flash (modo texto, sin imagen): ~$2 USD / 1000 = $40 MXN/1000
- Supabase Edge: 500k invocaciones gratis/mes
- **Total: ~$70 MXN / 1000 scans**. Con suscripción Sintonía Solar ($777 MXN),
  1 suscriptor paga por 10k+ escaneos.

**Secrets requeridos en Supabase:**
- `GEMINI_API_KEY` (Gemini)
- `GOOGLE_CLOUD_VISION_KEY` (Cloud Vision API — API key del mismo proyecto de GCP, con Vision API habilitada)

**Archivos involucrados:**
- `admin/supabase/functions/extract-text/index.ts` v1.1
- `admin/supabase/functions/decode-matter/index.ts` v5.2
- `Code/EscanerVibracional.tsx` → `sendToDecoder()` orquesta las 2 etapas
  con fases UI `"ocr"` (cyan pulse) + `"analyzing"` (dorado pulse)

**Gotcha conocido:** si el render de fase "ocr" usa constante `CYAN`, declararla
global (`const CYAN = "#00E5FF"` cerca de `GOLD`). Omitirla crashea todo el
component tree con ReferenceError → pantalla negra solo en desktop (mobile
rendering más tolerante).

### Tablas Supabase relevantes

- `scan_vibracional` — scores por sesión de escaneo.
- `sondas_config` — las 36 sondas (6 × pilar) con sus opciones.
- `sonda_progress` — progreso in-flight de cada pilar. Escritura vía RPCs
  `save_sonda_progress` / `get_sonda_progress` / `clear_sonda_progress`.
  Se borra al finalizar el pilar (el score va a `scan_vibracional`).
- `libreria_protocolos` — micro-módulos quirúrgicos por pilar.
- `estado_tripulante_protocolos` — protocolos activos del tripulante.
- `subscriptions` — membresías activas (`group_name: pulsar/cuasar`).
- `profiles` — datos del tripulante (`full_name`, `clerk_user_id`).
  **Crear vía RPC `ensure_profile`** (SECURITY DEFINER, bypassa RLS).
  No intentar `POST /rest/v1/profiles` con anon key: RLS lo bloquea con 401.
- `books` — metadata de los libros (id, title, descripción).
- `book_formats` — URLs reales de descarga (columna `file_url`). Se cruza
  con `purchases` para mostrar los links en Mi Núcleo → Códices.
- `purchases` — registro de qué compró cada user (book_id + formats_purchased).

UX / Diseño = Quantum 6D.

---

## Mapa de componentes — qué edita qué

**Domo.tsx** — el shell. Contenedor SPA. Estrellas, cometas, fondo, ruta interna,
auth, decide qué pantalla pintar según `path`. Todos los demás viven adentro.
Importa: Origen, EscanerVibracional, NavegadorEstacion, NavegadorLente,
ClerkProviderWrapper, Auth2Header/Modal, PortalInduccionEscaner. *Editar cuando:*
qué se renderiza por ruta, ocultar/mostrar navbar global, fondo de estrellas,
`hideNavbar` / `hideAuth`.

**NavegadorEstacion.tsx** — barra de navegación del Centro de Mando (desktop).
Ex `MenuSolarD.tsx`, renombrado en 2026-04-20. Pestañas: Origen · Fragmentos ·
Simuladores · Códices · Meditaciones · Sesiones · Escáner. Default export.
*Editar cuando:* agregar/quitar pestañas, estilo de la barra superior desktop.

**NavegadorLente.tsx** — barra superior + menú hamburguesa mobile. Ex
`MobileNavigation.tsx`, renombrado en 2026-04-20. Modo "minimal" (solo
hamburguesa, fondo transparente) en `/radar`, `/origen`, `/`, `/home`.
*Editar cuando:* menú lateral, links móvil, avatar/admin, hamburguesa, barra
superior móvil.

**NavRevealPin.tsx** — pin hexagonal solar en esquina superior izquierda para
capas inmersivas/admin (Telemetría, Holograma, Motor). Hover sobre el pin
despliega `NavegadorEstacion` con comportamiento toggle (persiste hasta
re-hover). Default export. Cooldown 600ms entre toggles anti-flicker.

**Origen.tsx** — capa `/` y `/home`. Sistema solar de bienvenida.
*Editar cuando:* manifesto, guía, newsletter, socials, planetas/orbitas,
copy de bienvenida, estructura del sistema solar.

**PortalInduccionEscaner.tsx** — capa `/radar`. Fachada pública educativa
del Escáner Vibracional (introduce los 3 pilares antes de la herramienta).
Single-codebase: mobile (column stack + CTA al fondo) vs desktop (grid 2
columnas). Default export. CTA dorado "INICIAR DIAGNÓSTICO" → ruta a `/escaner`.

**EscanerVibracional.tsx** — capa `/escaner`. ~8000 líneas. Subcomponentes
internos: `Radar`, `Sonda`, `ModulosView` (Protocolos), `TimelineChart`,
`DecodificadorView`, `Dock`, `SacredCodex`, `ProtocolosEmptyState`.
*Editar cuando:* cualquier cosa del Escáner — radar, pilares, splash,
libros sagrados, decodificador, cámara, trayectoria, dock inferior, Enrutador.

**MiNucleo.tsx** — capa `/nucleo`. Dashboard del tripulante (Códices, Cámara,
Mi Firma). *Editar cuando:* tabs del núcleo, Stripe portal, suscripción, Mi Firma.

**Auth2Header.tsx / Auth2Modal.tsx** — auth UI. Botón login + modal Clerk custom.

**ClerkProviderWrapper.tsx** — boot de Clerk. Casi nunca se edita.

### Atajos de razonamiento — cuando Diego diga…
- "esconde el menú en tal capa" → `Domo.tsx` (`hideNavbar`) + `NavegadorLente.tsx` (`isRadarRoute`).
- "cambia algo del Escáner / sondas / protocolos / decodificador / libros" → `EscanerVibracional.tsx` (`/escaner`).
- "Mi Núcleo / Mi Firma / Códices del user / Cámara / suscripción" → `MiNucleo.tsx` (`/nucleo`).
- "Portal de Inducción / fachada educativa del Escáner" → `PortalInduccionEscaner.tsx` (`/radar`).
- "sistema solar / hero de inicio" → `Origen.tsx`.
- "botón login / modal de auth" → `Auth2Header.tsx` o `Auth2Modal.tsx`.
- "hamburguesa / menú lateral / nav superior" → `NavegadorLente.tsx` (mobile) / `NavegadorEstacion.tsx` (desktop).
- "pin solar para revelar nav en capa admin" → `NavRevealPin.tsx`.
- "fondo de estrellas / cometas / ruteo" → `Domo.tsx`.

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

## Versionado y Logs

- Cada edición incrementa la versión en el header del archivo.
- Formato: `// <Archivo>.tsx v<número>` en la primera línea.
- Ejemplo: `// Domo.tsx v3.2` → `// Domo.tsx v3.3`.
- Si el archivo no tiene versión, agrégala.
- Al finalizar cualquier ejecución, colocá un log visible:
  `✅ [VERSIÓN: v3.3] Cambios completados en Domo.tsx`.

---

## Estilo de comunicación

- **Lenguaje humano, no técnico, siempre.** Cero jerga en la explicación
  principal. Si tengo que mencionar un nombre de función, estado, ruta o
  concepto de código, se queda encerrado en una sección "Detalle técnico
  (opcional)" al final del mensaje, NO en el cuerpo del reporte.
- **Formato obligatorio — "Hecho" (solo lo nuevo, nunca contrastar):**
  el reporte arranca directo en lo que quedó implementado. NO describir
  el estado anterior ("antes era así"), NO comparar, NO justificar con
  el pasado. Diego vive en el presente del producto; el diff contra
  ayer es ruido. Escribir 1 a 4 frases en prosa sobre **la experiencia
  del tripulante ahora** — qué ve, qué toca, qué pasa. Tono declarativo:
  "Hicimos esto. Ahora funciona así. El tripulante siente esto." Sin
  bloques "Antes/Ahora", sin "ya no ocurre X". Solo la foto del estado
  actual que queda después del cambio.

  > **Ejemplo correcto:**
  > Cada tipo de sesión (30, 45 y 60 minutos) ahora sabe exactamente
  > qué duración tiene. Al tocar el plan que elige, el sistema guarda
  > esa duración y la usa en todo el proceso: en el calendario, en el
  > pago y en el correo de confirmación. Funciona igual para sesiones
  > grupales y en computadora y celular.
  >
  > **Ejemplo incorrecto (no repetir el patrón):**
  > "Antes el sistema siempre registraba 60 min aunque eligieras 30..."
  > "Ahora cada tipo de sesión sabe su duración..."

  **Discovered 2026-04-24** — Diego confirmó que el bloque "Antes" agrega
  ruido: él ya vive el producto, no necesita que le resumamos el bug de
  ayer. La foto declarativa del estado nuevo es lo que realmente usa
  para validar y seguir la conversación.

- **🜂 TODO LO PEDIDO EN UNA SOLA PASADA, SIN PARAR A PREGUNTAR (Zak,
  2026-08-12 · VIII).** Cuando Zak enumera siete cosas, se hacen las siete en
  la misma ejecución, en el orden que Claude decida, y se reporta UNA vez al
  final. Nunca "hice la primera, ¿sigo?". Nunca terminar temprano para pedir
  confirmación de algo que ya estaba pedido.

  **Por qué, textual de Zak:** *"te dije 7 cosas y haces 1, me dices listo,
  ahora vamos a esto, y te tengo que contestar continúa. Es muy tardado y
  frustrante. Te dejo haciéndolo y yo me voy a hacer otra cosa; terminas
  rápido y yo estoy concentrado en otra cosa, y luego ya perdimos 10
  minutos."* El costo real no es el tiempo de la máquina: es que él se
  desconecta para trabajar en lo suyo y cada parada lo obliga a volver.

  **Qué SÍ interrumpe la pasada** (y solo esto): que seguir sea destructivo o
  irreversible sin su visto bueno, o que dos lecturas del pedido lleven a
  trabajos materialmente distintos. Un detalle de diseño ambiguo NO interrumpe:
  se elige la opción más lógica, se construye y se dice cuál se eligió.

  **Si algo del lote se traba**, se deja para el final, se termina TODO lo
  demás, y en el reporte se dice qué quedó fuera y por qué. Trabarse en una
  cosa no autoriza a devolver el turno con las otras seis sin hacer.

- **🜂 CADA COSA HECHA ABRE CON SU FRASE SOLA, EN SU PROPIA LÍNEA (Zak,
  2026-08-12 · II).** La oración que dice QUÉ quedó hecho va aparte, en
  negritas y sin nada pegado; el porqué, el cómo y el detalle van DEBAJO,
  en el párrafo siguiente. Así una lectura rápida se lleva solo las frases
  en negrita y el resto es opcional.

  > **Ejemplo correcto:**
  > **El sonido de la materialización nace con la primera palabra.**
  > Estaba colgado del canal, que entrega la primera letra medio segundo
  > antes de que el estanque la pinte. Ahora cuelga de lo que se ve.
  >
  > **Ejemplo incorrecto (no repetir):** una sola masa donde "el sonido
  > ahora nace con la primera palabra" y su explicación viven en el mismo
  > párrafo, sin salto ni contraste: no se ve dónde empieza y dónde
  > termina lo que se hizo.

  **Por qué.** Zak lee los reportes en dos velocidades. En la rápida quiere
  barrer las frases y saber si lo que pidió está; en la lenta quiere el
  razonamiento. Con todo en un párrafo corrido las dos lecturas se estorban
  y la rápida se vuelve imposible.

- **Prohibido en el cuerpo del reporte:** "activeSlotType", "fallback",
  "useEffect", "property control", "RLS", "RPC", "edge function",
  "handler", "state", "prop", "slotType", nombres de archivos con `.tsx`,
  "v2.8", etc. Si aparece cualquier palabra de esas, está mal escrito.
  Reescribir en castellano plano.
- **Permitido en el cuerpo:** los nombres de sellos del glosario ("Portal
  de Inducción", "Cámara Solar", "Telemetría del Núcleo", etc).
- **El bloque técnico al final** (si hace falta) va prefijado con `---`
  y un encabezado `### Detalle técnico`. Es optativo y el tripulante lo
  puede ignorar. Ahí sí vale mencionar archivos, versiones, nombres de
  funciones.
- **Nada de emojis ❌/✅ en el reporte principal.** La foto declarativa
  en prosa se lee mejor sin ellos. El único emoji permitido en el cuerpo
  es 🔄 para marcar copy/paste manual (ver regla aparte).
- **🜂 CERO em dashes (—), NUNCA.** Ni en el texto que ve el Tripulante
  (copy de la app, i18n es/en, botones, subtítulos) ni en mis reportes a
  Zak. En su lugar: coma, punto, punto y coma, o " · ". Zak los detesta
  (2026-07-11: la descripción de "Automático" en Apariencia tenía uno).
  Aplica también a guiones largos en subtítulos: preferir frases cortas
  de una línea. (Los headers de versión de código usan " — " como
  separador por convención histórica interna; eso NO es user-facing y se
  puede dejar, pero el copy nuevo user-facing va sin em dashes.)
- **🜂 CERO VOSEO ARGENTINO. Zak es MEXICANO (2026-08-14).** Se escribe
  **"pon"**, no "poné". **"guarda"**, no "guardá". **"dime"**, no "decime".
  **"marca"**, no "tildá". **"tienes"**, no "tenés". **"puedes"**, no
  "podés". **"haz"**, no "hacé". **"revisa"**, no "revisá". **"entra"**, no
  "entrá". Aplica a TODO: mis reportes, el copy de la app, la i18n, los
  comentarios de código y los mensajes de commit. Tampoco "acá" (es "aquí"),
  ni "andá", ni "fijate", ni "che", ni "vos". El registro es **español
  neutro con imperativo de tú**, que es como habla él.

  **Por qué.** Zak lo pidió textual el 2026-08-14 leyendo una instrucción
  mía: *"¿Poné? ¿Por qué me hablas en ese lenguaje? Es 'Pon', no 'poné',
  como si fuera argentino, o qué. Soy de México."* Ya existía la memoria
  [[feedback_idioma_neutro_no_argentino]] y aun así se coló, porque el
  voseo se filtra sobre todo en los IMPERATIVOS de las instrucciones
  operativas, que es justo donde más se leen. Encabezado correcto de la
  sección de acciones: **"Lo que tienes que hacer"**, nunca "tenés".

- Las acciones que requieren manos de Zak (deploy, SQL Editor, consolas de
  las tiendas) van bajo un encabezado "**Lo que tienes que hacer:**"
  numerado, en lenguaje imperativo plano.
- **🔄 Instrucciones de copy/paste manual — formato compacto con emoji
  de alerta.** Cuando un archivo supera 300KB y Diego tiene que subirlo
  a mano a Framer, la instrucción SIEMPRE arranca con el emoji **🔄**
  (ciclo manual requerido) como banderita visual. Diego lee el historial
  rápido y ese emoji le dispara la alarma "hay que pegar algo antes de
  probar". Sin el emoji las líneas se pierden entre el resto del reporte
  y Diego ha confirmado que se le pasa. La instrucción es UNA línea con
  solo los nombres de archivos separados por coma. NO incluir la ruta
  absoluta, NO incluir la secuencia "Assets → Code → Cmd+A → Cmd+Delete
  → Cmd+V → Publish" — Diego ya sabe el flujo y le satura el mensaje.

  > **Ejemplo correcto:**
  > 🔄 **Requiere copy/paste manual en Framer:** `Sesiones.tsx`,
  > `CalendarioReservas.tsx`.
  >
  > **Ejemplo incorrecto (no repetir):**
  > Framer → Assets → Code → `CalendarioReservas.tsx` → Cmd+A →
  > Cmd+Delete → Cmd+V desde `/Users/diego/Documents/Red Solar Viva/
  > Code/CalendarioReservas.tsx` → Publish.

  **Discovered 2026-04-24** — sin el emoji, Diego pasó por alto la línea
  de copy/paste en un mensaje denso y debuggeó 20 minutos un prellenado
  de Stripe que no aparecía porque el archivo nunca se pegó a Framer.
  El emoji 🔄 es tenue pero inmediato: pequeña reducción de ancho de
  banda con gran ahorro de confusión.

---

## Reglas de trabajo (Claude Code)

- Ediciones quirúrgicas únicamente — `str_replace`, nunca reescribir archivos completos.
- Ambigüedad → elegir la opción más lógica y documentar qué elegiste.
- No preguntar — ejecutar.

### Comandos pre-aprobados
- `npx typescript` / `npx tsc` — check de syntax errors.
- `sed -n '...'` — lectura de líneas específicas.
- `cat -A` — inspección de caracteres.
- `awk 'NR==...'` — inspección de líneas y longitud.

### Infraestructura local (ya instalada — NO reinstalar)
- Supabase CLI v2.90.0 en `/Users/diego/Documents/Red Solar Viva/admin/supabase`.
- Stripe webhook `stripe-webhook.ts` ya existe.
- Supabase webhook `index.ts` ya existe.
- Secrets instalados: `CLERK_WEBHOOK_SECRET`, `CLERK_WEBHOOK_TOKEN`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_ANON_KEY`,
  `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

### 🜂 REGLA — Cómo pedirle a Diego que aplique SQL (migraciones / RPCs)

**Nunca le des comandos de `supabase` CLI** (`supabase db push`, `supabase
migration repair`, etc.) para aplicar SQL. El state del tracking remoto
(`supabase_migrations.schema_migrations`) está desincronizado: muchas
migraciones ya aplicadas desde Dashboard aparecen "pendientes" en la CLI
→ `push` reintenta todas y algunas no son idempotentes (insert de seed
duplica slots, etc). Las `migration repair` también fallaron con "invalid
version number" por el formato de filename con underscores.

**Patrón correcto — SIEMPRE decirle:**

> "Pegá el contenido de `admin/supabase/functions/.../index.ts` o
> `admin/supabase/migrations/<archivo>.sql` en **Supabase Dashboard →
> SQL Editor → New Query → Run**."

Aplica a:
- Migraciones nuevas → SQL Editor directo.
- RPCs nuevas (`CREATE OR REPLACE FUNCTION`) → SQL Editor directo.
- Seeds puntuales, fixes de columna → SQL Editor directo.

Edge functions (`.ts` en `admin/supabase/functions/`) sí van por CLI:
`supabase functions deploy <nombre> --no-verify-jwt` — y **las corre CLAUDE**,
no Zak: la CLI local ya tiene sesión y proyecto vinculado (verificado
2026-08-09). No confundir.

Discovered 2026-04-23 cuando Diego vio 13 migraciones pendientes en
`db push` (todas las 12 previas ya aplicadas, más la nueva), y las
repair fallaron por formato. SQL Editor paste = 10 segundos, cero
riesgo de duplicar datos.

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

## Suscripción RSV vigente

🜂 **UNA SOLA FUENTE DE INGRESO VIVA (Zak, 2026-08-16).** Todo lo demás está
APAGADO y no se cuenta en proyecciones ni se ofrece.

- **Sintonía Solar** — **499 MXN/mes o 149 MXN/semana**, el MISMO precio en la
  app (iOS/Android, con ~15% de comisión de tienda) y en la web (sin comisión).
  El 777 MXN/mes es precio ANTIGUO de web: no volver a citarlo.
  **Product ID** `prod_UOf1RrEypuWFTg` (mapeado a `group_name='sintonia'` en
  `admin/supabase/functions/stripe-webhook/index.ts` PRODUCT_GROUP_MAP).
- **Apagados, no se ofrecen** (verificable en el panel del Motor de
  Intervención): las sesiones 1:1 con Zak'Haar (Cámara de Resonancia), las
  sesiones grupales, el Pase de Exploración y la Cámara Solar. Tampoco hay
  venta suelta de Códices ni de Meditaciones. El motor de reservas y sus
  tablas siguen en el código por si algún día vuelven.
- **Inmersión Solar** (1,999 MXN/mes) es histórica; la oferta viva es Sintonía.
- **Cristales de Extracción** (incluidos en Sintonía Solar) — 2 cristales
  lunares por mes. Combinables libremente entre Códices y Meditaciones de
  la Holoteca:
  - 🜂 **1 cristal canjea el CÓDICE COMPLETO — todos sus formatos, ahora y a
    futuro** (decisión de Zak 2026-08-01, reemplaza el modelo viejo de "el
    formato que elijas"). Ebook, PDF y su audiolibro cuando exista; y el
    formato que se dé de alta DESPUÉS aterriza solo en la biblioteca de
    quien ya lo canjeó, sin canje nuevo y sin backfill manual. Vale igual
    para la compra suelta (399 iOS / 333 web). **Por qué:** casi nadie
    gastaba un 2º cristal en el MISMO libro (quien lee, lee; quien escucha,
    escucha) → el catálogo no duraba 22 canjes, duraba 11 con fricción de
    más; elegir formato es una decisión con arrepentimiento; el costo
    marginal por persona es CERO (R2 no cobra egreso); y cada audiolibro
    nuevo se vuelve un aviso a toda la base que ya tiene ese libro = motor
    de regreso a la app.
    · Implementación: `purchases.full_access` + `redeem_codice_with_cristal`
    escribe todos los formatos entregables + trigger `trg_reparte_formato_nuevo`
    sobre `book_formats` (migración `20260801b_codice_completo.sql`) +
    `stripe-webhook` v2.5. La fuente de verdad sigue siendo
    `purchases.formats_purchased`; NO se tocó ninguna RPC de lectura.
    · Guardas: si el Códice no tiene ningún archivo entregable NO se cobra el
    cristal (`codice_sin_formatos`); una compra previa se completa GRATIS
    (ya pagó por ese libro).
  - 1 cristal canjea cualquier Meditación de la Holoteca (precio
    individual de cada Meditación: 222 MXN para quien compra suelta).
  - Combinaciones válidas: 1 Códice + 1 Meditación, 2 Códices, o 2
    Meditaciones.
  - **SÍ se acumulan** (verificado 2026-06-14): `get_my_cristales` no filtra
    por `mes_lunar` y no hay job que los caduque. La regla vieja "no
    acumulables" nunca se implementó.
  - ⚠️ **Se emiten por MES DE CALENDARIO sin distinguir semanal/mensual** →
    ver el hueco del semanal 199 en `

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

---

## Pendientes vivos

> 🜂 **Qué entra aquí y qué NO.** Entra solo lo que sigue ABIERTO y necesita
> una decisión o una mano fuera de mi alcance. **NUNCA** se anota "falta
> compilar el build X" ni "falta desplegar la función Y" — eso se pide en el
> momento y se olvida ([[feedback_no_recordar_builds_ni_deploys]]). Lo ya
> construido vive en el código; los patrones y decisiones, en las memorias.
> La arqueología completa hasta el 2026-08-04 está en
> `admin/CLAUDE_archivo_hasta_2026-08-04.md` (no se carga por sesión).

**Versión en circulación:** App Store **1.1.3 LIVE**, en curso **1.1.4**.
Android: **pública en Google Play** (vc7). Detalle en
[[referencia_version_en_tienda]].

---

### 🟡 Higiene, cuando toque

- 🜂 **EL ARCHIVO MAESTRO ES LO ÚNICO SIN RED (2026-08-17).** `CLAUDE.md` vive
  en la raíz de `Red Solar Viva/`, que NO es un repo, así que ningún `git push`
  lo respalda. Los cinco proyectos SÍ tienen remoto privado en GitHub y hoy
  están los cinco al día (`escaner-app`, `Code`, `admin`, `rsv-web`,
  `escaner-landing`). Mientras la raíz no sea repo, cada cierre de sala deja
  una copia en `admin/CLAUDE_maestro_RESPALDO.md` (que sí viaja). Si algún día
  se hace repo de la raíz, este bullet se va.
- **Device-QA de la ESCUCHA AUTOMÁTICA, ahora en las DOS caras** (Matriz
  desde 2026-08-19, Espejo original desde la 1.1.20): con V encendida, mandar
  un mensaje largo y OÍR la cadena entera — que arranque pronto, que las
  uniones entre tramos no se oigan, que Detener o un envío nuevo la corte
  limpio, y que el dorado vaya pegado a lo que suena (si se adelanta, el
  ajuste es un número). Arneses en verde; falta el oído, que exige sesión y
  llamadas de pago. [[proyecto_escucha_automatica_matriz]]
- **Pegar la migración `admin/supabase/migrations/20260825_wallpapers_por_nodo.sql`**
  en el SQL Editor: sin ella, el botón "Ver wallpapers descargados" de la
  ficha del nodo dice "no se pudo leer".
- **Quitar los 2 satélites de Clerk que sobran** (Dashboard → Domains):
  `app.escanervibracional.com` y `app.redsolarviva.com` ($10/mes cada uno).
  Quitar de a uno y entrar a la web del Escáner entre uno y otro.
  `escaner.redsolarviva.com` NO se toca (las apps publicadas lo usan).
- **Consultas aterrizadas, sin construir:** (a) modo profundo en el teléfono
  → propuesto botón "Ir más hondo" bajo cada respuesta (no interruptor:
  gasto deliberado por reflejo, vista previa gratis del carril de pago);
  (b) avisos de wallpapers nuevos → sello NUEVO + badge con marca local de
  última visita + push por TANDA con deep link (nunca por wallpaper suelto);
  (c) DeepSeek visión → no conectar mientras sea `exp`; si entra, solo el
  camino de imágenes; (d) revisar el `50` que se guarda en pilares AÚN no
  escaneados del primer ciclo (se vio en los scans del primer suscriptor:
  propósito/vínculos en 50 antes de tocarse).
- **Ver en el teléfono la tanda del 2026-08-19 · II:** la barra de reflejos con
  su buscador, el compositor abriéndose en dos renglones, las Rachas en filas
  parejas y la puerta de "Tu plan" para quien no tiene. Todo verificado midiendo
  en pantalla de 375, pero ninguna de esas cuatro capas se pudo abrir con sesión
  real desde aquí (el gate de cuenta y el de Clerk lo impiden).
- **Device-QA del escape del navegador de Instagram** desde un enlace REAL
  (mandarse el link por DM y abrirlo ahí). El código está probado; falta el
  caso real.
- **Rotar las 5 claves** que estuvieron hardcodeadas en
  `Scripts/PDF Generator/pipeline_solar.py` (Deepgram, Gemini, R2 access +
  secret, Supabase service_role). Ya salieron del código pero siguen en el
  historial de git. Baja prioridad: el script no está en uso.
- **App Transfer a "Red Solar Viva"** cuando exista la entidad legal (PFAE o
  S.A. de C.V.) + D-U-N-S. Conserva reseñas, rankings y suscripciones.

---

## 🜂 Protocolo de Cierre de Sesión · v47 (2026-08-25)

> ⚠️ **REGLA DE PRESERVACIÓN · LEER ANTES DE CUALQUIER EDIT AL CLAUDE.md**
>
> Las secciones marcadas con 🜂 y 🜃 (este protocolo + su historial) son
> **auto-evolucionables y persistentes**. Solo se modifican:
> 1. Como parte del **Paso 4** (reformulación explícita con bump de versión
>    + entrada al changelog).
> 2. Como parte del **Paso 2** (nuevo bloque al principio del Historial con
>    fecha absoluta).
>
> **Nunca las borres "por limpieza" ni las reemplaces parcialmente en un
> Edit amplio.** Antes de cualquier Edit extenso al CLAUDE.md, confirmá que
> las secciones `## 🜂` y `## 🜃` siguen presentes. Si un `old_string`
> abarcaría parte del protocolo, descompone el Edit en edits más chicos que
> NO toquen esas secciones.
>
> Si detectás que el protocolo NO está al arrancar una Sala de Comando,
> recuperalo desde git (`git show <commit>:CLAUDE.md`) — no lo reinventes.

**Directiva auto-evolucionable.** Cada vez que Diego diga **"Cerrar Sala
de Comando"** o `#cerrarsaladecomando`, ejecutá este protocolo ENTERO sin
preguntar. El protocolo mismo aprende y se reformula en el paso 4.

### 🜂 Paso de APERTURA — el archivo maestro se pesa al abrir la Sala

**Se ejecuta al ARRANCAR una Sala de Comando, no al cerrarla.** Antes de
la primera lectura de código:

```bash
wc -c "/Users/diego/Documents/Red Solar Viva/CLAUDE.md"
```

| Peso | Qué hacer |
|---|---|
| **< 150.000** | Nada. Seguir con el pedido de Zak sin mencionarlo. |
| **150.000 – 250.000** | Avisar en UNA línea al final del primer reporte y ofrecer el barrido. Zak decide cuándo. |
| **> 250.000** | Avisar ANTES de empezar y pedir el barrido: a este peso el archivo se come la ventana de contexto y cada sala rinde menos. |

**El barrido, cuando toca.** No es "borrar cosas viejas": es preguntarle a
Zak lo único que el repo no puede responder — **qué de lo anotado ya está
hecho**. Se le presenta la lista NUMERADA de `## Pendientes vivos` en
lenguaje humano, una línea cada uno, y él contesta con números:

> El archivo maestro va en 312.000 caracteres (el techo sano son 150.000).
> Antes de seguir, decime cuáles de estos ya están hechos — contestá con
> los números:
> 1. Los productos de Google Play activos con su plan base
> 2. La huella SHA-256 de Play en el archivo de enlaces
> 3. El Return URL de Apple para el dominio nuevo
> …

Lo que Zak marque como hecho se BORRA (no se archiva "por si acaso": si
está hecho, vive en el código). Lo que siga abierto se queda tal cual. El
historial se comprime según el Paso 3 y la arqueología se respalda en
`admin/CLAUDE_archivo_hasta_<fecha>.md`.

**Por qué.** Hasta el 2026-08-04 el archivo llegó a **1.298.085
caracteres** — 205 entradas de historial y `Pendientes vivos` de 263 K, la
mayoría cosas ya resueltas que nadie tachó. Zak: *"apenas hacíamos un par
de cositas y ya estábamos en 60% de una ventana de un millón de tokens"*.
El Paso 3 ya mandaba limpiar, pero al CIERRE — y al cierre siempre hay
prisa por sellar. Pesarlo al ABRIR es lo que hace que ocurra: es una sola
línea de comando, cuesta cero cuando el archivo está sano, y cuando no lo
está, la única persona que sabe qué se hizo de verdad está justo ahí, con
la sala recién abierta y sin nada a medias.

### Paso 0 — Regla de iteración (aplica DURANTE la sesión, no al cierre)

**Si un mismo bug requiere ≥3 versiones publicadas sin resolverse,
parar.** No iterar otra vez sin datos concretos del tripulante:
pedir snippet de captura (patrón `rsvDump`), log de Network DevTools,
o ejecutar diagnóstico desde el componente. Solo entonces iterar
UNA versión informada.

**Por qué.** Iterar a ciegas sobre el mismo síntoma multiplica el
tiempo y deja estado intermedio roto que después requiere revert
(discovered 2026-04-28 con Auth2Modal v17.16 → v17.17 → v17.18 →
v17.19 → v17.20 en 4 horas, donde v17.19 incluso rompió el flow
con un error de JS que el tripulante reportó como bug nuevo).

**Excepciones legítimas:**
- Bumps cosméticos (typo en header) para forzar re-disparar el
  watcher cuando la API de Framer falla.
- Iteraciones sobre piezas DISTINTAS del bug (ej. probar el fix en
  diferentes archivos al mismo tiempo).

Cuando aplique este paso, decirle al tripulante explícitamente:
"Antes de iterar otra versión necesito X dato concreto" — no
silenciar el blocker.

### Paso 0-decies — Un catálogo que dice cubrirlo TODO se enumera contra la fuente

Cuando construyas un registro que promete **cobertura total** (los destinos de un
comando por voz, una tabla de rutas, una lista de permisos, un mapa de estados),
la lista NO se escribe desde lo que recuerdas de haber leído: se **enumera contra
la fuente** (los miembros de la unión de tipos, los `useState` que abren capas,
los eventos `rsv-open-*`, las entradas del menú) y lo que quede fuera se deja
fuera con motivo escrito.

Un hueco de cobertura no se lee como "faltó una", se lee como **bug**: el sistema
puede acertar en treinta destinos y aun así sentirse roto en el único que la
persona pidió. Y si una capa vive como estado local de un componente (no como
ruta ni como evento), hace falta además una PUERTA para abrirla desde fuera.

**Por qué.** El 2026-08-02 · III entregué los comandos por voz con el catálogo
escrito a partir de lo que había visto al explorar. Zak pidió "abrir cámara de
cristalización" varias veces y no pasaba nada: esa capa vive como estado local de
Mi Núcleo y no salió en mis búsquedas. El reconocedor funcionaba perfecto; el
catálogo era el que estaba incompleto.

### Paso 0-bis — Mapa de dónde vive cada cambio (aplica en CADA reporte)

**Todo reporte de "Hecho" dice DÓNDE está vivo cada cosa.** El ecosistema
tiene SEIS destinos, y **CLAUDE los publica TODOS salvo el backend**. Zak no
compila nada: él desbloquea el teléfono y le pica a "actualizar".

| Destino | Cómo llega | Quién lo corre |
|---|---|---|
| 🥇 **App de macOS** (la que Zak usa a diario) | versión + `tauri build` + firma a mano + `./publicar-escritorio.sh` | **CLAUDE** |
| 🥇 **Celular · iOS** | `cap copy ios` + `xcodebuild` + `devicectl install` | **CLAUDE** |
| Web de escritorio (`app.escanervibracional.com`) | prebuilt a Vercel | **CLAUDE** |
| Celular · Android | `.aab` por terminal | **CLAUDE** |
| Web de Framer (`Code/`) | watcher automático | (se apaga) |
| Backend (SQL / edges) | SQL Editor / `functions deploy` | SQL: **Zak** · edges: **Claude** |

🜂 **LA PRIORIDAD ES LA APP, NO LA WEB (Zak, 2026-08-17).** Textual: *"es la
principal aplicación que utilizamos… siempre tienes que hacerlo también en la
versión de la aplicación, no la versión web. De hecho, esa es la prioridad
número uno y ya luego la web."* Un cambio "desplegado a Vercel" NO está en su
app: Tauri embebe su propio paquete y la app instalada sigue con el suyo
congelado. **Decir "listo en escritorio" habiendo hecho solo el deploy es
falso.** Un cambio de producto se cierra con: web + app de macOS (con su
actualizador) + iPhone. Ver [[feedback_app_macos_destino_aparte]].

🜂 **Y EL BUILD DE iOS LO CORRE CLAUDE, NO ZAK (Zak, 2026-08-17).** Textual:
*"¿Por qué dijiste que compile la app? Se supone que tú compilas automático.
Ya habíamos logrado que tú hicieras la compilación automática. Nada más me
llega a mí, lo desbloqueo el iPhone y listo."* Lo único de Xcode que sigue
siendo suyo es el ARCHIVADO para la App Store, que es otra cosa.

🜂 **Y ES UN SOLO COMANDO, que vive en el repo y no en la memoria de nadie:**

```bash
cd "/Users/diego/Documents/Red Solar Viva/escaner-app" && ./al-iphone.sh
```

Cura el descubridor, espera al teléfono si hace falta, compila, comprueba que
el bundle existe de verdad, instala, lanza y suena. Si algún día falla, **se
arregla el script**, no se improvisa a mano.

⚠️ **"unavailable" CASI NUNCA ES EL TELÉFONO.** El 2026-08-17 Zak lo tenía
desbloqueado, en la pantalla de inicio y en la misma red, y el Mac dijo
"unavailable" once minutos: era `remotepairingd` COLGADO desde el 13 de agosto,
sirviendo su caché sin volver a mirar la red. Las dos señales que lo delatan y
hay que buscar ANTES de esperar: `devicectl list devices` responde en ~11
MILISEGUNDOS (un descubrimiento real tarda segundos), y `lastConnectionDate`
del `--json-output` es de hace días. La cura son ocho segundos:
`killall -9 remotepairingd CoreDeviceService` (launchd los repone). Ya está
dentro del script. Esperar y reintentar NO lo arregla nunca, y pedirle a Zak
que desbloquee tampoco: el teléfono no tenía nada.

⚠️ `xcodebuild` **sale con código 0 aunque no construya nada** cuando el
destino no existe (lista los simuladores y termina). La prueba de que compiló
es que exista `App.app` en `DerivedData/Build/Products`, no el código de salida.

🜂 **El celular son DOS caminos con la misma fuente.** El código es UNO (un
cambio sirve para las dos plataformas, no se pide dos veces). Y **un paquete ya
compilado NO
recibe cambios posteriores**: es una foto del código en ese instante. Al
entregar un build hay que decir qué incluye, y al retomar, verificar si hubo
cambios después de esa fecha antes de darlo por vigente. Discovered
2026-07-28 — Zak preguntó si los cambios se guardaban solos en el `.aab` ya
entregado. Ver [[feedback_workflow_builds_ios_android]].

🜂 **El deploy a Vercel lo ejecuta CLAUDE, nunca se le pide a Zak.** El
`pnpm install` remoto de Vercel está roto (patch nativo de `@capacitor/camera`),
así que se compila LOCAL y se sube prebuilt:
`vercel pull --yes --environment production` → `vercel build --prod` →
`vercel deploy --prebuilt --prod`, y se verifica en vivo en los DOS dominios
(root 200 · `api/auth/apple/start` 302 a Apple · `api/fapi/v1/client` 200).
Lo que SÍ es de Zak: el SQL (SQL Editor) y `supabase functions deploy`
(requieren su sesión). Discovered 2026-07-27 · IV — Zak: "para qué me haces
hacer eso si tú puedes hacerlo directo". Ver [[feedback_claude_despliega_vercel]]. Y cuando Zak reporte que
algo "no funciona", **lo primero es verificar en qué entorno lo probó**
antes de tocar código: puede estar probando un destino al que el cambio
todavía no llegó.

**Por qué.** El 2026-07-27 Zak reportó tres fallas de escritorio; dos de
ellas (Esc y la barra que no se escondía) ya funcionaban en el código —
estaba probando la web desplegada, que aún no tenía el cambio. Medir
primero (Esc en vivo, geometría del scroller) evitó reescribir código
sano y dejó al descubierto la tercera, que sí era un bug real.

### Paso 0-ter — Lo que el preview CONGELA no está roto

El preview corre con la pestaña oculta (`document.hidden = true`): **rAF,
las animaciones CSS/framer y el scroll suave quedan congelados**. Entonces
un `scrollTo` dentro de `requestAnimationFrame` nunca corre ahí, y un
`AnimatePresence` deja el nodo en exit para siempre aunque el estado ya
haya cambiado. Antes de "arreglar" algo que se ve inerte en el preview:

1. **Verificar el ESTADO por un efecto lateral observable**, no por el
   píxel. (Ejemplo: si el pie NO se esconde a los 3s, eso prueba que
   `atBottom` cambió a true, aunque el botón siga en el DOM por el exit
   congelado.)
2. Si el código depende de rAF o de una animación para algo **funcional**
   (no cosmético), darle una **ruta directa** de red de seguridad: mejora
   el producto en device Y vuelve la feature verificable acá.

**Por qué.** El 2026-07-27 · II el botón de "volver al final" del Espejo
parecía no hacer nada en el preview; el handler corría bien y el
congelamiento era del entorno. La red de seguridad directa (sin rAF, sin
`behavior:smooth`) resolvió las dos cosas de una vez.

🜂 **El preview también MIENTE sobre el viewport.** Con el Browser pane
oculto, `window.innerWidth/innerHeight` valen **0** — y cualquier guard
defensivo que exija un viewport medido (`if (vw < 40) return`, típico en
efectos imperativos para no nacer 0×0 durante una transición del WebView)
aborta en silencio. Un efecto que "no aparece" en el preview puede estar
sano: antes de tocarlo, medir `innerWidth`. Para observarlo hay que
falsear `innerWidth/innerHeight` además de `document.hidden`. Discovered
2026-07-28 · II con la ceremonia de impregnación.

### Paso 0-quater — Un fallo que Zak no puede leer es un round-trip perdido

**Antes de entregar algo para device-QA, preguntarse: si esto falla en su
teléfono, ¿la pantalla le dice POR QUÉ?** Si la respuesta es no, el reporte que
va a volver es "no funciona" — y eso obliga a una sala entera de diagnóstico
que se pudo haber ahorrado.

Aplica sobre todo cuando el fallo puede venir de afuera (un proveedor sin
saldo, un secreto sin cargar, una función sin desplegar, un permiso denegado):
esos casos son indistinguibles entre sí desde afuera y el Tripulante no tiene
consola.

**Es el reverso del Paso 0.** El Paso 0 dice "no iteres a ciegas, pedí el dato
concreto". Este dice: **construí el producto para que ese dato exista sin que
haya que pedirlo.**

🜂 **Y el motivo tiene que existir EN SU IDIOMA.** Un mensaje que una librería
externa devuelve en inglés y en jerga de desarrollador no es un motivo: es ruido
que además rompe la experiencia. El caso típico son los `catch` que hacen
`message: e?.message` y pintan eso en pantalla. Se traduce **por causa** y lo
desconocido cae a un genérico ya traducido. Discovered 2026-08-01: un tester en
Android vio "There is an issue with your configuration. Check the underlying
error for more details." dentro del muro de pago. Ver
[[feedback_sdk_llave_por_tienda]].

**Por qué.** El 2026-07-29 · II la edge de la voz devolvía el motivo exacto de
Fish (saldo, modelo, voz inexistente) y el cliente lo tiraba a la basura: el
device-QA de Zak fue un botón que decía "Sintonizando…" un segundo y volvía a
"Escuchar", mudo. El diagnóstico del servidor estaba escrito y no servía de
nada porque no llegaba a la pantalla. **Un motivo que no se ve no existe.**

🜂 **Aplica DOBLE a las features de ENTRADA** (micrófono, cámara, sensores, un
pegado, un archivo que se sube): ahí el Tripulante no solo no ve el motivo del
fallo, tampoco ve **qué está entrando**. Una escucha que dice "te estoy
escuchando" sin mostrar lo que oye es indistinguible de una escucha muerta, y el
único reporte posible es "no funciona". La regla: si la feature RECIBE algo del
mundo, ese algo se ve en pantalla mientras entra. Además de diagnóstico es mejor
producto (ver lo que el sistema captó da confianza). Discovered 2026-07-30 · II
con el modo escucha de las Afirmaciones: el reconocedor de frases estaba
verificado con 56 casos y aun así el device-QA volvió como un "no marca nada"
sin nada que leer.

### Paso 0-quinquies — Lo consumible va PRIMERO, en su propio mensaje

Cuando un pedido mezcla **algo que Zak puede disfrutar o usar de inmediato**
(letras, prompts, copy, textos, un análisis) con **trabajo largo de
construcción**, entregá lo consumible en el PRIMER movimiento, como archivo o
mensaje propio, y recién después te sumergís en lo demás.

No es cortesía: convierte el tiempo de construcción en tiempo útil para él.
Mientras yo compilo, él ya está escuchando, leyendo o pegando. Y si la sala se
corta a la mitad, lo consumible ya está entregado en vez de perderse en un
reporte final que nunca llegó.

**Cómo se ve:** un `SendUserFile` (o un mensaje corto y completo) antes de la
primera lectura de código, y una frase de una línea diciendo qué sigue. Nunca
al final "de paso, aquí están las letras".

**Por qué.** El 2026-07-29 · III Zak pidió 5 tracks de Aura-Drift + la Fase D
del Espejo en el mismo mensaje, y él mismo marcó el orden: "si te parece me
puedes dar primero lo de los prompts de suno para ir escuchandolas mientras
hacemos el resto". Tenía razón y no debería haber tenido que pedirlo. Cuando
algo se puede consumir en paralelo, va primero.

### Paso 0-sexies — Una verificación que falla acusa al CÓDIGO, no al test

Cuando una comprobación propia da un resultado inesperado, el **primer
sospechoso es el código**, no el arnés. La tentación es archivarlo como
artefacto del entorno (sobre todo después del Paso 0-ter, que enseña justo lo
contrario) y seguir. Ahí es donde se escapan los bugs que nadie va a notar
después.

La diferencia entre los dos pasos es simple: el **0-ter** aplica cuando algo
**se ve** inerte (píxeles, animaciones, scroll) — eso el preview lo congela. El
**0-sexies** aplica cuando algo **mide** mal: un dato que no aparece, un
contador en cero, un guardado vacío. La medición no se congela: si midió mal,
algo está mal.

**Regla:** ante una verificación fallida, buscar la causa en el código ANTES de
tocar el test. Y si la causa resulta ser el arnés, decirlo — no borrar el
intento en silencio.

**Por qué.** El 2026-07-29 · VI el test del cache de voz devolvió "no guardó".
Era fácil culpar al arnés (reusaba un buffer ya reproducido) y pasar de largo.
Investigarlo destapó un bug real de producción: `decodeAudioData` **inutiliza**
el ArrayBuffer que recibe, así que la copia hecha después de un `await` guardaba
vacío **en silencio**. Habría shipeado un cache que nunca guarda nada — el audio
suena igual, no hay error en pantalla, y el único síntoma habría aparecido en la
factura del proveedor de voz meses después. Leer el código no lo habría
mostrado; el test que "falló" sí.

### Paso 0-septies — Un fix de lógica no está probado hasta que el caso FALLA con la versión vieja

Cuando el arreglo es de **lógica pura** (un coserdor de texto, un parser, una
máquina de estados), correr el caso reproducido también contra la
implementación **ANTERIOR**. Si el caso no falla con la vieja, el test no está
tocando el bug: está pasando por casualidad.

Cómo: extraer la función REAL del archivo con un script (no reescribirla a mano
— se prueba el código que viaja), quitarle solo los tipos y correrla con `node`
en el scratchpad; al lado, una copia de la lógica vieja en otro `.mjs`. El
conteo (`(salida.match(/frase/g) || []).length`) es mejor evidencia que un diff
a ojo, y si el bug depende del tiempo, el test espera de verdad.

**Por qué.** El 2026-07-30 el dictado del Agradecimiento se arregló y los 6
casos pasaron a la primera. Recién al re-correr el caso de Zak contra la lógica
anterior —que devolvió exactamente 3 copias, idéntico a lo que él había
pegado— quedó demostrado que el fix atacaba el bug y no otra cosa. Sin ese
paso, "los tests pasan" no dice nada.

### Paso 0-duodecies — La lógica pura verificada NO prueba la máquina asíncrona

Cuando el arreglo toca una **máquina asíncrona** (un reciclado, un reintento, una
cola, un recurso que se abre lento), verificar las funciones puras da **falsa
confianza**: el reconocedor puede estar perfecto y el sistema seguir fallando,
porque el bug vive en CUÁNDO llegan las cosas, no en qué deciden.

Si el diff **introduce o mueve una operación asíncrona en el camino caliente**,
la verificación tiene que incluir una de estas dos:

- **Modelar la máquina** en el arnés (reloj falso + la secuencia real de eventos),
  no solo las funciones que deciden. Es el patrón del arnés de `espejoVozFish`,
  que fingía el AudioContext para probar pausas y reanudaciones.
- **Instrumentar en device** lo que ENTRA al sistema (no lo que la persona dijo,
  eso ya se sabe), para distinguir hipótesis en un intento.

Y antes de agregar una operación async "de limpieza" periódica, preguntarse qué
pasa si el usuario actúa **justo mientras viaja**. Casi siempre hay una
alternativa sin ventana ciega.

**Por qué.** El 2026-08-03 · VI el arnés de los comandos por voz dio 101 ✓ / 0 ✗,
incluida la demostración del bug contra la entrada vieja (el Paso 0-septies
cumplido al pie de la letra), y el device-QA volvió con navegación intermitente:
el fix había metido un `restartRecognition()` asíncrono en el camino caliente y
eso abre una ventana ciega mientras viaja. Ninguna prueba del reconocedor podía
verlo — probaban la decisión, no el reloj.

Complementa al **0-septies** (que prueba la lógica contra la versión vieja) y al
**0-quater** (que construye el producto para que el dato exista sin pedirlo).

### Paso 0-octies — La evidencia que Zak pega puede traer OTRO bug adentro

Cuando Zak reporta algo y **acompaña el reporte con material** (el mensaje que
envió, una captura, un log), ese material se lee ENTERO y por sí mismo, no solo
como prueba del síntoma que él nombró. Él pega lo que tiene a mano para ayudar a
diagnosticar UNA cosa; no está auditando el contenido.

**Por qué.** El 2026-07-30 Zak reportó que el Espejo se quedó colgado dos
minutos y, para ayudar, pegó el mensaje que había enviado. Ese mensaje estaba
**repetido cuatro veces**: un bug independiente del dictado que él no mencionó
(lo dio por ruido del reconocedor) y que además contribuía al síntoma reportado
— un texto cuatro veces más largo hace al modelo tardar más, cuesta más y
ensucia la memoria del Espejo. Se arreglaron los dos; leyendo solo el síntoma se
habría arreglado uno.

**Cómo se ve:** antes de zambullirse en la causa del síntoma, una pasada por el
material preguntando "¿hay algo raro acá que Zak no nombró?". Si aparece, se
nombra y se decide: se arregla ahora si es de la misma familia, o entra a
Pendientes vivos.

### Paso 0-nonies — Una verificación que NO PUDO correr no es una que pasó

Tres formas de creerse verificado sin estarlo. Las tres terminan igual: reportando
"listo" sobre algo roto que el Tripulante descubre por su cuenta.

**1. El probe que devuelve NADA se re-corre por otra vía.** Un `curl` vacío, un
timeout, un `000`, una consulta sin filas: eso no es "no concluyente, sigamos".
Es una verificación que no ocurrió. Se re-intenta por otro camino (otra
herramienta, otro host, el artefacto compilado, un log) o se dice EXPLÍCITAMENTE
en el reporte: **"esto quedó sin verificar"**.

**2. El código de estado no prueba el CONTENIDO.** Donde hay un catch-all (una
SPA, un framework con fallback), todo responde `200` — incluido el destino
equivocado. La verificación real busca un marcador que solo exista en lo que
esperas: el título, la versión, un texto único.

```bash
curl -s https://dominio/ | grep -o "<title>[^<]*</title>"
```

**3. Que el código nuevo LLEGÓ no prueba que la página VIVA.** Verificar el
contenido del bundle desplegado (punto 2) confirma el transporte, no el
funcionamiento: un error de ejecución tumba la página con el código correcto
adentro. **Toda publicación a un sitio vivo cierra con dos comprobaciones más:**
que la página **renderiza** (texto real, no un body vacío) y que la **consola no
tiene errores**. Son diez segundos.

**Por qué.** El 2026-07-31 desplegué la landing nueva y la di por viva: los
checks daban `200`, `302`, `200`. La raíz servía **la app**, no la landing —
`200` es lo que una SPA responde a cualquier cosa. Y antes de eso, un probe con
`curl --resolve` había devuelto vacío y lo archivé como "no concluyente": ESA
era la señal de que la regla nunca se evaluaba. Zak lo cazó con una captura.

Y el 2026-08-03 el punto 3 se cobró la portada entera: la sala anterior verificó
por contenido que su chunk desplegado traía los cambios (punto 2, bien hecho) y
aun así dejó `redsolarviva.com` **en negro total** durante horas por un hook
colocado bajo un return condicional. El sitio publicaba perfecto; lo roto era el
render. Un `get_page_text` vacío lo habría delatado al instante.

Es hermano del **0-sexies** (una verificación que falla acusa al código) y del
**0-ter** (lo que el preview congela no está roto): los tres son la misma
disciplina — medir antes de creer, y creer solo lo que se midió de verdad.

### Paso 0-undecies — El caso de prueba tiene que parecerse al REAL en la dimensión que importa

Una verificación con un dato **benigno** puede dar un OK falso y mandar a producción algo que sigue roto. No basta con que la prueba corra (0-nonies) ni con que el entorno no la congele (0-ter): el DATO de entrada debe parecerse al real justo en el eje del que depende el comportamiento.

Antes de dar por buena una verificación, preguntarse **qué dimensión del dato real podría cambiar el resultado** y usar un caso así: texto largo si el layout depende del largo, muchos elementos si depende de la cantidad, pantalla chica si depende del alto, sesión de invitado si depende de la membresía.

**Por qué.** El 2026-08-03 · III cerró un bug que había sobrevivido DOS salas: la píldora "Responder aquí" del Espejo. Las dos veces se verificó en preview y las dos veces "apareció" — con un reflejo corto. Los reflejos reales son largos, llenan la pantalla, y ahí la píldora quedaba flotando encima del texto, ilegible. El código era correcto, estaba desplegado, y la prueba pasaba: lo que estaba mal era el caso de prueba. Con un reflejo largo el bug salió al primer intento.

Hermano del **0-sexies** (una verificación que falla acusa al código): ahí el peligro es descartar un fallo real; aquí es **creerle a un éxito fácil**.

### Paso 0-terdecies — Lo EFÍMERO se mide contra el reloj, no contra la intuición

Antes de concluir que algo **no aparece**, comparar **cuándo mediste** con **cuánto vive**
lo que buscas. Una ceremonia de apertura, un aviso que se auto-cierra, una animación de
entrada, un estado de carga: todos tienen una ventana de vida, y el panel de vista tarda
varios segundos en devolverte el control. Si la ventana es más corta que ese retardo, tu
lectura SIEMPRE dirá "no está" — aunque funcione perfecto.

**La sonda es una línea:** `performance.now()` en la misma medición. Si el número supera la
vida del elemento, la lectura no prueba nada y hay que cambiar de método (buscar un rastro
que PERSISTA: una marca que el efecto deja al terminar, una clase, un valor guardado; o
forzar el modo demo que congela la fase).

Es el eje que le faltaba a la familia: el **0-ter** cubre lo que el preview CONGELA, el
**0-nonies** lo que NO PUDO correr, el **0-undecies** el dato de prueba equivocado. Este
cubre el **momento** de la lectura.

**Por qué.** El 2026-08-04 di por roto el sello de apertura del escritorio y encadené varias
hipótesis (StrictMode, la prop que no llegaba, el gate) sobre una lectura que tomé a **9.8
segundos** de la carga, para una ceremonia que dura **2.65**. El sello llevaba todo ese rato
funcionando. Una sola línea de reloj —que terminé escribiendo al final— habría cerrado el
caso al principio.

### Paso 0-terdecies — Una consulta respondida ATERRIZA o se evapora

Zak mezcla tareas de código con **consultas** ("esta es una consulta, dime qué
opinas"): si conviene tal feature, qué proponés para tal problema, por qué algo
está como está. Esas respuestas no producen código, así que no dejan rastro
solo — y el análisis se repite desde cero tres salas después.

**Toda consulta respondida termina en `## Pendientes vivos`**, no únicamente en
el registro de la sesión (que se comprime y se archiva). Con: la decisión, el
PORQUÉ en una línea, y qué sigue (o "sin construir" explícito). Si la decisión
tiene contexto que sobrevive al pendiente, va también a una memoria.

Y lo mismo vale para lo que se DESCARTÓ con argumento: sin eso, la próxima sala
vuelve a proponerlo.

**Por qué.** El 2026-08-04 · II, cuatro de los pedidos de Zak eran consultas
(la barra en Rachas, por qué no llegó el aviso del Radar, cómo incentivar el
escaneo, si conviene meter la música). Ninguna generó código esa sala; tres
generaron bullets vivos y una memoria nueva. Sin ese aterrizaje, la sala
siguiente habría vuelto a analizar "¿ponemos la barra en Rachas?" sin saber que
ya se decidió y por qué.

### Paso 0-quaterdecies — 🜂 BORRAR CÓDIGO: texto exacto, nunca rangos calculados

**Reglas de refactorización y borrado (Zak, 2026-08-08):**

1. **PROHIBIDO** borrar código calculando rangos de líneas por patrones
   genéricos de JSX/TSX. Nada de buscar cierres como `</div>` o `)}`.
2. Los borrados y reemplazos van sobre **bloques de texto exactos, únicos e
   inambiguos** (la herramienta `Edit`, que falla sola si hay ambigüedad).
3. Si un patrón de búsqueda es ambiguo o aparece más de una vez, el script
   **DEBE fallar explícitamente ANTES** de tocar el archivo.
4. **NUNCA** correr scripts de modificación masiva sin un `git commit` previo
   limpio. Y antes de correrlo, verificar que el archivo esté REALMENTE
   trackeado: `git status` marcando `??` significa que no hay red.

**Por qué.** El 2026-08-08, quitando un bloque de UI de `EV_Oraculo.tsx`, un
script buscó el inicio por una cadena del comentario y el final por el primer
`)}` precedido de `</div>`. Ese patrón aparece cientos de veces en el archivo:
el "final" enganchó miles de líneas más abajo y se borraron **2.693 líneas
contiguas** del Espejo. El archivo no estaba en git (175 de los 222 fuentes de
`escaner-app` nunca se habían commiteado), así que no hubo restauración
posible: ni git, ni historial del editor, ni Time Machine, ni iCloud, ni
sourcemaps, ni cachés. Hubo que reconstruirlo leyendo el bundle minificado del
último despliegue, y los comentarios de esa región —que documentaban decisiones
ganadas a pulso— se perdieron para siempre.

**Las dos lecciones son distintas y las dos importan.** La primera es de
método: un borrado se ancla en texto único, no en aritmética de líneas. La
segunda es de infraestructura: **antes de automatizar cualquier cosa sobre un
árbol de archivos, comprobar que ese árbol tiene red.** El costo de un
`git init` es de segundos; el de no tenerlo fue una tarde entera.

### Paso 0-quindecies — La MÉTRICA puede estar hecha a la medida de lo viejo

Cuando midas una mejora contra un control, revisá que la métrica no esté
definida en los términos del diseño ANTERIOR. Un arnés puede correr bien, con el
dato correcto y el control correcto, y aun así dar un veredicto invertido porque
lo que cuenta es lo que el diseño viejo hacía por naturaleza.

**La señal:** el control gana en un número que contradice lo que se ve. Ahí no
se ajusta el umbral ni se borra el chequeo: se pregunta **qué percibe la persona**
y se mide ESO, en la base más neutra posible (tiempo uniforme, píxeles, no
eventos del propio sistema).

**Por qué.** El 2026-08-10, midiendo si la salida del reflejo quedó pareja, la
"irregularidad" daba 0.14 al control y 0.39 a lo nuevo: el control parecía más
regular. La métrica comparaba el tamaño del salto ENTRE PINTURAS, y el diseño
viejo pintaba 14 veces con saltos enormes pero parecidos entre sí — o sea, era
"regular" por construcción. Muestreada por CUADRO, que es como se percibe, la
misma comparación dio 4.52 contra 0.38. El código nuevo siempre estuvo bien; la
regla que lo juzgaba estaba escrita con la forma del anterior.

Hermano del **0-sexies** (una verificación que falla acusa al código): ahí el
riesgo es descartar un fallo real; acá es **creerle a un fallo inventado por la
propia vara**.

### Paso 0-duodevicies — Un "NO HAY NADA" se confirma por otra vía antes de construir encima

Una lectura que devuelve **vacío** (cero filas, lista sin elementos, campo
ausente) se siente como un dato y no lo es: es la respuesta más fácil de dar
para un sistema roto. Una consulta que falla se nota; una que contesta
`[]` con toda confianza, no.

**Regla: antes de tomar una decisión de arquitectura sobre un vacío, confirmalo
por un camino distinto.** El segundo camino tiene que ser de otra naturaleza:
si el primero fue una API, que el segundo sea la pantalla, el archivo en disco,
el bundle publicado o una consulta directa. Repetir la misma llamada no
confirma nada.

Y al revés: **si el vacío es sospechosamente conveniente, sospechá más.** "No
hay configuración que rescatar" es justo lo que uno quiere oír antes de una
migración.

**Por qué.** El 2026-08-11 · II medí las 26 instancias de `<Domo />` en Framer y
todas dieron CERO perillas guardadas. Sobre ese cero se armó el plan entero de
salida de Framer y se publicó un sitio montado sin configuración. Eran **77**:
la medición corrió mientras `Domo.tsx` estaba corrupto en Framer, y sin el
componente correcto la API no puede resolver el esquema de property controls y
devuelve la lista vacía. No era que no hubiera valores, era que no se podían
leer. Lo destapó Zak comparando pantallas: logo ausente, portadas en blanco,
tipografías cambiadas. La API nunca dijo "no pude"; dijo "no hay".

Hermano del **0-nonies** (una verificación que NO PUDO correr no es una que
pasó): ahí el síntoma es que no hubo respuesta; acá la respuesta llegó, limpia,
y era mentira.

### Paso 1 — Test de continuidad

Respondé internamente: *"Si Claude (modelo futuro o yo mismo) arranca
mañana con solo este CLAUDE.md + el repo, ¿puede continuar exactamente
donde quedamos sin preguntarle nada a Diego?"*

Si NO: identificar qué falta (decisiones, estado de archivos, hipótesis
en curso, convenciones nuevas) y agregarlo ANTES del paso 2.

### Paso 2 — Registro de la sesión

Agregar un bloque AL PRINCIPIO de `### Historial de sesiones`:

```
#### YYYY-MM-DD
- ✅ Resuelto: [qué cerramos — lenguaje del tripulante]
- 📁 Archivos modificados: [ruta + versión]
- 🗄️ Migraciones SQL aplicadas: [archivo .sql + qué creó/alteró]    (opcional)
- 🔌 Edge functions deployed: [nombre + versión + qué hace]         (opcional)
- 📨 Workflows Pipedream actualizados: [nombre + versión + flujo]   (opcional)
- ⏳ Pendiente: [qué quedó a medias, accionable — 🜂 NUNCA "falta compilar
  el build X" ni "falta desplegar Y": eso se pide en el momento y se olvida]
- 💡 Decisiones importantes: [arquitectura, producto, convenciones]
- 🔧 Patrones nuevos: [hooks, workflows reutilizables]
- 🧬 Versión del sistema: [componentes clave]
- 🔮 Cómo arrancar la próxima Sala de Comando: [pasos concretos]    (si hay bug crítico pendiente)
```

Fecha siempre absoluta (YYYY-MM-DD). Lenguaje humano, sin tecnicismos.

**Salas CONCURRENTES (v7):** Zak corre varias Salas de Comando en paralelo y
TODAS editan este `.md`. Antes de escribir el registro: (1) re-grep de los
anchors justo antes de cada Edit (esperar `file modified since read`, releer y
reintentar — nunca pegar a ciegas); (2) el sufijo `· II/· III` del día se decide
mirando el Historial **Y** Pendientes vivos (una sala paralela puede haberse
autonombrado ahí sin haber escrito aún su entrada); (3) al retirar un 🔮 de una
sala que sigue ABIERTA en paralelo, la nota debe apuntar a dónde vive su estado
(Pendientes vivos / memoria), no declararla cerrada.

🜂 **Y las salas concurrentes también se LEEN al cerrar (v18):** antes de escribir
el registro, revisá los pendientes que otras salas dejaron hoy (§ Pendientes vivos
+ su 🔮) y preguntate si alguno apunta a un archivo que TOCASTE. Si apunta, es
TUYO: se cierra ahora, no viaja a la próxima sala como pendiente ajeno. Una sala
paralela compila y prueba en device el código de todas, así que puede cazar algo
tuyo sin saber que es tuyo — y el que lo puede arreglar en dos minutos sos vos,
que ya tenés el contexto cargado. Al cerrarlo, marcalo resuelto **en el bullet de
esa otra sala** (tachado + "CERRADO en la · III") para que su 🔮 no siga pidiendo
trabajo hecho.

**Campos opcionales** (v5 — 2026-05-04):
- `🗄️ Migraciones SQL aplicadas` solo cuando la sesión modificó schema
  o RPCs en Supabase Dashboard. El campo separa explícitamente backend
  de frontend, así Claude futuro identifica qué corre del lado DB sin
  buscar en el bloque genérico de archivos.
- `🔌 Edge functions deployed` solo cuando la sesión tocó archivos en
  `admin/supabase/functions/<name>/index.ts` que requieren
  `supabase functions deploy <name> --no-verify-jwt`. Anota nombre +
  versión + propósito para que Claude futuro sepa qué corre como
  edge function (vs. RPC SQL puro).
- `📨 Workflows Pipedream actualizados` solo cuando la sesión tocó
  workflows en `admin/pipedream/<workflow>.js`. Anota nombre +
  versión + flujo (qué dispara, qué hace). Sirve para diferenciar
  side-effects asíncronos de cambios in-process.
- `🔮 Cómo arrancar la próxima Sala de Comando` solo cuando dejaste un
  pendiente bloqueante que necesita un dato concreto del Tripulante
  (logs del browser, screenshot, output de un SQL específico, etc.).
  Incluye el snippet/comando ready-to-paste para que la próxima sesión
  no improvise. Cierra el agujero del Paso 0 (no iterar a ciegas).

### Paso 3 — Limpieza + Regla de Retención

**Antes de registrar la sesión nueva, barré el `.md` de arqueología resuelta.**

**NO documentar (o eliminar si ya está):**
- Bugs puntuales ya fixeados cuyo fix es una línea de código. La regla
  genérica basta; el log del bug no.
- Secciones marcadas "RESUELTO" — si está resuelto, no pertenece al
  contexto vivo.
- Detalles de implementación que solo tienen sentido durante la sesión
  en que se hicieron.
- `⏳ Pendiente` de sesiones antiguas ya resueltos en sesiones posteriores
  → removelos de la entrada antigua o marcá `→ ✅ hecho en YYYY-MM-DD`.
- Información duplicada en otras secciones → consolidá en el lugar correcto.

**SÍ documentar:**
- Decisiones arquitectónicas (rutas, nombres, tiers, integraciones).
- Convenciones que aplicarán hacia adelante (renames, nomenclatura, workflows).
- Pendientes **vivos** (no resueltos, accionables) → moverlos a la sección
  `## Pendientes vivos` del `.md`, no al historial.
- Patrones reutilizables que surgieron (hover+hotkey, press-and-drag,
  portal fix, etc.).

**🜂 NUNCA anotar builds ni deploys como pendientes** (regla de Zak,
2026-08-04): un build de Xcode o un `functions deploy` se piden UNA vez, en
el momento, y no vuelven a mencionarse. No van al registro, ni a
`## Pendientes vivos`, ni se preguntan al cerrar. Lo que SÍ se anota es lo
que Zak no hace todos los días: pegar SQL, subir un archivo a R2, un ajuste
en la consola de una tienda. Y de versiones solo se guarda **cuál vive en la
tienda** ([[referencia_version_en_tienda]]).

**Límite de historial:** mantener las **2 últimas sesiones** como máximo.
Al agregar una tercera:
- La más vieja se comprime a solo `💡 Decisiones importantes` y
  `🔧 Patrones nuevos`, o se archiva en bloque `<!-- ARCHIVADO YYYY-MM-DD -->`.
- Si sus decisiones ya están consolidadas en el cuerpo del `.md`
  (stack, arquitectura, reglas), borrala completa.

**🔮 Regla del prompt de arranque (v6):** SOLO la sesión MÁS RECIENTE
puede tener un bloque `🔮 Cómo arrancar la próxima Sala de Comando`.
Cuando agregás una sesión nueva con su propio 🔮:

1. Buscá todos los bloques 🔮 existentes en el Historial:
   `grep -n "🔮 \*\*Cómo arrancar" CLAUDE.md`
2. Borrá el 🔮 de la sesión que acaba de dejar de ser la más
   reciente (la que estaba arriba antes de tu inserción).
3. Borrá también cualquier 🔮 en sesiones archivadas más viejas que
   haya quedado por accidente.
4. Confirmá que solo queda UN match en el grep final.

Por qué: los 🔮 son prompts de arranque para la PRÓXIMA sala. Una
vez que esa sala se ejecutó (y por tanto hay una sesión más nueva
con su propio 🔮), el prompt viejo es arqueología pura — no
documenta nada útil sobre el estado actual ni sobre el siguiente
paso. Acumularlos infla el `.md` y confunde a Claude futuro
preguntándole "¿con qué prompt arranco?" cuando hay varios
candidatos. Discovered 2026-05-13 cuando Zak detectó 7 bloques
🔮 acumulados de sesiones cerradas.

### Paso 4 — Evolución del protocolo

Respondé internamente:
1. ¿El formato del registro capturó todo lo importante, o algún campo faltó?
2. ¿Documenté algo que no fue útil cuando Claude arrancó fresco?
3. ¿Apareció un patrón/workflow nuevo que merece formato propio?

Si al menos una es "sí", **reformulá este protocolo**: bump de versión
(v2 → v3…), actualizá pasos, agregá línea al changelog.

### Paso 0-sexdecies — Lo que MIDE y lo que OCURRE tienen que ser el mismo objeto

Cuando dos sistemas trabajan sobre "el mismo" texto, imagen o señal, comprobá
que sea LITERALMENTE el mismo objeto y no dos versiones que alguien limpió,
recortó o normalizó por el camino. Si uno mide sobre A y el otro ejecuta sobre
B, el desfase no aparece de golpe: **se acumula en proporción a cuánto
difieren**, así que se ve bien al principio y va derivando — que es la firma
más difícil de diagnosticar, porque invita a culpar al reloj o a la
aproximación en vez de al dato.

La señal: un error que CRECE con el avance y que se corrige solo en los puntos
de re-sincronización (bordes, cortes, finales), donde la normalización vuelve
a cuadrar los dos mundos.

**Por qué.** El 2026-08-11 la palabra dorada del Espejo se adelantaba, y las
dos primeras hipótesis fueron del reloj (el adelanto en letras, el peso de la
puntuación). La causa era que la voz sintetiza el texto LIMPIO —la edge le
quita el markdown— mientras el corte y los pesos se calculaban sobre el CRUDO:
cada `**` son dos caracteres que nadie pronuncia y que sí pesaban. Por eso
derivaba justo en los párrafos con negrita y volvía a cuadrar al cerrar cada
parte. Ninguna cantidad de afinar el adelanto lo habría arreglado.

Hermano del **0-quindecies** (la métrica hecha a la medida de lo viejo): ahí
la vara está mal; acá los dos relojes miden mundos distintos.

### Paso 0-septdecies — Una instrucción del sistema jamás viaja en el campo del usuario

Cuando el cliente le agrega algo suyo al mensaje de la persona —una directiva
de modo, un preámbulo, un contexto— eso NO es parte de lo que la persona
escribió y no puede consumir su cupo, contarse en su límite ni aparecer en su
historial. Va en su propio campo y el servidor lo compone después de validar.

La señal es un límite que se dispara con entradas que a ojo son cortas.

**Por qué.** El 2026-08-11 la Matriz Sincrónica pegaba su directiva de modo
(2.885 caracteres) dentro del mensaje: de los 4.000 permitidos le quedaban
1.100 reales, y un dictado de dos minutos —que es exactamente para lo que
existe ese modo— moría con `message_too_long`. El tope estaba bien; lo que
estaba mal era qué se medía.

### Paso 0-undevicies — Tu propia automatización puede DESHACER lo que acabas de hacer

Cuando una acción tuya dispara otra automática (un push que despliega, un
guardado que sincroniza, un commit que corre un hook), preguntate qué
reconstruye esa segunda desde cero y qué NO va a incluir. Si lo que acabás de
publicar vive fuera de la fuente que ella lee, lo va a borrar — y no en el
momento, sino un minuto después, cuando ya reportaste éxito.

La firma es cruel: la verificación pasa (mediste bien, en el momento correcto)
y el sistema se rompe DESPUÉS. Nada en tu registro lo delata.

**Regla:** cuando dos caminos escriben el mismo destino, el orden no se
confía a la memoria: se codifica en la herramienta. Una guarda que se niega a
correr fuera de orden cuesta cinco líneas y no se olvida nunca.

**Y la verificación se hace sobre lo que puede fallar de un modo distinto.**
El chequeo del script comparaba TAMAÑOS: el instalable pesa 7 MB y la página
de error 5.960 bytes, así que ahí funcionaba. Pero el manifiesto del
actualizador pesa 755 bytes — menos que la página de error — y nunca se
comprobó. Cada artefacto se verifica en su propio término: el binario por
tamaño, el JSON parseándolo.

**Por qué.** El 2026-08-14 publiqué la app de escritorio, verifiqué que se
servía, y acto seguido cumplí la regla de oro de respaldar con `git push`.
Ese push disparó el auto-despliegue de Vercel, que reconstruye desde el repo
y no tiene los instalables (viven en `.gitignore` porque pesan 15 MB): tomó
producción y dejó al actualizador respondiendo la página del sitio. Zak vio
"No se pudo consultar el servidor de versiones" en una app que yo acababa de
declarar publicada y verificada. Pasó DOS veces el mismo día, la segunda ya
sabiendo la causa.

Hermano del **0-nonies** (una verificación que no corrió no es una que pasó):
ahí el problema es medir de menos; acá es medir bien y que el mundo cambie
después de la medida.

### Paso 0-vicies — Un ATAJO que decide no preguntar falla hacia el camino largo

Cuando construyas un camino rápido que resuelve LOCALMENTE lo que de otro modo
iría al sistema caro (un detector de intenciones antes del modelo, una caché
antes de la consulta, una heurística antes de la llamada), sus dos errores no
cuestan lo mismo: equivocarse hacia "esto no era para el atajo" cuesta una
llamada de más; equivocarse hacia "esto sí era para el atajo" **se traga la
petición entera** y la persona no recibe nada de lo que pidió, sin error que
leer.

Por eso el atajo se escribe pesimista: exige TODAS las señales y no una sola;
descarta lo que se parezca a otra cosa (una pregunta no es una orden aunque
mencione el destino); se acota en tamaño; y ante la duda deja pasar al camino
largo. Y se prueba con los casos que NO debe capturar, que son los que revelan
si la puerta quedó ancha, no solo con los que sí.

**Por qué.** El 2026-08-15 el detector de navegación del Council aceptaba una
preposición suelta como disparador. La frase «En una sola frase: ¿qué es Fotón
Cero?» cumplía "empieza con *en*" y "menciona Fotón Cero", así que se ejecutaba
como *abre Fotón Cero*: la pregunta jamás llegaba al modelo y en pantalla solo
se veía un cambio de cámara. El reconocedor estaba perfecto; lo ancho era la
puerta. Y no salió por una prueba dirigida: salió porque mi propia verificación
usó una frase que mencionaba una cámara.

Hermano del **0-decies** (un catálogo que promete cobertura total se enumera
contra la fuente): ahí el riesgo es cubrir de menos; acá es capturar de más.

### Paso 0-vicies-semel — La causa se ANUNCIA después de probarla, no antes

Encontrar una explicación que encaja produce una certeza física, y esa certeza
es justo lo que hay que desconfiar. El costo de anunciarla antes de probarla no
es el error en sí: es que Zak la lee, la da por buena, y si era falsa arrastra
una idea equivocada del sistema durante días.

**Regla:** entre "creo que la causa es X" y decírselo va SIEMPRE una prueba que
pueda salir mal. Si la prueba no es posible, la frase cambia de "la causa es" a
"la causa más probable es, y esto es lo que la confirmaría".

Y cuando la prueba desmiente la hipótesis, eso es un ÉXITO del método, no un
tropiezo: se dice en una línea, se corrige el rumbo y se sigue. El arnés que
acusa a tu propia idea vale más que el que la aplaude.

**Por qué.** El 2026-08-16, cazando por qué la voz del Council se quedaba muda,
encontré un marcador provisional que se quedaba pegado en la ranura del socket
y escribí "encontré el bug y es de una línea". El arnés que escribí para
demostrarlo probó lo contrario: ese marcador SÍ lo limpia el turno siguiente.
La causa real era otra (el navegador suspende el audio con la pestaña
escondida, y hablarle al micrófono no cuenta como gesto para despertarlo). El
arreglo del marcador era higiene correcta, pero si me quedo en el anuncio, Zak
habría cerrado la sala creyendo resuelto algo que seguiría pasándole.

Hermano del **0-sexies** (una verificación que falla acusa al código): ahí el
peligro es descartar un fallo real; aquí es **enamorarse de la primera
explicación que encaja**.

### Paso 0-duovicies — DOS ÓRDENES CONTRARIAS: gana la que está pegada al dato

Cuando un encargo a un modelo lleva una regla general ("no repitas nada de esta
lista") y, más abajo, una regla operativa que la contradice ("conserva lo que ya
está, palabra por palabra"), **no gana la más importante ni la más enfática:
gana la que vive junto al material sobre el que está trabajando**. Y el fallo no
se lee como desobediencia, se lee como que el modelo "no entiende": produce algo
perfectamente coherente con la orden que sí obedeció.

Dos consecuencias operativas:

1. **Antes de endurecer una prohibición, busca su contraria.** Si el resultado
   parece ignorar una ley, el primer sospechoso no es la ley: es otra
   instrucción del mismo prompt que dice lo opuesto sobre el mismo objeto.
   Añadir una tercera ley encima solo agrega ruido.
2. **No le des el guion de lo que prohíbes.** Si el texto completo de lo vetado
   viaja en el encargo, reciclarlo es la ruta de menor resistencia para un
   modelo local. Se le da lo justo para VETAR (el nombre, la mecánica) y jamás
   lo que alcanza para COPIAR (el cuerpo, el guion, el ejemplo redactado). Un
   catálogo bien escrito de cosas prohibidas es, en la práctica, un catálogo de
   plantillas.

**Por qué.** El 2026-08-16 · VI el Nodo A del Council devolvía, vuelta tras
vuelta, exactamente las jugadas que ya estaban aprobadas en el pergamino. Dos
salas anteriores habían atacado el síntoma reforzando la prohibición (primero en
prosa, después como lista de nombres propios al principio del bloque) y el
problema seguía. La causa estaba en la regla del ranking: *"las dinámicas que ya
estaban se CONSERVAN tal cual, palabra por palabra"*. Ninguna lista negra podía
ganarle, porque esa frase vivía pegada al documento que se estaba reescribiendo.

Hermano del **0-vicies** (un atajo que decide no preguntar falla hacia el camino
largo): ahí el riesgo es capturar de más; aquí es **culpar al modelo de lo que
escribió el prompt**.

### Paso 0-tervicies — Un cierre asíncrono tiene que decir a QUIÉN pertenece

Cuando algo se cancela y su limpieza corre en un `catch`, un `finally` o un
callback, esa limpieza NO se ejecuta en el instante del corte: se ejecuta cuando
lo cancelado se entera, que son milisegundos DESPUÉS. Y para entonces el
reemplazo ya arrancó. Si la limpieza toca un recurso COMPARTIDO (la voz, el
audio, el socket, el foco, un temporizador global), lo que apaga no es lo suyo:
es lo que acaba de nacer.

**Regla:** toda limpieza que toque algo compartido comprueba primero que ese
algo siga siendo suyo. Un identificador de turno basta; sin él, cancelar es una
bomba de relojería que estalla sobre el siguiente.

**La firma es traicionera** porque todo lo demás funciona: el reemplazo se
ejecuta, escribe, responde y sus indicadores se ven en verde. Lo único que
falta es la parte que el muerto apagó al caer. Por eso se busca en el sitio
equivocado durante días.

**Por qué.** El 2026-08-17 Zak reportó por tercera vez que el Council le
contestaba por escrito y no se oía nada, y aportó el dato que lo resolvió:
"creo que es cuando dice interrumpido". Mandar un turno nuevo aborta el
anterior; el `catch` del abortado llamaba a `silenciar()` sin preguntar de quién
era la voz, y como corre después de que el turno nuevo ya arrancó la suya, el
nuevo nacía mudo. Dos salas anteriores habían instrumentado el motor de audio,
el proveedor y el navegador buscando la causa en el sitio equivocado.

Hermano del **0-duodecies** (la lógica pura verificada no prueba la máquina
asíncrona): ahí el problema es CUÁNDO llegan las cosas; aquí es SOBRE QUIÉN
caen cuando llegan tarde.

### Paso 0-quatervicies — Un ARCHIVO que promete N cosas se abre y se cuentan

Cuando alguien entrega un archivo diciendo lo que trae —un modelo con tres
animaciones, un export con las capas, un respaldo con todo—, esa frase describe
lo que **quiso** hacer su exportador, no lo que hay dentro. Un exportador que
falla en silencio es la norma, no la excepción: entrega un archivo válido, del
tamaño esperado, al que le falta justo la parte que importa.

**Regla: antes de cablear nada, ABRIR el archivo y CONTAR.** Casi siempre se
puede sin herramientas: un GLB lleva su índice en un chunk JSON al principio (se
baja el primer medio mega y se parsea), un ZIP su directorio, un MP4 sus átomos.
Y lo que se cuenta no es solo "cuántas hay" sino **si sirven**: una animación con
UN fotograma es una pose congelada, y en el código se ve idéntica a una que
funciona.

**Y el corolario que salva la tarde: cuando el archivo resulte incompleto, no se
devuelve el turno.** Se construye la ruta que no depende de él (aquí: un ciclo de
paso procedural sobre el propio esqueleto) y se apaga sola en cuanto el archivo
bueno llegue.

**Por qué.** El 2026-08-17 · IV Zak subió `arquitecto.glb` seguro de que
llevaba las tres animaciones que eligió en Meshy. Parseando su JSON: UNA pista,
`Armature|clip0|baselayer`, con un solo fotograma. El modelo y el rig estaban
perfectos; el movimiento no viajó. Sin abrirlo, el diagnóstico habría sido "el
avatar está tieso, algo falla en el código" y se habría buscado en el sitio
equivocado.

### Paso 0-quinvicies — Copiar un objeto vivo puede dejar la copia atada al original

Cuando duplicas algo que tiene DOS partes unidas por referencia (una malla y su
esqueleto, un nodo y su observador, una vista y su modelo), el clon superficial
copia las dos partes pero **la copia sigue apuntando al original**. Y como el
original suele estar vivo en otro sitio, el resultado no es un error: es una
copia que obedece a otro dueño.

La firma es desconcertante y por eso cuesta: todo existe, todo se dibuja, nada
lanza excepción, y la copia se comporta como si tus órdenes no llegaran. Se
diagnostica preguntando **de quién depende cada mitad**, no revisando lo que se
ve.

**Por qué.** El 2026-08-17 · IV el avatar del Arquitecto aparecía plantado en el
centro del templo, tieso, después de un parpadeo del cuerpo de respaldo.
`Object3D.clone()` había copiado la malla y los huesos, pero la malla copiada
seguía atada al esqueleto ORIGINAL, que vive en un árbol descolgado de la
escena: la piel se deformaba respecto al origen del mundo y el animador movía
unos huesos clonados que nadie miraba. La cura fue una línea
(`SkeletonUtils.clone`), y encontrarla fue preguntar quién manda sobre la piel.

### Paso 0-sexvicies — Un archivo que se REEMPLAZA con el mismo nombre lo sigue sirviendo la caché

Cuando sustituyas un archivo estático que ya se publicó —un sonido, una imagen,
un video, una fuente, un JSON de datos— y le conserves el nombre y la ruta, el
navegador de quien ya lo cargó **seguirá sirviendo el viejo**, y las cachés
intermedias también. El código nuevo se despliega, la verificación pasa, y en
la máquina de Zak no cambia nada.

**Y tu propia comprobación no lo delata**, porque tu sesión lo pidió por primera
vez y lo trajo fresco. Es el mismo defecto del Paso 0-nonies visto desde el otro
lado: no es que la verificación no corriera, es que corrió sobre un cliente sin
historia.

**Regla: si el archivo cambia y el nombre no, la URL tiene que cambiar.** Un
sufijo de versión (`?v=2`) en el punto donde el código la construye, o un nombre
con huella. Y el chequeo se hace pidiendo la URL **exacta que usa el código**,
no la ruta a secas.

**Por qué.** El 2026-08-17 · VI se regeneraron tres efectos del Council (el
panel, tomar y dejar) porque sonaban chillones. Los archivos nuevos viajaron a
producción con el mismo nombre; sin el sufijo de versión, la sala de Zak —que
llevaba horas con los viejos en caché— habría seguido oyendo exactamente lo que
pidió cambiar, y el reporte habría dicho "hecho".

### Paso 0-septvicies — El TESTIGO de una etapa se suelta al final de la ETAPA, no al final de su primera llamada

Cuando una etapa de trabajo hace UNA llamada larga, es natural soltar su testigo
—el `AbortController`, la bandera de "esto sigue siendo mío", el identificador de
turno— en cuanto esa llamada termina. El día que la etapa gana una SEGUNDA
llamada (una verificación, un juez, un resumen, un guardado), esa costumbre se
convierte en un defecto silencioso: la segunda llamada pregunta "¿me
interrumpieron mientras trabajaba?" comparando contra un testigo que ya se
soltó, y la respuesta es **siempre que sí**. El trabajo terminado se descarta
como si el usuario lo hubiera cortado, y se vuelve a empezar. Para siempre.

**La firma es la más engañosa que hay:** todo funciona. La llamada corre, el
resultado llega, no hay error en ninguna consola, y el sistema se ve *ocupado*.
Lo único que falta es que algo AVANCE. Y como el síntoma que se reporta es "se
reinicia", se busca en el motor de progreso —la barra, el contador, el
temporizador— que es justo donde no está.

**Regla:** el testigo pertenece a la ETAPA, no a la llamada. Se crea al abrirla
y se suelta en cada salida de la etapa, no antes. Si un diff añade un segundo
`await` dentro de una etapa que ya tenía uno, hay que ir a leer quién suelta el
testigo y cuándo.

**Y la prueba que lo caza es la del Paso 0-duodecies**, con el arnés de la
MÁQUINA (el motor real con los servicios falsos y un guion de eventos), no las
funciones puras. La forma de partir el caso en dos antes de escribir una línea:
mirar el ARCHIVO de lo que el sistema produjo. Ocho propuestas guardadas y cero
fricciones dice, sin ambigüedad, que la etapa TERMINA y algo la tira después.

**Por qué.** El 2026-08-17 el bucle del Council no pasaba nunca del 50%: cada
propuesta se escribía entera, se archivaba en la bóveda, y se descartaba. El
juez de repetición —añadido el día anterior como segunda llamada dentro de la
misma etapa— heredaba un `this.ac` que ya valía `null`. Dos salas antes se
había probado el juez en aislado (parser, depuración, veredictos contra el
núcleo real, todo verde) y la máquina asíncrona quedó sin modelar: exactamente
el hueco que el 0-duodecies describe, cometido por quien lo escribió.

### Paso 0-duodetricies — Apilar filtros razonables sobre un modelo débil lleva el rendimiento a CERO

Cuando un pipeline encadena varios filtros (un juez, una crítica, una regla de
entrada, una depuración), cada uno con su tasa de falsos negativos, el producto
de todos puede ser cero aunque cada filtro por separado sea sensato. El síntoma
no es un error: es un sistema que trabaja horas y entrega NADA ("llegamos a la
vuelta 25 sin ideas porque todas se descartaron").

Dos movimientos, y los dos se hacen sobre el texto, no pidiéndole al modelo:
1. **Estrechar el filtro que estaba mal definido.** El juez metía todo "pagar
   por alguien" en una sola bolsa: un juego de dados con premio de comida
   "repetía" el pago silencioso de la fila. Misma idea = mismo gesto Y misma
   mecánica; el premio no cuenta.
2. **Ejecutar del lado de acá la regla que el modelo debía cumplir y no
   cumplía.** La regla decía "con menos de cinco, la que sobrevive entra"; el
   modelo, con el ranking vacío, no la metía. Se mete en código.

Y cuando ni así alcanza, cambiar la FORMA del flujo: más tiros baratos antes
del caro (la lluvia de cinco), y un catálogo que solo crece en vez de un
ranking que se reescribe y se cicla.

**Por qué.** El 2026-08-18 el Nodo A llevaba 32 vueltas con el ranking vacío.
Ninguna pieza estaba rota: el juez juzgaba, la fricción criticaba, la evolución
obedecía. Apiladas, no dejaban pasar nada.

### Paso 0-undetricies — Una defensa construida para una condición que ya no existe se vuelve el bug

Cuando encuentres código que hace algo raro a propósito ("levanta la lápida:
el catálogo manda sobre un borrado"), busca la CONDICIÓN para la que se
escribió antes de decidir si sigue valiendo. Si la condición desapareció (borrar
ya no es un clic sin vuelta: pide confirmación y va a la papelera), la defensa
ya no protege de nada y lo único que hace es el daño que se ve.

**Por qué.** El 2026-08-18 los dorados borrados volvían en cada recarga. La
siembra levantaba su lápida a propósito, por un motivo de hacía dos días que
la papelera había vuelto innecesario. Hermano del 0-quindecies (la métrica
hecha a la medida de lo viejo): ahí la vara es de otra época; aquí lo es la
defensa.

### Paso 0-tricies — Un efecto afinado para un MOTOR puede tumbar al otro

Un efecto visual que en un navegador es gratis, en otro se paga en software. Y
cuando se paga en software, el costo no aparece como lentitud: aparece como
**cosas que desaparecen**, porque el navegador, antes que ir lento, DESCARTA
capas que no le caben en su presupuesto de memoria.

La firma engaña doble. Primero, el síntoma no se parece a la causa (una tarjeta
en negro no dice "tu gradiente cónico es caro"). Segundo, invita a culpar al
aparato: "es que ese teléfono es de gama baja". A veces lo es. Muchas veces el
efecto simplemente está escrito a la medida del otro motor.

**Las combinaciones caras que hay que reconocer**, sobre todo repetidas en una
lista: máscara compuesta (`mask-composite`) + hijo sobredimensionado + `rotate`
continuo · `backdrop-filter` en varios elementos a la vez · `filter: blur` sobre
áreas grandes · sombras enormes por elemento.

**La salida NO es apagar el efecto** en el motor pobre: es **reescribirlo con
otra técnica que produzca la misma percepción**. Casi siempre existe. Lo que la
persona ve es "una luz recorre el borde"; que eso se logre girando una capa o
desplazando un gradiente le da exactamente igual.

**Por qué.** El 2026-08-19 las tarjetas de Rachas desaparecían en un Samsung
A07. El EdgeGlow era una máscara compuesta sobre un hijo `conic-gradient`
inflado al 175% girando: perfecto en WebKit, rasterizado a mano por Chrome, y
con diez tarjetas la GPU descartaba capas enteras. La misma luz reescrita con
`background-position` sobre una capa plana se ve igual y no cuesta nada. Zak lo
había leído como límite del teléfono; no lo era.

### Paso 0-untricies — Una acción que YA está en el estado pedido tiene que acusar igual

Cuando alguien pide algo que ya está hecho ("enciende la vibración" con la
vibración encendida, "guarda" sin cambios, "actívalo" ya activo), el código
correcto no hace nada: comprueba, ve que no hay diferencia y sale. Y desde
fuera, **"no cambió nada" es indistinguible de "no funcionó"**.

Ahí se pierden horas: la función está sana, la prueba pasa, y el reporte dice
"no sirve". Y como el reporte apunta al reconocimiento ("no me entendió"), se
va a buscar al lugar equivocado.

**Regla: el acuse pertenece a la PETICIÓN, no al cambio de estado.** Si alguien
pidió algo, se le contesta, haya cambiado algo o no. Y el acuse tiene que estar
**en el mismo sentido que lo pedido**: un ajuste de vibración se confirma
vibrando, uno de sonido sonando, uno visual mostrándose. Confirmar un ajuste de
vibración con un sonido es no confirmarlo, porque la persona está atenta a otro
canal.

**Corolario para verificar:** probar el camino con el estado YA puesto, no solo
el que cambia. Es el mismo espíritu del 0-undecies (el caso de prueba tiene que
parecerse al real), aplicado a la idempotencia.

**Por qué.** El 2026-08-19 Zak repitió muchas veces "activar háptica" por voz y
concluyó que faltaba el comando. Medido con el reconocedor real: confianza
1.00, y el ejecutor llamaba a `setHapticsEnabled(true)`. Todo perfecto. Pero ya
estaba encendida, el ajuste salía sin tocar nada, y el único acuse del orbe es
un sonido. Nada que sentir en la mano, que era donde él estaba mirando.

### Paso 0-duotricies — Lo que se pide para UNA superficie NO se aplica a las dos

Cuando el pedido nombra una cara ("en celular", "en escritorio", "en la
Matriz"), el cambio va SOLO ahí. Extenderlo a las demás no es generosidad: es
ampliar el alcance sin permiso, y encima suele romper la otra, porque un diseño
que resuelve un problema de 375 píxeles casi nunca es el correcto en 1600.

**La trampa es que la extensión se siente coherente.** "Ya que lo arreglé aquí,
que quede igual en todas" suena a consistencia y es lo contrario: la
consistencia real es que cada superficie resuelva bien SU problema. Si al
arreglar una se te ocurre que la otra también lo necesita, se dice en una línea
del reporte y se espera, no se hace de paso.

**Y la verificación se hace en la superficie del pedido Y en la que tocaste.**
Si el diff cruza a una cara que nadie mencionó, esa cara hay que mirarla antes
de reportar.

**Por qué.** El 2026-08-19 Zak pidió rediseñar las Rachas "en celular, no en
escritorio" y lo apliqué a las dos: la columna angosta de 360 que en el
teléfono es correcta dejaba, en un monitor, dos tercios de pantalla vacíos.
Textual: *"¿Qué hiciste en escritorio? Se ve horrible… un chorizo"*. El arreglo
final no fue deshacer, fue lo que debió hacerse desde el principio: la misma
fila, repartida en las columnas que quepan según la pantalla.

### Paso 0-tertricies — Una medida que DECIDE el layout no puede depender del layout que decide

Si mides algo para elegir entre dos formas, y la forma elegida cambia esa misma
medida, no tienes una decisión: tienes un columpio. El síntoma no es que
oscile a la vista (React suele estabilizarlo en algún extremo arbitrario), es
que el comportamiento se vuelve **impredecible y distinto según por dónde
llegaste** al mismo estado.

**La cura son dos separaciones:**
1. **La vara se fija.** Se mide siempre contra la misma referencia —guardada
   mientras el elemento vive en la forma base—, no contra la geometría de
   ahora. Como la vara no cambia de tamaño con la decisión, la decisión es
   estable.
2. **La consecuencia se recalcula después.** Todo lo que dependía del tamaño
   viejo (aquí, la altura) se vuelve a calcular en una segunda pasada, con la
   forma nueva ya aplicada. Sin eso, el elemento se queda con la medida de la
   forma que abandonó, que es exactamente lo que se ve como un hueco.

🜂 **Y la vara se guarda con el valor del RENDER, no con un ref.** Un ref que
se actualiza en un `useEffect` normal está un paso atrasado dentro de un
`useLayoutEffect`: en la pasada del cambio todavía tiene el valor anterior. Si
lo usas para decidir si guardar la referencia, la guardas justo en el momento
equivocado y queda corrompida **para siempre y en silencio** — todo sigue
"funcionando", solo que el salto no vuelve a ocurrir nunca.

**Por qué.** El 2026-08-19 el compositor del Espejo debía pasar a dos renglones
en la segunda línea. La primera versión decidía y medía con una sola lectura:
el campo saltaba al ancho completo conservando el alto que había calculado
siendo angosto (hueco enorme), y de fondo la condición del salto dejaba de
cumplirse en cuanto el salto ocurría, porque al ensancharse el texto ya cabía
en una línea. Zak: *"quedó peor"*. Y el segundo defecto —la vara guardada con
el ancho grande— lo encontré instrumentando el propio cálculo, no leyéndolo:
dos mediciones anteriores me habían dado lecturas falsas por el estado sucio de
la recarga en caliente.

### Paso 0-quatertricies — Si algo que NO tocaste empeoró, el sospechoso es lo que cambió a su ALREDEDOR

Cuando alguien dice que una pieza «se ve peor» y tú no la has tocado, la
tentación es buscar el defecto DENTRO de ella: su material, su archivo, su
exportación. Pero una pieza no cambia sola. Si empeoró, o la cambiaste sin
darte cuenta, o **cambió el mundo del que dependía** — y la segunda es la más
frecuente, porque las dependencias de contexto no aparecen en ningún diff.

Casi todo lo que se ve depende de algo que no está en su archivo: un objeto 3D
depende de las luces y del fondo, un texto depende de la tipografía heredada,
un color depende del tema, un tiempo depende de quién más está usando la
máquina. Cambiar el entorno es cambiar todas esas piezas a la vez, sin tocarlas.

**La sonda es una pregunta, no un `git diff`:** ¿de qué depende esto que no
vive en su archivo? Y la cura casi nunca es deshacer el cambio del entorno
—que se hizo por un motivo— sino **hacer a la pieza independiente de él**.

**Por qué.** El 2026-08-19 · III el Arquitecto pasó de dios de luz a piedra sin
que nadie tocara su modelo: al cambiar el cielo del templo de crepúsculo cálido
a espacio profundo, su material PBR —de los que RECIBEN luz y no la dan— se
quedó sin nada que lo bañara. Buscar el defecto en el modelo o en la
exportación habría sido una tarde perdida. Y subir las luces de la sala habría
arreglado el cuerpo deslavando el mármol y el oro del templo, que están medidos
a mano: lo correcto fue que el cuerpo emitiera lo suyo y dejara de depender del
cielo.

Hermano del **0-undetricies** (una defensa construida para una condición que ya
no existe se vuelve el bug): allí lo que caducó fue el motivo de un código;
aquí, el entorno que un código daba por hecho.

### Paso 0-quintricies — Un CONTRATO DE FORMA se impone con gramática, no con instrucciones

Cuando le pidas a un modelo local que devuelva una forma exacta (claves de un
JSON, índices, una lista cerrada), no basta con decírselo en el system prompt,
ni en mayúsculas, ni con la plantilla literal al final. Un modelo de 27B con un
encargo largo delante contesta con SU forma, y lo hace con contenido bueno: la
respuesta parece correcta hasta que el validador la rechaza. La cura es que la
forma no sea una petición sino una GRAMÁTICA: la salida estructurada de Ollama
(`format: <esquema JSON>`) hace imposible inventar claves. La plantilla y las
reglas se quedan (dicen QUÉ va en cada campo); la gramática es la que manda.

**Y el corolario: un JSON cortado no es un JSON malo.** Con la forma impuesta,
el fallo que queda es quedarse sin espacio (num_predict): el modelo escribe
todo bien y se corta antes de la llave de cierre, y un lector estricto lo tira
entero con un mensaje que no dice la causa. Se repara lo que llegó (cerrar la
cadena y los corchetes abiertos), se acepta si lo obligatorio está, y si no,
el mensaje dice «se cortó por falta de espacio», que es lo que pasó.

**Por qué.** El 2026-08-22 el generador de locaciones pidió ocho claves
exactas y qwen3.8:27b devolvió `location_name`, `concept_summary`,
`visual_style{…}` y ningún prompt de render. Con la gramática, la misma idea
devolvió el contrato exacto. Y la segunda generación de Zak se cortó en mitad
de `lugar_canonico` por 1.400 tokens de tope: el panel decía «el núcleo no
devolvió un objeto JSON» cuando lo que pasó fue que se quedó sin aire.

Hermano del **0-duovicies** (dos órdenes contrarias: gana la pegada al dato):
allí el prompt se contradecía; aquí el prompt era claro y aun así no alcanzó,
porque una instrucción no es una restricción.

### Paso 0-sextricies — En una orden destructiva, la AUSENCIA de alcance jamás significa "todo"

Cuando una orden que borra acepta un alcance opcional ("borra ESTA conversación"),
la tentación de diseño es que el parámetro ausente caiga al alcance máximo
("sin id, borra todas"). Es una bomba, por dos razones que se juntan:

1. **El caso "aún sin identificador" existe SIEMPRE.** Lo recién creado
   todavía no tiene nombre: una conversación recién abierta no recibe su id
   hasta que el servidor contesta. El cliente que "siempre manda el id" lo
   manda vacío justo ahí, sin saberlo.
2. **La ausencia no es una decisión.** Nadie ESCRIBIÓ "todo": se cayó un
   campo. Leer un hueco como la orden más grande convierte un olvido en la
   pérdida máxima.

**Regla:** el alcance ausente cae al MÁS CHICO posible, o a un error que lo
diga (`motivo:"sin_id"`) — nunca al más grande. "Todo" se pide con su propia
palabra (`clear_all`), que nadie escribe por accidente. Y al auditar código
ajeno o viejo, todo `if (!id) borrarTodo()` es un hallazgo, no un
comportamiento heredado que se respeta.

**Por qué.** El 2026-08-24 Zak preguntó "¿no se le estarán borrando solitos?"
por su primer suscriptor (32 enviados, cero conversaciones). La causa
inmediata resultó ser otra (borró a mano, de a una), pero la sospecha destapó
que `mode:"clear"` sin id borraba el historial ENTERO, y que tocar "Eliminar
este reflejo" en una conversación recién abierta caía exactamente ahí. El bug
llevaba meses como "comportamiento viejo" documentado en un comentario.

### Changelog del protocolo

- **v47 (2026-08-25):** Paso 0-sextricies — en una orden destructiva, la
  ausencia de alcance jamás significa "todo": el alcance ausente cae al más
  chico o a un error que lo diga, y "todo" exige su propia palabra
  (`clear_all`). Lo recién creado aún no tiene nombre, así que el caso
  "sin id" existe siempre; y una ausencia no es una decisión.

- **v46 (2026-08-22):** Paso 0-quintricies — un contrato de forma se impone
  con gramática (salida estructurada de Ollama), no con instrucciones; y un
  JSON cortado por espacio se repara y se explica en vez de tirarse. El
  generador de locaciones pidió ocho claves exactas y el modelo devolvió las
  suyas; con `format` devolvió el contrato; y el corte por `num_predict` se
  leía como «no devolvió un objeto JSON».

- **v45 (2026-08-21):** Paso 0-quinvicies-bis — un SIMULACRO prueba el
  protocolo; solo el servicio REAL prueba el ACOPLAMIENTO. La Fragua pasó 49
  comprobaciones contra un ComfyUI de mentira (catálogo, subida, encolado,
  socket, sondeo de respaldo, abortos, errores del grafo y de ejecución) y, al
  encenderse el ComfyUI de verdad, cayeron dos cosas que el simulacro no podía
  enseñar porque su catálogo era de juguete: la elección automática emparejaba
  un ControlNet de SD 1.5 con un modelo base SDXL (no falla al elegir: falla
  dos minutos después con un error de tensores), y los motivos del servidor
  llegaban en inglés y en jerga. **La regla: el simulacro se escribe para
  ejercitar la MÁQUINA (tiempos, sockets, cancelaciones), y su catálogo se
  llena con los NOMBRES REALES del entorno de destino en cuanto se conozcan;
  hasta que el servicio real conteste una vez, la integración se reporta como
  «probada contra un doble», nunca como terminada.** Corolario del 0-quater:
  cuando el que falla es un servicio ajeno, sus mensajes son ruido en otro
  idioma hasta que se traducen POR CAUSA.


- **v44 (2026-08-19 · III):** Paso 0-quatertricies — si algo que NO tocaste
  empeoró, el sospechoso es lo que cambió a su ALREDEDOR. El Arquitecto pasó de
  dios de luz a piedra sin que nadie tocara su modelo: el cielo del templo pasó
  de crepúsculo a espacio profundo y su material PBR, de los que reciben luz y
  no la dan, se quedó sin nada que lo bañara. La sonda es «¿de qué depende esto
  que no vive en su archivo?», y la cura no es deshacer el cambio del entorno
  sino volver a la pieza independiente de él (aquí: que el cuerpo emita lo suyo,
  en vez de subir unas luces que habrían deslavado el mármol y el oro).
- **v43 (2026-08-19 · II):** dos pasos sobre el ALCANCE y la MEDIDA.
  **0-duotricies** — lo que se pide para UNA superficie no se aplica a las dos:
  el rediseño de Rachas pedido "en celular" se extendió a escritorio y ahí la
  columna angosta dejaba dos tercios de pantalla vacíos ("un chorizo"); la
  consistencia real es que cada cara resuelva bien su problema, y si se te
  ocurre que la otra lo necesita, se dice y se espera. **0-tertricies** — una
  medida que decide el layout no puede depender del layout que decide: la vara
  se fija (guardada en la forma base) y la consecuencia se recalcula en una
  segunda pasada; y esa vara se guarda con el valor del RENDER, nunca con un
  ref, que dentro de un layout effect va un paso atrasado y la corrompe en
  silencio para siempre.
- **v42 (2026-08-19):** dos pasos de device-QA en Android. **0-tricies** — un
  efecto afinado para un MOTOR puede tumbar al otro: el EdgeGlow (máscara
  compuesta + hijo al 175% girando) es gratis en WebKit y Chrome lo rasteriza
  en software, así que con diez tarjetas DESCARTA capas y las tarjetas
  "desaparecen"; la salida no es apagar el efecto sino reescribirlo con otra
  técnica de la misma percepción. **0-untricies** — una acción que ya está en
  el estado pedido tiene que acusar igual: "activar háptica" se reconocía al
  1.00 y se ejecutaba, pero como ya estaba encendida no cambiaba nada y el
  acuse era sonoro, así que desde el teléfono era idéntico a "no funciona"; el
  acuse pertenece a la petición, no al cambio de estado, y va en el mismo
  canal que lo pedido.
- **v41 (2026-08-18 · III):** dos pasos. **0-duodetricies** — apilar filtros
  razonables sobre un modelo débil lleva el rendimiento a cero: se estrecha el
  filtro mal definido, se ejecuta en código la regla que el modelo no cumple y,
  si no alcanza, se cambia la forma del flujo (más tiros baratos antes del caro;
  un catálogo que crece en vez de un ranking que se reescribe). **0-undetricies**
  — una defensa construida para una condición que ya no existe se vuelve el bug
  (la siembra levantaba la lápida de los dorados por un motivo que la papelera
  había vuelto innecesario).
- **v40 (2026-08-17 · X):** Paso 0-septvicies — el TESTIGO de una etapa se
  suelta al final de la ETAPA, no al final de su primera llamada. El juez de
  repetición, añadido como segunda llamada dentro de la etapa, heredaba un
  `AbortController` ya soltado: su chequeo de interrupción daba "sí" siempre y
  toda propuesta terminada se descartaba, sin fin, sin un solo error en
  consola. Trae la sonda que parte el caso en dos antes de tocar código (leer
  el ARCHIVO de lo producido: ocho propuestas guardadas y cero fricciones = la
  etapa termina y algo la tira después) y el arnés de la máquina entera con
  servicios falsos, que además demuestra el bug contra la versión vieja.
- **v39 (2026-08-17 · VI):** Paso 0-sexvicies — un archivo que se REEMPLAZA con
  el mismo nombre lo sigue sirviendo la caché. Tres efectos del Council se
  regeneraron con el mismo nombre y la verificación pasaba porque esta sesión
  los pedía por primera vez; la cura es que la URL cambie (`?v=2` donde el
  código la construye) y que el chequeo use la URL exacta del código. Refuerza
  además el **0-undecies** con un caso nuevo: probar la música de fondo con un
  mp4 SIN pista de audio dio "no arranca" (`video-only background media was
  paused to save power`) y parecía un fallo del reproductor; con audio real
  funcionaba. El dato de prueba tiene que parecerse al real justo en el eje del
  que depende el comportamiento.
- **v38 (2026-08-17 · IV):** dos pasos de la misma familia, medir el objeto de
  verdad. **0-quatervicies**: un archivo que promete N cosas se ABRE y se
  cuentan, y lo contado incluye si sirve (una animación de un fotograma es una
  pose); y cuando salga incompleto, se construye la ruta que no depende de él en
  vez de devolver el turno. **0-quinvicies**: copiar un objeto vivo puede dejar
  la copia atada al original (la malla clonada seguía obedeciendo al esqueleto
  original y el avatar se quedaba tieso en el centro del mundo); se diagnostica
  preguntando de quién depende cada mitad, no mirando lo que se dibuja.
- **v37 (2026-08-17):** Paso 0-tervicies — un cierre asíncrono tiene que decir a
  QUIÉN pertenece. El `catch` del turno abortado silenciaba la voz del turno que
  acababa de nacer, porque corre milisegundos después del corte: texto escrito,
  píldoras en verde y silencio perfecto, tres salas buscando la causa en el
  motor de audio. Toda limpieza que toque un recurso compartido comprueba antes
  que ese recurso siga siendo suyo.
- **v36 (2026-08-16 · VI):** Paso 0-duovicies — dos órdenes contrarias en un
  prompt: gana la que está pegada al dato, no la más enfática. El Nodo A repetía
  las jugadas ya aprobadas y dos salas habían endurecido la prohibición sin
  éxito; la culpable era una regla del ranking que ordenaba conservarlas "palabra
  por palabra" justo al lado del documento. Trae el corolario: no se le da al
  modelo el GUION de lo que se le prohíbe, solo lo justo para vetarlo, porque un
  catálogo de prohibidos bien redactado funciona como catálogo de plantillas.
- **v35 (2026-08-16):** Paso 0-vicies-semel — la causa se ANUNCIA después de
  probarla, no antes. Cazando por qué la voz del Council se quedaba muda
  encontré un marcador que se quedaba pegado en la ranura del socket y lo
  anuncié como "el bug, y es de una línea"; el arnés que escribí para
  demostrarlo probó lo contrario (ese marcador sí lo limpia el turno
  siguiente) y la causa real era otra: el navegador suspende el audio con la
  pestaña escondida y hablarle al micrófono no cuenta como gesto. Entre creer
  y decir va siempre una prueba que pueda salir mal; y cuando desmiente, eso
  es un éxito del método.
- **v34 (2026-08-15):** Paso 0-vicies — un ATAJO que decide no preguntar falla
  hacia el camino largo. El detector de intenciones del Council leía «En una
  frase: ¿qué es Fotón Cero?» como la orden *abre Fotón Cero* y la pregunta se
  perdía sin dejar rastro: los errores de un camino rápido son asimétricos
  (capturar de más se come la petición entera), así que se exige todas las
  señales, se descarta lo que suene a otra cosa, y se prueba con los casos que
  NO debe capturar.
- **v33 (2026-08-14):** Paso 0-undevicies — tu propia automatización puede
  DESHACER lo que acabás de hacer. El `git push` de la regla de oro disparó el
  auto-despliegue de Vercel, que reconstruye sin los instalables y se llevó
  producción por delante un minuto después de una publicación verificada; la
  app quedó diciendo "No se pudo consultar el servidor de versiones". Cuando
  dos caminos escriben el mismo destino, el orden se codifica en la
  herramienta, no en la memoria. Trae además el corolario de verificación:
  cada artefacto se comprueba en su propio término (el binario por tamaño, el
  JSON parseándolo) — un chequeo por tamaño daba por bueno un manifiesto que
  era la página de error, porque la página pesa MÁS que el manifiesto.
- **v32 (2026-08-11 · II):** Paso 0-duodevicies — un "NO HAY NADA" se confirma
  por otra vía antes de construir encima. Las 26 instancias de `<Domo />`
  dieron CERO perillas guardadas y sobre ese cero se armó la salida de Framer
  entera; eran 77, y el cero venía de que el archivo estaba corrupto en Framer,
  así que la API no podía resolver el esquema y devolvía la lista vacía. La API
  nunca dijo "no pude": dijo "no hay". El segundo camino tiene que ser de otra
  naturaleza (la pantalla, el disco, el bundle), y un vacío CONVENIENTE merece
  más sospecha, no menos. (Numerado 0-duodevicies porque una sala paralela tomó
  0-sexdecies y 0-septdecies el mismo día.)
- **v31 (2026-08-11):** dos pasos nuevos de la misma familia —medir el objeto
  correcto—. **0-sexdecies**: lo que MIDE y lo que OCURRE tienen que ser el
  mismo objeto; si uno trabaja sobre el texto limpio y el otro sobre el crudo,
  el desfase se acumula en proporción a cuánto difieren y se ve bien al
  principio (la palabra dorada del Espejo, que derivaba solo en los párrafos
  con negrita). **0-septdecies**: una instrucción del sistema jamás viaja en el
  campo del usuario ni consume su cupo (la directiva de la Matriz se comía
  2.885 de los 4.000 caracteres y mataba los dictados largos).
- **v30 (2026-08-10):** Paso 0-quindecies — la MÉTRICA puede estar hecha a la
  medida del diseño viejo. Midiendo si la salida del reflejo quedó pareja, el
  control ganaba (0.14 contra 0.39) porque la vara comparaba el salto entre
  PINTURAS y el diseño anterior pintaba pocas veces con saltos grandes pero
  parecidos: regular por construcción. Muestreada por cuadro, que es como se
  percibe, la comparación se invirtió a 4.52 contra 0.38. La señal es un control
  que gana en un número que contradice lo que se ve; la cura es medir lo que la
  persona percibe, en la base más neutra posible.
- **v29 (2026-08-08):** 🜂 **Paso 0-quaterdecies — borrar código con texto
  exacto, nunca con rangos calculados** (reglas dictadas por Zak). Un script
  que buscaba el cierre de un bloque por `</div>` + `)}` borró 2.693 líneas
  contiguas de `EV_Oraculo.tsx`, y el archivo no estaba en git porque 175 de
  los 222 fuentes de `escaner-app` nunca se habían commiteado: no hubo
  restauración posible y hubo que reconstruir desde el bundle minificado,
  perdiendo los comentarios de esa región. La regla trae las dos lecciones: el
  método (anclar en texto único) y la infraestructura (comprobar que el árbol
  tiene red ANTES de automatizar sobre él). `escaner-app` quedó en git y con
  remoto privado en GitHub el mismo día.
- **v28 (2026-08-04):** 🜂 **Paso de APERTURA — el archivo maestro se pesa al
  abrir la Sala.** `wc -c CLAUDE.md` antes de la primera lectura de código:
  bajo 150 K no se dice nada, entre 150 K y 250 K se avisa en una línea, y
  arriba de 250 K se pide el barrido ANTES de empezar. El barrido consiste en
  presentarle a Zak la lista NUMERADA de `Pendientes vivos` y que él conteste
  con números qué ya está hecho; lo marcado se borra. Pedido de Zak tras la
  limpieza de la v27: el Paso 3 ya mandaba limpiar pero al CIERRE, y al cierre
  siempre hay prisa por sellar — pesarlo al ABRIR es lo que hace que ocurra.
- **v27 (2026-08-04):** 🜂 **NUNCA se anotan builds ni deploys como
  pendientes** (Paso 2 y Paso 3). Motivo, textual de Zak: *"el build compilado
  de eso no me vuelvas a poner que queda pendiente... ya eso es todo tu
  trabajo, no estarme recordando"* y *"lo mismo con las funciones por
  desplegar, nunca me vuelvas a recordar eso"*. El `.md` había acumulado 34
  marcadores de build y 40 migraciones citadas: 20% del archivo eran recordatorios
  de cosas que él ya hace solo. De versiones se guarda únicamente cuál vive en
  la tienda. En la misma sala se ejecutó la limpieza de fondo que el Paso 3
  venía pidiendo sin cumplirse: el archivo pasó de 1.298.085 a ~90.000
  caracteres (205 entradas de historial → 2), con la arqueología completa
  respaldada en `admin/CLAUDE_archivo_hasta_2026-08-04.md`.
- **v26 (2026-08-04):** Paso 0-terdecies — lo EFÍMERO se mide contra el reloj.
  Comparar cuándo mediste con cuánto vive lo que buscas (`performance.now()` en
  la misma medición): el panel de vista tarda segundos en devolver el control,
  así que algo de vida corta SIEMPRE se leerá como ausente.
- **v25 (2026-08-03):** Paso 0-duodecies — la lógica pura verificada NO prueba
  la máquina asíncrona. Si el diff mueve una operación async al camino
  caliente, hay que modelar el reloj o instrumentar en device.
- **v24 (2026-08-03):** Paso 0-nonies gana su tercer punto: que el código nuevo
  LLEGÓ no prueba que la página VIVA. Toda publicación cierra confirmando que
  renderiza y que la consola está limpia.
- **v23 (2026-08-03):** Paso 0-undecies — el caso de prueba debe parecerse al
  REAL en la dimensión que importa (texto largo si el layout depende del largo,
  etc.). Un dato benigno da un OK falso.
- **v22 (2026-08-02):** Paso 0-decies — un catálogo que promete cobertura total
  se enumera contra la fuente, no desde la memoria.

*El changelog completo (v1 a v21, 2026-04-18 → 2026-08-01) vive en*
`admin/CLAUDE_archivo_hasta_2026-08-04.md`.

---

## 🜃 Historial de sesiones

#### 2026-08-25 · 🜂 SALA LARGA DEL ESCÁNER: ANDROID EN GOOGLE PLAY, LA ESCUCHA Y EL SEGUIMIENTO EN EL ESPEJO, Y EL PRIMER SUSCRIPTOR AUDITADO

- ✅ **Resuelto** (Espejo original de escritorio, salvo nota):
  1. **La escucha automática y el seguimiento llegan al modo origen** con la
     llave compartida de la Matriz (misma maquinaria de tramos precalentados;
     arnés 16 ✓; la voz arranca al 25% de lo escrito). Teclas V y S, botón
     cian de seguimiento, interruptor de escucha en la tarjeta de voces.
  2. **En el teléfono, imagen/presencia/seguimiento son filas con interruptor
     en el menú del sigilo** (no cierran el menú; mantener pulsada Presencia
     la arma con voz). El compositor abre a todo el ancho desde la 2ª línea
     también en computadora (vara fija, un solo salto, medido sin rebotes).
  3. **Cmd+F busca dentro de la charla** (resalte nativo cian + dorado, salto
     directo) y **"Ver atajos"** cuelga de "¿Qué es el Espejo?" con las cinco
     teclas reales. El envío suena como botón (tic + arpegio). La bocina dice
     la verdad mientras la voz vive (sello fuera del componente) y la frase
     dorada volvió (la voz recibe el texto limpio). El orbe de comandos por
     voz duerme TODA la Presencia (avisos firmados que se cuentan, no un
     interruptor compartido).
  4. **Android salió en Google Play**: correo de celebración en
     `admin/correos/android-lanzamiento.*` (logo, CCO, texto plano) y la
     landing `escanervibracional.com` apunta a la tienda ("Descárgala ahora").
  5. **/fragmentos → /fotoncero** (el título sigue siendo Fragmentos del Sol)
     y el episodio se abre solo con su título, sin sinopsis. La directriz del
     Consejo Solar vive en el Slate (episodios completos 10-12 min, 16:9,
     provocar un estado, y la vara: si no cabe en UNA frase, no está lista).
  6. **Motor**: la ficha del nodo dice conversaciones VIVAS + huella de
     borrados (cuándo y cuántos, jamás el contenido) y qué WALLPAPERS
     descargó (tarjeta bajo demanda con miniaturas, cofre por página,
     "Recargar" pide fresco).
- 🐛 **Bug cazado por sospecha de Zak** ("¿no se le estarán borrando
  solitos?"): `mode:"clear"` SIN conversation_id borraba el historial ENTERO
  del Tripulante, y el caso existe siempre porque una conversación recién
  abierta aún no tiene id. oraculo-chat v1.48 exige `clear_all` explícito y
  el cliente ya ni viaja sin id. **El primer suscriptor NO fue víctima de
  eso**: borró 6 veces de a 1 (98 mensajes), paga semanal, selló los 6
  pilares al 100 en 25 min de madrugada → persona celosa de su privacidad
  explorando la app, no un bot.
- 📁 **Archivos:** escaner-app `EV_Oraculo` v6.17 · `EV_Rafaga` v5.31 ·
  `NodoDeVoz` v2.5 · `espejo.es/en` v1.23 · **escritorio 1.1.27 LIVE**.
  Code: `Domo` v5.9 · `FragmentosDelSol` v2.1 · `MI_Detail` v1.27.
  rsv-web `salas.ts` v2.20 · landing `index.html` v1.2.
- 🗄️ **SQL:** ✅ `20260824_huella_borrado_espejo` (Zak la corrió) ·
  ⏳ `20260825_wallpapers_por_nodo` (falta pegarla; sin ella el botón de
  wallpapers de la ficha dirá "no se pudo leer").
- 🔌 **Edges:** `oraculo-chat` v1.48 (huella del borrado + clear_all) ·
  `admin-action` v1.54 (`admin_get_user_wallpapers`).
- 💡 **Decisiones:** DeepSeek `v4-flash-vision-exp` NO se conecta (5× el
  costo de salida en TODO el texto y es experimental de 3 días; re-mirar al
  salir de `exp`, y si entra, SOLO al camino de imágenes con Gemini de
  respaldo) · lo borrado del Espejo NO se conserva ni temporalmente: solo la
  huella · el modo profundo en el teléfono se propuso como botón "Ir más
  hondo" BAJO la respuesta (no un interruptor); sin decidir · avisos de
  wallpapers nuevos: sello NUEVO + badge por marca local + push por TANDA
  reutilizando la infra existente; sin construir · dominios de Clerk: sobran
  `app.escanervibracional.com` y `app.redsolarviva.com` ($20/mes);
  `escaner.redsolarviva.com` se queda (lo usan las apps nativas).
- 🔧 **Patrones nuevos:** changelog v47 (0-sextricies: la ausencia de alcance
  nunca significa "todo").

#### 2026-08-22 · EL COUNCIL: TOMAS CON VIDEO/VOZ/MÚSICA, LA TIRA, TRAMA, GENERADOR DE LOCACIONES Y LA FRAGUA (comprimida; incluye 08-20 y 08-21)

- 💡 **Decisiones:** el archivo maestro ya NO guarda pendientes del Council ·
  los videos de la Tira nacen mudos (voz y música son de la casa) · un
  contrato de claves a un modelo local se IMPONE con gramática (salida
  estructurada de Ollama), no con instrucciones; un JSON cortado por espacio
  se repara y se explica · la Fragua es UN CAMINO MÁS, nunca condición ·
  los desplegables de modelos se llenan con lo que el SERVIDOR dice tener ·
  el panel de Densificación edita la Producción real (una sola fuente).
- 🔧 **Patrones:** simulacro vs servicio real (0-quinvicies-bis, v45) ·
  selector derivado en useSyncExternalStore = bucle. Todo el detalle vive en
  [[proyecto_densificacion_foton_cero]] · [[proyecto_council_solar]] y el
  código (`rsv-web/src/council/`).

*Las entradas anteriores (2026-04-18 → 2026-08-19) viven en*
`admin/CLAUDE_archivo_hasta_2026-08-04.md`. *No se cargan por sesión: lo
durable de cada una ya está en las memorias y en el código.*
