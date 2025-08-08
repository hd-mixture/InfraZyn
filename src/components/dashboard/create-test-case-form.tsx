
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  projectId: z.string().min(1, 'Project is required.'),
  status: z.enum(['Draft', 'Ready for Review', 'Approved', 'Deprecated']),
  priority: z.enum(['Low', 'Medium', 'High']),
  preconditions: z.string().optional(),
  steps: z.array(z.object({ value: z.string().min(1, 'Step cannot be empty.') })),
  expectedResult: z.string().optional(),
});

type Project = {
    id: string;
    projectName: string;
};

type User = {
    id: string;
    name: string;
    addedBy?: string;
}

type CreateTestCaseFormProps = {
    children: React.ReactNode;
    qaName: string | null;
    projects: Project[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function CreateTestCaseForm({ children, qaName, projects: allProjects, isOpen, onOpenChange }: CreateTestCaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      projectId: '',
      status: 'Draft',
      priority: 'Medium',
      preconditions: '',
      steps: [{ value: '' }],
      expectedResult: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });
  
  useEffect(() => {
    const getManagerForQA = async () => {
        if (!qaName) return null;
        const usersQuery = query(collection(db, 'users'), where('name', '==', qaName));
        const userSnapshot = await getDocs(usersQuery);
        if (!userSnapshot.empty) {
            const qaData = userSnapshot.docs[0].data() as User;
            return qaData.addedBy; // This is the manager's name
        }
        return null;
    }
    
    const fetchProjects = async () => {
        const managerName = await getManagerForQA();
        if (managerName) {
            const projectsQuery = query(collection(db, 'projects'), where('projectManager', '==', managerName));
            const projectsSnapshot = await getDocs(projectsQuery);
            const userProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
            setFilteredProjects(userProjects);
        } else {
            // Fallback for QA not assigned to a manager, show all projects (or none)
            setFilteredProjects(allProjects);
        }
    };
    
    if (isOpen) {
        fetchProjects();
    }
  }, [isOpen, qaName, allProjects]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!qaName) return;
    setLoading(true);
    try {
        const stepsArray = values.steps.map(s => s.value);

        await addDoc(collection(db, 'testCases'), {
            ...values,
            steps: stepsArray,
            createdBy: qaName,
            createdAt: Timestamp.now(),
        });
        toast({ title: 'Test Case Created!', description: 'Your new test case has been saved.' });
        onOpenChange(false);
        form.reset();
    } catch (error) {
        console.error("Error creating test case: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create test case.' });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Create a New Test Case</DialogTitle>
                <DialogDescription>
                    Define the steps and expected outcomes for a test scenario.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[65vh] -mx-6 px-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Test Case Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="projectId" render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Project</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredProjects.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">No projects found.</div>
                                        ) : (
                                            filteredProjects.map(p => (<SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>))
                                        )}
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="priority" render={({ field }) => (
                                <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="preconditions" render={({ field }) => (
                            <FormItem><FormLabel>Preconditions (Optional)</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="e.g., User is logged in with an admin account." /></FormControl><FormMessage /></FormItem>
                        )}/>

                        <div>
                            <FormLabel>Test Steps</FormLabel>
                            <div className="space-y-2 mt-2">
                                {fields.map((field, index) => (
                                    <FormField key={field.id} control={form.control} name={`steps.${index}.value`} render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                                                <FormControl><Input {...field} placeholder={`Step ${index + 1}`} /></FormControl>
                                                {fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}><Plus className="mr-2 h-4 w-4" /> Add Step</Button>
                            </div>
                        </div>

                        <FormField control={form.control} name="expectedResult" render={({ field }) => (
                            <FormItem><FormLabel>Expected Result (Optional)</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="e.g., A success message appears and the user is redirected." /></FormControl><FormMessage /></FormItem>
                        )}/>
                        
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Set status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Ready for Review">Ready for Review</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Deprecated">Deprecated</SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )}/>

                        <DialogFooter className="pt-4 !justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Test Case
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </ScrollArea>
        </DialogContent>
    </Dialog>
  );
}
