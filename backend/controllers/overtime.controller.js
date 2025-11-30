// backend/controllers/overtime.controller.js
import mongoose from "mongoose";
import Worker from "../models/Worker.js";
import OvertimeSummary from "../models/OvertimeSummary.js";

const PAID_LIMIT_MINUTES = 72 * 60; // 4320 mins

// ---------------------------------------
// GET summary for a single worker (month)
// ---------------------------------------
export const getWorkerMonthlySummary = async (req, res) => {
  try {
    const { workerId, month, year } = req.params;

    const summary = await OvertimeSummary.findOne({
      workerId: new mongoose.Types.ObjectId(workerId),
      month: parseInt(month),
      year: parseInt(year)
    }).lean();

    if (!summary) {
      return res.json({
        workerId,
        month,
        year,
        totalOvertimeMinutes: 0,
        totalPaidMinutes: 0,
        totalUnpaidMinutes: 0,
        remainingPaidMinutes: PAID_LIMIT_MINUTES
      });
    }

    return res.json({
      ...summary,
      remainingPaidMinutes: Math.max(PAID_LIMIT_MINUTES - summary.totalPaidMinutes, 0)
    });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching summary", error: err.message });
  }
};

// -----------------------------------------------------------
// RECALCULATE summaries for all workers for a given month/year
// -----------------------------------------------------------
export const recalculateMonthSummaries = async (req, res) => {
  try {
    const { month, year } = req.params;

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    const summaries = await OvertimeSummary.find({
      month: monthNum,
      year: yearNum
    }).lean();

    return res.json({
      message: "Monthly summaries fetched",
      month: monthNum,
      year: yearNum,
      summaries
    });

  } catch (err) {
    return res.status(500).json({ message: "Error recalculating summaries", error: err.message });
  }
};

// -----------------------------------------------------------
// ✅ Missing export — All workers monthly summaries
// -----------------------------------------------------------
export const getAllWorkersSummaries = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "month and year are required" });
    }

    const summaries = await OvertimeSummary.find({
      month: parseInt(month),
      year: parseInt(year)
    }).populate("workerId", "name employeeId department").lean();

    return res.json({
      month: parseInt(month),
      year: parseInt(year),
      summaries
    });

  } catch (err) {
    return res.status(500).json({ message: "Error fetching all worker summaries", error: err.message });
  }
};
