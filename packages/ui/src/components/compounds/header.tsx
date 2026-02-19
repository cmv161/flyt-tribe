"use client";

import { type HTMLAttributes, useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { MoonIcon, SunMediumIcon } from "@flyt-tribe/ui/components/icons";
import { Button } from "@flyt-tribe/ui/components/primitives/button";
import { cn } from "@flyt-tribe/ui/lib/utils";

type HeaderProps = HTMLAttributes<HTMLElement> & {
  brand: string;
  fixed?: boolean;
  loginLabel?: string;
  onLoginClick?: () => void;
};
type ThemeOption = "light" | "dark";

export function Header({
  className,
  brand,
  fixed = false,
  loginLabel = "Sign in",
  onLoginClick,
  ...props
}: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme: ThemeOption = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const isDarkTheme = activeTheme === "dark";
  const nextTheme: ThemeOption = isDarkTheme ? "light" : "dark";
  const ThemeIcon = isDarkTheme ? SunMediumIcon : MoonIcon;
  const themeToggleLabel = isDarkTheme ? "Switch to light theme" : "Switch to dark theme";

  return (
    <header
      className={cn("top-0 z-30 h-16 w-full", fixed ? "fixed inset-x-0" : "sticky", className)}
      {...props}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <p className="text-foreground/90 text-sm font-semibold tracking-[0.22em] uppercase">
          {brand}
        </p>
        <div className="border-border/60 bg-background/60 supports-[backdrop-filter]:bg-background/50 flex translate-y-0.5 items-center gap-1 rounded-full border p-1 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            className="text-foreground/90 hover:bg-foreground/10 h-9 rounded-full px-4 text-sm font-medium"
            onClick={onLoginClick}
          >
            {loginLabel}
          </Button>
          <span className="bg-border/45 mx-0.5 h-4 w-px" aria-hidden />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground size-9 rounded-full"
            onClick={() => setTheme(nextTheme)}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
          >
            <ThemeIcon size={16} className="grid place-items-center" />
          </Button>
        </div>
      </div>
    </header>
  );
}
