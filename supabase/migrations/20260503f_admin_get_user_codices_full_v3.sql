-- 20260503f_admin_get_user_codices_full_v3.sql
-- Robustece admin_get_user_codices_full v2 (20260503e):
--   · Acepta un tercer parámetro p_target_email opcional. El frontend
--     ya tiene el email del Tripulante (de la lista del Motor); pasarlo
--     directamente evita depender de que profiles.email esté lleno.
--     Si el perfil no tiene email guardado, la v2 caía a buscar SOLO
--     por clerk_user_id, perdiendo todas las purchases viejas que se
--     identifican por email.
--   · Match final: `clerk_user_id = target` OR `email = target_email`
--     (el que llega por arg) OR `email = email_de_profiles` (fallback
--     si el frontend no pasó email).
--   · Sigue admin-gated por profiles.is_admin del p_admin_clerk_id.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

-- Drop la versión vieja para evitar ambigüedad de overload
drop function if exists public.admin_get_user_codices_full(text, text);

create or replace function public.admin_get_user_codices_full(
    p_admin_clerk_id text,
    p_target_clerk_id text,
    p_target_email text default null
)
returns table (
    book_id text,
    title text,
    acquired_via text,
    formats text[],
    device text,
    purchased_at timestamptz,
    amount_cents integer,
    reading_percentage numeric,
    reading_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_is_admin boolean := false;
    v_email_arg text;
    v_email_profile text;
begin
    if p_admin_clerk_id is null or btrim(p_admin_clerk_id) = '' then
        return;
    end if;
    if p_target_clerk_id is null or btrim(p_target_clerk_id) = '' then
        return;
    end if;

    select coalesce(p.is_admin, false) into v_is_admin
    from public.profiles p
    where p.clerk_user_id = p_admin_clerk_id
    limit 1;

    if not v_is_admin then
        return;
    end if;

    -- Email del frontend (preferencia)
    if p_target_email is not null and btrim(p_target_email) <> '' then
        v_email_arg := lower(btrim(p_target_email));
    end if;

    -- Email de profiles (fallback)
    select lower(btrim(p.email)) into v_email_profile
    from public.profiles p
    where p.clerk_user_id = p_target_clerk_id
    limit 1;

    return query
    select
        sub.book_id,
        sub.title,
        sub.acquired_via,
        sub.formats,
        sub.device,
        sub.purchased_at,
        sub.amount_cents,
        sub.reading_percentage,
        sub.reading_updated_at
    from (
        select distinct on (pu.id)
            pu.book_id::text                              as book_id,
            coalesce(b.title, 'Sin título')::text         as title,
            coalesce(pu.acquired_via, 'pago')::text       as acquired_via,
            pu.formats_purchased                          as formats,
            nullif(pu.acquired_device, '')::text          as device,
            pu.purchased_at                               as purchased_at,
            pu.amount_cents                               as amount_cents,
            coalesce(rp.percentage, 0)::numeric           as reading_percentage,
            rp.updated_at                                 as reading_updated_at
        from public.purchases pu
        left join public.books b
            on b.id = pu.book_id
        left join public.reading_progress rp
            on rp.book_id = pu.book_id::text
           and rp.clerk_user_id = p_target_clerk_id
        where pu.clerk_user_id = p_target_clerk_id
           or (
               v_email_arg is not null
               and lower(btrim(pu.email)) = v_email_arg
           )
           or (
               v_email_profile is not null
               and lower(btrim(pu.email)) = v_email_profile
           )
        order by pu.id
    ) sub
    order by sub.purchased_at desc nulls last;
end;
$$;

grant execute on function public.admin_get_user_codices_full(text, text, text)
    to anon, authenticated;
