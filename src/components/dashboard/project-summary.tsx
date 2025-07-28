
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
import { MoreHorizontal, Trash2, Edit, Folders } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp, doc, deleteDoc, updateDoc, orderBy, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { EditProjectForm } from "./edit-project-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";


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

export function ProjectSummary({ searchQuery }: { searchQuery: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  const [filterProject, setFilterProject] = useState(ALL_FILTER);
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
  const projectNames = useMemo(() => projects.map(p => ({id: p.id, name: p.projectName})), [projects]);

  const filteredProjects = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return projects
    .filter(project => {
      const searchMatch = searchQuery ? 
            project.projectName.toLowerCase().includes(lowercasedQuery) || 
            project.projectManager.toLowerCase().includes(lowercasedQuery) 
            : true;
      const projectMatch = filterProject === ALL_FILTER || project.projectName === filterProject;
      const managerMatch = filterManager === ALL_FILTER || project.projectManager === filterManager;
      const statusMatch = filterStatus === ALL_FILTER || project.status === filterStatus;
      return searchMatch && projectMatch && managerMatch && statusMatch;
    })
    .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  }, [projects, filterProject, filterManager, filterStatus, searchQuery]);


  return (
    <>
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>View, manage, and search your projects.</CardDescription>
        </div>
        <div className="flex gap-2">
            <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_FILTER}>All Projects</SelectItem>
                    {projectNames.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
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
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4 h-[30rem] justify-center">
                    <Folders className="w-16 h-16" />
                    <p className="font-semibold text-lg">No projects found</p>
                    <p className="text-sm">Try adjusting your filters or create a new project to get started.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredProjects.map((project) => (
                           <TableRow key={project.id} className="hover:bg-muted/50">
                               <TableCell>
                                   <div className="flex items-center gap-3">
                                       <Avatar>
                                            <AvatarImage src={project.logoUrl || 'https://placehold.co/40x40.png'} data-ai-hint="logo company" alt={project.projectName} />
                                            <AvatarFallback>{project.projectName.charAt(0)}</AvatarFallback>
                                       </Avatar>
                                       <div>
                                           <div className="font-medium">{project.projectName}</div>
                                           <div className="text-sm text-muted-foreground">{project.projectManager}</div>
                                       </div>
                                   </div>
                               </TableCell>
                               <TableCell>
                                 <Badge variant="outline" className={statusColor[project.status] || ''}>
                                    {project.status}
                                 </Badge>
                               </TableCell>
                               <TableCell>
                                   <div className="flex items-center gap-2">
                                       <Progress value={project.progress || 0} indicatorClassName={progressColor[project.status]} className="w-24" />
                                       <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                                   </div>
                               </TableCell>
                               <TableCell>
                                   {project.endDate ? format(project.endDate.toDate(), 'dd MMM yyyy') : 'N/A'}
                               </TableCell>
                               <TableCell className="text-right">
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
                                            <DropdownMenuItem onClick={() => openDeleteDialog(project)} className="text-destructive">
                                                 <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                               </TableCell>
                           </TableRow>
                       ))}
                    </TableBody>
                </Table>
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
