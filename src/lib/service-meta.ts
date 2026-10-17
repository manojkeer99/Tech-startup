import type { ServiceDefinition } from '@/types';

export const BUDGET_OPTIONS = [
  "Custom — Let's Discuss",
  "Scope-dependent discussion",
  "Flexible / Tailored scope",
  "Not sure yet",
] as const;

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    slug: 'website-development',
    name: 'Website Development',
    short: 'Websites',
    tagline: 'High-performance, bespoke websites engineered to convert and scale.',
    description:
      'From custom landing architectures to enterprise web platforms and full-stack digital presences, we engineer websites built for speed, conversion, and distinct brand memorability.',
    longDescription: [
      'Your digital front door deserves master-level craft. We approach every website with engineering rigor, strategic layout architecture, and uncompromising visual polish.',
      'We build with modern frameworks (React, Next.js, TypeScript, Tailwind) ensuring rapid Core Web Vitals, bulletproof accessibility, and clean maintainable code without bloated templates.',
    ],
    features: [
      'Tailored UI/UX engineering — zero generic templates',
      'Fluid, mobile-first responsive design across all viewports',
      'Rigorous Core Web Vitals and search optimization',
      'Structured contact funnels, intake forms & API integrations',
      'Content architecture tailored for self-service maintenance',
      'Production deployment with automated CI/CD and domain routing',
    ],
    deliverables: [
      'Complete production-ready codebase',
      'Interactive Figma design systems & specs',
      'Deployment automation & domain configuration',
      'SEO metadata & OpenGraph asset suite',
      'Post-delivery dedicated support window',
    ],
    process: [
      'Discovery, architecture & wireframes',
      'High-fidelity interactive prototype',
      'Full-stack engineering & QA testing',
      'Production launch & client handoff',
    ],
    formFields: [
      {
        key: 'siteType',
        label: 'What kind of web platform?',
        type: 'select',
        options: ['Landing page / Product drop', 'Corporate website', 'SaaS platform', 'Portfolio / Studio', 'E-commerce store', 'Other bespoke build'],
      },
      {
        key: 'numPages',
        label: 'Approximate scope / page count',
        type: 'text',
        placeholder: 'e.g. 5-8 pages, or single-page app',
      },
      {
        key: 'hasDomain',
        label: 'Existing domain or hosting (if any)',
        type: 'text',
        placeholder: 'e.g. yourbrand.com',
      },
      {
        key: 'platformWish',
        label: 'Technical stack preference',
        type: 'text',
        placeholder: 'e.g. Next.js, React, Tailwind, Headless CMS',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
  {
    slug: 'application-development',
    name: 'Application Development',
    short: 'Apps',
    tagline: 'Web and mobile applications built for real production workloads.',
    description:
      'We ship end-to-end web and mobile applications with resilient backends, real-time sync, and clean data architecture. From proof-of-concept to global deployment.',
    longDescription: [
      'Whether you are building a cross-platform mobile application, a high-throughput SaaS product, or a mission-critical internal platform, we manage the entire engineering lifecycle.',
      'We build in tight iterative sprints with verifiable progress milestones, so you test working software early and often with zero unexpected surprises.',
    ],
    features: [
      'Cross-platform iOS and Android architectures',
      'Real-time data synchronization & reactive state',
      'Hardened authentication & role-based permissions',
      'Relational database architecture & caching layers',
      'Store submission support & distribution guidance',
      'Comprehensive error tracking & telemetry logging',
    ],
    deliverables: [
      'Compiled application builds (iOS / Android / Web)',
      'Full documented source repository',
      'Cloud backend infrastructure setup',
      'Administrative analytics and management console',
      'Complete technical documentation & API contracts',
    ],
    process: [
      'Technical specification & data modeling',
      'Interactive UI/UX design sprints',
      'Incremental development cycles with preview builds',
      'Hardening, beta testing & store release',
    ],
    formFields: [
      {
        key: 'platforms',
        label: 'Target environments',
        type: 'checkbox',
        options: ['Web Application', 'iOS Mobile', 'Android Mobile', 'Cross-Platform'],
      },
      {
        key: 'appType',
        label: 'Primary application domain',
        type: 'select',
        options: ['SaaS product', 'Workflow automation', 'Marketplace / Platform', 'Community / Social', 'Tool / Utility', 'Other custom build'],
      },
      {
        key: 'hasExisting',
        label: 'Existing codebase or API backend?',
        type: 'text',
        placeholder: 'Repository link or brief description',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
  {
    slug: 'software-development',
    name: 'Software Development',
    short: 'Software',
    tagline: 'Custom software, automation engines, and internal infrastructure.',
    description:
      'Bespoke software engineered around your specific operational workflows — internal dashboards, automation daemons, data processing pipelines, and custom API bridges.',
    longDescription: [
      'Off-the-shelf software rarely addresses unique business bottlenecks. We engineer custom desktop tools, backend engines, data pipelines, and system integrations.',
      'Expect defensive programming, clean test coverage, and documentation that empowers your team to run and maintain the software reliably for years to come.',
    ],
    features: [
      'Specialized internal operations dashboards',
      'High-throughput background jobs & automation queues',
      'RESTful & GraphQL API microservices',
      'Cross-system data synchronization bridges',
      'Desktop utilities (Electron, Tauri, CLI daemons)',
      'Legacy system refactoring & performance audits',
    ],
    deliverables: [
      'Production binary & containerized images',
      'Comprehensive technical specification docs',
      'Automated build & test pipelines',
      'Database migration scripts & schema manifests',
      'Standard operating procedure runbook',
    ],
    process: [
      'Workflow audit & constraint specification',
      'System design & integration schema',
      'Iterative build, unit & integration tests',
      'Controlled rollout & operational training',
    ],
    formFields: [
      {
        key: 'env',
        label: 'Execution environment',
        type: 'select',
        options: ['Internal team platform', 'Multi-tenant cloud service', 'Desktop utility (Windows/macOS/Linux)', 'CLI / Automated cron engine', 'System-to-system bridge'],
      },
      {
        key: 'techPref',
        label: 'Preferred technologies',
        type: 'text',
        placeholder: 'e.g. TypeScript, Node.js, Python, Go, Rust',
      },
      {
        key: 'integrations',
        label: 'Target services to connect',
        type: 'text',
        placeholder: 'e.g. Databases, Stripe, Google Workspace, internal ERP',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
  {
    slug: 'video-editing',
    name: 'Video Editing',
    short: 'Video',
    tagline: 'Paced, polished video post-production that captures and retains attention.',
    description:
      'Commercial showcases, product launch reels, high-retention social content, and cinematic long-form documentaries edited with precision storytelling, audio grading, and custom motion.',
    longDescription: [
      'Raw footage only comes to life through narrative pacing, rhythmic sound design, and color grading. We treat every timeline with uncompromising editorial taste.',
      'From 4K widescreen commercial deliverables to vertical reels engineered for maximum algorithmic retention, we build content that looks unmistakably premium.',
    ],
    features: [
      'Narrative pacing & precision multicam cuts',
      'Custom motion graphics, kinetic typography & lower thirds',
      'Studio-grade sound design, Foley & sonic leveling',
      'Cinematic color grading & LUT balancing',
      'Subtitled & hook-optimized vertical formats',
      'Social asset kits & thumbnail title packages',
    ],
    deliverables: [
      'Full-resolution masters (4K / ProRes / H.265)',
      'Platform-optimized exports (16:9, 9:16, 1:1)',
      'Captioned & dynamic text cutdowns',
      'Project archive & asset organization',
    ],
    process: [
      'Asset intake & narrative creative brief',
      'Assembly & rough structural cut',
      'Motion graphics, sound design & color grade',
      'Client revision review & final master export',
    ],
    formFields: [
      {
        key: 'videoType',
        label: 'Video category',
        type: 'select',
        options: ['Commercial / Product launch', 'Long-form YouTube / Documentary', 'Short-form series (Reels / TikTok)', 'Explainer / Corporate overview', 'Creative showreel'],
      },
      {
        key: 'duration',
        label: 'Expected deliverable duration',
        type: 'text',
        placeholder: 'e.g. 60-second commercial, 10-minute feature, 12x 30s clips',
      },
      {
        key: 'hasFootage',
        label: 'Footage location / link',
        type: 'text',
        placeholder: 'Google Drive, Dropbox, Frame.io link',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
  {
    slug: 'game-mods',
    name: 'Game Mods & Plugins',
    short: 'Mods',
    tagline: 'Custom mods, scripts, and gameplay systems built to exact specification.',
    description:
      'From quality-of-life additions to custom servers, gameplay mechanics, and community plugins — built with clean code and long-term game update compatibility.',
    longDescription: [
      'We work across major gaming ecosystems and engines. Whether you need custom server scripting, UI HUD enhancements, or comprehensive gameplay mechanic packs, we engineer stable solutions.',
      'Every project includes installation documentation, source code repositories, and compatibility guidelines for community distribution.',
    ],
    features: [
      'Gameplay mechanics, weapon & system scripting',
      'Custom HUD, interface & menu engineering',
      'Asset integration & audio implementation',
      'Server-side plugin architecture & permission gates',
      'Version compatibility maintenance & patch updates',
      'Distribution setup for community platforms',
    ],
    deliverables: [
      'Clean install-ready mod / plugin package',
      'Full documented source code',
      'Detailed installation & troubleshooting guide',
      'Showcase screenshots & configuration presets',
    ],
    process: [
      'Engine & target game scope audit',
      'Prototype mechanic or interface test',
      'Full implementation & multiplayer stress testing',
      'Documentation & release package packaging',
    ],
    formFields: [
      {
        key: 'gameName',
        label: 'Game title / engine',
        type: 'text',
        placeholder: 'e.g. Unity, Unreal, Minecraft, FiveM, Skyrim, Source',
      },
      {
        key: 'modType',
        label: 'Mod classification',
        type: 'select',
        options: ['Gameplay mechanic / Script', 'UI / HUD enhancement', 'Server plugin / Management tool', 'Custom world / Map pack', 'Total overhaul system'],
      },
      {
        key: 'modLoader',
        label: 'Mod loader or target framework',
        type: 'text',
        placeholder: 'e.g. Fabric, Forge, Oxide, SKSE, Custom injector',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
  {
    slug: 'graphic-design',
    name: 'Graphic Design',
    short: 'Design',
    tagline: 'Visual identities and digital art direction that stand apart.',
    description:
      'Logotypes, brand books, design tokens, marketing visual systems, and editorial vector artwork designed to give your organization a distinct, authoritative voice.',
    longDescription: [
      'Visual identity is the visual voice of your product. We design comprehensive systems — brand marks, custom typographic hierarchy, color strategies, and modular asset libraries.',
      'You receive meticulously organized production files formatted for digital, print, and screen applications with zero guesswork.',
    ],
    features: [
      'Bespoke brand marks & responsive monogram systems',
      'Comprehensive brand guidelines & token manuals',
      'Social media design kits & campaign templates',
      'Product UI mockups, icons & vector illustrations',
      'Print collateral, stationery & packaging specs',
      'Motion-ready layered asset exports',
    ],
    deliverables: [
      'Vector logo master files (SVG, EPS, PDF, PNG)',
      'Comprehensive brand style manual',
      'Typography & color token specification',
      'Fully layered source files (Figma, AI)',
      'Digital & print usage guidelines',
    ],
    process: [
      'Brand questionnaire & visual moodboard',
      'Concept exploratory rounds (2-3 distinct directions)',
      'Refinement, lockup systems & tokenization',
      'Master file assembly & brand guide delivery',
    ],
    formFields: [
      {
        key: 'deliverableType',
        label: 'Primary design scope',
        type: 'select',
        options: ['Complete brand identity system', 'Logo & monogram only', 'Marketing visual kit & social templates', 'UI icon suite & illustrations', 'Print / Packaging design'],
      },
      {
        key: 'hasBrand',
        label: 'Existing assets or brand guidelines?',
        type: 'text',
        placeholder: 'Link or description of current visual style',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
  {
    slug: 'custom-demand',
    name: 'Custom Demand',
    short: 'Custom',
    tagline: 'Unique requirements? Scope your objective and we build the solution.',
    description:
      'Specialized engineering demands that cross disciplines — technical research, proof-of-concept prototypes, proprietary scripts, and high-urgency custom builds.',
    longDescription: [
      'The most transformative projects often defy standard categories. If you have a specific technical hurdle or creative vision, we will evaluate the feasibility, establish a tailored timeline, and build to spec.',
      'We discuss all parameters directly with you before any agreement is formalized, ensuring total transparency on execution and delivery.',
    ],
    features: [
      'Rapid prototype & proof-of-concept builds',
      'Cross-disciplinary technical engineering',
      'Custom web scraping & data synthesis pipelines',
      'API integrations & bespoke tooling',
      'Dedicated technical evaluation & scoping',
      'Tailored milestone delivery agreements',
    ],
    deliverables: [
      'Custom solution scoped to your exact brief',
      'Complete source code & artifacts',
      'Technical architecture summary',
      'Operational runbook & handoff window',
    ],
    process: [
      'Requirements intake & direct scoping call',
      'Technical feasibility assessment & milestone plan',
      'Agile production with live milestone reviews',
      'Delivery, validation & final acceptance',
    ],
    formFields: [
      {
        key: 'demandType',
        label: 'Classification of demand',
        type: 'select',
        options: ['Rapid technical prototype', 'Data pipeline / Automation', 'Specialized tool or script', 'Multi-disciplinary hybrid build', 'Other unique objective'],
      },
      {
        key: 'outcome',
        label: 'Desired business or technical outcome',
        type: 'textarea',
        placeholder: 'Describe what success looks like in detail...',
      },
    ],
    enabled: true,
    tokenCost: 0,
  },
];

export const SERVICE_SLUGS = SERVICE_DEFINITIONS.map((s) => s.slug);
