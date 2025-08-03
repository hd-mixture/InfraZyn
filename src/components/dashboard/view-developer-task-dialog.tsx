
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import type { Task } from './assigned-tasks-view';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, File, Flag, Folder, Info, Paperclip, TrendingUp, CheckCircle, MessageSquare, Check, ThumbsUp } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { TaskComments } from './task-comments';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ViewDeveloperTaskDialogProps = {
    task: Task;
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
    <div className="grid grid-cols-3 items-start gap-4 py-2">
        <div className="col-span-1 text-sm text-muted-foreground flex items-center gap-2">
            {icon}
            <span>{label}</span>
        </div>
        <div className="col-span-2 font-medium text-sm">{value}</div>
    </div>
);

export function ViewDeveloperTaskDialog({ task, projectName, isOpen, onOpenChange }: ViewDeveloperTaskDialogProps) {
    const [currentUser, setCurrentUser] = React.useState<{name: string | null, role: string | null, avatar: string | null}>({ name: null, role: null, avatar: null });

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUser({
                name: localStorage.getItem('userName'),
                role: localStorage.getItem('userRole'),
                avatar: localStorage.getItem('userAvatar'),
            });
        }
    }, []);

    if (!task) return null;

    const {
        id,
        taskName,
        description,
        status,
        priority,
        dueDate,
        attachmentUrls,
        progress,
        completedAt,
        completionNotes,
        completionAttachments,
    } = task;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{taskName}</DialogTitle>
                    <DialogDescription>
                        Details for the task.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 pr-4">
                        <DetailRow icon={<Folder size={16}/>} label="Project" value={projectName} />
                        <DetailRow icon={<CheckCircle size={16}/>} label="Status" value={<Badge variant="outline" className={statusColor[status]}>{status}</Badge>} />
                        <DetailRow icon={<Flag size={16}/>} label="Priority" value={<Badge variant="outline" className={priorityColor[priority]}>{priority}</Badge>} />
                        <DetailRow icon={<Calendar size={16}/>} label="Due Date" value={format(dueDate.toDate(), 'PPP')} />
                        {(status === 'In Progress' || status === 'Done') && (
                            <DetailRow icon={<TrendingUp size={16} />} label="Progress" value={<div className="flex items-center gap-2"><Progress value={progress || 0} className="w-32" /><span>{progress || 0}%</span></div>} />
                        )}
                        <DetailRow icon={<Info size={16}/>} label="Description" value={<p className="whitespace-pre-wrap">{description || 'No description provided.'}</p>} />

                        {attachmentUrls && attachmentUrls.length > 0 && (
                            <DetailRow 
                                icon={<Paperclip size={16}/>} 
                                label="Manager's Attachments" 
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

                        {(status === 'In Progress' || status === 'Done') && <Separator />}

                        {task && status === 'In Progress' && (
                             <TaskComments task={task} currentUser={currentUser} />
                        )}
                        
                        {status === 'Done' && (
                             <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                                <h3 className="font-semibold text-base flex items-center gap-2 text-green-600">
                                    <ThumbsUp size={18} />
                                    Task Completed
                                </h3>
                                {completedAt && <DetailRow icon={<Check size={16} />} label="Completion Date" value={format(completedAt.toDate(), 'PPP p')} />}
                                {completionNotes && <DetailRow icon={<MessageSquare size={16} />} label="Completion Notes" value={<p className="whitespace-pre-wrap">{completionNotes}</p>} />}
                                {completionAttachments && completionAttachments.length > 0 && (
                                    <DetailRow
                                        icon={<Paperclip size={16} />}
                                        label="Final Attachments"
                                        value={
                                            <div className="space-y-2">
                                                {completionAttachments.map((file, index) => (
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
                                        }
                                    />
                                )}
                            </div>
                        )}

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
