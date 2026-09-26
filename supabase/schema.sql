-- StudyFlow Supabase schema
-- Uso tablas reales y normalizadas

create extension if not exists pgcrypto;

-- 1) profiles: perfiles de usuarios de la app
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  nombre text not null,
  avatar text,
  carrera text,
  ciclo text,
  rol text not null default 'usuario',
  xp integer not null default 0,
  racha integer not null default 0,
  mejor_racha integer not null default 0,
  ultima_actividad date,
  ultima_conexion timestamptz,
  activo boolean not null default true,
  silenciado_hasta timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    nombre,
    avatar,
    carrera,
    ciclo,
    rol,
    xp,
    racha,
    mejor_racha,
    ultima_actividad,
    ultima_conexion,
    activo,
    silenciado_hasta,
    created_at,
    updated_at
  ) values (
    new.id,
    coalesce(lower(new.raw_user_meta_data ->> 'username'), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar', '🙂'),
    coalesce(new.raw_user_meta_data ->> 'carrera', ''),
    coalesce(new.raw_user_meta_data ->> 'ciclo', ''),
    coalesce(new.raw_user_meta_data ->> 'rol', 'usuario'),
    0,
    0,
    0,
    null,
    now(),
    true,
    null,
    now(),
    now()
  ) on conflict (id) do update set
    username = excluded.username,
    nombre = excluded.nombre,
    avatar = coalesce(excluded.avatar, public.profiles.avatar),
    carrera = excluded.carrera,
    ciclo = excluded.ciclo,
    rol = excluded.rol,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 2) courses: cursos
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text,
  profesor text,
  color text,
  estado text not null default 'activo',
  created_at timestamptz default now()
);

-- 3) labels: etiquetas
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color text,
  created_at timestamptz default now()
);

-- 3b) schedule_blocks: horario académico fijo del ciclo
create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  dia text not null check (dia in ('lun','mar','mie','jue','vie','sab','dom')),
  hora_inicio time not null,
  hora_fin time not null,
  curso_id uuid references public.courses(id) on delete set null,
  aula text,
  fijo boolean not null default true,
  created_at timestamptz default now()
);

-- 4) tasks: tareas
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text default '',
  curso_id uuid references public.courses(id) on delete set null,
  etiqueta_id uuid references public.labels(id) on delete set null,
  fecha_entrega date,
  hora_entrega time,
  planificacion jsonb,
  creado_por uuid references auth.users(id) on delete set null,
  archivos jsonb default '[]',
  historial jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5) task_completions: usuarios que completaron cada tarea
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  completed_at timestamptz default now(),
  unique (task_id, user_id)
);

-- 6) comments: comentarios del muro de tareas
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  texto text not null,
  reportado boolean not null default false,
  fijado boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7) comment_reactions: reacciones por comentario
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (comment_id, user_id, emoji)
);

-- 8) chat_messages: chat general
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  texto text not null,
  reportado boolean not null default false,
  fijado boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9) chat_reactions: reacciones por mensaje del chat
create table if not exists public.chat_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.chat_messages(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (message_id, user_id, emoji)
);

-- 10) notifications: notificaciones del usuario
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tipo text not null default 'info',
  texto text not null,
  link text,
  leida boolean not null default false,
  created_at timestamptz default now()
);

-- 11) reports: reportes de contenido
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  ref_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  motivo text,
  resuelto boolean not null default false,
  created_at timestamptz default now()
);

-- 12) missions_claims: misiones completadas por semana
create table if not exists public.missions_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mission_id text not null,
  semana_iso text not null,
  created_at timestamptz default now(),
  unique (user_id, mission_id, semana_iso)
);

-- RLS: habilitar en todas las tablas
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.labels enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.missions_claims enable row level security;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.rol) = 'superadmin'
  );
$$;

