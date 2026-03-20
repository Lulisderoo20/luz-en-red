import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Button } from '@/components/common/Button';
import { InputField, TextareaField } from '@/components/common/FormFields';
import { Card, MessageBanner, SectionHeader } from '@/components/common/Surface';
import { validateOnboarding } from '@/lib/validation';
import { spiritualInterests, SpiritualInterest } from '@/types/domain';

export function OnboardingPage() {
  const { backend, user, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [denomination, setDenomination] = useState(user?.denomination || '');
  const [churchName, setChurchName] = useState(user?.churchName || '');
  const [location, setLocation] = useState(user?.location || '');
  const [favoriteVerse, setFavoriteVerse] = useState(user?.favoriteVerse || '');
  const [interests, setInterests] = useState<SpiritualInterest[]>(
    user?.interests?.length ? user.interests : ['oración'],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.isOnboardingComplete) {
      navigate('/app/feed', { replace: true });
    }
  }, [navigate, user]);

  if (!user) return null;
  const currentUser = user;

  function toggleInterest(interest: SpiritualInterest) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validateOnboarding({
      displayName,
      username,
      avatarUrl,
      bio,
      denomination,
      churchName,
      location,
      favoriteVerse,
      interests,
    });

    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const profile = await backend.completeOnboarding(currentUser.id, {
        displayName,
        username,
        avatarUrl,
        bio,
        denomination,
        churchName,
        location,
        favoriteVerse,
        interests,
      });
      setCurrentUser(profile);
      navigate('/app/feed', { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos guardar tu bienvenida.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page page--standalone">
      <Card className="hero-card hero-card--compact">
        <SectionHeader
          eyebrow="Onboarding"
          title="Contanos un poco sobre vos"
          description="Queremos recibirte con calidez y ayudarte a conectar con hermanas afines desde el primer día."
        />
      </Card>

      <Card>
        <form className="stack-xl" onSubmit={handleSubmit}>
          {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
          <div className="grid-two">
            <InputField
              label="Nombre visible"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <InputField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              hint="Solo letras, números, punto o guion bajo."
            />
          </div>
          <InputField
            label="Foto de perfil (URL)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <TextareaField label="Breve bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          <div className="grid-two">
            <InputField
              label="Denominación"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
            />
            <InputField
              label="Iglesia"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
            />
          </div>
          <div className="grid-two">
            <InputField label="Ciudad o país" value={location} onChange={(e) => setLocation(e.target.value)} />
            <InputField
              label="Versículo favorito"
              value={favoriteVerse}
              onChange={(e) => setFavoriteVerse(e.target.value)}
            />
          </div>

          <div className="stack-md">
            <span className="field__label">Intereses espirituales</span>
            <div className="chip-grid">
              {spiritualInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`chip${interests.includes(interest) ? ' is-active' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando tu bienvenida...' : 'Entrar a la comunidad'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
