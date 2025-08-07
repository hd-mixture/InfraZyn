
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday } from 'date-fns';
import { Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ViewDesignTaskDialog } from './view-design-task-dialog';
import { Progress } from '../ui/progress';

export type DesignTask = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    taskType: 'UI Design' | 'UX Research' | 'Wireframing' | 'Prototyping' | 'Design Review' | 'Design Handoff' | 'Graphic Design' | 'Responsive Design';
    dueDate: Timestamp;
    progress?: number;
    description?: string;
    attachmentUrls?: { name: string, url: string }[];
    priority?: 'Low' | 'Medium' | 'High';
    completionAttachments?: { name: string; url: string; }[];
};

type Project = {
    id: string;
    projectName: string;
};

type AssignedDesignsViewProps = {
    designerName: string | null;
};

const statusColor: { [key: string]: string } = {
    "Done": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "To Do": "border-yellow-500 text-yellow-500",
};

export function AssignedDesignsView({ designerName }: AssignedDesignsViewProps) {
    const [tasks, setTasks] = useState<DesignTask[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingTask, setViewingTask] = useState<DesignTask | null>(null);

    useEffect(() => {
        if (!designerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", designerName), where("taskRole", "==", "designer"));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignTask));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tasks:", err);
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

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
    }, [tasks]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>My Assigned Designs</CardTitle>
                    <CardDescription>All your active and upcoming design tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center">Loading designs...</p>
                    ) : sortedTasks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">No design tasks assigned yet. Time to be creative!</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTasks.map(task => {
                                    const dueDate = task.dueDate.toDate();
                                    const isOverdue = isPast(dueDate) && !isToday(dueDate);
                                    return (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">
                                                <div>{task.taskName}</div>
                                                <div className="text-xs text-muted-foreground">{task.taskType}</div>
                                            </TableCell>
                                            <TableCell>{getProjectName(task.project)}</TableCell>
                                            <TableCell className={cn(isOverdue && 'text-destructive')}>
                                                {format(dueDate, 'MMM dd, yyyy')}
                                            </TableCell>
                                             <TableCell>
                                                {task.status === 'In Progress' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={task.progress || 0} indicatorClassName="bg-blue-500" className="w-24" />
                                                        <span className="text-xs text-muted-foreground">{task.progress || 0}%</span>
                                                    </div>
                                                ) : task.status === 'Done' ? (
                                                     <div className="flex items-center gap-2">
                                                        <Progress value={100} indicatorClassName="bg-green-500" className="w-24" />
                                                        <span className="text-xs text-muted-foreground">100%</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className={statusColor[task.status]}>{task.status}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon" onClick={() => setViewingTask(task)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {viewingTask && (
                <ViewDesignTaskDialog
                    task={viewingTask}
                    projectName={getProjectName(viewingTask.project)}
                    isOpen={!!viewingTask}
                    onOpenChange={(isOpen) => !isOpen && setViewingTask(null)}
                />
            )}
        </>
    );
}
