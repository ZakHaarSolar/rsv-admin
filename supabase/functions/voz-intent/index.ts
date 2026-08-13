// admin/supabase/functions/voz-intent/index.ts v1.10 — 🜂 FASE E · EL CONTEXTO
// VIVO (Zak 2026-08-13): el cliente manda `contexto.capa_activa` +
// `contexto.lista_visible` (la pila central de lib/vozContexto: la capa del
// tope y su lista numerada tal cual se ve) y el prompt enseña las reglas de
// resolución — "la de arriba"/"esa"/"la 2"/"el duplicado" se resuelven contra
// ESA lista devolviendo el título EXACTO copiado, y la capa dicta la familia
// (rachas → racha_accion · plan → plan_accion · bitacora → nota_accion). Lo
// que no está en la lista no está en pantalla. | v1.9 — EL MODELO VE TUS MISIONES DE HOY: el cliente manda `contexto.misiones_hoy` (los títulos, numerados como se ven) y el prompt las enseña arriba, así «ya fui al súper» se entiende desde CUALQUIER capa y sabe a cuál se refiere — copiando el título tal cual, sin inventar. Lo que no está en la lista no es una misión.
// admin/supabase/functions/voz-intent/index.ts v1.8 — (1) HACER + PREGUNTAR EN UNA FRASE: «ya fui al súper, ¿qué otros pendientes me quedan?» devuelve completar + y_luego:"ver"; y completar acepta VARIAS por título. (2) 🜂 LA BITÁCORA DE LO QUE NO ENTENDIMOS (idea de Zak): cada UNKNOWN de la interpretación anota la frase en voz_frases_sin_resolver por una sola puerta (`noEntendi`) — SOLO lo que falló, JAMÁS quién lo dijo (hash irreversible con sal, únicamente para no contar diez veces al mismo), nada del reconocedor local, retención 90 días. Fire-and-forget: si el registro falla, el comando ni se entera.
// admin/supabase/functions/voz-intent/index.ts v1.7 — EL ESCENARIO GOBIERNA EL PROMPT: el cliente manda contexto {rollover, plan_abierto} y la sección + ejemplos de los vectores de ayer SOLO se enseñan si esa ceremonia está en pantalla (antes el modelo mandaba ahí cualquier frase con número, porque era el único formato numerado que conocía; validación doble: sin contexto, rollover_accion muere aunque el modelo lo invente). El plan gana numero (la tarjeta visible), todas, mover (con fecha, «cambia X para mañana» es MOVER no renombrar) y ver («¿qué pendientes tengo mañana?»).
// admin/supabase/functions/voz-intent/index.ts v1.6 — (1) op `fecha` en rachas: corregir CUÁNDO empezó sin tocar el récord ni el conteo; exige título E inicio, porque media orden movería el comienzo a un lugar inventado. (2) `titulos[]` en plan: agregar VARIAS misiones de un tirón, en el orden dicho y sin las palabras que las enumeran ("la primera es…"). Solo al agregar: completar, eliminar y renombrar actúan sobre UNA nombrada.
// admin/supabase/functions/voz-intent/index.ts | v1.5 — DOS FAMILIAS NUEVAS. (1) VECTORES DE AYER (`rollover_accion`): soltar · mover a hoy · reprogramar; el objetivo viaja CRUDO (un número, un texto o «todas») porque quien lo resuelve es la app, que es la única que sabe qué está mostrando, y la fecha se valida por forma y jamás se acepta en el pasado. (2) REALIDAD ELEGIDA (`realidad_accion`): contemplar y dictar en uno de los 6 ángulos; sellar, re-anclar y borrar están prohibidos por prompt Y por lista blanca.
// admin/supabase/functions/voz-intent/index.ts | v1.4 — FASE C: EDITAR Y BORRAR.
// Cae el guard anti-destructivo de la v1.3 y nacen los ops `eliminar` y
// `renombrar` en las TRES familias con objeto propio (racha_accion,
// plan_accion, nota_accion), con few-shots de las frases reales. El renombre
// viaja con `titulo` (a cuál) + `titulo_nuevo` (cómo se llamará) y la edge
// exige AMBOS: media orden de renombre es peor que ninguna. El borrado JAMÁS
// se ejecuta al llegar — el cliente lo pasa siempre por la tarjeta de permiso
// del orbe —, así que aquí solo se extrae la intención.
// 🜂 La lista blanca de `op` sigue siendo la línea de defensa: un modelo que
// invente "vaciar" o "borrar todo" no encuentra dónde aterrizar.
// | v1.3 — GUARD ANTI-DESTRUCTIVO: eliminar/borrar/quitar/renombrar/editar responden SIEMPRE UNKNOWN (aún no soportado, Fase C); jamás se mapean a crear/reiniciar/pausar (evita el reinicio accidental de un "elimina la racha X").
// LAS ACCIONES (decisión de Zak tras el device-QA: títulos con metapalabras y
// "llevo 8 años" ignorado por el 8b). (1) CUATRO familias: racha_accion +
// plan_accion (agregar/completar misión) + sendero_accion (sellar ritual) +
// nota_accion (nota dictada / carpeta). (2) FEW-SHOTS con las frases reales
// que fallaron. (3) Para acciones el modelo sube a llama-3.3-70b (Groq, <1 s,
// ~0.001 USD/intento; VOZ_MODEL_ACCIONES lo cambia sin código); los destinos
// de navegación siguen en el 8b instantáneo. (4) inicio_local "YYYY-MM-DD
// HH:MM" en hora de la persona (el cliente lo aterriza; techo = ahora).
// | v1.1 — LA IA TAMBIÉN ENTIENDE
// ACCIONES DE RACHAS (Zak: "queremos experiencia de primer nivel, que puedan
// explicarlo de múltiples formas"). El cliente que sabe ejecutarlas manda
// acciones:true + hoy_iso, y el modelo puede responder racha_accion {op,
// titulo, inicio_iso} además de los destinos de navegación. Cada campo se
// valida acá (op en lista blanca, título obligatorio, inicio jamás futuro) y
// un cliente viejo, que no manda el flag, nunca recibe el formato nuevo.
// | v1.0
// EL RESPALDO DE IA DE LOS COMANDOS POR VOZ.
//
// Solo se llama cuando el reconocedor LOCAL del cliente (lib/comandosVoz) no
// alcanzó su umbral, o sea la cola larga: "quiero ver cuántos días llevo sin
// fumar" en vez de "rachas". El 95% del uso ni pasa por aquí.
//
// 🜂 EL CATÁLOGO VIAJA DESDE EL CLIENTE, no vive aquí. Así esta función jamás
// puede devolver un destino que la app instalada no sepa abrir: una versión
// vieja manda su lista vieja y recibe un id de su lista vieja. Sin esto, sumar
// una capa nueva obligaría a desplegar la edge y a rezar por que nadie con una
// build anterior recibiera un id desconocido.
//
// SEGURIDAD (patrones canónicos del proyecto, ver la auditoría):
//   · La llave del proveedor NUNCA sale de aquí. El cliente manda texto.
//   · `gateUser` verifica la sesión de Clerk contra el JWKS de la instancia:
//     el id sale del token firmado, jamás del cuerpo.
//   · `reserve_edge_spend` acota el gasto por persona y en global. Es baratísimo
//     (un intento cuesta una fracción de centavo) pero sin freno un bucle en un
//     cliente roto podría dispararlo.
//
// PROVEEDOR INTERCAMBIABLE POR SECRETO, sin tocar código:
//   · Si existe `GROQ_API_KEY` → Groq (lo más rápido que hay para un modelo
//     chico: la respuesta suele llegar en 200-400 ms).
//   · Si no → OpenRouter con `provider.sort = "throughput"` (la llave ya existe
//     en el proyecto desde el Espejo, así que esto funciona HOY sin configurar
//     nada). Se pide el proveedor más rápido disponible para ese modelo.
//   · `VOZ_MODEL` fuerza un modelo concreto en cualquiera de los dos.

