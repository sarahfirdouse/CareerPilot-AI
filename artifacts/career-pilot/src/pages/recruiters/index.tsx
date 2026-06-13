import { useState } from "react";
import { useListRecruiters, useCreateRecruiter, useUpdateRecruiter, useDeleteRecruiter, getListRecruitersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Edit, Trash, Mail, Linkedin, Phone, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

const recruiterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional().or(z.literal("")),
});

type RecruiterFormValues = z.infer<typeof recruiterSchema>;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function RecruitersList() {
  const queryClient = useQueryClient();
  const { data: recruiters, isLoading } = useListRecruiters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: { name: "", company: "", email: "", linkedin: "", phone: "", notes: "", followUpDate: "" },
  });

  const createMutation = useCreateRecruiter({
    mutation: {
      onSuccess: () => {
        toast.success("Contact added to your network");
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => toast.error("Failed to add contact"),
    }
  });

  const updateMutation = useUpdateRecruiter({
    mutation: {
      onSuccess: () => {
        toast.success("Contact updated");
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => toast.error("Failed to update contact"),
    }
  });

  const deleteMutation = useDeleteRecruiter({
    mutation: {
      onSuccess: () => {
        toast.success("Contact removed");
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete contact"),
    }
  });

  function onSubmit(data: RecruiterFormValues) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  function openEdit(recruiter: any) {
    setEditingId(recruiter.id);
    form.reset({
      name: recruiter.name,
      company: recruiter.company,
      email: recruiter.email || "",
      linkedin: recruiter.linkedin || "",
      phone: recruiter.phone || "",
      notes: recruiter.notes || "",
      followUpDate: recruiter.followUpDate ? format(new Date(recruiter.followUpDate), "yyyy-MM-dd") : "",
    });
    setIsDialogOpen(true);
  }

  function openNew() {
    setEditingId(null);
    form.reset({ name: "", company: "", email: "", linkedin: "", phone: "", notes: "", followUpDate: "" });
    setIsDialogOpen(true);
  }

  const isOverdue = (date: string) => new Date(date) < new Date();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Recruiter CRM</h1>
          <p className="text-muted-foreground mt-2">Manage your network and never miss a follow-up.</p>
        </div>
        <Button onClick={openNew} data-testid="button-add-contact" className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Name</TableHead>
              <TableHead className="text-muted-foreground font-medium">Company</TableHead>
              <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
              <TableHead className="text-muted-foreground font-medium">Follow Up</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading contacts...
                  </div>
                </TableCell>
              </TableRow>
            ) : recruiters?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-30" />
                    <div>
                      <p className="font-medium text-white/60">No contacts yet</p>
                      <p className="text-sm mt-1">Add recruiters and hiring managers to track your network.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              recruiters?.map((recruiter) => (
                <TableRow key={recruiter.id} data-testid={`row-recruiter-${recruiter.id}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-white">{recruiter.name}</TableCell>
                  <TableCell className="text-white/80">{recruiter.company}</TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      {recruiter.email && (
                        <a href={`mailto:${recruiter.email}`} className="text-muted-foreground hover:text-primary transition-colors" title={recruiter.email}>
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {recruiter.linkedin && (
                        <a href={recruiter.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-blue-400 transition-colors">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {recruiter.phone && (
                        <a href={`tel:${recruiter.phone}`} className="text-muted-foreground hover:text-primary transition-colors" title={recruiter.phone}>
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {recruiter.followUpDate ? (
                      <div className={`flex items-center gap-2 text-sm font-medium ${isOverdue(recruiter.followUpDate) ? "text-red-400" : "text-emerald-400"}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(recruiter.followUpDate), "MMM d, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/10" data-testid={`button-actions-${recruiter.id}`}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10">
                        <DropdownMenuItem onClick={() => openEdit(recruiter)} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(recruiter.id)} className="text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer">
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingId ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Save details about a recruiter or hiring manager.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Name</FormLabel>
                    <FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Company</FormLabel>
                    <FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-company" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Email</FormLabel>
                    <FormControl><Input type="email" className="bg-black/30 border-white/10 text-white" data-testid="input-email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Phone</FormLabel>
                    <FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="linkedin" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-white/80">LinkedIn URL</FormLabel>
                    <FormControl><Input className="bg-black/30 border-white/10 text-white" data-testid="input-linkedin" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="followUpDate" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-white/80">Follow-up Date</FormLabel>
                    <FormControl><Input type="date" className="bg-black/30 border-white/10 text-white" data-testid="input-followup-date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-white/80">Notes</FormLabel>
                    <FormControl><Textarea className="bg-black/30 border-white/10 text-white resize-none" rows={3} data-testid="input-notes" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white hover:bg-white/5">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-contact" className="bg-primary hover:bg-primary/90">
                  {(createMutation.isPending || updateMutation.isPending) && <div className="mr-2 h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Save Contact
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove Contact</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This will permanently remove this contact from your CRM.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
