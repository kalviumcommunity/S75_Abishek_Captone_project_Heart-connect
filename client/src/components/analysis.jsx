import React, { useState } from 'react';
import Select from 'react-select';
import '../styles/analysis.css'; // Make sure this has updated styles

const psychologyCourses = [
  "B.A. in Psychology",
  "B.Sc. in Psychology",
  "M.A. in Psychology",
  "M.Sc. in Psychology",
  "M.Phil in Clinical Psychology",
  "M.Phil in Psychiatric Social Work",
  "Ph.D. in Psychology",
  "Psy.D. in Clinical Psychology",
  "Diploma in Counselling Psychology",
  "Diploma in Child Psychology",
  "Diploma in Educational Psychology",
  "Post Graduate Diploma in Psychology",
  "Certificate Course in Cognitive Behavioural Therapy (CBT)",
  "Certificate in Psychotherapy",
  "Certificate in Counseling Skills",
  "B.Ed in Special Education",
  "M.Ed in Special Education",
  "M.A. in Applied Psychology",
  "M.Sc. in Cognitive Neuroscience"
];

const courseOptions = psychologyCourses.map(course => ({
  value: course,
  label: course
}));

const AnalysisPage = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    graduation: [],
    interviewDate: '',
    feedback: ''
  });

  const [entries, setEntries] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGraduationChange = (selectedOptions) => {
    setForm(prev => ({
      ...prev,
      graduation: selectedOptions || []
    }));
  };

  const handleAddFeedback = () => {
    if (
      form.name &&
      form.graduation.length > 0 &&
      form.interviewDate &&
      form.feedback.trim()
    ) {
      const newEntry = {
        ...form,
        graduation: form.graduation.map(option => option.value),
        timestamp: new Date().toISOString()
      };
      setEntries([newEntry, ...entries]);
      setForm({ name: '', graduation: [], interviewDate: '', feedback: '' });
      setFormVisible(false);
    } else {
      alert("Please fill all fields before submitting.");
    }
  };

  return (
    <div className="analysis-wrapper">
      {/* Blue Navbar */}
<nav className="analysis-navbar">
  <ul className="analysis-navbar-menu">
    <li><a href="/home"> Home</a></li>
    <li><a href="/chat"> Chat</a></li>
    <li><a href="/requests">Friend Request</a></li>
    <li><a href="/analysis" className="active">Analysis</a></li>
    <li><a href="/profile">Profile</a></li>
  </ul>
</nav>


      <div className="analysis-container">
        <h2>Psychologist Feedback</h2>

        <button className="toggle-form-btn" onClick={() => setFormVisible(!formVisible)}>
          {formVisible ? "Close Form" : "➕ Add Feedback"}
        </button>

        {formVisible && (
          <div className="analysis-form">
            <input
              type="text"
              name="name"
              placeholder="Psychologist Name"
              value={form.name}
              onChange={handleInputChange}
              required
            />

            <label><strong>Graduation (Select Multiple):</strong></label>
            <Select
              isMulti
              name="graduation"
              options={courseOptions}
              value={form.graduation}
              onChange={handleGraduationChange}
              className="multi-select"
              classNamePrefix="select"
              placeholder="Select graduation(s)"
            />

            <input
              type="date"
              name="interviewDate"
              value={form.interviewDate}
              onChange={handleInputChange}
              required
            />

            <textarea
              name="feedback"
              placeholder="Enter your feedback..."
              rows="4"
              value={form.feedback}
              onChange={handleInputChange}
              required
            ></textarea>

            <button className="submit-btn" onClick={handleAddFeedback}>
              Submit Feedback
            </button>
          </div>
        )}

        <div className="feedback-entries">
          <h3>Submitted Feedback</h3>
          {entries.length === 0 ? (
            <p>No feedback submitted yet.</p>
          ) : (
            entries.map((entry, index) => (
              <div key={index} className="feedback-entry">
                <p><strong>Name:</strong> {entry.name}</p>
                <p><strong>Graduation:</strong> {entry.graduation.join(', ')}</p>
                <p><strong>Interview Date:</strong> {entry.interviewDate}</p>
                <p><strong>Feedback:</strong> {entry.feedback}</p>
                <hr />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
