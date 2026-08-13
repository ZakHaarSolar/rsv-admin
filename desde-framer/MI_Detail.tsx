// MI_Detail.tsx v1.23 — 🜂 EL CONTENIDO SE DISUELVE, NO SE GUILLOTINA (Zak 2026-08-09): el cuerpo del panel cortaba las tarjetas a filo contra su borde superior, justo debajo de los controles flotantes, y media tarjeta cortada ahí se lee como un error de render. Ahora se mide si queda algo fuera de vista de cada lado y solo entonces se desvanece ESE borde; en reposo no se atenúa nada. Antes de tocar se VERIFICÓ con un arnés que el envoltorio de refresco de la v1.22 no movía la geometría (alturas y posiciones idénticas en las dos versiones): el corte era anterior.
//
// MI_Detail.tsx v1.22 — 🜂 REFRESCO POR TARJETA (Zak 2026-08-09): la ficha se arma con doce lecturas y hasta ahora el único gesto para ponerla al día las pedía LAS DOCE. Se verificó una por una que cada tarjeta cuelga de UNA consulta propia, así que ahora cada una tiene su gesto (aparece al acercar el puntero) con velo de carga LOCAL: el resto de la ficha no se mueve ni parpadea. Lo que trae se guarda además en el cofre del nodo, así que cerrar y reabrir muestra el dato nuevo. Única excepción declarada: Decodificador de Materia, Decodificador de Sueños, Versión de la app y la franja de suscripción comen de la MISMA lectura (get_tripulante_extras) y se mueven juntas; sigue siendo una consulta contra doce.
//
// MI_Detail.tsx v1.19.2 — El rostro GIRA (la geometría se voltea y del otro lado
// está la cara, como la ficha pública de la app) y se prefiere la foto que el
// Tripulante ELIGIÓ dentro de la app sobre la congelada de Clerk. Requiere
// migración 20260806c_foto_de_la_app + admin-action v1.48.
//
// MI_Detail.tsx v1.18 — DE DÓNDE ENTRA CADA NODO (Zak): ciudad, país,
// navegador e IP de la sesión más reciente, tal como Clerk los vio, con la
// advertencia explícita de que en el escritorio web esa dirección es la de
// NUESTRO servidor (Ashburn) y no la de la persona. + los reflejos del Espejo
// se leen como los decodificadores (N / 3 · Restantes). Requiere
// get-clerk-user-activity v1.5.
//
// MI_Detail.tsx v1.17 — LA FICHA DEL NODO DICE MÁS (Zak 2026-08-06): (1)
// REFLEJOS del Espejo Vibracional —enviados y cuántos le quedan de los 3 de
// cortesía—; (2) ONBOARDING: por dónde llegó y qué contestó, enlazado a su
// cuenta al crearla; (3) el APARATO distingue navegador de escritorio y
// navegador móvil; (4) los pilares hablan el lenguaje experiencial (Cuerpo,
// Mente, Emociones, Abundancia, Propósito, Vínculos) en vez de Hardware,
// Procesador y Gravedad. Requiere migración 20260806_motor_ficha_nodo +
// admin-action v1.47.
//
// MI_Detail.tsx v1.21 — 🜂 LA ESPERA DE LA FICHA DEJA DE SER MUDA (Zak 2026-08-09): la ficha de un nodo se arma con DOCE lecturas en fila, una tras otra, y hasta ahora eso era un "Hidratando telemetría…" sin fondo ni horizonte. Ahora hay barra: se llena conforme cada lectura regresa (haya traído datos o haya fallado, que es lo que importa para saber cuánto falta de espera) y muestra el conteo 7/12. La cuenta NO se instrumentó llamada por llamada: el efecto declara una SOMBRA local de adminAction que cuenta cada regreso, así las doce siguen escritas igual y agregar una mañana no obliga a tocar nada más que PASOS_FICHA. La barra se capa al 92%: el 100% lo dice la ficha al aparecer, no un contador que podría adelantarse. | v1.20 — 🜂 UNA ESCRITURA REFRESCA LO QUE TOCÓ, NO TODO (Zak 2026-08-07): regalar, cancelar o revocar Sintonía llamaba onRefresh() → re-fetch del Padrón COMPLETO → la ficha abierta se vaciaba y volvía a decir "Cargando telemetría" para reflejar un cambio que la propia tarjeta ya sabía (refreshGiftStatus lo actualiza local). Retirado de los tres handlers; la rejilla se pone al día con su botón Recargar. El botón explícito de recarga de la ficha sigue intacto.
// MI_Detail.tsx v1.16 — (1) EN QUÉ APARATO: tarjeta nueva "Aparato" con las
// pastillas Apple / Android / Navegador de cada nodo, de la RPC propia
// get_tripulante_platforms (unión de push_tokens + nav_events; va aparte de
// get_tripulante_extras para que si falla se pierda la etiqueta y no la ficha).
// (2) LA FICHA NO SE VUELVE A CARGAR: las nueve consultas encadenadas que
// dispara abrir un nodo se guardan en un cofre de módulo por nodo; reabrirlo es
// instantáneo y solo se relee al recargar la página o al pedir recargar el
// padrón. Requiere migración 20260804b_extras_plataforma + admin-action v1.46.
//
// MI_Detail.tsx v1.15 — "Versión de la app" a prueba de confusiones: (1) la tarjeta muestra fecha + HORA del último reporte ("Reportada 6 jul · 15:41") — la fila guarda el ÚLTIMO reporte de un device con esa sesión, y la hora delata QUIÉN/CUÁNDO escribió (p.ej. un login web o la cuenta abierta en otro aparato); la app (AppVersionSync v1.1) ya SOLO reporta desde el build nativo, la web queda fuera. (2) El reset al cambiar de nodo ahora también limpia ritualData + rachasData (antes podían mostrar por un instante los datos del nodo anterior si su fetch fallaba).
// MI_Detail.tsx v1.14 — card "Rachas" en el detalle del nodo: uso del Contador de Rachas (cuántos contadores activos, días de cada uno, la más larga y si es miembro) vía admin_get_user_rachas (admin-action v1.29 + migración 20260706b). Por ÉTICA los títulos NO se muestran aquí (texto libre íntimo, mismo criterio que sueños/Espejo); se leen ANÓNIMOS en Motor → pestaña "Rachas".
// MI_Detail.tsx v1.16 — VIGENCIA DE LA CORTESÍA + AVANCE DE SONDAS (Zak): (1) tarjeta nueva de Cortesía Solar que dice de cuándo a cuándo corre, cuántos días quedan (o hace cuántos venció) y cuándo se aceptó, con barra del mes consumido — el panel mostraba la cortesía como viva para siempre porque admin_get_gift_status v1 solo miraba status='active' sin current_period_end, mientras la app ya había bajado al Tripulante a Explorador. (2) Tarjeta nueva de Avance de sondas: los 6 pilares con su estado real (sellado con puntaje · 2 de 8 en curso · sin iniciar) + el ciclo N/6 y la fecha del último escaneo, para ver si abandonan el escaneo y dónde. Consume admin_get_user_sonda_progress por adminAction. Requiere migración 20260727_motor_cortesia_y_sondas + admin-action v1.43. | v1.15 — FIX: el botón Revocar NO aparecía tras aceptar el regalo. Un regalo ACEPTADO es una suscripción activa (gift_sintonia_%) → is_subscriber=true → el bloque de acción admin (bajo !isSubscriber) se escondía por completo. Ahora el bloque también se muestra si hay regalo aceptado o pendiente (giftAcceptedEff/giftPending), y giftAcceptedEff usa el estado del servidor (admin_get_gift_status) como AUTORITATIVO una vez cargado (con respaldo a isGiftInitial/subscription_is_gift antes de resolver). | v1.14 — REGALO en 3 estados en el Motor (Zak): consulta admin_get_gift_status al abrir el detalle → si hay un regalo PENDIENTE (ofrecido, sin aceptar) muestra el estatus "Regalo Sintonía Solar: pendiente" + botón "Cancelar invitación" (admin_cancel_gift_offer, borra el gift_offer no reclamado → deja de aparecer la tarjeta/celebración en Mi Núcleo y ya no puede aceptarlo; la push que ya salió no se des-envía). Si ya lo ACEPTÓ (cortesía activa) muestra "Revocar Sintonía" (admin_revoke_sintonia, el antiguo "Desactivar Cortesía", relabelado). Si no hay nada, muestra "Regalar Sintonía Solar". El estado se refresca tras cada acción (ofrecer/cancelar/revocar) sin recargar el Padrón. Requiere migración 20260709b + admin-action v1.29. | v1.13 — "Regalar Sintonía Solar" ahora envía un REGALO con celebración: crea un regalo pendiente (admin_offer_gift_sintonia) en vez de activar al instante; el Tripulante lo acepta en la app (celebración épica) y ahí se activa. Copy del confirm actualizado.
// MI_Detail.tsx v1.12 — card "Versión de la app" en el detalle del nodo: muestra qué versión corre cada Tripulante (extras.app_version, de get_tripulante_extras v9). Número interno de telemetría; "—" = build anterior al tracking o sin abrir desde actualizar.
// MI_Detail.tsx v1.11 — el modal del nodo ya NO se sale de la pantalla: queda capeado a la altura del viewport y SOLO su cuerpo (mi-trip-scrollbody) scrollea; el chrome y los overlays de expandir quedan anclados → al expandir, el panel NO crece más que la pantalla, scrollea adentro. + RitualDiarioDetail con animaciones smooth (filas de días escalonadas + barras de uso que se llenan).
// v1.10 — Card "Ritual Diario" en el detalle del nodo (Fotones, racha, # activos) + vista expandible (RitualDiarioDetail): rituales activos ahora, últimos 7 días (qué cumplió cada día) y uso por ritual de 30 días. Consume admin_get_user_ritual_data por adminAction. La historia NO se pierde (daily_checkins persiste).
// v1.9 — (1) Sueños muestra RESTANTES X/3 para freemium (espejo de Materia, fuente dream_scans) + acceso por tier; (2) carga UNIFICADA: el detalle se revela completo de una sola vez (sectionsLoaded), no escalonado; (4) tiers Decodificador · Materia (199) y · Materia + Sueños (399) en la insignia + etiquetas de acceso
// v1.8.3 — conteo de Sueños decodificados por Tripulante (dream_records) junto a los demás datos del detalle
// v1.8.2 — estado de correo por gateway admin-action (cierra IDOR de email, barrido 2026-06-13)
// v1.7 — Ola C #3 Fase 3: la lectura de actividad de Clerk manda el token
// de sesión verificado a get-clerk-user-activity (ya no solo admin_clerk_id),
// para que el cierre del fallback server-side no deje al Padrón sin actividad.
// v1.5 — Acción admin gana "Desactivar Cortesía" (1 click) junto a
// "Regalar Sintonía Solar". Aparece solo cuando el nodo tiene una
// cortesía activa (isGiftInitial). Llama a la RPC admin_revoke_sintonia
// que cancela SOLO las filas sintéticas gift_sintonia_% (nunca una
// suscripción real de Stripe). Uso principal: dejar cuentas de revisión
// de Apple sin membresía para que el In-App Purchase sea visible.
// Confirmación propia (rojo) espejo del flujo de regalo.
// v1.4.1 — Re-publish trigger para invalidar CDN tras reporte 2026-05-07.
// v1.4 — Card de Cristales gana el botón "−" (RevokeCristalButton) a la
// izquierda del contador, espejo del "+" de regalo. Llama a la nueva RPC
// admin_revoke_cristal (LIFO sobre cristales no canjeados). Disabled
// cuando el contador ya está en 0 o cuando un grant/revoke está en
// vuelo. Aplica a Códice y a Meditación; en Inmersión la meditación
// queda con ∞ sin botones (mismo gating que el "+"). Se pulsa el
// contador con cristalPulse para feedback inmediato; sin overlay
// ritual (la celebración solo aplica al regalo).
// v1.3 — Tres ajustes en el panel del Tripulante:
// (1) Card "Navegantes de la Red": fila completa "Última conquista —
//     Membrana X ✦ Acorde" eliminada; el contador de Membranas se queda
//     pero ahora ocupa el card completo en una fila ancha y muestra
//     a la derecha la fecha de la última membrana cumplida (compacto,
//     gana la altura que pedía no se salir de la pantalla).
// (2) Pilares · Último Pulso + In-flight: lectura de scores arreglada.
//     Antes leíamos directo `t.history[0].fisico|...` y aparecían
//     valores 50% en pilares que el Tripulante nunca escaneó (carry-over
//     desde el row al insertar). Ahora caminamos history del más reciente
//     al más antiguo y solo aceptamos el score de un pilar si el campo
//     `cycle_scanned_json` de ese row incluye al pilar — fuente de
//     verdad real. Caso Borges (cuenta nueva, escaneó MENTAL solo):
//     ahora HARDWARE/MOTOR/GRAVEDAD/VECTOR/ÓRBITA salen como "Sin datos"
//     en lugar de "Disponible · 50%".
// (3) Header del panel: nuevo span "Cuenta creada" en el meta, junto a
//     "Último ingreso", con la fecha de creación de la cuenta del
//     Tripulante en horario de Cancún. Captura `created_at` desde la
//     edge function get-clerk-user-activity v1.2 que ya lo retornaba.
//     Sin filas nuevas — entra en la cuadrícula meta existente.
// MI_Detail.tsx v1.2
// v1.2 — Card "Navegantes de la Red" en panel expandido. Consume RPC
// admin_get_user_navegante_progress y muestra: Tutorial cumplido sí/no,
// Membranas conquistadas (X de 20), última conquistada con fecha y badge
// dorado "✦ Acorde" si activó el código secreto en alguna corrida.
// Modal del nodo del Motor de Intervención (TripulanteDetail).
// v1.1 — Defaults defensivos en todas las props. Framer instancia
// componentes standalone al cargar el Code File; sin defaults
// `t.clerk_user_id` etc crasheaban con "Cannot read properties of
// undefined". Agregado un placeholder vacío + guard JSX al render
// (después de los hooks, para no romper rules-of-hooks).
// Telemetría completa de un Tripulante: identidad, decodificador, estado
// de suscripción, cristales (con regalo individual), correos del Nodo,
// pilares, trayectoria, acciones admin (regalar Sintonía, eliminar datos)
// y lista de Códices Adquiridos (compras + canjes con cristal).
//
// v1.0 Nuevo: vista interna expandible de "Códices Adquiridos" cuando hay
// más de 3 — sigue el patrón canónico del Holograma de Expansión (header
// con título + botón Volver + ESC, body scrollable, position absolute
// inset:0 sobre el contenido del modal).
//
// Consumidor: MI_Tripulantes (grid).

import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Shared from "./MI_Shared.tsx"
import Cristales from "./MI_Cristales.tsx"

const { rpc, adminAction, hx, AC, GOLD, PILAR_LABELS, PILAR_ORDER, TripulanteHex } =
    Shared

/* 🜂 v1.21 — ALIAS DEL GATEWAY PARA PODER CONTAR EL AVANCE. La ficha del nodo
   se arma con doce lecturas EN FILA, una tras otra, y por eso a veces se hace
   esperar sin decir nada. Para saber por dónde va sin tocar las doce llamadas,
   el efecto declara una SOMBRA local de `adminAction` que cuenta cada regreso;
   esa sombra necesita poder llamar al de verdad, y desde adentro no puede
   nombrarlo (sería ella misma). De ahí este alias. */
const adminActionBase = adminAction
/* Cuántas lecturas arma la ficha. Si mañana se agrega o se quita una, ajustar
   este número: la barra se queda corta o larga, nunca miente al terminar
   (el bloque entero desaparece cuando la ficha está lista). */
const PASOS_FICHA = 13
const { CristalRitualOverlay, GrantCristalButton, RevokeCristalButton } =
    Cristales

/* Avance de sondas por pilar de un tripulante
   (RPC admin_get_user_sonda_progress). `answered` = respuestas ya elegidas
   del pilar en curso; `sealed` = pilar cerrado en el ciclo del último scan. */
type SondaPilarProg = {
    pilar: string
    total: number
    answered: number
    current_question: number | null
    updated_at: string | null
    sealed: boolean
    score: number | null
}
type SondaProgData = {
    success?: boolean
    last_scan_at: string | null
    cycle: string[] | null
    cycle_size: number
    pilares: SondaPilarProg[]
}

/* Estado del regalo de Sintonía CON vigencia (admin_get_gift_status v2). */
type GiftInfo = {
    pending?: boolean
    accepted?: boolean
    expired?: boolean
    offered_at?: string | null
    claimed_at?: string | null
    started_at?: string | null
    expires_at?: string | null
    days_left?: number | null
}

/* Datos del Ritual Diario de un tripulante (RPC admin_get_user_ritual_data). */
type RitualData = {
    total_fotones: number
    streak: number
    days_active: number
    first_day: string | null
    active: { activity_key: string; label: string }[]
    days: {
        date: string
        fotones: number
        items: { activity_key: string; label: string; points: number }[]
    }[]
    by_activity: {
        activity_key: string
        label: string
        count: number
        fotones: number
    }[]
}

interface TripulanteRow {
    clerk_user_id: string
    full_name: string
    scan_count: number
    complete_cycles: number
    last_scan_ts: string | null
    history: Array<{
        ts: string
        indice: number | null
        fisico: number | null
        mental: number | null
        emocional: number | null
        financiero: number | null
        vector: number | null
        orbita: number | null
        cycle: string | any[] | null
    }>
    in_flight_pilars: string[] | null
}

interface TripulanteExtras {
    is_subscriber: boolean
    tier: string | null
    decoder_scans_used: number
    dream_scans_used?: number
    last_complete_cycle_ts: string | null
    email?: string | null
    purchases?:
        | {
              book_id: string
              title: string
              device: string | null
              formats: string[] | null
              purchased_at: string
              amount_cents: number | null
          }[]
        | null
    subscription_started_at?: string | null
    subscription_current_period_end?: string | null
    subscription_cancel_at_period_end?: boolean | null
    subscription_is_gift?: boolean | null
    app_version?: string | null
    app_version_updated_at?: string | null
}

