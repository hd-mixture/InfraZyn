
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { Task } from './tasks-kanban-view';

type TaskProgressChartProps = {
    developerName: string | null;
};

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  'To Do': {
    label: "To Do",
    color: "hsl(var(--chart-3))",
  },
  'In Progress': {
    label: "In Progress",
    color: "hsl(var(--chart-1))",
  },
  'Done': {
    label: "Done",
    color: "hsl(var(--chart-2))",
  },
}

export function TaskProgressChart({ developerName }: TaskProgressChartProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!developerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", developerName));
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => doc.data() as Task);
            setTasks(fetchedTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [developerName]);

    const progressData = useMemo(() => {
        const counts = {
            'To Do': 0,
            'In Progress': 0,
            'Done': 0,
        };
        tasks.forEach(task => {
            if (counts[task.status] !== undefined) {
                counts[task.status]++;
            }
        });
        return Object.entries(counts).map(([status, count]) => ({
            name: status,
            value: count,
            fill: `var(--color-${status.replace(' ', '')})`,
        }));
    }, [tasks]);

    const totalTasks = tasks.length;

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle>Task Progress</CardTitle>
                <CardDescription>Your task distribution by status.</CardDescription>
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
                            data={progressData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                            startAngle={90}
                            endAngle={450}
                        >
                        {progressData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                         ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{loading ? '...' : totalTasks}</span>
                    <span className="text-sm text-muted-foreground">Total Tasks</span>
                </div>
            </CardContent>
        </Card>
    )
}
