interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'blue';
  onRemove?: () => void;
}

export function Tag({ children, variant = 'default', onRemove }: TagProps) {
  const styles = variant === 'blue'
    ? 'bg-blue-50 text-blue-600'
    : 'bg-gray-100 text-gray-600';

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        styles,
      ].join(' ')}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label="削除"
        >
          ×
        </button>
      )}
    </span>
  );
}

// Tag input (comma / Enter で追加)
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Enterで追加' }: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const val = e.currentTarget.value.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    e.currentTarget.value = '';
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg min-h-[42px] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors">
      {tags.map((t) => (
        <Tag key={t} onRemove={() => onChange(tags.filter((x) => x !== t))}>
          {t}
        </Tag>
      ))}
      <input
        type="text"
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
      />
    </div>
  );
}
