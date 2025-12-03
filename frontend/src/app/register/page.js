import Link from 'next/link';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
	return (
		<div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<h1 className="text-5xl font-black">Register</h1>
				<p className="text-foreground/60 mb-15 font-mono">
					Create your Digital Dungeons account <span style={{ whiteSpace: "nowrap" }}>ʕ •́؈•̀)</span>.
				</p>

				<RegisterForm />

				<p className="text-center mt-10 text-foreground/60 font-mono text-sm">
					Already have an account?{' '}
					<Link href="/login" className="text-red-500 hover:text-red-700 hover:underline">
						Login here.
					</Link>
				</p>
			</div>
		</div>
	);
}