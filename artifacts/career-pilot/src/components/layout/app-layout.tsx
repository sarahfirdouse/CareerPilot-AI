import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users, 
  GraduationCap, 
  BarChart, 
  LogOut,
  PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="/logo.svg" alt="CareerPilot AI" className="h-8 w-8" />
            <span className="font-bold tracking-tight text-xl text-sidebar-foreground">CareerPilot AI</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
