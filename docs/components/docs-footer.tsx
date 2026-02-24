import Link from 'next/link';
import { Logo } from './logo';

export function DocsFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs/category/core" className="hover:text-foreground transition-colors">Core Protocol</Link></li>
              <li><Link href="/docs/category/governance" className="hover:text-foreground transition-colors">Governance & DeFi</Link></li>
            </ul>
          </div>
          {/* Documentation */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Documentation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground transition-colors">All Proposals</Link></li>
              <li><a href="https://github.com/parsdao/pips/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Contributing Guide</a></li>
              <li><a href="https://github.com/parsdao/pips" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub Repository</a></li>
            </ul>
          </div>
          {/* Ecosystem */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Ecosystem</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://pars.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Pars Network</a></li>
              <li><a href="https://lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Lux Network</a></li>
              <li><a href="https://hanzo.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Hanzo AI</a></li>
            </ul>
          </div>
          {/* Community */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com/parsdao/pips/discussions" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discussions</a></li>
              <li><a href="https://github.com/parsdao" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Logo size={20} />
            <span>Pars DAO</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sovereign blockchain infrastructure for the Persian diaspora.
          </p>
        </div>
      </div>
    </footer>
  );
}
