import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cloud,
  Shield,
  Share2,
  Smartphone,
  Zap,
  Upload,
  Search,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      
      {/* ================= NAVBAR ================= */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-8 w-8 text-white" />
            <span className="text-xl font-bold tracking-tight">
              GoogleDevDrive
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" className="text-white" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative py-28 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Store your files.
            <span className="block text-primary mt-2">
              Access them anywhere.
            </span>
          </h1>

          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            GoogleDevDrive is a simple, secure cloud storage solution for your
            personal files, photos, documents, and memories.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup" className="flex items-center">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white/30" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================= DIVIDER ================= */}
      <div className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

      {/* ================= FEATURES ================= */}
      <section className="py-24 bg-linear-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything you need in one drive
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Upload, title: "Easy Uploads", desc: "Upload files in seconds with drag & drop support." },
              { icon: Shield, title: "Secure Storage", desc: "Your files are protected with strong access control." },
              { icon: Share2, title: "Simple Sharing", desc: "Share files and folders with full control." },
              { icon: Smartphone, title: "Any Device", desc: "Access your files from phone, tablet, or desktop." },
              { icon: Search, title: "Quick Search", desc: "Find what you need instantly." },
              { icon: Zap, title: "Fast & Reliable", desc: "Smooth performance without clutter." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="bg-black/40 border border-white/10 backdrop-blur"
              >
                <CardHeader>
                  <Icon className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-white/70">
                  {desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DIVIDER ================= */}
      <div className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

      {/* ================= BENEFITS ================= */}
      <section className="py-24">
        <div className="container mx-auto px-4 grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-8">
              Why GoogleDevDrive?
            </h2>

            <ul className="space-y-5">
              {[
                "Personal cloud storage you control",
                "Clean and distraction-free design",
                "Secure access to your files",
                "Works everywhere, anytime",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <span className="text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 p-10 text-center border border-white/10">
            <Cloud className="h-24 w-24 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">
              Your files deserve a better home
            </h3>
            <Button size="lg" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 bg-black/40 py-12">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-bold text-lg">GoogleDevDrive</h3>
            <p className="text-white/60 mt-2 max-w-sm">
              A simple and secure place to store your digital life.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Product</h4>
            <ul className="space-y-1 text-white/60">
              <li>Cloud Storage</li>
              <li>File Sharing</li>
              <li>Secure Access</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Account</h4>
            <ul className="space-y-1 text-white/60">
              <li><Link href="/signin">Sign In</Link></li>
              <li><Link href="/signup">Sign Up</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
