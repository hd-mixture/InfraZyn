'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "../ui/button";

const projects = [
  {
    name: "Nelsa web developement",
    manager: "Om prakash sao",
    dueDate: "May 25, 2023",
    status: "Completed",
    progress: 100,
  },
  {
    name: "Datascale AI app",
    manager: "Neilsan mando",
    dueDate: "Jun 20, 2023",
    status: "Delayed",
    progress: 35,
  },
  {
    name: "Media channel branding",
    manager: "Tiruvelly priya",
    dueDate: "July 13, 2023",
    status: "At risk",
    progress: 68,
  },
  {
    name: "Corlax IOS app develpoement",
    manager: "Matte hannery",
    dueDate: "Dec 20, 2023",
    status: "Completed",
    progress: 100,
  },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Completed": "outline",
    "Delayed": "destructive",
    "At risk": "default",
}

const statusColor: { [key: string]: string } = {
    "Completed": "text-green-500",
    "Delayed": "text-red-500",
    "At risk": "text-yellow-500",
}

const progressColor: { [key: string]: string } = {
    "Completed": "bg-green-500",
    "Delayed": "bg-red-500",
    "At risk": "bg-yellow-500",
}

export function ProjectSummary() {
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
            {projects.map((project) => (
              <TableRow key={project.name}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.manager}</TableCell>
                <TableCell>{project.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[project.status]} className={`${statusColor[project.status]} bg-opacity-20`}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                            <div className={`h-full rounded-full ${progressColor[project.status]}`} style={{ width: `${project.progress}%` }}></div>
                        </div>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
