import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import "./App.css";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">💸 VT App</div>
        <p className="welcome-text">Welcome to Virtual Transaction App</p>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
