import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  useListResumes, useDeleteResume, getListResumesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText, Plus, Sparkles, Star, Edit, Trash, ExternalLink,
  CheckCircle2, AlertCircle, AlertTriangle, Zap, Shield,
  TrendingUp, Target, BarChart3, Clock, ChevronRight,
  Code2, X, GitBranch, Layers, Eye,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Priority = "high" | "medium" | "low";
type ResumeStatus = "optimized" | "needs_work" | "in_progress";

interface SampleResume {
  id: string;
  name: string;
  category: string;
  lastUpdated: string;
  version: string;
  isDefault: boolean;
  atsScore: number;
  status: ResumeStatus;
  scores: { atsScore: number; keywordMatch: number; recruiterReadability: number; technicalDepth: number };
  strengths: string[];
  weaknesses: string[];
  suggestions: { text: string; priority: Priority }[];
  currentSkills: string[];
  targetSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  atsOptimizations: string[];
  versions: { version: string; date: string; atsScore: number; notes: string }[];
}

// ─── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: "s1", name: "Software Engineer Resume", category: "Engineering",
    lastUpdated: "Jun 12, 2026", version: "2.0", isDefault: true,
    atsScore: 92, status: "optimized",
    scores: { atsScore: 92, keywordMatch: 88, recruiterReadability: 91, technicalDepth: 85 },
    strengths: [
      "Strong TypeScript & React project portfolio",
      "3+ years system design experience documented",
      "Full CI/CD pipeline implementation shown",
      "Open-source contribution history included",
    ],
    weaknesses: [
      "Missing Kubernetes orchestration experience",
      "No AWS certifications listed",
      "Project impact not quantified with metrics",
    ],
    suggestions: [
      { text: "Add Kubernetes & container orchestration to DevOps section", priority: "high" },
      { text: "Quantify project impact — users served, latency improvements", priority: "high" },
      { text: "Include AWS Lambda, ECS, or equivalent cloud experience", priority: "medium" },
      { text: "Use STAR format for behavioral examples in each role", priority: "medium" },
      { text: "Shorten bullet points to 1–2 lines for ATS scannability", priority: "low" },
    ],
    currentSkills: ["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Docker", "Git"],
    targetSkills: ["AWS", "Kubernetes", "Terraform", "GraphQL", "Microservices", "Redis"],
    matchedKeywords: ["React", "TypeScript", "Node.js", "PostgreSQL", "REST API", "Agile", "Git", "CI/CD", "Docker", "JavaScript", "Unit Testing", "System Design"],
    missingKeywords: ["Kubernetes", "Terraform", "GraphQL", "Microservices", "gRPC", "Redis"],
    atsOptimizations: [
      "Write 'continuous integration/deployment' in full before CI/CD abbreviation",
      "Add 'cross-functional collaboration' to leadership bullet points",
      "Spell out all language names in full — TypeScript, not 'TS'",
    ],
    versions: [
      { version: "v1.0", date: "Feb '26", atsScore: 68, notes: "Initial draft" },
      { version: "v1.1", date: "Apr '26", atsScore: 80, notes: "Added projects section" },
      { version: "v2.0", date: "Jun '26", atsScore: 92, notes: "Full keyword optimization" },
    ],
  },
  {
    id: "s2", name: "Full Stack Developer Resume", category: "Engineering",
    lastUpdated: "Jun 8, 2026", version: "1.2", isDefault: false,
    atsScore: 78, status: "needs_work",
    scores: { atsScore: 78, keywordMatch: 71, recruiterReadability: 82, technicalDepth: 75 },
    strengths: [
      "Strong React & Next.js frontend coverage",
      "MongoDB & Express backend experience",
      "Responsive UI/UX design portfolio links",
    ],
    weaknesses: [
      "Missing TypeScript — required by most senior roles",
      "No testing framework experience shown",
      "DevOps & containerization section absent",
    ],
    suggestions: [
      { text: "Add TypeScript prominently to your tech stack section", priority: "high" },
      { text: "Showcase unit & integration testing with Jest or Cypress", priority: "high" },
      { text: "Add Docker containerization to DevOps bullet points", priority: "medium" },
      { text: "Include a CI/CD workflow you configured or contributed to", priority: "medium" },
      { text: "Add frontend performance metrics (Lighthouse scores, load time)", priority: "low" },
    ],
    currentSkills: ["JavaScript", "React", "Next.js", "MongoDB", "Express", "CSS", "HTML"],
    targetSkills: ["TypeScript", "Jest/Testing", "Docker", "Redis", "GraphQL", "Microservices"],
    matchedKeywords: ["React", "JavaScript", "MongoDB", "REST API", "Git", "Next.js", "HTML/CSS", "Node.js"],
    missingKeywords: ["TypeScript", "Docker", "Redis", "Unit Testing", "GraphQL", "Microservices", "CI/CD"],
    atsOptimizations: [
      "Replace 'experienced in' with specific version numbers (React 18, Next.js 14)",
      "Add 'mobile-first' and 'responsive design' as explicit keywords",
      "Specify testing stack: Jest, React Testing Library, Playwright",
    ],
    versions: [
      { version: "v1.0", date: "Jan '26", atsScore: 58, notes: "Basic draft" },
      { version: "v1.1", date: "Mar '26", atsScore: 68, notes: "Added project links" },
      { version: "v1.2", date: "Jun '26", atsScore: 78, notes: "Improved keyword density" },
    ],
  },
  {
    id: "s3", name: "Cybersecurity Analyst Resume", category: "Security",
    lastUpdated: "Jun 5, 2026", version: "1.0", isDefault: false,
    atsScore: 65, status: "in_progress",
    scores: { atsScore: 65, keywordMatch: 58, recruiterReadability: 72, technicalDepth: 60 },
    strengths: [
      "CISSP certification prominently featured",
      "5 years incident response experience",
      "Strong network security & firewall fundamentals",
    ],
    weaknesses: [
      "No cloud security experience (AWS, Azure, GCP)",
      "Missing SIEM platforms (Splunk, QRadar, Sentinel)",
      "Incidents & threats not quantified with numbers",
    ],
    suggestions: [
      { text: "Add AWS Security Hub or Azure Sentinel to your toolset", priority: "high" },
      { text: "Include SIEM platforms: Splunk, QRadar, or Microsoft Sentinel", priority: "high" },
      { text: "Quantify impact: 'Mitigated 200+ security incidents per quarter'", priority: "high" },
      { text: "Add a dedicated SOC (Security Operations Center) section", priority: "medium" },
      { text: "Include Zero Trust architecture and ZTNA keywords throughout", priority: "medium" },
      { text: "Add vulnerability scanners: Nessus, Qualys, or Rapid7", priority: "low" },
    ],
    currentSkills: ["Python", "Firewall Config", "CISSP", "Network Security", "Pen Testing", "OSINT"],
    targetSkills: ["AWS Security", "SIEM / Splunk", "SOC Analysis", "Zero Trust", "Cloud Security", "Vuln Mgmt"],
    matchedKeywords: ["Python", "Network Security", "CISSP", "Penetration Testing", "Firewall", "IDS/IPS", "Risk Assessment"],
    missingKeywords: ["AWS Security", "SIEM", "Splunk", "Zero Trust", "SOC Analysis", "Cloud Security", "ZTNA", "Vuln Mgmt"],
    atsOptimizations: [
      "Add 'threat intelligence' and 'threat hunting' — high-frequency ATS keywords",
      "Include compliance frameworks: SOC 2, ISO 27001, NIST CSF",
      "Spell out 'intrusion detection system' before abbreviating to IDS",
    ],
    versions: [
      { version: "v1.0", date: "Jun '26", atsScore: 65, notes: "Initial resume — in progress" },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, delay = 0) {
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

const STATUS_CONFIG: Record<ResumeStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  optimized:   { label: "Optimized",   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", dot: "bg-emerald-400" },
  needs_work:  { label: "Needs Work",  color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/25",   dot: "bg-amber-400" },
  in_progress: { label: "In Progress", color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/25",    dot: "bg-blue-400" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  high:   { label: "Critical",  color: "text-red-400",   bg: "bg-red-400/10",   border: "border-red-400/25",   dot: "bg-red-400" },
  medium: { label: "Important", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25", dot: "bg-amber-400" },
  low:    { label: "Optional",  color: "text-blue-400",  bg: "bg-blue-400/10",  border: "border-blue-400/25",  dot: "bg-blue-400" },
};

function atsColor(score: number) {
  if (score >= 85) return { text: "text-emerald-400", stroke: "#34d399", glow: "rgba(52,211,153,0.22)" };
  if (score >= 75) return { text: "text-blue-400",    stroke: "#60a5fa", glow: "rgba(96,165,250,0.22)" };
  if (score >= 60) return { text: "text-amber-400",   stroke: "#fbbf24", glow: "rgba(251,191,36,0.22)" };
  return               { text: "text-red-400",     stroke: "#f87171", glow: "rgba(248,113,113,0.22)" };
}

// ─── CircularHealth ────────────────────────────────────────────────────────────
function CircularHealth({ score, label = "Health Score" }: { score: number; label?: string }) {
  const R = 58;
  const circ = 2 * Math.PI * R;
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 200); return () => clearTimeout(t); }, [score]);
  const offset = go ? circ * (1 - score / 100) : circ;
  const { text, stroke, glow } = atsColor(score);
  const count = useCountUp(score, 1200, 250);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ filter: `drop-shadow(0 0 20px ${glow})`, transition: "filter 0.8s" }}>
        <svg width={144} height={144} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="chGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.5" />
              <stop offset="100%" stopColor={stroke} />
            </linearGradient>
          </defs>
          <circle cx={72} cy={72} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={11} />
          <circle cx={72} cy={72} r={R} fill="none" stroke="url(#chGrad)" strokeWidth={11}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-black tabular-nums", text)}>{count}</span>
          <span className={cn("text-xs font-semibold", text)}>%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
}

