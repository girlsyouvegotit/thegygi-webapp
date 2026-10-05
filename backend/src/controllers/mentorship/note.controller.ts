import type { Response } from "express";
import MentorNote from "../../models/mentor-note.model.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

/**
 * Create private note
 * @route POST /api/mentorship/notes
 */
export const createNote = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { menteeId, content, sessionId } = req.body;

    const note = await MentorNote.create({
      mentor: req.user!._id,
      mentee: menteeId,
      content,
      sessionId: sessionId || null,
      isPrivate: true,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created mentor note",
      resourceType: "mentor-note",
      resourceId: note._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Note created",
      data: { note },
    });
  },
);

/**
 * Get all notes created by the current mentor
 * @route GET /api/mentorship/notes
 */
export const getAllMyNotes = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const notes = await MentorNote.find({ mentor: req.user!._id })
      .populate("mentee", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { notes } });
  },
);

/**
 * Get notes for a specific mentee (mentor only)
 * @route GET /api/mentorship/notes/mentee/:menteeId
 */
export const getNotes = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { menteeId } = req.params;

    if (req.user!.role !== "admin" && req.user!.role !== "mentor") {
      throw forbidden("Only mentors can view notes");
    }

    const notes = await MentorNote.find({
      mentee: menteeId,
      mentor: req.user!._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: { notes } });
  },
);

/**
 * Update note
 * @route PUT /api/mentorship/notes/:id
 */
export const updateNote = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const note = await MentorNote.findById(req.params.id);
    if (!note) throw notFound("Note not found");

    if (
      req.user!.role !== "admin" &&
      note.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this note");
    }

    const updatedNote = await MentorNote.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true },
    );

    res.json({
      success: true,
      message: "Note updated",
      data: { note: updatedNote },
    });
  },
);

/**
 * Delete note
 * @route DELETE /api/mentorship/notes/:id
 */
export const deleteNote = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const note = await MentorNote.findById(req.params.id);
    if (!note) throw notFound("Note not found");

    if (
      req.user!.role !== "admin" &&
      note.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to delete this note");
    }

    await MentorNote.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Note deleted" });
  },
);
