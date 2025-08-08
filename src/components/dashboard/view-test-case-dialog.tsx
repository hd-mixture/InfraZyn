
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, Flag, Folder, FileText, Check, ListChecks } from 'lucide-react';
import { Separator } from '../ui/separator';
import type { TestCase } from './test-cases-view';
import { Button } from '../ui/button';

type ViewTestCaseDialogProps = {
    testCase: TestCase;
    projectName: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
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

const DetailSection = ({ title, children, icon }: { title: string; children: React.ReactNode, icon: React.ReactNode }) => (
    <div>
        <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
            {icon} {title}
        </h3>
        <div className="text-sm text-muted-foreground pl-7 space-y-2">
            {children}
        </div>
    </div>
);

export function ViewTestCaseDialog({ testCase, projectName, isOpen, onOpenChange }: ViewTestCaseDialogProps) {

    if (!testCase) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{testCase.title}</DialogTitle>
                    <DialogDescription>
                        Created by {testCase.createdBy} on {format(testCase.createdAt.toDate(), 'PPP')}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                <Folder size={16} className="text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Project</p>
                                    <p className="font-medium">{projectName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                <FileText size={16} className="text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <p className="font-medium">
                                        <Badge variant="outline" className={statusColor[testCase.status]}>{testCase.status}</Badge>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                <Flag size={16} className="text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Priority</p>
                                    <p className="font-medium">
                                        <Badge variant="outline" className={priorityColor[testCase.priority]}>{testCase.priority}</Badge>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />
                        
                        {testCase.preconditions && (
                             <DetailSection icon={<Check size={16}/>} title="Preconditions">
                                <p className="whitespace-pre-wrap">{testCase.preconditions}</p>
                             </DetailSection>
                        )}
                        
                        {testCase.steps && testCase.steps.length > 0 && (
                            <DetailSection icon={<ListChecks size={16}/>} title="Test Steps">
                                <ol className="list-decimal list-outside space-y-2 pl-4">
                                    {testCase.steps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ol>
                            </DetailSection>
                        )}
                        
                        {testCase.expectedResult && (
                             <DetailSection icon={<Check size={16}/>} title="Expected Result">
                                <p className="whitespace-pre-wrap">{testCase.expectedResult}</p>
                             </DetailSection>
                        )}

                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
