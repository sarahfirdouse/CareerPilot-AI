import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  useListRecruiters, useCreateRecruiter, useUpdateRecruiter, useDeleteRecruiter,
  getListRecruitersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Plus, Mail, Linkedin, Phone, Calendar, Video, Users, Edit, Trash,
  Clock, TrendingUp, Zap, ChevronRight, AlertTriangle, CheckCircle2,
  ExternalLink, Bell, BarChart3, MessageSquare, Star, Target, Activity,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type HealthType = "hot" | "warm" | "cold";
type StatusType = "active" | "follow_up" | "cold";
type InteractionType = "email" | "call" | "linkedin" | "interview" | "video";

interface Interaction { type: InteractionType; date: string; title: string; description: string }
interface SampleRecruiter {
  id: string; name: string; company: string; role: string;
  email: string | null; linkedin: string | null; phone: string | null;
  lastContact: string; followUpDate: string | null; followUpOverdue?: boolean;
  status: StatusType; health: HealthType; responseTime: string;
  totalInteractions: number; notes: string; interactions: Interaction[];
}

// ─── Static config ─────────────────────────────────────────────────────────────
const COMPANY_DOMAINS: Record<string, string> = {
  Google: "google.com", Amazon: "amazon.com", Microsoft: "microsoft.com",
  Stripe: "stripe.com", Vercel: "vercel.com", Atlassian: "atlassian.com", Datadog: "datadoghq.com",
};
const COMPANY_COLORS: Record<string, { bg: string; text: string }> = {
  Google:    { bg: "bg-blue-500/15",   text: "text-blue-300" },
  Amazon:    { bg: "bg-amber-500/15",  text: "text-amber-300" },
  Microsoft: { bg: "bg-cyan-500/15",   text: "text-cyan-300" },
  Stripe:    { bg: "bg-violet-500/15", text: "text-violet-300" },
  Vercel:    { bg: "bg-white/10",      text: "text-white/70" },
  Atlassian: { bg: "bg-blue-600/15",   text: "text-blue-200" },
  Datadog:   { bg: "bg-purple-500/15", text: "text-purple-300" },
};
const HEALTH_CONFIG = {
  hot:  { label: "Hot",  color: "text-emerald-400", bg: "bg-emerald-400/12", border: "border-emerald-400/25", dot: "bg-emerald-400" },
  warm: { label: "Warm", color: "text-blue-400",    bg: "bg-blue-400/12",    border: "border-blue-400/25",    dot: "bg-blue-400" },
  cold: { label: "Cold", color: "text-slate-400",   bg: "bg-slate-400/12",   border: "border-slate-400/25",   dot: "bg-slate-400" },
};
const STATUS_CONFIG = {
  active:    { label: "Active",       color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  follow_up: { label: "Follow Up",    color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  cold:      { label: "Cold",         color: "text-slate-400",   bg: "bg-slate-400/10",   border: "border-slate-400/20" },
};
const INTERACTION_CONFIG: Record<InteractionType, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  email:     { icon: Mail,          label: "Email",        color: "text-blue-400",   bg: "bg-blue-400/12",   border: "border-blue-400/20" },
  call:      { icon: Phone,         label: "Phone Call",   color: "text-emerald-400",bg: "bg-emerald-400/12",border: "border-emerald-400/20" },
  linkedin:  { icon: Linkedin,      label: "LinkedIn",     color: "text-sky-400",    bg: "bg-sky-400/12",    border: "border-sky-400/20" },
  interview: { icon: Calendar,      label: "Interview",    color: "text-violet-400", bg: "bg-violet-400/12", border: "border-violet-400/20" },
  video:     { icon: Video,         label: "Video Call",   color: "text-cyan-400",   bg: "bg-cyan-400/12",   border: "border-cyan-400/20" },
};

// ─── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_RECRUITERS: SampleRecruiter[] = [
  {
    id: "r1", name: "Sarah Chen", company: "Google", role: "Engineering Recruiter",
    email: "s.chen@google.com", linkedin: "https://linkedin.com/in/sarahchen", phone: "+1 (415) 555-0182",
    lastContact: "Jun 14, 2026", followUpDate: "Jun 20, 2026",
    status: "active", health: "hot", responseTime: "~4 hrs", totalInteractions: 4,
    notes: "Wonderful to work with. Enthusiastic about the L4 SWE role. Moving quickly through the pipeline.",
    interactions: [
      { type: "interview", date: "Jun 14, 2026", title: "Interview Prep Call", description: "30-min prep call for L4 SWE technical interview. Discussed expectations, format, and team structure." },
      { type: "email",     date: "Jun 12, 2026", title: "Job Description Received", description: "Received detailed JD for Software Engineer L4 — distributed systems focus on Search team." },
      { type: "call",      date: "Jun 11, 2026", title: "Introductory Screen", description: "20-min introductory screen. Excellent culture fit discussion. Moved to technical prep stage." },
      { type: "linkedin",  date: "Jun 10, 2026", title: "Initial LinkedIn Outreach", description: "Sarah reached out via LinkedIn about the L4 SWE opening on the Search Infrastructure team." },
    ],
  },
  {
    id: "r2", name: "Marcus Johnson", company: "Amazon", role: "Senior Technical Recruiter",
    email: "m.johnson@amazon.com", linkedin: "https://linkedin.com/in/marcusjohnson", phone: null,
    lastContact: "Jun 3, 2026", followUpDate: "Jun 10, 2026", followUpOverdue: true,
    status: "follow_up", health: "warm", responseTime: "~48 hrs", totalInteractions: 3,
    notes: "Decent initial call about SDE II. Follow-up is overdue — need to reach out again before going cold.",
    interactions: [
      { type: "linkedin", date: "Jun 3, 2026",  title: "Follow-up LinkedIn Message", description: "Sent follow-up about Bar Raiser interview scheduling status. Awaiting response." },
      { type: "email",    date: "May 25, 2026", title: "Follow-up Email Sent", description: "Sent follow-up email on application status for the AWS Lambda SDE II role." },
      { type: "email",    date: "May 22, 2026", title: "First Contact", description: "Marcus reached out about SDE II role on the AWS Lambda team — strong match to profile." },
    ],
  },
  {
    id: "r3", name: "Priya Patel", company: "Microsoft", role: "University & Engineering Recruiter",
    email: "priya.patel@microsoft.com", linkedin: "https://linkedin.com/in/priyapatel", phone: "+1 (206) 555-0143",
    lastContact: "Jun 12, 2026", followUpDate: "Jun 22, 2026",
    status: "active", health: "warm", responseTime: "~24 hrs", totalInteractions: 3,
    notes: "Very organized recruiter. Mentioned a specific Azure backend role that fits the target profile perfectly.",
    interactions: [
      { type: "video",    date: "Jun 12, 2026", title: "Virtual Interview", description: "60-min virtual interview covering system design and behavioral questions with the Azure team." },
      { type: "email",    date: "Jun 8, 2026",  title: "Interview Invite", description: "Received interview invitation for Azure Backend Engineer role — all details confirmed." },
      { type: "linkedin", date: "Jun 5, 2026",  title: "LinkedIn Connection", description: "Connected via LinkedIn after Microsoft virtual career fair. Priya followed up immediately." },
    ],
  },
  {
    id: "r4", name: "James Mitchell", company: "Stripe", role: "Head of Engineering Recruiting",
    email: "jmitchell@stripe.com", linkedin: "https://linkedin.com/in/jamesmitchell", phone: "+1 (628) 555-0201",
    lastContact: "Jun 15, 2026", followUpDate: "Jun 23, 2026",
    status: "active", health: "hot", responseTime: "~2 hrs", totalInteractions: 4,
    notes: "Most responsive recruiter in pipeline. Technical interview scheduled next week — very promising.",
    interactions: [
      { type: "interview", date: "Jun 15, 2026", title: "Technical Interview Confirmed", description: "Technical interview set for Jun 23 — Systems Design + Live Coding, 90 mins. Prep materials sent." },
      { type: "call",      date: "Jun 13, 2026", title: "Culture Fit Call", description: "45-min culture fit call with James + EM. Exceptionally positive — proceeding to technical round." },
      { type: "email",     date: "Jun 11, 2026", title: "Technical Round Invite", description: "Formal invitation to proceed to technical interview stage with the Payments Infrastructure team." },
      { type: "linkedin",  date: "Jun 8, 2026",  title: "Initial Outreach", description: "James reached out via LinkedIn after seeing open-source contributions. Referred by a colleague at Stripe." },
    ],
  },
  {
    id: "r5", name: "Aisha Williams", company: "Vercel", role: "Talent Acquisition Lead",
    email: "a.williams@vercel.com", linkedin: "https://linkedin.com/in/aishawilliams", phone: null,
    lastContact: "May 28, 2026", followUpDate: "Jun 14, 2026", followUpOverdue: true,
    status: "follow_up", health: "cold", responseTime: "No response", totalInteractions: 1,
    notes: "No response since initial LinkedIn message. One follow-up sent. May try one final outreach.",
    interactions: [
      { type: "linkedin", date: "May 28, 2026", title: "LinkedIn Outreach Sent", description: "Sent personalized introduction about the Senior Frontend Engineer opening at Vercel. No response yet." },
    ],
  },
  {
    id: "r6", name: "Tom Nakamura", company: "Atlassian", role: "Engineering Recruiting Manager",
    email: "t.nakamura@atlassian.com", linkedin: "https://linkedin.com/in/tomnakamura", phone: null,
    lastContact: "May 10, 2026", followUpDate: null,
    status: "cold", health: "cold", responseTime: "No response", totalInteractions: 2,
    notes: "Longest pending contact. Original email sent in May with no response. Likely moved on internally.",
    interactions: [
      { type: "email", date: "May 15, 2026", title: "Follow-up Email", description: "Sent a follow-up to original application email. Still awaiting response from Tom." },
      { type: "email", date: "May 10, 2026", title: "Cold Email Sent", description: "Direct email to Tom about the Staff Engineer position at Atlassian. No response received." },
    ],
  },
  {
    id: "r7", name: "Emma Rodriguez", company: "Datadog", role: "Senior Technical Recruiter",
    email: "e.rodriguez@datadoghq.com", linkedin: "https://linkedin.com/in/emmarodriguez", phone: "+1 (646) 555-0187",
    lastContact: "Jun 13, 2026", followUpDate: "Jun 21, 2026",
    status: "active", health: "warm", responseTime: "~12 hrs", totalInteractions: 3,
    notes: "Great initial response. Phone screen scheduled for next week. Emma is very knowledgeable about the team needs.",
    interactions: [
      { type: "call",  date: "Jun 13, 2026", title: "Phone Screen Confirmed", description: "Emma confirmed phone screen for Jun 20 — Observability Platform Engineer role, 45 mins." },
      { type: "email", date: "Jun 11, 2026", title: "Response Received", description: "Emma replied with enthusiasm and requested availability for a phone screen this week." },
      { type: "email", date: "Jun 9, 2026",  title: "Cold Email Sent", description: "Sent personalized cold email to Emma about the Senior Backend Engineer opening on the APM team." },
    ],
  },
];

