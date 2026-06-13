import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { LayoutDashboard, Briefcase, FileText, Users, GraduationCap, BarChart, LogOut, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/cover-letter", label: "Cover Letter", icon: PenTool },
  { href: "/recruiters", label: "Recruiters", icon: Users },
  { href: "/interview-prep", label: "Interview Prep", icon: GraduationCap },
  { href: "/analytics", label: "Analytics", icon: BarChart },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-[100dvh] w-full bg-background flex-col md:flex-row font-sans selection:bg-primary/30">
      <aside className="w-full md:w-64 border-r border-white/5 bg-black/20 backdrop-blur-2xl flex-shrink-0 flex flex-col h-screen sticky top-0 z-20">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30 group-hover:bg-primary/30 transition-colors">
              <Briefcase className="h-4 w-4" />
              <div className="absolute inset-0 rounded-lg bg-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold tracking-tight text-xl text-white">CareerPilot</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div layoutId="nav-active" className="absolute inset-0 bg-white/10 rounded-lg border border-white/5" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary/10 blur-[128px] pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
          <div className="mx-auto max-w-6xl w-full">
            <AnimatePresence mode="wait">
              <motion.div key={location} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}