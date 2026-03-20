import { FormEvent, useMemo, useState } from 'react';
import { Flag, PlusCircle, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/common/Button';
import { InputField, SelectField, TextareaField } from '@/components/common/FormFields';
import { Card, EmptyState, LoadingState, MessageBanner, SectionHeader } from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatRelativeDate } from '@/lib/format';
import { PostType, ReactionType } from '@/types/domain';

const postTypes: Array<{ value: PostType; label: string }> = [
  { value: 'reflection', label: 'Reflexión' },
  { value: 'testimony', label: 'Testimonio' },
  { value: 'prayer_request', label: 'Pedido de oración' },
  { value: 'gratitude', label: 'Agradecimiento' },
  { value: 'verse_of_day', label: 'Versículo del día' },
  { value: 'short_devotional', label: 'Devocional corto' },
  { value: 'sisterly_advice', label: 'Consejo entre hermanas' },
];

export function FeedPage() {
  const { backend, user } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [refreshToken, setRefreshToken] = useState(0);
  const { data: feed, isLoading } = useAsyncData(
    () => (user ? backend.getFeed(user.id, filter) : Promise.resolve([])),
    [backend, filter, refreshToken, user?.id],
    [],
  );
  const { data: devotionals } = useAsyncData(
    () => backend.getDevotionals(),
    [backend],
    [],
  );

  const featuredDevotional = devotionals[0];

  if (!user) return null;
  const currentUser = user;

  async function handleReact(postId: string, reaction: ReactionType) {
    await backend.togglePostReaction(currentUser.id, postId, reaction);
    setRefreshToken((value) => value + 1);
  }

  async function handleSave(postId: string) {
    await backend.toggleSavedPost(currentUser.id, postId);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="page">
      <Card className="hero-card">
        <SectionHeader
          eyebrow="Feed principal"
          title={`Bienvenida, ${currentUser.displayName || 'hermana'}`}
          description="Compartí lo que Dios puso en tu corazón y encontrá una comunidad que acompaña con gracia."
        />
        <div className="hero-card__actions">
          <Link className="button button--primary" to="/app/feed/new">
            <PlusCircle size={18} />
            <span>Crear publicación</span>
          </Link>
          <Link className="button button--soft" to="/app/prayers/new">
            <Sparkles size={18} />
            <span>Nuevo pedido de oración</span>
          </Link>
        </div>
        {featuredDevotional ? (
          <div className="devotional-banner">
            <span className="tag">Versículo del día</span>
            <h3>{featuredDevotional.title}</h3>
            <p>{featuredDevotional.excerpt}</p>
            {featuredDevotional.verseReference ? (
              <strong>{featuredDevotional.verseReference}</strong>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="segmented-control">
        <button
          type="button"
          className={filter === 'all' ? 'is-active' : ''}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button
          type="button"
          className={filter === 'following' ? 'is-active' : ''}
          onClick={() => setFilter('following')}
        >
          Seguidas
        </button>
      </div>

      {isLoading ? <LoadingState label="Cargando publicaciones..." /> : null}

      {!isLoading && feed.length === 0 ? (
        <EmptyState
          title="Todavía no hay publicaciones"
          description="Tu testimonio puede ser el primero en animar a otra hermana hoy."
          action={
            <Link className="button button--primary" to="/app/feed/new">
              Compartir ahora
            </Link>
          }
        />
      ) : null}

      <div className="stack-lg">
        {feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReact={(reaction) => handleReact(post.id, reaction)}
            onSave={() => handleSave(post.id)}
            onComment={() => navigate(`/app/posts/${post.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export function CreatePostPage() {
  const { backend, user } = useApp();
  const navigate = useNavigate();
  const { data: groups } = useAsyncData(
    () => (user ? backend.getGroups(user.id) : Promise.resolve([])),
    [backend, user?.id],
    [],
  );
  const joinedGroups = useMemo(() => groups.filter((group) => group.joinedByMe), [groups]);
  const [type, setType] = useState<PostType>('reflection');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [category, setCategory] = useState('');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  const currentUser = user;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!content.trim()) {
      setError('Escribí el contenido de tu publicación.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const post = await backend.createPost(currentUser.id, {
        type,
        content,
        imageUrl,
        bibleVerse,
        category,
        groupId: groupId || undefined,
      });
      navigate(`/app/posts/${post.id}`, { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos publicar tu mensaje.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Nueva publicación"
        title="Compartí lo que Dios puso en tu corazón"
        description="Mantené un tono cálido, respetuoso y edificante."
      />

      <Card>
        <form className="stack-xl" onSubmit={handleSubmit}>
          {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
          <SelectField label="Tipo de publicación" value={type} onChange={(e) => setType(e.target.value as PostType)}>
            {postTypes.map((postType) => (
              <option key={postType.value} value={postType.value}>
                {postType.label}
              </option>
            ))}
          </SelectField>
          <TextareaField
            label="Contenido"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            hint="Tu testimonio puede inspirar a otras."
          />
          <div className="grid-two">
            <InputField
              label="Cita bíblica"
              value={bibleVerse}
              onChange={(e) => setBibleVerse(e.target.value)}
            />
            <InputField
              label="Categoría visible"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <InputField
            label="Imagen (URL)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <SelectField label="Grupo (opcional)" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Feed general</option>
            {joinedGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </SelectField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function PostDetailPage() {
  const { backend, user } = useApp();
  const { postId = '' } = useParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { data: post, isLoading } = useAsyncData(
    () => (user ? backend.getPostById(postId, user.id) : Promise.resolve(null)),
    [backend, postId, refreshToken, user?.id],
    null,
  );

  if (!user) return null;
  const currentUser = user;

  async function handleComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;

    await backend.addPostComment(currentUser.id, postId, comment);
    setComment('');
    setRefreshToken((value) => value + 1);
  }

  async function handleReport() {
    await backend.report(currentUser.id, {
      postId,
      reason: 'Contenido a revisar',
      details: 'Reportado desde el detalle de publicación.',
    });
    setMessage('Gracias por avisarnos. El equipo moderador lo revisará con cuidado.');
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setMessage('Enlace copiado para compartir dentro de la comunidad.');
  }

  if (isLoading) {
    return <LoadingState label="Abriendo publicación..." />;
  }

  if (!post) {
    return (
      <EmptyState
        title="No encontramos esta publicación"
        description="Puede haber sido eliminada o no tener acceso desde tu perfil."
      />
    );
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Detalle"
        title={post.category || 'Publicación'}
        description={`Compartida ${formatRelativeDate(post.createdAt)} por ${post.author.displayName}`}
        action={
          <div className="inline-actions">
            <Button variant="soft" onClick={handleCopyLink}>
              Compartir
            </Button>
            <Button variant="ghost" onClick={handleReport}>
              <Flag size={16} />
              <span>Reportar</span>
            </Button>
          </div>
        }
      />

      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}

      <PostCard
        post={post}
        onReact={(reaction) => backend.togglePostReaction(currentUser.id, post.id, reaction).then(() => setRefreshToken((value) => value + 1))}
        onSave={() => backend.toggleSavedPost(currentUser.id, post.id).then(() => setRefreshToken((value) => value + 1))}
      />

      <Card>
        <SectionHeader title="Comentarios" description="Respondé con amor y verdad." />
        <form className="stack-md" onSubmit={handleComment}>
          <TextareaField
            label="Tu comentario"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit">Comentar</Button>
        </form>

        <div className="stack-md">
          {post.comments.map((item) => (
            <div key={item.id} className="comment-row">
              <strong>{item.author.displayName}</strong>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
