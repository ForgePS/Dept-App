import React from "react";
import { createRoot } from "react-dom/client";
import HydrantTestingPage from "./pages/HydrantTestingPage.jsx";
import "leaflet/dist/leaflet.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HydrantTestingPage />
  </React.StrictMode>
);
