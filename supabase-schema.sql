create extension if not exists pgcrypto;

create or replace function public.is_ri_teacher()
returns boolean
language sql
stable
as $$
  select auth.role() = 'authenticated'
    and right(lower(coalesce(auth.jwt() ->> 'email', '')), 10) = '@ri.edu.sg';
$$;

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 200),
  author text not null check (char_length(author) <= 100),
  content text not null check (char_length(content) <= 10000),
  analysis_text text not null check (char_length(analysis_text) <= 50000),
  type text not null check (type in ('in-class', 'extra-curricular')),
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  category text not null check (category in ('思想内容', '艺术特色', '综合鉴赏')),
  name text not null check (char_length(name) <= 200),
  rubric text not null check (char_length(rubric) <= 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  excerpt text not null check (char_length(excerpt) <= 2000),
  reference_analysis text not null check (char_length(reference_analysis) <= 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  student_id text not null check (char_length(student_id) <= 128),
  student_name text not null check (char_length(student_name) <= 200),
  student_content text not null check (char_length(student_content) <= 5000),
  feedback text not null check (char_length(feedback) <= 10000),
  created_at timestamptz not null default now()
);

create index if not exists skills_work_id_created_at_idx on public.skills(work_id, created_at);
create index if not exists exercises_work_id_idx on public.exercises(work_id);
create index if not exists exercises_skill_id_idx on public.exercises(skill_id);
create index if not exists submissions_exercise_id_idx on public.submissions(exercise_id);
create index if not exists submissions_student_id_idx on public.submissions(student_id);

alter table public.works enable row level security;
alter table public.skills enable row level security;
alter table public.exercises enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Public can read works" on public.works;
create policy "Public can read works"
on public.works for select
using (true);

drop policy if exists "RI teachers can manage works" on public.works;
create policy "RI teachers can manage works"
on public.works for all
using (public.is_ri_teacher())
with check (public.is_ri_teacher());

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
on public.skills for select
using (true);

drop policy if exists "RI teachers can manage skills" on public.skills;
create policy "RI teachers can manage skills"
on public.skills for all
using (public.is_ri_teacher())
with check (public.is_ri_teacher());

drop policy if exists "Public can read exercises" on public.exercises;
create policy "Public can read exercises"
on public.exercises for select
using (true);

drop policy if exists "RI teachers can manage exercises" on public.exercises;
create policy "RI teachers can manage exercises"
on public.exercises for all
using (public.is_ri_teacher())
with check (public.is_ri_teacher());

drop policy if exists "Anyone can create submissions" on public.submissions;
create policy "Anyone can create submissions"
on public.submissions for insert
with check (true);

drop policy if exists "RI teachers can read submissions" on public.submissions;
create policy "RI teachers can read submissions"
on public.submissions for select
using (public.is_ri_teacher());
