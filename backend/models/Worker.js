import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },

    department: {
      type: String,
      default: "General",
    },

    role: {
      type: String,
      default: "worker",
    },

    baseHoursPerDay: {
      type: Number,
      default: 8,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Worker", workerSchema);
