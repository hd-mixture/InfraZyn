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
import { CalendarIcon, Loader2, Upload, Paperclip, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, Timestamp, query, where, or, updateDoc } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import type { Task } from './tasks-kanban-view';
import axios from 'axios';
import Link from 'next/link';

const formSchema = z.object({
  taskName: z.string().min(1, 'Task name is required.'),
  description: z.string().optional(),
  project: z.string().min(1, 'Please select a project.'),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  attachments: z.any().optional(),
});

type Project = {
    id: string;
    projectName: string;
}

type EditTaskFormProps = {
    task: Task;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};


export function EditTaskForm({ task, isOpen, onOpenChange }: EditTaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState(task.attachmentUrls || []);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const attachmentsRef = form.register('attachments');

  useEffect(() => {
    if (task && isOpen) {
        form.reset({
            ...task,
            priority: task.priority,
            dueDate: task.dueDate.toDate(),
        });
        setCurrentAttachments(task.attachmentUrls || []);
    }
  }, [task, isOpen, form]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const projectRef = collection(db, "projects");
            const projectSnapshot = await getDocs(projectRef);
            const fetchedProjects = projectSnapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
            setProjects(fetchedProjects);

        } catch(e) {
            console.error("Error fetching data: ", e);
             toast({
                variant: "destructive",
                title: "Could not fetch data.",
                description: "There was a problem fetching projects.",
            });
        }
    }
    if(isOpen) {
        fetchData();
    }
  }, [isOpen, toast]);

    const removeAttachment = (urlToRemove: string) => {
        setCurrentAttachments(currentAttachments.filter(att => att.url !== urlToRemove));
    };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!task) return;
    setLoading(true);
    try {
        let newAttachmentUrls: { name: string, url: string }[] = [];
        if (values.attachments && values.attachments.length > 0) {
            for (const file of Array.from(values.attachments as FileList)) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
                
                const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                formData
                );
                newAttachmentUrls.push({ name: file.name, url: response.data.secure_url });
            }
        }

        const finalAttachments = [...currentAttachments, ...newAttachmentUrls];

        const { attachments, ...taskData } = values;

        const dataToUpdate: any = {
            ...taskData,
            dueDate: Timestamp.fromDate(values.dueDate),
            attachmentUrls: finalAttachments
        };

        if (!dataToUpdate.description) {
            delete dataToUpdate.description;
        }

        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, dataToUpdate);
        
        toast({
            title: "Task Updated!",
            description: "The task has been successfully updated.",
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


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details for your task below.
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
                
                <div className="grid grid-cols-2 gap-4">
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
                                        if (date) {
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
                </div>
                
                <div className="grid grid-cols-1">
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
                                    <SelectItem value="To Do">To Do</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    {currentAttachments.length > 0 && (
                        <div className="space-y-2 rounded-md border p-2">
                           {currentAttachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <a href={file.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline truncate">
                                        <Paperclip className="h-4 w-4" />
                                        <span className="truncate">{file.name}</span>
                                    </a>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(file.url)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                     <FormControl>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="attachments-upload-edit"
                                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 w-full justify-center"
                            >
                                <Upload className="h-4 w-4" />
                                <span>Upload New Files</span>
                            </label>
                            <Input
                                id="attachments-upload-edit"
                                type="file"
                                multiple
                                className="hidden"
                                {...attachmentsRef}
                            />
                        </div>
                    </FormControl>
                    {form.watch('attachments') && Array.from(form.watch('attachments') as FileList).length > 0 && (
                        <div className="text-xs text-muted-foreground pt-1">
                            Selected {Array.from(form.watch('attachments') as FileList).length} new file(s)
                        </div>
                    )}
                    <FormMessage />
                </FormItem>

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
