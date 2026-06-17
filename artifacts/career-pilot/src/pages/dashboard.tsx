import { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useGetDashboardStats, useGetMonthlyTrend, useGetRecentActivity } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { format } from "date-fns";
import {
  Briefcase, TrendingUp, Clock, CheckCircle2,
  Brain, AlertTriangle, MessageSquare, Sparkles, Target,
  FileText, Users, Plus, Calendar, Send, Award,
  ArrowUpRight, Zap, Video, Phone, Building2, Activity
} from "lucide-react";
import { useUser } from "@clerk/react";

// ─── Animated counter ───────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
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

// ─── Productivity ring ───────────────────────────────────────────────────────
function ProductivityRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(250,80%,65%)" />
          <stop offset="100%" stopColor="hsl(200,80%,65%)" />
        </linearGradient>
      </defs>
      <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
      <motion.circle
        cx="44" cy="44" r={radius} fill="none"
        stroke="url(#ringGrad)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Mock data ───────────────────────────────────────────────────────────────
const RECENT_APPS = [
  { company: "Google", role: "Software Engineer L4", status: "interview_scheduled", date: "2026-06-10", initial: "G", color: "bg-blue-500" },
  { company: "Amazon", role: "SDE II", status: "oa_received", date: "2026-06-08", initial: "A", color: "bg-amber-500" },
  { company: "Microsoft", role: "SWE II", status: "applied", date: "2026-06-07", initial: "M", color: "bg-cyan-500" },
  { company: "Stripe", role: "Backend Engineer", status: "final_round", date: "2026-06-05", initial: "S", color: "bg-purple-500" },
  { company: "Vercel", role: "Frontend Engineer", status: "offer", date: "2026-06-03", initial: "V", color: "bg-emerald-500" },
  { company: "Atlassian", role: "Software Engineer", status: "applied", date: "2026-06-01", initial: "At", color: "bg-rose-500" },
];

