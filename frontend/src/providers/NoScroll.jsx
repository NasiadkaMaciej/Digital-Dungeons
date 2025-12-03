'use client';

import { useEffect } from 'react';

export default function NoScroll({ children }) {
	useEffect(() => {
		const html = document.documentElement;
		const body = document.body;

		// Remember previous inline styles to restore on unmount
		const prev = {
			htmlOverflow: html.style.overflow,
			htmlHeight: html.style.height,
			bodyOverflow: body.style.overflow,
			bodyMargin: body.style.margin,
			bodyHeight: body.style.height,
		};

		// Lock the viewport for this route only
		html.style.overflow = 'hidden';
		html.style.height = '100%';
		body.style.overflow = 'hidden';
		body.style.margin = '0';
		body.style.height = '100%';

		return () => {
			html.style.overflow = prev.htmlOverflow;
			html.style.height = prev.htmlHeight;
			body.style.overflow = prev.bodyOverflow;
			body.style.margin = prev.bodyMargin;
			body.style.height = prev.bodyHeight;
		};
	}, []);

	// Contain everything in a fixed, full-viewport box so nothing can cause overflow
	return (
		<div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
			{children}
		</div>
	);
}