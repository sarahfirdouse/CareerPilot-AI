import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGenerateCoverLetter } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Wand2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  jobDescription: z.string().min(20, "Job description is too short"),
  resumeText: z.string().min(20, "Resume text is too short"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CoverLetter() {
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      role: "",
      jobDescription: "",
      resumeText: "",
    },
  });

  const generateMutation = useGenerateCoverLetter({
    mutation: {
      onSuccess: (data) => {
        setResult(data.coverLetter);
        toast.success("Cover letter generated!");
      },
      onError: () => toast.error("Failed to generate cover letter")
    }
  });

  function onSubmit(data: FormValues) {
    generateMutation.mutate({ data });
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const company = form.getValues("companyName").replace(/\s+/g, '-').toLowerCase();
    element.download = `cover-letter-${company}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Cover Letter Generator</h1>
        <p className="text-muted-foreground mt-2">Generate tailored cover letters based on your resume and the job description.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Provide the job details to generate a personalized letter.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Role</FormLabel><FormControl><Input placeholder="Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="jobDescription" render={({ field }) => (
                  <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea placeholder="Paste job description..." className="h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="resumeText" render={({ field }) => (
                  <FormItem><FormLabel>Your Resume</FormLabel><FormControl><Textarea placeholder="Paste your resume..." className="h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Generate Cover Letter</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Generated Letter</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {result ? (
              <div className="h-full bg-muted/30 p-4 rounded-md whitespace-pre-wrap text-sm border border-border/50">
                {result}
              </div>
            ) : (
              <div className="h-full min-h-[400px] border-dashed border-2 rounded-md flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                <Wand2 className="h-12 w-12 mb-4 opacity-20" />
                <p>Fill out the form and generate to see your customized cover letter here.</p>
              </div>
            )}
          </CardContent>
          {result && (
            <CardFooter className="gap-2 border-t pt-4">
              <Button variant="outline" className="w-full" onClick={copyToClipboard}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="secondary" className="w-full" onClick={downloadText}>
                <Download className="mr-2 h-4 w-4" />
                Download .txt
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
