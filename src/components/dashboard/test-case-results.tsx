
'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

export function TestCaseResults() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Case Results</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around items-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">128</p>
          <p className="text-sm text-muted-foreground">Passed</p>
        </div>
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">12</p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
      </CardContent>
    </Card>
  )
}
