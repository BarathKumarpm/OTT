import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    hoursWorked: {
      type: Number,
      required: true,
    },

    overtimeHours: {
      type: Number,
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

workLogSchema.index({ workerId: 1, date: 1 }, { unique: true });

export default mongoose.model("WorkLog", workLogSchema);
