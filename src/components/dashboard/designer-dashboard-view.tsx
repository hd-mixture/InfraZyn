
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Palette, Eye, CheckCircle } from "lucide-react";
import { AssignedDesignsView } from "./assigned-designs-view";
import { RecentDesignsView } from "./recent-designs-view";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

type DesignerDashboardViewProps = {
    designerName: string | null;
};

export function DesignerDashboardView({ designerName }: DesignerDashboardViewProps) {
    const [stats, setStats] = useState({ activeTasks: 0, pendingReviews: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!designerName) {
            setLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", designerName), where("taskRole", "==", "designer"));
        
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            let active = 0;
            let pending = 0;
            let completed = 0;

            snapshot.forEach(doc => {
                const task = doc.data();
                if (task.status === 'Done') {
                    completed++;
                } else if (task.status === 'In Progress' || task.status === 'To Do') {
                    active++;
                }
                // Assuming 'Pending Review' is a status or can be inferred
                // For now, we'll just count 'In Progress' as something needing review eventually
                if (task.status === 'In Progress') {
                    pending++;
                }
            });

            setStats({ activeTasks: active, pendingReviews: pending, completed: completed });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [designerName]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                        <Palette className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.activeTasks}</div>
                        <p className="text-xs text-muted-foreground">Tasks currently in progress or to-do</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.pendingReviews}</div>
                        <p className="text-xs text-muted-foreground">Designs awaiting feedback</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Designs Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.completed}</div>
                        <p className="text-xs text-muted-foreground">Total designs marked as done</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AssignedDesignsView designerName={designerName} />
                </div>
                <div className="lg:col-span-1">
                    <RecentDesignsView designerName={designerName} />
                </div>
            </div>
        </div>
    );
}
