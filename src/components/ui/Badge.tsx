import { type ApplicationStatus } from '../../types';

// Generic badge
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

// Status-specific badge with color mapping
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  '未応募':    'bg-gray-100 text-gray-600',
  '応募済':    'bg-blue-50 text-blue-600',
  '書類選考中': 'bg-amber-50 text-amber-700',
  '面接中':    'bg-orange-50 text-orange-700',
  '最終選考':  'bg-purple-50 text-purple-700',
  '内定':      'bg-green-50 text-green-700',
  '見送り':    'bg-red-50 text-red-600',
};

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}

// Count badge (for tabs/nav)
interface CountBadgeProps {
  count: number;
  active?: boolean;
}

export function CountBadge({ count, active = false }: CountBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
        active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500',
      ].join(' ')}
    >
      {count}
    </span>
  );
}
