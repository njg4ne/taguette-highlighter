import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.querySelector("main")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

function App() {
  return (
    <>
      <h2>Main Content Title for Homepage (H2)</h2>
      <p>This is the homepage.</p>
      <button>Useless Button</button>
    </>
  );
}
