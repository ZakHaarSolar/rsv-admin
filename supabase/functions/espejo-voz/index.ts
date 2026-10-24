// Red Solar Viva · espejo-voz v3.13 — 🜂 LA PUERTA EN UN SOLO VIAJE (2026-10-24, sala de los recortes). Medido desde la función con una sonda en cada región: cada viaje a la base cuesta de 0.27 a 0.36 s aunque la consulta tarde 15 ms adentro, y la v3.12 todavía hacía tres en fila antes de sintetizar (perfil, suscripciones del miembro y reserva) más la consulta al almacén y los interruptores. Ahora `reservar_espejo_voz` (migración 20261024d) resuelve en UN viaje quién es (la misma señal de _shared/membresia.ts), los dos interruptores, si la parte ya está guardada y la reserva con los mismos candados y ventanas, y devuelve el id de cada fila apartada: el reembolso borra exactamente esas (el de antes borraba por ventana de tiempo y podía llevarse la fila de otra parte de la misma persona). Una parte guardada no aparta nada. Si la base no contesta o la función no existe, el camino de la v3.12 sigue igual. Y la llave pública de Clerk ya viene guardada (_shared/clerkAuth.ts v1.1): la instancia nueva ya no la pide antes de verificar. Mismo corte, mismas respuestas y mismo cobro.
// Red Solar Viva · espejo-voz v3.12 — 🜂 LO QUE NO DEPENDE ENTRE SÍ SE PIDE A LA VEZ (2026-10-24). Medido con los registros de Supabase (92 partes reales del 15 al 24 de octubre, cada consulta con su hora): antes de empezar a sintetizar, cada parte hacía en fila los interruptores del Motor (0.39 s la mediana, hasta 1.9 s), el perfil (0.28), las suscripciones del miembro (0.36), la parte guardada (0.37, hasta 1.1 s) y la reserva (0.30, dos para el miembro): 2.1 s la mediana y 3.9 s el p90, porque la función corre en Virginia y la base vive en Oregón (cada consulta paga el cruce). Ahora la membresía y la parte guardada se piden juntas, las dos ventanas del miembro (mes y día) también, y los interruptores, que con Soniox solo pintan dos cabeceras, viajan mientras la voz se sintetiza. Mismo corte, mismas respuestas y mismo cobro: solo cambia el orden.
// Red Solar Viva · espejo-voz v3.11 — 🜂 LA ESCALERA POR COLCHÓN (Zak 2026-10-24): con `escalera: true` (la app desde espejoVozFish v2.35) cada parte de la lectura crece según la voz que ya tiene asegurada delante (la segunda hasta 1.8 veces la primera, la tercera hasta 0.7 de las dos anteriores, de ahí hasta 0.6 de las tres anteriores, 700 como mucho; ninguna de menos de 120 letras; lo que sobra de un párrafo partido queda abierto). Medido el 2026-10-24: la voz real lee ~18 letras/s y el arranque de la v3.9 todavía dejaba silencios antes de la primera parte grande (Aqua, 2026-10-22: 20 s con el corte de 700 de la tienda). Con solo `arranque` sigue el corte de la v3.9 (las apps instaladas antes) y sin nada el de 700 (tienda): lo que reciben las versiones de tienda no cambia. Las partes guardadas en `voz-partes` se identifican por su texto, así que lo ya hecho se sirve con cualquier corte.
// Red Solar Viva · espejo-voz v3.10 — 🜂 SIN LA VOZ DE GOKU, NI DE RESPALDO (Zak 2026-10-24: «sí, quita a Goku como respaldo»; era un clon de la voz de Mario Castañeda subido por la comunidad de Fish Audio, sin su consentimiento). Goku sale del catálogo: quien la pida (una app vieja que la tenía elegida, o un reference_id de Fish de una build antigua) oye a Bennett. Y si Soniox no responde tras su espera (60 s por cupo, 10 s por tropiezo) o falta su llave, la parte ya NO cruza a Fish: se devuelve el cupo y la respuesta dice «fish_unreachable», el código que todas las versiones de la app ya traducen a «No se pudo alcanzar la voz». Una lectura que no suena es mejor que la voz de alguien sin su permiso. El código de Fish queda dormido.
// Red Solar Viva · espejo-voz v3.9 — 🜂 ESCUCHAR SUENA PRONTO Y LO YA HECHO NO SE REPITE (Zak 2026-10-23: «se tarda mucho y se queda sintonizando; la primera se quitó y le tuve que picar dos veces»). Medido ese día: una primera parte de 700 caracteres tardó 31 s en sintetizarse; la app de la Mac se reinició para actualizarse justo cuando la voz llegaba, y el segundo toque volvió a sintetizar las mismas dos partes (otros 29 s y el doble en el registro de gasto). (1) Con `arranque: true` (la app desde espejoVozFish v2.33) el corte da una primera parte de 120 a 200 caracteres, una segunda de hasta 2.2 veces la primera y una tercera de hasta 1.2 veces las dos, y de ahí 700: simulado con 20 reflejos reales, el primer sonido baja de 22.6 s a 8.6 s sin silencios entre partes; sin la bandera, el corte de siempre (versiones de tienda). (2) Cada parte de Soniox se guarda con sus marcas en el bucket privado `voz-partes` (se crea solo) y una parte ya hecha se sirve de ahí al instante y sin cobrar (X-RSV-Guardada: 1, expuesta). La llave es la huella del texto con el modelo, la voz, el idioma y la velocidad.
// Red Solar Viva · espejo-voz v3.8 — 🜂 LAS MARCAS DE SONIOX LLEGAN A LA APP Y CAEN EN SU LETRA (2026-10-20). Nunca llegaron: X-RSV-Marcas y X-RSV-Marca-Cada no estaban en Access-Control-Expose-Headers, así que el navegador las escondía y la app siempre estimó (en el cofre de la Mac de Zak ninguna parte de Soniox trae marcas). Medido con Soniox real (sonda temporal, Margo y Bennett): sus marcas van sobre su texto PREPROCESADO, que vuelve espacio cada salto (dos saltos de párrafo, un solo espacio) y deja lo demás uno a uno; contadas como si fueran el texto, cada párrafo corría el resalte una letra. Tres cambios: (1) el canal guarda también los `characters` y `alinearMarcas` casa cada uno con su lugar en el texto de la parte; (2) un ancla cada 2 letras en vez de 20 (con los tiempos reales: la estimación queda a 8.2 letras de la voz en promedio y hasta 25; las anclas cada 20, a 2.2 y hasta 11; alineadas cada 2, a 0.6 y hasta 2; unos 730 bytes por parte); (3) se exponen y se mandan SOLO a quien las pide con `marcas_v2: true`: las versiones de tienda leen marcas desde agosto y nunca recibieron una, así que siguen estimando como hoy. Y la limpieza se repite hasta quedar estable: un «Título:» seguido de párrafo volvía a fundirse en la segunda pasada y corría una letra la parte (1 de 101 partes de 20 reflejos reales).
// Red Solar Viva · espejo-voz v3.7 — 🜂 EL CUPO DE SONIOX SE ESPERA, NO SE CRUZA (Zak 2026-10-20: con la escucha automática y Margo, a media lectura, en «Y ahí sí vas a poder elegir», entró la voz de Goku y siguió así). Medido en su Mac: la escucha automática pidió CUATRO síntesis en 2.7 s (el primer tramo dos veces, el segundo y el resto), Soniox atiende TRES a la vez por cuenta (el canal y el REST comparten ese cupo) y a la cuarta le respondió 429; la v3.6 no reintentaba un 429 y caía directo a Fish, cuya voz por defecto es el clon de Goku. Ahora cada intento dice qué pasó (estado y error_type de Soniox): un cupo lleno (limit_exceeded, conexiones o canales al tope) se espera con respiro creciente hasta 60 s y un tropiezo pasajero (408, 5xx, canal caído) hasta 10 s, siempre con el MISMO proveedor; cruzar a Fish queda como último recurso, se anota en los registros de la función y la respuesta lo dice en X-RSV-Cruce (expuesta, como X-RSV-Proveedor, X-RSV-Voz-Nombre y X-RSV-Esperas) para que la app no guarde ese audio bajo la voz pedida. El canal ya no se cierra en audio_end: espera terminated, que es cuando Soniox suelta el lugar.
// Red Solar Viva · espejo-voz v3.6 — 🜂 LOS MODOS SIN PASE SE CIERRAN (auditoría de precios 2026-10-18). (1) Las sondas `marcas` y `voces` sintetizaban sin sesión ni tope: ahora piden la sesión del Arquitecto y tienen su ventana ('espejo-voz-sonda', 30 al día). (2) La `muestra` de la tarjeta de voces la piden la app publicada SIN token, así que exigirlo la dejaría muda: se sirve de una copia guardada por voz e idioma (la frase es fija; en memoria y en el bucket privado `voz-muestras`, porque en producción cada pedido cae en una instancia nueva) y solo sintetiza cuando no existe, con tope por persona, por IP y global ('espejo-voz-muestra'). (3) La membresía falla CERRADA (_shared/membresia.ts): si la base no contesta, la lectura no se cobra como miembro; responde 503 con la frase legible en `error` (la app publicada la muestra tal cual).
// Red Solar Viva · espejo-voz v3.5 — el WebSocket de Soniox se autentica con el subprotocolo ["soniox-api-key", llave] y ya no manda api_key en el primer mensaje (la forma vieja deja de servir el 2027-01-15). Sin header Authorization: en Deno es inestable y junto con el subprotocolo Soniox responde 400. El REST no cambia.
// Red Solar Viva · espejo-voz v3.4 — 🜂 LA VOZ NO CAMBIA DE PERSONA A MEDIA
// LECTURA (Zak 2026-08-14: "entró la voz de Goku y nosotros habíamos mandado
// la de Bennett; y cuando comenzó la parte práctica volvió a Bennett"). Cada
// parte de una lectura larga se pide por separado, así que un tropiezo suelto
// de Soniox hacía que ESA parte —y solo esa— cayera al respaldo de Fish, que
// es otro proveedor y por lo tanto otra voz. Cambiar de timbre a la mitad no
// se lee como "degradó con gracia": se lee como que la app se rompió. Ahora un
// transitorio se reintenta con el MISMO proveedor tras 600 ms, que es lo que
// conserva la voz; solo si Soniox está de verdad caído se cruza a Fish, porque
// mudo sigue siendo peor que distinto. Llave, saldo y cuota no se reintentan.
// | v3.2 — 🜂 LAS MARCAS DE TIEMPO REALES, DETRÁS DE
// BANDERA (Zak 2026-08-12 · VI). La palabra dorada siempre fue una ESTIMACIÓN
// —reloj más largo de texto— y por eso derivaba; Fish no daba otra cosa.
// Soniox sí, por WebSocket, y devuelve algo mejor que tiempos por palabra:
// tiempos por CARÁCTER, que es justo la unidad en la que el resalte ya se
// mueve. `sintetizarConMarcas` abre el canal, junta los trozos de audio y
// acumula los tiempos; lo que vuelve al cliente es el MISMO mp3 de siempre más
// una cabecera `X-RSV-Marcas` con un ancla cada 20 caracteres, delta en
// centésimas y base 36 (medido: 210 bytes para una parte de 1.400, contra un
// tope práctico de 8.000). Así el reproductor del cliente no cambia una línea.
// Solo se toma si el cliente pide `marcas: true`, y si el canal falla cae al
// REST de siempre: la lectura jamás puede depender de una mejora del resalte.
// Sonda `{modo:"marcas"}` para verificar los números sin gastar cupo — medido
// con Bennett: 94 caracteres de texto, 94 marcas, monótonas, 0,196 a 5,261 s.
// | v3.1 — muestra de voz sin token ni cobro para la tarjeta de selección.
// | v3.0 — 🜂 ENTRA SONIOX TTS v2 Y LA VOZ SE ELIGE
// (Zak 2026-08-12 · III). `voice_id` deja de ser un identificador de proveedor
// y pasa a ser una LLAVE DE CATÁLOGO (bennett · owen · cordelia · margo ·
// goku) que vive acá: el cliente nunca sabe quién sintetiza y una voz puede
// cambiar de casa sin publicar una app nueva. Las cuatro primeras van por
// Soniox (`tts-rt-v2`, REST, mp3 a 64 kbps, con la velocidad que Zak eligió
// escuchándolas); Goku se queda en Fish porque es una voz CLONADA que solo
// vive allá y todavía hay saldo. Precio: $0.70 USD la hora generada contra
// ~$1.25 de Fish (1M bytes ≈ 12 h por su propia documentación), y en español
// la brecha se abre más porque Fish cobra por BYTES y cada tilde son dos.
// Tres guardas: sin SONIOX_API_KEY todo cae a Fish (la migración no puede
// dejar la app muda), si Soniox falla se reintenta por Fish (un proveedor con
// un día de vida no puede ser punto único de falla), y un `voice_id` fuera del
// catálogo cae a la voz por defecto salvo que parezca un reference_id de Fish,
// que se respeta para que las builds viejas del teléfono sigan sonando. El
// idioma —que el cliente mandaba desde siempre y acá nadie leía— por fin se
// usa: Soniox lo pide explícito. Sonda `{modo:"voces"}` para confirmar los
// nombres del proveedor sin gastar una síntesis. | v2.1 — 🜂 LA RAÍZ DE LOS RUIDOS RAROS, POR FIN NOMBRADA (Zak 2026-08-11, tercer device-QA con posiciones exactas: "habló como en coreano" en «En 5 años», un gemido antes de «En 10 años», un "Miyu" antes de «La IA que conociste»). Los tres caen en ARRANQUES DE PÁRRAFO, la MISMA frontera que delató a los acentos en v2.0. La causa de fondo no eran los acentos ni el texto: el modelo de Fish es autorregresivo y multilingüe (entrenado con mucho chino/japonés/coreano); en cada frontera interna de trozo RE-ARRANCA su generador desde la voz clonada, y con temperature 0.7 + top_p 0.8 ese primer muestreo a veces agarra fonemas de otro idioma o ruido no verbal. Por eso "ajustar el texto" nunca lo curó: el dado se tira en cada frontera, gane quien gane. Tres perillas lo atacan donde vive: (1) chunk_length 300 (el máximo documentado; menos fronteras internas = menos tiradas del dado), (2) temperature 0.7 → 0.45 (el muestreo conservador casi nunca sale del español; es LA perilla), (3) top_p 0.8 → 0.7 (se deshace el único delta que teníamos sobre el default, que era variedad = riesgo). Los env FISH_TEMPERATURE / FISH_TOP_P siguen mandando si algún día se afinan sin redeploy. | v2.0 — 🜂 LOS ACENTOS SE APAGAN (device-QA de Zak con el reflejo del collar): tres ruidos distintos en una sola lectura ("heee heee" de quien va a hablar en público, dos veces; un timbre completamente distinto en "El proceso:"; una voz "que nada que ver" en "y el espejo hablará ese idioma") y los TRES caen exactamente en una frontera de párrafo, que es donde dirigirVoz insertaba un acento. S2.1 no aplica un tag como un ajuste: lo ACTÚA, y actuar una transición produce esos carraspeos; además es una lotería, así que ni el timbre que gustó se puede conservar. MAX_ACENTOS pasa a 0: la directiva base (tag CORE, estable) se queda y da el tono de la casa. Un timbre propio y REPRODUCIBLE sale de una voz clonada con su reference_id, no de un tag.
//   (Zak, 2026-08-05, con DOS reflejos reales y los tiempos de cada ruido).
//   La causa de fondo sigue siendo la de v1.7 (la directiva libre en inglés,
//   que se apaga acá y que NUNCA llegó a desplegarse), pero sus textos
//   revelaron TRES restos que la limpieza de v1.7 dejaba pasar, medidos:
//   10 caracteres INVISIBLES (word joiner U+2060 dentro de las viñetas del
//   Espejo: "•⁠  ⁠texto"), 5 viñetas • (U+2022, que no estaba en la clase
//   [-*·]) y 3 flechas →. Un modelo de voz "pronuncia" lo que no entiende:
//   eso son los MHH cortos. Cuatro cambios: (1) los invisibles se quitan
//   PRIMERO (rompen los demás regexes: \s no los matchea); (2) la clase de
//   viñetas gana •▪●◦‣ con espaciado opcional; (3) las flechas de flujo se
//   vuelven coma; (4) tras resolver los pares de énfasis, TODO asterisco
//   huérfano muere (el Espejo anida mal a veces: "**...*"). Verificado contra
//   los dos textos de Zak: cero restos en las 7 categorías sondeadas.
// v1.7 — 🜂 LA VOZ DE MONSTRUO ERA LA DIRECTIVA
//   (Zak, 2026-08-02, con el audio y el texto en la mano). Escuchó un reflejo
//   largo y en DOS puntos exactos salió un sonido de interferencia, "como un
//   extraterrestre / un monstruo hablando", reproducible en los mismos tiempos.
//   Sospechó de los separadores `---` del markdown. MEDIDO con su texto real:
//   `limpiarParaVoz` ya los borraba (0 gatos, 0 guiones, 0 asteriscos
//   sobreviven) — no eran ellos. Lo único entre corchetes que viajaba a Fish
//   era la DIRECTIVA BASE de actuación, una vez por PARTE de la lectura: su
//   reflejo se partió en 4 trozos y los puntos raros caen justo en las
//   fronteras de sección, que es donde el segmentador corta.
//   La doc de Fish acepta tags CORE y "también frases libres… sin garantía
//   documentada de que no se LEAN en voz alta si el modelo no las entiende":
//   la directiva era una frase libre, larga y en inglés, dentro de una lectura
//   en español. El riesgo estaba anotado desde que se construyó, sin confirmar.
//   Tres cambios: (1) la marca base nace VACÍA y solo se emite si el secreto
//   FISH_VOICE_DIRECTIVE es un tag CORE de la lista blanca; los ACENTOS
//   ([excited]/[emphasis], ambos CORE) siguen vivos, así que el matiz se
//   conserva. (2) GUARDIÁN DE DIRECCIONES: cualquier corchete del propio
//   reflejo que no sea CORE se descarta antes de sintetizar. (3) PROSA PURA:
//   lo que sobrevivía al markdown y no se sabe pronunciar se traduce —
//   "~2035" → "alrededor de 2035", "2025-2030" → "2025 a 2030", la raya de
//   inciso a coma, comillas fuera. Verificado con el texto de Zak: de 4
//   corchetes a 0, y 6/6 casos de no-regresión (acentos, enlaces, prosa).
// v1.6 — 🜂 TOPE SANO DE LA VOZ (Zak, 2026-07-30).
//   120 unidades/día eran DOS HORAS de voz diarias por persona: nadie normal
//   llega, pero basta un solo Tripulante que viva dentro de la voz para costar
//   ~1.000 MXN/mes contra una suscripción de 499. Ahora el miembro pasa por DOS
//   ventanas — 60 u/día (el pico) y 500 u/mes (el costo, ≈8 h de voz al mes ≈
//   140 MXN de peor caso absoluto). El uso real ronda 120 u/mes, así que el 98%
//   no toca ninguno de los dos. La mensual se reserva primero y se DEVUELVE si
//   la diaria rechaza (nunca se cobra una unidad que no sonó), y el reembolso
//   por fallo de Fish borra las dos ventanas juntas.
// v1.5 — 🔴 "Esa respuesta es demasiado larga para leerla" (Zak, en device, con
//        un reflejo REAL de 3.676 caracteres): el tope de 3.000 no era una
//        medida de seguridad, era un muro arbitrario que dejaba mensajes
//        enteros sin poder escucharse. El Espejo con contexto vivo responde
//        largo cuando la pregunta lo merece — eso NO puede ser un error.
//        Tres cambios que lo resuelven de raíz:
//        (1) EL COSTO SE MIDE EN UNIDADES DE TEXTO, no en "lecturas".
//            Fish cobra por byte, así que cobrar lo mismo por 400 que por
//            3.700 caracteres deformaba todos los cálculos. Ahora 1 unidad ≈
//            1.000 caracteres (~0.28 MXN) y `reserve_edge_spend` recibe ese
//            `p_cost` (el parámetro existía desde la ola E, sin usarse). Con
//            eso el tope de largo puede subir sin descontrolar el gasto: el
//            presupuesto ya está expresado en lo que de verdad cuesta.
//        (2) MAX_CHARS 3.000 → 8.000 (tope de SEGURIDAD, no de costo).
//        (3) LECTURA POR PARTES (`part` en el cuerpo): la edge parte el texto
//            por frontera de párrafo/oración y sintetiza el trozo pedido,
//            devolviendo `X-RSV-Partes`. El cliente nuevo pide la parte 0,
//            empieza a sonar en ~2s y va precargando las siguientes mientras
//            reproduce — en vez de esperar a que se generen 4 minutos de
//            audio de un tirón (y sin cargar 45 MB de PCM en memoria del
//            iPhone, que es lo que hace decodeAudioData con un mp3 largo).
//            SIN `part` el comportamiento es el de siempre (texto completo),
//            así que el build ya publicado sigue funcionando igual.
// v1.4 — 🔴 EL CUPO SE COBRABA AUNQUE LA VOZ FALLARA (Zak lo topó en device:
//        "llegaste al límite" sin haber escuchado casi nada). El gobernador
//        RESERVA antes de llamar a Fish (correcto: es el control de
//        concurrencia), pero si Fish devolvía 402 sin crédito / 5xx / audio
//        vacío, esa unidad quedaba gastada igual. Durante todo el device-QA
//        del 402 cada toque de "Escuchar" quemó una lectura SIN producir
//        audio → el tope de 15/día de v1.2 se agotó en intentos fallidos.
//        Tres arreglos:
//        (1) REEMBOLSO: si no se generó audio, la reserva se borra del ledger
//            (DELETE acotado por user_key + edge + created_at >= el instante
//            justo anterior a reservar — solo puede alcanzar la fila propia).
//            Best-effort y silencioso: si el borrado falla, el comportamiento
//            es el de antes. Nunca se cobra por un fallo nuestro o de Fish.
//        (2) CARRIL DE ADMIN: 300/día (`profiles.is_admin`, que ya se lee en
//            el mismo viaje que el email) — el device-QA es intensivo por
//            definición y no puede chocar contra el tope de un usuario.
//        (3) MENSAJE HONESTO: el 429 devuelve `spent`/`limit`/`window_hours`
//            y la ventana se nombra como lo que ES — 24 horas DESLIZANTES,
//            no "hoy" (el ledger no se resetea a medianoche: las lecturas se
//            liberan una por una, 24 h después de cada una).
// v1.3 — TOPES POR MEMBRESÍA (Sala 2026-07-29 · V, decisión de Zak):
//   · FREEMIUM (sin membresía): 3 escuchas DE POR VIDA — el espejo exacto de
//     sus 3 reflejos gratis: puede escuchar cada uno UNA vez (o tener una
//     conversación por voz completa de 3 turnos) y el muro de Sintonía sube
//     en la 4ª. Costo máximo por persona: ~0.93 MXN en toda su vida.
//     Respuesta al agotar: 403 { error: "membership_required" } → el cliente
//     abre el muro (estado "muro" de espejoVozFish v1.2).
//     🜂 "De por vida" = ventana de 90 días en el ledger (el gobernador no
//     tiene poda automática hoy; si algún día se agenda la limpieza de 7 días
//     documentada en 20260612e, el freemium recuperaría 3 escuchas por
//     ventana — degradación aceptable de ~0.9 MXN, no un agujero).
//   · MIEMBRO: 60 lecturas/día (sube de 15 — el modo conversación consume
//     una lectura por turno y 15 se quedaba corto: una charla de 10-15 min
//     son ~10-15 lecturas). Peor caso 60 × ~0.31 = ~18.6 MXN/día por persona;
//     el uso realista (~50/mes) sigue en ~15 MXN/mes.
//   · GLOBAL: 1.500 lecturas/día (~465 MXN/día ≈ 14K MXN/mes de TECHO
//     absoluto para toda la app — seguro catastrófico, no gasto esperado).
//   La membresía se resuelve server-side con la señal CANÓNICA del Espejo
//   (profiles → email → subscriptions status='active', denylist decoder/dream,
//   fail-open) — la misma de oraculo-chat v1.13.
// v1.2 — MATIZ + INTERCAMBIO DE VOCES (Sala 2026-07-29 · V). Dos cosas:
//
//   (1) DIRECTOR DE VOZ — la voz dejaba de sonar plana. S2.1 acepta TAGS DE
//       ACTUACIÓN entre corchetes ([excited], [emphasis], o frases libres) y
//       nosotros nunca le mandábamos ninguno: leía en su registro neutro por
//       defecto. Ahora `dirigirVoz()` antepone una DIRECTIVA base (secreto
//       FISH_VOICE_DIRECTIVE, editable sin deploy) y marca hasta 3 acentos por
//       lectura con los tags CORE documentados. Además `normalize` pasa a
//       false mientras hay actuación: la doc de Fish lo pide explícito para
//       que las señales de actuación se respeten.
//       🜂 Los parámetros temperature/repetition_penalty que se pidieron ya
//       ERAN el valor por defecto de Fish (0.7 y 1.2) — no eran la causa de
//       la planitud. Se mandan igual, y como secreto, para dejarlos a la mano.
//       Apagado de emergencia: app_flags.espejo_voz_plana = true → vuelve
//       EXACTO al comportamiento de v1.1 (sin tags, normalize true).
//
//   (2) INTERCAMBIO DE VOCES desde el Motor — app_flags.espejo_voz_swap
//       decide CUÁL de las dos voces es la principal y cuál el respaldo, sin
//       tocar secretos ni redesplegar. Sirve para comparar las dos con el oído
//       cuando se quiera. Panel: Motor → ⌂ Inicio → Pruebas A/B.
//
// v1.1 — VOZ DE RESPALDO (FISH_VOICE_FALLBACK_ID): si la voz principal falla
//        por algo SUYO (4xx que no sea llave/saldo/cuota) se reintenta con la
//        alternativa antes de rendirse; el header X-RSV-Voz dice cuál sonó.
//        + `tried_fallback` en el error, para device-QA.
// ---------------------------------------------------------------
// LA VOZ DEL ESPEJO — lee en voz alta una respuesta del Espejo Vibracional
// con Fish Audio (S2.1 Pro). Revive la bocina que quedó OCULTA desde el
// 2026-07-02: la voz on-device de iOS sonaba robótica y ElevenLabs era
// ~5-10x más caro por el mismo trabajo (ver [[referencia_fishaudio_voz_espejo]]).
//
//   POST { token, text, voice_id?, model? }
//   → 200 con los BYTES del mp3 (Content-Type: audio/mpeg)
//   → 4xx/5xx con JSON { error, detail? }
//
// 🜂 EL AUDIO NO SE GUARDA EN NINGÚN LADO. Ni R2 ni base. Se sintetiza, viaja
// al dispositivo y muere ahí. Es la MISMA doctrina de las conversaciones del
// Espejo (cifradas en reposo) y de las imágenes efímeras: lo íntimo no deja
// rastro. Por eso esta edge devuelve bytes en vez de una URL — una URL
// implicaría almacenamiento.
//
// COSTO REAL (verificado 2026-07-29, docs.fish.audio):
//   $15 USD por millón de bytes UTF-8 → una respuesta de 1.000 caracteres en
//   español (~1.050 bytes) ≈ 0.29 MXN. Las cotas de abajo están en número de
//   lecturas y traen su equivalente en pesos al lado: son PERILLAS.
//
// FREEMIUM CON PROBADA COMPLETA (v1.3): quien no es miembro escucha 3 veces
// en toda su vida — el espejo de sus 3 reflejos gratis, suficiente para SENTIR
// la voz (muro en el pico, no en la puerta) — y a la 4ª sube el muro de
// Sintonía. El miembro tiene 60 lecturas al día.
//
// ⚠️ VENTANA GRATIS de Fish (modelo `s2.1-pro-free`, hasta el 31-ago-2026):
// sus términos dicen que los requests pueden RETENERSE para entrenar → JAMÁS
// con texto real de Tripulantes. Es SOLO para el piloto interno de elección de
// voz con textos de prueba (admin/scripts/fish-voces-piloto.sh). Esta edge usa
// el modelo de PAGO (FISH_MODEL, default s2.1-pro).
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy espejo-voz --no-verify-jwt
//
// Secrets: FISH_AUDIO_API_KEY · FISH_VOICE_ID (la voz elegida por Zak en el
//   piloto) · FISH_VOICE_FALLBACK_ID (la alterna) · FISH_MODEL (opcional,
//   default "s2.1-pro") · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
//   OPCIONALES de afinación (todos con default sano, cambiarlos NO exige
//   tocar código): FISH_VOICE_DIRECTIVE · FISH_TEMPERATURE · FISH_TOP_P ·
//   FISH_REPETITION_PENALTY · FISH_VOICE_SPEED

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateUser } from "../_shared/clerkAuth.ts"
import {
    resolverMembresia,
    avisoMembresiaNoVerificada,
} from "../_shared/membresia.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    /* Sin esto el navegador esconde los headers propios y el device-QA no
       podría leer qué voz sonó ni en qué matiz.
       🜂 v3.7 — también QUIÉN habló, si hubo cruce y cuánto se esperó: sin
       eso la app no distingue el audio de respaldo del que pidió y lo guarda
       bajo la voz equivocada. Las versiones publicadas no las leen, así que
       sumarlas no les cambia nada. */
    "Access-Control-Expose-Headers":
        "X-RSV-Voz, X-RSV-Voz-Swap, X-RSV-Matiz, X-RSV-Partes, X-RSV-Parte, X-RSV-Proveedor, X-RSV-Voz-Nombre, X-RSV-Cruce, X-RSV-Esperas, X-RSV-Guardada",
}

