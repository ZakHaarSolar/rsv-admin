-- 20261024d_reservar_espejo_voz.sql · 🜂 LA PUERTA DE ESCUCHAR EN UN SOLO VIAJE (sala de los recortes de espejo-voz,
-- 2026-10-24). Medido con los registros de Supabase (92 partes reales): antes de sintetizar, cada parte de Escuchar
-- hacía hasta seis viajes a la base (dos interruptores, el perfil, las suscripciones, las dos reservas del miembro) y
-- uno al almacén, y cada viaje desde la función cuesta de 0.27 a 0.36 s aunque la consulta tarde 15 ms adentro.
-- Esta función hace todo eso en UN viaje, con las mismas reglas:
--
--   · Quién es: la señal CANÓNICA de _shared/membresia.ts. Perfil por clerk_user_id; is_admin = administrador; si no,
--     el correo en minúsculas y sin espacios en las orillas (los mismos que quita trim() de JavaScript) y una
--     suscripción con status 'active' cuyo grupo no sea 'decoder' ni 'dream' = miembro; sin perfil, sin correo o sin
--     esa suscripción = gratis. Aquí la base siempre contesta: si no contesta, la función de la voz vuelve al camino
--     de antes, que dice «desconocido» y nunca cobra como miembro.
--   · Los dos interruptores del Motor, igual que get_app_flag.
--   · ¿La parte ya está guardada en voz-partes? Si sí, no se aparta nada (lo guardado sale gratis, como desde la
--     v3.9). Si la consulta del almacén falla, se responde «guardada: null» y se aparta: la función de la voz busca
--     la parte como antes y, si la encuentra, devuelve exactamente lo apartado.
--   · La reserva: los mismos candados por función y persona que reserve_edge_spend (pg_advisory_xact_lock con la misma
--     llave) y las mismas ventanas, en el mismo orden (persona y luego el freno global). Administrador: p_limite_admin
--     al día. Miembro: p_limite_mes en p_ventana_mes primero y p_limite_dia al día después; si una rechaza no se
--     aparta ninguna, y manda el rechazo del mes. Gratis: p_limite_libre en p_ventana_libre. El freno global
--     (p_limite_global en p_ventana_dia) vive solo en la ventana diaria. El rechazo trae `ventana`: la de la persona
--     en la reserva que rechazó (con ella la función de la voz arma window_hours, igual que antes).
--   · Devuelve el id de cada fila apartada: el reembolso borra exactamente esas, nunca la de otra parte de la misma
--     persona (el reembolso por ventana de tiempo podía llevársela).
--
-- Los límites llegan como parámetros: la fuente de verdad sigue en espejo-voz/index.ts. Solo la llama service_role.

