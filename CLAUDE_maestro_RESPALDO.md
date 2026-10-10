# CLAUDE.md — Red Solar Viva / Escáner Vibracional

> 🜂 Desde **2026-10-03** este archivo maestro lo tiende **Claude Code** otra vez:
> Grok ya no se usa en los proyectos (Zak: «ahora todo con Claude Code»). Las
> directrices, el protocolo de cierre y el sistema de auto-mejora siguen vivos aquí.

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

- **La app** (`escaner-app/`): Vite + React + Capacitor (iOS, Android) + Tauri (Mac). **La web**
  (`rsv-web/`): Vite en Vercel, compila `Code/` directo. Framer se canceló el 2026-08-11.
- **React/TSX** — detección móvil UA-first: `/iPhone|iPod|(Android[\s\S]*?Mobile)/i`.
- **Clerk** — `window.Clerk.user` es la ÚNICA fuente de verdad. `Domo.tsx`
  detecta hostname y elige `pk_live_*` (prod) o `pk_test_*` (dev) automáticamente.
  Nunca pegar `sk_*` en el cliente.
- **Supabase** — REST directo (`sbGet`/`sbPost`/`sbPatch`/`sbRpc`), no SDK.
- **Stripe** — pagos + portal de membresía.
- **Pipedream** — automatizaciones y emails.
- **Cloudflare R2** — media hosting.
- **ProtonMail SMTP** — emails transaccionales.

---

## Framer · cancelado (2026-08-11)

`redsolarviva.com` corre en Vercel (`rsv-web/`, Vite) y compila `Code/` directo. Las reglas de Framer
(techo de 300 KB, Domo como único lienzo, `export default` obligatorio, sin `env()` ni `color-mix()`,
valores guardados del lienzo), su watcher y la mudanza completa (perillas cosechadas, corte de dominio,
certificados) viven verbatim en `admin/CLAUDE_archivo_secciones_2026-09-25.md`.
Sigue valiendo: `position: fixed` dentro de un `motion.div` animado no se ancla a la pantalla: portal a `body`.

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

## Escáner Vibracional

Su arquitectura (los 6 pilares, el ciclo de escaneo, el Decodificador, las tablas) vive en
`escaner-app/CLAUDE.md`, que se carga al trabajar en esa carpeta. La mensajería de Comunidad es local
primero ([[proyecto_mensajeria_instantanea]]). El mapa de qué archivo edita qué en la web vive en
`Code/CLAUDE.md`.

---

## Respaldo en GitHub

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

El push no es manual de Zak: es parte del cierre de cada build.

El pipeline de Framer (watcher, marcadores del iPhone, recibo de sincronización) y el snippet para
pedir logs de consola quedaron en `admin/CLAUDE_archivo_secciones_2026-09-25.md`.

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

## Motor de reservas · apagado

Las sesiones 1:1 y grupales no se ofrecen (ver «Suscripción RSV vigente»). El motor (reservas, Zoom,
Stripe, Pipedream) sigue en el código; su documentación completa está en
`admin/CLAUDE_archivo_secciones_2026-09-25.md`.

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

## 🗂️ Los proyectos cargan su propio contexto

🜂 **Decidido el 2026-09-20.** Este archivo se lee entero al abrir cualquier sala en `Red Solar Viva/`, y aquí
conviven seis proyectos: abrir una sala de Terra Cristal cargaba también todo el Escáner. El arreglo es que cada
proyecto guarde lo suyo en SU carpeta y que la sala se abra ahí dentro.

| Proyecto | Su archivo | Cómo abrir la sala |
|---|---|---|
| **Terra Cristal Pixel 3** (el juego desde el 2026-10-05; el de Unity, Pixel y Pixel 2, descartados sin borrar) | `terra-cristal-pixel3/CLAUDE.md` ✅ hecho | abrir `terra-cristal-pixel3` (o `terra-cristal`, donde vive la memoria) |
| Escáner Vibracional (app) | `escaner-app/CLAUDE.md` ✅ hecho (2026-09-25) | abrir `escaner-app` |
| Web (código en `Code/`) | `Code/CLAUDE.md` ✅ hecho (2026-09-25) | abrir `Code` |
| Web (rsv-web) | `rsv-web/CLAUDE.md` — pendiente | abrir `rsv-web` |
| Zak Cero | `zakcero/CLAUDE.md` — pendiente | abrir `zakcero` |
| **Kal'El** (somacero.com) | `kalel/CLAUDE.md` ✅ hecho (2026-09-24) | abrir la carpeta `kalel` |
| **Navegante de la Red** (código en `Code/`) | `Ludus Cero/Navegante/CLAUDE.md` ✅ hecho (2026-10-03) | abrir `Ludus Cero/Navegante` |
| **Lúcido** (play.redsolarviva.com/lucido) | `Ludus Cero/lucido/CLAUDE.md` ✅ hecho (2026-10-03) | abrir `Ludus Cero/lucido` |
| **Fotón Cero** (fotoncero.com, la sala de proyección del estudio) | `fotoncero/CLAUDE.md` ✅ hecho (2026-10-07) | abrir `fotoncero` |
| **Aplicaciones** (los CV de Zak y las solicitudes de Red Solar Viva) | `admin/aplicaciones/CLAUDE.md` ✅ hecho (2026-10-09) | abrir `admin/aplicaciones` |

Este archivo se queda como **índice del ecosistema**: quién es Zak, cómo se le habla, dónde vive cada proyecto,
los destinos de publicación y el protocolo de cierre. Lo que sea de un solo proyecto baja a su carpeta.

