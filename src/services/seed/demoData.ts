import {
  AgendaItemCategory,
  AgendaItemStatus,
  NotificationType,
  PostType,
  PrayerStatus,
  PrayerVisibility,
  ReactionType,
  ReportStatus,
  SpiritualInterest,
  UserRole,
} from '@/types/domain';

export interface DemoAccount {
  userId: string;
  email: string;
  password: string;
}

export interface DemoProfileRecord {
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
  createdAt: string;
  updatedAt: string;
}

export interface DemoFollowRecord {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface DemoBlockRecord {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface DemoGroupRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  interestTag: string | null;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoGroupMemberRecord {
  groupId: string;
  userId: string;
  role: 'member' | 'moderator' | 'owner';
  joinedAt: string;
}

export interface DemoPostRecord {
  id: string;
  authorId: string;
  groupId: string | null;
  type: PostType;
  content: string;
  imageUrl: string | null;
  bibleVerse: string | null;
  category: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPostCommentRecord {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface DemoPostReactionRecord {
  postId: string;
  userId: string;
  reaction: ReactionType;
  createdAt: string;
}

export interface DemoSavedPostRecord {
  postId: string;
  userId: string;
  createdAt: string;
}

export interface DemoPrayerRequestRecord {
  id: string;
  authorId: string;
  groupId: string | null;
  title: string;
  description: string;
  visibility: PrayerVisibility;
  status: PrayerStatus;
  supportCount: number;
  isSensitive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPrayerSupportRecord {
  prayerRequestId: string;
  userId: string;
  createdAt: string;
}

export interface DemoPrayerCommentRecord {
  id: string;
  prayerRequestId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface DemoAgendaItemRecord {
  id: string;
  userId: string;
  groupId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  category: AgendaItemCategory;
  startsAt: string;
  endsAt: string | null;
  status: AgendaItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DemoNotificationRecord {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DemoReportRecord {
  id: string;
  reporterId: string;
  targetUserId?: string;
  postId?: string;
  prayerRequestId?: string;
  groupId?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface DemoDevotionalRecord {
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

export interface DemoStore {
  currentUserId: string | null;
  accounts: DemoAccount[];
  profiles: DemoProfileRecord[];
  follows: DemoFollowRecord[];
  blocks: DemoBlockRecord[];
  groups: DemoGroupRecord[];
  groupMembers: DemoGroupMemberRecord[];
  posts: DemoPostRecord[];
  postComments: DemoPostCommentRecord[];
  postReactions: DemoPostReactionRecord[];
  savedPosts: DemoSavedPostRecord[];
  prayerRequests: DemoPrayerRequestRecord[];
  prayerSupports: DemoPrayerSupportRecord[];
  prayerComments: DemoPrayerCommentRecord[];
  agendaItems: DemoAgendaItemRecord[];
  notifications: DemoNotificationRecord[];
  reports: DemoReportRecord[];
  devotionals: DemoDevotionalRecord[];
}

function timestamp(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export const demoCredentials = [
  {
    email: 'ana@luzenred.app',
    password: 'Password123!',
    label: 'Ana Sofía',
  },
  {
    email: 'rebecca@luzenred.app',
    password: 'Password123!',
    label: 'Rebeca Luz',
  },
  {
    email: 'marta@luzenred.app',
    password: 'Password123!',
    label: 'Marta Esperanza',
  },
] as const;

export function createDefaultDemoStore(): DemoStore {
  return {
    currentUserId: null,
    accounts: [
      {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'ana@luzenred.app',
        password: 'Password123!',
      },
      {
        userId: '22222222-2222-2222-2222-222222222222',
        email: 'rebecca@luzenred.app',
        password: 'Password123!',
      },
      {
        userId: '33333333-3333-3333-3333-333333333333',
        email: 'marta@luzenred.app',
        password: 'Password123!',
      },
    ],
    profiles: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'ana@luzenred.app',
        displayName: 'Ana Sofía',
        username: 'ana.sofia',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Aprendiendo a caminar en fe, gracia y verdad cada día.',
        denomination: 'Cristiana evangélica',
        churchName: 'Casa de Gracia',
        location: 'Buenos Aires, Argentina',
        favoriteVerse: 'Salmo 46:10',
        interests: ['oración', 'estudios bíblicos', 'sanidad interior'],
        role: 'member',
        isOnboardingComplete: true,
        isSuspended: false,
        createdAt: timestamp(240),
        updatedAt: timestamp(3),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'rebecca@luzenred.app',
        displayName: 'Rebeca Luz',
        username: 'rebeca.luz',
        avatarUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        bio: 'Mamá, emprendedora y amante de los estudios bíblicos con café.',
        denomination: 'Bautista',
        churchName: 'Luz para las Naciones',
        location: 'Córdoba, Argentina',
        favoriteVerse: 'Proverbios 3:5-6',
        interests: ['maternidad', 'emprendimiento con fe', 'propósito'],
        role: 'member',
        isOnboardingComplete: true,
        isSuspended: false,
        createdAt: timestamp(220),
        updatedAt: timestamp(5),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'marta@luzenred.app',
        displayName: 'Marta Esperanza',
        username: 'marta.esperanza',
        avatarUrl:
          'https://images.unsplash.com/photo-1542204625-de293a2f8ff0?auto=format&fit=crop&w=300&q=80',
        bio: 'Sirviendo con gozo, acompañando procesos de sanidad y oración.',
        denomination: 'Pentecostal',
        churchName: 'Río de Vida',
        location: 'Santiago, Chile',
        favoriteVerse: 'Isaías 41:10',
        interests: ['oración', 'liderazgo', 'servicio'],
        role: 'moderator',
        isOnboardingComplete: true,
        isSuspended: false,
        createdAt: timestamp(280),
        updatedAt: timestamp(8),
      },
    ],
    follows: [
      {
        followerId: '11111111-1111-1111-1111-111111111111',
        followingId: '22222222-2222-2222-2222-222222222222',
        createdAt: timestamp(72),
      },
      {
        followerId: '11111111-1111-1111-1111-111111111111',
        followingId: '33333333-3333-3333-3333-333333333333',
        createdAt: timestamp(24),
      },
      {
        followerId: '22222222-2222-2222-2222-222222222222',
        followingId: '11111111-1111-1111-1111-111111111111',
        createdAt: timestamp(48),
      },
    ],
    blocks: [],
    groups: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        slug: 'mujeres-de-oracion',
        name: 'Mujeres de oración',
        description:
          'Un refugio para interceder juntas, sostenernos en fe y celebrar respuestas del Señor.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1516589091380-5d8e87df6992?auto=format&fit=crop&w=1200&q=80',
        interestTag: 'oración',
        isPrivate: false,
        createdBy: '33333333-3333-3333-3333-333333333333',
        createdAt: timestamp(300),
        updatedAt: timestamp(10),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        slug: 'emprendedoras-con-fe',
        name: 'Emprendedoras con fe',
        description: 'Ideas, trabajo, propósito y negocio con valores del Reino.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80',
        interestTag: 'emprendimiento con fe',
        isPrivate: false,
        createdBy: '22222222-2222-2222-2222-222222222222',
        createdAt: timestamp(260),
        updatedAt: timestamp(12),
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        slug: 'sanidad-y-restauracion',
        name: 'Sanidad y restauración',
        description: 'Grupo cuidado para acompañarnos con gracia, verdad y esperanza.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        interestTag: 'sanidad interior',
        isPrivate: true,
        createdBy: '33333333-3333-3333-3333-333333333333',
        createdAt: timestamp(320),
        updatedAt: timestamp(18),
      },
    ],
    groupMembers: [
      {
        groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: '33333333-3333-3333-3333-333333333333',
        role: 'owner',
        joinedAt: timestamp(300),
      },
      {
        groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: '11111111-1111-1111-1111-111111111111',
        role: 'member',
        joinedAt: timestamp(160),
      },
      {
        groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: '22222222-2222-2222-2222-222222222222',
        role: 'member',
        joinedAt: timestamp(70),
      },
      {
        groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        userId: '22222222-2222-2222-2222-222222222222',
        role: 'owner',
        joinedAt: timestamp(260),
      },
      {
        groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        userId: '11111111-1111-1111-1111-111111111111',
        role: 'member',
        joinedAt: timestamp(80),
      },
      {
        groupId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        userId: '33333333-3333-3333-3333-333333333333',
        role: 'owner',
        joinedAt: timestamp(320),
      },
      {
        groupId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        userId: '11111111-1111-1111-1111-111111111111',
        role: 'member',
        joinedAt: timestamp(40),
      },
    ],
    posts: [
      {
        id: 'd1111111-1111-1111-1111-111111111111',
        authorId: '11111111-1111-1111-1111-111111111111',
        groupId: null,
        type: 'reflection',
        content:
          'Hoy recordé que la quietud también es obediencia. A veces Dios no nos pide correr, sino descansar en Su fidelidad.',
        imageUrl:
          'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80',
        bibleVerse: 'Salmo 46:10',
        category: 'Reflexión',
        isPrivate: false,
        createdAt: timestamp(2),
        updatedAt: timestamp(2),
      },
      {
        id: 'd2222222-2222-2222-2222-222222222222',
        authorId: '22222222-2222-2222-2222-222222222222',
        groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        type: 'testimony',
        content:
          'Abrí mi pequeño proyecto con temor, pero Dios fue abriendo puertas una a una. Hoy solo puedo decir: Su provisión nunca llega tarde.',
        imageUrl: null,
        bibleVerse: 'Filipenses 4:19',
        category: 'Testimonio',
        isPrivate: false,
        createdAt: timestamp(6),
        updatedAt: timestamp(6),
      },
      {
        id: 'd3333333-3333-3333-3333-333333333333',
        authorId: '33333333-3333-3333-3333-333333333333',
        groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        type: 'short_devotional',
        content:
          'Cuando el corazón se cansa, volver a la Palabra no es una tarea más: es volver al hogar.',
        imageUrl: null,
        bibleVerse: 'Mateo 11:28',
        category: 'Devocional corto',
        isPrivate: false,
        createdAt: timestamp(14),
        updatedAt: timestamp(14),
      },
    ],
    postComments: [
      {
        id: 'pc-1',
        postId: 'd1111111-1111-1111-1111-111111111111',
        authorId: '22222222-2222-2222-2222-222222222222',
        content: 'Gracias por compartir esto. Justo necesitaba volver a ese descanso.',
        createdAt: timestamp(1),
      },
      {
        id: 'pc-2',
        postId: 'd3333333-3333-3333-3333-333333333333',
        authorId: '11111111-1111-1111-1111-111111111111',
        content: 'Qué palabra tan precisa. Me abrazó el alma.',
        createdAt: timestamp(5),
      },
    ],
    postReactions: [
      {
        postId: 'd1111111-1111-1111-1111-111111111111',
        userId: '22222222-2222-2222-2222-222222222222',
        reaction: 'amen',
        createdAt: timestamp(1),
      },
      {
        postId: 'd1111111-1111-1111-1111-111111111111',
        userId: '33333333-3333-3333-3333-333333333333',
        reaction: 'inspired',
        createdAt: timestamp(1),
      },
      {
        postId: 'd2222222-2222-2222-2222-222222222222',
        userId: '11111111-1111-1111-1111-111111111111',
        reaction: 'with_you',
        createdAt: timestamp(3),
      },
    ],
    savedPosts: [
      {
        postId: 'd3333333-3333-3333-3333-333333333333',
        userId: '11111111-1111-1111-1111-111111111111',
        createdAt: timestamp(4),
      },
    ],
    prayerRequests: [
      {
        id: 'e1111111-1111-1111-1111-111111111111',
        authorId: '11111111-1111-1111-1111-111111111111',
        groupId: null,
        title: 'Oración por dirección y paz',
        description:
          'Estoy tomando una decisión importante de trabajo y necesito paz, claridad y obediencia para caminar donde Dios quiera.',
        visibility: 'public',
        status: 'active',
        supportCount: 2,
        isSensitive: false,
        createdAt: timestamp(7),
        updatedAt: timestamp(7),
      },
      {
        id: 'e2222222-2222-2222-2222-222222222222',
        authorId: '33333333-3333-3333-3333-333333333333',
        groupId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        title: 'Fortaleza en proceso de sanidad',
        description:
          'Acompañemos a una hermana del grupo que está atravesando una etapa sensible. Oremos con cuidado, discreción y esperanza.',
        visibility: 'group',
        status: 'active',
        supportCount: 1,
        isSensitive: true,
        createdAt: timestamp(20),
        updatedAt: timestamp(20),
      },
    ],
    prayerSupports: [
      {
        prayerRequestId: 'e1111111-1111-1111-1111-111111111111',
        userId: '22222222-2222-2222-2222-222222222222',
        createdAt: timestamp(6),
      },
      {
        prayerRequestId: 'e1111111-1111-1111-1111-111111111111',
        userId: '33333333-3333-3333-3333-333333333333',
        createdAt: timestamp(5),
      },
      {
        prayerRequestId: 'e2222222-2222-2222-2222-222222222222',
        userId: '11111111-1111-1111-1111-111111111111',
        createdAt: timestamp(15),
      },
    ],
    prayerComments: [
      {
        id: 'prc-1',
        prayerRequestId: 'e1111111-1111-1111-1111-111111111111',
        authorId: '22222222-2222-2222-2222-222222222222',
        content: 'Estoy orando para que el Señor te confirme cada paso con Su paz.',
        createdAt: timestamp(6),
      },
      {
        id: 'prc-2',
        prayerRequestId: 'e1111111-1111-1111-1111-111111111111',
        authorId: '33333333-3333-3333-3333-333333333333',
        content: 'Que Dios abra lo correcto y cierre con amor lo que no conviene.',
        createdAt: timestamp(5),
      },
    ],
    agendaItems: [],
    notifications: [
      {
        id: 'n-1',
        recipientId: '11111111-1111-1111-1111-111111111111',
        actorId: '22222222-2222-2222-2222-222222222222',
        type: 'new_follower',
        entityType: 'profile',
        entityId: '22222222-2222-2222-2222-222222222222',
        message: 'Rebeca Luz comenzó a seguirte.',
        isRead: false,
        createdAt: timestamp(4),
      },
      {
        id: 'n-2',
        recipientId: '11111111-1111-1111-1111-111111111111',
        actorId: '33333333-3333-3333-3333-333333333333',
        type: 'prayer_response',
        entityType: 'prayer_request',
        entityId: 'e1111111-1111-1111-1111-111111111111',
        message: 'Marta Esperanza indicó que está orando por vos.',
        isRead: false,
        createdAt: timestamp(5),
      },
      {
        id: 'n-3',
        recipientId: '11111111-1111-1111-1111-111111111111',
        actorId: null,
        type: 'system',
        entityType: null,
        entityId: null,
        message: 'Bienvenida, hermana. Tu espacio seguro ya está listo.',
        isRead: true,
        createdAt: timestamp(24),
      },
    ],
    reports: [
      {
        id: 'r-1',
        reporterId: '33333333-3333-3333-3333-333333333333',
        postId: 'd2222222-2222-2222-2222-222222222222',
        reason: 'Revisar lenguaje',
        details: 'Dato de ejemplo para el panel admin.',
        status: 'pending',
        createdAt: timestamp(3),
      },
    ],
    devotionals: [
      {
        id: 'f1111111-1111-1111-1111-111111111111',
        title: 'Versículo del día',
        excerpt: 'El Señor pelea por vos aun cuando tu alma está cansada.',
        body:
          'A veces la fe se ve como silencio confiado. Hoy, antes de resolver todo, elegí reposar en la presencia de Dios y dejar que Él ordene tus pasos.',
        kind: 'verse_of_day',
        verseReference: 'Éxodo 14:14',
        imageUrl:
          'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
        publishedOn: new Date().toISOString().slice(0, 10),
        isFeatured: true,
      },
      {
        id: 'f2222222-2222-2222-2222-222222222222',
        title: 'Desafío espiritual semanal',
        excerpt: 'Elegí una hermana y sostenela en oración durante siete días.',
        body:
          'Escribí su nombre, orá con intención y mandale una palabra de aliento. El Reino también se construye en lo secreto.',
        kind: 'weekly_challenge',
        verseReference: 'Gálatas 6:2',
        imageUrl: null,
        publishedOn: new Date().toISOString().slice(0, 10),
        isFeatured: false,
      },
    ],
  };
}

function asArray<T>(value: unknown, fallback: T[]) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function migrateDemoStore(value: unknown): DemoStore {
  const defaults = createDefaultDemoStore();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const partial = value as Partial<DemoStore> & { agendaItems?: DemoAgendaItemRecord[] };

  return {
    currentUserId:
      typeof partial.currentUserId === 'string' || partial.currentUserId === null
        ? partial.currentUserId
        : defaults.currentUserId,
    accounts: asArray(partial.accounts, defaults.accounts),
    profiles: asArray(partial.profiles, defaults.profiles),
    follows: asArray(partial.follows, defaults.follows),
    blocks: asArray(partial.blocks, defaults.blocks),
    groups: asArray(partial.groups, defaults.groups),
    groupMembers: asArray(partial.groupMembers, defaults.groupMembers),
    posts: asArray(partial.posts, defaults.posts),
    postComments: asArray(partial.postComments, defaults.postComments),
    postReactions: asArray(partial.postReactions, defaults.postReactions),
    savedPosts: asArray(partial.savedPosts, defaults.savedPosts),
    prayerRequests: asArray(partial.prayerRequests, defaults.prayerRequests),
    prayerSupports: asArray(partial.prayerSupports, defaults.prayerSupports),
    prayerComments: asArray(partial.prayerComments, defaults.prayerComments),
    agendaItems: asArray(partial.agendaItems, defaults.agendaItems),
    notifications: asArray(partial.notifications, defaults.notifications),
    reports: asArray(partial.reports, defaults.reports),
    devotionals: asArray(partial.devotionals, defaults.devotionals),
  };
}
