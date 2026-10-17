import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

/**
 * Official circular TC emblem logo mark for THE CREATORS.
 * Renders the circular painterly brush-stroke TC monogram badge.
 */
export const TcMonogram = ({
  className = 'h-8 w-8',
  alt = 'THE CREATORS',
  ...props
}: React.ComponentProps<'img'>) => (
  <img
    src="/WhatsApp%20Image%202026-10-17%20at%2011.00.26%20PM.jpeg"
    srcSet="/WhatsApp%20Image%202026-10-17%20at%2011.00.26%20PM.jpeg 1x, /the-creators-logo.png 2x"
    alt={alt}
    className={`object-contain rounded-full select-none shrink-0 bg-white ring-1 ring-white/10 shadow-sm ${className}`}
    loading="eager"
    decoding="async"
    onError={(e) => {
      const target = e.currentTarget;
      if (!target.src.includes('the-creators-logo.png')) {
        target.src = '/the-creators-logo.png';
      } else if (!target.src.includes('the-creators-logo.svg')) {
        target.src = '/the-creators-logo.svg';
      }
    }}
    {...props}
  />
);

// Backward compatibility alias
export const LogoMark = TcMonogram;

export const IconDiscord = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19.6 5.1A17.3 17.3 0 0 0 15.4 3.8l-.5 1a15.6 15.6 0 0 0-5.7 0l-.6-1c-1.5.3-2.9.7-4.2 1.3C1.9 9 .9 12.9 1.4 16.8a17.5 17.5 0 0 0 5.3 2.7l1.1-1.8c-.6-.2-1.2-.5-1.7-.9l.4-.3a12.4 12.4 0 0 0 10.9 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.8a17.4 17.4 0 0 0 5.3-2.7c.6-4.5-.9-8.4-3.9-11.7ZM9 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.1 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
  </svg>
);

export const IconInstagram = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
  </svg>
);

export const IconWeb = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="13" rx="2.5" />
    <path d="M3 9h18M6.5 12.5l2 2 3-3.5M14.5 14l1.5-1.5 2.5 2.5" />
    <path d="M12 17.5V21M8.5 21h7" />
  </svg>
);

export const IconApp = (p: P) => (
  <svg {...base(p)}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.5 5.5h3M12 18.3h.01" />
    <path d="M2.5 10v4M21.5 10v4" opacity="0.55" />
  </svg>
);

export const IconCpu = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </svg>
);

export const IconFilm = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" stroke="none" />
    <path d="M3 8.5h2M3 12h2M3 15.5h2M19 8.5h2M19 12h2M19 15.5h2" opacity="0.6" />
  </svg>
);

export const IconMod = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8h10a4.5 4.5 0 0 1 4.4 5.4l-.7 3.4a2.8 2.8 0 0 1-4.9 1.1L14.5 16h-5l-1.3 1.9a2.8 2.8 0 0 1-4.9-1.1l-.7-3.4A4.5 4.5 0 0 1 7 8Z" />
    <path d="M9.5 11v3M8 12.5h3M15.5 11.2h.01M17.5 13h.01" />
  </svg>
);

export const IconPen = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20l1.2-4.2L16.5 4.5a2.1 2.1 0 0 1 3 3L8.2 18.8 4 20Z" />
    <path d="M14.5 6.5l3 3M4 20l4.2-4.2" opacity="0.7" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    <path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z" opacity="0.7" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 4.5 5.6v6c0 4.6 3.2 8 7.5 9.6 4.3-1.6 7.5-5 7.5-9.6v-6L12 2.8Z" />
    <path d="m8.8 12 2.2 2.2 4.2-4.4" />
  </svg>
);

export const IconToken = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" opacity="0.6" />
    <path d="M12 8.6v6.8M10 10.2c.5-.7 3.5-.9 3.6.4.1 1.4-3.5 1-3.5 2.4 0 1.3 3 1.3 3.5.6" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h15M13.5 5.5 20 12l-6.5 6.5" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20c1.2-3.4 4-5 7.2-5s6 1.6 7.2 5" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.8 2.6H4.2L6 16Z" />
    <path d="M10 21a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const IconFolder = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h3.5l2 2.5H18a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 19.5H6a2.5 2.5 0 0 1-2.5-2.5v-10.5Z" />
    <path d="M3.5 10.5h17" opacity="0.5" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8.5 16v-5M13 16V8M17.5 16v-3.4" strokeWidth="2" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7M16 8l4 4-4 4M20 12H10" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const IconFile = (p: P) => (
  <svg {...base(p)}>
    <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L13.5 3Z" />
    <path d="M13.5 3v5.5H19" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9A1.5 1.5 0 0 1 14.5 4.5V5" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const IconMonitor = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
  </svg>
);

export const IconExternal = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);

export const IconActivity = (p: P) => (
  <svg {...base(p)}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
