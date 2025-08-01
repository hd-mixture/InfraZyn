
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
import type { Task } from './assigned-tasks-view';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, File, Flag, Folder, Info, Paperclip, Send, Upload, MessageSquare, Loader2, TrendingUp, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import axios from 'axios';
import { Progress } from '../ui/progress';
import { TaskComments } from './task-comments';

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
    const { toast } = useToast();
    const [developerNotes, setDeveloperNotes] = React.useState(task?.developerNotes || '');
    const [filesToUpload, setFilesToUpload] = React.useState<FileList | null>(null);
    const [loading, setLoading] = React.useState(false);
    const attachmentInputRef = React.useRef<HTMLInputElement>(null);
    const [currentUser, setCurrentUser] = React.useState({ name: null, role: null, avatar: null });

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUser({
                name: localStorage.getItem('userName'),
                role: localStorage.getItem('userRole'),
                avatar: localStorage.getItem('userAvatar'),
            });
        }
    }, []);

    React.useEffect(() => {
        if (task) {
            setDeveloperNotes(task.developerNotes || '');
        }
    }, [task]);

    if (!task) return null;

    const handleSubmitWork = async () => {
        setLoading(true);
        try {
            let newAttachments = task.developerAttachments || [];
            if (filesToUpload) {
                for (const file of Array.from(filesToUpload)) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
                    
                    const response = await axios.post(
                        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
                        formData
                    );
                    newAttachments.push({ name: file.name, url: response.data.secure_url });
                }
            }

            const taskRef = doc(db, "tasks", task.id);
            await updateDoc(taskRef, {
                developerNotes: developerNotes,
                developerAttachments: newAttachments
            });

            toast({
                title: "Work Submitted!",
                description: "Your notes and attachments have been saved.",
            });
            onOpenChange(false);

        } catch (error) {
            console.error("Error submitting work: ", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was a problem submitting your work.",
            });
        } finally {
            setLoading(false);
        }
    }

    const {
        id,
        taskName,
        description,
        status,
        priority,
        dueDate,
        attachmentUrls,
        progress
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
                    <div className="space-y-4 pr-2">
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

                        <Separator />
                        
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><MessageSquare size={16}/>Notes for Manager</h3>
                            <Textarea 
                                placeholder="Add comments, questions, or updates for the manager..."
                                value={developerNotes}
                                onChange={(e) => setDeveloperNotes(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                             <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Upload size={16}/>Submit Work / Attachments</h3>
                             <Input
                                id="developer-attachments"
                                type="file"
                                multiple
                                className="hidden"
                                ref={attachmentInputRef}
                                onChange={(e) => setFilesToUpload(e.target.files)}
                            />
                            <Button variant="outline" className="w-full" onClick={() => attachmentInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Select Files
                            </Button>
                             {filesToUpload && Array.from(filesToUpload).length > 0 && (
                                <div className="text-xs text-muted-foreground pt-1">
                                    Selected {Array.from(filesToUpload).length} file(s)
                                </div>
                            )}
                        </div>

                        {status === 'In Progress' && (
                            <>
                                <Separator />
                                <TaskComments taskId={id} currentUser={currentUser} />
                            </>
                        )}
                    </div>
                </ScrollArea>
                 <DialogFooter>
                    <Button onClick={handleSubmitWork} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Save & Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
