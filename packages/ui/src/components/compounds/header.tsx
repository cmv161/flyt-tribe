"use client";

import { type ComponentType, type HTMLAttributes, useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { MoonIcon, SunMediumIcon } from "@flyt-tribe/ui/components/icons";
import { Button } from "@flyt-tribe/ui/components/primitives/button";
import { cn } from "@flyt-tribe/ui/lib/utils";

type HeaderProps = HTMLAttributes<HTMLElement> & {
  brand: string;
  fixed?: boolean;
};
type ThemeOption = "light" | "dark";

const THEMES: Array<{
  label: string;
  value: ThemeOption;
  icon: ComponentType<{ className?: string; size?: number }>;
}> = [
  { label: "Light", value: "light", icon: SunMediumIcon },
  { label: "Dark", value: "dark", icon: MoonIcon },
];

export function Header({ className, brand, fixed = false, ...props }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme: ThemeOption = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <header
      className={cn("top-0 z-30 h-16 w-full", fixed ? "fixed inset-x-0" : "sticky", className)}
      {...props}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <p className="text-foreground/90 text-sm font-semibold tracking-[0.22em] uppercase">
          {brand}
        </p>
        <div className="border-border/60 bg-background/60 supports-[backdrop-filter]:bg-background/50 flex items-center gap-1 rounded-full border p-1 backdrop-blur-sm">
          {THEMES.map(({ label, value, icon: Icon }) => {
            const isActive = activeTheme === value;

            return (
              <Button
                key={value}
                type="button"
                size="icon"
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "size-8 rounded-full",
                  !isActive && "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setTheme(value)}
                aria-label={`${label} theme`}
                aria-pressed={isActive}
              >
                <Icon
                  size={16}
                  className={cn("grid place-items-center", !isActive && "opacity-85")}
                />
              </Button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
