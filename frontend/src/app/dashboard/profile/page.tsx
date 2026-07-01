'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OldProfileRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile')
  }, [router])
  return null
}
