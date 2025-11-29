import WorkLog from "../models/WorkLog.js";
import Worker from "../models/Worker.js";

export const addWorkLog = async (req, res) => {
  try {
    const { workerId, date, hoursWorked } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const overtimeHours = Math.max(0, hoursWorked - worker.baseHoursPerDay);

    const logDate = new Date(date);
    const month = logDate.getMonth() + 1;
    const year = logDate.getFullYear();

    const newLog = await WorkLog.create({
      workerId,
      date: logDate,
      hoursWorked,
      overtimeHours,
      month,
      year,
    });

    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ message: "Error adding log", error: err.message });
  }
};

export const getWorkLogsByWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    const logs = await WorkLog.find({ workerId }).sort({ date: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching logs", error: err.message });
  }
};

export const deleteWorkLog = async (req, res) => {
  try {
    await WorkLog.findByIdAndDelete(req.params.logId);
    res.json({ message: "Log deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting log", error: err.message });
  }
};
