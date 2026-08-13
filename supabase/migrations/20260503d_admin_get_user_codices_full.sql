-- 20260503d_admin_get_user_codices_full.sql
-- Lista completa de Códices del Tripulante para el panel del Motor
-- de Intervención. Incluye AMBOS tipos de adquisición:
--   · Compras Stripe (acquired_via='pago')
--   · Canjes con cristal (acquired_via='cristal')
-- Y junta el porcentaje de lectura por libro (reading_progress.percentage)
-- vía LEFT JOIN — si nunca lo abrió en el visor, devuelve 0.
--
-- Admin gate: la RPC valida via profiles.is_admin. No-admins reciben
-- empty array.
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

    return query
    select
        pu.book_id::text                              as book_id,
        coalesce(b.title, 'Sin título')::text         as title,
        coalesce(pu.acquired_via, 'pago')::text       as acquired_via,
        pu.formats_purchased                          as formats,
        nullif(pu.device, '')::text                   as device,
        pu.created_at                                 as purchased_at,
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
    order by pu.created_at desc nulls last;
end;
$$;

grant execute on function public.admin_get_user_codices_full(text, text)
    to anon, authenticated;
