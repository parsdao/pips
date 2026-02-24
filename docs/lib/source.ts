import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PIPS_DIR = path.join(process.cwd(), '../PIPs');

export interface PIPMetadata {
  pip?: number | string;
  title?: string;
  description?: string;
  status?: 'Draft' | 'Review' | 'Last Call' | 'Final' | 'Withdrawn' | 'Stagnant' | 'Superseded';
  type?: 'Standards Track' | 'Meta' | 'Informational';
  category?: 'Core' | 'Governance';
  author?: string;
  created?: string;
  updated?: string;
  requires?: string | number[];
  tags?: string[];
  [key: string]: unknown;
}

export interface PIPPage {
  slug: string[];
  data: {
    title: string;
    description?: string;
    content: string;
    frontmatter: PIPMetadata;
  };
}

export interface CategoryMeta {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  range: [number, number];
  icon: string;
  color: string;
  learnMore: string;
  keyTopics: string[];
}

export interface PIPCategory extends CategoryMeta {
  pips: PIPPage[];
}

// PIP number ranges for categories (based on PIP-0000)
const PIP_CATEGORIES: CategoryMeta[] = [
  {
    slug: 'core',
    name: 'Core Protocol',
    shortDesc: 'Network architecture, privacy, and infrastructure',
    description: 'Core protocol specifications for the Pars Network dual-layer architecture. Defines network topology, mesh networking, post-quantum cryptography, coercion resistance, mobile nodes, session protocol, AI mining, node architecture, economics, data integrity, content provenance, and encrypted communication primitives.',
    range: [0, 99],
    icon: 'settings',
    color: 'blue',
    learnMore: 'Core PIPs define the foundational architecture of Pars Network, including the dual-layer design (EVM L2 + Session daemon), mesh networking for censorship resistance, post-quantum cryptographic standards, coercion-resistant protocols, mobile-first node design, privacy-preserving session management, AI-integrated mining, node orchestration, token economics, data integrity seals, content provenance tracking, encrypted voting, and encrypted CRDTs for collaborative state.',
    keyTopics: ['Dual-layer architecture', 'Mesh networking', 'Post-quantum crypto', 'Coercion resistance', 'Mobile nodes', 'Session protocol', 'AI mining', 'Token economics', 'Data integrity', 'Encrypted voting'],
  },
  {
    slug: 'governance',
    name: 'Governance & DeFi',
    shortDesc: 'DAO governance, treasury, and financial protocols',
    description: 'Governance frameworks and decentralized finance protocols for the Pars Network. Defines DAO governance using veASHA tokens, town hall deliberation, treasury management, fee routing, gauge controllers, vault registries, the Asha reserve token, fractal governance, liquid staking, the Reticulum network stack, and shadow governance for coercion-resistant decision-making.',
    range: [7000, 7099],
    icon: 'vote',
    color: 'emerald',
    learnMore: 'Governance & DeFi PIPs establish the decision-making and financial infrastructure for Pars Network. The DAO governance framework uses vote-escrowed ASHA (veASHA) tokens with Safe multisig execution. Town hall protocols enable deliberative democracy. Treasury management ensures sustainable funding. Fee routing and gauge controllers direct protocol revenue. Vault registries standardize yield strategies. The Asha reserve token provides stability. Fractal governance enables scalable sub-DAO structures. Liquid staking maximizes capital efficiency. The Reticulum network stack provides censorship-resistant networking. Shadow governance enables coercion-proof voting.',
    keyTopics: ['DAO governance', 'Town hall protocol', 'Treasury management', 'Fee routing', 'Gauge controller', 'Vault registry', 'Asha reserve token', 'Fractal governance', 'Liquid staking', 'Shadow governance'],
  },
];

function getAllPIPFiles(): string[] {
  try {
    const files = fs.readdirSync(PIPS_DIR);
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .filter(file => file.startsWith('pip-'));
  } catch (error) {
    console.error('Error reading PIPs directory:', error);
    return [];
  }
}

function readPIPFile(filename: string): PIPPage | null {
  try {
    const filePath = path.join(PIPS_DIR, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const slug = filename.replace(/\.mdx?$/, '').split('/');

    // Extract PIP number from filename or frontmatter
    const pipMatch = filename.match(/pip-(\d+)/);
    const pipNumber = data.pip !== undefined ? data.pip : (pipMatch ? parseInt(pipMatch[1], 10) : null);

    // Convert Date objects to strings
    const processedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        processedData[key] = value.toISOString().split('T')[0];
      } else {
        processedData[key] = value;
      }
    }

    return {
      slug,
      data: {
        title: (processedData.title as string) || filename.replace(/\.mdx?$/, ''),
        description: processedData.description as string,
        content,
        frontmatter: {
          ...processedData,
          pip: pipNumber,
        } as PIPMetadata,
      },
    };
  } catch (error) {
    console.error(`Error reading PIP file ${filename}:`, error);
    return null;
  }
}

