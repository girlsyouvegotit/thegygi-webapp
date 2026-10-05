import express from "express";
import { searchWorkspace } from "../controllers/search/search.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/", searchWorkspace);

export default router;
