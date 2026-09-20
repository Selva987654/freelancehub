import { avatarProps } from '../../utils/helpers';

const SIZES = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };

export default function Avatar({ seed, name, size = 'md', className = '' }) {
  const { color, initials } = avatarProps(seed || name);
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-display font-bold text-white shrink-0 ${SIZES[size]} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
