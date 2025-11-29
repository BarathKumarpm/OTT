import express from "express";
import {
  createWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker
} from "../controllers/worker.controller.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// POST create worker
router.post("/", authMiddleware, createWorker);

// GET all workers
router.get("/", authMiddleware, getWorkers);

// GET one worker
router.get("/:id", authMiddleware, getWorkerById);

// PUT update worker
router.put("/:id", authMiddleware, updateWorker);

// DELETE worker
router.delete("/:id", authMiddleware, deleteWorker);

export default router;