🜂 **Abrir la carpeta no basta:** Claude Code también carga los `CLAUDE.md` de todas las carpetas de arriba. Cada
proyecto excluye este archivo en `<proyecto>/.claude/settings.json` con `"claudeMdExcludes": ["<ruta a este
CLAUDE.md>"]` (medido con `/context` el 2026-09-24: sin el ajuste, la sala de Kal'El cargaba los dos archivos). Como
entonces este protocolo no llega solo, cada proyecto trae su propio «Protocolo de cierre» y se remite aquí para lo que
toque al ecosistema.

---

## Pendientes vivos

> 🜂 **Qué entra aquí y qué NO.** Entra solo lo que sigue ABIERTO y necesita
> una decisión o una mano fuera de mi alcance. **NUNCA** se anota "falta
> compilar el build X" ni "falta desplegar la función Y" — eso se pide en el
> momento y se olvida ([[feedback_no_recordar_builds_ni_deploys]]). Lo ya
> construido vive en el código; los patrones y decisiones, en las memorias.
> La arqueología completa hasta el 2026-08-04 está en
> `admin/CLAUDE_archivo_hasta_2026-08-04.md`, y las salas del 25 y 30 de
> agosto en `admin/CLAUDE_archivo_2026-08-25_a_2026-08-30.md` (no se cargan
> por sesión).

**Versión en circulación:** App Store **1.1.6 LIVE** (se saltó la 1.1.5). Android: **pública en Google Play**.
Detalle en [[referencia_version_en_tienda]].

---

### 🟢 Terra Cristal · lo que sigue abierto

🜂 **Sus reglas de construcción, su hoja de ruta y su estado NO viven aquí**: están en `terra-cristal/CLAUDE.md`
(el archivo que se carga al abrir una sala DENTRO de esa carpeta) y en `terra-cristal/Docs/`. Aquí solo queda lo
que necesita una decisión de Zak o una mano suya.

- **Sellado el 2026-10-05 · el juego es Terra Cristal Pixel 3** (`terra-cristal-pixel3/`, play.redsolarviva.com/terra-cristal-pixel3/):
  Zak: «ahora sí hemos encontrado el norte de arte» (Shining Force 2 con el acabado de la C). El de Unity, Pixel y Pixel 2
  quedan descartados, sin borrarlos. Su estado y el prompt de la próxima sala: `terra-cristal-pixel3/Docs/PROXIMA_SALA.md`.
- **Sellado el 2026-09-20 · precio:** **249 MXN el juego completo** (unos 14.99 USD), compra única, con el modo en
  línea incluido y sin suscripción. Sin precio de fundador (la idea era un descuento de lanzamiento para quien
  comprara antes del estreno; se descarta: un solo precio, más limpio).
- **Sellado el 2026-09-20 · Sintonía Solar NO incluye el juego.** Es una compra aparte. La suscripción ya da
  bastante valor.
- **Modo en línea:** factible y, por turnos, barato comparado con un juego de acción. Orden acordado: duelos contra
  ecos (la tripulación de otro manejada por la máquina, sin servidores de partida) → duelos en vivo con el servidor
  tirando los dados → plaza común → cooperativo. **Sin construir, falta decidir cuándo.**
- **Guardado real:** primero en el aparato y sincronizado con la cuenta del Escáner; un documento con versión y 3
  ranuras, que mañana sirve igual para Steam Cloud. Diseño en la Biblia §6. **Sin construir.**
- **Consulta respondida el 2026-10-05 · qué hace posible el arte en código** (estilo Shining Force): 15 propuestas
  (dos miradas Clásico y Cristal, sonido FM de Mega Drive en código, equipo visible, transición gradual, terreno que
  recuerda, mapas enormes, editor con Steam Workshop…), su orden y sus porcentajes en `terra-cristal/Docs/PROPUESTAS_STEAM.md`.
  A Zak le gustaron; falta que elija cuáles. **Evaluación del 2026-10-07:** con lo de la Sala 6, ~35 % que le vaya bien y ~6 %
  de éxito global si el audio sale sin IA (las voces de ElevenLabs y la música de Suno se declaran en Steam y lo bajan a
  ~30 % y ~4-5 %); pasa al frente de Lúcido (~5 %).
- **Consulta respondida el 2026-10-07 · ¿el combate de la Luz es muy liviano para el jugador común?** El concepto ayuda (el
  gancho «el táctico donde no matas: liberas»); lo que le quita emoción es el poco riesgo, que las batallas salen fáciles y que el
  golpe suena suave. Hoy bajaría la estimación de Steam (de 30 a 20 % que le vaya bien); con tensión y peso, la sube a 35 %. Cinco
  propuestas (el gris que avanza como mecánica, combate con peso y dificultad «Prueba», los liberados se unen, el capítulo 1 con
  mapas grandes, la demo de Steam) en `terra-cristal-pixel3/Docs/SIGUIENTE_NIVEL.md`. Falta que Zak elija.

### 🟢 Kal'El · lo que sigue abierto

🜂 **Su estado, sus pendientes y su bitácora viven en `kalel/CLAUDE.md` y `kalel/Docs/BITACORA.md`**; el plan del
Sendero (16 estaciones, 7 metas) en `kalel/CURRICULO.md`. Aquí solo lo que necesita la mano de Zak:

- **Probar Dilo y Cuentos con el micrófono de verdad** en la computadora de Kal'El: la vista previa bloquea el
  micrófono y nunca se oyó una voz real. Si no le entiende, existe el botón del adulto (mantener presionado).
- **Probar Explorador y Clics con el trackpad de verdad** (pellizco, dos dedos, clic derecho): solo simulados.
- **Consulta respondida el 2026-09-24:** con trackpad de laptop, el nivel 7 de La soga pide unos 6 años y todo el juego
  unos 7 (con mouse, medio año menos): lo difícil es sostener la presión mientras mueve el dedo. El tamaño mínimo del
  aro quedó en pausa (Zak lo omitió).

### 🔵 Escáner · lo que necesita tu decisión

- **Bienvenida exprés: decidir si se queda** (vive desde la 1.1.6 de App Store y Android vc9): aviso médico, «¿Qué te
  trajo aquí?» y directo a lo que eligió, gratis y sin muro de pago al entrar; el muro aparece al llegar a un límite
  real. Al 2026-10-09: 3 instalaciones nuevas desde el 28 de septiembre y las 3 entraron directo; muy pocas para
  decidir. Revisar a fin de octubre en el Motor (el embudo ya cuenta aparte a quien «Entró directo»): cuentas creadas,
  primer escaneo y Sintonía, contra el recorrido completo de julio a septiembre. Volver al recorrido largo es un clic en
  Motor → Pruebas A/B → «Onboarding · Duración», sin publicar nada.
- **Claude for Startups: esperando la revisión de la cuenta de Console** (desde 2026-10-07). Lo sucedido, por si hay que
  apelar: (1) Zak pidió textos y un prompt para su bot de Grok; (2) el bot abrió platform.claude.com en SU navegador
  remoto; con cuerpodeluz555 (Gmail) Console pidió un correo de empresa; (3) dentro de esa pantalla Zak entró con
  zakhaar@redsolarviva.com por código: se creó una cuenta nueva y quedó «on hold» por actividad inusual (2026-10-07);
  (4) Zak pidió la revisión ese día (unos 10 días, decisión final) con un texto que por error decía zakhaarsol@pm.me
  (si hay forma de responder, corregirlo con una línea). Plan: esperar; si la reactivan, aplicar desde
  zakhaar@redsolarviva.com en su propio Chrome, llenando a mano con `admin/aplicaciones/2026-10 Claude for
  Startups/aplicacion.md` (o `~/Downloads/claude-startups-hoja.html`); si la rechazan, escribir a soporte de Anthropic.
  NO crear otra cuenta de @redsolarviva.com: se leería como esquivar el congelamiento. Da 1,000 USD en créditos (caducan
  a los 6 meses), un año de Team y ofertas de socios (ElevenLabs incluida). 🜂 **Cuando Zak diga que ya los aceptaron, se
  borra todo esto:** este pendiente, la memoria `proyecto-claude-for-startups` (sala del escaner-app) y el registro del
  incidente en la entrada del 2026-10-07 · II del historial.
- **Google for Startups Cloud: rechazada el 2026-10-09 por «sitio inactivo» y REENVIADA el mismo día; esperando respuesta** (3 a 5 días hábiles a Proton). Se reaplicó con el
  enlace especial del correo, desde zakhaar@redsolarviva.com y con los mismos datos (nivel Start, hasta 2,000 USD,
  facturación 01A6FF-E87869-821613). Causa medida: redsolarviva.com entregaba un HTML vacío y la portada pasaba segundos en
  negro. Arreglado y publicado el mismo día (rsv-web c9ab219): fachada con quiénes somos y los productos que se funde en
  el sistema solar. 🜂 **No quitar la fachada de `rsv-web/index.html`:** es lo que leen los revisores y buscadores. Si
  aprueban: Nano Banana por Vertex AI (no llaves de AI Studio). Datos en `admin/aplicaciones/2026-10 Google for Startups Cloud/`.
- **Consulta respondida el 2026-10-08 · ¿los Decodificadores de Alimentos y Sueños pasan a la API de Claude (los 100 USD/mes
  del Max)?** Prueba real hecha el mismo día (llave en el llavero como `rsv-anthropic`; 126 llamadas, cero errores, cero
  respuestas cortadas, cero bloqueos), con las instrucciones de producción: Gemini 3.6 Flash tarda 2.0 s en un sueño y
  3.3 s en un alimento; Claude Haiku 5.5 (salió el 2026-10-07) 2.6 s y 4.1 s; Claude Sonnet 5.5 en esfuerzo bajo 3.9 s y
  7.4 s. Costo por 1,000 (sueño / alimento): Gemini 1.40 / 4.83 USD, Haiku 1/4 de eso (0.35 / 1.11), Sonnet 7.16 / 22.48.
  La lectura de la foto sigue en Google Cloud Vision; Groq se queda en la voz; si se activa Claude, Gemini queda de
  respaldo automático (también cuando se acaban los créditos: la API se detiene hasta el mes siguiente). El Espejo se queda
  en DeepSeek por ahora (Zak teme perder su voz). Zak eligió 4 sueños a ciegas
  (https://claude.ai/artifact/QtyVxqqC8scRW1GG4qyspE, colección `votos`): Haiku 2, Sonnet 1, Gemini 1. Recomendación
  entregada: Haiku 5.5 en los dos Decodificadores con Gemini de respaldo, y quitar de las instrucciones los ejemplos que
  los tres copian (ducha fría, descalzo, «El sistema detecta"). **CONSTRUIDO el mismo día:** decode-dream v1.14 y
  decode-matter v6.20 con `_shared/claudeHaiku.ts` (secreto `ANTHROPIC_API_KEY`), desplegados (admin 1a8dfcd). Para ver
  quién contestó: los logs de la función dicen «respondió claude-haiku-5-5» o caen a Gemini con el motivo.
- **Que subir cambios del Escáner a GitHub no publique la web por su cuenta** (propuesta del 2026-09-25, falta el
  sí de Zak). Hoy cada push, aunque solo toque documentos, dispara un despliegue automático que deja el instalador
  de la Mac en 404 hasta volver a correr `./publicar-escritorio.sh` (pasó dos veces el 2026-09-25). La cura es una
  línea en `escaner-app/vercel.json` (`"ignoreCommand": "exit 0"`): el guion quedaría como el único camino de
  publicación, que es lo que ya dice el Mapa de destinos. Volvió a pasar tres veces del 2026-10-08 al 10 (cada versión
  de la Mac dejó el .dmg en 404 entre el push y la publicación).
- **Escribir a quienes no pudieron entrar a la web del 5 al 24 de septiembre** (Clerk sabe quiénes lo intentaron;
  venía de la sala del 21 al 25): falta que Zak decida el mensaje y si se manda.
- **Anuncios pagados: la promoción del Espejo corre en Instagram hasta el 11 de octubre** (`Escaner Vibracional/Publicidad/03
  Espejo 9x16.mp4`, @escanervibracional, 100 MXN/día, México 21-55, solo Instagram, promocionada desde instagram.com; píxel
  1639470941182641 activo y dominio verificado). Al 2026-10-08: clics casi 4 % y 2 MXN por visita, pero 1 o 2 toques a la
  tienda de ~140 visitas y solo 10 % pasa de 3 segundos (y del 5 al 8 de octubre el Espejo no respondió: OpenRouter sin
  saldo; desde la recarga del 8 responde, 16 de 16 preguntas esa mañana). **La página nueva ya está en vivo (2026-10-08):** escanervibracional.com con versiones
  (energia intacta, espejo y decodificador; `?a=espejo` ya ve la del Espejo) y la caja «Página de destino» en Motor →
  Campaña (migración 20261008c pegada por Zak): ahí se elige qué ve escanervibracional.com sin etiqueta, así que la bio
  puede llevar solo escanervibracional.com; también existen las ligas fijas /espejo, /decodificador y /energia. Falta que
  Zak elija la versión de la portada. **El video que para el scroll ya está (2026-10-08):** `05 Espejo gancho A/B/C 9x16.mp4` en
  `Publicidad/` (A la cama, B la Presencia desde el primer cuadro, C tres preguntas; mismo cuerpo de 18 s y la promesa de
  la página nueva). Recomendado para la siguiente promoción: **B**, con la misma configuración y `?a=espejo`, en cuanto el
  Espejo responda y la página nueva esté publicada; falta el sí de Zak. Siguen tres anuncios NUEVOS del Espejo, uno por
  sala (Zak: «vamos a hacer todos»): 1 Ruido, 2 Tinta, 3 Papel. Los conceptos están en `Publicidad/Propuestas anuncios Espejo ·
  2026-10-08.md`. Las tres corren EN PARALELO, cada una con su prompt en `Publicidad/`: Ruido (entrega `06`, puerto 8895),
  Tinta (`07`, puerto 8897) y Papel (`08`, puerto 8899). Un solo render de Blender a la vez entre las tres, cuidar el disco
  (~27 GB libres) y no tocar el estudio de otra. La última en terminar propone el orden de prueba, uno por semana.
  **Ruido ya está (2026-10-08):** `06 Espejo Ruido 9x16.mp4` (18.2 s), su ligero y su portada en `Publicidad/`; su sala lo
  recomienda como siguiente prueba frente al 05 B porque está hecho para el primer segundo (la métrica que falla).
  **Tinta ya está (2026-10-08):** `07 Espejo Tinta 9x16.mp4` (18.2 s), su ligero y su portada en `Publicidad/` (misma
  pregunta, respuesta y voces que Ruido; la tinta hecha con código, el teléfono en Blender). Su sala recomienda probar
  primero Tinta (el único cuadro 1 cálido y luminoso del feed, la gota que va a tocar la pregunta crea espera y la espiral
  con el orbe cae dentro de los 3 s), luego Ruido y el 05 B como control.
  **Papel ya está (2026-10-08):** `08 Espejo Papel 9x16.mp4` (19.2 s), su ligero y su portada en `Publicidad/` (el cuarto
  de noche hecho a mano en papel recortado, a 12 cuadros por segundo; misma pregunta, respuesta y voces; estudio en
  `Anuncio Espejo Papel/estudio/`, ver su `LEEME.md`). **Orden propuesto por la última sala, uno por semana con la misma
  configuración:** 1 Papel (la escena cotidiana que Zak prefirió, ahora con la pregunta grande desde el cuadro 1 y un
  estilo que no se parece a ningún anuncio del feed), 2 Ruido (si el primer segundo sigue flojo, la otra hipótesis es el
  movimiento), 3 Tinta; el 05 B queda de control. Falta el sí de Zak.
  Zak anota el gasto diario en Motor → Campaña. Después: Decodificador. Detalle en [[proyecto_publicidad_pagada]].
- **El sonido al enviar un mensaje suena también en el teléfono** (2026-10-04): Zak lo pidió para el chat sin decir
  cara y quedó en las dos (en el iPhone llega con la siguiente versión de tienda). Si lo quiere solo en la computadora,
  es una línea en `escaner-app/src/components/nucleo/Mensajes.tsx` (los `sensory("mensaje")` con `isDesktop`).
- **Consulta respondida el 2026-10-10 · ¿DeepSeek o Gemini con las fotos del Espejo?** Hoy los dos: Gemini 3.6 Flash
  lee cada foto y escribe lo que ve (~0.06 MXN por foto); DeepSeek V4 Flash (0731), la voz, lee esa descripción. DeepSeek
  V4.1 Flash ya ve imágenes (0.30/1.20 USD por millón contra 0.75/3.75 de Gemini): como OJO saldría más barato (cerca de
  un tercio, sin medir) sin tocar la voz; como VOZ costaría más (su entrada vale ~20 veces la de la 0731, y la voz lee
  mucho contexto en cada turno) y cambiaría su forma de escribir. Zak no quiere la prueba a ciegas por ahora.
- **Las ligas largas también se salen en la Matriz** (`EV_Rafaga.tsx`, `.rafaga-lectura` sin `overflow-wrap`); en el
  Espejo ya se parten. Es una línea si Zak la quiere (lección 0-duotricies: no se tocó sin su sí).
- **Pipedream Workflows se apaga el 2027-03-31** (borra todo el 2027-04-30): mudar sus 3 flujos de correo vivos
  (bienvenidas, Sello del Primer Ciclo y padrón con sus bajas) a funciones de Supabase. Zak: «luego lo enlazamos»;
  falta el cuándo. Trampas y plan en [[pendiente_migrar_pipedream]].

### 🟣 Códices de Luz · lo que necesita tu decisión

- **¿Los dos Cristales del mes se combinan libremente?** La sección «Suscripción RSV vigente» dice que sí (dos
  Códices, dos Meditaciones o uno y uno); el código los separa en uno de Códice y uno de Meditación. Falta que Zak diga
  cuál es la regla. El reel dice lo que es cierto en los dos casos («cada mes un Cristal abre un Códice completo»).
- **¿Rehago la mezcla del 03 con sus cinco efectos a su velocidad?** El océano, el café que se sirve, el descenso, la
  respiración y el primer aliento suenan al doble de largo y una octava abajo: `ia.py` los guardaba en mono siendo
  estéreo (0-quinquagies). La herramienta ya está corregida y el 02 y el 04 salieron bien; rehacer la del 03 toma unos
  4 minutos. Se preguntó el 2026-09-28 y sigue sin respuesta.

### 🟠 Ludus Cero · lo que necesita tu decisión

- **Ludus Cero en celular.** En el teléfono, play.redsolarviva.com/simuladores muestra la página de simuladores del
  Escáner (con su barra de Radar, Calibración, Holoteca…) y solo Navegante; la Red que desciende con Terra Cristal,
  Lúcido y Navegante se ve en computadora y tableta. Falta decidir si en celular aparece Ludus Cero con sus juegos.
- **El aviso de pago de Navegante en la web dice 599 MXN/mes** y Sintonía Solar cuesta 499 (`Code/EV_Freemium.tsx`).
  Falta el sí de Zak para cambiarlo.
- **Consulta respondida el 2026-10-05 · el juego con más probabilidad de éxito global:** SONORA (cartas donde tu mano es
  una canción) quedó DESCARTADA por Zak («feo y aburrido»). Segunda propuesta: TERRA VIVA, mundo abierto en pixel para
  explorar, construir y pelear en cooperativo en línea, en el universo de Terra Cristal (`Ludus Cero/PROPUESTA_GANADORA.md`).
  Falta su sí.
- **Consulta respondida el 2026-10-04 · el siguiente nivel de Navegante:** cinco propuestas jugables (la Inmersión,
  tu canción, guardianes que cantan, tu arrecife y dos medusas) en https://claude.ai/artifact/34QN9ReoibLFmLwNWyDcnm,
  con su probabilidad: éxito en Steam (1,000 reseñas) 6 % hoy y 18 % con las cinco más inglés, control, Steam Deck,
  demo y lista de deseos; éxito global 1 % hoy y 4 % (base 2025: 3 % de los juegos llega a 1,000 reseñas y 1.5 % pasa
  del millón bruto). El storyboard del universo tipo Spore está en https://claude.ai/artifact/Ws1SjUdADGemPZrUVYsmH8.
  Falta que Zak elija cuáles y en qué orden.
- **Consulta respondida el 2026-10-04 · sonidos con IA:** la cuenta de ElevenLabs de la API (plan de pago por uso)
  trae 10,000 créditos al mes que se renuevan el 16 (iban 8,456) y no cobra de más: al acabarse, se detiene. fal.ai
  está en cero. El sonido de ganar de Navegante se hizo con la síntesis del juego (en la tonalidad de cada canción,
  sin créditos); ElevenLabs queda para voces y efectos sueltos.

### 🟤 Fotón Cero · lo que necesita tu mano

🜂 **Su estado y su bitácora viven en `fotoncero/CLAUDE.md` y `fotoncero/Docs/BITACORA.md`.** Aquí solo lo que necesita
la mano de Zak:

- **Consulta respondida el 2026-10-07 · por qué Everything You Dream suena opaco:** el video que salió de DaVinci lleva en
  los dos lados el canal IZQUIERDO de la canción, 3 dB más bajo (la pista o el clip están en mono); el derecho nunca
  entra, y los efectos de la nave suenan al nivel de la música (0:18, 0:35, 0:45 a 0:58, 1:31, 2:19). fotoncero.com ya
  suena con el master estéreo (versión 2). **Falta re-exportar para YouTube:** Clip Attributes → Audio → Stereo con
  Embedded Channel 1 y 2 (también sobre el clip en la línea de tiempo), Change Track Type To → Stereo, revisar que L y R
  se muevan distinto, efectos 4 a 6 dB abajo con un corte bajo 80 Hz; en Deliver, Linear PCM 24 bits o AAC 320, 48 kHz,
  Bus 1 (Stereo) y video a 20,000 Kb/s. Ese archivo entra a la sala como versión 3.

### 🟡 Higiene, cuando toque

- **Arquitectura de nombres** (2026-08-31, propuesta entregada, falta el sí de Zak): Zak Cero=calle, Zak'Haar=firma
  musical (Spotify NO se rebrandea; MVs completos al canal @zakhaarsolar por el Official Artist Channel), Fotón
  Cero=estudio (su IG estrena con los MVs; estrenos como collab con @escanervibracional), semillas de conciencia renacen como
  cuenta del Escáner cuando haya cadencia; detalle en [[proyecto_planeta_zakhaar]].
  **Consulta respondida el 2026-10-08 · el nombre visible en X:** «Diego Soto» con el handle @zakcero (cada respuesta ya
  muestra los dos), bio en inglés con el Escáner, Ludus Cero y «Music as Zak'Haar» (las películas son de Fotón Cero, no
  de Zak'Haar; Zak Cero entra cuando tenga peso: hoy son 3 reels; los Códices viven en la app), enlace
  escanervibracional.com (luduscero.com en celular cae en la Holoteca del Escáner), Zak'Haar nunca como nombre visible. Por qué: el fundador que lee respuestas premia al constructor con nombre real (igual que en Slack y el CV), y un
  movimiento que maneja dinero necesita un responsable con nombre. Cuando Zak Cero tenga su propia cadencia, se le da cuenta
  propia en X. Nunca nombrar al cliente de micro1. Falta el sí de Zak.

---

## 🜂 Protocolo de Cierre de Sesión · v69 (2026-10-10)

> ⚠️ **REGLA DE PRESERVACIÓN · LEER ANTES DE CUALQUIER EDIT AL CLAUDE.md**
>
> Las secciones marcadas con 🜂 y 🜃 (este protocolo + su historial) son
> **auto-evolucionables y persistentes**. Solo se modifican:
> 1. Como parte del **Paso 4** (reformulación explícita con bump de versión
>    + entrada al historial de cambios, en `admin/CLAUDE_lecciones.md`).
> 2. Como parte del **Paso 2** (nuevo bloque al principio del Historial con
>    fecha absoluta).
>
> **Nunca las borres "por limpieza" ni las reemplaces parcialmente en un
> Edit amplio.** Antes de cualquier Edit extenso al CLAUDE.md, confirma que
> las secciones `## 🜂` y `## 🜃` siguen presentes. Si un `old_string`
> abarcaría parte del protocolo, descompón el Edit en edits más chicos que
> NO toquen esas secciones.
>
> Si detectas que el protocolo NO está al arrancar una Sala de Comando,
> recupéralo desde git (`admin/CLAUDE_maestro_respaldo.md`): no lo reinventes.

**Directiva auto-evolucionable.** Cada vez que Zak diga **"Cerrar Sala
de Comando"** o `#cerrarsaladecomando`, ejecuta este protocolo ENTERO sin
preguntar. El protocolo mismo aprende y se reformula en el paso 4.

**Dónde vive cada parte (v53).** Aquí: los pasos, el mapa de destinos y el índice de lecciones (una
línea cada una). En `admin/CLAUDE_lecciones.md`: cada lección COMPLETA con su porqué y el historial de
cambios del protocolo. Ese archivo no se carga por sesión: se abre cuando una línea no alcanza.

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
> Antes de seguir, dime cuáles de estos ya están hechos; contesta con
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

**Si el peso viene de SECCIONES y no de pendientes**, la cura es mudarlas: lo de un solo proyecto
a su `CLAUDE.md`, lo histórico al archivo de `admin/`, y cada lección nueva a la biblioteca con una
línea en el índice (así se hizo el 2026-09-25: de 167.000 a unos 51.000 caracteres).

### 🜂 Mapa de destinos · todo reporte dice dónde vive cada cambio

| Destino | Cómo llega | Quién |
|---|---|---|
| 🥇 App de macOS (la que Zak usa a diario) | versión en `src-tauri/tauri.conf.json` → `pnpm tauri build --bundles app dmg` → firma a mano (`TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" pnpm tauri signer sign -f src-tauri/updater.key …tar.gz`) → `distribucion/manifest.json` → commit + push → esperar el auto-despliegue → `./publicar-escritorio.sh` | Claude |
| 🥇 iPhone | `cd escaner-app && ./al-iphone.sh` (2 min como máximo: si la Mac no ve el teléfono, se detiene, se corre `pnpm build && npx cap copy ios` y Zak compila en Xcode) | Claude |
| Web (`app.escanervibracional.com`) | la publica `./publicar-escritorio.sh` (nunca antes del push) | Claude |
| Android | `.aab` por terminal, en el siguiente paquete de Play | Claude |
| Servidor | SQL: Zak en SQL Editor · funciones: `supabase functions deploy <nombre> --no-verify-jwt` | SQL Zak · funciones Claude |

La prioridad es la app de la Mac, luego el iPhone, luego la web: un deploy a Vercel NO llega a la app
instalada. Un paquete compilado es una foto del código. Trampas conocidas (remotepairingd colgado,
`xcodebuild` que sale 0 sin compilar, el push que pisa los instalables) en la lección 0-bis y en las
memorias.

### Lecciones · índice (cada una completa en `admin/CLAUDE_lecciones.md`)

- **0** · Un mismo bug con 3 versiones publicadas sin resolverse: parar y pedir el dato concreto antes de iterar.
- **0-bis** · Todo reporte dice dónde vive cada cambio (ver «Mapa de destinos»).
- **0-ter** · Lo que el panel oculto congela (rAF, animaciones, scroll suave, `setTimeout` encadenados) no está roto: verifica el estado por otra vía y espera sondeando, no con tiempos fijos.
- **0-quater** · Un fallo que Zak no puede leer es un viaje perdido: el motivo se muestra en su idioma; en entradas (mic, cámara) se ve lo que entra.
- **0-quinquies** · Lo que Zak puede disfrutar ya (textos, prompts, un video) va primero, en su propio mensaje.
- **0-sexies** · Una verificación que falla acusa primero al código, no al arnés.
- **0-septies** · Un arreglo de lógica se prueba corriendo el caso también contra la versión vieja.
- **0-octies** · El material que Zak pega se lee entero: puede traer otro bug adentro.
- **0-nonies** · Una verificación que no pudo correr no pasó; el código de estado no prueba el contenido; publicar cierra con render y consola limpios.
- **0-decies** · Un catálogo que promete cubrirlo todo se enumera contra la fuente, no de memoria.
- **0-undecies** · El dato de prueba se parece al real en la dimensión que importa (largo, cantidad, pantalla, membresía).
- **0-duodecies** · La lógica pura verificada no prueba la máquina asíncrona: modela el reloj o instrumenta en el aparato.
- **0-terdecies** · Lo efímero se mide contra el reloj (`performance.now()` en la misma lectura).
- **0-terdecies (b)** · Una consulta respondida aterriza en Pendientes vivos con su porqué, también lo descartado.
- **0-quaterdecies** 🜂 · Borrar código solo con texto exacto y único, nunca rangos calculados; commit limpio antes de cualquier script masivo.
- **0-quindecies** · La métrica puede estar hecha a la medida del diseño viejo: mide lo que la persona percibe.
- **0-sexdecies** · Lo que mide y lo que ocurre tienen que ser el mismo objeto (texto limpio contra crudo).
- **0-septdecies** · Una instrucción del sistema jamás viaja en el campo del usuario ni consume su cupo.
- **0-duodevicies** · Un «no hay nada» se confirma por otra vía antes de construir encima.
- **0-undevicies** · Tu propia automatización puede deshacer lo que acabas de publicar: el orden se codifica en la herramienta.
- **0-vicies** · Un atajo que decide no preguntar falla hacia el camino largo: exige todas las señales.
- **0-vicies-semel** · La causa se anuncia después de probarla.
- **0-duovicies** · Dos órdenes contrarias en un prompt: gana la pegada al dato; no le des al modelo el guion de lo prohibido.
- **0-tervicies** · Un cierre asíncrono comprueba que el recurso compartido siga siendo suyo antes de apagarlo.
- **0-quatervicies** · Un archivo que promete N cosas se abre y se cuentan, y se revisa que sirvan.
- **0-quinvicies** · Copiar un objeto vivo puede dejar la copia atada al original (malla y esqueleto).
- **0-sexvicies** · Un archivo reemplazado con el mismo nombre lo sigue sirviendo la caché: cambia la URL.
- **0-septvicies** · El testigo de una etapa (abort, turno) se suelta al final de la etapa, no de su primera llamada.
- **0-duodetricies** · Apilar filtros razonables sobre un modelo débil lleva el rendimiento a cero.
- **0-undetricies** · Una defensa construida para una condición que ya no existe se vuelve el bug.
- **0-tricies** · Un efecto afinado para un motor puede tumbar al otro (WebKit contra Chrome): reescríbelo, no lo apagues.
- **0-untricies** · Una acción que ya está en el estado pedido tiene que acusar igual, en el mismo canal.
- **0-duotricies** · Lo que se pide para una superficie no se aplica a las dos.
- **0-tertricies** · Una medida que decide el layout no puede depender del layout que decide.
- **0-quatertricies** · Si algo que no tocaste empeoró, el sospechoso es lo que cambió a su alrededor.
- **0-quintricies** · Un contrato de forma se impone con gramática (salida estructurada), no con instrucciones.
- **0-sextricies** · En una orden destructiva, la ausencia de alcance jamás significa «todo».
- **0-septtricies** · Un brief prestado no es el norte del dueño: destílalo y contrástalo con él antes de construir.
- **0-duodequadragies** · La custodia del archivo no anula la orden de cierre; el peso se toma al abrir.
- **0-undequadragies** · Una queja de «me pasó tres veces» se mide en el peor caso; si la varianza es el problema, quita el azar.
- **0-quadragies** · Un «no se puede» heredado caduca: compruébalo contra la versión de hoy.
- **0-unquadragies** · Un bug que vivió semanas en silencio se cierra con su centinela dentro de la herramienta que publica.
- **0-duoquadragies** · Trabajo repartido entre ayudantes: la base y un ejemplo completo primero, contrato por escrito, y todo bug del ejemplo se avisa en vuelo.
- **0-terquadragies** · Dos hermanos con la misma clave duplican nodos (React): toda clave lleva prefijo; la consola se lee antes de culpar a la prueba.
- **0-quaterquadragies** · Lo que no puedes percibir se mide con un instrumento que sí: la voz con un transcriptor, el balance contra una pieza aprobada, la nota con un análisis de frecuencias.
- **0-quinquadragies** · Un camino que el sistema de permisos bloquea no se rodea: se abre uno seguro con Zak (las llaves en el llavero de la Mac).
- **0-sexquadragies** · Cambiar el intermediario cambia el resultado con los mismos parámetros: se mide antes y después (la voz directa con contexto leía 50 % más lento).
- **0-septquadragies** · Lo que ilumina se suma: un halo con transparencia oscurece lo que es más claro que él.
- **0-duodequinquagies** · Un envoltorio que tira argumentos manda a la función a su otra rama: pasa todo o nombra la fase.
- **0-undequinquagies** · Lo que tiene que sentirse humano no se dibuja con trazos: se esculpe con volumen, luz y sombra, y se revisa de cerca.
- **0-quinquagies** · Un audio crudo no dice sus canales: se deducen de lo pedido (la duración) y se miden; si no, suena al doble de largo y una octava abajo.
- **0-unquinquagies** · Tras un corte, cada salida se abre y se decodifica entera; se reanuda desde lo que sí quedó.
- **0-duoquinquagies** · Un número de dinero se calcula con lo que llega a la cuenta: en México la tienda descuenta el IVA antes de su comisión (499 → ~366).
- **0-terquinquagies** · Una tarea en segundo plano muere a los 30 min: lo largo se parte en tramos que escriben su avance y se reanudan desde ahí.
- **0-quaterquinquagies** · Lo que el lienzo dibuja (alcance, objetivo, estado) sale de las reglas: si el dibujo miente, el usuario reporta un error que no existe.
- **0-quinquinquagies** · Una copia del código en otra carpeta no es una función viva: antes de portar, lee el encabezado de quien la monta.
- **0-sexquinquagies** · Lo que entrega un ayudante en segundo plano no se toca mientras trabaja: para probar sin él, una bandera o una copia, nunca mover su archivo.
- **0-septquinquagies** · Lo que se iguala se mide donde suena: voces igualadas por archivo quedaron 1.6 dB distintas en la mezcla; se miden en su ventana y se corrigen ahí.
- **0-duodesexagies** · Un navegador sin ventana también suena: toda prueba lo abre mudo y lo mata al salir, aunque falle.
- **0-undesexagies** · Una prueba en la Mac de Zak no le quita el foco ni la pantalla: ventana fuera de pantalla y sin activar, o un navegador sin ventana.
- **0-sexagies** · Un defecto que no se explica se caza apagando una pieza a la vez y comparando, antes de teorizar.
- **0-unsexagies** · Una caché cuya clave no dice de quién es el dato mezcla dueños: la clave lleva al dueño, o cada dueño su cajón.
- **0-duosexagies** · Una propuesta se fotografía junto a «hoy» (pintado con el motor real) antes de enseñarla: si pierde, se mejora antes de entregar.
- **0-tersexagies** · Un audio que suena distinto a su original se alinea contra él y se resuelve su mezcla por canales: los números dicen qué pasó y dejan repararlo sin re-exportar.
- **0-quatersexagies** · Nunca máscara ni filtro sobre un video: en una tarjeta gráfica real parpadea en negro y el Chrome sin ventana no lo ve; los videos aparecen hasta su primer cuadro.
- **0-quinsexagies** · Un bucle de video se cierra con el mismo estado: si la toma viaja, ida y vuelta (y más lento), nunca un fundido; empieza después de la transición anterior.
- **0-sexsexagies** · Una sesión de cuenta (consolas, pagos, tiendas) se abre solo en el navegador propio de Zak: un agente remoto crea cuentas nuevas y dispara congelamientos sin vuelta rápida.
- **0-septsexagies** · Lo que se guarda por usuario necesita al usuario cuando la sesión no responde: sin red, recordar al último que entró en el aparato, o la caché busca a «anon».
- **0-duodeseptuagies** · Un texto que Zak le va a pegar a otro agente no afirma pasos que él aún no hizo: lo pega al recibirlo y el otro actúa sobre algo falso.
- **0-undeseptuagies** · Una recomendación que solo optimiza el número ignora a quien la va a construir: el ganador se busca dentro de su gusto.
- **0-septuagies** · Lo que se hace sin red sube con la fecha en que se hizo: el «hoy» del servidor es el de la subida; lo que alterna se junta en la fila.
- **0-unseptuagies** · Lo que tiene que verse no espera un cuadro de animación: nace visible y la entrada es un adorno con rescate por reloj (framer espera para siempre el cuadro que no llega).
- **0-duoseptuagies** · Lo que sigue rodando de un gesto anterior no es la persona: la continuidad se mide con la hora en que nació el evento, no con la que se atiende.
- **0-terseptuagies** · Un motor que no se maneja desde fuera se prueba desde dentro (la página corre su prueba y pinta el resultado), y el servidor falso recuerda como el real o fabrica fallas.

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

Responde internamente:
1. ¿El formato del registro capturó todo lo importante, o algún campo faltó?
2. ¿Documenté algo que no fue útil cuando Claude arrancó fresco?
3. ¿Apareció un patrón o una lección nueva que merece quedarse?

Si al menos una es "sí", **reformula el protocolo**: bump de versión, pasos actualizados y entrada al
historial de cambios en `admin/CLAUDE_lecciones.md`. **Una lección nueva se escribe COMPLETA en la
biblioteca** (título, regla, porqué, hermanas) **y aquí entra UNA sola línea** en el índice. Nunca una
página: el maestro crece de a una línea por lección.

**Versión vigente:** v69 (2026-10-10). Historial completo de cambios en `admin/CLAUDE_lecciones.md`.

---

## 🜃 Historial de sesiones

#### 2026-10-08 → 2026-10-10 · ESPEJO: ENTRAR EN LO ÚLTIMO, EL SEGUIMIENTO QUE AGUANTA LA INERCIA, HASTA 8 FOTOS Y LA VOZ QUE NO DESELLA RITUALES

- ✅ **Resuelto:** **pedir por voz un ritual ya sellado lo deja sellado** (la voz leía `checked` y la consulta trae `today`;
  `toggle_ritual` alterna) · **el Espejo:** al entrar se ve el último mensaje también en el celular (la medida del cromo
  anotaba «está leyendo arriba» con la vista recién nacida) y el aterrizaje aguanta 2.5 s lo que llega tarde · **el
  seguimiento aguanta la inercia** del trackpad o del dedo (Enter a media inercia dejaba el envío 1,400 px fuera de
  pantalla) · las ligas largas caben en su burbuja y en el reflejo · cada foto mide lo suyo · **hasta 8 fotos por mensaje**
  con **tope de 60 fotos en 24 horas por persona**: al topar, el mensaje vuelve al campo con sus fotos y el aviso dice
  cuántas quedan · las fotos del Tripulante se guardan en el cofre del aparato (la charla guarda solo el puntero) · app de
  la Mac 1.1.52 y 1.1.53 publicadas; el iPhone de Zak con la 1.1.52.
- 📁 **Archivos:** escaner-app: `useComandoVoz` v3.2 (7fed1d2), `EV_Oraculo` v6.26 (de96374) y v6.27 (2e9dafa),
  `imgCache` v1.1, i18n `espejo` v1.25, banco `espejo.ts` v1.1 + `datos.ts` v1.4 + `arranque.tsx` v1.4 · app de la Mac
  1.1.52 (65c172e) y 1.1.53 (958938c).
- 🔌 **Edge functions deployed:** `oraculo-chat` v1.55 (admin ace1a33): lee hasta 8 fotos; el freno de visión cobra una
  unidad por foto (60 por persona, 180 por IP, 6,000 en todo el ecosistema, ventanas de 24 h) y al topar responde
  `fotos: true`, `limite` y `quedan`. Sin migración (usa `reserve_edge_spend`).
- ⏳ **Pendiente:** nada de esta sala (las dos consultas abiertas están en Pendientes vivos).
- 💡 **Decisiones:** el ojo del Espejo sigue siendo Gemini 3.6 Flash; Zak no quiere la prueba a ciegas con DeepSeek V4.1
  Flash por ahora · la cura de una pieza compartida por las dos caras va en las dos (la burbuja); la Matriz no se tocó ·
  al instalar en el iPhone se espera 2 minutos como máximo; si la Mac no lo ve, se detiene y Zak compila en Xcode (el
  proyecto de iOS queda con el código copiado).
- 🔧 **Patrones nuevos:** banco del Espejo (`&espejo`, `&prueba=espejo&pasos=…`, `&mudo`; con `&conservar` el servidor
  falso recuerda la charla) que corre sola y pinta su resultado · el motor de Safari sin ventana: `xcrun simctl boot` +
  `openurl` + `io screenshot` (iPad = cara de computadora, iPhone = teléfono) · inercia del trackpad por CDP con los pasos
  a ritmo fijo y su `timestamp` · leer el localStorage de la app de la Mac (sqlite en UTF-16LE, solo las claves necesarias)
  · la caja negra anota `espejo-seguir-cede` y `espejo-seguir-agota` · un cuerpo de 8 MB pasa la plataforma (sonda con
  llave inválida). Lecciones 0-duoseptuagies y 0-terseptuagies; detalle en [[referencia-probar-espejo]],
  [[integrar-desde-worktree]] y [[feedback-iphone-no-esperar]].
- 🧬 **Versión del sistema:** app de la Mac 1.1.53 · `oraculo-chat` v1.55 · `EV_Oraculo` v6.27 · protocolo v69.

#### 2026-09-27 → 2026-10-09 · ESCÁNER: LA APP QUE NO SE TRABA, LA BIENVENIDA EXPRÉS, LAS TIENDAS 1.1.6 Y LA SALA DE LOS CV

- ✅ **Resuelto:** **la Bitácora y las capas del Radar ya no quedan invisibles** (vigía del reloj de cuadros en
  `index.html`, entrada que nace visible con rescate por reloj, velo con «Cerrar» y «Reiniciar la app» si una capa tarda
  o falla, y clave propia para cada capa y el Espejo) · **el sello de entrada tiene tres salidas** (reloj, guardia a los
  5 s y salida CSS a los 7 s) · **caja negra** del arranque en el teléfono · **bienvenida exprés**: aviso médico, «¿Qué te
  trajo aquí?» y directo a lo que eligió, gratis y sin muro de pago (quien viene por los libros aterriza en Holoteca →
  Códices), con «Empieza gratis, sin tarjeta.» · el interruptor «Onboarding · Duración» y la cuenta de «Entró directo»
  en el Motor, publicados el 2026-10-09 (el 27 se habían puesto en `MI_Growth.tsx`, una copia que nadie importa: caí en
  la 0-quinquinquagies) · App Store 1.1.6 (build 29) y Android 1.1.6 (vc9, `.aab` firmado) con todo esto · **los CV de
  Zak**: carpeta `admin/aplicaciones` ordenada con cuatro versiones (micro1 original, DataAnnotation doble, Spanish
  Specialist y micro1 QA Engineer 2D) y su propia sala.
- 📁 **Archivos:** escaner-app (d3a1d3e, 742c08d, 9ed3fdc): `index.html` (vigía), `lib/cajaNegra.ts` v1.1,
  `EV_CapaSegura.tsx` v1.0, `EscanerVibracional` v13.136, `EV_Shared` v2.49, `EV_Bitacora` v1.22, `EV_PlanVuelo` v1.15,
  `EV_RealidadElegida` v1.8, `RitualDeLlegada` v3.3, `OnboardingV2` v2.11, `growthFlags` v2.2, `main.tsx` v1.1,
  diccionarios onb2 v2.9 y shell v1.5, app de la Mac 1.1.47 · Code (0acff7f, 0375851): `MotorDeIntervencion` v5.3 y
  `MI_Growth` v1.2 (marcada como copia sin uso) · rsv-web publicado el 2026-10-09 · admin `aplicaciones/` (c5c30ee,
  966fb44, 16d66eb): `CLAUDE.md`, `LEEME.md`, `.claude/settings.json` y un `build_resume.py` por versión.
- 🗄️ **Migraciones SQL aplicadas:** `20260927_onb_expres.sql` (el embudo cuenta el paso 14 aparte del paywall y
  `completed` significa solo «llegó al paywall»); Zak la pegó, verificado el 2026-10-09.
- ⏳ **Pendiente:** decidir si la bienvenida exprés se queda (en Pendientes vivos).
- 💡 **Decisiones:** la bienvenida se recorta, no se quita (el aviso médico es obligatorio y la pantalla de elección
  manda a cada quien a lo que vio en el video) · la oferta de Sintonía aparece al llegar a un límite real · se saltó la
  1.1.5 (iOS 1.1.6 build 29, Android vc9) · los CV dicen solo lo comprobable (Vite, no Next.js; el puesto de micro1 con
  su título real), uno por puesto, y Zak no aplica a los tracks de programación de DataAnnotation · la sala de los CV se
  abre en `admin/aplicaciones`.
- 🔧 **Patrones nuevos:** vigía de `requestAnimationFrame` en línea en `index.html` (umbral 200 ms, revisión cada
  125 ms, solo con la página visible; `window.__rsvRescatesDeCuadro`) · lo que tiene que verse nace visible
  (`initial={false}` + `riseLayerIn` con guardia por `setTimeout`) · `CapaSegura` (velo, frontera de errores y
  `PresenceContext` en null para cerrar al instante) · caja negra `rsv_caja_negra` que se lee del iPhone por
  `devicectl` ([[referencia_leer_caja_negra_iphone]], [[proyecto_robustez_arranque_escaner]]) · la vista previa oculta
  como laboratorio de reloj detenido (forzando `document.visibilityState`) · generador de CV (PDF y `.md` de una sola
  fuente, ajustado a una hoja) · antes de publicar rsv-web con trabajo ajeno sin commit, se comprueba que ya esté en el
  paquete vivo. Lección 0-unseptuagies.
- 🧬 **Versión del sistema:** App Store 1.1.6 · Android 1.1.6 (vc9) · Motor con «Onboarding · Duración» · protocolo v68.
- 🧭 **Su arranque** (salió del 🔮 al cerrar la sala del Espejo del 2026-10-10, porque solo la sala más reciente lo
  lleva; el estado vive en `admin/aplicaciones/CLAUDE.md`): para los CV y las solicitudes de trabajo, abrir la carpeta
  `admin/aplicaciones` (su `CLAUDE.md` trae el banco de datos comprobados, las reglas y el estado de cada solicitud);
  para lo demás, la sala del proyecto que toque.

#### 2026-10-08 · II · LA APP SIN INTERNET: TODO ABRE SIN RED Y LO HECHO SIN CONEXIÓN SE SINCRONIZA SOLO

- 💡 **Decisiones:** lo que necesita al servidor para pensar o subir archivos sigue pidiendo red (Espejo, Decodificadores,
  fotos y notas de voz, sesión, pagos, nombre y foto, invitaciones y notas compartidas) · una escritura sin regla, sin red,
  responde null como siempre (nada se finge hecho) · los límites del plan se aplican igual sin red · lo creado y borrado
  sin red no sube nada.
- 🔧 **Patrones nuevos:** `lib/sinConexion` (identidad recordada solo si la sesión no responde; `sesionCaida()` distinto de
  «la sesión aún carga»; caché de lecturas en IndexedDB; fila con reglas, compactación, ids provisionales y `extras` que se
  quitan si el servidor responde PGRST202) · revivir Clerk con `useClerk().loadClerkJS()` (clerk-react no reintenta solo)
  · las imágenes de R2 se guardan con `fetch(url, { cache: "reload" })` (la copia que dejó un `<img>` sin CORS no se puede
  leer) · banco con `&sinRed&conservar`, `window.__bancoVolverRed()` y `window.__bancoSinMigracion` · una función con
  permiso solo de servicio se verifica desde fuera sin ejecutarla: «permission denied» (42501) prueba que la firma existe y
  PGRST202 que no · si Zak reporta algo sin red, la caja negra anota `sin-red-anota`, `sin-red-subidas`, `sin-red-negada`,
  `sin-red-abandona` y `sesion-revive`. Lección 0-septuagies.
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-08 · PUBLICIDAD: EL ESPEJO EN DOS COMERCIALES, LA CAMPAÑA VIVA EN INSTAGRAM Y LAS CONSULTAS DE JUEGOS

- 💡 **Decisiones:** el Espejo de la noche va primero, solo y solo en Instagram · las promociones se hacen desde
  instagram.com en la computadora (en la app de iOS Apple cobra 30 %) · las siguientes pruebas usan el mismo público ·
  las propuestas de juego se buscan dentro del gusto de Zak · Terra Cristal pasa al frente de Lúcido.
- 🔧 **Patrones nuevos:** en esta cuenta de Meta, optimizar a Lead obliga a ubicaciones automáticas (Ventas no ofrece
  Lead y Tráfico ni deja fijar la edad): solo Instagram es promocionar el Reel · el píxel se comprueba con la función
  pública de la landing y su llave · dos tomas de Blender que comparten cuadros se pisan los renders · un fundido entre
  dos capas solo cuando ya coinciden. Lecciones 0-duodeseptuagies y 0-undeseptuagies; detalle en
  [[proyecto_publicidad_pagada]] y [[proyecto_sonora]].
- 🧭 **Su arranque ya se ejecutó** (la página nueva con versiones está en vivo y los videos 05 a 08 entregados): su 🔮
  salió de aquí al cerrar la sala del 2026-10-09, porque solo la sala más reciente lleva 🔮; lo que sigue de la campaña
  vive en Pendientes vivos y en [[proyecto_publicidad_pagada]].
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-07 · II · CLAUDE FOR STARTUPS, LUDUS CERO EN EL SISTEMA SOLAR Y LOS CÓDICES QUE SE LEEN SIN INTERNET

- 💡 **Decisiones:** aplicar como Red Solar Viva (el correo debe ser del dominio del sitio; escanervibracional.com no
  tiene correo) · nada de Console ni cuentas por agentes remotos · Ludus Cero vive en play.redsolarviva.com hasta que haya
  ingresos y el planeta apunta directo a play (con redirección la barra termina en play igual) · los Códices se guardan
  solos y un avance pendiente de este aparato gana al reabrir · la protección de propiedad de GoDaddy no hace falta (basta
  el candado del dominio y los dos pasos).
- 🔧 **Patrones nuevos:** `useTripulanteId` (el último Tripulante del aparato cuando la sesión no responde) · prueba sin
  red en el banco con interruptores dentro del servidor falso (`window.__bancoOffline`, `&sinSesion`, `&conservar`) y
  `navigator.onLine` sobrescrito por CDP, porque cortar la red también corta el servidor de desarrollo · la landing se
  prueba con la medición bloqueada (`Network.setBlockedURLs`) para no ensuciar la campaña · copias ligeras de portadas
  por slug, las mismas en la web y en la app. Lecciones 0-sexsexagies y 0-septsexagies.
- 🧭 **Su arranque** (salió de aquí al cerrar la sala de publicidad del 2026-10-08, porque solo la sala más reciente
  lleva 🔮; el estado vive en Pendientes vivos y en la memoria `proyecto-claude-for-startups`): si Zak trae el resultado de la revisión,
  seguir el pendiente vivo; si ya los aceptaron, borrar ese pendiente, la memoria `proyecto-claude-for-startups` y el
  registro del incidente de esta entrada.
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-07 · FOTÓN CERO: SU SALA PROPIA, EL INSTRUMENTO QUE SUENA Y EL AUDIO QUE VOLVIÓ AL ESTÉREO

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
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-04 · IV · LÚCIDO: SIN MARCO, PASOS PROPIOS Y LA PÁGINA QUE SELLÓ LUZ DE CINE Y A TONALLI

- 💡 **Decisiones (Zak):** nivel 3 «luz de cine» (640 x 360 con la luz a resolución completa, la receta de Terra
  Cristal) · Tonalli de protagonista · selector con Tonalli, Teyolia y Temictli, Ollin fuera · el arte HD fue solo para
  verlo · cuatro direcciones · orden: el nivel 3 y los personajes, la propuesta 3 y luego la 1 (las épocas, que le
  encantaron); después la 2, la 4 y la 5 · las salas de Lúcido se abren en la carpeta `Ludus Cero/lucido`.
- 🔧 **Patrones nuevos:** personajes esculpidos con campos de distancia que dan a la vez el pixel de cada nivel (contorno
  del color de cada parte y línea donde algo pasa por delante), las ocho vistas, la caminata y el arte HD · un
  comparador honesto pinta «hoy» con el motor real · la curva de dificultad se mide por sala con el bot
  (`prueba.ts dificultad`) · el volumen de un sonido nuevo se mide contra lo aprobado con OfflineAudioContext · fotos por
  sección (una página completa con muchos lienzos de WebGL se atora). Detalle en [[proyecto_juego_pixel]].
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-04 · III · ESCRITORIO PASO A PASO: LA COMUNIDAD COMO HERRAMIENTA, ESCAPE QUE CIERRA Y EL LOGO QUE SUENA

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
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-04 · II · NAVEGANTE: SINFONÍA, ODISEA, LA CONSTELACIÓN Y LUDUS CERO PREMIUM CON EL TRÁILER

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
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

#### 2026-10-04 · TRÁILER DE NAVEGANTE PARA STEAM: 94 SEGUNDOS CON EL MOTOR REAL Y SU SEGUNDA PASADA

- 💡 **Decisiones:** 16:9 1920×1080 a 60 (el formato de Steam) · la tarjeta final dice «Empieza gratis ·
  play.redsolarviva.com» (tutorial y Membrana 1 libres; si llega a Steam solo cambia `tomas/s23_final.js`) · narrador
  grave de tráiler y una voz distinta por personaje · los letreros llevan la tipografía del logo (Orbitron) y el
  filamento de la Red · donde la voz habla de la música del juego, suena la del juego.
- 🔧 **Patrones nuevos:** tráiler pintado con el motor del juego (copia parchada con cámara, render por CDP en paralelo
  y una bitácora de eventos que pone cada sonido en su cuadro) · ayudantes por grupo de tomas con contrato y una toma de
  ejemplo · música de ElevenLabs con un trozo por acto y su compás medido · la música se aparta solo en la banda de la
  voz (+6 dB) y las voces se igualan en su lugar · en ffmpeg 8 cada etapa va a su archivo. Detalle en
  [[proyecto_trailer_navegante]] y [[feedback_trailers_juego]].
- *Entrada completa en* `admin/CLAUDE_archivo_2026-09-20_en_adelante.md`.

*Las entradas anteriores viven en* `admin/CLAUDE_archivo_hasta_2026-08-04.md` (2026-04-18 → 2026-08-22) *y en*
`admin/CLAUDE_archivo_2026-08-30_a_2026-09-18.md` (2026-08-30 → 2026-09-18), *y desde el 2026-09-20 en*
`admin/CLAUDE_archivo_2026-09-20_en_adelante.md`. *No se cargan por sesión: lo
durable de cada una ya está en las memorias y en el código.*
