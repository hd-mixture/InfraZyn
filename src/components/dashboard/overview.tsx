
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
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
    const [projectChange, setProjectChange] = useState<{percentage: number | null, type: 'increase' | 'decrease' | 'first_month'}>({percentage: null, type: 'first_month'});
    const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
    const [revenueChange, setRevenueChange] = useState<{percentage: number | null, type: 'increase' | 'decrease' | 'first_month'}>({percentage: null, type: 'first_month'});
    const [timeSpent, setTimeSpent] = useState(0);
    const [resourceCount, setResourceCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const projectsQuery = query(collection(db, "projects"));
        const usersQuery = query(collection(db, "users"));

        const unsubscribeProjects = onSnapshot(projectsQuery, (querySnapshot) => {
            let hours = 0;

            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            let currentMonthRevenueTotal = 0;
            let lastMonthRevenueTotal = 0;
            let currentMonthProjectCount = 0;
            let lastMonthProjectCount = 0;

            querySnapshot.forEach((doc) => {
                hours += doc.data().hoursLogged || 0;
                
                const projectData = doc.data();
                const createdAt = (projectData.createdAt as Timestamp).toDate();
                
                if(createdAt >= startOfCurrentMonth) {
                    currentMonthRevenueTotal += projectData.revenue || 0;
                    currentMonthProjectCount++;
                } else if (createdAt >= startOfLastMonth && createdAt <= endOfLastMonth) {
                    lastMonthRevenueTotal += projectData.revenue || 0;
                    lastMonthProjectCount++;
                }
            });

            setProjectCount(currentMonthProjectCount);
            setTimeSpent(Math.round(hours));
            setCurrentMonthRevenue(currentMonthRevenueTotal);

            // Revenue Change Calculation
            if (lastMonthRevenueTotal === 0 && currentMonthRevenueTotal > 0) {
                 setRevenueChange({ percentage: null, type: 'first_month' });
            } else if (lastMonthRevenueTotal > 0) {
                const percentageChange = ((currentMonthRevenueTotal - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100;
                setRevenueChange({
                    percentage: Math.abs(percentageChange),
                    type: percentageChange >= 0 ? 'increase' : 'decrease'
                });
            } else {
                 setRevenueChange({ percentage: 0, type: 'increase' });
            }

            // Project Change Calculation
            if (lastMonthProjectCount === 0 && currentMonthProjectCount > 0) {
                setProjectChange({ percentage: null, type: 'first_month' });
            } else if (lastMonthProjectCount > 0) {
                const percentageChange = ((currentMonthProjectCount - lastMonthProjectCount) / lastMonthProjectCount) * 100;
                setProjectChange({
                    percentage: Math.abs(percentageChange),
                    type: percentageChange >= 0 ? 'increase' : 'decrease'
                });
            } else {
                setProjectChange({ percentage: 0, type: 'increase' });
            }

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

    const getRevenueChangeText = () => {
        if (revenueChange.type === 'first_month') {
            return "First month data";
        }
        if (revenueChange.percentage === null) {
            return "No data for comparison";
        }
        return `${revenueChange.percentage.toFixed(1)}% ${revenueChange.type} from last month`;
    }

    const getProjectChangeText = () => {
        if (projectChange.type === 'first_month') {
            return "First month data";
        }
        if (projectChange.percentage === null) {
            return "No data for comparison";
        }
        return `${projectChange.percentage.toFixed(1)}% ${projectChange.type} from last month`;
    }

  const overviewData = [
    {
      title: "This month's revenue",
      value: loading ? "..." : `₹${new Intl.NumberFormat('en-IN').format(currentMonthRevenue)}`,
      change: loading ? "" : getRevenueChangeText(),
      icon: <RupeeIcon className="h-6 w-6 text-muted-foreground" />,
      changeIcon: revenueChange.type === 'increase' ? <TrendingUp className="h-4 w-4 text-green-500" /> : revenueChange.type === 'decrease' ? <TrendingDown className="h-4 w-4 text-red-500" /> : null,
      clickable: true,
    },
    {
      title: "Projects",
      value: loading ? "..." : `${projectCount} / 100`,
      change: loading ? "" : getProjectChangeText(),
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
      changeIcon: projectChange.type === 'increase' ? <TrendingUp className="h-4 w-4 text-green-500" /> : projectChange.type === 'decrease' ? <TrendingDown className="h-4 w-4 text-red-500" /> : null
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
