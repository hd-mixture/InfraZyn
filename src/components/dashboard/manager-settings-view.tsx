
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const mockLoginHistory = [
    { date: 'Aug 22, 2024', time: '10:30 AM', ip: '192.168.1.101', device: 'Chrome on macOS' },
    { date: 'Aug 21, 2024', time: '02:15 PM', ip: '203.0.113.25', device: 'Safari on iPhone' },
    { date: 'Aug 20, 2024', time: '09:00 AM', ip: '198.51.100.12', device: 'Chrome on Windows' },
    { date: 'Aug 19, 2024', time: '05:45 PM', ip: '192.168.1.101', device: 'Chrome on macOS' },
];

export function ManagerSettingsView() {
    const { toast } = useToast();
    const [theme, setTheme] = useState(
        typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light'
    );

    const handlePasswordChange = () => {
        toast({
            title: "Feature Not Available",
            description: "Password changes are not enabled in this demo.",
        });
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
                <Card>
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                        <CardDescription>Manage your account password and view login history.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-medium">Change Password</h3>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                            <Button onClick={handlePasswordChange}>Update Password</Button>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="font-medium">Login History</h3>
                             <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Device</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockLoginHistory.map((entry, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{entry.date}</TableCell>
                                                <TableCell>{entry.time}</TableCell>
                                                <TableCell className="font-mono">{entry.ip}</TableCell>
                                                <TableCell>{entry.device}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        </div>
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
        </ScrollArea>
    );
}
