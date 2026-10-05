import express from "express";
import { getAcademicYears } from "../controllers/academic-year.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/", getAcademicYears);

export default router;
