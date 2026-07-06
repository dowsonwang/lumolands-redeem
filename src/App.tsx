import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RedeemPage from "@/pages/RedeemPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedeemPage />} />
      </Routes>
    </Router>
  );
}
