
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Mail, Phone, Calendar, Briefcase, ListChecks, Users, Link as LinkIcon } from 'lucide-react';
import type { Project } from './project-summary';
import type { Task } from './tasks-kanban-view';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

type ManagerProfileViewProps = {
    managerName: string | null;
};

export function ManagerProfileView({ managerName }: ManagerProfileViewProps) {
    const [managerEmail, setManagerEmail] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [team, setTeam] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (managerName) {
            setManagerEmail(`${managerName.toLowerCase().replace(' ', '.')}@devtexhhub.com`);
        }
    }, [managerName]);

    useEffect(() => {
        if (!managerName) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const projectsQuery = query(collection(db, "projects"), where("projectManager", "==", managerName));
        const unsubscribeProjects = onSnapshot(projectsQuery, (projectSnapshot) => {
            const fetchedProjects = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(fetchedProjects);

            if (fetchedProjects.length > 0) {
                const projectIds = fetchedProjects.map(p => p.id);
                const tasksQuery = query(collection(db, "tasks"), where("project", "in", projectIds));
                const unsubscribeTasks = onSnapshot(tasksQuery, (taskSnapshot) => {
                    const fetchedTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                    setTasks(fetchedTasks);
                    
                    const teamMembers = new Set(fetchedTasks.map(task => task.assignedTo));
                    setTeam(Array.from(teamMembers));
                    
                    setLoading(false);
                });
                return () => unsubscribeTasks();
            } else {
                setTasks([]);
                setTeam([]);
                setLoading(false);
            }
        });

        return () => unsubscribeProjects();
    }, [managerName]);


    const statusColor: { [key: string]: string } = {
        "Completed": "border-green-500 text-green-500",
        "In Progress": "border-blue-500 text-blue-500",
        "On Hold": "border-gray-500 text-gray-500",
        "Delayed": "border-red-500 text-red-500",
        "At risk": "border-yellow-500 text-yellow-500",
        "Not Started": "border-gray-400 text-gray-400"
    }

    if (loading) {
        return <div>Loading profile...</div>;
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-6 pb-6 pr-4">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-4 border-background">
                                <AvatarImage src={`https://placehold.co/96x96.png?text=${managerName?.charAt(0)}`} data-ai-hint="person face" />
                                <AvatarFallback>{managerName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button size="icon" className="absolute bottom-1 right-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-3xl">{managerName}</CardTitle>
                            <CardDescription className="text-lg">Project Manager</CardDescription>
                            <p className="text-muted-foreground mt-2">
                                Dedicated and experienced Project Manager with a passion for building great products and leading effective teams.
                            </p>
                        </div>
                        <Button variant="outline">Edit Profile</Button>
                    </CardHeader>
                    <CardContent className="border-t pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <span>{managerEmail}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-muted-foreground" />
                                <span>+91 98765 43210</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <span>Joined on: Jan 15, 2020</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projects Handled</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{projects.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tasks Assigned</CardTitle>
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tasks.length}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{team.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Projects</CardTitle>
                        <CardDescription>Click on a project to view its tasks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {projects.length === 0 ? (
                            <p className="text-muted-foreground">No projects assigned yet.</p>
                         ) : (
                            <div className="space-y-4">
                                {projects.map(project => (
                                    <Link key={project.id} href={`/manager-dashboard?view=tasks&projectId=${project.id}`} className="block">
                                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                           <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={project.logoUrl || 'https://placehold.co/40x40.png'} data-ai-hint="logo company" alt={project.projectName} />
                                                    <AvatarFallback>{project.projectName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{project.projectName}</p>
                                                    <p className="text-sm text-muted-foreground">{project.status}</p>
                                                </div>
                                           </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className={statusColor[project.status] || ''}>{project.status}</Badge>
                                                <LinkIcon className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
}
