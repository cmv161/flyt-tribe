import * as React from "react";

import { cn } from "@flyt-tribe/ui/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  const auroraStyle = {
    "--aurora":
      "repeating-linear-gradient(100deg, var(--aurora-1) 10%, var(--aurora-2) 15%, var(--aurora-3) 20%, var(--aurora-4) 25%, var(--aurora-5) 30%)",
    "--theme-gradient":
      "repeating-linear-gradient(100deg, var(--background) 0%, var(--background) 7%, transparent 10%, transparent 12%, var(--background) 16%)",
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "bg-background text-foreground relative flex min-h-svh flex-col items-center justify-center",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden" style={auroraStyle}>
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--theme-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-50 blur-[10px] filter will-change-transform after:absolute after:inset-0 after:[background-image:var(--theme-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""]`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`,
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
