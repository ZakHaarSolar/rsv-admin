/**
 * Red Solar Viva — Exploration Pass + Ignición 1:1 v4
 *
 * v4 (2026-04-23) — Zoom único por reserva 1:1:
 *   · El Stripe webhook ahora llama la Zoom API al confirmar el pago y
 *     crea una sala específica (fecha + hora + duración). El join_url
 *     viaja en body.zoom_join_url y se guarda en reservas.zoom_join_url.
 *   · Preferimos ese link sobre la env var ZOOM_1_1_LINK — así cada
 *     tripulante recibe SU propia sala y dejan de compartir el mismo link.
 *   · Si el Stripe webhook falló al crear la sala (raro), body.zoom_join_url
 *     ya viene resuelto a ZOOM_FALLBACK_JOIN_URL allá, así que acá no
 *     hay que preocuparse del fallback en este workflow.
 *
 * v3 (2026-04-22) — branch para sesiones 1:1 Cámara de Resonancia:
 *   · source: "individual" dispara subject "[ IGNICIÓN 1:1 ]" + template
 *     con Zoom link personal, duración explícita, sin apertura de compuertas.
 *   · slot_type: individual_30 | individual_45 | individual_60 → duración.
 *   · Zoom link viene de env ZOOM_1_1_LINK (o fallback al grupal).
 *
 * v2 — Calendly Exploration Pass (UNIFICADO)
 *
 * Workflow Pipedream con DOS triggers simultáneos:
 *
 *   Trigger 1: Calendly webhook `invitee.created`
 *     Payload shape: { event, payload: { email, name, timezone, scheduled_event } }
 *     → Inserta en exploration_passes + envía email.
 *
 *   Trigger 2: HTTP webhook (Pipedream genera una URL)
 *     Payload shape: { source: "manual", name, email, event_date, event_start_time, timezone? }
 *     → SOLO envía email (el UI del Motor de Intervención ya hizo el insert).
 *
 * Setup en Pipedream:
 *   1. Abrir el workflow existente (el de `calendly-exploration-pass.js`).
 *   2. Triggers → "+ Add Trigger" → "HTTP / Webhook" → crear.
 *   3. Copiar la URL. Pegarla en Framer → Domo → Telemetría → propiedad
 *      "Pipedream Email Webhook".
 *   4. Reemplazar el código con este archivo. Deploy.
 *
 * El workflow detecta cuál trigger disparó via el shape del body (Calendly
 * trae `body.event === "invitee.created"`; el HTTP manual trae
 * `body.source === "manual"`). Cualquier otro payload se ignora.
 *
 * Secretos (env en Pipedream):
 *   - PROTON_SMTP_HOST
 *   - PROTON_SMTP_PORT
 *   - PROTON_SMTP_USER
 *   - PROTON_SMTP_PASS
 * Props:
 *   - supabaseUrl
 *   - supabaseServiceKey (secret)
 */

import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

