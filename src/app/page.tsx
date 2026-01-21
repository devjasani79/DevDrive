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
    <main className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* ---------------- NAVBAR ---------------- */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              GoogleDevDrive
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="py-24 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Your files.
            <span className="block text-primary">Built for developers.</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            GoogleDevDrive is a fast, secure cloud storage platform designed for
            modern developers. Upload, organize, and access your files anywhere.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup" className="flex items-center">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold">Everything you expect from Drive</h2>
            <p className="mt-4 text-muted-foreground">
              Powerful features engineered for performance and security
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Upload, title: "Fast Uploads", desc: "Drag & drop uploads with progress tracking." },
              { icon: Shield, title: "Secure by Default", desc: "Encryption at rest and per-user permissions." },
              { icon: Share2, title: "Smart Sharing", desc: "Control access with precision." },
              { icon: Smartphone, title: "Cross Platform", desc: "Desktop, tablet, and mobile friendly." },
              { icon: Search, title: "Instant Search", desc: "Find files in milliseconds." },
              { icon: Zap, title: "Lightning Fast", desc: "Built on Next.js and Appwrite." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-md">
                <CardHeader>
                  <Icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- BENEFITS ---------------- */}
      <section className="py-20">
        <div className="container mx-auto grid gap-12 lg:grid-cols-2 px-4 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              Why GoogleDevDrive?
            </h2>
            <ul className="space-y-4">
              {[
                "Built for developers",
                "Modern UI & DX",
                "Secure by design",
                "Scales with your needs",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-primary/10 p-10 text-center">
            <Cloud className="h-24 w-24 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">
              Ready to build your drive?
            </h3>
            <Button size="lg" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-bold text-lg">GoogleDevDrive</h3>
            <p className="text-muted-foreground mt-2">
              Secure cloud storage built with modern web technologies.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Product</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>File Upload</li>
              <li>Secure Storage</li>
              <li>Sharing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Account</h4>
            <ul className="space-y-1">
              <li><Link href="/signin">Sign In</Link></li>
              <li><Link href="/signup">Sign Up</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
