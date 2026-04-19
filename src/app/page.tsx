import Link from "next/link";
import {
  Cloud, Shield, Sparkles, FolderOpen, Zap,
  ArrowRight, Upload, Brain, Search, Star,
  CheckCircle2, Github, Twitter
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#060610] text-white overflow-hidden">

      {/* ── Ambient background glows ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-150 h-150 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-100 h-100 rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-125 h-100 rounded-full bg-indigo-900/10 blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-white/6">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">GoogleDevDrive</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/signin" className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl transition-colors hover:bg-white/5">
              Sign in
            </Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-24 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Now with AI file assistant
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Your files,{" "}
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              intelligently
            </span>
            <br />stored.
          </h1>

          <p className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed">
            A personal cloud drive with a built-in AI that actually understands your files —
            not just their names.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-medium transition-all shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signin" className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-white/20 rounded-2xl text-white/70 hover:text-white transition-all hover:bg-white/5 w-full sm:w-auto justify-center">
              Sign in
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-white/35">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              500MB storage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No credit card
            </span>
          </div>
        </div>
      </section>

      {/* ── App preview mockup ── */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-white/8 bg-white/3 backdrop-blur overflow-hidden shadow-2xl shadow-black/50">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-white/2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 bg-white/5 rounded-lg px-3 py-1 text-xs text-white/30">
                googledev-drive.vercel.app/files
              </div>
            </div>
            {/* Fake UI */}
            <div className="p-6 space-y-3 min-h-70">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="h-4 w-24 bg-white/8 rounded-lg" />
                <div className="ml-auto h-8 w-20 bg-indigo-600/30 rounded-xl" />
              </div>
              {[
                { color: "bg-orange-500/20", icon: "text-orange-400", w: "w-36", sub: "w-20" },
                { color: "bg-indigo-500/20", icon: "text-indigo-400", w: "w-48", sub: "w-16" },
                { color: "bg-emerald-500/20", icon: "text-emerald-400", w: "w-32", sub: "w-24" },
                { color: "bg-violet-500/20", icon: "text-violet-400", w: "w-44", sub: "w-20" },
                { color: "bg-blue-500/20", icon: "text-blue-400", w: "w-40", sub: "w-16" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                    <div className={`w-4 h-4 rounded ${f.icon} bg-current opacity-70`} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className={`h-3 ${f.w} bg-white/10 rounded`} />
                    <div className={`h-2 ${f.sub} bg-white/5 rounded`} />
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-white/5" />
                </div>
              ))}
            </div>
            {/* AI chat bubble overlay */}
            <div className="absolute bottom-4 right-4 flex items-end gap-2">
              <div className="bg-[#0d0d1f] border border-indigo-500/20 rounded-2xl rounded-br-sm p-3 max-w-50 shadow-xl">
                <p className="text-xs text-white/80 leading-relaxed">Found 3 PDFs uploaded this week. Your largest is <span className="text-indigo-400 font-medium">report_final.pdf</span> at 4.2MB.</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-cenlex-shrink-0 shadow-lg shadow-indigo-600/30 mb-1">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Not just storage.{" "}
              <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                An intelligent drive.
              </span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Every feature is built around making your files actually useful, not just stored.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Brain,
                color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/20",
                iconColor: "text-indigo-400",
                title: "AI that reads your drive",
                desc: "Ask questions about all your files — across every folder. The AI sees your entire drive structure, not just the current folder.",
              },
              {
                icon: Sparkles,
                color: "from-violet-500/20 to-pink-500/20 border-violet-500/20",
                iconColor: "text-violet-400",
                title: "Analyze any file",
                desc: "Open any image or text file and ask the AI what's inside. Describe an image, summarize a document, explain a CSV.",
              },
              {
                icon: FolderOpen,
                color: "from-orange-500/20 to-amber-500/20 border-orange-500/20",
                iconColor: "text-orange-400",
                title: "Nested folders",
                desc: "Organize files with unlimited nested subfolders. Full breadcrumb navigation so you never get lost.",
              },
              {
                icon: Shield,
                color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/20",
                iconColor: "text-emerald-400",
                title: "Per-user isolation",
                desc: "Your files are strictly isolated. No shared buckets, no accidental exposure. Each user owns their own namespace.",
              },
              {
                icon: Upload,
                color: "from-blue-500/20 to-cyan-500/20 border-blue-500/20",
                iconColor: "text-blue-400",
                title: "Instant uploads",
                desc: "Drag, drop, done. Upload images, videos, documents, and more up to 50MB each.",
              },
              {
                icon: Search,
                color: "from-pink-500/20 to-rose-500/20 border-pink-500/20",
                iconColor: "text-pink-400",
                title: "Instant search",
                desc: "Find any file in milliseconds. Search across names, types, and folders from anywhere in your drive.",
              },
            ].map(({ icon: Icon, color, iconColor, title, desc }) => (
              <div key={title} className={`rounded-2xl border bg-linear-to-br ${color} p-6 space-y-3 hover:-translate-y-0.5 transition-transform`}>
                <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI highlight section ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-indigo-500/20 bg-linear-to-br from-indigo-600/10 via-violet-600/5 to-transparent p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
                <Brain className="w-3.5 h-3.5" />
                Powered by Groq + Llama 3
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                Ask your AI assistant anything about your drive
              </h2>
              <ul className="space-y-3">
                {[
                  "\"Find all my PDFs from last month\"",
                  "\"How much storage am I using on videos?\"",
                  "\"What is this image showing?\"",
                  "\"Summarize the content of this document\"",
                ].map(q => (
                  <li key={q} className="flex items-start gap-3 text-sm text-white/65">
                    <Sparkles className="w-4 h-4 text-indigo-400 mt-lex-shrink-0" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition-all">
                Try it free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Chat demo */}
            <div className="space-y-3">
              {[
                { role: "user", text: "Which folder has the most files?" },
                { role: "ai", text: "Your \"Projects\" folder has 12 files — the most of any folder. It contains mostly documents (8) and images (4), totalling 34MB." },
                { role: "user", text: "What does my profile photo look like?" },
                { role: "ai", text: "Your profile photo shows a person in a blue shirt against a neutral background. The image is 420KB and was uploaded 3 days ago." },
              ].map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-cenlex-shrink-0 ${m.role === "user" ? "bg-indigo-600" : "bg-white/8"}`}>
                    {m.role === "user"
                      ? <span className="text-xs font-bold">U</span>
                      : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    }
                  </div>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/6 border border-white/8 text-white/85 rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Ready to store smarter?
          </h2>
          <p className="text-white/50 text-lg">
            Free forever. No credit card. Just your files, finally organized.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold text-lg transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5">
            Create free account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/6 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium">GoogleDevDrive</span>
            <span className="text-white/25 text-sm ml-2">· Built by Dev Jasani</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/signin" className="hover:text-white/70 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-white/70 transition-colors">Sign up</Link>
            <span>© 2025</span>
          </div>
        </div>
      </footer>

    </main>
  );
}