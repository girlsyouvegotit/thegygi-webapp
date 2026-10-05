import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AISummaryProps {
  summary: string;
  aiNotes: string;
}

const AISummary = ({ summary, aiNotes }: AISummaryProps) => {
  if (!summary && !aiNotes) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">

          <p>AI summary not available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">

              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
          </CardContent>
        </Card>
      )}

      {aiNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-primary" />
              Study Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISummary;