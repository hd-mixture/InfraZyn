'use client';

import { useState, type ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Project } from './project-summary';

const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  projectManager: z.string().min(1, 'Please select a project manager.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold', 'Delayed', 'At risk']),
  progress: z.number().min(0).max(100).optional(),
});

type User = {
    id: string;
    name: string;
    role: string;
};

type EditProjectFormProps = {
    project: Project;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function EditProjectForm({ project, isOpen, onOpenChange }: EditProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchManagers = async () => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("role", "==", "manager"));
            const querySnapshot = await getDocs(q);
            const fetchedManagers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setManagers(fetchedManagers);
        } catch(e) {
            console.error("Error fetching managers: ", e);
             toast({
                variant: "destructive",
                title: "Could not fetch managers.",
                description: "There was a problem fetching the list of project managers.",
            });
        }
    }
    if(isOpen) {
        fetchManagers();
    }
  }, [isOpen, toast]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        projectName: project.projectName,
        description: project.description,
        projectManager: project.projectManager,
        startDate: project.startDate.toDate(),
        endDate: project.endDate.toDate(),
        status: project.status as any, // Cast because zod enum is strict
        progress: project.progress,
    },
  });

   useEffect(() => {
    form.reset({
        projectName: project.projectName,
        description: project.description,
        projectManager: project.projectManager,
        startDate: project.startDate.toDate(),
        endDate: project.endDate.toDate(),
        status: project.status as any,
        progress: project.progress,
    })
   }, [project, form]);

   const status = form.watch('status');
   useEffect(() => {
    if (status === 'Completed') {
        form.setValue('progress', 100);
    } else if (status === 'Not Started') {
        form.setValue('progress', 0);
    }
   }, [status, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        const projectRef = doc(db, "projects", project.id);
        await updateDoc(projectRef, {
            ...values,
            startDate: Timestamp.fromDate(values.startDate),
            endDate: Timestamp.fromDate(values.endDate),
        });
        toast({
            title: "Project Updated!",
            description: "The project has been successfully updated.",
        });
        onOpenChange(false);
    } catch(e) {
        console.error("Error updating document: ", e);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the details for your project below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New E-commerce Platform" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a brief description of the project..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectManager"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Project Manager</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {managers.length === 0 ? (
                        <SelectItem value="no-manager" disabled>No managers found</SelectItem>
                      ) : (
                        managers.map(manager => (
                          <SelectItem key={manager.id} value={manager.name}>{manager.name}</SelectItem>
                        ))
                      )}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                            )}
                            >
                            {field.value ? (
                                format(field.value, 'PPP')
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                            )}
                            >
                            {field.value ? (
                                format(field.value, 'PPP')
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
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
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Delayed">Delayed</SelectItem>
                            <SelectItem value="At risk">At risk</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            {status === 'In Progress' && (
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider 
                          defaultValue={[field.value || 0]} 
                          max={100} 
                          step={1}
                          onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
