-- =============================================
-- LuliTracker v2 - Project-Centric Schema
-- =============================================

-- Projects table (main entity)
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  color text default '#6366f1', -- for UI distinction
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Time entries table (replaces time_logs, now project-centric)
create table time_entries (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  action_type text not null, -- 'LLAMADO', 'REUNION', 'VISITA', or custom
  duration_minutes int not null, -- total minutes (hours*60 + minutes)
  notes text,
  entry_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table projects enable row level security;
alter table time_entries enable row level security;

-- Policies for Projects
create policy "Users can view their own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users can insert their own projects" on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects" on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects" on projects
  for delete using (auth.uid() = user_id);

-- Policies for TimeEntries
create policy "Users can view their own time entries" on time_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own time entries" on time_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own time entries" on time_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own time entries" on time_entries
  for delete using (auth.uid() = user_id);

-- Index for faster queries
create index time_entries_project_id_idx on time_entries(project_id);
create index time_entries_entry_date_idx on time_entries(entry_date);
