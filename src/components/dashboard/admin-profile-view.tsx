
'use client';

import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Users, Briefcase, ListChecks, DollarSign, Camera, Loader2, Phone, Calendar, User } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import axios from 'axios';


export function AdminProfileView() {
    const [stats, setStats] = useState({ projects: 0, users: 0, tasks: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [avatar, setAvatar] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminAvatar');
        }
        return null;
    });
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'adminAvatar') {
                setAvatar(event.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
            
            const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData
            );
            
            const avatarUrl = response.data.secure_url;
            setAvatar(avatarUrl);
            localStorage.setItem('adminAvatar', avatarUrl);
            window.dispatchEvent(new StorageEvent('storage', { key: 'userAvatar', newValue: avatarUrl }));


            toast({
                title: 'Profile Picture Updated!',
                description: 'Your new avatar has been saved.',
            });

        } catch (e) {
            console.error('Error uploading image: ', e);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'There was a problem uploading your image.',
            });
        } finally {
            setUploading(false);
        }
    };


    return (
        <>
         <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />
        <ScrollArea className="h-full">
            <div className="space-y-6 pb-6 pr-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-3">
                        <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <Avatar className="w-24 h-24 border-4 border-background">
                                    <AvatarImage src={avatar || `https://placehold.co/96x96.png?text=A`} data-ai-hint="admin user" />
                                    <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {uploading ? (
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    ) : (
                                            <Camera className="h-8 w-8 text-white" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-3xl">Admin</CardTitle>
                                <CardDescription className="text-lg">System Administrator</CardDescription>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" /> 
                                        <span>admin@devtexhhub.com</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-5 h-5" /> 
                                        <span>+91 98765 43210 (Default)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-5 h-5" /> 
                                        <span>Admin</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" /> 
                                        <span>Admin Since: {format(new Date(), 'dd MMM yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
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
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
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
        </>
    );
}
