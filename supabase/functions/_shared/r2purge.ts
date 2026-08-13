// Red Solar Viva · _shared/r2purge.ts v1.0 — borrar los archivos de un Tripulante
// =============================================================================
// AUDITORÍA · PARTE 3 · App Store Guideline 5.1.1(v).
//
// Hasta hoy NO existía ninguna operación de borrado contra R2 en todo el repo:
// ni en `delete-account`, ni en un cron, ni al borrar contenido del Motor. Las
// fotos de comida, los avatares, las notas de voz de los mensajes y las fotos de
// la visión quedaban en un bucket de lectura pública PARA SIEMPRE, incluso
// después de que la persona pidiera eliminar su cuenta.
//
// Se borra POR PREFIJO, no por las URLs guardadas en la base, y eso es
// deliberado: las URLs viven cifradas en varias tablas y además hay objetos
// huérfanos (subidas que fallaron a mitad, filas ya borradas). El prefijo lleva
// el clerk_user_id, así que barrerlo limpia TODO lo de esa persona, incluido lo
// que la base ya no recuerda.
//
//   Avatares/{safeId}/…        · upload-avatar
//   DM/{safeId}/…              · upload-dm-media  (fotos y notas de voz)
//   Materia/Fotos/{safeId}/…   · upload-matter-photo
//   Vision/{safeId}/…          · upload-vision
//
// Requiere los mismos secretos que las edges de subida (R2_ACCOUNT_ID,
// R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET). Si faltan, no rompe nada:
// devuelve un aviso y el borrado de la cuenta continúa.

export interface R2Creds {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
}

const enc = new TextEncoder()

async function sha256Hex(data: Uint8Array | string): Promise<string> {
    const buf = typeof data === "string" ? enc.encode(data) : data
    const hash = await crypto.subtle.digest("SHA-256", buf)
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function hmac(key: Uint8Array, msg: string): Promise<Uint8Array> {
    const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
    ])
    return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)))
}

/** Codificación de la ruta que exige S3: cada segmento por separado. */
function encodeKey(key: string): string {
    return key
        .split("/")
        .map((s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()))
        .join("/")
}

/** Firma un request a R2 con AWS Signature V4 y lo ejecuta. */
async function signedFetch(
    creds: R2Creds,
    method: "GET" | "DELETE",
    canonicalUri: string,
    query: Record<string, string>
): Promise<Response> {
    const host = `${creds.accountId}.r2.cloudflarestorage.com`
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)
    const region = "auto"
    const service = "s3"
    const payloadHash = await sha256Hex("")

    const canonicalQuery = Object.keys(query)
        .sort()
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
        .join("&")

    const canonicalHeaders =
        `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date"

    const canonicalRequest = [
        method,
        canonicalUri,
        canonicalQuery,
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join("\n")

    const scope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        scope,
        await sha256Hex(canonicalRequest),
    ].join("\n")

    let k = await hmac(enc.encode("AWS4" + creds.secretAccessKey), dateStamp)
    k = await hmac(k, region)
    k = await hmac(k, service)
    k = await hmac(k, "aws4_request")
    const sig = [...(await hmac(k, stringToSign))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

    const auth =
        `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${sig}`

    const url = `https://${host}${canonicalUri}${canonicalQuery ? "?" + canonicalQuery : ""}`
    return await fetch(url, {
        method,
        headers: {
            Authorization: auth,
            "x-amz-content-sha256": payloadHash,
            "x-amz-date": amzDate,
        },
    })
}

/** Extrae los <Key> de la respuesta XML de ListObjectsV2 (sin parser XML). */
function parseKeys(xml: string): string[] {
    const out: string[] = []
    const rx = /<Key>([\s\S]*?)<\/Key>/g
    let m: RegExpExecArray | null
    while ((m = rx.exec(xml)) !== null) {
        const k = m[1]
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
        if (k) out.push(k)
    }
    return out
}
function parseToken(xml: string): string | null {
    const m = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)
    return m ? m[1] : null
}

export interface PurgeResult {
    ok: boolean
    deleted: number
    failed: number
    prefixes: Record<string, number | string>
    note?: string
}

/**
 * Borra TODOS los objetos bajo los prefijos personales de un Tripulante.
 * Nunca lanza: cualquier fallo se reporta y el flujo de borrado sigue.
 */
export async function purgeUserFiles(
    creds: Partial<R2Creds>,
    safeUserId: string,
    maxObjects = 5000
): Promise<PurgeResult> {
    const res: PurgeResult = { ok: false, deleted: 0, failed: 0, prefixes: {} }
    if (
        !creds.accountId ||
        !creds.accessKeyId ||
        !creds.secretAccessKey ||
        !creds.bucket
    ) {
        res.note = "faltan_secretos_r2"
        return res
    }
    const c = creds as R2Creds
    const bucketUri = `/${encodeURIComponent(c.bucket)}`

    const prefixes = [
        `Avatares/${safeUserId}/`,
        `DM/${safeUserId}/`,
        `Materia/Fotos/${safeUserId}/`,
        `Vision/${safeUserId}/`,
    ]

    for (const prefix of prefixes) {
        let count = 0
        try {
            let token: string | null = null
            let guard = 0
            do {
                const q: Record<string, string> = {
                    "list-type": "2",
                    prefix,
                    "max-keys": "1000",
                }
                if (token) q["continuation-token"] = token
                const r = await signedFetch(c, "GET", bucketUri, q)
                if (!r.ok) {
                    res.prefixes[prefix] = `list_${r.status}`
                    break
                }
                const xml = await r.text()
                const keys = parseKeys(xml)
                token = parseToken(xml)

                for (const key of keys) {
                    if (res.deleted + res.failed >= maxObjects) {
                        token = null
                        break
                    }
                    const d = await signedFetch(
                        c,
                        "DELETE",
                        `${bucketUri}/${encodeKey(key)}`,
                        {}
                    )
                    // S3 devuelve 204 al borrar y 404 si ya no está: ambos son éxito.
                    if (d.ok || d.status === 404) {
                        res.deleted++
                        count++
                    } else {
                        res.failed++
                    }
                }
                guard++
            } while (token && guard < 20)
            if (res.prefixes[prefix] === undefined) res.prefixes[prefix] = count
        } catch (e) {
            res.prefixes[prefix] = `ex:${String((e as Error)?.message || e).slice(0, 60)}`
        }
    }

    res.ok = res.failed === 0
    return res
}
