// backend/routes/worklog.routes.js
import express from "express";
import { 
  addWorkLog, 
  getWorkLogsByWorker, 
  getAllWorkLogs,
  updateWorkLog,
  deleteWorkLog,
  getWorkerOvertimeSummary
} from "../controllers/worklog.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Create new work log
router.post("/", authMiddleware, addWorkLog);

// Get all work logs (admin)
router.get("/", authMiddleware, getAllWorkLogs);

// Get overtime summary for a worker
router.get("/summary/:workerId", authMiddleware, getWorkerOvertimeSummary);

// Get work logs by worker ID
router.get("/:workerId", authMiddleware, getWorkLogsByWorker);

// Update a work log
router.put("/:logId", authMiddleware, updateWorkLog);

// Delete a work log
router.delete("/:logId", authMiddleware, deleteWorkLog);

export default router;
