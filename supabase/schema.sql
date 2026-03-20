create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type public.user_role as enum ('member', 'moderator', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_type as enum (
    'reflection',
    'testimony',
    'prayer_request',
    'gratitude',
    'verse_of_day',
    'short_devotional',
    'sisterly_advice'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.reaction_type as enum ('amen', 'inspired', 'with_you', 'praying');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.prayer_visibility as enum ('public', 'group');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.prayer_status as enum ('active', 'answered');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.group_role as enum ('member', 'moderator', 'owner');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum (
    'new_follower',
    'post_comment',
    'post_reaction',
    'prayer_response',
    'group_invite',
    'group_post',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');
exception
  when duplicate_object then null;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'member'::public.user_role
  );
$$;

create or replace function public.is_admin_or_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin'::public.user_role, 'moderator'::public.user_role);
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_manager(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner'::public.group_role, 'moderator'::public.group_role)
  ) or public.is_admin_or_moderator();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  display_name text,
  username citext unique,
  avatar_url text,
  bio text,
  denomination text,
  church_name text,
  location text,
  favorite_verse text,
  interests text[] not null default '{}',
  role public.user_role not null default 'member',
  is_onboarding_complete boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  description text not null,
  cover_image_url text,
  interest_tag text,
  is_private boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default timezone('utc'::text, now()),
  primary key (group_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  type public.post_type not null default 'reflection',
  content text not null,
  image_url text,
  bible_verse text,
  category text,
  is_private boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint posts_content_length check (char_length(content) between 3 and 3000)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint post_comments_content_length check (char_length(content) between 2 and 1200)
);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction public.reaction_type not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

create table if not exists public.saved_posts (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  title text not null,
  description text not null,
  visibility public.prayer_visibility not null default 'public',
  status public.prayer_status not null default 'active',
  support_count integer not null default 0,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint prayer_title_length check (char_length(title) between 3 and 160),
  constraint prayer_description_length check (char_length(description) between 10 and 3000)
);

create table if not exists public.prayer_support (
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (prayer_request_id, user_id)
);

create table if not exists public.prayer_comments (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint prayer_comments_content_length check (char_length(content) between 2 and 1200)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type public.notification_type not null,
  entity_type text,
  entity_id uuid,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete set null,
  post_id uuid references public.posts (id) on delete set null,
  prayer_request_id uuid references public.prayer_requests (id) on delete set null,
  group_id uuid references public.groups (id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.devotional_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text not null,
  body text not null,
  kind text not null,
  verse_reference text,
  image_url text,
  published_on date not null default current_date,
  is_featured boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.direct_message_threads (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references public.profiles (id) on delete cascade,
  participant_two_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint direct_message_participants_unique unique (
    least(participant_one_id, participant_two_id),
    greatest(participant_one_id, participant_two_id)
  ),
  check (participant_one_id <> participant_two_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.direct_message_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint direct_messages_content_length check (char_length(content) between 1 and 4000)
);

create or replace view public.group_posts as
select *
from public.posts
where group_id is not null;

create index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_follows_following on public.follows (following_id);
create index if not exists idx_blocks_blocked on public.blocks (blocked_id);
create index if not exists idx_groups_slug on public.groups (slug);
create index if not exists idx_group_members_user on public.group_members (user_id);
create index if not exists idx_posts_author_created_at on public.posts (author_id, created_at desc);
create index if not exists idx_posts_group_created_at on public.posts (group_id, created_at desc);
create index if not exists idx_post_comments_post_created_at on public.post_comments (post_id, created_at desc);
create index if not exists idx_prayer_requests_author_created_at on public.prayer_requests (author_id, created_at desc);
create index if not exists idx_prayer_requests_group_created_at on public.prayer_requests (group_id, created_at desc);
create index if not exists idx_notifications_recipient_created_at on public.notifications (recipient_id, created_at desc);
create index if not exists idx_reports_status_created_at on public.reports (status, created_at desc);
create index if not exists idx_devotional_content_published_on on public.devotional_content (published_on desc);

create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute procedure public.touch_updated_at();

create trigger groups_touch_updated_at
before update on public.groups
for each row
execute procedure public.touch_updated_at();

create trigger posts_touch_updated_at
before update on public.posts
for each row
execute procedure public.touch_updated_at();

create trigger post_comments_touch_updated_at
before update on public.post_comments
for each row
execute procedure public.touch_updated_at();

create trigger prayer_requests_touch_updated_at
before update on public.prayer_requests
for each row
execute procedure public.touch_updated_at();

create trigger prayer_comments_touch_updated_at
before update on public.prayer_comments
for each row
execute procedure public.touch_updated_at();

create trigger devotional_content_touch_updated_at
before update on public.devotional_content
for each row
execute procedure public.touch_updated_at();

create trigger direct_message_threads_touch_updated_at
before update on public.direct_message_threads
for each row
execute procedure public.touch_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.refresh_prayer_support_count()
returns trigger
language plpgsql
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.prayer_request_id, old.prayer_request_id);

  update public.prayer_requests
  set support_count = (
    select count(*)
    from public.prayer_support ps
    where ps.prayer_request_id = target_id
  )
  where id = target_id;

  return coalesce(new, old);
end;
$$;

create trigger prayer_support_refresh_count_insert
after insert on public.prayer_support
for each row
execute procedure public.refresh_prayer_support_count();

create trigger prayer_support_refresh_count_delete
after delete on public.prayer_support
for each row
execute procedure public.refresh_prayer_support_count();

create or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  if new.follower_id = new.following_id then
    return new;
  end if;

  select coalesce(display_name, split_part(email::text, '@', 1))
  into actor_name
  from public.profiles
  where id = new.follower_id;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    message
  )
  values (
    new.following_id,
    new.follower_id,
    'new_follower',
    'profile',
    new.follower_id,
    coalesce(actor_name, 'Una hermana') || ' comenzó a seguirte.'
  );

  return new;
end;
$$;

create or replace function public.create_post_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author uuid;
  actor_name text;
begin
  select author_id into target_author
  from public.posts
  where id = new.post_id;

  if target_author is null or target_author = new.author_id then
    return new;
  end if;

  select coalesce(display_name, split_part(email::text, '@', 1))
  into actor_name
  from public.profiles
  where id = new.author_id;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    message
  )
  values (
    target_author,
    new.author_id,
    'post_comment',
    'post',
    new.post_id,
    coalesce(actor_name, 'Una hermana') || ' comentó tu publicación.'
  );

  return new;
end;
$$;

create or replace function public.create_prayer_support_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author uuid;
  actor_name text;
begin
  select author_id into target_author
  from public.prayer_requests
  where id = new.prayer_request_id;

  if target_author is null or target_author = new.user_id then
    return new;
  end if;

  select coalesce(display_name, split_part(email::text, '@', 1))
  into actor_name
  from public.profiles
  where id = new.user_id;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    message
  )
  values (
    target_author,
    new.user_id,
    'prayer_response',
    'prayer_request',
    new.prayer_request_id,
    coalesce(actor_name, 'Una hermana') || ' indicó que está orando por vos.'
  );

  return new;
end;
$$;

drop trigger if exists follows_create_notification on public.follows;
create trigger follows_create_notification
after insert on public.follows
for each row
execute procedure public.create_follow_notification();

drop trigger if exists post_comments_create_notification on public.post_comments;
create trigger post_comments_create_notification
after insert on public.post_comments
for each row
execute procedure public.create_post_comment_notification();

drop trigger if exists prayer_support_create_notification on public.prayer_support;
create trigger prayer_support_create_notification
after insert on public.prayer_support
for each row
execute procedure public.create_prayer_support_notification();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.saved_posts enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.prayer_support enable row level security;
alter table public.prayer_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.devotional_content enable row level security;
alter table public.direct_message_threads enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin_or_moderator())
with check (auth.uid() = id or public.is_admin_or_moderator());

