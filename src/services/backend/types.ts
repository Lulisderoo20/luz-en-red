import {
  AgendaItem,
  AdminDashboard,
  AppSession,
  CreateAgendaItemPayload,
  CreateGroupPayload,
  CreatePostPayload,
  CreatePrayerPayload,
  DevotionalContent,
  GroupDetail,
  GroupSummary,
  NotificationItem,
  OnboardingPayload,
  Post,
  PrayerRequest,
  ReportPayload,
  SearchResults,
  SignInPayload,
  SignUpPayload,
  UpdateProfilePayload,
  UserProfile,
} from '@/types/domain';

export interface BackendAdapter {
  mode: 'demo' | 'supabase';
  getSession(): Promise<AppSession>;
  onAuthStateChange(callback: () => void): () => void;
  signIn(payload: SignInPayload): Promise<AppSession>;
  signUp(payload: SignUpPayload): Promise<AppSession>;
  signInWithGoogle(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  completeOnboarding(userId: string, payload: OnboardingPayload): Promise<UserProfile>;
  updateProfile(userId: string, payload: UpdateProfilePayload): Promise<UserProfile>;
  getProfileById(id: string, viewerId?: string): Promise<UserProfile | null>;
  getProfileByUsername(username: string, viewerId?: string): Promise<UserProfile | null>;
  getFeed(viewerId: string, filter?: 'all' | 'following'): Promise<Post[]>;
  getPostById(id: string, viewerId: string): Promise<Post | null>;
  createPost(userId: string, payload: CreatePostPayload): Promise<Post>;
  togglePostReaction(userId: string, postId: string, reaction: Post['reactions'][number]['type']): Promise<Post>;
  addPostComment(userId: string, postId: string, content: string): Promise<Post>;
  toggleSavedPost(userId: string, postId: string): Promise<Post>;
  getSavedPosts(userId: string): Promise<Post[]>;
  getPrayerRequests(viewerId: string): Promise<PrayerRequest[]>;
  createPrayerRequest(userId: string, payload: CreatePrayerPayload): Promise<PrayerRequest>;
  togglePrayerSupport(userId: string, prayerRequestId: string): Promise<PrayerRequest>;
  addPrayerComment(userId: string, prayerRequestId: string, content: string): Promise<PrayerRequest>;
  markPrayerAnswered(userId: string, prayerRequestId: string): Promise<PrayerRequest>;
  getAgendaItems(userId: string): Promise<AgendaItem[]>;
  createAgendaItem(userId: string, payload: CreateAgendaItemPayload): Promise<AgendaItem>;
  setAgendaItemStatus(userId: string, agendaItemId: string, status: AgendaItem['status']): Promise<AgendaItem>;
  deleteAgendaItem(userId: string, agendaItemId: string): Promise<void>;
  getGroups(viewerId: string): Promise<GroupSummary[]>;
  getGroupBySlug(viewerId: string, slug: string): Promise<GroupDetail | null>;
  createGroup(userId: string, payload: CreateGroupPayload): Promise<GroupSummary>;
  joinGroup(userId: string, groupId: string): Promise<GroupSummary>;
  leaveGroup(userId: string, groupId: string): Promise<void>;
  followUser(userId: string, targetUserId: string): Promise<UserProfile>;
  blockUser(userId: string, targetUserId: string): Promise<void>;
  getNotifications(userId: string): Promise<NotificationItem[]>;
  markNotificationRead(userId: string, notificationId: string): Promise<void>;
  getDevotionals(): Promise<DevotionalContent[]>;
  search(viewerId: string, query: string): Promise<SearchResults>;
  report(userId: string, payload: ReportPayload): Promise<void>;
  getAdminDashboard(userId: string): Promise<AdminDashboard | null>;
}
