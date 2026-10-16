/**
 * Login Page
 * 
 * User authentication page.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient, tokenManager, getErrorMessage } from '../core/api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await apiClient.post<{ user: unknown; token: string }>('/auth/login', {
        email,
        password,
      });
      tokenManager.setAccessToken(data.token);
      localStorage.setItem('nexora_user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <div className="max-w-md w-full bg-surface-1 border border-border-subtle rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">NEXORA</h1>
          <p className="text-text-muted mt-2">Enterprise Operations Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
              placeholder="admin@nexora.io"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Session ends automatically after a period of inactivity
        </p>

        <p className="text-center text-sm text-text-muted mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-500 hover:text-accent-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
