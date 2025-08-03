
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDoc, collectionGroup, addDoc, Timestamp, getDocs, setDoc } from 'firebase/firestore';
import { Bell, Check, MessageSquare, ListChecks, Send, Loader2, ThumbsUp, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { ViewTaskDialog } from './view-task-dialog';
import { ViewDeveloperTaskDialog } from './view-developer-task-dialog';
import type { Task } from './tasks-kanban-view';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { getOppositeUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


type Notification = {
    id: string;
    parentPath?: string; // e.g. users/{uid}/notifications or tasks/{tid}/notifications
    type: 'comment' | 'new_task_assignment' | 'project_assignment';
    recipientId: string;
    senderName: string;
    senderAvatar: string | null;
    taskId?: string;
    projectId?: string;
    taskName?: string;
    projectName?: string;
    messageSnippet: string;
    read: boolean;
    createdAt: any;
};

export function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [replySent, setReplySent] = useState<string[]>([]);
    const [animateBell, setAnimateBell] = useState(false);
    const previousUnreadCountRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                setUserId(user.uid);
                setUserRole(localStorage.getItem('userRole'));
            } else {
                setUserId(null);
                setUserRole(null);
            }
        });

        return () => unsubscribeAuth();
    }, []);
    
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    useEffect(() => {
        if (unreadCount > previousUnreadCountRef.current) {
            setAnimateBell(true);
            audioRef.current?.play().catch(e => console.error("Error playing sound:", e));
            const timer = setTimeout(() => setAnimateBell(false), 800); // Duration of animation
            return () => clearTimeout(timer);
        }
    }, [unreadCount]);
    
    useEffect(() => {
        previousUnreadCountRef.current = unreadCount;
    }, [unreadCount]);


    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            return;
        }

        const q = query(
            collectionGroup(db, 'notifications'),
            where('recipientId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, snapshot => {
            const fetchedNotifications = snapshot.docs.map(doc => {
                const pathSegments = doc.ref.path.split('/');
                const parentPath = pathSegments.slice(0, -1).join('/');

                return {
                    id: doc.id,
                    parentPath: parentPath,
                    ...doc.data(),
                } as Notification
            });
            
            setNotifications(fetchedNotifications);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
        });

        return () => unsubscribe();
    }, [userId]);


    const handleNotificationClick = async (notification: Notification) => {
        if(replyingTo === notification.id) return;

        if (notification.taskId) {
            const taskDoc = await getDoc(doc(db, 'tasks', notification.taskId));
            if (taskDoc.exists()) {
                setViewingTask({ id: taskDoc.id, ...taskDoc.data() } as Task);
            }
        } else if (notification.projectId && userRole === 'manager') {
            router.push(`/manager-dashboard?view=projects`);
        }
        
       markAsRead(notification);
    };
    
    const markAsRead = async (notification: Notification) => {
        if (notification.read || !notification.parentPath) return;
        const notificationRef = doc(db, notification.parentPath, notification.id);
        try {
            await updateDoc(notificationRef, { read: true });
        } catch(e) {
            console.warn("Could not mark notification as read:", e);
        }
    }
    
    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        for (const notification of unreadNotifications) {
            await markAsRead(notification);
        }
    };

    const handleReply = async (e: React.FormEvent, notification: Notification) => {
        e.preventDefault();
        e.stopPropagation();

        if (replyContent.trim() === '' || !notification.taskId) return;
        
        setIsSubmittingReply(true);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("User not authenticated.");

            const taskDoc = await getDoc(doc(db, 'tasks', notification.taskId));
            if (!taskDoc.exists()) throw new Error("Task not found.");

            const taskData = taskDoc.data() as Task;
            
            await addDoc(collection(db, 'tasks', notification.taskId, 'comments'), {
                text: replyContent,
                authorName: localStorage.getItem('userName'),
                authorRole: localStorage.getItem('userRole'),
                authorAvatar: localStorage.getItem('userAvatar') || null,
                createdAt: Timestamp.now(),
            });

            const recipient = await getOppositeUser(taskData, currentUser.uid);

            if (recipient && recipient.id !== currentUser.uid) {
                 await addDoc(collection(db, 'tasks', notification.taskId, 'notifications'), {
                    recipientId: recipient.id,
                    senderName: localStorage.getItem('userName'),
                    senderAvatar: localStorage.getItem('userAvatar') || null,
                    taskId: notification.taskId,
                    taskName: taskData.taskName,
                    messageSnippet: replyContent.substring(0, 50),
                    read: false,
                    createdAt: Timestamp.now(),
                    type: 'comment',
                });
            }

            await markAsRead(notification);

            toast({ title: "Reply Sent!" });
            setReplyContent('');
            setReplyingTo(null);
            setReplySent(prev => [...prev, notification.id]);

        } catch (error: any) {
            console.error("Error sending reply: ", error);
            toast({
                variant: 'destructive',
                title: "Failed to send reply",
                description: error.message
            });
        } finally {
            setIsSubmittingReply(false);
        }

    }

    const renderNotificationContent = (notification: Notification) => {
         return (
            <div className="flex-1">
                <p className="text-sm">
                    <span className="font-medium">{notification.senderName}</span>
                    <span className="text-muted-foreground">
                        {notification.type === 'comment' ? ' commented on ' : ' assigned you to '}
                    </span>
                    <span className="font-medium text-primary">
                        {notification.taskName || notification.projectName}
                    </span>
                </p>
                {notification.type === 'comment' && (
                     <p className="text-sm text-muted-foreground italic truncate pt-1">
                        "{notification.messageSnippet}"
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                </p>
            </div>
        );
    }

    const getIcon = (type: Notification['type']) => {
        switch(type) {
            case 'new_task_assignment': return <ListChecks className="h-full w-full" />;
            case 'project_assignment': return <Folder className="h-full w-full" />;
            case 'comment': return <MessageSquare className="h-full w-full" />;
            default: return <MessageSquare className="h-full w-full" />;
        }
    }
    
    const handleDialogClose = () => {
        setViewingTask(null);
    };

    return (
        <>
            <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2024/02/09/audio_d929b71a27.mp3" preload="auto" />
            <DropdownMenu onOpenChange={(open) => { if(!open) setReplySent([]) }}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className={cn("h-9 w-9 relative", animateBell && 'animate-ring')}>
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                                {unreadCount}
                            </span>
                        )}
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96" align="end">
                    <DropdownMenuLabel className="flex justify-between items-center">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark all as read
                            </Button>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-96">
                        <DropdownMenuGroup>
                            {notifications.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground p-4">No notifications yet.</p>
                            ) : (
                                notifications.map(notification => (
                                    <DropdownMenuItem key={notification.id} onSelect={(e) => e.preventDefault()} className="flex flex-col items-start gap-2 p-3 cursor-pointer">
                                        <div className="flex items-start gap-3 w-full" onClick={() => handleNotificationClick(notification)}>
                                            <div className="relative">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={notification.senderAvatar || `https://placehold.co/32x32.png`} data-ai-hint="person face" />
                                                    <AvatarFallback>{notification.senderName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                                                    <div className="h-3 w-3 text-primary">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                </div>
                                            </div>

                                            {renderNotificationContent(notification)}

                                            {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
                                        </div>

                                        {notification.type === 'comment' && (
                                            <div className="pl-11 w-full mt-2">
                                                {replyingTo === notification.id ? (
                                                    <form className="flex items-center gap-2" onSubmit={(e) => handleReply(e, notification)}>
                                                        <Input
                                                            autoFocus
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            placeholder="Write a reply..."
                                                            className="h-8 text-xs"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <Button type="submit" size="icon" className="h-8 w-8" disabled={isSubmittingReply}>
                                                           {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                        </Button>
                                                    </form>
                                                ) : replySent.includes(notification.id) ? (
                                                    <div className="flex items-center gap-2 text-xs text-green-600">
                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                        <span>Reply sent!</span>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); setReplyingTo(notification.id)}}>
                                                        Reply here
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuGroup>
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>

            {viewingTask && (userRole === 'manager' || userRole === 'admin') && (
                <ViewTaskDialog
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onOpenChange={handleDialogClose}
                />
            )}
            {viewingTask && userRole === 'developer' && (
                <ViewDeveloperTaskDialog
                    task={viewingTask}
                    projectName="Loading..."
                    isOpen={!!viewingTask}
                    onOpenChange={handleDialogClose}
                />
            )}
            {viewingTask && userRole === 'qa' && (
                 <ViewTaskDialog
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onOpenChange={handleDialogClose}
                />
            )}
        </>
    );
}
