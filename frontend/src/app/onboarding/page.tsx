'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchApi } from '@/config/api-client';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useChatStore } from '@/store/useChatStore';

export default function OnboardingPage() {
  const router = useRouter();
  const addMessage = useChatStore((s) => s.addMessage);
  const currentPhase = useChatStore((s) => s.currentPhase);
  const isTyping = useChatStore((s) => s.isTyping);
  const clearChat = useChatStore((s) => s.clearChat);
  const [completing, setCompleting] = useState(false);
  const initRef = useRef(false);

  // Initialize chat with greeting
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    clearChat();

    addMessage({
      id: 'greeting',
      role: 'assistant',
      content:
        "Hi! I'm your Resumint Assistant. 👋 Let's build your Career Vault.\n\nYou can:\n• Upload an existing PDF resume\n• Describe your experience, projects, and skills\n• Or just start typing!\n\nWhat would you like to do?",
      widget: 'UPLOAD_DROPZONE',
    });
  }, [addMessage, clearChat]);

  // Auto-save and redirect when COMPLETE
  useEffect(() => {
    if (currentPhase !== 'COMPLETE' || completing) return;

    (async () => {
      setCompleting(true);
      try {
        const res = await fetchApi('/api/protected/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error();
        // Set completion cookie so middleware allows access
        document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax';
        toast.success('Profile created! Welcome to Resumint.');
        router.push('/dashboard');
      } catch {
        toast.error('Failed to save profile');
      } finally {
        setCompleting(false);
      }
    })();
  }, [currentPhase, completing, router]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-edge flex items-center justify-center shrink-0 bg-card">
        <span className="font-display text-base font-bold text-content tracking-tight">
          Resumint
        </span>
        <span className="ml-2 text-[10px] font-medium text-content-muted uppercase tracking-widest bg-muted-bg px-2 py-0.5 rounded-full">
          Onboarding
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full">
        <ChatContainer mode="ONBOARDING" />
      </div>

      {/* Bottom status */}
      {isTyping && (
        <div className="h-8 shrink-0 flex items-center justify-center bg-card/50 border-t border-edge">
          <span className="text-[10px] text-content-muted font-mono animate-pulse">
            AI is thinking...
          </span>
        </div>
      )}
    </div>
  );
}
