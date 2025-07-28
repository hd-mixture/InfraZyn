
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Star } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp, where, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useToast } from "@/hooks/use-toast";


export type Project = {
    id: string;
    projectName: string;
    projectManager: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: string;
    priority: 'Low' | 'Medium' | 'High';
    description?: string;
    progress?: number;
    logoUrl?: string;
    createdAt: Timestamp;
    pinned?: boolean;
}

const statusColor: { [key: string]: string } = {
    "Completed": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "On Hold": "border-gray-500 text-gray-500",
    "Delayed": "border-red-500 text-red-500",
    "At risk": "border-yellow-500 text-yellow-500",
    "Not Started": "border-gray-400 text-gray-400"
}

const progressColor: { [key: string]: string } = {
    "Completed": "bg-green-500",
    "In Progress": "bg-blue-500",
    "Delayed": "bg-red-500",
    "At risk": "bg-yellow-500",
    "On Hold": "bg-gray-500",
    "Not Started": "bg-gray-200"
}

type ManagerProjectViewProps = {
  searchQuery: string;
  managerName: string | null;
};

export function ManagerProjectView({ searchQuery, managerName }: ManagerProjectViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!managerName) {
        setLoading(false);
        return;
    };

    const q = query(collection(db, "projects"), where("projectManager", "==", managerName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
            id: doc.id,
            ...data
        } as Project);
      });
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching projects: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
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


  const filteredProjects = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return projects
    .filter(project => project.projectName.toLowerCase().includes(lowercasedQuery))
    .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  }, [projects, searchQuery]);


  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle>Assigned Projects</CardTitle>
                <CardDescription className="text-xs">Projects you are currently managing.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow">
            <div className="pr-4 pb-4">
            {loading ? (
            <div className="text-center">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">You have not been assigned to any projects yet.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                <Card key={project.id} className="flex flex-col shadow-none border hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={project.logoUrl || 'https://placehold.co/48x48.png'} data-ai-hint="logo company" alt={project.projectName} />
                                    <AvatarFallback>{project.projectName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{project.projectName}</CardTitle>
                                    <CardDescription className="text-xs">{project.projectManager}</CardDescription>
                                </div>
                            </div>
                             <div className="flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handlePinProject(project.id, !project.pinned)}>
                                                <Star className={`h-4 w-4 ${project.pinned ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{project.pinned ? 'Unpin' : 'Pin'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button variant="ghost" asChild size="icon" className="h-8 w-8">
                                    <Link href={`/manager-dashboard?view=tasks&projectId=${project.id}`}>
                                    <Eye className="h-4 w-4" />
                                    </Link>
                                </Button>
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                         <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                            {project.description || 'No description provided.'}
                        </p>
                        <Badge variant="outline" className={statusColor[project.status] || ''}>
                            {project.status}
                        </Badge>
                        
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold">Progress</span>
                                <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                            </div>
                            <Progress 
                                value={project.progress || 0}
                                indicatorClassName={progressColor[project.status]}
                                className={cn(project.status === 'In Progress' && 'animated-progress')}
                            />
                        </div>
                       
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                        <div>
                            Due: {project.endDate ? format(project.endDate.toDate(), 'dd MMM yyyy') : 'N/A'}
                        </div>
                    </CardFooter>
                </Card>
                ))}
            </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
