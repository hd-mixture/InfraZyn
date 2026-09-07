
'use client'

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import type { Task } from './tasks-kanban-view';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, Code, File, Flag, Info, Paperclip, ShieldCheck, Tag, User, TrendingUp, CheckCircle, Palette } from 'lucide-react';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

type ViewTaskDialogProps = {
    task: Task | null;
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

const roleIcons: Record<string, React.ReactNode> = {
    'developer': <Code className="h-4 w-4 text-blue-500" />,
    'qa': <ShieldCheck className="h-4 w-4 text-green-500" />,
    'designer': <Palette className="h-4 w-4 text-orange-500" />,
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

export function ViewTaskDialog({ task, isOpen, onOpenChange }: ViewTaskDialogProps) {
    if (!task) return null;

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
        progress,
        testDescription
    } = task;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {roleIcons[taskRole]}
                        {taskName}
                    </DialogTitle>
                    <DialogDescription>
                         <div className="flex items-center gap-8 text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold tracking-wider">STATUS</span>
                                <Badge variant="outline" className={cn(statusColor[status], 'rounded-md')}>{status}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold tracking-wider">PRIORITY</span>
                                <Badge variant="outline" className={cn(priorityColor[priority], 'rounded-md')}>{priority}</Badge>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1 -mx-1 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                    <div className="space-y-5 pr-6">
                        {(status === 'In Progress' || status === 'Done') && (
                            <DetailRow 
                                icon={<TrendingUp size={16} />} 
                                label="Progress" 
                                value={
                                    <div className="flex items-center gap-2 w-full">
                                        <Progress value={progress || (status === 'Done' ? 100 : 0)} indicatorClassName={status === 'Done' ? 'bg-green-500' : 'bg-blue-500'} className="w-1/2" />
                                        <span>{progress || (status === 'Done' ? 100 : 0)}%</span>
                                    </div>
                                } 
                            />
                        )}
                        <DetailRow icon={<User size={16}/>} label="Assigned To" value={assignedTo} />
                        <DetailRow icon={<Calendar size={16}/>} label="Due Date" value={format(dueDate.toDate(), 'PPP')} />
                        <DetailRow icon={<Clock size={16}/>} label="Created At" value={format(createdAt.toDate(), 'PPP p')} />
                        
                        <Separator />
                        
                        {taskRole === 'developer' ? (
                            <>
                                {taskType && <DetailRow icon={<Tag size={16}/>} label="Task Type" value={<Badge variant="secondary">{taskType}</Badge>} />}
                                {estimatedHours && <DetailRow icon={<Clock size={16}/>} label="Estimate" value={`${estimatedHours} hours`} />}
                                {techStack && <DetailRow icon={<Code size={16}/>} label="Tech Stack" value={techStack} />}
                            </>
                        ) : (
                            <>
                                {testType && <DetailRow icon={<Tag size={16}/>} label="Test Type" value={<Badge variant="secondary">{testType}</Badge>} />}
                                {bugSeverity && <DetailRow icon={<Flag size={16}/>} label="Bug Severity" value={<Badge variant="outline" className={priorityColor[bugSeverity]}>{bugSeverity}</Badge>} />}
                            </>
                        )}
                        
                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><Info size={16}/> Description</h3>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                                {description || testDescription || 'No description provided.'}
                            </div>
                        </div>
                        
                        {attachmentUrls && attachmentUrls.length > 0 && (
                             <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><Paperclip size={16}/> Attachments</h3>
                                <div className="space-y-2 pl-6">
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
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
