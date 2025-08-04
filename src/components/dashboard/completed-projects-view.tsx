
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FolderArchive } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

type Task = {
    id: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
};

type Project = {
    id: string;
    projectName: string;
    projectManager: string;
    logoUrl?: string;
    endDate: Timestamp;
};

type CompletedProjectsViewProps = {
    developerName: string | null;
};

export function CompletedProjectsView({ developerName }: CompletedProjectsViewProps) {
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!developerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", developerName));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
        });

        const projectsQuery = query(collection(db, "projects"));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            setAllProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
            setLoading(false);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeProjects();
        };
    }, [developerName]);

    const completedProjects = useMemo(() => {
        const developerProjects = new Map<string, { allTasks: Task[], doneTasks: Task[] }>();

        // Group tasks by project
        allTasks.forEach(task => {
            if (!developerProjects.has(task.project)) {
                developerProjects.set(task.project, { allTasks: [], doneTasks: [] });
            }
            const projectTasks = developerProjects.get(task.project)!;
            projectTasks.allTasks.push(task);
            if (task.status === 'Done') {
                projectTasks.doneTasks.push(task);
            }
        });

        const completedProjectIds: string[] = [];
        developerProjects.forEach((tasks, projectId) => {
            if (tasks.allTasks.length > 0 && tasks.allTasks.length === tasks.doneTasks.length) {
                completedProjectIds.push(projectId);
            }
        });
        
        return allProjects
            .filter(project => completedProjectIds.includes(project.id))
            .sort((a, b) => b.endDate.toMillis() - a.endDate.toMillis());

    }, [allTasks, allProjects]);

    if (loading) {
        return <div className="text-center py-10">Loading projects...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>My Completed Projects</CardTitle>
                    <CardDescription>Projects where all of your assigned tasks are done. Great job!</CardDescription>
                </CardHeader>
                <CardContent>
                    {completedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/50">
                            <FolderArchive className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">No Completed Projects Yet</h3>
                            <p className="text-muted-foreground mt-2">Keep up the great work! Your completed projects will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedProjects.map(project => (
                                <Card key={project.id} className="hover:border-primary/50 transition-colors">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-12 w-12 border rounded-md">
                                            <AvatarImage src={project.logoUrl || `https://placehold.co/48x48.png`} data-ai-hint="logo company" />
                                            <AvatarFallback>{project.projectName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{project.projectName}</h3>
                                            <p className="text-sm text-muted-foreground">Managed by {project.projectManager}</p>
                                        </div>
                                    </CardHeader>
                                    <CardFooter>
                                        <Badge variant="outline" className="text-green-600 border-green-500 bg-green-500/10 font-medium">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Completed {formatDistanceToNow(project.endDate.toDate(), { addSuffix: true })}
                                        </Badge>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
