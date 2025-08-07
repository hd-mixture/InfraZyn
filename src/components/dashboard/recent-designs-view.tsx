
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DesignTask } from './assigned-designs-view';

type RecentDesignsViewProps = {
    designerName: string | null;
};

export function RecentDesignsView({ designerName }: RecentDesignsViewProps) {
    const [completedTasks, setCompletedTasks] = useState<DesignTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!designerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(
            collection(db, "tasks"),
            where("assignedTo", "==", designerName),
            where("taskRole", "==", "designer"),
            where("status", "==", "Done"),
            orderBy("dueDate", "desc")
        );
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignTask));
            setCompletedTasks(fetchedTasks);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching completed designs:", err);
            setLoading(false);
        });

        return () => {
            unsubscribeTasks();
        };
    }, [designerName]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Designs</CardTitle>
                <CardDescription>A gallery of your latest completed work.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <p className="text-center">Loading recent designs...</p>
                 ) : completedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Designs Here Yet</h3>
                        <p className="text-muted-foreground mt-1 text-sm text-center">Your completed designs will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {completedTasks.slice(0, 4).map((task, index) => {
                            const finalImage = task.completionAttachments && task.completionAttachments.length > 0
                                ? task.completionAttachments[0].url
                                : `https://placehold.co/400x300.png?text=No%20Image&${index}`;
                            
                            return (
                                <div key={task.id} className="relative group overflow-hidden rounded-lg">
                                    <Image
                                        src={finalImage}
                                        alt={task.taskName}
                                        width={400}
                                        height={300}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                        data-ai-hint="design abstract"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-3 text-white">
                                        <h4 className="font-semibold text-sm truncate">{task.taskName}</h4>
                                        <p className="text-xs opacity-80">{formatDistanceToNow(task.dueDate.toDate(), { addSuffix: true })}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
