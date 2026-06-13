import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Briefcase, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="CareerPilot AI" className="h-8 w-8" />
          <span className="font-bold text-xl tracking-tight">CareerPilot AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Button asChild className="rounded-full">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 px-8 md:py-32 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Sparkles className="h-4 w-4" />
            AI-Powered Career Command Center
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
            Take control of your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">job search journey</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop tracking applications in messy spreadsheets. CareerPilot AI gives you the analytics, AI-tailored resumes, and organization you need to land your dream role faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full h-14 px-8 text-base w-full sm:w-auto" asChild>
              <Link href="/sign-up">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 px-8 bg-card border-y border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                  <Briefcase className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Organize Applications</h3>
                <p className="text-muted-foreground leading-relaxed">Track every role, interview, and offer in one unified dashboard designed for speed.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Resume Tailoring</h3>
                <p className="text-muted-foreground leading-relaxed">Match your resume against job descriptions instantly to uncover missing keywords.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Powerful Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">Visualize your success rate and pipeline health to focus your efforts where they matter.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© {new Date().getFullYear()} CareerPilot AI. Built for the modern job seeker.</p>
      </footer>
    </div>
  );
}
