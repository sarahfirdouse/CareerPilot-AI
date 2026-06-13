import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateResume, useGetResume, useUpdateResume, getListResumesQueryKey, getGetResumeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().optional(),
  fileUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumeForm({ isNew = false }: { isNew?: boolean }) {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: resume, isLoading: isFetching } = useGetResume(Number(id), {
    query: { enabled: !isNew && !!id, queryKey: getGetResumeQueryKey(Number(id)) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Software Engineer",
      content: "",
      fileUrl: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (resume && !isNew) {
      form.reset({
        name: resume.name,
        category: resume.category,
        content: resume.content || "",
        fileUrl: resume.fileUrl || "",
        isDefault: resume.isDefault || false,
      });
    }
  }, [resume, isNew, form]);

  const createMutation = useCreateResume({
    mutation: {
      onSuccess: () => {
        toast.success("Resume added");
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
        setLocation("/resumes");
      },
      onError: () => toast.error("Failed to add resume"),
    }
  });

  const updateMutation = useUpdateResume({
    mutation: {
      onSuccess: () => {
        toast.success("Resume updated");
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
        setLocation("/resumes");
      },
      onError: () => toast.error("Failed to update resume"),
    }
  });

  function onSubmit(data: FormValues) {
    if (isNew) {
      createMutation.mutate({ data });
    } else {
      updateMutation.mutate({ id: Number(id), data });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && isFetching) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl">
          <Link href="/resumes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {isNew ? "Add Resume" : "Edit Resume"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{isNew ? "Add a new version to your resume library." : "Update this resume version."}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Version Name</FormLabel>
                  <FormControl><Input placeholder="Frontend Dev 2024" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Category / Role</FormLabel>
                  <FormControl><Input placeholder="Software Engineering" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-category" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fileUrl" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-white/80">External Link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="https://docs.google.com/..." className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-file-url" {...field} /></FormControl>
                  <FormDescription className="text-muted-foreground/70">Link to your hosted PDF or document.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-white/80">Resume Text Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your plain text resume here for AI analysis..."
                      className="min-h-[280px] font-mono text-sm bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 resize-none focus-visible:ring-primary/50"
                      data-testid="input-content"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground/70">Required for AI Analyzer and Cover Letter Generator features.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isDefault" render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-white font-medium">Set as Default</FormLabel>
                    <FormDescription className="text-muted-foreground/70 text-xs">
                      Make this your primary resume for general applications.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-default" />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" asChild className="text-muted-foreground hover:text-white hover:bg-white/5">
                <Link href="/resumes">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]" data-testid="button-submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? "Save Resume" : "Update Resume"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
