import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/signup.css"; // reuse signup styles

const ParentLogin = () => {
  const [credentials, setCredentials] = useState({
    name: '',
    phone: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        'https://s75-abishek-captone-project-heart-dinq.onrender.com/parent/login',
        credentials
      );

      // Save all needed info for profile
      localStorage.setItem('identity', credentials.name);
      localStorage.setItem('userRole', 'parent');
      localStorage.setItem('name', credentials.name);
      localStorage.setItem('phone', credentials.phone);
      localStorage.setItem('gender', '-'); // Replace with actual value if backend sends it
      localStorage.setItem('age', '-');    // Replace with actual value if backend sends it

      console.log('Login successful:', response.data);
      alert('Login successful!');
      navigate('/home');
    } catch (error) {
      if (error.response) {
        alert(`Login failed: ${error.response.data.message}`);
      } else {
        alert('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Parent Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={credentials.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Enter your phone number"
            value={credentials.phone}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default ParentLogin;
