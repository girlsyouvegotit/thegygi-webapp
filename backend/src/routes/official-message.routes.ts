import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";
import {
  getThread,
  listThreads,
  postReply,
  resolveThread,
} from "../controllers/official-message.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", listThreads);
router.get("/resolve", resolveThread);
router.get("/:id", getThread);
router.post(
  "/:id/replies",
  validateBody(
    z.object({
      message: z.string().min(1).max(2000),
    }),
  ),
  postReply,
);

export default router;
