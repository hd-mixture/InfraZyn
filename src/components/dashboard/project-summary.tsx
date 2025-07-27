'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import { format } from "date-fns";

type Project = {
    id: string;
    projectName: string;
    projectManager: string;
    endDate: Timestamp;
    status: string;
    progress?: number;
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Completed": "outline",
    "In Progress": "secondary",
    "On Hold": "default",
    "Delayed": "destructive",
    "At risk": "default",
    "Not Started": "secondary",
}

const statusColor: { [key: string]: string } = {
    "Completed": "text-green-500",
    "In Progress": "text-blue-500",
    "On Hold": "text-gray-500",
    "Delayed": "text-red-500",
    "At risk": "text-yellow-500",
    "Not Started": "text-gray-500"
}

const progressColor: { [key: string]: string } = {
    "Completed": "bg-green-500",
    "In Progress": "bg-blue-500",
    "Delayed": "bg-red-500",
    "At risk": "bg-yellow-500",
    "On Hold": "bg-gray-500",
    "Not Started": "bg-gray-200"
}


export function ProjectSummary() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "projects"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({ 
            id: doc.id,
            projectName: data.projectName,
            projectManager: data.projectManager,
            endDate: data.endDate,
            status: data.status,
            progress: data.progress || 0 // Add a fallback for progress
        });
      });
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching projects: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Project summary</CardTitle>
        </div>
        <div className="flex gap-2">
            <Select>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                </SelectContent>
            </Select>
            <Select>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Project manager" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                </SelectContent>
            </Select>
            <Select>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Project manager</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading projects...</TableCell>
                </TableRow>
            ) : projects.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No projects found. Create one to get started!</TableCell>
                </TableRow>
            ) : (
                projects.map((project) => (
                <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell>{project.projectManager}</TableCell>
                    <TableCell>{project.endDate ? format(project.endDate.toDate(), 'PP') : 'N/A'}</TableCell>
                    <TableCell>
                    <Badge variant={statusVariant[project.status] || 'default'} className={`${statusColor[project.status] || ''} bg-opacity-20`}>
                        {project.status}
                    </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full">
                                <div className={`h-full rounded-full ${progressColor[project.status]}`} style={{ width: `${project.progress || 0}%` }}></div>
                            </div>
                            <span className="text-xs text-muted-foreground">{project.progress || 0}%</span>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
