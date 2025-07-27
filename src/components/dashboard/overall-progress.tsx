
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

type Project = {
    id: string;
    projectName: string;
    progress?: number;
}

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
}

export function OverallProgress() {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');

    useEffect(() => {
        const projectsQuery = query(collection(db, "projects"));
        const unsubscribe = onSnapshot(projectsQuery, (querySnapshot) => {
            const fetchedProjects: Project[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedProjects.push({
                    id: doc.id,
                    projectName: data.projectName,
                    progress: data.progress || 0
                });
            });
            setProjects(fetchedProjects);
        }, (error) => {
            console.error("Error fetching projects: ", error);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setLoading(true);
        if (projects.length === 0) {
            setLoading(false);
            setProgress(0);
            return;
        };

        if (selectedProject === 'all') {
            const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
            const averageProgress = projects.length > 0 ? totalProgress / projects.length : 0;
            setProgress(Math.round(averageProgress));
        } else {
            const project = projects.find(p => p.id === selectedProject);
            setProgress(project?.progress || 0);
        }
        setLoading(false);
    }, [selectedProject, projects]);

    const chartData = useMemo(() => [
        { name: "completed", visitors: progress, fill: "var(--color-completed)" },
        { name: "remaining", visitors: 100 - progress, fill: "var(--color-remaining)" },
    ], [progress]);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Overall Progress</CardTitle>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>{project.projectName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center relative">
                 <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-[200px]"
                    >
                    <PieChart>
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                            startAngle={90}
                            endAngle={450}
                        >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{loading ? '...' : `${progress}%`}</span>
                    <span className="text-sm text-muted-foreground">Completed</span>
                </div>
            </CardContent>
        </Card>
    )
}
