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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash, BookOpen } from "lucide-react";
import { toast } from "sonner";

const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().optional(),
  category: z.nativeEnum(InterviewQuestionCategory),
  difficulty: z.nativeEnum(InterviewQuestionDifficulty).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
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
      category: InterviewQuestionCategory.general,
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
        toast.success("Question deleted");
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
    form.reset({
      question: "", answer: "", category: InterviewQuestionCategory.behavioral, difficulty: InterviewQuestionDifficulty.medium,
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Prep</h1>
          <p className="text-muted-foreground mt-2">Practice and organize your interview answers.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      <div className="flex gap-2 pb-4 overflow-x-auto">
        <Button variant={filterCategory === "all" ? "default" : "outline"} onClick={() => setFilterCategory("all")} className="rounded-full">All</Button>
        {Object.values(InterviewQuestionCategory).map((cat) => (
          <Button 
            key={cat} 
            variant={filterCategory === cat ? "default" : "outline"} 
            onClick={() => setFilterCategory(cat)} 
            className="rounded-full capitalize"
          >
            {cat.replace("_", " ")}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">Loading questions...</div>
      ) : questions?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">No questions found</h3>
            <p className="text-muted-foreground mt-2 mb-6">Add common interview questions to start practicing.</p>
            <Button onClick={openNew}>Add Question</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questions?.map((q) => (
            <Card key={q.id} className="flex flex-col">
              <CardHeader className="pb-3 flex-row items-start justify-between gap-4 space-y-0">
                <CardTitle className="text-lg leading-tight">{q.question}</CardTitle>
                <Badge variant="secondary" className="shrink-0 capitalize">{q.category.replace("_", " ")}</Badge>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-md h-full">
                  {q.answer || "No answer drafted yet."}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex justify-between items-center">
                {q.difficulty && (
                  <Badge variant="outline" className={`capitalize border-transparent ${DIFFICULTY_COLORS[q.difficulty as keyof typeof DIFFICULTY_COLORS]}`}>
                    {q.difficulty}
                  </Badge>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(q.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>Draft your answer using the STAR method.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="question" render={({ field }) => (
                <FormItem><FormLabel>Question</FormLabel><FormControl><Input placeholder="Tell me about a time..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.values(InterviewQuestionCategory).map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">{cat.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.values(InterviewQuestionDifficulty).map((diff) => (
                          <SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="answer" render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Answer (STAR Method)</FormLabel>
                  <FormControl><Textarea placeholder="Situation, Task, Action, Result..." className="min-h-[200px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this question? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
