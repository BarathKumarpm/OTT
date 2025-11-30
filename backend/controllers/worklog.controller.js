// backend/controllers/worklog.controller.js
import mongoose from "mongoose";
import Worker from "../models/Worker.js";
import WorkLog from "../models/WorkLog.js";
import OvertimeSummary from "../models/OvertimeSummary.js";

const PAID_OT_LIMIT_MINUTES = 72 * 60; // 4320 minutes (72 hours max paid OT per month)
const DEFAULT_BASE_HOURS = 8; // Default base working hours per day

/**
 * Parse date + time string into a Date object
 * @param {string|Date} dateDay - The date portion
 * @param {string} timeStr - Time in "HH:mm" or ISO format
 * @returns {Date|null}
 */
function parseDateTime(dateDay, timeStr) {
  if (!timeStr) return null;

  const base = dateDay instanceof Date
    ? dateDay.toISOString().slice(0, 10)
    : dateDay;

  // If already ISO format, parse directly
  if (timeStr.includes("T")) return new Date(timeStr);

  // Convert "HH:mm" to "HH:mm:ss"
  const full = timeStr.length === 5 ? timeStr + ":00" : timeStr;
  return new Date(`${base}T${full}`);
}

/**
 * Add a new work log entry
 * POST /api/worklogs
 */
export const addWorkLog = async (req, res) => {
  try {
    const { workerId, date, otStart, otEnd, deductLunch = true, notes = "" } = req.body;

    // Validate required fields
    if (!workerId || !date || !otStart || !otEnd) {
      return res.status(400).json({ 
        message: "workerId, date, otStart and otEnd are required" 
      });
    }

    // Find the worker
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Parse start and end times
    const start = parseDateTime(date, otStart);
    let end = parseDateTime(date, otEnd);
    
    if (!start || !end) {
      return res.status(400).json({ message: "Invalid start or end time" });
    }

    // Handle overnight shifts (end time is before start time)
    if (end <= start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    // Calculate total worked minutes
    let totalWorkedMinutes = Math.round((end - start) / 60000);

    // Deduct lunch break if enabled (1 hour = 60 minutes)
    if (deductLunch) {
      totalWorkedMinutes = Math.max(totalWorkedMinutes - 60, 0);
    }

    // Get worker's base hours per day (default to 8 hours if not set)
    const baseHoursPerDay = worker.baseHoursPerDay || DEFAULT_BASE_HOURS;
    const baseMinutes = baseHoursPerDay * 60;

    // Calculate actual overtime (only hours beyond base hours count as OT)
    const overtimeMinutes = Math.max(totalWorkedMinutes - baseMinutes, 0);

    // If no overtime, reject the entry
    if (overtimeMinutes <= 0) {
      const workedHours = Math.floor(totalWorkedMinutes / 60);
      const workedMins = totalWorkedMinutes % 60;
      
      return res.status(400).json({
        message: `No overtime to record. Worker worked ${workedHours}h ${workedMins}m, which is within the ${baseHoursPerDay}h base hours.`,
        totalWorkedMinutes,
        baseHoursPerDay,
        overtimeMinutes: 0
      });
    }

    // Get month and year for summary tracking
    const month = start.getMonth() + 1; // 1-12
    const year = start.getFullYear();
    
    // Store date as midnight for consistent querying
    const midnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    // Get existing overtime summary to calculate paid vs unpaid split
    const summary = await OvertimeSummary.findOne({ workerId, month, year });
    const alreadyPaidMinutes = summary ? summary.totalPaidMinutes : 0;
    const remainingPaidMinutes = Math.max(PAID_OT_LIMIT_MINUTES - alreadyPaidMinutes, 0);

    // Split overtime into paid and unpaid based on 72h monthly limit
    const paidMinutes = Math.min(overtimeMinutes, remainingPaidMinutes);
    const unpaidMinutes = overtimeMinutes - paidMinutes;

    // Create the work log entry
    const newLog = await WorkLog.create({
      workerId,
      date: midnight,
      otStart,
      otEnd,
      totalWorkedMinutes,           // Total hours worked (for reference)
      baseMinutesDeducted: baseMinutes, // Base hours deducted (for reference)
      durationMinutes: overtimeMinutes, // Actual OT minutes (after base deduction)
      paidMinutes,
      unpaidMinutes,
      month,
      year,
      notes: notes.trim(),
    });

    // Update or create the monthly overtime summary
    await OvertimeSummary.findOneAndUpdate(
      { workerId, month, year },
      {
        $inc: {
          totalOvertimeMinutes: overtimeMinutes,
          totalPaidMinutes: paidMinutes,
          totalUnpaidMinutes: unpaidMinutes,
        },
        $setOnInsert: {
          workerId,
          month,
          year,
        }
      },
      { upsert: true, new: true }
    );

    // Return success response with breakdown
    return res.status(201).json({
      message: "Overtime recorded successfully",
      log: newLog,
      breakdown: {
        totalWorkedMinutes,
        lunchDeducted: deductLunch ? 60 : 0,
        baseHoursDeducted: baseHoursPerDay,
        baseMinutesDeducted: baseMinutes,
      },
      overtimeMinutes,
      paidMinutes,
      unpaidMinutes,
      remainingPaidMinutesAfter: Math.max(remainingPaidMinutes - paidMinutes, 0),
    });

  } catch (err) {
    // Handle duplicate entry error
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "Duplicate worklog entry for this worker/date/time combination" 
      });
    }

    console.error("Error adding worklog:", err);
    return res.status(500).json({ 
      message: "Error adding worklog", 
      error: err.message 
    });
  }
};

