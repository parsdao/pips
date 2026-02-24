'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Command as CommandPrimitive } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, FileText, Github, MessageSquare, ArrowRight, Hash, BookOpen, Settings, Vote, Shield, User, MessageCircle, Brain, Book } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  url: string;
  title: string;
  description: string;
  structuredData?: {
    pip?: number;
    status?: string;
    type?: string;
    category?: string;
    tags?: string[];
  };
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const isPIPPage = pathname.startsWith('/docs/pip-');
  const currentPIP = isPIPPage ? pathname.split('/').pop()?.replace('pip-', '') : null;

  const getQuickActions = useCallback((): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        id: 'browse-all',
        label: 'Browse All Proposals',
        description: 'View all Pars Improvement Proposals',
        icon: <FileText className="h-4 w-4" />,
        action: () => router.push('/docs'),
        keywords: ['all', 'proposals', 'list', 'browse'],
      },
      {
        id: 'category-core',
        label: 'Core Protocol',
        description: 'PIP-0 to PIP-99 -- Network architecture & privacy',
        icon: <Settings className="h-4 w-4" />,
        action: () => router.push('/docs/category/core'),
        keywords: ['core', 'protocol', 'architecture', 'privacy', 'mesh', 'quantum'],
      },
      {
        id: 'category-privacy',
        label: 'Privacy & Cryptography',
        description: 'PIP-100 to PIP-199 -- Zero-knowledge, encryption, anonymity',
        icon: <Shield className="h-4 w-4" />,
        action: () => router.push('/docs/category/privacy'),
        keywords: ['privacy', 'cryptography', 'zk', 'zero-knowledge', 'encryption', 'stealth', 'ring'],
      },
      {
        id: 'category-identity',
        label: 'Identity & Access',
        description: 'PIP-200 to PIP-299 -- DID, credentials, recovery',
        icon: <User className="h-4 w-4" />,
        action: () => router.push('/docs/category/identity'),
        keywords: ['identity', 'did', 'credentials', 'recovery', 'reputation', 'pseudonym'],
      },
      {
        id: 'category-communication',
        label: 'Communication',
        description: 'PIP-300 to PIP-399 -- Messaging, voice, broadcast',
        icon: <MessageCircle className="h-4 w-4" />,
        action: () => router.push('/docs/category/communication'),
        keywords: ['messaging', 'voice', 'broadcast', 'chat', 'communication', 'encrypted'],
      },
      {
        id: 'category-ai',
        label: 'AI & Compute',
        description: 'PIP-400 to PIP-499 -- Inference, models, Persian NLP',
        icon: <Brain className="h-4 w-4" />,
        action: () => router.push('/docs/category/ai'),
        keywords: ['ai', 'compute', 'inference', 'nlp', 'persian', 'federated', 'model'],
      },
      {
        id: 'category-content',
        label: 'Content & Media',
        description: 'PIP-500 to PIP-599 -- Publishing, archives, creator tools',
        icon: <Book className="h-4 w-4" />,
        action: () => router.push('/docs/category/content'),
        keywords: ['content', 'media', 'publishing', 'archive', 'cultural', 'creator', 'library'],
      },
      {
        id: 'category-governance',
        label: 'Governance & DeFi',
        description: 'PIP-7000 to PIP-7099 -- DAO, treasury, staking',
        icon: <Vote className="h-4 w-4" />,
        action: () => router.push('/docs/category/governance'),
        keywords: ['governance', 'dao', 'defi', 'treasury', 'staking', 'voting'],
      },
    ];

    if (isPIPPage && currentPIP) {
      const pipActions: QuickAction[] = [
        {
          id: 'edit-github',
          label: 'Edit on GitHub',
          description: `Edit PIP-${currentPIP} source`,
          icon: <Github className="h-4 w-4" />,
          action: () => window.open(`https://github.com/parsdao/pips/edit/main/PIPs/pip-${currentPIP}.md`, '_blank'),
          keywords: ['edit', 'github', 'source', 'modify'],
        },
        {
          id: 'view-raw',
          label: 'View Raw Markdown',
          description: 'See the raw markdown file',
          icon: <FileText className="h-4 w-4" />,
          action: () => window.open(`https://raw.githubusercontent.com/parsdao/pips/main/PIPs/pip-${currentPIP}.md`, '_blank'),
          keywords: ['raw', 'markdown', 'source'],
        },
        {
          id: 'discuss',
          label: 'Join Discussion',
          description: 'Discuss on GitHub',
          icon: <MessageSquare className="h-4 w-4" />,
          action: () => window.open(`https://github.com/parsdao/pips/discussions`, '_blank'),
          keywords: ['discuss', 'forum', 'comment', 'feedback'],
        },
      ];
      return [...pipActions, ...baseActions];
    }

    return baseActions;
  }, [isPIPPage, currentPIP, router]);

  const quickActions = getQuickActions();

  // Load search index on first open
  useEffect(() => {
    if (open && searchIndex.length === 0) {
      fetch('/search-index.json')
        .then(res => res.json())
        .then(data => setSearchIndex(data))
        .catch(err => console.error('Failed to load search index:', err));
    }
  }, [open, searchIndex.length]);

  // Client-side search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const q = query.toLowerCase();
    const filtered = searchIndex.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.structuredData?.pip?.toString() || '').includes(q) ||
        (item.structuredData?.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }).slice(0, 10);

    setResults(filtered);
    setLoading(false);
  }, [query, searchIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery('');
      setResults([]);
    }
  };

  const handleSelect = (callback: () => void) => {
    callback();
    handleOpenChange(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-x-0 top-[15%] mx-auto z-50 w-[calc(100%-2rem)] max-w-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 duration-200">
            <CommandPrimitive
              className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
              loop
            >
              <div className="flex items-center border-b border-border px-4" cmdk-input-wrapper="">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <CommandPrimitive.Input
                  placeholder={isPIPPage ? `Search PIPs or actions for PIP-${currentPIP}...` : 'Search proposals, categories, or actions...'}
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 h-12 bg-transparent px-3 py-4 text-base outline-none placeholder:text-muted-foreground"
                />
                <kbd className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">ESC</kbd>
              </div>

              <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto p-2">
                <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <p className="mt-2">Searching...</p>
                    </div>
                  ) : query.length >= 2 ? (
                    <div className="flex flex-col items-center">
                      <BookOpen className="h-8 w-8 opacity-50" />
                      <p className="mt-2">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  ) : null}
                </CommandPrimitive.Empty>

                <CommandPrimitive.Group heading={isPIPPage ? 'PIP Actions' : 'Quick Actions'} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {quickActions.map((action) => (
                    <CommandPrimitive.Item
                      key={action.id}
                      value={`${action.label} ${action.description} ${action.keywords?.join(' ') || ''}`}
                      onSelect={() => handleSelect(action.action)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground hover:bg-muted transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{action.label}</div>
                        <div className="text-sm text-muted-foreground truncate">{action.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>

                {results.length > 0 && (
                  <CommandPrimitive.Group heading={`Proposals (${results.length})`} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                    {results.map((result) => (
                      <CommandPrimitive.Item
                        key={result.id}
                        value={`${result.title} ${result.description} PIP-${result.structuredData?.pip || ''}`}
                        onSelect={() => handleSelect(() => router.push(result.url))}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground hover:bg-muted transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {result.structuredData?.pip !== undefined && <span className="text-primary">PIP-{result.structuredData.pip}: </span>}
                            {result.title}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {result.structuredData?.status && (
                              <span className={cn(
                                'rounded px-1.5 py-0.5 text-xs',
                                result.structuredData.status === 'Final' && 'bg-green-500/10 text-green-500',
                                result.structuredData.status === 'Draft' && 'bg-yellow-500/10 text-yellow-500',
                                result.structuredData.status === 'Review' && 'bg-blue-500/10 text-blue-500',
                                !['Final', 'Draft', 'Review'].includes(result.structuredData.status || '') && 'bg-muted text-muted-foreground'
                              )}>
                                {result.structuredData.status}
                              </span>
                            )}
                            <span className="truncate">{result.description}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                )}
              </CommandPrimitive.List>

              {!query && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border flex items-center justify-between">
                  <span>
                    <kbd className="rounded bg-muted px-1.5 py-0.5 mr-1">&#8593;</kbd>
                    <kbd className="rounded bg-muted px-1.5 py-0.5 mr-1">&#8595;</kbd>
                    to navigate
                  </span>
                  <span>
                    <kbd className="rounded bg-muted px-1.5 py-0.5 mr-1">Enter</kbd>
                    to select
                  </span>
                  <span>
                    <kbd className="rounded bg-muted px-1.5 py-0.5">ESC</kbd>
                    to close
                  </span>
                </div>
              )}
            </CommandPrimitive>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
