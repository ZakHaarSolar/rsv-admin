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

- **Inmersión Solar** — 1,999 MXN/mes (Stripe subscription recurrente,
  membresía completa).
- **Sintonía Solar** — 777 MXN/mes (Stripe subscription recurrente,
  membresía base). **Stripe Payment Link activo:**
  `https://buy.stripe.com/bJe9AMe1DcVc9cRdPC0RG0C`. **Product ID:**
  `prod_UOf1RrEypuWFTg` (mapeado a `group_name='sintonia'` en
  `admin/supabase/functions/stripe-webhook/index.ts` PRODUCT_GROUP_MAP).
  El link tiene "Collect customer's email address" + "Collect name"
  habilitados → `prefilled_email` que mandamos por query string sí
  pre-rellena el campo (verificado 2026-04-25).
- **Cámara de Resonancia (Sesiones 1:1 con Zak'Haar)** — pago único vía
  motor nativo:
  - 30 min · Afinación Rápida — 1,333 regular · 888 miembro
  - 45 min · Recalibración — 1,777 regular · 1,111 miembro
  - 60 min · Reconfiguración Profunda — 2,222 regular · 1,444 miembro
- **Pase de Exploración (Cámara Solar grupal)** — 555 MXN pago único.
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

### 🟠 EL ESPEJO NO DESLIZA EN UNA CUENTA, SOLO EN iPHONE (ABIERTO, 2026-08-11)

Con una cuenta de prueba **que SÍ es miembro** (Sintonía), el reflejo largo del
Espejo no se puede deslizar en el iPhone: la parte de abajo del mensaje queda
inalcanzable. **La MISMA cuenta sí desliza en escritorio**, y la cuenta
principal de Zak sí desliza en ese mismo iPhone.

- **Descartado:** la membresía (es miembro y falla igual).
- ⚠️ No pedirle que toque nada que esté al pie del mensaje: eso es exactamente
  lo que no puede alcanzar (error ya cometido una vez).

🜂 **2026-08-12 · IX — LA VARIABLE NO ERA LA CUENTA, ERA CUÁNTO CONTENIDO
TIENE.** Zak aportó el dato que faltaba: *"en esta cuenta solo tenemos este
mensaje"*. Su cuenta principal tiene decenas, y en escritorio ese único
intercambio ni siquiera necesita scroll — o sea que "(cuenta × plataforma)" era
en realidad **(cantidad de contenido × motor)**, que sí tiene causa mecánica.

El bloque de mensajes del scroller (`EV_Oraculo`) se apoyaba al fondo con
`marginTop: auto` y **no declaraba `flex-shrink`**, o sea que valía 1: un
elemento que puede comprimirse, colgado de un margen que solo se anula cuando
el motor resuelve bien el espacio libre NEGATIVO. Con mucha charla el
desbordamiento es enorme y no hay ambigüedad; con un solo intercambio largo
excede por unos cientos de píxeles, y ahí el reparto se resuelve distinto según
el motor: el bloque se comprime, su texto se pinta fuera de su caja (visible,
por eso se LEE cortado) y el scroller no cuenta nada de eso como desplazable.

**Arreglado en EV_Oraculo v5.7** haciendo el reparto explícito: un espaciador
hermano (`flex: 1 1 auto; min-height: 0`) toma el espacio libre cuando sobra y
se encoge a cero cuando falta, y el bloque de mensajes lleva `flexShrink: 0`.
Medido en laboratorio contra la versión anterior en cinco regímenes de
contenido (sobra mucho · cabe justo · apenas desborda · desborda poco · desborda
mucho): **resultados idénticos** en scroll disponible, compresión y apoyo al
pie. O sea, cero cambio visual; lo que se retira es la dependencia de cómo cada
motor resuelva un margen automático.

- ⏳ **Falta confirmarlo en el iPhone**: el laboratorio corre en Chromium, que
  es justo donde el bug NO se reproduce (por eso escritorio funciona). La
  prueba que lo cierra, con esa cuenta en el teléfono: abrir un reflejo con
  UN solo intercambio largo y ver si ya desliza.
- Si SIGUE trabado, la siguiente hipótesis viva es que algo se traga el gesto
  (una capa invisible por encima del scroller) y no el reparto de alto; ahí la
  prueba que parte el caso es si con esa cuenta deslizan las OTRAS capas
  (Radar, Holoteca, Bitácora) en ese mismo iPhone.

### ✅ CERRADO — el Espejo negro al cambiar de modo era UN HOOK MAL COLOCADO (2026-08-11 · V)

`RafagaOverlay` llamaba **97 hooks apagado y 98 encendido**: el efecto que le
pregunta al cofre qué reflejos ya tienen voz guardada (el de "Volver a
escuchar", que entró con la v5.0/v5.1) había quedado DEBAJO del
`if (!abierto) return null`, y `abierto` ES el modo. React tolera cualquiera de
los dos números al montar —por eso entrar y F5 siempre funcionaron en las dos
caras— pero jamás que cambien entre un render y el siguiente. Al cruzar de modo
lanzaba «Rendered more hooks than during the previous render» al encender y
«Rendered fewer hooks than expected» al apagar; y como la app **no tiene ni una
sola frontera de error** (cero `componentDidCatch`/`getDerivedStateFromError`
en todo `src/`), React desmontaba el árbol ENTERO. Eso explica el negro TOTAL y
perfectamente simétrico. Arreglado en `EV_Rafaga` v5.2 subiendo el hook arriba
del return; su guarda interna lo deja igual de inerte con el modo apagado.

🜂 **Las tres pistas que descarrilaron dos salas, y por qué:**
1. **«La consola está LIMPIA»** — no lo estaba. Medido en navegador, el error
   sale como `Uncaught Error` MÁS un `console.error` de React nombrando el
   componente. Un "no hay nada" se confirma por otra vía (Paso 0-duodevicies).
2. **«El rollback a `escaner-5dzragsj4` no lo arregló, así que es más viejo»** —
   ese build es de hoy ~09:49 y **ya traía el hook**. Un rollback solo descarta
   lo que el build de destino NO tiene: hay que verificar eso antes de deducir
   antigüedad.
3. **`setNavAbierta(false)` en los dos handlers** — la simetría era real pero
   apuntaba al síntoma. Lo simétrico era el conteo de hooks, no la línea
   compartida.

Un barrido por AST encontró DOS más del mismo defecto y quedaron cerrados el
mismo día: `Sonda` en `EV_Radar` v3.29 (tenía **32 hooks** debajo del return de
"este pilar no tiene sondas"; se partió en puerta + cuerpo, que es lo correcto
cuando hay muchos hooks abajo) y `TimelineChart` en `EV_Recal` v2.5 (3 hooks
izados arriba del return de "0 ciclos"). **Toda la app está en cero**: el
auditor recorre el cuerpo de cada componente sin entrar a funciones anidadas y
compara la línea de cada hook contra la del primer return temprano.

🜂 **2026-08-14 — el trabón de la LECTURA en el mismo Espejo quedó cerrado**
(era la primera costura de la voz, `espejoVozFish` v2.26); el deslizamiento
del reflejo largo en ese iPhone sigue sin confirmarse.

**Versión en circulación:** App Store **1.1.3 LIVE**, en curso **1.1.4**.
Android: primera versión en Prueba interna. Detalle en
[[referencia_version_en_tienda]].

---

### 🔴 Requieren mano de Zak

- **🖥 FIRMA Y NOTARIZACIÓN DE LA APP DE ESCRITORIO.** El `.dmg` sale sin
  firmar: en la Mac de Zak abre porque la compiló él, pero **cualquier otra
  persona que lo descargue verá que macOS lo bloquea** ("no se puede
  comprobar el desarrollador") y tendrá que abrirlo con clic derecho. Para
  distribuirlo de verdad hace falta un certificado **Developer ID
  Application** (distinto del de App Store) y notarizarlo. Es lo único que
  separa la descarga actual de una descarga profesional.
- **🖥 SOLO APPLE SILICON.** El instalable es `aarch64`: un Mac Intel no lo
  puede abrir. Si aparece alguien con Intel, se resuelve con un build
  universal.


- **🟠 Google Play — LA CADENA DE COBRO YA ESTÁ ARMADA ENTERA (2026-08-14).**
  Quedan solo dos cosas, y ninguna es de configuración:
  · **La prueba de compra en un teléfono de verdad**, que es lo único que
  demuestra que la cadena sirve. El tester abre el muro y debe ver **499 y
  149**; si compra, no le cobran. Nada de lo configurado está probado hasta
  que eso ocurra.
  · **Que Google apruebe el acceso a producción.** Solicitud enviada el
  mié 12-ago 5:26 a.m.; dicen hasta 7 días. Hasta entonces Producción sigue
  Inactivo y la venta no se puede encender aunque todo lo demás esté listo.

  🜂 **Lo que se armó ese día, para no volver a preguntarlo:** Prueba interna
  con la vc5 publicada · el tester en las DOS listas (verificadores de prueba
  interna + prueba de licencia, que son distintas y las dos hacen falta) ·
  productos `sintonia_solar_monthly:mensual` (499/mes) y
  `sintonia_solar_weekly:semanal-1w` (149/sem) activos en 174 regiones, con
  cobro INMEDIATO al cambiar de plan · cuenta de servicio con permisos
  MÍNIMOS (solo los dos de Datos financieros, sin Administrador y sin
  permisos de app sueltos) · RevenueCat con credenciales válidas, los dos
  productos publicados, `sintonia_active` en ambos y los paquetes
  `$rc_monthly` / `$rc_weekly` con su producto de Android adentro.
  · ✅ La huella de Play App Signing ya estaba en el `assetlinks.json`:
  identificadas con `keytool` la de SUBIDA (`06:AA:…`) y la de DEPURACIÓN
  (`DD:B0:…`), la restante (`16:04:…`) solo puede ser la de Play.
  Detalle en [[proyecto_android_port]].

  ⚠️ **Trampas que se cobraron tiempo ese día y pueden repetirse:**
  (1) el plan base del producto semanal nació con período **Mensual** aunque
  se llamara `semanal`, y el período **no se puede editar**: hubo que crear
  `semanal-1w` y desactivar el viejo. Verificar SIEMPRE que diga "Semanal,
  renovación automática" antes de guardar.
  (2) El paquete `$rc_weekly` de RevenueCat ya existía con nombre "Acceso
  Completo" y solo le faltaba la fila de Android; crear uno nuevo habría
  duplicado el paquete Y roto la app, porque el código busca **exactamente**
  `$rc_weekly` sin ningún plan B (`revenuecat.ts`, `WEEKLY_PACKAGE_ID`).

---

### 🔵 Decididos, sin construir

- **🎬 FOTÓN CERO: DENTRO DE RED SOLAR VIVA, NO AL LADO — consulta respondida
  (2026-08-13 · II).** Zak preguntó si la casa productora debe tener su propia
  página y si entonces Fragmentos del Sol saldría de Red Solar Viva.
  **Recomendación: el planeta pasa a llamarse Fotón Cero AHORA, la obra sigue
  viviendo dentro de redsolarviva.com, y el dominio se queda reservado
  apuntando a la portada que ya existe.** La regla que usan las casas con
  sellos (Disney→Pixar, Alphabet→Google): un sello se muda a su propia casa
  cuando tiene **público propio**, no cuando tiene nombre. Hoy quien ve
  Fragmentos del Sol llega por Red Solar Viva; nadie busca "Fotón Cero"
  todavía. Partir el tráfico antes de la masa crítica es el mismo error que
  Zak ya identificó entre la web y la app de escritorio: dos casas con poca
  gente se sienten vacías, una casa con todo se siente viva.
  · **La señal para mudarlo**: una segunda serie, clientes externos, o gente
  llegando por el nombre del sello. Ahí Fotón Cero se lleva la obra y Red
  Solar Viva la ENLAZA en vez de contenerla.
  · **Qué sí conviene hacer ya**: renombrar el planeta (marcar el lenguaje
  temprano es barato; renombrar cuando la gente ya aprendió el mapa, no), y
  que adentro Fragmentos del Sol se presente como LA SERIE de Fotón Cero. Así
  el visitante aprende los dos niveles de una vez. Sin construir.



- **🧭 EL BUCLE DE CORRECCIÓN DEL ESPEJO — consulta respondida (2026-08-13 · II).**
  Zak preguntó cuál es el workflow cuando la Matriz contesta algo que no va con
  la visión. **Recomendación: NO contárselo a Claude cada vez.** Ese camino
  pierde el juicio en el momento en que existe y cuesta una sala entera. El
  patrón correcto ya está construido y probado en el **panel de Voz del Motor**:
  la app captura lo que falló, Zak lo lee agrupado, y de ahí sale la ley del
  prompt. Lo mismo para el Espejo: **un gesto en el reflejo mismo ("esto no me
  representa") con un campo corto opcional para el ángulo correcto** → tabla
  propia → Motor → "Espejo". La corrección se captura en caliente, con el
  reflejo delante, que es cuando el juicio es preciso; y el par (reflejo,
  corrección) es exactamente el material del que salen las leyes del prompt y,
  más adelante, los ejemplos few-shot. **Sin construir**: Zak decide cuándo.
  · Regla que ya quedó viva de esa consulta: las leyes de PENSAMIENTO van al
  prompt del servidor bajo la bandera del carril (`efimero` = Matriz), no al
  cliente — así aplican al instante en las tres superficies, sin build.

- **🖼️ EL VISUAL DE LA MATRIZ ES DE UNA SOLA NATURALEZA: LA ESCENA
  (2026-08-13 · II).** El diagrama (⟦DIA⟧, nacido en la v3.7) se retiró: un
  diagrama es una **estructura simbólica con texto legible** y la difusión
  genera **textura, no símbolos** — por eso salían etiquetas alucinadas
  ("Wéb deployment uree", "Rendermesiio", "CPUK"), IGUAL en Schnell que en Pro.
  El límite es del MEDIO, no del modelo ni del prompt: no volver a intentarlo
  subiendo de modelo. **El camino real, si algún día se quiere el diagrama:
  que lo dibuje el CÓDIGO** (SVG o mermaid emitido por el propio modelo, que sí
  es excelente escribiendo estructura) — texto legible, paleta de la casa,
  instantáneo y sin costo de generación. Sin construir.

- ~~**🎚️ SELECTOR DE PROFUNDIDAD + RESUMEN VIVO DEL HILO**~~ → ✅ **CONSTRUIDO
  el 2026-08-11 · II.** Los dos viven en el código (`EV_Rafaga` v4.7,
  `EV_Oraculo` v4.6, `oraculo-chat` v1.38, escritorio LIVE). Lo que queda
  anotado porque no se deduce del código: **el carril profundo es
  `deepseek/deepseek-v4-pro`, NO el `r1`** que estaba mapeado desde el piloto
  viejo (mitad de costo en la salida, generación de hoy, misma familia que el
  rápido → la voz del Espejo no cambia de personaje); y **el precio de la
  profundidad es la ESPERA**: medido contra el catálogo vivo, el primer
  carácter que se ve tarda ~25 s contra 0,6 s del rápido, con 36 s de reflejo
  completo contra 5,5 s. Por eso el servidor manda un latido de pensamiento y
  la espera se hace más lenta y se nombra. Costo por reflejo: 0,106 MXN
  profundo · 0,011 MXN rápido · 0,004 MXN la destilación del resumen.

- **🎵 PIKA API CLUB — consulta respondida (2026-08-14).** Zak preguntó si
  conviene mudar los SFX ahí y si su modelo de audio está al nivel de Suno.
  **Pika API Club (agosto 2026) NO es un modelo de música propio: es un
  REVENDEDOR mayorista** de ~100 modelos ajenos (video, imagen, audio, voz,
  LLM) a $10 USD/mes de membresía más pago por uso, con $10 de crédito el
  primer mes. Para música revende MiniMax Music 3.0 ($0.09 USD/pedido ≈ 1,80
  MXN por canción) y Sonilo; para SFX revende Eleven Text to Sound v2 y Lyria.
  · **Recomendación: NO mudarse.** Los SFX de la casa son ~10 archivos que se
  generaron UNA vez y viven en el repo: el costo de generarlos es
  prácticamente cero y cambiar de proveedor no ahorra nada real. La membresía
  fija de $200 MXN/mes costaría MÁS que todo lo que gastamos en sonido.
  · **Al nivel de Suno: no, y no es la comparación correcta** — Pika no compite
  con Suno, lo que ofrece es acceso barato a modelos de terceros. Suno sigue
  sin API pública oficial (los que la venden son reventa).
  · **Cuándo SÍ valdría:** el día que [[proyecto_musica_en_la_app]] pase de
  plan a producto y haya que generar decenas de piezas por mes, o si algún día
  se hace video. Ahí la membresía se amortiza sola y el panel tiene sentido.
  Sin construir.

- **🗣️ VOZ · el plan maestro por fases** (trazado 2026-08-06). Fases C, D y
  **E (contexto vivo, construida 2026-08-13)** listas: pila central en
  `lib/vozContexto` — Rachas, Bitácora, Plan y el modal de respuesta del orbe
  publican su lista numerada tal cual se ve, el contexto viaja con cada frase
  (`useComandoVoz` v3.0) y voz-intent v1.10 resuelve "la de arriba" / "esa" /
  "la 2" / "el duplicado" devolviendo el título EXACTO, que los ejecutores de
  siempre ya saben usar. Sigue **F** (preguntarle a la app: rachas, Fotones,
  cooldown del Radar), **G** (mensajes con confirmación, avatar, reproductor,
  cámara directa, Espejo) y **H** (el agente + "Oye Escáner" + la Sonda
  hablada). Detalle en [[proyecto_voz_plan_maestro]].
  · ⏳ Falta el device-QA de la Fase E en el teléfono (decir "elimina la
  primera" con Rachas abierta, "la de arriba" en Bitácora, "esa" sobre el
  modal de respuesta).
  · 🜂 Descartados por Zak (2026-08-13, no volver a proponer): el mapa de
  giros de la Matriz y la i18n Fase 3 (contenido de DB + edges).

- **MÚSICA PROPIA DENTRO DE LA APP — plan TRAZADO (2026-08-05), sin
  construir.** 7 álbumes que hoy solo viven en Spotify. **Dónde:** una card
  más en el tablero de la **Holoteca** (8ª, sub-tab lazy como los demás).
  **Archivos:** mismo bucket R2 de los audiolibros, carpeta
  `Musica/<slug-album>/NN-titulo.m4a` + `cover.jpg`; **.m4a AAC** (streaming
  directo, mitad de peso que .mp3). **Catálogo en DB** (`music_albums` +
  `music_tracks`, patrón `wallpapers`, editable desde el Motor sin build) —
  con ~70 pistas, hardcodear obliga a un build por canción. **Lo único de
  motor que falta: la COLA** (capa fina sobre `lib/audiobookPlayer`, que ya es
  global y trae mini-barra; sabe UNA pista, no una lista). **Acceso
  recomendado: escuchar GRATIS** (la misma música ya es libre en Spotify;
  amurallarla adentro la vuelve peor que afuera). Lo de Sintonía sería lo que
  Spotify no tiene: versiones extendidas, tomas sin publicar, sin conexión,
  estreno anticipado. **Fase 1 = UN álbum y medir si lo escuchan.** **NO se
  quita Spotify.** Detalle en [[proyecto_musica_en_la_app]].

- **🌐 i18n FASE 3** — traducir lo que vive en DB (sondas del Radar,
  calibraciones, rituales, medallas, wallpapers) y en edges (dictámenes de
  los Decodificadores, Espejo, push, correos). Estrategia por-superficie:
  columna/tabla de traducción en DB + prompt por idioma en los edges. La
  FASE 2 (cliente completo, ~1.725 claves) está cerrada. Detalle en
  [[proyecto_i18n_escaner]].

- **📱 LANDSCAPE fases 3 a 6** — Mi Núcleo (maestro-detalle) · Decodificadores
  + Espejo · Sondas/ceremonias · Simuladores. Fases 1 y 2 (Radar + sub-flujos
  y Holoteca) están hechas. Detalle en [[proyecto_landscape_horizontal]].

- **🎙️ VOZ QUE HACE — el plan por fases (norte de Zak, 2026-08-05: "todo lo
  que podrías hacer en la pantalla lo podrás hacer con tu voz").** Fase A
  (rachas: crear con título+tiempo · reiniciar/pausar con permiso · reanudar)
  y **Fase D para rachas** (la IA de respaldo `voz-intent` v1.1 interpreta
  acciones completas — Groq si hay `GROQ_API_KEY`, si no OpenRouter — también
  en sesión cuando la frase menciona una racha) quedaron CONSTRUIDAS ese día,
  con ceremonia de racha sellada al aterrizar. En la reapertura de la sala
  quedó también la **Fase B** (Plan de Vuelo agregar/completar · Sendero
  sellar por nombre · Bitácora nota dictada/carpeta) y la IA (70b, few-shots
  de las frases reales) pasó a ser el CEREBRO de todas las familias; lo local
  es red sin conexión. Los verbos destructivos YA se detectan (no navegan mal);
  su ejecución es la **Fase C** (eliminar SIEMPRE con la tarjeta de permiso que
  ya existe, renombrar, Realidad Elegida). Principios fijos: destructivo pide permiso siempre · los
  parámetros esperan el fin de la frase · toda acción muestra la capa
  afectada. Detalle en [[proyecto_comandos_voz]].

- **🔭 VISIÓN 3 AÑOS — consulta respondida (2026-08-05).** La escena y los
  ángulos 100% en [[proyecto_vision_escaner_3_anios]]: HealthKit como suelo
  de verdad del pilar CUERPO · el Espejo se vuelve el AGENTE que ejecuta el
  mismo catálogo de acciones de la voz · palabra de activación "Oye Escáner" ·
  Apple Watch · la lectura semanal proactiva que cruza Radar + rachas +
  Sendero + Decodificadores.

---

### 🟡 Higiene, cuando toque

- 🜂 **`rsv-web/` NO TIENE RED (verificado 2026-08-13).** Es el único proyecto
  del ecosistema sin repo git, y desde el corte de DNS es el que SIRVE
  `redsolarviva.com`. Lo suyo propio son ~228 KB (`main.tsx`, el shim de
  Framer, `domo-perillas.ts` con las 77 perillas cosechadas y las 3 capas de
  legado) más 66 MB en `public/` que son las imágenes y el video bajados del
  CDN de Framer — o sea, lo irrecuperable si se borra la carpeta, porque la
  cuenta de Framer se cancela. Los otros cuatro sí tienen remoto privado en
  GitHub: `escaner-app`, `Code` (rsv-code), `escaner-landing` y `admin`.
  ⚠️ `Code` tiene **68 commits sin subir** y `escaner-app` **10**: existir el
  repo no es lo mismo que estar respaldado.
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

## 🜂 Protocolo de Cierre de Sesión · v33 (2026-08-14)

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
tiene cuatro destinos con velocidades distintas:

| Destino | Cómo llega | Cuándo lo ve Zak |
|---|---|---|
| Web de Framer (`Code/`) | watcher automático | al instante |
| Escritorio (`app.escanervibracional.com`) | **deploy a Vercel — lo corre CLAUDE** | al terminar el cambio |
| Celular · iOS | **build de Xcode — lo hace ZAK** | cuando lo compila |
| Celular · Android | **AAB por terminal — lo arma CLAUDE** | cuando se lo pide |
| Backend (SQL / edges) | SQL Editor / `functions deploy` | cuando Zak los corre |

Si un cambio necesita deploy o build para verse, eso va **arriba**, en
"Lo que tenés que hacer", no diluido al final.

🜂 **El celular son DOS caminos con dueños distintos.** El código es UNO (un
cambio sirve para las dos plataformas, no se pide dos veces), pero **iOS lo
archiva Zak en Xcode** y **el `.aab` de Android lo compila Claude** por
terminal (`vite build` + `cap copy android` + `gradlew bundleRelease` con la
llave de firma que vive fuera del repo). Y **un paquete ya compilado NO
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

### Changelog del protocolo

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

#### 2026-08-14 · 🜂 FIDELIDAD ANTE TODO (el español roto era COMPRESIÓN, no el prompt) · EL SELLO DE LA ESPERA · LA APP DE macOS ES UN DESTINO APARTE · FOTÓN CERO EN LA PORTADA

- ✅ **Resuelto:**
  - **🜂 EL ESPAÑOL ROTO ERA EL ANFITRIÓN, NO EL PROMPT.** "peatonales
    peatonales", "tiriada", "cellulos", "piel tal en tu mano". Medido en el
    catálogo de OpenRouter: seis anfitriones sirven el modelo comprimido a la
    MITAD de su precisión nativa (fp4) y varios no declaran nada. Ahora la
    lista blanca es declarada-fiel (`QUANTS_FIELES`, sin "unknown") y aplica a
    LOS DOS modos y a las dos rutas. Detalle en
    [[referencia_openrouter_cuantizacion]].
  - **EL CARRIL PROFUNDO ESTABA EN EL BUILD DE ABRIL.** La sala del 13 anotó
    "mismo id, nada que cambiar" y no era así: `deepseek-v4-pro` y
    `deepseek-v4-pro-0813` son endpoints DISTINTOS, con fechas y precios
    distintos. Pinneado al 0813.
  - **🔴 EL BORRADOR NO SE PERDÍA: SE BORRABA.** La llave lleva el id de la
    cuenta, que no existe en el primer cuadro; el campo nacía leyendo "anon" y,
    al aterrizar la identidad, el guardado corría con el campo vacío y hacía
    `removeItem` sobre lo escrito. Mismo defecto que se llevó dos
    conversaciones de la Matriz. Curado en las tres puertas: no se escribe
    nada antes de haber leído.
  - **LA MARCA ⟦RES⟦ SALÍA COMO TEXTO** y con ella tres fallas a la vez
    (resonancia en cero, marca a la vista, voz desfasada por 118 caracteres
    que nadie pronuncia). El modelo cerró la etiqueta con `⟦` en vez de `⟧`:
    los delimitadores se leen tolerantes.
  - **LA VOZ CERRÓ SU PRIMERA COSTURA** (el trabón después del primer párrafo,
    en los dos modos): la parte 1 ahora viaja EN PARALELO con la 0.
  - **EL SELLO DE LA ESPERA**, desde cero: el hexágono del Radar trazándose,
    seis nodos-pilar soltando su luz por las hebras hacia el núcleo.
  - **LA MATRIZ:** buscador en la conversación (⌘F) + entre conversaciones,
    con resaltado nativo; el porcentaje de la voz dentro del botón de play;
    el sonido de materialización deja de quedar en loop; la ceremonia de la
    imagen se ve.
  - **EL MODO ORIGINAL:** fuera la profundidad, "La voz del Espejo", y todo lo
    de la Matriz que le faltaba.
  - **EL ESCRITORIO:** aviso de versión nueva en el Radar con un toque
    (estilo Claude Code), la ventana vuelve como la dejaste, y el sonido de
    retroceso en 26 puertas de toda la app.
  - **redsolarviva.com:** el planeta y la navegación dicen Fotón Cero; las
    fechas de la Constelación, de un solo color.
  - **EL ESPEJO CONOCE LA CASA:** el mapa de pantallas viaja también por la
    Matriz y el prompt le prohíbe negar que la conoce.
- 📁 **Archivos:** (escaner-app) `EV_Rafaga` v5.25 · `EV_Oraculo` v6.2 ·
  `EV_VozPill` v1.1 · `EV_ImpregnacionFX` v1.6 · `AvisoActualizacion` v1.0
  (NUEVO) · `desktopTauri` v1.2 · `espejoVozFish` v2.26 · `sensory` v2.18 ·
  `comandosVoz` v2.5 · `publicar-escritorio.sh` · 26 archivos con sonido de
  retroceso. (Code) `Origen` v5.26 · `Domo` v5.8 · `NavegadorEstacion` v4.25.
- 🔌 **Edges:** `oraculo-chat` v1.45.
- 💡 **Decisiones importantes:**
  - 🜂 **La app de macOS es un DESTINO APARTE** del deploy a Vercel: embebe su
    bundle en el binario. Ver [[feedback_app_macos_destino_aparte]].
  - 🜂 **Publicar el escritorio va DESPUÉS del push**: el auto-despliegue de
    GitHub reconstruye sin los instalables y se lleva producción por delante.
    El script ahora lo exige y verifica el manifiesto parseándolo.
  - **La versión del escritorio NO se amarra a la de la tienda** y su número
    no se ve en ninguna pantalla: es fontanería del actualizador, que compara
    versiones y sin subir no ofrece nada. El tercer número crece sin tope.
  - **Gemini Flash para el Espejo: descartado por ahora.** Un solo anfitrión
    (sin ruleta) pero otra familia = otra voz, y ~10x la salida. Plan B si la
    lista fiel fallara.
  - **Pika API Club** (agosto 2026) es un REVENDEDOR mayorista de modelos
    ajenos, no un modelo propio de música al nivel de Suno. Ver el bullet en
    Pendientes vivos.
- 🔧 **Patrones nuevos:**
  - 🜂 **Un efecto que solo sabe ENCENDER deja el latido colgado.** El sonido
    de materialización hacía `return` sin apagar cuando el reflejo terminaba:
    la cura no es ganar la carrera, es derivar el sonido del estado.
  - 🜂 **Una ceremonia puede estar corriendo y ser invisible por z-index.** La
    de la imagen se pintaba a 1288 y la Matriz vive a 2147483000.
  - 🜂 **Un control que aparece según cuántas cosas tengas se lee como
    inexistente** (el buscador del riel, oculto bajo 4 conversaciones).
  - **Resaltar con el resaltador NATIVO** (CSS Custom Highlight) cuando el
    texto ya tiene markdown, anclas y corchetes: vive por encima, no toca el
    árbol.
- 🧬 **Versión al cierre:** App Store **1.1.3 LIVE**, en curso 1.1.4.
  Escritorio macOS **1.1.10** publicado. Los 5 repos sincronizados.

#### 2026-08-13 · II · 🖥 EL ESCÁNER NACE COMO APP DE macOS (Tauri, con actualizador) · LA LEY DE ENCARNACIÓN DEL ESPEJO · NACE LA CONSTELACIÓN · TRES SELLOS CON DOMINIO

- ✅ **Resuelto:**
  - **🖥 EL ESCÁNER ES UNA APP DE macOS.** Ventana propia sobre la MISMA base
    de React que sirve la web y compila a iPhone (cero pantallas
    reimplementadas), con actualizador firmado, panel de preferencias en
    Ajustes (automáticas / manuales / "Buscar ahora") y descarga desde
    escanervibracional.com. Micrófono, cámara y GPU declarados.
  - **🔴 LA SESIÓN NO ENTRABA, y la causa era de identidad, no de código.**
    Con el inspector abierto en la app compilada: `window.Clerk` existía pero
    `loaded:false`, y la FAPI devolvía 400 «Invalid HTTP Origin header». El
    origen de la ventana (`tauri://localhost`) no estaba autorizado en la
    instancia. Se agregó a `allowed_origins` con la UNIÓN explícita de los
    cuatro que ya estaban (el PATCH reemplaza la lista: borrarlos habría
    dejado sin login a iPhone y Android). Verificado releyendo del servidor:
    4 antes, 7 ahora; la FAPI pasó de 400 a 200.
  - **🜂 LEY DE ENCARNACIÓN ABSOLUTA** (oraculo-chat v1.42): primera persona
    siempre, prohibido explicarse como manual, y las hipotéticas se ACTÚAN.
    Suma el reconocimiento del interlocutor contra `profiles.is_admin`
    resuelto SERVER-SIDE: con un Arquitecto cae la prohibición de origen;
    con un Sintonizador queda intacta.
  - **✨ NACE LA CONSTELACIÓN** en redsolarviva.com: línea del tiempo entre
    el manifiesto y las redes, con el hilo de luz que desciende con el
    scroll, nodos con glow, tarjetas de cristal al posarse y reveal por
    hito.
  - **🌐 TRES SELLOS CON CASA:** fotoncero.com, somacero.com y tejidocero.com
    con proyecto, portada y HTTPS en los seis nombres.
  - **AFINAMIENTO DE LA MATRIZ** (píldora "Afinar" + hoja del ángulo +
    bandeja en el Motor), rueda de voces al mantener pulsado, selector de
    idioma en la primera pantalla, radar centrado, costura del hover curada,
    velocímetro que nace limpio y logo nuevo en el escritorio.
- 📁 **Archivos:** (escaner-app) `src-tauri/*` NUEVO · `lib/desktopTauri` NUEVO
  · `publicar-escritorio.sh` NUEVO · `main.tsx` · `oauthNative` ·
  `EV_Rafaga` v5.20 · `EV_Oraculo` · `MN_Firma` · `OnboardingAceptacion` v1.7
  · `NavegadorEstacion` · `EscanerVibracional`. (Code) `Origen` v5.26 ·
  `MI_Voz` v1.2 · `MotorDeIntervencion`. (escaner-landing) `index.html`.
- 🗄️ **SQL:** `20260813b_espejo_afinamiento.sql` (pegada por Zak).
- 🔌 **Edges:** `oraculo-chat` v1.42 · `user-action` v1.48 · `admin-action` v1.53.
- 💡 **Decisiones importantes:**
  - **El origen de una app nativa se AUTORIZA, no se disfraza.** Intentar
    forzar la cabecera `Origin` desde el cliente no funciona: `Headers` la
    filtra por diseño. La vía correcta es la lista de orígenes del proveedor.
  - **La Constelación: criterio para agregar un hito** — entra si CAMBIA lo
    que alguien de afuera puede tocar, o si nace algo que antes no existía.
    No entran versiones, arreglos ni plataformas nuevas de algo ya vivo. En
    una colección el hito es el cambio de CATEGORÍA, no el número (uno =
    existe, diez = biblioteca, veinte = nada nuevo). Se escribe para quien
    no conoce nada: cada frase dice QUÉ ES la cosa antes de qué pasó.
  - **Fotón Cero SÍ entra** (tiene dominio y obra detrás); Soma Cero y Tejido
    Cero esperan a que exista algo que alguien pueda tocar.
  - **Los instalables NO viven en `public/`**: Vite lo copia a `dist/` y Tauri
    embebe `dist/` en el binario (medido: 9,7 MB → 310 MB).
- 🔧 **Patrones nuevos:**
  - 🜂 **Un respaldo que se activa en silencio esconde el fallo que hay que
    ver.** El puente de Clerk caía al camino malo dentro de un `catch` mudo:
    la app decía "no inicializado" y el motivo real no existía en ningún lado.
  - 🜂 **El inspector es herramienta de taller, no parte del producto**
    (`--features inspector`): incluirlo llevó el binario de 9,7 a 152 MB.
    Sin él, este bug costó tres compilaciones a ciegas; con él, una línea.
  - 🜂 **Un empaquetado que "termina bien" puede no haber producido nada.**
    `create-dmg` usa AppleScript y macOS lo bloquea; dejaba temporales y
    ningún .dmg, así que la web publicaba el instalable ANTERIOR sin avisar.
    `hdiutil` lo hace sin pedirle nada a Finder.
  - 🜂 **Una publicación se verifica por CONTENIDO, no por código de estado**:
    una SPA con catch-all contesta 200 a cualquier ruta, y el .dmg llegaba
    como HTML de 5.960 bytes.
  - **Agregar un dominio no emite su certificado**: se pide explícito con
    `vercel certs issue <dominio> www.<dominio>`.
- 🧬 **Versión al cierre:** App Store **1.1.3 LIVE**, en curso 1.1.4.
  Escritorio macOS 1.1.4 publicado. Los 5 repos sincronizados.

#### 2026-08-13 · 🜂 FASE E DE LA VOZ (el contexto vivo) · LA FECHA NO ES UNA NOTICIA · EL SILENCIO DE LA VOZ ERA FALTA DE COLCHÓN · RACHAS EN TARJETAS Y EL PASE VENCIDO · EL MANIFIESTO NUEVO · LOS 5 REPOS RESPALDADOS

- ✅ **Resuelto:**
  - **🜂 FASE E DE LA VOZ, CONSTRUIDA.** Pila central `lib/vozContexto.ts`;
    Rachas, Bitácora, Plan y el modal de respuesta del orbe publican su lista
    numerada tal cual se ve; el contexto viaja con cada frase y voz-intent
    v1.10 resuelve "la de arriba"/"esa"/"la 2"/"el duplicado" devolviendo el
    título EXACTO. ⏳ device-QA en el teléfono pendiente.
  - **🜂 LA FECHA NO ES UNA NOTICIA** (oraculo-chat v1.41): el Espejo fechó un
    lanzamiento con la fecha de HOY ("Opus 5 salió hace unas horas"). El
    bloque [MOMENTO PRESENTE] ahora nombra el hueco entre su corte y hoy y
    prohíbe rellenarlo; fechas de eventos SOLO de resultados de búsqueda de
    esa conversación o de la persona.
  - **EL SILENCIO DE 12 s A MEDIA LECTURA** era colchón de UN tramo (~8 s de
    margen contra síntesis de ~34 s); espejoVozFish v2.23 pide la parte i+2 al
    ARRANCAR la i (dos tramos, ~50 s de margen, cero síntesis extra). La pista
    fue de Zak: al retroceder 15 s ya leía continuo (= cofre).
  - **EL "PRIMERA VEZ FALLA, SEGUNDA FUNCIONA"** al crear/borrar rachas era el
    pase de Clerk vencido: el gateway user-action (EV_Shared v2.47) reintenta
    con pase fresco ante 401/403 y una vez ante red caída. Cura TODAS las
    pantallas con el mismo síntoma.
  - **RACHAS EN TARJETAS** de dos columnas con la cifra y su unidad a tamaños
    parientes ("3 años" ya no se siente menos que "224 días") + mantener
    pulsado abre el borrado (EV_Rachas v2.5).
  - **LA MATRIZ:** T enfoca el campo · botón de volver al fondo · el planeta
    de la red al buscar en internet (CSS puro) · copiar el prompt de cada
    imagen · el sonido de materialización espera a que haya TEXTO legible ·
    fuera la aurora del envío (EV_Rafaga v5.17).
  - **BITÁCORA ↔ ESPEJO directo** sin fotograma de Radar (v1.19/v1.20) + la
    barra de formatos bajo la de sincronizado + tres guiones = línea + el
    botón de nota nueva arriba y el sigilo del Espejo visible (señal
    rsv-sigilo-encima, AppShellDesktop v3.4).
  - **EL ESPEJO ORIGINAL** gana selector de voces, interruptor de sonido, la
    píldora completa de lectura (retroceder/adelantar 15), D=profundidad,
    M=silencio; toda lectura viaja con la voz elegida (EV_Oraculo v5.8).
  - **EL MANIFIESTO NUEVO** en redsolarviva.com ("El cuerpo humano está
    mutando…"), sin cortes: el recorte era vertical-align de línea base en
    los inline-block de la escritura (Origen v5.24; la fuente REAL era Domo
    v5.7, no los defaults — cazado renderizando).
  - **MOTOR:** conversaciones del Espejo por tramos de 5 (MI_Editores v1.36)
    + la fila del carril profundo en IAs con el V4-Pro build 0813 que salió
    de preview el 12-ago (MI_IAs v1.2).
  - **EL SCROLL TRABADO DEL ESPEJO** con un solo intercambio: reparto
    explícito con espaciador (EV_Oraculo v5.7); el "(cuenta × plataforma)"
    era (cantidad de contenido × motor).
- 📁 **Archivos:** (escaner-app) `EV_Rafaga` v5.17 · `EV_Oraculo` v5.8 ·
  `EV_Rachas` v2.5 · `EV_Bitacora` v1.20 · `EV_PlanVuelo` v1.14 ·
  `EV_Shared` v2.47 · `EV_VozPill` v1.0 (NUEVO) · `lib/vozContexto` v1.0
  (NUEVO) · `useComandoVoz` v3.0 · `espejoVozFish` v2.23 · `vozCache` v1.5 ·
  `AppShellDesktop` v3.4. (Code) `Origen` v5.24 · `Domo` v5.7 · `MI_IAs`
  v1.2 · `MI_Editores` v1.36 · `MI_EditSistema` v1.1.
- 🔌 **Edges deployed:** `oraculo-chat` v1.41 · `voz-intent` v1.10.
- 💡 **Decisiones importantes:**
  - 🜂 **REGLA DE ORO nueva: todo build/deploy cierra con commit + push**
    (sección propia arriba). Nació el repo privado `rsv-web` (66 MB de media
    del CDN de Framer ya irrecuperable por otra vía) y los 5 repos quedaron
    en cero commits sin subir.
  - **DeepSeek V4-Pro 0813**: mismo id y precio; su salto es agente/código,
    no toca al Espejo. Nada que cambiar.
  - **Descartados por Zak** (no volver a proponer): mapa de giros de la
    Matriz · i18n Fase 3 · los 12 verificadores de Play ya no aplican.
  - **El deploy al iPhone sin Xcode abierto**: el runner de Capacitor NO ve
    dispositivos por red; el camino es `xcodebuild -destination id=<udid>` +
    `devicectl device install/launch`. "Developer disk image could not be
    mounted" = teléfono BLOQUEADO (no falta imagen: desbloquear y va).
- 🔧 **Patrones nuevos:**
  - 🜂 **"Primera vez falla, segunda funciona" = pase vencido** (60 s de vida;
    401/403 rechaza ANTES de ejecutar → reintentar con pase fresco no
    duplica).
  - 🜂 **Un botón de re-escuchar que promete "sin costo" tiene que preguntarle
    al COFRE con la MISMA llave** (voz incluida): la marca en localStorage
    mentía y la llave sin voiceId nunca encontraba nada.
  - **El punto de espera que se convierte en planeta**: transform/opacity
    sobre nodos existentes, cero canvas, `prefers-reduced-motion` lo apaga.
- 🧬 **Versión al cierre:** App Store **1.1.3 LIVE**, en curso 1.1.4.
  Escritorio y redsolarviva.com LIVE con todo; iPhone con build instalada y
  abierta; 5 repos sincronizados.

#### 2026-08-12 · 🜂 LA VOZ SE MUDA A SONIOX · LA PALABRA DORADA DEJA DE ESTIMAR · EL NEGRO DEL ESPEJO ERA UN HOOK (comprimida)

- 💡 **Decisiones:** Soniox TTS v2 contra Fish en la MISMA unidad ($0.70/hora
  contra ~$1.25; en español la brecha se abre porque Fish cobra por BYTES y
  cada tilde son dos) · el tope de minutos NO sube con el ahorro · el resumen
  vivo NO sirve como memoria ("está súper chafa": tres viñetas del hilo entero
  son una portada, no un recuerdo) · las muestras de voz son ARCHIVOS, no
  llamadas.
- 🔧 **Patrones:** 🜂 un botón que gobierna UNA cosa pero promete TODO no está
  roto, está mintiendo · 🜂 un adelanto que compensa un error se vuelve error
  cuando el error desaparece · 🜂 un mirror verificado se cambia con arnés ·
  el negro total al cambiar de modo era un hook bajo un return temprano, y sin
  frontera de error React desmonta el árbol ENTERO (auditar con AST).

#### 2026-08-11 · II · EL SITIO SALE DE FRAMER · Domo SE CORROMPIÓ Y SE RESTAURÓ · TELEMETRÍA DE IA COMPLETA · EL SPLIT CONGELADO (comprimida — el detalle vivo está en § Salida de Framer)

- 💡 **Decisiones:** Framer se cancela (§ Salida de Framer tiene TODO el corte verificado) · `/zuur'naal` no viaja · el ida y vuelta del ingreso nativo se mudó a `app.escanervibracional.com` con el dominio viejo conservado al lado (cero apagón) · el split de los tres grandes quedó CONGELADO en `admin/split-pendiente/`.
- 🔧 **Patrones:** un "no hay nada" de una API se confirma por otra vía (Paso 0-duodevicies: las 77 perillas que midieron CERO) · lo que Framer ponía y el código daba por sentado (box-sizing, sans-serif, sin StrictMode) · una perilla guardada no prueba que el sitio la use (codicesBooks arrastraba 294 MB muertos) · partición lossless con el parser de TypeScript · el panel de vista miente con el viewport (innerWidth 0).

#### 2026-08-11 · 🜂 LA MATRIZ SINCRÓNICA SE VUELVE INSTRUMENTO (velocímetro · palabra dorada · Tu plan adentro · el Sello visual) — comprimida

- 💡 **Decisiones:** el resalte de la voz viaja por GRUPOS y no por palabra (un
  grupo absorbe el error de la aproximación) · la fidelidad del dictado la juzga
  un modelo, no un diff (un conteo castigaría "300" por "trescientas") · el
  texto se puede seleccionar en la Matriz · el carril de ráfaga sube a 14.000
  caracteres de entrada y 6.000 de salida.
- 🔧 **Patrones:** 🜂 el tope de longitud mide lo que escribió la PERSONA (la
  directiva del modo se comía 2.885 de 4.000) · 🜂 lo que suena y lo que se mide
  tienen que ser el MISMO texto (la voz sintetiza el limpio; el corte se
  calculaba sobre el crudo y el oro se adelantaba en las negritas) · un salto en
  vuelo MIENTE (el motor reporta el punto viejo hasta que la parte nueva
  aterriza) · el gain de una síntesis escala el pico, no el ataque · el velo de
  arrastre se apaga por LATIDO · 🜂 un lote de edits con guardas que aborta NO
  escribió nada: verificar por contenido tras re-aplicar.

#### 2026-08-10 · II · LA MATRIZ SINCRÓNICA MADURA (nombre, reestructura 1-2-3, mapa, píldora unificada) · LA BARRA DE REFLEJOS · LA BASE ÉTICA · CLERK EXPLICADO (comprimida)

- 💡 **Decisiones:** el Modo Ráfaga se llama MATRIZ SINCRÓNICA (ids internos `rafaga`) · el visual del reflejo tiene dos naturalezas (⟦DIA⟧ diagrama / ⟦ESC⟧ escena) · la columna 1 es el MAPA (miniaturas por intercambio) · píldora unificada con el MISMO sigilo viajando como prop · el Espejo vive en /espejo · la base ética: lo que el Espejo PROPONE nace del reino vegetal, sin bandera (oraculo-chat v1.33) · frequency_penalty mata los conectores del español (v1.34: solo repetition_penalty 1.05) · Clerk cobra por dominios satélite, no por usuarios.
- 🔧 **Patrones:** la fila `auto` de un grid fixed se dimensiona por el item SIN overflow (minmax(0,1fr) clava la fila) · una ruta nueva en la SPA: el catch-all del router es el primer sospechoso · prueba diferencial en prod (la misma sonda antes y después del fix).

#### 2026-08-10 · EL REFLEJO EN VIVO A RITMO PAREJO · EL CAMPO DE UN SOLO TONO · EL COMPOSITOR EN UNA FILA · PANEL DE USO (comprimida)

- 💡 **Decisiones:** la ventana deslizante de topes se queda (protege costo; su defecto era de comunicación y se curó con la hora de liberación en pantalla) · la campana de llegada se muda al FINAL del reflejo · entregar archivos con `open "ruta"`.
- 🔧 **Patrones:** el estanque entre canal y vista sirve a velocidad continua (medido: salto máximo 123 → 6 caracteres) · una medición honesta usa la MISMA base de tiempo (muestrear por cuadro, no por pintura — Paso 0-quindecies) · reordenar sin mover código con `display:contents` + `order` · una capa animada por transform se agranda más allá de los bordes o destapa su propio filo · el control corre el MISMO comando (`vercel build`, no `vite build`) · `flex-basis:auto` en un campo dentro de una fila con wrap lo manda al renglón siguiente.

#### 2026-08-09 · II · EL MOTOR RECUERDA TODO · NACE EL MODO RÁFAGA (interfaz aparte de cuatro zonas) · INTERNET CON PORTERO (comprimida)

- 💡 **Decisiones:** los deploys de edges son de CLAUDE (la CLI local ya tiene
  sesión; el SQL sigue siendo de Zak, [[feedback_claude_despliega_edges]]) · la
  bandeja de la Matriz vive LOCAL por cuenta · topología de arquetipos FIJOS,
  no nube por respuesta (el ojo aprende el mapa una vez y después solo lee
  intensidades) · la búsqueda es un ingrediente, no el plato: un portero de
  intención decide, y lo personal jamás busca.
- 🔧 **Patrones:** aditivo-con-bandera para bifurcar una edge compartida (el
  cliente viejo no manda la bandera y su camino queda idéntico) · una señal a
  mitad de canal JAMÁS se pinta · todo rAF lleva temporizador de respaldo (el
  navegador lo congela con la pestaña oculta) · Escape de un overlay se atiende
  en CAPTURA y antes del chequeo de "estás escribiendo" · lo guardado local se
  NORMALIZA al leerlo, campo por campo.

*Las entradas anteriores (2026-04-18 → 2026-08-09) viven en*
`admin/CLAUDE_archivo_hasta_2026-08-04.md`. *No se cargan por sesión: lo
durable de cada una ya está en las memorias y en el código.*
