-- Users / profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  city_tier text check (city_tier in ('metro','tier2','tier3')),
  age_group text check (age_group in ('18-24','25-34','35-44','45+')),
  vibe text check (vibe in ('deal_hunter','trendy','home_lover','gadget_freak')),
  preferred_language text default 'en',
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

-- Videos / product catalog
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  thumbnail_url text,
  title text not null,
  title_hi text,
  description text,
  description_hi text,
  price numeric(10,2) not null,
  original_price numeric(10,2) not null,
  product_tags text[] default '{}',
  gemini_tags text[] default '{}',
  category text,
  seller_name text default 'Reelmart Seller',
  likes_count integer default 0,
  language text default 'en',
  city_relevance text[] default '{}',
  vibe_relevance text[] default '{}',
  mandli_eligible boolean default false,
  mandli_min_count integer default 5,
  mandli_discount_percent numeric(5,2) default 10,
  created_at timestamptz default now()
);

-- User behavior signals
create table if not exists public.behavior_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  watch_percent numeric(5,2) default 0,
  replayed boolean default false,
  liked boolean default false,
  shared boolean default false,
  added_to_cart boolean default false,
  swiped_off_fast boolean default false,
  created_at timestamptz default now(),
  unique(user_id, video_id)
);

-- Cart
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  quantity integer default 1,
  created_at timestamptz default now(),
  unique(user_id, video_id)
);

-- Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  items jsonb not null,
  address jsonb not null,
  total_amount numeric(10,2) not null,
  status text default 'placed' check (status in ('placed','confirmed','shipped','delivered')),
  order_type text default 'solo' check (order_type in ('solo','mandli')),
  mandli_session_id uuid,
  created_at timestamptz default now()
);

-- Mandli sessions (group buying)
create table if not exists public.mandli_sessions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.videos(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete cascade,
  original_price numeric(10,2) not null,
  current_price numeric(10,2) not null,
  target_count integer not null,
  current_count integer default 1,
  discount_percent numeric(5,2) not null,
  expires_at timestamptz not null,
  status text default 'open' check (status in ('open','success','expired')),
  created_at timestamptz default now()
);

-- Mandli participants
create table if not exists public.mandli_participants (
  id uuid primary key default gen_random_uuid(),
  mandli_id uuid references public.mandli_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(mandli_id, user_id)
);

-- Seed videos
insert into public.videos (url, thumbnail_url, title, title_hi, price, original_price, product_tags, category, seller_name, likes_count, mandli_eligible, mandli_min_count, mandli_discount_percent, vibe_relevance, city_relevance)
values
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://picsum.photos/seed/v1/400/700',
    'Trendy Kurti Set - Floral Print',
    'ट्रेंडी कुर्ती सेट - Floral Print',
    499, 999,
    ARRAY['kurti','fashion','women','floral'],
    'fashion',
    'Meena Fashion',
    1240,
    true, 5, 20,
    ARRAY['trendy','deal_hunter'],
    ARRAY['metro','tier2']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://picsum.photos/seed/v2/400/700',
    'Non-Stick Kadai 3L - Kitchen Essential',
    'Non-Stick कड़ाई 3L - रसोई के लिए',
    799, 1499,
    ARRAY['kitchen','cookware','kadai','home'],
    'kitchen',
    'Bharat Kitchen Co',
    892,
    true, 4, 15,
    ARRAY['home_lover'],
    ARRAY['metro','tier2','tier3']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://picsum.photos/seed/v3/400/700',
    'TWS Earbuds - 40hr Battery',
    'TWS Earbuds - 40 घंटे Battery',
    1299, 2999,
    ARRAY['earbuds','electronics','audio','gadget'],
    'electronics',
    'TechZone India',
    3100,
    true, 6, 25,
    ARRAY['gadget_freak','trendy'],
    ARRAY['metro','tier2']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://picsum.photos/seed/v4/400/700',
    'Printed Bedsheet Set - King Size',
    'Printed Bedsheet Set - King Size',
    699, 1299,
    ARRAY['bedsheet','home','decor','bedroom'],
    'home_decor',
    'Ghar Sajavat',
    567,
    false, 5, 10,
    ARRAY['home_lover','deal_hunter'],
    ARRAY['metro','tier2','tier3']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://picsum.photos/seed/v5/400/700',
    'Smartwatch - Health Tracker Desi Style',
    'Smartwatch - Health Tracker',
    1999, 4999,
    ARRAY['smartwatch','fitness','gadget','wearable'],
    'electronics',
    'WristTech India',
    2200,
    true, 5, 20,
    ARRAY['gadget_freak'],
    ARRAY['metro']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'https://picsum.photos/seed/v6/400/700',
    'Saree - Pure Cotton Handloom',
    'साड़ी - शुद्ध कॉटन Handloom',
    1199, 2499,
    ARRAY['saree','fashion','women','handloom','cotton'],
    'fashion',
    'Silk Route India',
    1890,
    true, 5, 15,
    ARRAY['trendy','home_lover'],
    ARRAY['metro','tier2','tier3']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://picsum.photos/seed/v7/400/700',
    'LED String Lights 10m - Diwali Special',
    'LED String Lights 10m - Diwali Special',
    349, 699,
    ARRAY['lights','decor','diwali','home','festive'],
    'home_decor',
    'Roshan Décor',
    4500,
    true, 8, 30,
    ARRAY['home_lover','deal_hunter'],
    ARRAY['metro','tier2','tier3']
  ),
  (
    'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    'https://picsum.photos/seed/v8/400/700',
    'Wireless Charger 15W - Fast Charge',
    'Wireless Charger 15W - Fast Charge',
    599, 1299,
    ARRAY['charger','mobile','gadget','electronics'],
    'electronics',
    'PowerUp India',
    987,
    false, 5, 10,
    ARRAY['gadget_freak','trendy'],
    ARRAY['metro','tier2']
  );
