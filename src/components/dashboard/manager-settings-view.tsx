
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const mockLoginHistory = [
    { date: 'Aug 22, 2024', time: '10:30 AM', ip: '192.168.1.101', device: 'Chrome on macOS' },
    { date: 'Aug 21, 2024', time: '02:15 PM', ip: '203.0.113.25', device: 'Safari on iPhone' },
    { date: 'Aug 20, 2024', time: '09:00 AM', ip: '198.51.100.12', device: 'Chrome on Windows' },
    { date: 'Aug 19, 2024', time: '05:45 PM', ip: '192.168.1.101', device: 'Chrome on macOS' },
];

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
    
    const isPasswordValid = newPassword.length >= 6 && newPassword === confirmPassword && currentPassword.length > 0;

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
            
            auth.signOut();
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
        <ScrollArea className='h-full pr-4'>
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
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent sign-in activity on your account.
                            <br/><span className="text-xs italic text-muted-foreground/80">(This is sample data. A full implementation requires backend services.)</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Device</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockLoginHistory.map((entry, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div>{entry.date}</div>
                                                    <div className="text-xs text-muted-foreground">{entry.time}</div>
                                                </TableCell>
                                                <TableCell className="font-mono">{entry.ip}</TableCell>
                                                <TableCell>{entry.device}</TableCell>
                                            </TableRow>
                                        ))}
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
