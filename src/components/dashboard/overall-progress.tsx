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
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

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

    useEffect(() => {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let completedCount = 0;
            const totalProjects = querySnapshot.size;

            querySnapshot.forEach((doc) => {
                if(doc.data().status === 'Completed') {
                    completedCount++;
                }
            });

            const completionPercentage = totalProjects > 0 ? (completedCount / totalProjects) * 100 : 0;
            setProgress(Math.round(completionPercentage));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching progress: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const chartData = [
        { name: "completed", visitors: progress, fill: "var(--color-completed)" },
        { name: "remaining", visitors: 100 - progress, fill: "var(--color-remaining)" },
    ]

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Overall Progress</CardTitle>
                <Select>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
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
