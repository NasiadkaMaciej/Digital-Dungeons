"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Nav() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  
  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/marketplace", label: "Marketplace" },
  ];

  const authLinks = [
    { href: "/editor", label: "Editor" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      {publicLinks.map((l) => {
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
      
      {isAuthenticated && authLinks.map((l) => {
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

      {isAuthenticated ? (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-foreground/10">
          <span className="text-sm text-gray-400">{user?.username}</span>
          <button
            onClick={logout}
            className="text-sm px-3 py-2 rounded-md hover:bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/20"
          >
            Logout
          </button>
        </div>
      ) : (
        <>
          <Link
            href="/login"
            className={`text-sm px-3 py-2 rounded-md hover:bg-foreground/5 border border-transparent ${
              pathname === "/login" ? "border-foreground/10 bg-foreground/5" : ""
            }`}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 border border-transparent"
          >
            Register
          </Link>
        </>
      )}
    </nav>
  );
}
