# Biblioteca de lecciones del Protocolo de Cierre

> Aquí vive cada lección COMPLETA (regla, porqué, hermanas) y el historial de cambios del protocolo.
> El índice (una línea por lección) vive en el `CLAUDE.md` maestro, en «Lecciones · índice». Este
> archivo NO se carga por sesión: se abre cuando una línea del índice no alcanza. Una lección nueva se
> escribe completa aquí y con una sola línea allá (Paso 4, v53).

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

### Paso 0-septtricies — Un BRIEF PRESTADO no es el norte del dueño

Cuando el pedido llega con una estructura dictada por un tercero (otra IA, un
template, un ejemplo admirado), esa estructura es un INSUMO, no el norte.
Construir la primera versión completa encima de un guion prestado tiene un
modo de fallo carísimo: la obra puede salir FIEL AL GUION y aun así ser
basura para el dueño, porque el guion nunca pasó por su estómago. Y el
fracaso no enseña nada del gusto real: solo enseña que el guion era ajeno.

**Regla:** antes de construir sobre un brief heredado, se destila en UNA
propuesta propia (estructura + decisiones clave en lenguaje del dueño) y se
contrasta con él; sus respuestas, no el guion, son el norte. Si el dueño ya
dijo "hazlo" sobre el guion ajeno, la propuesta va igual: cuesta un mensaje
y ahorra una versión entera.

**La señal de alarma:** notar que el texto que estás siguiendo argumenta con
la voz de OTRO sistema ("no hagas X, haz Y") en vez de con decisiones del
dueño. Ese documento opina; el dueño todavía no.

**Por qué.** El 2026-08-30 zakcero.com v1 se construyó fiel al prompt maestro
que Grok le había redactado a Zak (el altar, la calle, museo editorial
sobrio). Zak lo tiró entero: "es una basura, fue mala directriz que te haya
dicho la estructura que me dio Grok". La v2 nació de contrastar con ÉL
(cuatro preguntas: portada, atmósfera, dinámicas, aliados) y sus respuestas
reales (cómic dinámico, su caricatura, cero dinámicas, todo aterrizado)
no se parecían en nada al guion prestado. La versión tirada costó una tarde;
las preguntas costaron un mensaje.

### Paso 0-duodequadragies — La CUSTODIA del archivo no anula la orden de cierre

Una nota de custodia en la cabecera («este archivo lo tiende otro») dice quién lo cuida en el
día a día; no dice que una orden directa del dueño deje de valer. "Cerrar Sala de Comando" es
el protocolo ENTERO, sobre ESTE archivo, siempre: registro de la sesión, limpieza, evolución y
respaldo. Si la cabecera y la orden chocan, gana la orden, y la duda se dice en una línea ANTES
de empezar, no después de reportar "cerrado".

Y el Paso de APERTURA no es opcional: el `wc -c` va antes de la primera lectura de código. Esta
sala abrió con el archivo en 172.000 caracteres y no lo pesó; el aviso llegó al final, cuando
Zak pidió la lista para el barrido.

**Por qué.** El 2026-09-18 la sala reportó "sala cerrada" habiendo actualizado solo memorias y
documentos del proyecto: leí la nota de Grok Build como una prohibición y salté el protocolo.
Zak: *"¿por qué NO CERRASTE sala de comando?"*. Un cierre a medias es peor que ninguno, porque
se reporta como hecho.

### Paso 0-undequadragies — Una queja de "me pasó tres veces" se mide en el PEOR CASO, no en el promedio

Cuando lo que se reporta es una EXPERIENCIA repetida ("me atacó tres veces seguidas", "se me borró dos veces",
"siempre me toca al final"), la tentación es modelar el caso que uno imagina, arreglarlo y dar por cerrado. Pero
esas quejas casi nunca describen el promedio: describen **la cola de la distribución**, el peor caso que el
sistema permite. Un arreglo que corrige el caso imaginado puede ser correcto, medible y verde en el arnés, y aun
así dejar la experiencia idéntica.

**La sonda es una simulación del sistema completo midiendo el PEOR caso**, no la media: cuántos turnos ajenos
como máximo pasan entre dos propios, cuántos reintentos como máximo, cuánto es lo más que puede tardar. Si el
peor caso sigue siendo el que la persona describe, el arreglo no era el arreglo.

**Y cuando la varianza es el problema, la cura suele ser quitar el azar de en medio**, no acotarlo: un orden que
se sortea UNA vez y se repite garantiza lo que la persona espera ("si ya movió a los tres, me toca"), mientras que
un sorteo por ronda con reglas encima solo estrecha la cola.

**Por qué.** El 2026-09-19 Zak reportó que la Legión le atacaba con sus tres unidades y volvía a mover a las tres
antes de tocarle. El primer arreglo fue "nadie actúa dos veces seguidas": correcto, medido (27 de 500 rondas antes,
0 después) y sin efecto sobre lo que él veía, porque su queja no era una unidad repitiendo sino el hueco entre dos
turnos suyos, que el sorteo por ronda dejaba llegar a SEIS. La cura real fue una vuelta estable.

**Corolario de arneses, de la misma sala:** ningún arnés de navegador puede SOSTENER una tecla. `computer key` manda
pulsación y soltada en el mismo milisegundo (medido con un espía de eventos: idéntico `performance.now()`), los
eventos sintéticos de JS no mueven `isPressed`, y AppleScript no llega a la página. Todo lo que dependa de un
estado sostenido (caminar, mantener, arrastrar) se prueba en el motor, inyectando el estado a mano.

### Paso 0-quadragies — Un «NO SE PUEDE» heredado caduca: se comprueba contra la versión de hoy antes de repetirlo

