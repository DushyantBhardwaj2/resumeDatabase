import { betterAuth } from "better-auth"
import { prisma } from "./prisma"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { APIError } from "better-auth/api"

export const auth = betterAuth({
  database: prismaAdapter(prisma as unknown as PrismaClient, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedProxyHeaders: true,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase()
          if (!email.endsWith("@nsut.ac.in")) {
            throw new APIError("FORBIDDEN", { message: "Only @nsut.ac.in emails are allowed." })
          }
        },
      },
    },
  },
})

export async function getServerSession(headers?: Headers) {
  const { headers: nextHeaders } = await import("next/headers")
  const h = headers ?? (await nextHeaders())
  const session = await auth.api.getSession({ headers: h })
  return session
}
