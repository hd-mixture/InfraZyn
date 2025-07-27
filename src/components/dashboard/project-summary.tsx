'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, Star, Folders } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import { EditProjectForm } from "./edit-project-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
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
    description?: string;
    progress?: number;
    logoUrl?: string;
}

const statusColor: { [key: string]: string } = {
    "Completed": "text-green-500 border-green-500",
    "In Progress": "text-blue-500 border-blue-500",
    "On Hold": "text-gray-500 border-gray-500",
    "Delayed": "text-red-500 border-red-500",
    "At risk": "text-yellow-500 border-yellow-500",
    "Not Started": "text-gray-500 border-gray-500"
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

function ProjectCard({ project, onEdit, onDelete }: { project: Project, onEdit: (project: Project) => void, onDelete: (id: string) => void }) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={project.logoUrl || 'https://placehold.co/48x48.png'} data-ai-hint="logo company" alt={project.projectName} />
                        <AvatarFallback>
                            {project.projectName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{project.projectName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{project.projectManager}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Star className="w-4 h-4" />
                    </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(project)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive">
                                 <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <Badge variant="outline" className={statusColor[project.status] || ''}>
                            {project.status}
                         </Badge>
                         <Badge variant="destructive" className="border-red-500 text-red-500">HIGH PRIORITY</Badge>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className={progressColor[project.status]} />
                    </div>
                     <div className="flex items-center -space-x-2">
                        <Avatar className="w-8 h-8 border-2 border-card">
                            <AvatarImage src="https://placehold.co/32x32.png" data-ai-hint="person face" />
                            <AvatarFallback>U1</AvatarFallback>
                        </Avatar>
                         <Avatar className="w-8 h-8 border-2 border-card">
                            <AvatarImage src="https://placehold.co/32x32.png" data-ai-hint="person face" />
                            <AvatarFallback>U2</AvatarFallback>
                        </Avatar>
                         <Avatar className="w-8 h-8 border-2 border-card">
                            <AvatarImage src="https://placehold.co/32x32.png" data-ai-hint="person face" />
                            <AvatarFallback>U3</AvatarFallback>
                        </Avatar>
                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium border-2 border-card">+5</div>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Due Date: <span className="font-medium text-foreground">{project.endDate ? format(project.endDate.toDate(), 'dd MMM yyyy') : 'N/A'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProjectSummary() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [filterProject, setFilterProject] = useState(ALL_FILTER);
  const [filterManager, setFilterManager] = useState(ALL_FILTER);
  const [filterStatus, setFilterStatus] = useState(ALL_FILTER);

  useEffect(() => {
    const q = query(collection(db, "projects"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
            id: doc.id,
            projectName: data.projectName,
            projectManager: data.projectManager,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
            description: data.description,
            progress: data.progress || 0,
            logoUrl: data.logoUrl,
        });
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
    if(!deletingProjectId) return;
    try {
        await deleteDoc(doc(db, "projects", deletingProjectId));
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
        setDeletingProjectId(null);
    }
  }

  const openDeleteDialog = (projectId: string) => {
    setDeletingProjectId(projectId);
    setIsDeleteDialogOpen(true);
  }

  const managers = useMemo(() => Array.from(new Set(projects.map(p => p.projectManager))), [projects]);
  const statuses = useMemo(() => Array.from(new Set(projects.map(p => p.status))), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const projectMatch = filterProject === ALL_FILTER || project.projectName === filterProject;
      const managerMatch = filterManager === ALL_FILTER || project.projectManager === filterManager;
      const statusMatch = filterStatus === ALL_FILTER || project.status === filterStatus;
      return projectMatch && managerMatch && statusMatch;
    });
  }, [projects, filterProject, filterManager, filterStatus]);


  return (
    <>
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Project summary</CardTitle>
        </div>
        <div className="flex gap-2">
            <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_FILTER}>All Projects</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.projectName}>{p.projectName}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterManager} onValueChange={setFilterManager}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Project manager" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_FILTER}>All Managers</SelectItem>
                     {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_FILTER}>All Statuses</SelectItem>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="text-center py-10">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4">
                <Folders className="w-16 h-16" />
                <p>No projects match the current filters.</p>
                <p className="text-sm">Try adjusting your filters or create a new project.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} onEdit={handleEdit} onDelete={openDeleteDialog} />
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
            <AlertDialogCancel onClick={() => setDeletingProjectId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
