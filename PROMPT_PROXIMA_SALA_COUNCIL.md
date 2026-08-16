# Sala de Comando · Council Solar: los portales de verdad, el avatar, el domo monumental y los nodos nuevos

Copia y pega TODO lo que sigue al abrir la próxima Sala de Comando.
(Zak: adjunta también la imagen del vórtice espiral morado como referencia visual.)

---

Hola Claude. Voy a dormir mientras trabajas. Son cinco frentes y quiero
despertar con **los cinco hechos**, no con tres y una explicación. Esto es
importante: **no pares a preguntarme nada, no te detengas a media lista y no
me devuelvas el turno con cosas sin empezar.** Si algo se traba, déjalo para el
final, termina todo lo demás y me lo dices al cerrar. Si una decisión de diseño
es ambigua, elige la más lógica, constrúyela y me dices cuál elegiste.

Publica a producción y respalda los repos como siempre.

---

## 🔴 PARTE 1 · LOS PORTALES SON UNA BASURA. REHAZLOS.

Lo que hay ahora es un aro de oro con un círculo de color adentro. Parece de
kindergarten y no tiene nada que ver con el nivel del resto del templo (el
mármol, las runas de luz, los orbes de plasma). **No lo parches: rehazlo.**

**La referencia es la imagen que adjunto**: un vórtice espiral profundo, tipo
galaxia o agujero de gusano, con brazos de nebulosa girando hacia un núcleo
blanco incandescente, polvo estelar, capas de profundidad y color que va del
violeta profundo al cian con destellos cálidos. Eso es lo que tiene que verse
dentro del marco de cada puerta.

**Qué quiero exactamente:**

1. **El interior del portal es un vórtice vivo hecho con shader**, no una
   textura plana ni un `meshBasicMaterial` con opacidad. Espiral logarítmica
   girando lento, ruido fractal (FBM) para las nubes, núcleo brillante al
   centro con caída suave, y parallax: las capas del fondo se mueven más lento
   que las del frente. Que respire y que nunca se vea igual dos segundos
   seguidos.
2. **Cada puerta se tiñe con el color de su cámara** sin perder la riqueza del
   vórtice: el color de la sala manda sobre el tono general, pero conviven al
   menos dos matices más y el núcleo se va a blanco. Nada de un solo color
   plano.
3. **El marco deja de ser un donut.** Un umbral arquitectónico de verdad, del
   mismo lenguaje que el templo: piedra o mármol con molduras biseladas y
   filos de oro, con jambas que bajan al suelo y dintel arriba. Que se sienta
   construido, con peso, no flotando.
4. **Que reaccione al acercarse caminando**: el vórtice acelera su giro, el
   núcleo crece, el marco se enciende y sale luz al mármol de enfrente.
5. **Coste contenido**: son seis puertas en pantalla. Un shader por instancia
   es caro. Usa material compartido con uniforms por instancia, geometría
   fusionada donde puedas, y mide: la sala corre junto a Ollama en la misma
   Mac y no puede caerse de cuadros.

Archivo actual: `rsv-web/src/council/scene/Portales.tsx`. La colocación, el
registro para la barra espaciadora, el letrero y el viaje entre cámaras **ya
funcionan y están verificados**: eso se conserva. Lo que se tira y se rehace es
el CUERPO visual de la puerta.

⚠️ Antes de escribir el shader, mira cómo están hechos los que ya existen en
`rsv-web/src/council/scene/shaders.ts` (el plasma del orbe y su halo Fresnel):
mismo estilo de código y misma disciplina. Y recuerda la lección de la casa: un
NaN dentro de un shader pinta una mancha negra enorme a través del Bloom, así
que blinda `pow`, `atan` y `smoothstep`.

---

## PARTE 2 · TERCERA PERSONA CON AVATAR

Hoy la tecla **C** alterna entre ÓRBITA y CAMINATA (primera persona). Quiero un
tercer modo en el mismo ciclo:

**C → primera persona → tercera persona → órbita → primera persona…**

En tercera persona veo **mi avatar de cuerpo entero caminando por la sala**,
con la cámara detrás y un poco arriba, acompañándolo. La vista se sigue
girando con el ratón sin tener que picar nada (igual que en primera persona,
con el puntero bloqueado), y el avatar se orienta hacia donde camina.

- El avatar puede salir de Domo Cero (`MMSOR/client/`, ahí hay avatares con
  animaciones de Mixamo) o puedes crear uno sencillo si eso es más rápido.
  **Ahorita lo que importa es que funcione**, no que sea el definitivo.
- Toda la mecánica de la caminata se conserva: W A S D y flechas, Shift para
  correr, la mesa y la cúpula sólidas, la mira del centro, la barra
  espaciadora para tomar objetos y para entrar a los portales.
- La cámara no debe atravesar la cúpula ni quedarse dentro del cuerpo del
  avatar cuando te pegas a una pared. En Domo Cero ya resolvieron ese clamp
  (`MMSOR/client/src/components/Canvas/CameraRig.tsx`): reúsalo.

---

## PARTE 3 · EL DOMO MONUMENTAL (rediseño arquitectónico)

La estructura de arriba se ve como una jaula de alambre. Tiene que sentirse un
Panteón Solar: sólido, pesado, sagrado.

- **Nervaduras** de sección ancha con molduras biseladas, no tubos delgados.
  Mármol satinado (`#f5f0e8`, roughness 0.28) con filos de oro envejecido
  (`#c9a227`, metalness 0.88).
