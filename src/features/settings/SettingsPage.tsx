import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Button } from '@/components/common/Button';
import { EmptyState, MessageBanner, SectionHeader, Card } from '@/components/common/Surface';
import { PostCard } from '@/components/feed/PostCard';
import { useAsyncData } from '@/hooks/useAsyncData';

export function SettingsPage() {
  const { backend, user, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const { data: savedPosts } = useAsyncData(
    () => (user ? backend.getSavedPosts(user.id) : Promise.resolve([])),
    [backend, user?.id],
    [],
  );

  if (!user) return null;
  const currentUser = user;

  async function handleSignOut() {
    await backend.signOut();
    setCurrentUser(null);
    navigate('/auth/login', { replace: true });
  }

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Configuración"
        title="Tu cuenta y tu tranquilidad"
        description="Privacidad, seguridad y preferencias para cuidar tu experiencia."
      />

      {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}

      <Card className="settings-list">
        <Link className="settings-list__item" to="/app/profile/edit">
          Editar perfil
        </Link>
        <button type="button" className="settings-list__item" onClick={() => setMessage('La actualización de contraseña queda preparada para el flujo de Supabase Auth.')}>
          Cambiar contraseña
        </button>
        <button type="button" className="settings-list__item" onClick={() => setMessage('La privacidad avanzada y la lista de bloqueadas ya tienen base de datos preparada para una siguiente iteración.')}>
          Privacidad y bloqueos
        </button>
        <button type="button" className="settings-list__item" onClick={() => setMessage('La eliminación de cuenta se deja preparada para una futura acción irreversible con confirmación reforzada.')}>
          Eliminar cuenta
        </button>
      </Card>

      <Card>
        <SectionHeader title="Contenido guardado" description={`${savedPosts.length} publicación(es)`} />
        {savedPosts.length === 0 ? (
          <EmptyState
            title="No guardaste publicaciones todavía"
            description="Cuando algo toque tu corazón, vas a poder volver a encontrarlo acá."
          />
        ) : (
          <div className="stack-lg">
            {savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={(reaction) => backend.togglePostReaction(currentUser.id, post.id, reaction)}
                onSave={() => backend.toggleSavedPost(currentUser.id, post.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Button variant="danger" onClick={handleSignOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