-- Políticas RLS basadas en roles y propiedad del contenido
drop policy if exists "profiles_select_all_authenticated" on public.profiles;
create policy "profiles_select_all_authenticated"
on public.profiles
for select
using (auth.uid() is not null);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (
  id = auth.uid() and (
    rol = 'usuario' or rol = 'superadmin' or rol = 'profesor'
  )
);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "courses_read_all_authenticated" on public.courses;
create policy "courses_read_all_authenticated"
on public.courses
for select
using (auth.uid() is not null);

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write"
on public.courses
for all
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "labels_read_all_authenticated" on public.labels;
create policy "labels_read_all_authenticated"
on public.labels
for select
using (auth.uid() is not null);

drop policy if exists "labels_admin_write" on public.labels;
create policy "labels_admin_write"
on public.labels
for all
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "schedule_read_all_authenticated" on public.schedule_blocks;
create policy "schedule_read_all_authenticated"
on public.schedule_blocks
for select
using (auth.uid() is not null);

drop policy if exists "schedule_admin_write" on public.schedule_blocks;
create policy "schedule_admin_write"
on public.schedule_blocks
for all
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "tasks_read_all_authenticated" on public.tasks;
create policy "tasks_read_all_authenticated"
on public.tasks
for select
using (auth.uid() is not null);

drop policy if exists "tasks_insert_own_or_admin" on public.tasks;
create policy "tasks_insert_own_or_admin"
on public.tasks
for insert
with check (creado_por = auth.uid() or public.is_superadmin());

drop policy if exists "tasks_update_own_or_admin" on public.tasks;
create policy "tasks_update_own_or_admin"
on public.tasks
for update
using (creado_por = auth.uid() or public.is_superadmin())
with check (creado_por = auth.uid() or public.is_superadmin());

drop policy if exists "tasks_delete_own_or_admin" on public.tasks;
create policy "tasks_delete_own_or_admin"
on public.tasks
for delete
using (creado_por = auth.uid() or public.is_superadmin());

drop policy if exists "task_completions_read_all_authenticated" on public.task_completions;
create policy "task_completions_read_all_authenticated"
on public.task_completions
for select
using (auth.uid() is not null);

drop policy if exists "task_completions_insert_self" on public.task_completions;
create policy "task_completions_insert_self"
on public.task_completions
for insert
with check (user_id = auth.uid());

drop policy if exists "task_completions_delete_self" on public.task_completions;
create policy "task_completions_delete_self"
on public.task_completions
for delete
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "comments_read_all_authenticated" on public.comments;
create policy "comments_read_all_authenticated"
on public.comments
for select
using (auth.uid() is not null);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self"
on public.comments
for insert
with check (user_id = auth.uid());

drop policy if exists "comments_update_self_or_admin" on public.comments;
create policy "comments_update_self_or_admin"
on public.comments
for update
using (user_id = auth.uid() or public.is_superadmin())
with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "comments_delete_self_or_admin" on public.comments;
create policy "comments_delete_self_or_admin"
on public.comments
for delete
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "comment_reactions_read_all_authenticated" on public.comment_reactions;
create policy "comment_reactions_read_all_authenticated"
on public.comment_reactions
for select
using (auth.uid() is not null);

drop policy if exists "comment_reactions_insert_self" on public.comment_reactions;
create policy "comment_reactions_insert_self"
on public.comment_reactions
for insert
with check (user_id = auth.uid());

drop policy if exists "comment_reactions_delete_self" on public.comment_reactions;
create policy "comment_reactions_delete_self"
on public.comment_reactions
for delete
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "chat_messages_read_all_authenticated" on public.chat_messages;
create policy "chat_messages_read_all_authenticated"
on public.chat_messages
for select
using (auth.uid() is not null);

drop policy if exists "chat_messages_insert_self" on public.chat_messages;
create policy "chat_messages_insert_self"
on public.chat_messages
for insert
with check (user_id = auth.uid());

drop policy if exists "chat_messages_update_self_or_admin" on public.chat_messages;
create policy "chat_messages_update_self_or_admin"
on public.chat_messages
for update
using (user_id = auth.uid() or public.is_superadmin())
with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "chat_messages_delete_self_or_admin" on public.chat_messages;
create policy "chat_messages_delete_self_or_admin"
on public.chat_messages
for delete
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "chat_reactions_read_all_authenticated" on public.chat_reactions;
create policy "chat_reactions_read_all_authenticated"
on public.chat_reactions
for select
using (auth.uid() is not null);

