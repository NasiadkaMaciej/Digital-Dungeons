// Ensure a global bridge exists; if missing, inject its <script> and wait.
export function ensureBridge(globalName, srcPath) {
	return new Promise((resolve, reject) => {
		// already present?
		if (typeof window !== 'undefined' && window[globalName]) return resolve(window[globalName]);

		// already loading?
		const existing = document.querySelector(`script[data-bridge="${globalName}"]`);
		if (existing) {
			existing.addEventListener('load', () => resolve(window[globalName]), { once: true });
			existing.addEventListener('error', () => reject(new Error(`Failed to load ${srcPath}`)), { once: true });
			return;
		}

		// inject
		const s = document.createElement('script');
		s.src = srcPath;
		s.async = false; // preserve execution order if you add more bridges
		s.defer = false;
		s.setAttribute('data-bridge', globalName);
		s.addEventListener('load', () => resolve(window[globalName]), { once: true });
		s.addEventListener('error', () => reject(new Error(`Failed to load ${srcPath}`)), { once: true });
		document.head.appendChild(s);
	});
}