interface EmailSubscriptionStatus {
    email: string | null
    in_nodo: boolean
    subscribed_at: string | null
    nodo_source: string | null
    nodo_source_from?: string | null
    has_opt_out: boolean
    opted_out_at: string | null
    opt_out_reason: string | null
    opt_out_category: string | null
    opt_out_source: string | null
}

type CodiceFull = {
    book_id: string
    title: string
    acquired_via: string
    formats: string[] | null
    device: string | null
    purchased_at: string | null
    amount_cents: number | null
    reading_percentage: number
    reading_updated_at: string | null
}

/* ═══════════════════════════════════════════════════════════════════
   🜂 v1.16 — LA FICHA DE UN NODO NO SE VUELVE A CARGAR (Zak)

   Abrir un nodo dispara NUEVE consultas encadenadas (extras, aparato,
   estado del correo, suscripción al Nodo Central, cristales, Navegante,
   ritual, rachas, avance de sondas, códices). Cerrar la ficha y volver a
   abrirla las repetía todas, con su espera completa — y en el Motor uno
   entra y sale de las fichas todo el tiempo.

   Lo ya leído vive en un cofre de MÓDULO por nodo. Al reabrir, la ficha
   se pinta con lo que hay dentro y no pide nada. Se trae de nuevo solo
   cuando se recarga la página (el módulo se evalúa otra vez) o cuando se
   pide recargar el padrón, que es el gesto que significa "quiero datos
   frescos". Mismo criterio que el cofre del padrón en MI_Tripulantes.
   ═══════════════════════════════════════════════════════════════════ */
type FichaCofre = {
    extras: any
    plataformas: string
    espejoOnb: any
    mailStatus: any
    subStatus: any
    cristales: any
    navegante: any
    ritualData: any
    rachasData: any
    sondaProg: any
    codicesFull: CodiceFull[]
}
const FICHA_COFRE = new Map<string, FichaCofre>()

/* Nombres legibles de las respuestas del onboarding. Las claves las escribe
   OnboardingV2 dentro del jsonb `answers`; cualquiera que no esté acá se
   muestra tal cual (el mapa nunca esconde información). */
const ONB_ETIQUETAS: Record<string, string> = {
    origin: "Llegó por",
    goal: "Busca",
    symptom: "Síntoma",
    food: "Comida",
    dream: "Sueño",
    pillar: "Pilar",
    codice: "Códice",
}

/* ═══════════════════════════════════════════════════════════════════
   🜂 REFRESCO POR TARJETA (Zak 2026-08-09)
   ═══════════════════════════════════════════════════════════════════
   La ficha se arma con doce lecturas y hasta ahora el único gesto para
   ponerla al día las pedía LAS DOCE. Si lo único que se quiere saber es
   si el regalo ya se aceptó, eso es UNA consulta, no doce.

   Cada tarjeta de la ficha cuelga de una consulta propia (se verificó una
   por una), así que cada una puede pedir la suya sola. La única excepción
   son las cuatro que se alimentan de `get_tripulante_extras` —
   Decodificador de Materia, Decodificador de Sueños, Versión de la app y
   la franja de suscripción—: comparten UNA lectura, así que refrescar
   cualquiera pone al día a las cuatro. Sigue siendo una consulta contra
   doce; simplemente se mueven juntas.

   El envoltorio no toca el interior de ninguna tarjeta: le pone encima un
   gesto discreto (aparece al acercar el puntero) y un velo de carga LOCAL.
   El resto de la ficha no se mueve ni parpadea. */
function TarjetaRefrescable({
    onRefrescar,
    cargando,
    titulo,
    children,
}: {
    onRefrescar: () => void
    cargando: boolean
    titulo: string
    children: React.ReactNode
}) {
    const [hover, setHover] = useState(false)
    return (
        <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div
                style={{
                    opacity: cargando ? 0.45 : 1,
                    transition: "opacity 0.22s ease",
                }}
            >
                {children}
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onRefrescar()
                }}
                disabled={cargando}
                title={titulo}
                aria-label={titulo}
                style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 999,
                    border: "1px solid rgba(0,229,255,0.28)",
                    background: "rgba(4,12,26,0.82)",
                    color: "rgba(0,229,255,0.85)",
                    fontSize: 12,
                    lineHeight: 1,
                    cursor: cargando ? "default" : "pointer",
                    padding: 0,
                    /* Nace invisible y se revela al acercarse: la ficha se lee
                       limpia y el gesto aparece cuando se busca. Mientras carga
                       se queda visible, que es cuando hace falta verlo. */
                    opacity: cargando ? 1 : hover ? 1 : 0,
                    transition: "opacity 0.18s ease",
                    zIndex: 3,
                }}
            >
                <span
                    style={{
                        display: "block",
                        animation: cargando
                            ? "mi-spin 0.9s linear infinite"
                            : "none",
                    }}
                >
                    ↻
                </span>
            </button>
        </div>
    )
}

/* Placeholder vacío para Framer standalone preview. */
const PLACEHOLDER_TRIP: TripulanteRow = {
    clerk_user_id: "",
    full_name: "",
    scan_count: 0,
    complete_cycles: 0,
    last_scan_ts: null,
    history: [],
    in_flight_pilars: null,
}

