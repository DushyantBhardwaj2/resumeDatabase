'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, PencilSimple, Check, Download, ArrowClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ── Types ─────────────────────────────────────────────────────────────────────

type JobDetails = { title: string; company: string; description: string };
type TailoredResult = {
  id: string;
  jobTitle: string;
  companyName: string;
  experience: Array<{
    role: string;
    company: string;
    originalBullets: string[];
    tailoredBullets: string[];
  }>;
  projects: Array<{
    title: string;
    originalBullets: string[];
    tailoredBullets: string[];
  }>;
  skills: { original: string[]; tailored: string[] };
};
type Step = 'input' | 'generating' | 'result';

const GENERATION_STEPS = [
  'Analyzing job description...',
  'Matching your experience...',
  'Tailoring bullet points...',
  'Optimizing for ATS...',
];

// ── Step 1: Input form ────────────────────────────────────────────────────────

function InputStep({
  job,
  setJob,
  onSubmit,
}: {
  job: JobDetails;
  setJob: React.Dispatch<React.SetStateAction<JobDetails>>;
  onSubmit: () => void;
}) {
  const empty = !job.title.trim() || !job.company.trim() || !job.description.trim();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-content mb-6">
        Tailor Resume
      </h1>
      <div className="bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 flex flex-col gap-5">
        <Input
          label="Job Title"
          value={job.title}
          onChange={(e) => setJob((j) => ({ ...j, title: e.target.value }))}
          placeholder="Software Engineer"
        />
        <Input
          label="Company Name"
          value={job.company}
          onChange={(e) => setJob((j) => ({ ...j, company: e.target.value }))}
          placeholder="Google"
        />
        <Textarea
          label="Job Description"
          rows={8}
          value={job.description}
          onChange={(e) => setJob((j) => ({ ...j, description: e.target.value }))}
          placeholder="Paste the job description here..."
        />
        <Button
          variant="primary"
          fullWidth
          disabled={empty}
          onClick={onSubmit}
          iconRight={<ArrowRight size={15} />}
        >
          Generate Tailored Resume
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Generating ────────────────────────────────────────────────────────

function GeneratingStep({ company }: { company: string }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => (i + 1) % GENERATION_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      {/* Spinner */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-edge" />
        <div className="absolute inset-0 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-brand-light flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-content-subtle uppercase tracking-widest mb-2 font-mono">
          Tailoring for {company}
        </p>
        <p className="font-display text-lg font-semibold text-content transition-all duration-500">
          {GENERATION_STEPS[stepIdx]}
        </p>
      </div>
    </div>
  );
}

// ── Step 3: Result ────────────────────────────────────────────────────────────

function EditableBullet({
  bullet,
  onChange,
}: {
  bullet: string;
  onChange: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bullet);

  const confirm = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex gap-2 items-start">
        <textarea
          className="flex-1 text-sm text-content bg-muted-bg border border-brand rounded-[var(--radius-md)] px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-brand/20 resize-none"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <button
          onClick={confirm}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] bg-brand text-brand-fg hover:opacity-90 transition-opacity mt-0.5"
        >
          <Check size={12} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-1.5 cursor-pointer hover:bg-brand-light/40 rounded-[var(--radius-md)] px-1.5 py-1 -mx-1.5 transition-colors"
      onClick={() => {
        setDraft(bullet);
        setEditing(true);
      }}
    >
      <span className="text-brand shrink-0 mt-1 text-xs">•</span>
      <span className="text-sm text-content flex-1">{bullet}</span>
      <PencilSimple
        size={11}
        className="shrink-0 text-content-subtle opacity-0 group-hover:opacity-100 transition-opacity mt-1"
      />
    </div>
  );
}

