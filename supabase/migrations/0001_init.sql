-- SAPNUM platform — initial schema
-- Roles: many-to-many (a user can be simple + business + investor at once).
-- Companies: path-based (/company/[slug]), not subdomains.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users (extends auth.users) and roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  telegram_id bigint unique,
  telegram_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.user_role as enum ('simple', 'business', 'investor', 'admin');

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------------------------------------------------------------------------
-- Companies (owned by a business-role user; path-based public page /company/[slug])
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  description text,
  industry text,
  logo_url text,
  cover_url text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'admin' | 'member'
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Social graph
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- Posts / feed (Threads-like)
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  body text not null,
  media_urls text[] not null default '{}',
  quoted_post_id uuid references public.posts(id) on delete set null,
  repost_of_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.post_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Lightweight activity log for "activity on my page"
create type public.activity_type as enum ('like', 'comment', 'repost', 'follow', 'quote');

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type public.activity_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Applications: partnership / commercial offer / investment requests
-- ---------------------------------------------------------------------------

create type public.application_type as enum ('partnership', 'distributor', 'commercial_offer', 'investment');
create type public.application_status as enum ('pending', 'reviewing', 'accepted', 'rejected');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  target_company_id uuid references public.companies(id) on delete cascade,
  type public.application_type not null,
  status public.application_status not null default 'pending',
  message text not null,
  attachment_urls text[] not null default '{}', -- e.g. business plan documents
  requested_amount numeric, -- for investment applications
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index posts_author_idx on public.posts(author_id, created_at desc);
create index posts_company_idx on public.posts(company_id, created_at desc);
create index post_comments_post_idx on public.post_comments(post_id, created_at);
create index follows_following_idx on public.follows(following_id);
create index activities_recipient_idx on public.activities(recipient_id, created_at desc);
create index applications_target_idx on public.applications(target_company_id, status);
create index messages_conversation_idx on public.messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.saved_posts enable row level security;
alter table public.activities enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Profiles: publicly readable, only the owner can edit
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "roles are publicly readable" on public.user_roles for select using (true);

-- Companies: publicly readable, only owner/members can manage
create policy "companies are publicly readable" on public.companies for select using (true);
create policy "owner can insert company" on public.companies for insert with check (auth.uid() = owner_id);
create policy "owner or admin member can update company" on public.companies for update using (
  auth.uid() = owner_id or exists (
    select 1 from public.company_members m
    where m.company_id = companies.id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  )
);

create policy "company members are publicly readable" on public.company_members for select using (true);

-- Follows
create policy "follows are publicly readable" on public.follows for select using (true);
create policy "users can follow as themselves" on public.follows for insert with check (auth.uid() = follower_id);
create policy "users can unfollow themselves" on public.follows for delete using (auth.uid() = follower_id);

-- Posts
create policy "posts are publicly readable" on public.posts for select using (true);
create policy "users can create their own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "users can update their own posts" on public.posts for update using (auth.uid() = author_id);
create policy "users can delete their own posts" on public.posts for delete using (auth.uid() = author_id);

-- Likes / comments / saves
create policy "likes are publicly readable" on public.post_likes for select using (true);
create policy "users can like as themselves" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "users can unlike their own like" on public.post_likes for delete using (auth.uid() = user_id);

create policy "comments are publicly readable" on public.post_comments for select using (true);
create policy "users can comment as themselves" on public.post_comments for insert with check (auth.uid() = author_id);
create policy "users can delete their own comments" on public.post_comments for delete using (auth.uid() = author_id);

create policy "users can read their own saves" on public.saved_posts for select using (auth.uid() = user_id);
create policy "users can save as themselves" on public.saved_posts for insert with check (auth.uid() = user_id);
create policy "users can unsave their own save" on public.saved_posts for delete using (auth.uid() = user_id);

-- Activity feed: only the recipient can read their own notifications
create policy "users can read their own activity" on public.activities for select using (auth.uid() = recipient_id);

-- Applications: applicant and the target company's owner/admins can read
create policy "applicant can read own applications" on public.applications for select using (
  auth.uid() = applicant_id or exists (
    select 1 from public.company_members m
    where m.company_id = applications.target_company_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  )
);
create policy "users can submit applications as themselves" on public.applications for insert with check (auth.uid() = applicant_id);
create policy "target company admins can update application status" on public.applications for update using (
  exists (
    select 1 from public.company_members m
    where m.company_id = applications.target_company_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  )
);

-- Chat: only participants can read/write
create policy "participants can read their conversations" on public.conversations for select using (
  exists (select 1 from public.conversation_participants p where p.conversation_id = conversations.id and p.user_id = auth.uid())
);
create policy "participants can read participant list" on public.conversation_participants for select using (
  exists (select 1 from public.conversation_participants p where p.conversation_id = conversation_participants.conversation_id and p.user_id = auth.uid())
);
create policy "participants can read messages" on public.messages for select using (
  exists (select 1 from public.conversation_participants p where p.conversation_id = messages.conversation_id and p.user_id = auth.uid())
);
create policy "participants can send messages" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversation_participants p where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
  )
);
