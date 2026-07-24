import { betterAuth } from "better-auth"
import { prisma } from "./prisma"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { APIError } from "better-auth/api"


export const auth = betterAuth({
  database: prismaAdapter(prisma as unknown as PrismaClient, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  trustedProxyHeaders: true,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  trustedOrigins: [process.env.VERCEL_FRONTEND_URL || "http://localhost:3000"],
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development",
    },
  },
  plugins: [],
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

// Backend auth.ts doesn't need nextCookies or getServerSession
