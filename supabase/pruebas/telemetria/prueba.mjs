// Prueba a fondo la migración de telemetría con datos sintéticos (nada de producción).
import { PGlite } from "@electric-sql/pglite"
import { readFileSync, writeFileSync } from "node:fs"
const db = new PGlite()
let fallas = 0
const ok = (c, m) => { if (!c) { fallas++; console.log("✗", m) } else console.log("✓", m) }
const q = async (sql, p) => { try { return (await db.query(sql, p)).rows } catch (e) { console.log("SQL FALLA:", String(e.message).slice(0,300), "|", String(e.where||"").slice(0,200)); throw e } }
const ex = async (sql) => { try { return await db.exec(sql) } catch (e) { console.log("SQL FALLA:", String(e.message).slice(0,300), "|", String(e.where||"").slice(0,200)); throw e } }
await ex(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;`)
await ex(readFileSync(new URL("./tablas-de-prueba.sql", import.meta.url), "utf8"))
await ex(`CREATE OR REPLACE FUNCTION public._is_active_member(p_clerk_user_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE v_uid uuid; BEGIN IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN RETURN false; END IF;
 SELECT id INTO v_uid FROM profiles WHERE clerk_user_id = p_clerk_user_id LIMIT 1; IF v_uid IS NULL THEN RETURN false; END IF;
 RETURN EXISTS (SELECT 1 FROM subscriptions WHERE user_id = v_uid AND status IN ('active','trialing') AND group_name IN ('sintonia','cuasar','pulsar','inmersion')); END $f$;`)
// ── Datos sintéticos: 12 cuentas (2 de la casa) ──
const H = "now()"
await ex(`
INSERT INTO profiles (id, clerk_user_id, email, full_name, created_at, is_admin) VALUES
 (gen_random_uuid(),'user_admin','zak@casa.test','Zak',now()-interval '200 days',true),
 (gen_random_uuid(),'user_excl','excluida@casa.test','Prueba',now()-interval '150 days',false),
 (gen_random_uuid(),'user_a','a@x.test','Ana',now()-interval '75 days',false),
 (gen_random_uuid(),'user_b','b@x.test','Beto',now()-interval '60 days',false),
 (gen_random_uuid(),'user_c','c@x.test','Cami',now()-interval '45 days',false),
 (gen_random_uuid(),'user_d','d@x.test','Dani',now()-interval '40 days',false),
 (gen_random_uuid(),'user_e','e@x.test','Eli',now()-interval '20 days',false),
 (gen_random_uuid(),'user_f','f@x.test','Fer',now()-interval '15 days',false),
 (gen_random_uuid(),'user_g','g@x.test','Gabo',now()-interval '9 days',false),
 (gen_random_uuid(),'user_h','h@x.test','Hugo',now()-interval '5 days',false),
 (gen_random_uuid(),'user_i','i@x.test','Isa',now()-interval '3 days',false),
 (gen_random_uuid(),'user_j','j@x.test','Juan',now()-interval '1 days',false);
INSERT INTO revenue_exclusions (id, email, reason, created_at) VALUES (gen_random_uuid(),'excluida@casa.test','prueba',now());
INSERT INTO subscriptions (id, user_id, stripe_subscription_id, status, current_period_start, current_period_end, created_at, group_name)
 SELECT gen_random_uuid(), id, 'rc_semanal1', 'active', now()-interval '2 days', now()+interval '5 days', now()-interval '30 days', 'sintonia' FROM profiles WHERE clerk_user_id='user_b';
INSERT INTO subscriptions (id, user_id, stripe_subscription_id, status, current_period_start, current_period_end, created_at, group_name)
 SELECT gen_random_uuid(), id, 'rc_mensual1', 'active', now()-interval '3 days', now()+interval '27 days', now()-interval '3 days', 'sintonia' FROM profiles WHERE clerk_user_id='user_e';
INSERT INTO subscriptions (id, user_id, stripe_subscription_id, status, current_period_start, current_period_end, created_at, group_name)
 SELECT gen_random_uuid(), id, 'gift_x', 'active', now()-interval '3 days', now()+interval '27 days', now()-interval '3 days', 'sintonia' FROM profiles WHERE clerk_user_id='user_c';
-- Espejo, Decodificadores, voz y el costo real
INSERT INTO edge_spend_ledger (id, user_key, ip_key, edge, cost_units, created_at)
 SELECT gen_random_uuid(), u, 'ip1', e, c, now() - (d || ' days')::interval - (h || ' hours')::interval
 FROM (VALUES ('user_a','oraculo',1,70,1),('user_a','oraculo',1,69,2),('user_b','oraculo',1,59,1),('user_b','oraculo',1,30,1),
              ('user_b','oraculo',1,2,3),('user_e','oraculo',1,19,1),('user_e','oraculo',1,1,1),('user_e','espejo-voz',6,1,1),
              ('user_c','decode-matter',1,44,1),('user_f','decode-dream',1,14,1),('user_admin','oraculo',1,1,1),
              ('user_e','oraculo-dinero',2400,1,1),('user_e','oraculo-dia',1,1,1),('user_h','oraculo',1,4,2)) v(u,e,c,d,h);
INSERT INTO scan_vibracional (id, clerk_user_id, created_at, last_update_fisico, last_update_mental)
 VALUES (gen_random_uuid(),'user_d', now()-interval '39 days', now()-interval '39 days', now()-interval '39 days'),
        (gen_random_uuid(),'user_g', now()-interval '8 days', now()-interval '8 days', NULL);
INSERT INTO daily_checkins (clerk_user_id, activity_key, checkin_date, points, created_at)
 VALUES ('user_a','sol',(now()-interval '62 days')::date,1,now()-interval '62 days'),
        ('user_b','sol',(now()-interval '52 days')::date,1,now()-interval '52 days'),
        ('user_b','sol',(now()-interval '1 days')::date,1,now()-interval '1 days');
INSERT INTO nav_events (id, clerk_user_id, layer, sublayer, platform, created_at)
 VALUES (gen_random_uuid(),'user_i','radar',NULL,'ios',now()-interval '2 days'),
        (gen_random_uuid(),'user_i','decodificador','boveda-materia','ios',now()-interval '2 days');
INSERT INTO onb_funnel (anon_id, max_step, completed, platform, started_at, updated_at, answers)
 VALUES (gen_random_uuid(),14,false,'ios',now()-interval '3 days',now()-interval '3 days','{}'),
        (gen_random_uuid(),1,false,'android',now()-interval '2 days',now()-interval '2 days','{}');
INSERT INTO muro_eventos (created_at, clerk_user_id, dispositivo, apertura, muro, evento, plan, motivo, miembro, plataforma)
 VALUES (now()-interval '2 days','user_h',NULL,'00000000-0000-4000-8000-000000000001','espejo','visto',NULL,NULL,false,'ios'),
        (now()-interval '2 days','user_h',NULL,'00000000-0000-4000-8000-000000000001','espejo','cerrado',NULL,NULL,false,'ios'),
        (now()-interval '2 days','user_h',NULL,'00000000-0000-4000-8000-000000000001','espejo','motivo',NULL,'precio',false,'ios');
`)
await ex(readFileSync(process.argv[2], "utf8"))
console.log("migración cargada con datos")
// ── La historia reconstruida ──
let r = await q(`select count(*)::int n, count(*) filter (where reconstruido)::int rec from tele_dias`)
ok(r[0].n > 0 && r[0].n === r[0].rec, `días reconstruidos: ${r[0].n}`)
r = await q(`select persona, primer_valor, primer_valor_at is not null tiene from tele_personas where persona in ('user_a','user_c','user_d','user_f','user_i','user_j') order by 1`)
console.log(JSON.stringify(r))
ok(r.find(x=>x.persona==='user_a')?.primer_valor==='espejo:mensaje', "Ana: primer valor = Espejo")
ok(r.find(x=>x.persona==='user_c')?.primer_valor==='decodificador.materia:lectura', "Cami: primer valor = alimentos")
ok(r.find(x=>x.persona==='user_d')?.primer_valor==='radar:pilar', "Dani: primer valor = pilar")
ok(r.find(x=>x.persona==='user_f')?.primer_valor==='decodificador.suenos:lectura', "Fer: primer valor = sueños")
ok(r.find(x=>x.persona==='user_j')?.tiene===false, "Juan: sin valor todavía")
r = await q(`select funcion, sum(aperturas)::int ap from tele_uso where persona='user_i' group by 1 order by 1`)
ok(r.some(x=>x.funcion==='decodificador.boveda_materia' && x.ap===1), "la navegación de 7 días entra con la clave nueva (boveda_materia)")
// ── Un lote sin cuenta, luego con cuenta (se unen) ──
const hoy = (await q(`select public._tele_dia(now())::text d`))[0].d
const ayer = (await q(`select (public._tele_dia(now())-1)::text d`))[0].d
const ap = "11111111-1111-4111-8111-111111111111"
const loteAnon = { v:1, id:"22222222-2222-4222-8222-222222222222", plataforma:"ios", version:"1.1.7", idioma:"es", desde: Date.now()-86400000*2,
  dias: { [ayer]: { s:1, seg:120, f:{ "radar":[1,60], "espejo":[1,50] }, p:{"radar>espejo":1}, e:{"radar":1}, x:{"espejo":1}, xs:{"espejo":1},
                    err:{"js:radar:typeerror_cannot_read":1}, t:{"arranque:app":[1,1800,0,0,1,0,0,0,0]}, r:[["espejo","no_supe"]] } } }
r = await q(`select public.record_telemetria_anon($1::uuid, $2::jsonb) x`, [ap, JSON.stringify(loteAnon)])
ok(r[0].x.ok === true && r[0].x.dias === 1, "lote anónimo contado")
r = await q(`select public.record_telemetria_anon($1::uuid, $2::jsonb) x`, [ap, JSON.stringify(loteAnon)])
ok(r[0].x.duplicado === true, "el mismo lote otra vez no cuenta (duplicado)")
ok((await q(`select count(*)::int n from tele_dias where persona='a:${ap}'`))[0].n === 1, "persona sin cuenta con su día")
const loteCuenta = { v:1, id:"33333333-3333-4333-8333-333333333333", plataforma:"ios", version:"1.1.7", idioma:"es",
  dias: { [hoy]: { s:2, seg:300, f:{ "radar":[2,100], "radar.sonda":[1,90], "espejo":[1,110] }, p:{"radar>radar.sonda":1,"radar.sonda>radar":1}, e:{"radar":2},
                   t:{"espejo:respuesta":[2,9000,0,0,0,1,1,0,0], "porton:get_home_state":[3,1200,2,1,0,0,0,0,0]} },
          [ayer]: { s:1, seg:60, f:{ "nucleo":[1,60] } } } }
r = await q(`select public.record_telemetria('user_j', $1::uuid, $2::jsonb) x`, [ap, JSON.stringify(loteCuenta)])
ok(r[0].x.ok === true && r[0].x.dias === 2, "lote con cuenta contado")
ok((await q(`select count(*)::int n from tele_dias where persona='a:${ap}'`))[0].n === 0, "lo de sin cuenta pasó a la cuenta")
r = await q(`select dia::text, sesiones, segundos, reconstruido from tele_dias where persona='user_j' order by dia`)
console.log(JSON.stringify(r))
ok(r.find(x=>x.dia===ayer)?.sesiones === 2 && r.find(x=>x.dia===ayer)?.segundos === 180, "ayer suma lo anónimo y lo de la cuenta (2 sesiones, 180 s)")
ok((await q(`select count(*)::int n from tele_respuestas where persona='user_j'`))[0].n === 1, "la respuesta de un toque pasó a la cuenta")
r = await q(`select primer_dia::text, primera_vez < now() - interval '1 day' antes from tele_personas where persona='user_j'`)
ok(r[0].antes === true, "la primera vez es la del aparato (antes de la cuenta)")
// Un lote anónimo DESPUÉS: el aparato ya es de la cuenta
const loteDespues = { v:1, id:"44444444-4444-4444-8444-444444444444", plataforma:"ios", dias:{ [hoy]:{ s:1, seg:30, f:{"holoteca":[1,30]} } } }
await q(`select public.record_telemetria_anon($1::uuid, $2::jsonb)`, [ap, JSON.stringify(loteDespues)])
ok((await q(`select count(*)::int n from tele_uso where persona='user_j' and funcion='holoteca'`))[0].n === 1, "sin sesión en un aparato ligado, cuenta para su cuenta")
// Basura: fechas fuera de rango, claves raras, números enormes
const loteMalo = { v:1, id:"55555555-5555-4555-8555-555555555555", plataforma:"<script>", dias:{ "2020-01-01":{s:5}, "2026-13-40":{s:1}, [hoy]:{ s:999999, seg:1e12, f:{ "Radar Malo":[1,1], "espejo":[1e9, -5], "x.y.z":[1,1] }, p:{"a>b>c":3}, err:{"MAL":1} } } }
r = await q(`select public.record_telemetria('user_g', '66666666-6666-4666-8666-666666666666'::uuid, $1::jsonb) x`, [JSON.stringify(loteMalo)])
ok(r[0].x.ok === true && r[0].x.dias === 1, "lote con basura: solo cuenta el día válido")
r = await q(`select sesiones, segundos, plataforma from tele_dias where persona='user_g' and dia='${hoy}'`)
ok(r[0].sesiones === 200 && r[0].segundos === 86400 && r[0].plataforma === null, "topes: 200 sesiones, 86,400 s, plataforma rara fuera")
r = await q(`select funcion, aperturas, segundos from tele_uso where persona='user_g' and dia='${hoy}' order by 1`)
ok(r.length === 1 && r[0].funcion === 'espejo' && r[0].aperturas === 5000 && r[0].segundos === 0, "solo la clave válida, con su tope")
ok((await q(`select count(*)::int n from tele_global where clave in ('a>b>c','MAL')`))[0].n === 0, "pasos y errores mal formados fuera")
r = await q(`select public.record_telemetria('user_g', '66666666-6666-4666-8666-666666666666'::uuid, '"no"'::jsonb) x`)
ok(r[0].x.ok === false, "un lote que no es objeto se rechaza")
// ── Mantenimiento y lectura del Motor ──
r = await q(`select public.tele_mantener() x`)
ok(r[0].x.ok === true, "mantenimiento corre")
r = await q(`select count(*)::int n from tele_mes`)
ok(r[0].n >= 3, `fotos de meses: ${r[0].n}`)
let res = (await q(`select public.admin_telemetria_resumen('user_admin', NULL) x`))[0].x
const f = res.foto
console.log(JSON.stringify({ mau: f.mau, mau_cuenta: f.mau_cuenta, dau: f.dau, nuevas: f.nuevas, cuentas: f.cuentas, activacion: f.activacion, retencion: f.retencion, muro: f.muro_personas, subs: f.suscripciones, ia: f.ia_mxn }))
ok(!JSON.stringify(res).includes("user_admin") && !JSON.stringify(res).includes("user_excl"), "la casa no aparece")
ok(res.uso.some(u=>u.funcion==='radar.sonda' && u.personas===1), "uso: la Sonda con su persona")
ok(res.uso.some(u=>u.funcion==='radar.calibracion' && u.oculta), "Calibraciones marcadas como apagadas a propósito")
ok(res.recorridos.pasos.length > 0 && res.recorridos.salidas[0]?.sin_valor === 1, "recorridos y salida sin valor")
ok(res.respuestas.length === 1 && res.respuestas[0].respuesta === 'no_supe', "respuesta de un toque")
ok(res.tiempos.some(t=>t.clave==='espejo:respuesta' && t.n===2 && t.cubetas[3]===1), "tiempos con cubetas")
ok(res.errores.some(e=>e.clave==='js:radar:typeerror_cannot_read'), "errores")
ok(res.suscripciones.activas === 2 && res.suscripciones.activas_semanal === 1 && res.suscripciones.regalos === 1, "suscripciones: 2 pagadas (1 semanal) y 1 regalo")
ok(res.ia.total_mxn > 0 && res.ia.espejo_real_usd === 0.0024, `IA ${res.ia.total_mxn} MXN; Espejo real 0.0024 USD`)
ok(res.embudo.cuentas >= 1, `embudo: ${JSON.stringify(res.embudo)}`)
let mal = null
try { await q(`select public.admin_telemetria_resumen('user_a', NULL)`) } catch (e) { mal = e.message }
ok(mal && mal.includes("unauthorized"), "quien no es administrador no lee")
const per = (await q(`select public.admin_telemetria_persona('user_admin', 'user_j', 60) x`))[0].x
ok(per.dias.length === 2 && per.aparatos.length === 1 && per.respuestas.length === 1, "ficha de una persona")
// Retención: lo viejo se va
await ex(`insert into tele_uso (dia, funcion, persona, aperturas) values (public._tele_dia(now())-200, 'radar', 'user_b', 1); insert into tele_lotes (id, creado) values (gen_random_uuid(), now()-interval '9 days');`)
await q(`select public.tele_mantener()`)
ok((await q(`select count(*)::int n from tele_uso where dia < public._tele_dia(now())-120`))[0].n === 0, "uso de más de 120 días se borra")
ok((await q(`select count(*)::int n from tele_lotes where creado < now()-interval '7 days'`))[0].n === 0, "lotes de más de 7 días se borran")
ok((await q(`select count(*)::int n from tele_uso_mes`))[0].n > 0, "queda la historia por mes")
// Correr la migración otra vez no duplica nada
const antes = (await q(`select (select count(*) from tele_dias)::int d, (select sum(acciones) from tele_uso)::int a`))[0]
await ex(readFileSync(process.argv[2], "utf8"))
const despues = (await q(`select (select count(*) from tele_dias)::int d, (select sum(acciones) from tele_uso)::int a`))[0]
ok(antes.d === despues.d && antes.a === despues.a, `idempotente con datos (${antes.d} días, ${antes.a} acciones)`)
res = (await q(`select public.admin_telemetria_resumen('user_admin', NULL) x`))[0].x
writeFileSync(process.argv[3] + "/telemetria-ejemplo.json", JSON.stringify(res, null, 1))
writeFileSync(process.argv[3] + "/telemetria-persona-ejemplo.json", JSON.stringify(per, null, 1))
console.log(fallas ? `FALLAS: ${fallas}` : "TODO BIEN")
await db.close()
