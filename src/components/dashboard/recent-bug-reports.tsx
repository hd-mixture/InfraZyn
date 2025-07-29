
'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const bugs = [
  { id: 1, title: "UI broken on Safari", status: "Open", date: "2 hours ago" },
  { id: 2, title: "Login button unresponsive", status: "Fixed", date: "1 day ago" },
  { id: 3, title: "Incorrect calculation in reports", status: "Verified", date: "3 days ago" },
  { id: 4, title: "Typo on pricing page", status: "Open", date: "4 days ago" },
]

const statusColor: { [key: string]: string } = {
  "Open": "border-red-500 text-red-500",
  "Fixed": "border-blue-500 text-blue-500",
  "Verified": "border-green-500 text-green-500",
}

export function RecentBugReports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bug Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {bugs.map(bug => (
            <li key={bug.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{bug.title}</p>
                <p className="text-sm text-muted-foreground">{bug.date}</p>
              </div>
              <Badge variant="outline" className={statusColor[bug.status]}>{bug.status}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
