# MENSAJES POR VOZ · diseño cerrado

*(Idea de Zak, 2026-08-07. Prompt autónomo: se puede pegar tal cual en una Sala
de Comando nueva.)*

---

## Lo que se construye

Dictar y enviar mensajes hablando, con confirmación antes de que salgan. Dos
destinos con la misma columna vertebral y una diferencia de fondo.

**Comunidad** — "mandar un mensaje a Zak, ya llegó la pizza".
**El Espejo** — "mandar mensaje al espejo" y a partir de ahí se dicta libre.

---

## Las tres decisiones que estaban abiertas, resueltas

### 1 · El dictado: en vivo Y limpiado. No hay que elegir.

Zak preguntó si tipo Superwhisper (oír todo y después ordenarlo) o dictado en
tiempo real como el que ya existe. **Las dos, en capas**, porque cada una
resuelve un problema distinto y se estorban cero:

- **Mientras habla** se ve el texto crudo, en vivo. No es un lujo: una función
  que RECIBE algo del mundo tiene que mostrar lo que está entrando, o es
  indistinguible de una función muerta (Paso 0-quater). Además da confianza:
  ver que te está oyendo es la mitad de la experiencia.
- **Al cerrar**, ese crudo pasa por UNA llamada de limpieza que hace tres cosas
  de un tirón: ordena y quita muletillas, borra las repeticiones del
  reconocedor, y **arranca el verbo de cierre** ("…enviar", "…mandar mensaje")
  para que no viaje dentro del texto.
- Lo que se ve en la tarjeta de confirmación es la versión LIMPIA. Lo que se
  envía es lo que se ve.

Costo: una sola llamada extra por mensaje, al final. Nada durante el dictado.

### 2 · El silencio NUNCA envía

Decisión de Zak y es la correcta: esto es reflexión, y en la reflexión el
silencio es parte del mensaje. El silencio **congela y muestra**; si vuelve a
hablar, se AÑADE a lo que ya había. Lo único que cierra es el verbo hablado
("enviar", "listo", "mandar mensaje") o el botón.

Único plazo: un abandono largo (~2 min sin voz) cierra el dictado **sin enviar
nada** y sin perder el borrador. Errar hacia "no se mandó" es barato; errar
hacia "se mandó solo" no tiene vuelta atrás.

### 3 · A quién se le manda: lo resuelve la capa, no el modelo

"Depende del nombre que digan, la inteligencia va a escoger uno aunque la
pronunciación no sea igualita." Correcto, **pero el modelo necesita la lista de
nombres REALES para elegir**. Por eso este pedido no es una feature suelta: es
el primer consumidor de la **FASE E (contexto vivo)**. Mensajes publica sus
conversaciones visibles como lista numerada (el patrón `__rsvPlanVoz`) y esa
lista viaja a `voz-intent` con la frase. Sin eso, el modelo adivina nombres al
aire.

**Consecuencia de orden: la Fase E va PRIMERO.** No es un rodeo, es el
cimiento de esto mismo.

---

## El flujo, paso a paso

### Comunidad

1. "mandar un mensaje a Zak" → **sí navega** a Mensajes de Comunidad. Aquí el
   viaje SÍ se justifica: hay algo nuevo que ver (tus chats, y a quién le vas a
   escribir). Es la excepción a "preguntar no te saca de donde estás".
2. La capa publica sus conversaciones. El modelo elige el destinatario por
   parecido contra esa lista real.
3. Si la frase **traía el mensaje** ("…a Zak, ya llegó la pizza") se salta el
   dictado y va directo a la confirmación.
4. Si **no lo traía**, se abre el dictado con la persona ya fijada arriba.
5. **Tarjeta de confirmación**: a quién, el texto limpio, y dos salidas. Se
   contesta hablando ("sí" / "cancela") o con el dedo. Reusa la tarjeta de
   permiso que ya existe y que ya guarda su propio ejecutor.
6. Confirmado → se envía → una línea confirma. No hay deshacer, por eso la
   tarjeta no es opcional nunca.

### El Espejo

Igual hasta la confirmación, con dos diferencias:

