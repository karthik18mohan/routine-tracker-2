create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists months (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  year int not null,
  month int not null,
  notes text not null default '',
  daily_goal_target int not null default 0,
  created_at timestamptz default now(),
  unique (profile_id, year, month)
);

create table if not exists daily_habits (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  name text not null,
  goal_type text not null,
  goal_value int not null default 0,
  sort_order int not null default 0
);

create table if not exists daily_checks (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references daily_habits(id) on delete cascade,
  day int not null,
  checked boolean not null default false,
  unique (habit_id, day)
);

create table if not exists weekly_habits (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table if not exists weekly_checks (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references weekly_habits(id) on delete cascade,
  week int not null,
  checked boolean not null default false,
  unique (habit_id, week)
);

create table if not exists monthly_habits (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  name text not null,
  checked boolean not null default false,
  sort_order int not null default 0
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  sort_order int not null default 0
);

create table if not exists moods (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  day int not null,
  score int not null,
  unique (month_id, day)
);

create table if not exists journals (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  day int not null,
  entry text not null default '',
  unique (month_id, day)
);

create table if not exists weekly_goals (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  week int not null,
  text text not null,
  done boolean not null default false,
  sort_order int not null default 0
);

-- RLS is assumed disabled or configured for public access.
