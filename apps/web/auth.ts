import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Credentials({
      name: "Demo",
      credentials: {},
      async authorize() {
        // placeholder: always fail
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;

const nextAuth = NextAuth(authConfig);

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export const { GET, POST } = nextAuth.handlers;