- **Columnas** en la base de cada arco: plinto, fuste y capitel simplificado.
  Anclan la estructura al piso.
- **Óculo central** monumental con relieves concéntricos y un **cono de luz
  volumétrica** cálida cayendo sobre el altar.
- **Paneles curvos entre nervaduras**: cristal cósmico ahumado o muro con
  relieve. **Fuera el fondo beige plano infinito.**
- **Atmósfera exterior** visible por el óculo y los paneles: degradado
  crepuscular a negro con estrellas sutiles.
- No toques el piso de mármol, la mesa, los orbes ni el HUD.
- Optimiza: `InstancedMesh` para lo repetido, geometrías fusionadas, pocos
  draw calls. El peso visual viene del grosor y las molduras, no de millones
  de polígonos.

**Criterio de éxito:** que al mirar hacia arriba se sienta arquitectura, con
biseles y profundidad reales desde cualquier ángulo, y que los espacios entre
arcos cierren el recinto (salvo donde van los portales).

---

## PARTE 4 · LOS NODOS QUE FALTAN Y EL RITMO DE GRABACIÓN

En la sala anterior me diste esta recomendación y la apruebo. Constrúyela:

1. **Un nodo nuevo de PROYECCIÓN en Zak Cero** (junto a A impacto, B economía
   y C telemetría). Su trabajo: mirar hacia adelante cruzando la telemetría
   real, el motor económico y los playbooks vivos, y decir a dónde llegamos en
   3, 6 y 12 meses: seguidores, ingreso, qué se vuelve posible. No inventa
   cifras: si le falta un dato, lo pide por nombre.
2. **El RITMO DE GRABACIÓN como registro mío, no como nodo.** Un objeto 3D más
   en la mesa (junto al cofre, el arsenal y el ábaco) donde yo apunto cuántos
   videos grabamos por semana y de qué tipo. Viaja en el encargo de los nodos
   como hecho, igual que el cofre. Piensa un objeto que diga "cadencia": un
   metrónomo, un reloj de arena, un péndulo.
3. **Y de ahí sale el PLAN DE LA SEMANA**: el nodo de proyección (o el de
   impacto, decide tú) propone "esta semana toca tres de filantropía y dos del
   Escáner, por esto"; yo lo apruebo con el mismo gesto de palomita que ya
   existe, y lo aprobado se guarda. No lo mezcles con el ábaco: el ábaco es
   todo lo que queremos hacer algún día, esto es lo de ESTA semana.
4. Lo de las **nuevas ramas del ecosistema** (tipo "de aquí puede nacer tal
   proyecto") NO lleva nodo nuevo: eso ya es el Norte del Núcleo Solar.
   Refuerza su prompt para que lo haga explícito.

Todo lo nuevo que yo escriba tiene que viajar a la base de datos por la rama de
registros que ya existe (`rsv-web/src/council/registros.ts` + tablas
`council_registros` y `council_entradas`). Si hace falta SQL nuevo, déjamelo en
`admin/supabase/migrations/` y dímelo al final; yo lo pego.

---

## PARTE 5 · EL BUG DE LA VOZ QUE NO SUENA

A veces le hablo al Council, me contesta por escrito y **no se escucha nada**,
con la voz encendida. Persíguelo. Datos que tengo: pasa con superwhisper
abierto (que toma el micrófono), y las píldulas de arriba se ven en verde.

Si no puedes reproducirlo, entonces **haz que la pantalla me diga el motivo**:
que la píldora de la voz distinga "lista" de "dormida por el navegador" y de
"no llegó audio del proveedor", con la acción concreta al lado. Un fallo que yo
no pueda leer es un viaje perdido.

---

## CUIDADOS DE ESTA ESCENA (ya nos costaron tiempo)

- El panel de vista corre con la pestaña escondida: R3F no monta hasta que se
  dispara un `resize` sintético, y los cuadros se piden con
  `window.__councilAvanzar(n)`. **Fija el tamaño con `resize_window` a 1440×900
  ANTES de navegar**, o `innerWidth` vale 0 y todas las medidas mienten.
- Verifica con `?sinportal` en el servidor de desarrollo (5177, 5178 o 5179).
- El clic sintético NO llega al mundo 3D: usa `window.__councilRayo(x,y)`,
  `window.__councilCaminata` (entrar, tecla, girar, mira, tocar) y
  `window.__councilStore`. El gesto real lo pruebo yo.
- El bloqueo del puntero exige un gesto de persona: no se puede verificar
  desde ahí.
- El CSS se inyecta una vez por id (`cs-css-vN`): al tocar estilos sube el
  número o no se refresca.
- Un import dinámico de un módulo desde la consola puede traer **otra copia**
  del módulo (con sus registros vacíos). Verifica a través de la app, no
  importando el módulo por tu cuenta.
- Registrar cosas en un `useMemo` no funciona: va en `useEffect` con limpieza.
  Ya nos pasó con las puertas.
- La bóveda y los registros del Arquitecto ya viajan a Supabase. No los rompas.

---

## CÓMO QUIERO EL CIERRE

Cuando termines: publica a producción, respalda los cinco repos, y déjame **un
solo reporte** con lo que quedó hecho, lo que necesita mis manos, y lo que se
trabó (si algo se trabó). Nada de "hice la primera, ¿sigo?".
