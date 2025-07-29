'use client';

import * as React from 'react';
import { useState }from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import type { Task, GroupedTask } from './tasks-kanban-view';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, Code, File, Flag, Info, List, Paperclip, ShieldCheck, Tag, Target, User, Edit } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

type ViewTaskDetailsDialogProps = {
    userTasks: GroupedTask;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

const priorityColor: { [key: string]: string } = {
    'High': "border-red-500 text-red-500 bg-red-500/10",
    'Medium': "border-yellow-500 text-yellow-500 bg-yellow-500/10",
    'Low': "border-green-500 text-green-500 bg-green-500/10",
    'Critical': "border-red-700 text-red-700 bg-red-700/10",
};

const statusColor: { [key: string]: string } = {
    "Done": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "To Do": "border-yellow-500 text-yellow-500",
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 items-center gap-2">
        <div className="col-span-1 text-sm text-muted-foreground flex items-center gap-2">
            {icon}
            <span>{label}</span>
        </div>
        <div className="col-span-2 font-medium text-sm">{value}</div>
    </div>
);


export function ViewTaskDetailsDialog({ userTasks, isOpen, onOpenChange }: ViewTaskDetailsDialogProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    React.useEffect(() => {
        if (isOpen && userTasks && userTasks.tasks.length > 0) {
            const sortedTasks = [...userTasks.tasks].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
            setSelectedTask(sortedTasks[0]);
        }
    }, [isOpen, userTasks]);


    if (!userTasks || !selectedTask) return null;

    const {
        taskName,
        taskRole,
        description,
        status,
        priority,
        dueDate,
        assignedTo,
        createdAt,
        attachmentUrls,
        taskType,
        estimatedHours,
        techStack,
        subtasks,
        testType,
        bugSeverity,
        expectedResult,
        testData
    } = selectedTask;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-6 h-6" />
                        Tasks for {userTasks.user.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-0 min-h-0">
                    <ScrollArea className="md:col-span-1 h-full border-r bg-muted/30">
                        <div className="p-4 space-y-2">
                           {userTasks.tasks.map(task => (
                             <Button
                                key={task.id}
                                variant="ghost"
                                onClick={() => setSelectedTask(task)}
                                className={cn(
                                    "w-full justify-start text-left h-auto py-3 px-4",
                                    selectedTask?.id === task.id && "bg-background text-foreground"
                                )}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium text-sm">{task.taskName}</span>
                                    <span className="text-xs text-muted-foreground">{format(task.dueDate.toDate(), 'MMM dd')}</span>
                                </div>
                             </Button>
                           ))}
                        </div>
                    </ScrollArea>
                    
                    <ScrollArea className="md:col-span-3 h-full">
                        <div className="p-6 space-y-6">
                            <Card className="border-none shadow-none">
                                <CardHeader className="p-0">
                                    <h2 className="text-2xl font-bold">{taskName}</h2>
                                     <div className="flex items-center gap-8 text-sm text-muted-foreground pt-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold tracking-wider">STATUS</span>
                                            <Badge variant="outline" className={cn(statusColor[status], 'rounded-md')}>{status}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <span className="text-xs font-semibold tracking-wider">PRIORITY</span>
                                             <Badge variant="outline" className={cn(priorityColor[priority], 'rounded-md')}>{priority}</Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 mt-8 space-y-5">
                                    
                                    <DetailRow icon={<User size={16}/>} label="Assigned To" value={assignedTo} />
                                    <DetailRow icon={<Calendar size={16}/>} label="Due Date" value={format(dueDate.toDate(), 'PPP')} />
                                    <DetailRow icon={<Clock size={16}/>} label="Created At" value={format(createdAt.toDate(), 'PPP p')} />
                                    
                                    <Separator className="my-6" />

                                    {taskRole === 'developer' ? (
                                        <div className="space-y-5">
                                            {taskType && <DetailRow icon={<Tag size={16}/>} label="Task Type" value={<Badge variant="secondary">{taskType}</Badge>} />}
                                            {estimatedHours && <DetailRow icon={<Clock size={16}/>} label="Estimate" value={`${estimatedHours} hours`} />}
                                            {techStack && <DetailRow icon={<Code size={16}/>} label="Tech Stack" value={techStack} />}
                                        </div>
                                    ) : (
                                         <div className="space-y-5">
                                            {testType && <DetailRow icon={<Tag size={16}/>} label="Test Type" value={<Badge variant="secondary">{testType}</Badge>} />}
                                            {bugSeverity && <DetailRow icon={<Flag size={16}/>} label="Bug Severity" value={<Badge variant="outline" className={priorityColor[bugSeverity]}>{bugSeverity}</Badge>} />}
                                         </div>
                                    )}

                                    <Separator className="my-6" />
                                    
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><Info size={16}/> Description</h3>
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                                            {description || (taskRole === 'qa' && selectedTask.testDescription) || 'No description provided.'}
                                        </div>
                                    </div>
                                    
                                    {attachmentUrls && attachmentUrls.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><Paperclip size={16}/> Attachments</h3>
                                            <div className="space-y-2 pl-6">
                                                {attachmentUrls.map((file, index) => (
                                                    <Link
                                                        key={index}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                                    >
                                                        <File className="w-4 h-4" />
                                                        {file.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
