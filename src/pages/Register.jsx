import { useState } from "react";
import apiClient from "../../utils/axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/register.css";
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    password: "",
    confirm_password: "",
    pin: "",
    id_document: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // 🔹 File input validation for images only
  const handleChange = (e) => {
    const { name, files, value } = e.target;

    if (name === "id_document") {
      const file = files[0];
      if (!file) return;

      // Only allow image files
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed (png, jpg, jpeg)");
        return;
      }

      setForm(prev => ({ ...prev, id_document: file }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const togglePinVisibility = () => setShowPin(!showPin);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.pin.length !== 4) {
      return alert("PIN must be 4 digits");
    }

    const data = new FormData();
    Object.keys(form).forEach(key => data.append(key, form[key]));

    try {
      await apiClient.post("/api/register", data);
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Create Your Account</h2>

      <form className="register-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="Mobile Number"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <div className="password-input-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="button" className="password-toggle-btn" onClick={togglePasswordVisibility}>
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        <div className="password-input-container">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirm_password"
            placeholder="Confirm Password"
            value={form.confirm_password}
            onChange={handleChange}
            required
          />
          <button type="button" className="password-toggle-btn" onClick={toggleConfirmPasswordVisibility}>
            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        <div className="password-input-container">
          <input
            type={showPin ? "text" : "password"}
            name="pin"
            placeholder="4 Digit PIN"
            value={form.pin}
            maxLength="4"
            onChange={handleChange}
            required
          />
          <button type="button" className="password-toggle-btn" onClick={togglePinVisibility}>
            {showPin ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        <div className="file-input">
          <label>Upload Valid ID (PNG, JPG, JPEG)</label>
          <input
            type="file"
            name="id_document"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Register
        </button>

        <p className="switch-text">
          Already have an account? <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
}

export default Register;
