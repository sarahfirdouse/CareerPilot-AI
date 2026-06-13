import { useState } from "react";
import { Link } from "wouter";
import { useListResumes, useDeleteResume, getListResumesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash, Sparkles, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground mt-2">Manage your resume versions and analyze them with AI.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href="/resumes/analyze">
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Resume
            </Link>
          </Button>
          <Button asChild>
            <Link href="/resumes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Resume
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">Loading resumes...</div>
      ) : resumes?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">No resumes yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Upload your first resume to start applying.</p>
            <Button asChild>
              <Link href="/resumes/new">Add Resume</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes?.map((resume) => (
            <Card key={resume.id} className={resume.isDefault ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {resume.name}
                      {resume.isDefault && <Star className="h-4 w-4 fill-primary text-primary" />}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Added {format(new Date(resume.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{resume.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {resume.content ? resume.content.substring(0, 150) + "..." : "No text content available."}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/resumes/${resume.id}`}>Edit</Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{resume.name}"? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate({ id: resume.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