function TripulanteDetail({
    t = PLACEHOLDER_TRIP,
    onClose = () => {},
    onPrev = () => {},
    onNext = () => {},
    position = { idx: 0, total: 0 },
    onRefresh = () => {},
    refreshing = false,
    onEliminar = () => {},
    eliminando = false,
    url = "",
    apiKey = "",
    adminClerkId = "",
    isGoldInitial = false,
    isSintoniaInitial = false,
    isGiftInitial = false,
    lastSignInAt = null,
}: {
    t?: TripulanteRow
    onClose?: () => void
    onPrev?: () => void
    onNext?: () => void
    position?: { idx: number; total: number }
    onRefresh?: () => void
    refreshing?: boolean
    onEliminar?: () => void
    eliminando?: boolean
    url?: string
    apiKey?: string
    adminClerkId?: string
    isGoldInitial?: boolean
    isSintoniaInitial?: boolean
    isGiftInitial?: boolean
    lastSignInAt?: number | null
}) {
    const [confirmEliminar, setConfirmEliminar] = useState(false)
    const [confirmRegalo, setConfirmRegalo] = useState(false)
    const [regalando, setRegalando] = useState(false)
    const [regaloMsg, setRegaloMsg] = useState<string | null>(null)
    /* v1.5 — desactivar cortesía (1 click). */
    const [confirmRevoke, setConfirmRevoke] = useState(false)
    const [revoking, setRevoking] = useState(false)
    const [revokeMsg, setRevokeMsg] = useState<string | null>(null)
    /* v1.14 — estado del regalo (pendiente/aceptado) + cancelar la invitación
       pendiente. Se consulta al abrir el detalle y se refresca tras cada
       acción (ofrecer / cancelar / revocar) para que la UI refleje el estado
       sin recargar el Padrón. */
    const [giftPending, setGiftPending] = useState(false)
    const [giftAccepted, setGiftAccepted] = useState(false)
    /* v1.15 — una vez que admin_get_gift_status respondió, giftAccepted es
       AUTORITATIVO (mata la señal stale de props/extras tras revocar). */
    const [giftStatusLoaded, setGiftStatusLoaded] = useState(false)
    /* v1.16 — fechas de la cortesía (inicio, fin, días restantes). */
    const [giftInfo, setGiftInfo] = useState<GiftInfo | null>(null)
    const [confirmCancelGift, setConfirmCancelGift] = useState(false)
    const [cancellingGift, setCancellingGift] = useState(false)
    /* v1.0 — vista interna expandible. Cuando expandedSection === "codices",
       la sección de Códices Adquiridos toma toda el área del modal.
       ESC cierra primero esta vista; un segundo ESC cierra el modal. */
    const [expandedSection, setExpandedSection] = useState<
        "codices" | "rituales" | null
    >(null)

    /* 🜂 v1.22 — REFRESCO POR TARJETA. Qué tarjeta está pidiendo su consulta
       ahora mismo (cadena vacía = ninguna). Es una sola a la vez a propósito:
       apretar tres seguidas debe leerse como tres gestos, no como una recarga
       completa disfrazada. */
    const [refrescandoCard, setRefrescandoCard] = useState("")

    /* Pide UNA consulta y aplica su resultado donde toca. Además guarda lo
       nuevo en el cofre de este nodo, así que cerrar la ficha y volver a
       abrirla muestra el dato fresco y no el de la primera carga. */
    const refrescaTarjeta = useCallback(
        async (
            clave: string,
            accion: string,
            params: Record<string, any>,
            aplicar: (r: any, snap: FichaCofre | undefined) => void
        ) => {
            if (!t.clerk_user_id || refrescandoCard) return
            setRefrescandoCard(clave)
            try {
                const r = await adminAction(url, apiKey, accion, params)
                aplicar(r, FICHA_COFRE.get(t.clerk_user_id))
            } catch {
                /* silencioso: la tarjeta se queda con lo que ya tenía */
            } finally {
                setRefrescandoCard("")
            }
        },
        [url, apiKey, t.clerk_user_id, refrescandoCard]
    )

    /* v1.14 — consulta el estado del regalo (pendiente/aceptado) del nodo. */
    const refreshGiftStatus = useCallback(async () => {
        try {
            const r = await adminAction(url, apiKey, "admin_get_gift_status", {
                p_target_clerk_id: t.clerk_user_id,
            })
            if (r && (r as any).success) {
                setGiftPending(!!(r as any).pending)
                setGiftAccepted(!!(r as any).accepted)
                setGiftInfo(r as GiftInfo)
                setGiftStatusLoaded(true)
            }
        } catch {
            /* silencioso: si falla, la UI cae al estado por props */
        }
    }, [url, apiKey, t.clerk_user_id])

    const handleActivateSintonia = useCallback(async () => {
        if (regalando) return
        setRegalando(true)
        setRegaloMsg(null)
        try {
            // Crea un regalo PENDIENTE: el Tripulante lo acepta en la app (con la
            // celebración) y ahí se activa la Sintonía. No activa al instante.
            const r = await adminAction(
                url,
                apiKey,
                "admin_offer_gift_sintonia",
                { p_target_clerk_id: t.clerk_user_id }
            )
            const ok = !!(r && (r as any).success)
            if (ok) {
                setRegaloMsg(
                    (r as any)?.already_pending
                        ? "Ya tenía un regalo pendiente por aceptar."
                        : "Regalo enviado · lo verá y aceptará en la app."
                )
                setConfirmRegalo(false)
                setGiftPending(true)
                refreshGiftStatus()
                /* 🜂 NO se recarga el Padrón entero (Zak 2026-08-07). Antes
                   esto llamaba onRefresh() → re-fetch de TODOS los nodos → la
                   ficha abierta se vaciaba y volvía a decir "Cargando
                   telemetría" para reflejar un cambio que esta misma tarjeta
                   ya sabe. Lo único que se movió es el estado del regalo, y
                   refreshGiftStatus() lo actualiza solo. La rejilla se pone al
                   día con su propio botón Recargar. Regla: una escritura
                   refresca lo que TOCÓ, no todo lo que hay en pantalla. */
                setTimeout(() => setRegaloMsg(null), 6000)
            } else {
                setRegaloMsg(
                    `Error: ${(r as any)?.error || "no se pudo enviar"}`
                )
            }
        } catch (e: any) {
            setRegaloMsg(`Error: ${e?.message || "fail"}`)
        } finally {
            setRegalando(false)
        }
    }, [
        regalando,
        url,
        apiKey,
        adminClerkId,
        t.clerk_user_id,
        onRefresh,
        refreshGiftStatus,
    ])

    /* v1.5 — Desactivar cortesía. Espejo de handleActivateSintonia.
       Cancela solo las filas gift_sintonia_% del Tripulante; el nodo
       vuelve a Explorador al instante. */
    const handleRevokeSintonia = useCallback(async () => {
        if (revoking) return
        setRevoking(true)
        setRevokeMsg(null)
        try {
            const r = await adminAction(url, apiKey, "admin_revoke_sintonia", {
                p_target_clerk_id: t.clerk_user_id,
            })
            const ok = !!(r && (r as any).success)
            if (ok) {
                const n = (r as any)?.revoked ?? 0
                setRevokeMsg(
                    n > 0
                        ? "Cortesía desactivada · ahora es Explorador"
                        : "Este nodo no tenía cortesía activa"
                )
                setConfirmRevoke(false)
                setGiftAccepted(false)
                refreshGiftStatus()
                /* 🜂 NO se recarga el Padrón entero (Zak 2026-08-07). Antes
                   esto llamaba onRefresh() → re-fetch de TODOS los nodos → la
                   ficha abierta se vaciaba y volvía a decir "Cargando
                   telemetría" para reflejar un cambio que esta misma tarjeta
                   ya sabe. Lo único que se movió es el estado del regalo, y
                   refreshGiftStatus() lo actualiza solo. La rejilla se pone al
                   día con su propio botón Recargar. Regla: una escritura
                   refresca lo que TOCÓ, no todo lo que hay en pantalla. */
                setTimeout(() => setRevokeMsg(null), 6000)
            } else {
                setRevokeMsg(
                    `Error: ${(r as any)?.error || "no se pudo desactivar"}`
                )
            }
        } catch (e: any) {
            setRevokeMsg(`Error: ${e?.message || "fail"}`)
        } finally {
            setRevoking(false)
        }
    }, [
        revoking,
        url,
        apiKey,
        adminClerkId,
        t.clerk_user_id,
        onRefresh,
        refreshGiftStatus,
    ])

    /* v1.14 — Cancelar la invitación de regalo PENDIENTE: borra el gift_offer
       no reclamado del nodo. La tarjeta/celebración deja de aparecer en Mi
       Núcleo y ya no puede aceptarla. (La push que ya salió no se des-envía.) */
    const handleCancelGift = useCallback(async () => {
        if (cancellingGift) return
        setCancellingGift(true)
        setRegaloMsg(null)
        try {
            const r = await adminAction(
                url,
                apiKey,
                "admin_cancel_gift_offer",
                { p_target_clerk_id: t.clerk_user_id }
            )
            const ok = !!(r && (r as any).success)
            if (ok) {
                setRegaloMsg("Invitación cancelada · ya no puede aceptarla.")
                setConfirmCancelGift(false)
                setGiftPending(false)
                refreshGiftStatus()
                /* 🜂 NO se recarga el Padrón entero (Zak 2026-08-07). Antes
                   esto llamaba onRefresh() → re-fetch de TODOS los nodos → la
                   ficha abierta se vaciaba y volvía a decir "Cargando
                   telemetría" para reflejar un cambio que esta misma tarjeta
                   ya sabe. Lo único que se movió es el estado del regalo, y
                   refreshGiftStatus() lo actualiza solo. La rejilla se pone al
                   día con su propio botón Recargar. Regla: una escritura
                   refresca lo que TOCÓ, no todo lo que hay en pantalla. */
                setTimeout(() => setRegaloMsg(null), 6000)
            } else {
                setRegaloMsg(
                    `Error: ${(r as any)?.error || "no se pudo cancelar"}`
                )
            }
        } catch (e: any) {
            setRegaloMsg(`Error: ${e?.message || "fail"}`)
        } finally {
            setCancellingGift(false)
        }
    }, [
        cancellingGift,
        url,
        apiKey,
        t.clerk_user_id,
        onRefresh,
        refreshGiftStatus,
    ])

    const [grantingCristal, setGrantingCristal] = useState<
        "codice" | "meditacion" | null
    >(null)
    const [cristalPulse, setCristalPulse] = useState<
        "codice" | "meditacion" | null
    >(null)
    const [cristalRitual, setCristalRitual] = useState<
        "codice" | "meditacion" | null
    >(null)
    const [cristales, setCristales] = useState<{
        codice_count: number
        meditacion_count: number
    } | null>(null)
    const [navegante, setNavegante] = useState<{
        tutorial_completed: boolean
        membranas_completed: number
        last_completed_id: number | null
        last_updated: string | null
        has_chord: boolean
    } | null>(null)
    const [ritualData, setRitualData] = useState<RitualData | null>(null)
    const [rachasData, setRachasData] = useState<any>(null)
    /* v1.16 — Avance de sondas por pilar (RPC admin_get_user_sonda_progress). */
    const [sondaProg, setSondaProg] = useState<SondaProgData | null>(null)
    const handleGrantCristal = useCallback(
        async (tipo: "codice" | "meditacion") => {
            if (grantingCristal || cristalRitual) return
            setGrantingCristal(tipo)
            setCristalRitual(tipo)
            setTimeout(() => setCristalRitual(null), 1600)
            try {
                const r = await adminAction(url, apiKey, "admin_grant_cristal", {
                    p_target_clerk_id: t.clerk_user_id,
                    p_tipo: tipo,
                })
                if (r && (r as any).success) {
                    const newCodice = (r as any).codice_count ?? 0
                    const newMed = (r as any).meditacion_count ?? 0
                    setCristales({
                        codice_count: newCodice,
                        meditacion_count: newMed,
                    })
                    setCristalPulse(tipo)
                    setTimeout(() => setCristalPulse(null), 700)
                }
            } catch {}
            finally {
                setGrantingCristal(null)
            }
        },
        [grantingCristal, cristalRitual, url, apiKey, adminClerkId, t.clerk_user_id]
    )
    /* Restar un cristal disponible. Espejo de handleGrantCristal pero
       sin overlay ritual (la celebración es solo para el regalo). El
       contador se anima con cristalPulse para feedback inmediato. */
    const handleRevokeCristal = useCallback(
        async (tipo: "codice" | "meditacion") => {
            if (grantingCristal || cristalRitual) return
            setGrantingCristal(tipo)
            try {
                const r = await adminAction(url, apiKey, "admin_revoke_cristal", {
                    p_target_clerk_id: t.clerk_user_id,
                    p_tipo: tipo,
                })
                if (r && (r as any).success) {
                    const newCodice = (r as any).codice_count ?? 0
                    const newMed = (r as any).meditacion_count ?? 0
                    setCristales({
                        codice_count: newCodice,
                        meditacion_count: newMed,
                    })
                    setCristalPulse(tipo)
                    setTimeout(() => setCristalPulse(null), 700)
                }
            } catch {}
            finally {
                setGrantingCristal(null)
            }
        },
        [grantingCristal, cristalRitual, url, apiKey, adminClerkId, t.clerk_user_id]
    )
    const [extras, setExtras] = useState<TripulanteExtras | null>(null)
    /* v1.16 — Qué aparato usa el nodo: "ios", "android", "web" o una
       combinación ("ios,web"). Vacío = nunca abrió la app, o es de antes
       de esta telemetría. */
    const [plataformas, setPlataformas] = useState<string>("")
    /* v1.17 — Reflejos del Espejo (enviados / restantes) + qué contestó en
       el onboarding. Van juntos en una RPC aparte, como el aparato. */
    const [espejoOnb, setEspejoOnb] = useState<any>(null)
    /* 🜂 v1.22 — EL CUARTO INTENTO (Zak): cuántas veces esta persona quiso
       enviar un reflejo con sus 3 de cortesía ya gastados. "Mandó 3" y "quiso
       mandar el 4" son dos personas distintas y solo se veía la primera. */
    const [muroEspejo, setMuroEspejo] = useState<any>(null)
    /* 🜂 v1.17 — LA CARA DEL NODO, SOLO SI SE PIDE (Zak). La ficha nace con
       la geometría de siempre; un botón la cambia por la foto de perfil
       (la de Google al identificarse, o la que el Tripulante cargó). Se
       queda apagado de fábrica a propósito: ver la cara de alguien debe
       ser una decisión consciente, no el estado por defecto del panel.
       La elección dura lo que dure la sesión del navegador. */
    const [fotoUrl, setFotoUrl] = useState<string>("")
    /* v1.18 — De dónde entra: ciudad/país/IP/navegador de la sesión más
       reciente, tal como Clerk los vio. */
    const [ubicacion, setUbicacion] = useState<any>(null)
    const [verFoto, setVerFoto] = useState(false)
    const [freshLastActive, setFreshLastActive] = useState<number | null>(null)
    /* v1.3 — Fecha de creación de la cuenta Clerk del Tripulante.
       Capturada del mismo fetch a get-clerk-user-activity. Aparece en
       el header bajo el span "Cuenta creada". */
    const [freshCreatedAt, setFreshCreatedAt] = useState<number | null>(null)
    const [codicesFull, setCodicesFull] = useState<CodiceFull[]>([])
    const [mailStatus, setMailStatus] = useState<{
        status: "sent" | "failed" | "skipped"
        sent_at: string
        error_message: string | null
        email: string | null
    } | null>(null)
    const [mailStatusLoaded, setMailStatusLoaded] = useState(false)
    const [subStatus, setSubStatus] =
        useState<EmailSubscriptionStatus | null>(null)
    const [subStatusLoaded, setSubStatusLoaded] = useState(false)
    /* v1.9 — Gate unificado: el cuerpo del detalle se muestra COMPLETO de
       una sola vez (cristales + navegantes + códices incluidos), nunca por
       partes escalonadas. setSectionsLoaded(true) al terminar TODAS las
       lecturas del fetch. */
    const [sectionsLoaded, setSectionsLoaded] = useState(false)

    /* 🜂 v1.23 — EL CONTENIDO SE DISUELVE, NO SE GUILLOTINA (Zak 2026-08-09).
       El cuerpo del panel cortaba las tarjetas a filo contra su borde superior,
       justo debajo de los controles flotantes: media tarjeta cortada ahí no se
       lee como scroll, se lee como un error de render. Se mide si hay algo
       fuera de vista de cada lado y solo entonces se atenúa ese borde: en
       reposo, sin nada arriba ni abajo, no se atenúa nada.
       (Se verificó primero que el envoltorio de refresco de la v1.22 NO movía
       la geometría: alturas y posiciones idénticas en las dos versiones.) */
    const scrollBodyRef = useRef<HTMLDivElement | null>(null)
    const [desborde, setDesborde] = useState({ arriba: false, abajo: false })

    useEffect(() => {
        const el = scrollBodyRef.current
        if (!el) return
        const medir = () => {
            const arriba = el.scrollTop > 6
            const abajo =
                el.scrollHeight - el.scrollTop - el.clientHeight > 6
            setDesborde((p) =>
                p.arriba === arriba && p.abajo === abajo
                    ? p
                    : { arriba, abajo }
            )
        }
        medir()
        el.addEventListener("scroll", medir, { passive: true })
        /* El alto del contenido cambia solo (llegan las lecturas, se abre una
           vista expandida): sin observarlo, el borde de abajo se quedaría
           atenuado o sin atenuar según cómo estaba al montar. */
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(medir)
                : null
        if (ro) {
            ro.observe(el)
            if (el.firstElementChild) ro.observe(el.firstElementChild)
        }
        window.addEventListener("resize", medir)
        return () => {
            el.removeEventListener("scroll", medir)
            window.removeEventListener("resize", medir)
            if (ro) ro.disconnect()
        }
    }, [t.clerk_user_id, sectionsLoaded, expandedSection])

    /* v1.14 — Estado del regalo (pendiente/aceptado) al abrir el detalle. */
    useEffect(() => {
        refreshGiftStatus()
    }, [refreshGiftStatus])

    /* Cuántas de las doce lecturas de la ficha ya volvieron (para la barra). */
    const [pasosFicha, setPasosFicha] = useState(0)

    /* Fetch del extras + aparato + email status + cristales + códices. */
    useEffect(() => {
        let cancelled = false
        /* 🜂 v1.21 — SOMBRA QUE CUENTA. Cada lectura de la ficha pasa por acá
           y avisa cuando regresa, haya traído datos o haya fallado: lo que la
           barra mide es cuánto FALTA por esperar, no cuánto trajo. Vive dentro
           del efecto, así que ninguna otra parte del Motor se entera. */
        setPasosFicha(0)
        let hechos = 0
        const adminAction = (...args: any[]): Promise<any> =>
            Promise.resolve((adminActionBase as any)(...args)).finally(() => {
                hechos += 1
                if (!cancelled) setPasosFicha((p) => Math.max(p, hechos))
            })
        /* Lo que se vaya leyendo se acumula acá y al final entra al cofre,
           para que la próxima apertura de ESTE nodo no pida nada. */
        const snap: FichaCofre = {
            extras: null,
            plataformas: "",
            espejoOnb: null,
            mailStatus: null,
            subStatus: null,
            cristales: null,
            navegante: null,
            ritualData: null,
            rachasData: null,
            sondaProg: null,
            codicesFull: [],
        }
        const go = async () => {
            try {
                // Gateway verificado admin-action (inyecta el id admin del
                // token). Fallback transitorio a la lectura directa hasta el REVOKE.
                let r = await adminAction(url, apiKey, "get_tripulante_extras", {
                    target_clerk_id: t.clerk_user_id,
                })
                if (r == null) {
                    r = await rpc(url, apiKey, "get_tripulante_extras", {
                        target_clerk_id: t.clerk_user_id,
                        admin_clerk_id: adminClerkId,
                    })
                }
                if (cancelled) return
                if (Array.isArray(r) && r.length > 0) {
                    snap.extras = r[0]
                    setExtras(r[0] as TripulanteExtras)
                } else if (r && typeof r === "object") {
                    snap.extras = r
                    setExtras(r as TripulanteExtras)
                } else {
                    setExtras(null)
                }
            } catch {
                if (!cancelled) setExtras(null)
            }
            /* v1.16 — QUÉ APARATO USA (iPhone / Android / navegador). RPC
               propia y no una columna más de extras: si esta falla, lo único
               que se pierde es la etiqueta del aparato, nunca la ficha. */
            try {
                const pf = await adminAction(
                    url,
                    apiKey,
                    "get_tripulante_platforms",
                    { target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                const fila = Array.isArray(pf) ? pf[0] : (pf as any)
                const valor =
                    typeof fila === "string"
                        ? fila
                        : String(fila?.platforms ?? "")
                snap.plataformas = valor
                setPlataformas(valor)
            } catch {
                if (!cancelled) setPlataformas("")
            }
            /* 🜂 v1.19 — LA FOTO VIVA. La de Clerk queda congelada en la que
               había al identificarse; la que el Tripulante ELIGIÓ dentro de
               la app vive en su perfil de Comunidad. Esta gana cuando existe;
               la de Clerk queda de respaldo. */
            try {
                const fa = await adminAction(
                    url,
                    apiKey,
                    "get_tripulante_foto",
                    { target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                const fila = Array.isArray(fa) ? fa[0] : (fa as any)
                const propia = String(fila?.foto_app || "")
                if (propia) setFotoUrl(propia)
            } catch {}
            /* v1.17 — Reflejos del Espejo + respuestas del onboarding. */
            try {
                const eo = await adminAction(
                    url,
                    apiKey,
                    "get_tripulante_espejo_onb",
                    { target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                const fila = Array.isArray(eo) ? eo[0] : (eo as any)
                if (fila && typeof fila === "object") {
                    snap.espejoOnb = fila
                    setEspejoOnb(fila)
                } else {
                    setEspejoOnb(null)
                }
            } catch {
                if (!cancelled) setEspejoOnb(null)
            }
            /* 🜂 v1.22 — EL CUARTO INTENTO. Va en su propia lectura y no como
               una columna más del bloque de arriba: si esta falla, lo único
               que se pierde es esa línea, nunca la tarjeta del Espejo. */
            try {
                const mu = await adminAction(
                    url,
                    apiKey,
                    "admin_get_espejo_muro",
                    { p_target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                const fm = Array.isArray(mu) ? mu[0] : (mu as any)
                setMuroEspejo(fm && (fm as any).success ? fm : null)
            } catch {
                if (!cancelled) setMuroEspejo(null)
            }
            try {
                const m =
                    (await adminAction(
                        url,
                        apiKey,
                        "get_email_dispatch_status",
                        {
                            p_target_clerk_id: t.clerk_user_id,
                            p_email_type: "ciclo_sellado",
                        }
                    )) ??
                    (await rpc(url, apiKey, "get_email_dispatch_status", {
                        p_target_clerk_id: t.clerk_user_id,
                        p_admin_clerk_id: adminClerkId,
                        p_email_type: "ciclo_sellado",
                    }))
                if (cancelled) return
                if (Array.isArray(m) && m.length > 0) {
                    snap.mailStatus = m[0]
                    setMailStatus(m[0] as any)
                } else if (m && typeof m === "object") {
                    snap.mailStatus = m
                    setMailStatus(m as any)
                } else {
                    setMailStatus(null)
                }
            } catch {
                if (!cancelled) setMailStatus(null)
            } finally {
                if (!cancelled) setMailStatusLoaded(true)
            }
            try {
                const s =
                    (await adminAction(
                        url,
                        apiKey,
                        "get_email_subscription_status",
                        { p_target_clerk_id: t.clerk_user_id }
                    )) ??
                    (await rpc(url, apiKey, "get_email_subscription_status", {
                        p_target_clerk_id: t.clerk_user_id,
                        p_admin_clerk_id: adminClerkId,
                    }))
                if (cancelled) return
                if (Array.isArray(s) && s.length > 0) {
                    snap.subStatus = s[0]
                    setSubStatus(s[0] as EmailSubscriptionStatus)
                } else if (s && typeof s === "object") {
                    snap.subStatus = s
                    setSubStatus(s as EmailSubscriptionStatus)
                } else {
                    setSubStatus(null)
                }
            } catch {
                if (!cancelled) setSubStatus(null)
            } finally {
                if (!cancelled) setSubStatusLoaded(true)
            }
            try {
                const c = await adminAction(url, apiKey, "admin_get_user_cristales", {
                    p_target_clerk_id: t.clerk_user_id,
                })
                if (cancelled) return
                if (
                    c &&
                    typeof c === "object" &&
                    typeof (c as any).codice_count === "number"
                ) {
                    snap.cristales = {
                        codice_count: (c as any).codice_count || 0,
                        meditacion_count: (c as any).meditacion_count || 0,
                    }
                    setCristales(snap.cristales)
                } else {
                    setCristales(null)
                }
            } catch {
                if (!cancelled) setCristales(null)
            }
            try {
                const n = await adminAction(
                    url,
                    apiKey,
                    "admin_get_user_navegante_progress",
                    {
                        p_target_clerk_id: t.clerk_user_id,
                    }
                )
                if (cancelled) return
                const row = Array.isArray(n) ? n[0] : (n as any)
                if (row && typeof row === "object") {
                    snap.navegante = {
                        tutorial_completed: !!row.tutorial_completed,
                        membranas_completed:
                            Number(row.membranas_completed) || 0,
                        last_completed_id:
                            row.last_completed_id != null
                                ? Number(row.last_completed_id)
                                : null,
                        last_updated: row.last_updated || null,
                        has_chord: !!row.has_chord,
                    }
                    setNavegante(snap.navegante)
                } else {
                    setNavegante(null)
                }
            } catch {
                if (!cancelled) setNavegante(null)
            }
            try {
                const rd = await adminAction(
                    url,
                    apiKey,
                    "admin_get_user_ritual_data",
                    { p_target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                if (rd && typeof rd === "object" && !(rd as any).error) {
                    snap.ritualData = rd
                    setRitualData(rd as RitualData)
                } else {
                    setRitualData(null)
                }
            } catch {
                if (!cancelled) setRitualData(null)
            }
            try {
                const rc = await adminAction(
                    url,
                    apiKey,
                    "admin_get_user_rachas",
                    { p_target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                if (rc && typeof rc === "object" && !(rc as any).error) {
                    snap.rachasData = rc
                    setRachasData(rc)
                } else {
                    setRachasData(null)
                }
            } catch {
                if (!cancelled) setRachasData(null)
            }
            /* v1.16 — hasta dónde llegó en cada pilar del Radar. */
            try {
                const sp = await adminAction(
                    url,
                    apiKey,
                    "admin_get_user_sonda_progress",
                    { p_target_clerk_id: t.clerk_user_id }
                )
                if (cancelled) return
                if (
                    sp &&
                    typeof sp === "object" &&
                    (sp as any).success &&
                    Array.isArray((sp as any).pilares)
) {
                    snap.sondaProg = sp
                    setSondaProg(sp as SondaProgData)
                } else {
                    setSondaProg(null)
                }
            } catch {
                if (!cancelled) setSondaProg(null)
            }
            try {
                const rows = await adminAction(
                    url,
                    apiKey,
                    "admin_get_user_codices_full",
                    {
                        p_target_clerk_id: t.clerk_user_id,
                        p_target_email:
                            (t as any).email ||
                            (t as any).user_email ||
                            null,
                    }
                )
                if (cancelled) return
                if (Array.isArray(rows)) {
                    snap.codicesFull = (
                        rows.map((r: any) => ({
                            book_id: String(r.book_id || ""),
                            title: String(r.title || "Sin título"),
                            acquired_via: String(r.acquired_via || "pago"),
                            formats: Array.isArray(r.formats) ? r.formats : null,
                            device: r.device || null,
                            purchased_at: r.purchased_at || null,
                            amount_cents:
                                typeof r.amount_cents === "number"
                                    ? r.amount_cents
                                    : null,
                            reading_percentage: Math.max(
                                0,
                                Math.min(
                                    100,
                                    Number(r.reading_percentage) || 0
                                )
                            ),
                            reading_updated_at: r.reading_updated_at || null,
                        }))
                    )
                    setCodicesFull(snap.codicesFull)
                } else {
                    setCodicesFull([])
                }
            } catch {
                if (!cancelled) setCodicesFull([])
            }
            /* v1.9 — Todas las lecturas terminaron: revelá el detalle COMPLETO
               de una sola vez (cristales + navegantes + códices ya en mano). */
            if (!cancelled) {
                /* v1.16 — y al cofre, para que reabrir este nodo sea
                   instantáneo. */
                if (t.clerk_user_id) FICHA_COFRE.set(t.clerk_user_id, snap)
                setSectionsLoaded(true)
            }
        }

        /* 🜂 v1.16 — ¿YA LEÍMOS ESTE NODO? Entonces se pinta de memoria y no
           se pide nada. Pedir recargar el padrón (`refreshing`) es el gesto
           que significa "quiero datos frescos": ahí el cofre de este nodo se
           tira y se vuelve a leer. */
        const guardado = t.clerk_user_id
            ? FICHA_COFRE.get(t.clerk_user_id)
            : undefined
        if (refreshing && t.clerk_user_id) FICHA_COFRE.delete(t.clerk_user_id)
        if (guardado && !refreshing) {
            setExtras(guardado.extras)
            setPlataformas(guardado.plataformas)
            setEspejoOnb(guardado.espejoOnb)
            setMailStatus(guardado.mailStatus)
            setMailStatusLoaded(true)
            setSubStatus(guardado.subStatus)
            setSubStatusLoaded(true)
            setCristales(guardado.cristales)
            setNavegante(guardado.navegante)
            setRitualData(guardado.ritualData)
            setRachasData(guardado.rachasData)
            setSondaProg(guardado.sondaProg)
            setCodicesFull(guardado.codicesFull)
            setExpandedSection(null)
            setSectionsLoaded(true)
            return () => {
                cancelled = true
            }
        }

        setExtras(null)
        setPlataformas("")
        setEspejoOnb(null)
        setFotoUrl("")
        setUbicacion(null)
        setMailStatus(null)
        setMailStatusLoaded(false)
        setSubStatus(null)
        setSubStatusLoaded(false)
        setSectionsLoaded(false)
        setCristales(null)
        setNavegante(null)
        setCodicesFull([])
        /* v1.15 — también se limpian al cambiar de nodo (si su fetch fallaba,
           quedaban los datos del nodo ANTERIOR pegados en las tarjetas). */
        setRitualData(null)
        setRachasData(null)
        setExpandedSection(null)
        go()
        return () => {
            cancelled = true
        }
    }, [t.clerk_user_id, url, apiKey, adminClerkId, refreshing])

    /* 🜂 v1.22 — UNA CONSULTA POR TARJETA. Cada refrescador de acá pide EXACTA-
       MENTE la lectura de su tarjeta, pinta lo que vuelve y deja el cofre al
       día. Ninguno toca a los demás.

       `cid` es el nodo abierto; se captura una vez para que todos lo compartan
       y para que el chequeo de existencia viva en un solo lugar. */
    const cid = t.clerk_user_id
    const RF = {
        /* Las cuatro que comparten `get_tripulante_extras` se mueven juntas:
           es una sola lectura para todas. */
        extras: () =>
            refrescaTarjeta(
                "extras",
                "get_tripulante_extras",
                { target_clerk_id: cid },
                (r, snap) => {
                    const fila = Array.isArray(r) ? r[0] : r
                    if (fila && typeof fila === "object") {
                        setExtras(fila as TripulanteExtras)
                        if (snap) snap.extras = fila
                    }
                }
            ),
        plataformas: () =>
            refrescaTarjeta(
                "plataformas",
                "get_tripulante_platforms",
                { target_clerk_id: cid },
                (r, snap) => {
                    const fila = Array.isArray(r) ? r[0] : (r as any)
                    const valor =
                        typeof fila === "string"
                            ? fila
                            : String(fila?.platforms ?? "")
                    setPlataformas(valor)
                    if (snap) snap.plataformas = valor
                }
            ),
        espejoOnb: () =>
            refrescaTarjeta(
                "espejoOnb",
                "get_tripulante_espejo_onb",
                { target_clerk_id: cid },
                (r, snap) => {
                    const fila = Array.isArray(r) ? r[0] : (r as any)
                    if (fila && typeof fila === "object") {
                        setEspejoOnb(fila)
                        if (snap) snap.espejoOnb = fila
                    }
                }
            ),
        cristales: () =>
            refrescaTarjeta(
                "cristales",
                "admin_get_user_cristales",
                { p_target_clerk_id: cid },
                (r, snap) => {
                    if (
                        r &&
                        typeof r === "object" &&
                        typeof (r as any).codice_count === "number"
                    ) {
                        const v = {
                            codice_count: (r as any).codice_count || 0,
                            meditacion_count: (r as any).meditacion_count || 0,
                        }
                        setCristales(v)
                        if (snap) snap.cristales = v
                    }
                }
            ),
        navegante: () =>
            refrescaTarjeta(
                "navegante",
                "admin_get_user_navegante_progress",
                { p_target_clerk_id: cid },
                (r, snap) => {
                    const row = Array.isArray(r) ? r[0] : (r as any)
                    if (row && typeof row === "object") {
                        const v = {
                            tutorial_completed: !!row.tutorial_completed,
                            membranas_completed:
                                Number(row.membranas_completed) || 0,
                            last_completed_id:
                                row.last_completed_id != null
                                    ? Number(row.last_completed_id)
                                    : null,
                            last_updated: row.last_updated || null,
                            has_chord: !!row.has_chord,
                        }
                        setNavegante(v)
                        if (snap) snap.navegante = v
                    }
                }
            ),
        ritual: () =>
            refrescaTarjeta(
                "ritual",
                "admin_get_user_ritual_data",
                { p_target_clerk_id: cid },
                (r, snap) => {
                    if (r && typeof r === "object" && !(r as any).error) {
                        setRitualData(r as RitualData)
                        if (snap) snap.ritualData = r
                    }
                }
            ),
        rachas: () =>
            refrescaTarjeta(
                "rachas",
                "admin_get_user_rachas",
                { p_target_clerk_id: cid },
                (r, snap) => {
                    if (r && typeof r === "object" && !(r as any).error) {
                        setRachasData(r)
                        if (snap) snap.rachasData = r
                    }
                }
            ),
        sondas: () =>
            refrescaTarjeta(
                "sondas",
                "admin_get_user_sonda_progress",
                { p_target_clerk_id: cid },
                (r, snap) => {
                    if (
                        r &&
                        typeof r === "object" &&
                        (r as any).success &&
                        Array.isArray((r as any).pilares)
                    ) {
                        setSondaProg(r as SondaProgData)
                        if (snap) snap.sondaProg = r
                    }
                }
            ),
        codices: () =>
            refrescaTarjeta(
                "codices",
                "admin_get_user_codices_full",
                {
                    p_target_clerk_id: cid,
                    p_target_email:
                        (t as any).email || (t as any).user_email || null,
                },
                (r, snap) => {
                    if (!Array.isArray(r)) return
                    const v = r.map((x: any) => ({
                        book_id: String(x.book_id || ""),
                        title: String(x.title || "Sin título"),
                        acquired_via: String(x.acquired_via || "pago"),
                        formats: Array.isArray(x.formats) ? x.formats : null,
                        device: x.device || null,
                        purchased_at: x.purchased_at || null,
                        amount_cents:
                            typeof x.amount_cents === "number"
                                ? x.amount_cents
                                : null,
                        reading_percentage: Math.max(
                            0,
                            Math.min(100, Number(x.reading_percentage) || 0)
                        ),
                        reading_updated_at: x.reading_updated_at || null,
                    }))
                    setCodicesFull(v)
                    if (snap) snap.codicesFull = v
                }
            ),
        correoCiclo: () =>
            refrescaTarjeta(
                "correoCiclo",
                "get_email_dispatch_status",
                {
                    p_target_clerk_id: cid,
                    p_email_type: "ciclo_sellado",
                },
                (r, snap) => {
                    const fila = Array.isArray(r) ? r[0] : (r as any)
                    if (fila && typeof fila === "object") {
                        setMailStatus(fila as any)
                        if (snap) snap.mailStatus = fila
                    }
                }
            ),
        correoSub: () =>
            refrescaTarjeta(
                "correoSub",
                "get_email_subscription_status",
                { p_target_clerk_id: cid },
                (r, snap) => {
                    const fila = Array.isArray(r) ? r[0] : (r as any)
                    if (fila && typeof fila === "object") {
                        setSubStatus(fila as EmailSubscriptionStatus)
                        if (snap) snap.subStatus = fila
                    }
                }
            ),
        /* El regalo ya tenía su propio refrescador desde la v1.20; acá solo se
           le pone el mismo gesto que a las demás. */
        regalo: async () => {
            if (refrescandoCard) return
            setRefrescandoCard("regalo")
            try {
                await refreshGiftStatus()
            } finally {
                setRefrescandoCard("")
            }
        },
    }

    /* Refresca la activity del Tripulante específico al abrir el panel. */
    useEffect(() => {
        let cancelled = false
        if (!t.clerk_user_id || !url || !apiKey || !adminClerkId) return
        ;(async () => {
            try {
                const r = await fetch(
                    `${url}/functions/v1/get-clerk-user-activity`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: apiKey,
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            admin_clerk_id: adminClerkId,
                            target_user_id: t.clerk_user_id,
                            token: await (
                                window as any
                            ).Clerk?.session?.getToken?.(),
                        }),
                    }
                )
                if (!r.ok || cancelled) return
                const data = await r.json()
                const u = Array.isArray(data?.users) ? data.users[0] : null
                if (!u) return
                const active =
                    typeof u.last_active_at === "number"
                        ? u.last_active_at
                        : 0
                const signin =
                    typeof u.last_sign_in_at === "number"
                        ? u.last_sign_in_at
                        : 0
                const ts = active > 0 ? active : signin
                if (!cancelled && ts > 0) setFreshLastActive(ts)
                /* v1.17 — Foto de perfil. `has_image` distingue una foto
                   REAL de la imagen genérica que Clerk sirve cuando no hay
                   ninguna: sin esa guarda pintaríamos un placeholder como
                   si fuera su cara. */
                if (
                    !cancelled &&
                    u.has_image === true &&
                    typeof u.image_url === "string" &&
                    u.image_url
                ) {
                    setFotoUrl(u.image_url)
                } else if (!cancelled) {
                    setFotoUrl("")
                }
                if (!cancelled)
                    setUbicacion(
                        u.ubicacion && typeof u.ubicacion === "object"
                            ? u.ubicacion
                            : null
                    )
                /* v1.3 — Capturar created_at para mostrarlo en el
                   header. La edge function v1.2 ya lo retorna en
                   epoch ms. */
                if (
                    !cancelled &&
                    typeof u.created_at === "number" &&
                    u.created_at > 0
                ) {
                    setFreshCreatedAt(u.created_at)
                }
            } catch {}
        })()
        return () => {
            cancelled = true
        }
    }, [t.clerk_user_id, url, apiKey, adminClerkId, refreshing])

    const isSubscriber = extras ? !!extras.is_subscriber : isGoldInitial
    /* v1.15 — Un regalo ACEPTADO cuenta como suscriptor activo (la fila
       gift_sintonia_% es status=active) → is_subscriber=true. Sin este
       discriminador, el bloque de acción admin (que vive bajo !isSubscriber)
       se escondía por completo tras aceptar el regalo y NUNCA aparecía el botón
       Revocar. giftAcceptedEff junta las 3 señales de "regalo activo". */
    const giftAcceptedEff = giftStatusLoaded
        ? giftAccepted
        : isGiftInitial || !!extras?.subscription_is_gift
    const tierLower = (extras?.tier || "").toLowerCase()
    const isSintonia = extras
        ? tierLower === "sintonia"
        : isSintoniaInitial
    const isInmersionTier = extras
        ? tierLower === "inmersion" ||
          tierLower === "pulsar" ||
          tierLower === "cuasar"
        : isGoldInitial && !isSintoniaInitial
    /* Tiers del Decodificador (IAP de Apple): Materia 199 → group 'decoder';
       Materia + Sueños 399 → group 'dream'. */
    const isDecoderTier = extras ? tierLower === "decoder" : false
    const isDualTier = extras ? tierLower === "dream" : false
    /* Acceso a Sueños: lo abren Sintonía, Inmersión o el Dual 399 — NO el
       199 (solo Materia). Materia la abre cualquier suscripción. */
    const hasDreamAccess = isSubscriber && !isDecoderTier
    const tierLabel = isSintonia
        ? "Sintonía Solar"
        : isInmersionTier
          ? "Inmersión Solar"
          : isDecoderTier
            ? "Decodificador de Materia"
            : isDualTier
              ? "Materia + Sueños"
              : "Membresía"
    const dataReady =
        extras !== null &&
        mailStatusLoaded &&
        subStatusLoaded &&
        sectionsLoaded
    const codicesComprados = extras?.purchases || []
    const decoderUsed = extras?.decoder_scans_used ?? 0
    const dreamUsed = extras?.dream_scans_used ?? 0
    const decoderLimit = 3
    const dreamLimit = 3
    const lastCycleTs = extras?.last_complete_cycle_ts || null
    const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
    const cooldownRemaining = (() => {
        if (!lastCycleTs) return { state: "none" as const }
        const cycleEndMs = new Date(lastCycleTs).getTime() + COOLDOWN_MS
        const remainMs = cycleEndMs - Date.now()
        if (remainMs <= 0) return { state: "ready" as const }
        const days = Math.floor(remainMs / (24 * 60 * 60 * 1000))
        const hours = Math.floor(
            (remainMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
        )
        return { state: "waiting" as const, days, hours }
    })()
    const cooldownLabel = (() => {
        if (cooldownRemaining.state === "none") return "—"
        if (cooldownRemaining.state === "ready") return "Disponible"
        const { days, hours } = cooldownRemaining
        if (days === 0) return `${hours}h`
        if (hours === 0) return `${days}d`
        return `${days}d ${hours}h`
    })()
    const fmtCycleTs = (iso: string | null): string => {
        if (!iso) return "—"
        try {
            const d = new Date(iso)
            const TZ = "America/Cancun"
            const day = d.toLocaleDateString("es-MX", {
                day: "numeric",
                timeZone: TZ,
            })
            const month = d.toLocaleDateString("es-MX", {
                month: "long",
                timeZone: TZ,
            })
            const monthCap =
                month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()
            const time = d.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: TZ,
            })
            return `${day} ${monthCap} ${time}Hrs`
        } catch {
            return "—"
        }
    }
    /* Teclado: ESC cierra (primero la vista expandida si está abierta;
       después el modal). ←/→ navegan entre tripulantes. */
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === "INPUT" || tag === "TEXTAREA") return
            if (e.key === "Escape") {
                e.preventDefault()
                if (expandedSection) {
                    setExpandedSection(null)
                } else {
                    onClose()
                }
                return
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                if (!expandedSection) onPrev()
                return
            }
            if (e.key === "ArrowRight") {
                e.preventDefault()
                if (!expandedSection) onNext()
                return
            }
        }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [onClose, onPrev, onNext, expandedSection])

    const parseCycle = (c: any): string[] => {
        try {
            if (!c) return []
            if (Array.isArray(c)) return c
            const parsed = JSON.parse(c as string)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    /* v1.3 — Lectura corregida de los últimos scores por pilar.
       Antes leíamos directo `t.history[0].fisico|...` y los rows de
       scan_vibracional pueden traer valores no-null en pilares que el
       Tripulante NUNCA escaneó (carry-over al insert). Resultado:
       pilares que nunca pasaron por una sonda aparecían como
       "Disponible · 50%" en el panel del Motor.
       Fuente de verdad real: el campo `cycle_scanned_json` del row
       lista qué pilares se finalizaron en ese momento. Caminamos
       history del más reciente al más viejo y solo aceptamos un
       score si el row lo declara como parte de su ciclo. */
    const lastScores: Record<string, number | null> = {
        fisico: null,
        mental: null,
        emocional: null,
        financiero: null,
        vector: null,
        orbita: null,
    }
    const PILAR_KEYS = [
        "fisico",
        "mental",
        "emocional",
        "financiero",
        "vector",
        "orbita",
    ] as const
    for (const row of t.history || []) {
        const cycleArr = parseCycle((row as any)?.cycle).map((x: any) =>
            String(x).toLowerCase()
        )
        if (cycleArr.length === 0) continue
        for (const pid of PILAR_KEYS) {
            if (lastScores[pid] !== null) continue
            if (!cycleArr.includes(pid)) continue
            const v = (row as any)[pid]
            if (typeof v === "number" && !isNaN(v)) {
                lastScores[pid] = v
            }
        }
        if (PILAR_KEYS.every((p) => lastScores[p] !== null)) break
    }
    const tlRaw = (t.history || [])
        .filter((e) => parseCycle(e.cycle).length === 6)
        .slice(0, 18)
        .reverse()
    const inFlightSet = new Set(t.in_flight_pilars || [])

    const showNav = position.total > 1

    /* v1.0 — Lista normalizada de Códices: prioriza codicesFull (incluye
       canjes con cristal + reading_percentage), cae al campo legacy
       `purchases` si la RPC no devolvió nada. */
    const codicesList: CodiceFull[] =
        codicesFull.length > 0
            ? codicesFull
            : codicesComprados.map((p) => ({
                  book_id: p.book_id,
                  title: p.title,
                  acquired_via: "pago",
                  device: p.device,
                  purchased_at: p.purchased_at,
                  reading_percentage: 0,
                  formats: p.formats,
                  amount_cents: p.amount_cents,
                  reading_updated_at: null,
              }))

    /* Render de una sola row de Códice. Reutilizado por la vista
       compacta (3 rows) y por la vista expandida (todas las rows). */
    const renderCodiceRow = (p: CodiceFull, i: number) => {
        const deviceLabel =
            p.device === "mobile"
                ? "Lente"
                : p.device === "desktop"
                  ? "Centro de Mando"
                  : "Origen sin registro"
        const deviceColor =
            p.device === "mobile"
                ? "#00C2FF"
                : p.device === "desktop"
                  ? "#E8C65A"
                  : "rgba(255,255,255,0.35)"
        const dateLabel = (() => {
            if (!p.purchased_at) return ""
            try {
                const d = new Date(p.purchased_at)
                return d.toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                    timeZone: "America/Cancun",
                })
            } catch {
                return ""
            }
        })()
        const isCristal = p.acquired_via === "cristal"
        const sourceColor = isCristal ? "#F5D98C" : "#00E5FF"
        const sourceLabel = isCristal ? "✦ Cristal" : "Compra"
        const pct = p.reading_percentage
        const isStarted = pct > 0
        return (
            <div
                key={`${p.book_id}-${i}`}
                style={{
                    padding: "10px 14px 8px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12.5,
                                fontWeight: 500,
                                color: "#fff",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {p.title}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                marginTop: 3,
                                flexWrap: "wrap",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    color: sourceColor,
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    border: `1px solid ${sourceColor}55`,
                                    background: `${sourceColor}12`,
                                }}
                            >
                                {sourceLabel}
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    color: deviceColor,
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: deviceColor,
                                        boxShadow: `0 0 6px ${deviceColor}`,
                                        marginRight: 6,
                                        verticalAlign: "middle",
                                    }}
                                />
                                {deviceLabel}
                                {dateLabel ? ` · ${dateLabel}` : ""}
                            </span>
                        </div>
                    </div>
                    {pct > 0 && (
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                color: "#F5D98C",
                                flexShrink: 0,
                            }}
                        >
                            {pct}%
                        </span>
                    )}
                </div>
                <div
                    style={{
                        marginTop: 8,
                        height: 4,
                        width: "100%",
                        background: "rgba(0,194,255,0.08)",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                    aria-label={`Avance de lectura ${pct}%`}
                >
                    <div
                        style={{
                            width: `${Math.max(2, pct)}%`,
                            height: "100%",
                            background: isStarted
                                ? "linear-gradient(90deg, rgba(245,217,140,0.7), #F5D98C)"
                                : "rgba(0,194,255,0.25)",
                            borderRadius: 2,
                            boxShadow: isStarted
                                ? "0 0 6px rgba(245,217,140,0.4)"
                                : "none",
                            transition: "width .35s ease",
                        }}
                    />
                </div>
            </div>
        )
    }

    /* Guard final: si el placeholder de Framer está activo (clerk_user_id
       vacío), no renderizar el modal — devolvemos un nodo invisible. */
    if (!t.clerk_user_id) {
        return <div style={{ display: "none" }} aria-hidden="true" />
    }

    return (
        <div
            className="mi-trip-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className={`mi-trip-modal${
                    isSubscriber
                        ? isSintonia
                            ? " cyan"
                            : " golden"
                        : ""
                }`}
                role="dialog"
                aria-modal="true"
                key={t.clerk_user_id}
            >
                {showNav && !expandedSection && (
                    <>
                        <button
                            className="mi-trip-nav prev"
                            onClick={onPrev}
                            aria-label="Tripulante anterior"
                        >
                            ‹
                        </button>
                        <button
                            className="mi-trip-nav next"
                            onClick={onNext}
                            aria-label="Tripulante siguiente"
                        >
                            ›
                        </button>
                        <span className="mi-trip-pos">
                            {position.idx + 1} / {position.total}
                        </span>
                    </>
                )}
                <button
                    className={`mi-trip-refresh${refreshing ? " spinning" : ""}`}
                    onClick={onRefresh}
                    disabled={refreshing}
                    aria-label="Refrescar telemetría"
                    title="Refrescar telemetría"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                </button>
                <button
                    className="mi-trip-close"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ×
                </button>
                <button
                    className="mi-trip-delete"
                    onClick={() => setConfirmEliminar(true)}
                    aria-label="Eliminar datos del Escáner"
                    title="Eliminar datos del Escáner"
                    disabled={eliminando}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>

                {confirmEliminar && (
                    <div className="mi-trip-confirm-overlay">
                        <div className="mi-trip-confirm-card">
                            <div className="mi-trip-confirm-icon">
                                <svg
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div className="mi-trip-confirm-title">
                                ¿Eliminar los datos del Escáner?
                            </div>
                            <div className="mi-trip-confirm-body">
                                Vas a borrar por completo los escaneos, el
                                progreso in-flight y los protocolos activos de{" "}
                                <strong>{t.full_name || "este tripulante"}</strong>.
                                La próxima vez que entre al Escáner Vibracional,
                                arrancará desde cero. La acción no se puede
                                deshacer.
                            </div>
                            <div className="mi-trip-confirm-row">
                                <button
                                    type="button"
                                    className="mi-trip-confirm-cancel"
                                    onClick={() => setConfirmEliminar(false)}
                                    disabled={eliminando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="mi-trip-confirm-ok"
                                    onClick={() => {
                                        onEliminar()
                                        setConfirmEliminar(false)
                                    }}
                                    disabled={eliminando}
                                >
                                    {eliminando
                                        ? "Eliminando..."
                                        : "Sí, eliminar datos"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cuerpo scrolleable — el modal queda capeado a la pantalla
                    (max-height) y SOLO esto scrollea; el chrome (nav/refresh) y
                    los overlays (confirmar/expandir) quedan fuera, anclados. */}
                <div className="mi-trip-bodywrap">
                <div ref={scrollBodyRef} className="mi-trip-scrollbody">
                {!dataReady && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 18,
                            minHeight: 360,
                            padding: "60px 20px",
                        }}
                    >
                        <div
                            className="mi-trip-empty-orb"
                            style={{
                                background: isSintonia
                                    ? "radial-gradient(circle,rgba(0,194,255,0.25),transparent 60%)"
                                    : isInmersionTier
                                      ? "radial-gradient(circle,rgba(232,198,90,0.25),transparent 60%)"
                                      : undefined,
                            }}
                        />
                        <p
                            style={{
                                margin: 0,
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: isSintonia
                                    ? "rgba(140,220,255,0.7)"
                                    : isInmersionTier
                                      ? "rgba(232,198,90,0.7)"
                                      : "rgba(255,255,255,0.5)",
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            Hidratando telemetría del Tripulante…
                        </p>
                        {/* 🜂 v1.21 — LA BARRA (Zak): la ficha son doce
                            lecturas en fila y hasta ahora la espera era muda.
                            Se llena conforme cada una regresa, así se sabe si
                            falta poco o si algo se atoró. Se capa al 92% a
                            propósito: el 100% lo dice la ficha al aparecer, no
                            un contador que podría adelantarse. */}
                        {(() => {
                            const p = Math.min(
                                0.92,
                                pasosFicha / PASOS_FICHA
                            )
                            const tinte = isSintonia
                                ? "rgba(0,194,255,0.85)"
                                : isInmersionTier
                                  ? "rgba(232,198,90,0.85)"
                                  : "rgba(255,255,255,0.55)"
                            return (
                                <div
                                    style={{
                                        width: "min(260px, 70%)",
                                        marginTop: -6,
                                    }}
                                >
                                    <div
                                        style={{
                                            height: 3,
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            background:
                                                "rgba(255,255,255,0.09)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${p * 100}%`,
                                                height: "100%",
                                                borderRadius: 2,
                                                background: tinte,
                                                transition:
                                                    "width 420ms cubic-bezier(0.22,1,0.36,1)",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 7,
                                            textAlign: "center",
                                            fontSize: 10,
                                            letterSpacing: "0.16em",
                                            color: "rgba(255,255,255,0.34)",
                                            fontFamily: "'Inter',sans-serif",
                                        }}
                                    >
                                        {Math.min(pasosFicha, PASOS_FICHA)} /{" "}
                                        {PASOS_FICHA}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                )}

                {dataReady && (
                <div className="mi-trip-cols">
                <div className="mi-trip-col mi-trip-col-left">
                <div className="mi-trip-scan">
                    <div
                        className="mi-trip-scan-hex"
                        style={{ position: "relative" }}
                    >
                        <div className="mi-trip-scan-ring" />
                        {/* 🜂 v1.19 — GIRA, como la ficha pública de la app:
                            la geometría se voltea y del otro lado está la
                            cara. Las dos caras viven montadas y el volteo es
                            del contenedor, así no hay salto ni recarga de la
                            imagen al ir y volver. */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                transformStyle: "preserve-3d",
                                transition:
                                    "transform 0.62s cubic-bezier(.22,1,.36,1)",
                                transform: verFoto
                                    ? "rotateY(180deg)"
                                    : "none",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden",
                                }}
                            >
                                <TripulanteHex />
                            </div>
                            {fotoUrl ? (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)",
                                        display: "grid",
                                        placeItems: "center",
                                    }}
                                >
                                    <img
                                        src={fotoUrl}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        onError={() => setFotoUrl("")}
                                        style={{
                                            width: "72%",
                                            height: "72%",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            border: `1px solid ${hx(AC, 0.45)}`,
                                            boxShadow: `0 0 22px ${hx(AC, 0.28)}`,
                                        }}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <span className="mi-trip-scan-sub">
                        ✦ Firma Vibracional
                    </span>
                    {/* 🜂 v1.17 — La cara solo aparece si se pide. El panel
                        nace con la geometría; este botón la cambia por la
                        foto de perfil y vuelve. Si el nodo no tiene foto
                        real, el botón ni se dibuja. */}
                    {fotoUrl ? (
                        <button
                            type="button"
                            onClick={() => setVerFoto((v) => !v)}
                            style={{
                                marginTop: 6,
                                padding: "4px 12px",
                                borderRadius: 999,
                                border: `1px solid ${hx(AC, 0.3)}`,
                                background: "transparent",
                                color: hx(AC, 0.7),
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 9.5,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            {verFoto ? "Ver geometría" : "Ver rostro"}
                        </button>
                    ) : null}
                    {isSubscriber && (
                        <span
                            className={`mi-trip-sintonia-pill${
                                isSintonia ||
                                isGiftInitial ||
                                isDecoderTier ||
                                isDualTier
                                    ? " cyan-tier"
                                    : ""
                            }`}
                        >
                            {isGiftInitial
                                ? "Cortesía Solar"
                                : isDecoderTier
                                  ? "Decodificador · Materia"
                                  : isDualTier
                                    ? "Decodificador · Materia + Sueños"
                                    : isSintonia
                                      ? "Sintonía Solar Activa"
                                      : "Inmersión Solar Activa"}
                        </span>
                    )}
                    {!isSubscriber && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "6px 14px",
                                borderRadius: 999,
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                                border: "1px solid rgba(255,255,255,0.12)",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.45)",
                                marginBottom: 6,
                            }}
                        >
                            Explorador
                        </span>
                    )}
                    <h3 className="mi-trip-scan-name">
                        {t.full_name || "Tripulante"}
                    </h3>
                    <p
                        style={{
                            margin: "6px 0 0",
                            fontSize: 11,
                            fontWeight: 400,
                            letterSpacing: "0.04em",
                            color: isSubscriber
                                ? isSintonia
                                    ? "rgba(140,220,255,0.85)"
                                    : "rgba(232,198,90,0.78)"
                                : "rgba(255,255,255,0.55)",
                            textAlign: "center",
                            fontFamily: "'JetBrains Mono', monospace",
                            wordBreak: "break-all",
                            maxWidth: 360,
                        }}
                    >
                        {extras?.email || "—"}
                    </p>
                    <div className="mi-trip-scan-meta">
                        <span>
                            Ciclos
                            <span className="mi-trip-scan-meta-val">
                                {t.complete_cycles}
                            </span>
                        </span>
                        <span>
                            Scans
                            <span className="mi-trip-scan-meta-val">
                                {t.scan_count}
                            </span>
                        </span>
                        <span>
                            Último ciclo
                            <span className="mi-trip-scan-meta-val">
                                {fmtCycleTs(lastCycleTs)}
                            </span>
                        </span>
                        <span>
                            Próximo ciclo
                            <span
                                className="mi-trip-scan-meta-val"
                                style={
                                    cooldownRemaining.state === "ready"
                                        ? {
                                              color: isSubscriber
                                                  ? "#E8C65A"
                                                  : "#00C2FF",
                                          }
                                        : undefined
                                }
                            >
                                {cooldownLabel}
                            </span>
                        </span>
                        <span>
                            Último ingreso
                            <span className="mi-trip-scan-meta-val">
                                {(() => {
                                    const ts = freshLastActive ?? lastSignInAt
                                    if (!ts) return "Sin registro"
                                    try {
                                        const d = new Date(ts)
                                        return d.toLocaleString("es-MX", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                            timeZone: "America/Cancun",
                                        })
                                    } catch {
                                        return "—"
                                    }
                                })()}
                            </span>
                        </span>
                        {/* v1.3 — Fecha de creación de la cuenta del
                            Tripulante. Aparece como un span más en la
                            cuadrícula meta (sin agregar fila nueva).
                            Horario Cancún. */}
                        <span>
                            Cuenta creada
                            <span className="mi-trip-scan-meta-val">
                                {(() => {
                                    if (!freshCreatedAt) return "—"
                                    try {
                                        const d = new Date(freshCreatedAt)
                                        return d.toLocaleString("es-MX", {
                                            day: "numeric",
                                            month: "short",
                                            year: "2-digit",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                            timeZone: "America/Cancun",
                                        })
                                    } catch {
                                        return "—"
                                    }
                                })()}
                            </span>
                        </span>
                    </div>
                </div>

                {/* 🜂 v1.22 — Esta tarjeta y las de Sueños y Versión de la app
                    comen de la MISMA lectura (`get_tripulante_extras`), así que
                    refrescar cualquiera pone al día a las tres. Sigue siendo
                    UNA consulta contra las doce del refresco completo. */}
                <TarjetaRefrescable
                    onRefrescar={RF.extras}
                    cargando={refrescandoCard === "extras"}
                    titulo="Volver a leer los decodificadores y la membresía"
                >
                <div
                    className={`mi-trip-deco${
                        isSubscriber
                            ? isSintonia
                                ? " cyan-tier"
                                : " golden"
                            : ""
                    }`}
                >
                    <div className="mi-trip-deco-label">
                        <span className="mi-trip-deco-label-top">
                            ✦ Decodificador de Materia
                        </span>
                        <span className="mi-trip-deco-label-sub">
                            {isSubscriber
                                ? `Acceso ilimitado · ${tierLabel}`
                                : "Disparos del plan freemium"}
                        </span>
                    </div>
                    <div>
                        <div className="mi-trip-deco-val">
                            {isSubscriber
                                ? "∞"
                                : `${Math.max(0, decoderLimit - decoderUsed)} / ${decoderLimit}`}
                        </div>
                        <div className="mi-trip-deco-val-mini">
                            {isSubscriber ? `Usados ${decoderUsed}` : `Restantes`}
                        </div>
                    </div>
                </div>
                </TarjetaRefrescable>

                <TarjetaRefrescable
                    onRefrescar={RF.extras}
                    cargando={refrescandoCard === "extras"}
                    titulo="Volver a leer los decodificadores y la membresía"
                >
                <div
                    className={`mi-trip-deco${
                        hasDreamAccess
                            ? isSintonia
                                ? " cyan-tier"
                                : " golden"
                            : ""
                    }`}
                >
                    <div className="mi-trip-deco-label">
                        <span className="mi-trip-deco-label-top">
                            ✦ Decodificador de Sueños
                        </span>
                        <span className="mi-trip-deco-label-sub">
                            {hasDreamAccess
                                ? `Acceso ilimitado · ${tierLabel}`
                                : "Lecturas del plan freemium"}
                        </span>
                    </div>
                    <div>
                        <div className="mi-trip-deco-val">
                            {hasDreamAccess
                                ? "∞"
                                : `${Math.max(0, dreamLimit - dreamUsed)} / ${dreamLimit}`}
                        </div>
                        <div className="mi-trip-deco-val-mini">
                            {hasDreamAccess
                                ? `Usados ${dreamUsed}`
                                : `Restantes`}
                        </div>
                    </div>
                </div>
                </TarjetaRefrescable>

                {/* v1.17 — REFLEJOS DEL ESPEJO: cuántos lleva enviados de los
                    3 de cortesía. Con membresía activa no hay tope. */}
                <TarjetaRefrescable
                    onRefrescar={RF.espejoOnb}
                    cargando={refrescandoCard === "espejoOnb"}
                    titulo="Volver a leer los reflejos y el onboarding"
                >
                <div
                    className={`mi-trip-deco${isSubscriber ? (isSintonia ? " cyan-tier" : "") : ""}`}
                >
                    <div className="mi-trip-deco-label">
                        <span className="mi-trip-deco-label-top">
                            ✦ Espejo Vibracional
                        </span>
                        <span className="mi-trip-deco-label-sub">
                            {isSubscriber
                                ? `Reflejos sin tope · ${tierLabel}`
                                : "Reflejos del plan freemium"}
                        </span>
                        {/* 🜂 v1.22 — ¿QUISO SEGUIR? (Zak). Gastar los 3 y
                            marcharse no es lo mismo que gastar los 3 y volver a
                            intentarlo: lo segundo es alguien pidiendo entrar.
                            Se pinta en ámbar porque ESA es la señal que vale
                            del embudo; si nunca lo intentó, se dice en gris y
                            sin dramatismo. Solo tiene sentido sin membresía:
                            con Sintonía no hay muro contra el cual chocar. */}
                        {!isSubscriber && muroEspejo && (
                            <span
                                className="mi-trip-deco-label-sub"
                                style={{
                                    marginTop: 3,
                                    color:
                                        Number(muroEspejo.intentos) > 0
                                            ? "rgba(232,198,90,0.92)"
                                            : "rgba(255,255,255,0.34)",
                                }}
                            >
                                {Number(muroEspejo.intentos) > 0
                                    ? `⚑ Quiso el cuarto · ${Number(muroEspejo.intentos)} ${
                                          Number(muroEspejo.intentos) === 1
                                              ? "vez"
                                              : "veces"
                                      }${
                                          muroEspejo.ultimo
                                              ? ` · ${new Date(
                                                    muroEspejo.ultimo
                                                ).toLocaleDateString("es-MX", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}`
                                              : ""
                                      }`
                                    : "No intentó el cuarto"}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="mi-trip-deco-val">
                            {espejoOnb == null
                                ? "—"
                                : isSubscriber
                                  ? "∞"
                                  : `${Math.max(
                                        0,
                                        Number(espejoOnb.reflejos_restantes) || 0
                                    )} / ${Number(espejoOnb.reflejos_limite) || 3}`}
                        </div>
                        <div className="mi-trip-deco-val-mini">
                            {espejoOnb == null
                                ? "Sin datos"
                                : isSubscriber
                                  ? `Enviados ${Number(espejoOnb.reflejos_enviados) || 0}`
                                  : "Restantes"}
                        </div>
                    </div>
                </div>
                </TarjetaRefrescable>

                {/* v1.17 — POR DÓNDE LLEGÓ: lo que contestó en el onboarding,
                    enlazado a su cuenta al crearla. "Sin registro" = creó
                    cuenta antes de que existiera el enlace, o entró por otra
                    puerta. */}
                <TarjetaRefrescable
                    onRefrescar={RF.espejoOnb}
                    cargando={refrescandoCard === "espejoOnb"}
                    titulo="Volver a leer los reflejos y el onboarding"
                >
                <div
                    className="mi-trip-deco"
                    style={{ alignItems: "flex-start" }}
                >
                    <div className="mi-trip-deco-label">
                        <span className="mi-trip-deco-label-top">
                            ✦ Onboarding
                        </span>
                        <span className="mi-trip-deco-label-sub">
                            {espejoOnb?.onb_started_at
                                ? `${espejoOnb.onb_completed ? "Completado" : `Llegó a la pantalla ${espejoOnb.onb_max_step ?? "—"}`} · ${new Date(
                                      espejoOnb.onb_started_at
                                  ).toLocaleDateString("es-MX", {
                                      day: "numeric",
                                      month: "short",
                                  })}`
                                : "Sin registro"}
                        </span>
                        {espejoOnb?.onb_answers &&
                        Object.keys(espejoOnb.onb_answers).length > 0 ? (
                            <div
                                style={{
                                    marginTop: 8,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                }}
                            >
                                {Object.entries(
                                    espejoOnb.onb_answers as Record<
                                        string,
                                        any
                                    >
                                ).map(([k, v]) => (
                                    <span
                                        key={k}
                                        style={{
                                            display: "inline-flex",
                                            gap: 5,
                                            padding: "3px 9px",
                                            borderRadius: 999,
                                            border: `1px solid ${hx(AC, 0.28)}`,
                                            background: hx(AC, 0.07),
                                            fontFamily: "'Inter',sans-serif",
                                            fontSize: 10.5,
                                            color: "rgba(255,255,255,0.78)",
                                        }}
                                    >
                                        <span style={{ opacity: 0.5 }}>
                                            {ONB_ETIQUETAS[k] || k}
                                        </span>
                                        <strong style={{ fontWeight: 600 }}>
                                            {String(v)}
                                        </strong>
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
                </TarjetaRefrescable>

                {/* 🜂 v1.18 — DE DÓNDE ENTRA. Ciudad, país y navegador de la
                    sesión más reciente, tal como Clerk los vio. La
                    advertencia NO es opcional: en el escritorio web el
                    tráfico de identificación pasa por nuestro propio
                    servidor (Vercel, región de Ashburn, Virginia), así que
                    ahí Clerk registra NUESTRA dirección y no la de la
                    persona. Mostrar "Ashburn" sin decir eso sería peor que
                    no mostrar nada. */}
                {ubicacion ? (
                    <div
                        className="mi-trip-deco"
                        style={{ alignItems: "flex-start" }}
                    >
                        <div className="mi-trip-deco-label">
                            <span className="mi-trip-deco-label-top">
                                ✦ De dónde entra
                            </span>
                            <span className="mi-trip-deco-label-sub">
                                {[ubicacion.city, ubicacion.country]
                                    .filter(Boolean)
                                    .join(" · ") || "Sin ubicación"}
                                {ubicacion.browser
                                    ? ` · ${ubicacion.browser}`
                                    : ""}
                                {ubicacion.device_type
                                    ? ` · ${ubicacion.device_type}`
                                    : ""}
                            </span>
                            {String(ubicacion.city || "")
                                .toLowerCase()
                                .includes("ashburn") ? (
                                <span
                                    style={{
                                        marginTop: 6,
                                        display: "block",
                                        fontSize: 10,
                                        lineHeight: 1.5,
                                        color: "rgba(255,214,120,0.72)",
                                        maxWidth: 380,
                                    }}
                                >
                                    Esta es NUESTRA dirección, no la suya: en
                                    el escritorio web la identificación pasa
                                    por nuestro servidor en Ashburn. La
                                    ubicación real de esta persona no se
                                    registra por ese camino.
                                </span>
                            ) : null}
                        </div>
                        <div>
                            <div
                                className="mi-trip-deco-val-mini"
                                style={{ opacity: 0.55 }}
                            >
                                {ubicacion.ip || "—"}
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Versión de la app que corre este nodo (telemetría interna —
                    el usuario no la ve). Vacío "—" = build anterior al tracking,
                    o no ha abierto la app desde que actualizó. */}
                <TarjetaRefrescable
                    onRefrescar={RF.extras}
                    cargando={refrescandoCard === "extras"}
                    titulo="Volver a leer la versión que reporta"
                >
                <div className="mi-trip-deco">
                    <div className="mi-trip-deco-label">
                        <span className="mi-trip-deco-label-top">
                            ✦ Versión de la app
                        </span>
                        <span className="mi-trip-deco-label-sub">
                            {extras?.app_version_updated_at
                                ? `Reportada ${new Date(
                                      extras.app_version_updated_at
                                  ).toLocaleDateString("es-MX", {
                                      day: "numeric",
                                      month: "short",
                                  })} · ${new Date(
                                      extras.app_version_updated_at
                                  ).toLocaleTimeString("es-MX", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })}`
                                : "Sin reportar"}
                        </span>
                    </div>
                    <div>
                        <div className="mi-trip-deco-val">
                            {extras?.app_version || "—"}
                        </div>
                        <div className="mi-trip-deco-val-mini">interna</div>
                    </div>
                </div>
                </TarjetaRefrescable>

                {/* v1.16 — EN QUÉ APARATO. Unido de los avisos registrados y
                    de la navegación dentro de la app; vacío = nunca la abrió
                    o es anterior a esta telemetría. */}
                <TarjetaRefrescable
                    onRefrescar={RF.plataformas}
                    cargando={refrescandoCard === "plataformas"}
                    titulo="Volver a leer los aparatos"
                >
                <div className="mi-trip-deco">
                    <div className="mi-trip-deco-label">
                        <span className="mi-trip-deco-label-top">
                            ✦ Aparato
                        </span>
                        <span className="mi-trip-deco-label-sub">
                            {plataformas
                                ? plataformas.split(",").length > 1
                                    ? "Varios aparatos"
                                    : plataformas.startsWith("web")
                                      ? "Solo desde el navegador"
                                      : "Aplicación instalada"
                                : "Aún no ha recorrido la app"}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                        }}
                    >
                        {plataformas ? (
                            plataformas.split(",").map((p) => {
                                const meta =
                                    p === "ios"
                                        ? {
                                              txt: "Apple",
                                              color: "#E8EEF7",
                                              glifo: "",
                                          }
                                        : p === "android"
                                          ? {
                                                txt: "Android",
                                                color: "#3DDC84",
                                                glifo: "🤖",
                                            }
                                          : p === "web-movil"
                                            ? {
                                                  txt: "Navegador móvil",
                                                  color: "#7DDCFF",
                                                  glifo: "▯",
                                              }
                                            : p === "web-escritorio"
                                              ? {
                                                    txt: "Navegador de escritorio",
                                                    color: "#00C2FF",
                                                    glifo: "◫",
                                                }
                                              : {
                                                    txt: "Navegador",
                                                    color: "#00C2FF",
                                                    glifo: "◫",
                                                }
                                return (
                                    <span
                                        key={p}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "4px 10px",
                                            borderRadius: 999,
                                            border: `1px solid ${meta.color}55`,
                                            background: `${meta.color}14`,
                                            color: meta.color,
                                            fontFamily:
                                                "'Inter',sans-serif",
                                            fontSize: 11,
                                            fontWeight: 500,
                                            letterSpacing: "0.04em",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <span aria-hidden="true">
                                            {meta.glifo}
                                        </span>
                                        {meta.txt}
                                    </span>
                                )
                            })
                        ) : (
                            <div className="mi-trip-deco-val">—</div>
                        )}
                    </div>
                </div>
                </TarjetaRefrescable>

                {isSubscriber &&
                    extras?.subscription_current_period_end && (
                        <TarjetaRefrescable
                            onRefrescar={RF.extras}
                            cargando={refrescandoCard === "extras"}
                            titulo="Volver a leer el estado de la suscripción"
                        >
                        <div
                            className={`mi-trip-deco${isSintonia ? " cyan-tier" : " golden"}`}
                        >
                            <div className="mi-trip-deco-label">
                                <span className="mi-trip-deco-label-top">
                                    ✦ Estado de la Suscripción
                                </span>
                                <span className="mi-trip-deco-label-sub">
                                    {extras.subscription_cancel_at_period_end
                                        ? extras.subscription_is_gift
                                            ? "Cortesía Solar · sin renovación"
                                            : "Renovación desactivada"
                                        : "Renovación automática"}
                                </span>
                                {extras.subscription_started_at && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                            color: "rgba(255,255,255,0.4)",
                                            marginTop: 2,
                                        }}
                                    >
                                        Inicio del ciclo:{" "}
                                        {new Date(
                                            extras.subscription_started_at
                                        ).toLocaleDateString("es-MX", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                )}
                            </div>
                            <div>
                                <div
                                    className="mi-trip-deco-val"
                                    style={{
                                        fontSize: 14,
                                        color: extras.subscription_cancel_at_period_end
                                            ? "rgba(255,168,80,0.95)"
                                            : "#4CAF50",
                                        textShadow: extras.subscription_cancel_at_period_end
                                            ? "0 0 12px rgba(255,168,80,0.4)"
                                            : "0 0 12px rgba(76,175,80,0.4)",
                                    }}
                                >
                                    {new Date(
                                        extras.subscription_current_period_end
                                    ).toLocaleDateString("es-MX", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                                <div className="mi-trip-deco-val-mini">
                                    {extras.subscription_cancel_at_period_end
                                        ? "Termina"
                                        : "Renueva"}
                                </div>
                            </div>
                        </div>
                        </TarjetaRefrescable>
                    )}

                {cristales && (
                    <TarjetaRefrescable
                        onRefrescar={RF.cristales}
                        cargando={refrescandoCard === "cristales"}
                        titulo="Volver a contar los cristales"
                    >
                    <div
                        className="mi-trip-deco"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr",
                            alignItems: "center",
                            gap: 12,
                            padding: "16px 20px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                                position: "relative",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.55)",
                                }}
                            >
                                ✦ Cristales · Códice
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <RevokeCristalButton
                                    onClick={() =>
                                        handleRevokeCristal("codice")
                                    }
                                    disabled={
                                        !!grantingCristal ||
                                        cristales.codice_count <= 0
                                    }
                                    pulsing={cristalPulse === "codice"}
                                />
                                <CristalCount
                                    count={cristales.codice_count}
                                    pulsing={cristalPulse === "codice"}
                                    accentDim="#7DDCFF"
                                    pulseShadow="0 0 22px rgba(0,194,255,0.85), 0 0 8px rgba(0,194,255,0.6)"
                                    idleShadow="0 0 14px rgba(0,194,255,0.4)"
                                />
                                <GrantCristalButton
                                    onClick={() =>
                                        handleGrantCristal("codice")
                                    }
                                    disabled={!!grantingCristal}
                                    pulsing={cristalPulse === "codice"}
                                    color="#7DDCFF"
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: 9,
                                    color: "rgba(255,255,255,0.4)",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Disponibles
                            </span>
                        </div>
                        <div
                            style={{
                                width: 1,
                                height: 48,
                                background:
                                    "linear-gradient(180deg, transparent, rgba(255,255,255,0.18), transparent)",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                                position: "relative",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.55)",
                                }}
                            >
                                ✦ Cristales · Meditación
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                {!isInmersionTier && (
                                    <RevokeCristalButton
                                        onClick={() =>
                                            handleRevokeCristal("meditacion")
                                        }
                                        disabled={
                                            !!grantingCristal ||
                                            cristales.meditacion_count <= 0
                                        }
                                        pulsing={cristalPulse === "meditacion"}
                                    />
                                )}
                                <CristalCount
                                    count={
                                        isInmersionTier
                                            ? "∞"
                                            : cristales.meditacion_count
                                    }
                                    pulsing={cristalPulse === "meditacion"}
                                    accentDim={
                                        isInmersionTier ? "#F5D98C" : "#7DDCFF"
                                    }
                                    fontSize={isInmersionTier ? 36 : 28}
                                    pulseShadow="0 0 22px rgba(0,194,255,0.85), 0 0 8px rgba(0,194,255,0.6)"
                                    idleShadow={
                                        isInmersionTier
                                            ? "0 0 14px rgba(245,217,140,0.5)"
                                            : "0 0 14px rgba(0,194,255,0.4)"
                                    }
                                />
                                {!isInmersionTier && (
                                    <GrantCristalButton
                                        onClick={() =>
                                            handleGrantCristal("meditacion")
                                        }
                                        disabled={!!grantingCristal}
                                        pulsing={cristalPulse === "meditacion"}
                                        color="#7DDCFF"
                                    />
                                )}
                            </div>
                            <span
                                style={{
                                    fontSize: 9,
                                    color: "rgba(255,255,255,0.4)",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {isInmersionTier
                                    ? "Acceso ilimitado"
                                    : "Disponibles"}
                            </span>
                        </div>
                    </div>
                    </TarjetaRefrescable>
                )}

                {/* v1.16 — Cortesía Solar: de cuándo a cuándo corre + días
                    restantes (o hace cuánto venció). Solo aparece si hay
                    regalo pendiente, activo o vencido. */}
                {giftStatusLoaded && giftInfo && (
                    <TarjetaRefrescable
                        onRefrescar={RF.regalo}
                        cargando={refrescandoCard === "regalo"}
                        titulo="Volver a preguntar por la cortesía"
                    >
                        <CortesiaVigenciaCard info={giftInfo} />
                    </TarjetaRefrescable>
                )}

                {/* v1.16 — Avance de sondas por pilar (2 de 8, sellado, sin
                    iniciar): dice si están abandonando el escaneo y dónde. */}
                {sondaProg && (
                    <TarjetaRefrescable
                        onRefrescar={RF.sondas}
                        cargando={refrescandoCard === "sondas"}
                        titulo="Volver a leer el avance de las sondas"
                    >
                        <SondasAvanceCard data={sondaProg} />
                    </TarjetaRefrescable>
                )}

                {/* Card Navegantes de la Red — progreso del simulador. */}
                {navegante && (
                    <TarjetaRefrescable
                        onRefrescar={RF.navegante}
                        cargando={refrescandoCard === "navegante"}
                        titulo="Volver a leer el avance del Navegante"
                    >
                        <NaveganteProgressCard data={navegante} />
                    </TarjetaRefrescable>
                )}

                {/* Card Ritual Diario — resumen + botón a la vista detallada. */}
                {ritualData && (
                    <TarjetaRefrescable
                        onRefrescar={RF.ritual}
                        cargando={refrescandoCard === "ritual"}
                        titulo="Volver a leer el Ritual Diario"
                    >
                        <RitualDiarioCard
                            data={ritualData}
                            onExpand={() => setExpandedSection("rituales")}
                        />
                    </TarjetaRefrescable>
                )}

                {/* Card Rachas — uso del Contador (números SIN títulos: ética;
                    los títulos se leen anónimos en Motor → Rachas). */}
                {rachasData && (
                    <TarjetaRefrescable
                        onRefrescar={RF.rachas}
                        cargando={refrescandoCard === "rachas"}
                        titulo="Volver a leer las rachas"
                    >
                        <RachasUsoCard data={rachasData} />
                    </TarjetaRefrescable>
                )}

                {mailStatusLoaded && (
                <TarjetaRefrescable
                    onRefrescar={RF.correoCiclo}
                    cargando={refrescandoCard === "correoCiclo"}
                    titulo="Volver a leer el envío del correo"
                >
                <div
                    className={`mi-trip-mail mail-${
                        mailStatus?.status || "none"
                    }`}
                >
                    <div className="mi-trip-mail-label">
                        <span className="mi-trip-mail-label-top">
                            ✦ Correo Ciclo Sellado
                        </span>
                        <span className="mi-trip-mail-label-sub">
                            {mailStatus?.status === "sent" &&
                                `Enviado · ${(() => {
                                    try {
                                        return new Date(
                                            mailStatus.sent_at
                                        ).toLocaleString("es-MX", {
                                            day: "numeric",
                                            month: "long",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                            timeZone: "America/Cancun",
                                        })
                                    } catch {
                                        return "—"
                                    }
                                })()}`}
                            {mailStatus?.status === "failed" &&
                                `Falló · ${
                                    mailStatus.error_message ||
                                    "razón desconocida"
                                }`}
                            {mailStatus?.status === "skipped" &&
                                "Omitido · Sintonía Solar activa"}
                            {!mailStatus &&
                                "Sin registro — el ciclo aún no se ha cerrado o el log no se aplicó"}
                        </span>
                    </div>
                    <div className="mi-trip-mail-icon">
                        {mailStatus?.status === "sent" && "✓"}
                        {mailStatus?.status === "failed" && "✗"}
                        {mailStatus?.status === "skipped" && "↷"}
                        {!mailStatus && "—"}
                    </div>
                </div>
                </TarjetaRefrescable>
                )}

                {subStatusLoaded && (() => {
                    const fmtAt = (iso: string | null): string => {
                        if (!iso) return "—"
                        try {
                            return new Date(iso).toLocaleString("es-MX", {
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                                timeZone: "America/Cancun",
                            })
                        } catch {
                            return "—"
                        }
                    }
                    const variant = subStatus?.has_opt_out
                        ? "out"
                        : subStatus?.in_nodo
                          ? "in"
                          : "none"
                    const fromMap: Record<string, string> = {
                        bienvenida_nodo: "Email de bienvenida de cuenta",
                        ciclo_sellado: "Email de Ciclo Sellado",
                    }
                    const fromLabel =
                        subStatus?.nodo_source_from &&
                        typeof subStatus.nodo_source_from === "string"
                            ? fromMap[subStatus.nodo_source_from] ||
                              subStatus.nodo_source_from
                            : ""
                    const sub =
                        variant === "out"
                            ? `Dado de baja · ${fmtAt(
                                  subStatus?.opted_out_at || null
                              )}${
                                  subStatus?.opt_out_reason
                                      ? ` · ${subStatus.opt_out_reason}`
                                      : ""
                              }`
                            : variant === "in"
                              ? `Suscrito al Nodo · ${fmtAt(
                                    subStatus?.subscribed_at || null
                                )}${
                                    fromLabel
                                        ? ` · vino de: ${fromLabel}`
                                        : subStatus?.nodo_source
                                          ? ` · ${subStatus.nodo_source}`
                                          : ""
                                }`
                              : "Sin registro — todavía no entró por el form de Origen ni se dio de baja"
                    const icon =
                        variant === "out" ? "✗" : variant === "in" ? "✓" : "—"
                    return (
                        <TarjetaRefrescable
                            onRefrescar={RF.correoSub}
                            cargando={refrescandoCard === "correoSub"}
                            titulo="Volver a leer la suscripción al Nodo"
                        >
                            <div className={`mi-trip-list list-${variant}`}>
                                <div className="mi-trip-list-label">
                                    <span className="mi-trip-list-label-top">
                                        ✦ Lista de Correos · Nodo Central
                                    </span>
                                    <span className="mi-trip-list-label-sub">
                                        {sub}
                                    </span>
                                </div>
                                <div className="mi-trip-list-icon">{icon}</div>
                            </div>
                        </TarjetaRefrescable>
                    )
                })()}

                </div>
                <div className="mi-trip-col mi-trip-col-right">
                <p className="mi-trip-section-label">
                    Pilares · Último Pulso + In-flight
                </p>
                <div className="mi-trip-pilares">
                    {(() => {
                        const currentCycle = parseCycle(
                            t.history?.[0]?.cycle || null
                        ).map((x) => String(x).toUpperCase())
                        return PILAR_ORDER.map((pid: string) => {
                            const val = lastScores[pid]
                            const pidUpper = pid.toUpperCase()
                            const isInFlight =
                                inFlightSet.has(pidUpper) ||
                                inFlightSet.has(pid)
                            const hasScore =
                                typeof val === "number" && !isNaN(val)
                            const displayVal = hasScore
                                ? Math.round(val!)
                                : null
                            const isSealed = currentCycle.includes(pidUpper)

                            const status:
                                | "sealed"
                                | "open"
                                | "available"
                                | "empty" = isSealed
                                ? "sealed"
                                : isInFlight
                                  ? "open"
                                  : hasScore
                                    ? "available"
                                    : "empty"

                            const tier:
                                | "low"
                                | "mid"
                                | "high"
                                | "empty" = !hasScore
                                ? "empty"
                                : displayVal! < 50
                                  ? "low"
                                  : displayVal! < 75
                                    ? "mid"
                                    : "high"

                            const statusLabel =
                                status === "sealed"
                                    ? "Sellado"
                                    : status === "open"
                                      ? "Abierta"
                                      : status === "available"
                                        ? "Disponible"
                                        : "Sin datos"

                            return (
                                <div
                                    className={`mi-trip-pilar ${status}`}
                                    key={pid}
                                >
                                    <div className="mi-trip-pilar-head">
                                        <span>
                                            {PILAR_LABELS[pid] || pid}
                                        </span>
                                        <span
                                            className={`mi-trip-pilar-val ${status}`}
                                        >
                                            {displayVal !== null
                                                ? `${displayVal}%`
                                                : status === "open"
                                                  ? "en curso"
                                                  : "—"}
                                        </span>
                                    </div>
                                    <div className="mi-trip-pilar-bar">
                                        <div
                                            className={`mi-trip-pilar-fill tier-${tier}`}
                                            style={{
                                                width: hasScore
                                                    ? `${Math.max(0, Math.min(100, displayVal!))}%`
                                                    : status === "open"
                                                      ? "12%"
                                                      : "0%",
                                            }}
                                        />
                                    </div>
                                    <span
                                        className={`mi-trip-pilar-sub ${status}`}
                                    >
                                        {statusLabel}
                                        {hasScore && status !== "empty"
                                            ? ` · ${displayVal}%`
                                            : ""}
                                    </span>
                                </div>
                            )
                        })
                    })()}
                </div>
                <p
                    className="mi-trip-section-label"
                    style={{ marginTop: 22 }}
                >
                    Trayectoria · Índice de Luz
                </p>
                {tlRaw.length === 0 ? (
                    <p className="mi-trip-tl-empty">
                        {t.scan_count > 0
                            ? "Aún no completa un ciclo (6/6 pilares)."
                            : "Sin eventos de escaneo registrados."}
                    </p>
                ) : (
                    <div className="mi-trip-timeline">
                        {tlRaw.map((e, i) => {
                            const pct = Math.max(
                                0,
                                Math.min(100, Math.round(e.indice ?? 0))
                            )
                            return (
                                <div
                                    key={i}
                                    className="mi-trip-tl-bar"
                                    title={`Ciclo · ${pct}% — ${new Date(e.ts).toLocaleString("es-MX")}`}
                                >
                                    <span className="mi-trip-tl-val">
                                        {pct}
                                    </span>
                                    <div
                                        className="mi-trip-tl-fill"
                                        style={{ height: `${pct * 0.68 + 4}px` }}
                                    />
                                    <span className="mi-trip-tl-dot" />
                                </div>
                            )
                        })}
                    </div>
                )}

                {(!isSubscriber || giftAcceptedEff || giftPending) && (
                    <div
                        style={{
                            marginTop: 22,
                            paddingTop: 16,
                            borderTop: "1px dashed rgba(0,194,255,0.18)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            gap: 10,
                        }}
                    >
                        <p className="mi-trip-section-label">
                            Acción admin
                        </p>
                        {/* v1.14 — Regalo de Sintonía en 3 estados:
                            · sin regalo → "Regalar Sintonía Solar"
                            · pendiente (ofrecido, sin aceptar) → estatus
                              "pendiente" + "Cancelar invitación"
                            · aceptado (cortesía activa) → "Revocar Sintonía" */}
                        {!giftPending && !giftAcceptedEff && (
                            <button
                                type="button"
                                onClick={() => setConfirmRegalo(true)}
                                disabled={regalando}
                                style={{
                                    padding: "12px 18px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(0,194,255,0.4)",
                                    background:
                                        "linear-gradient(135deg, rgba(0,194,255,0.08), rgba(0,90,160,0.04))",
                                    color: "#7DDCFF",
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    cursor: regalando ? "wait" : "pointer",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                    opacity: regalando ? 0.6 : 1,
                                }}
                            >
                                {regalando
                                    ? "Enviando…"
                                    : "✦ Regalar Sintonía Solar (1 mes)"}
                            </button>
                        )}

                        {/* Regalo PENDIENTE: estatus + cancelar invitación. */}
                        {giftPending && (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 9,
                                        padding: "11px 16px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(212,168,67,0.42)",
                                        background:
                                            "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(120,90,20,0.05))",
                                        color: "#F0CE7E",
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "#E8C65A",
                                            boxShadow: "0 0 8px #E8C65A",
                                            flexShrink: 0,
                                        }}
                                    />
                                    Regalo Sintonía Solar: pendiente
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setConfirmCancelGift(true)}
                                    disabled={cancellingGift}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(255,120,120,0.4)",
                                        background:
                                            "linear-gradient(135deg, rgba(255,90,90,0.08), rgba(160,40,40,0.04))",
                                        color: "rgba(255,150,150,0.92)",
                                        fontFamily: "'Inter',sans-serif",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        cursor: cancellingGift
                                            ? "wait"
                                            : "pointer",
                                        outline: "none",
                                        transition: "all 0.2s ease",
                                        opacity: cancellingGift ? 0.6 : 1,
                                    }}
                                >
                                    {cancellingGift
                                        ? "Cancelando…"
                                        : "Cancelar invitación"}
                                </button>
                            </>
                        )}

                        {regaloMsg && (
                            <span
                                style={{
                                    fontSize: 11,
                                    color: regaloMsg.startsWith("Error")
                                        ? "rgba(255,140,140,0.85)"
                                        : "rgba(125,220,255,0.85)",
                                    fontFamily: "'Inter',sans-serif",
                                    letterSpacing: "0.04em",
                                    textAlign: "center",
                                }}
                            >
                                {regaloMsg}
                            </span>
                        )}
                        {/* Regalo ACEPTADO (cortesía activa) → revocar Sintonía. */}
                        {!giftPending && giftAcceptedEff && (
                            <button
                                type="button"
                                onClick={() => setConfirmRevoke(true)}
                                disabled={revoking}
                                style={{
                                    padding: "10px 18px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,120,120,0.4)",
                                    background:
                                        "linear-gradient(135deg, rgba(255,90,90,0.08), rgba(160,40,40,0.04))",
                                    color: "rgba(255,150,150,0.92)",
                                    fontFamily: "'Inter',sans-serif",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    cursor: revoking ? "wait" : "pointer",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                    opacity: revoking ? 0.6 : 1,
                                }}
                            >
                                {revoking
                                    ? "Revocando…"
                                    : "Revocar Sintonía"}
                            </button>
                        )}
                        {revokeMsg && (
                            <span
                                style={{
                                    fontSize: 11,
                                    color: revokeMsg.startsWith("Error")
                                        ? "rgba(255,140,140,0.85)"
                                        : "rgba(125,220,255,0.85)",
                                    fontFamily: "'Inter',sans-serif",
                                    letterSpacing: "0.04em",
                                    textAlign: "center",
                                }}
                            >
                                {revokeMsg}
                            </span>
                        )}
                    </div>
                )}

                {confirmRevoke && (
                    <div className="mi-trip-confirm-overlay">
                        <div className="mi-trip-confirm-card">
                            <div
                                className="mi-trip-confirm-icon"
                                style={{ color: "rgba(255,150,150,0.92)" }}
                            >
                                <svg
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                            </div>
                            <div className="mi-trip-confirm-title">
                                ¿Revocar la Sintonía de regalo?
                            </div>
                            <div className="mi-trip-confirm-body">
                                Vas a retirar la Sintonía Solar de regalo de{" "}
                                <strong>
                                    {t.full_name || "este tripulante"}
                                </strong>
                                . Pasará a Explorador al instante y se le
                                volverán a mostrar los muros de Sintonía Solar.
                                Solo afecta cortesías internas — nunca una
                                suscripción pagada en Stripe.
                            </div>
                            <div className="mi-trip-confirm-row">
                                <button
                                    type="button"
                                    className="mi-trip-confirm-cancel"
                                    onClick={() => setConfirmRevoke(false)}
                                    disabled={revoking}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="mi-trip-confirm-ok"
                                    onClick={handleRevokeSintonia}
                                    disabled={revoking}
                                >
                                    {revoking ? "Revocando…" : "Sí, revocar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* v1.14 — Confirmar CANCELAR la invitación pendiente. */}
                {confirmCancelGift && (
                    <div className="mi-trip-confirm-overlay">
                        <div className="mi-trip-confirm-card">
                            <div
                                className="mi-trip-confirm-icon"
                                style={{ color: "rgba(255,150,150,0.92)" }}
                            >
                                <svg
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="mi-trip-confirm-title">
                                ¿Cancelar la invitación?
                            </div>
                            <div className="mi-trip-confirm-body">
                                Vas a retirar el regalo pendiente de{" "}
                                <strong>
                                    {t.full_name || "este tripulante"}
                                </strong>
                                . Dejará de aparecer la tarjeta en Mi Núcleo y ya
                                no podrá aceptarlo. Si ya le llegó la
                                notificación, esa no se puede des-enviar.
                            </div>
                            <div className="mi-trip-confirm-row">
                                <button
                                    type="button"
                                    className="mi-trip-confirm-cancel"
                                    onClick={() => setConfirmCancelGift(false)}
                                    disabled={cancellingGift}
                                >
                                    No, dejar
                                </button>
                                <button
                                    type="button"
                                    className="mi-trip-confirm-ok"
                                    onClick={handleCancelGift}
                                    disabled={cancellingGift}
                                >
                                    {cancellingGift
                                        ? "Cancelando…"
                                        : "Sí, cancelar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {confirmRegalo && (
                    <div className="mi-trip-confirm-overlay">
                        <div className="mi-trip-confirm-card">
                            <div className="mi-trip-confirm-icon">
                                <svg
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                            <div className="mi-trip-confirm-title">
                                ¿Regalar Sintonía Solar (1 mes)?
                            </div>
                            <div className="mi-trip-confirm-body">
                                Vas a enviarle un regalo de Sintonía Solar a{" "}
                                <strong>
                                    {t.full_name || "este tripulante"}
                                </strong>
                                . En la app verá una celebración y, al tocar
                                "Aceptar", se le activa la membresía por 30 días
                                (sin cobro en Stripe). Si cierra la celebración,
                                le queda un aviso de "regalo disponible" en Mi
                                Núcleo hasta que la acepte. Requiere la app 1.0.5
                                o más nueva.
                            </div>
                            <div className="mi-trip-confirm-row">
                                <button
                                    type="button"
                                    className="mi-trip-confirm-cancel"
                                    onClick={() => setConfirmRegalo(false)}
                                    disabled={regalando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="mi-trip-confirm-ok"
                                    onClick={handleActivateSintonia}
                                    disabled={regalando}
                                >
                                    {regalando
                                        ? "Enviando…"
                                        : "Sí, enviar regalo"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* v1.0 — Códices Adquiridos: vista compacta de hasta 3 rows
                    + botón "Expandir N más" si hay más. La vista expandida
                    se renderiza fuera del grid, cubriendo todo el modal
                    (overlay con header + body scrollable + ESC/Volver). */}
                {codicesList.length > 0 && (
                    <TarjetaRefrescable
                        onRefrescar={RF.codices}
                        cargando={refrescandoCard === "codices"}
                        titulo="Volver a leer los códices"
                    >
                    <div style={{ marginTop: 22 }}>
                        <p className="mi-trip-section-label">
                            Códices Adquiridos · {codicesList.length}
                            {codicesList.length > 3 && (
                                <button
                                    type="button"
                                    className="mi-trip-expand-trigger"
                                    onClick={() => setExpandedSection("codices")}
                                >
                                    Expandir {codicesList.length - 3} más
                                </button>
                            )}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            {codicesList
                                .slice(0, 3)
                                .map((p, i) => renderCodiceRow(p, i))}
                        </div>
                    </div>
                    </TarjetaRefrescable>
                )}

                </div>
                </div>
                )}
                </div>{/* /mi-trip-scrollbody */}
                {/* 🜂 v1.23 — las dos franjas que disuelven el corte. Solo se
                    montan cuando de verdad queda contenido fuera de vista de
                    ese lado, así que un panel corto no muestra ninguna. */}
                {desborde.arriba && (
                    <div className="mi-trip-fade mi-trip-fade-t" aria-hidden="true" />
                )}
                {desborde.abajo && (
                    <div className="mi-trip-fade mi-trip-fade-b" aria-hidden="true" />
                )}
                </div>{/* /mi-trip-bodywrap */}

                {/* v1.0 — Vista expandida de Códices Adquiridos. Patrón
                    canónico del Holograma de Expansión: position absolute
                    inset:0 sobre el modal, header con título + ESC + botón
                    Volver, body scrollable. ESC vuelve a la vista compacta
                    (manejado en el effect de keyboard arriba). */}
                {expandedSection === "codices" && (
                    <div className="mi-trip-expand-overlay">
                        <div className="mi-trip-expand-head">
                            <span className="mi-trip-expand-title">
                                Códices Adquiridos · {codicesList.length}
                            </span>
                            <div className="mi-trip-expand-actions">
                                <span className="mi-trip-expand-hint">
                                    ESC para volver
                                </span>
                                <button
                                    type="button"
                                    className="mi-trip-expand-back"
                                    onClick={() => setExpandedSection(null)}
                                >
                                    ← Volver
                                </button>
                            </div>
                        </div>
                        <div className="mi-trip-expand-body">
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {codicesList.map((p, i) =>
                                    renderCodiceRow(p, i)
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vista expandida del Ritual Diario — datos detallados. */}
                {expandedSection === "rituales" && ritualData && (
                    <div className="mi-trip-expand-overlay">
                        <div className="mi-trip-expand-head">
                            <span className="mi-trip-expand-title">
                                Ritual Diario · {ritualData.total_fotones} Fotones
                            </span>
                            <div className="mi-trip-expand-actions">
                                <span className="mi-trip-expand-hint">
                                    ESC para volver
                                </span>
                                <button
                                    type="button"
                                    className="mi-trip-expand-back"
                                    onClick={() => setExpandedSection(null)}
                                >
                                    ← Volver
                                </button>
                            </div>
                        </div>
                        <div className="mi-trip-expand-body">
                            <RitualDiarioDetail data={ritualData} />
                        </div>
                    </div>
                )}
            </div>
            {cristalRitual && (
                <CristalRitualOverlay
                    key={`ritual-${Date.now()}`}
                    tipo={cristalRitual}
                />
            )}
        </div>
    )
}

/* Helper interno: contador animado de cristales con pulse + glow.
   Extraído inline para no pisar la regla de "no hooks dentro de IIFEs". */
function CristalCount(props: {
    count: number | string
    pulsing: boolean
    accentDim: string
    pulseShadow: string
    idleShadow: string
    fontSize?: number
}) {
    const {
        count,
        pulsing,
        accentDim,
        pulseShadow,
        idleShadow,
        fontSize = 28,
    } = props
    return (
        <motion.span
            key={`crystal-${count}`}
            initial={pulsing ? { scale: 0.6, opacity: 0.4 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
            style={{
                fontSize,
                fontWeight: 200,
                color: accentDim,
                textShadow: pulsing ? pulseShadow : idleShadow,
                lineHeight: 1,
                transition: "text-shadow 0.5s ease",
            }}
        >
            {count}
        </motion.span>
    )
}

/* ═══ Card: Navegantes de la Red ═══════════════════════════════════════
   Muestra el progreso del simulador del Tripulante:
   - Si abrió el primer nivel (= cualquier membrana > 0 jugada)
   - Si completó el Tutorial
   - Cuántas Membranas conquistadas (de 20)
   - Cuál fue la última y cuándo
   - Si activó el código secreto (chord) en alguna membrana
*/
/* ═══ Card: Rachas (Contador de Rachas) ═══════════════════════════════
   Uso de la capa por nodo: cuántos contadores y los días de cada uno.
   SIN títulos (texto libre íntimo — ética, mismo criterio que sueños y
   Espejo); los títulos se leen ANÓNIMOS en Motor → pestaña "Rachas". */
const RC_CY = "#7DEFFF"
function RachasUsoCard({ data }: { data: any }) {
    const rachas: any[] = Array.isArray(data?.rachas) ? data.rachas : []
    const maxDays = rachas.reduce(
        (m: number, r: any) => Math.max(m, Number(r?.days ?? 0)),
        0
    )
    const fmtDesde = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
        } catch {
            return ""
        }
    }
    return (
        <div
            className="mi-trip-deco"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "16px 20px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                    }}
                >
                    ◔ Rachas
                </span>
                {data?.is_member ? (
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: RC_CY,
                            border: `1px solid ${hx(RC_CY, 0.3)}`,
                            background: hx(RC_CY, 0.08),
                            borderRadius: 999,
                            padding: "3px 10px",
                        }}
                    >
                        Sintonía
                    </span>
                ) : null}
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2,1fr)",
                    gap: 10,
                }}
            >
                <RStat
                    label="Contadores"
                    value={`${Number(data?.count ?? 0)}`}
                    accent={RC_CY}
                />
                <RStat
                    label="Más larga"
                    value={`${maxDays} d`}
                    accent={R_GOLD}
                />
            </div>
            {rachas.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    {rachas.map((r: any, i: number) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                borderRadius: 10,
                                border: "1px solid rgba(125,239,255,0.12)",
                                background: "rgba(0,0,0,0.2)",
                                padding: "8px 12px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.62)",
                                }}
                            >
                                Contador {i + 1} · desde{" "}
                                {fmtDesde(String(r?.started_at ?? ""))}
                                {Number(r?.best_days ?? 0) >
                                Number(r?.days ?? 0)
                                    ? ` · récord ${Number(r.best_days)} d`
                                    : ""}
                            </span>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: R_GOLD,
                                    flexShrink: 0,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {Number(r?.days ?? 0)} d
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <span
                style={{
                    fontSize: 9.5,
                    color: "rgba(255,255,255,0.35)",
                    lineHeight: 1.4,
                }}
            >
                Los títulos no se muestran por nodo (texto íntimo). Lectura
                anónima con títulos: Motor → pestaña Rachas.
            </span>
        </div>
    )
}

/* ═══ Card: Cortesía Solar — de cuándo a cuándo corre ═══════════════════
   v1.16 (Zak): el Motor mostraba la cortesía como viva para siempre (la RPC
   vieja solo miraba status='active'), mientras la app ya había bajado al
   Tripulante a Explorador al vencer los 30 días. Con las fechas de
   admin_get_gift_status v2 el panel dice exactamente hasta cuándo corre,
   cuántos días quedan, o hace cuánto venció. */
const CORT_CYAN = "#8CDCFF"
const CORT_GOLD = "#F5C66B"
const CORT_DIM = "#FFA850"
function fmtCortDate(v?: string | null): string {
    if (!v) return "—"
    try {
        return new Date(v).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    } catch {
        return "—"
    }
}
function CortesiaVigenciaCard({ info }: { info: GiftInfo }) {
    const accepted = !!info.accepted
    const expired = !!info.expired
    const pending = !!info.pending
    if (!accepted && !expired && !pending) return null

    const accent = accepted ? CORT_CYAN : expired ? CORT_DIM : CORT_GOLD
    const days = typeof info.days_left === "number" ? info.days_left : null
    /* % del mes de cortesía ya consumido (solo con las dos fechas). */
    let pct = 0
    if (info.started_at && info.expires_at) {
        const a = new Date(info.started_at).getTime()
        const b = new Date(info.expires_at).getTime()
        if (b > a) {
            pct = Math.max(0, Math.min(1, (Date.now() - a) / (b - a)))
        }
    }
    const titulo = accepted
        ? "Cortesía Solar activa"
        : expired
          ? "Cortesía Solar vencida"
          : "Regalo enviado · sin aceptar"
    const sub = accepted
        ? `Del ${fmtCortDate(info.started_at)} al ${fmtCortDate(info.expires_at)}`
        : expired
          ? `Corrió del ${fmtCortDate(info.started_at)} al ${fmtCortDate(info.expires_at)}`
          : `Enviado el ${fmtCortDate(info.offered_at)}`
    const valor = accepted
        ? days != null
            ? String(Math.max(0, days))
            : "∞"
        : expired
          ? days != null
              ? String(Math.abs(days))
              : "—"
          : "—"
    const valorMini = accepted
        ? days === 1
            ? "día restante"
            : "días restantes"
        : expired
          ? days != null && Math.abs(days) === 1
              ? "día vencida"
              : "días vencida"
          : "pendiente"

    return (
        <div
            className="mi-trip-deco"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "16px 20px",
                borderColor: hx(accent, 0.24),
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 14,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 9,
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: hx(accent, 0.85),
                        }}
                    >
                        ✦ {titulo}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            marginTop: 4,
                            color: "rgba(255,255,255,0.6)",
                        }}
                    >
                        {sub}
                    </div>
                    {info.claimed_at && (
                        <div
                            style={{
                                fontSize: 9.5,
                                marginTop: 3,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.38)",
                            }}
                        >
                            Aceptada el {fmtCortDate(info.claimed_at)}
                        </div>
                    )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: accent,
                            textShadow: `0 0 12px ${hx(accent, 0.35)}`,
                        }}
                    >
                        {valor}
                    </div>
                    <div
                        style={{
                            fontSize: 8.5,
                            marginTop: 4,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.45)",
                        }}
                    >
                        {valorMini}
                    </div>
                </div>
            </div>
            {(accepted || expired) && info.started_at && info.expires_at && (
                <div
                    style={{
                        height: 4,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${Math.round(pct * 100)}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${hx(accent, 0.5)}, ${accent})`,
                            transition: "width 0.6s ease",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

/* ═══ Card: Avance de sondas por pilar ═════════════════════════════════
   v1.16 (Zak) — hasta dónde llegó el nodo en cada pilar del Radar: sellado
   (con su puntaje), en curso (2 de 8) o sin iniciar. Sirve para ver si
   abandonan el escaneo y exactamente dónde. */
const SP_ORDER: Array<{ id: string; label: string }> = [
    { id: "fisico", label: "Cuerpo" },
    { id: "mental", label: "Mente" },
    { id: "emocional", label: "Emociones" },
    { id: "financiero", label: "Abundancia" },
    { id: "vector", label: "Propósito" },
    { id: "orbita", label: "Vínculos" },
]
function SondasAvanceCard({ data }: { data: SondaProgData }) {
    const byId: Record<string, SondaPilarProg> = {}
    for (const p of data.pilares || []) byId[String(p.pilar)] = p
    const cyc = Number(data.cycle_size || 0)
    const enCurso = (data.pilares || []).filter(
        (p) => !p.sealed && Number(p.answered || 0) > 0
    ).length
    return (
        <div
            className="mi-trip-deco"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "16px 20px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                    }}
                >
                    ◈ Avance de sondas
                </span>
                <span
                    style={{
                        fontSize: 9.5,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color:
                            cyc >= 6
                                ? hx(R_GOLD, 0.9)
                                : "rgba(255,255,255,0.45)",
                    }}
                >
                    Ciclo {cyc}/6
                    {enCurso > 0 ? ` · ${enCurso} en curso` : ""}
                </span>
            </div>
            <div
                style={{ display: "flex", flexDirection: "column", gap: 7 }}
            >
                {SP_ORDER.map(({ id, label }) => {
                    const p = byId[id]
                    const total = Number(p?.total || 0)
                    const done = Number(p?.answered || 0)
                    const sealed = !!p?.sealed
                    const pct =
                        total > 0
                            ? Math.min(1, (sealed ? total : done) / total)
                            : 0
                    const accent = sealed
                        ? R_GOLD
                        : done > 0
                          ? "#00E5FF"
                          : "rgba(255,255,255,0.22)"
                    const estado = sealed
                        ? p?.score != null
                            ? `Sellado · ${p.score}%`
                            : "Sellado"
                        : done > 0
                          ? `${done} de ${total || "?"}`
                          : "Sin iniciar"
                    return (
                        <div
                            key={id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <span
                                style={{
                                    width: 82,
                                    flexShrink: 0,
                                    fontSize: 10.5,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: sealed
                                        ? "rgba(255,255,255,0.82)"
                                        : done > 0
                                          ? "rgba(255,255,255,0.7)"
                                          : "rgba(255,255,255,0.38)",
                                }}
                            >
                                {label}
                            </span>
                            <span
                                style={{
                                    flex: 1,
                                    height: 5,
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.07)",
                                    overflow: "hidden",
                                    minWidth: 0,
                                }}
                            >
                                <span
                                    style={{
                                        display: "block",
                                        width: `${Math.round(pct * 100)}%`,
                                        height: "100%",
                                        borderRadius: 999,
                                        background: sealed
                                            ? `linear-gradient(90deg, ${hx(R_GOLD, 0.5)}, ${R_GOLD})`
                                            : `linear-gradient(90deg, rgba(0,229,255,0.45), #00E5FF)`,
                                        transition: "width 0.6s ease",
                                    }}
                                />
                            </span>
                            <span
                                style={{
                                    width: 92,
                                    flexShrink: 0,
                                    textAlign: "right",
                                    fontSize: 10,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color:
                                        accent === "rgba(255,255,255,0.22)"
                                            ? "rgba(255,255,255,0.35)"
                                            : accent,
                                }}
                            >
                                {estado}
                            </span>
                        </div>
                    )
                })}
            </div>
            {data.last_scan_at && (
                <div
                    style={{
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.32)",
                    }}
                >
                    Último escaneo · {fmtCortDate(data.last_scan_at)}
                </div>
            )}
        </div>
    )
}

