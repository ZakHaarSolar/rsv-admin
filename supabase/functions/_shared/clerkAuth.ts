// Red Solar Viva · _shared/clerkAuth.ts v1.1 — 🜂 LA LLAVE PÚBLICA DE LA INSTANCIA, GUARDADA (2026-10-24, sala de los
// recortes de espejo-voz). Medido en 92 partes de Escuchar: el 95 % de los pedidos cae en una instancia nueva y cada
// instancia nueva pedía el JWKS a api.clerk.com (unos 85 ms) antes de poder verificar. La llave pública de NUESTRA
// instancia vive ahora aquí (LLAVES_GUARDADAS) y un token firmado con ella se verifica sin red. Si el token trae otra
// llave, o esta no reconoce su firma (Clerk rotó la llave), se verifica contra el JWKS pedido, como antes: lo que antes
// validaba sigue validando y lo que no, no. Un token de otra instancia trae otra llave y cae al JWKS de la nuestra,
// que tampoco la tiene. Cada función toma esto al redesplegarse.
// v1.0
// =====================================================================
// Verificación server-authoritative del token de sesión de Clerk +
// gate de admin, COMPARTIDO por las edge functions.
//
// Patrón canónico de seguridad (promovido de `delete-account`): la firma
// del token se valida contra el JWKS de NUESTRA instancia de Clerk, traído
// de la Backend API con CLERK_SECRET_KEY. El `clerk_user_id` sale del claim
// `sub` del token firmado — NUNCA del body. Así un token forjado por otra
// instancia no valida, y nadie puede hacerse pasar por otro pasando un id
// arbitrario.
//
// Uso típico en una edge function:
//   import { gateAdmin } from "../_shared/clerkAuth.ts"
//   const gate = await gateAdmin(body?.token)
//   if (!gate.ok) return json({ error: gate.error }, gate.status)
//   // gate.userId es el admin verificado
//
// Secrets requeridos (Supabase → Edge Functions → Secrets):
//   · CLERK_SECRET_KEY            (sk_live de la instancia de producción)
//   · SUPABASE_URL
//   · SUPABASE_SERVICE_ROLE_KEY   (solo para requireAdmin/gateAdmin)

import { jwtVerify, createLocalJWKSet } from "https://esm.sh/jose@5.9.6"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const CLERK_SECRET = Deno.env.get("CLERK_SECRET_KEY") || ""

/* JWKS de NUESTRA instancia de Clerk, cacheado por cold start. Verificar
   contra este JWKS — y no contra el `iss` que afirma el token — es lo que
   cierra el hueco de tokens forjados por una instancia ajena. */
let cachedJwks: { keys: unknown[] } | null = null
export async function getInstanceJwks(): Promise<{ keys: unknown[] }> {
    if (cachedJwks) return cachedJwks
    const r = await fetch("https://api.clerk.com/v1/jwks", {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    })
    if (!r.ok) throw new Error(`jwks_fetch_${r.status}`)
    cachedJwks = await r.json()
    return cachedJwks!
}

/* 🜂 v1.1 — La llave pública de la instancia de producción, la misma que dan
   api.clerk.com/v1/jwks con CLERK_SECRET_KEY y
   clerk.redsolarviva.com/.well-known/jwks.json (comparadas byte a byte el
   2026-10-24). Es pública: no es un secreto. Si Clerk la rota, nada se rompe
   (los tokens nuevos traen otro `kid` y se verifican como antes, pidiendo el
   JWKS); solo se pierde la ventaja hasta copiar aquí la nueva. El registro
   lo avisa con «[clerkAuth] llave nueva». */
const LLAVES_GUARDADAS = {
    keys: [
        {
            use: "sig",
            kty: "RSA",
            kid: "ins_3BZMK8mfdeGO8OrX1my82h0wrnF",
            alg: "RS256",
            n: "wTRTuF3AOCT23SQV62h8-k_WvYaBePt5k2jX_SbE2xl4kfohroqp_-YpuXrMCZfWqrbL-G1Rf5oQUF58R5BgeZ65T94-kFhTGOPRIXt8vXfb-OjSlz_KtttjJeYSfEApzZjB7fWvXCTf4mOSOaXo-wwsOX_BscMuYhdXpS4_kEGUqmsOKC0YgoDFprgvF9FE1_rUODqPmw1U-v8QVCKWYPy1jQ0gikMYAWqRJG57R2rJ9hSBMzQf0Zl5m0sN3lW2_uFD6tZqzTIzOnqOl0e5k6IstoVunxCxxiqsf_oIbvQ870eIoM0DtBuKX7g_XezEqiPwn2jCtyTIlXP6KFX_bw",
            e: "AQAB",
        },
    ],
}
const JWKS_GUARDADO = createLocalJWKSet(LLAVES_GUARDADAS as any)

