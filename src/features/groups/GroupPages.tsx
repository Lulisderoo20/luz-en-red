import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { GroupCard } from '@/components/groups/GroupCard';
import { PostCard } from '@/components/feed/PostCard';
import { PrayerCard } from '@/components/prayers/PrayerCard';
import { EmptyState, LoadingState, MessageBanner, SectionHeader } from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';

export function GroupsPage() {
  const { backend, user } = useApp();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const { data, isLoading } = useAsyncData(
    () => (user ? backend.getGroups(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );

  if (!user) return null;
  const currentUser = user;

  async function handleJoin(groupId: string) {
    try {
      await backend.joinGroup(currentUser.id, groupId);
      setRefreshToken((value) => value + 1);
      setMessage('Ya sos parte de esta comunidad.');
    } catch (joinError) {
      setMessage(joinError instanceof Error ? joinError.message : 'No pudimos unirte al grupo.');
    }
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Comunidades"
        title="Encontrá tu lugar"
        description="Grupos temáticos para crecer con otras cristianas en un marco sano y cuidado."
      />

      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
      {isLoading ? <LoadingState label="Buscando comunidades..." /> : null}

      {!isLoading && data.length === 0 ? (
        <EmptyState
          title="Todavía no hay grupos visibles"
          description="Pronto vas a encontrar comunidades temáticas para oración, estudio bíblico y más."
        />
      ) : null}

      <div className="stack-lg">
        {data.map((group) => (
          <GroupCard key={group.id} group={group} onJoin={() => handleJoin(group.id)} />
        ))}
      </div>
    </div>
  );
}

export function GroupDetailPage() {
  const { backend, user } = useApp();
  const { slug = '' } = useParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const { data, isLoading } = useAsyncData(
    () => (user ? backend.getGroupBySlug(user.id, slug) : Promise.resolve(null)),
    [backend, refreshToken, slug, user?.id],
    null,
  );

  if (!user) return null;
  const currentUser = user;

  if (isLoading) {
    return <LoadingState label="Abriendo grupo..." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="No encontramos este grupo"
        description="Puede ser privado o no estar disponible para tu perfil."
      />
    );
  }

  return (
    <div className="page">
      <section className="group-hero">
        {data.coverImageUrl ? <img src={data.coverImageUrl} alt={data.name} /> : null}
        <div className="group-hero__overlay">
          <span className="tag tag--soft">{data.interestTag || 'Comunidad'}</span>
          <h1>{data.name}</h1>
          <p>{data.description}</p>
        </div>
      </section>

      <div className="grid-detail">
        <section className="stack-lg">
          <SectionHeader
            title="Publicaciones del grupo"
            description="Reflexiones, testimonios y contenido interno."
            action={
              data.joinedByMe ? (
                <Link className="button button--soft" to={`/app/feed/new`}>
                  Crear post
                </Link>
              ) : null
            }
          />
          {data.posts.length === 0 ? (
            <EmptyState
              title="Sin publicaciones todavía"
              description="Sé la primera en compartir una palabra para esta comunidad."
            />
          ) : (
            data.posts.map((post) => (
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

          <SectionHeader title="Pedidos de oración del grupo" description="Intercesión con más cercanía y contexto." />
          {data.prayerRequests.map((prayer) => (
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
        </section>

        <aside className="stack-lg">
          <SectionHeader title="Miembros" description={`${data.members.length} hermanas en esta comunidad`} />
          <div className="card stack-md">
            {data.members.map((member) => (
              <Link key={member.id} className="list-row" to={`/app/profile/${member.username}`}>
                <Avatar name={member.displayName} src={member.avatarUrl} size="sm" />
                <div>
                  <strong>{member.displayName}</strong>
                  <p>@{member.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
