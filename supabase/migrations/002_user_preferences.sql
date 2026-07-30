-- AI Builder — ユーザーごとの履歴・設定（メール = auth.users で識別）

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  recent_ai_ids jsonb not null default '[]'::jsonb,
  recent_category_ids jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

-- 本人のみ読み書き（他ユーザーのデータは見えない）
create policy "user_preferences_all_own" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
