import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket'; 
import '../styles/home.css';

const ChildHomePage = () => {
  const [userInfo, setUserInfo] = useState({ identity: '', role: '' });
  const [feelingText, setFeelingText] = useState('');
  const [postedFeelings, setPostedFeelings] = useState([]);
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  // Set user info from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') || 'guest';
    let identity = 'Anonymous';

    if (storedRole === 'child') {
      identity = localStorage.getItem('identity') || 'UnknownID';
    } else if (storedRole === 'parent') {
      identity = localStorage.getItem('name') || 'Parent';
    }

    setUserInfo({ identity, role: storedRole });
  }, []);

  // Receive feelings from other users
  useEffect(() => {
    socket.on('newFeeling', (feeling) => {
      setPostedFeelings((prev) => [feeling, ...prev]);
    });

    return () => {
      socket.off('newFeeling');
    };
  }, []);

  const handlePostFeeling = () => {
    if (feelingText.trim()) {
      const newFeeling = {
        text: feelingText,
        liked: false,
        author: userInfo.identity,
        role: userInfo.role,
        likesCount: 0,
        timestamp: new Date().toISOString(),
        comments: []
      };

      // Emit to server
      socket.emit('postFeeling', newFeeling);

      // Locally update for immediate feedback
      setPostedFeelings([newFeeling, ...postedFeelings]);
      setFeelingText('');
    }
  };

  const toggleHeart = (index) => {
    setPostedFeelings(prev =>
      prev.map((feeling, i) =>
        i === index
          ? {
              ...feeling,
              liked: !feeling.liked,
              likesCount: feeling.liked ? feeling.likesCount - 1 : feeling.likesCount + 1
            }
          : feeling
      )
    );
  };

  const toggleCommentBox = (index) => {
    setActiveCommentIndex(prev => (prev === index ? null : index));
  };

  const handleCommentChange = (index, text) => {
    setCommentInputs({ ...commentInputs, [index]: text });
  };

  const handleAddComment = (index) => {
    const commentText = commentInputs[index]?.trim();
    if (!commentText) return;

    const newComment = {
      text: commentText,
      author: userInfo.identity,
      timestamp: new Date().toISOString()
    };

    setPostedFeelings(prev =>
      prev.map((feeling, i) =>
        i === index
          ? { ...feeling, comments: [...(feeling.comments || []), newComment] }
          : feeling
      )
    );

    setCommentInputs({ ...commentInputs, [index]: '' });
  };

  const getAuthorLabel = (feeling) => feeling.author;

  return (
    <div className="cont">
      <div className="child-home">
        <nav className="navbar">
          <ul className="nav-links">
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/request">Friend Request</Link></li>
            <li><Link to="/analysis">Analysis</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </nav>

        <div className="posted-feelings">
          {postedFeelings.map((feeling, index) => (
            <div key={feeling.timestamp} className="posted-feeling">
              <h3>{getAuthorLabel(feeling)}</h3>
              <p>{feeling.text}</p>
              <div className="interaction-buttons">
                <button
                  className={`heart-btn ${feeling.liked ? 'liked' : ''}`}
                  onClick={() => toggleHeart(index)}
                >
                  {feeling.liked ? '❤️' : '🤍'} Like ({feeling.likesCount})
                </button>
                <button className="comment-btn" onClick={() => toggleCommentBox(index)}>
                  💬 Comment
                </button>
                <button className="share-btn">🔗 Share</button>
                <button className="friend-btn">👫 Request Friend</button>
              </div>

              {activeCommentIndex === index && (
                <>
                  <div className="comment-section">
                    <textarea
                      placeholder="Write your comment..."
                      value={commentInputs[index] || ''}
                      onChange={(e) => handleCommentChange(index, e.target.value)}
                      style={{ width: '100%', height: '50px', marginTop: '10px' }}
                    />
                    <button onClick={() => handleAddComment(index)}>Post Comment</button>
                  </div>

                  {feeling.comments && feeling.comments.length > 0 && (
                    <div className="comments-list">
                      <h4>Comments:</h4>
                      {feeling.comments.map((comment, cIndex) => (
                        <div key={comment.timestamp + cIndex} className="comment">
                          <strong>{comment.author}</strong>: {comment.text}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="inpDiv">
          <div className="feeling-input">
            <p><strong>Posting as:</strong> {userInfo.identity}</p>
            <textarea
              placeholder="Write your feeling here..."
              value={feelingText}
              onChange={(e) => setFeelingText(e.target.value)}
              style={{ height: '60px', padding: '10px' }}
            />
            <button
              onClick={handlePostFeeling}
              disabled={!feelingText.trim()}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildHomePage;
