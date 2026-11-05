import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontr\xF3 el elemento ra\xEDz 'root'");
}
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
