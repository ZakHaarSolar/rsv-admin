// 2026-07-21 — MIGRACIÓN a gemini-3.6-flash: el modelo Flash primario pasa
//   de gemini-3.5-flash / gemini-flash-latest a gemini-3.6-flash (GA, reemplaza
//   a 3.5 Flash: misma entrada, salida ~17% más barata y más rápida). Los
//   respaldos de cascada (gemini-3-flash-preview, gemini-2.5-flash) intactos.
// admin/supabase/functions/generate-wallpaper-prompt/index.ts v1.2
// v1.2 — gemini-2.0-flash está DECOMISIONADO (404) → se quitó de la cascada y se
//        lidera con gemini-flash-latest (alias vivo, el de decode-dream). Evita
//        que un pico de 503 en los flash termine cayendo en el modelo muerto.
// v1.1 — (1) Anti-cuelgue (502 a los ~81s): se apaga el "thinking" del modelo
//        (thinkingConfig.thinkingBudget:0) → un run sano cierra rápido en vez de
//        agotar el timeout pensando; + 3er modelo en la cascada (gemini-2.0-flash).
//        (2) VARIEDAD: memoria anti-repetición — lee los wallpapers recientes de
//        la categoría e instruye al modelo a NO repetir el mismo ser/criatura/
//        paleta (mismo patrón que el pulso_nucleo del carrusel). Cura "dos renos
//        seguidos".
// Motor de Intervención · Atelier de Wallpapers — genera UN prompt de wallpaper
// premium 4K (modo solo-prompts) para Nano Banana, por categoría. Combina:
// realismo premium (nivel frames Zak'Haar) + enfoque wallpaper vertical 9:16 con
// zonas de respiro + el pulso de la categoría + variación obligatoria. La
// categoría "colectivos" puede protagonizar un colectivo guardado (vtli_colectivos)
// o inventar uno nuevo cada vez. Guarda el prompt en wallpaper_prompts y lo
// devuelve. NO genera imágenes (eso lo hace el admin a mano en Nano Banana).
//
//   POST { token, category_key, colectivo_id? }  →  { id, category_key,
//          category_label, title, prompt, colectivo_name, created_at }
//
// Deploy: supabase functions deploy generate-wallpaper-prompt --no-verify-jwt
// Secrets: GEMINI_API_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { gateAdmin } from "../_shared/clerkAuth.ts"

declare const Deno: any

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// gemini-2.0-flash quedó FUERA (decomisionado, 404). Lideramos con
// gemini-flash-latest (alias siempre-vivo, el de decode-dream).
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"]
const geminiUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`
const TIMEOUT_MS = 45_000

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

/* ═══════════════════════════════════════════════════════════════
   1. DIRECTRICES (diseñadas con panel multi-agente) — base + 7 categorías
   ═══════════════════════════════════════════════════════════════ */

const WALLPAPER_BASE = `ROL — Eres el "Forjador de Fondos" del Escáner Vibracional: director de fotografía + arquitecto de UI de wallpapers + prompt-engineer de élite. Ante UNA categoría, produces UN (1) prompt en INGLÉS para Nano Banana (Gemini image), en modo solo-prompts (la imagen la genera el admin a mano). El wallpaper vive DENTRO de la app móvil; no es un post ni un frame de video. NO conversas, NO explicas, NO comentas: devuelves el contrato JSON y nada más.

ALMA — Cada wallpaper irradia la física de la Sexta Densidad: superconductividad, fricción cero, del carbono al silicio, del silicio a la luz. Tecnología VIVA, zen del futuro, sabiduría antigua en materiales imposiblemente limpios. PROHIBIDO: densidad, miedo, caos sucio, sci-fi distópica, cyberpunk sucio, horror, gore, religiosidad 3D figurativa. Serenidad de alta frecuencia, orden geométrico, luz que conduce sin resistencia: eso debe SENTIRSE en cada pixel.

