
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDoc, getDocs, collectionGroup, addDoc, Timestamp, setDoc } from 'firebase/firestore';
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
    parentPath: string;
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

type ReplyInfo = {
    id: string;
    content: string;
    status: 'sending' | 'sent' | 'confirmed';
};

export function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [sentReplies, setSentReplies] = useState<ReplyInfo[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('sentReplies');
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [animateBell, setAnimateBell] = useState(false);
    const previousUnreadCountRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sentReplies', JSON.stringify(sentReplies.filter(r => r.status === 'confirmed')));
        }
    }, [sentReplies]);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                setUserId(user.uid);
                setUserRole(localStorage.getItem('userRole'));
                setUserName(localStorage.getItem('userName'));
            } else {
                setUserId(null);
                setUserRole(null);
                setUserName(null);
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
        previousUnreadCountRef.current = unreadCount;
    }, [unreadCount]);
    
     useEffect(() => {
        if (!userId || !userRole || !userName) {
            setNotifications([]);
            return;
        }

        let unsubscribe: (() => void) | (() => void)[] = () => {};

        if (userRole === 'admin' || userRole === 'manager') {
            const q = query(
                collection(db, 'users', userId, 'notifications'),
                orderBy('createdAt', 'desc')
            );
            unsubscribe = onSnapshot(q, snapshot => {
                const fetchedNotifications = snapshot.docs.map(doc => {
                    return {
                        id: doc.id,
                        parentPath: doc.ref.path,
                        ...doc.data(),
                    } as Notification
                });
                setNotifications(fetchedNotifications);
            }, (error) => {
                console.error("Error fetching user notifications: ", error);
            });
        } else { // Developer or QA
            const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', userName));
            
            const taskListeners: (() => void)[] = [];
            const notificationsByTask: Record<string, Notification[]> = {};

            unsubscribe = onSnapshot(tasksQuery, (tasksSnapshot) => {
                // Clean up old listeners
                taskListeners.forEach(unsub => unsub());
                taskListeners.length = 0;

                const taskIds = tasksSnapshot.docs.map(doc => doc.id);
                if (taskIds.length === 0) {
                    setNotifications([]);
                    return;
                }

                tasksSnapshot.docs.forEach(taskDoc => {
                    const taskId = taskDoc.id;
                    const notificationsQuery = query(
                        collection(db, 'tasks', taskId, 'notifications'),
                        where('recipientId', '==', userId)
                    );

                    const listener = onSnapshot(notificationsQuery, (notificationsSnapshot) => {
                        const taskNotifications = notificationsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            parentPath: doc.ref.path,
                            ...doc.data(),
                        } as Notification));
                        
                        notificationsByTask[taskId] = taskNotifications;

                        // Combine all notifications from all tasks
                        const allNotifications = Object.values(notificationsByTask).flat();
                        allNotifications.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                        setNotifications(allNotifications);
                    }, (error) => {
                        console.error(`Error fetching notifications for task ${taskId}: `, error);
                    });
                    taskListeners.push(listener);
                });
            }, (error) => {
                console.error("Error fetching assigned tasks: ", error);
            });
            
            // Add listeners cleanup to the main unsubscribe function
            const originalUnsubscribe = unsubscribe;
            unsubscribe = () => {
                originalUnsubscribe();
                taskListeners.forEach(unsub => unsub());
            };
        }

        return () => {
            if (Array.isArray(unsubscribe)) {
                unsubscribe.forEach(unsub => unsub());
            } else {
                unsubscribe();
            }
        };
    }, [userId, userRole, userName]);


    const handleNotificationClick = async (notification: Notification) => {
        if(replyingTo === notification.id) return;

        if (notification.taskId) {
            const taskDoc = await getDoc(doc(db, 'tasks', notification.taskId));
            if (taskDoc.exists()) {
                setViewingTask({ id: taskDoc.id, ...taskDoc.data() } as Task);
            }
        } else if (notification.projectId) {
            if (userRole === 'manager') {
                router.push(`/manager-dashboard?view=projects`);
            } else if (userRole === 'admin') {
                router.push(`/?view=projects`);
            }
        }
        
       markAsRead(notification);
    };
    
    const markAsRead = async (notification: Notification) => {
        if (notification.read || !notification.parentPath) return;

        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: true} : n));
        
        try {
            const notificationRef = doc(db, notification.parentPath);
            await updateDoc(notificationRef, { read: true });
        } catch(e) {
            console.warn("Could not mark notification as read:", e);
            // Revert optimistic update on failure
            setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: false} : n));
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
        const tempReplyContent = replyContent;
        
        setReplyContent('');
        setReplyingTo(null);
        
        const tempReplyId = Date.now().toString();
        setSentReplies(prev => [...prev.filter(r => r.id !== notification.id), { id: notification.id, content: tempReplyContent, status: 'sending' }]);
        
        markAsRead(notification);

        setSentReplies(prev => prev.map(r => r.id === notification.id ? { ...r, status: 'sending' } : r));

        setTimeout(() => {
            setSentReplies(prev => prev.map(r => r.id === notification.id ? { ...r, status: 'sent' } : r));
            setTimeout(async () => {
                 try {
                    const currentUser = auth.currentUser;
                    if (!currentUser) throw new Error("User not authenticated.");

                    const taskDoc = await getDoc(doc(db, 'tasks', notification.taskId!));
                    if (!taskDoc.exists()) throw new Error("Task not found.");

                    const taskData = taskDoc.data() as Task;
                    
                    await addDoc(collection(db, 'tasks', notification.taskId!, 'comments'), {
                        text: tempReplyContent,
                        authorName: localStorage.getItem('userName'),
                        authorRole: localStorage.getItem('userRole'),
                        authorAvatar: localStorage.getItem('userAvatar') || null,
                        createdAt: Timestamp.now(),
                    });

                    const recipient = await getOppositeUser(taskData, currentUser.uid, currentUser.displayName || '');

                    if (recipient && recipient.id !== currentUser.uid) {
                        let notificationCollection;
                        if (recipient.role === 'manager' || recipient.role === 'admin') {
                            notificationCollection = collection(db, 'users', recipient.id, 'notifications');
                        } else {
                            notificationCollection = collection(db, 'tasks', notification.taskId!, 'notifications');
                        }
                        await addDoc(notificationCollection, {
                            type: 'comment',
                            recipientId: recipient.id,
                            senderName: localStorage.getItem('userName'),
                            senderAvatar: localStorage.getItem('userAvatar') || null,
                            taskId: notification.taskId,
                            taskName: taskData.taskName,
                            messageSnippet: tempReplyContent.substring(0, 50),
                            read: false,
                            createdAt: Timestamp.now(),
                        });
                    }
                    setSentReplies(prev => prev.map(r => r.id === notification.id ? { ...r, status: 'confirmed' } : r));
                } catch (error: any) {
                    console.error("Error sending reply: ", error);
                    toast({
                        variant: 'destructive',
                        title: "Failed to send reply",
                        description: error.message
                    });
                    setSentReplies(prev => prev.filter(r => r.id !== notification.id));
                } finally {
                    setIsSubmittingReply(false);
                }
            }, 1000); 
        }, 100);
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
            <audio ref={audioRef} src="https://res.cloudinary.com/dtdgxqt6p/video/upload/v1754223850/new-notification-021-370045_ejdegd.mp3" preload="auto" />
            <DropdownMenu onOpenChange={(open) => { if(!open) setReplyingTo(null) }}>
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
                                notifications.map(notification => {
                                    const repliedInfo = sentReplies.find(r => r.id === notification.id);
                                    return (
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
                                                ) : repliedInfo ? (
                                                     <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 animate-in fade-in">
                                                        {repliedInfo.status === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                        {repliedInfo.status === 'sent' && <> <ThumbsUp className="h-3.5 w-3.5 text-green-500" /> <span>Reply sent!</span> </>}
                                                        {repliedInfo.status === 'confirmed' && <span>Replied: - "{repliedInfo.content}"</span>}
                                                    </div>
                                                ) : !notification.read ? (
                                                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); setReplyingTo(notification.id)}}>
                                                        Reply here
                                                    </Button>
                                                ) : null}
                                            </div>
                                        )}
                                    </DropdownMenuItem>
                                )})
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
