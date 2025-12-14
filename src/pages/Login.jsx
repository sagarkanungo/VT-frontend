import { useState } from 'react';
import axios from 'axios';
import '../assets/css/login.css';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const navigate = useNavigate();


  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard')
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Login to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="phone"
            placeholder="Mobile Number"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
