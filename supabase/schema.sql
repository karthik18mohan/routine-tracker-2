create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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

alter table profiles enable row level security;
alter table months enable row level security;
alter table daily_habits enable row level security;
alter table daily_checks enable row level security;
alter table weekly_habits enable row level security;
alter table weekly_checks enable row level security;
alter table monthly_habits enable row level security;
alter table goals enable row level security;
alter table moods enable row level security;
alter table journals enable row level security;
alter table weekly_goals enable row level security;

create policy "Profiles are owned by user"
  on profiles
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Months are owned by profile owner"
  on months
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = months.profile_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = months.profile_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Daily habits follow profile ownership"
  on daily_habits
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = daily_habits.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = daily_habits.month_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Daily checks follow profile ownership"
  on daily_checks
  for all
  using (
    exists (
      select 1
      from daily_habits
      join months on months.id = daily_habits.month_id
      join profiles on profiles.id = months.profile_id
      where daily_habits.id = daily_checks.habit_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from daily_habits
      join months on months.id = daily_habits.month_id
      join profiles on profiles.id = months.profile_id
      where daily_habits.id = daily_checks.habit_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Weekly habits follow profile ownership"
  on weekly_habits
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = weekly_habits.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = weekly_habits.month_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Weekly checks follow profile ownership"
  on weekly_checks
  for all
  using (
    exists (
      select 1
      from weekly_habits
      join months on months.id = weekly_habits.month_id
      join profiles on profiles.id = months.profile_id
      where weekly_habits.id = weekly_checks.habit_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from weekly_habits
      join months on months.id = weekly_habits.month_id
      join profiles on profiles.id = months.profile_id
      where weekly_habits.id = weekly_checks.habit_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Monthly habits follow profile ownership"
  on monthly_habits
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = monthly_habits.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = monthly_habits.month_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Goals follow profile ownership"
  on goals
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = goals.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = goals.month_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Moods follow profile ownership"
  on moods
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = moods.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = moods.month_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Journals follow profile ownership"
  on journals
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = journals.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = journals.month_id
      and profiles.owner_id = auth.uid()
    )
  );

create policy "Weekly goals follow profile ownership"
  on weekly_goals
  for all
  using (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = weekly_goals.month_id
      and profiles.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from months
      join profiles on profiles.id = months.profile_id
      where months.id = weekly_goals.month_id
      and profiles.owner_id = auth.uid()
    )
  );
