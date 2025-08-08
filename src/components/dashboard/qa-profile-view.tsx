
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Mail, User as UserIcon, Calendar, Edit, Loader2, Bug, ListChecks, Activity, ShieldCheck, FileText, XCircle, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { EditQAProfileForm } from './edit-qa-profile-form';

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    role: 'qa';
    avatar?: string;
    phone?: string;
    bio?: string;
    createdAt: Timestamp;
    skills?: string[];
    testingTools?: string[];
    status: 'Active' | 'On Leave';
};

export type Task = {
    id: string;
    status: 'To Do' | 'In Progress' | 'Done';
    testType?: string;
    verificationStatus?: 'passed' | 'failed';
    bugSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
};

export type TestCase = {
    id: string;
};

export function QAProfileView() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
            if (currentUser) {
                const userQuery = query(collection(db, "users"), where("email", "==", currentUser.email));
                const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
                    if (!snapshot.empty) {
                        const userData = snapshot.docs[0].data() as Omit<UserProfile, 'id'>;
                        setUser({ id: snapshot.docs[0].id, ...userData });

                        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", userData.name));
                        const testCasesQuery = query(collection(db, "testCases"), where("createdBy", "==", userData.name));
                        
                        onSnapshot(tasksQuery, (taskSnapshot) => {
                            setTasks(taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
                        });

                        onSnapshot(testCasesQuery, (testCaseSnapshot) => {
                            setTestCases(testCaseSnapshot.docs.map(doc => ({ id: doc.id } as TestCase)));
                        });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    setLoading(false);
                });
                return () => unsubscribeUser();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const stats = useMemo(() => {
        const bugReports = tasks.filter(t => t.testType === 'Bug Reporting');
        const openBugs = bugReports.filter(b => b.status === 'To Do' || b.status === 'In Progress').length;
        const fixedBugs = bugReports.filter(b => b.status === 'Done').length;
        const rejectedBugs = bugReports.filter(b => b.verificationStatus === 'failed').length;
        
        return {
            totalBugReports: bugReports.length,
            openBugs,
            fixedBugs,
            rejectedBugs,
            totalTestCases: testCases.length,
        }
    }, [tasks, testCases]);

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
    
    if (loading) return <div className="flex items-center justify-center h-full">Loading profile...</div>;
    if (!user) return <div className="flex items-center justify-center h-full">Could not load QA profile.</div>;

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <ScrollArea className="h-full scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
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
                                        {user.status || 'Active'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-lg">Quality Assurance Engineer</CardDescription>
                                <p className="text-muted-foreground mt-2 text-sm">{user.bio || 'Meticulous QA Engineer dedicated to ensuring software quality and reliability.'}</p>
                            </div>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                        </CardHeader>
                        <CardContent className="border-t pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-muted-foreground" /> <span>{user.email}</span></div>
                                <div className="flex items-center gap-3"><UserIcon className="w-5 h-5 text-muted-foreground" /> <span>Quality Assurance Team</span></div>
                                <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-muted-foreground" /> <span>Joined on {format(user.createdAt.toDate(), 'dd MMM yyyy')}</span></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>QA Activity Overview</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-center"><p className="text-2xl font-bold">{stats.totalBugReports}</p><p className="text-xs text-muted-foreground">Bugs Reported</p></div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center"><p className="text-2xl font-bold text-yellow-600">{stats.openBugs}</p><p className="text-xs text-muted-foreground">Open Bugs</p></div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center"><p className="text-2xl font-bold text-green-600">{stats.fixedBugs}</p><p className="text-xs text-muted-foreground">Fixed Bugs</p></div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center"><p className="text-2xl font-bold text-red-600">{stats.rejectedBugs}</p><p className="text-xs text-muted-foreground">Rejected Bugs</p></div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center"><p className="text-2xl font-bold">{stats.totalTestCases}</p><p className="text-xs text-muted-foreground">Test Cases Created</p></div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Testing Skills</CardTitle></CardHeader>
                            <CardContent>
                                {user.skills && user.skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">{user.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
                                ) : (<p className="text-sm text-muted-foreground">No skills added yet.</p>)}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Tool Expertise</CardTitle></CardHeader>
                            <CardContent>
                                {user.testingTools && user.testingTools.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">{user.testingTools.map(tool => <Badge key={tool} variant="outline">{tool}</Badge>)}</div>
                                ) : (<p className="text-sm text-muted-foreground">No tools added yet.</p>)}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </ScrollArea>
             {isEditDialogOpen && (
                <EditQAProfileForm
                    user={user}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
        </>
    );
}
