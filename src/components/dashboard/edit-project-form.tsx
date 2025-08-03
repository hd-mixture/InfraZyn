
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
  SelectSeparator,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, Timestamp, query, where, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import type { Project } from './project-summary';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import axios from 'axios';

const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  projectManager: z.string().optional(),
  revenue: z.any().optional(),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold', 'Delayed', 'At risk']),
  priority: z.enum(['Low', 'Medium', 'High']),
  progress: z.number().min(0).max(100).optional(),
  logo: z.any().optional(),
});

type User = {
    id: string;
    name: string;
    role: string;
    avatar?: string;
};

type EditProjectFormProps = {
    project: Omit<Project, 'createdAt'> | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const ASSIGN_LATER_VALUE = '_assign_later_';

export function EditProjectForm({ project, isOpen, onOpenChange }: EditProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
    if(isOpen) {
        fetchManagers();
    }
  }, [isOpen, toast]);
  

   useEffect(() => {
    if (project && managers.length > 0 && isOpen) {
        const manager = managers.find(m => m.name === project.projectManager);
        form.reset({
            ...project,
            projectManager: manager ? manager.id : ASSIGN_LATER_VALUE,
            revenue: project.revenue ?? '',
            progress: project.progress ?? 0,
            startDate: project.startDate.toDate(),
            endDate: project.endDate.toDate(),
            status: project.status as any,
        });
    }
    if (project && !project.projectManager && isOpen) {
         form.reset({
            ...project,
            projectManager: ASSIGN_LATER_VALUE,
            revenue: project.revenue ?? '',
            progress: project.progress ?? 0,
            startDate: project.startDate.toDate(),
            endDate: project.endDate.toDate(),
            status: project.status as any,
        });
    }
   }, [project, form, isOpen, managers]);

   const status = form.watch('status');
   useEffect(() => {
    if (status === 'Completed') {
        form.setValue('progress', 100);
    } else if (status === 'Not Started' || status === 'On Hold') {
        form.setValue('progress', 0);
    }
   }, [status, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!project) return;
    setLoading(true);
    try {
        let logoUrl = project.logoUrl;
        if (values.logo && values.logo.length > 0) {
            const file = values.logo[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
            
            const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData
            );
            
            logoUrl = response.data.secure_url;
        }

        const projectRef = doc(db, "projects", project.id);
        
        let managerName = '';
        let newManagerId: string | undefined;

        if (values.projectManager && values.projectManager !== ASSIGN_LATER_VALUE) {
            const manager = managers.find(m => m.id === values.projectManager);
            if (manager) {
                managerName = manager.name;
                newManagerId = manager.id;
            }
        }
        
        const { logo, ...projectData } = values;

        const dataToUpdate: any = {
            ...projectData,
            logoUrl,
            projectManager: managerName,
            progress: values.progress === undefined ? null : values.progress,
            startDate: Timestamp.fromDate(values.startDate),
            endDate: Timestamp.fromDate(values.endDate),
        };
        
        const revenueValue = values.revenue;
        if (revenueValue === undefined || revenueValue === null || revenueValue === '') {
          dataToUpdate.revenue = null;
        } else {
          dataToUpdate.revenue = parseFloat(revenueValue as string);
        }

        await updateDoc(projectRef, dataToUpdate);
        
        // Send notification if manager has changed to a new one
        if (newManagerId && managerName !== project.projectManager) {
            await addDoc(collection(db, `users/${newManagerId}/notifications`), {
                type: 'project_assignment',
                recipientId: newManagerId,
                senderName: localStorage.getItem('adminName') || 'Admin',
                senderAvatar: localStorage.getItem('adminAvatar') || null,
                projectId: project.id,
                projectName: values.projectName,
                messageSnippet: `You have been assigned to project: ${values.projectName}`,
                read: false,
                createdAt: Timestamp.now(),
            });
        }


        await addDoc(collection(db, "activities"), {
            type: 'project_update',
            description: `Project "${values.projectName}" was updated.`,
            timestamp: Timestamp.now()
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

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the details for your project below.
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                            <SelectSeparator />
                             <SelectItem value={ASSIGN_LATER_VALUE}>
                                Assign Later
                             </SelectItem>
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
                                                field.onChange(value);
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
                            <FormLabel>Update Project Logo (Optional)</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="logo-update-upload"
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Upload New Logo</span>
                                    </label>
                                    <Input
                                        id="logo-update-upload"
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
                                    if(date) field.onChange(date);
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
                                    if(date) field.onChange(date);
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {(status === 'In Progress' || status === 'Delayed' || status === 'At risk') && (
                <FormField
                    control={form.control}
                    name="progress"
                    render={({ field: { onChange, value } }) => (
                    <FormItem>
                        <FormLabel>Progress: {value ?? 0}%</FormLabel>
                        <FormControl>
                        <Slider 
                            defaultValue={[value || 0]} 
                            max={100} 
                            step={1}
                            onValueChange={(vals) => onChange(vals[0])}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

