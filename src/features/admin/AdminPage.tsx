import { useState } from 'react';

import { useApp } from '@/app/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { Card, EmptyState, LoadingState, SectionHeader } from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';

export function AdminPage() {
  const { backend, user } = useApp();
  const [refreshToken] = useState(0);
  const { data, isLoading } = useAsyncData(
    () => (user ? backend.getAdminDashboard(user.id) : Promise.resolve(null)),
    [backend, refreshToken, user?.id],
    null,
  );

  if (!user) return null;

  if (isLoading) {
    return <LoadingState label="Cargando panel admin..." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Sin acceso al panel"
        description="El rol admin/moderadora ya está preparado en la arquitectura, pero esta cuenta no tiene permisos."
      />
    );
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Admin"
        title="Moderación y contenido"
        description="Base inicial para revisar reportes, usuarias y devocionales."
      />

      <div className="grid-detail">
        <Card>
          <SectionHeader title="Usuarias" description={`${data.users.length} registradas`} />
          <div className="stack-md">
            {data.users.map((member) => (
              <div key={member.id} className="list-row">
                <Avatar name={member.displayName} src={member.avatarUrl} size="sm" />
                <div>
                  <strong>{member.displayName || member.email}</strong>
                  <p>
                    @{member.username} · {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Reportes" description={`${data.reports.length} pendientes o históricos`} />
          <div className="stack-md">
            {data.reports.map((report) => (
              <div key={report.id} className="report-row">
                <strong>{report.reason}</strong>
                <p>{report.details || 'Sin detalle adicional.'}</p>
                <span className="tag tag--soft">{report.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Contenido devocional" description={`${data.devotionals.length} piezas disponibles`} />
        <div className="stack-md">
          {data.devotionals.map((devotional) => (
            <div key={devotional.id} className="report-row">
              <strong>{devotional.title}</strong>
              <p>{devotional.excerpt}</p>
              <span className="tag">{devotional.kind}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
