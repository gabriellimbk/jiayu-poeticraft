-- PoetiCraft AI single-table setup.
-- Run this in Supabase SQL Editor after creating public."CL_JIAYU_POETICRAFT".
-- Your table may already have id int8 and created_at timestamptz; this script keeps them.

create or replace function public.is_ri_teacher()
returns boolean
language sql
stable
as $$
  select auth.role() = 'authenticated'
    and right(lower(coalesce(auth.jwt() ->> 'email', '')), 10) = '@ri.edu.sg';
$$;

alter table public."CL_JIAYU_POETICRAFT"
  add column if not exists record_type text,
  add column if not exists work_id bigint,
  add column if not exists skill_id bigint,
  add column if not exists exercise_id bigint,
  add column if not exists title text,
  add column if not exists author text,
  add column if not exists content text,
  add column if not exists analysis_text text,
  add column if not exists work_type text,
  add column if not exists category text,
  add column if not exists name text,
  add column if not exists rubric text,
  add column if not exists excerpt text,
  add column if not exists reference_analysis text,
  add column if not exists student_id text,
  add column if not exists student_name text,
  add column if not exists student_content text,
  add column if not exists feedback text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cl_jiayu_poeticraft_record_type_check'
  ) then
    alter table public."CL_JIAYU_POETICRAFT"
      add constraint cl_jiayu_poeticraft_record_type_check
      check (record_type in ('work', 'skill', 'exercise', 'submission'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cl_jiayu_poeticraft_work_type_check'
  ) then
    alter table public."CL_JIAYU_POETICRAFT"
      add constraint cl_jiayu_poeticraft_work_type_check
      check (work_type is null or work_type in ('in-class', 'extra-curricular'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cl_jiayu_poeticraft_category_check'
  ) then
    alter table public."CL_JIAYU_POETICRAFT"
      add constraint cl_jiayu_poeticraft_category_check
      check (category is null or category in ('思想内容', '艺术特色', '综合鉴赏'));
  end if;
end $$;

create index if not exists cl_jiayu_poeticraft_record_type_created_at_idx
on public."CL_JIAYU_POETICRAFT"(record_type, created_at);

create index if not exists cl_jiayu_poeticraft_work_id_idx
on public."CL_JIAYU_POETICRAFT"(work_id);

create index if not exists cl_jiayu_poeticraft_skill_id_idx
on public."CL_JIAYU_POETICRAFT"(skill_id);

create index if not exists cl_jiayu_poeticraft_exercise_id_idx
on public."CL_JIAYU_POETICRAFT"(exercise_id);

create index if not exists cl_jiayu_poeticraft_student_id_idx
on public."CL_JIAYU_POETICRAFT"(student_id);

alter table public."CL_JIAYU_POETICRAFT" enable row level security;

drop policy if exists "PoetiCraft public read learning content" on public."CL_JIAYU_POETICRAFT";
create policy "PoetiCraft public read learning content"
on public."CL_JIAYU_POETICRAFT" for select
using (record_type in ('work', 'skill', 'exercise') or public.is_ri_teacher());

drop policy if exists "PoetiCraft public create submissions" on public."CL_JIAYU_POETICRAFT";
create policy "PoetiCraft public create submissions"
on public."CL_JIAYU_POETICRAFT" for insert
with check (record_type = 'submission' or public.is_ri_teacher());

drop policy if exists "PoetiCraft RI teachers update rows" on public."CL_JIAYU_POETICRAFT";
create policy "PoetiCraft RI teachers update rows"
on public."CL_JIAYU_POETICRAFT" for update
using (public.is_ri_teacher())
with check (public.is_ri_teacher());

drop policy if exists "PoetiCraft RI teachers delete rows" on public."CL_JIAYU_POETICRAFT";
create policy "PoetiCraft RI teachers delete rows"
on public."CL_JIAYU_POETICRAFT" for delete
using (public.is_ri_teacher());
