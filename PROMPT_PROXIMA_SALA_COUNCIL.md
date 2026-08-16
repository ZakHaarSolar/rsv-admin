# Sala de Comando · Council Solar: persistencia en base de datos + vista en primera persona

Copia y pega TODO lo que sigue al abrir la próxima Sala de Comando.

---

Dos trabajos para el Council Solar, en este orden. El primero importa más: hoy
todo lo que decido vive solo en el navegador de una computadora.

---

## PARTE 1 · QUE TODO VIVA EN LA BASE DE DATOS (persistencia multi-computadora)

**Lo que quiero.** Entrar a `redsolarviva.com/council` desde CUALQUIER
computadora con mi misma cuenta y encontrar exactamente el mismo estado: mi
pergamino con su oro y su plata, el bote, el cofre, el arsenal, el ábaco, dónde
dejé cada reliquia en la sala, las leyes de cada nodo y su registro. Que borrar
los datos del sitio o cambiar de Mac no me cueste nada.

**Lo que YA sube al servidor** (no lo rompas, reúsalo como patrón): los turnos,
las etapas de deliberación y los playbooks vivos viajan a Supabase por
`rsv-web/src/council/memoria.ts` → edge `council-gate` → tablas
`council_turnos`, `council_deliberaciones` y `council_playbooks` (migración
`admin/supabase/migrations/20260815_council_boveda.sql`). Escribe local al
instante y sube en lotes con retardo de 1.5 s, con `keepalive` al esconder la
pestaña; al abrir, `boveda-leer` funde lo del servidor con lo local. Si faltan
las tablas la edge responde `sin_tabla` y el pill del HUD lo dice.

**Lo que NO sube todavía y hay que migrar.** Todo esto vive en `localStorage`
bajo la llave `rsv-council-v1` (ver `rsv-web/src/council/store.ts`):

| Qué | Campo del store | Forma |
|---|---|---|
| Pergamino y bote | `juicios` | `Record<clavePlaybook, Juicio[]>`, cada `Juicio` con `id`, `texto`, `vale`, `nivel: "oro" \| "plata"`, `ts` |
| Cofre y arsenal | `cofres` | `Record<"cofre" \| "arsenal", string>` (texto libre, hasta 4.000) |
| Ábaco | `tareas` | `Tarea[]` con `id`, `texto`, `hecha`, `descartada`, `ts`, `hechaTs` |
| Dónde quedó cada reliquia | `posicionesReliquias` | `Partial<Record<ReliquiaId, [x,y,z]>>` |
| Leyes por nodo | `leyes` | `Record<clavePlaybook, string>` |
| Registro por nodo | `bitacora` | `Record<clavePlaybook, string>` |
| Activaciones del bucle | `deliberacion.activos`, `trabajo`, `ciclosActivacion` | decide tú si viajan (ver abajo) |

**Cómo lo quiero resuelto.**
1. **Migración SQL nueva** en `admin/supabase/migrations/`, que yo pego en el
   SQL Editor (nunca me des comandos de la CLI de Supabase para esto).
2. **Rama nueva en la edge `council-gate`** con el mismo portón admin
   (`gateAdmin`) y service role, siguiendo el patrón de la bóveda.
3. **Granularidad pensada para dos computadoras a la vez.** Los juicios y las
   tareas son muchas entradas independientes: si van como un solo documento,
   editar en una Mac pisa lo de la otra. Que cada entrada sea su propia fila,
   con su `id` como llave, y que borrar sea una marca de borrado y no un hueco
   (si no, la otra máquina la resucita al sincronizar). Los cofres, las leyes,
   la bitácora y las posiciones sí pueden ir como documento por llave, con la
   fecha de actualización decidiendo quién gana.
4. **Fail-open, siempre.** Si el servidor no responde, el Council sigue
   funcionando con lo local exactamente como hoy, y el pill de la bóveda lo
   dice en mi idioma. Nunca una pantalla en blanco por una tabla que falta.
5. **Al abrir, fundir y no perder.** Igual que los playbooks: gana lo más
   reciente por entrada, no por documento entero.
6. **Decide y dime qué elegiste** sobre las activaciones del bucle: mi
   instinto es que NO viajen, porque el núcleo que delibera corre en la Mac que
   tengo enfrente y no tiene sentido que otra computadora arranque un ciclo que
   nadie está atendiendo. Si piensas distinto, dímelo con el porqué.

**Advertencia que ya sé:** el modelo corre en la Mac de quien esté enfrente
(Ollama en `localhost:11434`), así que en otra computadora hay que tenerlo
corriendo ahí también, con su `OLLAMA_ORIGINS`. Eso no lo arregla la base de
datos y está bien; lo que quiero replicado es mi criterio, no el motor.

**Cómo sé que quedó.** Quiero verlo, no que me lo digas: aprueba algo en una
ventana, ábrelo en otra sesión limpia (otro perfil o incógnito con mi cuenta) y
que esté ahí. Y borra los datos del sitio en una y que vuelva del servidor.

---

## PARTE 2 · CAMINAR POR LA SALA EN PRIMERA PERSONA

**Lo que quiero.** Caminar dentro del Council como se camina en el simulador de
Domo Cero, y poder elegir entre esa vista y la de ahora.

**Qué existe hoy.** El Council vive en `rsv-web/src/council/`. La escena es
`scene/CouncilScene.tsx`, un Canvas de React Three Fiber con `OrbitControls`
fijado en `target=[0, 2.2, 0]`, sin paneo, distancia entre 4.5 y 10.2 y la
inclinación acotada entre 0.85 y 1.6 radianes. La sala es una cúpula de radio
11 (`scene/Cupula.tsx` exporta `RADIO = 11`), con el mármol en `scene/Piso.tsx`
y la Mesa Holográfica de radio 1.6 y altura 1.02 (`scene/Mesa.tsx` exporta
`RADIO_MESA` y `ALTO_MESA`). Los orbes flotan entre 1.6 y 2.85 de altura y las
cinco reliquias (pergamino, bote, cofre, arsenal y ábaco) viven en
`scene/Reliquias.tsx`, se tocan con una caja invisible cada una y se arrastran
dejándolas apretadas 380 ms.

**Lo que quiero exactamente.**
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

---

## CUIDADOS QUE YA CONOCEMOS EN ESTA ESCENA

- El panel de vista corre con la pestaña escondida: R3F no monta hasta que se
  dispara un `resize` sintético, y los cuadros se piden a mano con
  `window.__councilAvanzar(n)`. Fija el tamaño con `resize_window` a 1440×900
  ANTES de navegar. Hay configuraciones de servidor en 5177, 5178 y 5179.
- Verifica con `?sinportal` en el servidor de desarrollo.
- El clic sintético NO llega al mundo 3D en ese panel (los orbes tampoco
  responden ahí): verifica el rayo con `window.__councilRayo(x,y)` y el
  manejador por separado, y deja el gesto para cuando yo lo pruebe.
- El CSS se inyecta una vez por id (`cs-css-vN`): al tocar estilos hay que
  subir el número y recargar, el HMR no lo reinyecta.
- El clic sobre un orbe solo SELECCIONA; activar el bucle vive en la tecla D y
  en el botón del panel derecho, y así se queda.
- Nada de animaciones perpetuas nuevas dentro de la pantalla grande: ya nos
  costó un fogonazo blanco al deslizar.
- El SQL lo pego yo en el SQL Editor; las edge functions las despliegas tú.

Cuando esté, publícalo a producción y respalda los repos como siempre.
