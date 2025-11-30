import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RoutesIndex from "./router/RoutesIndex";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoutesIndex />
    </BrowserRouter>
  </React.StrictMode>
);
