-- StudyFlow Supabase schema
-- 1) app_state: guarda el estado completo de la app en JSON
create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- 2) profiles: perfiles de usuarios de la app
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

-- 3) courses: cursos
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text,
  profesor text,
  color text,
  estado text not null default 'activo',
  created_at timestamptz default now()
);

-- 4) labels: etiquetas
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color text,
  created_at timestamptz default now()
);

-- 5) tasks: tareas
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
  completado_por jsonb default '{}',
  archivos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6) comments: comentarios del muro de tareas
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  texto text not null,
  reacciones jsonb default '{}',
  reportado boolean not null default false,
  fijado boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7) chat_messages: chat general
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  texto text not null,
  reacciones jsonb default '{}',
  reportado boolean not null default false,
  fijado boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8) notifications: notificaciones del usuario
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tipo text not null default 'info',
  texto text not null,
  link text,
  leida boolean not null default false,
  created_at timestamptz default now()
);

-- 9) reports: reportes de contenido
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  ref_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  motivo text,
  resuelto boolean not null default false,
  created_at timestamptz default now()
);

-- 10) missions_claims: misiones completadas por semana
create table if not exists public.missions_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mission_id text not null,
  semana_iso text not null,
  created_at timestamptz default now(),
  unique (user_id, mission_id, semana_iso)
);

-- Datos base en la app_state para que la app siga funcionando mientras migra
insert into public.app_state (id, payload)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- RLS básico para permitir lectura/escritura en entorno de prueba
alter table public.app_state enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.labels enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.missions_claims enable row level security;

create policy if not exists "app_state_read_write" on public.app_state for all using (true) with check (true);
create policy if not exists "profiles_read_write" on public.profiles for all using (true) with check (true);
create policy if not exists "courses_read_write" on public.courses for all using (true) with check (true);
create policy if not exists "labels_read_write" on public.labels for all using (true) with check (true);
create policy if not exists "tasks_read_write" on public.tasks for all using (true) with check (true);
create policy if not exists "comments_read_write" on public.comments for all using (true) with check (true);
create policy if not exists "chat_messages_read_write" on public.chat_messages for all using (true) with check (true);
create policy if not exists "notifications_read_write" on public.notifications for all using (true) with check (true);
create policy if not exists "reports_read_write" on public.reports for all using (true) with check (true);
create policy if not exists "missions_claims_read_write" on public.missions_claims for all using (true) with check (true);
