import { OnboardingPayload } from '@/types/domain';

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Ingresá tu email.';
  const valid = /\S+@\S+\.\S+/.test(email);
  return valid ? null : 'Ingresá un email válido.';
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Ingresá tu contraseña.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username.trim()) return 'Elegí un nombre de usuario.';
  if (!/^[a-z0-9._]{3,20}$/i.test(username)) {
    return 'El username debe tener entre 3 y 20 caracteres y usar letras, números, punto o guion bajo.';
  }

  return null;
}

export function validateOnboarding(payload: OnboardingPayload): string[] {
  const errors: string[] = [];

  if (!payload.displayName.trim()) errors.push('Ingresá tu nombre visible.');
  const usernameError = validateUsername(payload.username);
  if (usernameError) errors.push(usernameError);
  if (payload.interests.length === 0) errors.push('Elegí al menos un interés espiritual.');

  return errors;
}
