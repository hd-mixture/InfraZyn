'use client'

import { PlusCircle, Clock, ArrowUp, ArrowRight, ArrowDown, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { CreateTaskForm } from './create-task-form';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast";
import { EditTaskForm } from './edit-task-form';
import { ViewTaskDialog } from './view-task-dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Progress } from '../ui/progress';


export type Task = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    priority: 'High' | 'Medium' | 'Low' | 'Critical';
    dueDate: Timestamp;
    assignedTo: string;
    description?: string;
    attachmentUrls?: { name: string, url: string }[];
    createdAt: Timestamp;
    taskRole: 'developer' | 'qa';
    taskType?: 'Feature' | 'Bug Fix' | 'Enhancement';
    estimatedHours?: number;
    techStack?: string;
    subtasks?: string;
    testCaseTitle?: string;
    relatedModule?: string;
    testDescription?: string;
    testType?: 'Manual' | 'Automation' | 'Regression' | 'Smoke';
    bugSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
    progress?: number;
};


type User = {
    id: string;
    name: string;
    avatar?: string;
    role: 'developer' | 'qa' | 'manager';
}

type Project = {
    id: string;
    projectName: string;
    projectManager: string;
    pinned?: boolean;
}

const priorityIcons: { [key: string]: React.ReactNode } = {
    'Critical': <ArrowUp className="h-4 w-4 text-red-700" />,
    'High': <ArrowUp className="h-4 w-4 text-red-500" />,
    'Medium': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />
};

const TaskCard = ({ task, user, onEditTask, onViewTask }: { task: Task, user?: User, onEditTask: (task: Task) => void, onViewTask: (task: Task) => void }) => (
    <Card className="mb-4 bg-card hover:shadow-md transition-shadow">
        <CardHeader className="p-3">
            <div className="flex justify-between items-start">
                 <h4 className="font-semibold text-sm leading-tight pr-2">{task.taskName}</h4>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onViewTask(task)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTask(task)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
             {task.status === 'In Progress' && task.progress !== undefined && (
                <div className="flex items-center gap-2 mb-2">
                    <Progress value={task.progress} className="w-full h-1" indicatorClassName="bg-blue-500" />
                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                </div>
            )}
             {task.status === 'Done' && (
                <div className="flex items-center gap-2 mb-2">
                    <Progress value={100} className="w-full h-1" indicatorClassName="bg-green-500" />
                    <span className="text-xs text-muted-foreground">100%</span>
                </div>
            )}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(task.dueDate.toDate(), 'MMM dd')}</span>
                </div>
                 {priorityIcons[task.priority]}
            </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Avatar className="h-6 w-6">
                            <AvatarImage src={user?.avatar} data-ai-hint="person face" />
                            <AvatarFallback>{task.assignedTo.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{task.assignedTo}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </CardFooter>
    </Card>
);

type TasksKanbanViewProps = {
    searchQuery?: string;
    userRole: 'admin' | 'manager';
    managerName?: string | null;
}

export function TasksKanbanView({ searchQuery, userRole, managerName }: TasksKanbanViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { toast } = useToast();

    const taskQuery = useMemo(() => {
        if (userRole === 'manager' && managerName) {
            const managerProjectIds = projects
                .filter(p => p.projectManager === managerName)
                .map(p => p.id);
            
            if (managerProjectIds.length > 0) {
                 return query(collection(db, 'tasks'), where('project', 'in', managerProjectIds));
            } else {
                // To return an empty query if manager has no projects
                return query(collection(db, 'tasks'), where('project', 'in', ['non-existent']));
            }
        }
        return query(collection(db, 'tasks'));
    }, [userRole, managerName, projects]);
    
    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });

        const unsubscribeProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
        });
        
        return () => {
            unsubscribeUsers();
            unsubscribeProjects();
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
            let fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            
            // Sort in code instead of query to avoid composite index requirement
             fetchedTasks.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return b.createdAt.toMillis() - a.createdAt.toMillis();
                }
                return 0;
            });


            setTasks(fetchedTasks);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tasks: ", err);
            setLoading(false)
        });
        return () => unsubscribeTasks();
    }, [taskQuery]);


    const projectsWithTasks = useMemo(() => {
        const projectMap = new Map(projects.map(p => [p.id, { ...p, tasks: [] as Task[] }]));
        const lowercasedQuery = searchQuery?.toLowerCase() || '';
        const userMap = new Map(users.map(u => [u.name, u]));

        tasks.forEach(task => {
            const project = projectMap.get(task.project);
            if (project) {
                const user = userMap.get(task.assignedTo);
                const projectMatches = project.projectName.toLowerCase().includes(lowercasedQuery);
                const taskMatches = task.taskName.toLowerCase().includes(lowercasedQuery);
                const assigneeMatches = task.assignedTo.toLowerCase().includes(lowercasedQuery);

                if (searchQuery && (projectMatches || taskMatches || assigneeMatches)) {
                     project.tasks.push(task);
                } else if (!searchQuery) {
                    project.tasks.push(task);
                }
            }
        });

        return Array.from(projectMap.values())
            .filter(p => p.tasks.length > 0)
            .sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    }, [projects, tasks, users, searchQuery]);

    const userMap = useMemo(() => new Map(users.map(u => [u.name, u])), [users]);

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading tasks...</div>
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4">
                <CreateTaskForm userRole={userRole} managerName={managerName}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </CreateTaskForm>
            </div>
            <ScrollArea className="flex-grow -mx-4 px-4">
                <div className="space-y-8 pb-4">
                    {projectsWithTasks.length === 0 && (
                        <div className="text-center text-muted-foreground pt-10">No tasks found.</div>
                    )}
                    {projectsWithTasks.map(project => (
                        <div key={project.id}>
                            <h3 className="text-xl font-bold mb-4">{project.projectName}</h3>
                            <div className="flex flex-wrap gap-6">
                                {(['To Do', 'In Progress', 'Done'] as const).map(status => (
                                    <div key={status} className="flex-1 min-w-[300px]">
                                        <Card className="bg-muted/50 border-none h-full">
                                            <CardHeader className="p-4">
                                                <CardTitle className="text-base font-medium">{status}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                {project.tasks.filter(t => t.status === status).map(task => (
                                                    <TaskCard 
                                                        key={task.id} 
                                                        task={task} 
                                                        user={userMap.get(task.assignedTo)}
                                                        onViewTask={setViewingTask}
                                                        onEditTask={setEditingTask}
                                                    />
                                                ))}
                                                {project.tasks.filter(t => t.status === status).length === 0 && (
                                                    <div className="text-center text-sm text-muted-foreground py-10">No tasks</div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
             {viewingTask && (
                <ViewTaskDialog
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onOpenChange={() => setViewingTask(null)}
                />
            )}
            {editingTask && (
                <EditTaskForm 
                    task={editingTask}
                    isOpen={!!editingTask}
                    onOpenChange={() => setEditingTask(null)}
                />
            )}
        </div>
    );
}