const FISH_TTS_URL = "https://api.fish.audio/v1/tts"

/* ═══════════════════════════════════════════════════════════════════════
   🜂 v3.0 — EL CATÁLOGO DE VOCES (Zak 2026-08-12 · III)
   ═══════════════════════════════════════════════════════════════════════
   Soniox TTS v2 (`tts-rt-v2`, disponible desde el 11-ago-2026) cobra por
   AUDIO GENERADO y no por bytes de texto: $0.70 USD la hora contra los
   ~$1.25 de Fish (1M bytes ≈ 12 h por su propia documentación), y en
   español la brecha se abre más porque cada tilde le cuesta a Fish dos
   bytes y a Soniox no le cuesta nada.

   El catálogo vive ACÁ y no en el cliente por dos razones: el nombre de la
   voz es dato de proveedor (si mañana cambia, no hay que publicar una app
   nueva), y así el cliente jamás puede pedir una voz que no exista.

   Goku se queda en Fish a propósito: es una voz CLONADA que solo vive allá,
   y todavía hay saldo que gastar. El id que llega del cliente es una llave
   de este mapa, no un identificador del proveedor. */
type VozCat = {
    proveedor: "soniox" | "fish"
    /* Soniox: el nombre del built-in tal cual (`voice`). Fish: reference_id
       de la voz clonada; vacío = la que mande el secreto. */
    voz: string
    /* Solo Soniox: 0.7 a 1.3. Las eligió Zak escuchándolas una por una. */
    speed?: number
}
const VOCES: Record<string, VozCat> = {
    bennett: { proveedor: "soniox", voz: "Bennett", speed: 1.1 },
    owen: { proveedor: "soniox", voz: "Owen", speed: 1.1 },
    cordelia: { proveedor: "soniox", voz: "Cordelia", speed: 1.3 },
    margo: { proveedor: "soniox", voz: "Margo", speed: 1.2 },
}
/* 🜂 v3.10 — Goku ya no existe: quien la pida oye a Bennett. */
const ALIAS_VOZ: Record<string, string> = { goku: "bennett" }
const VOZ_POR_DEFECTO = "bennett"
/* 🜂 v3.1 — LA FRASE DE MUESTRA. Se elige una voz escuchándola, no leyendo su
   nombre, y obligar a gastar un reflejo entero para probarla es absurdo. Es
   una frase de la casa —dice algo, no es "probando uno dos tres"— y es corta
   a propósito: unos ocho segundos alcanzan para oír el timbre y el ritmo.
   No cobra cupo: probar la voz no es consumir la app, es elegirla. */
const MUESTRA_ES =
    "Tu campo no necesita permiso para expandirse. Respira, y deja que la coherencia haga el resto."
const MUESTRA_EN =
    "Your field needs no permission to expand. Breathe, and let coherence do the rest."
const SONIOX_TTS_URL = "https://tts-rt.soniox.com/tts"
const SONIOX_WS_URL = "wss://tts-rt.soniox.com/tts-websocket"

