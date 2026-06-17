import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Briefcase, FileText, Users,
  GraduationCap, ArrowLeft, Compass,
} from "lucide-react";

const QUICK_LINKS = [
  { href: "/dashboard",      label: "Dashboard",     icon: LayoutDashboard },
  { href: "/applications",   label: "Applications",  icon: Briefcase },
  { href: "/resumes",        label: "Resumes",       icon: FileText },
  { href: "/recruiters",     label: "Recruiters",    icon: Users },
  { href: "/interview-prep", label: "Interview Prep",icon: GraduationCap },
];

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background px-4 py-16 selection:bg-primary/30">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* 404 large number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="mb-2"
        >
          <span className="text-[120px] md:text-[160px] font-black leading-none tracking-tight bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent select-none">
            404
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.15)]">
            <Compass className="w-8 h-8 text-primary/70" />
          </div>
        </motion.div>

        {/* Heading + description */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-2xl md:text-3xl font-bold text-white mb-3"
        >
          Page not found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8 leading-relaxed max-w-sm mx-auto"
        >
          The page you&apos;re looking for doesn&apos;t exist or was moved. Head back to the dashboard to continue your job search.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl gap-2 h-11 px-6">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-white/3 border border-white/8 rounded-2xl p-5"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">Quick navigation</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_LINKS.map(({ href, label, icon: Icon }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <Link
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6 hover:bg-white/8 hover:border-white/12 text-muted-foreground hover:text-white transition-all duration-200 group text-sm font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors shrink-0" />
                  {label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