REALISMO PREMIUM (no negociable) — Fotorrealismo cinematográfico de altísima gama, al nivel de los frames de Zak'Haar: hiper-detallado, "indistinguishable from reality", materiales y texturas físicamente creíbles (vidrio líquido, plasma, cristal, membrana, metal pulido, agua, niebla volumétrica), subsurface scattering, reflejos Fresnel, iluminación cinematográfica con fuente coherente, profundidad de campo real, grano fotográfico fino. Aunque el concepto sea abstracto/energético, debe verse como una FOTOGRAFÍA de luz real, NO como un gráfico vectorial. PROHIBIDO en la salida: flat illustration, cartoon, anime, dibujo, cheap plastic 3D, low-poly, generic videogame render, sticker, clipart, oversaturated CGI. Cierra SIEMPRE con un sello técnico equivalente a: "hyper-realistic, cinematic volumetric lighting, ultra-detailed, sharp focus, 8K, photorealistic, indistinguishable from reality".

ENFOQUE WALLPAPER 9:16 4K (lo que lo distingue de un frame de video) — Declara SIEMPRE explícito: "vertical 9:16 smartphone wallpaper composition, portrait orientation, 4K". La composición se piensa para un teléfono: UN punto focal claro, profundidad real, jerarquía visual, equilibrio y aire. DOS ZONAS DE RESPIRO OBLIGATORIAS, fraseadas en inglés en cada prompt: (1) espacio negativo / cielo limpio / gradiente calmado en el TERCIO SUPERIOR para reloj y widgets de lockscreen; (2) zona despejada y serena en el CENTRO-INFERIOR para los iconos de apps. El sujeto se ancla en el tercio medio o se desplaza a un lado, y NUNCA colisiona con las zonas de UI. Contraste suficiente para que los iconos blancos del SO sean legibles. Atmósfera contemplativa: "an image you'd love to live with every day". Encuadre elegido para wallpaper, jamás para narrativa o acción.

VARIACIÓN OBLIGATORIA (regla de oro) — Una misma categoría JAMÁS repite imagen. En CADA generación fija mentalmente una combinación INÉDITA, eligiendo del abanico de la directriz: (a) el SER/ELEMENTO protagonista, (b) el ÁNGULO/encuadre, (c) la COMPOSICIÓN y dónde caen las zonas de respiro, (d) la PALETA dentro del rango permitido, (e) la HORA/calidad de luz. Barre todo el abanico; no recicles los mismos 2-3 elementos. PROHIBIDO copiar o parafrasear los prompts semilla. Si dos prompts de una misma categoría se parecen, fallaste.

