import { SearchInput } from '../../SearchInput';

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isCollapsed: boolean;
}

export function SidebarSearch({ value, onChange, onClear, isCollapsed }: SidebarSearchProps) {
  if (isCollapsed) return null;

  return (
    <div className="px-4 mb-4">
      <SearchInput
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClear={onClear}
        className="bg-muted/40 text-foreground placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
