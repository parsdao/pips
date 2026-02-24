import { DocsLayout } from '@hanzo/docs/ui/layouts/docs';
import type { ReactNode } from 'react';
import { FileText, GitPullRequest, Users, BookOpen, ExternalLink } from 'lucide-react';
import { LogoWithText } from '../../components/logo';
import { SearchTrigger } from '../../components/search-trigger';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  const pageTree = source.getPageTree();
  const stats = source.getStats();

  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: <LogoWithText size={24} />,
      }}
      sidebar={{
        defaultOpenLevel: 1,
        banner: (
          <div className="flex flex-col gap-3">
            {/* Search Trigger */}
            <SearchTrigger />

            {/* Statistics */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="size-4" />
                <span className="text-sm font-semibold">PIP Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-1 font-medium">{stats.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Final:</span>
                  <span className="ml-1 font-medium text-green-500">{stats.byStatus['Final'] || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Draft:</span>
                  <span className="ml-1 font-medium text-yellow-500">{stats.byStatus['Draft'] || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Review:</span>
                  <span className="ml-1 font-medium text-blue-500">{stats.byStatus['Review'] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ),
        footer: (
          <div className="flex flex-col gap-2 p-4 text-xs border-t border-border">
            <a
              href="https://github.com/parsdao/pips"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitPullRequest className="size-4" />
              Contribute on GitHub
            </a>
            <a
              href="https://github.com/parsdao/pips/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="size-4" />
              Discussions
            </a>
            <a
              href="https://pars.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="size-4" />
              Pars Network
            </a>
          </div>
        ),
      }}
      links={[
        {
          text: 'All PIPs',
          url: '/docs',
          icon: <FileText className="size-4" />,
        },
        {
          text: 'Contribute',
          url: 'https://github.com/parsdao/pips/blob/main/CONTRIBUTING.md',
          icon: <GitPullRequest className="size-4" />,
          external: true,
        },
        {
          text: 'GitHub',
          url: 'https://github.com/parsdao/pips',
          icon: <ExternalLink className="size-4" />,
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
