
'use client'

import { PlusCircle, MoreHorizontal, Clock, ArrowUp, ArrowRight, ArrowDown, Edit, Trash2, Code, ShieldCheck, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { CreateTaskForm } from './create-task-form';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { EditTaskForm } from './edit-task-form';
import { ViewTaskDetailsDialog } from './view-task-details-dialog';


export type Task = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    priority: 'High' | 'Medium' | 'Low' | 'Critical';
    dueDate: Timestamp;
    assignedTo: string;
    description?: string;
    attachmentUrls?: { name: string; url: string }[];
    createdAt: Timestamp;
    // Developer specific
    taskRole: 'developer' | 'qa';
    taskType?: 'Feature' | 'Bug Fix' | 'Enhancement';
    estimatedHours?: number;
    techStack?: string;
    subtasks?: string;
    // QA specific
    testCaseTitle?: string;
    relatedModule?: string;
    testDescription?: string;
    testType?: 'Manual' | 'Automation' | 'Regression' | 'Smoke';
    bugSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
    expectedResult?: string;
    testData?: string;
};


type User = {
    id: string;
    name: string;
    avatar?: string;
}

type Project = {
    id: string;
    projectName: string;
    projectManager: string;
}

const priorityIcons = {
    'High': <ArrowUp className="h-4 w-4 text-red-500" />,
    'Medium': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />,
    'Critical': <ArrowUp className="h-4 w-4 text-red-700" />
};

const roleIcons = {
    'developer': <Code className="h-4 w-4 text-blue-500" />,
    'qa': <ShieldCheck className="h-4 w-4 text-green-500" />
}

function TaskCard({ task, assignedUser, projectName, onEdit, onDelete, onView }: { task: Task, assignedUser?: User, projectName?: string, onEdit: (task: Task) => void, onDelete: (task: Task) => void, onView: (task: Task) => void }) {
    return (
        <Card className="mb-4 bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {roleIcons[task.taskRole]}
                        <p className="font-semibold text-sm">{task.taskName}</p>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => onView(task)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(task)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {projectName && <Badge variant="secondary" className="mb-3">{projectName}</Badge>}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(task.dueDate.toDate(), 'MMM dd')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {priorityIcons[task.priority]}
                        {assignedUser && (
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={assignedUser.avatar || `https://placehold.co/40x40.png?text=${assignedUser.name.charAt(0)}`} data-ai-hint="person face" />
                                <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

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
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();


    useEffect(() => {
        const usersQuery = query(collection(db, "users"));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(fetchedUsers);
        });

        const projectsQuery = query(collection(db, "projects"));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(fetchedProjects);
        });
        
        return () => {
            unsubscribeUsers();
            unsubscribeProjects();
        };
    }, []);
    
    useEffect(() => {
        setLoading(true);
    
        let unsubscribeTasks = () => {};
    
        if (userRole === 'admin') {
            const tasksQuery = query(collection(db, "tasks"));
            unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
                const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setTasks(fetchedTasks);
                setLoading(false);
            }, () => setLoading(false));
        } else if (userRole === 'manager' && managerName) {
            const projectsQuery = query(collection(db, "projects"), where("projectManager", "==", managerName));
            const unsubscribeProjects = onSnapshot(projectsQuery, (projectSnapshot) => {
                const managerProjectIds = projectSnapshot.docs.map(doc => doc.id);
                
                if (managerProjectIds.length > 0) {
                    const tasksQuery = query(collection(db, "tasks"), where('project', 'in', managerProjectIds));
                    unsubscribeTasks = onSnapshot(tasksQuery, (taskSnapshot) => {
                        const fetchedTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                        setTasks(fetchedTasks);
                        setLoading(false);
                    }, () => setLoading(false));
                } else {
                    setTasks([]);
                    setLoading(false);
                }
            });
    
            return () => {
                unsubscribeProjects();
                unsubscribeTasks();
            };
        } else {
            setLoading(false);
        }
    
        return () => unsubscribeTasks();
    }, [userRole, managerName]);
    

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        const lowercasedQuery = searchQuery.toLowerCase();
        return tasks.filter(task => task.taskName.toLowerCase().includes(lowercasedQuery));
    }, [tasks, searchQuery]);
    
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsEditDialogOpen(true);
    };

    const handleViewTask = (task: Task) => {
        setViewingTask(task);
        setIsViewDialogOpen(true);
    };

    const openDeleteDialog = (task: Task) => {
        setDeletingTask(task);
        setIsDeleteDialogOpen(true);
    }
    
    const handleDelete = async () => {
        if(!deletingTask) return;
        try {
            await deleteDoc(doc(db, "tasks", deletingTask.id));
            toast({
                title: "Task Deleted!",
                description: "The task has been successfully deleted.",
            });
        } catch(e) {
            console.error("Error deleting document: ", e);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem deleting the task.",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingTask(null);
        }
    }


    const columns = useMemo(() => {
        const findUserByName = (userName: string) => users.find(u => u.name === userName);
        const findProject = (projectId: string) => projects.find(p => p.id === projectId);

        return [
            { id: 'todo', title: 'To Do', tasks: filteredTasks.filter(t => t.status === 'To Do') },
            { id: 'inprogress', title: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'In Progress') },
            { id: 'done', title: 'Done', tasks: filteredTasks.filter(t => t.status === 'Done') }
        ].map(column => ({
            ...column,
            tasks: column.tasks.map(task => ({
                    ...task,
                    assignedUser: findUserByName(task.assignedTo),
                    projectName: findProject(task.project)?.projectName
            }))
        }));
    }, [filteredTasks, users, projects]);


    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading tasks...</div>
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4">
                <CreateTaskForm>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </CreateTaskForm>
            </div>
            <ScrollArea className="flex-grow">
                <div className="flex gap-6 pb-4">
                    {columns.map(column => (
                        <div key={column.id} className="w-[320px] flex-shrink-0">
                            <Card className="bg-muted/50">
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-medium">{column.title}</CardTitle>
                                        <Badge variant="secondary">{column.tasks.length}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 min-h-[100px]">
                                    {column.tasks.map(task => (
                                        <TaskCard 
                                            key={task.id} 
                                            task={task} 
                                            assignedUser={task.assignedUser} 
                                            projectName={task.projectName} 
                                            onEdit={handleEditTask}
                                            onDelete={openDeleteDialog}
                                            onView={handleViewTask}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
             {editingTask && (
                <EditTaskForm
                    task={editingTask}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
             {viewingTask && (
                <ViewTaskDetailsDialog
                    task={viewingTask}
                    isOpen={isViewDialogOpen}
                    onOpenChange={setIsViewDialogOpen}
                />
            )}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this task
                        and remove its data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingTask(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
