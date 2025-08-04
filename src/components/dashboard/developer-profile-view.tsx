
'use client';

import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Mail, User as UserIcon, Calendar, Briefcase, ListChecks, Users, Link as LinkIcon, Loader2, Edit, Code, Tag, Activity, Github, Linkedin, Gitlab } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { EditDeveloperProfileForm } from './edit-developer-profile-form';

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    role: 'developer';
    status: 'Active' | 'On Leave';
    avatar?: string;
    bio?: string;
    skills?: string[];
    createdAt: Timestamp;
    github?: string;
    linkedin?: string;
    gitlab?: string;
};

export function DeveloperProfileView() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
            if (currentUser) {
                const userQuery = query(collection(db, "users"), where("email", "==", currentUser.email));
                const unsubscribeSnapshot = onSnapshot(userQuery, (snapshot) => {
                    if (!snapshot.empty) {
                        const userData = snapshot.docs[0].data() as Omit<UserProfile, 'id'>;
                        setUser({ id: snapshot.docs[0].id, ...userData });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch profile data.' });
                    setLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [toast]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

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
            
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { avatar: avatarUrl });
            localStorage.setItem('userAvatar', avatarUrl);
            window.dispatchEvent(new Event('storage'));

            toast({ title: 'Profile Picture Updated!', description: 'Your new avatar has been saved.' });
        } catch (e) {
            console.error('Error uploading image: ', e);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'There was a problem uploading your image.' });
        } finally {
            setUploading(false);
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading profile...</div>;
    }

    if (!user) {
        return <div className="flex items-center justify-center h-full">Could not load developer profile.</div>;
    }

    const experience = formatDistanceToNowStrict(user.createdAt.toDate());

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <ScrollArea className="h-full">
                <div className="space-y-6 pb-6 pr-4">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <Avatar className="w-24 h-24 border-4 border-background">
                                    <AvatarImage src={user.avatar || `https://placehold.co/96x96.png?text=${user.name.charAt(0)}`} data-ai-hint="person face" />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   {uploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                                </div>
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-3xl flex items-center gap-4">
                                    {user.name}
                                    <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'} className={user.status === 'Active' ? 'text-green-600' : 'text-muted-foreground'}>
                                        <Activity className="w-3 h-3 mr-1.5" />
                                        {user.status}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-lg capitalize">{user.role}</CardDescription>
                                <p className="text-muted-foreground mt-2 text-sm">{user.bio || 'This developer has not added a bio yet.'}</p>
                            </div>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                        </CardHeader>
                        <CardContent className="border-t pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{user.id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <span>Joined on {format(user.createdAt.toDate(), 'dd MMM yyyy')} ({experience})</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Skills & Technologies</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {user.skills && user.skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {user.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No skills have been added yet.</p>
                                )}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Linked Accounts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {user.github ? (
                                    <a href={user.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary">
                                        <Github className="h-5 w-5 text-muted-foreground" /> <span>{user.github.replace('https://github.com/', '')}</span>
                                    </a>
                                ) : (
                                    <p className="flex items-center gap-3 text-sm text-muted-foreground"><Github className="h-5 w-5" /> Not Linked</p>
                                )}
                                {user.linkedin ? (
                                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary">
                                        <Linkedin className="h-5 w-5 text-muted-foreground" /> <span>{user.linkedin.replace('https://www.linkedin.com/in/', '')}</span>
                                    </a>
                                ) : (
                                     <p className="flex items-center gap-3 text-sm text-muted-foreground"><Linkedin className="h-5 w-5" /> Not Linked</p>
                                )}
                                {user.gitlab ? (
                                    <a href={user.gitlab} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary">
                                        <Gitlab className="h-5 w-5 text-muted-foreground" /> <span>{user.gitlab.replace('https://gitlab.com/', '')}</span>
                                    </a>
                                ) : (
                                     <p className="flex items-center gap-3 text-sm text-muted-foreground"><Gitlab className="h-5 w-5" /> Not Linked</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>
            {isEditDialogOpen && (
                <EditDeveloperProfileForm 
                    user={user}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
        </>
    );
}
