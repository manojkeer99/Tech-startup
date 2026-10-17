import { ProjectForm } from '@/components/project-form';
import { Reveal } from '@/components/motion';
import { useI18n } from '@/lib/i18n';
import type { Project } from '@/types';

interface ProjectIntakePageProps {
  initialService?: string;
  navigate: (path: string) => void;
}

export function ProjectIntakePage({ initialService, navigate }: ProjectIntakePageProps) {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 lg:px-8 lg:py-20">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 right-0 h-[440px] w-[580px] rounded-full bg-blue-600/10 blur-[140px]" aria-hidden="true" />

      {/* Header */}
      <Reveal className="max-w-2xl mb-8 sm:mb-12">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
          {t('projectIntakeKicker')}
        </span>
        <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold leading-tight text-[var(--color-ink)]">
          {t('projectIntakeTitle')}
        </h1>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
          {t('projectIntakeSubtitle')}
        </p>
      </Reveal>

      {/* Form */}
      <div className="mt-8">
        <ProjectForm
          initialService={initialService}
          navigate={navigate}
          onComplete={(p: Project) => {
            // Callback when project is created
          }}
        />
      </div>
    </div>
  );
}