import { gateUser } from "../_shared/clerkAuth.ts"

const DAY_SECONDS = 86400

/* Topes. Un intento cuesta ~0.0002 USD: el freno no es por dinero sino para
   que un cliente en bucle no se convierta en una factura. */
const LIMITE_PERSONA = 240
const LIMITE_GLOBAL = 20000

/* Modelos por defecto: los más chicos y rápidos de cada proveedor. Clasificar
   una frase de 6 palabras contra 30 opciones no necesita un modelo grande, y
   uno grande añadiría medio segundo que aquí se nota. */
const MODELO_GROQ_DEFAULT = "llama-3.1-8b-instant"
const MODELO_OR_DEFAULT = "meta-llama/llama-3.1-8b-instruct"
/* v1.2 — para ACCIONES (título + tiempo + intención) el 8b se quedaba corto
   (device-QA de Zak: metió "llamada/ponle de título" al título e ignoró
   "llevo 8 años"). El 70b en Groq sigue contestando en <1 s y un intento
   cuesta ~0.001 USD: la calidad aquí ES la experiencia. */
const MODELO_GROQ_ACCIONES = "llama-3.3-70b-versatile"
const MODELO_OR_ACCIONES = "meta-llama/llama-3.3-70b-instruct"

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, "Content-Type": "application/json" },
    })

interface Destino {
    id: string
    desc: string
    ejemplos: string[]
}

/* ═════════════ EL SYSTEM PROMPT ═════════════
   Se arma con el catálogo que mandó el cliente. Tres cosas lo hacen fiable:
   (1) prohibir inventar ids, (2) obligar a UNKNOWN ante la duda — es MUCHO
   mejor decir "no entendí, puedes decir X" que abrir la capa equivocada —, y
   (3) pedir JSON y nada más. */
