
'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, updateDoc, doc, where, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Paperclip, File as FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Input } from '../ui/input';
import Link from 'next/link';
import type { Task } from './tasks-kanban-view';

type Comment = {
    id: string;
    text: string;
    authorName: string;
    authorRole: 'manager' | 'developer' | 'qa' | 'admin';
    authorAvatar?: string;
    createdAt: Timestamp;
    attachments?: { name: string, url: string }[];
};

type TaskCommentsProps = {
    task: Task;
    currentUser: {
        name: string | null;
        role: string | null;
        avatar: string | null;
    };
};

export function TaskComments({ task, currentUser }: TaskCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const commentsQuery = query(
            collection(db, 'tasks', task.id, 'comments'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Comment));
            setComments(fetchedComments);
        });

        return () => unsubscribe();
    }, [task.id]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [comments]);


    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((newComment.trim() === '' && !filesToUpload) || !currentUser.name || !currentUser.role) return;

        setLoading(true);
        try {
            let attachmentUrls: { name: string, url: string }[] = [];
            if (filesToUpload) {
                for (const file of Array.from(filesToUpload)) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
                    
                    const response = await axios.post(
                        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
                        formData
                    );
                    attachmentUrls.push({ name: file.name, url: response.data.secure_url });
                }
            }

            const commentData: any = {
                text: newComment,
                authorName: currentUser.name,
                authorRole: currentUser.role,
                authorAvatar: currentUser.avatar || null,
                createdAt: Timestamp.now(),
            };

            if (attachmentUrls.length > 0) {
                commentData.attachments = attachmentUrls;
            }

            await addDoc(collection(db, 'tasks', task.id, 'comments'), commentData);

            // Create notification
            let recipientId = null;
            if (currentUser.role === 'developer') {
                // Find the manager
                const projectsQuery = query(collection(db, 'projects'), where('projectName', '==', task.project));
                const projectsSnap = await getDocs(projectsQuery);
                if (!projectsSnap.empty) {
                    const projectData = projectsSnap.docs[0].data();
                    const managerName = projectData.projectManager;
                    const usersQuery = query(collection(db, 'users'), where('name', '==', managerName));
                    const usersSnap = await getDocs(usersQuery);
                    if (!usersSnap.empty) {
                        recipientId = usersSnap.docs[0].id;
                    }
                }
            } else if (currentUser.role === 'manager') {
                // Find the developer
                const usersQuery = query(collection(db, 'users'), where('name', '==', task.assignedTo));
                const usersSnap = await getDocs(usersQuery);
                if (!usersSnap.empty) {
                    recipientId = usersSnap.docs[0].id;
                }
            }

            if (recipientId) {
                await addDoc(collection(db, 'notifications'), {
                    recipientId,
                    senderName: currentUser.name,
                    senderAvatar: currentUser.avatar || null,
                    taskId: task.id,
                    taskName: task.taskName,
                    messageSnippet: newComment.substring(0, 50),
                    read: false,
                    createdAt: Timestamp.now(),
                });
            }

            setNewComment('');
            setFilesToUpload(null);
            if(fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error('Error adding comment: ', error);
             toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was a problem submitting your message.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm">Discussion</h3>
            <div className="border rounded-lg p-4 space-y-4">
                <ScrollArea className="h-48" ref={scrollAreaRef}>
                    <div className="space-y-4 pr-4">
                    {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center pt-16">No comments yet. Start the conversation!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className={cn(
                                "flex items-start gap-3",
                                comment.authorName === currentUser.name ? "flex-row-reverse" : ""
                            )}>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={comment.authorAvatar || `https://placehold.co/32x32.png`} data-ai-hint="person face" />
                                    <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "rounded-lg p-3 max-w-xs",
                                    comment.authorName === currentUser.name 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted"
                                )}>
                                    {comment.text && <p className="text-sm whitespace-pre-wrap">{comment.text}</p>}
                                    {comment.attachments && (
                                        <div className={cn("space-y-2", comment.text && "mt-2")}>
                                            {comment.attachments.map((file, index) => (
                                                 <Link key={index} href={file.url} target="_blank" rel="noopener noreferrer" className={cn(
                                                     "flex items-center gap-2 p-2 rounded-md",
                                                     comment.authorName === currentUser.name ? "bg-primary/80 hover:bg-primary/70" : "bg-background/50 hover:bg-background/80"
                                                 )}>
                                                    <FileIcon className="h-5 w-5" />
                                                    <span className="text-sm truncate">{file.name}</span>
                                                 </Link>
                                            ))}
                                        </div>
                                    )}
                                    <p className={cn(
                                        "text-xs mt-1 opacity-70",
                                        comment.authorName === currentUser.name ? "text-right" : "text-left"
                                        )}>
                                        {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSubmitComment} className="space-y-2">
                    <div className="flex items-start gap-2">
                        <Textarea
                            placeholder="Type your message..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={1}
                            className="resize-none"
                        />
                         <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip />
                        </Button>
                        <Button type="submit" disabled={loading || (newComment.trim() === '' && !filesToUpload)} size="icon">
                            {loading ? <Loader2 className="animate-spin" /> : <Send />}
                        </Button>
                    </div>
                    <Input id="comment-attachment" type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => setFilesToUpload(e.target.files)} />
                     {filesToUpload && Array.from(filesToUpload).length > 0 && (
                        <div className="text-xs text-muted-foreground pt-1">
                            Selected {Array.from(filesToUpload).length} file(s) for upload.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
