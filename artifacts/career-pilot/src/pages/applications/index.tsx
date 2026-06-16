import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListApplications, useDeleteApplication, useCreateApplication,
  useUpdateApplication, useGetApplication,
  getListApplicationsQueryKey, getGetApplicationQueryKey, getGetDashboardStatsQueryKey,
  ApplicationInputStatus,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, ExternalLink,
  MapPin, DollarSign, Loader2, ArrowUpDown, Briefcase, CheckCircle2,
  Clock, Award, X, Calendar, Users, Code2, Brain, MessageSquare,
  Check, Link2, ChevronRight, Send, Building2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type App = {
  id: number; company: string; role: string;
  location?: string | null; salary?: string | null;
  appliedDate: string; status: string;
  notes?: string | null; jobUrl?: string | null;
  createdAt: string;
};

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_ORDER = [
  "wishlist", "applied", "oa_received",
  "interview_scheduled", "final_round", "offer",
] as const;

const STATUS_CONFIG: Record<string, {
  label: string; dot: string; color: string;
  bg: string; border: string; hex: string;
}> = {
  wishlist:            { label: "Wishlist",     dot: "bg-slate-400",   color: "text-slate-400",   bg: "bg-slate-400/10",   border: "border-slate-400/20",  hex: "#94a3b8" },
  applied:             { label: "Applied",      dot: "bg-blue-400",    color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20",   hex: "#60a5fa" },
  oa_received:         { label: "OA Received",  dot: "bg-violet-400",  color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/20", hex: "#a78bfa" },
  interview_scheduled: { label: "Interview",    dot: "bg-amber-400",   color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20",  hex: "#fbbf24" },
  final_round:         { label: "Final Round",  dot: "bg-pink-400",    color: "text-pink-400",    bg: "bg-pink-400/10",    border: "border-pink-400/20",   hex: "#f472b6" },
  offer:               { label: "Offer ✦",      dot: "bg-emerald-400", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20",hex: "#34d399" },
  rejected:            { label: "Rejected",     dot: "bg-red-400",     color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",    hex: "#f87171" },
};

function getStatusMeta(s: string) {
  return STATUS_CONFIG[s] ?? { label: s, dot: "bg-white/30", color: "text-white/60", bg: "bg-white/5", border: "border-white/10", hex: "#ffffff" };
}

// ─── Company logos ─────────────────────────────────────────────────────────────
const COMPANY_DOMAINS: Record<string, string> = {
  google: "google.com", amazon: "amazon.com", microsoft: "microsoft.com",
  meta: "meta.com", netflix: "netflix.com", stripe: "stripe.com",
  vercel: "vercel.com", atlassian: "atlassian.com", datadog: "datadoghq.com",
  airbnb: "airbnb.com", cloudflare: "cloudflare.com", openai: "openai.com",
  figma: "figma.com", shopify: "shopify.com", apple: "apple.com",
  notion: "notion.so", palantir: "palantir.com", uber: "uber.com",
  dropbox: "dropbox.com", slack: "slack.com", twitter: "x.com",
  linkedin: "linkedin.com", spotify: "spotify.com", adobe: "adobe.com",
  salesforce: "salesforce.com", nvidia: "nvidia.com",
};

const BRAND_COLORS: [string, string][] = [
  ["google","bg-blue-500"],["amazon","bg-amber-600"],["microsoft","bg-cyan-500"],
  ["meta","bg-blue-600"],["netflix","bg-red-600"],["stripe","bg-violet-600"],
  ["vercel","bg-zinc-600"],["atlassian","bg-blue-700"],["datadog","bg-violet-700"],
  ["airbnb","bg-rose-500"],["cloudflare","bg-orange-500"],["openai","bg-emerald-700"],
  ["figma","bg-purple-500"],["shopify","bg-green-600"],["apple","bg-zinc-500"],
  ["notion","bg-zinc-700"],["palantir","bg-slate-600"],["uber","bg-zinc-800"],
  ["dropbox","bg-blue-400"],
];
const FALLBACK_COLORS = ["bg-violet-500","bg-blue-500","bg-emerald-600","bg-amber-500","bg-pink-600","bg-cyan-600"];

function companyColor(c: string): string {
  const low = c.toLowerCase();
  for (const [k,v] of BRAND_COLORS) if (low.includes(k)) return v;
  return FALLBACK_COLORS[c.charCodeAt(0) % FALLBACK_COLORS.length];
}
function companyDomain(c: string): string | null {
  const low = c.toLowerCase();
  for (const [k,v] of Object.entries(COMPANY_DOMAINS)) if (low.includes(k)) return v;
  return null;
}

function CompanyLogo({ company, size = "sm" }: { company: string; size?: "sm" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const domain = companyDomain(company);
  const sz   = size === "sm" ? "w-9 h-9" : "w-14 h-14";
  const txt  = size === "sm" ? "text-[11px]" : "text-lg";
  const init = company.slice(0, 2).toUpperCase();
  const bg   = companyColor(company);

  if (!domain || failed) {
    return (
      <div className={cn(sz, bg, "rounded-xl flex items-center justify-center font-bold text-white shrink-0", txt)}>
        {init}
      </div>
    );
  }
  return (
    <div className={cn(sz, "rounded-xl bg-white border border-white/10 flex items-center justify-center shrink-0 overflow-hidden")}>
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={company}
        className="w-full h-full object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = getStatusMeta(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border", m.color, m.bg, m.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

// ─── Application timeline ──────────────────────────────────────────────────────
function ApplicationTimeline({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const currentIdx = isRejected
    ? STATUS_ORDER.length
    : STATUS_ORDER.findIndex(s => s === status);

  return (
    <div className="space-y-1">
      {/* Progress bar */}
      <div className="relative mb-5">
        <div className="absolute top-3.5 left-3.5 right-3.5 h-px bg-white/10" />
        <motion.div
          className="absolute top-3.5 left-3.5 h-px bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: isRejected ? "calc(100% - 28px)" : `calc(${(Math.max(currentIdx,0) / (STATUS_ORDER.length - 1)) * 100}% - ${28 - (Math.max(currentIdx,0) / (STATUS_ORDER.length-1)) * 28}px)` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
        <div className="relative flex justify-between items-start">
          {STATUS_ORDER.map((s, i) => {
            const completed = i < currentIdx;
            const current   = i === currentIdx && !isRejected;
            const m = getStatusMeta(s);
            return (
              <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring" as const, stiffness: 300, damping: 24 }}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all",
                    completed ? "border-primary bg-primary" :
                    current   ? "border-primary bg-primary/20 ring-4 ring-primary/20" :
                    "border-white/20 bg-card"
                  )}
                >
                  {completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  {current   && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                </motion.div>
                <span className={cn("text-[9px] text-center leading-tight font-medium",
                  completed || current ? "text-white/80" : "text-muted-foreground/40"
                )}>
                  {m.label.replace(" ✦","").replace("OA Received","OA").replace("Interview","Intv")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-red-400/8 border border-red-400/20"
        >
          <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center shrink-0">
            <X className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm text-red-400 font-medium">Application was not moved forward</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Interview history helper ──────────────────────────────────────────────────
type InterviewRound = { round: string; icon: React.ElementType; with: string; done: boolean };

function getInterviewHistory(status: string): InterviewRound[] {
  const rounds: InterviewRound[] = [];
  const at  = (s: string) => ["oa_received","interview_scheduled","final_round","offer","rejected"].includes(s);
  const iv  = (s: string) => ["interview_scheduled","final_round","offer"].includes(s);
  const fin = (s: string) => ["final_round","offer"].includes(s);
  const off = (s: string) => s === "offer";

  if (at(status))  rounds.push({ round: "Recruiter Screen",      icon: MessageSquare, with: "Recruiting Team",     done: true });
  if (at(status))  rounds.push({ round: "Online Assessment",     icon: Code2,         with: "HackerRank / Codesignal", done: true });
  if (iv(status))  rounds.push({ round: "Technical Interview",   icon: Brain,         with: "Engineering Team",    done: fin(status) || off(status) });
  if (fin(status)) rounds.push({ round: "System Design Round",   icon: Building2,     with: "Staff Engineer",      done: off(status) });
  if (fin(status)) rounds.push({ round: "Behavioral / Culture",  icon: Users,         with: "Engineering Manager", done: off(status) });
  return rounds;
}

// ─── Detail side panel ─────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-white/90 leading-snug">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{children}</h3>;
}

function DetailPanel({ app, onClose, onEdit, onDelete }: {
  app: App; onClose: () => void;
  onEdit: () => void; onDelete: () => void;
}) {
  const meta      = getStatusMeta(app.status);
  const interviews = getInterviewHistory(app.status);
  const daysAgo   = differenceInDays(new Date(), new Date(app.appliedDate));
  const bgColor   = companyColor(app.company);

  // Derive a CSS color from brand for glow
  const glowMap: Record<string, string> = {
    google:"59,130,246", amazon:"217,119,6", microsoft:"6,182,212",
    meta:"37,99,235", netflix:"220,38,38", stripe:"139,92,246",
    vercel:"100,116,139", atlassian:"29,78,216", datadog:"124,58,237",
    airbnb:"244,63,94", cloudflare:"249,115,22", openai:"16,185,129",
  };
  const glowRgb = Object.entries(glowMap).find(([k]) => app.company.toLowerCase().includes(k))?.[1] ?? "124,58,237";

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[500px] bg-[#080810] border-l border-white/8 p-0 flex flex-col gap-0 [&>button]:hidden"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 10% 0%, rgba(${glowRgb},0.18) 0%, transparent 65%)` }} />
          <div className="relative px-6 pt-6 pb-5 border-b border-white/8">
            <SheetClose asChild>
              <button className="absolute right-5 top-5 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </SheetClose>
            <div className="flex items-start gap-4 pr-10">
              <CompanyLogo company={app.company} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{app.company}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{app.role}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <StatusBadge status={app.status} />
                  {app.jobUrl && (
                    <a href={app.jobUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors border border-white/8 hover:border-primary/30 px-2 py-1 rounded-full">
                      <ExternalLink className="w-3 h-3" /> View Posting
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-7">

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Calendar,   label: "Date Applied",  value: format(new Date(app.appliedDate), "MMM d, yyyy") },
                { icon: Clock,      label: "Days Active",   value: daysAgo === 0 ? "Today" : `${daysAgo} days` },
                { icon: MapPin,     label: "Location",      value: app.location || "Not specified" },
                { icon: DollarSign, label: "Salary",        value: app.salary   || "Not specified" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/4 border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Application timeline */}
            <div>
              <SectionTitle>Application Timeline</SectionTitle>
              <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                <ApplicationTimeline status={app.status} />
              </div>
            </div>

            {/* Notes */}
            {app.notes && (
              <div>
                <SectionTitle>Notes</SectionTitle>
                <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{app.notes}</p>
                </div>
              </div>
            )}

            {/* Interview history */}
            <div>
              <SectionTitle>Interview History</SectionTitle>
              {interviews.length === 0 ? (
                <div className="bg-white/3 border border-white/5 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 text-center">
                  <Brain className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No interviews recorded yet.</p>
                  <p className="text-xs text-muted-foreground/60">Interviews will appear here as you progress.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {interviews.map((iv, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, type: "spring" as const, stiffness: 300, damping: 28 }}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/4 border border-white/5"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        iv.done ? "bg-emerald-400/15 border border-emerald-400/20" : "bg-amber-400/15 border border-amber-400/20"
                      )}>
                        <iv.icon className={cn("w-4 h-4", iv.done ? "text-emerald-400" : "text-amber-400")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{iv.round}</p>
                        <p className="text-xs text-muted-foreground">with {iv.with}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                        iv.done
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                          : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                      )}>
                        {iv.done ? "Done" : "Upcoming"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recruiter information */}
            <div>
              <SectionTitle>Recruiter Information</SectionTitle>
              <div className="bg-white/3 border border-white/5 border-dashed rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No recruiter linked</p>
                    <p className="text-xs text-muted-foreground/50">Track your recruiter contact</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost"
                  className="text-xs border border-white/8 hover:border-white/15 hover:bg-white/5 text-muted-foreground hover:text-white gap-1.5 rounded-lg">
                  <Link href="/recruiters"><Link2 className="w-3 h-3" />Add</Link>
                </Button>
              </div>
            </div>

            {/* Spacer */}
            <div className="h-2" />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 flex gap-2.5 px-6 py-4 border-t border-white/8 bg-black/30">
          <Button variant="outline" onClick={onEdit}
            className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-2 h-10">
            <Pencil className="w-4 h-4" /> Edit Application
          </Button>
          <Button onClick={onDelete}
            className="w-12 h-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl shrink-0 p-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sort types ────────────────────────────────────────────────────────────────
type SortField = "company" | "appliedDate" | "status";
type SortDir   = "asc" | "desc";

// ─── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="px-4 py-4 w-1" />
      {[36, 140, 180, 110, 90, 90, 110, 160, 32].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded-lg animate-pulse bg-white/5" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Sortable header ───────────────────────────────────────────────────────────
function SortHeader({ label, field, current, dir, onSort }: {
  label: string; field: SortField;
  current: SortField; dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = field === current;
  return (
    <button onClick={() => onSort(field)}
      className={cn("flex items-center gap-1 hover:text-white transition-colors group",
        active ? "text-white" : "text-muted-foreground")}>
      {label}
      <span className="ml-0.5 opacity-60 text-[10px]">
        {active ? (dir === "asc" ? "↑" : "↓")
          : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />}
      </span>
    </button>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ isFiltered, onAdd }: { isFiltered: boolean; onAdd: () => void }) {
  return (
    <tr>
      <td colSpan={10}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
            className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-primary/50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0a0a14] border border-white/10 flex items-center justify-center">
              {isFiltered ? <Search className="w-3.5 h-3.5 text-muted-foreground" /> : <Plus className="w-3.5 h-3.5 text-primary" />}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isFiltered ? "No matching applications" : "Your pipeline is empty"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              {isFiltered ? "Try clearing your search or switching to a different status."
                : "Add your first application and start building your job search pipeline."}
            </p>
            {!isFiltered && (
              <Button onClick={onAdd}
                className="bg-primary hover:bg-primary/90 gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl">
                <Plus className="w-4 h-4" />Add First Application
              </Button>
            )}
          </motion.div>
        </div>
      </td>
    </tr>
  );
}

// ─── Form schema ───────────────────────────────────────────────────────────────
const formSchema = z.object({
  company:     z.string().min(1, "Company is required"),
  role:        z.string().min(1, "Role is required"),
  location:    z.string().optional(),
  salary:      z.string().optional(),
  appliedDate: z.string().min(1, "Applied date is required"),
  status:      z.nativeEnum(ApplicationInputStatus),
  notes:       z.string().optional(),
  jobUrl:      z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof formSchema>;

const inputCls = "bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/40 focus-visible:ring-primary/40 focus-visible:border-primary/30 rounded-xl";

// ─── App modal ─────────────────────────────────────────────────────────────────
function AppModal({ open, onClose, editId }: { open: boolean; onClose: () => void; editId: number | null }) {
  const isNew = editId === null;
  const queryClient = useQueryClient();

  const { data: existing, isLoading: fetching } = useGetApplication(editId ?? 0, {
    query: { enabled: !isNew, queryKey: getGetApplicationQueryKey(editId ?? 0) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "", role: "", location: "", salary: "",
      appliedDate: format(new Date(), "yyyy-MM-dd"),
      status: ApplicationInputStatus.applied,
      notes: "", jobUrl: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isNew) {
      form.reset({ company: "", role: "", location: "", salary: "",
        appliedDate: format(new Date(), "yyyy-MM-dd"),
        status: ApplicationInputStatus.applied, notes: "", jobUrl: "" });
    } else if (existing) {
      form.reset({
        company: existing.company, role: existing.role,
        location: existing.location || "", salary: existing.salary || "",
        appliedDate: existing.appliedDate,
        status: existing.status as ApplicationInputStatus,
        notes: existing.notes || "", jobUrl: existing.jobUrl || "",
      });
    }
  }, [open, isNew, existing, form]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const create = useCreateApplication({ mutation: {
    onSuccess: () => { toast.success("Application added ✓"); invalidate(); onClose(); },
    onError:   () => toast.error("Failed to add application"),
  }});
  const update = useUpdateApplication({ mutation: {
    onSuccess: () => { toast.success("Application updated ✓"); invalidate(); onClose(); },
    onError:   () => toast.error("Failed to update application"),
  }});

  const isPending = create.isPending || update.isPending;

  function onSubmit(data: FormValues) {
    if (isNew) create.mutate({ data });
    else update.mutate({ id: editId!, data });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0d0d14]/95 backdrop-blur-2xl border-white/8 max-w-2xl w-full rounded-2xl p-0 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="px-6 pt-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">
                {isNew ? "New Application" : "Edit Application"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isNew ? "Track a new role in your pipeline." : "Update the details of this application."}
              </p>
            </DialogHeader>
          </div>
          {!isNew && fetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="company" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Company *</FormLabel>
                        <FormControl><Input placeholder="Google, Stripe…" className={inputCls} {...field} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Role *</FormLabel>
                        <FormControl><Input placeholder="Software Engineer…" className={inputCls} {...field} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Location</FormLabel>
                        <FormControl><Input placeholder="San Francisco / Remote" className={inputCls} {...field} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="salary" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Salary Range</FormLabel>
                        <FormControl><Input placeholder="$140k–$180k" className={inputCls} {...field} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="appliedDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Date Applied *</FormLabel>
                        <FormControl><Input type="date" className={cn(inputCls, "[color-scheme:dark]")} {...field} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputCls}><SelectValue placeholder="Select status" /></SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-xl">
                            {STATUS_ORDER.map(s => {
                              const m = getStatusMeta(s);
                              return (
                                <SelectItem key={s} value={s} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer rounded-lg my-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full", m.dot)} />
                                    <span className="text-white/90">{m.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                            <SelectItem value="rejected" className="hover:bg-white/5 focus:bg-white/5 cursor-pointer rounded-lg my-0.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <span className="text-white/90">Rejected</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="jobUrl" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Job Posting URL</FormLabel>
                        <FormControl><Input placeholder="https://jobs.company.com/…" className={inputCls} {...field} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Recruiter name, key requirements, follow-up details…"
                            className={cn(inputCls, "min-h-[80px] resize-none")} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-black/20">
                  <Button type="button" variant="ghost" onClick={onClose}
                    className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}
                    className="bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(124,58,237,0.3)] rounded-xl gap-2 min-w-[140px]">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isNew ? "Add Application" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ApplicationsList() {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField,    setSortField]    = useState<SortField>("appliedDate");
  const [sortDir,      setSortDir]      = useState<SortDir>("desc");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editId,       setEditId]       = useState<number | null>(null);
  const [selectedApp,  setSelectedApp]  = useState<App | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; company: string; role: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: allApps = [], isLoading } = useListApplications({
    search: search || undefined,
  });

  const deleteMutation = useDeleteApplication({
    mutation: {
      onSuccess: () => {
        toast.success("Application removed");
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setDeleteTarget(null);
        setSelectedApp(null);
      },
      onError: () => toast.error("Failed to delete"),
    }
  });

  // After mutation updates, sync selectedApp with new data
  useEffect(() => {
    if (selectedApp && allApps.length > 0) {
      const updated = allApps.find(a => a.id === selectedApp.id);
      if (updated) setSelectedApp(updated as App);
    }
  }, [allApps]); // eslint-disable-line

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allApps.length };
    allApps.forEach(a => { c[a.status] = (c[a.status] ?? 0) + 1; });
    return c;
  }, [allApps]);

  const stats = useMemo(() => ({
    total:      allApps.length,
    active:     allApps.filter(a => a.status !== "rejected").length,
    interviews: allApps.filter(a => ["interview_scheduled","final_round"].includes(a.status)).length,
    offers:     allApps.filter(a => a.status === "offer").length,
  }), [allApps]);

  const displayed = useMemo(() => {
    let r = statusFilter === "all" ? allApps : allApps.filter(a => a.status === statusFilter);
    return [...r].sort((a, b) => {
      let cmp = 0;
      if (sortField === "company")     cmp = a.company.localeCompare(b.company);
      if (sortField === "appliedDate") cmp = a.appliedDate.localeCompare(b.appliedDate);
      if (sortField === "status")      cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allApps, statusFilter, sortField, sortDir]);

  function handleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  }

  function openAdd()            { setEditId(null); setModalOpen(true); }
  function openEdit(id: number) { setEditId(id);   setModalOpen(true); }
  function closeModal()         {
    setModalOpen(false);
    // Re-sync selected app after edit
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    }, 200);
  }

  const isFiltered = search !== "" || statusFilter !== "all";

  const statItems = [
    { label: "Total",       value: stats.total,      icon: Briefcase,    color: "text-blue-400",    bg: "bg-blue-400/10" },
    { label: "Active",      value: stats.active,     icon: Clock,        color: "text-violet-400",  bg: "bg-violet-400/10" },
    { label: "Interviewing",value: stats.interviews, icon: CheckCircle2, color: "text-amber-400",   bg: "bg-amber-400/10" },
    { label: "Offers",      value: stats.offers,     icon: Award,        color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Applications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Click any row to view details and timeline.
          </p>
        </div>
        <Button onClick={openAdd}
          className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 shrink-0">
          <Plus className="h-4 w-4" />Add Application
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-panel rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div>
              <p className={cn("text-xl font-bold tabular-nums", color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {[{ value:"all", label:"All" }, ...STATUS_ORDER.map(s => ({ value:s, label:STATUS_CONFIG[s].label })),
          { value:"rejected", label:"Rejected" }
        ].map(tab => {
          const active = statusFilter === tab.value;
          const meta   = tab.value !== "all" ? getStatusMeta(tab.value) : null;
          const count  = counts[tab.value] ?? 0;
          return (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                active ? "bg-white/10 text-white border-white/15"
                       : "text-muted-foreground hover:text-white border-transparent hover:border-white/8 hover:bg-white/5"
              )}>
              {meta && <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />}
              {tab.label.replace(" ✦","")}
              {count > 0 && (
                <span className={cn("ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-white/8 text-muted-foreground")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search company or role…"
            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/40 rounded-xl h-10"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={`${sortField}:${sortDir}`} onValueChange={v => {
          const [f, d] = v.split(":") as [SortField, SortDir];
          setSortField(f); setSortDir(d);
        }}>
          <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/10 text-white rounded-xl h-10">
            <SelectValue placeholder="Sort by…" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-xl">
            <SelectItem value="appliedDate:desc" className="hover:bg-white/5 focus:bg-white/5 rounded-lg">Date Applied (Newest)</SelectItem>
            <SelectItem value="appliedDate:asc"  className="hover:bg-white/5 focus:bg-white/5 rounded-lg">Date Applied (Oldest)</SelectItem>
            <SelectItem value="company:asc"      className="hover:bg-white/5 focus:bg-white/5 rounded-lg">Company (A → Z)</SelectItem>
            <SelectItem value="company:desc"     className="hover:bg-white/5 focus:bg-white/5 rounded-lg">Company (Z → A)</SelectItem>
            <SelectItem value="status:asc"       className="hover:bg-white/5 focus:bg-white/5 rounded-lg">Status (A → Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden shadow-2xl bg-black/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="w-1 px-0 py-3.5" />
                <th className="px-3 py-3.5 text-left w-10" />
                <th className="px-4 py-3.5 text-left">
                  <SortHeader label="Company" field="company" current={sortField} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-left min-w-[160px]">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Role</span>
                </th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Location</span>
                </th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Salary</span>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <SortHeader label="Date" field="appliedDate" current={sortField} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-left">
                  <SortHeader label="Status" field="status" current={sortField} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-left hidden xl:table-cell">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Notes</span>
                </th>
                <th className="px-4 py-3.5 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : displayed.length === 0 ? (
                <EmptyState isFiltered={isFiltered} onAdd={openAdd} />
              ) : (
                <AnimatePresence initial={false}>
                  {displayed.map((app, i) => {
                    const meta     = getStatusMeta(app.status);
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <motion.tr
                        key={app.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.2 }}
                        onClick={() => setSelectedApp(isSelected ? null : app as App)}
                        className={cn(
                          "border-b border-white/5 group cursor-pointer transition-all duration-150 relative",
                          isSelected
                            ? "bg-primary/[0.07] border-b-primary/20"
                            : "hover:bg-white/[0.035]"
                        )}
                      >
                        {/* Selection indicator */}
                        <td className="w-[3px] p-0">
                          <div className={cn(
                            "w-[3px] transition-all duration-200 rounded-r-full",
                            isSelected ? `${meta.dot} h-full` : "bg-transparent h-0 group-hover:h-full group-hover:bg-white/20"
                          )} style={{ minHeight: isSelected ? "56px" : undefined }} />
                        </td>

                        {/* Logo */}
                        <td className="px-3 py-3.5">
                          <CompanyLogo company={app.company} size="sm" />
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white whitespace-nowrap">{app.company}</span>
                            {app.jobUrl && (
                              <a href={app.jobUrl} target="_blank" rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-muted-foreground/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5 text-white/75 max-w-[200px]">
                          <span className="truncate block">{app.role}</span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {app.location
                            ? <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[120px] text-xs">{app.location}</span>
                              </div>
                            : <span className="text-white/20">—</span>}
                        </td>

                        {/* Salary */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {app.salary
                            ? <div className="flex items-center gap-1 text-emerald-400/80">
                                <DollarSign className="w-3 h-3 shrink-0" />
                                <span className="text-xs whitespace-nowrap">{app.salary}</span>
                              </div>
                            : <span className="text-white/20">—</span>}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap text-xs">
                          {format(new Date(app.appliedDate), "MMM d, yyyy")}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* Notes preview */}
                        <td className="px-4 py-3.5 hidden xl:table-cell max-w-[180px]">
                          {app.notes
                            ? <span className="text-xs text-muted-foreground/70 truncate block max-w-[160px]"
                                title={app.notes}>
                                {app.notes.length > 48 ? app.notes.slice(0, 45) + "…" : app.notes}
                              </span>
                            : <span className="text-white/20">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-xl min-w-[140px]">
                              <DropdownMenuItem onClick={() => openEdit(app.id)}
                                className="hover:bg-white/8 focus:bg-white/8 cursor-pointer gap-2 text-white/80 hover:text-white rounded-lg">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              {app.jobUrl && (
                                <DropdownMenuItem asChild className="hover:bg-white/8 focus:bg-white/8 cursor-pointer gap-2 text-white/80 hover:text-white rounded-lg">
                                  <a href={app.jobUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" /> View Posting
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-white/8" />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget({ id: app.id, company: app.company, role: app.role })}
                                className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400 cursor-pointer gap-2 rounded-lg">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && displayed.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground bg-black/10">
            <span>
              Showing <span className="text-white font-medium">{displayed.length}</span> of{" "}
              <span className="text-white font-medium">{allApps.length}</span> applications
              {selectedApp && <span className="ml-2 text-primary/80">· Click a row to view details</span>}
            </span>
            {isFiltered && (
              <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
                className="flex items-center gap-1 hover:text-white transition-colors">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedApp && (
        <DetailPanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onEdit={() => {
            openEdit(selectedApp.id);
          }}
          onDelete={() => setDeleteTarget({ id: selectedApp.id, company: selectedApp.company, role: selectedApp.role })}
        />
      )}

      {/* Add/Edit modal */}
      <AppModal open={modalOpen} onClose={closeModal} editId={editId} />

      {/* Delete alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete application?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove{" "}
              <span className="text-white font-medium">{deleteTarget?.role}</span> at{" "}
              <span className="text-white font-medium">{deleteTarget?.company}</span>. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 rounded-xl">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
