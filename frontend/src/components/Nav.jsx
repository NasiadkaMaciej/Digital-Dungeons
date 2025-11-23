"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/lib/AuthContext";

export default function Nav({
                                orientation = "horizontal",
                                onNavigate,
                            }) {
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

    const containerClasses =
        orientation === "horizontal"
            ? "flex items-center gap-2 sm:gap-4"
            : "flex flex-col items-stretch gap-1";

    const linkBaseClasses =
        "text-sm px-3 py-2 rounded-md hover:bg-foreground/5 border border-transparent";

    const activeClasses = "border-foreground/10 bg-foreground/5";

    const linkExtraForVertical =
        orientation === "vertical" ? "w-full text-left" : "";

    const authContainerClasses =
        orientation === "horizontal"
            ? "flex items-center gap-2 ml-2 pl-2 border-l border-foreground/10"
            : "flex flex-col gap-2 pt-3 mt-3 border-t border-foreground/10";

    const buttonExtraForVertical =
        orientation === "vertical" ? "w-full text-left justify-between" : "";

    const handleNavigate = () => {
        if (onNavigate) onNavigate();
    };

    return (
        <nav className={containerClasses}>
            {publicLinks.map((l) => {
                const active = pathname === l.href;
                return (
                    <Link
                        key={l.href}
                        href={l.href}
                        onClick={handleNavigate}
                        className={`${linkBaseClasses} ${
                            active ? activeClasses : ""
                        } ${linkExtraForVertical}`}
                    >
                        {l.label}
                    </Link>
                );
            })}

            {isAuthenticated &&
                authLinks.map((l) => {
                    const active = pathname === l.href;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            onClick={handleNavigate}
                            className={`${linkBaseClasses} ${
                                active ? activeClasses : ""
                            } ${linkExtraForVertical}`}
                        >
                            {l.label}
                        </Link>
                    );
                })}

            {isAuthenticated ? (
                <div className={authContainerClasses}>
                    <span className="text-sm text-gray-400">{user?.username}</span>
                    <button
                        onClick={() => {
                            logout();
                            if (onNavigate) onNavigate();
                        }}
                        className={`text-sm px-3 py-2 rounded-md hover:bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/20 flex items-center gap-1 ${buttonExtraForVertical}`}
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <>
                    <Link
                        href="/login"
                        onClick={handleNavigate}
                        className={`${linkBaseClasses} ${
                            pathname === "/login" ? activeClasses : ""
                        } ${linkExtraForVertical}`}
                    >
                        Login
                    </Link>
                    <Link
                        href="/register"
                        onClick={handleNavigate}
                        className={`text-sm px-3 py-2 rounded-md bg-red-500 hover:bg-red-700 border border-transparent text-red-50 ${linkExtraForVertical}`}
                    >
                        Register
                    </Link>
                </>
            )}
        </nav>
    );
}