const UPCOMING_INTERVIEWS = [
  { company: "Google", role: "SWE L4", date: "Jun 15", time: "10:00 AM", type: "Technical", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10" },
  { company: "Stripe", role: "Backend Eng", date: "Jun 18", time: "2:30 PM", type: "System Design", icon: Building2, color: "text-purple-400", bg: "bg-purple-400/10" },
  { company: "Amazon", role: "SDE II", date: "Jun 20", time: "11:00 AM", type: "Behavioral", icon: Users, color: "text-amber-400", bg: "bg-amber-400/10" },
];

const AI_INSIGHTS = [
  { icon: TrendingUp, text: "Your interview rate is 14% above average for SWE roles. Keep applying.", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "Positive" },
  { icon: AlertTriangle, text: "Your resume lacks Kubernetes keywords — add them to match 8 more open roles.", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "Action" },
  { icon: MessageSquare, text: "Follow up with Stripe recruiter — it's been 5 days since your last message.", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", label: "Reminder" },
  { icon: Sparkles, text: "You're 6% away from a top-tier ATS score for Staff Engineer roles.", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: "Tip" },
];

const PIPELINE_STAGES = [
  { label: "Wishlist", count: 23, conversion: null, color: "#64748b", accent: "bg-slate-500" },
  { label: "Applied", count: 127, conversion: null, color: "#3b82f6", accent: "bg-blue-500" },
  { label: "OA Received", count: 42, conversion: 33, color: "#8b5cf6", accent: "bg-violet-500" },
  { label: "Interview", count: 18, conversion: 43, color: "#f59e0b", accent: "bg-amber-500" },
  { label: "Final Round", count: 8, conversion: 44, color: "#ec4899", accent: "bg-pink-500" },
  { label: "Offer", count: 5, conversion: 63, color: "#10b981", accent: "bg-emerald-500" },
];
const MAX_PIPELINE = Math.max(...PIPELINE_STAGES.map(s => s.count));

const MOCK_ACTIVITY = [
  { id: 1, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", description: "Received offer from Vercel", sub: "Congratulations! Review the offer details.", time: "2 hours ago" },
  { id: 2, icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10", description: "Interview scheduled with Google", sub: "Technical interview · June 15, 10:00 AM", time: "5 hours ago" },
  { id: 3, icon: FileText, color: "text-primary", bg: "bg-primary/10", description: "ATS score improved to 92%", sub: "Resume optimization — Frontend Engineer", time: "Yesterday" },
  { id: 4, icon: Send, color: "text-cyan-400", bg: "bg-cyan-400/10", description: "Applied to Microsoft SWE II", sub: "Application submitted via LinkedIn", time: "2 days ago" },
  { id: 5, icon: Brain, color: "text-purple-400", bg: "bg-purple-400/10", description: "OA received from Amazon", sub: "Online Assessment — Due Jun 22", time: "3 days ago" },
  { id: 6, icon: Users, color: "text-amber-400", bg: "bg-amber-400/10", description: "Added Stripe recruiter to CRM", sub: "Follow-up reminder set for Jun 19", time: "4 days ago" },
];

const FALLBACK_TRENDS = [
  { month: "January", count: 8 }, { month: "February", count: 14 },
  { month: "March", count: 22 }, { month: "April", count: 19 },
  { month: "May", count: 31 }, { month: "June", count: 33 },
];

const CONVERSION_DATA = [
  { stage: "Apply→OA", rate: 33, fill: "#8b5cf6" },
  { stage: "OA→Interview", rate: 43, fill: "#f59e0b" },
  { stage: "Interview→Final", rate: 44, fill: "#ec4899" },
  { stage: "Final→Offer", rate: 63, fill: "#10b981" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  wishlist:             { label: "Wishlist",     color: "text-slate-400",   bg: "bg-slate-400/10"   },
  applied:              { label: "Applied",      color: "text-blue-400",    bg: "bg-blue-400/10"    },
  oa_received:          { label: "OA Received",  color: "text-violet-400",  bg: "bg-violet-400/10"  },
  interview_scheduled:  { label: "Interview",    color: "text-amber-400",   bg: "bg-amber-400/10"   },
  final_round:          { label: "Final Round",  color: "text-pink-400",    bg: "bg-pink-400/10"    },
  offer:                { label: "Offer ✦",      color: "text-emerald-400", bg: "bg-emerald-400/10" },
  rejected:             { label: "Rejected",     color: "text-red-400",     bg: "bg-red-400/10"     },
};

const chartTooltipStyle = {
  backgroundColor: "rgba(10,10,18,0.95)",
  borderColor: "rgba(255,255,255,0.08)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  fontSize: "12px",
  color: "#fff",
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, target, suffix = "", icon: Icon, color, glow }: {
  label: string; target: number; suffix?: string;
  icon: React.ElementType; color: string; glow: string;
}) {
  const { count, ref } = useAnimatedCounter(target);
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="glass-panel rounded-2xl p-5 flex flex-col gap-3 group relative overflow-hidden cursor-default"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at 80% 120%, ${glow}, transparent 65%)` }} />
      <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className={`text-3xl font-bold tabular-nums tracking-tight ${color}`}>{count}{suffix}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useUser();
  const { data: stats } = useGetDashboardStats();
  const { data: trends } = useGetMonthlyTrend();
  const { data: activity } = useGetRecentActivity();
  const today = format(new Date(), "EEEE, MMMM d");

  const chartData = (trends && trends.length > 0) ? trends : FALLBACK_TRENDS;
  type ActivityItem = typeof MOCK_ACTIVITY[0];
  const activityItems: ActivityItem[] = (activity && activity.length > 0)
    ? activity.slice(0, 6).map((a, i) => {
        const mock = MOCK_ACTIVITY[i % MOCK_ACTIVITY.length];
        return {
          ...mock,
          description: a.description,
          time: format(new Date(a.createdAt), "MMM d, h:mm a"),
        };
      })
    : MOCK_ACTIVITY;

  const kpis = [
    { label: "Applications Sent", target: stats?.totalApplications || 127, suffix: "", icon: Send, color: "text-blue-400", glow: "rgba(59,130,246,0.2)" },
    { label: "Online Assessments", target: 42, suffix: "", icon: FileText, color: "text-violet-400", glow: "rgba(139,92,246,0.2)" },
    { label: "Interviews Scheduled", target: stats?.interviews || 18, suffix: "", icon: Users, color: "text-amber-400", glow: "rgba(245,158,11,0.2)" },
    { label: "Offers Received", target: stats?.offers || 5, suffix: "", icon: Award, color: "text-emerald-400", glow: "rgba(16,185,129,0.2)" },
    { label: "ATS Score", target: 92, suffix: "%", icon: Target, color: "text-primary", glow: "rgba(124,58,237,0.2)" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* ── Top: Welcome + Productivity ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{today}</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.firstName || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your career mission status for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel rounded-2xl px-5 py-3 flex items-center gap-4">
            <div className="relative">
              <ProductivityRing value={87} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">87%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Today&apos;s</p>
              <p className="text-sm font-semibold text-white">Productivity</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +5 from yesterday
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 shadow-[0_0_14px_rgba(124,58,237,0.3)] rounded-xl gap-2 h-9">
              <Link href="/applications/new"><Plus className="w-3.5 h-3.5" />Add App</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-2 h-9">
              <Link href="/resumes/analyze"><Zap className="w-3.5 h-3.5 text-primary" />Analyze</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </motion.div>

      {/* ── Pipeline + AI Insights ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-7 gap-5">
        {/* Pipeline funnel */}
        <motion.div variants={fadeUp} className="lg:col-span-4 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-white">Application Pipeline</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Current stage distribution</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-8 gap-1 text-xs">
              <Link href="/applications">View All <ArrowUpRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const width = Math.max((stage.count / MAX_PIPELINE) * 100, 8);
              return (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring" as const, stiffness: 300, damping: 28 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-24 text-right shrink-0">
                    <span className="text-xs text-muted-foreground">{stage.label}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-7 rounded-lg bg-white/5 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 rounded-lg flex items-center"
                        style={{ background: `linear-gradient(90deg, ${stage.color}88, ${stage.color})` }}
                      />
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-sm font-bold tabular-nums" style={{ color: stage.color }}>{stage.count}</span>
                    </div>
                    <div className="w-16 text-right">
                      {stage.conversion != null ? (
                        <span className="text-xs text-muted-foreground">{stage.conversion}% ↑</span>
                      ) : <span className="text-xs text-muted-foreground/30">—</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Offer rate: <span className="text-emerald-400 font-semibold">3.9%</span></span>
            <span>Avg. interview rate: <span className="text-amber-400 font-semibold">14.2%</span></span>
            <span>Active apps: <span className="text-blue-400 font-semibold">89</span></span>
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={fadeUp} className="lg:col-span-3 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">AI Insights</h2>
              <p className="text-xs text-muted-foreground">Powered by CareerPilot AI</p>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {AI_INSIGHTS.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring" as const, stiffness: 300, damping: 28 }}
                className={`p-3.5 rounded-xl border ${insight.border} ${insight.bg} flex gap-3 group hover:brightness-110 transition-all cursor-default`}
              >
                <div className={`w-7 h-7 rounded-lg ${insight.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <insight.icon className={`w-3.5 h-3.5 ${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white/90 leading-snug">{insight.text}</p>
                  <span className={`text-[10px] font-medium ${insight.color} mt-1 inline-block`}>{insight.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <Button asChild variant="ghost" size="sm" className="w-full mt-4 text-muted-foreground hover:text-white border border-white/5 hover:border-white/10 h-8 text-xs gap-1.5">
            <Link href="/resumes/analyze"><Sparkles className="w-3 h-3 text-primary" />Run Full AI Analysis</Link>
          </Button>
        </motion.div>
      </div>

      {/* ── Recent Applications + Upcoming Interviews ───────────────── */}
      <div className="grid lg:grid-cols-7 gap-5">
        {/* Recent applications */}
        <motion.div variants={fadeUp} className="lg:col-span-4 glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
            <div>
              <h2 className="font-semibold text-white">Recent Applications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your latest 6 submissions</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-8 gap-1 text-xs">
              <Link href="/applications">All Apps <ArrowUpRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          <div className="divide-y divide-white/5">
            {RECENT_APPS.map((app, i) => {
              const status = STATUS_META[app.status] ?? { label: app.status, color: "text-white", bg: "bg-white/10" };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${app.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {app.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{app.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.role}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color} border border-current/20 whitespace-nowrap shrink-0`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 hidden sm:block">
                    {format(new Date(app.date), "MMM d")}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming interviews */}
        <motion.div variants={fadeUp} className="lg:col-span-3 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-white">Upcoming Interviews</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Next 3 scheduled</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-8 gap-1 text-xs">
              <Link href="/interview-prep">Prep <ArrowUpRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {UPCOMING_INTERVIEWS.map((iv, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, type: "spring" as const, stiffness: 300, damping: 28 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${iv.bg} flex items-center justify-center shrink-0`}>
                  <iv.icon className={`w-4.5 h-4.5 ${iv.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{iv.company}</p>
                  <p className="text-xs text-muted-foreground">{iv.role}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${iv.bg} ${iv.color} border border-current/20`}>{iv.type}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-white">{iv.date}</p>
                  <p className="text-[11px] text-muted-foreground">{iv.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <Button asChild size="sm" className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl h-8 text-xs gap-1.5">
              <Link href="/interview-prep"><Video className="w-3.5 h-3.5" />Practice Interview Questions</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ── Analytics Charts ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Monthly trend - area chart */}
        <motion.div variants={fadeUp} className="lg:col-span-3 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-white">Monthly Applications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Applications submitted per month</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">127</p>
              <p className="text-[10px] text-emerald-400">↑ 6% this month</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250,80%,60%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(250,80%,60%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => v.substring(0, 3)} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(250,80%,65%)" strokeWidth={2}
                  fill="url(#areaGrad)" dot={{ fill: "hsl(250,80%,65%)", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "hsl(250,80%,75%)", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Conversion bar chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Conversion Rates</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Stage-by-stage conversion</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONVERSION_DATA} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
                <YAxis type="category" dataKey="stage" stroke="#666" fontSize={9} tickLine={false} axisLine={false} width={72} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Rate"]} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {CONVERSION_DATA.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
            <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-400">3.9%</p>
              <p className="text-[10px] text-muted-foreground">Offer rate</p>
            </div>
            <div className="bg-blue-400/5 border border-blue-400/10 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-blue-400">14.2%</p>
              <p className="text-[10px] text-muted-foreground">Interview rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Activity Timeline ────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-white">Activity Timeline</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Recent actions across your job search</p>
          </div>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/5" />
          <div className="space-y-4">
            {activityItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, type: "spring" as const, stiffness: 300, damping: 28 }}
                className="flex gap-4 group"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} border border-white/5 flex items-center justify-center shrink-0 z-10`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0 flex items-start justify-between gap-4 py-1">
                  <div>
                    <p className="text-sm font-medium text-white/90 leading-snug">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.sub}</p>
                  </div>
                  <span className="text-xs text-muted-foreground/60 whitespace-nowrap shrink-0 mt-0.5">{item.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