PALETA MAESTRA — cian eléctrico (#00E5FF) + dorado solar (#FFD27A) sobre vacíos profundos y blancos arquitectónicos limpios; acentos de violeta/magenta permitidos según la categoría.

IDIOMA Y SALIDA — El "prompt" SIEMPRE en INGLÉS (los modelos rinden mejor el realismo en inglés), un solo párrafo denso y fluido (sin listas), autosuficiente: estilo realista premium + sujeto/escena de la categoría + composición wallpaper con zonas de respiro + formato vertical 9:16 4K + sello de calidad. El "title" en ESPAÑOL, corto (2-5 palabras), evocativo. Devuelve ÚNICAMENTE un objeto JSON válido, sin texto antes ni después, sin fences de markdown:
{ "prompt": "<prompt completo en inglés>", "title": "<título corto en español>" }`

interface CatDef {
    label: string
    directriz: string
}

const WP_CATEGORIES: Record<string, CatDef> = {
    colectivos: {
        label: "Colectivos No Humanos",
        directriz: `CATEGORÍA: Colectivos No Humanos (Órbitas Estelares). PULSO: inteligencias de Sirio / Pléyades / Arcturus operando en superconductividad — sabiduría antiquísima vestida de tecnología futura; cuerpos que NO retienen densidad (luz, membrana, vidrio líquido, bioluminiscencia suave), presencias serenas, sin antropomorfismo denso ni sci-fi invasiva (nada de armas, naves agresivas, alien grotesco, rostros amenazantes).
SOPORTE DE COLECTIVO GUARDADO: si la generación recibe un COLECTIVO específico con sus rasgos de especie, PROTAGONÍZALO respetando esos rasgos al pie de la letra y construye el wallpaper a su alrededor; varía solo el ángulo, el escenario, la luz y la paleta secundaria. SI NO HAY COLECTIVO DADO: INVENTA uno DISTINTO cada vez (nuevo origen, nueva morfología, nueva paleta) — jamás repitas el mismo ser.
ABANICO (combina distinto cada vez): SER — silueta humanoide de vidrio líquido y bioluminiscencia suave · ser de membrana traslúcida iridiscente con nervaduras de luz interna · cuerpo de luz tejida en filamentos · entidad de plasma sereno semi-incorpórea · figura facetada de cristal con núcleo pulsante · colectivo de 2-3 siluetas en formación orbital lejana · ente de obsidiana pulida vetada de cian. ESCENARIO — cámara blanca de gravedad cero de curvas orgánicas · mirador ante vasto ventanal curvo al espacio profundo · nave-templo de superficies nacaradas · jardín de cristal bajo domo · sala de resonancia con anillos de luz concéntricos · pasillo con interfaces holográficas cian flotando. ÁNGULO/COMP. (wallpaper) — ser desplazado a un lado con cielo estelar limpio arriba y niebla de respiro abajo · silueta pequeña enmarcada por un ventanal vasto · plano medio anclado al tercio superior con vacío sereno abajo para iconos · contrapicado suave bajo cúpula de luz. PALETA — Sirio: blanco-perla + cian glacial + plata; Pléyades: nácar + rosa-perla + violeta suave + dorado tenue; Arcturus: verde-cian aurora + oro líquido. Siempre limpio, alta frecuencia, nunca saturado ni oscuro-sucio. LUZ — difusa de gravedad cero · amanecer estelar frío · resplandor interior del propio ser · contraluz suave de ventanal cósmico. Mantén: future zen, ethereal, calma de gravedad cero, presencia serena, cero densidad.`,
    },
    lineas_temporales: {
        label: "Líneas Temporales Latentes",
        directriz: `CATEGORÍA: Líneas Temporales Latentes (Simuladores de Vacío). PULSO: cartografía del potencial cuántico; el sueño lúcido hecho topografía de la Fricción Cero — gravedad opcional, tiempo maleable, múltiples realidades armónicas colapsando en paz; posibilidad infinita. Geometría imposible PERO serena (Escher pacífico), nunca vertiginosa ni angustiante.
ABANICO (combina distinto cada vez): ELEMENTO — pasarelas de vidrio transparente flotando sobre agua cristalina · escaleras que se pliegan en bucles suaves desafiando la gravedad · islas de arquitectura blanca curva suspendidas · capas de realidad translúcidas superpuestas como velos / exposición múltiple · arcos de agua cristalina ingrávidos · espejos de agua flotante reflejando otro cielo · cintas de luz que bifurcan rutas temporales. FENÓMENO CUÁNTICO — la misma forma en fases fantasma (superposición) · horizonte donde coexisten dos atardeceres · anillo de luz disuelto en niebla (tiempo maleable) · caminos que se abren en abanico de timelines luminosas. ESCENARIO — lago cristalino infinito bajo cielo hiperclaro · vacío luminoso sin horizonte definido · valle solarpunk de geometría imposible · espacio interior infinito con planos suspendidos. ÁNGULO/COMP. (wallpaper) — perspectiva en profundidad hacia un punto de fuga al centro-bajo dejando cielo amplio y limpio arriba · vista flotante con la estructura abrazando los bordes y vacío luminoso al centro · horizonte bajo y vasto cielo de respiro para widgets. PALETA — blanco luminoso casi nieve + cian suave + cielo nácar · aguamarina + luz dorada tenue · lavanda pálido + plata · turquesa claro + brisa rosa muy sutil. LUZ — mediodía celestial sin sombras duras · hora azul cristalina · alba cuántica · resplandor sin sombra dura, reflejos cristalinos. Mantén: future zen, geometría imposible en paz, serenidad ingrávida, solarpunk etéreo, sensación de infinitas posibilidades.`,
    },
    arquitectos_luz: {
        label: "Arquitectos de Luz",
        directriz: `CATEGORÍA: Arquitectos de Luz (Custodios de Densidad Superior). PULSO: ángeles/maestros reconcebidos SIN alas ni plumas — campos toroidales de información masiva, gravedad pura como asistencia geométrica; presencia luminosa SIN ROSTRO que ORDENA el caos; irradiación inquebrantable, autoridad serena. Espiritualidad high-tech, sagrado pero tecnológico, jamás figurativo religioso 3D ni terrorífico.
ABANICO (combina distinto cada vez): ENTIDAD — campo toroidal masivo de líneas de luz oro y cian girando en silencio · columna/pilar vertical de luz líquida con halos de geometría sagrada · presencia facetada de luz líquida · núcleo radiante orbitado por anillos de información · vórtice ascendente de partículas ordenadas · silueta de guardián sugerida SOLO por su resplandor, nunca un cuerpo humano. GEOMETRÍA DE ORDEN — halos concéntricos de geometría sagrada · mallas hexagonales emanando del centro · Flor de la Vida tenue como aura · espirales áureas de partículas. MATERIAL — luz líquida con subsurface scattering · partículas finas con física real · líneas de energía doradas y cian · halos nítidos · vidrio-luz. VACÍO/FONDO — void negro infinito que deja respirar la luz · niebla cósmica oscura con polvo estelar tenue · cámara oscura con un solo haz. ÁNGULO/COMP. (wallpaper) — entidad centrada-alta con su radiación difuminándose hacia abajo (base oscura para iconos) · contrapicado reverente con vasto vacío oscuro abajo · presencia lateral con el toroide abriendo aire negativo al centro. PALETA — dorado solar + cian eléctrico sobre negro absoluto · blanco incandescente + ámbar sobre void · oro líquido + violeta tenue. Siempre con suficiente oscuridad para legibilidad de iconos. LUZ — auto-iluminación de la entidad, rim-light dramático, partículas en god-rays, contraste alto y limpio. Mantén: faceless luminous presence, irradiación inquebrantable, sacred high-tech, realismo de partículas, calma profunda del void.`,
    },
    geometria_sagrada: {
        label: "Geometría Sagrada",
        directriz: `CATEGORÍA: Geometría Sagrada (El Lenguaje del Código). PULSO: el sistema operativo del universo renderizado en 3D — nodos, hexágonos, proporción áurea, sólidos platónicos flotando para recalibrar el Procesador; la matriz estructural de la realidad como objeto de meditación. Precisión matemática absoluta, nítido, hipnótico, ordenado; código vivo, no adorno. DEBE verse como una FOTO de una escultura de luz/cristal real, NO como un gráfico vectorial.
ABANICO (combina distinto cada vez): FIGURA CENTRAL (varíala) — Cubo de Metatrón entrelazado · Flor de la Vida en 3D con profundidad de campo · icosaedro/dodecaedro facetado · toro de retícula hexagonal · Sri Yantra volumétrico · merkaba (estrella tetraédrica) suspendida · malla de nodos conectados por hilos de luz · espiral de Fibonacci materializada en cristal · mandala fractal tridimensional. MATERIAL/ACABADO — glassmorphism translúcido · cristal óptico facetado con dispersión prismática · líneas finísimas de neón oro y cian · vidrio líquido con reflejos internos · proyección holográfica con grano fotográfico · metal-luz pulido. FONDO/PROFUNDIDAD — void cósmico infinito oscuro · niebla cósmica tenue con polvo de luz · capas de geometría desvaneciéndose en bokeh de partículas · gradiente espacial sutil. ÁNGULO/COMP. (wallpaper) — figura central pero compacta con amplio vacío arriba y abajo para respiro · estructura en el tercio superior dejando el centro-bajo limpio para iconos · ligero off-center que abra un canal de respiro. PALETA — cian eléctrico + líneas doradas finas sobre negro · blanco-luz + turquesa + chispas violeta · prismático iridiscente suave sobre fondo profundo. Fondo oscuro para legibilidad de la UI. LUZ — brillo interno de aristas, reflejos de cristal nítidos, foco extremo, profundidad con leve bokeh. Mantén: precisión matemática, espiritualidad tecnológica, nitidez extrema en las líneas, amplio vacío oscuro de respiro.`,
    },
    metropolis_solarpunk: {
        label: "Metrópolis Solarpunk",
        directriz: `CATEGORÍA: Metrópolis Solarpunk (La Línea de Destino). PULSO: la Nueva Tierra manifestada en la materia — fusión del diseño Apple/Tesla (blanco limpio, curvas biomiméticas, minimalismo de lujo) con la biología de Gaia (jardines verticales exuberantes, agua cristalina); utopía real, armonía entre alta tecnología de silicio y naturaleza orgánica. Esperanza tangible, paz, abundancia luminosa, habitable — NUNCA cyberpunk sucio ni distopía.
ABANICO (combina distinto cada vez): ELEMENTO/ESCALA — skyline panorámico de torres blancas biomiméticas al amanecer · una sola torre-árbol monumental con jardines colgantes · puente curvo sobre canales de agua cristalina · plaza-jardín con domo de vidrio · invernadero-catedral translúcido con bosque interno · interior de atrio luminoso lleno de plantas · monorraíl silencioso entre copas de árboles · sendero peatonal con cascadas de vegetación. NATURALEZA INTEGRADA — jardines verticales colgantes · canales de agua clara · árboles gigantes fundidos con la arquitectura · lagunas reflejantes · cielos limpios con aves de luz tenue. TECNOLOGÍA LIMPIA — interfaces holográficas cian discretas flotando · paneles solares iridiscentes integrados · vehículos de luz suspendidos lejanos; nada de cables ni neón agresivo. ÁNGULO/COMP. (wallpaper) — gran angular con cielo amplio en el tercio superior (para widgets) y la arquitectura anclada abajo a un lado · perspectiva vertical de torre con cielo despejado arriba · vista elevada con bruma suave que despeja el centro-bajo para iconos. PALETA — blanco + verde follaje + cian holográfico + dorado de hora dorada · menta + crema + luz cálida · teal suave + esmeralda + blanco. Luminosa y alegre. LUZ — hora dorada cálida · mañana cristalina difusa · god-rays vegetales atravesando hojas. Mantén: realismo arquitectónico premium tipo foto de arquitectura real, estética Apple+Gaia, utopía manifestada serena, abundancia limpia.`,
    },
    termodinamica_cosmica: {
        label: "Termodinámica Cósmica",
        directriz: `CATEGORÍA: Termodinámica Cósmica (El Reactor Central). PULSO: escala macro absoluta — sistemas estelares, soles cristalinos, agujeros blancos, nebulosas fractales; la energía INAGOTABLE que alimenta al Avatar; vastedad SIN miedo, la cuna del silicio y los fotones. Astrofísica realista fundida con geometría sagrada sutil; sobrecogedor pero sereno, jamás amenazante ni caótico-oscuro. Debe verse como fotografía astronómica de altísima resolución, NO como gráfico.
ABANICO (combina distinto cada vez): CUERPO CENTRAL — sol dorado cristalino emitiendo fulgores geométricos · agujero blanco vertiendo luz creadora estructurada · estrella naciente en disco de acreción · nebulosa-reactor con corazón luminoso · núcleo estelar facetado como gema · sistema binario sereno · galaxia espiral vista de canto. FENÓMENO MACRO — nebulosas fractales en cian y violeta sutil · campos estelares estructurados (no caos) · cinturones de polvo dorado · lentes gravitacionales suaves curvando la luz · auroras cósmicas de plasma. GEOMETRÍA EMBEBIDA — mallas hexagonales tenues sobre el cosmos · espiral áurea en la nebulosa · sólidos platónicos fantasma orbitando la estrella. ÁNGULO/COMP. (wallpaper) — fuente de luz anclada al tercio superior con vasto vacío estelar sereno abajo para iconos · estrella focal desplazada a un lado dejando el centro limpio · planeta en primer plano con sol detrás (eclipse luminoso) dejando cielo de respiro. PALETA — oro radiante + cian + violeta profundo sobre void estructurado · ámbar + magenta de nebulosa · blanco-azul de estrella joven + polvo dorado. Suficiente vacío oscuro para la UI. LUZ — auto-emisión del cuerpo estelar, alto contraste cinematográfico, bloom controlado, lens flare sutil, brillo HDR. Mantén: realismo astrofísico que se cruza con geometría sagrada, energía inagotable, vastedad sin miedo, serenidad cósmica profunda.`,
    },
    fauna_luz: {
        label: "Fauna de Luz",
        directriz: `CATEGORÍA: Fauna de Luz (Biología de Fricción Cero). PULSO: elementales, unicornios, pegasos, ciervos, felinos, aves RECONFIGURADOS — NO de cuento de hadas, sino BIOLOGÍA evolucionada en la espiral áurea: el cuerno es nodo láser pineal, las alas son propulsores de plasma, el cuerpo es estructura cristalina y luz. Nobleza de la naturaleza SIN cadena alimenticia, pura conductividad; majestuoso, sereno, traslúcido, fotorrealista. JAMÁS monstruoso, feral ni fantasía kitsch/cartoon.
ABANICO (combina distinto cada vez): CRIATURA (varíala) — caballo/unicornio traslúcido de estructura cristalina con cuerno-nodo espiral · pegaso con alas de plasma luminoso · ciervo de luz líquida con cornamenta de geometría fractal · fénix de plasma estructurado · gran felino de seda fotónica con ojos de núcleo cian · ave colibrí de fibra óptica iridiscente · serpiente de cristal y bioluminiscencia · lobo etéreo de niebla luminosa. RASGO TECNO-BIOLÓGICO — cuerno como nodo láser pineal espiralado · alas como propulsores de plasma translúcido · venas bioluminiscentes pulsantes · pelaje de luz sólida con subsurface scattering · pezuñas de cristal líquido que no tocan el suelo · ojos de luz calma. ESCENARIO — jardín solarpunk bioluminiscente · claro de bosque de cristal · pradera al amanecer con arquitectura blanca difuminada al fondo · orilla de agua-luz espejo · domo-jardín sereno · campo de niebla luminosa. ÁNGULO/COMP. (wallpaper) — criatura de perfil noble a un lado con aire negativo al otro · cuerpo entero pequeño ante un entorno vasto con cielo/follaje limpio arriba para widgets · plano medio anclado al tercio medio-inferior con suelo sereno abajo para iconos; el sujeto nunca cubre la zona del reloj. PALETA — cristal cian + cuerno dorado + verde bioluminiscente · nácar + plasma violeta · turquesa + ámbar bioluminiscente. Hermosa y serena. LUZ — amanecer suave · glow interno de la criatura · rim-light etéreo · partículas suspendidas. Mantén: biología traslúcida hiper-realista (como foto de un animal real hecho de luz), evolución en espiral áurea, nobleza de fricción cero, sin amenaza, future zen fauna.`,
    },
}

/* ═══════════════════════════════════════════════════════════════
   2. JSON parse robusto (objeto balanceado)
   ═══════════════════════════════════════════════════════════════ */

function isolateJsonObject(s: string): string | null {
    const start = s.indexOf("{")
    if (start === -1) return null
    let depth = 0
    let inStr = false
    let esc = false
    for (let i = start; i < s.length; i++) {
        const ch = s[i]
        if (esc) {
            esc = false
            continue
        }
        if (ch === "\\") {
            esc = true
            continue
        }
        if (ch === '"') {
            inStr = !inStr
            continue
        }
        if (inStr) continue
        if (ch === "{") depth++
        else if (ch === "}") {
            depth--
            if (depth === 0) return s.slice(start, i + 1)
        }
    }
    return null
}

function parseResult(raw: string): { prompt: string; title: string } {
    let cleaned = raw.trim()
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
    }
    const objStr =
        isolateJsonObject(cleaned) ??
        cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)
    const parsed = JSON.parse(objStr)
    return {
        prompt: String(parsed?.prompt ?? "").trim(),
        title: String(parsed?.title ?? "").trim(),
    }
}

/* ═══════════════════════════════════════════════════════════════
   3. GEMINI (primario + respaldo)
   ═══════════════════════════════════════════════════════════════ */

async function callGemini(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<{ prompt: string; title: string }> {
    const payload = {
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 1.0,
            topP: 0.97,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            // Apaga el "thinking": sin esto el modelo se gastaba el timeout (45s)
            // pensando y devolvía 502. Patrón de decode-dream.
            thinkingConfig: { thinkingBudget: 0 },
        },
    }
    let lastErr: any = null
    for (const model of GEMINI_MODELS) {
        for (let attempt = 0; attempt < 3; attempt++) {
            const controller = new AbortController()
            const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
            try {
                const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                })
                if (!res.ok) {
                    const errBody = await res.text()
                    const transient = res.status === 429 || res.status >= 500
                    if (transient && attempt < 2) {
                        await sleep(1200 * (attempt + 1))
                        continue
                    }
                    lastErr = new Error(
                        `Gemini ${res.status} (${model}): ${errBody.slice(0, 300)}`
                    )
                    break // siguiente modelo
                }
                const data = await res.json()
                const text =
                    data?.candidates?.[0]?.content?.parts
                        ?.map((p: any) => p?.text ?? "")
                        .join("") ?? ""
                if (!text) throw new Error("respuesta vacía")
                const out = parseResult(text)
                if (!out.prompt) throw new Error("sin prompt")
                return out
            } catch (err) {
                lastErr = err
                if (attempt < 2) {
                    await sleep(1200 * (attempt + 1))
                    continue
                }
                break
            } finally {
                clearTimeout(t)
            }
        }
    }
    throw lastErr ?? new Error("Gemini: agotado")
}

/* ═══════════════════════════════════════════════════════════════
   4. SUPABASE REST (colectivo + insert)
   ═══════════════════════════════════════════════════════════════ */

async function fetchColectivo(
    url: string,
    serviceKey: string,
    id: string
): Promise<{ name: string; species_traits: string } | null> {
    try {
        const r = await fetch(
            `${url}/rest/v1/vtli_colectivos?id=eq.${id}&select=name,species_traits&limit=1`,
            {
                headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                },
            }
        )
        if (!r.ok) return null
        const rows = await r.json()
        const row = Array.isArray(rows) ? rows[0] : null
        if (!row) return null
        return {
            name: String(row.name ?? ""),
            species_traits: String(row.species_traits ?? ""),
        }
    } catch {
        return null
    }
}

// Memoria anti-repetición: títulos + cabezas de prompt de los wallpapers
// recientes de ESTA categoría, para instruir al modelo a no repetir el sujeto.
async function fetchRecentWallpapers(
    url: string,
    serviceKey: string,
    categoryKey: string,
    limit = 6
): Promise<{ title: string; prompt: string }[]> {
    try {
        const r = await fetch(
            `${url}/rest/v1/wallpaper_prompts?select=title,prompt` +
                `&category_key=eq.${encodeURIComponent(categoryKey)}` +
                `&order=created_at.desc&limit=${limit}`,
            {
                headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                },
            }
        )
        if (!r.ok) return []
        const rows = await r.json()
        return Array.isArray(rows)
            ? rows.map((x: any) => ({
                  title: String(x?.title ?? ""),
                  prompt: String(x?.prompt ?? ""),
              }))
            : []
    } catch {
        return []
    }
}

async function insertPrompt(
    url: string,
    serviceKey: string,
    row: Record<string, any>
): Promise<any> {
    const r = await fetch(`${url}/rest/v1/wallpaper_prompts`, {
        method: "POST",
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(row),
    })
    if (!r.ok) throw new Error(`insert ${r.status}: ${(await r.text()).slice(0, 200)}`)
    const out = await r.json()
    return Array.isArray(out) ? out[0] : out
}

/* ═══════════════════════════════════════════════════════════════
   5. HANDLER
   ═══════════════════════════════════════════════════════════════ */

function jsonResponse(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "method_not_allowed" })
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const missing: string[] = []
    if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY")
    if (!SUPABASE_URL) missing.push("SUPABASE_URL")
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
    if (missing.length) {
        return jsonResponse(500, { error: "missing_secrets", missing })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return jsonResponse(400, { error: "invalid_json_body" })
    }

    const _g = await gateAdmin(body?.token)
    if (!_g.ok) return jsonResponse(_g.status ?? 401, { error: _g.error })
    const adminClerkId = _g.userId!

    const categoryKey = String(body?.category_key ?? "").trim()
    const cat = WP_CATEGORIES[categoryKey]
    if (!cat) return jsonResponse(400, { error: "invalid_category" })

    const colectivoId = String(body?.colectivo_id ?? "").trim()

    // Bloque del colectivo (solo categoría colectivos + id dado).
    let colectivoBlock = ""
    let colectivoName: string | null = null
    if (categoryKey === "colectivos" && colectivoId) {
        const col = await fetchColectivo(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!,
            colectivoId
        )
        if (col && col.species_traits) {
            colectivoName = col.name || "Colectivo"
            colectivoBlock = `\n\nPROTAGONISTA OBLIGATORIO (colectivo guardado): "${col.name}". Rasgos de especie a respetar al pie de la letra: ${col.species_traits}\nConstruye el wallpaper alrededor de ESTE ser; varía solo el ángulo, el escenario, la luz y la paleta secundaria.`
        }
    }

    const nonce = crypto.randomUUID().slice(0, 8)

    // Memoria anti-repetición de la categoría (se omite si hay colectivo guiado:
    // ahí el protagonista es fijo a propósito).
    let recentBlock = ""
    if (!(categoryKey === "colectivos" && colectivoName)) {
        const recent = await fetchRecentWallpapers(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!,
            categoryKey
        )
        if (recent.length) {
            const heads = recent
                .map(
                    (x, i) =>
                        `${i + 1}. ${x.title || "(sin título)"} — ${x.prompt
                            .replace(/\s+/g, " ")
                            .slice(0, 120)}…`
                )
                .join("\n")
            recentBlock = `\n\nWALLPAPERS RECIENTES DE ESTA CATEGORÍA (REGLA DURA DE NO-REPETICIÓN): está PROHIBIDO repetir el mismo SER/criatura/elemento protagonista, la misma composición o la misma paleta de cualquiera de estos. Elige un protagonista y un encuadre CLARAMENTE distintos del abanico:\n${heads}`
        }
    }

    const systemPrompt = `${WALLPAPER_BASE}\n\n---\n\n${cat.directriz}`
    const userPrompt = `Genera UN (1) wallpaper para la categoría "${cat.label}".${colectivoBlock}${recentBlock}

Esta es una generación nueva (semilla de variación: ${nonce}); hazla INÉDITA y distinta de cualquier wallpaper anterior de esta categoría: elige una combinación nueva de ser/elemento, ángulo, composición, paleta y luz del abanico. Enfoque wallpaper vertical 9:16 4K con las dos zonas de respiro, realismo premium.

Devuelve SOLO el objeto JSON { "prompt": "<inglés>", "title": "<español corto>" }.`

    let result: { prompt: string; title: string }
    try {
        result = await callGemini(GEMINI_API_KEY!, systemPrompt, userPrompt)
    } catch (e: any) {
        return jsonResponse(502, {
            error: "generation_failed",
            detail: String(e?.message ?? e),
        })
    }

    try {
        const saved = await insertPrompt(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!,
            {
                category_key: categoryKey,
                category_label: cat.label,
                title: result.title || cat.label,
                prompt: result.prompt,
                colectivo_name: colectivoName,
                generated_by_clerk_id: adminClerkId,
            }
        )
        return jsonResponse(200, saved)
    } catch (e: any) {
        // La generación funcionó; devolvemos el prompt aunque el guardado falle.
        return jsonResponse(200, {
            id: crypto.randomUUID(),
            category_key: categoryKey,
            category_label: cat.label,
            title: result.title || cat.label,
            prompt: result.prompt,
            colectivo_name: colectivoName,
            created_at: new Date().toISOString(),
            save_error: String(e?.message ?? e),
        })
    }
})
