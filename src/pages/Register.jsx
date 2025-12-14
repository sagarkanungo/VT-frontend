import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/register.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    password: "",
    confirm_password: "",
    id_document: null,
  });

  const handleChange = (e) => {
    if (e.target.name === "id_document") {
      setForm({ ...form, id_document: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(form).forEach((key) => data.append(key, form[key]));

    try {
      await axios.post("http://localhost:5000/api/register", data);

      // ✅ redirect after success
      navigate("/login");

      setForm({
        full_name: "",
        phone: "",
        password: "",
        confirm_password: "",
        id_document: null,
      });
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

        <input
          type="password"
          name="password"
          placeholder="Create Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm Password"
          value={form.confirm_password}
          onChange={handleChange}
          required
        />

        <div className="file-input">
          <label>Upload Valid ID</label>
          <input type="file" name="id_document" onChange={handleChange} />
        </div>

        <button type="submit" className="btn-primary">
          Register
        </button>

        <p className="switch-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
}

export default Register;
