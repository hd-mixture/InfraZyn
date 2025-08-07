
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
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import axios from 'axios';
import type { DesignTask } from './assigned-designs-view';

const formSchema = z.object({
  completionNotes: z.string().optional(),
  attachments: z.any().refine((files) => files?.length >= 1, 'At least one file is required.'),
});

type CompleteDesignTaskDialogProps = {
    task: DesignTask;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: () => void;
};

export function CompleteDesignTaskDialog({ task, isOpen, onOpenChange, onSuccess }: CompleteDesignTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      completionNotes: '',
      attachments: undefined,
    },
  });
  
  const attachmentsRef = form.register('attachments');

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

        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, {
            status: 'Done',
            progress: 100,
            completionNotes: values.completionNotes,
            completionAttachments: attachmentUrls,
            completedAt: Timestamp.now(),
        });

        toast({
            title: "Task Completed!",
            description: "Your final designs have been submitted.",
        });
        onSuccess();
        form.reset();
    } catch(e) {
        console.error("Error completing task: ", e);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem submitting your work.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Design Task</DialogTitle>
          <DialogDescription>
            Submit your final designs and notes for '{task.taskName}'.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="completionNotes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Final Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Describe your design choices or any other relevant information."
                                className="resize-none"
                                rows={4}
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
                            <FormLabel>Upload your <span className="font-bold">{task.taskName}</span></FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="attachments-upload-complete-design"
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 w-full justify-center"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Upload Final Design(s)</span>
                                    </label>
                                    <Input
                                        id="attachments-upload-complete-design"
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
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit & Mark as Done
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