export default defineComponent({
    props: {
        supabaseUrl: {
            type: "string",
            label: "Supabase URL",
        },
        supabaseServiceKey: {
            type: "string",
            label: "Supabase Service Role Key",
            secret: true,
        },
    },

    async run({ steps, $ }) {
        const body = steps.trigger.event.body || {}
        const isCalendly = body.event === "invitee.created"
        const isManual = body.source === "manual"
        /* v3 2026-04-22 — branch nuevo para sesiones 1:1. El Stripe webhook
           del motor de reservas manda `source: "individual"` + slot_type
           (individual_30/45/60) cuando un tripulante reserva Cámara de
           Resonancia. Email distinto al grupal: "IGNICIÓN 1:1", Zoom link
           personal, sin referencia a apertura de compuertas/grupo. */
        const isIndividual = body.source === "individual"

        if (!isCalendly && !isManual && !isIndividual) {
            $.flow.exit(
                "Evento ignorado: " + (body.event || body.source || "desconocido")
            )
        }

        // =============================================
        // 1. NORMALIZAR DATOS SEGÚN FUENTE
        // =============================================
        let inviteeEmail,
            inviteeName,
            inviteeTimezone,
            eventStartTime,
            calendlyEventUri

        if (isCalendly) {
            const payload = body.payload
            const scheduledEvent = payload.scheduled_event

            // Gate: sólo reservas de "Cámara Solar"
            const eventName = scheduledEvent.name || ""
            if (
                !eventName.toLowerCase().includes("cámara solar") &&
                !eventName.toLowerCase().includes("camara solar")
            ) {
                $.flow.exit(
                    "Evento ignorado (no es Cámara Solar): " + eventName
                )
            }

            inviteeEmail = payload.email
            inviteeName = payload.name || "Explorador"
            inviteeTimezone = payload.timezone || "America/Cancun"
            eventStartTime = scheduledEvent.start_time
            calendlyEventUri = payload.event
        } else {
            // Manual (grupal mirror) o Individual (1:1): UI ya insertó en DB;
            // acá sólo enviamos email.
            inviteeEmail = (body.email || "").trim()
            inviteeName = body.name || "Explorador"
            inviteeTimezone = body.timezone || "America/Cancun"
            eventStartTime = body.event_start_time
            calendlyEventUri = null

            if (!inviteeEmail || !eventStartTime) {
                $.flow.exit(
                    "Trigger con payload incompleto (falta email o event_start_time)"
                )
            }
        }

        /* v3 — duración derivada del slot_type para 1:1 email body. */
        let sessionDurationMin = 60
        if (isIndividual) {
            const st = body.slot_type || ""
            if (st === "individual_30") sessionDurationMin = 30
            else if (st === "individual_45") sessionDurationMin = 45
            else if (st === "individual_60") sessionDurationMin = 60
        }

        const firstName = (inviteeName || "").split(" ")[0] || "Explorador"

        // =============================================
        // 2. FORMATEO DE FECHA / HORA (común a ambos)
        // =============================================
        const eventDateObj = new Date(eventStartTime)

        // event_date en zona Cancún (UTC-5)
        const cancunOffset = 5 * 60 * 60 * 1000
        const cancunDate = new Date(eventDateObj.getTime() - cancunOffset)
        const eventDateStr = cancunDate.toISOString().split("T")[0]

        const localParts = new Intl.DateTimeFormat("es-MX", {
            timeZone: inviteeTimezone,
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }).formatToParts(eventDateObj)

        let diaSemana = "",
            diaMes = "",
            mes = "",
            hora = "",
            minuto = "",
            ampm = ""
        for (const part of localParts) {
            if (part.type === "weekday") diaSemana = part.value
            if (part.type === "day") diaMes = part.value
            if (part.type === "month") mes = part.value
            if (part.type === "hour") hora = part.value
            if (part.type === "minute") minuto = part.value
            if (part.type === "dayPeriod") ampm = part.value.toUpperCase()
        }

        diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
        const fechaBonita = `${diaSemana} ${diaMes} de ${mes}`
        const horaBonita = `${hora}:${minuto} ${ampm}`

        const aperturaDate = new Date(eventDateObj.getTime() - 5 * 60 * 1000)
        const aperturaParts = new Intl.DateTimeFormat("es-MX", {
            timeZone: inviteeTimezone,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }).formatToParts(aperturaDate)

        let horaAp = "",
            minAp = "",
            ampmAp = ""
        for (const part of aperturaParts) {
            if (part.type === "hour") horaAp = part.value
            if (part.type === "minute") minAp = part.value
            if (part.type === "dayPeriod") ampmAp = part.value.toUpperCase()
        }
        const horaApertura = `${horaAp}:${minAp} ${ampmAp}`

        const tzShort =
            new Intl.DateTimeFormat("es-MX", {
                timeZone: inviteeTimezone,
                timeZoneName: "short",
            })
                .formatToParts(eventDateObj)
                .find((p) => p.type === "timeZoneName")?.value ||
            inviteeTimezone

        console.log(
            `🪐 [${isCalendly ? "Calendly" : "Manual"}] ${inviteeName} (${inviteeEmail})`
        )
        console.log(
            `📅 Sesión: ${fechaBonita} a las ${horaBonita} (${tzShort}) — Zona: ${inviteeTimezone}`
        )
        console.log(`🚪 Apertura: ${horaApertura}`)

        // =============================================
        // 3. DERIVAR group_name desde la hora (Cancún UTC-5)
        //    Púlsar = 12:30 PM Cancún (< 14h) | Cuásar = 4:30 PM (≥ 14h)
        //    Se computa aquí una vez y se usa en el upsert (Calendly) y
        //    en el log (manual, donde el UI ya setteó la columna).
        // =============================================
        const eventHourCancunStr = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Cancun",
            hour: "numeric",
            hour12: false,
        }).format(eventDateObj)
        const eventHourCancun = parseInt(eventHourCancunStr, 10)
        const groupName = eventHourCancun < 14 ? "pulsar" : "cuasar"

        // =============================================
        // 4. GUARDAR EN SUPABASE (sólo si viene de Calendly)
        //    El flujo manual hace el insert desde el UI del Motor para
        //    tener UX inmediato (la Gravedad de Ignición se actualiza
        //    antes de que el email salga). Acá saltamos el upsert.
        // =============================================
        if (isCalendly) {
            const supabase = createClient(
                this.supabaseUrl,
                this.supabaseServiceKey
            )
            const { error: dbError } = await supabase
                .from("exploration_passes")
                .upsert(
                    {
                        email: inviteeEmail.toLowerCase().trim(),
                        name: inviteeName,
                        event_date: eventDateStr,
                        event_start_time: eventStartTime,
                        calendly_event_uri: calendlyEventUri,
                        group_name: groupName, // v2 — filtro para Ignicion.js
                    },
                    { onConflict: "calendly_event_uri" }
                )
            if (dbError) {
                console.error("❌ Error guardando en Supabase:", dbError)
            } else {
                console.log(
                    `✅ Explorador guardado en exploration_passes (${groupName})`
                )
            }
        } else {
            console.log(
                `⏭️  Insert saltado — trigger manual, el UI ya grabó el registro (${groupName})`
            )
        }

        // =============================================
        // 4. TRANSPORTER (PROTON SMTP)
        // =============================================
        const transporter = nodemailer.createTransport({
            host: process.env.PROTON_SMTP_HOST || "smtp.protonmail.ch",
            port: parseInt(process.env.PROTON_SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.PROTON_SMTP_USER,
                pass: process.env.PROTON_SMTP_PASS,
            },
            tls: { rejectUnauthorized: false },
        })

        // =============================================
        // 5. EMAIL DE BIENVENIDA
        // =============================================
        const logoUrl =
            "https://drive.google.com/uc?export=view&id=1t4glJMPN7JmkDKl9v0hDmhH1gavbMycD"
        const spaceBgUrl =
            "https://www.transparenttextures.com/patterns/stardust.png"
        /* v4 (2026-04-23) — Tres fuentes para el link de Zoom:
           1. body.zoom_join_url — link ÚNICO que el Stripe webhook creó
              vía Zoom API para esta reserva 1:1 específica (preferido).
              Si Zoom API falló al momento de la reserva, el webhook ya
              resolvió el fallback a ZOOM_FALLBACK_JOIN_URL allá, así que
              acá simplemente usamos lo que venga.
           2. env ZOOM_GRUPAL_LINK / ZOOM_1_1_LINK — solo se usa si el
              payload no trae zoom_join_url (ej. grupales vía Calendly,
              o flujos legacy).
           3. Hardcoded al link de Cámara Solar — último respaldo. */
        const zoomLink =
            process.env.ZOOM_GRUPAL_LINK ||
            "https://us06web.zoom.us/j/87033621223"
        const zoomLinkIndividual =
            (isIndividual && body.zoom_join_url) ||
            process.env.ZOOM_1_1_LINK ||
            "https://us06web.zoom.us/j/87033621223"
        const nucleoLink = "https://www.redsolarviva.com/nucleo"

        const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
    <u></u>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <meta name="supported-color-schemes" content="dark only">
    <title>Señal Recibida</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #050505; }
    </style>
</head>
<body bgcolor="#050505" style="margin: 0; padding: 0; background-color: #050505;">
    <div style="background-color: #050505; width: 100%;">
    <table width="100%" bgcolor="#050505" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #050505;">
        <tr>
            <td bgcolor="#050505" align="center" style="background-color: #050505; background-image: url('${spaceBgUrl}'); background-repeat: repeat; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #E0E0E0;">

                <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; width: 100%;">
                    <tbody>

                        <!-- HEADER -->
                        <tr>
                            <td align="center" style="padding: 0 0 20px 0;">
                                <p style="margin: 0 0 14px 0; font-size: 11px; letter-spacing: 6px; color: #94A3B8; text-transform: uppercase;">RED SOLAR VIVA</p>
                                <img src="${logoUrl}" alt="Red Solar Viva" style="width: 100px; max-width: 100%; height: auto;">
                                <div style="margin-top: 22px;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-shadow: 0 0 12px rgba(0, 240, 255, 0.3); white-space: nowrap;">◈ SEÑAL RECIBIDA ◈</span>
                                </div>
                                <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase;">Pase de Exploración activado</p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 0 0 25px 0;">
                                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); width: 80%;"></div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 0 10px; font-size: 16px; line-height: 1.8; color: #CCCCCC;" align="left">
                                <p style="margin: 0 0 20px 0; font-size: 18px; color: #F8FAFC;">
                                    Explorador <strong style="color: #FFD700;">${firstName}</strong>,
                                </p>

                                <p style="margin: 0 0 20px 0;">
                                    Tu señal ha sido recibida y encriptada en nuestra red. Has asegurado tu Pase de Exploración y cruzado el umbral hacia el Domo.
                                </p>

                                <p style="margin: 0 0 25px 0;">
                                    Este mensaje es el primer pulso electromagnético de tu sintonización. A partir de este momento, estás en el radar de la nave.
                                </p>

                                <div style="margin: 25px 0;">
                                    <p style="margin: 0 0 20px 0; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase; text-align: center; white-space: nowrap;">[ TUS COORDENADAS DE INMERSIÓN ]</p>

                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                        <tr>
                                            <td style="padding: 14px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                <p style="margin: 0 0 6px 0;">
                                                    <strong style="color: #FFD700;">El Reactor (Punto de Anclaje):</strong>
                                                </p>
                                                <a href="${zoomLink}" target="_blank" style="color: #00E5FF; text-decoration: none; font-size: 14px;">${zoomLink}</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 14px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                <p style="margin: 0 0 6px 0;">
                                                    <strong style="color: #FFD700;">Apertura de Compuertas:</strong>
                                                </p>
                                                <p style="margin: 0; color: #F8FAFC; font-size: 15px; line-height: 1.7;">
                                                    ${fechaBonita} a las <strong style="color: #00E5FF;">${horaApertura}</strong> (tu hora local). Puedes ingresar a esta hora para que tu sistema nervioso se vaya aclimatando a la frecuencia.
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 14px 0;">
                                                <p style="margin: 0 0 6px 0;">
                                                    <strong style="color: #FFD700;">Ignición Absoluta:</strong>
                                                </p>
                                                <p style="margin: 0; color: #F8FAFC; font-size: 15px; line-height: 1.7;">
                                                    A las <strong style="color: #00E5FF;">${horaBonita}</strong> comenzamos con fuego exacto la transmisión del código.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <p style="margin: 15px 0 25px 0; font-size: 14px; color: #94A3B8; font-style: italic;">
                                    (Tu avatar biológico recibirá una señal en tu correo 60 minutos antes de que abramos el campo).
                                </p>

                                <div style="margin: 30px 0;">
                                    <p style="margin: 0 0 18px 0; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase; text-align: center;">[ PROTOCOLO DE PREPARACIÓN ]</p>
                                    <p style="margin: 0 0 15px 0; font-size: 15px; color: #94A3B8; text-align: center;">Para que el hardware de tu cuerpo asimile el código de Sexta Densidad sin fricción:</p>

                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                <strong style="color: #FFD700;">Explora 'Mi Núcleo':</strong>
                                                <span style="color: #CCCCCC;"> Hemos habilitado tu perfil dentro de nuestra bóveda con el email desde el que estás leyendo este mensaje. Te invitamos a navegar por </span>
                                                <a href="${nucleoLink}" style="color: #00E5FF; text-decoration: none;">redsolarviva.com/nucleo</a>
                                                <span style="color: #CCCCCC;"> para familiarizarte con la geometría de nuestro ecosistema.</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(0, 229, 255, 0.08);">
                                                <strong style="color: #FFD700;">Conductividad:</strong>
                                                <span style="color: #CCCCCC;"> El día de la sesión, mantén agua pura a tu alcance. Moveremos energía de alta frecuencia y tu sistema nervioso necesitará hidratación para anclarla.</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <strong style="color: #FFD700;">Aislamiento:</strong>
                                                <span style="color: #CCCCCC;"> Asegúrate de estar en un espacio donde tu atención no sea drenada por interrupciones externas. El Domo requiere tu presencia absoluta.</span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <p style="margin: 0 0 8px 0; font-size: 16px; color: #CCCCCC;">
                                    Estamos listos para elevar la frecuencia. Prepárate para la inmersión.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 20px 0 15px 0;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #D4AF37, #F3E5AB);">
                                                <a href="${nucleoLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 8px;">
                                                    ENTRAR A MI NÚCLEO
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 15px 10px 25px 10px;" align="left">
                                <p style="margin: 0; font-size: 16px; color: #F8FAFC; line-height: 1.7;">
                                    Nos vemos en el reactor,<br>
                                    <strong>Zak'Haar</strong> <span style="color: #94A3B8;">| Red Solar Viva</span>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 0 0 20px 0;">
                                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); width: 80%;"></div>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 0 0 10px 0;">
                                <p style="margin: 0; font-size: 12px; color: #546e7a; letter-spacing: 4px;">NOS VEMOS EN LA RED ◈</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 0 0 10px 0; font-size: 11px; color: #37474f;">
                                Red Solar Viva · redsolarviva.com
                            </td>
                        </tr>

                    </tbody>
                </table>

            </td>
        </tr>
    </table>
    </div>
