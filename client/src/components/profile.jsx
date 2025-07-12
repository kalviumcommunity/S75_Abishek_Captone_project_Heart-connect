import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        name: localStorage.getItem("name") || "Anonymous",
        role: "Children",
        identity: identity,
        gender: localStorage.getItem("gender") || "-",
        phone: "-",
        age: "-"
      });
    } else {
      // For parent
      setUserDetails({
        name: localStorage.getItem("name") || "-",
        role: "Parent",
        identity: localStorage.getItem("phone") || identity,
        gender: localStorage.getItem("gender") || "-",
        phone: localStorage.getItem("phone") || "-",
        age: localStorage.getItem("age") || "-"
      });
    }
  }, [navigate]);

  return (
    <div className="profile-container">
      <h2>👤 My Profile</h2>
      <div className="profile-box">
        <p><strong>Name:</strong> {userDetails.name}</p>
        <p><strong>Role:</strong> {userDetails.role}</p>
        <p><strong>Random ID / Phone:</strong> {userDetails.identity}</p>
        <p><strong>Gender:</strong> {userDetails.gender}</p>
        <p><strong>Age:</strong> {userDetails.age}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
