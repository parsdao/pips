'use client';

import { Search } from 'lucide-react';

export function SearchTrigger() {
  const triggerSearch = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <button
      onClick={triggerSearch}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 text-left">Search PIPs...</span>
      <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-background border border-border rounded">
        <span className="text-xs">&#8984;</span>K
      </kbd>
    </button>
  );
}
