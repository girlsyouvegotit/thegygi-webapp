import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, Mail, Phone, Save, Loader2, AlignLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Define proper types
interface ProfileFormData {
  name: string;
  bio: string;
  phone: string;
  avatar: string;
}

interface UpdateProfileResponse {
  data: {
    user: {
      name: string;
      bio: string;
      phone: string;
      avatar: string;
    };
  };
}

const MentorProfile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    bio: "",
    phone: "",
    avatar: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await api.put<UpdateProfileResponse>(
        "/users/profile",
        formData,
      );
      if (user) {
        setUser({ ...user, ...data.data.user });
      }
      toast.success("Profile updated");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to update profile:", error);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [formData, setUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your mentor profile</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4" /> Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <AlignLeft className="h-4 w-4" /> Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell your mentees about yourself"
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Phone className="h-4 w-4" /> Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+234..."
                className="mt-1"
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge className="mt-1 bg-purple-100 text-purple-700">
                Mentor
              </Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {user?.createdAt
                  ? format(new Date(user.createdAt), "MMMM d, yyyy")
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorProfile;
