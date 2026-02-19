import { Button, AuroraBackground } from "@flyt-tribe/ui/components";

import { SiteHeader } from "@/app/components/site-header";
import { getValidatedSession } from "@/auth/session";
import { authEnv } from "@/env/auth";

export default async function Page() {
  const session = await getValidatedSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "Guest";

  return (
    <AuroraBackground className="h-svh">
      <SiteHeader fixed signInProvider={authEnv.AUTH_DEFAULT_PROVIDER} />
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 pt-16 text-center">
        <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
          Flyt Tribe UI
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
          Aurora background integrated from Aceternity through the shared UI package.
        </p>
        <p className="text-muted-foreground text-xs">
          {session?.user?.id ? `Signed in as ${userName}` : "Not signed in"}
        </p>
        <div className="flex items-center gap-3">
          <Button>Get started</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </div>
    </AuroraBackground>
  );
}
