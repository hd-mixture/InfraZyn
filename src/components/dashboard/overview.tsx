
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { RevenueBreakdown } from "./revenue-breakdown";

// Custom Rupee Icon
export const RupeeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    const [projectCount, setProjectCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [resourceCount, setResourceCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const projectsQuery = query(collection(db, "projects"));
        const usersQuery = query(collection(db, "users"));

        const unsubscribeProjects = onSnapshot(projectsQuery, (querySnapshot) => {
            let projectNum = 0;
            let revenue = 0;
            let hours = 0;
            querySnapshot.forEach((doc) => {
                projectNum++;
                revenue += doc.data().revenue || 0;
                hours += doc.data().hoursLogged || 0;
            });
            setProjectCount(projectNum);
            setTotalRevenue(revenue);
            setTimeSpent(Math.round(hours));
        }, (error) => {
            console.error("Error fetching projects data: ", error);
        });

        const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
            setResourceCount(querySnapshot.size);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users count: ", error);
            setLoading(false);
        });
        
        return () => {
            unsubscribeProjects();
            unsubscribeUsers();
        };
    }, []);

  const overviewData = [
    {
      title: "Total revenue",
      value: loading ? "..." : `₹${new Intl.NumberFormat('en-IN').format(totalRevenue)}`,
      change: "+12% increase from last month",
      icon: <RupeeIcon className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingUp className="h-4 w-4 text-green-500" />,
      clickable: true,
    },
    {
      title: "Projects",
      value: loading ? "..." : `${projectCount} / 100`,
      change: "10% decrease from last month",
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingDown className="h-4 w-4 text-red-500" />
    },
    {
      title: "Time spent",
      value: loading ? "..." : `${timeSpent} / 1300 Hrs`,
      change: "8% increase from last month",
      icon: <Clock className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingUp className="h-4 w-4 text-green-500" />
    },
    {
      title: "Resources",
      value: loading ? "..." : `${resourceCount} / 120`,
      change: "2% increase from last month",
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      changeIcon: <TrendingUp className="h-4 w-4 text-green-500" />
    },
  ];

  const renderCard = (item: (typeof overviewData)[0]) => (
     <Card className="shadow-sm hover:shadow-md transition-shadow">
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
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        item.clickable ? (
            <RevenueBreakdown key={index}>
                {renderCard(item)}
            </RevenueBreakdown>
        ) : (
            <div key={index}>
                {renderCard(item)}
            </div>
        )
      ))}
    </div>
  );
}
