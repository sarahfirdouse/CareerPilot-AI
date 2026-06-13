import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateResume, useGetResume, useUpdateResume, getListResumesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";

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
    query: { enabled: !isNew && !!id }
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
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resumes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? "Add Resume" : "Edit Resume"}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version Name</FormLabel>
                    <FormControl><Input placeholder="Frontend Dev 2024" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category / Role</FormLabel>
                    <FormControl><Input placeholder="Software Engineering" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fileUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>External Link (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://docs.google.com/..." {...field} /></FormControl>
                    <FormDescription>Link to your hosted PDF or document.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Resume Text Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your plain text resume here for AI analysis..." 
                        className="min-h-[300px] font-mono text-sm" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Required if you want to use the AI Analyzer features.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isDefault" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Set as Default</FormLabel>
                      <FormDescription>
                        Make this your primary resume for general applications.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/resumes">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNew ? "Save Resume" : "Update Resume"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