drop policy if exists "follows_select" on public.follows;
create policy "follows_select"
on public.follows
for select
to authenticated
using (true);

drop policy if exists "follows_insert" on public.follows;
create policy "follows_insert"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "follows_delete" on public.follows;
create policy "follows_delete"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id or public.is_admin_or_moderator());

drop policy if exists "blocks_select" on public.blocks;
create policy "blocks_select"
on public.blocks
for select
to authenticated
using (auth.uid() = blocker_id or public.is_admin_or_moderator());

drop policy if exists "blocks_insert" on public.blocks;
create policy "blocks_insert"
on public.blocks
for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete" on public.blocks;
create policy "blocks_delete"
on public.blocks
for delete
to authenticated
using (auth.uid() = blocker_id or public.is_admin_or_moderator());

drop policy if exists "groups_select" on public.groups;
create policy "groups_select"
on public.groups
for select
to authenticated
using (
  not is_private
  or created_by = auth.uid()
  or public.is_group_member(id)
  or public.is_admin_or_moderator()
);

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert"
on public.groups
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "groups_update" on public.groups;
create policy "groups_update"
on public.groups
for update
to authenticated
using (created_by = auth.uid() or public.is_group_manager(id))
with check (created_by = auth.uid() or public.is_group_manager(id));

drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select"
on public.group_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_manager(group_id)
  or exists (
    select 1 from public.groups g
    where g.id = group_id and g.is_private = false
  )
);

drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert"
on public.group_members
for insert
to authenticated
with check (
  public.is_admin_or_moderator()
  or public.is_group_manager(group_id)
  or (
    auth.uid() = user_id
    and exists (
      select 1 from public.groups g
      where g.id = group_id
        and g.is_private = false
    )
  )
);

drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete"
on public.group_members
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
);

drop policy if exists "posts_select" on public.posts;
create policy "posts_select"
on public.posts
for select
to authenticated
using (
  author_id = auth.uid()
  or public.is_admin_or_moderator()
  or (
    group_id is null
    and is_private = false
  )
  or (
    group_id is not null
    and public.is_group_member(group_id)
  )
);

drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert"
on public.posts
for insert
to authenticated
with check (
  auth.uid() = author_id
  and (
    group_id is null
    or public.is_group_member(group_id)
  )
);

drop policy if exists "posts_update" on public.posts;
create policy "posts_update"
on public.posts
for update
to authenticated
using (
  author_id = auth.uid()
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
)
with check (
  author_id = auth.uid()
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
);

drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete"
on public.posts
for delete
to authenticated
using (
  author_id = auth.uid()
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
);

drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select"
on public.post_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (
        p.author_id = auth.uid()
        or public.is_admin_or_moderator()
        or (p.group_id is null and p.is_private = false)
        or (p.group_id is not null and public.is_group_member(p.group_id))
      )
  )
);

drop policy if exists "post_comments_insert" on public.post_comments;
create policy "post_comments_insert"
on public.post_comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (
        p.author_id = auth.uid()
        or public.is_admin_or_moderator()
        or (p.group_id is null and p.is_private = false)
        or (p.group_id is not null and public.is_group_member(p.group_id))
      )
  )
);

drop policy if exists "post_comments_update" on public.post_comments;
create policy "post_comments_update"
on public.post_comments
for update
to authenticated
using (auth.uid() = author_id or public.is_admin_or_moderator())
with check (auth.uid() = author_id or public.is_admin_or_moderator());

drop policy if exists "post_comments_delete" on public.post_comments;
create policy "post_comments_delete"
on public.post_comments
for delete
to authenticated
using (auth.uid() = author_id or public.is_admin_or_moderator());

drop policy if exists "post_reactions_select" on public.post_reactions;
create policy "post_reactions_select"
on public.post_reactions
for select
to authenticated
using (true);

drop policy if exists "post_reactions_insert" on public.post_reactions;
create policy "post_reactions_insert"
on public.post_reactions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (
        p.author_id = auth.uid()
        or public.is_admin_or_moderator()
        or (p.group_id is null and p.is_private = false)
        or (p.group_id is not null and public.is_group_member(p.group_id))
      )
  )
);

drop policy if exists "post_reactions_update" on public.post_reactions;
create policy "post_reactions_update"
on public.post_reactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "post_reactions_delete" on public.post_reactions;
create policy "post_reactions_delete"
on public.post_reactions
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "saved_posts_select" on public.saved_posts;
create policy "saved_posts_select"
on public.saved_posts
for select
to authenticated
using (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "saved_posts_insert" on public.saved_posts;
create policy "saved_posts_insert"
on public.saved_posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "saved_posts_delete" on public.saved_posts;
create policy "saved_posts_delete"
on public.saved_posts
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "prayer_requests_select" on public.prayer_requests;
create policy "prayer_requests_select"
on public.prayer_requests
for select
to authenticated
using (
  author_id = auth.uid()
  or public.is_admin_or_moderator()
  or visibility = 'public'
  or (group_id is not null and public.is_group_member(group_id))
);

drop policy if exists "prayer_requests_insert" on public.prayer_requests;
create policy "prayer_requests_insert"
on public.prayer_requests
for insert
to authenticated
with check (
  auth.uid() = author_id
  and (
    group_id is null
    or public.is_group_member(group_id)
  )
);

drop policy if exists "prayer_requests_update" on public.prayer_requests;
create policy "prayer_requests_update"
on public.prayer_requests
for update
to authenticated
using (
  auth.uid() = author_id
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
)
with check (
  auth.uid() = author_id
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
);

drop policy if exists "prayer_requests_delete" on public.prayer_requests;
create policy "prayer_requests_delete"
on public.prayer_requests
for delete
to authenticated
using (
  auth.uid() = author_id
  or public.is_group_manager(group_id)
  or public.is_admin_or_moderator()
);

drop policy if exists "prayer_support_select" on public.prayer_support;
create policy "prayer_support_select"
on public.prayer_support
for select
to authenticated
using (true);

drop policy if exists "prayer_support_insert" on public.prayer_support;
create policy "prayer_support_insert"
on public.prayer_support
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prayer_requests pr
    where pr.id = prayer_request_id
      and (
        pr.author_id = auth.uid()
        or public.is_admin_or_moderator()
        or pr.visibility = 'public'
        or (pr.group_id is not null and public.is_group_member(pr.group_id))
      )
  )
);

