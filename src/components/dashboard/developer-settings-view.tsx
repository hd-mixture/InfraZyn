
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun, CheckCircle, XCircle, Code, Edit, GitBranch, Folder, Clock, Activity, Monitor, Smartphone } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

const mockProjects = [
    { id: 1, name: 'E-commerce Platform', repo: 'github.com/org/ecom', branch: 'develop' },
    { id: 2, name: 'Mobile App', repo: 'gitlab.com/org/mobile', branch: 'feature/login' },
    { id: 3, name: 'Internal Dashboard', repo: 'github.com/org/dashboard', branch: 'main' },
]

const mockActivityLog = [
    { date: 'Aug 23, 2024, 10:30 AM', device: 'Chrome on macOS', ip: '192.168.1.101', icon: <Monitor className="h-4 w-4" /> },
    { date: 'Aug 22, 2024, 02:15 PM', device: 'Safari on iPhone', ip: '203.0.113.25', icon: <Smartphone className="h-4 w-4" /> },
    { date: 'Aug 21, 2024, 09:00 AM', device: 'Chrome on Windows', ip: '198.51.100.12', icon: <Monitor className="h-4 w-4" /> },
];

export function DeveloperSettingsView() {
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

                 <Card>
                    <CardHeader>
                        <CardTitle>Project Preferences</CardTitle>
                        <CardDescription>
                            Manage your project settings and availability.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <Label className="font-medium">Assigned Projects</Label>
                              <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Repository Link</TableHead>
                                            <TableHead>Default Branch</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockProjects.map(project => (
                                            <TableRow key={project.id}>
                                                <TableCell className="font-medium">{project.name}</TableCell>
                                                <TableCell><a href={`https://${project.repo}`} target="_blank" className="text-blue-500 hover:underline">{project.repo}</a></TableCell>
                                                <TableCell><Badge variant="outline"><GitBranch className="h-3 w-3 mr-1.5" />{project.branch}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                              </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="availability">Work Hours / Availability</Label>
                                <Select defaultValue="9-5">
                                    <SelectTrigger id="availability">
                                        <SelectValue placeholder="Select your availability" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="9-5">9:00 AM - 5:00 PM</SelectItem>
                                        <SelectItem value="10-6">10:00 AM - 6:00 PM</SelectItem>
                                        <SelectItem value="flexible">Flexible Hours</SelectItem>
                                        <SelectItem value="part-time">Part-time (4 hours)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="editor">Code Editor Preference</Label>
                                <Select defaultValue="vscode">
                                    <SelectTrigger id="editor">
                                        <SelectValue placeholder="Select your editor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vscode">Visual Studio Code</SelectItem>
                                        <SelectItem value="webstorm">WebStorm</SelectItem>
                                        <SelectItem value="sublime">Sublime Text</SelectItem>
                                        <SelectItem value="vim">Vim</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Activity Log</CardTitle>
                        <CardDescription>
                            Recent sign-in activity on your account.
                            <br/><span className="text-xs italic text-muted-foreground/80">(This is sample data for demonstration.)</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockActivityLog.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{log.date}</TableCell>
                                            <TableCell><div className="flex items-center gap-2">{log.icon}{log.device}</div></TableCell>
                                            <TableCell className="font-mono text-muted-foreground">{log.ip}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
}
