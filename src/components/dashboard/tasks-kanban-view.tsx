
'use client'

import { PlusCircle, MoreHorizontal, Clock, ArrowUp, ArrowRight, ArrowDown, Edit, Trash2, Code, ShieldCheck, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    projects: string[];
    nearestDueDate: Timestamp;
    highestPriority: 'Critical' | 'High' | 'Medium' | 'Low';
}

const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];

const UserTasksCard = ({ userTask, onOpenDetails }: { userTask: GroupedTask, onOpenDetails: (userTask: GroupedTask) => void }) => {
    return (
        <Card key={userTask.user.id} className="bg-card hover:shadow-md transition-shadow">
            <CardHeader className="p-3 flex-row items-start justify-between">
                <div className="flex items-center gap-2">
                    {roleIcons[userTask.user.role as 'developer' | 'qa']}
                    <span className="text-sm font-medium">{userTask.user.name}</span>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenDetails(userTask)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-1 mb-2">
                    {userTask.projects.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                </div>
            </CardContent>
             <CardFooter className="p-3 flex items-center justify-between text-sm text-muted-foreground">
               <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(userTask.nearestDueDate.toDate(), 'MMM dd')}</span>
               </div>
               <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={userTask.user.avatar} />
                        <AvatarFallback>{userTask.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpenDetails(userTask)}>
                       <Eye className="h-4 w-4" />
                    </Button>
               </div>
             </CardFooter>
        </Card>
    );
};


export function TasksKanbanView({ searchQuery, userRole, managerName }: TasksKanbanViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingUserTasks, setViewingUserTasks] = useState<GroupedTask | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
        let unsubscribe = () => {};
    
        const setupTaskListener = (taskQuery: any) => {
            return onSnapshot(taskQuery, (snapshot) => {
                const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setTasks(fetchedTasks);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching tasks: ", err);
                setLoading(false)
            });
        };

        if (userRole === 'admin') {
            const tasksQuery = query(collection(db, "tasks"));
            unsubscribe = setupTaskListener(tasksQuery);
        } else if (userRole === 'manager' && managerName) {
            const projectsQuery = query(collection(db, "projects"), where("projectManager", "==", managerName));
            const unsubscribeProjects = onSnapshot(projectsQuery, (projectSnapshot) => {
                const managerProjectIds = projectSnapshot.docs.map(doc => doc.id);
                
                if (managerProjectIds.length > 0) {
                    const tasksQuery = query(collection(db, "tasks"), where('project', 'in', managerProjectIds));
                    unsubscribe = setupTaskListener(tasksQuery);
                } else {
                    setTasks([]);
                    setLoading(false);
                }
            }, (err) => {
                 console.error("Error fetching manager projects: ", err);
                 setLoading(false);
            });
    
            return () => {
                unsubscribeProjects();
                unsubscribe();
            };
        } else {
            setTasks([]);
            setLoading(false);
        }
    
        return () => unsubscribe();
    }, [userRole, managerName]);
    

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
    
    const handleViewUserTasks = (userTasks: GroupedTask) => {
        setViewingUserTasks(userTasks);
        setIsViewDialogOpen(true);
    };

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

        const projectMap = new Map(projects.map(p => [p.id, p.projectName]));

        return Object.entries(groupedByStatus).map(([status, userTasks]) => {
            const processedUserTasks: GroupedTask[] = Object.entries(userTasks).map(([userName, tasks]) => {
                const user = users.find(u => u.name === userName);
                if (!user) return null;

                const uniqueProjectIds = [...new Set(tasks.map(t => t.project))];
                const projectNames = uniqueProjectIds.map(id => projectMap.get(id) || 'Unknown Project');
                
                const nearestDueDate = tasks.reduce((nearest, current) => {
                    return current.dueDate.toMillis() < nearest.dueDate.toMillis() ? current : nearest;
                }).dueDate;

                const highestPriority = tasks.reduce((highest, current) => {
                    return priorityOrder.indexOf(current.priority) < priorityOrder.indexOf(highest.priority) ? current : highest;
                }).priority;


                return {
                    user,
                    tasks,
                    projects: projectNames,
                    nearestDueDate,
                    highestPriority,
                };
            }).filter(Boolean) as GroupedTask[];
            
            return {
                id: status.toLowerCase().replace(' ', ''),
                title: status,
                userTasks: processedUserTasks
            };
        });

    }, [filteredTasks, projects, users]);


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
                            <Card className="bg-muted/50 border-none">
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-medium">{column.title}</CardTitle>
                                        <Badge variant="secondary">{column.userTasks.reduce((acc, ut) => acc + ut.tasks.length, 0)}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 min-h-[100px] space-y-3">
                                   {column.userTasks.map((userTask) => (
                                        <UserTasksCard key={userTask.user.id} userTask={userTask} onOpenDetails={handleViewUserTasks} />
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
                />
            )}
        </div>
    );
}
