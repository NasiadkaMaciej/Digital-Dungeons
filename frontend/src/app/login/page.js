import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
	return (
		<div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<h1 className="text-5xl font-black">Login</h1>
				<p className="text-foreground/60 mb-15 font-mono">
					Welcome back to Digital Dungeons ツ!
				</p>

				<LoginForm />

				<p className="text-center mt-10 text-foreground/60 font-mono text-sm">
					Don't have an account yet?{' '}
					<Link href="/register" className="text-red-500 hover:text-red-700 hover:underline">
						Register here.
					</Link>
				</p>
			</div>
		</div>
	);
}