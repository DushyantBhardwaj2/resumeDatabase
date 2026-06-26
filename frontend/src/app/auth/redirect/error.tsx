"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function AuthRedirectError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error("Auth redirect error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          There was a problem completing your sign-in. Please try again.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
