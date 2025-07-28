
'use client'

import { PlusCircle, MoreHorizontal, Clock, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { CreateTaskForm } from './create-task-form';
import { format } from 'date-fns';

type Task = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    priority: 'High' | 'Medium' | 'Low';
    dueDate: Timestamp;
    assignedTo: string;
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
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />
};

function TaskCard({ task, assignedUser, projectName }: { task: Task, assignedUser?: User, projectName?: string }) {
    return (
        <Card className="mb-4 bg-card hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm mb-2">{task.taskName}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
        if (userRole === 'manager' && !managerName) {
            setLoading(false);
            return;
        };

        const managerProjects = projects.filter(p => p.projectManager === managerName).map(p => p.id);
        
        if (userRole === 'manager' && managerProjects.length === 0) {
            setTasks([]);
            setLoading(false);
            return;
        }

        let tasksQuery;
        if (userRole === 'manager') {
            tasksQuery = query(collection(db, "tasks"), where('project', 'in', managerProjects));
        } else {
            tasksQuery = query(collection(db, "tasks"));
        }
        
        setLoading(true);
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tasks: ", error);
            setLoading(false);
        });

        return () => unsubscribeTasks();
    }, [userRole, managerName, projects]);

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        const lowercasedQuery = searchQuery.toLowerCase();
        return tasks.filter(task => task.taskName.toLowerCase().includes(lowercasedQuery));
    }, [tasks, searchQuery]);

    const columns = useMemo(() => {
        const findUser = (userId: string) => users.find(u => u.id === userId);
        const findProject = (projectId: string) => projects.find(p => p.id === projectId);

        return [
            { id: 'todo', title: 'To Do', tasks: filteredTasks.filter(t => t.status === 'To Do') },
            { id: 'inprogress', title: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'In Progress') },
            { id: 'done', title: 'Done', tasks: filteredTasks.filter(t => t.status === 'Done') }
        ].map(column => ({
            ...column,
            tasks: column.tasks.map(task => ({
                ...task,
                assignedUser: findUser(task.assignedTo),
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
                                        <TaskCard key={task.id} task={task} assignedUser={task.assignedUser} projectName={task.projectName} />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
