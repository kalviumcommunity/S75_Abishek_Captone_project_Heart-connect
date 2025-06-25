import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/signup.css"; 

const ChildrenLogin = () => {
  const [credentials, setCredentials] = useState({ randomId: '', childPassword: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('https://s75-abishek-captone-project-heart-dinq.onrender.com/child/login', credentials);
      localStorage.setItem('identity', credentials.randomId);
      localStorage.setItem('userRole', 'child');
      console.log('Login successful:', response.data);
      alert('Child login successful!');
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
        <h2>Child Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="randomId"
            placeholder="Enter your Random ID"
            value={credentials.randomId}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="childPassword"
            placeholder="Enter your Password"
            value={credentials.childPassword}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default ChildrenLogin;
