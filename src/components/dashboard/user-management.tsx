
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, Timestamp, orderBy, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { format } from 'date-fns';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { EditUserForm } from './edit-user-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { deleteUser } from '@/ai/flows/delete-user-flow';


const userSchema = z.object({
  name: z.string().min(1, 'User name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.enum(['manager', 'developer', 'qa']),
});

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'developer' | 'qa';
    createdAt: Timestamp;
    status: 'Active' | 'Inactive';
    avatar?: string;
    addedBy?: string;
};

type Project = {
    id: string;
    projectName: string;
    projectManager: string;
}

type Task = {
    id: string;
    project: string;
    assignedTo: string;
}

const roleVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "manager": "default",
    "developer": "secondary",
    "qa": "outline"
}

type CreateUserFormProps = {
    userRole: 'admin' | 'manager';
    managerName?: string | null;
}

function CreateUserForm({ userRole, managerName }: CreateUserFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'developer',
        },
    });

    async function onSubmit(values: z.infer<typeof userSchema>) {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, 'DTXH2025');
            const user = userCredential.user;

            const userData: any = {
                name: values.name,
                email: values.email,
                role: values.role,
                createdAt: Timestamp.now(),
                status: 'Active'
            };

            if (userRole === 'manager' && managerName) {
                userData.addedBy = managerName;
            }

            await setDoc(doc(db, "users", user.uid), userData);

            toast({
                title: "User Created!",
                description: "The new user has been added successfully.",
            });
            setOpen(false);
            form.reset();
        } catch (e: any) {
            console.error("Error adding user: ", e);
            let description = "There was a problem creating the user.";
            if (e.code === 'auth/email-already-in-use') {
                description = "This email address is already in use by another account."
            }
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: description,
            });
        } finally {
            setLoading(false);
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            form.reset();
        }
        setOpen(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
            <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
                Fill in the details to add a new user to the system. The user will be created in Authentication with the default password "DTXH2025".
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {userRole === 'admin' && <SelectItem value="manager">Manager</SelectItem>}
                                <SelectItem value="developer">Developer</SelectItem>
                                <SelectItem value="qa">QA</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
    );
}

type UserManagementProps = {
    userRole?: 'admin' | 'manager';
    managerName?: string | null;
}

export function UserManagement({ userRole = 'admin', managerName }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setLoading(true);
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const projectsQuery = query(collection(db, "projects"));
        const tasksQuery = query(collection(db, "tasks"));

        const unSubUsers = onSnapshot(usersQuery, (snap) => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}) as User)));
        const unSubProjects = onSnapshot(projectsQuery, (snap) => setProjects(snap.docs.map(d => ({id: d.id, ...d.data()}) as Project)));
        const unSubTasks = onSnapshot(tasksQuery, (snap) => {
            setTasks(snap.docs.map(d => ({id: d.id, ...d.data()}) as Task));
            setLoading(false);
        });
        
        return () => {
            unSubUsers();
            unSubProjects();
            unSubTasks();
        };
    }, []);

    const managerTeams = useMemo(() => {
        const teams: Record<string, User[]> = {};
        const allManagers = users.filter(u => u.role === 'manager');
        const userMap = new Map(users.map(u => [u.name, u]));

        allManagers.forEach(manager => {
            const managerProjects = projects.filter(p => p.projectManager === manager.name);
            const managerProjectIds = managerProjects.map(p => p.id);
            const managerTasks = tasks.filter(t => managerProjectIds.includes(t.project));
            
            const teamMemberNames = new Set(managerTasks.map(t => t.assignedTo));
            const teamMembers: User[] = [];
            teamMemberNames.forEach(name => {
                const user = userMap.get(name);
                if (user) {
                    teamMembers.push(user);
                }
            });
            teams[manager.name] = teamMembers;
        });

        return teams;
    }, [users, projects, tasks]);

    const filteredUsers = useMemo(() => {
        if (userRole === 'manager' && managerName) {
            const teamMemberSet = new Set<User>();
            
            // Add users assigned to manager's projects
            const teamMembersFromProjects = managerTeams[managerName] || [];
            teamMembersFromProjects.forEach(member => teamMemberSet.add(member));

            // Add users created by this manager
            const usersAddedByManager = users.filter(user => user.addedBy === managerName);
            usersAddedByManager.forEach(member => teamMemberSet.add(member));

            return Array.from(teamMemberSet);
        }
        return users; // For admin
    }, [userRole, managerName, users, managerTeams]);
    

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setDeletingUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        try {
            // First, delete from Firebase Authentication via the Genkit flow
            await deleteUser({ uid: deletingUser.id });

            // Then, delete from Firestore
            await deleteDoc(doc(db, "users", deletingUser.id));

            toast({
                title: "User Deleted!",
                description: `User ${deletingUser.name} has been deleted.`,
            });
        } catch (e: any) {
            console.error("Error deleting user: ", e);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: e.message || "There was a problem deleting the user.",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingUser(null);
        }
    };
    
    return (
        <>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{userRole === 'admin' ? 'User Management' : 'Team Members'}</CardTitle>
                        <CardDescription>
                            {userRole === 'admin' ? 'Add, edit, and manage all users.' : 'Your assigned developers and QAs across all projects.'}
                        </CardDescription>
                    </div>
                     { (userRole === 'admin' || userRole === 'manager') && <CreateUserForm userRole={userRole} managerName={managerName} /> }
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Loading users...</TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No users found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="person face" />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    <span>{user.name}</span>
                                                    {userRole === 'admin' && user.addedBy && (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            (Added by {user.addedBy})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                             {user.role === 'manager' && userRole === 'admin' && (
                                                <div className="flex -space-x-3 items-center pl-2">
                                                    {(managerTeams[user.name] || []).slice(0, 3).map(member => (
                                                        <TooltipProvider key={member.id}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Avatar className="h-6 w-6 border-2 border-background">
                                                                        <AvatarImage src={member.avatar} data-ai-hint="person face" />
                                                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{member.name} ({member.role})</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                    {(managerTeams[user.name]?.length || 0) > 3 && (
                                                        <Avatar className="h-6 w-6 border-2 border-background">
                                                            <AvatarFallback className="text-xs">
                                                                +{(managerTeams[user.name]?.length || 0) - 3}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={roleVariant[user.role]}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'} className={user.status === 'Active' ? "text-green-600" : ""}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.createdAt ? format(user.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}
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
                                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                 {user.role !== 'manager' && (
                                                    <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                 )}
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

            {editingUser && (
                <EditUserForm 
                    user={editingUser}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    userRole={userRole}
                />
            )}
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                       This action cannot be undone. This will permanently delete the user from Authentication and the Firestore database.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingUser(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                        Delete User
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