function construirSystem(
    destinos: Destino[],
    lang: string,
    conAcciones = false,
    hoyIso = "",
    ctx: {
        rollover?: boolean
        plan_abierto?: boolean
        misiones_hoy?: string[]
        /* 🜂 v1.10 · FASE E — la capa visible y su lista numerada tal cual
           se ve en pantalla. Con ellas el modelo resuelve referencias por
           posición o señalamiento ("la de arriba", "esa", "la 2", "el
           duplicado") devolviendo el TÍTULO EXACTO. */
        capa_activa?: string
        lista_visible?: { n: number; titulo: string }[]
    } = {}
): string {
    const lista = destinos
        .map(
            (d) =>
                `- ${d.id}: ${d.desc}${
                    d.ejemplos?.length
                        ? ` (ej: "${d.ejemplos.join('", "')}")`
                        : ""
                }`
        )
        .join("\n")

    const idioma =
        lang === "en"
            ? "The user speaks English."
            : "El Tripulante habla español (México)."

    return `Eres el enrutador de comandos de voz de una app llamada Escáner Vibracional. ${idioma}

Recibes una frase dictada por voz y decides a qué pantalla de la app quiere llegar la persona.

DESTINOS DISPONIBLES (id: para qué sirve):
${lista}

${
        conAcciones && ctx.capa_activa && ctx.lista_visible?.length
            ? `🜂 LO QUE LA PERSONA ESTÁ VIENDO AHORA MISMO — capa "${ctx.capa_activa}", su lista numerada tal cual está en pantalla:
${ctx.lista_visible.map((x) => `${x.n}. ${x.titulo}`).join("\n")}
REGLAS DEL CONTEXTO VIVO:
· Referencias por POSICIÓN o SEÑALAMIENTO se resuelven contra ESTA lista: "la primera" / "la de arriba" = 1 · "la última" / "la de abajo" = la ${ctx.lista_visible.length} · "la 2" / "la número dos" = 2 · "esa" / "esta" sin más señas = la 1.
· "el duplicado" / "la repetida" = el elemento cuyo título aparece MÁS DE UNA VEZ en la lista (si hay uno). Si nada se repite, confidence baja.
· Al resolver, devuelve el TÍTULO EXACTO copiado de la lista (campo "titulo"), nunca el número solo ni un título inventado. Excepción: el plan acepta "numero" y ahí puedes mandar el entero visible.
· La capa dice la FAMILIA: "rachas" → racha_accion · "plan" → plan_accion · "bitacora" → nota_accion. "Elimina la primera" con la capa rachas abierta es eliminar ESA racha.
· Lo que no esté en la lista no está en pantalla: no lo inventes.

`
            : ""
    }${
        conAcciones && ctx.misiones_hoy?.length
            ? `LO QUE LA PERSONA TIENE ANOTADO HOY (sus misiones, en el orden en que las ve numeradas):
${ctx.misiones_hoy.map((m, i) => `${i + 1}. ${m}`).join("\n")}
🜂 Úsalas para entender a QUÉ se refiere. Si dice que YA hizo algo de esta lista ("ya fui al súper", "ya bañé a los perros", "listo, ya compré los colores"), eso es COMPLETAR esa misión — copia su título tal como aparece arriba. Si además pregunta qué le queda, añade "y_luego":"ver". Lo que NO esté en la lista no es una misión: no lo inventes.

`
            : ""
    }${
        conAcciones
            ? `ACCIONES (además de navegar, la persona puede pedir HACER cosas; tu trabajo es extraer la intención COMPLETA):

1. RACHAS (contadores de hábitos con título libre): crear · reiniciar · pausar · reanudar · eliminar · renombrar · cambiar su FECHA DE INICIO.
   Respuesta: {"action":"racha_accion","op":"crear|reiniciar|pausar|reanudar|eliminar|renombrar|fecha","titulo":"…","titulo_nuevo":"…"|null,"inicio_local":"YYYY-MM-DD HH:MM"|null,"confidence":X}
   · op "fecha" = corregir CUÁNDO empezó, sin perder el conteo ("cambia el inicio de mi racha agua al 12 de enero"). Exige titulo E inicio_local. NO es reiniciar.
2. PLAN DE VUELO (las misiones/tareas del día; la gente también dice pendientes, tarjetas, actividades, tasks): agregar misiones · completar · eliminar · renombrar · MOVER a otro día · VER un día.
   Respuesta: {"action":"plan_accion","op":"agregar|completar|eliminar|renombrar|mover|ver","titulo":"…","titulos":["…"],"numero":N|null,"todas":true|false,"titulo_nuevo":"…"|null,"fecha_local":"YYYY-MM-DD"|null,"confidence":X}
   · 🜂 AGREGAR ACEPTA VARIAS DE UN TIRÓN: si la frase enumera más de una ("agrega tres tareas: ir al súper, comprar colores y pasear a los perros"), devuélvelas TODAS en "titulos", en el orden dicho y sin la parte que las enumera ("la primera es", "la segunda", "y la tercera"). Con una sola, "titulos" lleva ese único elemento. "titulo" siempre trae la primera.
   · NÚMERO VISIBLE: las tarjetas en pantalla están numeradas. "completa la 2", "elimina la tarea número uno" → "numero": ese entero (y titulo vacío). Jamás inventes el número.
   · "todas": true cuando la frase abarca todas ("completa todas mis tareas").
   · MOVER exige "fecha_local" (a qué día viaja): "mueve ir al súper al sábado", "cambia comprar colores para mañana" → op mover + la fecha calculada, NUNCA en el pasado. Ojo: "cambia X para <día>" es MOVER, no renombrar.
   · VER = preguntar qué hay: "¿qué pendientes tengo mañana?", "¿qué tareas tengo hoy?" → {"op":"ver","fecha_local":"<ese día>"}; sin día dicho → fecha de hoy.
   · 🜂 HACER + PREGUNTAR EN UNA FRASE: "ya fui al súper, ¿qué otros pendientes me quedan?" es UNA intención — completar ESO y además mostrar lo que queda. Devuelve op "completar" con "y_luego":"ver". Frases con "ya hice / ya fui / ya terminé" son COMPLETAR (sellan lo hecho), nunca eliminar.
   · COMPLETAR ACEPTA VARIAS: "ya fui al súper y ya bañé a los perros" → "titulos":["Ir al súper","Bañar a los perros"].
${
        ctx.rollover
            ? `2b. VECTORES DE AYER (la app ESTÁ mostrando ahora mismo las misiones sin resolver de días pasados): soltarlas, moverlas a hoy, o reprogramarlas a otro día.
   Respuesta: {"action":"rollover_accion","op":"soltar|hoy|reprogramar","objetivo":"<título dicho>"|"<número>"|"todas","fecha_local":"YYYY-MM-DD"|null,"confidence":X}
   · "objetivo" es "todas" si la frase abarca todas ("suéltalas todas", "muévelas todas a hoy"); si nombra una por su número di solo el número ("la 2" → "2"); si la nombra por su texto, copia ese texto.
   · "fecha_local" SOLO en reprogramar y solo si dijeron cuándo ("el jueves", "mañana", "el 12"): calcúlala desde la fecha actual y NUNCA en el pasado. Sin cuándo → null (la app preguntará).
`
            : ""
    }3. SENDERO (rituales diarios que se sellan por nombre: grounding, respiración, lectura…): sellar/marcar uno.
   Respuesta: {"action":"sendero_accion","nombre":"<nombre del ritual>","confidence":X}
3b. REALIDAD ELEGIDA (el tablero con la vida que la persona eligió, escrita por ÁNGULOS que son sus 6 áreas): contemplarla · dictar lo que quiere en un ángulo.
   Respuesta: {"action":"realidad_accion","op":"contemplar|dictar","angulo":"fisico|mental|emocional|financiero|vector|orbita"|null,"texto":"<lo dictado, en presente>"|null,"confidence":X}
   · Los ángulos por su nombre: CUERPO=fisico · MENTE=mental · EMOCIONES=emocional · ABUNDANCIA (dinero, ingresos)=financiero · PROPÓSITO (sueños, misión)=vector · VÍNCULOS (relaciones, pareja, familia)=orbita.
   · "dictar" exige ángulo Y texto. Si no se entiende a qué área se refiere, responde UNKNOWN.
   · JAMÁS devuelvas nada que selle, re-ancle o borre la visión: eso solo se hace con las manos.
4. BITÁCORA (notas y carpetas): crear una nota dictada · crear una carpeta · eliminar una nota · renombrar una nota.
   Respuesta nota: {"action":"nota_accion","op":"crear","titulo":"…"|null,"cuerpo":"<el contenido dictado>","confidence":X}
   Respuesta carpeta: {"action":"nota_accion","op":"carpeta","nombre":"…","confidence":X}
   Respuesta borrar/renombrar nota: {"action":"nota_accion","op":"eliminar|renombrar","titulo":"<cómo se llama hoy>","titulo_nuevo":"…"|null,"confidence":X}

REGLAS DE ELIMINAR Y RENOMBRAR (v1.4):
· ELIMINAR/BORRAR/QUITAR = op "eliminar", jamás "reiniciar" ni "pausar". "elimina la racha X" borra la racha entera; "reinicia la racha X" solo pone su conteo en cero. No los confundas nunca.
· RENOMBRAR/CAMBIAR EL NOMBRE/CAMBIAR EL TÍTULO = op "renombrar": "titulo" es cómo se llama HOY y "titulo_nuevo" cómo debe llamarse. Si falta cualquiera de los dos, responde UNKNOWN.
· Si la persona pide borrar TODO, VARIAS cosas a la vez, o algo que no es una racha, una misión ni una nota, responde UNKNOWN. Aquí solo se borra UNA cosa nombrada.
· Nada de lo que devuelvas se ejecuta solo: la app siempre pide permiso antes de borrar. Aun así, ante la duda entre borrar y otra cosa, elige UNKNOWN.

REGLAS DE EXTRACCIÓN (importantísimas):
· El TÍTULO es el SUJETO limpio, jamás las metapalabras: fuera "llamada", "que se llame", "ponle de título", "que diga", "con el título", "racha", "misión". Primera letra en mayúscula.
· "llevo N años/meses/semanas/días (con esto)" = la racha COMENZÓ hace N → calcula inicio_local restando a la fecha actual. "llevo 8 años" NO es parte del título.
· inicio_local va en hora LOCAL de la persona, formato "YYYY-MM-DD HH:MM", y JAMÁS en el futuro. Sin dato de tiempo → null.
· La fecha/hora local actual de la persona es: ${hoyIso}.
· La transcripción trae palabras de más o pegadas ("en llamada" = "llamada"): interpreta la intención.

EJEMPLOS (entrada → salida exacta):
· "crear racha llamada veganismo llevo 8 años" → {"action":"racha_accion","op":"crear","titulo":"Veganismo","inicio_local":"<hace 8 años>","confidence":0.95}
· "crear nueva racha llevo cinco días ponle de título flores" → {"action":"racha_accion","op":"crear","titulo":"Flores","inicio_local":"<hace 5 días>","confidence":0.95}
· "crear racha calcetines llevo con esto 5 años" → {"action":"racha_accion","op":"crear","titulo":"Calcetines","inicio_local":"<hace 5 años>","confidence":0.95}
· "reinicia la racha del agua" → {"action":"racha_accion","op":"reiniciar","titulo":"Agua","inicio_local":null,"confidence":0.9}
· "cambia el inicio de mi racha agua al 12 de enero" → {"action":"racha_accion","op":"fecha","titulo":"Agua","titulo_nuevo":null,"inicio_local":"<12 de enero más reciente ya pasado> 00:00","confidence":0.9}
· "mi racha de veganismo empezó hace 8 años, corrígela" → {"action":"racha_accion","op":"fecha","titulo":"Veganismo","titulo_nuevo":null,"inicio_local":"<hace 8 años>","confidence":0.85}
· "agrega tres tareas: la primera ir al súper, la segunda comprar colores y la tercera pasear a los perros" → {"action":"plan_accion","op":"agregar","titulo":"Ir al súper","titulos":["Ir al súper","Comprar colores","Pasear a los perros"],"confidence":0.95}
· "completa la tarea número dos" → {"action":"plan_accion","op":"completar","titulo":"","numero":2,"todas":false,"confidence":0.9}
· "elimina la tarjeta número uno" → {"action":"plan_accion","op":"eliminar","titulo":"","numero":1,"todas":false,"confidence":0.9}
· "completa todas mis tareas" → {"action":"plan_accion","op":"completar","titulo":"","numero":null,"todas":true,"confidence":0.95}
· "mueve la tarea de ir al súper al sábado" → {"action":"plan_accion","op":"mover","titulo":"Ir al súper","numero":null,"fecha_local":"<el sábado más cercano futuro>","confidence":0.9}
· "cambia mi tarea de comprar colores para mañana" → {"action":"plan_accion","op":"mover","titulo":"Comprar colores","numero":null,"fecha_local":"<mañana>","confidence":0.9}
· "¿qué pendientes tengo para mañana?" → {"action":"plan_accion","op":"ver","fecha_local":"<mañana>","confidence":0.95}
· "¿qué tareas tengo hoy?" → {"action":"plan_accion","op":"ver","fecha_local":"<hoy>","confidence":0.95}
· "ya fui al súper, ¿qué otros pendientes me quedan por hacer?" → {"action":"plan_accion","op":"completar","titulo":"Ir al súper","titulos":["Ir al súper"],"numero":null,"todas":false,"y_luego":"ver","confidence":0.9}
· "ya fui al súper y ya bañé a los perros" → {"action":"plan_accion","op":"completar","titulo":"Ir al súper","titulos":["Ir al súper","Bañar a los perros"],"numero":null,"todas":false,"confidence":0.9}
· "ya terminé todo, ¿qué me falta?" → {"action":"plan_accion","op":"completar","titulo":"","numero":null,"todas":true,"y_luego":"ver","confidence":0.9}
· "agrega a mi plan de vuelo comprar dátiles" → {"action":"plan_accion","op":"agregar","titulo":"Comprar dátiles","confidence":0.95}
· "completa comprar dátiles" → {"action":"plan_accion","op":"completar","titulo":"Comprar dátiles","confidence":0.85}
· "sella grounding" → {"action":"sendero_accion","nombre":"grounding","confidence":0.9}
· "nueva nota que diga hoy vi un colibrí en la ventana" → {"action":"nota_accion","op":"crear","titulo":null,"cuerpo":"Hoy vi un colibrí en la ventana","confidence":0.95}
· "nueva carpeta llamada sueños lúcidos" → {"action":"nota_accion","op":"carpeta","nombre":"Sueños lúcidos","confidence":0.95}
· "elimina la racha de los calcetines" → {"action":"racha_accion","op":"eliminar","titulo":"Calcetines","titulo_nuevo":null,"inicio_local":null,"confidence":0.95}
· "borra la racha veganismo" → {"action":"racha_accion","op":"eliminar","titulo":"Veganismo","titulo_nuevo":null,"inicio_local":null,"confidence":0.95}
· "renombra la racha agua a tomar agua al despertar" → {"action":"racha_accion","op":"renombrar","titulo":"Agua","titulo_nuevo":"Tomar agua al despertar","inicio_local":null,"confidence":0.95}
· "cámbiale el nombre a la racha flores por jardín" → {"action":"racha_accion","op":"renombrar","titulo":"Flores","titulo_nuevo":"Jardín","inicio_local":null,"confidence":0.9}
· "quita la misión comprar dátiles" → {"action":"plan_accion","op":"eliminar","titulo":"Comprar dátiles","titulo_nuevo":null,"confidence":0.95}
· "renombra la misión comprar dátiles a comprar dátiles y nueces" → {"action":"plan_accion","op":"renombrar","titulo":"Comprar dátiles","titulo_nuevo":"Comprar dátiles y nueces","confidence":0.9}
· "borra la nota del colibrí" → {"action":"nota_accion","op":"eliminar","titulo":"Colibrí","titulo_nuevo":null,"confidence":0.9}
· "renombra la nota colibrí a ventana de la mañana" → {"action":"nota_accion","op":"renombrar","titulo":"Colibrí","titulo_nuevo":"Ventana de la mañana","confidence":0.9}
· "borra todas mis rachas" → {"action":"UNKNOWN","confidence":0}
${
        ctx.rollover
            ? `· "suelta la dos" → {"action":"rollover_accion","op":"soltar","objetivo":"2","fecha_local":null,"confidence":0.9}
· "suelta lo de llamar al doctor" → {"action":"rollover_accion","op":"soltar","objetivo":"llamar al doctor","fecha_local":null,"confidence":0.9}
· "muévelas todas a hoy" → {"action":"rollover_accion","op":"hoy","objetivo":"todas","fecha_local":null,"confidence":0.95}
· "suéltalas todas" → {"action":"rollover_accion","op":"soltar","objetivo":"todas","fecha_local":null,"confidence":0.95}
· "reprograma la uno" → {"action":"rollover_accion","op":"reprogramar","objetivo":"1","fecha_local":null,"confidence":0.9}
· "reprogramala para el jueves" → {"action":"rollover_accion","op":"reprogramar","objetivo":"","fecha_local":"<el próximo jueves>","confidence":0.85}`
            : `· "suelta la dos" → {"action":"UNKNOWN","confidence":0} (no hay vectores de ayer en pantalla)`
    }
· "quiero contemplar mi realidad" → {"action":"realidad_accion","op":"contemplar","angulo":null,"texto":null,"confidence":0.95}
· "en abundancia escribe que mis ingresos fluyen sin esfuerzo" → {"action":"realidad_accion","op":"dictar","angulo":"financiero","texto":"Mis ingresos fluyen sin esfuerzo","confidence":0.9}
· "en mi realidad de vínculos pon que mi familia está en paz" → {"action":"realidad_accion","op":"dictar","angulo":"orbita","texto":"Mi familia está en paz","confidence":0.9}

`
            : ""
    }REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin bloques de código.
2. Formato exacto: {"action":"<id>","confidence":<0.0-1.0>}${conAcciones ? ' — o el formato de racha_accion de arriba cuando la frase pide una acción de rachas.' : ""}
3. El valor de "action" DEBE ser uno de los id de la lista, copiado tal cual. Jamás inventes un id.
4. Si la frase no corresponde con claridad a un destino, o si dudas entre dos, responde {"action":"UNKNOWN","confidence":0}. Equivocarse de pantalla es peor que admitir que no se entendió.
5. La transcripción viene de un reconocedor de voz: puede tener palabras mal escritas o faltantes. Interpreta la INTENCIÓN, no la literalidad.
6. Si la persona describe una necesidad en lugar de nombrar una pantalla, elige el destino que resuelve esa necesidad. Ejemplo: "no sé qué tengo que hacer hoy" corresponde al destino de misiones del día.
7. Nunca expliques tu decisión.`
}

