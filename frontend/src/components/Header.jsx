"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import Nav from "./Nav";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    const pathname = usePathname();
    const hideToggle = pathname && pathname.startsWith("/editor");
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close the mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 bg-background/90 border-b border-foreground/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                <Link
                    href="/"
                    className="text-base sm:text-lg font-black tracking-tight text-red-500 hover:text-red-700"
                >
                    Digital Dungeons
                </Link>

                {/* Desktop: nav + theme toggle inline */}
                <div className="hidden md:flex items-center gap-4">
                    <Nav orientation="horizontal" />
                    <div className="flex items-center gap-2 border-l border-foreground/10 pl-4">
                        {!hideToggle && <ThemeToggle />}
                    </div>
                </div>

                {/* Mobile / tablet: theme toggle + hamburger */}
                <div className="flex items-center gap-2 md:hidden">
                    {!hideToggle && <ThemeToggle />}
                    <button
                        type="button"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background"
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? (
                            // X icon
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M6 6l12 12M18 6L6 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        ) : (
                            // Hamburger icon
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M4 7h16M4 12h16M4 17h16"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile nav panel */}
            {mobileOpen && (
                <div className="md:hidden border-t border-foreground/10 bg-background/95 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <Nav
                            orientation="vertical"
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}