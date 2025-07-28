
'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Project } from './project-summary';
import type { Task } from './tasks-kanban-view';

type User = {
    id: string;
    name: string;
    role: 'developer' | 'qa';
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

    useEffect(() => {
        if (!managerName) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const projectsQuery = query(
            collection(db, "projects"), 
            where("projectManager", "==", managerName),
            orderBy("createdAt", "desc")
        );
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                createdAt: doc.data().createdAt as Timestamp 
            } as Project));
            setProjects(fetchedProjects);

            if (fetchedProjects.length > 0) {
                const projectIds = fetchedProjects.map(p => p.id);
                const tasksQuery = query(collection(db, "tasks"), where("project", "in", projectIds));
                const unsubscribeTasks = onSnapshot(tasksQuery, (taskSnapshot) => {
                    const fetchedTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                    setTasks(fetchedTasks);
                    setLoading(false);
                }, () => setLoading(false));
                return () => unsubscribeTasks();
            } else {
                setLoading(false);
            }
        }, () => setLoading(false));

        const usersQuery = query(collection(db, "users"), where("role", "in", ["developer", "qa"]));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(fetchedUsers);
        });

        return () => {
            unsubscribeProjects();
            unsubscribeUsers();
        };
    }, [managerName]);

    const projectTeams = useMemo(() => {
        const teams: { [projectId: string]: User[] } = {};
        
        projects.forEach(project => {
            const projectTasks = tasks.filter(task => task.project === project.id);
            const userIds = [...new Set(projectTasks.map(task => task.assignedTo))];
            const teamMembers = users.filter(user => userIds.includes(user.id));
            teams[project.id] = teamMembers;
        });

        return teams;
    }, [projects, tasks, users]);

    if (loading) {
        return <div className="text-center py-10">Loading team data...</div>;
    }

    return (
        <div className="space-y-6">
            {projects.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Projects Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">You are not assigned to any projects yet.</p>
                    </CardContent>
                </Card>
            ) : (
                projects.map((project) => (
                    <Card key={project.id}>
                        <CardHeader>
                            <CardTitle>{project.projectName}</CardTitle>
                            <CardDescription>Manage the team members for this project.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-6">
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
                ))
            )}
        </div>
    );
}
