// Red Solar Viva · delete-account v1.0
// =====================================================================
// Borrado de cuenta self-service del Tripulante (cumple App Store
// Guideline 5.1.1(v) — Data Collection and Storage: toda app que
// permite crear cuenta DEBE permitir eliminarla desde dentro de la app).
//
// El Tripulante lo dispara desde Mi Núcleo → Mi Firma de Luz → Claves y
// Seguridad → "Eliminar mi cuenta". Esta función hace TRES cosas, en
// orden, de forma server-authoritative:
//
//   1. VERIFICA el token de sesión de Clerk. La firma se valida contra
//      el JWKS de NUESTRA instancia (traído de Clerk Backend API con
//      CLERK_SECRET_KEY). El clerk_user_id sale del claim `sub` del
//      token firmado — NUNCA del body. Así nadie puede borrar la cuenta
//      de otro pasando un id arbitrario: un token forjado por otra
//      instancia no valida contra nuestro JWKS.
//
//   2. BORRA los datos personales/de comportamiento del Tripulante en
//      Supabase (service role, bypassa RLS). Cada tabla se borra de
//      forma independiente; si una falla no aborta el resto.
//
//   3. ELIMINA la cuenta de Clerk vía Backend API (DELETE /v1/users/{id}).
//      Esto NO depende del toggle "allow users to delete their accounts"
//      del dashboard de Clerk — usa el secret key directamente.
//
// CONSERVA los registros financieros (purchases / subscriptions /
// payments_log / reservas / exploration_passes) por obligación fiscal y
// de auditoría. Apple permite explícitamente retener datos requeridos
// para fines legales o contables legítimos. El perfil se anonimiza si no
// se puede borrar (FK), así no queda PII vinculada a una identidad viva.
//
// Secrets requeridos (Supabase Dashboard → Edge Functions → Secrets):
//   · CLERK_SECRET_KEY          (sk_live de la instancia de producción)
//   · SUPABASE_URL
//   · SUPABASE_SERVICE_ROLE_KEY
//
// Despliegue:
//   supabase functions deploy delete-account --no-verify-jwt
//
// Request body (JSON):
//   { "token": "<token de sesión de Clerk, de getToken()>" }
//
// Response success (200):
//   { "success": true, "user_id": "user_...", "deleted": {...},
//     "clerk_deleted": true }
// Response error:
//   { "error": "invalid_token" }  (401) | { "error": "missing_token" } (400)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { purgeUserFiles } from "../_shared/r2purge.ts"
import {
    jwtVerify,
    createLocalJWKSet,
} from "https://esm.sh/jose@5.9.6"

const CLERK_SECRET = Deno.env.get("CLERK_SECRET_KEY") || ""

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

/* JWKS de NUESTRA instancia de Clerk. Lo pedimos a Backend API con el
   secret key (que determina la instancia) y lo cacheamos por cold
   start. Verificar contra este JWKS — y no contra el `iss` que afirma
   el token — es lo que cierra el hueco de tokens forjados por una
   instancia ajena. */
let cachedJwks: { keys: unknown[] } | null = null
async function getInstanceJwks(): Promise<{ keys: unknown[] }> {
    if (cachedJwks) return cachedJwks
    const r = await fetch("https://api.clerk.com/v1/jwks", {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    })
    if (!r.ok) {
        throw new Error(`jwks_fetch_${r.status}`)
    }
    cachedJwks = await r.json()
    return cachedJwks!
}

/* Tablas de datos PERSONALES / DE COMPORTAMIENTO, keyed by
   clerk_user_id. Todas se borran por completo. */
const PERSONAL_TABLES_BY_CLERK = [
    "scan_vibracional",
    "sonda_progress",
    "decoder_scans",
    "estado_tripulante_protocolos",
    "cristales_extraccion",
    "meditaciones_owned",
    "reading_progress",
    "navegante_progress",
    "email_dispatches",
]

/* Preferencias personales keyed by email (no tienen clerk_user_id). */
const PERSONAL_TABLES_BY_EMAIL = ["email_opt_outs", "nodo_central"]

/* Mismo saneo del id que usan las edges de subida para armar el prefijo de R2.
   Tiene que coincidir EXACTAMENTE o el barrido no encontraría los archivos. */
