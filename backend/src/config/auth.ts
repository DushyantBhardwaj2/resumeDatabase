import { betterAuth } from "better-auth"
import { prisma } from "./prisma"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { APIError } from "better-auth/api"

export const auth = betterAuth({
  database: prismaAdapter(prisma as unknown as PrismaClient, {
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
          const email = user.email.toLowerCase()
          if (!email.endsWith("@nsut.ac.in")) {
            throw new APIError("FORBIDDEN", { message: "Only @nsut.ac.in emails are allowed." })
          }
        },
      },
    },
  },
})
