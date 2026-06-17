import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  useListInterviewQuestions, useCreateInterviewQuestion, useUpdateInterviewQuestion,
  useDeleteInterviewQuestion, getListInterviewQuestionsQueryKey,
  InterviewQuestionCategory, InterviewQuestionDifficulty,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, Edit, Trash, BookOpen, ChevronDown, ChevronUp, CheckCircle2, Circle,
  Calendar, Clock, Sparkles, Code2, Layers, Building2, Target, Zap,
  MessageSquare, Star, BarChart3, Users, TrendingUp, Shield, Activity,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type DisplayCategory = "behavioral" | "technical" | "system_design" | "hr" | "company_specific";
type Difficulty = "easy" | "medium" | "hard";
type Priority = "high" | "medium" | "low";

interface SampleQuestion {
  id: string; category: DisplayCategory; company?: string;
  question: string; answer: string; difficulty: Difficulty;
}

// ─── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<DisplayCategory | "all", { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  all:              { label: "All",             icon: BookOpen,  color: "text-white",        bg: "bg-white/6",         border: "border-white/10" },
  behavioral:       { label: "Behavioral",      icon: Users,     color: "text-blue-400",     bg: "bg-blue-400/10",     border: "border-blue-400/20" },
  technical:        { label: "Technical",       icon: Code2,     color: "text-violet-400",   bg: "bg-violet-400/10",   border: "border-violet-400/20" },
  system_design:    { label: "System Design",   icon: Layers,    color: "text-cyan-400",     bg: "bg-cyan-400/10",     border: "border-cyan-400/20" },
  hr:               { label: "HR",              icon: MessageSquare, color: "text-pink-400", bg: "bg-pink-400/10",     border: "border-pink-400/20" },
  company_specific: { label: "Company Specific",icon: Building2, color: "text-amber-400",    bg: "bg-amber-400/10",    border: "border-amber-400/20" },
};
const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string; border: string }> = {
  easy:   { label: "Easy",   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  medium: { label: "Medium", color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  hard:   { label: "Hard",   color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20" },
};
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  high:   { label: "Critical",  color: "text-red-400",   bg: "bg-red-400/10",   border: "border-red-400/20",   dot: "bg-red-400" },
  medium: { label: "Important", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", dot: "bg-amber-400" },
  low:    { label: "Tip",       color: "text-blue-400",  bg: "bg-blue-400/10",  border: "border-blue-400/20",  dot: "bg-blue-400" },
};
const COMPANIES = ["All Companies", "Google", "Amazon", "Microsoft", "Meta", "Stripe", "Atlassian"];
const COMPANY_DOMAINS: Record<string, string> = {
  Google: "google.com", Amazon: "amazon.com", Microsoft: "microsoft.com",
  Meta: "meta.com", Stripe: "stripe.com", Atlassian: "atlassian.com",
};

// ─── Static data ───────────────────────────────────────────────────────────────
const UPCOMING_INTERVIEWS = [
  {
    id: "u1", company: "Google", role: "Software Engineer L4",
    date: "Jun 23, 2026", daysUntil: 6, interviewer: "Sarah Chen",
    type: "Technical + System Design", round: "Round 2 — Technical",
  },
  {
    id: "u2", company: "Stripe", role: "Backend Engineer",
    date: "Jun 28, 2026", daysUntil: 11, interviewer: "James Mitchell",
    type: "System Design + Culture Fit", round: "Round 3 — Final",
  },
];

const CHECKLIST = [
  { text: "Research Google's engineering culture and values",     category: "Research" },
  { text: "Review resume and past projects thoroughly",           category: "Resume" },
  { text: "Practice STAR method with 10+ behavioral examples",    category: "Behavioral" },
  { text: "Study distributed systems & consensus algorithms",     category: "Technical" },
  { text: "Complete 20 LeetCode medium/hard problems",           category: "Coding" },
  { text: "Prepare 5+ thoughtful questions for the interviewer",  category: "Questions" },
  { text: "Mock system design: Design YouTube or Google Maps",    category: "System Design" },
  { text: "Review Google L4 expectations and leveling guide",     category: "Research" },
];

const MOCK_SCORES = [
  { label: "Communication",       score: 82, icon: MessageSquare, color: "text-blue-400",    bar: "bg-blue-400" },
  { label: "Problem Solving",     score: 88, icon: Target,        color: "text-emerald-400", bar: "bg-emerald-400" },
  { label: "Technical Knowledge", score: 79, icon: Code2,         color: "text-violet-400",  bar: "bg-violet-400" },
  { label: "Confidence",          score: 74, icon: Zap,           color: "text-amber-400",   bar: "bg-amber-400" },
];
const OVERALL_SCORE = 81;

const AI_FEEDBACK = [
  { icon: Target,    title: "Improve Answer Structure",    priority: "high" as Priority,   description: "STAR responses lack a clear Result. End each story with a quantified outcome: 'This reduced latency by 40%.' Add the Result before you finish every story." },
  { icon: BarChart3, title: "Add Quantifiable Examples",   priority: "high" as Priority,   description: "Support claims with numbers. Replace 'improved performance' with 'reduced API latency by 40ms — a 25% improvement measured in production'." },
  { icon: Clock,     title: "Be More Concise",             priority: "medium" as Priority, description: "System design answers average 8 minutes. Target 6–7 minutes. Cut setup preamble and dive directly into the core architecture trade-offs." },
  { icon: Code2,     title: "Strengthen Technical Depth",  priority: "medium" as Priority, description: "Proactively state time and space complexity when explaining algorithms. Don't wait to be asked — demonstrate that you always think in complexity." },
  { icon: Zap,       title: "Increase Confidence Signals", priority: "low" as Priority,    description: "Use declarative language: 'I would implement X' instead of 'I think maybe I'd try X.' Own your decisions and walk through your reasoning confidently." },
];

const STUDY_DATA = [
  { day: "Jun 4", hours: 1.5 }, { day: "Jun 5", hours: 0 },
  { day: "Jun 6", hours: 2.0 }, { day: "Jun 7", hours: 1.5 },
  { day: "Jun 8", hours: 2.5 }, { day: "Jun 9", hours: 3.0 },
  { day: "Jun 10", hours: 1.0 }, { day: "Jun 11", hours: 0 },
  { day: "Jun 12", hours: 2.5 }, { day: "Jun 13", hours: 3.5 },
  { day: "Jun 14", hours: 2.0 }, { day: "Jun 15", hours: 2.5 },
  { day: "Jun 16", hours: 1.5 }, { day: "Jun 17", hours: 2.0 },
];

const SAMPLE_QUESTIONS: SampleQuestion[] = [
  // Behavioral
  { id: "b1", category: "behavioral", difficulty: "medium", question: "Tell me about a time you led a team through a difficult technical challenge.",
    answer: "Situation: My team had 3 weeks to migrate a legacy monolith to microservices without downtime.\nTask: I was the tech lead responsible for coordinating 5 engineers and ensuring zero production incidents.\nAction: I decomposed the migration into 8 isolated service boundaries, ran parallel deployments with feature flags, and held daily 15-min syncs to unblock issues.\nResult: We completed the migration 4 days ahead of schedule with zero production incidents. P99 latency improved 35%." },
  { id: "b2", category: "behavioral", difficulty: "medium", question: "Describe a time you made a critical decision with incomplete information.",
    answer: "Situation: Production database was degrading during peak traffic. Root cause unclear.\nTask: Decide within 30 minutes whether to failover or continue debugging.\nAction: I analyzed error patterns (connection pool exhaustion), made the call to failover to the replica despite 2-min user impact.\nResult: Service restored in 4 minutes. Correct diagnosis — primary had a corrupted index. Post-mortem resulted in automated failover triggers." },
  { id: "b3", category: "behavioral", difficulty: "easy", question: "How do you handle disagreements with teammates or your manager?",
    answer: "I lead with curiosity — I ask to understand the other perspective fully before sharing mine. I separate the problem from the person, anchor discussions to data and user impact, and will happily defer if convinced. If still unresolved, I ask to timebox an experiment to test both approaches." },
  { id: "b4", category: "behavioral", difficulty: "hard", question: "Tell me about your most impactful technical failure. What did you learn?",
    answer: "I deployed a cache invalidation change that caused a thundering herd — 100% cache miss for 8 minutes, crashing 3 downstream services. I learned to: (1) always add traffic shadowing before rolling out cache changes, (2) implement exponential backoff at the cache layer, and (3) establish pre-rollout load tests as a team standard." },
  // Technical
  { id: "t1", category: "technical", difficulty: "hard", question: "Implement an LRU Cache with O(1) get and put operations.",
    answer: "Use a doubly-linked list + HashMap. The map stores key → node for O(1) lookup. The list maintains LRU order — most recent at head, least recent at tail.\n\nget(key): O(1) — lookup in map, move node to head, return value.\nput(key, value): O(1) — if exists, update + move to head. If full, remove tail node + map entry, insert new head.\n\nTime: O(1) both ops. Space: O(capacity)." },
  { id: "t2", category: "technical", difficulty: "easy", question: "Explain the difference between optimistic and pessimistic locking in databases.",
    answer: "Pessimistic locking: acquire a lock before reading data, block other transactions until done. Use when conflicts are frequent (e.g., bank transactions).\n\nOptimistic locking: read without locking, include a version field. On update, check version hasn't changed — fail and retry if it has. Use when conflicts are rare (e.g., user profile updates). Optimistic scales better but requires retry logic." },
  { id: "t3", category: "technical", difficulty: "medium", question: "What is the time and space complexity of mergesort, and when would you prefer it over quicksort?",
    answer: "Mergesort: O(n log n) time always (worst/average/best). O(n) space for the merge buffer.\nQuicksort: O(n log n) average, O(n²) worst case, O(log n) space.\n\nPrefer mergesort when: stability matters (preserving equal-element order), sorting linked lists (no random access needed), guaranteed O(n log n) is required, or data doesn't fit in memory (external sort)." },
  { id: "t4", category: "technical", difficulty: "hard", question: "Design a thread-safe singleton with lazy initialization in Java or TypeScript.",
    answer: "TypeScript approach using module-level singleton (modules are singletons by default):\n\n  let instance: MyService | null = null;\n  export function getInstance() {\n    if (!instance) instance = new MyService();\n    return instance;\n  }\n\nFor true multi-threaded (e.g. Java): use double-checked locking with volatile, or prefer enum-based singleton which is thread-safe and handles serialization automatically." },
  // System Design
  { id: "sd1", category: "system_design", difficulty: "hard", question: "Design a URL shortener like bit.ly handling 100M URLs per day.",
    answer: "Core components:\n• API layer (POST /shorten → short URL, GET /:code → redirect)\n• ID generation: Base62-encode a distributed counter (Snowflake ID) → 7-char codes\n• Storage: Cassandra for hot URLs (low latency), S3 for cold archive\n• Cache: Redis with 80/20 rule — top 20% URLs serve 80% traffic\n• CDN: Push popular redirects to edge nodes\n\nScale math: 100M writes/day = ~1.1K writes/s, 10:1 read ratio = 11K reads/s. Redis handles read load easily." },
  { id: "sd2", category: "system_design", difficulty: "hard", question: "Design Twitter's home timeline feed for 500M daily active users.",
    answer: "Fan-out on write (for most users): on tweet, push to followers' feed caches in Redis.\nFan-out on read (for celebrities with 10M+ followers): pull and merge on read.\n\nStorage: Tweets in Cassandra (wide column, time-ordered). Feed cache in Redis sorted sets.\nDelivery: GraphQL API aggregates feed cache + real-time websocket push for new tweets.\n\nKey trade-off: write amplification vs. read latency. Hybrid model based on follower count threshold (~100K)." },
  { id: "sd3", category: "system_design", difficulty: "hard", question: "Design a distributed rate limiter for a global API platform.",
    answer: "Algorithm: Token bucket (smooth bursting) per user/IP.\nStorage: Redis with INCR + TTL for per-window counters. Use Redis Cluster for horizontal scale.\nSliding window: Lua script (atomic) to count requests in last N seconds.\n\nFor global rate limiting: Gossip protocol or centralized Redis cluster with local cache fallback (allow slight over-limiting during partition).\nResponse headers: X-RateLimit-Remaining, X-RateLimit-Reset. Return HTTP 429 with Retry-After." },
  // HR
  { id: "h1", category: "hr", difficulty: "easy", question: "Where do you see yourself in 5 years?",
    answer: "I want to grow into a technical lead or staff engineer role where I'm driving architectural decisions and mentoring a strong team. I'm drawn to companies where I can have meaningful impact on the product while growing my distributed systems expertise. I see this role as a key step — the scale of problems here aligns exactly with where I want to develop." },
  { id: "h2", category: "hr", difficulty: "medium", question: "What motivates you to leave your current role?",
    answer: "I've grown significantly in my current role — I've shipped multiple features end-to-end and leveled up technically. I'm looking for an environment with more scale challenges, a stronger engineering culture, and the opportunity to work on infrastructure that serves tens of millions of users. This role specifically excites me because of [specific team/product]." },
  { id: "h3", category: "hr", difficulty: "easy", question: "What are your greatest strengths and areas for growth?",
    answer: "Strengths: Systems thinking — I naturally see how components interact at scale, which helps me design durable architectures. I'm also a strong communicator and can translate technical trade-offs clearly to non-technical stakeholders.\n\nGrowth area: I sometimes go deep on solutions before validating assumptions. I've been working on this by building lightweight prototypes first and getting early feedback before full implementation." },
  // Company Specific
  { id: "c1", category: "company_specific", company: "Google", difficulty: "medium", question: "What does scalable, maintainable code mean to you at Google-scale?",
    answer: "Scalable means the system can grow 100x in data and users without architectural changes — achieved through stateless services, horizontal scaling, and avoiding shared mutable state. Maintainable means future engineers can understand, test, and modify any component safely — achieved through clear abstractions, comprehensive tests, and documentation. At Google scale, I'd add: embrace eventual consistency where possible and design every API as if it's public." },
  { id: "c2", category: "company_specific", company: "Amazon", difficulty: "medium", question: "Walk me through a time you demonstrated 'Customer Obsession'.",
    answer: "Situation: Our API's P99 latency was 800ms — within SLA but users were complaining in support tickets.\nTask: Investigate without a formal request.\nAction: Traced the root cause to N+1 database queries in the product listing endpoint. Batched queries and added a materialized view.\nResult: P99 dropped to 120ms. Customer support tickets for 'slow loading' dropped 72% the following week. No one asked me to do this — the customer pain was enough." },
  { id: "c3", category: "company_specific", company: "Microsoft", difficulty: "easy", question: "How do you approach building inclusive, accessible software features?",
    answer: "Accessibility is a first-class requirement, not an afterthought. I include WCAG checks in definition-of-done, use semantic HTML and ARIA attributes throughout, and test with screen readers before shipping. I also advocate for keyboard navigability and adequate color contrast ratios. At Microsoft scale, this means thousands of users with disabilities can use the product meaningfully." },
  { id: "c4", category: "company_specific", company: "Meta", difficulty: "hard", question: "How would you balance rapid feature velocity with user privacy at Meta's scale?",
    answer: "Speed and privacy aren't inherently at odds if privacy is designed in early. I'd advocate for: (1) privacy review gates in the feature approval process, (2) data minimization by default — only collect what's needed, (3) differential privacy for analytics aggregations, (4) feature flags that let users opt out of new data uses. The real cost comes from retrofitting privacy — building it in from day one is faster long-term." },
  { id: "c5", category: "company_specific", company: "Stripe", difficulty: "medium", question: "Explain a complex payment infrastructure concept to a non-technical stakeholder.",
    answer: "I use the postal mail analogy for idempotency: 'Imagine you send a payment request but your internet cuts out — you don't know if it was received. If you send again, we might charge twice. Stripe's idempotency keys are like putting a unique stamp on each envelope — if the post office sees the same stamp twice, it only delivers once, no matter how many copies arrive.' Then I tie it back to their business impact: double-charging customers." },
  { id: "c6", category: "company_specific", company: "Atlassian", difficulty: "medium", question: "How do you handle conflict and collaboration in a remote-first distributed team?",
    answer: "I default to async-first: document context and trade-offs in writing so everyone can engage on their schedule. For genuine conflicts, I always move to a video call — tone is lost in text. I separate disagreement about ideas (healthy) from interpersonal friction (needs direct address). I also create explicit decision logs so the team can revisit reasoning months later without relitigating history." },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1100, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      const start = performance.now();
      raf = requestAnimationFrame(function tick(now) {
        const prog = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        setCount(Math.round(ease * target));
        if (prog < 1) raf = requestAnimationFrame(tick);
      });
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return count;
}

// ─── CircularScore ─────────────────────────────────────────────────────────────
function CircularScore({ score }: { score: number }) {
  const R = 62;
  const circ = 2 * Math.PI * R;
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 300); return () => clearTimeout(t); }, [score]);
  const offset = go ? circ * (1 - score / 100) : circ;
  const glow = score >= 80 ? "rgba(52,211,153,0.2)" : score >= 65 ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)";
  const stroke = score >= 80 ? "#34d399" : score >= 65 ? "#fbbf24" : "#f87171";
  const textColor = score >= 80 ? "text-emerald-400" : score >= 65 ? "text-amber-400" : "text-red-400";
  const count = useCountUp(score, 1200, 400);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ filter: `drop-shadow(0 0 22px ${glow})`, transition: "filter 0.8s" }}>
        <svg width={152} height={152} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
              <stop offset="100%" stopColor={stroke} />
            </linearGradient>
          </defs>
          <circle cx={76} cy={76} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={11} />
          <circle cx={76} cy={76} r={R} fill="none" stroke="url(#csGrad)" strokeWidth={11}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={cn("text-4xl font-black tabular-nums", textColor)}>{count}</span>
          <span className={cn("text-xs font-bold", textColor)}>/ 100</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Overall Score</p>
    </div>
  );
}

