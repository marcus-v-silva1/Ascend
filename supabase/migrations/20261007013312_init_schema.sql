-- Ascend: schema inicial.
-- Toda tabela de dados pertence a um usuário (user_id) e é protegida por RLS.
-- O app é de dono único; a restrição de e-mail fica no proxy/servidor, o RLS
-- garante o isolamento mesmo que outra conta seja criada por engano.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perfil e configurações
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  target_cefr text not null default 'B2',
  target_cefr_date date,
  usd_brl numeric(10, 4) not null default 5.40,
  eur_brl numeric(10, 4) not null default 6.20,
  daily_new_cards int not null default 20,
  content_version int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Estudos: assuntos, questões, tentativas, simulados
-- ---------------------------------------------------------------------------
create type public.subject_kind as enum ('exam', 'discipline', 'topic');
create type public.question_type as enum ('single', 'multi', 'truefalse');
create type public.session_mode as enum ('practice', 'mock', 'review');

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id uuid references public.subjects (id) on delete cascade,
  external_id text,
  name text not null,
  kind public.subject_kind not null default 'topic',
  description text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);
create index subjects_parent_idx on public.subjects (parent_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  external_id text,
  type public.question_type not null default 'single',
  stem text not null,
  -- [{ "id": "a", "text": "..." }]
  options jsonb not null default '[]'::jsonb,
  -- ["a"] ou ["a","c"] (multi) ou ["true"]/["false"] (truefalse)
  correct jsonb not null default '[]'::jsonb,
  explanation text,
  source text,
  source_url text,
  board text,
  year int,
  difficulty smallint check (difficulty between 1 and 5),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);
create index questions_subject_idx on public.questions (subject_id);

create table public.exam_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text,
  name text not null,
  subject_id uuid references public.subjects (id) on delete cascade,
  question_count int not null check (question_count > 0),
  duration_min int not null check (duration_min > 0),
  pass_pct int not null check (pass_pct between 1 and 100),
  ready_pct int not null default 95,
  official_url text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  preset_id uuid references public.exam_presets (id) on delete set null,
  mode public.session_mode not null default 'practice',
  subject_ids uuid[] not null default '{}',
  question_ids uuid[] not null default '{}',
  duration_min int,
  pass_pct int,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  correct_count int,
  total int,
  score_pct numeric(5, 2)
);
create index study_sessions_user_started_idx on public.study_sessions (user_id, started_at desc);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  session_id uuid references public.study_sessions (id) on delete cascade,
  selected jsonb not null default '[]'::jsonb,
  is_correct boolean not null,
  time_ms int,
  why_wrong text,
  created_at timestamptz not null default now()
);
create index attempts_question_idx on public.attempts (question_id, created_at desc);
create index attempts_user_created_idx on public.attempts (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Flashcards (FSRS)
-- ---------------------------------------------------------------------------
create type public.card_source as enum ('manual', 'question', 'vocab', 'phrase');

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text,
  name text not null,
  description text,
  subject_id uuid references public.subjects (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  external_id text,
  front text not null,
  back text not null,
  source public.card_source not null default 'manual',
  question_id uuid references public.questions (id) on delete set null,
  tags text[] not null default '{}',
  -- estado FSRS (ts-fsrs Card)
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days int not null default 0,
  scheduled_days int not null default 0,
  learning_steps int not null default 0,
  reps int not null default 0,
  lapses int not null default 0,
  state smallint not null default 0,
  last_review timestamptz,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);
create index flashcards_due_idx on public.flashcards (user_id, due) where not suspended;
create unique index flashcards_question_uniq on public.flashcards (question_id) where question_id is not null;

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.flashcards (id) on delete cascade,
  rating smallint not null,
  state smallint not null,
  due timestamptz not null,
  stability double precision not null,
  difficulty double precision not null,
  elapsed_days int not null,
  last_elapsed_days int not null,
  scheduled_days int not null,
  learning_steps int not null,
  review timestamptz not null default now()
);
create index review_logs_user_review_idx on public.review_logs (user_id, review desc);

-- ---------------------------------------------------------------------------
-- Carreira
-- ---------------------------------------------------------------------------
create type public.goal_status as enum ('active', 'done', 'paused', 'dropped');
create type public.target_kind as enum ('concurso', 'country', 'company', 'certification');
create type public.application_status as enum (
  'wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text,
  name text not null,
  description text,
  color text,
  icon text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  external_id text,
  title text not null,
  description text,
  -- "Quando X, farei Y" (Gollwitzer)
  implementation_intention text,
  target_date date,
  status public.goal_status not null default 'active',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.key_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  external_id text,
  title text not null,
  current_value numeric not null default 0,
  target_value numeric not null default 1,
  unit text,
  position int not null default 0,
  unique (user_id, external_id)
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  goal_id uuid references public.goals (id) on delete set null,
  external_id text,
  title text not null,
  notes text,
  due_date date,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  external_id text,
  kind public.target_kind not null,
  name text not null,
  location text,
  salary_text text,
  salary_value numeric,
  currency text not null default 'BRL',
  -- notas 0..10; a nota final é calculada no app com pesos editáveis
  compatibility numeric(4, 1) check (compatibility between 0 and 10),
  difficulty numeric(4, 1) check (difficulty between 0 and 10),
  salary_score numeric(4, 1) check (salary_score between 0 and 10),
  location_score numeric(4, 1) check (location_score between 0 and 10),
  status text not null default 'monitorando',
  exam_date date,
  url text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null,
  role text not null,
  country text,
  city text,
  url text,
  status public.application_status not null default 'wishlist',
  applied_at date,
  next_step text,
  next_step_at date,
  salary text,
  visa_route text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Gestão: kanban, hábitos, pomodoro, revisão semanal
-- ---------------------------------------------------------------------------
create type public.task_status as enum ('backlog', 'todo', 'doing', 'done');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  external_id text,
  title text not null,
  description text,
  status public.task_status not null default 'backlog',
  position double precision not null default 0,
  priority smallint not null default 2 check (priority between 1 and 3),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);
