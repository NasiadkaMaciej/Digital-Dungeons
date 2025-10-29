import Link from "next/link";

export default function Home() {

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">Digital Dungeons</h1>
        <p className="mt-4 text-base sm:text-lg text-foreground/80 max-w-2xl">
          Platform for creating and playing text-based RPG games. Visual drag & drop editor, community game marketplace, and classic console-style gameplay.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/editor"
            className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90"
          >
            Open Editor
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-5 py-3 text-sm font-medium hover:bg-foreground/5"
          >
            Browse Games
          </Link>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold">Key Features</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard title="Editor [MVP]" desc="Visual map editor, rooms, items, NPCs, and dialogues." />
          <FeatureCard title="Gameplay [MVP]" desc="Console view, action choices, grid-based room system." />
          <FeatureCard title="Marketplace" desc="Browse, search, favorites, and download statistics." />
          <FeatureCard title="Users" desc="Registration, player profiles, and creator panel." />
        </div>
      </section>

      {/* About/Team */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold">About the project</h2>
        <p className="mt-3 text-foreground/80 max-w-3xl">
          Student project developed in the 2025/2026 semester. The MVP goal is to deliver a basic editor and gameplay engine along with a simple marketplace. Authors: Maciej Nasiadka, Maciej Wojciechowski, and Michał Ryduchowski.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="rounded-lg border border-foreground/10 p-5 bg-background/50">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm text-foreground/70">{desc}</p>
    </div>
  );
}
