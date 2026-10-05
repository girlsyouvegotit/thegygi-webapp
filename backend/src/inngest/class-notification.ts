import { inngest } from "./client.js";
import { createBulkNotifications } from "../services/notification.service.js";
import Category from "../models/category.model.js";
import LiveClass from "../models/live-class.model.js";
import { NonRetriableError } from "inngest";

interface ClassNotificationEvent {
  classId: string;
  categoryId: string;
}

export const notifyClassScheduled = inngest.createFunction(
  {
    id: "notify-class-scheduled",
    retries: 1,
  },
  { event: "notifications/class-scheduled" },
  async ({ event, step }) => {
    const { classId, categoryId } = event.data as ClassNotificationEvent;

    console.log("Sending class notifications:", { classId, categoryId });

    await step.run("send-notifications", async () => {
      const [category, liveClass] = await Promise.all([
        Category.findById(categoryId).populate("students", "_id name"),
        LiveClass.findById(classId),
      ]);

      if (!category) {
        throw new NonRetriableError("Category not found");
      }

      if (!liveClass) {
        throw new NonRetriableError("Class not found");
      }

      if (category.students && category.students.length > 0) {
        await createBulkNotifications(
          category.students.map((s: any) => s._id.toString()),
          {
            type: "class_scheduled",
            title: "New Class Scheduled",
            message: `"${liveClass.title}" is scheduled for ${liveClass.scheduledDate.toLocaleString()}`,
            link: `/classes/${classId}`,
            metadata: { classId, categoryId },
          },
        );
      }

      return {
        notified: category.students?.length || 0,
        className: liveClass.title,
      };
    });

    return {
      message: "Notifications sent",
      classId,
    };
  },
);
