import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApplicationInputStatus, useCreateApplication, useGetApplication, useUpdateApplication, getListApplicationsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

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
    query: { enabled: !isNew && !!id }
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
        toast.success("Application created");
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
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/applications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? "New Application" : "Edit Application"}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>Enter the details of the job application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ApplicationInputStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ").toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appliedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Applied</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, CA / Remote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Expectation / Range</FormLabel>
                      <FormControl>
                        <Input placeholder="$120k - $150k" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Job Posting URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Interviewer names, key details..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/applications">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNew ? "Create Application" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
