
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Upload, Paperclip, X, Code, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, query, where, or } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  taskName: z.string().min(1, 'Task name is required.'),
  description: z.string().optional(),
  project: z.string().min(1, 'Please select a project.'),
  assigneeRole: z.enum(['developer', 'qa'], { required_error: 'You must select an assignee role.'}),
  assignedTo: z.string().min(1, 'Please assign the task to a user.'),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  priority: z.enum(['Low', 'Medium', 'High']),
  attachments: z.any().optional(),
});

type User = {
    id: string;
    name: string;
    role: string;
};

type Project = {
    id: string;
    projectName: string;
}

export function CreateTaskForm({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      attachments: null,
    },
  });

  const attachmentsRef = form.register('attachments');
  const watchedFiles = form.watch('attachments');
  const selectedRole = form.watch('assigneeRole');

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch users (developer or qa)
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, or(where("role", "==", "developer"), where("role", "==", "qa")));
            const userSnapshot = await getDocs(userQuery);
            const fetchedUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(fetchedUsers);

            // Fetch projects
            const projectRef = collection(db, "projects");
            const projectSnapshot = await getDocs(projectRef);
            const fetchedProjects = projectSnapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
            setProjects(fetchedProjects);

        } catch(e) {
            console.error("Error fetching data: ", e);
             toast({
                variant: "destructive",
                title: "Could not fetch data.",
                description: "There was a problem fetching users and projects.",
            });
        }
    }
    if(open) {
        fetchData();
    }
  }, [open, toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        let attachmentUrls: { name: string, url: string }[] = [];
        if (values.attachments && values.attachments.length > 0) {
            for (const file of Array.from(values.attachments as FileList)) {
                const storageRef = ref(storage, `task-attachments/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                attachmentUrls.push({ name: file.name, url });
            }
        }

        const { attachments, ...taskData } = values;

        const dataToSave = {
            ...taskData,
            dueDate: Timestamp.fromDate(values.dueDate),
            createdAt: Timestamp.now(),
            attachmentUrls,
        };

        await addDoc(collection(db, "tasks"), dataToSave);
        
        toast({
            title: "Task Created!",
            description: "The new task has been successfully created.",
        });
        setOpen(false);
        form.reset();
    } catch(e) {
        console.error("Error adding document: ", e);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
        });
    } finally {
        setLoading(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        form.reset();
    }
    setOpen(isOpen);
  }
  
  const availableUsers = users.filter(u => u.role === selectedRole);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new task.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 pr-4">
                <FormField
                    control={form.control}
                    name="project"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taskName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Implement user login feature" {...field} />
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
                        <FormLabel>Task Description</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Add a brief description of the task..."
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
                    name="assigneeRole"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Assignee Role</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                form.resetField('assignedTo');
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <div className="flex items-center p-4 border rounded-md has-[:checked]:border-primary cursor-pointer w-full">
                                    <RadioGroupItem value="developer" id="developer" className="sr-only" />
                                    <Code className="mr-3 h-6 w-6" />
                                    <div className='flex flex-col'>
                                        <FormLabel htmlFor="developer" className="font-semibold cursor-pointer">
                                        Developer
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">For technical implementation tasks.</p>
                                    </div>
                                </div>
                                </FormControl>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <div className="flex items-center p-4 border rounded-md has-[:checked]:border-primary cursor-pointer w-full">
                                    <RadioGroupItem value="qa" id="qa" className="sr-only" />
                                    <ShieldCheck className="mr-3 h-6 w-6" />
                                    <div className='flex flex-col'>
                                        <FormLabel htmlFor="qa" className="font-semibold cursor-pointer">
                                        QA Tester
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">For testing and quality assurance tasks.</p>
                                    </div>
                                   </div>
                                </FormControl>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRole}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={selectedRole ? "Select a user" : "Select a role first"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {availableUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                                {selectedRole && availableUsers.length === 0 && (
                                    <SelectItem value="no-users" disabled>No {selectedRole}s found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover open={isDueDatePickerOpen} onOpenChange={setIsDueDatePickerOpen}>
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
                                    onSelect={(date) => {
                                        field.onChange(date);
                                        setIsDueDatePickerOpen(false);
                                    }}
                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                                <Input {...field} disabled className="bg-muted/70" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                

                <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Task
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