function getPIPNumber(page: PIPPage): number {
  const pip = page.data.frontmatter.pip;
  if (typeof pip === 'number') return pip;
  if (typeof pip === 'string') return parseInt(pip, 10) || 9999;
  return 9999;
}

export const source = {
  getPage(slugParam?: string[]): PIPPage | null {
    if (!slugParam || slugParam.length === 0) {
      return null;
    }

    const slug = slugParam;
    const filename = `${slug.join('/')}.md`;
    const mdxFilename = `${slug.join('/')}.mdx`;

    let page = readPIPFile(filename);
    if (!page) {
      page = readPIPFile(mdxFilename);
    }

    return page;
  },

  generateParams(): { slug: string[] }[] {
    const files = getAllPIPFiles();
    return files.map(file => ({
      slug: file.replace(/\.mdx?$/, '').split('/'),
    }));
  },

  getAllPages(): PIPPage[] {
    const files = getAllPIPFiles();
    return files
      .map(readPIPFile)
      .filter((page): page is PIPPage => page !== null)
      .sort((a, b) => getPIPNumber(a) - getPIPNumber(b));
  },

  getPagesByStatus(status: string): PIPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.status?.toLowerCase() === status.toLowerCase()
    );
  },

  getPagesByType(type: string): PIPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.type?.toLowerCase() === type.toLowerCase()
    );
  },

  getPagesByCategory(category: string): PIPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.category?.toLowerCase() === category.toLowerCase()
    );
  },

  getCategorizedPages(): PIPCategory[] {
    const allPages = this.getAllPages();

    return PIP_CATEGORIES.map(cat => ({
      ...cat,
      pips: allPages.filter(page => {
        const pipNum = getPIPNumber(page);
        return pipNum >= cat.range[0] && pipNum <= cat.range[1];
      }),
    })).filter(cat => cat.pips.length > 0);
  },

  getStats(): { total: number; byStatus: Record<string, number>; byType: Record<string, number> } {
    const pages = this.getAllPages();
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    pages.forEach(page => {
      const status = page.data.frontmatter.status || 'Unknown';
      const type = page.data.frontmatter.type || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      byType[type] = (byType[type] || 0) + 1;
    });

    return { total: pages.length, byStatus, byType };
  },

  getAllCategories(): PIPCategory[] {
    const allPages = this.getAllPages();

    return PIP_CATEGORIES.map(cat => ({
      ...cat,
      pips: allPages.filter(page => {
        const num = getPIPNumber(page);
        return num >= cat.range[0] && num <= cat.range[1];
      }),
    }));
  },

  // Generate page tree for Fumadocs sidebar
  getPageTree() {
    const categories = this.getCategorizedPages();

    return {
      name: 'PIPs',
      children: [
        {
          type: 'page' as const,
          name: 'Overview',
          url: '/docs',
        },
        ...categories.map(cat => ({
          type: 'folder' as const,
          name: cat.name,
          description: cat.shortDesc,
          children: cat.pips.slice(0, 30).map(pip => ({
            type: 'page' as const,
            name: `PIP-${String(getPIPNumber(pip)).padStart(4, '0')}: ${pip.data.title.substring(0, 40)}${pip.data.title.length > 40 ? '...' : ''}`,
            url: `/docs/${pip.slug.join('/')}`,
          })),
        })),
      ],
    };
  },

  // Search across all PIPs
  search(query: string): PIPPage[] {
    const q = query.toLowerCase();
    return this.getAllPages().filter(page => {
      const title = page.data.title.toLowerCase();
      const description = (page.data.description || '').toLowerCase();
      const content = page.data.content.toLowerCase();
      const tags = (page.data.frontmatter.tags || []).join(' ').toLowerCase();

      return title.includes(q) || description.includes(q) || content.includes(q) || tags.includes(q);
    });
  },

  // Get category by slug
  getCategoryBySlug(slug: string): PIPCategory | undefined {
    const allPages = this.getAllPages();
    const cat = PIP_CATEGORIES.find(c => c.slug === slug);
    if (!cat) return undefined;

    return {
      ...cat,
      pips: allPages.filter(page => {
        const num = getPIPNumber(page);
        return num >= cat.range[0] && num <= cat.range[1];
      }),
    };
  },

  // Get all category slugs for static params
  getAllCategorySlugs(): string[] {
    return PIP_CATEGORIES.map(cat => cat.slug);
  },
};
