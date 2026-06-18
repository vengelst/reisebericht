import type { DefaultSession, NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      displayName: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    displayName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    displayName: string;
  }
}

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user.id ?? token.sub ?? "") as string;
        token.email = (user.email ?? "") as string;
        token.displayName = (user.displayName ?? "") as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.displayName = token.displayName as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