create index tasks_status_idx on public.tasks (user_id, status, position);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text,
  name text not null,
  cue text,
  target_per_week int not null default 7 check (target_per_week between 1 and 7),
  color text,
  archived boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  unique (habit_id, date)
);

create table public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  label text,
  started_at timestamptz not null default now(),
  duration_min int not null check (duration_min > 0)
);
create index pomodoro_user_started_idx on public.pomodoro_sessions (user_id, started_at desc);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  wins text,
  lessons text,
  blockers text,
  next_focus text,
  energy smallint check (energy between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ---------------------------------------------------------------------------
-- Finanças
-- ---------------------------------------------------------------------------
create table public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text,
  name text not null,
  target_amount numeric(14, 2) not null default 0,
  currency text not null default 'BRL',
  target_date date,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table public.fund_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fund_id uuid not null references public.funds (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null default current_date,
  note text
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  creditor text,
  original_amount numeric(14, 2) not null default 0,
  interest_rate_month numeric(6, 3) not null default 0,
  min_payment numeric(14, 2) not null default 0,
  due_day smallint check (due_day between 1 and 31),
  paid_off_at date,
  created_at timestamptz not null default now()
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null default current_date
);

create table public.planned_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  external_id text,
  name text not null,
  category text,
  amount numeric(14, 2) not null,
  currency text not null default 'BRL',
  due_date date,
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

-- ---------------------------------------------------------------------------
-- Inglês
-- ---------------------------------------------------------------------------
create type public.english_platform as enum ('times_digital_books', 'times_connected', 'other');
create type public.english_activity_kind as enum (
  'lesson', 'class', 'listening', 'speaking', 'reading', 'writing', 'vocab'
);

create table public.english_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform public.english_platform not null,
  external_ref text,
  title text not null,
  level text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, platform, external_ref)
);

create table public.english_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id uuid not null references public.english_courses (id) on delete cascade,
  external_ref text,
  title text not null,
  position int not null default 0,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  score numeric(5, 2),
  completed_at timestamptz,
  unique (course_id, external_ref)
);

create table public.english_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null default current_date,
  kind public.english_activity_kind not null,
  minutes int not null check (minutes > 0),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: dono vê e altera apenas as próprias linhas
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'questions', 'exam_presets', 'study_sessions', 'attempts',
    'decks', 'flashcards', 'review_logs',
    'tracks', 'goals', 'key_results', 'milestones', 'targets', 'applications',
    'tasks', 'habits', 'habit_logs', 'pomodoro_sessions', 'weekly_reviews',
    'funds', 'fund_entries', 'debts', 'debt_payments', 'planned_costs',
    'english_courses', 'english_units', 'english_activity'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "owner_all" on public.profiles for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Cria o perfil automaticamente no primeiro login.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Views de estatística (security_invoker respeita o RLS de quem consulta)
-- ---------------------------------------------------------------------------

-- Desempenho por assunto (últimas 50 tentativas por questão são suficientes
-- para o dashboard; aqui agregamos tudo).
create view public.subject_stats with (security_invoker = true) as
select
  q.subject_id,
  count(a.id) as attempts,
  count(a.id) filter (where a.is_correct) as correct,
  round(100.0 * count(a.id) filter (where a.is_correct) / nullif(count(a.id), 0), 1) as accuracy_pct,
  round(avg(a.time_ms) / 1000.0, 1) as avg_seconds,
  -- "successive relearning": acertou em >= 3 dias distintos
  count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date) filter (where a.is_correct) as correct_days,
  max(a.created_at) as last_attempt_at
from public.questions q
join public.attempts a on a.question_id = q.id
group by q.subject_id;

-- Domínio por questão: dominada quando acertada em 3 dias distintos e a
-- última tentativa foi correta.
create view public.question_mastery with (security_invoker = true) as
select
  a.question_id,
  count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date) filter (where a.is_correct) as correct_days,
  (array_agg(a.is_correct order by a.created_at desc))[1] as last_correct,
  count(*) as attempts
from public.attempts a
group by a.question_id;
