import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApplicationInputStatus, useCreateApplication, useGetApplication, useUpdateApplication, getListApplicationsQueryKey, getGetApplicationQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional(),
  salary: z.string().optional(),
  appliedDate: z.string().min(1, "Applied date is required"),
  status: z.nativeEnum(ApplicationInputStatus),
  notes: z.string().optional(),
  jobUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplicationForm({ isNew = false }: { isNew?: boolean }) {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: application, isLoading: isFetching } = useGetApplication(Number(id), {
    query: { enabled: !isNew && !!id, queryKey: getGetApplicationQueryKey(Number(id)) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      role: "",
      location: "",
      salary: "",
      appliedDate: format(new Date(), "yyyy-MM-dd"),
      status: ApplicationInputStatus.applied,
      notes: "",
      jobUrl: "",
    },
  });

  useEffect(() => {
    if (application && !isNew) {
      form.reset({
        company: application.company,
        role: application.role,
        location: application.location || "",
        salary: application.salary || "",
        appliedDate: format(new Date(application.appliedDate), "yyyy-MM-dd"),
        status: application.status as ApplicationInputStatus,
        notes: application.notes || "",
        jobUrl: application.jobUrl || "",
      });
    }
  }, [application, isNew, form]);

  const createMutation = useCreateApplication({
    mutation: {
      onSuccess: () => {
        toast.success("Application added to your pipeline");
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setLocation("/applications");
      },
      onError: () => toast.error("Failed to create application"),
    }
  });

  const updateMutation = useUpdateApplication({
    mutation: {
      onSuccess: () => {
        toast.success("Application updated");
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setLocation("/applications");
      },
      onError: () => toast.error("Failed to update application"),
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
          <Link href="/applications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {isNew ? "New Application" : "Edit Application"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{isNew ? "Track a new role in your pipeline." : "Update the details of this application."}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Company</FormLabel>
                  <FormControl><Input placeholder="Acme Corp" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-company" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Role</FormLabel>
                  <FormControl><Input placeholder="Software Engineer" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-role" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/30 border-white/10 text-white" data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                      {Object.values(ApplicationInputStatus).map((status) => (
                        <SelectItem key={status} value={status} className="hover:bg-white/10 focus:bg-white/10 capitalize">
                          {status.replace("_", " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="appliedDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Date Applied</FormLabel>
                  <FormControl><Input type="date" className="bg-black/30 border-white/10 text-white focus-visible:ring-primary/50" data-testid="input-applied-date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Location</FormLabel>
                  <FormControl><Input placeholder="San Francisco, CA / Remote" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-location" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="salary" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Salary Range</FormLabel>
                  <FormControl><Input placeholder="$120k – $150k" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-salary" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="jobUrl" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-white/80">Job Posting URL</FormLabel>
                  <FormControl><Input placeholder="https://..." className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50" data-testid="input-job-url" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-white/80">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Interviewer names, key requirements, follow-up details..."
                      className="min-h-[100px] bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 resize-none focus-visible:ring-primary/50"
                      data-testid="input-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" asChild className="text-muted-foreground hover:text-white hover:bg-white/5">
                <Link href="/applications">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]" data-testid="button-submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? "Add Application" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
