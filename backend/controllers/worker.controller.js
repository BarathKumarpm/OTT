import Worker from "../models/Worker.js";

export const createWorker = async (req, res) => {
  try {
    const worker = await Worker.create(req.body);
    res.status(201).json(worker);
  } catch (err) {
    res.status(500).json({ message: "Error creating worker", error: err.message });
  }
};

export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching workers", error: err.message });
  }
};

export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: "Error fetching worker", error: err.message });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: "Error updating worker", error: err.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: "Worker deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting worker", error: err.message });
  }
};
