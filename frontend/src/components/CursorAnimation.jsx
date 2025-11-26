"use client";

import {useEffect, useRef} from "react";

export default function CursorAnimation() {
    const cursorRef = useRef(null);

    useEffect(() => {
        const el = cursorRef.current;
        if (!el) return;

        const animation = setInterval(() => {
            if (!cursorRef.current) return;

            cursorRef.current.classList.toggle("bg-foreground");
            cursorRef.current.classList.toggle("text-background");
            cursorRef.current.classList.toggle("text-foreground");
            cursorRef.current.classList.toggle("bg-transparent");
        }, 600);

        return () => {
            window.clearInterval(animation);
        }
    }, [])

    return (
        <mark id={"hero-cursor-animation"} ref={cursorRef} className={"bg-foreground text-background"}>.</mark>
    )
}