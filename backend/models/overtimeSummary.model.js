import mongoose from "mongoose";

const overtimeSummarySchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
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

    totalOvertime: {
      type: Number,
      required: true,
      default: 0,
    },

    payableOvertime: {
      type: Number,
      required: true,
      default: 0,
    },

    unpaidOvertime: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

overtimeSummarySchema.index({ workerId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("OvertimeSummary", overtimeSummarySchema);
