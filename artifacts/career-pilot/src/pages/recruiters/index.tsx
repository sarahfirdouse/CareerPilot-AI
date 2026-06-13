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
import { Plus, MoreHorizontal, Edit, Trash, Mail, Linkedin, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

export default function RecruitersList() {
  const queryClient = useQueryClient();
  const { data: recruiters, isLoading } = useListRecruiters();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      linkedin: "",
      phone: "",
      notes: "",
      followUpDate: "",
    },
  });

  const createMutation = useCreateRecruiter({
    mutation: {
      onSuccess: () => {
        toast.success("Recruiter added");
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => toast.error("Failed to add recruiter"),
    }
  });

  const updateMutation = useUpdateRecruiter({
    mutation: {
      onSuccess: () => {
        toast.success("Recruiter updated");
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => toast.error("Failed to update recruiter"),
    }
  });

  const deleteMutation = useDeleteRecruiter({
    mutation: {
      onSuccess: () => {
        toast.success("Recruiter deleted");
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete recruiter"),
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
    form.reset({
      name: "", company: "", email: "", linkedin: "", phone: "", notes: "", followUpDate: "",
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruiter CRM</h1>
          <p className="text-muted-foreground mt-2">Manage your contacts and follow-ups.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Follow Up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading recruiters...</TableCell></TableRow>
            ) : recruiters?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">No contacts found.</TableCell></TableRow>
            ) : (
              recruiters?.map((recruiter) => (
                <TableRow key={recruiter.id}>
                  <TableCell className="font-medium">{recruiter.name}</TableCell>
                  <TableCell>{recruiter.company}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {recruiter.email && (
                        <a href={`mailto:${recruiter.email}`} className="text-muted-foreground hover:text-primary">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {recruiter.linkedin && (
                        <a href={recruiter.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {recruiter.phone && (
                        <a href={`tel:${recruiter.phone}`} className="text-muted-foreground hover:text-primary" title={recruiter.phone}>
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {recruiter.followUpDate ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(recruiter.followUpDate), "MMM d, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(recruiter)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(recruiter.id)} className="text-destructive focus:bg-destructive/10">
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>Save details about a recruiter or hiring manager.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="linkedin" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="followUpDate" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Follow-up Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save Contact</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this recruiter contact? This action cannot be undone.</AlertDialogDescription>
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
