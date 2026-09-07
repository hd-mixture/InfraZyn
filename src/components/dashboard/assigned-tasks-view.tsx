
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowUp, ArrowRight, ArrowDown, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { ViewDeveloperTaskDialog } from './view-developer-task-dialog';
import { Progress } from '../ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';
import { CompleteTaskDialog } from './complete-task-dialog';


export type Task = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    dueDate: Timestamp;
    description?: string;
    attachmentUrls?: { name: string, url: string }[];
    developerNotes?: string;
    developerAttachments?: { name: string, url: string }[];
    progress?: number;
    completedAt?: Timestamp;
    completionNotes?: string;
    completionAttachments?: { name: string, url: string }[];
};

type Project = {
    id: string;
    projectName: string;
};

type AssignedTasksViewProps = {
    developerName: string | null;
    isDashboard?: boolean;
};

const priorityIcons = {
    'Critical': <ArrowUp className="h-4 w-4 text-purple-600" />,
    'High': <ArrowUp className="h-4 w-4 text-red-500" />,
    'Medium': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />
};

export function AssignedTasksView({ developerName, isDashboard = false }: AssignedTasksViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const { toast } = useToast();

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
    }, [developerName]);

    const handleStatusChange = async (task: Task, newStatus: 'To Do' | 'In Progress' | 'Done') => {
        if (newStatus === 'Done') {
            setCompletingTask(task);
            return;
        }

        try {
            const taskRef = doc(db, "tasks", task.id);
            const updateData: { status: string; progress?: number } = { status: newStatus };
            if (newStatus === 'To Do') {
                updateData.progress = 0;
            } else if (newStatus === 'In Progress' && (task.progress || 0) === 100) {
                 updateData.progress = 99;
            }
            await updateDoc(taskRef, updateData);

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
    
    const handleProgressChange = async (taskId: string, newProgress: number) => {
        try {
            const taskRef = doc(db, "tasks", taskId);
            await updateDoc(taskRef, { progress: newProgress });
        } catch (error) {
            console.error("Error updating progress: ", error);
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not save progress. Please try again.",
            });
        }
    };


    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
    };

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
    }, [tasks]);

    if (loading) {
        return <Card><CardContent className="p-6 text-center">Loading tasks...</CardContent></Card>;
    }

    const title = isDashboard ? "Assigned Tasks" : "My Tasks";
    const description = isDashboard ? "All your assigned tasks." : "A complete list of your tasks across all projects.";

    return (
        <>
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
                                    {!isDashboard && <TableHead>Project</TableHead>}
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    {!isDashboard && <TableHead>Progress</TableHead>}
                                    <TableHead>Priority</TableHead>
                                    {!isDashboard && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.taskName}</TableCell>
                                        {!isDashboard && <TableCell>{getProjectName(task.project)}</TableCell>}
                                        <TableCell>{format(task.dueDate.toDate(), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={task.status}
                                                onValueChange={(newStatus: 'To Do' | 'In Progress' | 'Done') => handleStatusChange(task, newStatus)}
                                                disabled={isDashboard}
                                            >
                                                <SelectTrigger className="w-[120px] h-8 text-xs" disabled={isDashboard}>
                                                    <SelectValue placeholder="Set status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="To Do">To Do</SelectItem>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Done">Done</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                         {!isDashboard && (
                                            <TableCell>
                                                {task.status === 'In Progress' ? (
                                                     <Popover>
                                                        <PopoverTrigger asChild>
                                                            <div className="w-[120px] cursor-pointer group">
                                                                <Progress value={task.progress || 0} indicatorClassName="bg-blue-500" />
                                                                <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {task.progress || 0}%
                                                                </span>
                                                            </div>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-48 p-2">
                                                             <Slider
                                                                defaultValue={[task.progress || 0]}
                                                                max={100}
                                                                step={5}
                                                                onValueCommit={(value) => handleProgressChange(task.id, value[0])}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : task.status === 'Done' ? (
                                                    <Progress value={100} indicatorClassName="bg-green-500" className="w-[120px]" />
                                                ) : (
                                                    <div className="w-[120px] h-2 bg-secondary rounded-full" />
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell>{priorityIcons[task.priority]}</TableCell>
                                        {!isDashboard && (
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setViewingTask(task)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {viewingTask && (
                <ViewDeveloperTaskDialog
                    task={viewingTask}
                    projectName={getProjectName(viewingTask.project)}
                    isOpen={!!viewingTask}
                    onOpenChange={(isOpen) => !isOpen && setViewingTask(null)}
                />
            )}
            
            {completingTask && (
                <CompleteTaskDialog
                    task={completingTask}
                    isOpen={!!completingTask}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setCompletingTask(null);
                        }
                    }}
                />
            )}
        </>
    );
}
