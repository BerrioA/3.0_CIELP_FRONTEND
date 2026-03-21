import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AppProviders from "./app/providers/AppProviders";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppProviders>
      <App />
    </AppProviders>
  </BrowserRouter>,
);
