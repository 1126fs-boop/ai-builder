-- AI Builder v2.0 — 株式会社ワム 営業チーム向けスキーマ
-- Supabase SQL Editor または supabase db push で実行

-- ── プロフィール（auth.users 拡張） ──
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 新規ユーザー登録時に profiles 自動作成
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 保存 AI（ユーザーごと） ──
create table if not exists public.saved_ais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  category_label text not null default '',
  prompt text not null,
  answers jsonb not null default '{}',
  quality jsonb,
  is_favorite boolean not null default false,
  version text not null default '2.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_ais_user_id_idx on public.saved_ais(user_id);
create index if not exists saved_ais_created_at_idx on public.saved_ais(created_at desc);

-- ── 共通テンプレート ──
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text,
  prompt_body text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_category_idx on public.templates(category) where is_active = true;

-- ── 商品マスタ（管理者管理） ──
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default '',
  description text not null default '',
  official_url text not null default '',
  official_image_url text,
  has_official_image boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- ── updated_at 自動更新 ──
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger saved_ais_updated_at before update on public.saved_ais
  for each row execute function public.set_updated_at();
create trigger templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ── RLS 有効化 ──
alter table public.profiles enable row level security;
alter table public.saved_ais enable row level security;
alter table public.templates enable row level security;
alter table public.products enable row level security;

-- profiles: 本人読取、admin 全件読取
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- saved_ais: 本人のみ
create policy "saved_ais_all_own" on public.saved_ais
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- templates: 全員読取（active）、admin CRUD
create policy "templates_select_active" on public.templates
  for select using (is_active = true or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "templates_admin_all" on public.templates
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- products: 全員読取（active）、admin CRUD
create policy "products_select_active" on public.products
  for select using (is_active = true or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "products_admin_all" on public.products
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── 初期商品データ（公式HP準拠） ──
insert into public.products (id, name, category, description, official_url, official_image_url, has_official_image, sort_order) values
  ('hyperknife_ex', 'ハイパーナイフEX2', '業務用エステ機器', 'ハイパーナイフシリーズ最上位機種。', 'https://wamu-gr.co.jp/product/hyperknife_ex/', 'https://wamu-gr.co.jp/product/hyperknife_ex/images/topimg.jpg', true, 1),
  ('hyperknife', 'ハイパーナイフ7', '業務用エステ機器', '1MHzの高周波による温めとほぐしで脂肪を撃退する業務用痩身マシン。', 'https://wamu-gr.co.jp/product/hyperknife/', 'https://wamu-gr.co.jp/product/hyperknife/images/topimg.jpg', true, 2),
  ('hypershape', 'ハイパーシェイプ', '業務用エステ機器', '吸引ともみほぐしでセルライトを徹底ケア。', 'https://wamu-gr.co.jp/product/hypershape/', 'https://wamu-gr.co.jp/product/hypershape/images/topimg.jpg', true, 3),
  ('hyperwave', 'ハイパーウェーブ', '業務用エステ機器', 'EMSで筋肉を刺激し基礎代謝を向上。', 'https://wamu-gr.co.jp/product/hyperwave/', 'https://wamu-gr.co.jp/product/hyperwave/images/topimg.jpg', true, 4),
  ('hyperradion', 'ハイパーラディオンプレミアム', '業務用エステ機器', '温熱・電位・ホルミシスのトリプル効果。', 'https://wamu-gr.co.jp/product/hyperradion/', null, false, 5),
  ('dmk', 'DMK+', 'インナーケア商品', '水溶性ケイ素サプリメント。', 'https://wamu-gr.co.jp/product/dmk/', null, false, 10),
  ('dmk_stick', 'DMK stick', 'インナーケア商品', '持ち運び便利なスティック型。', 'https://wamu-gr.co.jp/product/dmk_stick/', null, false, 11)
on conflict (id) do nothing;

-- ── 初期共通テンプレート ──
insert into public.templates (category, name, description, prompt_body, sort_order) values
  ('sales', '新規開拓 — テレアポ標準', '新規サロンへの初回アプローチ用', '経営課題への共感から入り、30秒以内にアポイントを獲得する台本を作成してください。', 1),
  ('sales', '既存フォロー — リピート発注', '既存取引先へのフォロー連絡用', '前回の課題進捗を確認し、追加提案につなげるフォロー文案を作成してください。', 2),
  ('proposal', 'ソリューション提案書 — 標準構成', 'BtoB提案書の基本テンプレート', 'Before/After/施策/期待効果/導入ステップの構成で提案書を作成してください。', 1);
