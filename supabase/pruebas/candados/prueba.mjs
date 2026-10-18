// Prueba a fondo 20261018e_candados_y_limpieza con datos inventados (nada de producción).
// Parte de las funciones de producción tal como estaban (produccion-antes.sql), mide lo que
// hacían, pega la migración dos veces y revisa cada candado, freno, limpieza y borrado.
import { PGlite } from "@electric-sql/pglite"
import { readFileSync } from "node:fs"

const MIGRACION = process.argv[2]
let fallas = 0
const ok = (c, m) => { if (!c) { fallas++; console.log("✗", m) } else console.log("✓", m) }
const nueva = async () => {
    const db = new PGlite()
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;`)
    await db.exec(readFileSync(new URL("./produccion-antes.sql", import.meta.url), "utf8"))
    return db
}
const db = await nueva()
const avisos = []
const q = async (sql, p) => { try { return (await db.query(sql, p, { onNotice: (n) => avisos.push(n.message) })).rows } catch (e) { console.log("SQL FALLA:", String(e.message).slice(0, 300), "|", String(e.where || "").slice(0, 200)); throw e } }
const ex = async (sql) => { try { return await db.exec(sql, { onNotice: (n) => avisos.push(n.message) }) } catch (e) { console.log("SQL FALLA:", String(e.message).slice(0, 300), "|", String(e.where || "").slice(0, 200)); throw e } }
const n = async (sql) => (await q(`select (${sql})::int as n`))[0].n
const uuid = () => crypto.randomUUID()

// Una persona con rastro en todas las tablas que el borrado tocaba o debía tocar.
const sembrar = async (u, correo) => {
    const tk = uuid()
    await ex(`
INSERT INTO profiles (clerk_user_id, email, full_name) VALUES ('${u}', '${correo}', 'Nombre ${u}');
INSERT INTO muro_eventos (clerk_user_id, apertura, muro, evento) VALUES ('${u}', '${uuid()}', 'espejo', 'visto');
INSERT INTO chat_mensajes_ocultos VALUES ('${u}', 'dm', 7, now());
INSERT INTO ciclo_parcial_notified VALUES ('${u}', now(), 1, now());
INSERT INTO espejo_afinamiento (clerk_user_id, prompt, reflejo) VALUES ('${u}', 'algo íntimo', 'su reflejo');
INSERT INTO oraculo_borrados (clerk_user_id, conversaciones, mensajes) VALUES ('${u}', 1, 4);
INSERT INTO dictado_records (clerk_user_id, ppm, palabras, segundos) VALUES ('${u}', 140, 70, 30);
INSERT INTO ia_pase_imagen VALUES ('${u}', current_date, 2, now());
INSERT INTO support_tickets (id, clerk_user_id, email, message) VALUES ('${tk}', '${u}', '${correo}', 'no me deja pagar');
INSERT INTO support_messages (ticket_id, autor, body) VALUES ('${tk}', 'casa', 'Hola, ya quedó');
INSERT INTO support_actions (ticket_id, admin_clerk_id, action, detalle) VALUES ('${tk}', 'user_admin', 'responder', '{"preview":"Hola, ya quedó"}');
INSERT INTO onb_funnel (anon_id, max_step, platform, answers, clerk_user_id) VALUES ('${uuid()}', 14, 'ios', '{"origin":"espejo"}', '${u}');
INSERT INTO edge_spend_ledger (user_key, ip_key, edge, cost_units) VALUES ('${u}', 'ip-${u}', 'oraculo', 1), ('${u}', 'ip-${u}', 'decode-matter', 1);
INSERT INTO community_blocks VALUES ('${u}', 'user_otro', now()), ('user_otro2', '${u}', now());
INSERT INTO android_waitlist (email) VALUES (upper('${correo}'));
INSERT INTO payments_log (email, stripe_invoice_id, payment_type, amount_cents) VALUES ('${correo}', 'in_${u}', 'subscription', 49900);
INSERT INTO scan_vibracional (clerk_user_id) VALUES ('${u}');
INSERT INTO tele_dias VALUES ('${u}', current_date, 1); INSERT INTO tele_uso VALUES ('${u}', current_date, 'espejo');
INSERT INTO tele_personas VALUES ('${u}'); INSERT INTO tele_aparatos VALUES ('${uuid()}', '${u}');
INSERT INTO suscripcion_eventos VALUES ('RENEWAL', '${u}', 'ev-${u}');
`)
}
const rastro = async (u, correo) => ({
    muro: await n(`select count(*) from muro_eventos where clerk_user_id='${u}'`),
    ocultos: await n(`select count(*) from chat_mensajes_ocultos where clerk_user_id='${u}'`),
    ciclo: await n(`select count(*) from ciclo_parcial_notified where clerk_user_id='${u}'`),
    afinamiento: await n(`select count(*) from espejo_afinamiento where clerk_user_id='${u}'`),
    huella: await n(`select count(*) from oraculo_borrados where clerk_user_id='${u}'`),
    dictado: await n(`select count(*) from dictado_records where clerk_user_id='${u}'`),
    pase: await n(`select count(*) from ia_pase_imagen where clerk_user_id='${u}'`),
    soporte: await n(`select count(*) from support_tickets where clerk_user_id='${u}'`),
    soporte_msj: await n(`select count(*) from support_messages m join support_tickets t on t.id=m.ticket_id where t.clerk_user_id='${u}'`),
    soporte_acc: await n(`select count(*) from support_actions where detalle->>'preview' is not null and (ticket_id is null or ticket_id in (select id from support_tickets where clerk_user_id='${u}'))`),
    bienvenida_ligada: await n(`select count(*) from onb_funnel where clerk_user_id='${u}'`),
    gasto_con_dueno: await n(`select count(*) from edge_spend_ledger where user_key='${u}' or ip_key='ip-${u}'`),
    bloqueos: await n(`select count(*) from community_blocks where '${u}' in (blocker_clerk_id, blocked_clerk_id)`),
    lista_android: await n(`select count(*) from android_waitlist where lower(email)=lower('${correo}')`),
    tele: await n(`select (select count(*) from tele_dias where persona='${u}') + (select count(*) from tele_personas where persona='${u}')`),
})

// ── A) Producción tal como está ──
await sembrar("user_viejo", "viejo@prueba.mx")
await q(`select public.purge_my_account_data('user_viejo')`)
const quedaViejo = await rastro("user_viejo", "viejo@prueba.mx")
console.log("antes, tras borrar la cuenta quedaba:", JSON.stringify(quedaViejo))
ok(quedaViejo.muro + quedaViejo.soporte + quedaViejo.bienvenida_ligada + quedaViejo.gasto_con_dueno > 0, "la versión de producción deja el muro, el soporte, la bienvenida y el gasto")
for (let i = 0; i < 100; i++) await q(`select public.record_onb_step($1::uuid, 1, 'ios', null)`, [uuid()])
const onbViejo = await n(`select count(*) from onb_funnel where clerk_user_id is null`)
ok(onbViejo === 100, `antes, 100 ids inventados en un minuto = ${onbViejo} instalaciones`)
for (let i = 0; i < 200; i++) await q(`select public.record_muro_evento_anon($1::uuid, 'espejo', 'visto', null, null, false, 'web', null, null, $2::uuid)`, [uuid(), uuid()])
const muroViejo = await n(`select count(*) from muro_eventos where clerk_user_id is null`)
ok(muroViejo === 200, `antes, 200 eventos sin sesión con ids inventados = ${muroViejo} filas`)
ok((await q(`select has_function_privilege('anon', 'public.get_ia_gasto_por_nodo(text)', 'EXECUTE') x`))[0].x === true, "antes, la llave pública podía leer el gasto de IA por persona")
await ex(`DELETE FROM onb_funnel WHERE clerk_user_id IS NULL; DELETE FROM muro_eventos WHERE clerk_user_id IS NULL;`)

// ── B) La migración, dos veces ──
await ex(readFileSync(MIGRACION, "utf8"))
await ex(readFileSync(MIGRACION, "utf8"))
ok(true, "la migración corre dos veces sin error")

// (1) Candados
const admins = ["get_ia_gasto_por_nodo(text)", "admin_get_image_pass(text)", "admin_grant_image_pass(text,integer)", "get_admin_stats(text)",
    "get_atelier_drafts_dashboard(text)", "group_suno_creations_into_album(text,uuid[],text)", "set_vtli_draft_cover(text,uuid,text)",
    "set_vtli_keyframe_video(text,uuid,text,text)", "update_vtli_draft_status(text,uuid,text)"]
for (const f of admins) {
    const r = (await q(`select has_function_privilege('anon', 'public.${f}', 'EXECUTE') a, has_function_privilege('authenticated', 'public.${f}', 'EXECUTE') b, has_function_privilege('service_role', 'public.${f}', 'EXECUTE') c`))[0]
    ok(!r.a && !r.b && r.c, `${f.split("(")[0]}: solo el servidor`)
}
ok((await q(`select has_function_privilege('anon', 'public.is_admin_caller(text)', 'EXECUTE') x`))[0].x === true, "is_admin_caller sigue abierta (la llama la app de las tiendas)")
await ex(`INSERT INTO profiles (clerk_user_id, email, full_name, is_admin) VALUES ('user_admin', 'zak@casa.mx', 'Zak', true);`)
let negado = null
try { await db.exec(`SET ROLE anon; SELECT public.get_ia_gasto_por_nodo('user_admin');`) } catch (e) { negado = e.message } finally { await ex(`RESET ROLE`) }
ok(negado && /permission denied/.test(negado), "con la llave pública y el id del admin, la base niega el gasto por persona")
const servidor = (await q(`select public.get_ia_gasto_por_nodo('user_admin') x`))[0].x
ok(Array.isArray(servidor.nodos), "el servidor (admin-action) lo sigue leyendo")

// (2) Frenos sin sesión
await ex(`SET ROLE anon`)
const ids = Array.from({ length: 40 }, uuid)
for (const id of ids) await q(`select public.record_onb_step($1::uuid, 1, 'ios', null)`, [id])
await ex(`RESET ROLE`)
ok(await n(`select count(*) from onb_funnel where started_at > now() - interval '1 minute'`) === 30, "bienvenida: 40 instalaciones nuevas en un minuto, entran 30 (cuenta también la de la persona sembrada antes)")
await q(`select public.record_onb_step($1::uuid, 5, 'ios', '{"origin":"food"}'::jsonb)`, [ids[0]])
let fila = (await q(`select max_step, answers from onb_funnel where anon_id=$1`, [ids[0]]))[0]
ok(fila.max_step === 5 && fila.answers.origin === "food", "con el freno puesto, una instalación que ya empezó sigue avanzando")
await ex(`UPDATE onb_funnel SET started_at = now() - interval '10 minutes'`)
await q(`select public.record_onb_step($1::uuid, 1, 'android', null)`, [uuid()])
ok(await n(`select count(*) from onb_funnel where started_at > now() - interval '1 minute'`) === 1, "pasado el minuto, entra la siguiente")
await ex(`INSERT INTO onb_funnel (anon_id, max_step, started_at) SELECT gen_random_uuid(), 1, now() - interval '30 minutes' FROM generate_series(1, 270)`)
const antesHora = await n(`select count(*) from onb_funnel`)
await ex(`UPDATE onb_funnel SET started_at = now() - interval '5 minutes' WHERE started_at > now() - interval '1 minute'`)
await q(`select public.record_onb_step($1::uuid, 1, 'ios', null)`, [uuid()])
ok(await n(`select count(*) from onb_funnel`) === antesHora, `bienvenida: con ${antesHora} en la última hora (tope 300), la nueva no entra`)
await ex(`UPDATE onb_funnel SET started_at = now() - interval '2 hours'`)
const grande = { origin: "x".repeat(2100) }
const nuevaId = uuid()
await q(`select public.record_onb_step($1::uuid, 1, 'ios', $2::jsonb)`, [nuevaId, JSON.stringify(grande)])
fila = (await q(`select answers from onb_funnel where anon_id=$1`, [nuevaId]))[0]
ok(fila && Object.keys(fila.answers).length === 0, "respuestas de más de 2,000 caracteres no entran (la fila sí)")
await q(`select public.record_onb_step($1::uuid, 2, 'ios', '[1,2]'::jsonb)`, [nuevaId])
for (let i = 0; i < 40; i++) await q(`select public.record_onb_step($1::uuid, 2, 'ios', $2::jsonb)`, [nuevaId, JSON.stringify({ ["k" + i]: "y".repeat(150) })])
fila = (await q(`select length(answers::text) l from onb_funnel where anon_id=$1`, [nuevaId]))[0]
ok(fila.l <= 4000, `una instalación no junta respuestas sin fin (${fila.l} caracteres, tope 4,000)`)
const normal = uuid()
for (const [paso, r] of [[1, { origin: "espejo" }], [2, { q1: "a" }], [13, null], [14, { modo: "expres" }]])
    await q(`select public.record_onb_step($1::uuid, $2, 'android', $3::jsonb)`, [normal, paso, r ? JSON.stringify(r) : null])
fila = (await q(`select max_step, completed, answers, platform from onb_funnel where anon_id=$1`, [normal]))[0]
ok(fila.max_step === 14 && fila.completed === true && fila.answers.origin === "espejo" && fila.answers.modo === "expres" && fila.platform === "android",
    "el recorrido normal queda igual que antes (pasos, paywall, respuestas)")

await ex(`DELETE FROM muro_eventos`)
await ex(`SET ROLE anon`)
for (let i = 0; i < 130; i++) await q(`select public.record_muro_evento_anon($1::uuid, 'espejo', 'visto', null, null, false, 'web', null, null, $2::uuid)`, [uuid(), uuid()])
await ex(`RESET ROLE`)
ok(await n(`select count(*) from muro_eventos where clerk_user_id is null`) === 120, "muro sin sesión: 130 eventos con ids inventados en un minuto, entran 120")
await q(`select public.record_muro_evento('user_con_cuenta', $1::uuid, 'espejo', 'visto')`, [uuid()])
ok(await n(`select count(*) from muro_eventos where clerk_user_id = 'user_con_cuenta'`) === 1, "con sesión (user-action) no le afecta el freno de los anónimos")
await ex(`UPDATE muro_eventos SET created_at = now() - interval '20 minutes'`)
const ap = uuid()
await q(`select public.record_muro_evento_anon($1::uuid, 'espejo', 'plan', 'monthly', null, false, 'ios', '1.1.7', '{"idioma":"es"}'::jsonb, $2::uuid)`, [ap, uuid()])
fila = (await q(`select plan, plataforma, version, detalle from muro_eventos where apertura=$1`, [ap]))[0]
ok(fila && fila.plan === "monthly" && fila.plataforma === "ios" && fila.detalle.idioma === "es", "pasado el minuto, un evento normal entra completo")
await ex(`INSERT INTO muro_eventos (created_at, apertura, muro, evento) SELECT now() - interval '40 minutes', gen_random_uuid(), 'espejo', 'visto' FROM generate_series(1, 1400)`)
const antesMuro = await n(`select count(*) from muro_eventos`)
await q(`select public.record_muro_evento_anon($1::uuid, 'espejo', 'visto', null, null, false, 'web', null, null, $2::uuid)`, [uuid(), uuid()])
ok(await n(`select count(*) from muro_eventos`) === antesMuro, "muro sin sesión: con 1,500 en la hora, el siguiente no entra")
ok((await q(`select has_function_privilege('anon', 'public.record_muro_evento_anon(uuid,text,text,text,text,boolean,text,text,jsonb,uuid)', 'EXECUTE') a, has_function_privilege('anon', 'public.record_onb_step(uuid,integer,text,jsonb)', 'EXECUTE') b`))[0].a === true, "las dos siguen abiertas a la app sin sesión")
await ex(`DELETE FROM muro_eventos; DELETE FROM onb_funnel;`)

// (3) Limpieza diaria
await ex(`
INSERT INTO edge_spend_ledger (user_key, edge, created_at) VALUES
 ('user_a', 'oraculo', now() - interval '401 days'), ('user_a', 'oraculo', now() - interval '399 days'),
 ('user_a', 'espejo-imagen-rafaga-gratis', now() - interval '900 days'), ('user_a', 'espejo-imagen-gratis', now() - interval '500 days');
INSERT INTO wallpaper_downloads (clerk_user_id, created_at) VALUES ('user_a', now() - interval '401 days'), ('user_a', now() - interval '399 days');
INSERT INTO email_dispatches (clerk_user_id, email_type, status, created_at) VALUES ('user_a', 'bienvenida', 'sent', now() - interval '401 days'), ('user_a', 'bienvenida', 'sent', now() - interval '399 days');
INSERT INTO app_feedback (clerk_user_id, message, created_at) VALUES ('user_a', 'viejo', now() - interval '731 days'), ('user_a', 'nuevo', now() - interval '729 days');
INSERT INTO oraculo_borrados (clerk_user_id, conversaciones, mensajes, borrado_at) VALUES
 ('user_h', 1, 3, now() - interval '500 days'), ('user_h', 2, 5, now() - interval '450 days'), ('user_h', 1, 1, now() - interval '401 days'),
 ('user_h', 1, 2, now() - interval '10 days'), ('user_k', 1, 9, now() - interval '600 days');
INSERT INTO voz_frases_sin_resolver (texto, creado_en) VALUES ('vieja', now() - interval '91 days'), ('nueva', now() - interval '89 days');
INSERT INTO espejo_afinamiento (clerk_user_id, creado_en) VALUES ('user_a', now() - interval '181 days'), ('user_a', now() - interval '179 days');
INSERT INTO webhook_events (source, event_id, processed_at) VALUES ('stripe', 'evt_viejo', now() - interval '91 days'), ('stripe', 'evt_nuevo', now() - interval '89 days');
INSERT INTO cron.job_run_details (jobid, status, start_time, end_time) VALUES (1, 'succeeded', now() - interval '15 days', now() - interval '15 days'),
 (1, 'succeeded', now() - interval '13 days', now() - interval '13 days'), (1, 'failed', now() - interval '20 days', NULL);
`)
const sumasAntes = (await q(`select sum(conversaciones)::int c, sum(mensajes)::int m from oraculo_borrados where clerk_user_id='user_h'`))[0]
const res = (await q(`select public.rsv_retencion_diaria() x`))[0].x
console.log("limpieza:", JSON.stringify(res))
ok(await n(`select count(*) from edge_spend_ledger where user_key='user_a' and edge='oraculo'`) === 1, "registro de gasto: se va lo de más de 400 días, se queda lo de 399")
ok(await n(`select count(*) from edge_spend_ledger where edge like '%-gratis'`) === 2, "los regalos de por vida («-gratis») no se borran nunca")
ok(await n(`select count(*) from wallpaper_downloads`) === 1 && await n(`select count(*) from email_dispatches`) === 1, "descargas y correos: 400 días")
ok(await n(`select count(*) from app_feedback`) === 1, "comentarios: dos años")
const sumasDespues = (await q(`select sum(conversaciones)::int c, sum(mensajes)::int m, count(*)::int n from oraculo_borrados where clerk_user_id='user_h'`))[0]
ok(sumasDespues.n === 2 && sumasDespues.c === sumasAntes.c && sumasDespues.m === sumasAntes.m, `huella del Espejo: tres viejas se juntan en una y las sumas no cambian (${sumasDespues.c} conversaciones, ${sumasDespues.m} mensajes)`)
ok(await n(`select count(*) from oraculo_borrados where clerk_user_id='user_k'`) === 1, "una sola fila vieja se queda como está")
ok(await n(`select count(*) from voz_frases_sin_resolver`) === 1 && await n(`select count(*) from espejo_afinamiento where clerk_user_id='user_a'`) === 1 && await n(`select count(*) from webhook_events`) === 1,
    "las tres purgas que existían ya corren (90, 180 y 90 días)")
ok(await n(`select count(*) from cron.job_run_details`) === 1, "historial de pg_cron: dos semanas (también lo que nunca terminó)")
const idsAntes = (await q(`select array_agg(id order by id) a from oraculo_borrados`))[0].a.join(",")
const res2 = (await q(`select public.rsv_retencion_diaria() x`))[0].x
const idsDespues = (await q(`select array_agg(id order by id) a from oraculo_borrados`))[0].a.join(",")
ok(idsAntes === idsDespues && res2.oraculo_borrados_juntadas === 0, "correrla otra vez no mueve nada")
ok((await q(`select has_function_privilege('anon', 'public.rsv_retencion_diaria()', 'EXECUTE') a`))[0].a === false, "la limpieza no la puede llamar la llave pública")

// (4) Borrar la cuenta
await sembrar("user_nuevo", "nuevo@prueba.mx")
await sembrar("user_vecino", "vecino@prueba.mx")
const vecinoAntes = await rastro("user_vecino", "vecino@prueba.mx")
const borrado = (await q(`select public.purge_my_account_data('user_nuevo') x`))[0].x
const quedaNuevo = await rastro("user_nuevo", "nuevo@prueba.mx")
console.log("ahora, tras borrar la cuenta queda:", JSON.stringify(quedaNuevo))
ok(borrado.ok && Object.values(quedaNuevo).every((v) => v === 0), "ya no queda nada ligado a la persona")
ok(await n(`select count(*) from onb_funnel where clerk_user_id is null and answers->>'origin'='espejo'`) >= 1, "su bienvenida sigue contando como instalación, sin decir de quién")
ok(await n(`select count(*) from edge_spend_ledger where user_key is null and edge in ('oraculo','decode-matter')`) === 2, "su gasto de IA sigue en los totales, sin dueño")
ok(await n(`select count(*) from payments_log where email='nuevo@prueba.mx'`) === 1, "lo contable se queda (payments_log)")
ok(await n(`select count(*) from suscripcion_eventos where evento_id='ev-user_nuevo' and clerk_user_id is null`) === 1, "el bloque de la telemetría sigue igual (eventos de tienda sin cuenta)")
ok(JSON.stringify(await rastro("user_vecino", "vecino@prueba.mx")) === JSON.stringify(vecinoAntes), "lo de otra persona no se toca")
ok(!JSON.stringify(borrado.detail).includes('"err"'), `sin errores en el detalle: ${JSON.stringify(borrado.detail).slice(0, 400)}`)

// (5) Una fila por factura
ok(await n(`select count(*) from pg_indexes where indexname='payments_log_una_por_factura'`) === 1, "el índice de una fila por factura existe")
let repetida = null
try { await db.exec(`INSERT INTO payments_log (stripe_invoice_id, payment_type, amount_cents) VALUES ('in_user_vecino', 'subscription', 49900)`) } catch (e) { repetida = e.message }
ok(repetida && /duplicate key/.test(repetida), "la misma factura no entra dos veces")
await ex(`INSERT INTO payments_log (payment_type, amount_cents) VALUES ('book', 33300), ('book', 33300)`)
ok(true, "las filas sin factura (libros) siguen entrando")

// Con facturas ya repetidas, la migración avisa y no rompe.
const db2 = await nueva()
await db2.exec(`INSERT INTO payments_log (stripe_invoice_id, payment_type) VALUES ('in_x','subscription'), ('in_x','subscription')`)
const avisos2 = []
await db2.exec(readFileSync(MIGRACION, "utf8"), { onNotice: (m) => avisos2.push(m.message) })
ok(avisos2.some((a) => a.includes("facturas repetidas")) && (await db2.query(`select count(*)::int n from pg_indexes where indexname='payments_log_una_por_factura'`)).rows[0].n === 0,
    "si ya hubiera facturas repetidas, avisa y no crea el índice (no toca ninguna fila)")
await db2.close()

console.log(fallas ? `FALLAS: ${fallas}` : "TODO BIEN")
await db.close()
