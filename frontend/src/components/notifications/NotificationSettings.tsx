import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const NotificationSettings = () => {
  const settings = [
    { id: "class_scheduled", label: "Class Scheduled" },
    { id: "class_starting", label: "Class Starting Soon" },
    { id: "recording_available", label: "Recording Available" },
    { id: "quiz_result", label: "Quiz Results" },
    { id: "assignment_graded", label: "Assignment Graded" },
    { id: "mentor_assigned", label: "Mentor Assigned" },
    { id: "session_reminder", label: "Session Reminders" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.id} className="flex items-center justify-between">
            <Label htmlFor={setting.id}>{setting.label}</Label>
            <Switch id={setting.id} defaultChecked />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
