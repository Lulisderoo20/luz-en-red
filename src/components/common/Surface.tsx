import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <span className="section-header__eyebrow">{eyebrow}</span> : null}
        <h2 className="section-header__title">{title}</h2>
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </Card>
  );
}

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <Card className="loading-state">
      <div className="loading-state__dot" />
      <span>{label}</span>
    </Card>
  );
}

export function MessageBanner({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning';
  children: ReactNode;
}) {
  return <div className={`message-banner message-banner--${tone}`}>{children}</div>;
}
