
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import type { Task } from './tasks-kanban-view';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, Code, File, Flag, HardHat, Info, List, Paperclip, ShieldCheck, Tag, Target, User } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';

type ViewTaskDetailsDialogProps = {
    task: Task;
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
    <div className="flex items-start gap-4">
        <div className="text-muted-foreground w-6 h-6 flex-shrink-0">{icon}</div>
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium text-sm">{value}</p>
        </div>
    </div>
);


export function ViewTaskDetailsDialog({ task, isOpen, onOpenChange }: ViewTaskDetailsDialogProps) {
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
        subtasks,
        testType,
        bugSeverity,
        expectedResult,
        testData
    } = task;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {taskRole === 'developer' ? <HardHat /> : <ShieldCheck />}
                        {taskName}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-4">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-6">
                             {/* Description */}
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Description</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {description || (taskRole === 'qa' && task.testDescription) || 'No description provided.'}
                                </p>
                            </div>

                            {/* Developer Details */}
                            {taskRole === 'developer' && subtasks && (
                                 <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2"><List className="w-4 h-4" /> Subtasks</h3>
                                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                                        {subtasks}
                                    </div>
                                </div>
                            )}

                             {/* QA Details */}
                             {taskRole === 'qa' && (
                                <>
                                {expectedResult && (
                                     <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Expected Result</h3>
                                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                                            {expectedResult}
                                        </div>
                                    </div>
                                )}
                                {testData && (
                                     <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2"><File className="w-4 h-4" /> Test Data</h3>
                                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                                            {testData}
                                        </div>
                                    </div>
                                )}
                                </>
                            )}
                            
                            {/* Attachments */}
                            {attachmentUrls && attachmentUrls.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachments</h3>
                                    <div className="space-y-2">
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

                        </div>

                         {/* Sidebar with metadata */}
                        <div className="md:col-span-1 space-y-4 md:border-l md:pl-6">
                            <DetailRow icon={<Badge variant="outline" className={statusColor[status]}>{status}</Badge>} label="Status" value="" />
                            <Separator />
                            <DetailRow icon={<Flag />} label="Priority" value={<Badge variant="outline" className={priorityColor[priority]}>{priority}</Badge>} />
                            <DetailRow icon={<User />} label="Assigned To" value={assignedTo} />
                            <DetailRow icon={<Calendar />} label="Due Date" value={format(dueDate.toDate(), 'PPP')} />
                            <DetailRow icon={<Clock />} label="Created At" value={format(createdAt.toDate(), 'PPP p')} />
                           
                            {taskRole === 'developer' && (
                                <>
                                <Separator />
                                {taskType && <DetailRow icon={<Tag />} label="Task Type" value={<Badge variant="secondary">{taskType}</Badge>} />}
                                {estimatedHours && <DetailRow icon={<Clock />} label="Estimated Hours" value={`${estimatedHours} hours`} />}
                                {techStack && <DetailRow icon={<Code />} label="Tech Stack" value={techStack} />}
                                </>
                            )}
                            {taskRole === 'qa' && (
                                <>
                                <Separator />
                                {testType && <DetailRow icon={<Tag />} label="Test Type" value={<Badge variant="secondary">{testType}</Badge>} />}
                                {bugSeverity && <DetailRow icon={<Flag />} label="Bug Severity" value={<Badge variant="outline" className={priorityColor[bugSeverity]}>{bugSeverity}</Badge>} />}
                                </>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
