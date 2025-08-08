
'use client'
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns';

type BugReportTask = {
    id: string;
    taskName: string;
    status: 'To Do' | 'In Progress' | 'Done';
    createdAt: Timestamp;
};

type RecentBugReportsProps = {
    qaName: string | null;
    isDashboard?: boolean;
};


const statusColor: { [key: string]: string } = {
  "Done": "border-green-500 text-green-500",
  "In Progress": "border-yellow-500 text-yellow-500",
  "To Do": "border-red-500 text-red-500",
}

export function RecentBugReports({ qaName, isDashboard = false }: RecentBugReportsProps) {
  const [bugs, setBugs] = useState<BugReportTask[]>([]);
  const [loading, setLoading] = useState(true);

  const title = isDashboard ? "Recent Bug Reports" : "All Bug Reports";
  const description = isDashboard ? "Bugs you've recently reported." : "A complete list of bugs you've reported.";

  useEffect(() => {
    if (!qaName) {
        setLoading(false);
        return;
    }

    const bugsQuery = query(
        collection(db, "tasks"),
        where("assignedTo", "==", qaName),
        where("taskRole", "==", "qa"),
        where("testType", "==", "Bug Reporting")
    );

    const unsubscribe = onSnapshot(bugsQuery, (snapshot) => {
        const fetchedBugs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugReportTask));
        setBugs(fetchedBugs);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching bug reports:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [qaName]);
  
  const sortedBugs = useMemo(() => {
    const sorted = [...bugs].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return isDashboard ? sorted.slice(0, 5) : sorted;
  }, [bugs, isDashboard]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
         {loading ? (
            <p className="text-center">Loading bug reports...</p>
        ) : sortedBugs.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No bug reports found. Everything is perfect!</p>
        ) : (
            <ul className="space-y-4">
                {sortedBugs.map(bug => (
                    <li key={bug.id} className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{bug.taskName}</p>
                        <p className="text-sm text-muted-foreground">
                            Reported {formatDistanceToNow(bug.createdAt.toDate(), { addSuffix: true })}
                        </p>
                    </div>
                    <Badge variant="outline" className={statusColor[bug.status]}>{bug.status === 'Done' ? 'Fixed' : bug.status}</Badge>
                    </li>
                ))}
            </ul>
        )}
      </CardContent>
    </Card>
  )
}
