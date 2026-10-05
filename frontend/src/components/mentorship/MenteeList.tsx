import { Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { user } from "@/types";

interface MenteeListProps {
  mentees: user[];
  onSelect?: (mentee: user) => void;
}

const MenteeList = ({ mentees, onSelect }: MenteeListProps) => {
  if (mentees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2" />
        <p>No mentees assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mentees.map((mentee) => (
        <Card
          key={mentee._id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect?.(mentee)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={mentee.avatar} alt={mentee.name} />
                <AvatarFallback>{mentee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{mentee.name}</p>
                <p className="text-xs text-muted-foreground">{mentee.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MenteeList;
