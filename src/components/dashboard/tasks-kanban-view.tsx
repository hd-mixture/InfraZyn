
'use client'

import { PlusCircle, MoreHorizontal, Clock, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

// Mock data, this would come from your database
const mockTasks = [
    { id: 'task-1', title: 'Design the new login page', project: 'E-commerce Platform', status: 'To Do', priority: 'High', dueDate: '2024-08-15', assignedTo: { name: 'Priya Patel', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-2', title: 'Develop user authentication API', project: 'E-commerce Platform', status: 'In Progress', priority: 'High', dueDate: '2024-08-20', assignedTo: { name: 'Rajesh Kumar', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-3', title: 'Fix bug in payment gateway integration', project: 'Mobile App', status: 'In Progress', priority: 'Medium', dueDate: '2024-08-12', assignedTo: { name: 'Anita Desai', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-4', title: 'Write documentation for the API', project: 'E-commerce Platform', status: 'Done', priority: 'Low', dueDate: '2024-08-10', assignedTo: { name: 'Sanjay Verma', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-5', title: 'Set up staging server', project: 'Internal Dashboard', status: 'To Do', priority: 'Medium', dueDate: '2024-08-18', assignedTo: { name: 'Priya Patel', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-6', title: 'Deploy frontend to Vercel', project: 'Mobile App', status: 'To Do', priority: 'High', dueDate: '2024-08-22', assignedTo: { name: 'Rajesh Kumar', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-7', title: 'Client meeting for feature feedback', project: 'Mobile App', status: 'Done', priority: 'Medium', dueDate: '2024-08-05', assignedTo: { name: 'Anita Desai', avatar: 'https://placehold.co/40x40.png' } },
    { id: 'task-8', title: 'Refactor user profile component', project: 'E-commerce Platform', status: 'In Progress', priority: 'Low', dueDate: '2024-08-25', assignedTo: { name: 'Sanjay Verma', avatar: 'https://placehold.co/40x40.png' } },
];

const columns = [
    { id: 'todo', title: 'To Do', tasks: mockTasks.filter(t => t.status === 'To Do') },
    { id: 'inprogress', title: 'In Progress', tasks: mockTasks.filter(t => t.status === 'In Progress') },
    { id: 'done', title: 'Done', tasks: mockTasks.filter(t => t.status === 'Done') }
];

const priorityIcons = {
    'High': <ArrowUp className="h-4 w-4 text-red-500" />,
    'Medium': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Low': <ArrowDown className="h-4 w-4 text-green-500" />
};

function TaskCard({ task }: { task: typeof mockTasks[0] }) {
    return (
        <Card className="mb-4 bg-card hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm mb-2">{task.title}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
                <Badge variant="secondary" className="mb-3">{task.project}</Badge>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {priorityIcons[task.priority as keyof typeof priorityIcons]}
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignedTo.avatar} data-ai-hint="person face" />
                            <AvatarFallback>{task.assignedTo.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TasksKanbanView() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </div>
            <ScrollArea className="flex-grow">
                <div className="flex gap-6 pb-4">
                    {columns.map(column => (
                        <div key={column.id} className="w-[320px] flex-shrink-0">
                            <Card className="bg-muted/50">
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-medium">{column.title}</CardTitle>
                                        <Badge variant="secondary">{column.tasks.length}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {column.tasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
