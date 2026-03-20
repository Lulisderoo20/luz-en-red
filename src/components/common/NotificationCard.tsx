import { BellRing } from 'lucide-react';

import { Avatar } from '@/components/common/Avatar';
import { Card } from '@/components/common/Surface';
import { formatRelativeDate } from '@/lib/format';
import { NotificationItem } from '@/types/domain';

export function NotificationCard({ notification }: { notification: NotificationItem }) {
  return (
    <Card className={`notification-card${notification.isRead ? '' : ' notification-card--unread'}`}>
      <div className="notification-card__icon">
        {notification.actor ? (
          <Avatar name={notification.actor.displayName} src={notification.actor.avatarUrl} size="sm" />
        ) : (
          <div className="icon-badge">
            <BellRing size={16} />
          </div>
        )}
      </div>
      <div className="notification-card__body">
        <p>{notification.message}</p>
        <span>{formatRelativeDate(notification.createdAt)}</span>
      </div>
    </Card>
  );
}
