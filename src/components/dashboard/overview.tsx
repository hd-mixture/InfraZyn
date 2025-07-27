import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, Users, TrendingUp, TrendingDown } from "lucide-react";

// Custom Rupee Icon
const RupeeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="m19 13-10 8" />
    <path d="M6 13h4" />
    <path d="M6 21h4" />
  </svg>
);


export function Overview() {
  const overviewData = [
    {
      title: "Total revenue",
      value: "₹53,00,989",
      change: "+12% increase from last month",
      icon: <RupeeIcon className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingUp className="h-4 w-4 text-green-500" />
    },
    {
      title: "Projects",
      value: "95 / 100",
      change: "10% decrease from last month",
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingDown className="h-4 w-4 text-red-500" />
    },
    {
      title: "Time spent",
      value: "1022 / 1300 Hrs",
      change: "8% increase from last month",
      icon: <Clock className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingUp className="h-4 w-4 text-green-500" />
    },
    {
      title: "Resources",
      value: "101 / 120",
      change: "2% increase from last month",
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingUp className="h-4 w-4 text-green-500" />
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="p-3 rounded-md bg-muted">
                {item.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{item.title}</div>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {item.changeIcon}
                <span>{item.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
