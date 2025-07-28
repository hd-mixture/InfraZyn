
'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

// Mock data
const mockTimeLogs = [
    { id: '1', project: 'E-commerce Platform', task: 'API Development', user: { name: 'Rajesh Kumar', avatar: 'https://placehold.co/40x40.png' }, date: '2024-08-20', startTime: '09:05', endTime: '12:15', duration: '3h 10m' },
    { id: '2', project: 'Mobile App', task: 'UI Design Mockups', user: { name: 'Priya Patel', avatar: 'https://placehold.co/40x40.png' }, date: '2024-08-20', startTime: '10:00', endTime: '13:00', duration: '3h 0m' },
    { id: '3', project: 'Internal Dashboard', task: 'Component Library Setup', user: { name: 'Sanjay Verma', avatar: 'https://placehold.co/40x40.png' }, date: '2024-08-19', startTime: '14:00', endTime: '18:30', duration: '4h 30m' },
    { id: '4', project: 'E-commerce Platform', task: 'Database Schema Design', user: { name: 'Anita Desai', avatar: 'https://placehold.co/40x40.png' }, date: '2024-08-19', startTime: '09:30', endTime: '17:30', duration: '7h 0m' },
    { id: '5', project: 'Mobile App', task: 'Bug Fixing', user: { name: 'Rajesh Kumar', avatar: 'https://placehold.co/40x40.png' }, date: '2024-08-18', startTime: '11:00', endTime: '15:00', duration: '4h 0m' },
];

const mockUsers = [
    { id: 'user-1', name: 'Rajesh Kumar' },
    { id: 'user-2', name: 'Priya Patel' },
    { id: 'user-3', name: 'Sanjay Verma' },
    { id: 'user-4', name: 'Anita Desai' },
];

export function TimeLogView() {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Time Logs</CardTitle>
                    <CardDescription>Track and manage time entries for your team.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Team Members" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Team Members</SelectItem>
                            {mockUsers.map(user => (
                                <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="this-week">This Week</SelectItem>
                            <SelectItem value="this-month">This Month</SelectItem>
                            <SelectItem value="last-month">Last Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export to CSV
                    </Button>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Log Time
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Member</TableHead>
                            <TableHead>Project / Task</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockTimeLogs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={log.user.avatar} data-ai-hint="person face" />
                                            <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{log.user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{log.project}</div>
                                    <div className="text-sm text-muted-foreground">{log.task}</div>
                                </TableCell>
                                <TableCell>
                                    {new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono">{log.startTime} - {log.endTime}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium font-mono">{log.duration}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
