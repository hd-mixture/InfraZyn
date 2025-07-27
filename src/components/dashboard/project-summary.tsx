'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import Image from "next/image";

const projects = [
  {
    name: "DevTeXhHub Website",
    team: ["1", "2", "3"],
    status: "In Progress",
    progress: 75,
  },
  {
    name: "QuantumLeap AI",
    team: ["4", "5"],
    status: "On Hold",
    progress: 30,
  },
  {
    name: "Project Nova",
    team: ["1", "4", "6"],
    status: "Completed",
    progress: 100,
  },
  {
    name: "E-commerce Platform",
    team: ["2", "3", "5", "6"],
    status: "In Progress",
    progress: 45,
  },
  {
    name: "Mobile Banking App",
    team: ["1", "5"],
    status: "Canceled",
    progress: 10,
  },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "In Progress": "default",
    "On Hold": "secondary",
    "Completed": "outline",
    "Canceled": "destructive",
}

export function ProjectSummary() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle>Project Summary</CardTitle>
        <CardDescription>An overview of your active and recent projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="hidden sm:table-cell">Team</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.name}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex -space-x-2">
                    {project.team.map((memberId) => (
                      <Image
                        key={memberId}
                        src={`https://placehold.co/32x32.png`}
                        data-ai-hint="person face"
                        alt="Team member"
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-card"
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={statusVariant[project.status] || "default"}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="w-24" />
                    <span className="text-muted-foreground text-sm">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Project</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
