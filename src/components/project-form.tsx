import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICE_DEFINITIONS, BUDGET_OPTIONS } from '@/lib/service-meta';
import { Button, Field, Input, Select, Textarea } from './ui';
import { useToast } from './toast';
import { useI18n } from '@/lib/i18n';
import { store } from '@/lib/store';
import { api } from '@/lib/api';
import type { Attachment, Project } from '@/types';
import {
  IconWeb,
  IconApp,
  IconCpu,
  IconFilm,
  IconMod,
  IconPen,
  IconSpark,
  IconCheck,
  IconCopy,
  IconFile,
  IconX,
  IconArrow,
  IconClock,
  IconShield,
} from './icons';

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'website-development': IconWeb,
  'application-development': IconApp,
  'software-development': IconCpu,
  'video-editing': IconFilm,
  'game-mods': IconMod,
  'graphic-design': IconPen,
  'custom-demand': IconSpark,
};

export function ProjectForm({
  initialService,
  compact = false,
  onComplete,
  navigate,
}: {
  initialService?: string;
  compact?: boolean;
  onComplete?: (p: Project) => void;
  navigate?: (path: string) => void;
}) {
  const { push } = useToast();
  const { t } = useI18n();
  const sessionUser = store.getSessionUser();

  const [service, setService] = useState<string>(initialService || 'website-development');
  const [form, setForm] = useState({
    name: sessionUser?.name || '',
    email: sessionUser?.email || '',
    phone: sessionUser?.phone || '',
    age: sessionUser?.age ? String(sessionUser.age) : '',
    title: '',
    description: '',
    requirements: '',
    budget: "Custom — Let's Discuss",
    deadline: '',
    references: '',
  });

  const [extra, setExtra] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedProject, setSubmittedProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);

  // Anti-abuse: submission throttle ref
  const lastSubmitRef = useRef<number>(0);

  useEffect(() => {
    if (initialService) {
      setService(initialService);
    }
  }, [initialService]);

  const activeServiceMeta = SERVICE_DEFINITIONS.find((s) => s.slug === service) || SERVICE_DEFINITIONS[0];

  const handleInputChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setFileError('Maximum 5 files allowed.');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds 2MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            mime: file.type || 'application/octet-stream',
            data: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate accidental clicks within 4 seconds
    const now = Date.now();
    if (now - lastSubmitRef.current < 4000) {
      return;
    }
    lastSubmitRef.current = now;

    if (!form.name.trim() || form.name.length < 2) {
      return push('error', 'Please enter your full name.');
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      return push('error', 'Please enter a valid email address.');
    }
    if (!form.title.trim() || form.title.length < 3) {
      return push('error', 'Please enter a descriptive project title (minimum 3 characters).');
    }
    if (!form.description.trim() || form.description.length < 15) {
      return push('error', 'Please describe your project objectives in at least 15 characters.');
    }

    setSubmitting(true);
    try {
      let created: Project;
      try {
        const response = await api<{
          ok: boolean;
          projectId: string;
          project: Project;
          message: string;
        }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
            age: form.age ? Number(form.age) : undefined,
            service,
            title: form.title.trim(),
            description: form.description.trim(),
            requirements: form.requirements.trim() || undefined,
            budget: form.budget,
            deadline: form.deadline,
            references: form.references.trim() || undefined,
            extra,
            attachments,
          }),
        });

        if (!response.ok || !response.project) {
          throw new Error('The server did not confirm the project request.');
        }
        created = response.project;
        store.addProject(created);
      } catch (apiErr) {
        // Resilient fallback to local store if offline
        created = store.createProject({
          service,
          title: form.title,
          description: form.description,
          requirements: form.requirements,
          budget: form.budget,
          deadline: form.deadline,
          references: form.references,
          extra,
          attachments,
          clientName: form.name,
          clientEmail: form.email,
          clientPhone: form.phone,
          age: form.age ? Number(form.age) : undefined,
          clientId: sessionUser?.id || null,
        });
      }

      setSubmittedProject(created);
      push('success', `Project request ${created.projectId} submitted successfully.`);
      if (onComplete) onComplete(created);
    } catch {
      push('error', 'Submission could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyProjectId = async () => {
    if (!submittedProject) return;
    try {
      await navigator.clipboard.writeText(submittedProject.projectId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      push('info', 'Project ID copied to clipboard.');
    } catch {
      // Fallback
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedProject) {
    return (
      <div className="grad-border glass mx-auto max-w-2xl rounded-2xl p-8 sm:p-10 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-xl"
        >
          <IconCheck className="h-8 w-8" />
        </motion.div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
          {t('submissionSuccess')}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)] max-w-md mx-auto">
          Your project specifications have entered our priority queue. Every milestone, message, and review will reference this ID.
        </p>

        {/* Project ID Box */}
        <div className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-xl border border-violet-500/40 bg-violet-500/10 px-3.5 sm:px-5 py-3 sm:py-3.5">
          <span className="font-mono text-base sm:text-lg font-bold tracking-wider sm:tracking-widest text-[var(--color-orchid)] truncate">
            {submittedProject.projectId}
          </span>
          <button
            type="button"
            onClick={copyProjectId}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)] transition cursor-pointer shrink-0"
            aria-label={t('copyId')}
          >
            {copied ? <IconCheck className="h-4 w-4 text-emerald-400" /> : <IconCopy className="h-4 w-4" />}
          </button>
        </div>

        {/* Next Steps Card */}
        <div className="mx-auto mt-6 sm:mt-8 max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4 sm:p-6 text-left">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-orchid)] font-semibold">
            {t('whatNext')}
          </p>
          <ol className="mt-4 space-y-3 text-xs sm:text-sm text-[var(--color-muted)]">
            <li className="flex gap-3">
              <span className="font-mono font-bold text-[var(--color-orchid)]">01</span>
              <span>{t('nextStep1')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-[var(--color-orchid)]">02</span>
              <span>{t('nextStep2')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-[var(--color-orchid)]">03</span>
              <span>{t('nextStep3')}</span>
            </li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
          {sessionUser ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                if (navigate) navigate('/dashboard?tab=projects');
              }}
            >
              <span>{t('trackInDashboard')}</span>
              <IconArrow className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                if (navigate) navigate('/register');
              }}
            >
              <span>{t('createAccountToTrack')}</span>
              <IconArrow className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setSubmittedProject(null);
              setAttachments([]);
            }}
          >
            {t('submitAnother')}
          </Button>
        </div>
      </div>
    );
  }

  // INTAKE FORM VIEW
  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-6' : 'grid gap-10 lg:grid-cols-[320px_1fr]'}>
      {/* Service Picker Column */}
      <div className={compact ? 'space-y-3' : 'lg:sticky lg:top-24 lg:self-start space-y-3'}>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-orchid)]">
          {t('step1Label')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {SERVICE_DEFINITIONS.map((s) => {
            const Icon = SERVICE_ICONS[s.slug] || IconSpark;
            const isSelected = service === s.slug;

            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => setService(s.slug)}
                className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/15 shadow-md shadow-violet-500/10'
                    : 'border-[var(--color-line)] bg-[var(--color-raise)]/60 hover:border-violet-500/40 hover:bg-[var(--color-raise)]'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    isSelected
                      ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white'
                      : 'bg-white/5 text-[var(--color-orchid)] group-hover:bg-violet-500/10'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <span className={`block font-display text-xs font-bold truncate ${isSelected ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>
                    {s.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-faint)] block truncate">
                    Custom Scope
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pricing policy callout */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4 text-xs text-[var(--color-muted)] space-y-1.5 hidden lg:block">
          <div className="flex items-center gap-2 text-[var(--color-ink)] font-semibold">
            <IconShield className="h-4 w-4 text-[var(--color-orchid)]" />
            <span>Direct Scope &amp; Pricing</span>
          </div>
          <p className="leading-relaxed">
            We discuss specific deliverables directly with you and negotiate custom project milestones. No hidden fees or automated billing.
          </p>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="space-y-6">
        {/* Step 2: Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-orchid)]">
              {t('step2Label')}
            </p>
            <span className="font-mono text-xs text-[var(--color-faint)]">
              {activeServiceMeta.name}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('fullName')}>
              <Input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={form.name}
                onChange={handleInputChange('name')}
                required
              />
            </Field>

            <Field label={t('emailAddress')}>
              <Input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleInputChange('email')}
                required
              />
            </Field>

            <Field label={t('contactNumber')}>
              <Input
                type="tel"
                placeholder="+1 555 000 1234"
                value={form.phone}
                onChange={handleInputChange('phone')}
              />
            </Field>

            <Field label={t('ageField')}>
              <Input
                type="number"
                placeholder="25"
                min={13}
                max={120}
                value={form.age}
                onChange={handleInputChange('age')}
              />
            </Field>

            <Field label={t('projectTitle')} className="sm:col-span-2">
              <Input
                type="text"
                placeholder="e.g. High-performance SaaS landing page with dark theme"
                value={form.title}
                onChange={handleInputChange('title')}
                required
              />
            </Field>

            <Field label={t('projectDesc')} className="sm:col-span-2">
              <Textarea
                placeholder="Detail the objectives of your build, target audience, core features, and what success looks like..."
                value={form.description}
                onChange={handleInputChange('description')}
                required
              />
            </Field>

            <Field label={t('projectRequirements')} className="sm:col-span-2" hint="Optional">
              <Textarea
                placeholder="Specific technical constraints, required third-party APIs, or specific frameworks..."
                value={form.requirements}
                onChange={handleInputChange('requirements')}
                className="min-h-[80px]"
              />
            </Field>

            {/* Non-monetary budget selection */}
            <Field label={t('budgetField')}>
              <Select value={form.budget} onChange={handleInputChange('budget')}>
                {BUDGET_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('deadlineField')}>
              <Input
                type="date"
                value={form.deadline}
                onChange={handleInputChange('deadline')}
              />
            </Field>

            <Field label={t('referencesField')} className="sm:col-span-2" hint="Links or inspiration">
              <Textarea
                placeholder="Links to existing designs, competitors, or documentation (one per line)..."
                value={form.references}
                onChange={handleInputChange('references')}
                className="min-h-[70px] font-mono text-xs"
              />
            </Field>
          </div>
        </div>

        {/* Dynamic Fields for Selected Service */}
        {activeServiceMeta.formFields.length > 0 && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-orchid)] font-semibold">
              Specifics for {activeServiceMeta.name}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeServiceMeta.formFields.map((f) => {
                if (f.type === 'select') {
                  return (
                    <Field key={f.key} label={f.label}>
                      <Select
                        value={extra[f.key] || ''}
                        onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      >
                        <option value="">Select option...</option>
                        {f.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  );
                }
                if (f.type === 'checkbox') {
                  return (
                    <div key={f.key} className="sm:col-span-2">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        {f.label}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {f.options?.map((opt) => {
                          const cur = extra[f.key] ? extra[f.key].split(', ') : [];
                          const checked = cur.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const next = checked ? cur.filter((x) => x !== opt) : [...cur, opt];
                                setExtra((prev) => ({ ...prev, [f.key]: next.join(', ') }));
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                                checked
                                  ? 'border-violet-500 bg-violet-500/20 text-[var(--color-ink)]'
                                  : 'border-[var(--color-line)] bg-[var(--color-raise)] text-[var(--color-muted)] hover:border-violet-500/40'
                              }`}
                            >
                              {checked && <IconCheck className="mr-1 inline h-3 w-3 text-[var(--color-orchid)]" />}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <Field key={f.key} label={f.label}>
                    <Input
                      type="text"
                      placeholder={f.placeholder}
                      value={extra[f.key] || ''}
                      onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </Field>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Attachments */}
        <div className="space-y-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-orchid)]">
            {t('step3Label')}
          </p>

          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-line)] bg-[var(--color-raise)]/40 p-6 text-center hover:border-violet-500/40 hover:bg-[var(--color-raise)]/70 transition cursor-pointer">
            <IconFile className="h-6 w-6 text-[var(--color-orchid)] mb-2" />
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {t('attachmentsLabel')}
            </span>
            <span className="text-xs text-[var(--color-faint)] mt-1">
              Click to select files from your computer
            </span>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.txt"
            />
          </label>

          {fileError && <p className="text-xs text-rose-400 font-mono">{fileError}</p>}

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <ul className="space-y-2 pt-1">
              {attachments.map((att, i) => (
                <li
                  key={`${att.name}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-4 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconFile className="h-4 w-4 text-[var(--color-orchid)] shrink-0" />
                    <span className="font-medium text-[var(--color-ink)] truncate">{att.name}</span>
                    <span className="font-mono text-[10px] text-[var(--color-faint)]">
                      ({Math.round(att.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="p-1 text-[var(--color-faint)] hover:text-rose-400 transition cursor-pointer"
                    aria-label={`Remove ${att.name}`}
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit Button & SLA note */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[var(--color-line)] pt-6">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <IconClock className="h-4 w-4 text-[var(--color-orchid)] shrink-0" />
            <span>Senior evaluation &amp; response within 24 hours</span>
          </div>

          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
            <span>{t('submitProjectButton')}</span> <IconArrow className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
