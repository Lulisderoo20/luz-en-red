import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';
import { reactionLabels } from '@/lib/format';
import { assertSafeText } from '@/lib/moderation';
import {
  AdminDashboard,
  AppSession,
  CreatePostPayload,
  CreatePrayerPayload,
  DevotionalContent,
  GroupDetail,
  GroupSummary,
  NotificationItem,
  OnboardingPayload,
  Post,
  PrayerRequest,
  ReactionType,
  ReportPayload,
  SearchResults,
  SignInPayload,
  SignUpPayload,
  UpdateProfilePayload,
  UserProfile,
} from '@/types/domain';
import { BackendAdapter } from '@/services/backend/types';

type Row = Record<string, any>;

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean))] as string[];
}

function throwIfError<T>(value: { data?: T; error: { message: string } | null }) {
  if (value.error) {
    throw new Error(value.error.message);
  }

  return value.data as T;
}

function ensureNoError(value: { error: { message: string } | null }) {
  if (value.error) {
    throw new Error(value.error.message);
  }
}

export class SupabaseAdapter implements BackendAdapter {
  mode: 'supabase' = 'supabase';
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  private async fetchProfilesMap(ids: string[], viewerId?: string) {
    const uniqueIds = unique(ids);
    const profileMap = new Map<string, UserProfile>();

    if (uniqueIds.length === 0) {
      return profileMap;
    }

    const [
      profiles,
      followers,
      following,
      groupMembers,
      posts,
      prayers,
      viewerFollowing,
      viewerBlocked,
      blockedViewer,
    ] = await Promise.all([
      this.supabase.from('profiles').select('*').in('id', uniqueIds),
      this.supabase.from('follows').select('following_id').in('following_id', uniqueIds),
      this.supabase.from('follows').select('follower_id').in('follower_id', uniqueIds),
      this.supabase.from('group_members').select('user_id').in('user_id', uniqueIds),
      this.supabase.from('posts').select('author_id').in('author_id', uniqueIds),
      this.supabase.from('prayer_requests').select('author_id').in('author_id', uniqueIds),
      viewerId
        ? this.supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', viewerId)
            .in('following_id', uniqueIds)
        : Promise.resolve({ data: [], error: null }),
      viewerId
        ? this.supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', viewerId)
            .in('blocked_id', uniqueIds)
        : Promise.resolve({ data: [], error: null }),
      viewerId
        ? this.supabase
            .from('blocks')
            .select('blocker_id')
            .eq('blocked_id', viewerId)
            .in('blocker_id', uniqueIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const profileRows = throwIfError(profiles) as Row[];
    const followerRows = throwIfError(followers) as Row[];
    const followingRows = throwIfError(following) as Row[];
    const groupMemberRows = throwIfError(groupMembers) as Row[];
    const postRows = throwIfError(posts) as Row[];
    const prayerRows = throwIfError(prayers) as Row[];
    const viewerFollowingRows = throwIfError(viewerFollowing as { data: any[]; error: any }) as Row[];
    const viewerBlockedRows = throwIfError(viewerBlocked as { data: any[]; error: any }) as Row[];
    const blockedViewerRows = throwIfError(blockedViewer as { data: any[]; error: any }) as Row[];

    const followersCount = new Map<string, number>();
    const followingCount = new Map<string, number>();
    const groupsCount = new Map<string, number>();
    const postsCount = new Map<string, number>();
    const prayersCount = new Map<string, number>();
    const viewerFollowingSet = new Set(viewerFollowingRows.map((item) => item.following_id));
    const blockedSet = new Set([
      ...viewerBlockedRows.map((item) => item.blocked_id),
      ...blockedViewerRows.map((item) => item.blocker_id),
    ]);

    followerRows.forEach((row) => {
      followersCount.set(row.following_id, (followersCount.get(row.following_id) ?? 0) + 1);
    });
    followingRows.forEach((row) => {
      followingCount.set(row.follower_id, (followingCount.get(row.follower_id) ?? 0) + 1);
    });
    groupMemberRows.forEach((row) => {
      groupsCount.set(row.user_id, (groupsCount.get(row.user_id) ?? 0) + 1);
    });
    postRows.forEach((row) => {
      postsCount.set(row.author_id, (postsCount.get(row.author_id) ?? 0) + 1);
    });
    prayerRows.forEach((row) => {
      prayersCount.set(row.author_id, (prayersCount.get(row.author_id) ?? 0) + 1);
    });

    profileRows.forEach((row) => {
      profileMap.set(row.id, {
        id: row.id,
        email: row.email,
        displayName: row.display_name ?? '',
        username: row.username ?? '',
        avatarUrl: row.avatar_url,
        bio: row.bio,
        denomination: row.denomination,
        churchName: row.church_name,
        location: row.location,
        favoriteVerse: row.favorite_verse,
        interests: row.interests ?? [],
        role: row.role ?? 'member',
        isOnboardingComplete: Boolean(row.is_onboarding_complete),
        isSuspended: Boolean(row.is_suspended),
        followersCount: followersCount.get(row.id) ?? 0,
        followingCount: followingCount.get(row.id) ?? 0,
        groupsCount: groupsCount.get(row.id) ?? 0,
        postsCount: postsCount.get(row.id) ?? 0,
        prayerCount: prayersCount.get(row.id) ?? 0,
        isFollowing: viewerFollowingSet.has(row.id),
        isBlocked: blockedSet.has(row.id),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    });

    return profileMap;
  }

  private async enrichPosts(postRows: Row[], viewerId: string): Promise<Post[]> {
    if (postRows.length === 0) return [];

    const postIds = unique(postRows.map((post) => post.id));
    const authorIds = unique(postRows.map((post) => post.author_id));
    const groupIds = unique(postRows.map((post) => post.group_id));

    const [commentsRes, reactionsRes, savedRes, groupsRes, profileMap] = await Promise.all([
      this.supabase.from('post_comments').select('*').in('post_id', postIds),
      this.supabase.from('post_reactions').select('*').in('post_id', postIds),
      this.supabase.from('saved_posts').select('post_id').eq('user_id', viewerId).in('post_id', postIds),
      groupIds.length > 0
        ? this.supabase.from('groups').select('id, name').in('id', groupIds)
        : Promise.resolve({ data: [], error: null }),
      this.fetchProfilesMap(authorIds, viewerId),
    ]);

    const commentRows = throwIfError(commentsRes) as Row[];
    const reactionRows = throwIfError(reactionsRes) as Row[];
    const savedRows = throwIfError(savedRes) as Row[];
    const groupRows = throwIfError(groupsRes as { data: any[]; error: any }) as Row[];

    const commentAuthors = await this.fetchProfilesMap(
      unique(commentRows.map((comment) => comment.author_id)),
      viewerId,
    );
    const groupMap = new Map(groupRows.map((group) => [group.id, group.name]));
    const savedSet = new Set(savedRows.map((item) => item.post_id));

    return postRows.map((row) => ({
      id: row.id,
      author: profileMap.get(row.author_id)!,
      groupId: row.group_id,
      groupName: row.group_id ? groupMap.get(row.group_id) ?? null : null,
      type: row.type,
      content: row.content,
      imageUrl: row.image_url,
      bibleVerse: row.bible_verse,
      category: row.category,
      isPrivate: Boolean(row.is_private),
      comments: commentRows
        .filter((comment) => comment.post_id === row.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((comment) => ({
          id: comment.id,
          postId: comment.post_id,
          author: commentAuthors.get(comment.author_id)!,
          content: comment.content,
          createdAt: comment.created_at,
        })),
      reactions: (Object.keys(reactionLabels) as ReactionType[]).map((reaction) => ({
        type: reaction,
        label: reactionLabels[reaction],
        count: reactionRows.filter(
          (item) => item.post_id === row.id && item.reaction === reaction,
        ).length,
        reactedByMe: reactionRows.some(
          (item) => item.post_id === row.id && item.user_id === viewerId && item.reaction === reaction,
        ),
      })),
      savedByMe: savedSet.has(row.id),
      createdAt: row.created_at,
    }));
  }

  private async enrichPrayerRequests(rows: Row[], viewerId: string): Promise<PrayerRequest[]> {
    if (rows.length === 0) return [];

    const ids = unique(rows.map((row) => row.id));
    const authorIds = unique(rows.map((row) => row.author_id));
    const groupIds = unique(rows.map((row) => row.group_id));

    const [supportRes, commentsRes, groupsRes, authors] = await Promise.all([
      this.supabase.from('prayer_support').select('*').in('prayer_request_id', ids),
      this.supabase.from('prayer_comments').select('*').in('prayer_request_id', ids),
      groupIds.length > 0
        ? this.supabase.from('groups').select('id, name').in('id', groupIds)
        : Promise.resolve({ data: [], error: null }),
      this.fetchProfilesMap(authorIds, viewerId),
    ]);

    const supportRows = throwIfError(supportRes) as Row[];
    const commentRows = throwIfError(commentsRes) as Row[];
    const groupRows = throwIfError(groupsRes as { data: any[]; error: any }) as Row[];
    const commentAuthors = await this.fetchProfilesMap(
      unique(commentRows.map((comment) => comment.author_id)),
      viewerId,
    );
    const groupMap = new Map(groupRows.map((group) => [group.id, group.name]));

    return rows.map((row) => ({
      id: row.id,
      author: authors.get(row.author_id)!,
      groupId: row.group_id,
      groupName: row.group_id ? groupMap.get(row.group_id) ?? null : null,
      title: row.title,
      description: row.description,
      visibility: row.visibility,
      status: row.status,
      supportCount: supportRows.filter((item) => item.prayer_request_id === row.id).length,
      supportedByMe: supportRows.some(
        (item) => item.prayer_request_id === row.id && item.user_id === viewerId,
      ),
      comments: commentRows
        .filter((comment) => comment.prayer_request_id === row.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((comment) => ({
          id: comment.id,
          prayerRequestId: comment.prayer_request_id,
          author: commentAuthors.get(comment.author_id)!,
          content: comment.content,
          createdAt: comment.created_at,
        })),
      isSensitive: Boolean(row.is_sensitive),
      createdAt: row.created_at,
    }));
  }

  async getSession(): Promise<AppSession> {
    const userResult = await this.supabase.auth.getUser();
    if (userResult.error) {
      throw new Error(userResult.error.message);
    }

    const authUser = userResult.data.user;

    if (!authUser) {
      return {
        mode: 'supabase',
        user: null,
      };
    }

    return {
      mode: 'supabase',
      user: await this.getProfileById(authUser.id, authUser.id),
    };
  }

  onAuthStateChange(callback: () => void) {
    const { data } = this.supabase.auth.onAuthStateChange(() => callback());
    return () => data.subscription.unsubscribe();
  }

  async signIn(payload: SignInPayload): Promise<AppSession> {
    const result = await this.supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return this.getSession();
  }

  async signUp(payload: SignUpPayload): Promise<AppSession> {
    const result = await this.supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: env.supabaseRedirectUrl || window.location.origin,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return this.getSession();
  }

  async signInWithGoogle(): Promise<void> {
    const result = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          env.supabaseRedirectUrl ||
          `${window.location.origin}${window.location.pathname}#/auth/callback`,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const result = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        env.supabaseRedirectUrl ||
        `${window.location.origin}${window.location.pathname}#/auth/callback`,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  async signOut(): Promise<void> {
    const result = await this.supabase.auth.signOut();
    ensureNoError(result);
  }

  async completeOnboarding(userId: string, payload: OnboardingPayload): Promise<UserProfile> {
    const result = await this.supabase
      .from('profiles')
      .update({
        display_name: payload.displayName.trim(),
        username: payload.username.trim().toLowerCase(),
        avatar_url: payload.avatarUrl?.trim() || null,
        bio: payload.bio?.trim() || null,
        denomination: payload.denomination?.trim() || null,
        church_name: payload.churchName?.trim() || null,
        location: payload.location?.trim() || null,
        favorite_verse: payload.favoriteVerse?.trim() || null,
        interests: payload.interests,
        is_onboarding_complete: true,
      })
      .eq('id', userId);

    throwIfError(result);

    const profile = await this.getProfileById(userId, userId);
    if (!profile) throw new Error('No pudimos cargar tu perfil.');
    return profile;
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<UserProfile> {
    return this.completeOnboarding(userId, payload);
  }

  async getProfileById(id: string, viewerId?: string): Promise<UserProfile | null> {
    const profiles = await this.fetchProfilesMap([id], viewerId);
    return profiles.get(id) ?? null;
  }

  async getProfileByUsername(username: string, viewerId?: string): Promise<UserProfile | null> {
    const result = await this.supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    const row = throwIfError(result) as Row | null;

    if (!row?.id) return null;

    return this.getProfileById(row.id, viewerId);
  }

  async getFeed(viewerId: string, filter: 'all' | 'following' = 'all'): Promise<Post[]> {
    let authorIds: string[] | null = null;

    if (filter === 'following') {
      const followingRes = await this.supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerId);
      const followingRows = throwIfError(followingRes) as Row[];
      authorIds = unique([viewerId, ...followingRows.map((item) => item.following_id)]);
    }

    let query = this.supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (authorIds) {
      query = query.in('author_id', authorIds);
    }

    const result = await query;
    const rows = throwIfError(result) as Row[];
    return this.enrichPosts(rows, viewerId);
  }

  async getPostById(id: string, viewerId: string): Promise<Post | null> {
    const result = await this.supabase.from('posts').select('*').eq('id', id).maybeSingle();
    const row = throwIfError(result) as Row | null;
    if (!row) return null;

    const posts = await this.enrichPosts([row], viewerId);
    return posts[0] ?? null;
  }

  async createPost(userId: string, payload: CreatePostPayload): Promise<Post> {
    assertSafeText(payload.content);

    const result = await this.supabase
      .from('posts')
      .insert({
        author_id: userId,
        group_id: payload.groupId ?? null,
        type: payload.type,
        content: payload.content.trim(),
        image_url: payload.imageUrl?.trim() || null,
        bible_verse: payload.bibleVerse?.trim() || null,
        category: payload.category?.trim() || null,
        is_private: Boolean(payload.isPrivate),
      })
      .select('*')
      .single();

    const row = throwIfError(result) as Row;
    const posts = await this.enrichPosts([row], userId);
    return posts[0];
  }

  async togglePostReaction(userId: string, postId: string, reaction: ReactionType): Promise<Post> {
    const existingResult = await this.supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    const existing = throwIfError(existingResult) as Row | null;

    if (!existing) {
      throwIfError(
        await this.supabase.from('post_reactions').insert({
          post_id: postId,
          user_id: userId,
          reaction,
        }),
      );
    } else if (existing.reaction === reaction) {
      throwIfError(
        await this.supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId),
      );
    } else {
      throwIfError(
        await this.supabase
          .from('post_reactions')
          .update({ reaction })
          .eq('post_id', postId)
          .eq('user_id', userId),
      );
    }

    const post = await this.getPostById(postId, userId);
    if (!post) throw new Error('No pudimos recargar la publicación.');
    return post;
  }

  async addPostComment(userId: string, postId: string, content: string): Promise<Post> {
    assertSafeText(content);

    throwIfError(
      await this.supabase.from('post_comments').insert({
        post_id: postId,
        author_id: userId,
        content: content.trim(),
      }),
    );

    const post = await this.getPostById(postId, userId);
    if (!post) throw new Error('No pudimos recargar la publicación.');
    return post;
  }

  async toggleSavedPost(userId: string, postId: string): Promise<Post> {
    const existingResult = await this.supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
    const existing = throwIfError(existingResult) as Row | null;

    if (existing) {
      throwIfError(
        await this.supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId),
      );
    } else {
      throwIfError(
        await this.supabase.from('saved_posts').insert({
          user_id: userId,
          post_id: postId,
        }),
      );
    }

    const post = await this.getPostById(postId, userId);
    if (!post) throw new Error('No pudimos recargar la publicación.');
    return post;
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const savedResult = await this.supabase.from('saved_posts').select('post_id').eq('user_id', userId);
    const savedRows = throwIfError(savedResult) as Row[];
    const postIds = unique(savedRows.map((row) => row.post_id));

    if (postIds.length === 0) return [];

    const postsResult = await this.supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });
    return this.enrichPosts(throwIfError(postsResult) as Row[], userId);
  }

  async getPrayerRequests(viewerId: string): Promise<PrayerRequest[]> {
    const result = await this.supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false });
    return this.enrichPrayerRequests(throwIfError(result) as Row[], viewerId);
  }

  async createPrayerRequest(userId: string, payload: CreatePrayerPayload): Promise<PrayerRequest> {
    assertSafeText(payload.title);
    assertSafeText(payload.description);

    const result = await this.supabase
      .from('prayer_requests')
      .insert({
        author_id: userId,
        group_id: payload.groupId ?? null,
        title: payload.title.trim(),
        description: payload.description.trim(),
        visibility: payload.visibility,
        is_sensitive: Boolean(payload.isSensitive),
      })
      .select('*')
      .single();

    const row = throwIfError(result) as Row;
    const prayers = await this.enrichPrayerRequests([row], userId);
    return prayers[0];
  }

  async togglePrayerSupport(userId: string, prayerRequestId: string): Promise<PrayerRequest> {
    const existingResult = await this.supabase
      .from('prayer_support')
      .select('*')
      .eq('user_id', userId)
      .eq('prayer_request_id', prayerRequestId)
      .maybeSingle();
    const existing = throwIfError(existingResult) as Row | null;

    if (existing) {
      throwIfError(
        await this.supabase
          .from('prayer_support')
          .delete()
          .eq('user_id', userId)
          .eq('prayer_request_id', prayerRequestId),
      );
    } else {
      throwIfError(
        await this.supabase.from('prayer_support').insert({
          user_id: userId,
          prayer_request_id: prayerRequestId,
        }),
      );
    }

    const prayerRows = throwIfError(
      await this.supabase.from('prayer_requests').select('*').eq('id', prayerRequestId).single(),
    ) as Row;
    const prayers = await this.enrichPrayerRequests([prayerRows], userId);
    return prayers[0];
  }

  async addPrayerComment(userId: string, prayerRequestId: string, content: string): Promise<PrayerRequest> {
    assertSafeText(content);

    throwIfError(
      await this.supabase.from('prayer_comments').insert({
        prayer_request_id: prayerRequestId,
        author_id: userId,
        content: content.trim(),
      }),
    );

    const prayerRows = throwIfError(
      await this.supabase.from('prayer_requests').select('*').eq('id', prayerRequestId).single(),
    ) as Row;
    const prayers = await this.enrichPrayerRequests([prayerRows], userId);
    return prayers[0];
  }

  async markPrayerAnswered(userId: string, prayerRequestId: string): Promise<PrayerRequest> {
    throwIfError(
      await this.supabase
        .from('prayer_requests')
        .update({ status: 'answered' })
        .eq('id', prayerRequestId)
        .select('*')
        .single(),
    );

    const prayerRows = throwIfError(
      await this.supabase.from('prayer_requests').select('*').eq('id', prayerRequestId).single(),
    ) as Row;
    const prayers = await this.enrichPrayerRequests([prayerRows], userId);
    return prayers[0];
  }

  async getGroups(viewerId: string): Promise<GroupSummary[]> {
    const groupsResult = await this.supabase
      .from('groups')
      .select('*')
      .order('updated_at', { ascending: false });
    const groupRows = throwIfError(groupsResult) as Row[];

    const memberRows = throwIfError(
      await this.supabase
        .from('group_members')
        .select('group_id, user_id')
        .in('group_id', unique(groupRows.map((group) => group.id))),
    ) as Row[];
    const joinedSet = new Set(
      memberRows.filter((item) => item.user_id === viewerId).map((item) => item.group_id),
    );
    const memberCount = new Map<string, number>();
    memberRows.forEach((item) => {
      memberCount.set(item.group_id, (memberCount.get(item.group_id) ?? 0) + 1);
    });

    return groupRows.map((group) => ({
      id: group.id,
      slug: group.slug,
      name: group.name,
      description: group.description,
      coverImageUrl: group.cover_image_url,
      interestTag: group.interest_tag,
      isPrivate: Boolean(group.is_private),
      memberCount: memberCount.get(group.id) ?? 0,
      createdBy: group.created_by,
      joinedByMe: joinedSet.has(group.id),
    }));
  }

  async getGroupBySlug(viewerId: string, slug: string): Promise<GroupDetail | null> {
    const groupResult = await this.supabase.from('groups').select('*').eq('slug', slug).maybeSingle();
    const group = throwIfError(groupResult) as Row | null;
    if (!group) return null;

    const [membersRes, postsRes, prayersRes] = await Promise.all([
      this.supabase.from('group_members').select('*').eq('group_id', group.id),
      this.supabase
        .from('posts')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false }),
      this.supabase
        .from('prayer_requests')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false }),
    ]);

    const memberRows = throwIfError(membersRes) as Row[];
    const memberProfiles = await this.fetchProfilesMap(
      unique(memberRows.map((member) => member.user_id)),
      viewerId,
    );
    const posts = await this.enrichPosts(throwIfError(postsRes) as Row[], viewerId);
    const prayers = await this.enrichPrayerRequests(throwIfError(prayersRes) as Row[], viewerId);

    return {
      id: group.id,
      slug: group.slug,
      name: group.name,
      description: group.description,
      coverImageUrl: group.cover_image_url,
      interestTag: group.interest_tag,
      isPrivate: Boolean(group.is_private),
      memberCount: memberRows.length,
      createdBy: group.created_by,
      joinedByMe: memberRows.some((member) => member.user_id === viewerId),
      members: memberRows
        .map((member) => memberProfiles.get(member.user_id))
        .filter((item): item is UserProfile => Boolean(item)),
      posts,
      prayerRequests: prayers,
    };
  }

  async joinGroup(userId: string, groupId: string): Promise<GroupSummary> {
    throwIfError(
      await this.supabase.from('group_members').insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      }),
    );

    const groups = await this.getGroups(userId);
    const group = groups.find((item) => item.id === groupId);
    if (!group) throw new Error('No pudimos recargar el grupo.');
    return group;
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    throwIfError(
      await this.supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId),
    );
  }

  async followUser(userId: string, targetUserId: string): Promise<UserProfile> {
    const existingResult = await this.supabase
      .from('follows')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .maybeSingle();
    const existing = throwIfError(existingResult) as Row | null;

    if (existing) {
      throwIfError(
        await this.supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId),
      );
    } else {
      throwIfError(
        await this.supabase.from('follows').insert({
          follower_id: userId,
          following_id: targetUserId,
        }),
      );
    }

    const profile = await this.getProfileById(targetUserId, userId);
    if (!profile) throw new Error('No pudimos recargar el perfil.');
    return profile;
  }

  async blockUser(userId: string, targetUserId: string): Promise<void> {
    throwIfError(
      await this.supabase.from('blocks').insert({
        blocker_id: userId,
        blocked_id: targetUserId,
      }),
    );
    await this.supabase
      .from('follows')
      .delete()
      .or(`and(follower_id.eq.${userId},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${userId})`);
  }

  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const result = await this.supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    const rows = throwIfError(result) as Row[];
    const actorMap = await this.fetchProfilesMap(unique(rows.map((row) => row.actor_id)), userId);

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actor: row.actor_id ? actorMap.get(row.actor_id) ?? null : null,
      message: row.message,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    }));
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    throwIfError(
      await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId),
    );
  }

  async getDevotionals(): Promise<DevotionalContent[]> {
    const result = await this.supabase
      .from('devotional_content')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('published_on', { ascending: false });
    const rows = throwIfError(result) as Row[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      kind: row.kind,
      verseReference: row.verse_reference,
      imageUrl: row.image_url,
      publishedOn: row.published_on,
      isFeatured: Boolean(row.is_featured),
    }));
  }

  async search(viewerId: string, query: string): Promise<SearchResults> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return {
        profiles: [],
        groups: [],
        posts: [],
        prayerRequests: [],
      };
    }

    const [profilesResult, groups, posts, prayers] = await Promise.all([
      this.supabase.from('profiles').select('id'),
      this.getGroups(viewerId),
      this.getFeed(viewerId),
      this.getPrayerRequests(viewerId),
    ]);

    const profileRows = throwIfError(profilesResult) as Row[];
    const profileMap = await this.fetchProfilesMap(
      unique(profileRows.map((row) => row.id)),
      viewerId,
    );

    return {
      profiles: [...profileMap.values()].filter(
        (profile) =>
          profile.displayName.toLowerCase().includes(normalized) ||
          profile.username.toLowerCase().includes(normalized) ||
          profile.interests.some((interest) => interest.toLowerCase().includes(normalized)),
      ),
      groups: groups.filter(
        (group) =>
          group.name.toLowerCase().includes(normalized) ||
          group.description.toLowerCase().includes(normalized) ||
          group.interestTag?.toLowerCase().includes(normalized),
      ),
      posts: posts.filter(
        (post) =>
          post.content.toLowerCase().includes(normalized) ||
          post.bibleVerse?.toLowerCase().includes(normalized) ||
          post.category?.toLowerCase().includes(normalized),
      ),
      prayerRequests: prayers.filter(
        (prayer) =>
          prayer.title.toLowerCase().includes(normalized) ||
          prayer.description.toLowerCase().includes(normalized),
      ),
    };
  }

  async report(userId: string, payload: ReportPayload): Promise<void> {
    throwIfError(
      await this.supabase.from('reports').insert({
        reporter_id: userId,
        target_user_id: payload.targetUserId,
        post_id: payload.postId,
        prayer_request_id: payload.prayerRequestId,
        group_id: payload.groupId,
        reason: payload.reason,
        details: payload.details ?? null,
      }),
    );
  }

  async getAdminDashboard(userId: string): Promise<AdminDashboard | null> {
    const viewer = await this.getProfileById(userId, userId);
    if (!viewer || !['moderator', 'admin'].includes(viewer.role)) return null;

    const [usersRes, reportsRes, devotionals] = await Promise.all([
      this.supabase.from('profiles').select('id'),
      this.supabase.from('reports').select('*').order('created_at', { ascending: false }),
      this.getDevotionals(),
    ]);

    const userRows = throwIfError(usersRes) as Row[];
    const usersMap = await this.fetchProfilesMap(unique(userRows.map((row) => row.id)), userId);
    const reportRows = throwIfError(reportsRes) as Row[];

    return {
      users: [...usersMap.values()],
      reports: reportRows.map((row) => ({
        id: row.id,
        reason: row.reason,
        details: row.details,
        status: row.status,
        createdAt: row.created_at,
      })),
      devotionals,
    };
  }
}
