
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Count",
  },
  'To Do': {
    label: "To Do",
    color: "hsl(var(--destructive))",
  },
  'In Progress': {
    label: "In Progress",
    color: "hsl(var(--chart-3))",
  },
  'Done': {
    label: "Fixed",
    color: "hsl(var(--chart-2))",
  },
}

type BugReportStatsProps = {
    qaName: string | null;
};

export function BugReportStats({ qaName }: BugReportStatsProps) {
  const [tasks, setTasks] = useState<{ status: 'To Do' | 'In Progress' | 'Done' }[]>([]);

  useEffect(() => {
    if (!qaName) return;
    
    const tasksQuery = query(
        collection(db, "tasks"),
        where("assignedTo", "==", qaName),
        where("taskRole", "==", "qa"),
        where("testType", "==", "Bug Reporting")
    );
    
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ status: doc.data().status }));
        setTasks(fetchedTasks as any);
    });

    return () => unsubscribe();
  }, [qaName]);

  const chartData = useMemo(() => {
    const counts = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
    tasks.forEach(task => {
        if (counts[task.status] !== undefined) {
            counts[task.status]++;
        }
    });
    return [
        { status: "To Do", count: counts['To Do'], fill: "var(--color-To Do)" },
        { status: "In Progress", count: counts['In Progress'], fill: "var(--color-In Progress)" },
        { status: "Done", count: counts['Done'], fill: "var(--color-Done)" },
    ];
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bug Report Stats</CardTitle>
        <CardDescription>Status of bugs you have reported.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="status"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="count" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
