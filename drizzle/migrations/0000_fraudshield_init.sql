create type public.app_role as enum ('admin','analyst');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account becomes admin; later accounts are analysts until promoted.
create or replace function public.assign_initial_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'analyst');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.assign_initial_role();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  txn_code text not null unique,
  account_id text not null,
  amount numeric(14,2) not null,
  txn_type text not null,
  location text not null,
  device text,
  ip_address text,
  occurred_at timestamptz not null default now(),
  fraud_probability numeric(5,2) not null,
  risk_score numeric(5,2) not null,
  is_fraud boolean not null,
  is_anomaly boolean not null default false,
  model_source text not null,
  factors jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "staff read" on public.transactions for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'analyst'));
create policy "admin insert" on public.transactions for insert to authenticated
  with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.transactions for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.transactions for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));
create index on public.transactions (occurred_at desc);

create table public.risk_settings (
  id int primary key default 1 check (id = 1),
  low_max int not null default 30,
  medium_max int not null default 70,
  updated_at timestamptz not null default now()
);
grant select, update on public.risk_settings to authenticated;
grant all on public.risk_settings to service_role;
alter table public.risk_settings enable row level security;
create policy "staff read settings" on public.risk_settings for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'analyst'));
create policy "admin update settings" on public.risk_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
insert into public.risk_settings (id) values (1);

-- Demo history: scored by the built-in rule model, labelled as such.
insert into public.transactions (txn_code, account_id, amount, txn_type, location, device, ip_address, occurred_at, fraud_probability, risk_score, is_fraud, is_anomaly, model_source, factors)
select
  'TXN' || (1000 + g),
  'ACC' || lpad(((g * 37) % 120 + 1)::text, 4, '0'),
  amt,
  (array['Card Purchase','Online Transfer','ATM Withdrawal','UPI Payment','Wire Transfer','Bill Payment'])[1 + (g % 6)],
  (array['Mumbai, IN','Delhi, IN','Bengaluru, IN','London, UK','New York, US','Lagos, NG','Singapore, SG','Dubai, AE','Chennai, IN','Moscow, RU'])[1 + ((g * 7) % 10)],
  (array['iPhone 15','Pixel 8','Windows Chrome','MacBook Safari','Unknown Device'])[1 + ((g * 3) % 5)],
  '10.' || (g % 255) || '.' || ((g * 11) % 255) || '.' || ((g * 17) % 255),
  now() - ((g * 97) % (30 * 24 * 60)) * interval '1 minute',
  score, score, score > 70, score > 80,
  'rule-model-demo',
  case when score > 70 then '["High amount vs account average","Unusual location","Late-night activity"]'::jsonb
       when score > 30 then '["Elevated amount","New device"]'::jsonb
       else '["Typical pattern"]'::jsonb end
from (
  select g,
    round((case when g % 9 = 0 then 50000 + (g * 1373) % 450000 else 200 + (g * 733) % 25000 end)::numeric, 2) as amt,
    least(99, greatest(1, case when g % 9 = 0 then 72 + (g * 13) % 27
                               when g % 4 = 0 then 32 + (g * 7) % 38
                               else 2 + (g * 5) % 28 end))::numeric as score
  from generate_series(1, 240) g
) s;