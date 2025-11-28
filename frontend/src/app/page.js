import Link from "next/link";
import CursorAnimation from "@/components/CursorAnimation";

export default function Home() {


  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="sm:text-left my-40">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-red-500 mt-20">Digital Dungeons</h1>
        <p className="my-1 text-base sm:text-lg text-foreground/80 max-w-[80ch] font-mono">
            is a platform for creating and playing <mark className="bg-foreground text-background px-1">text-based RPG games</mark>. Visual drag & drop editor, community game marketplace, and classic console-style gameplay<CursorAnimation />
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/editor"
            className="inline-flex items-center justify-center rounded-md bg-red-500 text-background px-5 py-3 text-sm font-medium hover:bg-red-700"
          >
            Start creating
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-5 py-3 text-sm font-medium bg-background hover:border-red-500"
          >
            Browse games
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="my-30">
        <h2 className="text-5xl font-black">Key Features</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard title="Editor" desc="Visual map and dialogue editor featuring interconnected rooms, custom items, and lively NPCs <span style='white-space: nowrap'>[¬º-°]¬</span>." />
          <FeatureCard title="Gameplay" desc="Distraction-free console-like view allowing imagination to thrive. Engage in games through interactive choices in a grid-based dungeon system <span style='white-space: nowrap'>\( ﾟヮﾟ)/</span>." />
          <FeatureCard title="Marketplace" desc="Scroll through pre-made worlds published by the community and engage with creators through likes, downloads, and comments <span style='white-space: nowrap'>◕_◕</span>." />
          <FeatureCard title="Users" desc="Create your profile, publish games, or comment on others' creations <span style='white-space: nowrap'>( ´◔ ω◔`) ノシ</span>." />
        </div>
      </section>

      {/* About/Team */}
      <section>
        <h2 className="text-5xl font-black">About the project</h2>
        <p className="mt-5 text-foreground/80 max-w-[70ch] font-mono">
            Fascinated by the charm of classics like Pong, and absorbed by the simplistic magic of in-person RPGs, we're working to bring you a sandbox to share your rich inner landscape with the world <span style={{whiteSpace: "nowrap"}}>=^_^=</span>.
        </p>
        <p className="mt-5 text-foreground/80 max-w-[70ch] font-mono">
            Taking on the form of a group passion project, <mark className="bg-foreground text-background px-1">we aim to revive</mark> the black-and-white, low-stimulation <mark className="bg-foreground text-background px-1">entertainment of the early days of technology</mark> <span style={{whiteSpace: "nowrap"}}>＼(＾O＾)／</span>. In development since Oct 2025.
        </p>
        <p className="mt-5 text-foreground/80 max-w-[70ch] font-mono">
            We hope to soothe the gentler (and nerdier!) souls exhausted with the overwhelming flash and urgency of modern entertainment <span style={{whiteSpace: "nowrap"}}>┬──┬ ノ(ò_óノ)</span>.
        </p>
        <p className="my-10 text-foreground/80 max-w-[70ch] font-mono">
          So, whenever you're ready, <Link href={"/marketplace"} className={"text-red-500 font-bold hover:underline" +
            " hover:text-red-700"}>dive into a maze</Link> full of life and surprises, or let your imagination guide you to <Link href={"/editor"} className={"text-red-500 font-bold hover:underline hover:text-red-700"}>design your own</Link> curious mini-verse. Let's walk it together <span style={{whiteSpace: "nowrap"}}>\(^-^)/</span>.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="rounded-lg border border-foreground/20 px-10 py-8 bg-background">
      <h3 className="font-black font-mono text-xl mb-4">{title}</h3>
      <p className="mt-2 text-sm text-foreground/70 font-mono" dangerouslySetInnerHTML={{ __html: desc }}></p>
    </div>
  );
}