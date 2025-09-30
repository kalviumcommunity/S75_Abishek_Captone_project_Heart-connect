import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import socket from '../utils/socket';
import { feelingsAPI } from '../utils/api';
import '../styles/home.css';
import FeelingComponent from './FeelingComponent';

const ChildHomePage = () => {
  const [userInfo, setUserInfo] = useState({ identity: '', role: '', userId: '' });
  const [feelingText, setFeelingText] = useState('');
  const [postedFeelings, setPostedFeelings] = useState([]);
  const [commentBoxes, setCommentBoxes] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set user info from sessionStorage to maintain separate logins in different tabs
  useEffect(() => {
    // First try to get from sessionStorage (tab-specific)
    let storedRole = sessionStorage.getItem('userRole');
    let identity = sessionStorage.getItem('identity');
    let userId = sessionStorage.getItem('userId');
    
    // If not found in sessionStorage, try localStorage and save to sessionStorage
    if (!storedRole || !identity) {
      storedRole = localStorage.getItem('userRole') || 'guest';
      
      if (storedRole === 'child') {
        identity = localStorage.getItem('identity') || 'UnknownID';
        userId = localStorage.getItem('identity') || 'UnknownID';
      } else if (storedRole === 'parent') {
        identity = localStorage.getItem('name') || 'Parent';
        userId = localStorage.getItem('phone') || 'Parent';
      } else {
        identity = 'Anonymous';
        userId = '';
      }
      
      // Save to sessionStorage for this tab
      sessionStorage.setItem('userRole', storedRole);
      sessionStorage.setItem('identity', identity);
      sessionStorage.setItem('userId', userId);
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
      setError('');
      const feeling = postedFeelings.find(f => f._id === feelingId);
      if (!feeling) return;
      
      // Check if the user is the author of the feeling
      if (feeling.author === userInfo.identity) {
        setError("You cannot like your own post");
        return;
      }

      // Optimistically update UI for better user experience
      const currentLikeStatus = isLikedByUser(feeling);
      const newLikesCount = currentLikeStatus ? (feeling.likesCount - 1) : ((feeling.likesCount || 0) + 1);
      
      setPostedFeelings(prev =>
        prev.map(f =>
          f._id === feelingId
            ? {
                ...f,
                isLikedByUser: !currentLikeStatus,
                likesCount: newLikesCount
              }
            : f
        )
      );

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
      
      // Revert optimistic update if there's an error
      const feeling = postedFeelings.find(f => f._id === feelingId);
      if (feeling) {
        const response = await feelingsAPI.getFeeling(feelingId);
        if (response.data?.success) {
          setPostedFeelings(prev =>
            prev.map(f =>
              f._id === feelingId ? response.data.data : f
            )
          );
        }
      }
    }
  };

  const toggleCommentBox = (index) => {
    // Check if the user is the author of the feeling
    const feeling = postedFeelings[index];
    if (feeling && feeling.author === userInfo.identity) {
      setError("You cannot comment on your own post");
      return;
    }
    
    setActiveCommentIndex(prev => (prev === index ? null : index));
  };
  
  // Function to view comments on your own post
  const viewOwnPostComments = (index) => {
    setCommentBoxes(prev => {
      const newCommentBoxes = [...prev];
      newCommentBoxes[index] = !newCommentBoxes[index];
      return newCommentBoxes;
    });
  };
  
  // This section was removed to fix duplicate declaration

  const handleCommentChange = (index, text) => {
    setCommentInputs({ ...commentInputs, [index]: text });
  };

  const handleAddComment = async (feelingId, index) => {
    const commentText = commentInputs[index]?.trim();
    if (!commentText) return;
    
    // Double-check that user is not commenting on their own post
    const feeling = postedFeelings.find(f => f._id === feelingId);
    if (feeling && feeling.author === userInfo.identity) {
      setError("You cannot comment on your own post");
      return;
    }

    try {
      setLoading(true);
      setError('');
      
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

      // Clear input and close comment box
      setCommentInputs({ ...commentInputs, [index]: '' });
      
      // Keep comment box open to show the new comment immediately
      // Only close if there's an error
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
      setActiveCommentIndex(null);
    } finally {
      setLoading(false);
    }
  };

  const getAuthorLabel = (feeling) => feeling.author;
  const isLikedByUser = (feeling) => {
    // Check if the feeling has the isLikedByUser property set by the socket update
    if (feeling.isLikedByUser !== undefined) {
      return feeling.isLikedByUser;
    }
    
    // Otherwise check the likes array
    if (feeling.likes && Array.isArray(feeling.likes)) {
      return feeling.likes.some(like => like.userId === userInfo.userId);
    }
    return false;
  };
  
  // Function to show who liked a post
  const showLikes = async (feelingId) => {
    try {
      setLoading(true);
      const response = await feelingsAPI.getFeeling(feelingId);
      if (response.data?.success) {
        const feeling = response.data.data;
        if (feeling.likes && Array.isArray(feeling.likes)) {
          setCurrentLikes(feeling.likes);
          setShowLikesModal(true);
        }
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
      setError('Failed to fetch likes');
    } finally {
      setLoading(false);
    }
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
        <div className="posted-feelings" style={{ marginTop: '20px', padding: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading feelings...</p>
            </div>
          ) : postedFeelings && postedFeelings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3>No feelings posted yet</h3>
              <p>Be the first to share your feelings!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {postedFeelings && postedFeelings.map((feeling, index) => (
                <FeelingComponent
                  key={feeling._id || index}
                  feeling={feeling}
                  index={index}
                  userInfo={userInfo}
                  toggleHeart={toggleHeart}
                  isLikedByUser={isLikedByUser}
                  commentBoxes={commentBoxes}
                  toggleCommentBox={toggleCommentBox}
                  viewOwnPostComments={viewOwnPostComments}
                  commentInputs={commentInputs}
                  handleCommentChange={handleCommentChange}
                  handleAddComment={handleAddComment}
                />
              ))}
            </div>
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

      {/* Likes Modal moved to FeelingComponent.jsx */}
    </div>
  );
};

export default ChildHomePage;