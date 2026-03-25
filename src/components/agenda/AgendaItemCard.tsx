import { CalendarDays, CheckCircle2, MapPin, RotateCcw, Trash2, UsersRound } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Surface';
import { AgendaItem } from '@/types/domain';

const categoryLabels: Record<AgendaItem['category'], string> = {
  personal: 'Personal',
  church: 'Iglesia',
  group: 'Grupo',
  service: 'Servicio',
  study: 'Estudio',
};

function formatAgendaDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

interface AgendaItemCardProps {
  item: AgendaItem;
  onComplete: () => void;
  onReopen: () => void;
  onDelete: () => void;
}

export function AgendaItemCard({
  item,
  onComplete,
  onReopen,
  onDelete,
}: AgendaItemCardProps) {
  return (
    <Card className={`agenda-card${item.status === 'completed' ? ' is-completed' : ''}`}>
      <div className="agenda-card__header">
        <div>
          <span className={`tag${item.status === 'completed' ? ' tag--success' : ' tag--soft'}`}>
            {item.status === 'completed' ? 'Realizado' : 'Pendiente'}
          </span>
          <h3>{item.title}</h3>
        </div>
        <span className="tag">{categoryLabels[item.category]}</span>
      </div>

      {item.description ? <p className="agenda-card__description">{item.description}</p> : null}

      <div className="agenda-card__meta">
        <span>
          <CalendarDays size={16} />
          <span>{formatAgendaDate(item.startsAt)}</span>
        </span>
        {item.location ? (
          <span>
            <MapPin size={16} />
            <span>{item.location}</span>
          </span>
        ) : null}
        {item.groupName ? (
          <span>
            <UsersRound size={16} />
            <span>{item.groupName}</span>
          </span>
        ) : null}
      </div>

      <div className="inline-actions">
        {item.status === 'completed' ? (
          <Button type="button" variant="secondary" onClick={onReopen}>
            <RotateCcw size={16} />
            <span>Volver a pendiente</span>
          </Button>
        ) : (
          <Button type="button" variant="soft" onClick={onComplete}>
            <CheckCircle2 size={16} />
            <span>Marcar realizada</span>
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onDelete}>
          <Trash2 size={16} />
          <span>Eliminar</span>
        </Button>
      </div>
    </Card>
  );
}
