import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../styles/profile.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({
    name: '',
    role: '',
    gender: '',
    phone: '',
    age: '',
    identity: '',
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const identity = localStorage.getItem("identity");

    if (!role || !identity) {
      alert("Unauthorized. Please log in.");
      navigate("/");
      return;
    }

    if (role === "child") {
      setUserDetails({
        name: localStorage.getItem("name") ,
        role: "Children",
        identity,
        gender: localStorage.getItem("gender") ,
        phone: "-",
        age: localStorage.getItem("age")
      });
    } else {
      setUserDetails({
        name: localStorage.getItem("name"),
        role: "Parent",
        identity: localStorage.getItem("phone") || identity,
        gender: localStorage.getItem("gender") ,
        phone: localStorage.getItem("phone") ,
        age: localStorage.getItem("age")
      });
    }
  }, [navigate]);

  return (
    <div className="profile-wrapper">
      <nav className="navbar">
        <ul className="nav-links">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/chat">Chat</Link></li>
          <li><Link to="/request">Friend Request</Link></li>
          <li><Link to="/analysis">Analysis</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </nav>

      <main className="profile-container">
        <h2>My Profile</h2>
        <section className="profile-box">
          <p><strong>Name:</strong> {userDetails.name}</p>
          <p><strong>Role:</strong> {userDetails.role}</p>
          <p>
            <strong>{userDetails.role === 'Parent' ? 'Phone' : 'Random ID'}:</strong> {userDetails.identity}
          </p>
          <p><strong>Gender:</strong> {userDetails.gender}</p>
          <p><strong>Age:</strong> {userDetails.age}</p>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;