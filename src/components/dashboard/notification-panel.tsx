
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDoc, collectionGroup } from 'firebase/firestore';
import { Bell, Check, MessageSquare } from 'lucide-react';
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

type Notification = {
    id: string;
    recipientId: string;
    senderName: string;
    senderAvatar: string | null;
    taskId: string;
    taskName: string;
    messageSnippet: string;
    read: boolean;
    createdAt: any;
};

export function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

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

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            return;
        }

        const q = query(
            collectionGroup(db, 'notifications'),
            where('recipientId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, snapshot => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Notification));
            
            // Sort notifications on the client side
            fetchedNotifications.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            
            setNotifications(fetchedNotifications);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
        });

        return () => unsubscribe();
    }, [userId]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    const handleNotificationClick = async (notification: Notification) => {
        const taskDoc = await getDoc(doc(db, 'tasks', notification.taskId));
        if (taskDoc.exists()) {
            setViewingTask({ id: taskDoc.id, ...taskDoc.data() } as Task);
        }
        
        if (!notification.read) {
            const notificationRef = doc(db, 'tasks', notification.taskId, 'notifications', notification.id);
            await updateDoc(notificationRef, { read: true });
        }
    };
    
    const markAllAsRead = async () => {
        const promises = notifications
            .filter(n => !n.read)
            .map(n => {
                const notificationRef = doc(db, 'tasks', n.taskId, 'notifications', n.id);
                return updateDoc(notificationRef, { read: true });
            });
        await Promise.all(promises);
    };


    const getProjectNameForTask = async (taskId: string): Promise<string> => {
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (taskDoc.exists()) {
            const projectId = taskDoc.data().project;
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            if (projectDoc.exists()) {
                return projectDoc.data().projectName;
            }
        }
        return 'Unknown Project';
    };
    
    const handleDialogClose = () => {
        setViewingTask(null);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 relative">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                                {unreadCount}
                            </span>
                        )}
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
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
                                    <DropdownMenuItem key={notification.id} onSelect={() => handleNotificationClick(notification)} className="flex items-start gap-3 p-3 cursor-pointer">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={notification.senderAvatar || `https://placehold.co/32x32.png`} data-ai-hint="person face" />
                                            <AvatarFallback>{notification.senderName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{notification.senderName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Commented on: <span className="font-semibold">{notification.taskName}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground italic truncate">
                                                "{notification.messageSnippet}"
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuGroup>
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>

            {viewingTask && userRole === 'manager' && (
                <ViewTaskDialog
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onOpenChange={handleDialogClose}
                />
            )}
            {viewingTask && userRole === 'developer' && (
                <ViewDeveloperTaskDialog
                    task={viewingTask}
                    projectName="Loading..." // This could be improved if needed
                    isOpen={!!viewingTask}
                    onOpenChange={handleDialogClose}
                />
            )}
        </>
    );
}
