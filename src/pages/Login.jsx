import { useState } from 'react';
import apiClient from '../../utils/axios';
import '../assets/css/login.css';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/auth';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Login() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
   const user = getUserFromToken();
  ('user',user)


  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // const handleSubmit = async e => {
  //   e.preventDefault();
  //   try {
  //     const res = await apiClient.post('/api/login', form);
  //     localStorage.setItem('token', res.data.token);
  //    if(user.role === 'admin'){
  //      navigate('/admin/dashboard')
  //    }else{
  //     navigate('/dashboard')
  //    }
  //   } catch (err) {
  //     alert(err.response?.data?.error || 'Login failed');
  //   }
  // };


  const handleSubmit = async e => {
  e.preventDefault();
  try {
    const res = await apiClient.post('/api/login', form);

    // Save token
    localStorage.setItem('token', res.data.token);

    // Use user from API response
    const user = res.data.user;

    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }

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

          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
           <p className="switch-text">
          Don`t have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