drop policy if exists "chat_reactions_insert_self" on public.chat_reactions;
create policy "chat_reactions_insert_self"
on public.chat_reactions
for insert
with check (user_id = auth.uid());

drop policy if exists "chat_reactions_delete_self" on public.chat_reactions;
create policy "chat_reactions_delete_self"
on public.chat_reactions
for delete
using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "notifications_insert_own_or_admin" on public.notifications;
create policy "notifications_insert_own_or_admin"
on public.notifications
for insert
with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications
for update
using (user_id = auth.uid() or public.is_superadmin())
with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin"
on public.reports
for select
using (public.is_superadmin() or user_id = auth.uid());

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self"
on public.reports
for insert
with check (user_id = auth.uid());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
on public.reports
for update
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "missions_claims_read_all_authenticated" on public.missions_claims;
create policy "missions_claims_read_all_authenticated"
on public.missions_claims
for select
using (auth.uid() is not null);

drop policy if exists "missions_claims_insert_self" on public.missions_claims;
create policy "missions_claims_insert_self"
on public.missions_claims
for insert
with check (user_id = auth.uid());

drop policy if exists "missions_claims_delete_self" on public.missions_claims;
create policy "missions_claims_delete_self"
on public.missions_claims
for delete
using (user_id = auth.uid() or public.is_superadmin());

-- Datos fijos del horario académico del ciclo actual.
-- Este horario debe mantenerse estable y no modificarse desde la app.
insert into public.schedule_blocks (dia, hora_inicio, hora_fin, curso_id, aula)
select * from (values
  ('lun'::text, '08:00'::time, '11:00'::time, (select id from public.courses where nombre = 'Metodología de Desarrollo de Software'), 'FIS-LAB3'),
  ('lun'::text, '11:15'::time, '12:45'::time, (select id from public.courses where nombre = 'Arquitectura Tecnológica'), 'FIS306C'),
  ('lun'::text, '12:45'::time, '14:15'::time, (select id from public.courses where nombre = 'Estadística II'), 'FIS306C'),
  ('mar'::text, '09:30'::time, '11:00'::time, (select id from public.courses where nombre = 'Investigación de Operaciones'), 'FIS306C'),
  ('mar'::text, '11:15'::time, '12:45'::time, (select id from public.courses where nombre = 'Investigación de Operaciones'), 'FIS-LAB2'),
  ('mie'::text, '08:00'::time, '09:30'::time, (select id from public.courses where nombre = 'Estadística II'), 'FIS306C'),
  ('mie'::text, '09:30'::time, '11:00'::time, (select id from public.courses where nombre = 'Arquitectura Tecnológica'), 'FIS306C'),
  ('mie'::text, '11:15'::time, '13:30'::time, (select id from public.courses where nombre = 'Ingeniería del Conocimiento'), 'FIS306C'),
  ('jue'::text, '08:00'::time, '09:30'::time, (select id from public.courses where nombre = 'Estadística II'), 'FIS306C'),
  ('jue'::text, '09:30'::time, '11:00'::time, (select id from public.courses where nombre = 'Metodología de Desarrollo de Software'), 'FIS306C'),
  ('jue'::text, '11:15'::time, '12:45'::time, (select id from public.courses where nombre = 'Estructura de Datos'), 'FIS306C'),
  ('jue'::text, '12:45'::time, '14:15'::time, (select id from public.courses where nombre = 'Investigación de Operaciones'), 'FIS-LAB2'),
  ('vie'::text, '08:00'::time, '09:30'::time, (select id from public.courses where nombre = 'Estructura de Datos'), 'FIS-LAB1'),
  ('vie'::text, '11:15'::time, '12:45'::time, (select id from public.courses where nombre = 'Arquitectura Tecnológica'), 'FIS306C'),
  ('vie'::text, '12:45'::time, '14:15'::time, (select id from public.courses where nombre = 'Ingeniería del Conocimiento'), 'FIS306C')
) as v(dia, hora_inicio, hora_fin, curso_id, aula)
on conflict do nothing;