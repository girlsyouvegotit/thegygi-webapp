import express from "express";
import {
  createFee,
  getFees,
  updateFee,
  deleteFee,
} from "../controllers/finance/fee.controller.js";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/finance/ expense.controller.js";
import {
  createSalary,
  getSalaries,
  updateSalary,
  deleteSalary,
} from "../controllers/finance/ salary.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();
router.use(protect, adminOnly);

router.post("/fees", createFee);
router.get("/fees", getFees);
router.put("/fees/:id", updateFee);
router.delete("/fees/:id", deleteFee);

router.post("/expenses", createExpense);
router.get("/expenses", getExpenses);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

router.post("/salaries", createSalary);
router.get("/salaries", getSalaries);
router.put("/salaries/:id", updateSalary);
router.delete("/salaries/:id", deleteSalary);

export default router;