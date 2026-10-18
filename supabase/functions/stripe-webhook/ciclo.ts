// stripe-webhook/ciclo.ts v1.0 — 🜂 ¿ES EL CICLO SEMANAL DE SINTONÍA? (stripe-webhook v2.6, 2026-10-18)
//
// Los Cristales de Extracción viven solo en el ciclo MENSUAL (decisión del
// 2026-08-02, ya cumplida en revenuecat-webhook con `esCicloSemanal`). En la web
// el precio semanal de 149 cuelga del MISMO producto que el mensual
// (prod_UOf1RrEypuWFTg, confirmado en el catálogo de Stripe el 2026-10-18), así
// que el producto no basta para distinguirlos: lo que los separa es el intervalo
// del precio. Aquí se decide, en este orden:
//   1. lo que la suscripción tiene HOY (sus items): es lo que la persona paga;
//      en un cambio de semanal a mensual la factura trae una línea de crédito
//      del semanal, y la suscripción ya dice mensual;
//   2. las líneas con cobro positivo de la factura;
//   3. el largo del periodo facturado (10 días o menos = semanal).
// Archivo aparte para poder probarlo sin levantar el servidor del webhook.

/** Intervalo de un item de suscripción o de una línea de factura, si lo trae. */
export function intervaloDeItem(it: any): string | null {
    const iv = it?.price?.recurring?.interval ?? it?.plan?.interval ?? null
    return typeof iv === "string" && iv ? iv : null
}

/** true/false si la suscripción lo dice; null si no trae intervalos. */
export function esSemanalPorSuscripcion(sub: any): boolean | null {
    const ivs = (sub?.items?.data || [])
        .map(intervaloDeItem)
        .filter((iv: string | null): iv is string => !!iv)
    if (!ivs.length) return null
    return ivs.every((iv: string) => iv === "week")
}

/** true/false si la factura lo dice; null si no se puede saber. */
export function esSemanalPorFactura(invoice: any): boolean | null {
    const lineas = (invoice?.lines?.data || []) as any[]
    const cobradas = lineas.filter((l) => Number(l?.amount ?? 0) > 0)
    const ivs = (cobradas.length ? cobradas : lineas)
        .map(intervaloDeItem)
        .filter((iv: string | null): iv is string => !!iv)
    if (ivs.length) return ivs.every((iv: string) => iv === "week")
    const p = (cobradas[0] || lineas[0])?.period
    if (p?.start && p?.end) return Number(p.end) - Number(p.start) <= 10 * 86400
    return null
}

/** Decide si una factura pagada es del ciclo semanal. Nunca lanza. */
export async function esCicloSemanal(
    invoice: any,
    subscriptionId: string | null,
    recuperarSuscripcion: (id: string) => Promise<any>
): Promise<boolean> {
    if (subscriptionId) {
        try {
            const porSub = esSemanalPorSuscripcion(await recuperarSuscripcion(subscriptionId))
            if (porSub !== null) return porSub
        } catch (e) {
            console.log("⚠️ [ciclo] no se pudo leer la suscripción:", (e as Error)?.message)
        }
    }
    return esSemanalPorFactura(invoice) === true
}
