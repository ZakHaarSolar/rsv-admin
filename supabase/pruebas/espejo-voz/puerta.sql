-- puerta.sql — prueba diferencial de reservar_espejo_voz (migración 20261024d) contra el camino de antes, en la base
-- real y sin dejar nada: perfiles, suscripciones y gasto de prueba viven solo dentro de la transacción, que sql.py
-- deshace al final. 11 casos de quién es (las reglas de _shared/membresia.ts), 14 de reserva comparados con
-- reserve_edge_spend en fila (como reserveSpend de la v3.11), la parte guardada y los interruptores.
-- Uso: python3 -I admin/herramientas/sql.py probar admin/supabase/pruebas/espejo-voz/puerta.sql (29 de 29 el 2026-10-24)
do $prueba$
declare
    salida text := '';
    fallos int := 0;
    casos int := 0;
    c_dia constant int := 86400;
    c_mes constant int := 2592000;
    c_libre constant int := 7776000;
    v_global bigint;
    v_ruta text;
    r record;
    o jsonb; n jsonb; m jsonb; d jsonb;
    od jsonb; nd jsonb;
    v_carril text;
    esperado text;
begin
    -- Personas de prueba (solo existen dentro de esta transacción).
    insert into profiles (clerk_user_id, email, is_admin) values
        ('rsvprueba_admin', 'admin@prueba.rsv', true),
        ('rsvprueba_miembro', 'miembro@prueba.rsv', false),
        ('rsvprueba_libre', 'libre@prueba.rsv', false),
        ('rsvprueba_sincorreo', null, false),
        ('rsvprueba_vacio', '   ', false),
        ('rsvprueba_decoder', 'decoder@prueba.rsv', false),
        ('rsvprueba_singrupo', 'singrupo@prueba.rsv', false),
        ('rsvprueba_raro', E'  Raro@Prueba.RSV\t', false),
        ('rsvprueba_cancelada', 'cancelada@prueba.rsv', false),
        ('rsvprueba_adminnull', 'adminnull@prueba.rsv', null);
    insert into subscriptions (stripe_subscription_id, stripe_customer_id, email, status, group_name) values
        ('sub_rsvprueba_1', 'cus_rsvprueba', 'miembro@prueba.rsv', 'active', 'sintonia'),
        ('sub_rsvprueba_2', 'cus_rsvprueba', 'decoder@prueba.rsv', 'active', 'decoder'),
        ('sub_rsvprueba_2b', 'cus_rsvprueba', 'decoder@prueba.rsv', 'active', 'DREAM'),
        ('sub_rsvprueba_3', 'cus_rsvprueba', 'singrupo@prueba.rsv', 'active', null),
        ('sub_rsvprueba_4', 'cus_rsvprueba', 'raro@prueba.rsv', 'active', 'pulsar'),
        ('sub_rsvprueba_5', 'cus_rsvprueba', 'cancelada@prueba.rsv', 'canceled', 'sintonia');

    -- 1) Quién es: lo que diría _shared/membresia.ts con cada perfil.
    for r in select * from (values
        ('rsvprueba_admin', 'admin'), ('rsvprueba_miembro', 'miembro'), ('rsvprueba_libre', 'free'),
        ('rsvprueba_sincorreo', 'free'), ('rsvprueba_vacio', 'free'), ('rsvprueba_decoder', 'free'),
        ('rsvprueba_singrupo', 'miembro'), ('rsvprueba_raro', 'miembro'), ('rsvprueba_cancelada', 'free'),
        ('rsvprueba_adminnull', 'free'), ('rsvprueba_nadie', 'free')) as t(u, carril)
    loop
        begin
            n := reservar_espejo_voz(r.u, '203.0.113.7', 3, '', 'espejo_voz_swap', 'espejo_voz_plana',
                                     6000, 600, 5000, 80, 18000, c_dia, c_mes, c_libre);
            raise exception 'deshacer';
        exception when others then
            if sqlerrm <> 'deshacer' then raise; end if;
        end;
        casos := casos + 1;
        if n->>'carril' = r.carril then
            salida := salida || format(E'✓ quién es · %s → %s\n', r.u, r.carril);
        else
            fallos := fallos + 1;
            salida := salida || format(E'✗ quién es · %s → %s (esperado %s)\n', r.u, n->>'carril', r.carril);
        end if;
    end loop;

    -- 2) La reserva, contra el camino de antes, en cada estado del registro de gasto.
    select coalesce(sum(cost_units), 0) into v_global from edge_spend_ledger
     where edge = 'espejo-voz' and created_at > now() - make_interval(secs => c_dia);
    for r in select * from (values
        ('admin libre', 'rsvprueba_admin', 'admin', 0, 0, 0, 0, 7),
        ('miembro libre', 'rsvprueba_miembro', 'miembro', 0, 0, 0, 0, 7),
        ('miembro al tope del mes', 'rsvprueba_miembro', 'miembro', 4995, 0, 0, 0, 7),
        ('miembro justo en el tope del mes', 'rsvprueba_miembro', 'miembro', 4993, 0, 0, 0, 7),
        ('miembro al tope del día', 'rsvprueba_miembro', 'miembro', 0, 596, 0, 0, 7),
        ('miembro mes y día al tope', 'rsvprueba_miembro', 'miembro', 4999, 599, 0, 0, 7),
        ('miembro, mes viejo (31 días) no cuenta', 'rsvprueba_miembro', 'miembro', 0, 0, 0, 4999, 7),
        ('miembro con freno global', 'rsvprueba_miembro', 'miembro', 0, 0, 1, 0, 7),
        ('admin con freno global', 'rsvprueba_admin', 'admin', 0, 0, 1, 0, 7),
        ('admin al tope del día', 'rsvprueba_admin', 'admin', 0, 5995, 0, 0, 7),
        ('gratis libre', 'rsvprueba_libre', 'free', 0, 0, 0, 0, 7),
        ('gratis al tope (80 de por vida)', 'rsvprueba_libre', 'free', 0, 75, 0, 0, 7),
        ('gratis con freno global', 'rsvprueba_libre', 'free', 0, 0, 1, 0, 7),
        ('sin perfil', 'rsvprueba_nadie', 'free', 0, 0, 0, 0, 2)
    ) as t(nombre, u, carril, mes_previo, dia_previo, global_lleno, mes_viejo, costo)
    loop
        casos := casos + 1;
        -- El camino de antes (reserveSpend v3.11: mes, luego día; si el día rechaza, se devuelve el mes).
        begin
            if r.mes_previo > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values (r.u, md5('203.0.113.7'), 'espejo-voz-mes', r.mes_previo, now() - interval '10 days');
            end if;
            if r.mes_viejo > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values (r.u, md5('203.0.113.7'), 'espejo-voz-mes', r.mes_viejo, now() - interval '31 days');
            end if;
            if r.dia_previo > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values (r.u, md5('203.0.113.7'), 'espejo-voz', r.dia_previo, now() - interval '2 hours');
            end if;
            if r.global_lleno > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values ('rsvprueba_otro', null, 'espejo-voz', greatest(1, 18000 - v_global - r.costo + 1), now() - interval '3 hours');
            end if;
            if r.carril = 'miembro' then
                m := reserve_edge_spend('espejo-voz-mes', r.u, '203.0.113.7', r.costo, 5000, c_mes, 0, c_dia, 0, c_dia);
                if (m->>'ok')::boolean is not true then
                    o := m || jsonb_build_object('ventana', c_mes);
                else
                    d := reserve_edge_spend('espejo-voz', r.u, '203.0.113.7', r.costo, 600, c_dia, 0, c_dia, 18000, c_dia);
                    if (d->>'ok')::boolean is not true then
                        delete from edge_spend_ledger where user_key = r.u and created_at >= now()
                           and edge in ('espejo-voz', 'espejo-voz-mes');
                        o := d || jsonb_build_object('ventana', c_dia);
                    else
                        o := d;
                    end if;
                end if;
            elsif r.carril = 'admin' then
                o := reserve_edge_spend('espejo-voz', r.u, '203.0.113.7', r.costo, 6000, c_dia, 0, c_dia, 18000, c_dia);
                if (o->>'ok')::boolean is not true then o := o || jsonb_build_object('ventana', c_dia); end if;
            else
                o := reserve_edge_spend('espejo-voz', r.u, '203.0.113.7', r.costo, 80, c_libre, 0, c_dia, 18000, c_dia);
                if (o->>'ok')::boolean is not true then o := o || jsonb_build_object('ventana', c_libre); end if;
            end if;
            select coalesce(jsonb_object_agg(edge || ':' || coalesce(ip_key, '-'), s), '{}') into od from (
                select edge, ip_key, sum(cost_units) s from edge_spend_ledger
                 where user_key = r.u and created_at >= now() group by edge, ip_key) x;
            raise exception 'deshacer';
        exception when others then
            if sqlerrm <> 'deshacer' then raise; end if;
        end;
        -- La función nueva, desde el mismo estado.
        begin
            if r.mes_previo > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values (r.u, md5('203.0.113.7'), 'espejo-voz-mes', r.mes_previo, now() - interval '10 days');
            end if;
            if r.mes_viejo > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values (r.u, md5('203.0.113.7'), 'espejo-voz-mes', r.mes_viejo, now() - interval '31 days');
            end if;
            if r.dia_previo > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values (r.u, md5('203.0.113.7'), 'espejo-voz', r.dia_previo, now() - interval '2 hours');
            end if;
            if r.global_lleno > 0 then
                insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
                values ('rsvprueba_otro', null, 'espejo-voz', greatest(1, 18000 - v_global - r.costo + 1), now() - interval '3 hours');
            end if;
            n := reservar_espejo_voz(r.u, '203.0.113.7', r.costo, 'rsvprueba/no-existe', 'espejo_voz_swap', 'espejo_voz_plana',
                                     6000, 600, 5000, 80, 18000, c_dia, c_mes, c_libre);
            select coalesce(jsonb_object_agg(edge || ':' || coalesce(ip_key, '-'), s), '{}') into nd from (
                select edge, ip_key, sum(cost_units) s from edge_spend_ledger
                 where user_key = r.u and created_at >= now() group by edge, ip_key) x;
            -- los ids que devuelve son exactamente las filas apartadas
            if (n->>'ok')::boolean and (select count(*) from edge_spend_ledger where user_key = r.u and created_at >= now())
                 <> jsonb_array_length(n->'ids')
               or exists (select 1 from jsonb_array_elements_text(n->'ids') i
                           where not exists (select 1 from edge_spend_ledger e where e.id = i::uuid and e.user_key = r.u)) then
                nd := nd || '{"ids":"NO CUADRAN"}';
            end if;
            raise exception 'deshacer';
        exception when others then
            if sqlerrm <> 'deshacer' then raise; end if;
        end;
        if (o->>'ok') = (n->>'ok') and coalesce(o->>'reason', '') = coalesce(n->>'reason', '')
           and coalesce(o->>'spent', '') = coalesce(n->>'spent', '') and coalesce(o->>'limit', '') = coalesce(n->>'limit', '')
           and coalesce(o->>'ventana', '') = coalesce(n->>'ventana', '') and od = nd and n->>'carril' = r.carril
           and (n->>'guardada')::boolean is false then
            salida := salida || format(E'✓ %s · %s · escribe %s\n', r.nombre,
                case when (n->>'ok')::boolean then 'aparta ' || jsonb_array_length(n->'ids') || ' fila(s)'
                     else format('%s %s/%s, ventana %s h', n->>'reason', n->>'spent', n->>'limit', ((n->>'ventana')::int / 3600)) end, nd);
        else
            fallos := fallos + 1;
            salida := salida || format(E'✗ %s\n    antes: %s · escribe %s\n    nueva: %s · escribe %s\n', r.nombre, o, od, n, nd);
        end if;
    end loop;

    -- 3) Parte guardada: con una parte real del almacén no se aparta nada.
    select left(name, -4) into v_ruta from storage.objects
     where bucket_id = 'voz-partes' and name like '%.mp3' order by created_at desc limit 1;
    begin
        n := reservar_espejo_voz('rsvprueba_libre', '203.0.113.7', 7, v_ruta, 'espejo_voz_swap', 'espejo_voz_plana',
                                 6000, 600, 5000, 80, 18000, c_dia, c_mes, c_libre);
        select count(*)::text::jsonb into nd from edge_spend_ledger where user_key = 'rsvprueba_libre' and created_at >= now();
        raise exception 'deshacer';
    exception when others then
        if sqlerrm <> 'deshacer' then raise; end if;
    end;
    casos := casos + 1;
    if (n->>'guardada')::boolean and (n->>'ok')::boolean and jsonb_array_length(n->'ids') = 0 and nd = '0'::jsonb then
        salida := salida || format(E'✓ parte guardada · no aparta nada · %s\n', n);
    else
        fallos := fallos + 1;
        salida := salida || format(E'✗ parte guardada · %s · filas %s\n', n, nd);
    end if;
    -- Guardada aunque la persona esté al tope (lo guardado sale gratis, como en la v3.12).
    begin
        insert into edge_spend_ledger (user_key, ip_key, edge, cost_units, created_at)
        values ('rsvprueba_libre', null, 'espejo-voz', 80, now() - interval '1 day');
        n := reservar_espejo_voz('rsvprueba_libre', '203.0.113.7', 7, v_ruta, 'espejo_voz_swap', 'espejo_voz_plana',
                                 6000, 600, 5000, 80, 18000, c_dia, c_mes, c_libre);
        raise exception 'deshacer';
    exception when others then
        if sqlerrm <> 'deshacer' then raise; end if;
    end;
    casos := casos + 1;
    if (n->>'guardada')::boolean and (n->>'ok')::boolean then
        salida := salida || E'✓ parte guardada con el gratis al tope · se sirve\n';
    else
        fallos := fallos + 1;
        salida := salida || format(E'✗ parte guardada al tope · %s\n', n);
    end if;

    -- 4) Los interruptores, como get_app_flag (con y sin fila).
    begin
        insert into app_flags (key, value) values ('espejo_voz_plana', true)
        on conflict (key) do update set value = excluded.value;
        update app_flags set value = true where key = 'espejo_voz_swap';
        n := reservar_espejo_voz('rsvprueba_admin', '', 1, '', 'espejo_voz_swap', 'espejo_voz_plana',
                                 6000, 600, 5000, 80, 18000, c_dia, c_mes, c_libre);
        o := jsonb_build_object('swap', get_app_flag('espejo_voz_swap'), 'plana', get_app_flag('espejo_voz_plana'));
        raise exception 'deshacer';
    exception when others then
        if sqlerrm <> 'deshacer' then raise; end if;
    end;
    casos := casos + 1;
    if n->'swap' = o->'swap' and n->'plana' = o->'plana' and (n->>'swap')::boolean and (n->>'plana')::boolean then
        salida := salida || E'✓ interruptores encendidos · iguales a get_app_flag\n';
    else
        fallos := fallos + 1;
        salida := salida || format(E'✗ interruptores · nueva %s · get_app_flag %s\n', n, o);
    end if;
    begin
        n := reservar_espejo_voz('rsvprueba_admin', '', 1, '', 'espejo_voz_swap', 'no_existe_rsvprueba',
                                 6000, 600, 5000, 80, 18000, c_dia, c_mes, c_libre);
        o := jsonb_build_object('swap', get_app_flag('espejo_voz_swap'), 'plana', get_app_flag('no_existe_rsvprueba'));
        select ip_key into v_ruta from edge_spend_ledger where user_key = 'rsvprueba_admin' and created_at >= now() limit 1;
        raise exception 'deshacer';
    exception when others then
        if sqlerrm <> 'deshacer' then raise; end if;
    end;
    casos := casos + 1;
    if n->'swap' = o->'swap' and n->'plana' = o->'plana' and v_ruta is null then
        salida := salida || E'✓ interruptores de hoy y sin fila · iguales a get_app_flag; sin IP no hay huella de IP\n';
    else
        fallos := fallos + 1;
        salida := salida || format(E'✗ interruptores sin fila · nueva %s · get_app_flag %s · ip %s\n', n, o, v_ruta);
    end if;

    raise exception E'%\n% de % casos iguales al camino de antes', salida, casos - fallos, casos;
end
$prueba$;
