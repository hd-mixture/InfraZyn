
'use client'
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Clock } from 'lucide-react';

type BugReportTask = {
    id: string;
    taskName: string;
    project: string;
    status: 'To Do' | 'In Progress' | 'Done';
    createdAt: Timestamp;
    verificationStatus?: 'pending' | 'passed' | 'failed';
};

type Project = {
    id: string;
    projectName: string;
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
  const [projects, setProjects] = useState<Project[]>([]);
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

    const unsubscribeBugs = onSnapshot(bugsQuery, (snapshot) => {
        const fetchedBugs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugReportTask));
        setBugs(fetchedBugs);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching bug reports:", err);
        setLoading(false);
    });

    const projectsQuery = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, projectName: doc.data().projectName } as Project));
        setProjects(fetchedProjects);
    });


    return () => {
        unsubscribeBugs();
        unsubscribeProjects();
    };
  }, [qaName]);
  
  const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.projectName || 'Unknown Project';
  };
  
  const sortedBugs = useMemo(() => {
    const sorted = [...bugs].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return isDashboard ? sorted.slice(0, 5) : sorted;
  }, [bugs, isDashboard]);

  const getReviewStatusComponent = (task: BugReportTask) => {
      if (task.status !== 'Done') {
          return <Badge variant="outline">Not Submitted</Badge>
      }
      switch(task.verificationStatus) {
          case 'passed':
              return <Badge variant="outline" className="bg-green-500/10 border-green-500 text-green-600"><ThumbsUp className="h-3 w-3 mr-1.5" />Passed</Badge>
          case 'failed':
              return <Badge variant="outline" className="bg-red-500/10 border-red-500 text-red-600"><ThumbsDown className="h-3 w-3 mr-1.5" />Failed</Badge>
          case 'pending':
          default:
              return <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500 text-yellow-600"><Clock className="h-3 w-3 mr-1.5" />Pending</Badge>
      }
  }


  if (isDashboard) {
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
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Bug Report</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Manager Review</TableHead>
                        <TableHead>Current Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedBugs.map(bug => (
                         <TableRow key={bug.id}>
                            <TableCell className="font-medium">{bug.taskName}</TableCell>
                            <TableCell>{getProjectName(bug.project)}</TableCell>
                            <TableCell>{format(bug.createdAt.toDate(), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{getReviewStatusComponent(bug)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusColor[bug.status]}>
                                    {bug.status === 'Done' ? 'Fixed' : bug.status}
                                </Badge>
                            </TableCell>
                         </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  )
}
