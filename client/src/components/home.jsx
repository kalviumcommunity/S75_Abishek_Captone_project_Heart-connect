import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import socket from '../utils/socket';
import { feelingsAPI } from '../utils/api';
import '../styles/home.css';

const ChildHomePage = () => {
  const [userInfo, setUserInfo] = useState({ identity: '', role: '', userId: '' });
  const [feelingText, setFeelingText] = useState('');
  const [postedFeelings, setPostedFeelings] = useState([]);
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Set user info from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') || 'guest';
    let identity = 'Anonymous';
    let userId = '';

    if (storedRole === 'child') {
      identity = localStorage.getItem('identity') || 'UnknownID';
      userId = localStorage.getItem('identity') || 'UnknownID';
    } else if (storedRole === 'parent') {
      identity = localStorage.getItem('name') || 'Parent';
      userId = localStorage.getItem('phone') || 'Parent';
    }

    setUserInfo({ identity, role: storedRole, userId });
  }, []);

  // Load existing feelings on mount
  useEffect(() => {
    const loadFeelings = async () => {
      try {
        setLoading(true);
        const response = await feelingsAPI.getAllFeelings();
        if (response.data?.success && response.data?.data) {
          setPostedFeelings(response.data.data);
        }
      } catch (err) {
        console.error('Error loading feelings:', err);
        setError('Failed to load feelings');
      } finally {
        setLoading(false);
      }
    };

    loadFeelings();
  }, []);

  // Socket event listeners
  useEffect(() => {
    // Connection status listeners
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    // Listen for new feelings from other users
    socket.on('receiveFeeling', (feeling) => {
      console.log('Received new feeling:', feeling);
      setPostedFeelings((prev) => {
        // Check if feeling already exists to avoid duplicates
        const exists = prev.some(f => f._id === feeling._id);
        if (!exists) {
          return [feeling, ...prev];
        }
        return prev;
      });
    });

    // Listen for like updates
    socket.on('likeUpdated', (data) => {
      console.log('Like updated:', data);
      setPostedFeelings(prev =>
        prev.map(feeling =>
          feeling._id === data.feelingId
            ? {
                ...feeling,
                likesCount: data.likesCount,
                isLikedByUser: data.wasLiked && data.userId === userInfo.userId
              }
            : feeling
        )
      );
    });

    // Listen for new comments
    socket.on('commentAdded', (data) => {
      console.log('Comment added:', data);
      setPostedFeelings(prev =>
        prev.map(feeling =>
          feeling._id === data.feelingId
            ? {
                ...feeling,
                comments: [...(feeling.comments || []), data.comment]
              }
            : feeling
        )
      );
    });

    // Listen for errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receiveFeeling');
      socket.off('likeUpdated');
      socket.off('commentAdded');
      socket.off('error');
    };
  }, [userInfo.userId]);

  const handlePostFeeling = async () => {
    if (!feelingText.trim()) return;

    try {
      setLoading(true);
      setError('');

      const feelingData = {
        text: feelingText,
        author: userInfo.identity,
        authorRole: userInfo.role
      };

      // Emit to server via socket for real-time broadcasting
      socket.emit('newFeeling', feelingData);

      // Also save to database via API
      const response = await feelingsAPI.createFeeling(feelingData);
      
      if (response.data?.success) {
        setFeelingText('');
        console.log('Feeling posted successfully');
      }
    } catch (err) {
      console.error('Error posting feeling:', err);
      setError('Failed to post feeling');
    } finally {
      setLoading(false);
    }
  };

  const toggleHeart = async (feelingId) => {
    try {
      const feeling = postedFeelings.find(f => f._id === feelingId);
      if (!feeling) return;

      // Emit to server via socket for real-time updates
      socket.emit('toggleLike', {
        feelingId,
        userId: userInfo.userId,
        userRole: userInfo.role
      });

      // Also update via API
      await feelingsAPI.toggleLike(feelingId, {
        userId: userInfo.userId,
        userRole: userInfo.role
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like');
    }
  };

  const toggleCommentBox = (index) => {
    setActiveCommentIndex(prev => (prev === index ? null : index));
  };

  const handleCommentChange = (index, text) => {
    setCommentInputs({ ...commentInputs, [index]: text });
  };

  const handleAddComment = async (feelingId, index) => {
    const commentText = commentInputs[index]?.trim();
    if (!commentText) return;

    try {
      const commentData = {
        text: commentText,
        author: userInfo.identity,
        authorRole: userInfo.role
      };

      // Emit to server via socket for real-time broadcasting
      socket.emit('newComment', {
        feelingId,
        ...commentData
      });

      // Also save to database via API
      await feelingsAPI.addComment(feelingId, commentData);

      setCommentInputs({ ...commentInputs, [index]: '' });
      setActiveCommentIndex(null);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const getAuthorLabel = (feeling) => feeling.author;
  const isLikedByUser = (feeling) => {
    if (feeling.likes && Array.isArray(feeling.likes)) {
      return feeling.likes.some(like => like.userId === userInfo.userId);
    }
    return false;
  };

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

        {/* Real-time Connection Indicator */}
        {isConnected && (
          <div className="realtime-indicator">
            🔴 Live
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message" style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            margin: '10px',
            border: '1px solid #ffcdd2'
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError('')}
              style={{ float: 'right', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading feelings...</p>
          </div>
        )}

        {/* Feelings Feed */}
        <div className="posted-feelings">
          {postedFeelings.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>No feelings posted yet</h3>
              <p>Be the first to share your feelings!</p>
            </div>
          ) : (
            postedFeelings.map((feeling, index) => (
              <div key={feeling._id || feeling.timestamp} className="posted-feeling">
                <div className="feeling-header">
                  <h3>{getAuthorLabel(feeling)}</h3>
                  <span className="feeling-role">({feeling.authorRole})</span>
                  <span className="feeling-time">
                    {new Date(feeling.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="feeling-text">{feeling.text}</p>
                
                <div className="interaction-buttons">
                  <button
                    className={`heart-btn ${isLikedByUser(feeling) ? 'liked' : ''}`}
                    onClick={() => toggleHeart(feeling._id)}
                  >
                    {isLikedByUser(feeling) ? '❤️' : '🤍'} Like ({feeling.likesCount || 0})
                  </button>
                  <button 
                    className="comment-btn" 
                    onClick={() => toggleCommentBox(index)}
                  >
                    💬 Comment ({feeling.comments?.length || 0})
                  </button>
                  <button className="share-btn">🔗 Share</button>
                  <button className="friend-btn">👫 Request Friend</button>
                </div>

                {/* Comments Section */}
                {activeCommentIndex === index && (
                  <div className="comment-section">
                    <div className="comment-input">
                      <textarea
                        placeholder="Write your comment..."
                        value={commentInputs[index] || ''}
                        onChange={(e) => handleCommentChange(index, e.target.value)}
                        style={{ 
                          width: '100%', 
                          height: '60px', 
                          marginTop: '10px',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <button 
                          onClick={() => handleAddComment(feeling._id, index)}
                          style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '8px'
                          }}
                        >
                          Post Comment
                        </button>
                        <button 
                          onClick={() => setActiveCommentIndex(null)}
                          style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Existing Comments */}
                    {feeling.comments && feeling.comments.length > 0 && (
                      <div className="comments-list">
                        <h4>Comments ({feeling.comments.length}):</h4>
                        {feeling.comments.map((comment, cIndex) => (
                          <div key={comment.timestamp + cIndex} className="comment">
                            <div className="comment-header">
                              <strong>{comment.author}</strong>
                              <span className="comment-role">({comment.authorRole})</span>
                              <span className="comment-time">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Post New Feeling */}
        <div className="inpDiv">
          <div className="feeling-input">
            <p><strong>Posting as:</strong> {userInfo.identity} ({userInfo.role})</p>
            <textarea
              placeholder="Write your feeling here..."
              value={feelingText}
              onChange={(e) => setFeelingText(e.target.value)}
              style={{ 
                height: '80px', 
                padding: '12px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ddd',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handlePostFeeling}
              disabled={!feelingText.trim() || loading}
              style={{
                background: feelingText.trim() ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: feelingText.trim() ? 'pointer' : 'not-allowed',
                marginTop: '8px'
              }}
            >
              {loading ? 'Posting...' : 'Post Feeling'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildHomePage;