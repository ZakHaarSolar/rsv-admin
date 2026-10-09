# CLAUDE.md · Aplicaciones (la sala de los CV de Zak)

> Se carga al abrir una sala en `admin/aplicaciones`. Nacida el 2026-10-09 (Zak: «crearemos nueva sala para CV's
> específicamente»). El maestro de `Red Solar Viva/` NO se carga aquí (`.claude/settings.json`): lo que esta sala
> necesita vive en este archivo. Para cosas del ecosistema (apps, juegos, publicidad) la sala es otra.

## Quién es Zak y cómo se le habla

Diego Soto Borja Almeida, firma artística **Zak'Haar**. Mexicano, vive en Cancún (UTC-5). Correo de los CV:
`zakhaarsol@pm.me`.

- Español neutro de México con **tú**: «pon», «dime», «revisa», «tienes»; nunca voseo ni «acá».
- **Cero rayas largas (—)** en reportes y en los CV: coma, punto, punto y coma o « · ».
- Reporte en dos velocidades: cada cosa hecha abre con su frase en **negritas** en su propia línea; el porqué abajo.
  Lenguaje humano; lo técnico va al final bajo `---` y `### Detalle técnico`. Lo que necesita su mano va bajo
  **«Lo que tienes que hacer:»**, numerado.
- Todo lo pedido en una sola pasada, sin parar a preguntar; un detalle ambiguo se decide y se dice cuál se eligió.
- Si algo de lo que pide sería falso o desmentible en un CV, se hace la versión verdadera más fuerte y se le explica
  en una o dos líneas por qué.

## Mapa de la carpeta

- `LEEME.md`: el índice para Zak (qué CV subir a dónde). Se actualiza con cada versión nueva.
- `cv/<fecha> <empresa> (<puesto>)/`: una carpeta por versión, nunca se borra ninguna. Cada una trae
  `build_resume.py` (la única fuente), el PDF para subir, el `.md` en texto limpio y `vista previa.png`.
- `.venv/`: el Python del generador (reportlab, pypdf). Fuera de git.
- `2026-10 Claude for Startups/` y `2026-10 Google for Startups Cloud/`: solicitudes de Red Solar Viva (no son CV).

**Hacer un CV nuevo:** copia la carpeta más cercana al puesto, cambia solo la parte «Contenido» del
`build_resume.py` (y el orden de secciones en `todo()` si hace falta) y córrelo desde su carpeta con
`../../.venv/bin/python build_resume.py`. Sale el PDF y el `.md` juntos; la letra se ajusta sola hasta caber en una
hoja (la escala sale en pantalla: si baja de 0.92, recorta texto en vez de aceptar letra chica). La vista previa se
saca con `qlmanage -t -s 1700 -o . Diego_Soto_Borja_Almeida_Resume.pdf` y se renombra a `vista previa.png`. Antes de
entregar: mirarla, contar páginas (una) y extraer el texto con pypdf para confirmar que los filtros ATS lo leen.

## Reglas de los CV

1. **Todo lo que dice se puede comprobar.** Una prueba técnica o quien te contrata desmiente lo inflado. El stack es
   el del repo (Vite, no Next.js). Los números salen de medirlos, con fecha.
2. **El título de cada puesto coincide con el contrato**, sobre todo ante la empresa que te emplea: en micro1 el
   puesto es **Video Annotation Specialist** (se le puede sumar un descriptor como «AI Data Quality», nunca
   reemplazarlo). El titular de arriba sí puede ser el puesto al que se aplica.
3. **El cliente de micro1 nunca se nombra** (NDA, cero tolerancia a sus marcas, nada de capturas). micro1 solo se
   nombra en los CV que van a micro1.
4. **Un CV por puesto:** se enfoca en lo que pide y deja fuera lo que lo desvía. En DataAnnotation Zak NO quiere los
   tracks de programación; en QA, nada de backend ni algoritmos.
5. **En inglés profesional, una hoja, compatible con ATS:** encabezados estándar, texto real (no imágenes), sin
   columnas ni tablas.
6. Lo que Zak afirma de sí mismo y no se puede ver en su Mac (estudios, Figma) entra porque él lo dice; se le avisa en
   una línea qué no se pudo comprobar.

## Banco de datos comprobados (la fuente de verdad de los CV)

