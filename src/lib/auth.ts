import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log("Attempting to create user with email:", user.email);
          if (!user.email || !user.email.toLowerCase().endsWith("@nsut.ac.in")) {
            console.error("User email domain rejected:", user.email);
            throw new Error("Access restricted to NSUT students/staff.");
          }
          return { data: user }
        },
      },
    },
  },
})

export async function getServerSession(requestHeaders?: Headers) {
  const headers = requestHeaders ?? (await import("next/headers")).headers()
  return auth.api.getSession({ headers: await headers })
}
