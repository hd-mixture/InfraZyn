'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { predictTaskDelay, PredictTaskDelayOutput } from '@/ai/flows/predict-task-delay';
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CalendarIcon, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  deadline: z.date({ required_error: 'A deadline is required.' }),
});

export function DelayPredictor() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictTaskDelayOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setPrediction(null);
    try {
      const result = await predictTaskDelay({
        taskDescription: values.description,
        deadline: values.deadline.toISOString(),
      });
      setPrediction(result);
    } catch (error) {
      console.error('Prediction failed:', error);
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: "Could not get a prediction. Please try again later.",
      })
    } finally {
      setLoading(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        form.reset();
        setPrediction(null);
        setLoading(false);
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Lightbulb className="mr-2 h-4 w-4" />
          Predict Task Delay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>AI Delay Predictor</DialogTitle>
          <DialogDescription>
            Enter task details to predict if it's likely to be delayed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Implement the new authentication flow with two-factor authentication and social logins..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline</FormLabel>
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
                        disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                    </>
                ) : (
                    'Predict Delay'
                )}
                </Button>
            </DialogFooter>
          </form>
        </Form>
        {prediction && (
          <Alert variant={prediction.likelyToDelay ? "destructive" : "default"} className="mt-4">
             <AlertCircle className={cn("h-4 w-4", !prediction.likelyToDelay && "text-green-500")} />
            <AlertTitle>
              {prediction.likelyToDelay ? 'Delay Likely' : 'On Track'}
            </AlertTitle>
            <AlertDescription>{prediction.reason}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
