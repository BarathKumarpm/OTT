import WorkLog from "../models/WorkLog.js";
import OvertimeSummary from "../models/OvertimeSummary.js";

const PAID_OT_LIMIT = 72;

export const calculateMonthlyOvertime = async (req, res) => {
  try {
    const { month, year } = req.body;

    const logs = await WorkLog.aggregate([
      { $match: { month, year } },
      {
        $group: {
          _id: "$workerId",
          totalOvertime: { $sum: "$overtimeHours" },
        },
      },
    ]);

    for (const item of logs) {
      const total = item.totalOvertime;
      const payable = Math.min(total, PAID_OT_LIMIT);
      const unpaid = Math.max(0, total - PAID_OT_LIMIT);

      await OvertimeSummary.findOneAndUpdate(
        { workerId: item._id, month, year },
        {
          workerId: item._id,
          month,
          year,
          totalOvertime: total,
          payableOvertime: payable,
          unpaidOvertime: unpaid,
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Overtime calculated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error calculating overtime", error: err.message });
  }
};

export const getWorkerMonthlyOvertime = async (req, res) => {
  try {
    const { workerId, month, year } = req.params;

    const summary = await OvertimeSummary.findOne({
      workerId,
      month,
      year,
    });

    if (!summary)
      return res.status(404).json({ message: "No summary found" });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Error fetching summary", error: err.message });
  }
};

export const getAllWorkersOvertime = async (req, res) => {
  try {
    const { month, year } = req.params;

    const summaries = await OvertimeSummary.find({ month, year }).populate("workerId");

    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: "Error fetching summaries", error: err.message });
  }
};