// ─── ScoreCard ─────────────────────────────────────────────────────────────────
function ScoreCard({ label, value, icon: Icon, color, barColor, delay }: {
  label: string; value: number; icon: React.ElementType;
  color: string; barColor: string; delay: number;
}) {
  const count = useCountUp(value, 1100, delay);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="glass-panel rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color.replace("text-","bg-").replace("-400","-400/15"), "border", color.replace("text-","border-").replace("-400","-400/20"))}>
            <Icon className={cn("w-3.5 h-3.5", color)} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className={cn("text-xl font-black tabular-nums", color)}>{count}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-[1.1s] ease-out", barColor)}
          style={{ width: go ? `${value}%` : "0%", transitionDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}

// ─── SuggestionRow ─────────────────────────────────────────────────────────────
function SuggestionRow({ s, index }: { s: SampleResume["suggestions"][0]; index: number }) {
  const p = PRIORITY_CONFIG[s.priority];
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 * index, type: "spring" as const, stiffness: 280, damping: 26 }}
      className="flex items-start gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-all group"
    >
      <span className={cn("shrink-0 mt-0.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide flex items-center gap-1 whitespace-nowrap", p.bg, p.color, p.border)}>
        <span className={cn("w-1 h-1 rounded-full", p.dot)} />{p.label}
      </span>
      <p className="text-sm text-white/80 leading-snug group-hover:text-white transition-colors flex-1">{s.text}</p>
    </motion.div>
  );
}