/* ═══ Card: Ritual Diario (resumen) ════════════════════════════════════
   Fotones acumulados, racha y # de rituales activos. Botón "Ver detalle"
   abre la vista expandida con los últimos 7 días + uso por ritual. */
const R_GOLD = "#F5C66B"
function RStat({ label, value, accent }: { label: string; value: string; accent: string }) {
    return (
        <div
            style={{
                borderRadius: 10,
                border: `1px solid ${hx(accent, 0.22)}`,
                background: "rgba(0,0,0,0.2)",
                padding: "9px 10px",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontSize: 8.5,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                }}
            >
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: accent, marginTop: 3 }}>
                {value}
            </div>
        </div>
    )
}

function RitualDiarioCard({
    data,
    onExpand,
}: {
    data: RitualData
    onExpand: () => void
}) {
    const active = data.active || []
    return (
        <div
            className="mi-trip-deco"
            style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 20px" }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                    }}
                >
                    ◷ Ritual Diario
                </span>
                <button
                    type="button"
                    onClick={onExpand}
                    style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: R_GOLD,
                        background: hx(R_GOLD, 0.1),
                        border: `1px solid ${hx(R_GOLD, 0.3)}`,
                        borderRadius: 999,
                        padding: "5px 12px",
                        cursor: "pointer",
                    }}
                >
                    Ver detalle →
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <RStat label="Fotones" value={Number(data.total_fotones || 0).toLocaleString("es-MX")} accent={R_GOLD} />
                <RStat label="Racha" value={`${data.streak || 0} d`} accent="#FF8A5B" />
                <RStat label="Activos" value={`${active.length}`} accent="#00E5FF" />
            </div>
        </div>
    )
}

