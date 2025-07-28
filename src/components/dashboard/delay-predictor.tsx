
'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
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

const exampleTasks = [
    "Develop and integrate a new payment gateway for credit card processing.",
    "Refactor the entire user authentication module to use JWT instead of sessions.",
    "Migrate the production database from MySQL to PostgreSQL with zero downtime.",
    "Design and implement a real-time notification system using WebSockets.",
    "Build a new data analytics dashboard with complex data visualizations.",
    "Set up a new CI/CD pipeline for the mobile application, including automated testing.",
];

export function DelayPredictor() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictTaskDelayOutput | null>(null);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const descriptionValue = form.watch('description');
  const showSuggestion = !descriptionValue;
  const suggestion = exampleTasks[currentExampleIndex];

  useEffect(() => {
    if (!open || !showSuggestion) return;
    const interval = setInterval(() => {
        setIsExiting(true);
        setTimeout(() => {
            setCurrentExampleIndex(prevIndex => (prevIndex + 1) % exampleTasks.length);
            setIsExiting(false);
        }, 500); // Should match animation duration
    }, 4000);
    return () => clearInterval(interval);
  }, [open, showSuggestion]);

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
        setCurrentExampleIndex(0);
    }
    setOpen(isOpen);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && showSuggestion) {
        e.preventDefault();
        form.setValue('description', suggestion);
    }
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
                    <div className="relative">
                        <Textarea
                            className="resize-none bg-transparent p-2"
                            rows={5}
                            {...field}
                            onKeyDown={handleKeyDown}
                        />
                        {showSuggestion && (
                           <div className={cn(
                                "absolute top-0 left-0 w-full h-full p-2 py-3 -z-10 text-muted-foreground text-sm pointer-events-none",
                                isExiting ? 'animate-slide-out-down-fade' : 'animate-slide-in-up-fade'
                            )}>
                                {suggestion}
                                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md border bg-muted">TAB</span>
                           </div>
                        )}
                    </div>
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
