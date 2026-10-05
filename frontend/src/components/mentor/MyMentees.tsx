import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, Search, ArrowRight, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router";
import type { user } from "@/types";
import EmptyState from "@/components/global/EmptyState";

// Define proper types
interface Category {
  _id: string;
  name: string;
}

type Mentee = Omit<user, "categories"> & {
  categories?: Category[];
};

const MyMentees = () => {
  const navigate = useNavigate();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMentees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentorship/my-mentees");
      const allMentees = (data.data.assignments as Array<{ mentees?: Mentee[] }>).flatMap(
        (assignment) => assignment.mentees || [],
      );
      setMentees(allMentees);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to load mentees:", error);
      toast.error(err.response?.data?.message || "Failed to load mentees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentees();
  }, [fetchMentees]);

  const filteredMentees = mentees.filter(
    (mentee) =>
      mentee.name?.toLowerCase().includes(search.toLowerCase()) ||
      mentee.email?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Mentees</h1>
          <p className="text-muted-foreground mt-1">
            Students assigned to you for mentorship
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mentees..."
            className="pl-8 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredMentees.length === 0 ? (
        <EmptyState
          title="No mentees found"
          description="You don't have any mentees assigned yet"
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentees.map((mentee) => (
            <Card
              key={mentee._id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/mentor/mentees/${mentee._id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mentee.avatar} alt={mentee.name} />
                    <AvatarFallback>{mentee.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{mentee.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mentee.email}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                {mentee.categories && mentee.categories.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {mentee.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat._id} variant="outline" className="text-[10px]">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMentees;