'use client';
import { useState } from 'react';
import { registerUser } from '@/client/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Cloud, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleSignInButton from '@/components/ui/google-signin-button';
import Link from 'next/link';

const STEPS = [
  'Create your free account',
  'Upload your first files',
  'Ask AI anything about them',
];

export default function SignupPage() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const router                    = useRouter();
  const { refetchUser }           = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm)   { setError('Passwords do not match'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    const result = await registerUser(email, password, name);
    if (result.success) { await refetchUser(); router.push('/dashboard'); }
    else { setError(result.error || 'Registration failed'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#060610] text-white flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-violet-600/8 via-indigo-600/5 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Cloud className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">GoogleDevDrive</span>
        </div>

        <div className="relative space-y-10">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight">
              Start storing in{' '}
              <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                30 seconds.
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed">
              Free account, no credit card, 500MB storage — plus an AI assistant from day one.
            </p>
          </div>

          <div className="space-y-5">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <span className="text-white/65">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-sm text-white/35">
            {['Free forever', '500MB storage', 'AI included'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom visual */}
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { bg: 'bg-orange-500/15', border: 'border-orange-500/20', label: 'Folders' },
            { bg: 'bg-indigo-500/15', border: 'border-indigo-500/20', label: 'Documents' },
            { bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', label: 'Images' },
          ].map(({ bg, border, label }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
              <div className="h-8 w-8 rounded-lg bg-white/8 mx-auto mb-2" />
              <p className="text-xs text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-7">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">GoogleDevDrive</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-white/45 text-sm">Free forever — no credit card needed</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-white/50">Full name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Dev Jasani" required autoComplete="name"
                className="h-11 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/25" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-white/50">Email address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="h-11 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/25" />
            </div>

            {[
              { id: 'password', val: password, set: setPassword, show: showPass, toggle: () => setShowPass(p => !p), label: 'Password', ph: '8+ characters' },
              { id: 'confirm',  val: confirm,  set: setConfirm,  show: showConf, toggle: () => setShowConf(p => !p),  label: 'Confirm password', ph: 'Same as above' },
            ].map(f => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id} className="text-sm text-white/50">{f.label}</Label>
                <div className="relative">
                  <Input id={f.id} type={f.show ? 'text' : 'password'}
                    value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} required
                    className="h-11 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/25 pr-11" />
                  <button type="button" onClick={f.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1">
                    {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 mt-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                : <><ArrowRight className="w-4 h-4" /> Create account</>
              }
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <GoogleSignInButton disabled={loading}>Sign up with Google</GoogleSignInButton>

          <p className="text-center text-sm text-white/35">
            Already have an account?{' '}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}