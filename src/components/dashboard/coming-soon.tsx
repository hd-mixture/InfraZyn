
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";

export function ComingSoon() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <Card className="p-10 text-center border-2 border-dashed">
        <div className="flex justify-center mb-4">
          <Rocket className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
        <p className="text-muted-foreground">
          This feature is under construction. Please check back later!
        </p>
      </Card>
    </div>
  );
}
