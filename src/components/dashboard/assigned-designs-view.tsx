
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type DesignTask = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    taskType: 'UI Design' | 'UX Research' | 'Wireframing' | 'Prototyping' | 'Design Review' | 'Design Handoff' | 'Graphic Design' | 'Responsive Design';
    dueDate: Timestamp;
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
    const { toast } = useToast();

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

    const handleStatusChange = async (taskId: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
        try {
            const taskRef = doc(db, "tasks", taskId);
            await updateDoc(taskRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: "The task status has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was a problem updating the task status.",
            });
        }
    };

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
    };

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
    }, [tasks]);

    return (
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
                                <TableHead>Status</TableHead>
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
                                            <Select
                                                value={task.status}
                                                onValueChange={(newStatus: 'To Do' | 'In Progress' | 'Done') => handleStatusChange(task.id, newStatus)}
                                            >
                                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                                    <SelectValue placeholder="Set status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="To Do">To Do</SelectItem>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Done">Done</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