/* ═══════════════════════════════════════════════════════════════════════
   🜂 v3.2 — LAS MARCAS DE TIEMPO REALES (Zak 2026-08-12 · VI)
   ═══════════════════════════════════════════════════════════════════════
   La palabra dorada del Espejo siempre fue una ESTIMACIÓN: se calculaba con
   el reloj y el largo del texto, y por eso derivaba. Fish no daba otra cosa.
   Soniox sí, pero solo por WebSocket, y devuelve algo mejor que tiempos por
   palabra: tiempos por CARÁCTER, que es justamente la unidad en la que el
   resalte ya se mueve.

   Lo que viaja de vuelta NO es la lista entera —1.400 caracteres serían
   1.400 números en una cabecera— sino un ancla cada MARCA_CADA caracteres.
   El resalte avanza por grupos desde la v4.2, así que esa resolución es de
   sobra, y con delta en centésimas y base 36 una parte completa ocupa unos
   doscientos bytes: entra holgada en una cabecera y el audio sigue viajando
   como bytes crudos, sin tocar una línea del reproductor del cliente.
   🜂 v3.8 — cada 2, no cada 20. Con los tiempos reales de Soniox, interpolar
   entre anclas separadas 20 letras deja el resalte hasta 11 letras lejos de
   la voz en las pausas; cada 2, hasta 2 (0.6 en promedio). Una parte de 700
   letras ocupa unos 730 bytes y el cliente lee el espaciado de la cabecera. */
const MARCA_CADA = 2

/* 🜂 v3.8 — LAS MARCAS DE SONIOX SE CASAN CON EL TEXTO. Soniox fecha su texto
   PREPROCESADO, no el que le mandamos: vuelve un espacio cada salto (dos
   saltos de párrafo, uno solo) y quita lo que no sabe pronunciar, como los
   emojis; no devuelve ninguna correspondencia (medido el 2026-10-20 con Margo
   y Bennett: 432 letras de texto, 429 suyas, y sin espacios coinciden todas).
   Aquí cada carácter suyo se busca en el texto de la parte a partir del
   anterior: un espacio suyo cubre la racha entera de espacios y saltos, y lo
   que quitó toma el tiempo del siguiente que sí dijo. Devuelve el inicio de
   CADA letra del texto que la app conoce, que es en lo que ella cuenta. */
function alinearMarcas(
    texto: string,
    caracteres: string[],
    tiempos: number[]
): number[] {
    const n = texto.length
    const t: number[] = new Array(n).fill(Number.NaN)
    let i = 0
    for (let j = 0; j < caracteres.length && i < n; j++) {
        const c = String(caracteres[j] ?? "").normalize("NFC")
        const ts = Number(tiempos[j]) || 0
        if (!c) continue
        if (/^\s+$/.test(c)) {
            if (/\s/.test(texto[i])) while (i < n && /\s/.test(texto[i])) t[i++] = ts
            continue
        }
        let k = i
        while (k < n && k - i <= 8 && !texto.startsWith(c, k)) k++
        if (k < n && texto.startsWith(c, k)) {
            for (let x = i; x < k + c.length; x++) t[x] = ts
            i = k + c.length
        } else t[i++] = ts
    }
    let ultimo = 0
    for (let x = 0; x < n; x++) {
        if (Number.isNaN(t[x])) t[x] = ultimo
        else ultimo = t[x]
    }
    return t
}

function marcasCompactas(tiempos: number[]): string {
    /* Delta en centésimas de segundo, base 36. Monótono creciente, así que
       los deltas son chicos y casi siempre caben en uno o dos caracteres. */
    const out: string[] = []
    let prev = 0
    for (let i = 0; i < tiempos.length; i += MARCA_CADA) {
        const cs = Math.max(0, Math.round(tiempos[i] * 100))
        out.push((cs - prev).toString(36))
        prev = cs
    }
    return out.join(".")
}

/* 🜂 v3.7 — CADA INTENTO DICE QUÉ PASÓ. Antes el canal solo decía «salió» o
   null, y con un null no hay cómo distinguir un cupo lleno (se cura esperando
   unos segundos) de una llave rota (no se cura nunca): por eso un 429 acababa
   en Fish. Ahora vuelve el estado y el error_type que manda Soniox, y quien
   llama decide si espera, insiste o se rinde. */
type IntentoSoniox =
    | { ok: true; audio: Uint8Array; tiempos: number[]; caracteres: string[] }
    | { ok: false; status: number; tipo: string; detalle: string }

/* Cuánto se le espera a Soniox antes de rendirse, por clase de tropiezo. Un
   cupo lleno se vacía solo en cuanto termina alguna síntesis en curso (la
   más larga que mandamos ronda los 37 s), así que se le dan 60: cubre una
   tanda entera y el escalón del respiro; un tropiezo pasajero que no se cura
   en 10 s ya no es un tropiezo. Con la síntesis encima, el peor caso ronda
   los 105 s, lejos del límite de 150 s de la función. */
const ESPERA_CUPO_MS = 60000
const ESPERA_PASAJERO_MS = 10000

/* Respiro creciente con un poco de azar, para que dos partes rechazadas al
   mismo tiempo no vuelvan a chocar al mismo tiempo: 0.7, 1.2, 2, 3.4, 5.8 s
   y de ahí 6 s, cada uno ±20 %. */
function respiroSoniox(intento: number): number {
    const base = Math.min(6000, 700 * Math.pow(1.7, Math.max(0, intento - 1)))
    return Math.round(base * (0.8 + Math.random() * 0.4))
}

/* Los nombres son los de la documentación de errores de Soniox
   (error_type): se decide por ellos y por el estado, nunca por el mensaje. */
function claseFalloSoniox(f: {
    status: number
    tipo: string
}): "cupo" | "pasajero" | "fijo" {
    const t = (f.tipo || "").toLowerCase()
    if (
        f.status === 429 ||
        t === "limit_exceeded" ||
        t === "max_concurrent_connections_reached" ||
        t === "max_concurrent_streams_reached"
    )
        return "cupo"
    if (t === "voice_failed") return "fijo"
    if (f.status === 0 || f.status === 408 || f.status >= 500) return "pasajero"
    return "fijo"
}

/* Sintetiza por WebSocket y devuelve audio + tiempo de inicio de CADA
   carácter. Si el canal no llega a buen puerto devuelve el motivo: el
   llamador decide entre esperar (cupo, tropiezo) o caer al REST de siempre,
   que no da marcas pero no depende de este canal. */
