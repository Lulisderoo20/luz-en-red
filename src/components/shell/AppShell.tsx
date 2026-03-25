import { Bell, CalendarDays, HeartHandshake, Home, Search, UserRound, UsersRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { Card } from '@/components/common/Surface';

const navItems = [
  { to: '/app/feed', label: 'Inicio', icon: Home },
  { to: '/app/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/app/prayers', label: 'Oración', icon: HeartHandshake },
  { to: '/app/groups', label: 'Grupos', icon: UsersRound },
  { to: '/app/search', label: 'Explorar', icon: Search },
  { to: '/app/profile/me', label: 'Perfil', icon: UserRound },
];

export function AppShell() {
  const { user } = useApp();

  return (
    <div className="app-shell">
      <div className="app-shell__backdrop" />
      <header className="topbar">
        <div>
          <span className="topbar__eyebrow">Luz en Red</span>
          <h1 className="topbar__title">Un espacio seguro para crecer en fe y comunidad</h1>
        </div>
        <NavLink className="icon-link" to="/app/notifications" aria-label="Notificaciones">
          <Bell size={18} />
        </NavLink>
      </header>

      <main className="app-shell__content">
        <Outlet />
      </main>

      <Card className="mobile-user-card">
        <div className="mobile-user-card__content">
          <Avatar name={user?.displayName || 'Hermana'} src={user?.avatarUrl} size="sm" />
          <div>
            <strong>{user?.displayName || 'Hermana'}</strong>
            <p>{user?.favoriteVerse || 'Compartí lo que Dios puso en tu corazón'}</p>
          </div>
        </div>
      </Card>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `bottom-nav__link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
