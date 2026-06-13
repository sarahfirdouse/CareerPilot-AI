import { Link } from "wouter";
import { useListResumes, useDeleteResume, getListResumesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Plus, Trash, Sparkles, Star, ExternalLink, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function ResumesList() {
  const queryClient = useQueryClient();
  const { data: resumes, isLoading } = useListResumes();

  const deleteMutation = useDeleteResume({
    mutation: {
      onSuccess: () => {
        toast.success("Resume deleted");
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
      },
      onError: () => toast.error("Failed to delete resume"),
    }
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Resumes</h1>
          <p className="text-muted-foreground mt-2">Manage your versions and analyze them with AI.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="border-white/10 bg-white/5 hover:bg-white/10 text-white" data-testid="button-analyze-resume">
            <Link href="/resumes/analyze">
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              AI Analyze
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]" data-testid="button-new-resume">
            <Link href="/resumes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Resume
            </Link>
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 gap-2 text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading resumes...
        </div>
      ) : resumes?.length === 0 ? (
        <motion.div variants={item} className="glass-panel rounded-2xl py-16 text-center">
          <FileText className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <h3 className="text-xl font-semibold text-white">No resumes yet</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-xs mx-auto">Upload your first resume version to start applying and run AI analysis.</p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/resumes/new">Add Your First Resume</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes?.map((resume, i) => (
            <motion.div
              key={resume.id}
              data-testid={`card-resume-${resume.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
              className={`glass-panel rounded-2xl flex flex-col group transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)] ${resume.isDefault ? "border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.08)]" : ""}`}
            >
              <div className="p-5 pb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white truncate">{resume.name}</p>
                    {resume.isDefault && <Star className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Added {format(new Date(resume.createdAt), "MMM d, yyyy")}</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary/90 shrink-0 text-xs">{resume.category}</Badge>
              </div>

              <div className="px-5 py-3 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {resume.content ? resume.content.substring(0, 160) + "…" : "No text content — add paste your resume for AI analysis."}
                </p>
              </div>

              <div className="px-5 py-4 border-t border-white/5 flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-8" data-testid={`button-edit-resume-${resume.id}`}>
                    <Link href={`/resumes/${resume.id}`}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Link>
                  </Button>
                  {resume.fileUrl && (
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-white h-8 px-2">
                      <a href={resume.fileUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 h-8 w-8 p-0" data-testid={`button-delete-resume-${resume.id}`}>
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Resume</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Are you sure you want to delete &ldquo;{resume.name}&rdquo;? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate({ id: resume.id })} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
