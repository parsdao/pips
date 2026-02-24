'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

// Pars logo: geometric "P" mark inspired by Persian architectural motifs
// Clean, modern, uses currentColor for theme-aware rendering
function getParsLogoSVG(): string {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="parsClip">
        <circle cx="50" cy="50" r="46"/>
      </clipPath>
    </defs>
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="4"/>
    <g clip-path="url(#parsClip)">
      <path d="M 32 22 L 32 78 L 38 78 L 38 56 L 54 56 C 68 56 76 48 76 39 C 76 30 68 22 54 22 Z M 38 28 L 54 28 C 64 28 70 32 70 39 C 70 46 64 50 54 50 L 38 50 Z" fill="currentColor"/>
    </g>
  </svg>`;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <div
      className={`logo-container inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: getParsLogoSVG() }}
    />
  );
}

export function LogoWithText({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 group logo-with-text">
      <Logo
        size={size}
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <div className="relative h-6">
        <span className="font-bold text-lg inline-block transition-all duration-300 ease-out group-hover:opacity-0 group-hover:-translate-y-full">
          PIPs
        </span>
        <span className="font-bold text-lg absolute left-0 top-0 opacity-0 translate-y-full transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 whitespace-nowrap">
          Pars Proposals
        </span>
      </div>
    </div>
  );
}

export function LogoStatic({ size = 24, text = 'PIPs' }: { size?: number; text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} />
      <span className="font-bold text-lg">{text}</span>
    </div>
  );
}
