'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Trash,
  Sparkle,
  ArrowClockwise,
  X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Types ─────────────────────────────────────────────────────────────────────

type Contact = { phone: string; linkedin: string; github: string; portfolio: string };
type Education = { school: string; degree: string; gpa: string; graduationYear: string };
type ExperienceItem = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
};
type ProjectItem = { title: string; techStack: string; bullets: string[]; url: string };
type Skills = { languages: string[]; frameworks: string[]; tools: string[] };
type Profile = {
  contact: Contact;
  education: Education;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: Skills;
};

const emptyContact: Contact = { phone: '', linkedin: '', github: '', portfolio: '' };
const emptyEducation: Education = { school: '', degree: '', gpa: '', graduationYear: '' };
const emptyExperience = (): ExperienceItem => ({
  company: '', role: '', startDate: '', endDate: '', current: false, bullets: [''],
});
const emptyProject = (): ProjectItem => ({
  title: '', techStack: '', bullets: [''], url: '',
});
const emptySkills: Skills = { languages: [], frameworks: [], tools: [] };

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
      <div className="px-5 py-4 border-b border-edge">
        <h2 className="font-display text-sm font-semibold text-content tracking-wide uppercase">
          {title}
        </h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function BulletEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (bullets: string[]) => void;
}) {
  const update = (i: number, val: string) => {
    const next = [...bullets];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));
  const add = () => onChange([...bullets, '']);

  return (
    <div className="flex flex-col gap-2 mt-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-content-subtle text-xs mt-0.5 shrink-0">•</span>
          <input
            className="flex-1 h-8 bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
            value={b}
            onChange={(e) => update(i, e.target.value)}
            placeholder="Describe what you did..."
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-content-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-brand transition-colors w-fit"
      >
        <Plus size={12} />
        Add bullet
      </button>
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-muted-bg border border-edge rounded-full px-2.5 py-0.5 text-xs text-content inline-flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-content-subtle hover:text-content transition-colors"
            >
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button size="sm" variant="secondary" onClick={add} type="button">
          Add
        </Button>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-5 animate-pulse"
        >
          <div className="h-4 w-32 bg-muted-bg rounded mb-5" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-9 bg-muted-bg rounded-[var(--radius-md)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [education, setEducation] = useState<Education>(emptyEducation);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<Skills>(emptySkills);
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/protected/profile', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data: Profile = await res.json();
        setContact(data.contact ?? emptyContact);
        setEducation(data.education ?? emptyEducation);
        setExperience(data.experience ?? []);
        setProjects(data.projects ?? []);
        setSkills(data.skills ?? emptySkills);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/protected/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, education, experience, projects, skills }),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const improveExperienceBullets = async (idx: number) => {
    setImprovingIdx(idx);
    try {
      const exp = experience[idx];
      const res = await fetch('/api/protected/ai/bullets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: exp.role, company: exp.company, bullets: exp.bullets }),
      });
      if (!res.ok) throw new Error();
      const { bullets } = await res.json();
      setExperience((prev) => prev.map((e, i) => (i === idx ? { ...e, bullets } : e)));
      toast.success('Bullets improved');
    } catch {
      toast.error('AI improvement failed');
    } finally {
      setImprovingIdx(null);
    }
  };

  const updateExp = useCallback(
    (idx: number, patch: Partial<ExperienceItem>) =>
      setExperience((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e))),
    [],
  );

  const updateProj = useCallback(
    (idx: number, patch: Partial<ProjectItem>) =>
      setProjects((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p))),
    [],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-40 bg-muted-bg rounded animate-pulse mb-8" />
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-content">
          My Profile
        </h1>
        <Button
          variant="primary"
          loading={saving}
          onClick={handleSave}
          icon={saving ? undefined : undefined}
        >
          Save Profile
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Contact */}
        <SectionCard title="Contact Info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={contact.phone}
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
            <Input
              label="LinkedIn"
              value={contact.linkedin}
              onChange={(e) => setContact((c) => ({ ...c, linkedin: e.target.value }))}
              placeholder="linkedin.com/in/yourname"
            />
            <Input
              label="GitHub"
              value={contact.github}
              onChange={(e) => setContact((c) => ({ ...c, github: e.target.value }))}
              placeholder="github.com/yourname"
            />
            <Input
              label="Portfolio"
              value={contact.portfolio}
              onChange={(e) => setContact((c) => ({ ...c, portfolio: e.target.value }))}
              placeholder="yoursite.dev"
            />
          </div>
        </SectionCard>

        {/* Education */}
        <SectionCard title="Education">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="School / University"
              value={education.school}
              onChange={(e) => setEducation((ed) => ({ ...ed, school: e.target.value }))}
              placeholder="NSUT, New Delhi"
            />
            <Input
              label="Degree"
              value={education.degree}
              onChange={(e) => setEducation((ed) => ({ ...ed, degree: e.target.value }))}
              placeholder="B.Tech Computer Science"
            />
            <Input
              label="GPA"
              value={education.gpa}
              onChange={(e) => setEducation((ed) => ({ ...ed, gpa: e.target.value }))}
              placeholder="8.5 / 10"
            />
            <Input
              label="Graduation Year"
              value={education.graduationYear}
              onChange={(e) =>
                setEducation((ed) => ({ ...ed, graduationYear: e.target.value }))
              }
              placeholder="2026"
            />
          </div>
        </SectionCard>

        {/* Experience */}
        <SectionCard title="Experience">
          <div className="flex flex-col gap-5">
            {experience.map((exp, idx) => (
              <div
                key={idx}
                className="border border-edge rounded-[var(--radius-md)] p-4 bg-surface"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                  <Input
                    label="Company"
                    value={exp.company}
                    onChange={(e) => updateExp(idx, { company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                  <Input
                    label="Role"
                    value={exp.role}
                    onChange={(e) => updateExp(idx, { role: e.target.value })}
                    placeholder="Software Engineer Intern"
                  />
                  <Input
                    label="Start Date"
                    value={exp.startDate}
                    onChange={(e) => updateExp(idx, { startDate: e.target.value })}
                    placeholder="Jun 2024"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Input
                      label="End Date"
                      value={exp.endDate}
                      onChange={(e) => updateExp(idx, { endDate: e.target.value })}
                      placeholder="Aug 2024"
                      disabled={exp.current}
                    />
                    <label className="inline-flex items-center gap-1.5 text-xs text-content-muted cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExp(idx, { current: e.target.checked })}
                        className="rounded accent-brand"
                      />
                      Current role
                    </label>
                  </div>
                </div>
                <p className="text-xs font-medium text-content-muted mb-1">Bullet Points</p>
                <BulletEditor
                  bullets={exp.bullets}
                  onChange={(bullets) => updateExp(idx, { bullets })}
                />
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-edge">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={improvingIdx === idx}
                    icon={improvingIdx === idx ? undefined : <Sparkle size={13} />}
                    onClick={() => improveExperienceBullets(idx)}
                  >
                    Improve bullets
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash size={13} />}
                    onClick={() =>
                      setExperience((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-content-subtle hover:text-red-500"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setExperience((prev) => [...prev, emptyExperience()])}
              className="self-start"
            >
              Add Experience
            </Button>
          </div>
        </SectionCard>

        {/* Projects */}
        <SectionCard title="Projects">
          <div className="flex flex-col gap-5">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="border border-edge rounded-[var(--radius-md)] p-4 bg-surface"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                  <Input
                    label="Project Title"
                    value={proj.title}
                    onChange={(e) => updateProj(idx, { title: e.target.value })}
                    placeholder="Resumint"
                  />
                  <Input
                    label="URL"
                    value={proj.url}
                    onChange={(e) => updateProj(idx, { url: e.target.value })}
                    placeholder="github.com/you/project"
                  />
                  <div className="lg:col-span-2">
                    <Input
                      label="Tech Stack"
                      value={proj.techStack}
                      onChange={(e) => updateProj(idx, { techStack: e.target.value })}
                      placeholder="Next.js, TypeScript, PostgreSQL"
                    />
                  </div>
                </div>
                <p className="text-xs font-medium text-content-muted mb-1">Bullet Points</p>
                <BulletEditor
                  bullets={proj.bullets}
                  onChange={(bullets) => updateProj(idx, { bullets })}
                />
                <div className="flex justify-end mt-4 pt-3 border-t border-edge">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash size={13} />}
                    onClick={() =>
                      setProjects((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-content-subtle hover:text-red-500"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setProjects((prev) => [...prev, emptyProject()])}
              className="self-start"
            >
              Add Project
            </Button>
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Skills">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">
                Languages
              </p>
              <TagInput
                tags={skills.languages}
                onChange={(languages) => setSkills((s) => ({ ...s, languages }))}
                placeholder="Python, Go..."
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">
                Frameworks
              </p>
              <TagInput
                tags={skills.frameworks}
                onChange={(frameworks) => setSkills((s) => ({ ...s, frameworks }))}
                placeholder="Next.js, FastAPI..."
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">
                Tools
              </p>
              <TagInput
                tags={skills.tools}
                onChange={(tools) => setSkills((s) => ({ ...s, tools }))}
                placeholder="Docker, Git..."
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Sticky bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end px-6 py-3 bg-card/80 backdrop-blur border-t border-edge">
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save Profile
        </Button>
      </div>
    </div>
  );
}
