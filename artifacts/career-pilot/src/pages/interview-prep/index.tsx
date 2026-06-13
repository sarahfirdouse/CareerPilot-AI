import { useState } from "react";
import { useListInterviewQuestions, useCreateInterviewQuestion, useUpdateInterviewQuestion, useDeleteInterviewQuestion, getListInterviewQuestionsQueryKey, InterviewQuestionCategory, InterviewQuestionDifficulty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().optional(),
  category: z.nativeEnum(InterviewQuestionCategory),
  difficulty: z.nativeEnum(InterviewQuestionDifficulty).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  behavioral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  general: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function InterviewPrep() {
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { data: questions, isLoading } = useListInterviewQuestions({
    category: filterCategory !== "all" ? filterCategory : undefined
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: InterviewQuestionCategory.behavioral,
      difficulty: InterviewQuestionDifficulty.medium,
    },
  });

  const createMutation = useCreateInterviewQuestion({
    mutation: {
      onSuccess: () => {
        toast.success("Question added");
        queryClient.invalidateQueries({ queryKey: getListInterviewQuestionsQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => toast.error("Failed to add question"),
    }
  });

  const updateMutation = useUpdateInterviewQuestion({
    mutation: {
      onSuccess: () => {
        toast.success("Question updated");
        queryClient.invalidateQueries({ queryKey: getListInterviewQuestionsQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => toast.error("Failed to update question"),
    }
  });

  const deleteMutation = useDeleteInterviewQuestion({
    mutation: {
      onSuccess: () => {
        toast.success("Question removed");
        queryClient.invalidateQueries({ queryKey: getListInterviewQuestionsQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete question"),
    }
  });

  function onSubmit(data: QuestionFormValues) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  function openEdit(question: any) {
    setEditingId(question.id);
    form.reset({
      question: question.question,
      answer: question.answer || "",
      category: question.category,
      difficulty: question.difficulty || InterviewQuestionDifficulty.medium,
    });
    setIsDialogOpen(true);
  }

  function openNew() {
    setEditingId(null);
    form.reset({ question: "", answer: "", category: InterviewQuestionCategory.behavioral, difficulty: InterviewQuestionDifficulty.medium });
    setIsDialogOpen(true);
  }

  const filterTabs = ["all", ...Object.values(InterviewQuestionCategory)];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Interview Prep</h1>
          <p className="text-muted-foreground mt-2">Build your answer bank and master every question.</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]" data-testid="button-add-question">
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {filterTabs.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            data-testid={`filter-${cat}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
              filterCategory === cat
                ? "bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 gap-2 text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading questions...
        </div>
      ) : questions?.length === 0 ? (
        <motion.div variants={item} className="glass-panel rounded-2xl py-16 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <h3 className="text-xl font-semibold text-white">No questions found</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-xs mx-auto">Build your answer library to nail every interview.</p>
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90">Add First Question</Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questions?.map((q, i) => (
            <motion.div
              key={q.id}
              data-testid={`card-question-${q.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              className="glass-panel rounded-2xl flex flex-col hover:border-white/10 transition-all duration-300 group"
            >
              <div className="p-5 pb-3 flex items-start justify-between gap-3">
                <p className="font-medium text-white leading-snug flex-1">{q.question}</p>
                <Badge variant="outline" className={`shrink-0 capitalize text-xs font-medium ${CATEGORY_COLORS[q.category] || ""}`}>
                  {q.category.replace("_", " ")}
                </Badge>
              </div>

              <div className="px-5 py-3 flex-1">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-xl border border-white/5 min-h-[80px]">
                  {q.answer || <span className="italic opacity-50">No answer drafted yet. Click edit to add your response.</span>}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                {q.difficulty ? (
                  <Badge variant="outline" className={`capitalize text-xs ${DIFFICULTY_COLORS[q.difficulty as keyof typeof DIFFICULTY_COLORS]}`}>
                    {q.difficulty}
                  </Badge>
                ) : <div />}
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(q)} className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" data-testid={`button-edit-question-${q.id}`}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(q.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10" data-testid={`button-delete-question-${q.id}`}>
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingId ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Draft your answer using the STAR method: Situation, Task, Action, Result.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="question" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Question</FormLabel>
                  <FormControl><Input placeholder="Tell me about a time..." className="bg-black/30 border-white/10 text-white" data-testid="input-question" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/30 border-white/10 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                        {Object.values(InterviewQuestionCategory).map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize hover:bg-white/10 focus:bg-white/10">{cat.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/30 border-white/10 text-white">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                        {Object.values(InterviewQuestionDifficulty).map((diff) => (
                          <SelectItem key={diff} value={diff} className="capitalize hover:bg-white/10 focus:bg-white/10">{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="answer" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Your Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Situation: ... Task: ... Action: ... Result: ..."
                      className="min-h-[180px] bg-black/30 border-white/10 text-white font-mono text-sm"
                      data-testid="input-answer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white hover:bg-white/5">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-question" className="bg-primary hover:bg-primary/90">
                  {(createMutation.isPending || updateMutation.isPending) && <div className="mr-2 h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Question</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This will permanently delete this question and any answers you&apos;ve drafted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
