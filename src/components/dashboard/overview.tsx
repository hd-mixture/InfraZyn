import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, Clock, Users } from "lucide-react";

export function Overview() {
  const overviewData = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Projects",
      value: "+12",
      change: "+180.1% from last month",
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Time Spent",
      value: "12,234",
      change: "+19% from last month",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Active Users",
      value: "+573",
      change: "+201 since last hour",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
