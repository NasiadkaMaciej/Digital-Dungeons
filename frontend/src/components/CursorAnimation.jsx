"use client";

import { useEffect, useRef } from "react";

export default function CursorAnimation() {
	const cursorRef = useRef(null);

	useEffect(() => {
		const el = cursorRef.current;
		if (!el) return;

		const animation = setInterval(() => {
			el?.classList.toggle("bg-foreground");
			el?.classList.toggle("text-background");
			el?.classList.toggle("text-foreground");
			el?.classList.toggle("bg-transparent");
		}, 600);

		return () => clearInterval(animation);
	}, []);

	return (
		<mark ref={cursorRef} className="bg-foreground text-background">.</mark>
	);
}