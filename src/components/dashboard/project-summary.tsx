
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, Pin, PinOff } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp, doc, deleteDoc, updateDoc, orderBy, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { EditProjectForm } from "./edit-project-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";

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
    revenue?: number;
    logoUrl?: string;
    pinned?: boolean;
    createdAt: Timestamp;
}

const statusColor: { [key: string]: string } = {
    "Completed": "border-green-500 text-green-500",
    "In Progress": "border-blue-500 text-blue-500",
    "On Hold": "border-gray-500 text-gray-500",
    "Delayed": "border-red-500 text-red-500",
    "At risk": "border-yellow-500 text-yellow-500",
    "Not Started": "border-gray-400 text-gray-400"
}

const priorityColor: { [key: string]: { badge: string; progress: string } } = {
    'High': {
        badge: "border-red-200 bg-red-50 text-red-600",
        progress: "bg-red-500"
    },
    'Medium': {
        badge: "border-yellow-200 bg-yellow-50 text-yellow-600",
        progress: "bg-yellow-500"
    },
    'Low': {
        badge: "border-green-200 bg-green-50 text-green-600",
        progress: "bg-green-500"
    }
}

const progressColor: { [key: string]: string } = {
    "Completed": "bg-green-500",
    "In Progress": "bg-blue-500",
    "Delayed": "bg-red-500",
    "At risk": "bg-yellow-500",
    "On Hold": "bg-gray-500",
    "Not Started": "bg-gray-200"
}


const ALL_FILTER = 'all';

export function ProjectSummary({ searchQuery }: { searchQuery: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  const [filterManager, setFilterManager] = useState(ALL_FILTER);
  const [filterStatus, setFilterStatus] = useState(ALL_FILTER);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
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
  }, []);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if(!deletingProject) return;
    try {
        await addDoc(collection(db, "activities"), {
            type: 'delete_project',
            description: `Project "${deletingProject.projectName}" was deleted.`,
            timestamp: Timestamp.now()
        });
        await deleteDoc(doc(db, "projects", deletingProject.id));
        toast({
            title: "Project Deleted!",
            description: "The project has been successfully deleted.",
        });
    } catch(e) {
        console.error("Error deleting document: ", e);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem deleting the project.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setDeletingProject(null);
    }
  }

  const openDeleteDialog = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  }

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

  const managers = useMemo(() => Array.from(new Set(projects.map(p => p.projectManager))), [projects]);
  const statuses = useMemo(() => Array.from(new Set(projects.map(p => p.status))), [projects]);

  const filteredProjects = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return projects
    .filter(project => {
      const searchMatch = searchQuery ? 
            project.projectName.toLowerCase().includes(lowercasedQuery) || 
            project.projectManager.toLowerCase().includes(lowercasedQuery) 
            : true;
      const managerMatch = filterManager === ALL_FILTER || project.projectManager === filterManager;
      const statusMatch = filterStatus === ALL_FILTER || project.status === filterStatus;
      return searchMatch && managerMatch && statusMatch;
    })
    .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  }, [projects, filterManager, filterStatus, searchQuery]);


  return (
    <>
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Project Summary</CardTitle>
                <CardDescription>An overview of your current projects.</CardDescription>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
                <Select value={filterManager} onValueChange={setFilterManager}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Managers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTER}>All Managers</SelectItem>
                         {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTER}>All Statuses</SelectItem>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {loading ? (
          <div className="text-center">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No projects found.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handlePinProject(project.id, !project.pinned)}>
                                <Pin className={`h-4 w-4 ${project.pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(project)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePinProject(project.id, !project.pinned)}>
                                        {project.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                        <span>{project.pinned ? 'Unpin' : 'Pin'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => openDeleteDialog(project)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                         <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="flex gap-2">
                         <Badge variant="outline" className={statusColor[project.status] || ''}>
                            {project.status}
                         </Badge>
                         <Badge variant="outline" className={priorityColor[project.priority]?.badge || ''}>
                            {project.priority} Priority
                         </Badge>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold">Progress</span>
                            <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} indicatorClassName={progressColor[project.status]} />
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
      </CardContent>
    </Card>

    {editingProject && (
        <EditProjectForm
            project={editingProject}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
    )}

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this project
                and remove its data from our servers.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProject(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
