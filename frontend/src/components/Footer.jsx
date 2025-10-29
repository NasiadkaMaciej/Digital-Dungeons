export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <p className="text-foreground/70">© {year} Digital Dungeons</p>
        <p className="text-foreground/60">Authors: Maciej Nasiadka, Maciej Wojciechowski, Michał Ryduchowski</p>
        <p className="text-foreground/60">Status: In development</p>
      </div>
    </footer>
  );
}
