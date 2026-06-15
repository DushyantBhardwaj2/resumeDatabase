import Link from "next/link"

export default function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
        <p className="text-muted-foreground">
          Resumint is currently available exclusively for NSUT students and staff
          with an <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">@nsut.ac.in</code> email address.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