/* Fallos que dicen «esta llave no es»: solo con ellos vale la pena preguntarle
   a Clerk. Un token vencido o mal formado falla igual con cualquier llave. */
const FALLOS_DE_LLAVE = new Set([
    "ERR_JWKS_NO_MATCHING_KEY",
    "ERR_JWKS_MULTIPLE_MATCHING_KEYS",
    "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
])

/* Verifica el token y devuelve el clerk_user_id (claim `sub`).
   Lanza Error con un mensaje discriminable en cualquier fallo. */
export async function verifyClerkToken(token: string): Promise<string> {
    if (!CLERK_SECRET) throw new Error("clerk_secret_missing")
    const t = (token || "").toString().trim()
    if (!t) throw new Error("missing_token")
    let payload: { sub?: unknown }
    try {
        ;({ payload } = await jwtVerify(t, JWKS_GUARDADO, { clockTolerance: 10 }))
    } catch (e) {
        if (!FALLOS_DE_LLAVE.has(String((e as { code?: string })?.code || ""))) throw e
        const jwks = await getInstanceJwks()
        const JWKS = createLocalJWKSet(jwks as any)
        ;({ payload } = await jwtVerify(t, JWKS, { clockTolerance: 10 }))
        /* Validó con una llave que no está guardada: Clerk la rotó. */
        console.warn("[clerkAuth] llave nueva: copia el JWKS de Clerk en LLAVES_GUARDADAS")
    }
    const sub = (payload.sub || "").toString().trim()
    if (!sub) throw new Error("no_sub")
    return sub
}

/* Cliente service-role (lazy) para chequear is_admin sin RLS. */
let _admin: ReturnType<typeof createClient> | null = null
function adminClient() {
    if (_admin) return _admin
    _admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    return _admin
}

export interface AdminCheck {
    userId: string
    isAdmin: boolean
}

/* Verifica el token Y exige is_admin=true. Lanza si el token es inválido o
   si el perfil no es admin (mensaje "not_admin"). Para callers que prefieren
   manejar el flujo con try/catch. */
export async function requireAdmin(token: string): Promise<AdminCheck> {
    const userId = await verifyClerkToken(token)
    const { data, error } = await adminClient()
        .from("profiles")
        .select("is_admin")
        .eq("clerk_user_id", userId)
        .maybeSingle()
    if (error) throw new Error(`profile_lookup_${error.code || "err"}`)
    const row = data as { is_admin?: boolean | null } | null
    if (row?.is_admin !== true) throw new Error("not_admin")
    return { userId, isAdmin: true }
}

export interface GateResult {
    ok: boolean
    status?: number
    error?: string
    userId?: string
    isAdmin?: boolean
}

/* Versión non-throwing, drop-in para las edge functions (espejo del patrón
   `gateDecoder` de decode-matter): devuelve un resultado etiquetado con el
   status HTTP correcto. NO gasta ninguna API paga antes de rechazar. */
export async function gateAdmin(
    token: string | undefined | null
): Promise<GateResult> {
    try {
        const userId = await verifyClerkToken((token || "").toString())
        const { data, error } = await adminClient()
            .from("profiles")
            .select("is_admin")
            .eq("clerk_user_id", userId)
            .maybeSingle()
        if (error) return { ok: false, status: 500, error: "profile_lookup_failed", userId }
        const row = data as { is_admin?: boolean | null } | null
        if (row?.is_admin !== true)
            return { ok: false, status: 403, error: "not_admin", userId }
        return { ok: true, userId, isAdmin: true }
    } catch (e) {
        const msg = String((e as Error)?.message || e)
        if (msg.includes("clerk_secret"))
            return { ok: false, status: 500, error: "clerk_secret_missing" }
        if (msg.includes("missing_token"))
            return { ok: false, status: 400, error: "missing_token" }
        return { ok: false, status: 401, error: "invalid_token" }
    }
}

/* Igual que gateAdmin pero solo exige token válido (sin requerir admin).
   Útil para endpoints "del propio Tripulante" (ej. una futura edge `me`). */
export async function gateUser(
    token: string | undefined | null
): Promise<GateResult> {
    try {
        const userId = await verifyClerkToken((token || "").toString())
        return { ok: true, userId }
    } catch (e) {
        const msg = String((e as Error)?.message || e)
        if (msg.includes("clerk_secret"))
            return { ok: false, status: 500, error: "clerk_secret_missing" }
        if (msg.includes("missing_token"))
            return { ok: false, status: 400, error: "missing_token" }
        return { ok: false, status: 401, error: "invalid_token" }
    }
}
