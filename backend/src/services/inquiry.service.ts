import Inquiry, {
  type GetInvolvedInterest,
} from "../models/inquiry.model.js";
import User from "../models/user.model.js";
import { createBulkNotifications } from "./notification.service.js";
import { sendToUser } from "../sockets/socket.server.js";

export async function createGetInvolvedInquiry(input: {
  name: string;
  email: string;
  interest: GetInvolvedInterest;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const interest = input.interest;

  const inquiry = await Inquiry.create({
    name,
    email,
    interest,
    status: "new",
  });

  const staff = await User.find({
    role: { $in: ["admin", "super_admin"] },
    isActive: true,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  })
    .select("_id")
    .lean();

  const userIds = staff.map((u) => String(u._id));

  if (userIds.length > 0) {
    const notifications = await createBulkNotifications(userIds, {
      type: "get_involved_inquiry",
      title: `New Get Involved: ${interest}`,
      message: `${name} (${email}) wants to ${interest}`,
      metadata: {
        name,
        email,
        interest,
        inquiryId: String(inquiry._id),
        action: "mailto_reply",
      },
      channels: { email: false, push: false, inApp: true },
    });

    for (const n of notifications) {
      sendToUser(String(n.user), "new-notification", {
        _id: String(n._id),
        user: String(n.user),
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link ?? null,
        isRead: n.isRead,
        metadata: n.metadata,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      });
    }
  }

  return inquiry;
}
