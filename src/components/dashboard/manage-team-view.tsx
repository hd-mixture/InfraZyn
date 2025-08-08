
'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Project } from './project-summary';
import type { Task } from './tasks-kanban-view';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';


type User = {
    id: string;
    name: string;
    role: 'developer' | 'qa' | 'designer';
    avatar?: string;
};

type ManageTeamViewProps = {
    managerName: string | null;
};

export function ManageTeamView({ managerName }: ManageTeamViewProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!managerName) {
            setLoading(false);
            return;
        }
        
        const projectsQuery = query(
            collection(db, "projects"),
            where("projectManager", "==", managerName)
        );
        const usersQuery = query(collection(db, "users"), where("role", "in", ["developer", "qa", "designer"]));
        
        const unsubscribeUsers = onSnapshot(usersQuery, (userSnapshot) => {
            const fetchedUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(fetchedUsers);
        });

        const unsubscribeProjects = onSnapshot(projectsQuery, (projectSnapshot) => {
            const fetchedProjects = projectSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt as Timestamp,
                endDate: doc.data().endDate as Timestamp,
                startDate: doc.data().startDate as Timestamp,
            } as Project));
            setProjects(fetchedProjects);

             if (fetchedProjects.length > 0) {
                const projectIds = fetchedProjects.map(p => p.id);
                const tasksQuery = query(collection(db, "tasks"), where("project", "in", projectIds));
                
                const unsubscribeTasks = onSnapshot(tasksQuery, (taskSnapshot) => {
                    const fetchedTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                    setTasks(fetchedTasks);
                    setLoading(false);
                }, (err) => {
                    console.error("Error fetching tasks: ", err);
                    setLoading(false);
                });

                return () => unsubscribeTasks();
            } else {
                 setTasks([]);
                 setLoading(false);
            }
        }, (err) => {
             console.error("Error fetching projects: ", err);
             setLoading(false);
        });


        return () => {
            unsubscribeProjects();
            unsubscribeUsers();
        };
    }, [managerName]);
    
    const handlePinProject = async (projectId: string, pinned: boolean) => {
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { pinned });
        } catch(e) {
            console.error("Error pinning project: ", e);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem pinning the project.",
            });
        }
    };


    const sortedProjects = useMemo(() => {
         return [...projects].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
    }, [projects]);


    const projectTeams = useMemo(() => {
        const teams: { [projectId: string]: User[] } = {};
        
        projects.forEach(project => {
            const projectTasks = tasks.filter(task => task.project === project.id);
            const userNames = [...new Set(projectTasks.map(task => task.assignedTo))];
            const teamMembers = users.filter(user => userNames.includes(user.name));
            teams[project.id] = teamMembers;
        });

        return teams;
    }, [projects, tasks, users]);

    if (loading) {
        return <div className="text-center py-10">Loading team data...</div>;
    }

    return (
        <div className="h-full">
            {sortedProjects.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Projects Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">You are not assigned to any projects yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProjects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle>{project.projectName}</CardTitle>
                                        <CardDescription>Manage the team members for this project.</CardDescription>
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={() => handlePinProject(project.id, !project.pinned)}>
                                                    <Star className={`h-4 w-4 ${project.pinned ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{project.pinned ? 'Unpin project' : 'Pin project'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex flex-wrap gap-4">
                                    {projectTeams[project.id]?.map(user => (
                                        <div key={user.id} className="flex flex-col items-center gap-2 text-center w-20">
                                            <Avatar className="w-12 h-12">
                                                <AvatarImage src={user.avatar || `https://placehold.co/48x48.png?text=${user.name.charAt(0)}`} data-ai-hint="person face" />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm font-medium leading-tight truncate w-full">{user.name}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                                        </div>
                                    ))}
                                    {(!projectTeams[project.id] || projectTeams[project.id].length === 0) && (
                                        <p className="text-sm text-muted-foreground py-4">No team members assigned to tasks in this project yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
