
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from "firebase/firestore"
import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { ScrollArea } from "../ui/scroll-area"

type Activity = {
    id: string;
    type: 'new_project' | 'project_update' | 'delete_project';
    description: string;
    timestamp: Timestamp;
}

const iconMap = {
    'new_project': <PlusCircle className="h-5 w-5 text-green-500" />,
    'project_update': <Edit className="h-5 w-5 text-blue-500" />,
    'delete_project': <Trash2 className="h-5 w-5 text-destructive" />
}

export function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activitiesQuery = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(15));

        const unsubscribe = onSnapshot(activitiesQuery, (querySnapshot) => {
            const fetchedActivities: Activity[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedActivities.push({
                    id: doc.id,
                    ...data
                } as Activity);
            });
            setActivities(fetchedActivities);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching activities: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow flex-grow flex flex-col">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <ScrollArea className="h-[26rem] pr-4 -mr-4">
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
