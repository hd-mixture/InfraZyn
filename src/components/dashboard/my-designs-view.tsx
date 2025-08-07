
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ImageIcon, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { DesignTask } from './assigned-designs-view';

type Project = {
    id: string;
    projectName: string;
};

type MyDesignsViewProps = {
    designerName: string | null;
    searchQuery: string;
};

export function MyDesignsView({ designerName, searchQuery }: MyDesignsViewProps) {
    const [tasks, setTasks] = useState<DesignTask[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
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
            where("status", "==", "Done")
        );

        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignTask));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching designs:", err);
            setLoading(false);
        });

        const projectsQuery = query(collection(db, "projects"));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
            setProjects(fetchedProjects);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeProjects();
        };
    }, [designerName]);

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
    };
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(task =>
            task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getProjectName(task.project).toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => b.dueDate.toMillis() - a.dueDate.toMillis());
    }, [tasks, projects, searchQuery]);


    if (loading) {
        return <p className="text-center">Loading designs...</p>;
    }

    return (
        <div className="space-y-6">
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/50">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Designs Found</h3>
                    <p className="text-muted-foreground mt-2 text-center">Your completed designs will appear here. Try clearing your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTasks.map((task, index) => {
                        const finalImage = task.completionAttachments && task.completionAttachments.length > 0
                            ? task.completionAttachments[0].url
                            : `https://placehold.co/400x300.png?text=${encodeURIComponent(task.taskName)}&${index}`;

                        const completionTimestamp = task.completedAt ? task.completedAt.toDate() : task.dueDate.toDate();
                        const formattedCompletionDate = format(completionTimestamp, 'MMM dd, yyyy, p');

                        return (
                            <Card key={task.id} className="overflow-hidden group">
                                <CardContent className="p-0">
                                    <Image
                                        src={finalImage}
                                        alt={task.taskName}
                                        width={400}
                                        height={300}
                                        className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
                                        data-ai-hint="design abstract"
                                    />
                                </CardContent>
                                <CardFooter className="flex-col items-start p-4 bg-card">
                                    <p className="font-semibold truncate w-full" title={task.taskName}>{task.taskName}</p>
                                    <p className="text-sm text-muted-foreground">{getProjectName(task.project)}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Completed on {formattedCompletionDate}</p>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
