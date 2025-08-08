
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import type { Task } from './tasks-kanban-view';

const formSchema = z.object({
  reason: z.string().min(10, 'Please provide a clear reason for failure (min. 10 characters).'),
});

type FailTaskDialogProps = {
    task: Task;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function FailTaskDialog({ task, isOpen, onOpenChange }: FailTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, {
            status: 'In Progress', // Re-open the task for the QA
            verificationStatus: 'failed',
            failureCount: increment(1),
            reviewHistory: arrayUnion({
                status: 'failed',
                reason: values.reason,
                timestamp: serverTimestamp(),
                reviewedBy: localStorage.getItem('userName') || 'Admin'
            })
        });

        toast({
            title: "Task Marked as Failed",
            description: "The task has been sent back to the QA for revision.",
        });
        onOpenChange(false);
        form.reset();
    } catch(e) {
        console.error("Error failing task: ", e);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem updating the task.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fail Task: {task.taskName}</DialogTitle>
          <DialogDescription>
            Provide a reason for failing this task. This will be sent to the QA.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Failure</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Describe why the task failed verification..."
                                className="resize-none"
                                rows={5}
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Back to QA
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
