-- ============================================================
-- Mapa de Siniestros Viales CABA – Tabla "puntos"
-- Pegar en Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.puntos (
  id           bigint primary key,
  nombre       text    not null,          -- dirección: ej. "Nazca, av y Rivadavia, av"
  categoria    text    not null,          -- gravedad: Mortal / Grave / Leve
  latitud      double precision not null,
  longitud     double precision not null,
  valor        integer not null default 1, -- cantidad de víctimas del siniestro
  fecha        date,
  descripcion  text,                       -- participantes · tipo de vía · hora
  comuna       integer
);

-- Permitir que la página web (clave pública "anon") LEA los datos.
-- Sin esta política, Supabase devuelve una lista vacía.
alter table public.puntos enable row level security;

drop policy if exists "lectura publica" on public.puntos;
create policy "lectura publica"
  on public.puntos
  for select
  to anon
  using (true);
