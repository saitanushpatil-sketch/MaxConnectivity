export default function Avatar({ user, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };

  const initial = (user?.displayName || user?.username || '?')[0].toUpperCase();
  const color = user?.avatarColor || '#00F5FF';

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.displayName}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none`}
      style={{
        backgroundColor: color + '22',
        color: color,
        border: `1.5px solid ${color}44`,
      }}
    >
      {initial}
    </div>
  );
}
