# CLAUDE.md — Red Solar Viva / Escáner Vibracional

> 🜂 Desde **2026-09-04** este archivo maestro lo tiende **Grok Build**.
> Claude Code ya no lo edita. Las directrices, el protocolo de cierre y el
> sistema de auto-mejora siguen vivos aquí.

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
| Sesión de Grok Build / Conversación | **[SALA DE COMANDO]** |
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
| **Terra Cristal** | `terra-cristal/CLAUDE.md` ✅ hecho | abrir la carpeta `terra-cristal` |
| Escáner Vibracional (app) | `escaner-app/CLAUDE.md` ✅ hecho (2026-09-25) | abrir `escaner-app` |
| Web (código en `Code/`) | `Code/CLAUDE.md` ✅ hecho (2026-09-25) | abrir `Code` |
| Web (rsv-web) | `rsv-web/CLAUDE.md` — pendiente | abrir `rsv-web` |
| Zak Cero | `zakcero/CLAUDE.md` — pendiente | abrir `zakcero` |
| **Kal'El** (somacero.com) | `kalel/CLAUDE.md` ✅ hecho (2026-09-24) | abrir la carpeta `kalel` |

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

**Versión en circulación:** App Store **1.1.4 LIVE**, en curso **1.1.5** (sin
publicar). Android: **pública en Google Play** (vc7). Detalle en
[[referencia_version_en_tienda]].

---

### 🟢 Terra Cristal · lo que sigue abierto

🜂 **Sus reglas de construcción, su hoja de ruta y su estado NO viven aquí**: están en `terra-cristal/CLAUDE.md`
(el archivo que se carga al abrir una sala DENTRO de esa carpeta) y en `terra-cristal/Docs/`. Aquí solo queda lo
que necesita una decisión de Zak o una mano suya.

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

- **Que subir cambios del Escáner a GitHub no publique la web por su cuenta** (propuesta del 2026-09-25, falta el
  sí de Zak). Hoy cada push, aunque solo toque documentos, dispara un despliegue automático que deja el instalador
  de la Mac en 404 hasta volver a correr `./publicar-escritorio.sh` (pasó dos veces el 2026-09-25). La cura es una
  línea en `escaner-app/vercel.json` (`"ignoreCommand": "exit 0"`): el guion quedaría como el único camino de
  publicación, que es lo que ya dice el Mapa de destinos.

### 🟡 Higiene, cuando toque

- **Arquitectura de nombres** (2026-08-31, propuesta entregada, falta el sí de Zak): Zak Cero=calle, Zak'Haar=firma
  musical (Spotify NO se rebrandea; MVs completos al canal @zakhaarsolar por el Official Artist Channel), Fotón
  Cero=estudio (su IG estrena con los MVs; estrenos como collab con @zakcero), semillas de conciencia renacen como
  cuenta del Escáner cuando haya cadencia; detalle en [[proyecto_planeta_zakhaar]].

---

## 🜂 Protocolo de Cierre de Sesión · v54 (2026-09-25 · II)

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
| 🥇 iPhone | `cd escaner-app && ./al-iphone.sh` | Claude |
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

**Versión vigente:** v54 (2026-09-25 · II). Historial completo de cambios en `admin/CLAUDE_lecciones.md`.

---

## 🜃 Historial de sesiones

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

*Las entradas anteriores viven en* `admin/CLAUDE_archivo_hasta_2026-08-04.md` (2026-04-18 → 2026-08-22) *y en*
`admin/CLAUDE_archivo_2026-08-30_a_2026-09-18.md` (2026-08-30 → 2026-09-18). *No se cargan por sesión: lo
durable de cada una ya está en las memorias y en el código.*
