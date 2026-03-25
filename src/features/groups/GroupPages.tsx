import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { ImagePickerField } from '@/components/common/ImagePickerField';
import { InputField, TextareaField } from '@/components/common/FormFields';
import { GroupCard } from '@/components/groups/GroupCard';
import { PostCard } from '@/components/feed/PostCard';
import { PrayerCard } from '@/components/prayers/PrayerCard';
import {
  Card,
  EmptyState,
  LoadingState,
  MessageBanner,
  SectionHeader,
} from '@/components/common/Surface';
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
        title="Encontra tu lugar"
        description="Cada hermana puede crear o sumarse a grupos tematicos para caminar en fe con compania."
        action={
          <Link className="button button--primary" to="/app/groups/new">
            Crear grupo
          </Link>
        }
      />

      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
      {isLoading ? <LoadingState label="Buscando comunidades..." /> : null}

      {!isLoading && data.length === 0 ? (
        <EmptyState
          title="Todavia no hay grupos visibles"
          description="Podes crear el primero y abrir un espacio cuidado para otras hermanas."
          action={
            <Link className="button button--primary" to="/app/groups/new">
              Crear grupo
            </Link>
          }
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

export function CreateGroupPage() {
  const { backend, user } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [interestTag, setInterestTag] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  const currentUser = user;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError('Completa el nombre y la descripcion del grupo.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const group = await backend.createGroup(currentUser.id, {
        name,
        description,
        coverImageUrl,
        interestTag,
        isPrivate,
      });
      navigate(`/app/groups/${group.slug}`, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear el grupo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Nuevo grupo"
        title="Crea una comunidad con proposito"
        description="Cualquier usuaria puede abrir un espacio tematico y reunir hermanas alrededor de una misma carga espiritual."
      />

      <Card>
        <form className="stack-xl" onSubmit={handleSubmit}>
          {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
          <InputField
            label="Nombre del grupo"
            value={name}
            placeholder="Ej. Mujeres de oracion de los jueves"
            onChange={(event) => setName(event.target.value)}
          />
          <TextareaField
            label="Descripcion"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            hint="Conta con claridad para quien es el grupo y como se cuidara la comunidad."
          />
          <div className="grid-two">
            <InputField
              label="Tema principal"
              value={interestTag}
              placeholder="Oracion, maternidad, noviazgo..."
              onChange={(event) => setInterestTag(event.target.value)}
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
              />
              <span>Hacerlo privado para que solo entren miembros aprobados o invitadas.</span>
            </label>
          </div>
          <ImagePickerField
            label="Portada del grupo"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            hint="Podes pegar una URL o subir una imagen desde tu dispositivo."
            previewLabel="Portada del grupo"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando grupo...' : 'Crear grupo'}
          </Button>
        </form>
      </Card>
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
                <Link className="button button--soft" to="/app/feed/new">
                  Crear post
                </Link>
              ) : null
            }
          />
          {data.posts.length === 0 ? (
            <EmptyState
              title="Sin publicaciones todavia"
              description="Se la primera en compartir una palabra para esta comunidad."
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

          <SectionHeader
            title="Pedidos de oracion del grupo"
            description="Intercesion con mas cercania y contexto."
          />
          {data.prayerRequests.length === 0 ? (
            <EmptyState
              title="Sin pedidos cargados"
              description="Todavia no hay pedidos internos para este grupo."
            />
          ) : (
            data.prayerRequests.map((prayer) => (
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
            ))
          )}
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
