import { reactionLabels, slugify } from '@/lib/format';
import { assertSafeText } from '@/lib/moderation';
import { spiritualInterests } from '@/types/domain';
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
import {
  createDefaultDemoStore,
  DemoDevotionalRecord,
  DemoGroupRecord,
  DemoNotificationRecord,
  DemoPostRecord,
  DemoPrayerRequestRecord,
  DemoProfileRecord,
  DemoStore,
} from '@/services/seed/demoData';

const STORAGE_KEY = 'luz-en-red-demo-store-v1';
const listeners = new Set<() => void>();

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function readStore(): DemoStore {
  const serialized = localStorage.getItem(STORAGE_KEY);

  if (!serialized) {
    const initialStore = createDefaultDemoStore();
    writeStore(initialStore);
    return initialStore;
  }

  try {
    return JSON.parse(serialized) as DemoStore;
  } catch {
    const initialStore = createDefaultDemoStore();
    writeStore(initialStore);
    return initialStore;
  }
}

function writeStore(store: DemoStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function emitAuthChange() {
  listeners.forEach((listener) => listener());
}

function isBlockedBetween(store: DemoStore, viewerId: string | undefined, targetId: string) {
  if (!viewerId) return false;

  return store.blocks.some(
    (block) =>
      (block.blockerId === viewerId && block.blockedId === targetId) ||
      (block.blockerId === targetId && block.blockedId === viewerId),
  );
}

function isGroupMember(store: DemoStore, groupId: string, userId: string) {
  return store.groupMembers.some((member) => member.groupId === groupId && member.userId === userId);
}

function canViewGroup(store: DemoStore, group: DemoGroupRecord, viewerId: string) {
  return !group.isPrivate || group.createdBy === viewerId || isGroupMember(store, group.id, viewerId);
}

function canViewPost(store: DemoStore, post: DemoPostRecord, viewerId: string) {
  if (isBlockedBetween(store, viewerId, post.authorId)) return false;
  if (!post.groupId) return !post.isPrivate || post.authorId === viewerId;

  const group = store.groups.find((item) => item.id === post.groupId);
  return group ? canViewGroup(store, group, viewerId) : false;
}

function canViewPrayer(store: DemoStore, prayer: DemoPrayerRequestRecord, viewerId: string) {
  if (isBlockedBetween(store, viewerId, prayer.authorId)) return false;
  if (prayer.visibility === 'public' && !prayer.groupId) return true;
  if (!prayer.groupId) return prayer.authorId === viewerId;

  const group = store.groups.find((item) => item.id === prayer.groupId);
  return group ? canViewGroup(store, group, viewerId) : false;
}

function toUserProfile(store: DemoStore, profile: DemoProfileRecord, viewerId?: string): UserProfile {
  const followersCount = store.follows.filter((item) => item.followingId === profile.id).length;
  const followingCount = store.follows.filter((item) => item.followerId === profile.id).length;
  const groupsCount = store.groupMembers.filter((item) => item.userId === profile.id).length;
  const postsCount = store.posts.filter((item) => item.authorId === profile.id).length;
  const prayerCount = store.prayerRequests.filter((item) => item.authorId === profile.id).length;

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    denomination: profile.denomination,
    churchName: profile.churchName,
    location: profile.location,
    favoriteVerse: profile.favoriteVerse,
    interests: profile.interests,
    role: profile.role,
    isOnboardingComplete: profile.isOnboardingComplete,
    isSuspended: profile.isSuspended,
    followersCount,
    followingCount,
    groupsCount,
    postsCount,
    prayerCount,
    isFollowing: viewerId
      ? store.follows.some((item) => item.followerId === viewerId && item.followingId === profile.id)
      : false,
    isBlocked: viewerId ? isBlockedBetween(store, viewerId, profile.id) : false,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function toPost(store: DemoStore, post: DemoPostRecord, viewerId: string): Post {
  const authorRecord = store.profiles.find((item) => item.id === post.authorId);
  if (!authorRecord) throw new Error('No se encontró la autora de la publicación.');

  const postComments = store.postComments
    .filter((item) => item.postId === post.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => {
      const author = store.profiles.find((profile) => profile.id === item.authorId);
      if (!author) throw new Error('No se encontró la autora del comentario.');

      return {
        id: item.id,
        postId: item.postId,
        author: toUserProfile(store, author, viewerId),
        content: item.content,
        createdAt: item.createdAt,
      };
    });

  const reactions = (Object.keys(reactionLabels) as ReactionType[]).map((reactionType) => {
    const count = store.postReactions.filter(
      (item) => item.postId === post.id && item.reaction === reactionType,
    ).length;

    return {
      type: reactionType,
      label: reactionLabels[reactionType],
      count,
      reactedByMe: store.postReactions.some(
        (item) =>
          item.postId === post.id &&
          item.userId === viewerId &&
          item.reaction === reactionType,
      ),
    };
  });

  const group = post.groupId ? store.groups.find((item) => item.id === post.groupId) : null;

  return {
    id: post.id,
    author: toUserProfile(store, authorRecord, viewerId),
    groupId: post.groupId,
    groupName: group?.name ?? null,
    type: post.type,
    content: post.content,
    imageUrl: post.imageUrl,
    bibleVerse: post.bibleVerse,
    category: post.category,
    isPrivate: post.isPrivate,
    comments: postComments,
    reactions,
    savedByMe: store.savedPosts.some(
      (savedPost) => savedPost.postId === post.id && savedPost.userId === viewerId,
    ),
    createdAt: post.createdAt,
  };
}

function toPrayerRequest(store: DemoStore, prayer: DemoPrayerRequestRecord, viewerId: string): PrayerRequest {
  const authorRecord = store.profiles.find((item) => item.id === prayer.authorId);
  if (!authorRecord) throw new Error('No se encontró la autora del pedido de oración.');

  const prayerComments = store.prayerComments
    .filter((item) => item.prayerRequestId === prayer.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => {
      const author = store.profiles.find((profile) => profile.id === item.authorId);
      if (!author) throw new Error('No se encontró la autora del comentario de oración.');

      return {
        id: item.id,
        prayerRequestId: item.prayerRequestId,
        author: toUserProfile(store, author, viewerId),
        content: item.content,
        createdAt: item.createdAt,
      };
    });

  const group = prayer.groupId ? store.groups.find((item) => item.id === prayer.groupId) : null;

  return {
    id: prayer.id,
    author: toUserProfile(store, authorRecord, viewerId),
    groupId: prayer.groupId,
    groupName: group?.name ?? null,
    title: prayer.title,
    description: prayer.description,
    visibility: prayer.visibility,
    status: prayer.status,
    supportCount: store.prayerSupports.filter((item) => item.prayerRequestId === prayer.id).length,
    supportedByMe: store.prayerSupports.some(
      (item) => item.prayerRequestId === prayer.id && item.userId === viewerId,
    ),
    comments: prayerComments,
    isSensitive: prayer.isSensitive,
    createdAt: prayer.createdAt,
  };
}

function toGroupSummary(store: DemoStore, group: DemoGroupRecord, viewerId: string): GroupSummary {
  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    description: group.description,
    coverImageUrl: group.coverImageUrl,
    interestTag: group.interestTag,
    isPrivate: group.isPrivate,
    memberCount: store.groupMembers.filter((item) => item.groupId === group.id).length,
    createdBy: group.createdBy,
    joinedByMe: store.groupMembers.some(
      (member) => member.groupId === group.id && member.userId === viewerId,
    ),
  };
}

function toNotification(
  store: DemoStore,
  notification: DemoNotificationRecord,
  viewerId: string,
): NotificationItem {
  const actor = notification.actorId
    ? store.profiles.find((item) => item.id === notification.actorId)
    : null;

  return {
    id: notification.id,
    type: notification.type,
    entityType: notification.entityType,
    entityId: notification.entityId,
    actor: actor ? toUserProfile(store, actor, viewerId) : null,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

function toDevotional(record: DemoDevotionalRecord): DevotionalContent {
  return {
    id: record.id,
    title: record.title,
    excerpt: record.excerpt,
    body: record.body,
    kind: record.kind,
    verseReference: record.verseReference,
    imageUrl: record.imageUrl,
    publishedOn: record.publishedOn,
    isFeatured: record.isFeatured,
  };
}

function ensureUniqueUsername(store: DemoStore, username: string, currentUserId?: string) {
  const normalized = username.toLowerCase();
  const exists = store.profiles.some(
    (profile) => profile.username.toLowerCase() === normalized && profile.id !== currentUserId,
  );

  if (exists) {
    throw new Error('Ese nombre de usuario ya está en uso.');
  }
}

function createNotification(
  store: DemoStore,
  notification: Omit<DemoNotificationRecord, 'id' | 'createdAt'> & { createdAt?: string },
) {
  store.notifications.unshift({
    id: createId('notification'),
    createdAt: notification.createdAt ?? nowIso(),
    ...notification,
  });
}

function getCurrentUser(store: DemoStore) {
  return store.currentUserId
    ? store.profiles.find((profile) => profile.id === store.currentUserId) ?? null
    : null;
}

export class DemoAdapter implements BackendAdapter {
  mode: 'demo' = 'demo';

  async getSession(): Promise<AppSession> {
    const store = readStore();
    const currentUser = getCurrentUser(store);

    return {
      mode: 'demo',
      user: currentUser ? toUserProfile(store, currentUser, currentUser.id) : null,
    };
  }

  onAuthStateChange(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  async signIn(payload: SignInPayload): Promise<AppSession> {
    const store = readStore();
    const account = store.accounts.find(
      (item) =>
        item.email.toLowerCase() === payload.email.toLowerCase().trim() &&
        item.password === payload.password,
    );

    if (!account) {
      throw new Error('Email o contraseña incorrectos.');
    }

    store.currentUserId = account.userId;
    writeStore(store);
    emitAuthChange();

    return this.getSession();
  }

  async signUp(payload: SignUpPayload): Promise<AppSession> {
    const store = readStore();
    const email = payload.email.toLowerCase().trim();

    if (store.accounts.some((account) => account.email.toLowerCase() === email)) {
      throw new Error('Ya existe una cuenta con ese email.');
    }

    const userId = crypto.randomUUID();
    const createdAt = nowIso();
    const defaultUsername = slugify(email.split('@')[0]).slice(0, 20) || `hermana-${Date.now()}`;

    ensureUniqueUsername(store, defaultUsername);

    store.accounts.push({
      userId,
      email,
      password: payload.password,
    });

    store.profiles.push({
      id: userId,
      email,
      displayName: '',
      username: defaultUsername,
      avatarUrl: null,
      bio: null,
      denomination: null,
      churchName: null,
      location: null,
      favoriteVerse: null,
      interests: [spiritualInterests[0]],
      role: 'member',
      isOnboardingComplete: false,
      isSuspended: false,
      createdAt,
      updatedAt: createdAt,
    });

    store.currentUserId = userId;
    writeStore(store);
    emitAuthChange();

    return this.getSession();
  }

  async signInWithGoogle(): Promise<void> {
    const store = readStore();
    store.currentUserId = '11111111-1111-1111-1111-111111111111';
    writeStore(store);
    emitAuthChange();
  }

  async requestPasswordReset(): Promise<void> {
    return Promise.resolve();
  }

  async signOut(): Promise<void> {
    const store = readStore();
    store.currentUserId = null;
    writeStore(store);
    emitAuthChange();
  }

  async completeOnboarding(userId: string, payload: OnboardingPayload): Promise<UserProfile> {
    const store = readStore();
    ensureUniqueUsername(store, payload.username, userId);

    const profile = store.profiles.find((item) => item.id === userId);

    if (!profile) {
      throw new Error('No encontramos tu perfil.');
    }

    profile.displayName = payload.displayName.trim();
    profile.username = payload.username.trim().toLowerCase();
    profile.avatarUrl = payload.avatarUrl?.trim() || null;
    profile.bio = payload.bio?.trim() || null;
    profile.denomination = payload.denomination?.trim() || null;
    profile.churchName = payload.churchName?.trim() || null;
    profile.location = payload.location?.trim() || null;
    profile.favoriteVerse = payload.favoriteVerse?.trim() || null;
    profile.interests = payload.interests;
    profile.isOnboardingComplete = true;
    profile.updatedAt = nowIso();

    writeStore(store);

    return toUserProfile(store, profile, userId);
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<UserProfile> {
    return this.completeOnboarding(userId, payload);
  }

  async getProfileById(id: string, viewerId?: string): Promise<UserProfile | null> {
    const store = readStore();
    const profile = store.profiles.find((item) => item.id === id);

    if (!profile || isBlockedBetween(store, viewerId, id)) return null;

    return toUserProfile(store, profile, viewerId);
  }

  async getProfileByUsername(username: string, viewerId?: string): Promise<UserProfile | null> {
    const store = readStore();
    const profile = store.profiles.find(
      (item) => item.username.toLowerCase() === username.toLowerCase(),
    );

    if (!profile || isBlockedBetween(store, viewerId, profile.id)) return null;

    return toUserProfile(store, profile, viewerId);
  }

  async getFeed(viewerId: string, filter: 'all' | 'following' = 'all'): Promise<Post[]> {
    const store = readStore();
    const followedIds = new Set(
      store.follows.filter((item) => item.followerId === viewerId).map((item) => item.followingId),
    );

    return store.posts
      .filter((post) => canViewPost(store, post, viewerId))
      .filter((post) => filter === 'all' || post.authorId === viewerId || followedIds.has(post.authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((post) => toPost(store, post, viewerId));
  }

  async getPostById(id: string, viewerId: string): Promise<Post | null> {
    const store = readStore();
    const post = store.posts.find((item) => item.id === id);

    if (!post || !canViewPost(store, post, viewerId)) return null;

    return toPost(store, post, viewerId);
  }

  async createPost(userId: string, payload: CreatePostPayload): Promise<Post> {
    const store = readStore();
    assertSafeText(payload.content);

    if (payload.groupId && !isGroupMember(store, payload.groupId, userId)) {
      throw new Error('Necesitás pertenecer al grupo para publicar allí.');
    }

    const createdAt = nowIso();
    const post: DemoPostRecord = {
      id: crypto.randomUUID(),
      authorId: userId,
      groupId: payload.groupId ?? null,
      type: payload.type,
      content: payload.content.trim(),
      imageUrl: payload.imageUrl?.trim() || null,
      bibleVerse: payload.bibleVerse?.trim() || null,
      category: payload.category?.trim() || null,
      isPrivate: Boolean(payload.isPrivate),
      createdAt,
      updatedAt: createdAt,
    };

    store.posts.unshift(post);
    writeStore(store);

    return toPost(store, post, userId);
  }

  async togglePostReaction(userId: string, postId: string, reaction: ReactionType): Promise<Post> {
    const store = readStore();
    const post = store.posts.find((item) => item.id === postId);

    if (!post || !canViewPost(store, post, userId)) {
      throw new Error('No pudimos encontrar esa publicación.');
    }

    const existing = store.postReactions.find(
      (item) => item.postId === postId && item.userId === userId,
    );

    if (!existing) {
      store.postReactions.push({
        postId,
        userId,
        reaction,
        createdAt: nowIso(),
      });

      if (post.authorId !== userId) {
        const actor = store.profiles.find((profile) => profile.id === userId);
        createNotification(store, {
          recipientId: post.authorId,
          actorId: userId,
          type: 'post_reaction',
          entityType: 'post',
          entityId: postId,
          message: `${actor?.displayName || 'Una hermana'} reaccionó a tu publicación.`,
          isRead: false,
        });
      }
    } else if (existing.reaction === reaction) {
      store.postReactions = store.postReactions.filter(
        (item) => !(item.postId === postId && item.userId === userId),
      );
    } else {
      existing.reaction = reaction;
      existing.createdAt = nowIso();
    }

    writeStore(store);

    return toPost(store, post, userId);
  }

  async addPostComment(userId: string, postId: string, content: string): Promise<Post> {
    const store = readStore();
    const post = store.posts.find((item) => item.id === postId);

    if (!post || !canViewPost(store, post, userId)) {
      throw new Error('No pudimos comentar esta publicación.');
    }

    assertSafeText(content);

    store.postComments.unshift({
      id: createId('post-comment'),
      postId,
      authorId: userId,
      content: content.trim(),
      createdAt: nowIso(),
    });

    if (post.authorId !== userId) {
      const actor = store.profiles.find((profile) => profile.id === userId);
      createNotification(store, {
        recipientId: post.authorId,
        actorId: userId,
        type: 'post_comment',
        entityType: 'post',
        entityId: postId,
        message: `${actor?.displayName || 'Una hermana'} comentó tu publicación.`,
        isRead: false,
      });
    }

    writeStore(store);

    return toPost(store, post, userId);
  }

  async toggleSavedPost(userId: string, postId: string): Promise<Post> {
    const store = readStore();
    const post = store.posts.find((item) => item.id === postId);

    if (!post || !canViewPost(store, post, userId)) {
      throw new Error('No pudimos guardar esta publicación.');
    }

    const existing = store.savedPosts.find((item) => item.postId === postId && item.userId === userId);

    if (existing) {
      store.savedPosts = store.savedPosts.filter(
        (item) => !(item.postId === postId && item.userId === userId),
      );
    } else {
      store.savedPosts.push({
        postId,
        userId,
        createdAt: nowIso(),
      });
    }

    writeStore(store);

    return toPost(store, post, userId);
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const store = readStore();

    return store.savedPosts
      .filter((item) => item.userId === userId)
      .map((item) => store.posts.find((post) => post.id === item.postId))
      .filter((item): item is DemoPostRecord => Boolean(item))
      .filter((post) => canViewPost(store, post, userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((post) => toPost(store, post, userId));
  }

  async getPrayerRequests(viewerId: string): Promise<PrayerRequest[]> {
    const store = readStore();

    return store.prayerRequests
      .filter((prayer) => canViewPrayer(store, prayer, viewerId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((prayer) => toPrayerRequest(store, prayer, viewerId));
  }

  async createPrayerRequest(userId: string, payload: CreatePrayerPayload): Promise<PrayerRequest> {
    const store = readStore();
    assertSafeText(payload.title);
    assertSafeText(payload.description);

    if (payload.visibility === 'group' && !payload.groupId) {
      throw new Error('Elegí un grupo para publicar este pedido.');
    }

    if (payload.groupId && !isGroupMember(store, payload.groupId, userId)) {
      throw new Error('Necesitás pertenecer al grupo para publicar este pedido.');
    }

    const createdAt = nowIso();
    const prayer: DemoPrayerRequestRecord = {
      id: crypto.randomUUID(),
      authorId: userId,
      groupId: payload.groupId ?? null,
      title: payload.title.trim(),
      description: payload.description.trim(),
      visibility: payload.visibility,
      status: 'active',
      supportCount: 0,
      isSensitive: Boolean(payload.isSensitive),
      createdAt,
      updatedAt: createdAt,
    };

    store.prayerRequests.unshift(prayer);
    writeStore(store);

    return toPrayerRequest(store, prayer, userId);
  }

  async togglePrayerSupport(userId: string, prayerRequestId: string): Promise<PrayerRequest> {
    const store = readStore();
    const prayer = store.prayerRequests.find((item) => item.id === prayerRequestId);

    if (!prayer || !canViewPrayer(store, prayer, userId)) {
      throw new Error('No pudimos encontrar ese pedido de oración.');
    }

    const existing = store.prayerSupports.find(
      (item) => item.prayerRequestId === prayerRequestId && item.userId === userId,
    );

    if (existing) {
      store.prayerSupports = store.prayerSupports.filter(
        (item) => !(item.prayerRequestId === prayerRequestId && item.userId === userId),
      );
    } else {
      store.prayerSupports.push({
        prayerRequestId,
        userId,
        createdAt: nowIso(),
      });

      if (prayer.authorId !== userId) {
        const actor = store.profiles.find((profile) => profile.id === userId);
        createNotification(store, {
          recipientId: prayer.authorId,
          actorId: userId,
          type: 'prayer_response',
          entityType: 'prayer_request',
          entityId: prayerRequestId,
          message: `${actor?.displayName || 'Una hermana'} indicó que está orando por vos.`,
          isRead: false,
        });
      }
    }

    prayer.supportCount = store.prayerSupports.filter(
      (item) => item.prayerRequestId === prayerRequestId,
    ).length;
    prayer.updatedAt = nowIso();
    writeStore(store);

    return toPrayerRequest(store, prayer, userId);
  }

  async addPrayerComment(userId: string, prayerRequestId: string, content: string): Promise<PrayerRequest> {
    const store = readStore();
    const prayer = store.prayerRequests.find((item) => item.id === prayerRequestId);

    if (!prayer || !canViewPrayer(store, prayer, userId)) {
      throw new Error('No pudimos comentar este pedido.');
    }

    assertSafeText(content);

    store.prayerComments.unshift({
      id: createId('prayer-comment'),
      prayerRequestId,
      authorId: userId,
      content: content.trim(),
      createdAt: nowIso(),
    });

    writeStore(store);

    return toPrayerRequest(store, prayer, userId);
  }

  async markPrayerAnswered(userId: string, prayerRequestId: string): Promise<PrayerRequest> {
    const store = readStore();
    const prayer = store.prayerRequests.find((item) => item.id === prayerRequestId);
    const viewer = store.profiles.find((item) => item.id === userId);

    if (!prayer || !viewer) {
      throw new Error('No pudimos actualizar el pedido.');
    }

    if (prayer.authorId !== userId && !['moderator', 'admin'].includes(viewer.role)) {
      throw new Error('No tenés permiso para marcar este pedido como respondido.');
    }

    prayer.status = 'answered';
    prayer.updatedAt = nowIso();
    writeStore(store);

    return toPrayerRequest(store, prayer, userId);
  }

  async getGroups(viewerId: string): Promise<GroupSummary[]> {
    const store = readStore();

    return store.groups
      .filter((group) => canViewGroup(store, group, viewerId) || !group.isPrivate)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((group) => toGroupSummary(store, group, viewerId));
  }

  async getGroupBySlug(viewerId: string, slug: string): Promise<GroupDetail | null> {
    const store = readStore();
    const group = store.groups.find((item) => item.slug === slug);

    if (!group || !canViewGroup(store, group, viewerId)) return null;

    const members = store.groupMembers
      .filter((member) => member.groupId === group.id)
      .map((member) => store.profiles.find((profile) => profile.id === member.userId))
      .filter((item): item is DemoProfileRecord => Boolean(item))
      .map((profile) => toUserProfile(store, profile, viewerId));

    const posts = store.posts
      .filter((post) => post.groupId === group.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((post) => toPost(store, post, viewerId));

    const prayerRequests = store.prayerRequests
      .filter((prayer) => prayer.groupId === group.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((prayer) => toPrayerRequest(store, prayer, viewerId));

    return {
      ...toGroupSummary(store, group, viewerId),
      members,
      posts,
      prayerRequests,
    };
  }

  async joinGroup(userId: string, groupId: string): Promise<GroupSummary> {
    const store = readStore();
    const group = store.groups.find((item) => item.id === groupId);

    if (!group) {
      throw new Error('No encontramos ese grupo.');
    }

    if (group.isPrivate) {
      throw new Error('Este grupo es privado. La aprobación quedará preparada para una siguiente versión.');
    }

    if (!isGroupMember(store, groupId, userId)) {
      store.groupMembers.push({
        groupId,
        userId,
        role: 'member',
        joinedAt: nowIso(),
      });
      group.updatedAt = nowIso();
      writeStore(store);
    }

    return toGroupSummary(store, group, userId);
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const store = readStore();
    const membership = store.groupMembers.find(
      (member) => member.groupId === groupId && member.userId === userId,
    );

    if (!membership) return;
    if (membership.role === 'owner') {
      throw new Error('La creadora del grupo no puede salir sin transferir el liderazgo.');
    }

    store.groupMembers = store.groupMembers.filter(
      (member) => !(member.groupId === groupId && member.userId === userId),
    );
    writeStore(store);
  }

  async followUser(userId: string, targetUserId: string): Promise<UserProfile> {
    const store = readStore();
    const target = store.profiles.find((profile) => profile.id === targetUserId);

    if (!target) {
      throw new Error('No encontramos ese perfil.');
    }

    if (isBlockedBetween(store, userId, targetUserId)) {
      throw new Error('No podés interactuar con esta usuaria.');
    }

    const existing = store.follows.find(
      (item) => item.followerId === userId && item.followingId === targetUserId,
    );

    if (existing) {
      store.follows = store.follows.filter(
        (item) => !(item.followerId === userId && item.followingId === targetUserId),
      );
    } else {
      store.follows.push({
        followerId: userId,
        followingId: targetUserId,
        createdAt: nowIso(),
      });

      createNotification(store, {
        recipientId: targetUserId,
        actorId: userId,
        type: 'new_follower',
        entityType: 'profile',
        entityId: userId,
        message: `${store.profiles.find((item) => item.id === userId)?.displayName || 'Una hermana'} comenzó a seguirte.`,
        isRead: false,
      });
    }

    writeStore(store);
    return toUserProfile(store, target, userId);
  }

  async blockUser(userId: string, targetUserId: string): Promise<void> {
    const store = readStore();

    if (userId === targetUserId) {
      throw new Error('No podés bloquear tu propia cuenta.');
    }

    const existing = store.blocks.find(
      (item) => item.blockerId === userId && item.blockedId === targetUserId,
    );

    if (!existing) {
      store.blocks.push({
        blockerId: userId,
        blockedId: targetUserId,
        createdAt: nowIso(),
      });
    }

    store.follows = store.follows.filter(
      (item) =>
        !(
          (item.followerId === userId && item.followingId === targetUserId) ||
          (item.followerId === targetUserId && item.followingId === userId)
        ),
    );

    writeStore(store);
  }

  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const store = readStore();

    return store.notifications
      .filter((notification) => notification.recipientId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((notification) => toNotification(store, notification, userId));
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const store = readStore();
    const notification = store.notifications.find(
      (item) => item.id === notificationId && item.recipientId === userId,
    );

    if (notification) {
      notification.isRead = true;
      writeStore(store);
    }
  }

  async getDevotionals(): Promise<DevotionalContent[]> {
    const store = readStore();

    return [...store.devotionals]
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.publishedOn.localeCompare(a.publishedOn);
      })
      .map(toDevotional);
  }

  async search(viewerId: string, query: string): Promise<SearchResults> {
    const store = readStore();
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return {
        profiles: [],
        groups: [],
        posts: [],
        prayerRequests: [],
      };
    }

    return {
      profiles: store.profiles
        .filter((profile) => !isBlockedBetween(store, viewerId, profile.id))
        .filter(
          (profile) =>
            profile.displayName.toLowerCase().includes(normalized) ||
            profile.username.toLowerCase().includes(normalized) ||
            profile.interests.some((interest) => interest.toLowerCase().includes(normalized)),
        )
        .map((profile) => toUserProfile(store, profile, viewerId)),
      groups: store.groups
        .filter((group) => !group.isPrivate || isGroupMember(store, group.id, viewerId))
        .filter(
          (group) =>
            group.name.toLowerCase().includes(normalized) ||
            group.description.toLowerCase().includes(normalized) ||
            group.interestTag?.toLowerCase().includes(normalized),
        )
        .map((group) => toGroupSummary(store, group, viewerId)),
      posts: store.posts
        .filter((post) => canViewPost(store, post, viewerId))
        .filter(
          (post) =>
            post.content.toLowerCase().includes(normalized) ||
            post.bibleVerse?.toLowerCase().includes(normalized) ||
            post.category?.toLowerCase().includes(normalized),
        )
        .map((post) => toPost(store, post, viewerId)),
      prayerRequests: store.prayerRequests
        .filter((prayer) => canViewPrayer(store, prayer, viewerId))
        .filter(
          (prayer) =>
            prayer.title.toLowerCase().includes(normalized) ||
            prayer.description.toLowerCase().includes(normalized),
        )
        .map((prayer) => toPrayerRequest(store, prayer, viewerId)),
    };
  }

  async report(userId: string, payload: ReportPayload): Promise<void> {
    const store = readStore();

    store.reports.unshift({
      id: createId('report'),
      reporterId: userId,
      reason: payload.reason,
      details: payload.details,
      targetUserId: payload.targetUserId,
      postId: payload.postId,
      prayerRequestId: payload.prayerRequestId,
      groupId: payload.groupId,
      status: 'pending',
      createdAt: nowIso(),
    });

    writeStore(store);
  }

  async getAdminDashboard(userId: string): Promise<AdminDashboard | null> {
    const store = readStore();
    const currentUser = store.profiles.find((profile) => profile.id === userId);

    if (!currentUser || !['moderator', 'admin'].includes(currentUser.role)) {
      return null;
    }

    return {
      users: store.profiles.map((profile) => toUserProfile(store, profile, userId)),
      reports: store.reports
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((report) => ({
          id: report.id,
          reason: report.reason,
          details: report.details ?? null,
          status: report.status,
          createdAt: report.createdAt,
        })),
      devotionals: store.devotionals.map(toDevotional),
    };
  }
}
