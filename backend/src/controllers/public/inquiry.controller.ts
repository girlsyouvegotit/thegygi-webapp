import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { createGetInvolvedInquiry } from "../../services/inquiry.service.js";

/**
 * Public Get Involved inquiry
 * @route POST /api/public/inquiries
 */
export const createPublicInquiry = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, interest } = req.body as {
      name: string;
      email: string;
      interest:
        | "Volunteer"
        | "Donate"
        | "Partner with Us"
        | "Become a Mentor";
    };

    await createGetInvolvedInquiry({ name, email, interest });

    res.status(201).json({
      success: true,
      message: "Thanks — our team will be in touch soon.",
    });
  },
);
