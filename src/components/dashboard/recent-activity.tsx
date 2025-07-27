
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from "firebase/firestore"
import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, Edit } from "lucide-react"
import { ScrollArea } from "../ui/scroll-area"

type Activity = {
    id: string;
    type: 'new_project' | 'status_update';
    projectName: string;
    description: string;
    timestamp: Timestamp;
}

const iconMap = {
    'new_project': <PlusCircle className="h-5 w-5 text-green-500" />,
    'status_update': <Edit className="h-5 w-5 text-blue-500" />
}

export function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(5));

        const unsubscribe = onSnapshot(projectsQuery, (querySnapshot) => {
            const fetchedActivities: Activity[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedActivities.push({
                    id: doc.id,
                    type: 'new_project',
                    projectName: data.projectName,
                    description: `New project "${data.projectName}" was created.`,
                    timestamp: data.createdAt
                });
            });
            // This is a simplified version. A real app would likely have a separate 'activities' collection.
            // For now, we'll just show the newest projects.
            setActivities(fetchedActivities);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[380px] pr-4 -mr-4">
                    <div className="space-y-6">
                        {loading ? (
                            <p>Loading activities...</p>
                        ) : activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recent activity.</p>
                        ) : (
                            activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    {iconMap[activity.type]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        )))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
