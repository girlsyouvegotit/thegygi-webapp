import { Users, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Member {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface MemberListProps {
  members: Member[];
  title?: string;
}

const MemberList = ({ members, title = "Members" }: MemberListProps) => {
  const getRoleBadge = (role?: string) => {
    if (!role) return null;

    const roleConfig = {
      admin: { className: "bg-purple-100 text-purple-700", label: "Admin" },
      tutor: { className: "bg-blue-100 text-blue-700", label: "Tutor" },
      student: { className: "bg-green-100 text-green-700", label: "Student" },
      mentor: { className: "bg-amber-100 text-amber-700", label: "Mentor" },
    };

    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return null;

    return (
      <Badge className={cn("text-[10px] px-1.5 py-0", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">
            ({members.length})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No members yet</p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  {getRoleBadge(member.role)}
                </div>
                {member.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberList;
