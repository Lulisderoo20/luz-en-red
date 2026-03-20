import { useState } from 'react';

import { useApp } from '@/app/AppContext';
import { Button } from '@/components/common/Button';
import { NotificationCard } from '@/components/common/NotificationCard';
import { EmptyState, LoadingState, SectionHeader } from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';

export function NotificationsPage() {
  const { backend, user } = useApp();
  const [refreshToken, setRefreshToken] = useState(0);
  const { data, isLoading } = useAsyncData(
    () => (user ? backend.getNotifications(user.id) : Promise.resolve([])),
    [backend, refreshToken, user?.id],
    [],
  );

  if (!user) return null;
  const currentUser = user;

  async function markAllAsRead() {
    await Promise.all(
      data.filter((notification) => !notification.isRead).map((notification) =>
        backend.markNotificationRead(currentUser.id, notification.id),
      ),
    );
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Notificaciones"
        title="Lo nuevo en tu comunidad"
        description="Seguimientos, comentarios, reacciones y respuestas a pedidos de oración."
        action={
          data.some((notification) => !notification.isRead) ? (
            <Button variant="soft" onClick={markAllAsRead}>
              Marcar como leídas
            </Button>
          ) : null
        }
      />

      {isLoading ? <LoadingState label="Cargando notificaciones..." /> : null}

      {!isLoading && data.length === 0 ? (
        <EmptyState
          title="Todavía no tenés notificaciones"
          description="Cuando una hermana interactúe con vos, este espacio te lo va a contar."
        />
      ) : null}

      <div className="stack-md">
        {data.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
