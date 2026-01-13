import { Routes, Route, useLocation } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import "./App.css";

function App() {
  const location = useLocation();

  // Auth pages (centered)
  const isAuthPage =
  location.pathname === "/" ||
  location.pathname === "/login" ||
  location.pathname === "/register";

  // Dashboard pages (hide main header on mobile)
  const isDashboardPage = 
    location.pathname === "/dashboard" || location.pathname === "/admin/dashboard";

  return (
    <div className={`app-container ${isAuthPage ? "center-form" : ""}`}>
      <header className={`app-header ${isDashboardPage ? "dashboard-header" : ""}`}>
        <div className="logo">💸 Breetta </div>
        <p className="welcome-text">Welcome to Breetta Transaction App</p>
      </header>

      <main className="app-main">
        <Routes>
        <Route path="/" element={<Login />} /> 
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
