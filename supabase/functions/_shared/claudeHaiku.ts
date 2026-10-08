// _shared/claudeHaiku.ts v1.0 — 🜂 EL CARRIL PRIMARIO DE LOS DECODIFICADORES (Zak 2026-10-08)
// Claude Haiku 5.5 contesta primero en decode-dream y decode-matter; si algo falla,
// la función sigue con su cascada de Gemini de siempre. Elegido en la prueba a ciegas
// del 2026-10-08 (claude.ai/artifact/QtyVxqqC8scRW1GG4qyspE): casi igual de rápido que
// Gemini 3.6 Flash (sueño 2.6 s contra 2.0; materia 4.1 s contra 3.3), una cuarta parte
// del costo y cubierto por los 100 USD/mes de créditos del plan Max.
//
// Configuración medida: sin pensamiento (`disabled`), esfuerzo `low`, salida estructurada
// con el esquema JSON de cada decodificador (la forma llega garantizada, así que no hay
// respuesta cortada que rescatar). Haiku 5.5 rechaza `temperature`/`top_p`: no se mandan.
//
// Devuelve el TEXTO JSON o null. Null = "usa Gemini": sin llave, saldo agotado (la API se
// detiene hasta el siguiente ciclo de créditos), rechazo, respuesta cortada, error o más
// de TIMEOUT_MS. Nunca lanza.
//
// Secreto: ANTHROPIC_API_KEY (supabase secrets set). Sin él, el carril se apaga solo.

import Anthropic from "npm:@anthropic-ai/sdk@0.131.0"

export const CLAUDE_MODEL = "claude-haiku-5-5"
const TIMEOUT_MS = 30000

const KEY = Deno.env.get("ANTHROPIC_API_KEY") || ""
const client = KEY ? new Anthropic({ apiKey: KEY, maxRetries: 1, timeout: TIMEOUT_MS }) : null

export async function claudeJson(opts: {
    tag: string
    system: string
    content: Anthropic.MessageParam["content"]
    schema: Record<string, unknown>
    maxTokens: number
}): Promise<string | null> {
    if (!client) return null
    const t0 = Date.now()
    try {
        const r = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: opts.maxTokens,
            system: opts.system,
            messages: [{ role: "user", content: opts.content }],
            thinking: { type: "disabled" },
            output_config: { effort: "low", format: { type: "json_schema", schema: opts.schema } },
        } as Anthropic.MessageCreateParamsNonStreaming)
        if (r.stop_reason !== "end_turn") {
            console.warn(`[${opts.tag}] ${CLAUDE_MODEL} terminó con ${r.stop_reason} → Gemini`)
            return null
        }
        const text = r.content
            .filter((b) => b.type === "text")
            .map((b) => (b as Anthropic.TextBlock).text)
            .join("")
        if (!text.trim()) return null
        console.log(
            `[${opts.tag}] respondió ${CLAUDE_MODEL} en ${Date.now() - t0} ms (in ${r.usage.input_tokens}, out ${r.usage.output_tokens})`
        )
        return text
    } catch (e) {
        const status = e instanceof Anthropic.APIError ? e.status : "red"
        console.warn(`[${opts.tag}] ${CLAUDE_MODEL} falló (${status}) en ${Date.now() - t0} ms → Gemini: ${String(e).slice(0, 200)}`)
        return null
    }
}

/* Esquemas de salida. Las ENUM van en su valor canónico en español (llaves de sistema
   que la app localiza); los textos libres salen en el idioma que pida el prompt. */
export const DREAM_SCHEMA = {
    type: "object",
    properties: {
        banda_frecuencial: { type: "string", enum: ["Purga de Entropía", "Simulador de Gravedad", "Descarga de Código"] },
        banda_key: { type: "string", enum: ["purga", "simulador", "descarga"] },
        dictamen_vibral: { type: "string" },
        calibracion_quirurgica: { type: "string" },
    },
    required: ["banda_frecuencial", "banda_key", "dictamen_vibral", "calibracion_quirurgica"],
    additionalProperties: false,
}

const HUD = {
    categoria_detectada: { type: "string", enum: ["ALIMENTO", "COSMÉTICO", "LIMPIEZA", "DESCONOCIDA"] },
    estado: {
        type: "string",
        enum: ["CÓDIGO LIMPIO", "ALERTA: FRICCIÓN BIOLÓGICA", "ALERTA: DENSIDAD ENERGÉTICA", "DENIEGUE TOTAL", "SEÑAL CORRUPTA"],
    },
    friccion_biologica: { type: "integer" },
    friccion_energetica: { type: "integer" },
    impacto_matriz: { type: "integer" },
    densidad_ligereza: { type: "integer" },
    termodinamica_resumen: { type: "string", enum: ["Conductividad de Silicio", "Anclaje al Carbono", "Equilibrio Híbrido"] },
}

export const MATTER_SCHEMA = {
    type: "object",
    properties: {
        dictamen_hud: { type: "object", properties: HUD, required: Object.keys(HUD), additionalProperties: false },
        analisis_quirurgico: { type: "array", items: { type: "string" }, minItems: 1 },
        comando_final: { type: "string" },
        clasificacion_dietetica: {
            type: "object",
            properties: { vegano: { type: "boolean" }, vegetariano: { type: "boolean" }, sin_gluten: { type: "boolean" } },
            required: ["vegano", "vegetariano", "sin_gluten"],
            additionalProperties: false,
        },
    },
    required: ["dictamen_hud", "analisis_quirurgico", "comando_final", "clasificacion_dietetica"],
    additionalProperties: false,
}
