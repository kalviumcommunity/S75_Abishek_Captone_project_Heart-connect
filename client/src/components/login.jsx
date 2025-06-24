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
      const response = await axios.post('http://localhost:4001/api/parent/login', credentials);
      localStorage.setItem('identity', credentials.name);
      localStorage.setItem('userRole', 'parent');
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
