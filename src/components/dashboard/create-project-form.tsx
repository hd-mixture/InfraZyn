'use client';

import { useState, type ReactNode } from 'react';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  projectManager: z.string().min(1, 'Please select a project manager.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold']),
});

// Mock data - replace with actual data fetching from Firestore
const users = [
    { id: 'user1', name: 'Om prakash sao', role: 'manager' },
    { id: 'user2', name: 'Neilsan mando', role: 'manager' },
    { id: 'user3', name: 'Tiruvelly priya', role: 'manager' },
    { id: 'user4', name: 'Matte hannery', role: 'developer' },
];
const managers = users.filter(user => user.role === 'manager');


export function CreateProjectForm({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      description: '',
      status: 'Not Started',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    console.log('New Project Form values:', values);
    
    // Simulate API call to save to Firestore
    // In a real app, you would use the Firebase SDK here to add a document to the 'projects' collection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setOpen(false);
    form.reset();

    toast({
      title: "Project Created!",
      description: "The new project has been successfully created.",
    });
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
                      {managers.map(manager => (
                          <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                      ))}
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
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

            <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                    </>
                ) : (
                    'Create Project'
                )}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
