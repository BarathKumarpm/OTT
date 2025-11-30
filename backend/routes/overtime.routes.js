import express from "express";
import {
  getWorkerMonthlySummary,
  recalculateMonthSummaries,
  getAllWorkersSummaries
} from "../controllers/overtime.controller.js";

const router = express.Router();

// All workers summaries using query params
router.get("/all", getAllWorkersSummaries);

// Single worker summary
router.get("/:workerId/:month/:year", getWorkerMonthlySummary);

// Recalculate summaries
router.post("/recalculate/:month/:year", recalculateMonthSummaries);

export default router;
