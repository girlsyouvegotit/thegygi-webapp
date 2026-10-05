import { Users, GraduationCap, HeartHandshake, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { category, user } from "@/types";
import EmptyState from "@/components/global/EmptyState";

interface CategoryDetailProps {
  category: category;
}

const CategoryDetail = ({ category }: CategoryDetailProps) => {
  const renderPersonCard = (person: user, role: string) => (
    <Card key={person._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={person.avatar} alt={person.name} />
            <AvatarFallback>{person.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{person.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {person.email}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {role}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <p className="text-muted-foreground mt-2">{category.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Users className="h-4 w-4" />
            {category.studentCount || 0} Students
          </Badge>
          <Badge variant="outline" className="gap-1">
            <GraduationCap className="h-4 w-4" />
            {category.tutorCount || 0} Tutors
          </Badge>
          <Badge variant="outline" className="gap-1">
            <HeartHandshake className="h-4 w-4" />
            {category.mentorCount || 0} Mentors
          </Badge>
        </div>
      </div>

      {/* Banner Image */}
      {category.bannerImage && (
        <div className="h-48 md:h-64 rounded-lg overflow-hidden">
          <img
            src={category.bannerImage}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tutors">
        <TabsList>
          <TabsTrigger value="tutors">
            <GraduationCap className="h-4 w-4 mr-2" />
            Tutors ({category.tutorCount || 0})
          </TabsTrigger>
          <TabsTrigger value="mentors">
            <HeartHandshake className="h-4 w-4 mr-2" />
            Mentors ({category.mentorCount || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutors" className="space-y-3 mt-4">
          {category.tutors && category.tutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.tutors.map((tutor) => renderPersonCard(tutor, "tutor"))}
            </div>
          ) : (
            <EmptyState
              title="No tutors assigned"
              description="Tutors will appear here once assigned to this category"
              icon={<UserPlus className="h-8 w-8 text-muted-foreground" />}
            />
          )}
        </TabsContent>

        <TabsContent value="mentors" className="space-y-3 mt-4">
          {category.mentors && category.mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.mentors.map((mentor) =>
                renderPersonCard(mentor, "mentor"),
              )}
            </div>
          ) : (
            <EmptyState
              title="No mentors assigned"
              description="Mentors will appear here once assigned to this category"
              icon={<UserPlus className="h-8 w-8 text-muted-foreground" />}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoryDetail;
