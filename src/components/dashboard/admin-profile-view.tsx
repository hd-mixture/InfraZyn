
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Users, Briefcase, ListChecks, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


export function AdminProfileView() {
    const [stats, setStats] = useState({ projects: 0, users: 0, tasks: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    
    // Password fields state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const isPasswordValid = newPassword.length >= 6 && newPassword === confirmPassword && currentPassword.length > 0;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const projectsQuery = query(collection(db, "projects"));
                const usersQuery = query(collection(db, "users"));
                const tasksQuery = query(collection(db, "tasks"));

                const [projectSnap, userSnap, taskSnap] = await Promise.all([
                    getDocs(projectsQuery),
                    getDocs(usersQuery),
                    getDocs(tasksQuery)
                ]);

                const totalRevenue = projectSnap.docs.reduce((acc, doc) => acc + (doc.data().revenue || 0), 0);

                setStats({
                    projects: projectSnap.size,
                    users: userSnap.size,
                    tasks: taskSnap.size,
                    revenue: totalRevenue
                });

            } catch (error) {
                console.error("Error fetching stats: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isPasswordValid) {
            toast({
                variant: "destructive",
                title: "Invalid Input",
                description: "Please fix the errors before submitting.",
            });
            return;
        }

        setPasswordLoading(true);
        const user = auth.currentUser;

        if (!user) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Could not find user information. Please log in again.",
            });
            setPasswordLoading(false);
            router.push('/login');
            return;
        }

        const credential = EmailAuthProvider.credential(user.email!, currentPassword);

        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            
            toast({
                title: "Password Updated Successfully",
                description: "Please log in again with your new password.",
            });
            
            await auth.signOut();
            localStorage.clear();
            router.push('/login');

        } catch (error: any) {
            console.error("Password change error:", error);
            let description = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = "The current password you entered is incorrect.";
            }
            toast({
                variant: "destructive",
                title: "Password Change Failed",
                description: description,
            });
        } finally {
            setPasswordLoading(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };


    return (
        <ScrollArea className="h-full">
            <div className="space-y-6 pb-6 pr-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                            <Avatar className="w-24 h-24 border-4 border-background">
                                <AvatarImage src={`https://placehold.co/96x96.png?text=A`} data-ai-hint="admin user" />
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-3xl">Admin</CardTitle>
                                <CardDescription className="text-lg">System Administrator</CardDescription>
                                <p className="text-muted-foreground mt-4 flex items-center gap-2">
                                   <Mail className="w-5 h-5" /> admin@devtexhhub.com
                                </p>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                             <CardDescription>Update your admin password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form onSubmit={handlePasswordChange} className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="admin-current-password">Current Password</Label>
                                    <Input id="admin-current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="admin-new-password">New Password</Label>
                                    <Input id="admin-new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="admin-confirm-password">Confirm Password</Label>
                                    <Input id="admin-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </div>
                                 {newPassword && (
                                     <div className="space-y-1 text-xs pt-1">
                                        <div className={cn("flex items-center gap-2", newPassword.length >= 6 ? "text-green-600" : "text-destructive")}>
                                            {newPassword.length >= 6 ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            <span>At least 6 characters long</span>
                                        </div>
                                         <div className={cn("flex items-center gap-2", newPassword && newPassword === confirmPassword ? "text-green-600" : "text-destructive")}>
                                             {newPassword && newPassword === confirmPassword ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            <span>Passwords match</span>
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" disabled={passwordLoading || !isPasswordValid} className="w-full !mt-4">
                                    {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>


                <Card>
                    <CardHeader>
                        <CardTitle>System-wide Statistics</CardTitle>
                        <CardDescription>An overview of all data across the platform.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? '...' : stats.projects}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? '...' : stats.users}</div>
                                </CardContent>
                            </Card>
                             <Card className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? '...' : stats.tasks}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <span className="text-muted-foreground font-bold">₹</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? '...' : `₹${stats.revenue.toLocaleString('en-IN')}`}</div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
}
