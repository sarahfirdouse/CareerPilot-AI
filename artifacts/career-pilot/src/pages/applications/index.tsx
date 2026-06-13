import { useListApplications, useDeleteApplication, getListApplicationsQueryKey, ApplicationStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash, ExternalLink } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  wishlist: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  oa_received: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  interview_scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  final_round: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  offer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ApplicationsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useListApplications({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined
  });

  const deleteMutation = useDeleteApplication({
    mutation: {
      onSuccess: () => {
        toast.success("Application deleted");
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      },
      onError: () => toast.error("Failed to delete application")
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Applications</h1>
          <p className="text-muted-foreground mt-2">Manage and track your active job pipeline.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]">
          <Link href="/applications/new">
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center glass-panel p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/10">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(ApplicationStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ").toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5 hover:bg-white/5">
            <TableRow className="border-b border-white/5">
              <TableHead className="text-muted-foreground font-medium">Company</TableHead>
              <TableHead className="text-muted-foreground font-medium">Role</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date Applied</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading pipeline...
                  </div>
                </TableCell>
              </TableRow>
            ) : applications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No applications found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              applications?.map((app) => (
                <TableRow key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2">
                      {app.company}
                      {app.jobUrl && (
                        <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/80">{app.role}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(app.appliedDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${STATUS_COLORS[app.status] || ""} font-medium tracking-wide`}>
                      {app.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/10">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10">
                        <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                          <Link href={`/applications/${app.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Abort application?</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                This will permanently delete your application record for {app.role} at {app.company}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate({ id: app.id })} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                                Delete Record
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}