</body>
</html>`

        // =============================================
        // 5.2. TEMPLATE 1:1 (v3 — Cámara de Resonancia)
        // =============================================
        // Email distinto al grupal: sin "Apertura de Compuertas" (no hay
        // grupo), Zoom link personal, menciona la duración de la sesión,
        // tono de canal directo/soberano. Copy literal del prompt de Diego
        // con variables inyectadas.
        const htmlBody1to1 = `
<!DOCTYPE html>
<html lang="es">
<head>
    <u></u>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <meta name="supported-color-schemes" content="dark only">
    <title>Ignición 1:1</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #050505; }
    </style>
</head>
<body bgcolor="#050505" style="margin: 0; padding: 0; background-color: #050505;">
    <div style="background-color: #050505; width: 100%;">
    <table width="100%" bgcolor="#050505" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #050505;">
        <tr>
            <td bgcolor="#050505" align="center" style="background-color: #050505; background-image: url('${spaceBgUrl}'); background-repeat: repeat; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #E0E0E0;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; width: 100%;">
                    <tbody>
                        <tr>
                            <td align="center" style="padding: 0 0 20px 0;">
                                <p style="margin: 0 0 14px 0; font-size: 11px; letter-spacing: 6px; color: #94A3B8; text-transform: uppercase;">RED SOLAR VIVA</p>
                                <img src="${logoUrl}" alt="Red Solar Viva" style="width: 100px; max-width: 100%; height: auto;">
                                <div style="margin-top: 22px;">
                                    <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; color: #D4A843; text-shadow: 0 0 12px rgba(212, 168, 67, 0.35); white-space: nowrap;">◈ IGNICIÓN 1:1 ◈</span>
                                </div>
                                <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #94A3B8; text-transform: uppercase;">Canal directo encriptado</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 0 10px 25px 10px; font-size: 16px; line-height: 1.8; color: #CCCCCC;" align="left">
                                <p style="margin: 0 0 18px 0; font-size: 18px; color: #F8FAFC;">Explorador <strong style="color: #D4A843;">${firstName}</strong>,</p>
                                <p style="margin: 0 0 18px 0;">Tu señal ha sido recibida y el puente de comunicación <strong style="color: #00E5FF;">1:1</strong> ha quedado establecido en el núcleo de nuestra red. Has decidido colapsar la distancia para una sintonización específica; este es el inicio de una transmisión dedicada a la geometría de tu propio Avatar.</p>
                                <p style="margin: 0 0 18px 0;">Este mensaje confirma que tu coordenada temporal ha sido anclada en el radar de la nave.</p>
                            </td>
                        </tr>

                        <tr><td align="center" style="padding: 0 0 20px 0;"><div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.35), transparent); width: 80%;"></div></td></tr>

                        <tr>
                            <td style="padding: 0 10px 10px 10px;" align="left">
                                <p style="margin: 0 0 10px 0; font-size: 13px; letter-spacing: 2px; color: #D4A843; text-transform: uppercase;">◈ Tus Coordenadas de Ignición ◈</p>
                                <p style="margin: 16px 0 4px 0; font-size: 13px; letter-spacing: 1.5px; color: #94A3B8; text-transform: uppercase;">El Reactor (Enlace de Sincronización):</p>
                                <p style="margin: 0 0 18px 0;"><a href="${zoomLinkIndividual}" target="_blank" style="color: #00E5FF; word-break: break-all;">${zoomLinkIndividual}</a></p>
                                <p style="margin: 10px 0 4px 0; font-size: 13px; letter-spacing: 1.5px; color: #94A3B8; text-transform: uppercase;">Punto de Encuentro:</p>
                                <p style="margin: 0 0 6px 0; font-size: 16px; color: #F8FAFC;"><strong>${fechaBonita}</strong> a las <strong style="color: #00E5FF;">${horaBonita}</strong> (tu hora local).</p>
                                <p style="margin: 0 0 18px 0; font-size: 14px; color: #94A3B8;">Duración: <strong style="color: #D4A843;">${sessionDurationMin} minutos</strong>.</p>
                                <p style="margin: 0 0 20px 0;">Te sugerimos conectar 5 minutos antes para verificar la conductividad de tu equipo y asegurar que tu sistema nervioso entre en fase de reposo antes de iniciar el pulso.</p>
                            </td>
                        </tr>

                        <tr><td align="center" style="padding: 0 0 20px 0;"><div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.35), transparent); width: 80%;"></div></td></tr>

                        <tr>
                            <td style="padding: 0 10px 10px 10px;" align="left">
                                <p style="margin: 0 0 14px 0; font-size: 13px; letter-spacing: 2px; color: #D4A843; text-transform: uppercase;">◈ Protocolo de Sintonía Individual ◈</p>
                                <p style="margin: 0 0 16px 0;">Para que el hardware de tu cuerpo asimile la carga de información y la frecuencia de esta sesión sin resistencia:</p>
                                <p style="margin: 0 0 14px 0;"><strong style="color: #D4A843;">Explora 'Mi Núcleo':</strong> Tu perfil ya está activo. Te invitamos a navegar por <a href="${nucleoLink}" target="_blank" style="color: #00E5FF;">redsolarviva.com/nucleo</a> antes de nuestro encuentro. Familiarizarte con la arquitectura del ecosistema permitirá que durante el 1:1 podamos profundizar directamente en la raíz de tu consulta.</p>
                                <p style="margin: 0 0 14px 0;"><strong style="color: #D4A843;">Hidratación y Silicio:</strong> Moveremos energía de alta frecuencia. Asegúrate de haber mantenido una hidratación óptima con agua estructurada antes de la sesión para facilitar la conductividad eléctrica de tus células.</p>
                                <p style="margin: 0 0 24px 0;"><strong style="color: #D4A843;">Espacio Soberano:</strong> Esta es una transmisión de alta densidad. Asegúrate de estar en un espacio libre de estática externa e interrupciones. Tu presencia absoluta es el combustible de esta ignición.</p>
                                <p style="margin: 0 0 26px 0; color: #F8FAFC;">Estamos listos para decodificar tu pulso y expandir tu trayectoria.</p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 0 0 35px 0;">
                                <table border="0" cellpadding="0" cellspacing="0"><tbody><tr>
                                    <td align="center" style="border-radius: 8px; background: linear-gradient(90deg, #D4A843, #F3E5AB);">
                                        <a href="${nucleoLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 8px;">ENTRAR A MI NÚCLEO</a>
                                    </td>
                                </tr></tbody></table>
                            </td>
                        </tr>

                        <tr><td align="center" style="padding: 0 0 20px 0;"><div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); width: 80%;"></div></td></tr>

                        <tr>
                            <td align="center" style="padding: 0 0 8px 0; font-size: 14px; color: #E0E0E0;">
                                Nos vemos en el reactor,
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 0 0 16px 0; font-size: 13px; color: #D4A843; letter-spacing: 1px;">
                                Zak'Haar · Red Solar Viva
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 0 0 10px 0; font-size: 11px; color: #37474f;">
                                redsolarviva.com
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </table>
    </div>
