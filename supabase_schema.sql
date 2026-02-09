-- Reset Schema
drop table if exists dataset_rows cascade;
drop table if exists datasets cascade;
drop table if exists projects cascade;

-- 1. Table Projects (Top Level)
create table projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  description text
);

-- 2. Table Datasets
create table datasets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  -- Link to Project
  project_id uuid references projects(id) on delete cascade not null,
  
  -- User Metadata
  name text,        -- User-defined name
  scan_date date,   -- User-defined date
  
  file_name text not null,
  
  -- Stores header column names
  column_headers jsonb,
  
  -- Stores the ENTIRE CSV content as a JSON array
  json_data jsonb
);

-- 4. INDEXING
create index idx_datasets_project on datasets(project_id);

-- Enable RLS (Public Access)
alter table projects enable row level security;
alter table datasets enable row level security;

-- POLICY 1: Project Security
create policy "Enable all access for projects" on projects for all using (true) with check (true);

-- POLICY 2: Dataset Security
create policy "Enable all access for datasets" on datasets for all using (true) with check (true);
