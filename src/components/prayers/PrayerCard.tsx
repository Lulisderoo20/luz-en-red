import { CheckCircle2, MessageSquareHeart } from 'lucide-react';

import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Surface';
import { formatRelativeDate } from '@/lib/format';
import { PrayerRequest } from '@/types/domain';

interface PrayerCardProps {
  prayer: PrayerRequest;
  onSupport: () => Promise<unknown> | void;
  onComment: () => void;
  onMarkAnswered?: () => Promise<unknown> | void;
}

export function PrayerCard({ prayer, onSupport, onComment, onMarkAnswered }: PrayerCardProps) {
  return (
    <Card className="prayer-card">
      <header className="prayer-card__header">
        <div className="post-card__author">
          <Avatar name={prayer.author.displayName} src={prayer.author.avatarUrl} size="sm" />
          <div>
            <strong>{prayer.author.displayName}</strong>
            <p>{formatRelativeDate(prayer.createdAt)}</p>
          </div>
        </div>
        <span className={`tag ${prayer.status === 'answered' ? 'tag--success' : ''}`}>
          {prayer.status === 'answered' ? 'Respondida' : prayer.visibility === 'group' ? 'Solo grupo' : 'Pública'}
        </span>
      </header>

      <div className="prayer-card__body">
        <h3>{prayer.title}</h3>
        <p>{prayer.description}</p>
        {prayer.groupName ? <span className="tag tag--soft">{prayer.groupName}</span> : null}
      </div>

      <footer className="prayer-card__footer">
        <div className="inline-actions">
          <Button variant={prayer.supportedByMe ? 'secondary' : 'primary'} onClick={onSupport}>
            {prayer.supportedByMe ? 'Seguís orando' : 'Estoy orando por vos'}
          </Button>
          <button type="button" className="icon-link icon-link--text" onClick={onComment}>
            <MessageSquareHeart size={16} />
            <span>{prayer.comments.length} apoyos</span>
          </button>
        </div>

        <div className="prayer-card__meta">
          <span>{prayer.supportCount} hermanas orando</span>
          {onMarkAnswered && prayer.status !== 'answered' ? (
            <button type="button" className="icon-link icon-link--text" onClick={onMarkAnswered}>
              <CheckCircle2 size={16} />
              <span>Marcar como respondida</span>
            </button>
          ) : null}
        </div>
      </footer>
    </Card>
  );
}