const MONTHLY_DATA = [
  { month: "Feb", contacted: 1, responded: 1 },
  { month: "Mar", contacted: 2, responded: 1 },
  { month: "Apr", contacted: 2, responded: 2 },
  { month: "May", contacted: 5, responded: 3 },
  { month: "Jun", contacted: 7, responded: 5 },
];
const RESPONSE_DATA = [
  { company: "Stripe", rate: 95 }, { company: "Google", rate: 88 },
  { company: "Microsoft", rate: 80 }, { company: "Datadog", rate: 72 },
  { company: "Amazon", rate: 55 }, { company: "Vercel", rate: 35 },
  { company: "Atlassian", rate: 15 },
];
const REMINDERS = [
  { name: "Marcus Johnson",  company: "Amazon",    date: "Jun 10",  action: "Send follow-up on SDE II application status",    overdue: true },
  { name: "Aisha Williams",  company: "Vercel",    date: "Jun 14",  action: "Final outreach before marking contact as cold",   overdue: true },
  { name: "Sarah Chen",      company: "Google",    date: "Jun 20",  action: "Send thank-you note after interview prep call",   overdue: false },
  { name: "Emma Rodriguez",  company: "Datadog",   date: "Jun 21",  action: "Check in on phone screen next steps",             overdue: false },
  { name: "Priya Patel",     company: "Microsoft", date: "Jun 22",  action: "Follow up on Azure video interview feedback",     overdue: false },
];
const INSIGHTS = [
  { icon: Zap,        label: "Most Responsive",     name: "James Mitchell", sub: "Stripe · ~2 hr avg response",        color: "text-emerald-400", bg: "bg-emerald-400/8",  border: "border-emerald-400/15" },
  { icon: Clock,      label: "Longest Pending",      name: "Tom Nakamura",  sub: "Atlassian · 37 days, no reply",     color: "text-red-400",     bg: "bg-red-400/8",      border: "border-red-400/15" },
  { icon: TrendingUp, label: "Highest Conversion",   name: "Sarah Chen",    sub: "Google · Interview scheduled",      color: "text-violet-400",  bg: "bg-violet-400/8",   border: "border-violet-400/15" },
];