async function sonioxPorCanal(
    key: string,
    modelo: string,
    voz: string,
    idioma: string,
    texto: string,
    velocidad?: number
): Promise<IntentoSoniox> {
    return await new Promise((resolve) => {
        let ws: WebSocket
        try {
            ws = new WebSocket(SONIOX_WS_URL, ["soniox-api-key", key])
        } catch (e) {
            resolve({
                ok: false,
                status: 0,
                tipo: "canal_no_abre",
                detalle: String(e).slice(0, 160),
            })
            return
        }
        const trozos: Uint8Array[] = []
        const tiempos: number[] = []
        /* v3.8 — sus caracteres, en el mismo orden que los tiempos. */
        const caracteres: string[] = []
        let sinCaracteres = false
        let listo = false
        let finAudio = false
        let reloj: number | undefined
        let gracia: number | undefined
        const conAudio = (): IntentoSoniox => {
            const total = trozos.reduce((n, t) => n + t.length, 0)
            if (!total)
                return { ok: false, status: 0, tipo: "canal_vacio", detalle: "" }
            const audio = new Uint8Array(total)
            let off = 0
            for (const t of trozos) {
                audio.set(t, off)
                off += t.length
            }
            return { ok: true, audio, tiempos, caracteres: sinCaracteres ? [] : caracteres }
        }
        const terminar = (v: IntentoSoniox) => {
            if (listo) return
            listo = true
            if (reloj !== undefined) clearTimeout(reloj)
            if (gracia !== undefined) clearTimeout(gracia)
            try {
                ws.close()
            } catch {}
            resolve(v)
        }
        /* Un canal que no responde no puede colgar la lectura: 45 s es más
           del doble de lo que tarda la parte más larga que mandamos. */
        reloj = setTimeout(
            () =>
                terminar(
                    finAudio
                        ? conAudio()
                        : {
                              ok: false,
                              status: 0,
                              tipo: "canal_reloj",
                              detalle: "45 s sin terminar",
                          }
                ),
            45000
        )
        const sid = `rsv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        ws.onopen = () => {
            try {
                ws.send(
                    JSON.stringify({
                        model: modelo,
                        language: idioma,
                        voice: voz,
                        audio_format: "mp3",
                        bitrate: 64000,
                        stream_id: sid,
                        return_timestamps: true,
                        ...(velocidad ? { speed: velocidad } : {}),
                    })
                )
                ws.send(
                    JSON.stringify({ text: texto, text_end: true, stream_id: sid })
                )
            } catch (e) {
                terminar({
                    ok: false,
                    status: 0,
                    tipo: "canal_envio",
                    detalle: String(e).slice(0, 160),
                })
            }
        }
        ws.onmessage = (ev) => {
            try {
                const m = JSON.parse(String(ev.data))
                if (m.error_code || m.error_type) {
                    terminar({
                        ok: false,
                        status: Number(m.error_code) || 0,
                        tipo: String(m.error_type || ""),
                        detalle: String(m.error_message || "").slice(0, 200),
                    })
                    return
                }
                if (m.audio) {
                    const bin = atob(m.audio)
                    const u = new Uint8Array(bin.length)
                    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
                    trozos.push(u)
                }
                const ts = m.timestamps
                if (ts?.character_start_times_seconds) {
                    for (const t of ts.character_start_times_seconds)
                        tiempos.push(Number(t) || 0)
                    /* Si un cuadro no trae sus caracteres (o no cuadran), no
                       se adivina: se usan los tiempos tal cual. */
                    const cs = ts.characters
                    if (
                        Array.isArray(cs) &&
                        cs.length === ts.character_start_times_seconds.length
                    )
                        for (const c of cs) caracteres.push(String(c ?? ""))
                    else sinCaracteres = true
                }
                /* 🜂 v3.7 — audio_end dice que ya no viene más audio, pero el
                   lugar en el cupo se suelta con `terminated` (la documentación
                   de Soniox pide no dar el canal por terminado antes). Cerrar en
                   audio_end dejaba la cuenta un instante más llena de lo que
                   estaba; se espera terminated con una gracia corta. */
                if (m.terminated) {
                    terminar(conAudio())
                    return
                }
                if (m.audio_end && !finAudio) {
                    finAudio = true
                    gracia = setTimeout(() => terminar(conAudio()), 2500)
                }
            } catch {}
        }
        ws.onerror = () =>
            terminar(
                finAudio
                    ? conAudio()
                    : { ok: false, status: 0, tipo: "canal_error", detalle: "" }
            )
        ws.onclose = (ev: any) =>
            terminar(
                finAudio
                    ? conAudio()
                    : {
                          ok: false,
                          status: 0,
                          tipo: "canal_cerrado",
                          detalle: `código ${ev?.code ?? "?"}${ev?.reason ? ` · ${String(ev.reason).slice(0, 120)}` : ""}`,
                      }
            )
    })
}

/* La sonda de marcas sigue hablando como antes: audio y tiempos, o nada. */
async function sintetizarConMarcas(
    key: string,
    modelo: string,
    voz: string,
    idioma: string,
    texto: string,
    velocidad?: number
): Promise<{ audio: Uint8Array; tiempos: number[] } | null> {
    const r = await sonioxPorCanal(key, modelo, voz, idioma, texto, velocidad)
    return r.ok ? { audio: r.audio, tiempos: r.tiempos } : null
}
const SONIOX_MODEL = Deno.env.get("SONIOX_MODEL") || "tts-rt-v2"
const DEFAULT_MODEL = "s2.1-pro"

/* ── LOS DOS INTERRUPTORES DEL MOTOR (⌂ Inicio → Pruebas A/B) ─────────────
   Se leen SERVER-SIDE: los ids de las voces son secretos y el cliente no los
   conoce, así que la decisión no puede vivir en la app. Cambiarlos aplica en
   la siguiente lectura, sin redesplegar nada. */
const FLAG_SWAP = "espejo_voz_swap" // true = la alterna pasa a principal
const FLAG_PLANA = "espejo_voz_plana" // true = sin actuación (v1.1 exacta)

/* 🜂 v1.7 · LA DIRECTIVA LIBRE SE APAGA — era la voz de monstruo (Zak, con
   audio y texto en la mano, 2026-08-02).
   ─────────────────────────────────────────────────────────────────────────
   Zak escuchó un reflejo largo y en DOS puntos exactos del audio salió un
   sonido de interferencia, "como un extraterrestre / un monstruo hablando",
   reproducible en los mismos tiempos. Sospechó de los separadores `---` del
   markdown. Medido con su texto real: `limpiarParaVoz` los borra (0 gatos, 0
   guiones, 0 asteriscos sobreviven) — no eran ellos. Lo que SÍ viajaba a Fish
   en ese texto era UN SOLO corchete, repetido una vez por PARTE de la
   lectura: esta directiva. Su reflejo se partió en 4 trozos y los puntos
   raros caen justo en las fronteras de sección (donde el segmentador corta).

   La doc de Fish acepta tags CORE documentados y "también frases libres…
   sin garantía documentada de que no se LEAN en voz alta si el modelo no las
   entiende". Esta era una frase libre, larga y en inglés, dentro de una
   lectura en español: el peor caso posible de esa advertencia — y era el
   riesgo que ya habíamos anotado al construirlo, sin poder confirmarlo.

   Por eso la marca base pasa a estar VACÍA por defecto y, si se configura
   por secreto, solo se emite cuando es un tag CORE de la lista blanca. Los
   ACENTOS siguen vivos ([excited] / [emphasis], ambos CORE) — la lectura
   conserva su matiz sin mandarle al modelo texto que quizá recite.
   Para volver a probar una directiva libre algún día:
   `supabase secrets set FISH_VOICE_DIRECTIVE="excited"` (o cualquier CORE). */
const DEFAULT_DIRECTIVE = ""

/* Tags CORE documentados por Fish (docs → core-features/emotions). Cualquier
   cosa fuera de esta lista NO se emite como dirección: se descarta. */
const TAGS_CORE = new Set([
    "whisper",
    "laugh",
    "emphasis",
    "sigh",
    "gasp",
    "pause",
    "angry",
    "excited",
    "sad",
    "surprised",
    "inhale",
    "exhale",
])

/* Parámetros de generación. 🜂 v2.1 — YA NO son los defaults de Fish: son el
   freno de los ruidos raros. El modelo re-arranca su generador en cada
   frontera interna de trozo, y con el muestreo suelto (0.7/0.8) ese primer
   paso a veces sale en otro idioma o en ruido no verbal — los "coreanos", los
   gemidos y los "Miyu" que Zak cazó SIEMPRE en arranques de párrafo.
   temperature 0.45 = muestreo conservador que casi nunca abandona el español;
   top_p 0.7 = de vuelta al default (el 0.8 era "variedad en la entrega", y la
   variedad es exactamente el riesgo). Si la voz se siente plana, la perilla
   fina es FISH_TEMPERATURE por env, sin redeploy. */
const DEFAULT_TEMPERATURE = 0.45
const DEFAULT_TOP_P = 0.7
const DEFAULT_REPETITION_PENALTY = 1.2

/* Tags CORE que la documentación marca como los más confiables. Se usan solo
   estos para los acentos automáticos: una frase libre inventada corre el
   riesgo de que el modelo la LEA en voz alta en vez de interpretarla. */
const TAG_ENERGIA = "excited"
const TAG_CIERRE = "emphasis"

/* 🜂 v2.0 — LOS ACENTOS SE APAGAN: eran los ruidos raros (Zak, device-QA con
   el reflejo del collar en la mano). Tres reportes distintos en una sola
   lectura, y los tres caen EXACTAMENTE en una frontera de párrafo, que es
   donde `dirigirVoz` insertaba un acento:
     · el "heee heee" / "mhh mhh" de quien va a hablar en público (dos veces,
       entre párrafos),
     · un timbre completamente distinto en "El proceso:",
     · una voz "que nada que ver" en "y el espejo hablará ese idioma".
   S2.1 no aplica un tag como un ajuste de volumen: lo ACTÚA, y actuar una
   transición produce esos carraspeos. Además es una lotería — el mismo tag da
   un resultado distinto cada vez, así que ni siquiera se puede conservar el
   que gustó. Una voz guía se elige por CONFIABLE, no por sorprendente: la
   directiva base (un tag CORE, estable, que abre la lectura) se queda y le da
   el tono de la casa; los acentos por párrafo se van.
   🜂 Para volver a probarlos algún día basta subir este número; el resto de
   `dirigirVoz` queda intacto a propósito. Un timbre PROPIO (el que Zak quiso
   conservar) no sale de aquí: sale de una voz clonada en Fish con su
   reference_id, que sí es reproducible. */
const MAX_ACENTOS = 0

function envNumber(key: string, fallback: number): number {
    const raw = Deno.env.get(key)
    if (!raw) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
}

/* v1.5 — Tope de SEGURIDAD, no de costo (el costo lo gobiernan las unidades
   de abajo). Un reflejo real de Zak medía 3.676 caracteres y el tope viejo de
   3.000 lo dejaba sin poder escucharse: el Espejo con contexto vivo responde
   largo cuando la pregunta lo merece. 8.000 cubre cualquier respuesta real
   con margen y sigue frenando un cuerpo absurdo. */
const MAX_CHARS = 8000

/* 🜂 EL COSTO SE MIDE EN TEXTO, NO EN "LECTURAS". Fish cobra por byte: una
   lectura de 400 caracteres y una de 3.700 no pueden gastar lo mismo del
   presupuesto. 1 unidad ≈ 1.000 caracteres ≈ 0.28 MXN, así los topes de abajo
   están expresados en lo que de verdad cuesta y el largo deja de ser un muro. */
/* 🜂 v2.0 — UNIDAD FINA (Zak, con su factura en la mano: gastó $0.37 y el
   aviso le dijo "60 lecturas", ~24 min reales). Con unidades de 1.000 chars
   y mínimo de 1, CADA lectura corta cobraba una unidad entera: el tope se
   agotaba por NÚMERO de lecturas, no por minutos, y decir "una hora de voz"
   era falso. Con unidades de 100 chars (~6 s de habla) el cobro es
   proporcional de verdad: 600 u/día son 60.000 caracteres ≈ 1 HORA real, y
   el costo máximo por persona NO cambia (mismos caracteres, mismo dinero). */
const CHARS_POR_UNIDAD = 100
const unidades = (n: number) => Math.max(1, Math.ceil(n / CHARS_POR_UNIDAD))

/* Tamaño de cada parte cuando el cliente lee por trozos. ~1.400 caracteres son
   ~90 segundos de voz: suficiente para que la siguiente parte se sintetice de
   sobra mientras suena la actual, y corto para que la PRIMERA empiece rápido. */
/* 🜂 v3.3 — 700, no 1.400. Soniox sintetiza a ~0,8x tiempo real, así que una
   parte de 1.400 caracteres hacía esperar ~45 s antes del primer sonido.
   Partirlas por la mitad parte la espera por la mitad; el resto se sintetiza
   mientras suena la anterior. DEBE coincidir con SEG_CHARS_ESPEJO del cliente. */
const SEG_CHARS = 700
/* 🜂 v3.9 — EL ARRANQUE CORTO (Zak 2026-10-23: "se tarda mucho y se queda
   sintonizando"). Medido ese día: una primera parte de 700 tardó 31 s en
   sintetizarse antes de que sonara nada. Con `arranque: true` en el pedido la
   primera parte mide hasta 200 caracteres y nunca menos de 120 si el texto da
   para más (un titular solo dejaba un silencio mientras llegaba la segunda);
   la segunda, hasta 2.2 veces la primera; la tercera, hasta 1.2 veces las dos
   juntas; de ahí, 700. Simulado con 20 reflejos reales: el primer sonido baja
   de 22.6 s a 8.6 s y no queda silencio entre partes. DEBE coincidir con
   segmentarEspejo del cliente (espejoVozFish v2.33). Sin la bandera (las
   versiones de tienda), el corte de siempre. */
const ARRANQUE_PRIMERA = 200
const ARRANQUE_MINIMO = 120
const ARRANQUE_K1 = 2.2
const ARRANQUE_K2 = 1.2
/* 🜂 v3.11 — LA ESCALERA POR COLCHÓN (Zak 2026-10-24). La voz real lee ~18
   letras por segundo y el arranque corto seguía dejando silencios antes de la
   primera parte grande (80 reflejos reales de Zak: 16 con pausa en día normal,
   70 en día lento). Con `escalera: true` cada parte crece según la voz que ya
   tiene asegurada delante: la segunda hasta 1.8 veces la primera, la tercera
   hasta 0.7 de las dos anteriores, de ahí hasta 0.6 de las tres anteriores
   (700 como mucho); ninguna cierra con menos de 120 letras y lo que sobra de
   un párrafo partido queda abierto para lo que sigue. Simulado: 0 de 80 con
   pausa en día normal y 1 de 80 en día lento. DEBE coincidir con
   segmentarEspejo del cliente (espejoVozFish v2.35). Con solo `arranque`
   (las apps instaladas antes) se queda el de la v3.9; sin nada (tienda), 700. */
const ESCALERA_K1 = 1.8
const ESCALERA_K2 = 0.7
const ESCALERA_K3 = 0.6
const ESCALERA_MINIMO = 120
type CorteVoz = "tienda" | "arranque" | "escalera"

/* ── PERILLAS DE GASTO (con su costo en MXN al lado) ──────────────────────
   v1.3 — DOS carriles por membresía:
   · MIEMBRO: 60/día (~18.6 MXN/día peor caso; ~15 MXN/mes realista). El modo
     conversación gasta una lectura por turno — una charla de 10-15 min son
     ~10-15 lecturas, así que 60 da 3-4 charlas al día + lecturas sueltas.
   · FREEMIUM: 3 DE POR VIDA (~0.93 MXN por persona en total) — espejo de sus
     3 reflejos gratis; al agotarse sube el muro de Sintonía (403). La ventana
     de 90 días hace de "por vida" (ver nota v1.3 de la cabecera). */
/* v1.5 — TODOS los topes están en UNIDADES de ~1.000 caracteres (~0.28 MXN),
   no en "lecturas": así un reflejo largo consume lo que de verdad cuesta y
   ninguno queda bloqueado por su tamaño.
   · MIEMBRO 120 u/día ≈ 120.000 caracteres ≈ 2 h de voz ≈ 33 MXN/día de peor
     caso absoluto; el uso realista (~50 lecturas al mes) sigue en ~15 MXN/mes. */
/* 🜂 v1.6 — TOPE SANO (Zak, 2026-07-30). 120 u/día son DOS HORAS de voz al día
   por persona, todos los días: nadie normal llega, pero basta uno que sí para
   costar ~1.000 MXN/mes contra una suscripción de 499. Ahora son dos ventanas:
     · 60 u/día  → el pico (una hora de voz en un día; ni el uso más intenso
                   de una conversación larga se acerca).
     · 500 u/mes → el costo (≈ 8 h de voz al mes ≈ $7.8 USD ≈ 140 MXN de peor
                   caso absoluto, contra los 424 MXN netos que deja el miembro).
   El 98% de la gente no toca ninguno de los dos: el uso real ronda 120 u/mes.
   Al subir el precio o bajar el costo del proveedor, subir estos números; para
   el Tripulante un tope que crece es un regalo y uno que baja es un castigo. */
const MEMBER_LIMIT_DAY = 600 /* v2.0 — 60.000 chars ≈ 1 HORA de voz/día */
const MEMBER_LIMIT_MONTH = 5000 /* v2.0 — 500.000 chars ≈ 8 HORAS/mes */
const MONTH_SECONDS = 30 * 86400
/* · ADMIN 600 u/día. Probar la voz ES el trabajo del device-QA (afinar la
     actuación exige escucharla decenas de veces) y chocar con el tope de un
     usuario normal a media prueba es fricción pura. El freno global manda. */
const ADMIN_LIMIT_DAY = 6000 /* v2.0 — 10 h/día para el device-QA */
/* · FREEMIUM 8 u de por vida ≈ 8.000 caracteres ≈ 2.2 MXN en toda su vida:
     alcanza para 3-4 reflejos de largo normal (o 2 largos), que es el espejo
     de sus 3 reflejos gratis. Al agotarse sube el muro de Sintonía. */
const FREE_UNITS_LIFETIME = 80 /* v2.0 — 8.000 chars, igual que antes */
const FREE_WINDOW_SECONDS = 90 * 86400
/* Freno GLOBAL diario: 1.800 unidades ≈ 500 MXN/día ≈ 15K MXN/mes de techo
   absoluto para toda la app. Sin esto, N cuentas suman sin freno. */
const GLOBAL_LIMIT_DAY = 18000 /* v2.0 — mismo techo en dinero */
const DAY_SECONDS = 86400
/* 🜂 v3.6 — LOS TOPES DE LO QUE ANTES NO PEDÍA PASE.
   · Sondas (`marcas`, `voces`): solo el Arquitecto, 30 al día y 100 en toda la
     app. Son herramientas de diagnóstico: nadie más las necesita.
   · Muestra de voz: la frase es fija, así que cada voz e idioma se sintetiza
     una vez por instancia y después sale de la copia guardada (gratis). Estos
     topes solo cuentan las síntesis nuevas: 20 al día por persona o por IP y
     300 en toda la app (~0.6 USD de techo absoluto al día). */
const SONDA_POR_DIA = 30
const SONDA_GLOBAL_DIA = 100
const MUESTRA_POR_DIA = 20
const MUESTRA_GLOBAL_DIA = 300
type MuestraGuardada = {
    audio: Uint8Array<ArrayBuffer>
    headers: Record<string, string>
}
const MUESTRAS = new Map<string, MuestraGuardada>()
/* 🜂 v3.6 — LA COPIA QUE SOBREVIVE A LA INSTANCIA. Medido en producción: cada
   pedido cae en una instancia nueva, así que la copia en memoria casi nunca
   alcanza. Cada muestra se guarda además en el almacenamiento del proyecto
   (bucket privado `voz-muestras`, se crea solo la primera vez) y se sirve de
   ahí: cada voz e idioma se paga UNA vez. La ruta lleva la voz, la velocidad y
   el largo de la frase, así que cambiar cualquiera de los tres la regenera. */
const BUCKET_MUESTRAS = "voz-muestras"
function cabecerasServicio(): Record<string, string> | null {
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    return key ? { apikey: key, Authorization: `Bearer ${key}` } : null
}
async function leerMuestraGuardada(
    ruta: string
): Promise<Uint8Array<ArrayBuffer> | null> {
    const url = Deno.env.get("SUPABASE_URL")
    const h = cabecerasServicio()
    if (!url || !h) return null
    try {
        const r = await fetch(
            `${url}/storage/v1/object/${BUCKET_MUESTRAS}/${ruta}`,
            { headers: h, signal: AbortSignal.timeout(4000) }
        )
        if (!r.ok) return null
        const audio = new Uint8Array(await r.arrayBuffer())
        return audio.length > 1000 ? audio : null
    } catch {
        return null
    }
}
async function guardarMuestra(
    ruta: string,
    audio: Uint8Array<ArrayBuffer>
): Promise<void> {
    const url = Deno.env.get("SUPABASE_URL")
    const h = cabecerasServicio()
    if (!url || !h) return
    const subir = () =>
        fetch(`${url}/storage/v1/object/${BUCKET_MUESTRAS}/${ruta}`, {
            method: "POST",
            headers: { ...h, "Content-Type": "audio/mpeg", "x-upsert": "true" },
            body: audio,
        })
    try {
        let r = await subir()
        if (!r.ok && (r.status === 400 || r.status === 404)) {
            /* el bucket todavía no existe: se crea privado y se reintenta */
            await fetch(`${url}/storage/v1/bucket`, {
                method: "POST",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: BUCKET_MUESTRAS,
                    name: BUCKET_MUESTRAS,
                    public: false,
                }),
            }).catch(() => null)
            r = await subir()
        }
        if (!r.ok)
            console.warn(
                "[espejo-voz] la muestra no se guardó:",
                r.status,
                (await r.text().catch(() => "")).slice(0, 160)
            )
    } catch (e) {
        console.warn("[espejo-voz] la muestra no se guardó:", String(e).slice(0, 160))
    }
}

/* ── 🜂 v3.9 · LO YA SINTETIZADO NO SE PAGA NI SE ESPERA DOS VECES ─────────
   (Zak 2026-10-23: "la primera cuando le piqué se puso sintonizando y se
   quitó; le tuve que picar dos veces"). Medido en su Mac y aquí: la app se
   reinició para actualizarse 31 s después del toque, justo cuando la voz
   llegaba; el aparato no alcanzó a guardarla y el segundo toque volvió a
   sintetizar las mismas dos partes (otros 29 s y el doble de gasto, en el
   registro de gasto). Ahora cada parte de Soniox se guarda también aquí
   (bucket privado `voz-partes`, se crea solo), con sus marcas, y una parte ya
   hecha se sirve de ahí en un instante y sin cobrar: un segundo toque, otro
   aparato o la misma lectura después de un reinicio suenan sin esperar. La
   llave es la huella del texto de la parte con el modelo, la voz, el idioma y
   la velocidad: cambiar cualquiera la regenera. Las marcas viajan en un
   archivo hermano (`.m`) que se sube ANTES que el audio: si el audio está, su
   parte está completa. */
const BUCKET_PARTES = "voz-partes"
async function huellaParte(datos: Record<string, unknown>): Promise<string> {
    const h = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(datos))
    )
    return Array.from(new Uint8Array(h))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}
async function leerParteGuardada(
    ruta: string
): Promise<{ audio: Uint8Array<ArrayBuffer>; marcas: string } | null> {
    const url = Deno.env.get("SUPABASE_URL")
    const h = cabecerasServicio()
    if (!url || !h) return null
    try {
        const [ra, rm] = await Promise.all([
            fetch(`${url}/storage/v1/object/${BUCKET_PARTES}/${ruta}.mp3`, {
                headers: h,
                signal: AbortSignal.timeout(4000),
            }),
            fetch(`${url}/storage/v1/object/${BUCKET_PARTES}/${ruta}.m`, {
                headers: h,
                signal: AbortSignal.timeout(4000),
            }),
        ])
        const marcas = rm.ok ? (await rm.text().catch(() => "")).trim() : ""
        if (!rm.ok) await rm.body?.cancel().catch(() => null)
        if (!ra.ok) {
            await ra.body?.cancel().catch(() => null)
            return null
        }
        const audio = new Uint8Array(await ra.arrayBuffer())
        return audio.length > 1000 ? { audio, marcas } : null
    } catch {
        return null
    }
}
async function subirAlBucket(
    bucket: string,
    ruta: string,
    cuerpo: Uint8Array<ArrayBuffer> | string,
    tipo: string
): Promise<boolean> {
    const url = Deno.env.get("SUPABASE_URL")
    const h = cabecerasServicio()
    if (!url || !h) return false
    const subir = () =>
        fetch(`${url}/storage/v1/object/${bucket}/${ruta}`, {
            method: "POST",
            headers: { ...h, "Content-Type": tipo, "x-upsert": "true" },
            body: cuerpo,
        })
    try {
        let r = await subir()
        if (!r.ok && (r.status === 400 || r.status === 404)) {
            await r.body?.cancel().catch(() => null)
            /* el bucket todavía no existe: se crea privado y se reintenta */
            await fetch(`${url}/storage/v1/bucket`, {
                method: "POST",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({ id: bucket, name: bucket, public: false }),
            })
                .then((x) => x.body?.cancel())
                .catch(() => null)
            r = await subir()
        }
        if (!r.ok) {
            console.warn(
                "[espejo-voz] la parte no se guardó:",
                r.status,
                (await r.text().catch(() => "")).slice(0, 160)
            )
            return false
        }
        await r.body?.cancel().catch(() => null)
        return true
    } catch (e) {
        console.warn("[espejo-voz] la parte no se guardó:", String(e).slice(0, 160))
        return false
    }
}
async function guardarParte(
    ruta: string,
    audio: Uint8Array<ArrayBuffer>,
    marcas: string
): Promise<void> {
    if (marcas && !(await subirAlBucket(BUCKET_PARTES, `${ruta}.m`, marcas, "text/plain")))
        return
    await subirAlBucket(BUCKET_PARTES, `${ruta}.mp3`, audio, "audio/mpeg")
}
/* Lo que sigue después de responder (guardar) no detiene la respuesta. */
function enSegundoPlano(p: Promise<unknown>): void {
    const er = (globalThis as any).EdgeRuntime
    if (er?.waitUntil) er.waitUntil(p)
    else void p
}

/* Gobernador de gasto compartido (misma RPC de la ola E / Parte 3-4).
   Fail-open a propósito: si la RPC no responde, la lectura sigue — nunca
   rompemos una función legítima por el gobernador. v1.3 devuelve también el
   MOTIVO del freno: agotar el carril freemium abre el muro de Sintonía
   (membership_required), no un simple "vuelve mañana". */
type Carril = "admin" | "miembro" | "free"

type Reserva = {
    ok: boolean
    reason?: string
    spent?: number
    limit?: number
    /* 🜂 v1.6 — QUÉ ventana se agotó. Sin esto el aviso decía "24 horas"
       siempre, y quien topara el tope MENSUAL leía "500 lecturas en 24 horas":
       falso y absurdo a la vez. */
    windowHours?: number
}

/** Una reserva contra una ventana concreta del gobernador. */
async function reservarVentana(
    edge: string,
    userKey: string | null,
    ip: string,
    costo: number,
    limite: number,
    ventana: number,
    globalLimit: number,
    /* v3.6 — la muestra sin sesión se frena por IP; el resto no la usa. */
    ipLimit = 0
): Promise<Reserva> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return { ok: true }
    try {
        const res = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_edge: edge,
                p_user_key: userKey,
                p_ip: ip,
                /* v1.5 — el costo es proporcional al texto (el parámetro
                   existía desde la ola E y nunca se había usado). */
                p_cost: costo,
                p_user_limit: limite,
                p_user_window_seconds: ventana,
                p_ip_limit: ipLimit,
                p_ip_window_seconds: DAY_SECONDS,
                p_global_limit: globalLimit,
                p_global_window_seconds: DAY_SECONDS,
            }),
        })
        if (!res.ok) return { ok: true }
        const j = await res.json().catch(() => null)
        if (j?.ok === false) {
            return {
                ok: false,
                reason: String(j?.reason || "limit"),
                spent: typeof j?.spent === "number" ? j.spent : undefined,
                limit: typeof j?.limit === "number" ? j.limit : limite,
                windowHours: Math.round(ventana / 3600),
            }
        }
        return { ok: true }
    } catch {
        return { ok: true }
    }
}

async function reserveSpend(
    userKey: string,
    ip: string,
    carril: Carril,
    costo: number
): Promise<Reserva> {
    const limite =
        carril === "admin"
            ? ADMIN_LIMIT_DAY
            : carril === "miembro"
              ? MEMBER_LIMIT_DAY
              : FREE_UNITS_LIFETIME
    const ventana = carril === "free" ? FREE_WINDOW_SECONDS : DAY_SECONDS
    /* 🜂 v1.6 — el MIEMBRO pasa por DOS ventanas: la del día (pico) y la del
       mes (costo). La mensual va primero; si la diaria la rechaza después, se
       devuelve la mensual para no cobrarle una unidad que nunca sonó.
       🜂 v3.12 — las dos se piden a la vez (cada ventana tiene su propio
       candado en la base, así que no se estorban) y la respuesta es la misma
       que en fila: si una rechaza, se devuelve la que sí se anotó, y manda el
       rechazo del mes. */
    const marca = new Date(Date.now() - 1500).toISOString()
    const diaPedido = reservarVentana(
        "espejo-voz",
        userKey,
        ip,
        costo,
        limite,
        ventana,
        GLOBAL_LIMIT_DAY
    )
    if (carril !== "miembro") return await diaPedido
    const [mes, dia] = await Promise.all([
        reservarVentana(
            "espejo-voz-mes",
            userKey,
            ip,
            costo,
            MEMBER_LIMIT_MONTH,
            MONTH_SECONDS,
            0 // el freno global vive en la ventana diaria; acá sería doble
        ),
        diaPedido,
    ])
    if (mes.ok && dia.ok) return dia
    if (mes.ok || dia.ok) await refundSpend(userKey, marca)
    return mes.ok ? dia : mes
}

/* 🜂 v1.4 — DEVOLVER EL CUPO cuando la lectura NO llegó a sonar.
   La reserva ocurre ANTES de llamar a Fish (así el control de concurrencia
   sirve de algo), pero cobrarla ante un 402 sin crédito, un 5xx o un audio
   vacío es cobrarle al Tripulante un error que no es suyo. El borrado se
   acota por user_key + edge + created_at >= el instante justo anterior a
   reservar: en esa ventana de milisegundos solo puede existir la fila propia.
   Best-effort y silencioso — si falla, el comportamiento es el de v1.3. */
async function refundSpend(userKey: string, desdeIso: string): Promise<void> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey || !userKey) return
    try {
        const r = await fetch(
            /* v1.6 — las DOS ventanas del miembro (día y mes) se devuelven
               juntas: si la lectura no sonó, ninguna de las dos se cobra. */
            `${supaUrl}/rest/v1/edge_spend_ledger` +
                `?edge=in.(espejo-voz,espejo-voz-mes)` +
                `&user_key=eq.${encodeURIComponent(userKey)}` +
                `&created_at=gte.${encodeURIComponent(desdeIso)}`,
            {
                method: "DELETE",
                headers: {
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                    Prefer: "return=minimal",
                },
            }
        )
        /* Si el borrado no pasa (grants de la tabla), queda dicho en los logs
           de la edge: sin esto el cupo se seguiría cobrando en silencio y
           nadie se enteraría hasta que alguien vuelva a topar el límite. */
        if (!r.ok) {
            console.error(
                "[espejo-voz] reembolso NO aplicado:",
                r.status,
                (await r.text().catch(() => "")).slice(0, 200)
            )
        }
    } catch (e) {
        console.error("[espejo-voz] reembolso falló:", String(e).slice(0, 200))
    }
}

/* 🜂 v3.13 — LA PUERTA EN UN SOLO VIAJE. `reservar_espejo_voz` (migración
   20261024d) hace en la base, en una sola llamada, lo que antes eran hasta
   seis: quién es (la señal de _shared/membresia.ts), los dos interruptores
   del Motor, si la parte ya está guardada en voz-partes y la reserva con los
   mismos candados y ventanas de reserve_edge_spend (las del miembro juntas;
   si una rechaza no se aparta ninguna). Los topes viajan desde aquí: la
   fuente de verdad sigue siendo este archivo. Devuelve null si la base no
   contestó o la función no existe todavía: entonces se toma el camino de
   antes, que conserva la falla cerrada de la membresía. */
type Pase = {
    carril: Carril
    /* null = la base no pudo mirar el almacén: se busca como antes. */
    guardada: boolean | null
    reserva: Reserva
    ids: string[]
    swap: boolean
    plana: boolean
}
const TIEMPO_PASE_MS = 8000
async function pedirPase(
    userKey: string,
    ip: string,
    costo: number,
    ruta: string
): Promise<Pase | null> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return null
    try {
        const res = await fetch(`${supaUrl}/rest/v1/rpc/reservar_espejo_voz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_user_key: userKey,
                p_ip: ip,
                p_cost: costo,
                p_ruta: ruta,
                p_flag_swap: FLAG_SWAP,
                p_flag_plana: FLAG_PLANA,
                p_limite_admin: ADMIN_LIMIT_DAY,
                p_limite_dia: MEMBER_LIMIT_DAY,
                p_limite_mes: MEMBER_LIMIT_MONTH,
                p_limite_libre: FREE_UNITS_LIFETIME,
                p_limite_global: GLOBAL_LIMIT_DAY,
                p_ventana_dia: DAY_SECONDS,
                p_ventana_mes: MONTH_SECONDS,
                p_ventana_libre: FREE_WINDOW_SECONDS,
            }),
            signal: AbortSignal.timeout(TIEMPO_PASE_MS),
        })
        if (!res.ok) {
            console.warn(
                "[espejo-voz] la puerta en un viaje no contestó; va el camino de antes:",
                res.status,
                (await res.text().catch(() => "")).slice(0, 160)
            )
            return null
        }
        const j = await res.json().catch(() => null)
        const carril = j?.carril
        if (carril !== "admin" && carril !== "miembro" && carril !== "free") return null
        const horas = Math.round(Number(j.ventana) / 3600)
        return {
            carril,
            guardada: j.guardada === true ? true : j.guardada === false ? false : null,
            reserva:
                j.ok === true
                    ? { ok: true }
                    : {
                          ok: false,
                          reason: String(j.reason || "limit"),
                          spent: typeof j.spent === "number" ? j.spent : undefined,
                          limit: typeof j.limit === "number" ? j.limit : undefined,
                          windowHours: Number.isFinite(horas) ? horas : undefined,
                      },
            ids: Array.isArray(j.ids) ? j.ids.map((x: unknown) => String(x)) : [],
            swap: j.swap === true,
            plana: j.plana === true,
        }
    } catch (e) {
        console.warn(
            "[espejo-voz] la puerta en un viaje falló; va el camino de antes:",
            String(e).slice(0, 160)
        )
        return null
    }
}

