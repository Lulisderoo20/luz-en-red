import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { InputField } from '@/components/common/FormFields';
import { Card, EmptyState, LoadingState, SectionHeader } from '@/components/common/Surface';
import { useAsyncData } from '@/hooks/useAsyncData';

export function SearchPage() {
  const { backend, user } = useApp();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const { data, isLoading } = useAsyncData(
    () =>
      user && submittedQuery
        ? backend.search(user.id, submittedQuery)
        : Promise.resolve({
            profiles: [],
            groups: [],
            posts: [],
            prayerRequests: [],
          }),
    [backend, submittedQuery, user?.id],
    {
      profiles: [],
      groups: [],
      posts: [],
      prayerRequests: [],
    },
  );

  if (!user) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  return (
    <div className="page">
      <Card className="hero-card hero-card--compact">
        <SectionHeader
          eyebrow="Explorar"
          title="Buscá hermanas, grupos y temas"
          description="Encontrá conversaciones, versículos y comunidades afines a tu momento espiritual."
        />
        <form className="search-form" onSubmit={handleSubmit}>
          <InputField
            label="Buscar"
            placeholder="oración, liderazgo, Salmo 46..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit">Buscar</Button>
        </form>
      </Card>

      {isLoading ? <LoadingState label="Buscando con cuidado..." /> : null}

      {!isLoading && !submittedQuery ? (
        <EmptyState
          title="Todavía no buscaste nada"
          description="Probá con temas como oración, maternidad, propósito o el nombre de una hermana."
        />
      ) : null}

      {!isLoading && submittedQuery ? (
        <div className="stack-xl">
          <Card>
            <SectionHeader title="Usuarias" description={`${data.profiles.length} resultado(s)`} />
            <div className="stack-md">
              {data.profiles.map((profile) => (
                <Link className="list-row" key={profile.id} to={`/app/profile/${profile.username}`}>
                  <Avatar name={profile.displayName} src={profile.avatarUrl} size="sm" />
                  <div>
                    <strong>{profile.displayName}</strong>
                    <p>@{profile.username}</p>
                  </div>
                </Link>
              ))}
              {data.profiles.length === 0 ? <p className="muted">Sin coincidencias en perfiles.</p> : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Grupos" description={`${data.groups.length} resultado(s)`} />
            <div className="stack-md">
              {data.groups.map((group) => (
                <Link className="list-row" key={group.id} to={`/app/groups/${group.slug}`}>
                  <div>
                    <strong>{group.name}</strong>
                    <p>{group.description}</p>
                  </div>
                </Link>
              ))}
              {data.groups.length === 0 ? <p className="muted">Sin coincidencias en grupos.</p> : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Publicaciones" description={`${data.posts.length} resultado(s)`} />
            <div className="stack-md">
              {data.posts.map((post) => (
                <Link className="list-row" key={post.id} to={`/app/posts/${post.id}`}>
                  <div>
                    <strong>{post.author.displayName}</strong>
                    <p>{post.content.slice(0, 120)}...</p>
                  </div>
                </Link>
              ))}
              {data.posts.length === 0 ? <p className="muted">Sin coincidencias en publicaciones.</p> : null}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
