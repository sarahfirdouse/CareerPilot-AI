import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAnalyzeResume } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  resumeText: z.string().min(50, "Resume text is too short. Please paste your full resume."),
  jobDescription: z.string().min(50, "Job description is too short. Please paste the full description."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumeAnalyze() {
  const [result, setResult] = useState<any | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { resumeText: "", jobDescription: "" },
  });

  const analyzeMutation = useAnalyzeResume({
    mutation: { onSuccess: (data) => setResult(data) }
  });

  function onSubmit(data: FormValues) {
    analyzeMutation.mutate({ data });
  }

  const scoreColor = result ? (result.atsScore >= 70 ? "text-emerald-400" : result.atsScore >= 50 ? "text-amber-400" : "text-red-400") : "";
  const scoreGlow = result ? (result.atsScore >= 70 ? "shadow-[0_0_40px_rgba(16,185,129,0.2)]" : result.atsScore >= 50 ? "shadow-[0_0_40px_rgba(245,158,11,0.2)]" : "shadow-[0_0_40px_rgba(239,68,68,0.2)]") : "";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">AI Resume Analyzer</h1>
        <p className="text-muted-foreground mt-2">Compare your resume against a job description to boost your ATS score.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Input</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Paste your resume and the target job description.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="h-[180px] bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 resize-none focus-visible:ring-primary/50"
                        data-testid="input-job-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resumeText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Your Resume</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your resume text here..."
                        className="h-[180px] bg-black/30 border-white/10 text-white placeholder:text-muted-foreground/50 resize-none focus-visible:ring-primary/50"
                        data-testid="input-resume-text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] h-11"
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Analyzing with AI...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Analyze Fit
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className={`glass-panel rounded-2xl p-6 ${scoreGlow}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-white">ATS Match Score</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">How well your resume matches the job</p>
                    </div>
                    <div className={`text-5xl font-bold tabular-nums ${scoreColor}`} data-testid="text-ats-score">
                      {result.atsScore}%
                    </div>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.atsScore}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`absolute inset-y-0 left-0 rounded-full ${result.atsScore >= 70 ? "bg-emerald-400" : result.atsScore >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                    />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
                </div>

                {result.missingKeywords?.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <h3 className="font-semibold text-white text-sm">Missing Keywords</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.missingKeywords.map((kw: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-amber-400/60 shrink-0 mt-0.5" />
                          <span>{kw}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.suggestions?.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <h3 className="font-semibold text-white text-sm">Improvement Suggestions</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {result.suggestions.map((sugg: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed text-muted-foreground">{sugg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center border-dashed text-center p-10">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold text-white/60">Analysis Results</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">Fill out the form and run the analysis to see your ATS score and improvement plan.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
