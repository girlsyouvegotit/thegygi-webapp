import type { Response } from "express";
import {
  getCommunityByCategory,
  getCommunityById,
  getCommunityMembers as getCommunityMembersService,
  isCommunityMember,
  prepareCommunityForUser,
} from "../../services/community.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

/**
 * Get community by category
 * @route GET /api/communities/category/:categoryId
 */
export const getCommunity = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    const community = await getCommunityByCategory(categoryId as string);

    if (!community) {
      throw notFound("Community not found");
    }

    const userId = req.user!._id.toString();
    const isMember = await isCommunityMember(
      community._id.toString(),
      userId,
    );

    if (!isMember && req.user!.role !== "admin" && req.user!.role !== "super_admin") {
      throw forbidden("Not a member of this community");
    }

    const prepared = await prepareCommunityForUser(
      community,
      userId,
      req.user!.role,
    );

    res.json({
      success: true,
      data: { community: prepared },
    });
  },
);

/**
 * Get community by ID
 * @route GET /api/communities/:communityId
 */
export const getCommunityByIdHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { communityId } = req.params;

    const community = await getCommunityById(communityId as string);

    if (!community) {
      throw notFound("Community not found");
    }

    const userId = req.user!._id.toString();
    const isMember = await isCommunityMember(String(communityId), userId);

    if (!isMember && req.user!.role !== "admin" && req.user!.role !== "super_admin") {
      throw forbidden("Not a member of this community");
    }

    const prepared = await prepareCommunityForUser(
      community,
      userId,
      req.user!.role,
    );

    res.json({
      success: true,
      data: { community: prepared },
    });
  },
);

/**
 * Get community members
 * @route GET /api/communities/:communityId/members
 */
export const getCommunityMembers = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { communityId } = req.params;

    const community = await getCommunityById(communityId as string);

    if (!community) {
      throw notFound("Community not found");
    }

    const members = await getCommunityMembersService(communityId as string);

    res.json({
      success: true,
      data: { members },
    });
  },
);
