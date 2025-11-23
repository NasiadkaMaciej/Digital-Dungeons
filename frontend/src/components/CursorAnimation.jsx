"use client";

import {useEffect, useRef} from "react";

export default function CursorAnimation() {
    const cursor = useRef("cursor");

    useEffect(() => {

        const animation = setInterval(() => {
            cursor.current.classList.toggle("bg-foreground");
            cursor.current.classList.toggle("text-background");
            cursor.current.classList.toggle("text-foreground");
            cursor.current.classList.toggle("bg-transparent");
        }, 600);

        return () => {
            clearInterval(animation);
        }
    }, [])

    return (
        <mark id={"hero-cursor-animation"} ref={cursor} className={"bg-foreground text-background"}>.</mark>
    )
}