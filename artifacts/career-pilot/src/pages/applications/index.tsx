import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, ExternalLink,
  MapPin, DollarSign, Loader2, ArrowUpDown, Briefcase,
  CheckCircle2, Clock, Award, X,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_ORDER = [
  "wishlist", "applied", "oa_received", "interview_scheduled",
  "final_round", "offer", "rejected",
] as const;

const STATUS_CONFIG: Record<string, { label: string; dot: string; color: string; bg: string; border: string }> = {
  wishlist:            { label: "Wishlist",     dot: "bg-slate-400",   color: "text-slate-400",   bg: "bg-slate-400/10",   border: "border-slate-400/20" },
  applied:             { label: "Applied",      dot: "bg-blue-400",    color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20" },
  oa_received:         { label: "OA Received",  dot: "bg-violet-400",  color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/20" },
  interview_scheduled: { label: "Interview",    dot: "bg-amber-400",   color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  final_round:         { label: "Final Round",  dot: "bg-pink-400",    color: "text-pink-400",    bg: "bg-pink-400/10",    border: "border-pink-400/20" },
  offer:               { label: "Offer ✦",      dot: "bg-emerald-400", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  rejected:            { label: "Rejected",     dot: "bg-red-400",     color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20" },
};

function getStatusMeta(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, dot: "bg-white/30", color: "text-white/60", bg: "bg-white/5", border: "border-white/10" };
}

// ─── Company color ────────────────────────────────────────────────────────────
const KNOWN_COMPANIES: [string, string][] = [
  ["google", "bg-blue-500"], ["amazon", "bg-amber-600"], ["microsoft", "bg-cyan-500"],
  ["meta", "bg-blue-600"], ["netflix", "bg-red-600"], ["stripe", "bg-violet-600"],
  ["vercel", "bg-zinc-600"], ["atlassian", "bg-blue-700"], ["apple", "bg-zinc-500"],
  ["openai", "bg-emerald-700"], ["anthropic", "bg-amber-700"],
];
const FALLBACK_COLORS = ["bg-violet-500", "bg-blue-500", "bg-emerald-600", "bg-amber-500", "bg-pink-600", "bg-cyan-600"];

function companyColor(company: string): string {
  const lower = company.toLowerCase();
  for (const [k, v] of KNOWN_COMPANIES) if (lower.includes(k)) return v;
  return FALLBACK_COLORS[company.charCodeAt(0) % FALLBACK_COLORS.length];
}

// ─── Sort types ───────────────────────────────────────────────────────────────
type SortField = "company" | "appliedDate" | "status";
type SortDir   = "asc" | "desc";

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[44, 160, 200, 120, 100, 100, 120, 160, 40].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded-lg animate-pulse bg-white/5" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Sortable header ──────────────────────────────────────────────────────────
function SortHeader({ label, field, current, dir, onSort }: {
  label: string; field: SortField;
  current: SortField; dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = field === current;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn("flex items-center gap-1 hover:text-white transition-colors group",
        active ? "text-white" : "text-muted-foreground")}
    >
      {label}
      <span className="ml-0.5 opacity-60">
        {active
          ? (dir === "asc" ? <span className="text-[10px]">↑</span> : <span className="text-[10px]">↓</span>)
          : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
        }
      </span>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ isFiltered, onAdd }: { isFiltered: boolean; onAdd: () => void }) {
  return (
    <tr>
      <td colSpan={9}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
            className="relative mb-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-primary/50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border border-white/10 flex items-center justify-center">
              {isFiltered ? <Search className="w-3.5 h-3.5 text-muted-foreground" /> : <Plus className="w-3.5 h-3.5 text-primary" />}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isFiltered ? "No matching applications" : "Your pipeline is empty"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              {isFiltered
                ? "Try clearing your search or switching to a different status."
                : "Add your first application to start tracking your job search like a pro."}
            </p>
            {!isFiltered && (
              <Button
                onClick={onAdd}
                className="bg-primary hover:bg-primary/90 gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add First Application
              </Button>
            )}
          </motion.div>
        </div>
      </td>
    </tr>
  );
}

// ─── Form schema ──────────────────────────────────────────────────────────────
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

// ─── App modal ────────────────────────────────────────────────────────────────
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
      form.reset({
        company: "", role: "", location: "", salary: "",
        appliedDate: format(new Date(), "yyyy-MM-dd"),
        status: ApplicationInputStatus.applied,
        notes: "", jobUrl: "",
      });
    } else if (existing) {
      form.reset({
        company:     existing.company,
        role:        existing.role,
        location:    existing.location || "",
        salary:      existing.salary || "",
        appliedDate: existing.appliedDate,
        status:      existing.status as ApplicationInputStatus,
        notes:       existing.notes || "",
        jobUrl:      existing.jobUrl || "",
      });
    }
  }, [open, isNew, existing, form]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const create = useCreateApplication({
    mutation: {
      onSuccess: () => { toast.success("Application added to pipeline ✓"); invalidate(); onClose(); },
      onError:   () => toast.error("Failed to add application"),
    }
  });

  const update = useUpdateApplication({
    mutation: {
      onSuccess: () => { toast.success("Application updated ✓"); invalidate(); onClose(); },
      onError:   () => toast.error("Failed to update application"),
    }
  });

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
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
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
                        <FormControl>
                          <Input placeholder="Google, Stripe, Vercel…" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Role *</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer, SWE II…" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco / Remote" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="salary" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Salary Range</FormLabel>
                        <FormControl>
                          <Input placeholder="$140k – $180k" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="appliedDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Date Applied *</FormLabel>
                        <FormControl>
                          <Input type="date" className={cn(inputCls, "[color-scheme:dark]")} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputCls}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-xl">
                            {STATUS_ORDER.map((s) => {
                              const meta = getStatusMeta(s);
                              return (
                                <SelectItem key={s} value={s} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer rounded-lg my-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                                    <span className="text-white/90">{meta.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="jobUrl" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Job Posting URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://jobs.company.com/..." className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-white/70 text-xs uppercase tracking-wide">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Recruiter name, key requirements, follow-up details…"
                            className={cn(inputCls, "min-h-[80px] resize-none")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </div>
                </div>
                {/* Modal footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-black/20">
                  <Button
                    type="button" variant="ghost" onClick={onClose}
                    className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit" disabled={isPending}
                    className="bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(124,58,237,0.3)] rounded-xl gap-2 min-w-[140px]"
                  >
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApplicationsList() {
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState("all");
  const [sortField,   setSortField]   = useState<SortField>("appliedDate");
  const [sortDir,     setSortDir]     = useState<SortDir>("desc");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editId,      setEditId]      = useState<number | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<{ id: number; company: string; role: string } | null>(null);

  const queryClient = useQueryClient();

  // Fetch all (client-side status filter lets us show counts per tab)
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
      },
      onError: () => toast.error("Failed to delete"),
    }
  });

  // Counts per status tab
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allApps.length };
    allApps.forEach(a => { c[a.status] = (c[a.status] ?? 0) + 1; });
    return c;
  }, [allApps]);

  // Stats bar
  const stats = useMemo(() => {
    const total      = allApps.length;
    const active     = allApps.filter(a => !["rejected"].includes(a.status)).length;
    const interviews = allApps.filter(a => ["interview_scheduled", "final_round"].includes(a.status)).length;
    const offers     = allApps.filter(a => a.status === "offer").length;
    return { total, active, interviews, offers };
  }, [allApps]);

  // Filter + sort
  const displayed = useMemo(() => {
    let r = statusFilter === "all" ? allApps : allApps.filter(a => a.status === statusFilter);
    r = [...r].sort((a, b) => {
      let cmp = 0;
      if (sortField === "company")     cmp = a.company.localeCompare(b.company);
      if (sortField === "appliedDate") cmp = a.appliedDate.localeCompare(b.appliedDate);
      if (sortField === "status")      cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [allApps, statusFilter, sortField, sortDir]);

  function handleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  }

  function openAdd()           { setEditId(null); setModalOpen(true); }
  function openEdit(id: number){ setEditId(id);   setModalOpen(true); }
  function closeModal()        { setModalOpen(false); }

  const isFiltered = search !== "" || statusFilter !== "all";

  const statItems = [
    { label: "Total",       value: stats.total,      icon: Briefcase,   color: "text-blue-400",    bg: "bg-blue-400/10" },
    { label: "Active",      value: stats.active,     icon: Clock,       color: "text-violet-400",  bg: "bg-violet-400/10" },
    { label: "Interviewing",value: stats.interviews, icon: CheckCircle2,color: "text-amber-400",   bg: "bg-amber-400/10" },
    { label: "Offers",      value: stats.offers,     icon: Award,       color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} className="space-y-5 pb-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Applications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and track your entire job pipeline.</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-panel rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {[{ value: "all", label: "All" }, ...STATUS_ORDER.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))].map(tab => {
          const active = statusFilter === tab.value;
          const meta   = tab.value !== "all" ? getStatusMeta(tab.value) : null;
          const count  = counts[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                active
                  ? "bg-white/10 text-white border-white/15"
                  : "text-muted-foreground hover:text-white border-transparent hover:border-white/8 hover:bg-white/5"
              )}
            >
              {meta && <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />}
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-white/8 text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search company or role…"
            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/40 rounded-xl h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={`${sortField}:${sortDir}`} onValueChange={(v) => {
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

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 overflow-hidden shadow-2xl bg-black/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                <th className="px-4 py-3.5 text-left">
                  <span className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Co.</span>
                </th>
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
                <th className="px-4 py-3.5 text-left hidden xl:table-cell max-w-[180px]">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Notes</span>
                </th>
                <th className="px-4 py-3.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
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
                    const meta    = getStatusMeta(app.status);
                    const bgColor = companyColor(app.company);
                    const initial = app.company.slice(0, 2).toUpperCase();
                    return (
                      <motion.tr
                        key={app.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.2 }}
                        className="border-b border-white/5 hover:bg-white/4 transition-colors group"
                      >
                        {/* Initials badge */}
                        <td className="px-4 py-3.5">
                          <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                            {initial}
                          </div>
                        </td>
                        {/* Company */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white whitespace-nowrap">{app.company}</span>
                            {app.jobUrl && (
                              <a href={app.jobUrl} target="_blank" rel="noreferrer"
                                className="text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
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
                          {app.location ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px] text-xs">{app.location}</span>
                            </div>
                          ) : <span className="text-white/20">—</span>}
                        </td>
                        {/* Salary */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {app.salary ? (
                            <div className="flex items-center gap-1 text-emerald-400/80">
                              <DollarSign className="w-3 h-3 shrink-0" />
                              <span className="text-xs whitespace-nowrap">{app.salary}</span>
                            </div>
                          ) : <span className="text-white/20">—</span>}
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap text-xs">
                          {format(new Date(app.appliedDate), "MMM d, yyyy")}
                        </td>
                        {/* Status badge */}
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                            meta.color, meta.bg, meta.border
                          )}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        {/* Notes */}
                        <td className="px-4 py-3.5 hidden xl:table-cell max-w-[180px]">
                          {app.notes ? (
                            <span className="text-xs text-muted-foreground truncate block max-w-[160px]" title={app.notes}>
                              {app.notes.length > 45 ? app.notes.slice(0, 42) + "…" : app.notes}
                            </span>
                          ) : <span className="text-white/20">—</span>}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-xl min-w-[140px]">
                              <DropdownMenuItem
                                onClick={() => openEdit(app.id)}
                                className="hover:bg-white/8 focus:bg-white/8 cursor-pointer gap-2 text-white/80 hover:text-white rounded-lg"
                              >
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
                                className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400 cursor-pointer gap-2 rounded-lg"
                              >
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

        {/* Table footer */}
        {!isLoading && displayed.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground bg-black/10">
            <span>
              Showing <span className="text-white font-medium">{displayed.length}</span> of{" "}
              <span className="text-white font-medium">{allApps.length}</span> applications
            </span>
            {isFiltered && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      <AppModal open={modalOpen} onClose={closeModal} editId={editId} />

      {/* ── Delete AlertDialog ────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0d0d14]/95 backdrop-blur-xl border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete application?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove your{" "}
              <span className="text-white font-medium">{deleteTarget?.role}</span> application at{" "}
              <span className="text-white font-medium">{deleteTarget?.company}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 rounded-xl"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
