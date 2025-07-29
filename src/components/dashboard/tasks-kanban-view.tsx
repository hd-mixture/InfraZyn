
'use client'

import { PlusCircle, MoreHorizontal, Clock, ArrowUp, ArrowRight, ArrowDown, Edit, Trash2, Code, ShieldCheck, Eye, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { CreateTaskForm } from './create-task-form';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { EditTaskForm } from './edit-task-form';
import { ViewTaskDetailsDialog } from './view-task-details-dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';


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
    role: 'developer' | 'qa' | 'manager';
}

type Project = {
    id: string;
    projectName: string;
    projectManager: string;
    pinned?: boolean;
}

const roleIcons = {
    'developer': <Code className="h-4 w-4 text-blue-500" />,
    'qa': <ShieldCheck className="h-4 w-4 text-green-500" />
}

type TasksKanbanViewProps = {
    searchQuery?: string;
    userRole: 'admin' | 'manager';
    managerName?: string | null;
}

export type GroupedTask = {
    user: User;
    tasks: Task[];
    projects: Project[];
    nearestDueDate: Timestamp;
    highestPriority: 'Critical' | 'High' | 'Medium' | 'Low';
    projectManager: string;
    managerAvatar?: string;
}

const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];

const UserTasksCard = ({ userTask, onOpenDetails, onPinProject }: { userTask: GroupedTask, onOpenDetails: (userTask: GroupedTask) => void, onPinProject: (projectId: string, pinned: boolean) => void }) => {
    const primaryProject = userTask.projects[0];
    
    return (
        <Card key={userTask.user.id} className="bg-card hover:shadow-md transition-shadow relative">
             <CardHeader className="p-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    {roleIcons[userTask.user.role as 'developer' | 'qa']}
                    <span className="text-sm font-medium truncate">{userTask.user.name}</span>
                </div>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative group/avatar">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={userTask.managerAvatar} />
                                    <AvatarFallback>{userTask.projectManager.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Button variant="ghost" size="icon" className="absolute inset-0 h-full w-full opacity-0 group-hover/avatar:opacity-100 bg-black/30" onClick={() => onPinProject(primaryProject.id, !primaryProject.pinned)}>
                                     <Star className={`h-3 w-3 ${primaryProject.pinned ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           {primaryProject.pinned ? <p>Unpin</p> : (
                                <div className="flex items-center gap-2">
                                    <span>Pin</span>
                                    {roleIcons[userTask.user.role as 'developer' | 'qa']}
                                    <span>{userTask.user.name}</span>
                                </div>
                           )}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-1 mb-2">
                    {userTask.projects.map(p => <Badge key={p.id} variant="secondary">{p.projectName}</Badge>)}
                </div>
            </CardContent>
            <CardFooter className="p-3 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(userTask.nearestDueDate.toDate(), 'MMM dd')}</span>
            </div>
            <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={userTask.user.avatar} />
                                    <AvatarFallback>{userTask.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{userTask.user.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpenDetails(userTask)}>
                                <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View Details</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
            </div>
            </CardFooter>
        </Card>
    );
};


export function TasksKanbanView({ searchQuery, userRole, managerName }: TasksKanbanViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [managerProjects, setManagerProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingUserTasks, setViewingUserTasks] = useState<GroupedTask | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
        if (userRole === 'admin') {
            setLoading(true);
            const tasksQuery = query(collection(db, "tasks"));
            const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
                const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setTasks(fetchedTasks);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching tasks for admin: ", err);
                setLoading(false)
            });
            return () => unsubscribe();
        }
    }, [userRole]);


    useEffect(() => {
        if (userRole !== 'manager' || !managerName) {
            if (userRole === 'manager') setLoading(false);
            return;
        }

        setLoading(true);
        const projectsQuery = query(collection(db, "projects"), where("projectManager", "==", managerName));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setManagerProjects(fetchedProjects);
        }, (err) => {
            console.error("Error fetching manager projects: ", err);
        });
        
        return () => unsubscribeProjects();
    }, [userRole, managerName]);

    useEffect(() => {
        if (userRole !== 'manager') return;

        if (managerProjects.length === 0 && !loading) {
            setTasks([]);
            return;
        }
        
        const projectIds = managerProjects.map(p => p.id);
        if (projectIds.length === 0) {
            setTasks([]);
            setLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, "tasks"), where('project', 'in', projectIds));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching manager tasks: ", err);
            setLoading(false);
        });

        return () => unsubscribeTasks();
    }, [userRole, managerProjects, loading]);
    

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        const lowercasedQuery = searchQuery.toLowerCase();
        const projectMap = new Map(projects.map(p => [p.id, p.projectName]));

        return tasks.filter(task => {
            const projectName = projectMap.get(task.project)?.toLowerCase() || '';
            return task.taskName.toLowerCase().includes(lowercasedQuery) || 
                   task.assignedTo.toLowerCase().includes(lowercasedQuery) ||
                   projectName.includes(lowercasedQuery);
        });
    }, [tasks, searchQuery, projects]);
    
    const columns = useMemo(() => {
        const groupedByStatus: { [key: string]: { [key: string]: Task[] } } = {
            'To Do': {},
            'In Progress': {},
            'Done': {},
        };

        filteredTasks.forEach(task => {
            if (!groupedByStatus[task.status]) return;
            if (!groupedByStatus[task.status][task.assignedTo]) {
                groupedByStatus[task.status][task.assignedTo] = [];
            }
            groupedByStatus[task.status][task.assignedTo].push(task);
        });

        const projectMap = new Map(projects.map(p => [p.id, p]));
        const userMap = new Map(users.map(u => [u.name, u]));

        return Object.entries(groupedByStatus).map(([status, userTasks]) => {
            const processedUserTasks: GroupedTask[] = Object.entries(userTasks).map(([userName, tasks]) => {
                const user = userMap.get(userName);
                if (!user) return null;

                const uniqueProjectIds = [...new Set(tasks.map(t => t.project))];
                const projectDetails = uniqueProjectIds.map(id => projectMap.get(id)).filter(Boolean) as Project[];

                if (projectDetails.length === 0) return null;
                
                const projectManagerName = projectDetails[0]?.projectManager || 'N/A';
                const managerUser = userMap.get(projectManagerName);

                
                const nearestDueDate = tasks.reduce((nearest, current) => {
                    return current.dueDate.toMillis() < nearest.dueDate.toMillis() ? current : nearest;
                }).dueDate;

                const highestPriority = tasks.reduce((highest, current) => {
                    return priorityOrder.indexOf(current.priority) < priorityOrder.indexOf(highest.priority) ? current : highest;
                }).priority;


                return {
                    user,
                    tasks,
                    projects: projectDetails,
                    nearestDueDate,
                    highestPriority,
                    projectManager: projectManagerName,
                    managerAvatar: managerUser?.avatar,
                };
            }).filter(Boolean) as GroupedTask[];
            
            processedUserTasks.sort((a, b) => {
                const aPinned = a.projects[0]?.pinned || false;
                const bPinned = b.projects[0]?.pinned || false;
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return 0;
            });

            return {
                id: status.toLowerCase().replace(' ', ''),
                title: status,
                userTasks: processedUserTasks
            };
        });

    }, [filteredTasks, projects, users]);

    useEffect(() => {
        if (!isViewDialogOpen || !viewingUserTasks) return;

        let updatedUserTask: GroupedTask | undefined;
        for (const column of columns) {
            const found = column.userTasks.find(ut => ut.user.id === viewingUserTasks.user.id);
            if (found) {
                updatedUserTask = found;
                break;
            }
        }
        
        if (updatedUserTask) {
             setViewingUserTasks(updatedUserTask);
        } else {
            setIsViewDialogOpen(false);
        }

    }, [columns, isViewDialogOpen, viewingUserTasks]);


    const handleViewUserTasks = (userTasks: GroupedTask) => {
        setViewingUserTasks(userTasks);
        setIsViewDialogOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsEditDialogOpen(true);
    };

     const handlePinProject = async (projectId: string, pinned: boolean) => {
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { pinned });
             toast({
                title: `Project ${pinned ? 'Pinned' : 'Unpinned'}!`,
                description: `The project has been successfully ${pinned ? 'pinned' : 'unpinned'}.`,
            });
        } catch(e) {
            console.error("Error pinning project: ", e);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem pinning the project.",
            });
        }
    };


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
            <ScrollArea className="flex-grow">
                <div className="flex gap-6 pb-4">
                    {columns.map(column => (
                        <div key={column.id} className="w-[320px] flex-shrink-0">
                            <Card className="bg-muted/50 border-none">
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-medium">{column.title}</CardTitle>
                                        <Badge variant="secondary">{column.userTasks.reduce((acc, ut) => acc + ut.tasks.length, 0)}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 min-h-[100px] space-y-3">
                                   {column.userTasks.map((userTask) => (
                                        <UserTasksCard key={userTask.user.id} userTask={userTask} onOpenDetails={handleViewUserTasks} onPinProject={handlePinProject} />
                                   ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
             {viewingUserTasks && (
                <ViewTaskDetailsDialog
                    userTasks={viewingUserTasks}
                    isOpen={isViewDialogOpen}
                    onOpenChange={setIsViewDialogOpen}
                    onEditTask={handleEditTask}
                />
            )}
            {editingTask && (
                <EditTaskForm 
                    task={editingTask}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
        </div>
    );
}
