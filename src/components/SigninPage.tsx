'use client';
import { useState, useEffect } from 'react';
import { loginUser } from '@/client/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Cloud, ArrowRight, Loader2, Sparkles, Shield, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleSignInButton from '@/components/ui/google-signin-button';
import { getOAuthErrorMessage } from '@/lib/auth-utils';
import Link from 'next/link';

const PERKS = [
  { icon: Sparkles, text: 'AI assistant knows every file in your drive' },
  { icon: Shield,   text: 'Per-user isolation — your files stay yours' },
  { icon: Zap,      text: 'Instant search across all folders' },
];

export default function SigninPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const router      = useRouter();
  const params      = useSearchParams();
  const { user, loading: authLoading, refetchUser } = useAuth();

  useEffect(() => { if (!authLoading && user) router.push('/dashboard'); }, [user, authLoading, router]);
  useEffect(() => { const e = params.get('error'); if (e) setError(getOAuthErrorMessage(e)); }, [params]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#060610]">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
    </div>
  );
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await loginUser(email, password);
    if (result.success) { await refetchUser(); router.push('/dashboard'); }
    else { setError(result.error || 'Login failed'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#060610] text-white flex">

      {/* ── Left panel — branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600/10 via-violet-600/5 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Cloud className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">GoogleDevDrive</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight">
              Your files,{' '}
              <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                intelligently
              </span>{' '}
              stored.
            </h2>
            <p className="text-white/50 text-lg leading-relaxed">
              Cloud storage with a built-in AI assistant that actually understands what's in your drive.
            </p>
          </div>
          <div className="space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-white/65 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative glass rounded-2xl p-5 border border-white/8">
          <p className="text-sm text-white/60 italic leading-relaxed">
            "Finally a drive that doesn't just store files — it helps me find and understand them."
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold">D</div>
            <span className="text-xs text-white/40">Dev Jasani, Creator</span>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">GoogleDevDrive</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-white/45 text-sm">Sign in to continue to your drive</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-white/50">Email address</Label>
              <Input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="h-11 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/25"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-white/50">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="h-11 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/25 pr-11"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/20">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><ArrowRight className="w-4 h-4" /> Sign in</>
              }
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <GoogleSignInButton disabled={loading} />

          <p className="text-center text-sm text-white/35">
            No account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}