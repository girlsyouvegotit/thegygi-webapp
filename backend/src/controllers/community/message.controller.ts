import type { Response } from "express";
import {
  getChannelMessages,
  createMessage,
  deleteMessageScoped,
  pinMessageForAdmin,
  toggleStarMessage,
  reactToMessage,
  reportMessage,
  replyPrivately,
  forwardMessageToMember,
  getOrCreateDmChannel,
  isCommunityMember,
  getCommunityById,
  findChannel,
  assertChannelAccess,
  assertCanPostToChannel,
  markChannelRead,
  notifyChannelRecipients,
  QUICK_REACTIONS,
} from "../../services/community.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
  badRequest,
} from "../../middleware/error.middleware.js";
import User from "../../models/user.model.js";

export const getMessages = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const communityId = String(req.params.communityId);
    const channelId = String(req.params.channelId);
    const { limit = 50, before } = req.query;
    const userId = req.user!._id.toString();

    const isMember = await isCommunityMember(communityId, userId);
    if (
      !isMember &&
      req.user!.role !== "admin" &&
      req.user!.role !== "super_admin"
    ) {
      throw forbidden("Not a member of this community");
    }

    const community = await getCommunityById(communityId);
    if (!community) throw notFound("Community not found");

    assertChannelAccess(
      findChannel(community, channelId),
      userId,
      req.user!.role,
    );

    const messages = await getChannelMessages(
      communityId,
      channelId,
      userId,
      parseInt(limit as string),
      before ? new Date(before as string) : undefined,
    );

    await markChannelRead(communityId, channelId, userId);

    res.json({
      success: true,
      data: { messages: messages.reverse(), unread: 0 },
    });
  },
);

export const markRead = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const communityId = String(req.params.communityId);
    const channelId = String(req.params.channelId);
    const userId = req.user!._id.toString();

    const community = await getCommunityById(communityId);
    if (!community) throw notFound("Community not found");
    assertChannelAccess(
      findChannel(community, channelId),
      userId,
      req.user!.role,
    );

    const data = await markChannelRead(communityId, channelId, userId);
    res.json({ success: true, data });
  },
);

export const sendMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const communityId = String(req.params.communityId);
    const channelId = String(req.params.channelId);
    const { content, attachments, replyTo } = req.body;
    const userId = req.user!._id.toString();

    const isMember = await isCommunityMember(communityId, userId);
    if (
      !isMember &&
      req.user!.role !== "admin" &&
      req.user!.role !== "super_admin"
    ) {
      throw forbidden("Not a member of this community");
    }

    const community = await getCommunityById(communityId);
    if (!community) throw notFound("Community not found");

    const channel = assertChannelAccess(
      findChannel(community, channelId),
      userId,
      req.user!.role,
    );

    await assertCanPostToChannel(
      communityId,
      channel,
      userId,
      req.user!.role,
    );

    const rawContent = String(content || "").trim();
    const files = Array.isArray(attachments) ? attachments : [];
    if (!rawContent && files.length === 0) {
      throw badRequest("Message content or attachment is required");
    }

    const message = await createMessage(
      communityId,
      channelId,
      userId,
      rawContent || "📎 Shared a file",
      files,
      { replyTo },
    );

    const sender = await User.findById(userId).select("name").lean();
    void notifyChannelRecipients({
      communityId,
      channel,
      senderId: userId,
      senderName: sender?.name || "Member",
      content: String(content),
      messageId: String(message._id),
    });

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: { message },
    });
  },
);

export const deleteMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const messageId = String(req.params.messageId);
    const scope =
      req.query.scope === "everyone" || req.body?.scope === "everyone"
        ? "everyone"
        : "me";

    const result = await deleteMessageScoped(
      messageId,
      req.user!._id.toString(),
      scope,
      req.user!.role,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action:
        scope === "everyone"
          ? "Deleted community message for everyone"
          : "Deleted community message for self",
      resourceType: "message",
      resourceId: messageId,
    });

    res.json({
      success: true,
      message:
        scope === "everyone"
          ? "Message deleted for everyone"
          : "Message deleted for you",
      data: result,
    });
  },
);

export const pinMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const messageId = String(req.params.messageId);
    const message = await pinMessageForAdmin(
      messageId,
      req.user!._id.toString(),
      req.user!.role,
    );

    res.json({
      success: true,
      message: message.isPinned ? "Message pinned" : "Message unpinned",
      data: { message },
    });
  },
);

export const starMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const message = await toggleStarMessage(
      String(req.params.messageId),
      req.user!._id.toString(),
    );
    res.json({
      success: true,
      message: message.isStarredByMe ? "Message starred" : "Star removed",
      data: { message },
    });
  },
);

export const reactMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const message = await reactToMessage(
      String(req.params.messageId),
      req.user!._id.toString(),
      String(req.body.emoji || ""),
    );
    res.json({
      success: true,
      data: { message, quickReplies: QUICK_REACTIONS },
    });
  },
);

export const reportMessageHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const message = await reportMessage(
      String(req.params.messageId),
      req.user!._id.toString(),
      String(req.body.reason || ""),
    );
    res.json({
      success: true,
      message: "Report submitted to community admins",
      data: { message },
    });
  },
);

export const replyPrivateHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await replyPrivately(
      String(req.params.messageId),
      req.user!._id.toString(),
      req.body.content ? String(req.body.content) : undefined,
    );
    res.json({
      success: true,
      message: "Private reply sent",
      data,
    });
  },
);

export const forwardMessageHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await forwardMessageToMember(
      String(req.params.messageId),
      req.user!._id.toString(),
      String(req.body.toUserId || ""),
    );
    res.json({
      success: true,
      message: "Message forwarded",
      data,
    });
  },
);

export const openDmHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const channel = await getOrCreateDmChannel(
      String(req.params.communityId),
      req.user!._id.toString(),
      String(req.body.userId || ""),
    );
    res.json({ success: true, data: { channel } });
  },
);

export const getQuickReplies = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json({ success: true, data: { quickReplies: QUICK_REACTIONS } });
  },
);