/* ═════════════ LOS PROVEEDORES ═════════════ */

async function llamarGroq(
    key: string,
    system: string,
    texto: string,
    modeloPedido?: string
): Promise<string | null> {
    const modelo =
        modeloPedido || Deno.env.get("VOZ_MODEL") || MODELO_GROQ_DEFAULT
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: modelo,
            temperature: 0,
            max_tokens: 140,
            /* Structured output: el proveedor garantiza JSON sintáctico. */
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: system },
                { role: "user", content: texto },
            ],
        }),
    })
    if (!r.ok) {
        console.error("[voz-intent] groq", r.status, await r.text())
        return null
    }
    const j = await r.json()
    return j?.choices?.[0]?.message?.content ?? null
}

async function llamarOpenRouter(
    key: string,
    system: string,
    texto: string,
    modeloPedido?: string
): Promise<string | null> {
    const modelo =
        modeloPedido || Deno.env.get("VOZ_MODEL") || MODELO_OR_DEFAULT
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: modelo,
            temperature: 0,
            max_tokens: 140,
            response_format: { type: "json_object" },
            /* El mismo modelo lo sirven varios proveedores a velocidades muy
               distintas; aquí la latencia es la feature. */
            provider: { sort: "throughput" },
            messages: [
                { role: "system", content: system },
                { role: "user", content: texto },
            ],
        }),
    })
    if (!r.ok) {
        console.error("[voz-intent] openrouter", r.status, await r.text())
        return null
    }
    const j = await r.json()
    return j?.choices?.[0]?.message?.content ?? null
}

