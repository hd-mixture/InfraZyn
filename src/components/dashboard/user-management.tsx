
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, Timestamp, orderBy } from 'firebase/firestore';
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

const userSchema = z.object({
  name: z.string().min(1, 'User name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.enum(['manager', 'developer', 'qa']),
});

type User = {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'developer' | 'qa';
    createdAt: Timestamp;
    status: 'Active' | 'Inactive';
};

const roleVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "manager": "default",
    "developer": "secondary",
    "qa": "outline"
}

function CreateUserForm() {
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
            await addDoc(collection(db, "users"), {
                ...values,
                createdAt: Timestamp.now(),
                status: 'Active'
            });
            toast({
                title: "User Created!",
                description: "The new user has been added successfully.",
            });
            setOpen(false);
            form.reset();
        } catch (e) {
            console.error("Error adding user: ", e);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem creating the user.",
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
                Fill in the details to add a new user to the system. The default password is "DTXH2025".
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
                                <SelectItem value="developer">Developer</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
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


export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData: User[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() } as User);
            });
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Add, edit, and manage users in your organization.</CardDescription>
                </div>
                <CreateUserForm />
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
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No users found. Add one to get started!</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="person face" />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
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
                                            <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
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
    )
}