/* 🜂 v3.13 — DEVOLVER EXACTO: se borran las filas que apartó este pedido, por
   su id. El reembolso por ventana de tiempo (refundSpend) también se llevaba
   la fila de otra parte de la misma persona apartada en ese lapso, y con la
   espera del cupo de Soniox el lapso podía durar un minuto. */
async function devolverReserva(userKey: string, ids: string[]): Promise<void> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey || !userKey || !ids.length) return
    try {
        const r = await fetch(
            `${supaUrl}/rest/v1/edge_spend_ledger` +
                `?id=in.(${ids.map((x) => encodeURIComponent(x)).join(",")})` +
                `&user_key=eq.${encodeURIComponent(userKey)}`,
            {
                method: "DELETE",
                headers: {
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                    Prefer: "return=minimal",
                },
            }
        )
        if (!r.ok) {
            console.error(
                "[espejo-voz] reembolso NO aplicado:",
                r.status,
                (await r.text().catch(() => "")).slice(0, 200)
            )
        }
    } catch (e) {
        console.error("[espejo-voz] reembolso falló:", String(e).slice(0, 200))
    }
}

/* Membresía server-side — señal CANÓNICA del Espejo (misma de oraculo-chat):
   cualquier subscripción activa que NO sea un tier de decodificador (199
   'decoder' / 399 'dream') es membresía plena.
   🜂 v3.6 — FALLA CERRADA (auditoría 2026-10-18). Antes, si la base no
   contestaba, cualquiera leía como miembro. Ahora la señal vive en
   _shared/membresia.ts (un reintento incluido) y la duda vuelve como
   "desconocido": la lectura no se cobra ni como miembro ni como invitado
   (eso último le levantaría el muro a quien sí paga); se responde 503 con la
   frase legible y la persona vuelve a tocar Escuchar. */
async function resolverCarril(
    clerkUserId: string
): Promise<Carril | "desconocido"> {
    return (await resolverMembresia(clerkUserId)).carril
}

/* ── Los interruptores del Motor, con cache corto ─────────────────────────
   La instancia de la edge se reutiliza entre llamadas, así que 60s de cache
   dejan el flip casi inmediato (lo que tarda una lectura o dos) sin pagar
   dos viajes a la base por cada vez que alguien toca "Escuchar".
   Fail-open al DEFAULT (voz principal tal cual + actuación encendida): si la
   base no contesta, la voz suena igual — nunca se rompe por un flag. */
let flagsCache: { t: number; swap: boolean; plana: boolean } | null = null
const FLAGS_TTL_MS = 60_000

async function leerFlags(): Promise<{ swap: boolean; plana: boolean }> {
    const ahora = Date.now()
    if (flagsCache && ahora - flagsCache.t < FLAGS_TTL_MS) {
        return { swap: flagsCache.swap, plana: flagsCache.plana }
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const porDefecto = { swap: false, plana: false }
    if (!supaUrl || !supaKey) return porDefecto
    const pedir = async (key: string): Promise<boolean> => {
        try {
            const res = await fetch(`${supaUrl}/rest/v1/rpc/get_app_flag`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supaKey,
                    Authorization: `Bearer ${supaKey}`,
                },
                body: JSON.stringify({ p_key: key }),
            })
            if (!res.ok) return false
            return (await res.json().catch(() => false)) === true
        } catch {
            return false
        }
    }
    try {
        const [swap, plana] = await Promise.all([
            pedir(FLAG_SWAP),
            pedir(FLAG_PLANA),
        ])
        flagsCache = { t: ahora, swap, plana }
        return { swap, plana }
    } catch {
        return porDefecto
    }
}

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

/* El Espejo responde en markdown ligero (encabezados, negritas, separadores).
   Leído en voz alta, eso son asteriscos y gatos sueltos. Se limpia acá para
   que la voz reciba prosa, no marcas. También caen los marcadores ⟦IMG⟧ que
   la lectura de una imagen deja incrustados en el mensaje. */
/* 🜂 v3.8 — LA LIMPIEZA SE REPITE HASTA QUEDAR ESTABLE. La app manda el
   texto ya limpio y aquí se limpia otra vez; si una pasada deja algo que la
   siguiente todavía cambia, la parte que lee la voz y la que cuenta la app
   dejan de ser la misma y cada marca cae corrida. Medido con 20 reflejos
   reales de la Mac de Zak: en 1 de 101 partes un «Título:» seguido de
   párrafo se fundía recién en la segunda pasada. Dos o tres pasadas bastan
   siempre; el espejo de la app (src/lib/vozLimpieza.ts) hace lo mismo. */
function limpiarParaVoz(raw: string): string {
    let t = limpiarUnaVez(raw)
    for (let k = 0; k < 3; k++) {
        const otra = limpiarUnaVez(t)
        if (otra === t) break
        t = otra
    }
    return t
}

function limpiarUnaVez(raw: string): string {
    return (
        (raw || "")
            /* 🜂 v1.8 — PRIMERO los caracteres INVISIBLES (word joiner,
               zero-width, BOM, guion suave). El Espejo los incrusta en sus
               viñetas ("•⁠  ⁠texto" trae U+2060 adentro) y, además de que un
               modelo de voz "pronuncia" lo que no entiende, ROMPEN los
               regexes de más abajo: \s no los matchea, así que la viñeta
               nunca se reconocía como viñeta. Medido con los dos reflejos
               reales de Zak (2026-08-05): 10 invisibles + 5 viñetas + 3
               flechas sobrevivían a la limpieza de v1.7. */
            .replace(/[​-‍⁠﻿­]/g, "")
            .replace(/⟦IMG⟧[\s\S]*?⟦\/IMG⟧/g, " ")
            /* v1.9 — los marcadores de imagen generada (Espejo ilustrado)
               tampoco se leen: la voz jamás anuncia sus imágenes. */
            .replace(/⟦GEN:[\s\S]*?⟧/g, " ")
            /* 🜂 Un enlace de markdown deja corchetes sueltos, y para S2.1 un
           corchete ES una dirección de actuación: "[Ver aquí](http://…)"
           se convertiría en la orden "ver aquí" y además leería la URL en voz
           alta. Se reduce al texto visible ANTES que nada. El resto de los
           corchetes se respeta a propósito (son el canal de la actuación). */
            .replace(/\[([^\]]{1,120})\]\((?:https?:)?\/\/[^\s)]+\)/g, "$1")
            .replace(/^\s{0,3}#{1,6}\s+/gm, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            /* v1.8 — asteriscos HUÉRFANOS: el Espejo a veces anida mal el
               énfasis ("**...*" sin cierre) y el sobreviviente llegaba crudo
               a la voz. Después de resolver los pares, ninguno tiene motivo
               de existir. */
            .replace(/\*/g, "")
            .replace(/^\s*[-–—*]{3,}\s*$/gm, "")
            /* v1.8 — viñetas: entra • (U+2022, la que usa el Espejo) y sus
               parientes; el espaciado posterior es opcional porque tras
               quitar los invisibles puede quedar pegada al texto. */
            .replace(/^\s*[-*·•▪●◦‣]\s*/gm, "")
            /* v1.8 — flechas de flujo ("genero → extraigo → mando"): leídas
               no existen; como coma la frase fluye natural. */
            .replace(/\s*[→←⇒⇐↔⟶]\s*/g, ", ")
            /* 🜂 v1.9 — LOS TITULARES ANUNCIADOS ERAN EL "MHH" (Zak, con el
               reflejo real en la mano: los zumbidos caen EXACTAMENTE donde el
               texto traía "**Titular**:" — y donde varios venían seguidos,
               varios MHH seguidos). Tras quitar las negritas quedaba un
               renglón-titular que TERMINA EN DOS PUNTOS seguido de línea en
               blanco ("Lo que viene, según…:") — para un modelo expresivo
               eso es un ANUNCIO con aire de expectativa, y S2.1 lo actúa
               como duda hablada (el clásico "mmm" de quien va a enumerar).
               Además el segmentador podía abrir una parte justo en ese
               renglón huérfano. Se convierte el anuncio en oración normal y
               se FUNDE con su párrafo: "Titular. Cuerpo…" — cero pausa de
               expectativa, cero renglón huérfano, mismas palabras. */
            .replace(/:\s*\n{2,}(?=\S)/g, ". ")
            .replace(/^([^\n]{2,80}):\s*$/gm, "$1.")
            /* ── v1.7 · lo que queda después del markdown y NO es prosa ──
               Restos que un lector humano interpreta de un vistazo y un modelo
               de voz tiene que "adivinar" cómo pronunciar. Medido sobre un
               reflejo real: tras limpiar el markdown sobrevivían `~`, `—` y
               guiones de rango. Se traducen a palabras o a puntuación que la
               voz sí sabe decir. */
            .replace(/(^|[\s(])~\s?(?=\d)/g, "$1alrededor de ")
            .replace(/\b(\d{4})\s?[-–—]\s?(\d{4})\b/g, "$1 a $2")
            .replace(/\b(\d+)\s?[-–—]\s?(\d+)\b/g, "$1 a $2")
            .replace(/\s+[–—]\s+/g, ", ")
            .replace(/[–—]/g, ", ")
            .replace(/[«»""'']/g, "")
            /* 🜂 GUARDIÁN DE DIRECCIONES: para S2.1 un corchete ES una orden de
               actuación. Los que pone el director (tags CORE) se respetan;
               cualquier otro corchete que venga del reflejo se descarta —
               un tag que el modelo no entiende puede salir RECITADO o como
               ruido, que es exactamente lo que Zak escuchó. */
            .replace(/\[([^\]\n]{0,40})\]/g, (todo, dentro) =>
                TAGS_CORE.has(String(dentro).trim().toLowerCase()) ? todo : ""
            )
            .replace(/[ \t]+/g, " ")
            .replace(/ ,/g, ",")
            .replace(/,{2,}/g, ",")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
    )
}

