// backend/controllers/worker.controller.js
import Worker from "../models/Worker.js";
import OvertimeSummary from "../models/OvertimeSummary.js";
import mongoose from "mongoose";

export const createWorker = async (req, res) => {
  try {
    const { name, employeeId, department, role } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const worker = await Worker.create({ name, employeeId, department, role });
    return res.status(201).json({ message: "Worker created", worker });
  } catch (err) {
    return res.status(500).json({ message: "Error creating worker", error: err.message });
  }
};

export const getWorkers = async (req, res) => {
  try {
    const { month, year } = req.query;
    const workers = await Worker.find().sort({ name: 1 }).lean();

    if (month && year) {
      const summaries = await OvertimeSummary.find({
        month: parseInt(month, 10),
        year: parseInt(year, 10),
      }).lean();

      const map = new Map(summaries.map(s => [String(s.workerId), s]));
      const PAID_MIN = 72 * 60;

      const enriched = workers.map(w => {
        const s = map.get(String(w._id));
        const totalPaid = s ? s.totalPaidMinutes : 0;

        return {
          ...w,
          usedMinutes: totalPaid,
          usedHours: +(totalPaid / 60).toFixed(2),
          remainingMinutes: Math.max(PAID_MIN - totalPaid, 0),
          remainingHours: +(Math.max(PAID_MIN - totalPaid, 0) / 60).toFixed(2),
        };
      });

      return res.json({ workers: enriched });
    }

    return res.json({ workers });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching workers", error: err.message });
  }
};

export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    return res.json(worker);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching worker", error: err.message });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(worker);
  } catch (err) {
    return res.status(500).json({ message: "Error updating worker", error: err.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    return res.json({ message: "Worker deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Error deleting worker", error: err.message });
  }
};
