"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { getAuthApiPath } from "@/auth/routes";
import { ReactQueryProvider } from "./react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <SessionProvider basePath={getAuthApiPath()}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}
