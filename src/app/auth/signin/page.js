'use client';

/**
 * Sign-In Page
 * Simple login UI with Google OAuth and email/password options
 */

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signIn('google', {
      redirect: true,
      callbackUrl,
    });
    setLoading(false);
  };

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
        <h1 className="text-3xl font-bold text-center text-white mb-2">SystemForge</h1>
        <p className="text-center text-slate-400 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mb-6 py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-400">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Demo: Use any email and password to test
        </p>
      </div>
    </div>
  );
}
