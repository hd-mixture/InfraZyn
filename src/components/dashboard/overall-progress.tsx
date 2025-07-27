
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
import { collection, onSnapshot, query, where, getDocs, Query } from "firebase/firestore";

type Manager = {
    id: string;
    name: string;
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
    const [managers, setManagers] = useState<Manager[]>([]);
    const [selectedManager, setSelectedManager] = useState('all');

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("role", "==", "manager"));
                const querySnapshot = await getDocs(q);
                const fetchedManagers = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }) as Manager);
                setManagers(fetchedManagers);
            } catch(e) {
                console.error("Error fetching managers: ", e);
            }
        }
        fetchManagers();
    }, []);

    useEffect(() => {
        setLoading(true);
        let projectsQuery: Query;
        if (selectedManager === 'all') {
            projectsQuery = query(collection(db, "projects"));
        } else {
            projectsQuery = query(collection(db, "projects"), where("projectManager", "==", selectedManager));
        }

        const unsubscribe = onSnapshot(projectsQuery, (querySnapshot) => {
            let totalProgress = 0;
            let projectCount = 0;

            querySnapshot.forEach((doc) => {
                totalProgress += doc.data().progress || 0;
                projectCount++;
            });
            
            const averageProgress = projectCount > 0 ? totalProgress / projectCount : 0;
            
            setProgress(Math.round(averageProgress));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching progress: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedManager]);

    const chartData = useMemo(() => [
        { name: "completed", visitors: progress, fill: "var(--color-completed)" },
        { name: "remaining", visitors: 100 - progress, fill: "var(--color-remaining)" },
    ], [progress]);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Overall Progress</CardTitle>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Managers</SelectItem>
                        {managers.map(manager => (
                            <SelectItem key={manager.id} value={manager.name}>{manager.name}</SelectItem>
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