- Se abre el Espejo **en modo dictado** (ya existe).
- La tarjeta de confirmación tiene que EXISTIR en el Espejo, que hoy no tiene
  botones de enviar dentro de esa capa.

🜂 **EL REFLEJO NO SE REPRODUCE SOLO (decisión de Zak, 2026-08-09).** Se
evaluó que el Espejo hablara **por defecto** al contestar un mensaje dictado y
**se descartó por costo**: hoy no se suman gastos recurrentes por función
nueva. El reflejo aparece escrito, como siempre, y el **botón de Escuchar del
Espejo sigue exactamente donde está** — no se toca, no se mueve, no se agrega
nada: ya existía y así se queda. Lo único que se descarta es que suene solo.

🜂 **Y el botón de Escuchar vive SOLO en el Espejo.** El panel de respuesta del
orbe de navegación (el de "tus pendientes de hoy") **nunca** lleva uno. Son dos
superficies distintas: el Espejo es conversación y ahí escuchar tiene sentido;
el orbe es un acuse corto que se lee de reojo.

Queda anotado que **la voz por defecto es el norte** para el aparato físico de
dos botones (ver abajo): cuando ese momento llegue, esto es lo único que hay
que cambiar de este diseño. Lo demás ya está pensado para funcionar sin mirar.

**Redirección del flujo permitida** (Zak): si alguien activa Comunidad y en la
misma frase menciona el Espejo, se va al Espejo. Abrir una capa y luego otra no
es un error, es cambiar de opinión hablando.

---

## El costo, y por qué esta función no lo sube

Con la respuesta en texto, **esto no agrega ni un gasto recurrente**: el
dictado usa el reconocedor del propio teléfono (gratis) y el único costo nuevo
es la llamada de limpieza al cerrar el mensaje, que es la misma familia de
llamada que ya se usa para interpretar cualquier comando por voz (centavos).

Para el día que se encienda la voz por defecto, el número está medido: Fish
cuesta **~$0.29 MXN por respuesta**, y los topes ya existen y se cobran por
minutos reales (600/día ≈ 1 hora, 5.000/mes ≈ 8 horas). Cinco reflejos hablados
al día son ~$1.45 MXN por persona. No es prohibitivo; simplemente hoy no toca.

---

## El norte que explica las decisiones raras

Esto se está diseñando para un **aparato físico con dos botones**. Por eso la
voz por defecto, por eso el silencio que no envía, y por eso la confirmación
hablada. Hoy vemos botones en pantalla; el día del aparato, no. Lo que se
construya aquí tiene que funcionar con los ojos cerrados.

La capa siguiente (fuera de este alcance): **que el Espejo hable siempre**, no
solo al responder un mensaje dictado.

---

## Orden de construcción sugerido

1. **FASE E** — pila de capas + que Mensajes, Rachas, Bitácora y Bóvedas
   publiquen su lista visible, y que esa lista viaje a `voz-intent`.
2. **Comunidad**, que es el caso más simple: destinatario + texto + confirmar.
3. **El Espejo**, que suma el dictado largo, la limpieza y la voz por defecto.
4. El panel de frases sin resolver del Motor, que alimenta al modelo con las
   frases reales que fallen en todo esto.

---

## Cómo verificarlo (no negociable)

Arnés con el hook REAL empaquetado (esbuild + stubs), como las salas
anteriores. Casos mínimos:

- "mandar un mensaje a Zak, ya llegó la pizza" → destinatario correcto, texto
  "ya llegó la pizza" **sin** el verbo, confirmación pedida, y NADA enviado
  hasta el sí.
- Nombre mal pronunciado contra la lista real → elige el correcto.
- Nombre que no existe en la lista → NO adivina, lo dice.
- Silencio de 10 s a media frase → no envía, y al volver a hablar añade.
- "cancela" → no sale nada.
- El verbo de cierre en medio del mensaje ("dile que ya me voy, enviar") →
  corta donde debe.
- **Control contra la lógica vieja**: cada caso nuevo tiene que FALLAR sin el
  cambio, o no está tocando nada.
