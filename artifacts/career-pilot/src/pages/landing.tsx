import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Briefcase, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans overflow-hidden selection:bg-primary/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl pointer-events-none" />

      <header className="py-6 px-8 flex justify-between items-center border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CareerPilot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            Sign In
          </Link>
          <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 font-medium">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <section className="py-24 px-8 md:py-40 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            AI-Powered Career Command Center
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] text-white">
            Take control of your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">job search journey</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop tracking applications in messy spreadsheets. CareerPilot gives you the analytics, AI-tailored resumes, and organization you need to land your dream role faster.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full h-14 px-8 text-base font-semibold w-full sm:w-auto bg-white text-black hover:bg-white/90 shadow-[0_0_40px_8px_rgba(255,255,255,0.1)]" asChild>
              <Link href="/sign-up">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </section>

        <section className="py-24 px-8 bg-black/40 border-y border-white/5 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Briefcase, title: "Organize Applications", desc: "Track every role, interview, and offer in one unified dashboard designed for speed and clarity.", color: "text-blue-400", bg: "bg-blue-400/10" },
                { icon: Sparkles, title: "AI Resume Tailoring", desc: "Match your resume against job descriptions instantly to uncover missing keywords and boost ATS scores.", color: "text-purple-400", bg: "bg-purple-400/10" },
                { icon: BarChart3, title: "Powerful Analytics", desc: "Visualize your success rate and pipeline health to focus your efforts exactly where they matter.", color: "text-emerald-400", bg: "bg-emerald-400/10" }
              ].map((feature, i) => (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} key={i} className="flex flex-col p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
                  <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-white/5 bg-black/40 backdrop-blur-xl z-10">
        <p>© {new Date().getFullYear()} CareerPilot AI. Built for the modern job seeker.</p>
      </footer>
    </div>
  );
}