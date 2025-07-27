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

const chartData = [
  { browser: "chrome", visitors: 72, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 28, fill: "var(--color-safari)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  safari: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
}

export function OverallProgress() {
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
                            nameKey="browser"
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
                    <span className="text-4xl font-bold">72%</span>
                    <span className="text-sm text-muted-foreground">Completed</span>
                </div>
            </CardContent>
        </Card>
    )
}
