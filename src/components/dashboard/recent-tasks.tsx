import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const tasks = [
    {
        name: "Design homepage mockup",
        project: "DevTeXhHub Website",
        dueDate: "2024-08-15",
        status: "To Do"
    },
    {
        name: "Implement JWT authentication",
        project: "Project Nova",
        dueDate: "2024-08-20",
        status: "In Progress"
    },
    {
        name: "Fix payment gateway bug",
        project: "E-commerce Platform",
        dueDate: "2024-08-12",
        status: "Done"
    },
    {
        name: "Analyze Q2 sales data",
        project: "QuantumLeap AI",
        dueDate: "2024-08-18",
        status: "To Do"
    },
    {
        name: "User profile page UI",
        project: "Mobile Banking App",
        dueDate: "2024-09-01",
        status: "To Do"
    }
]

const statusVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    "In Progress": "default",
    "To Do": "secondary",
    "Done": "outline",
}

export function RecentTasks() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle>Recent Tasks</CardTitle>
        <CardDescription>A list of your most recent tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.name}>
                <TableCell>
                  <div className="font-medium">{task.name}</div>
                  <div className="text-sm text-muted-foreground">{task.project}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[task.status] || "default"}>{task.status}</Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{task.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
