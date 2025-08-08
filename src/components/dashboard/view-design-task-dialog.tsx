
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import type { DesignTask } from './assigned-designs-view';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, File, Flag, Folder, Info, Paperclip, TrendingUp, CheckCircle, List, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Progress } from '../ui/progress';
import { CompleteDesignTaskDialog } from './complete-design-task-dialog';

type ViewDesignTaskDialogProps = {
    task: DesignTask;
    projectName: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

const priorityColor: { [key: string]: string } = {
    'High': "border-red-500 text-red-500 bg-red-500/10",
    'Medium': "border-yellow-500 text-yellow-500 bg-yellow-500/10",
    'Low': "border-green-500 text-green-500 bg-green-500/10",
};

const statusColor: { [key: string]: string } = {
    "Done": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "To Do": "border-yellow-500 text-yellow-500",
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 items-center gap-4 py-2">
        <div className="col-span-1 text-sm text-muted-foreground flex items-center gap-2">
            {icon}
            <span>{label}</span>
        </div>
        <div className="col-span-2 font-medium text-sm">{value}</div>
    </div>
);

export function ViewDesignTaskDialog({ task: initialTask, projectName, isOpen, onOpenChange }: ViewDesignTaskDialogProps) {
    const [task, setTask] = React.useState(initialTask);
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setTask(initialTask);
    }, [initialTask]);

    const handleStatusChange = async (newStatus: 'To Do' | 'In Progress' | 'Done') => {
        if (newStatus === 'Done') {
            setIsCompleteDialogOpen(true);
            return;
        }

        try {
            const taskRef = doc(db, "tasks", task.id);
            const updateData: { status: string; progress?: number } = { status: newStatus };
            if (newStatus === 'To Do') {
                updateData.progress = 0;
            } else if (newStatus === 'In Progress' && (task.progress || 0) === 100) {
                 updateData.progress = 99;
            }
            await updateDoc(taskRef, updateData);
            setTask(prev => ({...prev, status: newStatus, progress: updateData.progress ?? prev.progress }));
            toast({
                title: "Status Updated",
                description: "The task status has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ variant: "destructive", title: "Update Failed", description: "There was a problem updating the task status." });
        }
    };

    const handleProgressChange = async (newProgress: number) => {
        try {
            const taskRef = doc(db, "tasks", task.id);
            await updateDoc(taskRef, { progress: newProgress });
            setTask(prev => ({...prev, progress: newProgress}));
        } catch (error) {
            console.error("Error updating progress: ", error);
             toast({ variant: "destructive", title: "Update Failed", description: "Could not save progress. Please try again." });
        }
    };

    if (!task) return null;

    const {
        taskName,
        description,
        status,
        priority,
        dueDate,
        attachmentUrls,
        progress,
        taskType
    } = task;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{taskName}</DialogTitle>
                        <DialogDescription>
                            Details for the design task.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                        <div className="space-y-4 pr-4">
                            <DetailRow icon={<Folder size={16}/>} label="Project" value={projectName} />
                            <DetailRow icon={<List size={16}/>} label="Task Type" value={<Badge variant="secondary">{taskType}</Badge>} />
                            <div className="grid grid-cols-3 items-center gap-4 py-2">
                                <div className="col-span-1 text-sm text-muted-foreground flex items-center gap-2">
                                    <CheckCircle size={16}/>
                                    <span>Status</span>
                                </div>
                                <div className="col-span-2">
                                    <Select value={status} onValueChange={(newStatus: 'To Do' | 'In Progress' | 'Done') => handleStatusChange(newStatus)}>
                                        <SelectTrigger className="w-[180px] h-9">
                                            <SelectValue placeholder="Set status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="To Do">To Do</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4 py-2">
                                <div className="col-span-1 text-sm text-muted-foreground flex items-center gap-2">
                                    <Percent size={16} />
                                    <span>Progress</span>
                                </div>
                                <div className="col-span-2">
                                {status === 'In Progress' ? (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="w-[180px] cursor-pointer group">
                                                    <Progress value={progress || 0} indicatorClassName="bg-blue-500" />
                                                    <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {progress || 0}%
                                                    </span>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-2">
                                                <Slider
                                                    defaultValue={[progress || 0]}
                                                    max={100}
                                                    step={5}
                                                    onValueCommit={(value) => handleProgressChange(value[0])}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    ) : status === 'Done' ? (
                                        <Progress value={100} indicatorClassName="bg-green-500" className="w-[180px]" />
                                    ) : (
                                        <div className="w-[180px] h-2 bg-secondary rounded-full" />
                                    )}
                                </div>
                            </div>

                            <DetailRow icon={<Flag size={16}/>} label="Priority" value={<Badge variant="outline" className={priorityColor[priority || 'Medium']}>{priority || 'Medium'}</Badge>} />
                            <DetailRow icon={<Calendar size={16}/>} label="Due Date" value={format(dueDate.toDate(), 'PPP')} />
                            <DetailRow icon={<Info size={16}/>} label="Description" value={<p className="whitespace-pre-wrap">{description || 'No description provided.'}</p>} />

                            {attachmentUrls && attachmentUrls.length > 0 && (
                                <DetailRow 
                                    icon={<Paperclip size={16}/>} 
                                    label="Attachments" 
                                    value={
                                        <div className="space-y-2">
                                            {attachmentUrls.map((file, index) => (
                                                <a
                                                    key={index}
                                                    href={file.url}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                                >
                                                    <File className="w-4 h-4" />
                                                    {file.name}
                                                </a>
                                            ))}
                                        </div>
                                    } 
                                />
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CompleteDesignTaskDialog
                task={task}
                isOpen={isCompleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCompleteDialogOpen(false);
                    }
                }}
                onSuccess={() => {
                    setIsCompleteDialogOpen(false);
                    onOpenChange(false); // Close the main details dialog on success
                }}
            />
        </>
    );
}