// ─── ScoreMetricBar ────────────────────────────────────────────────────────────
function ScoreMetricBar({ label, score, icon: Icon, color, bar, delay }: {
  label: string; score: number; icon: React.ElementType; color: string; bar: string; delay: number;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); }, [delay]);
  const count = useCountUp(score, 1100, delay);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-3.5 h-3.5", color)} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className={cn("text-sm font-black tabular-nums", color)}>{count}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/6 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-[1.1s] ease-out", bar)}
          style={{ width: go ? `${score}%` : "0%", transitionDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}

// ─── QuestionCard ──────────────────────────────────────────────────────────────
function QuestionCard({ q, onEdit, onDelete, isReal = false }: {
  q: SampleQuestion; onEdit?: () => void; onDelete?: () => void; isReal?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[q.category as DisplayCategory | "all"] ?? CATEGORY_CONFIG.behavioral;
  const diffCfg = DIFFICULTY_CONFIG[q.difficulty];
  return (
    <motion.div layout className="glass-panel rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
      <button className="w-full text-left p-5" onClick={() => setExpanded(v => !v)}>
        <p className="text-sm font-medium text-white leading-snug">{q.question}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1", catCfg.bg, catCfg.color, catCfg.border)}>
            <catCfg.icon className="w-2.5 h-2.5" />{catCfg.label}
          </span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", diffCfg.bg, diffCfg.color, diffCfg.border)}>
            {diffCfg.label}
          </span>
          {q.company && (
            <span className="text-[10px] text-amber-400/80 flex items-center gap-1 ml-auto">
              <Building2 className="w-3 h-3" />{q.company}
            </span>
          )}
          <span className={cn("text-[10px] text-muted-foreground flex items-center gap-1 ml-auto")}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide" : "View"} Answer
          </span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div key="ans" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-white/6 pt-4">
              <pre className="text-xs text-white/80 leading-relaxed bg-black/20 rounded-xl p-4 border border-white/6 font-mono whitespace-pre-wrap overflow-x-auto">
                {q.answer || "No answer drafted yet."}
              </pre>
              {isReal && (
                <div className="flex justify-end gap-2 mt-3">
                  {onEdit && <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onEdit(); }} className="h-7 text-xs text-muted-foreground hover:text-white border border-white/8 hover:border-white/15 rounded-lg"><Edit className="w-3 h-3 mr-1.5" />Edit</Button>}
                  {onDelete && <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onDelete(); }} className="h-7 text-xs text-red-400 hover:bg-red-400/10 rounded-lg"><Trash className="w-3 h-3 mr-1.5" />Delete</Button>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CompanyLogo ───────────────────────────────────────────────────────────────
function CompanyLogo({ company, size = 8 }: { company: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const domain = COMPANY_DOMAINS[company] ?? `${company.toLowerCase()}.com`;
  if (!failed) return (
    <img src={`https://logo.clearbit.com/${domain}`} alt={company}
      className={cn(`w-${size} h-${size} rounded-lg object-contain bg-white p-0.5`)}
      onError={() => setFailed(true)} />
  );
  return <div className={`w-${size} h-${size} rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/70`}>{company[0]}</div>;
}

const StudyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-primary font-bold">{payload[0]?.value}h practiced</p>
    </div>
  );
};

// ─── Form schema ───────────────────────────────────────────────────────────────
const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().optional(),
  category: z.nativeEnum(InterviewQuestionCategory),
  difficulty: z.nativeEnum(InterviewQuestionDifficulty).optional(),
});
type QuestionFormValues = z.infer<typeof questionSchema>;

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function InterviewPrep() {
  const queryClient = useQueryClient();
  const { data: apiQuestions = [] } = useListInterviewQuestions();

  const [filterCategory, setFilterCategory] = useState<DisplayCategory | "all">("all");
  const [filterCompany, setFilterCompany] = useState("All Companies");
  const [completedChecks, setCompletedChecks] = useState<Set<number>>(new Set([0, 1, 2, 3]));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: "", answer: "", category: InterviewQuestionCategory.behavioral, difficulty: InterviewQuestionDifficulty.medium },
  });

  const createMutation = useCreateInterviewQuestion({ mutation: { onSuccess: () => { toast.success("Question added"); queryClient.invalidateQueries({ queryKey: getListInterviewQuestionsQueryKey() }); setIsDialogOpen(false); }, onError: () => toast.error("Failed to add question") } });
  const updateMutation = useUpdateInterviewQuestion({ mutation: { onSuccess: () => { toast.success("Question updated"); queryClient.invalidateQueries({ queryKey: getListInterviewQuestionsQueryKey() }); setIsDialogOpen(false); }, onError: () => toast.error("Failed to update") } });
  const deleteMutation = useDeleteInterviewQuestion({ mutation: { onSuccess: () => { toast.success("Question removed"); queryClient.invalidateQueries({ queryKey: getListInterviewQuestionsQueryKey() }); setDeleteId(null); }, onError: () => toast.error("Failed to delete") } });

  function onSubmit(data: QuestionFormValues) {
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate({ data });
  }
  function openEdit(q: any) {
    setEditingId(q.id);
    form.reset({ question: q.question, answer: q.answer || "", category: q.category, difficulty: q.difficulty || InterviewQuestionDifficulty.medium });
    setIsDialogOpen(true);
  }
  function openNew() {
    setEditingId(null);
    form.reset({ question: "", answer: "", category: InterviewQuestionCategory.behavioral, difficulty: InterviewQuestionDifficulty.medium });
    setIsDialogOpen(true);
  }
  function toggleCheck(i: number) {
    setCompletedChecks(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  const checkProgress = Math.round((completedChecks.size / CHECKLIST.length) * 100);
  const thisWeekHours = STUDY_DATA.slice(-7).reduce((s, d) => s + d.hours, 0);

  const filteredSamples = SAMPLE_QUESTIONS.filter(q => {
    if (filterCategory !== "all" && q.category !== filterCategory) return false;
    if (filterCategory === "company_specific" && filterCompany !== "All Companies" && q.company !== filterCompany) return false;
    return true;
  });

  const apiAsDisplay: SampleQuestion[] = apiQuestions.filter(q => {
    if (filterCategory === "all") return true;
    if (filterCategory === "system_design" || filterCategory === "hr") return false;
    if (filterCategory === "company_specific") return q.category === "company_specific";
    return q.category === filterCategory;
  }).map(q => ({
    id: `api-${q.id}`, category: q.category as DisplayCategory,
    question: q.question, answer: q.answer ?? "", difficulty: (q.difficulty as Difficulty) ?? "medium",
  }));

  const filterTabs: Array<DisplayCategory | "all"> = ["all", "behavioral", "technical", "system_design", "hr", "company_specific"];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-10 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Interview Prep Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Build confidence, track progress, and master every interview.</p>
        </div>
        <Button onClick={openNew} data-testid="button-add-question"
          className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 h-10 shrink-0">
          <Plus className="w-4 h-4" />Add Question
        </Button>
      </div>

      {/* ── Study Tracker ── */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />Study Tracker
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Hours Practiced",     value: "24.5h", numVal: 24,  icon: Clock,    color: "text-blue-400",    bg: "bg-blue-400/8",    border: "border-blue-400/15",    delay: 0 },
            { label: "Questions Completed",  value: "47",    numVal: 47,  icon: BookOpen, color: "text-violet-400",  bg: "bg-violet-400/8",  border: "border-violet-400/15",  delay: 80 },
            { label: "Mock Interviews",      value: "6",     numVal: 6,   icon: Users,    color: "text-emerald-400", bg: "bg-emerald-400/8", border: "border-emerald-400/15", delay: 160 },
            { label: "Readiness Score",      value: "78%",   numVal: 78,  icon: Target,   color: "text-amber-400",   bg: "bg-amber-400/8",   border: "border-amber-400/15",   delay: 240 },
          ].map(({ label, value, numVal, icon: Icon, color, bg, border, delay }, i) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const count = useCountUp(numVal, 1100, delay);
            return (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: "spring" as const, stiffness: 280, damping: 24 }}
                className={cn("glass-panel rounded-xl p-4 border", bg, border)}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <p className={cn("text-3xl font-black tabular-nums", color)}>
                  {label === "Hours Practiced" ? `${count}h` : label === "Readiness Score" ? `${count}%` : count}
                </p>
                {label === "Readiness Score" && (
                  <div className="mt-2 h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all duration-[1.1s] ease-out" style={{ width: `${count}%`, transitionDelay: "300ms" }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Upcoming Interviews + Prep Checklist ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Upcoming Interviews */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/12 border border-emerald-400/20 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Upcoming Interviews</p>
              <p className="text-xs text-muted-foreground">{UPCOMING_INTERVIEWS.length} scheduled</p>
            </div>
          </div>
          <div className="space-y-3">
            {UPCOMING_INTERVIEWS.map((iv, i) => {
              const urgency = iv.daysUntil <= 5 ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                : iv.daysUntil <= 10 ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
              return (
                <motion.div key={iv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: "spring" as const, stiffness: 280, damping: 24 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-colors">
                  <CompanyLogo company={iv.company} size={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{iv.role}</p>
                        <p className="text-xs text-muted-foreground">{iv.company} · {iv.round}</p>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0", urgency)}>
                        {iv.daysUntil}d
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{iv.date}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{iv.interviewer}</span>
                    </div>
                    <p className="text-[11px] text-primary/80 mt-1.5 font-medium">{iv.type}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Preparation Checklist */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-violet-400/12 border border-violet-400/20 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Preparation Checklist</p>
              <p className="text-xs text-muted-foreground">Google Interview — {completedChecks.size}/{CHECKLIST.length} completed</p>
            </div>
            <div className="ml-auto">
              <span className={cn("text-sm font-black", checkProgress >= 75 ? "text-emerald-400" : checkProgress >= 50 ? "text-amber-400" : "text-red-400")}>{checkProgress}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-white/6 overflow-hidden mb-4">
            <div className="h-full rounded-full bg-violet-400 transition-all duration-500 ease-out" style={{ width: `${checkProgress}%` }} />
          </div>
          <div className="space-y-2">
            {CHECKLIST.map((item, i) => {
              const done = completedChecks.has(i);
              return (
                <button key={i} onClick={() => toggleCheck(i)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors text-left group">
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
                    : <Circle className="w-4 h-4 text-white/25 shrink-0 mt-0.5 group-hover:text-white/40 transition-colors" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm transition-colors leading-snug", done ? "line-through text-muted-foreground" : "text-white/85 group-hover:text-white")}>
                      {item.text}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{item.category}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Question Bank ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Question Bank</p>
            <p className="text-xs text-muted-foreground">{SAMPLE_QUESTIONS.length} sample questions · {apiQuestions.length} custom</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{filteredSamples.length + apiAsDisplay.length} shown</div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-3">
          {filterTabs.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = filterCategory === cat;
            return (
              <button key={cat} onClick={() => { setFilterCategory(cat); setFilterCompany("All Companies"); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                  isActive ? "bg-primary text-white border-primary/40 shadow-[0_0_12px_rgba(124,58,237,0.3)]" : "bg-white/4 text-muted-foreground border-white/8 hover:text-white hover:bg-white/7"
                )}>
                <cfg.icon className="w-3 h-3" />{cfg.label}
              </button>
            );
          })}
        </div>

        {/* Company sub-filter (only for company_specific) */}
        <AnimatePresence>
          {filterCategory === "company_specific" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4">
              <div className="flex gap-2 flex-wrap pt-1">
                {COMPANIES.map(co => (
                  <button key={co} onClick={() => setFilterCompany(co)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium border transition-all",
                      filterCompany === co ? "bg-amber-400/15 text-amber-400 border-amber-400/30" : "bg-white/3 text-muted-foreground border-white/8 hover:text-white"
                    )}>
                    {co !== "All Companies" && <CompanyLogo company={co} size={4} />}
                    {co}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions grid */}
        {apiAsDisplay.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="flex-1 h-px bg-white/6" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Your Questions</span>
              <div className="flex-1 h-px bg-white/6" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {apiAsDisplay.map(q => {
                const realQ = apiQuestions.find(r => `api-${r.id}` === q.id);
                return (
                  <QuestionCard key={q.id} q={q} isReal
                    onEdit={realQ ? () => openEdit(realQ) : undefined}
                    onDelete={realQ ? () => setDeleteId(realQ.id) : undefined} />
                );
              })}
            </div>
          </div>
        )}

        {apiAsDisplay.length > 0 && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Sample Questions</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredSamples.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring" as const, stiffness: 300, damping: 24 }}>
              <QuestionCard q={q} />
            </motion.div>
          ))}
        </div>

        {filteredSamples.length === 0 && apiAsDisplay.length === 0 && (
          <div className="glass-panel rounded-2xl py-14 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-primary/30 mb-4" />
            <p className="text-white/60 font-medium">No questions in this category</p>
            <Button onClick={openNew} className="mt-4 bg-primary hover:bg-primary/90 rounded-xl gap-1.5 h-9 text-sm">
              <Plus className="w-3.5 h-3.5" />Add First Question
            </Button>
          </div>
        )}
      </div>

      {/* ── Mock Scorecard + AI Feedback ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Mock Interview Scorecard */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/12 border border-emerald-400/20 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Mock Interview Scorecard</p>
              <p className="text-xs text-muted-foreground">Session #6 · Jun 13, 2026</p>
            </div>
            <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              Interview Ready
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="shrink-0">
              <CircularScore score={OVERALL_SCORE} />
            </div>
            <div className="flex-1 space-y-4 w-full">
              {MOCK_SCORES.map((m, i) => (
                <ScoreMetricBar key={m.label} label={m.label} score={m.score}
                  icon={m.icon} color={m.color} bar={m.bar} delay={300 + i * 120} />
              ))}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-white/6 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Sessions", value: "6", color: "text-white" },
              { label: "This Week", value: `${thisWeekHours.toFixed(1)}h`, color: "text-blue-400" },
              { label: "Avg Score", value: "79%", color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={cn("text-lg font-black", color)}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Feedback */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Coaching Feedback</p>
              <p className="text-xs text-muted-foreground">Based on last 3 mock sessions</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {AI_FEEDBACK.map(({ icon: Icon, title, priority, description }, i) => {
              const p = PRIORITY_CONFIG[priority];
              return (
                <motion.div key={title} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, type: "spring" as const, stiffness: 280, damping: 26 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-all group">
                  <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", p.bg, p.border)}>
                    <Icon className={cn("w-3.5 h-3.5", p.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-white">{title}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1", p.bg, p.color, p.border)}>
                        <span className={cn("w-1 h-1 rounded-full", p.dot)} />{p.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-white/70 transition-colors">{description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Study Progress Chart ── */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-400/12 border border-blue-400/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Study Progress</p>
              <p className="text-xs text-muted-foreground">Daily practice hours — last 14 days</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-white font-bold">{thisWeekHours.toFixed(1)}h</p>
              <p className="text-muted-foreground">this week</p>
            </div>
            <div className="text-right">
              <p className="text-primary font-bold">{(STUDY_DATA.reduce((s, d) => s + d.hours, 0) / STUDY_DATA.length).toFixed(1)}h</p>
              <p className="text-muted-foreground">daily avg</p>
            </div>
          </div>
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={STUDY_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => v.replace("Jun ", "")} interval={1} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}h`} domain={[0, 4]} />
              <Tooltip content={<StudyTooltip />} />
              <Area type="monotone" dataKey="hours" stroke="#818cf8" strokeWidth={2.5}
                fill="url(#studyGrad)" dot={{ fill: "#818cf8", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#818cf8", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingId ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Draft your answer using the STAR method: Situation, Task, Action, Result.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="question" render={({ field }) => (
                <FormItem><FormLabel className="text-white/80">Question</FormLabel>
                  <FormControl><Input placeholder="Tell me about a time..." className="bg-black/30 border-white/10 text-white" data-testid="input-question" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/80">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                        {Object.values(InterviewQuestionCategory).map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize hover:bg-white/10 focus:bg-white/10">{cat.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/80">Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                        {Object.values(InterviewQuestionDifficulty).map(d => (
                          <SelectItem key={d} value={d} className="capitalize hover:bg-white/10 focus:bg-white/10">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="answer" render={({ field }) => (
                <FormItem><FormLabel className="text-white/80">Your Answer</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Situation: ... Task: ... Action: ... Result: ..."
                      className="min-h-[180px] bg-black/30 border-white/10 text-white font-mono text-sm"
                      data-testid="input-answer" {...field} />
                  </FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white hover:bg-white/5">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-question" className="bg-primary hover:bg-primary/90">
                  {(createMutation.isPending || updateMutation.isPending) && <div className="mr-2 h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Question</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This will permanently delete this question and any answers you&apos;ve drafted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
