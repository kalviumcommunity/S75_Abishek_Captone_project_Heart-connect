import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import '../styles/analysis.css'; 
import { analysisAPI } from '../utils/api';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing feedback entries on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await analysisAPI.getAllFeedback();
        console.log('API Response:', res.data); // Debug log
        if (res.data?.success && res.data?.data) {
          setEntries(res.data.data);
        } else if (Array.isArray(res.data)) {
          // Fallback for direct array response
          setEntries(res.data);
        } else {
          setEntries([]);
        }
      } catch (err) {
        console.error('Error loading feedback:', err);
        setError(err?.response?.data?.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const handleAddFeedback = async () => {
    if (!form.name || form.graduation.length === 0 || !form.interviewDate || !form.feedback.trim()) {
      alert('Please fill all fields before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        name: form.name,
        graduation: form.graduation.map(option => option.value),
        interviewDate: form.interviewDate,
        feedback: form.feedback,
      };
      console.log('Submitting payload:', payload); // Debug log
      const res = await analysisAPI.createFeedback(payload);
      console.log('Create response:', res.data); // Debug log
      
      if (res.data?.success && res.data?.data) {
        setEntries(prev => [res.data.data, ...prev]);
      } else if (res.data?.feedback) {
        // Fallback for old response format
        setEntries(prev => [res.data.feedback, ...prev]);
      } else {
        // Fallback: reload all
        const list = await analysisAPI.getAllFeedback();
        if (list.data?.success && list.data?.data) {
          setEntries(list.data.data);
        } else if (Array.isArray(list.data)) {
          setEntries(list.data);
        }
      }
      setForm({ name: '', graduation: [], interviewDate: '', feedback: '' });
      setFormVisible(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
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

            <button className="submit-btn" onClick={handleAddFeedback} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}
        <div className="feedback-entries">
          <h3>Submitted Feedback</h3>
          {error && (
            <div className="error-message" style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '10px', 
              borderRadius: '4px', 
              margin: '10px 0',
              border: '1px solid #ffcdd2'
            }}>
              <strong>Error:</strong> {error}
              <br />
              <small>Please check if the backend server is running on port 4001</small>
            </div>
          )}
          {loading && !formVisible && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading feedback...</p>
            </div>
          )}
          {!loading && entries.length === 0 && !error && (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No feedback submitted yet.
            </p>
          )}
          {!loading && entries.length > 0 && (
            entries.map((entry, index) => (
              <div key={entry._id || index} className="feedback-entry">
                <p><strong>Name:</strong> {entry.name}</p>
                <p><strong>Graduation:</strong> {Array.isArray(entry.graduation) ? entry.graduation.join(', ') : String(entry.graduation)}</p>
                <p><strong>Interview Date:</strong> {new Date(entry.interviewDate).toLocaleDateString()}</p>
                <p><strong>Feedback:</strong> {entry.feedback}</p>
                <hr />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
export default AnalysisPage;