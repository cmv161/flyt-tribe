"use client";

import { Header } from "@flyt-tribe/ui/components";
import { signIn, signOut, useSession } from "next-auth/react";

import type { AuthProviderId } from "@/auth/providers";
import { getDashboardPath, getHomePath } from "@/auth/routes";

type SiteHeaderProps = {
  fixed?: boolean;
  signInProvider: AuthProviderId;
};

export function SiteHeader({ fixed = false, signInProvider }: SiteHeaderProps) {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = Boolean(session?.user?.id);

  const loginLabel = isLoading ? "Loading..." : isAuthenticated ? "Sign out" : "Sign in";

  const handleAuthClick = () => {
    if (isLoading) return;

    if (isAuthenticated) {
      void signOut({ callbackUrl: getHomePath() });
      return;
    }

    void signIn(signInProvider, { callbackUrl: getDashboardPath() });
  };

  return (
    <Header
      brand="Flyt Tribe"
      fixed={fixed}
      loginLabel={loginLabel}
      onLoginClick={handleAuthClick}
    />
  );
}
