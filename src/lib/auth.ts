import { AuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

/** Centralized auth routes - single source of truth */
export const AUTH_ROUTES = {
  signIn: "/auth/login",
} as const;

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
            },
          });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          if (err instanceof Error && err.message === "Invalid credentials") {
            throw err;
          }
          logger.warn("Auth authorize error", err);
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],
  pages: {
    signIn: AUTH_ROUTES.signIn,
  },
};

export async function auth(){
    return getServerSession(authOptions);
}