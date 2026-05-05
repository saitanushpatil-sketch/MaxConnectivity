import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ identifier: '', username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { login, signup, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/chats');
  }, [isAuthenticated, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.identifier, form.password);
        toast.success('Welcome back! 👋');
      } else {
        if (form.username.length < 3) return toast.error('Username must be at least 3 characters');
        await signup({ username: form.username, email: form.email, password: form.password, displayName: form.displayName || form.username });
        toast.success('Account created! Let\'s go 🚀');
      }
      router.push('/chats');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  if (isLoading) return (
    <div className="min-h-screen bg-max-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-max-bg bg-gradient-mesh flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-max-card border border-max-border rounded-2xl flex items-center justify-center mx-auto mb-4 neon-border">
          <span className="text-2xl font-bold text-max-cyan font-display neon-glow">M</span>
        </div>
        <h1 className="text-2xl font-bold text-max-text font-display neon-glow tracking-tight">MAX Connectivity</h1>
        <p className="text-max-muted text-sm mt-1">Chat that actually means something</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm max-card p-6 animate-slide-up">
        {/* Tabs */}
        <div className="flex bg-max-surface rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'login' ? 'bg-max-cyan text-max-bg' : 'text-max-muted hover:text-max-text'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'signup' ? 'bg-max-cyan text-max-bg' : 'text-max-muted hover:text-max-text'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs text-max-muted mb-1 font-medium">Username</label>
                <input
                  type="text"
                  placeholder="cooluser123"
                  value={form.username}
                  onChange={set('username')}
                  className="max-input"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-max-muted mt-1">Letters, numbers, underscores only</p>
              </div>
              <div>
                <label className="block text-xs text-max-muted mb-1 font-medium">Display Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={form.displayName}
                  onChange={set('displayName')}
                  className="max-input"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="block text-xs text-max-muted mb-1 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  className="max-input"
                  required
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-xs text-max-muted mb-1 font-medium">Username or Email</label>
              <input
                type="text"
                placeholder="username or email"
                value={form.identifier}
                onChange={set('identifier')}
                className="max-input"
                required
                autoComplete="username"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-max-muted mb-1 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                className="max-input pr-10"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-max-muted hover:text-max-text text-xs"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="max-btn-primary mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-max-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              mode === 'login' ? '⚡ Sign In' : '🚀 Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-max-muted mt-4">
          {mode === 'login' ? "No account? " : "Have an account? "}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-max-cyan hover:underline">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <p className="text-xs text-max-muted mt-6 text-center max-w-xs">
        No feeds. No reels. No ads. Just real conversations. 💬
      </p>
    </div>
  );
}
