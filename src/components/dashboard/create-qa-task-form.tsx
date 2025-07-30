'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, query, where } from 'firebase/firestore';
import axios from 'axios';
import type { Project } from './project-summary';

const formSchema = z.object({
  testCaseTitle: z.string().min(1, 'Test case title is required.'),
  relatedModule: z.string().min(1, 'Please select a related project/module.'),
  testDescription: z.string().optional(),
  assignedTo: z.string().min(1, 'Please assign the task to a QA.'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  deadline: z.date({ required_error: 'A deadline is required.' }),
  testType: z.enum(['Manual', 'Automation', 'Regression', 'Smoke']),
  bugSeverity: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  expectedResult: z.string().optional(),
  testData: z.string().optional(),
  attachments: z.any().optional(),
});

type User = {
    id: string;
    name: string;
};

type CreateQATaskFormProps = {
    onSuccess: () => void;
    userRole: 'admin' | 'manager';
    managerName?: string | null;
}

export function CreateQATaskForm({ onSuccess, userRole, managerName }: CreateQATaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testCaseTitle: '',
      relatedModule: '',
      testDescription: '',
      assignedTo: '',
      priority: 'Medium',
      testType: 'Manual',
      expectedResult: '',
      testData: '',
      attachments: undefined,
      bugSeverity: undefined,
    },
  });

  const attachmentsRef = form.register('attachments');

  useEffect(() => {
    const fetchData = async () => {
        try {
            if (userRole === 'manager' && managerName) {
                // Fetch projects managed by this manager
                const projectsQuery = query(collection(db, "projects"), where("projectManager", "==", managerName));
                const projectSnapshot = await getDocs(projectsQuery);
                const managerProjects = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                setProjects(managerProjects);

                if (managerProjects.length === 0) {
                    setUsers([]);
                    return;
                }
                
                // Fetch tasks for those projects to find team members
                const projectIds = managerProjects.map(p => p.id);
                const tasksQuery = query(collection(db, "tasks"), where("project", "in", projectIds));
                const tasksSnapshot = await getDocs(tasksQuery);
                const teamMemberNames = new Set(tasksSnapshot.docs.map(doc => doc.data().assignedTo));
                
                // Fetch users added by this manager
                const addedByQuery = query(collection(db, "users"), where("addedBy", "==", managerName), where("role", "==", "qa"));
                const addedBySnapshot = await getDocs(addedByQuery);
                addedBySnapshot.forEach(doc => teamMemberNames.add(doc.data().name));
                
                // Fetch full user details for the team members
                 if (teamMemberNames.size > 0) {
                    const usersQuery = query(collection(db, "users"), where("name", "in", Array.from(teamMemberNames)), where("role", "==", "qa"));
                    const userSnapshot = await getDocs(usersQuery);
                    const fetchedUsers = userSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as User));
                    setUsers(fetchedUsers);
                } else {
                    setUsers([]);
                }
            } else { // Admin role
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("role", "==", "qa"));
                const userSnapshot = await getDocs(userQuery);
                const fetchedUsers = userSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as User));
                setUsers(fetchedUsers);

                const projectQuery = query(collection(db, "projects"));
                const projectSnapshot = await getDocs(projectQuery);
                const fetchedProjects = projectSnapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
                setProjects(fetchedProjects);
            }

        } catch(e) {
            console.error("Error fetching data: ", e);
             toast({
                variant: "destructive",
                title: "Could not fetch data.",
                description: "There was a problem fetching users and projects.",
            });
        }
    }
    fetchData();
  }, [toast, userRole, managerName]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        let attachmentUrls: { name: string, url: string }[] = [];
        if (values.attachments && values.attachments.length > 0) {
            for (const file of Array.from(values.attachments as FileList)) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
                
                const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                formData
                );
                attachmentUrls.push({ name: file.name, url: response.data.secure_url });
            }
        }

        const { attachments, ...taskData } = values;
        const assignee = users.find(u => u.id === taskData.assignedTo);
        if(!assignee) {
            throw new Error('Selected QA not found');
        }
        
        const dataToSave: any = {
            ...taskData,
            taskName: values.testCaseTitle,
            project: values.relatedModule,
            assignedTo: assignee.name,
            taskRole: 'qa',
            status: 'To Do',
            dueDate: Timestamp.fromDate(values.deadline),
            createdAt: Timestamp.now(),
            attachmentUrls,
        };

        // Remove optional fields if they are empty
        if (!dataToSave.testDescription) delete dataToSave.testDescription;
        if (!dataToSave.bugSeverity) delete dataToSave.bugSeverity;
        if (!dataToSave.expectedResult) delete dataToSave.expectedResult;
        if (!dataToSave.testData) delete dataToSave.testData;


        await addDoc(collection(db, "tasks"), dataToSave);
        
        toast({
            title: "QA Task Created!",
            description: "The new testing task has been successfully created.",
        });
        onSuccess();
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

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 border-t pt-6">
        <FormField
            control={form.control}
            name="testCaseTitle"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Test Case Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Verify user login with valid credentials" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="relatedModule"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Related Module / Project</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="testDescription"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Test Description / Objective</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="Describe the purpose of this test case..."
                    className="resize-none"
                    rows={3}
                    {...field}
                    />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a QA" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
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
                name="deadline"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Deadline / Target Test Date</FormLabel>
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
                                if(date) {
                                    field.onChange(date);
                                    setIsDueDatePickerOpen(false);
                                }
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
                name="testType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Test Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Manual">Manual</SelectItem>
                            <SelectItem value="Automation">Automation</SelectItem>
                            <SelectItem value="Regression">Regression</SelectItem>
                            <SelectItem value="Smoke">Smoke</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="expectedResult"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Expected Result (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., User should be redirected to the dashboard" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            control={form.control}
            name="testData"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Test Data Requirements (Optional)</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="e.g., User: test@example.com, Pass: password123"
                    className="resize-none"
                    rows={2}
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Attachments (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="attachments-upload-qa"
                                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 w-full justify-center"
                            >
                                <Upload className="h-4 w-4" />
                                <span>Upload Files</span>
                            </label>
                            <Input
                                id="attachments-upload-qa"
                                type="file"
                                multiple
                                className="hidden"
                                {...attachmentsRef}
                            />
                        </div>
                    </FormControl>
                    {form.watch('attachments') && Array.from(form.watch('attachments') as FileList).length > 0 && (
                        <div className="text-xs text-muted-foreground pt-1">
                            Selected {Array.from(form.watch('attachments') as FileList).length} file(s)
                        </div>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <DialogFooter className="pt-4">
        <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create QA Task
        </Button>
        </DialogFooter>
    </form>
    </Form>
  );
}
