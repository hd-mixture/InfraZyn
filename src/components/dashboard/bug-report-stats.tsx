
'use client'
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { status: "Open", count: 8, fill: "var(--color-open)" },
  { status: "Fixed", count: 12, fill: "var(--color-fixed)" },
  { status: "Verified", count: 25, fill: "var(--color-verified)" },
]

const chartConfig = {
  count: {
    label: "Count",
  },
  open: {
    label: "Open",
    color: "hsl(var(--chart-1))",
  },
  fixed: {
    label: "Fixed",
    color: "hsl(var(--chart-2))",
  },
  verified: {
    label: "Verified",
    color: "hsl(var(--chart-3))",
  },
}

export function BugReportStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bug Report Stats</CardTitle>
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
