// Red Solar Viva — useSolarBooking.tsx v1.0
// Hook de reservas atómicas. Habla con:
//   · Supabase RPCs `get_available_slots` (lectura).
//   · Edge Function `procesar-ignicion-pago` (creación de hold + Stripe checkout).
//
// Por qué no consume RPCs de hold/confirm directo desde el cliente:
//   · `create_booking_hold` necesita ser atomic con la creación del Stripe
//     Checkout Session — si lo hace el cliente y la red falla entre el hold
//     y el checkout, el slot queda bloqueado 15 min sin pago. La edge function
//     centraliza el "todo o nada".
//
// Default-exported como Code Component vacío para que Framer lo pueda
// importar como módulo y aún así inyectarlo si se quiere un visualizador.
// Las funciones reales son named exports — usadas por componentes que
// importan vía `import { useSolarBooking } from "./useSolarBooking.tsx"`.

import * as React from "react"

export type SlotType =
    | "grupal_pulsar"
    | "grupal_cuasar"
    | "individual_30"
    | "individual_45"
    | "individual_60"

export interface Slot {
    id: string
    slot_type: SlotType
    start_time: string // ISO UTC
    end_time: string
    capacity: number
    confirmed_count: number
    held_count: number
    available: number
}

export interface BookingResult {
    checkout_url: string
    reserva_id: string
    session_id: string
    expires_at_utc: string
}

interface BookingConfig {
    supabaseUrl: string
    supabaseAnonKey: string
    /* URL de la edge function `procesar-ignicion-pago` desplegada */
    procesarIgnicionPagoUrl: string
}

/* ═════════════ Helpers REST ═════════════ */

async function sbRpc<T>(
    cfg: BookingConfig,
    fn: string,
    params: Record<string, any>
): Promise<T | null> {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null
    try {
        const r = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: cfg.supabaseAnonKey,
                Authorization: `Bearer ${cfg.supabaseAnonKey}`,
            },
            body: JSON.stringify(params),
        })
        if (!r.ok) {
            console.error(
                `[useSolarBooking] RPC ${fn} failed:`,
                r.status,
                await r.text().catch(() => "")
            )
            return null
        }
        return (await r.json()) as T
    } catch (e) {
        console.error(`[useSolarBooking] RPC ${fn} threw:`, e)
        return null
    }
}

/* ═════════════ Hook principal ═════════════ */

export function useSolarBooking(cfg: BookingConfig) {
    /* Cache de slots por slot_type. Re-fetch al cambiar slot_type o config. */
    const [slotsByType, setSlotsByType] = React.useState<
        Partial<Record<SlotType, Slot[]>>
    >({})
    const [loadingType, setLoadingType] = React.useState<SlotType | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const loadSlots = React.useCallback(
        async (slotType: SlotType, fromIso?: string, toIso?: string) => {
            setLoadingType(slotType)
            setError(null)
            const data = await sbRpc<Slot[]>(cfg, "get_available_slots", {
                p_slot_type: slotType,
                ...(fromIso ? { p_from: fromIso } : {}),
                ...(toIso ? { p_to: toIso } : {}),
            })
            setLoadingType(null)
            if (data === null) {
                setError("No se pudieron cargar los slots")
                return [] as Slot[]
            }
            setSlotsByType((prev) => ({ ...prev, [slotType]: data }))
            return data
        },
        [cfg.supabaseUrl, cfg.supabaseAnonKey]
    )

    const startBooking = React.useCallback(
        async (input: {
            slot_id: string
            slot_type: SlotType
            name: string
            email: string
            clerk_user_id?: string | null
            success_url: string
            cancel_url: string
        }): Promise<BookingResult | { error: string }> => {
            if (!cfg.procesarIgnicionPagoUrl) {
                return { error: "Edge function URL no configurada" }
            }
            try {
                const r = await fetch(cfg.procesarIgnicionPagoUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                })
                const payload = await r.json().catch(() => ({}))
                if (!r.ok) {
                    return { error: payload?.error || `HTTP ${r.status}` }
                }
                return payload as BookingResult
            } catch (e: any) {
                return { error: e?.message || "Error de red" }
            }
        },
        [cfg.procesarIgnicionPagoUrl]
    )

    /* Lista las reservas confirmadas de un email. Usado en Mi Núcleo
       para que el tripulante vea sus sesiones agendadas. */
    const myConfirmedBookings = React.useCallback(
        async (email: string) => {
            if (!email || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return []
            try {
                const r = await fetch(
                    `${cfg.supabaseUrl}/rest/v1/reservas?email=eq.${encodeURIComponent(
                        email.toLowerCase().trim()
                    )}&status=eq.confirmada&select=id,asiento_id,name,email,confirmed_at,amount_mxn_cents,asientos_reservados(slot_type,start_time,end_time)&order=confirmed_at.desc`,
                    {
                        headers: {
                            apikey: cfg.supabaseAnonKey,
                            Authorization: `Bearer ${cfg.supabaseAnonKey}`,
                        },
                    }
                )
                if (!r.ok) return []
                return await r.json()
            } catch {
                return []
            }
        },
        [cfg.supabaseUrl, cfg.supabaseAnonKey]
    )

    return {
        slotsByType,
        loadingType,
        error,
        loadSlots,
        startBooking,
        myConfirmedBookings,
    }
}

/* ═════════════ Componente vacío (requisito Framer) ═════════════ */

export default function UseSolarBooking() {
    return null
}
