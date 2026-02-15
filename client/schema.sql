-- Create tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  client text,
  status text check (status in ('active', 'completed', 'archived')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create time_logs table
create table time_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  duration int not null, -- minutes
  date date default current_date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table tasks enable row level security;
alter table time_logs enable row level security;

-- Policies for Tasks
create policy "Users can view their own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks" on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- Policies for TimeLogs
create policy "Users can view their own logs" on time_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own logs" on time_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own logs" on time_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own logs" on time_logs
  for delete using (auth.uid() = user_id);