**micro1** (desde el 2026-09-20): Video Annotation Specialist, contratista por Deel, horas en Hubstaff, tope y
promedio de 40 h por semana. Anota episodios de brazos robóticos de hasta 8 cámaras sincronizadas y unos 18 minutos,
en una sola pasada a ~4.4 veces la duración del video con tope de 7 (≈35 % abajo del tiempo). Primer pago: 50 USD/h.
Metas: subir a reviewer (capa de revisión anunciada) y luego a HDM.

**Escáner Vibracional / Red Solar Viva** (2024 a hoy): app de autoconocimiento (seis áreas de la vida) en iPhone,
Android, Mac y web. Medido el 2026-10-07: unas 245 mil líneas de TypeScript, 349 migraciones, 59 funciones del
servidor, 3,745 textos de la interfaz en español con su inglés y un glosario fijo. Stack: React y TypeScript con
Vite, Framer Motion, Capacitor, Tauri, Supabase, Clerk, Stripe, RevenueCat; Three.js en la escena 3D de la web; plugins
de iOS en Swift y Metal. Se construye con Claude Code: Zak escribe la especificación, dirige al modelo y prueba en
aparatos reales (es lo que piden los puestos de evaluación de IA). Pruebas reales que sirven de ejemplo: la animación
de arranque congelada y la capa invisible que bloqueaba toques en iOS (2026-09-27, reportadas con hora y capturas);
el brillo de bordes que hacía que Chrome de gama baja en Android tirara tarjetas (prueba en un A07); el ícono
recortado para leerse a 16-32 px; modos claro y oscuro, horizontal, español e inglés, sin conexión. Herramientas
creativas dentro de la app: editor de notas con formato, color y resaltado; tablero de visión con fotos; recorte de
avatar; galería de fondos.

**Español y localización:** corrige a diario el español que escribe la IA (voseo rioplatense, «bombilla» en vez de
«foco», registro, puntuación de máquina) y lo vuelve reglas de estilo. Autor, como Zak'Haar, de libros de no ficción
en español de la serie Códices de Luz (ebook, PDF, audiolibro); dirige y revisa narración con voz de IA
(pronunciación, ritmo, sibilancia).

**Fotón Cero** (2025 a hoy, fotoncero.com, youtube.com/@zakhaarsolar): videos musicales animados, series y tráilers.
Detectó el audio de un export que salía en un solo canal y efectos que tapaban la música (ajustes de entrega en
DaVinci definidos; falta re-exportar para YouTube); video en tres calidades; un video que parpadeaba en negro en
tarjetas gráficas reales por una máscara CSS.

**Ludus Cero** (2026 a hoy, play.redsolarviva.com): Terra Cristal Pixel 3 (táctico en pixel art), Lúcido
(exploración en pixel, se escala a cualquier ventana, dificultad medida sala por sala, volumen medido contra lo
aprobado) y Navegante de la Red (WebGL, guiado por música).

**Herramientas instaladas y con proyectos en la Mac** (2026-10-09): Photoshop (7 PSD), Illustrator (44 .ai), DaVinci
Resolve (6 proyectos), Blender. Figma: lo dice Zak (vive en el navegador).

**Estudios:** Zak dice «bases en ingeniería telemática/datos» (2026-10-09). Sin institución ni años registrados: si
los da, se agrega una sección Education.

**Idiomas:** español nativo, inglés profesional fluido.

## Estado de las aplicaciones

| Fecha | A dónde | Puesto | CV | Estado |
|---|---|---|---|---|
| 2026-09 | micro1 | Generalist | `cv/2026-09 micro1 (original)` | aceptado (Video Annotation Specialist) |
| 2026-10 | DataAnnotation | Spanish Specialist (25-40 USD/h) | `cv/2026-10 DataAnnotation (Spanish Specialist)` | CV listo |
| 2026-10 | micro1 | QA Engineer · 2D & Creative Applications | `cv/2026-10 micro1 (QA Engineer 2D Creative)` | CV listo |

DataAnnotation: desde México el generalista en inglés no está abierto (solo EE. UU., Reino Unido, Canadá,
Australia, Nueva Zelanda e Irlanda); va el track bilingüe. Nunca VPN.

## Protocolo de cierre de esta sala

Cuando Zak diga «Cerrar Sala de Comando»: (1) la tabla de aplicaciones y el banco de datos de este archivo quedan al
día; (2) `LEEME.md` lista cada versión nueva; (3) commit y push del repo admin con SOLO los archivos de
`aplicaciones/` (en admin hay trabajo de otras salas); (4) lo que toque al ecosistema se registra con el protocolo del
maestro (`/Users/diego/Documents/Red Solar Viva/CLAUDE.md`).
