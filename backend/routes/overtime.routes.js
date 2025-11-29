import express from "express";
import {
  calculateMonthlyOvertime,
  getWorkerMonthlyOvertime,
  getAllWorkersOvertime
} from "../controllers/overtime.controller.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// POST trigger monthly overtime calculation
router.post("/calculate", authMiddleware, calculateMonthlyOvertime);

// GET overtime summary for 1 worker
router.get("/:workerId/:month/:year", authMiddleware, getWorkerMonthlyOvertime);

// GET all workers summary for a month
router.get("/all/:month/:year", authMiddleware, getAllWorkersOvertime);

export default router;