/* ── EL DIRECTOR DE VOZ ───────────────────────────────────────────────────
   Convierte prosa neutra en una lectura ACTUADA. Antepone la directiva base
   (que S2.1 sostiene toda la lectura) y marca acentos puntuales con los tags
   CORE documentados, sin pasarse: como máximo MAX_ACENTOS, y solo donde el
   texto da una señal clara.

   Deliberadamente determinista y local: cero llamadas extra, cero costo, cero
   latencia. Un "director" con modelo de lenguaje daría más matiz pero cobraría
   por cada lectura y sumaría un segundo de espera antes de que suene la voz.

   Reglas de acento:
     · Párrafo con signos de exclamación → [excited]
     · Último párrafo, si es corto → [emphasis] (la frase que remata)
   Un párrafo que ya trae su propio corchete al inicio se respeta tal cual: si
   algún día el Espejo escribe sus propias direcciones, mandan las suyas.

   🜂 UN TAG MANDA HASTA EL SIGUIENTE TAG, no vuelve solo al registro base.
   Por eso, cuando un acento cae a media lectura, el párrafo siguiente RE-DECLARA
   la directiva base: sin eso, un solo [excited] dejaría exaltada toda la
   segunda mitad del reflejo. El acento de cierre no necesita retorno (ya no
   queda texto), que es justo el caso común y el que no cuesta bytes de más. */
function dirigirVoz(
    texto: string,
    directiva: string,
    /* v1.5 — con lectura por partes, el acento de CIERRE solo corresponde al
       final REAL del reflejo: marcar el remate al final de cada trozo sonaría
       como si el Espejo concluyera tres veces. */
    esFinal = true
): string {
    const parrafos = texto
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    if (!parrafos.length) return texto

    /* v1.7 — la marca base solo sale si es un tag CORE documentado. Una frase
       libre puede terminar RECITADA en voz alta (ver DEFAULT_DIRECTIVE). */
    const pedida = directiva.trim().toLowerCase()
    const base = TAGS_CORE.has(pedida) ? pedida : ""
    const marcaBase = base ? `[${base}] ` : ""
    let acentos = 0
    let retomarBase = false

    const dirigidos = parrafos.map((p, i) => {
        const prefijoRetorno = retomarBase ? marcaBase : ""
        retomarBase = false
        if (p.startsWith("[")) return prefijoRetorno + p // trae dirección propia
        if (acentos >= MAX_ACENTOS) return prefijoRetorno + p

        const esUltimo = i === parrafos.length - 1
        let tag: string | null = null
        if (/[!¡]/.test(p)) tag = TAG_ENERGIA
        else if (esFinal && esUltimo && i > 0 && p.length <= 140)
            tag = TAG_CIERRE
        if (!tag) return prefijoRetorno + p

        acentos++
        if (!esUltimo) retomarBase = true
        return `[${tag}] ${p}`
    })

    /* La directiva base abre la lectura. Si el primer párrafo ya se llevó su
       propio acento, ese acento manda ahí y la base entra en el siguiente
       (por el retorno de arriba). */
    const cuerpo = dirigidos.join("\n\n")
    return dirigidos[0]?.startsWith("[") ? cuerpo : marcaBase + cuerpo
}

/* ── v1.5 · SEGMENTADOR ───────────────────────────────────────────────────
   Parte el reflejo en trozos de ~SEG_CHARS SIN cortar a media idea: primero
   por párrafo (la unidad natural del Espejo) y, si un párrafo solo ya excede,
   por frontera de oración. Un corte a media frase se oiría como un tropiezo,
   que es exactamente lo que la lectura por partes viene a evitar. */
