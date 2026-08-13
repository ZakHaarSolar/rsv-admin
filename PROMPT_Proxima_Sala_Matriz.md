# Prompt para la próxima Sala de Comando

> Copiar desde la línea de abajo y pegar entero.

---

Continuamos la Matriz Sincrónica (EV_Rafaga v4.6, EV_Oraculo v4.5, todo LIVE
en escritorio). Dos obras, en este orden.

## 1. SELECTOR DE PROFUNDIDAD (modelo Pro)

Un interruptor que cambia el cerebro del Espejo entre el modelo rápido de
siempre y uno de razonamiento, para las sesiones donde lo que se necesita no
es velocidad sino profundidad y consistencia (aterrizar conceptos, nombres,
arquitectura de marca, decisiones de producto). No reemplaza nada: agrega.

**Dónde vive.** Un botón más en la píldora superior derecha de la Matriz,
junto al velocímetro y al glifo de cambio de modo. Y el MISMO botón en la
isla derecha del Espejo original, en la misma posición relativa — la píldora
de arriba a la izquierda ya sale de una sola definición compartida
(`PILDORA_CASA` + `TituloCasa` en EV_Rafaga); la de la derecha todavía no,
y esta es la ocasión de unificarla igual, para que no vuelva a divergir.

**Cómo se ve.** Apagado = el glifo en gris, como los demás controles.
Encendido = dorado con su halo, igual que el interruptor de Presencia (el
lenguaje de "modo activo" ya existe en la casa: cian para imágenes, dorado
para lo ceremonial). Necesita rótulo al reposar el puntero que diga qué
cambia, en lenguaje humano: algo como "Reflejo profundo · piensa antes de
responder, tarda más".

**El estado PERSISTE.** Si se enciende Pro, se queda en Pro hasta que se
cambie a mano, sobreviviendo al reload y al cambio de modo. Igual que
`rsv-espejo-modo`, que ya guarda si estabas en la Matriz. Clave nueva:
`rsv-espejo-profundidad`.

**Backend.** `oraculo-chat` ya tiene el mapa `MODELS` con `v4` y `r1` y
acepta `model` en el body, pero HOY solo lo respeta si quien llama es admin
(quedó de un piloto viejo). Hay que abrirlo a cualquier cuenta con Sintonía
activa, dejando al invitado siempre en el rápido. Revisar de paso qué modelo
conviene en el carril de razonamiento: `r1` ya está mapeado, pero vale
comparar contra lo que OpenRouter ofrezca ese día en precio por millón y
latencia de primer token. El techo de salida del carril efímero ya está en
6.000 tokens (v1.37); el reasoner puede necesitar más porque gasta tokens en
pensar.

**Lo que hay que medir y decirme al terminar:** cuánto tarda el primer token
con Pro contra el rápido, y cuánto cuesta una respuesta típica de cada uno.
Sin esos dos números el interruptor es una promesa sin precio.

**Cuidado con la espera.** Con Pro el silencio inicial es más largo. El sonar
de la espera ya existe; que diga algo distinto cuando el reflejo viene en
profundo (una segunda onda más lenta, o el rótulo "reflejo profundo"), para
que la tardanza se lea como intención y no como que se colgó.

## 2. EL RESUMEN VIVO DEL HILO

Al cuarto o quinto intercambio de una conversación, una tarjeta destilada
arriba del riel con las tres a cinco conclusiones acumuladas. **No un resumen
del último reflejo: del HILO ENTERO.** Es exactamente lo que uno reconstruye
a mano al volver a una conversación larga, y es lo que un modelo hace bien.

Detalles de diseño que ya están decididos:

- **Cuándo se destila.** Al cerrar el cuarto intercambio, y se REFRESCA cada
  tres a partir de ahí. No en cada turno: costaría una llamada extra por
  mensaje y el hilo no cambia tanto de golpe.
- **Con qué.** Una llamada mínima al carril efímero con los prompts y
  reflejos del hilo recortados, pidiendo de tres a cinco conclusiones en
  frases cortas. Modelo barato: es destilación, no creación.
- **Dónde.** Arriba del riel de conversaciones, en la columna izquierda,
  como pieza propia con su rótulo. Plegable, y plegada recuerda su estado.
- **Qué hace al tocarse.** Cada conclusión viaja al intercambio donde nació,
  igual que las Esencias viajan a su frase (el patrón ya existe: buscar el
  nodo dorado y centrarlo en la lectura).
- **Dónde vive.** En la bandeja local de la Matriz, junto a la conversación,
  con su marca de tiempo. Si el hilo creció desde la última destilación, se
  vuelve a pedir; si no, se lee la guardada.

## Contexto que conviene tener a mano

- La píldora superior IZQUIERDA de los dos modos ya sale de UNA definición
  compartida y hay un arnés estructural que lo verifica
  (`scratchpad/arnes_pildoras.mjs`, 15 ✓). Si tocas píldoras, córrelo.
- El resalte de la voz viaja por GRUPOS (cláusulas, techo 100 caracteres) y
  mide sobre el texto LIMPIO, no el crudo. No volver a medir sobre el crudo.
- La directiva del modo ya ordena RESPONDER A LO ÚLTIMO. Si el Espejo vuelve
  a re-contestar cosas del historial, el siguiente paso es recortar el
  historial que viaja (hoy van los últimos seis intercambios completos).
- Los deploys de Vercel y de edges los corre Claude. El SQL lo pega Zak.