/**
 * Get all work logs for a specific worker
 * GET /api/worklogs/:workerId
 * Query params: month, year (optional filters)
 */
export const getWorkLogsByWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { month, year } = req.query;

    // Validate workerId
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ message: "Invalid worker ID" });
    }

    // Build query
    const query = { workerId };
    
    // Add month/year filters if provided
    if (month && year) {
      query.month = parseInt(month, 10);
      query.year = parseInt(year, 10);
    } else if (month || year) {
      // If only one is provided, require both
      return res.status(400).json({ 
        message: "Both month and year are required for filtering" 
      });
    }

    // Fetch logs sorted by date descending
    const logs = await WorkLog.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Calculate totals for the response
    const totals = logs.reduce((acc, log) => {
      acc.totalOvertimeMinutes += log.durationMinutes || 0;
      acc.totalPaidMinutes += log.paidMinutes || 0;
      acc.totalUnpaidMinutes += log.unpaidMinutes || 0;
      return acc;
    }, { totalOvertimeMinutes: 0, totalPaidMinutes: 0, totalUnpaidMinutes: 0 });

    return res.json({ 
      logs,
      count: logs.length,
      totals
    });

  } catch (err) {
    console.error("Error fetching work logs:", err);
    return res.status(500).json({ 
      message: "Error fetching logs", 
      error: err.message 
    });
  }
};

/**
 * Get all work logs (admin view)
 * GET /api/worklogs
 * Query params: month, year, department (optional filters)
 */
export const getAllWorkLogs = async (req, res) => {
  try {
    const { month, year, department } = req.query;

    // Build query
    const query = {};
    
    if (month && year) {
      query.month = parseInt(month, 10);
      query.year = parseInt(year, 10);
    }

    // Fetch logs with worker details
    let logs = await WorkLog.find(query)
      .populate('workerId', 'name employeeId department role baseHoursPerDay')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Filter by department if provided
    if (department) {
      logs = logs.filter(log => 
        log.workerId && log.workerId.department === department
      );
    }

    return res.json({ 
      logs,
      count: logs.length
    });

  } catch (err) {
    console.error("Error fetching all work logs:", err);
    return res.status(500).json({ 
      message: "Error fetching logs", 
      error: err.message 
    });
  }
};

/**
 * Update an existing work log
 * PUT /api/worklogs/:logId
 */
