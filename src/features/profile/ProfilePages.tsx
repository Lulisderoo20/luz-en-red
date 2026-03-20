import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { Flag, ShieldBan, UserPlus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { InputField, TextareaField } from '@/components/common/FormFields';
import { Card, EmptyState, LoadingState, MessageBanner, SectionHeader } from '@/components/common/Surface';
import { PostCard } from '@/components/feed/PostCard';
import { PrayerCard } from '@/components/prayers/PrayerCard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { spiritualInterests, SpiritualInterest, UserProfile } from '@/types/domain';

function ProfileHero({
  profile,
  actions,
}: {
  profile: UserProfile;
  actions?: ReactNode;
}) {
  return (
    <Card className="profile-hero">
      <div className="profile-hero__main">
        <Avatar name={profile.displayName} src={profile.avatarUrl} size="lg" />
        <div>
          <span className="section-header__eyebrow">@{profile.username}</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || 'Una hermana caminando en fe y comunidad.'}</p>
          {profile.favoriteVerse ? <blockquote>{profile.favoriteVerse}</blockquote> : null}
        </div>
      </div>
      <div className="stats-grid">
        <div>
          <strong>{profile.postsCount}</strong>
          <span>Posts</span>
        </div>
        <div>
          <strong>{profile.prayerCount}</strong>
          <span>Pedidos</span>
        </div>
        <div>
          <strong>{profile.followersCount}</strong>
          <span>Seguidoras</span>
        </div>
        <div>
          <strong>{profile.groupsCount}</strong>
          <span>Grupos</span>
        </div>
      </div>
      {actions}
      <div className="chip-grid">
        {profile.interests.map((interest) => (
          <span key={interest} className="chip is-active">
            {interest}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function MyProfilePage() {
  const { backend, user } = useApp();
  const [refreshToken, setRefreshToken] = useState(0);
  const { data: savedPosts } = useAsyncData(
    () => (user ? backend.getSavedPosts(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );
  const { data: allPosts } = useAsyncData(
    () => (user ? backend.getFeed(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );
  const { data: prayers } = useAsyncData(
    () => (user ? backend.getPrayerRequests(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );
  const { data: groups } = useAsyncData(
    () => (user ? backend.getGroups(user.id) : Promise.resolve([])),
    [backend, user?.id],
    [],
  );

  const myPosts = useMemo(
    () => allPosts.filter((post) => post.author.id === user?.id),
    [allPosts, user?.id],
  );
  const myPrayers = useMemo(
    () => prayers.filter((prayer) => prayer.author.id === user?.id),
    [prayers, user?.id],
  );
  const myGroups = useMemo(() => groups.filter((group) => group.joinedByMe), [groups]);

  if (!user) return null;
  const currentUser = user;

  return (
    <div className="page">
      <ProfileHero
        profile={currentUser}
        actions={
          <div className="inline-actions">
            <Link className="button button--soft" to="/app/profile/edit">
              Editar perfil
            </Link>
            <Link className="button button--ghost" to="/app/settings">
              Ajustes
            </Link>
          </div>
        }
      />

      <div className="stack-xl">
        <Card>
          <SectionHeader title="Tus grupos" description="Comunidades a las que pertenecés." />
          <div className="chip-grid">
            {myGroups.map((group) => (
              <Link key={group.id} className="chip is-active" to={`/app/groups/${group.slug}`}>
                {group.name}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Publicaciones" description={`${myPosts.length} publicación(es)`} />
          <div className="stack-lg">
            {myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={(reaction) =>
                  backend.togglePostReaction(currentUser.id, post.id, reaction).then(() =>
                    setRefreshToken((value) => value + 1),
                  )
                }
                onSave={() =>
                  backend.toggleSavedPost(currentUser.id, post.id).then(() =>
                    setRefreshToken((value) => value + 1),
                  )
                }
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Pedidos de oración" description={`${myPrayers.length} activo(s)`} />
          <div className="stack-lg">
            {myPrayers.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onSupport={() =>
                  backend.togglePrayerSupport(currentUser.id, prayer.id).then(() =>
                    setRefreshToken((value) => value + 1),
                  )
                }
                onComment={() => undefined}
                onMarkAnswered={() =>
                  backend.markPrayerAnswered(currentUser.id, prayer.id).then(() =>
                    setRefreshToken((value) => value + 1),
                  )
                }
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Guardados" description={`${savedPosts.length} publicación(es)`} />
          <div className="stack-lg">
            {savedPosts.length === 0 ? (
              <p className="muted">Todavía no guardaste publicaciones.</p>
            ) : (
              savedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReact={(reaction) =>
                    backend.togglePostReaction(currentUser.id, post.id, reaction).then(() =>
                      setRefreshToken((value) => value + 1),
                    )
                  }
                  onSave={() =>
                    backend.toggleSavedPost(currentUser.id, post.id).then(() =>
                      setRefreshToken((value) => value + 1),
                    )
                  }
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function UserProfilePage() {
  const { backend, user } = useApp();
  const { username = '' } = useParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const { data: profile, isLoading } = useAsyncData(
    () => (user ? backend.getProfileByUsername(username, user.id) : Promise.resolve(null)),
    [backend, refreshToken, username, user?.id],
    null,
  );
  const { data: posts } = useAsyncData(
    () => (user ? backend.getFeed(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );
  const { data: prayers } = useAsyncData(
    () => (user ? backend.getPrayerRequests(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );

  if (!user) return null;
  const currentUser = user;

  if (isLoading) {
    return <LoadingState label="Cargando perfil..." />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="No encontramos este perfil"
        description="Puede haber sido eliminado o no estar visible para vos."
      />
    );
  }

  const viewedProfile = profile;
  const visiblePosts = posts.filter((post) => post.author.id === viewedProfile.id);
  const visiblePrayers = prayers.filter((prayer) => prayer.author.id === viewedProfile.id);

  async function handleFollow() {
    await backend.followUser(currentUser.id, viewedProfile.id);
    setRefreshToken((value) => value + 1);
  }

  async function handleBlock() {
    await backend.blockUser(currentUser.id, viewedProfile.id);
    setMessage('Se restringieron las interacciones visibles con esta usuaria.');
  }

  async function handleReport() {
    await backend.report(currentUser.id, {
      targetUserId: viewedProfile.id,
      reason: 'Perfil a revisar',
      details: 'Reporte enviado desde el perfil público.',
    });
    setMessage('Gracias por avisarnos. Vamos a revisar el reporte.');
  }

  return (
    <div className="page">
      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
      <ProfileHero
        profile={viewedProfile}
        actions={
          <div className="inline-actions">
            <Button onClick={handleFollow}>
              <UserPlus size={16} />
              <span>{viewedProfile.isFollowing ? 'Siguiendo' : 'Seguir'}</span>
            </Button>
            <Button variant="ghost" onClick={handleReport}>
              <Flag size={16} />
              <span>Reportar</span>
            </Button>
            <Button variant="danger" onClick={handleBlock}>
              <ShieldBan size={16} />
              <span>Bloquear</span>
            </Button>
          </div>
        }
      />

      <Card>
        <SectionHeader title="Publicaciones" description={`${visiblePosts.length} publicación(es)`} />
        <div className="stack-lg">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReact={(reaction) =>
                backend.togglePostReaction(currentUser.id, post.id, reaction).then(() =>
                  setRefreshToken((value) => value + 1),
                )
              }
              onSave={() =>
                backend.toggleSavedPost(currentUser.id, post.id).then(() =>
                  setRefreshToken((value) => value + 1),
                )
              }
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Pedidos de oración" description={`${visiblePrayers.length} visible(s)`} />
        <div className="stack-lg">
          {visiblePrayers.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onSupport={() =>
                backend.togglePrayerSupport(currentUser.id, prayer.id).then(() =>
                  setRefreshToken((value) => value + 1),
                )
              }
              onComment={() => undefined}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

export function EditProfilePage() {
  const { backend, user, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [denomination, setDenomination] = useState(user?.denomination || '');
  const [churchName, setChurchName] = useState(user?.churchName || '');
  const [location, setLocation] = useState(user?.location || '');
  const [favoriteVerse, setFavoriteVerse] = useState(user?.favoriteVerse || '');
  const [interests, setInterests] = useState<SpiritualInterest[]>(user?.interests || ['oración']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  const currentUser = user;

  function toggleInterest(interest: SpiritualInterest) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setError(null);
      setIsSubmitting(true);
      const profile = await backend.updateProfile(currentUser.id, {
        displayName,
        username,
        avatarUrl,
        bio,
        denomination,
        churchName,
        location,
        favoriteVerse,
        interests,
      });
      setCurrentUser(profile);
      navigate('/app/profile/me', { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos guardar tu perfil.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Perfil"
        title="Editar perfil"
        description="Ajustá tu presentación para que la comunidad te encuentre y te conozca mejor."
      />

      <Card>
        <form className="stack-xl" onSubmit={handleSubmit}>
          {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
          <div className="grid-two">
            <InputField label="Nombre visible" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <InputField label="Avatar (URL)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <TextareaField label="Bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          <div className="grid-two">
            <InputField label="Denominación" value={denomination} onChange={(e) => setDenomination(e.target.value)} />
            <InputField label="Iglesia" value={churchName} onChange={(e) => setChurchName(e.target.value)} />
          </div>
          <div className="grid-two">
            <InputField label="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} />
            <InputField
              label="Versículo favorito"
              value={favoriteVerse}
              onChange={(e) => setFavoriteVerse(e.target.value)}
            />
          </div>
          <div className="stack-md">
            <span className="field__label">Intereses espirituales</span>
            <div className="chip-grid">
              {spiritualInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`chip${interests.includes(interest) ? ' is-active' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
