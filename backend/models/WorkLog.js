// backend/models/WorkLog.js
import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    otStart: {
        type: String,
        required: true
    },
    otEnd: {
        type: String,
        required: true
    },
    totalWorkedMinutes: {
        type: Number,
        default: 0
    }, // Total worked (after lunch)
    baseMinutes: {
        type: Number,
        default: 480
    }, // Base hours deducted
    durationMinutes: {
        type: Number,
        required: true
    }, // Actual OT minutes
    paidMinutes: {
        type: Number,
        required: true,
        default: 0
    },
    unpaidMinutes: {
        type: Number,
        required: true,
        default: 0
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

workLogSchema.index({
    workerId: 1,
    date: 1,
    otStart: 1,
    otEnd: 1
}, {
    unique: true
});

export default mongoose.model("WorkLog", workLogSchema);