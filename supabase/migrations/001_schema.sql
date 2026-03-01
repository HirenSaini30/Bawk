-- ============================================================
-- Social Skills Platform — Full schema + RLS
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- A) profiles ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('child', 'supervisor')),
  display_name text not null,
  age_band    text check (age_band in ('7-9', '10-12', '13-15')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Allow insert during signup (the trigger or client creates the row)
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ---------- B) supervisor_child ----------
create table public.supervisor_child (
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  child_id      uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (supervisor_id, child_id)
);

alter table public.supervisor_child enable row level security;

create policy "Supervisors manage own links"
  on public.supervisor_child for all using (auth.uid() = supervisor_id);

create policy "Children see own supervisor links"
  on public.supervisor_child for select using (auth.uid() = child_id);

create index idx_sc_supervisor on public.supervisor_child(supervisor_id);
create index idx_sc_child on public.supervisor_child(child_id);

-- Deferred profile policy that depends on supervisor_child existing
create policy "Supervisors read linked children profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = profiles.id
    )
  );

-- ---------- C) goals ----------
create table public.goals (
  id              uuid primary key default gen_random_uuid(),
  supervisor_id   uuid not null references public.profiles(id) on delete cascade,
  child_id        uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text not null default '',
  category        text not null check (category in ('conversation', 'self_regulation', 'help_seeking', 'values', 'other')),
  difficulty      int not null default 1 check (difficulty between 1 and 5),
  success_criteria jsonb not null default '[]'::jsonb,
  constraints     jsonb not null default '{}'::jsonb,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Supervisors manage goals for linked children"
  on public.goals for all using (
    auth.uid() = supervisor_id
    and exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = goals.child_id
    )
  );

create policy "Children read own goals"
  on public.goals for select using (auth.uid() = child_id);

create index idx_goals_child on public.goals(child_id);
create index idx_goals_supervisor on public.goals(supervisor_id);

-- ---------- D) task_templates ----------
create table public.task_templates (
  id        uuid primary key default gen_random_uuid(),
  type      text not null check (type in ('social_story', 'roleplay', 'modeling', 'calming')),
  name      text not null,
  template  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.task_templates enable row level security;

create policy "Anyone authenticated can read templates"
  on public.task_templates for select using (auth.role() = 'authenticated');

-- ---------- E) tasks ----------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  goal_id       uuid not null references public.goals(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  child_id      uuid not null references public.profiles(id) on delete cascade,
  type          text not null check (type in ('social_story', 'roleplay', 'modeling', 'calming')),
  title         text not null,
  content       jsonb not null default '{}'::jsonb,
  ai_generated  boolean not null default true,
  status        text not null default 'draft' check (status in ('draft', 'assigned', 'archived')),
  created_at    timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Supervisors manage tasks for linked children"
  on public.tasks for all using (
    auth.uid() = supervisor_id
    and exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = tasks.child_id
    )
  );

create policy "Children read own assigned tasks"
  on public.tasks for select using (
    auth.uid() = child_id and status = 'assigned'
  );

create index idx_tasks_goal on public.tasks(goal_id);
create index idx_tasks_child on public.tasks(child_id);

-- ---------- F) assignments ----------
create table public.assignments (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid not null references public.tasks(id) on delete cascade,
  child_id        uuid not null references public.profiles(id) on delete cascade,
  scheduled_date  date not null,
  status          text not null default 'assigned' check (status in ('assigned', 'in_progress', 'completed', 'review_required')),
  completed_at    timestamptz
);

alter table public.assignments enable row level security;

create policy "Children manage own assignments"
  on public.assignments for all using (auth.uid() = child_id);

create policy "Supervisors manage assignments for linked children"
  on public.assignments for all using (
    exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = assignments.child_id
    )
  );

create index idx_assignments_child_date on public.assignments(child_id, scheduled_date);
create index idx_assignments_task on public.assignments(task_id);

-- ---------- G) submissions ----------
create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.assignments(id) on delete cascade,
  child_id        uuid not null references public.profiles(id) on delete cascade,
  input_mode      text not null check (input_mode in ('text', 'voice')),
  input_text      text,
  transcript_text text,
  ai_feedback     text,
  scores          jsonb,
  created_at      timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "Children manage own submissions"
  on public.submissions for all using (auth.uid() = child_id);

create policy "Supervisors read submissions for linked children"
  on public.submissions for select using (
    exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = submissions.child_id
    )
  );

create index idx_submissions_assignment on public.submissions(assignment_id);
create index idx_submissions_child on public.submissions(child_id);

-- ---------- H) rewards_ledger ----------
create table public.rewards_ledger (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.profiles(id) on delete cascade,
  assignment_id   uuid references public.assignments(id) on delete set null,
  xp_delta        int not null default 0,
  coins_delta     int not null default 0,
  reward_payload  jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

alter table public.rewards_ledger enable row level security;

create policy "Children read own rewards"
  on public.rewards_ledger for select using (auth.uid() = child_id);

create policy "Supervisors read rewards for linked children"
  on public.rewards_ledger for select using (
    exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = rewards_ledger.child_id
    )
  );

create index idx_rewards_child on public.rewards_ledger(child_id);

-- ---------- I) pokemon_collection ----------
create table public.pokemon_collection (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.profiles(id) on delete cascade,
  pokemon_key     text not null,
  rarity          text not null default 'common',
  level           int not null default 1,
  xp              int not null default 0,
  evolution_stage int not null default 1,
  created_at      timestamptz not null default now(),
  unique (child_id, pokemon_key)
);

alter table public.pokemon_collection enable row level security;

create policy "Children manage own pokemon"
  on public.pokemon_collection for all using (auth.uid() = child_id);

create policy "Supervisors read pokemon for linked children"
  on public.pokemon_collection for select using (
    exists (
      select 1 from public.supervisor_child sc
      where sc.supervisor_id = auth.uid() and sc.child_id = pokemon_collection.child_id
    )
  );

create index idx_pokemon_child on public.pokemon_collection(child_id);

-- ---------- J) audit_logs ----------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Only service role inserts audit logs (from FastAPI with service key)
-- Supervisors can read logs they created
create policy "Supervisors read own audit logs"
  on public.audit_logs for select using (auth.uid() = actor_id);

create index idx_audit_actor on public.audit_logs(actor_id);
create index idx_audit_target on public.audit_logs(target_type, target_id);
