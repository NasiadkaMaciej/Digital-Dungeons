"use client";

import Link from "next/link";
import Nav from "./Nav";
import ThemeToggle from "./ThemeToggle";
import { usePathname } from 'next/navigation';
// Language toggle and i18n removed for MVP scope

export default function Header() {
  const pathname = usePathname();
  const hideToggle = pathname && pathname.startsWith('/editor');

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border-b border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-base sm:text-lg font-semibold tracking-tight">
          Digital Dungeons
        </Link>
        <div className="flex items-center gap-4">
          <Nav />
          <div className="flex items-center gap-2 border-l border-foreground/10 pl-4">
            {!hideToggle && <ThemeToggle />}
          </div>
        </div>
      </div>
    </header>
  );
}
