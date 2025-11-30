import { Routes, Route } from "react-router-dom";

import Landing from "../pages/landing";
import Login from "../pages/login";
import Register from "../pages/register";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Dashboard pages
import DashboardHome from "../pages/dashboard/home";
import AddWorker from "../pages/dashboard/addWorker";
import EnterOT from "../pages/dashboard/enterOT";
import Summary from "../pages/dashboard/summary";
import Assignment from "../pages/dashboard/assignment";
import History from "../pages/dashboard/history";

export default function RoutesIndex() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* DASHBOARD ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<DashboardHome />} />
        <Route path="add-worker" element={<AddWorker />} />
        <Route path="enter-ot" element={<EnterOT />} />
        <Route path="summary" element={<Summary />} />
        <Route path="assignment" element={<Assignment />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  );
}
