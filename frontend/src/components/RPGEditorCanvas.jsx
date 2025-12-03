'use client';

import { useEffect, useRef } from 'react';

export default function RPGEditorCanvas() {
	const containerRef = useRef(null);
	const p5Ref = useRef(null);
	const mountedRef = useRef(false); // guards Strict Mode double-invoke in dev

	useEffect(() => {
		if (mountedRef.current) return;
		mountedRef.current = true;

		let disposed = false;

		(async () => {
			const mod = await import('p5');
			const P5 = mod.default || mod;
			const { sketchFactory } = await import('../p5/sketchFactory.js');
			if (disposed || !containerRef.current) return;
			p5Ref.current = new P5(sketchFactory, containerRef.current);
		})();

		return () => {
			disposed = true;
			try {
				p5Ref.current?.remove();
			} finally {
				p5Ref.current = null;
				mountedRef.current = false;
			}
		};
	}, []);

	return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}