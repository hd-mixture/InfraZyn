
'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project } from './project-summary';
import { UserPlus } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!managerName) {
            setLoading(false);
            return;
        }

        const projectsQuery = query(collection(db, "projects"), where("projectManager", "==", managerName));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(fetchedProjects);
            setLoading(false);
        });
        
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
        // This is a placeholder. In a real app, you'd fetch team members per project.
        // For now, we can mock it or derive it from tasks if possible.
        projects.forEach(p => {
            teams[p.id] = users.slice(0, Math.floor(Math.random() * 3) + 1);
        });
        return teams;
    }, [projects, users]);

    if (loading) {
        return <div className="text-center">Loading...</div>;
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{project.projectName}</CardTitle>
                                <CardDescription>Manage the team members for this project.</CardDescription>
                            </div>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Members
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {projectTeams[project.id]?.map(user => (
                                    <div key={user.id} className="flex flex-col items-center gap-2">
                                        <Avatar>
                                            <AvatarImage src={user.avatar || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="person face" />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.role}</span>
                                    </div>
                                ))}
                                {(!projectTeams[project.id] || projectTeams[project.id].length === 0) && (
                                     <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
