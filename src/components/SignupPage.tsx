'use client';
import { useState } from 'react';
import { registerUser } from '@/client/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Cloud, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GoogleSignInButton from '@/components/ui/google-signin-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirm, setConfirm]             = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const router                            = useRouter();
  const { refetchUser }                   = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    const result = await registerUser(email, password, name);
    if (result.success) {
      await refetchUser();
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center glow-primary">
            <Cloud className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground">Join GoogleDevDrive today — free</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-muted-foreground">Full name</Label>
              <Input
                id="name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Dev Jasani" required
                className="glass border-white/10 bg-transparent focus:border-primary/50 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
              <Input
                id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="glass border-white/10 bg-transparent focus:border-primary/50 rounded-xl"
              />
            </div>

            {[
              { id: 'password', val: password, set: setPassword, show: showPass, toggle: () => setShowPass(p => !p), label: 'Password' },
              { id: 'confirm',  val: confirm,  set: setConfirm,  show: showConfirm, toggle: () => setShowConfirm(p => !p), label: 'Confirm password' },
            ].map(f => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id} className="text-sm text-muted-foreground">{f.label}</Label>
                <div className="relative">
                  <Input
                    id={f.id} type={f.show ? 'text' : 'password'}
                    value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder="••••••••" required
                    className="glass border-white/10 bg-transparent focus:border-primary/50 rounded-xl pr-10"
                  />
                  <button
                    type="button" onClick={f.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}

            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                <><ArrowRight className="mr-2 h-4 w-4" /> Create Account</>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <GoogleSignInButton disabled={loading}>Sign up with Google</GoogleSignInButton>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}