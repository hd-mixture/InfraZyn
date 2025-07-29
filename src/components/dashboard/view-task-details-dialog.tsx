'use client';

import * as React from 'react';
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
import { Calendar, Clock, Code, File, Flag, Info, Paperclip, ShieldCheck, Tag, User, MoreHorizontal, Edit, Trash2, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';


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

const priorityIcons: { [key: string]: React.ReactNode } = {
    'High': <ArrowUp className="h-4 w-4 text-red-500" />,
    'Medium': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />,
    'Critical': <ArrowUp className="h-4 w-4 text-red-700" />
};

const statusColor: { [key: string]: string } = {
    "Done": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "To Do": "border-yellow-500 text-yellow-500",
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 items-start gap-4">
        <div className="col-span-1 text-sm text-muted-foreground flex items-center gap-2">
            {icon}
            <span>{label}</span>
        </div>
        <div className="col-span-2 font-medium text-sm">{value}</div>
    </div>
);


export function ViewTaskDetailsDialog({ userTasks, isOpen, onOpenChange }: ViewTaskDetailsDialogProps) {
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
    
    const sortedTasks = React.useMemo(() => {
        if (!userTasks) return [];
        return [...userTasks.tasks].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }, [userTasks]);

    React.useEffect(() => {
        if (isOpen && sortedTasks.length > 0) {
            setSelectedTask(sortedTasks[0]);
        } else {
            setSelectedTask(null);
        }
    }, [isOpen, sortedTasks]);


    if (!userTasks) return null;

    const taskToDisplay = selectedTask || (sortedTasks.length > 0 ? sortedTasks[0] : null);
    if (!taskToDisplay) return null;

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
        testType,
        bugSeverity,
    } = taskToDisplay;

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
                           {sortedTasks.map(task => (
                             <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={cn(
                                    "w-full text-left h-auto rounded-md p-3 group relative cursor-pointer flex items-center justify-between",
                                    selectedTask?.id === task.id ? "bg-background text-foreground" : "hover:bg-background/50"
                                )}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium text-sm pr-6">{task.taskName}</span>
                                    <span className="text-xs text-muted-foreground">{format(task.dueDate.toDate(), 'MMM dd')}</span>
                                </div>

                                <div className="relative group/menu h-7 w-7 flex items-center justify-center">
                                    <div className="transition-opacity duration-200 group-hover/menu:opacity-0">
                                         {priorityIcons[task.priority]}
                                    </div>
                                    <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/menu:opacity-100">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-full w-full">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                             </div>
                           ))}
                        </div>
                    </ScrollArea>
                    
                    <ScrollArea className="md:col-span-3 h-full">
                        <div className="p-6">
                            <Card className="border-none shadow-none bg-transparent">
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
                                <Separator className="my-6" />
                                <CardContent className="p-0 space-y-5">
                                    
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
                                            {description || (taskRole === 'qa' && selectedTask?.testDescription) || 'No description provided.'}
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
