import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { Button } from '@/components/common/Button';
import { InputField } from '@/components/common/FormFields';
import { Card, MessageBanner } from '@/components/common/Surface';
import { validateEmail, validatePassword } from '@/lib/validation';

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-page__backdrop" />
      <section className="auth-hero">
        <span className="auth-hero__eyebrow">Luz en Red</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
      <Card className="auth-card">{children}</Card>
    </div>
  );
}

export function WelcomePage() {
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isOnboardingComplete) {
      navigate('/app/feed', { replace: true });
    } else if (user) {
      navigate('/onboarding', { replace: true });
    }
  }, [navigate, user]);

  return (
    <AuthLayout
      title="Bienvenida, hermana"
      subtitle="Una red social cuidada para compartir fe, pedidos de oración, testimonios y comunidad con paz."
    >
      <div className="hero-card">
        <p>
          Tu testimonio puede inspirar a otras. Tu oración puede sostener un corazón. Tu voz
          merece un espacio cálido y seguro.
        </p>
        <div className="auth-actions">
          <Link className="button button--primary" to="/auth/register">
            Crear cuenta
          </Link>
          <Link className="button button--secondary" to="/auth/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export function LoginPage() {
  const { backend, refreshSession } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('ana@luzenred.app');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const session = await backend.signIn({ email, password });
      await refreshSession();
      navigate(session.user?.isOnboardingComplete ? '/app/feed' : '/onboarding', {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError(null);
      await backend.signInWithGoogle();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos iniciar con Google.');
    }
  }

  return (
    <AuthLayout
      title="Volvé a tu comunidad"
      subtitle="Compartí lo que Dios puso en tu corazón y reencontrate con tus hermanas."
    >
      <form className="stack-lg" onSubmit={handleSubmit}>
        {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <InputField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
        <Button type="button" variant="soft" fullWidth onClick={handleGoogleLogin}>
          Continuar con Google
        </Button>
        <div className="auth-links">
          <Link to="/auth/recover">Recuperar contraseña</Link>
          <Link to="/auth/register">Crear una cuenta</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { backend, refreshSession } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await backend.signUp({ email, password });
      await refreshSession();
      navigate('/onboarding', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear tu cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Creá tu espacio seguro"
      subtitle="Diseñada para mujeres cristianas que quieren crecer en fe, oración y comunidad."
    >
      <form className="stack-lg" onSubmit={handleSubmit}>
        {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <InputField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Usá al menos 8 caracteres."
        />
        <InputField
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        <div className="auth-links">
          <Link to="/auth/login">Ya tengo cuenta</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function RecoverPage() {
  const { backend } = useApp();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      setError(null);
      await backend.requestPasswordReset(email);
      setMessage('Si el email existe, te enviamos instrucciones para restablecer tu contraseña.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos iniciar la recuperación.',
      );
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Vamos a ayudarte a volver a entrar con calma y seguridad."
    >
      <form className="stack-lg" onSubmit={handleSubmit}>
        {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
        {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" fullWidth>
          Enviar enlace
        </Button>
        <div className="auth-links">
          <Link to="/auth/login">Volver al login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function AuthCallbackPage() {
  const { refreshSession } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await refreshSession();
      navigate('/app/feed', { replace: true });
    }, 1200);

    return () => clearTimeout(timeout);
  }, [navigate, refreshSession]);

  return (
    <AuthLayout
      title="Estamos preparando tu entrada"
      subtitle="Un momento, estamos asegurando tu sesión para llevarte a la comunidad."
    >
      <div className="auth-loader">
        <div className="loading-state__dot" />
      </div>
    </AuthLayout>
  );
}
