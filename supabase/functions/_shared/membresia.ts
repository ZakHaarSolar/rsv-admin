// Red Solar Viva · _shared/membresia.ts v1.0 — 🜂 LA MEMBRESÍA FALLA CERRADA
// (auditoría de precios 2026-10-18, sección 5: "si la base tarda en contestar, el
// Espejo y la voz tratan a cualquiera como miembro").
//
// La señal es la CANÓNICA del Espejo (la misma de oraculo-chat y espejo-voz desde
// julio): profiles → email → subscriptions con status='active'; cualquier
// suscripción activa que no sea 'decoder' (199) ni 'dream' (399) es membresía plena.
// Lo nuevo es qué pasa cuando la base no contesta: antes se daba por miembro a
// quien fuera; ahora el resultado es "desconocido" y cada función decide qué
// decir (nunca cobrar como miembro a ciegas, nunca levantar el muro de pago a
// alguien que sí paga). Un tropiezo suelto se reintenta una vez.
//
// Solo lectura con service_role; no gasta nada.

export type Carril = "admin" | "miembro" | "free" | "desconocido"

export interface Membresia {
    carril: Carril
    email: string
}

const TIEMPO_MS = 5000

async function leer(url: string, key: string): Promise<any[] | null> {
    try {
        const r = await fetch(url, {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(TIEMPO_MS),
        })
        if (!r.ok) return null
        const j = await r.json().catch(() => null)
        return Array.isArray(j) ? j : null
    } catch {
        return null
    }
}

async function unIntento(clerkUserId: string): Promise<Membresia> {
    const supaUrl = Deno.env.get("SUPABASE_URL")
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supaUrl || !supaKey) return { carril: "desconocido", email: "" }
    const perfiles = await leer(
        `${supaUrl}/rest/v1/profiles?clerk_user_id=eq.${encodeURIComponent(
            clerkUserId
        )}&select=email,is_admin&limit=1`,
        supaKey
    )
    if (!perfiles) return { carril: "desconocido", email: "" }
    if (perfiles[0]?.is_admin === true)
        return {
            carril: "admin",
            email: String(perfiles[0]?.email || "").toLowerCase().trim(),
        }
    const email = String(perfiles[0]?.email || "").toLowerCase().trim()
    /* Sin perfil o sin correo no hay suscripción que buscar: es una cuenta
       sin plan (la base SÍ contestó, así que esto no es una duda). */
    if (!email) return { carril: "free", email: "" }
    const subs = await leer(
        `${supaUrl}/rest/v1/subscriptions?email=eq.${encodeURIComponent(
            email
        )}&status=eq.active&select=group_name`,
        supaKey
    )
    if (!subs) return { carril: "desconocido", email }
    const pleno = subs.some((s: any) => {
        const g = String(s?.group_name || "").toLowerCase()
        return g !== "decoder" && g !== "dream"
    })
    return { carril: pleno ? "miembro" : "free", email }
}

/** Quién es esta persona para las funciones que cuestan dinero. */
export async function resolverMembresia(clerkUserId: string): Promise<Membresia> {
    const primera = await unIntento(clerkUserId)
    if (primera.carril !== "desconocido") return primera
    await new Promise((r) => setTimeout(r, 350))
    const segunda = await unIntento(clerkUserId)
    if (segunda.carril === "desconocido")
        console.warn("[membresia] la base no contestó dos veces: carril desconocido")
    return segunda
}

/** Frase para la pantalla cuando la membresía no se pudo confirmar. */
export function avisoMembresiaNoVerificada(lang: string): string {
    return String(lang || "").slice(0, 2).toLowerCase() === "en"
        ? "I couldn't confirm your membership right now. Try again in a few seconds"
        : "No pude confirmar tu membresía en este instante. Intenta de nuevo en unos segundos"
}
