import express from "express";
import {
  addWorkLog,
  getWorkLogsByWorker,
  deleteWorkLog
} from "../controllers/worklog.controller.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// POST add log
router.post("/", authMiddleware, addWorkLog);

// GET logs for worker
router.get("/:workerId", authMiddleware, getWorkLogsByWorker);

// DELETE log
router.delete("/:logId", authMiddleware, deleteWorkLog);

export default router;
