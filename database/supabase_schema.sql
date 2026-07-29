create extension if not exists "uuid-ossp";

create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) unique not null,
  issue_types text[] not null default '{}',
  contact_email varchar(255),
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  role varchar(50) not null,
  department_id uuid references departments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  photo_url text not null,
  lat double precision not null,
  lng double precision not null,
  description text,
  hazard_type varchar(100) not null,
  severity varchar(20) not null,
  confidence double precision not null,
  department_id uuid references departments(id) on delete set null,
  dengue_risk varchar(20) not null,
  status varchar(30) not null default 'Reported',
  is_duplicate_of uuid references reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists status_log (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  changed_by uuid not null references users(id) on delete restrict,
  old_status varchar(30) not null,
  new_status varchar(30) not null,
  changed_at timestamptz not null default now()
);

create table if not exists predictions (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports(id) on delete set null,
  image_url text not null,
  hazard_type varchar(100) not null,
  severity varchar(20) not null,
  confidence double precision not null,
  model_name varchar(100) not null,
  raw_output text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_department_id on reports(department_id);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_risk on reports(dengue_risk);
create index if not exists idx_status_log_report_id on status_log(report_id);
create index if not exists idx_predictions_report_id on predictions(report_id);
