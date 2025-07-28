
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, PieChart, Clock, Calendar } from 'lucide-react';

const mockResources = [
    { id: '1', name: 'Rajesh Kumar', avatar: 'https://placehold.co/40x40.png', role: 'Developer', workload: 80, projects: ['E-commerce Platform', 'Mobile App'] },
    { id: '2', name: 'Priya Patel', avatar: 'https://placehold.co/40x40.png', role: 'Designer', workload: 60, projects: ['Mobile App'] },
    { id: '3', name: 'Sanjay Verma', avatar: 'https://placehold.co/40x40.png', role: 'Developer', workload: 100, projects: ['Internal Dashboard', 'E-commerce Platform'] },
    { id: '4', name: 'Anita Desai', avatar: 'https://placehold.co/40x40.png', role: 'Project Manager', workload: 40, projects: ['E-commerce Platform'] },
];

export function ResourceManagementView() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockResources.length}</div>
                        <p className="text-xs text-muted-foreground">Team Members</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Utilization</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">75%</div>
                        <p className="text-xs text-muted-foreground">Across all projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Weekly Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">160h</div>
                        <p className="text-xs text-muted-foreground">Based on 40h/person</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Planning Cycle</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Aug 26</div>
                        <p className="text-xs text-muted-foreground">Weekly resource planning</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Team Allocation</CardTitle>
                    <Button>Plan Resources</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Current Workload</TableHead>
                                <TableHead>Assigned Projects</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockResources.map(resource => (
                                <TableRow key={resource.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={resource.avatar} data-ai-hint="person face" />
                                                <AvatarFallback>{resource.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{resource.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{resource.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={resource.workload} className="w-32" />
                                            <span className="text-sm text-muted-foreground">{resource.workload}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {resource.projects.map(project => (
                                                <Badge key={project} variant="outline">{project}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
