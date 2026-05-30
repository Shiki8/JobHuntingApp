interface ScoreDotsProps {
  score: number; // 0–5 (0 = unset)
  onChange?: (score: number) => void;
  size?: 'sm' | 'md';
}

const DOT_SIZE: Record<NonNullable<ScoreDotsProps['size']>, string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

// Dot-based score display / input (matches Figma design)
export function ScoreDots({ score, onChange, size = 'md' }: ScoreDotsProps) {
  const isInteractive = !!onChange;

  return (
    <div className="flex items-center gap-1" role={isInteractive ? 'group' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!isInteractive}
          onClick={() => onChange?.(score === n ? 0 : n)}
          className={[
            DOT_SIZE[size],
            'rounded-full transition-colors',
            isInteractive ? 'cursor-pointer hover:scale-125' : 'cursor-default',
            n <= score ? 'bg-blue-500' : 'bg-gray-200',
          ].join(' ')}
          aria-label={isInteractive ? `${n}点` : undefined}
        />
      ))}
    </div>
  );
}

// Numeric label alongside dots
interface ScoreWithLabelProps extends ScoreDotsProps {
  showLabel?: boolean;
}

export function ScoreWithLabel({ showLabel = true, ...props }: ScoreWithLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <ScoreDots {...props} />
      {showLabel && (
        <span className="text-xs text-gray-400 tabular-nums">
          {props.score > 0 ? `${props.score}/5` : '未入力'}
        </span>
      )}
    </div>
  );
}
