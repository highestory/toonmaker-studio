-- Projects Table
create table projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Episodes Table
create table episodes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  status text default 'draft', -- draft, completed
  script_content text, -- JSON or text content of the script
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Assets Table (Optional for now, can store URLs in episodes)
create table assets (
  id uuid default gen_random_uuid() primary key,
  episode_id uuid references episodes(id) on delete cascade not null,
  url text not null,
  type text not null, -- image, background, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
