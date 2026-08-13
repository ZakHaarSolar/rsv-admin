# PROMPT · RECONSTRUIR EV_Oraculo.tsx DESDE EL BUNDLE

*(Copiar y pegar tal cual en una Sala de Comando NUEVA. Es lo primero que hay
que hacer: el Espejo no compila hasta que esto esté.)*

---

**RECONSTRUIR EL BLOQUE PERDIDO DEL ESPEJO VIBRACIONAL.**

## Qué pasó

El 2026-08-08 un borrado por rango de líneas mal calculado se llevó **2.693
líneas contiguas** de `escaner-app/src/components/escaner/EV_Oraculo.tsx`
(pasó de 10.790 a 8.097 líneas). El archivo **no estaba en git** en ese
momento, así que no hubo restauración posible. Se agotaron: git (nunca
commiteado, sin blobs sueltos en el almacén), historial de VS Code, Time
Machine (sin destinos), iCloud (no sincroniza Documents), sourcemaps (no se
emiten en producción), caché del navegador y del servidor de desarrollo,
copias de editor y Papelera.

**Ya existe red de seguridad:** `escaner-app` quedó commiteado completo
(commit `f48e963`, 287 archivos, incluidos los 175 fuentes de `src/` que
nunca se habían commiteado). El archivo roto está en git como línea base, así
que la reconstrucción se ve como diff y se puede revertir.

## Lo que sí se tiene

**El bundle compilado del último despliegue bueno**, que corre en producción
ahora mismo:

    escaner-app/dist/assets/EV_Oraculo-CrLDdpDV.js   (150 KB, 8 ago 09:44)

Está minificado: nombres de una letra, cero comentarios. Pero conserva
**toda la lógica**, los literales de texto, las claves i18n, los nombres de
clases CSS y la estructura de los efectos. La reconstrucción es viable.

Copias equivalentes (mismo contenido, otros builds):
`ios/App/App/public/assets/EV_Oraculo-mak5qcAO.js` (8 ago 08:51) y
`android/app/src/main/assets/public/assets/EV_Oraculo-Ch8ex0Fz.js` (6 ago).

## Dónde está exactamente el hueco

El corte es **contiguo**. En el archivo actual, entre la línea 4751 y la 4753:

- Última línea sana antes del hueco: el `useMemo` de `presImgs`
  (`.filter((s): s is string => !!s), [presImgPtrs, imgSrc])`).
- Primera línea sana después: el comentario `{/* Header — LANDSCAPE: menos
  padding vertical…` y su `<div ref={headerRef}>`.

Todo lo que vivía entre esos dos puntos es lo que hay que reponer.

## Qué contenía (inventario parcial confirmado)

Nueve claves i18n quedaron huérfanas, y cada una marca UI borrada:

    espejo.conv.micDenegado      espejo.img.arrastra
    espejo.error.interferencia   espejo.img.ilegible
    espejo.error.tardanza        espejo.img.privacidadMini
    espejo.error.topeGlobal      espejo.pres.siAdelante
    espejo.presVoz.sinSonido

Eso apunta, como mínimo, a: el velo de arrastrar-y-soltar imágenes, el manejo
de errores del reflejo (interferencia · tardanza · tope global), la lista de
reflejos guardados con su permiso de micrófono, y piezas del Modo Presencia
(la continuidad "Sí, adelante" y el aviso de voz sin sonido). El resto del
bloque son efectos, manejadores, arte SVG y estilos que no llevan clave.

## Cómo hacerlo

1. **Leer primero las dos orillas** del hueco en el archivo actual, para saber
   qué estado y qué refs entran y salen del bloque.
2. **Trabajar sobre el bundle formateado.** Anclarse en los literales que
   sobreviven (claves i18n, clases CSS, textos) para ubicar cada pieza, y
   reconstruir de ahí hacia afuera.
3. **Reponer por piezas, compilando entre cada una** (`npx tsc -b --force`).
   No intentar el bloque entero de un tirón: el archivo no compila hasta que
   esté todo, así que conviene ir cerrando llaves por sección y verificar.
4. **Commitear cada pieza.** Ahora hay red; usarla.
5. Al terminar: `npx tsc -b --force` limpio, `vercel build --prod`, verificar
   que el bundle nuevo tenga las 9 claves de arriba, desplegar y QA del Espejo
   completo (charla normal · Modo Presencia · imagen arrastrada · imagen
   pegada · lista de reflejos · errores · voz).

## Sobre los comentarios

Los comentarios del bloque no se pueden recuperar: en este proyecto documentan
el PORQUÉ de decisiones ganadas a pulso (los caprichos del WKWebView, el
congelamiento del teclado en iOS, los umbrales del toque en Presencia). Al
reconstruir, escribir comentarios nuevos SOLO donde el código lo pida y
marcarlos como reconstruidos, sin inventar historia que no se sabe.

## Cambios que estaban hechos y se perdieron con el borrado

Se pueden volver a aplicar en minutos, ya están resueltos:

- `ANCHO_LECTURA = 700` y `ANCHO_COMPOSITOR = 660` (los 13,8 cm que midió Zak;
  con la letra nueva da 81 caracteres por línea).
- Letra del reflejo `17.5` y de la burbuja propia `17` (eran 15.5 y 15).
- Fuera `espejo.img.privacidadMini` del velo de arrastre.
- Velo de arrastre que se quedaba pegado: se apaga por LATIDO de `dragover`
  (un vigía a 400 ms) más `dragend`/`drop`/`pointerdown`/`visibilitychange`,
  en vez de contar entradas y salidas del puntero.
- `runReveal`: el temporizador pasa de `Math.min(6200, 1100 + len*16)` a
  `Math.min(480, 120 + len*1.1)`.
- La vista deja de perseguir al texto: al enviar, el mensaje propio se ancla
  arriba (`anclaUsuarioRef` + `anclarArriba`, con gracia de 260 ms para no
  auto-apagarse) y un colchón (`reservando`) reserva el alto de la respuesta.

## Lo que quedó pendiente y NO es de esta sala

El selector de modelo admin (quitarlo), el streaming SSE, renombrar reflejos,
el botón de enviar, el panel de uso y el panel de IAs. Todo eso va después de
que el Espejo vuelva a compilar.
