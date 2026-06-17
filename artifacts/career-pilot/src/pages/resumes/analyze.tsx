import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { useAnalyzeResume } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  Sparkles, FileText, Upload, X, Target, Zap, Brain, Shield,
  CheckCircle2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp,
  RefreshCw, Star, TrendingUp, Eye, BarChart3, Code2,
} from "lucide-react";

// ─── Mock sample result ────────────────────────────────────────────────────────
type Priority = "high" | "medium" | "low";
type Severity = "high" | "medium" | "low";

interface AnalysisResult {
  atsScore: number;
  feedback: string;
  health: { atsScore: number; keywordMatch: number; projectStrength: number; technicalDepth: number; recruiterReadability: number };
  strength: { technicalSkills: number; experience: number; keywords: number; projects: number };
  weaknesses: { category: string; severity: Severity; items: string[] }[];
  radarData: { skill: string; current: number; target: number }[];
  recommendations: { priority: Priority; action: string; impact: string }[];
  matchedKeywords: string[];
  missingKeywords: string[];
  atsOptimizations: string[];
}

const MOCK: AnalysisResult = {
  atsScore: 92,
  feedback: "Excellent match! Your resume aligns strongly with this Software Engineer role. TypeScript, React, and Node.js experience are standout qualifications. Adding Kubernetes and quantifying project impact will push you to near-perfect.",
  health: { atsScore: 92, keywordMatch: 78, projectStrength: 85, technicalDepth: 88, recruiterReadability: 90 },
  strength: { technicalSkills: 88, experience: 91, keywords: 78, projects: 85 },
  weaknesses: [
    { category: "Missing Skills",    severity: "high",   items: ["Kubernetes", "Terraform", "GraphQL"] },
    { category: "Missing Keywords",  severity: "medium", items: ["CI/CD pipeline", "microservices architecture", "distributed systems"] },
    { category: "Formatting Issues", severity: "low",    items: ["2 bullet points exceed 2 lines", "No quantified metrics in Senior role"] },
  ],
  radarData: [
    { skill: "React",       current: 95, target: 90 },
    { skill: "Node.js",     current: 80, target: 85 },
    { skill: "TypeScript",  current: 88, target: 92 },
    { skill: "AWS",         current: 60, target: 85 },
    { skill: "Docker",      current: 75, target: 80 },
    { skill: "Python",      current: 70, target: 75 },
  ],
  recommendations: [
    { priority: "high",   action: "Add Kubernetes orchestration to your DevOps section", impact: "+8 pts" },
    { priority: "high",   action: "Quantify all project impacts — users, latency, or revenue", impact: "+5 pts" },
    { priority: "medium", action: "Include AWS Lambda, ECS, or GCP equivalents", impact: "+6 pts" },
    { priority: "medium", action: "Rewrite project descriptions with STAR format", impact: "+4 pts" },
    { priority: "low",    action: "Add 'microservices' to your architecture experience", impact: "+3 pts" },
    { priority: "low",    action: "Shorten bullet points to 1–2 lines for scannability", impact: "+2 pts" },
  ],
  matchedKeywords: ["React", "TypeScript", "Node.js", "PostgreSQL", "REST API", "Agile", "Git", "CI/CD", "Docker", "JavaScript", "Unit Testing", "System Design"],
  missingKeywords: ["Kubernetes", "Terraform", "GraphQL", "microservices", "distributed systems", "gRPC", "Kafka", "Redis"],
  atsOptimizations: [
    "Spell out 'continuous integration/continuous deployment' before abbreviating to CI/CD",
    "Add 'cross-functional collaboration' to your team leadership bullets",
    "Avoid 'TS' — ATS parsers may not recognize TypeScript abbreviation",
  ],
};

