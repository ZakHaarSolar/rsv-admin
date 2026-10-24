-- 20261024_meditaciones_catalogo.sql · Red Solar Viva · Escáner (2026-10-24)
-- El catálogo de Meditaciones sale de la base: una Meditación nueva llega a todos los teléfonos en cuanto se publica,
-- sin esperar a la tienda (desde la app 1.1.7; las versiones viejas siguen con su lista de siempre).
--
-- Cada Meditación tiene un estado:
--   'prueba'    → solo la ve la cuenta de administrador (para escucharla en TestFlight o en la app antes de soltarla)
--   'publicada' → la ve todo el mundo
--   'oculta'    → no la ve nadie (sin borrarla)
--
-- Dar de alta una nueva (en prueba):
--   insert into meditaciones_catalogo (id, titulo, descripcion, descripcion_en, duracion, tipo, audio, voz, orden)
--   values ('mi-meditacion', 'Mi Meditación', 'Descripción.', 'Description.', '6 min', 'paid',
--           'https://…/Meditaciones/mi-meditacion/mezcla.mp3', 'https://…/Meditaciones/mi-meditacion/voz.mp3', 40);
-- Luz verde para todos:
--   update meditaciones_catalogo set estado = 'publicada' where id = 'mi-meditacion';

create table if not exists public.meditaciones_catalogo (
    id              text primary key,
    titulo          text not null,
    titulo_en       text,                      -- los títulos de Meditación no se traducen (glosario); vacío = el mismo
    descripcion     text not null,
    descripcion_en  text,
    duracion        text not null,             -- como se muestra: «6 min»
    tipo            text not null default 'paid' check (tipo in ('free', 'paid')),
    audio           text not null,             -- la mezcla (voz + música)
    voz             text,                      -- la voz sola, alineada al sample con la mezcla (Meditación por pistas)
    orden           int  not null default 100,
    estado          text not null default 'prueba' check (estado in ('prueba', 'publicada', 'oculta')),
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now()
);

alter table public.meditaciones_catalogo enable row level security;
-- Nadie lee la tabla directo: la app pasa por get_meditaciones_catalogo (así 'prueba' queda solo para la casa).
revoke all on public.meditaciones_catalogo from anon, authenticated;

create or replace function public.get_meditaciones_catalogo(p_clerk_user_id text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_admin boolean := false;
begin
    if p_clerk_user_id is not null and p_clerk_user_id <> '' then
        select coalesce(is_admin, false) into v_admin from profiles where clerk_user_id = p_clerk_user_id;
    end if;
    return coalesce((
        select json_agg(json_build_object(
                   'id', id, 'titulo', titulo, 'titulo_en', titulo_en, 'descripcion', descripcion,
                   'descripcion_en', descripcion_en, 'duracion', duracion, 'tipo', tipo, 'audio', audio,
                   'voz', voz, 'orden', orden, 'estado', estado)
               order by orden, creado_en)
        from meditaciones_catalogo
        where estado = 'publicada' or (estado = 'prueba' and coalesce(v_admin, false))
    ), '[]'::json);
end $$;

grant execute on function public.get_meditaciones_catalogo(text) to anon, authenticated, service_role;

-- Las tres que ya viven en la app, publicadas
insert into public.meditaciones_catalogo (id, titulo, descripcion, descripcion_en, duracion, tipo, audio, voz, orden, estado) values
 ('amanecer-del-eje', 'Amanecer del Eje', 'Sintoniza tu eje al amanecer en 12 min.', 'Tune your axis at dawn in 12 min.',
  '12 min', 'free', 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/Amanecer%20del%20Eje.mp3',
  'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/amanecer-del-eje/voz.mp3', 10, 'publicada'),
 ('anochecer-del-eje', 'Anochecer del Eje', 'Transición hacia la sala de colapso de reflejos (sueños).',
  'A passage into the chamber where reflections collapse (dreams).',
  '16 min', 'paid', 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/Anochecer%20del%20Eje.mp3',
  'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/anochecer-del-eje/voz.mp3', 20, 'publicada'),
 ('la-habitacion-que-sostiene', 'La Habitación que Sostiene', 'Tu calma llena la habitación y la habitación la sostiene contigo.',
  'Your calm fills the room, and the room holds it with you.',
  '6 min', 'paid', 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/la-habitacion-que-sostiene/mezcla.mp3',
  'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Meditaciones/la-habitacion-que-sostiene/voz.mp3', 30, 'publicada')
on conflict (id) do nothing;
