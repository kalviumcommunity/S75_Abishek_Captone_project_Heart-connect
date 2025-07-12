import React, { useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "../styles/signup.css";

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    role: '',
    gender: '',
    password: ''
  });

  const [isLogin, setIsLogin] = useState(false); 
  const [loginRole, setLoginRole] = useState(""); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.role === "Children") {
      navigate("/children-page", { state: { ...formData } });
    } else {
      try {
        const response = await axios.post(
          'https://s75-abishek-captone-project-heart-dinq.onrender.com/parent/signup',
          formData
        );

        alert('User registered successfully');

        // ✅ Save parent data
        localStorage.setItem("identity", formData.phone);
        localStorage.setItem("userRole", "parent");
        localStorage.setItem("name", formData.name);
        localStorage.setItem("phone", formData.phone);
        localStorage.setItem("gender", formData.gender);
        localStorage.setItem("age", formData.age);

        navigate("/home");
      } catch (error) {
        if (error.response) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert('Signup failed');
        }
      }
    }
  };

  const handleLoginRoleChange = (e) => setLoginRole(e.target.value);

  const handleLoginSubmit = () => {
    if (loginRole === "Children") {
      navigate('/children-login');
    } else if (loginRole === "Parent") {
      navigate('/parent-login');
    } else {
      alert("Please select a role for login.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Create a new account</h2>

        {!isLogin ? (
          <form onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Enter Your Name" value={formData.name} onChange={handleChange} required />
            <input type="number" name="age" placeholder="Enter Your Age" value={formData.age} onChange={handleChange} required />
            <input type="text" name="phone" placeholder="Enter Your Phone Number" value={formData.phone} onChange={handleChange} required />

            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="" disabled hidden>Enter your Role</option>
              <option value="Children">Children</option>
              <option value="Parent">Parent</option>
            </select>

            {formData.role === "Parent" && (
              <input type="password" name="password" placeholder="Enter a Password" value={formData.password} onChange={handleChange} required />
            )}

            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="" disabled hidden>Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <button type="submit">Sign Up</button>
          </form>
        ) : (
          <div className="login-role-form">
            <h3>Login</h3>
            <select value={loginRole} onChange={handleLoginRoleChange} required>
              <option value="" disabled hidden>Select Your Role</option>
              <option value="Children">Children</option>
              <option value="Parent">Parent</option>
            </select>
            <button onClick={handleLoginSubmit}>Login</button>
          </div>
        )}

        <div className="login-link">
          {!isLogin ? (
            <span>
              Already have an account? <a onClick={() => setIsLogin(true)} style={{ color: 'lightblue', cursor: 'pointer' }}>Login</a>
            </span>
          ) : (
            <span>
              Don't have an account? <a onClick={() => setIsLogin(false)} style={{ color: 'lightblue', cursor: 'pointer' }}>Sign Up</a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
