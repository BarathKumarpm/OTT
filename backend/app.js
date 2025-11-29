import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import userRoutes from "./routes/user.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import workLogRoutes from "./routes/worklog.routes.js";
import overtimeRoutes from "./routes/overtime.routes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "overtimeDB" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo connection error", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/worklogs", workLogRoutes);
app.use("/api/overtime", overtimeRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} ✔`));
