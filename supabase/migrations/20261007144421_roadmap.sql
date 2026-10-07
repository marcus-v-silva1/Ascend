-- Roadmap no estilo roadmap.sh: etapas (espinha) com assuntos ramificados.
-- O progresso de cada nó pode vir de outra parte do app (link_type + link_ref)
-- ou ser marcado à mão (status). status null = automático.

create type public.roadmap_node_kind as enum ('goal', 'stage', 'topic');
create type public.roadmap_status as enum ('todo', 'doing', 'done', 'skipped');
create type public.roadmap_link as enum (
  'subject', 'goal', 'key_result', 'milestone', 'english_unit', 'fund', 'none'
);

create table public.roadmap_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text not null,
  roadmap text not null,
  parent_external_id text,
  kind public.roadmap_node_kind not null default 'topic',
  title text not null,
  description text,
  position int not null default 0,
  side text check (side in ('left', 'right')),
  status public.roadmap_status,
  link_type public.roadmap_link not null default 'none',
  link_ref text,
  -- external_ids dos nós que precisam vir antes
  requires text[] not null default '{}',
  -- [{ "title": "...", "url": "https://..." }]
  resources jsonb not null default '[]'::jsonb,
  app_href text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);
create index roadmap_nodes_roadmap_idx on public.roadmap_nodes (user_id, roadmap, position);

alter table public.roadmap_nodes enable row level security;
create policy "owner_all" on public.roadmap_nodes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
