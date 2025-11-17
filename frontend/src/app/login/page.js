import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Login</h1>
        <p className="text-foreground/60 mb-8 text-center">
          Welcome back to Digital Dungeons
        </p>
        
        <LoginForm />

        <p className="text-center mt-6 text-foreground/60">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-500 hover:text-blue-400">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
