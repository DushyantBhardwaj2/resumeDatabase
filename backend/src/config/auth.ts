import { betterAuth } from "better-auth"
import { prisma } from "./prisma"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { bearer } from "better-auth/plugins"


export const auth = betterAuth({
  database: prismaAdapter(prisma as unknown as PrismaClient, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "https://resumint-backend-ihjf.onrender.com",
  emailAndPassword: {
    enabled: true,
  },
  trustedProxyHeaders: true,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  trustedOrigins: [
    "https://resume-database.vercel.app",
    process.env.VERCEL_FRONTEND_URL || "https://resume-database.vercel.app",
    "http://localhost:3000",
    "http://localhost:8080",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV !== "development",
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development",
    },
  },
  plugins: [bearer()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Domain restriction — only active if RESTRICT_NSUT_DOMAIN=true
          if (process.env.RESTRICT_NSUT_DOMAIN === "true") {
            const { APIError } = await import("better-auth/api")
            const email = user.email.toLowerCase()
            if (!email.endsWith("@nsut.ac.in")) {
              throw new APIError("FORBIDDEN", { message: "Only @nsut.ac.in emails are allowed." })
            }
          }
        },
      },
    },
  },
})

// Backend auth.ts doesn't need nextCookies or getServerSession
