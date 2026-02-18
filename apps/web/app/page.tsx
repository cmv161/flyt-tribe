import { AuroraBackground, Button, Header } from "@flyt-tribe/ui/components";

export default function Page() {
  return (
    <AuroraBackground className="h-svh">
      <Header brand="Flyt Tribe" fixed />
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 pt-16 text-center">
        <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
          Flyt Tribe UI
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
          Aurora background integrated from Aceternity through the shared UI package.
        </p>
        <div className="flex items-center gap-3">
          <Button>Get started</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </div>
    </AuroraBackground>
  );
}
