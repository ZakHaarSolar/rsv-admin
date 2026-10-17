// Red Solar Viva · juego-compra v1.1 · 🜂 LA COMPRA DE LOS JUEGOS DE LUDUS CERO (Terra Cristal primero, 2026-10-17)
// v1.1 · la imagen del producto es la portada A1 (terra-cristal-portada-v3.jpg) y el juego vuelve solo a /terra-cristal/ (la ruta de -pixel3 se quitó)
// =====================================================================
// Zak: «implementar ya el sistema de cobro con Stripe... para comprar el juego completo... eso lo vamos a ir haciendo con cada
// juego». La versión gratis de Terra Cristal llega hasta la puerta de Lemuria; el juego completo es un pago único de una cuenta de Red
// Solar Viva. Esta función es la única puerta: el juego le pregunta si la cuenta ya lo tiene, le pide el pago y, al volver de Stripe,
// le pide que lo confirme. El producto y su precio se crean solos en Stripe la primera vez (con id y llave fijos: nunca se duplican) y
// se mantienen iguales al CATÁLOGO de aquí abajo.
//
//   POST { accion, juego, token, session_id?, vuelta?, para? }
//   accion "estado"   → 200 { completo, origen? }        (con token; cierra también los pagos que quedaron abiertos y ya se pagaron)
//   accion "checkout" → 200 { url } | 200 { completo: true } (ya lo tenía) · 429 { error: "pronto" }
//   accion "verifica" → 200 { completo, estado: "pagado" | "pendiente" | "ajeno" }   (session_id de la vuelta de Stripe)
//   accion "regala"   → 200 { ok: true, para }            (solo administrador; para: id de la cuenta o su correo)
//   accion "estado_de"→ 200 { completo, origen? }         (solo administrador, para el Motor; para: id de la cuenta)
//   errores           → 400 { error } · 401 · 403 · 503 { error: "falta_migracion", migracion } · 502 { error: "stripe", detalle }
//
// Las tablas: ../../migrations/20261017_juegos_compras.sql (la pega Zak). Mientras no existan, contesta 503 y NO abre ningún pago:
// nadie paga sin que su compra se pueda anotar.
//
// Deploy:
//   cd "/Users/diego/Documents/Red Solar Viva/admin"
//   supabase functions deploy juego-compra --no-verify-jwt
//
// Secrets: STRIPE_SECRET_KEY · CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY (los de siempre)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin, gateUser } from "../_shared/clerkAuth.ts"

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") || ""
const CLERK_SECRET = Deno.env.get("CLERK_SECRET_KEY") || ""
const MIGRACION = "20261017_juegos_compras"
const ORIGEN = "https://play.redsolarviva.com"

type Juego = {
    /** el id fijo del producto en Stripe */
    producto: string
    /** la llave fija del precio (cambiar el precio = una llave nueva) */
    llave: string
    nombre: string
    descripcion: string
    imagen: string
    centavos: number
    moneda: string
    /** a dónde vuelve quien paga (la primera es la de siempre) */
    rutas: string[]
    /** el renglón del botón de pagar en Stripe */
    aviso: string
}

const CATALOGO: Record<string, Juego> = {
    "terra-cristal": {
        producto: "terra_cristal_juego",
        llave: "terra_cristal_completo_mxn_299",
        nombre: "Terra Cristal · Juego completo",
        descripcion: "Acceso anticipado. Pago único: entras a Lemuria y cada capítulo nuevo llega a tu cuenta sin volver a pagar.",
        imagen: "https://play.redsolarviva.com/ludus/terra-cristal-portada-v3.jpg",
        centavos: 29900,
        moneda: "mxn",
        rutas: ["/terra-cristal/"],
        aviso: "Pago único. Sin suscripción. Cada capítulo nuevo llega a tu cuenta sin volver a pagar.",
    },
}

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

/** Los códigos con que Postgres o PostgREST dicen que la tabla todavía no existe. */
const FALTA = new Set(["42P01", "PGRST205", "PGRST202", "42883"])
class FaltaMigracion extends Error {}
const revisa = (error: any) => {
    if (!error) return
    if (FALTA.has(String(error.code))) throw new FaltaMigracion("falta_migracion")
    throw new Error(`db_${error.code || "error"}: ${error.message || ""}`)
}

