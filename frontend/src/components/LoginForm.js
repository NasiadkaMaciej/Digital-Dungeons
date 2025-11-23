'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/lib/AuthContext';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded">
                {error}
            </div>
        )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 bg-foreground/5 border border-foreground/10 rounded focus:outline-none focus:border-red-500 text-foreground font-mono"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full px-4 py-2 bg-foreground/5 border border-foreground/10 rounded focus:outline-none focus:border-red-500 text-foreground font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-500 hover:bg-red-700 text-red-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors focus:outline-2 focus:outline-red-500 focus:outline-offset-5 mt-10"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}