create or replace function public.reservar_espejo_voz(
    p_user_key text,
    p_ip text,
    p_cost integer,
    p_ruta text,
    p_flag_swap text,
    p_flag_plana text,
    p_limite_admin integer,
    p_limite_dia integer,
    p_limite_mes integer,
    p_limite_libre integer,
    p_limite_global integer,
    p_ventana_dia integer,
    p_ventana_mes integer,
    p_ventana_libre integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    -- Los mismos espacios que quita String.prototype.trim() de JavaScript.
    c_espacios constant text := E' \t\n\u000B\f\r                 　﻿';
    v_ipkey text := case when p_ip is not null and length(p_ip) > 0 then md5(p_ip) else null end;
    v_swap boolean;
    v_plana boolean;
    v_correo text;
    v_admin boolean;
    v_carril text;
    v_guardada boolean := false;
    v_spent bigint;
    v_limite integer;
    v_ventana integer;
    v_ids uuid[] := array[]::uuid[];
    v_id uuid;
begin
    -- Los interruptores del Motor (get_app_flag: sin fila = false).
    v_swap := coalesce((select value from app_flags where key = p_flag_swap), false);
    v_plana := coalesce((select value from app_flags where key = p_flag_plana), false);

    -- Quién es (_shared/membresia.ts).
    select p.email, p.is_admin into v_correo, v_admin
      from profiles p
     where p.clerk_user_id = p_user_key
     limit 1;
    if v_admin is true then
        v_carril := 'admin';
    else
        v_correo := btrim(lower(coalesce(v_correo, '')), c_espacios);
        if v_correo = '' then
            v_carril := 'free';
        elsif exists (
            select 1
              from subscriptions s
             where s.email = v_correo
               and s.status = 'active'
               and lower(coalesce(s.group_name, '')) not in ('decoder', 'dream')
        ) then
            v_carril := 'miembro';
        else
            v_carril := 'free';
        end if;
    end if;

    -- ¿La parte ya está guardada? (la versión vigente del objeto, no archivada ni marca de borrado; un tamaño
    -- conocido de 1000 bytes o menos no cuenta, como en leerParteGuardada).
    if coalesce(p_ruta, '') <> '' then
        begin
            select exists (
                select 1
                  from storage.objects o
                 where o.bucket_id = 'voz-partes'
                   and o.name = p_ruta || '.mp3'
                   and o.archived_at is null
                   and o.is_delete_marker is not true
                   and coalesce((o.metadata ->> 'size')::bigint, 1001) > 1000
            ) into v_guardada;
        exception when others then
            v_guardada := null;
        end;
        if v_guardada is true then
            return jsonb_build_object(
                'carril', v_carril, 'guardada', true, 'ok', true, 'ids', '[]'::jsonb,
                'swap', v_swap, 'plana', v_plana
            );
        end if;
    end if;

    -- La ventana del mes del miembro va primero (reserve_edge_spend de 'espejo-voz-mes', sin freno global).
    if v_carril = 'miembro' then
        perform pg_advisory_xact_lock(
            hashtextextended('espejo-voz-mes' || '|' || coalesce(p_user_key, v_ipkey, ''), 20261018)
        );
        if p_limite_mes > 0 and p_user_key is not null then
            select coalesce(sum(cost_units), 0) into v_spent
              from edge_spend_ledger
             where user_key = p_user_key and edge = 'espejo-voz-mes'
               and created_at > now() - make_interval(secs => p_ventana_mes);
            if v_spent + p_cost > p_limite_mes then
                return jsonb_build_object(
                    'carril', v_carril, 'guardada', v_guardada, 'ok', false, 'reason', 'user_limit',
                    'spent', v_spent, 'limit', p_limite_mes, 'ventana', p_ventana_mes,
                    'swap', v_swap, 'plana', v_plana
                );
            end if;
        end if;
        v_limite := p_limite_dia;
        v_ventana := p_ventana_dia;
    elsif v_carril = 'admin' then
        v_limite := p_limite_admin;
        v_ventana := p_ventana_dia;
    else
        v_limite := p_limite_libre;
        v_ventana := p_ventana_libre;
    end if;

    -- La ventana diaria (o la del gratis), con el freno global (reserve_edge_spend de 'espejo-voz').
    perform pg_advisory_xact_lock(
        hashtextextended('espejo-voz' || '|' || coalesce(p_user_key, v_ipkey, ''), 20261018)
    );
    if v_limite > 0 and p_user_key is not null then
        select coalesce(sum(cost_units), 0) into v_spent
          from edge_spend_ledger
         where user_key = p_user_key and edge = 'espejo-voz'
           and created_at > now() - make_interval(secs => v_ventana);
        if v_spent + p_cost > v_limite then
            return jsonb_build_object(
                'carril', v_carril, 'guardada', v_guardada, 'ok', false, 'reason', 'user_limit',
                'spent', v_spent, 'limit', v_limite, 'ventana', v_ventana,
                'swap', v_swap, 'plana', v_plana
            );
        end if;
    end if;
    if p_limite_global > 0 then
        select coalesce(sum(cost_units), 0) into v_spent
          from edge_spend_ledger
         where edge = 'espejo-voz'
           and created_at > now() - make_interval(secs => p_ventana_dia);
        if v_spent + p_cost > p_limite_global then
            return jsonb_build_object(
                'carril', v_carril, 'guardada', v_guardada, 'ok', false, 'reason', 'global_limit',
                'spent', v_spent, 'limit', p_limite_global, 'ventana', v_ventana,
                'swap', v_swap, 'plana', v_plana
            );
        end if;
    end if;

    -- Apartar: las dos filas del miembro juntas, o la del día.
    if v_carril = 'miembro' then
        insert into edge_spend_ledger (user_key, ip_key, edge, cost_units)
        values (p_user_key, v_ipkey, 'espejo-voz-mes', p_cost)
        returning id into v_id;
        v_ids := v_ids || v_id;
    end if;
    insert into edge_spend_ledger (user_key, ip_key, edge, cost_units)
    values (p_user_key, v_ipkey, 'espejo-voz', p_cost)
    returning id into v_id;
    v_ids := v_ids || v_id;

    return jsonb_build_object(
        'carril', v_carril, 'guardada', v_guardada, 'ok', true, 'ids', to_jsonb(v_ids),
        'swap', v_swap, 'plana', v_plana
    );
end;
$$;

revoke all on function public.reservar_espejo_voz(
    text, text, integer, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer
) from public, anon, authenticated;
grant execute on function public.reservar_espejo_voz(
    text, text, integer, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer
) to service_role;

notify pgrst, 'reload schema';
