
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

type Task = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    priority: 'High' | 'Medium' | 'Low';
    dueDate: Timestamp;
};

type Project = {
    id: string;
    projectName: string;
};

type AssignedTasksViewProps = {
    developerName: string | null;
    isDashboard?: boolean;
    view?: 'list' | 'checklist';
};

const statusColor: { [key: string]: string } = {
    "Done": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "To Do": "border-yellow-500 text-yellow-500",
};

const priorityIcons = {
    'High': <ArrowUp className="h-4 w-4 text-red-500" />,
    'Medium': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />
};

export function AssignedTasksView({ developerName, isDashboard = false, view = 'list' }: AssignedTasksViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!developerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", developerName));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(fetchedTasks);
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
    }, [developerName]);

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
    };

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
    }, [tasks]);

    if (loading) {
        return <Card><CardContent className="p-6 text-center">Loading tasks...</CardContent></Card>;
    }

    const title = isDashboard ? (view === 'checklist' ? "Today's Tasks" : "Assigned Tasks") : "My Tasks";
    const description = isDashboard ? (view === 'checklist' ? "Tasks due today." : "All your assigned tasks.") : "A complete list of your tasks across all projects.";

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {sortedTasks.length === 0 ? (
                    <p className="text-muted-foreground">No tasks assigned yet.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                {view === 'list' && <TableHead>Project</TableHead>}
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.taskName}</TableCell>
                                    {view === 'list' && <TableCell>{getProjectName(task.project)}</TableCell>}
                                    <TableCell>{format(task.dueDate.toDate(), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusColor[task.status]}>{task.status}</Badge>
                                    </TableCell>
                                    <TableCell>{priorityIcons[task.priority]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
