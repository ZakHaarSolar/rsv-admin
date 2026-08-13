-- 20260503g_admin_get_user_codices_full_v4.sql
-- Fix definitivo: la tabla `purchases` NO tiene columna
-- `clerk_user_id` — solo identifica por `email`. Las versiones
-- v2/v3 referenciaban `pu.clerk_user_id` que tiraba runtime error
-- "column does not exist", devolvía null, y la lista quedaba vacía.
--
-- v4 matchea SOLO por email. Resolución del email:
--   1. p_target_email arg (preferido, lo pasa el frontend del Motor)
--   2. profiles.email del p_target_clerk_id (fallback)
-- Si ninguno está disponible, retorna empty.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

-- Drop versiones viejas para evitar overload ambiguity
drop function if exists public.admin_get_user_codices_full(text, text);
drop function if exists public.admin_get_user_codices_full(text, text, text);

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
    v_email text;
begin
    if p_admin_clerk_id is null or btrim(p_admin_clerk_id) = '' then
        return;
    end if;

    select coalesce(p.is_admin, false) into v_is_admin
    from public.profiles p
    where p.clerk_user_id = p_admin_clerk_id
    limit 1;

    if not v_is_admin then
        return;
    end if;

    -- Email: arg del frontend > profiles
    if p_target_email is not null and btrim(p_target_email) <> '' then
        v_email := lower(btrim(p_target_email));
    else
        select lower(btrim(p.email)) into v_email
        from public.profiles p
        where p.clerk_user_id = p_target_clerk_id
        limit 1;
    end if;

    if v_email is null then
        return;
    end if;

    return query
    select
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
    where lower(btrim(pu.email)) = v_email
    order by pu.purchased_at desc nulls last;
end;
$$;

grant execute on function public.admin_get_user_codices_full(text, text, text)
    to anon, authenticated;
