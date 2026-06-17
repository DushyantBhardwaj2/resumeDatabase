import { createAuthClient } from "better-auth/client"

export const { signIn, signOut, useSession, getSession } = createAuthClient()
