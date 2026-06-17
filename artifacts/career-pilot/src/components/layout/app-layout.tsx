import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import {
  LayoutDashboard, Briefcase, FileText, Users, GraduationCap,
  BarChart, LogOut, PenTool, Menu, X, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/applications",   label: "Applications",   icon: Briefcase },
  { href: "/resumes",        label: "Resumes",        icon: FileText },
  { href: "/cover-letter",   label: "Cover Letter",   icon: PenTool },
  { href: "/recruiters",     label: "Recruiters",     icon: Users },
  { href: "/interview-prep", label: "Interview Prep", icon: GraduationCap },
  { href: "/analytics",      label: "Analytics",      icon: BarChart },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  return (
    <>
      <div className="p-6 shrink-0">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 group" aria-label="CareerPilot home">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30 group-hover:bg-primary/30 transition-colors" aria-hidden="true">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-bold tracking-tight text-xl text-white">CareerPilot</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive ? "text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/8"
                  transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon aria-hidden="true" className={cn("h-4 w-4 relative z-10 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white/80")} />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary relative z-10 shrink-0" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 mt-auto shrink-0 space-y-1">
        {(() => {
          const isActive = location === "/settings";
          return (
            <Link href="/settings" onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive ? "text-white" : "text-muted-foreground hover:text-white"
              )}>
              {isActive && (
                <motion.div layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/8"
                  transition={{ type: "spring" as const, stiffness: 300, damping: 30 }} />
              )}
              <Settings aria-hidden="true" className={cn("h-4 w-4 relative z-10 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white/80")} />
              <span className="relative z-10">Settings</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary relative z-10 shrink-0" aria-hidden="true" />}
            </Link>
          );
        })()}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl h-10"
          onClick={() => signOut()}
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          Log out
        </Button>
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-[100dvh] w-full bg-background selection:bg-primary/30">

      {/* ── Mobile top bar ───────────────────────────────────────────── */}
      <header className="mobile-topbar md:hidden fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4 border-b border-white/6 bg-black/60 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="CareerPilot home">
          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30 flex items-center justify-center" aria-hidden="true">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="font-bold tracking-tight text-white text-[17px]">CareerPilot</span>
        </Link>
        <button
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen
              ? <motion.span key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X    aria-hidden="true" className="h-4 w-4" /></motion.span>
              : <motion.span key="menu" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu aria-hidden="true" className="h-4 w-4" /></motion.span>}
          </AnimatePresence>
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/70 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              id="mobile-nav-drawer"
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring" as const, stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border md:hidden flex flex-col shadow-2xl"
              aria-label="Mobile navigation"
            >
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside
        className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-2xl flex-shrink-0 h-screen sticky top-0 z-20 flex-col hidden md:flex"
        aria-label="Sidebar navigation"
      >
        <NavContent />
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-[100dvh] overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary/10 blur-[128px] pointer-events-none" aria-hidden="true" />
        <div className="flex-1 overflow-y-auto p-4 pt-[72px] md:pt-8 md:p-8 z-10">
          <div className="mx-auto max-w-6xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
