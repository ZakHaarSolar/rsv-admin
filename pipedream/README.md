# Pipedream Workflows — Red Solar Viva

Copia local (espejo) de cada workflow de Pipedream. Sirve para versionar
cambios, consultar offline y que Claude pueda afinarlos sin que Diego
tenga que pegar el código cada vez (cero tokens gastados en transcripción).

**Este folder no se sincroniza automáticamente con Pipedream.** Cuando cambies
un workflow en la UI de Pipedream, pegá el código actualizado aquí y commiteá
(si `admin/` está bajo git).

---

## Workflows actuales

| Archivo | Trigger | Propósito |
|---|---|---|
| [`PaseExploracion.js`](./PaseExploracion.js) | Calendly `invitee.created` **+** HTTP webhook | **Reserva de Pase de Exploración (dual trigger).** Calendly: inserta en `exploration_passes` + envía email de bienvenida. HTTP: el UI del Motor de Intervención dispara este path cuando Diego registra una reserva off-platform — sólo envía email (el insert ya lo hizo el UI via RPC `admin_create_exploration_pass`). |
| [`Compras.js`](./Compras.js) | Stripe `checkout.session.completed` / `invoice.paid` | **Pipeline de compras.** Detecta si la compra es membresía (Inmersión Solar Púlsar/Cuásar), códice individual, o promo. Guarda en Supabase (`subscriptions` / `purchases`) y envía email de bienvenida estilizado según el producto. |
| [`CodigoCancelacion.js`](./CodigoCancelacion.js) | Stripe `customer.subscription.deleted` | **Cancelación de membresía.** Detecta cuando un tripulante cancela y ejecuta el flujo de salida (probablemente: limpia subscription en Supabase, envía email de despedida / reactivación). |
| [`Ignicion.js`](./Ignicion.js) | Cron (~60 min antes de cada sesión, Púlsar 12:30pm / Cuásar 4:30pm, zona Cancún) | **Ignición absoluta — recordatorio 60 min antes.** Consulta `subscriptions` activas del grupo del día (Púlsar o Cuásar según hora) y envía el email de "compuertas abriendo" con el link del reactor Zoom. |
| [`SelloDeIntegracion.js`](./SelloDeIntegracion.js) | Cron (3:33 PM Púlsar / 6:33 PM Cuásar, zona Cancún, ~1h post-sesión) | **Sello de Integración post-sesión.** Consulta los tripulantes que asistieron y les envía el PDF de sello + resumen de la transmisión. |

Todos comparten:
- **SMTP:** ProtonMail (`PROTON_SMTP_*` en env de Pipedream).
- **Secretos:** `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Estilo email:** fondo espacial #050505, acentos cyan #00E5FF + gold #FFD700, logo en Google Drive, texto en español ritualizado.

---

## Migración actual · Dual-trigger de `PaseExploracion.js`

`PaseExploracion.js` ya está en producción con los dos triggers. El UI de
Telemetría del Núcleo (Motor de Intervención) dispara el HTTP trigger cuando
Diego registra manualmente un pase — la URL del webhook se configura en Framer
como propiedad `explorationEmailWebhookUrl` del componente Telemetría.

Detección de fuente en el código:
- `body.event === "invitee.created"` → Calendly (extrae del payload, inserta en DB, envía email).
- `body.source === "manual"` → UI (el insert ya lo hizo el RPC, sólo envía email).
- Cualquier otro payload: `$.flow.exit()`.

---

## Agregar un nuevo workflow

1. Crear workflow en Pipedream (trigger + código).
2. Copiar el código a este folder con nombre descriptivo (ej. `NuevoWorkflow.js`).
3. Actualizar la tabla de arriba con una línea describiendo: archivo, trigger, propósito.
4. Commitear si `admin/` está bajo git.

---

## SQL vinculado

Los workflows consumen tablas/RPCs de Supabase. Las migraciones relevantes
viven en `admin/supabase/migrations/`:

- `20260417_ensure_profile_rpc.sql` — `ensure_profile` (usado al crear profile de tripulante nuevo).
- `20260421_admin_create_exploration_pass.sql` — `admin_create_exploration_pass` (usado por el UI para insertar un pase manual bypasseando RLS).