// ─── Form schema ───────────────────────────────────────────────────────────────
const recruiterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional().or(z.literal("")),
});
type RecruiterFormValues = z.infer<typeof recruiterSchema>;

// ─── Sub-components ────────────────────────────────────────────────────────────
function CompanyLogo({ company, size = "md" }: { company: string; size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const domain = COMPANY_DOMAINS[company] ?? `${company.toLowerCase()}.com`;
  const colors = COMPANY_COLORS[company] ?? { bg: "bg-white/10", text: "text-white/70" };
  const szCls = size === "sm" ? "w-8 h-8 text-sm" : size === "lg" ? "w-12 h-12 text-lg" : "w-10 h-10 text-base";
  if (!failed) return (
    <img src={`https://logo.clearbit.com/${domain}`} alt={company}
      className={cn("rounded-xl object-contain bg-white p-1", szCls)}
      onError={() => setFailed(true)} />
  );
  return (
    <div className={cn("rounded-xl flex items-center justify-center font-bold shrink-0", szCls, colors.bg, colors.text)}>
      {company.charAt(0)}
    </div>
  );
}

function RecruiterDirectoryCard({ r, isSelected, onClick }: { r: SampleRecruiter; isSelected: boolean; onClick: () => void }) {
  const sc = STATUS_CONFIG[r.status];
  const hc = HEALTH_CONFIG[r.health];
  return (
    <button onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition-all duration-200 p-3.5 group",
        isSelected
          ? "bg-primary/8 border-primary/30 shadow-[0_0_18px_rgba(124,58,237,0.12)]"
          : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/14"
      )}>
      <div className="flex items-center gap-3">
        <CompanyLogo company={r.company} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-white truncate">{r.name}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{r.company} · {r.role.split(" ").slice(0, 2).join(" ")}</p>
        </div>
        {isSelected && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
      </div>
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1", sc.bg, sc.color, sc.border)}>
          {r.status === "follow_up" && r.followUpOverdue
            ? <><AlertTriangle className="w-2.5 h-2.5" />Overdue</>
            : sc.label}
        </span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1", hc.bg, hc.color, hc.border)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", hc.dot)} />{hc.label}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">{r.lastContact.replace(", 2026", "")}</span>
      </div>
    </button>
  );
}

