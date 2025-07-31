
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
import { Calendar, Clock, File, Flag, Folder, Info, Paperclip, Tag, User } from 'lucide-react';
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
    if (!task) return null;

    const {
        taskName,
        description,
        status,
        priority,
        dueDate,
        attachmentUrls,
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
                <ScrollArea className="max-h-[60vh] p-1">
                    <div className="space-y-4 pr-4">
                        <DetailRow icon={<Tag size={16}/>} label="Status" value={<Badge variant="outline" className={statusColor[status]}>{status}</Badge>} />
                        <DetailRow icon={<Flag size={16}/>} label="Priority" value={<Badge variant="outline" className={priorityColor[priority]}>{priority}</Badge>} />
                        <DetailRow icon={<Folder size={16}/>} label="Project" value={projectName} />
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
            </DialogContent>
        </Dialog>
    );
}