// ─── VersionTooltip ────────────────────────────────────────────────────────────
const VersionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-emerald-400 font-bold">{payload[0]?.value}% ATS</p>
      <p className="text-muted-foreground mt-0.5">{payload[0]?.payload?.notes}</p>
    </div>
  );
};

// ─── Library card ──────────────────────────────────────────────────────────────
function LibraryCard({ resume, isSelected, onClick }: {
  resume: SampleResume; isSelected: boolean; onClick: () => void;
}) {
  const sc = STATUS_CONFIG[resume.status];
  const ac = atsColor(resume.atsScore);
  return (
    <button onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition-all duration-200 p-4 group",
        isSelected
          ? "bg-primary/8 border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
          : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/14"
      )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all",
          isSelected ? "bg-primary/15 border-primary/30" : "bg-white/6 border-white/10 group-hover:bg-white/10"
        )}>
          <FileText className={cn("w-4 h-4 transition-colors", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-semibold text-white truncate">{resume.name}</p>
            {resume.isDefault && <Star className="w-3 h-3 fill-primary text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{resume.category} · v{resume.version}</p>
        </div>
        {isSelected && <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1", sc.bg, sc.color, sc.border)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />{sc.label}
        </span>
        <span className={cn("text-sm font-black tabular-nums", ac.text)}>{resume.atsScore}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/6 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${resume.atsScore}%`, background: ac.stroke }} />
      </div>
    </button>
  );
}

// ─── Real resume card (from API) ───────────────────────────────────────────────
function RealResumeCard({ resume, onDelete }: { resume: any; onDelete: () => void }) {
  return (
    <div className="w-full text-left rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/14 transition-all p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg border border-white/10 bg-white/6 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-semibold text-white truncate">{resume.name}</p>
            {resume.isDefault && <Star className="w-3 h-3 fill-primary text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{resume.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button variant="ghost" size="sm" asChild
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-white border border-white/8 hover:border-white/15 rounded-lg flex-1">
          <Link href={`/resumes/${resume.id}`}><Edit className="w-3 h-3 mr-1.5" />Edit</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg">
          <Trash className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Analysis panel ────────────────────────────────────────────────────────────
function AnalysisPanel({ resume }: { resume: SampleResume }) {
  const scoreItems = [
    { label: "ATS Score",            value: resume.scores.atsScore,            icon: Target,      color: "text-emerald-400", barColor: "bg-emerald-400", delay: 200 },
    { label: "Keyword Match",         value: resume.scores.keywordMatch,         icon: BarChart3,   color: "text-blue-400",    barColor: "bg-blue-400",    delay: 320 },
    { label: "Recruiter Readability", value: resume.scores.recruiterReadability, icon: Eye,         color: "text-violet-400",  barColor: "bg-violet-400",  delay: 440 },
    { label: "Technical Depth",       value: resume.scores.technicalDepth,       icon: Code2,       color: "text-amber-400",   barColor: "bg-amber-400",   delay: 560 },
  ];

  const allTargetSkills = resume.targetSkills.map(s => ({
    skill: s,
    has: resume.currentSkills.some(cs => cs.toLowerCase().split(/[\s/]/)[0] === s.toLowerCase().split(/[\s/]/)[0]),
  }));

  return (
    <AnimatePresence mode="wait">
      <motion.div key={resume.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

        {/* Resume header */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">{resume.name}</h2>
                  {resume.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Updated {resume.lastUpdated}</span>
                  <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />v{resume.version}</span>
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{resume.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-1.5 h-9">
                <Link href="/resumes/analyze"><Sparkles className="w-3.5 h-3.5 text-primary" />AI Analyze</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary/90 hover:bg-primary rounded-xl h-9 gap-1.5">
                <Link href="/resumes/new"><Edit className="w-3.5 h-3.5" />Edit</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ATS Score Dashboard */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />ATS Score Dashboard
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {scoreItems.map(item => <ScoreCard key={item.label} {...item} />)}
          </div>
        </div>

        {/* Health + Strengths/Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Circular health */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center gap-4"
            style={{ boxShadow: `0 0 40px ${atsColor(resume.atsScore).glow}` }}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Resume Health</p>
            <CircularHealth score={resume.atsScore} label="Overall Score" />
            <div className={cn("px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5",
              STATUS_CONFIG[resume.status].bg, STATUS_CONFIG[resume.status].color, STATUS_CONFIG[resume.status].border)}>
              <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[resume.status].dot)} />
              {STATUS_CONFIG[resume.status].label}
            </div>
          </div>

          {/* Strengths */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/12 border border-emerald-400/20 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Strengths</p>
                <p className="text-xs text-muted-foreground">{resume.strengths.length} identified</p>
              </div>
            </div>
            <ul className="space-y-2">
              {resume.strengths.map((s, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-2.5 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {s}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-red-400/12 border border-red-400/20 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Weaknesses</p>
                <p className="text-xs text-muted-foreground">{resume.weaknesses.length} to address</p>
              </div>
            </div>
            <ul className="space-y-2">
              {resume.weaknesses.map((w, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="flex items-start gap-2.5 text-sm text-white/80">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  {w}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-violet-400/12 border border-violet-400/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Skill Gap Analysis</p>
              <p className="text-xs text-muted-foreground">Your skills vs. target role requirements</p>
            </div>
            <div className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-red-400/10 text-red-400 border border-red-400/20">
              {allTargetSkills.filter(s => !s.has).length} gaps detected
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Current skills */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Current Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {resume.currentSkills.map(skill => (
                  <motion.span key={skill} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3 inline mr-1.5 -mt-0.5" />{skill}
                  </motion.span>
                ))}
              </div>
            </div>
            {/* Target skills */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Target Role Requirements
              </p>
              <div className="flex flex-wrap gap-2">
                {allTargetSkills.map(({ skill, has }) => (
                  <motion.span key={skill} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border",
                      has
                        ? "bg-emerald-400/8 text-emerald-400 border-emerald-400/20"
                        : "bg-red-400/10 text-red-400 border-red-400/20"
                    )}>
                    {has
                      ? <><CheckCircle2 className="w-3 h-3 inline mr-1.5 -mt-0.5" />{skill}</>
                      : <><X className="w-3 h-3 inline mr-1.5 -mt-0.5" />{skill} <span className="opacity-60 text-[10px] ml-0.5">missing</span></>
                    }
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions + Version History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* AI Suggestions */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-400/12 border border-amber-400/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Suggestions</p>
                <p className="text-xs text-muted-foreground">Prioritized action plan</p>
              </div>
            </div>
            <div className="space-y-2">
              {resume.suggestions.map((s, i) => <SuggestionRow key={i} s={s} index={i} />)}
            </div>
          </div>

          {/* Version History */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-400/12 border border-cyan-400/20 flex items-center justify-center">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Version History</p>
                <p className="text-xs text-muted-foreground">ATS score improvement over time</p>
              </div>
            </div>
            {/* Chart */}
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resume.versions} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="version" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<VersionTooltip />} />
                  <Line type="monotone" dataKey="atsScore" stroke="#818cf8" strokeWidth={2.5}
                    dot={{ fill: "#818cf8", r: 5, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#818cf8", stroke: "#fff", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Version list */}
            <div className="mt-4 space-y-2 border-t border-white/6 pt-4">
              {resume.versions.map((v, i) => (
                <div key={v.version} className="flex items-center gap-3 text-xs">
                  <span className={cn("shrink-0 px-2 py-0.5 rounded-full font-semibold border",
                    i === resume.versions.length - 1
                      ? "bg-primary/12 text-primary border-primary/25"
                      : "bg-white/6 text-muted-foreground border-white/8"
                  )}>{v.version}</span>
                  <span className="text-muted-foreground shrink-0">{v.date}</span>
                  <span className="text-white/60 flex-1 truncate">{v.notes}</span>
                  <span className={cn("font-bold tabular-nums shrink-0", atsColor(v.atsScore).text)}>{v.atsScore}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyword Analysis */}
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-400/12 border border-blue-400/20 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Keyword Analysis</p>
              <p className="text-xs text-muted-foreground">ATS keyword coverage breakdown</p>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{resume.matchedKeywords.length} matched</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{resume.missingKeywords.length} missing</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">Matched Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {resume.matchedKeywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />{kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">Missing Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {resume.missingKeywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">
                    <X className="w-3 h-3 inline mr-1 -mt-0.5" />{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/6 pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />ATS Optimization Tips
            </p>
            <ul className="space-y-2">
              {resume.atsOptimizations.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">{i + 1}.</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ResumesList() {
  const [selectedId, setSelectedId] = useState<string>("s1");
  const queryClient = useQueryClient();

  const { data: realResumes = [], isLoading } = useListResumes();

  const deleteMutation = useDeleteResume({
    mutation: {
      onSuccess: () => {
        toast.success("Resume deleted");
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
      },
      onError: () => toast.error("Failed to delete resume"),
    }
  });

  const selectedResume = SAMPLE_RESUMES.find(r => r.id === selectedId) ?? SAMPLE_RESUMES[0];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} className="pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Resume Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            AI-powered resume optimization — select a resume to view your full analysis.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Button variant="outline" asChild className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-2 h-10">
            <Link href="/resumes/analyze"><Sparkles className="w-4 h-4 text-primary" />AI Analyzer</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 h-10">
            <Link href="/resumes/new"><Plus className="w-4 h-4" />New Resume</Link>
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Left: Resume Library ── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium px-1">
            Resume Library
          </p>

          {/* Real resumes from API */}
          {!isLoading && realResumes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-1">Your Resumes</p>
              {realResumes.map(r => (
                <RealResumeCard key={r.id} resume={r}
                  onDelete={() => deleteMutation.mutate({ id: r.id })} />
              ))}
              <div className="flex items-center gap-2 my-3 px-1">
                <div className="flex-1 h-px bg-white/6" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Sample Analysis</span>
                <div className="flex-1 h-px bg-white/6" />
              </div>
            </div>
          )}

          {/* Demo indicator */}
          {!isLoading && realResumes.length === 0 && (
            <div className="flex items-center gap-2.5 p-3 bg-primary/6 border border-primary/20 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Sample analysis — <Link href="/resumes/new" className="text-primary hover:underline">upload your resume</Link> for real insights</p>
            </div>
          )}

          {/* Sample resumes */}
          <div className="space-y-2">
            {SAMPLE_RESUMES.map(r => (
              <LibraryCard key={r.id} resume={r}
                isSelected={selectedId === r.id}
                onClick={() => setSelectedId(r.id)} />
            ))}
          </div>

          {/* ATS legend */}
          <div className="glass-panel rounded-xl p-4 space-y-2.5 mt-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">ATS Score Guide</p>
            {[
              { label: "Excellent (85–100%)", color: "bg-emerald-400" },
              { label: "Good (75–84%)",       color: "bg-blue-400" },
              { label: "Fair (60–74%)",        color: "bg-amber-400" },
              { label: "Needs Work (<60%)",    color: "bg-red-400" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", color)} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Analysis Panel ── */}
        <div className="flex-1 min-w-0">
          <AnalysisPanel resume={selectedResume} />
        </div>
      </div>
    </motion.div>
  );
}
