"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface text-content">
        <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex max-w-md flex-col items-center justify-center space-y-4 rounded-xl border border-edge bg-surface-alt p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-500">A critical error occurred!</h2>
            <p className="text-sm text-content-subtle">
              {error.message || "An unexpected error occurred at the application root."}
            </p>
            <button
              onClick={() => reset()}
              className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