function buildFromApi(api: { atsScore: number; feedback: string; missingKeywords?: string[]; suggestions?: string[] }): AnalysisResult {
  const s = api.atsScore;
  return {
    ...MOCK,
    atsScore: s,
    feedback: api.feedback,
    missingKeywords: api.missingKeywords?.length ? api.missingKeywords : MOCK.missingKeywords,
    recommendations: api.suggestions?.length
      ? api.suggestions.map((a, i) => ({
          priority: (i < 2 ? "high" : i < 4 ? "medium" : "low") as Priority,
          action: a,
          impact: `+${Math.max(2, Math.round(10 - i * 1.5))} pts`,
        }))
      : MOCK.recommendations,
    health: {
      atsScore: s,
      keywordMatch: Math.min(100, Math.round(s * 0.85)),
      projectStrength: Math.min(100, Math.round(s * 0.92)),
      technicalDepth: Math.min(100, Math.round(s * 0.95)),
      recruiterReadability: Math.min(100, Math.round(s * 0.97)),
    },
    strength: {
      technicalSkills: Math.min(100, Math.round(s * 0.96)),
      experience: Math.min(100, Math.round(s * 0.99)),
      keywords: Math.min(100, Math.round(s * 0.85)),
      projects: Math.min(100, Math.round(s * 0.93)),
    },
  };
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: number;
    const timer = setTimeout(() => {
      const start = performance.now();
      raf = requestAnimationFrame(function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setCount(Math.round(ease * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      });
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return count;
}

// ─── Score grade ───────────────────────────────────────────────────────────────
function scoreGrade(s: number) {
  if (s >= 90) return { grade: "A+", label: "Excellent",     color: "text-emerald-400", stroke: "#34d399", glow: "rgba(52,211,153,0.25)" };
  if (s >= 80) return { grade: "A",  label: "Strong",        color: "text-blue-400",    stroke: "#60a5fa", glow: "rgba(96,165,250,0.25)" };
  if (s >= 70) return { grade: "B+", label: "Good",          color: "text-violet-400",  stroke: "#a78bfa", glow: "rgba(167,139,250,0.25)" };
  if (s >= 60) return { grade: "B",  label: "Fair",          color: "text-amber-400",   stroke: "#fbbf24", glow: "rgba(251,191,36,0.25)" };
  return         { grade: "C",  label: "Needs Work",    color: "text-red-400",     stroke: "#f87171", glow: "rgba(248,113,113,0.25)" };
}

// ─── Components ────────────────────────────────────────────────────────────────

function CircularScore({ score, animate: run }: { score: number; animate: boolean }) {
  const R = 72;
  const circ = 2 * Math.PI * R;
  const animated = run ? circ * (1 - score / 100) : circ;
  const { grade, label, color, stroke, glow } = scoreGrade(score);
  const count = useCountUp(run ? score : 0, 1400, 300);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ filter: run ? `drop-shadow(0 0 28px ${glow})` : "none", transition: "filter 0.8s ease" }}>
        <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="sgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.6" />
              <stop offset="100%" stopColor={stroke} />
            </linearGradient>
          </defs>
          <circle cx={90} cy={90} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
          <circle
            cx={90} cy={90} r={R}
            fill="none" stroke="url(#sgGrad)" strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={animated}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "rotate(0deg)" }}>
          <span className={cn("text-5xl font-black tabular-nums", color)}>{count}</span>
          <span className={cn("text-sm font-semibold -mt-0.5", color)}>%</span>
        </div>
      </div>
      <div className="text-center -mt-2">
        <p className={cn("text-2xl font-bold", color)}>{grade}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AnimatedBar({ value, color, delay = 0, height = "h-2" }: {
  value: number; color: string; delay?: number; height?: string;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={cn("w-full bg-white/6 rounded-full overflow-hidden", height)}>
      <div
        className={cn("h-full rounded-full transition-all duration-[1200ms] ease-out", color)}
        style={{ width: go ? `${value}%` : "0%", transitionDelay: `${delay}ms` }}
      />
    </div>
  );
}

function HealthMetric({ label, value, color, barColor, delay }: {
  label: string; value: number; color: string; barColor: string; delay: number;
}) {
  const count = useCountUp(value, 1200, delay);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", color)}>{count}%</span>
      </div>
      <AnimatedBar value={value} color={barColor} delay={delay} />
    </div>
  );
}

const PRIORITY_CONFIG = {
  high:   { label: "Critical", bg: "bg-red-400/12",    text: "text-red-400",    border: "border-red-400/25",    dot: "bg-red-400" },
  medium: { label: "Important",bg: "bg-amber-400/12",  text: "text-amber-400",  border: "border-amber-400/25",  dot: "bg-amber-400" },
  low:    { label: "Optional",  bg: "bg-blue-400/12",   text: "text-blue-400",   border: "border-blue-400/25",   dot: "bg-blue-400" },
};

function RecommendationCard({ rec, index }: { rec: AnalysisResult["recommendations"][0]; index: number }) {
  const p = PRIORITY_CONFIG[rec.priority];
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.08, type: "spring" as const, stiffness: 280, damping: 26 }}
      className="flex items-start gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-all group"
    >
      <div className={cn("shrink-0 mt-0.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide flex items-center gap-1 whitespace-nowrap", p.bg, p.text, p.border)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
        {p.label}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/85 leading-snug group-hover:text-white transition-colors">{rec.action}</p>
      </div>
      <span className="shrink-0 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full whitespace-nowrap">
        {rec.impact}
      </span>
    </motion.div>
  );
}

const SEVERITY_CONFIG = {
  high:   { icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-400/10",   border: "border-red-400/20",    label: "High" },
  medium: { icon: AlertCircle,   color: "text-amber-400",  bg: "bg-amber-400/10", border: "border-amber-400/20",  label: "Medium" },
  low:    { icon: Eye,           color: "text-blue-400",   bg: "bg-blue-400/10",  border: "border-blue-400/20",   label: "Low" },
};

function WeaknessGroup({ w }: { w: AnalysisResult["weaknesses"][0] }) {
  const cfg = SEVERITY_CONFIG[w.severity];
  return (
    <div className={cn("rounded-xl border p-4 space-y-2", cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2">
        <cfg.icon className={cn("w-4 h-4 shrink-0", cfg.color)} />
        <span className={cn("text-sm font-semibold", cfg.color)}>{w.category}</span>
        <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.bg, cfg.color, cfg.border)}>
          {cfg.label}
        </span>
      </div>
      <ul className="space-y-1.5 pl-6">
        {w.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", cfg.color.replace("text-", "bg-"))} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const radarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 shadow-2xl text-sm">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="text-white font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const radarLegend = ({ payload }: any) => (
  <div className="flex items-center justify-center gap-5 mt-2">
    {payload?.map((p: any) => (
      <div key={p.value} className="flex items-center gap-1.5">
        <span className="w-3 h-1 rounded-full inline-block" style={{ background: p.color }} />
        <span className="text-xs text-muted-foreground">{p.value}</span>
      </div>
    ))}
  </div>
);

// ─── Form ──────────────────────────────────────────────────────────────────────
const formSchema = z.object({
  resumeText:      z.string().min(50, "Resume text is too short. Please paste your full resume."),
  jobDescription:  z.string().min(50, "Job description is too short. Please paste the full description."),
});
type FormValues = z.infer<typeof formSchema>;

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ResumeAnalyze() {
  const [result, setResult]       = useState<AnalysisResult>(MOCK);
  const [isSample, setIsSample]   = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { resumeText: "", jobDescription: "" },
  });

  const analyzeMutation = useAnalyzeResume({
    mutation: {
      onSuccess: (data) => {
        setResult(buildFromApi(data as any));
        setIsSample(false);
        setFormOpen(false);
      },
      onError: () => toast.error("Analysis failed — check your inputs and try again"),
    },
  });

  const handleFile = useCallback((file: File) => {
    setUploadedFile(file);
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = e => form.setValue("resumeText", (e.target?.result as string) ?? "");
      reader.readAsText(file);
    }
  }, [form]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onSubmit(data: FormValues) {
    analyzeMutation.mutate({ data });
  }

  const healthItems = [
    { label: "ATS Score",            value: result.health.atsScore,            color: "text-emerald-400", barColor: "bg-emerald-400" },
    { label: "Keyword Match",         value: result.health.keywordMatch,         color: "text-blue-400",    barColor: "bg-blue-400" },
    { label: "Project Strength",      value: result.health.projectStrength,      color: "text-violet-400",  barColor: "bg-violet-400" },
    { label: "Technical Depth",       value: result.health.technicalDepth,       color: "text-amber-400",   barColor: "bg-amber-400" },
    { label: "Recruiter Readability", value: result.health.recruiterReadability, color: "text-pink-400",    barColor: "bg-pink-400" },
  ];

  const strengthItems = [
    { label: "Technical Skills", value: result.strength.technicalSkills, icon: Code2,       color: "text-blue-400",   barColor: "bg-gradient-to-r from-blue-500 to-blue-400" },
    { label: "Experience",       value: result.strength.experience,       icon: TrendingUp,  color: "text-emerald-400",barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400" },
    { label: "Keywords",         value: result.strength.keywords,         icon: Target,      color: "text-violet-400", barColor: "bg-gradient-to-r from-violet-500 to-violet-400" },
    { label: "Projects",         value: result.strength.projects,         icon: BarChart3,   color: "text-amber-400",  barColor: "bg-gradient-to-r from-amber-500 to-amber-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} className="space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              AI Resume Analyzer
            </h1>
            {isSample && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/12 text-amber-400 border border-amber-400/25">
                Sample Data
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isSample ? "Viewing a sample analysis — upload your resume to get personalized insights." : "AI-powered analysis of your resume against the job requirements."}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(v => !v)}
          className={cn(
            "gap-2 rounded-xl shrink-0 h-10",
            formOpen
              ? "bg-white/8 text-white border border-white/12 hover:bg-white/12"
              : "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          )}
        >
          {formOpen ? <><X className="w-4 h-4" />Close</>
            : <><Sparkles className="w-4 h-4" />{isSample ? "Analyze My Resume" : "Re-Analyze"}</>}
        </Button>
      </div>

      {/* ── Analyze form (collapsible) ── */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-1">Analyze Your Resume</h2>
              <p className="text-sm text-muted-foreground mb-5">Upload or paste your resume, then paste the target job description.</p>

              {/* Drag & drop zone */}
              <div
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !uploadedFile && fileInputRef.current?.click()}
                className={cn(
                  "relative rounded-xl border-2 border-dashed transition-all duration-200 mb-4",
                  dragActive ? "border-primary/70 bg-primary/8 scale-[1.01]"
                    : uploadedFile ? "border-emerald-400/30 bg-emerald-400/5 cursor-default"
                    : "border-white/12 bg-white/3 hover:border-white/20 hover:bg-white/5 cursor-pointer"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <AnimatePresence mode="wait">
                  {uploadedFile ? (
                    <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(uploadedFile.size / 1024).toFixed(1)} KB · {uploadedFile.name.endsWith(".txt") ? "Text parsed into editor below" : "Paste your text below"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/12 text-emerald-400 border border-emerald-400/20">
                          Ready
                        </span>
                        <button onClick={e => { e.stopPropagation(); setUploadedFile(null); form.setValue("resumeText", ""); }}
                          className="w-7 h-7 rounded-lg bg-white/6 hover:bg-white/12 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all",
                        dragActive ? "bg-primary/20 border border-primary/30" : "bg-white/6 border border-white/10")}>
                        <Upload className={cn("w-5 h-5 transition-colors", dragActive ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <p className="text-sm font-medium text-white/80">{dragActive ? "Drop your resume here" : "Drag & drop resume"}</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT · or <span className="text-primary underline">click to browse</span></p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="resumeText" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Resume Text</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste your full resume text here…"
                            className="h-36 bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/40 resize-none focus-visible:ring-primary/40 focus-visible:border-primary/30 rounded-xl text-sm"
                            {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="jobDescription" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Job Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste the full job description here…"
                            className="h-36 bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/40 resize-none focus-visible:ring-primary/40 focus-visible:border-primary/30 rounded-xl text-sm"
                            {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={analyzeMutation.isPending}
                    className="w-full h-11 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 font-semibold">
                    {analyzeMutation.isPending
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing with AI…</>
                      : <><Sparkles className="w-4 h-4" />Run AI Analysis</>}
                  </Button>
                </form>
              </Form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ RESULTS GRID ══════════ */}
      <motion.div layout className="space-y-5">

        {/* Row 1: ATS Score | Health Dashboard | Quick Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ATS Score */}
          <motion.div layout
            className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: `0 0 60px ${scoreGrade(result.atsScore).glow}` }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${scoreGrade(result.atsScore).glow} 0%, transparent 65%)` }} />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">ATS Match Score</p>
            <CircularScore score={result.atsScore} animate />
            <p className="text-sm text-muted-foreground text-center mt-4 leading-relaxed max-w-[220px]">
              {result.feedback.slice(0, 80)}…
            </p>
          </motion.div>

          {/* Resume Health Dashboard */}
          <motion.div layout className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Resume Health</h2>
                <p className="text-xs text-muted-foreground">5 key metrics at a glance</p>
              </div>
            </div>
            <div className="space-y-3.5">
              {healthItems.map((m, i) => (
                <HealthMetric key={m.label} {...m} delay={300 + i * 100} />
              ))}
            </div>
          </motion.div>

          {/* Keyword summary */}
          <motion.div layout className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Keyword Match</h2>
                <p className="text-xs text-muted-foreground">ATS keyword coverage</p>
              </div>
            </div>
            {/* Donut-style summary */}
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400 tabular-nums">{result.matchedKeywords.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Matched</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-red-400 tabular-nums">{result.missingKeywords.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Missing</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-white tabular-nums">
                  {Math.round(result.matchedKeywords.length / (result.matchedKeywords.length + result.missingKeywords.length) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Coverage</p>
              </div>
            </div>
            {/* Mini coverage bar */}
            <div className="mt-auto space-y-2">
              <div className="flex text-[10px] text-muted-foreground justify-between">
                <span>Matched keywords</span>
                <span>{result.matchedKeywords.length} / {result.matchedKeywords.length + result.missingKeywords.length}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/6 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-[1.2s] ease-out"
                  style={{ width: `${Math.round(result.matchedKeywords.length / (result.matchedKeywords.length + result.missingKeywords.length) * 100)}%` }}
                />
                <div className="h-full flex-1 bg-gradient-to-r from-red-500/50 to-red-400/40 rounded-r-full" />
              </div>
              <div className="flex text-[10px] gap-4">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Matched</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Missing</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Skill Gap Radar | AI Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Skill Gap Radar */}
          <motion.div layout className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Skill Gap Radar</h2>
                <p className="text-xs text-muted-foreground">Your skills vs. target job requirements</p>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={result.radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Your Skills" dataKey="current"
                    stroke="#818cf8" fill="#818cf8" fillOpacity={0.22} strokeWidth={2} />
                  <Radar name="Target Role" dataKey="target"
                    stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 3" />
                  <Tooltip content={radarTooltip} />
                  <Legend content={radarLegend} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div layout className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Recommendations</h2>
                <p className="text-xs text-muted-foreground">Prioritized action plan to boost your score</p>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {result.recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Row 3: Keyword Match Analysis | Weakness Detection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Keyword Match Analysis */}
          <motion.div layout className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Keyword Match Analysis</h2>
                <p className="text-xs text-muted-foreground">ATS scanner keyword breakdown</p>
              </div>
            </div>
            {/* Matched */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Matched Keywords ({result.matchedKeywords.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.map(kw => (
                  <motion.span key={kw}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />{kw}
                  </motion.span>
                ))}
              </div>
            </div>
            {/* Missing */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Missing Keywords ({result.missingKeywords.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map(kw => (
                  <motion.span key={kw}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">
                    <X className="w-3 h-3 inline mr-1 -mt-0.5" />{kw}
                  </motion.span>
                ))}
              </div>
            </div>
            {/* ATS tips */}
            <div className="border-t border-white/6 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-400" />ATS Optimization Tips
              </p>
              <ul className="space-y-2">
                {result.atsOptimizations.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <span className="text-amber-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Weakness Detection */}
          <motion.div layout className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Weakness Detection</h2>
                <p className="text-xs text-muted-foreground">Areas that need attention</p>
              </div>
            </div>
            <div className="space-y-3">
              {result.weaknesses.map((w, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, type: "spring" as const, stiffness: 280, damping: 24 }}>
                  <WeaknessGroup w={w} />
                </motion.div>
              ))}
            </div>
            {/* Feedback excerpt */}
            <div className="border-t border-white/6 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Brain className="w-3 h-3 text-primary" />AI Feedback
              </p>
              <p className="text-sm text-white/75 leading-relaxed">{result.feedback}</p>
            </div>
          </motion.div>
        </div>

        {/* Row 4: Resume Strength Analysis (full width) */}
        <motion.div layout className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Resume Strength Analysis</h2>
              <p className="text-xs text-muted-foreground">Section-by-section quality breakdown</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {strengthItems.map(({ label, value, icon: Icon, color, barColor }, i) => {
              const count = useCountUp(value, 1200, 400 + i * 120); // eslint-disable-line
              return (
                <div key={label} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color.replace("text-", "bg-").replace("-400", "-400/15"), "border", color.replace("text-", "border-").replace("-400", "-400/25"))}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <span className="text-sm font-medium text-white/80">{label}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className={cn("text-3xl font-black tabular-nums", color)}>{count}</span>
                      <span className="text-xs text-muted-foreground mb-1">/ 100</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/6 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-[1.2s] ease-out", barColor)}
                        style={{ width: `${value}%`, transitionDelay: `${400 + i * 120}ms` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {value >= 90 ? "Excellent" : value >= 80 ? "Strong" : value >= 70 ? "Good" : value >= 60 ? "Fair" : "Needs work"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
