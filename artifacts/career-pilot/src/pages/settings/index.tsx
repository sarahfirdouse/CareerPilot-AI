import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/react";
import { useTheme } from "@/components/theme-provider";
import { useListResumes } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User, Palette, Bell, Shield, FileText, Database,
  Moon, Sun, Monitor, Check, Download, Trash2,
  ChevronRight, Save, Globe, MapPin, Phone,
  Linkedin, DollarSign, AlertTriangle, Info,
  BellRing, BellOff, Briefcase, Target, FileDown,
  Settings as SettingsIcon,
} from "lucide-react";

// ─── Settings storage ─────────────────────────────────────────────────────────
const STORAGE_KEY = "career-pilot-settings-v1";
const DEFAULT_SETTINGS = {
  // Notifications
  emailDigest: true,
  interviewReminders: true,
  applicationDeadlines: true,
  weeklySummary: false,
  recruiterFollowUps: true,
  // Privacy
  activityTracking: true,
  anonymousAnalytics: true,
  dataSharing: false,
  // Resume prefs
  autoFillFromResume: true,
  defaultResumeId: null as string | null,
  targetRoles: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  preferRemote: true,
  // Profile extras
  location: "",
  bio: "",
  linkedIn: "",
  portfolio: "",
  phone: "",
  // Appearance
  compactView: false,
  accentColor: "indigo" as "indigo" | "violet" | "blue" | "emerald" | "rose",
};
type AppSettings = typeof DEFAULT_SETTINGS;

function useLocalSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const update = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const updateMany = (patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { settings, update, updateMany };
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Toggle({
  label, desc, checked, onChange,
}: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-white/6 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch" aria-checked={checked}
        className={cn(
          "relative w-10 h-6 rounded-full shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          checked ? "bg-primary shadow-[0_0_12px_rgba(124,58,237,0.4)]" : "bg-white/15"
        )}
      >
        <span className={cn(
          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, desc }: { icon: React.ElementType; label: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-white">{label}</h2>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
  );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────
function ProfileSection({ settings, updateMany }: { settings: AppSettings; updateMany: (p: Partial<AppSettings>) => void }) {
  const { user } = useUser();
  const [local, setLocal] = useState({
    location: settings.location,
    bio: settings.bio,
    linkedIn: settings.linkedIn,
    portfolio: settings.portfolio,
    phone: settings.phone,
  });
  const [dirty, setDirty] = useState(false);

  const field = (key: keyof typeof local) => ({
    value: local[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLocal(p => ({ ...p, [key]: e.target.value }));
      setDirty(true);
    },
  });

  const save = () => { updateMany(local); setDirty(false); toast.success("Profile saved"); };
  const discard = () => { setLocal({ location: settings.location, bio: settings.bio, linkedIn: settings.linkedIn, portfolio: settings.portfolio, phone: settings.phone }); setDirty(false); };

  return (
    <div>
      <SectionTitle icon={User} label="Profile" desc="Your identity and contact details" />

      {/* Clerk identity card */}
      <div className="flex items-center gap-4 p-4 bg-white/4 border border-white/8 rounded-2xl mb-6">
        <div className="relative shrink-0">
          {user?.imageUrl
            ? <img src={user.imageUrl} alt="avatar" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10" />
            : <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/25 flex items-center justify-center text-xl font-bold text-primary">{user?.firstName?.[0] ?? "?"}</div>
          }
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-background flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{user?.fullName || "—"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress || "—"}</p>
          <p className="text-xs text-primary/80 mt-1 font-medium flex items-center gap-1.5">
            <Info className="w-3 h-3" /> Name &amp; email managed via Clerk
          </p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium"><MapPin className="w-3 h-3" />Location</Label>
            <Input {...field("location")} placeholder="San Francisco, CA" className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium"><Phone className="w-3 h-3" />Phone</Label>
            <Input {...field("phone")} placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium"><Linkedin className="w-3 h-3" />LinkedIn URL</Label>
          <Input {...field("linkedIn")} placeholder="https://linkedin.com/in/yourname" className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium"><Globe className="w-3 h-3" />Portfolio / Website</Label>
          <Input {...field("portfolio")} placeholder="https://yourportfolio.com" className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-medium">Bio</Label>
          <textarea {...field("bio")} placeholder="A short bio about yourself and what you're looking for…" rows={3}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground resize-none outline-none transition-colors" />
        </div>
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mt-5 flex gap-3">
            <Button onClick={save} className="bg-primary hover:bg-primary/90 rounded-xl gap-2 h-9 shadow-[0_0_16px_rgba(124,58,237,0.3)]">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
            <Button variant="ghost" onClick={discard} className="text-muted-foreground hover:text-white rounded-xl h-9">Discard</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────
const THEMES = [
  { id: "dark",   label: "Dark",   icon: Moon,    desc: "Easy on the eyes" },
  { id: "light",  label: "Light",  icon: Sun,     desc: "Bright & clear" },
  { id: "system", label: "System", icon: Monitor, desc: "Follows your OS" },
] as const;

const ACCENT_COLORS = [
  { id: "indigo",  label: "Indigo",  cls: "bg-indigo-500"  },
  { id: "violet",  label: "Violet",  cls: "bg-violet-500"  },
  { id: "blue",    label: "Blue",    cls: "bg-blue-500"    },
  { id: "emerald", label: "Emerald", cls: "bg-emerald-500" },
  { id: "rose",    label: "Rose",    cls: "bg-rose-500"    },
] as const;

function AppearanceSection({ settings, update }: { settings: AppSettings; update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <SectionTitle icon={Palette} label="Appearance" desc="Customize how CareerPilot looks for you" />

      <div className="space-y-6">
        {/* Theme */}
        <div>
          <p className="text-sm font-medium text-white mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ id, label, icon: Icon, desc }) => (
              <button key={id} onClick={() => setTheme(id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200",
                  theme === id
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                    : "bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/14"
                )}>
                {theme === id && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", theme === id ? "bg-primary/20 text-primary" : "bg-white/8 text-muted-foreground")}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="text-center">
                  <p className={cn("text-xs font-semibold", theme === id ? "text-white" : "text-muted-foreground")}>{label}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <p className="text-sm font-medium text-white mb-3">Accent Color</p>
          <div className="flex items-center gap-2.5 flex-wrap">
            {ACCENT_COLORS.map(({ id, label, cls }) => (
              <button key={id} onClick={() => { update("accentColor", id); toast.success(`Accent set to ${label}`); }}
                title={label}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all ring-offset-2 ring-offset-background",
                  cls,
                  settings.accentColor === id ? "ring-2 ring-white scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                )}>
                {settings.accentColor === id && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Accent color is stored as preference. Full theme support coming soon.</p>
        </div>

        {/* Compact view */}
        <Toggle label="Compact View" desc="Reduce spacing and padding across the interface"
          checked={settings.compactView} onChange={v => update("compactView", v)} />
      </div>
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────
function NotificationsSection({ settings, update }: { settings: AppSettings; update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void }) {
  return (
    <div>
      <SectionTitle icon={Bell} label="Notifications" desc="Control how and when CareerPilot contacts you" />
      <div className="flex items-center gap-2 p-3 bg-amber-400/8 border border-amber-400/20 rounded-xl mb-5">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-200/80">Notification delivery requires email configuration. These settings are saved as preferences.</p>
      </div>
      <Toggle label="Email Digest" desc="Receive a weekly summary of your job search activity" checked={settings.emailDigest} onChange={v => update("emailDigest", v)} />
      <Toggle label="Interview Reminders" desc="Get notified 24h before scheduled interviews" checked={settings.interviewReminders} onChange={v => update("interviewReminders", v)} />
      <Toggle label="Application Deadlines" desc="Alerts when applications you've saved are about to close" checked={settings.applicationDeadlines} onChange={v => update("applicationDeadlines", v)} />
      <Toggle label="Weekly Progress Summary" desc="A snapshot of what you accomplished each week" checked={settings.weeklySummary} onChange={v => update("weeklySummary", v)} />
      <Toggle label="Recruiter Follow-up Reminders" desc="Nudges when a recruiter contact hasn't been followed up" checked={settings.recruiterFollowUps} onChange={v => update("recruiterFollowUps", v)} />
    </div>
  );
}

// ─── Section: Privacy ─────────────────────────────────────────────────────────
function PrivacySection({ settings, update }: { settings: AppSettings; update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void }) {
  return (
    <div>
      <SectionTitle icon={Shield} label="Privacy" desc="Control your data and what gets tracked" />
      <Toggle label="Activity Tracking" desc="Allow CareerPilot to log actions for the activity feed on your dashboard" checked={settings.activityTracking} onChange={v => update("activityTracking", v)} />
      <Toggle label="Anonymous Analytics" desc="Share anonymised usage data to help improve the product. No personal info is shared." checked={settings.anonymousAnalytics} onChange={v => update("anonymousAnalytics", v)} />
      <Toggle label="Share Profile Data" desc="Allow partners to see aggregated, anonymised market data about job seekers" checked={settings.dataSharing} onChange={v => update("dataSharing", v)} />
      <div className="mt-6 p-4 bg-white/3 border border-white/8 rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Your data is yours</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">All job application data, resumes, and recruiter contacts are stored securely and tied only to your account. We never sell personal data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Resume Preferences ─────────────────────────────────────────────
function ResumePrefsSection({ settings, update, updateMany }: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  updateMany: (p: Partial<AppSettings>) => void;
}) {
  const { data: resumes } = useListResumes();
  const [targetRoles, setTargetRoles] = useState(settings.targetRoles);
  const [salaryMin, setSalaryMin] = useState(settings.salaryMin);
  const [salaryMax, setSalaryMax] = useState(settings.salaryMax);

  const saveJobPrefs = () => {
    updateMany({ targetRoles, salaryMin, salaryMax });
    toast.success("Job preferences saved");
  };

  return (
    <div>
      <SectionTitle icon={FileText} label="Resume Preferences" desc="Defaults and auto-fill settings for your job applications" />
      <div className="space-y-5">
        {/* Default resume */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><FileText className="w-3 h-3" />Default Resume</Label>
          <select
            value={settings.defaultResumeId ?? ""}
            onChange={e => update("defaultResumeId", e.target.value || null)}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="">— No default selected —</option>
            {(resumes || []).map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}{r.isDefault ? " (current default)" : ""}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">This resume is pre-selected when adding new applications.</p>
        </div>

        {/* Auto-fill */}
        <Toggle label="Auto-fill Applications from Resume" desc="Pre-populate application form fields (skills, role, experience) using your default resume"
          checked={settings.autoFillFromResume} onChange={v => update("autoFillFromResume", v)} />

        {/* Remote preference */}
        <Toggle label="Prefer Remote Roles" desc="Filter and highlight remote-friendly positions in your applications"
          checked={settings.preferRemote} onChange={v => update("preferRemote", v)} />

        {/* Target roles */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Target className="w-3 h-3" />Target Job Titles</Label>
          <Input value={targetRoles} onChange={e => setTargetRoles(e.target.value)}
            placeholder="Software Engineer, Frontend Developer, Full Stack Engineer"
            className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
          <p className="text-xs text-muted-foreground">Comma-separated list of roles you're targeting.</p>
        </div>

        {/* Salary expectations */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><DollarSign className="w-3 h-3" />Salary Expectations</Label>
          <div className="flex items-center gap-3">
            <select value={settings.salaryCurrency} onChange={e => update("salaryCurrency", e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer w-24 shrink-0">
              {["USD", "EUR", "GBP", "CAD", "AUD"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Min (e.g. 80000)"
              className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
            <span className="text-muted-foreground text-sm shrink-0">to</span>
            <Input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Max (e.g. 140000)"
              className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl h-10" />
          </div>
        </div>

        <Button onClick={saveJobPrefs} className="bg-primary hover:bg-primary/90 rounded-xl gap-2 h-9 shadow-[0_0_16px_rgba(124,58,237,0.3)]">
          <Save className="w-3.5 h-3.5" /> Save Preferences
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Data & Export ───────────────────────────────────────────────────
function DataExportSection({ settings }: { settings: AppSettings }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportApplicationsCSV = async () => {
    setExporting("csv");
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      const headers = ["Company", "Role", "Status", "Applied Date", "Location", "Notes"];
      const rows = [
        headers.join(","),
        ...(Array.isArray(data) ? data : []).map((a: any) => [
          `"${String(a.company || "").replace(/"/g, '""')}"`,
          `"${String(a.role || "").replace(/"/g, '""')}"`,
          a.status || "",
          a.appliedDate || "",
          `"${String(a.location || "").replace(/"/g, '""')}"`,
          `"${String(a.notes || "").replace(/"/g, '""')}"`,
        ].join(","))
      ].join("\n");
      const blob = new Blob([rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "careerpilot-applications.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Applications exported as CSV");
    } catch {
      toast.error("Export failed — check your connection");
    } finally {
      setExporting(null);
    }
  };

  const exportSettingsJSON = () => {
    setExporting("json");
    const data = { exportedAt: new Date().toISOString(), settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "careerpilot-settings.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Settings exported");
    setExporting(null);
  };

  const clearSettings = () => {
    if (!confirm("Clear all local preferences? This cannot be undone.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    toast.success("Local settings cleared — reload to apply defaults");
  };

  return (
    <div>
      <SectionTitle icon={Database} label="Data & Export" desc="Download your data or manage account storage" />

      {/* Export cards */}
      <div className="space-y-3 mb-8">
        <ExportCard
          icon={FileDown}
          color="text-blue-400"
          bg="bg-blue-400/8"
          border="border-blue-400/15"
          title="Export Applications"
          desc="Download all your job applications as a CSV file, compatible with Excel and Google Sheets."
          btnLabel={exporting === "csv" ? "Exporting…" : "Download CSV"}
          disabled={exporting !== null}
          onClick={exportApplicationsCSV}
        />
        <ExportCard
          icon={Database}
          color="text-violet-400"
          bg="bg-violet-400/8"
          border="border-violet-400/15"
          title="Export Settings"
          desc="Download your CareerPilot preferences and settings as a JSON file."
          btnLabel={exporting === "json" ? "Exporting…" : "Download JSON"}
          disabled={exporting !== null}
          onClick={exportSettingsJSON}
        />
      </div>

      {/* Danger zone */}
      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm font-semibold text-red-400">Danger Zone</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Clear local preferences</p>
              <p className="text-xs text-muted-foreground mt-0.5">Resets all settings in this browser to defaults. Does not affect your account or data.</p>
            </div>
            <Button onClick={clearSettings} variant="outline"
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 rounded-xl h-9 gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportCard({ icon: Icon, color, bg, border, title, desc, btnLabel, onClick, disabled }: {
  icon: React.ElementType; color: string; bg: string; border: string;
  title: string; desc: string; btnLabel: string; onClick: () => void; disabled: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-colors", bg, border)}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg, border)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <Button onClick={onClick} disabled={disabled} variant="outline"
        className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-9 gap-2 text-xs">
        <Download className="w-3.5 h-3.5" /> {btnLabel}
      </Button>
    </div>
  );
}

// ─── Main settings page ───────────────────────────────────────────────────────
const SECTIONS = [
  { id: "profile",       label: "Profile",           icon: User },
  { id: "appearance",    label: "Appearance",         icon: Palette },
  { id: "notifications", label: "Notifications",      icon: Bell },
  { id: "privacy",       label: "Privacy",            icon: Shield },
  { id: "resume-prefs",  label: "Resume Preferences", icon: FileText },
  { id: "data",          label: "Data & Export",      icon: Database },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } } };

export default function Settings() {
  const [active, setActive] = useState<SectionId>("profile");
  const { settings, update, updateMany } = useLocalSettings();

  const renderSection = () => {
    switch (active) {
      case "profile":       return <ProfileSection      settings={settings} updateMany={updateMany} />;
      case "appearance":    return <AppearanceSection   settings={settings} update={update} />;
      case "notifications": return <NotificationsSection settings={settings} update={update} />;
      case "privacy":       return <PrivacySection      settings={settings} update={update} />;
      case "resume-prefs":  return <ResumePrefsSection  settings={settings} update={update} updateMany={updateMany} />;
      case "data":          return <DataExportSection   settings={settings} />;
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-12">

      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account, preferences and data.</p>
      </motion.div>

      {/* Body */}
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row gap-5">

        {/* Left: section tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 shrink-0 lg:w-56">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActive(id as SectionId)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 lg:shrink whitespace-nowrap text-left",
                active === id
                  ? "bg-white/10 text-white border border-white/8 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active === id ? "text-primary" : "")} />
              <span className="flex-1">{label}</span>
              {active === id && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden lg:block" />}
            </button>
          ))}
        </nav>

        {/* Right: content panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="glass-panel rounded-2xl p-6"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </motion.div>
  );
}
