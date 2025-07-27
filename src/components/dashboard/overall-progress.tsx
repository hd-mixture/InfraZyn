
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
        const q = query(projectsRef, where("status", "==", "In Progress"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let totalProgress = 0;
            const inProgressCount = querySnapshot.size;

            if (inProgressCount === 0) {
                const completedQuery = query(collection(db, "projects"), where("status", "==", "Completed"));
                const completedUnsubscribe = onSnapshot(completedQuery, (completedSnapshot) => {
                     if (completedSnapshot.size > 0) {
                        setProgress(100);
                     } else {
                        setProgress(0);
                     }
                     setLoading(false);
                });
                return () => completedUnsubscribe();
            }

            querySnapshot.forEach((doc) => {
                totalProgress += doc.data().progress || 0;
            });

            const averageProgress = inProgressCount > 0 ? totalProgress / inProgressCount : 0;
            setProgress(Math.round(averageProgress));
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
        <Card className="shadow-sm hover:shadow-md transition-shadow">
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
                    <span className="text-sm text-muted-foreground">In Progress</span>
                </div>
            </CardContent>
        </Card>
    )
}
