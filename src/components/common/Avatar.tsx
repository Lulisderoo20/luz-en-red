interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return src ? (
    <img className={`avatar avatar--${size}`} src={src} alt={name} />
  ) : (
    <div className={`avatar avatar--${size} avatar--fallback`} aria-label={name}>
      {initials || 'LR'}
    </div>
  );
}