/* ═══ Vista detallada del Ritual Diario (expandida) ════════════════════ */
function RitualDiarioDetail({ data }: { data: RitualData }) {
    const fmtDay = (dstr: string) => {
        try {
            const d = new Date(dstr + "T12:00:00")
            return d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" })
        } catch {
            return dstr
        }
    }
    const active = data.active || []
    const days = data.days || []
    const byAct = data.by_activity || []
    const maxCnt = Math.max(1, ...byAct.map((b) => b.count || 0))
    const sectionLabel: React.CSSProperties = {
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: hx(AC, 0.75),
        margin: "0 0 10px",
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* Resumen */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                <RStat label="Fotones" value={Number(data.total_fotones || 0).toLocaleString("es-MX")} accent={R_GOLD} />
                <RStat label="Racha" value={`${data.streak || 0} d`} accent="#FF8A5B" />
                <RStat label="Días activos" value={`${data.days_active || 0}`} accent="#00E5FF" />
                <RStat label="Activos" value={`${active.length}`} accent="#8BE9C0" />
            </div>

            {/* Rituales activos ahora */}
            <div>
                <p style={sectionLabel}>Activos ahora</p>
                {active.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {active.map((a) => (
                            <span
                                key={a.activity_key}
                                style={{
                                    fontSize: 12.5,
                                    color: "#eaf2ff",
                                    background: hx(R_GOLD, 0.08),
                                    border: `1px solid ${hx(R_GOLD, 0.28)}`,
                                    borderRadius: 999,
                                    padding: "5px 12px",
                                }}
                            >
                                {a.label}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>
                        Sin rituales activos.
                    </p>
                )}
            </div>

            {/* Últimos 7 días */}
            <div>
                <p style={sectionLabel}>Últimos 7 días</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {days.map((d, i) => (
                        <motion.div
                            key={d.date}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                padding: "10px 12px",
                                borderRadius: 10,
                                background:
                                    d.items.length > 0 ? "rgba(245,198,107,0.05)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${
                                    d.items.length > 0 ? hx(R_GOLD, 0.18) : "rgba(255,255,255,0.06)"
                                }`,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11.5,
                                    color: "rgba(255,255,255,0.65)",
                                    minWidth: 92,
                                    textTransform: "capitalize",
                                    paddingTop: 3,
                                }}
                            >
                                {fmtDay(d.date)}
                            </span>
                            <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {d.items.length > 0 ? (
                                    d.items.map((it) => (
                                        <span
                                            key={it.activity_key}
                                            style={{
                                                fontSize: 12,
                                                color: "#eaf2ff",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: 7,
                                                padding: "3px 9px",
                                            }}
                                        >
                                            {it.label}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", paddingTop: 3 }}>
                                        —
                                    </span>
                                )}
                            </div>
                            {d.fotones > 0 && (
                                <span style={{ fontSize: 11.5, fontWeight: 600, color: R_GOLD, paddingTop: 3 }}>
                                    +{d.fotones}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Uso por ritual (30 días) */}
            <div>
                <p style={sectionLabel}>Uso por ritual · últimos 30 días</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {byAct.map((b, i) => (
                        <div key={b.activity_key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 12.5, color: "#eaf2ff", minWidth: 110 }}>{b.label}</span>
                            <div
                                style={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.06)",
                                    overflow: "hidden",
                                }}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.round(((b.count || 0) / maxCnt) * 100)}%` }}
                                    transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                    style={{
                                        height: "100%",
                                        borderRadius: 999,
                                        background: `linear-gradient(90deg, ${hx(R_GOLD, 0.5)}, ${R_GOLD})`,
                                    }}
                                />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", minWidth: 38, textAlign: "right" }}>
                                {b.count || 0}×
                            </span>
                        </div>
                    ))}
                    {byAct.length === 0 && (
                        <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>
                            Sin actividad en el periodo.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

function NaveganteProgressCard({
    data,
}: {
    data: {
        tutorial_completed: boolean
        membranas_completed: number
        last_completed_id: number | null
        last_updated: string | null
        has_chord: boolean
    }
}) {
    const ACCENT_NAV = "#A78BFA"
    const fmtDate = (iso: string | null) => {
        if (!iso) return ""
        try {
            const d = new Date(iso)
            return d.toLocaleString("es-MX", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return ""
        }
    }
    const hasAnyActivity =
        data.tutorial_completed || data.membranas_completed > 0
    return (
        <div
            className="mi-trip-deco"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "16px 20px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                    }}
                >
                    ⬡ Navegantes de la Red
                </span>
                <span
                    style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: hasAnyActivity
                            ? ACCENT_NAV
                            : "rgba(255,255,255,0.3)",
                        textShadow: hasAnyActivity
                            ? `0 0 8px ${ACCENT_NAV}77`
                            : "none",
                    }}
                >
                    {hasAnyActivity ? "Tripulante activo" : "Sin actividad"}
                </span>
            </div>

            {/* v1.3 — Layout compacto: dos columnas iguales con la
                Tutorial a la izquierda y un card "Membranas" extendido
                a la derecha que aloja el contador + el timestamp de la
                última conquista alineado a su derecha. Se eliminó la
                fila inferior "Última conquista — Membrana X ✦ Acorde"
                — Zak pidió ganar altura para que el panel no se salga
                de la pantalla. */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                }}
            >
                <NavStat
                    label="Tutorial"
                    value={data.tutorial_completed ? "Cumplido" : "Pendiente"}
                    accent={
                        data.tutorial_completed
                            ? ACCENT_NAV
                            : "rgba(255,255,255,0.45)"
                    }
                />
                <NavStat
                    label="Membranas"
                    value={`${data.membranas_completed} / 20`}
                    accent={
                        data.membranas_completed > 0
                            ? ACCENT_NAV
                            : "rgba(255,255,255,0.45)"
                    }
                    sideHint={
                        data.last_updated
                            ? fmtDate(data.last_updated)
                            : null
                    }
                />
            </div>
        </div>
    )
}

function NavStat({
    label,
    value,
    accent,
    sideHint = null,
}: {
    label: string
    value: string
    accent: string
    /* v1.3 — Texto opcional anclado a la derecha del value, mismo
       baseline. Se usa en el card de Membranas para anidar el
       timestamp de la última conquista sin abrir una fila aparte. */
    sideHint?: string | null
}) {
    return (
        <div
            style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            <div
                style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 4,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 8,
                }}
            >
                <span
                    style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: accent,
                        textShadow: `0 0 8px ${accent}55`,
                    }}
                >
                    {value}
                </span>
                {sideHint && (
                    <span
                        style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {sideHint}
                    </span>
                )}
            </div>
        </div>
    )
}

TripulanteDetail.displayName = "MI_Detail"
export default TripulanteDetail