Una limitación de una herramienta ajena (una licencia, una API, un navegador) no es un hecho del mundo: es una foto
de cuando se midió, y las herramientas cambian. Cuando un «no se puede» llega desde la memoria o desde una sala
anterior, vale como PISTA. Antes de repetírselo al dueño como un hecho, o de diseñar un rodeo encima, se comprueba
en un minuto contra la versión que está instalada hoy: el ajuste existe o no existe, la llamada responde o no.

La señal de alarma es un rodeo elaborado para esquivar algo que nadie volvió a medir.

**Por qué.** Durante dos salas le dije a Zak que el letrero «Made with Unity» no se podía quitar sin pagar Unity Pro,
y hasta le propuse teñirle el fondo para disimularlo. Era cierto hace años. Desde Unity 6 se apaga con un ajuste
también en la licencia gratuita: comprobarlo fue una línea, y el letrero desapareció. El rodeo habría quedado para
siempre en el producto por una frase copiada de la memoria.

Hermano del **0-duodevicies** (un «no hay nada» se confirma por otra vía): allí miente un vacío; aquí miente una
negativa que fue verdad.

### Paso 0-unquadragies — Un bug que vivió semanas en SILENCIO se cierra con su centinela, no solo con su arreglo

Hay fallas que nadie de la casa puede ver: ocurren en un camino por el que quien publica nunca pasa (el regreso de
Google a la web, un aparato que no usamos, un idioma que no hablamos). No se delatan solas; las descubre alguien de
fuera, semanas después.

**Regla:** al arreglar una falla así, el cierre incluye la comprobación que la habría cazado el día que nació, y va
DENTRO de la herramienta que publica (el guion de despliegue, el arnés), no en la memoria de nadie. Si vuelve, la
publicación se niega a pasar. Y el alcance de un cambio se prueba también en las superficies que NO eran su objetivo.

**Por qué.** El 2026-09-24 Zak no podía entrar a la web: al volver de Google o Apple aterrizaba en un 404. Llevaba así
desde el 5 de septiembre, cuando una regla del servidor, reescrita para el actualizador de la Mac, dejó fuera
`/oauth-callback` al copiarla de otra lista. Diecinueve días sin que nadie lo viera, porque los teléfonos y la app de
la Mac no pasan por esa página. El arreglo fue una línea; la guardia en `publicar-escritorio.sh` impide la segunda vez.

Hermano del **0-undevicies** (tu automatización puede deshacer lo que hiciste): allí se codifica en la herramienta el
orden; aquí, la vigilancia.

### Changelog del protocolo

- **v53 (2026-09-25):** 🜂 **El protocolo se parte en dos** (decisión de Zak, tras varias salas
  intentando adelgazar el maestro sin lograrlo). Las 42 lecciones completas y este historial se mudan
  aquí, a `admin/CLAUDE_lecciones.md`; en el maestro queda un índice de UNA línea por lección, un
  «Mapa de destinos» condensado del 0-bis y los pasos 1 a 4. El Paso 4 manda desde ahora: lección nueva
  completa aquí y una sola línea allá. Por qué: el barrido solo revisaba Pendientes vivos (2% del
  archivo) mientras el protocolo (57%) crecía una página por cierre. En la misma pasada salieron del
  maestro las secciones de Framer (cancelado), el motor de reservas (apagado), la arquitectura del
  Escáner (a `escaner-app/CLAUDE.md`) y el mapa de la web (a `Code/CLAUDE.md`); todo verbatim en
  `admin/CLAUDE_archivo_secciones_2026-09-25.md`.

- **v52 (2026-09-25):** Paso 0-unquadragies — un bug que vivió semanas en silencio se cierra con su centinela dentro
  de la herramienta que publica. El regreso del inicio de sesión web dio 404 diecinueve días porque el cambio era para
  otra superficie y nadie de la casa pasa por esa página; el arreglo fue una línea y la guardia vive en el guion.

- **v51 (2026-09-19 · II):** Paso 0-quadragies — un «no se puede» heredado caduca: se comprueba contra la versión de
  hoy antes de repetirlo. Dos salas diciendo que el letrero de Unity exigía licencia de pago, con un rodeo ya
  propuesto, cuando desde Unity 6 se apaga con un ajuste. Una limitación ajena es una foto de cuando se midió.

- **v50 (2026-09-19):** Paso 0-undequadragies — una queja de "me pasó tres veces" se mide en el PEOR CASO, no en
  el promedio; y cuando la varianza es el problema, se quita el azar en vez de acotarlo. El primer arreglo del turno
  repetido ("nadie actúa dos veces seguidas") era correcto y medido, y no cambiaba nada de lo que Zak veía: su queja
  era el hueco de hasta seis turnos ajenos que el sorteo por ronda permitía. Trae el corolario de que ningún arnés de
  navegador puede sostener una tecla, así que lo que dependa de un estado sostenido se prueba en el motor.

- **v49 (2026-09-18):** Paso 0-duodequadragies — la custodia del archivo no anula la orden de
  cierre: "Cerrar Sala de Comando" es el protocolo entero sobre este archivo aunque la cabecera
  diga que lo tiende otro, y la duda se dice antes de empezar. Y el peso se toma al ABRIR.

- **v48 (2026-08-30):** Paso 0-septtricies — un BRIEF PRESTADO no es el
  norte del dueño: la estructura dictada por un tercero (otra IA, un
  template) se destila en una propuesta propia y se contrasta con el dueño
  ANTES de construir la primera versión encima. zakcero.com v1 salió fiel
  al prompt de Grok y Zak la tiró entera; la v2 nació de sus respuestas.

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
