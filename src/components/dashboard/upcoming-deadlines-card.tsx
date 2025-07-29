
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { format, isBefore, isAfter, startOfToday } from 'date-fns';

type Task = {
    id: string;
    taskName: string;
    dueDate: Timestamp;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Done';
};

type UpcomingDeadlinesCardProps = {
    developerName: string | null;
};

const priorityColor: { [key: string]: string } = {
    'High': "border-red-500 text-red-500 bg-red-500/10",
    'Medium': "border-yellow-500 text-yellow-500 bg-yellow-500/10",
    'Low': "border-green-500 text-green-500 bg-green-500/10",
};

export function UpcomingDeadlinesCard({ developerName }: UpcomingDeadlinesCardProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!developerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(
            collection(db, "tasks"), 
            where("assignedTo", "==", developerName),
            where("status", "!=", "Done")
        );
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Firebase Error in UpcomingDeadlinesCard: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [developerName]);

    const upcomingTasks = useMemo(() => {
        const today = startOfToday();
        return tasks
            .filter(task => {
                const dueDate = task.dueDate.toDate();
                // isAfter check ensures we only show tasks from today onwards
                return isAfter(dueDate, today) || format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            })
            .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis())
            .slice(0, 5); // Limit to 5 tasks
    }, [tasks]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Tasks due soon.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p>Loading deadlines...</p>
                ) : upcomingTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
                ) : (
                    <ul className="space-y-3">
                        {upcomingTasks.map(task => (
                            <li key={task.id} className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium">{task.taskName}</p>
                                    <p className="text-xs text-muted-foreground">{format(task.dueDate.toDate(), 'E, MMM dd')}</p>
                                </div>
                                <Badge variant="outline" className={priorityColor[task.priority]}>{task.priority}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
