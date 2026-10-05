import type { Request, Response } from "express";
import {
  createAnnouncement as createAnnouncementService,
  getChannelMessages,
  isCommunityMember,
} from "../../services/community.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

/**
 * Create an announcement
 * @route POST /api/communities/:communityId/announcements
 */
export const createAnnouncement = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { communityId } = req.params;
    const { content } = req.body;

    // Check if user is a tutor or admin
    if (req.user!.role !== "admin" && req.user!.role !== "tutor") {
      throw forbidden("Only tutors and admins can post announcements");
    }

    // Find announcement channel
    const communityIdStr = Array.isArray(communityId) ? communityId[0] : communityId;
    const community = await getCommunityById(communityIdStr);
    if (!community) {
      throw notFound("Community not found");
    }

    const announcementChannel = community.channels.find(
      (channel: any) => channel.type === "announcements",
    );

    if (!announcementChannel) {
      throw notFound("Announcement channel not found");
    }

    const announcement = await createAnnouncementService(
      communityIdStr,
      announcementChannel._id.toString(),
      req.user!._id.toString(),
      content,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Posted announcement",
      resourceType: "announcement",
      resourceId: announcement._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Announcement posted",
      data: { announcement },
    });
  },
);

/**
 * Get announcements
 * @route GET /api/communities/:communityId/announcements
 */
export const getAnnouncements = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { communityId } = req.params;

    const community = await getCommunityById(
      Array.isArray(communityId) ? communityId[0] : communityId,
    );
    if (!community) {
      throw notFound("Community not found");
    }

    const announcementChannel = community.channels.find(
      (channel: any) => channel.type === "announcements",
    );

    if (!announcementChannel) {
      throw notFound("Announcement channel not found");
    }

    const announcements = await getChannelMessages(
      Array.isArray(communityId) ? communityId[0] : communityId,
      announcementChannel._id.toString(),
      50,
    );

    res.json({
      success: true,
      data: { announcements: announcements.reverse() },
    });
  },
);

// Helper function (imported from service for consistency)
import { getCommunityById } from "../../services/community.service.js";
