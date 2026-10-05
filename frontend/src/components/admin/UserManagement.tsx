import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  Search,
  Trash2,
  Ban,
  CheckCircle2,
  Loader2,
  Shield,
  GraduationCap,
  HeartHandshake,
  User,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { user, UserRole } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import { cn } from "@/lib/utils";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const UserManagement = () => {
  const [users, setUsers] = useState<user[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>("student");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Role assignment state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<user | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("student");
  const [assigningRole, setAssigningRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?role=${activeRole}`);
      setUsers(data.data?.users || data.users || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSuspend = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/suspend`);
      toast.success("User suspended");
      fetchUsers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to suspend user"));
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/activate`);
      toast.success("User activated");
      fetchUsers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to activate user"));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("User deleted");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchUsers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete user"));
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) {
      toast.error("Please select a role");
      return;
    }

    if (newRole === selectedUser.role) {
      toast.error("User already has this role");
      return;
    }

    setAssigningRole(true);
    try {
      await api.put(`/users/${selectedUser._id}/role`, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole("student");
      fetchUsers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to change role"));
    } finally {
      setAssigningRole(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-700 gap-1">
            <Shield className="w-3 h-3" /> Admin
          </Badge>
        );
      case "tutor":
        return (
          <Badge className="bg-blue-100 text-blue-700 gap-1">
            <GraduationCap className="w-3 h-3" /> Tutor
          </Badge>
        );
      case "student":
        return (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <User className="w-3 h-3" /> Student
          </Badge>
        );
      case "mentor":
        return (
          <Badge className="bg-amber-100 text-amber-700 gap-1">
            <HeartHandshake className="w-3 h-3" /> Mentor
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-purple-500" />;
      case "tutor":
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case "student":
        return <User className="w-4 h-4 text-green-500" />;
      case "mentor":
        return <HeartHandshake className="w-4 h-4 text-amber-500" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <Users className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-gray-500 font-medium">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              User Management
            </h1>
            <p className="text-sm text-gray-500">Manage all platform users</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-9 w-72 bg-white border-[#E5E7EB] rounded-full h-10 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Role Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-[#E5E7EB] shadow-sm w-fit">
        {[
          { role: "student" as UserRole, label: "Students" },
          { role: "tutor" as UserRole, label: "Tutors" },
          { role: "mentor" as UserRole, label: "Mentors" },
          { role: "admin" as UserRole, label: "Admins" },
        ].map((tab) => (
          <button
            key={tab.role}
            onClick={() => setActiveRole(tab.role)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-all",
              activeRole === tab.role
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "text-gray-500 hover:bg-gray-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            search ? `No results for "${search}"` : `No ${activeRole}s found`
          }
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card
              key={user._id}
              className="group relative overflow-hidden border border-[#E5E7EB] shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative shrink-0">
                    <Avatar className="w-12 h-12 border-2 border-gray-200 shadow-md">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {user.role === "admin" && (
                      <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  {getRoleBadge(user.role)}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    className={cn(
                      "gap-1",
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700",
                    )}
                  >
                    {user.isActive ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Ban className="w-3 h-3" />
                    )}
                    {user.isActive ? "Active" : "Suspended"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole(user.role);
                      setRoleDialogOpen(true);
                    }}
                  >
                    {getRoleIcon(user.role)}
                    <span className="ml-1">Change Role</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      user.isActive
                        ? handleSuspend(user._id)
                        : handleActivate(user._id)
                    }
                    title={user.isActive ? "Suspend" : "Activate"}
                  >
                    {user.isActive ? (
                      <Ban className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setDeleteId(user._id);
                      setDeleteOpen(true);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Change the role for{" "}
              <span className="font-semibold text-gray-900">
                {selectedUser?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Current Role</p>
              {selectedUser && getRoleBadge(selectedUser.role)}
            </div>

            <div>
              <label className="text-sm font-medium">New Role</label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as UserRole)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAssignRole}
                disabled={assigningRole || newRole === selectedUser?.role}
              >
                {assigningRole ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Role"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