function TimelineEntry({ entry, isLast }: { entry: Interaction; isLast: boolean }) {
  const cfg = INTERACTION_CONFIG[entry.type];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0", cfg.bg, cfg.border)}>
          <cfg.icon className={cn("w-4 h-4", cfg.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/6 my-1.5" />}
      </div>
      <div className={cn("pb-5 flex-1 min-w-0", isLast ? "" : "")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{entry.title}</p>
            <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{entry.date.replace(", 2026", "")}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{entry.description}</p>
      </div>
    </div>
  );
}

function DetailPanel({ r }: { r: SampleRecruiter }) {
  const hc = HEALTH_CONFIG[r.health];
  const sc = STATUS_CONFIG[r.status];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">

        {/* Recruiter header */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <CompanyLogo company={r.company} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">{r.name}</h2>
                  <p className="text-sm text-muted-foreground">{r.role} <span className="text-primary/80">@ {r.company}</span></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5", hc.bg, hc.color, hc.border)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", hc.dot)} />{hc.label}
                  </span>
                  <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border", sc.bg, sc.color, sc.border)}>{sc.label}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {r.email && (
                  <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5" />{r.email}
                  </a>
                )}
                {r.phone && (
                  <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5" />{r.phone}
                  </a>
                )}
                {r.linkedin && (
                  <a href={r.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                    <Linkedin className="w-3.5 h-3.5" />LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/6">
            {[
              { icon: Activity,    label: "Interactions", value: `${r.totalInteractions}` },
              { icon: Clock,       label: "Response Time", value: r.responseTime },
              { icon: Calendar,    label: "Last Contact",  value: r.lastContact.replace(", 2026", "") },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-bold text-white">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Timeline + Notes side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Timeline */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-violet-400/12 border border-violet-400/20 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Interaction Timeline</p>
                <p className="text-xs text-muted-foreground">{r.totalInteractions} interactions tracked</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                {Object.entries(INTERACTION_CONFIG).slice(0, 3).map(([key, cfg]) => (
                  <span key={key} className={cn("px-1.5 py-0.5 rounded text-[10px] border", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</span>
                ))}
              </div>
            </div>
            <div className="space-y-0">
              {r.interactions.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}>
                  <TimelineEntry entry={entry} isLast={i === r.interactions.length - 1} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/12 border border-amber-400/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-white">Notes</p>
            </div>
            <p className="text-sm text-white/75 leading-relaxed">{r.notes}</p>
            {r.followUpDate && (
              <div className={cn("rounded-xl p-3 border", r.followUpOverdue ? "bg-red-400/8 border-red-400/20" : "bg-amber-400/8 border-amber-400/20")}>
                <div className="flex items-center gap-2 mb-1">
                  <Bell className={cn("w-3.5 h-3.5", r.followUpOverdue ? "text-red-400" : "text-amber-400")} />
                  <p className={cn("text-xs font-semibold", r.followUpOverdue ? "text-red-400" : "text-amber-400")}>
                    {r.followUpOverdue ? "Overdue Follow-up" : "Upcoming Follow-up"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{r.followUpDate}</p>
              </div>
            )}
            <div className="space-y-2 pt-2 border-t border-white/6">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Legend</p>
              {Object.values(INTERACTION_CONFIG).map(cfg => (
                <div key={cfg.label} className="flex items-center gap-2">
                  <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border", cfg.bg, cfg.border)}>
                    <cfg.icon className={cn("w-3 h-3", cfg.color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      <p className="font-semibold text-white mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="text-white font-bold">{p.value}{p.name === "rate" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function RecruitersList() {
  const queryClient = useQueryClient();
  const { data: realRecruiters = [], isLoading } = useListRecruiters();
  const [selectedId, setSelectedId] = useState("r4");
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: { name: "", company: "", email: "", linkedin: "", phone: "", notes: "", followUpDate: "" },
  });

  const createMutation = useCreateRecruiter({ mutation: { onSuccess: () => { toast.success("Contact added"); queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() }); setIsDialogOpen(false); }, onError: () => toast.error("Failed to add contact") } });
  const updateMutation = useUpdateRecruiter({ mutation: { onSuccess: () => { toast.success("Contact updated"); queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() }); setIsDialogOpen(false); }, onError: () => toast.error("Failed to update") } });
  const deleteMutation = useDeleteRecruiter({ mutation: { onSuccess: () => { toast.success("Contact removed"); queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() }); setDeleteId(null); }, onError: () => toast.error("Failed to delete") } });

  function onSubmit(data: RecruiterFormValues) {
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate({ data });
  }
  function openEdit(r: any) {
    setEditingId(r.id); form.reset({ name: r.name, company: r.company, email: r.email || "", linkedin: r.linkedin || "", phone: r.phone || "", notes: r.notes || "", followUpDate: r.followUpDate ? format(new Date(r.followUpDate), "yyyy-MM-dd") : "" }); setIsDialogOpen(true);
  }
  function openNew() {
    setEditingId(null); form.reset({ name: "", company: "", email: "", linkedin: "", phone: "", notes: "", followUpDate: "" }); setIsDialogOpen(true);
  }

  const isDemo = !isLoading && realRecruiters.length === 0;
  const filtered = filterStatus === "all" ? SAMPLE_RECRUITERS : SAMPLE_RECRUITERS.filter(r => r.status === filterStatus);
  const selectedRecruiter = SAMPLE_RECRUITERS.find(r => r.id === selectedId) ?? SAMPLE_RECRUITERS[3];

  const counts = {
    total:     SAMPLE_RECRUITERS.length,
    active:    SAMPLE_RECRUITERS.filter(r => r.status === "active").length,
    follow_up: SAMPLE_RECRUITERS.filter(r => r.status === "follow_up").length,
    cold:      SAMPLE_RECRUITERS.filter(r => r.status === "cold").length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Recruiter CRM
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your network and never miss a follow-up.</p>
        </div>
        <Button onClick={openNew} data-testid="button-add-contact"
          className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 h-10 shrink-0">
          <Plus className="w-4 h-4" />Add Contact
        </Button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-primary/6 border border-primary/20 rounded-xl mb-5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Viewing sample data</p>
            <p className="text-xs text-muted-foreground">Add your first recruiter contact to track your real network here.</p>
          </div>
          <Button size="sm" onClick={openNew} className="shrink-0 h-8 text-xs bg-primary hover:bg-primary/90 rounded-lg px-3 gap-1.5">
            <Plus className="w-3 h-3" aria-hidden="true" />Add Contact
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Contacts",    value: counts.total,     icon: Users,         color: "text-white",         bg: "bg-white/8",          border: "border-white/12" },
          { label: "Active",            value: counts.active,    icon: CheckCircle2,  color: "text-emerald-400",   bg: "bg-emerald-400/8",    border: "border-emerald-400/15" },
          { label: "Follow Up Needed",  value: counts.follow_up, icon: Bell,          color: "text-amber-400",     bg: "bg-amber-400/8",      border: "border-amber-400/15" },
          { label: "Cold",              value: counts.cold,      icon: AlertTriangle, color: "text-slate-400",     bg: "bg-slate-400/8",      border: "border-slate-400/15" },
        ].map(({ label, value, icon: Icon, color, bg, border }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: "spring" as const, stiffness: 280, damping: 24 }}
            className={cn("glass-panel rounded-xl p-4 border", bg, border)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <p className={cn("text-3xl font-black tabular-nums", color)}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex flex-col xl:flex-row gap-5 items-start mb-5">

        {/* Directory */}
        <div className="w-full xl:w-72 2xl:w-80 shrink-0 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Recruiter Directory</p>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-white/4 rounded-xl border border-white/6">
            {(["all", "active", "follow_up", "cold"] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={cn("flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all capitalize", f === filterStatus ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white")}>
                {f === "follow_up" ? "Follow Up" : f === "all" ? `All (${counts.total})` : f}
              </button>
            ))}
          </div>

          {/* Real recruiters from API */}
          {!isLoading && realRecruiters.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-1">Your Contacts</p>
              {realRecruiters.map(r => (
                <div key={r.id} className="w-full rounded-xl border border-white/8 bg-white/3 p-3.5 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.company}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)} className="h-7 w-7 p-0 text-muted-foreground hover:text-white rounded-lg"><Edit className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 my-2 px-1">
                <div className="flex-1 h-px bg-white/6" /><span className="text-[10px] text-muted-foreground">Sample Network</span><div className="flex-1 h-px bg-white/6" />
              </div>
            </div>
          )}

          {/* Sample recruiters */}
          <div className="space-y-2">
            {filtered.map(r => (
              <RecruiterDirectoryCard key={r.id} r={r} isSelected={selectedId === r.id}
                onClick={() => setSelectedId(r.id)} />
            ))}
          </div>

          {/* Relationship Health legend */}
          <div className="glass-panel rounded-xl p-4 space-y-2.5 mt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Relationship Health</p>
            {Object.values(HEALTH_CONFIG).map(h => (
              <div key={h.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", h.dot)} />{h.label}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          <DetailPanel r={selectedRecruiter} />
        </div>
      </div>

      {/* Bottom: Analytics + Reminders + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Contact Analytics */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-400/12 border border-blue-400/20 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Contact Analytics</p>
              <p className="text-xs text-muted-foreground">Monthly outreach vs response rates</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Monthly chart */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Recruiters Contacted vs Responded</p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap="30%">
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="contacted" name="contacted" fill="#6366f1" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="responded" name="responded" fill="#34d399" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />Contacted</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />Responded</span>
              </div>
            </div>
            {/* Response rate by company */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Response Rate by Company</p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={RESPONSE_DATA} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 50 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="company" tick={{ fill: "#e2e8f0", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="rate" name="rate" fill="#818cf8" fillOpacity={0.75} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders + Insights */}
        <div className="space-y-4">
          {/* Recruiter Insights */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-400/12 border border-amber-400/20 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-white">Recruiter Insights</p>
            </div>
            {INSIGHTS.map(({ icon: Icon, label, name, sub, color, bg, border }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08, type: "spring" as const, stiffness: 280, damping: 26 }}
                className={cn("flex items-start gap-3 p-3 rounded-xl border", bg, border)}>
                <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", bg, border)}>
                  <Icon className={cn("w-3.5 h-3.5", color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={cn("text-sm font-bold truncate", color)}>{name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Follow-up Reminders */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-red-400/12 border border-red-400/20 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Follow-up Reminders</p>
                <p className="text-xs text-muted-foreground">2 overdue</p>
              </div>
            </div>
            {REMINDERS.map((r, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  r.overdue ? "bg-red-400/6 border-red-400/15" : "bg-white/3 border-white/8"
                )}>
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", r.overdue ? "bg-red-400" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{r.name} <span className="text-muted-foreground font-normal">· {r.company}</span></p>
                    <span className={cn("text-[10px] font-semibold shrink-0", r.overdue ? "text-red-400" : "text-amber-400")}>{r.overdue ? "OVERDUE" : r.date}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{r.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingId ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Save details about a recruiter or hiring manager.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/80">Name</FormLabel><FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/80">Company</FormLabel><FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-company" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/80">Email</FormLabel><FormControl><Input type="email" className="bg-black/30 border-white/10 text-white" data-testid="input-email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/80">Phone</FormLabel><FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-phone" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="linkedin" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel className="text-white/80">LinkedIn URL</FormLabel><FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-linkedin" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="followUpDate" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel className="text-white/80">Follow-up Date</FormLabel><FormControl><Input type="date" className="bg-black/30 border-white/10 text-white" data-testid="input-followup-date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel className="text-white/80">Notes</FormLabel><FormControl><Textarea className="bg-black/30 border-white/10 text-white resize-none" rows={3} data-testid="input-notes" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white hover:bg-white/5">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-contact" className="bg-primary hover:bg-primary/90">
                  {(createMutation.isPending || updateMutation.isPending) && <div className="mr-2 h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Save Contact
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
            <AlertDialogTitle className="text-white">Remove Contact</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This will permanently remove this contact from your CRM.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