drop policy if exists "prayer_support_delete" on public.prayer_support;
create policy "prayer_support_delete"
on public.prayer_support
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "prayer_comments_select" on public.prayer_comments;
create policy "prayer_comments_select"
on public.prayer_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.prayer_requests pr
    where pr.id = prayer_request_id
      and (
        pr.author_id = auth.uid()
        or public.is_admin_or_moderator()
        or pr.visibility = 'public'
        or (pr.group_id is not null and public.is_group_member(pr.group_id))
      )
  )
);

drop policy if exists "prayer_comments_insert" on public.prayer_comments;
create policy "prayer_comments_insert"
on public.prayer_comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.prayer_requests pr
    where pr.id = prayer_request_id
      and (
        pr.author_id = auth.uid()
        or public.is_admin_or_moderator()
        or pr.visibility = 'public'
        or (pr.group_id is not null and public.is_group_member(pr.group_id))
      )
  )
);

drop policy if exists "prayer_comments_update" on public.prayer_comments;
create policy "prayer_comments_update"
on public.prayer_comments
for update
to authenticated
using (auth.uid() = author_id or public.is_admin_or_moderator())
with check (auth.uid() = author_id or public.is_admin_or_moderator());

drop policy if exists "prayer_comments_delete" on public.prayer_comments;
create policy "prayer_comments_delete"
on public.prayer_comments
for delete
to authenticated
using (auth.uid() = author_id or public.is_admin_or_moderator());

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select"
on public.notifications
for select
to authenticated
using (auth.uid() = recipient_id or public.is_admin_or_moderator());

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert"
on public.notifications
for insert
to authenticated
with check (
  public.is_admin_or_moderator()
  or actor_id = auth.uid()
);

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update"
on public.notifications
for update
to authenticated
using (auth.uid() = recipient_id or public.is_admin_or_moderator())
with check (auth.uid() = recipient_id or public.is_admin_or_moderator());

drop policy if exists "reports_select" on public.reports;
create policy "reports_select"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_id or public.is_admin_or_moderator());

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "reports_update" on public.reports;
create policy "reports_update"
on public.reports
for update
to authenticated
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "devotional_content_select" on public.devotional_content;
create policy "devotional_content_select"
on public.devotional_content
for select
to authenticated
using (true);

drop policy if exists "devotional_content_insert" on public.devotional_content;
create policy "devotional_content_insert"
on public.devotional_content
for insert
to authenticated
with check (public.is_admin_or_moderator());

drop policy if exists "devotional_content_update" on public.devotional_content;
create policy "devotional_content_update"
on public.devotional_content
for update
to authenticated
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "devotional_content_delete" on public.devotional_content;
create policy "devotional_content_delete"
on public.devotional_content
for delete
to authenticated
using (public.is_admin_or_moderator());

drop policy if exists "direct_message_threads_select" on public.direct_message_threads;
create policy "direct_message_threads_select"
on public.direct_message_threads
for select
to authenticated
using (auth.uid() in (participant_one_id, participant_two_id) or public.is_admin_or_moderator());

drop policy if exists "direct_message_threads_insert" on public.direct_message_threads;
create policy "direct_message_threads_insert"
on public.direct_message_threads
for insert
to authenticated
with check (
  auth.uid() in (participant_one_id, participant_two_id)
);

drop policy if exists "direct_messages_select" on public.direct_messages;
create policy "direct_messages_select"
on public.direct_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.direct_message_threads t
    where t.id = thread_id
      and auth.uid() in (t.participant_one_id, t.participant_two_id)
  )
  or public.is_admin_or_moderator()
);

drop policy if exists "direct_messages_insert" on public.direct_messages;
create policy "direct_messages_insert"
on public.direct_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.direct_message_threads t
    where t.id = thread_id
      and auth.uid() in (t.participant_one_id, t.participant_two_id)
  )
);
