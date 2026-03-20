import { LockKeyhole, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Surface';
import { GroupSummary } from '@/types/domain';

interface GroupCardProps {
  group: GroupSummary;
  onJoin: () => Promise<unknown> | void;
}

export function GroupCard({ group, onJoin }: GroupCardProps) {
  return (
    <Card className="group-card">
      {group.coverImageUrl ? <img className="group-card__cover" src={group.coverImageUrl} alt={group.name} /> : null}
      <div className="group-card__content">
        <div className="group-card__heading">
          <div>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
          </div>
          {group.isPrivate ? <LockKeyhole size={18} /> : null}
        </div>

        <div className="group-card__meta">
          <span className="tag tag--soft">{group.interestTag || 'Comunidad'}</span>
          <span className="icon-link icon-link--text">
            <UsersRound size={16} />
            <span>{group.memberCount} miembros</span>
          </span>
        </div>

        <div className="inline-actions">
          <Link className="button button--soft" to={`/app/groups/${group.slug}`}>
            Ver grupo
          </Link>
          {!group.joinedByMe ? <Button onClick={onJoin}>Unirme</Button> : <Button variant="secondary">Ya sos parte</Button>}
        </div>
      </div>
    </Card>
  );
}
