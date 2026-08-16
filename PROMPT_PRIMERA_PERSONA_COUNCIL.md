# Sala de Comando · Vista en primera persona para el Council Solar

Copia y pega esto tal cual al abrir la próxima Sala de Comando.

---

Quiero caminar dentro del Council Solar en primera persona, como se camina en
el simulador de Domo Cero, y poder elegir entre esa vista y la de ahora.

**Qué existe hoy.** El Council vive en `rsv-web/src/council/`. La escena es
`scene/CouncilScene.tsx`, un Canvas de React Three Fiber con `OrbitControls`
fijado en `target=[0, 2.2, 0]`, sin paneo, distancia entre 4.5 y 10.2 y la
inclinación acotada entre 0.85 y 1.6 radianes. La sala es una cúpula de radio
11 (`scene/Cupula.tsx` exporta `RADIO = 11`), con el mármol en `scene/Piso.tsx`
y la Mesa Holográfica de radio 1.6 y altura 1.02 (`scene/Mesa.tsx` exporta
`RADIO_MESA` y `ALTO_MESA`). Los orbes flotan entre 1.6 y 2.85 de altura y las
cinco reliquias (pergamino, bote, cofre, arsenal y ábaco) viven en
`scene/Reliquias.tsx`, se tocan con una caja invisible cada una y se pueden
arrastrar dejándolas apretadas.

**Qué quiero.**
1. Un selector de vista con dos modos, que se recuerde al recargar:
   · ÓRBITA, la de ahora, sin tocar nada de su comportamiento.
   · CAMINATA, primera persona: altura de ojos ~1.7, avance con W A S D y con
     las flechas, mirar con el mouse (bloqueo de puntero al entrar, Esc lo
     suelta), correr con Shift.
2. Colisión sencilla: no atravesar la mesa (el disco de radio 1.6) ni salir de
   la cúpula (radio 11 menos medio metro). No hace falta física de verdad.
3. Que en caminata se sigan pudiendo tocar los orbes y las reliquias, con una
   retícula al centro que se enciende cuando algo se puede tocar.
4. Que el HUD 2D siga fijo como está (las pantallas laterales, el pie y la
   barra de deliberación no se mueven con la cámara).
5. Al salir de caminata, la cámara vuelve suave a su órbita de siempre.

**Cómo lo mide Domo Cero.** Mira cómo está resuelta la caminata en el
simulador de Domo Cero antes de escribir nada, y reusa su patrón de movimiento
y de bloqueo de puntero en vez de inventar otro.

**Cuidados que ya conocemos en esta escena.**
· El panel de vista corre con la pestaña escondida: R3F no monta hasta que se
  dispara un `resize` sintético, y los cuadros se piden a mano con
  `window.__councilAvanzar(n)`. Fija el tamaño con `resize_window` a 1440×900
  ANTES de navegar.
· Verifica con `?sinportal` en el servidor de desarrollo.
· El clic sobre un orbe solo SELECCIONA; activar el bucle vive en la tecla D y
  en el botón del panel derecho, y así se queda.
· Nada de animaciones perpetuas nuevas dentro de la pantalla grande: ya nos
  costó un fogonazo blanco al deslizar.

Cuando esté, publícalo a producción y respalda los repos como siempre.