function safeId(id: string): string {
    return (id || "anon").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405)
    }
    if (!CLERK_SECRET) {
        return json(
            {
                error:
                    "CLERK_SECRET_KEY no está configurado en Supabase → Edge Functions → Secrets.",
            },
            500
        )
    }

    /* ── Leer token ── */
    let token = ""
    try {
        const body = await req.json().catch(() => ({}))
        token = (body?.token || "").toString().trim()
    } catch {
        /* body inválido */
    }
    if (!token) return json({ error: "missing_token" }, 400)

    /* ── 1. Verificar token contra el JWKS de nuestra instancia ── */
    let userId = ""
    try {
        const jwks = await getInstanceJwks()
        const JWKS = createLocalJWKSet(jwks as any)
        const { payload } = await jwtVerify(token, JWKS, {
            clockTolerance: 10,
        })
        userId = (payload.sub || "").toString().trim()
    } catch (e) {
        console.error("[delete-account] token verify fail:", String(e))
        return json({ error: "invalid_token" }, 401)
    }
    if (!userId) return json({ error: "no_sub" }, 401)

    /* ── 2. Resolver email para limpiar tablas keyed-by-email ── */
    let email = ""
    try {
        const { data } = await supabase
            .from("profiles")
            .select("email")
            .eq("clerk_user_id", userId)
            .maybeSingle()
        email = (data?.email || "").toLowerCase().trim()
    } catch {
        /* sin email: las tablas by-email se saltan */
    }

    /* ── 3. Borrar datos personales (tabla por tabla, resiliente) ── */
    const deleted: Record<string, number | string> = {}

    const delByClerk = async (table: string) => {
        try {
            const { error, count } = await supabase
                .from(table)
                .delete({ count: "exact" })
                .eq("clerk_user_id", userId)
            deleted[table] = error
                ? `err:${error.code || error.message}`
                : count ?? 0
        } catch (e) {
            deleted[table] = `ex:${String((e as Error)?.message || e).slice(0, 40)}`
        }
    }
    const delByEmail = async (table: string) => {
        if (!email) {
            deleted[table] = "no_email"
            return
        }
        try {
            const { error, count } = await supabase
                .from(table)
                .delete({ count: "exact" })
                .eq("email", email)
            deleted[table] = error
                ? `err:${error.code || error.message}`
                : count ?? 0
        } catch (e) {
            deleted[table] = `ex:${String((e as Error)?.message || e).slice(0, 40)}`
        }
    }

    for (const t of PERSONAL_TABLES_BY_CLERK) await delByClerk(t)
    for (const t of PERSONAL_TABLES_BY_EMAIL) await delByEmail(t)

    /* ── 3.bis · AUDITORÍA PARTE 3 · el resto de los datos personales ──
       Las listas de arriba cubrían 11 tablas. Sobrevivían 38 con contenido
       personal, entre ellas las más íntimas de la app: el texto de los sueños,
       la Bitácora, las Rachas, las conversaciones del Espejo, la Realidad
       Elegida, las fotos de alimentos y el perfil público de Comunidad.
       purge_my_account_data (migración 20260727b) las borra todas en una sola
       llamada y conserva a propósito lo contable y lo de moderación. */
    try {
        const { data: purged, error: purgeErr } = await supabase.rpc(
            "purge_my_account_data",
            { p_clerk_user_id: userId }
        )
        deleted["_purge_rpc"] = purgeErr
            ? `err:${purgeErr.code || purgeErr.message}`
            : (purged?.total ?? 0)
        if (purged?.detail) deleted["_purge_detail"] = purged.detail
    } catch (e) {
        deleted["_purge_rpc"] = `ex:${String((e as Error)?.message || e).slice(0, 60)}`
    }

    /* ── 3.ter · Los ARCHIVOS en R2 ──
       No existía ningún borrado de R2 en todo el sistema: avatar, fotos de
       alimentos, fotos de la visión y la media de los mensajes quedaban en un
       bucket de lectura pública para siempre. Se barren por prefijo (lleva el
       clerk id), así que también se lleva los huérfanos que la base ya no
       recordaba. Si falla, se registra y el borrado de la cuenta continúa. */
    try {
        const r2res = await purgeUserFiles(
            {
                accountId: Deno.env.get("R2_ACCOUNT_ID") ?? "",
                accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID") ?? "",
                secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "",
                bucket: Deno.env.get("R2_BUCKET") ?? "",
            },
            safeId(userId)
        )
        deleted["_r2"] = r2res.note
            ? r2res.note
            : `borrados:${r2res.deleted} fallidos:${r2res.failed}`
    } catch (e) {
        deleted["_r2"] = `ex:${String((e as Error)?.message || e).slice(0, 60)}`
    }

    /* ── 4. profiles: intentar borrar; si falla (FK), anonimizar ── */
    try {
        const { error, count } = await supabase
            .from("profiles")
            .delete({ count: "exact" })
            .eq("clerk_user_id", userId)
        if (error) {
            const { error: scrubErr } = await supabase
                .from("profiles")
                .update({
                    email: `deleted_${userId}@removed.invalid`,
                    full_name: "Cuenta eliminada",
                    avatar_url: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("clerk_user_id", userId)
            deleted["profiles"] = scrubErr
                ? `scrub_err:${scrubErr.code || scrubErr.message}`
                : `scrubbed:${error.code || ""}`
        } else {
            deleted["profiles"] = count ?? 0
        }
    } catch (e) {
        deleted["profiles"] = `ex:${String((e as Error)?.message || e).slice(0, 40)}`
    }

    /* ── 5. Eliminar la cuenta de Clerk (Backend API) ── */
    let clerkDeleted = false
    let clerkError = ""
    try {
        const r = await fetch(
            `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${CLERK_SECRET}` },
            }
        )
        clerkDeleted = r.ok
        if (!r.ok) {
            clerkError = `clerk_${r.status}:${(await r.text()).slice(0, 160)}`
        }
    } catch (e) {
        clerkError = String((e as Error)?.message || e)
    }

    console.log(
        `[delete-account] user=${userId} clerkDeleted=${clerkDeleted} deleted=${JSON.stringify(
            deleted
        )}${clerkError ? ` clerkError=${clerkError}` : ""}`
    )

    return json({
        success: true,
        user_id: userId,
        deleted,
        clerk_deleted: clerkDeleted,
        clerk_error: clerkError || undefined,
    })
})
