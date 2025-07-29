
'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const tasks = [
  { id: 1, module: "User Authentication Flow", status: "In Progress" },
  { id: 2, module: "Payment Gateway Integration", status: "Pending" },
  { id: 3, module: "API Performance Testing", status: "Completed" },
  { id: 4, module: "Mobile Responsiveness", status: "In Progress" },
]

const statusColor: { [key: string]: string } = {
  "Completed": "border-green-500 text-green-500",
  "In Progress": "border-blue-500 text-blue-500",
  "Pending": "border-yellow-500 text-yellow-500",
}

export function AssignedTestingTasks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Testing Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
              <p className="font-medium">{task.module}</p>
              <Badge variant="outline" className={statusColor[task.status]}>{task.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
