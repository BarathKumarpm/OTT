// backend/controllers/user.controller.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { username, password, role = "admin" } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username and password required" });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, role });

    return res.status(201).json({ message: "User registered successfully", user: { id: user._id, username: user.username } });
  } catch (err) {
    return res.status(500).json({ message: "Register error", error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username and password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.json({ message: "Login successful", token, user: { id: user._id, username: user.username } });
  } catch (err) {
    return res.status(500).json({ message: "Login error", error: err.message });
  }
};
