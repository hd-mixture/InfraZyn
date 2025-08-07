
'use client';

import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Mail, User as UserIcon, Calendar, Edit, Loader2, Palette, Brush, Tag, Phone } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { EditDesignerProfileForm } from './edit-designer-profile-form';

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    role: 'designer';
    avatar?: string;
    phone?: string;
    bio?: string;
    createdAt: Timestamp;
    designTools?: string[];
    specializations?: string[];
    palette?: string;
};

export function DesignerProfileView() {
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
        return <div className="flex items-center justify-center h-full">Could not load designer profile.</div>;
    }

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
                                <CardTitle className="text-3xl flex items-center gap-4">{user.name}</CardTitle>
                                <CardDescription className="text-lg capitalize">{user.role}</CardDescription>
                                <p className="text-muted-foreground mt-2 text-sm">{user.bio || 'This designer has not added a bio yet.'}</p>
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
                                    <Phone className="w-5 h-5 text-muted-foreground" />
                                    <span>{user.phone || 'Not Provided'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <span>Joined on {format(user.createdAt.toDate(), 'dd MMM yyyy')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Brush className="h-5 w-5" /> Design Tools & Specializations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Preferred Tools</h4>
                                    {user.designTools && user.designTools.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {user.designTools.map(tool => <Badge key={tool} variant="secondary">{tool}</Badge>)}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No preferred tools added yet.</p>
                                    )}
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-sm mb-2">Specializations</h4>
                                    {user.specializations && user.specializations.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {user.specializations.map(spec => <Badge key={spec} variant="outline">{spec}</Badge>)}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No specializations added yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Preferred Palette</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {user.palette ? (
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: user.palette }}></div>
                                        <span className="font-mono text-sm">{user.palette}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No preferred color palette set.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>
            {isEditDialogOpen && (
                <EditDesignerProfileForm
                    user={user}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
        </>
    );
}