/** Aísla el objeto JSON aunque el modelo lo envuelva en texto o en un bloque
    de código (patrón ya probado en el carrusel del Atelier). */
function aislarJson(s: string): string | null {
    const i = s.indexOf("{")
    if (i < 0) return null
    let prof = 0
    let enStr = false
    let esc = false
    for (let k = i; k < s.length; k++) {
        const c = s[k]
        if (esc) {
            esc = false
            continue
        }
        if (c === "\\") {
            esc = true
            continue
        }
        if (c === '"') enStr = !enStr
        if (enStr) continue
        if (c === "{") prof++
        else if (c === "}") {
            prof--
            if (prof === 0) return s.slice(i, k + 1)
        }
    }
    return null
}

/* ═════════════ EL GOBERNADOR DE GASTO ═════════════ */

async function reservarGasto(userKey: string, ip: string): Promise<boolean> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    /* Fail-open: si la infraestructura del gobernador no está, el comando de
       voz no se rompe (el costo real es despreciable). */
    if (!supaUrl || !supaKey) return true
    try {
        const res = await fetch(`${supaUrl}/rest/v1/rpc/reserve_edge_spend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
            },
            body: JSON.stringify({
                p_edge: "voz-intent",
                p_user_key: userKey,
                p_ip: ip,
                p_cost: 1,
                p_user_limit: LIMITE_PERSONA,
                p_user_window_seconds: DAY_SECONDS,
                p_ip_limit: 0,
                p_ip_window_seconds: DAY_SECONDS,
                p_global_limit: LIMITE_GLOBAL,
                p_global_window_seconds: DAY_SECONDS,
            }),
        })
        if (!res.ok) return true
        const j = await res.json().catch(() => null)
        if (j === false) return false
        if (j && typeof j === "object" && j.allowed === false) return false
        return true
    } catch {
        return true
    }
}

/* ═════════════ LAS FRASES QUE NO SUPIMOS RESOLVER ═════════════
   Idea de Zak (2026-08-06): los tripulantes nos dan la llave para afinar.
   🜂 Diseño conservador a propósito: SOLO se anota lo que FALLÓ (un acierto
   no enseña nada), NUNCA quién lo dijo (un hash irreversible con sal del
   servidor, cuyo único uso es no contar diez veces al mismo), y jamás lo que
   resolvió el reconocedor LOCAL — eso ni sale del teléfono. Fire-and-forget:
   si esto falla, el comando de voz ni se entera. */
async function anotarSinResolver(
    texto: string,
    lang: string,
    familia: string,
    ctx: unknown,
    userId: string
) {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey || !texto) return
    try {
        /* Hash con sal del servidor: irreversible, y sin la sal ni siquiera
           se puede rehacer desde fuera. */
        const sal = Deno.env.get("VOZ_HASH_SALT") || supaKey.slice(0, 24)
        const datos = new TextEncoder().encode(sal + "|" + userId)
        const buf = await crypto.subtle.digest("SHA-256", datos)
        const hash = Array.from(new Uint8Array(buf).slice(0, 10))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        await fetch(`${supaUrl}/rest/v1/voz_frases_sin_resolver`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: supaKey,
                Authorization: `Bearer ${supaKey}`,
                Prefer: "return=minimal",
            },
            body: JSON.stringify({
                texto: texto.slice(0, 300),
                lang,
                familia: familia || null,
                contexto: ctx ?? {},
                quien_hash: hash,
            }),
        })
    } catch {
        /* Silencio absoluto: esto jamás puede estorbar a la voz. */
    }
}

/* ═════════════ HANDLER ═════════════ */

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
    if (req.method !== "POST") return json({ error: "method" }, 405)

    let body: any = null
    try {
        body = await req.json()
    } catch {
        return json({ action: "UNKNOWN", confidence: 0, error: "bad_body" }, 400)
    }

    /* Sesión verificada: el id sale del token firmado, no del cuerpo. */
    const g = await gateUser(body?.token)
    if (!g.ok)
        return json(
            { action: "UNKNOWN", confidence: 0, error: g.error },
            g.status ?? 401
        )

    const texto = String(body?.texto ?? "").slice(0, 300).trim()
    const lang = body?.lang === "en" ? "en" : "es"
    const destinos: Destino[] = Array.isArray(body?.destinos)
        ? body.destinos
              .filter((d: any) => d && typeof d.id === "string")
              .slice(0, 80)
              .map((d: any) => ({
                  id: String(d.id).slice(0, 40),
                  desc: String(d.desc ?? "").slice(0, 200),
                  ejemplos: Array.isArray(d.ejemplos)
                      ? d.ejemplos.slice(0, 3).map((e: any) => String(e).slice(0, 60))
                      : [],
              }))
        : []

    /* v1.1 — el cliente que sabe ejecutar ACCIONES lo declara; uno viejo no
       manda el flag y la respuesta jamás trae un formato que no entienda. */
    const conAcciones = body?.acciones === true
    const hoyIso = String(body?.hoy_iso ?? "").slice(0, 40)
    /* v1.6 — el ESCENARIO: qué está mostrando la app. Gobierna qué secciones
       del prompt existen (el rollover solo se enseña si está en pantalla:
       antes el modelo mandaba ahí cualquier frase con número, porque era el
       único formato numerado que conocía). */
    const ctx = {
        rollover: body?.contexto?.rollover === true,
        plan_abierto: body?.contexto?.plan_abierto === true,
        /* v1.9 — los títulos de HOY: con ellos el modelo entiende "ya fui al
           súper" sin adivinar y sabe a cuál se refiere. Viajan desde el
           cliente (misma regla que el catálogo: el servidor no inventa nada
           que la app no tenga). */
        misiones_hoy: Array.isArray(body?.contexto?.misiones_hoy)
            ? body.contexto.misiones_hoy
                  .slice(0, 20)
                  .map((x: any) => String(x ?? "").slice(0, 80))
                  .filter(Boolean)
            : [],
        /* 🜂 v1.10 · FASE E — el contexto vivo, validado campo por campo
           (misma regla que todo lo que viaja del cliente). */
        capa_activa: String(body?.contexto?.capa_activa ?? "").slice(0, 24),
        lista_visible: Array.isArray(body?.contexto?.lista_visible)
            ? body.contexto.lista_visible
                  .slice(0, 30)
                  .map((x: any) => ({
                      n: Number(x?.n) || 0,
                      titulo: String(x?.titulo ?? "").slice(0, 90),
                  }))
                  .filter((x: any) => x.n > 0 && x.titulo)
            : [],
    }
    const familiaCliente = String(body?.familia ?? "").slice(0, 20)

    if (!texto || !destinos.length)
        return json({ action: "UNKNOWN", confidence: 0 })

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0"
    const permitido = await reservarGasto(g.userId ?? "anon", ip)
    if (!permitido)
        return json({ action: "UNKNOWN", confidence: 0, error: "rate_limit" }, 429)

    const system = construirSystem(destinos, lang, conAcciones, hoyIso, ctx)
    const groqKey = Deno.env.get("GROQ_API_KEY")
    const orKey = Deno.env.get("OPENROUTER_API_KEY")

    const modeloGroq = conAcciones
        ? Deno.env.get("VOZ_MODEL_ACCIONES") || MODELO_GROQ_ACCIONES
        : undefined
    const modeloOr = conAcciones
        ? Deno.env.get("VOZ_MODEL_ACCIONES") || MODELO_OR_ACCIONES
        : undefined

    let crudo: string | null = null
    try {
        if (groqKey) crudo = await llamarGroq(groqKey, system, texto, modeloGroq)
        if (!crudo && orKey)
            crudo = await llamarOpenRouter(orKey, system, texto, modeloOr)
    } catch (e) {
        console.error("[voz-intent] proveedor", String(e))
    }

    if (!crudo) return json({ action: "UNKNOWN", confidence: 0, error: "sin_respuesta" })

    const recorte = aislarJson(crudo)
    if (!recorte) return json({ action: "UNKNOWN", confidence: 0 })

    let parsed: any = null
    try {
        parsed = JSON.parse(recorte)
    } catch {
        return json({ action: "UNKNOWN", confidence: 0 })
    }

    const accion = String(parsed?.action ?? "UNKNOWN")

    /** Una sola puerta: cualquier UNKNOWN de la interpretación se anota
        (con la frase) antes de contestar. */
    const noEntendi = (conf = 0) => {
        if (conAcciones)
            void anotarSinResolver(texto, lang, familiaCliente, ctx, g.userId ?? "anon")
        return json({ action: "UNKNOWN", confidence: conf })
    }

    /* v1.2 — inicio_local "YYYY-MM-DD HH:MM" validado por FORMA (la zona es
       de la persona; el cliente lo aterriza a Date local y le pone el techo
       del ahora). */
    const limpiaLocal = (raw: unknown): string | null => {
        const t = String(raw ?? "").trim().replace("T", " ")
        return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t) ? t : null
    }

    /* v1.4 — el nombre nuevo de un renombre. Vacío = la orden está coja y no
       se devuelve: renombrar a "" borraría el título de la fila. */
    const nombreNuevo = (raw: unknown, tope: number): string | null => {
        const t = String(raw ?? "").trim().slice(0, tope)
        return t || null
    }

    if (conAcciones && accion === "plan_accion") {
        const op = String(parsed?.op ?? "")
        if (
            !["agregar", "completar", "eliminar", "renombrar", "mover", "ver"].includes(op)
        )
            return noEntendi()
        const confP = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
        if (confP < 0.5) return noEntendi(confP)
        const fechaP = (() => {
            const f = String(parsed?.fecha_local ?? "").trim()
            return /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null
        })()
        /* VER: la fecha es opcional (sin ella la app enseña hoy). */
        if (op === "ver")
            return json({ action: "plan_accion", op, fecha_local: fechaP, confidence: confP })
        const numero = Number.isInteger(parsed?.numero)
            ? Number(parsed.numero)
            : null
        const todasP = parsed?.todas === true
        const titulo = String(parsed?.titulo ?? "").trim().slice(0, 80)
        /* MOVER: sin fecha no hay orden; sin objetivo (título o número) tampoco. */
        if (op === "mover") {
            if (!fechaP || (!titulo && numero == null))
                return noEntendi()
            return json({
                action: "plan_accion",
                op,
                titulo,
                numero,
                fecha_local: fechaP,
                confidence: confP,
            })
        }
        /* Completar/eliminar aceptan número o "todas" en vez de título;
           agregar y renombrar siguen exigiendo el título. */
        if (!titulo && numero == null && !(op === "completar" && todasP))
            return noEntendi()
        const nuevoP = nombreNuevo(parsed?.titulo_nuevo, 80)
        if (op === "renombrar" && !nuevoP)
            return noEntendi()
        /* v1.6 — varias misiones de un tirón (solo al AGREGAR: completar,
           eliminar y renombrar actúan sobre UNA nombrada). */
        const brutos = Array.isArray(parsed?.titulos) ? parsed.titulos : []
        const titulos = brutos
            .map((x: any) => String(x ?? "").trim().slice(0, 80))
            .filter(Boolean)
            .slice(0, 10)
        return json({
            action: "plan_accion",
            op,
            /* v1.8 — el encadenado "hacer y preguntar", solo tras completar. */
            y_luego:
                op === "completar" && parsed?.y_luego === "ver" ? "ver" : null,
            titulo,
            titulos:
                (op === "agregar" || op === "completar") && titulos.length
                    ? titulos
                    : titulo
                      ? [titulo]
                      : [],
            numero,
            todas: op === "completar" ? todasP : false,
            titulo_nuevo: nuevoP,
            confidence: confP,
        })
    }
    /* v1.5 — VECTORES DE AYER. El objetivo puede ser un número, un texto o
       "todas": la app lo resuelve contra lo que tiene EN PANTALLA (es la única
       que sabe qué está mostrando). Aquí solo se valida la forma. */
    if (conAcciones && accion === "rollover_accion") {
        /* Sin la ceremonia en pantalla este formato ni se enseñó; si el
           modelo lo inventa igual, muere aquí. */
        if (!ctx.rollover) return noEntendi()
        const op = String(parsed?.op ?? "")
        if (!["soltar", "hoy", "reprogramar"].includes(op))
            return noEntendi()
        const confR = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
        if (confR < 0.5) return noEntendi(confR)
        const objetivo = String(parsed?.objetivo ?? "").trim().slice(0, 80)
        /* La fecha se valida por FORMA y jamás se acepta en el pasado: mover
           un pendiente a ayer lo dejaría igual de vencido. */
        let fecha: string | null = null
        const fl = String(parsed?.fecha_local ?? "").trim()
        if (op === "reprogramar" && /^\d{4}-\d{2}-\d{2}$/.test(fl)) fecha = fl
        return json({
            action: "rollover_accion",
            op,
            objetivo,
            fecha_local: fecha,
            confidence: confR,
        })
    }
    /* v1.5 — REALIDAD ELEGIDA. Solo contemplar y dictar: sellar, re-anclar y
       borrar son de la ceremonia y se hacen con las manos. */
    if (conAcciones && accion === "realidad_accion") {
        const op = String(parsed?.op ?? "")
        if (!["contemplar", "dictar"].includes(op))
            return noEntendi()
        const confV = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
        if (confV < 0.5) return noEntendi(confV)
        if (op === "contemplar")
            return json({ action: "realidad_accion", op, confidence: confV })
        const ANG = ["fisico", "mental", "emocional", "financiero", "vector", "orbita"]
        const angulo = String(parsed?.angulo ?? "").trim()
        const texto = String(parsed?.texto ?? "").trim().slice(0, 600)
        if (!ANG.includes(angulo) || !texto)
            return noEntendi()
        return json({ action: "realidad_accion", op, angulo, texto, confidence: confV })
    }
    if (conAcciones && accion === "sendero_accion") {
        const nombre = String(parsed?.nombre ?? "").trim().slice(0, 60)
        if (!nombre) return noEntendi()
        const confS = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
        if (confS < 0.5) return noEntendi(confS)
        return json({ action: "sendero_accion", nombre, confidence: confS })
    }
    if (conAcciones && accion === "nota_accion") {
        const op = String(parsed?.op ?? "")
        const confN = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
        if (confN < 0.5) return noEntendi(confN)
        if (op === "carpeta") {
            const nombre = String(parsed?.nombre ?? "").trim().slice(0, 60)
            if (!nombre) return noEntendi()
            return json({ action: "nota_accion", op, nombre, confidence: confN })
        }
        if (op === "crear") {
            const cuerpo = String(parsed?.cuerpo ?? "").trim().slice(0, 2000)
            if (!cuerpo) return noEntendi()
            const titulo = String(parsed?.titulo ?? "").trim().slice(0, 80)
            return json({
                action: "nota_accion",
                op,
                titulo: titulo || null,
                cuerpo,
                confidence: confN,
            })
        }
        /* v1.4 — borrar / renombrar una nota EXISTENTE: se identifica por su
           título actual (el cliente la busca por cobertura difusa). */
        if (op === "eliminar" || op === "renombrar") {
            const titulo = String(parsed?.titulo ?? "").trim().slice(0, 80)
            if (!titulo) return noEntendi()
            const nuevoN = nombreNuevo(parsed?.titulo_nuevo, 80)
            if (op === "renombrar" && !nuevoN)
                return noEntendi()
            return json({
                action: "nota_accion",
                op,
                titulo,
                titulo_nuevo: nuevoN,
                confidence: confN,
            })
        }
        return json({ action: "UNKNOWN", confidence: conf })
    }

    /* v1.1 — ACCIÓN DE RACHAS: se valida cada campo antes de devolverla.
       op fuera de la lista, título vacío en crear, o un inicio futuro →
       UNKNOWN (mejor pedir de nuevo que ejecutar algo torcido). */
    if (conAcciones && accion === "racha_accion") {
        const op = String(parsed?.op ?? "")
        if (
            !["crear", "reiniciar", "pausar", "reanudar", "eliminar", "renombrar", "fecha"].includes(op)
        )
            return noEntendi()
        const titulo = String(parsed?.titulo ?? "").trim().slice(0, 60)
        if (!titulo) return noEntendi()
        const nuevoR = nombreNuevo(parsed?.titulo_nuevo, 60)
        if (op === "renombrar" && !nuevoR)
            return noEntendi()
        const inicioLocal = limpiaLocal(parsed?.inicio_local)
        /* Cambiar la fecha sin decir a cuál es media orden: mejor volver a
           preguntar que mover el inicio a un lugar inventado. */
        if (op === "fecha" && !inicioLocal)
            return noEntendi()
        let inicio: string | null = null
        const rawIso = parsed?.inicio_iso
        if (typeof rawIso === "string" && rawIso.trim()) {
            const t = Date.parse(rawIso)
            if (Number.isFinite(t)) {
                const ahora = Date.now()
                inicio = new Date(Math.min(t, ahora)).toISOString()
            }
        }
        const confA = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
        if (confA < 0.5) return noEntendi(confA)
        return json({
            action: "racha_accion",
            op,
            titulo,
            titulo_nuevo: nuevoR,
            inicio_local: inicioLocal,
            inicio_iso: inicio,
            confidence: confA,
        })
    }

    /* Blindaje final: aunque el modelo invente un id, aquí no pasa. */
    const valido = destinos.some((d) => d.id === accion)
    if (!valido) return noEntendi()

    const conf = Math.max(0, Math.min(1, Number(parsed?.confidence) || 0))
    /* Por debajo de 0.5 preferimos admitir que no se entendió. */
    if (conf < 0.5) return noEntendi(conf)

    return json({ action: accion, confidence: conf })
})
