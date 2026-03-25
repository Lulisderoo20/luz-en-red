export const spiritualInterests = [
  'oración',
  'estudios bíblicos',
  'matrimonio',
  'maternidad',
  'propósito',
  'sanidad interior',
  'alabanza',
  'liderazgo',
  'servicio',
  'jóvenes',
  'modestia',
  'emprendimiento con fe',
] as const;

export type SpiritualInterest = (typeof spiritualInterests)[number];

export type UserRole = 'member' | 'moderator' | 'admin';
export type PostType =
  | 'reflection'
  | 'testimony'
  | 'prayer_request'
  | 'gratitude'
  | 'verse_of_day'
  | 'short_devotional'
  | 'sisterly_advice';
export type ReactionType = 'amen' | 'inspired' | 'with_you' | 'praying';
export type PrayerVisibility = 'public' | 'group';
export type PrayerStatus = 'active' | 'answered';
export type AgendaItemCategory = 'personal' | 'church' | 'group' | 'service' | 'study';
export type AgendaItemStatus = 'scheduled' | 'completed';
export type GroupRole = 'member' | 'moderator' | 'owner';
export type NotificationType =
  | 'new_follower'
  | 'post_comment'
  | 'post_reaction'
  | 'prayer_response'
  | 'group_invite'
  | 'group_post'
  | 'system';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  denomination: string | null;
  churchName: string | null;
  location: string | null;
  favoriteVerse: string | null;
  interests: SpiritualInterest[];
  role: UserRole;
  isOnboardingComplete: boolean;
  isSuspended: boolean;
  followersCount: number;
  followingCount: number;
  groupsCount: number;
  postsCount: number;
  prayerCount: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  author: UserProfile;
  content: string;
  createdAt: string;
}

export interface PostReactionSummary {
  type: ReactionType;
  label: string;
  count: number;
  reactedByMe: boolean;
}

export interface Post {
  id: string;
  author: UserProfile;
  groupId?: string | null;
  groupName?: string | null;
  type: PostType;
  content: string;
  imageUrl: string | null;
  bibleVerse: string | null;
  category: string | null;
  isPrivate: boolean;
  comments: PostComment[];
  reactions: PostReactionSummary[];
  savedByMe: boolean;
  createdAt: string;
}

export interface PrayerComment {
  id: string;
  prayerRequestId: string;
  author: UserProfile;
  content: string;
  createdAt: string;
}

export interface PrayerRequest {
  id: string;
  author: UserProfile;
  groupId?: string | null;
  groupName?: string | null;
  title: string;
  description: string;
  visibility: PrayerVisibility;
  status: PrayerStatus;
  supportCount: number;
  supportedByMe: boolean;
  comments: PrayerComment[];
  isSensitive: boolean;
  createdAt: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: AgendaItemCategory;
  startsAt: string;
  endsAt: string | null;
  status: AgendaItemStatus;
  groupId?: string | null;
  groupName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  interestTag: string | null;
  isPrivate: boolean;
  memberCount: number;
  createdBy: string;
  joinedByMe: boolean;
}

export interface GroupDetail extends GroupSummary {
  members: UserProfile[];
  posts: Post[];
  prayerRequests: PrayerRequest[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  actor: UserProfile | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface DevotionalContent {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  kind: string;
  verseReference: string | null;
  imageUrl: string | null;
  publishedOn: string;
  isFeatured: boolean;
}

export interface SearchResults {
  profiles: UserProfile[];
  groups: GroupSummary[];
  posts: Post[];
  prayerRequests: PrayerRequest[];
}

export interface AdminDashboard {
  users: UserProfile[];
  reports: ReportItem[];
  devotionals: DevotionalContent[];
}

export interface AppSession {
  user: UserProfile | null;
  mode: 'demo' | 'supabase';
}

export interface SignUpPayload {
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface OnboardingPayload {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  denomination?: string;
  churchName?: string;
  location?: string;
  favoriteVerse?: string;
  interests: SpiritualInterest[];
}

export interface CreatePostPayload {
  type: PostType;
  content: string;
  imageUrl?: string;
  bibleVerse?: string;
  category?: string;
  groupId?: string;
  isPrivate?: boolean;
}

export interface CreatePrayerPayload {
  title: string;
  description: string;
  visibility: PrayerVisibility;
  groupId?: string;
  isSensitive?: boolean;
}

export interface CreateAgendaItemPayload {
  title: string;
  description?: string;
  location?: string;
  category: AgendaItemCategory;
  startsAt: string;
  endsAt?: string;
  groupId?: string;
}

export interface CreateGroupPayload {
  name: string;
  description: string;
  coverImageUrl?: string;
  interestTag?: string;
  isPrivate?: boolean;
}

export interface UpdateProfilePayload extends OnboardingPayload {}

export interface ReportPayload {
  targetUserId?: string;
  postId?: string;
  prayerRequestId?: string;
  groupId?: string;
  reason: string;
  details?: string;
}
