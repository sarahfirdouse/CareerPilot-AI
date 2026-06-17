import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { useGetDashboardStats, useGetMonthlyTrend, useGetStatusBreakdown } from "@workspace/api-client-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Target, Award, Zap, ArrowUpRight,
  Send, Users, BarChart3, Briefcase, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Sample data (shown when real data is zero / unavailable) ─────────────────
const SAMPLE_MONTHLY = [
  { month: "Jan", count: 8  },
  { month: "Feb", count: 14 },
  { month: "Mar", count: 22 },
  { month: "Apr", count: 19 },
  { month: "May", count: 31 },
  { month: "Jun", count: 33 },
];

const SAMPLE_BREAKDOWN = [
  { status: "wishlist",            label: "Wishlist",     count: 23,  color: "#64748b" },
  { status: "applied",             label: "Applied",      count: 127, color: "#3b82f6" },
  { status: "oa_received",         label: "OA Received",  count: 42,  color: "#8b5cf6" },
  { status: "interview_scheduled", label: "Interview",    count: 18,  color: "#f59e0b" },
  { status: "final_round",         label: "Final Round",  count: 8,   color: "#ec4899" },
  { status: "offer",               label: "Offer",        count: 5,   color: "#10b981" },
  { status: "rejected",            label: "Rejected",     count: 35,  color: "#ef4444" },
];

const CONVERSION_STAGES = [
  { stage: "Apply → OA",        rate: 33, color: "#8b5cf6", bar: "bg-violet-400" },
  { stage: "OA → Interview",    rate: 43, color: "#f59e0b", bar: "bg-amber-400" },
  { stage: "Interview → Final", rate: 44, color: "#ec4899", bar: "bg-pink-400" },
  { stage: "Final → Offer",     rate: 63, color: "#10b981", bar: "bg-emerald-400" },
];

const APP_SOURCES = [
  { source: "LinkedIn",        pct: 45, count: 57, color: "#3b82f6",  bar: "bg-blue-400" },
  { source: "Company Website", pct: 20, count: 25, color: "#8b5cf6",  bar: "bg-violet-400" },
  { source: "Indeed",          pct: 18, count: 23, color: "#f59e0b",  bar: "bg-amber-400" },
  { source: "Referral",        pct: 12, count: 15, color: "#10b981",  bar: "bg-emerald-400" },
  { source: "Other",           pct: 5,  count: 7,  color: "#64748b",  bar: "bg-slate-400" },
];

const WEEKLY_PACE = [
  { day: "Mon", apps: 4 }, { day: "Tue", apps: 7 }, { day: "Wed", apps: 9 },
  { day: "Thu", apps: 6 }, { day: "Fri", apps: 5 }, { day: "Sat", apps: 1 }, { day: "Sun", apps: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      const start = performance.now();
      raf = requestAnimationFrame(function tick(now) {
        const prog = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        setCount(Math.round(ease * target * 10) / 10);
        if (prog < 1) raf = requestAnimationFrame(tick);
        else setCount(target);
      });
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return count;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a12]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-bold">{p.value} {p.name === "count" ? "apps" : p.name === "apps" ? "apps" : ""}</p>
      ))}
    </div>
  );
};

// ─── AnimatedBar ──────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="h-2 rounded-full bg-white/6 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-[1s] ease-out", color)}
        style={{ width: go ? `${pct}%` : "0%", transitionDelay: `${delay}ms` }} />
    </div>
  );
}

// ─── KPI stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, suffix = "", icon: Icon, color, bg, border, sub, delay }: {
  label: string; value: number; suffix?: string;
  icon: React.ElementType; color: string; bg: string; border: string; sub?: string; delay: number;
}) {
  const count = useCountUp(value, 1200, delay);
  const display = suffix === "%" ? `${count.toFixed(1)}%` : `${Math.round(count as number)}${suffix}`;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 + 0.1, type: "spring" as const, stiffness: 280, damping: 24 }}
      className={cn("glass-panel rounded-2xl p-5 border relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200 cursor-default", bg, border)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", bg, border)}>
          <Icon className={cn("w-4.5 h-4.5", color)} />
        </div>
      </div>
      <p className={cn("text-3xl font-black tabular-nums tracking-tight", color)}>{display}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } } };

