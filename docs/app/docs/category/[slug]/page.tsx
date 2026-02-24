import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Settings, Vote } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  core: <Settings className="size-6" />,
  governance: <Vote className="size-6" />,
};

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  core: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' },
  governance: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
};

export async function generateStaticParams() {
  const slugs = source.getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = source.getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - Pars Improvement Proposals`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = source.getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const colors = categoryColors[slug] || categoryColors.core;
  const icon = categoryIcons[slug] || <Settings className="size-6" />;

  // Status colors for badges
  const statusColors: Record<string, string> = {
    Draft: 'bg-yellow-500/10 text-yellow-500',
    Review: 'bg-blue-500/10 text-blue-500',
    'Last Call': 'bg-orange-500/10 text-orange-500',
    Final: 'bg-green-500/10 text-green-500',
    Withdrawn: 'bg-red-500/10 text-red-500',
    Stagnant: 'bg-gray-500/10 text-gray-500',
    Superseded: 'bg-purple-500/10 text-purple-500',
  };

  // Calculate stats for this category
  const statsByStatus: Record<string, number> = {};
  category.pips.forEach((pip) => {
    const status = pip.data.frontmatter.status || 'Unknown';
    statsByStatus[status] = (statsByStatus[status] || 0) + 1;
  });

  return (
    <div className="max-w-4xl">
      {/* Navigation */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to All PIPs
      </Link>

      {/* Category Header */}
      <div className={`rounded-xl ${colors.bg} ${colors.border} border p-6 mb-8`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{category.name}</h1>
            <p className="text-muted-foreground mb-4">{category.shortDesc}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className={`font-mono ${colors.text}`}>
                PIP-{String(category.range[0]).padStart(4, '0')} to PIP-{String(category.range[1]).padStart(4, '0')}
              </span>
              <span className="text-muted-foreground">
                {category.pips.length} proposal{category.pips.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Topics */}
      {category.keyTopics && category.keyTopics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Key Topics</h2>
          <div className="flex flex-wrap gap-2">
            {category.keyTopics.map((topic) => (
              <span
                key={topic}
                className={`px-3 py-1 rounded-full text-sm ${colors.bg} ${colors.text}`}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Learn More */}
      {category.learnMore && (
        <div className="mb-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h2 className="text-lg font-semibold mb-2">About {category.name}</h2>
          <p className="text-sm text-muted-foreground">{category.learnMore}</p>
        </div>
      )}

      {/* Category Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 p-4 rounded-lg border border-border bg-card">
        <div className="text-center">
          <div className="text-2xl font-bold">{category.pips.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{statsByStatus['Final'] || 0}</div>
          <div className="text-xs text-muted-foreground">Final</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{statsByStatus['Review'] || 0}</div>
          <div className="text-xs text-muted-foreground">Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{statsByStatus['Draft'] || 0}</div>
          <div className="text-xs text-muted-foreground">Draft</div>
        </div>
      </div>

      {/* Proposals List */}
      <h2 className="text-lg font-semibold mb-4">
        {category.name} Proposals
      </h2>

      {category.pips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No proposals in this category yet.</p>
          <p className="text-sm mt-2">
            Be the first to submit a PIP in the {category.name} category!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {category.pips.map((pip) => (
            <Link
              key={pip.slug.join('/')}
              href={`/docs/${pip.slug.join('/')}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/50 transition-colors group"
            >
              <span className="text-sm font-mono text-muted-foreground w-24 shrink-0">
                PIP-{String(pip.data.frontmatter.pip).padStart(4, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm group-hover:text-foreground truncate">
                  {pip.data.title}
                </div>
                {pip.data.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {pip.data.description}
                  </p>
                )}
              </div>
              {pip.data.frontmatter.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  statusColors[pip.data.frontmatter.status] || 'bg-gray-500/10 text-gray-500'
                }`}>
                  {pip.data.frontmatter.status}
                </span>
              )}
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