function segmentar(
    texto: string,
    maxChars: number,
    /* 🜂 v3.9 — con arranque, la escalera de arriba (ESPEJO EXACTO de
       segmentarEspejo del cliente); sin él, el corte de siempre. 🜂 v3.11 —
       "escalera", la escalera por colchón. */
    corte: CorteVoz = "tienda"
): string[] {
    const tope = (trozos: string[]) => {
        if (corte === "tienda") return maxChars
        if (trozos.length === 0) return ARRANQUE_PRIMERA
        const n = trozos.length
        if (corte === "escalera") {
            const atras = (k: number) => trozos[n - k].length
            if (n === 1) return Math.min(maxChars, Math.floor(ESCALERA_K1 * atras(1)))
            if (n === 2)
                return Math.min(maxChars, Math.floor(ESCALERA_K2 * (atras(1) + atras(2))))
            return Math.min(
                maxChars,
                Math.floor(ESCALERA_K3 * (atras(1) + atras(2) + atras(3)))
            )
        }
        if (n === 1)
            return Math.min(maxChars, Math.floor(ARRANQUE_K1 * trozos[0].length))
        if (n === 2)
            return Math.min(
                maxChars,
                Math.floor(ARRANQUE_K2 * (trozos[0].length + trozos[1].length))
            )
        return maxChars
    }
    const minimo = (trozos: string[]) =>
        corte === "tienda"
            ? 0
            : trozos.length === 0
              ? ARRANQUE_MINIMO
              : corte === "escalera"
                ? ESCALERA_MINIMO
                : 0
    if (texto.length <= tope([])) return [texto]

    const trozos: string[] = []
    let actual = ""
    const empujar = () => {
        const t = actual.trim()
        if (t) trozos.push(t)
        actual = ""
    }

    for (const parrafo of texto.split(/\n{2,}/)) {
        const p = parrafo.trim()
        if (!p) continue
        /* Cabe entero: se suma a la parte. */
        if (actual.length + (actual ? 2 : 0) + p.length <= tope(trozos)) {
            actual += (actual ? "\n\n" : "") + p
            continue
        }
        /* No cabe. Si lo que llevo no llega al mínimo (un titular solo), el
           párrafo se parte en frases y sigue llenando; si no, lo que llevo se
           cierra. Un párrafo que solo ya rebasa el tope también se parte por
           oraciones (el punto de cierre se conserva con su frase). */
        const falta = actual.length < minimo(trozos)
        if (!falta) empujar()
        if (falta || p.length > tope(trozos)) {
            const frases = p.match(/[^.!?…]+[.!?…]+[\s]*|[^.!?…]+$/g) || [p]
            let sep = actual ? "\n\n" : ""
            for (const f of frases) {
                if (
                    actual &&
                    actual.length + sep.length + f.length > tope(trozos) &&
                    actual.length >= minimo(trozos)
                )
                    empujar()
                actual += (actual ? sep : "") + f
                sep = ""
            }
            /* v3.11 — en la escalera, lo que sobra del párrafo queda abierto. */
            if (corte !== "escalera") empujar()
            continue
        }
        actual = p
    }
    empujar()
    return trozos.length ? trozos : [texto]
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const FISH_KEY = Deno.env.get("FISH_AUDIO_API_KEY")
    /* 🜂 v3.0 — sin esta llave el carril de Soniox no existe y TODO cae a
       Fish: la migración no puede dejar la app muda si el secreto falta. */
    const SONIOX_KEY = Deno.env.get("SONIOX_API_KEY") || ""
    const ipPedido =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        ""

    /* 🜂 v3.6 — EL PASE DE LAS SONDAS. `marcas` y `voces` sintetizan de verdad
       (cuestan dinero) y nacieron sin token para el device-QA. Ahora piden la
       sesión del Arquitecto y pasan por su propia ventana del gobernador.
       Devuelve la respuesta de rechazo, o null si la sonda puede correr. */
    const pasarSonda = async (b: any): Promise<Response | null> => {
        const g = await gateUser(b?.token)
        if (!g.ok)
            return jsonResponse(g.status ?? 401, {
                error: g.error || "auth_required",
            })
        const carrilSonda = await resolverCarril(g.userId!)
        if (carrilSonda !== "admin")
            return jsonResponse(403, { error: "not_admin" })
        const res = await reservarVentana(
            "espejo-voz-sonda",
            g.userId!,
            ipPedido,
            1,
            SONDA_POR_DIA,
            DAY_SECONDS,
            SONDA_GLOBAL_DIA
        )
        if (!res.ok) return jsonResponse(429, { error: "rate_limited" })
        return null
    }

    /* 🜂 v3.2 — SONDA DE MARCAS. `{ modo: "marcas" }` sintetiza una frase
       conocida por WebSocket y devuelve los números, no el audio: sirve para
       comprobar que los tiempos por carácter son REALES y monótonos antes de
       colgar de ellos la palabra dorada. 🜂 v3.6 — con el pase del Arquitecto
       (pasarSonda): ya no corre sin token ni sin tope. */
    {
        const b = await req.clone().json().catch(() => ({}))
        if (String(b?.modo || "") === "marcas") {
            const rechazo = await pasarSonda(b)
            if (rechazo) return rechazo
            if (!SONIOX_KEY) return jsonResponse(503, { error: "sin_llave" })
            const id = String(b?.voice_id || VOZ_POR_DEFECTO).toLowerCase()
            const c = VOCES[id]
            if (!c || c.proveedor !== "soniox")
                return jsonResponse(400, { error: "voz_sin_marcas", id })
            const t0 = Date.now()
            const r = await sintetizarConMarcas(
                SONIOX_KEY,
                SONIOX_MODEL,
                c.voz,
                "es",
                MUESTRA_ES,
                c.speed
            )
            if (!r) return jsonResponse(502, { error: "canal_fallo" })
            const ts = r.tiempos
            let monotono = true
            for (let i = 1; i < ts.length; i++)
                if (ts[i] < ts[i - 1]) monotono = false
            return jsonResponse(200, {
                voz: c.voz,
                ms: Date.now() - t0,
                caracteres_texto: MUESTRA_ES.length,
                caracteres_marcados: ts.length,
                audio_bytes: r.audio.length,
                monotono,
                primero: ts[0],
                ultimo: ts[ts.length - 1],
                compacto_bytes: marcasCompactas(ts).length,
                muestra_10: ts.slice(0, 10),
            })
        }
    }

    /* 🜂 v3.1 — MUESTRA DE VOZ. `{ modo: "muestra", voice_id }` devuelve ocho
       segundos de audio con esa voz, sin token, sin cobro y sin tocar el cupo
       de nadie: es la tarjeta de selección, no una lectura. El texto es fijo
       y vive acá, así que nadie puede usar este camino para sintetizar lo que
       quiera gratis — que es exactamente el riesgo de abrir una puerta sin
       pase. */
    {
        const b = await req.clone().json().catch(() => ({}))
        if (String(b?.modo || "") === "muestra") {
            const id0 = String(b?.voice_id || "").trim().toLowerCase()
            const id = ALIAS_VOZ[id0] || id0
            const c = VOCES[id]
            const idioma = String(b?.lang || "es").slice(0, 2) === "en" ? "en" : "es"
            const frase = idioma === "en" ? MUESTRA_EN : MUESTRA_ES
            if (!c) return jsonResponse(400, { error: "voz_desconocida", id })
            /* 🜂 v3.6 — LA MUESTRA SALE DE LA COPIA GUARDADA. La frase es fija,
               así que el audio de cada voz e idioma es siempre el mismo: se
               sintetiza una vez y después se sirve gratis. La app publicada la
               pide sin token (exigirlo dejaría muda la tarjeta de voces), así
               que lo que cuesta, la síntesis nueva, pasa por su tope: por
               persona si trae sesión, por IP y en toda la app. */
            const porSoniox = c.proveedor === "soniox" && !!SONIOX_KEY
            const claveMuestra = `${id}|${idioma}|${porSoniox ? "soniox" : "fish"}`
            const guardada = MUESTRAS.get(claveMuestra)
            if (guardada)
                return new Response(guardada.audio, {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        ...guardada.headers,
                        "X-RSV-Muestra": "guardada",
                    },
                })
            const rutaMuestra = porSoniox
                ? `${idioma}/${id}-soniox-${c.voz.toLowerCase()}-${c.speed ?? 1}-${frase.length}.mp3`
                : `${idioma}/${id}-fish-${(Deno.env.get("FISH_VOICE_ID") || "base").slice(-6)}-${frase.length}.mp3`
            const delAlmacen = await leerMuestraGuardada(rutaMuestra)
            if (delAlmacen) {
                const hs: Record<string, string> = {
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "public, max-age=86400",
                    "X-RSV-Proveedor": porSoniox ? "soniox" : "fish",
                    ...(porSoniox ? { "X-RSV-Voz-Nombre": c.voz } : {}),
                }
                MUESTRAS.set(claveMuestra, { audio: delAlmacen, headers: hs })
                return new Response(delAlmacen, {
                    status: 200,
                    headers: { ...CORS_HEADERS, ...hs, "X-RSV-Muestra": "guardada" },
                })
            }
            let quienPide: string | null = null
            if (b?.token) {
                const g = await gateUser(b.token)
                if (g.ok) quienPide = g.userId!
            }
            const cupoMuestra = await reservarVentana(
                "espejo-voz-muestra",
                quienPide,
                ipPedido,
                1,
                quienPide ? MUESTRA_POR_DIA : 0,
                DAY_SECONDS,
                MUESTRA_GLOBAL_DIA,
                MUESTRA_POR_DIA
            )
            if (!cupoMuestra.ok)
                return jsonResponse(429, {
                    error: "rate_limited",
                    detalle:
                        idioma === "en"
                            ? "Too many voice samples today. Try again later"
                            : "Ya se escucharon muchas muestras hoy. Intenta más tarde",
                })
            if (!porSoniox) {
                /* Goku vive en Fish: su muestra sale por el mismo camino de
                   siempre, con la voz que el secreto tenga puesta. */
                if (!FISH_KEY)
                    return jsonResponse(503, { error: "sin_proveedor" })
                const rf = await fetch(FISH_TTS_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${FISH_KEY}`,
                        "Content-Type": "application/json",
                        model: Deno.env.get("FISH_MODEL") || "s2.1-pro",
                    },
                    body: JSON.stringify({
                        text: frase,
                        ...(Deno.env.get("FISH_VOICE_ID")
                            ? { reference_id: Deno.env.get("FISH_VOICE_ID") }
                            : {}),
                        format: "mp3",
                        mp3_bitrate: 64,
                        normalize: true,
                        latency: "normal",
                    }),
                })
                if (!rf.ok)
                    return jsonResponse(502, {
                        error: "muestra_fallo",
                        status: rf.status,
                        detalle: (await rf.text().catch(() => "")).slice(0, 200),
                    })
                const audioFish = new Uint8Array(await rf.arrayBuffer())
                const headersFish = {
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "public, max-age=86400",
                    "X-RSV-Proveedor": "fish",
                }
                if (audioFish.length) {
                    MUESTRAS.set(claveMuestra, {
                        audio: audioFish,
                        headers: headersFish,
                    })
                    await guardarMuestra(rutaMuestra, audioFish)
                }
                return new Response(audioFish, {
                    status: 200,
                    headers: { ...CORS_HEADERS, ...headersFish },
                })
            }
            const rs = await fetch(SONIOX_TTS_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${SONIOX_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: SONIOX_MODEL,
                    language: idioma,
                    voice: c.voz,
                    audio_format: "mp3",
                    text: frase,
                    bitrate: 64000,
                    ...(c.speed ? { speed: c.speed } : {}),
                }),
            })
            if (!rs.ok)
                return jsonResponse(502, {
                    error: "muestra_fallo",
                    status: rs.status,
                    detalle: (await rs.text().catch(() => "")).slice(0, 200),
                })
            const audioSoniox = new Uint8Array(await rs.arrayBuffer())
            const headersSoniox = {
                "Content-Type": "audio/mpeg",
                /* La muestra es idéntica siempre: que el navegador la
                   guarde un día evita pagarla en cada apertura. */
                "Cache-Control": "public, max-age=86400",
                "X-RSV-Proveedor": "soniox",
                "X-RSV-Voz-Nombre": c.voz,
            }
            if (audioSoniox.length) {
                MUESTRAS.set(claveMuestra, {
                    audio: audioSoniox,
                    headers: headersSoniox,
                })
                await guardarMuestra(rutaMuestra, audioSoniox)
            }
            return new Response(audioSoniox, {
                status: 200,
                headers: { ...CORS_HEADERS, ...headersSoniox },
            })
        }
    }

    /* 🜂 v3.0 — SONDA DE CATÁLOGO. `{ modo: "voces" }` devuelve lo que el
       proveedor dice que existe, para confirmar los nombres exactos sin
       sacar la llave del servidor. 🜂 v3.6 — sí sintetiza una frase corta por
       voz (la prueba de abajo), así que también pide el pase del Arquitecto. */
    const cuerpoVoces = await req.clone().json().catch(() => ({}))
    if (String(cuerpoVoces?.modo || "") === "voces") {
        const rechazo = await pasarSonda(cuerpoVoces)
        if (rechazo) return rechazo
        if (!SONIOX_KEY)
            return jsonResponse(200, { catalogo: VOCES, soniox: "sin_llave" })
        try {
            /* Los dos hosts que Soniox documenta: el de síntesis y el de
               administración. El catálogo vive en uno de ellos y no está
               claro en cuál, así que se prueban los dos y gana el que
               conteste — barato y evita una sala entera de adivinanzas. */
            const hosts = [
                "https://api.soniox.com/v1/tts-models",
                "https://tts-rt.soniox.com/v1/tts-models",
            ]
            const salidas: any[] = []
            for (const h of hosts) {
                const rv = await fetch(h, {
                    headers: { Authorization: `Bearer ${SONIOX_KEY}` },
                })
                const cuerpo = await rv.text()
                /* Solo los IDENTIFICADORES: las descripciones de cada voz son
                   párrafos enteros y recortar el cuerpo hacía que una voz
                   ausente y una voz cortada se vieran igual. */
                let ids: any = null
                try {
                    const j = JSON.parse(cuerpo)
                    ids = (j.models || []).map((m: any) => ({
                        modelo: m.id,
                        voces: (m.voices || []).map((v: any) => v.id),
                    }))
                } catch {}
                salidas.push({
                    host: h,
                    status: rv.status,
                    ...(ids ? { modelos: ids } : { cuerpo: cuerpo.slice(0, 600) }),
                })
                if (rv.ok) break
            }
            /* Y una síntesis MINÚSCULA por cada voz del catálogo: que el
               nombre exista en la lista no prueba que sintetice con nuestra
               llave, nuestro modelo y nuestro idioma. Tres palabras cuestan
               una fracción de centavo y convierten "desplegado" en "suena". */
            const prueba: any[] = []
            for (const [id, c] of Object.entries(VOCES)) {
                if (c.proveedor !== "soniox") continue
                const rp = await fetch(SONIOX_TTS_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SONIOX_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: SONIOX_MODEL,
                        language: "es",
                        voice: c.voz,
                        audio_format: "mp3",
                        text: "Prueba de voz.",
                        bitrate: 64000,
                        ...(c.speed ? { speed: c.speed } : {}),
                    }),
                })
                const bytes = rp.ok
                    ? (await rp.arrayBuffer()).byteLength
                    : 0
                prueba.push({
                    id,
                    voz: c.voz,
                    speed: c.speed,
                    status: rp.status,
                    bytes,
                    ...(rp.ok ? {} : { detalle: (await rp.text().catch(() => "")).slice(0, 200) }),
                })
            }
            return jsonResponse(200, { catalogo: VOCES, intentos: salidas, prueba })
        } catch (e: any) {
            return jsonResponse(200, {
                catalogo: VOCES,
                soniox: `error: ${String(e?.message ?? e).slice(0, 200)}`,
            })
        }
    }
    const FISH_VOICE_ID = Deno.env.get("FISH_VOICE_ID") || ""
    /* Voz de RESPALDO (Zak eligió una alternativa en el piloto): si la voz
       principal falla por algo suyo (modelo retirado de la biblioteca, id
       inválido), se reintenta con esta antes de darse por vencido. Un fallo
       de LLAVE o de SALDO no se reintenta: sería quemar dos llamadas para el
       mismo error. */
    const FISH_VOICE_FALLBACK = Deno.env.get("FISH_VOICE_FALLBACK_ID") || ""
    const FISH_MODEL = Deno.env.get("FISH_MODEL") || DEFAULT_MODEL
    if (!FISH_KEY) {
        return jsonResponse(500, {
            error: "missing_secrets",
            missing: ["FISH_AUDIO_API_KEY"],
        })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    /* Sesión de Clerk verificada server-side (el id sale del token, no del
       cuerpo) — mismo gate que el resto de las superficies de usuario. */
    const g = await gateUser(body?.token)
    if (!g.ok) return jsonResponse(g.status ?? 401, { error: g.error })
    const clerkUserId = g.userId!

    const text = limpiarParaVoz(String(body?.text ?? ""))
    if (!text) return jsonResponse(400, { error: "missing_text" })
    if (text.length > MAX_CHARS) {
        return jsonResponse(413, {
            error: "text_too_long",
            detail: `${text.length} caracteres; el tope es ${MAX_CHARS}.`,
        })
    }

    /* 🜂 v3.12 — los dos interruptores del Motor (voces y matiz) ya no se leen
       aquí: con Soniox solo pintan dos cabeceras, así que se piden mientras la
       voz se sintetiza (o al servir una parte guardada) y no detienen la
       lectura. */

    /* 🜂 v3.0 — `voice_id` ahora es una LLAVE DEL CATÁLOGO (bennett · owen ·
       cordelia · margo · goku), no un identificador de proveedor. Lo que
       llegue fuera del catálogo cae a la voz por defecto en vez de viajar
       crudo: así una app vieja o un valor raro nunca produce un 4xx mudo.

       Compatibilidad: las builds anteriores mandan reference_id de Fish
       (cadenas largas de hex). Si no está en el catálogo pero PARECE un
       reference_id, se respeta y va por Fish como siempre — una build vieja
       en el teléfono de alguien tiene que seguir sonando. */
    /* 🜂 v3.0 — el idioma YA venía en el cuerpo (el cliente lo manda desde
       siempre) y acá nadie lo leía: a Fish no le hacía falta porque lo
       deduce del texto, pero Soniox lo pide explícito y con razón, porque el
       mismo texto se pronuncia distinto en cada lengua. */
    const lang = String(body?.lang ?? "es").trim().toLowerCase().slice(0, 2)
    const vozCruda = String(body?.voice_id ?? "")
        .trim()
        .toLowerCase()
    const vozPedida = ALIAS_VOZ[vozCruda] || vozCruda
    /* 🜂 v3.10 — un reference_id de Fish (builds antiguas: era el clon de Goku) ya no viaja a Fish: Bennett. */
    const cat: VozCat = VOCES[vozPedida] ? VOCES[vozPedida] : VOCES[VOZ_POR_DEFECTO]
    const usaSoniox = cat.proveedor === "soniox" && !!SONIOX_KEY
    const model = String(body?.model ?? "").trim() || FISH_MODEL

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        ""
    /* ── v1.5 · LECTURA POR PARTES ────────────────────────────────────────
       Sin `part` en el cuerpo se sintetiza el texto COMPLETO (el build ya
       publicado sigue funcionando igual). Con `part` se devuelve solo ese
       trozo + el header X-RSV-Partes, para que el cliente nuevo empiece a
       sonar en segundos y precargue el resto mientras reproduce. */
    /* 🜂 v3.11 — `escalera` manda sobre `arranque` (la app desde espejoVozFish
       v2.35 manda las dos); sin ninguna, el corte de las versiones de tienda. */
    const partes = segmentar(
        text,
        SEG_CHARS,
        body?.escalera === true ? "escalera" : body?.arranque === true ? "arranque" : "tienda"
    )
    const pedida = Number(body?.part)
    const usaPartes = Number.isInteger(pedida) && pedida >= 0
    if (usaPartes && pedida >= partes.length) {
        return jsonResponse(400, {
            error: "part_out_of_range",
            partes: partes.length,
        })
    }
    const esUltimaParte = !usaPartes || pedida === partes.length - 1
    const textoParte = usaPartes ? partes[pedida] : text

    /* v1.6 — carril: admin 600 u/día · miembro 60 u/día + 500 u/mes · freemium
       8 u de por vida, donde 1 unidad ≈ 1.000 caracteres. Al agotar el carril
       freemium la respuesta es el MURO (403), no un 429: el cliente abre el
       selector de Sintonía. El freno global sigue siendo 429 para todos (no es
       culpa de la persona).
       🜂 v3.12 — la membresía y la parte guardada no dependen una de la otra:
       se piden a la vez (medido el 2026-10-24: en fila sumaban de 0.5 a 1.4 s
       antes de sintetizar).
       🜂 v3.13 — y ahora van, con la reserva y los interruptores, en un solo
       viaje (pedirPase). */

    /* 🜂 v3.9 — ¿esta parte ya se sintetizó? Se sirve guardada, al instante
       y sin cobrar (solo las voces de Soniox: lo de Fish es el respaldo y no
       se guarda bajo la voz pedida). */
    const rutaParte = usaSoniox
        ? `${String(cat.voz).toLowerCase().replace(/[^a-z0-9-]/g, "") || "voz"}/${await huellaParte(
              {
                  v: 1,
                  modelo: SONIOX_MODEL,
                  voz: cat.voz,
                  lang: lang === "en" ? "en" : "es",
                  speed: cat.speed ?? null,
                  texto: textoParte,
              }
          )}`
        : ""
    const costo = unidades(textoParte.length)
    const respuestaGuardada = (
        guardada: { audio: Uint8Array<ArrayBuffer>; marcas: string },
        plana: boolean
    ): Response => {
        const conMarcas = body?.marcas_v2 === true && !!guardada.marcas
        return new Response(guardada.audio, {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                ...(conMarcas
                    ? {
                          "Access-Control-Expose-Headers": `${CORS_HEADERS["Access-Control-Expose-Headers"]}, X-RSV-Marcas, X-RSV-Marca-Cada`,
                      }
                    : {}),
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
                "X-RSV-Voz": "principal",
                "X-RSV-Proveedor": "soniox",
                "X-RSV-Voz-Nombre": cat.voz,
                "X-RSV-Voz-Swap": "0",
                "X-RSV-Matiz": plana ? "plana" : "actuacion",
                "X-RSV-Partes": String(partes.length),
                "X-RSV-Parte": String(usaPartes ? pedida : 0),
                "X-RSV-Esperas": "0/0",
                "X-RSV-Guardada": "1",
                ...(conMarcas
                    ? {
                          "X-RSV-Marcas": guardada.marcas,
                          "X-RSV-Marca-Cada": String(MARCA_CADA),
                      }
                    : {}),
            },
        })
    }
    /* Lo que sale de la puerta: quién es, la reserva, cómo devolverla si la
       voz no suena y los interruptores (que solo se leen si se va a sintetizar). */
    type Puerta = {
        carril: Carril
        gasto: Reserva
        devolver: () => Promise<void>
        flags: () => Promise<{ swap: boolean; plana: boolean }>
    }
    const abrirPuerta = async (): Promise<Puerta | Response> => {
        const pase = await pedirPase(clerkUserId, ip, costo, rutaParte)
        if (pase) {
            const flags = () => Promise.resolve({ swap: pase.swap, plana: pase.plana })
            if (rutaParte && pase.guardada !== false) {
                const guardada = await leerParteGuardada(rutaParte)
                if (guardada) {
                    /* Solo hay algo apartado si la base no pudo mirar el almacén. */
                    if (pase.ids.length)
                        enSegundoPlano(devolverReserva(clerkUserId, pase.ids))
                    return respuestaGuardada(guardada, pase.plana)
                }
                if (pase.guardada === true) {
                    /* El almacén la tenía anotada y no llegó: se sintetiza y se
                       aparta ahora (sin volver a buscarla). */
                    const otro = await pedirPase(clerkUserId, ip, costo, "")
                    if (otro)
                        return {
                            carril: otro.carril,
                            gasto: otro.reserva,
                            devolver: () => devolverReserva(clerkUserId, otro.ids),
                            flags,
                        }
                    const marca = new Date(Date.now() - 1000).toISOString()
                    return {
                        carril: pase.carril,
                        gasto: await reserveSpend(clerkUserId, ip, pase.carril, costo),
                        devolver: () => refundSpend(clerkUserId, marca),
                        flags,
                    }
                }
            }
            return {
                carril: pase.carril,
                gasto: pase.reserva,
                devolver: () => devolverReserva(clerkUserId, pase.ids),
                flags,
            }
        }
        /* El camino de antes (v3.12), cuando la base no contestó la puerta. */
        const carrilPedido = resolverCarril(clerkUserId)
        const guardadaPedida = rutaParte ? leerParteGuardada(rutaParte) : null
        const carril = await carrilPedido
        /* 🜂 v3.6 — sin saber quién es, la lectura no se cobra ni como miembro ni
           como invitado. La frase va en `error` porque la app publicada muestra
           ese campo tal cual cuando no lo reconoce. */
        if (carril === "desconocido")
            return jsonResponse(503, {
                error: avisoMembresiaNoVerificada(lang),
                codigo: "membresia_no_verificada",
            })
        if (guardadaPedida) {
            const guardada = await guardadaPedida
            if (guardada) {
                const { plana } = await leerFlags()
                return respuestaGuardada(guardada, plana)
            }
        }
        /* Sello del instante ANTES de reservar: acota el reembolso a la fila
           propia si la síntesis no llega a producir audio (v1.4). */
        const marcaReserva = new Date(Date.now() - 1000).toISOString()
        return {
            carril,
            gasto: await reserveSpend(clerkUserId, ip, carril, costo),
            devolver: () => refundSpend(clerkUserId, marcaReserva),
            flags: leerFlags,
        }
    }
    const puerta = await abrirPuerta()
    if (puerta instanceof Response) return puerta
    const { carril, gasto } = puerta
    if (!gasto.ok) {
        if (carril === "free" && gasto.reason === "user_limit") {
            return jsonResponse(403, { error: "membership_required" })
        }
        return jsonResponse(429, {
            error: "rate_limited",
            /* Para que el aviso pueda decir la verdad en vez de "por hoy":
               la ventana es DESLIZANTE de 24 h, no el día de calendario. */
            scope: gasto.reason === "global_limit" ? "global" : "user",
            spent: gasto.spent,
            limit: gasto.limit,
            /* v1.6 — la ventana REAL de la que se agotó (24 h el pico diario,
               720 h el bolsón del mes), para que el aviso no mienta. */
            window_hours: gasto.windowHours ?? 24,
        })
    }
    /* 🜂 v3.12 — los interruptores viajan mientras Soniox sintetiza.
       🜂 v3.13 — con la puerta en un viaje ya llegaron con ella. */
    const flagsPedidos = puerta.flags()

    /* Cadencia opcional (0.5–2.0). Sin el secreto no se manda `prosody` y
       Fish usa su ritmo natural: una perilla que existe solo si se necesita. */
    const velocidad = envNumber("FISH_VOICE_SPEED", 0)
    const prosody =
        velocidad >= 0.5 && velocidad <= 2 ? { speed: velocidad } : null

    /* Una sola llamada a Fish, aislada, para poder reintentarla con la voz de
       respaldo sin duplicar el cuerpo. */
    async function sintetizar(refId: string) {
        return await fetch(FISH_TTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${FISH_KEY}`,
                "Content-Type": "application/json",
                /* 🜂 El modelo viaja en un HEADER, no en el cuerpo (docs de
                   Fish, verificado 2026-07-29). Valores: s1 · s2-pro ·
                   s2.1-pro · s2.1-pro-free. */
                model,
            },
            body: JSON.stringify({
                text: textoFinal,
                /* Sin reference_id Fish usa su voz por defecto — sirve para
                   probar que el circuito vive antes de elegir voz. */
                ...(refId ? { reference_id: refId } : {}),
                format: "mp3",
                /* 64 kbps: es voz hablada, no música. La mitad de bytes que
                   128 para el mismo oído, y la respuesta viaja más rápido. */
                mp3_bitrate: 64,
                /* 🜂 La documentación de Fish pide normalize FALSE cuando el
                   texto lleva señales de actuación: con la normalización
                   encendida puede alterarlas antes de que el modelo las lea.
                   Con la lectura plana vuelve a true (números y fechas se
                   pronuncian en palabras, como hasta ahora). */
                normalize: plana,
                latency: "normal",
                /* 🜂 v2.1 — el trozo interno más grande que Fish documenta
                   (100 a 300; default 200). Cada frontera interna es una
                   tirada de dado para un ruido raro: la mitad de fronteras es
                   la mitad de tiradas. El costo es unos ms más de primer
                   audio por parte, imperceptible contra la síntesis misma. */
                chunk_length: 300,
                /* Parámetros de generación. Los tres son los que documenta
                   Fish; temperature y repetition_penalty coinciden con su
                   default a propósito (quedan a la mano por si se afinan). */
                temperature: envNumber("FISH_TEMPERATURE", DEFAULT_TEMPERATURE),
                top_p: envNumber("FISH_TOP_P", DEFAULT_TOP_P),
                repetition_penalty: envNumber(
                    "FISH_REPETITION_PENALTY",
                    DEFAULT_REPETITION_PENALTY
                ),
                ...(prosody ? { prosody } : {}),
            }),
        })
    }

    /* 🜂 v3.0 — EL CARRIL DE SONIOX. Una sola llamada REST que devuelve los
       mismos bytes de mp3 que Fish, así que todo lo de abajo —el cobro, el
       reembolso si falla, el corte por partes, la caché del aparato— sigue
       exactamente igual. El texto va SIN las direcciones de actuación: esos
       tags son dialecto de Fish y acá se leerían en voz alta.

       Tope duro del proveedor: 5.000 caracteres por llamada. Nuestro
       segmentador ya corta en 1.400, así que ninguna parte se acerca; el
       recorte es un cinturón, no el mecanismo. */
    async function sintetizarSoniox() {
        return await fetch(SONIOX_TTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SONIOX_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: SONIOX_MODEL,
                language: lang === "en" ? "en" : "es",
                voice: cat.voz,
                audio_format: "mp3",
                text: textoParte.slice(0, 5000),
                bitrate: 64000,
                ...(cat.speed ? { speed: cat.speed } : {}),
            }),
        })
    }

    /* 🜂 v3.2 — EL CAMINO CON MARCAS, detrás de bandera. Solo se toma si el
       cliente pide `marcas: true`, así que hasta que ese cliente exista nada
       cambia para nadie. Y si el canal falla, cae al REST de siempre: la
       lectura no puede depender de una mejora del resalte. */
    const quiereMarcas = body?.marcas === true && usaSoniox

    /* La puerta REST de Soniox, contada como un intento más: dice qué pasó
       igual que el canal (estado y error_type), para decidir con lo mismo. */
    const sonioxRest = async (): Promise<IntentoSoniox> => {
        try {
            const r = await sintetizarSoniox()
            if (r.ok) {
                const audio = new Uint8Array(await r.arrayBuffer())
                return audio.length
                    ? { ok: true, audio, tiempos: [], caracteres: [] }
                    : { ok: false, status: 0, tipo: "rest_vacio", detalle: "" }
            }
            const cuerpo = await r.text().catch(() => "")
            let tipo = ""
            try {
                tipo = String(JSON.parse(cuerpo)?.error_type || "")
            } catch {}
            return { ok: false, status: r.status, tipo, detalle: cuerpo.slice(0, 300) }
        } catch (e: any) {
            return {
                ok: false,
                status: 0,
                tipo: "rest_red",
                detalle: String(e?.message ?? e).slice(0, 160),
            }
        }
    }

    /* 🜂 v3.7 — UNA PARTE NO CAMBIA DE PROVEEDOR POR UN CUPO LLENO (Zak
       2026-10-20). Soniox atiende tres síntesis a la vez por cuenta, y el
       canal y el REST cuentan en el mismo cupo; la escucha automática llegó a
       pedir cuatro en menos de tres segundos. La cuarta recibía 429, la v3.6
       no reintentaba un 429 y la parte salía en Fish: la voz de Goku en medio
       de una lectura de Margo. Un cupo lleno no es una caída: se vacía solo en
       cuanto termina cualquiera de las síntesis en curso. Por eso aquí se
       espera con respiro creciente y se insiste con el MISMO proveedor (hasta
       60 s por cupo, 10 s por tropiezo pasajero); solo una llave, un saldo o
       una voz rotos se rinden en el acto. El cupo de la persona ya quedó
       reservado arriba: los reintentos no cobran de nuevo. */
    let sonio: IntentoSoniox | null = null
    let intentos = 0
    let esperadoMs = 0
    if (usaSoniox) {
        let porCanal = quiereMarcas
        let esperaCupo = 0
        let esperaPasajero = 0
        for (;;) {
            intentos++
            sonio = porCanal
                ? await sonioxPorCanal(
                      SONIOX_KEY,
                      SONIOX_MODEL,
                      cat.voz,
                      lang === "en" ? "en" : "es",
                      textoParte,
                      cat.speed
                  )
                : await sonioxRest()
            if (sonio.ok) break
            const clase = claseFalloSoniox(sonio)
            if (clase === "fijo") break
            /* Un canal que se cae sin decir por qué (red, apretón de manos
               rechazado) no amerita espera: se prueba en el acto la puerta
               REST, que no depende del canal. Sin marcas, pero con la voz. */
            if (porCanal && sonio.status === 0) {
                porCanal = false
                continue
            }
            const espera = respiroSoniox(intentos)
            if (clase === "cupo") {
                if (esperaCupo + espera > ESPERA_CUPO_MS) break
                esperaCupo += espera
            } else {
                if (esperaPasajero + espera > ESPERA_PASAJERO_MS) break
                esperaPasajero += espera
            }
            esperadoMs += espera
            await new Promise((res) => setTimeout(res, espera))
        }
        if (sonio.ok && intentos > 1)
            console.log(
                `[espejo-voz] Soniox respondió tras ${intentos} intentos y ${esperadoMs} ms de espera`,
                JSON.stringify({ voz: cat.voz, parte: usaPartes ? pedida : 0 })
            )
    }
    const esperas = `${intentos}/${esperadoMs}`

    /* Los dos interruptores del Motor. El de VOCES decide cuál de las dos va
       al frente; el de MATIZ decide si la lectura se actúa o sale plana. */
    const { swap, plana } = await flagsPedidos
    /* 🜂 El intercambio solo se honra si AMBAS voces existen. Si el secreto de
       la alterna no estuviera cargado, invertir mandaría a Fish un
       reference_id vacío y sonaría su voz genérica — un fallo silencioso y
       difícil de leer desde el teléfono. Sin la alterna, el interruptor
       simplemente no hace nada. */
    const puedeIntercambiar = swap && !!FISH_VOICE_FALLBACK && !!FISH_VOICE_ID
    const vozPrincipal = puedeIntercambiar ? FISH_VOICE_FALLBACK : FISH_VOICE_ID
    const vozRespaldo = puedeIntercambiar ? FISH_VOICE_ID : FISH_VOICE_FALLBACK
    const voiceId = cat.proveedor === "fish" && cat.voz ? cat.voz : vozPrincipal

    /* ── LA ACTUACIÓN ─────────────────────────────────────────────────────
       El texto que va a Fish lleva las direcciones de interpretación; el que
       el Tripulante LEE en el chat nunca las tuvo (se arman aquí, al vuelo).
       Con el interruptor en "plana" se manda la prosa tal cual, idéntico a
       como sonaba antes de esta versión. */
    const directiva = (
        Deno.env.get("FISH_VOICE_DIRECTIVE") || DEFAULT_DIRECTIVE
    ).trim()
    const textoFinal = plana
        ? textoParte
        : dirigirVoz(textoParte, directiva, esUltimaParte)

    if (sonio?.ok) {
        /* 🜂 v3.8 — las marcas viajan solo a quien las pide en su forma nueva
           (`marcas_v2`): casadas con el texto de la parte, un ancla cada 2
           letras y EXPUESTAS, porque sin eso el navegador las esconde. Las
           versiones de tienda no las piden así y siguen estimando como hasta
           hoy: leen marcas desde agosto y nunca recibieron una, así que ese
           camino suyo nunca se probó con marcas de verdad. */
        /* 🜂 v3.9 — las marcas se calculan siempre que el canal las dio (se
           guardan con la parte aunque este pedido no las quiera) y viajan solo
           a quien las pide en su forma nueva. */
        const marcasDeLaParte =
            sonio.tiempos.length > 0
                ? marcasCompactas(
                      sonio.caracteres.length === sonio.tiempos.length
                          ? alinearMarcas(textoParte, sonio.caracteres, sonio.tiempos)
                          : sonio.tiempos
                  )
                : ""
        const conMarcas = body?.marcas_v2 === true && sonio.tiempos.length > 0
        const marcas = conMarcas ? marcasDeLaParte : ""
        /* 🜂 v3.9 — se guarda después de responder: la próxima vez sale al
           instante y sin cobrar. */
        if (rutaParte)
            enSegundoPlano(guardarParte(rutaParte, sonio.audio.slice(), marcasDeLaParte))
        /* El cupo ya quedó reservado arriba y solo se devuelve si algo falla:
           no hay nada que confirmar acá. */
        return new Response(sonio.audio, {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                ...(marcas
                    ? {
                          "Access-Control-Expose-Headers": `${CORS_HEADERS["Access-Control-Expose-Headers"]}, X-RSV-Marcas, X-RSV-Marca-Cada`,
                      }
                    : {}),
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
                "X-RSV-Voz": "principal",
                "X-RSV-Proveedor": "soniox",
                "X-RSV-Voz-Nombre": cat.voz,
                "X-RSV-Voz-Swap": puedeIntercambiar ? "1" : "0",
                "X-RSV-Matiz": plana ? "plana" : "actuacion",
                "X-RSV-Partes": String(partes.length),
                "X-RSV-Parte": String(usaPartes ? pedida : 0),
                "X-RSV-Esperas": esperas,
                /* Un ancla cada MARCA_CADA letras del texto de la parte,
                   delta en centésimas, base 36. El cliente reconstruye sumando. */
                ...(marcas
                    ? {
                          "X-RSV-Marcas": marcas,
                          "X-RSV-Marca-Cada": String(MARCA_CADA),
                      }
                    : {}),
            },
        })
    }
    /* Lo que Soniox no pudo dar y por qué, en una línea: viaja en X-RSV-Cruce
       y en los registros. Vacío = la voz pedida vive en Fish (no hay cruce). */
    const cruce =
        usaSoniox && sonio && !sonio.ok
            ? `${claseFalloSoniox(sonio)}:${sonio.status}:${sonio.tipo || "-"}`.slice(0, 80)
            : ""
    /* 🜂 v3.10 — YA NO SE CRUZA A FISH (Zak 2026-10-24). Todas las voces son de Soniox; si no respondió tras su
       espera, o falta su llave, no suena otra voz: se devuelve el cupo y se dice con el código que la app ya
       traduce («No se pudo alcanzar la voz»). */
    if (!usaSoniox || !sonio?.ok) {
        await puerta.devolver()
        console.warn(
            "[espejo-voz] Soniox no respondió y ya no hay respaldo",
            JSON.stringify({ voz: cat.voz, parte: usaPartes ? pedida : 0, motivo: cruce || (SONIOX_KEY ? "sin_intento" : "sin_llave"), intentos, esperadoMs })
        )
        return jsonResponse(502, {
            error: "fish_unreachable",
            detail: "soniox",
            proveedor: "soniox",
            voz: cat.voz,
            ...(cruce ? { soniox: cruce } : {}),
        })
    }

    try {
        let r = await sintetizar(voiceId)
        let usoRespaldo = !!cruce
        if (cruce)
            console.warn(
                "[espejo-voz] cruce a Fish como último recurso",
                JSON.stringify({
                    voz: cat.voz,
                    parte: usaPartes ? pedida : 0,
                    motivo: cruce,
                    detalle: sonio && !sonio.ok ? sonio.detalle.slice(0, 160) : "",
                    intentos,
                    esperadoMs,
                    fish: r.status,
                })
            )

        /* 🜂 Si Soniox se cae, la lectura NO se cae con él: la parte sale por
           Fish, que sigue vivo y con saldo, porque mudo sigue siendo peor que
           distinto. Pero cambiar de timbre a media lectura se lee como que la
           app se rompió (Zak 2026-08-14 y 2026-10-20), así que eso pasa solo
           después de la espera de arriba: la v3.4 respiraba 600 ms una vez y
           un 429 cruzaba en el acto; la v3.7 espera el cupo y el tropiezo con
           el mismo proveedor y deja el cruce, dicho en X-RSV-Cruce, como
           último recurso. */

        /* Reintento con la VOZ DE RESPALDO solo si el problema es de la voz
           (4xx que no sea de llave/saldo/cuota). Un 401/402/429 se propaga tal
           cual: reintentar sería quemar otra llamada para el mismo error. */
        if (
            !r.ok &&
            vozRespaldo &&
            vozRespaldo !== voiceId &&
            r.status >= 400 &&
            r.status < 500 &&
            r.status !== 401 &&
            r.status !== 402 &&
            r.status !== 429
        ) {
            r = await sintetizar(vozRespaldo)
            usoRespaldo = true
        }

        if (!r.ok) {
            const detail = await r.text().catch(() => "")
            /* v1.4 — no sonó nada: se devuelve el cupo. */
            await puerta.devolver()
            /* Se devuelve el motivo REAL de Fish (patrón "surface del error
               real"): un 401 de llave, un 402 de saldo y un 422 de voz
               inexistente se diagnostican de un tiro, sin adivinar. */
            return jsonResponse(502, {
                error: "fish_tts_failed",
                status: r.status,
                /* El motivo REAL del proveedor llega entero a la pantalla: un
                   nombre de voz mal escrito, una llave inválida o un tope de
                   la cuenta se diagnostican de un tiro, sin adivinar. */
                detail: detail.slice(0, 400),
                proveedor: "fish",
                voz: cat.voz || voiceId,
                tried_fallback: usoRespaldo,
                /* v3.7 — y por qué no respondió Soniox, si era su voz. */
                ...(cruce ? { soniox: cruce } : {}),
            })
        }

        const audio = new Uint8Array(await r.arrayBuffer())
        if (audio.length === 0) {
            await puerta.devolver()
            return jsonResponse(502, { error: "empty_audio" })
        }

        return new Response(audio, {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
                /* Para device-QA: qué voz sonó realmente, si las voces están
                   intercambiadas y si la lectura salió actuada o plana. */
                "X-RSV-Voz": usoRespaldo ? "respaldo" : "principal",
                /* 🜂 v3.0 — QUIÉN habló de verdad. Sin esto, un fallo de
                   Soniox que cae a Fish suena parecido y nadie se entera de
                   que el carril nuevo está muerto. Desde la v3.7 aquí solo
                   llega Fish: lo de Soniox sale arriba. */
                "X-RSV-Proveedor": "fish",
                "X-RSV-Voz-Nombre": "fish",
                "X-RSV-Voz-Swap": puedeIntercambiar ? "1" : "0",
                "X-RSV-Matiz": plana ? "plana" : "actuacion",
                /* v1.5 — cuántos trozos tiene el reflejo completo: con esto el
                   cliente sabe, ya sonando la parte 0, cuántas le faltan. */
                "X-RSV-Partes": String(partes.length),
                "X-RSV-Parte": String(usaPartes ? pedida : 0),
                "X-RSV-Esperas": esperas,
                /* 🜂 v3.7 — la voz pedida era de Soniox y esta parte salió en
                   Fish: la app no la guarda bajo esa voz y lo anota. */
                ...(cruce ? { "X-RSV-Cruce": cruce } : {}),
            },
        })
    } catch (err: any) {
        /* v1.4 — la red se cayó a media síntesis: tampoco se cobra. */
        await puerta.devolver()
        return jsonResponse(502, {
            error: "fish_unreachable",
            detail: String(err?.message ?? err).slice(0, 300),
        })
    }
})