// ---------------------------------------------------------------- Stripe (por su API, sin librería)

class ErrorStripe extends Error {
    constructor(public status: number, public codigo: string, mensaje: string) {
        super(mensaje)
    }
}

/** Los parámetros de Stripe como formulario (los anidados ya vienen con su nombre: "metadata[juego]"). */
const formulario = (p: Record<string, string | number | boolean | undefined | null>) => {
    const f = new URLSearchParams()
    for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") f.append(k, String(v))
    return f
}

async function stripe(metodo: "GET" | "POST", ruta: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<any> {
    if (!STRIPE_KEY) throw new ErrorStripe(500, "sin_llave", "STRIPE_SECRET_KEY no está")
    const r = await fetch(`https://api.stripe.com${ruta}`, {
        method: metodo,
        headers: {
            Authorization: `Bearer ${STRIPE_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Stripe-Version": "2024-06-20",
        },
        body: metodo === "POST" && params ? formulario(params) : undefined,
    })
    const cuerpo = await r.json().catch(() => ({}))
    if (!r.ok) throw new ErrorStripe(r.status, cuerpo?.error?.code || cuerpo?.error?.type || "error", cuerpo?.error?.message || `HTTP ${r.status}`)
    return cuerpo
}

/** El precio del juego en Stripe: lo busca por su llave y, la primera vez, crea el producto (con su id fijo) y el precio. Una vez por
 *  arranque de la función también deja el producto igual al catálogo (nombre, descripción e imagen). */
const preciosListos = new Map<string, string>()
async function precioDe(id: string, j: Juego): Promise<string> {
    const listo = preciosListos.get(j.llave)
    if (listo) return listo
    // el producto: si no está, se crea; si está distinto del catálogo, se pone al día
    let producto: any = null
    try {
        producto = await stripe("GET", `/v1/products/${j.producto}`)
    } catch (e) {
        if (!(e instanceof ErrorStripe) || e.status !== 404) throw e
    }
    const datos = {
        name: j.nombre,
        description: j.descripcion,
        "images[0]": j.imagen,
        "metadata[juego]": id,
        "metadata[origen]": "juego-compra",
    }
    if (!producto) {
        try {
            producto = await stripe("POST", "/v1/products", { id: j.producto, ...datos })
        } catch (e) {
            // otra llamada lo creó al mismo tiempo
            if (!(e instanceof ErrorStripe) || e.codigo !== "resource_already_exists") throw e
            producto = await stripe("GET", `/v1/products/${j.producto}`)
        }
    } else if (producto.name !== j.nombre || producto.description !== j.descripcion || producto.images?.[0] !== j.imagen || producto.active === false) {
        producto = await stripe("POST", `/v1/products/${j.producto}`, { ...datos, active: true })
    }
    // el precio, por su llave
    const lista = await stripe("GET", `/v1/prices?lookup_keys[]=${encodeURIComponent(j.llave)}&active=true&limit=1`)
    let precio = lista?.data?.[0]
    if (!precio) {
        try {
            precio = await stripe("POST", "/v1/prices", {
                product: j.producto,
                unit_amount: j.centavos,
                currency: j.moneda,
                lookup_key: j.llave,
                nickname: "Pago único",
                "metadata[juego]": id,
            })
        } catch (e) {
            if (!(e instanceof ErrorStripe)) throw e
            const otra = await stripe("GET", `/v1/prices?lookup_keys[]=${encodeURIComponent(j.llave)}&active=true&limit=1`)
            precio = otra?.data?.[0]
            if (!precio) throw e
        }
    }
    if (precio.unit_amount !== j.centavos || precio.currency !== j.moneda) throw new ErrorStripe(500, "precio_distinto", `La llave ${j.llave} tiene otro precio`)
    preciosListos.set(j.llave, precio.id)
    return precio.id
}

// ---------------------------------------------------------------- las cuentas

/** El correo principal de la cuenta en Clerk (para que Stripe lo traiga escrito y el recibo llegue ahí), o null. */
async function correoDe(userId: string): Promise<string | null> {
    if (!CLERK_SECRET) return null
    try {
        const r = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
            headers: { Authorization: `Bearer ${CLERK_SECRET}` },
            signal: AbortSignal.timeout(4000),
        })
        if (!r.ok) return null
        const u = await r.json()
        const principal = (u.email_addresses || []).find((e: any) => e.id === u.primary_email_address_id) || u.email_addresses?.[0]
        return principal?.email_address ? String(principal.email_address) : null
    } catch {
        return null
    }
}

/** La cuenta que tiene ese correo (para regalar el juego por correo), o null. */
async function cuentaDeCorreo(correo: string): Promise<string | null> {
    if (!CLERK_SECRET) return null
    const r = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(correo)}&limit=1`, {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` },
        signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return null
    const lista = await r.json()
    return Array.isArray(lista) && lista[0]?.id ? String(lista[0].id) : null
}

// ---------------------------------------------------------------- la compra

async function compraDe(userId: string, juego: string): Promise<{ origen: string } | null> {
    const { data, error } = await supabase.from("juego_compras").select("origen").eq("clerk_user_id", userId).eq("juego", juego).maybeSingle()
    revisa(error)
    return data ? { origen: String((data as any).origen) } : null
}

/** Anota la compra de una sesión de Stripe ya pagada (si ya estaba, no pasa nada) y cierra su pago abierto. */
async function otorga(userId: string, juego: string, s: any) {
    const { error } = await supabase.from("juego_compras").upsert(
        {
            clerk_user_id: userId,
            juego,
            origen: "stripe",
            stripe_session_id: s.id,
            stripe_payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null,
            monto_centavos: typeof s.amount_total === "number" ? s.amount_total : null,
            moneda: s.currency ?? null,
            email: s.customer_details?.email ?? s.customer_email ?? null,
        },
        { onConflict: "clerk_user_id,juego", ignoreDuplicates: true },
    )
    revisa(error)
    await supabase.from("juego_checkouts").update({ estado: "pagado", actualizado: new Date().toISOString() }).eq("stripe_session_id", s.id)
    console.log(`[juego-compra] ${juego} para ${userId} · ${s.id} · ${s.amount_total} ${s.currency}`)
}

const pagada = (s: any) => s?.payment_status === "paid" || s?.payment_status === "no_payment_required"

/** Revisa en Stripe los pagos abiertos de los últimos 7 días de esta cuenta: el que ya se pagó, se anota (quien pagó y cerró la
 *  pestaña antes de volver al juego). ¿Quedó comprado? */
async function cierraAbiertos(userId: string, juego: string): Promise<boolean> {
    const desde = new Date(Date.now() - 7 * 86400_000).toISOString()
    const { data, error } = await supabase
        .from("juego_checkouts")
        .select("stripe_session_id")
        .eq("clerk_user_id", userId)
        .eq("juego", juego)
        .eq("estado", "abierto")
        .gte("creado", desde)
        .order("creado", { ascending: false })
        .limit(3)
    revisa(error)
    for (const fila of (data as any[]) || []) {
        try {
            const s = await stripe("GET", `/v1/checkout/sessions/${encodeURIComponent(fila.stripe_session_id)}`)
            if (s.client_reference_id !== userId || s.metadata?.juego !== juego) continue
            if (pagada(s)) {
                await otorga(userId, juego, s)
                return true
            }
            if (s.status === "expired")
                await supabase.from("juego_checkouts").update({ estado: "vencido", actualizado: new Date().toISOString() }).eq("stripe_session_id", s.id)
        } catch (e) {
            console.warn(`[juego-compra] no se pudo revisar ${fila.stripe_session_id}: ${(e as Error).message}`)
        }
    }
    return false
}

// ---------------------------------------------------------------- la puerta

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
    if (req.method !== "POST") return json(405, { error: "solo_post" })
    let body: any
    try {
        body = await req.json()
    } catch {
        return json(400, { error: "cuerpo" })
    }
    const accion = String(body?.accion || "")
    const juego = String(body?.juego || "")
    const j = CATALOGO[juego]
    if (!j) return json(400, { error: "juego" })

    try {
        if (accion === "estado_de") {
            // (administrador, el Motor) ¿esa cuenta tiene el juego completo?
            const gate = await gateAdmin(body?.token)
            if (!gate.ok) return json(gate.status || 401, { error: gate.error })
            const para = String(body?.para || "").trim()
            if (!para.startsWith("user_")) return json(400, { error: "para" })
            const c = await compraDe(para, juego)
            return json(200, c ? { completo: true, origen: c.origen } : { completo: false })
        }

        if (accion === "regala") {
            const gate = await gateAdmin(body?.token)
            if (!gate.ok) return json(gate.status || 401, { error: gate.error })
            const para = String(body?.para || "").trim()
            const cuenta = para.startsWith("user_") ? para : para.includes("@") ? await cuentaDeCorreo(para.toLowerCase()) : null
            if (!cuenta) return json(404, { error: "sin_cuenta" })
            const { error } = await supabase
                .from("juego_compras")
                .upsert({ clerk_user_id: cuenta, juego, origen: "regalo", nota: `regalo de ${gate.userId}` }, { onConflict: "clerk_user_id,juego", ignoreDuplicates: true })
            revisa(error)
            return json(200, { ok: true, para: cuenta })
        }

        const gate = await gateUser(body?.token)
        if (!gate.ok || !gate.userId) return json(gate.status || 401, { error: gate.error })
        const userId = gate.userId

        if (accion === "estado") {
            const c = await compraDe(userId, juego)
            if (c) return json(200, { completo: true, origen: c.origen })
            const cerro = await cierraAbiertos(userId, juego)
            return json(200, cerro ? { completo: true, origen: "stripe" } : { completo: false })
        }

        if (accion === "verifica") {
            const sid = String(body?.session_id || "")
            if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sid)) return json(400, { error: "session_id" })
            if (await compraDe(userId, juego)) return json(200, { completo: true, estado: "pagado" })
            const s = await stripe("GET", `/v1/checkout/sessions/${encodeURIComponent(sid)}`)
            if (s.client_reference_id !== userId || s.metadata?.juego !== juego) return json(200, { completo: false, estado: "ajeno" })
            if (!pagada(s)) return json(200, { completo: false, estado: "pendiente" })
            await otorga(userId, juego, s)
            return json(200, { completo: true, estado: "pagado" })
        }

        if (accion === "checkout") {
            // (también comprueba que las tablas existan antes de abrir cualquier pago)
            if (await compraDe(userId, juego)) return json(200, { completo: true })
            const haceUnaHora = new Date(Date.now() - 3600_000).toISOString()
            const { count, error: errCuenta } = await supabase
                .from("juego_checkouts")
                .select("stripe_session_id", { count: "exact", head: true })
                .eq("clerk_user_id", userId)
                .gte("creado", haceUnaHora)
            revisa(errCuenta)
            if ((count ?? 0) >= 12) return json(429, { error: "pronto" })
            const vuelta = j.rutas.includes(String(body?.vuelta || "")) ? String(body.vuelta) : j.rutas[0]
            const [precio, correo] = await Promise.all([precioDe(juego, j), correoDe(userId)])
            const s = await stripe("POST", "/v1/checkout/sessions", {
                mode: "payment",
                "line_items[0][price]": precio,
                "line_items[0][quantity]": 1,
                client_reference_id: userId,
                customer_email: correo,
                customer_creation: "always",
                "payment_method_types[0]": "card",
                allow_promotion_codes: true,
                locale: "es-419",
                success_url: `${ORIGEN}${vuelta}?compra=ok&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${ORIGEN}${vuelta}?compra=cancelada`,
                "metadata[payment_type]": "juego",
                "metadata[juego]": juego,
                "metadata[clerk_user_id]": userId,
                "payment_intent_data[description]": j.nombre,
                "payment_intent_data[metadata][payment_type]": "juego",
                "payment_intent_data[metadata][juego]": juego,
                "payment_intent_data[metadata][clerk_user_id]": userId,
                "custom_text[submit][message]": j.aviso,
            })
            const { error } = await supabase.from("juego_checkouts").insert({ stripe_session_id: s.id, clerk_user_id: userId, juego })
            revisa(error)
            return json(200, { url: s.url })
        }

        return json(400, { error: "accion" })
    } catch (e) {
        if (e instanceof FaltaMigracion) return json(503, { error: "falta_migracion", migracion: MIGRACION })
        if (e instanceof ErrorStripe) {
            console.error(`[juego-compra] Stripe ${e.status} ${e.codigo}: ${e.message}`)
            return json(502, { error: "stripe", detalle: e.codigo })
        }
        console.error(`[juego-compra] ${(e as Error).message}`)
        return json(500, { error: "interno" })
    }
})
