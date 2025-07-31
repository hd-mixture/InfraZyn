
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
import { MoreHorizontal, Trash2, Edit, Folders, Users, Code, ShieldCheck } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp, doc, deleteDoc, updateDoc, orderBy, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";


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

type User = {
    id: string;
    name: string;
    avatar?: string;
    role: 'developer' | 'qa' | 'manager';
};

type Task = {
    id: string;
    project: string;
    assignedTo: string;
};


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

type ProjectTableViewProps = {
  searchQuery: string;
  onEditProject: (project: Project) => void;
};

export function ProjectTableView({ searchQuery, onEditProject }: ProjectTableViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
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

    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
            usersData.push({ id: doc.id, ...doc.data() as Omit<User, 'id'> });
        });
        setUsers(usersData);
    });

    const tasksQuery = query(collection(db, "tasks"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(fetchedTasks);
    });

    return () => {
        unsubscribe();
        unsubscribeUsers();
        unsubscribeTasks();
    };
  }, []);

  const projectTeamComposition = useMemo(() => {
    const composition: { [projectId: string]: { developers: number, qas: number } } = {};
    const userMap = new Map(users.map(u => [u.name, u]));

    tasks.forEach(task => {
        if (!composition[task.project]) {
            composition[task.project] = { developers: 0, qas: 0 };
        }
        const user = userMap.get(task.assignedTo);
        if (user) {
            if (user.role === 'developer') {
                composition[task.project].developers++;
            } else if (user.role === 'qa') {
                composition[task.project].qas++;
            }
        }
    });
     // To get unique counts, we need to rebuild based on unique users per project
    const uniqueComposition: { [projectId: string]: { developers: number, qas: number } } = {};
    projects.forEach(project => {
        const projectTasks = tasks.filter(t => t.project === project.id);
        const uniqueUserNames = new Set(projectTasks.map(t => t.assignedTo));
        let devCount = 0;
        let qaCount = 0;
        uniqueUserNames.forEach(name => {
            const user = userMap.get(name);
            if (user?.role === 'developer') devCount++;
            if (user?.role === 'qa') qaCount++;
        });
        uniqueComposition[project.id] = { developers: devCount, qas: qaCount };
    });


    return uniqueComposition;
  }, [tasks, users, projects]);


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

  const managers = useMemo(() => Array.from(new Set(projects.map(p => p.projectManager).filter(Boolean))), [projects]);
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
        return b.createdAt.toMillis() - b.createdAt.toMillis();
    });
  }, [projects, filterProject, filterManager, filterStatus, searchQuery]);
  
  const getManagerAvatar = (managerName: string) => {
    const manager = users.find(u => u.name === managerName);
    return manager?.avatar;
  }

  return (
    <>
    <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <Folders className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? '...' : projects.length}</div>
                </CardContent>
            </Card>
        </div>

        <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Projects</CardTitle>
                <CardDescription>View, manage, and search your projects.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTER}>All Projects</SelectItem>
                        {projectNames.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterManager} onValueChange={setFilterManager}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Project manager" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTER}>All Managers</SelectItem>
                        {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[120px]">
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
                                <TableHead className="text-center flex items-center gap-2"><Code className="h-4 w-4"/>Devs</TableHead>
                                <TableHead className="text-center flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>QAs</TableHead>
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
                                            <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={getManagerAvatar(project.projectManager)} data-ai-hint="person face" />
                                                        <AvatarFallback>{project.projectManager.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="text-sm text-muted-foreground">{project.projectManager || 'Unassigned'}</div>
                                                </div>
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
                                        <Progress
                                                value={project.progress || 0}
                                                indicatorClassName={progressColor[project.status]}
                                                className={cn("w-24", project.status === 'In Progress' && 'animated-progress')}
                                            />
                                        <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {projectTeamComposition[project.id]?.developers || 0}
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {projectTeamComposition[project.id]?.qas || 0}
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
                                                <DropdownMenuItem onClick={() => onEditProject(project)}>
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
    </div>

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
