
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, arrayUnion, Timestamp, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Upload, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import axios from 'axios';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { cn } from '@/lib/utils';


type Moodboard = {
    id: string;
    title: string;
    description: string;
    images: { url: string, hint: string }[];
    createdBy: string;
    createdAt: Timestamp;
};

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
});

type MoodboardsViewProps = {
    designerName: string | null;
    searchQuery: string;
};

export function MoodboardsView({ designerName, searchQuery }: MoodboardsViewProps) {
    const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingMoodboard, setDeletingMoodboard] = useState<Moodboard | null>(null);
    const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);
    const [uploading, setUploading] = useState(false);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>()
    const [currentSlide, setCurrentSlide] = useState(0)
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { title: '', description: '' },
    });
    
    const autoplayPlugin = useRef(
        Autoplay({ delay: 2000, stopOnInteraction: true })
    );

    useEffect(() => {
        if (!carouselApi) {
          return
        }
     
        setCurrentSlide(carouselApi.selectedScrollSnap())
     
        carouselApi.on("select", () => {
          setCurrentSlide(carouselApi.selectedScrollSnap())
        })
      }, [carouselApi])

    useEffect(() => {
        if (!designerName) {
            setLoading(false);
            return;
        }

        const moodboardsQuery = query(collection(db, "moodboards"), where("createdBy", "==", designerName));
        const unsubscribe = onSnapshot(moodboardsQuery, (snapshot) => {
            const fetchedMoodboards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moodboard));
            setMoodboards(fetchedMoodboards.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching moodboards:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [designerName]);

    const handleCreateMoodboard = async (values: z.infer<typeof formSchema>) => {
        if (!designerName) return;
        try {
            await addDoc(collection(db, 'moodboards'), {
                ...values,
                createdBy: designerName,
                createdAt: Timestamp.now(),
                images: [],
            });
            toast({ title: 'Moodboard Created!' });
            setOpenDialog(false);
            form.reset();
        } catch (error) {
            console.error("Error creating moodboard: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create moodboard.' });
        }
    };
    
    const handleImageUpload = async () => {
        if (!filesToUpload || !selectedMoodboard) return;
        setUploading(true);
        try {
            let newImages: { url: string, hint: string }[] = [];
            for (const file of Array.from(filesToUpload)) {
                 const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
                
                const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                formData
                );
                
                newImages.push({ url: response.data.secure_url, hint: 'idea' });
            }

            const moodboardRef = doc(db, 'moodboards', selectedMoodboard.id);
            await updateDoc(moodboardRef, {
                images: arrayUnion(...newImages)
            });

            toast({ title: 'Images added successfully!' });
            setIsUploadDialogOpen(false);
            setFilesToUpload(null);

        } catch (error) {
            console.error("Error uploading images: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload images.' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteClick = (moodboard: Moodboard) => {
        setDeletingMoodboard(moodboard);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteMoodboard = async () => {
        if (!deletingMoodboard) return;
        try {
            await deleteDoc(doc(db, 'moodboards', deletingMoodboard.id));
            toast({ title: 'Moodboard Deleted' });
        } catch (error) {
            console.error("Error deleting moodboard: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete moodboard.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingMoodboard(null);
        }
    };
    
     const filteredMoodboards = useMemo(() => {
        return moodboards.filter(m =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [moodboards, searchQuery]);

    if (loading) return <p>Loading moodboards...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Moodboards</h1>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Moodboard
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Moodboard</DialogTitle>
                            <DialogDescription>Create a new space for your ideas.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreateMoodboard)} className="space-y-4">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Project Phoenix UI" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="A short description of this moodboard's purpose." /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <DialogFooter>
                                    <Button type="submit">Create</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {filteredMoodboards.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/50">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Moodboards Yet</h3>
                    <p className="text-muted-foreground mt-2 text-center">Click 'Create Moodboard' to start your first collection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMoodboards.map(board => (
                        <Card key={board.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="cursor-pointer hover:underline" onClick={() => setSelectedMoodboard(board)}>{board.title}</CardTitle>
                                        <CardDescription>{board.description}</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(board)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow cursor-pointer" onClick={() => setSelectedMoodboard(board)}>
                                <div className="relative h-32 w-full">
                                    {board.images.length === 0 ? (
                                         <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-muted rounded-md">No images yet</div>
                                    ) : (
                                        board.images.slice(0, 3).map((img, index) => (
                                            <div key={index} 
                                                 className="absolute h-24 w-2/3 bg-muted rounded-lg overflow-hidden border-2 border-background shadow-md"
                                                 style={{
                                                     top: `${index * 15}px`,
                                                     left: `${index * 15}%`,
                                                     zIndex: index,
                                                 }}
                                            >
                                                <Image src={img.url} alt={`Moodboard image ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint={img.hint} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="secondary" className="w-full" onClick={() => { setSelectedMoodboard(board); setIsUploadDialogOpen(true); }}>
                                    <Upload className="mr-2 h-4 w-4" /> Add Images
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
             
            {/* View/Edit Moodboard Dialog */}
            <Dialog open={!!selectedMoodboard} onOpenChange={() => setSelectedMoodboard(null)}>
                 <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                    {selectedMoodboard && (
                        <>
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>{selectedMoodboard.title}</DialogTitle>
                            <DialogDescription>{selectedMoodboard.description}</DialogDescription>
                        </DialogHeader>
                        {selectedMoodboard.images.length > 0 ? (
                            <div className="flex-1 flex flex-col overflow-hidden pb-6">
                                <Carousel
                                    setApi={setCarouselApi}
                                    plugins={[autoplayPlugin.current]}
                                    opts={{ loop: true }}
                                    className="w-full h-full relative embla-fade"
                                >
                                    <CarouselContent className="h-full">
                                        {selectedMoodboard.images.map((img, index) => (
                                            <CarouselItem key={index} className="h-full flex items-center justify-center">
                                                <div className="relative w-full h-full max-h-[calc(80vh-100px)] aspect-video">
                                                    <Image
                                                        src={img.url}
                                                        alt={`Moodboard image ${index + 1}`}
                                                        layout="fill"
                                                        objectFit="contain"
                                                        className="rounded-lg"
                                                        data-ai-hint={img.hint}
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                                <div className="flex justify-center items-center gap-2 pt-4">
                                    {selectedMoodboard.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => carouselApi?.scrollTo(index)}
                                            className={cn("p-0 h-1 rounded-full transition-all duration-300", 
                                                index === currentSlide ? "w-8 bg-primary" : "w-6 bg-muted-foreground/50"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-muted-foreground">No images in this moodboard yet.</p>
                            </div>
                        )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
            
            {/* Upload Images Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload to {selectedMoodboard?.title}</DialogTitle>
                        <DialogDescription>Select images to add to your moodboard.</DialogDescription>
                    </DialogHeader>
                    <div>
                         <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                            </div>
                            <Input id="image-upload" type="file" multiple className="hidden" onChange={(e) => setFilesToUpload(e.target.files)} />
                        </label>
                        {filesToUpload && <p className="text-sm text-muted-foreground mt-2">{filesToUpload.length} file(s) selected.</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleImageUpload} disabled={!filesToUpload || uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
             {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the moodboard "{deletingMoodboard?.title}" and all its images. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMoodboard} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
