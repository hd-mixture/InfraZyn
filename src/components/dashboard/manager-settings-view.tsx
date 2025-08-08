
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun, CheckCircle, XCircle, Monitor, Smartphone } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';


type ActivityLog = {
    id: string;
    timestamp: Timestamp;
    device: string;
};

const getDeviceIcon = (userAgent: string) => {
    if (/iphone|ipad|ipod/i.test(userAgent)) return <Smartphone className="h-4 w-4" />;
    if (/android/i.test(userAgent)) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
};

const parseDevice = (userAgent: string) => {
    // This is a very basic parser, a more robust library could be used for production
    const ua = userAgent.toLowerCase();
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // OS detection
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone')) os = 'iOS';

    // Browser detection
    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';

    return `${browser} on ${os}`;
}


export function ManagerSettingsView() {
    const { toast } = useToast();
    const router = useRouter();
    const [theme, setTheme] = useState(
        typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light'
    );
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    
    const isPasswordValid = newPassword.length >= 6 && newPassword === confirmPassword && currentPassword.length > 0;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(db, "activityLogs"),
                    where("userId", "==", user.uid),
                    orderBy("timestamp", "desc"),
                    limit(5)
                );
                const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
                    setActivityLog(logs);
                    setLoadingActivity(false);
                }, (error) => {
                    console.error("Error fetching activity logs:", error);
                    setLoadingActivity(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setLoadingActivity(false);
            }
        });

        return () => unsubscribe();
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

        setLoading(true);
        const user = auth.currentUser;
        const userEmail = localStorage.getItem('userEmail');

        if (!user || !userEmail) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Could not find user information. Please log in again.",
            });
            setLoading(false);
            return;
        }

        const credential = EmailAuthProvider.credential(userEmail, currentPassword);

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
            setLoading(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };
    
    const handleSetTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
            document.documentElement.classList.remove('light', 'dark');
            if (newTheme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.add(systemTheme);
            } else {
                document.documentElement.classList.add(newTheme);
            }
        }
    };

    return (
        <ScrollArea className='h-full pr-4 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent'>
            <div className="space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Settings</CardTitle>
                            <CardDescription>Manage your account password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </div>
                                {newPassword && (
                                     <div className="space-y-2 text-xs">
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
                                <Button type="submit" disabled={loading || !isPasswordValid}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>
                                Recent sign-in activity on your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date &amp; Time</TableHead>
                                            <TableHead>Device</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingActivity ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center h-24">Loading activity...</TableCell>
                                            </TableRow>
                                        ) : activityLog.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center h-24">No recent activity found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            activityLog.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-medium">{log.timestamp ? format(log.timestamp.toDate(), 'MMM dd, yyyy, p') : 'N/A'}</TableCell>
                                                    <TableCell><div className="flex items-center gap-2">{getDeviceIcon(log.device)}{parseDevice(log.device)}</div></TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>UI Preferences</CardTitle>
                        <CardDescription>Customize the look and feel of the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="font-medium">Theme</Label>
                            <p className="text-sm text-muted-foreground">Select the theme for the dashboard.</p>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => handleSetTheme('light')}>
                                <Sun className="mr-2 h-4 w-4" /> Light
                            </Button>
                            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => handleSetTheme('dark')}>
                                <Moon className="mr-2 h-4 w-4" /> Dark
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
}
