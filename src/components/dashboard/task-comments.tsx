
'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type Comment = {
    id: string;
    text: string;
    authorName: string;
    authorRole: 'manager' | 'developer' | 'qa' | 'admin';
    authorAvatar?: string;
    createdAt: Timestamp;
};

type TaskCommentsProps = {
    taskId: string;
    currentUser: {
        name: string | null;
        role: string | null;
        avatar: string | null;
    };
};

export function TaskComments({ taskId, currentUser }: TaskCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const commentsQuery = query(
            collection(db, 'tasks', taskId, 'comments'),
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
    }, [taskId]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [comments]);


    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '' || !currentUser.name || !currentUser.role) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'tasks', taskId, 'comments'), {
                text: newComment,
                authorName: currentUser.name,
                authorRole: currentUser.role,
                authorAvatar: currentUser.avatar || null,
                createdAt: Timestamp.now(),
            });
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment: ', error);
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
                        comments.map((comment, index) => (
                            <div key={index} className={cn(
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
                                    <p className="text-sm">{comment.text}</p>
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
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                    <Textarea
                        placeholder="Type your message..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={1}
                        className="resize-none"
                    />
                    <Button type="submit" disabled={loading || newComment.trim() === ''} size="icon">
                        {loading ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
