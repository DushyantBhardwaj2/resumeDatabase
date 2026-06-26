'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryItem = {
  id: string;
  jobTitle: string;
  companyName: string;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="divide-y divide-edge">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="py-4 flex items-center justify-between animate-pulse">
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-44 bg-muted-bg rounded" />
            <div className="h-3 w-28 bg-muted-bg rounded" />
            <div className="h-3 w-20 bg-muted-bg rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-muted-bg rounded-[var(--radius-md)]" />
            <div className="h-8 w-14 bg-muted-bg rounded-[var(--radius-md)]" />
            <div className="h-8 w-8 bg-muted-bg rounded-[var(--radius-md)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function HistoryRow({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startConfirm = () => {
    setConfirm(true);
    confirmTimer.current = setTimeout(() => setConfirm(false), 3000);
  };

  const cancelConfirm = () => {
    setConfirm(false);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  };

  const handleDelete = async () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setDeleting(true);
    try {
      const res = await fetch(`/api/protected/history/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      onDelete(item.id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
      setConfirm(false);
    }
  };

  return (
    <div className="py-4 flex items-center justify-between px-2 -mx-2 rounded-[var(--radius-md)] hover:bg-surface-subtle transition-colors group">
      {/* Left */}
      <div className="flex flex-col gap-0.5 min-w-0 mr-4">
        <p className="font-medium text-content text-sm leading-snug truncate">
          {item.jobTitle}
        </p>
        <p className="text-xs text-content-muted mt-0.5 truncate">{item.companyName}</p>
        <p className="text-xs text-content-subtle mt-0.5 font-mono">
          {formatDate(item.createdAt)}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {confirm ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              loading={deleting}
              onClick={handleDelete}
            >
              Confirm?
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelConfirm}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/tailor?clone=${item.id}`)}
            >
              Clone
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/tailor?edit=${item.id}`)}
            >
              Edit
            </Button>
            <button
              onClick={startConfirm}
              className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] text-content-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Delete"
            >
              <Trash size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted-bg flex items-center justify-center">
        <Clock size={24} className="text-content-subtle" />
      </div>
      <div>
        <p className="font-display font-semibold text-content text-base">
          No tailored resumes yet
        </p>
        <p className="text-sm text-content-muted mt-1">
          Generate your first tailored resume to see it here.
        </p>
      </div>
      <Link href="/tailor">
        <Button variant="primary" size="sm">
          Tailor a resume
        </Button>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/protected/history', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems(data);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.jobTitle.toLowerCase().includes(q) ||
        i.companyName.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="font-display text-2xl font-bold tracking-tight text-content">
          History
        </h1>
        {!loading && items.length > 0 && (
          <div className="w-64">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company or role..."
              icon={<MagnifyingGlass size={14} />}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <HistorySkeleton />
      ) : filtered.length === 0 && items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-edge">
          {filtered.length === 0 && search ? (
            <p className="py-12 text-center text-sm text-content-muted">
              No results for &ldquo;{search}&rdquo;
            </p>
          ) : (
            filtered.map((item) => (
              <HistoryRow key={item.id} item={item} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
