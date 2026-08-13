# PROMPT · ESPEJO VIBRACIONAL — LO QUE QUEDÓ PENDIENTE

*(Copiar y pegar tal cual. Todo es del Espejo. La reconstrucción de
`EV_Oraculo.tsx` YA está hecha y el archivo compila limpio; esto es lo que
NO entró en aquel prompt.)*

---

**SEIS TRABAJOS DEL ESPEJO.** Ordenados por lo que más se siente.

## 1 · Quitar el selector de modelo (rápido)

En el menú del header hay un selector solo-admin entre tres cerebros (`v4`,
`v4p`, `r1`), con estado `espejoModel` y persistencia en `rsv-espejo-model`.

**Zak: "yo tengo que tener lo mismo que los demás".** Fuera: el bloque de UI,
el estado, el `localStorage`, y el `model` que se manda al edge. El Espejo
corre un solo cerebro para todos; el cambio de modelo vive en el servidor.

⚠️ **Cómo NO hacerlo:** el borrado de ese bloque fue lo que destruyó 2.693
líneas el 2026-08-08. Se quita con `Edit` de texto exacto y único, nunca con
un script que calcule rangos de líneas por patrones de JSX. Commit limpio
antes de empezar.

## 2 · Streaming real (SSE), la palanca grande

Hoy el reflejo se espera COMPLETO en el servidor y recién entonces viaja. Zak
quiere token por token.

**Estado actual medido:** el temporizador decorativo del cliente ya murió
(pasó de `Math.min(6200, 1100 + len*16)` a `Math.min(480, …)`), así que esos
hasta 6,2 segundos ya se recuperaron. Lo que falta es el tiempo hasta la
PRIMERA palabra, que hoy es el reflejo entero.

**Qué construir:**
- `oraculo-chat`: pasar `stream: true` a OpenRouter y devolver un
  `ReadableStream` con SSE en vez de esperar el JSON completo.
- Cliente: leer el stream con `fetch` + reader y pintar conforme llega.

🜂 **El cuidado que decide si esto sale bien.** Hoy hay post-proceso que
ocurre SOBRE EL TEXTO COMPLETO y no puede romperse: la extracción de las
marcas `⟦GEN⟧` del Reflejo ilustrado (con su llamada de reparación si el
modelo no las puso), el guardado de la conversación, el corte para la voz y el
Modo Presencia (que agrupa el reflejo en bloques). El streaming tiene que
acumular el texto y correr todo eso AL CERRAR el stream, no reemplazarlo.
Modo Presencia probablemente conviene dejarlo esperando el texto completo: su
ceremonia se diseñó sobre el reflejo entero.

**Verificar:** charla normal, Reflejo ilustrado (que las imágenes sigan
saliendo), Modo Presencia, voz, corte por muro freemium, error de red a mitad
del stream, y el corte a 55 s que ya existe.

## 3 · Renombrar los reflejos guardados

En "Mis reflejos" cada hilo toma su título de la primera frase del Tripulante.
Zak quiere poder editarlo. Hace falta guardar el título elegido (columna en la
tabla de conversaciones del Espejo + su RPC) y un gesto de edición en la lista.

## 4 · Rediseñar el botón de enviar

**Zak: "se ve de juguete, hay que hacerlo de alta tecnología, que se sienta
eléctrico, futurista".** Aplica a escritorio y móvil. El lenguaje visual de la
casa ya tiene de dónde tomar: los brackets de esquina, el barrido de luz
interior, el borde de aurora dorado→cian en deriva del botón "Continuar el
reflejo" de la ceremonia de Presencia. Que se sienta de la misma familia.

## 5 · Panel de uso (idea de Zak, decidir el alcance con él)

**Zak: "hay que ver cómo podemos poner un contador o una barra de uso, como
usan otras IAs. Que en el menú del header se abra una ventana de uso y diga
cuánto llevan y cuánto les queda: audio, texto e imágenes."**

Su duda, textual: es mejor para la transparencia, pero teme que marcar
límites se sienta restrictivo. Su propia conclusión fue que sí lo quiere,
sobre todo para la voz, que es donde el límite se siente.

**Recomendación al construirlo:** que NO aparezca en cada mensaje (eso sí
angustia); que viva detrás del menú, a un toque, como consulta voluntaria. Y
que hable en la unidad que la persona VIVE — "te queda media hora de voz", no
"te quedan 300 unidades". Los topes reales viven en `oraculo-chat`
(`ORACULO_GLOBAL_DIA`, `ORACULO_VISION_GLOBAL_DIA`) y en la voz (600/día =
1 hora real · 5.000/mes = 8 horas).

## 6 · Panel de IAs del Motor + telemetría de la voz

En el Motor → pestaña "IAs" falta:

- **Los parámetros de cada elección**, no solo el modelo. Para el Espejo ya
  están medidos y son estos: modelo `deepseek/deepseek-v4-flash-0731`,
  `provider: { sort: "throughput" }` (se pide el proveedor **más rápido**, no
  el más barato), `temperature: 0.8`, `max_tokens: 3600`, y el **pensamiento
  APAGADO** (`reasoning.enabled: false`) porque V4 es híbrido y razonar
  costaría segundos y movería la voz. Reintento en modo vainilla si vuelve
  vacío; corte a 55 s.
- **Las imágenes**, que no están en el panel: `fal.ai` con `flux-2-pro`,
  $0.03 por imagen, tope comercial 2/día.
- **La navegación por voz**, que tampoco está: `voz-intent`, Groq con
  `llama-3.1-8b-instant` para navegar y `llama-3.3-70b-versatile` para
  acciones, con OpenRouter (`meta-llama/llama-3.1-8b-instruct` y
  `meta-llama/llama-3.3-70b-instruct`) como respaldo si no hay `GROQ_API_KEY`.
- **Su telemetría por nodo** en Telemetría del Núcleo, junto a Reflejos,
  Visión, Voz y Decodificadores. Hoy el gasto de la voz no se ve por persona.

## Contexto que no hace falta re-investigar

- **Qué recibe el Espejo en cada mensaje:** su identidad completa, el CONTEXTO
  VIVO (seis pilares con valor y antigüedad, Índice de Luz, rachas con días y
  récord, Sendero, Plan de Vuelo, Realidad Elegida, medallas, nombre y plan),
  la MEMORIA destilada, fragmentos de los Códices por búsqueda de significado,
  y el historial del reflejo activo.
- **Lo que el Espejo NO sabe:** la estructura de la app. Si alguien pregunta
  "¿dónde cambio mi idioma?", no lo sabe. La voz sí conoce el mapa pero no
  conversa. Zak pidió NO construir esto todavía: es decisión aparte, con la
  preocupación explícita de no cambiar cómo contesta hoy en las charlas
  personales, que es lo que más le gusta del producto.
- **Medidas del ancho:** 700px de columna = 13,8 cm en la pantalla de Zak = 81
  caracteres por línea con la letra en 17.5. El compositor va a 660.

## Reglas de la casa

- Version bump en el header de `EV_Oraculo.tsx` y de todo lo tocado.
- `npx tsc -b --force` (NO `tsc -p`, que no verifica nada en escaner-app).
- El SQL lo pega Zak en el SQL Editor; `functions deploy` lo corre él. El
  deploy a Vercel lo corre Claude (build local + `--prebuilt`).
- Commit antes de cualquier cambio grande. El repo ya está en GitHub privado.
