export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-12 border-t border-foreground/10 bg-background font-mono">
			<div className="max-w-7xl mx-auto px-10 py-8 text-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
				<p className="text-foreground/45">© {year} Digital Dungeons</p>
				<p className="text-foreground/45">Built by Maciej Nasiadka, Maciej Wojciechowski, Michał Ryduchowski</p>
			</div>
		</footer>
	);
}