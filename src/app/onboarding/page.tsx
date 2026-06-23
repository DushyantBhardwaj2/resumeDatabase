'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadSimple,
  Check,
  Sparkle,
  Plus,
  X,
  User,
  BookOpen,
  Briefcase,
  Code,
  CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Types (re-used from profile page) ────────────────────────────────────────

type Contact = { phone: string; linkedin: string; github: string; portfolio: string };
type Education = { school: string; degree: string; gpa: string; graduationYear: string };
type ExperienceItem = {
  company: string; role: string; startDate: string; endDate: string;
  current: boolean; bullets: string[];
};
type ProjectItem = { title: string; techStack: string; bullets: string[]; url: string };
type Skills = { languages: string[]; frameworks: string[]; tools: string[] };
type Profile = {
  contact: Contact; education: Education;
  experience: ExperienceItem[]; projects: ProjectItem[]; skills: Skills;
};

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Upload', icon: UploadSimple },
  { label: 'Experience', icon: Briefcase },
  { label: 'Projects', icon: Code },
  { label: 'Skills', icon: BookOpen },
  { label: 'Review', icon: CheckCircle },
];

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'h-9 w-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-200',
                  done
                    ? 'bg-brand border-brand text-brand-fg'
                    : active
                    ? 'bg-brand border-brand text-brand-fg'
                    : 'bg-muted-bg border-edge text-content-muted',
                ].join(' ')}
              >
                {done ? <Check size={15} weight="bold" /> : i + 1}
              </div>
              <span
                className={[
                  'text-[10px] font-medium tracking-wide transition-colors',
                  active ? 'text-brand' : done ? 'text-content-muted' : 'text-content-subtle',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 w-10 mt-[1.05rem] transition-colors duration-300',
                  i < current ? 'bg-brand' : 'bg-edge',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Bullet editor (inline) ────────────────────────────────────────────────────

function BulletEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
}) {
  const update = (i: number, v: string) => {
    const n = [...bullets]; n[i] = v; onChange(n);
  };
  const remove = (i: number) => onChange(bullets.filter((_, j) => j !== i));
  const add = () => onChange([...bullets, '']);
  return (
    <div className="flex flex-col gap-2 mt-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-content-subtle text-xs shrink-0">•</span>
          <input
            className="flex-1 h-8 bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
            value={b}
            onChange={(e) => update(i, e.target.value)}
            placeholder="What did you build or achieve?"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-content-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-brand transition-colors w-fit mt-1"
      >
        <Plus size={12} /> Add bullet
      </button>
    </div>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (t: string[]) => void; placeholder: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="bg-muted-bg border border-edge rounded-full px-2.5 py-0.5 text-xs text-content inline-flex items-center gap-1">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-content-subtle hover:text-content">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 h-8 bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <Button size="sm" variant="secondary" type="button" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

// ── Upload Step ───────────────────────────────────────────────────────────────

function UploadStep({ onParsed }: { onParsed: (p: Partial<Profile>) => void }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/protected/resume/parse', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Parse failed');
      const data = await res.json();
      onParsed(data);
      toast.success('Resume parsed successfully');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  return (
    <div className="text-center">
      <h2 className="font-display text-xl font-bold text-content mb-2">
        Import your resume
      </h2>
      <p className="text-sm text-content-muted mb-8">
        Upload your existing PDF resume. We&apos;ll extract your experience, skills, and more.
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !parsing && fileRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-[var(--radius-xl)] p-16 text-center cursor-pointer transition-colors duration-200',
          dragging ? 'border-brand bg-brand-light/40' : 'border-edge hover:border-brand',
          parsing ? 'opacity-60 cursor-wait' : '',
        ].join(' ')}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="text-sm text-content-muted">Parsing your resume...</p>
          </div>
        ) : (
          <>
            <UploadSimple size={40} className="mx-auto text-content-subtle mb-3" />
            <p className="font-display font-semibold text-content text-base">
              Drop your resume PDF here
            </p>
            <p className="text-sm text-content-muted mt-1">or click to browse</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Experience Step ───────────────────────────────────────────────────────────

function ExperienceStep({
  experience,
  onChange,
}: {
  experience: ExperienceItem[];
  onChange: (e: ExperienceItem[]) => void;
}) {
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);

  const update = (idx: number, patch: Partial<ExperienceItem>) =>
    onChange(experience.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  const improve = async (idx: number) => {
    setImprovingIdx(idx);
    try {
      const exp = experience[idx];
      const res = await fetch('/api/protected/ai/bullets', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: exp.role, company: exp.company, bullets: exp.bullets }),
      });
      if (!res.ok) throw new Error();
      const { bullets } = await res.json();
      update(idx, { bullets });
      toast.success('Bullets improved');
    } catch {
      toast.error('AI improvement failed');
    } finally {
      setImprovingIdx(null);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-content mb-1">Refine Experience</h2>
      <p className="text-sm text-content-muted mb-6">Review and improve your experience bullets with AI.</p>
      <div className="flex flex-col gap-4">
        {experience.map((exp, idx) => (
          <div key={idx} className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)]">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="font-semibold text-content text-sm">{exp.role || 'Untitled Role'}</p>
                <p className="text-xs text-content-muted">{exp.company}</p>
              </div>
              <Button
                size="sm" variant="secondary"
                loading={improvingIdx === idx}
                icon={improvingIdx === idx ? undefined : <Sparkle size={12} />}
                onClick={() => improve(idx)}
              >
                Improve
              </Button>
            </div>
            <BulletEditor bullets={exp.bullets} onChange={(bullets) => update(idx, { bullets })} />
          </div>
        ))}
        {experience.length === 0 && (
          <p className="text-sm text-content-subtle py-8 text-center">No experience entries found. Add them in your profile after setup.</p>
        )}
      </div>
    </div>
  );
}