export const updateWorkLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { otStart, otEnd, deductLunch, notes } = req.body;

    // Find existing log
    const existingLog = await WorkLog.findById(logId);
    if (!existingLog) {
      return res.status(404).json({ message: "Log not found" });
    }

    // Get worker for base hours
    const worker = await Worker.findById(existingLog.workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Use existing values if not provided
    const newOtStart = otStart || existingLog.otStart;
    const newOtEnd = otEnd || existingLog.otEnd;
    const newDeductLunch = deductLunch !== undefined ? deductLunch : true;

    // Recalculate times
    const dateStr = existingLog.date.toISOString().slice(0, 10);
    const start = parseDateTime(dateStr, newOtStart);
    let end = parseDateTime(dateStr, newOtEnd);

    if (!start || !end) {
      return res.status(400).json({ message: "Invalid start or end time" });
    }

    if (end <= start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    let totalWorkedMinutes = Math.round((end - start) / 60000);
    if (newDeductLunch) {
      totalWorkedMinutes = Math.max(totalWorkedMinutes - 60, 0);
    }

    const baseHoursPerDay = worker.baseHoursPerDay || DEFAULT_BASE_HOURS;
    const baseMinutes = baseHoursPerDay * 60;
    const newOvertimeMinutes = Math.max(totalWorkedMinutes - baseMinutes, 0);

    if (newOvertimeMinutes <= 0) {
      return res.status(400).json({
        message: `No overtime to record after update. Worked hours are within base hours.`
      });
    }

    // Calculate difference for summary update
    const oldOvertimeMinutes = existingLog.durationMinutes;
    const oldPaidMinutes = existingLog.paidMinutes;
    const oldUnpaidMinutes = existingLog.unpaidMinutes;

    // Get current summary to recalculate paid/unpaid split
    const summary = await OvertimeSummary.findOne({ 
      workerId: existingLog.workerId, 
      month: existingLog.month, 
      year: existingLog.year 
    });

    const currentPaidWithoutThis = (summary?.totalPaidMinutes || 0) - oldPaidMinutes;
    const remainingPaid = Math.max(PAID_OT_LIMIT_MINUTES - currentPaidWithoutThis, 0);

    const newPaidMinutes = Math.min(newOvertimeMinutes, remainingPaid);
    const newUnpaidMinutes = newOvertimeMinutes - newPaidMinutes;

    // Update the log
    existingLog.otStart = newOtStart;
    existingLog.otEnd = newOtEnd;
    existingLog.totalWorkedMinutes = totalWorkedMinutes;
    existingLog.baseMinutesDeducted = baseMinutes;
    existingLog.durationMinutes = newOvertimeMinutes;
    existingLog.paidMinutes = newPaidMinutes;
    existingLog.unpaidMinutes = newUnpaidMinutes;
    if (notes !== undefined) existingLog.notes = notes.trim();

    await existingLog.save();

    // Update summary with differences
    await OvertimeSummary.findOneAndUpdate(
      { workerId: existingLog.workerId, month: existingLog.month, year: existingLog.year },
      {
        $inc: {
          totalOvertimeMinutes: newOvertimeMinutes - oldOvertimeMinutes,
          totalPaidMinutes: newPaidMinutes - oldPaidMinutes,
          totalUnpaidMinutes: newUnpaidMinutes - oldUnpaidMinutes,
        },
      }
    );

    return res.json({
      message: "Work log updated successfully",
      log: existingLog,
      paidMinutes: newPaidMinutes,
      unpaidMinutes: newUnpaidMinutes,
    });

  } catch (err) {
    console.error("Error updating worklog:", err);
    return res.status(500).json({ 
      message: "Error updating worklog", 
      error: err.message 
    });
  }
};

/**
 * Delete a work log entry
 * DELETE /api/worklogs/:logId
 */
export const deleteWorkLog = async (req, res) => {
  try {
    const { logId } = req.params;

    // Validate logId
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "Invalid log ID" });
    }

    // Find the log
    const log = await WorkLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    // Update the overtime summary (decrement values)
    await OvertimeSummary.findOneAndUpdate(
      { workerId: log.workerId, month: log.month, year: log.year },
      {
        $inc: {
          totalOvertimeMinutes: -log.durationMinutes,
          totalPaidMinutes: -log.paidMinutes,
          totalUnpaidMinutes: -log.unpaidMinutes,
        },
      }
    );

    // Delete the log
    await WorkLog.findByIdAndDelete(logId);

    return res.json({ 
      message: "Log deleted successfully",
      deletedLog: {
        id: log._id,
        date: log.date,
        overtimeMinutes: log.durationMinutes,
        paidMinutes: log.paidMinutes,
        unpaidMinutes: log.unpaidMinutes
      }
    });

  } catch (err) {
    console.error("Error deleting worklog:", err);
    return res.status(500).json({ 
      message: "Error deleting log", 
      error: err.message 
    });
  }
};

/**
 * Get overtime summary for a worker
 * GET /api/worklogs/summary/:workerId
 */
export const getWorkerOvertimeSummary = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { month, year } = req.query;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ message: "Invalid worker ID" });
    }

    const query = { workerId };
    if (month && year) {
      query.month = parseInt(month, 10);
      query.year = parseInt(year, 10);
    }

    const summaries = await OvertimeSummary.find(query)
      .sort({ year: -1, month: -1 })
      .lean();

    // Calculate remaining paid OT for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentSummary = summaries.find(
      s => s.month === currentMonth && s.year === currentYear
    );

    const remainingPaidMinutes = PAID_OT_LIMIT_MINUTES - (currentSummary?.totalPaidMinutes || 0);

    return res.json({
      summaries,
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        totalPaidMinutes: currentSummary?.totalPaidMinutes || 0,
        totalUnpaidMinutes: currentSummary?.totalUnpaidMinutes || 0,
        remainingPaidMinutes: Math.max(remainingPaidMinutes, 0),
        remainingPaidHours: Math.max(remainingPaidMinutes / 60, 0).toFixed(2)
      }
    });

  } catch (err) {
    console.error("Error fetching overtime summary:", err);
    return res.status(500).json({ 
      message: "Error fetching summary", 
      error: err.message 
    });
  }
};
