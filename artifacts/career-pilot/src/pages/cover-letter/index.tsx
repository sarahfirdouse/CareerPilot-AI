import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGenerateCoverLetter } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Copy, Download, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
    defaultValues: { companyName: "", role: "", jobDescription: "", resumeText: "" },
  });

  const generateMutation = useGenerateCoverLetter({
    mutation: {
      onSuccess: (data) => {
        setResult(data.coverLetter);
        toast.success("Cover letter generated");
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
    const file = new Blob([result], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    const company = form.getValues("companyName").replace(/\s+/g, "-").toLowerCase();
    element.download = `cover-letter-${company}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">AI Cover Letter</h1>
        <p className="text-muted-foreground mt-2">Generate tailored cover letters in seconds from your resume and job description.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Job Details</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Tell us about the role you&apos;re applying to.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Company</FormLabel>
                    <FormControl><Input placeholder="Acme Corp" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50" data-testid="input-company" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Role</FormLabel>
                    <FormControl><Input placeholder="Software Engineer" className="bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50" data-testid="input-role" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="jobDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste job description..." className="h-[130px] bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 resize-none" data-testid="input-job-description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="resumeText" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Your Resume</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste your resume..." className="h-[130px] bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 resize-none" data-testid="input-resume-text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] h-11" disabled={generateMutation.isPending} data-testid="button-generate">
                {generateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Generate Cover Letter
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Generated Letter</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ready to copy or download</p>
            </div>
            {result && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 gap-1.5" data-testid="button-copy">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadText} className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 gap-1.5" data-testid="button-download">
                  <Download className="h-3.5 w-3.5" />
                  .txt
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 p-5 overflow-auto">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/85 font-mono bg-black/20 rounded-xl p-5 border border-white/5 min-h-full" data-testid="text-cover-letter">
                    {result}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-primary/60" />
                  </div>
                  <p className="font-medium text-white/50">Your letter will appear here</p>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">Fill in the details on the left and click generate to craft your personalized letter.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
