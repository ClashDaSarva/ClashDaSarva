import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Legal from "./pages/Legal";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/legal/:kind" element={<Legal />} />
      <Route path="*" element={<Legal />} />
    </Routes>
  );
}
