-- 20260503e_admin_get_user_codices_full_v2.sql
-- Reescritura de admin_get_user_codices_full para arreglar dos bugs
-- de la v1 (20260503d):
--
--   1. La v1 usaba columnas que NO existen en `purchases`:
--      · `pu.device`        → en realidad es `pu.acquired_device`
--      · `pu.created_at`    → en realidad es `pu.purchased_at`
--      Esto rompía el SELECT con "column does not exist" silenciosamente
--      desde el frontend (la RPC tira null y el array queda vacío).
--
--   2. La v1 filtraba SOLO por `clerk_user_id`. Muchas purchases viejas
--      del Tripulante están registradas por email (purchased antes de
--      tener clerk_user_id atado). Ahora matcheamos por clerk_user_id
--      OR email (resolviendo el email vía profiles del target).
--      DISTINCT ON (pu.id) evita duplicados si una purchase tiene
--      ambos campos.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

create or replace function public.admin_get_user_codices_full(
    p_admin_clerk_id text,
    p_target_clerk_id text
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
    v_target_email text;
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

    select lower(btrim(p.email)) into v_target_email
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
               v_target_email is not null
               and lower(btrim(pu.email)) = v_target_email
           )
        order by pu.id
    ) sub
    order by sub.purchased_at desc nulls last;
end;
$$;

grant execute on function public.admin_get_user_codices_full(text, text)
    to anon, authenticated;
