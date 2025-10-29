"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Home" },
    { href: "/editor", label: "Editor" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm px-3 py-2 rounded-md hover:bg-foreground/5 border border-transparent ${
              active ? "border-foreground/10 bg-foreground/5" : ""
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
