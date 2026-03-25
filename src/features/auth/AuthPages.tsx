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
      subtitle="Una comunidad cuidada para compartir fe, oracion y compania."
    >
      <div className="hero-card">
        <p>
          Tu testimonio puede inspirar a otras. Tu oracion puede sostener un corazon. Tu voz
          merece un espacio calido y seguro.
        </p>
        <div className="auth-actions">
          <Link className="button button--primary" to="/auth/register">
            Crear cuenta
          </Link>
          <Link className="button button--secondary" to="/auth/login">
            Iniciar sesion
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export function LoginPage() {
  const { backend, refreshSession } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const activeSession = await backend.getSession();
      const currentUser = session.user || activeSession.user;

      if (!currentUser) {
        setError('No pudimos cargar tu perfil. Intenta nuevamente en unos segundos.');
        return;
      }

      navigate(currentUser.isOnboardingComplete ? '/app/feed' : '/onboarding', {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos iniciar sesion.');
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
      title="Volve a tu comunidad"
      subtitle="Tu sesion queda guardada en este dispositivo hasta que decidas cerrarla."
    >
      <form className="stack-lg" onSubmit={handleSubmit}>
        {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
        <InputField
          label="Email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          onChange={(event) => setEmail(event.target.value)}
        />
        <InputField
          label="Contrasena"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Iniciar sesion'}
        </Button>
        <Button type="button" variant="soft" fullWidth onClick={handleGoogleLogin}>
          Continuar con Google
        </Button>
        <div className="auth-links">
          <Link to="/auth/recover">Recuperar contrasena</Link>
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
  const [message, setMessage] = useState<string | null>(null);
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
      setError('Las contrasenas no coinciden.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      const session = await backend.signUp({ email, password });
      await refreshSession();
      const activeSession = await backend.getSession();
      const currentUser = session.user || activeSession.user;

      if (currentUser) {
        navigate('/onboarding', { replace: true });
        return;
      }

      setMessage(
        'Tu cuenta fue creada. Revisa tu correo si tu proveedor de acceso pide confirmacion antes de continuar.',
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear tu cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Crea tu acceso"
      subtitle="Despues vas a establecer tu nombre visible y tu usuario. No hace falta apellido."
    >
      <form className="stack-lg" onSubmit={handleSubmit}>
        {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
        {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
        <InputField
          label="Email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          onChange={(event) => setEmail(event.target.value)}
        />
        <InputField
          label="Contrasena"
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)}
          hint="Usa al menos 8 caracteres."
        />
        <InputField
          label="Confirmar contrasena"
          type="password"
          value={confirmPassword}
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
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
      setMessage('Si el email existe, te enviamos instrucciones para restablecer tu contrasena.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos iniciar la recuperacion.',
      );
    }
  }

  return (
    <AuthLayout
      title="Recuperar contrasena"
      subtitle="Vamos a ayudarte a volver a entrar con calma y seguridad."
    >
      <form className="stack-lg" onSubmit={handleSubmit}>
        {message ? <MessageBanner tone="success">{message}</MessageBanner> : null}
        {error ? <MessageBanner tone="warning">{error}</MessageBanner> : null}
        <InputField
          label="Email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
        />
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
  const { backend, refreshSession } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      try {
        await refreshSession();
        const session = await backend.getSession();

        if (cancelled) return;

        if (!session.user) {
          navigate('/auth/login', { replace: true });
          return;
        }

        navigate(session.user.isOnboardingComplete ? '/app/feed' : '/onboarding', {
          replace: true,
        });
      } catch {
        if (!cancelled) {
          navigate('/auth/login', { replace: true });
        }
      }
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [backend, navigate, refreshSession]);

  return (
    <AuthLayout
      title="Estamos preparando tu entrada"
      subtitle="Un momento, estamos asegurando tu sesion para llevarte a la comunidad."
    >
      <div className="auth-loader">
        <div className="loading-state__dot" />
      </div>
    </AuthLayout>
  );
}
