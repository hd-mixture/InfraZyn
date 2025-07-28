
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
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  projectManager: z.string().min(1, 'Please select a project manager.'),
  revenue: z.coerce.number().optional(),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold']),
  priority: z.enum(['Low', 'Medium', 'High']),
  logo: z.any().optional(),
});

type User = {
    id: string;
    name: string;
    role: string;
    avatar?: string;
};

export function CreateProjectForm({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
    },
  });

  const fileRef = form.register('logo');

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
    if(open) {
        fetchManagers();
    }
  }, [open, toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        let logoUrl = '';
        if (values.logo && values.logo.length > 0) {
            const file = values.logo[0];
            const storageRef = ref(storage, `project-logos/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            logoUrl = await getDownloadURL(snapshot.ref);
        }

        const { logo, ...projectData } = values;

        const manager = managers.find(m => m.id === projectData.projectManager);
        if(!manager) {
            throw new Error('Selected manager not found');
        }

        const dataToSave: any = {
            ...projectData,
            projectManager: manager.name,
            logoUrl,
            startDate: Timestamp.fromDate(values.startDate),
            endDate: Timestamp.fromDate(values.endDate),
            createdAt: Timestamp.now()
        };

        if (projectData.revenue === undefined || projectData.revenue === null) {
            delete dataToSave.revenue;
        }

        await addDoc(collection(db, "projects"), dataToSave);

        await addDoc(collection(db, "activities"), {
            type: 'new_project',
            description: `New project "${projectData.projectName}" was created.`,
            timestamp: Timestamp.now()
        });

        toast({
            title: "Project Created!",
            description: "The new project has been successfully created.",
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new project.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 pr-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem key={manager.id} value={manager.id}>
                                    <div className='flex items-center gap-2'>
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={manager.avatar || `https://placehold.co/32x32.png`} data-ai-hint="person face" />
                                            <AvatarFallback>{manager.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{manager.name}</span>
                                    </div>
                                </SelectItem>
                                ))
                            )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="revenue"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Project Revenue (Optional)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                        ₹
                                    </span>
                                    <Input
                                        type="text"
                                        placeholder="0.00"
                                        className="pl-8"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*(\.\d{0,2})?$/.test(value)) {
                                            field.onChange(value === '' ? undefined : value);
                                            }
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                
                <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Logo</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="logo-upload"
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Upload Logo</span>
                                    </label>
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        {...fileRef}
                                    />
                                    {form.watch('logo') && form.watch('logo').length > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            {form.watch('logo')[0].name}
                                        </span>
                                    )}
                                </div>
                            </FormControl>
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
                        <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
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
                                    setIsStartDatePickerOpen(false);
                                }}
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
                        <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
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
                                    setIsEndDatePickerOpen(false);
                                }}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