</body>
</html>`

        // =============================================
        // 6. ENVIAR EMAIL (branch por tipo de sesión)
        // =============================================
        const isIndividualEmail = isIndividual === true
        const subjectToSend = isIndividualEmail
            ? "[ IGNICIÓN 1:1 ] Tu canal directo ha sido encriptado"
            : "[ SEÑAL RECIBIDA ] Has cruzado el umbral. Bienvenido a la Cámara Solar."
        const bodyToSend = isIndividualEmail ? htmlBody1to1 : htmlBody

        try {
            await transporter.sendMail({
                from: process.env.PROTON_SMTP_USER,
                to: inviteeEmail,
                subject: subjectToSend,
                html: bodyToSend,
            })
            console.log(
                `✅ Email ${isIndividualEmail ? "1:1" : "grupal"} enviado a ${inviteeEmail}`
            )
        } catch (err) {
            console.error(`❌ Error enviando email: ${err.message}`)
            throw err // re-throw para que el HTTP trigger retorne 5xx y el UI muestre "Email falló"
        }

        return {
            status: "✅ Tripulante procesado",
            source: isCalendly
                ? "calendly"
                : isIndividual
                  ? "individual"
                  : "manual",
            name: inviteeName,
            email: inviteeEmail,
            eventDate: eventDateStr,
            eventTime: `${horaBonita} (${tzShort})`,
            aperturaTime: horaApertura,
            timezone: inviteeTimezone,
            durationMin: isIndividualEmail ? sessionDurationMin : null,
        }
    },
})