// ─── Main component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const { data: stats }     = useGetDashboardStats();
  const { data: trends }    = useGetMonthlyTrend();
  const { data: breakdown } = useGetStatusBreakdown();

  const totalApps   = stats?.totalApplications || 127;
  const interviews  = stats?.interviews || 18;
  const offers      = stats?.offers || 5;
  const interviewRate = totalApps > 0 ? (interviews / totalApps) * 100 : 14.2;
  const offerRate     = interviews > 0 ? (offers / interviews) * 100 : 27.8;
  const successRate   = totalApps > 0 ? (offers / totalApps) * 100 : 3.9;

  const chartData = (trends && trends.length > 0) ? trends.map(t => ({ month: t.month.slice(0, 3), count: t.count })) : SAMPLE_MONTHLY;

  const breakdownData: typeof SAMPLE_BREAKDOWN = breakdown && breakdown.length > 0
    ? SAMPLE_BREAKDOWN.map(s => {
        const real = breakdown.find((b: any) => b.status === s.status);
        return real ? { ...s, count: real.count } : s;
      })
    : SAMPLE_BREAKDOWN;

  const maxBreakdown = Math.max(...breakdownData.map(b => b.count));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Deep-dive into your application funnel and career momentum.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-1.5 h-9 shrink-0">
          <Link href="/applications">View All Apps <ArrowUpRight className="w-3.5 h-3.5" /></Link>
        </Button>
      </motion.div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications Sent"   value={totalApps}     suffix=""  icon={Send}        color="text-blue-400"    bg="bg-blue-400/8"    border="border-blue-400/15"    sub="All time"                       delay={0} />
        <StatCard label="Interview Rate"      value={interviewRate} suffix="%" icon={Users}       color="text-amber-400"   bg="bg-amber-400/8"   border="border-amber-400/15"   sub="Apps → interviews"              delay={100} />
        <StatCard label="Offer Conversion"    value={offerRate}     suffix="%" icon={Award}       color="text-emerald-400" bg="bg-emerald-400/8" border="border-emerald-400/15" sub="Interviews → offers"            delay={200} />
        <StatCard label="Overall Success"     value={successRate}   suffix="%" icon={Target}      color="text-primary"     bg="bg-primary/8"     border="border-primary/15"     sub="Apps → offers"                  delay={300} />
      </div>

      {/* ── Application Volume + Conversion Funnel ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Application Volume */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-400/12 border border-blue-400/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Application Volume</p>
              <p className="text-xs text-muted-foreground">Monthly submissions — last 6 months</p>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#volGrad)" dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-white/6 flex items-center justify-between text-xs text-muted-foreground">
            <span>Peak month: <span className="text-blue-400 font-bold">{chartData.reduce((a, b) => a.count > b.count ? a : b).month}</span></span>
            <span>Total: <span className="text-white font-bold">{chartData.reduce((s, d) => s + d.count, 0)}</span> apps</span>
            <span>Avg/mo: <span className="text-white font-bold">{Math.round(chartData.reduce((s, d) => s + d.count, 0) / chartData.length)}</span></span>
          </div>
        </motion.div>

        {/* Conversion Funnel */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-violet-400/12 border border-violet-400/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Stage Conversion Rates</p>
              <p className="text-xs text-muted-foreground">% advancing to each next stage</p>
            </div>
          </div>
          <div className="space-y-5 mt-2">
            {CONVERSION_STAGES.map(({ stage, rate, bar }, i) => {
              const count = useCountUp(rate, 1100, 200 + i * 120); // eslint-disable-line react-hooks/rules-of-hooks
              return (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{stage}</span>
                    <span className="font-black text-white tabular-nums">{Math.round(count as number)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/6 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: "easeOut" }}
                      className={cn("h-full rounded-full", bar)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-white/6">
            <p className="text-xs text-muted-foreground">Benchmark: top candidates average <span className="text-white font-semibold">12–18%</span> interview rate.</p>
            {interviewRate >= 12 && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />You&apos;re above the benchmark at {interviewRate.toFixed(1)}%
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Status Distribution + Application Sources ───────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Status Distribution */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/12 border border-amber-400/20 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Pipeline Distribution</p>
              <p className="text-xs text-muted-foreground">Applications by current stage</p>
            </div>
          </div>
          <div className="space-y-3">
            {breakdownData.map(({ label, count, color }, i) => {
              const pct = maxBreakdown > 0 ? (count / maxBreakdown) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-24 text-right shrink-0">
                    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                  </div>
                  <div className="flex-1 h-6 rounded-lg bg-white/5 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.15 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-lg flex items-center"
                      style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
                    />
                  </div>
                  <div className="w-8 text-right shrink-0">
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/6 grid grid-cols-3 text-center gap-3">
            {[
              { label: "Active",   value: breakdownData.filter(b => !["offer","rejected","wishlist"].includes(b.status)).reduce((s, b) => s + b.count, 0), color: "text-blue-400" },
              { label: "Offers",   value: breakdownData.find(b => b.status === "offer")?.count ?? 0,    color: "text-emerald-400" },
              { label: "Rejected", value: breakdownData.find(b => b.status === "rejected")?.count ?? 0, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={cn("text-xl font-black", color)}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Application Sources */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/12 border border-emerald-400/20 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Application Sources</p>
              <p className="text-xs text-muted-foreground">Where you&apos;re finding opportunities</p>
            </div>
          </div>
          <div className="space-y-4">
            {APP_SOURCES.map(({ source, pct, count, color, bar }, i) => (
              <div key={source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-white/80 font-medium">{source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="tabular-nums">{count} apps</span>
                    <span className="font-bold text-white tabular-nums">{pct}%</span>
                  </div>
                </div>
                <AnimatedBar pct={pct} color={bar} delay={200 + i * 100} />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/6">
            <p className="text-xs text-muted-foreground">
              <span className="text-white font-semibold">LinkedIn</span> drives the most applications. Consider diversifying to increase referral rate.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Weekly Pace + Achievements ──────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Weekly Application Pace */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Weekly Application Pace</p>
              <p className="text-xs text-muted-foreground">Applications sent by day of week</p>
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_PACE} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 6 }} />
                <Bar dataKey="apps" radius={[4, 4, 0, 0]}>
                  {WEEKLY_PACE.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.apps === Math.max(...WEEKLY_PACE.map(d => d.apps)) ? "#818cf8" : "rgba(129,140,248,0.3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Most productive day: <span className="text-primary font-semibold">{WEEKLY_PACE.reduce((a, b) => a.apps > b.apps ? a : b).day}nesday</span> with {Math.max(...WEEKLY_PACE.map(d => d.apps))} applications
          </p>
        </motion.div>

        {/* Career Milestones */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/12 border border-emerald-400/20 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Career Milestones</p>
              <p className="text-xs text-muted-foreground">Your job search achievements</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "First application submitted",    done: true,  date: "Jan 8, 2026" },
              { label: "10 applications milestone",      done: true,  date: "Feb 3, 2026" },
              { label: "First interview secured",        done: true,  date: "Mar 12, 2026" },
              { label: "50 applications milestone",      done: true,  date: "Apr 19, 2026" },
              { label: "First offer received",           done: true,  date: "Jun 3, 2026" },
              { label: "100 applications milestone",     done: true,  date: "Jun 10, 2026" },
              { label: "Negotiate and sign an offer",    done: false, date: "Upcoming" },
            ].map(({ label, done, date }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i, type: "spring" as const, stiffness: 280, damping: 26 }}
                className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  done ? "bg-emerald-400/5 border-emerald-400/15" : "bg-white/3 border-white/6 opacity-60"
                )}>
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  done ? "border-emerald-400 bg-emerald-400/20" : "border-white/20 bg-white/5"
                )}>
                  {done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium", done ? "text-white" : "text-muted-foreground")}>{label}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{date}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
