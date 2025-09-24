import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import "../styles/signup.css";

const ChildrenPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [randomId, setRandomId] = useState('');
  const [password, setPassword] = useState('');

  // Destructure state passed from signup
  const { name, role, age, gender } = location.state || {};

  // Generate randomId on mount
  useEffect(() => {
    const nouns = [
      "cat", "dog", "bat", "fox", "owl", "bee", "cow", "pig", "ant", "rat",
      "hen", "yak", "ram", "ape", "emu", "eel", "cod", "car", "bus", "van",
      "toy", "cup", "jar", "hat", "map", "pen", "sun", "sky", "bed", "cap",
      "net", "mud", "log", "zip", "pod", "kit", "pan", "pot", "lid", "tap",
      "fan", "bun", "hog", "orb", "bud", "web", "rod", "cub", "bug", "den",
      "pit", "owl", "cat", "dog", "bat", "pig", "cow", "ram", "bee", "rat",
      "kit", "sun", "ape", "eel", "fox", "yak", "emu", "ear", "toe", "ant"
    ];

    const adjectives = [
      "big", "hot", "red", "fun", "fat", "mad", "sad", "bad", "dry", "wet",
      "icy", "sun", "low", "new", "old", "raw", "dim", "sky", "tan", "odd",
      "shy", "sly", "apt", "coy", "few", "fit", "zoo", "yum", "jam", "hip",
      "tip", "fab", "rad", "zen", "wow", "pop", "yay", "bum", "hug", "mum",
      "kid", "joy", "zip", "zap", "top", "fun", "big", "hot", "mad", "new",
      "raw", "icy", "wet", "fat", "sun", "tan", "low", "yum", "wow", "fab",
      "hip", "fun", "pop", "rad", "zen", "hug", "yay", "jam", "tip", "wow"
    ];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(10 + Math.random() * 90); 

    setRandomId(`${randomAdjective}${randomNoun}${randomNumber}`);
  }, []);

  const handleSignup = async () => {
    try {
      // API call to child signup route
      const response = await axios.post('https://s75-abishek-captone-project-heart-dinq.onrender.com/child/signup', {
        name,
        randomId,
        childPassword: password
      });

      // Save necessary info in localStorage for Profile
      localStorage.setItem('identity', randomId);
      localStorage.setItem('userRole', 'child');
      localStorage.setItem('name', name);
      localStorage.setItem('age', age || '-');
      localStorage.setItem('gender', gender || '-');

      alert('Signed up successfully!');
      navigate('/home');
    } catch (error) {
      if (error.response) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('An unexpected error occurred. Try again.');
      }
    }
  };

  return (
    <div className="children-landing">
      <div className="card">
        <div className="intro-text">
          📖 Your journey starts here. <br />
          Use your <span className="highlight">random ID</span> to express your feelings freely.
        </div>

        {role === "Children" && (
          <>
            <div className="form-field">
              <label>Name:</label>
              <input type="text" value={name} readOnly />
            </div>

            <div className="form-field">
              <label>Age:</label>
              <input type="text" value={age} readOnly />
            </div>

            <div className="form-field">
              <label>Gender:</label>
              <input type="text" value={gender} readOnly />
            </div>
          </>
        )}

        <div className="form-field">
          <label>Your Random ID:</label>
          <input type="text" value={randomId} readOnly />
        </div>

        <div className="form-field">
          <label>Set Your Password:</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="submit-btn" onClick={handleSignup}>
          Signup
        </button>
      </div>
    </div>
  );
};

export default ChildrenPassword;