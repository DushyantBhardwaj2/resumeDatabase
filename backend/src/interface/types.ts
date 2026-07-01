export type Variables = {
  session: {
    user: {
      id: string
      email: string
      name: string
      image?: string
    }
    session: {
      id: string
      expiresAt: Date
      ipAddress?: string
      userAgent?: string
    }
  }
}