function ResultStep({
  result,
  onReset,
  onUpdate,
}: {
  result: TailoredResult;
  onReset: () => void;
  onUpdate: (updated: TailoredResult) => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateExpBullet = (expIdx: number, bulletIdx: number, val: string) => {
    const next = { ...result };
    next.experience = [...result.experience];
    next.experience[expIdx] = { ...next.experience[expIdx] };
    next.experience[expIdx].tailoredBullets = [...next.experience[expIdx].tailoredBullets];
    next.experience[expIdx].tailoredBullets[bulletIdx] = val;
    onUpdate(next);
    setDirty(true);
  };

  const updateProjBullet = (projIdx: number, bulletIdx: number, val: string) => {
    const next = { ...result };
    next.projects = [...result.projects];
    next.projects[projIdx] = { ...next.projects[projIdx] };
    next.projects[projIdx].tailoredBullets = [...next.projects[projIdx].tailoredBullets];
    next.projects[projIdx].tailoredBullets[bulletIdx] = val;
    onUpdate(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/protected/history/${result.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error();
      toast.success('Changes saved');
      setDirty(false);
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/protected/resume/download?id=${result.id}`, '_blank');
  };

  const handleOverleaf = async () => {
    try {
      const res = await fetch(`/api/protected/resume/latex?id=${result.id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const { latex } = await res.json();
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.overleaf.com/docs';
      form.target = '_blank';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'snip';
      input.value = latex;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch {
      toast.error('Could not open in Overleaf');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content">
            {result.jobTitle}
            <span className="text-content-muted font-normal"> at </span>
            {result.companyName}
          </h1>
        </div>
        <Button variant="outline" onClick={onReset} icon={<ArrowClockwise size={14} />}>
          Tailor Another
        </Button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-6 mb-2 px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Original</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Tailored</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Experience */}
        {result.experience.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-content-subtle mb-3">
              Experience
            </p>
            <div className="flex flex-col gap-4">
              {result.experience.map((exp, expIdx) => (
                <div
                  key={expIdx}
                  className="bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-edge bg-muted-bg">
                    <p className="text-sm font-semibold text-content">{exp.role}</p>
                    <p className="text-xs text-content-muted">{exp.company}</p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-edge">
                    <div className="p-4 flex flex-col gap-1">
                      {exp.originalBullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-content-subtle shrink-0 mt-1 text-xs">•</span>
                          <span className="text-sm text-content-muted">{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      {exp.tailoredBullets.map((b, i) => (
                        <EditableBullet
                          key={i}
                          bullet={b}
                          onChange={(val) => updateExpBullet(expIdx, i, val)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {result.projects.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-content-subtle mb-3">
              Projects
            </p>
            <div className="flex flex-col gap-4">
              {result.projects.map((proj, projIdx) => (
                <div
                  key={projIdx}
                  className="bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-edge bg-muted-bg">
                    <p className="text-sm font-semibold text-content">{proj.title}</p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-edge">
                    <div className="p-4 flex flex-col gap-1">
                      {proj.originalBullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-content-subtle shrink-0 mt-1 text-xs">•</span>
                          <span className="text-sm text-content-muted">{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      {proj.tailoredBullets.map((b, i) => (
                        <EditableBullet
                          key={i}
                          bullet={b}
                          onChange={(val) => updateProjBullet(projIdx, i, val)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {result.skills && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-content-subtle mb-3">
              Skills
            </p>
            <div className="bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
              <div className="grid grid-cols-2 divide-x divide-edge">
                <div className="p-4 flex flex-wrap gap-1.5">
                  {result.skills.original.map((s) => (
                    <span
                      key={s}
                      className="bg-muted-bg border border-edge rounded-full px-2.5 py-0.5 text-xs text-content-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="p-4 flex flex-wrap gap-1.5">
                  {result.skills.tailored.map((s) => (
                    <span
                      key={s}
                      className="bg-brand-light border border-brand/20 rounded-full px-2.5 py-0.5 text-xs text-brand font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-end gap-3 px-6 py-3 bg-card/80 backdrop-blur border-t border-edge">
        {dirty && (
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleDownload}
        >
          Download LaTeX
        </Button>
        <Button variant="outline" size="sm" onClick={handleOverleaf}>
          Open in Overleaf
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TailorPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('input');
  const [job, setJob] = useState<JobDetails>({ title: '', company: '', description: '' });
  const [result, setResult] = useState<TailoredResult | null>(null);

  // Prefill from clone/edit
  useEffect(() => {
    const cloneId = searchParams.get('clone');
    const editId = searchParams.get('edit');
    const targetId = cloneId ?? editId;
    if (!targetId) return;

    (async () => {
      try {
        const res = await fetch(`/api/protected/history/${targetId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setJob((j) => ({
          ...j,
          title: data.jobTitle ?? j.title,
          company: data.companyName ?? j.company,
        }));
        if (editId) {
          setResult(data);
          setStep('result');
        }
      } catch {
        // silently ignore prefill errors
      }
    })();
  }, [searchParams]);

  const handleGenerate = async () => {
    setStep('generating');
    try {
      const res = await fetch('/api/protected/resume/tailor', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      const data: TailoredResult = await res.json();
      setResult(data);
      setStep('result');
    } catch (err: any) {
      toast.error(err?.message ?? 'Generation failed');
      setStep('input');
    }
  };

  const handleReset = () => {
    setJob({ title: '', company: '', description: '' });
    setResult(null);
    setStep('input');
  };

  if (step === 'input') {
    return <InputStep job={job} setJob={setJob} onSubmit={handleGenerate} />;
  }

  if (step === 'generating') {
    return <GeneratingStep company={job.company} />;
  }

  if (step === 'result' && result) {
    return (
      <ResultStep
        result={result}
        onReset={handleReset}
        onUpdate={setResult}
      />
    );
  }

  return null;
}
