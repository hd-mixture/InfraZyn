
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { CreateTestCaseForm } from './create-test-case-form';
import { ViewTestCaseDialog } from './view-test-case-dialog';

export type TestCase = {
    id: string;
    title: string;
    projectId: string;
    status: 'Draft' | 'Ready for Review' | 'Approved' | 'Deprecated';
    priority: 'Low' | 'Medium' | 'High';
    createdAt: Timestamp;
    createdBy: string;
    preconditions?: string;
    steps?: string[];
    expectedResult?: string;
};

type Project = {
    id: string;
    projectName: string;
};

type TestCasesViewProps = {
    qaName: string | null;
    searchQuery: string;
};

const statusColor: { [key: string]: string } = {
  "Draft": "border-gray-500 text-gray-500",
  "Ready for Review": "border-blue-500 text-blue-500",
  "Approved": "border-green-500 text-green-500",
  "Deprecated": "border-red-500 text-red-500",
};

const priorityColor: { [key: string]: string } = {
    'High': "border-red-500 text-red-500 bg-red-500/10",
    'Medium': "border-yellow-500 text-yellow-500 bg-yellow-500/10",
    'Low': "border-green-500 text-green-500 bg-green-500/10",
};


export function TestCasesView({ qaName, searchQuery }: TestCasesViewProps) {
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingTestCase, setDeletingTestCase] = useState<TestCase | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!qaName) {
            setLoading(false);
            return;
        }
        
        const testCasesQuery = query(collection(db, 'testCases'), where('createdBy', '==', qaName));
        const unsubscribeTestCases = onSnapshot(testCasesQuery, (snapshot) => {
            const fetchedTestCases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestCase));
            setTestCases(fetchedTestCases.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setLoading(false);
        });

        const projectsQuery = query(collection(db, "projects"));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
            setProjects(fetchedProjects);
        });

        return () => {
            unsubscribeTestCases();
            unsubscribeProjects();
        };
    }, [qaName]);
    
    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
    };

    const handleDeleteClick = (testCase: TestCase) => {
        setDeletingTestCase(testCase);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteTestCase = async () => {
        if (!deletingTestCase) return;
        try {
            await deleteDoc(doc(db, 'testCases', deletingTestCase.id));
            toast({ title: 'Test Case Deleted' });
        } catch (error) {
            console.error("Error deleting test case: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete test case.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingTestCase(null);
        }
    };

    const filteredTestCases = useMemo(() => {
        return testCases.filter(tc =>
            tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getProjectName(tc.projectId).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [testCases, projects, searchQuery]);

    if (loading) return <p>Loading test cases...</p>;

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Test Cases</CardTitle>
                        <CardDescription>Manage your project test cases here.</CardDescription>
                    </div>
                    <CreateTestCaseForm 
                        qaName={qaName} 
                        projects={projects}
                        isOpen={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    >
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Test Case
                        </Button>
                    </CreateTestCaseForm>
                </CardHeader>
                <CardContent>
                    {filteredTestCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/50">
                            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">No Test Cases Found</h3>
                            <p className="text-muted-foreground mt-2 text-center">Click 'Create Test Case' to start.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTestCases.map(tc => (
                                    <TableRow key={tc.id}>
                                        <TableCell className="font-medium">{tc.title}</TableCell>
                                        <TableCell>{getProjectName(tc.projectId)}</TableCell>
                                        <TableCell><Badge variant="outline" className={statusColor[tc.status]}>{tc.status}</Badge></TableCell>
                                        <TableCell><Badge variant="outline" className={priorityColor[tc.priority]}>{tc.priority}</Badge></TableCell>
                                        <TableCell>{format(tc.createdAt.toDate(), 'dd MMM, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setViewingTestCase(tc)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(tc)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {viewingTestCase && (
                 <ViewTestCaseDialog
                    testCase={viewingTestCase}
                    projectName={getProjectName(viewingTestCase.projectId)}
                    isOpen={!!viewingTestCase}
                    onOpenChange={() => setViewingTestCase(null)}
                />
            )}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this test case. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTestCase} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
