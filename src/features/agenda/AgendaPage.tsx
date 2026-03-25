import { FormEvent, useMemo, useState } from 'react';

import { useApp } from '@/app/AppContext';
import { AgendaItemCard } from '@/components/agenda/AgendaItemCard';
import { Button } from '@/components/common/Button';
import { InputField, SelectField, TextareaField } from '@/components/common/FormFields';
import {
  Card,
  EmptyState,
  LoadingState,
  MessageBanner,
  SectionHeader,
} from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';
import { AgendaItemCategory } from '@/types/domain';

const agendaCategories: Array<{ value: AgendaItemCategory; label: string }> = [
  { value: 'personal', label: 'Personal' },
  { value: 'church', label: 'Iglesia' },
  { value: 'group', label: 'Grupo' },
  { value: 'service', label: 'Servicio' },
  { value: 'study', label: 'Estudio' },
];

function getDefaultDateTimeValue() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AgendaPage() {
  const { backend, user } = useApp();
  const [refreshToken, setRefreshToken] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<AgendaItemCategory>('personal');
  const [startsAt, setStartsAt] = useState(getDefaultDateTimeValue());
  const [endsAt, setEndsAt] = useState('');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: agendaItems, isLoading } = useAsyncData(
    () => (user ? backend.getAgendaItems(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );
  const { data: groups } = useAsyncData(
    () => (user ? backend.getGroups(user.id) : Promise.resolve([])),
    [backend, user?.id],
    [],
  );

  const joinedGroups = useMemo(() => groups.filter((group) => group.joinedByMe), [groups]);
  const upcomingItems = useMemo(
    () => agendaItems.filter((item) => item.status === 'scheduled'),
    [agendaItems],
  );
  const completedItems = useMemo(
    () =>
      [...agendaItems]
        .filter((item) => item.status === 'completed')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [agendaItems],
  );

  if (!user) return null;
  const currentUser = user;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Escribi un titulo para tu agenda.');
      return;
    }

    if (!startsAt) {
      setError('Elegi la fecha y hora del compromiso.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await backend.createAgendaItem(currentUser.id, {
        title,
        description,
        location,
        category,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        groupId: groupId || undefined,
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('personal');
      setStartsAt(getDefaultDateTimeValue());
      setEndsAt('');
      setGroupId('');
      setMessage('Tu agenda ya quedo guardada.');
      setRefreshToken((value) => value + 1);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'No pudimos guardar este compromiso.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm('Este item se eliminara de tu agenda.')) {
      return;
    }

    await backend.deleteAgendaItem(currentUser.id, itemId);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="page">
      <Card className="hero-card hero-card--compact">
        <SectionHeader
          eyebrow="Agenda"
          title="Ordena tus tiempos con paz"
          description="Anota reuniones, estudios, servicios y recordatorios sin salir de la comunidad."
        />
      </Card>

      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}

      <Card>
        <form className="stack-xl" onSubmit={handleSubmit}>
          {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
          <InputField
            label="Titulo"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Estudio biblico del jueves"
          />
          <TextareaField
            label="Notas"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            hint="Opcional: agrega motivo, pedido o detalle a recordar."
          />
          <div className="grid-two">
            <InputField
              label="Lugar"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Casa, iglesia, videollamada..."
            />
            <SelectField
              label="Categoria"
              value={category}
              onChange={(event) => setCategory(event.target.value as AgendaItemCategory)}
            >
              {agendaCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid-two">
            <InputField
              label="Empieza"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
            <InputField
              label="Termina"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </div>
          <SelectField
            label="Vincular a un grupo"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            hint="Opcional: ideal para recordar encuentros de una comunidad."
          >
            <option value="">Sin grupo</option>
            {joinedGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </SelectField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar en agenda'}
          </Button>
        </form>
      </Card>

      <Card className="stack-lg">
        <SectionHeader
          title="Proximos compromisos"
          description={`${upcomingItems.length} pendiente(s)`}
        />
        {isLoading ? <LoadingState label="Cargando agenda..." /> : null}
        {!isLoading && upcomingItems.length === 0 ? (
          <EmptyState
            title="Tu agenda esta tranquila"
            description="Crea tu primer recordatorio para no perder de vista lo importante."
          />
        ) : null}
        <div className="stack-md">
          {upcomingItems.map((item) => (
            <AgendaItemCard
              key={item.id}
              item={item}
              onComplete={() =>
                backend
                  .setAgendaItemStatus(currentUser.id, item.id, 'completed')
                  .then(() => setRefreshToken((value) => value + 1))
              }
              onReopen={() =>
                backend
                  .setAgendaItemStatus(currentUser.id, item.id, 'scheduled')
                  .then(() => setRefreshToken((value) => value + 1))
              }
              onDelete={() => void handleDelete(item.id)}
            />
          ))}
        </div>
      </Card>

      <Card className="stack-lg">
        <SectionHeader title="Ya realizados" description={`${completedItems.length} registrado(s)`} />
        {completedItems.length === 0 ? (
          <EmptyState
            title="Todavia no marcaste compromisos realizados"
            description="Cuando completes alguno, quedara guardado aqui para que veas tu avance."
          />
        ) : (
          <div className="stack-md">
            {completedItems.map((item) => (
              <AgendaItemCard
                key={item.id}
                item={item}
                onComplete={() =>
                  backend
                    .setAgendaItemStatus(currentUser.id, item.id, 'completed')
                    .then(() => setRefreshToken((value) => value + 1))
                }
                onReopen={() =>
                  backend
                    .setAgendaItemStatus(currentUser.id, item.id, 'scheduled')
                    .then(() => setRefreshToken((value) => value + 1))
                }
                onDelete={() => void handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