// ── Projects Step ─────────────────────────────────────────────────────────────

function ProjectsStep({
  projects,
  onChange,
}: {
  projects: ProjectItem[];
  onChange: (p: ProjectItem[]) => void;
}) {
  const update = (idx: number, patch: Partial<ProjectItem>) =>
    onChange(projects.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-content mb-1">Review Projects</h2>
      <p className="text-sm text-content-muted mb-6">Check that your project bullets are accurate and impactful.</p>
      <div className="flex flex-col gap-4">
        {projects.map((proj, idx) => (
          <div key={idx} className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)]">
            <p className="font-semibold text-content text-sm mb-0.5">{proj.title || 'Untitled Project'}</p>
            <p className="text-xs text-content-muted mb-2">{proj.techStack}</p>
            <BulletEditor bullets={proj.bullets} onChange={(bullets) => update(idx, { bullets })} />
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-content-subtle py-8 text-center">No projects found. Add them in your profile after setup.</p>
        )}
      </div>
    </div>
  );
}

// ── Skills Step ───────────────────────────────────────────────────────────────

function SkillsStep({ skills, onChange }: { skills: Skills; onChange: (s: Skills) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-content mb-1">Your Skills</h2>
      <p className="text-sm text-content-muted mb-6">Add or remove tags to keep your skills accurate.</p>
      <div className="flex flex-col gap-5">
        {(['languages', 'frameworks', 'tools'] as const).map((key) => (
          <div key={key} className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-3 capitalize">{key}</p>
            <TagInput
              tags={skills[key]}
              onChange={(tags) => onChange({ ...skills, [key]: tags })}
              placeholder={key === 'languages' ? 'Python, Go...' : key === 'frameworks' ? 'React, FastAPI...' : 'Docker, AWS...'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Review Step ───────────────────────────────────────────────────────────────

function ReviewStep({ profile }: { profile: Partial<Profile> }) {
  const chip = (label: string) => (
    <span key={label} className="bg-muted-bg border border-edge rounded-full px-2.5 py-0.5 text-xs text-content">
      {label}
    </span>
  );

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-content mb-1">Review & Complete</h2>
      <p className="text-sm text-content-muted mb-6">Your profile is ready. Here&apos;s a summary before we save.</p>
      <div className="flex flex-col gap-4">
        {/* Contact */}
        {profile.contact && (
          <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-2">Contact</p>
            <div className="grid grid-cols-2 gap-1 text-sm">
              {profile.contact.phone && <span className="text-content">{profile.contact.phone}</span>}
              {profile.contact.linkedin && <span className="text-content truncate">{profile.contact.linkedin}</span>}
              {profile.contact.github && <span className="text-content truncate">{profile.contact.github}</span>}
              {profile.contact.portfolio && <span className="text-content truncate">{profile.contact.portfolio}</span>}
            </div>
          </div>
        )}
        {/* Education */}
        {profile.education && (
          <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-2">Education</p>
            <p className="text-sm font-medium text-content">{profile.education.school}</p>
            <p className="text-xs text-content-muted">{profile.education.degree} · {profile.education.graduationYear}</p>
            {profile.education.gpa && <p className="text-xs text-content-subtle mt-0.5">GPA: {profile.education.gpa}</p>}
          </div>
        )}
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Experiences', value: profile.experience?.length ?? 0 },
            { label: 'Projects', value: profile.projects?.length ?? 0 },
            { label: 'Skills', value: ((profile.skills?.languages?.length ?? 0) + (profile.skills?.frameworks?.length ?? 0) + (profile.skills?.tools?.length ?? 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)] text-center">
              <p className="font-display text-2xl font-bold text-content font-mono">{value}</p>
              <p className="text-xs text-content-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
        {/* Skills preview */}
        {profile.skills && (
          <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-md)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-2">Top Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {[...(profile.skills.languages ?? []), ...(profile.skills.frameworks ?? []), ...(profile.skills.tools ?? [])].slice(0, 12).map(chip)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const defaultProfile: Partial<Profile> = {
  contact: { phone: '', linkedin: '', github: '', portfolio: '' },
  education: { school: '', degree: '', gpa: '', graduationYear: '' },
  experience: [],
  projects: [],
  skills: { languages: [], frameworks: [], tools: [] },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<Profile>>(defaultProfile);
  const [completing, setCompleting] = useState(false);

  const handleParsed = useCallback((data: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
    setStep(1);
  }, []);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch('/api/protected/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile created! Welcome to Resumint.');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setCompleting(false);
    }
  };

  const canContinue = step < 4;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo / brand */}
        <div className="text-center mb-10">
          <span className="font-display text-xl font-bold text-content tracking-tight">Resumint</span>
          <p className="text-xs text-content-subtle mt-1">Let&apos;s set up your profile</p>
        </div>

        <StepIndicator current={step} />

        {/* Step content */}
        <div className="bg-card border border-edge rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6 md:p-8">
          {step === 0 && <UploadStep onParsed={handleParsed} />}
          {step === 1 && (
            <ExperienceStep
              experience={profile.experience ?? []}
              onChange={(experience) => setProfile((p) => ({ ...p, experience }))}
            />
          )}
          {step === 2 && (
            <ProjectsStep
              projects={profile.projects ?? []}
              onChange={(projects) => setProfile((p) => ({ ...p, projects }))}
            />
          )}
          {step === 3 && (
            <SkillsStep
              skills={profile.skills ?? { languages: [], frameworks: [], tools: [] }}
              onChange={(skills) => setProfile((p) => ({ ...p, skills }))}
            />
          )}
          {step === 4 && <ReviewStep profile={profile} />}

          {/* Navigation */}
          {step > 0 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-edge">
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              {canContinue ? (
                <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
                  Continue
                </Button>
              ) : (
                <Button variant="primary" loading={completing} onClick={handleComplete}>
                  Complete Setup
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
