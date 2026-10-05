import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";
import { storageService } from "../services/storage.service.js";
import {
  asyncHandler,
  notFound,
  badRequest,
} from "../middleware/error.middleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/download/*filePath",
  adminOnly,
  asyncHandler(async (req, res) => {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;

    if (!filePath) throw badRequest("File path is required");

    const exists = await storageService.fileExists(filePath);
    if (!exists) throw notFound("File not found");

    const stream = storageService.createReadStream(filePath);
    res.setHeader("Content-Type", "application/octet-stream");
    stream.pipe(res);
  }),
);

export default router;
