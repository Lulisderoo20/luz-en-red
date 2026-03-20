import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { PrayerCard } from '@/components/prayers/PrayerCard';
import { Button } from '@/components/common/Button';
import { InputField, SelectField, TextareaField } from '@/components/common/FormFields';
import { Card, EmptyState, LoadingState, MessageBanner, SectionHeader } from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PrayerVisibility } from '@/types/domain';

export function PrayerRequestsPage() {
  const { backend, user } = useApp();
  const [refreshToken, setRefreshToken] = useState(0);
  const [activePrayerId, setActivePrayerId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { data, isLoading } = useAsyncData(
    () => (user ? backend.getPrayerRequests(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );

  if (!user) return null;
  const currentUser = user;

  async function handleSupport(prayerId: string) {
    await backend.togglePrayerSupport(currentUser.id, prayerId);
    setRefreshToken((value) => value + 1);
  }

  async function handleComment(event: FormEvent) {
    event.preventDefault();
    if (!activePrayerId || !comment.trim()) return;

    await backend.addPrayerComment(currentUser.id, activePrayerId, comment);
    setComment('');
    setActivePrayerId(null);
    setRefreshToken((value) => value + 1);
    setMessage('Tu mensaje de apoyo ya acompaña este pedido.');
  }

  return (
    <div className="page">
      <Card className="hero-card hero-card--compact">
        <SectionHeader
          eyebrow="Pedidos de oración"
          title="Hoy estamos orando con vos"
          description="Intercedamos con discreción, ternura y fe por cada hermana."
          action={
            <Link className="button button--primary" to="/app/prayers/new">
              Nuevo pedido
            </Link>
          }
        />
      </Card>

      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
      {isLoading ? <LoadingState label="Cargando pedidos..." /> : null}

      {!isLoading && data.length === 0 ? (
        <EmptyState
          title="Todavía no hay pedidos cargados"
          description="Podés abrir un espacio de oración para que otras hermanas te acompañen."
          action={
            <Link className="button button--primary" to="/app/prayers/new">
              Crear pedido
            </Link>
          }
        />
      ) : null}

      <div className="stack-lg">
        {data.map((prayer) => (
          <div key={prayer.id} className="stack-md">
            <PrayerCard
                prayer={prayer}
                onSupport={() => handleSupport(prayer.id)}
                onComment={() => setActivePrayerId(activePrayerId === prayer.id ? null : prayer.id)}
                onMarkAnswered={
                  prayer.author.id === currentUser.id || ['moderator', 'admin'].includes(currentUser.role)
                    ? () => backend.markPrayerAnswered(currentUser.id, prayer.id).then(() => setRefreshToken((value) => value + 1))
                    : undefined
                }
              />
            {activePrayerId === prayer.id ? (
              <Card>
                <form className="stack-md" onSubmit={handleComment}>
                  <TextareaField
                    label="Comentario de apoyo"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button type="submit">Enviar apoyo</Button>
                </form>
              </Card>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreatePrayerPage() {
  const { backend, user } = useApp();
  const navigate = useNavigate();
  const { data: groups } = useAsyncData(
    () => (user ? backend.getGroups(user.id) : Promise.resolve([])),
    [backend, user?.id],
    [],
  );
  const joinedGroups = groups.filter((group) => group.joinedByMe);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<PrayerVisibility>('public');
  const [groupId, setGroupId] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  const currentUser = user;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Completá el título y la descripción del pedido.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await backend.createPrayerRequest(currentUser.id, {
        title,
        description,
        visibility,
        groupId: visibility === 'group' ? groupId : undefined,
        isSensitive,
      });
      navigate('/app/prayers', { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos guardar tu pedido.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Nuevo pedido"
        title="Abrí un espacio de oración"
        description="Podés mantenerlo público o llevarlo a un grupo más íntimo."
      />

      <Card>
        <form className="stack-xl" onSubmit={handleSubmit}>
          {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
          <InputField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextareaField
            label="Descripción"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <SelectField
            label="Visibilidad"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PrayerVisibility)}
          >
            <option value="public">Pública</option>
            <option value="group">Solo para un grupo</option>
          </SelectField>
          {visibility === 'group' ? (
            <SelectField label="Grupo" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Elegí un grupo</option>
              {joinedGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </SelectField>
          ) : null}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isSensitive}
              onChange={(e) => setIsSensitive(e.target.checked)}
            />
            <span>Marcar como contenido sensible para una moderación más cuidadosa.</span>
          </label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Publicar pedido'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
