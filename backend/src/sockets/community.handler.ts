import { Server as SocketServer } from "socket.io";
import type { AuthSocket } from "../types/socket.types.js";
import Community from "../models/community.model.js";
import CommunityMessage from "../models/community-message.model.js";
import User from "../models/user.model.js";
import {
  assertCanPostToChannel,
  notifyChannelRecipients,
} from "../services/community.service.js";

const isMemberOrAdmin = async (
  userId: string,
  role: string,
  categoryId: string,
): Promise<boolean> => {
  if (role === "admin" || role === "super_admin") return true;
  const community = await Community.findOne({
    category: categoryId,
    members: userId,
  }).select("_id");
  return !!community;
};

export const handleCommunityEvents = (
  io: SocketServer,
  socket: AuthSocket,
): void => {
  socket.on("join-community", async (payload: { categoryId: string }) => {
    try {
      const { categoryId } = payload ?? {};
      if (!categoryId || !socket.userId || !socket.userRole) return;

      const allowed = await isMemberOrAdmin(
        socket.userId,
        socket.userRole,
        categoryId,
      );
      if (!allowed) {
        socket.emit("error", { message: "Not a member of this community" });
        return;
      }

      socket.join(`community:${categoryId}`);
      socket.join(`user:${socket.userId}`);
    } catch (err) {
      console.error("join-community error:", err);
    }
  });

  socket.on("leave-community", (payload: { categoryId: string }) => {
    const { categoryId } = payload ?? {};
    if (categoryId) socket.leave(`community:${categoryId}`);
  });

  socket.on(
    "send-community-message",
    async (payload: {
      categoryId: string;
      channelId: string;
      content: string;
      userName?: string;
    }) => {
      try {
        const { categoryId, channelId, content } = payload ?? {};
        if (
          !categoryId ||
          !channelId ||
          !content?.trim() ||
          content.length > 5000 ||
          !socket.userId ||
          !socket.userRole
        ) {
          return;
        }

        const allowed = await isMemberOrAdmin(
          socket.userId,
          socket.userRole,
          categoryId,
        );
        if (!allowed) {
          socket.emit("error", { message: "Not a member of this community" });
          return;
        }

        const community = await Community.findOne({ category: categoryId });
        if (!community) return;

        const channel = community.channels.find(
          (c) => String(c._id) === String(channelId),
        );
        if (!channel) {
          socket.emit("error", { message: "Channel not found" });
          return;
        }

        if (channel.type === "self") {
          const isOwner =
            channel.owner && String(channel.owner) === String(socket.userId);
          if (!isOwner) {
            socket.emit("error", {
              message: "This private channel is only visible to you",
            });
            return;
          }
        }

        if (channel.type === "dm") {
          const isParticipant = (channel.participants || []).some(
            (p) => String(p) === String(socket.userId),
          );
          if (!isParticipant) {
            socket.emit("error", {
              message: "You are not part of this private chat",
            });
            return;
          }
        }

        try {
          await assertCanPostToChannel(
            String(community._id),
            channel,
            socket.userId,
            socket.userRole,
          );
        } catch (err: any) {
          socket.emit("error", {
            message: err?.message || "You cannot post in this channel",
          });
          return;
        }

        const message = await CommunityMessage.create({
          community: community._id,
          channel: channelId,
          user: socket.userId,
          content: content.trim(),
        });

        const sender = await User.findById(socket.userId).select("name").lean();
        void notifyChannelRecipients({
          communityId: String(community._id),
          channel,
          senderId: socket.userId,
          senderName: payload.userName || sender?.name || "Member",
          content: content.trim(),
          messageId: String(message._id),
        });

        const eventPayload = {
          messageId: message._id,
          _id: message._id,
          userId: socket.userId,
          userName: payload.userName || sender?.name || "User",
          user: {
            _id: socket.userId,
            name: payload.userName || sender?.name || "User",
          },
          content: content.trim(),
          channelId,
          timestamp: new Date(),
          createdAt: new Date(),
        };

        if (channel.type === "self") {
          io.to(`user:${socket.userId}`).emit(
            "new-community-message",
            eventPayload,
          );
        } else if (channel.type === "dm") {
          for (const p of channel.participants || []) {
            io.to(`user:${String(p)}`).emit(
              "new-community-message",
              eventPayload,
            );
          }
        } else {
          io.to(`community:${categoryId}`).emit(
            "new-community-message",
            eventPayload,
          );
        }
      } catch (err) {
        console.error("send-community-message error:", err);
      }
    },
  );
};
