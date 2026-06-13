import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight, Briefcase, Sparkles, BarChart3,
  Zap, TrendingUp, FileText, Users, CheckCircle2,
  Brain, Clock, Target, Award, ChevronRight,
  LayoutDashboard, Send, MessageSquare, Star
} from "lucide-react";

function useAnimatedCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return { count, ref };
}

function DashboardMockup() {
  const bars = [38, 54, 42, 72, 51, 88, 67];
  const apps = [
    { company: "Stripe", role: "Software Engineer", status: "Interview", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    { company: "Vercel", role: "Frontend Engineer", status: "Offer ✦", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    { company: "Linear", role: "Product Engineer", status: "Applied", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  ];
  return (
    <div className="w-full max-w-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(124,58,237,0.25)] bg-[hsl(230_20%_5%)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/30 font-mono text-center">
          careerpilot.app/dashboard
        </div>
      </div>
      <div className="flex h-[360px]">
        <div className="w-[52px] border-r border-white/5 flex flex-col items-center py-4 gap-4 bg-black/20">
          {[LayoutDashboard, Briefcase, FileText, Brain, Users].map((Icon, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${i === 0 ? "bg-primary/20 text-primary" : "text-white/30 hover:text-white/60"}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white">Career Overview</p>
            <span className="text-[9px] text-white/30">June 2026</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Applied", value: "127", icon: Send, color: "text-primary" },
              { label: "Interviews", value: "18", icon: Users, color: "text-blue-400" },
              { label: "Offers", value: "5", icon: Award, color: "text-emerald-400" },
            ].map((stat, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/5 p-2.5 flex flex-col gap-1.5">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <p className={`text-base font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[9px] text-white/40 mb-2">Applications / Week</p>
            <div className="flex items-end gap-1 h-14">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm overflow-hidden flex items-end" style={{ height: "100%" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.1 * i + 0.5, duration: 0.6, ease: "easeOut" }}
                    className="w-full rounded-sm"
                    style={{ background: i === 5 ? "hsl(250 80% 65%)" : `hsl(250 80% 65% / ${0.3 + i * 0.08})` }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {apps.map((app, i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-white/10 flex items-center justify-center">
                    <Briefcase className="w-2.5 h-2.5 text-white/50" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-white">{app.company}</p>
                    <p className="text-[8px] text-white/40">{app.role}</p>
                  </div>
                </div>
                <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${app.color}`}>{app.status}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 mt-auto">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="w-3 h-3 text-primary" />
              <p className="text-[9px] font-semibold text-primary">AI Insight</p>
            </div>
            <p className="text-[9px] text-white/50 leading-relaxed">Your ATS score improved 12% this week. Add &quot;TypeScript&quot; to your resume to match 8 more roles.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const METRICS = [
  { label: "Applications Sent", value: 127, suffix: "", icon: Send, color: "text-primary", glow: "rgba(124,58,237,0.3)" },
  { label: "Online Assessments", value: 42, suffix: "", icon: FileText, color: "text-blue-400", glow: "rgba(59,130,246,0.3)" },
  { label: "Interviews Scheduled", value: 18, suffix: "", icon: Users, color: "text-purple-400", glow: "rgba(168,85,247,0.3)" },
  { label: "Offers Received", value: 5, suffix: "", icon: Award, color: "text-emerald-400", glow: "rgba(16,185,129,0.3)" },
  { label: "ATS Score", value: 92, suffix: "%", icon: Target, color: "text-amber-400", glow: "rgba(245,158,11,0.3)" },
];

function StatCounter({ label, value, suffix, icon: Icon, color, glow }: typeof METRICS[0]) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
      className="glass-panel rounded-2xl p-6 flex flex-col gap-4 group cursor-default relative overflow-hidden"
      style={{ boxShadow: `0 0 0 0 ${glow}` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 100%, ${glow.replace("0.3", "0.06")}, transparent 70%)` }} />
      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className={`text-4xl font-bold tabular-nums tracking-tight ${color}`}>
          {count}{suffix}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Briefcase, title: "Application Tracker",
    desc: "Track every role with 7 pipeline stages — from Wishlist to Offer. Search, filter, and never lose track of an opportunity.",
    color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20",
  },
  {
    icon: Brain, title: "AI Resume Analyzer",
    desc: "Paste any job description and instantly see your ATS match score, missing keywords, and AI-generated improvement suggestions.",
    color: "text-primary", bg: "bg-primary/10", border: "border-primary/20",
  },
  {
    icon: Sparkles, title: "Cover Letter Generator",
    desc: "Generate tailored cover letters in seconds from your resume and job description. Copy or download in one click.",
    color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20",
  },
  {
    icon: Users, title: "Recruiter CRM",
    desc: "Keep all recruiter contacts organized with follow-up reminders so you never miss a connection that could land you the job.",
    color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20",
  },
  {
    icon: MessageSquare, title: "Interview Prep",
    desc: "Build your answer bank with behavioral, technical, and general questions. Draft STAR-method responses and review before every call.",
    color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20",
  },
  {
    icon: BarChart3, title: "Career Analytics",
    desc: "Visualize monthly trends, conversion rates, and pipeline health. Know exactly where you stand and what to focus on.",
    color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Add Your Applications", desc: "Log roles from any job board in seconds with company, role, status, and notes.", icon: Send },
  { step: "02", title: "Run AI Analysis", desc: "Upload your resume, paste a job description, and get your ATS score with actionable suggestions.", icon: Brain },
  { step: "03", title: "Land the Offer", desc: "Prep for interviews, track follow-ups, and watch your analytics climb as you refine your approach.", icon: Award },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const glowRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !glowRef.current) return;
    mouseX.current = e.clientX - rect.left;
    mouseY.current = e.clientY - rect.top;
    glowRef.current.style.left = `${mouseX.current}px`;
    glowRef.current.style.top = `${mouseY.current}px`;
  };

  return (
    <div
      ref={containerRef}
      className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans overflow-x-hidden selection:bg-primary/30"
      onMouseMove={handleMouseMove}
    >
      <div ref={glowRef} className="pointer-events-none fixed w-[600px] h-[600px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-[0.06] z-0 transition-none"
        style={{ background: "radial-gradient(circle, hsl(250 80% 65%), transparent 70%)" }} />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none z-0">
        <div className="aurora-orb-1 absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(250 80% 60%), transparent 70%)", filter: "blur(80px)" }} />
        <div className="aurora-orb-2 absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(280 80% 60%), transparent 70%)", filter: "blur(80px)" }} />
        <div className="aurora-orb-3 absolute top-[100px] left-1/2 w-[600px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(200 80% 60%), transparent 70%)", filter: "blur(100px)" }} />
      </div>

      <header className="py-5 px-8 flex justify-between items-center border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-background/80">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30 shadow-[0_0_12px_rgba(124,58,237,0.3)]">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CareerPilot</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden sm:block">
            Sign In
          </Link>
          <Button asChild size="sm" className="rounded-full bg-white text-black hover:bg-white/90 font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </motion.div>
      </header>

      <main className="flex-1 relative z-10">
        {/* HERO */}
        <section ref={heroRef} className="relative py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Career Command Center
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] text-white">
                Land your{" "}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">dream role</span>
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-indigo-400 origin-left" />
                </span>
                <br />faster with AI.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Stop tracking applications in messy spreadsheets. CareerPilot is your all-in-one AI-powered career hub — from application tracking to ATS optimization and interview prep.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="rounded-full h-12 px-8 font-semibold bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-all" asChild>
                  <Link href="/sign-up">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full h-12 px-6 border border-white/10 hover:bg-white/5 text-white font-medium" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
                className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {["bg-blue-400", "bg-purple-400", "bg-emerald-400", "bg-amber-400"].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-background flex items-center justify-center text-[9px] font-bold text-white`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-white font-medium">2,400+</span> job seekers using CareerPilot
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" as const, stiffness: 100 }}
              className="relative lg:block"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative">
                  <div className="absolute -inset-4 rounded-3xl opacity-40"
                    style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(250 80% 60% / 0.4), transparent 70%)", filter: "blur(40px)" }} />
                  <DashboardMockup />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 0.4 }}
                className="absolute -bottom-4 -left-6 glass-panel rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl border-white/10">
                <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Offer received!</p>
                  <p className="text-[10px] text-muted-foreground">Vercel · Frontend Engineer</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 0.4 }}
                className="absolute -top-4 -right-4 glass-panel rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl border-white/10">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">ATS Score: 92%</p>
                  <p className="text-[10px] text-muted-foreground">Resume optimized ✦</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CAREER ANALYTICS — ANIMATED COUNTERS */}
        <section className="py-20 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-medium border border-emerald-400/20 mb-4">
                <TrendingUp className="h-3.5 w-3.5" />
                Career Analytics
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Your numbers, beautifully tracked
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Every action logged, every trend visualized — so you always know exactly where you stand.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {METRICS.map((m, i) => (
                <StatCounter key={i} {...m} />
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-20 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
                <Zap className="h-3.5 w-3.5" />
                Everything you need
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Built for serious job seekers</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Six powerful modules designed to work together — from first application to final offer.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: (i % 3) * 0.1, type: "spring" as const, stiffness: 300, damping: 28 }}
                  whileHover={{ y: -6 }}
                  className={`glass-panel rounded-2xl p-7 flex flex-col gap-5 group border hover:${feature.border} transition-all duration-300 cursor-default`}
                >
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Explore feature <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 px-6 md:px-12 border-t border-white/5 bg-black/20">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-400/10 text-blue-400 text-sm font-medium border border-blue-400/20 mb-4">
                <Clock className="h-3.5 w-3.5" />
                How it works
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Up and running in minutes</h2>
            </motion.div>
            <div className="relative">
              <div className="absolute top-10 left-[calc(16.5%+1px)] right-[calc(16.5%+1px)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block" />
              <div className="grid md:grid-cols-3 gap-8">
                {HOW_IT_WORKS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.15, type: "spring" as const, stiffness: 300, damping: 28 }}
                    className="flex flex-col items-center text-center gap-5"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center group-hover:scale-110 transition-transform">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.5)]">
                        {i + 1}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-primary/60 mb-1">{step.step}</p>
                      <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL STRIP */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { quote: "Got 3 interviews in 2 weeks after fixing my resume with the AI analyzer. The ATS score feature is a game changer.", name: "Sarah K.", role: "SWE Intern → Full-time" },
              { quote: "Finally stopped using Google Sheets. Everything in one place and the cover letter generator saves me 30 min per application.", name: "Marcus T.", role: "Product Manager" },
              { quote: "The recruiter CRM kept me on top of 40+ contacts. I got my offer because I followed up at exactly the right time.", name: "Priya M.", role: "UX Designer" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, type: "spring" as const, stiffness: 300, damping: 28 }}
                className="glass-panel rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 md:px-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(250 80% 60%), transparent 70%)", filter: "blur(80px)" }} />
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
            className="relative max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              Ready to take control of your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">career journey?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of job seekers who landed their dream roles with CareerPilot.
            </p>
            <Button size="lg" className="rounded-full h-14 px-10 text-base font-semibold bg-white text-black hover:bg-white/90 shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_70px_rgba(255,255,255,0.3)] transition-all" asChild>
              <Link href="/sign-up">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground/60 mt-4">No credit card required · Free forever</p>
          </motion.div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-white/5 bg-black/40 backdrop-blur-xl z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary ring-1 ring-primary/30">
            <Briefcase className="h-3 w-3" />
          </div>
          <span className="font-semibold text-white">CareerPilot</span>
        </div>
        <p>© {new Date().getFullYear()} CareerPilot AI. Built for the modern job seeker.</p>
      </footer>
    </div>
  );
}
