
'use client'
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { ViewQATaskDialog } from './view-qa-task-dialog';
import { ViewTaskDialog } from './view-task-dialog'; // Generic viewer


export type QATask = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    testType: string;
    dueDate: Timestamp;
    progress?: number;
    description?: string;
    attachmentUrls?: { name: string, url: string }[];
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    completionAttachments?: { name: string; url: string; }[];
    completionNotes?: string;
    completedAt?: Timestamp;
    createdAt: Timestamp;
    assignedTo: string;
    taskRole: 'qa';
};

type Project = {
    id: string;
    projectName: string;
};

type AssignedTestingTasksProps = {
    qaName: string | null;
    isDashboard?: boolean;
};

const statusColor: { [key: string]: string } = {
  "Done": "border-green-500 text-green-500",
  "In Progress": "border-blue-500 text-blue-500",
  "To Do": "border-yellow-500 text-yellow-500",
}

export function AssignedTestingTasks({ qaName, isDashboard = false }: AssignedTestingTasksProps) {
  const [tasks, setTasks] = useState<QATask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingTask, setViewingTask] = useState<QATask | null>(null);
  
  const title = isDashboard ? "My Testing Tasks" : "All Assigned Testing Tasks";
  const description = isDashboard ? "Your most recent testing tasks." : "A complete list of your assigned testing tasks.";

  useEffect(() => {
    if (!qaName) {
        setLoading(false);
        return;
    }

    const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", qaName), where("taskRole", "==", "qa"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QATask));
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
  }, [qaName]);

  const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
  };

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
    return isDashboard ? sorted.slice(0, 5) : sorted;
  }, [tasks, isDashboard]);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
         {loading ? (
            <p className="text-center">Loading tasks...</p>
        ) : sortedTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No testing tasks assigned yet. Enjoy the peace!</p>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTasks.map(task => (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">
                                <div>{task.taskName}</div>
                                <div className="text-xs text-muted-foreground">{task.testType}</div>
                            </TableCell>
                            <TableCell>{getProjectName(task.project)}</TableCell>
                            <TableCell>{format(task.dueDate.toDate(), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusColor[task.status]}>{task.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setViewingTask(task)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
    {viewingTask && !isDashboard && (
        <ViewQATaskDialog
            task={viewingTask}
            projectName={getProjectName(viewingTask.project)}
            isOpen={!!viewingTask}
            onOpenChange={(isOpen) => !isOpen && setViewingTask(null)}
        />
    )}
     {viewingTask && isDashboard && (
        <ViewTaskDialog
            task={viewingTask}
            isOpen={!!viewingTask}
            onOpenChange={(isOpen) => !isOpen && setViewingTask(null)}
        />
    )}
    </>
  )
}
