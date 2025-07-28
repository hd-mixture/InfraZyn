
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';

type Project = {
    id: string;
    projectName: string;
    revenue?: number;
};

export function RevenueBreakdown({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;

        setLoading(true);
        const projectsQuery = query(collection(db, "projects"), where("revenue", ">", 0));
        const unsubscribe = onSnapshot(projectsQuery, (querySnapshot) => {
            const fetchedProjects: Project[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedProjects.push({
                    id: doc.id,
                    projectName: data.projectName,
                    revenue: data.revenue
                });
            });
            setProjects(fetchedProjects);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching projects: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [open]);

    const totalRevenue = projects.reduce((acc, p) => acc + (p.revenue || 0), 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    {children}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className='text-xl'>₹</span> Revenue Breakdown
                    </DialogTitle>
                    <DialogDescription>
                        A detailed breakdown of revenue per project.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Name</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">No projects with revenue found.</TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.projectName}</TableCell>
                                        <TableCell className="text-right">
                                            ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(project.revenue || 0)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">Total Revenue</TableCell>
                                <TableCell className="text-right font-bold">
                                    ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalRevenue)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
