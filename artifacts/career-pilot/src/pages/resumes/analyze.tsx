import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAnalyzeResume } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  resumeText: z.string().min(50, "Resume text is too short. Please paste your full resume."),
  jobDescription: z.string().min(50, "Job description is too short. Please paste the full description."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumeAnalyze() {
  const [result, setResult] = useState<any | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: "",
      jobDescription: "",
    },
  });

  const analyzeMutation = useAnalyzeResume({
    mutation: {
      onSuccess: (data) => setResult(data),
    }
  });

  function onSubmit(data: FormValues) {
    analyzeMutation.mutate({ data });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Resume Analyzer</h1>
        <p className="text-muted-foreground mt-2">Compare your resume against a job description to find missing keywords and skill gaps.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
            <CardDescription>Paste your resume text and the target job description.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste the full job description here..." className="h-[200px]" {...field} />
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
                      <FormLabel>Your Resume</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste your resume text here..." className="h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Analyze Fit</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div>
          {result ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Match Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <Progress value={result.atsScore} className="h-4" />
                    </div>
                    <div className="text-4xl font-bold text-primary">{result.atsScore}%</div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{result.feedback}</p>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Missing Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(result.missingKeywords || []).map((kw: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{kw}</span>
                        </li>
                      ))}
                      {result.missingKeywords?.length === 0 && <p className="text-sm text-muted-foreground">No critical keywords missing!</p>}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(result.suggestions || []).map((sugg: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm bg-secondary/50 p-3 rounded-md">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{sugg}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="h-full border-dashed flex items-center justify-center bg-muted/20">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium text-muted-foreground">Analysis Results</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Fill out the form and run the analysis to see how well your resume matches the job description.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
