
import ReactDOM from "react-dom/client";
import 'styles/globals.css';
import App from "./App";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  // Render your React component
  root.render(<App />);
} else {
  console.error("Root element not found");
}

