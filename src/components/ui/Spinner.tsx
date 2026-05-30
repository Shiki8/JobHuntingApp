interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={[
        'inline-block rounded-full border-gray-200 border-t-blue-600 animate-spin',
        SIZE[size],
        className,
      ].join(' ')}
      role="status"
      aria-label="読み込み中"
    />
  );
}
