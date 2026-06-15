"use client"

import { useState } from "react"

export default function Home() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/auth/redirect",
      })
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <span className="text-xl font-bold tracking-tight text-primary">Resumint</span>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Tailor your resume
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                with AI precision
              </span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Upload your resume once, build your profile, and generate
              ATS-optimized resumes tailored to any job description in seconds.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex h-12 items-center gap-3 rounded-full bg-primary px-8 text-base font-medium text-white transition-all hover:bg-primary-dark hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            Only for NSUT students &amp; alumni with{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">@nsut.ac.in</code> email
          </p>
        </div>

        <div className="mt-24 grid w-full max-w-4xl gap-6 px-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h3 className="mb-1 font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const features = [
  {
    title: "Parse & Import",
    description: "Upload your existing PDF resume. Our AI extracts and structures your entire profile automatically.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
  {
    title: "Build Your Profile",
    description: "Enrich your profile with GitHub repos, skills, projects, and more. Your data, always up to date.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Tailor Instantly",
    description: "Paste any job description and get an ATS-friendly resume tailored to match, in seconds.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
]

import { signIn } from "@/lib/auth-client"
