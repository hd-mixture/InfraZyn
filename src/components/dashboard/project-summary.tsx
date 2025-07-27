'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import { EditProjectForm } from "./edit-project-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export type Project = {
    id: string;
    projectName: string;
    projectManager: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: string;
    description?: string;
    progress?: number;
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Completed": "outline",
    "In Progress": "secondary",
    "On Hold": "default",
    "Delayed": "destructive",
    "At risk": "default",
    "Not Started": "secondary",
}

const statusColor: { [key: string]: string } = {
    "Completed": "text-green-500 border-green-500/50 bg-green-500/10",
    "In Progress": "text-blue-500 border-blue-500/50 bg-blue-500/10",
    "On Hold": "text-gray-500 border-gray-500/50 bg-gray-500/10",
    "Delayed": "text-red-500 border-red-500/50 bg-red-500/10",
    "At risk": "text-yellow-500 border-yellow-500/50 bg-yellow-500/10",
    "Not Started": "text-gray-500 border-gray-500/50 bg-gray-500/10"
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
            progress: data.progress || 0
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Project manager</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading projects...</TableCell>
                </TableRow>
            ) : filteredProjects.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No projects match the current filters.</TableCell>
                </TableRow>
            ) : (
                filteredProjects.map((project) => (
                <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell>{project.projectManager}</TableCell>
                    <TableCell>{project.endDate ? format(project.endDate.toDate(), 'PP') : 'N/A'}</TableCell>
                    <TableCell>
                    <Badge variant={statusVariant[project.status] || 'default'} className={statusColor[project.status] || ''}>
                        {project.status}
                    </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full">
                                <div className={`h-full rounded-full ${progressColor[project.status]}`} style={{ width: `${project.progress || 0}%` }}></div>
                            </div>
                            <span className="text-xs text-muted-foreground">{project.progress || 0}%</span>
                        </div>
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
                                <DropdownMenuItem onClick={() => openDeleteDialog(project.id)} className="text-destructive">
                                     <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
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
